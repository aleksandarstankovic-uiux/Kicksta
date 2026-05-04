import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Target,
  TrendingUp,
  Settings as SettingsIcon,
  User,
  CreditCard,
  AlertTriangle,
  Check,
  Plus,
  Sun,
  Moon,
  LogOut,
  X,
  Menu,
} from 'lucide-react'
import { useUserProfile } from '@/stores/useUserProfile'
import { useThemeStore } from '@/stores/useThemeStore'
import { useAccounts } from '@/stores/useAccounts'

// Mobile primary navigation drawer. Trigger lives in the top-left
// of the mobile header (replaces the empty 40×40 spacer); contents
// stack the four primary nav rows (Overview · Targeting · Growth ·
// Settings) above the same items the ProfileDropdown surfaces on
// desktop. The bottom tab bar stays — duplication on the three
// primary tabs is intentional per the layout-refactor spec (Q5b
// hybrid).
const NAV_TABS = [
  { to: '/', icon: BarChart3, label: 'Overview', end: true },
  { to: '/targets', icon: Target, label: 'Targeting' },
  { to: '/growth', icon: TrendingUp, label: 'Growth' },
  { to: '/account', icon: SettingsIcon, label: 'Settings' },
]

export default function MobileNavDrawer() {
  const [open, setOpen] = useState(false)
  const panelRef = useRef(null)
  const triggerRef = useRef(null)
  const { pathname } = useLocation()

  const firstName = useUserProfile((s) => s.firstName)
  const lastName = useUserProfile((s) => s.lastName)
  const email = useUserProfile((s) => s.email)
  const fullName = `${firstName} ${lastName}`.trim() || 'Account'
  const initials = (firstName?.[0] ?? '') + (lastName?.[0] ?? '')

  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const accounts = useAccounts((s) => s.accounts)
  const activeId = useAccounts((s) => s.activeId)

  // Close on route change so navigating from inside the drawer
  // dismisses it without a manual click. Compare pathname so we
  // only close when the URL actually changes.
  const lastPathname = useRef(pathname)
  useEffect(() => {
    if (pathname !== lastPathname.current) {
      setOpen(false)
      lastPathname.current = pathname
    }
  }, [pathname])

  // ESC closes; focus the panel when it opens; restore focus to the
  // trigger when it closes. Body scroll-locks while open so the
  // page underneath doesn't scroll behind the backdrop.
  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    const previouslyFocused = document.activeElement
    document.addEventListener('keydown', onKey)
    panelRef.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus()
    }
  }, [open])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg hover:text-text-primary lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Backdrop — covers everything including the bottom tab bar */}
      {open && (
        <div
          aria-hidden="true"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      {/* Drawer panel */}
      <aside
        ref={panelRef}
        tabIndex={-1}
        aria-hidden={!open}
        aria-label="Navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-border bg-surface shadow-xl transition-transform duration-200 lg:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header — identity + close */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-tint text-sm font-semibold text-blue-text">
            {initials || '·'}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">{fullName}</p>
            <p className="truncate text-xs text-text-secondary">{email}</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">
          {/* Navigate */}
          <SectionLabel>Navigate</SectionLabel>
          <nav className="flex flex-col gap-1 px-3 pb-2">
            {NAV_TABS.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) => {
                  // For Settings (/account) treat any descendant as
                  // active so subscription drilldowns also light up
                  // the row.
                  const active =
                    to === '/account' ? pathname.startsWith('/account') : isActive
                  return `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-blue-tint text-blue-text'
                      : 'text-text-secondary hover:bg-bg hover:text-text-primary'
                  }`
                }}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Account */}
          <SectionLabel>Account</SectionLabel>
          <div className="flex flex-col gap-1 px-3 pb-2">
            <DrawerLink to="/account/profile" icon={User} label="Account details" />
            <DrawerLink to="/account/billing" icon={CreditCard} label="Plan & billing" />
          </div>

          {/* Instagram accounts — full account switcher. Tapping
              any non-active row promotes that account to active
              (sets useAccounts.activeId) and the rest of the
              dashboard re-keys to it. The drawer closes via the
              route-change effect when the user navigates next; we
              also dismiss explicitly so the user sees the change
              reflected immediately. */}
          <SectionLabel>Instagram accounts</SectionLabel>
          <AccountSwitcherList accounts={accounts} activeId={activeId} onClose={() => setOpen(false)} />

          {/* System */}
          <SectionLabel>System</SectionLabel>
          <div className="flex flex-col gap-1 px-3 pb-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-primary transition-colors hover:bg-bg"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
              ) : (
                <Moon className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
              )}
              {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            </button>
            <button
              type="button"
              onClick={() => {
                // V1 stub — replace with auth.signOut() when backend lands.
                setOpen(false)
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Log out
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="px-4 pb-2 pt-4 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </p>
  )
}

function DrawerLink({ to, icon: Icon, label }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
    >
      <Icon className="h-4 w-4 shrink-0 text-text-secondary" />
      {label}
    </Link>
  )
}

// Inline account-switcher list. Mirrors the desktop sidebar
// AccountSwitcher's dropdown content: active account at the top
// with a check icon, others tap-to-switch, "Add account" link at
// the bottom routing to the connect-Instagram signup flow.
function AccountSwitcherList({ accounts, activeId, onClose }) {
  const setActiveId = useAccounts((s) => s.setActiveId)
  const active = accounts.find((a) => a.id === activeId) ?? accounts[0]
  const others = accounts.filter((a) => a.id !== active.id)

  return (
    <div className="flex flex-col gap-1 px-3 pb-2">
      <AccountRow account={active} active />
      {others.map((account) => (
        <button
          key={account.id}
          type="button"
          onClick={() => {
            setActiveId(account.id)
            onClose()
          }}
          className="text-left"
        >
          <AccountRow account={account} />
        </button>
      ))}
      <Link
        to="/signup/connect-instagram"
        className="mt-1 flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-2.5 text-sm font-medium text-blue-text transition-colors hover:bg-blue-tint/40"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-tint">
          <Plus className="h-4 w-4" />
        </span>
        Add account
      </Link>
    </div>
  )
}

function AccountRow({ account, active = false }) {
  const isDisconnected = account.connectionState === 'disconnected'
  return (
    <div
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
        active ? 'bg-blue-tint' : 'hover:bg-bg'
      }`}
    >
      <Avatar account={account} />
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm font-medium ${
            active ? 'text-blue-text' : 'text-text-primary'
          }`}
        >
          @{account.username}
        </p>
        {isDisconnected ? (
          <p className="flex items-center gap-1 truncate text-xs font-medium text-red-text">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            Disconnected
          </p>
        ) : (
          <p className="truncate text-xs text-text-muted">
            {account.followers?.toLocaleString() ?? 0} followers
          </p>
        )}
      </div>
      {active && <Check className="h-4 w-4 shrink-0 text-blue-text" aria-hidden="true" />}
    </div>
  )
}

function Avatar({ account }) {
  const dotColor = (state) => {
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
  return (
    <div className="relative h-9 w-9 shrink-0">
      {account.profilePic ? (
        <img
          src={account.profilePic}
          alt=""
          className="h-9 w-9 rounded-full object-cover ring-1 ring-border"
        />
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-tint text-xs font-semibold text-blue-text ring-1 ring-border">
          {account.username?.[0]?.toUpperCase() || '?'}
        </div>
      )}
      {account.connectionState && (
        <span
          aria-hidden
          className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 border-surface ${dotColor(account.connectionState)}`}
        />
      )}
    </div>
  )
}

