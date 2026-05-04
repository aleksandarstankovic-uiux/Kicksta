import { useState } from 'react'
import { mockUser } from '@/mocks/user'
import ModeCard from './ModeCard'
import WelcomeDmCard from '@/pages/engagement/WelcomeDmCard'
import CloseFriendsCard from '@/pages/engagement/CloseFriendsCard'
import AudienceFiltersCard from './AudienceFiltersCard'
import AudienceFiltersModal from './AudienceFiltersModal'
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
        <p className="mt-1 text-sm text-text-secondary">
          Configure how Kicksta grows your account.
        </p>
      </header>

      <ModeCard />

      {/* Default `align-items: stretch` (no `lg:items-start`) makes
          row-mates match heights — Filters fills to Engagement's height,
          Blacklist fills to Whitelist's. Engagement is itself
          constant-height (it reserves space for the expanded preview /
          progress regardless of toggle state), so the page never
          shifts when toggles flip. */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WelcomeDmCard onRequestUpgrade={openUpgrade} />
        <CloseFriendsCard onRequestUpgrade={openUpgrade} />
        <AudienceFiltersCard onEdit={() => setFiltersOpen(true)} />
        <WhitelistCard onEdit={() => setWhitelistOpen(true)} />
        <BlacklistCard onEdit={() => setBlacklistOpen(true)} />
      </div>

      <div className="mt-4">
        <GrowthPlusBanner isSubscribed={mockUser.growthPlusSubscribed} />
      </div>

      <AudienceFiltersModal
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
