import { SlidersHorizontal } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { summarizeFilters } from './filterSummary'

// v3: Filters is now a single summary row with a Customize button.
// The full dial UI lives in FiltersDrawer (opened from the page shell).
export default function FiltersCard({ onCustomize }) {
  const filters = useGrowthConfig((s) => s.config.filters)
  const summary = summarizeFilters(filters)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Filters</h2>
      <p className="mt-1 text-sm text-text-secondary">Who Kicksta targets.</p>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <p className="min-w-0 truncate text-sm text-text-primary">{summary}</p>
        <button
          type="button"
          onClick={onCustomize}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Customize
        </button>
      </div>
    </section>
  )
}
