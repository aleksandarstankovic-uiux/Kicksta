import { useState } from 'react'
import { ChevronDown, Minus, Plus, Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import CloseFriendsProgress from './CloseFriendsProgress'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { mockCloseFriendsState } from '@/mocks/closeFriendsState'

// Close Friends Adder — auto-manage the IG Close Friends list as
// followers come and go. Advanced plan only.
//
// Header pattern matches WelcomeDmCard: chip + title + optional
// Advanced pill + tooltip on the left, the bare toggle pinned in the
// upper-right. Subtitle sits below the title row. The previous
// standalone SettingSwitch row was redundant with this header.
function isLocked(user) {
  return user.plan !== 'advanced'
}

const CF_MODES = [
  {
    value: 'add',
    label: 'Add Followers',
    icon: Plus,
  },
  {
    value: 'remove',
    label: 'Remove Followers',
    icon: Minus,
  },
]

export default function CloseFriendsCard({ onRequestUpgrade }) {
  const { config, toggleCloseFriends, setCloseFriendsMode } = useGrowthConfig()

  const locked = isLocked(mockUser)
  const cfEnabled = config.closeFriendsAdder.enabled
  const cfMode = config.closeFriendsAdder.mode
  const showCfControls = cfEnabled && !locked

  const handleToggle = () => {
    if (locked) {
      onRequestUpgrade('close_friends')
      return
    }
    toggleCloseFriends()
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CardChip color="purple" icon={Star} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-text-primary">Close Friends Adder</h2>
              {locked && (
                <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
                  Advanced
                </span>
              )}
              <InfoTooltip text="Adds your followers to your Close Friends list, and removes anyone who unfollows." />
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
              Add followers to Close Friends; remove ex-followers.
            </p>
          </div>
        </div>
        <CardToggle
          checked={cfEnabled}
          locked={locked}
          onClick={handleToggle}
          ariaLabel="Toggle Close Friends Adder"
        />
      </div>

      {/* Segmented control fills the row width. Each button shows its
          mode icon (Plus for add, Minus for remove) so the active
          action reads at a glance. Greyed when toggle is off. */}
      <div className="mt-3">
        <div
          className={`flex w-full rounded-full bg-bg p-1 ${
            showCfControls ? '' : 'opacity-60'
          }`}
          aria-disabled={!showCfControls}
        >
          {CF_MODES.map((m) => {
            const selected = cfMode === m.value
            const Icon = m.icon
            return (
              <button
                key={m.value}
                type="button"
                onClick={() => setCloseFriendsMode(m.value)}
                disabled={!showCfControls}
                className={`inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                  selected
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon
                  className={`h-3.5 w-3.5 shrink-0 ${
                    selected
                      ? m.value === 'add'
                        ? 'text-green-text'
                        : 'text-text-secondary'
                      : ''
                  }`}
                  aria-hidden="true"
                />
                {m.label}
              </button>
            )
          })}
        </div>
        <div className="pb-3">
          <CloseFriendsProgress mode={cfMode} enabled={showCfControls} />
        </div>
        {showCfControls && <CloseFriendsState />}
      </div>
    </section>
  )
}

// Bare toggle button mirroring SettingSwitch's switch element. Used
// in the upper-right corner of the engagement cards' headers.
function CardToggle({ checked, locked, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
        locked
          ? 'cursor-pointer bg-border opacity-60'
          : checked
            ? 'bg-green-base'
            : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}

// Live state of the Close Friends list — current count + a chronological
// log of recent adds/removes. Only mounts when the toggle is on AND the
// user is on Advanced (the parent gates this with `showCfControls`).
function CloseFriendsState() {
  const { recent } = mockCloseFriendsState
  const items = recent.slice(0, 5)
  return (
    <CollapsibleRecents title="Recent">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-bg/50 px-4 py-6 text-center">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-purple-tint text-purple-text"
          >
            <Star className="h-4 w-4" />
          </span>
          <p className="text-sm font-medium text-text-primary">
            No recent activity yet
          </p>
          <p className="text-xs leading-relaxed text-text-muted">
            Adds and removes will appear here as your follower list changes.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {items.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-2 py-2 text-sm"
            >
              {event.type === 'add' ? (
                <Plus className="h-4 w-4 shrink-0 text-green-text" aria-hidden="true" />
              ) : (
                <Minus className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
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
    </CollapsibleRecents>
  )
}

// Click-to-expand wrapper around the per-card "Recent" activity list.
// Default closed. Header is the eyebrow recipe (text-[11px] uppercase
// tracking-wide text-text-muted) so the closed state matches the
// existing section labels. Chevron rotates 180° when expanded.
// Duplicated inline in WelcomeDmCard.jsx — the ~15 lines aren't
// worth a shared module.
function CollapsibleRecents({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-text-muted hover:text-text-secondary"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}
