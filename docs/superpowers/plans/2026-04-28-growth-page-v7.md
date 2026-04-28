# Growth Page v7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the v7 refinement pass — Mode draft+Save, bigger Welcome DM Edit button, full-width Close Friends segmented, Filters audience-reach estimate, Whitelist/Blacklist letter chips + timestamps, scrollable list modals, FiltersModal Min/Max no-jump + quick presets, and Reset to defaults per card behind a confirmation modal.

**Architecture:** Two new shared primitives (`ResetConfirmModal`, `formatRelativeShort`) + a per-page mock formula module (`audienceReach.js`) + a presentational subcomponent (`AudienceReachEstimate`). Each settings card gains a Reset footer wired to a new store action. Mode card adopts a draft+Save pattern matching the existing modal Save/Cancel idiom. FiltersModal renders Min/Max inputs always (disabled when not Custom) so layout is stable regardless of selection.

**Tech Stack:** React 19, Tailwind 4, Zustand 5, Lucide icons. No unit-test framework — verification is visual via Claude Preview MCP plus structural inspection of files.

**Spec:** `docs/superpowers/specs/2026-04-28-growth-page-v7-design.md`

**Verification convention:** Each task ends with a visual verification step at `http://localhost:5173/growth` and a commit. Hard reload between tasks: `window.location.href = '/growth?bust=' + Date.now()`.

---

### Task 1: Shared primitives — `ResetConfirmModal` + `formatRelativeShort`

**Files:**
- Create: `src/components/ResetConfirmModal.jsx`
- Create: `src/utils/formatRelativeShort.js`

These are reused by every settings card (Reset modal) and both list cards (relative timestamps). Build them first so later tasks can `import` them.

- [ ] **Step 1: Create `src/utils/formatRelativeShort.js`**

```js
// Compact relative-time formatter — "5d ago", "2w ago", "1mo ago".
// For UI labels next to settings entries; not meant for activity feeds.
export function formatRelativeShort(iso, now = new Date()) {
  const ms = now - new Date(iso)
  const sec = Math.max(0, Math.floor(ms / 1000))
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)
  const week = Math.floor(day / 7)
  const month = Math.floor(day / 30)
  const year = Math.floor(day / 365)
  if (sec < 60) return 'just now'
  if (min < 60) return `${min}m ago`
  if (hour < 24) return `${hour}h ago`
  if (day < 7) return `${day}d ago`
  if (week < 5) return `${week}w ago`
  if (month < 12) return `${month}mo ago`
  return `${year}y ago`
}
```

- [ ] **Step 2: Create `src/components/ResetConfirmModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

// Reusable confirmation modal for "Reset to defaults" actions on every
// settings card. Same modal animation pattern as everything else on
// the page (mounted state + 2× rAF + translate-y-4 → 0). Mobile bottom
// sheet, desktop centered max-w-md.
//
// Props:
//   open         — boolean, controls visibility
//   onClose      — () => void, dismisses without confirming
//   onConfirm    — () => void, fired when user clicks "Reset to defaults"
//   sectionLabel — string, e.g. "Mode", "Engagement", "Filters", "Whitelist"
export default function ResetConfirmModal({ open, onClose, onConfirm, sectionLabel }) {
  const [mounted, setMounted] = useState(false)

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

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reset ${sectionLabel} to defaults`}
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
          <h2 className="text-base font-semibold text-text-primary">
            Reset {sectionLabel} to defaults?
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-4 text-sm text-text-secondary">
          This will replace your current settings. You can change them again any time.
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
            onClick={handleConfirm}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-red-tint px-5 text-sm font-medium text-red-text transition-opacity hover:opacity-90"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ResetConfirmModal.jsx src/utils/formatRelativeShort.js
git commit -m "feat(components): add ResetConfirmModal + formatRelativeShort helper"
```

---

### Task 2: Store actions — reset variants

**Files:**
- Modify: `src/stores/useGrowthConfig.js`
- Modify: `src/stores/useLists.js`

Adds `resetMode`, `resetEngagement`, `resetFilters` to the growth config store, and `resetWhitelist`, `resetBlacklist` to the lists store. Reset uses a DEFAULTS snapshot from the mock so reset stays consistent even if the seed mutates at runtime.

- [ ] **Step 1: Add resets to `src/stores/useGrowthConfig.js`**

Open `src/stores/useGrowthConfig.js`. Add this DEFAULTS const at the top of the file, immediately after the imports:

```js
// Snapshot the seed shape so resets stay consistent even if `mockGrowthConfig`
// drifts at runtime. Deep-cloned via JSON to break nested-object references.
const DEFAULTS = JSON.parse(JSON.stringify(mockGrowthConfig))
```

Then inside the `create((set, get) => ({ ... }))` body, add the three new actions just before the closing `}))`:

```js
  resetMode: () => {
    set((state) => ({ config: { ...state.config, mode: DEFAULTS.mode } }))
    announceSaved()
  },

  resetEngagement: () => {
    set((state) => ({
      config: {
        ...state.config,
        likeAfterFollow: DEFAULTS.likeAfterFollow,
        welcomeDm: { ...DEFAULTS.welcomeDm },
        closeFriendsAdder: { ...DEFAULTS.closeFriendsAdder },
      },
    }))
    announceSaved()
  },

  resetFilters: () => {
    set((state) => ({
      config: { ...state.config, filters: { ...DEFAULTS.filters } },
    }))
    announceSaved()
  },
```

- [ ] **Step 2: Add resets to `src/stores/useLists.js`**

Open `src/stores/useLists.js`. Add the two new actions inside the create body, alongside the existing `replaceWhitelist` / `replaceBlacklist`:

```js
  resetWhitelist: () => {
    set({ whitelist: [] })
    announceSaved()
  },

  resetBlacklist: () => {
    set({ blacklist: [] })
    announceSaved()
  },
