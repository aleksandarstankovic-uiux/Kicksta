import { useState } from 'react'
import { CreditCard, Pencil } from 'lucide-react'
import { usePaymentMethod } from '@/stores/usePaymentMethod'
import EditPaymentModal from './EditPaymentModal'

function brandLabel(brand) {
  return { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex' }[brand] ?? 'Card'
}

export default function PaymentMethodCard() {
  const card = usePaymentMethod()
  const [open, setOpen] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-tint text-blue-text">
            <CreditCard className="h-5 w-5" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold text-text-primary">
              {brandLabel(card.brand)} ending in {card.last4}
            </p>
            <p className="text-xs text-text-secondary">
              Expires {String(card.expMonth).padStart(2, '0')}/{card.expYear}
            </p>
            <p className="text-xs text-text-secondary">Billing email: {card.billingEmail}</p>
          </div>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-text hover:underline"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>

      <EditPaymentModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
