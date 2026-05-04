# MIGRATION.md — Layout refactor to match CLAUDE.md / PRODUCT.md

**Date:** 2026-04-30
**Sources:** `CLAUDE.md`, `PRODUCT.md` (both read in full)
**Scope:** Plan only. No source files modified in this session.

---

## Decisions locked

| # | Topic | Decision |
|---|-------|----------|
| Q1 | Sidebar Settings entry | **Keep** — main Kicksta-account access on desktop. Profile dropdown is the *additional* path. |
| Q2 | Plan & billing IA | **Collapse** `/account/payment` + `/account/subscriptions` into a single `/account/billing` page. |
| Q3 | "IG connection" item | **Non-clickable status row** inside the dropdown. Shows `✓ @username connected` or `⚠ Disconnected — Reconnect` (the "Reconnect" word is the inline link, routes to `/signup/connect-instagram`). |
| Q4 | AccountSwitcher | **Stays** in the desktop sidebar, unchanged. |
| Q5 | Mobile chrome | **Hamburger menu, top-left.** Hybrid model — drawer holds full primary nav + profile items; bottom tab bar stays for the three primary tabs. CLAUDE.md's "Never: Hamburger menu" rule is being **dropped** as part of this refactor. |

---

## 1. Summary of the change

- **New top-right Profile Dropdown** on desktop: Account details · Plan & billing · IG connection status row · Light/Dark toggle · Log out. Anchored to the user avatar. Doesn't exist today.
- **New mobile hamburger drawer** anchored top-left: full primary nav (Overview · Targeting · Growth · Settings) + the same profile-dropdown items, in two grouped sections. The existing 3-tab bottom bar stays — duplication on the primary tabs is intentional (per Q5b = hybrid).
- **`/account/payment` and `/account/subscriptions` merge** into a single `/account/billing` page that shows the cards-on-file table, the consolidated invoice list, and the subscription cards (each still drilling into `/account/subscriptions/:id`, which remains a standalone page).
- **Theme system gets two changes**: (a) `useThemeStore.getInitialTheme()` honors `prefers-color-scheme` on first load (today it hard-defaults to `'light'`); (b) the toggle UI ships inside the new dropdown / hamburger.
- **IG-disconnected banner** lands on Overview, calm copy per PRODUCT.md, single Reconnect CTA. Independent of every other session.
- **`CLAUDE.md` is edited** to drop "Hamburger menu" from the Never list (Q5a). This is the only doc-rule change.

What's *not* changing: bottom tab bar (3 tabs stay), AccountSwitcher (stays), sidebar Settings entry (stays per Q1), color tokens, spacing rules, font, modal patterns, mock shapes, signup flow, all page-level work shipped over the past few weeks.

---

## 2. Impact inventory

### Layer 1 — Tokens / primitives

| File | Change | Complexity |
|------|--------|------------|
| `src/stores/useThemeStore.js` | `getInitialTheme()` consults `localStorage` only; add `window.matchMedia('(prefers-color-scheme: dark)').matches` fallback when nothing is stored. Apply class to `<html>` on first paint via the existing one-line bootstrap in `main.jsx`. | trivial |
| `src/index.css` | No change. (Tokens are CSS variables; dark variant already defined.) | none |
| `src/main.jsx` | Verify only — bootstrap line already toggles `<html>.dark` after store init. | none |

### Layer 2 — Layout shell

| File | Change | Complexity |
|------|--------|------------|
| `src/components/DashboardLayout.jsx` (514 lines) | Three discrete edits: (a) integrate new `<ProfileDropdown />` into the desktop sidebar (top of bottom slot, above Settings) and into the mobile top-right slot of the header (alongside the bell); (b) integrate new `<MobileNavDrawer />` triggered by a hamburger button in the mobile top-left header slot (currently empty); (c) the existing `[empty 40×40 spacer]` in the mobile header gets replaced by the hamburger button. The Settings sidebar entry stays. | risky |
| `src/App.jsx` | Add `/account/billing` route under the `/account` parent; mark `/account/payment` and `/account/subscriptions` as redirects to `/account/billing` so old deep links (and the existing SubscriptionCard `to={...}` patterns from non-list surfaces, if any) keep working. Leave `/account/subscriptions/:id` standalone, unchanged. | moderate |
| `src/components/SignupLayout.jsx` | No change. Signup explicitly excludes dashboard nav. | none |
| `CLAUDE.md` | Drop "Hamburger menu" from the Never list (single bullet edit). | trivial |

