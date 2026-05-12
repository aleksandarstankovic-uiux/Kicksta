import { Heart, Megaphone, TrendingUp } from 'lucide-react'
import { mockGrowthPlusInsights } from '@/mocks/growth'

// Three supporting metric cards under the hero. Read from
// mockGrowthPlusInsights. Each card has a purple icon chip so the
// strip reads as Growth+-owned (rather than a generic dashboard row).
const CARDS = [
  {
    key: 'reach',
    icon: TrendingUp,
    value: `+${Math.round(mockGrowthPlusInsights.postReachLift * 100)}%`,
    label: 'Post reach lift',
    sub: 'beyond your baseline reach',
  },
  {
    key: 'engagement',
    icon: Heart,
    value: `${(mockGrowthPlusInsights.engagementRate * 100).toFixed(1)}%`,
    label: 'Engagement rate',
    sub: 'active accounts that interact',
  },
  {
    key: 'posts',
    icon: Megaphone,
    value: String(mockGrowthPlusInsights.boostedPosts),
    label: 'Boosted posts',
    sub: 'posts boosted this month',
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
            className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-5"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-purple-tint text-purple-text"
            >
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-xl font-semibold text-text-primary">{c.value}</p>
            <p className="mt-0.5 text-xs font-medium text-text-primary">{c.label}</p>
            <p className="text-[11px] leading-tight text-text-muted">{c.sub}</p>
          </div>
        )
      })}
    </section>
  )
}
