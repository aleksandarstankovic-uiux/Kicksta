import { ArrowRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import CardChip from '@/components/CardChip'
import {
  mockGrowthPlusInsights,
  mockGrowthPlusTierById,
} from '@/mocks/growth'
import { formatCount } from '@/utils/formatCount'

// Full-width Growth+ snapshot on the Overview page. Only renders when
// the user has G+.
//
// Visual identity for the surface comes from the purple chip + title
// + tier pill — NOT the header band. The band uses `bg-bg/50` to stay
// consistent with every other tinted-header card on the dashboard.
//
// Typography matches MetricCard: text-xs muted labels + text-xl/2xl
// semibold values. Stats sit in a single row with vertical dividers
// between them so the numbers read as a structured strip, not a pile.
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
      {/* Tinted header band — same `bg-bg/50` recipe as every other
          card with this chrome (Audit, Targeting / Engagement
          snapshots, etc). Hosts the identity chip + title + tier pill
          + "View details" link. */}
      <div className="-mx-4 -mt-4 mb-4 rounded-t-xl border-b border-border bg-bg/50 px-4 py-4 lg:-mx-6 lg:-mt-6 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <CardChip color="purple" icon={Sparkles} />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-text-primary">
                Growth+
              </h2>
              {tier && (
                <span className="inline-flex items-center rounded-full bg-purple-tint px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-purple-text">
                  {tier.name}
                </span>
              )}
            </div>
          </div>

          <Link
            to="/growth-plus"
            className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-purple-text hover:bg-purple-tint"
          >
            View details
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Stat strip — 2×2 on mobile, 4-up on sm:+. Per-cell borders
          create a vertical separator between adjacent stats and a
          horizontal separator between the two mobile rows. On sm:+
          the row separator disappears and verticals run the full
          width. */}
      <div className="grid grid-cols-2 sm:grid-cols-4">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={[
              'min-w-0 px-4 py-2 sm:py-0',
              // Mobile vertical separator: every 2nd column
              i % 2 === 1 ? 'border-l border-border' : '',
              // Mobile horizontal separator: row 2 only (indexes 2, 3)
              i >= 2 ? 'border-t border-border pt-3' : '',
              // Desktop: vertical separator on every cell except the first
              i > 0 ? 'sm:border-l sm:border-border' : '',
              // Desktop: kill the mobile horizontal separator + extra padding
              i >= 2 ? 'sm:border-t-0 sm:pt-0' : '',
              // Trim outer padding so the strip aligns with the card edges
              i === 0 ? 'sm:pl-0' : '',
              i === stats.length - 1 ? 'sm:pr-0' : '',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            <p className="truncate text-xs font-medium text-text-muted">
              {s.label}
            </p>
            <p className="mt-1 truncate text-xl font-semibold text-text-primary lg:text-2xl">
              {s.value}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}
