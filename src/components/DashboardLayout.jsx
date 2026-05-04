import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, useLocation, Link } from 'react-router-dom'
import { BarChart3, Target, TrendingUp, PanelLeftClose, PanelLeftOpen, LogOut, Bell, AlertTriangle, TrendingUp as GrowthIcon, X, Sparkles, ChevronsUpDown, Plus, Check, Settings as SettingsIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useNotifications } from '@/stores/useNotifications'
import { useAccounts } from '@/stores/useAccounts'
import ToastContainer from '@/components/Toast'
import ProfileDropdown from '@/components/ProfileDropdown'
import MobileNavDrawer from '@/components/MobileNavDrawer'
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

  useEffect(() => {
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
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

// Sidebar account switcher — trigger row showing the current IG account
// + a dropdown listing other connected accounts and an "Add account"
// action. V1 state is local (clicking switches the UI only; it doesn't
// yet re-key the rest of the dashboard). Matches the sidebar's row
// styling so it visually belongs with the nav tabs below it.
function AccountSwitcher({ collapsed }) {
  const [open, setOpen] = useState(false)
  const accounts = useAccounts((s) => s.accounts)
  const activeId = useAccounts((s) => s.activeId)
  const setActiveId = useAccounts((s) => s.setActiveId)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const active = accounts.find((a) => a.id === activeId) ?? accounts[0]
  const others = accounts.filter((a) => a.id !== active.id)

  // Connection-state → dot color (mirrors AccountCard's avatar-dot
  // pattern so the same IG connection state reads the same everywhere).
  const statusDotColor = (state) => {
    switch (state) {
      case 'connected':
        return 'bg-green-base'
      case 'warming_up':
        return 'bg-blue-base'
      case 'disconnected':
        return 'bg-red-base'
      default:
        return 'bg-text-muted'
    }
  }

  const Avatar = ({ account, size = 'h-8 w-8' }) => (
    <div className={cn('relative shrink-0', size)}>
      {account.profilePic ? (
        <img
          src={account.profilePic}
          alt={account.username}
          className={cn('rounded-full object-cover ring-1 ring-border', size)}
        />
      ) : (
        <div
          className={cn(
            'flex items-center justify-center rounded-full bg-blue-tint text-xs font-semibold text-blue-text ring-1 ring-border',
            size,
          )}
        >
          {account.username?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      {account.connectionState && (
        <span
          aria-hidden
          className={cn(
            'absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-surface',
            statusDotColor(account.connectionState),
          )}
        />
      )}
    </div>
  )

  // Plan badge — mirrors the plan pill on AccountCard ("Advanced" /
  // "Growth") so users read their current tier at a glance across every
  // account in the list.
  const PlanPill = ({ plan }) => {
    if (!plan) return null
    const label = plan === 'advanced' ? 'Advanced' : 'Growth'
    return (
      <span className="shrink-0 rounded-full bg-bg px-1.5 py-0.5 text-[10px] font-medium text-text-secondary">
        {label}
      </span>
    )
  }

  // Sub-row under the @handle. Surfaces a red "Disconnected" alert when
  // the IG session has expired so the user sees it before trying to
  // switch into that account — replacing the followers count only when
  // the number would be misleading (we can't act on a dead connection).
  const SubLine = ({ account }) => {
    if (account.connectionState === 'disconnected') {
      return (
        <p className="flex items-center gap-1 truncate text-xs font-medium text-red-text">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          Disconnected
        </p>
      )
    }
    return (
      <p className="truncate text-xs text-text-muted">
        {account.followers.toLocaleString()} followers
      </p>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        title={collapsed ? `@${active.username}` : undefined}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex w-full items-center rounded-lg border border-border bg-surface transition-colors hover:border-border-strong',
          collapsed ? 'justify-center p-1.5' : 'gap-2 px-2 py-1.5',
        )}
      >
        <Avatar account={active} size="h-8 w-8" />
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-semibold text-text-primary">
                @{active.username}
              </p>
              <p className="truncate text-xs text-text-muted">
                {active.followers.toLocaleString()} followers
              </p>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-text-muted" />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-40 w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-xl',
            // Fixed-width dropdown in both states — expanded dropdown is
            // deliberately NOT constrained to the trigger/sidebar width
            // so account rows can breathe (handle + plan pill + followers).
            // Extends past the sidebar's right edge when expanded.
            collapsed ? 'left-full top-0 ml-2' : 'left-0 top-full mt-2',
          )}
        >
          <div className="flex flex-col px-1 py-1">
            {/* Current account — rendered first, marked with a check */}
            <div className="flex items-center gap-2 rounded-md bg-bg px-2 py-2">
              <Avatar account={active} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="truncate text-sm font-semibold text-text-primary">
                    @{active.username}
                  </p>
                  <PlanPill plan={active.plan} />
                </div>
                <SubLine account={active} />
              </div>
              <Check className="h-4 w-4 shrink-0 text-green-base" aria-label="Active" />
            </div>

            {others.length > 0 && (
              <>
                <div className="mx-2 my-1 h-px bg-border" aria-hidden />
                {others.map((account) => (
                  <button
                    key={account.id}
                    role="menuitem"
                    type="button"
                    onClick={() => {
                      setActiveId(account.id)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2 rounded-md px-2 py-2 text-left transition-colors hover:bg-bg"
                  >
                    <Avatar account={account} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-text-primary">
                          @{account.username}
                        </p>
                        <PlanPill plan={account.plan} />
                      </div>
                      <SubLine account={account} />
                    </div>
                  </button>
                ))}
              </>
            )}

            <div className="mx-2 my-1 h-px bg-border" aria-hidden />
            <Link
              to="/signup/connect-instagram"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-blue-text transition-colors hover:bg-blue-tint"
            >
              <span
                aria-hidden
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-tint"
              >
                <Plus className="h-4 w-4" />
              </span>
              Add account
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

const tabs = [
  { to: '/', icon: BarChart3, label: 'Overview' },
  { to: '/targets', icon: Target, label: 'Targeting' },
  { to: '/growth', icon: TrendingUp, label: 'Growth' },
]

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

        {/* Nav */}
        <nav className={cn('mt-2 flex flex-1 flex-col gap-1', collapsed ? 'px-2' : 'px-3')}>
          {tabs.map(({ to, icon: Icon, label }) => (
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

        {/* Bottom — profile dropdown (account-level actions) + signup
            dev shortcut + Settings + collapse + logout. The profile
            dropdown opens upward so its panel doesn't escape the
            viewport when the user is at the bottom of a tall window. */}
        <div className={cn('flex flex-col gap-1 border-t border-border py-3', collapsed ? 'px-2' : 'px-3')}>
          <ProfileDropdown variant="sidebar-pill" collapsed={collapsed} />
          <Link
            to="/signup/ig-preview"
            title={collapsed ? 'Signup flow (dev)' : undefined}
            className={cn(
              'flex items-center rounded-lg text-sm font-medium text-purple-text transition-colors hover:bg-purple-tint',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
            )}
          >
            <Sparkles className="h-5 w-5 shrink-0" />
            {!collapsed && 'Signup flow'}
          </Link>
          {/* Settings — main Kicksta-account access (kept per refactor
              decision Q1; the profile dropdown above is the additional
              path, not a replacement). Active when path starts with
              /account so subscription drilldowns also light up the entry. */}
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
          <button
            onClick={() => setCollapsed((v) => !v)}
            className={cn(
              'flex items-center rounded-lg text-sm font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
            )}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5 shrink-0" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5 shrink-0" />
                Collapse
              </>
            )}
          </button>
          <button
            onClick={() => {}}
            className={cn(
              'flex items-center rounded-lg text-sm font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary',
              collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5'
            )}
            title={collapsed ? 'Log out' : undefined}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && 'Log out'}
          </button>
        </div>
      </aside>

      {/* Mobile: top bar. Hamburger (primary nav + account
          switcher + profile actions) lives left; logo centered;
          notification bell right. The profile dropdown was
          previously also mounted here on the right but conflicted
          with the same items inside the drawer — drawer is the
          single source on mobile. */}
      <header className="fixed inset-x-0 top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <MobileNavDrawer />
        <img src={kickstaLogo} alt="Kicksta" className="h-8" />
        <NotificationBell />
      </header>

      {/* Main content */}
      <main className={cn('overflow-hidden pt-14 pb-20 transition-all duration-200 lg:pt-0 lg:pb-0', collapsed ? 'lg:pl-16' : 'lg:pl-60')}>
        <Outlet />
      </main>

      {/* Mobile bottom tab bar */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-border bg-surface pr-[72px] pb-[env(safe-area-inset-bottom)] lg:hidden">
        {tabs.map(({ to, icon: Icon, label }) => {
          const isActive =
            to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)
          return (
            <NavLink
              key={to}
              to={to}
              className={cn(
                'flex flex-col items-center gap-1 py-1 text-xs font-medium transition-colors',
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
