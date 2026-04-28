import { useState } from 'react'
import AccountStripe from '@/components/AccountStripe'
import TargetsHeroCard from './TargetsHeroCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'
import TargetDetailDrawer from './TargetDetailDrawer'
import RemoveTargetModal from './RemoveTargetModal'
import AddTargetSheet from './AddTargetSheet'
import LiveActivityCard from './LiveActivityCard'

export default function TargetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <AccountStripe />
      <header className="mt-3">
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Targeting
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage the accounts and hashtags Kicksta targets for your growth.
        </p>
      </header>

      <LiveActivityCard onOpenTarget={(t) => setDetailTarget(t)} />
      <TargetsHeroCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList onOpen={(t) => setDetailTarget(t)} />

      <AddTargetSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {detailTarget && (
        <TargetDetailDrawer
          target={detailTarget}
          onClose={() => setDetailTarget(null)}
          onRequestRemove={(t) => {
            setDetailTarget(null)
            setRemoveTarget(t)
          }}
        />
      )}

      {removeTarget && (
        <RemoveTargetModal
          target={removeTarget}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </div>
  )
}
