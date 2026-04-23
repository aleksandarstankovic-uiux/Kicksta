import { Lock, Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockUser } from '@/mocks/user'

// The single CTA host for the page. Shows total slots used (all statuses
// count, since depleted/paused rows still occupy a slot until removed),
// a progress bar, a calm trust one-liner, and the one `+ Add target`
// button that opens the sheet.
//
// V1 scope: happy-path only. At-cap state (button swap / disable / bar
// color change) is deferred to the later edge-state spec.
export default function SlotsCard({ onAddTarget }) {
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = mockUser.plan === 'advanced' ? 30 : 10
  const totalCount = targets.length
  const pct = Math.min(100, (totalCount / maxSlots) * 100)

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface p-4 lg:p-6">
      <div className="flex items-center justify-between">
        <span className="text-sm text-text-secondary">Target slots</span>
        <span className="text-sm font-semibold tabular-nums text-text-primary">
          {totalCount} / {maxSlots}
        </span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg">
        <div
          className="h-full rounded-full bg-green-base transition-[width] duration-300"
          style={{ width: `${pct}%` }}
          aria-hidden="true"
        />
      </div>

      <div className="mt-3 flex items-center gap-1.5">
        <Lock className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
        <span className="text-xs text-text-muted">
          Kicksta follows within Instagram's safe daily limits.
        </span>
      </div>

      <div className="mt-4 lg:flex lg:justify-end">
        <button
          type="button"
          onClick={onAddTarget}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 lg:w-auto"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add target
        </button>
      </div>
    </section>
  )
}
