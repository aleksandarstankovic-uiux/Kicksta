import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { mockGrowthPlusInsights } from '@/mocks/growth'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

// Shared Growth+ marketing banner. Used by both Overview and Growth.
//
// Non-subscriber: gradient surface + Sparkles chip + headline + benefit
// list + "Add Growth+" CTA → /signup/growth-plus.
//
// Subscriber: same surface + "Active" pill + real-numbers headline +
// "Manage subscription" text link → /account/growth-plus. No primary CTA.
export default function GrowthPlusBanner({ isSubscribed }) {
  const tierId = useGrowthConfig((s) => s.config.growthPlusControls.tier)
  const ins = mockGrowthPlusInsights[tierId] ?? mockGrowthPlusInsights.pro

  const headline = isSubscribed
    ? `Growth+ added +${ins.algorithmicBoost} extra followers this month`
    : 'Add Growth+ for extra algorithmic reach'

  const benefits = isSubscribed
    ? [
        `+${ins.algorithmicBoost} from boosted posts`,
        `+${Math.round(ins.postReachLift * 100)}% post reach`,
        `${(ins.engagementRate * 100).toFixed(1)}% engagement rate`,
      ]
    : [
        'Algorithmic post boosting',
        '+34% more reach per post',
        '~3× engagement rate',
      ]

  return (
    <div className="rounded-xl border border-purple-base/20 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 shadow-sm">
      {/* Mobile layout */}
      <div className="flex flex-col gap-2.5 p-4 lg:hidden">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-text text-surface shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-text">
            Growth+
          </span>
          {isSubscribed && (
            <span className="rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
              Active
            </span>
          )}
        </div>

        <h2 className="text-base font-semibold leading-snug text-text-primary">
          {headline}
        </h2>

        <p className="text-xs leading-relaxed text-text-secondary">
          {benefits.join(' · ')}
        </p>

        {!isSubscribed && (
          <Link
            to="/signup/growth-plus"
            className="mt-1 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-purple-base px-6 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Add Growth+
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        {isSubscribed && (
          <Link
            to="/account/growth-plus"
            className="mt-1 inline-flex items-center text-xs font-medium text-purple-text hover:underline"
          >
            Manage subscription
          </Link>
        )}
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex lg:items-center lg:gap-5 lg:p-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-text text-surface shadow-sm"
          >
            <Sparkles className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-text">
                Growth+
              </span>
              {isSubscribed && (
                <span className="rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
                  Active
                </span>
              )}
            </div>
            <h2 className="mt-0.5 text-base font-semibold leading-snug text-text-primary">
              {headline}
            </h2>
            <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">
              {benefits.join(' · ')}
            </p>
          </div>
        </div>

        {!isSubscribed && (
          <Link
            to="/signup/growth-plus"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-purple-base px-5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Add Growth+
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        {isSubscribed && (
          <Link
            to="/account/growth-plus"
            className="shrink-0 text-sm font-medium text-purple-text hover:underline"
          >
            Manage subscription
          </Link>
        )}
      </div>
    </div>
  )
}
