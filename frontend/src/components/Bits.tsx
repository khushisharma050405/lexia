import { useState, type ReactNode } from 'react'
import { useStore } from '../lib/store'
import Icon from './Icon'

export function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const { toast } = useStore()
  const [done, setDone] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const t = document.createElement('textarea')
      t.value = text
      document.body.appendChild(t)
      t.select()
      document.execCommand('copy')
      t.remove()
    }
    setDone(true)
    toast('Copied to clipboard')
    setTimeout(() => setDone(false), 1500)
  }
  return (
    <button type="button" className="icon-btn" onClick={copy} disabled={!text} aria-label={label} title={label}>
      <Icon name={done ? 'check' : 'copy'} size={18} />
    </button>
  )
}

export function Confidence({ value, band }: { value: number; band: string }) {
  return (
    <div className={`meter ${band === 'low' ? 'low' : ''}`} role="meter" aria-valuemin={0} aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)} aria-label="Detection confidence">
      <i style={{ width: `${Math.max(2, value * 100)}%` }} />
    </div>
  )
}

export const pct = (v: number) => `${(v * 100).toFixed(v >= 0.995 ? 0 : 1)}%`

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="alert" role="alert">
      <span>{message}</span>
      {onRetry && <button className="link" onClick={onRetry}>Try again</button>}
    </div>
  )
}

export function EmptyState({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return (
    <div className="center-state">
      <Icon name="leaf" size={34} />
      <h3>{title}</h3>
      <p>{text}</p>
      {children}
    </div>
  )
}

export function Loading({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="center-state" role="status">
      <span className="spin" /> <p>{label}…</p>
    </div>
  )
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <button type="button" role="switch" aria-checked={checked} aria-label={label} className="switch" onClick={() => onChange(!checked)} />
}
