import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import SettingsNav from './SettingsNav'
import PasswordModal from './PasswordModal'

export default function AccountPage() {
  const [passwordOpen, setPasswordOpen] = useState(false)

  useEffect(() => {
    function open() {
      setPasswordOpen(true)
    }
    window.addEventListener('open-password-modal', open)
    return () => window.removeEventListener('open-password-modal', open)
  }, [])

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

      <div className="mt-6 grid gap-6 lg:grid-cols-[200px_1fr]">
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SettingsNav />
        </aside>
        <section>
          <Outlet />
        </section>
      </div>

      <PasswordModal open={passwordOpen} onClose={() => setPasswordOpen(false)} />
    </div>
  )
}
