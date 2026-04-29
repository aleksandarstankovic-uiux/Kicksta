# User Settings Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dedicated `/account` user-settings area (Profile, Payment, Subscriptions list + detail) and swap "System status" for "Settings" in the sidebar, replacing the placeholder at `/account`.

**Architecture:** React Router nested routes under `/account` rendering a two-pane settings shell (`SettingsNav` + `<Outlet />`). Three new Zustand stores back the panels (`useUserProfile`, `usePaymentMethod`, `useSubscriptions`); four new mock files provide seed data. Three flows (Upgrade, Add subscription, Cancel) ship as stub modals.

**Tech Stack:** React 19 · React Router 7 · Tailwind 4 · Zustand 5 · Lucide React. Existing patterns: Zustand selector hooks, `mounted + 2× rAF` modal animation, `useToasts` global toast store, mobile-first responsive layout per `CLAUDE.md`.

**Spec:** `docs/superpowers/specs/2026-04-29-user-settings-page-design.md`

**Testing strategy:** This codebase is V1 frontend-only with no test runner installed. Verification per task is **manual**: run `npm run dev`, hit the route in the browser at narrow + wide widths, in light + dark mode, and confirm the listed behaviors. Do not take screenshots — only report if something is broken (per `CLAUDE.md` Screenshot Rule).

**Frequent commits:** Each task ends with a commit. Use the existing `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` footer.

---

## File map

**Create:**
```
src/mocks/servers.js
src/mocks/paymentMethod.js
src/mocks/subscriptions.js
src/mocks/invoices.js
src/stores/useUserProfile.js
src/stores/usePaymentMethod.js
src/stores/useSubscriptions.js
src/pages/account/SettingsNav.jsx
src/pages/account/ProfilePanel.jsx
src/pages/account/PasswordModal.jsx
src/pages/account/PaymentPanel.jsx
src/pages/account/PaymentMethodCard.jsx
src/pages/account/EditPaymentModal.jsx
src/pages/account/InvoicesTable.jsx
src/pages/account/SubscriptionsList.jsx
src/pages/account/SubscriptionCard.jsx
src/pages/account/AddSubscriptionModal.jsx
src/pages/account/SubscriptionDetail.jsx
src/pages/account/PlanCard.jsx
src/pages/account/ServerCard.jsx
src/pages/account/ChangeServerModal.jsx
src/pages/account/CancelSubscriptionModal.jsx
src/pages/account/ConfirmGrowthPlusModal.jsx
```

**Modify:**
```
src/pages/account/index.jsx       # full rewrite from placeholder → settings shell
src/App.jsx                        # nested /account routes + redirect
src/components/DashboardLayout.jsx # nav swap (System status → Settings) + mobile header
```

**Retain unmodified (parked):**
```
src/components/SystemStatus.jsx
src/hooks/useSystemStatus.js
src/mocks/systemStatus.js
```

---

## Task 1: Mock data — servers, payment method

**Files:**
- Create: `src/mocks/servers.js`
- Create: `src/mocks/paymentMethod.js`

- [ ] **Step 1: Create `src/mocks/servers.js`**

```js
// Server / region options for a subscription. The `id` is the
// canonical key stored on the subscription; `label` is the compact
// chip text and `region` is the longer descriptive label used in
// the picker modal.
export const mockServers = [
  { id: 'us-east', label: 'US-East', region: 'United States (East)' },
  { id: 'us-west', label: 'US-West', region: 'United States (West)' },
  { id: 'eu-west', label: 'EU-West', region: 'Europe (West)' },
  { id: 'ap-southeast', label: 'AP-Southeast', region: 'Asia-Pacific (Southeast)' },
]

export function findServer(id) {
  return mockServers.find((s) => s.id === id) ?? mockServers[0]
}
```

- [ ] **Step 2: Create `src/mocks/paymentMethod.js`**

```js
// Single shared payment method on the user account. Per the spec,
// the user always has a card on file (signup requires it) — there
// is no empty state.
export const mockPaymentMethod = {
  brand: 'visa',
  last4: '4242',
  expMonth: 9,
  expYear: 2027,
  billingEmail: 'alex@example.com',
}
```

- [ ] **Step 3: Commit**

```bash
git add src/mocks/servers.js src/mocks/paymentMethod.js
git commit -m "$(cat <<'EOF'
feat(mocks): add servers + paymentMethod fixtures for settings

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Mock data — subscriptions, invoices

**Files:**
- Create: `src/mocks/subscriptions.js`
- Create: `src/mocks/invoices.js`

- [ ] **Step 1: Inspect `src/mocks/accounts.js` to align ids**

Run: `cat src/mocks/accounts.js`

Note the existing account ids (e.g., `acc_001`, `acc_002`, `acc_003`). The subscription mock must reference these exact ids. Use the actual ids you find — the snippets below assume `acc_001`/`acc_002`/`acc_003`. If your file uses different ids, adjust accordingly before continuing.

- [ ] **Step 2: Create `src/mocks/subscriptions.js`**

```js
// One subscription per connected IG account. Joins back to
// `mockAccounts` via `accountId`. Status mix gives the UI variety:
// one trialing, one active, one past_due.
export const mockSubscriptions = [
  {
    id: 'sub_001',
    accountId: 'acc_001',
    plan: 'advanced',
    growthPlus: true,
    server: 'us-east',
    status: 'active',
    trialEndsAt: null,
    nextBillingAt: '2026-05-01T00:00:00Z',
    nextBillingAmount: 59,
    startedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'sub_002',
    accountId: 'acc_002',
    plan: 'growth',
    growthPlus: false,
    server: 'eu-west',
    status: 'trialing',
    trialEndsAt: '2026-05-10T00:00:00Z',
    nextBillingAt: '2026-05-10T00:00:00Z',
    nextBillingAmount: 29,
    startedAt: '2026-04-26T00:00:00Z',
  },
  {
    id: 'sub_003',
    accountId: 'acc_003',
    plan: 'advanced',
    growthPlus: false,
    server: 'us-west',
    status: 'past_due',
    trialEndsAt: null,
    nextBillingAt: '2026-04-15T00:00:00Z',
    nextBillingAmount: 49,
    startedAt: '2026-02-10T00:00:00Z',
  },
]
```

- [ ] **Step 3: Create `src/mocks/invoices.js`**

```js
// Invoice history across all subscriptions. Newest first. Mix of
// statuses so the table renders all three pill colors. The
// `description` field is what the consolidated billing-history view
// displays; the per-subscription detail filters by `subscriptionId`.
export const mockInvoices = [
  {
    id: 'inv_001',
    subscriptionId: 'sub_001',
    date: '2026-04-01T00:00:00Z',
    amount: 59,
    description: 'Advanced plan + Growth+ — @alexjohnson.co',
    status: 'paid',
    pdfUrl: null,
  },
  {
    id: 'inv_002',
    subscriptionId: 'sub_001',
    date: '2026-03-01T00:00:00Z',
    amount: 59,
    description: 'Advanced plan + Growth+ — @alexjohnson.co',
    status: 'paid',
    pdfUrl: null,
  },
  {
    id: 'inv_003',
    subscriptionId: 'sub_001',
    date: '2026-02-01T00:00:00Z',
    amount: 49,
    description: 'Advanced plan — @alexjohnson.co',
    status: 'paid',
    pdfUrl: null,
  },
  {
    id: 'inv_004',
    subscriptionId: 'sub_003',
    date: '2026-04-15T00:00:00Z',
    amount: 49,
    description: 'Advanced plan — @fitclub.brand',
    status: 'failed',
    pdfUrl: null,
  },
  {
    id: 'inv_005',
    subscriptionId: 'sub_003',
    date: '2026-03-15T00:00:00Z',
    amount: 49,
    description: 'Advanced plan — @fitclub.brand',
    status: 'paid',
    pdfUrl: null,
  },
  {
    id: 'inv_006',
    subscriptionId: 'sub_003',
    date: '2026-02-15T00:00:00Z',
    amount: 49,
    description: 'Advanced plan — @fitclub.brand',
    status: 'paid',
    pdfUrl: null,
  },
  {
    id: 'inv_007',
    subscriptionId: 'sub_002',
    date: '2026-05-10T00:00:00Z',
    amount: 29,
    description: 'Growth plan — @alex.personal',
    status: 'pending',
    pdfUrl: null,
  },
  {
    id: 'inv_008',
    subscriptionId: 'sub_001',
    date: '2026-01-15T00:00:00Z',
    amount: 49,
    description: 'Advanced plan — @alexjohnson.co',
    status: 'paid',
    pdfUrl: null,
  },
]

