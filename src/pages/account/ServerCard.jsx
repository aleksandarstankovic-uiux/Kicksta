import { useState } from 'react'
import { Globe } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { findServer } from '@/mocks/servers'
import ChangeServerModal from './ChangeServerModal'

export default function ServerCard({ subscription }) {
  const [open, setOpen] = useState(false)
  const server = findServer(subscription.server)

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <CardChip color="green" icon={Globe} />
        <h2 className="text-base font-semibold text-text-primary">Server</h2>
        <InfoTooltip text="Region for compliance and proxy routing. Affects which IP addresses Kicksta uses for this account." />
      </div>
      <div className="mt-4 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-primary">{server.label}</p>
          <p className="text-xs text-text-secondary">{server.region}</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-10 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-bg"
        >
          Change
        </button>
      </div>

      <ChangeServerModal open={open} subscription={subscription} onClose={() => setOpen(false)} />
    </div>
  )
}
