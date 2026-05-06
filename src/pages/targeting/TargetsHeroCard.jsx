import { Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockUser } from '@/mocks/user'

// Hero toolbar at the top of the Targets tab. Visualizes plan
// utilization with a progress bar so the user can see at a glance
// how much capacity they have left, and surfaces the primary
// "Add target" action.
//
// Visual accent: 4px `border-l-blue-base` left bar marks this card
// as the page's focal point. Title "Audience sources" deliberately
// avoids "Targets" — that word is already in the active tab.
//
// Mobile: title + progress stack above a full-width Add CTA.
// Desktop: title + progress on the left, CTA pinned right.
export default function TargetsHeroCard({ onAddTarget }) {
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = mockUser.plan === 'advanced' ? 30 : 10
  const totalCount = targets.length
  const fillPct = maxSlots ? Math.min(100, (totalCount / maxSlots) * 100) : 0

  return (
    <section className="rounded-xl border border-border border-l-4 border-l-blue-base bg-surface px-5 py-4 lg:px-6 lg:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-semibold text-text-primary">
            Audience sources
          </h2>
          <div className="mt-2 flex items-center gap-3">
            <div
              role="progressbar"
              aria-valuenow={totalCount}
              aria-valuemin={0}
              aria-valuemax={maxSlots}
              aria-label={`${totalCount} of ${maxSlots} sources used`}
              className="h-2 flex-1 overflow-hidden rounded-full bg-bg"
            >
              <div
                className="h-full rounded-full bg-blue-base transition-[width] duration-300"
                style={{ width: `${fillPct}%` }}
              />
            </div>
            <span className="shrink-0 text-xs tabular-nums text-text-secondary">
              {totalCount} of {maxSlots} used
            </span>
          </div>
        </div>
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
