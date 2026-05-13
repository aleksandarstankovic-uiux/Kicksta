import { AlertTriangle } from 'lucide-react'
import { formatDate } from './subscriptionShared'

// Yellow banner shown above the subscription detail page when the
// subscription is paused or cancelled_pending. Surfaces the relevant
// end/resume date + a Resume action.
//
// Variants:
//   - paused            → "Paused — resumes {date}" + Resume now button
//   - cancelled_pending → "Ending {date}. Full access until then." + Resume button
export default function SubscriptionStateBanner({ subscription, onResume }) {
  const isPaused = subscription.status === 'paused'
  const isCancelledPending = subscription.status === 'cancelled_pending'
  if (!isPaused && !isCancelledPending) return null

  const dateIso = isPaused ? subscription.pauseUntil : subscription.endsAt
  const headline = isPaused
    ? `Paused — resumes ${formatDate(dateIso)}`
    : `Ending ${formatDate(dateIso)}`
  const sub = isPaused
    ? 'Growth is halted and billing is skipped until then.'
    : "You'll keep full access until then."
  const resumeLabel = isPaused ? 'Resume now' : 'Resume'

  return (
    <section
      role="status"
      className="flex items-start gap-3 rounded-xl border border-yellow-base/30 bg-yellow-tint p-4 md:p-5"
    >
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-yellow-text"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">{headline}</p>
        <p className="mt-0.5 text-xs text-text-secondary">{sub}</p>
      </div>
      <button
        type="button"
        onClick={onResume}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-yellow-base px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        {resumeLabel}
      </button>
    </section>
  )
}
