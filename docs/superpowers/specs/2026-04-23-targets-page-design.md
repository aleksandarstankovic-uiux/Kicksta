# Targets Page — Design Spec

**Date:** 2026-04-23
**Route:** `/targets`
**Shell:** Dashboard (sidebar on `lg:`, bottom tab on mobile)
**Scope:** V1 frontend, all data mocked. Happy-path only — edge-case states (disconnected IG, at-cap upsell, downgrade auto-pause banner) deferred to a later spec.

---

## Purpose

Users come here primarily to **add new targets** and **manage existing ones** (pause, resume, remove). Monitoring target performance is secondary — per-row analytics stay lightweight. The page must feel calm and not overcrowded, even when the list is full (up to 30 rows on Advanced).

---

## Page Layout

Mobile-first, single column. On `lg:` max-width `max-w-5xl mx-auto`, no split rail. Page scrolls as one; no sticky zones in V1.

```
┌─────────────────────────────────────────────┐
│  Targets                                    │  Page header
│  Manage the accounts and hashtags …         │
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │  Target slots           8 / 30      │   │  Slots card
│  │  ████████░░░░░░░░░░░░░░░░░░░░        │   │
│  │  🔒 Kicksta follows within          │   │
│  │     Instagram's safe daily limits.  │   │
│  │                                     │   │
│  │              [ + Add target ]       │   │
│  └─────────────────────────────────────┘   │
│                                             │
│  [All 10] [Active 6] [Queued 1]             │  Filter row
│  [Paused 0] [Depleted 3]    Sort: Priority▾│
│                                             │
│  NAME                       FOLLOW-BACKS    │  Column header
│  ┌─────────────────────────────────────┐   │
│  │ ● @fitness.inspo  Active ★ 97   ⋮   │   │  List rows
│  │ ● #homeworkouts   Active   58   ⋮   │   │
│  │ ● #mealprep       Active   46   ⋮   │   │
│  │ ◐ @protein.pete   Queued   52   ⋮   │   │
│  │ ◦ @cleanfoodcrush Paused   29   ⋮   │   │
│  │ ✕ @yoga.daily     Depleted 134  ⋮   │   │
│  └─────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## 1. Page Header

- `h1`: `Targets`, `text-2xl font-semibold text-text-primary`.
- Sub: `Manage the accounts and hashtags Kicksta targets for your growth.` `mt-1 text-sm text-text-secondary`.
- No secondary CTA in the header — the only add-target button lives in the slots card.

---

## 2. Slots Card

Single-source CTA host. Always rendered.

### Anatomy

- Container: `rounded-xl border border-border bg-surface p-4 lg:p-6`.
- **Header row:**
  - Left: `Target slots` · `text-sm text-text-secondary`.
  - Right: `{activeCount + queued + paused + depleted} / {maxSlots}` · `text-sm font-semibold text-text-primary tabular-nums`.
- **Progress bar:**
  - Track: `h-2 w-full rounded-full bg-bg`.
  - Fill: `h-full rounded-full bg-green-base`, width = `(totalCount / maxSlots) * 100%`.
  - `mt-2`.
- **Trust one-liner:**
  - Row: `mt-3 flex items-center gap-1.5`.
  - Lucide `Lock` icon, `h-3.5 w-3.5 text-text-muted`.
  - Copy: `Kicksta follows within Instagram's safe daily limits.` · `text-xs text-text-muted`.
- **Primary button:** `+ Add target`
  - `mt-4`, 48px height, `rounded-lg bg-blue-base text-white font-medium`.
  - Full-width on mobile (`w-full`), auto-width right-aligned on desktop (`lg:w-auto lg:self-end`).
  - Lucide `Plus` icon `h-4 w-4`.
  - Opens Add Target sheet (Section 5).

### Count source

- `maxSlots` = `30` for Advanced, `10` for Growth. Read from `mockUser.plan`.
- `totalCount` = `mockTargets.length` (all statuses occupy slots).
- Active count for the filter pill = `mockTargets.filter(t => t.status === 'active').length`.

### Deferred (not in V1)

- At-cap state (button swap / disable, bar color change).
- Approaching-cap upsell copy for Growth users.

---

## 3. Filter Row

Sits directly below the slots card, `mt-6`.

### Pills

Row order (left to right): `All · Active · Queued · Paused · Depleted`.

