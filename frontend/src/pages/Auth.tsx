import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { ErrorBox } from '../components/Bits'
import Illustration from '../components/Illustration'
import { Logo } from '../components/Layout'
import { useStore } from '../lib/store'

export default function Auth({ mode }: { mode: 'login' | 'signup' }) {
  const { login, signup, user } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const params = new URLSearchParams(loc.search)
  const next = params.get('next') || '/translate'

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const isSignup = mode === 'signup'
  if (user) return <Navigate to={next} replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setBusy(true); setError(null)
    try {
      if (isSignup) await signup(name.trim(), email.trim(), password)
      else await login(email.trim(), password)
      nav(next, { replace: true })
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }

  return (
    <div className="authwrap">
      <div className="authform">
        <div style={{ marginBottom: 40 }}><Logo /></div>
        <h1>{isSignup ? 'Create your account' : 'Welcome back'}</h1>
        <p className="muted">{isSignup ? 'Keep your translation history across devices. Translations you made in this browser come with you.' : 'Log in to see your saved translations.'}</p>
        <form onSubmit={submit} noValidate>
          {isSignup && <div><label className="field-label" htmlFor="name">Name</label><input id="name" className="input" autoComplete="name" required value={name} onChange={(e) => setName(e.target.value)} /></div>}
          <div><label className="field-label" htmlFor="email">Email</label><input id="email" className="input" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div><label className="field-label" htmlFor="pw">Password{isSignup && ' (at least 8 characters)'}</label>
            <input id="pw" className="input" type="password" autoComplete={isSignup ? 'new-password' : 'current-password'} required minLength={isSignup ? 8 : undefined} value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {error && <ErrorBox message={error} />}
          <button className="btn primary" disabled={busy || !email || !password || (isSignup && !name.trim())}>{busy ? <span className="spin" /> : isSignup ? 'Create account' : 'Log in'}</button>
        </form>
        <p className="muted" style={{ marginTop: 22 }}>
          {isSignup ? (
            <>Already have an account? <Link className="link" to={`/login${next !== '/translate' ? `?next=${encodeURIComponent(next)}` : ''}`}>Log in</Link></>
          ) : (
            <>New to LEXIA? <Link className="link" to={`/signup${next !== '/translate' ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an account</Link></>
          )}
          {' · '}<Link className="link" to={next}>Continue without an account</Link>
        </p>
      </div>
      <div className="authside"><Illustration /></div>
    </div>
  )
}
