import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useAccounts } from '@/stores/useAccounts'
import { findServer } from '@/mocks/servers'
import { invoicesForSubscription } from '@/mocks/invoices'
import { STATUS_PILL, daysSince, formatDate, letterFor } from './subscriptionShared'

export default function SubscriptionCard({ subscription }) {
  const accounts = useAccounts((s) => s.accounts)
  const activeAccountId = useAccounts((s) => s.activeId)
  const account = accounts.find((a) => a.id === subscription.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[subscription.status] ?? STATUS_PILL.active
  const server = findServer(subscription.server)
  const planLabel = subscription.plan === 'advanced' ? 'Advanced plan' : 'Growth plan'

  const isActiveAccount = subscription.accountId === activeAccountId
  const memberDays = daysSince(subscription.startedAt)
  const invoiceCount = invoicesForSubscription(subscription.id).length

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-text-primary">{username}</p>
              {isActiveAccount && (
                <span className="inline-flex rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
                  Currently active
                </span>
              )}
            </div>
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
          <p className="mt-2 text-xs text-text-muted">
            {invoiceCount} {invoiceCount === 1 ? 'invoice' : 'invoices'} · Active for {memberDays} {memberDays === 1 ? 'day' : 'days'}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 self-center text-text-muted" />
      </div>
    </Link>
  )
}
