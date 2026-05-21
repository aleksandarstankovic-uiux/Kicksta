# Dashboard State Switcher Widget — P1 Foundation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the floating bottom-right dashboard state switcher widget (P1 of 6 phases). After P1, the widget is visible on every dashboard route and clicking a preset row reseeds all relevant stores so the dashboard reflects the selected state. UI nuances per state (banner closeability, empty states, chart forecast modes, disconnect indicators) ship in P2–P6.

**Architecture:** Imperative seed-on-switch via a single `useDashboardPreset` store. The `applyPreset(name)` action mutates existing stores so most components don't need to change — they keep reading from their normal stores and just see different data. New shared stores wrap the previously-direct `mockUser` / `mockActivity` / `mockGrowthDaily` imports so the preset switcher can reseed them.

**Tech Stack:** React + Zustand + Tailwind v4 + Vite + lucide-react icons. No test framework — verification uses browser preview (Vite Dev Server on port 5173) and grep/DOM checks.

**Spec:** `docs/superpowers/specs/2026-05-21-dashboard-state-switcher-widget-design.md`

---

## File Structure

**New files:**
- `src/stores/useUiState.js` — Preset-related UI state (e.g., `trialBannerDismissed`). Isolated, no other dependencies.
- `src/stores/useUserStore.js` — Replaces direct `mockUser` imports. Single source of truth for `user.{isOnTrial, plan, growthPlusSubscribed, trialEndsAt, createdAt, growthPlusTier, name, email, …}`.
- `src/stores/useActivityFeed.js` — Replaces direct `mockActivity` import.
- `src/stores/useGrowthData.js` — Replaces direct `mockGrowthDaily` import.
- `src/stores/useDashboardPreset.js` — Owns the preset name + `applyPreset()` mutator + localStorage persistence.
- `src/mocks/presets.js` — The 6 preset recipes + grouped preset metadata for the widget.
- `src/components/DashboardPresetWidget.jsx` — The floating widget UI.

**Modified files:**
- `src/stores/useAccounts.js` — Add `setConnectionState(state)` action.
- `src/components/DashboardLayout.jsx` — Mount `<DashboardPresetWidget />`.
- ~15 files importing `mockUser` directly — swap to `useUserStore`. (Listed in Task 4.)
- `src/pages/overview/index.jsx` — swap `mockActivity` and `mockGrowthDaily` direct reads.

**Out of scope for P1:**
- The advanced variant mocks (`mockTargetsEmpty`, `mockGrowthDailyFirstDay`, `mockGrowthDailyLastDay`) — for now presets reuse existing populated mocks or `[]`.
- Banner/empty/chart/disconnect polish — P2–P5.

---

## Task 1: Create `useUiState` store

**Files:**
- Create: `src/stores/useUiState.js`

- [ ] **Step 1: Create the store file**

```js
// src/stores/useUiState.js
import { create } from 'zustand'

// Preset-related UI state that should reset when the user flips the
// dashboard state switcher. Currently holds the closeable trial-banner
// dismissal flag; future preset-aware UI bits land here too.
export const useUiState = create((set) => ({
  trialBannerDismissed: false,
  setTrialBannerDismissed: (dismissed) => set({ trialBannerDismissed: dismissed }),
}))
```

- [ ] **Step 2: Verify the file imports cleanly**

Run:
```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
node --input-type=module -e "import('./src/stores/useUiState.js').then(m => console.log(Object.keys(m)))"
```

