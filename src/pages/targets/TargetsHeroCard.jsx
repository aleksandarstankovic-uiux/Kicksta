import { Crosshair, Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockUser } from '@/mocks/user'

// Hero card for the Targets page. v3.2: tighter copy + smaller
// inline slot count so the card doesn't dominate the page visually.
export default function TargetsHeroCard({ onAddTarget }) {
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = mockUser.plan === 'advanced' ? 30 : 10
  const totalCount = targets.length

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:gap-6 lg:p-5">
        {/* Left: icon + headline (with inline slot count) + explanation */}
        <div className="flex flex-1 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-tint text-blue-text">
            <Crosshair className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="flex items-baseline gap-2 text-lg font-semibold leading-tight text-text-primary">
              Targets
              <span className="text-sm font-normal text-text-muted">
                {totalCount}/{maxSlots}
              </span>
            </h2>
            <p className="mt-1 text-xs leading-relaxed text-text-secondary">
              Accounts and hashtags Kicksta follows to grow your audience.
            </p>
          </div>
        </div>

        {/* Right: CTA only */}
        <button
          type="button"
          onClick={onAddTarget}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-base px-5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 lg:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add target
        </button>
      </div>
    </section>
  )
}
