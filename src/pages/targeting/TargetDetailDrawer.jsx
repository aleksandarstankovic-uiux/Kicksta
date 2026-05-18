import { useEffect, useState } from 'react'
import { Hash, Pause, Play, RotateCcw, Target as TargetIcon, Trash2, UserPlus, X } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { formatCount } from '@/utils/formatCount'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { mockTargetInteractions } from '@/mocks/targetInteractions'
import HealthPill from './HealthPill'
import Tooltip from '@/components/Tooltip'
import { STATUS_DOT_CLASS, STATUS_TOOLTIP } from './targetStatus'

const statusPillClass = {
  active: 'bg-green-tint text-green-text',
  queued: 'bg-blue-tint text-blue-text',
  paused: 'bg-bg text-text-secondary',
  depleted: 'bg-yellow-tint text-yellow-text',
}

const statusLabel = {
  active: 'Running',
  queued: 'Queued',
  paused: 'Paused',
  depleted: 'Depleted',
}

export default function TargetDetailDrawer({ target, onClose, onRequestRemove }) {
  const pauseTarget = useTargetsStore((s) => s.pauseTarget)
  const resumeTarget = useTargetsStore((s) => s.resumeTarget)
  const restoreTarget = useTargetsStore((s) => s.restoreTarget)
  const processingId = useTargetsStore((s) => s.processingId)
  const isProcessing =
    target?.status === 'active' && target?.id === processingId

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [target])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!target) return null

  const isHashtag = target.type === 'hashtag'
  const handleStart = target.value.replace(/^[@#]/, '')
  const avatarLetter = handleStart.charAt(0).toUpperCase()
  const sizeCount = isHashtag ? target.posts : target.followers
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
  const interactions = (mockTargetInteractions[target.id] ?? []).slice(0, 5)

  const handlePauseResume = () => {
    if (target.status === 'active') pauseTarget(target.id)
    else if (target.status === 'paused') resumeTarget(target.id)
    onClose()
  }

  const handleRemove = () => onRequestRemove(target)

  const handleRestore = () => {
    restoreTarget(target.id)
    onClose()
  }

  const isArchived = target.status === 'archived'
  const canPauseOrResume =
    target.status === 'active' || target.status === 'paused'

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Target details for ${target.value}`}
      className={`fixed inset-0 z-40 flex items-end justify-center bg-black/40 transition-opacity duration-200 lg:items-center ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full overflow-hidden rounded-t-xl bg-surface shadow-xl transition-all duration-200 ease-out lg:max-w-md lg:rounded-xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-start gap-3 px-5 pt-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-base font-semibold text-text-secondary">
            {isHashtag ? (
              <Hash className="h-5 w-5" aria-hidden="true" />
            ) : target.profilePic ? (
              <img src={target.profilePic} alt="" className="h-full w-full object-cover" />
            ) : (
              avatarLetter
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              {/* Mobile-only status dot — matches the TargetRow's
                  mobile treatment. Pulses when the engine is actively
                  picking from this target. Tap to surface the
                  tooltip with the full status word. Hidden on md:+
                  where the full pill takes over. */}
              <Tooltip
                text={
                  isProcessing
                    ? 'The engine is following a user from this target right now.'
                    : STATUS_TOOLTIP[target.status]
                }
                className="shrink-0 md:hidden"
              >
                <span
                  aria-label={
                    isProcessing
                      ? 'Following from this target'
                      : statusLabel[target.status]
                  }
                  className="relative inline-flex h-2 w-2 items-center justify-center"
                >
                  {isProcessing && (
                    <span
                      aria-hidden="true"
                      className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-base opacity-60"
                    />
                  )}
                  <span
                    className={`relative inline-block h-2 w-2 rounded-full ${STATUS_DOT_CLASS[target.status]}`}
                  />
                </span>
              </Tooltip>

              <span className="truncate text-base font-semibold text-text-primary">
                {target.value}
              </span>

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
            {(subline || sizeCount != null) && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {subline && (
                  <span className="text-xs text-text-muted">{subline}</span>
                )}
                {sizeCount != null && (
                  <HealthPill
                    count={sizeCount}
                    verified={!isHashtag && target.verified}
                    isPrivate={!isHashtag && target.private}
                  />
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>


        <div className="mt-4 flex gap-2 overflow-x-auto px-5">
          <StatChip label="Followed" value={target.followedCount} />
          <StatChip label="Follow-backs" value={target.followBackCount} />
          <StatChip label="Rate" value={rate == null ? '—' : `${rate}%`} />
        </div>

        {/* Recent activity — the last few interactions the engine has
            logged for this target. Same icon vocabulary as the Overview
            Activity feed (UserPlus = follow-back, TargetIcon = follow). */}
        <div className="mt-5 px-5">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
            Recent activity
          </p>
          {interactions.length === 0 ? (
            <p className="py-3 text-center text-xs text-text-muted">No activity yet</p>
          ) : (
            <ul className="mt-2 flex flex-col">
              {interactions.map((event) => (
                <li
                  key={event.id}
                  className="flex items-center gap-2 py-2 text-sm"
                >
                  {event.type === 'follow_back' ? (
                    <UserPlus className="h-4 w-4 shrink-0 text-green-text" aria-hidden="true" />
                  ) : (
                    <TargetIcon className="h-4 w-4 shrink-0 text-blue-text" aria-hidden="true" />
                  )}
                  <span className="min-w-0 truncate font-medium text-text-primary">
                    {event.username}
                  </span>
                  <span className="ml-auto shrink-0 text-xs text-text-muted">
                    {formatRelativeTime(event.createdAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-5 flex gap-3 px-5">
          {isArchived ? (
            <button
              type="button"
              onClick={handleRestore}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-blue-base/30 text-sm font-medium text-blue-text hover:bg-blue-tint/40"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Restore target
            </button>
          ) : canPauseOrResume ? (
            <>
              <button
                type="button"
                onClick={handlePauseResume}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg border border-blue-base/30 text-sm font-medium text-blue-text hover:bg-blue-tint/40"
              >
                {target.status === 'active' ? (
                  <>
                    <Pause className="h-4 w-4" aria-hidden="true" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" aria-hidden="true" />
                    Resume
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium text-red-text hover:bg-red-tint/40"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg text-sm font-medium text-red-text hover:bg-red-tint/40"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </button>
          )}
        </div>

        <div className="pb-5" />
      </div>
    </div>
  )
}

function StatChip({ label, value }) {
  return (
    <div className="shrink-0 rounded-full bg-bg px-3 py-1.5 text-xs">
      <span className="text-text-muted">{label} </span>
      <span className="font-semibold tabular-nums text-text-primary">
        {value}
      </span>
    </div>
  )
}
