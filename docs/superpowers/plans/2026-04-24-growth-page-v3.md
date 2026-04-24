# Growth Page v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Rework the Growth page per `docs/superpowers/specs/2026-04-24-growth-page-v3-design.md` — Filters and Lists become summary rows with focused drawers, Welcome DM moves to a modal, Growth+ compacts to a one-row banner, grid rebalances to symmetric 2-col on desktop.

**Architecture:** Reuse existing v2 filter/list UIs but move them into drawer components. Add a tiny summary-sentence helper for filters. Rebalance the page grid. No store or primitive changes.

**Tech Stack:** React 19 · Tailwind 4 · Zustand 5 · Lucide React.

**Testing:** No unit-test framework. Verification is visual via Claude Preview. Each task commits.

---

## Conventions

- Spacing scale 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 only. Design tokens only.
- Commit prefix: `feat(growth-v3): …` / `refactor(growth-v3): …`.
- Path alias `@/` → `src/`.

---

## File Structure

**Created:**
```
src/pages/growth/filterSummary.js      summarizeFilters helper
src/pages/growth/FiltersDrawer.jsx     drawer that hosts the full v2 filter UI
src/pages/growth/ListsDrawer.jsx       drawer that hosts the full v2 lists UI
src/pages/growth/WelcomeDmModal.jsx    modal with message textarea
```

**Modified:**
```
src/pages/growth/index.jsx             grid rebalance + drawer/modal state
src/pages/growth/EngagementCard.jsx    Welcome DM textarea → "Edit message" link + modal host
src/pages/growth/FiltersCard.jsx       summary + Customize button (drawer host in index.jsx)
src/pages/growth/ListsCard.jsx         summary + Manage button (drawer host in index.jsx)
src/pages/growth/GrowthPlusCard.jsx    compact one-row banner
```

**Unchanged:**
- `src/pages/growth/ModeCard.jsx` · `SafetyStrip.jsx` · `PresetRangePills.jsx`
- `src/components/SettingSwitch.jsx` · `UpgradeBottomSheet.jsx`
- All stores and mocks

---

## Task 1: `filterSummary` helper

**Files:** Create `src/pages/growth/filterSummary.js`.

- [ ] **Step 1** — Create file with:

```js
import { formatCount } from '@/utils/formatCount'

function rangeLabel(min, max, unit) {
  if ((min === 0 || min == null) && max == null) return null
  if (min === 0 || min == null) return `Up to ${formatCount(max)} ${unit}`
  if (max == null) return `${formatCount(min)}+ ${unit}`
  return `${formatCount(min)}–${formatCount(max)} ${unit}`
}

// Compresses the current filters config into a one-sentence summary
// for the collapsed Filters card. Omits default / all-inclusive dials.
export function summarizeFilters(filters) {
  const parts = []

  const follower = rangeLabel(filters.followerMin, filters.followerMax, 'followers')
  if (follower) parts.push(follower)

  const following = rangeLabel(filters.followingMin, filters.followingMax, 'following')
  if (following) parts.push(following)

  const media = rangeLabel(filters.mediaMin, filters.mediaMax, 'posts')
  if (media) parts.push(media)

  if (filters.accountPrivacy === 'public') parts.push('Public only')
  else if (filters.accountPrivacy === 'private') parts.push('Private only')

  if (filters.genderTarget === 'male') parts.push('Male accounts')
  else if (filters.genderTarget === 'female') parts.push('Female accounts')

  if (filters.excludeNsfw) parts.push('NSFW excluded')

  if (parts.length === 0) return 'All accounts — no restrictions.'
  return parts.join(' · ')
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/filterSummary.js
git commit -m "feat(growth-v3): summarizeFilters helper for collapsed Filters card"
```

---

## Task 2: `FiltersDrawer`

**Files:** Create `src/pages/growth/FiltersDrawer.jsx`.

The v2 `FiltersCard` contents (FilterRow, SegmentedPills, InfoTooltip, the 6 filter rows) move here into a drawer surface. Behaviors identical — changing any control calls the store setter which auto-saves with a debounced toast.

- [ ] **Step 1** — Create file with:

