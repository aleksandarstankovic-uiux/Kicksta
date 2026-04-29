import { useState } from 'react'
import { findServer } from '@/mocks/servers'
import ChangeServerModal from './ChangeServerModal'

export default function ServerCard({ subscription }) {
  const [open, setOpen] = useState(false)
  const server = findServer(subscription.server)

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <h3 className="text-base font-semibold text-text-primary">Server</h3>
      <div className="mt-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-text-primary">{server.label}</p>
          <p className="text-xs text-text-secondary">{server.region}</p>
        </div>
        <button
          onClick={() => setOpen(true)}
          className="inline-flex h-9 items-center rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-bg"
        >
          Change
        </button>
      </div>
      <p className="mt-3 text-xs text-text-muted">
        Affects compliance region and proxy routing.
      </p>

      <ChangeServerModal open={open} subscription={subscription} onClose={() => setOpen(false)} />
    </div>
  )
}