export function invoicesForSubscription(subscriptionId) {
  return mockInvoices.filter((i) => i.subscriptionId === subscriptionId)
}
```

- [ ] **Step 4: Commit**

```bash
git add src/mocks/subscriptions.js src/mocks/invoices.js
git commit -m "$(cat <<'EOF'
feat(mocks): seed subscriptions + invoices for settings

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Store — useUserProfile

**Files:**
- Create: `src/stores/useUserProfile.js`

- [ ] **Step 1: Inspect `src/mocks/user.js`**

Run: `cat src/mocks/user.js`

Verify `mockUser.name` is a single string ("Alex Johnson"). The store splits this into `firstName` / `lastName` on initialization.

- [ ] **Step 2: Create `src/stores/useUserProfile.js`**

```js
import { create } from 'zustand'
import { mockUser } from '@/mocks/user'
import { useToasts } from '@/stores/useToasts'

// Split "First Last" → { firstName, lastName }. If the mock has only
// one token we keep it in firstName and leave lastName empty.
function splitName(full) {
  const parts = String(full ?? '').trim().split(/\s+/)
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ') ?? '',
  }
}

const initialName = splitName(mockUser.name)

// User profile (the human, not the IG account). Edits here propagate
// to the profile dropdown and Account header. SMS comm pref auto-
// flips off if the phone number is removed.
export const useUserProfile = create((set, get) => ({
  firstName: initialName.firstName,
  lastName: initialName.lastName,
  email: mockUser.email,
  phoneCountry: 'US',
  phoneNumber: null,
  commPrefs: { email: true, sms: false },

  setName: ({ firstName, lastName }) => {
    set({ firstName: firstName.trim(), lastName: lastName.trim() })
    useToasts.getState().addToast({ message: 'Name updated.', tone: 'success' })
  },

  setEmail: (email) => {
    set({ email: email.trim() })
    useToasts.getState().addToast({
      message: `Verification link sent to ${email.trim()}.`,
      tone: 'success',
    })
  },

  setPhone: ({ country, number }) => {
    const trimmed = number?.trim() || null
    set({ phoneCountry: country, phoneNumber: trimmed })
    if (!trimmed) {
      // Removing the phone number disables the SMS channel.
      set((state) => ({ commPrefs: { ...state.commPrefs, sms: false } }))
    }
    useToasts.getState().addToast({
      message: trimmed ? 'Phone number updated.' : 'Phone number removed.',
      tone: 'success',
    })
  },

  setCommPref: (channel, on) => {
    // Per spec: at least one channel must remain on. Block toggles
    // that would turn the last channel off.
    const current = get().commPrefs
    const next = { ...current, [channel]: on }
    if (!next.email && !next.sms) {
      useToasts.getState().addToast({
        message: 'At least one contact channel must remain on.',
        tone: 'error',
      })
      return
    }
    set({ commPrefs: next })
  },

  // Mock password change. Resolves with `{ ok: true }` if `current`
  // matches a fake stored value ("password"), else `{ ok: false, error }`.
  // Replace with real call when backend lands.
  changePassword: async ({ current, next }) => {
    if (current !== 'password') {
      return { ok: false, error: 'Current password is incorrect.' }
    }
    if (!next || next.length < 8) {
      return { ok: false, error: 'New password must be at least 8 characters.' }
    }
    useToasts.getState().addToast({ message: 'Password updated.', tone: 'success' })
    return { ok: true }
  },
}))

export function useFullName() {
  return useUserProfile((s) => `${s.firstName} ${s.lastName}`.trim())
}
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/useUserProfile.js
git commit -m "$(cat <<'EOF'
feat(stores): add useUserProfile for settings panel

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Store — usePaymentMethod + useSubscriptions

**Files:**
- Create: `src/stores/usePaymentMethod.js`
- Create: `src/stores/useSubscriptions.js`

- [ ] **Step 1: Create `src/stores/usePaymentMethod.js`**

```js
import { create } from 'zustand'
import { mockPaymentMethod } from '@/mocks/paymentMethod'
import { useToasts } from '@/stores/useToasts'

// Single card on file. All subscriptions bill against this card.
// `update` accepts a partial — callers pass only the fields they
// changed.
export const usePaymentMethod = create((set) => ({
  ...mockPaymentMethod,

  update: (patch) => {
    set((state) => ({ ...state, ...patch }))
    useToasts.getState().addToast({ message: 'Payment method updated.', tone: 'success' })
  },
}))
```

- [ ] **Step 2: Create `src/stores/useSubscriptions.js`**

```js
import { create } from 'zustand'
import { mockSubscriptions } from '@/mocks/subscriptions'
import { useToasts } from '@/stores/useToasts'

// Per-IG-account subscriptions. Mutations here are local-only in
// V1; replace with API calls when backend lands. `getById` is a
// helper for the detail route.
export const useSubscriptions = create((set, get) => ({
  subscriptions: mockSubscriptions,

  getById: (id) => get().subscriptions.find((s) => s.id === id),

  setServer: (id, serverId) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, server: serverId } : s,
      ),
    }))
    useToasts.getState().addToast({ message: 'Server updated.', tone: 'success' })
  },

  toggleGrowthPlus: (id) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, growthPlus: !s.growthPlus } : s,
      ),
    }))
    const sub = get().subscriptions.find((s) => s.id === id)
    useToasts.getState().addToast({
      message: sub?.growthPlus ? 'Growth+ added.' : 'Growth+ removed.',
      tone: 'success',
    })
  },
}))
```

- [ ] **Step 3: Commit**

```bash
git add src/stores/usePaymentMethod.js src/stores/useSubscriptions.js
git commit -m "$(cat <<'EOF'
feat(stores): add usePaymentMethod + useSubscriptions

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Routes — wire `/account/*` in App.jsx

**Files:**
- Modify: `src/App.jsx`
- Create: `src/pages/account/SettingsNav.jsx` (placeholder, fleshed out next task)

- [ ] **Step 1: Create stub `src/pages/account/SettingsNav.jsx`**

This stub lets the shell render so we can verify routing before building real navigation.

```jsx
import { NavLink } from 'react-router-dom'

const items = [
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/payment', label: 'Payment' },
  { to: '/account/subscriptions', label: 'Subscriptions' },
]

export default function SettingsNav() {
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm font-medium ${
              isActive ? 'bg-blue-tint text-blue-text' : 'text-text-secondary hover:bg-bg'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Replace `src/pages/account/index.jsx` with the settings shell**

```jsx
import { Outlet } from 'react-router-dom'
import SettingsNav from './SettingsNav'

// Settings shell. Renders the page title, the secondary settings nav
// (left column on desktop, top row on mobile), and the active panel
// via <Outlet />. Children are routed under /account/*.
export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account, payments, and subscriptions.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SettingsNav />
        </aside>
        <section>
          <Outlet />
        </section>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Update `src/App.jsx` — nest routes under `/account`**

Replace the single `<Route path="/account" element={<AccountPage />} />` line with the nested block. Keep the existing `/account/growth-plus` route in place (it currently sits as a sibling under DashboardLayout; we leave it there).

