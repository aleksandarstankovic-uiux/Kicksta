import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useTargetsStore } from '@/stores/useTargetsStore'

const PHASE_LABEL = {
  analyzing: 'Analyzing targets',
  following: 'Following',
  unfollowing: 'Unfollowing',
  waiting: 'Pausing between actions',
  warming_up: 'Warming up',
  setup: 'Setup needed',
  paused: 'Paused',
}

function dotToneClass(phase) {
  if (phase === 'warming_up') return 'bg-blue-base'
  if (phase === 'setup' || phase === 'paused') return 'bg-text-muted'
  return 'bg-green-base'
}

function accentStripClass(phase) {
  if (phase === 'warming_up') return 'bg-blue-base'
  if (phase === 'setup' || phase === 'paused') return 'bg-text-muted'
  return 'bg-green-base'
}

function eyebrowTheme(phase) {
  if (phase === 'setup') return { label: 'SETUP', cls: 'bg-bg text-text-muted' }
  if (phase === 'paused') return { label: 'PAUSED', cls: 'bg-bg text-text-muted' }
  if (phase === 'warming_up')
    return { label: 'WARMING UP', cls: 'bg-blue-tint text-blue-text' }
  return { label: 'LIVE', cls: 'bg-green-tint text-green-text' }
}

function isLivePhase(phase) {
  return (
    phase === 'analyzing' ||
    phase === 'following' ||
    phase === 'unfollowing' ||
    phase === 'waiting'
  )
}

export default function LiveActivityCard({ onOpenTarget }) {
  const { phase, targetHandle, actionsToday, nextActionLabel } = useSystemStatus()
  const targets = useTargetsStore((s) => s.targets)

  const matchedTarget = targetHandle
    ? targets.find((t) => t.value.toLowerCase() === targetHandle.toLowerCase())
    : null

  const phaseLabel = PHASE_LABEL[phase] || 'Idle'
  const live = isLivePhase(phase)
  const dotClass = dotToneClass(phase)
  const accentClass = accentStripClass(phase)
  const { label: eyebrowLabel, cls: eyebrowCls } = eyebrowTheme(phase)

  const contentKey = `${phase}|${targetHandle || ''}`

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative flex items-center gap-3 px-4 py-3 lg:px-6 lg:py-4">
        {/* Left accent strip — the phase's color. */}
        <span
          className={`absolute left-0 top-0 h-full w-1 ${accentClass}`}
          aria-hidden="true"
        />

        {/* Left zone: eyebrow + dot + animated phase text */}
        <div className="flex min-w-0 flex-1 items-center gap-3 pl-1">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${eyebrowCls}`}
          >
            {eyebrowLabel}
          </span>

          <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
            {live && (
              <span
                className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotClass}`}
                aria-hidden="true"
              />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${dotClass}`}
              aria-hidden="true"
            />
          </span>

          {/* key-bound wrapper → each phase/target change cross-fades. */}
          <div
            key={contentKey}
            className="flex min-w-0 items-center gap-2 animate-in fade-in duration-300"
          >
            <span className="truncate text-sm font-medium text-text-primary">
              {phaseLabel}
            </span>

            {targetHandle &&
              (matchedTarget ? (
                <button
                  type="button"
                  onClick={() => onOpenTarget(matchedTarget)}
                  className="truncate text-sm font-medium text-text-primary hover:underline"
                >
                  {targetHandle}
                </button>
              ) : (
                <span className="truncate text-sm font-medium text-text-primary">
                  {targetHandle}
                </span>
              ))}

            {phase === 'warming_up' && (
              <span className="truncate text-xs text-text-muted">
                Growth starts within 72 hours
              </span>
            )}
            {phase === 'setup' && (
              <span className="truncate text-xs text-text-muted">
                Add your first target to start
              </span>
            )}
          </div>
        </div>

        {/* Right zone: data chips (desktop). */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          {phase !== 'setup' && (
            <span className="rounded-full bg-bg px-2 py-1 text-xs">
              <span className="text-text-muted">Today </span>
              <span className="font-medium tabular-nums text-text-primary">
                {actionsToday} actions
              </span>
            </span>
          )}
          {nextActionLabel && (
            <span className="rounded-full bg-bg px-2 py-1 text-xs text-text-muted">
              {nextActionLabel}
            </span>
          )}
        </div>
      </div>

      {/* Mobile secondary line. */}
      {(phase !== 'setup' || nextActionLabel) && (
        <div className="border-t border-border px-4 py-2 text-xs text-text-muted lg:hidden">
          {phase !== 'setup' && (
            <>
              Today{' '}
              <span className="tabular-nums text-text-secondary">{actionsToday}</span>{' '}
              actions
            </>
          )}
          {phase !== 'setup' && nextActionLabel && <> · </>}
          {nextActionLabel}
        </div>
      )}
    </section>
  )
}
