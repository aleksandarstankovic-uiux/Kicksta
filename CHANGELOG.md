# CHANGELOG — Kicksta Dashboard

> Updated at the end of each working session. Every confirmed decision, addition, removal, or change is logged here.
> Before making any new change, check this log for conflicts with prior decisions.

---

## 2026-04-29 — Settings page polish

### Changed
- **Visual parity with Growth/Targeting** — every settings card now opens with a `<CardChip>` + heading + `<InfoTooltip>` (PlanCard / ServerCard / PaymentMethodCard / Subscriptions header / Billing history; ProfilePanel split below). Section headings standardized to `<h2 text-base font-semibold>`.
- **ProfilePanel split** — was one monolithic card with five rows; now three section cards: **Personal info** (blue User chip: Name / Email / Phone), **Security** (yellow Lock chip: Password — with room for 2FA / sessions), **Communication** (green Bell chip: email + SMS toggles + "Marketing emails are managed separately" link).
- **Mobile push navigation** — below `lg:`, `/account` itself now renders the SettingsNav as an iOS-style chevron list (icon chip + label + description); tapping pushes forward into the panel, panel adds a "← Settings" back link. Desktop two-pane layout unchanged via a `matchMedia('(min-width: 1024px)')`-gated `<Navigate>` that only fires on wide viewports.
- **Tap targets** — modal close X bumped from `h-8 w-8` to `h-10 w-10`; ServerCard "Change", InvoicesTable "Download", and ProfilePanel "Edit" links all now h-10 with proper hit areas.
- **Depth metadata** — SubscriptionCard footer "N invoices · Active for X days"; "Currently active" pill when the card's account matches the AccountSwitcher; PlanCard "Subscribed since <date> · X days"; PaymentMethodCard "Used by N subscriptions · $X/mo total".
- **Status pills** — InvoicesTable Paid/Failed/Pending pills get color-coded leading dots to match Targeting's status pill recipe.
- **Empty states** — InvoicesTable empty state gains a Receipt icon chip + roomier padding (was flat centered text).
- **Copy** — "Cancel..." → "Cancel subscription" per CLAUDE.md confirm-button rule. Subscription detail status pill now sits inline with the username instead of stacked beneath. Cancel danger zone heading promoted to h2 to match the rest.

### Created
- `src/pages/account/subscriptionShared.js` — extracts `STATUS_PILL`, `letterFor`, `formatDate`, `daysSince` so the list card and detail page consume one definition.

### Removed
- `useFullName` selector in `useUserProfile.js` (was exported but never consumed; re-add when a profile dropdown surface lands).
- The hard `<Route index element={<Navigate ... />} />` in App.jsx — replaced by viewport-aware redirect inside `AccountPage`.

### Decisions
- Mobile push-nav style — `/account` is now a valid mobile stop. Desktop preserves "redirect to Profile by default."
- Marketing-email management lives behind a future `open-marketing-prefs` event listener; the link is wired even though the listener isn't implemented yet.

---

## 2026-04-29 — User settings page

### Created
- `/account/profile`, `/account/payment`, `/account/subscriptions`, `/account/subscriptions/:id` — full settings area with two-pane shell, inline-edit profile, card-on-file editor, consolidated + per-subscription invoice tables, plan/server/Growth+ controls.
- Stores: `useUserProfile`, `usePaymentMethod`, `useSubscriptions`.
- Mocks: `subscriptions.js`, `invoices.js`, `paymentMethod.js`, `servers.js`.
- Stub modals for Upgrade plan, Add subscription (routes to `/signup/connect-instagram`), Cancel subscription — full flows deferred to their own specs.

### Changed
- **Sidebar nav swap** — "System status" entry replaced by "Settings" routing to `/account` (gear icon, active across all `/account/*` routes). Mobile top header drops the System Status icon button (kept a same-size spacer to preserve the centered logo).
- **`/account` redirect** — hitting `/account` now redirects to `/account/profile` via a nested index route. The previous placeholder Account page is gone.

### Decisions
- Each connected IG account = one subscription; one shared payment method covers all.
- Plan upgrade, Add subscription, and Cancel subscription ship as stubs in this spec; full flows get their own specs later.

### Deferred / known gaps
- 6-step cancellation flow (separate spec).
- In-product upgrade comparison sheet (separate spec).
- Native Add-subscription flow (currently routes to signup connect-IG).
- Real email-change verification, real password update, real card processing — all mocked.

---

## 2026-04-29 — Growth polish + cross-page sync

### Changed
- **Cross-page data sync** — `TargetsOverview` and `GrowthSettingsSnapshot` on the Overview page now subscribe to `useTargetsStore` and `useGrowthConfig` directly. Adding/pausing/removing a target on Targeting, or toggling Mode/Engagement/Filters on Growth, now reflects in real time on Overview.
- **Top Targets on Overview** — rows now show the same avatar treatment as the Targeting page (`Hash` icon for hashtags, profile pic when available, letter chip otherwise) AND the same colored status pill (`Active` / `Queued` / `Paused` / `Depleted`). The legacy status dot + tooltip + Depleted-only pill is gone.
- **AccountSwitcher** rewired to a real Zustand store. New `useAccounts` (`accounts`, `activeId`, `setActiveId`) plus a derived `useActiveAccount()` selector. Clicking a different account in the sidebar now writes to the shared store; consumers can subscribe instead of reading the static `mockInstagram` constant.
- **NotificationBell** now reads from a `useNotifications` store with `markAsRead(id)` + `markAllRead()` actions. Each notification row in the dropdown is a clickable button — tap to mark read; the unread badge dot disappears. New "Mark all read" link in the dropdown header (visible only when unread > 0). Dropdown position changed to `right-0 lg:right-auto lg:left-0` so it opens rightward into the main content area on desktop instead of off the left edge of the narrow sidebar.
- **Growth page Mode draft** — saved-but-deselected card now keeps a *muted* Check icon as a memory of the prior choice; the staged card gets the solid-blue treatment. Mobile gets a duplicate Save mode + Cancel button row below the option grid (`flex lg:hidden`) so the user can confirm without scrolling back to the header.
- **Growth page Welcome DM** — chat bubble itself is the affordance now (clickable, with a hover border + shadow); separate "Edit message" button is gone. Helper line below reads "Click the bubble to edit" / "Edit becomes available when on". Bubble hard-truncates to 2 lines (`line-clamp-2` + `maxHeight: '2.85em'` + `overflow-hidden`) — never expands regardless of message length.
- **Growth page Close Friends Activity** — visual parity with `AudienceReachEstimate`: same `rounded-lg bg-bg p-4` shell, eyebrow + count + "Active" pill on the right + green progress bar + pulsing handle ticker. Off-state shows a 0% bar + "Activity will appear when on".
- **Filters card** — section group headers gain a small icon prefix (`Users` for "Audience size", `User` for "Account type"). Bottom border between Account Type rows and the Estimated Audience block is now flush (no `pb-4`). Estimated Audience drops the horizontal progress bar in favour of a green/yellow `Healthy reach` health pill (mobile drops the trailing " reach" via `sm:hidden` / `hidden sm:inline`).
- **FiltersModal** — header gets a yellow `SlidersHorizontal` `CardChip`. Quick presets become bigger card-style buttons (3-col grid) with icon + label + description per preset. Selected preset shows solid blue border + tint and persists across modal open/close (on open, the modal computes which preset matches stored filters and restores `activePreset`). Auto-deselects when any draft field diverges from the active preset's defined values. Range Min/Max inputs render *only* when Custom is picked — compact inline `From [Min w-24] to [Max w-24]` pair instead of full-width inputs that clipped into the next column. `forcedCustom` lifted to modal-level state so picking Custom and typing preset-matching values does *not* snap the dropdown back.
- **Whitelist + Blacklist modals** — get matching `CardChip` headers (green ShieldCheck / neutral Ban). Modal entry rows now use the same letter-chip + @username + "added Xd ago" recipe as the page cards. New entries prepend (`[entry, ...prev]`) instead of appending so the most recent addition shows at the top.
- **WelcomeDmModal** header — green `MessageSquare` `CardChip`.

### Created
- `src/stores/useAccounts.js` — Zustand store for connected IG accounts. `useActiveAccount()` returns the currently selected account.
- `src/stores/useNotifications.js` — Zustand store for the bell-icon dropdown.
- `src/pages/growth/audienceReach.js` (already shipped in v7 plan, re-confirming returns now `{ count, health, tone }`).

### Removed
- **GrowthPlusBanner from Overview** — same banner appearing on both Overview and Growth read as repetitive. Kept only on Growth where the upgrade action is closer to context.
- **"Within IG limits" pill** from the Mode card header.
- **`Reset to defaults`** ghost-link footer + `ResetConfirmModal` and the corresponding store reset actions (`resetMode`/`resetEngagement`/`resetFilters`/`resetWhitelist`/`resetBlacklist`). Decision was that the reset mechanic didn't fit the v7 surface.
- **`AccountStripe`** — added briefly above page titles on Targeting + Growth, then removed at the user's request. The `useAccounts` store stays.
- The 3-tip stack experiment in the Filters card (reverted to the single `Lightbulb` line).

### Decisions
- Filter mock seed updated to land on labelled preset values (`followingMin: 500, followingMax: 5000` etc.) so the FiltersModal opens on named options instead of three "Custom…" dropdowns.
- The active preset is computed against stored filters on every modal open — no sticky session state needed beyond what's in `useGrowthConfig`.
- Notifications dropdown anchoring is per-breakpoint: right-anchored on mobile (bell at top-right of the page) and left-anchored on desktop (bell at top-right of the narrow sidebar) so it never extends off-screen.

### Deferred / known gaps (from the cross-page audit)
- **AccountSwitcher → page content propagation** — the store now exists, but Overview's `AccountCard` / metrics / chart / activity feed still read from `mockInstagram`. Switching accounts only updates the sidebar trigger UI today.
- **System pause state** — Overview's pause/resume button uses local `useState`; doesn't share with the Targeting page's `useSystemStatus` (which is a phase simulator, not a writable store).
- **Plan-tier reads** — `EngagementCard` / `FiltersCard` / `TargetsHeroCard` still read `mockUser.plan` directly. Will fold into a `useUser` store when the plan upgrade flow lands.
- **GrowthPlusBanner subscriber metrics** always render `mockGrowthPlusInsights` regardless of subscriber state. Cosmetic-only since users can't subscribe in V1.
- **Chart predicted bars** still violate PRODUCT.md's "no projected data" rule (acknowledged from earlier sessions).

---

## 2026-04-28 — Growth page v7 (refinement pass)