### Layer 3 — Shared components

| File | Change | Complexity |
|------|--------|------------|
| `src/components/ProfileDropdown.jsx` | **New file.** Anchors to the avatar trigger, opens a panel with five rows: Account details (link), Plan & billing (link), IG connection (non-clickable status row with inline Reconnect link if disconnected — Q3c), Light/Dark toggle (segmented control or switch), Log out. Reads name/email from `useUserProfile`, theme from `useThemeStore`, IG state from `useAccounts` + the active account's `connectionState`. Click-outside + ESC dismissal. Same recipe as the existing `NotificationBell` panel (`DashboardLayout.jsx:38-110`). | moderate |
| `src/components/MobileNavDrawer.jsx` | **New file.** Slides in from the left when the hamburger is tapped. Two sections: (a) primary nav (Overview · Targeting · Growth · Settings — same `tabs` array as the sidebar but with Settings appended), (b) the profile-dropdown items (Account details · Plan & billing · IG connection status · Light/Dark toggle · Log out). Top of the drawer shows user identity (avatar + name + email). Backdrop dims on open; backdrop click + ESC + selecting any nav item closes. **Trap focus inside the drawer while open.** | risky |
| `src/components/InstagramConnectionBanner.jsx` | **New file.** Persistent banner on Overview when `connectionState === 'disconnected'`. Calm copy per PRODUCT.md ("Your Instagram session ended..."). One CTA: "Reconnect" → `/signup/connect-instagram`. | moderate |
| `src/hooks/useDismissOnOutsideClick.js` | **New file (optional, recommended).** Extract the click-outside + ESC pattern that `NotificationBell` uses, so `ProfileDropdown` and `MobileNavDrawer` share one source of truth. Pre-existing tech debt that becomes load-bearing the moment a third dropdown lands. | trivial |
| `src/components/SystemStatus.jsx`, `CardChip.jsx`, `InfoTooltip.jsx`, `Toast.jsx`, `LoadingOverlay.jsx`, `SettingSwitch.jsx`, `UpgradeBottomSheet.jsx`, `GrowthPlusBanner.jsx` | No change. | none |

### Layer 4 — Page-level components

