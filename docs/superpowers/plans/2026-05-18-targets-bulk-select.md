# Targets Bulk-Select Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add bulk-select mode to the Targets list on `/targeting` — sticky action bar with Pause/Remove (Active bucket) or Restore (Archived bucket), bulk-aware confirm modal for Remove, slot-limit block for Restore.

**Architecture:** Selection state lives on `useTargetsStore` (`selectionMode: boolean`, `selection: Set<id>`). FilterRow hides entirely while in selection mode and `BulkActionBar` renders in the same vertical slot. Rows swap their click handler + right-edge affordance (chevron → checkbox) + ARIA role based on `selectionMode`. Master checkbox in the column header drives select-all-visible. Confirm flows use new `BulkRemoveModal` (mirrors existing `RemoveTargetModal`) and `RestoreLimitModal` (slot-limit block for Restore).

**Tech Stack:** React 19 + Vite + Tailwind v4 + Zustand 5. No unit test runner for components — verification is browser-based via `mcp__Claude_Preview__*` tools against the running dev server (port 5173, `Vite Dev Server` launch config).

**Spec:** `docs/superpowers/specs/2026-05-18-targets-bulk-select-design.md`

---

## File map

**Create:**
- `src/utils/targetSlots.js` — `slotLimit()` + `inRotationCount(targets)` helpers (extracted from `TargetsHeroCard.jsx:17`).
- `src/pages/targeting/BulkActionBar.jsx` — sticky toolbar shown in selection mode.
- `src/pages/targeting/BulkRemoveModal.jsx` — "Archive N targets?" confirm.
- `src/pages/targeting/RestoreLimitModal.jsx` — slot-limit block on bulk Restore.

**Modify:**
- `src/stores/useTargetsStore.js` — add selection state + 5 actions.
- `src/pages/targeting/FilterRow.jsx` — Select button on the right; whole component returns `null` when `selectionMode === true`.
- `src/pages/targeting/TargetList.jsx` — render master checkbox in column header during selection; render `BulkActionBar` in selection mode.
- `src/pages/targeting/TargetRow.jsx` — swap click + chevron-vs-checkbox + role conditionally.
- `src/pages/targeting/TargetsTab.jsx` — render `BulkRemoveModal` + `RestoreLimitModal` alongside existing drawers; own the page-level Esc handler that calls `exitSelection()`; wire callbacks from the bar.

---

## Task 1: Extend `useTargetsStore` with selection state

**Files:**
- Modify: `src/stores/useTargetsStore.js`

- [ ] **Step 1: Read the existing store file**

```bash
cat src/stores/useTargetsStore.js
```

Confirm the existing shape matches what's expected: `targets`, `processingId`, `filter`, `sort`, plus actions `setFilter`, `setSort`, `addTarget`, `pauseTarget`, `resumeTarget`, `removeTarget`, `restoreTarget`. Confirm `STATUS_PRIORITY`, `sortTargets`, `filterTargets` are exported at the bottom.

- [ ] **Step 2: Add selection state + actions**

Edit `src/stores/useTargetsStore.js`. After the existing `restoreTarget` action and before the closing `}))`, add:

```js
  // --- Bulk selection ---
  // `selectionMode` toggles the entire Targets list into multi-select.
  // While true, FilterRow hides and BulkActionBar renders in its slot.
  // `selection` is the set of target ids the user has ticked. Both
  // reset together on `enterSelection` and `exitSelection` so we
  // never have a stale selection from a previous mode.
  selectionMode: false,
  selection: new Set(),

  enterSelection: () =>
    set({ selectionMode: true, selection: new Set() }),

  exitSelection: () =>
    set({ selectionMode: false, selection: new Set() }),

  toggleSelect: (id) =>
    set((state) => {
      const next = new Set(state.selection)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return { selection: next }
    }),

  selectAllVisible: (ids) =>
    set({ selection: new Set(ids) }),

  clearSelection: () =>
    set({ selection: new Set() }),
```

- [ ] **Step 3: Verify the dev server still hot-reloads cleanly**

Start the preview server if it's not already running:

```
mcp__Claude_Preview__preview_start  →  name: "Vite Dev Server"
```

Then check the console for errors:

```
mcp__Claude_Preview__preview_console_logs
```

Expected: No new errors. The page should still render normally — none of the new state is wired up yet, so the page should look identical.

- [ ] **Step 4: Verify the store state from the browser**

Use `preview_eval` to confirm the new actions exist:

```js
const s = window.__Z_TARGETS__ || null;
// We don't expose the store on window — just sanity-check by checking that the page renders.
// Confirm by reading the Zustand store via React DevTools is overkill; this step just
// verifies no runtime errors. The real verification comes when we wire the UI.
'ok'
```

Expected: `'ok'` returned, no errors in `preview_console_logs`.

- [ ] **Step 5: Commit**

```bash
git add src/stores/useTargetsStore.js
git commit -m "feat(targets): add selection state to useTargetsStore"
```

---

## Task 2: Extract slot-limit utility

**Files:**
- Create: `src/utils/targetSlots.js`
- Modify: `src/pages/targeting/TargetsHeroCard.jsx`

- [ ] **Step 1: Create the utility**

Create `src/utils/targetSlots.js`:

