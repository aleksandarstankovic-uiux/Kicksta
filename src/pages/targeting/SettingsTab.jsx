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
    <div className="flex flex-col gap-6">
      {/* Engine — how Kicksta runs the follow loop. */}
      <section>
        <SectionHeading>Engine</SectionHeading>
        <ModeCard />
      </section>

      {/* Audience — who Kicksta is allowed to interact with. */}
      <section>
        <SectionHeading>Audience</SectionHeading>
        <AudienceFiltersCard onEdit={() => setFiltersOpen(true)} />
      </section>

      {/* Lists — explicit allow/block surfaces, parallel pair on lg+. */}
      <section>
        <SectionHeading>Lists</SectionHeading>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <WhitelistCard onEdit={() => setWhitelistOpen(true)} />
          <BlacklistCard onEdit={() => setBlacklistOpen(true)} />
        </div>
      </section>

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

// Small uppercase section heading shared by every group on the
// Settings tab. Same recipe as the inline labels used elsewhere
// (e.g. `RECENT DMS SENT` on the Engagement page) so the page reads
// as a coherent stack of related groups rather than a junk drawer
// of standalone cards.
function SectionHeading({ children }) {
  return (
    <p className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </p>
  )
}