| File | Change | Complexity |
|------|--------|------------|
| `src/pages/overview/index.jsx` | Mount `<InstagramConnectionBanner />` at the top, gated on the active account's `connectionState`. | moderate |
| `src/pages/account/PaymentPanel.jsx` | **Renamed** to `BillingPanel.jsx`. Wraps `<PaymentMethodsCard />` (unchanged) + a new "Subscriptions" section that mounts the existing `<SubscriptionCard />` rows + the existing "Billing history" section with `<InvoicesTable />` (unchanged). Logical IA: Cards on file → Subscriptions → Invoices, top to bottom. | moderate |
| `src/pages/account/SubscriptionsList.jsx` | **Deleted.** Its content (SubscriptionCard list + Add-subscription button + AddSubscriptionModal mount) folds into the new `BillingPanel.jsx`. The Add-subscription button moves into the Subscriptions section header inside Billing. | moderate |
| `src/pages/account/SettingsNav.jsx` | Drop the "Subscriptions" entry — now just two items: Profile, Billing. Active-state logic for "Billing" should match `/account/billing` and **also** `/account/subscriptions/:id` (so the rail stays consistent when drilling into a subscription detail). | moderate |
| `src/pages/account/index.jsx` | Update the `PANEL_TITLE` lookup: drop `/account/subscriptions`, add `/account/billing`. The mobile-aware redirect (`<Navigate to="/account/profile" replace />`) stays. | trivial |
| `src/pages/account/SubscriptionDetail.jsx` | Update the back-link: today it goes to `/account/subscriptions` (which won't exist as a list anymore). Change to `/account/billing` so back returns to the merged page. | trivial |
| `src/pages/account/{ProfilePanel,PlanCard,ServerCard,PaymentMethodsCard,InvoicesTable,EditPaymentModal,EditNameModal,EditEmailModal,EditPhoneModal,PasswordModal,SubscriptionCard,AddSubscriptionModal,CancelSubscriptionModal,ChangeServerModal,ConfirmGrowthPlusModal,subscriptionShared.js}` | No change. The merged Billing page composes the same building blocks; SubscriptionDetail still owns the per-subscription drilldown. | none |
| `src/pages/targets/index.jsx`, `src/pages/growth/index.jsx`, `src/pages/accountGrowthPlus/index.jsx` | No change. | none |
| `src/pages/signup/steps/*` | No change. | none |

---

## 3. Ordered migration sequence

Bottom-up. Each session is one Claude Code session's worth of work (~1–2 hours). Sessions 1, 4, and 5 are independent of each other; 2, 3, 6 stack.

### Session 1 — Theme initialization (independent)

**Scope:** Make `useThemeStore.getInitialTheme()` honor `prefers-color-scheme` on first load. Verify `main.jsx` bootstrap still fires correctly.

**Files in scope:**
- `src/stores/useThemeStore.js`
- `src/main.jsx` (verify only)

**Verification:**
- Clear `localStorage.kicksta-theme`, set OS to dark, hard-refresh — `<html>` lands with `dark` class.
- Set OS to light, hard-refresh — no `dark` class.
- Toggle once via devtools (`useThemeStore.getState().setTheme('dark')`), refresh — stored value wins.

**Expected commit message:** `feat(theme): respect prefers-color-scheme on first load`

---

### Session 2 — ProfileDropdown component + Light/Dark toggle UI

**Scope:** Build `ProfileDropdown.jsx`. Mount in the desktop sidebar (above the Settings entry, inside the bottom slot) and in the mobile top header right side (next to `NotificationBell`). Includes the IG connection status row (Q3c) and the Light/Dark toggle.

Optional but recommended: extract `useDismissOnOutsideClick(ref, onClose)` and refactor `NotificationBell` to use it too. Both dropdowns then share one click-outside implementation.

**Files in scope:**
- `src/components/ProfileDropdown.jsx` (create)
- `src/hooks/useDismissOnOutsideClick.js` (create — optional)
- `src/components/DashboardLayout.jsx` (modify — desktop sidebar bottom + mobile header right side; if hook extracted, also refactor NotificationBell)

**Dependencies:** Session 1 should have landed — the toggle reads `useThemeStore`.

**Notes:**
- The dropdown's "Plan & billing" link routes to `/account/billing`. That route doesn't exist yet at this point. The link will be a 404 until Session 5. Either ship Session 5 first, or use `/account/payment` as a temporary destination and update in Session 5.
- The "Account details" link routes to `/account/profile` — works immediately.
- The IG connection row reads from `useAccounts((s) => s.accounts.find(a => a.id === s.activeId))`. The `connectionState` field already exists on `mockAccounts` entries.

**Verification:**
- Avatar visible top-right at desktop AND mobile widths.
- Click → dropdown opens. Five rows render. Theme toggle reflects current state.
- Click each route → resolves (Plan & billing temporarily 404 if Session 5 deferred — fine).
- IG row: with `mockAccounts[0].connectionState = 'connected'` → green check + handle. Switch via AccountSwitcher to `acc_002` (disconnected) → row shows red dot + "Reconnect" link → click routes to `/signup/connect-instagram`.
- ESC closes. Click outside closes. Click another open dropdown — both should not be open simultaneously (or accept; document choice).

**Expected commit message:** `feat(layout): add profile dropdown with theme toggle`

---

### Session 3 — Mobile hamburger drawer

**Scope:** Build `MobileNavDrawer.jsx`. Mount the hamburger button in the existing mobile top-left header slot (currently a 40×40 empty spacer). Drawer slides in from the left; backdrop dims; ESC + backdrop click + nav-item-click all close. Focus trap while open.

Drawer contents (top to bottom):
1. **User identity row** — avatar + `firstName lastName` + email (read from `useUserProfile`).
2. **Section divider — "Navigate"**
3. **Primary nav rows** — Overview · Targeting · Growth · Settings. Each row uses the same active-state recipe as the sidebar (`bg-blue-tint text-blue-text` when active). Tapping closes the drawer + routes.
4. **Section divider — "Account"**
5. **Account rows** — Account details · Plan & billing · IG connection status (Q3c, non-clickable, with inline Reconnect link if disconnected).
6. **Section divider — "System"**
7. **Light/Dark toggle row.**
8. **Log out row.**

**Files in scope:**
- `src/components/MobileNavDrawer.jsx` (create)
- `src/components/DashboardLayout.jsx` (modify — replace mobile header left spacer with hamburger button + drawer mount)
- `src/hooks/useDismissOnOutsideClick.js` (consume — if Session 2 created it)

**Dependencies:** Session 2's `ProfileDropdown` content informs the drawer's bottom half — but the drawer is a separate component, not a wrapper around the dropdown. They share data via stores.

**Notes:**
- Drawer width: `w-72` (288px) is the iOS-default sweet spot. Full-screen on very narrow viewports (`max-w-[85vw]`) so it doesn't overflow.
- The bottom tab bar (3 primary tabs) stays unchanged. Users can reach Overview/Targeting/Growth from either the bar OR the drawer — duplication is intentional per Q5b.
- Settings is reachable from the drawer ONLY on mobile (no Settings tab in the bottom bar; Q1 keeps it in the desktop sidebar).
- Backdrop: `fixed inset-0 bg-black/40` — same as modal pattern.

**Verification:**
- Tap hamburger top-left at mobile width → drawer slides in from left, backdrop dims.
- Tap each nav row → routes + drawer closes.
- Tap Account details / Plan & billing → routes + drawer closes.
- IG connection row state matches the active account.
- Light/Dark toggle flips theme without closing the drawer.
- Log out → no-op stub for now (mark as TODO for the auth feature).
- Backdrop click closes. ESC closes. Browser back closes (via history state — optional polish).
- Hamburger button NOT visible at desktop widths.
- Bottom tab bar still visible and functional below the drawer.

**Expected commit message:** `feat(layout): add mobile hamburger drawer`

---

### Session 4 — IG-disconnected banner on Overview (independent)

**Scope:** Build `InstagramConnectionBanner.jsx` and mount at the top of `pages/overview/index.jsx`. Calm copy per PRODUCT.md: *"Your Instagram session ended. This is normal after a password change or security prompt — your account is safe. Reconnect to continue growing."* Single Reconnect CTA → `/signup/connect-instagram`. Hidden when `connectionState !== 'disconnected'`.

**Files in scope:**
- `src/components/InstagramConnectionBanner.jsx` (create)
- `src/pages/overview/index.jsx` (mount)

**Dependencies:** None — runs in parallel with any other session.

**Verification:**
- Set active account's `connectionState` to `'disconnected'` in the mock.
- Banner appears at the top of `/` only (not on `/targets`, `/growth`, `/account/*`).
- Reconnect button routes to `/signup/connect-instagram`.
- Copy matches PRODUCT.md exactly.
- Set back to `'connected'` → banner hides.

**Expected commit message:** `feat(overview): add IG-disconnected reconnect banner`

---

### Session 5 — Merge `/account/payment` + `/account/subscriptions` → `/account/billing`

**Scope:** Q2 collapse. Three coordinated edits:

1. **Rename + recompose** `src/pages/account/PaymentPanel.jsx` → `BillingPanel.jsx`. New structure (top to bottom):
   - `<PaymentMethodsCard />` (unchanged)
   - **Subscriptions section** — new `<h2>` with chip + tooltip + Add-subscription button (moved from old `SubscriptionsList.jsx`); below, the existing `<SubscriptionCard />` rows mapped over `useSubscriptions().subscriptions`; `<AddSubscriptionModal />` mount at the bottom.
   - **Billing history section** — `<InvoicesTable invoices={mockInvoices} />` (unchanged).
2. **Delete** `src/pages/account/SubscriptionsList.jsx` (its content folds into BillingPanel).
3. **Update routing** in `src/App.jsx`:
   - Change `<Route path="payment" element={<PaymentPanel />} />` → `<Route path="billing" element={<BillingPanel />} />`.
   - Drop `<Route path="subscriptions" element={<SubscriptionsList />} />`.
   - Add `<Route path="payment" element={<Navigate to="/account/billing" replace />} />` (back-compat redirect).
   - Add `<Route path="subscriptions" element={<Navigate to="/account/billing" replace />} />` (back-compat redirect).
   - `<Route path="/account/subscriptions/:id" element={<SubscriptionDetail />} />` (sibling) stays exactly as is.
4. **Update `SettingsNav.jsx`** — replace the two items (Payment, Subscriptions) with one (Billing). The Billing item's active-state matcher should return true for both `/account/billing` AND `/account/subscriptions/:id` so the rail stays consistent on the detail page.
5. **Update `pages/account/index.jsx`** `PANEL_TITLE` map — drop `/account/subscriptions` entry, add `/account/billing` → `'Billing'`.
6. **Update `SubscriptionDetail.jsx`** back link — `/account/subscriptions` → `/account/billing`.
7. **Update `ProfileDropdown.jsx`** Plan & billing destination from `/account/payment` to `/account/billing` (if Session 2 used the temporary destination).
8. **Update `MobileNavDrawer.jsx`** Plan & billing destination similarly.

**Files in scope:**
- `src/App.jsx`
- `src/pages/account/BillingPanel.jsx` (rename from `PaymentPanel.jsx`)
- `src/pages/account/SubscriptionsList.jsx` (delete)
- `src/pages/account/SettingsNav.jsx`
- `src/pages/account/index.jsx`
- `src/pages/account/SubscriptionDetail.jsx`
- `src/components/ProfileDropdown.jsx`
- `src/components/MobileNavDrawer.jsx`

**Dependencies:** Sessions 2 + 3 should have landed (the dropdown and drawer link to `/account/billing` and need updating).

**Verification:**
- `/account/billing` renders Cards on file → Subscriptions list → Billing history.
- Click a SubscriptionCard → routes to `/account/subscriptions/sub_001` (standalone page, unchanged).
- From SubscriptionDetail, back arrow returns to `/account/billing`.
- `/account/payment` → 301 to `/account/billing` (back-compat).
- `/account/subscriptions` → 301 to `/account/billing` (back-compat).
- SettingsNav rail (desktop two-pane) shows Profile + Billing only.
- On `/account/subscriptions/:id`, the standalone page renders (no nav rail) — consistent with prior behavior.
- Add-subscription button still routes to `/signup/connect-instagram` via the existing modal.

**Expected commit message:** `refactor(account): merge payment + subscriptions into /account/billing`

---

### Session 6 — CLAUDE.md rule update + CHANGELOG + CONTEXT (always last)

**Scope:** Three doc edits in one commit.

1. `CLAUDE.md` Do/Don't Checklist — drop "Hamburger menu" from the Never list (Q5a). Note in the same line that hamburger is acceptable when paired with a primary tab bar (so future contributors don't reintroduce it as the *only* nav).
2. `CHANGELOG.md` — new dated entry under 2026-04-30 covering all sessions.
3. `CONTEXT.md` update log entry naming the new components + behavior shifts.

