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
      <div className="w-full overflow-hidden rounded-t-2xl bg-surface pb-[calc(env(safe-area-inset-bottom))] shadow-xl lg:mx-4 lg:max-w-sm lg:rounded-2xl lg:pb-0">
        {state === 'confirm' && (
          <>
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  aria-hidden="true"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-yellow-tint text-yellow-text"
                >
                  <PauseCircle className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold leading-tight text-text-primary">
                    Pause for {days} days
                  </h2>
                  <p className="mt-0.5 truncate text-xs leading-relaxed text-text-secondary">
                    Growth halts, billing skipped, settings kept.
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
            </div>
          </>
        )}

        {state === 'processing' && (
          <div className="flex flex-col items-center px-5 py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-yellow-base" />
            <p className="mt-3 text-base font-medium text-text-primary">
              Pausing your subscription...
            </p>
          </div>
        )}

        {state === 'success' && (
          <div className="flex flex-col items-center px-5 py-6 text-center">
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
