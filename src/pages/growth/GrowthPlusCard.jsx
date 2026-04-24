import { Link } from 'react-router-dom'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { mockUser } from '@/mocks/user'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import SettingSwitch from '@/components/SettingSwitch'

const BENEFITS = [
  'Algorithmic boost from partner accounts',
  'Separate from Targeted Growth metrics',
  'Cancel any time',
]

export default function GrowthPlusCard() {
  const subscribed = mockUser.growthPlusSubscribed === true
  const active = useGrowthConfig((s) => s.config.growthPlusActive)
  const togglePlusActive = useGrowthConfig((s) => s.toggleGrowthPlusActive)

  if (!subscribed) {
    return (
      <section className="mt-4 overflow-hidden rounded-xl border border-purple-base/20 bg-purple-tint/30 p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          <div className="min-w-0 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-base/15 text-purple-text">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-text">
              Growth+
            </p>
            <h2 className="mt-1 text-xl font-semibold leading-tight text-text-primary lg:text-2xl">
              Algorithmic reach, on autopilot.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
              Our network of Kicksta accounts boosts your posts — more eyes,
              faster momentum. Separate billing.
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-text-primary">
                  <Check className="h-4 w-4 shrink-0 text-purple-text" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div className="shrink-0">
            <Link
              to="/signup/growth-plus"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-purple-base px-5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 lg:w-auto"
            >
              Add Growth+
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-purple-base/20 bg-purple-tint/30 p-5 lg:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
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
