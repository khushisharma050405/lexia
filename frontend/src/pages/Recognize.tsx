import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Confidence, CopyButton, EmptyState, ErrorBox, pct } from '../components/Bits'
import { api } from '../lib/api'
import { EXAMPLES } from '../lib/examples'
import { useStore } from '../lib/store'
import type { Detection } from '../lib/types'

export default function Recognize() {
  const { caps } = useStore()
  const nav = useNavigate()
  const incoming = (useLocation().state ?? {}) as { text?: string }
  const [text, setText] = useState(incoming.text ?? '')
  const [analysed, setAnalysed] = useState('')
  const [d, setD] = useState<Detection | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const max = caps?.max_chars ?? 5000
  const ran = useRef(false)

  const detect = useCallback(async (value: string) => {
    if (!value.trim()) { setError('Enter some text to recognize.'); return }
    setLoading(true); setError(null)
    try {
      setD(await api<Detection>('/detect', { body: { text: value.trim() } }))
      setAnalysed(value.trim())
    } catch (e) {
      setD(null); setError((e as Error).message)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!ran.current && incoming.text) { ran.current = true; detect(incoming.text) }
  }, [incoming.text, detect])

  const lang = d?.language
  return (
    <div>
      <div className="page-head">
        <h1>Language recognition</h1>
        <p>We detect the language of your text and show what we know about it: family, script, writing system and how sure we are.</p>
      </div>
      <div className="recognize">
        <div className="stack">
          <div className="panel card">
            <label className="field-label" htmlFor="rec-text">Text to recognize</label>
            <textarea id="rec-text" className="textarea" rows={7} maxLength={max} dir="auto" value={text}
              placeholder="Paste a sentence in any language"
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') detect(text) }} />
            <div className="row" style={{ justifyContent: 'space-between', marginTop: 12 }}>
              <span className="muted" style={{ fontSize: 13 }}>{text.length}/{max}</span>
              <div className="row">
                {text && <button className="btn ghost sm" onClick={() => { setText(''); setD(null); setError(null) }}>Clear</button>}
                <button className="btn primary" disabled={loading || !text.trim()} onClick={() => detect(text)}>
                  {loading ? <><span className="spin" /> Detecting</> : 'Detect language'}
                </button>
              </div>
            </div>
          </div>
          <div>
            <span className="field-label">Try an example</span>
            <div className="examples">
              {EXAMPLES.map((e) => <button key={e.name} className="chip" onClick={() => { setText(e.text); detect(e.text) }}>{e.name}</button>)}
            </div>
          </div>
          {error && <ErrorBox message={error} onRetry={() => detect(text)} />}
        </div>

        <div className="stack" aria-live="polite">
          {!d && !loading && !error && <div className="panel"><EmptyState title="Nothing analysed yet" text="Enter text on the left and choose Detect language. Results appear here." /></div>}
          {loading && !d && <div className="panel"><div className="center-state"><span className="spin" /><p>Reading the text…</p></div></div>}
          {d && lang && (
            <>
              <div className="panel lang-hero">
                <span className="mono lg">{lang.code.slice(0, 2)}</span>
                <div className="grow">
                  <h2>{lang.name}</h2>
                  <span className="muted">{lang.native !== lang.name ? `${lang.native} · ` : ''}{pct(d.confidence)} confidence</span>
                  <Confidence value={d.confidence} band={d.band} />
                </div>
                <span className="glyph" aria-hidden="true">{d.script.glyphs.split(' ')[0]}</span>
              </div>
              {d.band === 'low' && <div className="alert info" role="status"><span>Short or mixed text is hard to call. Check the alternatives below, or choose the language yourself in the translator.</span></div>}
              {d.alternatives.length > 0 && (
                <div><span className="field-label">Also possible</span>
                  <div className="examples" style={{ marginTop: 6 }}>{d.alternatives.map((a) => <span className="chip" key={a.language.code}>{a.language.name} · {pct(a.confidence)}</span>)}</div></div>
              )}
              <div className="panel card">
                <h3>Language profile</h3>
                <table className="kv"><tbody>
                  <tr><th>Language family</th><td>{lang.family}</td></tr>
                  <tr><th>Script</th><td>{d.script.name}</td></tr>
                  <tr><th>Writing system</th><td>{d.script.system}</td></tr>
                  <tr><th>Characters</th><td>{d.script.characters}</td></tr>
                  <tr><th>Direction</th><td>{lang.rtl ? 'Right to left' : 'Left to right'}</td></tr>
                  <tr><th>Detected by</th><td>{d.method === 'script' ? 'Script analysis' : 'Statistical model (Lingua)'}</td></tr>
                  <tr><th>Your text</th><td>{d.stats.words} words · {d.stats.letters} letters · {d.stats.characters} characters</td></tr>
                </tbody></table>
              </div>
              <div className="panel card">
                <div className="row" style={{ justifyContent: 'space-between' }}><h3>Original text</h3><CopyButton text={analysed} label="Copy text" /></div>
                <p className="big" dir={lang.rtl ? 'rtl' : 'ltr'} lang={lang.code} style={{ fontSize: 22 }}>{analysed}</p>
              </div>
              {lang.translatable !== false ? (
                <button className="btn sage" onClick={() => nav('/translate', { state: { text: analysed, source: lang.code } })}>Translate this text</button>
              ) : <div className="alert info"><span>{lang.name} was recognized but is not available as a translation source. <Link to="/explore" className="link">See supported languages</Link></span></div>}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
