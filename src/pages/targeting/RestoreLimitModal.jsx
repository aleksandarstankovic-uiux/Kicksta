import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Block modal shown when a bulk Restore would push the user's
// in-rotation target count over their plan's slot limit. Single
// dismiss action ("Got it") that returns to selection mode with
// the selection intact, plus an Upgrade plan shortcut that routes
// to the Plan & Billing surface (PlanCard owns the upgrade flow).
export default function RestoreLimitModal({
  inRotationCount,
  attemptedCount,
  slotLimit,
  onClose,
}) {
  const navigate = useNavigate()

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Restore would exceed plan limit"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-xl bg-surface p-5 shadow-xl lg:max-w-md lg:rounded-xl"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          Restoring would exceed your plan limit
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          You're at {inRotationCount}/{slotLimit} targets in rotation.
          Restoring {attemptedCount} more would put you over the limit.
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          Restore fewer, or upgrade for more slots.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-4 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Got it
          </button>
          <button
            type="button"
            onClick={() => {
              onClose()
              navigate('/account/billing')
            }}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Upgrade plan
          </button>
        </div>
      </div>
    </div>
  )
}
