# Targets Page v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the v2 iteration on `/targets` per `docs/superpowers/specs/2026-04-23-targets-page-v2-design.md`. Denser rows, a richer detail drawer replacing the kebab menu, a redesigned Add Target sheet with typeahead + always-visible suggestions + health labels, and mock-data changes to support both.

**Architecture:** Incremental edits to existing components. One new shared utility (`formatCount`), one new shared component (`HealthPill`), one renamed file (`KebabMenu` → `TargetDetailDrawer`), one renamed+expanded mock (`resolveAccount` → `targetSearch`). Store untouched.

**Tech Stack:** React 19, Tailwind 4, Zustand 5, Lucide React.

**Testing:** No unit-test framework. Verification is visual via the Claude Preview server (handled by the controller at the end). Subagents must not attempt `npm run lint` or `npm test` (node isn't on the sandbox PATH). Each task ends with a git commit.

---

## Conventions

- **Spacing:** Tailwind scale 4/8/12/16/24/32/48/64 only.
- **Color tokens:** only design-system tokens (`green-tint`, `green-text`, `yellow-tint`, `yellow-text`, `blue-tint`, `blue-text`, `red-tint`, `red-text`, `bg`, `surface`, `border`, `text-primary/secondary/muted`). No arbitrary hex.
- **Commit prefix:** `feat(targets-v2): …` or `refactor(targets-v2): …` per task.
- **Path alias:** `@/` → `src/`.

---

## Task 1: Shared utility — `formatCount`

**Files:** Create `src/utils/formatCount.js`.

- [ ] **Step 1** — Create `src/utils/formatCount.js`:

```js
// Abbreviates large numbers for display: 128_400 → "128K", 12_400_000 → "12.4M".
// Null / undefined → empty string so callers can drop it inline.
export function formatCount(n) {
  if (n == null) return ''
  if (n >= 1_000_000) {
    const v = n / 1_000_000
    const digits = n < 10_000_000 ? 1 : 0
    return `${v.toFixed(digits).replace(/\.0$/, '')}M`
  }
  if (n >= 1_000) {
    const v = n / 1_000
    const digits = n < 10_000 ? 1 : 0
    return `${v.toFixed(digits).replace(/\.0$/, '')}K`
  }
  return n.toLocaleString()
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/utils/formatCount.js
git commit -m "feat(targets-v2): add formatCount utility"
```

---

## Task 2: Shared component — `HealthPill`

**Files:** Create `src/pages/targets/HealthPill.jsx`.

- [ ] **Step 1** — Create `src/pages/targets/HealthPill.jsx`:

```jsx
// Size-based match quality indicator for a target. Thresholds are
// based on follower count for accounts and post count for hashtags.
// Red is intentionally avoided (PRODUCT.md reserves it for connection
// errors) — "needs attention" states use yellow instead.

export function evaluateHealth(count) {
  if (count == null) return null
  if (count < 1_000) return { label: 'Small audience', tone: 'warn' }
  if (count < 100_000) return { label: 'Good fit', tone: 'good' }
  if (count < 1_000_000) return { label: 'Slower — large audience', tone: 'warn' }
  return { label: 'Very large — much slower', tone: 'warn' }
}

export default function HealthPill({ count, className = '' }) {
  const h = evaluateHealth(count)
  if (!h) return null
  const tone =
    h.tone === 'good'
      ? 'bg-green-tint text-green-text'
      : 'bg-yellow-tint text-yellow-text'
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone} ${className}`}
    >
      {h.label}
    </span>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
git add src/pages/targets/HealthPill.jsx
git commit -m "feat(targets-v2): add HealthPill with size-based match quality"
```

---

## Task 3: Expand + rename mocks (`targetSearch`, `suggestedHashtags`, `targets`)

**Files:**
- Rename: `src/mocks/resolveAccount.js` → `src/mocks/targetSearch.js`
- Create: `src/mocks/suggestedHashtags.js`
- Modify: `src/mocks/targets.js`
- Modify: `src/mocks/suggestedTargets.js` (ensure followers present — they already are)

- [ ] **Step 1** — Create `src/mocks/targetSearch.js` with full replacement content (rename + expand). Delete the old `src/mocks/resolveAccount.js` file after creating the new one:

```js
// Mock target search. Supports two modes: 'account' and 'hashtag'.
// `searchTargets(query, type)` returns up to 5 matches (case-insensitive
// `includes` on the identifier). Async with a small delay so the UI can
// show a loading state if it chooses.
//
// `mockResolveAccount(username)` is kept for compatibility — a thin
// wrapper that returns the exact match (or null) for a single lookup.

const ACCOUNTS = [
  { username: 'fitness.inspo', followers: 128_400, profilePic: null },
  { username: 'fitfluencer', followers: 84_200, profilePic: null },
  { username: 'healthyhabits', followers: 52_100, profilePic: null },
  { username: 'trainhard.daily', followers: 39_800, profilePic: null },
  { username: 'nutrition.nerd', followers: 22_400, profilePic: null },
  { username: 'homegymhero', followers: 18_700, profilePic: null },
  { username: 'macro.melissa', followers: 9_400, profilePic: null },
  { username: 'protein.pete', followers: 6_100, profilePic: null },
  { username: 'yoga.daily', followers: 210_000, profilePic: null },
  { username: 'keto.kevin', followers: 48_300, profilePic: null },
  { username: 'cleanfoodcrush', followers: 71_000, profilePic: null },
  { username: 'fit.and.fast', followers: 15_300, profilePic: null },
  { username: 'lift.and.lunge', followers: 3_900, profilePic: null },
  { username: 'plantpowered', followers: 145_000, profilePic: null },
  { username: 'runfast.club', followers: 58_200, profilePic: null },
  { username: 'core.strong', followers: 27_800, profilePic: null },
  { username: 'cardio.crew', followers: 11_500, profilePic: null },
  { username: 'gym.goals', followers: 1_200_000, profilePic: null },
  { username: 'sweatdaily', followers: 630_000, profilePic: null },
  { username: 'the.fit.life', followers: 820, profilePic: null },
]

