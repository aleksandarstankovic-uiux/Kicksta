import { useEffect } from 'react'

// Bulk-aware "Archive N targets?" confirm. Mirrors RemoveTargetModal:
// bottom sheet on mobile (items-end), centered modal on desktop
// (lg:items-center). Primary button uses the action name per CLAUDE.md.
//
// `targets` is the array of target objects the user has selected. The
// component summarizes up to 3 handles inline; if more, appends
// "and N more" to keep the body legible.
export default function BulkRemoveModal({ targets, onClose, onConfirm }) {
  // Close on Escape.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!targets || targets.length === 0) return null

  const n = targets.length
  const preview = targets.slice(0, 3).map((t) => t.value).join(', ')
  const rest = n > 3 ? ` and ${n - 3} more` : ''

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Archive targets"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-xl bg-surface p-5 shadow-xl lg:max-w-md lg:rounded-xl"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          Archive {n} targets?
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {preview}{rest} will move to your Archive and stop being used for growth. You can restore them at any time.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-4 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Keep them
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-red-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Move {n} to Archive
          </button>
        </div>
      </div>
    </div>
  )
}
