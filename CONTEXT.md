# CONTEXT.md — Kicksta Dashboard working notes

> Rolling session memory. Complement to `CLAUDE.md` (tech/design system rules) and `PRODUCT.md` (product/copy rules). Update at the end of a session so the next one picks up without replaying.

---

## Project shape

React + Tailwind + Recharts SaaS dashboard for Instagram growth automation (V1 frontend-only, all mocked). Mobile-first, light/dark via CSS vars, Plus Jakarta Sans, Zustand for UI state. Rules live in `CLAUDE.md` and `PRODUCT.md`.

**ngrok tunnel** (when running): `https://playhouse-bonfire-regroup.ngrok-free.dev` → `localhost:5173`.

## Design-system conventions in active use

- **Color meaning**
  - green = growth / healthy
  - **blue = informational (trial)**
  - yellow = action-needed (depleted target, low follow-back, setup state)
  - red = connection errors only
- **Pill recipes**
  - **Data chip** (Growth-Settings style): `rounded-full bg-bg px-2 py-1 text-xs` with `label:` muted + value primary
  - **Tinted state pill**: `rounded-full bg-<color>-tint px-2 py-0.5 text-[10px] uppercase tracking-wide text-<color>-text`
  - **Segmented-control** (selected): `bg-surface shadow-sm` in a `bg-bg` container
- **Spacing scale**: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 — no arbitrary `[values]`
- **Touch targets**: ≥ 44px; primary buttons 48px
- Date-dependent mocks are **dynamic** (anchor to `new Date()` / local midnight) — no hardcoded dates

---

## Overview page (`src/pages/overview/index.jsx`)

### Header row
Greeting · `TrialProgress` pill (hidden on last day) · `PeriodSwitcher` (disabled "Trial period" pill during trial, 3-preset tablist after).

### TrialBanner (last day only, **blue**)
Icon chip + "Your trial ends in X hours" + renewal copy + "Manage plan" CTA → `/signup/plan-selection`. Non-dismissible.
Copy: `Kicksta will charge $X for your [plan] automatically. Your automation keeps running — no action needed on your end.`

### AccountCard
- Identity row: avatar + `@handle` + `Advanced` pill + `Trial` blue pill + full name
- `StatusPill` on right (desktop) / below (mobile) — live radar-dot + action label ("Following @fitness.inspo")
- Click `StatusPill` → popover with details + Pause/Resume

### 3 metric cards (grid below AccountCard)
- `TotalFollowersMetric({ connection, data, period })` — inline baseline tooltip `4,832 (4,739)` with "Followers at signup" tooltip (trial-only)
- `FollowersGainedMetric({ data, period })` — `+N` with sparkline
- `FollowBackRateMetric({ data, period })` — `N%` + health pill (Healthy/Average/Needs attention)

Each uses the `MetricCard` primitive (icon + label + period-suffix top-right, value + optional pill, sparkline).
`Sparkline` = `h-6 w-16 lg:w-20` green area chart.

### GrowthChart (5fr of grid row on desktop)
- **Header**: `Follower Growth` + blue `Trial` pill (when `period === 'trial'`) + legend swatches (Gained / Predicted)
- **Summary strip**: 3 `bg-bg` filter-pills (`Total: +N · Avg/day: ~N · Best: Apr 18 (+17)`), **no borders above or below**, `px-2 py-1`
- **Chart**: 7 past bars (striped green) + 7 forecast bars (dashed-outlined green-tint) when on trial. `YAxis width={28}`, `margin.left: 0`
- **Markers**: dashed "Trial ends" `ReferenceLine` (blue) at last trial bar; dashed "Today" line (muted) suppressed when it coincides with Trial ends
- **Hover**: `cursor={false}`, `activeBar={{ stroke: text-primary, strokeWidth: 1.5 }}`
- **Tooltip** (`GrowthBarTooltip`): date header + identity row + 3-stat strip (Total / Gained highlighted / FB rate) + Daily-growth section. Per-bar `runningTotal` + `followBackRate` computed in `useMemo`.

### ActivityFeed (3fr beside chart on desktop)
Capped to 5 items. `filterByWindow` uses 7-day trial slice when `period === 'trial'`. Red "LIVE" pill (intentionally red — universal recording-icon convention).

