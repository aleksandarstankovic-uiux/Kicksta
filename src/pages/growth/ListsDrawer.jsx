import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import { useToasts } from '@/stores/useToasts'
import { searchTargets } from '@/mocks/targetSearch'
import { formatCount } from '@/utils/formatCount'

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

export default function ListsDrawer({ open, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState('whitelist')
  const [input, setInput] = useState('')
  const [matches, setMatches] = useState([])
  const [pickedMatch, setPickedMatch] = useState(null)

  const whitelist = useLists((s) => s.whitelist)
  const blacklist = useLists((s) => s.blacklist)
  const addEntry = useLists((s) => s.addEntry)
  const removeEntry = useLists((s) => s.removeEntry)

  const currentTab = TABS.find((t) => t.key === tab)
  const entries = tab === 'whitelist' ? whitelist : blacklist

  const clean = input.replace(/^@/, '').trim()

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setInput('')
    setMatches([])
    setPickedMatch(null)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!pickedMatch) return
    if (pickedMatch.username !== clean.toLowerCase()) {
      setPickedMatch(null)
    }
  }, [clean, pickedMatch])

  useEffect(() => {
    if (!clean || clean.length < 2 || pickedMatch) {
      setMatches([])
      return
    }
    let alive = true
    const id = setTimeout(async () => {
      const results = await searchTargets(clean, 'account')
      if (alive) setMatches(results)
    }, 200)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [clean, pickedMatch])

  if (!open) return null

  const canSubmit = Boolean(pickedMatch)

  const handlePickMatch = (m) => {
    setInput(m.username)
    setPickedMatch(m)
    setMatches([])
  }

  const handleAdd = () => {
    if (!canSubmit) return
    const result = addEntry(tab, pickedMatch.username)
    if (result === 'duplicate') {
      useToasts.getState().addToast({
        message: 'Already in list.',
        tone: 'warning',
      })
      return
    }
    setInput('')
    setPickedMatch(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && canSubmit) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Manage lists"
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 transition-opacity duration-200 lg:items-center ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-h-[85vh] flex-col overflow-hidden rounded-t-xl bg-surface shadow-xl transition-all duration-200 ease-out lg:max-w-md lg:rounded-xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">Manage lists</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="inline-flex rounded-full bg-bg p-1">
            {TABS.map((t) => {
              const selected = tab === t.key
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => {
                    setTab(t.key)
                    setInput('')
                    setMatches([])
                    setPickedMatch(null)
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

          <p className="mt-2 text-xs text-text-secondary">{currentTab.sub}</p>

          <div className="relative mt-4 flex gap-2">
            <div className="flex h-10 flex-1 items-center overflow-hidden rounded-lg border border-border bg-surface px-3">
              <span className="mr-1 text-text-muted">@</span>
              <input
                type="text"
                value={input.replace(/^@/, '')}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="username"
                autoComplete="off"
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canSubmit}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>

            {!pickedMatch && matches.length > 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-[240px] overflow-y-auto rounded-lg border border-border bg-surface shadow-md">
                {matches.map((m) => {
                  const letter = m.username.charAt(0).toUpperCase()
                  return (
                    <button
                      key={m.username}
                      type="button"
                      onClick={() => handlePickMatch(m)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-bg"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-xs font-semibold text-text-secondary">
                        {letter}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-text-primary">
                          @{m.username}
                        </div>
                        <div className="truncate text-xs text-text-muted">
                          {formatCount(m.followers)} followers
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}

            {!pickedMatch && clean.length >= 2 && matches.length === 0 && (
              <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted shadow-md">
                No matches.
              </div>
            )}
          </div>

          {clean.length >= 2 && !pickedMatch && (
            <p className="mt-1.5 text-xs text-text-secondary">
              Select a result to continue.
            </p>
          )}

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
        </div>

        <div className="border-t border-border px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