```

- [ ] **Step 3: Visual verify (smoke test)**

Reload `/growth`. The page should still render unchanged — these new store actions are not yet wired to UI (that happens in later tasks). Confirm via the preview that no errors appear in the console.

- [ ] **Step 4: Commit**

```bash
git add src/stores/useGrowthConfig.js src/stores/useLists.js
git commit -m "feat(stores): add reset actions for mode, engagement, filters, lists"
```

---

### Task 3: Audience reach formula + estimate component

**Files:**
- Create: `src/pages/growth/audienceReach.js`
- Create: `src/pages/growth/AudienceReachEstimate.jsx`

The formula module is a pure function over the `filters` object, deterministic, no React. The component renders inside `FiltersCard` and reads its filters from `useGrowthConfig`.

- [ ] **Step 1: Create `src/pages/growth/audienceReach.js`**

```js
// Mock audience-reach estimator. Pure function over the filters object —
// deterministic, no side effects, replaceable with a real API later
// without changing call sites.
//
// Returns { count, pct, hint }:
//   count — estimated matching accounts (clamped to [200, 50000])
//   pct   — bar fill percent in [2, 100]
//   hint  — short copy band that flips by count

const POOL = 50_000

const FOLLOWING_FACTOR = (min, max) => {
  if ((min === 0 || min == null) && max == null) return 1.0
  if (min === 0 && max === 500) return 0.45
  if (min === 0 && max === 5000) return 0.7
  if (min === 500 && max === 5000) return 0.4
  if (min === 5000 && max == null) return 0.25
  // Custom range fallback — interpolate by span / pool size, clamped.
  const lo = min ?? 0
  const hi = max ?? 50000
  return Math.max(0.1, Math.min(0.9, (hi - lo) / 50000))
}

const FOLLOWER_FACTOR = (min, max) => {
  if ((min === 0 || min == null) && max == null) return 1.0
  if (min === 0 && max === 1000) return 0.5
  if (min === 0 && max === 5000) return 0.7
  if (min === 1000 && max === 50000) return 0.55
  if (min === 50000 && max == null) return 0.15
  const lo = min ?? 0
  const hi = max ?? 100000
  return Math.max(0.1, Math.min(0.9, (hi - lo) / 100000))
}

const MEDIA_FACTOR = (min, max) => {
  if ((min === 0 || min == null) && max == null) return 1.0
  if (min === 0 && max === 10) return 0.6
  if (min === 10 && max === 100) return 0.55
  if (min === 100 && max == null) return 0.35
  return 0.7
}

const PRIVACY_FACTOR = (v) => (v === 'public' ? 0.7 : v === 'private' ? 0.3 : 1.0)
const GENDER_FACTOR = (v) => (v == null ? 1.0 : 0.5)
const NSFW_FACTOR = (excludeNsfw) => (excludeNsfw ? 0.92 : 1.0)

export function estimateAudienceReach(filters) {
  const factor =
    FOLLOWING_FACTOR(filters.followingMin, filters.followingMax) *
    FOLLOWER_FACTOR(filters.followerMin, filters.followerMax) *
    MEDIA_FACTOR(filters.mediaMin, filters.mediaMax) *
    PRIVACY_FACTOR(filters.accountPrivacy) *
    GENDER_FACTOR(filters.genderTarget) *
    NSFW_FACTOR(filters.excludeNsfw)
  const raw = Math.round(POOL * factor)
  const count = Math.max(200, Math.min(POOL, raw))
  const pct = Math.max(2, Math.min(100, Math.round((count / POOL) * 100)))
  let hint
  if (count < 500) hint = 'Filters are very tight — consider widening one.'
  else if (count < 2000) hint = 'Tight focus.'
  else if (count < 20000) hint = 'Healthy reach.'
  else hint = 'Wide reach — consider narrowing for relevance.'
  return { count, pct, hint }
}
```

- [ ] **Step 2: Create `src/pages/growth/AudienceReachEstimate.jsx`**

```jsx
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { formatCount } from '@/utils/formatCount'
import { estimateAudienceReach } from './audienceReach'

// Settings-derived audience reach indicator. Renders at the bottom of
// the FiltersCard. Updates automatically when any filter dial changes.
export default function AudienceReachEstimate() {
  const filters = useGrowthConfig((s) => s.config.filters)
  const { count, pct, hint } = estimateAudienceReach(filters)

  return (
    <div className="mt-4 rounded-lg bg-bg p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Estimated audience
      </p>
      <p className="mt-1 text-sm font-medium text-text-primary">
        ~{formatCount(count)} accounts match your filters
      </p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-blue-base transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-text-muted">{hint}</p>
    </div>
  )
}
```

- [ ] **Step 3: Commit (component not yet rendered — wired in Task 4)**

```bash
git add src/pages/growth/audienceReach.js src/pages/growth/AudienceReachEstimate.jsx
git commit -m "feat(growth): add audience-reach formula + estimate component"
```

---

### Task 4: `FiltersCard` — wire AudienceReachEstimate + Reset footer

**Files:**
- Modify: `src/pages/growth/FiltersCard.jsx`

- [ ] **Step 1: Read the current file to confirm structure**

Read `src/pages/growth/FiltersCard.jsx`. The file currently imports lucide icons + `useGrowthConfig` + `mockUser` + `formatCount` + `CardChip` + `InfoTooltip`, exports a default function with helpers (`rangeFor`, `privacyLabel`, `genderLabel`, `Row`, `GroupHeader`) and a section with two grouped row blocks.

- [ ] **Step 2: Replace `src/pages/growth/FiltersCard.jsx`**

```jsx
import { useState } from 'react'
import { Pencil, SlidersHorizontal } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import { formatCount } from '@/utils/formatCount'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import ResetConfirmModal from '@/components/ResetConfirmModal'
import AudienceReachEstimate from './AudienceReachEstimate'

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
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-sm text-text-secondary">{label}</span>
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

function GroupHeader({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </p>
  )
}