**Files in scope:**
- `CLAUDE.md`
- `CHANGELOG.md`
- `CONTEXT.md`

**Verification:** N/A.

**Expected commit message:** `docs: log layout refactor; allow hamburger menu`

---

## 4. Risks and watch-outs

**Cascading state**

- **`useThemeStore` initial value.** Today defaults to `'light'` deterministically. Adding `prefers-color-scheme` makes it environment-dependent. Search for `theme === 'light'` literal comparisons before Session 1; any consumer making that assumption is load-bearing.
- **`useAccounts.activeId`** flows into the IG-connection status row in the dropdown AND the drawer AND the Overview banner. Switching active accounts via AccountSwitcher must re-render all three. Works for free with Zustand selector hooks; smoke-test it anyway.
- **`useUserProfile`** today only feeds `ProfilePanel.jsx` and the four Edit*Modal files. After this refactor it powers the dropdown header, the drawer header, and (still) the profile panel. Use selector hooks (`useUserProfile((s) => s.firstName)`) — *not* the full store — to avoid pointless re-renders.

**Prop contracts**

- `ProfileDropdown` and `MobileNavDrawer` should take **zero data props** (only `open` / `onClose` / `triggerRef` for positioning). All data flows from stores. Passing user data through props will regress the moment Profile edits change values.
- The IG connection status row needs to know which account is active. Decide ONCE per session whether the row reads from `useAccounts` directly or accepts the active-account object as a prop. Don't mix patterns between dropdown and drawer.

