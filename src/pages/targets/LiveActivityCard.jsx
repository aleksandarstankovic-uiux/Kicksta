import {
  Flame,
  Pause,
  Search,
  Settings,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useTargetsStore } from '@/stores/useTargetsStore'

// v3.2: phase gets a matching Lucide icon that replaces the colored
// dot for a more recognizable at-a-glance action. Right zone is just
// the "next action" label now — the Today counter is out.

const PHASE_ICON = {
  analyzing: Search,
  following: UserPlus,
  unfollowing: UserMinus,
  warming_up: Flame,
  setup: Settings,
  paused: Pause,
  waiting: null, // use colored dot fallback
}

function phraseForPhase(phase, targetHandle) {
  switch (phase) {
    case 'analyzing':
      return 'Currently searching for targets'
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

function iconToneClass(phase) {
  if (phase === 'warming_up') return 'text-blue-base'
  if (phase === 'setup' || phase === 'paused') return 'text-text-muted'
  return 'text-green-base'
}

function accentStripClass(phase) {
  if (phase === 'warming_up') return 'bg-blue-base'
  if (phase === 'setup' || phase === 'paused') return 'bg-text-muted'
  return 'bg-green-base'
}

export default function LiveActivityCard({ onOpenTarget }) {
  const { phase, targetHandle, nextActionLabel } = useSystemStatus()
  const targets = useTargetsStore((s) => s.targets)

  const matchedTarget = targetHandle
    ? targets.find((t) => t.value.toLowerCase() === targetHandle.toLowerCase())
    : null

  const Icon = PHASE_ICON[phase] ?? null
  const iconCls = iconToneClass(phase)
  const accentClass = accentStripClass(phase)
  const phrase = phraseForPhase(phase, targetHandle)

  // Split the phrase around the handle so it can be a clickable link.
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

  const contentKey = `${phase}|${targetHandle || ''}`

  return (
    <section className="mt-6 overflow-hidden rounded-t-xl border border-b-0 border-border bg-surface">
      <div className="relative flex items-center justify-between gap-3 px-4 py-3 lg:px-6 lg:py-4">
        {/* Accent strip. */}
        <span
          className={`absolute left-0 top-0 h-full w-1 ${accentClass}`}
          aria-hidden="true"
        />

        {/* Left: eyebrow + animated icon/phrase. */}
        <div className="min-w-0 flex-1 pl-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
            System activity
          </p>

          <div
            key={contentKey}
            className="mt-1 flex min-w-0 items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300"
          >
            {Icon ? (
              <Icon className={`h-4 w-4 shrink-0 ${iconCls}`} aria-hidden="true" />
            ) : (
              <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
                <span
                  className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${accentClass}`}
                  aria-hidden="true"
                />
                <span
                  className={`relative inline-flex h-2 w-2 rounded-full ${accentClass}`}
                  aria-hidden="true"
                />
              </span>
            )}

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

        {/* Right: next action label, centered vertically with the card. */}
        {nextActionLabel && (
          <span className="hidden shrink-0 rounded-full bg-bg px-2 py-1 text-xs text-text-muted lg:inline">
            {nextActionLabel}
          </span>
        )}
      </div>

      {/* Mobile secondary line — only the next action label (or nothing). */}
      {nextActionLabel && (
        <div className="border-t border-border px-4 py-2 text-xs text-text-muted lg:hidden">
          {nextActionLabel}
        </div>
      )}
    </section>
  )
}
