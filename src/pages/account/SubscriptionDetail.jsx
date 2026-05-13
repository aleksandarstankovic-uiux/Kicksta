import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { useAccounts } from '@/stores/useAccounts'
import { invoicesForSubscription } from '@/mocks/invoices'
import { findServer } from '@/mocks/servers'
import PlanCard from './PlanCard'
import InvoicesTable from './InvoicesTable'
import CancelSubscriptionModal from './CancelSubscriptionModal'
import SubscriptionStateBanner from './SubscriptionStateBanner'
import { STATUS_PILL, letterFor } from './subscriptionShared'

export default function SubscriptionDetail() {
  const { id } = useParams()
  const sub = useSubscriptions((s) => s.subscriptions.find((x) => x.id === id))
  const accounts = useAccounts((s) => s.accounts)
  const resume = useSubscriptions((s) => s.resume)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!sub) return <Navigate to="/account/billing" replace />

  const account = accounts.find((a) => a.id === sub.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[sub.status] ?? STATUS_PILL.active
  const invoices = invoicesForSubscription(sub.id)
  const isOnHold =
    sub.status === 'paused' || sub.status === 'cancelled_pending'

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 lg:px-8">
      <div className="flex items-center gap-2 sm:gap-3">
        <Link
          to="/account/billing"
          aria-label="Back to subscriptions"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary sm:h-11 sm:w-11"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        {profilePic ? (
          <img src={profilePic} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover sm:h-11 sm:w-11" />
        ) : (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-tint text-base font-semibold text-blue-text sm:h-11 sm:w-11">
            {letterFor(username)}
          </span>
        )}
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h1 className="truncate text-base font-semibold leading-snug text-text-primary sm:text-lg lg:text-xl">{username}</h1>
          <span className={`inline-flex shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${pill.cls}`}>
            {pill.label}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        {isOnHold && (
          <SubscriptionStateBanner
            subscription={sub}
            onResume={() => resume(sub.id)}
          />
        )}
        <PlanCard subscription={sub} />
        <p className="text-xs text-text-secondary">
          Server: <span className="font-medium text-text-primary">{findServer(sub.server).label}</span> · {findServer(sub.server).region}
        </p>

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-text-primary">Invoices</h2>
          <InvoicesTable
            invoices={invoices}
            emptyMessage="No invoices yet for this subscription."
          />
        </div>

        {!isOnHold && (
          <div className="mt-2 flex flex-col gap-3 rounded-xl border border-border bg-bg p-4 md:flex-row md:items-center md:justify-between md:p-6">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Cancel subscription</h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                Cancel to stop growth and end billing for this account.
              </p>
            </div>
            <button
              onClick={() => setCancelOpen(true)}
              className="inline-flex h-10 shrink-0 items-center rounded-lg bg-red-tint px-4 text-sm font-medium text-red-text hover:bg-red-tint/80"
            >
              Cancel subscription
            </button>
          </div>
        )}
      </div>

      <CancelSubscriptionModal
        open={cancelOpen}
        subscription={sub}
        onClose={() => setCancelOpen(false)}
      />
    </div>
  )
}
