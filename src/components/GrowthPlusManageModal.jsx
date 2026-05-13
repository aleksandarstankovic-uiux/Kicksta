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
//   - cancelled_pending → shows Resume subscription button
//
// Parent owns `open` and the three callbacks (onChangeTier, onCancel,
// onResume). Portal-rendered to escape any transformed ancestor;
// bottom-sheet on mobile, centered card on lg:+.
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
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span
              aria-hidden="true"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-tint text-purple-text"
            >
              <CreditCard className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold leading-tight text-text-primary">
                Growth+ subscription
              </h2>
              <p className="mt-0.5 truncate text-xs leading-relaxed text-text-secondary">
                Manage your tier or cancel anytime.
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

        <div className="px-5 pb-5 pt-4">
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
