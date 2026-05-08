# Nav Server-Change Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the per-subscription server-change affordance from `SubscriptionDetail`'s `ServerCard` into the `AccountSwitcher` panel as a clickable row inside the active-account block. Replace the editable card on the detail page with a one-line read-only fact. Delete the orphaned `ServerCard.jsx`.

**Architecture:** Two-file refactor + one file deletion. `src/components/AccountSwitcher.jsx` gains the server row inside its shared `PanelContent` helper, plus parent-level state and rendering of the existing `ChangeServerModal`. `src/pages/account/SubscriptionDetail.jsx` drops its `ServerCard` import + render and replaces them with a `<p>`. `src/pages/account/ServerCard.jsx` is deleted (no remaining consumers).

**Tech Stack:** React 19, Tailwind v4, Lucide React, Zustand 5. Reuses the existing `useSubscriptions` store (`subscriptions`, `setServer`), the `useAccounts` store (`accounts`, `activeId`), the `findServer` lookup helper from `src/mocks/servers.js`, and the existing `ChangeServerModal` component unchanged. No automated test suite — verification is manual via the Claude Preview MCP server (`preview_eval`, `preview_resize`, `preview_click`) at mobile (375×812) and desktop (1280×800).

**Spec:** `docs/superpowers/specs/2026-05-08-nav-server-change-design.md`

---

## File Map

| File | Touched by | Responsibility |
|---|---|---|
| `src/components/AccountSwitcher.jsx` | Task 1 | Server row inside `PanelContent`'s active-account block, plus parent-level `serverModalOpen` state + `<ChangeServerModal>` render. |
| `src/pages/account/SubscriptionDetail.jsx` | Task 2 | Drop `ServerCard` import + render; add a one-line read-only `<p>` using `findServer`. |
| `src/pages/account/ServerCard.jsx` | Task 3 | Delete entirely (no remaining consumers after Task 2). |

Implementation order:
1. **Task 1** — additive change in `AccountSwitcher`. The new row appears, modal opens, save flow works. Old `ServerCard` on the detail page still exists and still works at this point.
2. **Task 2** — replace `ServerCard` with the read-only line in `SubscriptionDetail`. After this lands, the file `ServerCard.jsx` has no consumers.
3. **Task 3** — delete `ServerCard.jsx`. Single command, single commit.

Three commits total.

---

## Task 1: AccountSwitcher — server row + modal wiring

**Why:** Today the server is only editable from `SubscriptionDetail`. Users editing their account in the AccountSwitcher have to leave the panel, navigate to Settings, click into a subscription, and find the Server card. Putting the affordance inside the active-account block of the AccountSwitcher panel is the natural home — the server is per-subscription, and the active subscription corresponds 1:1 with the active IG account.

**Files:**
- Modify: `src/components/AccountSwitcher.jsx`

- [ ] **Step 1: Update imports**

Open `src/components/AccountSwitcher.jsx`. The current top of the file reads:

```jsx
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccounts } from '@/stores/useAccounts'
```

Replace with:

```jsx
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, ChevronRight, ChevronsUpDown, Globe, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccounts } from '@/stores/useAccounts'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { findServer } from '@/mocks/servers'
import ChangeServerModal from '@/pages/account/ChangeServerModal'
```

Two diffs:
- Lucide import gains `ChevronRight` and `Globe` (alphabetical).
- Three new lines below `useAccounts`: `useSubscriptions`, `findServer`, `ChangeServerModal`.

- [ ] **Step 2: Add subscription resolution + modal state in `AccountSwitcher`**

Inside the `AccountSwitcher` function body, immediately after the existing state declarations (`open`, `mounted`, etc.) and the existing store reads (`accounts`, `activeId`, `setActiveId`), add:

```jsx
const subscriptions = useSubscriptions((s) => s.subscriptions)
const [serverModalOpen, setServerModalOpen] = useState(false)
```

Then, AFTER the existing `const active = accounts.find(...)` and `const others = ...` lines, add subscription + server resolution:

```jsx
const activeSubscription = subscriptions.find((s) => s.accountId === active.id) ?? null
const server = activeSubscription ? findServer(activeSubscription.server) : null
```

