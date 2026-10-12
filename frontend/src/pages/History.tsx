import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { EmptyState, ErrorBox, Loading } from '../components/Bits'
import Icon from '../components/Icon'
import { api } from '../lib/api'
import { useStore } from '../lib/store'
import type { HistoryItem } from '../lib/types'

export default function History() {
  const { user, toast } = useStore()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<HistoryItem[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirm, setConfirm] = useState(false)

  const load = useCallback(async (query: string) => {
    try {
      setError(null)
      setItems((await api<{ items: HistoryItem[] }>(`/history?q=${encodeURIComponent(query)}`)).items)
    } catch (e) { setError((e as Error).message); setItems([]) }
  }, [])

  useEffect(() => {
    const h = window.setTimeout(() => load(q), 250)
    return () => window.clearTimeout(h)
  }, [q, load])

  const remove = async (id: string) => {
    try { await api(`/history/${id}`, { method: 'DELETE' }); setItems((l) => l?.filter((i) => i.id !== id) ?? null); toast('Translation deleted') }
    catch (e) { setError((e as Error).message) }
  }
  const clearAll = async () => {
    try { await api('/history', { method: 'DELETE' }); setItems([]); setConfirm(false); toast('History cleared') }
    catch (e) { setError((e as Error).message) }
  }

  return (
    <div>
      <div className="page-head">
        <h1>History</h1>
        <p>Your recent translations and language directions.{!user && ' They are saved for this browser. Log in to keep them across devices.'}</p>
      </div>
      <div className="toolbar">
        <div className="search"><Icon name="search" size={18} /><input className="input" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search your translations" aria-label="Search history" /></div>
        {items && items.length > 0 && (confirm
          ? <div className="row"><span className="muted">Delete all {items.length}?</span><button className="btn danger sm" onClick={clearAll}>Yes, clear history</button><button className="btn ghost sm" onClick={() => setConfirm(false)}>Cancel</button></div>
          : <button className="btn ghost sm" onClick={() => setConfirm(true)}>Clear all</button>)}
      </div>
      {error && <ErrorBox message={error} onRetry={() => load(q)} />}
      {items === null ? <Loading label="Loading history" />
        : items.length === 0 && !error ? (
          q ? <EmptyState title="No matches" text={`Nothing in your history contains “${q}”.`} />
            : <EmptyState title="No translations yet" text="Translations you make will be listed here so you can reopen them later."><Link to="/translate" className="btn primary">Start translating</Link></EmptyState>
        ) : (
          <div className="list">
            {items.map((i) => (
              <div className="item" key={i.id} role="link" tabIndex={0} style={{ cursor: 'pointer' }}
                onClick={() => nav(`/result/${i.id}`)} onKeyDown={(e) => e.key === 'Enter' && nav(`/result/${i.id}`)}>
                <span className="date">{new Date(i.created_at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                <div className="txt">
                  <div className="pair"><span className="mono">{i.source.code?.slice(0, 2)}</span>{i.source.name} <Icon name="arrow" size={14} /> <span className="mono">{i.target.code?.slice(0, 2)}</span>{i.target.name} · {i.style}</div>
                  <div className="src" dir="auto">{i.source_text}</div>
                  <div className="dst" dir="auto">{i.translation}</div>
                </div>
                <button className="icon-btn" aria-label="Delete translation" title="Delete" onClick={(e) => { e.stopPropagation(); remove(i.id) }}><Icon name="trash" size={18} /></button>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}
