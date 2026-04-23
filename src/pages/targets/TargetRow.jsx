import { MoreVertical, Star } from 'lucide-react'

// Status → dot color. Matches the vocabulary already used on the
// Overview page's TargetsOverview snapshot so the two stay consistent.
const statusDotClass = {
  active: 'bg-green-base',
  queued: 'bg-blue-base',
  paused: 'bg-text-muted',
  depleted: 'bg-yellow-base',
}

const statusTooltip = {
  active: 'Working on it — currently being targeted for growth',
  queued: 'In queue — will start once an active slot frees up',
  paused: 'Targeting off — this source is temporarily not running',
  depleted: 'Depleted — no more users left to follow from this source',
}

// Tinted pills per status. Paused is neutral-grey on purpose (not a
// colored state); all the others use their status color family.
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

export default function TargetRow({ target, isTop, isFirst, onOpenMenu }) {
  const depleted = target.status === 'depleted'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={(e) => onOpenMenu(target, e.currentTarget)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onOpenMenu(target, e.currentTarget)
        }
      }}
      className={`flex min-h-[56px] cursor-pointer items-center gap-3 px-4 py-3 transition-colors hover:bg-bg focus:bg-bg focus:outline-none ${
        isFirst ? '' : 'border-t border-border'
      } ${depleted ? 'bg-bg/60' : ''}`}
    >
      {/* Identity zone */}
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        {/* Dot + tooltip */}
        <span className="group/dot relative flex shrink-0 items-center">
          <span
            aria-label={statusTooltip[target.status]}
            className={`h-2.5 w-2.5 rounded-full ${statusDotClass[target.status]}`}
          />
          <span
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-0 z-10 mb-2 w-max max-w-[220px] rounded-lg bg-text-primary px-2.5 py-1.5 text-[11px] font-normal leading-relaxed text-surface opacity-0 shadow-lg transition-opacity group-hover/dot:opacity-100 group-focus-within/dot:opacity-100"
          >
            {statusTooltip[target.status]}
          </span>
        </span>

        <span
          className={`truncate text-sm font-medium ${
            depleted ? 'text-text-muted line-through' : 'text-text-primary'
          }`}
        >
          {target.value}
        </span>

        {/* Top-performer star sits between name and pill when applicable. */}
        {isTop && (
          <Star
            className="h-3.5 w-3.5 shrink-0 fill-yellow-base text-yellow-base"
            aria-label="Top performer"
          />
        )}

        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
            statusPillClass[target.status]
          }`}
        >
          {statusLabel[target.status]}
        </span>
      </div>

      {/* Follow-back count */}
      <span
        className={`shrink-0 text-sm font-semibold tabular-nums ${
          depleted ? 'text-text-muted' : 'text-text-primary'
        }`}
      >
        {target.followBackCount}
      </span>

      {/* Kebab — visual affordance. Row-tap already triggers the menu;
          stopPropagation so clicking the icon doesn't double-fire. */}
      <button
        type="button"
        aria-label="Open actions"
        onClick={(e) => {
          e.stopPropagation()
          onOpenMenu(target, e.currentTarget)
        }}
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
      >
        <MoreVertical className="h-5 w-5" aria-hidden="true" />
      </button>
    </div>
  )
}
