import { Heart, Megaphone, TrendingUp } from 'lucide-react'
import { mockGrowthPlusInsights } from '@/mocks/growth'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { formatCount } from '@/utils/formatCount'

// Three supporting metric cards under the hero. Each card pairs the
// monthly headline (plan-delivered value) with a cumulative-since-
// subscribed line so users see two anchors:
//   - "this is what my plan gives me every month"
//   - "this is what I've gotten so far from my subscription"
// Reads values per-tier from mockGrowthPlusInsights so the numbers
// always match the user's actual plan ceiling.
export default function GrowthPlusMetricsStrip() {
  const tierId = useGrowthConfig((s) => s.config.growthPlusControls.tier)
  const insights = mockGrowthPlusInsights[tierId] ?? mockGrowthPlusInsights.pro

  const cards = [
    {
      key: 'reach',
      icon: TrendingUp,
      value: `+${Math.round(insights.postReachLift * 100)}%`,
      label: 'Post reach lift',
      cumulative: `+${formatCount(insights.totalReachAdded)} extra impressions`,
    },
    {
      key: 'engagement',
      icon: Heart,
      value: `${(insights.engagementRate * 100).toFixed(1)}%`,
      label: 'Engagement rate',
      cumulative: `${formatCount(insights.totalInteractions)} total interactions`,
    },
    {
      key: 'posts',
      icon: Megaphone,
      value: String(insights.boostedPosts),
      label: 'Boosted posts',
      cumulative: `${insights.totalBoostedPosts} since subscribed`,
    },
  ]

  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
      {cards.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.key}
            className="flex flex-col gap-2 rounded-xl border border-border bg-surface p-4 shadow-sm lg:p-6"
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
            <p className="text-[11px] leading-snug text-text-muted">
              {c.cumulative}
            </p>
          </div>
        )
      })}
    </section>
  )
}
