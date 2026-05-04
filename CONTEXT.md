# CONTEXT.md — Kicksta Dashboard working notes

> Rolling session memory. Complement to `CLAUDE.md` (tech/design system rules) and `PRODUCT.md` (product/copy rules). Update at the end of a session so the next one picks up without replaying.

---

## Project shape

React 19 + Vite 8 + Tailwind 4 + Recharts 3 + Zustand 5 SaaS dashboard for Instagram growth automation (V1 frontend-only, all mocked). Mobile-first, light/dark via CSS vars, Plus Jakarta Sans, Lucide icons. Path alias `@/` → `src/`. Repo under git on local `main`. Restore tag: `restore-point-pre-targets-merge` (pre-v3.4 fusion baseline).

**ngrok tunnel** (when running): `https://playhouse-bonfire-regroup.ngrok-free.dev` → `localhost:5173`.

**No unit-test framework.** Verification via `npm run lint` (when available) and visual inspection in Claude Preview.

---

## Resume context (2026-04-30)

**State of the working tree:** clean. All work committed. No worktrees in flight. Working directly on `main`.

**Restore tags currently in place:**
- `pre-settings-page-2026-04-29` — before user-settings-page work (`/account/*` build-out)
- `pre-settings-fixes-2026-04-29` — before settings-fixes polish
- `pre-targeting-engagement-split-2026-04-30` — before the most recent split (latest restore point)

If anything's regressed, hard-reset to the relevant tag.

**Last shipped (most recent first):**
- **Targeting / Engagement split** (8 commits, ending `32c8e50`) — `/growth` → `/engagement`, `/targets` → `/targeting` with `Targets` (default) + `Settings` tabs (`?tab=settings`). EngagementCard split into `WelcomeDmCard` + `CloseFriendsCard`. Like-after-follow inside `ModeCard`. `FiltersCard/Modal` renamed `AudienceFiltersCard/Modal`. `src/pages/growth/` deleted; `src/pages/targets/` → `src/pages/targeting/`. Old routes 301-redirect. Sidebar / drawer / bottom-tab labels: Growth → Engagement.
- Mock-data consolidation (`mockInstagram` collapsed into `useAccounts`)
- Layout refactor (theme prefers-color-scheme reverted to light default; ProfileDropdown; MobileNavDrawer; IG-disconnected banner; `/account/billing` merge; CLAUDE.md hamburger rule relaxed)
- Settings-page polish + fixes (one outer card, modal-only edits, multi-card payment store, `/account/subscriptions/:id` standalone)
- User settings page initial build (`/account/*` panels, `useUserProfile`/`usePaymentMethods`/`useSubscriptions` stores)

**Pending specs queue (in agreed priority order):**

1. **Navigation cleanup** — drop duplicate Log out (sidebar bottom + ProfileDropdown both have it), drop the duplicate "Add account" path (AccountSwitcher + Plan & billing). Pick a single source for the IG status surface (AccountSwitcher dot vs. ProfileDropdown row). User pre-approved my proposal; needs spec + plan + execution.
2. **Settings (mobile + billing history)** —
   - Mobile nav: drop the menu-screen, replace with top segmented strip (option (a) decided).
   - Billing history mobile: card-based rows + max-height scroll inside the card.
   - Server placement: parked, user said "we will come back to that later." DO NOT move the Server card on its own — wait for explicit instruction.
3. **Overview small fixes** — subtitle "How your account is growing." below the H1 + activity feed mobile cap (max-height ~5 rows, scrollable inside the card).
4. **Targeting popup polish** — small pulsing "currently being processed" indicator on one TargetRow; "last 5 interactions" section inside `TargetDetailDrawer`; demote drawer buttons to ghost-bordered (Pause/Resume) + text-color (Remove) + ghost-bordered Restore — keep 44px tap targets but visually less inviting; spacing cleanup (`rounded-b-xl` artifact on TargetsHeroCard now that LiveActivityCard is gone).
5. **Targeting modals visual identity (deeper brainstorm)** — Add target / Whitelist / Blacklist modals are bland; user wants color-coded chip headers per modal, suggestion chips with avatars, empty-state illustrations, etc. Needs its own brainstorm round before spec.
6. **GrowthPlusBanner placement (revisit prompt)** — currently parked at the bottom of the Engagement page. User asked me to prompt them about its final home once everything else above is done. **Don't decide unilaterally** — surface this question before closing out the broader refactor pass.

**Open architectural decisions still locked in but not yet implemented:**
- Navigation cleanup proposal (approved verbally, needs spec)
- ProfileDropdown's IG status row vs. AccountSwitcher's status dot — pick one and remove the other in the nav cleanup spec
- Settings server location — explicitly parked

