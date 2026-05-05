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
    <section className="overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center lg:gap-6 lg:p-5">
        {/* Left: chip + headline (inline with slot count) on one
            row, subtitle below. Chip vertically aligns with the
            title text — no offset against a stacked H2. */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-tint text-blue-text">
              <Crosshair className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="flex min-w-0 items-baseline gap-2 text-lg font-semibold leading-tight text-text-primary">
              Targets
              <span className="text-sm font-normal text-text-muted">
                {totalCount}/{maxSlots}
              </span>
            </h2>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-text-secondary">
            Accounts and hashtags Kicksta follows to grow your audience.
          </p>
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
