import { useEffect, useState } from 'react'
import { Navigate, useOutlet } from 'react-router-dom'
import SettingsNav from './SettingsNav'
import SettingsTabs from './SettingsTabs'
import PasswordModal from './PasswordModal'
import EditNameModal from './EditNameModal'
import EditEmailModal from './EditEmailModal'
import EditPhoneModal from './EditPhoneModal'

// `/account` always redirects to `/account/profile`. Mobile uses the
// `SettingsTabs` pill switcher (inline with the page header on sm+,
// stacked below on small viewports). Desktop uses the `SettingsNav`
// rail in the two-pane grid.
//
// Header copy mirrors the Targeting page pattern: H1 + subtitle on
// the left, the page-level switcher pinned to the upper-right (sm+).
// Mobile users see the same "Settings" title regardless of which
// panel is active — the active state lives on the switcher itself.
export default function AccountPage() {
  const [passwordOpen, setPasswordOpen] = useState(false)
  const [nameOpen, setNameOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [phoneOpen, setPhoneOpen] = useState(false)

  const outlet = useOutlet()
  const childActive = !!outlet

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

  // Always redirect raw `/account` to `/account/profile`.
  if (!childActive) {
    return <Navigate to="/account/profile" replace />
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      {/* Header — H1 + subtitle on the left, pill switcher pinned to
          the upper-right on sm+. Stacks on the smallest viewports
          (switcher drops below the subtitle, still left-aligned).
          Mirrors the Targeting page header exactly. SettingsTabs is
          `lg:hidden` itself; on lg+ the SettingsNav rail in the grid
          below replaces it. */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0">
          <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
            Settings
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Manage your account, payments, and subscriptions.
          </p>
        </div>
        <SettingsTabs />
      </header>

      <div className="mt-5 grid gap-6 lg:grid-cols-[200px_minmax(0,1fr)]">
        <aside className="hidden lg:sticky lg:top-6 lg:block lg:self-start">
          <SettingsNav />
        </aside>
        <section className="min-w-0">{outlet}</section>
      </div>

      <PasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
      <EditNameModal open={nameOpen} onClose={() => setNameOpen(false)} />
      <EditEmailModal open={emailOpen} onClose={() => setEmailOpen(false)} />
      <EditPhoneModal open={phoneOpen} onClose={() => setPhoneOpen(false)} />
    </div>
  )
}
