import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { api, ApiError, setToken, getToken } from './api'
import type { Capabilities, Lang, Settings, User } from './types'

const SETTINGS_KEY = 'lexia.settings'
const DEFAULTS: Settings = { sourceLang: 'auto', targetLang: 'en', style: 'natural', liveDetect: true, saveHistory: true }

interface Store {
  settings: Settings
  setSettings: (patch: Partial<Settings>) => void
  languages: Lang[]
  byCode: Record<string, Lang>
  caps: Capabilities | null
  bootError: string | null
  booting: boolean
  retryBoot: () => void
  user: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (u: User | null) => void
  toast: (msg: string) => void
  toastMsg: string | null
}

const Ctx = createContext<Store | null>(null)
export const useStore = () => {
  const v = useContext(Ctx)
  if (!v) throw new Error('Store missing')
  return v
}

function loadSettings(): Settings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') }
  } catch {
    return DEFAULTS
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [settings, setSettingsState] = useState<Settings>(loadSettings)
  const [languages, setLanguages] = useState<Lang[]>([])
  const [caps, setCaps] = useState<Capabilities | null>(null)
  const [bootError, setBootError] = useState<string | null>(null)
  const [booting, setBooting] = useState(true)
  const [user, setUser] = useState<User | null>(null)
  const [toastMsg, setToastMsg] = useState<string | null>(null)
  const timer = useRef<number>()

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((s) => {
      const next = { ...s, ...patch }
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const toast = useCallback((msg: string) => {
    setToastMsg(msg)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setToastMsg(null), 2400)
  }, [])

  const boot = useCallback(async () => {
    setBooting(true)
    setBootError(null)
    try {
      const [l, c] = await Promise.all([
        api<{ items: Lang[] }>('/languages'),
        api<Capabilities>('/capabilities'),
      ])
      setLanguages(l.items)
      setCaps(c)
      if (!c.styles.formal && loadSettings().style === 'formal') {
        setSettings({ style: 'natural' })
      }
      if (getToken()) {
        try {
          setUser((await api<{ user: User }>('/auth/me')).user)
        } catch (e) {
          if (e instanceof ApiError && e.status === 401) setToken(null)
        }
      }
    } catch (e) {
      setBootError((e as Error).message)
    } finally {
      setBooting(false)
    }
  }, [])

  useEffect(() => {
    boot()
  }, [boot])

  const startSession = (data: { token: string; user: User }) => {
    setToken(data.token)
    setUser(data.user)
  }
  const login = async (email: string, password: string) =>
    startSession(await api('/auth/login', { body: { email, password } }))
  const signup = async (name: string, email: string, password: string) =>
    startSession(await api('/auth/signup', { body: { name, email, password } }))
  const logout = () => {
    setToken(null)
    setUser(null)
  }

  const byCode = useMemo(() => Object.fromEntries(languages.map((l) => [l.code, l])), [languages])

  const value: Store = {
    settings, setSettings, languages, byCode, caps, bootError, booting, retryBoot: boot,
    user, login, signup, logout, setUser, toast, toastMsg,
  }
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