export default function FiltersCard({ onEdit }) {
  const filters = useGrowthConfig((s) => s.config.filters)
  const resetFilters = useGrowthConfig((s) => s.resetFilters)
  const genderLocked = mockUser.plan !== 'advanced'
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <CardChip color="yellow" icon={SlidersHorizontal} />
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">Filters</h2>
            <InfoTooltip text="Who Kicksta targets." />
          </div>
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

      <div className="mt-4">
        <GroupHeader>Audience size</GroupHeader>
        <div className="mt-1 flex flex-col divide-y divide-border">
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
        </div>
      </div>

      <div className="mt-4">
        <GroupHeader>Account type</GroupHeader>
        <div className="mt-1 flex flex-col divide-y divide-border">
          <Row label="Account privacy" value={privacyLabel(filters.accountPrivacy)} />
          <Row
            label="Gender target"
            value={genderLabel(filters.genderTarget)}
            locked={genderLocked}
          />
          <Row label="Exclude NSFW" value={filters.excludeNsfw ? 'On' : 'Off'} />
        </div>
      </div>

      <AudienceReachEstimate />

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          Reset to defaults
        </button>
      </div>

      <ResetConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => resetFilters()}
        sectionLabel="Filters"
      />
    </section>
  )
}
```

- [ ] **Step 3: Visual verify**

Reload `/growth`. In the Filters card:
- Below the last row, an `Estimated audience` block renders with the eyebrow, count line, blue progress bar, and hint copy.
- A small `Reset to defaults` ghost link sits below the estimate, right-aligned.
- Click the link → `ResetConfirmModal` opens with header "Reset Filters to defaults?" and a red-tint Reset button.
- Click `Reset to defaults` in the modal → filters revert to seeds, modal closes, the estimate updates immediately.
- Click `Cancel` (or Escape, or overlay click) → modal closes without changes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/growth/FiltersCard.jsx
git commit -m "feat(growth): FiltersCard appends audience-reach estimate + reset footer"
```

---

### Task 5: `FiltersModal` — Min/Max always render + quick presets

**Files:**
- Modify: `src/pages/growth/FiltersModal.jsx`

Two changes:
- `RangeDropdown` renders Min/Max inputs always; they are disabled (greyed) when the dropdown isn't on Custom. Removes the height jump.
- A new `Quick presets` row sits above the two-column grid with three pills that set all 6 filter dials at once on the draft.

- [ ] **Step 1: Replace `src/pages/growth/FiltersModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { ChevronDown, User, Users, X } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import InfoTooltip from '@/components/InfoTooltip'
import SettingSwitch from '@/components/SettingSwitch'

const FOLLOWING_PRESETS = [
  { key: 'any', label: 'Any', min: 0, max: null },
  { key: 'low', label: 'Up to 500', min: 0, max: 500 },
  { key: 'mid', label: '500 – 5,000', min: 500, max: 5000 },
  { key: 'high', label: '5,000+', min: 5000, max: null },
]

const FOLLOWER_PRESETS = [
  { key: 'any', label: 'Any', min: 0, max: null },
  { key: 'low', label: 'Up to 1,000', min: 0, max: 1000 },
  { key: 'mid', label: '1,000 – 50,000', min: 1000, max: 50000 },
  { key: 'high', label: '50,000+', min: 50000, max: null },
]

const MEDIA_PRESETS = [
  { key: 'any', label: 'Any', min: 0, max: null },
  { key: 'low', label: 'Up to 10', min: 0, max: 10 },
  { key: 'mid', label: '10 – 100', min: 10, max: 100 },
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

// One-click presets that apply to ALL 6 filter dials at once.
// Tapping a preset writes the full set to draft; user still has to
// click Save to commit.
const QUICK_PRESETS = [
  {
    key: 'most_users',
    label: 'Most users',
    values: {
      followingMin: 0,
      followingMax: 5000,
      followerMin: 1000,
      followerMax: 50000,
      mediaMin: 10,
      mediaMax: null,
      accountPrivacy: 'all',
      genderTarget: null,
      excludeNsfw: true,
    },
  },
  {
    key: 'niche',
    label: 'Niche audience',
    values: {
      followingMin: 0,
      followingMax: 500,
      followerMin: 0,
      followerMax: 5000,
      mediaMin: 10,
      mediaMax: null,
      accountPrivacy: 'public',
      genderTarget: null,
      excludeNsfw: true,
    },
  },
  {
    key: 'macro',
    label: 'Macro reach',
    values: {
      followingMin: 5000,
      followingMax: null,
      followerMin: 50000,
      followerMax: null,
      mediaMin: 100,
      mediaMax: null,
      accountPrivacy: 'all',
      genderTarget: null,
      excludeNsfw: true,
    },
  },
]

// Find the preset matching the current min/max, or return 'custom' if no match.
function presetKeyFor(presets, min, max) {
  const found = presets.find((p) => (p.min ?? 0) === (min ?? 0) && (p.max ?? null) === (max ?? null))
  return found ? found.key : 'custom'
}

function RangeDropdown({ label, tooltip, presets, min, max, onChange }) {
  const currentKey = presetKeyFor(presets, min, max)
  const isCustom = currentKey === 'custom'

  const handleSelect = (e) => {
    const key = e.target.value
    if (key === 'custom') {
      // Stay on the current min/max; flip the dropdown by writing values
      // that won't match any preset. The simplest stable trick is to
      // bump the max by 1 if it currently matches a preset; otherwise
      // leave the values as-is.
      onChange({ min: min ?? 0, max: max ?? null })
      return
    }
    const preset = presets.find((p) => p.key === key)
    if (preset) {
      onChange({ min: preset.min, max: preset.max })
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <InfoTooltip text={tooltip} />
      </div>
      <div className="relative">
        <select
          value={currentKey}
          onChange={handleSelect}
          className="h-10 w-full appearance-none rounded-lg border border-border bg-surface px-3 pr-9 text-sm text-text-primary focus:border-blue-base focus:outline-none"
        >
          {presets.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom…</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
      </div>
      {/* Min/Max inputs render in BOTH states. Disabled when not Custom
          so the dropdown row height stays constant — no layout jump
          when the user picks Custom. */}
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          value={isCustom ? (min ?? '') : ''}
          disabled={!isCustom}
          onChange={(e) =>
            onChange({
              min: e.target.value === '' ? null : Number(e.target.value),
              max,
            })
          }
          placeholder="Min"
          className={`h-10 flex-1 rounded-lg border border-border px-3 text-sm outline-none ${
            isCustom
              ? 'bg-surface text-text-primary focus:border-blue-base'
              : 'cursor-not-allowed bg-bg text-text-muted'
          }`}
        />
        <input
          type="number"
          value={isCustom ? (max ?? '') : ''}
          disabled={!isCustom}
          onChange={(e) =>
            onChange({
              min,
              max: e.target.value === '' ? null : Number(e.target.value),
            })
          }
          placeholder="Max"
          className={`h-10 flex-1 rounded-lg border border-border px-3 text-sm outline-none ${
            isCustom
              ? 'bg-surface text-text-primary focus:border-blue-base'
              : 'cursor-not-allowed bg-bg text-text-muted'
          }`}
        />
      </div>
    </div>
  )
}

function SegmentedField({ label, tooltip, value, options, onChange, locked = false, onLockedTap }) {
  return (
    <div
      className={locked ? 'cursor-pointer' : ''}
      onClick={locked ? onLockedTap : undefined}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <InfoTooltip text={tooltip} />
        {locked && (
          <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
            Advanced
          </span>
        )}
      </div>
      <div className={locked ? 'pointer-events-none opacity-60' : ''}>
        <div className="inline-flex w-full rounded-full bg-bg p-1">
          {options.map((o) => {
            const selected = value === o.value
            return (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => onChange(o.value)}
                className={`inline-flex h-9 flex-1 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors ${
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
      </div>
    </div>
  )
}

