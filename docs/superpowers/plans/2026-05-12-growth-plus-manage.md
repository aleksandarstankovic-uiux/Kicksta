# Growth+ Manage Subscription Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Growth+ subscription Manage popup, tier-change page, cancel flow, and cancelled-pending-end dashboard state.

**Architecture:** Hybrid surface. Manage popup is the entry point from BillingCard "Manage" and Banner "Manage subscription"; it routes either to the existing `/account/growth-plus` page (now a real tier-change page with proration confirm) or to a 3-step cancel modal. A new `cancelled_pending` subscription status layers banner + pill + Billing card adjustments onto the existing Active dashboard until the period ends, then routes to Upsell as a lapsed subscriber.

**Tech Stack:** React 19, React Router 7, Zustand 5, Tailwind v4, Lucide React. No test runner in this repo — each task verifies via `npm run build` + manual UI sanity check.

**Spec:** `docs/superpowers/specs/2026-05-12-growth-plus-manage-design.md`

---

## File map

**New:**
- `src/components/GrowthPlusManageModal.jsx` — entry popup
- `src/components/CancelGrowthPlusModal.jsx` — 3-step cancel flow + success ack
- `src/components/SwitchTierConfirmModal.jsx` — tier-change proration confirm + processing + success
- `src/pages/growthPlus/GrowthPlusCancelledBanner.jsx` — yellow-tint banner for cancelled_pending
- `src/utils/proration.js` — deterministic mock proration helper

**Modified:**
- `src/stores/useGrowthPlusSubscription.js` — add `status`, `endsAt`, `cancel`, `resume`, `_lapseForTesting`
- `src/pages/growthPlus/index.jsx` — branch on `status` (lapsed → Upsell, active/cancelled_pending → Active); auto-open Manage popup if `?manage=1`
- `src/pages/growthPlus/GrowthPlusActive.jsx` — owns Manage / Cancel / SwitchTier modal state; renders CancelledBanner when `cancelled_pending`
- `src/pages/growthPlus/GrowthPlusHero.jsx` — pill branches on `status` (yellow `Ending Jun 12` when cancelled_pending)
- `src/pages/growthPlus/GrowthPlusBillingCard.jsx` — "Manage" button opens ManageModal (via prop callback) instead of `<Link>`; label + ribbon adapt on `cancelled_pending`
- `src/components/GrowthPlusBanner.jsx` — "Manage subscription" link points to `/growth-plus?manage=1` instead of `/account/growth-plus`
- `src/pages/accountGrowthPlus/index.jsx` — full rewrite: tier-change page with 3 cards + current-tier marker + route guard

---

### Task 1: Extend subscription store with cancelled-pending state

**Files:**
- Modify: `src/stores/useGrowthPlusSubscription.js` (full rewrite)

- [ ] **Step 1: Replace the store file**

```jsx
import { create } from 'zustand'

// V1 override flag + cancellation lifecycle for the user's Growth+
// subscription. Status state machine:
//   active             → subscriber, full dashboard
//   cancelled_pending  → cancelled but paid-through; renders dashboard
//                        with banner + pill + billing-card adjustments
//   lapsed             → period ended; renders Upsell page
//
// `subscribed` stays for back-compat with the existing consumer in
// /growth-plus index.jsx until that consumer is migrated to `status`.
// Treat `subscribed === true` as `status === 'active'` for now.
//
// `endsAt` is an ISO date string set when the user cancels (mirrors
// `mockGrowthPlusNextBillingAt` at cancel time) and cleared on resume.
//
// _lapseForTesting() is a QA helper to flip into the lapsed state
// without waiting for the clock.
export const useGrowthPlusSubscription = create((set) => ({
  subscribed: null,
  status: 'active', // 'active' | 'cancelled_pending' | 'lapsed'
  endsAt: null,
  markSubscribed: () =>
    set({ subscribed: true, status: 'active', endsAt: null }),
  cancel: (endsAt) =>
    set({ status: 'cancelled_pending', endsAt }),
  resume: () =>
    set({ status: 'active', endsAt: null }),
  _lapseForTesting: () =>
    set({ status: 'lapsed', subscribed: false, endsAt: null }),
}))
```

- [ ] **Step 2: Run build to verify no syntax errors**

Run: `npm run build`
Expected: PASS (no TypeScript or syntax errors)

- [ ] **Step 3: Commit**

```bash
git add src/stores/useGrowthPlusSubscription.js
git commit -m "feat(growth-plus): extend subscription store with cancelled-pending state"
```

---

### Task 2: Add proration utility

**Files:**
- Create: `src/utils/proration.js`

- [ ] **Step 1: Create the file**

```jsx
// Deterministic mock proration for Growth+ tier changes.
//
// V1 has no backend, so we fake proration as a flat linear interpolation
// over a 30-day cycle. Real billing systems run more nuanced math, but
// this gives the user the same shape of feedback ("$X today" / "$X credit
// next bill") without lying about precision.
//
// Returns:
//   { kind: 'upgrade' | 'downgrade', amount: number }
// `amount` is always a non-negative whole-dollar integer.
//
// daysBetween clamps negative results to 0 so an already-past endsAt
// doesn't produce negative proration.

const DAYS_IN_CYCLE = 30

export function daysBetween(fromIso, toIso) {
  const from = new Date(fromIso).getTime()
  const to = new Date(toIso).getTime()
  const ms = to - from
  if (Number.isNaN(ms)) return 0
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

export function prorationFor({ oldPrice, newPrice, endsAt, today }) {
  const now = today ?? new Date().toISOString()
  const daysRemaining = daysBetween(now, endsAt)
  const diff = newPrice - oldPrice
  if (diff > 0) {
    return {
      kind: 'upgrade',
      amount: Math.round((diff * daysRemaining) / DAYS_IN_CYCLE),
    }
  }
  return {
    kind: 'downgrade',
    amount: Math.round((-diff * daysRemaining) / DAYS_IN_CYCLE),
  }
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/utils/proration.js
git commit -m "feat(growth-plus): add deterministic proration helper"
```

---

### Task 3: Branch GrowthPlusPage on subscription status + read manage query param

**Files:**
- Modify: `src/pages/growthPlus/index.jsx` (full rewrite)

- [ ] **Step 1: Rewrite the page**