The full block of derived values around there now reads:

```jsx
const active = accounts.find((a) => a.id === activeId) ?? accounts[0]
const others = accounts.filter((a) => a.id !== active.id)
const activeSubscription = subscriptions.find((s) => s.accountId === active.id) ?? null
const server = activeSubscription ? findServer(activeSubscription.server) : null
```

- [ ] **Step 3: Pass new props through both `<PanelContent>` calls**

There are two `<PanelContent ... />` calls inside `AccountSwitcher` — one in the dropdown variant, one in the sheet variant. Each currently reads:

```jsx
<PanelContent
  active={active}
  others={others}
  onPick={handlePick}
  onAddAccountClick={() => setOpen(false)}
/>
```

(The sheet variant also passes `density="comfy"`.)

Update each to pass three new props:

```jsx
<PanelContent
  active={active}
  others={others}
  onPick={handlePick}
  onAddAccountClick={() => setOpen(false)}
  subscription={activeSubscription}
  server={server}
  onChangeServerClick={() => {
    setOpen(false)
    setServerModalOpen(true)
  }}
/>
```

(The sheet variant keeps its `density="comfy"`.)

The `setOpen(false)` inside `onChangeServerClick` dismisses the panel before the modal opens — applies to both variants for consistent behavior.

- [ ] **Step 4: Render `<ChangeServerModal>` at the parent level**

Add the modal as a sibling to the dropdown/sheet branches inside `AccountSwitcher`'s return. The current top-level return shape is:

```jsx
return (
  <div ref={ref} className="relative">
    <button …>
      {/* trigger row content */}
    </button>

    {/* Dropdown variant — open && variant === 'dropdown' && (…) */}
    {/* Sheet variant — open && variant === 'sheet' && createPortal(…) */}
  </div>
)
```

After the closing of the sheet variant's `createPortal`, add the modal render — also via `createPortal` to `document.body` so it escapes any transformed-ancestor containing block (same rationale as the sheet variant):

```jsx
{activeSubscription && createPortal(
  <ChangeServerModal
    open={serverModalOpen}
    subscription={activeSubscription}
    onClose={() => setServerModalOpen(false)}
  />,
  document.body,
)}
```

Wrapping it in `activeSubscription &&` guards against `null` — the modal expects `subscription.server` to exist on its `picked` initial state.

The modal's existing internal `open` gate (`if (!open || !subscription) return null`) handles the closed state, so always-rendering this branch is fine.

- [ ] **Step 5: Update `PanelContent`'s signature and render the server row**

Locate the `PanelContent` function definition near the bottom of `AccountSwitcher.jsx`. Its current signature:

```jsx
function PanelContent({
  active,
  others,
  onPick,
  onAddAccountClick,
  density = 'compact',
}) {
  const rowClasses =
    density === 'comfy'
      ? 'flex items-center gap-3 rounded-lg px-3 py-3'
      : 'flex items-center gap-2 rounded-md px-2 py-2'

  return (
    <>
      {/* active row */}
      <div className={`${rowClasses} bg-bg`}>
        {/* …active account row content unchanged… */}
      </div>

      {others.length > 0 && (
        {/* …others list unchanged… */}
      )}

      {/* …Add account row unchanged… */}
    </>
  )
}
```

Update the signature to accept the three new props:

```jsx
function PanelContent({
  active,
  others,
  onPick,
  onAddAccountClick,
  density = 'compact',
  subscription,
  server,
  onChangeServerClick,
}) {
```

Then, render the server row IMMEDIATELY AFTER the active-account `<div>` (the one with `bg-bg`), BEFORE the `{others.length > 0 && (…)}` block:

```jsx
{server && onChangeServerClick && (
  <button
    type="button"
    onClick={onChangeServerClick}
    aria-label={`Change server for @${active.username} (currently ${server.label})`}
    className={`${rowClasses} text-left transition-colors hover:bg-bg`}
  >
    <span
      aria-hidden
      className={`flex shrink-0 items-center justify-center rounded-full bg-blue-tint text-blue-text ring-1 ring-border ${
        density === 'comfy' ? 'h-8 w-8' : 'h-7 w-7'
      }`}
    >
      <Globe className={density === 'comfy' ? 'h-4 w-4' : 'h-3.5 w-3.5'} aria-hidden="true" />
    </span>
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium text-text-primary">
        Server: {server.label}
      </div>
      <div className="truncate text-xs text-text-muted">{server.region}</div>
    </div>
    <ChevronRight className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
  </button>
)}
```

