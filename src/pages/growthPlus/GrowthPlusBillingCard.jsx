import { Link } from 'react-router-dom'
import { ArrowUpRight, ChevronRight, CreditCard } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { mockGrowthPlusNextBillingAt } from '@/mocks/user'
import { mockGrowthPlusTierById, mockGrowthPlusTiers } from '@/mocks/growth'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

function formatBillingDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Next tier above the current one, or null if already on Elite. Used
// for the upgrade nudge ribbon at the bottom of the card.
function nextTier(currentId) {
  const i = mockGrowthPlusTiers.findIndex((t) => t.id === currentId)
  if (i < 0 || i >= mockGrowthPlusTiers.length - 1) return null
  return mockGrowthPlusTiers[i + 1]
}

// Dedicated billing surface. Shows current tier name + price + next
// billing date. When the user isn't on Elite, a slim upgrade ribbon
// at the bottom points to the next tier — keeps upgrade discovery
// visible without crowding the primary "Manage" CTA.
export default function GrowthPlusBillingCard() {
  const tierId = useGrowthConfig((s) => s.config.growthPlusControls.tier)
  const tier = mockGrowthPlusTierById[tierId]
  const upgrade = nextTier(tierId)

  return (
    <section className="rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex items-center gap-3 p-4 md:p-5">
        <CardChip color="purple" icon={CreditCard} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-text-secondary">Next billing</p>
          <p className="mt-0.5 text-sm font-semibold text-text-primary">
            {tier ? `${tier.name} · $${tier.price}.00` : '$49.00'} ·{' '}
            {formatBillingDate(mockGrowthPlusNextBillingAt)}
          </p>
        </div>
        <Link
          to="/account/growth-plus"
          className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
        >
          Manage
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      {upgrade && (
        <Link
          to="/growth-plus/upgrade"
          className="flex items-center gap-2 border-t border-border bg-purple-tint/40 px-4 py-3 text-xs font-medium text-purple-text transition-colors hover:bg-purple-tint md:px-5"
        >
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span className="flex-1">
            Upgrade to {upgrade.name} for ${upgrade.price}/mo — unlock{' '}
            {upgrade.id === 'elite' ? 'Top accounts targeting' : 'Fast speed + Targeted quality'}
          </span>
          <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </Link>
      )}
    </section>
  )
}
