import { Sparkles, UserPlus } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { mockGrowthPlusActivity } from '@/mocks/growthPlusActivity'
import { formatRelativeTime } from '@/utils/formatRelativeTime'

// Recent Growth+ boost events. Default expanded — this is the page's
// proof surface, earns being visible without a disclosure click.
//
// Row icons render bare (no chip background) to match the Overview
// activity feed pattern — rows aren't interactive, so a chip would
// over-decorate. Color carries the event kind: purple-text for
// post-boosted, green-text for follower gains.
function eventRow(event) {
  if (event.type === 'post_boosted') {
    return {
      icon: Sparkles,
      iconColor: 'text-purple-text',
      title: `Your post "${event.postTitle}" boosted`,
      sub: `+${event.engagements} engagements from active accounts`,
    }
  }
  return {
    icon: UserPlus,
    iconColor: 'text-green-text',
    title: `+${event.count} followers from boost network`,
    sub: 'Triggered by your 5 most recent posts',
  }
}

export default function GrowthPlusActivity() {
  const items = mockGrowthPlusActivity.slice(0, 5)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 md:p-5">
      <div className="flex items-center gap-2">
        <CardChip color="purple" icon={Sparkles} />
        <h2 className="text-base font-semibold text-text-primary">
          Recent boost activity
        </h2>
        <span className="inline-flex rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 py-6 text-center text-sm text-text-muted">
          No boost activity yet — your first boost will appear here within 24 hours.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {items.map((event, i) => {
            const row = eventRow(event)
            const Icon = row.icon
            return (
              <li
                key={event.id}
                className={`flex items-start gap-3 py-3 ${
                  i === 0 ? '' : 'border-t border-border'
                }`}
              >
                <Icon
                  aria-hidden="true"
                  className={`mt-0.5 h-4 w-4 shrink-0 ${row.iconColor}`}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {row.title}
                  </p>
                  <p className="truncate text-xs text-text-muted">{row.sub}</p>
                </div>
                <span className="shrink-0 text-xs text-text-muted">
                  {formatRelativeTime(event.createdAt)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