### Changed
- **Mode card** — selecting a mode is now a draft; saved mode keeps the solid-blue selected style, the staged-but-unsaved mode gets a dashed-blue border + light tint. Save mode + Cancel buttons appear in the header only when draft differs from saved. Save fires the existing debounced toast.
- **Welcome DM** edit button — bumped to `h-10 px-4 text-sm` (was `h-8 px-3 text-xs`). Matches FiltersModal Save and Mode Save sizes.
- **Close Friends segmented control** — now fills the row width (`flex w-full` with `flex-1` pills) so the two options split the row evenly.
- **Filters card** — appended an `Estimated audience` footer block with a count (e.g. `~12,400 accounts match your filters`), a horizontal blue progress bar (settings-derived), and a banded hint sentence. Pure mock formula in `audienceReach.js` — replaceable with a real API later without changing call sites.
- **Whitelist + Blacklist cards** — each row now shows `[Letter chip] @username · added Xd ago`. Letter chip is a 24×24 muted circle. Timestamp uses a new `formatRelativeShort` helper (compact `5d ago` / `2w ago` / `1mo ago`).
- **FiltersModal Custom range** — Min/Max inputs now render in BOTH states (greyed/disabled when not Custom; editable when Custom). Removes the height jump that pushed one column taller than the other.
- **FiltersModal quick presets** — three pills above the two columns (`Most users`, `Niche audience`, `Macro reach`) write all 9 filter values to the draft at once. Save still required to commit.
- **Whitelist + Blacklist modals** — entries list now caps at `max-h-72` and scrolls internally when many entries are added; header + typeahead + Save/Cancel stay pinned.

### Created
- `src/components/ResetConfirmModal.jsx` — reusable confirmation for the new Reset to defaults action on every settings card. `bg-red-tint text-red-text` ghost-destructive button per CLAUDE.md.
- `src/utils/formatRelativeShort.js` — compact relative-time formatter for settings-row timestamps.
- `src/pages/growth/audienceReach.js` — pure deterministic estimator over the filters object.
- `src/pages/growth/AudienceReachEstimate.jsx` — UI block consuming the estimator.
- New store actions: `resetMode`, `resetEngagement`, `resetFilters` on `useGrowthConfig`; `resetWhitelist`, `resetBlacklist` on `useLists`.

### Decisions
- **Reset semantics for lists** — Reset clears Whitelist/Blacklist to empty, not back to the seed. Seed is for visual richness on a fresh page; "reset" semantically means "remove my customizations."
- **Custom dropdown when not Custom** — Min/Max inputs show empty values (not the underlying min/max) when the dropdown isn't on Custom. The greyed disabled state communicates "pick Custom to edit." Switching to Custom initialises from whatever the previous preset set the underlying values to.
- **Mode draft sync** — `useEffect` syncs draft from saved mode when saved mode changes externally (e.g. via Reset). Keeps the staged style in lockstep with the store.

---

## 2026-04-27 — Growth page v6 (chrome unification + content depth)

### Changed
- **Chrome system** — every settings card now leads with a tinted icon chip (Mode = blue Settings2, Engagement = green Heart, Filters = yellow SlidersHorizontal, Whitelist = green ShieldCheck, Blacklist = neutral Ban). Card subtitles removed everywhere; an `InfoTooltip` next to each title carries the explanation.
- **Page opener** — H1 subtitle removed. `ModeCard` is now a full card with chip + tooltip + a green "Within IG limits ✓" pill on the right (replaces the standalone Shield+text safety footer).
- **Engagement card** — Welcome DM row, when on, shows a chat-bubble preview of the message + a filled blue "Edit message" button. Close Friends Adder, when on, shows a green progress bar (`127/482 = 26%`) and a pulsing "Adding @handle…" ticker that cycles through 5 mock handles every ~4s. Verb flips to "Removing" in remove mode.
- **Filters modal** redesigned — wider (`max-w-2xl`), two-column on desktop (Audience size · Account type). Range filters now use a native `<select>` dropdown with presets + "Custom…" option (custom reveals persistent Min/Max inputs — nothing jumps mid-edit). Privacy + Gender are bigger segmented pills. Exclude NSFW is a `SettingSwitch` row.
- **Lists card** — Whitelist + Blacklist fused into a single `ListsCard` with two halves (vertical divider on desktop, horizontal on mobile). Edit button per half is now a square Pencil icon button. Card height is balanced internally; right column = one card matching Engagement+Filters height.
- **Filters card** drops the per-row icons; card-level chip carries identity now.

### Created
- `src/components/CardChip.jsx` — shared tinted chip primitive (`color="blue|green|yellow|neutral"`, `icon`, `size="md|lg"`).
- `src/components/InfoTooltip.jsx` — extracted from FiltersModal; visible on all breakpoints.
- `src/pages/growth/WelcomeDmPreview.jsx`
- `src/pages/growth/CloseFriendsProgress.jsx`
- `src/pages/growth/ListsCard.jsx`, `WhitelistHalf.jsx`, `BlacklistHalf.jsx`
- Mock data: `mockCloseFriendsProgress`, `mockCloseFriendsRecentHandles` in `src/mocks/growthConfig.js`.

### Removed
- `src/pages/growth/LiveActivityStrip.jsx` (settings page, no live status).
- `src/pages/growth/PresetRangePills.jsx` (logic absorbed into the dropdown).
- `src/pages/growth/WhitelistCard.jsx` and `BlacklistCard.jsx` (replaced by halves inside the fused card).
- All card subtitles on the Growth page.
- Standalone Shield + safety line at the bottom of `ModeCard`.

### Decisions
- **Tinted chip pattern is the through-line for "feels like the rest of the dash."** Same chip recipe Overview uses (Sparkles chip in GrowthPlusBanner, avatar ring on AccountCard) — applied consistently to every Growth card.
- **Blacklist chip is neutral (`bg-bg`), not red.** CLAUDE.md reserves red for connection errors; blacklist is a configuration state, not an error state.
- **No metric tiles, no charts, no live status on Growth.** Only live energy is the Close Friends ticker, which is a *consequence of the user's settings* rather than dashboard analytics.

---

## 2026-04-27 — Growth page v5 (visual cohesion + readability)

### Changed
- **Top of page** — `SafetyStrip` removed; safety message ("Kicksta stays within Instagram's safe daily limits.") folded into a small inline footer at the bottom of `ModeCard` with a muted Shield icon
- **Filters card** — flat 6-row list replaced with two grouped sub-sections (`AUDIENCE SIZE`: Following / Follower / Media · `ACCOUNT TYPE`: Privacy / Gender / Exclude NSFW). Each row gains a Lucide icon prefix (Users / UserPlus / Image / Lock / User / ShieldOff). Edit button + handlers + value formatters unchanged
- **Lists card** split into two distinct cards — **Whitelist** (green `ShieldCheck` icon, "Accounts Kicksta will never unfollow.") and **Blacklist** (neutral `Ban` icon, "Accounts Kicksta will never follow."). Each card shows a `N accounts protected` / `N accounts blocked` eyebrow + entries inline. Each has its own dedicated Edit modal — `WhitelistModal` and `BlacklistModal` — with typeahead + draft + Save/Cancel
- **Layout** reorganised to a symmetric 2×2 grid: left column = Engagement → Filters · right column = Whitelist → Blacklist
- **Growth+ banner** unified with Overview — extracted to `src/components/GrowthPlusBanner.jsx`, used on both pages. Non-subscriber CTA copy is now "Add Growth+" → `/signup/growth-plus`. Subscriber state shows a "Manage subscription" link → new `/account/growth-plus` stub. Compact one-row `GrowthPlusCard` deleted
- **`useLists` store** — `replaceLists(white, black)` split into `replaceWhitelist(list)` and `replaceBlacklist(list)`

### Created
- `src/components/GrowthPlusBanner.jsx` — shared between Overview and Growth
- `src/pages/growth/WhitelistCard.jsx`, `WhitelistModal.jsx`
- `src/pages/growth/BlacklistCard.jsx`, `BlacklistModal.jsx`
- `src/pages/growth/LiveActivityStrip.jsx` — driven by `useSystemStatus`. Phase icon + status copy + (lg only) "next in ~X min" hint. Hidden in `setup`. Sits above the Growth+ banner
- `src/pages/accountGrowthPlus/index.jsx` + `/account/growth-plus` route — stub page so the Manage subscription link has a real destination. Full management UI deferred

### Removed
- `src/pages/growth/SafetyStrip.jsx`
- `src/pages/growth/ListsCard.jsx`, `ListsModal.jsx`
- `src/pages/growth/GrowthPlusCard.jsx`
- Inline `GrowthPlusBanner` definition in `src/pages/overview/index.jsx` (now imported from `@/components/`)
- `useLists.replaceLists` bulk action

### Decisions
- **Growth is configuration, not analytics.** No metric tiles, historical numbers, or charts on the page — Overview owns performance. The one piece of live energy is the `LiveActivityStrip`, which only shows what is happening *right now* (no totals or rates)
- **Whitelist accent treatment** resolved as the green `ShieldCheck` icon next to the title (not a green top-strip). Single visual cue, no double-marking
- **Growth+ is positioned as an *addition*, not an upgrade** — copy switched from "Upgrade to Growth+" to "Add Growth+" everywhere. Subscriber lifecycle gets a dedicated `/account/growth-plus` route (stubbed for now)

---

## 2026-04-24 — Growth page v4 (visible state + edit modals)

### Changed
- **Filters card** becomes a read-only display of every setting (6 rows — Following count · Follower count · Media count · Account privacy · Gender target · Exclude NSFW), each with its current value on the right. Top-right `Edit` button opens a modal
- **Lists card** displays both Whitelist and Blacklist with all entries visible on the page. Top-right `Edit` button opens a modal
- **FiltersModal + ListsModal** now use **local draft state** with explicit **Cancel / Save** footers. Edits don't commit until Save is clicked; Cancel / overlay-tap / Escape discards. One debounced "Settings saved." toast fires on Save
- **Grid stays** `lg:grid-cols-2 lg:items-start` — right column (Filters + Lists) gets taller but column heights don't stretch each other

### Created
- `src/pages/growth/FiltersModal.jsx` (replaces `FiltersDrawer.jsx`)
- `src/pages/growth/ListsModal.jsx` (replaces `ListsDrawer.jsx`)

### Removed
- `src/pages/growth/FiltersDrawer.jsx`
- `src/pages/growth/ListsDrawer.jsx`
- `src/pages/growth/filterSummary.js` (unused after v4)

### Store changes
- `useLists.replaceLists(whitelist, blacklist)` — new bulk action for the ListsModal Save flow

### Decisions
- **Visible state > compact summary.** v3 hid all filter values behind a one-line summary; v4 restores scannability by showing every value
- **Explicit Save/Cancel over auto-save inside the modal.** Matches the "inspect-then-edit" mental model users expect for complex forms; auto-save stays for Mode + Engagement which are direct, single-knob changes
- **No unsaved-changes warning on Cancel.** Reversible data, low risk; the toast system makes save-state obvious. Can add a confirmation later if user behavior shows pain

