# Targeting Popup Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the Targeting page popup surface — pulsing "currently being processed" indicator on the active row, a recent-activity section inside `TargetDetailDrawer`, demoted drawer action buttons, and the `TargetsHeroCard` corner cleanup.

**Architecture:** Frontend-only V1. State for the "processing" signal is a static field on `useTargetsStore` (mock placeholder for the real engine). New mock data file `mocks/targetInteractions.js` keyed by target id feeds the drawer's recent-activity list. The inline `formatRelativeTime` helper in Overview is extracted to `src/utils/` and reused by the drawer.

**Tech Stack:** React 19, Vite 8, Tailwind 4, Zustand 5, Lucide React. No backend wiring. **No unit-test framework in this repo** — verification is manual (visual) and via `eslint`. Each task ends with the same lint check (`pnpm lint` if pnpm is available, otherwise `node node_modules/.bin/eslint <files>`).

---

### Reference spec

`docs/superpowers/specs/2026-05-05-targeting-popup-polish-design.md`

### File map

| File | Status | Responsibility |
|---|---|---|
| `src/utils/formatRelativeTime.js` | NEW | Pure helper — "Xm ago" / "Xh ago" / "Xd ago" |
| `src/mocks/targetInteractions.js` | NEW | Mock interactions keyed by target id |
| `src/stores/useTargetsStore.js` | MODIFY | Add `processingId` field |
| `src/pages/targeting/TargetRow.jsx` | MODIFY | Read `processingId`; pulse halo on pill + ping on dot |
| `src/pages/targeting/TargetDetailDrawer.jsx` | MODIFY | New "Recent activity" section + demoted action buttons |
| `src/pages/targeting/TargetsHeroCard.jsx` | MODIFY | `rounded-b-xl` → `rounded-xl` |
| `src/pages/overview/index.jsx` | MODIFY | Replace inline `formatRelativeTime` with import |

### Verification commands

The project lints with the local eslint binary. Before marking any task complete, an engineer should run:

```bash
node node_modules/.bin/eslint src --ext .js,.jsx
```

Expected: `0` problems (or pre-existing baseline only — do not introduce new warnings).

If running locally (Vite dev server), open `http://localhost:5173/targeting` to manually verify each change.

---

## Task 1: Extract `formatRelativeTime` to a utility module

**Why first:** Task 5 (drawer recent-activity rows) imports this helper. Extracting it before adding the second consumer keeps the diff clean and avoids duplicating the formatter.

**Files:**
- Create: `src/utils/formatRelativeTime.js`
- Modify: `src/pages/overview/index.jsx` (lines around 1116-1125)

- [ ] **Step 1: Create the utility module**

Create `src/utils/formatRelativeTime.js` with the exact same body as the inline version in `src/pages/overview/index.jsx` (preserves behavior — minimum return is `"1m ago"`):

