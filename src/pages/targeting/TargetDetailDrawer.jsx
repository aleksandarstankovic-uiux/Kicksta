import { useEffect, useState } from 'react'
import { Hash, Pause, Play, RotateCcw, Target as TargetIcon, Trash2, UserPlus, X } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { formatCount } from '@/utils/formatCount'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { mockTargetInteractions } from '@/mocks/targetInteractions'
import HealthPill from './HealthPill'

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
              <span className="truncate text-base font-semibold text-text-primary">
                {target.value}
              </span>
            </div>
            {(subline || sizeCount != null) && (
              <div className="mt-1 flex flex-wrap items-center gap-2">
                {subline && (
                  <span className="inline-flex items-center text-xs leading-none text-text-muted">
                    {subline}
                  </span>
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


        {/* State banner — full-width tinted strip with the status
            word + 1-line explanation. Always visible, communicates
            state more clearly than the inline pill / mobile dot
            alone. Color per status mirrors the pill recipe. */}
        <StateBanner
          status={target.status}
          isProcessing={isProcessing}
          className="mt-4"
        />

        {/* Horizontal stats strip — 3 equal columns with hairline
            dividers. Followed / Follow-backs / Rate. Replaces the
            chip pills with a real summary row that reads as a
            coherent block. */}
        <div className="mt-4 mx-5 grid grid-cols-3 divide-x divide-border overflow-hidden rounded-lg border border-border">
          <StatColumn label="Followed" value={target.followedCount} />
          <StatColumn label="Follow-backs" value={target.followBackCount} />
          <StatColumn
            label="Rate"
            value={rate == null ? '—' : `${rate}%`}
          />
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

function StatColumn({ label, value }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 bg-surface px-2 py-3">
      <p className="text-[11px] font-medium uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="text-base font-semibold tabular-nums text-text-primary">
        {value}
      </p>
    </div>
  )
}

// Tinted state banner shown below the drawer header. Status word
// on the left (with the matching colored dot), short explanation
// from STATUS_TOOLTIP on the right. Always visible so the user
// gets a strong, viewport-agnostic state cue.
function StateBanner({ status, isProcessing, className = '' }) {
  const STATE_STYLES = {
    active: {
      wrap: 'border-green-base/30 bg-green-tint',
      dot: 'bg-green-base',
      label: 'text-green-text',
    },
    queued: {
      wrap: 'border-blue-base/30 bg-blue-tint',
      dot: 'bg-blue-base',
      label: 'text-blue-text',
    },
    paused: {
      wrap: 'border-border bg-bg',
      dot: 'bg-text-muted',
      label: 'text-text-secondary',
    },
    depleted: {
      wrap: 'border-yellow-base/30 bg-yellow-tint',
      dot: 'bg-yellow-base',
      label: 'text-yellow-text',
    },
    archived: {
      wrap: 'border-border bg-bg',
      dot: 'bg-text-muted',
      label: 'text-text-secondary',
    },
  }
  const STATE_LABEL = {
    active: 'Running',
    queued: 'Queued',
    paused: 'Paused',
    depleted: 'Depleted',
    archived: 'Archived',
  }
  const STATE_EXPLAIN = {
    active: 'Being processed by the engine now.',
    queued: 'Runs when the active target finishes.',
    paused: 'Engine paused. Resume below.',
    depleted: 'All followers processed. Add a new target.',
    archived: 'Removed from rotation.',
  }
  const s = STATE_STYLES[status] ?? STATE_STYLES.paused
  const label = isProcessing ? 'Following' : STATE_LABEL[status]
  const explain = isProcessing
    ? 'Picking a user from this target.'
    : STATE_EXPLAIN[status]

  return (
    <section
      role="status"
      className={`mx-5 flex items-center gap-2 rounded-lg border px-3 py-2 ${s.wrap} ${className}`}
    >
      <span
        aria-hidden="true"
        className="relative inline-flex h-2 w-2 shrink-0 items-center justify-center"
      >
        {isProcessing && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-base opacity-60" />
        )}
        <span className={`relative inline-block h-2 w-2 rounded-full ${s.dot}`} />
      </span>
      <p className="flex min-w-0 flex-1 items-center gap-2 text-xs leading-snug">
        <span className={`shrink-0 font-semibold ${s.label}`}>{label}</span>
        <span
          aria-hidden="true"
          className="h-3 w-px shrink-0 bg-border"
        />
        <span className="min-w-0 flex-1 text-text-secondary">{explain}</span>
      </p>
    </section>
  )
}
