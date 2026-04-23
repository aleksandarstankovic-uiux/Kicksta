# Targets Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the `/targets` page — slot tracker, filter/sort controls, target list with row-level actions, and a single Add Target sheet — per `docs/superpowers/specs/2026-04-23-targets-page-design.md`.

**Architecture:** React page composed of small focused components under `src/pages/targets/`, backed by a new Zustand store `useTargetsStore` seeded from existing `mockTargets`. All state is in-memory for V1. Each component has a single responsibility and can be reasoned about in isolation. Follows the established dashboard design system (color tokens, pill recipes, spacing scale from `CLAUDE.md`).

**Tech Stack:** React 19 · Tailwind CSS 4 · Zustand 5 · Lucide React · React Router 7.

**Testing:** No unit-test framework is wired up on this project. Each task verifies via (a) `npm run lint`, and (b) manual visual check in the Claude Preview browser at `/targets`. The project's convention is frequent small commits with visual iteration — this plan follows that pattern.

---

## File Structure

**New files:**

```
src/stores/useTargetsStore.js                 Zustand store: state + actions
src/mocks/suggestedTargets.js                 4-6 mock suggestion chips for the Add sheet
src/mocks/resolveAccount.js                   Async mock preview resolver
src/pages/targets/index.jsx                   Page shell — header + composes children
src/pages/targets/SlotsCard.jsx               Count + progress bar + trust line + Add button
src/pages/targets/FilterRow.jsx               Segmented filter pills + sort dropdown
src/pages/targets/TargetList.jsx              Column header + list container + empty states
src/pages/targets/TargetRow.jsx               One row (dot/tooltip + name + star + pill + count + kebab)
src/pages/targets/KebabMenu.jsx               Status-aware action popover / bottom sheet
src/pages/targets/RemoveTargetModal.jsx       Destructive-action confirmation
src/pages/targets/AddTargetSheet.jsx          Bottom sheet / modal with type toggle + input + preview + suggestions
```

**Modified files:**

```
src/pages/targets/index.jsx                   (replaces current stub)
```

Each file has one clear responsibility. `index.jsx` wires children to the store; all layout/interaction lives inside its respective file. The sheet and modal are separate components because they're independently triggerable and have different tap targets and lifecycles.

---

## Conventions Used Across All Tasks

- **Color tokens:** only use the design-system tokens (`text-primary`, `text-secondary`, `text-muted`, `bg`, `surface`, `border`, `green-tint`, `green-text`, `blue-base`, `red-base`, `yellow-tint`, `yellow-text`, etc.). Never arbitrary hex.
- **Spacing:** Tailwind scale `4 / 8 / 12 / 16 / 24 / 32 / 48 / 64` only. No arbitrary `[values]` unless a spec calls for it (none here).
- **Touch targets:** icon buttons 44×44, primary buttons 48px height.
- **Imports:** alias `@/` resolves to `src/` (already configured in the project).
- **Dark mode:** pair `bg-*` with dark variant where tokens don't already cover it. Most design-system tokens handle dark automatically because they're CSS variables.
- **Commits:** one per task. Commit message format: `feat(targets): <short summary>`. No Claude byline unless user requests.

---

## Task 1: Create mock fixtures

**Files:**
- Create: `src/mocks/suggestedTargets.js`
- Create: `src/mocks/resolveAccount.js`

- [ ] **Step 1: Create suggested-targets mock**

Create `src/mocks/suggestedTargets.js`:

```js
// Static suggestions shown as chips inside the Add Target sheet
// (account mode only). Represents "accounts similar to what you already
// target" — no live niche inference in V1.
export const mockSuggestedTargets = [
  { username: 'fitfluencer', followers: 84200, profilePic: null },
  { username: 'healthyhabits', followers: 52100, profilePic: null },
  { username: 'trainhard.daily', followers: 39800, profilePic: null },
  { username: 'nutrition.nerd', followers: 22400, profilePic: null },
  { username: 'homegymhero', followers: 18700, profilePic: null },
]
```

- [ ] **Step 2: Create resolveAccount mock**

