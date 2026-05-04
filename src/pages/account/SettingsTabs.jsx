import { NavLink, useLocation } from 'react-router-dom'

// Mobile-only segmented strip for /account/* — replaces the
// previous "menu screen" (`/account` listing Profile + Billing as
// rows) with an always-visible top strip. Desktop keeps the
// sidebar nav (`SettingsNav.jsx`) in the two-pane layout.
//
// Active match for Billing also covers /account/subscriptions/:id
// drilldowns so the strip doesn't lose orientation.
const TABS = [
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/billing', label: 'Billing' },
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
    <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 lg:hidden">
      {TABS.map(({ to, label }) => {
        const active = isActive(pathname, to)
        return (
          <NavLink
            key={to}
            to={to}
            className={`flex h-10 flex-1 items-center justify-center rounded-md text-sm font-medium transition-colors ${
              active
                ? 'bg-blue-tint text-blue-text'
                : 'text-text-secondary hover:bg-bg hover:text-text-primary'
            }`}
          >
            {label}
          </NavLink>
        )
      })}
    </div>
  )
}
