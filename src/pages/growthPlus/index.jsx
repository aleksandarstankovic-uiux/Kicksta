import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { mockUser } from '@/mocks/user'
import { useAccounts } from '@/stores/useAccounts'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import GrowthPlusActive from './GrowthPlusActive'
import GrowthPlusUpsell from './GrowthPlusUpsell'

// /growth-plus page entry. Renders by subscription status:
//   active | cancelled_pending → GrowthPlusActive
//   lapsed                     → GrowthPlusUpsell
//
// Honors ?manage=1 by passing manageOpenOnMount through to
// GrowthPlusActive (which owns the Manage popup state). Used by
// GrowthPlusBanner so the banner can deep-link into the popup without
// the popup needing app-global state.
export default function GrowthPlusPage() {
  const subscribed = useGrowthPlusSubscription(
    (s) => s.subscribed ?? mockUser.growthPlusSubscribed,
  )
  const status = useGrowthPlusSubscription((s) => s.status)
  const activeAccount = useAccounts((s) =>
    s.accounts.find((a) => a.id === s.activeId),
  )
  const location = useLocation()
  const navigate = useNavigate()
  const [manageOpenOnMount, setManageOpenOnMount] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('manage') === '1') {
      setManageOpenOnMount(true)
      params.delete('manage')
      navigate(
        { pathname: location.pathname, search: params.toString() },
        { replace: true },
      )
    }
  }, [location.pathname, location.search, navigate])

  // lapsed → Upsell. Otherwise (active/cancelled_pending) → Active.
  const showActive = subscribed && status !== 'lapsed'

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header className="mb-5 md:mb-6">
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Growth+
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Algorithmic reach on top of your Targeted Growth.
        </p>
      </header>

      {showActive ? (
        <GrowthPlusActive
          account={activeAccount}
          manageOpenOnMount={manageOpenOnMount}
        />
      ) : (
        <GrowthPlusUpsell />
      )}
    </div>
  )
}
