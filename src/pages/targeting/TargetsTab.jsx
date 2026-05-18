import { useEffect, useState } from 'react'
import TargetsHeroCard from './TargetsHeroCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'
import TargetDetailDrawer from './TargetDetailDrawer'
import RemoveTargetModal from './RemoveTargetModal'
import AddTargetSheet from './AddTargetSheet'
import BulkRemoveModal from './BulkRemoveModal'
import RestoreLimitModal from './RestoreLimitModal'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { useToasts } from '@/stores/useToasts'
import { slotLimit, inRotationCount } from '@/utils/targetSlots'

// Targets tab — operational view: list, filter, sort, add, drill into
// per-target detail. Default tab on /targeting. Also owns the bulk-
// select page-level concerns: Esc-to-exit and confirm modals.
export default function TargetsTab() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)
  const [bulkRemoveTargets, setBulkRemoveTargets] = useState(null)
  const [restoreLimitData, setRestoreLimitData] = useState(null)

  const selectionMode = useTargetsStore((s) => s.selectionMode)
  const exitSelection = useTargetsStore((s) => s.exitSelection)
  const removeTargetAction = useTargetsStore((s) => s.removeTarget)
  const restoreTargetAction = useTargetsStore((s) => s.restoreTarget)
  const allTargets = useTargetsStore((s) => s.targets)

  // Page-level Esc handler — exits selection when active. Modal-level
  // Esc handlers already exist inside the modals themselves.
  useEffect(() => {
    if (!selectionMode) return
    function onKey(e) {
      if (e.key === 'Escape') exitSelection()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [selectionMode, exitSelection])

  const handleBulkRemove = (targets) => {
    if (!targets || targets.length === 0) return
    setBulkRemoveTargets(targets)
  }

  const confirmBulkRemove = () => {
    const targets = bulkRemoveTargets || []
    targets.forEach((t) => removeTargetAction(t.id))
    useToasts.getState().addToast({
      message: `${targets.length} ${targets.length === 1 ? 'target' : 'targets'} archived`,
      tone: 'success',
    })
    setBulkRemoveTargets(null)
    exitSelection()
  }

  const handleBulkRestore = (targets) => {
    if (!targets || targets.length === 0) return
    const limit = slotLimit()
    const current = inRotationCount(allTargets)
    if (current + targets.length > limit) {
      setRestoreLimitData({
        inRotationCount: current,
        attemptedCount: targets.length,
        slotLimit: limit,
      })
      return
    }
    targets.forEach((t) => restoreTargetAction(t.id))
    useToasts.getState().addToast({
      message: `${targets.length} ${targets.length === 1 ? 'target' : 'targets'} restored to rotation`,
      tone: 'success',
    })
    exitSelection()
  }

  return (
    <>
      <TargetsHeroCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList
        onOpen={(t) => setDetailTarget(t)}
        onBulkRemove={handleBulkRemove}
        onBulkRestore={handleBulkRestore}
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

      {bulkRemoveTargets && (
        <BulkRemoveModal
          targets={bulkRemoveTargets}
          onClose={() => setBulkRemoveTargets(null)}
          onConfirm={confirmBulkRemove}
        />
      )}

      {restoreLimitData && (
        <RestoreLimitModal
          {...restoreLimitData}
          onClose={() => setRestoreLimitData(null)}
        />
      )}
    </>
  )
}
