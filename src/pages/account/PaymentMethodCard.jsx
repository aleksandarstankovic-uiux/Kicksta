import { useState } from 'react'
import { CreditCard, Pencil } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { usePaymentMethod } from '@/stores/usePaymentMethod'
import { useSubscriptions } from '@/stores/useSubscriptions'
import EditPaymentModal from './EditPaymentModal'

const PLAN_PRICE = { growth: 29, advanced: 49 }

function brandLabel(brand) {
  return { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex' }[brand] ?? 'Card'
}

export default function PaymentMethodCard() {
  const card = usePaymentMethod()
  const subscriptions = useSubscriptions((s) => s.subscriptions)
  const [open, setOpen] = useState(false)

  const activeSubs = subscriptions.filter((s) => s.status !== 'canceled')
  const monthlyTotal = activeSubs.reduce(
    (sum, s) => sum + PLAN_PRICE[s.plan] + (s.growthPlus ? 10 : 0),
    0,
  )

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <CardChip color="blue" icon={CreditCard} />
        <h2 className="text-base font-semibold text-text-primary">Payment method</h2>
        <InfoTooltip text="The single card we charge for every subscription on this account." />
      </div>

      <div className="mt-4 flex items-start justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <p className="text-sm font-semibold text-text-primary">
            {brandLabel(card.brand)} ending in {card.last4}
          </p>
          <p className="text-xs text-text-secondary">
            Expires {String(card.expMonth).padStart(2, '0')}/{card.expYear}
          </p>
          <p className="text-xs text-text-secondary">Billing email: {card.billingEmail}</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-bg"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit
        </button>
      </div>

      <p className="mt-3 text-xs text-text-muted">
        Used by {activeSubs.length} {activeSubs.length === 1 ? 'subscription' : 'subscriptions'} · ${monthlyTotal}/mo total
      </p>

      <EditPaymentModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
