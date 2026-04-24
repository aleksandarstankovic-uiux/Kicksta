import { useState } from 'react'
import SafetyStrip from './SafetyStrip'
import ModeCard from './ModeCard'
import EngagementCard from './EngagementCard'
import FiltersCard from './FiltersCard'
import ListsCard from './ListsCard'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Growth page — config surface for the Targeted Growth engine and
// Growth+ opt-in. Every editable control auto-saves via the stores.
//
// The page also hosts a single shared UpgradeBottomSheet that fires
// from every plan-gated feature. Child cards open it via a callback.
export default function GrowthPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)

  const openUpgrade = (feature) => setUpgradeFeature(feature)
  const closeUpgrade = () => setUpgradeFeature(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Growth
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure how Kicksta grows your account.
        </p>
      </header>

      <SafetyStrip />

      <ModeCard />
      <EngagementCard onRequestUpgrade={openUpgrade} />
      <FiltersCard onRequestUpgrade={openUpgrade} />
      <ListsCard />

      {/* Growth+ card wires in at Task 11. */}

      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'welcome_dm'}
      />
    </div>
  )
}
