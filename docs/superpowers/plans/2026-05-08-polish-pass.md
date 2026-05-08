# Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship seven small fixes across Targeting, Engagement, and Settings as one batched commit set.

**Architecture:** Pure data/copy/className changes plus two trivial structural tweaks (drop a `<p>` block, add a leading icon). No new components, no new files, no architectural changes. Each task is scoped to a single file or a tightly-related pair, one commit per task.

**Tech Stack:** React 19, Tailwind v4, Lucide React, Vite. Pravatar (`https://i.pravatar.cc/80?u=<seed>`) as the deterministic mock-avatar source. The project has no automated test suite; verification is manual against the running dev server using the Claude Preview MCP tools (`preview_start`, `preview_resize`, `preview_screenshot`, `preview_inspect`) at mobile (375×812) and desktop (1280×800) widths.

**Spec:** `docs/superpowers/specs/2026-05-08-polish-pass-design.md`

---

## File Map

| File | Touched by | Responsibility |
|---|---|---|
| `src/mocks/targets.js` | Task 1 | Add `profilePic` field to all account-type rows. |
| `src/mocks/accounts.js` | Task 1 | Set `profilePic` to Pravatar URLs for all three accounts. |
| `src/pages/targeting/TargetList.jsx` | Task 2 | Column-header label + alignment. |
| `src/pages/targeting/WhitelistModal.jsx` | Task 3 | Drop `mt-4` above input row. |
| `src/pages/targeting/BlacklistModal.jsx` | Task 3 | Drop `mt-4` above input row. |
| `src/pages/engagement/CloseFriendsCard.jsx` | Task 4 | CFA copy strings + drop the count `<p>` from `CloseFriendsState` helper. |
| `src/pages/engagement/CloseFriendsProgress.jsx` | Task 5 | Add leading Plus/Minus icon next to the activity line. |
| `src/pages/account/InvoicesTable.jsx` | Task 6 | Download icon color: blue → muted. |

Tasks are ordered by surface (mocks → Targeting → Engagement → Settings) but are independent — they can be implemented in any order without conflict.

---

## Task 1: Pravatar everywhere — mock data

**Why:** Today every account-type target falls back to a single-letter monogram because `mocks/targets.js` has no `profilePic` field. Two of three accounts in `mocks/accounts.js` are also `null`. Move all three accounts and all account-type targets to deterministic Pravatar URLs.

**Files:**
- Modify: `src/mocks/targets.js`
- Modify: `src/mocks/accounts.js`

- [ ] **Step 1: Add `profilePic` to every account-type target in `src/mocks/targets.js`**

Open `src/mocks/targets.js`. For each row where `type: 'account'`, add a `profilePic` field with a Pravatar URL using the row's `value` (without the leading `@`) as the seed.

Final file content (replace fully):

