import { useEffect, useState } from 'react'
import { Sparkles, X } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'

export default function ConfirmGrowthPlusModal({ open, subscription, onClose }) {
  const [mounted, setMounted] = useState(false)
  const toggleGrowthPlus = useSubscriptions((s) => s.toggleGrowthPlus)
  const adding = !subscription?.growthPlus

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

  if (!open || !subscription) return null

  function confirm() {
    toggleGrowthPlus(subscription.id)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 lg:items-center lg:p-4">
      <div
        className={`w-full max-w-md rounded-t-xl border border-border bg-surface p-6 shadow-xl transition-all duration-200 lg:rounded-xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
              <Sparkles className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">
              {adding ? 'Add Growth+' : 'Remove Growth+'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-text-secondary">
          {adding
            ? 'Add Growth+ to this subscription for an additional $10/mo. Effective immediately.'
            : 'Remove Growth+ from this subscription. Your next bill will exclude the add-on.'}
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex h-12 items-center justify-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg"
          >
            Cancel
          </button>
          <button
            onClick={confirm}
            className="inline-flex h-12 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            {adding ? 'Add for $10/mo' : 'Remove Growth+'}
          </button>
        </div>
      </div>
    </div>
  )
}
