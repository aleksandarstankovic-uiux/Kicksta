import { useState } from 'react'
import EngagementStatsCard from './EngagementStatsCard'
import WelcomeDmCard from './WelcomeDmCard'
import CloseFriendsCard from './CloseFriendsCard'
import GrowthPlusBanner from '@/components/GrowthPlusBanner'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'
import { mockUser } from '@/mocks/user'

// Engagement page — what Kicksta does AFTER a follow-back lands.
// Two cards (Welcome DM + Close Friends), single-column on mobile,
// 2-col on lg:+ so they sit side-by-side on desktop. items-start
// keeps each card hugging its natural content height instead of
// stretching to match the taller neighbor.
//
// GrowthPlusBanner stays parked at the bottom for now — its final
// home gets revisited at the end of the broader refactor pass.
export default function EngagementPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)

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
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
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