```js
// Seeded targets for the dashboard. Each row now carries either
// `followers` (account) or `posts` (hashtag) for the target-source
// context. Follow-back counts are tuned so the rate reads cleanly
// across healthy / average / needs-attention bands.
//
// Account-type rows carry a deterministic Pravatar URL so the dashboard
// renders real face thumbnails for mock data. Pravatar is third-party
// and only used in V1 mocks — production swaps in real IG profile pics.
export const mockTargets = [
  {
    id: 't_001',
    type: 'account',
    value: '@fitness.inspo',
    status: 'active',
    followers: 128_400,
    followedCount: 842,
    followBackCount: 101, // 12%
    addedAt: '2026-03-15T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=fitness.inspo',
  },
  {
    id: 't_002',
    type: 'hashtag',
    value: '#homeworkouts',
    status: 'active',
    posts: 14_200_000,
    followedCount: 614,
    followBackCount: 55, // 9%
    addedAt: '2026-03-18T00:00:00Z',
  },
  {
    id: 't_003',
    type: 'account',
    value: '@yoga.daily',
    status: 'depleted',
    followers: 210_000,
    followedCount: 1200,
    followBackCount: 132, // 11%
    addedAt: '2026-03-10T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=yoga.daily',
  },
  {
    id: 't_004',
    type: 'account',
    value: '@cleanfoodcrush',
    status: 'paused',
    followers: 71_000,
    followedCount: 320,
    followBackCount: 13, // 4%
    addedAt: '2026-03-25T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=cleanfoodcrush',
  },
  {
    id: 't_005',
    type: 'hashtag',
    value: '#mealprep',
    status: 'active',
    posts: 18_700_000,
    followedCount: 488,
    followBackCount: 49, // 10%
    addedAt: '2026-03-22T00:00:00Z',
  },
  {
    id: 't_006',
    type: 'account',
    value: '@protein.pete',
    status: 'queued',
    followers: 6_100,
    followedCount: 0,
    followBackCount: 0,
    addedAt: '2026-03-20T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=protein.pete',
  },
  {
    id: 't_007',
    type: 'hashtag',
    value: '#glutenfree',
    status: 'active',
    posts: 22_100_000,
    followedCount: 430,
    followBackCount: 34, // 8%
    addedAt: '2026-03-24T00:00:00Z',
  },
  {
    id: 't_008',
    type: 'account',
    value: '@macro.melissa',
    status: 'active',
    followers: 9_400,
    followedCount: 380,
    followBackCount: 53, // 14%
    addedAt: '2026-03-26T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=macro.melissa',
  },
  {
    id: 't_009',
    type: 'hashtag',
    value: '#weightloss',
    status: 'active',
    posts: 88_900_000,
    followedCount: 710,
    followBackCount: 64, // 9%
    addedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: 't_010',
    type: 'account',
    value: '@keto.kevin',
    status: 'depleted',
    followers: 48_300,
    followedCount: 980,
    followBackCount: 78, // 8%
    addedAt: '2026-03-08T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=keto.kevin',
  },
  // Two archived seed entries so the Archived bucket isn't empty
  // on first load — demonstrates the restore action.
  {
    id: 't_011',
    type: 'account',
    value: '@stale.influencer',
    status: 'archived',
    followers: 12_400,
    followedCount: 410,
    followBackCount: 22, // 5%
    addedAt: '2026-02-12T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=stale.influencer',
  },
  {
    id: 't_012',
    type: 'hashtag',
    value: '#cardiokings',
    status: 'archived',
    posts: 89_000,
    followedCount: 320,
    followBackCount: 17, // 5%
    addedAt: '2026-02-22T00:00:00Z',
  },
]
```

Hashtag rows (t_002, t_005, t_007, t_009, t_012) intentionally have **no** `profilePic` — they keep the Hash icon.

- [ ] **Step 2: Update `src/mocks/accounts.js` to use Pravatar for all three accounts**

Open `src/mocks/accounts.js`. Replace the `mockAccounts` array entries' `profilePic` values with Pravatar URLs (seeded by `username`). The leading comment is updated to mention the Pravatar source.

Final file content (replace fully):

```js
// Connected Instagram accounts for the sidebar AccountSwitcher. V1: the
// switcher only changes its own UI state — it doesn't yet propagate the
// active account to the rest of the dashboard (that's a follow-up once
// we introduce a shared accounts store).
//
// Profile pics are deterministic Pravatar URLs (seeded by username).
// Pravatar is third-party and only used in V1 mocks — production swaps
// in real IG profile pics.
export const mockAccounts = [
  {
    id: 'acc_001',
    username: 'alexjohnson.co',
    fullName: 'Alex Johnson — Fitness & Nutrition Coach',
    profilePic: 'https://i.pravatar.cc/80?u=alexjohnson.co',
    followers: 4832,
    plan: 'advanced',
    connectionState: 'connected',
  },
  {
    id: 'acc_002',
    username: 'alex.personal',
    fullName: 'Alex Johnson',
    profilePic: 'https://i.pravatar.cc/80?u=alex.personal',
    followers: 234,
    plan: 'growth',
    // Deliberately disconnected so the dropdown demonstrates how a
    // non-green status dot looks in context.
    connectionState: 'disconnected',
  },
  {
    id: 'acc_003',
    username: 'fitclub.brand',
    fullName: 'FitClub Community',
    profilePic: 'https://i.pravatar.cc/80?u=fitclub.brand',
    followers: 12100,
    plan: 'advanced',
    connectionState: 'connected',
  },
]

// Which account is "selected" on first load. Surfaces flow from
// `useAccounts.activeAccount` to every component that needs IG
// connection state — Overview banner, the sidebar AccountSwitcher,
// the MobileNavDrawer's account switcher, SystemStatus, etc.
export const defaultActiveAccountId = 'acc_001'
```

