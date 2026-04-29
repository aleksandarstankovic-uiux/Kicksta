import { NavLink } from 'react-router-dom'

const items = [
  { to: '/account/profile', label: 'Profile' },
  { to: '/account/payment', label: 'Payment' },
  { to: '/account/subscriptions', label: 'Subscriptions' },
]

export default function SettingsNav() {
  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ to, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm font-medium ${
              isActive ? 'bg-blue-tint text-blue-text' : 'text-text-secondary hover:bg-bg'
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
