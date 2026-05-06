import { Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockUser } from '@/mocks/user'

// Slim toolbar at the top of the Targets tab. Carries only what's
// unique to this view — section title, slot count, Add CTA. The
// page H1 + active tab already establish "you're on Targets" so a
// chip and the word "Targets" itself would just restate identity.
//
// Visual accent: a 4px `border-l-blue-base` left bar marks this
// card as the page's primary action zone. Subtle pixels, immediate
// "this is the focal point" reading. Same pattern docs and dashboards
// use to flag callouts.
//
// Title "Audience sources" deliberately avoids "Targets" — that word
// is already in the tab and would just repeat. Sources captures what
// these things ARE in product terms.
//
// Mobile: title/count stack above a full-width Add CTA.
// Desktop: title/count on the left, CTA pinned right.
export default function TargetsHeroCard({ onAddTarget }) {
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = mockUser.plan === 'advanced' ? 30 : 10
  const totalCount = targets.length

  return (
    <section className="rounded-xl border border-border border-l-4 border-l-blue-base bg-surface px-5 py-4 lg:px-6 lg:py-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary lg:text-lg">
            Audience sources
          </h2>
          <p className="mt-1 text-sm tabular-nums text-text-secondary">
            {totalCount} of {maxSlots} used
          </p>
        </div>
        <button
          type="button"
          onClick={onAddTarget}
          className="inline-flex h-12 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-base px-6 text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90 sm:w-auto"
        >
          <Plus className="h-5 w-5" aria-hidden="true" />
          Add target
        </button>
      </div>
    </section>
  )
}
