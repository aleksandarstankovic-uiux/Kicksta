# Dashboard State Switcher Widget — Design

> **Status:** Approved (2026-05-21). Implementation plan to follow via writing-plans.
> **Type:** Internal dev / QA affordance shipped in current builds. Stays visible until pulled before real V1 production launch.

---

## Goal

Build a floating Intercom-style widget anchored bottom-right of every dashboard page that flips the entire dashboard between a fixed set of canonical "states" so we can verify each one without writing test harnesses or manually editing mocks. Selected state persists across reloads. Switching states fully reseeds the underlying data — no merge logic.

The widget is the entry point for a broader effort: making every dashboard surface render correctly across 6 canonical states. The widget is just the foundation; per-state behaviors (banners, empty states, chart forecast modes, connection indicators) are tracked here too.

---

## The 6 canonical presets

| # | Preset id | Label | `isOnTrial` | Connection | Targets / Lists / Activity | Chart | Audit | G+ |
|---|---|---|---|---|---|---|---|---|
| 1 | `trial-first-day` | Trial — First day | true (`createdAt: now`, `trialEndsAt: +7d`) | connected | empty | forecast-only | disabled | not subscribed |
| 2 | `trial-last-day` | Trial — Last day | true (`createdAt: -7d`, `trialEndsAt: today 23:00`) | connected | populated | half real + half forecast | disabled | not subscribed |
| 3 | `trial-disconnected` | Trial — Disconnected | true (mid-trial) | disconnected | empty | forecast-only | disabled | not subscribed |
| 4 | `active-empty` | Active — Empty | false | connected | empty | empty | not generated | not subscribed |
| 5 | `active-populated` | Active — Populated | false | connected | populated | real-only | generated | not subscribed |
| 6 | `active-disconnected` | Active — Disconnected | false | disconnected | populated (cached) | real-only | not generated | not subscribed |