```jsx
import { Routes, Route, Navigate } from 'react-router-dom'
// ... existing imports ...
import ProfilePanel from '@/pages/account/ProfilePanel'
import PaymentPanel from '@/pages/account/PaymentPanel'
import SubscriptionsList from '@/pages/account/SubscriptionsList'
import SubscriptionDetail from '@/pages/account/SubscriptionDetail'

// ... inside the DashboardLayout block, replace the /account line with: ...
<Route path="/account" element={<AccountPage />}>
  <Route index element={<Navigate to="/account/profile" replace />} />
  <Route path="profile" element={<ProfilePanel />} />
  <Route path="payment" element={<PaymentPanel />} />
  <Route path="subscriptions" element={<SubscriptionsList />} />
  <Route path="subscriptions/:id" element={<SubscriptionDetail />} />
</Route>
```

- [ ] **Step 4: Create empty placeholder panels so the routes resolve**

Each file is a one-line stub. Real content lands in later tasks. Create:

`src/pages/account/ProfilePanel.jsx`:
```jsx
export default function ProfilePanel() {
  return <div className="text-sm text-text-secondary">Profile (placeholder)</div>
}
```

`src/pages/account/PaymentPanel.jsx`:
```jsx
export default function PaymentPanel() {
  return <div className="text-sm text-text-secondary">Payment (placeholder)</div>
}
```

`src/pages/account/SubscriptionsList.jsx`:
```jsx
export default function SubscriptionsList() {
  return <div className="text-sm text-text-secondary">Subscriptions (placeholder)</div>
}
```

`src/pages/account/SubscriptionDetail.jsx`:
```jsx
export default function SubscriptionDetail() {
  return <div className="text-sm text-text-secondary">Subscription detail (placeholder)</div>
}
```

- [ ] **Step 5: Manual verification**

Run: `npm run dev` and open the app.

Verify:
- Hitting `/account` redirects to `/account/profile`.
- `/account/profile`, `/account/payment`, `/account/subscriptions`, `/account/subscriptions/sub_001` each render the placeholder text.
- The "Profile / Payment / Subscriptions" SettingsNav links work and the active item shows the blue tint.
- The page title "Settings" renders above the two-column layout on desktop and stacks on mobile.

- [ ] **Step 6: Commit**

```bash
git add src/App.jsx src/pages/account/
git commit -m "$(cat <<'EOF'
feat(account): add /account/* nested routes + settings shell skeleton

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Sidebar nav swap — System status → Settings

**Files:**
- Modify: `src/components/DashboardLayout.jsx`

- [ ] **Step 1: Update the imports**

In `src/components/DashboardLayout.jsx`, replace the existing icon import line that includes `Sparkles`/etc. with one that adds `Settings as SettingsIcon` from lucide. Replace the `SystemStatus` component import with nothing (we are removing both `SystemStatusRow` and `SystemStatusIconButton` from the layout).

```jsx
// REPLACE:
//   import { BarChart3, Target, TrendingUp, PanelLeftClose, PanelLeftOpen, LogOut, Bell, AlertTriangle, TrendingUp as GrowthIcon, X, Sparkles, ChevronsUpDown, Plus, Check } from 'lucide-react'
//   import { SystemStatusRow, SystemStatusIconButton } from '@/components/SystemStatus'
// WITH:
import { BarChart3, Target, TrendingUp, PanelLeftClose, PanelLeftOpen, LogOut, Bell, AlertTriangle, TrendingUp as GrowthIcon, X, Sparkles, ChevronsUpDown, Plus, Check, Settings as SettingsIcon } from 'lucide-react'
```

(Delete the `SystemStatus` import line entirely.)

- [ ] **Step 2: Replace the `SystemStatusRow` in the desktop sidebar with a Settings nav entry**

Find the bottom-of-sidebar block (around line 415 in the current file). Replace `<SystemStatusRow collapsed={collapsed} />` with a `<NavLink>` to `/account` styled like the existing primary tabs but rendered in this bottom section so it sits directly above Collapse.

```jsx
{/* Settings — replaces System status. Routes to /account, which
    redirects to /account/profile. Active when path starts with
    /account so subscription drilldowns also light up the entry. */}
<NavLink
  to="/account"
  title={collapsed ? 'Settings' : undefined}
  className={({ isActive }) =>
    cn(
      'flex items-center rounded-lg text-sm font-medium transition-colors',
      collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
      isActive
        ? 'bg-blue-tint text-blue-text'
        : 'text-text-secondary hover:bg-bg hover:text-text-primary'
    )
  }
>
  <SettingsIcon className="h-5 w-5 shrink-0" />
  {!collapsed && 'Settings'}