```js
// Compact relative-time formatter ("2h ago", "1d ago"). Used by the
// Overview Activity feed and the Targeting drawer's recent-activity
// list. Minimum bucket is `1m ago` — anything more recent rounds up
// so the UI never shows `0m ago`.
export function formatRelativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.max(1, Math.round(diffMs / 60000))
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay}d ago`
}
```

- [ ] **Step 2: Replace the inline definition in Overview**

In `src/pages/overview/index.jsx`:

1. Add this line near the existing `@/` imports at the top of the file (alphabetical order with other `@/utils/*` imports):

```js
import { formatRelativeTime } from '@/utils/formatRelativeTime'
```

2. Delete lines 1116-1125 (the entire `// Compact relative-time formatter…` comment block plus the inline `function formatRelativeTime(iso) { … }` definition). The comment lives in the new module now.

- [ ] **Step 3: Lint**

Run:
```bash
node node_modules/.bin/eslint src/pages/overview/index.jsx src/utils/formatRelativeTime.js
```
Expected: `0` errors. Pre-existing warnings (if any) unchanged.

- [ ] **Step 4: Manual smoke**

Start the dev server (`node node_modules/.bin/vite`) and open `/`. The Activity feed should still render relative times exactly as before (e.g. "1h ago", "3h ago"). No console errors.

- [ ] **Step 5: Commit**

```bash
git add src/utils/formatRelativeTime.js src/pages/overview/index.jsx
git commit -m "refactor: extract formatRelativeTime to src/utils"
```

---

## Task 2: Create the `mockTargetInteractions` mock

**Why second:** Pure data dependency for Task 5. Standalone — no other file changes.

**Files:**
- Create: `src/mocks/targetInteractions.js`

- [ ] **Step 1: Create the mock file**

Create `src/mocks/targetInteractions.js` with one entry per id present in `src/mocks/targets.js` (`t_001` through `t_012`). Each entry is an array of 3–5 objects sorted newest-first.

```js
// Recent interactions per target, surfaced in TargetDetailDrawer's
// "Recent activity" list (drawer slices to 5).
//
// type:
//   'follow'       — engine followed @username via this target
//   'follow_back'  — @username followed the user back
//
// Timestamps anchor to NOW so the demo always reads "fresh" across
// runs. Same pattern as src/mocks/activity.js.
const NOW = new Date()
const hoursAgo = (h) => new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString()

export const mockTargetInteractions = {
  t_001: [
    { id: 'i_001_1', type: 'follow_back', username: '@yoga.ashley', createdAt: hoursAgo(1) },
    { id: 'i_001_2', type: 'follow', username: '@plantbased.priya', createdAt: hoursAgo(2.5) },
    { id: 'i_001_3', type: 'follow_back', username: '@marcus.lifts', createdAt: hoursAgo(5) },
    { id: 'i_001_4', type: 'follow', username: '@brand.partner', createdAt: hoursAgo(6) },
    { id: 'i_001_5', type: 'follow_back', username: '@cleanfoodcrush', createdAt: hoursAgo(8) },
  ],
  t_002: [
    { id: 'i_002_1', type: 'follow', username: '@homeworkout.daily', createdAt: hoursAgo(2) },
    { id: 'i_002_2', type: 'follow_back', username: '@kettlebell.kev', createdAt: hoursAgo(4) },
    { id: 'i_002_3', type: 'follow', username: '@fit.maria', createdAt: hoursAgo(7) },
    { id: 'i_002_4', type: 'follow', username: '@gym.notes', createdAt: hoursAgo(10) },
  ],
  t_003: [
    { id: 'i_003_1', type: 'follow_back', username: '@yoga.studio.east', createdAt: hoursAgo(20) },
    { id: 'i_003_2', type: 'follow_back', username: '@vinyasa.lab', createdAt: hoursAgo(28) },
    { id: 'i_003_3', type: 'follow', username: '@morningflow', createdAt: hoursAgo(34) },
  ],
  t_004: [
    { id: 'i_004_1', type: 'follow', username: '@cleanfoodcrush', createdAt: hoursAgo(48) },
    { id: 'i_004_2', type: 'follow_back', username: '@whole.kitchen', createdAt: hoursAgo(60) },
    { id: 'i_004_3', type: 'follow', username: '@meal.minimal', createdAt: hoursAgo(72) },
  ],
  t_005: [
    { id: 'i_005_1', type: 'follow_back', username: '@runners.club', createdAt: hoursAgo(0.5) },
    { id: 'i_005_2', type: 'follow', username: '@trail.tales', createdAt: hoursAgo(2) },
    { id: 'i_005_3', type: 'follow', username: '@5k.everyday', createdAt: hoursAgo(3) },
    { id: 'i_005_4', type: 'follow_back', username: '@long.miles', createdAt: hoursAgo(6) },
  ],
  t_006: [
    { id: 'i_006_1', type: 'follow', username: '@startup.daily', createdAt: hoursAgo(1) },
    { id: 'i_006_2', type: 'follow', username: '@indie.maker', createdAt: hoursAgo(3) },
    { id: 'i_006_3', type: 'follow_back', username: '@built.in.public', createdAt: hoursAgo(5) },
  ],
  t_007: [
    { id: 'i_007_1', type: 'follow_back', username: '@cafe.minimal', createdAt: hoursAgo(2) },
    { id: 'i_007_2', type: 'follow', username: '@espresso.daily', createdAt: hoursAgo(4) },
    { id: 'i_007_3', type: 'follow_back', username: '@brew.book', createdAt: hoursAgo(7) },
    { id: 'i_007_4', type: 'follow', username: '@latte.lab', createdAt: hoursAgo(9) },
  ],
  t_008: [
    { id: 'i_008_1', type: 'follow', username: '@designer.notes', createdAt: hoursAgo(0.75) },
    { id: 'i_008_2', type: 'follow_back', username: '@ux.weekly', createdAt: hoursAgo(2.5) },
    { id: 'i_008_3', type: 'follow', username: '@type.daily', createdAt: hoursAgo(4) },
    { id: 'i_008_4', type: 'follow_back', username: '@figma.fans', createdAt: hoursAgo(6) },
    { id: 'i_008_5', type: 'follow', username: '@grid.gallery', createdAt: hoursAgo(8) },
  ],
  t_009: [
    { id: 'i_009_1', type: 'follow', username: '@photo.essay', createdAt: hoursAgo(3) },
    { id: 'i_009_2', type: 'follow_back', username: '@street.frames', createdAt: hoursAgo(5) },
    { id: 'i_009_3', type: 'follow', username: '@analog.only', createdAt: hoursAgo(8) },
  ],
  t_010: [
    { id: 'i_010_1', type: 'follow', username: '@hiking.atlas', createdAt: hoursAgo(72) },
    { id: 'i_010_2', type: 'follow_back', username: '@trail.notes', createdAt: hoursAgo(96) },
  ],
  // Archived targets keep their history so the drawer renders something
  // when the user drills in from the Archived bucket.
  t_011: [
    { id: 'i_011_1', type: 'follow_back', username: '@old.partner', createdAt: hoursAgo(240) },
    { id: 'i_011_2', type: 'follow', username: '@old.peer', createdAt: hoursAgo(264) },
  ],
  t_012: [
    { id: 'i_012_1', type: 'follow', username: '@old.brand', createdAt: hoursAgo(312) },
  ],
}
```

- [ ] **Step 2: Lint**

```bash
node node_modules/.bin/eslint src/mocks/targetInteractions.js
```
Expected: `0` errors.

- [ ] **Step 3: Commit**

```bash
git add src/mocks/targetInteractions.js
git commit -m "feat(mocks): add per-target interactions for drawer recent-activity"
```

---

## Task 3: Add `processingId` to `useTargetsStore`

**Files:**
- Modify: `src/stores/useTargetsStore.js`

- [ ] **Step 1: Add the field to the store**

In `src/stores/useTargetsStore.js`, modify the `create((set) => ({ … }))` initial state. Add `processingId` directly under the existing `targets:` line:

```js
export const useTargetsStore = create((set) => ({
  targets: mockTargets,
  // V1 mock: id of the target the engine is "currently working on".
  // Read by TargetRow to render a pulse halo on the active row's
  // status pill / mobile dot. Real engine wiring will replace this
  // initial pick with a server-driven value.
  processingId: mockTargets.find((t) => t.status === 'active')?.id ?? null,
  filter: 'active',
  sort: 'priority',
  // … rest unchanged
```

No setter exposed — V1 nothing flips it.

- [ ] **Step 2: Lint**

```bash
node node_modules/.bin/eslint src/stores/useTargetsStore.js
```
Expected: `0` errors.

- [ ] **Step 3: Smoke check in console**

In the browser dev console with `/targeting` open:

```js
window.__zustandStoreCheck = useTargetsStore  // not actually needed
```

Easier: open React DevTools, find `TargetsTab`, inspect the store via the hook subscription. Or in JS console: run `useTargetsStore.getState().processingId` after exposing the store. **Skip this step if it's awkward — Task 4 is the user-facing verification of this field.**

- [ ] **Step 4: Commit**

```bash
git add src/stores/useTargetsStore.js
git commit -m "feat(targets): add processingId field for live-row signal"
```

---

## Task 4: Pulse halo on the processing row in `TargetRow`

**Files:**
- Modify: `src/pages/targeting/TargetRow.jsx`

- [ ] **Step 1: Add the store import + read `processingId`**

At the top of `src/pages/targeting/TargetRow.jsx`, add the store import. Place it under the existing `@/utils/formatCount` import:

```js
import { useTargetsStore } from '@/stores/useTargetsStore'
```

Inside the component body (after `const depleted = target.status === 'depleted'` near line 36), add:

```js
const processingId = useTargetsStore((s) => s.processingId)
const isProcessing = target.status === 'active' && target.id === processingId
```

- [ ] **Step 2: Wrap the mobile status dot in a pulse halo**

Replace the existing mobile-only dot block (lines 88-91 in the current file) with:

```jsx
{/* Mobile-only status dot. When this row is the engine's current
    focus, an animate-ping halo radiates from it to mirror the
    desktop pill ring. */}