---

## 2026-04-24 — Growth page v3 (settings-dashboard rework)

### Changed
- **Filters becomes a summary card + drawer.** In-page view is a single sentence (e.g. `200–50K followers · NSFW excluded`) with a `Customize` button. Full 6-dial UI moves to a focused drawer. Page height stops changing when Custom ranges open
- **Lists becomes a summary card + drawer.** In-page view shows `Whitelist (N) · Blacklist (M)` with a `Manage` button. Tabs + typeahead + entries all live in the drawer
- **Welcome DM textarea moves to a modal.** Engagement card shows an `Edit message` link when enabled; clicking opens a small modal with the textarea, Cancel/Save. Engagement card is now fixed-height for Welcome DM
- **Growth+ compacts to a one-row banner.** Icon + eyebrow + headline + sub copy + `Add Growth+ →` CTA all on one line at `lg:+`. Stacks on mobile. No empty right-column space
- **Grid rebalances** to symmetric `lg:grid-cols-2`: Engagement left, Filters summary + Lists summary stacked right. Equal visual weight
- **Close Friends segmented sub-control** stays inline — small enough (~60px) to keep visible when toggled on

### Created
- `src/pages/growth/FiltersDrawer.jsx`
- `src/pages/growth/ListsDrawer.jsx`
- `src/pages/growth/WelcomeDmModal.jsx`
- `src/pages/growth/filterSummary.js` — `summarizeFilters(filters)` helper

### Rewritten
- `src/pages/growth/FiltersCard.jsx` · `ListsCard.jsx` · `GrowthPlusCard.jsx` · `EngagementCard.jsx` · `index.jsx`

### Unchanged
- `ModeCard.jsx` · `SafetyStrip.jsx` · `PresetRangePills.jsx` · `SettingSwitch.jsx` · `UpgradeBottomSheet.jsx` · all stores and mocks

### Decisions
- **Settings dashboard over form.** Growth config is changed rarely; the page should feel configured, not in-flight. Direct controls for Mode + Engagement (the frequent knobs); summary + drawer for Filters + Lists (the rarer, denser knobs)
- **Fixed-height default, by design.** The only remaining variable-height interaction is Close Friends' segmented sub-control (~60px, one state, acceptable)
- **Growth+ banner borrows the Overview banner's proportions.** Same visual vocabulary across the dashboard; no duplicate hero treatment

---

## 2026-04-24 — Growth page v2 (rework)

### Changed
- **2-column desktop grid.** Mode full-width → Engagement + Lists (narrower left column) beside Filters (wider right column) → Growth+ banner full-width closer. Mobile stacks. Page feels dense and scannable instead of mostly empty
- **Mode card → 3 elevated option cards.** `Zap` / `UserPlus` / `UserMinus` icons, longer descriptions, `Recommended` pill on Auto, `Check` indicator on the selected card. Primary decision on the page now gets the visual weight it deserves
- **Engagement card — Close Friends add/remove mode.** Toggling Close Friends Adder on reveals a segmented `Add new followers · Remove unfollowers` sub-control with a description that updates per mode
- **Filters card — compact inline rows.** Each filter is one line (label left, control right); `Info` tooltips on desktop carry the explainers. `Exclude NSFW` switch inlined alongside the others
- **Lists card — typeahead must-pick.** Typing 2+ chars shows matches from the shared `searchTargets` fixture pool; `Add` disabled until a match is picked, matching the Targeting page's behavior (IG handles must map to real accounts)
- **Growth+ hero banner.** Purple-tint full-width closer with `Sparkles` icon, headline, body copy, 3 benefit bullets (`Check` icons), and a purple `Add Growth+ →` CTA. Subscriber variant stays compact with `Active/Paused` pill + switch + manage link

### Data / store changes
- `mockGrowthConfig.closeFriendsAdder`: `false` → `{ enabled: false, mode: 'add' }`
- `useGrowthConfig.toggleCloseFriends` now flips `.enabled` on the nested shape
- **New** `useGrowthConfig.setCloseFriendsMode(mode)` — `'add'` or `'remove'`

### Files rewritten
- `src/pages/growth/ModeCard.jsx` · `EngagementCard.jsx` · `FiltersCard.jsx` · `ListsCard.jsx` · `GrowthPlusCard.jsx` · `index.jsx`
- `src/pages/growth/PresetRangePills.jsx` (pill padding tightened for inline rows)
- `src/stores/useGrowthConfig.js` · `src/mocks/growthConfig.js`

### Decisions
- **Grid A over symmetric 2-col.** Mode deserves full width; Engagement + Lists are naturally narrow; Filters needs breathing room; Growth+ is a hero
- **Elevated selection cards for Mode** (not segmented pills). Mode is the page's primary decision — bigger options with icon + description land the stakes; `Recommended` pill reduces analysis paralysis for new users
- **Close Friends "pick one mode"** instead of two independent sub-toggles. Matches user intent ("a mode for either X or Y"); one knob is simpler
- **Tooltips on filters** instead of always-visible descriptions. Labels are self-explanatory; descriptions would fight the denser layout. Tooltips are a desktop-only nicety; mobile drops them entirely without losing usability
- **Must-pick typeahead on Lists.** Same rationale as Targeting — handles must map to real IG accounts for the engine to do anything meaningful with them
- **Growth+ stays banner-shaped** (not card-shaped). Matches the Overview's Growth+ banner visual vocabulary; on the Growth page it gets hero-sized with a benefit list because this is where users are already considering Growth+-adjacent configuration

---

## 2026-04-24 — Growth page

### Created
- **`/growth` page** — Safety strip, Mode, Engagement, Filters, Lists, Growth+ — in that order, all cards using the same radius/border rhythm as other pages
- **Shared `SettingSwitch` primitive** (`src/components/SettingSwitch.jsx`) — title + description + switch row, with `locked` prop for plan-gated features (renders subdued + `Advanced` pill + opens the upgrade sheet on tap)
- **Shared `UpgradeBottomSheet`** (`src/components/UpgradeBottomSheet.jsx`) — per-feature headline + benefit + unlocks list + primary `Upgrade to Advanced` CTA routing to `/signup/plan-selection`. Called from plan-gated rows (Welcome DM, Close Friends Adder, Gender filter)
- **`useGrowthConfig`** (`src/stores/useGrowthConfig.js`) — config state seeded from `mockGrowthConfig`; every setter fires a debounced "Settings saved." toast (1.5s)
- **`useLists`** (`src/stores/useLists.js`) — whitelist/blacklist with `addEntry` (returns `ok`/`duplicate`/`invalid`) and `removeEntry`
- **`PresetRangePills`** — preset-or-custom pill group used for the three numeric range filters
- `docs/superpowers/specs/2026-04-24-growth-page-design.md` · `docs/superpowers/plans/2026-04-24-growth-page.md`

### Decisions
- **Auto-save with debounced toast (1.5s).** Matches the rest of the dashboard's "things happen in real time" tone. No save button
- **All filters visible at once.** Honest about the configurable surface. Fallback option noted — drop to a collapsed "Advanced filters" expand if density ever feels heavy
- **Whitelist + Blacklist live in one card with internal tabs.** They're "exceptions to the default behavior" — one concept, two sides
- **Welcome DM textarea is uncontrolled + saves on blur.** Keeps the toast system calm; store updates only when the user leaves the field
- **Growth+ has its own card with `bg-bg`** so it reads as a distinct product, per PRODUCT.md Problem 1 (never merge Growth+ with Targeted Growth)
- **Plan-gating: subdued row + `Advanced` pill → shared `UpgradeBottomSheet`.** Reuses one sheet for Welcome DM, Close Friends, Gender filter, and (future) at-cap target slots — contextual content per `feature` prop

---

## 2026-04-24 — Overview AccountCard v4

### Changed
- **Live status moved under the `@handle`** — replaces the right-side `StatusPill`. Shares phase copy + icon map with the Targeting page's `LiveActivityCard` via the same `useSystemStatus` hook. Ambient `animate-pulse` on the phase icon during running phases + low-contrast shimmer sweep across the phase text (~5s loop) so the status always feels alive
- **Full name row removed** from the AccountCard. The `@handle` carries enough identity; AccountSwitcher handles multi-account disambiguation
- **`Pause growth` / `Resume growth` CTA** replaces the old `StatusPill` popover. Outlined ghost when running (calm), filled green primary when paused (asserts "action needed"). Direct toggle — no confirmation modal; fires a success toast (`Growth paused.` / `Growth resumed.`)
- **Popover killed** — info like "Next action" / "Processing batch…" no longer surfaces on Overview. The Targeting page's `LiveActivityCard` carries the richer view for anyone who wants it

### Created
- `AccountLiveStatus` + `AccountPauseCTA` — both defined inline in `src/pages/overview/index.jsx` alongside the `AccountCard` they support
- `@keyframes status-shimmer` in `src/index.css`
- `docs/superpowers/specs/2026-04-24-overview-account-card-redesign.md` · `docs/superpowers/plans/2026-04-24-overview-account-card-redesign.md`

### Removed
- `StatusPill` function (and its popover)
- `WorkingDots` loader (only used by `StatusPill`)
- `formatApproxTime` helper (only used by `StatusPill`)

### Decisions
- **Direct pause toggle, no modal.** Pause is reversible; friction is unjustified
- **Hide CTA during `warming_up` / `setup`.** Pausing something that hasn't started is confusing — the status line copy carries the state message instead
- **Shimmer over typewriter-style animation.** Shimmer is ambient and ignorable; typewriter would demand attention every phase change
- **Handle in status line links to `/targets`** (not an inline drawer) — the detail drawer lives on Targeting; Overview's status line is a read-only signal

---

## 2026-04-24 — Targets page v3.3 (micro-polish)

### Changed
- **TargetsHeroCard** — explanation paragraph bumped back to `text-sm` (14px). 12px was too small relative to the rest of the page
- **TargetDetailDrawer** — removed the `Open on Instagram ↗` external link at the bottom. Also dropped the unused `instagramUrl` variable and `ExternalLink` import
- **AddTargetSheet**:
  - Added a **clear-X button** inside the input (shown only when the input has content). Clicking it clears the input, matches list, and picked match, then refocuses
  - **Suggestions stay visible** while typeahead is showing results (previously hidden). Users can browse suggestions at any time without losing their typing context

---

## 2026-04-24 — Targets page v3.2 (polish)

