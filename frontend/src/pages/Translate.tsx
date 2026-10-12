import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import Icon from '../components/Icon'
import LangPicker from '../components/LangPicker'
import { CopyButton, ErrorBox, pct } from '../components/Bits'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import type { Detection, Style, TranslationResult } from '../lib/types'

const STYLES: { id: Style; label: string }[] = [
  { id: 'natural', label: 'Natural' },
  { id: 'formal', label: 'Formal' },
  { id: 'literal', label: 'Literal' },
]

export default function Translate() {
  const { settings, setSettings, byCode, caps } = useStore()
  const nav = useNavigate()
  const loc = useLocation()
  const incoming = (loc.state ?? {}) as { text?: string; source?: string; target?: string }

  const [text, setText] = useState(incoming.text ?? '')
  const [source, setSource] = useState(incoming.source ?? settings.sourceLang)
  const [target, setTarget] = useState(incoming.target ?? settings.targetLang)
  const [style, setStyle] = useState<Style>(settings.style)
  const [detection, setDetection] = useState<Detection | null>(null)
  const [detecting, setDetecting] = useState(false)
  const [detectErr, setDetectErr] = useState<string | null>(null)
  const [showAlts, setShowAlts] = useState(false)
  const [result, setResult] = useState<TranslationResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const max = caps?.max_chars ?? 5000
  const seq = useRef(0)

  // Sync state if navigation state changes
  useEffect(() => {
    if (incoming.text !== undefined) setText(incoming.text)
    if (incoming.source !== undefined) setSource(incoming.source)
    if (incoming.target !== undefined) setTarget(incoming.target)
    if (incoming.text !== undefined || incoming.source !== undefined || incoming.target !== undefined) {
      setResult(null)
      setError(null)
    }
  }, [loc.state])

  useEffect(() => {
    if (caps && !caps.styles.formal && style === 'formal') {
      setStyle('natural')
      setSettings({ style: 'natural' })
    }
  }, [caps, style, setSettings])

  // Live detection while typing.
  useEffect(() => {
    if (!settings.liveDetect) return
    const t = text.trim()
    if (t.length < 2) { setDetection(null); setDetectErr(null); return }
    const id = ++seq.current
    const ctrl = new AbortController()
    setDetecting(true)
    const h = window.setTimeout(async () => {
      try {
        const d = await api<Detection>('/detect', { body: { text: t }, signal: ctrl.signal })
        if (id === seq.current) { setDetection(d); setDetectErr(null) }
      } catch (e) {
        if ((e as Error).name !== 'AbortError' && id === seq.current) { setDetection(null); setDetectErr((e as Error).message) }
      } finally {
        if (id === seq.current) setDetecting(false)
      }
    }, 550)
    return () => { window.clearTimeout(h); ctrl.abort() }
  }, [text, settings.liveDetect])

  const detectedCode = detection?.language.code
  const sameLang = (source === 'auto' ? detectedCode : source) === target

  const run = useCallback(async (s: Style = style) => {
    if (!text.trim()) {
      setError('Enter some text first.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const r = await api<TranslationResult>('/translate', {
        body: { text: text.trim(), source, target, style: s, save: settings.saveHistory },
      })
      setResult(r)
    } catch (e) {
      setResult(null)
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [text, source, target, style, settings.saveHistory])

  const swap = () => {
    const from = source === 'auto' ? detectedCode : source
    if (!from) { setError('Pick a source language, or type some text so it can be detected, before swapping.'); return }
    const nextText = result?.translation ?? text
    setSource(target)
    setTarget(from)
    setText(nextText)
    setResult(null)
    setError(null)
    setDetection(null)
  }

  const changeSource = (c: string) => {
    if (c !== 'auto' && c === target) {
      const altTarget = (source !== 'auto' && source !== c) ? source : (c === 'en' ? 'es' : 'en')
      setTarget(altTarget)
      setSettings({ targetLang: altTarget })
    }
    setSource(c)
    setSettings({ sourceLang: c })
    setResult(null)
    setDetection(null)
  }

  const changeTarget = (c: string) => {
    if (source !== 'auto' && c === source) {
      const altSource = (target !== c) ? target : (c === 'en' ? 'es' : 'en')
      setSource(altSource)
      setSettings({ sourceLang: altSource })
    }
    setTarget(c)
    setSettings({ targetLang: c })
    setResult(null)
  }

  const changeStyle = (s: Style) => {
    setStyle(s)
    setSettings({ style: s })
    if (text.trim().length > 0 && !sameLang) {
      run(s)
    }
  }
  const clear = () => { setText(''); setResult(null); setError(null); setDetection(null); setDetectErr(null) }

  const tgt = byCode[target]
  const canGo = text.trim().length > 0 && !loading && !sameLang

  return (
    <div>
      <div className="page-head">
        <h1>Translate</h1>
        <p>Type or paste your text. LEXIA detects the language and translates it for you.</p>
      </div>

      <div className="langbar">
        <LangPicker label="Source language" value={source} onChange={changeSource} allowAuto />
        <button className="swap" onClick={swap} aria-label="Swap languages" title="Swap languages"><Icon name="swap" /></button>
        <LangPicker label="Target language" value={target} onChange={changeTarget} />
      </div>

      <div className="editors">
        <div className="panel editor">
          <div className="top"><span>{source === 'auto' ? 'Original text' : `${byCode[source]?.name ?? ''} text`}</span>
            {text && <button className="icon-btn" onClick={clear} aria-label="Clear text" title="Clear"><Icon name="close" size={18} /></button>}</div>
          <textarea value={text} maxLength={max} placeholder="Type or paste text, for example “Bonjour, comment allez-vous ?”"
            aria-label="Text to translate" dir="auto"
            onChange={(e) => { setText(e.target.value); setResult(null); setError(null) }}
            onKeyDown={(e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canGo) run() }} />
          <div className="bottom"><span>Ctrl/⌘ + Enter to translate</span><span>{text.length}/{max}</span></div>
        </div>

        <div className="panel editor" aria-live="polite">
          <div className="top"><span>{tgt ? `${tgt.name} translation` : 'Translation'}</span>
            {result && <CopyButton text={result.translation} label="Copy translation" />}</div>
          {loading ? <div className="skeleton" role="status" aria-label="Translating"><i /><i /><i /></div>
            : result ? <div className="out" dir={result.target.rtl ? 'rtl' : 'ltr'} lang={result.target.code}>{result.translation}</div>
            : <p className="empty-note">Your translation will appear here.</p>}
          <div className="bottom">
            {result ? <Link className="link" to={`/result/${result.id}`} state={{ result }}>Meaning, context and language profile</Link> : <span />}
            {result && <span>{result.provider.startsWith('google') ? 'Google Translate' : 'Claude'}{result.provider.includes('+claude') ? ' + Claude' : ''}</span>}
          </div>
        </div>
      </div>

      {source === 'auto' && (detecting || detection || detectErr || text.trim().length > 1) && (
        <div className="detect-pill">
          {detecting && !detection ? <button disabled><span className="spin" /> Detecting language…</button>
            : detectErr ? <div style={{ padding: 12 }}><span className="muted">{detectErr}</span></div>
            : detection ? (
              <>
                <button onClick={() => setShowAlts((s) => !s)} aria-expanded={showAlts}>
                  <span className={`dot ${detection.band === 'low' ? 'low' : ''}`} />
                  <span><b style={{ fontWeight: 600 }}>{detection.language.name}</b> detected · {pct(detection.confidence)} confidence
                    {detection.band === 'low' && <span className="muted"> · not sure, check the language</span>}</span>
                  <span style={{ marginLeft: 'auto' }}><Icon name="chevron" size={18} /></span>
                </button>
                {showAlts && (
                  <div className="alts">
                    <span className="muted">Not right?</span>
                    {detection.alternatives.map((a) => <button key={a.language.code} className="chip" onClick={() => changeSource(a.language.code)}>{a.language.name} {pct(a.confidence)}</button>)}
                    <button className="chip" onClick={() => changeSource(detection.language.code)}>Lock to {detection.language.name}</button>
                    <Link className="link" to="/recognize" state={{ text }}>Full analysis</Link>
                  </div>
                )}
              </>
            ) : null}
        </div>
      )}

      {source !== 'auto' && detection && detection.language.code !== source && text.trim().length > 3 && (
        <div className="detect-pill" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', flexWrap: 'wrap', gap: 10 }}>
          <span>
            Text appears to be <b>{detection.language.name}</b> ({pct(detection.confidence)} confidence), not {byCode[source]?.name}.
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="chip on" type="button" onClick={() => changeSource(detection.language.code)}>
              Switch to {detection.language.name}
            </button>
            <button className="chip" type="button" onClick={() => changeSource('auto')}>
              Detect automatically
            </button>
          </div>
        </div>
      )}

      {error && <div style={{ marginTop: 14 }}><ErrorBox message={error} onRetry={canGo ? () => run() : undefined} /></div>}
      {sameLang && text.trim() && <p className="muted" style={{ marginTop: 12 }}>The text is already in {tgt?.name}. Choose a different target language.</p>}

      <div className="actions">
        <div className="seg" role="group" aria-label="Translation style">
          {STYLES.filter((s) => (caps ? caps.styles[s.id] : s.id !== 'formal')).map((s) => (
            <button
              key={s.id}
              type="button"
              className={style === s.id ? 'on' : ''}
              aria-pressed={style === s.id}
              title={s.id === 'literal' ? (caps?.style_notes.literal ?? 'Literal rendering') : 'Natural phrasing'}
              onClick={() => changeStyle(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button className="btn primary" disabled={!canGo} onClick={() => run()}>
          {loading ? <><span className="spin" /> Translating</> : <>Translate <Icon name="arrow" size={18} /></>}
        </button>
      </div>
      {result && !result.saved && <p className="muted" style={{ marginTop: 10, fontSize: 13 }}>This translation was not saved to history. <button className="link" onClick={() => nav('/settings')}>Change in settings</button></p>}
    </div>
  )
}
