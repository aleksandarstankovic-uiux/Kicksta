import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { AlertTriangle, Check, ChevronRight, ChevronsUpDown, Globe, Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccounts } from '@/stores/useAccounts'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { findServer } from '@/mocks/servers'
import ChangeServerModal from '@/pages/account/ChangeServerModal'

// Instagram account switcher — single trigger row showing the active
// account plus a panel listing every connected account and an
// "Add account" affordance. Two variants:
//
//   - `variant="dropdown"` (default) — desktop sidebar. Panel opens
//     below the trigger as an absolutely-positioned floating menu.
//   - `variant="sheet"` — mobile drawer. Panel opens as a fixed
//     bottom sheet (z-[60], full-width, slides up over the drawer)
//     so it doesn't overlay the rest of the drawer's nav.
//
// Optional `onAccountSwitched` callback fires when the user picks
// a different account — the drawer wires this to its own
// `closeDrawer` so the change reflects immediately on the page below.
export default function AccountSwitcher({
  collapsed = false,
  variant = 'dropdown',
  onAccountSwitched,
}) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [serverModalOpen, setServerModalOpen] = useState(false)
  const accounts = useAccounts((s) => s.accounts)
  const activeId = useAccounts((s) => s.activeId)
  const setActiveId = useAccounts((s) => s.setActiveId)
  const subscriptions = useSubscriptions((s) => s.subscriptions)
  const ref = useRef(null)

  // Click-outside + ESC dismissal — only used by the dropdown
  // variant; the sheet variant uses an explicit backdrop click and
  // its own ESC handler below.
  useEffect(() => {
    if (!open || variant !== 'dropdown') return
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
  }, [open, variant])

  // Sheet animation — same `mounted + 2× rAF` pattern used by
  // AddTargetSheet and the modal sheets across the app.
  useEffect(() => {
    if (variant !== 'sheet') return
    if (open) {
      setMounted(false)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setMounted(true))
      })
      function onKey(e) {
        if (e.key === 'Escape') setOpen(false)
      }
      document.addEventListener('keydown', onKey)
      return () => document.removeEventListener('keydown', onKey)
    }
    setMounted(false)
  }, [open, variant])

  const active = accounts.find((a) => a.id === activeId) ?? accounts[0]
  const others = accounts.filter((a) => a.id !== active.id)
  const activeSubscription = subscriptions.find((s) => s.accountId === active.id) ?? null
  const server = activeSubscription ? findServer(activeSubscription.server) : null

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

      {/* Dropdown variant — absolute panel below the trigger. */}
      {open && variant === 'dropdown' && (
        <div
          role="menu"
          className={cn(
            'absolute z-40 w-72 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-border bg-surface shadow-xl',
            collapsed ? 'left-full top-0 ml-2' : 'left-0 top-full mt-2',
          )}
        >
          <div className="flex max-h-[60vh] flex-col overflow-y-auto px-1 py-1">
            <PanelContent
              active={active}
              others={others}
              onPick={handlePick}
              onAddAccountClick={() => setOpen(false)}
              subscription={activeSubscription}
              server={server}
              onChangeServerClick={() => {
                setOpen(false)
                setServerModalOpen(true)
              }}
            />
          </div>
        </div>
      )}

      {/* Sheet variant — fixed bottom sheet rendered via portal to
          `document.body` so it escapes any transformed ancestor's
          containing block (the mobile drawer applies `translate-x-0`
          which would otherwise constrain `fixed` descendants to the
          drawer's width instead of the viewport). Backdrop and ESC
          both dismiss; z-[60] keeps this above the drawer (z-50).
          Sheet body uses generous `px-3 py-3` padding (vs. the
          dropdown's `px-1 py-1`) — tight padding looked stretched
          on a full-width sheet. */}
      {open &&
        variant === 'sheet' &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Switch Instagram account"
            className={`fixed inset-0 z-[60] flex items-end justify-center bg-black/40 transition-opacity duration-200 ${
              mounted ? 'opacity-100' : 'opacity-0'
            }`}
            onClick={() => setOpen(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className={`flex w-full max-h-[80vh] flex-col overflow-hidden rounded-t-2xl bg-surface shadow-xl transition-transform duration-200 ease-out ${
                mounted ? 'translate-y-0' : 'translate-y-full'
              }`}
            >
              <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
                <h3 className="text-base font-semibold text-text-primary">
                  Switch account
                </h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-text-muted hover:bg-bg hover:text-text-primary"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-col overflow-y-auto px-3 py-3">
                <PanelContent
                  active={active}
                  others={others}
                  onPick={handlePick}
                  onAddAccountClick={() => setOpen(false)}
                  density="comfy"
                  subscription={activeSubscription}
                  server={server}
                  onChangeServerClick={() => {
                    setOpen(false)
                    setServerModalOpen(true)
                  }}
                />
              </div>
            </div>
          </div>,
          document.body,
        )}

      {activeSubscription && createPortal(
        <ChangeServerModal
          open={serverModalOpen}
          subscription={activeSubscription}
          onClose={() => setServerModalOpen(false)}
        />,
        document.body,
      )}
    </div>
  )
}

// Shared panel content used by both variants. Active account row
// is pinned at the top with a check; other rows tap-to-switch;
// "Add account" routes to `/signup/ig-preview` — the first step of
// the dashboard's signup/onboarding flow.
//
// `density` controls row spacing: `'compact'` (default) for the
// desktop dropdown, `'comfy'` for the mobile bottom sheet which
// otherwise looked cramped.
function PanelContent({
  active,
  others,
  onPick,
  onAddAccountClick,
  density = 'compact',
  subscription,
  server,
  onChangeServerClick,
}) {
  const rowClasses =
    density === 'comfy'
      ? 'flex items-center gap-3 rounded-lg px-3 py-3'
      : 'flex items-center gap-2 rounded-md px-2 py-2'

  return (
    <>
      <div className="overflow-hidden rounded-lg bg-bg">
        <div className={rowClasses}>
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

        {server && onChangeServerClick && (
          <button
            type="button"
            onClick={onChangeServerClick}
            aria-label={`Change server for @${active.username} (currently ${server.city})`}
            className="flex w-full items-center gap-2 border-t border-border/70 px-3 py-2 text-left transition-colors hover:bg-bg/40"
          >
            <Globe className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
            <span className="min-w-0 flex-1 truncate text-xs text-text-secondary">
              <span className="font-medium text-text-primary">{server.city}</span>
              <span className="mx-1 text-text-muted">·</span>
              <span>{server.country}</span>
            </span>
            <ChevronRight className="h-3 w-3 shrink-0 text-text-muted" aria-hidden="true" />
          </button>
        )}
      </div>

      {others.length > 0 && (
        <>
          <div className="mx-2 my-1 h-px bg-border" aria-hidden />
          {others.map((account) => (
            <button
              key={account.id}
              role="menuitem"
              type="button"
              onClick={() => onPick(account)}
              aria-label={`Switch to @${account.username}`}
              className={`${rowClasses} text-left transition-colors hover:bg-bg`}
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
        to="/signup/ig-preview"
        role="menuitem"
        onClick={onAddAccountClick}
        className={`${rowClasses} text-sm font-medium text-blue-text transition-colors hover:bg-blue-tint`}
      >
        <span
          aria-hidden
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-tint"
        >
          <Plus className="h-4 w-4" />
        </span>
        Add account
      </Link>
    </>
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
