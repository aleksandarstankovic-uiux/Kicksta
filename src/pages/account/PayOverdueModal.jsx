import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Loader2, X } from 'lucide-react'
import CardChip from '@/components/CardChip'
import CardBrandIcon from '@/components/CardBrandIcon'
import { useAccounts } from '@/stores/useAccounts'
import { usePaymentMethods } from '@/stores/usePaymentMethods'

function brandLabel(brand) {
  return { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex' }[brand] ?? 'Card'
}

// Confirmation modal before retrying a past-due charge. Shows the user
// exactly what they're paying — line items, amount, and which card
// will be charged — instead of one-tap-mistakenly retrying. On confirm
// the modal walks itself through a brief processing → success state,
// then calls onConfirm() which triggers the store mutation upstream.
export default function PayOverdueModal({
  open,
  subscription,
  onClose,
  onConfirm,
}) {
  const accounts = useAccounts((s) => s.accounts)
  const cards = usePaymentMethods((s) => s.cards)
  const primaryCard = cards.find((c) => c.primary) ?? cards[0]

  const [step, setStep] = useState('confirm')

  useEffect(() => {
    if (open) setStep('confirm')
  }, [open])

  useEffect(() => {
    if (step !== 'processing') return
    const id = setTimeout(() => setStep('success'), 1200)
    return () => clearTimeout(id)
  }, [step])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape' && step !== 'processing') onClose?.()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, step, onClose])

  if (!open || !subscription) return null

  const account = accounts.find((a) => a.id === subscription.accountId)
  const username = account?.username ?? '@account'
  const planLabel =
    subscription.plan === 'advanced' ? 'Advanced plan' : 'Growth plan'
  const amount = subscription.nextBillingAmount

  function handlePay() {
    setStep('processing')
  }

  function handleDone() {
    onConfirm?.()
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget && step !== 'processing') onClose?.()
      }}
    >
      <div className="w-full rounded-t-xl border border-border bg-surface shadow-xl lg:mx-4 lg:max-w-md lg:rounded-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <CardChip color="red" icon={AlertTriangle} />
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold leading-tight text-text-primary">
                {step === 'success' ? 'Payment successful' : 'Pay outstanding invoice'}
              </h2>
              <p className="mt-0.5 truncate text-xs leading-relaxed text-text-secondary">
                Subscription for {username}
              </p>
            </div>
          </div>
          {step !== 'processing' && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="px-5 pb-5 pt-4">
          {step === 'confirm' && (
            <>
              {/* What they're paying — line item summary. */}
              <div className="rounded-lg border border-border bg-bg/40 p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="text-sm text-text-secondary">{planLabel}</p>
                  <p className="text-sm font-medium text-text-primary">
                    ${amount}.00
                  </p>
                </div>
                {subscription.growthPlus && (
                  <div className="mt-1.5 flex items-baseline justify-between gap-3">
                    <p className="text-xs text-text-secondary">
                      Includes Growth+ boost
                    </p>
                  </div>
                )}
                <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-border pt-3">
                  <p className="text-sm font-semibold text-text-primary">
                    Total due now
                  </p>
                  <p className="text-base font-semibold text-text-primary">
                    ${amount}.00
                  </p>
                </div>
              </div>

              {/* Which card will be charged. */}
              <p className="mt-4 text-xs font-medium text-text-secondary">
                Paying with
              </p>
              {primaryCard ? (
                <div className="mt-1.5 flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-bg text-text-secondary">
                    <CardBrandIcon brand={primaryCard.brand} className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-text-primary">
                      {brandLabel(primaryCard.brand)} ending in {primaryCard.last4}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Expires{' '}
                      {String(primaryCard.expMonth).padStart(2, '0')}/
                      {primaryCard.expYear}
                    </p>
                  </div>
                </div>
              ) : (
                <p className="mt-1.5 rounded-lg border border-red-base/30 bg-red-tint p-3 text-xs text-red-text">
                  No card on file. Add a payment method to continue.
                </p>
              )}

              <p className="mt-3 text-xs leading-relaxed text-text-muted">
                Growth resumes immediately once payment clears.
              </p>

              <div className="mt-5 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={!primaryCard}
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-blue-base text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Pay ${amount}.00
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg border border-border bg-surface text-base font-medium text-text-primary transition-colors hover:bg-bg"
                >
                  Cancel
                </button>
              </div>
            </>
          )}

          {step === 'processing' && (
            <div className="flex flex-col items-center py-4 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-text-secondary" />
              <p className="mt-3 text-base font-medium text-text-primary">
                Processing payment…
              </p>
            </div>
          )}

          {step === 'success' && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-tint">
                <CheckCircle2 className="h-6 w-6 text-green-text" />
              </div>
              <p className="text-sm leading-relaxed text-text-secondary">
                ${amount}.00 charged to {brandLabel(primaryCard?.brand)} ending
                in {primaryCard?.last4}. Growth is resuming now.
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
