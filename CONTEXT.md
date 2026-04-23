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

## Targets page (`src/pages/targets/`) — v3

Composed from small focused files. `useTargetsStore` (Zustand) is the single state source for target CRUD; `useSystemStatus` (new shared hook) is the single state source for the live-activity strip and the Overview `StatusPill`. Job on this page: **add + manage** targets + surface live automation status.

### File layout (v3)
```
src/pages/targets/
  index.jsx                page shell + state wiring (3 overlays)
  LiveActivityCard.jsx     status strip — LIVE eyebrow + accent strip + cycled phase text
  TargetsHeroCard.jsx      hero — Crosshair icon + Targets headline + explanation + slots + Add CTA
  FilterRow.jsx            filter pills (wrap on mobile) + sort dropdown
  TargetList.jsx           column header + rows + empty states
  TargetRow.jsx            avatar/hash / dot-on-mobile / name+sub / star / pill-on-desktop / count·% / chevron
  TargetDetailDrawer.jsx   ease-in drawer with avatar, stats, tinted actions, IG link
  RemoveTargetModal.jsx    destructive-action confirmation
  AddTargetSheet.jsx       add flow — wider toggle + must-pick typeahead + pinned-size popup + suggestions
  HealthPill.jsx           size-based match quality pill (+ `evaluateHealth` helper)
src/hooks/useSystemStatus.js      shared live-status hook (phase state machine, 6–10s tick)
src/stores/useTargetsStore.js     target state + filter/sort helpers
src/utils/formatCount.js          128400 → "128K" / 12400000 → "12.4M"
src/mocks/targets.js              seeded rows with followers/posts + tuned follow-back rates
src/mocks/targetSearch.js         20 accounts + 10 hashtags, async searchTargets(query, type)
src/mocks/suggestedTargets.js     5 account suggestion chips
src/mocks/suggestedHashtags.js    5 hashtag suggestion chips
```

### Page anatomy (top to bottom)
1. **Header** — `h1 Targets` + sub `Manage the accounts and hashtags Kicksta targets for your growth.`
2. **LiveActivityCard** — left accent strip in phase color + `LIVE`/`WARMING UP`/`SETUP`/`PAUSED` eyebrow pill + radar dot + phase label + rotating `@handle` / `#tag` (key-bound crossfade on phase/target change) + right-zone chips `Today N actions` and `next in ~N min` (desktop). Mobile collapses right zone to a bordered subline. Handle click opens the target's detail drawer when matched. Monitor-only
3. **TargetsHeroCard** — `Crosshair` icon (blue-tint square) + `Targets` headline + one-sentence explanation + `N / maxSlots` big number with `SLOTS USED` label + blue `+ Add target` button. No progress bar (v3 removed it)
4. **FilterRow** — `All · Active · Queued · Paused · Depleted` pills with live counts. **Wrap to multiple rows on mobile**; single-line on `lg:+`. Sort dropdown on a new row on mobile / right-aligned on desktop. Selected pill: `bg-surface shadow-sm ring-1 ring-border`. Unselected: `bg-bg`
5. **TargetList** — column header `NAME` / `FOLLOW-BACKS · %` with `pr-11` on the right label so it aligns with the count·rate cluster. Top performer star lands on the highest-follow-back active row, independent of current filter/sort
6. **Overlays** — TargetDetailDrawer (row tap, ease-in animation) → RemoveTargetModal (when Remove tapped) · AddTargetSheet (from hero CTA, ease-in animation)

### Row anatomy (v3)
- **Avatar/icon** — 36×36 rounded. Account: `profilePic` or initial-letter fallback (`bg-bg text-text-secondary`). Hashtag: `Hash` Lucide icon in same neutral circle. Depleted: `opacity-60` on the avatar
- **Name zone**:
  - **Mobile (`< md:`):** small status dot (8×8, colored per status) left of the name. No pill.
  - **Desktop (`md:+`):** status pill (`text-[11px] uppercase`, tint bg + text per status). No dot.
  - Name value (truncate) + top-performer `Star` always present on both.
  - Subline `text-xs text-text-muted`: `{formatCount(followers)} followers` (accounts) or `{formatCount(posts)} posts` (hashtags)