Expected: `[ 'useUiState' ]` (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/stores/useUiState.js
git commit -m "feat(state-switcher): add useUiState store for preset-related UI flags"
```

---

## Task 2: Create `useUserStore` store

**Files:**
- Create: `src/stores/useUserStore.js`

- [ ] **Step 1: Create the store file**

```js
// src/stores/useUserStore.js
import { create } from 'zustand'
import { mockUser } from '@/mocks/user'

// Single source of truth for the dashboard user. Components that
// previously did `import { mockUser } from '@/mocks/user'` and read
// `mockUser.isOnTrial` / `.plan` / `.growthPlusSubscribed` etc. now
// pull this from the store so the preset switcher can reseed it.
//
// The full PLAN_CATALOG / mockGrowthPlusNextBillingAt / mockUserGrowthPlus
// exports stay in @/mocks/user — only the live "current user" gets
// hoisted into the store.
export const useUserStore = create((set) => ({
  user: mockUser,
  setUser: (user) => set({ user }),
}))
```

- [ ] **Step 2: Verify the file imports cleanly**

Run:
```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
node --input-type=module -e "import('./src/stores/useUserStore.js').then(m => console.log('user.plan =', m.useUserStore.getState().user.plan))"
```

Expected: `user.plan = advanced` (the default from `mockUser`).

- [ ] **Step 3: Commit**

```bash
git add src/stores/useUserStore.js
git commit -m "feat(state-switcher): add useUserStore wrapping mockUser for preset-driven mutation"
```

---

## Task 3: Create `useActivityFeed` and `useGrowthData` stores

**Files:**
- Create: `src/stores/useActivityFeed.js`
- Create: `src/stores/useGrowthData.js`

- [ ] **Step 1: Create `useActivityFeed`**

```js
// src/stores/useActivityFeed.js
import { create } from 'zustand'
import { mockActivity } from '@/mocks/activity'

// Wraps the mockActivity import so the preset switcher can swap to
// an empty list (or any variant) without changing the consuming
// component. Currently consumed by ActivityFeed on the Overview page.
export const useActivityFeed = create((set) => ({
  items: mockActivity,
  setItems: (items) => set({ items }),
}))
```

- [ ] **Step 2: Create `useGrowthData`**

```js
// src/stores/useGrowthData.js
import { create } from 'zustand'
import { mockGrowthDaily } from '@/mocks/growth'

// Wraps the mockGrowthDaily import so the preset switcher can swap
// to first-day / last-day / empty chart data without changing the
// consuming components (GrowthChart, the three metric sparklines).
export const useGrowthData = create((set) => ({
  daily: mockGrowthDaily,
  setDaily: (daily) => set({ daily }),
}))
```

- [ ] **Step 3: Verify both files import cleanly**

Run:
```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
node --input-type=module -e "Promise.all([import('./src/stores/useActivityFeed.js'), import('./src/stores/useGrowthData.js')]).then(([a, g]) => console.log('activity len =', a.useActivityFeed.getState().items.length, '| growth len =', g.useGrowthData.getState().daily.length))"
```

Expected: `activity len = <N> | growth len = 30` (or whatever the mock sizes are — should be positive integers, no errors).

- [ ] **Step 4: Commit**

```bash
git add src/stores/useActivityFeed.js src/stores/useGrowthData.js
git commit -m "feat(state-switcher): add useActivityFeed + useGrowthData stores wrapping their mocks"
```

---

## Task 4: Migrate all `mockUser` direct readers to `useUserStore`

This is a mechanical refactor across ~15 files. For each file, find every place that imports `mockUser` and uses it INSIDE a React component, and swap to `useUserStore`. Files that import OTHER exports from `@/mocks/user` (e.g., `PLAN_CATALOG`, `mockGrowthPlusNextBillingAt`) keep that import; only the `mockUser` part moves.

**Files to migrate:**
- `src/utils/targetSlots.js`
- `src/components/SystemStatus.jsx`
- `src/pages/growthPlus/index.jsx`
- `src/pages/targeting/AudienceFiltersCard.jsx`
- `src/pages/targeting/AudienceFiltersModal.jsx`
- `src/pages/engagement/WelcomeDmCard.jsx`
- `src/pages/engagement/CloseFriendsCard.jsx`
- `src/pages/overview/index.jsx`
- `src/pages/overview/EngagementSnapshot.jsx`

**Files that import from `@/mocks/user` but DO NOT need to change** (they import other named exports, not `mockUser`):
- `src/components/GrowthPlusManageModal.jsx` — only imports `mockGrowthPlusNextBillingAt`
- `src/components/CancelGrowthPlusModal.jsx` — only `mockGrowthPlusNextBillingAt`
- `src/components/SwitchTierConfirmModal.jsx` — only `mockGrowthPlusNextBillingAt`
- `src/pages/growthPlus/GrowthPlusActive.jsx` — only `mockGrowthPlusNextBillingAt`
- `src/pages/growthPlus/GrowthPlusBillingCard.jsx` — only `mockGrowthPlusNextBillingAt`
- `src/stores/useUserProfile.js` — reads `mockUser` only at module-init time for first/last name split. Leave it; it doesn't need preset reactivity (presets don't change name/email).

- [ ] **Step 1: Confirm the migration scope with grep**

Run:
```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
grep -rn "mockUser\." src --include="*.jsx" --include="*.js" | grep -v "/mocks/" | grep -v "/stores/useUserProfile.js"
```

Expected: A list of lines using `mockUser.<something>` across the files above (excluding `useUserProfile.js` which legitimately reads it at init). The exact line count varies but should match the 9 source files listed.

- [ ] **Step 2: Migrate `src/utils/targetSlots.js`**

This is a utility module (not a React component), so it reads with `useUserStore.getState()` instead of the hook.

Open the file and locate:
```js
import { mockUser } from '@/mocks/user'
```

Replace with:
```js
import { useUserStore } from '@/stores/useUserStore'
```

Then anywhere `mockUser.<field>` is read, change it to `useUserStore.getState().user.<field>`. Read the file to find every usage and replace.

- [ ] **Step 3: Migrate the 8 React-component files**

For each of these 8 files:

1. `src/components/SystemStatus.jsx`
2. `src/pages/growthPlus/index.jsx`
3. `src/pages/targeting/AudienceFiltersCard.jsx`
4. `src/pages/targeting/AudienceFiltersModal.jsx`
5. `src/pages/engagement/WelcomeDmCard.jsx`
6. `src/pages/engagement/CloseFriendsCard.jsx`
7. `src/pages/overview/index.jsx`
8. `src/pages/overview/EngagementSnapshot.jsx`

Apply this transformation pattern:

**Find the import line:**
```js
import { mockUser } from '@/mocks/user'
// or combined:
import { mockUser, PLAN_CATALOG } from '@/mocks/user'
```

**Replace with:**
```js
import { useUserStore } from '@/stores/useUserStore'
// keep PLAN_CATALOG if it was being imported:
import { PLAN_CATALOG } from '@/mocks/user'
```

**Inside the component body, find usages like:**
```js
const isAdvanced = mockUser.plan === 'advanced'
// or
{mockUser.isOnTrial && (...)}
// or
const user = mockUser
```

**Replace with:**
```js
const user = useUserStore((s) => s.user)
// then use user.plan, user.isOnTrial, etc.
```

**Special case for `src/pages/overview/index.jsx`** — it currently has:
```js
const user = mockUser
```
(or similar) and composes an effective user from the preset stores. Replace `mockUser` with `useUserStore((s) => s.user)` at the source. The G+ composition logic stays (it reads from `useGrowthPlusSubscription` and `useGrowthConfig` to overlay tier/subscribed state).

**Special case for `src/pages/overview/EngagementSnapshot.jsx`** — currently has `const isAdvanced = mockUser.plan === 'advanced'`. Convert to:
```js
const isAdvanced = useUserStore((s) => s.user.plan === 'advanced')
```

- [ ] **Step 4: Verify no more `mockUser.` reads remain (except `useUserProfile.js`)**

Run:
```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
grep -rn "mockUser\." src --include="*.jsx" --include="*.js" | grep -v "/mocks/" | grep -v "/stores/useUserProfile.js"
```

Expected: Empty output (no matches).

- [ ] **Step 5: Verify the dev server still renders the Overview cleanly**

Start the dev server (or reuse the running one) and check the Overview page:

```bash
# If dev server isn't running:
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
npx vite &
```

Open `http://localhost:5173/` in a browser (or use the Claude Preview tool if available). The Overview page should render identically to before — same Account card with @alexjohnson.co + Advanced + Trial pills, same 3 metric cards, same chart, same activity feed, same Audit/G+ row, same bottom block.

Console should be free of errors.

- [ ] **Step 6: Commit**

```bash
git add src/utils/targetSlots.js src/components/SystemStatus.jsx src/pages/growthPlus/index.jsx src/pages/targeting/AudienceFiltersCard.jsx src/pages/targeting/AudienceFiltersModal.jsx src/pages/engagement/WelcomeDmCard.jsx src/pages/engagement/CloseFriendsCard.jsx src/pages/overview/index.jsx src/pages/overview/EngagementSnapshot.jsx
git commit -m "refactor(state-switcher): migrate mockUser direct readers to useUserStore"
```

---

## Task 5: Migrate `mockActivity` and `mockGrowthDaily` direct readers

**Files:**
- Modify: `src/pages/overview/index.jsx`

Both `mockActivity` and `mockGrowthDaily` are read in exactly one file (`src/pages/overview/index.jsx`). Migration is small.

- [ ] **Step 1: Confirm scope**

Run:
```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
grep -n "mockActivity\b" src/pages/overview/index.jsx
grep -n "mockGrowthDaily\b" src/pages/overview/index.jsx
```

Expected: Both grep commands return matches (the import lines + usage lines).

- [ ] **Step 2: Migrate `mockActivity` usage**

In `src/pages/overview/index.jsx`:

**Find the import:**
```js
import { mockActivity } from '@/mocks/activity'
```

**Replace with:**
```js
import { useActivityFeed } from '@/stores/useActivityFeed'
```

**Find the usage** (likely something like `<ActivityFeed items={mockActivity} ... />`):

Replace the `mockActivity` reference with a read from the store. Inside the `OverviewPage` component body, add:

```js
const activityItems = useActivityFeed((s) => s.items)
```

Then replace `mockActivity` in the JSX with `activityItems`.

- [ ] **Step 3: Migrate `mockGrowthDaily` usage**

**Find the import:**
```js
import {
  mockGrowthDaily,
} from '@/mocks/growth'
```

The import block may include other exports (e.g., `mockGrowthPlusInsights` in earlier session work, but that was removed). Update to remove `mockGrowthDaily` from the import. If the block becomes empty, delete it entirely. Add:

```js
import { useGrowthData } from '@/stores/useGrowthData'
```

**Find the usages** (probably 2 places — `GrowthChart` and one of the metric cards / sparkline data):

Inside `OverviewPage`, add:
```js
const growthDaily = useGrowthData((s) => s.daily)
```

Replace every `mockGrowthDaily` reference in the JSX with `growthDaily`. The three metric components (TotalFollowersMetric, FollowersGainedMetric, FollowBackRateMetric) receive `data={mockGrowthDaily}` — change to `data={growthDaily}`. The GrowthChart receives `data={mockGrowthDaily}` — same swap.

- [ ] **Step 4: Verify the file no longer references the raw mocks**

Run:
```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
grep -n "mockActivity\b\|mockGrowthDaily\b" src/pages/overview/index.jsx
```

Expected: Empty output.

- [ ] **Step 5: Verify the Overview page still renders**

Reload `/` in the browser. The Overview should look identical to before — same chart data, same activity entries, same metric values. No console errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/overview/index.jsx
git commit -m "refactor(state-switcher): migrate mockActivity + mockGrowthDaily reads to their stores"
```

---

## Task 6: Extend `useAccounts` with `setConnectionState` action

**Files:**
- Modify: `src/stores/useAccounts.js`

The preset switcher needs to flip `connectionState` on the active account. `useAccounts` currently has `setActiveId` but no way to mutate the active account's connection state.

- [ ] **Step 1: Read the current store**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
cat src/stores/useAccounts.js
```

- [ ] **Step 2: Add `setConnectionState` action**

The current store body looks like:
```js
export const useAccounts = create((set) => ({
  accounts: mockAccounts,
  activeId: defaultActiveAccountId,
  setActiveId: (id) => set({ activeId: id }),
}))
```

Replace it with:
```js
export const useAccounts = create((set) => ({
  accounts: mockAccounts,
  activeId: defaultActiveAccountId,
  setActiveId: (id) => set({ activeId: id }),
  // Flips the connectionState on the currently-active account. Used
  // by the dashboard preset switcher so disconnected presets can be
  // applied without touching the rest of the accounts array.
  setConnectionState: (connectionState) =>
    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === state.activeId ? { ...a, connectionState } : a
      ),
    })),
}))
```

- [ ] **Step 3: Verify it works**

Run:
```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
node --input-type=module -e "
import('./src/stores/useAccounts.js').then(({ useAccounts }) => {
  const before = useAccounts.getState().accounts.find(a => a.id === useAccounts.getState().activeId).connectionState
  useAccounts.getState().setConnectionState('disconnected')
  const after = useAccounts.getState().accounts.find(a => a.id === useAccounts.getState().activeId).connectionState
  console.log('before:', before, '| after:', after)
})
"
```

Expected: `before: connected | after: disconnected`.

- [ ] **Step 4: Commit**

```bash
git add src/stores/useAccounts.js
git commit -m "feat(state-switcher): add setConnectionState action to useAccounts"
```

---

## Task 7: Define preset recipes in `src/mocks/presets.js`

**Files:**
- Create: `src/mocks/presets.js`

This module defines the 6 preset recipes (each is a data bundle that `seedAllStores` consumes) plus a grouped metadata structure for the widget UI.

- [ ] **Step 1: Create the file**

```js
// src/mocks/presets.js
import { mockUser } from '@/mocks/user'
import { mockTargets } from '@/mocks/targets'
import { mockWhitelist } from '@/mocks/whitelist'
import { mockBlacklist } from '@/mocks/blacklist'
import { mockActivity } from '@/mocks/activity'
import { mockGrowthDaily } from '@/mocks/growth'

// Helpers to anchor dates relative to "now" so the trial windows
// stay meaningful regardless of when the dashboard is opened.
const now = () => new Date()
const daysFromNow = (n) => new Date(Date.now() + n * 24 * 60 * 60 * 1000)
const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000)

// 11pm-today helper for "trial ends today" cases — mirrors the
// existing logic in @/mocks/user so the last-day banner fires.
const trialEndsToday11pm = () => {
  const d = new Date()
  d.setHours(23, 0, 0, 0)
  return d.toISOString()
}

const userFirstTrialDay = {
  ...mockUser,
  isOnTrial: true,
  createdAt: now().toISOString(),
  trialEndsAt: daysFromNow(7).toISOString(),
  growthPlusSubscribed: false,
  growthPlusTier: null,
}

const userLastTrialDay = {
  ...mockUser,
  isOnTrial: true,
  createdAt: daysAgo(7).toISOString(),
  trialEndsAt: trialEndsToday11pm(),
  growthPlusSubscribed: false,
  growthPlusTier: null,
}

const userTrialDisconnected = {
  ...mockUser,
  isOnTrial: true,
  createdAt: daysAgo(3).toISOString(),
  trialEndsAt: daysFromNow(4).toISOString(),
  growthPlusSubscribed: false,
  growthPlusTier: null,
}

const userActive = {
  ...mockUser,
  isOnTrial: false,
  trialEndsAt: null,
  growthPlusSubscribed: false,
  growthPlusTier: null,
}

// The default preset that loads on first visit (no localStorage entry).
// Matches the current dashboard default — active subscription, IG
// connected, full data populated.
export const DEFAULT_PRESET = 'active-populated'

// Each recipe is consumed by `seedAllStores()` in useDashboardPreset.
// Keep keys aligned with what seedAllStores reads.
export const PRESETS = {
  'trial-first-day': {
    label: 'Trial — First day',
    user: userFirstTrialDay,
    connectionState: 'connected',
    targets: [],
    whitelist: [],
    blacklist: [],
    activity: [],
    growthDaily: mockGrowthDaily, // P4 will swap to a forecast-only variant
    auditDownloadedAt: null,
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
  'trial-last-day': {
    label: 'Trial — Last day',
    user: userLastTrialDay,
    connectionState: 'connected',
    targets: mockTargets,
    whitelist: mockWhitelist,
    blacklist: mockBlacklist,
    activity: mockActivity,
    growthDaily: mockGrowthDaily,
    auditDownloadedAt: null,
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
  'trial-disconnected': {
    label: 'Trial — Disconnected',
    user: userTrialDisconnected,
    connectionState: 'disconnected',
    targets: [],
    whitelist: [],
    blacklist: [],
    activity: [],
    growthDaily: mockGrowthDaily,
    auditDownloadedAt: null,
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
  'active-empty': {
    label: 'Active — Empty',
    user: userActive,
    connectionState: 'connected',
    targets: [],
    whitelist: [],
    blacklist: [],
    activity: [],
    growthDaily: mockGrowthDaily, // P3 may swap to an empty variant
    auditDownloadedAt: null,
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
  'active-populated': {
    label: 'Active — Populated',
    user: userActive,
    connectionState: 'connected',
    targets: mockTargets,
    whitelist: mockWhitelist,
    blacklist: mockBlacklist,
    activity: mockActivity,
    growthDaily: mockGrowthDaily,
    auditDownloadedAt: new Date().toISOString(),
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
  'active-disconnected': {
    label: 'Active — Disconnected',
    user: userActive,
    connectionState: 'disconnected',
    targets: mockTargets,
    whitelist: mockWhitelist,
    blacklist: mockBlacklist,
    activity: mockActivity,
    growthDaily: mockGrowthDaily,
    auditDownloadedAt: null,
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
}

// Grouped metadata for the widget UI — controls the section labels
// and the per-row description copy. Order here is order in the panel.
export const PRESET_GROUPS = [
  {
    label: 'Trial',
    presets: [
      {
        id: 'trial-first-day',
        label: 'Trial — First day',
        description: 'No targets yet, forecast-only chart.',
      },
      {
        id: 'trial-last-day',
        label: 'Trial — Last day',
        description: 'Ends today, banner shows.',
      },
      {
        id: 'trial-disconnected',
        label: 'Trial — Disconnected',
        description: 'Mid-trial, IG disconnected.',
      },
    ],
  },
  {
    label: 'Active',
    presets: [
      {
        id: 'active-empty',
        label: 'Active — Empty',
        description: 'Just connected, no data.',
      },
      {
        id: 'active-populated',
        label: 'Active — Populated',
        description: 'Normal full dashboard.',
      },
    ],
  },
  {
    label: 'Disconnected',
    presets: [
      {
        id: 'active-disconnected',
        label: 'Active — Disconnected',
        description: 'Subscription active, IG dropped.',
      },
    ],
  },
]

// Two-letter abbreviation shown in the badge on the collapsed widget
// button so the user sees the active preset without opening the panel.
export const PRESET_ABBREV = {
  'trial-first-day': 'T1',
  'trial-last-day': 'T7',
  'trial-disconnected': 'TX',
  'active-empty': 'A0',
  'active-populated': 'AP',
  'active-disconnected': 'AX',
}
```

- [ ] **Step 2: Verify the module loads**

Run:
```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
node --input-type=module -e "
import('./src/mocks/presets.js').then((m) => {
  console.log('preset count:', Object.keys(m.PRESETS).length)
  console.log('default:', m.DEFAULT_PRESET)
  console.log('groups:', m.PRESET_GROUPS.map(g => g.label).join(', '))
})
"
```

Expected:
```
preset count: 6
default: active-populated
groups: Trial, Active, Disconnected
```

- [ ] **Step 3: Commit**

```bash
git add src/mocks/presets.js
git commit -m "feat(state-switcher): define 6 preset recipes + grouped metadata"
```

---

## Task 8: Create `useDashboardPreset` store with `applyPreset` + localStorage

**Files:**
- Create: `src/stores/useDashboardPreset.js`

- [ ] **Step 1: Create the store file**

```js
// src/stores/useDashboardPreset.js
import { create } from 'zustand'
import { useUserStore } from '@/stores/useUserStore'
import { useAccounts } from '@/stores/useAccounts'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { useLists } from '@/stores/useLists'
import { useActivityFeed } from '@/stores/useActivityFeed'
import { useGrowthData } from '@/stores/useGrowthData'
import { useInstagramAudit } from '@/stores/useInstagramAudit'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import { useUiState } from '@/stores/useUiState'
import { useToasts } from '@/stores/useToasts'
import { PRESETS, DEFAULT_PRESET } from '@/mocks/presets'

const STORAGE_KEY = 'kicksta-dashboard-preset'

function loadPreset() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && PRESETS[stored]) return stored
  } catch {
    // localStorage unavailable (SSR, sandboxed iframe, etc.)
  }
  return DEFAULT_PRESET
}

function savePreset(presetId) {
  try {
    localStorage.setItem(STORAGE_KEY, presetId)
  } catch {
    // ignore — saving is a nice-to-have
  }
}

function clearStoredPreset() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore
  }
}

// Imperative seed: mutates every store the dashboard reads from so
// the entire UI snaps to the preset. Called by applyPreset() AND on
// module load if a stored preset != default exists in localStorage.
function seedAllStores(presetId) {
  const recipe = PRESETS[presetId]
  if (!recipe) return
  useUserStore.setState({ user: recipe.user })
  useAccounts.getState().setConnectionState(recipe.connectionState)
  useTargetsStore.setState({ targets: recipe.targets })
  useLists.setState({ whitelist: recipe.whitelist, blacklist: recipe.blacklist })
  useActivityFeed.setState({ items: recipe.activity })
  useGrowthData.setState({ daily: recipe.growthDaily })
  useInstagramAudit.setState({ lastDownloadedAt: recipe.auditDownloadedAt })
  useGrowthPlusSubscription.setState({
    subscribed: recipe.growthPlusSubscribed,
    status: recipe.growthPlusStatus,
  })
  useUiState.setState({ trialBannerDismissed: false })
}

const initialPreset = loadPreset()

export const useDashboardPreset = create((set) => ({
  preset: initialPreset,
  applyPreset: (name) => {
    if (!PRESETS[name]) return
    seedAllStores(name)
    savePreset(name)
    set({ preset: name })
    useToasts.getState().addToast({
      message: `State: ${PRESETS[name].label}`,
      tone: 'success',
    })
  },
  reset: () => {
    clearStoredPreset()
    seedAllStores(DEFAULT_PRESET)
    set({ preset: DEFAULT_PRESET })
    useToasts.getState().addToast({
      message: 'Reset to default state.',
      tone: 'success',
    })
  },
}))

// If the user previously saved a non-default preset, apply it now so
// the dashboard boots into that state. Synchronous at module load so
// there's no flash of default content before the preset takes hold.
if (initialPreset !== DEFAULT_PRESET) {
  seedAllStores(initialPreset)
}
```

- [ ] **Step 2: Verify the module loads + smoke-tests `applyPreset`**

Run:
```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
node --input-type=module -e "
import('./src/stores/useDashboardPreset.js').then(async ({ useDashboardPreset }) => {
  const { useUserStore } = await import('./src/stores/useUserStore.js')
  const { useTargetsStore } = await import('./src/stores/useTargetsStore.js')
  console.log('initial preset:', useDashboardPreset.getState().preset)
  console.log('initial isOnTrial:', useUserStore.getState().user.isOnTrial)
  console.log('initial targets:', useTargetsStore.getState().targets.length)
  useDashboardPreset.getState().applyPreset('trial-first-day')
  console.log('after trial-first-day → isOnTrial:', useUserStore.getState().user.isOnTrial)
  console.log('after trial-first-day → targets:', useTargetsStore.getState().targets.length)
  useDashboardPreset.getState().applyPreset('active-populated')
  console.log('after active-populated → isOnTrial:', useUserStore.getState().user.isOnTrial)
  console.log('after active-populated → targets:', useTargetsStore.getState().targets.length)
})
"
```

Expected:
```
initial preset: active-populated
initial isOnTrial: true       (mockUser default has isOnTrial: true)
initial targets: <N>          (mockTargets length)
after trial-first-day → isOnTrial: true
after trial-first-day → targets: 0
after active-populated → isOnTrial: false
after active-populated → targets: <N>          (mockTargets length, > 0)
```

The `isOnTrial: true` for initial state matches the current `mockUser` default — that's correct because we haven't applied any preset yet at module init when default == active-populated.

- [ ] **Step 3: Commit**

```bash
git add src/stores/useDashboardPreset.js
git commit -m "feat(state-switcher): add useDashboardPreset store with applyPreset + localStorage persistence"
```

---

## Task 9: Build the `DashboardPresetWidget` component

**Files:**
- Create: `src/components/DashboardPresetWidget.jsx`

The widget has two visual states: collapsed (floating circular button) and expanded (popover with 6 preset rows). Uses the shared outside-click hook.

- [ ] **Step 1: Create the component file**

```jsx
// src/components/DashboardPresetWidget.jsx
import { useRef, useState } from 'react'
import { Sliders, X } from 'lucide-react'
import { useDashboardPreset } from '@/stores/useDashboardPreset'
import { PRESET_GROUPS, PRESET_ABBREV, DEFAULT_PRESET } from '@/mocks/presets'
import useDismissOnOutsideClick from '@/hooks/useDismissOnOutsideClick'

// Floating bottom-right dev widget that flips the dashboard between
// canonical preset states. See docs/superpowers/specs/2026-05-21-…
// for the design. Mounted in DashboardLayout so it appears on every
// dashboard route; doesn't appear in signup (which renders outside
// DashboardLayout).
export default function DashboardPresetWidget() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const preset = useDashboardPreset((s) => s.preset)
  const applyPreset = useDashboardPreset((s) => s.applyPreset)
  const reset = useDashboardPreset((s) => s.reset)

  useDismissOnOutsideClick(ref, open, () => setOpen(false))

  const abbrev = PRESET_ABBREV[preset] ?? '?'
  const isDefault = preset === DEFAULT_PRESET

  return (
    <div
      ref={ref}
      // Bottom-right anchored. Above the mobile bottom tab bar (≈64px
      // + safe area), tighter on desktop. z-40 to clear the dashboard
      // content but stay under modals (z-50).
      className="fixed right-4 bottom-[80px] z-40 sm:bottom-4"
    >
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open dashboard state switcher (current: ${abbrev})`}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-text-primary text-bg shadow-xl transition-opacity hover:opacity-90"
        >
          <Sliders className="h-5 w-5" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-base px-1.5 text-[10px] font-semibold uppercase tracking-wide text-white"
          >
            {abbrev}
          </span>
        </button>
      )}

      {open && (
        <div className="w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold text-text-primary">
              Dashboard state
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {PRESET_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  {group.label}
                </p>
                {group.presets.map((p) => {
                  const selected = preset === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        applyPreset(p.id)
                        setOpen(false)
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                        selected
                          ? 'border-l-2 border-blue-base bg-blue-tint'
                          : 'hover:bg-bg/50'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          selected ? 'bg-blue-base' : 'bg-border'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary">
                          {p.label}
                        </div>
                        <div className="text-xs text-text-muted">
                          {p.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={() => {
                reset()
                setOpen(false)
              }}
              disabled={isDefault}
              className="text-sm font-medium text-blue-text transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset to default
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify the file parses (no JSX syntax errors)**

Run:
```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
npx vite build --logLevel error 2>&1 | tail -20
```

Expected: Vite build completes without errors mentioning `DashboardPresetWidget.jsx`. (Other warnings about unrelated files are OK — we're only checking this file parses.) If you don't want to wait for a full build, the dev server will surface JSX errors immediately when the file is imported in Task 10.

- [ ] **Step 3: Commit**

```bash
git add src/components/DashboardPresetWidget.jsx
git commit -m "feat(state-switcher): add DashboardPresetWidget — collapsed button + expanded panel"
```

---

## Task 10: Mount the widget in `DashboardLayout`

**Files:**
- Modify: `src/components/DashboardLayout.jsx`

- [ ] **Step 1: Locate the layout's render output**

Open `src/components/DashboardLayout.jsx` and find the default export's return JSX. It should be the wrapper that contains the sidebar + main `<Outlet />`.

- [ ] **Step 2: Import and mount `DashboardPresetWidget`**

Add to the imports near the top of the file:

```jsx
import DashboardPresetWidget from '@/components/DashboardPresetWidget'
```

In the default export's return JSX, add `<DashboardPresetWidget />` as a SIBLING of the layout's outermost container (so the `fixed` positioning isn't constrained by any nested layout). A safe spot: just before the closing wrapper `</>` or `</div>` of the component's return.

Example placement (adapt to whatever the wrapper is):

```jsx
return (
  <>
    {/* …existing layout: sidebar, top header, main with Outlet… */}
    <ToastContainer />
    <DashboardPresetWidget />
  </>
)
```

If the component uses a single root `<div>` wrapper instead of a fragment, place `<DashboardPresetWidget />` at the bottom of that wrapper, after `<ToastContainer />` if present.

- [ ] **Step 3: Verify the widget appears in the browser**

Reload `http://localhost:5173/`. Expected: A small circular dark button appears bottom-right (or bottom-mid-right on mobile) with a blue "AP" badge in the corner. No console errors.

Quick DOM check from the preview:
```bash
# Using the Claude Preview tool if available, evaluate:
document.querySelector('[aria-label^="Open dashboard state switcher"]')
```

Expected: a DOM node, not null.

- [ ] **Step 4: Verify clicking it opens the panel**

In the browser, click the widget. Expected: The popover opens above/at the button, showing three section labels ("TRIAL", "ACTIVE", "DISCONNECTED") and six preset rows. The "Active — Populated" row should show a blue accent (selected).

- [ ] **Step 5: Verify clicking a different preset reseeds**

Click "Trial — First day". Expected:
- Popover closes.
- Toast appears: "State: Trial — First day"
- The widget badge changes from "AP" to "T1".
- The Overview page changes: the trial banner / trial pill appears, the 3 metric cards show empty or zero values, the targets list (TopTargetsOverview) shows the "No targets yet" empty state, the activity feed shows the empty state (whatever it currently renders for an empty list).

Some visuals will still be imperfect (forecast-only chart mode and disconnected banner persistence ship in P2–P4). That's expected — P1 only validates the architecture works.

Re-open the widget and click "Active — Populated" to return to the default state.

- [ ] **Step 6: Verify persistence**

Click "Trial — Last day". Reload the page (`Cmd/Ctrl+R`). Expected: The dashboard reboots into Trial — Last day (trial banner visible, etc.). Widget badge shows "T7".

Click "Reset to default" in the widget. Reload. Expected: The dashboard boots into Active — Populated (badge "AP"). The "Reset to default" link is now disabled.

- [ ] **Step 7: Commit**

```bash
git add src/components/DashboardLayout.jsx
git commit -m "feat(state-switcher): mount DashboardPresetWidget in DashboardLayout"
```

---

## Task 11: Final smoke-verify all 6 presets

This is a manual verification pass — no new code. Confirm each of the 6 presets actually flips the underlying data.

- [ ] **Step 1: Run the dev server**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash/.claude/worktrees/charming-mclean-f09825"
npx vite
```

Open `http://localhost:5173/` and ensure no console errors.

- [ ] **Step 2: Cycle through each preset and verify**

For each of the 6 presets, click the preset in the widget and verify the listed DOM/data signals via the browser console (or the Claude Preview tool):

**Verification snippet** (paste in the console after each preset selection):

```js
const u = window.__stores?.user?.getState?.()?.user
// Or directly via the React DevTools, or by exposing stores on window in dev only.
// For a quick check without exposed stores, just verify the rendered page:
const hasTrialBanner = !!document.querySelector('p')?.textContent?.includes('trial ends')
const hasTrialPill = Array.from(document.querySelectorAll('span')).some(s => s.textContent === 'Trial')
const hasGrowthPlusPill = !!Array.from(document.querySelectorAll('span')).find(s => s.textContent.trim() === 'Growth+')
const accountCardPills = Array.from(document.querySelectorAll('span')).filter(s => ['Advanced', 'Growth', 'Trial', 'Growth+'].includes(s.textContent.trim())).map(s => s.textContent.trim())
const targetsEmpty = !!document.querySelector('h3')?.textContent?.includes('No targets yet')
console.table({ hasTrialBanner, hasTrialPill, hasGrowthPlusPill, accountCardPills: accountCardPills.join(','), targetsEmpty })
```

Expected per preset:

| Preset | hasTrialPill | accountCardPills | targetsEmpty |
|---|---|---|---|
| Trial — First day | true | Advanced, Trial | true |
| Trial — Last day | true | Advanced, Trial | false |
| Trial — Disconnected | true | Advanced, Trial | true |
| Active — Empty | false | Advanced | true |
| Active — Populated | false | Advanced | false |
| Active — Disconnected | false | Advanced | false |

Notes:
- `hasGrowthPlusPill` should be `false` for all 6 presets in P1 — recipes set `growthPlusSubscribed: false`. The pill only shows when subscribed.
- `accountCardPills` order may vary; just check the set of pills is correct.
- The "Trial" pill ONLY appears when `isOnTrial` is true. The "Advanced" pill always shows the plan.
- `targetsEmpty` for Trial — Disconnected and Active — Disconnected will depend on whether their preset has `targets: []` or `targets: mockTargets`. Verify against `src/mocks/presets.js` for each.

Some pages (Targeting, Engagement) will still have rough edges in disconnected presets — those polish items are P2 work. P1 success criterion: every preset successfully mutates the underlying stores, no console errors, widget badge updates.

- [ ] **Step 3: Update CHANGELOG.md**

Open `CHANGELOG.md` and add a new H2 entry above the most recent date entry:

```markdown
## 2026-05-21 — Dashboard state switcher widget (P1 foundation)

Foundation pass for the floating bottom-right widget that flips the dashboard between 6 canonical preset states (Trial — First/Last/Disconnected, Active — Empty/Populated/Disconnected). Imperative seed-on-switch architecture: `useDashboardPreset.applyPreset(name)` mutates the underlying stores so most components keep working unchanged. P2–P6 (banner system, empty states, chart forecast modes, disconnect polish) ship next.

### Added
- **`src/stores/useDashboardPreset.js`** — owns the preset name + applyPreset + reset + localStorage persistence (key: `kicksta-dashboard-preset`). Synchronously reseeds all stores on module load if a non-default preset was previously selected, so there's no flash of default content on refresh.
- **`src/stores/useUserStore.js`** — single source of truth for the dashboard user (`isOnTrial`, `plan`, `growthPlusSubscribed`, `trialEndsAt`, `createdAt`, `growthPlusTier`, etc.). Wraps the previously-direct `mockUser` imports so the preset switcher can reseed.
- **`src/stores/useActivityFeed.js`** — wraps `mockActivity`.
- **`src/stores/useGrowthData.js`** — wraps `mockGrowthDaily`.
- **`src/stores/useUiState.js`** — preset-related UI flags (`trialBannerDismissed` is the first inhabitant).
- **`src/mocks/presets.js`** — the 6 preset recipes + grouped metadata + abbreviation map for the widget badge.
- **`src/components/DashboardPresetWidget.jsx`** — floating bottom-right widget with a collapsed circular button + expanded popover.

### Changed
- **`src/stores/useAccounts.js`** — added `setConnectionState(state)` action so presets can flip the active account's connection state without rewriting the whole accounts array.
- **`src/components/DashboardLayout.jsx`** — mounts `<DashboardPresetWidget />` so the widget appears on every dashboard route. Signup routes don't include DashboardLayout, so the widget naturally doesn't appear there.
- **~9 files** — direct `mockUser` reads swapped to `useUserStore`. `mockActivity` + `mockGrowthDaily` reads in Overview swapped to `useActivityFeed` + `useGrowthData`. Files that import other named exports from `@/mocks/user` (e.g., `PLAN_CATALOG`, `mockGrowthPlusNextBillingAt`) keep those imports unchanged.

### Decisions (locked, don't revisit)
- **The widget ships visible in current builds.** It's a dev / QA affordance; we'll gate it behind `import.meta.env.DEV` (or remove it entirely) before the real V1 production launch.
- **Imperative seed-on-switch, not preset overlay.** Components read from existing stores; the preset switcher mutates those stores. Only a small set of components (GrowthChart, InstagramAuditCard, TrialBanner — wired in P2–P5) will read the preset name directly when their behavior can't be expressed by data alone.
- **`localStorage` key: `kicksta-dashboard-preset`.** Reset clears the key and returns to `active-populated`.
```

- [ ] **Step 4: Commit the changelog**

```bash
git add CHANGELOG.md
git commit -m "docs(changelog): log P1 of dashboard state switcher"
```

- [ ] **Step 5: Push**

```bash
git push origin claude/charming-mclean-f09825:main
```

P1 is shipped. P2 (banner system) is the next plan.

---

## Self-review notes (for the implementer)

If during execution any of these come up:

1. **Two stores both initialize with default mock data.** When `useUserStore` and `useDashboardPreset` both import at module load and the stored preset != default, the order of import resolution affects whether the user briefly sees default content before the preset takes hold. The synchronous `seedAllStores()` call at the bottom of `useDashboardPreset.js` is meant to fix this. If you notice a flash, verify that `useDashboardPreset.js` is imported in `DashboardLayout.jsx` BEFORE any render — adding `import { useDashboardPreset } from '@/stores/useDashboardPreset'` to `DashboardLayout.jsx` (even if unused at first) forces the module to load early.

2. **Toast spam on initial seed.** The synchronous seed on module load shouldn't fire a toast (we only want the toast on explicit user action). Verify `seedAllStores()` doesn't trigger toasts on its own — only `applyPreset()` does (it calls `seedAllStores` THEN fires a toast). The bottom-of-file `if (initialPreset !== DEFAULT_PRESET) seedAllStores(initialPreset)` is correct — it doesn't fire a toast.

3. **Widget z-index conflicts with modals.** Modals use `z-50`; widget uses `z-40`. If a modal opens, the widget should be behind it. Verify by opening (e.g.) the Pause Growth modal and confirming the widget is below the modal overlay.

4. **`useUserProfile.js` still reads `mockUser.name` at module init.** This is intentional — useUserProfile is about profile editing (name/email/phone) and presets don't change those fields. Leaving it untouched.

5. **`useGrowthPlusSubscription.subscribed` is initially `null`.** Presets explicitly set it to `false`. If you see `null` after applying a preset, double-check the recipe in `presets.js` and `seedAllStores()` in `useDashboardPreset.js`.