The `subscription` prop is currently unused inside `PanelContent` — it's passed for completeness in case future tweaks need it. ESLint may warn about an unused prop; the warning is acceptable since the prop's presence documents that this row is per-subscription.

If ESLint actually errors (not warns) on the unused prop, remove it from `PanelContent`'s destructure but keep it in the parent's prop pass — the warning is a nice-to-have, not a blocker.

- [ ] **Step 6: Manual verify — desktop dropdown variant**

Start the preview server if not already running:
```
preview_start "Vite Dev Server"
preview_resize preset=desktop
```

Navigate to `http://localhost:5173/`. Click the AccountSwitcher trigger in the desktop sidebar (bottom-left of the sidebar, shows `@alexjohnson.co`).

Verify:
- A new row appears below the active account row (the one with the `Check`).
- The row reads: `[Globe icon in blue-tint circle] Server: US-East / United States (East) [chevron right]`.
- Hovering the row shows a `bg-bg` highlight.
- Clicking the row dismisses the dropdown AND opens the `ChangeServerModal` (centered modal on desktop, blue-tint server selection list).
- Picking a different server (e.g. `EU-West`) and clicking Save closes the modal.
- Reopening the AccountSwitcher trigger shows the server row updated to `Server: EU-West / Europe (West)`.

Use `preview_eval` to confirm the structure:
```js
(() => {
  const trigger = document.querySelector('aside button[aria-haspopup="menu"]');
  trigger?.click();
  const menu = document.querySelector('[role=menu]');
  const serverBtn = menu?.querySelector('button[aria-label^="Change server"]');
  return {
    triggerExists: !!trigger,
    menuOpen: !!menu,
    serverRowPresent: !!serverBtn,
    serverRowLabel: serverBtn?.querySelector('.font-medium')?.textContent,
  };
})()
```
Expected: `{ triggerExists: true, menuOpen: true, serverRowPresent: true, serverRowLabel: 'Server: US-East' }` (assuming default subscription has `us-east`).

- [ ] **Step 7: Manual verify — mobile sheet variant**

Resize: `preview_resize preset=mobile`. Navigate to `http://localhost:5173/`. Tap the hamburger menu in the top-left to open the mobile drawer. Tap the active-account row in the drawer's "Instagram accounts" section to open the bottom-sheet account switcher.

Verify:
- The bottom sheet shows the active account row with check, then a `Server:` row immediately below, then divider + other accounts + Add account.
- The server row uses comfy density (taller padding, larger icon).
- Tapping it dismisses the bottom sheet AND opens `ChangeServerModal` (bottom-aligned modal on mobile).

- [ ] **Step 8: Commit**

