import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { mockUser } from '@/mocks/user'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import SettingSwitch from '@/components/SettingSwitch'

export default function GrowthPlusCard() {
  const subscribed = mockUser.growthPlusSubscribed === true
  const active = useGrowthConfig((s) => s.config.growthPlusActive)
  const togglePlusActive = useGrowthConfig((s) => s.toggleGrowthPlusActive)

  if (!subscribed) {
    return (
      <section className="mt-4 overflow-hidden rounded-xl border border-purple-base/20 bg-purple-tint/30 px-5 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-base/15 text-purple-text">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-text">
              Growth+
            </p>
            <p className="mt-0.5 text-sm font-semibold text-text-primary">
              Algorithmic reach, on autopilot.
            </p>
            <p className="mt-0.5 text-xs text-text-muted">
              Separate from Targeted Growth. Cancel any time.
            </p>
          </div>
          <Link
            to="/signup/growth-plus"
            className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-purple-base px-4 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 lg:w-auto"
          >
            Add Growth+
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-purple-base/20 bg-purple-tint/30 px-5 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-base/15 text-purple-text">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-text">
                Growth+
              </p>
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
            <p className="mt-0.5 text-sm text-text-primary">
              {active
                ? 'Boosting your posts algorithmically.'
                : 'Paused — resume any time.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SettingSwitch
            title="Growth+ active"
            checked={active}
            onChange={() => togglePlusActive()}
          />
          <Link
            to="/account"
            className="text-xs text-text-secondary hover:text-text-primary hover:underline"
          >
            Manage subscription
          </Link>
        </div>
      </div>
    </section>
  )
}
