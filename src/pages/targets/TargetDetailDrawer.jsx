import { useEffect, useState } from 'react'
import { Hash, Pause, Play, Trash2, X } from 'lucide-react'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { formatCount } from '@/utils/formatCount'
import HealthPill from './HealthPill'

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

export default function TargetDetailDrawer({ target, onClose, onRequestRemove }) {
  const pauseTarget = useTargetsStore((s) => s.pauseTarget)
  const resumeTarget = useTargetsStore((s) => s.resumeTarget)

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

  const handlePauseResume = () => {
    if (target.status === 'active') pauseTarget(target.id)
    else if (target.status === 'paused') resumeTarget(target.id)
    onClose()
  }

  const handleRemove = () => onRequestRemove(target)

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
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
                  statusPillClass[target.status]
                }`}
              >
                {statusLabel[target.status]}
              </span>
            </div>
            {subline && (
              <div className="mt-0.5 text-xs text-text-muted">{subline}</div>
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

        {sizeCount != null && (
          <div className="mt-3 px-5">
            <HealthPill count={sizeCount} />
          </div>
        )}

        <div className="mt-4 flex gap-2 overflow-x-auto px-5">
          <StatChip label="Followed" value={target.followedCount} />
          <StatChip label="Follow-backs" value={target.followBackCount} />
          <StatChip label="Rate" value={rate == null ? '—' : `${rate}%`} />
        </div>

        <div className="mt-5 flex gap-3 px-5">
          {canPauseOrResume ? (
            <>
              <button
                type="button"
                onClick={handlePauseResume}
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-blue-tint text-sm font-medium text-blue-text hover:opacity-90"
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
                className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-lg bg-red-tint text-sm font-medium text-red-text hover:opacity-90"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remove
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={handleRemove}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-red-tint text-sm font-medium text-red-text hover:opacity-90"
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