- [ ] **Step 3: Manual verification — Targeting page**

Navigate the dev server to `http://localhost:5173/targeting` (mobile preset, 375×812). Verify:
- Account-type rows (`@fitness.inspo`, `@yoga.daily`, `@cleanfoodcrush`, `@protein.pete`, `@macro.melissa`, `@keto.kevin`) render real face thumbnails (Pravatar).
- Hashtag rows (`#homeworkouts`, `#mealprep`, `#glutenfree`, `#weightloss`) keep the `Hash` icon (no thumbnail).

Switch to Archived filter; verify `@stale.influencer` shows a thumbnail and `#cardiokings` shows the Hash icon.

- [ ] **Step 4: Manual verification — Account switcher + Subscriptions**

On desktop (1280×800), open the sidebar AccountSwitcher dropdown. Verify all three accounts (`@alexjohnson.co`, `@alex.personal`, `@fitclub.brand`) show real face thumbnails.

Navigate to `http://localhost:5173/account/billing`. Verify the three subscription cards each show a real face thumbnail (not a monogram).

Open the mobile drawer's AccountSwitcher sheet (mobile preset, hamburger → Switch account). Verify all three accounts show thumbnails.

- [ ] **Step 5: Commit**

```bash
git add src/mocks/targets.js src/mocks/accounts.js
git commit -m "feat(mocks): switch all account avatars to Pravatar

Seven account-type targets and three connected accounts now carry
deterministic Pravatar URLs (seeded by username). Hashtag targets keep
the Hash icon. Resolves polish-pass items 1 and 7."
```

---

## Task 2: TargetList — Follow-back column header

**Why:** Today the header reads `Follow-backs · %` with `pr-12` over the chevron column. The `· %` repeats info from the numbers below, and the right edge floats too far right. Spec calls for `Follow-backs` only, with `pr-6` to align the header's right edge with the right edge of the number column.

**Files:**
- Modify: `src/pages/targeting/TargetList.jsx:452`

- [ ] **Step 1: Update the column header**

Open `src/pages/targeting/TargetList.jsx`. Find the header row (line ~450–453):

```jsx
<div className="flex items-center justify-between px-4 pt-4 pb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
  <span>Name</span>
  <span className="pr-12">Follow-backs · %</span>
</div>
```

Replace the second `<span>` so the line reads:

```jsx
  <span className="pr-6">Follow-backs</span>
```

- [ ] **Step 2: Verify alignment in browser**

Run the preview at desktop (1280×800), navigate to `/targeting`. Inspect the header span and the number column's right-edge bounding box for one row using `preview_inspect`:

```js
preview_inspect('section.mt-4.overflow-hidden header span:nth-child(2)')
preview_inspect('.flex.shrink-0.items-baseline.gap-1', styles=['right'])
```

The header span's right edge should be visually within ~2px of the number group's right edge. If the header sits noticeably left or right of the numbers, nudge `pr-6` to `pr-5` or `pr-7` and re-verify. Repeat at mobile preset (375×812).

- [ ] **Step 3: Commit**

```bash
git add src/pages/targeting/TargetList.jsx
git commit -m "fix(targeting): right-align Follow-backs column header

Drops the '· %' suffix (the numbers below already carry count·rate)
and changes pr-12 to pr-6 so the header's right edge lines up with
the right edge of the number column. Resolves polish-pass item 2."
```

