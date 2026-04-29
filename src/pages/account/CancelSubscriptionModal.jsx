import { useEffect, useState } from 'react'
import { AlertTriangle, X } from 'lucide-react'

// Stub for the eventual 6-step cancellation flow. Lets us ship the
// settings page now and design the real flow as its own spec.
export default function CancelSubscriptionModal({ open, onClose }) {
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

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <div
        className={`w-full max-w-md rounded-t-2xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-2xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-tint text-red-text">
              <AlertTriangle className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Cancel subscription</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-md text-text-muted hover:bg-bg"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-text-secondary">
          The full cancellation flow is coming soon. For now, contact support to cancel.
        </p>
        <div className="mt-5 flex items-center justify-end">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