```jsx
import { useEffect, useState } from 'react'
import { Info, X } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import PresetRangePills from './PresetRangePills'

const FOLLOWING_PRESETS = [
  { key: 'low', label: '< 500', min: 0, max: 500 },
  { key: 'mid', label: '500–5K', min: 500, max: 5000 },
  { key: 'high', label: '5K+', min: 5000, max: null },
]

const FOLLOWER_PRESETS = [
  { key: 'low', label: '< 1K', min: 0, max: 1000 },
  { key: 'mid', label: '1K–50K', min: 1000, max: 50000 },
  { key: 'high', label: '50K+', min: 50000, max: null },
]

const MEDIA_PRESETS = [
  { key: 'low', label: '< 10', min: 0, max: 10 },
  { key: 'mid', label: '10–100', min: 10, max: 100 },
  { key: 'high', label: '100+', min: 100, max: null },
]

const PRIVACY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

const GENDER_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

function InfoTooltip({ text }) {
  return (
    <span className="group relative hidden lg:inline-block">
      <Info className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-text-primary px-2.5 py-1.5 text-[11px] leading-relaxed text-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}

function FilterRow({ title, tooltip, locked = false, onLockedTap, children }) {
  return (
    <div
      className={`flex flex-col gap-2 border-b border-border py-3 last:border-b-0 lg:flex-row lg:items-center lg:gap-4 ${
        locked ? 'cursor-pointer' : ''
      }`}
      onClick={locked ? onLockedTap : undefined}
    >
      <div className="flex items-center gap-1.5 lg:w-36 lg:shrink-0">
        <span
          className={`text-sm font-medium ${
            locked ? 'text-text-secondary' : 'text-text-primary'
          }`}
        >
          {title}
        </span>
        {locked && (
          <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
            Advanced
          </span>
        )}
        <InfoTooltip text={tooltip} />
      </div>
      <div className={`min-w-0 flex-1 ${locked ? 'pointer-events-none opacity-60' : ''}`}>
        {children}
      </div>
    </div>
  )
}

function SegmentedPills({ value, options, onChange }) {
  return (
    <div className="inline-flex rounded-full bg-bg p-1">
      {options.map((o) => {
        const selected = value === o.value
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors ${
              selected
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export default function FiltersDrawer({ open, onClose, onRequestUpgrade }) {
  const [mounted, setMounted] = useState(false)

  const config = useGrowthConfig((s) => s.config)
  const setFilter = useGrowthConfig((s) => s.setFilter)
  const toggleExcludeNsfw = useGrowthConfig((s) => s.toggleExcludeNsfw)

  const genderLocked = mockUser.plan !== 'advanced'

  useEffect(() => {
    if (!open) return
    setMounted(false)
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

  if (!open) return null

  const followingRange = {
    min: config.filters.followingMin,
    max: config.filters.followingMax,
  }
  const followerRange = {
    min: config.filters.followerMin,
    max: config.filters.followerMax,
  }
  const mediaRange = {
    min: config.filters.mediaMin,
    max: config.filters.mediaMax,
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customize filters"
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 transition-opacity duration-200 lg:items-center ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-h-[85vh] flex-col overflow-hidden rounded-t-xl bg-surface shadow-xl transition-all duration-200 ease-out lg:max-w-2xl lg:rounded-xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">Customize filters</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <FilterRow title="Following count" tooltip="People this account follows.">
            <PresetRangePills
              presets={FOLLOWING_PRESETS}
              value={followingRange}
              onChange={(v) => setFilter('followingRange', v)}
            />
          </FilterRow>

          <FilterRow title="Follower count" tooltip="How many followers they have.">
            <PresetRangePills
              presets={FOLLOWER_PRESETS}
              value={followerRange}
              onChange={(v) => setFilter('followerRange', v)}
            />
          </FilterRow>

          <FilterRow title="Media count" tooltip="How many posts they've published.">
            <PresetRangePills
              presets={MEDIA_PRESETS}
              value={mediaRange}
              onChange={(v) => setFilter('mediaRange', v)}
            />
          </FilterRow>

          <FilterRow
            title="Account privacy"
            tooltip="Whether their profile is public or private."
          >
            <SegmentedPills
              value={config.filters.accountPrivacy}
              options={PRIVACY_OPTIONS}
              onChange={(v) => setFilter('accountPrivacy', v)}
            />
          </FilterRow>

          <FilterRow
            title="Gender target"
            tooltip="Narrow targeting by account gender."
            locked={genderLocked}
            onLockedTap={() => onRequestUpgrade('gender_filter')}
          >
            <SegmentedPills
              value={config.filters.genderTarget}
              options={GENDER_OPTIONS}
              onChange={(v) => setFilter('genderTarget', v)}
            />
          </FilterRow>

          <FilterRow
            title="Exclude NSFW"
            tooltip="Skip accounts that appear to contain adult content."
          >
            <div className="flex justify-end lg:justify-start">
              <button
                type="button"
                role="switch"
                aria-checked={config.filters.excludeNsfw}
                onClick={() => toggleExcludeNsfw()}
                className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
                  config.filters.excludeNsfw ? 'bg-green-base' : 'bg-border'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    config.filters.excludeNsfw ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </FilterRow>
        </div>

        {/* Footer */}
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
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/FiltersDrawer.jsx
git commit -m "feat(growth-v3): FiltersDrawer with all 6 dials moved out of the page"
```

