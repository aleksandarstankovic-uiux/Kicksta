import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, X } from 'lucide-react'

export default function AddSubscriptionModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false)
  const navigate = useNavigate()

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
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
              <Plus className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Add subscription</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <p className="text-sm text-text-secondary">
          Connect another Instagram account to add a new subscription. You'll choose a plan
          and server during setup.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onClose()
              navigate('/signup/connect-instagram')
            }}
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90"
          >
            Connect Instagram
          </button>
        </div>
      </div>
    </div>
  )
}
