# CHANGELOG — Kicksta Dashboard

> Updated at the end of each working session. Every confirmed decision, addition, removal, or change is logged here.
> Before making any new change, check this log for conflicts with prior decisions.

---

## 2026-05-21 — Per-state accuracy + communication polish (Runs 1–4)

Three-pass review of every preset state (Trial — First / Last / Disconnected, Active — Empty / Populated / Disconnected) with fixes applied in batches. Now each preset renders an accurate snapshot of what the dashboard should look like in that state — empty states show empty data, trial states lock the audit, disconnected states communicate disconnection through three independent indicators (page banner + sidebar strip + account-avatar red dot).

### Added
- **`mockGrowthDailyEmpty`** in `src/mocks/growth.js` — 30 zero-valued days anchored to today. Used by trial-first-day, trial-disconnected, and active-empty presets so charts and stat-card sparklines show "no data yet" instead of fabricated history.
- **`TrialLockedBody` state in `InstagramAuditCard`** — yellow "Available after trial" pill in the header, disabled CTA with a Lock icon and "Your first audit unlocks once your trial ends — we need at least a week of activity" copy.
- **`SidebarDisconnectStrip` in `DashboardLayout`** — compact red disconnect indicator above Settings / Dark mode / Log out. Routes to `/signup/connect-instagram`. Collapsed-sidebar variant shows just the icon.
- **Empty state in `TargetsOverview`** (Top Targets card) — Target chip + "No targets yet" + "Add an account or hashtag…" copy + inline "Add source" link to `/targeting`. Renders whenever the targets array is empty regardless of preset.

### Changed
- **Disconnect banner** — hoisted out of `pages/overview/index.jsx` into `DashboardLayout` so it now persists on Targeting and Engagement pages too. Self-gated on `useAccounts` active account state.
- **`AccountLiveStatus`** — gained two new phases: `disconnected` (red AlertTriangle, "Disconnected — reconnect to resume growth") and `empty` (yellow Target, "Ready — add your first source to start growing"). Priority order: disconnected > empty > paused > live engine phase. Engine-cycle copy can't display when there's nothing to cycle through.
- **`AccountPauseCTA`** — hidden when the account is disconnected OR there are no targets. Nothing to pause in either case.
- **`TrialBanner` (last-day variant)** — dropped the "Manage plan" CTA per the design spec; added a Dismiss X that writes to `useUiState.trialBannerDismissed`. `seedAllStores` resets the dismiss flag on every preset switch.
- **`FollowBackRateMetric`** — distinguishes "all-zero (no data)" from "low rate". When no day in the window has a non-zero follow-back rate, renders an em-dash with no Healthy/Average/Needs-attention pill instead of misleading "0% / Needs attention".
- **`ActivityFeed` empty copy** — differentiates "items array is fully empty" ("Activity will appear here once Kicksta starts engaging with your targets.") vs "filtered to empty in the current window" (existing copy).

### Decisions (locked, don't revisit)
- **Empty-state status copy: "Ready — add your first source to start growing"** (yellow Target icon). Drives the user toward the next step instead of showing fake engine-cycle phase text.
- **Disconnect communication is triple-redundant.** The user sees disconnect state through (1) the top-of-page banner with Reconnect CTA, (2) the sidebar strip above Settings, (3) the red dot on the AccountSwitcher avatar. Different attention zones, same signal.
- **Audit is locked during trial, period.** Yellow "Available after trial" pill + disabled CTA. No data → no audit, full stop.
- **Trial banner is closeable.** Lives in `useUiState.trialBannerDismissed`; resets on preset switch.

### Verified
End-to-end DOM check across all 6 presets — every preset renders the correct combination of: widget badge (T1/T7/TX/A0/AP/AX), trial pill, period switcher vs trial-period pill, top banner, sidebar strip, audit lock state, top-targets empty state, status text, follow-back rate value, pause CTA visibility.

---

## 2026-05-21 — Dashboard state switcher widget (P1 foundation)

Foundation pass for the floating bottom-right widget that flips the dashboard between 6 canonical preset states (Trial — First/Last/Disconnected, Active — Empty/Populated/Disconnected). Imperative seed-on-switch architecture: `useDashboardPreset.applyPreset(name)` mutates the underlying stores so most components keep working unchanged. P2–P6 (banner system, empty states, chart forecast modes, disconnect polish) ship next.

### Added
- **`src/stores/useDashboardPreset.js`** — owns the preset name + applyPreset + reset + localStorage persistence (key: `kicksta-dashboard-preset`). Synchronously reseeds all stores on module load if a non-default preset was previously selected, so there's no flash of default content on refresh.
- **`src/stores/useUserStore.js`** — single source of truth for the dashboard user (`isOnTrial`, `plan`, `growthPlusSubscribed`, `trialEndsAt`, `createdAt`, `growthPlusTier`, etc.). Wraps the previously-direct `mockUser` imports so the preset switcher can reseed.
- **`src/stores/useActivityFeed.js`** — wraps `mockActivity`.
- **`src/stores/useGrowthData.js`** — wraps `mockGrowthDaily`.
- **`src/stores/useUiState.js`** — preset-related UI flags (`trialBannerDismissed` is the first inhabitant).
- **`src/mocks/presets.js`** — the 6 preset recipes + grouped metadata (`PRESET_GROUPS`) + abbreviation map (`PRESET_ABBREV`) for the widget badge.
- **`src/components/DashboardPresetWidget.jsx`** — floating bottom-right widget with a collapsed circular button (`h-14 w-14 rounded-full bg-text-primary` with abbreviation badge top-right) + expanded popover (`w-72 rounded-xl` with three grouped sections + Reset link).

### Changed
- **`src/stores/useAccounts.js`** — added `setConnectionState(state)` action so presets can flip the active account's connection state without rewriting the whole accounts array.
- **`src/components/DashboardLayout.jsx`** — mounts `<DashboardPresetWidget />` at the bottom of the layout so the widget appears on every dashboard route. Signup routes don't include DashboardLayout, so the widget naturally doesn't appear there.
- **9 files** — direct `mockUser` reads swapped to `useUserStore`: `targetSlots.js`, `SystemStatus.jsx`, `growthPlus/index.jsx`, `AudienceFiltersCard.jsx`, `AudienceFiltersModal.jsx`, `WelcomeDmCard.jsx`, `CloseFriendsCard.jsx`, `overview/index.jsx`, `EngagementSnapshot.jsx`. `mockActivity` + `mockGrowthDaily` reads in `overview/index.jsx` swapped to `useActivityFeed` + `useGrowthData`. Files that import other named exports from `@/mocks/user` (`PLAN_CATALOG`, `mockGrowthPlusNextBillingAt`) keep those imports unchanged. `useUserProfile.js` intentionally still reads `mockUser` at module-init time for name splitting — presets don't change name/email.

### Decisions (locked, don't revisit)
- **The widget ships visible in current builds.** It's a dev / QA affordance; gated behind `import.meta.env.DEV` (or removed entirely) before the real V1 production launch.
- **Imperative seed-on-switch, not preset overlay.** Components read from existing stores; the preset switcher mutates those stores. Only a small set of components (GrowthChart, InstagramAuditCard, TrialBanner — wired in P2–P5) will read the preset name directly when their behavior can't be expressed by data alone.
- **`localStorage` key: `kicksta-dashboard-preset`.** Reset clears the key and returns to `active-populated`.

### Verified (DOM-level)
- All 6 presets correctly mutate the AccountCard connection dot (red for disconnected presets, green otherwise) and the Trial pill (present only for the three trial presets).
- Widget badge updates on switch (`T1` / `T7` / `TX` / `A0` / `AP` / `AX`).
- Toast fires per switch ("State: Trial — Last day", etc.).
- localStorage round-trips correctly; reload boots into the saved preset.
- Reset clears localStorage and returns to `active-populated`.

---

## 2026-05-20 — Targets bulk-select polish + Overview restructure

Two areas in one session. First, restyled the Targets bulk-select to match the dashboard's pill language and moved the per-row checkboxes from the right edge to the left. Second, a large Overview pass: a pause-growth confirmation modal, audit card turned into a state-aware data surface, a new Growth+ overview card with subscribed/upsell states, and a refactor of the bottom block so Audit + G+ live in a 2-col row paired with Targets + Settings/Engagement with the dashboard's bottom kept aligned.

### Added
- **`src/pages/overview/PauseGrowthModal.jsx`** — bottom-sheet/modal confirming intent before pausing growth. Body explains that all engine activity stops and the system needs a short warm-up window on resume. Primary button uses the action name ("Pause growth") per the design rules. Resume stays one-click.
- **`src/pages/overview/GrowthPlusOverviewCard.jsx`** — full Growth+ snapshot card with two states.
  - **Subscribed**: neutral `bg-bg/50` header band with chip + "Growth+" + tier pill + "View details →" link top-right; body is a 3-stat strip (Boosts this month / Followers from G+ / Reach added) with vertical separators between cells.
  - **Upsell (not subscribed)**: purple gradient chrome (`border-purple-base/20` + `bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15`) with a purple-banded header (`bg-purple-base/15` + `border-b border-purple-base/20`) hosting the chip + "Growth+" + solid-purple "FROM $X/MO" pill. Body has a 2-row blurb + "Get Growth+" CTA. Min price is computed from `mockGrowthPlusTiers` so it stays accurate.
- **`src/mocks/audit.js`** — top-3 audit numbers (`reach7d`, `engagementRate`, `avgLikes`) with `delta` and `deltaTone` so the audit card can render the numbers + colored delta strings without re-parsing math on the consumer side.

### Changed
- **`src/pages/targeting/BulkActionBar.jsx`** — dropped the sticky chrome bar (`sticky top-0`, `backdrop-blur`, no border-radius) in favor of FilterRow's pill language. "N selected" is now a removable `h-8 rounded-full bg-blue-tint text-blue-text` chip with an embedded X. Pause / Remove / Restore are `h-8 rounded-full` pills matching the Sort/Select rhythm. Pause and Remove gained Lucide icons (Pause, Archive); Restore got ArchiveRestore. All three disable when `count === 0`.
- **`src/pages/targeting/TargetRow.jsx`** — per-row checkbox in selection mode moved from the right edge to the left edge of the row. Vertically aligned with the select-all checkbox in the list header. Right edge now holds only the chevron in non-selection mode and is empty in selection mode.
- **`src/pages/overview/index.jsx`** — major restructure:
  - AccountCard's pause CTA now routes through `PauseGrowthModal` when going running → paused; resume bypasses the modal.
  - AccountCard's identity row gained a purple Growth+ pill (Sparkles icon, `bg-purple-tint`/`text-purple-text`) when `user.growthPlusSubscribed`.
  - Audit + Growth+ cards now share a single bottom block grid that ALSO owns the Targets / Settings / Engagement rows. Mobile DOM order: Audit → G+ → TargetsOverview → TargetingSettings → EngagementSnapshot. Desktop: 2-col with column-internal stacking (Audit + TargetsOverview on the left; G+ + TargetingSettings + EngagementSnapshot on the right). Achieved via `display: contents` on the column wrappers on mobile + `order-*` on cells to preserve mobile order without sacrificing the desktop layout.
  - Bottom alignment: TargetsOverview (left column) and EngagementSnapshot (right column) both `flex-grow` to absorb the vertical-height difference between Audit and G+, so both columns end at the same Y regardless of which state Audit and G+ are in.
  - Overview's `user` is composed from `mockUser` + `useGrowthPlusSubscription` + `useGrowthConfig.growthPlusControls.tier` so the upsell → subscribed flip happens inline when the user upgrades through `/growth-plus`.
- **`src/components/InstagramAuditCard.jsx`** — became state-aware data card.
  - **Not generated**: header band has only title + AVAILABLE pill (no CTA up there); body holds a 2-row description + primary "Get Instagram Audit" button below. While generating, the same button shows "Generating audit…" + spinner and is disabled.
  - **Generated (cooldown)**: header band gains a small "View audit →" link top-right (Edit / View all pattern); body is a 3-stat strip (Profile reach / Engagement rate / Avg likes per post) with deltas and vertical separators.
- **Sparklines on the three Overview stat cards** — `activeDot={false}` added so Recharts doesn't show a hover dot.
- **`src/mocks/user.js`** — default `mockUser` starts un-subscribed (`growthPlusSubscribed: false`, `growthPlusTier: null`). Upgrading through `/growth-plus` flips `useGrowthPlusSubscription`; the Overview reads from that store to render the subscribed state.
- **Both card descriptions** (audit not-generated, G+ upsell) constrained to 2 rows via `line-clamp-2 min-h-[2lh]`. Trimmed copy so each fits cleanly: "A weekly PDF of your growth — follower trends, top targets, and engagement metrics." / "Algorithmic boosts that amplify your reach and accelerate follower growth on top of your plan."
- **`src/pages/overview/EngagementSnapshot.jsx`** — root container gains `flex h-full flex-col` so it can grow inside the right column's `flex-1` wrapper for bottom alignment.

### Decisions (locked, don't revisit)
- **Pausing growth always opens a confirmation modal; resuming is one-click.** Pause stops engine activity; the system needs a warm-up window on resume — the user gets a chance to back out.
- **Default Growth+ state is upsell.** `mockUser` ships un-subscribed. The dashboard reads from `useGrowthPlusSubscription` + `useGrowthConfig` so the existing `/growth-plus` upsell flow drives the state transition.
- **Audit + G+ are NOT height-coupled by `items-stretch`.** They each take their natural state-specific height. The bottom card in each column flex-grows so the dashboard's bottom row stays aligned.
- **Subscribed cards use the neutral `bg-bg/50` header band; the Growth+ upsell card uses purple chrome.** The subscribed state is a data card and must match the rest of the dashboard. The upsell is meant to drive conversion and gets its own brand-color treatment.
- **Per-row checkboxes in target selection live on the LEFT edge** of the row, vertically aligned with the list-header select-all checkbox. Right edge is reserved for the chevron in non-selection mode.

