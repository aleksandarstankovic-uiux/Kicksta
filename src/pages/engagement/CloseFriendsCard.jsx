import { Minus, Plus, Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import CloseFriendsProgress from './CloseFriendsProgress'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { mockCloseFriendsState } from '@/mocks/closeFriendsState'

// Close Friends Adder — auto-manage the IG Close Friends list as
// followers come and go. Advanced plan only.
function isLocked(user) {
  return user.plan !== 'advanced'
}

const CF_MODES = [
  {
    value: 'add',
    label: 'Add new followers',
    description:
      'New followers are automatically added to your Close Friends list.',
  },
  {
    value: 'remove',
    label: 'Remove unfollowers',
    description:
      'Users who unfollow you are removed from your Close Friends list.',
  },
]

export default function CloseFriendsCard({ onRequestUpgrade }) {
  const { config, toggleCloseFriends, setCloseFriendsMode } = useGrowthConfig()

  const locked = isLocked(mockUser)
  const cfEnabled = config.closeFriendsAdder.enabled
  const cfMode = config.closeFriendsAdder.mode
  const showCfControls = cfEnabled && !locked

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <CardChip color="purple" icon={Star} />
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">Close Friends Adder</h2>
          <InfoTooltip text="Automatically manage your Close Friends list as followers come and go." />
        </div>
      </div>

      <div className="mt-2 flex flex-col">
        <SettingSwitch
          icon={Star}
          title="Close Friends Adder"
          description="Automatically manage your Close Friends list."
          checked={cfEnabled}
          onChange={() => toggleCloseFriends()}
          locked={locked}
          onLockedTap={() => onRequestUpgrade('close_friends')}
        />
        {/* Segmented control fills the row width. Greyed when toggle is off. */}
        <div className="pb-3 pt-1">
          <div
            className={`flex w-full rounded-full bg-bg p-1 ${
              showCfControls ? '' : 'opacity-60'
            }`}
            aria-disabled={!showCfControls}
          >
            {CF_MODES.map((m) => {
              const selected = cfMode === m.value
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setCloseFriendsMode(m.value)}
                  disabled={!showCfControls}
                  className={`inline-flex h-8 flex-1 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                    selected
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
          <CloseFriendsProgress mode={cfMode} enabled={showCfControls} />
          {showCfControls && <CloseFriendsState />}
        </div>
      </div>
    </section>
  )
}

// Live state of the Close Friends list — current count + a chronological
// log of recent adds/removes. Only mounts when the toggle is on AND the
// user is on Advanced (the parent gates this with `showCfControls`).
function CloseFriendsState() {
  const { count, recent } = mockCloseFriendsState
  const items = recent.slice(0, 5)
  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="flex items-center gap-1.5 text-xs text-text-secondary">
        <Star className="h-3.5 w-3.5 text-purple-text" aria-hidden="true" />
        Currently {count} in close friends
      </p>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Recent
      </p>
      {items.length === 0 ? (
        <p className="py-3 text-center text-xs text-text-muted">
          No recent activity yet.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col">
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
    </div>
  )
}
