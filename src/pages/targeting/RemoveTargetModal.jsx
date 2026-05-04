import { useEffect } from 'react'
import { useTargetsStore } from '@/stores/useTargetsStore'

// Soft-delete confirmation. The store's `removeTarget` flips the
// target's status to `archived` rather than hard-deleting; users
// can restore from the Archived bucket. Bottom sheet on mobile,
// centered modal on desktop. Primary button uses the action name
// ("Remove target") per CLAUDE.md — never "Confirm" or "Yes".
export default function RemoveTargetModal({ target, onClose }) {
  const removeTarget = useTargetsStore((s) => s.removeTarget)

  // Close on Escape.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!target) return null

  const handleRemove = () => {
    removeTarget(target.id)
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Remove target"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-xl bg-surface p-5 shadow-xl lg:max-w-md lg:rounded-xl"
      >
        <h2 className="text-lg font-semibold text-text-primary">
          Remove this target?
        </h2>
        <p className="mt-2 text-sm text-text-secondary">
          {target.value} will move to your Archive and stop being used for growth. You can restore it from there at any time.
        </p>

        <div className="mt-6 flex flex-col-reverse gap-4 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Keep it
          </button>
          <button
            type="button"
            onClick={handleRemove}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-red-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Remove target
          </button>
        </div>
      </div>
    </div>
  )
}
