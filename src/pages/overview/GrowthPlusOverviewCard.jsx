import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import CardChip from '@/components/CardChip'
import {
  mockGrowthPlusInsights,
  mockGrowthPlusTierById,
} from '@/mocks/growth'
import { formatCount } from '@/utils/formatCount'

// Full-width Growth+ snapshot on the Overview page. Only renders when
// the user has G+. Mirrors the InstagramAuditCard chrome (rounded card
// + tinted header band) so it lives in the same visual rhythm as the
// other dashboard surfaces — but the band is purple so the surface
// reads as G+ from across the page.
//
// Typography matches MetricCard: text-xs muted labels + text-xl/2xl
// semibold values. No invented sizes — same scale the rest of the
// Overview uses for headline numbers.
//
// Slot per Overview design: between the Growth Chart / Activity Feed
// row and the Instagram Audit card.
export default function GrowthPlusOverviewCard({ user }) {
  if (!user?.growthPlusSubscribed) return null

  const insights =
    mockGrowthPlusInsights[user.growthPlusTier] ?? mockGrowthPlusInsights.pro
  const tier = mockGrowthPlusTierById[user.growthPlusTier] ?? null

  const stats = [
    { label: 'Boosts this month', value: formatCount(insights.algorithmicBoost) },
    { label: 'Followers from G+', value: `+${formatCount(insights.totalFollowersGained)}` },
    { label: 'Reach added', value: formatCount(insights.totalReachAdded) },
    { label: 'Engagement', value: `${(insights.engagementRate * 100).toFixed(1)}%` },
  ]

  return (
    <section className="rounded-xl border border-border bg-surface p-4 pb-3 lg:p-6">
      {/* Purple tinted header band — same negative-margin recipe as the
          Audit card so it spans the card's full width. Hosts the
          identity chip + title + tier pill + "View details" link. */}
      <div className="-mx-4 -mt-4 mb-4 rounded-t-xl border-b border-border bg-purple-tint px-4 py-4 lg:-mx-6 lg:-mt-6 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <CardChip color="purple" icon={Sparkles} />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-text-primary">
                Growth+
              </h2>
              {tier && (
                <span className="inline-flex items-center rounded-full bg-purple-base/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-purple-text">
                  {tier.name}
                </span>
              )}
            </div>
          </div>

          <Link
            to="/growth-plus"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-purple-text hover:bg-purple-base/10"
          >
            View details
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Stat row — 2x2 on mobile, 4-up on sm:+. Same label/value scale
          as the three headline metric cards on this page. */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 sm:gap-6">
        {stats.map((s) => (
          <div key={s.label} className="min-w-0">
            <p className="truncate text-xs font-medium text-text-muted">
              {s.label}
            </p>
            <p className="mt-1 text-xl font-semibold text-text-primary lg:text-2xl">
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
