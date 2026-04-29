# Settings Page Fixes Design

**Date:** 2026-04-29
**Status:** Approved (pre-plan)
**Builds on:** `docs/superpowers/specs/2026-04-29-user-settings-page-design.md` + the polish pass shipped in `0753bd5` / `45d946f` / `9eb3726`

---

## Goal

Resolve the issues caught while reviewing the shipped settings page. Two threads:

1. **Concrete fixes** — selected-state indicator, profile rework, payment rework, subscription card content, copy.
2. **Mobile nav rework** — the layered-settings concept stays, but back navigation becomes an icon button, the menu screen feels like a real menu, panels own their own H1, and subscription detail breaks out of the settings shell entirely.

---

## Scope

In scope:
- Selected-state highlight on left-side desktop sub-nav (Profile / Payment / Subscriptions)
- ProfilePanel restructure — single card, sectioned within
- Communication preferences — rethought (probably removed from this surface; see decisions)
- Profile inline edits → all behind unified modals
- Payment: multiple cards on file + switching active card
- Payment: misc copy/layout fixes (date in one row, no billing email, bigger title, prominent "used by N subs" line)
- SubscriptionCard: drop "Currently active" pill, move status pill next to the username, replace invoice count with next-billing line
- Mobile shell rework: dedicated headers per screen, real back-arrow icon button, standalone subscription detail

Out of scope:
- Real cancellation flow (still stubbed)
- Real upgrade flow (still stubbed)
- Real card processing
- Marketing-email management surface

---

## 1. Sub-nav selected state (desktop)

**Problem:** On desktop, the left-side settings nav (`SettingsNav`) doesn't make the active item pop. The current `bg-blue-tint text-blue-text` styling exists but loses visual weight inside the new icon-chip rows.

**Fix:**
- Active item: `bg-blue-tint`, `text-blue-text`, plus a leading 3-px-wide accent bar (`before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1 before:rounded-r-full before:bg-blue-base`) so the row reads as "selected" the way Targeting's segmented controls do.
- The icon chip inside the active row also flips to `bg-blue-base text-white` (instead of `bg-blue-tint`) so the contrast is unmistakable.
- Hover-only rows remain unchanged.

Mobile rows do not need a "selected" indicator — they're a menu, never a permanent tab strip.

---

## 2. ProfilePanel rework

### 2a. Single card, sectioned within

**Problem:** The current three-card split (Personal info / Security / Communication) introduced too much visual chrome for what is essentially one screen of personal data.

**Fix:**
- One outer card, `rounded-xl border border-border bg-surface shadow-sm p-4 md:p-6`.
- Inside, two section groups separated by a divider rule:
  - **Personal info** — Name · Email · Phone · Password
  - (Communication is removed — see 2b.)
- Each section opens with a small eyebrow label: `text-xs font-semibold uppercase tracking-wide text-text-secondary`, followed by its rows.
- Rows keep the existing label-left / value-right recipe, but **all edits open a modal** (see 2c).

**No CardChip / InfoTooltip header inside this card** — the eyebrow labels carry the structure; chips are reserved for distinct cards on the page.

### 2b. Communication preferences — removed

**Problem:** Email/SMS toggles next to login/billing data feel like the wrong surface. Marketing prefs belong elsewhere; transactional notification routing is rarely user-configurable in this kind of dashboard, and where it is, it lives under a Notifications screen.

**Decision:**
- Drop the Communication section entirely from `/account/profile`.
- Drop the related store fields (`commPrefs.email`, `commPrefs.sms`) and the `setCommPref` action from `useUserProfile`.
- Phone number stays — it's part of identity/security context.
- The "Marketing emails are managed separately" link goes away with the section.

**Rationale:** less is more here. If transactional-notification routing is ever needed, it gets its own `/account/notifications` panel (separate spec).

### 2c. Unified modal-based editing

**Problem:** Edit affordances are inconsistent — Name/Email/Phone use inline edit; Password already opens a modal. Having two patterns side-by-side makes the panel feel half-finished.

**Fix:** every Edit → modal. Each row's "Edit" button opens a focused modal with the field(s), Save/Cancel, and validation. Specifically:
- **Edit name** (`EditNameModal`) — First name + Last name fields. Required.
- **Edit email** (`EditEmailModal`) — Email field with regex validation; on Save shows the existing "Verification link sent" toast.
- **Edit phone** (`EditPhoneModal`) — Country select + number field; Save persists; clearing the number disables SMS pref (only relevant if 2b is reverted; otherwise just clears the phone).
- **PasswordModal** — already a modal, no change.