**Route changes**

- After Session 5, `/account/payment` and `/account/subscriptions` are redirects. Anything in the codebase that hardcodes those paths breaks if not updated. Scan for them at the start of Session 5 (`grep -rn "/account/payment\|/account/subscriptions[^/]" src/`).
- `/account/subscriptions/:id` (the standalone subscription detail) MUST stay unchanged. Easy to break by accident when refactoring the parent route block.
- The mobile-aware `<Navigate to="/account/profile" replace />` inside `pages/account/index.jsx` is fragile — re-test on both viewport widths after Session 5.

**Mock data shape**

- Zero changes required. The dropdown's IG connection row reads `mockAccounts[*].connectionState` (already defined). The Overview banner reads the same field.
- Open question: `mockAccounts[*].connectionState` and `mockInstagram.connectionState` both exist. Pre-existing tech debt — **not** introduced or fixed by this refactor. Worth a follow-up spec.

**CLAUDE.md / PRODUCT.md vs. existing patterns — confirmed conflicts**

1. **CLAUDE.md Never list contains "Hamburger menu"** — being dropped in Session 6 (Q5a).
2. **Theme initialization** — CLAUDE.md mandates `prefers-color-scheme`; current store ignores it. Session 1.
3. **Light/Dark toggle UI** — required by PRODUCT.md, not surfaced anywhere today. Session 2 + 3.
4. **System Status visibility** — PRODUCT.md says "always visible with timestamps" (Problem 4). Today `SystemStatus.jsx` + `useSystemStatus.js` are parked. **Pre-existing gap, not fixed in this refactor.** Flag for a follow-up spec.

