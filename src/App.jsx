import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import DashboardLayout from '@/components/DashboardLayout'

// Reset window scroll to the top on every route change. React Router
// preserves scroll by default, which feels broken when navigating
// from a long page (e.g. /targeting list scrolled halfway) to a
// short one (e.g. /account/profile) — the new page mounts already
// scrolled.
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}
import SignupLayout from '@/components/SignupLayout'
import OverviewPage from '@/pages/overview'
import TargetingPage from '@/pages/targeting'
import EngagementPage from '@/pages/engagement'
import GrowthPlusPage from '@/pages/growthPlus'
import AccountPage from '@/pages/account'
import AccountGrowthPlusPage from '@/pages/accountGrowthPlus'
import ProfilePanel from '@/pages/account/ProfilePanel'
import BillingPanel from '@/pages/account/BillingPanel'
import SubscriptionDetail from '@/pages/account/SubscriptionDetail'
import IgPreview from '@/pages/signup/steps/IgPreview'
import PlanSelection from '@/pages/signup/steps/PlanSelection'
import Billing from '@/pages/signup/steps/Billing'
import ConnectInstagram from '@/pages/signup/steps/ConnectInstagram'
import TwoFactorSelect from '@/pages/signup/steps/TwoFactorSelect'
import TwoFactorCode from '@/pages/signup/steps/TwoFactorCode'
import FirstTarget from '@/pages/signup/steps/FirstTarget'
import GrowthPlus from '@/pages/signup/steps/GrowthPlus'
import Placeholder from '@/pages/signup/steps/Placeholder'

export default function App() {
  return (
    <>
      <ScrollToTop />
    <Routes>
      {/* Dashboard shell */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/targeting" element={<TargetingPage />} />
        <Route path="/targets" element={<Navigate to="/targeting" replace />} />
        <Route path="/growth" element={<Navigate to="/engagement" replace />} />
        <Route path="/engagement" element={<EngagementPage />} />
        <Route path="/growth-plus" element={<GrowthPlusPage />} />
        <Route path="/account" element={<AccountPage />}>
          <Route path="profile" element={<ProfilePanel />} />
          <Route path="billing" element={<BillingPanel />} />
          {/* Back-compat redirects — /payment + /subscriptions
              merged into /billing in the layout refactor. */}
          <Route path="payment" element={<Navigate to="/account/billing" replace />} />
          <Route path="subscriptions" element={<Navigate to="/account/billing" replace />} />
        </Route>
        <Route path="/account/subscriptions/:id" element={<SubscriptionDetail />} />
        <Route path="/account/growth-plus" element={<AccountGrowthPlusPage />} />
      </Route>

      {/* Signup flow — inside dashboard app, no nav */}
      <Route path="/signup" element={<SignupLayout />}>
        <Route path="ig-preview" element={<IgPreview />} />
        <Route path="plan-selection" element={<PlanSelection />} />
        <Route path="billing" element={<Billing />} />
        <Route path="connect-instagram" element={<ConnectInstagram />} />
        <Route path="two-factor" element={<TwoFactorSelect />} />
        <Route path="two-factor/:method" element={<TwoFactorCode />} />
        <Route path="first-target" element={<FirstTarget />} />
        <Route path="growth-plus" element={<GrowthPlus />} />
        <Route path="dashboard-entry" element={<Placeholder />} />
      </Route>
    </Routes>
    </>
  )
}