### Changed — Status surfaces
- **LiveActivityCard** — phase now shown with a **Lucide icon** (replaces the colored dot for recognizable phases): `UserPlus` (following), `UserMinus` (unfollowing), `Flame` (warming up), `Search` (searching for targets — renamed from "analyzing"), `Settings` (setup), `Pause` (paused). `waiting` phase keeps the colored dot. Transition between phases is now a combined **fade + slide-in-from-bottom-1** using Tailwind 4 `animate-in` utilities so the change is visibly motioned. Removed the `Today N actions` chip from the right zone — only the `next in …` label remains, centered vertically
- **Overview `StatusPill`** matches — phase icon replaces the radar-ping dot inside the pill. `Actions today` row removed from the popover's `<dl>`. `Next action` and `Started` rows unchanged
- **`analyzing` phase copy** changed from *"Analyzing your targets"* → *"Searching for targets"* in both surfaces

### Changed — Targets card
- Headline copy tightened to one short sentence (dropped the *"Each one feeds new followers into your growth queue"* clause)
- Inline slot count dropped from headline size to `text-sm font-normal text-text-muted` — reads as secondary metadata on the title baseline
- Parentheses around the slot count removed: reads as `Targets 10/30` now (not `Targets (10/30)`)
- Internal padding on desktop tightened to `p-5` (was `p-6`)

### Changed — Add Target sheet
- Removed the `TARGETING` eyebrow above the toggle (toggle stands on its own)
- Removed the default `Start typing…` helper below the input — helper now renders **only** when there's something to say (duplicate / invalid format / select-prompt)
- Scrollable body wrapped in `<div className="min-h-[360px]">` so the sheet doesn't flicker as suggestions / typeahead toggle on and off

### Changed — HealthPill labels
- Shortened to terse size categories — `Small` · `Good fit` · `Large` · `Very large`. Dropped the *"Slower — "* / *"much slower"* suffixes so the pill stays narrow next to target names in the typeahead and the detail drawer

### Changed — Toast positioning + accent
- Moved to **top-right** on desktop, **top-center** on mobile (was bottom-right). More visible
- Tone-colored **left accent bar** (`w-1` green for success, red for error, etc.) + `shadow-lg` so it lifts off the page clearly
- Mount animation slides down from top (matches the new origin)

### Changed — Targets table + filter row
- **Chevron wrapper shrunk** from `h-11 w-11` to `h-7 w-7`; icon from `h-5 w-5` to `h-4 w-4`. Row padding switched from `px-4` to `pl-4 pr-3`. Reclaims visual weight on the right so the `count · rate` cluster sits close to the chevron, not adrift in whitespace
- Column header padding updated to `pr-12` to realign over the new `count · rate` cluster
- **Filter pills + sort live in one flex-wrap container** — on mobile the sort icon wraps with the pills (no more orphaned sort row below). On desktop sort is pushed right via `lg:ml-auto`. Sort button height reduced to `h-8` to match pill heights