```js
import { mockUser } from '@/mocks/user'

// Plan-derived target slot limit. Source of truth — anywhere the
// dashboard enforces "you can't have more than N targets in rotation"
// should call this. Pulled out of TargetsHeroCard so RestoreLimitModal
// can reuse it without importing UI.
export function slotLimit() {
  return mockUser.plan === 'advanced' ? 30 : 10
}

// Count of targets that occupy a rotation slot. Archived targets
// don't count — they're out of rotation until restored.
export function inRotationCount(targets) {
  return targets.filter((t) => t.status !== 'archived').length
}
```

- [ ] **Step 2: Update `TargetsHeroCard` to use the util**

In `src/pages/targeting/TargetsHeroCard.jsx`, replace:

```js
import { Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockUser } from '@/mocks/user'
```

with:

```js
import { Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { slotLimit } from '@/utils/targetSlots'
```

And replace:

```js
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = mockUser.plan === 'advanced' ? 30 : 10
  const totalCount = targets.length
```

with:

```js
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = slotLimit()
  const totalCount = targets.length
```

Leave `totalCount = targets.length` alone for this task — the existing display semantics aren't part of this plan's scope.

- [ ] **Step 3: Verify the Targeting page still renders the slot count**

```
mcp__Claude_Preview__preview_eval
```

```js
const card = document.querySelector('section.border-l-blue-base');
card ? card.innerText : 'NO HERO CARD'
```

Expected: text contains `Audience sources` and the slot count (e.g. `4/30` for Advanced plan).

- [ ] **Step 4: Commit**

```bash
git add src/utils/targetSlots.js src/pages/targeting/TargetsHeroCard.jsx
git commit -m "refactor(targets): extract slot-limit helpers to utils/targetSlots"
```

---

## Task 3: Create `BulkActionBar` (visual skeleton, no wiring)

**Files:**
- Create: `src/pages/targeting/BulkActionBar.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/targeting/BulkActionBar.jsx`:

