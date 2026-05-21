import { useEffect } from 'react'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
} from 'lucide-react'

const GROWTH_PLUS_PRICE = 49
const MOCK_PAYMENT_METHOD = { brand: 'Visa', last4: '4242' }
const GROWTH_PLUS_BENEFITS = [
  { text: 'Algorithmic post boosting', desc: 'Your posts get pushed to Explore and hashtag feeds' },
  { text: 'Up to 500+ extra followers/mo', desc: 'On top of your base plan growth' },
  { text: 'Increased likes & saves', desc: 'Real engagement signals from active accounts' },
]

// Shared confirm/processing/success modal for adding Growth+. Used by:
// - /signup/growth-plus (during onboarding)
// - /growth-plus (the non-subscriber locked-preview overlay)
//
// State is owned by the parent. Three states drive three render branches:
//   - 'confirm' — full sheet with payment method + benefits + Subscribe button
//   - 'processing' — compact centered spinner
//   - 'success' — full sheet with green check + Continue button
//
// onProcessingDone is called once after 1500ms when state === 'processing',
// so the parent can transition to 'success' without owning the timer.
export default function GrowthPlusSubscribeModal({
  state,
  onClose,
  onConfirm,
  onProcessingDone,
  onSuccess,
  successButtonLabel = 'Continue',
}) {
  useEffect(() => {
    if (state !== 'processing') return
    const id = setTimeout(() => onProcessingDone?.(), 1500)
    return () => clearTimeout(id)
  }, [state, onProcessingDone])

  if (!state) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && state === 'confirm') onClose?.()
      }}
    >
      {state === 'processing' && (
        <div
          className="mx-4 mb-4 w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl lg:mb-0"
          style={{ animation: 'fadeSlideIn 0.25s ease-out' }}
        >
          <div className="flex flex-col items-center py-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-base" />
            <p className="mt-3 text-base font-medium text-text-primary">
              Processing payment...
            </p>
          </div>
        </div>
      )}

      {(state === 'confirm' || state === 'success') && (
        <div
          className="w-full rounded-t-xl bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl lg:mx-4 lg:max-w-sm lg:rounded-xl lg:pb-6"
          style={{
            animation:
              typeof window !== 'undefined' && window.innerWidth < 1024
                ? 'drawerSlideUp 0.3s ease-out'
                : 'fadeSlideIn 0.25s ease-out',
          }}
        >
          {state === 'confirm' && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 h-1 w-10 rounded-full bg-border lg:hidden" />
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-tint">
                <CreditCard className="h-6 w-6 text-purple-base" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                Confirm Growth+ subscription
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                Your{' '}
                <span className="font-semibold text-text-primary">
                  {MOCK_PAYMENT_METHOD.brand} ending in {MOCK_PAYMENT_METHOD.last4}
                </span>{' '}
                will be charged ${GROWTH_PLUS_PRICE}/mo. Cancel anytime from your dashboard.
              </p>

              <div className="mt-3 w-full overflow-hidden rounded-xl border border-purple-base/20">
                <div className="bg-purple-tint px-4 py-2">
                  <p className="text-xs font-semibold text-purple-text">
                    What you get with Growth+
                  </p>
                </div>
                <div className="flex flex-col divide-y divide-purple-base/10">
                  {GROWTH_PLUS_BENEFITS.map((benefit) => (
                    <div
                      key={benefit.text}
                      className="flex items-start gap-2.5 px-4 py-2.5 text-left"
                    >
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-base"
                        strokeWidth={2.5}
                      />
                      <div>
                        <p className="text-xs font-medium text-text-primary">
                          {benefit.text}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex w-full flex-col gap-4">
                <button
                  onClick={onConfirm}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-purple-base text-base font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Subscribe for ${GROWTH_PLUS_PRICE}/mo
                </button>
                <button
                  onClick={onClose}
                  className="flex h-12 w-full items-center justify-center rounded-lg text-base font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  Go back
                </button>
              </div>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 h-1 w-10 rounded-full bg-border lg:hidden" />
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-tint">
                <CheckCircle2 className="h-6 w-6 text-green-text" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                Growth+ activated
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                Your account is now supercharged. You'll start seeing increased reach and engagement within the next few days.
              </p>

              <button
                onClick={onSuccess}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-green-base text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                {successButtonLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
