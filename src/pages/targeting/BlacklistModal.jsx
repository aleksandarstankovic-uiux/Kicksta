import { useEffect, useState } from 'react'
import { Ban, X } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import { useToasts } from '@/stores/useToasts'
import { searchTargets } from '@/mocks/targetSearch'
import { formatCount } from '@/utils/formatCount'
import CardChip from '@/components/CardChip'
import { formatRelativeShort } from '@/utils/formatRelativeShort'

const newId = () => `b_${Math.random().toString(36).slice(2, 8)}`

function letterFor(username) {
  return String(username ?? '').replace(/^@/, '').charAt(0).toUpperCase() || '·'
}

export default function BlacklistModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [matches, setMatches] = useState([])
  const [pickedMatch, setPickedMatch] = useState(null)

  const stored = useLists((s) => s.blacklist)
  const replaceBlacklist = useLists((s) => s.replaceBlacklist)

  const [draft, setDraft] = useState(stored)

  const clean = input.replace(/^@/, '').trim()

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setInput('')
    setMatches([])
    setPickedMatch(null)
    setDraft(stored)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, stored])

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

  const canAdd = Boolean(pickedMatch)

  const handlePickMatch = (m) => {
    setInput(m.username)
    setPickedMatch(m)
    setMatches([])
  }

  const handleAdd = () => {
    if (!canAdd) return
    const username = `@${pickedMatch.username.toLowerCase()}`
    const duplicate = draft.some((e) => e.username.toLowerCase() === username)
    if (duplicate) {
      useToasts.getState().addToast({ message: 'Already in list.', tone: 'warning' })
      return
    }
    // Newest entries appear at the top of the list — same convention as
    // the page-level cards so the user immediately sees what they just added.
    setDraft((prev) => [
      { id: newId(), username, addedAt: new Date().toISOString() },
      ...prev,
    ])
    setInput('')
    setPickedMatch(null)
  }

  const handleRemove = (id) => {
    setDraft((prev) => prev.filter((e) => e.id !== id))
  }

  const handleSave = () => {
    replaceBlacklist(draft)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && canAdd) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit blacklist"
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
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <CardChip color="yellow" icon={Ban} />
            <h2 className="text-base font-semibold text-text-primary">Edit blacklist</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs text-text-secondary">
            Accounts here will never be followed.
          </p>

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
              disabled={!canAdd}
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

          <div className="mt-4 flex max-h-72 flex-col divide-y divide-border overflow-y-auto">
            {draft.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">
                No accounts blacklisted yet.
              </p>
            )}
            {draft.map((e) => (
              <div key={e.id} className="flex items-center gap-3 py-2.5">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg text-xs font-semibold text-text-secondary">
                  {letterFor(e.username)}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                  {e.username}
                </span>
                <span className="shrink-0 text-xs text-text-muted">
                  added {formatRelativeShort(e.addedAt)}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemove(e.id)}
                  aria-label={`Remove ${e.username}`}
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-red-text"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-3 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
