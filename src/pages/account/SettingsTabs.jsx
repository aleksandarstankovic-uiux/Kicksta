import { NavLink, useLocation } from 'react-router-dom'
import { CreditCard, User } from 'lucide-react'

// Mobile-only segmented strip for `/account/*`. Recipe matches the
// page-level Targeting/Settings pill switcher in
// `src/pages/targeting/index.jsx` so the same control reads the same
// way across pages: compact intrinsic-width pill, `bg-bg + border`
// container, active state uses `bg-text-primary text-bg shadow-sm`
// (the dashboard's third active recipe — distinct from sidebar nav
// `bg-blue-tint` and primary CTAs `bg-blue-base`).
//
// Desktop keeps the sidebar nav (`SettingsNav.jsx`) in the two-pane
// layout — this strip is `lg:hidden`.
//
// Active match for Billing also covers `/account/subscriptions/:id`
// drilldowns so the strip doesn't lose orientation.
const TABS = [
  { to: '/account/profile', label: 'Profile', icon: User },
  { to: '/account/billing', label: 'Billing', icon: CreditCard },
]

function isActive(currentPath, itemPath) {
  if (itemPath === '/account/billing') {
    return (
      currentPath === '/account/billing' ||
      currentPath.startsWith('/account/subscriptions')
    )
  }
  return currentPath === itemPath
}

export default function SettingsTabs() {
  const { pathname } = useLocation()

  return (
    <div className="inline-flex shrink-0 gap-1 self-start rounded-full border border-border bg-bg p-1 lg:hidden">
      {TABS.map(({ to, label, icon: Icon }) => {
        const active = isActive(pathname, to)
        return (
          <NavLink
            key={to}
            to={to}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm transition-colors ${
              active
                ? 'bg-text-primary font-semibold text-bg shadow-sm'
                : 'font-medium text-text-secondary hover:text-text-primary'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
            {label}
          </NavLink>
        )
      })}
    </div>
  )
}