---

## Task 3: Whitelist + Blacklist modals — drop `mt-4` above input

**Why:** Both modals wrap the input row in `<div className="relative mt-4 flex gap-2">`. The `mt-4` (16px) creates a visible empty band between the modal header and the input — `AddTargetSheet` (the canonical recipe) has no such gap. Drop it on both.

**Files:**
- Modify: `src/pages/targeting/WhitelistModal.jsx:820`
- Modify: `src/pages/targeting/BlacklistModal.jsx` (matching line — find by string)

- [ ] **Step 1: Patch `WhitelistModal.jsx`**

Open `src/pages/targeting/WhitelistModal.jsx`. Find the input wrapper:

```jsx
<div className="relative mt-4 flex gap-2">
```

Replace with:

```jsx
<div className="relative flex gap-2">
```

- [ ] **Step 2: Patch `BlacklistModal.jsx`**

Open `src/pages/targeting/BlacklistModal.jsx`. Search for `relative mt-4 flex gap-2` and replace identically:

Before:
```jsx
<div className="relative mt-4 flex gap-2">
```

After:
```jsx
<div className="relative flex gap-2">
```

If the className differs slightly (e.g. extra modifier), preserve all other classes; only drop the `mt-4` token.

- [ ] **Step 3: Manual verification**

