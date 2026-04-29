import { NavLink, useLocation } from 'react-router-dom'
import { User, CreditCard, Layers } from 'lucide-react'

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
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-blue-tint text-blue-text' : 'text-text-secondary hover:bg-bg hover:text-text-primary'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        )
      })}
    </nav>
  )
}
