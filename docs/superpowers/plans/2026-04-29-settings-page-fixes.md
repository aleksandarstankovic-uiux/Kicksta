# Settings Page Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the post-shipping fixes from the audit — desktop sub-nav selected state, ProfilePanel restructure (single card, modal-only edits, drop Communication), multiple payment methods + active-card switching, billing-history compaction, simpler SubscriptionCard, and a mobile nav rework that lifts `/account/subscriptions/:id` out of the settings shell.

**Architecture:** Existing settings shell at `src/pages/account/index.jsx` evolves into a viewport-aware container that swaps between desktop two-pane and mobile push navigation. Subscription detail lifts to a sibling route under `DashboardLayout`. The single-card payment store becomes a list (`usePaymentMethods` plural) with primary-card semantics. Profile inline edits become four focused modals dispatched via window CustomEvent — same pattern already used for `open-password-modal`.

**Tech Stack:** React 19 · React Router 7 · Tailwind 4 · Zustand 5 · Lucide React. No tests run for V1; verification is manual at narrow + wide widths in light + dark mode (do not share screenshots — only flag breakage).

**Spec:** `docs/superpowers/specs/2026-04-29-settings-page-fixes-design.md`

**Frequent commits:** Each task ends with a commit using the existing `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` footer. Working on `main` per established workflow; tag `pre-settings-fixes-2026-04-29` first.

---

## File map

**Create:**
```
src/mocks/paymentMethods.js              # plural seed data
src/stores/usePaymentMethods.js          # plural store
src/pages/account/PaymentMethodsCard.jsx # list of cards + add row
src/pages/account/EditNameModal.jsx
src/pages/account/EditEmailModal.jsx
src/pages/account/EditPhoneModal.jsx
```

**Modify:**
```
src/App.jsx                              # lift subs detail to sibling route
src/pages/account/index.jsx              # viewport-aware mobile header + 4 modal listeners
src/pages/account/SettingsNav.jsx        # desktop active-state accent bar + filled chip
src/pages/account/ProfilePanel.jsx       # rewritten — single card, modals, no comm section
src/pages/account/EditPaymentModal.jsx   # supports add-mode + edit-mode (id prop)
src/pages/account/PaymentPanel.jsx       # mounts PaymentMethodsCard
src/pages/account/InvoicesTable.jsx      # compact 2-line mobile rows + truncate desktop description
src/pages/account/SubscriptionCard.jsx   # drop Currently-active pill, drop server, footer = next billing
src/pages/account/SubscriptionDetail.jsx # standalone page chrome (back arrow icon button, no settings shell)
src/stores/useUserProfile.js             # drop commPrefs + setCommPref
```

**Delete (after rename):**
```
src/mocks/paymentMethod.js               # superseded by paymentMethods.js
src/stores/usePaymentMethod.js           # superseded by usePaymentMethods.js
src/pages/account/PaymentMethodCard.jsx  # superseded by PaymentMethodsCard.jsx
```

**Retain unchanged:**
```
PlanCard.jsx, ServerCard.jsx, ChangeServerModal.jsx, AddSubscriptionModal.jsx,
CancelSubscriptionModal.jsx, ConfirmGrowthPlusModal.jsx, SubscriptionsList.jsx,
PasswordModal.jsx, subscriptionShared.js
src/stores/useSubscriptions.js, useUserProfile.js (only commPrefs lines removed)
src/mocks/subscriptions.js, invoices.js, servers.js
```

---

## Task 1: Tag restore point

**Files:**
- (None — git only)

- [ ] **Step 1: Tag the current main**

Run:
```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git tag pre-settings-fixes-2026-04-29
git rev-parse pre-settings-fixes-2026-04-29
```

Expected: prints the SHA of HEAD (currently `5901ffa` or later).

- [ ] **Step 2: No commit needed**

Tags are local refs; we just want a known restore point before touching anything.

---

## Task 2: New paymentMethods mock + store (plural)

**Files:**
- Create: `src/mocks/paymentMethods.js`
- Create: `src/stores/usePaymentMethods.js`

- [ ] **Step 1: Create `src/mocks/paymentMethods.js`**

```js
// User-account-level cards on file. Exactly one card has
// `primary: true` at any time — the primary card bills every
// subscription on the account. Per-subscription card overrides
// are deferred to a separate spec.
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

- [ ] **Step 2: Create `src/stores/usePaymentMethods.js`**

```js
import { create } from 'zustand'
import { mockPaymentMethods } from '@/mocks/paymentMethods'
import { useToasts } from '@/stores/useToasts'

const newId = () => `pm_${Math.random().toString(36).slice(2, 8)}`

// Multi-card store. The primary card is the one billed for every
// subscription on the account. Mutations enforce the invariant
// that exactly one card is primary at all times and at least one
// card is on file.
export const usePaymentMethods = create((set, get) => ({
  cards: mockPaymentMethods,

  addCard: (data) => {
    const card = {
      id: newId(),
      brand: data.brand ?? 'card',
      last4: data.last4,
      expMonth: data.expMonth,
      expYear: data.expYear,
      primary: false,
      billingEmail: data.billingEmail,
    }
    set((state) => ({ cards: [...state.cards, card] }))
    useToasts.getState().addToast({ message: 'Card added.', tone: 'success' })
  },

  removeCard: (id) => {
    const cards = get().cards
    if (cards.length <= 1) {
      useToasts.getState().addToast({
        message: 'You need at least one card on file.',
        tone: 'error',
      })
      return
    }
    const target = cards.find((c) => c.id === id)
    if (target?.primary) {
      useToasts.getState().addToast({
        message: "You can't remove the primary card. Set a different card as primary first.",
        tone: 'error',
      })
      return
    }
    set((state) => ({ cards: state.cards.filter((c) => c.id !== id) }))
    useToasts.getState().addToast({ message: 'Card removed.', tone: 'success' })
  },

  setPrimary: (id) => {
    set((state) => ({
      cards: state.cards.map((c) => ({ ...c, primary: c.id === id })),
    }))
    useToasts.getState().addToast({ message: 'Primary card updated.', tone: 'success' })
  },

  updateCard: (id, patch) => {
    set((state) => ({
      cards: state.cards.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }))
    useToasts.getState().addToast({ message: 'Payment method updated.', tone: 'success' })
  },
}))
```

- [ ] **Step 3: Commit**

```bash
git add src/mocks/paymentMethods.js src/stores/usePaymentMethods.js
git commit -m "$(cat <<'EOF'
feat(payment): add multi-card mock + usePaymentMethods store

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: EditPaymentModal supports add-mode + edit-mode