Modals follow the existing `mounted + 2× rAF` slide-up pattern with bottom-sheet layout below `lg:` and centered above. Open via the same `window.dispatchEvent(new CustomEvent('open-edit-<field>-modal'))` pattern, with the shell at `pages/account/index.jsx` listening for each event and toggling state. Inline draft state inside `ProfilePanel` goes away.

**File structure:**
```
src/pages/account/
  EditNameModal.jsx          # NEW
  EditEmailModal.jsx         # NEW
  EditPhoneModal.jsx         # NEW
  PasswordModal.jsx          # exists
  ProfilePanel.jsx           # rewritten (single card, no inline edits, no comm section)
  index.jsx                  # listens for 4 open-edit-* events
```

---

## 3. Payment page rework

### 3a. Multiple payment methods + active-card switching

**Problem:** The store assumes a single card. Real users want a primary card + backups, and the ability to switch which card pays for a given subscription (or the whole account).

**Decision (V1 scope):** A list of cards on the user's account, exactly one of which is "primary" (used to bill all subscriptions for now — per-subscription card overrides are deferred). Add card / set primary / remove card actions.

**Store changes:**
- `usePaymentMethod` → `usePaymentMethods` (plural). Shape:
  ```js
  {
    cards: PaymentMethod[],     // [{ id, brand, last4, expMonth, expYear, primary, billingEmail }]
    addCard: (data) => void,    // appends; not auto-promoted to primary
    removeCard: (id) => void,   // blocks if last card; blocks if primary (must promote another first)
    setPrimary: (id) => void,
    updateCard: (id, patch) => void,
  }
  ```
- Mock `mockPaymentMethod` becomes `mockPaymentMethods` with two seed cards (Visa primary, Amex secondary) so the UI shows the multi-card recipe out of the gate.

**UI:**
- `PaymentMethodCard` becomes `PaymentMethodsCard` — same card outer, but inside renders a vertical list:
  - One row per card. Layout: brand icon (left) → brand + last4 + "Primary" pill (if primary) + expiry → kebab menu (right) with `Set as primary` / `Edit` / `Remove`.
  - Below the list: a single "Add payment method" button (full-width `bg-bg` ghost row with `Plus` icon).
- Edit action opens the existing `EditPaymentModal` scoped to the row's `id`. Add action opens the same modal in "create" mode (no prefill, button label "Add card").
- Set-primary is a no-op API call in V1 (store mutation + toast "Primary card updated").
- Removing the primary card prompts: "You can't remove the primary card. Set a different card as primary first." (toast).
- Removing the last card prompts: "You need at least one card on file." (toast).

**Header copy bigger:** the "Payment method" heading inside the card moves up in scale to `text-lg font-semibold leading-snug` (was `text-base`).

### 3b. Drop billing email from payment-method display

**Fix:** remove the `Billing email: ...` line from each card row. Billing email is a user-level field, not card-level — it belongs in the Profile panel (or an account-level setting), not duplicated per card.

The store still tracks `billingEmail` per card for now (the edit modal collects it), but the display drops it. A follow-up spec can move it to the user account level.

### 3c. Compact each invoice into a single visual row

**Problem:** Each mobile invoice currently takes three visual rows (date+amount / description / status+download). Reads as a list of paragraphs, not a list of invoices.

**Fix:**
- **Mobile:** each invoice becomes two stacked lines — top line is `[date] · [amount] · [status pill]` left-aligned, bottom line is the description (truncated) with the Download button right-aligned. Net height drops from 3 lines to 2.
- **Desktop:** row stays one row, but the description column gets `truncate max-w-[40ch]` with a `title` attribute for the full text so long descriptions never push a row to two lines.

### 3d. "Used by N subscriptions · $X/mo total" more visible

**Problem:** The summary line is `text-xs text-text-muted` — barely visible.

**Fix:** Move it into a dedicated horizontal pill-row at the top of `PaymentMethodsCard`, above the list. Recipe:
```
┌──────────────────────────────────────┐
│ [Layers] Used by 3 subscriptions     │
│          $137/mo total               │
└──────────────────────────────────────┘
```
- `flex items-center gap-3 rounded-lg bg-bg p-3`
- Left: small `Layers` icon in a muted chip
- Right: two-line text — primary "Used by N subscriptions" (`text-sm font-medium text-text-primary`), secondary "$X/mo total" (`text-sm font-semibold text-text-primary`)
- Sits between the `Payment method` heading and the cards list.

