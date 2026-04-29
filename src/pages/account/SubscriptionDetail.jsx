import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { useAccounts } from '@/stores/useAccounts'
import { invoicesForSubscription } from '@/mocks/invoices'
import PlanCard from './PlanCard'
import ServerCard from './ServerCard'
import InvoicesTable from './InvoicesTable'
import CancelSubscriptionModal from './CancelSubscriptionModal'
import { STATUS_PILL, letterFor } from './subscriptionShared'

export default function SubscriptionDetail() {
  const { id } = useParams()
  const sub = useSubscriptions((s) => s.subscriptions.find((x) => x.id === id))
  const accounts = useAccounts((s) => s.accounts)
  const [cancelOpen, setCancelOpen] = useState(false)

  if (!sub) return <Navigate to="/account/subscriptions" replace />

  const account = accounts.find((a) => a.id === sub.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[sub.status] ?? STATUS_PILL.active
  const invoices = invoicesForSubscription(sub.id)

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 md:px-6 lg:px-8">
      {/* Standalone header — no settings shell wrapper. */}
      <div className="flex items-center gap-3">
        <Link
          to="/account/subscriptions"
          aria-label="Back to subscriptions"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        {profilePic ? (
          <img src={profilePic} alt="" className="h-11 w-11 rounded-full object-cover" />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-tint text-base font-semibold text-blue-text">
            {letterFor(username)}
          </span>
        )}
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">{username}</h1>
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${pill.cls}`}>
            {pill.label}
          </span>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-6">
        <PlanCard subscription={sub} />
        <ServerCard subscription={sub} />

        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-text-primary">Invoices</h2>
          <InvoicesTable
            invoices={invoices}
            emptyMessage="No invoices yet for this subscription."
          />
        </div>

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
      </div>

      <CancelSubscriptionModal open={cancelOpen} onClose={() => setCancelOpen(false)} />
    </div>
  )
}
