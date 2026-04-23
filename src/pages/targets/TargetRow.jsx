import { ChevronRight, Hash, Star } from 'lucide-react'
import { formatCount } from '@/utils/formatCount'

// Status → dot/pill colors kept in one place for consistency with the
// Overview page's TargetsOverview snapshot.
const statusPillClass = {
  active: 'bg-green-tint text-green-text',
  queued: 'bg-blue-tint text-blue-text',
  paused: 'bg-bg text-text-secondary',
  depleted: 'bg-yellow-tint text-yellow-text',
}

const statusLabel = {
  active: 'Active',
  queued: 'Queued',
  paused: 'Paused',
  depleted: 'Depleted',
}

// Color the follow-back % based on PRODUCT.md's healthy-growth
// benchmarks. Depleted rows bypass this and go muted.
function rateToneClass(rate, depleted) {
  if (depleted) return 'text-text-muted'
  if (rate >= 10) return 'text-green-text'
  if (rate >= 5) return 'text-text-secondary'
  return 'text-yellow-text'
}

export default function TargetRow({ target, isTop, isFirst, onOpen }) {
  const depleted = target.status === 'depleted'
  const isHashtag = target.type === 'hashtag'
  const handleStart = target.value.replace(/^[@#]/, '')
  const avatarLetter = handleStart.charAt(0).toUpperCase()

  const subline = isHashtag
    ? target.posts != null
      ? `${formatCount(target.posts)} posts`
      : ''
    : target.followers != null
      ? `${formatCount(target.followers)} followers`
      : ''

  const rate =
    target.followedCount > 0
      ? Math.round((target.followBackCount / target.followedCount) * 100)
      : null

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(target)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpen(target)
        }
      }}
      className={`group flex min-h-[64px] cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bg focus:bg-bg focus:outline-none ${
        isFirst ? '' : 'border-t border-border'
      } ${depleted ? 'bg-bg/60' : ''}`}
    >
      {/* Avatar / hashtag icon */}
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-sm font-semibold text-text-secondary ${
          depleted ? 'opacity-60' : ''
        }`}
      >
        {isHashtag ? (
          <Hash className="h-4 w-4" aria-hidden="true" />
        ) : target.profilePic ? (
          <img
            src={target.profilePic}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          avatarLetter
        )}
      </div>

      {/* Name + subline */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={`truncate text-sm font-medium ${
              depleted ? 'text-text-muted line-through' : 'text-text-primary'
            }`}
          >
            {target.value}
          </span>
          {isTop && (
            <Star
              className="h-3.5 w-3.5 shrink-0 fill-yellow-base text-yellow-base"
              aria-label="Top performer"
            />
          )}
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
              statusPillClass[target.status]
            }`}
          >
            {statusLabel[target.status]}
          </span>
        </div>
        {subline && (
          <span className="truncate text-xs text-text-muted">{subline}</span>
        )}
      </div>

      {/* Follow-backs · rate */}
      <div className="flex shrink-0 items-baseline gap-1">
        <span
          className={`text-sm font-semibold tabular-nums ${
            depleted ? 'text-text-muted' : 'text-text-primary'
          }`}
        >
          {target.followBackCount}
        </span>
        <span className="text-text-muted">·</span>
        <span className={`text-xs tabular-nums ${rateToneClass(rate, depleted)}`}>
          {rate == null ? '—' : `${rate}%`}
        </span>
      </div>

      {/* Affordance: row opens the detail drawer. Decorative only. */}
      <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center">
        <ChevronRight
          className="h-5 w-5 text-text-muted transition-colors group-hover:text-text-primary"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