### Decisions
- **Icon over dot in the status pill** — a recognizable verb icon (UserPlus, UserMinus, etc.) communicates what the system is doing faster than a colored dot. The dot remains only for the `waiting` phase (there's no single "verb" icon for "paused between actions")
- **Short health labels** — full explainers bloated the pill and crowded target names. Users who need more detail can infer from the color + size category
- **Inline sort on mobile** — wrapping sort with the pills eliminates the awkward dead row that appeared between the filter bar and the table

---

## 2026-04-24 — Targets page v3.1 (polish pass)

### Changed
- **`TargetsHeroCard` rebalanced** — headline drops from `text-xl` to `text-lg`; slot count folds inline as `Targets (10/30)` with the count in muted secondary weight. Removed the big right-zone `10/30` + `SLOTS USED` block. Right zone is now just the `+ Add target` CTA. Lighter visual hierarchy; clear headline → explanation → single CTA reading order
- **`LiveActivityCard` reframed as a proper status component** — adds a `SYSTEM ACTIVITY` eyebrow label on its own line above the phase content. Phase copy rewrites lead with "Currently" for active phases (`Currently analyzing your targets`, `Currently following @fitness.inspo`, `Currently unfollowing #homeworkouts`). Dropped the old `LIVE` / `PAUSED` status pill — the eyebrow + colored dot + accent strip already carry that signal together; removing the pill clears visual noise. Keyed cross-fade on phase/target changes preserved
- **Add Target sheet**:
  - Added a short **explainer paragraph** above the Targeting toggle: *"Pick any Instagram account or hashtag. Kicksta will follow its audience — those are the users most likely to follow you back."* Orients first-time users
  - **Suggestion chips are now avatar-style** — 28×28 circle (initial letter for accounts, `Hash` icon for hashtags) + handle. Same layout for both modes; feels like "picker cards" rather than plain text chips
  - **Success toast on add** — firing `useToasts.getState().addToast({ message: "@handle added as a target.", tone: "success" })` on submit. Same toast when a paused duplicate is resumed via the `Resume it` shortcut

### Created
- **`useToasts` Zustand store** (`src/stores/useToasts.js`) — global toast state with `addToast({message, tone, duration})` and `dismissToast(id)`. Auto-dismiss after 2500ms by default
- **`ToastContainer` component** (`src/components/Toast.jsx`) — fixed bottom-center on mobile, bottom-right on desktop. Slide-in animation per toast. Tone-aware icon + accent (success/info/warning/error). Manual dismiss via X button. Mounted once in `DashboardLayout` so any page can fire a toast

### Decisions — Targets v3.1
- **Eyebrow over pill** on the status card — a dedicated framing line reads as "this is a monitor" more clearly than an inline pill. Keeps the card scannable at a glance
- **"Currently" prefix** for active phases — converts the phase label from a noun ("Following @x") into an active statement ("Currently following @x"), which removes ambiguity about what the system is doing *right now*
- **Global toast store** rather than per-page toast state — toasts will be needed on Growth + Account pages too; centralizing now avoids future duplication

---

## 2026-04-23 — Targets page v3 (refinement pass)

### Changed — Targets page
- **`SlotsCard` → `TargetsHeroCard`** — the top CTA card is now a proper page hero. Crosshair icon in a blue-tint square, `Targets` headline, one-sentence explanation (*"Accounts and hashtags Kicksta follows to grow your audience. Each one feeds new followers into your growth queue."*), large `10 / 30` + `SLOTS USED` label on the right, prominent Add target button. **Progress bar removed** — the count carries the limit signal on its own
- **Live Activity card** now reads as a status component at a glance: colored **eyebrow pill** (`LIVE` green-tint when running, `WARMING UP` blue, `SETUP` yellow, `PAUSED` muted grey) + left accent strip in the phase's color + **key-bound crossfade** on the phase label and rotating target handle (each phase change fades the new text in)
- **Overview `StatusPill`** gets the same `LIVE` / `PAUSED` / `WARMING UP` / `SETUP` eyebrow pill inside its existing chip, so both surfaces use the same status vocabulary
- **Target row**:
  - Mobile now shows a small **status dot** to the left of the name instead of the full pill (pill stays on `md:+` for wider rooms). Avoids cramping on narrow widths
  - Column header `FOLLOW-BACKS · %` gets `pr-11` so it aligns exactly above the `{count · rate}` cluster (the 44×44 chevron slot is accounted for)
- **Filter pills** now **wrap to multiple rows** on mobile (`flex-wrap gap-2`) — no more horizontal scroll, all 5 states visible at once. On desktop they remain single-line. Sort control moves to its own row on mobile
- **Add Target sheet**:
  - **Must-pick rule** — `Add target` is disabled until the user selects a result from the typeahead dropdown OR a suggestion chip. Typing alone never enables submit, so we never queue unknown handles. Helper copy: *"Select a result to continue."*
  - **Fixed-size popup** — typeahead dropdown gets `max-h-[240px] overflow-y-auto` so it scrolls internally and never pushes sheet dimensions
  - **Wider segmented toggle** — `flex` with `flex-1` segments, matches the input's visual weight
  - **Ease-in open animation** — backdrop fades + sheet slides up with `translate-y-4 → translate-y-0` on mount
- **Detail drawer** — same ease-in open animation pattern as the Add Target sheet
- **Vertical rhythm** normalized — first card under the page header uses `mt-6`, subsequent cards `mt-4`. Consistent spacing across LiveActivityCard → TargetsHeroCard → FilterRow → TargetList

### Created
- `src/pages/targets/TargetsHeroCard.jsx` (replaces SlotsCard)
- `docs/superpowers/plans/2026-04-23-targets-page-v3.md`

### Removed
- `src/pages/targets/SlotsCard.jsx` (replaced by TargetsHeroCard)
- Progress bar from the slots card (no longer rendered)
- Horizontal-scroll filter-pills container (replaced by wrap)

### Decisions — Targets v3
- **Hero card, not utility card** — the top card on the Targets page is the page's identity marker, not just a slot tracker. Icon + explanation make the page self-explanatory on first visit
- **Status component vocabulary shared across pages** — the `LIVE` / `PAUSED` / `WARMING UP` / `SETUP` eyebrow pill is the canonical status surface, used by both the Targets `LiveActivityCard` and the Overview `StatusPill`
- **Must-pick in Add Target** — a typed-but-unknown handle can't be queued. The trade-off (no freeform entry) is acceptable for V1 because we only have fixture data, and gating on selection prevents users from adding accounts we can't preview or validate
- **Pill replaces dot on desktop, dot replaces pill on mobile** — same status signal, different density. Keeps rows scanable at every width

### Flagged for follow-up — Targets v3
- The `animate-in fade-in duration-300` class used for the LiveActivityCard phase crossfade relies on Tailwind 4 entry animations. If the resolved CSS doesn't produce a visible fade in this project's Tailwind setup, swap to an explicit CSS keyframe as a polish task
- Typeahead dropdown still anchors to the input; if the sheet ever grows tall enough that the dropdown + scrolling inside it feels cramped, consider portaling it to the document root

---

## 2026-04-23 — Targets page v2

### Changed — Targets page
- **Live Activity card** (new) — compact strip between header and slots card: radar-ping dot + phase label (`Analyzing targets` / `Following` / `Unfollowing` / `Pausing between actions` / `Warming up` / `Setup needed` / `Paused`) + rotating target handle + data chips (`Today N actions`, fuzzy `next in ~N min`). Monitor-only; no pause control. Target handle is clickable when it maps to a stored target → opens that row's detail drawer
- **`useSystemStatus` shared hook** — single source of truth for the live automation status. Advances through a state machine (`analyzing → following → waiting → unfollowing → waiting …`) on a randomized 6–10s timer. Consumed by the Targets Live Activity card AND the Overview's `StatusPill` so both surfaces advance in lockstep. No countdown timers — fuzzy copy only
- **Overview `StatusPill` refactor** — now reads live phase + rotating target from `useSystemStatus` instead of a local state tick. Pause/resume local logic + popover content unchanged; only the data source switched
- **Target row redesign** — dot replaced by 36×36 avatar (initial fallback) for accounts and a circular `Hash` icon for hashtags; name gets a subline (`128K followers` or `12.4M posts`); follow-backs column shows `count · rate%` with the `%` colored by health (green ≥10%, muted 5–10%, yellow <5%); kebab replaced with a `ChevronRight` affordance. Min-height 64px
- **Slots card** inline header on desktop — `Target slots` label + count + `+ Add target` button share the top row; progress bar and trust line below. Mobile stays stacked (count + button, then bar, then trust line)
- **Target Detail Drawer** (replaces KebabMenu) — 48px avatar, status pill, subline, **HealthPill** (size-based match quality), 3 data chips (`Followed · Follow-backs · Rate`), two 48px tinted action buttons (`Pause`/`Resume` blue-tint + `Remove` red-tint), ghost `Open on Instagram ↗` link (new tab, goes to `instagram.com/{user}` or `.../explore/tags/{tag}`)
- **Add Target sheet refinements**:
  - Compact segmented toggle (`h-9`, natural-width, left-aligned under a `TARGETING` label) — no longer a full-width 44px bar
  - **Typeahead dropdown** over an expanded fixture pool (20 accounts + 10 hashtags). 200ms debounce, 2+ chars, startsWith-preferred. Each row: avatar/hash + handle + follower/post count + `HealthPill`
  - Suggestions always visible (account OR hashtag chips swap with the mode); hidden only while typeahead has matches
  - **HealthPill** on the preview card and on every typeahead row — thresholds: `<1K` Small audience · `1K–100K` Good fit · `100K–1M` Slower — large audience · `>1M` Very large — much slower
- **Target row · FOLLOW-BACKS column** header renamed to `FOLLOW-BACKS · %`
- **Empty-state copy** now sets expectations: `Add an account or hashtag for Kicksta to follow users from. Expect first results within 24–72 hours.`
- **Mock data** — every target row now carries `followers` (accounts) or `posts` (hashtags); follow-back counts tuned so rates land across healthy (≥10%), average (5–10%), and needs-attention (<5%) bands for visual variety

### Created
- `src/hooks/useSystemStatus.js` — shared live-status hook
- `src/pages/targets/LiveActivityCard.jsx`
- `src/pages/targets/TargetDetailDrawer.jsx` (replaces KebabMenu)
- `src/pages/targets/HealthPill.jsx` — shared size-based match pill (+ `evaluateHealth` helper)
- `src/utils/formatCount.js` — shared `128400 → "128K"` / `12400000 → "12.4M"` abbreviator
- `src/mocks/targetSearch.js` (renamed from `resolveAccount.js`) — expanded to 20 accounts + 10 hashtags; exports `searchTargets(query, type)` + compat `mockResolveAccount(username)`
- `src/mocks/suggestedHashtags.js`
- `docs/superpowers/specs/2026-04-23-targets-page-v2-design.md`
- `docs/superpowers/plans/2026-04-23-targets-page-v2.md`

### Removed
- `src/pages/targets/KebabMenu.jsx`
- `src/mocks/resolveAccount.js` (replaced by `targetSearch.js`)

### Decisions — Targets v2
- **Shared hook over parallel simulations** — both Targets Live Activity card and Overview StatusPill read from the same cycling source to guarantee they never drift
- **Live Activity card is monitor-only** — pause/resume control stays in the Overview StatusPill popover; not duplicated here. Keeps the Targets card a pure status surface
- **Avatar/hashtag-icon fully replaces status dot** — status is now carried solely by the pill (bumped to `text-[11px]` for scan weight). Avoids double-signal
- **Kebab removed in favor of a `ChevronRight` affordance** — row tap already opens the drawer; the chevron communicates "row opens something" without implying a menu
- **Typeahead hides static suggestions while it has matches** — avoids two parallel discovery surfaces at once; suggestions return when the user clears the input or has no matches
- **HealthPill uses green for "Good fit" and yellow for everything else** — red stays off-limits (PRODUCT.md: red for connection errors only)
- **Fuzzy "next in" copy, no countdowns** — matches PRODUCT.md ban on countdown timers

### Flagged for follow-up — Targets v2
- Live Activity card action counter persists across reloads only by resetting to the baseline — real persistence needs backend
- Typeahead dropdown inside the Add Target sheet can clip extra rows behind the sheet's internal scroll; consider `max-h-[240px] overflow-y-auto` on the dropdown or making it portaled
- Mobile row name truncation is aggressive (`@fit…`) when avatar + star + pill crowd the row; could trim pill text or hide star below a breakpoint
- Slots card button sits **above** the progress bar on mobile (because it shares the inline flex container that stacks vertically); v1 had it at the bottom. Cosmetic; may revisit

---

## 2026-04-23

### Changed — Dashboard AccountCard + metrics
- **3 metric cards extracted out of AccountCard** into a dedicated row below it. AccountCard is now identity + `StatusPill` only
- **Metric set redefined** — Engagement removed; new set: `Total followers` (all-time) · `Followers gained` (period) · `Follow-back rate` (period). Each as its own component (`TotalFollowersMetric`, `FollowersGainedMetric`, `FollowBackRateMetric`) sharing a `MetricCard` primitive with: icon + label (top-left) + optional period suffix (top-right) + value + optional pill + sparkline
- **`TotalFollowersMetric` baseline anchor** — during trial, the value renders inline as `4,832 (4,739)` with a dotted-underlined parenthesized number that carries a hover tooltip "Followers at signup". Keeps the growth arc on one line without adding card height
- **`Sparkline` component** — `h-6 w-16 lg:w-20` green area chart using Recharts AreaChart; one instance per metric, gradient IDs are unique per instance to avoid SVG collisions
- **AccountCard identity row** — avatar gets a connection-state dot (green/blue/red); identity line carries `@handle` + `Advanced`/`Growth` pill + **blue `Trial` pill** when `user.isOnTrial`; full name below
- **`StatusPill` (live action)** inside AccountCard on right (desktop) / below identity on mobile — flat `bg-bg` chip with radar-ping dot, label ("Following @fitness.inspo"), click opens popover with stats + Pause/Resume. Inline-block intrinsic width on all breakpoints (no more mobile full-width stretch). Radar dot replaces the earlier staggered three-dot loader (status vs loading)
- **Plan pill gains `Trial` companion** — `@handle` row renders a second `Trial` pill (blue-tint) when on trial so users never conflate trial access with paid plan

### Changed — Growth chart
- **Bar chart rebuilt repeatedly; final state**: every day = one bar; 7 past (striped green) + 7 forecast (dashed-outlined green-tint) when on trial; `YAxis width={28}` + `margin.left: 0` so bars push to the card's left edge; `activeBar` outline on hover; `cursor={false}` on Tooltip
- **Rich `GrowthBarTooltip`** — date header + identity row (avatar + `@handle` + full name) + 3-stat strip (Total · Gained (highlighted green chip) · Follow-back rate) + "Daily growth" hero line. `connection` passed via Tooltip render-prop
- **Chart header**: `Follower Growth` + blue `Trial` pill (when `period === 'trial'`) + compact legend (Gained stripe swatch, Predicted dashed-outline swatch)
- **Summary strip** — 3 Growth-Settings-style filter pills (`Total: +N · Avg/day: ~N · Best: Apr 18 (+17)`). `bg-bg px-2 py-1 text-xs` matching the Growth Settings filter chips; no borders above or below; all 3 fit on one row on mobile (px-2 tight)
- **Trial markers in chart**:
  - Dashed blue `Trial ends` `ReferenceLine` at the last trial bar — matches the Today line's style
  - Dashed muted `Today` line at the most recent measured bar
  - When both coincide (user on last day), Today line is suppressed (Trial ends takes priority)
- **Forecast logic** — linear regression on last 14 days + warmup factor + floor/ceiling clamp (60%–180% of recent avg); predicted bars get per-day `runningTotal` + `followBackRate` for the tooltip
- **Chart + ActivityFeed layout**: 5fr / 3fr grid on desktop (chart wider than activity); stacked on mobile; chart card's internal YAxis tightened so bars fill the width

### Changed — Trial UX sweep
- **All trial surfaces swapped yellow → blue** — `TrialBanner`, chart header pill, in-chart `Trial ends` line, AccountCard `Trial` pill. Yellow is now reserved strictly for action-needed states (depleted target, low follow-back, setup state) per PRODUCT.md
- **`TrialBanner` (last-day only)** — blue gradient card with icon chip + "Your trial ends in X hours" + "Kicksta will charge $X for your [plan] automatically. Your automation keeps running — no action needed on your end." + `Manage plan` CTA. Non-collapsible, non-dismissible
- **`PeriodSwitcher` during trial** — collapses to a single non-clickable "Trial period" pill (instead of 3 disabled tabs) because all data while on trial is trial data; reverts to 3-preset tablist post-trial
- **`getWindowSlice(data, 'trial')`** returns `data.slice(-7)`; **`getPeriodLabel('trial')`** returns `'Trial period'`; **`filterByWindow(items, 'trial')`** cuts off at 7 days
- **`isTrialLastDay(user)`** uses same-calendar-day check (not timestamps) — timezone-safe
- **Trial-era bar filter** uses local date strings (fixed a silent off-by-one where the first trial day was dropped in non-UTC browsers)
- **`mockUser.trialEndsAt`** anchored to **today 11 PM local** at module import; `createdAt = trialEndsAt - 7 days`; so the banner + last-day treatment always fire fresh
- **`PLAN_CATALOG`** exported from `mockUser` (`{ growth: { name, price: 29 }, advanced: { name, price: 49 } }`) — feeds the banner's renewal copy

### Changed — PeriodSwitcher
- **Custom date picker removed entirely** (not needed for V1 mock)
- **Segmented-control restyle** — `bg-bg` container with raised `bg-surface` + `shadow-sm` selected tab for clear high-contrast selection (previously both greys barely differentiated)

### Changed — Growth+ banner
- **Copy softened** — "Unlock 3× faster follower growth with Growth+" → **"Add Growth+ for extra algorithmic reach"**. Calmer framing that doesn't imply the user's current organic growth is inadequate
- **Purple icon chip saturation** toned down to `bg-purple-base/90` on the chip (CTAs stay fully saturated)
- **Mobile layout reworked** — icon folds into the eyebrow row (small 28×28 chip) so the headline + benefits span the full card width instead of floating beside an empty column

### Changed — System status module
- **Extracted into `src/components/SystemStatus.jsx`** — exports `useStatusChecks`, `StatusChecksList`, `SystemStatusRow` (sidebar), `SystemStatusIconButton` (mobile). Previously lived inside Overview
- **Mounted in `DashboardLayout`** — sidebar row above Collapse (desktop), 40×40 icon button on mobile header left (replaces the temporary Signup flow dev link)
- **Growth+ marked as `informational`** — doesn't contribute to the failing-check count (no more yellow dot just because the user hasn't opted into Growth+). Renders in a neutral grey chip when not subscribed