function ColumnHeader({ icon: Icon, children }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {children}
      </span>
    </div>
  )
}

export default function FiltersModal({ open, onClose, onRequestUpgrade }) {
  const [mounted, setMounted] = useState(false)

  const storedFilters = useGrowthConfig((s) => s.config.filters)
  const setFilter = useGrowthConfig((s) => s.setFilter)
  const toggleExcludeNsfw = useGrowthConfig((s) => s.toggleExcludeNsfw)

  const [draft, setDraft] = useState(storedFilters)

  const genderLocked = mockUser.plan !== 'advanced'

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

  const applyPreset = (preset) => {
    setDraft((d) => ({ ...d, ...preset.values }))
  }

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

        <div className="flex-1 overflow-y-auto px-5 py-4 lg:px-6 lg:py-6">
          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Quick presets
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {QUICK_PRESETS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => applyPreset(p)}
                  className="inline-flex h-9 items-center rounded-full bg-bg px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-blue-tint hover:text-blue-text"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Left column — Audience size */}
            <div>
              <ColumnHeader icon={Users}>Audience size</ColumnHeader>
              <div className="flex flex-col gap-5">
                <RangeDropdown
                  label="Following count"
                  tooltip="People this account follows."
                  presets={FOLLOWING_PRESETS}
                  min={draft.followingMin}
                  max={draft.followingMax}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, followingMin: v.min, followingMax: v.max }))
                  }
                />
                <RangeDropdown
                  label="Follower count"
                  tooltip="How many followers they have."
                  presets={FOLLOWER_PRESETS}
                  min={draft.followerMin}
                  max={draft.followerMax}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, followerMin: v.min, followerMax: v.max }))
                  }
                />
                <RangeDropdown
                  label="Media count"
                  tooltip="How many posts they've published."
                  presets={MEDIA_PRESETS}
                  min={draft.mediaMin}
                  max={draft.mediaMax}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, mediaMin: v.min, mediaMax: v.max }))
                  }
                />
              </div>
            </div>

            {/* Right column — Account type */}
            <div className="mt-6 lg:mt-0">
              <ColumnHeader icon={User}>Account type</ColumnHeader>
              <div className="flex flex-col gap-5">
                <SegmentedField
                  label="Account privacy"
                  tooltip="Whether their profile is public or private."
                  value={draft.accountPrivacy}
                  options={PRIVACY_OPTIONS}
                  onChange={(v) => setDraft((d) => ({ ...d, accountPrivacy: v }))}
                />
                <SegmentedField
                  label="Gender target"
                  tooltip="Narrow targeting by account gender."
                  value={draft.genderTarget}
                  options={GENDER_OPTIONS}
                  onChange={(v) => setDraft((d) => ({ ...d, genderTarget: v }))}
                  locked={genderLocked}
                  onLockedTap={() => onRequestUpgrade('gender_filter')}
                />
                <SettingSwitch
                  title="Exclude NSFW"
                  description="Skip accounts that appear to contain adult content."
                  checked={draft.excludeNsfw}
                  onChange={() => setDraft((d) => ({ ...d, excludeNsfw: !d.excludeNsfw }))}
                />
              </div>
            </div>
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

- [ ] **Step 2: Visual verify**

Reload `/growth`, click Edit on the Filters card. Confirm:
- Above the two columns, a `QUICK PRESETS` row with three pills (`Most users`, `Niche audience`, `Macro reach`).
- Click `Niche audience` → all 6 dials update at once on the draft (Following dropdown shows "Up to 500", Follower shows "Up to 1,000", Privacy shows "Public" selected, etc.). Click Save → estimate at the bottom of FiltersCard updates.
- For each range field, switching from a preset to "Custom…" no longer changes the row's height. The Min/Max inputs are always present, greyed when not Custom, editable when Custom is selected.
- Both columns stay the same height regardless of which range is on Custom.

- [ ] **Step 3: Commit**

```bash
git add src/pages/growth/FiltersModal.jsx
git commit -m "refactor(growth): FiltersModal — Min/Max always render + quick presets row"
```

---

### Task 6: `ModeCard` — draft + Save/Cancel + Reset footer

**Files:**
- Modify: `src/pages/growth/ModeCard.jsx`

Mode becomes a draft action. Saved style stays solid blue; staged-but-unsaved style is dashed blue + light tint. Save commits + fires the toast; Cancel reverts. Reset link in the footer opens the confirm modal.

