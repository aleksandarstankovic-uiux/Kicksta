import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useTargetsStore } from '@/stores/useTargetsStore'

// v3.1 framing: the card now opens with a SYSTEM ACTIVITY eyebrow on
// its own line so the user reads "this is what the system is doing"
// before anything else. Phase copy leads with "Currently" for active
// phases. Accent strip + colored dot still carry the run/warn/pause
// state.

// Phase → user-facing copy.
function phraseForPhase(phase, targetHandle) {
  switch (phase) {
    case 'analyzing':
      return 'Currently analyzing your targets'
    case 'following':
      return targetHandle ? `Currently following ${targetHandle}` : 'Currently following'
    case 'unfollowing':
      return targetHandle ? `Currently unfollowing ${targetHandle}` : 'Currently unfollowing'
    case 'waiting':
      return 'Pausing between actions'
    case 'warming_up':
      return 'Warming up — growth starts within 72 hours'
    case 'setup':
      return 'Setup needed — add your first target to start'
    case 'paused':
      return 'Paused'
    default:
      return 'Idle'
  }
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

  const live = isLivePhase(phase)
  const dotClass = dotToneClass(phase)
  const accentClass = accentStripClass(phase)
  const phrase = phraseForPhase(phase, targetHandle)

  // Split the phrase around the handle so the handle can be a
  // clickable link. If the handle appears in the phrase, render it
  // as two text segments with a button in between.
  const handlePieces =
    targetHandle && matchedTarget && phrase.includes(targetHandle)
      ? (() => {
          const idx = phrase.indexOf(targetHandle)
          return {
            before: phrase.slice(0, idx),
            handle: targetHandle,
            after: phrase.slice(idx + targetHandle.length),
          }
        })()
      : null

  // Key for the crossfade — includes phase and handle so target
  // rotations animate as well.
  const contentKey = `${phase}|${targetHandle || ''}`

  return (
    <section className="mt-6 overflow-hidden rounded-xl border border-border bg-surface">
      <div className="relative px-4 py-3 lg:px-6 lg:py-4">
        {/* Left accent strip — phase color. */}
        <span
          className={`absolute left-0 top-0 h-full w-1 ${accentClass}`}
          aria-hidden="true"
        />

        <div className="flex items-start justify-between gap-3 pl-1">
          <div className="min-w-0 flex-1">
            {/* Eyebrow — makes the "this is status" framing obvious. */}
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              System activity
            </p>

            {/* Phase line: dot + animated phrase. key-bound for crossfade. */}
            <div
              key={contentKey}
              className="mt-1 flex min-w-0 items-center gap-2 animate-in fade-in duration-300"
            >
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

              <p className="min-w-0 truncate text-sm font-medium text-text-primary">
                {handlePieces ? (
                  <>
                    {handlePieces.before}
                    <button
                      type="button"
                      onClick={() => onOpenTarget(matchedTarget)}
                      className="text-text-primary hover:underline"
                    >
                      {handlePieces.handle}
                    </button>
                    {handlePieces.after}
                  </>
                ) : (
                  phrase
                )}
              </p>
            </div>
          </div>

          {/* Right zone: data chips on desktop. */}
          <div className="hidden shrink-0 items-center gap-2 pt-0.5 lg:flex">
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