Create `src/mocks/resolveAccount.js`:

```js
// Fakes "live" account lookup used by the Add Target sheet preview.
// Returns `{ username, followers, profilePic }` for known usernames or
// null otherwise, after a 200–400ms delay. A tiny fixture is enough —
// we're not trying to cover the whole IG graph.
const FIXTURE = {
  'fitness.inspo': { followers: 128400, profilePic: null },
  'fitfluencer': { followers: 84200, profilePic: null },
  'healthyhabits': { followers: 52100, profilePic: null },
  'trainhard.daily': { followers: 39800, profilePic: null },
  'nutrition.nerd': { followers: 22400, profilePic: null },
  'homegymhero': { followers: 18700, profilePic: null },
  'macro.melissa': { followers: 9400, profilePic: null },
  'protein.pete': { followers: 6100, profilePic: null },
  'yoga.daily': { followers: 210000, profilePic: null },
  'keto.kevin': { followers: 48300, profilePic: null },
  'cleanfoodcrush': { followers: 71000, profilePic: null },
}

export function mockResolveAccount(rawUsername) {
  const username = String(rawUsername || '').replace(/^@/, '').trim().toLowerCase()
  const delay = 200 + Math.random() * 200
  return new Promise((resolve) => {
    setTimeout(() => {
      const hit = FIXTURE[username]
      resolve(hit ? { username, ...hit } : null)
    }, delay)
  })
}
```

- [ ] **Step 3: Lint and commit**

Run: `npm run lint`
Expected: no new errors.

```bash
git add src/mocks/suggestedTargets.js src/mocks/resolveAccount.js
git commit -m "feat(targets): add suggested-targets and resolve-account mocks"
```

---

## Task 2: Targets Zustand store

**Files:**
- Create: `src/stores/useTargetsStore.js`

- [ ] **Step 1: Create the store**

Create `src/stores/useTargetsStore.js`:

```js
import { create } from 'zustand'
import { mockTargets } from '@/mocks/targets'

// Single source of truth for the Targets page. Actions are synchronous
// and optimistic — real API wiring can replace the bodies later without
// changing the store's shape.
//
// Filter buckets mirror the target status values plus an "all" shortcut.
// Sort modes are explicit so the UI can show the current choice.

const nextId = () => `t_${Math.random().toString(36).slice(2, 8)}`

export const useTargetsStore = create((set) => ({
  targets: mockTargets,
  filter: 'all',
  sort: 'priority',

  setFilter: (filter) => set({ filter }),
  setSort: (sort) => set({ sort }),

  addTarget: ({ type, value }) =>
    set((state) => ({
      targets: [
        {
          id: nextId(),
          type,
          value,
          status: 'queued',
          followedCount: 0,
          followBackCount: 0,
          addedAt: new Date().toISOString(),
        },
        ...state.targets,
      ],
    })),

  pauseTarget: (id) =>
    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === id ? { ...t, status: 'paused' } : t
      ),
    })),

  resumeTarget: (id) =>
    set((state) => ({
      targets: state.targets.map((t) =>
        t.id === id ? { ...t, status: 'active' } : t
      ),
    })),

  removeTarget: (id) =>
    set((state) => ({
      targets: state.targets.filter((t) => t.id !== id),
    })),
}))

// Priority order used by the default sort — keeps actionable rows (active,
// queued) above rows the user has already dealt with (paused, depleted).
export const STATUS_PRIORITY = {
  active: 0,
  queued: 1,
  paused: 2,
  depleted: 3,
}

export function sortTargets(targets, sort) {
  const copy = targets.slice()
  switch (sort) {
    case 'followBacks':
      return copy.sort((a, b) => b.followBackCount - a.followBackCount)
    case 'recent':
      return copy.sort(
        (a, b) => new Date(b.addedAt) - new Date(a.addedAt)
      )
    case 'alpha':
      return copy.sort((a, b) => a.value.localeCompare(b.value))
    case 'priority':
    default:
      return copy.sort((a, b) => {
        const pa = STATUS_PRIORITY[a.status] ?? 99
        const pb = STATUS_PRIORITY[b.status] ?? 99
        if (pa !== pb) return pa - pb
        return b.followBackCount - a.followBackCount
      })
  }
}

export function filterTargets(targets, filter) {
  if (filter === 'all') return targets
  return targets.filter((t) => t.status === filter)
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/stores/useTargetsStore.js
git commit -m "feat(targets): add useTargetsStore with filter/sort helpers"
```

