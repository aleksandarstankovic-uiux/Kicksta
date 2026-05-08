# Engagement Collapse Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Pencil edit-icon to the Welcome DM bubble (with the helper text removed), then make both engagement cards' "Recent" activity sections collapsible by default via an inline `CollapsibleRecents` helper duplicated per card.

**Architecture:** Three-file refactor across `WelcomeDmPreview.jsx`, `WelcomeDmCard.jsx`, and `CloseFriendsCard.jsx`. No new component files. The `CollapsibleRecents` helper is intentionally duplicated inline in each card file rather than lifted — ~15 lines × 2 isn't worth its own module per design decision.

**Tech Stack:** React 19, Tailwind v4, Lucide React. New Lucide imports: `Pencil` (in `WelcomeDmPreview`), `ChevronDown` (in both card files). No automated test suite — verification is manual via the Claude Preview MCP server (`preview_eval`, `preview_click`, `preview_screenshot`) at mobile (375×812) and desktop (1280×800).

**Spec:** `docs/superpowers/specs/2026-05-08-engagement-collapse-design.md`

---

## File Map

| File | Touched by | Responsibility |
|---|---|---|
| `src/pages/engagement/WelcomeDmPreview.jsx` | Task 1 | Add Pencil icon inside the bubble; remove helper text below. |
| `src/pages/engagement/WelcomeDmCard.jsx` | Task 2 | Add `CollapsibleRecents` helper; wrap `RecentDmsSubsection`. |
| `src/pages/engagement/CloseFriendsCard.jsx` | Task 3 | Add `CollapsibleRecents` helper (separate copy); wrap `CloseFriendsState`. |

Implementation order is independence-driven:
1. **Task 1** — bubble + icon. Smallest, fully isolated.
2. **Task 2** — `CollapsibleRecents` in `WelcomeDmCard.jsx`. Establishes the helper shape; uses already-imported `useState`.
3. **Task 3** — same helper duplicated in `CloseFriendsCard.jsx`. Adds a new `useState` import.

Each task ends in one commit.

---

## Task 1: Welcome DM bubble — Pencil icon, drop helper text

**Why:** Today's bubble is the click target for opening the edit modal but the affordance isn't visually marked. A Pencil icon in the top-right makes the affordance obvious; the bubble + icon both still open the modal. The helper text below (`Click the bubble to edit` / `Edit becomes available when on`) becomes redundant once the icon is there.

**Files:**
- Modify: `src/pages/engagement/WelcomeDmPreview.jsx`

- [ ] **Step 1: Add the Lucide import**

Open `src/pages/engagement/WelcomeDmPreview.jsx`. The file currently has no imports at the top. Add a single line at the very top of the file:

```jsx
import { Pencil } from 'lucide-react'
```

- [ ] **Step 2: Replace the component body**

Replace the entire `return (...)` block in `WelcomeDmPreview` with:

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

