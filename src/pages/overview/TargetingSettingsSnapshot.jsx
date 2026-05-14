import { Link } from 'react-router-dom'
import { ChevronRight, Heart, Settings2, Target } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

const MODE_LABELS = {
  auto: 'Auto',
  follow_only: 'Follow only',
  unfollow_only: 'Unfollow only',
}

// Compact number formatter for filter pills. "5K" instead of "5,000"
// keeps all six pills readable when they share a single narrow row.
function fmt(n) {
  if (n == null) return '∞'
  if (n >= 1000) {
    return n % 1000 === 0 ? `${n / 1000}K` : `${(n / 1000).toFixed(1)}K`
  }
  return String(n)
}
function range(min, max) {
  return max == null ? `${fmt(min)}+` : `${fmt(min)}–${fmt(max)}`
}

// Snapshot of the user's Targeting engine config. Mode + Like-after-
// follow + Audience filters. Reads live from useGrowthConfig so
// changes made on /targeting?tab=settings reflect here immediately.
// Footer CTA routes back to that page.
export default function TargetingSettingsSnapshot() {
  const config = useGrowthConfig((s) => s.config)

  const privacyLabel =
    { all: 'All', public: 'Public only', private: 'Private only' }[
      config.filters.accountPrivacy
    ] ?? 'All'

  const genderLabel = config.filters.genderTarget
    ? config.filters.genderTarget === 'male'
      ? 'Male'
      : 'Female'
    : 'Any'

  const filterPills = [
    {
      label: 'Following',
      value: range(config.filters.followingMin, config.filters.followingMax),
    },
    {
      label: 'Followers',
      value: range(config.filters.followerMin, config.filters.followerMax),
    },
    {
      label: 'Media',
      value: range(config.filters.mediaMin, config.filters.mediaMax),
    },
    {
      label: 'NSFW',
      value: config.filters.excludeNsfw ? 'Excluded' : 'Allowed',
    },
    { label: 'Privacy', value: privacyLabel },
    { label: 'Gender', value: genderLabel },
  ]

  return (
    <div className="rounded-xl border border-border bg-surface p-4 lg:p-6">
      {/* Tinted header band — extends to the card's outer edges via
          negative margins so it reads as a "title bar" sitting above
          the body. Border on the bottom marks the seam. */}
      <div className="-mx-4 -mt-4 mb-4 rounded-t-xl border-b border-border bg-bg/50 px-4 py-4 lg:-mx-6 lg:-mt-6 lg:px-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-text-primary">
            Targeting settings
          </h2>
          <Link
            to="/targeting?tab=settings"
            className="inline-flex items-center gap-1 text-sm font-medium text-blue-text transition-colors hover:opacity-80"
          >
            Edit
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="divide-y divide-border">
        <div className="flex items-center justify-between py-3.5">
          <div className="flex items-center gap-2.5">
            <Settings2 className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span className="text-sm text-text-secondary">Mode</span>
          </div>
          <span className="rounded-full bg-blue-tint px-2.5 py-1 text-xs font-medium text-blue-text">
            {MODE_LABELS[config.mode]}
          </span>
        </div>

        <div className="flex items-center justify-between py-3.5">
          <div className="flex items-center gap-2.5">
            <Heart className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span className="text-sm text-text-secondary">
              Like after follow
            </span>
          </div>
          {config.likeAfterFollow ? (
            <span className="rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
              On
            </span>
          ) : (
            <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-text-muted">
              Off
            </span>
          )}
        </div>

        <div className="py-4">
          <div className="flex items-center gap-2.5">
            <Target className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span className="text-sm text-text-secondary">Filters</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {filterPills.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1 rounded-full bg-bg px-3 py-1 text-xs"
              >
                <span className="text-text-muted">{f.label}:</span>
                <span className="font-medium text-text-primary">{f.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

    </div>
  )
}
