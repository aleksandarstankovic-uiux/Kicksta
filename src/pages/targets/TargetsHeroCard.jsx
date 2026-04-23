import { Crosshair, Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockUser } from '@/mocks/user'

// Hero card for the Targets page. Introduces what targets are, shows
// the plan slot count inline with the headline, hosts the sole
// "+ Add target" CTA. v3.1: lighter hierarchy — smaller headline,
// slots fold into the title, single CTA on the right.
export default function TargetsHeroCard({ onAddTarget }) {
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = mockUser.plan === 'advanced' ? 30 : 10
  const totalCount = targets.length

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      <div className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:gap-6 lg:p-6">
        {/* Left: icon + headline (with inline slot count) + explanation */}
        <div className="flex flex-1 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-tint text-blue-text">
            <Crosshair className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-semibold leading-tight text-text-primary">
              Targets{' '}
              <span className="font-normal text-text-muted">
                ({totalCount}/{maxSlots})
              </span>
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Accounts and hashtags Kicksta follows to grow your audience. Each
              one feeds new followers into your growth queue.
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
