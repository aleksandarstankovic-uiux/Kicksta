import PaymentMethodCard from './PaymentMethodCard'
import InvoicesTable from './InvoicesTable'
import { mockInvoices } from '@/mocks/invoices'

export default function PaymentPanel() {
  return (
    <div className="flex flex-col gap-6">
      <PaymentMethodCard />
      <div className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-text-primary">Billing history</h2>
        <InvoicesTable
          invoices={mockInvoices}
          emptyMessage="No invoices yet — your first charge will appear here after your trial ends."
        />
      </div>
    </div>
  )
}