- **Count · rate** — `{followBackCount} · {rate}%`. Rate color by health: green ≥10%, text-secondary 5–10%, yellow <5%. Depleted overrides everything to muted
- **Chevron** — `ChevronRight` decorative-only affordance (44×44 wrapper). Entire row is the tap target

### Detail drawer anatomy
- 48×48 avatar · handle + subline · status pill · close X
- HealthPill row (if `followers`/`posts` known)
- 3 data chips: `Followed · Follow-backs · Rate` (Growth-Settings recipe: `rounded-full bg-bg px-3 py-1.5 text-xs`)
- Action buttons (48px, tinted, equal-flex): Active → `Pause` (blue-tint) + `Remove` (red-tint) · Paused → `Resume` + `Remove` · Queued/Depleted → `Remove` full-width
- Ghost `Open on Instagram ↗` link: account → `https://instagram.com/{handle}`; hashtag → `https://www.instagram.com/explore/tags/{tag}`; new tab, `rel="noopener noreferrer"`
- `Remove` opens `RemoveTargetModal` (action-name button `Remove target`, not `Confirm`)

### Add Target sheet (v3)
- **One CTA, one flow** — the hero card's button is the sole entry point (no button on the empty state)
- **Wider segmented toggle** under a `TARGETING` eyebrow: `flex` with `flex-1` segments, `h-9`. Selected: `bg-surface shadow-sm` inside a `bg-bg p-1` container
- Input with `@`/`#` prefix (swaps with mode), `h-12` height
- **Typeahead dropdown**: 2+ chars + 200ms debounce → up to 5 matches from `searchTargets(query, type)`. Dropdown uses `max-h-[240px] overflow-y-auto` so it **never changes the sheet's outer dimensions**. Each row: avatar/hash + handle + `{count}` subline + `HealthPill`
- **Must-pick rule** — `Add target` button stays disabled until the user taps a typeahead row or a suggestion chip. Typing alone never enables submit. Helper: *"Select a result to continue."*
- **Preview card** appears only after a match is picked — shows avatar + handle + count + `HealthPill`
- **Suggestions** always visible (account chips or hashtag chips per mode); hidden only while typeahead has results
- Duplicate detection (case-insensitive on stored value) → red helper. If duplicate is paused → inline `Resume it` link that resumes the row and closes
- Invalid format → inline red helper, never a toast
- **Open animation** — backdrop fades, sheet slides up with `translate-y-4 → translate-y-0` via a mounted-state toggle
- Submit: new targets enter with status `queued`, prepended to the list

### HealthPill thresholds
```
count < 1_000          → "Small audience"          yellow-tint / yellow-text
1K ≤ count < 100K       → "Good fit"                green-tint / green-text
100K ≤ count < 1M       → "Slower — large audience" yellow-tint / yellow-text
count ≥ 1_000_000       → "Very large — much slower" yellow-tint / yellow-text
```
Same helper (`evaluateHealth`) + component (`HealthPill`) reused by: typeahead rows, preview card, detail drawer.

### `useSystemStatus` hook
Single source of truth for the live automation phase. Consumed by both `LiveActivityCard` (Targets) and `StatusPill` (Overview).
- Phase state machine: `analyzing → following → waiting → unfollowing → waiting …`. 6–10s randomized tick per phase
- On entering `following` / `unfollowing`: picks a random active target from `useTargetsStore` → `targetHandle`
- On entering `following`: increments `actionsToday` by a random step 1–3
- Baseline `warming_up` / `setup` / `paused` states from `mockSystemStatus` are inert — the state machine doesn't run
- Returns `{ phase, targetHandle, actionsToday, nextActionLabel, isPaused }`
- **No countdowns** — `nextActionLabel` is fuzzy (`next in ~4 min`, `next in a moment`, `''`)