Three diffs vs. before:
1. Button className gains `relative` and `pr-9` (reserves space so the icon doesn't underflow the message text).
2. New conditional Pencil icon rendered inside the button as an absolute-positioned child (top-right corner).
3. The trailing helper `<p>` line ("Click the bubble to edit" / "Edit becomes available when on") is removed entirely.

- [ ] **Step 3: Manual verify**

Start the preview server if not already running:
```
preview_start "Vite Dev Server"
preview_resize preset=mobile
```

Navigate to `http://localhost:5173/engagement`.

If the Welcome DM toggle is off (default), turn it ON via the toggle in the upper-right of the Welcome DM card.

Verify in browser:
- A Pencil icon is visible in the top-right corner of the chat bubble.
- The bubble itself is still clickable (clicking message text opens the edit modal).
- Clicking the Pencil icon also opens the edit modal.
- The "Click the bubble to edit" helper line below the bubble is gone.

Toggle Welcome DM off. Verify:
- Bubble shows the muted placeholder text.
- No Pencil icon visible (off-state).
- No helper text below.

Use `preview_eval` to confirm the structure:
```js
(() => {
  const cards = [...document.querySelectorAll('section')];
  const dmCard = cards.find(s => s.querySelector('h2')?.textContent.includes('Welcome DM'));
  const bubble = dmCard?.querySelector('button[aria-label="Edit welcome DM message"]');
  const helperBelow = dmCard?.querySelector('button[aria-label] + p');
  const pencilSvg = bubble?.querySelector('svg.lucide-pencil');
  return {
    bubbleClickable: !!bubble,
    pencilVisible: !!pencilSvg,
    helperPresent: !!helperBelow,
  };
})()
```
Expected (with toggle ON): `{ bubbleClickable: true, pencilVisible: true, helperPresent: false }`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/engagement/WelcomeDmPreview.jsx
git commit -m "$(cat <<'EOF'
feat(engagement): Pencil icon on Welcome DM bubble, drop helper text

Top-right Pencil icon (h-3.5 text-text-secondary) makes the edit
affordance visible at a glance. Whole bubble + icon both open the edit
modal. Off-state hides the icon (toggle is the only way to enable).
The "Click the bubble to edit" helper paragraph below the bubble is
removed — the icon makes the affordance self-explanatory. Resolves
engagement-collapse item 1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Welcome DM — CollapsibleRecents helper + wrap RecentDmsSubsection

**Why:** The "Recent DMs sent" list is always-on today. Wrap it in a click-to-expand disclosure (default closed) so the card stays focused on the toggle + bubble preview unless the user explicitly opens the activity log.

**Files:**
- Modify: `src/pages/engagement/WelcomeDmCard.jsx`

- [ ] **Step 1: Add `ChevronDown` to the Lucide import**

Open `src/pages/engagement/WelcomeDmCard.jsx`. Find the Lucide import at the top:

```jsx
import { MessageSquare } from 'lucide-react'
```

Replace with:

```jsx
import { ChevronDown, MessageSquare } from 'lucide-react'
```

(`useState` is already imported from `react` on line 1 — no change needed.)

- [ ] **Step 2: Append the `CollapsibleRecents` helper at the bottom of the file**

Add this helper at the end of the file, after the existing `RecentDmsSubsection`:

```jsx
// Click-to-expand wrapper around the per-card "Recent" activity list.
// Default closed. Header is the eyebrow recipe (text-[11px] uppercase
// tracking-wide text-text-muted) so the closed state matches the
// existing section labels. Chevron rotates 180° when expanded.
// Duplicated inline in CloseFriendsCard.jsx — the ~15 lines aren't
// worth a shared module.
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

- [ ] **Step 3: Replace the `RecentDmsSubsection` body to use `CollapsibleRecents`**

Find `RecentDmsSubsection` (toward the bottom of the file). It currently reads:

```jsx
function RecentDmsSubsection() {
  const items = mockWelcomeDmHistory.slice(0, 5)
  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Recent DMs sent
      </p>
      {items.length === 0 ? (
        <p className="py-3 text-center text-xs text-text-muted">
          No DMs sent yet — check back after your first follow-back.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col">
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

Two diffs vs. before:
- Outer `<div className="mt-3 border-t border-border pt-3">` and the `<p>` heading are gone (both moved into `CollapsibleRecents`).
- Inner `<ul>` loses its `mt-2` (the helper applies the gap from header → content via its own `mt-2` wrapper around `{children}`).

- [ ] **Step 4: Manual verify**

Reload preview at mobile. Navigate to `/engagement`. Turn the Welcome DM toggle on (Advanced plan in mocks).

Verify:
- The card shows: header + bubble + a `Recent DMs sent ▾` row at the bottom.
- The list of DMs is NOT visible (collapsed by default).
- Click the `Recent DMs sent` header. Verify:
  - The chevron rotates 180° (now points up).
  - The DM history list appears below.
- Click the header again. Verify the list collapses.

Use `preview_eval` to confirm:
```js
(() => {
  const cards = [...document.querySelectorAll('section')];
  const dmCard = cards.find(s => s.querySelector('h2')?.textContent.includes('Welcome DM'));
  const headerBtn = [...dmCard.querySelectorAll('button')].find(b => b.textContent.includes('Recent DMs sent'));
  return {
    headerExists: !!headerBtn,
    initiallyClosed: headerBtn?.getAttribute('aria-expanded') === 'false',
    chevronPresent: !!headerBtn?.querySelector('svg.lucide-chevron-down'),
  };
})()
```
Expected: `{ headerExists: true, initiallyClosed: true, chevronPresent: true }`.

Click the header (via `preview_click` on `button[aria-expanded="false"]` inside the Welcome DM card or via `preview_eval`), then re-check `aria-expanded` is `"true"`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/engagement/WelcomeDmCard.jsx
git commit -m "$(cat <<'EOF'
feat(engagement): collapsible Recent DMs sent on Welcome DM card

Adds an inline CollapsibleRecents helper (default closed) and wraps
the existing RecentDmsSubsection. The activity list stays hidden until
the user expands. Same helper will be duplicated inline in
CloseFriendsCard for parallel treatment. Resolves engagement-collapse
item 2 (Welcome DM half).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Close Friends — CollapsibleRecents helper + wrap CloseFriendsState

**Why:** Same treatment as Task 2 but for the CFA card's `Recent` activity list. The helper is duplicated inline (per spec decision — ~15 lines per file isn't worth lifting to a shared module).

**Files:**
- Modify: `src/pages/engagement/CloseFriendsCard.jsx`

- [ ] **Step 1: Add the `useState` import**

Open `src/pages/engagement/CloseFriendsCard.jsx`. The file currently has no React import. Add a new line at the very top of the file (above the existing Lucide import):

```jsx
import { useState } from 'react'
```

So the top of the file goes from:

```jsx
import { Minus, Plus, Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
```

To:

```jsx
import { useState } from 'react'
import { ChevronDown, Minus, Plus, Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
```

(Two changes here — the new React line plus `ChevronDown` added to the Lucide import. Step 2 covers `ChevronDown`.)

- [ ] **Step 2: Add `ChevronDown` to the Lucide import**

Already done in Step 1's combined snippet — verify the Lucide import reads:

```jsx
import { ChevronDown, Minus, Plus, Star } from 'lucide-react'
```

(Imports are alphabetical by convention.)

- [ ] **Step 3: Append the `CollapsibleRecents` helper at the bottom of the file**

Add this helper at the end of the file, after the existing `CloseFriendsState`:

```jsx
// Click-to-expand wrapper around the per-card "Recent" activity list.
// Default closed. Header is the eyebrow recipe (text-[11px] uppercase
// tracking-wide text-text-muted) so the closed state matches the
// existing section labels. Chevron rotates 180° when expanded.
// Duplicated inline in WelcomeDmCard.jsx — the ~15 lines aren't
// worth a shared module.
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

- [ ] **Step 4: Replace the `CloseFriendsState` body to use `CollapsibleRecents`**

Find `CloseFriendsState` near the bottom of the file. After the polish-pass changes, it currently reads:

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
        <ul className="mt-2 flex flex-col">
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

Same two diffs as Task 2:
- Outer `<div className="mt-3 border-t border-border pt-3">` and the `<p>` heading are gone (both moved into `CollapsibleRecents`).
- Inner `<ul>` loses its `mt-2` (the helper applies the gap).

- [ ] **Step 5: Manual verify**

Reload preview at mobile. Navigate to `/engagement`. Turn the Close Friends Adder toggle on (Advanced plan).

Verify:
- The card shows: header + segmented control + progress block + a `Recent ▾` row at the bottom.
- The activity list is NOT visible (collapsed by default).
- Click the `Recent` header. Verify:
  - Chevron rotates 180°.
  - The activity list appears below with Plus/Minus icons.
- Click the header again. Verify it collapses.
- Switch CFA mode (Add ↔ Remove). Verify the section's open/closed state is preserved across mode switches (it's per-instance state, no reset).

Use `preview_eval` to confirm both engagement cards now have working disclosures:
```js
(() => {
  const cards = [...document.querySelectorAll('section')];
  const headers = cards.flatMap(c => [...c.querySelectorAll('button[aria-expanded]')]);
  return headers.map(h => ({
    title: h.querySelector('span')?.textContent.trim(),
    expanded: h.getAttribute('aria-expanded'),
  }));
})()
```
Expected (after page reload): `[{ title: 'Recent DMs sent', expanded: 'false' }, { title: 'Recent', expanded: 'false' }]`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/engagement/CloseFriendsCard.jsx
git commit -m "$(cat <<'EOF'
feat(engagement): collapsible Recent activity on Close Friends card

Adds the same inline CollapsibleRecents helper as WelcomeDmCard and
wraps the existing CloseFriendsState. The activity list stays hidden
until the user expands. Helper is intentionally duplicated per-card
(~15 lines × 2) rather than lifted — not worth a shared module per
spec decision. Resolves engagement-collapse item 2 (CFA half).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

- [ ] **Step 1: Sweep both engagement cards at mobile + desktop**

Navigate to `/engagement` at mobile (375×812) and desktop (1280×800):

- Welcome DM card (toggle ON): Pencil icon visible top-right of the bubble; no helper text below the bubble; `Recent DMs sent ▾` collapsed by default; expand/collapse works.
- Welcome DM card (toggle OFF): Bubble shows muted placeholder; no Pencil icon; no helper text below; activity section is gated behind `showPreview` and not rendered (this matches the existing parent gate, unchanged).
- CFA card (toggle ON): All controls intact (mode segmented control, progress block); `Recent ▾` collapsed by default; expand/collapse works; activity icons (green Plus / muted Minus) appear when expanded.
- CFA card (toggle OFF): All controls greyed; activity section is gated behind `showCfControls` and not rendered (parent gate, unchanged).

- [ ] **Step 2: Check git log**

```bash
git log --oneline -5
```

Expected: three new commits on top of the spec commit, in this order: Pencil/helper, Welcome DM collapsible, CFA collapsible.

---

## Notes for the implementer

- The `CollapsibleRecents` helper is duplicated by design. Do NOT lift it to a shared file — the spec explicitly chose duplication over a new module for ~15 lines.
- After Tasks 2 and 3, the helper definitions are byte-identical except for their location. If you spot a tweak needed (typo, class fix), apply it in BOTH files in a single follow-up commit so they don't drift.
- The helper's `useState` is per-instance — Task 2's collapsed state doesn't affect Task 3's. Don't lift state to a parent or shared store.
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
- The codebase has no automated test suite. Verification is manual via the preview MCP server.
- Use `preview_inspect` over `preview_screenshot` for verifying styles (colors, padding) — screenshots are unreliable for exact pixel checks.
- The Pencil icon in Task 1 is intentionally `text-text-secondary` (muted), not blue. Goal: visible but not louder than the message itself. If the icon reads as too prominent in browser, that's a bug — flag it; don't quietly retint to brand blue.