```jsx
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { mockUser } from '@/mocks/user'
import { useAccounts } from '@/stores/useAccounts'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import GrowthPlusActive from './GrowthPlusActive'
import GrowthPlusUpsell from './GrowthPlusUpsell'

// /growth-plus page entry. Renders by subscription status:
//   active | cancelled_pending → GrowthPlusActive
//   lapsed                     → GrowthPlusUpsell
//
// Honors ?manage=1 by passing manageOpenOnMount through to
// GrowthPlusActive (which owns the Manage popup state). Used by
// GrowthPlusBanner so the banner can deep-link into the popup without
// the popup needing app-global state.
export default function GrowthPlusPage() {
  const subscribed = useGrowthPlusSubscription(
    (s) => s.subscribed ?? mockUser.growthPlusSubscribed,
  )
  const status = useGrowthPlusSubscription((s) => s.status)
  const activeAccount = useAccounts((s) =>
    s.accounts.find((a) => a.id === s.activeId),
  )
  const location = useLocation()
  const navigate = useNavigate()
  const [manageOpenOnMount, setManageOpenOnMount] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('manage') === '1') {
      setManageOpenOnMount(true)
      params.delete('manage')
      navigate(
        { pathname: location.pathname, search: params.toString() },
        { replace: true },
      )
    }
  }, [location.pathname, location.search, navigate])

  // lapsed → Upsell. Otherwise (active/cancelled_pending) → Active.
  const showActive = subscribed && status !== 'lapsed'

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header className="mb-5 md:mb-6">
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Growth+
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Algorithmic reach on top of your Targeted Growth.
        </p>
      </header>

      {showActive ? (
        <GrowthPlusActive
          account={activeAccount}
          manageOpenOnMount={manageOpenOnMount}
        />
      ) : (
        <GrowthPlusUpsell />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS (GrowthPlusActive currently ignores `manageOpenOnMount` — fine, wired in Task 5)

- [ ] **Step 3: Commit**

```bash
git add src/pages/growthPlus/index.jsx
git commit -m "feat(growth-plus): branch page on status + honor ?manage=1 deep-link"
```

---

### Task 4: Build GrowthPlusManageModal (active variant only)

**Files:**
- Create: `src/components/GrowthPlusManageModal.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ChevronRight, CreditCard, X } from 'lucide-react'
import { mockGrowthPlusNextBillingAt } from '@/mocks/user'
import { mockGrowthPlusTierById } from '@/mocks/growth'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Entry popup for Growth+ subscription management. Two variants:
//   - active            → shows Change tier + Cancel rows
//   - cancelled_pending → shows Resume subscription button (added in Task 13)
//
// Parent owns `open` and the two callbacks (onChangeTier, onCancel).
// `onResume` is wired in Task 13.
//
// Portal-rendered to escape any transformed ancestor; bottom-sheet on
// mobile, centered card on lg:+.
export default function GrowthPlusManageModal({
  open,
  onClose,
  onChangeTier,
  onCancel,
  onResume,
}) {
  const tierId = useGrowthConfig((s) => s.config.growthPlusControls.tier)
  const tier = mockGrowthPlusTierById[tierId]
  const status = useGrowthPlusSubscription((s) => s.status)
  const endsAt = useGrowthPlusSubscription((s) => s.endsAt)

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const isCancelledPending = status === 'cancelled_pending'

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose?.()
      }}
    >
      <div className="w-full rounded-t-2xl bg-surface shadow-xl lg:mx-4 lg:max-w-md lg:rounded-2xl">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-base font-semibold text-text-primary">
            Growth+ subscription
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pb-5 pt-3">
          {/* Current plan summary */}
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 ${
              isCancelledPending
                ? 'border-yellow-base/30 bg-yellow-tint'
                : 'border-purple-base/20 bg-purple-tint/40'
            }`}
          >
            <span
              aria-hidden="true"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg shadow-sm ${
                isCancelledPending
                  ? 'bg-yellow-base text-white'
                  : 'bg-purple-text text-surface'
              }`}
            >
              <CreditCard className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-text-primary">
                {tier ? `${tier.name} plan` : 'Growth+ plan'}
                {isCancelledPending && endsAt && (
                  <>
                    {' '}
                    <span className="text-yellow-text">
                      · Ending {formatDate(endsAt)}
                    </span>
                  </>
                )}
              </p>
              <p className="mt-0.5 text-xs text-text-secondary">
                {isCancelledPending
                  ? 'Full access until then.'
                  : tier
                    ? `$${tier.price}/mo · Next billing ${formatDate(mockGrowthPlusNextBillingAt)}`
                    : `Next billing ${formatDate(mockGrowthPlusNextBillingAt)}`}
              </p>
            </div>
          </div>

          {/* Actions */}
          {isCancelledPending ? (
            <button
              type="button"
              onClick={onResume}
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-green-base text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Resume subscription
            </button>
          ) : (
            <div className="mt-4 overflow-hidden rounded-xl border border-border">
              <button
                type="button"
                onClick={onChangeTier}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-bg"
              >
                <span className="text-sm font-medium text-text-primary">
                  Change tier
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-text-secondary"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex w-full items-center justify-between gap-3 border-t border-border px-4 py-4 text-left transition-colors hover:bg-red-tint/50"
              >
                <span className="text-sm font-medium text-red-text">
                  Cancel subscription
                </span>
                <ChevronRight
                  className="h-4 w-4 shrink-0 text-red-text"
                  aria-hidden="true"
                />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/GrowthPlusManageModal.jsx
git commit -m "feat(growth-plus): add Manage subscription entry popup"
```

---

### Task 5: Wire Manage popup into GrowthPlusActive + replace BillingCard Link with button

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusActive.jsx` (full rewrite)
- Modify: `src/pages/growthPlus/GrowthPlusBillingCard.jsx` (replace "Manage" Link with prop-callback button)

- [ ] **Step 1: Rewrite GrowthPlusActive.jsx**

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GrowthPlusManageModal from '@/components/GrowthPlusManageModal'
import GrowthPlusActivity from './GrowthPlusActivity'
import GrowthPlusBillingCard from './GrowthPlusBillingCard'
import GrowthPlusControls from './GrowthPlusControls'
import GrowthPlusHero from './GrowthPlusHero'
import GrowthPlusMetricsStrip from './GrowthPlusMetricsStrip'

// Subscriber dashboard for the Growth+ page. Hero → metrics →
// [Activity + Controls 2-col on lg:+] → Billing. Owns the Manage
// popup state — opened from Billing card "Manage" button or by
// ?manage=1 deep-link from the GrowthPlusBanner.
//
// `account` is captured for future per-account data wiring — V1 mocks
// don't vary per account.
//
// eslint-disable-next-line no-unused-vars
export default function GrowthPlusActive({ account, manageOpenOnMount = false }) {
  const navigate = useNavigate()
  const [manageOpen, setManageOpen] = useState(false)

  useEffect(() => {
    if (manageOpenOnMount) setManageOpen(true)
  }, [manageOpenOnMount])

  function handleChangeTier() {
    setManageOpen(false)
    navigate('/account/growth-plus')
  }

  function handleCancel() {
    setManageOpen(false)
    // Cancel modal wiring lands in Task 11.
  }

  function handleResume() {
    setManageOpen(false)
    // Resume wiring lands in Task 13c.
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <GrowthPlusHero />
      <GrowthPlusMetricsStrip />
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        <GrowthPlusActivity />
        <GrowthPlusControls />
      </div>
      <GrowthPlusBillingCard onManage={() => setManageOpen(true)} />

      <GrowthPlusManageModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        onChangeTier={handleChangeTier}
        onCancel={handleCancel}
        onResume={handleResume}
      />
    </div>
  )
}
```

- [ ] **Step 2: Update GrowthPlusBillingCard.jsx — replace Link with button**

Replace lines around the Manage link. Full file rewrite:

```jsx
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, CreditCard } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { mockGrowthPlusNextBillingAt } from '@/mocks/user'
import { mockGrowthPlusTierById, mockGrowthPlusTiers } from '@/mocks/growth'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

function formatBillingDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Next tier above the current one, or null if already on Elite. Used
// for the upgrade nudge ribbon at the bottom of the card.
function nextTier(currentId) {
  const i = mockGrowthPlusTiers.findIndex((t) => t.id === currentId)
  if (i < 0 || i >= mockGrowthPlusTiers.length - 1) return null
  return mockGrowthPlusTiers[i + 1]
}

// Dedicated billing surface. "Manage" button opens the parent-owned
// Growth+ Manage popup (not a route navigation) so the user gets the
// Change-tier / Cancel choice without leaving the page first. When the
// user isn't on Elite, a slim upgrade ribbon at the bottom points to
// the next tier.
export default function GrowthPlusBillingCard({ onManage }) {
  const tierId = useGrowthConfig((s) => s.config.growthPlusControls.tier)
  const tier = mockGrowthPlusTierById[tierId]
  const upgrade = nextTier(tierId)

  return (
    <section className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-3 p-4 md:p-5">
        <CardChip color="purple" icon={CreditCard} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-secondary">Next billing</p>
          <p className="mt-0.5 text-sm font-semibold text-text-primary">
            {tier ? `${tier.name} · $${tier.price}.00` : '$49.00'} ·{' '}
            {formatBillingDate(mockGrowthPlusNextBillingAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={onManage}
          className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
        >
          Manage
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {upgrade && (
        <Link
          to="/growth-plus/upgrade"
          className="flex items-center gap-2 border-t border-border bg-purple-tint/40 px-4 py-3 text-xs font-medium text-purple-text transition-colors hover:bg-purple-tint md:px-5"
        >
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            Upgrade to {upgrade.name} for ${upgrade.price}/mo — unlock{' '}
            {upgrade.id === 'elite' ? 'Engaged-quality targeting' : 'Fast speed + Targeted quality'}
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Manual verification**

Run: `npm run dev`. Open `/growth-plus`. Click "Manage" on the Billing card. Expected: bottom-sheet on mobile / centered modal on desktop appears with current plan summary, "Change tier" row, "Cancel subscription" row. Click backdrop or close — modal closes. Click "Change tier" — navigates to `/account/growth-plus` (still the stub for now).

- [ ] **Step 5: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusActive.jsx src/pages/growthPlus/GrowthPlusBillingCard.jsx
git commit -m "feat(growth-plus): wire Manage popup from Billing card"
```

---

### Task 6: Rewire GrowthPlusBanner "Manage subscription" to use ?manage=1 deep-link

**Files:**
- Modify: `src/components/GrowthPlusBanner.jsx` (two `<Link to="/account/growth-plus">` swaps)

- [ ] **Step 1: Replace both Manage subscription links**

Find `to="/account/growth-plus"` (appears twice in mobile + desktop layouts). Replace with `to="/growth-plus?manage=1"`.

Mobile layout link block becomes:

```jsx
{isSubscribed && (
  <Link
    to="/growth-plus?manage=1"
    className="mt-1 inline-flex items-center text-xs font-medium text-purple-text hover:underline"
  >
    Manage subscription
  </Link>
)}
```

Desktop layout link block becomes:

```jsx
{isSubscribed && (
  <Link
    to="/growth-plus?manage=1"
    className="shrink-0 text-sm font-medium text-purple-text hover:underline"
  >
    Manage subscription
  </Link>
)}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. Visit any page where the banner renders (`/` for Overview, `/engagement` if applicable). Click "Manage subscription". Expected: routes to `/growth-plus` and the Manage popup is open on mount. URL bar drops `?manage=1` after mount.

- [ ] **Step 4: Commit**

```bash
git add src/components/GrowthPlusBanner.jsx
git commit -m "feat(growth-plus): route Banner Manage link through ?manage=1 deep-link"
```

---

### Task 7: Rewrite /account/growth-plus into the tier-change page

**Files:**
- Modify: `src/pages/accountGrowthPlus/index.jsx` (full rewrite of the stub)

- [ ] **Step 1: Replace the stub with the tier-change page**

```jsx
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Lock } from 'lucide-react'
import { mockGrowthPlusTiers } from '@/mocks/growth'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import { useEffect, useState } from 'react'
import SwitchTierConfirmModal from '@/components/SwitchTierConfirmModal'

// Tier-change page. Replaces the "coming soon" stub. Shows three tier
// cards; the current tier is marked "Current plan" with a disabled
// button. Other tiers expose "Switch to {tier.name}" CTAs that open a
// proration confirm modal. Route guard: if status !== 'active',
// redirect to /growth-plus (cancelled_pending users must Resume first;
// lapsed users see Upsell).
export default function AccountGrowthPlusPage() {
  const navigate = useNavigate()
  const currentTierId = useGrowthConfig(
    (s) => s.config.growthPlusControls.tier,
  )
  const status = useGrowthPlusSubscription((s) => s.status)
  const [pendingTierId, setPendingTierId] = useState(null)

  useEffect(() => {
    if (status !== 'active') {
      navigate('/growth-plus', { replace: true })
    }
  }, [status, navigate])

  if (status !== 'active') return null

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate('/growth-plus')}
        className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Growth+
      </button>

      <header className="mt-3">
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Manage your Growth+ subscription
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Change tier anytime. Proration handled automatically.
        </p>
      </header>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {mockGrowthPlusTiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isCurrent={tier.id === currentTierId}
            onSwitch={() => setPendingTierId(tier.id)}
          />
        ))}
      </section>

      <p className="mt-6 text-xs text-text-muted">
        Switching tiers takes effect immediately. Your next renewal stays
        on the same day.
      </p>

      <SwitchTierConfirmModal
        targetTierId={pendingTierId}
        onClose={() => setPendingTierId(null)}
      />
    </div>
  )
}

function TierCard({ tier, isCurrent, onSwitch }) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-5 shadow-sm md:p-6 ${
        isCurrent
          ? 'border-purple-base bg-gradient-to-br from-purple-tint/40 via-surface to-surface shadow-md'
          : 'border-border bg-surface'
      }`}
    >
      {isCurrent && (
        <span className="absolute -top-2.5 left-5 inline-flex items-center rounded-full bg-green-tint px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
          Current plan
        </span>
      )}

      <h3 className="text-lg font-semibold text-text-primary">{tier.name}</h3>
      <p className="mt-1 text-xs text-text-secondary">{tier.tagline}</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-text-primary">
          ${tier.price}
        </span>
        <span className="text-sm text-text-secondary">/mo</span>
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-text-primary">
        <FeatureRow
          included
          text={`Up to +${tier.monthlyBoosts} extra followers/mo`}
        />
        <FeatureRow
          included
          text={`${tier.boostedPosts} boosted posts/mo`}
        />
        <FeatureRow
          included
          text={`+${Math.round(tier.reachLift * 100)}% post reach lift`}
        />
        <FeatureRow
          included={tier.allowedSpeed.includes('fast')}
          text="Fast speed mode"
        />
        <FeatureRow
          included={tier.allowedQuality.includes('targeted')}
          text="Targeted quality"
        />
        <FeatureRow
          included={tier.allowedQuality.includes('top')}
          text="Engaged-quality targeting"
        />
      </ul>

      <button
        type="button"
        onClick={onSwitch}
        disabled={isCurrent}
        className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg text-base font-semibold transition-opacity ${
          isCurrent
            ? 'cursor-not-allowed border border-border bg-bg text-text-muted'
            : 'bg-purple-base text-white hover:opacity-90'
        }`}
      >
        {isCurrent ? 'Current plan' : `Switch to ${tier.name}`}
      </button>
    </div>
  )
}

function FeatureRow({ included, text }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {included ? (
        <Check
          className="mt-0.5 h-4 w-4 shrink-0 text-purple-base"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      ) : (
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
      )}
      <span className={included ? 'text-text-primary' : 'text-text-muted'}>
        {text}
      </span>
    </li>
  )
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: FAIL — `SwitchTierConfirmModal` does not exist yet. That's expected; created in Task 8. Move on.

- [ ] **Step 3: Stage the file but don't commit yet**

```bash
git add src/pages/accountGrowthPlus/index.jsx
```

Commit happens after Task 8 once the modal exists.

---

### Task 8: Build SwitchTierConfirmModal (confirm + processing + success)

**Files:**
- Create: `src/components/SwitchTierConfirmModal.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react'
import { useState } from 'react'
import { mockGrowthPlusNextBillingAt } from '@/mocks/user'
import { mockGrowthPlusTierById } from '@/mocks/growth'
import { prorationFor } from '@/utils/proration'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { useToasts } from '@/stores/useToasts'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Tier-change proration confirm + processing + success modal.
// `targetTierId` drives the modal — null/undefined hides it.
//
// Three states drive three render branches, mirroring the existing
// GrowthPlusSubscribeModal pattern:
//   - 'confirm'    → tier summary + proration line + confirm button
//   - 'processing' → centered spinner (auto-advances after 1500ms)
//   - 'success'    → green check + "Switched to {tier}" + Done button
//
// On Done: writes the new tier into useGrowthConfig and fires a toast.
// Does NOT navigate — caller can choose to redirect (cancel-flow
// deflection path does, the tier-change page doesn't need to).
export default function SwitchTierConfirmModal({
  targetTierId,
  onClose,
  onSuccess,
}) {
  const currentTierId = useGrowthConfig(
    (s) => s.config.growthPlusControls.tier,
  )
  const setTier = useGrowthConfig((s) => s.setGrowthPlusTier)
  const addToast = useToasts((s) => s.addToast)
  const [state, setState] = useState('confirm') // 'confirm' | 'processing' | 'success'

  const currentTier = mockGrowthPlusTierById[currentTierId]
  const targetTier = targetTierId
    ? mockGrowthPlusTierById[targetTierId]
    : null

  // Reset internal state whenever the modal opens for a new target.
  useEffect(() => {
    if (targetTierId) setState('confirm')
  }, [targetTierId])

  // Auto-advance processing → success.
  useEffect(() => {
    if (state !== 'processing') return
    const id = setTimeout(() => setState('success'), 1500)
    return () => clearTimeout(id)
  }, [state])

  if (!targetTier || !currentTier) return null

  const proration = prorationFor({
    oldPrice: currentTier.price,
    newPrice: targetTier.price,
    endsAt: mockGrowthPlusNextBillingAt,
  })
  const isUpgrade = proration.kind === 'upgrade'

  function handleConfirm() {
    setState('processing')
  }

  function handleDone() {
    setTier(targetTierId)
    addToast({ message: `Switched to ${targetTier.name}.`, tone: 'success' })
    onSuccess?.(targetTierId)
    onClose?.()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && state === 'confirm') onClose?.()
      }}
    >
      <div className="w-full rounded-t-2xl bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl lg:mx-4 lg:max-w-sm lg:rounded-2xl lg:pb-6">
        {state === 'confirm' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-text-primary">
                Switch to {targetTier.name}
              </h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 space-y-2 rounded-xl border border-border bg-bg p-4 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-text-secondary">New tier</span>
                <span className="font-semibold text-text-primary">
                  {targetTier.name} · ${targetTier.price}/mo
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-text-secondary">Effective</span>
                <span className="font-medium text-text-primary">
                  Immediately
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-text-secondary">Next billing</span>
                <span className="font-medium text-text-primary">
                  {formatDate(mockGrowthPlusNextBillingAt)}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-border pt-2">
                <span className="text-text-secondary">
                  {isUpgrade ? 'Charged today' : 'Credited to next bill'}
                </span>
                <span
                  className={`font-semibold ${
                    isUpgrade ? 'text-text-primary' : 'text-green-text'
                  }`}
                >
                  {isUpgrade ? `$${proration.amount}` : `−$${proration.amount}`}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-purple-base text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Switch to {targetTier.name}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg text-base font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        {state === 'processing' && (
          <div className="flex flex-col items-center py-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-base" />
            <p className="mt-3 text-base font-medium text-text-primary">
              Updating your subscription...
            </p>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-tint">
              <CheckCircle2 className="h-6 w-6 text-green-text" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              Switched to {targetTier.name}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
              Your new tier is active. Next billing on{' '}
              {formatDate(mockGrowthPlusNextBillingAt)}.
            </p>
            <button
              type="button"
              onClick={handleDone}
              className="mt-4 inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-green-base text-base font-semibold text-white transition-opacity hover:opacity-90"
            >
              Done
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body,
  )
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. Open `/growth-plus`. Click Manage → Change tier. On `/account/growth-plus`, current tier shows "Current plan" pill + disabled button. Click "Switch to Elite" — confirm modal opens with proration line showing positive charge today. Click "Switch to Elite" inside modal — spinner shows for ~1.5s — success screen appears. Click Done — modal closes, toast appears, tier in Billing card now reads Elite, refresh page → tier persisted in store (zustand in-memory).

Try a downgrade: switch back from Elite → Starter. Proration line shows credit toward next bill (green color, minus sign).

- [ ] **Step 4: Commit (tier-change page + modal together)**

```bash
git add src/components/SwitchTierConfirmModal.jsx src/pages/accountGrowthPlus/index.jsx
git commit -m "feat(growth-plus): tier-change page with proration confirm modal"
```

---

### Task 9: Build CancelGrowthPlusModal (reason → lose → confirm → success)

**Files:**
- Create: `src/components/CancelGrowthPlusModal.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Loader2, Sparkles, X } from 'lucide-react'
import { mockGrowthPlusNextBillingAt } from '@/mocks/user'
import {
  mockGrowthPlusInsights,
  mockGrowthPlusTierById,
  mockGrowthPlusTiers,
} from '@/mocks/growth'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

const REASONS = [
  { id: 'price', label: 'Too expensive' },
  { id: 'results', label: 'Not enough results' },
  { id: 'break', label: 'Taking a break from Instagram' },
  { id: 'unused', label: "I don't use it" },
  { id: 'other', label: 'Other' },
]

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Smallest tier-jump downgrade target. Elite → Pro. Pro → Starter.
// Starter → null (no deflection possible).
function deflectionTarget(currentTierId) {
  const i = mockGrowthPlusTiers.findIndex((t) => t.id === currentTierId)
  if (i <= 0) return null
  return mockGrowthPlusTiers[i - 1]
}

// 3-step cancel flow + success ack:
//   reason  → pick a reason; "Too expensive" + non-Starter shows
//             inline downgrade deflection card
//   lose    → personal-gains headline + strikethrough feature list
//   confirm → final "Are you sure?" with keep-vs-cancel buttons
//   success → "Subscription cancelled" ack, then Done
//
// `open` toggles visibility. Parent owns it. On final confirm, calls
// onConfirmed() — parent updates the store (cancel + endsAt) and fires
// the toast. On deflection downgrade, calls onDeflect(tierId) so parent
// can swap to SwitchTierConfirmModal for that tier.
export default function CancelGrowthPlusModal({
  open,
  onClose,
  onConfirmed,
  onDeflect,
}) {
  const currentTierId = useGrowthConfig(
    (s) => s.config.growthPlusControls.tier,
  )
  const currentTier = mockGrowthPlusTierById[currentTierId]
  const insights =
    mockGrowthPlusInsights[currentTierId] ?? mockGrowthPlusInsights.pro
  const deflection = deflectionTarget(currentTierId)

  const [step, setStep] = useState('reason')
  const [selectedReason, setSelectedReason] = useState(null)

  // Reset whenever the modal opens.
  useEffect(() => {
    if (open) {
      setStep('reason')
      setSelectedReason(null)
    }
  }, [open])

  // Auto-advance processing → success.
  useEffect(() => {
    if (step !== 'processing') return
    const id = setTimeout(() => setStep('success'), 1500)
    return () => clearTimeout(id)
  }, [step])

  if (!open) return null

  const showDeflection = selectedReason === 'price' && deflection

  function handleContinueReason() {
    setStep('lose')
  }

  function handleContinueLose() {
    setStep('confirm')
  }

  function handleConfirm() {
    setStep('processing')
  }

  function handleDone() {
    onConfirmed?.()
    onClose?.()
  }

  function handleDeflect() {
    if (deflection) onDeflect?.(deflection.id)
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 'processing') onClose?.()
      }}
    >
      <div className="w-full rounded-t-2xl bg-surface shadow-xl lg:mx-4 lg:max-w-md lg:rounded-2xl">
        <div className="flex items-center justify-between px-5 pt-5">
          <h2 className="text-base font-semibold text-text-primary">
            Cancel Growth+
          </h2>
          {step !== 'processing' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="px-5 pb-5 pt-3">
          {step === 'reason' && (
            <>
              <p className="text-sm text-text-secondary">
                Why are you cancelling? (helps us improve)
              </p>
              <ul className="mt-3 flex flex-col gap-2">
                {REASONS.map((r) => {
                  const selected = selectedReason === r.id
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedReason(r.id)}
                        className={`flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                          selected
                            ? 'border-purple-base bg-purple-tint/40 text-text-primary'
                            : 'border-border bg-surface text-text-primary hover:bg-bg'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? 'border-purple-base'
                              : 'border-border-strong'
                          }`}
                        >
                          {selected && (
                            <span className="h-2 w-2 rounded-full bg-purple-base" />
                          )}
                        </span>
                        <span className="font-medium">{r.label}</span>
                      </button>

                      {selected && r.id === 'price' && deflection && (
                        <div className="mt-2 rounded-lg border border-purple-base/30 bg-purple-tint/40 p-4">
                          <p className="text-sm font-semibold text-purple-text">
                            Try {deflection.name} at ${deflection.price}/mo
                            instead?
                          </p>
                          <p className="mt-1 text-xs text-text-secondary">
                            Keep your boost going for less. Effective
                            immediately.
                          </p>
                          <button
                            type="button"
                            onClick={handleDeflect}
                            className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-purple-base px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90"
                          >
                            Downgrade to {deflection.name}
                          </button>
                        </div>
                      )}
                    </li>
                  )
                })}
              </ul>

              <button
                type="button"
                onClick={handleContinueReason}
                disabled={!selectedReason}
                className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-text-primary text-base font-semibold text-bg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue
              </button>
            </>
          )}

          {step === 'lose' && (
            <>
              <p className="text-sm text-text-secondary">
                Here's what you'll lose:
              </p>

              <div className="mt-3 flex items-start gap-3 rounded-xl border border-purple-base/20 bg-purple-tint/40 p-4">
                <Sparkles
                  className="mt-0.5 h-5 w-5 shrink-0 text-purple-text"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    +{insights.totalFollowersGained} followers from Growth+
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Cumulative gain since you subscribed.
                  </p>
                </div>
              </div>

              {currentTier && (
                <ul className="mt-3 flex flex-col gap-1.5 text-sm">
                  <LoseRow
                    text={`Up to +${currentTier.monthlyBoosts} extra followers/mo`}
                  />
                  <LoseRow text={`${currentTier.boostedPosts} boosted posts/mo`} />
                  <LoseRow
                    text={`+${Math.round(currentTier.reachLift * 100)}% post reach lift`}
                  />
                  {currentTier.allowedSpeed.includes('fast') && (
                    <LoseRow text="Fast speed mode" />
                  )}
                  {currentTier.allowedQuality.includes('targeted') && (
                    <LoseRow text="Targeted quality" />
                  )}
                  {currentTier.allowedQuality.includes('top') && (
                    <LoseRow text="Engaged-quality targeting" />
                  )}
                </ul>
              )}

              <p className="mt-4 text-xs text-text-muted">
                You'll keep full access until{' '}
                {formatDate(mockGrowthPlusNextBillingAt)}.
              </p>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep('reason')}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-lg border border-border bg-surface text-base font-medium text-text-primary transition-colors hover:bg-bg"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleContinueLose}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-lg bg-text-primary text-base font-semibold text-bg transition-opacity hover:opacity-90"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 'confirm' && (
            <>
              <p className="text-sm font-semibold text-text-primary">
                Are you sure?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Your Growth+ subscription will end on{' '}
                <span className="font-semibold text-text-primary">
                  {formatDate(mockGrowthPlusNextBillingAt)}
                </span>
                . You won't be charged again. You'll keep full access until
                then.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-green-base text-base font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Keep my subscription
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-red-tint text-base font-semibold text-red-text transition-colors hover:bg-red-tint/70"
                >
                  Cancel subscription
                </button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center py-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
              <p className="mt-3 text-base font-medium text-text-primary">
                Cancelling your subscription...
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-tint">
                <CheckCircle2 className="h-6 w-6 text-green-text" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                Subscription cancelled
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                You have full access until{' '}
                {formatDate(mockGrowthPlusNextBillingAt)}. We'll let you know
                before it ends.
              </p>
              <button
                type="button"
                onClick={handleDone}
                className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-lg bg-text-primary text-base font-semibold text-bg transition-opacity hover:opacity-90"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

function LoseRow({ text }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      <X
        className="mt-0.5 h-4 w-4 shrink-0 text-red-text"
        strokeWidth={2.5}
        aria-hidden="true"
      />
      <span className="text-text-secondary line-through">{text}</span>
    </li>
  )
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/CancelGrowthPlusModal.jsx
git commit -m "feat(growth-plus): add 3-step cancel flow modal"
```

---

### Task 10: Wire CancelModal into GrowthPlusActive

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusActive.jsx` (add cancel modal state + handlers; also wires SwitchTier modal for deflection)

- [ ] **Step 1: Update GrowthPlusActive.jsx**

Replace the entire file with:

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CancelGrowthPlusModal from '@/components/CancelGrowthPlusModal'
import GrowthPlusManageModal from '@/components/GrowthPlusManageModal'
import SwitchTierConfirmModal from '@/components/SwitchTierConfirmModal'
import { mockGrowthPlusNextBillingAt } from '@/mocks/user'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import { useToasts } from '@/stores/useToasts'
import GrowthPlusActivity from './GrowthPlusActivity'
import GrowthPlusBillingCard from './GrowthPlusBillingCard'
import GrowthPlusControls from './GrowthPlusControls'
import GrowthPlusHero from './GrowthPlusHero'
import GrowthPlusMetricsStrip from './GrowthPlusMetricsStrip'

// Subscriber dashboard for the Growth+ page. Hero → metrics →
// [Activity + Controls 2-col on lg:+] → Billing. Owns the three
// modals: Manage popup (entry), Cancel flow (3 steps + success),
// SwitchTier confirm (proration + success — also used as the cancel
// flow's "Too expensive" deflection target).
//
// `account` is captured for future per-account data wiring — V1 mocks
// don't vary per account.
//
// eslint-disable-next-line no-unused-vars
export default function GrowthPlusActive({ account, manageOpenOnMount = false }) {
  const navigate = useNavigate()
  const cancelSubscription = useGrowthPlusSubscription((s) => s.cancel)
  const addToast = useToasts((s) => s.addToast)
  const [manageOpen, setManageOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [switchTierTargetId, setSwitchTierTargetId] = useState(null)

  useEffect(() => {
    if (manageOpenOnMount) setManageOpen(true)
  }, [manageOpenOnMount])

  function handleChangeTier() {
    setManageOpen(false)
    navigate('/account/growth-plus')
  }

  function handleCancel() {
    setManageOpen(false)
    setCancelOpen(true)
  }

  function handleResume() {
    // Wired fully in Task 13c (cancelled_pending Manage variant). Stub
    // here so the modal contract is satisfied.
    setManageOpen(false)
  }

  function handleCancelConfirmed() {
    cancelSubscription(mockGrowthPlusNextBillingAt)
    addToast({
      message: 'Growth+ subscription cancelled.',
      tone: 'success',
    })
  }

  function handleDeflect(tierId) {
    setCancelOpen(false)
    setSwitchTierTargetId(tierId)
  }

  function handleSwitchTierSuccess() {
    // The modal already fires its own "Switched to X" toast. After a
    // deflection downgrade we send the user back to /growth-plus so
    // they land on their (now-downgraded) dashboard.
    navigate('/growth-plus')
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <GrowthPlusHero />
      <GrowthPlusMetricsStrip />
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        <GrowthPlusActivity />
        <GrowthPlusControls />
      </div>
      <GrowthPlusBillingCard onManage={() => setManageOpen(true)} />

      <GrowthPlusManageModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        onChangeTier={handleChangeTier}
        onCancel={handleCancel}
        onResume={handleResume}
      />

      <CancelGrowthPlusModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirmed={handleCancelConfirmed}
        onDeflect={handleDeflect}
      />

      <SwitchTierConfirmModal
        targetTierId={switchTierTargetId}
        onClose={() => setSwitchTierTargetId(null)}
        onSuccess={handleSwitchTierSuccess}
      />
    </div>
  )
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. Open `/growth-plus`. Click Manage → Cancel subscription. Step 1 (reason) shows 5 radio rows. Pick "Too expensive" — deflection card appears with "Downgrade to {tier}" button. Pick "Other" — deflection disappears. Click Continue. Step 2 (lose) shows the cumulative gain headline + strikethrough features. Click Continue. Step 3 (confirm) shows the date. Click Cancel subscription → spinner → success ack → Done. Toast appears. The dashboard is still rendered (cancelled_pending UI lands in Task 13).

Test deflection: open cancel modal again, pick "Too expensive", click "Downgrade to {tier}". Cancel modal closes, SwitchTier modal opens. Confirm. Spinner → success → Done. Toast. Redirects to `/growth-plus`. Tier now reflects the downgrade.

- [ ] **Step 4: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusActive.jsx
git commit -m "feat(growth-plus): wire cancel flow + deflection from Manage popup"
```

---

### Task 11: Build GrowthPlusCancelledBanner component

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusCancelledBanner.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { AlertTriangle } from 'lucide-react'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Yellow-tint banner shown above the Growth+ Hero when the user has
// cancelled but the paid-through period hasn't ended yet. Surfaces the
// end date + a Resume action.
export default function GrowthPlusCancelledBanner({ onResume }) {
  const endsAt = useGrowthPlusSubscription((s) => s.endsAt)

  return (
    <section
      role="status"
      className="flex items-start gap-3 rounded-xl border border-yellow-base/30 bg-yellow-tint p-4 md:p-5"
    >
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-yellow-text"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">
          Your Growth+ subscription ends {formatDate(endsAt)}.
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">
          You'll keep full access until then.
        </p>
      </div>
      <button
        type="button"
        onClick={onResume}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-yellow-base px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        Resume
      </button>
    </section>
  )
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusCancelledBanner.jsx
git commit -m "feat(growth-plus): add cancelled-pending banner component"
```

---

### Task 12: Hero pill + BillingCard adapt to cancelled_pending

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusHero.jsx`
- Modify: `src/pages/growthPlus/GrowthPlusBillingCard.jsx`

- [ ] **Step 1: Update GrowthPlusHero.jsx — read status, branch pill copy/color**

Replace the file with:

```jsx
import { Sparkles } from 'lucide-react'
import {
  mockGrowthPlusInsights,
  mockGrowthPlusTierById,
} from '@/mocks/growth'
import { useCountUp } from '@/hooks/useCountUp'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'

function formatShortDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

// Hero card for the Growth+ page. Big number = total followers gained
// from Growth+ since subscribing. The header pill branches on
// subscription status:
//   active            → green-tint "Active · Pro"
//   cancelled_pending → yellow-tint "Ending Jun 12 · Pro"
//   (paused boost)    → bg/text-secondary "Paused · Pro"
export default function GrowthPlusHero() {
  const tierId = useGrowthConfig((s) => s.config.growthPlusControls.tier)
  const boostEnabled = useGrowthConfig(
    (s) => s.config.growthPlusControls.enabled,
  )
  const status = useGrowthPlusSubscription((s) => s.status)
  const endsAt = useGrowthPlusSubscription((s) => s.endsAt)
  const tier = mockGrowthPlusTierById[tierId]
  const insights = mockGrowthPlusInsights[tierId] ?? mockGrowthPlusInsights.pro

  const target = insights.totalFollowersGained
  const value = useCountUp(target, 600)

  const isCancelledPending = status === 'cancelled_pending'

  // Pill copy + theme classes.
  let pillLabel
  let pillClasses
  let dotClass
  if (isCancelledPending) {
    pillLabel = `Ending ${formatShortDate(endsAt)}`
    pillClasses = 'bg-yellow-tint text-yellow-text'
    dotClass = 'bg-yellow-base'
  } else if (boostEnabled) {
    pillLabel = 'Active'
    pillClasses = 'bg-green-tint text-green-text'
    dotClass = 'bg-green-base'
  } else {
    pillLabel = 'Paused'
    pillClasses = 'bg-bg text-text-secondary'
    dotClass = 'bg-text-muted'
  }

  return (
    <section className="overflow-hidden rounded-xl border border-purple-base/20 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-text text-surface shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-text">
          GROWTH+
        </span>
        <span
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${pillClasses}`}
        >
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {pillLabel}
          {tier && (
            <>
              <span aria-hidden="true" className="opacity-50">·</span>
              <span>{tier.name}</span>
            </>
          )}
        </span>
      </div>

      <p className="mt-4 text-4xl font-semibold leading-none text-text-primary md:text-5xl">
        +{value}
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        {isCancelledPending
          ? 'total followers gained from Growth+'
          : boostEnabled
            ? 'total followers gained from Growth+'
            : 'Boost paused — billing continues'}
      </p>
    </section>
  )
}
```

- [ ] **Step 2: Update GrowthPlusBillingCard.jsx — adapt label + hide ribbon when cancelled_pending**

Replace the file with:

```jsx
import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, CreditCard } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { mockGrowthPlusNextBillingAt } from '@/mocks/user'
import { mockGrowthPlusTierById, mockGrowthPlusTiers } from '@/mocks/growth'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'

function formatBillingDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Next tier above the current one, or null if already on Elite. Used
// for the upgrade nudge ribbon at the bottom of the card.
function nextTier(currentId) {
  const i = mockGrowthPlusTiers.findIndex((t) => t.id === currentId)
  if (i < 0 || i >= mockGrowthPlusTiers.length - 1) return null
  return mockGrowthPlusTiers[i + 1]
}

// Dedicated billing surface. "Manage" button opens the parent-owned
// Growth+ Manage popup. Label/date adapt to the cancelled_pending
// state (Next billing → Subscription ends), and the upgrade ribbon
// hides — they're leaving, no point in selling them up.
export default function GrowthPlusBillingCard({ onManage }) {
  const tierId = useGrowthConfig((s) => s.config.growthPlusControls.tier)
  const tier = mockGrowthPlusTierById[tierId]
  const upgrade = nextTier(tierId)
  const status = useGrowthPlusSubscription((s) => s.status)
  const endsAt = useGrowthPlusSubscription((s) => s.endsAt)

  const isCancelledPending = status === 'cancelled_pending'
  const label = isCancelledPending ? 'Subscription ends' : 'Next billing'
  const dateIso = isCancelledPending ? endsAt : mockGrowthPlusNextBillingAt
  const showUpgrade = upgrade && !isCancelledPending

  return (
    <section className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-3 p-4 md:p-5">
        <CardChip color="purple" icon={CreditCard} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-secondary">{label}</p>
          <p className="mt-0.5 text-sm font-semibold text-text-primary">
            {tier ? `${tier.name} · $${tier.price}.00` : '$49.00'} ·{' '}
            {formatBillingDate(dateIso)}
          </p>
        </div>
        <button
          type="button"
          onClick={onManage}
          className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
        >
          Manage
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      {showUpgrade && (
        <Link
          to="/growth-plus/upgrade"
          className="flex items-center gap-2 border-t border-border bg-purple-tint/40 px-4 py-3 text-xs font-medium text-purple-text transition-colors hover:bg-purple-tint md:px-5"
        >
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            Upgrade to {upgrade.name} for ${upgrade.price}/mo — unlock{' '}
            {upgrade.id === 'elite' ? 'Engaged-quality targeting' : 'Fast speed + Targeted quality'}
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}
```

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusHero.jsx src/pages/growthPlus/GrowthPlusBillingCard.jsx
git commit -m "feat(growth-plus): hero pill + billing card adapt to cancelled-pending"
```

---

### Task 13: Render CancelledBanner + wire Resume in GrowthPlusActive

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusActive.jsx` (render banner when cancelled_pending; wire resume action; pass status to ManageModal which already branches)

- [ ] **Step 1: Update GrowthPlusActive.jsx**

Replace the file with:

```jsx
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CancelGrowthPlusModal from '@/components/CancelGrowthPlusModal'
import GrowthPlusManageModal from '@/components/GrowthPlusManageModal'
import SwitchTierConfirmModal from '@/components/SwitchTierConfirmModal'
import { mockGrowthPlusNextBillingAt } from '@/mocks/user'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import { useToasts } from '@/stores/useToasts'
import GrowthPlusActivity from './GrowthPlusActivity'
import GrowthPlusBillingCard from './GrowthPlusBillingCard'
import GrowthPlusCancelledBanner from './GrowthPlusCancelledBanner'
import GrowthPlusControls from './GrowthPlusControls'
import GrowthPlusHero from './GrowthPlusHero'
import GrowthPlusMetricsStrip from './GrowthPlusMetricsStrip'

// Subscriber dashboard for the Growth+ page. Hero → metrics →
// [Activity + Controls 2-col on lg:+] → Billing. Owns the three
// modals: Manage popup (entry, variant depends on status), Cancel
// flow (3 steps + success), SwitchTier confirm (proration + success).
// In cancelled_pending status: prepends a yellow banner with a
// Resume CTA; Manage popup renders the Resume variant.
//
// `account` is captured for future per-account data wiring — V1 mocks
// don't vary per account.
//
// eslint-disable-next-line no-unused-vars
export default function GrowthPlusActive({ account, manageOpenOnMount = false }) {
  const navigate = useNavigate()
  const status = useGrowthPlusSubscription((s) => s.status)
  const cancelSubscription = useGrowthPlusSubscription((s) => s.cancel)
  const resumeSubscription = useGrowthPlusSubscription((s) => s.resume)
  const addToast = useToasts((s) => s.addToast)
  const [manageOpen, setManageOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [switchTierTargetId, setSwitchTierTargetId] = useState(null)

  useEffect(() => {
    if (manageOpenOnMount) setManageOpen(true)
  }, [manageOpenOnMount])

  const isCancelledPending = status === 'cancelled_pending'

  function handleChangeTier() {
    setManageOpen(false)
    navigate('/account/growth-plus')
  }

  function handleCancel() {
    setManageOpen(false)
    setCancelOpen(true)
  }

  function handleResume() {
    setManageOpen(false)
    resumeSubscription()
    addToast({
      message: 'Growth+ subscription resumed.',
      tone: 'success',
    })
  }

  function handleCancelConfirmed() {
    cancelSubscription(mockGrowthPlusNextBillingAt)
    addToast({
      message: 'Growth+ subscription cancelled.',
      tone: 'success',
    })
  }

  function handleDeflect(tierId) {
    setCancelOpen(false)
    setSwitchTierTargetId(tierId)
  }

  function handleSwitchTierSuccess() {
    navigate('/growth-plus')
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      {isCancelledPending && (
        <GrowthPlusCancelledBanner onResume={handleResume} />
      )}
      <GrowthPlusHero />
      <GrowthPlusMetricsStrip />
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        <GrowthPlusActivity />
        <GrowthPlusControls />
      </div>
      <GrowthPlusBillingCard onManage={() => setManageOpen(true)} />

      <GrowthPlusManageModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        onChangeTier={handleChangeTier}
        onCancel={handleCancel}
        onResume={handleResume}
      />

      <CancelGrowthPlusModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirmed={handleCancelConfirmed}
        onDeflect={handleDeflect}
      />

      <SwitchTierConfirmModal
        targetTierId={switchTierTargetId}
        onClose={() => setSwitchTierTargetId(null)}
        onSuccess={handleSwitchTierSuccess}
      />
    </div>
  )
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Manual verification — full happy path**

Run: `npm run dev`. Visit `/growth-plus`.

1. Click Manage → Cancel subscription. Walk through reason (pick "Other"), lose, confirm. Click Cancel subscription. Success ack → Done.
2. Confirm the dashboard now shows the yellow banner above the hero with the end date and a "Resume" button. Hero pill is yellow-tint "Ending Jun 12 · Pro" (or whatever date). Billing card label reads "Subscription ends." Upgrade ribbon is hidden.
3. Try to visit `/account/growth-plus` directly in URL bar. Expected: redirects to `/growth-plus` (tier-change page is route-guarded — see Task 7 step 1's useEffect).
4. Click "Manage" on Billing. Expected: popup now shows yellow current-plan summary card + a single green "Resume subscription" button (Change tier and Cancel rows are hidden).
5. Click Resume. Expected: popup closes, banner disappears, hero pill returns to green "Active · Pro", toast appears.
6. From Banner on another page (`/`): click "Manage subscription". Expected: routes to `/growth-plus` with the Manage popup auto-opened on mount.

- [ ] **Step 4: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusActive.jsx
git commit -m "feat(growth-plus): render cancelled-pending banner + wire Resume action"
```

---

### Task 14: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md` (add entry at top)

- [ ] **Step 1: Add new entry above the most recent one**

Open `CHANGELOG.md`. Find the line `## 2026-05-12 — Growth+ hero & pills round`. Insert above it:

```markdown
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
```

Also update the session-note line at the top of the changelog. Find:

```markdown
> **2026-05-12 session note:** five 2026-05-12 entries total — `Hero & pills round` (this entry), `Layout pass`, `Tiered pricing`, `Premium polish (round 2)`, and `Polish pass`.
```

Replace with:

```markdown
> **2026-05-12 session note:** six 2026-05-12 entries total — `Manage subscription` (this entry), `Hero & pills round`, `Layout pass`, `Tiered pricing`, `Premium polish (round 2)`, and `Polish pass`.
```

- [ ] **Step 2: Final build verification**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog entry for Growth+ Manage subscription feature"
```

---

## Self-review summary

**Spec coverage check:**
- ✅ Three subscription states (active / cancelled_pending / lapsed) → Task 1 (store), Task 3 (lapsed routing), Task 13 (cancelled_pending UI)
- ✅ Manage popup (active + cancelled_pending variants) → Task 4 (full component including both variants)
- ✅ Tier-change page with current-plan marker + route guard → Task 7
- ✅ SwitchTierConfirmModal with proration → Task 8
- ✅ 3-step cancel flow + success ack → Task 9
- ✅ Inline "Too expensive" downgrade deflection → Task 9 + Task 10 wiring
- ✅ Cancelled-pending banner + hero pill swap + BillingCard adjustments → Task 11, Task 12, Task 13
- ✅ Proration utility → Task 2
- ✅ Banner deep-link via ?manage=1 → Task 6 + Task 3 query-param handling
- ✅ Toast notifications on cancel/resume/switch → Tasks 8, 10, 13
- ✅ Changelog → Task 14

**Type/naming consistency:**
- Subscription status string union: `'active' | 'cancelled_pending' | 'lapsed'` — consistent across store, page branching, modal logic, and route guard.
- Store actions: `cancel(endsAt)`, `resume()`, `_lapseForTesting()` — used by Active page + ManageModal + (future) QA tooling.
- Modal callback shape: `onClose`, `onConfirmed`, `onDeflect(tierId)` (cancel) and `onClose`, `onSuccess(tierId)` (switch) — consistent.
- Banner deep-link query param: `?manage=1` — consistent between Banner Task 6 and Page Task 3.
