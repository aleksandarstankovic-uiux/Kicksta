import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import { BarChart3, Target, TrendingUp, PanelLeftClose, PanelLeftOpen, Bell, AlertTriangle, TrendingUp as GrowthIcon, X, Sparkles, Settings as SettingsIcon, LogOut, Sun, Moon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/stores/useNotifications'
import { useNavDrawer } from '@/stores/useNavDrawer'
import { useThemeStore } from '@/stores/useThemeStore'
import ToastContainer from '@/components/Toast'
import AccountSwitcher from '@/components/AccountSwitcher'
import MobileNavDrawer from '@/components/MobileNavDrawer'
import useDismissOnOutsideClick from '@/hooks/useDismissOnOutsideClick'
import kickstaLogo from '@/assets/kicksta-logo.svg'
import kickstaFullLogo from '@/assets/kicksta-full-logo.svg'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days > 0) return `${days}d ago`
  const hours = Math.floor(diff / (1000 * 60 * 60))
  if (hours > 0) return `${hours}h ago`
  return 'Just now'
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const items = useNotifications((s) => s.items)
  const markAsRead = useNotifications((s) => s.markAsRead)
  const markAllRead = useNotifications((s) => s.markAllRead)
  const unread = items.filter((n) => !n.read).length

  // One click-outside + ESC implementation shared by every
  // top-anchored panel in the layout.
  useDismissOnOutsideClick(ref, open, () => setOpen(false))

  const closeNavDrawer = useNavDrawer((s) => s.closeDrawer)

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => {
          // Close the mobile nav drawer if it's open. The bell sits in
          // the mobile top header which now has a higher z-index than
          // the drawer; tapping the bell while the drawer is open
          // dismisses it before showing the notification panel.
          closeNavDrawer()
          setOpen((v) => !v)
        }}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
        title="Notifications"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-base text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        // Open rightward on desktop (`lg:left-0`) since the bell lives at
        // the right edge of the narrow sidebar — anchoring to its right
        // would push the panel off the left side of the viewport. On
        // mobile the bell sits at the top-right of the page, so we keep
        // `right-0` there so the panel stays on-screen.
        <div className="absolute right-0 top-12 z-50 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface shadow-xl lg:right-auto lg:left-0">
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-text-primary">Notifications</h3>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={() => markAllRead()}
                  className="rounded-md px-2 py-1 text-xs font-medium text-blue-text hover:bg-bg"
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={() => setOpen(false)}
                className="flex h-6 w-6 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-text-muted">No notifications</p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.read && markAsRead(n.id)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-border px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-bg',
                    !n.read && 'bg-blue-tint/30'
                  )}
                >
                  <div className={cn(
                    'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
                    n.type === 'system' ? 'bg-yellow-tint' : 'bg-green-tint'
                  )}>
                    {n.type === 'system' ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-yellow-text" />
                    ) : (
                      <GrowthIcon className="h-3.5 w-3.5 text-green-text" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-text-primary">{n.title}</p>
                      {!n.read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-blue-base" />}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{n.body}</p>
                    <p className="mt-1 text-xs text-text-muted">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Primary navigation — used by both the desktop sidebar and the
// mobile drawer. Settings sits in the bottom zone of each surface
// rather than the primary nav (it's account-level config, not
// product surface).
const PRIMARY_NAV = [
  { to: '/', icon: BarChart3, label: 'Overview' },
  { to: '/targeting', icon: Target, label: 'Targeting' },
  { to: '/engagement', icon: TrendingUp, label: 'Engagement' },
  // Growth+ — premium add-on surface. Sparkles icon matches the
  // existing GrowthPlusBanner / signup chip identity. Page itself
  // is not built yet; the link will land on a blank route until it is.
  { to: '/growth-plus', icon: Sparkles, label: 'Growth+' },
]

// Mobile bottom tab bar — Overview / Targeting / Engagement /
// Settings. Settings is on the bottom strip rather than Growth+
// because it's a higher-frequency destination on mobile (account
// management, billing). Growth+ remains drawer-only.
const BOTTOM_TAB_BAR = [
  { to: '/', icon: BarChart3, label: 'Overview' },
  { to: '/targeting', icon: Target, label: 'Targeting' },
  { to: '/engagement', icon: TrendingUp, label: 'Engagement' },
  { to: '/account', icon: SettingsIcon, label: 'Settings' },
]

// Bottom zone of the desktop sidebar. Chrome + system actions only
// — no identity/profile row (account info lives in Settings). Order
// from top to bottom: signup-dev shortcut (DEV only) · theme toggle ·
// collapse · log out. Each row mirrors the collapsed/expanded
// styling of the primary nav above.
function SidebarBottomZone({ collapsed, setCollapsed }) {
  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const rowClasses = (extra = '') =>
    cn(
      'flex items-center rounded-lg text-sm font-medium transition-colors',
      collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
      extra,
    )

  return (
    <div
      className={cn(
        'flex flex-col gap-1 border-t border-border py-3',
        collapsed ? 'px-2' : 'px-3',
      )}
    >
      {/* Settings — account-level config. Lives in the bottom zone
          rather than the primary nav so the primary nav reads as
          "product surfaces" only. Active when path starts with
          `/account` so subscription drilldowns also light up. */}
      <NavLink
        to="/account"
        title={collapsed ? 'Settings' : undefined}
        className={({ isActive }) =>
          cn(
            'flex items-center rounded-lg text-sm font-medium transition-colors',
            collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
            isActive
              ? 'bg-blue-tint text-blue-text'
              : 'text-text-secondary hover:bg-bg hover:text-text-primary'
          )
        }
      >
        <SettingsIcon className="h-5 w-5 shrink-0" />
        {!collapsed && 'Settings'}
      </NavLink>

      {/* Theme toggle — quiet personalization control. Shows the
          target theme's icon + label so the user reads "switch to
          light/dark" rather than the current state. */}
      <button
        type="button"
        onClick={toggleTheme}
        title={collapsed ? (theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode') : undefined}
        className={rowClasses(
          'text-text-secondary hover:bg-bg hover:text-text-primary',
        )}
      >
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 shrink-0" aria-hidden="true" />
        ) : (
          <Moon className="h-5 w-5 shrink-0" aria-hidden="true" />
        )}
        {!collapsed && (theme === 'dark' ? 'Light mode' : 'Dark mode')}
      </button>

      <button
        type="button"
        onClick={() => setCollapsed((v) => !v)}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className={rowClasses(
          'text-text-secondary hover:bg-bg hover:text-text-primary',
        )}
      >
        {collapsed ? (
          <PanelLeftOpen className="h-5 w-5 shrink-0" aria-hidden="true" />
        ) : (
          <PanelLeftClose className="h-5 w-5 shrink-0" aria-hidden="true" />
        )}
        {!collapsed && 'Collapse'}
      </button>

      {/* Log out — last item in the navigation, V1 stub. Replace
          with auth.signOut() when backend lands. */}
      <button
        type="button"
        onClick={() => {}}
        title={collapsed ? 'Log out' : undefined}
        className={rowClasses(
          'text-text-secondary hover:bg-bg hover:text-text-primary',
        )}
      >
        <LogOut className="h-5 w-5 shrink-0" aria-hidden="true" />
        {!collapsed && 'Log out'}
      </button>
    </div>
  )
}

export default function DashboardLayout() {
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-dvh bg-bg">
      {/* Desktop sidebar — lg: only */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-border bg-surface transition-all duration-200 lg:flex lg:flex-col',
          collapsed ? 'w-16' : 'w-60'
        )}
      >
        {/* Logo + notification bell — bell sits to the right of the logo so
            system messages live with the navigation, not inside the page. When
            the sidebar is collapsed, the bell drops below the logo icon. */}
        <div
          className={cn(
            'flex shrink-0 items-center',
            collapsed ? 'h-auto flex-col gap-2 px-2 pt-4' : 'h-16 justify-between px-4',
          )}
        >
          {collapsed ? (
            <img src={kickstaLogo} alt="Kicksta" className="h-7 w-7" />
          ) : (
            <img src={kickstaFullLogo} alt="Kicksta" className="h-7" />
          )}
          <NotificationBell />
        </div>

        {/* Account switcher — sits between the logo/bell header and the
            nav tabs. Shows the active IG account and lets the user swap
            between connected accounts or start the flow to add a new one.
            A bottom hairline + pb-3 separates it from the nav below, so
            the switcher reads as its own zone rather than the top of the
            nav list. */}
        <div
          className={cn(
            'shrink-0 border-b border-border pb-3',
            collapsed ? 'px-2' : 'px-3',
          )}
        >
          <AccountSwitcher collapsed={collapsed} />
        </div>

        {/* Primary nav — Overview / Targeting / Engagement / Settings.
            Same set rendered by the mobile drawer so both surfaces
            agree on what counts as "the navigation." */}
        <nav className={cn('mt-2 flex flex-1 flex-col gap-1', collapsed ? 'px-2' : 'px-3')}>
          {PRIMARY_NAV.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              title={collapsed ? label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg text-sm font-medium transition-colors',
                  collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
                  isActive
                    ? 'bg-blue-tint text-blue-text'
                    : 'text-text-secondary hover:bg-bg hover:text-text-primary'
                )
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {!collapsed && label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom zone — chrome controls + system actions. Profile/identity
            is intentionally not surfaced here; account info is reachable
            via Settings in the primary nav above. Order: signup-dev shortcut
            (DEV only) → theme toggle → collapse → log out. */}
        <SidebarBottomZone collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>

      {/* Mobile: top bar. Hamburger (primary nav + account
          switcher + profile actions) lives left; logo centered;
          notification bell right. The profile dropdown was
          previously also mounted here on the right but conflicted
          with the same items inside the drawer — drawer is the
          single source on mobile. */}
      {/* z-50 so the bell stays clickable while the nav drawer is open
          (drawer panel is z-50, drawer backdrop is z-40 — the header
          needs to sit above the backdrop and on equal footing with
          the drawer, since they don't overlap visually: drawer is
          left-aligned w-72, bell is top-right). Tapping the bell
          calls `closeDrawer()` first to dismiss the drawer, then
          opens the notification panel. */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <MobileNavDrawer />
        <img src={kickstaLogo} alt="Kicksta" className="h-8" />
        <NotificationBell />
      </header>

      {/* Main content */}
      <main className={cn('overflow-hidden pt-14 pb-20 transition-all duration-200 lg:pt-0 lg:pb-0', collapsed ? 'lg:pl-16' : 'lg:pl-60')}>
        <Outlet />
      </main>

      {/* Mobile bottom tab bar — Overview / Targeting / Engagement /
          Settings. Tabs each take `flex-1` so they fill the bar
          evenly across the full viewport width. (No Intercom offset
          on the right — V1 doesn't ship Intercom; when it does, the
          floating widget can sit above the rightmost tab or the bar
          can re-add a right padding then.) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden">
        {BOTTOM_TAB_BAR.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-1 text-xs font-medium transition-colors',
                isActive ? 'text-blue-base' : 'text-text-muted'
              )}
            >
              <Icon className="h-6 w-6" />
              {label}
            </NavLink>
          )
        })}
      </nav>

      <ToastContainer />
    </div>
  )
}
