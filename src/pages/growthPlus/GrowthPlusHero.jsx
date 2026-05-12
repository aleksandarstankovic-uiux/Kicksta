import { Sparkles } from 'lucide-react'
import { mockGrowthPlusDeltas, mockGrowthPlusInsights } from '@/mocks/growth'
import { useCountUp } from '@/hooks/useCountUp'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

// Hero card for the Growth+ page. Premium purple-gradient surface,
// counting hero number, delta strip (today / week / month) underneath.
//
// previewMode: skips the count-up animation (used by the non-subscriber
// locked-preview wrapper where animation behind a blur reads jittery).
export default function GrowthPlusHero({ previewMode = false }) {
  const target = mockGrowthPlusInsights.algorithmicBoost
  const animatedValue = useCountUp(target, 600)
  const value = previewMode ? target : animatedValue
  const boostEnabled = useGrowthConfig(
    (s) => s.config.growthPlusControls.enabled,
  )

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
        {!previewMode && (
          <span
            className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              boostEnabled
                ? 'bg-green-tint text-green-text'
                : 'bg-bg text-text-secondary'
            }`}
          >
            {boostEnabled ? 'Active' : 'Paused'}
          </span>
        )}
      </div>

      <p className="mt-4 text-5xl font-semibold leading-none text-text-primary md:text-6xl">
        +{value}
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        {boostEnabled
          ? 'extra followers from Growth+ this month'
          : 'Boost paused — billing continues'}
      </p>

      <dl className="mt-5 flex items-center gap-4 text-sm text-text-secondary sm:gap-6">
        <DeltaItem label="today" value={mockGrowthPlusDeltas.today} />
        <span aria-hidden="true" className="h-3 w-px bg-purple-base/25" />
        <DeltaItem label="this week" value={mockGrowthPlusDeltas.week} />
        <span aria-hidden="true" className="h-3 w-px bg-purple-base/25" />
        <DeltaItem label="this month" value={mockGrowthPlusDeltas.month} />
      </dl>
    </section>
  )
}

function DeltaItem({ label, value }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="sr-only">{label}</dt>
      <dd className="text-base font-semibold text-purple-text">+{value}</dd>
      <span aria-hidden="true" className="text-xs text-text-secondary">
        {label}
      </span>
    </div>
  )
}
