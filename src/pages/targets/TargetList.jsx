import { useMemo } from 'react'
import TargetRow from './TargetRow'
import {
  useTargetsStore,
  filterTargets,
  sortTargets,
} from '@/stores/useTargetsStore'

// Lays out the list container and delegates each row to TargetRow.
// Owns three responsibilities: column header, empty-state variants,
// and identifying the "top performer" to star.
export default function TargetList({ onOpenMenu }) {
  const targets = useTargetsStore((s) => s.targets)
  const filter = useTargetsStore((s) => s.filter)
  const sort = useTargetsStore((s) => s.sort)

  const visible = useMemo(() => {
    return sortTargets(filterTargets(targets, filter), sort)
  }, [targets, filter, sort])

  // Top performer = highest follow-back count among active targets.
  // Independent of filter/sort so the star always reflects the real
  // best-performing row, not just the top of the currently-sorted view.
  const topTargetId = useMemo(() => {
    const actives = targets.filter((t) => t.status === 'active')
    if (actives.length === 0) return null
    return actives.reduce((best, t) =>
      t.followBackCount > best.followBackCount ? t : best
    ).id
  }, [targets])

  const hasAnyTarget = targets.length > 0

  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
      {/* Column header sits inside the card, aligns with row padding. */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        <span>Name</span>
        <span>Follow-backs</span>
      </div>

      {!hasAnyTarget && <EmptyNoTargets />}
      {hasAnyTarget && visible.length === 0 && <EmptyForFilter filter={filter} />}

      {hasAnyTarget && visible.length > 0 && (
        <div className="flex flex-col">
          {visible.map((t, i) => (
            <TargetRow
              key={t.id}
              target={t}
              isFirst={i === 0}
              isTop={t.id === topTargetId}
              onOpenMenu={onOpenMenu}
            />
          ))}
        </div>
      )}
    </section>
  )
}

// Zero-total state. No CTA here — the sole "+ Add target" button lives
// in the SlotsCard above.
function EmptyNoTargets() {
  return (
    <div className="px-4 py-16 text-center">
      <h3 className="text-lg font-semibold text-text-primary">
        No targets yet
      </h3>
      <p className="mt-1 text-sm text-text-secondary">
        Add an account or hashtag to start growing.
      </p>
    </div>
  )
}

const FILTER_EMPTY_COPY = {
  active: 'No active targets.',
  queued: 'No queued targets.',
  paused: 'No paused targets.',
  depleted: 'No depleted targets.',
}

function EmptyForFilter({ filter }) {
  const copy = FILTER_EMPTY_COPY[filter] || 'Nothing to show.'
  return (
    <div className="px-4 py-8 text-center text-sm text-text-muted">
      {copy}
    </div>
  )
}