**Files:**
- Modify: `src/pages/account/EditPaymentModal.jsx`

- [ ] **Step 1: Replace the file entirely**

The existing modal mutates a single store. We're rewriting it to (a) accept a `cardId` prop that selects edit-mode vs add-mode, (b) call `addCard` or `updateCard` on `usePaymentMethods` accordingly.

Read the current file first: `cat src/pages/account/EditPaymentModal.jsx`. Then OVERWRITE with:

```jsx
import { useEffect, useState } from 'react'
import { CreditCard, X } from 'lucide-react'
import { usePaymentMethods } from '@/stores/usePaymentMethods'

// Mock payment edit/add. Detects brand from the card-number prefix
// and stores the last 4 digits + expiry + billing email. No real
// processing — replace with Stripe Elements when backend lands.
//
// `cardId` selects edit-mode (prefilled, calls updateCard) vs
// add-mode (no prefill, calls addCard). When `cardId` is null/
// undefined the modal is in add-mode.
function detectBrand(num) {
  const n = num.replace(/\D/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  return 'card'
}

export default function EditPaymentModal({ open, cardId, onClose }) {
  const cards = usePaymentMethods((s) => s.cards)
  const addCard = usePaymentMethods((s) => s.addCard)
  const updateCard = usePaymentMethods((s) => s.updateCard)

  const editing = cards.find((c) => c.id === cardId) ?? null
  const isEdit = !!editing

  const [mounted, setMounted] = useState(false)
  const [number, setNumber] = useState('')
  const [exp, setExp] = useState('')
  const [cvc, setCvc] = useState('')
  const [billingEmail, setBillingEmail] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setNumber('')
    setExp(isEdit ? `${String(editing.expMonth).padStart(2, '0')}/${String(editing.expYear).slice(-2)}` : '')
    setCvc('')
    setBillingEmail(editing?.billingEmail ?? '')
    setError('')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, isEdit, editing])

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
    if (!isEdit && digits.length < 13) return setError('Enter a valid card number.')
    const m = exp.match(/^(\d{2})\s*\/\s*(\d{2,4})$/)
    if (!m) return setError('Expiry must be MM/YY or MM/YYYY.')
    const month = parseInt(m[1], 10)
    if (month < 1 || month > 12) return setError('Invalid expiry month.')
    let year = parseInt(m[2], 10)
    if (year < 100) year += 2000
    if (!isEdit && cvc.replace(/\D/g, '').length < 3) return setError('Enter a valid CVC.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail.trim())) return setError('Enter a valid billing email.')

    if (isEdit) {
      // Edit-mode keeps the existing brand + last4 unless a fresh
      // card number was typed; the form lets the user re-enter to
      // change the underlying card.
      const patch = {
        expMonth: month,
        expYear: year,
        billingEmail: billingEmail.trim(),
      }
      if (digits.length >= 13) {
        patch.brand = detectBrand(digits)
        patch.last4 = digits.slice(-4)
      }
      updateCard(cardId, patch)
    } else {
      addCard({
        brand: detectBrand(digits),
        last4: digits.slice(-4),
        expMonth: month,
        expYear: year,
        billingEmail: billingEmail.trim(),
      })
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
              <CreditCard className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">
              {isEdit ? 'Edit payment method' : 'Add payment method'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <Labeled label={isEdit ? 'New card number (optional)' : 'Card number'}>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder={isEdit ? `Leaves card ending in ${editing.last4} unchanged` : '4242 4242 4242 4242'}
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
                placeholder={isEdit ? 'Re-enter to verify' : '123'}
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
            {isEdit ? 'Save changes' : 'Add card'}
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

- [ ] **Step 2: Commit**

```bash
git add src/pages/account/EditPaymentModal.jsx
git commit -m "$(cat <<'EOF'
feat(payment): EditPaymentModal supports add-mode + edit-mode

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: PaymentMethodsCard (list of cards + add row)

**Files:**
- Create: `src/pages/account/PaymentMethodsCard.jsx`

- [ ] **Step 1: Create `src/pages/account/PaymentMethodsCard.jsx`**

