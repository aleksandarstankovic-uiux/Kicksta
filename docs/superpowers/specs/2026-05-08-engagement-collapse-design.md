# Engagement Collapse — Design Spec

**Date:** 2026-05-08
**Goal:** Add a clear edit-icon affordance to the Welcome DM chat bubble, and make the per-card "Recent" activity sections collapsible (default closed) so the engagement cards stop bloating below the toggle row.

**Architecture:** Two-file refactor. `src/pages/engagement/WelcomeDmPreview.jsx` gains a Pencil icon in the bubble corner and loses its helper-text line. `src/pages/engagement/WelcomeDmCard.jsx` and `src/pages/engagement/CloseFriendsCard.jsx` each get an inline `CollapsibleRecents` helper that wraps the existing recents list in a click-to-expand disclosure. No new component files. No shared component lift — the ~15 lines duplicated across the two cards isn't worth its own module.

**Tech stack:** React, Tailwind, Lucide. New Lucide imports: `Pencil` (in `WelcomeDmPreview`), `ChevronDown` (in both card files).

**Source brainstorm:** 2026-05-08 — items #9 and #10 from the original 18-item batch.

---

## Item 1 — Welcome DM edit icon

**Why:** Today's Welcome DM bubble is the click target for opening the edit modal, with a helper line below saying `Click the bubble to edit`. The affordance isn't visible — users who scan the card don't know the bubble is interactive until they read the helper text. A Pencil icon in the bubble corner makes the edit affordance visible at a glance; the helper text becomes redundant and goes away.

The full bubble stays clickable too (forgiving target), so users tapping anywhere on the bubble still trigger the edit modal. The icon is a visual marker, not the only click target.

**Files:**
- Modify: `src/pages/engagement/WelcomeDmPreview.jsx`

**Changes:**

1. Add `Pencil` to a new Lucide import at the top of the file (currently has no Lucide imports):

```jsx
import { Pencil } from 'lucide-react'
```

2. Wrap the bubble button so the message text doesn't underflow the icon. Add `relative` and `pr-9` to the button's existing className.

3. Render the Pencil icon as an absolutely-positioned child of the button, gated on `enabled` so the off-state doesn't show an edit affordance the user can't act on.

4. Remove the helper `<p>` below the bubble entirely (`Click the bubble to edit` / `Edit becomes available when on`).

**Final shape** of the component (replace the entire return block):

```jsx
return (
  <div className="mt-2 pb-2">
    <button
      type="button"
      onClick={enabled ? onEdit : undefined}
      disabled={!enabled}
      aria-label={enabled ? 'Edit welcome DM message' : undefined}
      className={`group relative w-full rounded-2xl rounded-tl-sm border px-3 py-2 pr-9 text-left text-sm leading-relaxed transition-all ${
        enabled
          ? 'cursor-pointer border-transparent bg-blue-tint text-text-primary hover:border-blue-base hover:bg-blue-tint/70 hover:shadow-sm'
          : 'cursor-not-allowed border-transparent bg-bg text-text-muted'
      }`}
    >
      {/* Hard-truncate to exactly 2 lines regardless of message length:
          line-clamp-2 plus an explicit max-height in line-height units
          (text-sm × leading-relaxed × 2 lines ≈ 2.85em) so the bubble
          never grows even if line-clamp is somehow overridden. */}
      <span
        className="line-clamp-2 block overflow-hidden break-words"
        style={{ maxHeight: '2.85em' }}
      >
        {enabled
          ? message
          : 'Toggle on to send a custom welcome message to new followers.'}
      </span>
      {enabled && (
        <Pencil
          className="absolute right-2 top-2 h-3.5 w-3.5 text-text-secondary"
          aria-hidden="true"
        />
      )}
    </button>
  </div>
)
```

**What changed from before:**
- New `Pencil` import.
- Button className gains `relative pr-9`.
- New conditional Pencil icon rendered inside the button.
- The trailing `<p>` helper line is removed.

**Acceptance:** When `enabled` is true, the bubble shows the message text plus a Pencil icon in the top-right corner; clicking anywhere on the bubble (icon or text) opens the edit modal. When `enabled` is false, the bubble is muted, has no icon, and is non-interactive. No helper text below the bubble in either state.

---

## Item 2 — Collapsible recents on both engagement cards

**Why:** The `Recent DMs sent` and `Recent` (CFA) activity lists are always-on today, adding ~150–200px of vertical content per card on Advanced-plan users. Most users glance at the running activity once and never look again — collapse it by default so the cards stay focused on the toggle + active controls, and let the user expand when they want details.

**Files:**
- Modify: `src/pages/engagement/WelcomeDmCard.jsx`
- Modify: `src/pages/engagement/CloseFriendsCard.jsx`

**Pattern (shared between both files via inline helper):**

A tiny inline component named `CollapsibleRecents` defined at the bottom of each card file. Same code in both files; not lifted to a shared module because ~15 lines duplicated isn't worth a new file.

The helper renders a click-to-expand header above the existing recents content:

```jsx
function CollapsibleRecents({ title, children }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-text-muted hover:text-text-secondary"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}
```

**Behavior:**
- Default closed (`useState(false)`). State is per-instance, per-card.
- Click anywhere on the header row (full-width button) to toggle.
- Chevron rotates 180° when expanded — `transition-transform` for the rotation.
- No height animation on the content — just toggle visibility. The dashboard otherwise doesn't do height animations; staying consistent.
- The eyebrow recipe (`text-[11px] uppercase tracking-wide text-text-muted`) is preserved so the closed state looks like the existing section labels users are used to.
- `aria-expanded` on the button so screen readers announce state.

