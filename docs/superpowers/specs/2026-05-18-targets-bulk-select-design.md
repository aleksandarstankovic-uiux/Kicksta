# Targets Bulk-Select — Design Spec

**Date:** 2026-05-18
**Page:** `/targeting` (TargetsTab — the default Targeting tab)
**Status:** Brainstorming locked. Awaiting implementation plan.

## Why

The Targeting page currently exposes per-row actions (open drawer → Pause / Resume / Remove) but no way to act on multiple targets at once. Users with many targets (Advanced cap = 30) doing housekeeping — pausing a niche batch, archiving a set after a campaign — must one-by-one through the drawer. Bulk-select adds a multi-row selection mode with a sticky action bar replacing FilterRow.

This is item #1 in the pending-specs queue (CONTEXT.md, 2026-05-18 resume context).

## Scope (V1)

**In scope:**
- Selection mode on the Targets list (Targeting page, `TargetsTab` only).
- Actions in the bar: **Pause**, **Remove** (Active bucket) · **Restore** (Archived bucket).
- Bulk-aware confirm modal for Remove (mirrors `RemoveTargetModal`).
- Slot-limit block for Restore (modal explaining the limit).
- Master checkbox in the column header (select all visible).
- Keyboard support: Esc exits, Space toggles focused row.

**Out of scope (V1, deferred):**
- Bulk-select on the Overview page's `TargetsOverview` snapshot card.
- **Bulk Resume** (paused → queued transition not exposed in the bar; remains per-row in the drawer).
- **Hard-delete from Archive** (requires a new store action + irreversibility warning).
- Undo toast after Remove (no project-wide undo pattern yet; the Archive bucket IS the undo path).
- Shift-click range selection.

## Architecture

### State (store layer)

New state and actions on `useTargetsStore`:

```js
selectionMode: false,
selection: new Set(),  // Set<targetId>

enterSelection: () => set({ selectionMode: true, selection: new Set() }),
exitSelection:  () => set({ selectionMode: false, selection: new Set() }),
toggleSelect: (id) => set((s) => {
  const next = new Set(s.selection)
  if (next.has(id)) next.delete(id); else next.add(id)
  return { selection: next }
}),
selectAllVisible: (ids) => set({ selection: new Set(ids) }),
clearSelection: () => set({ selection: new Set() }),
```

Selection state is store-level (not component-local) so future surfaces (deep-link to "select these targets," cross-page bulk actions) wire trivially.

### Components

| Component | Path | Role |
|---|---|---|
| `BulkActionBar.jsx` | `src/pages/targeting/` | The sticky bar that replaces FilterRow during selection mode. |
| `BulkRemoveModal.jsx` | `src/pages/targeting/` | Bulk-aware "Archive N targets?" confirm. Mirrors `RemoveTargetModal`. |
| `RestoreLimitModal.jsx` | `src/pages/targeting/` | Blocks bulk Restore if it would exceed plan slot limit. |
| `FilterRow.jsx` | (existing) | Gains a **Select** button (hidden when bucket is empty). Hides entirely while `selectionMode === true`. |
| `TargetList.jsx` | (existing) | Column header gains a master checkbox in selection mode. |
| `TargetRow.jsx` | (existing) | In selection mode: row click → `toggleSelect` (not `onOpen`); right-edge `ChevronRight` swaps for a checkbox; `role="checkbox"`. |
| `TargetsTab.jsx` | (existing) | Renders `BulkActionBar` and `BulkRemoveModal` / `RestoreLimitModal` alongside the existing drawers. |

## Section 1 — Entry, Exit, Selection State

### Entry
`FilterRow` gains a **Select** button (right side on desktop, inline-wrap on mobile). Tap → calls `enterSelection()`.

### Selection mode swap-out
While `selectionMode === true`:
- `FilterRow` (filter pills + sort + Select button) is **not rendered**.
- `BulkActionBar` renders in the same vertical slot.

**Why hide FilterRow instead of disable it:** Switching filter or sort mid-selection introduces lost-selection edge cases (rows leave the visible set). Hiding eliminates those by construction.

### Exit
- Tap `X` on the bar → calls `exitSelection()`.
- Successful bulk action (Pause / Remove / Restore completes) → `exitSelection()`.
- `Esc` key → `exitSelection()`.

`exitSelection` resets both `selectionMode` and `selection` (defensive cleanup).

