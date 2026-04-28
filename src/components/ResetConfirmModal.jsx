import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

// Reusable confirmation modal for "Reset to defaults" actions on every
// settings card. Same modal animation pattern as everything else on
// the page (mounted state + 2× rAF + translate-y-4 → 0). Mobile bottom
// sheet, desktop centered max-w-md.
//
// Props:
//   open         — boolean, controls visibility
//   onClose      — () => void, dismisses without confirming
//   onConfirm    — () => void, fired when user clicks "Reset to defaults"
//   sectionLabel — string, e.g. "Mode", "Engagement", "Filters", "Whitelist"
export default function ResetConfirmModal({ open, onClose, onConfirm, sectionLabel }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!open) return
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Reset ${sectionLabel} to defaults`}
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 transition-opacity duration-200 lg:items-center ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-h-[85vh] flex-col overflow-hidden rounded-t-xl bg-surface shadow-xl transition-all duration-200 ease-out lg:max-w-md lg:rounded-xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">
            Reset {sectionLabel} to defaults?
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="px-5 py-4 text-sm text-text-secondary">
          This will replace your current settings. You can change them again any time.
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-3 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-red-tint px-5 text-sm font-medium text-red-text transition-opacity hover:opacity-90"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  )
}
