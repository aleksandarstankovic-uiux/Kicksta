import { Sparkles } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { mockGrowthDaily, mockGrowthPlusInsights } from '@/mocks/growth'
import { useCountUp } from '@/hooks/useCountUp'

// Hero card for the Growth+ page. Premium purple-gradient surface,
// counting hero number, sparkline.
//
// previewMode: skips the count-up animation + sparkline animation
// (used by the non-subscriber locked-preview wrapper, where animation
// behind a blur reads as jittery).
export default function GrowthPlusHero({ previewMode = false }) {
  const target = mockGrowthPlusInsights.algorithmicBoost
  const animatedValue = useCountUp(target, 600)
  const value = previewMode ? target : animatedValue

  const data = mockGrowthDaily.map((d) => ({
    date: d.date,
    value: d.growthPlusGain,
  }))

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
        <span className="ml-auto rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
          Active
        </span>
      </div>

      <p className="mt-4 text-5xl font-semibold leading-none text-text-primary md:text-6xl">
        +{value}
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        extra followers from Growth+ this month
      </p>

      <div className="mt-4 h-16 md:h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-purple-base)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: 'var(--color-purple-base)' }}
              isAnimationActive={!previewMode}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
