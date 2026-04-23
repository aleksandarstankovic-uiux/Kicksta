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

## Targets page (`src/pages/targets/`)

Composed from small focused files; `useTargetsStore` (Zustand) is the single state source. Job on this page: **add + manage** targets. Monitoring is secondary (no per-row analytics, no detail-view drawer).

### File layout
```
src/pages/targets/
  index.jsx              page shell + state wiring
  SlotsCard.jsx          count + progress bar + trust line + sole Add CTA
  FilterRow.jsx          segmented filter pills + sort dropdown
  TargetList.jsx         column header + rows + empty states
  TargetRow.jsx          dot / name / star / pill / count / kebab
  KebabMenu.jsx          status-aware action menu (Pause/Resume/Remove)
  RemoveTargetModal.jsx  destructive-action confirmation
  AddTargetSheet.jsx     single-path add sheet
src/stores/useTargetsStore.js   state + filter/sort helpers
src/mocks/suggestedTargets.js   5 account-mode suggestion chips
src/mocks/resolveAccount.js     async preview resolver (11 fixtures)
```

### Page anatomy (top to bottom)
1. **Header** — `h1 Targets` + sub `Manage the accounts and hashtags Kicksta targets for your growth.`
2. **SlotsCard** — `Target slots · X / maxSlots` · green progress bar · lock + trust line · `+ Add target` (blue, 48px, full-width mobile / right-aligned desktop). Max slots derived from `mockUser.plan` (10 Growth / 30 Advanced). All stored targets count — active + queued + paused + depleted
3. **FilterRow** — `All · Active · Queued · Paused · Depleted` pills with live counts (selected = `bg-surface shadow-sm` inside `bg-bg p-1`). Sort dropdown on right: text label on desktop (`Sort: Priority ▾`), `ArrowUpDown` icon on mobile. Pills scroll horizontally on mobile
4. **TargetList** — column header (`NAME` / `FOLLOW-BACKS`) inside a bordered card, then rows. Top performer star lands on the highest-follow-back active row, independent of current filter/sort
5. **Overlays** — KebabMenu (row tap) → RemoveTargetModal (confirm) · AddTargetSheet (bottom sheet mobile / centered modal desktop)

### Conventions reused from Overview's `TargetsOverview`
- Status → dot color: active=green, queued=blue, paused=grey, depleted=yellow
- Status tooltip strings (same verbatim copy)
- Depleted row = `bg-bg/60` wash + `line-through` name + muted count
- Top-performer star (`fill-yellow-base text-yellow-base`) placed between name and status pill
- Status pill recipe: `rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide` with tint bg + text color per status (paused is neutral-grey)

### Row interaction
- Entire row is a tap target (`role="button" tabIndex={0}`) — kebab icon is the visual affordance only
- Kebab items by status: Active → Pause + Remove · Paused → Resume + Remove · Queued/Depleted → Remove only
- `Remove` opens `RemoveTargetModal`; primary button labeled `Remove target` (action name, not "Confirm")
- Pause/Resume apply silently (no toast wired yet — flagged for follow-up)

### Add Target sheet
- **One CTA, one flow** — the slots-card button is the sole entry point. Empty state has no button; user's eye goes up
- Segmented `Account` / `Hashtag` toggle swaps `@`/`#` prefix, helper copy, preview, and suggestions visibility
- Account mode only: live preview card (debounced 300ms via `mockResolveAccount`) + 5 suggestion chips
- Duplicate detection: matches existing target (case-insensitive), blocks submit with specific copy. If duplicate is `paused`, inline `Resume it` link resumes the row and closes the sheet
- Invalid format → inline red helper, never a toast
- New targets enter with status `queued`, prepended to the list

### Store shape (`useTargetsStore`)
```js
{
  targets: Target[],                      // seeded from mockTargets, in-memory
  filter: 'all'|'active'|'queued'|'paused'|'depleted',
  sort: 'priority'|'followBacks'|'recent'|'alpha',
  setFilter, setSort,
  addTarget({type, value}),               // optimistic; new row is 'queued'
  pauseTarget(id), resumeTarget(id), removeTarget(id),
}
```
Helpers exported alongside: `filterTargets(targets, filter)` · `sortTargets(targets, sort)`. Default sort `priority` = active → queued → paused → depleted, then by follow-back count desc.

### Deferred / known gaps (Targets-specific)
1. **At-cap behavior** — Advanced at 30 should disable add button + inline message; Growth at 10 should swap button to upgrade CTA; progress bar should turn yellow at cap. None implemented yet
2. **Approaching-cap nudge** — soft "N slots left" copy before hitting the cap
3. **Auto-pause-after-downgrade banner** — blue-tint notice naming paused targets + Upgrade CTA. Mandated by PRODUCT.md but deferred
4. **Disconnected-IG treatment** — add button should disable, persistent reconnect banner should surface. Currently the page ignores connection state
5. **Success toasts** on pause/resume/add — actions currently apply silently
6. **URL-param-backed filter/sort** — currently component-local state only
7. **Store persistence** — in-memory, resets on reload
8. **Per-target analytics** (sparkline, follow-back %, followed-count column) — deprioritized per Q1 of the brainstorm
9. **Bulk actions, search, CSV import, whitelist/blacklist shortcuts** — explicitly out of scope for V1

### Spec + plan
- Spec: `docs/superpowers/specs/2026-04-23-targets-page-design.md`
- Plan: `docs/superpowers/plans/2026-04-23-targets-page.md`

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
- **2026-04-23 (cont.)** — Targets page shipped. Brainstormed (4 clarifying questions → "add + manage" job, single Add sheet, kebab actions, filter+sort with Queued kept separate), spec + plan written, 9 implementation tasks dispatched via subagents and committed individually. Visual verification passed on desktop, mobile (375), and dark mode; no new console errors. Repo now under git; work lives on local `main`.