<span
  aria-label={statusLabel[target.status]}
  className={`relative inline-flex h-2 w-2 shrink-0 items-center justify-center md:hidden`}
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
```

- [ ] **Step 3: Add the ring on the desktop pill**

Find the existing `<span>` that renders the desktop pill (currently lines 109-115). Replace its className expression so it conditionally adds the ring:

```jsx
<span
  className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide md:inline ${
    statusPillClass[target.status]
  } ${
    isProcessing
      ? 'ring-2 ring-green-base/50 ring-offset-1 ring-offset-surface animate-pulse'
      : ''
  }`}
>
  {statusLabel[target.status]}
</span>
```

- [ ] **Step 4: Lint**

```bash
node node_modules/.bin/eslint src/pages/targeting/TargetRow.jsx
```
Expected: `0` errors.

- [ ] **Step 5: Manual verification**

Start the dev server, navigate to `/targeting` (Targets tab default).
- The first `Active` target in the list should have a pulsing ring around its "ACTIVE" pill (desktop) or a pinging halo around its dot (mobile, viewport <768px).
- Other active targets should render the standard pill / dot — no pulse.
- Resize between mobile and desktop — only the relevant indicator is visible per breakpoint.
- Hover the processing row — the ring stays visible.

- [ ] **Step 6: Commit**

