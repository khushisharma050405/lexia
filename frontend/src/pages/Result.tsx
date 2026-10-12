import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { CopyButton, ErrorBox, Loading, pct } from '../components/Bits'
import Icon from '../components/Icon'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import type { Style, TranslationResult } from '../lib/types'

const STYLES: Style[] = ['natural', 'formal', 'literal']

export default function Result() {
  const { id } = useParams()
  const loc = useLocation()
  const nav = useNavigate()
  const { caps, settings } = useStore()
  const passed = (loc.state as { result?: TranslationResult } | null)?.result
  const [r, setR] = useState<TranslationResult | null>(passed && passed.id === id ? passed : null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (r?.id === id) return
    let live = true
    setError(null)
    api<TranslationResult>(`/history/${id}`).then((x) => live && setR(x)).catch((e) => live && setError(e.message))
    return () => { live = false }
  }, [id, r?.id])

  const restyle = async (style: Style) => {
    if (!r) return
    setBusy(true); setError(null)
    try {
      const next = await api<TranslationResult>('/translate', {
        body: { text: r.source_text, source: r.source.code, target: r.target.code, style, save: settings.saveHistory },
      })
      setR(next)
      nav(`/result/${next.id}`, { replace: true, state: { result: next } })
    } catch (e) { setError((e as Error).message) } finally { setBusy(false) }
  }

  if (error && !r) return (
    <div className="stack"><ErrorBox message={error} /><Link to="/translate" className="btn ghost" style={{ justifySelf: 'start' }}>Back to translator</Link></div>
  )
  if (!r) return <Loading label="Loading translation" />

  const c = r.context
  return (
    <div>
      <Link to="/translate" className="row muted" style={{ textDecoration: 'none', marginBottom: 14 }}><Icon name="back" size={18} /> Back to translator</Link>
      <div className="page-head">
        <h1>Translation result</h1>
        <p>{r.source.name} → {r.target.name}{r.source.detected && r.source.confidence != null ? ` · detected at ${pct(r.source.confidence)} confidence` : ' · language chosen manually'}</p>
      </div>
      {error && <div style={{ marginBottom: 14 }}><ErrorBox message={error} /></div>}

      <div className="seg" role="group" aria-label="Translation style" style={{ marginBottom: 14 }}>
        {STYLES.filter((s) => (caps ? caps.styles[s] : s !== 'formal')).map((s) => (
          <button
            key={s}
            type="button"
            className={r.style === s ? 'on' : ''}
            disabled={busy}
            aria-pressed={r.style === s}
            onClick={() => {
              if (r.style !== s) restyle(s)
            }}
          >
            {s[0].toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="result-pair">
        <div className="panel">
          <div className="head"><span>{r.source.name} · original</span><CopyButton text={r.source_text} label="Copy original" /></div>
          <p className="big" dir={r.source.rtl ? 'rtl' : 'ltr'} lang={r.source.code}>{r.source_text}</p>
        </div>
        <div className="panel" style={{ background: 'var(--surface)' }}>
          <div className="head"><span>{r.target.name} · {r.style}</span><CopyButton text={r.translation} label="Copy translation" /></div>
          {busy ? <div className="skeleton"><i /><i /><i /></div> : <p className="big" dir={r.target.rtl ? 'rtl' : 'ltr'} lang={r.target.code}>{r.translation}</p>}
        </div>
      </div>

      <div className="row" style={{ marginTop: 16 }}>
        <button className="btn sage sm" onClick={() => nav('/translate', { state: { text: r.translation, source: r.target.code, target: r.source.code } })}>Translate it back</button>
        <button className="btn ghost sm" onClick={() => nav('/translate', { state: { text: r.source_text, source: r.source.code, target: r.target.code } })}>Edit and translate again</button>
      </div>

      <div className="result-grid">
        <div className="panel card">
          <h3>Meaning and context</h3>
          {c.kind === 'claude' ? (
            <div className="stack">
              {c.meaning && <p>{c.meaning}</p>}
              <table className="kv"><tbody>
                {c.register && <tr><th>Register</th><td>{c.register}</td></tr>}
                {c.usage && <tr><th>Usage</th><td>{c.usage}</td></tr>}
                {c.cultural_note && <tr><th>Cultural note</th><td>{c.cultural_note}</td></tr>}
              </tbody></table>
              {!!c.alternatives?.length && <div><span className="field-label">Other natural translations</span>{c.alternatives.map((a) => <p className="quote" key={a} dir={r.target.rtl ? 'rtl' : 'ltr'}>{a}</p>)}</div>}
              {c.back_translation && <div><span className="field-label">Translated back into {r.source.name}</span><p className="quote" dir={r.source.rtl ? 'rtl' : 'ltr'}>{c.back_translation}</p></div>}
            </div>
          ) : (
            <div className="stack">
              {c.back_translation ? <div><span className="field-label">Translated back into {r.source.name}, as a check on meaning</span>
                <p className="quote" dir={r.source.rtl ? 'rtl' : 'ltr'}>{c.back_translation}</p></div>
                : <p className="muted">A back-translation check was not available for this language pair.</p>}
              {!!c.glosses?.length && <div><span className="field-label">Word by word</span>
                <div className="gloss">{c.glosses.map((g, i) => <span key={i}><small>{g.source}</small>{g.gloss ?? '—'}</span>)}</div></div>}
              {!caps?.llm && <div className="alert info"><span>Written notes on tone, usage and culture appear here when an Anthropic API key is added to the backend (see README).</span></div>}
            </div>
          )}
        </div>

        <div className="panel card">
          <h3>Language profile</h3>
          <table className="kv"><tbody>
            <tr><th>Language</th><td>{r.source.name} <span className="muted">· {r.source.native}</span></td></tr>
            <tr><th>Language family</th><td>{r.profile.family}</td></tr>
            <tr><th>Script</th><td>{r.profile.script}</td></tr>
            <tr><th>Writing system</th><td>{r.profile.writing_system}</td></tr>
            <tr><th>Characters</th><td>{r.profile.characters}</td></tr>
            <tr><th>Direction</th><td>{r.profile.direction}</td></tr>
            {r.source.confidence != null && <tr><th>Confidence</th><td>{pct(r.source.confidence)}</td></tr>}
            <tr><th>Source</th><td>{r.profile.method === 'script' ? 'Script analysis' : r.profile.method === 'statistical model' ? 'Statistical model (Lingua)' : 'Chosen manually'}</td></tr>
            <tr><th>Your text</th><td>{r.profile.stats.words} words · {r.profile.stats.characters} characters</td></tr>
          </tbody></table>
        </div>
      </div>
      <p className="muted" style={{ marginTop: 18, fontSize: 13 }}>Translated with {r.provider.replace('+', ' + ').replace(/^google/, 'Google Translate').replace(/claude/, 'Claude')} · {new Date(r.created_at).toLocaleString()}{r.saved ? ' · saved to history' : ''}</p>
    </div>
  )
}
