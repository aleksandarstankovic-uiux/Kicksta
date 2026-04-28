import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { formatCount } from '@/utils/formatCount'
import { estimateAudienceReach } from './audienceReach'

// Settings-derived audience reach indicator. Renders at the bottom of
// the FiltersCard. Updates automatically when any filter dial changes.
export default function AudienceReachEstimate() {
  const filters = useGrowthConfig((s) => s.config.filters)
  const { count, pct, hint } = estimateAudienceReach(filters)

  return (
    <div className="mt-4 rounded-lg bg-bg p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Estimated audience
      </p>
      <p className="mt-1 text-sm font-medium text-text-primary">
        ~{formatCount(count)} accounts match your filters
      </p>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-blue-base transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-2 text-xs text-text-muted">{hint}</p>
    </div>
  )
}