In the dev server, navigate to `/targeting` (mobile preset). Open the Whitelist modal (Settings tab → Whitelist → Edit). Verify the input row sits flush below the modal header (the body's `py-4` is the only spacing). Repeat for Blacklist.

Compare directly to AddTargetSheet (`+` button on the Targeting page) — the input position relative to the header should match.

- [ ] **Step 4: Commit**

```bash
git add src/pages/targeting/WhitelistModal.jsx src/pages/targeting/BlacklistModal.jsx
git commit -m "fix(targeting): drop mt-4 above whitelist/blacklist inputs

The 16px gap above the input didn't match AddTargetSheet (the canonical
popup recipe). Resolves polish-pass item 3."
```

---

## Task 4: CloseFriendsCard — copy + drop the count line

**Why:** Two coordinated changes in the same file. (a) Lock the new copy strings (subtitle, tooltip, mode-button label). (b) Drop the `Currently {count} in close friends` `<p>` from the inner `CloseFriendsState` helper — the count is no longer surfaced.

**Files:**
- Modify: `src/pages/engagement/CloseFriendsCard.jsx`

- [ ] **Step 1: Update the CFA mode labels (top of file, `CF_MODES` constant)**

Open `src/pages/engagement/CloseFriendsCard.jsx`. Find:

```js
const CF_MODES = [
  {
    value: 'add',
    label: 'Add new followers',
    icon: Plus,
  },
  {
    value: 'remove',
    label: 'Remove unfollowers',
    icon: Minus,
  },
]
```

Replace with:

```js
const CF_MODES = [
  {
    value: 'add',
    label: 'Add followers',
    icon: Plus,
  },
  {
    value: 'remove',
    label: 'Remove unfollowers',
    icon: Minus,
  },
]
```

(Only the `add` label changes; `remove` is already correct.)

- [ ] **Step 2: Update the subtitle and tooltip strings (card header)**

Find the card header block — the `<InfoTooltip>` and the subtitle paragraph:

```jsx
<InfoTooltip text="Automatically manage your Close Friends list as followers come and go." />
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
              Automatically manage your Close Friends list.
            </p>
```

Replace with:

```jsx
<InfoTooltip text="Adds your followers to your Close Friends list, and removes anyone who unfollows." />
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
              Add followers to Close Friends; remove ex-followers.
            </p>
```

- [ ] **Step 3: Drop the `Currently {count}…` line from `CloseFriendsState` helper**

Find the `CloseFriendsState` helper (bottom of the file). The current body opens with:

```jsx
function CloseFriendsState() {
  const { count, recent } = mockCloseFriendsState
  const items = recent.slice(0, 5)
  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="flex items-center gap-1.5 text-xs text-text-secondary">
        <Star className="h-3.5 w-3.5 text-purple-text" aria-hidden="true" />
        Currently {count} in close friends
      </p>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Recent
      </p>
```

Replace with:

```jsx
function CloseFriendsState() {
  const { recent } = mockCloseFriendsState
  const items = recent.slice(0, 5)
  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Recent
      </p>
```

Three changes here:
- `const { count, recent } = …` → `const { recent } = …` (drop `count`).
- The entire `<p>` containing the Star + "Currently {count} in close friends" is removed.
- The remaining `<p className="mt-3 …">Recent</p>` loses its `mt-3` (it was spacing relative to the deleted line; now it's the first child after the `border-t pt-3`, which already gives the gap).

The `Star` import at the top of the file stays — it's still used in the card header chip (`<CardChip color="purple" icon={Star} />`).

- [ ] **Step 4: Manual verification**

Run the dev server, navigate to `/engagement` (mobile preset). Verify:
- Card subtitle reads `Add followers to Close Friends; remove ex-followers.`
- Tooltip on the (i) icon reads `Adds your followers to your Close Friends list, and removes anyone who unfollows.`
- The Add-mode button reads `Add followers` (was "Add new followers"). Remove-mode unchanged.
- When the toggle is on (Advanced plan in mocks), the activity area no longer shows a "Currently … in close friends" line. The "Recent" section header still appears followed by its activity list.

- [ ] **Step 5: Commit**

```bash
git add src/pages/engagement/CloseFriendsCard.jsx
git commit -m "fix(engagement): tighten CFA copy + drop the count line

Subtitle, tooltip, and Add-mode label rewritten to accurately describe
what the engine does (adds your followers; removes ex-followers). The
'Currently N in close friends' line is dropped — the count is no longer
surfaced. Resolves polish-pass items 4 and 5a."
```

---

## Task 5: CloseFriendsProgress — add leading mode icon

**Why:** The "Adding @taylor.fit…" line below the progress bar lacks a leading mode icon, so the running mode (add vs remove) doesn't read at a glance from the progress section alone. Add a green Plus when adding, a muted Minus when removing.

**Files:**
- Modify: `src/pages/engagement/CloseFriendsProgress.jsx`

- [ ] **Step 1: Import `Plus` and `Minus` from `lucide-react`**

Open `src/pages/engagement/CloseFriendsProgress.jsx`. The top of the file currently reads:

```jsx
import { useEffect, useState } from 'react'
import {
  mockCloseFriendsProgress,
  mockCloseFriendsRecentHandles,
} from '@/mocks/growthConfig'
```

Add the Lucide import below the React one:

```jsx
import { useEffect, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import {
  mockCloseFriendsProgress,
  mockCloseFriendsRecentHandles,
} from '@/mocks/growthConfig'
```

- [ ] **Step 2: Add the leading icon to the activity line**

Find the `<p>` block at the bottom of the component (lines ~58–62):

```jsx
{enabled && (
  <p className="mt-2 flex items-center gap-2 text-xs text-text-secondary animate-pulse">
    {verb} {handle}…
  </p>
)}
```

Replace with:

```jsx
{enabled && (
  <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary animate-pulse">
    {mode === 'remove' ? (
      <Minus className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
    ) : (
      <Plus className="h-3.5 w-3.5 shrink-0 text-green-text" aria-hidden="true" />
    )}
    {verb} {handle}…
  </p>
)}
```

Two changes: `gap-2` → `gap-1.5` (tighter so the icon reads as a leading bullet, not a separate column), and the conditional icon prefix.

- [ ] **Step 3: Manual verification**

Navigate to `/engagement`. With CFA toggle ON in `add` mode (default), verify the line below the progress bar reads with a green `+` icon followed by `Adding @<handle>…`. Click the Remove-mode segmented control button; verify the icon changes to a muted `−` and the verb to `Removing`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/engagement/CloseFriendsProgress.jsx
git commit -m "fix(engagement): leading mode icon on CFA activity line

Green Plus for add mode, muted Minus for remove mode. Tightens gap-2
to gap-1.5 so the icon reads as a leading bullet. Resolves
polish-pass item 5b."
```

---

## Task 6: InvoicesTable — Download icon color

**Why:** The Download invoice button uses `text-blue-text`, drawing more attention than a passive utility deserves. Polish-pass icon-role rule: passive row actions are `text-text-secondary` with hover→`text-text-primary`.

**Files:**
- Modify: `src/pages/account/InvoicesTable.jsx:1445` (the `DownloadButton` component)

- [ ] **Step 1: Patch the `DownloadButton` className**

Open `src/pages/account/InvoicesTable.jsx`. Find the `DownloadButton` component (top of file, around line ~38–48):

```jsx
function DownloadButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Download invoice"
      title="Download invoice"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-blue-text hover:bg-bg"
    >
      <Download className="h-4 w-4" />
    </button>
  )
}
```

Change the className: replace `text-blue-text` with `text-text-secondary hover:text-text-primary`. The `hover:bg-bg` is preserved.

```jsx
function DownloadButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Download invoice"
      title="Download invoice"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-bg hover:text-text-primary"
    >
      <Download className="h-4 w-4" />
    </button>
  )
}
```

- [ ] **Step 2: Manual verification**

Navigate to `/account/billing` (desktop preset, 1280×800). Scroll to the Billing history table. Verify the Download icons in each row render in the muted secondary text color (~grey), not blue. Hover one — verify it brightens to primary text color and the background fills in `bg-bg`. Repeat at mobile preset; the mobile branch uses the same `DownloadButton` so the change applies there too.

- [ ] **Step 3: Commit**

```bash
git add src/pages/account/InvoicesTable.jsx
git commit -m "fix(billing): demote download invoice icon to muted

