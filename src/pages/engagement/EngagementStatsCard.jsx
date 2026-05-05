import { BarChart3, Mail, MailOpen, Star } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { mockEngagementStats } from '@/mocks/engagementStats'

// Stats hero for /engagement. Three tiles inside one card; same
// chip + label + big number + delta vocabulary as the Overview
// metric cards. `current` and `delta` come from a static mock —
// when the engine wires up, this becomes a server-driven response.
const TILES = [
  { key: 'dmsSent', label: 'DMs sent', icon: Mail, deltaSuffix: 'vs last week' },
  { key: 'dmOpenRate', label: 'DM open rate', icon: MailOpen, deltaSuffix: 'pt vs last week', isPercent: true },
  { key: 'closeFriends', label: 'Close Friends', icon: Star, deltaSuffix: 'vs last week' },
]

export default function EngagementStatsCard() {
  const stats = mockEngagementStats
  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <CardChip color="blue" icon={BarChart3} />
        <h2 className="text-base font-semibold text-text-primary">This week</h2>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TILES.map((t) => {
          const value = stats[t.key]
          const Icon = t.icon
          const positive = value.delta >= 0
          return (
            <div
              key={t.key}
              className="flex flex-col gap-1 rounded-lg border border-border bg-bg/40 p-3"
            >
              <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {t.label}
              </div>
              <div className="text-2xl font-semibold tabular-nums text-text-primary">
                {t.isPercent ? `${value.current}%` : value.current}
              </div>
              <div
                className={`text-xs font-medium tabular-nums ${
                  positive ? 'text-green-text' : 'text-red-text'
                }`}
              >
                {positive ? '↑' : '↓'} {Math.abs(value.delta)} {t.deltaSuffix}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