### Row-click behavior in selection mode
- `TargetRow.onClick` calls `toggleSelect(target.id)` instead of `onOpen(target)`.
- Entire row remains the tap target (not just the checkbox).
- `ChevronRight` hides; checkbox renders in its place.
- The pulse halo on the runner stays (selection mode is an overlay, not a state change).

## Section 2 — Selection mode UI

### BulkActionBar layout

```
┌──────────────────────────────────────────────────────┐
│  [X]  3 selected                  [Pause]  [Remove]  │
└──────────────────────────────────────────────────────┘
```

- **Left:** `X` icon-button (44×44 tap target) + count ("N selected") in `text-sm font-medium text-text-primary`. Count uses `aria-live="polite"`.
- **Right:** Action buttons in the `h-9 rounded-full px-3 text-xs font-medium` recipe (same as FilterRow pills).
  - **Active bucket:** `Pause` (`bg-bg text-text-secondary hover:text-text-primary`) · `Remove` (`bg-red-tint text-red-text hover:bg-red-tint/80`).
  - **Archived bucket:** `Restore` (`bg-bg text-text-secondary hover:text-text-primary`).
- **Sticky:** `sticky top-0 z-10 bg-surface/95 backdrop-blur border-b border-border`.
- **Mobile:** Same top placement (not bottom-floating). The bar appears in the same place the user just tapped Select; bottom edge is reserved for sheets / Intercom.

`role="toolbar"` with `aria-label="Bulk actions"`.

### Master checkbox in column header

```
┌──────────────────────────────────────────────────────┐
│  [☐]  NAME                             FOLLOW-BACKS  │
└──────────────────────────────────────────────────────┘
```

- **States:** empty (no rows selected) · check (all visible selected) · dash icon (`Minus` from lucide — partial).
- **Tap behavior:**
  - Empty or partial → `selectAllVisible(visibleIds)`.
  - Check → `clearSelection()`.
- **"Visible" definition:** All rows currently rendered after filter/sort. Since FilterRow is hidden during selection, "visible" = all rows in the current bucket (the one selection mode was entered from).

### Row checkbox
- `h-5 w-5 rounded border border-border` square on the right edge of the row, replacing `ChevronRight`.
- Checked: `bg-blue-base border-blue-base` with white `Check` icon centered.
- Row height (`min-h-[64px]`) unchanged.
- Whole row remains the tap target.

### Depleted rows
Still render with `bg-bg/60` + line-through handle. **Selectable** (so they can be bulk-archived). Bulk-Pause on depleted is a no-op (silently skipped); bulk-Remove archives them.

## Section 3 — Action semantics & enable rules

### Bulk Pause (Active bucket)

- Iterates `selection`. For each id, if `status ∈ {'active', 'queued'}`, calls `pauseTarget(id)`.
- Already-paused rows: skipped silently.
- Depleted rows: skipped silently (no rotation to pause).
- After loop: `exitSelection()` + toast `"N targets paused"` (singular: `"@handle paused"` if N === 1).
- **No confirm modal** (fully reversible).
- **Enable rule:** Enabled iff ≥1 selected row is in `{'active', 'queued'}`. Otherwise `opacity-40 cursor-not-allowed` with `Tooltip`: `"Selected targets are already paused or depleted."`

### Bulk Remove (Active bucket)

Opens `BulkRemoveModal`:

```
Archive 3 targets?

@fitness.inspo, #homeworkouts, @yoga.daily
will move to your Archive and stop being used
for growth. You can restore them at any time.

[Keep them]              [Move 3 to Archive]
```

- **Title:** `"Archive N targets?"` (always plural — the bar opens this modal; singular per-row path uses `RemoveTargetModal` from the drawer).
- **Body:** List up to 3 selected handles inline; if `selection.size > 3`, append `" and N more"`. e.g. `@a, @b, @c and 2 more`.
- **Primary:** `"Move N to Archive"` solid red (`bg-red-base text-white`), action-name vocab per CLAUDE.md.
- **Secondary:** `"Keep them"`.
- **On confirm:** Iterate selection → `removeTarget(id)` for each → close modal → `exitSelection()` → toast `"N targets archived"`.
- **Enable rule:** Enabled iff `selection.size > 0` (every status can be archived).

### Bulk Restore (Archived bucket)

