import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { useToasts } from '@/stores/useToasts'

// Toast container. Top-right on desktop, top-center on mobile —
// always in the viewport's most visible band. Each toast has a
// tone-colored left accent bar so successes (green) and errors (red)
// are obvious at a glance.

const TONE_ICON = {
  success: CheckCircle2,
  info: Info,
  warning: AlertTriangle,
  error: AlertTriangle,
}

const TONE_ACCENT_ICON = {
  success: 'text-green-text',
  info: 'text-blue-text',
  warning: 'text-yellow-text',
  error: 'text-red-text',
}

const TONE_ACCENT_BAR = {
  success: 'bg-green-base',
  info: 'bg-blue-base',
  warning: 'bg-yellow-base',
  error: 'bg-red-base',
}

export default function ToastContainer() {
  const toasts = useToasts((s) => s.toasts)

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 top-6 z-[60] flex flex-col items-center gap-2 lg:inset-x-auto lg:right-6 lg:items-end"
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
  const accentIcon = TONE_ACCENT_ICON[toast.tone] || 'text-green-text'
  const accentBar = TONE_ACCENT_BAR[toast.tone] || 'bg-green-base'

  return (
    <div
      className={`pointer-events-auto relative flex w-full max-w-sm items-start gap-3 overflow-hidden rounded-lg border border-border bg-surface py-3 pl-4 pr-3 shadow-lg transition-all duration-200 ease-out lg:min-w-[280px] ${
        mounted ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
    >
      {/* Left accent bar — tone-colored. */}
      <span
        className={`absolute left-0 top-0 h-full w-1 ${accentBar}`}
        aria-hidden="true"
      />
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${accentIcon}`} aria-hidden="true" />
      <p className="flex-1 text-sm text-text-primary">{toast.message}</p>
      <button
        type="button"
        aria-label="Dismiss"
        onClick={() => dismissToast(toast.id)}
        className="-mt-0.5 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded text-text-muted hover:text-text-primary"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  )
}
