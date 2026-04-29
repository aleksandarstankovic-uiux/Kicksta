# User Settings Page Design

**Date:** 2026-04-29
**Status:** Approved (pre-plan)
**Replaces in nav:** System status (parked, code retained)

---

## Goal

A dedicated `/account` settings area for managing the **user account** (not the connected Instagram accounts). Lets the user edit profile info, manage their single shared payment method, and manage one subscription per connected IG account (plan, server, invoices). Replaces the empty placeholder at `/account` and replaces the "System status" entry in the left sidebar with "Settings".

---

## Scope

**In scope:**
- Settings shell with nested routes and two-pane layout
- Profile panel — edit name, email, password, phone, communication preferences
- Payment panel — display/edit single card on file, consolidated invoice history
- Subscriptions list — one card per IG account
- Subscription detail — plan summary, server, per-subscription invoices, action stubs
- Server change modal (real, working)
- Sidebar nav swap (System status → Settings)

**Stubbed (placeholder modals only — separate specs later):**
- Upgrade plan flow (button opens "coming soon" modal)
- Add subscription flow (button opens modal that routes to existing `/signup/connect-instagram`)
- Cancel subscription flow (button opens "coming soon" placeholder; real 6-step modal stack is its own spec)
- Manage Growth+ confirmation (toggle works in store; final UX confirmation modal can ship later if needed)

**Out of scope:**
- System status replacement design (parked — files retained, nav entry removed)
- Real card processing / Stripe integration
- Email verification flow beyond a confirmation toast
- Marketing email preferences (separate page if needed later)

---

## Architecture

### Routes

```
/account                         → redirect to /account/profile
/account/profile                 → ProfilePanel
/account/payment                 → PaymentPanel
/account/subscriptions           → SubscriptionsList
/account/subscriptions/:id       → SubscriptionDetail
```

Implemented as a parent route `/account` rendering the settings shell, with children rendered into `<Outlet />`.

### Layout — Settings shell

**Desktop (`lg:` and up):** Two-pane layout inside the page.

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Sidebar nav]    │  Settings                                              │
│                  │  ─────────────────────────────────────────────────────│
│                  │  ┌────────────────┐  ┌──────────────────────────────┐ │
│                  │  │ Settings nav   │  │  Active panel content        │ │
│                  │  │                │  │  (rendered via <Outlet />)   │ │
│                  │  │ ▸ Profile      │  │                              │ │
│                  │  │ ▸ Payment      │  │                              │ │
│                  │  │ ▸ Subscriptions│  │                              │ │
│                  │  └────────────────┘  └──────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

- Settings nav: vertical list, each item a button-style link with icon + label. Active item gets `bg-blue-tint text-blue-text` and a left border accent.
- Container: `max-w-5xl mx-auto px-4 py-6 md:px-6 lg:px-8`.

**Mobile (default):** Single column. The settings nav becomes a list with chevrons; tapping pushes forward to the panel via routing. Detail screens (`SubscriptionDetail`) include a back arrow.

### Sidebar nav swap

In `src/components/DashboardLayout.jsx`:
- Remove the "System status" sidebar nav entry.
- Add a "Settings" entry with `Settings` icon (lucide), routing to `/account`.
- Active state when path starts with `/account`.
- The existing top-right profile dropdown's "Account" item also routes to `/account/profile`.
- Keep `src/components/SystemStatus.jsx` and `src/hooks/useSystemStatus.js` in the tree — parked, not imported anywhere.

---

## Panels

### Profile panel — `/account/profile`

Single card. Inline-edit pattern — each row shows current value plus an "Edit" link. Clicking Edit swaps the row to inputs with Save / Cancel.

**Rows:**

| Field | Display | Edit | Validation |
|-------|---------|------|------------|
| Name | "Alex Johnson" | Two inputs: First name, Last name | Both required, ≥ 1 char |
| Email | "alex@example.com" | Single input, type=email | Valid email; on Save show toast "Verification link sent to <new email>." (mock — value updates immediately in store) |
| Password | `••••••••` | Opens `PasswordModal` (current / new / confirm new) | New password ≥ 8 chars; confirm must match |
| Phone number | "+1 555 123 4567" or "Add phone number" link | Country code dropdown + number input | E.164 format check (lenient) |
| Communication preferences | "Email" + (if SMS on) "SMS" | Two checkboxes — Email (default on), SMS (default off, disabled until phone added) | At least one channel must remain on |

**Helper text under comm preferences:** "Used for billing alerts, security notifications, and account updates. Marketing emails are managed separately."

