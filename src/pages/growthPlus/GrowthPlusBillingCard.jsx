import { Link } from 'react-router-dom'
import { ChevronRight, CreditCard } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { mockGrowthPlusNextBillingAt } from '@/mocks/user'

function formatBillingDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Dedicated billing surface — separated from the Controls card so the
// money side of the subscription has its own visual identity. Chip +
// label + price on the left, ghost Manage button on the right.
export default function GrowthPlusBillingCard() {
  return (
    <section className="flex items-center gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm md:p-5">
      <CardChip color="purple" icon={CreditCard} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-text-secondary">Next billing</p>
        <p className="mt-0.5 text-sm font-semibold text-text-primary">
          $49.00 · {formatBillingDate(mockGrowthPlusNextBillingAt)}
        </p>
      </div>
      <Link
        to="/account/growth-plus"
        className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
      >
        Manage
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
      </Link>
    </section>
  )
}