---

## Task 3: `FiltersCard` becomes summary

**Files:** Modify `src/pages/growth/FiltersCard.jsx`.

- [ ] **Step 1** — Replace the file contents entirely:

```jsx
import { SlidersHorizontal } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { summarizeFilters } from './filterSummary'

// v3: Filters is now a single summary row with a Customize button.
// The full dial UI lives in FiltersDrawer (opened from the page shell).
export default function FiltersCard({ onCustomize }) {
  const filters = useGrowthConfig((s) => s.config.filters)
  const summary = summarizeFilters(filters)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Filters</h2>
      <p className="mt-1 text-sm text-text-secondary">Who Kicksta targets.</p>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <p className="min-w-0 truncate text-sm text-text-primary">{summary}</p>
        <button
          type="button"
          onClick={onCustomize}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Customize
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/FiltersCard.jsx
git commit -m "feat(growth-v3): FiltersCard becomes summary row with Customize button"
```

---

## Task 4: `ListsDrawer`

**Files:** Create `src/pages/growth/ListsDrawer.jsx`.

The v2 `ListsCard` contents (tabs + typeahead + entries list) move here. Drawer surface + animation pattern consistent with FiltersDrawer.

- [ ] **Step 1** — Create file with:

```jsx
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

  // Reset input state each open.
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
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/ListsDrawer.jsx
git commit -m "feat(growth-v3): ListsDrawer hosts tabs + typeahead + entries"
```

---

## Task 5: `ListsCard` becomes summary

**Files:** Modify `src/pages/growth/ListsCard.jsx`.

- [ ] **Step 1** — Replace the file contents entirely:

```jsx
import { List } from 'lucide-react'
import { useLists } from '@/stores/useLists'

// v3: Lists is now a single summary row with a Manage button.
// The full tabs + typeahead + entries UI lives in ListsDrawer.
export default function ListsCard({ onManage }) {
  const whitelist = useLists((s) => s.whitelist)
  const blacklist = useLists((s) => s.blacklist)

  const summary = `Whitelist (${whitelist.length}) · Blacklist (${blacklist.length})`

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Lists</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Accounts Kicksta never unfollows or always avoids.
      </p>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <p className="min-w-0 truncate text-sm text-text-primary">{summary}</p>
        <button
          type="button"
          onClick={onManage}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
        >
          <List className="h-4 w-4" aria-hidden="true" />
          Manage
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/ListsCard.jsx
git commit -m "feat(growth-v3): ListsCard becomes summary row with Manage button"
```

---

## Task 6: `WelcomeDmModal`

**Files:** Create `src/pages/growth/WelcomeDmModal.jsx`.

- [ ] **Step 1** — Create file with:

```jsx
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

// Modal for editing the Welcome DM message. Auto-saves on Save click;
// Cancel discards edits. Keeps the Engagement card fixed-height.
export default function WelcomeDmModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false)
  const storedMessage = useGrowthConfig((s) => s.config.welcomeDm.message)
  const setWelcomeDmMessage = useGrowthConfig((s) => s.setWelcomeDmMessage)
  const [draft, setDraft] = useState(storedMessage)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setDraft(storedMessage)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
    setTimeout(() => textareaRef.current?.focus(), 80)
  }, [open, storedMessage])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSave = () => {
    setWelcomeDmMessage(draft)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Welcome DM message"
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
          <h2 className="text-base font-semibold text-text-primary">Welcome DM message</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-4">
          <p className="text-sm text-text-secondary">
            Sent to new followers after they follow you back.
          </p>
          <textarea
            ref={textareaRef}
            rows={5}
            maxLength={200}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="mt-3 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
          <div className="mt-1 text-right text-xs text-text-muted">{draft.length}/200</div>
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
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/WelcomeDmModal.jsx
git commit -m "feat(growth-v3): WelcomeDmModal for editing the DM message"
```

---

