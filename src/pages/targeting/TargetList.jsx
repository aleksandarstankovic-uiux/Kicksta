import { useMemo } from 'react'
import { Check, Minus } from 'lucide-react'
import TargetRow from './TargetRow'
import BulkActionBar from './BulkActionBar'
import {
  useTargetsStore,
  filterTargets,
  sortTargets,
} from '@/stores/useTargetsStore'
import { useToasts } from '@/stores/useToasts'

export default function TargetList({ onOpen, onBulkRemove, onBulkRestore }) {
  const targets = useTargetsStore((s) => s.targets)
  const filter = useTargetsStore((s) => s.filter)
  const sort = useTargetsStore((s) => s.sort)
  const selectionMode = useTargetsStore((s) => s.selectionMode)
  const selection = useTargetsStore((s) => s.selection)
  const exitSelection = useTargetsStore((s) => s.exitSelection)
  const selectAllVisible = useTargetsStore((s) => s.selectAllVisible)
  const clearSelection = useTargetsStore((s) => s.clearSelection)
  const pauseTarget = useTargetsStore((s) => s.pauseTarget)

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

  // --- Selection helpers ---
  const visibleIds = useMemo(() => visible.map((t) => t.id), [visible])
  const selectedCount = selection.size
  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selection.has(id))
  const someVisibleSelected =
    !allVisibleSelected && visibleIds.some((id) => selection.has(id))

  const onToggleAll = () => {
    if (allVisibleSelected) clearSelection()
    else selectAllVisible(visibleIds)
  }

  // Pause is enabled when at least one selected row is pausable
  // (status active or queued). Already-paused, depleted, archived
  // rows wouldn't change.
  const selectedTargets = useMemo(
    () => visible.filter((t) => selection.has(t.id)),
    [visible, selection],
  )
  const pauseDisabled = !selectedTargets.some(
    (t) => t.status === 'active' || t.status === 'queued',
  )

  const handlePause = () => {
    const pausable = selectedTargets.filter(
      (t) => t.status === 'active' || t.status === 'queued',
    )
    pausable.forEach((t) => pauseTarget(t.id))
    const message =
      pausable.length === 1
        ? `${pausable[0].value} paused`
        : `${pausable.length} targets paused`
    useToasts.getState().addToast({ message, tone: 'success' })
    exitSelection()
  }

  return (
    <>
      {/* BulkActionBar lives OUTSIDE the section so its `sticky top-0`
          can actually stick — the section card has `overflow-hidden`
          for row-clipping, which would create a scroll container that
          breaks position:sticky. */}
      {selectionMode && (
        <BulkActionBar
          count={selectedCount}
          bucket={filter}
          onExit={exitSelection}
          onPause={handlePause}
          onRemove={() => onBulkRemove(selectedTargets)}
          onRestore={() => onBulkRestore(selectedTargets)}
          pauseDisabled={pauseDisabled}
        />
      )}

      <section className="mt-4 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="flex items-center justify-between px-4 pt-4 pb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        <div className="flex items-center gap-3">
          {selectionMode && (
            <button
              type="button"
              role="checkbox"
              aria-checked={allVisibleSelected ? true : someVisibleSelected ? 'mixed' : false}
              aria-label={allVisibleSelected ? 'Clear selection' : 'Select all visible'}
              onClick={onToggleAll}
              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                allVisibleSelected || someVisibleSelected
                  ? 'border-blue-base bg-blue-base text-white'
                  : 'border-border bg-surface'
              }`}
            >
              {allVisibleSelected && <Check className="h-3.5 w-3.5" />}
              {someVisibleSelected && <Minus className="h-3.5 w-3.5" />}
            </button>
          )}
          <span>Name</span>
        </div>
        <span className="pr-9">Follow-backs</span>
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
    </>
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
  active: 'No active targets — add one to start growing.',
  archived: 'Nothing in archive yet.',
}

function EmptyForFilter({ filter }) {
  const copy = FILTER_EMPTY_COPY[filter] || 'Nothing to show.'
  return (
    <div className="px-4 py-8 text-center text-sm text-text-muted">{copy}</div>
  )
}
