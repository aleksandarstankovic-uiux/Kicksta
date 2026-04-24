# Growth Page v4 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Implement Growth page v4 per `docs/superpowers/specs/2026-04-24-growth-page-v4-design.md` — Filters and Lists become visible-state cards with an `Edit` button that opens a modal with local draft + Save/Cancel semantics. Rename Drawer → Modal. Add `replaceLists` bulk action. Delete unused `filterSummary.js`.

**Architecture:** Same file layout as v3 with renames and rewrites. Filters and Lists cards become read-only displays. Their companion modals get local draft state and explicit Save/Cancel footers. No changes to `useGrowthConfig`'s API; one new action on `useLists`.

**Tech Stack:** React 19 · Tailwind 4 · Zustand 5 · Lucide React.

**Testing:** No unit-test framework. Visual verification via Claude Preview after each task. Each task commits.

---

## Conventions

- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- Design tokens only.
- Commit prefix: `feat(growth-v4): …` / `refactor(growth-v4): …` / `chore(growth-v4): …`.
- Path alias `@/` → `src/`.

---

## File Structure

**Modified:**
```
src/pages/growth/FiltersCard.jsx       full rewrite — read-only rows + Edit button
src/pages/growth/ListsCard.jsx         full rewrite — visible lists + Edit button
src/pages/growth/index.jsx             import renames (Drawer → Modal)
src/stores/useLists.js                 add replaceLists bulk action
```

**Renamed + rewritten:**
```
src/pages/growth/FiltersDrawer.jsx  →  src/pages/growth/FiltersModal.jsx
src/pages/growth/ListsDrawer.jsx    →  src/pages/growth/ListsModal.jsx
```

**Deleted:**
```
src/pages/growth/filterSummary.js   (unused after v4)
```

**Unchanged:**
- `src/pages/growth/ModeCard.jsx`, `EngagementCard.jsx`, `WelcomeDmModal.jsx`, `GrowthPlusCard.jsx`, `SafetyStrip.jsx`, `PresetRangePills.jsx`
- `src/components/SettingSwitch.jsx`, `UpgradeBottomSheet.jsx`, `Toast.jsx`
- `src/stores/useGrowthConfig.js`, `useToasts.js`
- All mocks

---

## Task 1: Add `replaceLists` bulk action to `useLists`

**Files:** Modify `src/stores/useLists.js`.

- [ ] **Step 1** — Add the action. Open `src/stores/useLists.js` and find the existing `removeEntry` action. Add a new `replaceLists` action immediately after it.

Use the Edit tool. Find:

```js
  removeEntry: (type, id) => {
    set((state) => ({
      [type]: state[type].filter((e) => e.id !== id),
    }))
    announceSaved()
  },
}))
```

Replace with:

```js
  removeEntry: (type, id) => {
    set((state) => ({
      [type]: state[type].filter((e) => e.id !== id),
    }))
    announceSaved()
  },

  // Bulk replace for the ListsModal Save action — writes both lists
  // atomically and fires one debounced toast.
  replaceLists: (whitelist, blacklist) => {
    set({ whitelist, blacklist })
    announceSaved()
  },
}))
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/stores/useLists.js
git commit -m "feat(growth-v4): useLists.replaceLists bulk action"
```

---

## Task 2: Rename `FiltersDrawer.jsx` → `FiltersModal.jsx` with local draft + Save/Cancel

**Files:**
- Delete: `src/pages/growth/FiltersDrawer.jsx`
- Create: `src/pages/growth/FiltersModal.jsx`

- [ ] **Step 1** — Create `src/pages/growth/FiltersModal.jsx` with this exact content:

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