## Task 7: `EngagementCard` — Welcome DM link + modal host

**Files:** Modify `src/pages/growth/EngagementCard.jsx`.

- [ ] **Step 1** — Replace the file contents entirely:

```jsx
import { useState } from 'react'
import { Heart, MessageSquare, Pencil, Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import WelcomeDmModal from './WelcomeDmModal'

function isLocked(feature, user) {
  if (user.plan === 'advanced') return false
  return feature === 'welcome_dm' || feature === 'close_friends'
}

const CF_MODES = [
  {
    value: 'add',
    label: 'Add new followers',
    description:
      'New followers are automatically added to your Close Friends list.',
  },
  {
    value: 'remove',
    label: 'Remove unfollowers',
    description:
      'Users who unfollow you are removed from your Close Friends list.',
  },
]

export default function EngagementCard({ onRequestUpgrade }) {
  const {
    config,
    toggleLikeAfterFollow,
    toggleWelcomeDm,
    toggleCloseFriends,
    setCloseFriendsMode,
  } = useGrowthConfig()

  const [dmModalOpen, setDmModalOpen] = useState(false)

  const welcomeLocked = isLocked('welcome_dm', mockUser)
  const closeFriendsLocked = isLocked('close_friends', mockUser)

  const showEditLink = config.welcomeDm.enabled && !welcomeLocked
  const cfEnabled = config.closeFriendsAdder.enabled
  const cfMode = config.closeFriendsAdder.mode
  const showCfMode = cfEnabled && !closeFriendsLocked
  const cfCurrent = CF_MODES.find((m) => m.value === cfMode) ?? CF_MODES[0]

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Engagement</h2>
      <p className="mt-1 text-sm text-text-secondary">
        How Kicksta interacts with new followers.
      </p>

      <div className="mt-2 flex flex-col divide-y divide-border">
        <SettingSwitch
          icon={Heart}
          title="Like after follow"
          description="Like a few of their recent posts after following — boosts the follow-back rate."
          checked={config.likeAfterFollow}
          onChange={() => toggleLikeAfterFollow()}
        />

        <div>
          <SettingSwitch
            icon={MessageSquare}
            title="Welcome DM"
            description="Auto-DM new followers once they follow back."
            checked={config.welcomeDm.enabled}
            onChange={() => toggleWelcomeDm()}
            locked={welcomeLocked}
            onLockedTap={() => onRequestUpgrade('welcome_dm')}
          />
          {showEditLink && (
            <div className="pb-3 pl-7">
              <button
                type="button"
                onClick={() => setDmModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Edit message
              </button>
            </div>
          )}
        </div>

        <div>
          <SettingSwitch
            icon={Star}
            title="Close Friends Adder"
            description="Automatically manage your Close Friends list."
            checked={cfEnabled}
            onChange={() => toggleCloseFriends()}
            locked={closeFriendsLocked}
            onLockedTap={() => onRequestUpgrade('close_friends')}
          />
          {showCfMode && (
            <div className="pb-3">
              <div className="inline-flex rounded-full bg-bg p-1">
                {CF_MODES.map((m) => {
                  const selected = cfMode === m.value
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setCloseFriendsMode(m.value)}
                      className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors ${
                        selected
                          ? 'bg-surface text-text-primary shadow-sm'
                          : 'text-text-secondary hover:text-text-primary'
                      }`}
                    >
                      {m.label}
                    </button>
                  )
                })}
              </div>
              <p className="mt-2 text-xs text-text-secondary">
                {cfCurrent.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <WelcomeDmModal open={dmModalOpen} onClose={() => setDmModalOpen(false)} />
    </section>
  )
}
```

Note: the `WelcomeDmCounter` helper from v2 is removed — the modal owns its own local draft + counter.

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/EngagementCard.jsx
git commit -m "feat(growth-v3): engagement — welcome DM moves to modal via Edit link"
```

---

## Task 8: `GrowthPlusCard` — compact one-row banner

**Files:** Modify `src/pages/growth/GrowthPlusCard.jsx`.

- [ ] **Step 1** — Replace the file contents entirely:

```jsx
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { mockUser } from '@/mocks/user'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import SettingSwitch from '@/components/SettingSwitch'

export default function GrowthPlusCard() {
  const subscribed = mockUser.growthPlusSubscribed === true
  const active = useGrowthConfig((s) => s.config.growthPlusActive)
  const togglePlusActive = useGrowthConfig((s) => s.toggleGrowthPlusActive)

  if (!subscribed) {
    return (
      <section className="mt-4 overflow-hidden rounded-xl border border-purple-base/20 bg-purple-tint/30 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-base/15 text-purple-text">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-text">
              Growth+
            </p>
            <p className="mt-0.5 text-sm font-semibold text-text-primary">
              Algorithmic reach, on autopilot.
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              Separate from Targeted Growth. Cancel any time.
            </p>
          </div>
          <Link
            to="/signup/growth-plus"
            className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-purple-base px-4 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 lg:w-auto"
          >
            Add Growth+
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    )
  }

  // Subscriber variant — compact row with toggle + manage link.
  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-purple-base/20 bg-purple-tint/30 px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-base/15 text-purple-text">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-text">
                Growth+
              </p>
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                  active
                    ? 'bg-green-tint text-green-text'
                    : 'bg-bg text-text-secondary'
                }`}
              >
                {active ? 'Active' : 'Paused'}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-text-primary">
              {active
                ? 'Boosting your posts algorithmically.'
                : 'Paused — resume any time.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SettingSwitch
            title="Growth+ active"
            checked={active}
            onChange={() => togglePlusActive()}
          />
          <Link
            to="/account"
            className="text-xs text-text-secondary hover:text-text-primary hover:underline"
          >
            Manage subscription
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/GrowthPlusCard.jsx
git commit -m "feat(growth-v3): growth+ compact one-row banner (non-subscriber + subscriber)"
```

---

## Task 9: Page shell — grid rebalance + drawer hosts

**Files:** Modify `src/pages/growth/index.jsx`.

- [ ] **Step 1** — Replace the file contents entirely:

```jsx
import { useState } from 'react'
import SafetyStrip from './SafetyStrip'
import ModeCard from './ModeCard'
import EngagementCard from './EngagementCard'
import FiltersCard from './FiltersCard'
import FiltersDrawer from './FiltersDrawer'
import ListsCard from './ListsCard'
import ListsDrawer from './ListsDrawer'
import GrowthPlusCard from './GrowthPlusCard'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Growth page v3 layout (settings-dashboard):
// - Safety strip + Mode take the full width.
// - Engagement (left) beside Filters-summary + Lists-summary (right).
// - Growth+ closes the page as a compact one-row banner.
// - Filters drawer and Lists drawer open from their respective summary
//   cards; Welcome DM editing opens a modal from EngagementCard.
export default function GrowthPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [listsOpen, setListsOpen] = useState(false)

  const openUpgrade = (feature) => setUpgradeFeature(feature)
  const closeUpgrade = () => setUpgradeFeature(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Growth
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure how Kicksta grows your account.
        </p>
      </header>

      <SafetyStrip />

      <ModeCard />

      {/* Equal 2-col grid on lg:+, stacks on mobile. Engagement left;
          Filters summary + Lists summary stack on the right. */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <EngagementCard onRequestUpgrade={openUpgrade} />
        <div className="flex flex-col gap-4">
          <FiltersCard onCustomize={() => setFiltersOpen(true)} />
          <ListsCard onManage={() => setListsOpen(true)} />
        </div>
      </div>

      <GrowthPlusCard />

      <FiltersDrawer
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onRequestUpgrade={openUpgrade}
      />
      <ListsDrawer open={listsOpen} onClose={() => setListsOpen(false)} />
      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'welcome_dm'}
      />
    </div>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/index.jsx
git commit -m "feat(growth-v3): page shell hosts Filters + Lists drawers, rebalanced 2-col grid"
```

---

## Task 10: Visual verify + docs

**Files:** Any of the above based on visual review; then `CHANGELOG.md` + `CONTEXT.md`.

- [ ] **Step 1** — Controller walks through the preview:
  - Desktop (1280px): page should read as safety strip + 3 Mode cards + 2-col grid (Engagement left; Filters summary + Lists summary stacked right) + compact Growth+ banner. Everything fixed-height.
  - Filters summary line: confirm it shows `Up to 5K following · 200–50K followers · Up to 10 posts · NSFW excluded` (or similar based on current mock defaults).
  - Click `Customize` → drawer opens with all 6 dials; close with Done/X.
  - Click `Manage` on Lists → drawer opens with tabs + typeahead; close.
  - Turn on Welcome DM → `Edit message` link appears; click → modal with textarea; Save → closes; toast fires.
  - Turn on Close Friends → segmented `Add / Remove` appears inline.
  - Growth+ banner is one row: icon + copy + CTA on same line. No empty right-column space.
  - Mobile (375): everything stacks. Drawers render as bottom sheets.
  - No console errors.

- [ ] **Step 2** — Fix any visual issues. Commit under `chore(growth-v3): polish pass` if needed.

- [ ] **Step 3** — Update `CHANGELOG.md`. Add above the existing `Growth page v2` entry:

```markdown
---

## 2026-04-24 — Growth page v3 (settings-dashboard rework)

### Changed
- **Filters becomes a summary card + drawer.** In-page view is a single sentence (e.g. `200–50K followers · NSFW excluded`) with a `Customize` button. Full 6-dial UI moves to a focused drawer. Page height stops changing when Custom ranges open
- **Lists becomes a summary card + drawer.** In-page view shows `Whitelist (N) · Blacklist (M)` with a `Manage` button. Tabs + typeahead + entries all live in the drawer
- **Welcome DM textarea moves to a modal.** Engagement card shows an `Edit message` link when enabled; clicking opens a small modal with the textarea, Cancel/Save. Engagement card is now fixed-height for Welcome DM
- **Growth+ compacts to a one-row banner.** Icon + eyebrow + headline + sub copy + `Add Growth+ →` CTA all on one line at `lg:+`. Stacks on mobile. No empty right-column space
- **Grid rebalances** to symmetric `lg:grid-cols-2`: Engagement left, Filters summary + Lists summary stacked right. Equal visual weight
- **Close Friends segmented sub-control** stays inline — small enough (~60px) to keep visible when toggled on

### Created
- `src/pages/growth/FiltersDrawer.jsx`
- `src/pages/growth/ListsDrawer.jsx`
- `src/pages/growth/WelcomeDmModal.jsx`
- `src/pages/growth/filterSummary.js` — `summarizeFilters(filters)` helper

### Rewritten
- `src/pages/growth/FiltersCard.jsx` · `ListsCard.jsx` · `GrowthPlusCard.jsx` · `EngagementCard.jsx` · `index.jsx`

### Unchanged
- `ModeCard.jsx` · `SafetyStrip.jsx` · `PresetRangePills.jsx` · `SettingSwitch.jsx` · `UpgradeBottomSheet.jsx` · all stores and mocks

### Decisions
- **Settings dashboard over form.** Growth config is changed rarely; the page should feel configured, not in-flight. Direct controls for Mode + Engagement (the frequent knobs); summary + drawer for Filters + Lists (the rarer, denser knobs)
- **Fixed-height default, by design.** The only remaining variable-height interaction is Close Friends' segmented sub-control (~60px, one state, acceptable)
- **Growth+ banner borrows the Overview banner's proportions.** Same visual vocabulary across the dashboard; no duplicate hero treatment

---

## 2026-04-24 — Growth page v2 (rework)
```

- [ ] **Step 4** — Update `CONTEXT.md`'s update-log — append:

```markdown
- **2026-04-24 (growth v3)** — Growth page reworked as a settings dashboard. Filters + Lists become summary cards with focused drawers (`FiltersDrawer`, `ListsDrawer`) — page height stops changing when editing complex config. Welcome DM textarea moves to a modal (`WelcomeDmModal`) via an `Edit message` link. Growth+ compacts to a one-row banner matching the Overview banner's proportions. Grid rebalances to symmetric `lg:grid-cols-2` (Engagement left; Filters + Lists summaries stacked right). Only remaining variable-height state is Close Friends' segmented sub-control.
```

- [ ] **Step 5** — Commit docs:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add CHANGELOG.md CONTEXT.md
git commit -m "docs: log Growth page v3 settings-dashboard rework"
```

---

## Spec Coverage

Against `docs/superpowers/specs/2026-04-24-growth-page-v3-design.md`:

- § 1 Page layout → Task 9 (grid + composition).
- § 2 Safety strip → unchanged.
- § 3 Mode card → unchanged.
- § 4 Engagement card (Welcome DM → modal) → Tasks 6 + 7.
- § 5 Filters summary + drawer → Tasks 1 + 2 + 3.
- § 6 Lists summary + drawer → Tasks 4 + 5.
- § 7 Growth+ compact banner → Task 8.
- § 8 Page grid → Task 9.
- § 9 Fixed-height audit → verified in Task 10 walkthrough.
- § 10 File-level diff → distributed across all tasks.
- § 11 Out of scope → intentionally not implemented.
- § 12 Success criteria → Task 10 Step 1 walkthrough.