**Pattern conflicts**

- Two top-anchored dropdowns (`NotificationBell`, `ProfileDropdown`) and one full-screen drawer (`MobileNavDrawer`) share dismissal logic. The optional `useDismissOnOutsideClick` hook in Session 2 prevents three forks from drifting apart. Worth doing.
- Z-index race: NotificationBell uses `z-50`. ProfileDropdown will use `z-50`. MobileNavDrawer backdrop should use `z-40`, drawer panel `z-50`. Worth documenting in `MobileNavDrawer.jsx` so the next contributor doesn't bump them haphazardly.
- The hamburger drawer is "in" but the bottom tab bar is "out" — i.e., when the drawer is open on mobile, the bottom tab bar should be **inactive** (visually present but not tappable, or hidden). Decide explicitly during Session 3. Easiest: the drawer covers the bottom tab bar (full-height), bar is visually obscured.

---

## 5. Verification checklist

### Pre-start screenshots (capture before Session 1)

Capture for visual regression diffs. **Internal verification only — never share with the user (Screenshot Rule).**

- `/` (Overview) — desktop, mobile, light, dark. 4 shots.
- `/targets` — desktop only, light. 1 shot.
- `/growth` — desktop only, light. 1 shot.
- `/account/profile`, `/account/payment`, `/account/subscriptions`, `/account/subscriptions/sub_001` — desktop, light. 4 shots.
- Mobile top header at `/` — current `[spacer] [logo] [bell]` recipe. 1 shot.
- Desktop sidebar (full height, expanded). 1 shot.
- Desktop sidebar (collapsed). 1 shot.