const HASHTAGS = [
  { hashtag: 'homeworkouts', posts: 14_200_000 },
  { hashtag: 'fitfam', posts: 98_500_000 },
  { hashtag: 'healthyeating', posts: 62_300_000 },
  { hashtag: 'mealprep', posts: 18_700_000 },
  { hashtag: 'getfit', posts: 7_400_000 },
  { hashtag: 'glutenfree', posts: 22_100_000 },
  { hashtag: 'weightloss', posts: 88_900_000 },
  { hashtag: 'yogaeverydamnday', posts: 31_400_000 },
  { hashtag: 'macros', posts: 4_600_000 },
  { hashtag: 'cleaneating', posts: 76_200_000 },
]

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function normalize(q) {
  return String(q || '').replace(/^[@#]/, '').trim().toLowerCase()
}

// Returns up to 5 matches. Prefers startsWith results, falls back to
// includes for broader discovery.
export async function searchTargets(query, type) {
  const q = normalize(query)
  await delay(150 + Math.random() * 150)
  if (!q) return []
  if (type === 'hashtag') {
    const starts = HASHTAGS.filter((h) => h.hashtag.startsWith(q))
    const includes = HASHTAGS.filter(
      (h) => !h.hashtag.startsWith(q) && h.hashtag.includes(q)
    )
    return [...starts, ...includes].slice(0, 5)
  }
  const starts = ACCOUNTS.filter((a) => a.username.startsWith(q))
  const includes = ACCOUNTS.filter(
    (a) => !a.username.startsWith(q) && a.username.includes(q)
  )
  return [...starts, ...includes].slice(0, 5)
}

// Compatibility wrapper: exact lookup for a single username.
export async function mockResolveAccount(rawUsername) {
  const q = normalize(rawUsername)
  await delay(200 + Math.random() * 200)
  if (!q) return null
  const hit = ACCOUNTS.find((a) => a.username === q)
  return hit ? { ...hit } : null
}
```

- [ ] **Step 2** — Remove the old file:

```bash
rm "/Users/aleksandarstankovic/Desktop/Vibe Dash/src/mocks/resolveAccount.js"
```

- [ ] **Step 3** — Create `src/mocks/suggestedHashtags.js`:

```js
// Static hashtag suggestions for the Add Target sheet's hashtag mode.
export const mockSuggestedHashtags = [
  { hashtag: 'homeworkouts', posts: 14_200_000 },
  { hashtag: 'fitfam', posts: 98_500_000 },
  { hashtag: 'healthyeating', posts: 62_300_000 },
  { hashtag: 'mealprep', posts: 18_700_000 },
  { hashtag: 'getfit', posts: 7_400_000 },
]
```

- [ ] **Step 4** — Replace the contents of `src/mocks/targets.js` with:

```js
// Seeded targets for the dashboard. Each row now carries either
// `followers` (account) or `posts` (hashtag) for the target-source
// context. Follow-back counts are tuned so the rate reads cleanly
// across healthy / average / needs-attention bands.
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
  },
]
```

- [ ] **Step 5** — Commit:

```bash
git add src/mocks/targetSearch.js src/mocks/suggestedHashtags.js src/mocks/targets.js
git add -u src/mocks/resolveAccount.js
git commit -m "feat(targets-v2): expand mock search pool, add hashtag suggestions, tune target data"
```

---

## Task 4: Target row redesign

**Files:** Modify `src/pages/targets/TargetRow.jsx` (full rewrite).

- [ ] **Step 1** — Replace file contents:

```jsx
import { ChevronRight, Hash, Star } from 'lucide-react'
import { formatCount } from '@/utils/formatCount'

// Status → dot/pill colors kept in one place for consistency with the
// Overview page's TargetsOverview snapshot.
const statusPillClass = {
  active: 'bg-green-tint text-green-text',
  queued: 'bg-blue-tint text-blue-text',
  paused: 'bg-bg text-text-secondary',
  depleted: 'bg-yellow-tint text-yellow-text',
}

const statusLabel = {
  active: 'Active',
  queued: 'Queued',
  paused: 'Paused',
  depleted: 'Depleted',
}

// Color the follow-back % based on PRODUCT.md's healthy-growth
// benchmarks. Depleted rows bypass this and go muted.
function rateToneClass(rate, depleted) {
  if (depleted) return 'text-text-muted'
  if (rate >= 10) return 'text-green-text'
  if (rate >= 5) return 'text-text-secondary'
  return 'text-yellow-text'
}

