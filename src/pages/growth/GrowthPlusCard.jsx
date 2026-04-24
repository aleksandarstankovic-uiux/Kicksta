import { Link } from 'react-router-dom'
import { Lock, Sparkles } from 'lucide-react'
import { mockUser } from '@/mocks/user'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import SettingSwitch from '@/components/SettingSwitch'

// Growth+ is a separate paid add-on. Two variants:
//  - Non-subscriber: upsell card with CTA to /signup/growth-plus.
//  - Subscriber: active card with pause toggle + manage link.
//
// Per PRODUCT.md, Growth+ is visually separate from Targeted Growth —
// different bg tint and a clear identity.
export default function GrowthPlusCard() {
  const subscribed = mockUser.growthPlusSubscribed === true
  const active = useGrowthConfig((s) => s.config.growthPlusActive)
  const togglePlusActive = useGrowthConfig((s) => s.toggleGrowthPlusActive)

  if (!subscribed) {
    return (
      <section className="mt-4 rounded-xl border border-border bg-bg p-4 lg:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-tint text-purple-text">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-text-primary">Growth+</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Algorithmic reach, separate subscription.
            </p>
            <p className="mt-3 text-sm text-text-secondary">
              Add Growth+ for extra algorithmic reach. Our network of accounts
              boosts your posts — separate billing, cancel any time.
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
              <p className="text-xs text-text-muted">
                Growth+ followers are marked separately from Targeted Growth.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Link
            to="/signup/growth-plus"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-purple-base px-5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Add Growth+
          </Link>
        </div>
      </section>
    )
  }

  // Subscriber variant
  return (
    <section className="mt-4 rounded-xl border border-border bg-bg p-4 lg:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-tint text-purple-text">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">Growth+</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                active
                  ? 'bg-green-tint text-green-text'
                  : 'bg-bg text-text-secondary'
              }`}
            >
              {active ? 'Active' : 'Paused'}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {active
              ? 'Boosting your posts algorithmically.'
              : 'Paused — resume any time.'}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <SettingSwitch
          title="Growth+ active"
          description="Toggle to pause the algorithmic boost without cancelling."
          checked={active}
          onChange={() => togglePlusActive()}
        />
      </div>

      <div className="mt-3">
        <Link
          to="/account"
          className="text-xs text-text-secondary hover:text-text-primary hover:underline"
        >
          Manage subscription
        </Link>
      </div>
    </section>
  )
}