```jsx
import { useEffect, useRef, useState } from 'react'
import { CreditCard, Plus, MoreHorizontal, Star, Pencil, Trash2, Layers } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { usePaymentMethods } from '@/stores/usePaymentMethods'
import { useSubscriptions } from '@/stores/useSubscriptions'
import EditPaymentModal from './EditPaymentModal'

const PLAN_PRICE = { growth: 29, advanced: 49 }

function brandLabel(brand) {
  return { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex' }[brand] ?? 'Card'
}

export default function PaymentMethodsCard() {
  const cards = usePaymentMethods((s) => s.cards)
  const setPrimary = usePaymentMethods((s) => s.setPrimary)
  const removeCard = usePaymentMethods((s) => s.removeCard)
  const subscriptions = useSubscriptions((s) => s.subscriptions)

  const [modalCardId, setModalCardId] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)

  const activeSubs = subscriptions.filter((s) => s.status !== 'canceled')
  const monthlyTotal = activeSubs.reduce(
    (sum, s) => sum + PLAN_PRICE[s.plan] + (s.growthPlus ? 10 : 0),
    0,
  )

  function openEdit(id) {
    setModalCardId(id)
    setModalOpen(true)
  }

  function openAdd() {
    setModalCardId(null)
    setModalOpen(true)
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <CardChip color="blue" icon={CreditCard} />
        <h2 className="text-lg font-semibold leading-snug text-text-primary">Payment method</h2>
        <InfoTooltip text="Cards on file for this account. The primary card is charged for every subscription." />
      </div>

      {/* Prominent usage summary — moved out of the small footer line */}
      <div className="mt-4 flex items-center gap-3 rounded-lg bg-bg p-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface text-text-secondary">
          <Layers className="h-4 w-4" />
        </span>
        <div className="flex flex-col">
          <p className="text-sm font-medium text-text-primary">
            Used by {activeSubs.length} {activeSubs.length === 1 ? 'subscription' : 'subscriptions'}
          </p>
          <p className="text-sm font-semibold text-text-primary">${monthlyTotal}/mo total</p>
        </div>
      </div>

      <ul className="mt-4 flex flex-col gap-2">
        {cards.map((card) => (
          <CardRow
            key={card.id}
            card={card}
            onEdit={() => openEdit(card.id)}
            onSetPrimary={() => setPrimary(card.id)}
            onRemove={() => removeCard(card.id)}
          />
        ))}
        <button
          onClick={openAdd}
          className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-bg/40 text-sm font-medium text-text-secondary hover:border-blue-base hover:bg-blue-tint/40 hover:text-blue-text"
        >
          <Plus className="h-4 w-4" /> Add payment method
        </button>
      </ul>

      <EditPaymentModal
        open={modalOpen}
        cardId={modalCardId}
        onClose={() => setModalOpen(false)}
      />
    </div>
  )
}

function CardRow({ card, onEdit, onSetPrimary, onRemove }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function onClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setMenuOpen(false)
    }
    if (menuOpen) document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [menuOpen])

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
        <CreditCard className="h-5 w-5" />
      </span>
      <div className="flex flex-1 flex-col gap-0.5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-text-primary">
            {brandLabel(card.brand)} ending in {card.last4}
          </p>
          {card.primary && (
            <span className="inline-flex rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
              Primary
            </span>
          )}
        </div>
        <p className="text-xs text-text-secondary">
          Expires {String(card.expMonth).padStart(2, '0')}/{card.expYear}
        </p>
      </div>
      <div ref={ref} className="relative">
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          aria-label="Card actions"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-11 z-20 w-48 rounded-lg border border-border bg-surface shadow-lg">
            {!card.primary && (
              <button
                onClick={() => {
                  setMenuOpen(false)
                  onSetPrimary()
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-bg"
              >
                <Star className="h-4 w-4" /> Set as primary
              </button>
            )}
            <button
              onClick={() => {
                setMenuOpen(false)
                onEdit()
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-text-primary hover:bg-bg"
            >
              <Pencil className="h-4 w-4" /> Edit
            </button>
            <button
              onClick={() => {
                setMenuOpen(false)
                onRemove()
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-text hover:bg-red-tint"
            >
              <Trash2 className="h-4 w-4" /> Remove
            </button>
          </div>
        )}
      </div>
    </li>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/account/PaymentMethodsCard.jsx
git commit -m "$(cat <<'EOF'
feat(payment): build PaymentMethodsCard with primary + kebab actions

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Wire PaymentPanel to PaymentMethodsCard + remove old singletons

**Files:**
- Modify: `src/pages/account/PaymentPanel.jsx`
- Delete: `src/pages/account/PaymentMethodCard.jsx`
- Delete: `src/stores/usePaymentMethod.js`
- Delete: `src/mocks/paymentMethod.js`

- [ ] **Step 1: Rewrite `src/pages/account/PaymentPanel.jsx`**

```jsx
import { Receipt } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import PaymentMethodsCard from './PaymentMethodsCard'
import InvoicesTable from './InvoicesTable'
import { mockInvoices } from '@/mocks/invoices'