**Layout:**
- Card: `rounded-xl border border-border bg-surface shadow-sm p-6`.
- Each row is a flex row on desktop: label (left, `text-sm font-medium text-text-secondary`, ~140px wide), value (middle, grows), Edit link (right, `text-blue-text text-sm`).
- Mobile: rows stack vertically — label on top, value below, Edit link right-aligned on the value line.

**State:** new `useUserProfile` Zustand store seeded from `mockUser`. Edits write through immediately on Save. Profile dropdown's display name + email also reads from this store so changes propagate.

---

### Payment panel — `/account/payment`

Two cards stacked.

#### Card 1 — Payment method (`PaymentMethodCard`)

```
┌──────────────────────────────────────────────┐
│ [icon]  Visa ending in 4242   [Edit]         │
│         Expires 09/2027                       │
│         Billing email: alex@example.com       │
└──────────────────────────────────────────────┘
```

- Generic `CreditCard` icon from lucide.
- "Edit" → `EditPaymentModal` with card number, expiry, CVC, billing email fields. Submit closes the modal, updates `usePaymentMethod` store with new last4 + expiry + billing email, shows toast "Payment method updated."
- **No empty state** — the user always has a card on file (signup requires it).

#### Card 2 — Billing history (`InvoicesTable`)

Consolidated invoice list across all subscriptions, newest first.

**Columns (desktop):** Date · Description · Amount · Status · Action

- Status pill: `Paid` `bg-green-tint text-green-text`, `Failed` `bg-red-tint text-red-text`, `Pending` `bg-yellow-tint text-yellow-text`.
- Action: "Download" link — stub, on click shows toast "Invoice download coming soon."

**Mobile:** rows collapse vertically. Top line: date (left) + amount (right). Second line: description (truncated). Third line: status pill (left) + Download link (right).

**Empty state:** "No invoices yet — your first charge will appear here after your trial ends." (Possible only if every subscription is still trialing.)

**Data source:** read directly from `mockInvoices` in V1 — no Zustand store needed. (Add a store later when refunds / edits matter.)

---

### Subscriptions list — `/account/subscriptions`

**Header row:**
- Title "Subscriptions" + count pill (e.g. "3").
- Right side: primary button "Add subscription" → opens `AddSubscriptionModal` (stub) which contains a single "Connect Instagram" button routing to `/signup/connect-instagram`.

**Body:** vertical stack of `SubscriptionCard` — one per entry in `useSubscriptions`.

```
┌──────────────────────────────────────────────────────────────┐
│ [avatar]  @alexjohnson.co              [Active] pill         │
│           Advanced plan · Growth+                             │
│                                                               │
│           Server: US-East                                     │
│           Next billing: $49 on May 1, 2026                    │
│                                                               │
│                                       [Manage →]              │
└──────────────────────────────────────────────────────────────┘
```

- Avatar uses the same recipe as Top Targets / AccountSwitcher (profile pic if present, else letter chip from username).
- Status pill mapping:
  - `active` → green tint, label "Active"
  - `trialing` → blue tint, label "Trialing"
  - `past_due` → red tint, label "Past due"
  - `canceled` → muted (`bg-bg text-text-secondary`), label "Canceled"
- Plan line: `<plan, capitalized>` plan + ` · Growth+` only if `growthPlus === true`.
- Whole card is clickable; "Manage →" is a visual affordance, not a separate hit target.
- Routes to `/account/subscriptions/:id`.

No empty state — the user always has at least one subscription post-signup.

---

### Subscription detail — `/account/subscriptions/:id`

**Header:**
- Back arrow → `/account/subscriptions`.
- Avatar + `@username` + status pill (same recipe as the list).

If `:id` is unknown, redirect to `/account/subscriptions`.

#### Card 1 — Plan (`PlanCard`)

```
┌──────────────────────────────────────────────┐
│ Plan                                          │
│                                               │
│ Advanced  $49/mo                              │
│ Growth+ add-on  +$10/mo                       │
│ ─────────────────────────────                 │
│ Total                       $59/mo            │
│                                               │
│ Trial ends Apr 10, 2026                       │
│                                               │
│ [Upgrade plan]   [Manage Growth+]             │
└──────────────────────────────────────────────┘
```

- Trial line shown only when `status === 'trialing'`.
- "Upgrade plan" — disabled (with tooltip) if plan is already `advanced`. Otherwise opens a placeholder modal: "Plan comparison coming soon. Contact support to upgrade for now." with `[Close]`.
- "Manage Growth+" — toggles `growthPlus` in the store. Shows a confirmation modal first ("Add Growth+ for $10/mo?" / "Remove Growth+?") with Confirm / Cancel.

