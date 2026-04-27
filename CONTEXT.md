# CONTEXT.md — Kicksta Dashboard working notes

> Rolling session memory. Complement to `CLAUDE.md` (tech/design system rules) and `PRODUCT.md` (product/copy rules). Update at the end of a session so the next one picks up without replaying.

---

## Project shape

React 19 + Vite 8 + Tailwind 4 + Recharts 3 + Zustand 5 SaaS dashboard for Instagram growth automation (V1 frontend-only, all mocked). Mobile-first, light/dark via CSS vars, Plus Jakarta Sans, Lucide icons. Path alias `@/` → `src/`. Repo under git on local `main`. Restore tag: `restore-point-pre-targets-merge` (pre-v3.4 fusion baseline).

**ngrok tunnel** (when running): `https://playhouse-bonfire-regroup.ngrok-free.dev` → `localhost:5173`.

**No unit-test framework.** Verification via `npm run lint` (when available) and visual inspection in Claude Preview.

---

## Design-system conventions

- **Color meaning** — green = growth/healthy/positive action (e.g. following) · blue = informational (trial, warming up, supporting actions) · yellow = action-needed (depleted target, low follow-back, setup) · red = connection errors only · purple = Growth+ surface
- **Pill recipes**
  - Data chip: `rounded-full bg-bg px-2 py-1 text-xs` with muted label + primary value
  - Tinted state pill: `rounded-full bg-<color>-tint px-2 py-0.5 text-[10px] uppercase tracking-wide text-<color>-text`
  - Segmented control (selected): `bg-surface shadow-sm` in a `bg-bg p-1` container
- **Spacing** — 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 only. No arbitrary `[values]`
- **Cards** — `rounded-xl border border-border bg-surface p-4 lg:p-5`
- **Touch targets** — ≥ 44×44px; primary buttons 48px; modal action buttons 40–48px
- **Modals** — fade overlay + `translate-y-4 → 0` slide on mount, 200ms ease-out. Mobile = bottom sheet, desktop = centered modal (`max-w-md` / `max-w-2xl` for wider). Escape + overlay click dismiss
- **Toasts** — top-right (desktop), top-center (mobile). Tone-colored left accent bar (green for success). Auto-dismiss 2.5s. Fired from `useToasts` store
- **Page title** — `text-lg font-semibold leading-snug text-text-primary lg:text-xl` for all pages (matches Overview greeting)

---

## Pages

### Overview (`/`, `src/pages/overview/index.jsx`)

Single large file (~2000 lines) hosting: greeting + period switcher · TrialBanner (last day) · AccountCard with live status under `@handle` and Pause/Resume CTA · 3 metric cards (Total followers, Followers gained, Follow-back rate) · GrowthChart (5fr) + ActivityFeed (3fr) · GrowthPlusBanner · TargetsOverview + GrowthSettingsSnapshot.