export default function TargetRow({ target, isTop, isFirst, onOpen }) {
  const depleted = target.status === 'depleted'
  const isHashtag = target.type === 'hashtag'
  const handleStart = target.value.replace(/^[@#]/, '')
  const avatarLetter = handleStart.charAt(0).toUpperCase()

  const subline = isHashtag
    ? target.posts != null
      ? `${formatCount(target.posts)} posts`
      : ''
    : target.followers != null
      ? `${formatCount(target.followers)} followers`
      : ''

  const rate =
    target.followedCount > 0
      ? Math.round((target.followBackCount / target.followedCount) * 100)
      : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(target)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(target)
        }
      }}
      className={`group flex min-h-[64px] cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bg focus:bg-bg focus:outline-none ${
        isFirst ? '' : 'border-t border-border'
      } ${depleted ? 'bg-bg/60' : ''}`}
    >
      {/* Avatar / hashtag icon */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-sm font-semibold text-text-secondary ${
          depleted ? 'opacity-60' : ''
        }`}
      >
        {isHashtag ? (
          <Hash className="h-4 w-4" aria-hidden="true" />
        ) : target.profilePic ? (
          <img
            src={target.profilePic}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          avatarLetter
        )}
      </div>

      {/* Name + subline */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`truncate text-sm font-medium ${
              depleted ? 'text-text-muted line-through' : 'text-text-primary'
            }`}
          >
            {target.value}
          </span>
          {isTop && (
            <Star
              className="h-3.5 w-3.5 shrink-0 fill-yellow-base text-yellow-base"
              aria-label="Top performer"
            />
          )}
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
              statusPillClass[target.status]
            }`}
          >
            {statusLabel[target.status]}
          </span>
        </div>
        {subline && (
          <span className="truncate text-xs text-text-muted">{subline}</span>
        )}
      </div>

      {/* Follow-backs · rate */}
      <div className="flex shrink-0 items-baseline gap-1">
        <span
          className={`text-sm font-semibold tabular-nums ${
            depleted ? 'text-text-muted' : 'text-text-primary'
          }`}
        >
          {target.followBackCount}
        </span>
        <span className="text-text-muted">·</span>
        <span className={`text-xs tabular-nums ${rateToneClass(rate, depleted)}`}>
          {rate == null ? '—' : `${rate}%`}
        </span>
      </div>

      {/* Affordance: row opens the detail drawer. Decorative only. */}
      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center">
        <ChevronRight
          className="h-5 w-5 text-text-muted transition-colors group-hover:text-text-primary"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
git add src/pages/targets/TargetRow.jsx
git commit -m "feat(targets-v2): redesign target row with avatar, subline, rate %, chevron"
```

---

## Task 5: Slots card — inline header on desktop

**Files:** Modify `src/pages/targets/SlotsCard.jsx`.

- [ ] **Step 1** — Replace file contents:

```jsx
import { Lock, Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockUser } from '@/mocks/user'

