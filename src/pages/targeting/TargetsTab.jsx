import { useState } from 'react'
import TargetsHeroCard from './TargetsHeroCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'
import TargetDetailDrawer from './TargetDetailDrawer'
import RemoveTargetModal from './RemoveTargetModal'
import AddTargetSheet from './AddTargetSheet'

// Targets tab — operational view: list, filter, sort, add, drill into
// per-target detail. Default tab on /targeting.
export default function TargetsTab() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)

  return (
    <>
      <TargetsHeroCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList
        onOpen={(t) => setDetailTarget(t)}
        onBulkRemove={() => {}}
        onBulkRestore={() => {}}
      />

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
    </>
  )
}
