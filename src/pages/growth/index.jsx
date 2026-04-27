import { useState } from 'react'
import { mockUser } from '@/mocks/user'
import ModeCard from './ModeCard'
import EngagementCard from './EngagementCard'
import FiltersCard from './FiltersCard'
import FiltersModal from './FiltersModal'
import WhitelistCard from './WhitelistCard'
import WhitelistModal from './WhitelistModal'
import BlacklistCard from './BlacklistCard'
import BlacklistModal from './BlacklistModal'
import GrowthPlusBanner from '@/components/GrowthPlusBanner'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Growth page layout:
// - H1 only (no subtitle).
// - Mode hero card opens the page (chip + tooltip + within-IG-limits pill).
// - 2-col grid, two rows of cards:
//     row 1: Engagement | Filters
//     row 2: Whitelist  | Blacklist
// - Shared GrowthPlusBanner closes the page.
export default function GrowthPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [whitelistOpen, setWhitelistOpen] = useState(false)
  const [blacklistOpen, setBlacklistOpen] = useState(false)

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

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <EngagementCard onRequestUpgrade={openUpgrade} />
        <FiltersCard onEdit={() => setFiltersOpen(true)} />
        <WhitelistCard onEdit={() => setWhitelistOpen(true)} />
        <BlacklistCard onEdit={() => setBlacklistOpen(true)} />
      </div>

      <div className="mt-4">
        <GrowthPlusBanner isSubscribed={mockUser.growthPlusSubscribed} />
      </div>

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onRequestUpgrade={openUpgrade}
      />
      <WhitelistModal open={whitelistOpen} onClose={() => setWhitelistOpen(false)} />
      <BlacklistModal open={blacklistOpen} onClose={() => setBlacklistOpen(false)} />
      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'welcome_dm'}
      />
    </div>
  )
}