**Deferred (from earlier sessions, not in this queue but worth knowing):**
- Chrome-level System Status surface (PRODUCT.md says "always visible with timestamps") — see deferred-items list, item 11
- Cancel subscription 6-step modal flow (fully spec'd in PRODUCT.md, currently a stub modal)
- Upgrade plan UX (currently a stub modal)
- In-product Add subscription flow (currently bounces to `/signup/connect-instagram`)
- Per-subscription card override (separate spec eventually)
- Real auth, real card processing, real email verification — all V1 mocks

**Skill usage hint for the next session:** when in doubt about whether to ship or brainstorm, prefer brainstorming first via `superpowers:brainstorming` for anything user-facing. The refactor work has been spec → plan → subagent-driven exec.

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

Single large file (~2000 lines) hosting: greeting + period switcher · TrialBanner (last day) · AccountCard with live status under `@handle` and Pause/Resume CTA · 3 metric cards (Total followers, Followers gained, Follow-back rate) · GrowthChart (5fr) + ActivityFeed (3fr) · TargetsOverview + GrowthSettingsSnapshot.

> **Cross-page sync (2026-04-29):** `TargetsOverview` now subscribes to `useTargetsStore` and `GrowthSettingsSnapshot` to `useGrowthConfig`. Changes made on the Targeting / Growth pages reflect here in real time. The stale `mockTargets` / `mockGrowthConfig` props are gone.

> **GrowthPlusBanner dropped (2026-04-29):** previously sat between the chart and TargetsOverview; removed to avoid the "saw this already" feeling between Overview and Growth. Banner stays only on Growth.

**AccountCard (v4):**
- Avatar + `@handle` + plan + Trial pills · live status line directly under handle (icon + "Currently following @x" / etc.) with whole-line `animate-pulse` during running phases · `Pause growth` / `Resume growth` CTA on the right (outline ghost when running, filled green when paused). Hidden during `warming_up` / `setup`. Full-name line removed.
- Live status driven by `useSystemStatus` hook (shared with Targeting). Phase icons: `Search` (analyzing) · `UserPlus` (following) · `UserMinus` (unfollowing) · `Clock` (waiting) · `Flame` (warming) · `Settings` (setup) · `Pause` (paused). Colors: green (following) · blue (others active) · yellow (setup) · muted (paused).
- Click handle → links to `/targets` (handle is a `<Link>` when matching a stored target's value).
- No popover (deleted in v4 — `StatusPill`/`WorkingDots`/`formatApproxTime` all gone).

**GrowthChart:**
- 7 past striped-green bars + 7 dashed forecast bars (during trial) · summary strip (3 filter-pills) · `Trial ends` blue dashed `ReferenceLine` at last trial bar · GrowthBarTooltip (date + identity + 3-stat strip + Daily growth) · `cursor={false}` + `activeBar` outline on hover.

**ActivityFeed:**
- Capped at 5 items · Red `LIVE` pill · 7-day trial slice when `period === 'trial'`.

**TargetsOverview rows (2026-04-29):** Avatar treatment matches TargetRow on the Targeting page — `Hash` icon for hashtags, profile pic when available, otherwise a 28×28 letter chip. Status rendering replaces dot+tooltip+depleted-only-pill with a uniform colored status pill (`Active` / `Queued` / `Paused` / `Depleted`) — same recipe as the Targeting page.

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

### Growth (`/growth`, `src/pages/growth/`) — v7

Settings dashboard with unified chrome and per-card draft/reset patterns. Every card leads with a tinted `CardChip` + title + `InfoTooltip` (no subtitles). Mode is a draft+Save pattern; Engagement uses auto-save toggles; Filters/Whitelist/Blacklist use Edit modals. Every card has a `Reset to defaults` ghost link in its footer behind a confirmation modal.

**Layout (desktop):**
```
H1 "Growth"
ModeCard (full width: chip + tooltip + within-IG-limits pill + 3 option cards + Save/Cancel when dirty + reset footer)
┌── Engagement (left, green chip) ──┬── Filters (right, yellow chip) ──┐
│   Welcome DM preview              │  Audience size                    │
│   Close Friends progress (full)   │  Account type                     │
│   Reset footer                    │  AudienceReachEstimate block      │
│                                   │  Reset footer                     │
├── Whitelist (left, green chip) ───┼── Blacklist (right, neutral) ─────┤
│   Letter chip rows + timestamps   │  Letter chip rows + timestamps   │
│   Reset footer                    │  Reset footer                     │
└───────────────────────────────────┴───────────────────────────────────┘
GrowthPlusBanner (shared, purple)
```

Mobile stacks: H1 → Mode → Engagement → Filters → Whitelist → Blacklist → Growth+ banner.

**File layout:**
```
src/pages/growth/
  index.jsx                  page shell + filter modal state
  ModeCard.jsx               draft+Save pattern; chip + within-IG pill + 3 option cards + reset footer
  EngagementCard.jsx         green chip + 3 toggles + WelcomeDmPreview + CloseFriendsProgress + reset footer
  WelcomeDmPreview.jsx       chat bubble + h-10 filled "Edit message" button (placeholder when off)
  CloseFriendsProgress.jsx   progress bar + ticker (placeholder when off)
  WelcomeDmModal.jsx         unchanged
  FiltersCard.jsx            yellow chip + grouped rows + AudienceReachEstimate + reset footer
  FiltersModal.jsx           wider 2-col modal; Quick presets row; range Min/Max always render (disabled when not Custom)
  AudienceReachEstimate.jsx  count + horizontal blue bar + banded hint copy
  audienceReach.js           pure deterministic estimator over filters
  WhitelistCard.jsx          green chip + letter-chip rows + timestamps + reset footer
  BlacklistCard.jsx          neutral chip + letter-chip rows + timestamps + reset footer
  WhitelistModal.jsx         scrollable entries list (max-h-72)
  BlacklistModal.jsx         scrollable entries list (max-h-72)
src/components/CardChip.jsx       shared chip (color/icon/size)
src/components/InfoTooltip.jsx    shared hover/focus tooltip
src/components/ResetConfirmModal.jsx  shared confirm modal
src/components/GrowthPlusBanner.jsx   shared with Overview
src/utils/formatRelativeShort.js  "5d ago" / "2w ago" / "1mo ago"
src/stores/useGrowthConfig.js   + resetMode + resetEngagement + resetFilters
src/stores/useLists.js          + resetWhitelist + resetBlacklist
```

**Mode card:** Blue chip + Settings2 icon + tooltip. Header pill: `Within IG limits ✓` (green-tint). Header right slot: when `draft !== savedMode`, ghost `Cancel` + filled blue `Save mode` buttons. Card body: 3 mode option cards. Saved option = solid blue + Check; staged option = dashed blue + light tint, no Check. Reset footer link → `ResetConfirmModal` → `resetMode()`.

**Engagement card:** Green chip + Handshake. 3 SettingSwitch rows. Welcome DM (when on) shows `WelcomeDmPreview` chat bubble + h-10 filled blue `Edit message` button. Close Friends (when on) shows full-width segmented Add/Remove (`flex w-full + flex-1` pills) + `CloseFriendsProgress` (mode-aware verb). Off-state placeholders preserve card height. Reset footer.

**Filters card:** Yellow chip + SlidersHorizontal. Grouped read-only rows. Footer block: `AudienceReachEstimate` (Estimated audience eyebrow + count + blue bar + hint copy). Reset footer.

**Filters modal:** Wider (`max-w-2xl`), 2-col on desktop. Quick presets row above the columns (3 pills). Range fields use native `<select>` dropdowns + persistent Min/Max inputs (disabled when not Custom — no jump). Privacy + Gender as wider segmented pills. Exclude NSFW = `SettingSwitch`.

**List cards:** Each row = letter chip (24px circle) + `@username` + `added Xd ago` muted timestamp via `formatRelativeShort`. Reset footer per card; reset clears the list to empty (not seeds). Edit button is a square Pencil ghost.

**List modals:** Entries list capped at `max-h-72` with internal scroll. Modal outer container retains `max-h-[85vh]` cap.

**Plan gating:** Same as v6 — Welcome DM / Close Friends / Gender filter Advanced-only.

**Spec/plan:** v7 → `docs/superpowers/specs/2026-04-28-growth-page-v7-design.md` + `plans/2026-04-28-growth-page-v7.md`.

---

## DashboardLayout (`src/components/DashboardLayout.jsx`)

**Desktop sidebar** (`lg:+`, `w-60` or `w-16` collapsed):
1. Logo + `NotificationBell`
2. **AccountSwitcher** — reads from `useAccounts` (active id + accounts list). Avatar (with 12px connection-status dot) + `@handle` + follower count + chevron. Dropdown: 288px fixed (`w-72`), extends past sidebar. Active account row (Check + PlanPill + followers) + other accounts (PlanPill + followers OR red `AlertTriangle` + "Disconnected") + divider + "Add account" → `/signup/connect-instagram`. Selecting another account writes to the store (consumers can subscribe via `useActiveAccount()`).
3. Separator (`border-b border-border pb-3`)
4. Nav tabs: Overview · **Targeting** (label, route stays `/targets`) · Growth
5. Bottom: Signup flow (dev) · `SystemStatusRow` · Collapse · Logout

**Mobile**: header with `SystemStatusIconButton` + logo + `NotificationBell`; bottom tab bar Overview / Targeting / Growth.

**NotificationBell** — reads from `useNotifications` store (`items`, `markAsRead`, `markAllRead`). Each row is a clickable button — tap to mark read. "Mark all read" link in dropdown header (visible only when unread > 0). Dropdown anchoring is breakpoint-aware: `right-0` on mobile (bell at top-right of page) and `lg:right-auto lg:left-0` on desktop (bell at top-right of narrow sidebar) so it never extends off-screen.

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
- `formatRelativeShort(iso)` — compact `5d ago` / `2w ago` / `1mo ago` for settings-row timestamps
- `useSystemStatus()` — shared phase-cycle hook; consumed by Overview AccountLiveStatus + Targeting LiveActivityCard
- `useToasts.getState().addToast({message, tone, duration})` — fire toasts from any module-level handler
- Modal animation pattern: `mounted` state + `requestAnimationFrame` x2 → toggle `translate-y-4 → 0` + `opacity-0 → 100` over 200ms

## Stores (Zustand)

- `useGrowthConfig` — Mode + Engagement + Filters config; debounced "Settings saved." toast via `announceSaved()`. Consumed by Growth page cards AND Overview's `GrowthSettingsSnapshot`.
- `useLists` — whitelist + blacklist; `addEntry`, `removeEntry`, `replaceWhitelist`, `replaceBlacklist`. Consumed by Whitelist/Blacklist cards + modals.
- `useTargetsStore` — targets list + filter/sort + CRUD. Consumed by Targeting page AND Overview's `TargetsOverview`.
- `useAccounts` (2026-04-29) — connected IG accounts (`accounts`, `activeId`, `setActiveId`); `useActiveAccount()` selector returns the current account.
- `useNotifications` (2026-04-29) — bell-icon dropdown items + `markAsRead(id)` / `markAllRead()`.
- `useToasts` — global toast queue.
- `useThemeStore` — light/dark; persisted to localStorage.

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
11. **Chrome-level System Status surface deferred (2026-04-30).** PRODUCT.md mandates "system status always visible with timestamps." Decision parked for review later — for now the Overview page's existing surfaces (AccountCard pause/resume, connection dot, warming-up block, `InstagramConnectionBanner`) are the only system-status signals the user sees. `src/components/SystemStatus.jsx`, `src/hooks/useSystemStatus.js`, and `src/mocks/systemStatus.js` remain on disk, unmounted. **Revisit when:** users start asking "is Kicksta doing anything?" again, OR a separate spec lands for a chrome-level live-activity ticker.

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
- **2026-04-28 (growth v7)** — Refinement pass: Mode draft+Save (dashed-blue staged style); bigger Welcome DM Edit button; full-width Close Friends segmented; Filters appended `AudienceReachEstimate` (deterministic mock formula); Whitelist/Blacklist letter chips + relative timestamps; FiltersModal range Min/Max always render (no jump on Custom) + Quick presets row; List modals cap entries at `max-h-72` with internal scroll; per-card `Reset to defaults` link + `ResetConfirmModal` with `bg-red-tint text-red-text` button; new store actions `resetMode/resetEngagement/resetFilters/resetWhitelist/resetBlacklist`
- **2026-04-29 (growth polish + cross-page sync)** — Cross-page sync: Overview's `TargetsOverview` + `GrowthSettingsSnapshot` now subscribe to live stores; Top Targets rows match Targeting (avatars + status pills); GrowthPlusBanner removed from Overview. New stores: `useAccounts` (AccountSwitcher rewired) + `useNotifications` (bell read state, "Mark all read", per-row click-to-read). Notification dropdown anchoring breakpoint-aware. Growth page polish: Mode staged card visual swap, Welcome DM bubble click-to-edit + hard 2-line truncate, Close Friends Activity matches AudienceReachEstimate framing, Filters section icons, Estimated Audience health pill (no bar) with mobile-short label, FiltersModal modal-level `forcedCustom` flag (compact From/To Custom inputs, Quick preset persistence), modal headers gain `CardChip`. Removed: "Within IG limits" pill, all `Reset to defaults` footers + `ResetConfirmModal`, `AccountStripe` (added then removed)
- **2026-04-29 (user settings page)** — New `/account/*` settings area replacing the empty placeholder. Two-pane shell (`SettingsNav` + `<Outlet />`) with Profile, Payment, Subscriptions list + detail at `/account/subscriptions/:id`. New stores: `useUserProfile`, `usePaymentMethod`, `useSubscriptions`. New mocks: `subscriptions.js`, `invoices.js`, `paymentMethod.js`, `servers.js`. Sidebar swap: System status entry replaced by Settings (gear icon, active across all `/account/*`); mobile top header drops the System Status icon button (kept as same-size spacer). `SystemStatus.jsx` + `useSystemStatus.js` + `mocks/systemStatus.js` parked but retained on disk. Upgrade plan / Add subscription / Cancel subscription ship as stub modals; real flows pending their own specs.
- **2026-04-30 (targeting/engagement split)** — `/growth` becomes `/engagement` (Welcome DM + Close Friends + parked GrowthPlusBanner). `/targets` becomes `/targeting` with two tabs: Targets (default) for the operational list, Settings for engine config (Mode + Audience filters + Whitelist + Blacklist). Tab state via `?tab=settings` search param. EngagementCard split into WelcomeDmCard + CloseFriendsCard; Like-after-follow folded into ModeCard. FiltersCard/Modal renamed AudienceFiltersCard/Modal to disambiguate from FilterRow's Active/Archived pills. Sidebar / drawer / bottom tab labels: Growth → Engagement. Old routes 301-redirect.
- **2026-04-30 (layout refactor)** — Per `docs/MIGRATION.md`. Theme initialization honors `prefers-color-scheme` on first load. New `ProfileDropdown` (desktop sidebar bottom + mobile header right) and `MobileNavDrawer` (left-anchored hamburger, hybrid model — bottom tab bar stays). `InstagramConnectionBanner` lifts the inline `DisconnectedBanner` out of `pages/overview/index.jsx` and rewires it to `useAccounts` so dropdown + drawer + banner stay in sync. `/account/payment` and `/account/subscriptions` collapse into `/account/billing` (`BillingPanel` = three sections: Payment methods → Subscriptions → Billing history); old paths redirect. `/account/subscriptions/:id` standalone detail unchanged. SettingsNav drops to two items. New `useDismissOnOutsideClick` hook centralizes dropdown dismissal logic. `CLAUDE.md` updated: hamburger no longer outright banned — banned only when used as the *only* mobile nav.
- **2026-04-29 (settings fixes)** — Multi-card payment store: `usePaymentMethods` (plural) replaces the singleton with `cards` + primary-card semantics. `PaymentMethodsCard` renders the list with a kebab menu (Set as primary / Edit / Remove) and a prominent "Used by N subscriptions · $X/mo total" summary pill. `EditPaymentModal` handles both add and edit modes via a `cardId` prop. ProfilePanel collapses to one outer card with eyebrow-labeled Personal info / Security sections; all edits open dedicated modals (`EditNameModal`, `EditEmailModal`, `EditPhoneModal`, existing `PasswordModal`) dispatched via `open-edit-*-modal` window events; Communication preferences and `commPrefs` store fields are gone. SubscriptionCard simplified to avatar + username + inline status pill + plan label + Next billing line. `/account/subscriptions/:id` lifts out of the settings shell into a sibling route under `DashboardLayout` — standalone page with its own back-arrow icon button + avatar header, no settings nav rail. AccountPage shell becomes viewport-aware on mobile: `/account` renders the menu, panels render their own H1 + back arrow. SettingsNav desktop active state adds a leading blue accent bar + filled icon chip; mobile active row flips its icon chip to filled blue.
- **2026-04-29 (settings polish)** — Visual parity pass: every section card now opens with `<CardChip>` + `<InfoTooltip>` matching Growth/Targeting. ProfilePanel split into three section cards (Personal info / Security / Communication) — Security chip is the yellow Lock with explicit room for future 2FA + sessions. Mobile push navigation: below `lg:`, `/account` renders SettingsNav as an iOS-style chevron list and panels add a "← Settings" back link; desktop two-pane preserved via a `matchMedia` redirect inside `AccountPage`. Depth metadata across cards — SubscriptionCard activity line + "Currently active" pill (linked to AccountSwitcher), PlanCard subscribed-since, PaymentMethodCard "Used by N subs". InvoicesTable status pills get color-coded dots; empty state gains a Receipt icon chip. New `pages/account/subscriptionShared.js` deduplicates STATUS_PILL/letterFor/formatDate/daysSince. Copy fixes: "Cancel..." → "Cancel subscription"; status pill inline with username on detail; modal close X bumped to h-10. Removed unused `useFullName` selector.