- **Pre-check:** Compute `currentInRotationCount` (= count of non-archived targets) + `selection.size`. If sum > `slotLimit` (Growth = 10, Advanced = 30), open `RestoreLimitModal` instead of acting.
- **Otherwise:** Iterate selection → `restoreTarget(id)` for each → `exitSelection()` → toast `"N targets restored to rotation"`.
- **No confirm modal** (non-destructive).
- **Enable rule:** Enabled iff `selection.size > 0`.

#### `RestoreLimitModal`

```
Restoring would exceed your plan limit

You're at 8/10 targets in rotation. Restoring
5 more would put you over the limit.

Restore fewer, or upgrade for more slots.

[Got it]              [Upgrade plan]
```

- **Primary:** `"Got it"` (dismiss, returns to selection mode with selection intact).
- **Secondary:** `"Upgrade plan"` → navigates to the upgrade flow (currently the `UpgradeStubModal` from `PlanCard.jsx`; will pick up the real proration modal when that ships as a separate spec).
- Reuses the shared Targeting modal header recipe (chip + title + subtitle + bottom border, per CONTEXT.md locked decisions).

#### Slot-limit data source
`slotLimit` and `currentInRotationCount` derive from the **same source the Add Target flow already uses** for its 11th-target enforcement. Implementation plan should locate that source and reuse it (not duplicate the math).

## Section 4 — Edge cases, accessibility, mobile

### Edge cases

| Case | Behavior |
|---|---|
| Empty bucket | `Select` button hidden on FilterRow (no rows to select). |
| Single visible row | Select button still shown. Selection mode works with one row. |
| Drawer open when entering selection mode | Not possible — Select button is on FilterRow, not on the row. Closing the drawer is a precondition to seeing FilterRow at all. |
| Cross-bucket selection | Impossible by construction (FilterRow hidden, can't switch buckets). |
| Sort change during selection | Impossible (Sort dropdown hidden). |
| Runner (`processingId`) bulk-paused | `pauseTarget` flips status to `'paused'`. `processingId` stays a stale pointer but the halo conditions on `status === 'active'` so it disappears automatically. No engine-pick logic in V1. |
| Runner bulk-archived | Same as above. `processingId` becomes a stale pointer to an `'archived'` row. |

### Keyboard

- `Esc` (in selection mode) → `exitSelection()`.
- Row checkbox `tabIndex={0}`; `Space` → `toggleSelect`.
- Master checkbox focusable; `Space` → toggle all-or-none.
- **No shift-click range select** (V1 mobile-first; rare utility).

### Accessibility

- `BulkActionBar` → `role="toolbar"` `aria-label="Bulk actions"`.
- Count text → `aria-live="polite"` so SR announces "3 selected" after each toggle.
- Row in selection mode → `role="checkbox"` with `aria-checked` reflecting state (swaps from existing `role="button"`).
- Action buttons → `aria-label="Pause 3 targets"` / `"Archive 3 targets"` / `"Restore 3 targets"` with the count interpolated.

### Mobile

- All checkboxes visually `h-5 w-5`, but tap area = full row or column-header cell (≥44px per CLAUDE.md touch-target rule).
- BulkActionBar height `h-12` (48px) — sized for thumb-friendly action buttons, not for matching FilterRow's compact height.
- Sticky positioning works alongside the existing page scroll — no layout-shift on scroll.

## Files to create

- `src/pages/targeting/BulkActionBar.jsx`
- `src/pages/targeting/BulkRemoveModal.jsx`
- `src/pages/targeting/RestoreLimitModal.jsx`

## Files to modify

- `src/stores/useTargetsStore.js` — add `selectionMode`, `selection`, `enterSelection`, `exitSelection`, `toggleSelect`, `selectAllVisible`, `clearSelection`.
- `src/pages/targeting/FilterRow.jsx` — add Select button; hide entire row when `selectionMode === true`.
- `src/pages/targeting/TargetList.jsx` — render `BulkActionBar` in selection mode; render master checkbox in column header in selection mode.
- `src/pages/targeting/TargetRow.jsx` — read `selectionMode`; swap onClick + chevron-vs-checkbox + role conditionally.
- `src/pages/targeting/TargetsTab.jsx` — render `BulkRemoveModal` + `RestoreLimitModal` alongside existing modals; own the page-level `Esc` keydown handler that calls `exitSelection()` when in selection mode.

## Open questions (none — all resolved during brainstorming)

All design decisions are locked. Implementation plan can proceed.
