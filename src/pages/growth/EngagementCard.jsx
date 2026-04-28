import { useState } from 'react'
import { Handshake, Heart, MessageSquare, Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import ResetConfirmModal from '@/components/ResetConfirmModal'
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
    resetEngagement,
  } = useGrowthConfig()

  const [dmModalOpen, setDmModalOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const welcomeLocked = isLocked('welcome_dm', mockUser)
  const closeFriendsLocked = isLocked('close_friends', mockUser)

  const showPreview = config.welcomeDm.enabled && !welcomeLocked
  const cfEnabled = config.closeFriendsAdder.enabled
  const cfMode = config.closeFriendsAdder.mode
  const showCfControls = cfEnabled && !closeFriendsLocked

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <CardChip color="green" icon={Handshake} />
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
          <WelcomeDmPreview
            enabled={showPreview}
            message={config.welcomeDm.message}
            onEdit={() => setDmModalOpen(true)}
          />
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
          {/* Segmented control fills the row width — `flex w-full` + `flex-1`
              on each pill splits the row 50/50. Greyed when toggle is off. */}
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
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          Reset to defaults
        </button>
      </div>

      <WelcomeDmModal open={dmModalOpen} onClose={() => setDmModalOpen(false)} />
      <ResetConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => resetEngagement()}
        sectionLabel="Engagement"
      />
    </section>
  )
}