// Edit filters with local draft state. Cancel discards, Save commits
// the draft to the store via the existing setter API — the debouncer
// collapses the cascade into one "Settings saved." toast.
export default function FiltersModal({ open, onClose, onRequestUpgrade }) {
  const [mounted, setMounted] = useState(false)

  const storedFilters = useGrowthConfig((s) => s.config.filters)
  const setFilter = useGrowthConfig((s) => s.setFilter)
  const toggleExcludeNsfw = useGrowthConfig((s) => s.toggleExcludeNsfw)

  const [draft, setDraft] = useState(storedFilters)

  const genderLocked = mockUser.plan !== 'advanced'

  // Reset the draft every time the modal opens (fresh from store).
  useEffect(() => {
    if (!open) return
    setDraft(storedFilters)
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, storedFilters])

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
    setFilter('followingRange', { min: draft.followingMin, max: draft.followingMax })
    setFilter('followerRange', { min: draft.followerMin, max: draft.followerMax })
    setFilter('mediaRange', { min: draft.mediaMin, max: draft.mediaMax })
    setFilter('accountPrivacy', draft.accountPrivacy)
    setFilter('genderTarget', draft.genderTarget)
    if (draft.excludeNsfw !== storedFilters.excludeNsfw) {
      toggleExcludeNsfw()
    }
    onClose()
  }

  const followingRange = { min: draft.followingMin, max: draft.followingMax }
  const followerRange = { min: draft.followerMin, max: draft.followerMax }
  const mediaRange = { min: draft.mediaMin, max: draft.mediaMax }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit filters"
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
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">Edit filters</h2>
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
          <FilterRow title="Following count" tooltip="People this account follows.">
            <PresetRangePills
              presets={FOLLOWING_PRESETS}
              value={followingRange}
              onChange={(v) =>
                setDraft((d) => ({ ...d, followingMin: v.min, followingMax: v.max }))
              }
            />
          </FilterRow>

          <FilterRow title="Follower count" tooltip="How many followers they have.">
            <PresetRangePills
              presets={FOLLOWER_PRESETS}
              value={followerRange}
              onChange={(v) =>
                setDraft((d) => ({ ...d, followerMin: v.min, followerMax: v.max }))
              }
            />
          </FilterRow>

          <FilterRow title="Media count" tooltip="How many posts they've published.">
            <PresetRangePills
              presets={MEDIA_PRESETS}
              value={mediaRange}
              onChange={(v) =>
                setDraft((d) => ({ ...d, mediaMin: v.min, mediaMax: v.max }))
              }
            />
          </FilterRow>

          <FilterRow title="Account privacy" tooltip="Whether their profile is public or private.">
            <SegmentedPills
              value={draft.accountPrivacy}
              options={PRIVACY_OPTIONS}
              onChange={(v) => setDraft((d) => ({ ...d, accountPrivacy: v }))}
            />
          </FilterRow>

          <FilterRow
            title="Gender target"
            tooltip="Narrow targeting by account gender."
            locked={genderLocked}
            onLockedTap={() => onRequestUpgrade('gender_filter')}
          >
            <SegmentedPills
              value={draft.genderTarget}
              options={GENDER_OPTIONS}
              onChange={(v) => setDraft((d) => ({ ...d, genderTarget: v }))}
            />
          </FilterRow>

          <FilterRow title="Exclude NSFW" tooltip="Skip accounts that appear to contain adult content.">
            <div className="flex justify-end lg:justify-start">
              <button
                type="button"
                role="switch"
                aria-checked={draft.excludeNsfw}
                onClick={() => setDraft((d) => ({ ...d, excludeNsfw: !d.excludeNsfw }))}
                className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
                  draft.excludeNsfw ? 'bg-green-base' : 'bg-border'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    draft.excludeNsfw ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </FilterRow>
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

- [ ] **Step 2** — Delete the old file:

```bash
rm "/Users/aleksandarstankovic/Desktop/Vibe Dash/src/pages/growth/FiltersDrawer.jsx"
```

- [ ] **Step 3** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/FiltersModal.jsx
git add -u src/pages/growth/FiltersDrawer.jsx
git commit -m "feat(growth-v4): FiltersModal with local draft + Save/Cancel (replaces FiltersDrawer)"
```

---

## Task 3: Rename `ListsDrawer.jsx` → `ListsModal.jsx` with local draft + Save/Cancel

**Files:**
- Delete: `src/pages/growth/ListsDrawer.jsx`
- Create: `src/pages/growth/ListsModal.jsx`

- [ ] **Step 1** — Create `src/pages/growth/ListsModal.jsx` with this exact content:

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

const newId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`

