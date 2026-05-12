import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowRight, CheckCircle2, Loader2, X } from 'lucide-react'
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
