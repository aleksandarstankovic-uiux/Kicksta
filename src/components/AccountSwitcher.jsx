import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, ChevronsUpDown, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccounts } from '@/stores/useAccounts'

// Instagram account switcher — single trigger row showing the active
// account, dropdown panel listing every other connected account plus
// an "Add account" affordance. One implementation, two consumers:
//
//   - Desktop sidebar — `<AccountSwitcher collapsed={collapsed} />`.
//     Trigger row matches the sidebar's row styling. Dropdown opens
//     below the trigger when expanded, or to the right when the
//     sidebar is collapsed.
//   - Mobile drawer — `<AccountSwitcher onAccountSwitched={closeDrawer} />`.
//     Same trigger + dropdown; the optional callback dismisses the
//     drawer when the user picks an account so the change reflects
//     immediately on the page below.
//
// Dropdown is capped at `max-h-[60vh]` with overflow scroll so 5 / 10
// / 20 accounts all fit gracefully without blowing out the parent.
export default function AccountSwitcher({ collapsed = false, onAccountSwitched }) {
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

  const handlePick = (account) => {
    setActiveId(account.id)
    setOpen(false)
    onAccountSwitched?.(account)
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
        <Avatar account={active} />
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
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-40 w-72 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-xl',
            // Collapsed sidebar: dropdown opens to the right of the
            // narrow icon strip. Expanded sidebar / drawer: opens
            // below the trigger.
            collapsed ? 'left-full top-0 ml-2' : 'left-0 top-full mt-2',
          )}
        >
          <div className="flex max-h-[60vh] flex-col overflow-y-auto px-1 py-1">
            {/* Active account — pinned at the top, marked with a check. */}
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
                    onClick={() => handlePick(account)}
                    aria-label={`Switch to @${account.username}`}
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

// Connection-state → dot color (mirrors AccountCard's avatar-dot
// pattern so the same IG connection state reads the same everywhere).
function statusDotColor(state) {
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

function Avatar({ account, size = 'h-8 w-8' }) {
  return (
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
}

// Plan badge — mirrors the plan pill on AccountCard ("Advanced" /
// "Growth") so users read their current tier at a glance across every
// account in the list.
function PlanPill({ plan }) {
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
function SubLine({ account }) {
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