**Why `border-t border-border pt-3` and `mt-3`** — these match the existing `<div className="mt-3 border-t border-border pt-3">` wrappers around `RecentDmsSubsection` and `CloseFriendsState`. The wrapper moves into the helper itself.

### `WelcomeDmCard.jsx` — replace the `RecentDmsSubsection` helper

Currently the file has:

```jsx
function RecentDmsSubsection() {
  const items = mockWelcomeDmHistory.slice(0, 5)
  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Recent DMs sent
      </p>
      {items.length === 0 ? (
        <p className="py-3 text-center text-xs text-text-muted">…</p>
      ) : (
        <ul className="mt-2 flex flex-col">{/* …items… */}</ul>
      )}
    </div>
  )
}
```

Replace with:

```jsx
function RecentDmsSubsection() {
  const items = mockWelcomeDmHistory.slice(0, 5)
  return (
    <CollapsibleRecents title="Recent DMs sent">
      {items.length === 0 ? (
        <p className="py-3 text-center text-xs text-text-muted">
          No DMs sent yet — check back after your first follow-back.
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-2 py-2 text-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg text-[11px] font-semibold text-text-secondary">
                {event.username.replace(/^@/, '').charAt(0).toUpperCase()}
              </span>
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
    </CollapsibleRecents>
  )
}
```

Two diffs:
- The outer `<div className="mt-3 border-t border-border pt-3">` and the `<p>` heading are gone — both moved into `CollapsibleRecents`.
- The inner `<ul>` loses its `mt-2` since the helper applies the gap from header → content via its own `mt-2` wrapper around `{children}`.

**Imports at the top of `WelcomeDmCard.jsx`:**
- `useState` is already imported (`import { useState } from 'react'`) — no change needed.
- Add `ChevronDown` to the Lucide import: `import { ChevronDown, MessageSquare } from 'lucide-react'` (was `import { MessageSquare } from 'lucide-react'`).

**`CollapsibleRecents` helper** — append at the bottom of the file, after the existing `RecentDmsSubsection` (or after `CardToggle`, wherever the file ends).

### `CloseFriendsCard.jsx` — replace the `CloseFriendsState` helper's wrapper

Currently the file has (after polish-pass dropped the count line):

```jsx
function CloseFriendsState() {
  const { recent } = mockCloseFriendsState
  const items = recent.slice(0, 5)
  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Recent
      </p>
      {items.length === 0 ? (
        <p className="py-3 text-center text-xs text-text-muted">
          No recent activity yet.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col">{/* …items… */}</ul>
      )}
    </div>
  )
}
```

Replace with:

```jsx
function CloseFriendsState() {
  const { recent } = mockCloseFriendsState
  const items = recent.slice(0, 5)
  return (
    <CollapsibleRecents title="Recent">
      {items.length === 0 ? (
        <p className="py-3 text-center text-xs text-text-muted">
          No recent activity yet.
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-2 py-2 text-sm"
            >
              {event.type === 'add' ? (
                <Plus className="h-4 w-4 shrink-0 text-green-text" aria-hidden="true" />
              ) : (
                <Minus className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
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
    </CollapsibleRecents>
  )
}
```

Same two diffs as `WelcomeDmCard`:
- Outer wrapper + heading move into `CollapsibleRecents`.
- Inner `<ul>` loses `mt-2`.

**Imports at the top of `CloseFriendsCard.jsx`:**
- `useState` is NOT currently imported — add a new line at the top of the file: `import { useState } from 'react'` (above the existing Lucide import).
- Add `ChevronDown` to the Lucide import: `import { ChevronDown, Minus, Plus, Star } from 'lucide-react'` (was `import { Minus, Plus, Star } from 'lucide-react'`).

**`CollapsibleRecents` helper** — append at the bottom of the file (after `CloseFriendsState`).

**Acceptance for both cards:** When the toggle is on, the activity-list section appears collapsed by default — only the `Recent` (or `Recent DMs sent`) header is visible, with a chevron pointing down on the right. Clicking the header expands the list inline; the chevron rotates to point up. Clicking again collapses. State is per-card; expanding one doesn't affect the other.

---

## Out of scope

- Pagination / "show all" inside the expanded list — items still cap at 5 (`slice(0, 5)`), unchanged.
- Empty-state copy is unchanged; only the wrapper changes.
- The `Recent` count badge in the header (rejected during brainstorm — stays just a label).
- Animation on the content reveal (no height transition; consistent with the dashboard's restraint).

---

## Implementation notes for the plan

- Implement Item 1 first (smaller, isolated to one file).
- Item 2 can be implemented file-by-file (Welcome DM, then CFA) — they share the same helper definition but each file gets its own copy, so no cross-file dependency.
- The codebase has no automated test suite; verification is manual via the preview server.
- After Item 2, manually verify:
  - Default state of both cards (toggle ON, activity list collapsed).
  - Expand → collapse works on each card.
  - Empty-state copy still renders inside the expanded section.
  - Mobile + desktop layout intact (the disclosure shouldn't change card width or break the toggle row above).
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
- Do NOT lift `CollapsibleRecents` to a shared file — duplicated inline per card per design decision.