---

## 4. SubscriptionCard rework

### 4a. Drop "Currently active" pill

**Fix:** remove the pill that's added when the card's account matches the AccountSwitcher's `activeId`. The status pill and visual emphasis already convey enough; the dual-pill row was noisy.

### 4b. Status pill inline with username

**Already done in the polish pass for `SubscriptionDetail`.** Apply the same recipe to the list card: status pill renders directly to the right of `@username`, on the same line, instead of in a separate position.

### 4c. Replace footer activity line with next-billing

**Problem:** `N invoices · Active for X days` is plate-decoration metadata. Next-billing is operational and answers a real question. The 2-col Server/Next-billing grid in the body is redundant noise — Server belongs on the detail page.

**Fix:** simplify the card body to three rows:
1. Header row — avatar (left), `@username` + status pill inline (middle), `ChevronRight` (right)
2. Plan label — `Advanced plan · Growth+`
3. **Next billing — `$59 on May 1, 2026`**, styled as the single primary info line: `text-xs text-text-secondary` with the amount + date in `text-text-primary`.

Drops:
- The 2-col body grid (Server line removed entirely from the card; lives on detail only)
- The footer "N invoices · Active for X days" line

---

## 5. Mobile nav rework

### 5a. Three principles

1. Each screen has its own dedicated header — no repeating "Settings" + subtitle once past the menu.
2. Back navigation is a 44×44 icon button (`ChevronLeft`), not a small text link.
3. The `/account` menu screen drops the marketing subtitle — it's a navigation surface, not content.

### 5b. `/account` (mobile menu)

```
┌──────────────────────────────────┐
│ Settings                         │   ← single H1, no subtitle
├──────────────────────────────────┤
│  [👤]  Profile                ›  │
│        Name, email, password     │
├──────────────────────────────────┤
│  [💳]  Payment                ›  │
│        Cards on file & invoices  │
├──────────────────────────────────┤
│  [📚]  Subscriptions          ›  │
│        One per Instagram account │
└──────────────────────────────────┘
```

- The existing iOS-style chevron-row recipe in `SettingsNav` already covers this; just drop the marketing subtitle from the page header.
- Each row is a real ≥56px tap target.

### 5c. `/account/profile`, `/account/payment`, `/account/subscriptions` (mobile panel)

```
┌──────────────────────────────────┐
│ [←]  Profile                     │  ← H1 = panel title; back is 44×44 icon button
├──────────────────────────────────┤
│  ...panel content...             │
└──────────────────────────────────┘
```

- The H1 below `lg:` is the panel name (Profile / Payment / Subscriptions), not "Settings."
- Back arrow returns to `/account`.
- The existing "← Settings" text link goes away.
- Above `lg:` the existing two-pane layout + `Settings` H1 + subtitle is unchanged (the nav rail anchors location).

### 5d. `/account/subscriptions/:id` — standalone page

**Architectural change.** The route lifts out of `/account` and becomes a sibling under `DashboardLayout`:

```jsx
<Route element={<DashboardLayout />}>
  <Route path="/" element={<OverviewPage />} />
  ...
  <Route path="/account" element={<AccountPage />}>
    <Route path="profile" element={<ProfilePanel />} />
    <Route path="payment" element={<PaymentPanel />} />
    <Route path="subscriptions" element={<SubscriptionsList />} />
  </Route>
  <Route path="/account/subscriptions/:id" element={<SubscriptionDetail />} />
  ...
</Route>
```

- No settings nav rail on desktop, no settings shell on mobile.
- Page chrome is just the dashboard sidebar (desktop) / top bar (mobile).
- The page itself owns its own header: avatar + username + status pill + 44×44 back arrow icon button on the left.
- Back arrow returns to `/account/subscriptions` directly. One hop.
- No two-pane wrapper; content sits in `mx-auto w-full max-w-3xl px-4 py-6 md:px-6 lg:px-8`.

### 5e. AccountPage shell — viewport-aware header

The shell knows which screen it's rendering by inspecting `pathname`:

```js
const TITLE_BY_PATH = {
  '/account/profile': 'Profile',
  '/account/payment': 'Payment',
  '/account/subscriptions': 'Subscriptions',
}
```

