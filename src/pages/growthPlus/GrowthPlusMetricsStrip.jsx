import { Heart, Megaphone, TrendingUp } from 'lucide-react'
import { mockGrowthPlusInsights } from '@/mocks/growth'

// Three supporting metric cards under the hero. Read from
// mockGrowthPlusInsights. Sizing matches the Overview MetricCard recipe
// (text-xl lg:text-2xl value, text-xs font-medium label) so the page
// reads consistent with the rest of the dashboard.
const CARDS = [
  {
    key: 'reach',
    icon: TrendingUp,
    value: `+${Math.round(mockGrowthPlusInsights.postReachLift * 100)}%`,
    label: 'Post reach lift',
  },
  {
    key: 'engagement',
    icon: Heart,
    value: `${(mockGrowthPlusInsights.engagementRate * 100).toFixed(1)}%`,
    label: 'Engagement rate',
  },
  {
    key: 'posts',
    icon: Megaphone,
    value: String(mockGrowthPlusInsights.boostedPosts),
    label: 'Boosted posts',
  },
]

export default function GrowthPlusMetricsStrip() {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
      {CARDS.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.key}
            className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm lg:p-6"
          >
            <div className="flex min-w-0 items-center gap-1.5 text-text-muted">
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <p className="min-w-0 truncate text-xs font-medium leading-tight">
                {c.label}
              </p>
            </div>
            <p className="text-xl font-semibold text-text-primary lg:text-2xl">
              {c.value}
            </p>
          </div>
        )
      })}
    </section>
  )
}
