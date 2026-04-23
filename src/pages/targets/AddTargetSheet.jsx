import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockSuggestedTargets } from '@/mocks/suggestedTargets'
import { mockResolveAccount } from '@/mocks/resolveAccount'

// Single-path Add Target sheet. Opens as a bottom sheet on mobile and a
// centered modal on desktop. Type toggle swaps the input prefix, helper
// text, preview behavior, and suggestions visibility. Validation is
// silent-until-needed — invalid format shows inline red-text helper; a
// duplicate of an existing target blocks submission with a specific
// message and, when the existing row is paused, offers a Resume shortcut.
export default function AddTargetSheet({ open, onClose }) {
  const targets = useTargetsStore((s) => s.targets)
  const addTarget = useTargetsStore((s) => s.addTarget)
  const resumeTarget = useTargetsStore((s) => s.resumeTarget)

  const [type, setType] = useState('account')
  const [input, setInput] = useState('')
  const [preview, setPreview] = useState(null)
  const [resolving, setResolving] = useState(false)
  const inputRef = useRef(null)

  // Reset state each time the sheet is opened.
  useEffect(() => {
    if (open) {
      setType('account')
      setInput('')
      setPreview(null)
      setResolving(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Close on Escape.
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

  // Duplicate detection — lower-cased comparison on the stored value.
  const displayValue = type === 'account' ? `@${clean.toLowerCase()}` : `#${clean.toLowerCase()}`
  const duplicate = useMemo(() => {
    if (!clean) return null
    return targets.find((t) => t.value.toLowerCase() === displayValue)
  }, [targets, displayValue, clean])

  // Resolve preview for account mode with a debounce.
  useEffect(() => {
    if (type !== 'account' || !formatValid || duplicate) {
      setPreview(null)
      setResolving(false)
      return
    }
    let alive = true
    setResolving(true)
    const id = setTimeout(async () => {
      const result = await mockResolveAccount(clean)
      if (alive) {
        setPreview(result)
        setResolving(false)
      }
    }, 300)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [clean, type, formatValid, duplicate])

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

  const helperCopy =
    type === 'account'
      ? "We'll find users who follow this account and target them."
      : "We'll find users posting with this hashtag and target them."

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
          <h2 className="text-base font-semibold text-text-primary">
            Add a target
          </h2>
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
          {/* Type toggle */}
          <div className="flex rounded-full bg-bg p-1">
            {['account', 'hashtag'].map((t) => {
              const selected = type === t
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`inline-flex h-11 flex-1 items-center justify-center rounded-full text-sm font-medium capitalize transition-colors ${
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

          {/* Input */}
          <div className="mt-4">
            <label
              htmlFor="target-input"
              className="text-sm font-medium text-text-primary"
            >
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
              />
            </div>

            {/* Helper / error line. Three states:
                1. Duplicate — red, with optional Resume link for paused.
                2. Invalid format (only shown once user has typed) — red.
                3. Default — neutral helper copy. */}
            {duplicate ? (
              <p className="mt-1.5 text-xs text-red-text">
                You already have this target.
                {duplicate.status === 'paused' && (
                  <>
                    {' '}
                    <button
                      type="button"
                      onClick={handleResumeDuplicate}
                      className="underline hover:opacity-80"
                    >
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

          {/* Preview (account only, render whenever we have one) */}
          {type === 'account' && (preview || resolving) && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-bg p-3">
              <div className="h-10 w-10 shrink-0 rounded-full bg-surface text-sm font-semibold text-text-muted">
                <div className="flex h-full w-full items-center justify-center">
                  {(preview?.username?.[0] || '?').toUpperCase()}
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary">
                  {preview ? `@${preview.username}` : 'Looking up…'}
                </div>
                <div className="truncate text-xs text-text-secondary">
                  {preview
                    ? `${preview.followers.toLocaleString()} followers`
                    : ''}
                </div>
              </div>
            </div>
          )}

          {/* Suggestions (account only) */}
          {type === 'account' && (
            <div className="mt-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Suggestions
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {mockSuggestedTargets.map((s) => (
                  <button
                    key={s.username}
                    type="button"
                    onClick={() => setInput(s.username)}
                    className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary hover:border-border-strong hover:text-text-primary"
                  >
                    @{s.username}
                  </button>
                ))}
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