// Edit lists with local draft state. Cancel discards all add/remove
// operations, Save replaces the store's whitelist + blacklist
// atomically via useLists.replaceLists.
export default function ListsModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [tab, setTab] = useState('whitelist')
  const [input, setInput] = useState('')
  const [matches, setMatches] = useState([])
  const [pickedMatch, setPickedMatch] = useState(null)

  const storedWhitelist = useLists((s) => s.whitelist)
  const storedBlacklist = useLists((s) => s.blacklist)
  const replaceLists = useLists((s) => s.replaceLists)

  const [draftWhitelist, setDraftWhitelist] = useState(storedWhitelist)
  const [draftBlacklist, setDraftBlacklist] = useState(storedBlacklist)

  const currentTab = TABS.find((t) => t.key === tab)
  const draftEntries = tab === 'whitelist' ? draftWhitelist : draftBlacklist
  const setDraftEntries = tab === 'whitelist' ? setDraftWhitelist : setDraftBlacklist

  const clean = input.replace(/^@/, '').trim()

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setTab('whitelist')
    setInput('')
    setMatches([])
    setPickedMatch(null)
    setDraftWhitelist(storedWhitelist)
    setDraftBlacklist(storedBlacklist)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, storedWhitelist, storedBlacklist])

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
    const duplicate = draftEntries.some(
      (e) => e.username.toLowerCase() === username,
    )
    if (duplicate) {
      useToasts.getState().addToast({
        message: 'Already in list.',
        tone: 'warning',
      })
      return
    }
    const entry = {
      id: newId(tab === 'whitelist' ? 'w' : 'b'),
      username,
      addedAt: new Date().toISOString(),
    }
    setDraftEntries((prev) => [...prev, entry])
    setInput('')
    setPickedMatch(null)
  }

  const handleRemove = (id) => {
    setDraftEntries((prev) => prev.filter((e) => e.id !== id))
  }

  const handleSave = () => {
    replaceLists(draftWhitelist, draftBlacklist)
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
      aria-label="Edit lists"
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
          <h2 className="text-base font-semibold text-text-primary">Edit lists</h2>
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

          <div className="mt-4 flex flex-col divide-y divide-border">
            {draftEntries.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">
                {currentTab.emptyCopy}
              </p>
            )}
            {draftEntries.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <span className="text-sm text-text-primary">{e.username}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(e.id)}
                  aria-label={`Remove ${e.username}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-red-text"
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
```

- [ ] **Step 2** — Delete the old file:

```bash
rm "/Users/aleksandarstankovic/Desktop/Vibe Dash/src/pages/growth/ListsDrawer.jsx"
```

- [ ] **Step 3** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/ListsModal.jsx
git add -u src/pages/growth/ListsDrawer.jsx
git commit -m "feat(growth-v4): ListsModal with local draft + Save/Cancel (replaces ListsDrawer)"
```

---

## Task 4: Rewrite `FiltersCard` as read-only rows + Edit button

**Files:** Modify `src/pages/growth/FiltersCard.jsx`.

- [ ] **Step 1** — Replace the file with:

```jsx
import { Pencil } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import { formatCount } from '@/utils/formatCount'

// v4: Filters is now a read-only display of every filter's current
// value. Each row: label left, value right. Top-right Edit button
// opens FiltersModal which handles the actual editing with a local
// draft + Save/Cancel flow.

function rangeFor(min, max, noun) {
  if ((min === 0 || min == null) && max == null) return 'Any'
  if (min === 0 || min == null) return `Up to ${formatCount(max)} ${noun}`
  if (max == null) return `${formatCount(min)}+ ${noun}`
  return `${formatCount(min)}–${formatCount(max)} ${noun}`
}

function privacyLabel(value) {
  if (value === 'public') return 'Public only'
  if (value === 'private') return 'Private only'
  return 'All'
}

function genderLabel(value) {
  if (value === 'male') return 'Male only'
  if (value === 'female') return 'Female only'
  return 'All'
}

function Row({ label, value, locked = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex items-center gap-2">
        <span
          className={`text-sm ${locked ? 'text-text-secondary' : 'text-text-secondary'}`}
        >
          {label}
        </span>
        {locked && (
          <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
            Advanced
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  )
}

export default function FiltersCard({ onEdit }) {
  const filters = useGrowthConfig((s) => s.config.filters)
  const genderLocked = mockUser.plan !== 'advanced'

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary">Filters</h2>
          <p className="mt-1 text-sm text-text-secondary">Who Kicksta targets.</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
      </div>

      <div className="mt-4 flex flex-col divide-y divide-border">
        <Row
          label="Following count"
          value={rangeFor(filters.followingMin, filters.followingMax, 'following')}
        />
        <Row
          label="Follower count"
          value={rangeFor(filters.followerMin, filters.followerMax, 'followers')}
        />
        <Row
          label="Media count"
          value={rangeFor(filters.mediaMin, filters.mediaMax, 'posts')}
        />
        <Row label="Account privacy" value={privacyLabel(filters.accountPrivacy)} />
        <Row
          label="Gender target"
          value={genderLabel(filters.genderTarget)}
          locked={genderLocked}
        />
        <Row label="Exclude NSFW" value={filters.excludeNsfw ? 'On' : 'Off'} />
      </div>
    </section>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/FiltersCard.jsx
git commit -m "feat(growth-v4): FiltersCard as read-only rows + Edit button"
```

---

## Task 5: Rewrite `ListsCard` as visible lists + Edit button

**Files:** Modify `src/pages/growth/ListsCard.jsx`.

- [ ] **Step 1** — Replace the file with:

```jsx
import { Pencil } from 'lucide-react'
import { useLists } from '@/stores/useLists'

// v4: Lists shows every entry in both Whitelist and Blacklist on the
// page. Top-right Edit button opens ListsModal which handles adds +
// removes with a local draft + Save/Cancel flow.

function ListSection({ title, entries, emptyCopy }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {title} ({entries.length})
      </p>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">{emptyCopy}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {entries.map((e) => (
            <li key={e.id} className="text-sm text-text-primary">
              {e.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ListsCard({ onEdit }) {
  const whitelist = useLists((s) => s.whitelist)
  const blacklist = useLists((s) => s.blacklist)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary">Lists</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Accounts Kicksta never unfollows or always avoids.
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <ListSection
          title="Whitelist"
          entries={whitelist}
          emptyCopy="No accounts whitelisted yet."
        />
        <ListSection
          title="Blacklist"
          entries={blacklist}
          emptyCopy="No accounts blacklisted yet."
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/ListsCard.jsx
git commit -m "feat(growth-v4): ListsCard as visible both-lists display + Edit button"
```

---

## Task 6: Update page shell (`index.jsx`) with renames + prop names

**Files:** Modify `src/pages/growth/index.jsx`.

- [ ] **Step 1** — Replace the file with:

```jsx
import { useState } from 'react'
import SafetyStrip from './SafetyStrip'
import ModeCard from './ModeCard'
import EngagementCard from './EngagementCard'
import FiltersCard from './FiltersCard'
import FiltersModal from './FiltersModal'
import ListsCard from './ListsCard'
import ListsModal from './ListsModal'
import GrowthPlusCard from './GrowthPlusCard'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Growth page v4 layout:
// - Safety strip + Mode take the full width.
// - Engagement (left) beside Filters + Lists read-only cards (right).
//   Filters + Lists are tall because they show all current state.
// - Growth+ closes the page as a compact one-row banner.
// - Filters modal + Lists modal open from each card's Edit button and
//   handle the actual editing with a local draft + Save/Cancel.
// - Welcome DM editing opens a modal from EngagementCard.
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
          Filters + Lists (visible state) stack on the right. */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <EngagementCard onRequestUpgrade={openUpgrade} />
        <div className="flex flex-col gap-4">
          <FiltersCard onEdit={() => setFiltersOpen(true)} />
          <ListsCard onEdit={() => setListsOpen(true)} />
        </div>
      </div>

      <GrowthPlusCard />

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onRequestUpgrade={openUpgrade}
      />
      <ListsModal open={listsOpen} onClose={() => setListsOpen(false)} />
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
git commit -m "feat(growth-v4): page shell wires FiltersModal + ListsModal, prop renames"
```

---

## Task 7: Delete unused `filterSummary.js`

**Files:** Delete `src/pages/growth/filterSummary.js`.

- [ ] **Step 1** — Delete the file:

```bash
rm "/Users/aleksandarstankovic/Desktop/Vibe Dash/src/pages/growth/filterSummary.js"
```

- [ ] **Step 2** — Confirm no remaining imports reference it. Use the Grep tool to search `filterSummary` across the repo; expect zero matches.

- [ ] **Step 3** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add -u src/pages/growth/filterSummary.js
git commit -m "chore(growth-v4): drop unused filterSummary helper"
```

---

## Task 8: Visual verify + docs

**Files:** Any of the above based on visual review; then `CHANGELOG.md` + `CONTEXT.md`.

- [ ] **Step 1** — Controller walks through the preview:
  - Desktop (1280px): Filters card shows all 6 rows with current values (e.g. `500–5K following`, `200–50K followers`, `Up to 10 posts`, `All`, `All`, `On`). Top-right `Edit` button visible.
  - Click Filters `Edit` → modal opens. Tap a preset pill → the pill changes visually in the modal but the page row below doesn't change yet. Click `Cancel` → modal closes, the page row is still the original value.
  - Re-open → change a preset → click `Save` → modal closes, the page row updates, one toast fires.
  - Lists card shows both `Whitelist (N)` and `Blacklist (M)` sections with entries listed vertically. Top-right `Edit` button visible.
  - Click Lists `Edit` → modal opens with tabs, typeahead, and existing entries. Add a new handle via typeahead + Add. Remove another via X. Click `Cancel` → the page card remains unchanged.
  - Re-open → repeat add/remove → click `Save` → modal closes, page card reflects new state, one toast fires.
  - Mode + Engagement still auto-save inline (no change).
  - Mobile (375): everything stacks; modals render as bottom sheets with full-width Cancel + Save in the footer.
  - No console errors.

- [ ] **Step 2** — Fix any visual issues. Commit under `chore(growth-v4): polish pass` if needed.

- [ ] **Step 3** — Update `CHANGELOG.md`. Add above the existing `Growth page v3` entry:

```markdown
---

## 2026-04-24 — Growth page v4 (visible state + edit modals)

### Changed
- **Filters card** becomes a read-only display of every setting (6 rows — Following count · Follower count · Media count · Account privacy · Gender target · Exclude NSFW), each with its current value to the right. Top-right `Edit` button opens a modal
- **Lists card** displays both Whitelist and Blacklist with all entries visible on the page. Top-right `Edit` button opens a modal
- **FiltersModal + ListsModal** now use **local draft state** with explicit **Cancel / Save** footers. Edits don't commit until Save is clicked; Cancel / overlay-tap / Escape discards. One debounced "Settings saved." toast fires on Save
- **Grid stays** `lg:grid-cols-2 lg:items-start` — right column (Filters + Lists) gets taller but column heights don't stretch each other

### Created
- `src/pages/growth/FiltersModal.jsx` (replaces `FiltersDrawer.jsx`)
- `src/pages/growth/ListsModal.jsx` (replaces `ListsDrawer.jsx`)

### Removed
- `src/pages/growth/FiltersDrawer.jsx`
- `src/pages/growth/ListsDrawer.jsx`
- `src/pages/growth/filterSummary.js` (unused after v4)

### Store changes
- `useLists.replaceLists(whitelist, blacklist)` — new bulk action for the ListsModal Save flow

### Decisions
- **Visible state > compact summary.** v3 hid all filter values behind a one-line summary; v4 restores scannability by showing every value
- **Explicit Save/Cancel over auto-save inside the modal.** Matches the "inspect-then-edit" mental model users expect for complex forms; auto-save stays for Mode + Engagement which are direct, single-knob changes
- **No unsaved-changes warning on Cancel.** Reversible data, low risk; the toast system makes save-state obvious. Can add a confirmation later if user behavior shows pain

---
```

- [ ] **Step 4** — Update `CONTEXT.md`'s update log — append:

```markdown
- **2026-04-24 (growth v4)** — Filters and Lists become visible-state cards. All 6 filter values and all whitelist/blacklist entries render on the page as read-only rows. A top-right `Edit` button on each card opens a modal (`FiltersModal` / `ListsModal`) with local draft state and explicit Cancel / Save footers. New `useLists.replaceLists(whitelist, blacklist)` bulk action. `FiltersDrawer.jsx` + `ListsDrawer.jsx` renamed → *Modal. `filterSummary.js` deleted.
```

- [ ] **Step 5** — Commit docs:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add CHANGELOG.md CONTEXT.md
git commit -m "docs: log Growth page v4"
```

---

## Spec Coverage

Against `docs/superpowers/specs/2026-04-24-growth-page-v4-design.md`:

- § 1 Page layout (v3 layout preserved) → Task 6.
- § 2 FiltersCard (read-only rows + Edit button) → Task 4.
- § 3 FiltersModal (local draft + Save/Cancel) → Task 2.
- § 4 ListsCard (visible lists + Edit button) → Task 5.
- § 5 ListsModal (local draft + Save/Cancel) → Task 3 (uses store action from Task 1).
- § 6 File-level diff → distributed across Tasks 1–7.
- § 7 UX consistency checks → verified in Task 8 walkthrough.
- § 8 Out of scope → intentionally not implemented.
- § 9 Success criteria → Task 8 Step 1 walkthrough.
