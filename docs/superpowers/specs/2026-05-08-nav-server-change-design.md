# Nav Server-Change — Design Spec

**Date:** 2026-05-08
**Goal:** Move the per-subscription server-change affordance from the Settings/Subscription-detail page into the `AccountSwitcher` panel, where it belongs alongside the account it actually applies to. The detail page keeps the server name visible as a read-only fact.

**Architecture:** Two-file refactor. `src/components/AccountSwitcher.jsx` gains a server row inside the active-account block of its shared `PanelContent` helper, plus renders the existing `ChangeServerModal` and wires its open state. `src/pages/account/SubscriptionDetail.jsx` drops its `ServerCard` import + render and replaces them with a one-line read-only `<p>`. `src/pages/account/ServerCard.jsx` becomes orphaned and is deleted.

**Tech stack:** React, Tailwind, Lucide. No new dependencies. Reuses the existing `useSubscriptions` store (`subscriptions`, `setServer`) and the existing `ChangeServerModal` component unchanged.

**Source brainstorm:** 2026-05-08 — item #18 from the original 18-item batch.

---

## Item 1 — Server row in the AccountSwitcher panel's active block

**Why:** Today the server is edited from a `ServerCard` buried inside `SubscriptionDetail` (`/account/subscriptions/:id`). That page exists for plan + invoices + cancel — server routing is tangentially related to billing but actually concerns *which IP regions Kicksta uses for the active IG account*. The natural home is alongside the account picker. Putting the row inside the active-account block of the AccountSwitcher panel reads as "this server belongs to this account" — visually and conceptually correct.

**Files:**
- Modify: `src/components/AccountSwitcher.jsx`

### Subscription + server resolution

The active account's server is read by:

```js
import { useSubscriptions } from '@/stores/useSubscriptions'
import { findServer } from '@/mocks/servers'

const subscriptions = useSubscriptions((s) => s.subscriptions)
// inside PanelContent or its caller:
const activeSubscription = subscriptions.find((s) => s.accountId === active.id)
const server = activeSubscription ? findServer(activeSubscription.server) : null
```

These reads happen in the parent `AccountSwitcher` component (which already reads `accounts` and `activeId` from `useAccounts`) and the resolved `subscription` + `server` are passed into `PanelContent` as new props.

### `PanelContent` props additions

`PanelContent` is the shared helper used by both the dropdown and sheet variants. Its current signature:

```jsx
function PanelContent({ active, others, onPick, onAddAccountClick, density = 'compact' })
```

New signature:

```jsx
function PanelContent({
  active,
  others,
  onPick,
  onAddAccountClick,
  density = 'compact',
  subscription,        // Subscription record matched to `active.id`, or null
  server,              // findServer(subscription.server) result, or null
  onChangeServerClick, // () => void — opens the ChangeServerModal at the parent
})
```

`subscription`, `server`, and `onChangeServerClick` are forwarded from `AccountSwitcher` (which holds the modal-open state).

### Server row JSX

Render the server row immediately after the active-account row in the active block, BEFORE the divider that separates the active block from the "others" list. Reuses the same `rowClasses` density rule the account rows use, with these specifics:

- **Whole row clickable** — `<button>` that calls `onChangeServerClick()`.
- **Leading icon** — `Globe` from Lucide in a small tinted circle on the left (40×40 at `density === 'comfy'`, 32×32 at `density === 'compact'`), `bg-blue-tint` background + `text-blue-text` icon.
- **Primary text** — `text-sm font-medium text-text-primary`, content: `Server: ${server.label}`.
- **Subline** — `text-xs text-text-muted`, content: `${server.region}`.
- **Trailing chevron** — `ChevronRight` (h-3.5 w-3.5) on the far right, `text-text-muted`. Indicates the row is an affordance.
- **Hover** — same `hover:bg-bg` recipe as account rows.

**Final JSX block** rendered inside `PanelContent`, right after the active-account row's closing `</div>` and before the existing `{others.length > 0 && (…)}` block:

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

The avatar size in the existing account row is `h-8 w-8` regardless of density — but the server icon is a smaller tinted-circle indicator, not an avatar. Going with `h-8 w-8` at comfy and `h-7 w-7` at compact keeps proportions sensible without shouting.

### `AccountSwitcher` modal wiring

`AccountSwitcher.jsx` needs to manage `ChangeServerModal`'s open state at the parent level so the modal renders outside the dropdown/sheet's stacking context:

