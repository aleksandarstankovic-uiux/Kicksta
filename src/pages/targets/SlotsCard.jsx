import { Lock, Plus } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { mockUser } from '@/mocks/user'

// Single CTA host. Desktop: title + count + button share the top row.
// Mobile: stacked — count row, progress bar, trust line, full-width
// button.
export default function SlotsCard({ onAddTarget }) {
  const targets = useTargetsStore((s) => s.targets)
  const maxSlots = mockUser.plan === 'advanced' ? 30 : 10
  const totalCount = targets.length
  const pct = Math.min(100, (totalCount / maxSlots) * 100)

  return (
    <section className="mt-6 rounded-xl border border-border bg-surface p-4 lg:p-6">
      {/* Desktop: inline row. Mobile: count left, button below. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-4">
        <div className="flex flex-1 items-center justify-between">
          <span className="text-sm text-text-secondary">Target slots</span>
          <span className="text-sm font-semibold tabular-nums text-text-primary">
            {totalCount} / {maxSlots}
          </span>
        </div>

        <button
          type="button"
          onClick={onAddTarget}
          className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 lg:w-auto lg:shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add target
        </button>
      </div>

      <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-bg">
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
    </section>
  )
}