// Single CTA host. Desktop: title + count + button share the top row.
// Mobile: stacked — count row, progress bar, trust line, full-width
// button.
export default function SlotsCard({ onAddTarget }) {
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = mockUser.plan === 'advanced' ? 30 : 10
  const totalCount = targets.length
  const pct = Math.min(100, (totalCount / maxSlots) * 100)

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface p-4 lg:p-6">
      {/* Desktop: inline row. Mobile: count left, button below. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex flex-1 items-center justify-between">
          <span className="text-sm text-text-secondary">Target slots</span>
          <span className="text-sm font-semibold tabular-nums text-text-primary">
            {totalCount} / {maxSlots}
          </span>
        </div>

        <button
          type="button"
          onClick={onAddTarget}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 lg:w-auto lg:shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add target
        </button>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-green-base transition-[width] duration-300"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
        <span className="text-xs text-text-muted">
          Kicksta follows within Instagram's safe daily limits.
        </span>
      </div>
    </section>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
git add src/pages/targets/SlotsCard.jsx
git commit -m "feat(targets-v2): inline slots header with button on desktop"
```

---

## Task 6: Target list — column header + empty-state copy

**Files:** Modify `src/pages/targets/TargetList.jsx`.

- [ ] **Step 1** — Replace file contents:

```jsx
import { useMemo } from 'react'
import TargetRow from './TargetRow'
import {
  useTargetsStore,
  filterTargets,
  sortTargets,
} from '@/stores/useTargetsStore'

export default function TargetList({ onOpen }) {
  const targets = useTargetsStore((s) => s.targets)
  const filter = useTargetsStore((s) => s.filter)
  const sort = useTargetsStore((s) => s.sort)

  const visible = useMemo(() => {
    return sortTargets(filterTargets(targets, filter), sort)
  }, [targets, filter, sort])

  const topTargetId = useMemo(() => {
    const actives = targets.filter((t) => t.status === 'active')
    if (actives.length === 0) return null
    return actives.reduce((best, t) =>
      t.followBackCount > best.followBackCount ? t : best
    ).id
  }, [targets])

  const hasAnyTarget = targets.length > 0

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        <span>Name</span>
        <span>Follow-backs · %</span>
      </div>

      {!hasAnyTarget && <EmptyNoTargets />}
      {hasAnyTarget && visible.length === 0 && <EmptyForFilter filter={filter} />}

      {hasAnyTarget && visible.length > 0 && (
        <div className="flex flex-col">
          {visible.map((t, i) => (
            <TargetRow
              key={t.id}
              target={t}
              isFirst={i === 0}
              isTop={t.id === topTargetId}
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function EmptyNoTargets() {
  return (
    <div className="px-4 py-16 text-center">
      <h3 className="text-lg font-semibold text-text-primary">No targets yet</h3>
      <p className="mt-1 text-sm text-text-secondary">
        Add an account or hashtag for Kicksta to follow users from.
        Expect first results within 24–72 hours.
      </p>
    </div>
  )
}

const FILTER_EMPTY_COPY = {
  active: 'No active targets.',
  queued: 'No queued targets.',
  paused: 'No paused targets.',
  depleted: 'No depleted targets.',
}

function EmptyForFilter({ filter }) {
  const copy = FILTER_EMPTY_COPY[filter] || 'Nothing to show.'
  return (
    <div className="px-4 py-8 text-center text-sm text-text-muted">{copy}</div>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
git add src/pages/targets/TargetList.jsx
git commit -m "feat(targets-v2): column header rename + richer empty state copy"
```

---

## Task 7: Replace KebabMenu with TargetDetailDrawer

**Files:**
- Delete: `src/pages/targets/KebabMenu.jsx`
- Create: `src/pages/targets/TargetDetailDrawer.jsx`
- Modify: `src/pages/targets/index.jsx`

- [ ] **Step 1** — Create `src/pages/targets/TargetDetailDrawer.jsx`:

```jsx
import { useEffect } from 'react'
import { ExternalLink, Hash, Pause, Play, Trash2, X } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { formatCount } from '@/utils/formatCount'
import HealthPill from './HealthPill'

// Richer replacement for the v1 KebabMenu. Opens on row tap and shows
// target identity, health, a stat strip, tinted action buttons, and
// an external link to Instagram.

const statusPillClass = {
  active: 'bg-green-tint text-green-text',
  queued: 'bg-blue-tint text-blue-text',
  paused: 'bg-bg text-text-secondary',
  depleted: 'bg-yellow-tint text-yellow-text',
}

const statusLabel = {
  active: 'Active',
  queued: 'Queued',
  paused: 'Paused',
  depleted: 'Depleted',
}

export default function TargetDetailDrawer({ target, onClose, onRequestRemove }) {
  const pauseTarget = useTargetsStore((s) => s.pauseTarget)
  const resumeTarget = useTargetsStore((s) => s.resumeTarget)

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!target) return null

  const isHashtag = target.type === 'hashtag'
  const handleStart = target.value.replace(/^[@#]/, '')
  const avatarLetter = handleStart.charAt(0).toUpperCase()
  const sizeCount = isHashtag ? target.posts : target.followers
  const subline = isHashtag
    ? target.posts != null
      ? `${formatCount(target.posts)} posts`
      : ''
    : target.followers != null
      ? `${formatCount(target.followers)} followers`
      : ''
  const rate =
    target.followedCount > 0
      ? Math.round((target.followBackCount / target.followedCount) * 100)
      : null

  const instagramUrl = isHashtag
    ? `https://www.instagram.com/explore/tags/${handleStart}`
    : `https://instagram.com/${handleStart}`

  const handlePauseResume = () => {
    if (target.status === 'active') pauseTarget(target.id)
    else if (target.status === 'paused') resumeTarget(target.id)
    onClose()
  }

  const handleRemove = () => onRequestRemove(target)

  const canPauseOrResume =
    target.status === 'active' || target.status === 'paused'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Target details for ${target.value}`}
      className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full overflow-hidden rounded-t-xl bg-surface shadow-xl lg:max-w-md lg:rounded-xl"
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-base font-semibold text-text-secondary">
            {isHashtag ? (
              <Hash className="h-5 w-5" aria-hidden="true" />
            ) : target.profilePic ? (
              <img src={target.profilePic} alt="" className="h-full w-full object-cover" />
            ) : (
              avatarLetter
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-base font-semibold text-text-primary">
                {target.value}
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  statusPillClass[target.status]
                }`}
              >
                {statusLabel[target.status]}
              </span>
            </div>
            {subline && (
              <div className="mt-0.5 text-xs text-text-muted">{subline}</div>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Health pill */}
        {sizeCount != null && (
          <div className="mt-3 px-5">
            <HealthPill count={sizeCount} />
          </div>
        )}

        {/* Stat strip — 3 data chips in Growth-Settings recipe. */}
        <div className="mt-4 flex gap-2 overflow-x-auto px-5">
          <StatChip label="Followed" value={target.followedCount} />
          <StatChip label="Follow-backs" value={target.followBackCount} />
          <StatChip label="Rate" value={rate == null ? '—' : `${rate}%`} />
        </div>

        {/* Actions */}
        <div className="mt-5 flex gap-3 px-5">
          {canPauseOrResume ? (
            <>
              <button
                type="button"
                onClick={handlePauseResume}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-tint text-sm font-medium text-blue-text hover:opacity-90"
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
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-red-tint text-sm font-medium text-red-text hover:opacity-90"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-tint text-sm font-medium text-red-text hover:opacity-90"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </button>
          )}
        </div>

        {/* External link */}
        <div className="mt-4 px-5 pb-5">
          <a
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-text-primary"
          >
            Open on Instagram
            <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
        </div>
      </div>
    </div>
  )
}