```bash
git add src/components/AccountSwitcher.jsx
git commit -m "$(cat <<'EOF'
feat(nav): server row in AccountSwitcher panel

Adds a Globe + "Server: <Label>" row inside the active-account block
of the AccountSwitcher panel (both dropdown and sheet variants). The
row reads the active account's subscription and surfaces its server
label + region; tapping it dismisses the panel and opens the existing
ChangeServerModal. Saved changes flow through useSubscriptions.setServer
and reflect on next panel open. Resolves nav-server-change item 1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: SubscriptionDetail — replace ServerCard with read-only line

**Why:** The editable Change-server affordance now lives in AccountSwitcher (Task 1). The detail page should still surface the server name as reference info — text-sized, no card chrome, no Change button. Drops the duplicate edit path.

**Files:**
- Modify: `src/pages/account/SubscriptionDetail.jsx`

- [ ] **Step 1: Update imports**

Open `src/pages/account/SubscriptionDetail.jsx`. The current top reads:

```jsx
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { useAccounts } from '@/stores/useAccounts'
import { invoicesForSubscription } from '@/mocks/invoices'
import PlanCard from './PlanCard'
import ServerCard from './ServerCard'
import InvoicesTable from './InvoicesTable'
import CancelSubscriptionModal from './CancelSubscriptionModal'
import { STATUS_PILL, letterFor } from './subscriptionShared'
```

Replace with:

```jsx
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { useAccounts } from '@/stores/useAccounts'
import { invoicesForSubscription } from '@/mocks/invoices'
import { findServer } from '@/mocks/servers'
import PlanCard from './PlanCard'
import InvoicesTable from './InvoicesTable'
import CancelSubscriptionModal from './CancelSubscriptionModal'
import { STATUS_PILL, letterFor } from './subscriptionShared'
```

Two diffs:
- Drop `import ServerCard from './ServerCard'`.
- Add `import { findServer } from '@/mocks/servers'` (alongside the existing `@/mocks/invoices` import).

- [ ] **Step 2: Replace `<ServerCard subscription={sub} />` with the read-only line**

Locate the render block:

```jsx
<div className="mt-6 flex flex-col gap-6">
  <PlanCard subscription={sub} />
  <ServerCard subscription={sub} />

  <div className="flex flex-col gap-3">
    <h2 className="text-base font-semibold text-text-primary">Invoices</h2>
    {/* … */}
  </div>
  {/* … cancel section … */}
</div>
```

Replace `<ServerCard subscription={sub} />` with:

```jsx
<p className="text-xs text-text-secondary">
  Server: <span className="font-medium text-text-primary">{findServer(sub.server).label}</span> · {findServer(sub.server).region}
</p>
```

Final block:

```jsx
<div className="mt-6 flex flex-col gap-6">
  <PlanCard subscription={sub} />
  <p className="text-xs text-text-secondary">
    Server: <span className="font-medium text-text-primary">{findServer(sub.server).label}</span> · {findServer(sub.server).region}
  </p>

  <div className="flex flex-col gap-3">
    <h2 className="text-base font-semibold text-text-primary">Invoices</h2>
    {/* … */}
  </div>
  {/* … cancel section … */}
</div>
```

- [ ] **Step 3: Manual verify**

Reload preview at desktop. Navigate to `/account/billing`. Click any subscription card to drill into `/account/subscriptions/<id>`.

Verify:
- The page header (back + avatar + status) is unchanged.
- Below the Plan card, instead of a full Server card with Change button, there's a small one-liner: `Server: US-East · United States (East)` (or whatever the subscription's server is).
- The line uses `text-xs text-text-secondary` styling — visually quiet, no card chrome.
- The Invoices section and Cancel subscription section render below as before.
- No Change button anywhere on this page (server changes happen in the AccountSwitcher).

Use `preview_eval` to confirm:
```js
(() => {
  // Find any rendered ServerCard chrome (chip + Server h2 + Change button)
  const possibleServerCard = [...document.querySelectorAll('h2')].find(h => h.textContent === 'Server');
  const allChangeBtns = [...document.querySelectorAll('button')].filter(b => b.textContent.trim() === 'Change');
  const hasReadOnlyServerLine = !!document.body.textContent.match(/Server:\s*[A-Z]/);
  return {
    serverCardHeading: !!possibleServerCard,
    changeButtonsOnPage: allChangeBtns.length,
    readOnlyServerLinePresent: hasReadOnlyServerLine,
  };
})()
```
Expected: `{ serverCardHeading: false, changeButtonsOnPage: 0, readOnlyServerLinePresent: true }`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/account/SubscriptionDetail.jsx
git commit -m "$(cat <<'EOF'
refactor(billing): drop ServerCard from SubscriptionDetail

Replaces the editable Server card with a one-line read-only fact
("Server: <Label> · <Region>") between the Plan card and Invoices
section. The Change-server affordance now lives in AccountSwitcher
(see preceding commit). Single edit path; the detail page surfaces
the server as reference info only. Resolves nav-server-change item 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Delete ServerCard.jsx

**Why:** After Task 2, `ServerCard.jsx` has no consumers anywhere in the codebase. Dead code rots; if a future feature needs the editable Server card back, git history has it.

**Files:**
- Delete: `src/pages/account/ServerCard.jsx`

- [ ] **Step 1: Verify no remaining consumers**

Run: `grep -rn "ServerCard" src/ 2>/dev/null`

Expected: no output (zero hits). If any file still imports `ServerCard`, return BLOCKED — do NOT delete the file. Investigate, fix the offending import (Task 2 may have missed something), and re-run.

- [ ] **Step 2: Delete the file**

Run: `git rm src/pages/account/ServerCard.jsx`

Expected output: `rm 'src/pages/account/ServerCard.jsx'` (the file is staged for deletion).

- [ ] **Step 3: Verify the deletion is clean**

Run: `git status`

Expected: `src/pages/account/ServerCard.jsx` shows as `deleted:` under "Changes to be committed". No other staged changes.

If there are uncommitted modifications staged from previous tasks, run `git diff --cached` and confirm only the deletion is staged.

- [ ] **Step 4: Commit**

```bash
git commit -m "$(cat <<'EOF'
chore(billing): delete orphaned ServerCard.jsx