### Changed — Other Overview
- **`ActivityFeed` capped at 5 items** both desktop + mobile for consistency
- **Top Targets sort reordered** — active → queued → paused → depleted, then by follow-back count desc (so the top-performer star lands on row 1 instead of row 2)

### Created
- **`AccountSwitcher`** in `DashboardLayout.jsx` — sidebar trigger (avatar + 12px connection-status dot + `@handle` + follower count + chevron) → 288px fixed-width dropdown that extends past the sidebar. Dropdown rows show plan pill beside the `@handle` and a red `AlertTriangle` + "Disconnected" alert on disconnected accounts. Includes "Add account" link → `/signup/connect-instagram`. Separator (`border-b`) between switcher and nav tabs
- **`src/mocks/accounts.js`** — 3 mock IG accounts with `{id, username, fullName, profilePic, followers, plan, connectionState}`; `alex.personal` deliberately `disconnected` to exercise the alert path. Exports `defaultActiveAccountId`
- **`src/mocks/systemStatus.js`** — 5 state variants (`following`, `unfollowing`, `analyzing`, `warming_up`, `setup`, `paused`), all with dynamic `startedAt`/`nextActionAt` so "in 2 min" / "3h ago" read fresh every load
- **`CONTEXT.md`** at project root — rolling session notes (current state of each section, deferred issues, preview infra)

### Removed
- Engagement metric + engagement sparkline data (no longer shown)
- `mockProjectedDaily`, `mockTotalFollowersGained`, `daysSince` (no longer referenced after metrics rework)
- Custom date-range picker from `PeriodSwitcher` and all associated state/plumbing
- 5-row "System status" panel from Overview page header (moved to sidebar)
- Old yellow-wash trial `ReferenceArea`, DOM-overlay bracket, and "Trial · Apr 15 – Apr 21 · 7 days" caption — replaced by the in-chart `Trial ends` dashed line

### Decisions
- **Blue = trial; yellow = action-needed** — codified across the dashboard. Yellow now strictly for depleted targets / low follow-back / setup state. Red stays for connection errors only
- **Trial is a self-contained scope** — during trial, PeriodSwitcher is locked to "Trial period", metrics/chart/feed scope to the 7-day trial window, trial baseline shown on Total followers. Post-trial the period switcher unlocks and metrics become period-relative
- **LIVE pill on ActivityFeed stays red** — the universal recording-indicator convention trumps the "red = connection errors" rule in this case (explicit user call)
- **Growth+ is informational on system status** — not a health signal; never triggers the yellow dot
- **Chart summary strip uses Growth-Settings filter-pill pattern** — chosen to reuse existing design-system vocabulary instead of inventing a bespoke treatment (user confirmed after reviewing 3 proposed options)
- **Trial end indicator is a dashed vertical line at the last trial bar** — matches Today line style; when they coincide, Today is suppressed (Trial-ends carries more meaning)
- **Account switcher state is local for V1** — switching doesn't yet propagate to AccountCard / chart / metrics. Needs a shared store (Zustand) as follow-up; deferred
- **Predicted bars on chart remain** despite PRODUCT.md's "no projected data" rule — user acknowledged the liability and deferred the fix. Flagged in CONTEXT.md
- **Cancel subscription / profile dropdown deferred** — known gap, bigger project

### Flagged for follow-up (see CONTEXT.md)
- Predicted bars violate PRODUCT.md rule #4
- No profile/account dropdown or cancel flow
- Account switcher not yet wired to global state (switching is UI-only)
- Active-account disconnection doesn't surface on the switcher trigger (only in dropdown)
- `PlanPill` sized differently between AccountCard + AccountSwitcher (no shared primitive)
- "Add account" routes to full signup flow — needs a lightweight add-another-account flow
- Status dots have no hover tooltip

### Created — Targets page (`/targets`)
- **Page composed from small focused files under `src/pages/targets/`**: `index.jsx` (shell + state wiring), `SlotsCard`, `FilterRow`, `TargetList`, `TargetRow`, `KebabMenu`, `RemoveTargetModal`, `AddTargetSheet`
- **`SlotsCard`** — single CTA host: label + `X / maxSlots` count + green progress bar + `Lock` icon trust line ("Kicksta follows within Instagram's safe daily limits.") + sole `+ Add target` button (48px, full-width mobile, right-aligned desktop). Max slots derived from `mockUser.plan` (10 Growth / 30 Advanced). All statuses count against slots
- **`FilterRow`** — segmented pills `All · Active · Queued · Paused · Depleted` with live counts inside each pill; selected pill = `bg-surface shadow-sm` inside a `bg-bg p-1` container. Mobile: pills scroll horizontally, sort collapses to `ArrowUpDown` icon button. Desktop: full row with `Sort: Priority ▾` dropdown (options: Priority / Follow-backs / Most recent / A–Z)
- **`TargetRow`** — 56px-min row: status dot (+ hover tooltip) · truncated name (depleted = line-through + muted) · top-performer yellow `Star` (highest follow-back active row only) · status pill (Active/Queued/Paused/Depleted, tinted per status; paused is neutral-grey) · follow-back count (`tabular-nums`) · 44×44 kebab. Entire row is a tap target; kebab is the visual affordance
- **`KebabMenu`** — status-aware action menu (bottom sheet mobile, centered desktop). Active → Pause + Remove · Paused → Resume + Remove · Queued/Depleted → Remove only. Row header names the target. Escape closes
- **`RemoveTargetModal`** — destructive-action confirmation. Action-name button ("Remove target", not "Confirm") per CLAUDE.md. "Keep it" secondary
- **`AddTargetSheet`** — single path for adding any target: bottom sheet on mobile, centered modal on desktop. Segmented `Account`/`Hashtag` toggle swaps `@`/`#` prefix + helper text + preview + suggestions visibility. Account mode: live preview card (resolves via `mockResolveAccount` with 300ms debounce) + 5 suggestion chips from `mockSuggestedTargets`. Duplicate detection blocks submit with a specific message; when the duplicate is paused, shows an inline `Resume it` shortcut that resumes the existing row and closes. Invalid format → inline red helper, never a toast
- **`useTargetsStore` (Zustand)** at `src/stores/useTargetsStore.js` — `{targets, filter, sort, setFilter, setSort, addTarget, pauseTarget, resumeTarget, removeTarget}`. Helpers `filterTargets(targets, filter)` + `sortTargets(targets, sort)` live alongside. Seeded from existing `mockTargets`; in-memory only (no persistence in V1)
- **New mocks**: `src/mocks/suggestedTargets.js` (5 account suggestions) · `src/mocks/resolveAccount.js` (async preview resolver, 200–400ms delay, 11 fixture usernames)
- **Spec + plan committed**: `docs/superpowers/specs/2026-04-23-targets-page-design.md` · `docs/superpowers/plans/2026-04-23-targets-page.md`

### Decisions — Targets
- **Primary page job is add + manage** (monitoring is secondary). No per-row analytics, no detail-view drawer — kebab actions cover management; the Add sheet covers add. Can revisit when per-target stats are real
- **One CTA, one flow for adding a target** — the `+ Add target` button in the slots card is the sole entry; the empty-state block has no button of its own, the user's eye travels up to the single CTA
- **Row tap opens the kebab menu** (full row hit target) for mobile thumb ease; kebab icon is the visual affordance
- **All rows show a status pill** (including Active, green-tint) for row-to-row symmetry and scan consistency — not just the non-active states
- **Queued stays as its own filter pill** (not folded into Active) because a target can sit in the queue for a while and should be explicitly visible
- **All stored targets occupy a slot** (active + queued + paused + depleted) — users can remove to free a slot; depleted targets aren't auto-purged
- **Design-system vocabulary reused verbatim from Overview's `TargetsOverview`** — same dot colors, same status tooltips, same pill recipes, same depleted-wash + line-through treatment. Cross-page consistency confirmed in the preview
- **Edge-case states deferred to a future spec** — disconnected-IG treatment, at-cap variants (Growth upsell button swap + Advanced disable + bar-color change), approaching-cap upsell nudge, auto-pause-after-downgrade banner. Intentional scope cut to keep this launch focused on happy-path

### Flagged for follow-up — Targets
- Advanced-at-30 disable + inline message (`You've reached the 30-target limit. Remove one to add another.`)
- Growth-at-10 upsell button swap (`Upgrade for 20 more slots`)
- Approaching-cap soft nudge (`2 slots left — Advanced gives you 20 more`)
- Auto-pause-after-downgrade banner (names auto-paused targets + Upgrade CTA)
- Disconnected-IG page variant (disabled add button, reconnect banner)
- Success toast on pause/resume/add (not wired yet — actions apply silently for V1)
- Sort state / filter state not URL-persisted (component-local only)
- Store not persisted across reloads (in-memory, resets to mocks)

---

## 2026-04-16

### Changed
- **Overview — Growth chart rebuilt as stacked bar chart** (replaces Recharts `AreaChart`):
  - Diagonal-striped green bars (SVG `<pattern>` over `--color-green-base` + `--color-green-text`) for actual daily gain, with a soft `--color-green-tint` "headroom" cap so every bar column reaches the same top — progress-track visual per the user-provided reference image
  - Adaptive bundling via `Math.ceil(slice.length / 12)`: 7d stays daily (7 bars), 14d pairs into ~7 bars, 30d groups by 3 (~10 bars). Multi-day buckets label as `Apr 1–Apr 3`
  - Custom `GrowthBarTooltip` hides the headroom segment from display so users only ever see real `+N gained` values
  - "N total" sub-label next to the chart title surfaces the window total without hover
  - Dropped `mockProjectedDaily` import and `projectedData`/`isOnTrial` props — projection tail no longer applies on a bar chart
- **Overview — ActivityFeed got a live indicator:** pulsing red dot (`bg-red-base` + `animate-ping`) + uppercase "LIVE" red-text label next to the Activity heading; `aria-label="Live feed"` for SR users
- **Overview — Growth+ banner tightened:**
  - Removed the "Available" pill entirely (CTA is the state signal for non-subscribers); kept the green "Active" pill for subscribers
  - Reduced horizontal gap `lg:gap-6 → lg:gap-4`, icon-to-copy gap `lg:gap-4 → default`, headline top `mt-1 → mt-0.5`, benefits top `mt-1.5 → mt-1`
- **Overview — TargetsOverview renamed to "Top Targets":**
  - Row cap raised 5 → 7 so the card fills its column next to Growth Settings
  - Added 4 new mock targets in `src/mocks/targets.js`: `#glutenfree`, `@macro.melissa`, `#weightloss`, `@keto.kevin`
