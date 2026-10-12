import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ErrorBox, Switch } from '../components/Bits'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import type { Style } from '../lib/types'

export default function Settings() {
  const { settings, setSettings, languages, user, setUser, logout, caps, toast } = useStore()
  const nav = useNavigate()
  const [name, setName] = useState(user?.name ?? '')
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const saveName = async () => {
    try { const r = await api<{ user: NonNullable<typeof user> }>('/auth/me', { method: 'PATCH', body: { name: name.trim() } }); setUser(r.user); toast('Name updated'); setError(null) }
    catch (e) { setError((e as Error).message) }
  }
  const clearHistory = async () => {
    try { const r = await api<{ deleted: number }>('/history', { method: 'DELETE' }); toast(r.deleted ? `Deleted ${r.deleted} translations` : 'History is already empty') }
    catch (e) { setError((e as Error).message) }
  }
  const deleteAccount = async () => {
    try { await api('/auth/me', { method: 'DELETE' }); logout(); toast('Account deleted'); nav('/') }
    catch (e) { setError((e as Error).message) }
  }

  return (
    <div>
      <div className="page-head"><h1>Settings</h1><p>Defaults for the translator, and control over your data.</p></div>
      {error && <div style={{ marginBottom: 14 }}><ErrorBox message={error} /></div>}
      <div className="settings">
        <section className="panel card">
          <h3>Account</h3>
          {user ? (
            <div className="stack">
              <div className="row"><div style={{ flex: 1, minWidth: 200 }}><label className="field-label" htmlFor="nm">Name</label><input id="nm" className="input" value={name} onChange={(e) => setName(e.target.value)} /></div>
                <button className="btn ghost sm" style={{ alignSelf: 'flex-end', height: 42 }} disabled={!name.trim() || name.trim() === user.name} onClick={saveName}>Save name</button></div>
              <p className="muted">{user.email}</p>
              <div className="row"><button className="btn ghost sm" onClick={() => { logout(); toast('Logged out'); nav('/') }}>Log out</button>
                {confirmDelete ? <><button className="btn danger sm" onClick={deleteAccount}>Yes, delete account and history</button><button className="btn ghost sm" onClick={() => setConfirmDelete(false)}>Cancel</button></>
                  : <button className="btn danger sm" onClick={() => setConfirmDelete(true)}>Delete account</button>}</div>
            </div>
          ) : <p>You are using LEXIA without an account. History stays in this browser. <Link className="link" to="/login">Log in</Link> or <Link className="link" to="/signup">sign up</Link> to keep it across devices.</p>}
        </section>

        <section className="panel card">
          <h3>Translator defaults</h3>
          <div className="setting"><div><b style={{ fontWeight: 500 }}>Source language</b><p>Automatic detection is recommended.</p></div>
            <select className="select" aria-label="Default source language" value={settings.sourceLang} onChange={(e) => setSettings({ sourceLang: e.target.value })}>
              <option value="auto">Detect automatically</option>{languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</select></div>
          <div className="setting"><div><b style={{ fontWeight: 500 }}>Target language</b></div>
            <select className="select" aria-label="Default target language" value={settings.targetLang} onChange={(e) => setSettings({ targetLang: e.target.value })}>
              {languages.map((l) => <option key={l.code} value={l.code}>{l.name}</option>)}</select></div>
          <div className="setting"><div><b style={{ fontWeight: 500 }}>Style</b><p>How the translation should read.</p></div>
            <select className="select" aria-label="Default style" value={settings.style} onChange={(e) => setSettings({ style: e.target.value as Style })}>
              <option value="natural">Natural</option>{caps?.styles.formal && <option value="formal">Formal</option>}<option value="literal">Literal</option></select></div>
          <div className="setting"><div><b style={{ fontWeight: 500 }}>Detect while typing</b><p>Runs language detection shortly after you stop typing.</p></div>
            <Switch label="Detect while typing" checked={settings.liveDetect} onChange={(v) => setSettings({ liveDetect: v })} /></div>
        </section>

        <section className="panel card">
          <h3>History and privacy</h3>
          <div className="setting"><div><b style={{ fontWeight: 500 }}>Save translations to history</b><p>When off, new translations are shown but not stored.</p></div>
            <Switch label="Save translations to history" checked={settings.saveHistory} onChange={(v) => setSettings({ saveHistory: v })} /></div>
          <div className="setting"><div><b style={{ fontWeight: 500 }}>Clear history</b><p>Permanently deletes every saved translation.</p></div>
            <button className="btn danger sm" onClick={clearHistory}>Clear history</button></div>
        </section>

        <section className="panel card">
          <h3>Translation engine</h3>
          <table className="kv"><tbody>
            <tr><th>Languages</th><td>{caps?.languages ?? '—'}</td></tr>
            <tr><th>Translation</th><td>Google Translate{caps?.llm ? ' with Claude for styles' : ''}</td></tr>
            <tr><th>Detection</th><td>Lingua statistical model with Unicode script analysis</td></tr>
            <tr><th>Meaning and context</th><td>{caps?.llm ? 'Written notes by Claude, plus back-translation' : 'Back-translation and word-by-word glosses'}</td></tr>
            <tr><th>Text limit</th><td>{caps?.max_chars ?? 5000} characters</td></tr>
          </tbody></table>
        </section>
      </div>
    </div>
  )
}
