import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAccounts } from '@/stores/useAccounts'
import { findServer } from '@/mocks/servers'

const STATUS_PILL = {
  active: { cls: 'bg-green-tint text-green-text', label: 'Active' },
  trialing: { cls: 'bg-blue-tint text-blue-text', label: 'Trialing' },
  past_due: { cls: 'bg-red-tint text-red-text', label: 'Past due' },
  canceled: { cls: 'bg-bg text-text-secondary', label: 'Canceled' },
}

function letterFor(username) {
  return String(username ?? '').replace(/^@/, '').charAt(0).toUpperCase() || '·'
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default function SubscriptionCard({ subscription }) {
  const accounts = useAccounts((s) => s.accounts)
  const account = accounts.find((a) => a.id === subscription.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[subscription.status] ?? STATUS_PILL.active
  const server = findServer(subscription.server)
  const planLabel = subscription.plan === 'advanced' ? 'Advanced plan' : 'Growth plan'

  return (
    <Link
      to={`/account/subscriptions/${subscription.id}`}
      className="block rounded-xl border border-border bg-surface p-4 shadow-sm transition-shadow hover:shadow-md md:p-6"
    >
      <div className="flex items-start gap-3">
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
        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-text-primary">{username}</p>
            <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${pill.cls}`}>
              {pill.label}
            </span>
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            {planLabel}
            {subscription.growthPlus ? ' · Growth+' : ''}
          </p>
          <div className="mt-3 grid gap-1 text-xs text-text-secondary sm:grid-cols-2">
            <p>Server: <span className="text-text-primary">{server.label}</span></p>
            <p>
              Next billing:{' '}
              <span className="text-text-primary">
                ${subscription.nextBillingAmount} on {formatDate(subscription.nextBillingAt)}
              </span>
            </p>
          </div>
        </div>
        <ChevronRight className="hidden h-5 w-5 shrink-0 text-text-muted lg:block" />
      </div>
    </Link>
  )
}
