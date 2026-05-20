import { useState } from 'react'
import ModeCard from './ModeCard'
import AudienceFiltersCard from './AudienceFiltersCard'
import AudienceFiltersModal from './AudienceFiltersModal'
import WhitelistCard from './WhitelistCard'
import WhitelistModal from './WhitelistModal'
import BlacklistCard from './BlacklistCard'
import BlacklistModal from './BlacklistModal'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Settings tab — engine configuration. Mode + Audience filters span
// full width; Whitelist/Blacklist sit side-by-side on lg: as a
// natural pair (allow vs. block, identical chip-list shape).
export default function SettingsTab() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [whitelistOpen, setWhitelistOpen] = useState(false)
  const [blacklistOpen, setBlacklistOpen] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState(null)

  const openUpgrade = (feature) => setUpgradeFeature(feature)
  const closeUpgrade = () => setUpgradeFeature(null)

  return (
    <div className="flex flex-col gap-4">
      <ModeCard />
      <AudienceFiltersCard onEdit={() => setFiltersOpen(true)} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WhitelistCard onEdit={() => setWhitelistOpen(true)} />
        <BlacklistCard onEdit={() => setBlacklistOpen(true)} />
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
        feature={upgradeFeature ?? 'gender_filter'}
      />
    </div>
  )
}
