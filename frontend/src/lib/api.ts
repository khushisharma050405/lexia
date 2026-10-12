export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.status = status
  }
}

const GUEST_KEY = 'lexia.guest'
const TOKEN_KEY = 'lexia.token'

export function guestId(): string {
  let id = localStorage.getItem(GUEST_KEY)
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`).replace(/[^A-Za-z0-9-]/g, '')
    localStorage.setItem(GUEST_KEY, id)
  }
  return id
}
export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t: string | null) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

function readableDetail(detail: unknown): string {
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail) && detail.length) {
    const first = detail[0] as { msg?: string; loc?: string[] }
    const msg = (first.msg ?? 'Invalid input').replace(/^Value error, /, '')
    const field = first.loc?.[first.loc.length - 1]
    if (field === 'email') return 'Enter a valid email address.'
    if (field === 'password') return 'Password must be at least 8 characters.'
    return msg
  }
  return 'Something went wrong.'
}

export async function api<T>(path: string, opts: { method?: string; body?: unknown; signal?: AbortSignal } = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-Guest-Id': guestId() }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (opts.body !== undefined) headers['Content-Type'] = 'application/json'
  let res: Response
  try {
    res = await fetch(`/api${path}`, {
      method: opts.method ?? (opts.body !== undefined ? 'POST' : 'GET'),
      headers,
      body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal,
    })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ApiError("Can't reach the LEXIA server. Check that the backend is running on port 8000.", 0)
  }
  if (!res.ok) {
    let detail: unknown = null
    try {
      detail = (await res.json()).detail
    } catch {
      /* non-JSON error body */
    }
    throw new ApiError(detail ? readableDetail(detail) : `Request failed (${res.status}).`, res.status)
  }
  return res.json() as Promise<T>
}
