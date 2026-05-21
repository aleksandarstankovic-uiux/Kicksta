import { ArrowRight, ChevronRight, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import CardChip from '@/components/CardChip'
import {
  mockGrowthPlusInsights,
  mockGrowthPlusTierById,
  mockGrowthPlusTiers,
} from '@/mocks/growth'
import { formatCount } from '@/utils/formatCount'

// Growth+ snapshot for the Overview page. Two states:
//
//   - Subscribed: tier pill + "View details" link in the neutral
//     header band; body is a 3-stat strip with separators. Same
//     chrome as every other tinted-header card on the dashboard.
//
//   - Not subscribed (upsell): purple gradient chrome (G+ brand
//     color) with a "from $X/mo" pill in the header — the card is
//     meant to drive conversion, not just inform. Body: 2-row blurb
//     + Get Growth+ CTA.
export default function GrowthPlusOverviewCard({ user }) {
  const subscribed = !!user?.growthPlusSubscribed
  return subscribed ? <SubscribedCard user={user} /> : <UpsellCard />
}

// --- Subscribed state ---

function SubscribedCard({ user }) {
  const insights =
    mockGrowthPlusInsights[user.growthPlusTier] ?? mockGrowthPlusInsights.pro
  const tier = mockGrowthPlusTierById[user.growthPlusTier] ?? null

  const stats = [
    { label: 'Boosts this month', value: formatCount(insights.algorithmicBoost) },
    { label: 'Followers from G+', value: `+${formatCount(insights.totalFollowersGained)}` },
    { label: 'Reach added', value: formatCount(insights.totalReachAdded) },
  ]

  return (
    <section className="flex flex-col rounded-xl border border-border bg-surface p-4 pb-3 lg:p-6">
      <div className="-mx-4 -mt-4 mb-4 rounded-t-xl border-b border-border bg-bg/50 px-4 py-4 lg:-mx-6 lg:-mt-6 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <CardChip color="purple" icon={Sparkles} />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-text-primary">
                Growth+
              </h2>
              {tier && (
                <span className="inline-flex items-center rounded-full bg-purple-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-purple-text">
                  {tier.name}
                </span>
              )}
            </div>
          </div>

          <Link
            to="/growth-plus"
            className="inline-flex items-center gap-1 text-sm font-medium text-purple-text transition-opacity hover:opacity-80"
          >
            View details
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3">
        {stats.map((s, i, arr) => (
          <div
            key={s.label}
            className={[
              'min-w-0 py-2 sm:px-4 sm:py-0',
              i > 0 ? 'border-t border-border pt-3' : '',
              i > 0 ? 'sm:border-l sm:border-border sm:border-t-0 sm:pt-0' : '',
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
    </section>
  )
}

// --- Upsell state ---

// Minimum monthly price across the tier catalog. Surfaced as a
// "from $X/mo" pill so the upsell card has a clear price anchor
// without committing to a specific tier.
const MIN_GROWTH_PLUS_PRICE = Math.min(
  ...mockGrowthPlusTiers.map((t) => t.price),
)

function UpsellCard() {
  return (
    <section className="flex flex-col rounded-xl border border-purple-base/20 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 p-4 pb-3 lg:p-6">
      {/* Purple-banded header — mirrors the audit card's banded-top
          structure so heights match, but stays in the upsell's
          brand color. Hosts the chip + title + "from $X/mo" pill. */}
      <div className="-mx-4 -mt-4 mb-4 rounded-t-xl border-b border-purple-base/20 bg-purple-base/15 px-4 py-4 lg:-mx-6 lg:-mt-6 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <CardChip color="purple" icon={Sparkles} />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-text-primary">
                Growth+
              </h2>
              <span className="inline-flex items-center rounded-full bg-purple-base px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                from ${MIN_GROWTH_PLUS_PRICE}/mo
              </span>
            </div>
          </div>
        </div>
      </div>

      <p className="line-clamp-2 min-h-[2lh] text-sm leading-relaxed text-text-secondary">
        Algorithmic boosts that amplify your reach and accelerate
        follower growth on top of your plan.
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
    </section>
  )
}