</NavLink>
```

- [ ] **Step 3: Remove the `<SystemStatusIconButton />` from the mobile top header**

Find the mobile header (around line 462). Replace the left slot with an empty spacer so the centered logo stays centered.

```jsx
// REPLACE the line:
//   <SystemStatusIconButton />
// WITH:
<div className="h-10 w-10" aria-hidden="true" />
```

- [ ] **Step 4: Manual verification**

Run: `npm run dev`.

Verify:
- Desktop sidebar: System status row is gone; a "Settings" entry with the gear icon now sits where System status was. Clicking it lands on `/account/profile`. The Settings entry stays highlighted on every `/account/*` route.
- Mobile top header: the left-side System status icon button is gone; the Kicksta logo stays centered and the bell stays on the right.
- No console errors about missing imports.

- [ ] **Step 5: Commit**

```bash
git add src/components/DashboardLayout.jsx
git commit -m "$(cat <<'EOF'
feat(nav): replace System status with Settings entry

Sidebar bottom row swaps SystemStatusRow for a /account NavLink with
the gear icon; mobile top header drops the SystemStatusIconButton.
SystemStatus.jsx + useSystemStatus.js stay on disk, parked for reuse.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: ProfilePanel — name + email + phone + comm prefs

**Files:**
- Modify: `src/pages/account/ProfilePanel.jsx`

- [ ] **Step 1: Replace the placeholder with the full panel**

```jsx
import { useState } from 'react'
import { Pencil, X, Check } from 'lucide-react'
import { useUserProfile } from '@/stores/useUserProfile'

// One inline-editable row. Display mode shows label + value + Edit
// link; edit mode renders the supplied <inputs> + Save/Cancel.
function Row({ label, displayValue, isEditing, onEdit, onCancel, onSave, children, hint }) {
  return (
    <div className="border-b border-border py-4 last:border-b-0">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:gap-6">
        <div className="text-sm font-medium text-text-secondary lg:w-36 lg:shrink-0">{label}</div>
        <div className="flex-1">
          {isEditing ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">{children}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onSave}
                  className="inline-flex h-9 items-center gap-1 rounded-lg bg-blue-base px-3 text-sm font-medium text-white hover:opacity-90"
                >
                  <Check className="h-4 w-4" /> Save
                </button>
                <button
                  onClick={onCancel}
                  className="inline-flex h-9 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-bg"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="text-sm text-text-primary">{displayValue}</div>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-text hover:underline"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              )}
            </div>
          )}
          {hint && <p className="mt-2 text-xs text-text-muted">{hint}</p>}
        </div>
      </div>
    </div>
  )
}

export default function ProfilePanel() {
  const profile = useUserProfile()
  const [editing, setEditing] = useState(null) // 'name' | 'email' | 'phone' | null

  // Local draft state per editable row.
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [email, setEmail] = useState(profile.email)
  const [phoneCountry, setPhoneCountry] = useState(profile.phoneCountry)
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? '')
  const [emailError, setEmailError] = useState('')

  function startEdit(row) {
    setFirstName(profile.firstName)
    setLastName(profile.lastName)
    setEmail(profile.email)
    setPhoneCountry(profile.phoneCountry)
    setPhoneNumber(profile.phoneNumber ?? '')
    setEmailError('')
    setEditing(row)
  }

  function cancelEdit() {
    setEditing(null)
    setEmailError('')
  }

  function saveName() {
    if (!firstName.trim()) return
    profile.setName({ firstName, lastName })
    setEditing(null)
  }

  function saveEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.')
      return
    }
    profile.setEmail(email)
    setEditing(null)
  }

  function savePhone() {
    profile.setPhone({ country: phoneCountry, number: phoneNumber })
    setEditing(null)
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <Row
        label="Name"
        displayValue={`${profile.firstName} ${profile.lastName}`.trim() || '—'}
        isEditing={editing === 'name'}
        onEdit={() => startEdit('name')}
        onCancel={cancelEdit}
        onSave={saveName}
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="First name"
            className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-base focus:outline-none"
          />
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Last name"
            className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-base focus:outline-none"
          />
        </div>
      </Row>

      <Row
        label="Email"
        displayValue={profile.email}
        isEditing={editing === 'email'}
        onEdit={() => startEdit('email')}
        onCancel={cancelEdit}
        onSave={saveEmail}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value)
            setEmailError('')
          }}
          className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-base focus:outline-none"
        />
        {emailError && <p className="text-xs text-red-text" role="alert">{emailError}</p>}
      </Row>

      <Row
        label="Password"
        displayValue="••••••••"
        isEditing={false}
        onEdit={() => window.dispatchEvent(new CustomEvent('open-password-modal'))}
      />

      <Row
        label="Phone number"
        displayValue={
          profile.phoneNumber
            ? `+${countryCodeFor(profile.phoneCountry)} ${profile.phoneNumber}`
            : <span className="text-text-muted">Add phone number</span>
        }
        isEditing={editing === 'phone'}
        onEdit={() => startEdit('phone')}
        onCancel={cancelEdit}
        onSave={savePhone}
      >
        <div className="flex gap-2">
          <select
            value={phoneCountry}
            onChange={(e) => setPhoneCountry(e.target.value)}
            className="h-10 rounded-lg border border-border bg-surface px-2 text-sm text-text-primary focus:border-blue-base focus:outline-none"
          >
            <option value="US">US +1</option>
            <option value="GB">GB +44</option>
            <option value="DE">DE +49</option>
            <option value="FR">FR +33</option>
            <option value="AU">AU +61</option>
          </select>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="555 123 4567"
            className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-base focus:outline-none"
          />
        </div>
      </Row>

      <Row
        label="Communication"
        displayValue={
          <div className="flex flex-col gap-2">
            <CommToggle
              checked={profile.commPrefs.email}
              onChange={(on) => profile.setCommPref('email', on)}
              label="Email"
            />
            <CommToggle
              checked={profile.commPrefs.sms}
              onChange={(on) => profile.setCommPref('sms', on)}
              label="SMS"
              disabled={!profile.phoneNumber}
              disabledHint="Add a phone number to enable SMS"
            />
          </div>
        }
        hint="Used for billing alerts, security notifications, and account updates. Marketing emails are managed separately."
      />
    </div>
  )
}

function CommToggle({ checked, onChange, label, disabled, disabledHint }) {
  return (
    <label className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-border text-blue-base focus:ring-blue-base"
      />
      <span className="text-sm text-text-primary">{label}</span>
      {disabled && disabledHint && (
        <span className="text-xs text-text-muted">— {disabledHint}</span>
      )}
    </label>
  )
}

function countryCodeFor(country) {
  return { US: '1', GB: '44', DE: '49', FR: '33', AU: '61' }[country] ?? '1'
}
```

- [ ] **Step 2: Manual verification**

Run: `npm run dev`. Hit `/account/profile`.

Verify:
- All five rows render: Name, Email, Password, Phone number, Communication.
- Edit on Name shows two inputs side-by-side; Save updates the displayed name and shows a "Name updated." toast.
- Edit on Email validates format; saving an invalid email shows the inline error; saving a valid one shows a "Verification link sent" toast.
- Password row's Edit dispatches a `open-password-modal` event (no modal yet — that's Task 8).
- Phone row: editing without a number → SMS pref stays disabled; saving a number enables SMS toggle.
- Communication: turning off the only enabled channel shows an error toast and reverts.
- Light + dark + mobile + desktop widths all render cleanly.

- [ ] **Step 3: Commit**

```bash
git add src/pages/account/ProfilePanel.jsx
git commit -m "$(cat <<'EOF'
feat(account): build profile panel with inline edit

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: PasswordModal

**Files:**
- Create: `src/pages/account/PasswordModal.jsx`
- Modify: `src/pages/account/index.jsx` (mount the modal at shell level)

- [ ] **Step 1: Create `src/pages/account/PasswordModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Lock, X } from 'lucide-react'
import { useUserProfile } from '@/stores/useUserProfile'

// Change-password modal. Validates: current required, new ≥ 8 chars,
// confirm must match new. Mock current is "password" — see store.
export default function PasswordModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const changePassword = useUserProfile((s) => s.changePassword)

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setCurrent('')
    setNext('')
    setConfirm('')
    setError('')
    setBusy(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!current) return setError('Enter your current password.')
    if (next.length < 8) return setError('New password must be at least 8 characters.')
    if (next !== confirm) return setError('Passwords do not match.')
    setBusy(true)
    const result = await changePassword({ current, next })
    setBusy(false)
    if (!result.ok) {
      setError(result.error)
      return
    }
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-2xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
              <Lock className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Change password</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Field label="Current password" type="password" value={current} onChange={setCurrent} />
          <Field label="New password" type="password" value={next} onChange={setNext} hint="At least 8 characters." />
          <Field label="Confirm new password" type="password" value={confirm} onChange={setConfirm} />
          {error && <p className="text-xs text-red-text" role="alert">{error}</p>}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy}
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            {busy ? 'Saving...' : 'Update password'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, type, value, onChange, hint }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-blue-base focus:outline-none"
      />
      {hint && <span className="text-xs text-text-muted">{hint}</span>}
    </label>
  )
}
```

- [ ] **Step 2: Mount the modal in `src/pages/account/index.jsx`**

The Profile row dispatches a `open-password-modal` event. Mount the modal at the shell so it's available on every `/account/*` route, and listen for the event there.

```jsx
import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import SettingsNav from './SettingsNav'
import PasswordModal from './PasswordModal'

export default function AccountPage() {
  const [passwordOpen, setPasswordOpen] = useState(false)

  useEffect(() => {
    function open() {
      setPasswordOpen(true)
    }
    window.addEventListener('open-password-modal', open)
    return () => window.removeEventListener('open-password-modal', open)
  }, [])

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account, payments, and subscriptions.
        </p>
      </header>

      <div className="mt-6 grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SettingsNav />
        </aside>
        <section>
          <Outlet />
        </section>
      </div>

      <PasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 3: Manual verification**

Verify:
- Clicking Edit on the Password row opens the modal with the slide-up animation.
- Submitting with current = `password` and matching new/confirm (≥ 8 chars) closes the modal and shows the "Password updated" toast.
- Wrong current password → inline error.
- Mismatched new/confirm → inline error.
- ESC closes the modal.
- Light/dark + mobile bottom-sheet vs desktop centered.

- [ ] **Step 4: Commit**

```bash
git add src/pages/account/PasswordModal.jsx src/pages/account/index.jsx
git commit -m "$(cat <<'EOF'
feat(account): add change-password modal

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: PaymentMethodCard + EditPaymentModal

**Files:**
- Create: `src/pages/account/PaymentMethodCard.jsx`
- Create: `src/pages/account/EditPaymentModal.jsx`

- [ ] **Step 1: Create `src/pages/account/PaymentMethodCard.jsx`**

```jsx
import { useState } from 'react'
import { CreditCard, Pencil } from 'lucide-react'
import { usePaymentMethod } from '@/stores/usePaymentMethod'
import EditPaymentModal from './EditPaymentModal'

function brandLabel(brand) {
  return { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex' }[brand] ?? 'Card'
}

export default function PaymentMethodCard() {
  const card = usePaymentMethod()
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-text-primary">
              {brandLabel(card.brand)} ending in {card.last4}
            </p>
            <p className="text-xs text-text-secondary">
              Expires {String(card.expMonth).padStart(2, '0')}/{card.expYear}
            </p>
            <p className="text-xs text-text-secondary">Billing email: {card.billingEmail}</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-text hover:underline"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>

      <EditPaymentModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 2: Create `src/pages/account/EditPaymentModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { CreditCard, X } from 'lucide-react'
import { usePaymentMethod } from '@/stores/usePaymentMethod'

// Mock payment edit. Detects brand from the card-number prefix and
// stores the last 4 digits + expiry + billing email. No real
// processing — replace with Stripe Elements when backend lands.
function detectBrand(num) {
  const n = num.replace(/\D/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  return 'card'
}

export default function EditPaymentModal({ open, onClose }) {
  const card = usePaymentMethod()
  const update = usePaymentMethod((s) => s.update)

  const [mounted, setMounted] = useState(false)
  const [number, setNumber] = useState('')
  const [exp, setExp] = useState('')
  const [cvc, setCvc] = useState('')
  const [billingEmail, setBillingEmail] = useState(card.billingEmail)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setNumber('')
    setExp('')
    setCvc('')
    setBillingEmail(card.billingEmail)
    setError('')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, card.billingEmail])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  function handleSubmit(e) {
    e.preventDefault()
    const digits = number.replace(/\D/g, '')
    if (digits.length < 13) return setError('Enter a valid card number.')
    const m = exp.match(/^(\d{2})\s*\/\s*(\d{2,4})$/)
    if (!m) return setError('Expiry must be MM/YY or MM/YYYY.')
    const month = parseInt(m[1], 10)
    if (month < 1 || month > 12) return setError('Invalid expiry month.')
    let year = parseInt(m[2], 10)
    if (year < 100) year += 2000
    if (cvc.replace(/\D/g, '').length < 3) return setError('Enter a valid CVC.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail.trim())) return setError('Enter a valid billing email.')
    update({
      brand: detectBrand(digits),
      last4: digits.slice(-4),
      expMonth: month,
      expYear: year,
      billingEmail: billingEmail.trim(),
    })
    onClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <form
        onSubmit={handleSubmit}
        className={`w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-2xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
              <CreditCard className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Edit payment method</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Labeled label="Card number">
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="4242 4242 4242 4242"
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-blue-base focus:outline-none"
            />
          </Labeled>
          <div className="grid grid-cols-2 gap-3">
            <Labeled label="Expiry">
              <input
                type="text"
                value={exp}
                onChange={(e) => setExp(e.target.value)}
                placeholder="MM/YY"
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-blue-base focus:outline-none"
              />
            </Labeled>
            <Labeled label="CVC">
              <input
                type="text"
                inputMode="numeric"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                placeholder="123"
                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-blue-base focus:outline-none"
              />
            </Labeled>
          </div>
          <Labeled label="Billing email">
            <input
              type="email"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-blue-base focus:outline-none"
            />
          </Labeled>
          {error && <p className="text-xs text-red-text" role="alert">{error}</p>}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Save card
          </button>
        </div>
      </form>
    </div>
  )
}

function Labeled({ label, children }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-text-secondary">{label}</span>
      {children}
    </label>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/account/PaymentMethodCard.jsx src/pages/account/EditPaymentModal.jsx
git commit -m "$(cat <<'EOF'
feat(account): add payment method card + edit modal

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: InvoicesTable (shared)

**Files:**
- Create: `src/pages/account/InvoicesTable.jsx`

- [ ] **Step 1: Create `src/pages/account/InvoicesTable.jsx`**

This component is reused by `PaymentPanel` (consolidated history) and `SubscriptionDetail` (filtered by sub id). Empty state copy is a prop so the two consumers can phrase it differently.

```jsx
import { Download } from 'lucide-react'
import { useToasts } from '@/stores/useToasts'

const STATUS_CLS = {
  paid: 'bg-green-tint text-green-text',
  failed: 'bg-red-tint text-red-text',
  pending: 'bg-yellow-tint text-yellow-text',
}
const STATUS_LABEL = {
  paid: 'Paid',
  failed: 'Failed',
  pending: 'Pending',
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function InvoicesTable({ invoices, emptyMessage = 'No invoices yet.' }) {
  function handleDownload() {
    useToasts.getState().addToast({
      message: 'Invoice download coming soon.',
      tone: 'success',
    })
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-secondary shadow-sm">
        {emptyMessage}
      </div>
    )
  }

  // Newest first.
  const sorted = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      {/* Desktop: real table */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="border-b border-border bg-bg/40 text-xs uppercase tracking-wide text-text-secondary">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((inv) => (
            <tr key={inv.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3 text-text-primary">{formatDate(inv.date)}</td>
              <td className="px-4 py-3 text-text-secondary">{inv.description}</td>
              <td className="px-4 py-3 font-medium text-text-primary">${inv.amount.toFixed(2)}</td>
              <td className="px-4 py-3">
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[inv.status]}`}>
                  {STATUS_LABEL[inv.status]}
                </span>
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={handleDownload}
                  className="inline-flex items-center gap-1 text-sm font-medium text-blue-text hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: stacked rows */}
      <ul className="divide-y divide-border md:hidden">
        {sorted.map((inv) => (
          <li key={inv.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text-primary">{formatDate(inv.date)}</span>
              <span className="text-sm font-semibold text-text-primary">${inv.amount.toFixed(2)}</span>
            </div>
            <p className="truncate text-xs text-text-secondary">{inv.description}</p>
            <div className="flex items-center justify-between gap-3">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[inv.status]}`}>
                {STATUS_LABEL[inv.status]}
              </span>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-1 text-sm font-medium text-blue-text"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/account/InvoicesTable.jsx
git commit -m "$(cat <<'EOF'
feat(account): add reusable invoices table

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: PaymentPanel — assemble payment view

**Files:**
- Modify: `src/pages/account/PaymentPanel.jsx`

- [ ] **Step 1: Replace placeholder with full panel**

```jsx
import PaymentMethodCard from './PaymentMethodCard'
import InvoicesTable from './InvoicesTable'
import { mockInvoices } from '@/mocks/invoices'

export default function PaymentPanel() {
  return (
    <div className="flex flex-col gap-6">
      <PaymentMethodCard />
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-text-primary">Billing history</h2>
        <InvoicesTable
          invoices={mockInvoices}
          emptyMessage="No invoices yet — your first charge will appear here after your trial ends."
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Manual verification**

Hit `/account/payment`.

Verify:
- Card on file displays the Visa ending in 4242 row.
- Edit opens the payment modal; saving with a Mastercard number (e.g. `5555 5555 5555 4444`, exp `12/30`, cvc `123`) updates the displayed brand to "Mastercard" and the last4.
- Billing history lists all 8 invoices with mixed statuses, sorted newest first.
- Download click shows the "coming soon" toast.
- Mobile stacks correctly; desktop shows the table.

- [ ] **Step 3: Commit**

```bash
git add src/pages/account/PaymentPanel.jsx
git commit -m "$(cat <<'EOF'
feat(account): build payment panel (method + billing history)

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: SubscriptionsList + SubscriptionCard

**Files:**
- Create: `src/pages/account/SubscriptionCard.jsx`
- Create: `src/pages/account/AddSubscriptionModal.jsx`
- Modify: `src/pages/account/SubscriptionsList.jsx`

- [ ] **Step 1: Create `src/pages/account/SubscriptionCard.jsx`**

```jsx
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAccounts } from '@/stores/useAccounts'
import { findServer } from '@/mocks/servers'

const STATUS_PILL = {
  active: { cls: 'bg-green-tint text-green-text', label: 'Active' },
  trialing: { cls: 'bg-blue-tint text-blue-text', label: 'Trialing' },
  past_due: { cls: 'bg-red-tint text-red-text', label: 'Past due' },
  canceled: { cls: 'bg-bg text-text-secondary', label: 'Canceled' },
}

function letterFor(username) {
  return String(username ?? '').replace(/^@/, '').charAt(0).toUpperCase() || '·'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function SubscriptionCard({ subscription }) {
  const accounts = useAccounts((s) => s.accounts)
  const account = accounts.find((a) => a.id === subscription.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[subscription.status] ?? STATUS_PILL.active
  const server = findServer(subscription.server)
  const planLabel = subscription.plan === 'advanced' ? 'Advanced plan' : 'Growth plan'

  return (
    <Link
      to={`/account/subscriptions/${subscription.id}`}
      className="block rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md md:p-6"
    >
      <div className="flex items-start gap-3">
        {profilePic ? (
          <img
            src={profilePic}
            alt=""
            className="h-10 w-10 shrink-0 rounded-full object-cover"
          />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-tint text-sm font-semibold text-blue-text">
            {letterFor(username)}
          </span>
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text-primary">{username}</p>
            <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${pill.cls}`}>
              {pill.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            {planLabel}
            {subscription.growthPlus ? ' · Growth+' : ''}
          </p>
          <div className="mt-3 grid gap-1 text-xs text-text-secondary sm:grid-cols-2">
            <p>Server: <span className="text-text-primary">{server.label}</span></p>
            <p>
              Next billing:{' '}
              <span className="text-text-primary">
                ${subscription.nextBillingAmount} on {formatDate(subscription.nextBillingAt)}
              </span>
            </p>
          </div>
        </div>
        <ChevronRight className="hidden h-5 w-5 shrink-0 text-text-muted lg:block" />
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Create `src/pages/account/AddSubscriptionModal.jsx`**

Stub modal that routes to the existing connect-IG signup step.

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'

export default function AddSubscriptionModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!open) return
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <div
        className={`w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-2xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
              <Plus className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Add subscription</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-text-secondary">
          Connect another Instagram account to add a new subscription. You'll choose a plan
          and server during setup.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose()
              navigate('/signup/connect-instagram')
            }}
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Connect Instagram
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Replace placeholder `src/pages/account/SubscriptionsList.jsx`**

```jsx
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'
import SubscriptionCard from './SubscriptionCard'
import AddSubscriptionModal from './AddSubscriptionModal'

export default function SubscriptionsList() {
  const subs = useSubscriptions((s) => s.subscriptions)
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">Subscriptions</h2>
          <span className="inline-flex rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
            {subs.length}
          </span>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-1 rounded-lg bg-blue-base px-3 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add subscription
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {subs.map((sub) => (
          <SubscriptionCard key={sub.id} subscription={sub} />
        ))}
      </div>

      <AddSubscriptionModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 4: Manual verification**

Hit `/account/subscriptions`.

Verify:
- Three subscription cards render, one per `mockAccounts` entry.
- Each shows avatar (image or letter chip), username, status pill (active/trialing/past_due), plan + Growth+ flag, server label, next billing line.
- Clicking a card navigates to `/account/subscriptions/<id>` (placeholder text for now).
- "Add subscription" opens the modal; "Connect Instagram" routes to `/signup/connect-instagram`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/account/SubscriptionsList.jsx src/pages/account/SubscriptionCard.jsx src/pages/account/AddSubscriptionModal.jsx
git commit -m "$(cat <<'EOF'
feat(account): build subscriptions list + add-subscription stub

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: Subscription detail shell + header

**Files:**
- Modify: `src/pages/account/SubscriptionDetail.jsx`

- [ ] **Step 1: Replace placeholder with header + redirect-on-bad-id**

```jsx
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { useAccounts } from '@/stores/useAccounts'

const STATUS_PILL = {
  active: { cls: 'bg-green-tint text-green-text', label: 'Active' },
  trialing: { cls: 'bg-blue-tint text-blue-text', label: 'Trialing' },
  past_due: { cls: 'bg-red-tint text-red-text', label: 'Past due' },
  canceled: { cls: 'bg-bg text-text-secondary', label: 'Canceled' },
}

function letterFor(username) {
  return String(username ?? '').replace(/^@/, '').charAt(0).toUpperCase() || '·'
}

export default function SubscriptionDetail() {
  const { id } = useParams()
  const sub = useSubscriptions((s) => s.subscriptions.find((x) => x.id === id))
  const accounts = useAccounts((s) => s.accounts)

  if (!sub) return <Navigate to="/account/subscriptions" replace />

  const account = accounts.find((a) => a.id === sub.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[sub.status] ?? STATUS_PILL.active

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/account/subscriptions"
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to subscriptions
      </Link>

      <div className="flex items-center gap-3">
        {profilePic ? (
          <img src={profilePic} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint text-base font-semibold text-blue-text">
            {letterFor(username)}
          </span>
        )}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-text-primary">{username}</h2>
          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${pill.cls}`}>
            {pill.label}
          </span>
        </div>
      </div>

      {/* Cards land here in subsequent tasks. */}
    </div>
  )
}
```

- [ ] **Step 2: Manual verification**

Hit `/account/subscriptions/sub_001`.

Verify:
- Back link returns to the list.
- Header shows avatar + `@alexjohnson.co` + green Active pill.
- Hitting `/account/subscriptions/does-not-exist` redirects to the list.

- [ ] **Step 3: Commit**

```bash
git add src/pages/account/SubscriptionDetail.jsx
git commit -m "$(cat <<'EOF'
feat(account): add subscription detail header + bad-id redirect

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: PlanCard + ConfirmGrowthPlusModal

