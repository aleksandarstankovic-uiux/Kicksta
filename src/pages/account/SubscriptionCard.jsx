import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAccounts } from '@/stores/useAccounts'
import { STATUS_PILL, formatDate, letterFor } from './subscriptionShared'

export default function SubscriptionCard({ subscription }) {
  const accounts = useAccounts((s) => s.accounts)
  const account = accounts.find((a) => a.id === subscription.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[subscription.status] ?? STATUS_PILL.active
  const planLabel = subscription.plan === 'advanced' ? 'Advanced plan' : 'Growth plan'

  return (
    <Link
      to={`/account/subscriptions/${subscription.id}`}
      className="flex items-start gap-3 border-b border-border py-3 transition-colors first:pt-0 last:border-b-0 last:pb-0 hover:bg-bg/50 md:items-center md:gap-4"
    >
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
        <p className="mt-0.5 text-xs text-text-muted">
          Next: ${subscription.nextBillingAmount} on{' '}
          {formatDate(subscription.nextBillingAt)}
        </p>
      </div>
      <ChevronRight className="mt-3 h-5 w-5 shrink-0 self-start text-text-muted md:mt-0 md:self-center" />
    </Link>
  )
}
