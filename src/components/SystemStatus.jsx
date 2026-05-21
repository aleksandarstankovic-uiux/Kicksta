import { useState, useRef, useEffect } from 'react'
import {
  Activity,
  Target,
  Server,
  Wifi,
  Zap,
  CheckCircle2,
  XCircle,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAccounts } from '@/stores/useAccounts'
import { useUserStore } from '@/stores/useUserStore'
import { mockTargets } from '@/mocks/targets'
import { mockGrowthConfig } from '@/mocks/growthConfig'

// Shared, layout-level system-health component. Previously lived inside
// the Overview page header; it's now mounted by DashboardLayout so every
// route (not just Overview) gets the same quick diagnostic surface.
//
// Exports three trigger variants that all open the same 5-row status
// panel but fit different chrome:
//   - SystemStatusRow              → sidebar row (expanded)
//   - SystemStatusRow(collapsed)   → sidebar icon-only (collapsed)
//   - SystemStatusIconButton       → mobile header 40×40 icon

function useStatusChecks() {
  const accounts = useAccounts((s) => s.accounts)
  const activeId = useAccounts((s) => s.activeId)
  const connection = accounts.find((a) => a.id === activeId) ?? accounts[0]
  const user = useUserStore((s) => s.user)

  const connectionConfig = {
    connected: { label: 'Connected', ok: true },
    warming_up: { label: 'Warming up', ok: true },
    disconnected: { label: 'Disconnected', ok: false },
    never_logged_in: { label: 'Not connected', ok: false },
  }
  const conn = connectionConfig[connection.connectionState]
  const activeTargets = mockTargets.filter((t) => t.status === 'active')
  const hasTargets = activeTargets.length > 0
  const engineRunning = connection.connectionState === 'connected' && hasTargets
  const modeLabels = { auto: 'Auto', follow_only: 'Follow only', unfollow_only: 'Unfollow only' }

  const checks = [
    { label: 'System', detail: 'All systems operational', ok: true, icon: Server },
    { label: 'Instagram', detail: conn.label, ok: conn.ok, icon: Wifi },
    {
      label: 'Targets',
      detail: `${activeTargets.length} active target${activeTargets.length !== 1 ? 's' : ''}`,
      ok: hasTargets,
      icon: Target,
    },
    {
      label: 'Growth engine',
      detail: engineRunning ? `Running · ${modeLabels[mockGrowthConfig.mode]}` : 'Paused',
      ok: engineRunning,
      icon: Activity,
    },
    // Growth+ is an optional paid add-on, not a health signal. Flag as
    // `informational` so `failing` excludes it (no yellow dot when the
    // user simply hasn't subscribed) and render it with a neutral
    // treatment in the panel. `ok` still reflects subscription state for
    // the row's icon styling.
    {
      label: 'Growth+',
      detail: user.growthPlusSubscribed ? 'Active' : 'Not subscribed',
      ok: user.growthPlusSubscribed,
      informational: true,
      icon: Zap,
    },
  ]

  // Only non-informational failing checks count toward the overall dot
  // (otherwise an unsubscribed user would perpetually see "1 check needs
  // attention" which is a false alarm — Growth+ is a choice, not an error).
  const failing = checks.filter((c) => !c.ok && !c.informational).length
  const dotClass =
    failing === 0 ? 'bg-green-base' : failing >= 2 ? 'bg-red-base' : 'bg-yellow-base'
  const ariaSummary =
    failing === 0
      ? 'all systems operational'
      : `${failing} check${failing > 1 ? 's' : ''} need attention`

  return { checks, failing, dotClass, ariaSummary }
}

