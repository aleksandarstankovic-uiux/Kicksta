import { useEffect, useState } from 'react'
import { Navigate, useOutlet, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import SettingsNav from './SettingsNav'
import PasswordModal from './PasswordModal'

// Detects desktop on first paint. The two-pane layout only makes sense
// at `lg:` and up; below that we use iOS-style push navigation where
// `/account` is the menu and `/account/<panel>` is a forward stop.
function useIsDesktop() {
  const [isDesktop] = useState(() =>
    typeof window === 'undefined'
      ? true
      : window.matchMedia('(min-width: 1024px)').matches,
  )
  return isDesktop
}

export default function AccountPage() {
  const [passwordOpen, setPasswordOpen] = useState(false)
  const outlet = useOutlet()
  const childActive = !!outlet
  const isDesktop = useIsDesktop()

  useEffect(() => {
    function open() {
      setPasswordOpen(true)
    }
    window.addEventListener('open-password-modal', open)
    return () => window.removeEventListener('open-password-modal', open)
  }, [])

  // Desktop redirect: hitting `/account` on a wide viewport always
  // pushes to `/account/profile` so the right pane has content.
  if (!childActive && isDesktop) {
    return <Navigate to="/account/profile" replace />
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your account, payments, and subscriptions.
        </p>
      </header>

      {/* Mobile back-arrow — only when a panel is active, only below lg. */}
      {childActive && (
        <Link
          to="/account"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary lg:hidden"
        >
          <ArrowLeft className="h-4 w-4" /> Settings
        </Link>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[200px_1fr]">
        {/* Nav: always visible on lg:. On mobile, only when no child route. */}
        <aside className={`${childActive ? 'hidden lg:block' : ''} lg:sticky lg:top-6 lg:self-start`}>
          <SettingsNav />
        </aside>
        {/* Panel: always visible on lg:. On mobile, only when child is active. */}
        <section className={childActive ? '' : 'hidden lg:block'}>
          {outlet}
        </section>
      </div>

      <PasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  )
}