- **Overview — page-level spacing audit (per CLAUDE.md 4/8/12/16/24/32/48/64 scale):**
  - AccountCard metrics `lg:mt-5 lg:pt-5` (20px, off-scale) → `lg:mt-6 lg:pt-6` (24px)
  - Section gap before AccountCard: `mt-4 lg:mt-6` → plain `mt-6` (single rhythm at both breakpoints)
  - Chart row `mt-6` → `mt-4` so AccountCard → Chart → Banner → Targets all share the same 16px section gap

### Created
- `GrowthBarTooltip` component in `src/pages/overview/index.jsx` — dedicated Recharts tooltip for the new bar chart that filters out the synthetic "headroom" stack segment

### Removed
- `AreaChart` / `Area` imports and `mockProjectedDaily` import from Overview (replaced by `BarChart` / `Bar`)

### Decisions
- **Bar chart with striped fill + green-tint headroom cap** chosen over the prior area chart after reviewing the reference screenshot — bars read as discrete "days of growth" while the cap gives the chart a consistent silhouette on quiet days without faking data (headroom is hidden from the tooltip)
- **Day bundling target = 12 bars** so density stays readable regardless of window length; single-day buckets keep single-date labels, multi-day buckets use `M/D–M/D` ranges
- **Live dot on ActivityFeed is aesthetic-first; backed by mock-only data in V1** — flagged as an honesty risk in session feedback (see improvement suggestion #2)
- **"Top Targets" is sorted all-time by `followBackCount`** — does not respect the page's period switcher yet. Ambiguity flagged in session feedback (suggestion #3) as a follow-up.
- **Growth+ banner drops the "Available" pill** — the Upgrade CTA already carries the non-subscribed state; pill was redundant chrome

---

## 2026-04-15

### Changed
- **AccountCard (Overview) — second pass to hero-number layout (Option B):**
  - Stripped all tile chrome from the 3 metrics (no inner borders, `bg-bg` tiles, or icon-circle chips) — they are now bare hero numbers at `text-2xl/lg:text-3xl` semibold
  - Hairlines separate metrics: vertical in the 3-col grid on `sm:`+, horizontal between stacked rows on mobile
  - Each metric has a small inline lucide icon next to the label (no chrome circle) and a context pill to the right of the number: "13 days" / "~10/day" / tonal "Healthy" · "Average" · "Needs attention"
  - Identity row: removed "Connected" status pill (avatar dot + Active button already carry it); replaced with IG account's full name under the `@handle`
  - Status button: added `ChevronRight`, `shadow-sm`→`hover:shadow-md`, `active:scale-[0.98]` so it clearly reads as clickable
- **Overview mobile layout** — AccountCard redesigned for small screens:
  - Metrics display as stacked full-width rows (icon + label left, number + pill right) instead of squished 3-column grid
  - Identity row gets the full card width so long full names don't truncate
  - Active status button moved to a full-width footer below the metrics (desktop keeps it top-right in the identity row)
  - Consistent 24px vertical rhythm across identity → metrics → status footer; status button hits 44px touch-target minimum; mixed-size text ("Active" `text-sm` + "· System status" `text-xs`) wrapped in `items-baseline` span so baselines align
- **Overview header** — removed filler subtitle "Your growth at a glance"; added 👋 emoji to greeting; reduced size from `text-2xl/lg:text-3xl` to `text-lg/lg:text-xl` to better match dashboard hierarchy
- **TrialProgress** — now full-width on mobile with progress bar always visible (previously compact `sm:inline-flex` with hidden bar below `sm:`)
- **DashboardLayout** — added "Signup flow" dev entry point: Sparkles icon link in sidebar bottom section (desktop, purple tint) and in mobile header left slot (previously empty spacer); routes to `/signup/ig-preview`
- **vite.config.js** — set `server.allowedHosts: true` to accept any hostname for dev server

### Created
- `fullName` field on `mockInstagramConnected` and `mockInstagramNeverLoggedIn` (e.g., "Alex Johnson — Fitness & Nutrition Coach")

### Removed
- **StatCards grid** below the growth chart on Overview — was duplicate of the 3 AccountCard hero metrics
- `StatCard` component, `healthTone` variable, and derived stat vars (`weeklyTone`, `rateTone`, `targetTone`, `expectedWeekly`, `expectedTotal`, etc.) from Overview — no longer referenced
- `Award` icon and `mockTrialProjection` imports from Overview — no longer referenced
- Duplicated stat line in AccountCard (`+67 this week · 12% follow-back · 4,832 total` with dot separators)
- `formatNumber` helper from Overview (no longer referenced)
- `ChevronDown` import from Overview (no longer referenced)

### Decisions
- AccountCard is the single canonical home for the 3 headline metrics (Total gained, This week, Follow-back rate) — **supersedes** the earlier same-day decision to size them proportionally (`text-base/lg:text-lg`) inside tile cards and duplicate them in a StatCards grid below the chart
- Numbers are hero-sized — they are the dashboard's main signal and should visually dominate the card; tile chrome was suffocating them
- Color only carries meaning on the Follow-back rate pill (green / neutral / yellow); other metrics stay neutral so tone reads as signal rather than decoration
- Connection state uses a single indicator per surface (avatar dot + one status affordance) — "Connected" pill removed to avoid triple-signalling
- Mobile-only: Active status moved to a card footer — the avatar dot already communicates live state at the top, so the button becomes a "tap for diagnostics" footer. Desktop keeps top-right placement where horizontal space isn't constrained.
- Mobile uses stacked metric rows (not 3 squished columns) so numbers and pills have room to breathe; desktop 3-col grid is preserved since it has the space
- Connection state is the #1 trust element (per PRODUCT.md) — must be visible on mobile. Avatar dot provides mobile affordance.
- Status button (open system status popup) ≠ dropdown — uses `ChevronRight` to signal "opens detail view", not `ChevronDown`
- Signup flow entry is a dev aid (purple tint differentiates from core nav) — useful during V1 frontend build where signup is unreachable otherwise

---

## 2026-04-14

### Changed
- **SignupLayout header** — restructured to responsive grid: mobile (logo centered, back arrow left, logout right) + desktop (logo left, stepper centered, logout right)
- **Mobile stepper** — moved outside header as standalone element (no border-top, sits on bg)
- **Back button** — mobile: arrow in header left column; desktop: labeled text link below header ("← Plan Selection") showing destination step name
- **Default theme** — changed to light mode (removed system preference detection)
- **Heading spacing** — unified to `mb-4 lg:mb-6` and `mt-1.5 lg:mt-2` across all signup steps
- **Icon shapes** — unified all heading icons to `rounded-full`
- **Button gaps** — unified to `gap-4` (16px) for all stacked button/action groups
- **Code cleanup** — removed unused imports, fixed misplaced imports, moved render-time side effects to useEffect, extracted shared `formatPrice` and `formatNumber` to `src/lib/utils.js`

### Created
- **Overview page** (`/`) — full dashboard homepage with: status badge, trial progress bar, growth chart (Recharts), stats row (4 cards), weekly summary, Growth+ locked insights, targets overview with health recommendations, growth settings snapshot (read-only)

### Decisions
- Overview page layout optimized for free-to-paid conversion: chart first (emotional proof), trial progress as scorecard (not deadline), cumulative followers counter (loss aversion), unused features shown as "Not yet enabled" (uncaptured value)
- Notifications removed from Overview — belong in bell tray, not competing with conversion-critical content
- Growth+ insights shown as blurred/locked cards for non-subscribers (no fake data, no urgency)
- Desktop back navigation uses labeled link with destination name; mobile uses arrow-only in header
- Mobile stepper is not part of the header — sits independently below it

---

## 2026-04-09

### Created
- **LoadingOverlay component** (`src/components/LoadingOverlay.jsx`) — shared loading/success overlay used across signup flow (replaces 3 separate inline overlay implementations in Billing, TwoFactorCode, and FirstTarget)

### Changed
- **IgPreview** — added private account detection: lock icon beside username in search results and confirmation view, yellow warning banner recommending public profile; replaced "Not my account" button with "Search again"
- **PlanSelection** — added info icon tooltips for features that need explanation (Targeted growth engine, Like after follow, Welcome DM, Gender targeting, Close Friends adder); tap to expand inline description
- **Billing** — added card brand detection (Visa, Mastercard, Amex, Discover) shown as label in card number field as user types; increased loading overlay delay from 2s to 3s; replaced inline overlay with shared LoadingOverlay component; wired up dirty form detection for back confirmation
- **TwoFactorSelect** — moved info banner above method cards and made it more prominent with border + icon + title; added "I can't access any of these methods" help link below method cards
- **TwoFactorCode** — replaced inline connection overlay with shared LoadingOverlay component
- **FirstTarget** — show "0/10 targets" count even before any targets are added (with helper text); added "Growth typically begins within 24–72 hours" timeline note; replaced inline overlay with shared LoadingOverlay component
- **GrowthPlus confirmation modal** — added payment method info ("Visa ending in 4242") to subtitle; added benefit summary list (3 items) in purple tint card
- **SignupLayout** — added `DirtyFormContext` + `useDirtyForm` hook for back navigation confirmation; shows "Leave this page?" modal (bottom sheet mobile, centered desktop) when navigating back with unsaved input
- **ConnectInstagram** — wired up dirty form detection (password field) for back confirmation

### Changed (cont.)
- **Billing card brand detection** — changed from text label to inline SVG card brand icons (Visa, Mastercard, Amex, Discover) inside the card number field
- **TwoFactorSelect** — removed duplicate ShieldCheck icon from header (info banner already has it); merged "can't access" help link and "try different account" back link into one compact section to reduce bottom clutter
- **GrowthPlus confirmation modal** — reworded copy so price doesn't start the sentence; bolded card info ("**Visa ending in 4242**"); upgraded benefit summary from flat list to structured card with header, dividers, and descriptions per benefit
- **Back confirmation** — scoped exclusively to Billing screen (removed from ConnectInstagram); only triggers when card form fields have input

### Decisions
- All loading overlays now use a single shared component (`LoadingOverlay`) with `icon`, `title`, `subtitle`, `color`, and optional `success` props
- Back confirmation only available on billing page under condition that input fields have values
- Feature tooltips use inline expand pattern (not hover tooltips) for mobile compatibility
- Card brand detection uses IIN prefix matching (first 1–4 digits) with inline SVG icons

---

## 2026-04-08 (session 2 — continued)

### Changed
- **Stepper phases** — moved `first-target`, `growth-plus`, and `dashboard-entry` from "Connect" to "Finish" phase so Connect shows as checked once user reaches targets
- **ConnectInstagram subtitle** — added "We never post, message, or store your password in plain text" reassurance to the page subtitle (Option A)
- **PlanSelection subtitle** — added "We engage with users in your niche so they discover your profile" to explain how the service works
- **FirstTarget subtitle** — added "We'll engage with their followers so they discover your profile" to explain what targeting does

### Removed
- "And much more" desktop-only section from Growth+ page

---

## 2026-04-08 (session 2)

### Created
- **GrowthPlus step** (`/signup/growth-plus`) — optional Growth+ upsell page with purple premium branding, unified pricing + comparison card, "How Growth+ works" explainer section, social proof badges, daily price breakdown
- **Purple color tokens** — added `--color-purple-tint/base/text` to `index.css` for both light and dark mode

### Changed
- **Billing popup copy** — changed from "Preparing your dashboard" to "Setting up your account"
- **Billing plan card** — removed features list on mobile for compactness, re-added as desktop-only (`hidden lg:flex`)
- **FirstTarget placeholder** — shortened to "Search accounts or hashtags" to prevent mobile truncation
- **FirstTarget suggestions** — reordered with shorter names first; replaced `#healthylifestyle` with `#gymlife`
- **SignupLayout back button** — hidden on `/signup/connect-instagram`, `/signup/first-target`, and `/signup/growth-plus`
- **Temp back button** — added small red test button next to stepper (to be removed before production)
- **Dark mode sync** — added `prefers-color-scheme` media query listener in `useThemeStore` to sync with system preference changes
- **ConnectInstagram restructure** — grouped password + server location into single card with divider; server location collapsed behind clickable disclosure ("Change server location"); removed "Selected" badge from account card; moved "Forgot password?" inline with label; removed "100K+ creators" badge; trust badges (SSL + GDPR) moved to bottom; carousel constrained to `max-w-md`
- **ConnectInstagram server location** — added `SERVER_LOCATIONS` array with flag emojis and recommended field; native `<select>` with flags in options
- **GrowthPlus layout** — multiple iterations: merged pricing card into comparison table header as unified card; desktop two-column grid (`lg:grid-cols-2`) with left column (header + how-it-works + CTAs) and right column (card); desktop CTAs span both columns centered side-by-side; card top aligned with heading via `lg:mt-16` offset; mobile stacks naturally with full-width buttons

### Removed
- Stats cards (500+, 3.2x, 28K+) from Growth+ page — replaced by comparison table
- "Based on accounts active for 30+ days" text from Growth+ page
- "And much more" desktop-only section from Growth+ page — deemed unnecessary bloat
- "100K+ creators" social proof badge from ConnectInstagram

### Decisions
- Growth+ page uses purple color system (`purple-tint/base/text`) to differentiate from core product
- "Continue to dashboard" replaces "Skip for now" — forward-progress framing, no guilt-trip
- Growth+ is clearly labeled as a separate add-on billed independently from the trial
- Desktop CTAs use `lg:max-w-2xl` to match content width above
- Server location on ConnectInstagram uses collapsed disclosure pattern to reduce visual clutter

---

## 2026-04-08

### Created
- **IgPreview step** (`/signup/ig-preview`) — debounced username search, result dropdown with keyboard nav, profile confirmation view with stats grid
- **PlanSelection step** (`/signup/plan-selection`) — Growth vs Advanced plan cards, monthly/quarterly/yearly billing toggle with savings badges, animated price updates
- **Billing step** (`/signup/billing`) — card form with inline validation, Apple Pay + Google Pay express options, order summary with plan + account recap, "Preparing your dashboard" popup overlay after payment submission
- **ConnectInstagram step** (`/signup/connect-instagram`) — selected account card, password input with show/hide toggle, "Forgot password?" link to Instagram reset, security reassurance carousel (3 slides, auto-rotates every 5s, manual dot navigation), trust badges (256-bit SSL, GDPR compliant, 100K+ creators)
- **`mocks/plans.js`** — Growth and Advanced plan definitions with pricing tiers and feature lists
- **SignupLayout stepper** — step pill with numbered/checked indicators, bundled visual steps (Account → Plan → Connect → Finish), back navigation

### Changed
- **Preparing popup** triggers after billing submission (not after IG account confirmation) — shows animated spinner + bouncing dots for ~1.5s before navigating to Connect Instagram
- **ConnectInstagram security section** — replaced accordion with auto-rotating carousel using CSS grid stack for consistent slide heights
- **`fadeIn` keyframe** added to `index.css` for overlay animations

### Removed
- "Having trouble logging in? Reset via email · Reset via SMS" links from ConnectInstagram page

### Decisions
- Preparing dashboard popup is non-interactive (no buttons), purely informational with looping animation
- Security carousel uses grid-stack layout so all slides share the tallest slide's height — no layout shift
- Trust badges are always visible on-screen (placed between CTA and carousel), not hidden behind an expandable section

### Changed (cont.)
- **Billing popup copy** — changed from "Preparing your dashboard" to "Setting up your account" with updated subtitle
- **FirstTarget search placeholder** — shortened to "Search accounts or hashtags" to prevent truncation on mobile
- **FirstTarget suggestions** — reordered so first row fits 3 pills (`yoga.daily`, `blogilates`, `gymlife`); replaced `#healthylifestyle` with `#gymlife` for shorter label
- **SignupLayout back button** — header back arrow now hidden on `/signup/connect-instagram` and `/signup/first-target` (point of no return after payment and after connecting)
- **Temp test back button** — added small red back icon next to step navigation pill, always visible on all steps (for dev/testing only, to be removed before production)

### Created
- **TwoFactorSelect step** (`/signup/two-factor`) — 2FA method selection with 3 tappable cards (SMS, Auth app, WhatsApp), info banner explaining this is Instagram's security step, back option to try a different account
- **TwoFactorCode step** (`/signup/two-factor/:method`) — 6-digit code entry with per-method config, auto-advance on digit input, paste support across inputs, auto-submit when all digits filled, resend button for SMS/WhatsApp (not auth app)
- **Connected confirmation overlay** — post-2FA multi-phase transition: verified inline → connecting spinner overlay (1.6s) → connected confirmation with green checkmark (~2s) → navigate to first-target
- **FirstTarget step** (`/signup/first-target`) — multi-select target picker (up to 10), suggestion pills that wrap 2+ per row, "Selected targets" section with green pills and X remove buttons, debounced search with result list, dynamic CTA ("Add at least one target" → "Add N targets and continue"), 5-tip auto-rotating carousel (same grid-stack pattern as ConnectInstagram), preparing overlay on continue

### Changed
- **SignupLayout** — SIGNUP_STEPS array updated with all 2FA routes (`two-factor/sms`, `two-factor/auth_app`, `two-factor/whatsapp`); DISPLAYED_STEPS Connect group expanded to include 2FA and first-target routes
- **App.jsx** — added routes for TwoFactorSelect, TwoFactorCode (`:method` param), and FirstTarget

### Decisions
- 2FA code inputs are individual `<input>` elements (not a single field) for better UX with auto-advance and paste handling
- Connected confirmation displays for ~2 seconds so the user can read the message before auto-navigating
- FirstTarget uses compact pills for suggestions (not full-width cards) to fit more options on screen
- Selected targets section stays visible during search so the user always sees what they've picked
- Tips carousel reuses the same grid-stack pattern from ConnectInstagram for consistent slide heights

---

## 2026-04-06

### Created
- **CLAUDE.md** — technical reference file (tech stack, design system, routes, mock data, component rules)
- **PRODUCT.md** — product context file (user problems, features, flows, brand voice, trust signals)
- **CHANGELOG.md** — this file

### Tech Stack Decisions
- React + Tailwind CSS + shadcn/ui primitives
- Zustand for UI state, React Query prepped with mock resolvers for V1
- React Router v6 with named signup routes
- Recharts for charts
- Lucide React for icons
- Plus Jakarta Sans (400/500/600)
- Light + Dark mode via CSS variables, `.dark` on `<html>`, persisted in localStorage (`kicksta-theme`), managed by Zustand `useThemeStore`, defaults to system preference

### Design Decisions
- Four-color token system (green/blue/red/yellow) with 3 tones each (tint/base/text)
- No radio buttons anywhere — elevated cards or segmented controls only
- Bottom sheet on mobile, centered modal on desktop
- Mobile-first Tailwind strategy, 3 breakpoints (default/md/lg)

### Product Decisions
- Story viewing feature **removed** — does not exist in the product
- Warmup period is **up to 72 hours (max)** — badge text: "growth starts within 72 hours"
- **Never Logged In** and **Disconnected** are distinct UI states: Never Logged In → onboarding setup prompt. Disconnected → reconnect banner with safety reassurance. They do not share the same UI.
- Cancellation flow is a **6-step modal sequence** triggered from the Account page — not a separate route. Closing before Step 6 aborts with no partial state saved.
- Growth+ is **never pre-selected**, bills immediately on opt-in, auto-cancels with core subscription
- Like after follow is available on **both plans** (Growth and Advanced)
- Logo SVGs are **scalable** — no fixed dimensions, size to fit context

### Mock Data
- User (default + Growth+ subscriber variant)
- Instagram (4 connection state variants: connected, warming_up, disconnected, never_logged_in)
- Growth daily (30-day shape) + weekly summary
- Targets (4 entries: active account, active hashtag, depleted, paused)
- Notifications (4 entries: 2 system, 2 growth)
- Growth config (mode, filters, engagement toggles, welcome DM template)
- Whitelist (2 entries) + Blacklist (3 entries)

### Routes
- Dashboard: `/` · `/targets` · `/growth` · `/account`
- Signup: `/signup/ig-preview` through `/signup/dashboard-entry` (7 routes — Step 1 handled on website)

### Assets
- `kicksta-full-logo.svg` — wordmark + icon, for signup header and desktop nav
- `kicksta-logo.svg` — icon only, for mobile nav and compact contexts

### Project Scaffolding
- Vite + React initialized with Tailwind CSS v4, all design token CSS variables, `@` path alias
- Node.js v22.15.0 installed locally (`~/.local/nodejs/`)
- Dashboard layout: sidebar (desktop `lg:`) + bottom tab bar (mobile) + top bar with avatar
- Signup layout: standalone shell with centered logo header, no dashboard nav
- All 8 mock data files created in `src/mocks/`
- Zustand stores: `useThemeStore`, `useAuthStore`
- `cn()` utility (`clsx` + `tailwind-merge`) in `src/lib/utils.js`
- Mock avatar SVG at `public/mock-avatar.svg`

### Changed
- **Signup Step 1 removed** — account creation handled on the marketing website, not the dashboard app
- **Signup flow** is inside the dashboard app but renders without dashboard navigation
- `/signup/account-creation` route removed from CLAUDE.md and PRODUCT.md

### Design Feedback
- Input fields with icons need more left padding (`pl-11` or `pl-12`) to avoid icon/text overlap
- Signup form vertical spacing was too tight — increase gaps between field groups
- Signup form should be vertically centered on the page, not top-aligned

### Added to CLAUDE.md
- **Changelog Workflow** section — 5 rules for maintaining CHANGELOG.md
