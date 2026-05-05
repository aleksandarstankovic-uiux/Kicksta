# Targeting Popup Polish — Design Spec

**Date:** 2026-05-05
**Scope:** Targeting page (`/targeting`) — visual polish on `TargetRow`, `TargetDetailDrawer`, and `TargetsHeroCard`. No new routes, no new pages.

---

## Goals

1. Surface a real-time "currently being processed" signal on the row the engine is working through, without crowding the existing chrome.
2. Give `TargetDetailDrawer` enough operational substance ("what is this target actually doing?") that it earns the click.
3. Demote the drawer's destructive/state-toggling buttons so they no longer read as primary CTAs.
4. Fix the asymmetric `rounded-b-xl` corners on the hero card.

## Non-Goals

- No engine wiring for the "processing" signal — V1 is mock-only (`processingId` is a static field on the store).
- No `like` / `welcome_dm` interaction types in the drawer's recent-activity list. Only `follow` and `follow_back`. (YAGNI — the two underlying actions cover the signal users care about.)
- No keyboard shortcuts, no toast feedback changes, no copy changes outside the drawer's new section header.

---

## 1. Pulse halo on the "currently processing" target

### Data model

Add a `processingId: string | null` field to `useTargetsStore`. Initial value: the `id` of the first target whose `status === 'active'` at store init time. If no targets are active, `null`.

```js
// src/stores/useTargetsStore.js
processingId: mockTargets.find((t) => t.status === 'active')?.id ?? null,
```

This is a mock placeholder. When the real engine lands, `processingId` becomes server-driven. No setter is exposed for V1 — nothing in the UI flips it.

### Visual on `TargetRow`

