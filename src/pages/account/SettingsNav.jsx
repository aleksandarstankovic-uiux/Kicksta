import { NavLink, useLocation } from 'react-router-dom'
import { User, CreditCard, Layers, ChevronRight } from 'lucide-react'

const items = [
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/payment', label: 'Payment', icon: CreditCard },
  { to: '/account/subscriptions', label: 'Subscriptions', icon: Layers },
]

// Highlights the Subscriptions row when the user is deep in
// /account/subscriptions/:id so the secondary nav stays consistent
// with the breadcrumb the user sees.
function isSubActive(currentPath, itemPath) {
  if (itemPath === '/account/subscriptions') {
    return currentPath.startsWith('/account/subscriptions')
  }
  return currentPath === itemPath
}

// Selected style matches the main sidebar nav in DashboardLayout —
// `bg-blue-tint text-blue-text` over the whole pill. Mobile uses
// the same recipe with a trailing chevron so it reads as a push-
// nav row.
export default function SettingsNav() {
  const { pathname } = useLocation()

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon }) => {
        const active = isSubActive(pathname, to)
        return (
          <NavLink
            key={to}
            to={to}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-blue-tint text-blue-text'
                : 'text-text-secondary hover:bg-bg hover:text-text-primary'
            }`}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <span className="flex-1">{label}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-text-muted lg:hidden" aria-hidden="true" />
          </NavLink>
        )
      })}
    </nav>
  )
}
