import { Outlet } from 'react-router-dom'
import SettingsNav from './SettingsNav'

// Settings shell. Renders the page title, the secondary settings nav
// (left column on desktop, top row on mobile), and the active panel
// via <Outlet />. Children are routed under /account/*.
export default function AccountPage() {
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
    </div>
  )
}
