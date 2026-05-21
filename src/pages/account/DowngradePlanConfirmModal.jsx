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
      <div className="w-full overflow-hidden rounded-t-xl bg-surface pb-[calc(env(safe-area-inset-bottom))] shadow-xl lg:mx-4 lg:max-w-sm lg:rounded-xl lg:pb-0">
        {state === 'confirm' && (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-tint text-blue-text"
                >
                  <TrendingDown className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold leading-tight text-text-primary">
                    Switch to {PLAN_LABEL[toPlan]}
                  </h2>
                  <p className="mt-0.5 truncate text-xs leading-relaxed text-text-secondary">
                    Plan downgrade · proration credited
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="px-5 pb-5 pt-4 lg:pb-6">
            <div className="space-y-2 rounded-xl border border-border bg-bg p-4 text-sm">
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
            </div>
          </>
        )}

        {state === 'processing' && (
          <div className="flex flex-col items-center px-5 py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-base" />
            <p className="mt-3 text-base font-medium text-text-primary">
              Updating your plan...
            </p>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center px-5 py-6 text-center">
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
