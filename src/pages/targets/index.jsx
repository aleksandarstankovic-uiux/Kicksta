import { useState } from 'react'
import SlotsCard from './SlotsCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'
import KebabMenu from './KebabMenu'
import RemoveTargetModal from './RemoveTargetModal'
import AddTargetSheet from './AddTargetSheet'

export default function TargetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuTarget, setMenuTarget] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Targets
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage the accounts and hashtags Kicksta targets for your growth.
        </p>
      </header>

      <SlotsCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList onOpenMenu={(t) => setMenuTarget(t)} />

      <AddTargetSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />

      {menuTarget && (
        <KebabMenu
          target={menuTarget}
          onClose={() => setMenuTarget(null)}
          onRequestRemove={(t) => {
            setMenuTarget(null)
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
