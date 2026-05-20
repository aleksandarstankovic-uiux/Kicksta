import { useEffect } from 'react'

// Confirms intent before pausing growth. Resume is one-click — no
// modal — but pausing stops all engine activity and the system needs
// a warm-up window when resumed, so the user gets a chance to back out.
//
// Bottom sheet on mobile (items-end), centered modal on lg:+ — same
// recipe as the bulk-remove confirm. Primary button uses the action
// name per CLAUDE.md, never "Confirm".
export default function PauseGrowthModal({ onClose, onConfirm }) {
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
      aria-label="Pause growth"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-xl bg-surface p-5 shadow-xl lg:max-w-md lg:rounded-xl"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          Pause growth?
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          The system will stop all follows, unfollows, and engagement
          actions on your account.
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          When you resume, the engine may take a short while to warm
          back up before activity returns to normal.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-4 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Keep growing
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-text-primary px-4 text-sm font-medium text-surface hover:opacity-90"
          >
            Pause growth
          </button>
        </div>
      </div>
    </div>
  )
}
