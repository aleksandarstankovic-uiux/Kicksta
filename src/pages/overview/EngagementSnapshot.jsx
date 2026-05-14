import { Link } from 'react-router-dom'
import { ChevronRight, MessageSquare, Star } from 'lucide-react'
import { mockUser } from '@/mocks/user'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

// Snapshot of the user's Engagement config. Welcome DM toggle + 1-line
// message preview (when on); Close Friends Adder toggle + mode caption
// (when on). Plan-locked rows render an "Advanced" pill instead. Reads
// live from useGrowthConfig + mockUser; CTA routes to /engagement.
export default function EngagementSnapshot() {
  const config = useGrowthConfig((s) => s.config)
  const isAdvanced = mockUser.plan === 'advanced'

  const dmEnabled = config.welcomeDm.enabled && isAdvanced
  const cfaEnabled = config.closeFriendsAdder.enabled && isAdvanced

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 lg:p-6">
      <h2 className="text-base font-semibold text-text-primary">
        Engagement settings
      </h2>

      <div className="mt-4 divide-y divide-border">
        {/* Welcome DM */}
        <div className="py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare
                className="h-4 w-4 text-text-muted"
                aria-hidden="true"
              />
              <span className="text-sm text-text-secondary">Welcome DM</span>
            </div>
            {!isAdvanced ? (
              <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-text-muted">
                Advanced
              </span>
            ) : config.welcomeDm.enabled ? (
              <span className="rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
                On
              </span>
            ) : (
              <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-text-muted">
                Off
              </span>
            )}
          </div>
          {dmEnabled && (
            <div className="mt-2 rounded-lg bg-blue-tint/40 px-3 py-2">
              <p className="line-clamp-1 text-xs text-text-secondary">
                {config.welcomeDm.message}
              </p>
            </div>
          )}
        </div>

        {/* Close Friends Adder */}
        <div className="py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Star className="h-4 w-4 text-text-muted" aria-hidden="true" />
              <span className="text-sm text-text-secondary">
                Close Friends Adder
              </span>
            </div>
            {!isAdvanced ? (
              <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-text-muted">
                Advanced
              </span>
            ) : config.closeFriendsAdder.enabled ? (
              <span className="rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
                On
              </span>
            ) : (
              <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-text-muted">
                Off
              </span>
            )}
          </div>
          {cfaEnabled && (
            <p className="mt-1 pl-6 text-xs text-text-muted">
              Mode:{' '}
              {config.closeFriendsAdder.mode === 'remove'
                ? 'Remove Followers'
                : 'Add Followers'}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto flex justify-center pt-4">
        <Link
          to="/engagement"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-text transition-colors hover:opacity-80"
        >
          Edit Engagement
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
