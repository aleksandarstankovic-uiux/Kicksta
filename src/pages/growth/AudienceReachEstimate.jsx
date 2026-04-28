import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { formatCount } from '@/utils/formatCount'
import { estimateAudienceReach } from './audienceReach'

// Health pill — color-coded label that replaces the v7 progress bar.
// Tone is `green` for the sweet-spot ("Healthy reach") and `yellow`
// for both extremes (Very tight / Tight focus / Wide reach).
function HealthPill({ tone, children }) {
  const cls =
    tone === 'green'
      ? 'bg-green-tint text-green-text'
      : 'bg-yellow-tint text-yellow-text'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  )
}

// Settings-derived audience reach indicator. Renders at the bottom of
// the FiltersCard. Updates automatically when any filter dial changes.
export default function AudienceReachEstimate() {
  const filters = useGrowthConfig((s) => s.config.filters)
  const { count, health, tone } = estimateAudienceReach(filters)

  return (
    <div className="mt-4 rounded-lg bg-bg p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Estimated audience
      </p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text-primary">
          ~{formatCount(count)} accounts match your filters
        </p>
        <HealthPill tone={tone}>{health}</HealthPill>
      </div>
    </div>
  )
}