```jsx
import { X } from 'lucide-react'

// Sticky toolbar shown in place of FilterRow while bulk-select mode
// is active. Owns the "N selected" count, the close X, and the
// bucket-specific action buttons. Pure presentation — parent owns
// state and callbacks.
//
// Layout: left = X + count, right = action buttons. On mobile the
// action buttons can wrap below the count via flex-wrap.
//
// A11y: role="toolbar" with aria-label; the count is aria-live so
// screen readers announce changes. Action buttons get the count
// interpolated into their aria-label.
export default function BulkActionBar({
  count,
  bucket,            // 'active' | 'archived'
  onExit,
  onPause,
  onRemove,
  onRestore,
  pauseDisabled,     // true when no selected row can transition to paused
}) {
  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="sticky top-0 z-10 mt-4 flex items-center gap-2 border-b border-border bg-surface/95 px-2 py-2 backdrop-blur"
    >
      <button
        type="button"
        onClick={onExit}
        aria-label="Cancel selection"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg hover:text-text-primary"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <span
        aria-live="polite"
        className="flex-1 text-sm font-medium text-text-primary"
      >
        {count} selected
      </span>

      {bucket === 'active' && (
        <>
          <button
            type="button"
            onClick={onPause}
            disabled={pauseDisabled}
            aria-label={`Pause ${count} targets`}
            className="inline-flex h-9 items-center rounded-full bg-bg px-3 text-xs font-medium text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-text-secondary"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Archive ${count} targets`}
            className="inline-flex h-9 items-center rounded-full bg-red-tint px-3 text-xs font-medium text-red-text hover:bg-red-tint/80"
          >
            Remove
          </button>
        </>
      )}

      {bucket === 'archived' && (
        <button
          type="button"
          onClick={onRestore}
          aria-label={`Restore ${count} targets`}
          className="inline-flex h-9 items-center rounded-full bg-bg px-3 text-xs font-medium text-text-secondary hover:text-text-primary"
        >
          Restore
        </button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the file compiles**

```
mcp__Claude_Preview__preview_console_logs
```

Expected: No errors. The component isn't rendered yet, so the page looks identical.

- [ ] **Step 3: Commit**

```bash
git add src/pages/targeting/BulkActionBar.jsx
git commit -m "feat(targets): add BulkActionBar component (presentation only)"
```

---

## Task 4: Wire `FilterRow` — Select button + hide on selection

**Files:**
- Modify: `src/pages/targeting/FilterRow.jsx`

- [ ] **Step 1: Add the Select button and the early-return**

Replace the top of `src/pages/targeting/FilterRow.jsx`:

```jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
```

with:

```jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpDown, Check, ChevronDown, ListChecks } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
```

And replace the existing `export default function FilterRow()`:

```jsx
export default function FilterRow() {
  const { filter, sort, setFilter, setSort, targets } = useTargetsStore()

  // Counts mirror the bucket semantics in `filterTargets`: active =
  // everything except archived; archived = status === 'archived'.
  const counts = useMemo(() => {
    let active = 0
    let archived = 0
    for (const t of targets) {
      if (t.status === 'archived') archived += 1
      else active += 1
    }
    return { active, archived }
  }, [targets])

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 lg:flex-nowrap lg:gap-3">
      {FILTERS.map((f) => {
```

with:

```jsx
export default function FilterRow() {
  const {
    filter,
    sort,
    setFilter,
    setSort,
    targets,
    selectionMode,
    enterSelection,
  } = useTargetsStore()

  // Counts mirror the bucket semantics in `filterTargets`: active =
  // everything except archived; archived = status === 'archived'.
  const counts = useMemo(() => {
    let active = 0
    let archived = 0
    for (const t of targets) {
      if (t.status === 'archived') archived += 1
      else active += 1
    }
    return { active, archived }
  }, [targets])

  // Selection mode owns the row entirely — BulkActionBar renders
  // in this slot. Returning null avoids any flicker from a half-
  // rendered FilterRow during the swap.
  if (selectionMode) return null

  // Hide the Select trigger when the current bucket is empty —
  // nothing to select.
  const canSelect = counts[filter] > 0

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 lg:flex-nowrap lg:gap-3">
      {FILTERS.map((f) => {
```

- [ ] **Step 2: Add the Select button inside the row**

In the same file, find the `<div className="lg:ml-auto">` wrapping the `SortDropdown` and replace it with:

```jsx
      <div className="flex items-center gap-2 lg:ml-auto">
        {canSelect && (
          <button
            type="button"
            onClick={enterSelection}
            aria-label="Select targets"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-bg px-3 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Select</span>
          </button>
        )}
        <SortDropdown value={sort} onChange={setSort} />
      </div>
```

- [ ] **Step 3: Verify the Select button renders**

```
mcp__Claude_Preview__preview_eval
```

```js
window.location.href = 'http://localhost:5173/targeting';
'navigating'
```

Then:

```
mcp__Claude_Preview__preview_eval
```

```js
const btns = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Select');
btns.length
```

Expected: `1` (the new Select button on FilterRow).

- [ ] **Step 4: Verify Select toggles into selection mode and hides FilterRow**

```
mcp__Claude_Preview__preview_click
```

Click the Select button (use its accessible name or selector).

Then:

```
mcp__Claude_Preview__preview_eval
```

```js
// FilterRow returns null, so the Active/Archived pill row should be gone.
const activePill = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Active'));
activePill ? 'STILL THERE' : 'hidden'
```

Expected: `'hidden'`.

The page won't yet show `BulkActionBar` because `TargetList` doesn't render it yet — Task 6 wires that. For now, FilterRow disappearing is the only visible effect of Select. Reset the mode for the next step:

```
mcp__Claude_Preview__preview_eval
```

```js
// No public window handle — refresh to reset state.
window.location.reload();
'reloaded'
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/targeting/FilterRow.jsx
git commit -m "feat(targets): add Select button to FilterRow + hide row in selection mode"
```

---

## Task 5: Update `TargetRow` for selection mode

**Files:**
- Modify: `src/pages/targeting/TargetRow.jsx`

- [ ] **Step 1: Add the selection-mode reads and the checkbox**

Replace the top imports of `src/pages/targeting/TargetRow.jsx`:

```jsx
import { BadgeCheck, ChevronRight, Hash, Lock, Star } from 'lucide-react'
```

with:

```jsx
import { BadgeCheck, Check, ChevronRight, Hash, Lock, Star } from 'lucide-react'
```

Find the existing `export default function TargetRow(...)` and replace the entire function body. The new version reads `selectionMode` + `selection` + `toggleSelect`, branches the click handler, and swaps the right-edge affordance:

```jsx
export default function TargetRow({ target, isTop, isFirst, onOpen }) {
  const depleted = target.status === 'depleted'
  const processingId = useTargetsStore((s) => s.processingId)
  const selectionMode = useTargetsStore((s) => s.selectionMode)
  const selection = useTargetsStore((s) => s.selection)
  const toggleSelect = useTargetsStore((s) => s.toggleSelect)
  const isSelected = selection.has(target.id)
  const isProcessing = target.status === 'active' && target.id === processingId
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

  // In selection mode the row IS the checkbox. Click toggles selection
  // instead of opening the drawer; role flips so screen readers announce
  // the checked state. Out of selection mode we keep the prior behavior.
  const handleClick = () => {
    if (selectionMode) toggleSelect(target.id)
    else onOpen(target)
  }

  return (
    <div
      role={selectionMode ? 'checkbox' : 'button'}
      aria-checked={selectionMode ? isSelected : undefined}
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleClick()
        }
      }}
      className={`group relative flex min-h-[64px] cursor-pointer items-center gap-3 py-3 pl-4 pr-3 transition-colors hover:bg-bg focus:bg-bg focus:outline-none ${
        isFirst ? '' : 'border-t border-border'
      } ${depleted ? 'bg-bg/60' : ''} ${
        selectionMode && isSelected ? 'bg-blue-tint/30' : ''
      }`}
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
          {/* Mobile-only status dot. When this row is the engine's current
              focus, an animate-ping halo radiates from it to mirror the
              desktop pill ring. */}
          <span
            aria-label={isProcessing ? 'Following from this target' : statusLabel[target.status]}
            className="relative inline-flex h-2 w-2 shrink-0 items-center justify-center md:hidden"
          >
            {isProcessing && (
              <span
                aria-hidden="true"
                className="absolute inline-flex h-full w-full rounded-full bg-green-base opacity-60 animate-ping"
              />
            )}
            <span
              className={`relative inline-block h-2 w-2 rounded-full ${statusDotClass[target.status]}`}
            />
          </span>

          <span
            className={`truncate text-sm font-medium ${
              depleted ? 'text-text-muted line-through' : 'text-text-primary'
            }`}
          >
            {target.value}
          </span>

          {!isHashtag && target.verified && (
            <BadgeCheck
              className="h-3.5 w-3.5 shrink-0 fill-blue-base text-white"
              aria-label="Verified"
            />
          )}
          {!isHashtag && target.private && (
            <Lock
              className="h-3 w-3 shrink-0 text-text-muted"
              aria-label="Private"
            />
          )}

          {isTop && (
            <Star
              className="h-3.5 w-3.5 shrink-0 fill-yellow-base text-yellow-base"
              aria-label="Top performer"
            />
          )}

          {/* Full pill on md:+ */}
          <Tooltip
            text={
              isProcessing
                ? 'The engine just picked this target and is following a user right now.'
                : STATUS_TOOLTIP[target.status]
            }
            className="hidden shrink-0 md:inline-flex"
          >
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                statusPillClass[target.status]
              } ${
                isProcessing
                  ? 'ring-2 ring-green-base/50 ring-offset-1 ring-offset-surface animate-pulse'
                  : ''
              }`}
            >
              {isProcessing ? 'Following…' : statusLabel[target.status]}
            </span>
          </Tooltip>
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

      {/* Right-edge affordance: chevron normally; checkbox in selection mode. */}
      {selectionMode ? (
        <span
          aria-hidden="true"
          className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
            isSelected
              ? 'border-blue-base bg-blue-base text-white'
              : 'border-border bg-surface'
          }`}
        >
          {isSelected && <Check className="h-3.5 w-3.5" />}
        </span>
      ) : (
        <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center">
          <ChevronRight
            className="h-4 w-4 text-text-muted transition-colors group-hover:text-text-primary"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify no runtime errors**

```
mcp__Claude_Preview__preview_console_logs
```

Expected: No errors. Without `BulkActionBar` rendered yet, selection mode is unreachable from the UI but the row code is in place.

- [ ] **Step 3: Commit**

```bash
git add src/pages/targeting/TargetRow.jsx
git commit -m "feat(targets): TargetRow swaps click + chevron-vs-checkbox in selection mode"
```

---

## Task 6: Update `TargetList` — render `BulkActionBar` + master checkbox

**Files:**
- Modify: `src/pages/targeting/TargetList.jsx`

- [ ] **Step 1: Add imports + reads**

Replace the contents of `src/pages/targeting/TargetList.jsx`:

```jsx
import { useMemo } from 'react'
import { Check, Minus } from 'lucide-react'
import TargetRow from './TargetRow'
import BulkActionBar from './BulkActionBar'
import {
  useTargetsStore,
  filterTargets,
  sortTargets,
} from '@/stores/useTargetsStore'

export default function TargetList({ onOpen, onBulkRemove, onBulkRestore }) {
  const targets = useTargetsStore((s) => s.targets)
  const filter = useTargetsStore((s) => s.filter)
  const sort = useTargetsStore((s) => s.sort)
  const selectionMode = useTargetsStore((s) => s.selectionMode)
  const selection = useTargetsStore((s) => s.selection)
  const exitSelection = useTargetsStore((s) => s.exitSelection)
  const selectAllVisible = useTargetsStore((s) => s.selectAllVisible)
  const clearSelection = useTargetsStore((s) => s.clearSelection)
  const pauseTarget = useTargetsStore((s) => s.pauseTarget)

  const visible = useMemo(() => {
    return sortTargets(filterTargets(targets, filter), sort)
  }, [targets, filter, sort])

  const topTargetId = useMemo(() => {
    const actives = targets.filter((t) => t.status === 'active')
    if (actives.length === 0) return null
    return actives.reduce((best, t) =>
      t.followBackCount > best.followBackCount ? t : best
    ).id
  }, [targets])

  const hasAnyTarget = targets.length > 0

  // --- Selection helpers ---
  const visibleIds = useMemo(() => visible.map((t) => t.id), [visible])
  const selectedCount = selection.size
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selection.has(id))
  const someVisibleSelected =
    !allVisibleSelected && visibleIds.some((id) => selection.has(id))

  const onToggleAll = () => {
    if (allVisibleSelected) clearSelection()
    else selectAllVisible(visibleIds)
  }

  // Pause is enabled when at least one selected row is pausable
  // (status active or queued). Already-paused, depleted, archived
  // rows wouldn't change.
  const selectedTargets = useMemo(
    () => visible.filter((t) => selection.has(t.id)),
    [visible, selection],
  )
  const pauseDisabled = !selectedTargets.some(
    (t) => t.status === 'active' || t.status === 'queued',
  )

  const handlePause = () => {
    selectedTargets.forEach((t) => {
      if (t.status === 'active' || t.status === 'queued') pauseTarget(t.id)
    })
    // Toast + exit handled here so the bar's onPause is a thin wrapper.
    import('@/stores/useToasts').then(({ useToasts }) => {
      const count = selectedTargets.filter(
        (t) => t.status === 'active' || t.status === 'queued',
      ).length
      const message = count === 1
        ? `${selectedTargets.find((t) => t.status === 'active' || t.status === 'queued').value} paused`
        : `${count} targets paused`
      useToasts.getState().addToast({ message, tone: 'success' })
    })
    exitSelection()
  }

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
      {selectionMode && (
        <BulkActionBar
          count={selectedCount}
          bucket={filter}
          onExit={exitSelection}
          onPause={handlePause}
          onRemove={() => onBulkRemove(selectedTargets)}
          onRestore={() => onBulkRestore(selectedTargets)}
          pauseDisabled={pauseDisabled}
        />
      )}

      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        <div className="flex items-center gap-3">
          {selectionMode && (
            <button
              type="button"
              role="checkbox"
              aria-checked={allVisibleSelected ? true : someVisibleSelected ? 'mixed' : false}
              aria-label={allVisibleSelected ? 'Clear selection' : 'Select all visible'}
              onClick={onToggleAll}
              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                allVisibleSelected || someVisibleSelected
                  ? 'border-blue-base bg-blue-base text-white'
                  : 'border-border bg-surface'
              }`}
            >
              {allVisibleSelected && <Check className="h-3.5 w-3.5" />}
              {someVisibleSelected && <Minus className="h-3.5 w-3.5" />}
            </button>
          )}
          <span>Name</span>
        </div>
        <span className="pr-9">Follow-backs</span>
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
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function EmptyNoTargets() {
  return (
    <div className="px-4 py-16 text-center">
      <h3 className="text-lg font-semibold text-text-primary">No targets yet</h3>
      <p className="mt-1 text-sm text-text-secondary">
        Add an account or hashtag for Kicksta to follow users from.
        Expect first results within 24–72 hours.
      </p>
    </div>
  )
}

const FILTER_EMPTY_COPY = {
  active: 'No active targets — add one to start growing.',
  archived: 'Nothing in archive yet.',
}

function EmptyForFilter({ filter }) {
  const copy = FILTER_EMPTY_COPY[filter] || 'Nothing to show.'
  return (
    <div className="px-4 py-8 text-center text-sm text-text-muted">{copy}</div>
  )
}
```

> **Why import useToasts dynamically inside handlePause:** Avoids a top-level import that would tie TargetList to the toasts store even when the user never bulk-pauses. The store is small; a static top-level import is fine too — both work. If you prefer, replace the dynamic import with a normal one at the top.

- [ ] **Step 2: Verify the page renders without errors before wiring TargetsTab**

`TargetList` now expects `onBulkRemove` and `onBulkRestore` props that `TargetsTab` doesn't pass yet — those will be added in Task 9. For now temporarily pass no-ops:

Edit `src/pages/targeting/TargetsTab.jsx`:

Replace:
```jsx
      <TargetList onOpen={(t) => setDetailTarget(t)} />
```

with:
```jsx
      <TargetList
        onOpen={(t) => setDetailTarget(t)}
        onBulkRemove={() => {}}
        onBulkRestore={() => {}}
      />
```

This is a temporary stub. Task 9 replaces both no-ops with real handlers.

- [ ] **Step 3: Verify selection mode reachable + master checkbox works**

```
mcp__Claude_Preview__preview_eval
```

```js
window.location.href = 'http://localhost:5173/targeting';
'navigating'
```

Wait for the page to settle. Click Select:

```
mcp__Claude_Preview__preview_click
```

Use selector: `button[aria-label="Select targets"]`

Then verify the bar appears and FilterRow is gone:

```
mcp__Claude_Preview__preview_eval
```

```js
const bar = document.querySelector('[role="toolbar"][aria-label="Bulk actions"]');
const filterPill = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Active'));
JSON.stringify({ barPresent: !!bar, filterRowVisible: !!filterPill })
```

Expected: `{"barPresent":true,"filterRowVisible":false}`.

Toggle master checkbox:

```
mcp__Claude_Preview__preview_click
```

Selector: `button[aria-label="Select all visible"]`

Then:

```
mcp__Claude_Preview__preview_eval
```

```js
const count = document.querySelector('[role="toolbar"] [aria-live="polite"]').innerText;
count  // should be "N selected" with N === number of rows in bucket
```

Expected: A non-zero count matching the mock targets. Confirm row checkboxes flipped to selected via row screenshot or DOM check.

Click X on the bar to exit:

```
mcp__Claude_Preview__preview_click
```

Selector: `button[aria-label="Cancel selection"]`

Verify FilterRow returns:

```
mcp__Claude_Preview__preview_eval
```

```js
const filterPill = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Active'));
filterPill ? 'back' : 'STILL GONE'
```

Expected: `'back'`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/targeting/TargetList.jsx src/pages/targeting/TargetsTab.jsx
git commit -m "feat(targets): render BulkActionBar + master checkbox in TargetList"
```

---

## Task 7: Create `BulkRemoveModal`

**Files:**
- Create: `src/pages/targeting/BulkRemoveModal.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/targeting/BulkRemoveModal.jsx`:

```jsx
import { useEffect } from 'react'

// Bulk-aware "Archive N targets?" confirm. Mirrors RemoveTargetModal:
// bottom sheet on mobile (items-end), centered modal on desktop
// (lg:items-center). Primary button uses the action name per CLAUDE.md.
//
// `targets` is the array of target objects the user has selected. The
// component summarizes up to 3 handles inline; if more, appends
// "and N more" to keep the body legible.
export default function BulkRemoveModal({ targets, onClose, onConfirm }) {
  // Close on Escape.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!targets || targets.length === 0) return null

  const n = targets.length
  const preview = targets.slice(0, 3).map((t) => t.value).join(', ')
  const rest = n > 3 ? ` and ${n - 3} more` : ''

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Archive targets"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-xl bg-surface p-5 shadow-xl lg:max-w-md lg:rounded-xl"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          Archive {n} targets?
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {preview}{rest} will move to your Archive and stop being used for growth. You can restore them at any time.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-4 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Keep them
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-red-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Move {n} to Archive
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/targeting/BulkRemoveModal.jsx
git commit -m "feat(targets): add BulkRemoveModal (Archive N targets? confirm)"
```

---

## Task 8: Create `RestoreLimitModal`

**Files:**
- Create: `src/pages/targeting/RestoreLimitModal.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/targeting/RestoreLimitModal.jsx`:

```jsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Block modal shown when a bulk Restore would push the user's
// in-rotation target count over their plan's slot limit. Single
// dismiss action ("Got it") that returns to selection mode with
// the selection intact, plus an Upgrade plan shortcut that routes
// to the Plan & Billing surface (PlanCard owns the upgrade flow).
export default function RestoreLimitModal({
  inRotationCount,
  attemptedCount,
  slotLimit,
  onClose,
}) {
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Restore would exceed plan limit"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-xl bg-surface p-5 shadow-xl lg:max-w-md lg:rounded-xl"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          Restoring would exceed your plan limit
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          You're at {inRotationCount}/{slotLimit} targets in rotation.
          Restoring {attemptedCount} more would put you over the limit.
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Restore fewer, or upgrade for more slots.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-4 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Got it
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate('/account/billing')
            }}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Upgrade plan
          </button>
        </div>
      </div>
    </div>
  )
}
```

> **Why `/account/billing`:** Verified in `src/App.jsx:52` — the Billing tab mounts at that route. `PlanCard.jsx` lives on that page and owns the upgrade flow (currently `UpgradeStubModal`). Routing here lands the user one tap away from upgrade. When the real proration modal ships (separate spec in the pending queue), this navigate target may move — but for the spec scope of this task, "Upgrade plan shortcut" via navigation is the right level of coupling.

- [ ] **Step 2: Commit**

```bash
git add src/pages/targeting/RestoreLimitModal.jsx
git commit -m "feat(targets): add RestoreLimitModal (slot-limit block on bulk Restore)"
```

---

## Task 9: Wire `TargetsTab` — modals, callbacks, Esc handler

**Files:**
- Modify: `src/pages/targeting/TargetsTab.jsx`

- [ ] **Step 1: Replace TargetsTab**

Replace the contents of `src/pages/targeting/TargetsTab.jsx`:

```jsx
import { useEffect, useState } from 'react'
import TargetsHeroCard from './TargetsHeroCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'
import TargetDetailDrawer from './TargetDetailDrawer'
import RemoveTargetModal from './RemoveTargetModal'
import AddTargetSheet from './AddTargetSheet'
import BulkRemoveModal from './BulkRemoveModal'
import RestoreLimitModal from './RestoreLimitModal'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { useToasts } from '@/stores/useToasts'
import { slotLimit, inRotationCount } from '@/utils/targetSlots'

// Targets tab — operational view: list, filter, sort, add, drill into
// per-target detail. Default tab on /targeting. Also owns the bulk-
// select page-level concerns: Esc-to-exit and confirm modals.
export default function TargetsTab() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [bulkRemoveTargets, setBulkRemoveTargets] = useState(null)
  const [restoreLimitData, setRestoreLimitData] = useState(null)

  const selectionMode = useTargetsStore((s) => s.selectionMode)
  const exitSelection = useTargetsStore((s) => s.exitSelection)
  const removeTargetAction = useTargetsStore((s) => s.removeTarget)
  const restoreTargetAction = useTargetsStore((s) => s.restoreTarget)
  const allTargets = useTargetsStore((s) => s.targets)

  // Page-level Esc handler — exits selection when active. Modal-level
  // Esc handlers already exist inside the modals themselves.
  useEffect(() => {
    if (!selectionMode) return
    function onKey(e) {
      if (e.key === 'Escape') exitSelection()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectionMode, exitSelection])

  const handleBulkRemove = (targets) => {
    if (!targets || targets.length === 0) return
    setBulkRemoveTargets(targets)
  }

  const confirmBulkRemove = () => {
    const targets = bulkRemoveTargets || []
    targets.forEach((t) => removeTargetAction(t.id))
    useToasts.getState().addToast({
      message: `${targets.length} ${targets.length === 1 ? 'target' : 'targets'} archived`,
      tone: 'success',
    })
    setBulkRemoveTargets(null)
    exitSelection()
  }

  const handleBulkRestore = (targets) => {
    if (!targets || targets.length === 0) return
    const limit = slotLimit()
    const current = inRotationCount(allTargets)
    if (current + targets.length > limit) {
      setRestoreLimitData({
        inRotationCount: current,
        attemptedCount: targets.length,
        slotLimit: limit,
      })
      return
    }
    targets.forEach((t) => restoreTargetAction(t.id))
    useToasts.getState().addToast({
      message: `${targets.length} ${targets.length === 1 ? 'target' : 'targets'} restored to rotation`,
      tone: 'success',
    })
    exitSelection()
  }

  return (
    <>
      <TargetsHeroCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList
        onOpen={(t) => setDetailTarget(t)}
        onBulkRemove={handleBulkRemove}
        onBulkRestore={handleBulkRestore}
      />

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

      {bulkRemoveTargets && (
        <BulkRemoveModal
          targets={bulkRemoveTargets}
          onClose={() => setBulkRemoveTargets(null)}
          onConfirm={confirmBulkRemove}
        />
      )}

      {restoreLimitData && (
        <RestoreLimitModal
          {...restoreLimitData}
          onClose={() => setRestoreLimitData(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: End-to-end bulk Remove flow check**

```
mcp__Claude_Preview__preview_eval
```

```js
window.location.href = 'http://localhost:5173/targeting';
'navigating'
```

Click Select:

```
mcp__Claude_Preview__preview_click
```

Selector: `button[aria-label="Select targets"]`

Tick all rows via master checkbox:

```
mcp__Claude_Preview__preview_click
```

Selector: `button[aria-label="Select all visible"]`

Click Remove:

```
mcp__Claude_Preview__preview_click
```

Selector: `button[aria-label$="targets"][aria-label^="Archive"]`

(Use the `aria-label` ending with `targets` and starting with `Archive` — this is the Remove button in the bar; the modal hasn't opened yet.)

Verify the modal renders:

```
mcp__Claude_Preview__preview_eval
```

```js
const dialog = document.querySelector('[role="dialog"][aria-label="Archive targets"]');
dialog ? dialog.innerText.split('\n').slice(0,3) : 'NO MODAL'
```

Expected: array starting with `Archive N targets?`.

Click the primary button:

```
mcp__Claude_Preview__preview_click
```

Selector: pick the button with `Move` text in the modal.

Verify selection cleared, FilterRow returns, and a toast appeared:

```
mcp__Claude_Preview__preview_eval
```

```js
const filterPill = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Active'));
const toastNode = [...document.querySelectorAll('*')].find(el => /archived$/.test(el.textContent || ''));
JSON.stringify({ filterRow: !!filterPill, toast: !!toastNode })
```

Expected: `{"filterRow":true,"toast":true}`.

- [ ] **Step 3: End-to-end bulk Pause flow check**

Reload to reset state:

```
mcp__Claude_Preview__preview_eval
```

```js
window.location.reload();
'reloading'
```

Repeat the Select → Select-all sequence, then click Pause:

```
mcp__Claude_Preview__preview_click
```

Selector: `button[aria-label$="targets"][aria-label^="Pause"]`

Verify selection cleared and at least one row that was `active` or `queued` is now `paused`:

```
mcp__Claude_Preview__preview_eval
```

```js
// All status pills inside row chrome:
const pills = [...document.querySelectorAll('section .rounded-full')]
  .map(p => p.innerText.trim().toLowerCase())
  .filter(Boolean);
pills.includes('paused') ? 'paused-present' : pills.join(',')
```

Expected: `'paused-present'`.

- [ ] **Step 4: Bulk Restore flow check (with mocked over-limit case)**

Switch to Archived bucket first. Need at least one archived row — the prior Remove step archived rows already.

```
mcp__Claude_Preview__preview_eval
```

```js
window.location.href = 'http://localhost:5173/targeting';
'reset'
```

Click `Archived` filter, then `Select`, then `Select all visible`. Then click Restore:

```
mcp__Claude_Preview__preview_click
```

Selector: `button[aria-label$="targets"][aria-label^="Restore"]`

Two outcomes are possible depending on mock counts:

1. **Under limit:** Selection exits, toast `"N targets restored to rotation"` appears.
2. **Over limit:** `RestoreLimitModal` opens.

If (1), to force (2) for verification, you can either: (a) add more mock archived rows in `src/mocks/targets.js` temporarily and revert; or (b) just verify the over-limit branch manually by reading the code and trusting the flow. The under-limit path is sufficient for V1 ship verification.

- [ ] **Step 5: Esc-to-exit check**

```
mcp__Claude_Preview__preview_eval
```

```js
window.location.reload();
'reloading'
```

Enter selection mode (click Select). Tick one row. Send Escape:

```
mcp__Claude_Preview__preview_eval
```

```js
document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
'sent'
```

Then:

```
mcp__Claude_Preview__preview_eval
```

```js
const bar = document.querySelector('[role="toolbar"][aria-label="Bulk actions"]');
const filterPill = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith('Active'));
JSON.stringify({ bar: !!bar, filterRow: !!filterPill })
```

Expected: `{"bar":false,"filterRow":true}`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/targeting/TargetsTab.jsx
git commit -m "feat(targets): wire bulk-select callbacks + modals + Esc handler in TargetsTab"
```

---

## Task 10: Final cross-browser polish + regression sweep

**Files:** None (verification only)

- [ ] **Step 1: Mobile viewport check**

```
mcp__Claude_Preview__preview_resize
```

Set viewport to 375×812 (iPhone SE-ish).

Then navigate to `/targeting`, enter selection mode, and verify:

```
mcp__Claude_Preview__preview_eval
```

```js
const bar = document.querySelector('[role="toolbar"][aria-label="Bulk actions"]');
const rect = bar?.getBoundingClientRect();
JSON.stringify({
  width: rect?.width,
  inViewport: rect && rect.left >= 0 && rect.right <= window.innerWidth,
  height: rect?.height,
})
```

Expected: width fits viewport, height around 48px, bar fully in viewport.

Tap a row to toggle selection (via preview_click). Confirm the entire row is the tap target (no need to hit a small checkbox). Confirm the checkbox visually flips.

Tap X to exit. Confirm FilterRow returns and Sort dropdown is visible.

- [ ] **Step 2: Regression — confirm pre-existing flows still work**

Reload, then:

1. **Drawer flow:** Click any row out of selection mode → drawer opens. Use drawer's Remove → `RemoveTargetModal` opens (the single-row one, not the bulk one).
2. **Add target flow:** Click `Add target` in `TargetsHeroCard` → `AddTargetSheet` opens.
3. **Filter switch:** Click `Archived` → archived rows render. Click `Active` → back.
4. **Sort dropdown:** Open and pick a different sort → list re-orders.
5. **Slot count:** Verify `TargetsHeroCard` still shows `N/30` (or `N/10`).

All five must still work. If any broke, diagnose and fix before continuing.

- [ ] **Step 3: Dark mode check**

```
mcp__Claude_Preview__preview_eval
```

```js
document.documentElement.classList.toggle('dark');
'dark'
```

Navigate to `/targeting`, enter selection mode. Visual check: bar bg has the `bg-surface/95` + `backdrop-blur` effect against the page bg; checkboxes are visible; selected-row tint (`bg-blue-tint/30`) is readable. No color contrast issues.

Revert:

```
mcp__Claude_Preview__preview_eval
```

```js
document.documentElement.classList.remove('dark');
'light'
```

- [ ] **Step 4: Commit any polish fixes (if needed)**

If steps 1–3 surfaced any cosmetic fixes (e.g., a missing dark variant, a clipped bar on mobile), apply them as a single follow-up commit:

```bash
git add -p
git commit -m "polish(targets): bulk-select cross-viewport fixes"
```

If no fixes were needed, no commit at this step.

- [ ] **Step 5: Final commit summary**

```bash
git log --oneline -10
```

Confirm the bulk-select arc reads cleanly:

```
feat(targets): wire bulk-select callbacks + modals + Esc handler in TargetsTab
feat(targets): add RestoreLimitModal (slot-limit block on bulk Restore)
feat(targets): add BulkRemoveModal (Archive N targets? confirm)
feat(targets): render BulkActionBar + master checkbox in TargetList
feat(targets): TargetRow swaps click + chevron-vs-checkbox in selection mode
feat(targets): add Select button to FilterRow + hide row in selection mode
feat(targets): add BulkActionBar component (presentation only)
refactor(targets): extract slot-limit helpers to utils/targetSlots
feat(targets): add selection state to useTargetsStore
docs(spec): targets bulk-select design
```

---

## CHANGELOG update (after merge, not now)

When this lands on `main`, add the entry to `CHANGELOG.md`:

```markdown
## 2026-05-18 — Targets bulk-select

### Added
- `BulkActionBar` on the Targets list. Tap `Select` in FilterRow → enter selection mode; FilterRow hides and the sticky bar takes its slot.
- Master checkbox in the column header for select-all-visible (empty / check / dash states).
- Bulk **Pause** (Active bucket) and **Remove** actions in the bar; bulk **Restore** in the Archived bucket.
- `BulkRemoveModal` — "Archive N targets?" confirm, mirrors single-row `RemoveTargetModal`.
- `RestoreLimitModal` — blocks bulk Restore if it would exceed plan slot limit. Single dismiss + Upgrade-plan shortcut.
- `src/utils/targetSlots.js` — extracted `slotLimit()` + `inRotationCount(targets)` helpers from inline math in `TargetsHeroCard`.

### Changed
- `useTargetsStore` gained `selectionMode`, `selection`, and 5 actions (`enterSelection`, `exitSelection`, `toggleSelect`, `selectAllVisible`, `clearSelection`).
- `TargetRow` flips between `role="button"` (open drawer) and `role="checkbox"` (toggle selection) based on `selectionMode`.
- `FilterRow` renders `null` while `selectionMode === true`; hides the Select button when the visible bucket is empty.

### Decisions (locked, don't revisit)
- Bulk Pause uses no confirm (reversible); bulk Remove always confirms via `BulkRemoveModal`; bulk Restore confirms only on slot-limit block.
- Bulk Resume **not exposed** in the bar — remains per-row in the drawer. Reason: paused→queued bulk transition adds an edge case (single-active invariant) the V1 surface doesn't need.
- Hard-delete from Archive **not in V1**. Archive is the undo path.
- Selection state lives on the store (not component-local) so future surfaces can wire in cleanly.
```