```bash
git add src/pages/targeting/TargetRow.jsx
git commit -m "feat(targeting): pulse halo on the currently-processing row"
```

---

## Task 5: Recent activity section in `TargetDetailDrawer`

**Files:**
- Modify: `src/pages/targeting/TargetDetailDrawer.jsx`

- [ ] **Step 1: Add imports**

At the top of `src/pages/targeting/TargetDetailDrawer.jsx`, add:

1. To the lucide import line — add `Target as TargetIcon, UserPlus`:

```js
import { Hash, Pause, Play, RotateCcw, Target as TargetIcon, Trash2, UserPlus, X } from 'lucide-react'
```

(`Target` is already used as the prop name; we alias the icon to `TargetIcon` to avoid the shadow.)

2. New imports below the existing `formatCount` import:

```js
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { mockTargetInteractions } from '@/mocks/targetInteractions'
```

- [ ] **Step 2: Read interactions inside the component**

Inside `TargetDetailDrawer`, after the `rate` calculation block (currently lines 56-59), add:

```js
const interactions = (mockTargetInteractions[target.id] ?? []).slice(0, 5)
```

- [ ] **Step 3: Render the section between stat chips and action buttons**

Insert the following block immediately AFTER the stat chips `<div className="mt-4 flex gap-2 overflow-x-auto px-5">…</div>` and BEFORE the action buttons `<div className="mt-5 flex gap-3 px-5">`:

```jsx
{/* Recent activity — the last few interactions the engine has
    logged for this target. Same icon vocabulary as the Overview
    Activity feed (UserPlus = follow-back, TargetIcon = follow). */}
<div className="mt-5 px-5">
  <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
    Recent activity
  </p>
  {interactions.length === 0 ? (
    <p className="py-3 text-center text-xs text-text-muted">No activity yet</p>
  ) : (
    <ul className="mt-2 flex flex-col">
      {interactions.map((event) => (
        <li
          key={event.id}
          className="flex items-center gap-2 py-2 text-sm"
        >
          {event.type === 'follow_back' ? (
            <UserPlus className="h-4 w-4 shrink-0 text-green-text" aria-hidden="true" />
          ) : (
            <TargetIcon className="h-4 w-4 shrink-0 text-blue-text" aria-hidden="true" />
          )}
          <span className="min-w-0 truncate font-medium text-text-primary">
            {event.username}
          </span>
          <span className="ml-auto shrink-0 text-xs text-text-muted">
            {formatRelativeTime(event.createdAt)}
          </span>
        </li>
      ))}
    </ul>
  )}
</div>
```

