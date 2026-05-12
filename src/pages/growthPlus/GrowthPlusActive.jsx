import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import CancelGrowthPlusModal from '@/components/CancelGrowthPlusModal'
import GrowthPlusManageModal from '@/components/GrowthPlusManageModal'
import SwitchTierConfirmModal from '@/components/SwitchTierConfirmModal'
import { mockGrowthPlusNextBillingAt } from '@/mocks/user'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import { useToasts } from '@/stores/useToasts'
import GrowthPlusActivity from './GrowthPlusActivity'
import GrowthPlusBillingCard from './GrowthPlusBillingCard'
import GrowthPlusControls from './GrowthPlusControls'
import GrowthPlusHero from './GrowthPlusHero'
import GrowthPlusMetricsStrip from './GrowthPlusMetricsStrip'

// Subscriber dashboard for the Growth+ page. Hero → metrics →
// [Activity + Controls 2-col on lg:+] → Billing. Owns the three
// modals: Manage popup (entry), Cancel flow (3 steps + success),
// SwitchTier confirm (proration + success — also used as the cancel
// flow's "Too expensive" deflection target).
//
// `account` is captured for future per-account data wiring — V1 mocks
// don't vary per account.
//
// eslint-disable-next-line no-unused-vars
export default function GrowthPlusActive({ account, manageOpenOnMount = false }) {
  const navigate = useNavigate()
  const cancelSubscription = useGrowthPlusSubscription((s) => s.cancel)
  const addToast = useToasts((s) => s.addToast)
  const [manageOpen, setManageOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [switchTierTargetId, setSwitchTierTargetId] = useState(null)

  useEffect(() => {
    if (manageOpenOnMount) setManageOpen(true)
  }, [manageOpenOnMount])

  function handleChangeTier() {
    setManageOpen(false)
    navigate('/account/growth-plus')
  }

  function handleCancel() {
    setManageOpen(false)
    setCancelOpen(true)
  }

  function handleResume() {
    // Wired fully in Task 13 (cancelled_pending Manage variant). Stub
    // here so the modal contract is satisfied.
    setManageOpen(false)
  }

  function handleCancelConfirmed() {
    cancelSubscription(mockGrowthPlusNextBillingAt)
    addToast({
      message: 'Growth+ subscription cancelled.',
      tone: 'success',
    })
  }

  function handleDeflect(tierId) {
    setCancelOpen(false)
    setSwitchTierTargetId(tierId)
  }

  function handleSwitchTierSuccess() {
    // The modal already fires its own "Switched to X" toast. After a
    // deflection downgrade we send the user back to /growth-plus so
    // they land on their (now-downgraded) dashboard.
    navigate('/growth-plus')
  }

  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <GrowthPlusHero />
      <GrowthPlusMetricsStrip />
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2">
        <GrowthPlusActivity />
        <GrowthPlusControls />
      </div>
      <GrowthPlusBillingCard onManage={() => setManageOpen(true)} />

      <GrowthPlusManageModal
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        onChangeTier={handleChangeTier}
        onCancel={handleCancel}
        onResume={handleResume}
      />

      <CancelGrowthPlusModal
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirmed={handleCancelConfirmed}
        onDeflect={handleDeflect}
      />

      <SwitchTierConfirmModal
        targetTierId={switchTierTargetId}
        onClose={() => setSwitchTierTargetId(null)}
        onSuccess={handleSwitchTierSuccess}
      />
    </div>
  )
}
