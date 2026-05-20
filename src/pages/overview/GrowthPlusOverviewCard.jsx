import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import CardChip from '@/components/CardChip'
import {
  mockGrowthPlusInsights,
  mockGrowthPlusTierById,
} from '@/mocks/growth'
import { formatCount } from '@/utils/formatCount'

// Growth+ snapshot for the Overview page. Renders one of two states:
//   - subscribed: tier pill in the header + "View details" link top-
//     right + 3-stat strip in the body.
//   - non-subscribed: short benefit blurb in the body + "Get Growth+"
//     primary CTA below it (mirrors the audit card's empty-state
//     shape so the two surfaces share visual rhythm in the 2-col
//     Overview row).
//
// Header band uses `bg-bg/50` — same recipe as every other tinted-
// header card on the dashboard. G+ identity is carried by the purple
// chip + tier pill + purple link tones, not the band color.
//
// Typography mirrors MetricCard: text-xs muted labels + text-xl/2xl
// semibold values. Stats sit in a single row with vertical dividers
// between them so the numbers read as a structured strip.
export default function GrowthPlusOverviewCard({ user }) {
  const subscribed = !!user?.growthPlusSubscribed

  return (
    <section className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 pb-3 lg:p-6">
      {/* Tinted header band — symmetric with every other Overview
          card that uses this chrome (Audit, snapshots, etc). */}
      <div className="-mx-4 -mt-4 mb-4 rounded-t-xl border-b border-border bg-bg/50 px-4 py-4 lg:-mx-6 lg:-mt-6 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <CardChip color="purple" icon={Sparkles} />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-text-primary">
                Growth+
              </h2>
              {subscribed && <SubscribedTierPill user={user} />}
            </div>
          </div>

          {subscribed && (
            <Link
              to="/growth-plus"
              className="inline-flex items-center gap-1 text-sm font-medium text-purple-text transition-opacity hover:opacity-80"
            >
              View details
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>

      {subscribed ? <SubscribedBody user={user} /> : <UpsellBody />}
    </section>
  )
}

function SubscribedTierPill({ user }) {
  const tier = mockGrowthPlusTierById[user.growthPlusTier] ?? null
  if (!tier) return null
  return (
    <span className="inline-flex items-center rounded-full bg-purple-tint px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-purple-text">
      {tier.name}
    </span>
  )
}

function SubscribedBody({ user }) {
  const insights =
    mockGrowthPlusInsights[user.growthPlusTier] ?? mockGrowthPlusInsights.pro

  // Three stats — the headline growth metrics G+ delivers. Engagement
  // rate is intentionally not in this strip; it lives on the audit
  // side of the row.
  const stats = [
    { label: 'Boosts this month', value: formatCount(insights.algorithmicBoost) },
    { label: 'Followers from G+', value: `+${formatCount(insights.totalFollowersGained)}` },
    { label: 'Reach added', value: formatCount(insights.totalReachAdded) },
  ]

  return (
    <div className="grid flex-1 grid-cols-1 sm:grid-cols-3">
      {stats.map((s, i, arr) => (
        <div
          key={s.label}
          className={[
            'min-w-0 py-2 sm:py-0 sm:px-4',
            // Mobile: horizontal separator between rows
            i > 0 ? 'border-t border-border pt-3' : '',
            // Desktop: vertical separator between adjacent cells
            i > 0 ? 'sm:border-l sm:border-border sm:border-t-0 sm:pt-0' : '',
            // Trim outer padding so the strip aligns with the card edges
            i === 0 ? 'sm:pl-0' : '',
            i === arr.length - 1 ? 'sm:pr-0' : '',
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
  )
}

function UpsellBody() {
  return (
    <div className="flex flex-1 flex-col">
      <p className="text-sm leading-relaxed text-text-secondary">
        Algorithmic boosts that amplify your reach and accelerate
        follower growth — on top of your existing plan.
      </p>
      <div className="mt-4">
        <Link
          to="/growth-plus"
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-purple-base px-4 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 md:w-auto md:min-w-[200px]"
        >
          <Sparkles className="h-4 w-4" aria-hidden="true" />
          Get Growth+
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  )
}
