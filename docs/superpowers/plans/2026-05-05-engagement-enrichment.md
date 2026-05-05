# Engagement Enrichment Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `/engagement` feel substantive — add a stats hero card at the top and enrich the existing Welcome DM and Close Friends cards with recent-activity sublists.

**Architecture:** Three new mock files, one new component (`EngagementStatsCard`), and modifications to two existing cards plus the page shell. No engine wiring — all values are mocks anchored to `NOW = new Date()` so the page always reads "fresh."

**Tech Stack:** React 19, Tailwind 4, Lucide React, Zustand 5. **No unit-test framework** — verification is `eslint` + manual visual inspection.

---

### Reference spec

`docs/superpowers/specs/2026-05-05-engagement-enrichment-design.md`

### File map

| File | Status | Responsibility |
|---|---|---|
| `src/mocks/engagementStats.js` | NEW | DMs sent / open rate / Close Friends mock metrics |
| `src/mocks/welcomeDmHistory.js` | NEW | Mock recent DMs list |
| `src/mocks/closeFriendsState.js` | NEW | Mock current count + recent activity log |
| `src/pages/engagement/EngagementStatsCard.jsx` | NEW | Stats hero card with three metric tiles |
| `src/pages/engagement/index.jsx` | MODIFY | Mount `EngagementStatsCard` at the top of the card stack |
| `src/pages/engagement/WelcomeDmCard.jsx` | MODIFY | Recent-DMs sublist (rendered only when `showPreview`) |
| `src/pages/engagement/CloseFriendsCard.jsx` | MODIFY | Count line + recent add/remove sublist (rendered only when `showCfControls`) |

### Verification command

After every task:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src --ext .js,.jsx
```

If `node` is unavailable, the engineer reviews the diff visually and notes the skip.

---

## Task 1: `mockEngagementStats` mock

**Files:**
- Create: `src/mocks/engagementStats.js`

- [ ] **Step 1: Create the mock file**

Create `src/mocks/engagementStats.js` with this exact content:

```js
// Aggregate engagement metrics for the stats hero on /engagement.
// Static — no derivation from other mock files. When the engine wires
// up, this becomes a server-driven response.
//
// `current` is the value to display; `delta` is the change vs the
// previous comparable period (this-week vs last-week). Positive
// numbers render with ↑ in green; negative with ↓ in red.
export const mockEngagementStats = {
  dmsSent: { current: 47, delta: 15 },
  dmOpenRate: { current: 68, delta: 4 },
  closeFriends: { current: 23, delta: 5 },
}
```

- [ ] **Step 2: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/mocks/engagementStats.js
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/mocks/engagementStats.js && git commit -m "feat(mocks): add engagement stats hero metrics

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `mockWelcomeDmHistory` mock

**Files:**
- Create: `src/mocks/welcomeDmHistory.js`

- [ ] **Step 1: Create the mock file**

Create `src/mocks/welcomeDmHistory.js` with this exact content:

```js
// Recent welcome DMs sent, surfaced on /engagement under the Welcome
// DM card (only when the toggle is on and the user is on Advanced).
//
// Anchors to NOW so the demo always reads "fresh" — same pattern as
// src/mocks/activity.js and src/mocks/targetInteractions.js.
const NOW = new Date()
const hoursAgo = (h) => new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString()

export const mockWelcomeDmHistory = [
  { id: 'wdm_1', username: '@yoga.ashley', createdAt: hoursAgo(1) },
  { id: 'wdm_2', username: '@plantbased.priya', createdAt: hoursAgo(3) },
  { id: 'wdm_3', username: '@marcus.lifts', createdAt: hoursAgo(5) },
  { id: 'wdm_4', username: '@cleanfoodcrush', createdAt: hoursAgo(8) },
  { id: 'wdm_5', username: '@brand.partner', createdAt: hoursAgo(12) },
  { id: 'wdm_6', username: '@runners.club', createdAt: hoursAgo(20) },
  { id: 'wdm_7', username: '@trail.tales', createdAt: hoursAgo(28) },
]
```

- [ ] **Step 2: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/mocks/welcomeDmHistory.js
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/mocks/welcomeDmHistory.js && git commit -m "feat(mocks): add welcome DM history list

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: `mockCloseFriendsState` mock

**Files:**
- Create: `src/mocks/closeFriendsState.js`

- [ ] **Step 1: Create the mock file**

Create `src/mocks/closeFriendsState.js` with this exact content:

```js
// Current Close Friends list state and recent add/remove events,
// surfaced on /engagement under the Close Friends card (only when
// the toggle is on and the user is on Advanced).
//
// `count` is the current list size. `recent` is the activity log,
// newest-first. Each event:
//   - type:      'add' | 'remove'
//   - username:  '@handle'
//   - createdAt: ISO string anchored to NOW
const NOW = new Date()
const hoursAgo = (h) => new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString()

