import { useState } from 'react'
import { X } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import { useToasts } from '@/stores/useToasts'

const TABS = [
  {
    key: 'whitelist',
    label: 'Whitelist',
    sub: 'Accounts here will never be unfollowed.',
    emptyCopy: 'No accounts whitelisted yet.',
  },
  {
    key: 'blacklist',
    label: 'Blacklist',
    sub: 'Accounts here are excluded from all interaction.',
    emptyCopy: 'No accounts blacklisted yet.',
  },
]

export default function ListsCard() {
  const [tab, setTab] = useState('whitelist')
  const [input, setInput] = useState('')
  const [error, setError] = useState(null)

  const whitelist = useLists((s) => s.whitelist)
  const blacklist = useLists((s) => s.blacklist)
  const addEntry = useLists((s) => s.addEntry)
  const removeEntry = useLists((s) => s.removeEntry)

  const currentTab = TABS.find((t) => t.key === tab)
  const entries = tab === 'whitelist' ? whitelist : blacklist

  const handleAdd = () => {
    if (!input.trim()) return
    const result = addEntry(tab, input)
    if (result === 'invalid') {
      setError('Usernames use letters, numbers, dots, and underscores.')
      return
    }
    if (result === 'duplicate') {
      useToasts.getState().addToast({
        message: 'Already in list.',
        tone: 'warning',
      })
      setError(null)
      return
    }
    setInput('')
    setError(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <section className="mt-4 rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Lists</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Fine-tune who Kicksta does and doesn't interact with.
      </p>

      {/* Tabs */}
      <div className="mt-4 inline-flex rounded-full bg-bg p-1">
        {TABS.map((t) => {
          const selected = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key)
                setInput('')
                setError(null)
              }}
              className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Tab sub */}
      <p className="mt-2 text-xs text-text-secondary">{currentTab.sub}</p>

      {/* Quick-add */}
      <div className="mt-4 flex gap-2">
        <div className="flex h-10 flex-1 items-center overflow-hidden rounded-lg border border-border bg-surface px-3">
          <span className="mr-1 text-text-muted">@</span>
          <input
            type="text"
            value={input.replace(/^@/, '')}
            onChange={(e) => {
              setInput(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="username"
            autoComplete="off"
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-text">{error}</p>}

      {/* Entries */}
      <div className="mt-4 flex flex-col divide-y divide-border">
        {entries.length === 0 && (
          <p className="py-4 text-center text-sm text-text-muted">
            {currentTab.emptyCopy}
          </p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between py-3">
            <span className="text-sm text-text-primary">{e.username}</span>
            <button
              type="button"
              onClick={() => removeEntry(tab, e.id)}
              aria-label={`Remove ${e.username}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-red-text"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
