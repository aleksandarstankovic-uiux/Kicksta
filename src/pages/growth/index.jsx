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
import LiveActivityStrip from './LiveActivityStrip'
import GrowthPlusBanner from '@/components/GrowthPlusBanner'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Growth page v5 layout:
// - Mode card opens the page (safety copy lives inline at the bottom of it).
// - 2x2 grid: Engagement → Filters on the left, Whitelist → Blacklist on the right.
// - LiveActivityStrip below the grid — proof your config is running.
// - Shared GrowthPlusBanner closes the page (same component as Overview).
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
        <p className="mt-1 text-sm text-text-secondary">
          Configure how Kicksta grows your account.
        </p>
      </header>

      <ModeCard />

      {/* 2x2 grid — Engagement → Filters on left, Whitelist → Blacklist on right.
          Each column is its own flex-col so the cards stack independently. */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <EngagementCard onRequestUpgrade={openUpgrade} />
          <FiltersCard onEdit={() => setFiltersOpen(true)} />
        </div>
        <div className="flex flex-col gap-4">
          <WhitelistCard onEdit={() => setWhitelistOpen(true)} />
          <BlacklistCard onEdit={() => setBlacklistOpen(true)} />
        </div>
      </div>

      <LiveActivityStrip />

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
