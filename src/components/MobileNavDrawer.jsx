import { useEffect, useRef } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Target,
  TrendingUp,
  Settings as SettingsIcon,
  AlertTriangle,
  Check,
  Plus,
  Sun,
  Moon,
  LogOut,
  X,
  Menu,
} from 'lucide-react'
import { useThemeStore } from '@/stores/useThemeStore'
import { useAccounts } from '@/stores/useAccounts'
import { useNavDrawer } from '@/stores/useNavDrawer'

// Mobile primary navigation drawer. Trigger lives in the top-left
// of the mobile header. Drawer structure mirrors the desktop sidebar
// so users see the same hierarchy on both surfaces:
//
//   1. Instagram account switcher (active + others + Add account)
//   2. Primary nav (Overview · Targeting · Engagement · Settings)
//   3. Bottom — theme toggle + Log out
//
// Profile/identity is intentionally not surfaced here. Account info
// is reachable via Settings in the primary nav.
const NAV_TABS = [
  { to: '/', icon: BarChart3, label: 'Overview', end: true },
  { to: '/targeting', icon: Target, label: 'Targeting' },
  { to: '/engagement', icon: TrendingUp, label: 'Engagement' },
  { to: '/account', icon: SettingsIcon, label: 'Settings' },
]

export default function MobileNavDrawer() {
  const open = useNavDrawer((s) => s.open)
  const openDrawer = useNavDrawer((s) => s.openDrawer)
  const closeDrawer = useNavDrawer((s) => s.closeDrawer)
  const setOpen = (next) => (next ? openDrawer() : closeDrawer())
  const panelRef = useRef(null)
  const triggerRef = useRef(null)
  const { pathname } = useLocation()

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
        {/* Compact close-button bar. No identity card — profile info
            lives in Settings; the drawer is just navigation. */}
        <div className="flex shrink-0 items-center justify-end border-b border-border px-2 py-2">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable body — Instagram accounts (top) → Primary nav →
            empty space → Bottom (theme + log out). */}
        <div className="flex flex-1 flex-col overflow-y-auto">
          {/* Instagram accounts — sits at the top so the user picks
              "who" before "where." Tapping a non-active row promotes
              that account; the drawer closes via the route-change
              effect when the user navigates next, and we also dismiss
              explicitly here so the change reflects immediately. */}
          <SectionLabel>Instagram accounts</SectionLabel>
          <AccountSwitcherList accounts={accounts} activeId={activeId} onClose={() => setOpen(false)} />

          {/* Primary nav — same set as the desktop sidebar so both
              surfaces agree on what counts as "the navigation." */}
          <SectionLabel>Pages</SectionLabel>
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

          {/* Spacer pushes the bottom group to the bottom of the
              drawer when the panel is taller than the content. */}
          <div className="flex-1" />

          {/* Bottom group — theme toggle + Log out. Mirrors the
              desktop sidebar's bottom zone (sans Collapse, which is
              meaningless on mobile). */}
          <div className="flex flex-col gap-1 border-t border-border px-3 py-3">
            <button
              type="button"
              onClick={toggleTheme}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 shrink-0" aria-hidden="true" />
              ) : (
                <Moon className="h-5 w-5 shrink-0" aria-hidden="true" />
              )}
              {theme === 'dark' ? 'Light mode' : 'Dark mode'}
            </button>
            <button
              type="button"
              onClick={() => {
                // V1 stub — replace with auth.signOut() when backend lands.
                setOpen(false)
              }}
              className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
            >
              <LogOut className="h-5 w-5 shrink-0" />
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
        <AccountRow
          key={account.id}
          account={account}
          onClick={() => {
            setActiveId(account.id)
            onClose()
          }}
        />
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

// AccountRow renders as a `<div>` when display-only (the active row)
// and as a `<button>` when interactive (a non-active account that
// can be switched to). Wrapping the row in a `<button>` previously
// produced a confused a11y tree where the button label was the
// concatenation of every descendant; this version gives screen
// readers a clean "Switch to @username" affordance and marks the
// active row with `aria-current="true"`.
function AccountRow({ account, active = false, onClick }) {
  const isDisconnected = account.connectionState === 'disconnected'
  const baseClasses =
    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors'
  const stateClasses = active ? 'bg-blue-tint' : 'hover:bg-bg'
  const usernameClasses = `truncate text-sm font-medium ${
    active ? 'text-blue-text' : 'text-text-primary'
  }`

  const inner = (
    <>
      <Avatar account={account} />
      <div className="min-w-0 flex-1">
        <p className={usernameClasses}>@{account.username}</p>
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
    </>
  )

  if (active) {
    return (
      <div className={`${baseClasses} ${stateClasses}`} aria-current="true">
        {inner}
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Switch to @${account.username}`}
      className={`${baseClasses} ${stateClasses}`}
    >
      {inner}
    </button>
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

