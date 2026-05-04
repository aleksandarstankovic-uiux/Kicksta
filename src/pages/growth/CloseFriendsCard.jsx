import { Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import CloseFriendsProgress from './CloseFriendsProgress'

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
        </div>
      </div>
    </section>
  )
}
