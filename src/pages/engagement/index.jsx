import { useState } from 'react'
import EngagementStatsCard from './EngagementStatsCard'
import WelcomeDmCard from './WelcomeDmCard'
import CloseFriendsCard from './CloseFriendsCard'
import GrowthPlusBanner from '@/components/GrowthPlusBanner'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'
import { mockUser } from '@/mocks/user'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

// Engagement page — what Kicksta does AFTER a follow-back lands.
// Two cards (Welcome DM + Close Friends), single-column on mobile,
// 2-col on lg:+ so they sit side-by-side on desktop.
//
// Height matching rule: when both toggles are in the same state
// (both on or both off), the cards stretch to share row height
// (lg:items-stretch). When the states differ, cards hug their
// natural content (lg:items-start) so the disabled card doesn't
// get padded with empty space to match an enabled neighbor.
//
// GrowthPlusBanner stays parked at the bottom for now — its final
// home gets revisited at the end of the broader refactor pass.
export default function EngagementPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)
  const dmEnabled = useGrowthConfig((s) => s.config.welcomeDm.enabled)
  const cfEnabled = useGrowthConfig(
    (s) => s.config.closeFriendsAdder.enabled,
  )
  const bothSameState = dmEnabled === cfEnabled

  const openUpgrade = (feature) => setUpgradeFeature(feature)
  const closeUpgrade = () => setUpgradeFeature(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Engagement
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          How Kicksta interacts with new followers.
        </p>
      </header>

      <div className="mt-4 flex flex-col gap-4">
        <EngagementStatsCard />
        <div
          className={`grid grid-cols-1 gap-4 lg:grid-cols-2 ${
            bothSameState ? 'lg:items-stretch' : 'lg:items-start'
          }`}
        >
          <WelcomeDmCard onRequestUpgrade={openUpgrade} />
          <CloseFriendsCard onRequestUpgrade={openUpgrade} />
        </div>
      </div>

      <div className="mt-4">
        <GrowthPlusBanner isSubscribed={mockUser.growthPlusSubscribed} />
      </div>

      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'welcome_dm'}
      />
    </div>
  )
}