**Files:**
- Create: `src/pages/account/PlanCard.jsx`
- Create: `src/pages/account/ConfirmGrowthPlusModal.jsx`
- Modify: `src/pages/account/SubscriptionDetail.jsx`

- [ ] **Step 1: Create `src/pages/account/ConfirmGrowthPlusModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'

export default function ConfirmGrowthPlusModal({ open, subscription, onClose }) {
  const [mounted, setMounted] = useState(false)
  const toggleGrowthPlus = useSubscriptions((s) => s.toggleGrowthPlus)
  const adding = !subscription?.growthPlus

  useEffect(() => {
    if (!open) return
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !subscription) return null

  function confirm() {
    toggleGrowthPlus(subscription.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <div
        className={`w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-2xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">
              {adding ? 'Add Growth+' : 'Remove Growth+'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-text-secondary">
          {adding
            ? 'Add Growth+ to this subscription for an additional $10/mo. Effective immediately.'
            : 'Remove Growth+ from this subscription. Your next bill will exclude the add-on.'}
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            {adding ? 'Add for $10/mo' : 'Remove Growth+'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/pages/account/PlanCard.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { useToasts } from '@/stores/useToasts'
import ConfirmGrowthPlusModal from './ConfirmGrowthPlusModal'

const PLAN_PRICE = { growth: 29, advanced: 49 }
const PLAN_LABEL = { growth: 'Growth', advanced: 'Advanced' }

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function PlanCard({ subscription }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)

  const planPrice = PLAN_PRICE[subscription.plan]
  const total = planPrice + (subscription.growthPlus ? 10 : 0)
  const isAdvanced = subscription.plan === 'advanced'

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <h3 className="text-base font-semibold text-text-primary">Plan</h3>

      <dl className="mt-3 flex flex-col gap-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-text-secondary">{PLAN_LABEL[subscription.plan]} plan</dt>
          <dd className="font-medium text-text-primary">${planPrice}/mo</dd>
        </div>
        {subscription.growthPlus && (
          <div className="flex items-center justify-between">
            <dt className="text-text-secondary">Growth+ add-on</dt>
            <dd className="font-medium text-text-primary">+$10/mo</dd>
          </div>
        )}
        <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
          <dt className="text-text-primary">Total</dt>
          <dd className="font-semibold text-text-primary">${total}/mo</dd>
        </div>
      </dl>

      {subscription.status === 'trialing' && subscription.trialEndsAt && (
        <p className="mt-3 text-xs text-text-secondary">
          Trial ends {formatDate(subscription.trialEndsAt)}.
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          disabled={isAdvanced}
          onClick={() => setUpgradeOpen(true)}
          title={isAdvanced ? 'Already on the Advanced plan' : undefined}
          className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Upgrade plan
        </button>
        <button
          onClick={() => setConfirmOpen(true)}
          className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg"
        >
          {subscription.growthPlus ? 'Remove Growth+' : 'Add Growth+'}
        </button>
      </div>

      <UpgradeStubModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
      <ConfirmGrowthPlusModal
        open={confirmOpen}
        subscription={subscription}
        onClose={() => setConfirmOpen(false)}
      />
    </div>
  )
}

function UpgradeStubModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!open) return
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
    useToasts.getState() // prime store reference (no-op)
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <div
        className={`w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-2xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <h2 className="text-base font-semibold text-text-primary">Upgrade plan</h2>
        <p className="mt-2 text-sm text-text-secondary">
          Plan comparison is coming soon. For now, contact support to upgrade.
        </p>
        <div className="mt-5 flex items-center justify-end">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Mount `<PlanCard>` inside `SubscriptionDetail.jsx`**

Edit `src/pages/account/SubscriptionDetail.jsx` — replace the placeholder comment with the import and JSX:

```jsx
// At the top, with the other imports:
import PlanCard from './PlanCard'

// Inside the return, where the comment was:
<PlanCard subscription={sub} />
```

- [ ] **Step 4: Manual verification**

On `/account/subscriptions/sub_001`:
- Plan card shows "Advanced plan $49/mo", "Growth+ add-on +$10/mo", "Total $59/mo".
- "Upgrade plan" is disabled (already Advanced); hovering shows the title tooltip.
- "Remove Growth+" → confirmation modal → confirming flips the toggle, closes the modal, fires "Growth+ removed." toast, the card recomputes (no Growth+ line, total $49).

On `/account/subscriptions/sub_002` (Growth plan, trialing):
- "Upgrade plan" is enabled and opens the stub modal.
- Trial line "Trial ends May 10, 2026" is visible.

- [ ] **Step 5: Commit**

```bash
git add src/pages/account/PlanCard.jsx src/pages/account/ConfirmGrowthPlusModal.jsx src/pages/account/SubscriptionDetail.jsx
git commit -m "$(cat <<'EOF'
feat(account): add plan card with Growth+ confirmation + upgrade stub

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: ServerCard + ChangeServerModal

**Files:**
- Create: `src/pages/account/ServerCard.jsx`
- Create: `src/pages/account/ChangeServerModal.jsx`
- Modify: `src/pages/account/SubscriptionDetail.jsx`

- [ ] **Step 1: Create `src/pages/account/ChangeServerModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Globe, X, Check } from 'lucide-react'
import { mockServers } from '@/mocks/servers'
import { useSubscriptions } from '@/stores/useSubscriptions'

export default function ChangeServerModal({ open, subscription, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [picked, setPicked] = useState(subscription?.server)
  const setServer = useSubscriptions((s) => s.setServer)

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setPicked(subscription?.server)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, subscription?.server])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !subscription) return null

  function save() {
    if (picked && picked !== subscription.server) {
      setServer(subscription.id, picked)
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <div
        className={`w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-2xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
              <Globe className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Change server</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-sm text-text-secondary">
          The server determines compliance region and proxy routing for this subscription.
        </p>

        <div className="flex flex-col gap-2">
          {mockServers.map((s) => {
            const isSelected = picked === s.id
            return (
              <button
                key={s.id}
                onClick={() => setPicked(s.id)}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                  isSelected
                    ? 'border-blue-base bg-blue-tint/40 shadow-md'
                    : 'border-border bg-surface hover:bg-bg'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{s.label}</p>
                  <p className="text-xs text-text-secondary">{s.region}</p>
                </div>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-blue-base" />}
              </button>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={picked === subscription.server}
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/pages/account/ServerCard.jsx`**

```jsx
import { useState } from 'react'
import { findServer } from '@/mocks/servers'
import ChangeServerModal from './ChangeServerModal'

export default function ServerCard({ subscription }) {
  const [open, setOpen] = useState(false)
  const server = findServer(subscription.server)

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <h3 className="text-base font-semibold text-text-primary">Server</h3>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-primary">{server.label}</p>
          <p className="text-xs text-text-secondary">{server.region}</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-bg"
        >
          Change
        </button>
      </div>
      <p className="mt-3 text-xs text-text-muted">
        Affects compliance region and proxy routing.
      </p>

      <ChangeServerModal open={open} subscription={subscription} onClose={() => setOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 3: Mount `<ServerCard>` inside `SubscriptionDetail.jsx`**

Add `import ServerCard from './ServerCard'` and render `<ServerCard subscription={sub} />` directly below `<PlanCard>`.

- [ ] **Step 4: Manual verification**

On `/account/subscriptions/sub_001`:
- Server card shows "US-East — United States (East)".
- Change opens the modal with all four options; current selection is highlighted.
- Save with a different choice closes the modal, updates the displayed server, fires "Server updated." toast.
- Save with the unchanged selection is disabled.

- [ ] **Step 5: Commit**

```bash
git add src/pages/account/ServerCard.jsx src/pages/account/ChangeServerModal.jsx src/pages/account/SubscriptionDetail.jsx
git commit -m "$(cat <<'EOF'
feat(account): add server card + change-server modal

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 16: Per-subscription invoices + cancel danger zone

**Files:**
- Create: `src/pages/account/CancelSubscriptionModal.jsx`
- Modify: `src/pages/account/SubscriptionDetail.jsx`

- [ ] **Step 1: Create `src/pages/account/CancelSubscriptionModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

// Stub for the eventual 6-step cancellation flow. Lets us ship the
// settings page now and design the real flow as its own spec.
export default function CancelSubscriptionModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!open) return
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <div
        className={`w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-2xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-tint text-red-text">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Cancel subscription</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-text-secondary">
          The full cancellation flow is coming soon. For now, contact support to cancel.
        </p>
        <div className="mt-5 flex items-center justify-end">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add invoices section + danger zone to `SubscriptionDetail.jsx`**

Final form of `src/pages/account/SubscriptionDetail.jsx`:

```jsx
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { useAccounts } from '@/stores/useAccounts'
import { invoicesForSubscription } from '@/mocks/invoices'
import PlanCard from './PlanCard'
import ServerCard from './ServerCard'
import InvoicesTable from './InvoicesTable'
import CancelSubscriptionModal from './CancelSubscriptionModal'

const STATUS_PILL = {
  active: { cls: 'bg-green-tint text-green-text', label: 'Active' },
  trialing: { cls: 'bg-blue-tint text-blue-text', label: 'Trialing' },
  past_due: { cls: 'bg-red-tint text-red-text', label: 'Past due' },
  canceled: { cls: 'bg-bg text-text-secondary', label: 'Canceled' },
}

function letterFor(username) {
  return String(username ?? '').replace(/^@/, '').charAt(0).toUpperCase() || '·'
}

export default function SubscriptionDetail() {
  const { id } = useParams()
  const sub = useSubscriptions((s) => s.subscriptions.find((x) => x.id === id))
  const accounts = useAccounts((s) => s.accounts)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!sub) return <Navigate to="/account/subscriptions" replace />

  const account = accounts.find((a) => a.id === sub.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[sub.status] ?? STATUS_PILL.active
  const invoices = invoicesForSubscription(sub.id)

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/account/subscriptions"
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to subscriptions
      </Link>

      <div className="flex items-center gap-3">
        {profilePic ? (
          <img src={profilePic} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint text-base font-semibold text-blue-text">
            {letterFor(username)}
          </span>
        )}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-text-primary">{username}</h2>
          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${pill.cls}`}>
            {pill.label}
          </span>
        </div>
      </div>

      <PlanCard subscription={sub} />
      <ServerCard subscription={sub} />

      <div className="flex flex-col gap-3">
        <h3 className="text-base font-semibold text-text-primary">Invoices</h3>
        <InvoicesTable
          invoices={invoices}
          emptyMessage="No invoices yet for this subscription."
        />
      </div>

      <div className="mt-2 flex flex-col gap-3 rounded-xl border border-border bg-bg p-4 md:flex-row md:items-center md:justify-between md:p-6">
        <div>
          <p className="text-sm font-semibold text-text-primary">Cancel subscription</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Cancel to stop growth and end billing for this account.
          </p>
        </div>
        <button
          onClick={() => setCancelOpen(true)}
          className="inline-flex h-10 shrink-0 items-center rounded-lg bg-red-tint px-4 text-sm font-medium text-red-text hover:bg-red-tint/80"
        >
          Cancel...
        </button>
      </div>

      <CancelSubscriptionModal open={cancelOpen} onClose={() => setCancelOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 3: Manual verification**

On `/account/subscriptions/sub_001`:
- Plan + Server cards render.
- Invoices section lists 4 invoices for this subscription only (the 4 with `subscriptionId === 'sub_001'`).
- Danger zone card sits at the bottom in muted styling (background `bg-bg`).
- "Cancel..." opens the stub modal with the red-tint warning chip.

On `/account/subscriptions/sub_002`:
- Invoices list shows only `inv_007`.

On `/account/subscriptions/sub_003`:
- Invoices list shows the three `sub_003` invoices, including the failed one with the red status pill.

- [ ] **Step 4: Commit**

```bash
git add src/pages/account/SubscriptionDetail.jsx src/pages/account/CancelSubscriptionModal.jsx
git commit -m "$(cat <<'EOF'
feat(account): wire per-sub invoices + cancellation stub into detail

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 17: SettingsNav — final polish (icons, mobile)

**Files:**
- Modify: `src/pages/account/SettingsNav.jsx`

- [ ] **Step 1: Replace stub with iconed nav**

```jsx
import { NavLink, useLocation } from 'react-router-dom'
import { User, CreditCard, Layers } from 'lucide-react'

const items = [
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/payment', label: 'Payment', icon: CreditCard },
  { to: '/account/subscriptions', label: 'Subscriptions', icon: Layers },
]

// Highlights the Subscriptions row when the user is deep in
// /account/subscriptions/:id so the secondary nav stays consistent
// with the breadcrumb the user sees.
function isSubActive(currentPath, itemPath) {
  if (itemPath === '/account/subscriptions') {
    return currentPath.startsWith('/account/subscriptions')
  }
  return currentPath === itemPath
}

export default function SettingsNav() {
  const { pathname } = useLocation()

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon }) => {
        const active = isSubActive(pathname, to)
        return (
          <NavLink
            key={to}
            to={to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-blue-tint text-blue-text' : 'text-text-secondary hover:bg-bg hover:text-text-primary'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        )
      })}
    </nav>
  )
}
```

- [ ] **Step 2: Manual verification**

Verify:
- Each nav item now has its icon (User / CreditCard / Layers).
- "Subscriptions" stays highlighted when you drill into `/account/subscriptions/sub_001`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/account/SettingsNav.jsx
git commit -m "$(cat <<'EOF'
feat(account): polish settings nav with icons + sticky-active drilldown

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 18: Final verification + CHANGELOG / CONTEXT updates

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `CONTEXT.md`

- [ ] **Step 1: End-to-end manual verification**

Run: `npm run dev`. Walk every route in light + dark, mobile + desktop:

- `/` (Overview) — sidebar still highlights nothing for `/account`.
- `/account` redirects to `/account/profile`.
- `/account/profile` — name/email/password/phone/comm flows work; toasts fire.
- `/account/payment` — card edit + invoice download stub work.
- `/account/subscriptions` — three cards; Add subscription stub routes to signup.
- `/account/subscriptions/sub_001` — plan card, server card, invoices (4 rows), cancel danger zone.
- `/account/subscriptions/sub_002` (trialing) — trial line shows; Upgrade enabled.
- `/account/subscriptions/sub_003` (past_due) — red status pill in header + on the failed invoice row.
- `/account/subscriptions/missing` redirects to list.
- Sidebar: Settings entry highlighted for every `/account/*` route. System status row gone. Mobile header has no system status icon button.
- Profile dropdown's "Account" item still routes to `/account/profile`.

- [ ] **Step 2: Add CHANGELOG entry**

Open `CHANGELOG.md`. Add at the top a new dated entry. Use today's date heading; if today already has an entry, append the bullets under its existing subsections.

```markdown
## 2026-04-29 — User settings page

### Created
- `/account/profile`, `/account/payment`, `/account/subscriptions`, `/account/subscriptions/:id` — full settings area with two-pane shell, inline-edit profile, card-on-file editor, consolidated + per-subscription invoice tables, plan/server/Growth+ controls.
- Stores: `useUserProfile`, `usePaymentMethod`, `useSubscriptions`.
- Mocks: `subscriptions.js`, `invoices.js`, `paymentMethod.js`, `servers.js`.
- Stub modals for Upgrade plan, Add subscription (routes to `/signup/connect-instagram`), Cancel subscription — full flows deferred to their own specs.

### Changed
- Sidebar nav: "System status" entry replaced by "Settings" routing to `/account`. Mobile top header drops the System Status icon button.

### Decisions
- Each connected IG account = one subscription; one shared payment method covers all.
- Plan upgrade, Add subscription, and Cancel subscription ship as stubs in this spec; full flows get their own specs later.

### Deferred / known gaps
- 6-step cancellation flow (separate spec).
- In-product upgrade comparison sheet (separate spec).
- Native Add-subscription flow (currently routes to signup connect-IG).
- Real email-change verification, real password update, real card processing — all mocked.
```

- [ ] **Step 3: Add CONTEXT.md update entry**

Open `CONTEXT.md`. Append to the update log section a new entry that names the feature, the new routes, the new stores, and the parked SystemStatus files. If `CONTEXT.md` has a "Stores (Zustand)" or "Pages" inventory section, add the new entries there as well.

Sample bullet for the update log:

> **2026-04-29 (user settings page)** — New `/account/*` settings area replacing the placeholder. Two-pane shell with Profile, Payment, Subscriptions list + detail. New stores: `useUserProfile`, `usePaymentMethod`, `useSubscriptions`. New mocks: `subscriptions`, `invoices`, `paymentMethod`, `servers`. Sidebar swap: System status → Settings (gear icon). `SystemStatus.jsx` + `useSystemStatus.js` + `mocks/systemStatus.js` parked but retained on disk. Upgrade / Add subscription / Cancel subscription ship as stub modals; real flows pending their own specs.

- [ ] **Step 4: Commit docs**

```bash
git add CHANGELOG.md CONTEXT.md
git commit -m "$(cat <<'EOF'
docs: log user settings page in CHANGELOG and CONTEXT

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review notes

- **Spec coverage:** every spec section maps to a task — Profile (T7+T8), Payment (T9+T10+T11), Subscriptions list (T12), Subscription detail header (T13), Plan card (T14), Server card (T15), Invoices + danger zone (T16), Settings nav polish (T17), nav swap (T6), routing (T5), mocks/stores (T1–T4), docs (T18).
- **No placeholders:** every step contains complete code or an exact instruction with the surrounding context. No "implement later" or "similar to Task N."
- **Type consistency:** subscription fields (`growthPlus`, `nextBillingAt`, `nextBillingAmount`, `trialEndsAt`, `status`), server `id`, store method names (`setName`, `setEmail`, `setPhone`, `setCommPref`, `changePassword`, `update`, `setServer`, `toggleGrowthPlus`, `getById`) match across tasks.