ServerCard.jsx has no remaining consumers after the previous two
commits moved the affordance into AccountSwitcher and replaced the
SubscriptionDetail render with a read-only line. Deleting the file
to keep src/pages/account/ free of dead code. Resolves
nav-server-change item 2 (cleanup).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 5: Final grep verification**

Run: `grep -rn "ServerCard" src/ 2>/dev/null`

Expected: no output.

Run: `ls src/pages/account/ | grep -i server`

Expected: only `ChangeServerModal.jsx` (the modal — still in use).

---

## Final verification

- [ ] **Step 1: Full sweep at mobile + desktop**

With the dev server running, sweep:

**Desktop (1280×800):**
- Open the AccountSwitcher dropdown via the sidebar trigger. Server row appears below the active-account row. Click it → modal opens. Pick a different server, save. Reopen the dropdown — server row reflects the new label.
- Navigate to `/account/subscriptions/sub_001` (or any subscription). Page shows: header + Plan card + small `Server: …` read-only line + Invoices + Cancel section. No Change button anywhere.
- Navigate to `/account/billing`. All three sections (Payment method, Subscriptions, Billing history) render correctly — no regression from the previous billing-structure changes.

**Mobile (375×812):**
- Open the hamburger drawer → AccountSwitcher sheet opens via the active-account row in the drawer's "Instagram accounts" section. Sheet shows the server row in comfy density. Tap → bottom-aligned modal opens.
- Navigate to `/account/subscriptions/<id>`. Same read-only line + Invoices + Cancel layout.

- [ ] **Step 2: Check git log**

```bash
git log --oneline -5
```

Expected: three new commits on top of the spec commit (`1bfad1f`):
- `feat(nav): server row in AccountSwitcher panel`
- `refactor(billing): drop ServerCard from SubscriptionDetail`
- `chore(billing): delete orphaned ServerCard.jsx`

---

## Notes for the implementer

- The codebase has no automated test suite. Verification is manual via the preview MCP server. Use `preview_inspect` over `preview_screenshot` for verifying className changes — screenshots are unreliable for exact pixel checks.
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
- `ChangeServerModal` is rendered via `createPortal(..., document.body)` to escape any transformed-ancestor containing block — same approach the sheet variant uses, same rationale (CSS spec: any element with non-none `transform` becomes a containing block for fixed-positioned descendants).
- The active subscription is resolved via `subscriptions.find((s) => s.accountId === active.id)`. V1 mocks have a 1:1 mapping between accounts and subscriptions; if a future state breaks that invariant (e.g. a connected account with no subscription yet during onboarding), the server row simply doesn't render — by design.
- Don't reorder the rows in `PanelContent` — server row must come AFTER the active account row and BEFORE the divider to "others." The visual association with the active account is the whole point.
- Don't add the server row to the closed (trigger) row of `AccountSwitcher` — explicitly out of scope per spec.
- `ServerCard.jsx` deletion is the final step. Do NOT delete it before Task 2 lands — Task 2 still needs to edit `SubscriptionDetail` to drop the import, and accidentally deleting `ServerCard.jsx` first would leave the detail page broken.
