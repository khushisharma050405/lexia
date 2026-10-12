import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ErrorBox } from '../components/Bits'
import Icon from '../components/Icon'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import type { Lang, TranslationResult } from '../lib/types'

const GROUPS = ['All', 'Latin', 'Cyrillic', 'Arabic', 'Indic scripts', 'East Asian', 'Southeast Asian', 'Other scripts']

export default function Explore() {
  const { languages } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [group, setGroup] = useState('All')
  const [sel, setSel] = useState<Lang | null>(null)
  const [hello, setHello] = useState<string | null>(null)
  const [helloErr, setHelloErr] = useState<string | null>(null)

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return languages.filter((l) => (group === 'All' || l.group === group) &&
      (!s || [l.name, l.native, l.code, l.family, l.script].some((v) => v.toLowerCase().includes(s))))
  }, [languages, q, group])

  useEffect(() => {
    setHello(null); setHelloErr(null)
    if (!sel || sel.code === 'en') return
    let live = true
    api<TranslationResult>('/translate', { body: { text: 'Hello, how are you?', source: 'en', target: sel.code, save: false } })
      .then((r) => live && setHello(r.translation)).catch((e) => live && setHelloErr(e.message))
    return () => { live = false }
  }, [sel])

  return (
    <div>
      <div className="page-head">
        <h1>Explore languages</h1>
        <p>Discover the {languages.length || 'many'} languages LEXIA supports, with their families, scripts and writing systems.</p>
      </div>
      <div className="toolbar">
        <div className="search"><Icon name="search" size={18} /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, family or script" aria-label="Search languages" /></div>
      </div>
      <div className="examples" style={{ margin: '0 0 18px' }} role="group" aria-label="Filter by script">
        {GROUPS.map((g) => <button key={g} className={`chip ${group === g ? 'on' : ''}`} aria-pressed={group === g} onClick={() => setGroup(g)}>{g}</button>)}
      </div>
      <div className="explore">
        <div>
          <p className="muted" style={{ marginBottom: 8, fontSize: 13 }}>{list.length} {list.length === 1 ? 'language' : 'languages'}</p>
          <div className="list" role="list">
            {list.map((l) => (
              <button key={l.code} role="listitem" className={`lang-row ${sel?.code === l.code ? 'on' : ''}`} onClick={() => setSel(l)}>
                <span className="mono">{l.code.slice(0, 2)}</span>
                <span><b style={{ fontWeight: 500 }}>{l.name}</b><small>{l.native !== l.name ? l.native : l.family}</small></span>
                <span className="right">{l.script}<br />{l.family.split(' · ')[0]}</span>
              </button>
            ))}
            {!list.length && <div className="center-state"><h3>No languages found</h3><p>Try another name, or clear the filter.</p><button className="btn ghost sm" onClick={() => { setQ(''); setGroup('All') }}>Reset search</button></div>}
          </div>
        </div>
        <aside className="panel detail" aria-live="polite">
          {!sel ? <div className="center-state" style={{ padding: '36px 0' }}><Icon name="explore" size={32} /><p>Select a language to see its profile and a live example.</p></div> : (
            <div className="stack">
              <div><h2>{sel.name}</h2><span className="native" lang={sel.code} dir={sel.rtl ? 'rtl' : 'ltr'}>{sel.native}</span></div>
              <table className="kv"><tbody>
                <tr><th>Family</th><td>{sel.family}</td></tr>
                <tr><th>Script</th><td>{sel.script}</td></tr>
                <tr><th>Writing system</th><td>{sel.writing_system}</td></tr>
                <tr><th>Characters</th><td>{sel.characters}</td></tr>
                <tr><th>Direction</th><td>{sel.rtl ? 'Right to left' : 'Left to right'}</td></tr>
              </tbody></table>
              {sel.code !== 'en' && (
                <div><span className="field-label">“Hello, how are you?” in {sel.name}</span>
                  {helloErr ? <ErrorBox message={helloErr} /> : hello ? <p className="quote" lang={sel.code} dir={sel.rtl ? 'rtl' : 'ltr'}>{hello}</p> : <span className="spin" />}</div>
              )}
              <div className="row">
                <button className="btn primary sm" onClick={() => nav('/translate', { state: { target: sel.code } })}>Translate into {sel.name}</button>
                <button className="btn ghost sm" onClick={() => nav('/translate', { state: { source: sel.code } })}>Translate from</button>
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
