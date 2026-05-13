import { useState } from 'react'
import { Globe } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { findServer } from '@/mocks/servers'
import ChangeServerModal from './ChangeServerModal'

// Compact card showing the subscription's server location (city +
// country) with a Change action. Replaces the orphan "Server: ..."
// line that previously floated between PlanCard and Invoices on the
// SubscriptionDetail page.
//
// Mirrors the BillingCard pattern: CardChip on the left, label +
// value in the middle, Change button on the right.
export default function ServerCard({ subscription }) {
  const [open, setOpen] = useState(false)
  const server = findServer(subscription.server)

  return (
    <>
      <section className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-5">
        <div className="flex items-center gap-3">
          <CardChip color="blue" icon={Globe} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-text-secondary">Server</p>
            <p className="mt-0.5 truncate text-sm font-semibold text-text-primary">
              {server.city}, {server.country}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-10 shrink-0 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
          >
            Change
          </button>
        </div>
      </section>

      <ChangeServerModal
        open={open}
        subscription={subscription}
        onClose={() => setOpen(false)}
      />
    </>
  )
}
