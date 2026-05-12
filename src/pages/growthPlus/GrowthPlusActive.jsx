import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import GrowthPlusManageModal from '@/components/GrowthPlusManageModal'
import GrowthPlusActivity from './GrowthPlusActivity'
import GrowthPlusBillingCard from './GrowthPlusBillingCard'
import GrowthPlusControls from './GrowthPlusControls'
import GrowthPlusHero from './GrowthPlusHero'
import GrowthPlusMetricsStrip from './GrowthPlusMetricsStrip'

// Subscriber dashboard for the Growth+ page. Hero → metrics →
// [Activity + Controls 2-col on lg:+] → Billing. Owns the Manage
// popup state — opened from Billing card "Manage" button or by
// ?manage=1 deep-link from the GrowthPlusBanner.
//
// `account` is captured for future per-account data wiring — V1 mocks
// don't vary per account.
//
// eslint-disable-next-line no-unused-vars
export default function GrowthPlusActive({ account, manageOpenOnMount = false }) {
  const navigate = useNavigate()
  const [manageOpen, setManageOpen] = useState(false)

  useEffect(() => {
    if (manageOpenOnMount) setManageOpen(true)
  }, [manageOpenOnMount])

  function handleChangeTier() {
    setManageOpen(false)
    navigate('/account/growth-plus')
  }

  function handleCancel() {
    setManageOpen(false)
    // Cancel modal wiring lands in Task 10.
  }

  function handleResume() {
    setManageOpen(false)
    // Resume wiring lands in Task 13.
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
    </div>
  )
}
