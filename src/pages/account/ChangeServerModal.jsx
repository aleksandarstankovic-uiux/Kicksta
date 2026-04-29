import { useEffect, useState } from 'react'
import { Globe, X, Check } from 'lucide-react'
import { mockServers } from '@/mocks/servers'
import { useSubscriptions } from '@/stores/useSubscriptions'

export default function ChangeServerModal({ open, subscription, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [picked, setPicked] = useState(subscription?.server)
  const setServer = useSubscriptions((s) => s.setServer)

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setPicked(subscription?.server)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, subscription?.server])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open || !subscription) return null

  function save() {
    if (picked && picked !== subscription.server) {
      setServer(subscription.id, picked)
    }
    onClose()
  }

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
              <Globe className="h-4 w-4" />
            </span>
            <h2 className="text-base font-semibold text-text-primary">Change server</h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mb-3 text-sm text-text-secondary">
          The server determines compliance region and proxy routing for this subscription.
        </p>

        <div className="flex flex-col gap-2">
          {mockServers.map((s) => {
            const isSelected = picked === s.id
            return (
              <button
                key={s.id}
                onClick={() => setPicked(s.id)}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                  isSelected
                    ? 'border-blue-base bg-blue-tint/40 shadow-md'
                    : 'border-border bg-surface hover:bg-bg'
                }`}
              >
                <div>
                  <p className="text-sm font-medium text-text-primary">{s.label}</p>
                  <p className="text-xs text-text-secondary">{s.region}</p>
                </div>
                {isSelected && <Check className="h-4 w-4 shrink-0 text-blue-base" />}
              </button>
            )
          })}
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary hover:bg-bg"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={picked === subscription.server}
            className="inline-flex h-10 items-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