export default function PaymentPanel() {
  return (
    <div className="flex flex-col gap-6">
      <PaymentMethodsCard />
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CardChip color="neutral" icon={Receipt} />
          <h2 className="text-base font-semibold text-text-primary">Billing history</h2>
          <InfoTooltip text="Every charge across every subscription on this account, newest first." />
        </div>
        <InvoicesTable
          invoices={mockInvoices}
          emptyMessage="No invoices yet — your first charge will appear here after your trial ends."
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Delete the superseded singleton files**

```bash
git rm src/pages/account/PaymentMethodCard.jsx
git rm src/stores/usePaymentMethod.js
git rm src/mocks/paymentMethod.js
```

- [ ] **Step 3: Sanity check no stale imports**

Run: `grep -rn "PaymentMethodCard\|usePaymentMethod\b\|mocks/paymentMethod\b" src/`

Expected: zero matches. (The plural `usePaymentMethods` and `paymentMethods` files we just created should NOT match the singular regex.) If anything matches, fix the import in the offending file before committing.

- [ ] **Step 4: Commit**

```bash
git add -A src/pages/account/PaymentPanel.jsx src/pages/account/PaymentMethodCard.jsx src/stores/usePaymentMethod.js src/mocks/paymentMethod.js
git commit -m "$(cat <<'EOF'
feat(payment): wire PaymentPanel to PaymentMethodsCard, drop singletons

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Compact billing history rows

**Files:**
- Modify: `src/pages/account/InvoicesTable.jsx`

- [ ] **Step 1: Read the current file**

`cat src/pages/account/InvoicesTable.jsx`

The mobile layout currently renders three lines per invoice. We're collapsing to two: top line `[date] · [amount] · [status pill]`, bottom line `[description] [Download]`. Desktop description column gets a truncate cap.

- [ ] **Step 2: Overwrite `src/pages/account/InvoicesTable.jsx`**

```jsx
import { Download, Receipt } from 'lucide-react'
import { useToasts } from '@/stores/useToasts'

const STATUS_CLS = {
  paid: 'bg-green-tint text-green-text',
  failed: 'bg-red-tint text-red-text',
  pending: 'bg-yellow-tint text-yellow-text',
}
const STATUS_DOT = {
  paid: 'bg-green-base',
  failed: 'bg-red-base',
  pending: 'bg-yellow-base',
}
const STATUS_LABEL = {
  paid: 'Paid',
  failed: 'Failed',
  pending: 'Pending',
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  )
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
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg text-text-muted">
          <Receipt className="h-5 w-5" />
        </span>
        <p className="text-sm text-text-secondary">{emptyMessage}</p>
      </div>
    )
  }

  // Newest first.
  const sorted = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      {/* Desktop: real table. Description column truncates so long
          values never push a row to two lines. */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="border-b border-border bg-bg/40 text-xs uppercase tracking-wide text-text-secondary">
          <tr>
            <th className="whitespace-nowrap px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">Amount</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
            <th className="whitespace-nowrap px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((inv) => (
            <tr key={inv.id} className="border-b border-border last:border-b-0">
              <td className="whitespace-nowrap px-4 py-3 text-text-primary">{formatDate(inv.date)}</td>
              <td className="max-w-[40ch] truncate px-4 py-3 text-text-secondary" title={inv.description}>
                {inv.description}
              </td>
              <td className="whitespace-nowrap px-4 py-3 font-medium text-text-primary">
                ${inv.amount.toFixed(2)}
              </td>
              <td className="px-4 py-3">
                <StatusPill status={inv.status} />
              </td>
              <td className="whitespace-nowrap px-4 py-3 text-right">
                <button
                  onClick={handleDownload}
                  className="inline-flex h-10 items-center gap-1 rounded-md px-2 text-sm font-medium text-blue-text hover:bg-bg"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: two lines per invoice — date + amount + status on
          top, description + download on bottom. */}
      <ul className="divide-y divide-border md:hidden">
        {sorted.map((inv) => (
          <li key={inv.id} className="flex flex-col gap-1.5 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-medium text-text-primary">{formatDate(inv.date)}</span>
              <span className="text-text-muted">·</span>
              <span className="font-semibold text-text-primary">${inv.amount.toFixed(2)}</span>
              <span className="ml-auto"><StatusPill status={inv.status} /></span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <p className="truncate text-xs text-text-secondary" title={inv.description}>
                {inv.description}
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex h-10 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-blue-text"
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

- [ ] **Step 3: Commit**

```bash
git add src/pages/account/InvoicesTable.jsx
git commit -m "$(cat <<'EOF'
feat(account): compact invoice rows — 2 lines mobile, truncate desktop

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: SubscriptionCard simplification

**Files:**
- Modify: `src/pages/account/SubscriptionCard.jsx`

- [ ] **Step 1: Overwrite `src/pages/account/SubscriptionCard.jsx`**

Drops: "Currently active" pill, the 2-col Server/Next-billing grid, the "N invoices · Active for X days" footer. Adds: a single bottom line showing Next billing.

```jsx
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAccounts } from '@/stores/useAccounts'
import { STATUS_PILL, formatDate, letterFor } from './subscriptionShared'

export default function SubscriptionCard({ subscription }) {
  const accounts = useAccounts((s) => s.accounts)
  const account = accounts.find((a) => a.id === subscription.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[subscription.status] ?? STATUS_PILL.active
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
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-text-primary">{username}</p>
            <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${pill.cls}`}>
              {pill.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            {planLabel}
            {subscription.growthPlus ? ' · Growth+' : ''}
          </p>
          <p className="mt-2 text-xs text-text-secondary">
            Next billing:{' '}
            <span className="text-text-primary">
              ${subscription.nextBillingAmount} on {formatDate(subscription.nextBillingAt)}
            </span>
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 self-center text-text-muted" />
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/account/SubscriptionCard.jsx
git commit -m "$(cat <<'EOF'
feat(account): simplify subscription card body to next-billing line

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Lift `/account/subscriptions/:id` to standalone page

**Files:**
- Modify: `src/App.jsx`
- Modify: `src/pages/account/SubscriptionDetail.jsx`

- [ ] **Step 1: Read `src/App.jsx`**

`cat src/App.jsx`

The current state (after the polish pass) has:
```jsx
<Route path="/account" element={<AccountPage />}>
  <Route path="profile" element={<ProfilePanel />} />
  <Route path="payment" element={<PaymentPanel />} />
  <Route path="subscriptions" element={<SubscriptionsList />} />
  <Route path="subscriptions/:id" element={<SubscriptionDetail />} />
</Route>
<Route path="/account/growth-plus" element={<AccountGrowthPlusPage />} />
```

We're lifting `subscriptions/:id` out as a sibling.

- [ ] **Step 2: Edit `src/App.jsx`**

Use the Edit tool. REPLACE the block:

```jsx
        <Route path="/account" element={<AccountPage />}>
          <Route path="profile" element={<ProfilePanel />} />
          <Route path="payment" element={<PaymentPanel />} />
          <Route path="subscriptions" element={<SubscriptionsList />} />
          <Route path="subscriptions/:id" element={<SubscriptionDetail />} />
        </Route>
        <Route path="/account/growth-plus" element={<AccountGrowthPlusPage />} />
```

WITH:

```jsx
        <Route path="/account" element={<AccountPage />}>
          <Route path="profile" element={<ProfilePanel />} />
          <Route path="payment" element={<PaymentPanel />} />
          <Route path="subscriptions" element={<SubscriptionsList />} />
        </Route>
        <Route path="/account/subscriptions/:id" element={<SubscriptionDetail />} />
        <Route path="/account/growth-plus" element={<AccountGrowthPlusPage />} />
```

(SubscriptionDetail is now a sibling under DashboardLayout, NOT inside the AccountPage shell. It renders without the settings nav rail.)

- [ ] **Step 3: Overwrite `src/pages/account/SubscriptionDetail.jsx`**

```jsx
import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { useAccounts } from '@/stores/useAccounts'
import { invoicesForSubscription } from '@/mocks/invoices'
import PlanCard from './PlanCard'
import ServerCard from './ServerCard'
import InvoicesTable from './InvoicesTable'
import CancelSubscriptionModal from './CancelSubscriptionModal'
import { STATUS_PILL, letterFor } from './subscriptionShared'

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
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 lg:px-8">
      {/* Standalone header — no settings shell wrapper. */}
      <div className="flex items-center gap-3">
        <Link
          to="/account/subscriptions"
          aria-label="Back to subscriptions"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        {profilePic ? (
          <img src={profilePic} alt="" className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-tint text-base font-semibold text-blue-text">
            {letterFor(username)}
          </span>
        )}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">{username}</h1>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${pill.cls}`}>
            {pill.label}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <PlanCard subscription={sub} />
        <ServerCard subscription={sub} />

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-text-primary">Invoices</h2>
          <InvoicesTable
            invoices={invoices}
            emptyMessage="No invoices yet for this subscription."
          />
        </div>

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
      </div>

      <CancelSubscriptionModal open={cancelOpen} onClose={() => setCancelOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/pages/account/SubscriptionDetail.jsx
git commit -m "$(cat <<'EOF'
feat(account): lift subscription detail to standalone page

Subscription detail no longer nests inside the /account settings
shell. It's a sibling route under DashboardLayout, with its own
header (back-arrow icon button + avatar + username + status pill)
and a narrower max-w-3xl container.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Mobile-aware AccountPage shell + four edit modal listeners

**Files:**
- Modify: `src/pages/account/index.jsx`

- [ ] **Step 1: Overwrite `src/pages/account/index.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Navigate, useOutlet, useLocation, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import SettingsNav from './SettingsNav'
import PasswordModal from './PasswordModal'
import EditNameModal from './EditNameModal'
import EditEmailModal from './EditEmailModal'
import EditPhoneModal from './EditPhoneModal'

// Detects desktop on first paint. The two-pane layout only makes
// sense at `lg:` and up; below that we use iOS-style push navigation
// where `/account` is the menu and `/account/<panel>` is a forward
// stop, with each panel owning its own H1 + back arrow.
function useIsDesktop() {
  const [isDesktop] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(min-width: 1024px)').matches,
  )
  return isDesktop
}

const PANEL_TITLE = {
  '/account/profile': 'Profile',
  '/account/payment': 'Payment',
  '/account/subscriptions': 'Subscriptions',
}

export default function AccountPage() {
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [nameOpen, setNameOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)

  const outlet = useOutlet()
  const childActive = !!outlet
  const isDesktop = useIsDesktop()
  const { pathname } = useLocation()

  useEffect(() => {
    const map = {
      'open-password-modal': () => setPasswordOpen(true),
      'open-edit-name-modal': () => setNameOpen(true),
      'open-edit-email-modal': () => setEmailOpen(true),
      'open-edit-phone-modal': () => setPhoneOpen(true),
    }
    Object.entries(map).forEach(([k, fn]) => window.addEventListener(k, fn))
    return () => {
      Object.entries(map).forEach(([k, fn]) => window.removeEventListener(k, fn))
    }
  }, [])

  // Desktop redirect: hitting `/account` raw on a wide viewport
  // pushes to `/account/profile` so the right pane has content.
  if (!childActive && isDesktop) {
    return <Navigate to="/account/profile" replace />
  }

  const panelTitle = PANEL_TITLE[pathname] ?? 'Settings'
  const showMobilePanelHeader = childActive && !isDesktop
  const showMobileMenuHeader = !childActive && !isDesktop
  const showDesktopHeader = isDesktop

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      {/* Desktop header — "Settings" + subtitle anchored by the
          left-side nav rail. Always visible on lg+. */}
      {showDesktopHeader && (
        <header>
          <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your account, payments, and subscriptions.
          </p>
        </header>
      )}

      {/* Mobile menu header — `/account` itself. Just "Settings"
          H1, no subtitle, list rendered as content. */}
      {showMobileMenuHeader && (
        <header>
          <h1 className="text-lg font-semibold leading-snug text-text-primary">
            Settings
          </h1>
        </header>
      )}

      {/* Mobile panel header — back-arrow icon button + panel
          title. Replaces "Settings" + subtitle once a panel is
          active on mobile. */}
      {showMobilePanelHeader && (
        <header className="flex items-center gap-2">
          <Link
            to="/account"
            aria-label="Back to settings"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold leading-snug text-text-primary">
            {panelTitle}
          </h1>
        </header>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className={`${childActive ? 'hidden lg:block' : ''} lg:sticky lg:top-6 lg:self-start`}>
          <SettingsNav />
        </aside>
        <section className={childActive ? '' : 'hidden lg:block'}>
          {outlet}
        </section>
      </div>

      <PasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <EditNameModal open={nameOpen} onClose={() => setNameOpen(false)} />
      <EditEmailModal open={emailOpen} onClose={() => setEmailOpen(false)} />
      <EditPhoneModal open={phoneOpen} onClose={() => setPhoneOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

(The commit comes after Tasks 10–12 which create the three new modals — keep AccountPage uncompiled for now would break the build. So instead: at this step, the imports for `EditNameModal`/`EditEmailModal`/`EditPhoneModal` will fail to resolve. We'll commit at the end of Task 12. For now stage the change but don't commit:)

```bash
# Don't commit yet — Tasks 10–12 create the missing modals.
# Verify the file compiles syntactically (no Node, but visually):
sed -n '1,20p' src/pages/account/index.jsx
```

---

## Task 10: EditNameModal

**Files:**
- Create: `src/pages/account/EditNameModal.jsx`

- [ ] **Step 1: Create `src/pages/account/EditNameModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { User, X } from 'lucide-react'
import { useUserProfile } from '@/stores/useUserProfile'

// Edit-name modal. Replaces the inline-edit row in ProfilePanel
// so the panel uses one consistent edit pattern across all rows.
export default function EditNameModal({ open, onClose }) {
  const profile = useUserProfile()
  const setName = useUserProfile((s) => s.setName)

  const [mounted, setMounted] = useState(false)
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setFirstName(profile.firstName)
    setLastName(profile.lastName)
    setError('')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, profile.firstName, profile.lastName])

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
    if (!firstName.trim()) {
      setError('First name is required.')
      return
    }
    setName({ firstName, lastName })
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
              <User className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Edit name</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-secondary">First name</span>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-blue-base focus:outline-none"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-secondary">Last name</span>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-blue-base focus:outline-none"
            />
          </label>
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
            Save changes
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: No commit yet** — bundled with Tasks 11–13.

---

## Task 11: EditEmailModal

**Files:**
- Create: `src/pages/account/EditEmailModal.jsx`

- [ ] **Step 1: Create `src/pages/account/EditEmailModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Mail, X } from 'lucide-react'
import { useUserProfile } from '@/stores/useUserProfile'

export default function EditEmailModal({ open, onClose }) {
  const profile = useUserProfile()
  const setEmail = useUserProfile((s) => s.setEmail)

  const [mounted, setMounted] = useState(false)
  const [email, setEmailDraft] = useState(profile.email)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setEmailDraft(profile.email)
    setError('')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, profile.email])

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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Enter a valid email address.')
      return
    }
    setEmail(email)
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
              <Mail className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Edit email</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-secondary">Email address</span>
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmailDraft(e.target.value)
                setError('')
              }}
              className="h-10 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-blue-base focus:outline-none"
            />
          </label>
          {error && <p className="text-xs text-red-text" role="alert">{error}</p>}
          <p className="text-xs text-text-muted">
            We'll send a verification link to the new address.
          </p>
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
            Send verification
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: No commit yet.**

---

## Task 12: EditPhoneModal

**Files:**
- Create: `src/pages/account/EditPhoneModal.jsx`

- [ ] **Step 1: Create `src/pages/account/EditPhoneModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { Phone, X } from 'lucide-react'
import { useUserProfile } from '@/stores/useUserProfile'

export default function EditPhoneModal({ open, onClose }) {
  const profile = useUserProfile()
  const setPhone = useUserProfile((s) => s.setPhone)

  const [mounted, setMounted] = useState(false)
  const [country, setCountry] = useState(profile.phoneCountry)
  const [number, setNumber] = useState(profile.phoneNumber ?? '')

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setCountry(profile.phoneCountry)
    setNumber(profile.phoneNumber ?? '')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, profile.phoneCountry, profile.phoneNumber])

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
    setPhone({ country, number })
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
              <Phone className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Edit phone number</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-text-secondary">Phone</span>
            <div className="flex gap-2">
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
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
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="555 123 4567"
                className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary focus:border-blue-base focus:outline-none"
              />
            </div>
          </label>
          <p className="text-xs text-text-muted">
            Leave empty and save to remove your phone number.
          </p>
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
            Save phone number
          </button>
        </div>
      </form>
    </div>
  )
}
```

- [ ] **Step 2: No commit yet — Task 13 ships AccountPage + 3 modals together.**

---

## Task 13: ProfilePanel rewrite + drop commPrefs from store + bundle commit

**Files:**
- Modify: `src/stores/useUserProfile.js`
- Modify: `src/pages/account/ProfilePanel.jsx`

- [ ] **Step 1: Edit `src/stores/useUserProfile.js`**

Use Edit tool. Find and remove the `commPrefs` initial state field, the `setCommPref` action, and the SMS-clear side effect inside `setPhone`.

Specifically:

REPLACE:
```jsx
  phoneNumber: null,
  commPrefs: { email: true, sms: false },
```
WITH:
```jsx
  phoneNumber: null,
```

REPLACE:
```jsx
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
```
WITH:
```jsx
  setPhone: ({ country, number }) => {
    const trimmed = number?.trim() || null
    set({ phoneCountry: country, phoneNumber: trimmed })
    useToasts.getState().addToast({
      message: trimmed ? 'Phone number updated.' : 'Phone number removed.',
      tone: 'success',
    })
  },
```

REPLACE the entire `setCommPref` block:
```jsx
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

```
WITH: (empty — remove the entire block including the trailing blank line)

After all three edits, the `get` import is no longer used. Edit the create call signature:

REPLACE:
```jsx
export const useUserProfile = create((set, get) => ({
```
WITH:
```jsx
export const useUserProfile = create((set) => ({
```

- [ ] **Step 2: Overwrite `src/pages/account/ProfilePanel.jsx`**

Single card with eyebrow-labeled sections. All Edit affordances dispatch CustomEvents — no inline edit anywhere.

```jsx
import { Pencil } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { User } from 'lucide-react'
import { useUserProfile } from '@/stores/useUserProfile'

function countryCodeFor(country) {
  return { US: '1', GB: '44', DE: '49', FR: '33', AU: '61' }[country] ?? '1'
}

function fireOpen(event) {
  window.dispatchEvent(new CustomEvent(event))
}

// One row inside a section. All edits open a modal — no inline
// editing anywhere.
function Row({ label, value, onEdit }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <span className="text-sm text-text-primary">{value}</span>
      </div>
      <button
        onClick={onEdit}
        className="inline-flex h-10 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-blue-text hover:bg-bg"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
    </div>
  )
}

export default function ProfilePanel() {
  const profile = useUserProfile()

  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || '—'
  const phoneDisplay = profile.phoneNumber
    ? `+${countryCodeFor(profile.phoneCountry)} ${profile.phoneNumber}`
    : 'Not set'

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <CardChip color="blue" icon={User} />
        <h2 className="text-base font-semibold text-text-primary">Profile</h2>
        <InfoTooltip text="Identity, contact info, and login credentials for your Kicksta account." />
      </div>

      {/* Personal info section */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Personal info
        </p>
        <div className="mt-2 flex flex-col">
          <Row label="Name" value={fullName} onEdit={() => fireOpen('open-edit-name-modal')} />
          <Row label="Email" value={profile.email} onEdit={() => fireOpen('open-edit-email-modal')} />
          <Row label="Phone number" value={phoneDisplay} onEdit={() => fireOpen('open-edit-phone-modal')} />
        </div>
      </div>

      {/* Security section */}
      <div className="mt-6 border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Security
        </p>
        <div className="mt-2 flex flex-col">
          <Row label="Password" value="••••••••" onEdit={() => fireOpen('open-password-modal')} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify no stale references**

Run:
```bash
grep -rn "commPrefs\|setCommPref\|CommToggle" src/
```

Expected: zero matches. (The store, modal, and panel all stripped these.)

- [ ] **Step 4: Bundle commit (Tasks 9–13)**

```bash
git add src/pages/account/index.jsx \
        src/pages/account/EditNameModal.jsx \
        src/pages/account/EditEmailModal.jsx \
        src/pages/account/EditPhoneModal.jsx \
        src/pages/account/ProfilePanel.jsx \
        src/stores/useUserProfile.js
git commit -m "$(cat <<'EOF'
feat(account): unified modal edits + ProfilePanel single-card + mobile shell

- ProfilePanel collapses to one outer card with two eyebrow-labeled
  sections (Personal info / Security). All Edit affordances open
  modals — no inline editing anywhere.
- New EditNameModal / EditEmailModal / EditPhoneModal alongside
  the existing PasswordModal; AccountPage shell listens for four
  open-edit-* CustomEvents.
- Communication preferences removed from the panel and from
  useUserProfile (commPrefs + setCommPref dropped). If notification
  routing is ever needed, it gets its own surface.
- AccountPage shell becomes viewport-aware: on mobile, /account
  renders just "Settings" + the nav list, panels render their
  own H1 with a 44×44 ChevronLeft back button. Desktop two-pane
  layout unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: SettingsNav desktop active-state polish

**Files:**
- Modify: `src/pages/account/SettingsNav.jsx`

- [ ] **Step 1: Read current file**

`cat src/pages/account/SettingsNav.jsx`

The current file already adapts mobile vs desktop. We're upgrading the desktop active state to add a leading 3-px accent bar and flip the icon chip to filled blue.

- [ ] **Step 2: Overwrite `src/pages/account/SettingsNav.jsx`**

```jsx
import { NavLink, useLocation } from 'react-router-dom'
import { User, CreditCard, Layers, ChevronRight } from 'lucide-react'

const items = [
  {
    to: '/account/profile',
    label: 'Profile',
    icon: User,
    description: 'Name, email, password, phone',
  },
  {
    to: '/account/payment',
    label: 'Payment',
    icon: CreditCard,
    description: 'Cards on file and billing history',
  },
  {
    to: '/account/subscriptions',
    label: 'Subscriptions',
    icon: Layers,
    description: 'One per Instagram account',
  },
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
      {items.map(({ to, label, icon: Icon, description }) => {
        const active = isSubActive(pathname, to)
        return (
          <NavLink
            key={to}
            to={to}
            className={`group relative flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-3 lg:py-2 ${
              active
                ? 'lg:bg-blue-tint'
                : 'hover:bg-bg lg:hover:bg-bg'
            }`}
          >
            {/* Desktop selected accent bar */}
            <span
              aria-hidden="true"
              className={`absolute left-0 top-1.5 bottom-1.5 hidden w-1 rounded-r-full lg:block ${
                active ? 'bg-blue-base' : 'bg-transparent'
              }`}
            />
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg lg:h-auto lg:w-auto lg:rounded-none ${
                active
                  ? 'bg-blue-base text-white lg:bg-transparent lg:text-blue-text'
                  : 'bg-bg text-text-secondary group-hover:text-text-primary lg:bg-transparent'
              }`}
            >
              <Icon className="h-4 w-4 lg:h-4 lg:w-4" />
            </span>
            <span className="flex-1">
              <span
                className={`block text-sm font-medium lg:inline ${
                  active ? 'text-text-primary lg:text-blue-text' : 'text-text-primary lg:text-text-secondary lg:group-hover:text-text-primary'
                }`}
              >
                {label}
              </span>
              <span className="mt-0.5 block text-xs text-text-secondary lg:hidden">
                {description}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-text-muted lg:hidden" aria-hidden="true" />
          </NavLink>
        )
      })}
    </nav>
  )
}
```

Key changes vs. the previous version:
- Desktop active row gets a leading `bg-blue-base` accent bar via an absolutely-positioned span.
- Desktop active icon goes from `bg-blue-tint text-blue-text` (a chip) to plain `text-blue-text` (the bar carries the visual weight; chip is mobile-only).
- Mobile active row: the icon chip flips to filled `bg-blue-base text-white` so the selected row reads clearly there too.

- [ ] **Step 3: Commit**

```bash
git add src/pages/account/SettingsNav.jsx
git commit -m "$(cat <<'EOF'
feat(account): SettingsNav desktop active state — accent bar + filled chip

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 15: Final verification + CHANGELOG/CONTEXT

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `CONTEXT.md`

- [ ] **Step 1: Manual verification walkthrough**

Open the dev server (`npm run dev`) when convenient. Walk every route:

- `/account` on **mobile width** — only "Settings" H1 + 3 chevron rows. No subtitle. No marketing copy.
- `/account/profile` on **mobile** — back-arrow icon button + "Profile" H1. No "Settings" header anywhere on screen.
- Tap Edit on Name / Email / Phone / Password — each opens its own modal with proper validation and Save behavior.
- `/account/payment` on **mobile** — back arrow + "Payment" H1. Inside: PaymentMethodsCard with primary card + secondary card + "Add payment method" row. Kebab menu offers Set as primary / Edit / Remove. "Used by N subscriptions · $X/mo total" pill prominent at top.
- Add a card via the modal; remove a non-primary card; promote secondary to primary; remove the original primary (should fail with toast); attempt to remove the last card (should fail with toast).
- Billing history: each invoice is **2 lines on mobile**, single row on desktop with description truncating.
- `/account/subscriptions` on **mobile** — back arrow + "Subscriptions" H1. Subscription cards: avatar + username + status pill inline + ChevronRight; below: plan label + "Next billing" line. No "Currently active" pill, no Server line, no activity footer.
- Tap a subscription card — lands on `/account/subscriptions/sub_001` as a **standalone page**: no settings nav rail (desktop or mobile). Header is back arrow + avatar + username + status pill. Plan + Server + Invoices + Cancel sections render.
- Back arrow from subscription detail returns to `/account/subscriptions`. From there, the mobile back arrow returns to `/account`. Two crisp hops, no maze.
- `/account` on **desktop** — redirects to `/account/profile` (settings nav rail anchors location). Active item shows the leading blue accent bar + filled icon chip.
- Drill into a subscription detail on desktop — the settings nav rail disappears (standalone page). Confirm subscription detail page uses the narrower `max-w-3xl` container.

If anything is broken, file as a follow-up rather than fixing inline.

- [ ] **Step 2: Add CHANGELOG entry**

In `CHANGELOG.md`, insert a new dated entry above the existing 2026-04-29 entries (or append under today's date if the file uses a different convention; check first via `head -20 CHANGELOG.md`):

```markdown
## 2026-04-29 — Settings page fixes

### Changed
- **Sub-nav selected state** — desktop SettingsNav active row gains a leading 3-px blue accent bar; mobile active row flips its icon chip to filled `bg-blue-base text-white`. Selection is now unmistakable at a glance.
- **ProfilePanel** restructured — was three section cards, now one outer card with two eyebrow-labeled sections (Personal info / Security). Communication preferences removed entirely (the wrong surface for transactional notification routing; will get its own page if ever needed). All inline edits are gone — every Edit button opens a focused modal (`EditNameModal`, `EditEmailModal`, `EditPhoneModal`, plus the existing `PasswordModal`). The four modals dispatch via `open-edit-*-modal` CustomEvents and mount inside the AccountPage shell.
- **Multiple payment methods** — `usePaymentMethod` (singular) replaced by `usePaymentMethods` (plural) with `cards`, `addCard`, `removeCard`, `setPrimary`, `updateCard`. The card card list shows brand + last4 + Primary pill + expiry, with a kebab menu offering Set as primary / Edit / Remove. Add row at the bottom opens `EditPaymentModal` in add-mode (modal supports both modes via a `cardId` prop). Removing the primary or the last card fires an explanatory error toast.
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
```

- [ ] **Step 3: Add CONTEXT.md update entry**

Append to the update log section:

```markdown
- **2026-04-29 (settings fixes)** — Multi-card payment store: `usePaymentMethods` (plural) replaces the singleton with `cards` + primary-card semantics. `PaymentMethodsCard` renders the list with a kebab menu (Set as primary / Edit / Remove) and a prominent "Used by N subscriptions · $X/mo total" summary pill. `EditPaymentModal` handles both add and edit modes via a `cardId` prop. ProfilePanel collapses to one outer card with eyebrow-labeled Personal info / Security sections; all edits open dedicated modals (`EditNameModal`, `EditEmailModal`, `EditPhoneModal`, existing `PasswordModal`) dispatched via `open-edit-*-modal` window events; Communication preferences and `commPrefs` store fields are gone. SubscriptionCard simplified to avatar + username + inline status pill + plan label + Next billing line. `/account/subscriptions/:id` lifts out of the settings shell into a sibling route under `DashboardLayout` — standalone page with its own back-arrow icon button + avatar header, no settings nav rail. AccountPage shell becomes viewport-aware on mobile: `/account` renders the menu, panels render their own H1 + back arrow. SettingsNav desktop active state adds a leading blue accent bar + filled icon chip; mobile active row flips its icon chip to filled blue.
```

- [ ] **Step 4: Commit docs**

```bash
git add CHANGELOG.md CONTEXT.md
git commit -m "$(cat <<'EOF'
docs: log settings page fixes in CHANGELOG and CONTEXT

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review notes

**Spec coverage:**
- §1 sub-nav selected state → Task 14
- §2a ProfilePanel single card → Task 13
- §2b drop Communication → Task 13 (panel + store)
- §2c unified modal edits → Tasks 9, 10, 11, 12, 13
- §3a multi-card store + UI + active switching → Tasks 2, 3, 4, 5
- §3b drop billing email from display → Task 4 (CardRow doesn't render billingEmail)
- §3c compact billing rows → Task 6
- §3d "Used by N subs" prominent → Task 4 (top-of-card summary pill)
- §4 SubscriptionCard rework → Task 7
- §5 mobile nav rework + standalone subs detail → Tasks 8, 9
- File map / docs → Task 15

**Type / property consistency:**
- Card shape: `{ id, brand, last4, expMonth, expYear, primary, billingEmail }` matches across mock, store, modal, list card.
- Store actions: `addCard`, `removeCard`, `setPrimary`, `updateCard` consistent in store + consumers.
- Modal CustomEvent names: `open-password-modal`, `open-edit-name-modal`, `open-edit-email-modal`, `open-edit-phone-modal` match between AccountPage shell listener and ProfilePanel `fireOpen` calls.
- `STATUS_PILL` / `letterFor` / `formatDate` continue to come from `subscriptionShared.js` (unchanged).

**Placeholders:** none — every step has full code or a complete verification command.
