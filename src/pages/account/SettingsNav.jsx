import { NavLink, useLocation } from 'react-router-dom'
import { User, CreditCard, Layers, ChevronRight } from 'lucide-react'

const items = [
  {
    to: '/account/profile',
    label: 'Profile',
    icon: User,
    description: 'Name, email, password, phone',
  },
  {
    to: '/account/payment',
    label: 'Payment',
    icon: CreditCard,
    description: 'Cards on file and billing history',
  },
  {
    to: '/account/subscriptions',
    label: 'Subscriptions',
    icon: Layers,
    description: 'One per Instagram account',
  },
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
      {items.map(({ to, label, icon: Icon, description }) => {
        const active = isSubActive(pathname, to)
        return (
          <NavLink
            key={to}
            to={to}
            className={`group relative flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors lg:rounded-lg lg:border-0 lg:bg-transparent lg:px-3 lg:py-2 ${
              active
                ? 'lg:bg-blue-tint'
                : 'hover:bg-bg lg:hover:bg-bg'
            }`}
          >
            {/* Desktop selected accent bar */}
            <span
              aria-hidden="true"
              className={`absolute left-0 top-1.5 bottom-1.5 hidden w-1 rounded-r-full lg:block ${
                active ? 'bg-blue-base' : 'bg-transparent'
              }`}
            />
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg lg:h-auto lg:w-auto lg:rounded-none ${
                active
                  ? 'bg-blue-base text-white lg:bg-transparent lg:text-blue-text'
                  : 'bg-bg text-text-secondary group-hover:text-text-primary lg:bg-transparent'
              }`}
            >
              <Icon className="h-4 w-4 lg:h-4 lg:w-4" />
            </span>
            <span className="flex-1">
              <span
                className={`block text-sm font-medium lg:inline ${
                  active ? 'text-text-primary lg:text-blue-text' : 'text-text-primary lg:text-text-secondary lg:group-hover:text-text-primary'
                }`}
              >
                {label}
              </span>
              <span className="mt-0.5 block text-xs text-text-secondary lg:hidden">
                {description}
              </span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-text-muted lg:hidden" aria-hidden="true" />
          </NavLink>
        )
      })}
    </nav>
  )
}
