import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertTriangle,
  AtSign,
  BadgeCheck,
  Crosshair,
  Hash,
  Lock,
  X,
} from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { useToasts } from '@/stores/useToasts'
import { mockSuggestedTargets } from '@/mocks/suggestedTargets'
import { mockSuggestedHashtags } from '@/mocks/suggestedHashtags'
import { searchTargets } from '@/mocks/targetSearch'
import { formatCount } from '@/utils/formatCount'
import CardChip from '@/components/CardChip'
import HealthPill from './HealthPill'

// v3.2: removed the TARGETING eyebrow + the "start typing" helper under
// the input (the typeahead + suggestions already communicate the flow).
// Scrollable content area has a min-height so the sheet doesn't flicker
// when suggestions or the typeahead dropdown toggle.
export default function AddTargetSheet({ open, onClose }) {
  const targets = useTargetsStore((s) => s.targets)
  const addTarget = useTargetsStore((s) => s.addTarget)
  const resumeTarget = useTargetsStore((s) => s.resumeTarget)

  const [type, setType] = useState('account')
  const [input, setInput] = useState('')
  const [matches, setMatches] = useState([])
  const [pickedMatch, setPickedMatch] = useState(null)
  const [resolving, setResolving] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setType('account')
      setInput('')
      setMatches([])
      setPickedMatch(null)
      setResolving(false)
      setMounted(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMounted(true))
      })
      setTimeout(() => inputRef.current?.focus(), 80)
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

  useEffect(() => {
    if (!pickedMatch) return
    const field = type === 'account' ? 'username' : 'hashtag'
    if (pickedMatch[field] !== clean.toLowerCase()) {
      setPickedMatch(null)
    }
  }, [clean, type, pickedMatch])

  useEffect(() => {
    if (!clean || clean.length < 2 || duplicate || pickedMatch) {
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
  }, [clean, type, duplicate, pickedMatch])

  if (!open) return null

  const canSubmit = Boolean(pickedMatch) && !duplicate

  const handleSubmit = () => {
    if (!canSubmit) return
    // Carry the picked match's source-of-truth metadata into the
    // new target so the row reads identically to what the user
    // saw in the picker (avatar, follower / post count, verified
    // / private badges).
    addTarget({
      type,
      value: displayValue,
      followers: pickedMatch?.followers,
      posts: pickedMatch?.posts,
      profilePic: pickedMatch?.profilePic,
      verified: pickedMatch?.verified,
      isPrivate: pickedMatch?.private,
    })
    useToasts.getState().addToast({
      message: `${displayValue} added as a target.`,
      tone: 'success',
    })
    onClose()
  }

  const handleResumeDuplicate = () => {
    if (duplicate) {
      resumeTarget(duplicate.id)
      useToasts.getState().addToast({
        message: `${duplicate.value} resumed.`,
        tone: 'success',
      })
      onClose()
    }
  }

  const handlePickMatch = (m) => {
    const val = type === 'account' ? m.username : m.hashtag
    setInput(val)
    setPickedMatch(m)
    setMatches([])
  }

  const handlePickSuggestion = (s) => {
    const val = type === 'account' ? s.username : s.hashtag
    setInput(val)
    setPickedMatch(s)
  }

  const allSuggestions =
    type === 'account' ? mockSuggestedTargets : mockSuggestedHashtags
  // Drop the picked match from the list so the user doesn't see
  // a suggestion that's already selected. Reappears when the
  // picked match is dismissed via the X button.
  const suggestions = pickedMatch
    ? allSuggestions.filter((s) =>
        type === 'account'
          ? s.username !== pickedMatch.username
          : s.hashtag !== pickedMatch.hashtag,
      )
    : allSuggestions

  // Derived helper message. Duplicate > invalid > select-prompt > null.
  let helper = null
  let helperTone = 'text-text-secondary'
  if (duplicate) {
    helperTone = 'text-red-text'
    helper = (
      <>
        You already have this target.
        {duplicate.status === 'paused' && (
          <>
            {' '}
            <button type="button" onClick={handleResumeDuplicate} className="underline hover:opacity-80">
              Resume it
            </button>
          </>
        )}
      </>
    )
  } else if (input && !formatValid) {
    helperTone = 'text-red-text'
    helper =
      type === 'account'
        ? 'Usernames use letters, numbers, dots, and underscores.'
        : 'Hashtags use letters, numbers, and underscores.'
  } else if (clean.length >= 2 && !pickedMatch) {
    helper = 'Select a result to continue.'
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add a target"
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
        {/* Header — chip + title stacked over a one-line subtitle.
            Icon vertically centered with the title+subtitle stack. */}
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3.5">
          <div className="flex items-center gap-3">
            <CardChip color="blue" icon={Crosshair} />
            <div className="min-w-0">
              <h2 className="text-base font-semibold leading-tight text-text-primary">
                Add a target
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                Pick an account or hashtag to follow.
              </p>
            </div>
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

        {/* Scrollable body. */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="min-h-[360px]">
            {/* Input row — icon-only Account/Hashtag switcher inline
                with the input. Switching type clears any in-flight
                input/match state so the user starts fresh.
                When a match is picked, the entire row collapses into
                a locked SelectedSourcePill. */}
            {pickedMatch ? (
              <SelectedSourcePill
                match={pickedMatch}
                type={type}
                onClear={() => {
                  setPickedMatch(null)
                  setInput('')
                  setMatches([])
                  setTimeout(() => inputRef.current?.focus(), 0)
                }}
              />
            ) : (
              <div className="relative">
                <div className="flex h-12 items-center gap-2">
                  {/* Icon-only segmented control on the LEFT — serves as the prefix.
                      Active = bg-text-primary text-bg (same recipe as the page-level
                      + body switchers). aria-pressed on each so screen readers read
                      the toggle state. */}
                  <div className="inline-flex h-12 shrink-0 items-center gap-1 rounded-lg border border-border bg-bg p-1">
                    {[
                      { value: 'account', icon: AtSign, label: 'Account mode' },
                      { value: 'hashtag', icon: Hash, label: 'Hashtag mode' },
                    ].map((t) => {
                      const selected = type === t.value
                      const Icon = t.icon
                      return (
                        <button
                          key={t.value}
                          type="button"
                          aria-label={t.label}
                          aria-pressed={selected}
                          onClick={() => {
                            setType(t.value)
                            setInput('')
                            setMatches([])
                            setPickedMatch(null)
                          }}
                          className={`flex h-full w-10 items-center justify-center rounded-md transition-colors ${
                            selected
                              ? 'bg-text-primary text-bg shadow-sm'
                              : 'text-text-secondary hover:text-text-primary'
                          }`}
                        >
                          <Icon className="h-4 w-4" aria-hidden="true" />
                        </button>
                      )
                    })}
                  </div>

                  {/* Input field — no inline @/# prefix span. Plain placeholder. */}
                  <div className="flex h-12 flex-1 items-center overflow-hidden rounded-lg border border-border bg-surface px-3">
                    <input
                      id="target-input"
                      ref={inputRef}
                      type="text"
                      value={input.replace(/^[@#]/, '')}
                      onChange={(e) => setInput(e.target.value)}
                      className="flex-1 bg-transparent text-base text-text-primary outline-none placeholder:text-text-muted md:text-sm"
                      placeholder={type === 'account' ? 'username' : 'hashtag'}
                      aria-label={type === 'account' ? 'Username' : 'Hashtag'}
                      autoComplete="off"
                    />
                    {/* Clear-X — only rendered while there's content to clear. */}
                    {input && (
                      <button
                        type="button"
                        aria-label="Clear input"
                        onClick={() => {
                          setInput('')
                          setMatches([])
                          setPickedMatch(null)
                          inputRef.current?.focus()
                        }}
                        className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg hover:text-text-primary"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Typeahead dropdown */}
                {!duplicate && formatValid && !pickedMatch && matches.length > 0 && (
                  <div className="absolute left-0 right-0 z-10 mt-1 max-h-[240px] overflow-y-auto rounded-lg border border-border bg-surface shadow-md">
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
                            <div className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                              <span className="truncate">{label}</span>
                              {!isHashtag && m.verified && (
                                <BadgeCheck
                                  className="h-3.5 w-3.5 shrink-0 fill-blue-base text-white"
                                  aria-label="Verified"
                                />
                              )}
                              {!isHashtag && m.private && (
                                <Lock
                                  className="h-3 w-3 shrink-0 text-text-muted"
                                  aria-label="Private"
                                />
                              )}
                            </div>
                            <div className="truncate text-xs text-text-muted">{sub}</div>
                          </div>
                          <HealthPill
                            count={count}
                            verified={!isHashtag && m.verified}
                            isPrivate={!isHashtag && m.private}
                          />
                        </button>
                      )
                    })}
                  </div>
                )}

                {/* Helper — only renders when there's something to say. */}
                {helper && (
                  <p className={`mt-1.5 text-xs ${helperTone}`}>{helper}</p>
                )}
              </div>
            )}

            {pickedMatch && duplicate && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-tint p-3 text-red-text">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="flex-1 text-xs leading-relaxed">
                  You already have this target.
                  {duplicate.status === 'paused' && (
                    <>
                      {' '}
                      <button
                        type="button"
                        onClick={handleResumeDuplicate}
                        className="font-medium underline hover:opacity-80"
                      >
                        Resume it
                      </button>
                    </>
                  )}
                </p>
              </div>
            )}

            {pickedMatch && type === 'account' && buildLimitedTargetingMessage(pickedMatch) && (
              <div className="mt-3 flex items-start gap-2 rounded-lg bg-yellow-tint p-3 text-yellow-text">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                <p className="text-xs leading-relaxed">
                  {buildLimitedTargetingMessage(pickedMatch)}
                </p>
              </div>
            )}

            {/* Suggestions — vertical list using the same row recipe
                as the typeahead dropdown above (avatar + handle +
                sub-line + HealthPill). Consistent interaction pattern
                inside the popup; large tap targets; no horizontal
                scroll. Wrapped in a bordered container with row
                dividers so the list reads as a distinct surface. */}
            <div className="mt-6">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                Suggestions
              </p>
              <div className="mt-2 overflow-hidden rounded-lg border border-border">
                {suggestions.map((s) => {
                  const isHashtag = type === 'hashtag'
                  const label = isHashtag ? `#${s.hashtag}` : `@${s.username}`
                  const count = isHashtag ? s.posts : s.followers
                  const subline = isHashtag
                    ? `${formatCount(s.posts)} posts`
                    : `${formatCount(s.followers)} followers`
                  const letter = (isHashtag ? s.hashtag : s.username)
                    .charAt(0)
                    .toUpperCase()
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handlePickSuggestion(s)}
                      className="flex w-full items-center gap-3 border-b border-border px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-bg"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-xs font-semibold text-text-secondary">
                        {isHashtag ? (
                          <Hash className="h-4 w-4" aria-hidden="true" />
                        ) : s.profilePic ? (
                          <img
                            src={s.profilePic}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          letter
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
                          <span className="truncate">{label}</span>
                          {!isHashtag && s.verified && (
                            <BadgeCheck
                              className="h-3.5 w-3.5 shrink-0 fill-blue-base text-white"
                              aria-label="Verified"
                            />
                          )}
                          {!isHashtag && s.private && (
                            <Lock
                              className="h-3 w-3 shrink-0 text-text-muted"
                              aria-label="Private"
                            />
                          )}
                        </div>
                        <div className="truncate text-xs text-text-muted">
                          {subline}
                        </div>
                      </div>
                      <HealthPill
                        count={count}
                        verified={!isHashtag && s.verified}
                        isPrivate={!isHashtag && s.private}
                      />
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
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

function SelectedSourcePill({ match, type, onClear }) {
  const isHashtag = type === 'hashtag'
  const label = isHashtag ? `#${match.hashtag}` : `@${match.username}`
  const subline = isHashtag
    ? `${formatCount(match.posts)} posts`
    : `${formatCount(match.followers)} followers`
  const letter = (isHashtag ? match.hashtag : match.username)
    .charAt(0)
    .toUpperCase()

  return (
    <div className="flex h-16 items-center gap-3 rounded-lg border border-border bg-bg px-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-sm font-semibold text-text-secondary ring-1 ring-border">
        {isHashtag ? (
          <Hash className="h-5 w-5" aria-hidden="true" />
        ) : match.profilePic ? (
          <img src={match.profilePic} alt="" className="h-full w-full object-cover" />
        ) : (
          letter
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5 text-sm font-medium text-text-primary">
          <span className="truncate">{label}</span>
          {!isHashtag && match.verified && (
            <BadgeCheck
              className="h-3.5 w-3.5 shrink-0 fill-blue-base text-white"
              aria-label="Verified"
            />
          )}
          {!isHashtag && match.private && (
            <Lock
              className="h-3 w-3 shrink-0 text-text-muted"
              aria-label="Private"
            />
          )}
        </div>
        <div className="truncate text-xs text-text-muted">{subline}</div>
      </div>
      <button
        type="button"
        aria-label="Clear selection"
        onClick={onClear}
        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}

function buildLimitedTargetingMessage(match) {
  const isPrivate = !!match?.private
  const isVerified = !!match?.verified
  if (isPrivate && isVerified) {
    return 'This account has limited targeting (private and verified accounts restrict what we can do).'
  }
  if (isPrivate) {
    return 'This account has limited targeting (private accounts restrict what we can do).'
  }
  if (isVerified) {
    return 'This account has limited targeting (verified accounts restrict what we can do).'
  }
  return null
}