- [ ] **Step 1: Replace `src/pages/growth/ModeCard.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Check, Settings2, Shield, UserMinus, UserPlus, Zap } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import ResetConfirmModal from '@/components/ResetConfirmModal'

const MODES = [
  {
    value: 'auto',
    label: 'Auto',
    icon: Zap,
    iconCls: 'bg-green-tint text-green-text',
    recommended: true,
    description:
      'Follow new users, like their posts, then unfollow after a period. The complete growth loop — recommended for most users.',
  },
  {
    value: 'follow_only',
    label: 'Follow-only',
    icon: UserPlus,
    iconCls: 'bg-blue-tint text-blue-text',
    recommended: false,
    description:
      'Follow new users from your targets. No unfollows. Use when you want to build a following list manually.',
  },
  {
    value: 'unfollow_only',
    label: 'Unfollow-only',
    icon: UserMinus,
    iconCls: 'bg-bg text-text-secondary',
    recommended: false,
    description:
      "Clean up users who didn't follow back. No new follows. Good for trimming a bloated following count.",
  },
]

export default function ModeCard() {
  const savedMode = useGrowthConfig((s) => s.config.mode)
  const setMode = useGrowthConfig((s) => s.setMode)
  const resetMode = useGrowthConfig((s) => s.resetMode)

  const [draft, setDraft] = useState(savedMode)
  const [resetOpen, setResetOpen] = useState(false)

  // Sync draft when the saved value changes from outside (e.g. reset).
  useEffect(() => {
    setDraft(savedMode)
  }, [savedMode])

  const dirty = draft !== savedMode

  const handleSave = () => {
    setMode(draft)
  }

  const handleCancel = () => {
    setDraft(savedMode)
  }

  return (
    <section className="mt-4 rounded-xl border border-border bg-surface p-4 lg:p-5">
      {/* Header row — chip + title + tooltip + within-IG-limits pill inline.
          When dirty, Save mode + Cancel buttons appear at the right end.
          Wraps to a new line on narrow viewports. */}
      <div className="flex flex-wrap items-center gap-3">
        <CardChip color="blue" icon={Settings2} />
        <h2 className="text-base font-semibold text-text-primary">Mode</h2>
        <InfoTooltip text="How Kicksta grows your account. You can change this any time." />
        <span className="inline-flex items-center gap-1 rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
          <Check className="h-3 w-3" aria-hidden="true" />
          Within IG limits
        </span>

        {dirty && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-bg px-3 text-sm font-medium text-text-primary hover:opacity-90"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Save mode
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {MODES.map((m) => {
          const isSaved = savedMode === m.value
          const isStaged = !isSaved && draft === m.value
          const Icon = m.icon
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setDraft(m.value)}
              className={`relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all lg:p-5 ${
                isSaved
                  ? 'border-blue-base bg-blue-tint/40 shadow-sm'
                  : isStaged
                    ? 'border-blue-base border-dashed bg-blue-tint/20'
                    : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              {isSaved && (
                <Check
                  className="absolute right-3 top-3 h-4 w-4 text-blue-base"
                  aria-hidden="true"
                />
              )}

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.iconCls}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">
                  {m.label}
                </span>
                {m.recommended && (
                  <span className="rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
                    Recommended
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed text-text-secondary">
                {m.description}
              </p>
            </button>
          )
        })}
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          Reset to defaults
        </button>
      </div>

      <ResetConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => resetMode()}
        sectionLabel="Mode"
      />
    </section>
  )
}
```

The `Shield` icon import was previously used for the inline safety footer that v6 removed; v7 doesn't need it either. Keep the import list lean — `Shield` is no longer imported in this version.

- [ ] **Step 2: Visual verify**

Reload `/growth`. In the Mode card:
- Click `Follow-only` → the card border becomes dashed blue, light tint, no Check icon. The currently-saved card (`Auto`) keeps its solid blue selected style. Two buttons appear at the right end of the header: ghost `Cancel` + filled blue `Save mode`.
- Click `Cancel` → buttons disappear, dashed staged style reverts to default, `Auto` stays selected.
- Click `Follow-only` again, then `Save mode` → toast fires, `Follow-only` becomes the new saved card (solid blue, Check icon), buttons disappear.
- Click `Reset to defaults` (footer link) → `ResetConfirmModal` opens with header "Reset Mode to defaults?". Click `Reset to defaults` in the modal → mode reverts to `auto`, modal closes.

- [ ] **Step 3: Commit**

```bash
git add src/pages/growth/ModeCard.jsx
git commit -m "feat(growth): ModeCard adopts draft+Save pattern + reset footer"
```

---

### Task 7: `EngagementCard` — full-width segmented + bigger Edit button + Reset footer

**Files:**
- Modify: `src/pages/growth/EngagementCard.jsx`
- Modify: `src/pages/growth/WelcomeDmPreview.jsx`

Three changes in this task:
1. Welcome DM `Edit message` button: `h-8 px-3 text-xs` → `h-10 px-4 text-sm`.
2. Close Friends segmented control: `inline-flex` (intrinsic width) → `flex w-full` with `flex-1` on each pill (50/50 split).
3. Engagement card gets a `Reset to defaults` footer link wired to `resetEngagement()`.

- [ ] **Step 1: Update `src/pages/growth/WelcomeDmPreview.jsx`**

Open the file and replace the `<button>` block with a bigger version. Find this:

```jsx
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-base px-3 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
            Edit message
          </button>
```

Replace with:

```jsx
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
            Edit message
          </button>