- [ ] **Step 4: Lint**

```bash
node node_modules/.bin/eslint src/pages/targeting/TargetDetailDrawer.jsx
```
Expected: `0` errors.

- [ ] **Step 5: Manual verification**

In the browser, open `/targeting` and click any non-archived target row. The drawer should now render, in this order:
1. Avatar header (existing)
2. HealthPill (existing)
3. Stat chips: Followed · Follow-backs · Rate (existing)
4. **NEW** RECENT ACTIVITY label + up to 5 rows
5. Action buttons (existing styling — still tinted at this stage)

Click `t_010` (only 2 interactions) — the list shows 2 rows, no overflow.
Click an Archived target via the Archived bucket filter — still shows interactions.
If a target has no entry in the mock, the drawer shows "No activity yet" (none of the seeded ids hit this; the empty branch is defensive).

- [ ] **Step 6: Commit**

```bash
git add src/pages/targeting/TargetDetailDrawer.jsx
git commit -m "feat(targeting): recent-activity section in TargetDetailDrawer"
```

---

## Task 6: Demote the drawer action buttons

**Files:**
- Modify: `src/pages/targeting/TargetDetailDrawer.jsx`

- [ ] **Step 1: Replace the Restore button class**

In `TargetDetailDrawer.jsx`, find the `isArchived` branch's button (currently has `bg-blue-base text-white`). Replace its className with the ghost-bordered variant:

```jsx
<button
  type="button"
  onClick={handleRestore}
  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-blue-base/30 text-sm font-medium text-blue-text hover:bg-blue-tint/40"
>
  <RotateCcw className="h-4 w-4" aria-hidden="true" />
  Restore target
</button>
```

- [ ] **Step 2: Replace the Pause/Resume button class**

In the `canPauseOrResume` branch, find the Pause/Resume button (currently `bg-blue-tint text-blue-text`). Replace its className:

```jsx
<button
  type="button"
  onClick={handlePauseResume}
  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-base/30 text-sm font-medium text-blue-text hover:bg-blue-tint/40"
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
```

- [ ] **Step 3: Replace the paired Remove button class**

In the same `canPauseOrResume` branch, find the Remove button (currently `bg-red-tint text-red-text`). Replace its className with the text-only variant — no border, no fill:

```jsx
<button
  type="button"
  onClick={handleRemove}
  className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium text-red-text hover:bg-red-tint/40"
>
  <Trash2 className="h-4 w-4" aria-hidden="true" />
  Remove
</button>
```

- [ ] **Step 4: Replace the standalone Remove button class**

In the final `else` branch (the one that renders when status is `depleted` or `queued`), find the same Remove button class string and replace it the same way:

```jsx
<button
  type="button"
  onClick={handleRemove}
  className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-red-text hover:bg-red-tint/40"
>
  <Trash2 className="h-4 w-4" aria-hidden="true" />
  Remove
</button>
```

- [ ] **Step 5: Lint**

```bash
node node_modules/.bin/eslint src/pages/targeting/TargetDetailDrawer.jsx
```
Expected: `0` errors.

- [ ] **Step 6: Manual verification**

For each target status, open the drawer and confirm:
- **Active target**: Pause + Remove side by side. Pause has a thin blue border and blue text, no fill. Remove has only red text, no border, no fill. Hovering each surfaces the tinted bg.
- **Paused target**: same layout, button reads "Resume".
- **Depleted / Queued**: solo full-width Remove (text-only red).
- **Archived target**: solo full-width "Restore target" with a thin blue border + blue text.
- All buttons remain ≥48px tall (`h-12`).

- [ ] **Step 7: Commit**

```bash
git add src/pages/targeting/TargetDetailDrawer.jsx
git commit -m "refactor(targeting): demote drawer action buttons"
```

---

## Task 7: `TargetsHeroCard` corner cleanup