---

## Task 3: Page shell with header

**Files:**
- Modify: `src/pages/targets/index.jsx` (replace stub)

- [ ] **Step 1: Replace page stub with shell**

Replace the current contents of `src/pages/targets/index.jsx`:

```jsx
// Targets page — slot tracker, filter/sort controls, list of target
// rows, and a single Add-Target sheet. The page is composed from small
// focused components under this folder; the store (`useTargetsStore`)
// is the only state source.

export default function TargetsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      {/* Page header — sets context; no secondary CTA lives up here.
          The sole "Add target" button lives inside the slots card. */}
      <header>
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Targets
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage the accounts and hashtags Kicksta targets for your growth.
        </p>
      </header>

      {/* Slots card, filter row, and list wire in across Tasks 4, 5, 7. */}
    </div>
  )
}
```

- [ ] **Step 2: Verify in preview**

Open the preview at `/targets`. Expected: header renders with the correct title and subline, padding feels right on mobile and desktop.

Run: `npm run lint`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/targets/index.jsx
git commit -m "feat(targets): page shell with header"
```

---

## Task 4: Slots card

**Files:**
- Create: `src/pages/targets/SlotsCard.jsx`
- Modify: `src/pages/targets/index.jsx`

- [ ] **Step 1: Create SlotsCard**

Create `src/pages/targets/SlotsCard.jsx`:

```jsx
import { Lock, Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockUser } from '@/mocks/user'

