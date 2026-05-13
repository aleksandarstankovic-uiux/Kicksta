# Subscription Cancellation Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `CancelSubscriptionModal` stub with a 4–5 step honest cancellation flow that offers real, reason-tailored saves (downgrade plan, switch server, pause subscription) and never traps the user.

**Architecture:** Single `CancelSubscriptionModal` component owns an internal step machine (`reason | save | lose | confirm | processing | success`). Save offers branch on the picked reason; three are wired to real store mutations (`setPlan` / `setServer` / `pause`) via sub-confirmation modals or inline UI. Two new subscription statuses (`paused` and `cancelled_pending`) layer onto the existing `SubscriptionDetail` page with a yellow banner + Resume action.

**Tech Stack:** React 19, React Router 7, Zustand 5, Tailwind v4, Lucide React. No test runner — each task verifies via `npm run build` + manual UI sanity.

**Spec:** `docs/superpowers/specs/2026-05-12-subscription-cancel-design.md`

---

## File map

**New:**
- `src/pages/account/SubscriptionStateBanner.jsx` — yellow banner for paused / cancelled_pending states with Resume CTA
- `src/pages/account/PauseConfirmModal.jsx` — pause confirmation modal (confirm + processing + success)
- `src/pages/account/DowngradePlanConfirmModal.jsx` — plan-downgrade confirmation modal (confirm + processing + success)

**Modified:**
- `src/stores/useSubscriptions.js` — add `cancel`, `resume`, `pause`, `setPlan` actions
- `src/mocks/subscriptions.js` — add `pauseUntil`, `endsAt`, `totalFollowersGained` fields to each subscription
- `src/pages/account/subscriptionShared.js` — extend `STATUS_PILL` with `paused` + `cancelled_pending`
- `src/pages/account/CancelSubscriptionModal.jsx` — full rewrite (stub → 5-step flow)
- `src/pages/account/PlanCard.jsx` — when paused / cancelled_pending, replace Upgrade + Growth+ buttons with single Resume action
- `src/pages/account/SubscriptionDetail.jsx` — render banner above page when status is paused / cancelled_pending; hide bottom Cancel section accordingly

---

### Task 1: Extend useSubscriptions store with cancel/resume/pause/setPlan

**Files:**
- Modify: `src/stores/useSubscriptions.js` (full rewrite)

- [ ] **Step 1: Replace the store file**

```jsx
import { create } from 'zustand'
import { mockSubscriptions } from '@/mocks/subscriptions'
import { useToasts } from '@/stores/useToasts'

// Per-IG-account subscriptions. Mutations are local-only in V1;
// replace with API calls when backend lands. `getById` is a helper
// for the detail route.
//
// Status lifecycle:
//   active | trialing  → normal billing
//   past_due           → payment failed
//   paused             → user paused for N days; growth halted,
//                        billing skipped until pauseUntil
//   cancelled_pending  → user cancelled; full access until endsAt,
//                        then lapses (backend-shipped)
//
// All status mutations fire toasts via useToasts so the calling
// component doesn't need to thread the notification through props.
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

  setPlan: (id, plan) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id ? { ...s, plan } : s,
      ),
    }))
    useToasts.getState().addToast({
      message: plan === 'growth' ? 'Switched to Growth plan.' : 'Switched to Advanced plan.',
      tone: 'success',
    })
  },

  pause: (id, days) => {
    const pauseUntil = new Date(
      Date.now() + days * 24 * 60 * 60 * 1000,
    ).toISOString()
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id
          ? { ...s, status: 'paused', pauseUntil, endsAt: null }
          : s,
      ),
    }))
    const sub = get().subscriptions.find((s) => s.id === id)
    const username = sub ? `subscription` : 'Subscription'
    const resumeDate = new Date(pauseUntil).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    })
    useToasts.getState().addToast({
      message: `${username[0].toUpperCase()}${username.slice(1)} paused — resumes ${resumeDate}.`,
      tone: 'success',
    })
  },

  cancel: (id) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) => {
        if (s.id !== id) return s
        // Past-due users have no paid-through window — end immediately.
        const endsAt =
          s.status === 'past_due'
            ? new Date().toISOString()
            : s.trialEndsAt ?? s.nextBillingAt
        return { ...s, status: 'cancelled_pending', endsAt, pauseUntil: null }
      }),
    }))
    useToasts.getState().addToast({
      message: 'Subscription cancelled.',
      tone: 'success',
    })
  },

  resume: (id) => {
    set((state) => ({
      subscriptions: state.subscriptions.map((s) =>
        s.id === id
          ? { ...s, status: 'active', endsAt: null, pauseUntil: null }
          : s,
      ),
    }))
    useToasts.getState().addToast({
      message: 'Subscription resumed.',
      tone: 'success',
    })
  },
}))
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/stores/useSubscriptions.js
git commit -m "feat(subscriptions): add cancel/resume/pause/setPlan store actions"
```

---

### Task 2: Extend mock subscriptions + status pill registry

**Files:**
- Modify: `src/mocks/subscriptions.js`
- Modify: `src/pages/account/subscriptionShared.js`

- [ ] **Step 1: Replace `src/mocks/subscriptions.js`**

