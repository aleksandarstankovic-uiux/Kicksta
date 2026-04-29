import { Routes, Route, Navigate } from 'react-router-dom'
import DashboardLayout from '@/components/DashboardLayout'
import SignupLayout from '@/components/SignupLayout'
import OverviewPage from '@/pages/overview'
import TargetsPage from '@/pages/targets'
import GrowthPage from '@/pages/growth'
import AccountPage from '@/pages/account'
import AccountGrowthPlusPage from '@/pages/accountGrowthPlus'
import ProfilePanel from '@/pages/account/ProfilePanel'
import PaymentPanel from '@/pages/account/PaymentPanel'
import SubscriptionsList from '@/pages/account/SubscriptionsList'
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
    <Routes>
      {/* Dashboard shell */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<OverviewPage />} />
        <Route path="/targets" element={<TargetsPage />} />
        <Route path="/growth" element={<GrowthPage />} />
        <Route path="/account" element={<AccountPage />}>
          <Route index element={<Navigate to="/account/profile" replace />} />
          <Route path="profile" element={<ProfilePanel />} />
          <Route path="payment" element={<PaymentPanel />} />
          <Route path="subscriptions" element={<SubscriptionsList />} />
          <Route path="subscriptions/:id" element={<SubscriptionDetail />} />
        </Route>
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
  )
}
