import { Link, NavLink, Outlet } from 'react-router-dom'
import { useStore } from '../lib/store'
import Icon from './Icon'
import { Loading, ErrorBox } from './Bits'

const NAV = [
  { to: '/translate', label: 'Translate', icon: 'translate' },
  { to: '/recognize', label: 'Recognize', icon: 'recognize' },
  { to: '/history', label: 'History', icon: 'history' },
  { to: '/explore', label: 'Explore', icon: 'explore' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export function Logo() {
  return <Link to="/" className="logo" aria-label="LEXIA home">LEXIA</Link>
}

export function AppLayout() {
  const { user, booting, bootError, retryBoot, toastMsg } = useStore()
  return (
    <div className="app">
      <aside className="sidebar">
        <Logo />
        <nav aria-label="Main">
          {NAV.slice(0, 4).map((n) => (
            <NavLink key={n.to} to={n.to} className="navlink"><Icon name={n.icon} />{n.label}</NavLink>
          ))}
        </nav>
        <div className="spacer" />
        <NavLink to="/settings" className="navlink"><Icon name="settings" />Settings</NavLink>
        {user ? (
          <Link to="/settings" className="account">
            <span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span>
            <span><b style={{ fontWeight: 500 }}>{user.name}</b><small>{user.email}</small></span>
          </Link>
        ) : (
          <Link to="/login" className="account"><span className="avatar"><Icon name="user" size={16} /></span><span>Log in or sign up<small>Keep history across devices</small></span></Link>
        )}
      </aside>
      <div>
        <header className="mobilebar"><Logo /><Link to={user ? '/settings' : '/login'} className="icon-btn" aria-label="Account"><Icon name="user" /></Link></header>
        <main className="main">
          {booting ? <Loading label="Starting LEXIA" /> : bootError ? (
            <div className="stack"><ErrorBox message={bootError} onRetry={retryBoot} /></div>
          ) : <Outlet />}
        </main>
      </div>
      <nav className="tabbar" aria-label="Main">
        {NAV.map((n) => <NavLink key={n.to} to={n.to}><Icon name={n.icon} size={22} />{n.label}</NavLink>)}
      </nav>
      {toastMsg && <div className="toast" role="status">{toastMsg}</div>}
    </div>
  )
}

export function SiteNav() {
  const { user } = useStore()
  return (
    <header className="sitenav">
      <Logo />
      <nav aria-label="Main">
        <NavLink to={user ? "/translate" : "/login?next=/translate"}>Translate</NavLink>
        <NavLink to={user ? "/recognize" : "/login?next=/recognize"}>Recognize</NavLink>
        <NavLink to={user ? "/history" : "/login?next=/history"}>History</NavLink>
        <NavLink to={user ? "/explore" : "/login?next=/explore"}>Explore</NavLink>
      </nav>
      <div className="right">
        {user ? <Link to="/settings" className="icon-btn" aria-label="Account"><span className="avatar">{user.name.slice(0, 1).toUpperCase()}</span></Link>
          : <><Link to="/login" className="btn ghost sm">Log in</Link><Link to="/login?next=/translate" className="btn primary sm">Translate</Link></>}
      </div>
    </header>
  )
}
