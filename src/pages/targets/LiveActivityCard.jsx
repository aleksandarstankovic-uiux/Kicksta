import {
  Clock,
  Flame,
  Pause,
  Search,
  Settings,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useTargetsStore } from '@/stores/useTargetsStore'

// v4.1: every phase now has a dedicated icon (the old dot fallback for
// `waiting` is out — it conflicted with other dot-style indicators on
// the page). Icons pulse as a whole line during running phases.
//
// Icon tones are split by phase meaning rather than a blanket green:
//  - `following`  → green (the one direct-growth action)
//  - everything else active → blue (informational / support work)
//  - `setup`      → yellow (action needed from the user)
//  - `paused`     → muted

const PHASE_ICON = {
  analyzing: Search,
  following: UserPlus,
  unfollowing: UserMinus,
  waiting: Clock,
  warming_up: Flame,
  setup: Settings,
  paused: Pause,
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
  if (phase === 'following') return 'text-green-base'
  if (phase === 'setup') return 'text-yellow-base'
  if (phase === 'paused') return 'text-text-muted'
  return 'text-blue-base'
}

function accentStripClass(phase) {
  if (phase === 'warming_up') return 'bg-blue-base'
  if (phase === 'setup' || phase === 'paused') return 'bg-text-muted'
  return 'bg-green-base'
}

function isRunningPhase(phase) {
  return (
    phase === 'analyzing' ||
    phase === 'following' ||
    phase === 'unfollowing' ||
    phase === 'waiting'
  )
}

export default function LiveActivityCard({ onOpenTarget }) {
  const { phase, targetHandle, nextActionLabel } = useSystemStatus()
  const targets = useTargetsStore((s) => s.targets)

  const matchedTarget = targetHandle
    ? targets.find((t) => t.value.toLowerCase() === targetHandle.toLowerCase())
    : null

  const Icon = PHASE_ICON[phase] ?? Clock
  const iconCls = iconToneClass(phase)
  const accentClass = accentStripClass(phase)
  const phrase = phraseForPhase(phase, targetHandle)
  const running = isRunningPhase(phase)

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

        {/* Left: eyebrow row (with inline next-in label on mobile) + animated phrase. */}
        <div className="min-w-0 flex-1 pl-1">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
              System activity
            </p>
            {/* Mobile-only: "next in" as a compact inline label right
                next to the eyebrow so it's visible up top. */}
            {nextActionLabel && (
              <span className="rounded-full bg-bg px-1.5 py-0.5 text-[10px] text-text-muted lg:hidden">
                {nextActionLabel}
              </span>
            )}
          </div>

          <div
            key={contentKey}
            className={`mt-1 flex min-w-0 items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300 ${
              running ? 'animate-pulse' : ''
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${iconCls}`} aria-hidden="true" />

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

        {/* Right: next action chip on desktop only (mobile shows it inline up top). */}
        {nextActionLabel && (
          <span className="hidden shrink-0 rounded-full bg-bg px-2 py-1 text-xs text-text-muted lg:inline">
            {nextActionLabel}
          </span>
        )}
      </div>
    </section>
  )
}
