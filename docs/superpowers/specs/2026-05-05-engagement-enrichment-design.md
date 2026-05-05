# Engagement Enrichment — Design Spec

**Date:** 2026-05-05
**Scope:** Engagement page (`/engagement`) — add a Stats hero card at the top and enrich the existing Welcome DM and Close Friends cards with recent-activity sublists. **Companion spec:** Targeting refresh (separate file).

---

## Goals

1. Replace the "leftovers feel" of `/engagement` (two toggle cards on a wide page) with substance: a stats hero card up top + recent-activity tails on both feature cards.
2. Use only signals that already exist conceptually (DMs sent, close-friends additions/removals) — no inventing new product features.

## Non-Goals

- No new user-facing features (no "auto-like new follower's recent post," no comment auto-reply, no story-view automation). Those are out of roadmap scope and would be a separate brainstorm.
- No real engine wiring — every new value is a mock. Same pattern as `mocks/activity.js` (anchored to `NOW = new Date()` so the page always reads "fresh").
- No layout change at `lg:` for the Welcome DM and Close Friends cards (they stay full-width, single-column). Their internal content grows.

---

## 1. Stats hero card

New component: `src/pages/engagement/EngagementStatsCard.jsx`. Mounted as the first child below the page header in `src/pages/engagement/index.jsx`.

Three metric tiles inside one card. Single horizontal row at `lg:`, stacks at mobile. Each tile mirrors the Overview metric-card vocabulary (chip + label + big number + delta).

### Layout

```
┌──────────────────────────────────────────────────────────────┐
│ [📊] This week                                               │   ← chip + section label
│                                                              │
│ ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐ │
│ │ DMs sent        │ │ DM open rate    │ │ Close Friends   │ │
│ │ 47              │ │ 68%             │ │ 23              │ │
│ │ ↑ +15 vs last   │ │ ↑ +4 pt vs last │ │ ↑ +5 vs last    │ │
│ └─────────────────┘ └─────────────────┘ └─────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Card markup

```jsx
import { BarChart3, Mail, MailOpen, Star } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { mockEngagementStats } from '@/mocks/engagementStats'

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

### Mock data

New file: `src/mocks/engagementStats.js`.

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

---

## 2. Welcome DM enrichment — Recent DMs sublist

`src/pages/engagement/WelcomeDmCard.jsx` gains a "Recent DMs" subsection that appears **only when the toggle is ON and the plan is unlocked** (i.e. `showPreview === true` in the existing component). Sits below the existing `<WelcomeDmPreview />` chat-bubble block.

### Layout

```
┌─────────────────────────────────────────┐
│ [💬] Welcome DM                         │
│                                         │
│ [⚙️] Welcome DM toggle row              │
│                                         │
│ ┌─────────────────────────────────┐     │   ← existing WelcomeDmPreview
│ │ "Hey! Thanks for the follow…"   │     │
│ └─────────────────────────────────┘     │
│ Click the bubble to edit                │
│                                         │
│ ─────────────────────────────────────   │
│ RECENT DMS SENT                         │   ← NEW
│ [A] @yoga.ashley           · 1h ago     │
│ [P] @plantbased.priya      · 3h ago     │
│ [M] @marcus.lifts          · 5h ago     │
│ [C] @cleanfoodcrush        · 8h ago     │
│ [B] @brand.partner         · 12h ago    │
└─────────────────────────────────────────┘
```

### Markup

Insert after `<WelcomeDmPreview … />` and before the closing tags:

```jsx
{showPreview && (
  <RecentDmsSubsection />
)}
```

`RecentDmsSubsection` is a small inline component below the main `WelcomeDmCard` export:

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

Imports added at top of `WelcomeDmCard.jsx`:

```js
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { mockWelcomeDmHistory } from '@/mocks/welcomeDmHistory'
```

### Mock data

New file: `src/mocks/welcomeDmHistory.js`.

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

The component slices to 5 — the array can grow without UI changes.

---

## 3. Close Friends enrichment — list state + recent activity

`src/pages/engagement/CloseFriendsCard.jsx` gains:

1. A current-list count under the existing toggle: e.g. `"Currently 23 close friends."`
2. A "Recent activity" sublist below `CloseFriendsProgress` showing recent adds and removes.

Same gating as Welcome DM: only when `showCfControls === true`.

### Layout

```
┌─────────────────────────────────────────┐
│ [⭐] Close Friends Adder                │
│                                         │
│ [Toggle row]                            │
│                                         │
│ [Add new followers | Remove unfollowers]│  ← existing segmented control
│                                         │
│ [Progress strip]                         │  ← existing CloseFriendsProgress
│                                         │
│ ─────────────────────────────────────   │
│ ⭐ 23 in close friends                  │   ← NEW count line
│                                         │
│ RECENT                                  │   ← NEW recent activity
│ [+ green] @yoga.ashley       1h ago     │
│ [- gray] @cleanfoodcrush     4h ago     │
│ [+ green] @marcus.lifts      6h ago     │
│ [+ green] @plantbased.priya  9h ago     │
│ [- gray] @brand.partner      18h ago    │
└─────────────────────────────────────────┘
```

### Markup

Insert after `<CloseFriendsProgress … />` and before the closing `</div>`/`</section>`:

