import { ChevronRight, Hash, Star } from 'lucide-react'
import { formatCount } from '@/utils/formatCount'
import { useTargetsStore } from '@/stores/useTargetsStore'
import Tooltip from '@/components/Tooltip'
import { STATUS_TOOLTIP } from './targetStatus'

const statusDotClass = {
  active: 'bg-green-base',
  queued: 'bg-blue-base',
  paused: 'bg-text-muted',
  depleted: 'bg-yellow-base',
  archived: 'bg-text-muted',
}

const statusPillClass = {
  active: 'bg-green-tint text-green-text',
  queued: 'bg-blue-tint text-blue-text',
  paused: 'bg-bg text-text-secondary',
  depleted: 'bg-yellow-tint text-yellow-text',
  archived: 'bg-bg text-text-muted',
}

const statusLabel = {
  active: 'Active',
  queued: 'Queued',
  paused: 'Paused',
  depleted: 'Depleted',
  archived: 'Archived',
}

function rateToneClass(rate, depleted) {
  if (depleted) return 'text-text-muted'
  if (rate >= 10) return 'text-green-text'
  if (rate >= 5) return 'text-text-secondary'
  return 'text-yellow-text'
}

export default function TargetRow({ target, isTop, isFirst, onOpen }) {
  const depleted = target.status === 'depleted'
  const processingId = useTargetsStore((s) => s.processingId)
  const isProcessing = target.status === 'active' && target.id === processingId
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
      className={`group relative flex min-h-[64px] cursor-pointer items-center gap-3 py-3 pl-4 pr-3 transition-colors hover:bg-bg focus:bg-bg focus:outline-none ${
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
          <img src={target.profilePic} alt="" className="h-full w-full object-cover" />
        ) : (
          avatarLetter
        )}
      </div>

      {/* Name + subline */}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <div className="flex min-w-0 items-center gap-2">
          {/* Mobile-only status dot. When this row is the engine's current
              focus, an animate-ping halo radiates from it to mirror the
              desktop pill ring. */}
          <span
            aria-label={isProcessing ? 'Following from this target' : statusLabel[target.status]}
            className="relative inline-flex h-2 w-2 shrink-0 items-center justify-center md:hidden"
          >
            {isProcessing && (
              <span
                aria-hidden="true"
                className="absolute inline-flex h-full w-full rounded-full bg-green-base opacity-60 animate-ping"
              />
            )}
            <span
              className={`relative inline-block h-2 w-2 rounded-full ${statusDotClass[target.status]}`}
            />
          </span>

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

          {/* Full pill on md:+ */}
          <Tooltip
            text={
              isProcessing
                ? 'The engine just picked this target and is following a user right now.'
                : STATUS_TOOLTIP[target.status]
            }
            className="hidden shrink-0 md:inline-flex"
          >
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                statusPillClass[target.status]
              } ${
                isProcessing
                  ? 'ring-2 ring-green-base/50 ring-offset-1 ring-offset-surface animate-pulse'
                  : ''
              }`}
            >
              {isProcessing ? 'Following…' : statusLabel[target.status]}
            </span>
          </Tooltip>
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

      {/* Affordance: smaller chevron wrapper so the right side isn't too airy. */}
      <div className="inline-flex h-7 w-7 shrink-0 items-center justify-center">
        <ChevronRight
          className="h-4 w-4 text-text-muted transition-colors group-hover:text-text-primary"
          aria-hidden="true"
        />
      </div>
    </div>
  )
}
