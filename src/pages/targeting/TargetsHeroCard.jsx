import { Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { slotLimit } from '@/utils/targetSlots'

// Hero toolbar at the top of the Targets tab. Title + slot count
// share a row; subtitle explains what "sources" are; CTA pinned
// right.
//
// Visual accent: 4px `border-l-blue-base` left bar marks this card
// as the page's focal point. Title "Audience sources" deliberately
// avoids "Targets" — that word is already in the active tab.
//
// Mobile: title/count + subtitle stack above a full-width Add CTA.
// Desktop: title/count + subtitle on the left, CTA pinned right.
export default function TargetsHeroCard({ onAddTarget }) {
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = slotLimit()
  const totalCount = targets.length

  return (
    <section className="rounded-xl border border-border border-l-4 border-l-blue-base bg-surface px-5 py-4 lg:px-6 lg:py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">
              Audience sources
            </h2>
            <span
              aria-label={`${totalCount} of ${maxSlots} used`}
              className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-xs font-semibold tabular-nums text-text-secondary"
            >
              {totalCount}/{maxSlots}
            </span>
          </div>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            Accounts and hashtags Kicksta follows to grow your audience.
          </p>
        </div>
        <button
          type="button"
          onClick={onAddTarget}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-base px-5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add source
        </button>
      </div>
    </section>
  )
}