function StatChip({ label, value }) {
  return (
    <div className="shrink-0 rounded-full bg-bg px-3 py-1.5 text-xs">
      <span className="text-text-muted">{label} </span>
      <span className="font-semibold tabular-nums text-text-primary">
        {value}
      </span>
    </div>
  )
}
```

- [ ] **Step 2** — Delete `src/pages/targets/KebabMenu.jsx`:

```bash
rm "/Users/aleksandarstankovic/Desktop/Vibe Dash/src/pages/targets/KebabMenu.jsx"
```

- [ ] **Step 3** — Replace the contents of `src/pages/targets/index.jsx`:

```jsx
import { useState } from 'react'
import SlotsCard from './SlotsCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'
import TargetDetailDrawer from './TargetDetailDrawer'
import RemoveTargetModal from './RemoveTargetModal'
import AddTargetSheet from './AddTargetSheet'

export default function TargetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Targets
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage the accounts and hashtags Kicksta targets for your growth.
        </p>
      </header>

      <SlotsCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList onOpen={(t) => setDetailTarget(t)} />

      <AddTargetSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {detailTarget && (
        <TargetDetailDrawer
          target={detailTarget}
          onClose={() => setDetailTarget(null)}
          onRequestRemove={(t) => {
            setDetailTarget(null)
            setRemoveTarget(t)
          }}
        />
      )}

      {removeTarget && (
        <RemoveTargetModal
          target={removeTarget}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 4** — Commit:

```bash
git add src/pages/targets/TargetDetailDrawer.jsx src/pages/targets/index.jsx
git add -u src/pages/targets/KebabMenu.jsx
git commit -m "feat(targets-v2): replace kebab menu with detail drawer"
```

---

## Task 8: Add Target sheet — toggle, typeahead, suggestions, health

**Files:** Modify `src/pages/targets/AddTargetSheet.jsx`.

- [ ] **Step 1** — Replace file contents:

```jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { Hash, X } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockSuggestedTargets } from '@/mocks/suggestedTargets'
import { mockSuggestedHashtags } from '@/mocks/suggestedHashtags'
import { searchTargets } from '@/mocks/targetSearch'
import { formatCount } from '@/utils/formatCount'
import HealthPill from './HealthPill'

// Single-path Add Target sheet. v2 refinements:
// - Compact segmented toggle (h-9, left-aligned, not full-width).
// - Typeahead dropdown over an expanded fixture pool.
// - Suggestions always visible — account OR hashtag chips depending on mode.
// - Health pill on the preview card and on each typeahead row.
// - Duplicate detection + paused-row resume shortcut preserved.
export default function AddTargetSheet({ open, onClose }) {
  const targets = useTargetsStore((s) => s.targets)
  const addTarget = useTargetsStore((s) => s.addTarget)
  const resumeTarget = useTargetsStore((s) => s.resumeTarget)

  const [type, setType] = useState('account')
  const [input, setInput] = useState('')
  const [matches, setMatches] = useState([])
  const [resolving, setResolving] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setType('account')
      setInput('')
      setMatches([])
      setResolving(false)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const clean = input.replace(/^[@#]/, '').trim()
  const formatValid =
    type === 'account'
      ? /^[a-zA-Z0-9._]{1,30}$/.test(clean)
      : /^[a-zA-Z0-9_]{1,30}$/.test(clean)

  const displayValue = type === 'account' ? `@${clean.toLowerCase()}` : `#${clean.toLowerCase()}`
  const duplicate = useMemo(() => {
    if (!clean) return null
    return targets.find((t) => t.value.toLowerCase() === displayValue)
  }, [targets, displayValue, clean])

  // Typeahead search — debounced 200ms. Only runs for 2+ chars and
  // when the input isn't a duplicate.
  useEffect(() => {
    if (!clean || clean.length < 2 || duplicate) {
      setMatches([])
      setResolving(false)
      return
    }
    let alive = true
    setResolving(true)
    const id = setTimeout(async () => {
      const results = await searchTargets(clean, type)
      if (alive) {
        setMatches(results)
        setResolving(false)
      }
    }, 200)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [clean, type, duplicate])

  // Exact match of the current input within the pool — used for the
  // preview card (and to decide if we can surface a health pill).
  const exactMatch = useMemo(() => {
    if (!matches.length) return null
    const keyField = type === 'account' ? 'username' : 'hashtag'
    return matches.find((m) => m[keyField] === clean.toLowerCase()) || null
  }, [matches, clean, type])

  if (!open) return null

  const canSubmit = formatValid && !duplicate

  const handleSubmit = () => {
    if (!canSubmit) return
    addTarget({ type, value: displayValue })
    onClose()
  }

  const handleResumeDuplicate = () => {
    if (duplicate) {
      resumeTarget(duplicate.id)
      onClose()
    }
  }

  const handlePickMatch = (m) => {
    const val = type === 'account' ? m.username : m.hashtag
    setInput(val)
    // Eagerly show the picked match as both the exact + the preview.
    setMatches([m])
  }

  const handlePickSuggestion = (s) => {
    const val = type === 'account' ? s.username : s.hashtag
    setInput(val)
  }

  const helperCopy =
    type === 'account'
      ? "We'll find users who follow this account and target them."
      : "We'll find users posting with this hashtag and target them."

  const suggestions = type === 'account' ? mockSuggestedTargets : mockSuggestedHashtags
  const suggestionsHidden = matches.length > 0

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add a target"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex w-full max-h-[85vh] flex-col overflow-hidden rounded-t-xl bg-surface shadow-xl lg:max-w-md lg:rounded-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-base font-semibold text-text-primary">Add a target</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4">
          {/* Targeting label + compact segmented toggle */}
          <div>
            <p className="mb-1.5 text-[11px] font-medium uppercase tracking-wide text-text-muted">
              Targeting
            </p>
            <div className="inline-flex rounded-full bg-bg p-1">
              {['account', 'hashtag'].map((t) => {
                const selected = type === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t)
                      setInput('')
                      setMatches([])
                    }}
                    className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-medium capitalize transition-colors ${
                      selected
                        ? 'bg-surface text-text-primary shadow-sm'
                        : 'text-text-secondary'
                    }`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Input */}
          <div className="relative mt-4">
            <label htmlFor="target-input" className="text-sm font-medium text-text-primary">
              {type === 'account' ? 'Username' : 'Hashtag'}
            </label>
            <div className="mt-1.5 flex h-12 items-center overflow-hidden rounded-lg border border-border bg-surface px-3">
              <span className="mr-1 text-text-muted">
                {type === 'account' ? '@' : '#'}
              </span>
              <input
                id="target-input"
                ref={inputRef}
                type="text"
                value={input.replace(/^[@#]/, '')}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                placeholder={type === 'account' ? 'username' : 'hashtag'}
                autoComplete="off"
              />
            </div>

            {/* Typeahead dropdown */}
            {!duplicate && formatValid && matches.length > 0 && (
              <div className="absolute left-0 right-0 z-10 mt-1 overflow-hidden rounded-lg border border-border bg-surface shadow-md">
                {matches.map((m) => {
                  const isHashtag = type === 'hashtag'
                  const label = isHashtag ? `#${m.hashtag}` : `@${m.username}`
                  const count = isHashtag ? m.posts : m.followers
                  const sub = isHashtag
                    ? `${formatCount(m.posts)} posts`
                    : `${formatCount(m.followers)} followers`
                  const letter = (isHashtag ? m.hashtag : m.username).charAt(0).toUpperCase()
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handlePickMatch(m)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-bg"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-xs font-semibold text-text-secondary">
                        {isHashtag ? <Hash className="h-4 w-4" aria-hidden="true" /> : letter}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-text-primary">{label}</div>
                        <div className="truncate text-xs text-text-muted">{sub}</div>
                      </div>
                      <HealthPill count={count} />
                    </button>
                  )
                })}
              </div>
            )}

            {/* Helper / error line */}
            {duplicate ? (
              <p className="mt-1.5 text-xs text-red-text">
                You already have this target.
                {duplicate.status === 'paused' && (
                  <>
                    {' '}
                    <button type="button" onClick={handleResumeDuplicate} className="underline hover:opacity-80">
                      Resume it
                    </button>
                  </>
                )}
              </p>
            ) : input && !formatValid ? (
              <p className="mt-1.5 text-xs text-red-text">
                {type === 'account'
                  ? 'Usernames use letters, numbers, dots, and underscores.'
                  : 'Hashtags use letters, numbers, and underscores.'}
              </p>
            ) : (
              <p className="mt-1.5 text-xs text-text-secondary">{helperCopy}</p>
            )}
          </div>

          {/* Preview card — shown when we have an exact fixture match. */}
          {exactMatch && !duplicate && (
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-border bg-bg p-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-sm font-semibold text-text-secondary">
                {type === 'hashtag' ? (
                  <Hash className="h-4 w-4" aria-hidden="true" />
                ) : (
                  (exactMatch.username?.[0] || '?').toUpperCase()
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-text-primary">
                  {type === 'hashtag' ? `#${exactMatch.hashtag}` : `@${exactMatch.username}`}
                </div>
                <div className="truncate text-xs text-text-secondary">
                  {type === 'hashtag'
                    ? `${formatCount(exactMatch.posts)} posts`
                    : `${formatCount(exactMatch.followers)} followers`}
                </div>
              </div>
              <HealthPill count={type === 'hashtag' ? exactMatch.posts : exactMatch.followers} />
            </div>
          )}

          {/* Suggestions — always rendered, hidden only while typeahead is showing results. */}
          {!suggestionsHidden && (
            <div className="mt-5">
              <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
                Suggestions
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {suggestions.map((s) => {
                  const label = type === 'account' ? `@${s.username}` : `#${s.hashtag}`
                  return (
                    <button
                      key={label}
                      type="button"
                      onClick={() => handlePickSuggestion(s)}
                      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs text-text-secondary hover:border-border-strong hover:text-text-primary"
                    >
                      {label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-col-reverse gap-4 border-t border-border px-4 py-4 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add target
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
git add src/pages/targets/AddTargetSheet.jsx
git commit -m "feat(targets-v2): compact toggle, typeahead, always-visible suggestions, health labels"
```

---

## Task 9: Shared `useSystemStatus` hook (new)

**Files:**
- Create: `src/hooks/useSystemStatus.js`

Single source of truth for the live automation status. Advances through phases on a 6–10s randomized timer so both the new Live Activity card and the Overview `StatusPill` stay in lockstep.

- [ ] **Step 1** — Create `src/hooks/useSystemStatus.js`:

```js
import { useEffect, useRef, useState } from 'react'
import { mockSystemStatus } from '@/mocks/systemStatus'
import { useTargetsStore } from '@/stores/useTargetsStore'

// Phase state machine — the order a real run cycles through.
const NEXT_PHASE = {
  analyzing: 'following',
  following: 'waiting',
  waiting: 'unfollowing',
  unfollowing: 'waiting',
}

// Fuzzy next-action copy by phase. No countdowns — PRODUCT.md bans them.
const NEXT_LABEL = {
  analyzing: 'next in ~2 min',
  following: 'next in a moment',
  waiting: 'next in ~4 min',
  unfollowing: 'next in a moment',
  warming_up: '',
  setup: '',
  paused: '',
}

function pickActiveHandle(targets) {
  const active = targets.filter((t) => t.status === 'active')
  if (active.length === 0) return null
  return active[Math.floor(Math.random() * active.length)].value
}

// Returns { phase, targetHandle, actionsToday, nextActionLabel, isPaused }.
// When the baseline mockSystemStatus reports warming_up / setup / paused,
// the state machine is inert — phase stays fixed.
export function useSystemStatus() {
  const targets = useTargetsStore((s) => s.targets)
  const baseline = mockSystemStatus
  const isLive = !['warming_up', 'setup', 'paused'].includes(baseline.state)

  const [phase, setPhase] = useState(
    isLive ? 'analyzing' : baseline.state
  )
  const [targetHandle, setTargetHandle] = useState(
    isLive ? pickActiveHandle(targets) : null
  )
  const [actionsToday, setActionsToday] = useState(
    typeof baseline.actionsToday === 'number' ? baseline.actionsToday : 37
  )
  const targetsRef = useRef(targets)
  targetsRef.current = targets

  useEffect(() => {
    if (!isLive) return

    let cancelled = false
    let timeoutId

    function schedule() {
      const ms = 6000 + Math.random() * 4000
      timeoutId = setTimeout(tick, ms)
    }

    function tick() {
      if (cancelled) return
      setPhase((current) => {
        const next = NEXT_PHASE[current] || 'analyzing'
        if (next === 'following' || next === 'unfollowing') {
          setTargetHandle(pickActiveHandle(targetsRef.current))
        }
        if (next === 'following') {
          setActionsToday((n) => n + 1 + Math.floor(Math.random() * 3))
        }
        return next
      })
      schedule()
    }

    schedule()
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [isLive])

  return {
    phase,
    targetHandle: phase === 'following' || phase === 'unfollowing' ? targetHandle : null,
    actionsToday,
    nextActionLabel: NEXT_LABEL[phase] || '',
    isPaused: baseline.state === 'paused',
  }
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/hooks/useSystemStatus.js
git commit -m "feat(targets-v2): shared useSystemStatus hook with phase state machine"
```

---

## Task 10: Live Activity card (new)

**Files:**
- Create: `src/pages/targets/LiveActivityCard.jsx`
- Modify: `src/pages/targets/index.jsx`

- [ ] **Step 1** — Create `src/pages/targets/LiveActivityCard.jsx`:

```jsx
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useTargetsStore } from '@/stores/useTargetsStore'

// Compact live-activity strip. Monitor-only (no pause/resume control here;
// that lives with the Overview StatusPill popover). Reads from the shared
// useSystemStatus hook so both surfaces tick together.

const PHASE_LABEL = {
  analyzing: 'Analyzing targets',
  following: 'Following',
  unfollowing: 'Unfollowing',
  waiting: 'Pausing between actions',
  warming_up: 'Warming up',
  setup: 'Setup needed',
  paused: 'Paused',
}

function dotToneClass(phase) {
  if (phase === 'warming_up') return 'bg-blue-base'
  if (phase === 'setup' || phase === 'paused') return 'bg-text-muted'
  return 'bg-green-base'
}

function isLivePhase(phase) {
  return (
    phase === 'analyzing' ||
    phase === 'following' ||
    phase === 'unfollowing' ||
    phase === 'waiting'
  )
}

export default function LiveActivityCard({ onOpenTarget }) {
  const { phase, targetHandle, actionsToday, nextActionLabel } = useSystemStatus()
  const targets = useTargetsStore((s) => s.targets)

  // The handle is only tappable when it maps back to a stored target.
  const matchedTarget = targetHandle
    ? targets.find((t) => t.value.toLowerCase() === targetHandle.toLowerCase())
    : null

  const phaseLabel = PHASE_LABEL[phase] || 'Idle'
  const live = isLivePhase(phase)
  const dotClass = dotToneClass(phase)

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface px-4 py-3 lg:px-6 lg:py-4">
      <div className="flex items-center gap-3">
        {/* Left: dot + phase + handle */}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
            {live && (
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotClass}`}
                aria-hidden="true"
              />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
          </span>

          <span className="text-sm font-medium text-text-primary">{phaseLabel}</span>

          {targetHandle && (
            matchedTarget ? (
              <button
                type="button"
                onClick={() => onOpenTarget(matchedTarget)}
                className="truncate text-sm font-medium text-text-primary hover:underline"
              >
                {targetHandle}
              </button>
            ) : (
              <span className="truncate text-sm font-medium text-text-primary">{targetHandle}</span>
            )
          )}

          {phase === 'warming_up' && (
            <span className="truncate text-xs text-text-muted">
              Growth starts within 72 hours
            </span>
          )}
          {phase === 'setup' && (
            <span className="truncate text-xs text-text-muted">
              Add your first target to start
            </span>
          )}
        </div>

        {/* Right: data chips (desktop). */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {phase !== 'setup' && (
            <span className="rounded-full bg-bg px-2 py-1 text-xs">
              <span className="text-text-muted">Today </span>
              <span className="font-medium tabular-nums text-text-primary">
                {actionsToday} actions
              </span>
            </span>
          )}
          {nextActionLabel && (
            <span className="rounded-full bg-bg px-2 py-1 text-xs text-text-muted">
              {nextActionLabel}
            </span>
          )}
        </div>
      </div>

      {/* Mobile secondary line. */}
      {(phase !== 'setup' || nextActionLabel) && (
        <div className="mt-1 text-xs text-text-muted lg:hidden">
          {phase !== 'setup' && <>Today <span className="tabular-nums text-text-secondary">{actionsToday}</span> actions</>}
          {phase !== 'setup' && nextActionLabel && <> · </>}
          {nextActionLabel}
        </div>
      )}
    </section>
  )
}
```

- [ ] **Step 2** — Wire into the page. Replace `src/pages/targets/index.jsx`:

```jsx
import { useState } from 'react'
import SlotsCard from './SlotsCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'
import TargetDetailDrawer from './TargetDetailDrawer'
import RemoveTargetModal from './RemoveTargetModal'
import AddTargetSheet from './AddTargetSheet'
import LiveActivityCard from './LiveActivityCard'

export default function TargetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Targets
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage the accounts and hashtags Kicksta targets for your growth.
        </p>
      </header>

      <LiveActivityCard onOpenTarget={(t) => setDetailTarget(t)} />
      <SlotsCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList onOpen={(t) => setDetailTarget(t)} />

      <AddTargetSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {detailTarget && (
        <TargetDetailDrawer
          target={detailTarget}
          onClose={() => setDetailTarget(null)}
          onRequestRemove={(t) => {
            setDetailTarget(null)
            setRemoveTarget(t)
          }}
        />
      )}

      {removeTarget && (
        <RemoveTargetModal
          target={removeTarget}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </div>
  )
}
```

- [ ] **Step 3** — Commit:

```bash
git add src/pages/targets/LiveActivityCard.jsx src/pages/targets/index.jsx
git commit -m "feat(targets-v2): add live activity card atop the page"
```

---

## Task 11: Refactor Overview `StatusPill` to consume the shared hook

**Files:** Modify `src/pages/overview/index.jsx`.

Goal: replace the current `mockSystemStatus`-derived state inside `StatusPill` with a call to `useSystemStatus` so Overview and Targets stay in lockstep. The pill's visual output and popover behavior stay the same.

- [ ] **Step 1** — Inside `src/pages/overview/index.jsx`, locate the `StatusPill` component (search for `function StatusPill` or the existing `mockSystemStatus` import/usage inside it). Replace the part that currently derives `status.actionLabel` / `status.target` / similar live-phase values with a call to the shared hook.

Specifically:
- Add import at the top of the file:
  ```jsx
  import { useSystemStatus } from '@/hooks/useSystemStatus'
  ```
- Inside `StatusPill`, at the top of the component body, call:
  ```jsx
  const live = useSystemStatus()
  ```
- Replace the derived `actionLabel` + `target` lines that currently read `status.actionLabel`, `status.target` (or their equivalents) with:
  ```jsx
  const actionLabel = {
    analyzing: 'Analyzing targets',
    following: 'Following',
    unfollowing: 'Unfollowing',
    waiting: 'Pausing',
    warming_up: 'Warming up',
    setup: 'Setup needed',
    paused: 'Paused',
  }[live.phase] || 'Idle'
  const target = live.targetHandle
  ```
- The popover content that shows "Pause/Resume" and stats stays unchanged — the popover reads from the baseline `mockSystemStatus` for static fields (started-at, etc.). Do **not** rework the popover in this task.

**Important:** do not change any JSX structure, classes, or popover copy. Only the data source for the phase + target changes. Verify before committing that the pill still compiles and renders.

- [ ] **Step 2** — Self-review by reading the modified file end-to-end; confirm (a) no stale references to the old phase strings, (b) the popover still closes correctly, (c) no removed imports.

- [ ] **Step 3** — Commit:

```bash
git add src/pages/overview/index.jsx
git commit -m "refactor(targets-v2): consume shared useSystemStatus in Overview StatusPill"
```

---

## Task 12: Visual polish pass

**Files:** Any of the above, based on visual review.

- [ ] **Step 1** — Controller runs the preview at desktop + mobile + dark mode; walks the interactions (add flow with typeahead, open drawer, pause, remove, watch the live activity card cycle through phases at least once). Flags any visual drift. Verifies the Overview `StatusPill` advances in lockstep with the Targets card.

- [ ] **Step 2** — Fix anything surfaced. Commit under `chore(targets-v2): polish pass`.

- [ ] **Step 3** — Update `CHANGELOG.md` and `CONTEXT.md` to log the v2 iteration. Commit under `docs: log Targets page v2`.

---

## Spec Coverage Checklist

Against `docs/superpowers/specs/2026-04-23-targets-page-v2-design.md`:

- § 1 Slots card → Task 5.
- § 2 Target row → Tasks 1 (formatCount), 4.
- § 3 Detail drawer → Tasks 2 (HealthPill), 7.
- § 4 Add Target sheet → Tasks 2, 3, 8.
- § 5 Empty state → Task 6.
- § 6 Mock data → Task 3.
- § 7 File-level diff → Distributed across all tasks.
- § 7b Live Activity card + shared hook + StatusPill refactor → Tasks 9, 10, 11.
- § 8 Out of scope → Intentionally not implemented.
