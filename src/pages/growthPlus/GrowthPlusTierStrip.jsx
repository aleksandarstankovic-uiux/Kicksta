import { Link } from 'react-router-dom'
import { Crown } from 'lucide-react'
import { mockGrowthPlusTierById } from '@/mocks/growth'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

// Slim "current tier" strip between the metrics row and the activity
// feed. Identifies the active plan at-a-glance and gives users an
// always-visible path to the tier compare. Renders as a single line
// at all breakpoints — narrow vertical footprint by design.
export default function GrowthPlusTierStrip() {
  const tierId = useGrowthConfig((s) => s.config.growthPlusControls.tier)
  const tier = mockGrowthPlusTierById[tierId]
  if (!tier) return null

  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-3 shadow-sm md:px-5">
      <Crown className="h-4 w-4 shrink-0 text-purple-text" aria-hidden="true" />
      <p className="min-w-0 flex-1 truncate text-sm text-text-secondary">
        You're on{' '}
        <span className="font-semibold text-text-primary">{tier.name}</span>
        <span className="text-text-muted"> — {tier.tagline}</span>
      </p>
      <Link
        to="/growth-plus/upgrade"
        className="shrink-0 text-xs font-medium text-purple-text hover:underline"
      >
        Compare tiers
      </Link>
    </div>
  )
}