```

The placeholder `<span>` in the off-state stays unchanged — it's a different element (a muted text label, not a button).

- [ ] **Step 2: Replace `src/pages/growth/EngagementCard.jsx`**

```jsx
import { useState } from 'react'
import { Handshake, Heart, MessageSquare, Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import ResetConfirmModal from '@/components/ResetConfirmModal'
import WelcomeDmModal from './WelcomeDmModal'
import WelcomeDmPreview from './WelcomeDmPreview'
import CloseFriendsProgress from './CloseFriendsProgress'

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
    resetEngagement,
  } = useGrowthConfig()

  const [dmModalOpen, setDmModalOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const welcomeLocked = isLocked('welcome_dm', mockUser)
  const closeFriendsLocked = isLocked('close_friends', mockUser)

  const showPreview = config.welcomeDm.enabled && !welcomeLocked
  const cfEnabled = config.closeFriendsAdder.enabled
  const cfMode = config.closeFriendsAdder.mode
  const showCfControls = cfEnabled && !closeFriendsLocked

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <CardChip color="green" icon={Handshake} />
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">Engagement</h2>
          <InfoTooltip text="How Kicksta interacts with new followers." />
        </div>
      </div>

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
          <WelcomeDmPreview
            enabled={showPreview}
            message={config.welcomeDm.message}
            onEdit={() => setDmModalOpen(true)}
          />
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
          {/* Segmented control fills the row width — `flex w-full` + `flex-1`
              on each pill splits the row 50/50. Greyed when toggle is off. */}
          <div className="pb-3 pt-1">
            <div
              className={`flex w-full rounded-full bg-bg p-1 ${
                showCfControls ? '' : 'opacity-60'
              }`}
              aria-disabled={!showCfControls}
            >
              {CF_MODES.map((m) => {
                const selected = cfMode === m.value
                return (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setCloseFriendsMode(m.value)}
                    disabled={!showCfControls}
                    className={`inline-flex h-8 flex-1 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
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
            <CloseFriendsProgress mode={cfMode} enabled={showCfControls} />
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          Reset to defaults
        </button>
      </div>

      <WelcomeDmModal open={dmModalOpen} onClose={() => setDmModalOpen(false)} />
      <ResetConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => resetEngagement()}
        sectionLabel="Engagement"
      />
    </section>
  )
}
```

- [ ] **Step 3: Visual verify**

Reload `/growth`. In the Engagement card:
- Toggle Welcome DM on → chat-bubble preview appears + a clearly larger blue `Edit message` button.
- Toggle Close Friends on → segmented control now fills the full row width with two equal pills; clicking either swaps the verb in the ticker line.
- Click `Reset to defaults` (footer link) → confirmation modal opens with header "Reset Engagement to defaults?".
- Click `Reset to defaults` inside the modal → all three toggles revert to seed values, modal closes, toast fires once.

- [ ] **Step 4: Commit**

```bash
git add src/pages/growth/EngagementCard.jsx src/pages/growth/WelcomeDmPreview.jsx
git commit -m "feat(growth): EngagementCard full-width segmented + bigger DM button + reset"
```

---

### Task 8: `WhitelistCard` + `BlacklistCard` — letter chips, timestamps, reset

**Files:**
- Modify: `src/pages/growth/WhitelistCard.jsx`
- Modify: `src/pages/growth/BlacklistCard.jsx`

Each row becomes `[Letter chip] @username … added Xd ago`. Each card gains a `Reset to defaults` footer link.

- [ ] **Step 1: Replace `src/pages/growth/WhitelistCard.jsx`**

```jsx
import { useState } from 'react'
import { Pencil, ShieldCheck } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import ResetConfirmModal from '@/components/ResetConfirmModal'
import { formatRelativeShort } from '@/utils/formatRelativeShort'

function letterFor(username) {
  return String(username).replace(/^@/, '').charAt(0).toUpperCase() || '·'
}

export default function WhitelistCard({ onEdit }) {
  const whitelist = useLists((s) => s.whitelist)
  const resetWhitelist = useLists((s) => s.resetWhitelist)
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CardChip color="green" icon={ShieldCheck} />
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">Whitelist</h2>
            <InfoTooltip text="Accounts Kicksta will never unfollow." />
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit whitelist"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {whitelist.length} {whitelist.length === 1 ? 'account' : 'accounts'} protected
      </p>
      {whitelist.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">No accounts protected yet.</p>
      ) : (
        <ul className="mt-2 flex flex-col">
          {whitelist.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg text-xs font-semibold text-text-secondary">
                {letterFor(e.username)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                {e.username}
              </span>
              <span className="shrink-0 text-xs text-text-muted">
                added {formatRelativeShort(e.addedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          Reset to defaults
        </button>
      </div>

      <ResetConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => resetWhitelist()}
        sectionLabel="Whitelist"
      />
    </section>
  )
}
```

- [ ] **Step 2: Replace `src/pages/growth/BlacklistCard.jsx`**

```jsx
import { useState } from 'react'
import { Ban, Pencil } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import ResetConfirmModal from '@/components/ResetConfirmModal'
import { formatRelativeShort } from '@/utils/formatRelativeShort'

function letterFor(username) {
  return String(username).replace(/^@/, '').charAt(0).toUpperCase() || '·'
}

export default function BlacklistCard({ onEdit }) {
  const blacklist = useLists((s) => s.blacklist)
  const resetBlacklist = useLists((s) => s.resetBlacklist)
  const [resetOpen, setResetOpen] = useState(false)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CardChip color="neutral" icon={Ban} />
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">Blacklist</h2>
            <InfoTooltip text="Accounts Kicksta will never follow." />
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit blacklist"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {blacklist.length} {blacklist.length === 1 ? 'account' : 'accounts'} blocked
      </p>
      {blacklist.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">No accounts blocked yet.</p>
      ) : (
        <ul className="mt-2 flex flex-col">
          {blacklist.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-1.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg text-xs font-semibold text-text-secondary">
                {letterFor(e.username)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                {e.username}
              </span>
              <span className="shrink-0 text-xs text-text-muted">
                added {formatRelativeShort(e.addedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          Reset to defaults
        </button>
      </div>

      <ResetConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => resetBlacklist()}
        sectionLabel="Blacklist"
      />
    </section>
  )
}
```

- [ ] **Step 3: Visual verify**

Reload `/growth`. Both list cards show:
- Each row: muted-circle letter chip on the left, `@username` middle, `added Xd ago` (or `2w ago` etc.) right-aligned.
- A `Reset to defaults` ghost link in the footer of each card.
- Clicking the link opens a confirm modal with header "Reset Whitelist to defaults?" / "Reset Blacklist to defaults?".
- Confirming clears the list to empty; the count line flips to "0 accounts protected" / "0 accounts blocked" and the empty-state copy appears.

- [ ] **Step 4: Commit**

```bash
git add src/pages/growth/WhitelistCard.jsx src/pages/growth/BlacklistCard.jsx
git commit -m "feat(growth): list cards — letter chips + timestamps + reset footer"
```

---

### Task 9: `WhitelistModal` + `BlacklistModal` — scrollable entries list

**Files:**
- Modify: `src/pages/growth/WhitelistModal.jsx`
- Modify: `src/pages/growth/BlacklistModal.jsx`

Cap the entries-list container at `max-h-72` and let it scroll internally. Header + typeahead row + Save/Cancel footer stay pinned because they live outside this container.

- [ ] **Step 1: Update `src/pages/growth/WhitelistModal.jsx`**

Open the file and find the entries-list container — it looks like:

```jsx
          <div className="mt-4 flex flex-col divide-y divide-border">
```

Replace with:

```jsx
          <div className="mt-4 flex max-h-72 flex-col divide-y divide-border overflow-y-auto">
```

- [ ] **Step 2: Update `src/pages/growth/BlacklistModal.jsx`**

Same change — find:

```jsx
          <div className="mt-4 flex flex-col divide-y divide-border">
```

Replace with:

```jsx
          <div className="mt-4 flex max-h-72 flex-col divide-y divide-border overflow-y-auto">
```

- [ ] **Step 3: Visual verify**

Reload `/growth`. Open the Whitelist modal:
- With the seed 5 entries, no scrollbar yet (288px cap not exceeded).
- Add 5+ entries via the typeahead → entries list develops an internal scrollbar; modal outer height stays bounded by `max-h-[85vh]`.
- The typeahead input + Add button + Save/Cancel footer stay pinned at modal edges; only the entries scroll.
- Same behavior in the Blacklist modal.

- [ ] **Step 4: Commit**

```bash
git add src/pages/growth/WhitelistModal.jsx src/pages/growth/BlacklistModal.jsx
git commit -m "fix(growth): list modals — entries list scrolls inside max-h-72"
```

---

### Task 10: CHANGELOG + CONTEXT updates

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `CONTEXT.md`

- [ ] **Step 1: Prepend a CHANGELOG entry**

In `CHANGELOG.md`, immediately above the existing top entry (`## 2026-04-27 — Growth page v6 …`), insert:

```markdown
## 2026-04-28 — Growth page v7 (refinement pass)

### Changed
- **Mode card** — selecting a mode is now a draft; saved mode keeps the solid-blue selected style, the staged-but-unsaved mode gets a dashed-blue border + light tint. Save mode + Cancel buttons appear in the header only when draft differs from saved. Save fires the existing debounced toast.
- **Welcome DM** edit button — bumped to `h-10 px-4 text-sm` (was `h-8 px-3 text-xs`). Matches FiltersModal Save and Mode Save sizes.
- **Close Friends segmented control** — now fills the row width (`flex w-full` with `flex-1` pills) so the two options split the row evenly.
- **Filters card** — appended an `Estimated audience` footer block with a count (e.g. `~12,400 accounts match your filters`), a horizontal blue progress bar (settings-derived), and a banded hint sentence. Pure mock formula in `audienceReach.js` — replaceable with a real API later without changing call sites.
- **Whitelist + Blacklist cards** — each row now shows `[Letter chip] @username · added Xd ago`. Letter chip is a 24×24 muted circle. Timestamp uses a new `formatRelativeShort` helper (compact `5d ago` / `2w ago` / `1mo ago`).
- **FiltersModal Custom range** — Min/Max inputs now render in BOTH states (greyed/disabled when not Custom; editable when Custom). Removes the height jump that pushed one column taller than the other.
- **FiltersModal quick presets** — three pills above the two columns (`Most users`, `Niche audience`, `Macro reach`) write all 9 filter values to the draft at once. Save still required to commit.
- **Whitelist + Blacklist modals** — entries list now caps at `max-h-72` and scrolls internally when many entries are added; header + typeahead + Save/Cancel stay pinned.

### Created
- `src/components/ResetConfirmModal.jsx` — reusable confirmation for the new Reset to defaults action on every settings card. `bg-red-tint text-red-text` ghost-destructive button per CLAUDE.md.
- `src/utils/formatRelativeShort.js` — compact relative-time formatter for settings-row timestamps.
- `src/pages/growth/audienceReach.js` — pure deterministic estimator over the filters object.
- `src/pages/growth/AudienceReachEstimate.jsx` — UI block consuming the estimator.
- New store actions: `resetMode`, `resetEngagement`, `resetFilters` on `useGrowthConfig`; `resetWhitelist`, `resetBlacklist` on `useLists`.

### Decisions
- **Reset semantics for lists** — Reset clears Whitelist/Blacklist to empty, not back to the seed. Seed is for visual richness on a fresh page; "reset" semantically means "remove my customizations."
- **Custom dropdown when not Custom** — Min/Max inputs show empty values (not the underlying min/max) when the dropdown isn't on Custom. The greyed disabled state communicates "pick Custom to edit." Switching to Custom initialises from whatever the previous preset set the underlying values to.
- **Mode draft sync** — `useEffect` syncs draft from saved mode when saved mode changes externally (e.g. via Reset). Keeps the staged style in lockstep with the store.
```

- [ ] **Step 2: Update Growth section in `CONTEXT.md`**

Find `### Growth (`/growth`, `src/pages/growth/`) — v6` and replace the entire section with:

```markdown
### Growth (`/growth`, `src/pages/growth/`) — v7

Settings dashboard with unified chrome and per-card draft/reset patterns. Every card leads with a tinted `CardChip` + title + `InfoTooltip` (no subtitles). Mode is a draft+Save pattern; Engagement uses auto-save toggles; Filters/Whitelist/Blacklist use Edit modals. Every card has a `Reset to defaults` ghost link in its footer behind a confirmation modal.

**Layout (desktop):**
```
H1 "Growth"
ModeCard (full width, chip + tooltip + within-IG-limits pill + 3 mode options + Save/Cancel when dirty + reset footer)
┌── Engagement (left, green chip) ──┬── Filters (right, yellow chip) ──┐
│   Welcome DM preview              │  Audience size                    │
│   Close Friends progress (full)   │  Account type                     │
│   Reset footer                    │  Estimated audience block         │
│                                   │  Reset footer                     │
├── Whitelist (left, green chip) ───┼── Blacklist (right, neutral) ─────┤
│   Letter chip rows + timestamps   │  Letter chip rows + timestamps   │
│   Reset footer                    │  Reset footer                     │
└───────────────────────────────────┴───────────────────────────────────┘
GrowthPlusBanner (shared, purple)
```

Mobile stacks: H1 → Mode → Engagement → Filters → Whitelist → Blacklist → Growth+ banner.

**File layout:**
```
src/pages/growth/
  index.jsx                  page shell + filter modal state
  ModeCard.jsx               draft+Save pattern; chip + within-IG pill + 3 option cards + reset footer
  EngagementCard.jsx         green chip + 3 toggles + WelcomeDmPreview + CloseFriendsProgress + reset footer
  WelcomeDmPreview.jsx       chat bubble + h-10 filled "Edit message" button (placeholder when off)
  CloseFriendsProgress.jsx   progress bar + ticker (placeholder when off)
  WelcomeDmModal.jsx         unchanged
  FiltersCard.jsx            yellow chip + grouped rows + AudienceReachEstimate + reset footer
  FiltersModal.jsx           wider 2-col modal; Quick presets row; range Min/Max always render (disabled when not Custom)
  AudienceReachEstimate.jsx  count + horizontal blue bar + banded hint copy
  audienceReach.js           pure deterministic estimator over filters
  WhitelistCard.jsx          green chip + letter-chip rows + timestamps + reset footer
  BlacklistCard.jsx          neutral chip + letter-chip rows + timestamps + reset footer
  WhitelistModal.jsx         scrollable entries list (max-h-72)
  BlacklistModal.jsx         scrollable entries list (max-h-72)
src/components/CardChip.jsx       shared chip (color/icon/size)
src/components/InfoTooltip.jsx    shared hover/focus tooltip
src/components/ResetConfirmModal.jsx  shared confirm modal
src/components/GrowthPlusBanner.jsx   shared with Overview
src/utils/formatRelativeShort.js  "5d ago" / "2w ago" / "1mo ago"
src/stores/useGrowthConfig.js   + resetMode + resetEngagement + resetFilters
src/stores/useLists.js          + resetWhitelist + resetBlacklist
```

**Mode card:** Blue chip + Settings2 icon + tooltip. Header pill: `Within IG limits ✓` (green-tint). Header right slot: when `draft !== savedMode`, ghost `Cancel` + filled blue `Save mode` buttons. Card body: 3 mode option cards. Saved option = solid blue + Check; staged option = dashed blue + light tint, no Check. Reset footer link → `ResetConfirmModal` → `resetMode()`.

**Engagement card:** Green chip + Handshake. 3 SettingSwitch rows. Welcome DM (when on) shows `WelcomeDmPreview` chat bubble + h-10 filled blue `Edit message` button. Close Friends (when on) shows full-width segmented Add/Remove (`flex w-full + flex-1` pills) + `CloseFriendsProgress` (mode-aware verb). Off-state placeholders preserve card height. Reset footer.

**Filters card:** Yellow chip + SlidersHorizontal. Grouped read-only rows. Footer block: `AudienceReachEstimate` (Estimated audience eyebrow + count + blue bar + hint copy). Reset footer.

**Filters modal:** Wider (`max-w-2xl`), 2-col on desktop. Quick presets row above the columns (3 pills). Range fields use native `<select>` dropdowns + persistent Min/Max inputs (disabled when not Custom — no jump). Privacy + Gender as wider segmented pills. Exclude NSFW = `SettingSwitch`.

**List cards:** Each row = letter chip (24px circle) + `@username` + `added Xd ago` muted timestamp via `formatRelativeShort`. Reset footer per card; reset clears the list to empty (not seeds). Edit button is a square Pencil ghost.

**List modals:** Entries list capped at `max-h-72` with internal scroll. Modal outer container retains `max-h-[85vh]` cap.

**Plan gating:** Same as v6 — Welcome DM / Close Friends / Gender filter Advanced-only.

**Spec/plan:** v7 → `docs/superpowers/specs/2026-04-28-growth-page-v7-design.md` + `plans/2026-04-28-growth-page-v7.md`.
```

Then add to the Update log at the bottom:

```markdown
- **2026-04-28 (growth v7)** — Refinement pass: Mode draft+Save (dashed-blue staged style); bigger Welcome DM Edit button; full-width Close Friends segmented; Filters appended `AudienceReachEstimate` (deterministic mock formula); Whitelist/Blacklist letter chips + relative timestamps; FiltersModal range Min/Max always render (no jump on Custom) + Quick presets row; List modals cap entries at `max-h-72` with internal scroll; per-card `Reset to defaults` link + `ResetConfirmModal` with `bg-red-tint text-red-text` button; new store actions `resetMode/resetEngagement/resetFilters/resetWhitelist/resetBlacklist`.
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md CONTEXT.md
git commit -m "docs: log Growth v7 changes in CHANGELOG and CONTEXT"
```

---

## Self-review notes

**Spec coverage:**
- §1 Mode draft+Save → Task 6
- §2 Welcome DM bigger Edit button → Task 7
- §3 Close Friends full-width segmented → Task 7
- §4 AudienceReachEstimate + formula → Task 3 + Task 4 wiring
- §5 Letter chips + timestamps → Task 8
- §6 Modal scrollable list → Task 9
- §7 FiltersModal Custom no-jump → Task 5
- §P1 Quick presets → Task 5
- §P3 ResetConfirmModal + per-card reset → Task 1 (modal) + Task 2 (store actions) + Tasks 4/6/7/8 (per-card wiring)
- Acceptance criteria 1–10 all map to tasks above.

**Type / name consistency:**
- Store actions: `resetMode`, `resetEngagement`, `resetFilters`, `resetWhitelist`, `resetBlacklist` — used consistently across all wiring tasks.
- `ResetConfirmModal` props: `open`, `onClose`, `onConfirm`, `sectionLabel` — used identically in every consumer.
- `AudienceReachEstimate` is a no-prop component (reads its own filters via `useGrowthConfig`).
- `formatRelativeShort(iso, now?)` — `now` defaulted; only `iso` passed at call sites.
- `estimateAudienceReach(filters) → { count, pct, hint }` — return shape consistent.

**No-placeholder check:** Every code-bearing step contains the full file body or a precise replacement snippet. No "TBD", no "similar to Task N." Whitelist and Blacklist cards are written separately on purpose.

**Visual review nuances flagged:**
- The native `<select>` dropdown for ranges still uses the OS popover. Custom row inputs disabled state (greyed) was the v7 fix for the height jump.
- Reset to defaults clears Whitelist/Blacklist to empty — *not* back to the v6 seed entries. This is deliberate; user should re-confirm during visual review if jarring.
- Mode draft `useEffect` sync: when `savedMode` changes externally (e.g., via reset), the draft snaps to the new saved value. Confirms the dashed staged style disappears immediately on reset.