#### Card 2 — Server (`ServerCard`)

```
┌──────────────────────────────────────────────┐
│ Server                                        │
│                                               │
│ US-East                       [Change]        │
│ Affects compliance region and proxy routing.  │
└──────────────────────────────────────────────┘
```

- "Change" opens `ChangeServerModal` — list of server options as elevated selection cards (selected card gets `shadow-md` + primary border + tint). Save updates `useSubscriptions` and shows toast "Server updated."

#### Card 3 — Invoices (reuses `InvoicesTable`)

Same component as the Payment panel's billing history, filtered to invoices where `subscriptionId === :id`.

#### Footer — Danger zone

```
┌──────────────────────────────────────────────┐
│ Cancel subscription                           │
│ Cancel to stop growth and end billing for     │
│ this account.                                 │
│                              [Cancel...]      │
└──────────────────────────────────────────────┘
```

- Visually separated from the cards above (extra top margin, `bg-bg` instead of `bg-surface`, lighter border).
- "Cancel..." button: `bg-red-tint text-red-text hover:bg-red-tint/80`.
- Click opens `CancelSubscriptionModal` — placeholder with body text "Cancellation flow — coming soon." and a single `[Close]` button. Real 6-step flow gets its own spec.

---

## File structure

```
src/pages/account/
  index.jsx                 # Settings shell with Outlet + SettingsNav
  SettingsNav.jsx           # Two-pane left nav (desktop) / list nav (mobile)
  ProfilePanel.jsx          # /account/profile
  PasswordModal.jsx         # Change-password modal
  PaymentPanel.jsx          # /account/payment
  PaymentMethodCard.jsx     # Card-on-file display
  EditPaymentModal.jsx      # Edit card details
  InvoicesTable.jsx         # Reusable — used by Payment panel + sub detail
  SubscriptionsList.jsx     # /account/subscriptions
  SubscriptionCard.jsx      # Single sub card in the list
  SubscriptionDetail.jsx    # /account/subscriptions/:id
  PlanCard.jsx              # Plan + Growth+ + Upgrade buttons
  ServerCard.jsx            # Server display + Change button
  ChangeServerModal.jsx     # Server picker
  AddSubscriptionModal.jsx  # Stub — routes to /signup/connect-instagram
  CancelSubscriptionModal.jsx  # Stub — placeholder until real flow

src/stores/
  useUserProfile.js         # Profile fields (name, email, phone, comm prefs)
  useSubscriptions.js       # All subs; setServer, toggleGrowthPlus, etc.
  usePaymentMethod.js       # Card on file (last4, brand, expiry, billing email)

src/mocks/
  subscriptions.js          # One entry per mockAccount
  invoices.js               # ~8 invoices spanning the subs
  paymentMethod.js          # Single card on file
  servers.js                # Server options list
```

**Modified:**
- `src/components/DashboardLayout.jsx` — sidebar nav: System status entry removed, Settings entry added.
- `src/App.jsx` — add `/account` parent route + nested children + redirect from `/account` to `/account/profile`.
- `src/pages/account/index.jsx` — full rewrite from the placeholder.

**Retained, unmounted:**
- `src/components/SystemStatus.jsx`, `src/hooks/useSystemStatus.js`, `src/mocks/systemStatus.js` — kept on disk, unreferenced.

---

## Stores

### `useUserProfile`

```js
{
  firstName: string,
  lastName: string,
  email: string,
  phoneCountry: string,            // e.g. "US"
  phoneNumber: string | null,
  commPrefs: { email: boolean, sms: boolean },

  setName: ({ firstName, lastName }) => void,
  setEmail: (email) => void,
  setPhone: ({ country, number }) => void,
  setCommPref: (channel, on) => void,    // channel: "email" | "sms"
  changePassword: ({ current, next }) => Promise<{ ok, error? }>,
}
```

Profile dropdown reads `firstName + lastName` and `email` from this store so edits propagate everywhere.

### `useSubscriptions`

```js
{
  subscriptions: Subscription[],

  getById: (id) => Subscription | undefined,
  setServer: (id, serverId) => void,
  toggleGrowthPlus: (id) => void,
  // upgradePlan, cancel — stubs (no-op + toast) until separate specs land
}
```

### `usePaymentMethod`

