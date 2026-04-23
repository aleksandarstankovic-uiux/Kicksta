import { Crosshair, Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockUser } from '@/mocks/user'

// Hero card for the Targets page — introduces what targets are, shows
// the plan slot limit, hosts the sole "+ Add target" CTA. No progress
// bar in v3; the N/maxSlots readout is enough and the card is cleaner
// without it.
export default function TargetsHeroCard({ onAddTarget }) {
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = mockUser.plan === 'advanced' ? 30 : 10
  const totalCount = targets.length

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6 lg:p-6">
        {/* Left: icon + headline + explanation */}
        <div className="flex flex-1 items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-tint text-blue-text">
            <Crosshair className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold leading-tight text-text-primary">
              Targets
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Accounts and hashtags Kicksta follows to grow your audience. Each
              one feeds new followers into your growth queue.
            </p>
          </div>
        </div>

        {/* Right: slot readout + CTA */}
        <div className="flex items-center gap-4 lg:shrink-0 lg:flex-col lg:items-end lg:gap-3">
          <div className="flex flex-1 flex-col items-start lg:items-end">
            <span className="text-2xl font-semibold leading-none tabular-nums text-text-primary">
              {totalCount} / {maxSlots}
            </span>
            <span className="mt-1 text-xs uppercase tracking-wide text-text-muted">
              Slots used
            </span>
          </div>

          <button
            type="button"
            onClick={onAddTarget}
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-base px-5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add target
          </button>
        </div>
      </div>
    </section>
  )
}