- On mobile (`< lg`), when a child route is active, the shell renders `[← icon button] [panel-title H1]` instead of "Settings + subtitle." The H1 size matches other pages: `text-lg font-semibold leading-snug lg:text-xl`.
- On mobile, when `/account` (no child), the shell renders just "Settings" H1 with no subtitle, then SettingsNav as the only content.
- On desktop, regardless of child state, the shell renders "Settings" H1 + subtitle + two-pane (settings nav rail + outlet).

**No back-link UI in the shell on desktop** — the settings nav rail is the wayfinding.

---

## File map

**Create:**
- `src/pages/account/EditNameModal.jsx`
- `src/pages/account/EditEmailModal.jsx`
- `src/pages/account/EditPhoneModal.jsx`

**Rename / replace:**
- `src/stores/usePaymentMethod.js` → `src/stores/usePaymentMethods.js` (plural; new shape)
- `src/mocks/paymentMethod.js` → `src/mocks/paymentMethods.js` (plural; two seed cards)
- `src/pages/account/PaymentMethodCard.jsx` → `src/pages/account/PaymentMethodsCard.jsx` (list of cards)

**Modify:**
- `src/App.jsx` — lift `/account/subscriptions/:id` to a sibling route under `DashboardLayout`
- `src/pages/account/index.jsx` — viewport-aware mobile header (`[← icon] <title>` or "Settings" + nav)
- `src/pages/account/SettingsNav.jsx` — desktop active state gets accent bar + filled icon chip
- `src/pages/account/ProfilePanel.jsx` — single card, sectioned, modal-driven edits, no comm section
- `src/pages/account/EditPaymentModal.jsx` — supports add-mode (no prefill) + edit-mode (id prop)
- `src/pages/account/PaymentPanel.jsx` — references `PaymentMethodsCard`
- `src/pages/account/SubscriptionCard.jsx` — drop "Currently active" pill, simplify body, next-billing footer
- `src/pages/account/SubscriptionDetail.jsx` — standalone page chrome (header avatar+username+pill, 44×44 back arrow, narrower max width)
- `src/stores/useUserProfile.js` — drop `commPrefs` + `setCommPref`

**Delete:**
- (None — but the inline edit logic in `ProfilePanel` is gone; `usePaymentMethod` (singular) gets renamed not deleted.)

**Retain unchanged:**
- All other settings files (PlanCard, ServerCard, ChangeServerModal, AddSubscriptionModal, CancelSubscriptionModal, ConfirmGrowthPlusModal, InvoicesTable, subscriptionShared.js, mocks/subscriptions.js, mocks/invoices.js, mocks/servers.js, useSubscriptions store).

---

## Mock data shapes

```js
// src/mocks/paymentMethods.js
export const mockPaymentMethods = [
  {
    id: 'pm_001',
    brand: 'visa',
    last4: '4242',
    expMonth: 9,
    expYear: 2027,
    primary: true,
    billingEmail: 'alex@example.com',
  },
  {
    id: 'pm_002',
    brand: 'amex',
    last4: '8888',
    expMonth: 3,
    expYear: 2028,
    primary: false,
    billingEmail: 'alex@example.com',
  },
]
```

---

## Cross-cutting

- **Tap targets:** all back buttons across the settings flow are `h-11 w-11` (44px) icon buttons with `hover:bg-bg`. Inline Edit affordances within rows stay h-10 (rows with text labels meet height via parent recipe).
- **Modals:** existing `mounted + 2× rAF` pattern, bottom sheet on mobile, centered on `lg:`.
- **Toasts:** existing toast system; primary card change → "Primary card updated"; card removed → "Card removed".
- **Routing:** `/account/subscriptions/:id` is a sibling of `/account/*` panels under `DashboardLayout`. Hitting an unknown id still redirects to `/account/subscriptions`.
- **Dark mode:** every new bg/border/text uses CSS-variable tokens.

---

## Open questions / deferred

1. Per-subscription card override (e.g., "Bill subscription X to a different card") — separate spec.
2. Account-level billing email (single source of truth, replacing per-card) — separate spec.
3. Marketing email management surface — separate spec.
4. Notifications routing screen, if ever needed — separate spec.

---

## Out of scope for this spec

- The 6-step cancellation flow (still stubbed)
- The plan-comparison upgrade flow (still stubbed)
- Real Stripe / card processing
- 2FA, sessions, login activity (Security section is reserved but only Password lives there)
