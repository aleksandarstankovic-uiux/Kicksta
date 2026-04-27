import { useState } from 'react'
import { mockUser } from '@/mocks/user'
import ModeCard from './ModeCard'
import EngagementCard from './EngagementCard'
import FiltersCard from './FiltersCard'
import FiltersModal from './FiltersModal'
import ListsCard from './ListsCard'
import GrowthPlusBanner from '@/components/GrowthPlusBanner'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Growth page v6 layout:
// - H1 only (no subtitle).
// - Mode hero card opens the page (chip + tooltip + within-IG-limits pill).
// - 2-column grid: Engagement + Filters stacked left, fused Lists card right.
// - Shared GrowthPlusBanner closes the page (same component as Overview).
// - LiveActivityStrip removed — settings page, no live status.
export default function GrowthPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const openUpgrade = (feature) => setUpgradeFeature(feature)
  const closeUpgrade = () => setUpgradeFeature(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Growth
        </h1>
      </header>

      <ModeCard />

      {/* Two columns on desktop:
          Left column = Engagement → Filters (settings the user toggles)
          Right column = ListsCard (fused Whitelist + Blacklist halves). */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <EngagementCard onRequestUpgrade={openUpgrade} />
          <FiltersCard onEdit={() => setFiltersOpen(true)} />
        </div>
        <ListsCard />
      </div>

      <div className="mt-4">
        <GrowthPlusBanner isSubscribed={mockUser.growthPlusSubscribed} />
      </div>

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onRequestUpgrade={openUpgrade}
      />
      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'welcome_dm'}
      />
    </div>
  )
}
