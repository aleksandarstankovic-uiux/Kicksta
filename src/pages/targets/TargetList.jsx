import { useMemo } from 'react'
import TargetRow from './TargetRow'
import {
  useTargetsStore,
  filterTargets,
  sortTargets,
} from '@/stores/useTargetsStore'

export default function TargetList({ onOpen }) {
  const targets = useTargetsStore((s) => s.targets)
  const filter = useTargetsStore((s) => s.filter)
  const sort = useTargetsStore((s) => s.sort)

  const visible = useMemo(() => {
    return sortTargets(filterTargets(targets, filter), sort)
  }, [targets, filter, sort])

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
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        <span>Name</span>
        <span>Follow-backs · %</span>
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
              onOpen={onOpen}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function EmptyNoTargets() {
  return (
    <div className="px-4 py-16 text-center">
      <h3 className="text-lg font-semibold text-text-primary">No targets yet</h3>
      <p className="mt-1 text-sm text-text-secondary">
        Add an account or hashtag for Kicksta to follow users from.
        Expect first results within 24–72 hours.
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
    <div className="px-4 py-8 text-center text-sm text-text-muted">{copy}</div>
  )
}
