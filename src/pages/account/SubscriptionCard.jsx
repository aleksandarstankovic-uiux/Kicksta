import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAccounts } from '@/stores/useAccounts'
import { STATUS_PILL, formatDate, letterFor } from './subscriptionShared'

// Status-aware billing line. The list row shows a single secondary
// line under the plan label — what that line says depends on where
// the subscription is in its lifecycle. "Next: $X on …" only makes
// sense for actively-billing rows; past_due, paused, cancelled_pending,
// and canceled each have their own truth to tell.
function BillingLine({ subscription }) {
  const {
    status,
    nextBillingAt,
    nextBillingAmount,
    pauseUntil,
    endsAt,
    trialEndsAt,
  } = subscription

  if (status === 'past_due') {
    return (
      <p className="mt-0.5 text-xs font-medium text-red-text">
        Payment failed · ${nextBillingAmount} overdue
      </p>
    )
  }
  if (status === 'paused') {
    return (
      <p className="mt-0.5 text-xs text-text-muted">
        {pauseUntil ? `Resumes ${formatDate(pauseUntil)}` : 'Paused'}
      </p>
    )
  }
  if (status === 'cancelled_pending') {
    return (
      <p className="mt-0.5 text-xs text-text-muted">
        {endsAt ? `Ends ${formatDate(endsAt)}` : 'Ending soon'}
      </p>
    )
  }
  if (status === 'canceled') {
    return (
      <p className="mt-0.5 text-xs text-text-muted">
        {endsAt ? `Ended ${formatDate(endsAt)}` : 'Canceled'}
      </p>
    )
  }
  if (status === 'trialing') {
    return (
      <p className="mt-0.5 text-xs text-text-muted">
        Trial ends {formatDate(trialEndsAt ?? nextBillingAt)} · then ${nextBillingAmount}
      </p>
    )
  }
  // active (default)
  return (
    <p className="mt-0.5 text-xs text-text-muted">
      Next: ${nextBillingAmount} on {formatDate(nextBillingAt)}
    </p>
  )
}

export default function SubscriptionCard({ subscription, isLast = false }) {
  const accounts = useAccounts((s) => s.accounts)
  const account = accounts.find((a) => a.id === subscription.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[subscription.status] ?? STATUS_PILL.active
  const planLabel = subscription.plan === 'advanced' ? 'Advanced plan' : 'Growth plan'

  return (
    <Link
      to={`/account/subscriptions/${subscription.id}`}
      className="group relative isolate flex items-center gap-3 py-3 first:pt-0 last:pb-0 md:gap-4"
    >
      {/* Hover background — inset rounded pill behind the content so
          the highlight reads as a contained shape rather than an
          edge-to-edge wash. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-2 inset-y-1 -z-10 rounded-lg bg-bg/60 opacity-0 transition-opacity group-hover:opacity-100"
      />
      {/* Divider — drawn as an inset span instead of the Link's
          border-b so the line matches the hover pill's horizontal
          inset. The previous edge-to-edge border-b extended past the
          rounded hover's right edge, breaking the visual rectangle. */}
      {!isLast && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 bottom-0 h-px bg-border"
        />
      )}
      {profilePic ? (
        <img
          src={profilePic}
          alt=""
          className="h-10 w-10 shrink-0 rounded-full object-cover"
        />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-tint text-sm font-semibold text-blue-text">
          {letterFor(username)}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-text-primary">{username}</p>
          <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${pill.cls}`}>
            {pill.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-text-secondary">
          {planLabel}
          {subscription.growthPlus ? ' · Growth+' : ''}
        </p>
        <BillingLine subscription={subscription} />
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-text-muted" />
    </Link>
  )
}