**AccountCard (v4):**
- Avatar + `@handle` + plan + Trial pills · live status line directly under handle (icon + "Currently following @x" / etc.) with whole-line `animate-pulse` during running phases · `Pause growth` / `Resume growth` CTA on the right (outline ghost when running, filled green when paused). Hidden during `warming_up` / `setup`. Full-name line removed.
- Live status driven by `useSystemStatus` hook (shared with Targeting). Phase icons: `Search` (analyzing) · `UserPlus` (following) · `UserMinus` (unfollowing) · `Clock` (waiting) · `Flame` (warming) · `Settings` (setup) · `Pause` (paused). Colors: green (following) · blue (others active) · yellow (setup) · muted (paused).
- Click handle → links to `/targets` (handle is a `<Link>` when matching a stored target's value).
- No popover (deleted in v4 — `StatusPill`/`WorkingDots`/`formatApproxTime` all gone).

**GrowthChart:**
- 7 past striped-green bars + 7 dashed forecast bars (during trial) · summary strip (3 filter-pills) · `Trial ends` blue dashed `ReferenceLine` at last trial bar · GrowthBarTooltip (date + identity + 3-stat strip + Daily growth) · `cursor={false}` + `activeBar` outline on hover.

**ActivityFeed:**
- Capped at 5 items · Red `LIVE` pill · 7-day trial slice when `period === 'trial'`.

---

### Targeting (`/targets`, `src/pages/targets/`)

Stack: `LiveActivityCard` (status strip, fused) → `TargetsHeroCard` (icon + `Targets 10/30` + Add CTA) → `FilterRow` (pills wrap on mobile, sort inline) → `TargetList` (rows) → overlays (`AddTargetSheet`, `TargetDetailDrawer`, `RemoveTargetModal`).

**File layout:**
```
src/pages/targets/
  index.jsx                page shell + state wiring
  LiveActivityCard.jsx     SYSTEM ACTIVITY eyebrow + accent strip + animated phase
  TargetsHeroCard.jsx      Crosshair icon + Targets headline + slot count + Add CTA
  FilterRow.jsx            5 filter pills + sort dropdown
  TargetList.jsx           column header + rows + empty states
  TargetRow.jsx            avatar/Hash icon + name+sub + star + pill (md+) / dot (mobile) + count·% + chevron
  TargetDetailDrawer.jsx   ease-in drawer with stats + tinted Pause/Remove + IG link
  RemoveTargetModal.jsx    destructive confirmation
  AddTargetSheet.jsx       wider toggle + must-pick typeahead + pinned-size popup + suggestions
  HealthPill.jsx           Small / Good fit / Large / Very large
src/hooks/useSystemStatus.js  shared phase state machine (6–10s tick)
src/stores/useTargetsStore.js  filter/sort + CRUD
src/utils/formatCount.js  128400 → "128K"
src/mocks/targetSearch.js  20 accounts + 10 hashtags, async searchTargets(q, type)
src/mocks/suggestedTargets.js / suggestedHashtags.js
src/mocks/targets.js  rows with followers/posts + tuned follow-back rates
```

**LiveActivityCard + TargetsHeroCard are fused** (v3.4 — `rounded-t-xl` + `border-b-0` on top; `rounded-b-xl` + `mt-0` on bottom — single seam). The hero is `Targets 10/30` (smaller muted slot count after headline) + one-sentence explanation + single Add target CTA.

**Live status copy:** `Currently searching for targets` / `Currently following @x` / `Currently unfollowing @x` / `Pausing between actions` / `Warming up — growth starts within 72 hours` / `Setup needed — add your first target to start` / `Paused`. Same copy + icons used on Overview's AccountLiveStatus.

**TargetRow:** 36×36 avatar (or `Hash` icon for hashtags) · name + subline (`{formatCount(followers)} followers` or `{formatCount(posts)} posts`) · top-performer star · status pill (md+) or small dot (mobile) · `{count} · {rate}%` (rate colored by health) · `ChevronRight` (28×28 wrapper). Row tap opens `TargetDetailDrawer`.

**Add Target sheet:** must-pick typeahead (no freeform), avatar-style suggestion chips for both modes, single explainer at top, no `TARGETING` eyebrow, `min-h-[360px]` content area to prevent flicker.

**`useSystemStatus` hook:** ticks through `analyzing → following → waiting → unfollowing → waiting …` every 6–10s. Picks random active target on `following` / `unfollowing`. Returns `{phase, targetHandle, actionsToday, nextActionLabel, isPaused}`. Inert when baseline state is `warming_up` / `setup` / `paused`.

**Spec/plan**: latest in `docs/superpowers/specs/2026-04-23-targets-page-v2-design.md` + `plans/2026-04-23-targets-page-v2.md`. Polishing diffs in v3 plan + ad-hoc commits.

---

### Growth (`/growth`, `src/pages/growth/`) — v6

Settings dashboard with unified chrome. Every card leads with a tinted `CardChip` (blue/green/yellow/neutral) + title + `InfoTooltip` — no card subtitles anywhere on the page. Direct controls for Mode + Engagement (auto-save 1.5s debounced toast); read-only display + Edit modal for Filters; fused Lists card with Whitelist + Blacklist halves. No live status (settings page).

**Layout (desktop):**
```
H1 "Growth"
ModeCard (full width: blue chip + tooltip + "Within IG limits ✓" pill + 3 mode options)
┌── Engagement (left, green chip) ──┬── ListsCard (right, fused) ─────────────┐
│   Welcome DM preview when on      │  Whitelist (green) | Blacklist (neutral)
│   Close Friends progress + ticker │  vertical divider on lg:
│ Filters (left, yellow chip) ──────│  stacked + horizontal divider on mobile
└───────────────────────────────────┴──────────────────────────────────────────┘
GrowthPlusBanner (shared with Overview, purple)
```

Mobile stacks: H1 → Mode → Engagement → Filters → ListsCard (whitelist on top, blacklist below) → Growth+ banner.

**File layout:**
```
src/pages/growth/
  index.jsx                   page shell + filter modal state
  ModeCard.jsx                blue chip + within-IG-limits pill + 3 mode option cards
  EngagementCard.jsx          green chip + 3 toggles + WelcomeDmPreview + CloseFriendsProgress
  WelcomeDmPreview.jsx        chat-bubble preview (line-clamp-2) + filled "Edit message" button
  CloseFriendsProgress.jsx    green progress bar + pulsing handle ticker (4s cycle, mode-aware)
  WelcomeDmModal.jsx          unchanged
  FiltersCard.jsx             yellow chip + grouped read-only rows + Edit (no per-row icons)
  FiltersModal.jsx            wider 2-col modal: dropdown ranges + Custom · big segmented pills · NSFW switch
  ListsCard.jsx               fused container; renders both halves + owns both modals
  WhitelistHalf.jsx           green chip + count + entries + Pencil edit (square ghost)
  BlacklistHalf.jsx           neutral chip + count + entries + Pencil edit
  WhitelistModal.jsx          unchanged
  BlacklistModal.jsx          unchanged
src/components/CardChip.jsx       shared chip primitive (color/icon/size)
src/components/InfoTooltip.jsx    shared hover/focus tooltip (extracted from FiltersModal)
src/components/GrowthPlusBanner.jsx shared with Overview
src/components/SettingSwitch.jsx  shared switch primitive
src/components/UpgradeBottomSheet.jsx  shared upgrade modal
src/stores/useGrowthConfig.js     config + setters + announceSaved()
src/stores/useLists.js            replaceWhitelist + replaceBlacklist
src/mocks/growthConfig.js         + mockCloseFriendsProgress + mockCloseFriendsRecentHandles
src/pages/accountGrowthPlus/      stub for /account/growth-plus
```

**Mode card:** Blue chip + Settings2 icon + tooltip ("How Kicksta grows your account…"). 3 selection cards (Auto / Follow-only / Unfollow-only) below the header. "Within IG limits ✓" green pill in top-right of header replaces v5's standalone Shield+text safety footer.

**Engagement card:** Green chip + Heart icon + tooltip ("How Kicksta interacts with new followers."). Three rows:
- Like after follow — toggle only.
- Welcome DM — toggle. When on AND unlocked, shows `WelcomeDmPreview` (light blue chat bubble with `line-clamp-2` of stored message + filled blue "Edit message" → opens `WelcomeDmModal`).
- Close Friends Adder — toggle. When on AND unlocked, shows segmented Add/Remove pills + `CloseFriendsProgress` (`127/482 = 26%` green bar + pulsing "Adding @handle…" line cycling 5 mock handles every 4s; verb flips to "Removing" in remove mode).

**Filters card:** Yellow chip + SlidersHorizontal icon + tooltip ("Who Kicksta targets."). Grouped read-only rows under `AUDIENCE SIZE` and `ACCOUNT TYPE` sub-headers (no per-row icons; chip carries identity). Edit button → `FiltersModal`.

**Filters modal:** Wider (`max-w-2xl`), 2-col on desktop. Range fields are native `<select>` dropdowns with presets + "Custom…" (Custom reveals persistent Min/Max inputs — nothing jumps mid-edit). Privacy + Gender are wide segmented pills filling each column. Exclude NSFW is a `SettingSwitch` row at the bottom of the right column.

**Lists card:** Single fused card. Halves separated by `lg:divide-x` on desktop, `border-b` on mobile. Each half: `CardChip` + title + tooltip + square Pencil edit button. Whitelist chip = green `ShieldCheck`. Blacklist chip = neutral (no red — CLAUDE.md reserves red for errors). `ListsCard` owns the modal open state for both halves.

**Plan gating:** Same as v5 — `mockUser.plan === 'advanced'` by default; Welcome DM / Close Friends / Gender filter Advanced-only.

**Spec/plan:** v6 → `docs/superpowers/specs/2026-04-27-growth-page-v6-design.md` + `plans/2026-04-27-growth-page-v6.md`.

---

## DashboardLayout (`src/components/DashboardLayout.jsx`)

**Desktop sidebar** (`lg:+`, `w-60` or `w-16` collapsed):
1. Logo + `NotificationBell`
2. **AccountSwitcher** — avatar (with 12px connection-status dot) + `@handle` + follower count + chevron. Dropdown: 288px fixed (`w-72`), extends past sidebar. Active account row (Check + PlanPill + followers) + other accounts (PlanPill + followers OR red `AlertTriangle` + "Disconnected") + divider + "Add account" → `/signup/connect-instagram`.
3. Separator (`border-b border-border pb-3`)
4. Nav tabs: Overview · **Targeting** (label, route stays `/targets`) · Growth
5. Bottom: Signup flow (dev) · `SystemStatusRow` · Collapse · Logout

**Mobile**: header with `SystemStatusIconButton` + logo + `NotificationBell`; bottom tab bar Overview / Targeting / Growth.

`<ToastContainer />` mounted once at the layout's root for global toasts.

---

## Key mocks (all dynamic date-wise)

- **`mockUser`** — `isOnTrial: true`, `trialEndsAt = today 11 PM local`, `plan: 'advanced'`, `growthPlusSubscribed: false`. Exports `PLAN_CATALOG`.
- **`mockAccounts`** — 3 IGs (`alexjohnson.co` connected/advanced active · `alex.personal` disconnected/growth · `fitclub.brand` connected/advanced).
- **`mockGrowthDaily`** — 30 days ending today.
- **`mockActivity`** — fresh timestamps each load.
- **`mockSystemStatus`** — single object (not array); 5 named variants (`following` is the default export).
- **`mockTargets`** — 10 rows with `followers` (accounts) or `posts` (hashtags) + tuned `followBackCount` for clean rates.
- **`mockGrowthConfig`** — `closeFriendsAdder: {enabled, mode}`; filters with min/max ranges; default plan-gated rows render unlocked under `advanced`.
- **`mockWhitelist` / `mockBlacklist`** — small seeded arrays of `{id, username, addedAt}`.

---

## Helpers / patterns

- `getWindowSlice(data, period)` — `'trial'` → last 7 · period preset branches
- `getPeriodLabel`, `isTrialLastDay`, `remainingTime`, `filterByWindow` — same trial-7-day cutoff
- `formatCount(n)` — `128400 → "128K"` / `12.4M`
- `useSystemStatus()` — shared phase-cycle hook; consumed by Overview AccountLiveStatus + Targeting LiveActivityCard
- `useToasts.getState().addToast({message, tone, duration})` — fire toasts from any module-level handler
- Modal animation pattern: `mounted` state + `requestAnimationFrame` x2 → toggle `translate-y-4 → 0` + `opacity-0 → 100` over 200ms

---

## Deferred / known issues

1. **Predicted bars on chart** violate PRODUCT.md "no projected data" rule (acknowledged, deferred).
2. **Cancel subscription / profile dropdown** not yet implemented.
3. **AccountSwitcher** doesn't propagate to AccountCard / chart / metrics — UI only.
4. **Active-account disconnection** doesn't surface on switcher trigger (only in dropdown).
5. **Status dots** lack hover tooltips.
6. **Targeting at-cap state** (Growth at 10, Advanced at 30) not implemented; auto-pause-after-downgrade banner deferred; disconnected-IG variant deferred.
7. **Growth+ subscriber metrics** (chart, monthly extra count) deferred — only one-line summary in card.
8. **Manage subscription** link routes to `/account` (no-op destination).
9. **Mode/Engagement → Filter consistency** — Mode + Engagement auto-save inline; Filters + Lists require modal Save (intentional per v4 design).
10. **No unsaved-changes confirmation** on FiltersModal/ListsModal Cancel.

---

## Preview infra

- Vite dev server via `preview_start` (Claude Preview MCP) on port 5173
- Hard reload to bust HMR caching: `window.location.href = '/?bust=' + Date.now()`
- Mobile preset `375×812`, desktop `1280×900`
- Node not on the sandbox PATH — subagents skip lint and rely on visual verify

---

## Update log

- **2026-04-23** — initial CONTEXT written; chart redesign + trial-yellow→blue + AccountSwitcher
- **2026-04-23 (targets v1–v2)** — Targets page shipped; row redesign with avatars, detail drawer, typeahead, Live Activity card + shared `useSystemStatus` hook; Overview StatusPill consumes the same hook
- **2026-04-23 (targets v3)** — Settings-dashboard pass: TargetsHeroCard, eyebrow status pills, accent strip, slide animation, mobile dot, filter wrap, drawer animations
- **2026-04-24 (targets v3.1–v3.5)** — Polish: avatar suggestion chips, toasts (top-right green), `Targeting` rename, mobile next-in label, fused hero/activity card (single seam), per-phase icon colors, Clock for waiting, whole-line pulse
- **2026-04-24 (overview v4)** — AccountCard redesigned: live status under `@handle`, full name dropped, Pause/Resume CTA replaces StatusPill/popover, shared hook + matching icons across pages
- **2026-04-24 (growth v1)** — Initial Growth shipped: Safety + Mode + Engagement + Filters + Lists + Growth+; new `useGrowthConfig` (debounced toast) + `useLists`; shared `SettingSwitch` + `UpgradeBottomSheet`
- **2026-04-24 (growth v2)** — 2-col grid; Mode → 3 elevated cards; Close Friends Add/Remove; filters as compact inline rows; Lists must-pick typeahead; Growth+ purple hero
- **2026-04-24 (growth v3)** — Settings-dashboard pass: Filters + Lists become summary cards with focused drawers; Welcome DM textarea moves to modal; Growth+ compacts to one-row banner
- **2026-04-24 (growth v4)** — Filters + Lists become **visible-state cards** (all values / entries on the page) with top-right `Edit` button → modal with **local draft + Save/Cancel**. New `replaceLists` bulk action; `filterSummary` deleted; Drawers renamed → Modals
- **2026-04-27 (growth v5)** — Visual cohesion + readability pass: dropped SafetyStrip (safety copy moved into ModeCard footer); grouped Filters under AUDIENCE SIZE / ACCOUNT TYPE with per-row icons; split Lists into separate Whitelist (green ShieldCheck) and Blacklist (neutral Ban) cards each with its own Edit modal; new `LiveActivityStrip` above Growth+ banner; extracted `GrowthPlusBanner` to shared `src/components/` (used by Overview + Growth) with new "Add Growth+" CTA and "Manage subscription" subscriber link; stubbed `/account/growth-plus` route; split `replaceLists` into `replaceWhitelist` + `replaceBlacklist`
- **2026-04-27 (growth v6)** — Chrome + content depth pass: tinted `CardChip` per card (blue/green/yellow/neutral) replacing flat headers; subtitles dropped, `InfoTooltip` everywhere; ModeCard becomes the hero with within-IG-limits pill (no standalone safety line); EngagementCard embeds `WelcomeDmPreview` chat bubble + `CloseFriendsProgress` bar/ticker when their toggles are on; FiltersModal redesigned (max-w-2xl, 2-col, dropdowns + Custom, bigger pills, NSFW as switch); Whitelist + Blacklist fused into `ListsCard` with two halves; LiveActivityStrip + PresetRangePills + WhitelistCard + BlacklistCard deleted; H1 subtitle removed
