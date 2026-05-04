import { useEffect, useState } from 'react'
import { Navigate, useOutlet, useLocation, Link } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import SettingsNav from './SettingsNav'
import PasswordModal from './PasswordModal'
import EditNameModal from './EditNameModal'
import EditEmailModal from './EditEmailModal'
import EditPhoneModal from './EditPhoneModal'

// Detects desktop on first paint. The two-pane layout only makes
// sense at `lg:` and up; below that we use iOS-style push navigation
// where `/account` is the menu and `/account/<panel>` is a forward
// stop, with each panel owning its own H1 + back arrow.
function useIsDesktop() {
  const [isDesktop] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(min-width: 1024px)').matches,
  )
  return isDesktop
}

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
  const isDesktop = useIsDesktop()
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

  // Desktop redirect: hitting `/account` raw on a wide viewport
  // pushes to `/account/profile` so the right pane has content.
  if (!childActive && isDesktop) {
    return <Navigate to="/account/profile" replace />
  }

  const panelTitle = PANEL_TITLE[pathname] ?? 'Settings'
  const showMobilePanelHeader = childActive && !isDesktop
  const showMobileMenuHeader = !childActive && !isDesktop
  const showDesktopHeader = isDesktop

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      {/* Desktop header — "Settings" + subtitle anchored by the
          left-side nav rail. Always visible on lg+. */}
      {showDesktopHeader && (
        <header>
          <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your account, payments, and subscriptions.
          </p>
        </header>
      )}

      {/* Mobile menu header — `/account` itself. Just "Settings"
          H1, no subtitle, list rendered as content. */}
      {showMobileMenuHeader && (
        <header>
          <h1 className="text-lg font-semibold leading-snug text-text-primary">
            Settings
          </h1>
        </header>
      )}

      {/* Mobile panel header — back-arrow icon button + panel
          title. Replaces "Settings" + subtitle once a panel is
          active on mobile. */}
      {showMobilePanelHeader && (
        <header className="flex items-center gap-2">
          <Link
            to="/account"
            aria-label="Back to settings"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold leading-snug text-text-primary">
            {panelTitle}
          </h1>
        </header>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className={`${childActive ? 'hidden lg:block' : ''} lg:sticky lg:top-6 lg:self-start`}>
          <SettingsNav />
        </aside>
        <section className={childActive ? '' : 'hidden lg:block'}>
          {outlet}
        </section>
      </div>

      <PasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <EditNameModal open={nameOpen} onClose={() => setNameOpen(false)} />
      <EditEmailModal open={emailOpen} onClose={() => setEmailOpen(false)} />
      <EditPhoneModal open={phoneOpen} onClose={() => setPhoneOpen(false)} />
    </div>
  )
}
