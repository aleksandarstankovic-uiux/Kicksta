import { useState } from 'react'
import { Plus, Layers } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useSubscriptions } from '@/stores/useSubscriptions'
import SubscriptionCard from './SubscriptionCard'
import AddSubscriptionModal from './AddSubscriptionModal'

export default function SubscriptionsList() {
  const subs = useSubscriptions((s) => s.subscriptions)
  const [open, setOpen] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <CardChip color="blue" icon={Layers} />
          <h2 className="text-base font-semibold text-text-primary">Subscriptions</h2>
          <span className="inline-flex rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
            {subs.length}
          </span>
          <InfoTooltip text="One subscription per connected Instagram account. Each one bills against your single payment method." />
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center gap-1 rounded-lg bg-blue-base px-3 text-sm font-medium text-white hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> Add subscription
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {subs.map((sub) => (
          <SubscriptionCard key={sub.id} subscription={sub} />
        ))}
      </div>

      <AddSubscriptionModal open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