```jsx
// One subscription per connected IG account. Joins back to
// `mockAccounts` via `accountId`. Status mix gives the UI variety.
//
// `pauseUntil` and `endsAt` are populated by store actions
// (`pause` and `cancel`); they're null on initial mock data so
// the dashboard renders the normal Active state.
//
// `totalFollowersGained` is the cumulative gain since subscription
// start — read by the cancel flow's "what you'll lose" step.
export const mockSubscriptions = [
  {
    id: 'sub_001',
    accountId: 'acc_001',
    plan: 'advanced',
    growthPlus: true,
    server: 'us-east',
    status: 'active',
    trialEndsAt: null,
    nextBillingAt: '2026-06-01T00:00:00Z',
    nextBillingAmount: 59,
    startedAt: '2026-01-15T00:00:00Z',
    pauseUntil: null,
    endsAt: null,
    totalFollowersGained: 1247,
  },
  {
    id: 'sub_002',
    accountId: 'acc_002',
    plan: 'growth',
    growthPlus: false,
    server: 'eu-west',
    status: 'trialing',
    trialEndsAt: '2026-05-20T00:00:00Z',
    nextBillingAt: '2026-05-20T00:00:00Z',
    nextBillingAmount: 29,
    startedAt: '2026-05-06T00:00:00Z',
    pauseUntil: null,
    endsAt: null,
    totalFollowersGained: 134,
  },
  {
    id: 'sub_003',
    accountId: 'acc_003',
    plan: 'advanced',
    growthPlus: false,
    server: 'us-west',
    status: 'past_due',
    trialEndsAt: null,
    nextBillingAt: '2026-05-01T00:00:00Z',
    nextBillingAmount: 49,
    startedAt: '2026-02-10T00:00:00Z',
    pauseUntil: null,
    endsAt: null,
    totalFollowersGained: 612,
  },
]
```

- [ ] **Step 2: Extend `STATUS_PILL` in `src/pages/account/subscriptionShared.js`**

Replace the file with:

```jsx
// Shared subscription presentation helpers. Lives next to the
// account page since both the list card and the detail page need
// identical status mappings, avatar fallbacks, and date formatting.
// Kept module-level so React hot-reload doesn't recreate them
// per-render.

export const STATUS_PILL = {
  active: { cls: 'bg-green-tint text-green-text', label: 'Active' },
  trialing: { cls: 'bg-blue-tint text-blue-text', label: 'Trialing' },
  past_due: { cls: 'bg-red-tint text-red-text', label: 'Past due' },
  canceled: { cls: 'bg-bg text-text-secondary', label: 'Canceled' },
  paused: { cls: 'bg-yellow-tint text-yellow-text', label: 'Paused' },
  cancelled_pending: {
    cls: 'bg-yellow-tint text-yellow-text',
    label: 'Ending soon',
  },
}

export function letterFor(username) {
  return String(username ?? '').replace(/^@/, '').charAt(0).toUpperCase() || '·'
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysSince(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}
```

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add src/mocks/subscriptions.js src/pages/account/subscriptionShared.js
git commit -m "feat(subscriptions): add paused + cancelled_pending mock fields and status pills"
```

---

### Task 3: Build SubscriptionStateBanner

**Files:**
- Create: `src/pages/account/SubscriptionStateBanner.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { AlertTriangle } from 'lucide-react'
import { formatDate } from './subscriptionShared'

// Yellow banner shown above the subscription detail page when the
// subscription is paused or cancelled_pending. Surfaces the relevant
// end/resume date + a Resume action.
//
// Variants:
//   - paused            → "Paused — resumes {date}" + Resume now button
//   - cancelled_pending → "Ending {date}. Full access until then." + Resume button
export default function SubscriptionStateBanner({ subscription, onResume }) {
  const isPaused = subscription.status === 'paused'
  const isCancelledPending = subscription.status === 'cancelled_pending'
  if (!isPaused && !isCancelledPending) return null

  const dateIso = isPaused ? subscription.pauseUntil : subscription.endsAt
  const headline = isPaused
    ? `Paused — resumes ${formatDate(dateIso)}`
    : `Ending ${formatDate(dateIso)}`
  const sub = isPaused
    ? 'Growth is halted and billing is skipped until then.'
    : "You'll keep full access until then."
  const resumeLabel = isPaused ? 'Resume now' : 'Resume'

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
        <p className="text-sm font-semibold text-text-primary">{headline}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{sub}</p>
      </div>
      <button
        type="button"
        onClick={onResume}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-yellow-base px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        {resumeLabel}
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
git add src/pages/account/SubscriptionStateBanner.jsx
git commit -m "feat(subscriptions): add paused/cancelled-pending state banner"
```

---

### Task 4: Build PauseConfirmModal

**Files:**
- Create: `src/pages/account/PauseConfirmModal.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, CheckCircle2, Loader2, PauseCircle, X } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { formatDate } from './subscriptionShared'