// Shared 5-row panel content rendered inside whichever surface (sidebar
// dropdown, mobile bottom sheet) the trigger opens.
function StatusChecksList({ checks, onClose }) {
  return (
    <>
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-text-primary">System status</h3>
        <button
          onClick={onClose}
          aria-label="Close"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-text-muted hover:bg-bg hover:text-text-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <div className="flex flex-col px-2 py-1">
        {checks.map((check, i) => {
          // Three rendering modes per row:
          //   - ok + not informational → green chip, green check mark
          //   - ok + informational     → green chip, green check mark
          //   - not ok + informational → neutral grey chip, no trailing icon
          //                              (row is "you could have this" not "broken")
          //   - not ok + not info      → red chip, red X (real failure)
          const neutral = check.informational && !check.ok
          const chipBg = neutral
            ? 'bg-bg'
            : check.ok
              ? 'bg-green-tint'
              : 'bg-red-tint'
          const chipIconColor = neutral
            ? 'text-text-muted'
            : check.ok
              ? 'text-green-text'
              : 'text-red-text'
          return (
            <div key={check.label}>
              <div className="flex items-center gap-3 px-2 py-2.5">
                <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', chipBg)}>
                  <check.icon className={cn('h-4 w-4', chipIconColor)} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary">{check.label}</p>
                  <p className="text-xs text-text-muted">{check.detail}</p>
                </div>
                {neutral ? null : check.ok ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-base" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-red-base" />
                )}
              </div>
              {i < checks.length - 1 && <div className="mx-2 h-px bg-border" />}
            </div>
          )
        })}
      </div>
    </>
  )
}

// Desktop sidebar trigger — styled as a sibling of the Collapse / Log out
// rows at the bottom of the sidebar nav. Dropdown opens to the RIGHT of
// the sidebar, anchored to the trigger's bottom edge so it extends
// upward (trigger is low in the viewport). Collapsed variant shows only
// the icon with a status dot pinned top-right.
export function SystemStatusRow({ collapsed = false }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { checks, dotClass, ariaSummary } = useStatusChecks()

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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`System status — ${ariaSummary}`}
        onClick={() => setOpen((v) => !v)}
        title={collapsed ? `System status — ${ariaSummary}` : undefined}
        className={cn(
          'flex w-full items-center rounded-lg text-sm font-medium text-text-secondary transition-colors hover:bg-bg hover:text-text-primary',
          collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2.5',
        )}
      >
        {/* Collapsed: icon with a dot pinned top-right (mirrors the
            avatar-dot pattern). Expanded: icon + label + dot on the
            right for a sidebar-row read. */}
        <span className="relative flex h-5 w-5 shrink-0 items-center justify-center">
          <Activity className="h-5 w-5" />
          {collapsed && (
            <span
              className={cn(
                'absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface',
                dotClass,
              )}
            />
          )}
        </span>
        {!collapsed && (
          <>
            <span className="flex-1 text-left">System status</span>
            <span className={cn('h-2.5 w-2.5 shrink-0 rounded-full', dotClass)} aria-hidden />
          </>
        )}
      </button>

      {/* Dropdown — opens to the RIGHT of the sidebar, anchored to the
          button's bottom edge so a near-viewport-bottom trigger opens
          upward. `ml-4` accounts for the sidebar's own horizontal padding
          (px-3 on expanded, px-2 on collapsed) so the panel always clears
          the sidebar's right border instead of overlapping it. */}
      {open && (
        <div
          role="dialog"
          aria-label="System status"
          className="absolute bottom-0 left-full z-50 ml-4 w-80 overflow-hidden rounded-xl border border-border bg-surface shadow-xl"
        >
          <StatusChecksList checks={checks} onClose={() => setOpen(false)} />
        </div>
      )}
    </div>
  )
}

// Mobile header trigger — compact 40×40 icon button with a status dot
// pinned top-right. Click opens a bottom sheet using the same
// StatusChecksList. Sits in the mobile top bar (left slot) where the
// temporary Signup flow link used to live.
export function SystemStatusIconButton() {
  const [open, setOpen] = useState(false)
  const { checks, dotClass, ariaSummary } = useStatusChecks()

  // Outside click not needed — bottom sheet uses a backdrop to dismiss.
  useEffect(() => {
    if (!open) return
    function handleKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`System status — ${ariaSummary}`}
        onClick={() => setOpen(true)}
        className="relative flex h-10 w-10 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
      >
        <Activity className="h-5 w-5" />
        <span
          className={cn(
            'absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface',
            dotClass,
          )}
        />
      </button>

      {open && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="System status"
            className="fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-2xl border-t border-border bg-surface pb-[env(safe-area-inset-bottom)] shadow-xl"
          >
            <StatusChecksList checks={checks} onClose={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  )
}
