import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpDown, Check, ChevronDown } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'queued', label: 'Queued' },
  { value: 'paused', label: 'Paused' },
  { value: 'depleted', label: 'Depleted' },
]

const SORTS = [
  { value: 'priority', label: 'Priority' },
  { value: 'followBacks', label: 'Follow-backs' },
  { value: 'recent', label: 'Most recent' },
  { value: 'alpha', label: 'A–Z' },
]

export default function FilterRow() {
  const { filter, sort, setFilter, setSort, targets } = useTargetsStore()

  const counts = useMemo(() => {
    const base = { all: targets.length, active: 0, queued: 0, paused: 0, depleted: 0 }
    for (const t of targets) {
      if (base[t.status] !== undefined) base[t.status] += 1
    }
    return base
  }, [targets])

  return (
    <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
      {/* Pills wrap on mobile, single-row on lg:+. */}
      <div className="flex flex-1 flex-wrap gap-2">
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
      </div>

      <div className="flex justify-end lg:shrink-0">
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
        className="inline-flex h-9 items-center gap-1.5 rounded-full bg-bg px-3 text-xs font-medium text-text-secondary hover:text-text-primary"
      >
        <ArrowUpDown className="h-4 w-4 lg:hidden" aria-hidden="true" />
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