### Removed
- **G+ stat strip inside `AccountCard`** — was a 4-stat row at the bottom of the AccountCard. Moved out into the dedicated `GrowthPlusOverviewCard` so subscription value lives on its own surface (not nested inside identity), and so its typography can match the dashboard's stat scale (`text-xl/2xl semibold`) instead of the cramped sizes it had inside the AccountCard.
- **`mockUserNoGrowthPlus` variant** — default `mockUser` IS the non-G+ scenario now; the variant became redundant.

---

## 2026-05-20 — Settings/billing fixes & polish

Two passes against the Billing tab and the per-subscription detail page. First pass shipped a status-aware billing line, invoice history corrections, ARIA cleanup, mobile card-actions drawer, pay-overdue confirmation popup, and invoice card-wrapping. Second pass fixed three items the first pass missed or got wrong.

### Added
- **`src/pages/account/PayOverdueModal.jsx`** — confirmation popup before retrying a past-due charge. Shows plan + amount line items, total due, and which primary card will be charged. Processing → success states match the cancel-flow shell. Wired into `SubscriptionDetail` via `SubscriptionStateBanner.onPayOverdue` — the banner no longer fires the store mutation directly.
- **`useIsMobile` hook (local to `PaymentMethodsCard`)** — bound to `matchMedia('(max-width: 767px)')` so the card-actions menu can swap between desktop dropdown and mobile drawer.
- **`Working Rules — Non-Negotiable` section in `CLAUDE.md`** — four rules at the top of the project doc: never do anything unasked, always re-read the user's message after finishing, never ignore anything (ask if unsure), always double-check. Captures lessons from a session where each of those was violated.

