import { AlertTriangle } from 'lucide-react'
import { formatDate } from './subscriptionShared'

// Tinted banner shown above the subscription detail page for any
// non-active state. Surfaces the relevant date + a primary action.
//
// Variants:
//   - paused            → yellow "Paused — resumes {date}" + Resume now
//   - cancelled_pending → yellow "Ending {date}" + Resume
//   - past_due          → red "Payment failed" + Pay outstanding invoice
export default function SubscriptionStateBanner({
  subscription,
  onResume,
  onPayOverdue,
}) {
  const isPaused = subscription.status === 'paused'
  const isCancelledPending = subscription.status === 'cancelled_pending'
  const isPastDue = subscription.status === 'past_due'
  if (!isPaused && !isCancelledPending && !isPastDue) return null

  let headline
  let sub
  let cta
  let onClick
  let tone
  if (isPastDue) {
    headline = 'Payment failed'
    const amount = subscription.nextBillingAmount
      ? `$${subscription.nextBillingAmount}.00 `
      : ''
    sub = `${amount}is overdue. Growth pauses until payment clears.`
    cta = 'Pay outstanding invoice'
    onClick = onPayOverdue
    tone = 'red'
  } else if (isPaused) {
    headline = `Paused — resumes ${formatDate(subscription.pauseUntil)}`
    sub = 'Growth is halted and billing is skipped until then.'
    cta = 'Resume now'
    onClick = onResume
    tone = 'yellow'
  } else {
    headline = `Ending ${formatDate(subscription.endsAt)}`
    sub = "You'll keep full access until then."
    cta = 'Resume'
    onClick = onResume
    tone = 'yellow'
  }

  const wrapper =
    tone === 'red'
      ? 'border-red-base/30 bg-red-tint'
      : 'border-yellow-base/30 bg-yellow-tint'
  const icon = tone === 'red' ? 'text-red-text' : 'text-yellow-text'
  const button = tone === 'red' ? 'bg-red-base' : 'bg-yellow-base'

  return (
    <section
      role="status"
      className={`flex flex-col gap-3 rounded-xl border p-4 md:flex-row md:items-center md:p-5 ${wrapper}`}
    >
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <AlertTriangle
          className={`mt-0.5 h-5 w-5 shrink-0 ${icon}`}
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text-primary">{headline}</p>
          <p className="mt-0.5 text-xs text-text-secondary">{sub}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex h-10 w-full shrink-0 items-center justify-center rounded-lg px-4 text-xs font-semibold text-white transition-opacity hover:opacity-90 md:w-auto ${button}`}
      >
        {cta}
      </button>
    </section>
  )
}
