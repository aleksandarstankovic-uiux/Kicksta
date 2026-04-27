import { useState } from 'react'
import ModeCard from './ModeCard'
import EngagementCard from './EngagementCard'
import FiltersCard from './FiltersCard'
import FiltersModal from './FiltersModal'
import ListsCard from './ListsCard'
import ListsModal from './ListsModal'
import GrowthPlusCard from './GrowthPlusCard'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Growth page v4 layout:
// - Safety strip + Mode take the full width.
// - Engagement (left) beside Filters + Lists read-only cards (right).
//   Filters + Lists are tall because they show all current state.
// - Growth+ closes the page as a compact one-row banner.
// - Filters modal + Lists modal open from each card's Edit button and
//   handle the actual editing with a local draft + Save/Cancel.
// - Welcome DM editing opens a modal from EngagementCard.
export default function GrowthPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [listsOpen, setListsOpen] = useState(false)

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

      <ModeCard />

      {/* Equal 2-col grid on lg:+, stacks on mobile. Engagement left;
          Filters + Lists (visible state) stack on the right. */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <EngagementCard onRequestUpgrade={openUpgrade} />
        <div className="flex flex-col gap-4">
          <FiltersCard onEdit={() => setFiltersOpen(true)} />
          <ListsCard onEdit={() => setListsOpen(true)} />
        </div>
      </div>

      <GrowthPlusCard />

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onRequestUpgrade={openUpgrade}
      />
      <ListsModal open={listsOpen} onClose={() => setListsOpen(false)} />
      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'welcome_dm'}
      />
    </div>
  )
}
