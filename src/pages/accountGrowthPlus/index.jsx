import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Check, Lock } from 'lucide-react'
import SwitchTierConfirmModal from '@/components/SwitchTierConfirmModal'
import { mockGrowthPlusTiers } from '@/mocks/growth'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'

// Tier-change page. Replaces the "coming soon" stub. Shows three tier
// cards; the current tier is marked "Current plan" with a disabled
// button. Other tiers expose "Switch to {tier.name}" CTAs that open a
// proration confirm modal. Route guard: if status !== 'active',
// redirect to /growth-plus (cancelled_pending users must Resume first;
// lapsed users see Upsell).
export default function AccountGrowthPlusPage() {
  const navigate = useNavigate()
  const currentTierId = useGrowthConfig(
    (s) => s.config.growthPlusControls.tier,
  )
  const status = useGrowthPlusSubscription((s) => s.status)
  const [pendingTierId, setPendingTierId] = useState(null)

  useEffect(() => {
    if (status !== 'active') {
      navigate('/growth-plus', { replace: true })
    }
  }, [status, navigate])

  if (status !== 'active') return null

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <button
        type="button"
        onClick={() => navigate('/growth-plus')}
        className="inline-flex items-center gap-1 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to Growth+
      </button>

      <header className="mt-3">
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Manage your Growth+ subscription
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Change tier anytime. Proration handled automatically.
        </p>
      </header>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {mockGrowthPlusTiers.map((tier) => (
          <TierCard
            key={tier.id}
            tier={tier}
            isCurrent={tier.id === currentTierId}
            onSwitch={() => setPendingTierId(tier.id)}
          />
        ))}
      </section>

      <p className="mt-6 text-xs text-text-muted">
        Switching tiers takes effect immediately. Your next renewal stays
        on the same day.
      </p>

      <SwitchTierConfirmModal
        targetTierId={pendingTierId}
        onClose={() => setPendingTierId(null)}
      />
    </div>
  )
}

function TierCard({ tier, isCurrent, onSwitch }) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-5 shadow-sm md:p-6 ${
        isCurrent
          ? 'border-purple-base bg-gradient-to-br from-purple-tint/40 via-surface to-surface shadow-md'
          : 'border-border bg-surface'
      }`}
    >
      {isCurrent && (
        <span className="absolute -top-2.5 left-5 inline-flex items-center rounded-full bg-green-tint px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
          Current plan
        </span>
      )}

      <h3 className="text-lg font-semibold text-text-primary">{tier.name}</h3>
      <p className="mt-1 text-xs text-text-secondary">{tier.tagline}</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-text-primary">
          ${tier.price}
        </span>
        <span className="text-sm text-text-secondary">/mo</span>
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-text-primary">
        <FeatureRow
          included
          text={`Up to +${tier.monthlyBoosts} extra followers/mo`}
        />
        <FeatureRow
          included
          text={`${tier.boostedPosts} boosted posts/mo`}
        />
        <FeatureRow
          included
          text={`+${Math.round(tier.reachLift * 100)}% post reach lift`}
        />
        <FeatureRow
          included={tier.allowedSpeed.includes('fast')}
          text="Fast speed mode"
        />
        <FeatureRow
          included={tier.allowedQuality.includes('targeted')}
          text="Targeted quality"
        />
        <FeatureRow
          included={tier.allowedQuality.includes('top')}
          text="Engaged-quality targeting"
        />
      </ul>

      <button
        type="button"
        onClick={onSwitch}
        disabled={isCurrent}
        className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg text-base font-semibold transition-opacity ${
          isCurrent
            ? 'cursor-not-allowed border border-border bg-bg text-text-muted'
            : 'bg-purple-base text-white hover:opacity-90'
        }`}
      >
        {isCurrent ? 'Current plan' : `Switch to ${tier.name}`}
      </button>
    </div>
  )
}

function FeatureRow({ included, text }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {included ? (
        <Check
          className="mt-0.5 h-4 w-4 shrink-0 text-purple-base"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      ) : (
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
      )}
      <span className={included ? 'text-text-primary' : 'text-text-muted'}>
        {text}
      </span>
    </li>
  )
}