The blue download icon read as a primary action; it's a passive utility.
Move to text-secondary with hover→text-primary, matching the polish-pass
icon-role rule for row-level passive actions. Resolves polish-pass item 6."
```

---

## Final verification

- [ ] **Step 1: Full visual sweep**

With the dev server running, sweep all five surfaces at both mobile (375×812) and desktop (1280×800):

- `/targeting` — account-type rows show Pravatar thumbnails; hashtag rows show Hash icons; column header reads `Follow-backs` aligned to the right of the number column.
- `/targeting` → Whitelist modal — input sits flush below the header (no `mt-4` band).
- `/targeting` → Blacklist modal — same.
- `/engagement` → CFA card — subtitle, tooltip, Add-mode label match locked copy; activity line shows green `+` (add mode) or muted `−` (remove mode); no "Currently N in close friends" line.
- `/account/billing` — three subscription cards show Pravatar thumbnails; Download invoice icons are muted, not blue.
- AccountSwitcher (desktop sidebar dropdown + mobile drawer sheet) — all three accounts show Pravatar thumbnails.

- [ ] **Step 2: Check git log**

Run: `git log --oneline -10`

Expected: six new commits on top of the pre-task HEAD, in the order Tasks 1 through 6 were executed.

---

## Notes for the implementer

- Pravatar requires network access at runtime; if the preview server is offline-only, thumbnails will fall back to broken-image icons. Do not invent local files as a workaround — the spec calls for Pravatar.
- The codebase has no automated test suite. Verification is exclusively visual via the preview MCP tools. If a step's visual outcome is ambiguous, prefer `preview_inspect` with explicit CSS-property reads over screenshots (per the preview tool's own guidance — screenshots are unreliable for colors and exact pixel alignment).
- Tailwind class order convention in this repo (per `CLAUDE.md`): `layout → spacing → sizing → color → typography → border → shadow → state`. Maintain this when editing existing classNames.
- After Task 4, do NOT remove the `Star` import from `CloseFriendsCard.jsx` — it's still used in the card header (`<CardChip color="purple" icon={Star} />`). The CFA mode-button uses `Plus`/`Minus` (already imported).
