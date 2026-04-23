import { useEffect, useMemo, useRef, useState } from 'react'
import { Hash, X } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockSuggestedTargets } from '@/mocks/suggestedTargets'
import { mockSuggestedHashtags } from '@/mocks/suggestedHashtags'
import { searchTargets } from '@/mocks/targetSearch'
import { formatCount } from '@/utils/formatCount'
import HealthPill from './HealthPill'

// Single-path Add Target sheet. v2 refinements:
// - Compact segmented toggle (h-9, left-aligned, not full-width).
// - Typeahead dropdown over an expanded fixture pool.
// - Suggestions always visible — account OR hashtag chips depending on mode.
// - Health pill on the preview card and on each typeahead row.
// - Duplicate detection + paused-row resume shortcut preserved.
export default function AddTargetSheet({ open, onClose }) {
  const targets = useTargetsStore((s) => s.targets)
  const addTarget = useTargetsStore((s) => s.addTarget)
  const resumeTarget = useTargetsStore((s) => s.resumeTarget)

  const [type, setType] = useState('account')
  const [input, setInput] = useState('')
  const [matches, setMatches] = useState([])
  const [resolving, setResolving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setType('account')
      setInput('')
      setMatches([])
      setResolving(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const clean = input.replace(/^[@#]/, '').trim()
  const formatValid =
    type === 'account'
      ? /^[a-zA-Z0-9._]{1,30}$/.test(clean)
      : /^[a-zA-Z0-9_]{1,30}$/.test(clean)

  const displayValue = type === 'account' ? `@${clean.toLowerCase()}` : `#${clean.toLowerCase()}`
  const duplicate = useMemo(() => {
    if (!clean) return null
    return targets.find((t) => t.value.toLowerCase() === displayValue)
  }, [targets, displayValue, clean])

  // Typeahead search — debounced 200ms. Only runs for 2+ chars and
  // when the input isn't a duplicate.
  useEffect(() => {
    if (!clean || clean.length < 2 || duplicate) {
      setMatches([])
      setResolving(false)
      return
    }
    let alive = true
    setResolving(true)
    const id = setTimeout(async () => {
      const results = await searchTargets(clean, type)
      if (alive) {
        setMatches(results)
        setResolving(false)
      }
    }, 200)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [clean, type, duplicate])

  // Exact match of the current input within the pool — used for the
  // preview card (and to decide if we can surface a health pill).
  const exactMatch = useMemo(() => {
    if (!matches.length) return null
    const keyField = type === 'account' ? 'username' : 'hashtag'
    return matches.find((m) => m[keyField] === clean.toLowerCase()) || null
  }, [matches, clean, type])

  if (!open) return null

  const canSubmit = formatValid && !duplicate

  const handleSubmit = () => {
    if (!canSubmit) return
    addTarget({ type, value: displayValue })
    onClose()
  }

  const handleResumeDuplicate = () => {
    if (duplicate) {
      resumeTarget(duplicate.id)
      onClose()
    }
  }

  const handlePickMatch = (m) => {
    const val = type === 'account' ? m.username : m.hashtag
    setInput(val)
    // Eagerly show the picked match as both the exact + the preview.
    setMatches([m])
  }

  const handlePickSuggestion = (s) => {
    const val = type === 'account' ? s.username : s.hashtag
    setInput(val)
  }

  const helperCopy =
    type === 'account'
      ? "We'll find users who follow this account and target them."
      : "We'll find users posting with this hashtag and target them."

  const suggestions = type === 'account' ? mockSuggestedTargets : mockSuggestedHashtags
  const suggestionsHidden = matches.length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add a target"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-h-[85vh] flex-col overflow-hidden rounded-t-xl bg-surface shadow-xl lg:max-w-md lg:rounded-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-text-primary">Add a target</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Targeting label + compact segmented toggle */}
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Targeting
            </p>
            <div className="inline-flex rounded-full bg-bg p-1">
              {['account', 'hashtag'].map((t) => {
                const selected = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t)
                      setInput('')
                      setMatches([])
                    }}
                    className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-medium capitalize transition-colors ${
                      selected
                        ? 'bg-surface text-text-primary shadow-sm'
                        : 'text-text-secondary'
                    }`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Input */}
          <div className="relative mt-4">
            <label htmlFor="target-input" className="text-sm font-medium text-text-primary">
              {type === 'account' ? 'Username' : 'Hashtag'}
            </label>
            <div className="mt-1.5 flex h-12 items-center overflow-hidden rounded-lg border border-border bg-surface px-3">
              <span className="mr-1 text-text-muted">
                {type === 'account' ? '@' : '#'}
              </span>
              <input
                id="target-input"
                ref={inputRef}
                type="text"
                value={input.replace(/^[@#]/, '')}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                placeholder={type === 'account' ? 'username' : 'hashtag'}
                autoComplete="off"
              />
            </div>

            {/* Typeahead dropdown */}
            {!duplicate && formatValid && matches.length > 0 && (
              <div className="absolute left-0 right-0 z-10 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-md">
                {matches.map((m) => {
                  const isHashtag = type === 'hashtag'
                  const label = isHashtag ? `#${m.hashtag}` : `@${m.username}`
                  const count = isHashtag ? m.posts : m.followers
                  const sub = isHashtag
                    ? `${formatCount(m.posts)} posts`
                    : `${formatCount(m.followers)} followers`
                  const letter = (isHashtag ? m.hashtag : m.username).charAt(0).toUpperCase()
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handlePickMatch(m)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-bg"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-xs font-semibold text-text-secondary">
                        {isHashtag ? <Hash className="h-4 w-4" aria-hidden="true" /> : letter}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-text-primary">{label}</div>
                        <div className="truncate text-xs text-text-muted">{sub}</div>
                      </div>
                      <HealthPill count={count} />
                    </button>
                  )
                })}
              </div>
            )}

            {/* Helper / error line */}
            {duplicate ? (
              <p className="mt-1.5 text-xs text-red-text">
                You already have this target.
                {duplicate.status === 'paused' && (
                  <>
                    {' '}
                    <button type="button" onClick={handleResumeDuplicate} className="underline hover:opacity-80">
                      Resume it
                    </button>
                  </>
                )}
              </p>
            ) : input && !formatValid ? (
              <p className="mt-1.5 text-xs text-red-text">
                {type === 'account'
                  ? 'Usernames use letters, numbers, dots, and underscores.'
                  : 'Hashtags use letters, numbers, and underscores.'}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-text-secondary">{helperCopy}</p>
            )}
          </div>

          {/* Preview card — shown when we have an exact fixture match. */}
          {exactMatch && !duplicate && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-bg p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-sm font-semibold text-text-secondary">
                {type === 'hashtag' ? (
                  <Hash className="h-4 w-4" aria-hidden="true" />
                ) : (
                  (exactMatch.username?.[0] || '?').toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary">
                  {type === 'hashtag' ? `#${exactMatch.hashtag}` : `@${exactMatch.username}`}
                </div>
                <div className="truncate text-xs text-text-secondary">
                  {type === 'hashtag'
                    ? `${formatCount(exactMatch.posts)} posts`
                    : `${formatCount(exactMatch.followers)} followers`}
                </div>
              </div>
              <HealthPill count={type === 'hashtag' ? exactMatch.posts : exactMatch.followers} />
            </div>
          )}

          {/* Suggestions — always rendered, hidden only while typeahead is showing results. */}
          {!suggestionsHidden && (
            <div className="mt-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Suggestions
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((s) => {
                  const label = type === 'account' ? `@${s.username}` : `#${s.hashtag}`
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handlePickSuggestion(s)}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary hover:border-border-strong hover:text-text-primary"
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-4 border-t border-border px-4 py-4 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add target
          </button>
        </div>
      </div>
    </div>
  )
}
