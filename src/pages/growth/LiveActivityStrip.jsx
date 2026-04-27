import { Clock, Flame, Pause, Search, Settings, UserMinus, UserPlus } from 'lucide-react'
import { useSystemStatus } from '@/hooks/useSystemStatus'

// Color tokens + pulse rule mirror Overview's AccountLiveStatus
// (`iconToneForPhase` + `isRunningPhase`) so the same phase reads
// identically across pages. Icons use `-base` tokens, not `-text`.
const PHASE_META = {
  analyzing: {
    Icon: Search,
    color: 'text-blue-base',
    pulse: true,
    copy: () => 'Currently searching for targets',
  },
  following: {
    Icon: UserPlus,
    color: 'text-green-base',
    pulse: true,
    copy: (h) => `Currently following ${h ?? 'a target'}`,
  },
  unfollowing: {
    Icon: UserMinus,
    color: 'text-blue-base',
    pulse: true,
    copy: (h) => `Currently unfollowing ${h ?? 'a target'}`,
  },
  waiting: {
    Icon: Clock,
    color: 'text-blue-base',
    pulse: true,
    copy: () => 'Pausing between actions',
  },
  warming_up: {
    Icon: Flame,
    color: 'text-blue-base',
    pulse: false,
    copy: () => 'Warming up — growth starts within 72 hours',
  },
  paused: {
    Icon: Pause,
    color: 'text-text-muted',
    pulse: false,
    copy: () => 'Paused',
  },
  setup: {
    Icon: Settings,
    color: 'text-yellow-base',
    pulse: false,
    copy: () => 'Setup needed — add your first target to start',
  },
}

export default function LiveActivityStrip() {
  const { phase, targetHandle, nextActionLabel } = useSystemStatus()

  // Hide entirely in setup — strip would have nothing useful to say.
  if (phase === 'setup') return null

  const meta = PHASE_META[phase] ?? PHASE_META.waiting
  const { Icon, color, pulse } = meta

  // Pulse the icon + status row only — Overview animates the inline row,
  // not the surrounding card border, so the same is done here.
  return (
    <section className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3 lg:px-5 lg:py-4">
      <div
        className={`flex min-w-0 items-center gap-3 ${pulse ? 'animate-pulse' : ''}`}
      >
        <Icon className={`h-4 w-4 shrink-0 ${color}`} aria-hidden="true" />
        <span className="truncate text-sm text-text-primary">
          {meta.copy(targetHandle)}
        </span>
      </div>
      {nextActionLabel && (
        <span className="hidden shrink-0 text-xs text-text-muted lg:inline">
          {nextActionLabel}
        </span>
      )}
    </section>
  )
}
