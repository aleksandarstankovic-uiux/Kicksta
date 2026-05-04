import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  User,
  CreditCard,
  AtSign,
  CheckCircle2,
  AlertTriangle,
  Sun,
  Moon,
  LogOut,
} from 'lucide-react'
import { useUserProfile } from '@/stores/useUserProfile'
import { useThemeStore } from '@/stores/useThemeStore'
import { useAccounts } from '@/stores/useAccounts'
import useDismissOnOutsideClick from '@/hooks/useDismissOnOutsideClick'

// Desktop-only account dropdown anchored in the sidebar bottom slot.
// Mobile uses MobileNavDrawer instead — the previous "compact"
// trigger variant for the mobile header was removed when the
// dropdown duplicated the drawer's contents on small viewports.
//
// All data flows from stores so edits anywhere propagate here for
// free. The IG connection row is informational — not clickable —
// but contains an inline "Reconnect" link when the active account
// is disconnected.
export default function ProfileDropdown({ collapsed = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useDismissOnOutsideClick(ref, open, () => setOpen(false))

  const firstName = useUserProfile((s) => s.firstName)
  const lastName = useUserProfile((s) => s.lastName)
  const email = useUserProfile((s) => s.email)
  const fullName = `${firstName} ${lastName}`.trim() || 'Account'

  const theme = useThemeStore((s) => s.theme)
  const toggleTheme = useThemeStore((s) => s.toggleTheme)

  const accounts = useAccounts((s) => s.accounts)
  const activeId = useAccounts((s) => s.activeId)
  const activeAccount = accounts.find((a) => a.id === activeId) ?? accounts[0]
  const isConnected = activeAccount?.connectionState === 'connected'

  const initials = (firstName?.[0] ?? '') + (lastName?.[0] ?? '')

  return (
    <div ref={ref} className="relative">
      <SidebarPillTrigger
        collapsed={collapsed}
        fullName={fullName}
        email={email}
        initials={initials || '·'}
        onClick={() => setOpen((v) => !v)}
      />

      {open && (
        <div
          // Opens upward + rightward so the panel doesn't collide
          // with the top of the bottom sidebar slot.
          className="absolute bottom-full left-0 z-50 mb-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl border border-border bg-surface shadow-xl"
        >
          {/* Identity header */}
          <div className="flex items-center gap-3 border-b border-border px-4 py-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-tint text-sm font-semibold text-blue-text">
              {initials || '·'}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-text-primary">{fullName}</p>
              <p className="truncate text-xs text-text-secondary">{email}</p>
            </div>
          </div>

          {/* Account links */}
          <div className="flex flex-col py-1">
            <DropdownLink to="/account/profile" icon={User} label="Account details" onClick={() => setOpen(false)} />
            <DropdownLink to="/account/billing" icon={CreditCard} label="Plan & billing" onClick={() => setOpen(false)} />
          </div>

          {/* IG connection — informational status row, inline
              Reconnect link when disconnected. */}
          <div className="flex items-center gap-3 border-t border-border px-4 py-2.5">
            <AtSign className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-text-secondary">Instagram</p>
              {isConnected ? (
                <p className="flex items-center gap-1 text-sm text-text-primary">
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-base" aria-hidden="true" />
                  <span className="truncate">@{activeAccount?.username}</span>
                </p>
              ) : (
                <p className="flex items-center gap-1 text-sm text-text-primary">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-base" aria-hidden="true" />
                  <span className="truncate">Disconnected — </span>
                  <Link
                    to="/signup/connect-instagram"
                    onClick={() => setOpen(false)}
                    className="font-medium text-blue-text hover:underline"
                  >
                    Reconnect
                  </Link>
                </p>
              )}
            </div>
          </div>

          {/* Theme toggle — single row that flips on click. Calls
              the existing `toggleTheme` action so the active value
              reads from the store on every render and the button
              label always shows the *target* theme. */}
          <button
            type="button"
            onClick={toggleTheme}
            className="flex w-full items-center gap-3 border-t border-border px-4 py-2.5 text-left text-sm font-medium text-text-primary transition-colors hover:bg-bg"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
            ) : (
              <Moon className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
            )}
            {theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          </button>

          {/* Log out */}
          <div className="border-t border-border py-1">
            <button
              type="button"
              onClick={() => {
                // V1: stub. Replace with real auth.signOut() when backend lands.
                setOpen(false)
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm font-medium text-text-primary hover:bg-bg"
            >
              <LogOut className="h-4 w-4 shrink-0" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Trigger inside the desktop sidebar bottom slot. Reads as a row
// of nav so it visually belongs with the Settings/Collapse/Logout
// stack below the main tabs.
function SidebarPillTrigger({ collapsed, fullName, email, initials, onClick }) {
  if (collapsed) {
    return (
      <button
        onClick={onClick}
        title={fullName}
        aria-label="Account menu"
        className="flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-tint text-xs text-blue-text">
          {initials}
        </span>
      </button>
    )
  }
  return (
    <button
      onClick={onClick}
      aria-label="Account menu"
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-bg"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-tint text-xs font-semibold text-blue-text">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-primary">{fullName}</p>
        <p className="truncate text-xs text-text-secondary">{email}</p>
      </div>
    </button>
  )
}

function DropdownLink({ to, icon: Icon, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
    >
      <Icon className="h-4 w-4 shrink-0 text-text-secondary" />
      {label}
    </Link>
  )
}