```js
{
  brand: string, last4: string, expMonth: number, expYear: number, billingEmail: string,

  update: ({ last4, expMonth, expYear, billingEmail, brand }) => void,
}
```

All three follow the existing Zustand selector-hook pattern (e.g., `useActiveAccount` style).

---

## Mock data shapes

```js
// src/mocks/subscriptions.js
export const mockSubscriptions = [
  {
    id: "sub_001",
    accountId: "acc_001",          // joins to mockAccounts
    plan: "advanced",               // "growth" | "advanced"
    growthPlus: true,
    server: "us-east",              // matches an entry in mockServers
    status: "active",               // "active" | "trialing" | "past_due" | "canceled"
    trialEndsAt: null,              // ISO or null
    nextBillingAt: "2026-05-01T00:00:00Z",
    nextBillingAmount: 59,          // dollars, total including add-ons
    startedAt: "2026-01-15T00:00:00Z",
  },
  // one entry per mockAccount; vary plan/status/growthPlus across entries
]

// src/mocks/invoices.js
export const mockInvoices = [
  {
    id: "inv_001",
    subscriptionId: "sub_001",
    date: "2026-04-01T00:00:00Z",
    amount: 59,
    description: "Advanced plan + Growth+ — @alexjohnson.co",
    status: "paid",                 // "paid" | "failed" | "pending"
    pdfUrl: null,
  },
  // ~8 entries spanning multiple subs, mix of statuses
]

// src/mocks/paymentMethod.js
export const mockPaymentMethod = {
  brand: "visa",
  last4: "4242",
  expMonth: 9,
  expYear: 2027,
  billingEmail: "alex@example.com",
}

// src/mocks/servers.js
export const mockServers = [
  { id: "us-east",      label: "US-East",      region: "United States (East)" },
  { id: "us-west",      label: "US-West",      region: "United States (West)" },
  { id: "eu-west",      label: "EU-West",      region: "Europe (West)" },
  { id: "ap-southeast", label: "AP-Southeast", region: "Asia-Pacific (Southeast)" },
]
```

---

## Cross-cutting conventions

- **Modals:** existing pattern — `mounted` state + 2× `requestAnimationFrame` + `translate-y-4 → 0`. Bottom sheet on mobile, centered on `lg:`.
- **Toasts:** existing toast system. 2–3s success at bottom-right; persistent error with dismiss.
- **Buttons:** primary `bg-blue-base text-white`, secondary `border bg-surface text-text-primary`, destructive ghost `bg-red-tint text-red-text`. Min heights per CLAUDE.md (48 primary / 44 secondary).
- **Cards:** `rounded-xl border border-border bg-surface shadow-sm`. Inner padding `p-6` desktop, `p-4` mobile.
- **Dark mode:** every `bg-*` / `border-*` paired with the corresponding token (tokens are CSS-variable-backed already).
- **Responsive:** mobile-first; settings nav collapses to a vertical list on mobile, two-pane on `lg:`.

---

## Accessibility

- All form inputs have visible labels (per CLAUDE.md — never placeholder-only).
- Inline validation errors render below the field with `role="alert"`.
- Edit buttons are real `<button>` elements; row-level click hit areas use buttons or links.
- Modal focus-trap and ESC-to-close (existing modal pattern handles this).
- Settings nav uses `<NavLink>` with `aria-current="page"` on the active route.

---

## Testing

V1 is frontend-only with mocked data; the testing strategy mirrors the rest of the codebase (manual visual verification + the existing test scaffolding for stores). For each panel and modal:

- Verify renders correctly in light + dark mode at mobile / tablet / desktop widths.
- Verify form validation paths (empty / invalid input).
- Verify store mutations: profile edits, payment edit, server change, Growth+ toggle.
- Verify route redirects: `/account` → `/account/profile`, unknown `:id` → list.
- Verify nav swap: System status entry gone, Settings entry present and active on `/account/*`.

---

## Open questions / deferred decisions

1. **Cancellation 6-step modal flow** — separate spec. CLAUDE.md mentions it; no design exists yet.
2. **Upgrade plan UX** — separate spec. Likely a plan comparison sheet.
3. **Add subscription full UX** — current plan reuses signup connect-IG. May want a tighter in-product flow later.
4. **Email change verification** — mock toast in V1; real verification flow when backend lands.
5. **System status replacement** — parked. Files retained for reuse.

---

## Out of scope for this spec

- Backend / API integration
- Stripe or other real payment processing
- Real email/SMS notification sending
- Marketing email preferences page
- Multi-user / team accounts (one user, N IG subscriptions)