A row is "processing" when `target.id === processingId` **and** `target.status === 'active'` (defensive — only active targets can be the engine's current focus).

**Desktop (md:+ pill visible):**
- Pill keeps existing `bg-green-tint text-green-text` colors and "Active" label.
- Add `ring-2 ring-green-base/50 ring-offset-1 ring-offset-surface animate-pulse` to the pill when processing.
- `ring-offset-surface` gives the ring breathing room against the row background. The slight mismatch on hover (row bg shifts to `--color-bg`) is imperceptible on a 1px offset around a pulsating element — accept it.

**Mobile (pill hidden, dot visible):**
- Wrap the existing 8px dot in a relative container.
- Add an absolutely-positioned sibling: `absolute inset-0 rounded-full bg-green-base opacity-60 animate-ping`. Matches the live-pulse pattern used by the Overview Activity feed's "Live" badge.

### Component contract

`TargetRow` reads `processingId` via `useTargetsStore((s) => s.processingId)` directly — no new prop. Computed inside the row:

```js
const isProcessing = target.status === 'active' && target.id === processingId
```

Class strings are interpolated in the existing JSX. No new sub-components.

---

## 2. Recent activity section in `TargetDetailDrawer`

### Mock data

New file: `src/mocks/targetInteractions.js`.

```js
// Keyed by target id. Each value is the most recent interactions for
// that target, newest first. The drawer slices to 5.
//
// type: 'follow' — engine followed @username via this target
// type: 'follow_back' — @username followed the user back
//
// Time stamps anchored to NOW so the drawer always reads "fresh"
// across demo runs (mirrors the pattern in src/mocks/activity.js).
export const mockTargetInteractions = {
  t_001: [
    { id: 'i_001_1', type: 'follow_back', username: '@yoga.ashley', createdAt: hoursAgo(1) },
    { id: 'i_001_2', type: 'follow', username: '@plantbased.priya', createdAt: hoursAgo(2.5) },
    // ... 3 more
  ],
  t_002: [ /* hashtag target — fewer follow-backs, more follows */ ],
  // entries for every target id in mockTargets
}
```

Every id in `mockTargets` gets 3–5 entries. Empty arrays are valid (drawer renders empty state).

### UI

Section sits **between** the stat chips and the action buttons, full-width inside the drawer's `px-5` rail.

```
┌─────────────────────────────────────────┐
│ [stat chips ........................ ]  │
│                                         │
│ RECENT ACTIVITY                         │   ← uppercase, tracking-wide, text-[11px], text-text-muted
│ ┌─────────────────────────────────────┐ │
│ │ ↺  @yoga.ashley         · 1h ago    │ │   ← UserPlus icon, green-text
│ │ ◎  @plantbased.priya    · 2h ago    │ │   ← Target icon, blue-text
│ │ ↺  @marcus.lifts        · 5h ago    │ │
│ │ ◎  @brand.partner       · 6h ago    │ │
│ │ ↺  @cleanfoodcrush      · 8h ago    │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ [Pause]              [Remove]           │
└─────────────────────────────────────────┘
```

**Per-row markup:**
- `flex items-center gap-2 py-2 text-sm` — single line, no wrap.
- Icon: `h-4 w-4 shrink-0`. `Target` for `follow` (blue-text), `UserPlus` for `follow_back` (green-text).
- `@username` — `font-medium text-text-primary`, `truncate`.
- Relative time — `text-xs text-text-muted` pinned right (`ml-auto shrink-0`).

**Empty state** (target has no interactions):
- Single muted line: `<p className="py-3 text-center text-xs text-text-muted">No activity yet</p>`.

### `formatRelativeTime` extraction

Already defined inline in `src/pages/overview/index.jsx` (line ~1117). Move to `src/utils/formatRelativeTime.js` and import from both surfaces. Pure function — zero behavioral change.

```js
// src/utils/formatRelativeTime.js
// Compact "2h ago" / "1d ago" formatter. Used by the Overview Activity
// feed and the Targeting drawer's recent-activity list.
export function formatRelativeTime(iso) {
  const diffMin = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay}d ago`
}
```

The existing inline version in Overview gets deleted and replaced with `import { formatRelativeTime } from '@/utils/formatRelativeTime'`.

---

## 3. Demoted drawer action buttons

| Button | State | Old class | New class |
|---|---|---|---|
| Pause / Resume | Active or Paused | `bg-blue-tint text-blue-text hover:opacity-90` | `border border-blue-base/30 text-blue-text hover:bg-blue-tint/40` |
| Remove | Any non-archived | `bg-red-tint text-red-text hover:opacity-90` | `text-red-text hover:bg-red-tint/40` (no border, no fill) |
| Restore | Archived | `bg-blue-base text-white hover:opacity-90` | `border border-blue-base/30 text-blue-text hover:bg-blue-tint/40` |

All three keep:
- `h-12` (48px) — meets the ≥44px touch-target rule.
- Existing icons (`Pause` / `Play` / `Trash2` / `RotateCcw`) at `h-4 w-4`.
- `inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium`.
- Existing layout (`flex-1` for paired Pause+Remove, `w-full` for solo Remove or Restore).

---

## 4. `TargetsHeroCard` corner cleanup

`src/pages/targeting/TargetsHeroCard.jsx` line 13:

```diff
- <section className="overflow-hidden rounded-b-xl border border-border bg-surface">
+ <section className="overflow-hidden rounded-xl border border-border bg-surface">
```

One line. No layout impact.

---

## Files Touched

| File | Change |
|---|---|
| `src/stores/useTargetsStore.js` | Add `processingId` field |
| `src/pages/targeting/TargetRow.jsx` | Read `processingId`, add ring on pill, ping halo on dot |
| `src/pages/targeting/TargetDetailDrawer.jsx` | New "Recent activity" section; demote three buttons |
| `src/pages/targeting/TargetsHeroCard.jsx` | `rounded-b-xl` → `rounded-xl` |
| `src/mocks/targetInteractions.js` | **NEW** — mock interactions keyed by target id |
| `src/utils/formatRelativeTime.js` | **NEW** — extracted from Overview |
| `src/pages/overview/index.jsx` | Replace inline `formatRelativeTime` with import |

---

## Risks / Edge Cases

- **`processingId` references a removed target.** If the user removes the active target while the drawer is closed, `processingId` would still point at it. The defensive check `target.status === 'active' && target.id === processingId` means the halo won't render on stale ids, but the store still holds the dead id. Acceptable for V1 since nothing reads `processingId` other than `TargetRow`. Real engine wiring will own the reset.
- **Interactions for unknown target id.** `mockTargetInteractions[target.id]` may be `undefined`. Drawer falls through to empty state — no crash.
- **`animate-pulse` and `ring-offset-*` interaction.** `animate-pulse` toggles the entire element's opacity, not just the ring. Acceptable here since the pill text fading rhythmically reads as "live, working" — confirmed during brainstorm. If it's distracting in implementation, swap to a custom `@keyframes` that animates `box-shadow` only.

## Out of Scope (parked for follow-up)

- Rotating `processingId` on a setInterval to simulate the engine moving between targets.
- `like` / `welcome_dm` interaction types in the drawer.
- Animated transitions on the demoted buttons (e.g., border fading in on hover).
- Keyboard navigation through the recent-activity list.

---

## Acceptance criteria

- [ ] On `/targeting` (Targets tab), exactly one row shows the pulsing pill (the active target with `id === processingId`). Others render the standard pill.
- [ ] On mobile, that same row shows a pinging halo around its status dot.
- [ ] Tapping any row opens the drawer with: avatar header, HealthPill, three stat chips, "RECENT ACTIVITY" label + up to 5 rows, action buttons.
- [ ] Drawer buttons render with the new ghost/text-only styles. Tap targets remain ≥44px.
- [ ] `TargetsHeroCard` renders with all four corners rounded.
- [ ] Overview Activity feed continues to render correctly (`formatRelativeTime` import works).
