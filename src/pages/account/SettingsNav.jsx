import { NavLink, useLocation } from 'react-router-dom'
import { User, CreditCard } from 'lucide-react'

const items = [
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/billing', label: 'Billing', icon: CreditCard },
]

// Billing is active for /account/billing AND for the standalone
// /account/subscriptions/:id detail page (the rail shouldn't lose
// orientation just because the user drilled into a subscription).
function isItemActive(currentPath, itemPath) {
  if (itemPath === '/account/billing') {
    return (
      currentPath === '/account/billing' ||
      currentPath.startsWith('/account/subscriptions')
    )
  }
  return currentPath === itemPath
}

// Desktop sidebar rail for /account/* — selected style matches the
// main sidebar nav in DashboardLayout (`bg-blue-tint text-blue-text`
// over the whole pill). Mobile uses `SettingsTabs` (segmented strip)
// instead, so this component is rendered behind a `lg:block` gate
// in the page shell.
export default function SettingsNav() {
  const { pathname } = useLocation()

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label, icon: Icon }) => {
        const active = isItemActive(pathname, to)
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
          </NavLink>
        )
      })}
    </nav>
  )
}