export const mockCloseFriendsState = {
  count: 23,
  recent: [
    { id: 'cf_1', type: 'add', username: '@yoga.ashley', createdAt: hoursAgo(1) },
    { id: 'cf_2', type: 'remove', username: '@cleanfoodcrush', createdAt: hoursAgo(4) },
    { id: 'cf_3', type: 'add', username: '@marcus.lifts', createdAt: hoursAgo(6) },
    { id: 'cf_4', type: 'add', username: '@plantbased.priya', createdAt: hoursAgo(9) },
    { id: 'cf_5', type: 'remove', username: '@brand.partner', createdAt: hoursAgo(18) },
    { id: 'cf_6', type: 'add', username: '@runners.club', createdAt: hoursAgo(30) },
  ],
}
```

- [ ] **Step 2: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/mocks/closeFriendsState.js
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/mocks/closeFriendsState.js && git commit -m "feat(mocks): add Close Friends current state + recent activity

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `EngagementStatsCard` component

**Files:**
- Create: `src/pages/engagement/EngagementStatsCard.jsx`

- [ ] **Step 1: Create the component file**

Create `src/pages/engagement/EngagementStatsCard.jsx` with this exact content:

```jsx
import { BarChart3, Mail, MailOpen, Star } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { mockEngagementStats } from '@/mocks/engagementStats'

// Stats hero for /engagement. Three tiles inside one card; same
// chip + label + big number + delta vocabulary as the Overview
// metric cards. `current` and `delta` come from a static mock —
// when the engine wires up, this becomes a server-driven response.
const TILES = [
  { key: 'dmsSent', label: 'DMs sent', icon: Mail, deltaSuffix: 'vs last week' },
  { key: 'dmOpenRate', label: 'DM open rate', icon: MailOpen, deltaSuffix: 'pt vs last week', isPercent: true },
  { key: 'closeFriends', label: 'Close Friends', icon: Star, deltaSuffix: 'vs last week' },
]