### Store shape (`useTargetsStore`, unchanged from v1)
```js
{
  targets: Target[],
  filter: 'all'|'active'|'queued'|'paused'|'depleted',
  sort: 'priority'|'followBacks'|'recent'|'alpha',
  setFilter, setSort,
  addTarget({type, value}),
  pauseTarget(id), resumeTarget(id), removeTarget(id),
}
```
Helpers: `filterTargets(targets, filter)` · `sortTargets(targets, sort)`. Default sort `priority` = active → queued → paused → depleted, then by follow-back count desc.

### Target record shape (v2, post-mock tuning)
```js
{
  id, type: 'account'|'hashtag', value: '@handle'|'#tag',
  status: 'active'|'queued'|'paused'|'depleted',
  followers,        // accounts only
  posts,            // hashtags only
  followedCount, followBackCount, addedAt,
  profilePic,       // accounts, optional (null falls back to initial)
}
```

### Deferred / known gaps
1. **At-cap behavior** — Advanced at 30 should disable + inline message; Growth at 10 should swap button to upgrade CTA; progress bar should turn yellow at cap
2. **Approaching-cap nudge** — soft "N slots left" copy
3. **Auto-pause-after-downgrade banner** — blue-tint notice naming paused targets + Upgrade CTA
4. **Disconnected-IG treatment** — add button should disable, persistent reconnect banner should surface
5. **Success toasts** on pause/resume/add — actions currently apply silently
6. **URL-param-backed filter/sort** — currently component-local
7. **Store persistence** — in-memory, resets on reload
8. **Live Activity card's `actionsToday`** resets to baseline on reload (no persistence)
9. **Typeahead dropdown** can get clipped by the Add Target sheet's internal scroll when matches > visible height; consider internal scroll on the dropdown or portaling
10. **Mobile row name truncation** is aggressive when avatar + star + pill crowd the row; could trim pill text or hide star at narrow widths
11. **Mobile slots card** places the Add button above the progress bar (consequence of the inline-row container stacking vertically); cosmetic; may revisit

### Spec + plan
- v1 spec: `docs/superpowers/specs/2026-04-23-targets-page-design.md`
- v1 plan: `docs/superpowers/plans/2026-04-23-targets-page.md`
- v2 spec: `docs/superpowers/specs/2026-04-23-targets-page-v2-design.md`
- v2 plan: `docs/superpowers/plans/2026-04-23-targets-page-v2.md`
- **v3 plan: `docs/superpowers/plans/2026-04-23-targets-page-v3.md`** (delta-only; no new spec — applies on top of v2)

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
- **2026-04-23 (v2)** — Targets page v2 iteration. Row redesign (avatar/hash-icon, subline, rate-by-health color, chevron replacing kebab), detail drawer replacing the old kebab menu, compact Add Target sheet with typeahead + always-visible hashtag suggestions + HealthPill, slots card inlined on desktop, empty-state copy updated. New Live Activity card atop the page cycles through phases via a shared `useSystemStatus` hook; Overview's `StatusPill` refactored to consume the same hook so both surfaces stay in lockstep. 11 impl tasks + docs, all committed individually on local `main`.
- **2026-04-23 (v3)** — Targets page refinement pass. `SlotsCard` becomes `TargetsHeroCard` (Crosshair icon + explanation + no progress bar). LiveActivityCard + Overview StatusPill both gain `LIVE`/`PAUSED`/`WARMING UP`/`SETUP` eyebrow pills for clearer status framing; LiveActivityCard adds a left accent strip + key-bound crossfade animation on phase changes. Row mobile shows a small status dot instead of the pill; column header aligned with rate cluster. Add Target sheet: wider toggle, pinned popup size (internal scroll on dropdown), must-pick rule. Detail drawer + Add Target sheet both get ease-in open animations. Filter pills wrap to multiple rows on mobile. 7 impl tasks + docs commit on local `main`.
