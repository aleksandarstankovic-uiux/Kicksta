import { Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockUser } from '@/mocks/user'

// Slim toolbar at the top of the Targets tab. Carries only what's
// unique to this view — the slot count and the Add CTA. The page H1
// + active tab already establish "you're on Targets" so a chip,
// title word, and subtitle would all be restating the same thing.
//
// Mobile: count and CTA stack with the CTA full-width below.
// Desktop: count left, CTA pinned right.
export default function TargetsHeroCard({ onAddTarget }) {
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = mockUser.plan === 'advanced' ? 30 : 10
  const totalCount = targets.length

  return (
    <section className="rounded-xl border border-border bg-surface px-4 py-3 lg:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="flex items-center gap-2 text-sm text-text-secondary">
          <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-semibold tabular-nums text-text-primary">
            {totalCount}/{maxSlots}
          </span>
          targets used
        </p>
        <button
          type="button"
          onClick={onAddTarget}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-base px-5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add target
        </button>
      </div>
    </section>
  )
}
