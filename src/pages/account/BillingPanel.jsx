import { Link } from 'react-router-dom'
import { Layers, Plus, Receipt } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { mockInvoices } from '@/mocks/invoices'
import PaymentMethodsCard from './PaymentMethodsCard'
import SubscriptionCard from './SubscriptionCard'
import InvoicesTable from './InvoicesTable'

// Merged Plan & billing panel — replaces the previous two-panel
// split (/account/payment for cards + /account/subscriptions for
// per-IG-account subscriptions). One panel, three sections, top to
// bottom: Payment methods → Subscriptions → Billing history.
//
// /account/subscriptions/:id (the standalone per-subscription
// detail page) lives outside this panel as a sibling route under
// DashboardLayout — drilling into a card still leaves the settings
// shell entirely.
export default function BillingPanel() {
  const subs = useSubscriptions((s) => s.subscriptions)

  return (
    <div className="flex flex-col gap-6">
      <PaymentMethodsCard />

      {/* Subscriptions — one per connected Instagram account. The header
          Add button routes to the same signup flow used by AccountSwitcher's
          "Add account" so adding a subscription from here connects a new IG
          account end-to-end. */}
      <section className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <CardChip color="blue" icon={Layers} />
          <h2 className="text-base font-semibold text-text-primary">Subscriptions</h2>
          <span className="inline-flex rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
            {subs.length}
          </span>
          <InfoTooltip text="One subscription per connected Instagram account. Each one bills against your primary payment method." />
          <Link
            to="/signup/ig-preview"
            aria-label="Add subscription"
            className="ml-auto inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-bg"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add subscription</span>
          </Link>
        </div>
        {subs.length === 0 ? (
          <p className="mt-4 text-sm text-text-secondary">
            No subscriptions yet — connect your first Instagram account to get started.
          </p>
        ) : (
          <div className="mt-4 flex flex-col gap-2">
            {subs.map((sub) => (
              <SubscriptionCard key={sub.id} subscription={sub} />
            ))}
          </div>
        )}
      </section>

      {/* Billing history */}
      <section className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <CardChip color="neutral" icon={Receipt} />
          <h2 className="text-base font-semibold text-text-primary">Billing history</h2>
          <InfoTooltip text="Every charge across every subscription on this account, newest first." />
        </div>
        <div className="mt-4">
          <InvoicesTable
            invoices={mockInvoices}
            emptyMessage="No invoices yet — your first charge will appear here after your trial ends."
          />
        </div>
      </section>

    </div>
  )
}
