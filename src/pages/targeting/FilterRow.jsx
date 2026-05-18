import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpDown, Check, ChevronDown, ListChecks } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'

// Two buckets total: Active (anything still in rotation —
// active / queued / paused / depleted) and Archived (soft-
// deleted via removeTarget, restorable). Active is the default
// landing view.
const FILTERS = [
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
]

const SORTS = [
  { value: 'priority', label: 'Priority' },
  { value: 'followBacks', label: 'Follow-backs' },
  { value: 'recent', label: 'Most recent' },
  { value: 'alpha', label: 'A–Z' },
]

export default function FilterRow() {
  const {
    filter,
    sort,
    setFilter,
    setSort,
    targets,
    selectionMode,
    enterSelection,
  } = useTargetsStore()

  // Counts mirror the bucket semantics in `filterTargets`: active =
  // everything except archived; archived = status === 'archived'.
  const counts = useMemo(() => {
    let active = 0
    let archived = 0
    for (const t of targets) {
      if (t.status === 'archived') archived += 1
      else active += 1
    }
    return { active, archived }
  }, [targets])

  // Selection mode owns the row entirely — BulkActionBar renders
  // in this slot. Returning null avoids any flicker from a half-
  // rendered FilterRow during the swap.
  if (selectionMode) return null

  // Hide the Select trigger when the current bucket is empty —
  // nothing to select.
  const canSelect = counts[filter] > 0

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2 lg:flex-nowrap lg:gap-3">
      {FILTERS.map((f) => {
        const selected = filter === f.value
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              selected
                ? 'bg-surface text-text-primary shadow-sm ring-1 ring-border'
                : 'bg-bg text-text-secondary hover:text-text-primary'
            }`}
          >
            <span>{f.label}</span>
            <span className="tabular-nums text-[11px] text-text-muted">
              {counts[f.value]}
            </span>
          </button>
        )
      })}

      {/* Sort sits inline with the filter pills. On mobile it wraps
          naturally as the last item in the flex-wrap container. On
          desktop it gets pushed to the right via ml-auto. */}
      <div className="flex items-center gap-2 lg:ml-auto">
        {canSelect && (
          <button
            type="button"
            onClick={enterSelection}
            aria-label="Select targets"
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-bg px-3 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Select</span>
          </button>
        )}
        <SortDropdown value={sort} onChange={setSort} />
      </div>
    </div>
  )
}

function SortDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const current = SORTS.find((s) => s.value === value) ?? SORTS[0]

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Sort targets"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-bg px-3 text-xs font-medium text-text-secondary hover:text-text-primary"
      >
        <ArrowUpDown className="h-3.5 w-3.5 lg:hidden" aria-hidden="true" />
        <span className="hidden lg:inline">Sort: {current.label}</span>
        <ChevronDown className="hidden h-3.5 w-3.5 lg:inline" aria-hidden="true" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-surface shadow-md"
        >
          {SORTS.map((s) => {
            const selected = s.value === value
            return (
              <button
                key={s.value}
                type="button"
                role="menuitem"
                onClick={() => {
                  onChange(s.value)
                  setOpen(false)
                }}
                className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm text-text-primary hover:bg-bg"
              >
                <span>{s.label}</span>
                {selected && <Check className="h-4 w-4 text-blue-text" aria-hidden="true" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