- Pill: `rounded-full px-3 py-1 text-xs font-medium` (button element, 44×44 tap target via vertical padding).
- Selected: `bg-surface text-text-primary shadow-sm` inside a parent `rounded-full bg-bg p-1` segmented container.
- Unselected: `text-text-secondary`.
- Each pill shows its count inline: `All 10`, `Active 6`, etc.
- `All` is selected by default.

### Sort dropdown

Right-aligned on desktop, collapses to an icon button on mobile.

- Label: `Sort: Priority ▾`, `text-xs text-text-secondary`.
- Menu options:
  - `Priority` (default — active → queued → paused → depleted, then by follow-back desc).
  - `Follow-backs` (desc).
  - `Most recent` (by `addedAt` desc).
  - `A–Z` (alphabetical on `value`).
- Uses existing shadcn dropdown primitive.
- Mobile: renders as `ArrowUpDown` icon button (44×44); tapping opens the same menu as a bottom sheet.

### Mobile overflow

Pills row is horizontally scrollable (`overflow-x-auto whitespace-nowrap`, no wrap). Sort icon button sits in a right-anchored container outside the scroll area.

---

## 4. Target List

### Column header

Single row above the list, `mt-4`:

- `NAME` left, `FOLLOW-BACKS` right.
- `text-[11px] uppercase tracking-wide text-text-muted`.
- Horizontal padding matches row padding (`px-3` inside card, or `px-4 lg:px-6` if header is outside a card container — follow whichever shell the list uses; see "Container" below).

### Container

List sits in a `rounded-xl border border-border bg-surface` block. Column header lives inside the block at `px-4 pt-4 pb-2`. Rows divide with `border-t border-border`.

### Row anatomy

Per row: `flex items-center gap-3 px-4 py-3 min-h-[56px]`.

Three zones, left to right:

1. **Identity (flex-1, min-w-0):**
   - Status dot: `h-2.5 w-2.5 rounded-full`. Color by status — `bg-green-base` active, `bg-blue-base` queued, `bg-text-muted` paused, `bg-yellow-base` depleted.
   - Dot wrapped in a `button` with hover/focus tooltip (reuse tooltip pattern from `TargetsOverview`). Tooltip strings:
     - active: `Working on it — currently being targeted for growth`
     - queued: `In queue — will start once an active slot frees up`
     - paused: `Targeting off — this source is temporarily not running`
     - depleted: `Depleted — no more users left to follow from this source`
   - Target value (`@handle` or `#tag`): `truncate text-sm font-medium text-text-primary` (depleted: `text-text-muted line-through`).
   - Status pill (all statuses): `rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide`.
     - Active → `bg-green-tint text-green-text`.
     - Queued → `bg-blue-tint text-blue-text`.
     - Paused → `bg-bg text-text-secondary` (neutral grey — paused isn't a colored state).
     - Depleted → `bg-yellow-tint text-yellow-text`.
   - Top-performer star (only on highest-follow-back active row): Lucide `Star` `h-3.5 w-3.5 shrink-0 fill-yellow-base text-yellow-base`, placed after the name and before the pill.
2. **Follow-back count (shrink-0):**
   - `text-sm font-semibold tabular-nums text-text-primary` (depleted: `text-text-muted`).
3. **Kebab (shrink-0, 44×44 tap target):**
   - Lucide `MoreVertical` `h-5 w-5`.
   - Click/tap opens action popover (Section 6).

### Row-level interaction

- **Tap anywhere on the row** (including empty space) opens the kebab action popover. Kebab icon is the visual affordance, but the full row is the hit target.
- Depleted rows get `bg-bg` wash to visually recede.
- `border-t border-border` between rows, no border on the first row.

### Sort + filter pipeline

1. Filter rows by selected status (`All` skips filter step).
2. Sort the filtered set by the current sort mode.
3. Render.

Both filter selection and sort mode live in component-local state (`useState`). No URL params in V1.

### Empty states

- **Zero total targets:** the list container shows a single centered block inside the card:
  - Headline: `No targets yet` · `text-lg font-semibold text-text-primary`.
  - Sub: `Add an account or hashtag to start growing.` · `mt-1 text-sm text-text-secondary`.
  - **No button here.** The sole `+ Add target` CTA in the slots card above is the entry point.
  - Padding: `py-16` inside the card.
- **Filter returns zero rows (has targets, current filter empty):** inline centered muted line in the card body:
  - `No {paused|depleted|queued} targets.` · `text-sm text-text-muted py-8`.

---

## 5. Add Target Sheet

One sheet, one flow — the single path for adding any target from anywhere in the app.

### Surface

- Mobile: bottom sheet, rounded top corners, fills from bottom. Max height `85vh`, scrollable internally.
- Desktop (`lg:`): centered modal, `max-w-md`, `rounded-xl bg-surface shadow-xl`.
- Overlay: `bg-black/40`.

### Anatomy (top to bottom)

1. **Header:** title `Add a target` + close button (44×44, Lucide `X`). `px-4 pt-4 pb-3` with `border-b border-border`.
2. **Type toggle (segmented):** `Account` | `Hashtag`.
   - Container: `rounded-full bg-bg p-1 flex`.
   - Active: `rounded-full bg-surface text-text-primary shadow-sm`.
   - Inactive: `text-text-secondary`.
   - Full width of sheet body, 44px height.
   - `mt-4`.
3. **Input field:**
   - Label above: `Username` (account mode) or `Hashtag` (hashtag mode). `text-sm font-medium text-text-primary`.
   - Input: prefix-adornment showing `@` or `#` (swaps on toggle). 48px height. `rounded-lg border border-border bg-surface px-3`.
   - Helper text below, swaps with type:
     - Account: `We'll find users who follow this account and target them.`
     - Hashtag: `We'll find users posting with this hashtag and target them.`
   - `text-xs text-text-secondary mt-1.5`.
4. **Live preview (account mode only):**
   - Card: `mt-3 rounded-lg border border-border bg-bg p-3 flex items-center gap-3`.
   - Left: avatar `h-10 w-10 rounded-full` (fallback `bg-surface text-text-muted` initials if no pic).
   - Right: handle `text-sm font-medium text-text-primary` · follower count `text-xs text-text-secondary`.
   - Resolves from a mock fixture `mockResolveAccount(username)` with a 200–400ms debounce. On no match, preview hides silently (no error).
5. **Suggestions (account mode only):**
   - `mt-4`.
   - Label: `Suggestions` · `text-xs uppercase tracking-wide text-text-muted`.
   - Row of chips: `rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary`. Flex-wrap.
   - Source: `mockSuggestedTargets` (4–6 entries in `src/mocks/targets.js` or a new `mocks/suggestedTargets.js`).
   - Tap fills input + triggers preview resolution.
6. **Footer buttons:** `mt-6 flex gap-4` (mobile stacks column-reverse, desktop row-end).
   - Primary: `Add target` · 48px, `bg-blue-base text-white`. Disabled until input valid. Full-width on mobile.
   - Secondary: `Cancel` · ghost, `text-text-secondary`.

### Edge cases

- **Invalid format:** helper text turns red-text, primary button stays disabled. No toast.
- **Already added (any non-depleted status):** helper replaces with `You already have this target.` (red-text). Primary button disabled.
- **Already added AND paused:** same message, plus a ghost link `Resume it` after the helper. Link dismisses sheet and resumes the row with a success toast.
- **Slot cap reached:** deferred (handled by at-cap state in the slots card — out of scope for V1).

### Action on submit

- Primary button triggers `addTarget({ type, value })` in a new `useTargetsStore` (Zustand). Optimistic update; the row appears at the top of the list sorted by the current sort mode.
- Sheet closes. Success toast: `Target added.`

---

## 6. Kebab Action Popover

Opened by row tap or kebab click. Status-dependent actions.

### Surface

- Mobile: bottom sheet, 56px-height rows.
- Desktop: popover anchored to the row, `rounded-lg bg-surface shadow-md border border-border`.

### Items

- **Active:** `Pause` · `Remove`.
- **Queued:** `Remove`.
- **Paused:** `Resume` · `Remove`.
- **Depleted:** `Remove`.

Item styling:

- Row: `flex items-center gap-3 px-4 py-3 text-sm`.
- Icon left (Lucide): `Pause` / `Play` / `Trash2`, `h-4 w-4 text-text-secondary`.
- Label `text-text-primary`. `Remove` is `text-red-text`.

### Behavior

- `Pause` / `Resume`: immediate state change via `useTargetsStore`. Success toast at bottom-right, 2.5s.
- `Remove`: opens confirmation modal.
  - Title: `Remove this target?`
  - Body: `@fitness.inspo will no longer be used for growth. You can add it again later.`
  - Primary: `Remove target` · `bg-red-base text-white` (action name, not "Confirm" — per CLAUDE.md).
  - Secondary: `Keep it`.
  - Mobile: bottom sheet. Desktop: centered modal.
- Tap outside / Escape dismisses the popover.

---

## 7. State & Data

### New store: `src/stores/useTargetsStore.js`

- Zustand store with shape:
  ```js
  {
    targets: Target[],            // seeded from mockTargets
    filter: 'all' | 'active' | 'queued' | 'paused' | 'depleted',
    sort: 'priority' | 'followBacks' | 'recent' | 'alpha',
    addTarget(input): void,
    pauseTarget(id): void,
    resumeTarget(id): void,
    removeTarget(id): void,
    setFilter(f): void,
    setSort(s): void,
  }
  ```
- Persistence: none in V1 (in-memory). Reloading the page resets to mock data.

### Mocks

- `src/mocks/targets.js` — existing, reused.
- `src/mocks/suggestedTargets.js` (new) — 4–6 `{ username, profilePic, followers }` entries for the sheet.
- `src/mocks/resolveAccount.js` (new) — `mockResolveAccount(username)` returns a preview object or `null` with a simulated 200–400ms delay.

### Selectors / derived values

- `filteredTargets` — apply filter then sort. `useMemo` on targets + filter + sort.
- `slotCount` — `targets.length`.
- `maxSlots` — derived from `mockUser.plan`.

---

## 8. Component Breakdown

All new files under `src/pages/targets/`. Shared UI already lives in `src/components/`.

- `src/pages/targets/index.jsx` — page shell, wires store + children.
- `src/pages/targets/SlotsCard.jsx` — slots card (count, progress bar, trust line, Add button).
- `src/pages/targets/FilterRow.jsx` — segmented filter + sort dropdown.
- `src/pages/targets/TargetList.jsx` — column header, list container, row mapping, empty states.
- `src/pages/targets/TargetRow.jsx` — single row (identity zone, follow-back count, kebab).
- `src/pages/targets/AddTargetSheet.jsx` — the sheet (portal + overlay + content).
- `src/pages/targets/KebabMenu.jsx` — popover / bottom sheet wrapper for row actions.
- `src/pages/targets/RemoveTargetModal.jsx` — confirmation modal for destructive action.
- `src/stores/useTargetsStore.js` — Zustand store.
- `src/mocks/suggestedTargets.js` — new mock.
- `src/mocks/resolveAccount.js` — new mock resolver.

Existing `TargetsOverview` on the Overview page stays untouched; future work could hoist its row markup into a shared primitive, but V1 allows duplication.

---

## 9. Responsive Notes

- **Mobile (default):** single column. Slots card stacks label/count, button full-width. Filter pills horizontal scroll. Row kebab opens as bottom sheet.
- **`md:` (tablet):** unchanged from mobile except padding.
- **`lg:` (desktop):** page centers under `max-w-5xl mx-auto`. Slots card Add button auto-width, right-aligned. Filter pills and sort fit on one row without scroll. Row kebab opens as anchored popover.

---

## 10. Out of Scope (V1)

Explicitly deferred:

- Auto-pause-after-downgrade banner.
- At-cap state (button swap / disable / progress bar color).
- Approaching-cap upsell nudge.
- Disconnected-account variant (disabled add, reconnect banner on this page).
- Warming-up state variant.
- Per-target performance detail view (drawer / inline expand).
- Per-row analytics (follow-back rate, sparkline, followed count).
- Bulk select / bulk actions.
- Target search.
- Undo toast for remove.
- Whitelist / blacklist shortcuts.
- CSV import.
- Niche-inferred suggestions (static mock suggestions only).
- URL-param-backed filter/sort state.
- Persisted store state (localStorage / backend).

---

## 11. Open Follow-Ups (For the Later Spec)

To be picked up when we tackle edge-case states as a single unit:

- Auto-pause banner content, dismiss persistence, upgrade CTA routing.
- At-cap state matrix (Growth vs Advanced × slot count).
- Disconnected state page-wide treatment.
- Whether downgrading from Advanced → Growth while over 10 targets should trigger a confirmation sheet before the silent auto-pause.