12 reference shots total.

### Per-page smoke checks

**After Session 1 (theme init):**
- `localStorage.removeItem('kicksta-theme')`, OS dark, hard-refresh → `<html>` has `dark` class.
- OS light → no `dark` class.
- Toggle via devtools, refresh → stored value wins.

**After Session 2 (profile dropdown):**
- Avatar visible top-right at desktop AND mobile.
- Click → dropdown opens with 5 rows.
- Theme toggle works (page flips).
- Account details routes correctly.
- Plan & billing routes (will 404 until Session 5 — expected).
- IG connection row matches active account state.
- ESC + click-outside both dismiss.
- AccountSwitcher and NotificationBell unchanged.

**After Session 3 (mobile hamburger):**
- Hamburger button visible at mobile width, hidden at `lg:`.
- Tap → drawer slides in from left, backdrop dims.
- All four primary nav rows route correctly + drawer closes.
- Profile section rows behave per Session 2 spec.
- Theme toggle works inside the drawer.
- Backdrop click + ESC close the drawer.
- Bottom tab bar still functional and visible after drawer closes.

**After Session 4 (IG banner):**
- Set `mockAccounts[0].connectionState = 'disconnected'` (and `useAccounts.activeId = 'acc_001'`).
- Banner appears at top of `/` only (not other pages).
- Reconnect button routes to `/signup/connect-instagram`.
- Copy matches PRODUCT.md exactly.
- Switch active account to `acc_002` (still disconnected per mocks) — banner stays. Switch to a connected account — banner hides.

**After Session 5 (route merge):**
- `/account/billing` renders the merged page.
- Old paths (`/account/payment`, `/account/subscriptions`) redirect to `/account/billing`.
- `/account/subscriptions/sub_001` still works as a standalone page.
- SettingsNav rail (desktop) shows Profile + Billing only.
- ProfileDropdown + MobileNavDrawer Plan & billing links go to `/account/billing`.
- SubscriptionDetail back arrow returns to `/account/billing`.

**After Session 6 (docs):**
- `CLAUDE.md` Never list no longer contains "Hamburger menu."
- `CHANGELOG.md` 2026-04-30 entry covers all five sessions.
- `CONTEXT.md` update log mentions all new components.

### Visual regression points (compare to pre-start shots)

- Desktop sidebar bottom: gains a profile dropdown trigger above Settings. Settings entry stays.
- Mobile top header: gains hamburger top-left, gains profile avatar top-right. Logo + bell positions adjust.
- Overview page: banner at top in disconnected state; identical otherwise.
- `/account/billing` is new — no pre-shot for comparison; assess against `/account/payment` + `/account/subscriptions` reference shots side-by-side.
- All other pages: pixel-identical to pre-start. Any drift is a regression.

### Things that should NOT change (sanity)

- `/targets`, `/growth`, Overview body content (banner aside)
- The 3-tab mobile bottom bar
- AccountSwitcher in the desktop sidebar
- `max-w-5xl` page width constraints
- Color tokens, font, radius/shadow rules
- All Zustand store APIs (only `useThemeStore.getInitialTheme()` *internals* change)
- Mock data shapes
- Modal animation pattern (`mounted + 2× rAF` + slide-up)
- Signup flow (entirely outside the dashboard shell)
- `/account/subscriptions/:id` (standalone subscription detail) layout
