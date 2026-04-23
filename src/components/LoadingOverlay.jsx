import { CheckCircle2 } from 'lucide-react'

/**
 * Consolidated loading overlay used across signup flow.
 *
 * Props:
 *  - icon: Lucide icon component (e.g. Sparkles, Link2, Target)
 *  - title: string
 *  - subtitle: string
 *  - color: 'blue' | 'green' (controls spinner + dot color)
 *  - success: { title, subtitle } — if set, shows success state instead of loading
 */
export default function LoadingOverlay({ icon: Icon, title, subtitle, color = 'blue', success }) {
  const spinnerColor = color === 'green' ? 'border-t-green-base' : 'border-t-blue-base'
  const iconColor = color === 'green' ? 'text-green-text' : 'text-blue-base'
  const dotColor = color === 'green' ? 'bg-green-base' : 'bg-blue-base'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm"
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      <div
        className="mx-4 flex w-full max-w-sm flex-col items-center gap-4 rounded-xl border border-border bg-surface p-8 shadow-xl"
        style={{ animation: 'fadeSlideIn 0.3s ease-out' }}
      >
        {success ? (
          <>
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full bg-green-tint"
              style={{ animation: 'fadeSlideIn 0.3s ease-out' }}
            >
              <CheckCircle2 className="h-8 w-8 text-green-text" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-text-primary">{success.title}</h2>
              <p className="mt-1.5 text-sm text-text-secondary">{success.subtitle}</p>
            </div>
          </>
        ) : (
          <>
            <div className="relative flex h-16 w-16 items-center justify-center">
              <div
                className={`absolute inset-0 animate-spin rounded-full border-2 border-border ${spinnerColor}`}
                style={{ animationDuration: '1.2s' }}
              />
              <Icon className={`h-6 w-6 animate-pulse ${iconColor}`} />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
              <p className="mt-1.5 text-sm text-text-secondary">{subtitle}</p>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`h-2 w-2 animate-bounce rounded-full ${dotColor}`} style={{ animationDelay: '0ms' }} />
              <div className={`h-2 w-2 animate-bounce rounded-full ${dotColor}`} style={{ animationDelay: '150ms' }} />
              <div className={`h-2 w-2 animate-bounce rounded-full ${dotColor}`} style={{ animationDelay: '300ms' }} />
            </div>
          </>
        )}
      </div>
    </div>
  )
}