### GrowthPlusBanner
Blue gradient banner (non-subscriber) / purple icon chip. Copy: "Add Growth+ for extra algorithmic reach". Mobile: icon-in-eyebrow layout; desktop: side icon.

### TargetsOverview + GrowthSettingsSnapshot (side-by-side)
Top Targets sorts `active → queued → paused → depleted` then by follow-back count. 7-row cap.

---

## DashboardLayout (`src/components/DashboardLayout.jsx`)

### Desktop sidebar (lg:+, w-60 or w-16 collapsed)
1. Logo + `NotificationBell`
2. **AccountSwitcher** — trigger = avatar (with 12px connection-status dot) + `@handle` + follower count + chevron. Dropdown: 288px fixed (`w-72`), extends past sidebar, shows active account (check + `PlanPill` + followers), other accounts (`PlanPill` + followers OR red `AlertTriangle` + "Disconnected"), divider, "Add account" → `/signup/connect-instagram`.
3. **Separator** (`border-b border-border pb-3`)
4. Nav tabs (Overview / Targets / Growth)
5. Bottom: Signup flow (dev) · `SystemStatusRow` · Collapse · Logout

### Mobile header
`SystemStatusIconButton` (left) + logo (center) + `NotificationBell` (right).

---

## Key mocks (all dynamic date-wise)

- **`mockUser`** (`src/mocks/user.js`): `isOnTrial: true`, `trialEndsAt = today 11 PM local`, `createdAt = trialEndsAt - 7 days`, `plan: 'advanced'`. Exports `PLAN_CATALOG = { growth: {name, price: 29}, advanced: {name, price: 49} }`.
- **`mockAccounts`** (`src/mocks/accounts.js`): 3 accounts each with `{id, username, fullName, profilePic, followers, plan, connectionState}`. `alexjohnson.co` connected/advanced (active), `alex.personal` disconnected/growth, `fitclub.brand` connected/advanced.
- **`mockGrowthDaily`**: 30 days ending today, `targetedGain`, `followBackRate`, `engagementRate` (unused).
- **`mockActivity`**: `NOW = new Date()` — fresh timestamps each load.
- **`mockSystemStatus`**: dynamic `startedAt` / `nextActionAt`, 5 state variants (following / unfollowing / analyzing / warming_up / setup / paused).
- **`mockInstagram`**: single connected IG for AccountCard.

## Helpers / patterns

- `getWindowSlice(data, period, customRange)` — `'trial'` → `data.slice(-7)`; custom + preset branches
- `getPeriodLabel(period)` — `'trial'` → `'Trial period'`
- `isTrialLastDay(user)` — same-calendar-day check (not timestamp)
- `remainingTime(dateStr)` — `{value, unit}` for banner copy
- `filterByWindow(items, period)` — same trial-7-day cutoff for activity

---

## Deferred / known issues

1. **Predicted bars on chart** — violates PRODUCT.md "no projected data" rule. User acknowledged and wants to revisit later.
2. **Cancel subscription / profile dropdown** — not yet implemented. Bigger project.
3. **StatusPill ↔ ActivityFeed recency** — still mock-only; LIVE label is aesthetic until backend.
4. **Account switcher behaviorally incomplete**: switching active account doesn't propagate to AccountCard / chart / metrics (still read from `mockInstagram`). Needs Zustand store. Disconnected alert has no actionable resolution (clicking disconnected account just switches UI, no reconnect flow triggered).
5. **Active-account disconnection** doesn't surface on the switcher trigger (only in dropdown).
6. **Status dots** have no tooltip on hover.
7. **Plan pill size** differs slightly between AccountCard (`px-2 py-0.5 text-xs`) and switcher (`px-1.5 py-0.5 text-[10px]`) — no shared primitive yet.
8. **Add account** routes to `/signup/connect-instagram` (full signup); a lightweight add-another-account flow doesn't exist.

---

## Preview infra

Vite dev server via `preview_start` on port 5173.
Reload via `window.location.href = '/?bust=' + Date.now()` to bust HMR caching.
Mobile preset `375×812`, desktop `1280×900`.

---

## Update log

- **2026-04-23** — initial CONTEXT.md written at end of long session covering: chart redesign (trial rail → bracket → ReferenceLine → blue "Trial ends" marker), summary strip iteration (vertical → segmented → filter-pill), trial-yellow → trial-blue swap, account switcher + plan pills + status dots + disconnected alert.
