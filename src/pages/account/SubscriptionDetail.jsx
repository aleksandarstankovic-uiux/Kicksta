import { useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { ChevronLeft, Clock } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { useAccounts } from '@/stores/useAccounts'
import { invoicesForSubscription } from '@/mocks/invoices'
import PlanCard from './PlanCard'
import InvoicesTable from './InvoicesTable'
import CancelSubscriptionModal from './CancelSubscriptionModal'
import PayOverdueModal from './PayOverdueModal'
import ServerCard from './ServerCard'
import SubscriptionStateBanner from './SubscriptionStateBanner'
import { STATUS_PILL, letterFor } from './subscriptionShared'

export default function SubscriptionDetail() {
  const { id } = useParams()
  const sub = useSubscriptions((s) => s.subscriptions.find((x) => x.id === id))
  const accounts = useAccounts((s) => s.accounts)
  const resume = useSubscriptions((s) => s.resume)
  const payOverdue = useSubscriptions((s) => s.payOverdue)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [payOpen, setPayOpen] = useState(false)

  if (!sub) return <Navigate to="/account/billing" replace />

  const account = accounts.find((a) => a.id === sub.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[sub.status] ?? STATUS_PILL.active
  const invoices = invoicesForSubscription(sub.id)
  const isOnHold =
    sub.status === 'paused' ||
    sub.status === 'cancelled_pending' ||
    sub.status === 'past_due'

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
            onPayOverdue={() => setPayOpen(true)}
          />
        )}
        <PlanCard subscription={sub} />
        <ServerCard subscription={sub} />

        {/* Invoices live inside the same surface treatment as the rest
            of the detail page (PlanCard, ServerCard). Without the card
            shell the table read as floating against the page bg. */}
        <section className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <CardChip color="neutral" icon={Clock} />
            <h2 className="text-base font-semibold text-text-primary">Invoices</h2>
            <InfoTooltip text="Every charge on this subscription, newest first." />
          </div>
          <div className="mt-4">
            <InvoicesTable
              invoices={invoices}
              emptyMessage="No invoices yet for this subscription."
            />
          </div>
        </section>

        {!isOnHold && (
          <div className="mt-2 flex flex-col gap-3 rounded-xl border border-border bg-bg p-4 md:flex-row md:items-center md:justify-between md:p-6">
            <div className="text-center md:text-left">
              <h2 className="text-base font-semibold text-text-primary">
                End this subscription
              </h2>
              <p className="mt-0.5 text-xs text-text-secondary">
                Stop growth and end billing for this account.
              </p>
            </div>
            <button
              onClick={() => setCancelOpen(true)}
              className="inline-flex h-10 w-full shrink-0 items-center justify-center rounded-lg bg-red-tint px-4 text-sm font-medium text-red-text hover:bg-red-tint/80 md:w-auto"
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

      <PayOverdueModal
        open={payOpen}
        subscription={sub}
        onClose={() => setPayOpen(false)}
        onConfirm={() => {
          payOverdue(sub.id)
          setPayOpen(false)
        }}
      />
    </div>
  )
}