**Files:**
- Modify: `src/pages/targeting/TargetsHeroCard.jsx:13`

- [ ] **Step 1: Replace `rounded-b-xl` with `rounded-xl`**

In `src/pages/targeting/TargetsHeroCard.jsx`, line 13:

```diff
- <section className="overflow-hidden rounded-b-xl border border-border bg-surface">
+ <section className="overflow-hidden rounded-xl border border-border bg-surface">
```

- [ ] **Step 2: Lint**

```bash
node node_modules/.bin/eslint src/pages/targeting/TargetsHeroCard.jsx
```
Expected: `0` errors.

- [ ] **Step 3: Manual verification**

Open `/targeting` and confirm the hero card now has rounded corners on all four sides (previously the top corners were sharp).

- [ ] **Step 4: Commit**

```bash
git add src/pages/targeting/TargetsHeroCard.jsx
git commit -m "fix(targeting): TargetsHeroCard rounded-xl on all corners"
```

---

## Task 8: Final verification + changelog

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Repo-wide lint**

```bash
node node_modules/.bin/eslint src --ext .js,.jsx
```
Expected: `0` errors. Pre-existing warnings unchanged.

- [ ] **Step 2: Full-flow manual verification**

Open the dev server and walk through every acceptance criterion from the spec:

- [ ] On `/targeting`, exactly one row pulses (the active target whose id matches `processingId`).
- [ ] On mobile (viewport <768px), that row's status dot has an `animate-ping` halo.
- [ ] Tapping any row opens the drawer with: avatar header → HealthPill → stat chips → "RECENT ACTIVITY" + up to 5 rows → action buttons.
- [ ] Drawer buttons render with ghost/text-only styles. All ≥44px tall.
- [ ] `TargetsHeroCard` corners are uniformly rounded.
- [ ] Overview Activity feed (`/`) renders relative times unchanged.

- [ ] **Step 3: Update `CHANGELOG.md`**

Insert a new dated section immediately under the `## 2026-05-04 — Overview small fixes` block (newest entries on top):

```markdown
## 2026-05-05 — Targeting popup polish

### Changed
- **`TargetRow`**: the active target whose id matches `useTargetsStore.processingId` now renders a pulsing ring around its desktop status pill and an `animate-ping` halo around its mobile status dot. Surfaces the engine's current focus without crowding existing chrome.
- **`TargetDetailDrawer`**: new "RECENT ACTIVITY" section between stat chips and action buttons. Up to 5 rows per target, icon-encoded (UserPlus = follow-back, Target = follow), pulled from the new `mocks/targetInteractions.js`.
- **`TargetDetailDrawer` action buttons**: demoted to a graduated hierarchy. Pause / Resume / Restore → ghost-bordered. Remove → text-only. All keep the 48px tap target.
- **`TargetsHeroCard`**: `rounded-b-xl` → `rounded-xl` so all four corners match.

### Created
- `src/utils/formatRelativeTime.js` — extracted from `src/pages/overview/index.jsx`, reused by Overview and Targeting.
- `src/mocks/targetInteractions.js` — per-target interaction history feeding the drawer's recent-activity list.

### Store
- `useTargetsStore.processingId` — V1 mock field. Initial value: id of the first `active` target. No setter (real engine wiring will replace).
```

- [ ] **Step 4: Commit changelog**

```bash
git add CHANGELOG.md
git commit -m "docs: log targeting popup polish"
```

---

## Self-review summary

**Spec coverage:**
- Section 1 (pulse halo) → Tasks 3 + 4. ✓
- Section 2 (recent activity) → Tasks 1 + 2 + 5. ✓
- Section 3 (demoted buttons) → Task 6. ✓
- Section 4 (hero corner) → Task 7. ✓
- Acceptance criteria → walked in Task 8. ✓

**Type / name consistency:**
- `processingId` field name matches across Tasks 3, 4, and the spec.
- `mockTargetInteractions` exported name matches between Tasks 2 and 5.
- `formatRelativeTime` named export consistent across Tasks 1 and 5.
- Lucide `Target` icon aliased to `TargetIcon` only inside `TargetDetailDrawer.jsx` (Task 5) — `TargetRow.jsx` does not use the icon, so no aliasing needed there.
