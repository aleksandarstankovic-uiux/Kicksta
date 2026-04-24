# Overview AccountCard Redesign — Design Spec

**Date:** 2026-04-24
**Scope:** Redesign the AccountCard on `/` (Overview) to move live automation status directly under the `@handle` and replace the StatusPill on the right with a dedicated **Pause growth / Resume growth** CTA. Remove the full name row and kill the StatusPill popover.

---

## Goals

1. Tightly couple "who" (the `@handle`) with "what the system is doing right now" (the live status). Current UI separates them — handle on the left, status pill on the right.
2. Make the Pause/Resume action visible and obvious, not hidden behind a popover tap.
3. Make the live status feel genuinely active — constant ambient motion without being busy or distracting.
4. Reinforce cross-page consistency with the Targeting page's `LiveActivityCard` by sharing the same phase copy, icons, and animation patterns.

---

## Non-goals

- No changes to the AccountSwitcher (sidebar) or the metric row below the AccountCard.
- No changes to `useSystemStatus` or how the phase state machine runs.
- No changes to Targeting page's `LiveActivityCard`.
- No edge-case work for warming_up / setup beyond hiding the CTA + inline copy (deferred, as before).

---

## 1. Layout

### Desktop (`lg:+`)

```
┌──────────────────────────────────────────────────────────────────┐
│ [avatar] @alexjohnson.co  [Advanced] [Trial]      [Pause growth] │
│          🟢 Currently following @fitfluencer                     │
└──────────────────────────────────────────────────────────────────┘
```

- Avatar on the left (unchanged).
- Identity line: `@handle` + plan pills (Advanced / Trial) — unchanged from today.
- **Status line below the handle**, indented to align with the `@handle` text (not with the avatar). Visually attaches the status to the handle, not the card.
- **Pause / Resume CTA** on the right of the identity row, vertically centered.
- **Full name line is removed** (was `Alex Johnson — Fitness & Nutrition Coach`).

### Mobile

```
┌──────────────────────────────────────────────────────────────┐
│ [avatar] @alexjohnson.co  [Advanced] [Trial]                 │
│          🟢 Currently following @fitfluencer                 │
│                                                              │
│ [ Pause growth ]            (full-width)                     │
└──────────────────────────────────────────────────────────────┘
```

- Identity + status stacked as on desktop.
- Pause / Resume becomes a full-width button below the identity block.

---

## 2. Status Line

### Content