```jsx
{showCfControls && <CloseFriendsState />}
```

`CloseFriendsState` is an inline component:

```jsx
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

Imports added to `CloseFriendsCard.jsx`:

```js
import { Minus, Plus, Star } from 'lucide-react'           // Star already imported, add Plus + Minus
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { mockCloseFriendsState } from '@/mocks/closeFriendsState'
```

### Mock data

New file: `src/mocks/closeFriendsState.js`.

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

---

## 4. Page assembly

`src/pages/engagement/index.jsx` becomes:

```jsx
import { useState } from 'react'
import EngagementStatsCard from './EngagementStatsCard'
import WelcomeDmCard from './WelcomeDmCard'
import CloseFriendsCard from './CloseFriendsCard'
import GrowthPlusBanner from '@/components/GrowthPlusBanner'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'
import { mockUser } from '@/mocks/user'

export default function EngagementPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)
  const openUpgrade = (feature) => setUpgradeFeature(feature)
  const closeUpgrade = () => setUpgradeFeature(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Engagement
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          How Kicksta interacts with new followers.
        </p>
      </header>

      <div className="mt-4 flex flex-col gap-4">
        <EngagementStatsCard />
        <WelcomeDmCard onRequestUpgrade={openUpgrade} />
        <CloseFriendsCard onRequestUpgrade={openUpgrade} />
      </div>

      <div className="mt-4">
        <GrowthPlusBanner isSubscribed={mockUser.growthPlusSubscribed} />
      </div>

      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'welcome_dm'}
      />
    </div>
  )
}
```

Single change vs today: import + render `<EngagementStatsCard />` as the first child of the `<div className="mt-4 flex flex-col gap-4">`.

---

## Files Touched

| File | Status | Change |
|---|---|---|
| `src/pages/engagement/index.jsx` | MODIFY | Mount `EngagementStatsCard` at the top of the card stack |
| `src/pages/engagement/EngagementStatsCard.jsx` | NEW | Stats hero with three metric tiles |
| `src/pages/engagement/WelcomeDmCard.jsx` | MODIFY | Recent-DMs sublist (rendered only when `showPreview`) |
| `src/pages/engagement/CloseFriendsCard.jsx` | MODIFY | Count line + recent add/remove sublist (rendered only when `showCfControls`) |
| `src/mocks/engagementStats.js` | NEW | DMs sent / open rate / Close Friends mock metrics |
| `src/mocks/welcomeDmHistory.js` | NEW | Mock recent DMs list |
| `src/mocks/closeFriendsState.js` | NEW | Mock current count + recent activity log |

No changes to `WelcomeDmPreview`, `WelcomeDmModal`, `CloseFriendsProgress`, `GrowthPlusBanner`, or any store. No new components beyond `EngagementStatsCard`.

---

## Risks / Edge cases

- **Empty mocks.** Both sublists handle empty arrays with their own muted empty-state text; the page never breaks. Mocks ship with seed data so dev always sees the populated branch.
- **Welcome DM card height when toggle flips off.** When `showPreview` becomes false, the recent-DMs sublist unmounts. The `WelcomeDmPreview` already handles its own off-state height-preservation; the card visibly shrinks because the recent-DMs section vanishes. That's intentional — when DMs aren't sending, showing a list of "recent DMs sent" would be misleading.
- **Close Friends card on Growth plan (locked).** `showCfControls` is `false` because `locked === true` (Advanced-only feature). The count + recent sublist don't render — same gate the existing segmented control + progress strip use. ✓
- **Layout on Growth plan.** Both feature cards render their existing locked/upgrade state. The stats hero still shows mock numbers (the engine could in principle report counts even for users who can't edit Close Friends — Welcome DM and Close Friends are Advanced-only, so those metrics would be zero on Growth, but DMs-sent / open-rate would still be meaningful if those were reported). Acceptable for V1 — when the engine wires up, the metrics adapt to the user's plan automatically.

---

## Out of scope (parked)

- Charts on the stats hero (sparkline trends per metric).
- Drilldown from a recent-DM row to the full message that was sent.
- DM template management.
- Adding a third feature card to the Engagement page (e.g. comment auto-reply, story replies). Would need a separate brainstorm.
- Animated transitions when the sublists mount/unmount on toggle flips.

---

## Acceptance criteria

- [ ] `/engagement` opens with the new stats card at the top showing three tiles: DMs sent, DM open rate, Close Friends — each with current value and ↑/↓ delta.
- [ ] Welcome DM card with toggle ON (Advanced plan) renders the existing chat bubble + a new "RECENT DMS SENT" subsection with up to 5 rows.
- [ ] Welcome DM card with toggle OFF or on Growth plan renders without the recent-DMs subsection.
- [ ] Close Friends card with toggle ON (Advanced) renders the existing controls + a new "Currently 23 in close friends" line + a "RECENT" sublist with mixed `+`/`-` events.
- [ ] Close Friends card with toggle OFF or on Growth plan renders without the new state subsection.
- [ ] No regression to existing flows (DM edit modal, CF mode segmented control, upgrade sheet routing).
- [ ] Page reads as full and substantive on a wide viewport — no longer "two cards floating on whitespace."