Default on first load (no localStorage entry): `active-populated` (= today's default). Changing this is one line.

---

## Architecture — how state-switching works

### Single source of truth: `useDashboardPreset`

```js
// src/stores/useDashboardPreset.js
export const useDashboardPreset = create((set, get) => ({
  preset: loadFromLocalStorage() ?? 'active-populated',
  applyPreset: (name) => {
    set({ preset: name })
    saveToLocalStorage(name)
    seedAllStores(name)
  },
  reset: () => {
    localStorage.removeItem('kicksta-dashboard-preset')
    set({ preset: 'active-populated' })
    seedAllStores('active-populated')
  },
}))
```

`localStorage` key: `kicksta-dashboard-preset`.

### Imperative seed-on-switch (`seedAllStores`)

A single function in the preset module maps preset id → store mutations. Each preset is a "recipe":

```js
const PRESETS = {
  'trial-first-day': {
    user: { ...mockUserBase, isOnTrial: true, createdAt: now(), trialEndsAt: now() + 7d },
    connectionState: 'connected',
    targets: [],
    whitelist: [],
    blacklist: [],
    activity: [],
    growthDaily: mockGrowthDailyFirstDay,   // forecast-only chart data
    auditDownloadedAt: null,
    growthPlusSubscribed: false,
    growthPlusStatus: 'lapsed',
  },
  // ...one entry per preset
}

function seedAllStores(presetId) {
  const r = PRESETS[presetId]
  // Mutate every relevant store
  useUserStore.setState({ user: r.user })            // NEW store, replaces direct mockUser imports
  useAccounts.getState().setConnectionState(r.connectionState)   // extends useAccounts
  useTargetsStore.setState({ targets: r.targets })
  useLists.setState({ whitelist: r.whitelist, blacklist: r.blacklist })
  useActivityFeed.setState({ items: r.activity })    // NEW store, currently mockActivity is direct import
  useGrowthData.setState({ daily: r.growthDaily })   // NEW store
  useInstagramAudit.setState({ lastDownloadedAt: r.auditDownloadedAt })
  useGrowthPlusSubscription.setState({
    subscribed: r.growthPlusSubscribed,
    status: r.growthPlusStatus,
  })
  useUiState.setState({ trialBannerDismissed: false })   // reset closeable banner state
}
```

### Why imperative mutation (and not "components read preset directly")

99% of components already read from the existing stores. Reseeding stores means those components don't change at all — they keep doing `useTargetsStore((s) => s.targets)` and just see the right data. Only a handful of components need to read the preset name directly:

- **GrowthChart** — needs to know `'forecast-only' | 'half-half' | 'real-only' | 'empty'` mode.
- **InstagramAuditCard** — needs to know it's in trial (audit disabled) vs active.
- **TrialBanner** — needs to know `trial-last-day` specifically to drop the CTA + show the close button.
- **DashboardLayout** — needs to know `connection === 'disconnected'` for the sidebar disconnect badge + strip (already derivable from `useAccounts`, but covered by the seed).

For these, the preset name is read directly from `useDashboardPreset`.

### Stores that need to be created or modified

- **NEW `useUserStore`** — Wraps the current `mockUser` direct imports. Single source of truth for `isOnTrial`, `trialEndsAt`, `createdAt`, `plan`, `growthPlusSubscribed`, etc. Every file currently importing `mockUser` from `@/mocks/user` swaps to `useUserStore((s) => s.user)`. This is a foundational change that unblocks state switching for trial fields.
- **NEW `useActivityFeed`** — Wraps `mockActivity` direct import (currently used by Overview's ActivityFeed component).
- **NEW `useGrowthData`** — Wraps `mockGrowthDaily` direct import (used by GrowthChart + the metric sparklines).
- **NEW `useUiState`** — Holds preset-related UI state: `trialBannerDismissed` (closeable banner), and anything else that resets on preset change.
- **EXTEND `useAccounts`** — Add `setConnectionState(state)` action so presets can flip `connectionState` on the active account without modifying the entire `accounts` array.

The first three are mechanical refactors (grep `mockUser`, replace import). They unlock not just the preset switcher but any future state-driven feature.

---

## Widget UI

### Visual

**Collapsed (default)**: A floating circular button, `h-14 w-14`, `rounded-full bg-text-primary text-bg shadow-xl`, positioned `fixed bottom-4 right-4 z-40`. Icon: `Sliders` (lucide). Active-preset abbreviation badge top-right of the button (e.g., "AP" for active-populated) so the current state is visible at a glance.

**Mobile offset**: On `<sm:` the bottom tab bar occupies ~64px + safe area. The widget sits at `bottom-[80px] right-4` on mobile, `bottom-4 right-4` on `sm:+`. Stays above the bottom tab bar and out of the Intercom slot (which lives at `pr-[72px]` per `CLAUDE.md`).

**Expanded panel**: Click the button → opens a popover anchored bottom-right (`w-72`, `rounded-xl border border-border bg-surface shadow-xl`, max-height with overflow-y-auto). Header: small chip + "Dashboard state" + close X. Body: 6 preset rows grouped under three section labels:

```
TRIAL
  ○ Trial — First day        (no targets yet, forecast only)
  ○ Trial — Last day         (ends today, banner shows)
  ○ Trial — Disconnected     (mid-trial, IG disconnected)

ACTIVE
  ○ Active — Empty           (just connected, no data)
  ● Active — Populated       (normal full dashboard)        ← selected

DISCONNECTED
  ○ Active — Disconnected    (subscription active, IG dropped)
```

Each row is `flex items-start gap-3 px-4 py-3` with a radio dot + label (text-sm) + description (text-xs text-text-muted). Selected row: `bg-blue-tint` with `border-l-2 border-blue-base`. Hover: `bg-bg/50`.

Footer: text link "Reset to default" — only enabled when a non-default preset is active.

### Behavior

- Clicking outside the popover closes it.
- Clicking a preset row immediately applies the preset and closes the popover.
- Switching presets resets all stores → page rerenders with new data → modals/drawers close (they're keyed to stores that get reseeded).
- A toast confirms: `"State: Trial — Last day"`.

### Files added

- `src/components/DashboardPresetWidget.jsx` — the widget itself (collapsed button + expanded panel).
- `src/stores/useDashboardPreset.js` — the store + `seedAllStores` mechanism.
- `src/mocks/presets.js` — the 6 preset recipes (data definitions).
- `src/mocks/presetVariants.js` — the new mock data variants (empty arrays, first-day chart, last-day chart).

### Rendered in

`DashboardLayout.jsx` renders `<DashboardPresetWidget />` once at the top level so it appears on every dashboard route. Signup routes don't include `DashboardLayout`, so the widget naturally doesn't appear there (matches your intent — signup is its own flow).

---

## Cross-cutting changes the presets depend on

Each preset implies UI behaviors that the dashboard doesn't currently fully support. These are tracked here so we don't ship a half-working widget.

### Section A — Banner system

- **`TrialBanner`** ([overview/index.jsx](src/pages/overview/index.jsx)): add a close X button in the corner. Closeable state lives in `useUiState.trialBannerDismissed`. On the last-trial-day variant specifically (`trial-last-day` preset), remove the "Manage plan" CTA per the spec (just informational text + close).
- **`InstagramConnectionBanner`**: currently rendered only on Overview. Hoist it into `DashboardLayout` so it renders on Overview, Targeting, and Engagement when `connectionState === 'disconnected'`. Account / Growth+ / Signup keep their own routing logic (they're already disconnect-aware).
- **NEW `SidebarDisconnectBadge`**: a persistent disconnected indicator in the left sidebar (under the account switcher). Red dot + "Account disconnected" + Reconnect link.
- **NEW `SidebarDisconnectStrip`**: a smaller compact variant above Settings / Dark mode / Log out in the sidebar footer. Mirrors the disconnect signal at the bottom of the nav so it's visible without scrolling back up.

### Section B — Empty states (when data is empty)

- **`TopTargetsOverview`**: already has `EmptyNoTargets` ✓.
- **`ActivityFeed`** ([overview/index.jsx](src/pages/overview/index.jsx)): add an empty state — chip + headline + 1-line description ("Activity will appear here once Kicksta starts engaging with your targets.").
- **`WhitelistCard` / `BlacklistCard`**: when the list is empty, render an empty state inside the card instead of a bare divider. Headline + 1-line description + "Add" CTA matches the page-level pattern (the modal already has an empty state — reuse the same copy).
- **`GrowthChart`**: add an `'empty'` mode that renders gridlines + a centered explanatory line ("No follower data yet — check back after the first follow.").
- **`TargetingSettingsSnapshot` / `EngagementSnapshot`**: already render their toggles in any state — no empty-specific change needed.
- **`AccountCard` live status**: when in `active-empty`, the status line reads "Ready — add your first source to start growing." This is a copy change in `AccountLiveStatus`.

### Section C — Chart forecast modes (`GrowthChart`)

New `mode` prop on `GrowthChart`, computed from the active preset:

- `'forecast-only'` — `trial-first-day`, `trial-disconnected`. All bars dashed/forecast. No real bars.
- `'half-half'` — `trial-last-day`. Real bars for first part of the trial window, dashed forecast for the rest. Current trial-bracket behavior generalizes here.
- `'real-only'` — `active-populated`, `active-disconnected`. No dashed bars at all. Period switcher controls the window.
- `'empty'` — `active-empty`. Empty-state explanatory copy instead of bars.

Existing trial-bracket positioning (`trialStart` / `trialEnd` props) stays — it's the data axis for `'half-half'` mode. The current `isOnTrial` branch in `GrowthChart` becomes `mode === 'half-half'`.

### Section D — Connection indicators (when `disconnected`)

- **`AccountCard` avatar connection dot**: red (`bg-red-base`) — already handled by `connDotConfig['disconnected']`. Verify visible.
- **`AccountLiveStatus`**: when `phase === 'disconnected'` (NEW phase needed for `useSystemStatus`), render red icon + "Disconnected — reconnect to resume growth."
- **`AccountPauseCTA`**: extend the `isHidden` check from `'warming_up' | 'setup'` to also include `'disconnected'`. No pause button when there's nothing to pause.
- **System status indicators** in the sidebar account switcher + mobile drawer: respect the same `disconnected` color (red).

### Section E — Trial-period audit-disabled state

- **`InstagramAuditCard`**: when the preset is `trial-*`, the card renders a disabled state — pill reads "Available after trial" (yellow-tint), CTA is disabled with the same copy. Body keeps the descriptive paragraph (no stats — there are none).

### Section F — Mock data variants (`src/mocks/presetVariants.js`)

New mock definitions the recipes consume:

- `mockTargetsEmpty = []`
- `mockWhitelistEmpty = []`, `mockBlacklistEmpty = []`
- `mockActivityEmpty = []`
- `mockGrowthDailyFirstDay` — 30 entries, all forecast (zero/null for real days, projected values for the next 7 days). The chart renders these as dashed bars.
- `mockGrowthDailyLastDay` — 30 entries with real values for the past trial days (3–4 days of actual data) + forecast bars for the remaining trial days. The current `mockGrowthDaily` is roughly the populated-state version; rename or duplicate.

Existing populated mocks (`mockTargets`, `mockGrowthDaily`, `mockActivity`, `mockWhitelist`, `mockBlacklist`) become the `'populated'` defaults.

---

## Phased implementation plan

Each phase is independently mergeable and demoable. Order matters — earlier phases unblock later ones.

| Phase | Scope | Files touched (approx) | Outcome |
|---|---|---|---|
| **P1 — Foundation** | `useDashboardPreset` store, `seedAllStores`, 6 preset recipes (stub data), `useUserStore` / `useActivityFeed` / `useGrowthData` / `useUiState` stores, swap direct mock imports across the dashboard, `DashboardPresetWidget` component, mount in `DashboardLayout` | ~25 files (most are 1-line import swaps) | Widget visible, switching presets flips the underlying data. UI may not yet reflect every nuance per state. |
| **P2 — Banner system** | TrialBanner closeable + drop CTA on last-day, hoist InstagramConnectionBanner into DashboardLayout for cross-page rendering, build SidebarDisconnectBadge + SidebarDisconnectStrip | 4 components + DashboardLayout | `active-disconnected` + `trial-disconnected` look correct on every page. |
| **P3 — Empty states** | ActivityFeed empty, WhitelistCard / BlacklistCard empty, GrowthChart `'empty'` mode, AccountLiveStatus "Ready — add your first source" copy | 5 components | `active-empty` looks correct end-to-end. |
| **P4 — Chart modes** | `GrowthChart` `mode` prop ('forecast-only' / 'half-half' / 'real-only' / 'empty'), driven by `useDashboardPreset.preset` | 1 component | `trial-first-day`, `trial-last-day`, `trial-disconnected`, `active-*` chart visuals all correct. |
| **P5 — Audit + disconnect polish** | Audit trial-disabled state + copy, AccountLiveStatus disconnect copy/icon, AccountPauseCTA hidden on disconnect, sidebar/drawer status indicators red on disconnect | 4–5 components | `trial-*` audit is locked correctly; disconnect visuals consistent across surfaces. |
| **P6 — Final integration** | New mock variants (`mockTargetsEmpty`, `mockGrowthDailyFirstDay`, `mockGrowthDailyLastDay`, etc), verify each of the 6 presets renders cleanly on every dashboard page | mocks + verification | Every preset verified end-to-end. CHANGELOG updated. |

P1 is the unblock-everything-else phase. The widget will be visible and "work" (flip presets) after P1 even if some states render imperfectly — those are tightened up in P2–P6.

---

## Open questions / decisions deferred

None at design time. Specific implementation choices (icon library calls, exact toast copy, exact pixel positions of the sidebar disconnect strip) get resolved in the implementation plan.

---

## Out of scope

- Removing the widget for production builds. The user has explicitly opted to ship it visible for now; gating to dev-only is a one-line change later (`import.meta.env.DEV`).
- Switching between user variants beyond G+ subscribed/not (e.g., Starter / Pro / Elite tier testing). Tier switching is already exercisable via the existing `/growth-plus` upsell flow and `useGrowthConfig.setGrowthPlusTier`.
- Multi-account switching scenarios beyond connection state changes.
- Animation / micro-interaction polish on the widget (slide-up, etc) — initial version is straightforward open/close.
