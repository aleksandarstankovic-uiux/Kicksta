import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useToasts } from '@/stores/useToasts'

// Container + single-toast renderer. Fixed to the bottom-right on
// desktop, bottom-center on mobile. Each toast mounts with a small
// slide-in animation. Click X to dismiss early.

const TONE_ICON = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle,
}

const TONE_ACCENT = {
  success: 'text-green-text',
  info: 'text-blue-text',
  warning: 'text-yellow-text',
  error: 'text-red-text',
}

export default function ToastContainer() {
  const toasts = useToasts((s) => s.toasts)

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4 lg:inset-x-auto lg:bottom-6 lg:right-6 lg:items-end lg:px-0"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

function ToastItem({ toast }) {
  const dismissToast = useToasts((s) => s.dismissToast)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [])

  const Icon = TONE_ICON[toast.tone] || CheckCircle2
  const accent = TONE_ACCENT[toast.tone] || 'text-green-text'

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border border-border bg-surface px-4 py-3 shadow-md transition-all duration-200 ease-out lg:w-auto lg:min-w-[260px] ${
        mounted ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
      }`}
    >
      <Icon className={`h-4 w-4 shrink-0 ${accent}`} aria-hidden="true" />
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dismissToast(toast.id)}
        className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded text-text-muted hover:text-text-primary"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}
