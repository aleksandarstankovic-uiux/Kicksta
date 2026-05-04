import { useState } from 'react'
import { Plus, Layers, Receipt } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { mockInvoices } from '@/mocks/invoices'
import PaymentMethodsCard from './PaymentMethodsCard'
import SubscriptionCard from './SubscriptionCard'
import AddSubscriptionModal from './AddSubscriptionModal'
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
  const [addSubOpen, setAddSubOpen] = useState(false)

  return (
    <div className="flex flex-col gap-6">
      <PaymentMethodsCard />

      {/* Subscriptions */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CardChip color="blue" icon={Layers} />
            <h2 className="text-base font-semibold text-text-primary">Subscriptions</h2>
            <span className="inline-flex rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
              {subs.length}
            </span>
            <InfoTooltip text="One subscription per connected Instagram account. Each one bills against your primary payment method." />
          </div>
          <button
            onClick={() => setAddSubOpen(true)}
            aria-label="Add subscription"
            className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg bg-blue-base px-3 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Add subscription</span>
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {subs.map((sub) => (
            <SubscriptionCard key={sub.id} subscription={sub} />
          ))}
        </div>
      </div>

      {/* Billing history */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <CardChip color="neutral" icon={Receipt} />
          <h2 className="text-base font-semibold text-text-primary">Billing history</h2>
          <InfoTooltip text="Every charge across every subscription on this account, newest first." />
        </div>
        <InvoicesTable
          invoices={mockInvoices}
          emptyMessage="No invoices yet — your first charge will appear here after your trial ends."
        />
      </div>

      <AddSubscriptionModal open={addSubOpen} onClose={() => setAddSubOpen(false)} />
    </div>
  )
}
