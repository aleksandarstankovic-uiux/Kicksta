import { useEffect, useState } from 'react'
import { Navigate, useOutlet, useLocation } from 'react-router-dom'
import SettingsNav from './SettingsNav'
import SettingsTabs from './SettingsTabs'
import PasswordModal from './PasswordModal'
import EditNameModal from './EditNameModal'
import EditEmailModal from './EditEmailModal'
import EditPhoneModal from './EditPhoneModal'

// Mobile no longer has a "menu screen". `/account` always redirects
// to `/account/profile` — every settings panel is reachable via the
// `SettingsTabs` segmented strip pinned at the top on mobile, or the
// `SettingsNav` rail in the two-pane layout on desktop.
const PANEL_TITLE = {
  '/account/profile': 'Profile',
  '/account/billing': 'Billing',
}

export default function AccountPage() {
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [nameOpen, setNameOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)

  const outlet = useOutlet()
  const childActive = !!outlet
  const { pathname } = useLocation()

  useEffect(() => {
    const map = {
      'open-password-modal': () => setPasswordOpen(true),
      'open-edit-name-modal': () => setNameOpen(true),
      'open-edit-email-modal': () => setEmailOpen(true),
      'open-edit-phone-modal': () => setPhoneOpen(true),
    }
    Object.entries(map).forEach(([k, fn]) => window.addEventListener(k, fn))
    return () => {
      Object.entries(map).forEach(([k, fn]) => window.removeEventListener(k, fn))
    }
  }, [])

  // Always redirect raw `/account` to `/account/profile` — no
  // mobile menu screen. Desktop already did this; mobile now matches.
  if (!childActive) {
    return <Navigate to="/account/profile" replace />
  }

  const panelTitle = PANEL_TITLE[pathname] ?? 'Settings'

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      {/* Desktop header — "Settings" + subtitle anchored by the
          left-side nav rail. Always visible on lg+. */}
      <header className="hidden lg:block">
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account, payments, and subscriptions.
        </p>
      </header>

      {/* Mobile header — panel title only. No back arrow because
          there's no menu screen to return to; the segmented strip
          below switches between panels in place. */}
      <header className="lg:hidden">
        <h1 className="text-lg font-semibold leading-snug text-text-primary">
          {panelTitle}
        </h1>
      </header>

      {/* Mobile segmented strip — pinned just under the H1. */}
      <div className="mt-4 lg:hidden">
        <SettingsTabs />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
          <SettingsNav />
        </aside>
        <section>{outlet}</section>
      </div>

      <PasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <EditNameModal open={nameOpen} onClose={() => setNameOpen(false)} />
      <EditEmailModal open={emailOpen} onClose={() => setEmailOpen(false)} />
      <EditPhoneModal open={phoneOpen} onClose={() => setPhoneOpen(false)} />
    </div>
  )
}
