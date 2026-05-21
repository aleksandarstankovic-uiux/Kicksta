import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, X } from 'lucide-react'
import CardChip from '@/components/CardChip'
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

// Header title for the Growth+ cancel modal — reflects the current
// step so the prompt doubles as the page title.
function stepTitle(step) {
  if (step === 'reason') return 'Why are you cancelling?'
  if (step === 'lose') return "Here's what you'll lose"
  if (step === 'confirm') return 'Confirm cancellation'
  if (step === 'processing') return 'Cancelling...'
  if (step === 'success') return 'Subscription cancelled'
  return ''
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
  const [otherDetail, setOtherDetail] = useState('')

  // Reset whenever the modal opens.
  useEffect(() => {
    if (open) {
      setStep('reason')
      setSelectedReason(null)
      setOtherDetail('')
    }
  }, [open])

  // Auto-advance processing → success.
  useEffect(() => {
    if (step !== 'processing') return
    const id = setTimeout(() => setStep('success'), 1500)
    return () => clearTimeout(id)
  }, [step])

  if (!open) return null

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
      <div className="w-full rounded-t-xl border border-border bg-surface shadow-xl lg:mx-4 lg:max-w-md lg:rounded-xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <CardChip color="red" icon={AlertTriangle} />
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold leading-tight text-text-primary">
                {stepTitle(step)}
              </h2>
              <p className="mt-0.5 truncate text-xs leading-relaxed text-text-secondary">
                Growth+ subscription
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
          {step === 'reason' && (
            <>
              <ul className="flex flex-col gap-2">
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

                      {selected && r.id === 'other' && (
                        <div className="mt-2">
                          <label
                            htmlFor="cancel-other-detail"
                            className="sr-only"
                          >
                            Tell us more
                          </label>
                          <textarea
                            id="cancel-other-detail"
                            value={otherDetail}
                            onChange={(e) => setOtherDetail(e.target.value)}
                            rows={3}
                            placeholder="Tell us more (optional, but helpful)"
                            className="w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:border-purple-base focus:outline-none focus:ring-2 focus:ring-purple-base/20"
                          />
                        </div>
                      )}

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
              <div className="flex items-start gap-3 rounded-xl border border-purple-base/20 bg-purple-tint/40 p-4">
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
              <p className="text-sm leading-relaxed text-text-secondary">
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
                  className="inline-flex h-12 w-full items-center justify-center rounded-lg bg-red-base text-base font-semibold text-white transition-opacity hover:opacity-90"
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
              <p className="text-sm leading-relaxed text-text-secondary">
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