Derived from the shared `useSystemStatus` hook. Phase → text map (identical to Targeting's `LiveActivityCard`):

| Phase        | Copy                                             |
|--------------|--------------------------------------------------|
| `analyzing`  | `Currently searching for targets`                |
| `following`  | `Currently following {handle}`                   |
| `unfollowing`| `Currently unfollowing {handle}`                 |
| `waiting`    | `Pausing between actions`                        |
| `warming_up` | `Warming up — growth starts within 72 hours`    |
| `setup`      | `Setup needed — add your first target to start` |
| `paused`     | `Paused`                                         |

### Icon

Same phase-icon map as Targeting:

| Phase        | Icon          |
|--------------|---------------|
| `analyzing`  | `Search`      |
| `following`  | `UserPlus`    |
| `unfollowing`| `UserMinus`   |
| `waiting`    | pulsing dot fallback (no icon) |
| `warming_up` | `Flame`       |
| `setup`      | `Settings`    |
| `paused`     | `Pause`       |

Icon color tone map: `green-base` for active phases (analyzing/following/unfollowing/waiting), `blue-base` for warming, `text-muted` for setup/paused.

### Handle link

If the phase copy contains a `@handle` or `#tag`, the handle text within the copy is a **link to `/targets`** (no drawer on Overview since the drawer lives on Targeting). Hover/focus: `underline`.

### Typography + spacing

- Status container: `mt-1 flex items-center gap-2` (under the identity row).
- Text: `text-sm text-text-secondary`.
- Icon: `h-4 w-4`.

### Animations

**1. Phase-change transition (existing, reused):**
- On phase/target change, the status content is wrapped in a key-bound div keyed on `${phase}|${targetHandle || ''}`.
- Animates in with `animate-in fade-in slide-in-from-bottom-1 duration-300`.

**2. Ambient icon pulse (new):**
- The phase icon (not the dot fallback) uses Tailwind's built-in `animate-pulse` (default: `opacity: 0.5 → 1 → 0.5` over `2s`). Gives ambient motion between phase changes so the status always feels alive.
- Applied via `className="animate-pulse"` directly on the icon element.
- Suppressed when phase ∈ `{paused, setup}` (no ambient motion when nothing is happening).

**3. Shimmer sweep on text (new):**
- A low-contrast light-to-lighter gradient sweeps horizontally across the status text every `~5s`.
- Implementation: a `<span>` with the text inside a background-clip gradient + CSS keyframe that animates `background-position`.
- Define a minimal custom keyframe in `src/styles/` (or inline via Tailwind's arbitrary animation utility if concise).
- Readability rule: the shimmer gradient's high-contrast point must not drop below the `text-text-secondary` default color — it only brightens briefly, never fades below the baseline.
- Suppressed when phase ∈ `{paused, setup, warming_up}`. Active only when the system is running.

### Combined rules

- **Running (`analyzing/following/unfollowing/waiting`):** icon pulse + text shimmer + key-based phase transition.
- **`warming_up`:** icon pulse only (system is actively doing warmup work); no shimmer.
- **`paused`:** no pulse, no shimmer, no transitions. Static.
- **`setup`:** no animation — user needs to take action, not watch a running system.

---

## 3. Pause / Resume CTA

### Running state

Classes:

```jsx
className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
```

- Icon: `Pause` (`h-4 w-4`).
- Label: `Pause growth`.
- Ghost / outline treatment — calm, doesn't demand attention.

### Paused state

Classes:

```jsx
className="inline-flex h-10 items-center gap-2 rounded-lg bg-green-base px-4 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
```

- Icon: `Play` (`h-4 w-4`).
- Label: `Resume growth`.
- Filled primary — signals "restore service."

### Behavior

- **Click:** direct toggle. Calls `onPauseToggle?.()` (existing prop passed into `StatusPill`'s successor). Parent (`OverviewPage`) flips `systemStatus` between `mockSystemStatusFollowing` and `mockSystemStatusPaused` as today.
- **Toast:** fire `useToasts.getState().addToast({ message, tone: 'success' })`:
  - Paused: `message: 'Growth paused.'`
  - Resumed: `message: 'Growth resumed.'`
- **No confirmation modal** — pause is reversible.

### Edge states

- **`warming_up`** or **`setup`**: CTA is **not rendered**. The status line carries the state copy (see the phase→text map).
- **Disconnected IG** (state not yet implemented): out of scope for this change.

### Mobile

- Full-width: `w-full` instead of `auto`. Stacks below the identity row via the card's `flex-col` on mobile and `lg:flex-row` on desktop.

---

## 4. Removed

- `StatusPill` component inside `src/pages/overview/index.jsx`.
  - The function + its popover (header, hint, `<dl>` with Next action, pause button inside) are deleted.
  - The `WorkingDots` component stays (not currently used elsewhere, but it's harmless leftover — remove only if no references remain).
- The full name line from the AccountCard JSX.
- `formatApproxTime` usage inside StatusPill — stays if used elsewhere; otherwise delete.
- Imports: `Pause`, `Play` stay (used in new CTA). `WorkingDots` if unreferenced after cleanup.

---

## 5. Component Breakdown

### Option A (minimal refactor — preferred)

Replace `StatusPill` with two smaller components, both defined in the same file:

1. **`<AccountLiveStatus>`** — renders the status line (icon + phase text + animations). Takes `status` (from parent) + consumes `useSystemStatus` internally. Handles the key-based transition, ambient pulse, shimmer, and handle-link-to-`/targets`.
2. **`<AccountPauseCTA>`** — renders the Pause/Resume button. Takes `status` + `onPauseToggle`. Fires toast on click. Hides itself for `warming_up` / `setup` states.

The AccountCard JSX composes them:

```jsx
<div>
  <header row with avatar + @handle + plan pills + AccountPauseCTA (desktop)>
  <AccountLiveStatus />
  <AccountPauseCTA (mobile full-width) />
</div>
```

Both `<AccountPauseCTA>` renders are the same component instance — just different layout zones via responsive show/hide classes.

### Option B (extract into shared components)

Move `<AccountLiveStatus>` and `<AccountPauseCTA>` into their own files under `src/components/`. YAGNI for now — nothing else consumes them. Keep in-file.

**Decision: A.**

---

## 6. Data flow

Unchanged from today:

- `OverviewPage` owns `useState(mockSystemStatus)` and `handlePauseToggle`.
- Passes `systemStatus` + `onPauseToggle` into the AccountCard.
- AccountCard passes them into `<AccountLiveStatus>` and `<AccountPauseCTA>`.
- `<AccountLiveStatus>` additionally calls `useSystemStatus()` to read the live phase + rotating target.
- When paused: `systemStatus.state === 'paused'`. `useSystemStatus` hook reads the baseline and stops ticking; status line shows `Paused`; CTA shows `Resume growth` in primary green.

---

## 7. File-level diff

**Modified:**
- `src/pages/overview/index.jsx`:
  - Delete `function StatusPill(...)` (entire component).
  - Delete the full-name `<p>` in the AccountCard.
  - Add `<AccountLiveStatus>` + `<AccountPauseCTA>` definitions in the same file.
  - Swap the old `<StatusPill />` render sites for the new components per the layout in Section 1.
  - Remove unreferenced imports (`WorkingDots` if unused after the removal).

**Unchanged:**
- `src/hooks/useSystemStatus.js`
- `src/mocks/systemStatus.js`
- `src/pages/targets/LiveActivityCard.jsx` (the cross-page consistency is preserved via the shared hook; no code change needed here).

**New:**
- A keyframe for the shimmer sweep. Two implementation options:
  - **i.** Inline via an arbitrary Tailwind animation utility + a CSS keyframe added to `src/styles/globals.css` (or wherever global styles live).
  - **ii.** A small styled component. Worse for Tailwind-first project.
  - **Default: i** — minimal addition, stays in the design-token ecosystem.

Concrete CSS addition (in `src/styles/` global CSS):

```css
@keyframes status-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
```

And a utility class on the status text element:

```jsx
style={{
  backgroundImage: 'linear-gradient(90deg, var(--color-text-secondary) 0%, var(--color-text-primary) 50%, var(--color-text-secondary) 100%)',
  backgroundSize: '200% auto',
  backgroundClip: 'text',
  WebkitBackgroundClip: 'text',
  color: 'transparent',
  animation: 'status-shimmer 5s ease-in-out infinite',
}}
```

Applied only when the phase is a running phase. Fallback (non-running / paused): regular `text-text-secondary` color.

---

## 8. Out of scope

- Warming-up / setup variants beyond inline copy.
- Disconnected-IG handling on the AccountCard.
- Multi-account status (switching via AccountSwitcher). When the AccountSwitcher eventually propagates selection, `AccountLiveStatus` will read the switched account — no redesign needed.
- Any change to the Overview metric row, chart, activity feed, or Growth+ banner.

---

## 9. Success criteria

- Phase text under the `@handle` animates on every phase change.
- Icon pulses ambiently between phase changes.
- Text shimmers subtly during running phases.
- Pause growth button is visible at all times while the system is running.
- Resume growth button becomes a prominent green primary when paused.
- Toast fires on pause/resume.
- No popover exists.
- Mobile layout stacks identity → status → full-width CTA cleanly.
- Cross-page check: Overview and Targeting show the same phase label + icon at the same time (they already do via `useSystemStatus`).
