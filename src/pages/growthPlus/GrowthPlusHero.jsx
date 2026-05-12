import { Sparkles } from 'lucide-react'
import {
  mockGrowthPlusInsights,
  mockGrowthPlusTierById,
} from '@/mocks/growth'
import { useCountUp } from '@/hooks/useCountUp'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'

function formatShortDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

// Hero card for the Growth+ page. Big number = total followers gained
// from Growth+ since subscribing. The header pill branches on
// subscription status:
//   active            → green-tint "Active · Pro"
//   cancelled_pending → yellow-tint "Ending Jun 12 · Pro"
//   (paused boost)    → bg/text-secondary "Paused · Pro"
export default function GrowthPlusHero() {
  const tierId = useGrowthConfig((s) => s.config.growthPlusControls.tier)
  const boostEnabled = useGrowthConfig(
    (s) => s.config.growthPlusControls.enabled,
  )
  const status = useGrowthPlusSubscription((s) => s.status)
  const endsAt = useGrowthPlusSubscription((s) => s.endsAt)
  const tier = mockGrowthPlusTierById[tierId]
  const insights = mockGrowthPlusInsights[tierId] ?? mockGrowthPlusInsights.pro

  const target = insights.totalFollowersGained
  const value = useCountUp(target, 600)

  const isCancelledPending = status === 'cancelled_pending'

  // Pill copy + theme classes.
  let pillLabel
  let pillClasses
  let dotClass
  if (isCancelledPending) {
    pillLabel = `Ending ${formatShortDate(endsAt)}`
    pillClasses = 'bg-yellow-tint text-yellow-text'
    dotClass = 'bg-yellow-base'
  } else if (boostEnabled) {
    pillLabel = 'Active'
    pillClasses = 'bg-green-tint text-green-text'
    dotClass = 'bg-green-base'
  } else {
    pillLabel = 'Paused'
    pillClasses = 'bg-bg text-text-secondary'
    dotClass = 'bg-text-muted'
  }

  return (
    <section className="overflow-hidden rounded-xl border border-purple-base/20 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-text text-surface shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-text">
          GROWTH+
        </span>
        <span
          className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${pillClasses}`}
        >
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
          {pillLabel}
          {tier && (
            <>
              <span aria-hidden="true" className="opacity-50">·</span>
              <span>{tier.name}</span>
            </>
          )}
        </span>
      </div>

      <p className="mt-4 text-4xl font-semibold leading-none text-text-primary md:text-5xl">
        +{value}
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        {isCancelledPending
          ? 'total followers gained from Growth+'
          : boostEnabled
            ? 'total followers gained from Growth+'
            : 'Boost paused — billing continues'}
      </p>
    </section>
  )
}