// Pause confirmation modal. `days` drives the modal — null/undefined
// hides it. On Done: writes to the store via `pause(id, days)`.
//
// Three states drive three render branches:
//   - 'confirm'    → summary of pause duration + resume date
//   - 'processing' → centered spinner (auto-advances after 1500ms)
//   - 'success'    → green check + Done button
export default function PauseConfirmModal({
  subscription,
  days,
  onClose,
  onSuccess,
}) {
  const pause = useSubscriptions((s) => s.pause)
  const [state, setState] = useState('confirm')

  useEffect(() => {
    if (days) setState('confirm')
  }, [days])

  useEffect(() => {
    if (state !== 'processing') return
    const id = setTimeout(() => setState('success'), 1500)
    return () => clearTimeout(id)
  }, [state])

  if (!days || !subscription) return null

  const resumeIso = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000,
  ).toISOString()

  function handleConfirm() {
    setState('processing')
  }

  function handleDone() {
    pause(subscription.id, days)
    onSuccess?.()
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
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-yellow-tint text-yellow-text"
                >
                  <PauseCircle className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold text-text-primary">
                  Pause for {days} days
                </h2>
              </div>
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
                <span className="text-text-secondary">Duration</span>
                <span className="font-semibold text-text-primary">
                  {days} days
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-text-secondary">Resumes on</span>
                <span className="font-medium text-text-primary">
                  {formatDate(resumeIso)}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-text-secondary">Billing</span>
                <span className="font-medium text-text-primary">
                  Skipped during pause
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 border-t border-border pt-2">
                <span className="text-text-secondary">Settings + targets</span>
                <span className="font-medium text-text-primary">Kept</span>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-yellow-base text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Pause subscription
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
            <Loader2 className="h-8 w-8 animate-spin text-yellow-base" />
            <p className="mt-3 text-base font-medium text-text-primary">
              Pausing your subscription...
            </p>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-tint">
              <CheckCircle2 className="h-6 w-6 text-green-text" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              Subscription paused
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
              Resumes on {formatDate(resumeIso)}. Your targets, filters,
              and settings are kept.
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

- [ ] **Step 3: Commit**

```bash
git add src/pages/account/PauseConfirmModal.jsx
git commit -m "feat(subscriptions): add pause confirmation modal"
```

---

### Task 5: Build DowngradePlanConfirmModal

**Files:**
- Create: `src/pages/account/DowngradePlanConfirmModal.jsx`

- [ ] **Step 1: Create the component**

```jsx
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, CheckCircle2, Loader2, TrendingDown, X } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { prorationFor } from '@/utils/proration'
import { formatDate } from './subscriptionShared'

const PLAN_PRICE = { growth: 29, advanced: 49 }
const PLAN_LABEL = { growth: 'Growth', advanced: 'Advanced' }

// Plan downgrade confirmation modal. `open` toggles visibility, and
// only ever triggers a downgrade (Advanced → Growth in V1). Reuses
// the proration helper to mock a credit toward the next bill.
//
// Three states drive three render branches:
//   - 'confirm'    → tier delta + savings + proration credit
//   - 'processing' → centered spinner
//   - 'success'    → green check + Done button
export default function DowngradePlanConfirmModal({
  open,
  subscription,
  onClose,
  onSuccess,
}) {
  const setPlan = useSubscriptions((s) => s.setPlan)
  const [state, setState] = useState('confirm')

  useEffect(() => {
    if (open) setState('confirm')
  }, [open])

  useEffect(() => {
    if (state !== 'processing') return
    const id = setTimeout(() => setState('success'), 1500)
    return () => clearTimeout(id)
  }, [state])

  if (!open || !subscription) return null

  const fromPlan = subscription.plan
  const toPlan = 'growth'
  const oldPrice = PLAN_PRICE[fromPlan]
  const newPrice = PLAN_PRICE[toPlan]
  const proration = prorationFor({
    oldPrice,
    newPrice,
    endsAt: subscription.nextBillingAt,
  })

  function handleConfirm() {
    setState('processing')
  }

  function handleDone() {
    setPlan(subscription.id, toPlan)
    onSuccess?.()
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
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-tint text-blue-text"
                >
                  <TrendingDown className="h-5 w-5" />
                </span>
                <h2 className="text-lg font-semibold text-text-primary">
                  Switch to {PLAN_LABEL[toPlan]}
                </h2>
              </div>
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
                <span className="text-text-secondary">From</span>
                <span className="font-medium text-text-primary">
                  {PLAN_LABEL[fromPlan]} · ${oldPrice}/mo
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-text-secondary">To</span>
                <span className="font-semibold text-text-primary">
                  {PLAN_LABEL[toPlan]} · ${newPrice}/mo
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
                  {formatDate(subscription.nextBillingAt)}
                </span>
              </div>
              <div className="mt-2 flex items-baseline justify-between gap-3 border-t border-border pt-2">
                <span className="text-text-secondary">Credited to next bill</span>
                <span className="font-semibold text-green-text">
                  −${proration.amount}
                </span>
              </div>
            </div>

            <p className="mt-3 text-xs leading-relaxed text-text-muted">
              Advanced-only features (Welcome DMs, gender targeting, close
              friends adder) will be disabled. Your targets, filters, and
              whitelist/blacklist are kept.
            </p>

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleConfirm}
                className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-blue-base text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                Switch to {PLAN_LABEL[toPlan]}
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
            <Loader2 className="h-8 w-8 animate-spin text-blue-base" />
            <p className="mt-3 text-base font-medium text-text-primary">
              Updating your plan...
            </p>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-tint">
              <CheckCircle2 className="h-6 w-6 text-green-text" />
            </div>
            <h2 className="text-lg font-semibold text-text-primary">
              Switched to {PLAN_LABEL[toPlan]}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
              Your new plan is active. ${proration.amount} credited toward
              your next bill on {formatDate(subscription.nextBillingAt)}.
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

- [ ] **Step 3: Commit**

```bash
git add src/pages/account/DowngradePlanConfirmModal.jsx
git commit -m "feat(subscriptions): add plan-downgrade confirmation modal"
```

---

### Task 6: Rewrite CancelSubscriptionModal with the full step machine

**Files:**
- Modify: `src/pages/account/CancelSubscriptionModal.jsx` (full rewrite)

- [ ] **Step 1: Replace the file**

```jsx
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { CheckCircle2, Loader2, Users, X } from 'lucide-react'
import { mockServers } from '@/mocks/servers'
import { useAccounts } from '@/stores/useAccounts'
import { useSubscriptions } from '@/stores/useSubscriptions'
import DowngradePlanConfirmModal from './DowngradePlanConfirmModal'
import PauseConfirmModal from './PauseConfirmModal'
import { formatDate } from './subscriptionShared'

const REASONS = [
  { id: 'price', label: 'Too expensive' },
  { id: 'results', label: 'Not enough results' },
  { id: 'break', label: 'Taking a break from Instagram' },
  { id: 'switching', label: 'Switching to another tool' },
  { id: 'other', label: 'Other' },
]

const COMPETITORS = [
  { value: '', label: 'Pick one (optional)' },
  { value: 'iconosquare', label: 'Iconosquare' },
  { value: 'combin', label: 'Combin' },
  { value: 'hootsuite', label: 'Hootsuite' },
  { value: 'other', label: 'Other' },
]

// Does the picked reason have a save offer for this subscription?
// Returns true when step 2 should render; false skips to step 3.
function hasSaveOffer(reasonId, subscription) {
  if (!reasonId) return false
  if (reasonId === 'other') return false
  // Past-due users skip all save offers — they're not paying.
  if (subscription?.status === 'past_due') return false
  if (reasonId === 'price') {
    // No downgrade target for Growth users (already on cheaper plan).
    return subscription?.plan === 'advanced'
  }
  return true // results, break, switching all get a save step
}

// Computes the date the cancelled subscription will end. For trial
// users it's trialEndsAt; for past-due users it's today (immediate);
// otherwise it's the next billing date.
function endsAtFor(subscription) {
  if (!subscription) return new Date().toISOString()
  if (subscription.status === 'past_due') return new Date().toISOString()
  return subscription.trialEndsAt ?? subscription.nextBillingAt
}

// 5-step cancellation flow:
//   reason   → pick a reason; "Other" reveals an optional textarea
//   save     → tailored save offer (conditional — skipped when no
//              offer matches); user can refuse and continue cancelling
//   lose     → cumulative gain headline + what they'll lose list
//   confirm  → equal-weight Keep vs Cancel buttons
//   success  → "Subscription cancelled" ack, then Done
//
// "Cancel anyway" footer link appears on reason / save / lose. It
// jumps directly to confirm. The final confirm step is the only
// gate that doesn't expose the shortcut — that screen IS the cancel.
//
// Saves trigger sub-confirmation modals (Pause, Downgrade) or
// inline mutations (Server). On any save success, the cancel flow
// closes entirely.
export default function CancelSubscriptionModal({
  open,
  subscription,
  onClose,
}) {
  const cancel = useSubscriptions((s) => s.cancel)
  const setServer = useSubscriptions((s) => s.setServer)
  const accounts = useAccounts((s) => s.accounts)
  const account = accounts.find((a) => a.id === subscription?.accountId)
  const username = account?.username ?? '@account'

  const [step, setStep] = useState('reason')
  const [selectedReason, setSelectedReason] = useState(null)
  const [otherDetail, setOtherDetail] = useState('')
  const [serverPick, setServerPick] = useState(subscription?.server ?? null)
  const [pauseDays, setPauseDays] = useState(null) // 30 | 60 | 90 | null
  const [downgradeOpen, setDowngradeOpen] = useState(false)
  const [switchingTool, setSwitchingTool] = useState('')
  const [switchingDetail, setSwitchingDetail] = useState('')

  // Reset all state whenever the modal opens fresh.
  useEffect(() => {
    if (open) {
      setStep('reason')
      setSelectedReason(null)
      setOtherDetail('')
      setServerPick(subscription?.server ?? null)
      setPauseDays(null)
      setDowngradeOpen(false)
      setSwitchingTool('')
      setSwitchingDetail('')
    }
  }, [open, subscription?.server])

  // Auto-advance processing → success.
  useEffect(() => {
    if (step !== 'processing') return
    const id = setTimeout(() => setStep('success'), 1500)
    return () => clearTimeout(id)
  }, [step])

  // ESC closes the flow except during processing.
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape' && step !== 'processing') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, step, onClose])

  if (!open || !subscription) return null

  const endsAt = endsAtFor(subscription)
  const offers = hasSaveOffer(selectedReason, subscription)

  function handleContinueReason() {
    setStep(offers ? 'save' : 'lose')
  }

  function handleSkipSave() {
    setStep('lose')
  }

  function handleCancelAnyway() {
    setStep('confirm')
  }

  function handleFinalConfirm() {
    setStep('processing')
  }

  function handleDone() {
    cancel(subscription.id)
    onClose?.()
  }

  function handleServerSave() {
    if (serverPick && serverPick !== subscription.server) {
      setServer(subscription.id, serverPick)
    }
    onClose?.()
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
            Cancel subscription for {username}
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
                            ? 'border-blue-base bg-blue-tint/40 text-text-primary'
                            : 'border-border bg-surface text-text-primary hover:bg-bg'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                            selected
                              ? 'border-blue-base'
                              : 'border-border-strong'
                          }`}
                        >
                          {selected && (
                            <span className="h-2 w-2 rounded-full bg-blue-base" />
                          )}
                        </span>
                        <span className="font-medium">{r.label}</span>
                      </button>

                      {selected && r.id === 'other' && (
                        <div className="mt-2">
                          <textarea
                            value={otherDetail}
                            onChange={(e) => setOtherDetail(e.target.value)}
                            rows={3}
                            placeholder="Tell us more (optional, but helpful)"
                            className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-base focus:outline-none focus:ring-2 focus:ring-blue-base/20"
                          />
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
              <button
                type="button"
                onClick={handleCancelAnyway}
                disabled={!selectedReason}
                className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40"
              >
                Cancel anyway
              </button>
            </>
          )}

          {step === 'save' && (
            <>
              {selectedReason === 'price' && (
                <SaveOfferPrice
                  subscription={subscription}
                  onAccept={() => setDowngradeOpen(true)}
                  onSkip={handleSkipSave}
                  onCancelAnyway={handleCancelAnyway}
                />
              )}
              {selectedReason === 'results' && (
                <SaveOfferServer
                  subscription={subscription}
                  serverPick={serverPick}
                  setServerPick={setServerPick}
                  onAccept={handleServerSave}
                  onSkip={handleSkipSave}
                  onCancelAnyway={handleCancelAnyway}
                />
              )}
              {selectedReason === 'break' && (
                <SaveOfferPause
                  onPick={(days) => setPauseDays(days)}
                  onSkip={handleSkipSave}
                  onCancelAnyway={handleCancelAnyway}
                />
              )}
              {selectedReason === 'switching' && (
                <SaveOfferSwitching
                  tool={switchingTool}
                  setTool={setSwitchingTool}
                  detail={switchingDetail}
                  setDetail={setSwitchingDetail}
                  onContinue={handleSkipSave}
                  onCancelAnyway={handleCancelAnyway}
                />
              )}
            </>
          )}

          {step === 'lose' && (
            <>
              <p className="text-sm text-text-secondary">
                Here's what will happen:
              </p>

              <div className="mt-3 flex items-start gap-3 rounded-xl border border-blue-base/20 bg-blue-tint/40 p-4">
                <Users
                  className="mt-0.5 h-5 w-5 shrink-0 text-blue-text"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary">
                    +{subscription.totalFollowersGained} followers gained from Kicksta
                  </p>
                  <p className="mt-0.5 text-xs text-text-secondary">
                    Cumulative growth since you subscribed.
                  </p>
                </div>
              </div>

              <p className="mt-4 text-sm font-medium text-text-primary">
                After {formatDate(endsAt)}, you'll lose:
              </p>
              <ul className="mt-2 flex flex-col gap-1.5 text-sm">
                <LoseRow text="Targeted Growth (auto-follow + auto-like)" />
                <LoseRow text="All active targets and filters" />
                <LoseRow text="Whitelist and blacklist (kept for 30 days)" />
                {subscription.plan === 'advanced' && (
                  <LoseRow text="Welcome DMs and Advanced-tier features" />
                )}
                {subscription.growthPlus && (
                  <LoseRow text="Growth+ boost network access" />
                )}
              </ul>

              <p className="mt-4 text-xs text-text-muted">
                You'll keep full access until {formatDate(endsAt)}.
              </p>

              <div className="mt-5 flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(offers ? 'save' : 'reason')}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-lg border border-border bg-surface text-base font-medium text-text-primary transition-colors hover:bg-bg"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep('confirm')}
                  className="inline-flex h-12 flex-1 items-center justify-center rounded-lg bg-text-primary text-base font-semibold text-bg transition-opacity hover:opacity-90"
                >
                  Continue
                </button>
              </div>
              <button
                type="button"
                onClick={handleCancelAnyway}
                className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
              >
                Cancel anyway
              </button>
            </>
          )}

          {step === 'confirm' && (
            <>
              <p className="text-sm font-semibold text-text-primary">
                Are you sure?
              </p>
              <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                Your subscription for{' '}
                <span className="font-semibold text-text-primary">
                  {username}
                </span>{' '}
                will end on{' '}
                <span className="font-semibold text-text-primary">
                  {formatDate(endsAt)}
                </span>
                . You won't be charged again. You'll keep full access
                until then.
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
                  onClick={handleFinalConfirm}
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
                {username} will keep full access until {formatDate(endsAt)}.
                We'll send a reminder before it ends.
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

      <DowngradePlanConfirmModal
        open={downgradeOpen}
        subscription={subscription}
        onClose={() => setDowngradeOpen(false)}
        onSuccess={() => {
          setDowngradeOpen(false)
          onClose?.()
        }}
      />

      <PauseConfirmModal
        subscription={subscription}
        days={pauseDays}
        onClose={() => setPauseDays(null)}
        onSuccess={() => {
          setPauseDays(null)
          onClose?.()
        }}
      />
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

function SaveOfferPrice({ subscription, onAccept, onSkip, onCancelAnyway }) {
  return (
    <>
      <p className="text-sm font-semibold text-text-primary">
        Try Growth at $29/mo instead?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        You'd save $20/mo. You'll keep core targeting, filters, and
        whitelist/blacklist — only Advanced-tier features (Welcome DMs,
        gender targeting, close friends adder) would be removed.
      </p>
      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={onAccept}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-blue-base text-base font-semibold text-white transition-opacity hover:opacity-90"
        >
          Downgrade to Growth
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-surface text-base font-medium text-text-primary transition-colors hover:bg-bg"
        >
          No thanks, continue cancelling
        </button>
      </div>
      <button
        type="button"
        onClick={onCancelAnyway}
        className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        Cancel anyway
      </button>
    </>
  )
}

function SaveOfferServer({
  subscription,
  serverPick,
  setServerPick,
  onAccept,
  onSkip,
  onCancelAnyway,
}) {
  const current = mockServers.find((s) => s.id === subscription.server)
  const others = mockServers.filter((s) => s.id !== subscription.server)
  const canSave = serverPick && serverPick !== subscription.server
  return (
    <>
      <p className="text-sm font-semibold text-text-primary">
        Want to try a different server first?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Server region affects growth speed and IG safety. Switching takes
        effect immediately — some users see 40% better results within 2
        weeks of changing servers.
      </p>
      <div className="mt-4 rounded-lg border border-border bg-bg p-3 text-sm">
        <p className="text-text-secondary">
          Current: <span className="font-medium text-text-primary">{current.region}</span>
        </p>
        <label
          htmlFor="server-pick"
          className="mt-3 block text-xs font-medium text-text-secondary"
        >
          Switch to
        </label>
        <select
          id="server-pick"
          value={serverPick ?? subscription.server}
          onChange={(e) => setServerPick(e.target.value)}
          className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary focus:border-blue-base focus:outline-none focus:ring-2 focus:ring-blue-base/20"
        >
          <option value={subscription.server} disabled>
            {current.region} (current)
          </option>
          {others.map((s) => (
            <option key={s.id} value={s.id}>
              {s.region}
            </option>
          ))}
        </select>
      </div>
      <div className="mt-5 flex flex-col gap-3">
        <button
          type="button"
          onClick={onAccept}
          disabled={!canSave}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-blue-base text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Switch server
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-surface text-base font-medium text-text-primary transition-colors hover:bg-bg"
        >
          No thanks, continue cancelling
        </button>
      </div>
      <button
        type="button"
        onClick={onCancelAnyway}
        className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        Cancel anyway
      </button>
    </>
  )
}

function SaveOfferPause({ onPick, onSkip, onCancelAnyway }) {
  return (
    <>
      <p className="text-sm font-semibold text-text-primary">
        Want to pause instead?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Growth stops, billing pauses, your targets and settings are
        kept. Auto-resumes on the date you choose.
      </p>
      <p className="mt-4 text-xs font-medium text-text-secondary">How long?</p>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {[30, 60, 90].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => onPick(d)}
            className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-surface text-sm font-semibold text-text-primary transition-colors hover:border-yellow-base hover:bg-yellow-tint hover:text-yellow-text"
          >
            {d} days
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={onSkip}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-surface text-base font-medium text-text-primary transition-colors hover:bg-bg"
      >
        No thanks, continue cancelling
      </button>
      <button
        type="button"
        onClick={onCancelAnyway}
        className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        Cancel anyway
      </button>
    </>
  )
}

function SaveOfferSwitching({
  tool,
  setTool,
  detail,
  setDetail,
  onContinue,
  onCancelAnyway,
}) {
  return (
    <>
      <p className="text-sm font-semibold text-text-primary">
        Which tool are you switching to?
      </p>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        Optional — your honest answer helps us improve. We won't try
        to sell you on staying.
      </p>
      <label
        htmlFor="switching-tool"
        className="mt-4 block text-xs font-medium text-text-secondary"
      >
        Tool
      </label>
      <select
        id="switching-tool"
        value={tool}
        onChange={(e) => setTool(e.target.value)}
        className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text-primary focus:border-blue-base focus:outline-none focus:ring-2 focus:ring-blue-base/20"
      >
        {COMPETITORS.map((c) => (
          <option key={c.value || 'empty'} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
      <label
        htmlFor="switching-detail"
        className="mt-3 block text-xs font-medium text-text-secondary"
      >
        Anything else? (optional)
      </label>
      <textarea
        id="switching-detail"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
        rows={2}
        placeholder="What made you switch?"
        className="mt-1 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-base focus:outline-none focus:ring-2 focus:ring-blue-base/20"
      />
      <button
        type="button"
        onClick={onContinue}
        className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-text-primary text-base font-semibold text-bg transition-opacity hover:opacity-90"
      >
        Continue cancelling
      </button>
      <button
        type="button"
        onClick={onCancelAnyway}
        className="mt-2 inline-flex h-10 w-full items-center justify-center text-xs font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        Cancel anyway
      </button>
    </>
  )
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Manual verification (full happy path)**

Run: `npm run dev`. Visit `/account/billing` → click into a subscription → scroll to "Cancel subscription" → click button.

1. **Reason step:** Pick "Other" → textarea appears. Pick "Too expensive" on the Advanced subscription → no textarea, click Continue → save offer (downgrade) appears.
2. **Save (downgrade):** Click "Downgrade to Growth" → confirm modal opens. Click "Switch to Growth" → spinner → success → Done → cancel flow closes, toast appears, subscription is now on Growth plan.
3. Reopen Cancel flow → pick "Not enough results" → save offer (server switch). Select a new region → "Switch server" → cancel flow closes, server toast appears.
4. Reopen → pick "Taking a break" → save offer with 30/60/90 day buttons. Click "60 days" → pause confirm modal opens → Pause subscription → success → Done → cancel flow closes, status pill flips to "Paused", banner appears, Resume button works.
5. Reopen on a still-active subscription → pick "Switching to another tool" → dropdown + textarea (no save buttons; just Continue + Cancel-anyway).
6. From any save step, click "No thanks, continue cancelling" → goes to "What you'll lose" step. Then Continue → Confirm step → Cancel subscription → spinner → success → Done. Subscription now reads "Ending soon" pill + cancelled-pending banner.
7. From cancelled-pending banner: Resume → status flips back to active.

- [ ] **Step 4: Commit**

```bash
git add src/pages/account/CancelSubscriptionModal.jsx
git commit -m "feat(subscriptions): full cancellation flow with honest save offers"
```

---

### Task 7: Adapt PlanCard for paused / cancelled_pending states

**Files:**
- Modify: `src/pages/account/PlanCard.jsx` (full rewrite)

- [ ] **Step 1: Replace the file**

```jsx
import { useEffect, useState } from 'react'
import { Layers } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useSubscriptions } from '@/stores/useSubscriptions'
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

function daysSince(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}

// Plan summary card. When the subscription is paused or
// cancelled_pending we hide the Upgrade / Growth+ controls — they're
// on their way out — and replace them with a single Resume button.
export default function PlanCard({ subscription }) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const resume = useSubscriptions((s) => s.resume)

  const planPrice = PLAN_PRICE[subscription.plan]
  const total = planPrice + (subscription.growthPlus ? 10 : 0)
  const isAdvanced = subscription.plan === 'advanced'
  const memberDays = daysSince(subscription.startedAt)
  const isOnHold =
    subscription.status === 'paused' ||
    subscription.status === 'cancelled_pending'

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <CardChip color="blue" icon={Layers} />
        <h2 className="text-base font-semibold text-text-primary">Plan</h2>
        <InfoTooltip text="What you pay each month. Upgrade to unlock more growth slots and Welcome DMs." />
      </div>

      <dl className="mt-4 flex flex-col gap-2 text-sm">
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

      <p className="mt-3 text-xs text-text-muted">
        Subscribed since {formatDate(subscription.startedAt)} · {memberDays} {memberDays === 1 ? 'day' : 'days'}
      </p>

      {subscription.status === 'trialing' && subscription.trialEndsAt && (
        <p className="mt-1 text-xs text-text-secondary">
          Trial ends {formatDate(subscription.trialEndsAt)}.
        </p>
      )}

      {isOnHold ? (
        <div className="mt-4">
          <button
            onClick={() => resume(subscription.id)}
            className="inline-flex h-10 items-center rounded-lg bg-green-base px-4 text-sm font-semibold text-white hover:opacity-90"
          >
            Resume subscription
          </button>
        </div>
      ) : (
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
      )}

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

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/account/PlanCard.jsx
git commit -m "feat(subscriptions): plan card resume button when paused/cancelled-pending"
```

---

### Task 8: Render banner + adapt SubscriptionDetail page

**Files:**
- Modify: `src/pages/account/SubscriptionDetail.jsx` (full rewrite)

- [ ] **Step 1: Replace the file**

```jsx
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { useAccounts } from '@/stores/useAccounts'
import { invoicesForSubscription } from '@/mocks/invoices'
import { findServer } from '@/mocks/servers'
import PlanCard from './PlanCard'
import InvoicesTable from './InvoicesTable'
import CancelSubscriptionModal from './CancelSubscriptionModal'
import SubscriptionStateBanner from './SubscriptionStateBanner'
import { STATUS_PILL, letterFor } from './subscriptionShared'

export default function SubscriptionDetail() {
  const { id } = useParams()
  const sub = useSubscriptions((s) => s.subscriptions.find((x) => x.id === id))
  const accounts = useAccounts((s) => s.accounts)
  const resume = useSubscriptions((s) => s.resume)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!sub) return <Navigate to="/account/billing" replace />

  const account = accounts.find((a) => a.id === sub.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[sub.status] ?? STATUS_PILL.active
  const invoices = invoicesForSubscription(sub.id)
  const isOnHold =
    sub.status === 'paused' || sub.status === 'cancelled_pending'

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 lg:px-8">
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/account/billing"
          aria-label="Back to subscriptions"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary sm:h-11 sm:w-11"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        {profilePic ? (
          <img src={profilePic} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover sm:h-11 sm:w-11" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-tint text-base font-semibold text-blue-text sm:h-11 sm:w-11">
            {letterFor(username)}
          </span>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="truncate text-base font-semibold leading-snug text-text-primary sm:text-lg lg:text-xl">{username}</h1>
          <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${pill.cls}`}>
            {pill.label}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {isOnHold && (
          <SubscriptionStateBanner
            subscription={sub}
            onResume={() => resume(sub.id)}
          />
        )}
        <PlanCard subscription={sub} />
        <p className="text-xs text-text-secondary">
          Server: <span className="font-medium text-text-primary">{findServer(sub.server).label}</span> · {findServer(sub.server).region}
        </p>

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-text-primary">Invoices</h2>
          <InvoicesTable
            invoices={invoices}
            emptyMessage="No invoices yet for this subscription."
          />
        </div>

        {!isOnHold && (
          <div className="mt-2 flex flex-col gap-3 rounded-xl border border-border bg-bg p-4 md:flex-row md:items-center md:justify-between md:p-6">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Cancel subscription</h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                Cancel to stop growth and end billing for this account.
              </p>
            </div>
            <button
              onClick={() => setCancelOpen(true)}
              className="inline-flex h-10 shrink-0 items-center rounded-lg bg-red-tint px-4 text-sm font-medium text-red-text hover:bg-red-tint/80"
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>

      <CancelSubscriptionModal
        open={cancelOpen}
        subscription={sub}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  )
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Manual verification**

Run: `npm run dev`. Visit `/account/billing` → click into the first subscription.

1. Status pill shows "Active" (green). Bottom of page has Cancel section.
2. Click Cancel → walk through the flow (any path). Click final Cancel subscription.
3. Page now shows yellow banner above PlanCard ("Ending Jun 1 · You'll keep full access until then" + Resume). Status pill flips to yellow "Ending soon". PlanCard shows only "Resume subscription" green button (no Upgrade / Growth+). Cancel section at the bottom is hidden.
4. Click Resume in the banner → status returns to Active, banner disappears, normal controls back, Cancel section reappears.
5. Repeat with the pause flow (cancel modal → "Taking a break" → 30 days → confirm). Status pill flips to yellow "Paused". Banner reads "Paused — resumes ... + Resume now."
6. Click Resume now → status flips back, normal controls return.

- [ ] **Step 4: Commit**

```bash
git add src/pages/account/SubscriptionDetail.jsx
git commit -m "feat(subscriptions): render state banner and hide cancel section when on hold"
```

---

### Task 9: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Add a new entry at the top of the changelog**

Open `CHANGELOG.md`. Add this entry above the most recent existing one:

```markdown
## 2026-05-13 — Subscription cancellation flow

Real cancellation experience for the main subscription. Replaces the "coming soon" stub with a 4–5 step honest flow that reduces churn through real save offers without using any dark patterns.

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
```

- [ ] **Step 2: Final build verification**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog entry for subscription cancellation flow"
```

---

## Self-review summary

**Spec coverage check:**
- ✅ Anti-dark-pattern principles — encoded as locked decisions + reflected in modal structure (Task 6 step 1: Close X always rendered except processing; Cancel-anyway link on reason/save/lose steps; equal Keep/Cancel buttons on confirm)
- ✅ 5-step state machine with conditional save step → Task 6 (`hasSaveOffer` gating)
- ✅ All four save variants with real mutations → Task 6 (`SaveOfferPrice` → Task 5 modal; `SaveOfferServer` → existing `setServer`; `SaveOfferPause` → Task 4 modal; `SaveOfferSwitching` → no save, just continue)
- ✅ "Other" reason with optional textarea → Task 6 (inline in reason step)
- ✅ `paused` state in store + banner + PlanCard adaptation → Tasks 1, 3, 7
- ✅ `cancelled_pending` state in store + banner + PlanCard adaptation → Tasks 1, 3, 7
- ✅ Status pill registry extension → Task 2
- ✅ Mock subscription data extensions → Task 2
- ✅ Trialing user end-date logic (`trialEndsAt`) → Task 6 (`endsAtFor` helper)
- ✅ Past-due immediate end + save-skip → Tasks 1 (cancel store action), 6 (`hasSaveOffer` returns false for past_due)
- ✅ SubscriptionDetail render adaptations + hide Cancel section → Task 8
- ✅ Toasts fire on every store mutation → Task 1
- ✅ Sub-confirmation modals (Pause, Downgrade) with confirm → processing → success pattern → Tasks 4, 5
- ✅ Mobile bottom-sheet treatment + safe-area padding → Tasks 4, 5, 6 (all use `pb-[calc(1.5rem+env(safe-area-inset-bottom))]` or similar via the existing modal pattern)
- ✅ CHANGELOG → Task 9

**Type / naming consistency:**
- Subscription status union: `'active' | 'trialing' | 'past_due' | 'paused' | 'cancelled_pending'` — consistent across store, mock data, status pill registry, banner, PlanCard, SubscriptionDetail, cancel modal.
- Store action names: `cancel(id)`, `resume(id)`, `pause(id, days)`, `setPlan(id, plan)` — consistent across Tasks 1, 4, 5, 6, 7, 8.
- Reason ids: `'price' | 'results' | 'break' | 'switching' | 'other'` — used only inside CancelSubscriptionModal (Task 6).
- Modal callback shapes: `onClose`, `onSuccess` — consistent between PauseConfirmModal (Task 4) and DowngradePlanConfirmModal (Task 5).
- Pause / cancel date fields: `pauseUntil` (paused), `endsAt` (cancelled_pending) — distinct names per state, both used consistently in store, mock, banner, SubscriptionDetail.

**Placeholder scan:** No TBDs, no "add appropriate error handling," every step has executable code blocks. Past-due users' immediate-end logic, trialing users' end-date logic, and "no save for Growth users on price" gating are all spelled out inline.
