import { useState } from 'react'
import { Heart, MessageSquare, Pencil, Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import WelcomeDmModal from './WelcomeDmModal'

function isLocked(feature, user) {
  if (user.plan === 'advanced') return false
  return feature === 'welcome_dm' || feature === 'close_friends'
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

export default function EngagementCard({ onRequestUpgrade }) {
  const {
    config,
    toggleLikeAfterFollow,
    toggleWelcomeDm,
    toggleCloseFriends,
    setCloseFriendsMode,
  } = useGrowthConfig()

  const [dmModalOpen, setDmModalOpen] = useState(false)

  const welcomeLocked = isLocked('welcome_dm', mockUser)
  const closeFriendsLocked = isLocked('close_friends', mockUser)

  const showEditLink = config.welcomeDm.enabled && !welcomeLocked
  const cfEnabled = config.closeFriendsAdder.enabled
  const cfMode = config.closeFriendsAdder.mode
  const showCfMode = cfEnabled && !closeFriendsLocked
  const cfCurrent = CF_MODES.find((m) => m.value === cfMode) ?? CF_MODES[0]

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Engagement</h2>
      <p className="mt-1 text-sm text-text-secondary">
        How Kicksta interacts with new followers.
      </p>

      <div className="mt-2 flex flex-col divide-y divide-border">
        <SettingSwitch
          icon={Heart}
          title="Like after follow"
          description="Like a few of their recent posts after following — boosts the follow-back rate."
          checked={config.likeAfterFollow}
          onChange={() => toggleLikeAfterFollow()}
        />

        <div>
          <SettingSwitch
            icon={MessageSquare}
            title="Welcome DM"
            description="Auto-DM new followers once they follow back."
            checked={config.welcomeDm.enabled}
            onChange={() => toggleWelcomeDm()}
            locked={welcomeLocked}
            onLockedTap={() => onRequestUpgrade('welcome_dm')}
          />
          {showEditLink && (
            <div className="pb-3 pl-7">
              <button
                type="button"
                onClick={() => setDmModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary"
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                Edit message
              </button>
            </div>
          )}
        </div>

        <div>
          <SettingSwitch
            icon={Star}
            title="Close Friends Adder"
            description="Automatically manage your Close Friends list."
            checked={cfEnabled}
            onChange={() => toggleCloseFriends()}
            locked={closeFriendsLocked}
            onLockedTap={() => onRequestUpgrade('close_friends')}
          />
          {showCfMode && (
            <div className="pb-3">
              <div className="inline-flex rounded-full bg-bg p-1">
                {CF_MODES.map((m) => {
                  const selected = cfMode === m.value
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setCloseFriendsMode(m.value)}
                      className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors ${
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
              <p className="mt-2 text-xs text-text-secondary">
                {cfCurrent.description}
              </p>
            </div>
          )}
        </div>
      </div>

      <WelcomeDmModal open={dmModalOpen} onClose={() => setDmModalOpen(false)} />
    </section>
  )
}
