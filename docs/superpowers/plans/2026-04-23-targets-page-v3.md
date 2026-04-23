# Targets Page v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Refinement pass on Targets v2 — tighten the Add Target sheet, restructure the slots card into a proper "Targets" hero with an icon, make the Live Activity card read as a real status component (with animations) and echo the same framing on the Overview `StatusPill`, animate the detail drawer, rework filter pills to wrap on mobile, and normalize vertical spacing.

**Architecture:** Edits to existing components. No new files except for small CSS additions where needed. Builds on v2.

**Testing:** No unit tests. Verification is visual via preview.

---

## Conventions

- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 — same discipline as before.
- Commit prefix: `feat(targets-v3): …` / `refactor(targets-v3): …` / `chore(targets-v3): …`.

---

## Task 1: Rework Add Target sheet — pinned typeahead + must-pick rule + widened toggle + open animation

**Files:** Modify `src/pages/targets/AddTargetSheet.jsx` (full rewrite of the file).

Key behavioral changes vs v2:
- Submit is gated on `pickedMatch` (a fixture reference). Typing alone never enables submit.
- Typeahead dropdown has its own internal `max-h-[240px] overflow-y-auto` so it can contain up to 5 rows without changing the sheet's dimensions; content below (preview, suggestions) is unchanged in position when the dropdown opens.
- Segmented toggle returns to near-full-width (`flex` with `flex-1` segments) — matches the input's visual weight.
- Sheet slides up (mobile) / fades in with `translate-y-2 → translate-y-0` (desktop) via a mounted-state class toggle.

- [ ] **Step 1** — Replace `src/pages/targets/AddTargetSheet.jsx` with:

```jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Hash, X } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockSuggestedTargets } from '@/mocks/suggestedTargets'
import { mockSuggestedHashtags } from '@/mocks/suggestedHashtags'
import { searchTargets } from '@/mocks/targetSearch'
import { formatCount } from '@/utils/formatCount'
import HealthPill from './HealthPill'

// v3 behavior:
// - Must-pick: Add target is disabled until the user selects a result
//   from the typeahead dropdown (or a suggestion chip). Typing alone
//   never enables submit.
// - Fixed-size popup: typeahead dropdown scrolls internally and never
//   changes the sheet's outer dimensions.
// - Wider segmented toggle, matches the input's visual weight.
// - Open/close animation: fade + slide on mount.
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

  // Reset on open; trigger mount-in animation after the dialog paints.
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

  // Clear the picked match whenever the user types again — a picked
  // match only holds for the exact value that was selected.
  useEffect(() => {
    if (!pickedMatch) return
    const field = type === 'account' ? 'username' : 'hashtag'
    if (pickedMatch[field] !== clean.toLowerCase()) {
      setPickedMatch(null)
    }
  }, [clean, type, pickedMatch])

  // Typeahead search — debounced 200ms. Only runs for 2+ chars and
  // when the input isn't a duplicate and we haven't already picked.
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
    setPickedMatch(m)
    setMatches([])
  }

  const handlePickSuggestion = (s) => {
    const val = type === 'account' ? s.username : s.hashtag
    setInput(val)
    setPickedMatch(s)
  }

  const helperCopy =
    type === 'account'
      ? "Start typing — pick an account from the results to continue."
      : "Start typing — pick a hashtag from the results to continue."

  const selectPromptCopy =
    type === 'account' ? 'Select a result to continue.' : 'Select a result to continue.'

  const suggestions = type === 'account' ? mockSuggestedTargets : mockSuggestedHashtags
  // Suggestions stay visible except when the dropdown is actively
  // showing results. They're a "browse" mode; typeahead is "search".
  const suggestionsHidden = matches.length > 0

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
          {/* Targeting label + wider segmented toggle */}
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Targeting
            </p>
            <div className="flex rounded-full bg-bg p-1">
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
                      setPickedMatch(null)
                    }}
                    className={`inline-flex h-9 flex-1 items-center justify-center rounded-full px-4 text-xs font-medium capitalize transition-colors ${
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

            {/* Typeahead dropdown — internal scroll keeps outer dims stable. */}
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
                        <div className="truncate text-sm font-medium text-text-primary">{label}</div>
                        <div className="truncate text-xs text-text-muted">{sub}</div>
                      </div>
                      <HealthPill count={count} />
                    </button>
                  )
                })}
              </div>
            )}

            {/* Helper / error line. Priority: duplicate > invalid > select-prompt > default. */}
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
            ) : clean.length >= 2 && !pickedMatch && matches.length === 0 && !resolving ? (
              <p className="mt-1.5 text-xs text-text-secondary">{selectPromptCopy}</p>
            ) : clean.length >= 2 && !pickedMatch ? (
              <p className="mt-1.5 text-xs text-text-secondary">{selectPromptCopy}</p>
            ) : (
              <p className="mt-1.5 text-xs text-text-secondary">{helperCopy}</p>
            )}
          </div>

          {/* Preview card — only after a match is picked. */}
          {pickedMatch && !duplicate && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-bg p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-sm font-semibold text-text-secondary">
                {type === 'hashtag' ? (
                  <Hash className="h-4 w-4" aria-hidden="true" />
                ) : (
                  (pickedMatch.username?.[0] || '?').toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary">
                  {type === 'hashtag' ? `#${pickedMatch.hashtag}` : `@${pickedMatch.username}`}
                </div>
                <div className="truncate text-xs text-text-secondary">
                  {type === 'hashtag'
                    ? `${formatCount(pickedMatch.posts)} posts`
                    : `${formatCount(pickedMatch.followers)} followers`}
                </div>
              </div>
              <HealthPill count={type === 'hashtag' ? pickedMatch.posts : pickedMatch.followers} />
            </div>
          )}

          {/* Suggestions — hidden while typeahead is showing results. */}
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
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/targets/AddTargetSheet.jsx
git commit -m "feat(targets-v3): pinned typeahead, must-pick rule, wider toggle, open animation"
```

---

## Task 2: Row status dot on mobile + column-header alignment

**Files:** Modify `src/pages/targets/TargetRow.jsx` and `src/pages/targets/TargetList.jsx`.

Goal: on mobile, the pill hides and a small status dot left of the name carries the status signal. On `md:+`, the pill returns. Column header aligns with the `{count · rate}` cluster.

- [ ] **Step 1** — Replace `src/pages/targets/TargetRow.jsx`:

```jsx
import { ChevronRight, Hash, Star } from 'lucide-react'
import { formatCount } from '@/utils/formatCount'

const statusDotClass = {
  active: 'bg-green-base',
  queued: 'bg-blue-base',
  paused: 'bg-text-muted',
  depleted: 'bg-yellow-base',
}

const statusPillClass = {
  active: 'bg-green-tint text-green-text',
  queued: 'bg-blue-tint text-blue-text',
  paused: 'bg-bg text-text-secondary',
  depleted: 'bg-yellow-tint text-yellow-text',
}

const statusLabel = {
  active: 'Active',
  queued: 'Queued',
  paused: 'Paused',
  depleted: 'Depleted',
}

function rateToneClass(rate, depleted) {
  if (depleted) return 'text-text-muted'
  if (rate >= 10) return 'text-green-text'
  if (rate >= 5) return 'text-text-secondary'
  return 'text-yellow-text'
}

export default function TargetRow({ target, isTop, isFirst, onOpen }) {
  const depleted = target.status === 'depleted'
  const isHashtag = target.type === 'hashtag'
  const handleStart = target.value.replace(/^[@#]/, '')
  const avatarLetter = handleStart.charAt(0).toUpperCase()

  const subline = isHashtag
    ? target.posts != null
      ? `${formatCount(target.posts)} posts`
      : ''
    : target.followers != null
      ? `${formatCount(target.followers)} followers`
      : ''

  const rate =
    target.followedCount > 0
      ? Math.round((target.followBackCount / target.followedCount) * 100)
      : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(target)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(target)
        }
      }}
      className={`group flex min-h-[64px] cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bg focus:bg-bg focus:outline-none ${
        isFirst ? '' : 'border-t border-border'
      } ${depleted ? 'bg-bg/60' : ''}`}
    >
      {/* Avatar / hashtag icon */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-sm font-semibold text-text-secondary ${
          depleted ? 'opacity-60' : ''
        }`}
      >
        {isHashtag ? (
          <Hash className="h-4 w-4" aria-hidden="true" />
        ) : target.profilePic ? (
          <img src={target.profilePic} alt="" className="h-full w-full object-cover" />
        ) : (
          avatarLetter
        )}
      </div>

      {/* Name + subline */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          {/* Mobile-only status dot */}
          <span
            aria-label={statusLabel[target.status]}
            className={`inline-block h-2 w-2 shrink-0 rounded-full md:hidden ${statusDotClass[target.status]}`}
          />

          <span
            className={`truncate text-sm font-medium ${
              depleted ? 'text-text-muted line-through' : 'text-text-primary'
            }`}
          >
            {target.value}
          </span>

          {isTop && (
            <Star
              className="h-3.5 w-3.5 shrink-0 fill-yellow-base text-yellow-base"
              aria-label="Top performer"
            />
          )}

          {/* Full pill on md:+ */}
          <span
            className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide md:inline ${
              statusPillClass[target.status]
            }`}
          >
            {statusLabel[target.status]}
          </span>
        </div>
        {subline && (
          <span className="truncate text-xs text-text-muted">{subline}</span>
        )}
      </div>

      {/* Follow-backs · rate */}
      <div className="flex shrink-0 items-baseline gap-1">
        <span
          className={`text-sm font-semibold tabular-nums ${
            depleted ? 'text-text-muted' : 'text-text-primary'
          }`}
        >
          {target.followBackCount}
        </span>
        <span className="text-text-muted">·</span>
        <span className={`text-xs tabular-nums ${rateToneClass(rate, depleted)}`}>
          {rate == null ? '—' : `${rate}%`}
        </span>
      </div>

      {/* Affordance */}
      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center">
        <ChevronRight
          className="h-5 w-5 text-text-muted transition-colors group-hover:text-text-primary"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2** — Update the column header in `src/pages/targets/TargetList.jsx`. Locate the column-header block and replace it so the right label sits exactly above the `count · rate` cluster. The rows have a 44×44 chevron zone on the far right; the header's padding-right should equal that so both end at the same x.

Full replacement for the `TargetList` column-header section — edit just this `<div>`:

```jsx
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        <span>Name</span>
        <span className="pr-11">Follow-backs · %</span>
      </div>
```

The `pr-11` (44px) offsets for the chevron's 44×44 wrapper so the header text lines up with the rate cluster. Everything else in `TargetList.jsx` is unchanged.

- [ ] **Step 3** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/targets/TargetRow.jsx src/pages/targets/TargetList.jsx
git commit -m "feat(targets-v3): mobile status dot, desktop pill, aligned column header"
```

---

## Task 3: Rename `SlotsCard` → `TargetsHeroCard` with icon + explanation, remove progress bar

**Files:**
- Rename: `src/pages/targets/SlotsCard.jsx` → `src/pages/targets/TargetsHeroCard.jsx`
- Modify: `src/pages/targets/index.jsx`

Content: `Targets` headline + short explanation sub + slots count on the right + big `+ Add target` button. No progress bar. Adds a `Crosshair` Lucide icon next to the headline for visual weight. Keeps it clean — no gradients.

- [ ] **Step 1** — Delete old file, create new file. Create `src/pages/targets/TargetsHeroCard.jsx`:

```jsx
import { Crosshair, Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockUser } from '@/mocks/user'

// Hero card for the Targets page — introduces what targets are, shows
// the plan slot limit, hosts the sole "+ Add target" CTA. No progress
// bar in v3; the N/maxSlots readout is enough and the card is cleaner
// without it.
export default function TargetsHeroCard({ onAddTarget }) {
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = mockUser.plan === 'advanced' ? 30 : 10
  const totalCount = targets.length

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6 lg:p-6">
        {/* Left: icon + headline + explanation */}
        <div className="flex flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-tint text-blue-text">
            <Crosshair className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold leading-tight text-text-primary">
              Targets
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Accounts and hashtags Kicksta follows to grow your audience. Each
              one feeds new followers into your growth queue.
            </p>
          </div>
        </div>

        {/* Right: slot readout + CTA */}
        <div className="flex items-center gap-4 lg:shrink-0 lg:flex-col lg:items-end lg:gap-3">
          <div className="flex flex-1 flex-col items-start lg:items-end">
            <span className="text-2xl font-semibold leading-none tabular-nums text-text-primary">
              {totalCount} / {maxSlots}
            </span>
            <span className="mt-1 text-xs uppercase tracking-wide text-text-muted">
              Slots used
            </span>
          </div>

          <button
            type="button"
            onClick={onAddTarget}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-base px-5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add target
          </button>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2** — Delete the old file:

```bash
rm "/Users/aleksandarstankovic/Desktop/Vibe Dash/src/pages/targets/SlotsCard.jsx"
```

- [ ] **Step 3** — Update `src/pages/targets/index.jsx` — swap the import + usage from `SlotsCard` to `TargetsHeroCard`. Full replacement:

```jsx
import { useState } from 'react'
import TargetsHeroCard from './TargetsHeroCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'
import TargetDetailDrawer from './TargetDetailDrawer'
import RemoveTargetModal from './RemoveTargetModal'
import AddTargetSheet from './AddTargetSheet'
import LiveActivityCard from './LiveActivityCard'

export default function TargetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Targets
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage the accounts and hashtags Kicksta targets for your growth.
        </p>
      </header>

      <LiveActivityCard onOpenTarget={(t) => setDetailTarget(t)} />
      <TargetsHeroCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList onOpen={(t) => setDetailTarget(t)} />

      <AddTargetSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {detailTarget && (
        <TargetDetailDrawer
          target={detailTarget}
          onClose={() => setDetailTarget(null)}
          onRequestRemove={(t) => {
            setDetailTarget(null)
            setRemoveTarget(t)
          }}
        />
      )}

      {removeTarget && (
        <RemoveTargetModal
          target={removeTarget}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/targets/TargetsHeroCard.jsx src/pages/targets/index.jsx
git add -u src/pages/targets/SlotsCard.jsx
git commit -m "feat(targets-v3): targets hero card with icon + explanation, no progress bar"
```

---

## Task 4: LiveActivityCard — LIVE eyebrow, accent strip, phase-text crossfade

**Files:** Modify `src/pages/targets/LiveActivityCard.jsx` (full rewrite).

Key additions:
- `LIVE` eyebrow pill (green-tint when running, muted when paused/setup).
- Thin left accent strip in the phase's dot color.
- Phase label + target handle wrapped in a `key`-bound div so each phase change cross-fades.

- [ ] **Step 1** — Replace `src/pages/targets/LiveActivityCard.jsx`:

```jsx
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useTargetsStore } from '@/stores/useTargetsStore'

const PHASE_LABEL = {
  analyzing: 'Analyzing targets',
  following: 'Following',
  unfollowing: 'Unfollowing',
  waiting: 'Pausing between actions',
  warming_up: 'Warming up',
  setup: 'Setup needed',
  paused: 'Paused',
}

function dotToneClass(phase) {
  if (phase === 'warming_up') return 'bg-blue-base'
  if (phase === 'setup' || phase === 'paused') return 'bg-text-muted'
  return 'bg-green-base'
}

function accentStripClass(phase) {
  if (phase === 'warming_up') return 'bg-blue-base'
  if (phase === 'setup' || phase === 'paused') return 'bg-text-muted'
  return 'bg-green-base'
}

function eyebrowTheme(phase) {
  if (phase === 'setup') return { label: 'SETUP', cls: 'bg-bg text-text-muted' }
  if (phase === 'paused') return { label: 'PAUSED', cls: 'bg-bg text-text-muted' }
  if (phase === 'warming_up')
    return { label: 'WARMING UP', cls: 'bg-blue-tint text-blue-text' }
  return { label: 'LIVE', cls: 'bg-green-tint text-green-text' }
}

function isLivePhase(phase) {
  return (
    phase === 'analyzing' ||
    phase === 'following' ||
    phase === 'unfollowing' ||
    phase === 'waiting'
  )
}

export default function LiveActivityCard({ onOpenTarget }) {
  const { phase, targetHandle, actionsToday, nextActionLabel } = useSystemStatus()
  const targets = useTargetsStore((s) => s.targets)

  const matchedTarget = targetHandle
    ? targets.find((t) => t.value.toLowerCase() === targetHandle.toLowerCase())
    : null

  const phaseLabel = PHASE_LABEL[phase] || 'Idle'
  const live = isLivePhase(phase)
  const dotClass = dotToneClass(phase)
  const accentClass = accentStripClass(phase)
  const { label: eyebrowLabel, cls: eyebrowCls } = eyebrowTheme(phase)

  // Key that drives the crossfade. Include targetHandle so target
  // changes animate too.
  const contentKey = `${phase}|${targetHandle || ''}`

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative flex items-center gap-3 px-4 py-3 lg:px-6 lg:py-4">
        {/* Left accent strip — the phase's color. */}
        <span
          className={`absolute left-0 top-0 h-full w-1 ${accentClass}`}
          aria-hidden="true"
        />

        {/* Left zone: eyebrow + dot + animated phase text */}
        <div className="flex min-w-0 flex-1 items-center gap-3 pl-1">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${eyebrowCls}`}
          >
            {eyebrowLabel}
          </span>

          <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
            {live && (
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotClass}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`}
              aria-hidden="true"
            />
          </span>

          {/* key-bound wrapper → each phase/target change cross-fades. */}
          <div
            key={contentKey}
            className="flex min-w-0 items-center gap-2 animate-in fade-in duration-300"
          >
            <span className="truncate text-sm font-medium text-text-primary">
              {phaseLabel}
            </span>

            {targetHandle &&
              (matchedTarget ? (
                <button
                  type="button"
                  onClick={() => onOpenTarget(matchedTarget)}
                  className="truncate text-sm font-medium text-text-primary hover:underline"
                >
                  {targetHandle}
                </button>
              ) : (
                <span className="truncate text-sm font-medium text-text-primary">
                  {targetHandle}
                </span>
              ))}

            {phase === 'warming_up' && (
              <span className="truncate text-xs text-text-muted">
                Growth starts within 72 hours
              </span>
            )}
            {phase === 'setup' && (
              <span className="truncate text-xs text-text-muted">
                Add your first target to start
              </span>
            )}
          </div>
        </div>

        {/* Right zone: data chips (desktop). */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {phase !== 'setup' && (
            <span className="rounded-full bg-bg px-2 py-1 text-xs">
              <span className="text-text-muted">Today </span>
              <span className="font-medium tabular-nums text-text-primary">
                {actionsToday} actions
              </span>
            </span>
          )}
          {nextActionLabel && (
            <span className="rounded-full bg-bg px-2 py-1 text-xs text-text-muted">
              {nextActionLabel}
            </span>
          )}
        </div>
      </div>

      {/* Mobile secondary line. */}
      {(phase !== 'setup' || nextActionLabel) && (
        <div className="border-t border-border px-4 py-2 text-xs text-text-muted lg:hidden">
          {phase !== 'setup' && (
            <>
              Today{' '}
              <span className="tabular-nums text-text-secondary">{actionsToday}</span>{' '}
              actions
            </>
          )}
          {phase !== 'setup' && nextActionLabel && <> · </>}
          {nextActionLabel}
        </div>
      )}
    </section>
  )
}
```

Note: `animate-in fade-in duration-300` relies on Tailwind 4 entry animations. If Tailwind 4 doesn't resolve these utilities cleanly in this project, fall back to explicit CSS keyframes — but ship with the utility class first and verify.

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/targets/LiveActivityCard.jsx
git commit -m "feat(targets-v3): LIVE eyebrow, accent strip, phase text crossfade"
```

---

## Task 5: Overview `StatusPill` — add the LIVE eyebrow inside the flat chip

**Files:** Modify `src/pages/overview/index.jsx`.

Small surgical edit. Adds a `LIVE` chip (or `PAUSED` / `SETUP` / `WARMING UP` variant) inside the existing pill, to the left of the dot. The pill's outer chrome stays identical.

- [ ] **Step 1** — In `src/pages/overview/index.jsx`, locate the `StatusPill` component (around line 249). Inside the button's content, immediately after the opening `<button …>` and before the `{isPaused ? (...)}` block that renders the dot, insert a new eyebrow span. Also add a helper at the top of the component to derive the eyebrow theme.

Use the Edit tool. Two edits:

**Edit 1** — Add the eyebrow theme helper. After the `const live = useSystemStatus()` line (added in v2 Task 11) and before the `const isPaused =` line, insert:

```jsx
  const eyebrow = (() => {
    if (isPaused) return { label: 'PAUSED', cls: 'bg-bg text-text-muted' }
    if (isWarming) return { label: 'WARMING UP', cls: 'bg-blue-tint text-blue-text' }
    if (isSetup) return { label: 'SETUP', cls: 'bg-yellow-tint text-yellow-text' }
    return { label: 'LIVE', cls: 'bg-green-tint text-green-text' }
  })
```

Wait — `isWarming` and `isSetup` are defined after `isPaused`. We need the helper to use the same values, so move the helper **after** the three `const isPaused / isWarming / isSetup` lines:

Revised: place this new code **after** `const isSetup = status.state === 'setup'` and **before** `const dotColor =`:

```jsx
  const eyebrowTheme = isPaused
    ? { label: 'PAUSED', cls: 'bg-bg text-text-muted' }
    : isWarming
      ? { label: 'WARMING UP', cls: 'bg-blue-tint text-blue-text' }
      : isSetup
        ? { label: 'SETUP', cls: 'bg-yellow-tint text-yellow-text' }
        : { label: 'LIVE', cls: 'bg-green-tint text-green-text' }
```

**Edit 2** — Inside the `<button …>` that opens the pill (locate the line with `className="group inline-flex items-center gap-2.5 rounded-md bg-bg ..."`), insert the eyebrow span as the **first child** of the button, right before the `{isPaused ? (...)}` block that renders the Pause icon / dot:

```jsx
        <span
          className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${eyebrowTheme.cls}`}
        >
          {eyebrowTheme.label}
        </span>
```

Do not touch anything else in the file. Verify the button still renders correctly after the edit.

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/overview/index.jsx
git commit -m "feat(targets-v3): LIVE eyebrow inside Overview StatusPill"
```

---

## Task 6: TargetDetailDrawer — ease-in open animation

**Files:** Modify `src/pages/targets/TargetDetailDrawer.jsx`.

Add the same mounted-state animation pattern as the AddTargetSheet so the drawer slides up (mobile) / fades with translate (desktop).

- [ ] **Step 1** — In `src/pages/targets/TargetDetailDrawer.jsx`, add a `mounted` state and drive two classNames off it.

Full replacement of the file:

```jsx
import { useEffect, useState } from 'react'
import { ExternalLink, Hash, Pause, Play, Trash2, X } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { formatCount } from '@/utils/formatCount'
import HealthPill from './HealthPill'

const statusPillClass = {
  active: 'bg-green-tint text-green-text',
  queued: 'bg-blue-tint text-blue-text',
  paused: 'bg-bg text-text-secondary',
  depleted: 'bg-yellow-tint text-yellow-text',
}

const statusLabel = {
  active: 'Active',
  queued: 'Queued',
  paused: 'Paused',
  depleted: 'Depleted',
}

export default function TargetDetailDrawer({ target, onClose, onRequestRemove }) {
  const pauseTarget = useTargetsStore((s) => s.pauseTarget)
  const resumeTarget = useTargetsStore((s) => s.resumeTarget)

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [target])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!target) return null

  const isHashtag = target.type === 'hashtag'
  const handleStart = target.value.replace(/^[@#]/, '')
  const avatarLetter = handleStart.charAt(0).toUpperCase()
  const sizeCount = isHashtag ? target.posts : target.followers
  const subline = isHashtag
    ? target.posts != null
      ? `${formatCount(target.posts)} posts`
      : ''
    : target.followers != null
      ? `${formatCount(target.followers)} followers`
      : ''
  const rate =
    target.followedCount > 0
      ? Math.round((target.followBackCount / target.followedCount) * 100)
      : null

  const instagramUrl = isHashtag
    ? `https://www.instagram.com/explore/tags/${handleStart}`
    : `https://instagram.com/${handleStart}`

  const handlePauseResume = () => {
    if (target.status === 'active') pauseTarget(target.id)
    else if (target.status === 'paused') resumeTarget(target.id)
    onClose()
  }

  const handleRemove = () => onRequestRemove(target)

  const canPauseOrResume =
    target.status === 'active' || target.status === 'paused'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Target details for ${target.value}`}
      className={`fixed inset-0 z-40 flex items-end justify-center bg-black/40 transition-opacity duration-200 lg:items-center ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full overflow-hidden rounded-t-xl bg-surface shadow-xl transition-all duration-200 ease-out lg:max-w-md lg:rounded-xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-base font-semibold text-text-secondary">
            {isHashtag ? (
              <Hash className="h-5 w-5" aria-hidden="true" />
            ) : target.profilePic ? (
              <img src={target.profilePic} alt="" className="h-full w-full object-cover" />
            ) : (
              avatarLetter
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-base font-semibold text-text-primary">
                {target.value}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  statusPillClass[target.status]
                }`}
              >
                {statusLabel[target.status]}
              </span>
            </div>
            {subline && (
              <div className="mt-0.5 text-xs text-text-muted">{subline}</div>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {sizeCount != null && (
          <div className="mt-3 px-5">
            <HealthPill count={sizeCount} />
          </div>
        )}

        <div className="mt-4 flex gap-2 overflow-x-auto px-5">
          <StatChip label="Followed" value={target.followedCount} />
          <StatChip label="Follow-backs" value={target.followBackCount} />
          <StatChip label="Rate" value={rate == null ? '—' : `${rate}%`} />
        </div>

        <div className="mt-5 flex gap-3 px-5">
          {canPauseOrResume ? (
            <>
              <button
                type="button"
                onClick={handlePauseResume}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-tint text-sm font-medium text-blue-text hover:opacity-90"
              >
                {target.status === 'active' ? (
                  <>
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Resume
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-red-tint text-sm font-medium text-red-text hover:opacity-90"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-tint text-sm font-medium text-red-text hover:opacity-90"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </button>
          )}
        </div>

        <div className="mt-4 px-5 pb-5">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
          >
            Open on Instagram
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  )
}

function StatChip({ label, value }) {
  return (
    <div className="shrink-0 rounded-full bg-bg px-3 py-1.5 text-xs">
      <span className="text-text-muted">{label} </span>
      <span className="font-semibold tabular-nums text-text-primary">
        {value}
      </span>
    </div>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/targets/TargetDetailDrawer.jsx
git commit -m "feat(targets-v3): ease-in open animation for detail drawer"
```

---

## Task 7: FilterRow — wrap on mobile (no horizontal scroll)

**Files:** Modify `src/pages/targets/FilterRow.jsx`.

Goal: filter pills wrap to multiple rows on narrow widths (all 5 visible without scrolling). Sort sits on its own row below on mobile; on desktop it stays to the right of the pill row.

- [ ] **Step 1** — Replace `src/pages/targets/FilterRow.jsx`:

```jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'queued', label: 'Queued' },
  { value: 'paused', label: 'Paused' },
  { value: 'depleted', label: 'Depleted' },
]

const SORTS = [
  { value: 'priority', label: 'Priority' },
  { value: 'followBacks', label: 'Follow-backs' },
  { value: 'recent', label: 'Most recent' },
  { value: 'alpha', label: 'A–Z' },
]

export default function FilterRow() {
  const { filter, sort, setFilter, setSort, targets } = useTargetsStore()

  const counts = useMemo(() => {
    const base = { all: targets.length, active: 0, queued: 0, paused: 0, depleted: 0 }
    for (const t of targets) {
      if (base[t.status] !== undefined) base[t.status] += 1
    }
    return base
  }, [targets])

  return (
    <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
      {/* Pills wrap on mobile, single-row on lg:+. */}
      <div className="flex flex-1 flex-wrap gap-2">
        {FILTERS.map((f) => {
          const selected = filter === f.value
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-surface text-text-primary shadow-sm ring-1 ring-border'
                  : 'bg-bg text-text-secondary hover:text-text-primary'
              }`}
            >
              <span>{f.label}</span>
              <span className="tabular-nums text-[11px] text-text-muted">
                {counts[f.value]}
              </span>
            </button>
          )
        })}
      </div>

      <div className="flex justify-end lg:shrink-0">
        <SortDropdown value={sort} onChange={setSort} />
      </div>
    </div>
  )
}

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = SORTS.find((s) => s.value === value) ?? SORTS[0]

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Sort targets"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-bg px-3 text-xs font-medium text-text-secondary hover:text-text-primary"
      >
        <ArrowUpDown className="h-4 w-4 lg:hidden" aria-hidden="true" />
        <span className="hidden lg:inline">Sort: {current.label}</span>
        <ChevronDown className="hidden h-3.5 w-3.5 lg:inline" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-surface shadow-md"
        >
          {SORTS.map((s) => {
            const selected = s.value === value
            return (
              <button
                key={s.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  onChange(s.value)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-text-primary hover:bg-bg"
              >
                <span>{s.label}</span>
                {selected && <Check className="h-4 w-4 text-blue-text" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

The segmented-control container pattern is replaced by individual pills with `bg-bg` unselected vs `bg-surface shadow-sm ring-1 ring-border` selected — this was the only way to support wrapping cleanly without the container's pill-group look breaking across lines.

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/targets/FilterRow.jsx
git commit -m "feat(targets-v3): wrapping filter pills on mobile, sort on its own row"
```

---

## Task 8: Vertical spacing normalization

**Files:** Modify `src/pages/targets/LiveActivityCard.jsx`, `TargetsHeroCard.jsx`, `FilterRow.jsx`, `TargetList.jsx` — check top margins.

Target rhythm:
- First card under the page header: `mt-6`.
- Subsequent section cards: `mt-4`.
- Internal card spacing: follow the card's own conventions.

- [ ] **Step 1** — Audit each component's top-level `<section>` / `<div>` `mt-*`. Change:
  - `LiveActivityCard.jsx` → keep `mt-6` (first card under header).
  - `TargetsHeroCard.jsx` → change `mt-6` → `mt-4`.
  - `FilterRow.jsx` → already `mt-4`. Keep.
  - `TargetList.jsx` — already `mt-4`. Keep.

If the values are already as stated in the previous tasks, this step may be a no-op. Verify by opening each file and ensuring the top-level margin matches the target.

- [ ] **Step 2** — Commit (only if any files changed):

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add -u src/pages/targets/
git commit -m "chore(targets-v3): normalize vertical spacing rhythm"
```

If no files changed, skip the commit.

---

## Task 9: Visual verify + CHANGELOG/CONTEXT update

- [ ] **Step 1** — Controller runs the preview and walks through:
  - Targets hero card renders with icon + headline + explanation + slots + button.
  - LiveActivityCard shows `LIVE` pill + dot + animated phase transitions.
  - Filter pills wrap on mobile.
  - Row status dot shows on mobile instead of the pill.
  - Column header aligns with the rate cluster.
  - Add Target sheet: typeahead doesn't push content, must-pick enforced, wider toggle.
  - Detail drawer fades/slides in on open.
  - Overview StatusPill carries `LIVE` eyebrow.

- [ ] **Step 2** — Update `CHANGELOG.md` and `CONTEXT.md` (controller does this; no separate subagent).

- [ ] **Step 3** — Commit docs:

```bash
git add CHANGELOG.md CONTEXT.md docs/
git commit -m "docs: log Targets v3 refinements"
```

---

## Spec Coverage

All user-requested fixes:
- Typeahead pinned, must-pick, wider toggle → Task 1.
- Row mobile dot, column alignment → Task 2.
- Targets hero card → Task 3.
- LIVE eyebrow + accent + text animation → Task 4.
- Overview StatusPill LIVE eyebrow → Task 5.
- Drawer animation → Task 6.
- Filter pills wrap → Task 7.
- Spacing audit → Task 8.