// The single CTA host for the page. Shows total slots used (all statuses
// count, since depleted/paused rows still occupy a slot until removed),
// a progress bar, a calm trust one-liner, and the one `+ Add target`
// button that opens the sheet.
//
// V1 scope: happy-path only. At-cap state (button swap / disable / bar
// color change) is deferred to the later edge-state spec.
export default function SlotsCard({ onAddTarget }) {
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = mockUser.plan === 'advanced' ? 30 : 10
  const totalCount = targets.length
  const pct = Math.min(100, (totalCount / maxSlots) * 100)

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">Target slots</span>
        <span className="text-sm font-semibold tabular-nums text-text-primary">
          {totalCount} / {maxSlots}
        </span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-green-base transition-[width] duration-300"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
        <span className="text-xs text-text-muted">
          Kicksta follows within Instagram's safe daily limits.
        </span>
      </div>

      <div className="mt-4 lg:flex lg:justify-end">
        <button
          type="button"
          onClick={onAddTarget}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 lg:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add target
        </button>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Wire into the page with a stub handler**

Modify `src/pages/targets/index.jsx`:

```jsx
import { useState } from 'react'
import SlotsCard from './SlotsCard'

export default function TargetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)

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

      <SlotsCard onAddTarget={() => setSheetOpen(true)} />

      {/* Dev-only visual confirmation until the sheet lands in Task 9. */}
      {sheetOpen && (
        <div className="mt-4 text-xs text-text-muted">
          [Add Target sheet would open here — wired in Task 9]
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify in preview**

Open `/targets`. Expected:
- Slots card renders with `10 / 30` (default user is `advanced` plan with 10 mock targets).
- Progress bar is 33% wide, green.
- Lock icon + trust line present.
- Blue `+ Add target` button is full-width on mobile, auto-width and right-aligned on desktop.
- Tapping it shows the dev-only placeholder text.

Run: `npm run lint`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/targets/SlotsCard.jsx src/pages/targets/index.jsx
git commit -m "feat(targets): slots card with count, progress bar, trust line, add button"
```

---

## Task 5: Filter row (segmented pills + sort dropdown)

**Files:**
- Create: `src/pages/targets/FilterRow.jsx`
- Modify: `src/pages/targets/index.jsx`

- [ ] **Step 1: Create FilterRow**

Create `src/pages/targets/FilterRow.jsx`:

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

  // Counts rendered inside each filter pill. Recomputed when targets
  // change so add/pause/remove update the badges immediately.
  const counts = useMemo(() => {
    const base = { all: targets.length, active: 0, queued: 0, paused: 0, depleted: 0 }
    for (const t of targets) {
      if (base[t.status] !== undefined) base[t.status] += 1
    }
    return base
  }, [targets])

  return (
    <div className="mt-6 flex items-center gap-3">
      {/* Pills: horizontally scrollable on mobile, full row on lg:+. */}
      <div className="-mx-4 flex-1 overflow-x-auto px-4 lg:mx-0 lg:px-0">
        <div className="inline-flex gap-1 rounded-full bg-bg p-1">
          {FILTERS.map((f) => {
            const selected = filter === f.value
            return (
              <button
                key={f.value}
                type="button"
                onClick={() => setFilter(f.value)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  selected
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
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
      </div>

      {/* Sort dropdown — text on desktop, icon-only on mobile. */}
      <SortDropdown value={sort} onChange={setSort} />
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
        className="inline-flex h-11 items-center gap-1.5 rounded-full bg-bg px-3 text-xs font-medium text-text-secondary hover:text-text-primary lg:px-3"
      >
        {/* Mobile: icon-only. Desktop: full label. */}
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

- [ ] **Step 2: Wire into the page**

Modify `src/pages/targets/index.jsx` — add the FilterRow below the SlotsCard:

```jsx
import { useState } from 'react'
import SlotsCard from './SlotsCard'
import FilterRow from './FilterRow'

export default function TargetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)

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

      <SlotsCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />

      {sheetOpen && (
        <div className="mt-4 text-xs text-text-muted">
          [Add Target sheet would open here — wired in Task 9]
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify in preview**

Expected:
- Five filter pills: `All 10 · Active 6 · Queued 1 · Paused 1 · Depleted 2`.
- `All` is selected by default (white bg + shadow).
- Tapping a pill moves the selection.
- Sort pill on the right: on mobile shows an `ArrowUpDown` icon; on desktop shows `Sort: Priority ▾`. Tapping opens a menu with 4 options. Selecting one closes it.
- Pills scroll horizontally on narrow mobile, no wrap.

Run: `npm run lint`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/targets/FilterRow.jsx src/pages/targets/index.jsx
git commit -m "feat(targets): filter pills and sort dropdown"
```

---

## Task 6: Target row

**Files:**
- Create: `src/pages/targets/TargetRow.jsx`

This task creates the row component in isolation. It'll be rendered by the list in Task 7. We build it first because it's the most detail-heavy unit and easier to reason about standalone.

- [ ] **Step 1: Create TargetRow**

Create `src/pages/targets/TargetRow.jsx`:

```jsx
import { MoreVertical, Star } from 'lucide-react'

// Status → dot color. Matches the vocabulary already used on the
// Overview page's TargetsOverview snapshot so the two stay consistent.
const statusDotClass = {
  active: 'bg-green-base',
  queued: 'bg-blue-base',
  paused: 'bg-text-muted',
  depleted: 'bg-yellow-base',
}

const statusTooltip = {
  active: 'Working on it — currently being targeted for growth',
  queued: 'In queue — will start once an active slot frees up',
  paused: 'Targeting off — this source is temporarily not running',
  depleted: 'Depleted — no more users left to follow from this source',
}

// Tinted pills per status. Paused is neutral-grey on purpose (not a
// colored state); all the others use their status color family.
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

export default function TargetRow({ target, isTop, isFirst, onOpenMenu }) {
  const depleted = target.status === 'depleted'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => onOpenMenu(target, e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenMenu(target, e.currentTarget)
        }
      }}
      className={`flex min-h-[56px] cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bg focus:bg-bg focus:outline-none ${
        isFirst ? '' : 'border-t border-border'
      } ${depleted ? 'bg-bg/60' : ''}`}
    >
      {/* Identity zone */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {/* Dot + tooltip */}
        <span className="group/dot relative flex shrink-0 items-center">
          <span
            aria-label={statusTooltip[target.status]}
            className={`h-2.5 w-2.5 rounded-full ${statusDotClass[target.status]}`}
          />
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-max max-w-[220px] rounded-lg bg-text-primary px-2.5 py-1.5 text-[11px] font-normal leading-relaxed text-surface opacity-0 shadow-lg transition-opacity group-hover/dot:opacity-100 group-focus-within/dot:opacity-100"
          >
            {statusTooltip[target.status]}
          </span>
        </span>

        <span
          className={`truncate text-sm font-medium ${
            depleted ? 'text-text-muted line-through' : 'text-text-primary'
          }`}
        >
          {target.value}
        </span>

        {/* Top-performer star sits between name and pill when applicable. */}
        {isTop && (
          <Star
            className="h-3.5 w-3.5 shrink-0 fill-yellow-base text-yellow-base"
            aria-label="Top performer"
          />
        )}

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            statusPillClass[target.status]
          }`}
        >
          {statusLabel[target.status]}
        </span>
      </div>

      {/* Follow-back count */}
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          depleted ? 'text-text-muted' : 'text-text-primary'
        }`}
      >
        {target.followBackCount}
      </span>

      {/* Kebab — visual affordance. Row-tap already triggers the menu;
          stopPropagation so clicking the icon doesn't double-fire. */}
      <button
        type="button"
        aria-label="Open actions"
        onClick={(e) => {
          e.stopPropagation()
          onOpenMenu(target, e.currentTarget)
        }}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
      >
        <MoreVertical className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Lint**

Run: `npm run lint`. Expected: no new errors. (This file is used in Task 7; no visual check until then.)

- [ ] **Step 3: Commit**

```bash
git add src/pages/targets/TargetRow.jsx
git commit -m "feat(targets): target row with dot, pill, star, follow-backs, kebab"
```

---

## Task 7: Target list (column header + rows + empty states)

**Files:**
- Create: `src/pages/targets/TargetList.jsx`
- Modify: `src/pages/targets/index.jsx`

- [ ] **Step 1: Create TargetList**

Create `src/pages/targets/TargetList.jsx`:

```jsx
import { useMemo } from 'react'
import TargetRow from './TargetRow'
import {
  useTargetsStore,
  filterTargets,
  sortTargets,
} from '@/stores/useTargetsStore'

// Lays out the list container and delegates each row to TargetRow.
// Owns three responsibilities: column header, empty-state variants,
// and identifying the "top performer" to star.
export default function TargetList({ onOpenMenu }) {
  const targets = useTargetsStore((s) => s.targets)
  const filter = useTargetsStore((s) => s.filter)
  const sort = useTargetsStore((s) => s.sort)

  const visible = useMemo(() => {
    return sortTargets(filterTargets(targets, filter), sort)
  }, [targets, filter, sort])

  // Top performer = highest follow-back count among active targets.
  // Independent of filter/sort so the star always reflects the real
  // best-performing row, not just the top of the currently-sorted view.
  const topTargetId = useMemo(() => {
    const actives = targets.filter((t) => t.status === 'active')
    if (actives.length === 0) return null
    return actives.reduce((best, t) =>
      t.followBackCount > best.followBackCount ? t : best
    ).id
  }, [targets])

  const hasAnyTarget = targets.length > 0

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
      {/* Column header sits inside the card, aligns with row padding. */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        <span>Name</span>
        <span>Follow-backs</span>
      </div>

      {!hasAnyTarget && <EmptyNoTargets />}
      {hasAnyTarget && visible.length === 0 && <EmptyForFilter filter={filter} />}

      {hasAnyTarget && visible.length > 0 && (
        <div className="flex flex-col">
          {visible.map((t, i) => (
            <TargetRow
              key={t.id}
              target={t}
              isFirst={i === 0}
              isTop={t.id === topTargetId}
              onOpenMenu={onOpenMenu}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// Zero-total state. No CTA here — the sole "+ Add target" button lives
// in the SlotsCard above.
function EmptyNoTargets() {
  return (
    <div className="px-4 py-16 text-center">
      <h3 className="text-lg font-semibold text-text-primary">
        No targets yet
      </h3>
      <p className="mt-1 text-sm text-text-secondary">
        Add an account or hashtag to start growing.
      </p>
    </div>
  )
}

const FILTER_EMPTY_COPY = {
  active: 'No active targets.',
  queued: 'No queued targets.',
  paused: 'No paused targets.',
  depleted: 'No depleted targets.',
}

function EmptyForFilter({ filter }) {
  const copy = FILTER_EMPTY_COPY[filter] || 'Nothing to show.'
  return (
    <div className="px-4 py-8 text-center text-sm text-text-muted">
      {copy}
    </div>
  )
}
```

- [ ] **Step 2: Wire into the page with a stub menu handler**

Modify `src/pages/targets/index.jsx`:

```jsx
import { useState } from 'react'
import SlotsCard from './SlotsCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'

export default function TargetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuTarget, setMenuTarget] = useState(null)

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

      <SlotsCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList onOpenMenu={(t) => setMenuTarget(t)} />

      {/* Dev placeholders until Tasks 8 and 9 land. */}
      {sheetOpen && (
        <div className="mt-4 text-xs text-text-muted">
          [Add Target sheet — wired in Task 9]
        </div>
      )}
      {menuTarget && (
        <div className="mt-4 text-xs text-text-muted">
          [Kebab menu for {menuTarget.value} — wired in Task 8]
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setMenuTarget(null)}
          >
            close
          </button>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Verify in preview**

Expected:
- List renders with all 10 mock targets in priority order: actives first (sorted by follow-back count desc), then queued, paused, depleted.
- Top-performer star sits on the highest follow-back active row.
- Each row has: status dot, value, status pill, follow-back count, kebab.
- Depleted rows have `line-through` on the name and a muted wash.
- Filter pills change the visible set. Choosing `Paused` shows 1 row; `Depleted` shows 2 rows.
- Sort dropdown reorders — try `Most recent` and `A–Z`.
- Clicking a row or kebab shows the dev placeholder.

Run: `npm run lint`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/targets/TargetList.jsx src/pages/targets/index.jsx
git commit -m "feat(targets): target list with column header, rows, and empty states"
```

---

## Task 8: Kebab menu + remove confirmation modal

**Files:**
- Create: `src/pages/targets/KebabMenu.jsx`
- Create: `src/pages/targets/RemoveTargetModal.jsx`
- Modify: `src/pages/targets/index.jsx`

- [ ] **Step 1: Create RemoveTargetModal**

Create `src/pages/targets/RemoveTargetModal.jsx`:

```jsx
import { useEffect } from 'react'
import { useTargetsStore } from '@/stores/useTargetsStore'

// Destructive-action confirmation. Bottom sheet on mobile, centered
// modal on desktop. Primary button uses the action name ("Remove
// target") per CLAUDE.md — never "Confirm" or "Yes".
export default function RemoveTargetModal({ target, onClose }) {
  const removeTarget = useTargetsStore((s) => s.removeTarget)

  // Close on Escape.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!target) return null

  const handleRemove = () => {
    removeTarget(target.id)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Remove target"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-xl bg-surface p-5 shadow-xl lg:max-w-md lg:rounded-xl"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          Remove this target?
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {target.value} will no longer be used for growth. You can add it again later.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-4 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-red-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Remove target
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create KebabMenu**

Create `src/pages/targets/KebabMenu.jsx`:

```jsx
import { useEffect } from 'react'
import { Pause, Play, Trash2 } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'

// Status-aware action menu opened by row tap or kebab click.
// Mobile: bottom sheet. Desktop: centered lightweight popover (the
// anchored-to-row variant is a polish task we can layer on later —
// the functional UX here is identical).
export default function KebabMenu({ target, onClose, onRequestRemove }) {
  const pauseTarget = useTargetsStore((s) => s.pauseTarget)
  const resumeTarget = useTargetsStore((s) => s.resumeTarget)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!target) return null

  const items = buildItems(target, {
    pause: () => {
      pauseTarget(target.id)
      onClose()
    },
    resume: () => {
      resumeTarget(target.id)
      onClose()
    },
    remove: () => {
      onRequestRemove(target)
    },
  })

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Actions for ${target.value}`}
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full overflow-hidden rounded-t-xl bg-surface shadow-xl lg:max-w-xs lg:rounded-xl"
      >
        {/* Header — names the target so the user confirms they're acting
            on the right row before tapping Remove. */}
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-medium text-text-primary">
            {target.value}
          </p>
        </div>

        <ul className="flex flex-col">
          {items.map((it) => (
            <li key={it.label}>
              <button
                type="button"
                onClick={it.onClick}
                className={`flex w-full items-center gap-3 px-4 py-3.5 text-left text-sm ${
                  it.destructive
                    ? 'text-red-text hover:bg-red-tint'
                    : 'text-text-primary hover:bg-bg'
                }`}
              >
                <it.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{it.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function buildItems(target, { pause, resume, remove }) {
  const removeItem = { label: 'Remove', icon: Trash2, onClick: remove, destructive: true }
  switch (target.status) {
    case 'active':
      return [
        { label: 'Pause', icon: Pause, onClick: pause },
        removeItem,
      ]
    case 'paused':
      return [
        { label: 'Resume', icon: Play, onClick: resume },
        removeItem,
      ]
    case 'queued':
    case 'depleted':
    default:
      return [removeItem]
  }
}
```

- [ ] **Step 3: Wire both into the page**

Replace the stub menu handler in `src/pages/targets/index.jsx`:

```jsx
import { useState } from 'react'
import SlotsCard from './SlotsCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'
import KebabMenu from './KebabMenu'
import RemoveTargetModal from './RemoveTargetModal'

export default function TargetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuTarget, setMenuTarget] = useState(null)
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

      <SlotsCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList onOpenMenu={(t) => setMenuTarget(t)} />

      {menuTarget && (
        <KebabMenu
          target={menuTarget}
          onClose={() => setMenuTarget(null)}
          onRequestRemove={(t) => {
            setMenuTarget(null)
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

      {sheetOpen && (
        <div className="mt-4 text-xs text-text-muted">
          [Add Target sheet — wired in Task 9]
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Verify in preview**

Walk through each status:
- Tap an **active** row → menu shows `Pause` and `Remove`. Pause reclassifies the row to Paused immediately, pill turns neutral-grey, menu closes.
- Tap the now-**paused** row → menu shows `Resume` and `Remove`. Resume flips it back to Active.
- Tap a **queued** row → menu shows only `Remove`.
- Tap a **depleted** row → menu shows only `Remove`.
- Tap `Remove` on any row → confirmation modal. `Keep it` dismisses; `Remove target` removes the row, the list updates, and the slots card count decrements.
- Escape / overlay tap dismisses both overlays.

Run: `npm run lint`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/targets/KebabMenu.jsx src/pages/targets/RemoveTargetModal.jsx src/pages/targets/index.jsx
git commit -m "feat(targets): row action menu and remove-confirmation modal"
```

---

## Task 9: Add Target sheet

**Files:**
- Create: `src/pages/targets/AddTargetSheet.jsx`
- Modify: `src/pages/targets/index.jsx`

- [ ] **Step 1: Create AddTargetSheet**

Create `src/pages/targets/AddTargetSheet.jsx`:

```jsx
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
```

- [ ] **Step 2: Wire into the page**

Modify `src/pages/targets/index.jsx` — replace the dev placeholder for the sheet:

```jsx
import { useState } from 'react'
import SlotsCard from './SlotsCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'
import KebabMenu from './KebabMenu'
import RemoveTargetModal from './RemoveTargetModal'
import AddTargetSheet from './AddTargetSheet'

export default function TargetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuTarget, setMenuTarget] = useState(null)
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

      <SlotsCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList onOpenMenu={(t) => setMenuTarget(t)} />

      <AddTargetSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />

      {menuTarget && (
        <KebabMenu
          target={menuTarget}
          onClose={() => setMenuTarget(null)}
          onRequestRemove={(t) => {
            setMenuTarget(null)
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

- [ ] **Step 3: Verify in preview**

Walk through the sheet:
- Tap `+ Add target`. Sheet slides up from the bottom on mobile, centers on desktop. Input auto-focuses.
- Toggle between `Account` and `Hashtag` — prefix, helper copy, preview, and suggestions all change accordingly.
- Type `fitfluencer` in account mode. After ~300ms, preview card shows `@fitfluencer` + follower count.
- Tap a suggestion chip. Input fills, preview updates.
- Type a known existing target, e.g. `fitness.inspo`. Helper becomes red: *"You already have this target."* Button disables.
- Type `cleanfoodcrush` (paused in mock data). Same message plus a `Resume it` link that closes the sheet and resumes the row.
- Submit a valid new one. Sheet closes. New row appears at the top of the list with `Queued` status. Slots count increments.
- Cancel / close (X) / Escape / overlay-tap all dismiss the sheet.

Run: `npm run lint`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/targets/AddTargetSheet.jsx src/pages/targets/index.jsx
git commit -m "feat(targets): add-target sheet with type toggle, preview, suggestions, duplicate handling"
```

---

## Task 10: Final polish pass

Catch the small things that show up only when the page is whole.

**Files:**
- Potentially modify: any file above, based on visual review.

- [ ] **Step 1: Responsive sweep**

Open preview at 375×812 (mobile), 768×1024 (tablet), 1280×900 (desktop). Confirm:
- Mobile: all CTAs thumb-reachable, filter pills scroll horizontally without clipping, sheet covers full width.
- Tablet: no awkward in-between breakage.
- Desktop: page centered under `max-w-5xl`, Add button right-aligned in slots card, sort dropdown shows text label.

If any zone is misbehaving, note the component and fix inline.

- [ ] **Step 2: Dark mode check**

Toggle to dark mode via the existing app theme toggle. Confirm all surfaces, dividers, text, and pills read correctly (especially depleted-row wash and suggestion chip borders). Design tokens should cover this automatically; flag any hardcoded color that doesn't.

- [ ] **Step 3: Cross-page consistency check**

Navigate to `/` (Overview). Scroll to the `Top Targets` card. Confirm the vocabulary matches: status dot colors, status pill recipes, star treatment, depleted wash. Any drift here is a bug.

- [ ] **Step 4: Lint, build, commit**

Run: `npm run lint`
Run: `npm run build`
Expected: both succeed with no new warnings tied to these files.

Commit any fixes made during the sweep:

```bash
git add -A
git commit -m "chore(targets): polish pass — responsive/dark-mode/consistency"
```

- [ ] **Step 5: Update CHANGELOG and CONTEXT**

Ask the user: *"Update CHANGELOG and CONTEXT? (yes/no)"* — then, if yes:
- Add a 2026-04-23 (or current date) entry to `CHANGELOG.md` under `### Created` listing the Targets page and its components, and under `### Decisions` noting what was deferred (disconnected state, at-cap state, auto-pause banner).
- Update `CONTEXT.md` with a Targets page section mirroring the Overview page section pattern.

Commit:

```bash
git add CHANGELOG.md CONTEXT.md
git commit -m "docs: log Targets page launch"
```

---

## Spec Coverage Checklist

Against `docs/superpowers/specs/2026-04-23-targets-page-design.md`:

- § Page Layout → Tasks 3–9 (composition across files).
- § 1 Page Header → Task 3.
- § 2 Slots Card → Task 4.
- § 3 Filter Row → Task 5.
- § 4 Target List → Tasks 6 + 7.
- § 5 Add Target Sheet → Task 9.
- § 6 Kebab Action Popover → Task 8.
- § 7 State & Data → Tasks 1 + 2.
- § 8 Component Breakdown → Tasks 3–9 (all files created).
- § 9 Responsive Notes → Task 10 (responsive sweep).
- § 10 Out of Scope (V1) → Intentionally not implemented.
- § 11 Open Follow-Ups → For a later spec, not this plan.
