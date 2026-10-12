import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../lib/store'
import Icon from './Icon'

interface Props {
  value: string
  onChange: (code: string) => void
  allowAuto?: boolean
  label: string
  exclude?: string
}

const COMMON_CODES = ['en', 'es', 'fr', 'hi', 'de', 'ja', 'zh-CN', 'ar']

export default function LangPicker({ value, onChange, allowAuto, label, exclude }: Props) {
  const { languages, byCode } = useStore()
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const away = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('mousedown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  const commonLangs = useMemo(() => {
    return COMMON_CODES.map((code) => byCode[code]).filter((l): l is typeof languages[number] => Boolean(l && (!exclude || l.code !== exclude)))
  }, [byCode, exclude])

  const items = useMemo(() => {
    const s = q.trim().toLowerCase()
    const pool = exclude ? languages.filter((l) => l.code !== exclude) : languages
    if (!s) return pool

    const filtered = pool.filter(
      (l) =>
        l.name.toLowerCase().includes(s) ||
        l.native.toLowerCase().includes(s) ||
        l.code.toLowerCase() === s
    )

    return filtered.sort((a, b) => {
      const aName = a.name.toLowerCase()
      const bName = b.name.toLowerCase()
      const aCode = a.code.toLowerCase()
      const bCode = b.code.toLowerCase()
      // Exact code match first
      if (aCode === s && bCode !== s) return -1
      if (bCode === s && aCode !== s) return 1
      // Exact name match first
      if (aName === s && bName !== s) return -1
      if (bName === s && aName !== s) return 1
      // Starts with query
      if (aName.startsWith(s) && !bName.startsWith(s)) return -1
      if (bName.startsWith(s) && !aName.startsWith(s)) return 1
      return aName.localeCompare(bName)
    })
  }, [languages, q, exclude])

  const current = value === 'auto' ? null : byCode[value]
  const pick = (code: string) => {
    onChange(code)
    setOpen(false)
    setQ('')
  }

  return (
    <div className="picker" ref={box}>
      <button
        type="button"
        className="picker-btn"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`${label}: ${current ? current.name : 'Detect automatically'}`}
        onClick={() => setOpen((o) => !o)}
      >
        {current ? <span className="mono">{current.code.slice(0, 2)}</span> : <Icon name="globe" size={22} />}
        <span className="grow">
          {current ? current.name : 'Detect automatically'}
          {current && current.native !== current.name && <span className="muted nat"> · {current.native}</span>}
        </span>
        <Icon name="chevron" size={18} />
      </button>
      {open && (
        <div className="picker-pop">
          <input
            className="input"
            autoFocus
            placeholder="Search languages (e.g. English, French, Hindi)"
            value={q}
            aria-label="Search languages"
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && items[0]) pick(items[0].code)
            }}
          />
          <ul className="picker-list" role="listbox">
            {allowAuto && !q && (
              <li>
                <button type="button" className={value === 'auto' ? 'on' : ''} onClick={() => pick('auto')}>
                  <Icon name="globe" size={20} /> Detect automatically
                </button>
              </li>
            )}
            {!q && commonLangs.length > 0 && (
              <>
                <li style={{ padding: '8px 10px 4px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Common languages
                </li>
                {commonLangs.map((l) => (
                  <li key={`common-${l.code}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={l.code === value}
                      className={l.code === value ? 'on' : ''}
                      onClick={() => pick(l.code)}
                    >
                      <span className="mono">{l.code.slice(0, 2)}</span>
                      <span>{l.name}</span>
                      <small>{l.native}</small>
                    </button>
                  </li>
                ))}
                <li style={{ padding: '12px 10px 4px', fontSize: 11, fontWeight: 600, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderTop: '1px solid var(--line-soft)' }}>
                  All languages (A–Z)
                </li>
              </>
            )}
            {items.map((l) => (
              <li key={l.code}>
                <button
                  type="button"
                  role="option"
                  aria-selected={l.code === value}
                  className={l.code === value ? 'on' : ''}
                  onClick={() => pick(l.code)}
                >
                  <span className="mono">{l.code.slice(0, 2)}</span>
                  <span>{l.name}</span>
                  <small>{l.native}</small>
                </button>
              </li>
            ))}
            {!items.length && <li className="muted" style={{ padding: 12 }}>No language matches “{q}”.</li>}
          </ul>
        </div>
      )}
    </div>
  )
}
