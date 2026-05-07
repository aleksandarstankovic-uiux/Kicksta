import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Target,
  TrendingUp,
  Settings as SettingsIcon,
  Sun,
  Moon,
  LogOut,
  X,
  Menu,
} from 'lucide-react'
import { useThemeStore } from '@/stores/useThemeStore'
import { useNavDrawer } from '@/stores/useNavDrawer'
import AccountSwitcher from '@/components/AccountSwitcher'
import kickstaFullLogo from '@/assets/kicksta-full-logo.svg'

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
        {/* Top bar — Kicksta wordmark left, close X right. Mirrors
            the desktop sidebar's logo header. */}
        <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
          <img src={kickstaFullLogo} alt="Kicksta" className="h-7" />
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
          {/* Instagram accounts — single trigger row showing the
              active account, dropdown opens below with the full list.
              Same component the desktop sidebar mounts. Capped at
              60vh + scroll inside, so 5 / 10 / 20 accounts all fit
              gracefully without blowing out the drawer. The optional
              `onAccountSwitched` callback dismisses the drawer when
              the user picks a different account so the change
              reflects on the page below immediately. */}
          <SectionLabel>Instagram accounts</SectionLabel>
          <div className="px-3 pb-2">
            <AccountSwitcher
              variant="sheet"
              onAccountSwitched={() => setOpen(false)}
            />
          </div>

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

          {/* Spacer fills the empty body region so the bottom group
              anchors to the drawer's bottom edge — standard nav
              drawer layout. */}
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

