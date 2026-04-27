import { useState } from 'react'
import { Heart, MessageSquare, Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import WelcomeDmModal from './WelcomeDmModal'
import WelcomeDmPreview from './WelcomeDmPreview'
import CloseFriendsProgress from './CloseFriendsProgress'

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

  const showPreview = config.welcomeDm.enabled && !welcomeLocked
  const cfEnabled = config.closeFriendsAdder.enabled
  const cfMode = config.closeFriendsAdder.mode
  const showCfControls = cfEnabled && !closeFriendsLocked

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <CardChip color="green" icon={Heart} />
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">Engagement</h2>
          <InfoTooltip text="How Kicksta interacts with new followers." />
        </div>
      </div>

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
          {showPreview && (
            <WelcomeDmPreview
              message={config.welcomeDm.message}
              onEdit={() => setDmModalOpen(true)}
            />
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
          {showCfControls && (
            <div className="ml-7 pb-3">
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
              <CloseFriendsProgress mode={cfMode} />
            </div>
          )}
        </div>
      </div>

      <WelcomeDmModal open={dmModalOpen} onClose={() => setDmModalOpen(false)} />
    </section>
  )
}
