import { useState } from 'react'
import WhitelistHalf from './WhitelistHalf'
import BlacklistHalf from './BlacklistHalf'
import WhitelistModal from './WhitelistModal'
import BlacklistModal from './BlacklistModal'

// Single fused Lists card containing the Whitelist + Blacklist halves.
// On desktop the halves sit side by side, separated by a vertical divider.
// On mobile they stack with a horizontal divider between them.
//
// Each half opens its own dedicated edit modal; modal state is owned
// here so the card is fully self-contained.
export default function ListsCard() {
  const [whitelistOpen, setWhitelistOpen] = useState(false)
  const [blacklistOpen, setBlacklistOpen] = useState(false)

  return (
    <>
      <section className="rounded-xl border border-border bg-surface lg:flex lg:divide-x lg:divide-border">
        <div className="border-b border-border lg:flex-1 lg:border-b-0">
          <WhitelistHalf onEdit={() => setWhitelistOpen(true)} />
        </div>
        <div className="lg:flex-1">
          <BlacklistHalf onEdit={() => setBlacklistOpen(true)} />
        </div>
      </section>

      <WhitelistModal open={whitelistOpen} onClose={() => setWhitelistOpen(false)} />
      <BlacklistModal open={blacklistOpen} onClose={() => setBlacklistOpen(false)} />
    </>
  )
}