### Changed
- **`SubscriptionCard`** — status-aware `BillingLine` component replaces the unconditional `Next: $X on …`. Branches: `active`, `trialing` (Trial ends · then $X), `past_due` (red "Payment failed · $X overdue"), `paused` (Resumes …), `cancelled_pending` (Ends …), `canceled` (Ended …). Spacing rebuilt for visibility: `py-5`, `h-12` avatar (`text-base` initial), `text-base` username, `mt-1.5` plan label, BillingLine internal `mt-1`. Explicit `self-center` on avatar + text-col + chevron so vertical centering can't drift.
- **`PaymentMethodsCard`** — header pluralized (`Payment method` → `Payment methods`). Add-button `aria-label` now matches its visible "Add card" text. Row menu trigger gets a per-card `aria-label` (`Actions for Visa ending in 4242`) plus `aria-haspopup="menu"` and `aria-expanded`. **Mobile** opens a portal-rendered bottom drawer with the card preview echoed in the header; **desktop** keeps the original inline dropdown. Both source the same `menuOpen` state and trigger button.
- **`InvoicesTable` desktop** — switched to `table-fixed` + `colgroup` widths so the Description cell truncates against remaining column width instead of an arbitrary `max-w-[28ch]` cap. Long descriptions stop clipping.
- **`InvoicesTable` mobile** — redesigned rows: date + status pill on the primary line (matches desktop column order), description as truncated subtext, amount + download anchored right. Removes the prior dot-separated wrap of `date · amount · pill`.
- **`SubscriptionDetail`** — Invoices now wrapped in the same surface treatment as PlanCard / ServerCard (CardChip + InfoTooltip header + bordered `bg-surface` section). The "End this subscription" panel changed from `bg-bg` (page-bg color) to `bg-surface` so it reads as a card instead of disappearing into the page.
- **`ChangeServerModal`** — removed the "Closer servers improve growth speed and Instagram safety limits" line. Redundant with the modal subhead.
- **`CancelSubscriptionModal` + `CancelGrowthPlusModal`** — added `border-border` to the sheet shell so the modal surface has a defined edge.
- **`mocks/invoices.js`** — `inv_007` date bumped `2026-05-10` → `2026-05-20` (a pending invoice on the trial-end date matches `sub_002`'s trialing status). `inv_004` / `inv_005` reordered into a coherent two-failure retry sequence for `sub_003`.
- **`mocks/subscriptions.js`** — `sub_003.nextBillingAt` `2026-05-01` → `2026-05-25`, so the past-due card no longer reads "next billing on a date that's already past."

### Decisions (locked, don't revisit)
- **Subscription billing line copy is status-driven.** Active = Next; trialing = Trial ends · then $X; past_due = red Payment failed · $X overdue; paused = Resumes; cancelled_pending = Ends; canceled = Ended. The list row never shows misleading "Next: $X" copy for non-active states.
- **Past-due retries go through `PayOverdueModal`.** The user never triggers a charge in one tap — they see plan, amount, and card before confirming.
- **Card actions UI is viewport-split:** drawer on mobile (`< 768px`), dropdown on desktop. Driven by `useIsMobile` matching the `md:` breakpoint.
- **"End this subscription" and Invoices on the subscription detail page use `bg-surface`**, not `bg-bg`. The detail page is a stack of cards on a page background — sections that drop to `bg-bg` blend into the page.

### Removed
- Per-row inline-dropdown-only menu on Payment methods (mobile users now get a drawer; desktop unchanged).
- Arbitrary `max-w-[28ch]` description truncation on the invoices table.
- "Closer servers improve growth speed and Instagram safety limits" subhead from `ChangeServerModal`.

---

## 2026-05-18 — Billing page de-clutter

Polish pass on top of the Option-2 card-with-chip-header restructure that landed the same day. Flattens the visual treatment so Billing reads as a clean list-inside-card surface instead of cards-stacked-inside-cards.

### Added
- **`src/components/CardBrandIcon.jsx`** — inline SVG logos for Visa, Mastercard, Amex (Discover gets a gradient placeholder). Used by `PaymentMethodsCard` to surface the actual brand instead of the generic `CreditCard` lucide icon.
- **Mastercard entry in `mockPaymentMethods`** so the icon mapping has coverage during dev.

### Changed
- **Payment-method rows** — primary card keeps its bordered chip (visual emphasis on the default-charge card). Secondary cards collapse from individually-bordered rows to **divider-separated list rows** inside the parent card.
- **Subscription rows** (`SubscriptionCard`) — same treatment: drop per-row `rounded-lg border`, render as divider-separated list rows inside the Subscriptions parent card.
- **Invoice mobile rows** — drop per-card `rounded-lg border`, render as divider-separated rows inside the Billing history parent card.
- **Billing history header icon** swapped from `Receipt` → `Clock`. Avoids visual collision with the empty-state `Receipt` icon still used inside `InvoicesTable` when there are no invoices.

### Decisions (locked, don't revisit)
- **Primary payment method gets visual emphasis** (kept its bordered chip + blue tint) while secondary cards flatten to dividers. The "default-charge" card needs to be unmistakable at a glance.
- **Divider-separated rows inside the parent card** is the standard treatment for Billing list contents — beats per-row borders which read as cards-in-cards. Pattern shared by Payment methods (secondary), Subscriptions, and Invoices (mobile).
- **Billing history's header icon is `Clock`.** `Receipt` is reserved for the empty-state inside `InvoicesTable`.

## 2026-05-18 — Targets bulk-select

Multi-row selection mode on the Targets list at `/targeting`. Pending-queue item #1 from the prior session, shipped end-to-end through the brainstorming → spec → plan → subagent-driven-development cycle.

### Added
- **Selection state on `useTargetsStore`** — `selectionMode: boolean`, `selection: Set<id>`, and five actions: `enterSelection`, `exitSelection`, `toggleSelect(id)`, `selectAllVisible(ids)`, `clearSelection`. Selection state is store-level so future surfaces (deep-links, cross-page bulk) wire in cleanly.
- **`BulkActionBar`** (`src/pages/targeting/BulkActionBar.jsx`) — sticky toolbar with X (exit) + `aria-live` count + bucket-specific action buttons. Pure presentation; parent owns state.
- **`BulkRemoveModal`** (`src/pages/targeting/BulkRemoveModal.jsx`) — "Archive N targets?" confirm. Body summarizes up to 3 handles inline; appends "and N more" past that. Primary CTA "Move N to Archive" (red), secondary "Keep them". Mirrors `RemoveTargetModal`'s mobile-bottom-sheet / desktop-centered pattern.
- **`RestoreLimitModal`** (`src/pages/targeting/RestoreLimitModal.jsx`) — blocks bulk Restore when it would exceed the plan slot limit. Single dismiss ("Got it") returns to selection mode with selection intact; secondary CTA "Upgrade plan" navigates to `/account/billing`.
- **`src/utils/targetSlots.js`** — `slotLimit()` + `inRotationCount(targets)` helpers, extracted from inline math in `TargetsHeroCard`. Single source of truth for plan-derived rotation capacity.
- **Master tri-state checkbox** in the column header (only visible in selection mode). `aria-checked="true" | "mixed" | false` with the `Minus` icon for the partial state.
- **Page-level Escape handler** in `TargetsTab` exits selection mode — gated to skip when a confirm modal is open (the modal owns Escape).

### Changed
- **`FilterRow`** gained a `Select` button (right side, hidden when the current bucket is empty). When `selectionMode === true`, the entire FilterRow returns `null` — `BulkActionBar` takes its vertical slot. Returning `null` (vs. disabling) eliminates lost-selection edge cases by construction.
- **`TargetRow`** flips between `role="button"` (open drawer) and `role="checkbox"` (toggle selection) based on `selectionMode`. Right-edge chevron swaps for a checkbox affordance in selection mode; the whole row is the tap target. Selected row gets a `bg-blue-tint/30` tint.
- **`TargetList`** owns the selection helpers (visible-ids, all/some-selected, master toggle) and `handlePause` (pauses each `active`/`queued` selected row, fires count-aware toast, exits). Bar renders as a sibling above the list `<section>` rather than inside it, so its `sticky top-0` actually sticks.
- **`TargetsTab`** owns bulk Remove + Restore handlers, slot-limit pre-check, page-level Escape, and renders the two new modals alongside the existing drawers.
- **`DashboardLayout`** — `<main>` swapped from `overflow-hidden` to `overflow-x-clip`. `overflow-hidden` was added previously to guard the Settings grid against horizontal mobile overflow; `overflow-x-clip` preserves that clip while allowing `position: sticky` descendants to function. Verified the Settings billing mobile overflow guard still holds.
- **`TargetsHeroCard`** now imports `slotLimit()` from the new util instead of computing inline.

### Decisions (locked, don't revisit)
- **Bulk-select entry is an explicit "Select" toggle.** Not long-press (gesture conflicts with iOS) and not always-on checkboxes (visual noise + ambiguous tap target).
- **Bar exposes Pause + Remove (Active) / Restore (Archived). No bulk Resume.** Paused→queued bulk transition wasn't worth the edge cases for V1; Resume stays per-row in the drawer.
- **Bulk Remove always confirms via `BulkRemoveModal`.** Pause is no-confirm (reversible); Restore confirms only on slot-limit block (non-destructive otherwise).
- **No hard-delete from Archive in V1.** Archive IS the undo path.
- **No undo toast after Remove.** No project-wide undo pattern yet; restoring from the Archived bucket is the explicit path.
- **No shift-click range select** (mobile-first; low utility).
- **FilterRow hides entirely during selection mode** — not disabled. Filter/sort changes mid-selection introduce lost-selection edge cases; hiding eliminates them by construction.
- **Selection state lives on the store, not on `TargetList`** — future surfaces (deep-link to "select these," cross-page bulk) wire trivially.
- **Page-level Escape handler must be gated against open modals.** Without the gate, Esc on a confirm modal closes the modal AND silently exits selection — discarding the user's preserved selection.
- **`overflow-x-clip` over `overflow-hidden` on `<main>`.** `overflow-hidden` creates a formatting context that breaks `position: sticky` descendants. `overflow-x-clip` keeps the horizontal mobile-overflow guard without that side effect.

### Deferred (polish, low priority, flagged by final review)
- Disabled Pause button is missing the `Tooltip` ("Selected targets are already paused or depleted").
- Action button `aria-label`s read "Pause 0 targets" when selection is empty; should singular/plural-ize matching the toast vocabulary.
- Both new modals use `aria-label` on the dialog root rather than `aria-labelledby` pointing to the visible `<h2>` (consistent with existing `RemoveTargetModal`, but `aria-labelledby` is stronger).
- `TargetsHeroCard` still uses `targets.length` (counts archived) for the slot count display; could switch to `inRotationCount(targets)` now that the util exists.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-18-targets-bulk-select-design.md`
- Plan: `docs/superpowers/plans/2026-05-18-targets-bulk-select.md`

---

> **2026-05-18 session note:** end-of-session checkpoint after a multi-day push (commits span 2026-05-12 through 2026-05-14 date headers but the working session ran through 2026-05-18). Major arcs landed: subscription cancellation flow (main + Growth+), Overview snapshot split, Instagram Audit card, tinted header band across Overview, single-target processing model + tooltips, Engagement defaults-on + all-time stats, Settings billing card-with-chip-header layout, mobile-overflow fix on Settings grid track. Granular commits available in `git log`. See CONTEXT.md "Resume context (2026-05-18)" for the full state map.

## 2026-05-18 — Multi-arc session summary

This session was big. Rather than expand every commit into its own changelog block, the prose summary lives in `CONTEXT.md`'s **Resume context (2026-05-18)** section. The architectural decisions all moved into the locked-decisions list. Granular per-commit history is in `git log`.

### Highlights
- **Subscription cancellation** — full 5-step modal flow for the main subscription with reason-tailored real saves (downgrade plan, switch server, pause 30/60/90 days). New `paused` + `cancelled_pending` statuses with `SubscriptionStateBanner` (yellow tinted) and a red variant for `past_due` with "Pay outstanding invoice" CTA. Step-driven modal titles. Equal-weight Keep vs Cancel buttons. Inline downgrade deflection on "Too expensive."
- **Growth+ Manage** — entry popup from BillingCard's "Manage", routes to a full tier-change page at `/account/growth-plus` with proration confirm modal. 3-step Growth+ cancel flow with `cancelled_pending` state on the subscriber dashboard.
- **Overview snapshot split** — replaced `GrowthSettingsSnapshot` (bundled Targeting + Engagement, broken `/growth` link) with `TargetingSettingsSnapshot` + `EngagementSnapshot`. Each routes to its own destination.
- **Instagram Audit card** — new Overview component, 24h cooldown, "Get Instagram Audit" → "Generating…" → "View audit". Full spec → plan → impl cycle.
- **Tinted header band on Overview** — all six Overview cards now share `bg-bg/50` band header with `Edit →` / `View all →` CTA in the title row. `mt-auto` footer pattern retired.
- **Single-target processing model** — only one target has `status: 'active'` ("Running"); others sit at `'queued'`. Status pill labels updated. `STATUS_TOOLTIP` + `STATUS_DOT_CLASS` in `src/pages/targeting/targetStatus.js`.
- **Target Detail Drawer** — `StateBanner` (1-line tinted strip with status word + explanation), horizontal `StatColumn` stats strip, removed redundant mobile dot + desktop pill on header.
- **Verified / Private icons** in Add Target popup, TargetRow, Overview Top Targets row. `addTarget` carries picker metadata through.
- **`HealthPill`** expanded: Verified > Private > count buckets, each with `explain` Tooltip.
- **`Tooltip`** component portal-rendered with viewport clamping (`src/components/Tooltip.jsx`).
- **Engagement** — default-on toggles (Welcome DM + CFA), all-time stats card with weekly delta, real DM avatars, CFA copy "Add/Remove Followers."
- **Whitelist / Blacklist** real Pravatar avatars in mocks + render.
- **Server data** city/country in `mockServers` flat array with `mockServerCountries` derived hierarchy. `ChangeServerModal` two cascading dropdowns. New `ServerCard` on subscription detail page. `AccountSwitcher` server picker nested inside active account.
- **Settings billing layout** — each section wrapped in a card with chip + title + Add button inside (ProfilePanel pattern). `SubscriptionCard` collapsed to row-style.
- **Settings mobile overflow fix** — `min-w-0` on outlet section + `[200px_minmax(0,1fr)]` grid template.
- **Global polish** — scroll reset on route change, account switch → `/`, 16px input on Targeting (iOS zoom guard), unified dropdown chevrons, shared modal header pattern across all confirm/cancel modals.

### Spec / plan files added this session
- `docs/superpowers/specs/2026-05-12-growth-plus-manage-design.md`
- `docs/superpowers/plans/2026-05-12-growth-plus-manage.md`
- `docs/superpowers/specs/2026-05-12-subscription-cancel-design.md`
- `docs/superpowers/plans/2026-05-13-subscription-cancel.md`
- `docs/superpowers/specs/2026-05-13-overview-snapshot-split-design.md`
- `docs/superpowers/plans/2026-05-13-overview-snapshot-split.md`
- `docs/superpowers/specs/2026-05-13-instagram-audit-design.md`
- `docs/superpowers/plans/2026-05-13-instagram-audit.md`



## 2026-05-13 — Instagram Audit card

Adds the Instagram Audit affordance to the Overview page. Users can pull a weekly PDF snapshot of their account's growth, gated by a 24h cooldown.

### Added
- `InstagramAuditCard` component (`src/components/InstagramAuditCard.jsx`) — single-CTA card on the Overview page. CTA label encodes the cooldown state: "Get Instagram Audit" (available) → "Generating audit…" with spinner (1500ms processing) → "Available in {N}h" (cooldown).
- `useInstagramAudit` Zustand store — tracks `lastDownloadedAt`. `download()` stamps the timestamp and fires a "Audit downloaded." toast. `_reset()` QA helper flips back to "available" for testing.
- `src/utils/auditCooldown.js` — `isAuditAvailable(iso)` + `nextAuditAvailableIn(iso)` pure helpers. 24h cooldown constant lives here.

### Changed
- Overview page renders the audit card in a new full-width row between the GrowthChart/ActivityFeed row and the bottom 2-col block. Placement is adjacent to the chart it summarizes.

### Decisions (locked, don't revisit)
- **24h cooldown.** Single source of truth: `COOLDOWN_MS` constant in `src/utils/auditCooldown.js`.
- **CTA label encodes state.** No separate cooldown pill. Disabled state's label tells the user when it's available.
- **No PDF in V1.** Click triggers the spinner + toast only. Real PDF generation ships with backend; the store's `download()` action will be extended to call the real endpoint.
- **Per-account audit selection out of scope.** Audit reflects the active IG account; the page header already shows which one.
- **No audit history list.** Just the latest cooldown stamp. Multi-download history is a future spec if needed.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-13-instagram-audit-design.md`
- Plan: `docs/superpowers/plans/2026-05-13-instagram-audit.md`

## 2026-05-13 — Overview snapshot split

The Overview page's bundled "Growth Settings" snapshot has been replaced with two single-purpose snapshot cards, each routing to the correct destination page.

### Added
- `TargetingSettingsSnapshot` component — shows Mode + Like-after-follow + Filters (6 pills). Footer CTA "Edit Targeting" → `/targeting?tab=settings`.
- `EngagementSnapshot` component — shows Welcome DM toggle + 1-line message preview when on, and Close Friends Adder toggle + mode caption when on. Plan-locked rows render an "Advanced" pill. Footer CTA "Edit Engagement" → `/engagement`.

### Changed
- Overview page bottom block reorganized into two `grid-cols-1 lg:grid-cols-2` rows. Row 1: `TargetsOverview` + `TargetingSettingsSnapshot`. Row 2: `EngagementSnapshot` (currently `lg:col-span-2` pending the Instagram Audit card landing in the next spec).

### Removed
- Inline `GrowthSettingsSnapshot` and `GrowthSettingsSnapshotBody` functions from `src/pages/overview/index.jsx`. The "Edit Growth" CTA they shipped pointed to `/growth` — a route that doesn't exist — and the bundling of Targeting + Engagement settings under one card created mental-model confusion.
- Now-unused lucide imports: `Heart`, `Shield`, `Settings2`, `MessageSquare`.

### Decisions (locked, don't revisit)
- **Snapshot scope = page scope.** Each snapshot reflects exactly one destination page; never mix settings that live on two pages.
- **Footer CTA goes to the page the snapshot summarizes.** "Edit X" pattern with the destination name.
- **Plan-locked toggles render an `Advanced` pill** with no preview/caption — same pattern the Engagement page itself uses.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-13-overview-snapshot-split-design.md`
- Plan: `docs/superpowers/plans/2026-05-13-overview-snapshot-split.md`

## 2026-05-13 — Subscription cancellation flow

Real cancellation experience for the main subscription. Replaces the "coming soon" stub with a 4–5 step honest flow that reduces churn through real save offers without any dark patterns.

### Added
- **CancelSubscriptionModal full rewrite** — 5-step state machine: Reason → Save offer (conditional) → What you'll lose → Confirm → Success. Each step (except final confirm) has a "Cancel anyway" shortcut to the confirm step.
- **Save offers** — four reason-tailored offers, every one a real store mutation:
  - "Too expensive" (Advanced users only) → Downgrade to Growth via `DowngradePlanConfirmModal`
  - "Not enough results" → Inline server-region picker reusing `setServer`
  - "Taking a break" → 30/60/90 day pause via `PauseConfirmModal`
  - "Switching to another tool" → No save attempt; optional research question (tool dropdown + textarea)
- **`paused` subscription state** — store action `pause(id, days)` sets `status: 'paused'` + `pauseUntil`. SubscriptionDetail page renders a yellow banner with "Resume now" button. Growth halts, billing skipped during pause.
- **`cancelled_pending` subscription state** — store action `cancel(id)` sets `status: 'cancelled_pending'` + `endsAt` (trialEndsAt for trial users, nextBillingAt otherwise, today for past-due users). Banner reads "Ending {date}. Full access until then." with Resume button.
- **`SubscriptionStateBanner`** — yellow banner component shared by both paused and cancelled_pending. Renders above PlanCard on the subscription detail page.
- **`PauseConfirmModal`** — confirm → processing → success modal for pause action. Shows duration, resume date, "billing skipped" line.
- **`DowngradePlanConfirmModal`** — confirm → processing → success modal for plan downgrade. Shows from/to/savings/proration credit. Uses the existing `prorationFor` helper.
- **Subscription store** (`useSubscriptions`) gained `cancel`, `resume`, `pause`, `setPlan` actions. All fire toasts via `useToasts`.
- **Mock data** — added `pauseUntil`, `endsAt`, `totalFollowersGained` fields to each entry in `mockSubscriptions`.
- **Status pill registry** — added `paused` and `cancelled_pending` entries to `STATUS_PILL` (both yellow-tint).

### Changed
- **PlanCard** — when paused or cancelled_pending, hides Upgrade and Add/Remove Growth+ buttons, renders a single "Resume subscription" green-base button instead.
- **SubscriptionDetail page** — renders the new banner when subscription is on hold; hides the bottom Cancel section in those states (already on the way out).

### Decisions (locked, don't revisit)
- **Anti-dark-pattern principles** — Close X always works; Cancel-anyway shortcut on every step except final confirm; final confirm has equal-weight Keep vs Cancel buttons; save offers are real or absent (never decoys); no fake urgency; no multi-step "are you sure" pile-on after final decision.
- **Save step is conditional.** Skipped for "Other" reason, for Growth-plan users picking "Too expensive" (already on cheaper plan), and for past-due users (not paying anyway).
- **Pause durations are 30/60/90 days only.** No indefinite pause — drifting subscriptions in limbo serves no one. Real return dates only.
- **Single tier downgrade.** Advanced → Growth is the only plan-change in V1. Future tiers (if any) ship with backend.
- **No automatic lapse from cancelled_pending.** Like Growth+, the period-end clock-driven transition ships with the backend. V1 stays in cancelled_pending until manual resume or QA reset.
- **Final cancel button label is "Cancel subscription".** Never "Yes" / "OK" / "Confirm" — action name communicates the action.
- **Resume from any on-hold state is the same action.** Clears endsAt and pauseUntil; sets status to active. No proration since the user hasn't received refunds.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-12-subscription-cancel-design.md`
- Plan: `docs/superpowers/plans/2026-05-13-subscription-cancel.md`

## 2026-05-12 — Growth+ Manage subscription

Subscription management surface: tier change, cancellation flow, and the cancelled-pending-end paid-through state.

### Added
- **Manage popup** (`GrowthPlusManageModal`) — entry surface from BillingCard "Manage" button and the GrowthPlusBanner "Manage subscription" deep-link (`/growth-plus?manage=1`). Current plan summary + Change tier + Cancel rows on active subscriptions; Resume button only on cancelled_pending.
- **Tier-change page** at `/account/growth-plus` — full rewrite of the stub. 3 cards with "Current plan" pill on the active tier, "Switch to {tier}" CTAs on the others. Route-guarded — redirects to `/growth-plus` if status is anything other than `active`.
- **SwitchTierConfirmModal** — confirm → processing → success modal with deterministic mock proration. Upgrade displays `$X charged today`, downgrade displays `−$X credited to next bill`. Reused by the cancel flow's "Too expensive" inline downgrade deflection.
- **CancelGrowthPlusModal** — 3-step cancel flow (reason → lose → confirm) + success ack. Reasons: Too expensive · Not enough results · Taking a break · I don't use it · Other. Picking "Too expensive" on a non-Starter tier surfaces an inline deflection card pointing to the next cheaper tier (Elite → Pro, Pro → Starter); Starter shows none.
- **Cancelled-pending-end UI layer** on the Active dashboard — yellow banner (`GrowthPlusCancelledBanner`) above the hero with the end date + Resume CTA, hero pill swaps to yellow "Ending {date} · {tier}", BillingCard label becomes "Subscription ends" and the upgrade ribbon hides.
- **Subscription store** (`useGrowthPlusSubscription`) gained `status: 'active' | 'cancelled_pending' | 'lapsed'`, `endsAt: ISOString | null`, `cancel(endsAt)`, `resume()`, and a `_lapseForTesting()` QA helper.
- **Proration utility** (`src/utils/proration.js`) — `daysBetween(fromIso, toIso)` and `prorationFor({ oldPrice, newPrice, endsAt })` returning `{ kind: 'upgrade' | 'downgrade', amount }`. Deterministic linear interpolation over a 30-day cycle.

### Changed
- **BillingCard "Manage"** is no longer a `<Link>` to `/account/growth-plus`. It's a button that calls `onManage` from the parent, opening the Manage popup in place.
- **GrowthPlusBanner "Manage subscription"** now links to `/growth-plus?manage=1` (was `/account/growth-plus`). The Growth+ page reads the query param on mount and auto-opens the popup, then strips the param.
- **GrowthPlusPage** branches on `status` — `lapsed` users (after period ends) see the Upsell page rather than the Active dashboard.

### Decisions (locked, don't revisit)
- **Manage popup is the single front door for cancellation.** Cancel CTA does not appear on the tier-change page or anywhere else.
- **Cancel flow is 3 user-facing steps + success ack.** No pause-billing save offer; the only save is the "Too expensive" inline downgrade deflection.
- **Deflection target is the next cheaper tier.** Elite → Pro, Pro → Starter. Starter shows no deflection — flow proceeds to step 2.
- **Tier-change uses real proration math, not "effective next cycle".** Upgrades charge prorated amount today, downgrades credit prorated amount toward the next bill. V1 math is deterministic mock; real proration ships with backend.
- **Cancelled-pending users keep full access until `endsAt`.** Boost continues running, Controls remain editable, Activity feed continues. Only the banner + pill + Billing label communicate the pending end.
- **Tier-change is gated to `status === 'active'`.** Cancelled-pending users must Resume first before changing tier.
- **No automatic lapse transition in V1.** The store exposes `_lapseForTesting()` for QA. Real clock-driven transition ships with backend.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-12-growth-plus-manage-design.md`
- Plan: `docs/superpowers/plans/2026-05-12-growth-plus-manage.md`

## 2026-05-12 — Growth+ hero & pills round

Post-layout-pass QA fixes — hero anchor metric, header icon diversity, upsell education.

### Changed — Upsell page
- **Subtitle rewritten to explain mechanism.** Was `Algorithmic post boosting from a network of real active accounts.` (duplicating the page H1). Now: `Your most recent posts get pushed to a network of real, active accounts — they engage, Instagram sees the signal, and your reach compounds. No bots, no fake engagement.` Educates the user instead of restating the headline.
- **Benefit pills upgraded from flat icon-rows to proper pills.** Each benefit (`Algorithmic boost`, `Active accounts`, `IG-safe`) now renders as a rounded-full pill with `border-purple-base/30`, `bg-surface`, `shadow-sm`, and `text-purple-text` font-semibold. Centered flex-wrap layout. They look like commitments now, not labels.
- **Tier CTA copy: `Start {tier}` → `Subscribe to {tier}`.** The action is subscribing, not starting. Applies to all three pricing cards.

### Changed — Active subscriber page
- **Hero number = total followers gained since subscribing.** Was the per-tier monthly `algorithmicBoost` (40/143/300). Now reads `totalFollowersGained` from `mockGrowthPlusInsights` (Starter 47 / Pro 312 / Elite 891) — a cumulative count carries more weight as the page's anchor metric. Subtitle: `total followers gained from Growth+`.
- **Delta strip removed from hero.** The today/week/month strip introduced in the previous round is gone. The big cumulative number now does the proof-of-value work on its own. Hero collapses back to single-column.
- **Active pill returns to far-right on every breakpoint.** With the 2-col grid gone, `ml-auto` no longer toggles — the pill sits flush right against the GROWTH+ chip on mobile, tablet, and desktop. Hero number rendering: `text-4xl md:text-5xl` (one step up from the layout-pass shrink, since deltas no longer compete).
- **Activity card subtitle added.** `Live feed of post boosts and follower gains from the Growth+ network.` Mirrors the educational pattern set in Controls and brings header structure in line with the other surface cards.
- **Activity card chip icon: `Sparkles` → `Activity`.** Hero already uses Sparkles as the Growth+ brand mark; Activity (pulse) makes the four chips on the page all unique now — Hero=Sparkles, Activity=Activity, Controls=Sliders, Billing=CreditCard.
- **Activity ↔ Controls same height on desktop.** Dropped `lg:items-start` from the 2-col wrapper; grid default `items-stretch` makes both cards fill the row height. Mobile stacking unchanged.

### Changed — Mock data
- `mockGrowthPlusInsights` gained a `totalFollowersGained` field per tier (Starter 47, Pro 312, Elite 891). Powers the hero anchor metric.

### Decisions (locked, don't revisit)
- **Growth+ hero anchor metric is cumulative.** Total followers gained since subscribing, not monthly. Delta strip is gone; the cumulative number doesn't need supporting micro-stats.
- **Every card chip on the Growth+ active page must be a unique icon.** Sparkles is reserved for the Growth+ brand chip (Hero). New cards pick from the lucide library, no duplicates.
- **Upsell page subtitle is educational.** It explains the mechanism (how boost activity flows from network → IG → reach) rather than restating the H1.
- **Benefit row uses pill styling, not bare icons.** Border + surface bg + shadow. Pills get equal visual weight to give the upsell some structure between the hero and the pricing grid.
- **Upsell CTA verb is "Subscribe".** Never "Start", "Begin", or "Get". The action is a subscription.

## 2026-05-12 — Growth+ layout pass

Tighter Growth+ layout after a QA pass on the freshly-merged mobile-session work. Six items addressing density issues across both Growth+ states.

### Changed — Upsell page
- **Hero is smaller and self-contained.** Padding `p-6 md:p-10` → `p-5 md:p-7`. Sparkles chip `h-14 w-14` → `h-10 w-10 md:h-12 md:w-12`. Headline `text-2xl md:text-3xl` → `text-xl md:text-2xl`. Body trimmed to one sentence (dropped "Stack it on top of Targeted Growth for compound results").
- **3 standalone benefit cards are gone.** The "Algorithmic post boosting / Active-account engagement / Throttled to stay safe" cards that sat below the pricing grid have been removed. Their content folds into a compact 3-icon row INSIDE the hero: `[icon] Algorithmic boost · [icon] Active accounts · [icon] IG-safe`. The Upsell page is now hero → pricing → FAQ (was hero → pricing → benefits → FAQ). First pricing card now reaches above the fold on mobile.

### Changed — Active subscriber page
- **Hero is now a 2-col grid on `lg:+`.** Left column carries the chip+pill row, hero number, and headline. Right column carries the delta strip vertically with a left-border separator. Uses the empty gradient space that the original layout wasted. The `Active · Pro` pill loses `ml-auto` on `lg:+` so it sits inline with the chip on the left column.
- **Hero number shrinks.** `text-5xl md:text-6xl` → `text-3xl md:text-4xl`. Still the page's anchor; no longer shouting.
- **Mobile delta strip is a 3-col grid with shorter labels.** Switched from horizontal flex with vertical-rule separators to `grid grid-cols-3 gap-3` so values (`+12 / +84 / +143`) align at the same Y position. Labels changed from `today / this week / this month` to `today / week / month` — short enough not to wrap and the "this" is implied by the values being current deltas. `DeltaItem` is column-layout on mobile (value above label), row-layout on `lg:+` (inline baseline).
- **`GrowthPlusTierStrip` deleted.** Tier is already shown in the hero pill (`Active · Pro`) and the Billing card upgrade ribbon (`Upgrade to Elite for $99/mo — unlock Engaged-quality targeting`), so the strip was duplicating without new info. File removed; `grep TierStrip` returns zero hits.
- **Activity + Controls are 2-col on `lg:+`.** Inside `GrowthPlusActive`, the two sections are wrapped in `grid grid-cols-1 lg:grid-cols-2 lg:items-start` so they sit side-by-side on desktop and halve the page's vertical footprint between metrics and billing. Mobile keeps single-column stacking.
- **Boost-active toggle row: `items-start` → `items-center`.** Toggle now vertically aligns with the midpoint of the 2-line label instead of the first line. Single-token change.
- **Quality segment third option: `Top accounts` → `Engaged`.** Three single-word labels (Broad · Targeted · Engaged) read with parallel rhythm and fit on one line alongside the Lock icon on mobile. Underlying value key `'top'` is unchanged — only the user-visible label moves. Cross-references in `GrowthPlusBillingCard` and `GrowthPlusUpsell` were also updated to "Engaged-quality targeting" for consistency.

### Removed
- `src/pages/growthPlus/GrowthPlusTierStrip.jsx` (orphaned after the layout cleanup).
- The standalone benefits `<section>` from `GrowthPlusUpsell.jsx` (folded into the hero).

### Decisions (locked, don't revisit)
- **Upsell page benefits live inside the hero.** No separate benefits section. If a description-level explanation is ever needed, FAQ.
- **Active page hero is 2-col on desktop.** Deltas sit in the right column. Hero number is `text-3xl md:text-4xl` (not `text-5xl/6xl`). Anything else competes with the deltas + pill.
- **`TierStrip` is gone.** Tier is communicated via the hero pill + Billing card upgrade ribbon. If a future spec needs a more prominent tier badge, it goes in the hero, not as its own row.
- **Activity + Controls are 2-col on desktop.** Mobile stacks. Different heights are OK (`items-start`).
- **"Engaged" is the Quality option name.** Underlying value key `'top'` stays for gating logic — never rename the key.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-12-growth-plus-layout-design.md`
- Plan: `docs/superpowers/plans/2026-05-12-growth-plus-layout.md`
- Commits: 2612e93, 895f2c2, a96f9dc, ae7541c, 29c6075

---

## 2026-05-12 — Growth+ tiered pricing (Starter / Pro / Elite)

Growth+ becomes a 3-tier product. The blurred-preview + floating-subscribe-overlay pattern is replaced with a real marketing page (tier cards + benefits + FAQ). Subscribers see their tier reflected throughout the dashboard, with locked controls staying visible to make upgrade paths discoverable.

### Added
- **`mockGrowthPlusTiers`** in `src/mocks/growth.js` — single source of truth for tier metadata: `id`, `name`, `price`, `tagline`, `recommended`, `allowedSpeed`, `allowedQuality`, `monthlyBoosts`, `boostedPosts`, `reachLift`. Order matters (Starter < Pro < Elite) — the upgrade-next-tier nudge in the billing card relies on it.
- **`mockGrowthPlusTierById`** — convenience `Object.fromEntries` lookup; consumers use this instead of repeating `.find(t => t.id === ...)`.
- **`mockGrowthPlusInsights` is now per-tier** — keyed `{ starter, pro, elite }`. Each tier has its own `algorithmicBoost`, `postReachLift`, `engagementRate`, `boostedPosts`. Numbers ladder up: Starter 40/+12%/3.2%/4 → Pro 143/+34%/4.8%/12 → Elite 300/+68%/7.1%/30.
- **`mockGrowthPlusDeltas` is now per-tier** — same `{ today, week, month }` shape, three tiers. Month totals match the matching tier's `algorithmicBoost` to keep the page internally coherent.
- **`mockUser.growthPlusTier`** — `"starter" | "pro" | "elite" | null`. `null` when `growthPlusSubscribed === false`. `mockUserGrowthPlus` defaults to `"pro"` (preserves prior visuals).
- **`mockUserGrowthPlusStarter`** + **`mockUserGrowthPlusElite`** — variants for testing locked and unlocked states.
- **`config.growthPlusControls.tier`** in `mockGrowthConfig` — mirrors the user's tier on the config object so the store can answer gating questions without crossing into the user mock for every check.
- **`setGrowthPlusTier(tierId)` on `useGrowthConfig`** — updates tier and snaps `speed`/`quality` back to the highest still-allowed value when downgrading (no orphaned locked selections).
- **`GrowthPlusUpsell.jsx`** — new marketing page replacing the blurred-preview pattern:
  - Hero (Sparkles icon · gradient surface · "Boost your reach with Growth+")
  - 3-tier pricing grid (1-col mobile · 3-col `lg:`). Pro card flagged "Recommended" with a purple top-anchor pill + tinted gradient + `shadow-md`.
  - Each tier card lists 6 features with Check (included) or Lock (locked) icons.
  - "Start Starter / Pro / Elite" CTAs open `GrowthPlusSubscribeModal` with the chosen tier pre-selected; success calls `setGrowthPlusTier(pendingTier)` then `markSubscribed()`.
  - 3-up benefit grid (Sparkles · Network · ShieldCheck) below pricing.
  - 3-question FAQ accordion using `ChevronDown` rotation pattern.
- **`GrowthPlusTierStrip.jsx`** — new slim card between MetricsStrip and Activity. Single line at all breakpoints: `Crown` icon + "You're on **Pro** — Best for most growing accounts" + "Compare tiers" link. Identifies the active plan at-a-glance and gives users an always-visible upgrade path without crowding the page.

### Changed
- **Hero pill is tier-aware.** Now reads `Active · Pro` (or whichever tier). Added a status dot prefix (`h-1.5 w-1.5 rounded-full bg-green-base`) before the label to match modern SaaS subscription pills. Hero number + delta strip read from per-tier insights/deltas. `previewMode` prop dropped — its only consumer (the deleted `GrowthPlusLockedPreview`) is gone.
- **MetricsStrip reads per-tier insights.** Same three cards (reach lift / engagement / boosted posts), values now reflect the user's actual tier ceiling.
- **Controls card — locked segments visible.** Per the locked decision ("discovery > clean UI"): `Speed: Fast` shows with a `Lock` icon on Starter; `Quality: Targeted` shows locked on Starter; `Quality: Top accounts` shows locked on both Starter and Pro. Hover/focus reveals a tooltip "Available on **Pro**" or "Available on **Elite**" (the tooltip name picks the cheapest tier that unlocks it). Locked buttons set `disabled` + `aria-disabled` and never invoke `onChange`. Defensive belt-and-suspenders: `setGrowthPlusSpeed` and `setGrowthPlusQuality` on the store reject locked values silently, so a stale click can't poison state.
- **BillingCard is tier-aware** and gains an "Upgrade" nudge ribbon. Top row shows `Pro · $49.00 · Jun 6, 2026` style (tier name + price + date). When tier ≠ Elite, a tinted `bg-purple-tint/40` ribbon spans the card bottom: "Upgrade to **Elite** for $99/mo — unlock Top accounts targeting" with `ArrowUpRight` and `ChevronRight`. Links to `/growth-plus/upgrade` (a future route — for now hooks into the existing flow). When tier === Elite, the ribbon is omitted.
- **GrowthPlusActive section order** rewritten: Hero → Metrics → **TierStrip** → Activity → Controls → Billing. TierStrip slots between Metrics and Activity so users see "you're on Pro" before the activity proof surface.
- **Page entry `index.jsx`** now renders `<GrowthPlusUpsell />` (instead of the deleted `GrowthPlusLockedPreview`) when `subscribed === false`.
- **`GrowthPlusBanner.jsx`** (Overview + Growth pages) now reads per-tier insights so the "+143 extra followers" headline reflects the user's actual tier.

### Removed
- **`GrowthPlusLockedPreview.jsx`** — the blurred-dashboard + floating-card pattern. Replaced by the real `GrowthPlusUpsell` page.
- **`GrowthPlusSubscribeOverlay.jsx`** — its floating card is now redundant; the upsell page is the surface, and the existing `GrowthPlusSubscribeModal` (used by both signup and locked-state) still handles confirm/processing/success.
- **`previewMode` prop on Hero + Active** — no remaining consumer.

### Decisions (locked, don't revisit)
- **3 tiers: Starter $29 / Pro $49 / Elite $99.** Pro keeps the current $49 price (matches existing billing copy + subscribe modal), so existing flows remain accurate. Starter is the entry tier; Elite is the unlock-everything ceiling.
- **Gating split:**
  - Speed: Starter caps at Steady; Fast unlocks at Pro.
  - Quality: Starter caps at Broad; Targeted unlocks at Pro; Top accounts unlocks at Elite.
- **Default tier on `mockUserGrowthPlus` = Pro** so existing screens stay visually identical to pre-tier state.
- **Locked controls stay visible** with a Lock badge + "Available on X" tooltip. Discovery beats clean UI here — hiding controls means users never learn what upgrading buys.
- **The Pro tier carries the "Recommended" flag,** not Elite. Recommended is for "best for most users," not "highest revenue."
- **Tier downgrade snaps speed/quality back automatically** to the highest still-allowed value. Users never land on a locked selection.
- **Pricing data lives only in `mockGrowthPlusTiers`.** Billing card, upsell page, hero pill, and tier strip all read from there. Editing a price changes one line.

### Files touched
- `src/mocks/growth.js` — tier catalog + per-tier insights + per-tier deltas + `mockGrowthPlusTierById`
- `src/mocks/user.js` — `growthPlusTier` field + two tier variants
- `src/mocks/growthConfig.js` — `tier` on `growthPlusControls`
- `src/stores/useGrowthConfig.js` — `setGrowthPlusTier` + gated speed/quality setters
- `src/pages/growthPlus/GrowthPlusHero.jsx` — tier-aware pill, status dot, per-tier values
- `src/pages/growthPlus/GrowthPlusMetricsStrip.jsx` — per-tier values
- `src/pages/growthPlus/GrowthPlusControls.jsx` — Lock badges + tooltips on locked segments
- `src/pages/growthPlus/GrowthPlusBillingCard.jsx` — tier + upgrade ribbon
- `src/pages/growthPlus/GrowthPlusTierStrip.jsx` — **new**
- `src/pages/growthPlus/GrowthPlusUpsell.jsx` — **new**
- `src/pages/growthPlus/GrowthPlusActive.jsx` — section reorder, drop `previewMode`
- `src/pages/growthPlus/index.jsx` — Upsell wiring
- `src/components/GrowthPlusBanner.jsx` — per-tier reads
- **Deleted:** `GrowthPlusLockedPreview.jsx`, `GrowthPlusSubscribeOverlay.jsx`

### Commits
344b485 · f79972e · 4a18f78 · 367de98 · 440fefb · 37d4e6c · 9c4cac6 · 9f2c9f3

---

## 2026-05-12 — Growth+ page premium polish (round 2)

Second polish pass on the Growth+ page after a real review surfaced that the page still didn't feel premium. Seven targeted fixes across the existing files plus one new component. Tier work is queued as a separate spec — not in this pass. Locked-preview / upsell rework is also deferred to the tier spec since the real upsell page needs tier pricing data.

### Changed
- **Hero sparkline removed.** Cumulative count can only trend up, so the line carried no information. Replaced with a delta strip: `+12 today · +84 this week · +143 this month`. Numbers `text-base font-semibold text-purple-text`, labels `text-xs text-text-secondary`, separated by `h-3 w-px bg-purple-base/25` rules. Renders as a `<dl>` with `sr-only` `<dt>`s for screen readers. Drops the `recharts` + `mockGrowthDaily` imports from the hero.
- **Metric cards match Overview sizing.** Value bumped from `text-xl` flat to `text-xl lg:text-2xl`. Label bumped to `text-xs font-medium leading-tight` (was `text-xs font-medium`). Padding now `p-4 lg:p-6` matching `MetricCard` in `overview/index.jsx:387`. **Sub-line dropped entirely** — three cards each had a `text-[11px]` second line that mostly restated the label ("beyond your baseline reach", "active accounts that interact", "posts boosted this month"). Removing them removes noise and matches the rest of the dashboard, where metric cards are label + value only.
- **Activity icons render bare** (no `bg-purple-tint` chip). Matches the Overview activity-feed pattern (`overview/index.jsx:1290` — "Bare icon — no chip background — since rows aren't interactive"). Icon color now carries event type: `text-purple-text` for `post_boosted`, `text-green-text` for `followers_gained`. Row alignment switched from `items-center` to `items-start` so the icon top-aligns with the title via `mt-0.5`, same recipe as Overview.
- **Controls card now leads with a one-line "how it works"** instead of trailing the page. "Growth+ uses a network of active accounts to amplify your most recent posts. Boost activity is throttled to stay within Instagram's safety limits." Sits directly under the card title at `text-xs leading-relaxed text-text-secondary`. The orphaned `ShieldCheck` strip at the bottom of `GrowthPlusActive` is removed — it was disclaimer copy that no one read.
- **Per-segment notes moved above each segmented control.** Reading order is now `Speed → note → control`, not `Speed → control → note`. Explanation arrives before the choice so users know what they're picking. Spacing: `mt-1` between title and note, `mt-3` between note and control. Same recipe for Quality.
- **Billing extracted into its own component.** Was an inline `<div>` at the bottom of `GrowthPlusControls`; now `GrowthPlusBillingCard.jsx` — a standalone card with a `CreditCard`-icon chip, "Next billing" eyebrow, `$49.00 · Jun 6, 2026`-style price, and a proper ghost `Manage` button (`h-10 rounded-lg border bg-surface`) instead of the previous inline link. Slots between Controls and the end of the page.
- **Section order rewritten** in `GrowthPlusActive.jsx`: Hero → Metrics → Activity → Controls → Billing. No bottom safety strip.

### Added
- `GrowthPlusBillingCard.jsx` — standalone card for next-billing + Manage.
- `mockGrowthPlusDeltas` export in `src/mocks/growth.js` — `{ today, week, month }` values consumed by the hero delta strip.

### Removed
- `recharts` + `mockGrowthDaily` imports from `GrowthPlusHero.jsx` — sparkline gone.
- The `sub` field from `GrowthPlusMetricsStrip` `CARDS` array (three lines).
- Inline billing block from the bottom of `GrowthPlusControls.jsx` (moved to its own component).
- Bottom `ShieldCheck` "How Growth+ works" strip from `GrowthPlusActive.jsx` (folded into the Controls card intro).

### Decisions (locked, don't revisit)
- **No sparkline on cumulative metrics.** Any always-ascending value gets a delta strip instead. The sparkline was decorative, not informative.
- **Sub-lines on metric cards are not paying rent.** Restating the label in smaller text adds visual weight without information. If context is needed, use `InfoTooltip` on the card title (same pattern as elsewhere on the dashboard).
- **How-it-works belongs next to the controls,** not at the page foot. Once a user lands here, the question is "what do these levers do," not "what is Growth+." The intro sits where the answer is useful.
- **Per-option notes read before the control.** Selection notes that follow a control read as captions; placed above the control they read as a prompt. The prompt orientation matches how users learn the segments.
- **Billing is its own card.** Money lives separately from operational controls — one card per concern reads more premium and clears the path for the future `/account/growth-plus` management page.

### Queued for next spec (tiers)
- 3-tier model: **Starter / Pro / Elite**. Each tier delivers progressively more boost volume, gates higher-quality segments (`Top accounts`, `Fast` speed), and shows up in the hero pill + a new tier strip + the Billing card's upgrade nudge.
- Locked-preview blur → real marketing upsell page with tier pricing grid, benefit grid, FAQ. Sparkles + outcomes + three pricing cards.
- Locked controls show with a small lock badge + "Available on Elite"-style tooltip (decision: discovery > clean UI).

### Spec & plan
- (Polish-pass executed inline from in-session brainstorm — no separate spec doc this round.)
- Commits: bf5e8e7, a3eaaae, 1d9b6f4, 65e9088, 261583f, 0899629, 4e1e04d

---

## 2026-05-12 — Growth+ page polish pass

Fixes 7 QA issues found during a real review of the freshly-shipped Growth+ page. Six commits across five files. All issues from the QA report bundled as one short polish-pass spec.

### Changed
- **Hero pill is state-aware now.** Reads `useGrowthConfig.growthPlusControls.enabled`. When boost is on: green `Active` pill (unchanged). When boost is paused: muted `Paused` pill (`bg-bg text-text-secondary`). Hidden entirely when `previewMode` is true — non-subscribers no longer see a green "ACTIVE" pill peeking through the locked-preview blur.
- **Hero headline swaps when paused.** "extra followers from Growth+ this month" becomes "Boost paused — billing continues." The hero number stays — it's the historical earn count.
- **Page H1 + subtitle added.** "Growth+" / "Algorithmic reach on top of your Targeted Growth." Sits at the page level (outside the locked-preview wrapper) so non-subscribers see the page identity sharply. Matches the recipe used by Targeting / Engagement / Settings / Overview page titles.
- **Billing date is now dynamic.** Hardcoded "$49.00 on May 25" replaced with a date computed from new `mockGrowthPlusNextBillingAt` (5 days into a 30-day cycle from import time = ~25 days remaining). Renders "$49.00 on Jun 6, 2026"-style with year. Same import-time-anchored trick as `mockUser.trialEndsAt`.
- **"High-engagement" Quality segment renamed to "Top accounts."** Was wrapping to two lines on mobile inside the segmented control; now stays on one line at all viewports. Value key also changes from `'high-engagement'` to `'top'`. Tradeoff note unchanged.
- **Boosted posts metric icon: Sparkles → Megaphone.** Sparkles was used three places on the page (hero chip + Boosted posts metric + post-boosted activity rows). Megaphone frees up Sparkles for its primary brand role. Metrics strip icons are now distinct: TrendingUp / Heart / Megaphone.

### Added
- `mockGrowthPlusStartedAt` + `mockGrowthPlusNextBillingAt` exports in `src/mocks/user.js`. Both computed at import time, anchored to "5 days ago" + 30-day cycle. `mockGrowthPlusStartedAt` isn't consumed in this spec — it's there for the future `/account/growth-plus` real subscription-management page.

### Decisions (locked, don't revisit)
- **Hero pill state model**: only renders when `!previewMode`. Within that, the recipe is Active (green) vs Paused (muted). No third state. Red wasn't considered because pause isn't an error.
- **`mockGrowthPlusStartedAt` exists.** Even though no consumer uses it yet, exporting it now is cheaper than adding it later when the management page lands.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-12-growth-plus-polish-design.md`
- Plan: `docs/superpowers/plans/2026-05-12-growth-plus-polish.md`
- Commits: c4e0a69, 63e3dfb, 3d4c29f, caf47ac, 98c6cd9

---

## 2026-05-11 — Growth+ page

Built the dedicated `/growth-plus` page — the route had been in the nav since the 2026-05-07 navigation overhaul but was landing on a blank screen. 14 commits across mocks, stores, hooks, a shared modal extraction, and 9 new files under `src/pages/growthPlus/`. Visual treatment is deliberately premium so the page reads as the paid surface it represents.

### Created
- `src/pages/growthPlus/` — new page tree.
  - `index.jsx` — page entry; reads `useGrowthPlusSubscription` (falls back to `mockUser.growthPlusSubscribed`) and renders one of two states inline (no redirect).
  - `GrowthPlusActive.jsx` — subscriber dashboard composition root. Composes hero → metrics strip → activity → controls → cardless safety strip.
  - `GrowthPlusHero.jsx` — purple-gradient hero card with `Sparkles` chip + `GROWTH+` eyebrow + `Active` pill + animated count-up to `+143` + 60–80px Recharts sparkline.
  - `GrowthPlusMetricsStrip.jsx` — three supporting metric cards: `+34%` (post reach lift) · `4.8%` (engagement rate) · `12` (boosted posts).
  - `GrowthPlusActivity.jsx` — recent boost activity feed, default expanded, alternating `post_boosted` / `followers_gained` event types with relative timestamps.
  - `GrowthPlusControls.jsx` — pause toggle + Speed segmented control (`Slow/Steady/Fast`) + Quality segmented control (`Broad/Targeted/High-engagement`) + billing line with Manage link. Inline `CardToggle` and `SegmentedControl` helpers duplicated from existing Engagement-card recipe (not lifted).
  - `GrowthPlusSubscribeOverlay.jsx` — floating purple-gradient subscribe card; centered on desktop, pinned near top on mobile.
  - `GrowthPlusLockedPreview.jsx` — wraps `GrowthPlusActive` in `pointer-events-none opacity-60 blur-[2px]`, floats the overlay on top, owns the modal state machine.
- `src/components/GrowthPlusSubscribeModal.jsx` — shared confirm/processing/success modal, extracted from `signup/steps/GrowthPlus.jsx`. Owns the 1500ms processing timer; calls `onProcessingDone` so the parent can transition to `success` without duplicating timer logic. `successButtonLabel` prop lets callers customize the final CTA.
- `src/stores/useGrowthPlusSubscription.js` — V1 override flag (Zustand). Starts `null` (consumers fall back to `mockUser.growthPlusSubscribed`); `markSubscribed()` flips it to `true` so the page can transition from locked-preview → live dashboard inline after subscribe success.
- `src/hooks/useCountUp.js` — RAF-driven mount-only count-up hook with easeOutQuart easing. ~25 lines, no animation library.
- `src/mocks/growthPlusActivity.js` — 5 seed events with import-time relative timestamps.

### Changed
- **`src/App.jsx`** — registered `<Route path="/growth-plus" element={<GrowthPlusPage />}>` inside the `DashboardLayout` shell.
- **`src/mocks/growth.js`** — `mockGrowthDaily.growthPlusGain` switched from a flat `0` to a sine wave summing ~150 across 30 days (so the hero sparkline isn't flat). Added `boostedPosts: 12` to `mockGrowthPlusInsights`.
- **`src/mocks/growthConfig.js`** — added `growthPlusControls: { enabled: true, speed: 'steady', quality: 'targeted' }`.
- **`src/stores/useGrowthConfig.js`** — three new actions: `toggleGrowthPlusEnabled`, `setGrowthPlusSpeed`, `setGrowthPlusQuality`. All fire the existing debounced `announceSaved()` toast like every other action in this store.
- **`src/pages/signup/steps/GrowthPlus.jsx`** — inline confirm/processing/success modal replaced with the shared `<GrowthPlusSubscribeModal>` import. `handleConfirmPayment` lost its inline `setTimeout`; the modal owns the timer. Signup-step end-to-end flow verified post-extraction.

### Decisions (locked, don't revisit)
- **Two states on the same route, no redirect.** Non-subscriber sees the same dashboard blurred behind a floating subscribe overlay. The page is its own value prop — subscribers and non-subscribers see the same shape.
- **The subscribe modal is shared.** Both `/signup/growth-plus` (onboarding) and `/growth-plus` (the locked-preview overlay) route through `<GrowthPlusSubscribeModal>`. Future "add Growth+" affordances should reuse it.
- **Active-account scope.** The page binds to the currently-selected IG account in `AccountSwitcher`, matching the rest of the dashboard. V1 mocks don't vary per account; production wires per-subscription data through the `account` prop.
- **Premium-page visual treatment.** Single big hero stat with count-up animation + sparkline. Sparkles iconography. Purple gradient surface. Cardless transparency block at the bottom — explicitly NOT a card, deliberately framed as transparency, not disclaimer.
- **`blur-[2px]` is the right value.** Tailwind's preset `blur-sm` (4px) is too aggressive for a teaser blur — the preview needs to be readable enough that users see what they'd get.
- **`CollapsibleRecents` pattern not reused.** The Recent boost activity feed defaults expanded because it's the page's emotional centerpiece; Engagement-card recents collapse because they're secondary detail. Different roles, different defaults — intentional.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-11-growth-plus-page-design.md`
- Plan: `docs/superpowers/plans/2026-05-11-growth-plus-page.md`
- Commits: 6fee518, 1e3c68f, 7382c6b, 3ba3ed1, daaa99d, 70c6795, 382679b, 36dceb1, 474f7fa, 64c5a3e, 2710384, a8d0f27, d0027d7, 6a55a95

---

## 2026-05-08 — Nav server-change

Fifth and final spec from the 2026-05-08 brainstorm. Three commits: server affordance moves into the AccountSwitcher panel, the per-subscription detail page keeps a read-only fact, the orphaned `ServerCard.jsx` is deleted.

### Changed
- **AccountSwitcher panel gains a "Server: \<Label\>" row** inside the active-account block, immediately below the active account row and before the divider to other accounts. Globe icon in a `bg-blue-tint` circle on the left, label + region in a stack, `ChevronRight` on the right. Tapping the row dismisses the panel and opens the existing `ChangeServerModal`. Renders in BOTH variants (desktop dropdown + mobile sheet) via the shared `PanelContent` helper, with comfy density on the sheet (`h-8 w-8` icon circle) and compact density on the dropdown (`h-7 w-7`).
- **`AccountSwitcher` now reads `useSubscriptions`** to resolve the active account's subscription via `subscriptions.find((s) => s.accountId === active.id)`, then resolves the server via `findServer(subscription.server)`. Modal-open state lives at the parent level (`serverModalOpen`); `<ChangeServerModal>` is rendered via `createPortal(..., document.body)` so it escapes any transformed-ancestor containing block — same approach the sheet variant uses.
- **`SubscriptionDetail` drops the editable `<ServerCard>`** in favor of a one-line read-only fact: `Server: <Label> · <Region>` (`text-xs text-text-secondary` styling, no card chrome). Sits between the Plan card and the Invoices section. Single edit path; the detail page surfaces the server as reference info only.

### Removed
- `src/pages/account/ServerCard.jsx` — orphaned after the SubscriptionDetail change. No remaining consumers in the codebase.

### Decisions (locked, don't revisit)
- **Server is per-subscription, edited from AccountSwitcher.** The visual association ("this server belongs to this account") only works because the row sits inside the active-account block. Moving the row elsewhere (panel bottom, separate section) would weaken the connection.
- **No server in the closed-trigger row of AccountSwitcher.** The trigger is a "switch accounts" affordance; adding the server detail makes it noisier and competes with the account info. Server is a setting, not an identifier.
- **The detail page stays read-only for server.** Single edit affordance keeps the mental model clean — duplicate edit paths invite divergence.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-08-nav-server-change-design.md`
- Plan: `docs/superpowers/plans/2026-05-08-nav-server-change.md`
- Commits: 0f513ba, 4e22901, 706f2d6

---

## 2026-05-08 — Billing structure

Fourth of five specs from the 2026-05-08 brainstorm. Three commits across `PaymentMethodsCard.jsx` and `BillingPanel.jsx`. All three Billing sections (Payment method, Subscriptions, Billing history) now share an identical shape and behave consistently on both viewports. Resolves the deferred polish-pass "no weight at the top" complaint (#15) without resorting to outer card wrappers.

### Changed
- **`PaymentMethodsCard` is flattened.** Outer `rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6` wrapper is replaced with a plain `flex flex-col gap-2 md:gap-3`. The chip+title+tooltip+Add-card row becomes a section header (no enclosing card). The `<ul>` of CardRow children loses its `mt-4`; the wrapper's gap applies the spacing. Each `CardRow <li>` already has its own border so the rows continue to read as card-style children.
- **Subscriptions section header gains an "Add subscription" `<Link>`** routed to `/signup/ig-preview` — same destination as `AccountSwitcher`'s "Add account," because adding a subscription = connecting a new IG account. Recipe matches Payment method's "Add card" button exactly: `inline-flex h-10 ... rounded-lg border bg-surface`, Plus icon, label visible at `sm:+` and icon-only at `<sm:`.
- **Subscriptions empty-state copy** when `subs.length === 0`: `No subscriptions yet — connect your first Instagram account to get started.` Replaces the previous silent empty render.
- **Mobile per-section gap is `gap-2 md:gap-3`** across all three sections. Header sits ~8px above first child card on mobile, ~12px on `md:+`. Anchors each section header without needing card chrome.

### Decisions (locked, don't revisit)
- **All three Billing sections share the same shape.** Section header (chip + title + count? + tooltip + action?) above, card-style children below, no enclosing card. Path A from the brainstorm; Path B (wrap Subscriptions/Billing-history in cards) was explicitly rejected because it creates "card containing cards" nesting.
- **Add subscription is in the section header, not as a full-width row at the bottom.** Single discovery affordance; mirrors Payment method's existing pattern.
- **Billing history header has no count pill.** Read-only section; gap-tightening alone restores parity with the other section headers. (Polish-pass folded #15 → "tighten gap, don't add count.")
- **`<Link>` from `react-router-dom`, not a `<button>` calling `navigate()`.** Lets cmd-click / middle-click open in a new tab, the way users expect for navigation affordances.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-08-billing-structure-design.md`
- Plan: `docs/superpowers/plans/2026-05-08-billing-structure.md`
- Commits: bccac12, 53e3f1b, e23c3b7

---

## 2026-05-08 — Engagement collapse

Third of five specs from the 2026-05-08 brainstorm. Three commits across `WelcomeDmPreview.jsx`, `WelcomeDmCard.jsx`, and `CloseFriendsCard.jsx`.

### Changed
- **Welcome DM bubble has a Pencil edit icon** (`text-text-secondary`, top-right corner). The whole bubble + the icon both still open the edit modal — the icon is a visual marker, not the only target. The "Click the bubble to edit" / "Edit becomes available when on" helper paragraph below the bubble is removed; the icon makes the affordance self-explanatory.
- **Both engagement cards' "Recent" activity sections are collapsible (default closed)**. New inline `CollapsibleRecents({ title, children })` helper added to each card file (intentionally duplicated rather than lifted to a shared module — ~15 lines × 2 not worth its own file). Header is the existing eyebrow recipe (`text-[11px] uppercase tracking-wide text-text-muted`) with a `ChevronDown` on the right that rotates 180° when expanded. No height animation; just toggle visibility (consistent with dashboard restraint).
  - `WelcomeDmCard` → `RecentDmsSubsection` wrapped via `CollapsibleRecents title="Recent DMs sent"`.
  - `CloseFriendsCard` → `CloseFriendsState` wrapped via `CollapsibleRecents title="Recent"`.

### Decisions (locked, don't revisit)
- **`CollapsibleRecents` is duplicated inline per card.** Not lifted to a shared component. If a tweak is ever needed (typo, class fix), apply it in BOTH files in a single follow-up.
- **No count badge in the disclosure header.** Just the label + chevron. Rejected during brainstorm.
- **No height animation on expand/collapse.** Visibility toggle only.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-08-engagement-collapse-design.md`
- Plan: `docs/superpowers/plans/2026-05-08-engagement-collapse.md`
- Commits: d35fc6a, 8d5e746, ebcbd03

---

## 2026-05-08 — Add Target popup redesign

Second of five specs from the 2026-05-08 brainstorm. Six commits, single-file refactor of `src/pages/targeting/AddTargetSheet.jsx` plus mock-data flag additions.

### Changed
- **Suggestions are a horizontal scroller** (was 2-col grid of card-buttons). Each chip is 88px wide, vertical-stack: 40×40 avatar on top, `@handle` middle, count subline below. ~3 chips visible on mobile, ~5–6 on desktop. Snap-x proximity for chip-boundary settle. Hidden scrollbar (`[&::-webkit-scrollbar]:hidden` + `scrollbarWidth: 'none'`). The `-mx-4 px-4` trick lets the row extend full-width past the body padding without the first/last chip sitting flush.
- **Account/Hashtag toggle moves to the LEFT of the input** and the inline `@`/`#` prefix span inside the input is removed. The toggle's active icon now serves as the prefix; placeholder is plain `username` or `hashtag` with no symbol. Input still strips `^[@#]` defensively on paste so users pasting `@fitness.inspo` resolve correctly.
- **Picking a match collapses the toggle+input row into a locked pill** (`SelectedSourcePill` — inline helper at the bottom of `AddTargetSheet.jsx`). Pill anatomy: avatar + handle + count subline + clear-X. Tapping the X clears `pickedMatch` + `input` + `matches` and restores focus to the input. The previous "preview card" below the input (with its HealthPill) is dropped — the pill carries that information now. State is unambiguous: pill = picked, input = not picked. Solves the silent-deselect-on-typing trap.
- **Inline yellow warning** above the suggestions when the picked account has `private` and/or `verified` flags. Three message variants (private only, verified only, both). Hashtag mode never shows this warning. Doesn't block submit — informational only. Uses `AlertTriangle` icon + `bg-yellow-tint text-yellow-text` recipe. New helper: `buildLimitedTargetingMessage(match)` returning the message string or `null`.
- **Inline red duplicate warning** above the limited-targeting warning when the picked match is already a target. Replaces the previous helper-text approach (which was unreachable after the pill replaced the input row). For paused duplicates, includes an inline `Resume it` link that calls the existing `handleResumeDuplicate`. Add target button stays disabled (existing `canSubmit = pickedMatch && !duplicate` logic).

### Mock data (additions)
- `src/mocks/suggestedTargets.js`: `@fitfluencer` is `verified: true`; `@trainhard.daily` is `private: true`. Other entries flag-free.
- `src/mocks/targetSearch.js` ACCOUNTS: `@gym.goals` and `@plantpowered` `verified: true`; `@cardio.crew` `private: true`; `@lift.and.lunge` both `private: true, verified: true` (exercises the combined-message branch).

### Decisions (locked, don't revisit)
- **Pill replaces input row when picked** — the canonical "selected source" treatment for this popup. State must be unambiguous (pill xor input row, never both). When/if Whitelist + Blacklist popups get a similar polish pass, they should adopt the same pattern.
- **Toggle-as-prefix recipe** — when an input has a small categorical mode picker, the picker can replace inline prefix glyphs (e.g. `@`, `#`, country code). The picker's active icon is the visual prefix.
- **Limited-targeting warning is informational, not blocking.** Even verified + private accounts can be added — the user has been told what to expect.
- **Two-warning slot order**: red duplicate (top) → yellow limited-targeting (below) → suggestions scroller. Both warnings can stack if a single match is somehow both a duplicate AND flagged (none in current mocks, but the layout supports it).

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-08-add-target-popup-design.md`
- Plan: `docs/superpowers/plans/2026-05-08-add-target-popup.md`
- Commits: 3f1c220, 7dab071, 1750007, c32f206, 1aa10f2, 49388f4

---

## 2026-05-08 — Polish pass

A batched commit set of seven small fixes confirmed in brainstorming on 2026-05-08 — first of five planned specs (Polish pass + Add Target popup + Engagement collapse + Billing structure + Nav server-change). All trivial mechanical changes; one commit per task.

### Changed
- **Account avatars now use Pravatar everywhere** (`src/mocks/targets.js`, `src/mocks/accounts.js`). Seven account-type targets (`@fitness.inspo`, `@yoga.daily`, `@cleanfoodcrush`, `@protein.pete`, `@macro.melissa`, `@keto.kevin`, `@stale.influencer`) and all three connected accounts now carry `https://i.pravatar.cc/80?u=<username>` URLs. Hashtag targets keep the `Hash` icon. Pravatar is third-party and only used in V1 mocks.
- **Targeting list — Follow-back column header**: dropped the `· %` suffix (the numbers below already carry count·rate format) and changed `pr-12` to `pr-9` on `<span>Follow-backs</span>` so the header's right edge aligns with the right edge of the number column. Verified delta = 0px at desktop (1280) and mobile (375).
- **Whitelist + Blacklist modals — input top spacing**: dropped the `mt-4` above the input row in both modals so the input sits flush below the modal header, matching `AddTargetSheet`'s recipe.
- **Close Friends Adder — copy**: subtitle, tooltip, and Add-mode label rewritten to accurately describe the engine's behavior.
  - Subtitle: "Add followers to Close Friends; remove ex-followers."
  - Tooltip: "Adds your followers to your Close Friends list, and removes anyone who unfollows."
  - Add-mode button label: "Add followers" (was "Add new followers"). Remove-mode unchanged.
- **Close Friends Adder — drop count line**: the `Currently {count} in close friends` `<p>` (with its Star prefix) is removed from the inner `CloseFriendsState` helper. The `Recent` activity list is now the first child of the section. The `count` destructure on `mockCloseFriendsState` is dropped; `Star` import stays (still used in the card-header chip).
- **CFA progress activity line**: leading mode-icon added next to the "Adding @…" / "Removing @…" line below the progress bar. Green `Plus` (`text-green-text`) when mode is `add`, muted `Minus` (`text-text-muted`) when mode is `remove`. Tightens `gap-2` → `gap-1.5` so the icon reads as a leading bullet, not a separate column.
- **Billing — Download invoice icon**: `text-blue-text` → `text-text-secondary hover:text-text-primary`. Locks the polish-pass icon-role rule for passive row actions (download, more-options, etc.) — passive utilities are muted, primary actions stay tinted.

### Decisions (locked, don't revisit)
- **Pravatar (`https://i.pravatar.cc/80?u=<username>`)** is the deterministic mock-avatar source for V1. Seed = the IG handle (without `@`). Production swaps in real IG profile pics — same field, different source.
- **Polish-pass icon-role rules**:
  - **CardChip color** — semantic per section. Stable across the dashboard once chosen.
  - **Row-action icons** (passive: download, more-options) — `text-text-secondary` with hover→`text-text-primary`. No more blue download.
  - **Status dots** — `bg-{color}-base` per state. Already correct everywhere; no further changes.
  - **Destructive row actions** (X-on-row) — `text-text-secondary` hover→`text-red-text`.
  - **Constructive primary actions** (Plus on standalone "Add" rows) — `text-blue-text` on `bg-blue-tint` background.

### Notes
- Issue #15 from the brainstorm ("mobile billing-history vertical spacing — no weight at the top") was deferred from polish pass to the upcoming Billing-structure spec — the root cause is structural (Subscriptions and Billing-history sections lack a card wrapper that Payment methods has), not a spacing tweak. Folding into the same spec means one fix instead of a band-aid plus a follow-up.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-08-polish-pass-design.md`
- Plan: `docs/superpowers/plans/2026-05-08-polish-pass.md`
- Commits: a556fb9, 3e19ad0, 7b0bd2e, 66cfecb, 86975ab, a9812a5

---

## 2026-05-07 — Navigation overhaul

A multi-step refactor to make desktop sidebar and mobile drawer agree on a single nav hierarchy, plus a stack of bug fixes flagged during the navigation review.

### Created
- `src/components/AccountSwitcher.jsx` — extracted from `DashboardLayout.jsx`. Single trigger row + panel implementation reused on both surfaces.
  - `variant="dropdown"` (default) — desktop sidebar. Absolute panel below the trigger.
  - `variant="sheet"` — mobile drawer. Fixed bottom sheet rendered via `createPortal(..., document.body)` to escape the drawer's transform-induced containing block. Slide-up animation via the `mounted + 2× rAF` pattern. Z-[60] keeps it above the drawer (z-50).
  - `density` prop on the shared `PanelContent` helper (`'compact'` default, `'comfy'` for the sheet) so the sheet has generous `gap-3 px-3 py-3` rows vs. the dropdown's `gap-2 px-2 py-2`.
  - Optional `onAccountSwitched` callback fires when the user picks a different account — drawer wires this to `closeDrawer()`.
- `src/stores/useNavDrawer.js` — Zustand store lifting the mobile drawer's open state out of `MobileNavDrawer`'s local component state. Lets `NotificationBell` call `closeDrawer()` before opening its own panel.

### Changed — navigation structure
- **Primary nav** is now `Overview / Targeting / Engagement / Growth+`. Identical set on both surfaces.
- **Settings** is no longer in the primary nav. It moved to the **bottom zone** of both surfaces (desktop sidebar `SidebarBottomZone`, mobile drawer bottom group). Active state still lights up on `/account/*`.
- **Mobile bottom tab bar** is now `Overview / Targeting / Engagement / Settings` (4 tabs, all `flex-1`). Growth+ is drawer-only on mobile. The previous `pr-[72px]` Intercom reservation is dropped — V1 doesn't ship Intercom; the bar fills the full viewport width.
- **Desktop sidebar** drops the `ProfileDropdown` row entirely (file deleted). Bottom zone is now `Settings · Theme toggle · Collapse · Log out` (DEV builds also get the signup-flow shortcut, gated by `import.meta.env.DEV`).
- **Mobile drawer** structure mirrors desktop:
  - Top: Kicksta wordmark + close X (was identity card with avatar/name/email).
  - Section: Instagram accounts (the new `AccountSwitcher` with `variant="sheet"`).
  - Section: Pages (Overview / Targeting / Engagement / Growth+).
  - Bottom: Settings + Theme toggle + Log out.
  - Removed: the per-panel "Account" section (Account details, Plan & billing) — Settings covers them.

### Changed — `/account` (Settings) page
- Mobile header rebuilt to match the Targeting page layout exactly — H1 "Settings" + subtitle on the left, pill switcher pinned upper-right (sm+) and stacked below on smaller viewports.
- Drops the per-panel title swap (page used to read "Profile" or "Billing" depending on the active panel; now always reads "Settings").
- `SettingsTabs.jsx` rebuilt to mirror the Targeting page's pill recipe: compact intrinsic-width pill, `bg-bg + border-border` container, active state `bg-text-primary text-bg shadow-sm`. Adds `User` / `CreditCard` icons next to each label.

### Changed — bug fixes from the nav review
- **`ProfileDropdown.jsx` deleted**. The "Alex Johnson + email" identity card on both surfaces is gone — profile info lives in Settings.
- **`AccountRow` a11y** in `AccountSwitcher` (formerly in `MobileNavDrawer`'s inline list): rows render as `<div aria-current="true">` when display-only and `<button aria-label="Switch to @username">` when interactive. Replaces the previous `<button><div>…</div></button>` nesting.
- **NotificationBell unreachable while drawer is open**: mobile top header bumped `z-20 → z-50` (drawer panel is z-50, drawer backdrop is z-40 — the bell stays clickable now). Tapping the bell calls `closeDrawer()` first, then toggles the notification panel.
- **DEV-only Signup-flow link** removed from desktop sidebar bottom. The Add account affordance inside `AccountSwitcher` now routes to `/signup/ig-preview` (was `/signup/connect-instagram`) — first step of the signup/onboarding flow. Single entry point.

### Notes
- **Active-state recipe trio still holds**:
  - `bg-blue-tint text-blue-text` → sidebar / "current view" nav.
  - `bg-blue-base text-white` → primary CTAs.
  - `bg-text-primary text-bg` → page-level view switchers / dark-fill emphasis.
- **Avatar identity ambiguity (#22 from the nav review)** is still open — IG account avatars and Kicksta-user avatars still look similar. Removing the user-identity card on both surfaces partially mitigates this (the only avatars left are IG-account avatars), but if Kicksta user avatars come back later, they need a distinct shape.

### Removed
- `src/components/ProfileDropdown.jsx`
- DEV-only "Signup flow" link from `DashboardLayout`'s `SidebarBottomZone`
- Inline `AccountSwitcher` definition in `DashboardLayout.jsx` (replaced by import)
- Inline `AccountSwitcherList` / `AccountRow` / `Avatar` / `DrawerLink` helpers in `MobileNavDrawer.jsx` (replaced by `AccountSwitcher` import)
- Drawer's "Account" section (Account details, Plan & billing rows)
- Drawer's identity header (avatar + name + email)
- `pr-[72px]` Intercom offset on mobile bottom tab bar

---

## 2026-05-06 → 2026-05-07 — Targeting page restructure (round 3)

Multi-day iteration on the Targeting page header, switcher, and Targets toolbar. Many intermediate states were tried and discarded — the entries below describe the final landed state, not the journey.

### Changed
- **Page header layout**: H1 + subtitle now stack on the left, page-level pill switcher pinned to the upper-right (sm+). Stacks on mobile with the switcher dropping below the subtitle, still left-aligned and intrinsic-width.
- **Page switcher**: compact intrinsic-width pill (`inline-flex bg-bg border border-border rounded-full p-1`), `h-9` tabs with icon + label. Active state uses **`bg-text-primary text-bg shadow-sm`** — a third active-state recipe distinct from sidebar nav (`bg-blue-tint`) and primary CTAs (`bg-blue-base`), reserving the dark-fill for page-level view switchers. Page subtitle is constant (no per-tab swap).
- **`TargetsHeroCard`**: redesigned as a hero toolbar with a 4px `border-l-blue-base` left accent. Layout is `[Audience sources] [12/30 pill]` on one row, 14px subtitle below ("Accounts and hashtags Kicksta follows to grow your audience."), Add target CTA pinned right. Title deliberately avoids the word "Targets" (already in the active tab). No chip — eliminated the icon-repetition with the switcher's Crosshair.
- **`AddTargetSheet`**: account/hashtag switcher restructured into an icon-only segmented control sitting **to the right of the input** on the same row. 40×40 buttons inside `h-12 rounded-lg border border-border bg-bg p-1`, active state matches the page switcher (`bg-text-primary text-bg`). The "Username" / "Hashtag" label above the input was dropped — the active switcher icon and the input prefix (`@`/`#`) communicate type; an `aria-label` on the input preserves the accessible name.
- **`AddTargetSheet` body padding**: trimmed from `py-5` to `py-4` to remove dead space above the input.
- **`TargetRow` processing state**: dropped the `bg-green-tint/30` row fill that was added in the previous round — too loud for the dashboard's restraint. The pulsing `Following…` pill is the only signal now.

### Notes
- Active-state recipes are now formalized at three tiers: `bg-blue-tint` (sidebar / "current view" nav), `bg-blue-base` (primary CTAs), `bg-text-primary` (page-level switchers / dark-fill emphasis). Document this in CLAUDE.md if it isn't already.

---

## 2026-05-05 — Targeting page-level polish

### Changed
- **Targeting page tab strip**: replaced the heavy pill switcher with a connected-tab pattern. Container has a baseline border running across; the active tab fills `bg-surface`, carries top + side borders, and uses `-mb-px border-b-surface` to overlap the baseline so it visually attaches to the content surface below. Each tab stacks `Label` + descriptor sub-line on desktop; mobile drops the sub-line to keep buttons compact.
- **Settings tab**: cards grouped under three section headings — `Engine` (Mode), `Audience` (Audience filters), `Lists` (Whitelist + Blacklist). Wrapping `<section>` blocks with a uniform `gap-6` rhythm replace the loose `gap-4` card stack so the tab reads as related groups instead of a junk drawer.
- **`TargetRow` processing state**: the row whose target is currently being processed gets `bg-green-tint/30` (deepens to `/50` on hover/focus). The pulsing pill alone was easy to miss when scanning a long list.
- **AddTargetSheet suggestions**: replaced the wrap-flex of tiny chips with a 1/2-col grid of bordered rows showing avatar + handle + count subline (followers / posts). Same suggestion data; same picker behavior — just more signal per chip.
- **AddTargetSheet vertical rhythm**: body padding `py-4` → `py-5`; standardized section gaps (`mt-5` between pill and input, `mt-4` between input and preview, `mt-6` before Suggestions).

---

## 2026-05-05 — Targeting + engagement polish (round 2)

### Changed
- **Targeting page tabs + AddTargetSheet toggle**: replaced the underlined tab-bar with a heavy pill switcher. `h-12` rounded-full container, active state uses the sidebar nav recipe (`bg-blue-tint text-blue-text shadow-sm`).
- **All four modals** (`AddTargetSheet`, `WhitelistModal`, `BlacklistModal`, `AudienceFiltersModal`): header outer container changed from `items-start` to `items-center` so the chip vertically aligns with the title+subtitle stack.
- **AddTargetSheet subtitle**: shortened to "Pick an account or hashtag to follow." (was 2 lines on narrow viewports).
- **AudienceFiltersModal**: gained a subtitle ("Tune who Kicksta is allowed to follow.") for consistency with the other three modals.
- **`TargetsHeroCard`**: chip and "Targets 12/30" share one row now; subtitle drops below. Previously the chip aligned with a two-line stack.
- **`AudienceFiltersCard`**: dropped the bottom hairline above the audience-reach estimate. The lg+ vertical divider between the two columns is enough.
- **`WhitelistCard` / `BlacklistCard`**: row padding `py-1.5` → `py-2` (matches the Recent DMs row spacing on `/engagement`).
- **`WelcomeDmCard` + `CloseFriendsCard`**: dropped the standalone SettingSwitch row (it duplicated the header). Toggle moved to the upper-right of the card; subtitle now sits under the H2 (mirrors the modal header pattern).
- **Close Friends segmented control**: each button leads with a `Plus` (add) or `Minus` (remove) icon so the active mode reads at a glance.

---

## 2026-05-05 — Engagement enrichment

### Created
- `src/pages/engagement/EngagementStatsCard.jsx` — stats hero card with three tiles (DMs sent / DM open rate / Close Friends), each showing the current value and a ↑/↓ delta vs last week.
- `src/mocks/engagementStats.js` — static aggregate metrics for the hero.
- `src/mocks/welcomeDmHistory.js` — recent welcome DMs list.
- `src/mocks/closeFriendsState.js` — current Close Friends count + add/remove activity log.

### Changed
- **`/engagement` page**: stats hero card now mounts as the first child of the card stack — page no longer reads as "two cards floating on whitespace."
- **`WelcomeDmCard`**: when the toggle is on (Advanced plan), the card now renders a "RECENT DMS SENT" subsection below the existing chat bubble — up to 5 rows showing recipient handle + relative time. Hidden when the toggle is off or on Growth.
- **`CloseFriendsCard`**: when the toggle is on (Advanced), the card now renders a current-count line ("Currently 23 in close friends") and a "RECENT" sublist showing mixed add (`+`, green) and remove (`–`, gray) events. Hidden when the toggle is off or on Growth.

---

## 2026-05-05 — Targeting refresh

### Changed
- **Page tab strip + AddTargetSheet toggle**: replaced the rounded-pill segmented controls with an underlined tab-bar (icon + label, blue underline on the active tab). Page subtitle swaps per-tab — Targets reads "The accounts and hashtags Kicksta is following from."; Settings reads "How Kicksta picks who to follow."
- **`AudienceFiltersCard`**: at `lg:` the two internal sections (`Audience size`, `Account type`) split into a 2-column grid with a vertical hairline divider. Mobile stacks unchanged.
- **`ModeCard`**: the Like-after-follow row disables when saved mode is `unfollow_only` (no follows means no follow-related likes). Description swaps to "Disabled — Kicksta isn't following anyone in this mode."
- **`SettingSwitch`**: new `disabled` prop independent of `locked`. Renders the row at `opacity-60`, applies a real HTML `disabled` attribute to the switch button, and ignores clicks. Used by ModeCard's like-after-follow row.
- **`TargetRow`**: the processing row's pill text changes from `ACTIVE` → `FOLLOWING…` (typographic ellipsis) so the live signal describes the action, not just the state. Mobile dot's `aria-label` swaps in lockstep.
- **`BlacklistModal`**: chip reverts from yellow to neutral (gray) to match the page-level `BlacklistCard`. Empty-state circle reverts to `bg-bg text-text-secondary`.
- **All three modal headers**: helper text moved out of the body and into the header as a subtitle below the H2. Close buttons standardized at `h-9 w-9`.

---

## 2026-05-05 — Targeting modals visual identity

### Changed
- **`AddTargetSheet`**: header now leads with a blue `<CardChip color="blue" icon={Crosshair} />` so the modal has a recognizable identity anchor. Suggestion chips in account mode render real `profilePic` images (with letter fallback) and a 1px ring, so the chip reads as an avatar rather than a flat tile.
- **`BlacklistModal`**: chip swapped from `color="neutral"` to `color="yellow"` (`Ban` icon unchanged). Caution-tone identity that doesn't false-alarm the red error palette.
- **Empty states**: `WhitelistModal` and `BlacklistModal` now render a centered icon-block (56px tinted circle + headline + subline) when the list is empty. Replaces the bare-text "No accounts … yet." line.

### Mocks
- `src/mocks/suggestedTargets.js` — first 3 entries get pravatar URLs so the avatar branch is visible in dev; last 2 stay null so the fallback branch is exercised.

---

## 2026-05-05 — Targeting popup polish

### Changed
- **`TargetRow`**: the active target whose id matches `useTargetsStore.processingId` now renders a pulsing ring around its desktop status pill and an `animate-ping` halo around its mobile status dot. Surfaces the engine's current focus without crowding existing chrome.
- **`TargetDetailDrawer`**: new "RECENT ACTIVITY" section between stat chips and action buttons. Up to 5 rows per target, icon-encoded (UserPlus = follow-back, Target = follow), pulled from the new `mocks/targetInteractions.js`.
- **`TargetDetailDrawer` action buttons**: demoted to a graduated hierarchy. Pause / Resume / Restore → ghost-bordered. Remove → text-only. All keep the 48px tap target.
- **`TargetsHeroCard`**: `rounded-b-xl` → `rounded-xl` so all four corners match.

### Created
- `src/utils/formatRelativeTime.js` — extracted from `src/pages/overview/index.jsx`, reused by Overview and Targeting.
- `src/mocks/targetInteractions.js` — per-target interaction history feeding the drawer's recent-activity list.

### Store
- `useTargetsStore.processingId` — V1 mock field. Initial value: id of the first `active` target. No setter (real engine wiring will replace).

---

## 2026-05-04 — Overview small fixes

### Changed
- **Overview H1**: added a `How your account is growing.` subtitle directly under the greeting. Header row now stacks H1 + subtitle on the left, period switcher / trial pill on the right.
- **Activity feed (mobile)**: capped the card at `max-h-[420px]` so a long event history scrolls inside the card (~5 rows visible) rather than pushing the page. Desktop layout is unchanged — the card still stretches to the chart's height on lg+.

---

## 2026-05-04 — Settings mobile shell + billing history cards

### Changed
- **Mobile `/account/*` shell**: removed the "menu screen" pattern. `/account` now redirects to `/account/profile` on every viewport. Each settings panel renders with a segmented strip pinned just under the H1 (Profile · Billing). The mobile back-arrow header is gone — the strip switches panels in place.
- **Billing history (mobile)**: each invoice is now its own bordered card with its own shadow (rather than rows inside a single shell). The list is wrapped in a `max-h-[480px] overflow-y-auto` container so long histories scroll inside the card without pushing the page.

### Created
- `src/pages/account/SettingsTabs.jsx` — mobile-only segmented strip for the settings shell.

---

## 2026-05-04 — Navigation cleanup (dedupe single sources)

### Changed
- **Log out**: removed the standalone Log out button from the bottom of the desktop sidebar. ProfileDropdown is now the single source for sign-out on desktop (mobile keeps it in the drawer).
- **IG connection status**: removed the informational "Instagram — @handle / Disconnected" row from ProfileDropdown. The sidebar AccountSwitcher's per-account status dot is the single source for connection state.
- **Add account / Add subscription**: removed the "Add subscription" button + `AddSubscriptionModal` from `/account/billing`. The sidebar AccountSwitcher (and the mobile drawer's account list) is now the single path for connecting a new Instagram account; subscriptions are read-only on the billing panel.

### Removed
- `src/pages/account/AddSubscriptionModal.jsx`.

---

## 2026-04-30 — Targeting / Engagement split

### Changed
- **`/growth` → `/engagement`** with 301 redirect. Engagement page is single-column with two cards (Welcome DM + Close Friends) plus the parked GrowthPlusBanner at the bottom.
- **`/targets` → `/targeting`** with 301 redirect. Targeting page now hosts a `Targets` (default) / `Settings` tab strip via `?tab=settings` search param.
- **EngagementCard split** into `WelcomeDmCard.jsx` + `CloseFriendsCard.jsx`. Like-after-follow row absorbed into `ModeCard.jsx` as a follow-time action.
- **`FiltersCard` + `FiltersModal`** renamed to **`AudienceFiltersCard` + `AudienceFiltersModal`** to disambiguate from the `FilterRow` Active/Archived bucket pills on the Targets tab.
- **Sidebar / mobile bottom tab / hamburger drawer** label updated: `Growth` → `Engagement`. `Targeting` label unchanged; route updated.

### Created
- `src/pages/targeting/TargetsTab.jsx` — extracted operational view (hero + filter row + list + modals).
- `src/pages/targeting/SettingsTab.jsx` — Mode + Audience filters + Whitelist + Blacklist.
- `src/pages/engagement/WelcomeDmCard.jsx`, `src/pages/engagement/CloseFriendsCard.jsx` — extracted from EngagementCard.

### Removed
- `src/pages/growth/` (whole folder).
- `src/pages/growth/EngagementCard.jsx` (split into the two cards above).

---

## 2026-04-30 — Layout refactor (per `docs/MIGRATION.md`)

### Created
- **`src/components/ProfileDropdown.jsx`** — top-right account dropdown. Two trigger variants: `sidebar-pill` (desktop sidebar bottom — full pill with avatar + name + email, opens upward) and `compact` (mobile header right — 40×40 avatar trigger, opens below + leftward). Five rows: identity header, Account details, Plan & billing, IG connection status row (non-clickable, inline Reconnect link when disconnected — Q3c), Theme segmented control (Light / Dark), Log out (V1 stub).
- **`src/components/MobileNavDrawer.jsx`** — left-anchored hamburger drawer for mobile. Three sections: Navigate (Overview · Targeting · Growth · Settings), Account (Account details, Plan & billing, IG connection status), System (Theme + Log out). Closes on backdrop click, ESC, route change, or X. Body scroll-locks while open; focus moves to the panel and back to the trigger.
- **`src/components/InstagramConnectionBanner.jsx`** — persistent reconnect banner on Overview when the active IG account is disconnected. Calm copy lifted verbatim from PRODUCT.md Problem 4. Replaces the inline `DisconnectedBanner` subcomponent that previously lived inside `pages/overview/index.jsx`.
- **`src/hooks/useDismissOnOutsideClick.js`** — shared click-outside + ESC dismissal hook. Used by `ProfileDropdown`. (Optional refactor target for `NotificationBell` — pre-existing duplicate logic, deferred.)
- **`src/pages/account/BillingPanel.jsx`** — merged Plan & billing page (replaces `PaymentPanel.jsx` + `SubscriptionsList.jsx`).

### Changed
- **`useThemeStore.getInitialTheme()`** — now consults `window.matchMedia('(prefers-color-scheme: dark)')` when nothing is stored (was hard-defaulting to `'light'`). Stored choice still wins.
- **`DashboardLayout.jsx`** desktop sidebar: profile dropdown sits at the top of the bottom slot (above the Settings entry); mobile header: hamburger trigger replaces the empty 40×40 spacer on the left, profile dropdown sits next to the bell on the right.
- **`/account/payment` and `/account/subscriptions`** — both routes now redirect to `/account/billing`. Old deep links keep working.
- **`SettingsNav`** — two items instead of three (Profile + Billing). Billing's active-state matcher returns true for `/account/billing` AND `/account/subscriptions/:id` so the rail stays consistent on the standalone subscription detail.
- **`pages/account/index.jsx`** `PANEL_TITLE` map — drops `/account/payment` and `/account/subscriptions`, adds `/account/billing` → `'Billing'`.
- **`SubscriptionDetail`** back arrow now returns to `/account/billing` (was `/account/subscriptions`, which no longer exists as a list page).
- **`CLAUDE.md`** Never list — hamburger is no longer banned outright; it's now banned **as the only mobile nav**. Pairing with the bottom tab bar is explicitly allowed (see `MobileNavDrawer.jsx`).

### Removed
- `src/pages/account/PaymentPanel.jsx` and `src/pages/account/SubscriptionsList.jsx` — superseded by `BillingPanel.jsx`.
- The inline `DisconnectedBanner` subcomponent inside `pages/overview/index.jsx` — superseded by the shared `InstagramConnectionBanner` so the IG status visible across the dropdown, the drawer, and the Overview banner all subscribe to the same `useAccounts` source.

### Decisions
- Sidebar Settings entry stays — it's the main Kicksta-account access on desktop. Profile dropdown is the additional path, not the replacement.
- Hamburger drawer uses the hybrid model: full primary nav inside the drawer AND the bottom tab bar stays for the three primary tabs. Settings is reachable via the drawer only on mobile.
- IG connection inside the dropdown / drawer is a non-clickable status row, with an inline "Reconnect" link only when disconnected.

---

## 2026-04-29 — Settings page fixes

### Changed
- **Sub-nav selected state** — desktop SettingsNav active row gains a leading 3-px blue accent bar; mobile active row flips its icon chip to filled `bg-blue-base text-white`. Selection is now unmistakable at a glance.
- **ProfilePanel** restructured — was three section cards, now one outer card with two eyebrow-labeled sections (Personal info / Security). Communication preferences removed entirely (the wrong surface for transactional notification routing; will get its own page if ever needed). All inline edits are gone — every Edit button opens a focused modal (`EditNameModal`, `EditEmailModal`, `EditPhoneModal`, plus the existing `PasswordModal`). The four modals dispatch via `open-edit-*-modal` CustomEvents and mount inside the AccountPage shell.
- **Multiple payment methods** — `usePaymentMethod` (singular) replaced by `usePaymentMethods` (plural) with `cards`, `addCard`, `removeCard`, `setPrimary`, `updateCard`. The card list shows brand + last4 + Primary pill + expiry, with a kebab menu offering Set as primary / Edit / Remove. Add row at the bottom opens `EditPaymentModal` in add-mode (modal supports both modes via a `cardId` prop). Removing the primary or the last card fires an explanatory error toast.
- **Payment method card** — header copy promoted to `text-lg font-semibold leading-snug`. The "Used by N subscriptions · $X/mo total" line moves out of the muted footer into a prominent `bg-bg` summary pill at the top of the card.
- **Billing email removed** from per-card display (it's a user-level field; per-card billing email is store-only for now).
- **Billing history compacted** — mobile invoice rows collapse from 3 lines to 2 (date + amount + status pill on top, description + Download on bottom). Desktop description column gets `truncate max-w-[40ch]` with a title attribute so long descriptions don't wrap rows.
- **SubscriptionCard** stripped — drops the "Currently active" pill, drops the Server line, drops the "N invoices · Active for X days" footer; keeps avatar + username + inline status pill + plan label + a single bottom "Next billing: $X on date" line.
- **`/account/subscriptions/:id` is now a standalone page** — lifted out of the `/account` settings shell into a sibling route under `DashboardLayout`. Renders without the settings nav rail; header is its own (back-arrow icon button + avatar + username + status pill). Two-hop mobile path collapses to one obvious back arrow per hop.
- **Mobile shell redesigned** — `/account` itself drops the marketing subtitle and renders as a settings menu screen. Each panel (`profile` / `payment` / `subscriptions`) on mobile gets its own H1 (the panel name) with a 44×44 ChevronLeft back-arrow icon button to its left. The "← Settings" text link is gone. Desktop two-pane layout unchanged.

### Created
- `src/stores/usePaymentMethods.js`, `src/mocks/paymentMethods.js`
- `src/pages/account/PaymentMethodsCard.jsx`
- `src/pages/account/EditNameModal.jsx`, `EditEmailModal.jsx`, `EditPhoneModal.jsx`

### Removed
- `src/stores/usePaymentMethod.js`, `src/mocks/paymentMethod.js`, `src/pages/account/PaymentMethodCard.jsx` (superseded by plural variants)
- `commPrefs` + `setCommPref` from `useUserProfile`
- The "Currently active" pill on SubscriptionCard
- The activity-line footer on SubscriptionCard

### Decisions
- One primary card on file, billed for every subscription. Per-subscription card overrides deferred.
- Communication preferences off the Profile page entirely; will get its own surface only if needed.

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