- Add `const [serverModalOpen, setServerModalOpen] = useState(false)` near the existing `open` / `mounted` state.
- Pass `onChangeServerClick={() => setServerModalOpen(true)}` into both `<PanelContent>` calls (dropdown variant + sheet variant).
- Render `<ChangeServerModal open={serverModalOpen} subscription={activeSubscription} onClose={() => setServerModalOpen(false)} />` once at the top level of the `AccountSwitcher` component (outside the panel JSX, sibling to the dropdown and sheet branches).
- Import `ChangeServerModal` from `@/pages/account/ChangeServerModal`.
- Import `Globe` and `ChevronRight` from lucide-react (add to the existing import — `AlertTriangle, Check, ChevronRight, ChevronsUpDown, Globe, Plus, X`).

**Closing the dropdown when modal opens:** when the user taps the server row in the dropdown variant, both the dropdown and the modal would compete for "open" state. Setting `setOpen(false)` alongside `setServerModalOpen(true)` in the `onChangeServerClick` handler closes the dropdown first, leaving only the modal visible. Apply this in BOTH variants for consistency:

```js
onChangeServerClick={() => {
  setOpen(false)
  setServerModalOpen(true)
}}
```

The sheet variant's `setOpen(false)` also dismisses the bottom sheet via the existing animation; the modal opens above what's left.

### Imports added at the top of `AccountSwitcher.jsx`

Existing imports start with:

```jsx
import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, ChevronsUpDown, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccounts } from '@/stores/useAccounts'
```

After change:

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

(Lucide import gains `ChevronRight` and `Globe` alphabetically; three new lines added below `useAccounts`.)

**Acceptance:**
- Open the AccountSwitcher (desktop dropdown OR mobile sheet). Below the active account row sits a `Server: <Label>` row with `<Region>` subline and a chevron on the right.
- Tapping the server row dismisses the panel and opens `ChangeServerModal`.
- Picking a different server in the modal saves to the active account's subscription via `setServer`.
- Reopening the panel reflects the new server label.
- Other accounts' rows in the panel are NOT affected — the server line is tied to the active account only.

---

## Item 2 — Replace `ServerCard` on the detail page with a read-only line

**Why:** With the editable affordance moved to AccountSwitcher, the detail page has no business showing a Change button. But users landing on the detail page should still see which server the subscription routes through, as a reference fact alongside Plan and Invoices.

**Files:**
- Modify: `src/pages/account/SubscriptionDetail.jsx`
- Delete: `src/pages/account/ServerCard.jsx`

### `SubscriptionDetail.jsx`

Remove the `ServerCard` import and render. Replace with a one-line read-only `<p>` using `findServer`.

**Imports change:** remove `import ServerCard from './ServerCard'`. Add `import { findServer } from '@/mocks/servers'` (alongside the existing imports — match the import group placement).

**Render block change:** the current section reads:

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

`findServer` already handles unknown server IDs (returns a fallback in `mocks/servers.js`). Two `findServer(sub.server)` calls in one render is fine — `findServer` is a pure synchronous lookup against a small array; not worth memoizing.

**Result:** the detail page reads top to bottom: header (back + avatar + status pill) → Plan card → small server line → Invoices section → Cancel section. The server line is visually quiet — `text-xs`, no card chrome, no chip — because it's a fact, not an action.

### Delete `ServerCard.jsx`

After Item 2's import + render change, `ServerCard.jsx` has no consumers. Delete it:

```bash
rm src/pages/account/ServerCard.jsx
```

If a future feature needs the editable Server card back, git history has it. The 35-line component would be straightforward to recreate.

**Acceptance:**
- `/account/subscriptions/:id` no longer shows a "Server" card with a Change button.
- A `Server: <Label> · <Region>` line is visible between the Plan card and the Invoices section.
- `src/pages/account/ServerCard.jsx` no longer exists.
- No imports of `ServerCard` remain anywhere in the codebase.

---

## Out of scope

- The `ChangeServerModal` itself — kept as-is, no UI changes.
- Server display in the closed (trigger) row of the AccountSwitcher — explicitly rejected during brainstorm; trigger stays clean.
- Multi-server-per-subscription — V1 still has one server per subscription.
- Server change history / audit trail — out of scope.
- Showing server in the AccountSwitcher row of OTHER accounts (the ones the user can switch into). The server row is tied to the active account only; switching reveals the new server for the new active account on next open.

---

## Implementation notes for the plan

- Implement Item 1 first (additive — server row appears, old ServerCard still works on detail page). Then Item 2 (remove the old surface).
- After Item 1, manually verify in browser at desktop (dropdown variant) and mobile (sheet variant) that the server row renders, opens the modal, and saves correctly.
- After Item 2, manually verify the detail page no longer has a ServerCard, the read-only line renders correctly, and grepping the codebase for `ServerCard` returns zero hits.
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
- Don't lift the server-row JSX to a shared component — it's only used inside `PanelContent`. Inline JSX is the right choice here.
- The codebase has no automated test suite. Verification is exclusively visual via the preview MCP server.
- After deletion, run `git status` to confirm `ServerCard.jsx` is staged as deleted (not just untracked).
