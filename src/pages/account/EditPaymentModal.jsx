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
        className={`w-full max-w-md rounded-t-xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-xl ${
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