export default function EngagementStatsCard() {
  const stats = mockEngagementStats
  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <CardChip color="blue" icon={BarChart3} />
        <h2 className="text-base font-semibold text-text-primary">This week</h2>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TILES.map((t) => {
          const value = stats[t.key]
          const Icon = t.icon
          const positive = value.delta >= 0
          return (
            <div
              key={t.key}
              className="flex flex-col gap-1 rounded-lg border border-border bg-bg/40 p-3"
            >
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {t.label}
              </div>
              <div className="text-2xl font-semibold tabular-nums text-text-primary">
                {t.isPercent ? `${value.current}%` : value.current}
              </div>
              <div
                className={`text-xs font-medium tabular-nums ${
                  positive ? 'text-green-text' : 'text-red-text'
                }`}
              >
                {positive ? '↑' : '↓'} {Math.abs(value.delta)} {t.deltaSuffix}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/engagement/EngagementStatsCard.jsx
```
Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/engagement/EngagementStatsCard.jsx && git commit -m "feat(engagement): EngagementStatsCard with three metric tiles

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Mount `EngagementStatsCard` on `/engagement`

**Files:**
- Modify: `src/pages/engagement/index.jsx`

- [ ] **Step 1: Add the import**

In `src/pages/engagement/index.jsx`, add this import below the existing `import { useState } from 'react'`:

```js
import EngagementStatsCard from './EngagementStatsCard'
```

- [ ] **Step 2: Render the card at the top of the stack**

Find the existing card stack:

```jsx
<div className="mt-4 flex flex-col gap-4">
  <WelcomeDmCard onRequestUpgrade={openUpgrade} />
  <CloseFriendsCard onRequestUpgrade={openUpgrade} />
</div>
```

Add `<EngagementStatsCard />` as the first child:

```jsx
<div className="mt-4 flex flex-col gap-4">
  <EngagementStatsCard />
  <WelcomeDmCard onRequestUpgrade={openUpgrade} />
  <CloseFriendsCard onRequestUpgrade={openUpgrade} />
</div>
```

- [ ] **Step 3: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/engagement/index.jsx
```
Expected: 0 errors.

- [ ] **Step 4: Manual smoke**

Open `/engagement`. The page now starts with a card titled "This week" containing three tiles: DMs sent (47, ↑ 15), DM open rate (68%, ↑ 4 pt), Close Friends (23, ↑ 5). Tiles stack vertically on mobile, sit in a 3-col row at `sm:` and above.

- [ ] **Step 5: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/engagement/index.jsx && git commit -m "feat(engagement): mount EngagementStatsCard at top of page stack

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: Welcome DM card — recent DMs sublist

**Files:**
- Modify: `src/pages/engagement/WelcomeDmCard.jsx`

- [ ] **Step 1: Add the new imports**

At the top of `src/pages/engagement/WelcomeDmCard.jsx`, add these imports below the existing `import WelcomeDmPreview from './WelcomeDmPreview'`:

```js
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { mockWelcomeDmHistory } from '@/mocks/welcomeDmHistory'
```

- [ ] **Step 2: Conditionally render the sublist**

Find the existing JSX block inside the component (after `<WelcomeDmPreview … />`):

```jsx
<WelcomeDmPreview
  enabled={showPreview}
  message={config.welcomeDm.message}
  onEdit={() => setDmModalOpen(true)}
/>
```

Add the `RecentDmsSubsection` mount immediately after the `</WelcomeDmPreview>` closing tag (still inside the wrapping `<div className="mt-2 flex flex-col">`):

```jsx
<WelcomeDmPreview
  enabled={showPreview}
  message={config.welcomeDm.message}
  onEdit={() => setDmModalOpen(true)}
/>
{showPreview && <RecentDmsSubsection />}
```

- [ ] **Step 3: Add the inline `RecentDmsSubsection` component**

At the bottom of the file (after the default `WelcomeDmCard` export's closing brace), add:

```jsx
// Compact list of the last welcome DMs the engine sent. Only mounts
// when the toggle is on AND the user is on Advanced (the parent
// gates this with `showPreview`). When no DMs have been sent yet,
// renders a muted empty-state line.
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

- [ ] **Step 4: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/engagement/WelcomeDmCard.jsx
```
Expected: 0 errors.

- [ ] **Step 5: Manual smoke**

Open `/engagement` on Advanced plan with Welcome DM toggle ON. Card now shows the existing chat bubble + a "RECENT DMS SENT" subsection with up to 5 rows (initial avatar circle + `@username` + relative time).

Toggle Welcome DM OFF — the recent-DMs subsection disappears (the chat bubble's off-state remains).

If you switch the user to Growth plan (set `mockUser.plan = 'growth'` in `src/mocks/user.js`), `showPreview` is false → no recent-DMs subsection. Revert that mock change before committing.

- [ ] **Step 6: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/engagement/WelcomeDmCard.jsx && git commit -m "feat(engagement): recent DMs sublist on WelcomeDmCard

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Close Friends card — count line + recent activity sublist

**Files:**
- Modify: `src/pages/engagement/CloseFriendsCard.jsx`

- [ ] **Step 1: Update the lucide import line**

At the top of `src/pages/engagement/CloseFriendsCard.jsx`, the existing lucide import is:

```js
import { Star } from 'lucide-react'
```

Replace with (alphabetical, adding `Minus, Plus`):

```js
import { Minus, Plus, Star } from 'lucide-react'
```

- [ ] **Step 2: Add the utility + mock imports**

Below the existing `import CloseFriendsProgress from './CloseFriendsProgress'`, add:

```js
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { mockCloseFriendsState } from '@/mocks/closeFriendsState'
```

- [ ] **Step 3: Conditionally render the new subsection**

Find the existing JSX after the `<CloseFriendsProgress … />` block:

```jsx
<CloseFriendsProgress mode={cfMode} enabled={showCfControls} />
```

Add the `CloseFriendsState` mount immediately after `<CloseFriendsProgress … />` (still inside the wrapping `<div className="pb-3 pt-1">`):

```jsx
<CloseFriendsProgress mode={cfMode} enabled={showCfControls} />
{showCfControls && <CloseFriendsState />}
```

- [ ] **Step 4: Add the inline `CloseFriendsState` component**

At the bottom of the file (after the default `CloseFriendsCard` export's closing brace), add:

```jsx
// Live state of the Close Friends list — current count + a chronological
// log of recent adds/removes. Only mounts when the toggle is on AND the
// user is on Advanced (the parent gates this with `showCfControls`).
function CloseFriendsState() {
  const { count, recent } = mockCloseFriendsState
  const items = recent.slice(0, 5)
  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="flex items-center gap-1.5 text-xs text-text-secondary">
        <Star className="h-3.5 w-3.5 text-purple-base" aria-hidden="true" />
        Currently {count} in close friends
      </p>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
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

- [ ] **Step 5: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/engagement/CloseFriendsCard.jsx
```
Expected: 0 errors.

- [ ] **Step 6: Manual smoke**

Open `/engagement` on Advanced plan with Close Friends toggle ON. Card now shows the existing controls + below them: "⭐ Currently 23 in close friends" + a "RECENT" sublist with mixed `+ green` and `- gray` rows.

Toggle Close Friends OFF — the new state subsection disappears.

On Growth plan, `showCfControls` is false → subsection doesn't render.

- [ ] **Step 7: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/engagement/CloseFriendsCard.jsx && git commit -m "feat(engagement): count line + recent activity on CloseFriendsCard

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Final lint + changelog

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Repo-wide lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src --ext .js,.jsx
```
Expected: 0 errors. Pre-existing warnings unchanged.

- [ ] **Step 2: Walk acceptance criteria**

Open the dev server and confirm:

- [ ] `/engagement` opens with the new stats card at the top showing three tiles with current values + ↑/↓ deltas.
- [ ] Welcome DM card with toggle ON (Advanced plan) renders the existing chat bubble + a new "RECENT DMS SENT" subsection with up to 5 rows.
- [ ] Welcome DM card with toggle OFF or on Growth plan renders without the recent-DMs subsection.
- [ ] Close Friends card with toggle ON (Advanced) renders the existing controls + a new "Currently 23 in close friends" line + a "RECENT" sublist with mixed `+`/`-` events.
- [ ] Close Friends card with toggle OFF or on Growth plan renders without the new state subsection.
- [ ] No regression to existing flows (DM edit modal opens, CF mode segmented control still toggles, upgrade sheet still routes correctly).

- [ ] **Step 3: Update `CHANGELOG.md`**

Insert a new dated section immediately under the most recent `## 2026-05-05 — …` block (newest entries on top):

```markdown
## 2026-05-05 — Engagement enrichment

### Created
- `src/pages/engagement/EngagementStatsCard.jsx` — stats hero card with three tiles (DMs sent / DM open rate / Close Friends), each showing the current value and a ↑/↓ delta vs last week.
- `src/mocks/engagementStats.js` — static aggregate metrics for the hero.
- `src/mocks/welcomeDmHistory.js` — recent welcome DMs list.
- `src/mocks/closeFriendsState.js` — current Close Friends count + add/remove activity log.

### Changed
- **`/engagement` page**: stats hero card now mounts as the first child of the card stack — page no longer reads as "two cards floating on whitespace."
- **`WelcomeDmCard`**: when the toggle is on (Advanced plan), the card now renders a "RECENT DMS SENT" subsection below the existing chat bubble — up to 5 rows showing recipient handle + relative time. Hidden when the toggle is off or on Growth.
- **`CloseFriendsCard`**: when the toggle is on (Advanced), the card now renders a current-count line ("Currently 23 in close friends") and a "RECENT" sublist showing mixed add (`+`, green) and remove (`–`, gray) events. Hidden when the toggle is off or on Growth.
```

- [ ] **Step 4: Commit changelog**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add CHANGELOG.md && git commit -m "docs: log engagement enrichment

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Self-review summary

**Spec coverage:**
- Spec §1 (Stats hero) → Tasks 1 + 4 + 5.
- Spec §2 (Welcome DM enrichment) → Tasks 2 + 6.
- Spec §3 (Close Friends enrichment) → Tasks 3 + 7.
- Spec §4 (page assembly) → Task 5.
- Acceptance criteria walked in Task 8.

**Type / name consistency:**
- `mockEngagementStats` exported name matches between Tasks 1 (mock) and 4 (component import).
- `mockWelcomeDmHistory` matches between Tasks 2 (mock) and 6 (component import).
- `mockCloseFriendsState` matches between Tasks 3 (mock) and 7 (component import).
- `formatRelativeTime` consumed by both Tasks 6 and 7 — already exists at `src/utils/formatRelativeTime.js` (built in the prior polish cycle).
- Tile keys (`dmsSent`, `dmOpenRate`, `closeFriends`) match between mock data shape and `TILES[].key` lookup.

**Placeholders:** None. Each step has the literal final code.
