import { Receipt } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import PaymentMethodCard from './PaymentMethodCard'
import InvoicesTable from './InvoicesTable'
import { mockInvoices } from '@/mocks/invoices'

export default function PaymentPanel() {
  return (
    <div className="flex flex-col gap-6">
      <PaymentMethodCard />
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
    </div>
  )
}
