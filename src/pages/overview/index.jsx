import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Target,
  ArrowRight,
  AlertTriangle,
  Clock,
  Activity,
  Flame,
  Settings,
  Settings2,
  MessageSquare,
  Search,
  UserMinus,
  UserPlus,
  Users,
  Heart,
  Shield,
  ChevronRight,
  Hash,
  Star,
  Pause,
  Play,
} from 'lucide-react'
import {
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { mockInstagram } from '@/mocks/instagram'
import { mockUser, PLAN_CATALOG } from '@/mocks/user'
import {
  mockGrowthDaily,
} from '@/mocks/growth'
import { mockTargets } from '@/mocks/targets'
import { mockGrowthConfig } from '@/mocks/growthConfig'
import { mockActivity } from '@/mocks/activity'
import {
  mockSystemStatus,
  mockSystemStatusFollowing,
  mockSystemStatusPaused,
} from '@/mocks/systemStatus'
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useToasts } from '@/stores/useToasts'
import { useTargetsStore } from '@/stores/useTargetsStore'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

// --- Helpers ---

function daysUntil(dateStr) {
  const diff = new Date(dateStr) - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

// Fine-grained remaining-time for the trial banner — returns a small
// object with the most appropriate unit so copy can read "in 11 hours"
// or "in 45 minutes" near the deadline.
function remainingTime(dateStr) {
  const ms = new Date(dateStr) - new Date()
  if (ms <= 0) return { value: 0, unit: 'minute' }
  const totalMinutes = Math.round(ms / 60000)
  if (totalMinutes < 60) return { value: totalMinutes, unit: 'minute' }
  const hours = Math.round(totalMinutes / 60)
  if (hours < 24) return { value: hours, unit: 'hour' }
  const days = Math.round(hours / 24)
  return { value: days, unit: 'day' }
}

// True when trial ends within the same calendar day as today (regardless
// of the exact hour). The last-day banner + "Trial period" label both
// anchor to this.
function isTrialLastDay(user) {
  if (!user?.isOnTrial || !user?.trialEndsAt) return false
  const endsAt = new Date(user.trialEndsAt)
  const now = new Date()
  // Same date AND still in the future (haven't crossed midnight yet).
  return endsAt.toDateString() === now.toDateString() && endsAt >= now
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

// --- Sub-components ---

// Trial header pill. Shown while the trial still has >= 1 full day left.
// On the last day the pill is suppressed and a full TrialBanner takes
// over at the top of the page (more detail, collapsible, dedicated CTA).
function TrialProgress({ user }) {
  if (!user.isOnTrial) return null
  if (isTrialLastDay(user)) return null

  const remaining = daysUntil(user.trialEndsAt)
  return (
    <span className="flex w-full items-center justify-center gap-2 rounded-lg border border-blue-base/20 bg-blue-tint px-3 py-1.5 sm:inline-flex sm:w-auto sm:py-1">
      <Clock className="h-3.5 w-3.5 shrink-0 text-blue-text" />
      <span className="text-xs font-semibold text-blue-text">
        Trial: {remaining} {remaining === 1 ? 'day' : 'days'} left
      </span>
    </span>
  )
}

// Last-day trial banner — replaces the small TrialProgress pill on the
// final day so the conversion moment gets proper real-estate. Compact
// single-row layout (on sm:+) keeps vertical space minimal for what's
// essentially an informational notice.
//
// Color is blue (info) because the trial-end is trial-related, and the
// design system reserves yellow for action-needed states (depleted
// targets, disconnected IG, health warnings). A diagonal gradient from
// blue-tint to a touch of blue-base warms the card; the icon chip uses
// solid blue-text + white glyph for crisp contrast on the tint bg.
function TrialBanner({ user }) {
  if (!user.isOnTrial || !isTrialLastDay(user)) return null

  const { value, unit } = remainingTime(user.trialEndsAt)
  const timeCopy =
    value <= 0
      ? 'Your trial ends shortly'
      : `Your trial ends in ${value} ${unit}${value === 1 ? '' : 's'}`

  const planInfo = PLAN_CATALOG[user.plan] ?? { name: 'your plan', price: null }
  // Reassurance copy — tell the user exactly what happens at billing
  // (automation keeps running, no manual step) so the deadline feels
  // routine, not alarming. Drops the old "or cancel anytime" line until
  // we actually ship a cancel path — it was promising something the page
  // can't deliver yet.
  const renewalCopy = planInfo.price != null
    ? `Kicksta will charge $${planInfo.price} for your ${planInfo.name} plan automatically. Your automation keeps running — no action needed on your end.`
    : `Kicksta will charge for your ${planInfo.name} plan automatically. Your automation keeps running — no action needed on your end.`

  return (
    <div className="rounded-xl border border-blue-base/20 bg-gradient-to-br from-blue-tint via-blue-tint to-blue-base/15 shadow-sm">
      <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:gap-4 sm:p-4">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-text text-surface shadow-sm"
          >
            <Clock className="h-4 w-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-snug text-blue-text">
              {timeCopy}
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-blue-text/90">
              {renewalCopy}
            </p>
          </div>
        </div>
        <Link
          to="/signup/plan-selection"
          className="inline-flex h-9 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-blue-text px-4 text-sm font-semibold text-surface transition-opacity hover:opacity-90 sm:w-auto"
        >
          Manage plan
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

// Compact inline sparkline for metric rows. Renders a monotone-free
// area chart (straight segments between real daily points — no smoothing
// that would misrepresent the data) at a small fixed height. Used for
// the AccountCard's headline metrics and intended for reuse across other
// dashboard cards once the pattern is approved.
//
// `data` is an array of `{ v: number }` points. Colors all sparklines in
// green to tie them to the site's growth accent — keeps the visual
// vocabulary consistent across every metric so the hue reads as "growth
// signal" rather than "per-metric category."
function Sparkline({ data, gradientId }) {
  // Unique gradient ID per instance so multiple sparklines on one page
  // don't collide on the SVG defs namespace. Kept small so the hero
  // value stays the dominant element in each metric card.
  return (
    <div className="h-6 w-16 shrink-0 lg:w-20">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-green-base)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-green-base)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="linear"
            dataKey="v"
            stroke="var(--color-green-base)"
            strokeWidth={1.5}
            fill={`url(#${gradientId})`}
            dot={false}
            isAnimationActive={true}
            animationDuration={400}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}




// --- AccountCard live status + pause CTA (v4 replacement for StatusPill) ---
//
// AccountLiveStatus renders the live activity line under the @handle:
// phase icon + human-readable phrase. Matches the Targeting page's
// LiveActivityCard so both surfaces stay in lockstep through the shared
// useSystemStatus hook.
//
// Animations:
// - Phase change: fade-in + slide-in-from-bottom via Tailwind's
//   animate-in utilities on a key-bound wrapper.
// - Pulse: the whole status line (icon + text) pulses together during
//   running phases via `animate-pulse`. Paused / setup states are
//   static so "nothing is happening" reads unambiguously.
//
// Icon tones (v4.1): varied per phase rather than a blanket green —
// `following` is the one positive-growth action (green); everything else
// that's running is `blue` (informational / work-in-progress); `setup`
// is yellow (action-needed); `paused` is muted.

const ACCOUNT_PHASE_LABEL = {
  analyzing: 'Currently searching for targets',
  following: 'Currently following',
  unfollowing: 'Currently unfollowing',
  waiting: 'Pausing between actions',
  warming_up: 'Warming up — growth starts within 72 hours',
  setup: 'Setup needed — add your first target to start',
  paused: 'Paused',
}

const ACCOUNT_PHASE_ICON = {
  analyzing: Search,
  following: UserPlus,
  unfollowing: UserMinus,
  waiting: Clock,
  warming_up: Flame,
  setup: Settings,
  paused: Pause,
}

function iconToneForPhase(phase) {
  if (phase === 'following') return 'text-green-base'
  if (phase === 'setup') return 'text-yellow-base'
  if (phase === 'paused') return 'text-text-muted'
  // analyzing / unfollowing / waiting / warming_up — informational blue.
  return 'text-blue-base'
}

function isRunningPhase(phase) {
  return (
    phase === 'analyzing' ||
    phase === 'following' ||
    phase === 'unfollowing' ||
    phase === 'waiting'
  )
}

function AccountLiveStatus({ status }) {
  const live = useSystemStatus()
  const isPaused = status.state === 'paused'

  // When the parent paused state is on, the hook still ticks phases
  // under the hood but the UI should present the stopped state. Force
  // phase to 'paused' when the parent says we're paused.
  const phase = isPaused ? 'paused' : live.phase
  const targetHandle =
    phase === 'following' || phase === 'unfollowing' ? live.targetHandle : null

  const PhaseIcon = ACCOUNT_PHASE_ICON[phase] ?? Clock
  const iconTone = iconToneForPhase(phase)
  const running = isRunningPhase(phase)

  const baseText = ACCOUNT_PHASE_LABEL[phase] || 'Idle'

  // Key drives the fade+slide transition on every phase/target change.
  const contentKey = `${phase}|${targetHandle || ''}`

  return (
    <div
      key={contentKey}
      className={`mt-1 flex min-w-0 items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300 ${
        running ? 'animate-pulse' : ''
      }`}
    >
      <PhaseIcon
        className={`h-4 w-4 shrink-0 ${iconTone}`}
        aria-hidden="true"
      />

      <p className="min-w-0 truncate text-sm text-text-secondary">
        {targetHandle ? (
          <>
            {baseText}{' '}
            <Link
              to="/targets"
              className="font-medium text-text-primary hover:underline"
            >
              {targetHandle}
            </Link>
          </>
        ) : (
          baseText
        )}
      </p>
    </div>
  )
}

// AccountPauseCTA — outlined ghost when running, filled-green primary
// when paused. Hidden entirely for warming_up / setup states.
function AccountPauseCTA({ status, onPauseToggle, className = '' }) {
  const isPaused = status.state === 'paused'
  const isHidden = status.state === 'warming_up' || status.state === 'setup'

  if (isHidden) return null

  const handleClick = () => {
    onPauseToggle?.()
    useToasts.getState().addToast({
      message: isPaused ? 'Growth resumed.' : 'Growth paused.',
      tone: 'success',
    })
  }

  if (isPaused) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-green-base px-4 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 ${className}`}
      >
        <Play className="h-4 w-4" aria-hidden="true" />
        Resume growth
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary transition-colors hover:bg-bg ${className}`}
    >
      <Pause className="h-4 w-4" aria-hidden="true" />
      Pause growth
    </button>
  )
}

// Shared visual primitive for the three metric components below. Kept
// internal to this file — the three named metric components are the
// public surface, MetricCard is just the self-contained card shape they
// share so the rendering stays consistent without duplicating JSX.
function MetricCard({
  icon: Icon,
  label,
  periodLabel,
  value,
  pill,
  pillClass,
  sparkData,
  gradientId,
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-4 lg:p-6">
      {/* Top row — primary label on the left, optional period hint on the
          right. Pulling the period to the corner keeps the primary label
          uncluttered and lets the eye pick up the time-window at a glance. */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-1.5 text-text-muted">
          <Icon className="h-3.5 w-3.5 shrink-0" />
          <p className="min-w-0 truncate text-xs font-medium leading-tight">{label}</p>
        </div>
        {periodLabel && (
          <span className="shrink-0 text-[11px] font-medium text-text-muted">
            {periodLabel}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <p className="text-xl font-semibold text-text-primary lg:text-2xl">{value}</p>
          {pill && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${pillClass}`}>
              {pill}
            </span>
          )}
        </div>
        <Sparkline data={sparkData} gradientId={gradientId} />
      </div>
    </div>
  )
}

// Total followers — all-time headline, not tied to the dashboard period
// switcher. Sparkline walks backward from the user's current follower
// count through the last 14 days of gains so every point = the running
// total at end-of-day, giving the chart an always-ascending silhouette.
//
// During trial, the baseline (followers at signup) renders inline next
// to the current count — "4,832 (4,739)" — keeping the whole trajectory
// on a single line without adding card height. The parenthesized number
// has a dotted underline + hover tooltip explaining what it represents.
function TotalFollowersMetric({ connection, data, period }) {
  const currentFollowers = connection?.followers ?? 0

  const sparkData = useMemo(() => {
    const last14 = data.slice(-14)
    let running = currentFollowers
    const arr = new Array(last14.length)
    for (let i = last14.length - 1; i >= 0; i--) {
      arr[i] = { v: running }
      running -= last14[i].targetedGain
    }
    return arr
  }, [currentFollowers, data])

  const baseline = useMemo(() => {
    if (period !== 'trial' || currentFollowers === 0) return null
    const trialSlice = getWindowSlice(data, 'trial')
    const gained = trialSlice.reduce((s, d) => s + d.targetedGain, 0)
    if (gained <= 0) return null
    return currentFollowers - gained
  }, [period, currentFollowers, data])

  const currentStr = currentFollowers.toLocaleString()
  const value =
    baseline != null ? (
      <span className="inline-flex items-baseline gap-1.5">
        <span>{currentStr}</span>
        {/* Inline baseline chip with tooltip. Smaller + muted so it
            reads as context for the hero number, not a competing value.
            Dotted underline + cursor-help signals the hover affordance. */}
        <span className="group/signup relative inline-block text-sm font-medium lg:text-base">
          <span
            tabIndex={0}
            aria-label={`${baseline.toLocaleString()} followers at signup`}
            className="cursor-help text-text-muted underline decoration-dotted decoration-text-muted/60 underline-offset-4 outline-none"
          >
            ({baseline.toLocaleString()})
          </span>
          <span
            role="tooltip"
            className="pointer-events-none absolute left-1/2 bottom-full z-10 mb-2 w-max max-w-[220px] -translate-x-1/2 rounded-lg bg-text-primary px-2.5 py-1.5 text-[11px] font-normal leading-relaxed text-surface opacity-0 shadow-lg transition-opacity group-hover/signup:opacity-100 group-focus-within/signup:opacity-100"
          >
            Followers at signup
          </span>
        </span>
      </span>
    ) : (
      currentStr
    )

  return (
    <MetricCard
      icon={Users}
      label="Total followers"
      periodLabel={null}
      value={value}
      sparkData={sparkData}
      gradientId="sparkTotal"
    />
  )
}

// Followers gained within the active period — sum of targetedGain across
// the window. Sparkline = per-day gains so the shape of the micro-chart
// matches the main chart for the same time range. The baseline (what the
// follower count started at) lives on Total followers now — on this card
// it's already a delta (+N), so the starting point would be redundant.
function FollowersGainedMetric({ data, period }) {
  const { total, sparkData } = useMemo(() => {
    const slice = getWindowSlice(data, period)
    return {
      total: slice.reduce((sum, d) => sum + d.targetedGain, 0),
      sparkData: slice.map((d) => ({ v: d.targetedGain })),
    }
  }, [data, period])

  return (
    <MetricCard
      icon={UserPlus}
      label="Followers gained"
      periodLabel={getPeriodLabel(period)}
      value={`+${total}`}
      sparkData={sparkData}
      gradientId="sparkGained"
    />
  )
}

// Follow-back rate within the active period — average daily rate across
// the window. Health pill ("Healthy / Average / Needs attention") uses
// the same thresholds as the rest of the dashboard so the vocabulary
// reads consistently wherever this metric appears.
function FollowBackRateMetric({ data, period }) {
  const { pct, sparkData, pill, pillClass } = useMemo(() => {
    const slice = getWindowSlice(data, period)
    const avg = slice.length
      ? slice.reduce((sum, d) => sum + d.followBackRate, 0) / slice.length
      : 0
    const pct = Math.round(avg * 100)
    const pill = pct >= 10 ? 'Healthy' : pct >= 5 ? 'Average' : 'Needs attention'
    const pillClass =
      pct >= 10
        ? 'bg-green-tint text-green-text'
        : pct >= 5
          ? 'bg-bg text-text-secondary'
          : 'bg-yellow-tint text-yellow-text'
    return {
      pct,
      sparkData: slice.map((d) => ({ v: +(d.followBackRate * 100).toFixed(1) })),
      pill,
      pillClass,
    }
  }, [data, period])

  return (
    <MetricCard
      icon={Activity}
      label="Follow-back rate"
      periodLabel={getPeriodLabel(period)}
      value={`${pct}%`}
      pill={pill}
      pillClass={pillClass}
      sparkData={sparkData}
      gradientId="sparkFollowBack"
    />
  )
}

function AccountCard({ connection, user, period, systemStatus, onPauseToggle }) {
  // Small connection-state dot pinned to the avatar — tells you IG is
  // connected / warming / disconnected at a glance. Live per-action state
  // lives in the StatusPill on the right of this card.
  const connDotConfig = {
    connected: 'bg-green-base',
    warming_up: 'bg-blue-base',
    disconnected: 'bg-red-base',
  }
  const connDot = connDotConfig[connection.connectionState]

  const planLabel = user.plan === 'advanced' ? 'Advanced' : 'Growth'

  return (
    <div className="rounded-xl border border-border bg-surface p-4 lg:p-6">
      <div className="flex items-start gap-3 sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="relative shrink-0">
            {connection.profilePic ? (
              <img
                src={connection.profilePic}
                alt={connection.username}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-border lg:h-12 lg:w-12"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-tint text-sm font-semibold text-blue-text ring-2 ring-border lg:h-12 lg:w-12 lg:text-base">
                {connection.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {connDot && (
              <span className={`absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface ${connDot}`} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* Identity row: @handle + plan pill + optional Trial pill. */}
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-text-primary lg:text-base">@{connection.username}</span>
              <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
                {planLabel}
              </span>
              {user.isOnTrial && (
                <span className="shrink-0 rounded-full bg-blue-tint px-2 py-0.5 text-xs font-medium text-blue-text">
                  Trial
                </span>
              )}
            </div>

            {/* Live status slots directly beneath the identity row,
                aligned with the handle (not the avatar) via the parent
                flex gap. Full name was removed in v4 — the handle is
                enough identity and this row carries the live signal. */}
            <AccountLiveStatus status={systemStatus} />
          </div>
        </div>

        {/* Desktop: Pause/Resume CTA sits to the right of the identity
            block. Replaces the old StatusPill. */}
        <div className="hidden shrink-0 sm:block">
          <AccountPauseCTA status={systemStatus} onPauseToggle={onPauseToggle} />
        </div>
      </div>

      {/* Mobile Pause/Resume — stacks below the identity block as a
          full-width button. Hidden on sm:+ where it's in the identity
          row instead. */}
      <div className="mt-3 sm:hidden">
        <AccountPauseCTA status={systemStatus} onPauseToggle={onPauseToggle} className="w-full" />
      </div>
    </div>
  )
}

function DisconnectedBanner() {
  return (
    <div className="rounded-xl border border-red-base/20 bg-red-tint p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-base/10">
          <AlertTriangle className="h-5 w-5 text-red-text" />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-text-primary">Instagram disconnected</h3>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            Your Instagram session ended. This is normal after a password change or security prompt — your account is safe. Reconnect to continue growing.
          </p>
          <button className="mt-3 inline-flex h-10 items-center justify-center rounded-lg bg-red-base px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90">
            Reconnect Instagram
          </button>
        </div>
      </div>
    </div>
  )
}

// Rich hover tooltip for the chart — structured after the reference layout:
// date header, identity row, 3-stat strip with the hovered bar highlighted,
// and a labeled daily-growth section. Surfaces running follower totals and
// follow-back rate in context so a hover reads as "here's what that day
// looked like on your account."
function GrowthBarTooltip({ active, payload, label, connection }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]
  if (!entry || entry.value == null) return null
  const d = entry.payload
  const isPredicted = !!d?.isPredicted

  const gained = d?.value ?? 0
  const total = d?.runningTotal
  const fbRate = Math.round((d?.followBackRate ?? 0) * 100)

  return (
    <div className="w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
      {/* Date header — matches the reference's muted "May 3" eyebrow.
          Predicted bars get a "Forecast" pill so the row carries time +
          confidence context at a glance. */}
      <div className="flex items-center justify-between px-4 pt-3 pb-2">
        <span className="text-xs text-text-muted">{label}</span>
        {isPredicted && (
          <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
            Forecast
          </span>
        )}
      </div>

      {/* Identity row — reuses the AccountCard's avatar + handle + full
          name pattern so the tooltip feels native to the rest of the page. */}
      {connection && (
        <div className="flex items-center gap-3 border-t border-border px-4 py-3">
          {connection.profilePic ? (
            <img
              src={connection.profilePic}
              alt={connection.username ?? ''}
              className="h-10 w-10 shrink-0 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-tint text-sm font-semibold text-blue-text">
              {connection.username?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-text-primary">
              @{connection.username ?? 'account'}
            </p>
            {connection.fullName && (
              <p className="truncate text-xs text-text-muted">{connection.fullName}</p>
            )}
          </div>
        </div>
      )}

      {/* 3-stat strip — running total on the left, hovered day's gained
          highlighted in a green-tint pill at center, follow-back rate on
          the right. The pill treatment mirrors the reference's highlighted
          "Followers" pill, pulled into our design system colors. */}
      <div className="grid grid-cols-3 items-center gap-2 border-t border-border px-4 py-3">
        <div className="text-center">
          <p className="text-base font-semibold text-text-primary">
            {total != null ? total.toLocaleString() : '—'}
          </p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
            Total
          </p>
        </div>
        <div className="rounded-lg bg-green-tint px-2 py-1.5 text-center">
          <p className="text-base font-semibold text-green-text">+{gained}</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-green-text">
            Gained
          </p>
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-text-primary">{fbRate}%</p>
          <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-text-muted">
            Follow-back
          </p>
        </div>
      </div>

      {/* Daily/projected growth in green — same accent as the bar fill so
          the hero number ties back to the bar the user is hovering. */}
      <div className="border-t border-border px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">
          {isPredicted ? 'Projected growth' : 'Daily growth'}
        </p>
        <p className="mt-1 text-base font-semibold text-green-text">
          +{gained} followers
        </p>
      </div>
    </div>
  )
}

function GrowthChart({ data, period, customRange, isOnTrial, connection, trialStart, trialEnd }) {
  // One bar per day. On trial we append a 7-day forecast to the end of
  // the window. Past bars render as solid green-striped fills; predicted
  // bars render as dashed-outlined green-tint bars so the eye instantly
  // separates measured history from expected future.
  const { chartData, tickInterval, hasPredicted, todayLabel, trialRange, summary } = useMemo(() => {
    const slice = getWindowSlice(data, period, customRange)
    if (slice.length === 0) {
      return { chartData: [], tickInterval: 0, hasPredicted: false, todayLabel: null, trialRange: null, summary: null }
    }

    // Running follower total — walk backwards from the user's current
    // count so "Total" in the tooltip reflects the follower count at the
    // END of each day. The last actual day anchors at `connection.followers`,
    // earlier days subtract their subsequent gains.
    const currentTotal = connection?.followers ?? 0
    const runningTotals = new Array(slice.length)
    let walkBack = currentTotal
    for (let i = slice.length - 1; i >= 0; i--) {
      runningTotals[i] = walkBack
      walkBack -= slice[i].targetedGain
    }

    // Historical bars — one per day with the actual gain as its value.
    // `date` is kept on the bar so the trial-range computation can
    // compare each bar to the user's trial window regardless of the
    // currently-selected period.
    const actualBars = slice.map((d, i) => ({
      label: formatDate(d.date),
      date: d.date,
      value: d.targetedGain,
      isPredicted: false,
      runningTotal: runningTotals[i],
      followBackRate: d.followBackRate,
    }))

    // Predicted bars — appended only for trial users on preset windows.
    // Custom ranges view a specific historical slice, so a projection
    // tail would sit outside the viewed window.
    //
    // The forecast is a linear-regression extrapolation of the last ~14
    // days: we fit a trend line to recent daily gain and continue it
    // forward. This keeps the forecast continuous with what the user
    // actually saw, and reflects whatever direction recent growth was
    // heading — accelerating, flat, or cooling. A small trial-warmup
    // boost is applied on top, and a floor/ceiling clamp keeps
    // predictions within plausible range of recent history.
    let predictedBars = []
    const shouldProject = isOnTrial && period !== 'custom'
    if (shouldProject) {
      const fitWindow = slice.slice(-Math.min(14, slice.length))
      const n = fitWindow.length
      const recentAvg = fitWindow.reduce((s, d) => s + d.targetedGain, 0) / n

      // Ordinary least-squares fit: y = slope*x + intercept. x = day
      // index within the window, y = daily gain.
      let slope = 0
      let intercept = recentAvg
      if (n >= 2) {
        let sumX = 0
        let sumY = 0
        let sumXY = 0
        let sumX2 = 0
        fitWindow.forEach((d, i) => {
          sumX += i
          sumY += d.targetedGain
          sumXY += i * d.targetedGain
          sumX2 += i * i
        })
        const denom = n * sumX2 - sumX * sumX
        if (denom !== 0) {
          slope = (n * sumXY - sumX * sumY) / denom
          intercept = (sumY - slope * sumX) / n
        }
      }

      // Clamp forecasts to 60%–180% of recent average so noisy fits
      // can't produce absurd projections.
      const floor = Math.max(1, Math.round(recentAvg * 0.6))
      const ceiling = Math.max(floor + 1, Math.round(recentAvg * 1.8))

      const projDays = 7
      const lastDate = new Date(slice[slice.length - 1].date)
      const avgFbRate = fitWindow.reduce((s, d) => s + d.followBackRate, 0) / n
      let forecastRunning = currentTotal
      for (let i = 1; i <= projDays; i++) {
        const next = new Date(lastDate)
        next.setDate(next.getDate() + i)
        const trendValue = intercept + slope * (n - 1 + i)
        // Gentle trial-warmup boost: +1% per day compounding, subtle
        // but visible over a week.
        const warmup = 1 + 0.01 * i
        const clamped = Math.min(ceiling, Math.max(floor, Math.round(trendValue * warmup)))
        forecastRunning += clamped
        predictedBars.push({
          label: formatDate(next.toISOString()),
          value: clamped,
          isPredicted: true,
          runningTotal: forecastRunning,
          followBackRate: avgFbRate,
        })
      }
    }

    const all = [...actualBars, ...predictedBars]

    // ~7 visible labels — interval=0 shows every label, higher values skip.
    const targetLabels = 7
    const tickInterval = Math.max(0, Math.ceil(all.length / targetLabels) - 1)

    // Label where the "Today" reference line sits — center of the last
    // actual (measured) bar, which IS today. Previously we placed it at
    // the first predicted bar, but Recharts centers reference-line
    // positions on the bar band, so that anchor put the line half a bar
    // past the right edge of the trial area (creating a visible gap).
    // Anchoring to the last actual bar tucks the line inside the trial
    // region cleanly and still reads as "today is here".
    const todayLabel = actualBars.length > 0 ? actualBars[actualBars.length - 1].label : null

    // Trial range — find which past bars fall inside the user's trial
    // window (createdAt → trialEndsAt). Computed from actual dates, not
    // period scope, so the trial caption persists into post-trial views
    // (e.g. a 30d window that includes the trial week keeps the mark).
    //
    // Uses LOCAL calendar-day comparison rather than raw timestamps to
    // dodge the timezone drift where `new Date('2026-04-15')` parses as
    // UTC midnight but trialStart is a local-time moment — that drift
    // was silently clipping the first trial day in non-UTC browsers.
    let trialRange = null
    if (trialStart && trialEnd && actualBars.length > 0) {
      const toLocalDayStr = (d) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const trialStartDay = toLocalDayStr(trialStart)
      const trialEndDay = toLocalDayStr(trialEnd)
      let startIdx = -1
      let endIdx = -1
      for (let i = 0; i < actualBars.length; i++) {
        const b = actualBars[i]
        if (b.date >= trialStartDay && b.date <= trialEndDay) {
          if (startIdx === -1) startIdx = i
          endIdx = i
        }
      }
      if (startIdx !== -1) {
        // Only `toLabel` is consumed now (drives the "Trial ends"
        // ReferenceLine); fromLabel is kept for future use / debugging.
        trialRange = {
          fromLabel: actualBars[startIdx].label,
          toLabel: actualBars[endIdx].label,
        }
      }
    }

    // Summary stats over measured bars only (forecast excluded). Feeds
    // the "+94 total · 13/day · best Apr 17 (+19)" caption above the
    // chart so the headline numbers don't require hovering.
    const measuredCount = actualBars.length
    let summary = null
    if (measuredCount > 0) {
      const totalGained = actualBars.reduce((s, b) => s + b.value, 0)
      const avgPerDay = Math.round(totalGained / measuredCount)
      const bestBar = actualBars.reduce((a, b) => (b.value > a.value ? b : a), actualBars[0])
      summary = {
        total: totalGained,
        avgPerDay,
        bestLabel: bestBar.label,
        bestValue: bestBar.value,
      }
    }

    return {
      chartData: all,
      tickInterval,
      hasPredicted: predictedBars.length > 0,
      todayLabel,
      trialRange,
      summary,
    }
  }, [data, period, customRange, isOnTrial, connection, trialStart, trialEnd])

  return (
    <div className="rounded-xl border border-border bg-surface p-4 lg:p-6">
      {/* Header row — title + trial-scope pill on the left, compact
          color legend on the right. Swatches mirror the bar treatments:
          striped fill for gained (past), dashed outline + tint for
          predicted (future). */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">Follower Growth</h2>
          {/* Trial scope indicator — matches the "Trial" pill pattern
              on the AccountCard plan label so the user reads the chart's
              numbers as trial-period data at a glance. */}
          {period === 'trial' && (
            <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
              Trial
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
            <span
              aria-hidden
              className="h-3 w-3 shrink-0 rounded-sm"
              style={{
                background:
                  'repeating-linear-gradient(45deg, var(--color-green-base) 0 3px, var(--color-green-text) 3px 5px)',
              }}
            />
            Gained
          </span>
          {hasPredicted && (
            <span className="inline-flex items-center gap-1.5 text-xs text-text-secondary">
              {/* Dashed border + tint fill mirrors the predicted bar shape
                  so the legend is a literal preview of the chart marks. */}
              <span
                aria-hidden
                className="h-3 w-3 shrink-0 rounded-sm border border-dashed border-green-base bg-green-tint"
              />
              Predicted
            </span>
          )}
        </div>
      </div>
      {/* Summary strip — matches the Growth Settings filter-pill pattern
          (bg-bg rounded-full chips with `label: value` inline). Reusing
          the design system's existing data-chip vocabulary here ties the
          chart's stats to the rest of the dashboard instead of inventing
          a bespoke treatment. `px-2` (vs Growth Settings' px-3) keeps
          all three pills on a single row on mobile (343px card) without
          wrapping; `text-xs` + `bg-bg` + `rounded-full` otherwise match. */}
      {summary && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-1 text-xs">
            <span className="text-text-muted">Total:</span>
            <span className="font-medium text-text-primary">+{summary.total}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-1 text-xs">
            <span className="text-text-muted">Avg/day:</span>
            <span className="font-medium text-text-primary">~{summary.avgPerDay}</span>
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-bg px-2 py-1 text-xs">
            <span className="text-text-muted">Best:</span>
            <span className="font-medium text-text-primary">
              {summary.bestLabel} (+{summary.bestValue})
            </span>
          </span>
        </div>
      )}
      <div className="mt-3 h-60 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, left: 0, bottom: 0 }}
            barCategoryGap="20%"
          >
            <defs>
              {/* Diagonal stripe for past/gained bars — ties the chart to the
                  design system's green growth color in both light and dark. */}
              <pattern
                id="barStripesGreen"
                width="8"
                height="8"
                patternUnits="userSpaceOnUse"
                patternTransform="rotate(45)"
              >
                <rect width="8" height="8" fill="var(--color-green-base)" />
                <rect width="4" height="8" fill="var(--color-green-text)" opacity="0.25" />
              </pattern>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              tickLine={false}
              axisLine={false}
              // `interval` here means "skip N labels between ticks" —
              // computed to land on ~7 visible date labels regardless of
              // window length. Start and end dates are always kept.
              interval={tickInterval}
            />
            <YAxis
              tick={{ fontSize: 11, fill: 'var(--color-text-muted)' }}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
              // Compact axis — default 60px eats visible card real-estate
              // for tick labels that rarely exceed 3 chars ("0"–"20"…).
              // 28px fits those labels with breathing room and lets the
              // bars push all the way to the card's left padding edge.
              width={28}
            />
            {/* Render-prop form so the tooltip component receives
                `connection` from the closure without prop-drilling
                through Recharts. */}
            {/* Cursor disabled — the column-highlight fill fought the
                trial bracket and felt disconnected from the actual bar
                being hovered. The hovered bar's own outline (via
                `activeBar` on <Bar>) is the hover affordance now. */}
            <Tooltip
              content={(props) => <GrowthBarTooltip {...props} connection={connection} />}
              cursor={false}
            />
            {/* Trial indicator lives below the chart's x-axis labels as
                a divider-with-label row (see the JSX below the
                ResponsiveContainer). An in-chart rail competed with the
                Today line + green striped bars; the below-chart label
                reads as a dedicated caption and matches the dashboard's
                existing pill/divider patterns. */}
            {/* Vertical markers — matching dashed-line style:
                  • Today (muted): marks the most recent measured bar.
                  • Trial ends (blue): marks the last bar of the user's
                    trial window. Blue, not yellow, because the trial is
                    informational — the design system reserves yellow
                    for action-needed states (depleted targets,
                    disconnected IG, low follow-back).
                If Today and Trial ends land on the same bar (user is
                currently on the last day of trial), only the "Trial
                ends" marker renders — the blue label carries more
                trial-relevant meaning than the generic "Today". */}
            {(() => {
              const trialEndLabel = trialRange?.toLabel ?? null
              const todayIsTrialEnd =
                todayLabel && trialEndLabel && todayLabel === trialEndLabel
              return (
                <>
                  {todayLabel && !todayIsTrialEnd && (
                    <ReferenceLine
                      x={todayLabel}
                      stroke="var(--color-border-strong)"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Today',
                        position: 'insideTopRight',
                        fill: 'var(--color-text-muted)',
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    />
                  )}
                  {trialEndLabel && (
                    <ReferenceLine
                      x={trialEndLabel}
                      stroke="var(--color-blue-text)"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Trial ends',
                        position: 'insideTopRight',
                        fill: 'var(--color-blue-text)',
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    />
                  )}
                </>
              )
            })()}
            {/* Single bar with per-data-point Cells — past bars render with
                the green stripe fill, future bars render as dashed-outlined
                green-tint so the forecast visibly reads as "sketched"
                rather than "measured". */}
            <Bar
              dataKey="value"
              radius={[8, 8, 8, 8]}
              maxBarSize={32}
              // Hover affordance: 1.5px dark outline on the bar itself
              // (replaces the old column-fill cursor). Darker stroke on
              // lighter chart bg reads as "this bar is focused".
              activeBar={{ stroke: 'var(--color-text-primary)', strokeWidth: 1.5 }}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={entry.isPredicted ? 'var(--color-green-tint)' : 'url(#barStripesGreen)'}
                  stroke={entry.isPredicted ? 'var(--color-green-base)' : undefined}
                  strokeWidth={entry.isPredicted ? 1.5 : 0}
                  strokeDasharray={entry.isPredicted ? '4 3' : undefined}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Trial end marker now lives inside the chart as a dashed
          vertical reference line (see "Trial ends" ReferenceLine above),
          mirroring the style of the "Today" marker. The below-chart
          duration caption was removed because it duplicated the
          information already surfaced by the in-chart marker + the
          "Trial" pill next to the title. */}
    </div>
  )
}

// Compact relative-time formatter for the activity feed ("2h ago", "1d ago").
function formatRelativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.max(1, Math.round(diffMs / 60000))
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay}d ago`
}

// Preset window options driven by the page's single PeriodSwitcher — feeds
// the chart, activity list, and AccountCard metrics. Update this (and the
// comment in src/mocks/activity.js) if the presets change.
const PERIOD_PRESETS = ['7d', '14d', '30d']
const PERIOD_TO_DAYS = { '7d': 7, '14d': 14, '30d': 30 }

// --- Window helpers ---
// Every time-bound widget (chart, activity feed, account metrics) reads through
// these helpers so presets and custom date ranges share one code path.

function getWindowDays(period, customRange) {
  if (period === 'custom' && customRange?.from && customRange?.to) {
    const from = new Date(customRange.from)
    const to = new Date(customRange.to)
    return Math.max(1, Math.round((to - from) / (1000 * 60 * 60 * 24)) + 1)
  }
  return PERIOD_TO_DAYS[period] ?? 7
}

// Slice a daily time-series (e.g. mockGrowthDaily) to the active window.
// `period === 'trial'` returns the trial window (last 7 days). Mock data
// covers 30 days but only the 7 most recent belong to the trial; the
// rest is pre-signup noise we don't actually have in production.
// Custom filters by explicit from/to dates. Presets use the tail.
function getWindowSlice(data, period, customRange) {
  if (period === 'trial') return data.slice(-7)
  if (period === 'custom' && customRange?.from && customRange?.to) {
    const fromMs = new Date(customRange.from).getTime()
    const toMs = new Date(customRange.to).getTime() + 24 * 60 * 60 * 1000 - 1
    return data.filter((d) => {
      const t = new Date(d.date).getTime()
      return t >= fromMs && t <= toMs
    })
  }
  const days = PERIOD_TO_DAYS[period] ?? 7
  return data.slice(-days)
}

// Filter an event list (activity feed) down to the active window. `trial`
// uses the 7-day trial window for the same reason getWindowSlice does —
// activity from before signup isn't the user's activity.
function filterByWindow(items, period, customRange, getDate = (i) => i.createdAt) {
  if (period === 'trial') {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
    return items.filter((i) => new Date(getDate(i)).getTime() >= cutoff)
  }
  if (period === 'custom' && customRange?.from && customRange?.to) {
    const fromMs = new Date(customRange.from).getTime()
    const toMs = new Date(customRange.to).getTime() + 24 * 60 * 60 * 1000 - 1
    return items.filter((i) => {
      const t = new Date(getDate(i)).getTime()
      return t >= fromMs && t <= toMs
    })
  }
  const days = PERIOD_TO_DAYS[period] ?? 7
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
  return items.filter((i) => new Date(getDate(i)).getTime() >= cutoff)
}

// Human label for the active window — drives the MetricCard corner caption
// and the activity feed empty-state copy. Trial-scope returns a fixed
// "Trial period" label that replaces the "Last N days" suffix.
function getPeriodLabel(period, customRange) {
  if (period === 'trial') return 'Trial period'
  if (period === 'custom' && customRange?.from && customRange?.to) {
    return `${formatDate(customRange.from)} – ${formatDate(customRange.to)}`
  }
  const days = PERIOD_TO_DAYS[period] ?? 7
  return `Last ${days} days`
}

// Page-level period switcher — segmented-control style. Container uses
// the page's `bg-bg` tone (slightly darker than surface cards) so the
// selected tab can pop as a raised white pill with a soft shadow.
//
// During the trial the switcher collapses to a single non-clickable
// "Trial period" pill — we only ever have <=7 days of signal while on
// trial, so multiple-option switching isn't meaningful yet. When the
// trial ends the component reverts to the three preset tabs (7d/14d/30d).
function PeriodSwitcher({ period, onPeriodChange, disabled = false }) {
  if (disabled) {
    return (
      <div
        role="group"
        aria-label="Time period"
        title="Time filters unlock after your trial ends"
        className="flex w-full items-center rounded-lg border border-border bg-bg p-0.5 sm:w-auto"
      >
        <span className="flex-1 rounded-md bg-surface px-4 py-1.5 text-center text-sm font-medium text-text-primary shadow-sm sm:flex-none">
          Trial period
        </span>
      </div>
    )
  }

  return (
    <div
      role="tablist"
      aria-label="Time period"
      className="flex w-full items-center gap-0.5 rounded-lg border border-border bg-bg p-0.5 sm:w-auto"
    >
      {PERIOD_PRESETS.map((p) => {
        const active = period === p
        return (
          <button
            key={p}
            role="tab"
            aria-selected={active}
            onClick={() => onPeriodChange(p)}
            className={`flex-1 shrink-0 rounded-md px-4 py-1.5 text-sm font-medium transition-colors sm:flex-none ${
              active
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {p}
          </button>
        )
      })}
    </div>
  )
}

function ActivityFeed({ items, period, customRange }) {
  // Filter to the active window, sort newest-first, then cap at 5 so
  // mobile and desktop show the same slice — on desktop the scrollable
  // list let longer history through, which made the two surfaces feel
  // inconsistent.
  const visible = filterByWindow(items, period, customRange)
    .slice()
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5)

  return (
    // h-full + min-h-0 lets the card stretch to the chart's height on
    // lg: and clip the scrollable list instead of pushing the column
    // taller. Mobile stacks below the chart and behaves as a natural
    // card (h-full resolves to content height there).
    <div className="flex h-full min-h-0 flex-col rounded-xl border border-border bg-surface p-4 lg:p-6">
      {/* Title on the left, Live pill pinned to the right — the pill
          (red-tint bg + red-text) keeps the live signal readable without
          stealing the card's chrome. */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-text-primary">Activity feed</h2>
        <span
          aria-label="Live feed"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-red-tint px-2.5 py-1"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-base opacity-60" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-base" />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wide text-red-text">
            Live
          </span>
        </span>
      </div>

      {visible.length === 0 ? (
        <div className="mt-4 flex flex-1 flex-col items-center justify-center gap-1 py-6 text-center">
          <p className="text-sm font-medium text-text-primary">No activity yet</p>
          <p className="text-xs text-text-secondary">
            Nothing in this range yet — try a longer period.
          </p>
        </div>
      ) : (
        <ul className="mt-4 flex min-h-0 flex-1 flex-col overflow-y-auto pr-1">
          {visible.map((item, i) => (
            <li
              key={item.id}
              className={`flex items-start gap-3 py-2.5 ${i > 0 ? 'border-t border-border' : ''}`}
            >
              {/* Bare icon — no chip background — since rows aren't interactive. */}
              {item.type === 'follow_back' ? (
                <UserPlus className="mt-0.5 h-4 w-4 shrink-0 text-green-text" />
              ) : (
                <Target className="mt-0.5 h-4 w-4 shrink-0 text-blue-text" />
              )}
              <div className="min-w-0 flex-1">
                {item.type === 'follow_back' ? (
                  <p className="text-sm leading-snug text-text-primary [overflow-wrap:anywhere]">
                    <span className="font-medium">{item.username}</span>{' '}
                    <span className="text-text-secondary">followed you back</span>
                  </p>
                ) : (
                  <p className="text-sm leading-snug text-text-primary [overflow-wrap:anywhere]">
                    <span className="font-medium">+{item.followed}</span>{' '}
                    <span className="text-text-secondary">follows via</span>{' '}
                    <span className="font-medium">{item.target}</span>
                  </p>
                )}
                <p className="mt-0.5 text-xs text-text-muted">
                  {formatRelativeTime(item.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function TargetsOverview({ plan }) {
  // Read targets from the live store so additions / removals / pause
  // changes made on the Targeting page are reflected here in real time.
  const targets = useTargetsStore((s) => s.targets)
  return <TargetsOverviewBody targets={targets} plan={plan} />
}

function TargetsOverviewBody({ targets, plan }) {
  const maxSlots = plan === 'advanced' ? 30 : 10
  const activeTargets = targets.filter((t) => t.status === 'active')

  // Sort active rows to the top (they're the ones the user can actually
  // influence), then queued, paused, depleted. Within each bucket we sort
  // by follow-back count descending so the best performers stay near the
  // top. Previously a single all-status sort put a depleted target at #1
  // and the star landed on row #2 — visually read as a bug.
  const STATUS_PRIORITY = { active: 0, queued: 1, paused: 2, depleted: 3 }
  const displayTargets = targets
    .slice()
    .sort((a, b) => {
      const pa = STATUS_PRIORITY[a.status] ?? 99
      const pb = STATUS_PRIORITY[b.status] ?? 99
      if (pa !== pb) return pa - pb
      return b.followBackCount - a.followBackCount
    })
    .slice(0, 7)

  // Top performer — highest follow-backs among active targets. Surfaces as a
  // star on that row so users can see their best-working source at a glance.
  const topTarget = activeTargets
    .slice()
    .sort((a, b) => b.followBackCount - a.followBackCount)[0]

  // Status pill recipes — match the TargetRow on the Targeting page so
  // the same target reads identically on both surfaces.
  const statusPillClass = {
    active: 'bg-green-tint text-green-text',
    queued: 'bg-blue-tint text-blue-text',
    paused: 'bg-bg text-text-secondary',
    depleted: 'bg-yellow-tint text-yellow-text',
  }
  const statusLabel = {
    active: 'Active',
    queued: 'Queued',
    paused: 'Paused',
    depleted: 'Depleted',
  }

  return (
    // h-full + flex-col so when the sibling Growth Settings card is taller,
    // this card's container stretches to match and the footer link stays
    // pinned to the bottom (via mt-auto).
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 lg:p-6">
      {/* Header row — title + compact slots-used pill. */}
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-text-primary">Top Targets</h2>
        <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
          {activeTargets.length}/{maxSlots} slots
        </span>
      </div>

      {/* Column header — establishes the Name | Follow-backs layout.
          px-3 matches the row padding so labels align with their columns. */}
      <div className="mt-4 flex items-center justify-between px-3 pb-2 text-[11px] font-medium uppercase tracking-wide text-text-muted">
        <span>Name</span>
        <span>Follow-backs</span>
      </div>

      <div className="flex flex-col">
        {displayTargets.map((target, i) => {
          const isTop = topTarget && target.id === topTarget.id
          const isDepleted = target.status === 'depleted'
          const isHashtag = target.type === 'hashtag'
          // Same avatar recipe as TargetRow on the Targeting page so
          // targets read the same visually across the dashboard.
          const handleStart = target.value.replace(/^[@#]/, '')
          const avatarLetter = handleStart.charAt(0).toUpperCase()
          return (
            <div
              key={target.id}
              // Depleted rows get a subtle grey wash + muted text so they
              // visually recede from the active ones.
              className={`flex items-center justify-between gap-3 px-3 py-3 ${
                i > 0 ? 'border-t border-border' : ''
              } ${isDepleted ? 'bg-bg' : ''}`}
            >
              {/* Left column: avatar + dot + name + (star | depleted pill) */}
              <div className="flex min-w-0 flex-1 items-center gap-2.5">
                {/* Avatar — Hash icon for hashtags, image when available,
                    or a letter chip. Matches the Targeting page row. */}
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-xs font-semibold text-text-secondary ${
                    isDepleted ? 'opacity-60' : ''
                  }`}
                >
                  {isHashtag ? (
                    <Hash className="h-3.5 w-3.5" aria-hidden="true" />
                  ) : target.profilePic ? (
                    <img
                      src={target.profilePic}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    avatarLetter
                  )}
                </div>

                <span
                  className={`truncate text-sm font-medium ${
                    isDepleted ? 'text-text-muted line-through' : 'text-text-primary'
                  }`}
                >
                  {target.value}
                </span>

                {isTop && (
                  <Star
                    className="h-3.5 w-3.5 shrink-0 fill-yellow-base text-yellow-base"
                    aria-label="Top performer"
                  />
                )}

                {/* Status pill — same recipe as the Targeting page row so
                    the same target reads identically on both surfaces. */}
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${statusPillClass[target.status]}`}
                >
                  {statusLabel[target.status]}
                </span>
              </div>

              {/* Right column: follow-back count */}
              <span
                className={`shrink-0 text-sm font-semibold tabular-nums ${
                  isDepleted ? 'text-text-muted' : 'text-text-primary'
                }`}
              >
                {target.followBackCount}
              </span>
            </div>
          )
        })}
      </div>

      {/* Centered CTA so the card's footer reads as a clear "more" action.
          mt-auto pins it to the bottom when the sibling card is taller. */}
      <div className="mt-auto flex justify-center pt-4">
        <Link
          to="/targets"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-text transition-colors hover:opacity-80"
        >
          View all targets
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

function GrowthSettingsSnapshot({ plan }) {
  // Read live config from the Zustand store so Mode / Engagement /
  // Filter changes made on the Growth page are reflected here.
  const config = useGrowthConfig((s) => s.config)
  return <GrowthSettingsSnapshotBody config={config} plan={plan} />
}

function GrowthSettingsSnapshotBody({ config, plan }) {
  const modeLabels = { auto: 'Auto', follow_only: 'Follow only', unfollow_only: 'Unfollow only' }
  const isAdvanced = plan === 'advanced'

  const toggles = [
    { label: 'Like after follow', icon: Heart, enabled: config.likeAfterFollow, locked: false },
    { label: 'Welcome DM', icon: MessageSquare, enabled: config.welcomeDm.enabled, locked: !isAdvanced },
    { label: 'Close Friends Adder', icon: Shield, enabled: config.closeFriendsAdder, locked: !isAdvanced },
  ]

  // Compact number formatter for filter pills. "5K" instead of "5,000" keeps
  // all six pills readable even when they share a single narrow row.
  const fmt = (n) => {
    if (n == null) return '∞'
    if (n >= 1000) return n % 1000 === 0 ? `${n / 1000}K` : `${(n / 1000).toFixed(1)}K`
    return String(n)
  }
  const range = (min, max) => (max == null ? `${fmt(min)}+` : `${fmt(min)}–${fmt(max)}`)

  const privacyLabel = {
    all: 'All',
    public: 'Public only',
    private: 'Private only',
  }[config.filters.accountPrivacy] ?? 'All'

  const genderLabel = config.filters.genderTarget
    ? config.filters.genderTarget === 'male'
      ? 'Male'
      : 'Female'
    : 'Any'

  // Six filter facets rendered as labelled pills — each one gets its own tag
  // so users can scan the surface area of the targeting filter at a glance.
  const filterPills = [
    { label: 'Following', value: range(config.filters.followingMin, config.filters.followingMax) },
    { label: 'Followers', value: range(config.filters.followerMin, config.filters.followerMax) },
    { label: 'Media', value: range(config.filters.mediaMin, config.filters.mediaMax) },
    { label: 'NSFW', value: config.filters.excludeNsfw ? 'Excluded' : 'Allowed' },
    { label: 'Privacy', value: privacyLabel },
    { label: 'Gender', value: genderLabel },
  ]

  return (
    // h-full + flex-col so the card stretches to match the sibling Targets
    // card's height when they sit side by side, and the Edit Growth footer
    // link pins to the bottom (via mt-auto).
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 lg:p-6">
      <h2 className="text-base font-semibold text-text-primary">Growth Settings</h2>

      {/* Rows share a py-3.5 rhythm with hairline dividers so the card reads
          like a settings summary sheet and fills the vertical space opened up
          by stacking Targets above it. */}
      <div className="mt-4 divide-y divide-border">
        <div className="flex items-center justify-between py-3.5">
          <div className="flex items-center gap-2.5">
            <Settings2 className="h-4 w-4 text-text-muted" />
            <span className="text-sm text-text-secondary">Mode</span>
          </div>
          <span className="rounded-full bg-blue-tint px-2.5 py-1 text-xs font-medium text-blue-text">
            {modeLabels[config.mode]}
          </span>
        </div>

        {toggles.map((toggle) => (
          <div key={toggle.label} className="flex items-center justify-between py-3.5">
            <div className="flex items-center gap-2.5">
              <toggle.icon className="h-4 w-4 text-text-muted" />
              <span className="text-sm text-text-secondary">{toggle.label}</span>
            </div>
            {toggle.locked ? (
              <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-text-muted">
                Advanced
              </span>
            ) : toggle.enabled ? (
              <span className="rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
                On
              </span>
            ) : (
              <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-text-muted">
                Off
              </span>
            )}
          </div>
        ))}

        <div className="py-4">
          <div className="flex items-center gap-2.5">
            <Target className="h-4 w-4 text-text-muted" />
            <span className="text-sm text-text-secondary">Filters</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {filterPills.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1 rounded-full bg-bg px-3 py-1 text-xs"
              >
                <span className="text-text-muted">{f.label}:</span>
                <span className="font-medium text-text-primary">{f.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Centered footer CTA mirrors Targets so the two side-by-side cards
          share a visual rhythm. mt-auto pins it to the bottom when the
          sibling card is taller. Copy is "Edit Growth" per product direction. */}
      <div className="mt-auto flex justify-center pt-4">
        <Link
          to="/growth"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-text transition-colors hover:opacity-80"
        >
          Edit Growth
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}

// --- Main Page ---

export default function OverviewPage() {
  // Selected preset period — only applies once the trial is over. While
  // on trial, everything scopes to 'trial' (the entire dataset) because
  // we have <=7 days of signal and no meaningful historical windows.
  const [selectedPeriod, setSelectedPeriod] = useState('7d')

  const connection = mockInstagram
  const user = mockUser
  const isDisconnected = connection.connectionState === 'disconnected'

  // Effective period — 'trial' while on trial, user-selected otherwise.
  // All downstream widgets read from this so the chart / feed / metric
  // cards all tell the same time-window story.
  const effectivePeriod = user.isOnTrial ? 'trial' : selectedPeriod

  // Local systemStatus state — lets the StatusPill's Pause/Resume button
  // actually do something in V1 (just flips the state). Real app will
  // sync this to the backend.
  const [systemStatus, setSystemStatus] = useState(mockSystemStatus)
  const handlePauseToggle = () => {
    setSystemStatus((curr) =>
      curr.state === 'paused'
        ? mockSystemStatusFollowing // resume
        : mockSystemStatusPaused,
    )
  }

  return (
    <div className="overflow-hidden px-4 py-6 md:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Header — greeting on the left, trial pill (or nothing on the
            last day, where TrialBanner below takes over) + period switcher
            on the right. PeriodSwitcher is hidden while on trial since
            there's only ever <=7 days of data and the metrics are
            automatically scoped to the "Trial period". */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
            {getGreeting()}, {user.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:shrink-0">
            <TrialProgress user={user} />
            <PeriodSwitcher
              period={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
              disabled={user.isOnTrial}
            />
          </div>
        </div>

        {/* Last-day trial banner — renders on the final day of the trial,
            replacing the small TrialProgress pill. Shows remaining time,
            renewal plan + price, and a Manage plan CTA. */}
        {isTrialLastDay(user) && (
          <div className="mt-4">
            <TrialBanner user={user} />
          </div>
        )}

        {/* Account card — identity + live StatusPill. Metrics live in
            their own cards below so this card stays focused on "who /
            what the engine is doing right now". */}
        <div className={isTrialLastDay(user) ? 'mt-4' : 'mt-6'}>
          <AccountCard
            connection={connection}
            user={user}
            period={effectivePeriod}
            systemStatus={systemStatus}
            onPauseToggle={handlePauseToggle}
          />
        </div>

        {/* Headline metrics — three separate cards (Total followers,
            Followers gained, Follow-back rate). Stacked on mobile,
            3-column grid on sm:+. Each card is self-contained so they
            can be rearranged or reused in other dashboards without
            inheriting AccountCard chrome. */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <TotalFollowersMetric connection={connection} data={mockGrowthDaily} period={effectivePeriod} />
          <FollowersGainedMetric data={mockGrowthDaily} period={effectivePeriod} />
          <FollowBackRateMetric data={mockGrowthDaily} period={effectivePeriod} />
        </div>

        {/* Warming up note */}
        {connection.connectionState === 'warming_up' && (
          <div className="mt-4 flex items-center gap-2 rounded-xl bg-blue-tint px-4 py-3">
            <Clock className="h-4 w-4 shrink-0 text-blue-text" />
            <p className="text-sm text-blue-text">
              Warming up — growth starts within 72 hours. Nothing to do on your end.
            </p>
          </div>
        )}

        {/* Disconnected Banner */}
        {isDisconnected && (
          <div className="mt-4">
            <DisconnectedBanner />
          </div>
        )}

        {/* Growth Chart + Recent activity — ~62/38 on desktop, stacked
            on mobile. On lg: the feed is absolutely positioned inside
            its grid cell so its intrinsic content height doesn't push
            the row taller than the chart — the chart card drives the
            row height and the feed scrolls within the allocated space. */}
        <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
          <GrowthChart
            data={mockGrowthDaily}
            period={effectivePeriod}
            isOnTrial={user.isOnTrial}
            connection={connection}
            // Pass the trial window as Date objects so the chart can
            // render the "Trial" bracket wherever trial-era bars land
            // (including post-trial views on 14d/30d windows).
            trialStart={user.createdAt ? new Date(user.createdAt) : null}
            trialEnd={user.trialEndsAt ? new Date(user.trialEndsAt) : null}
          />
          <div className="lg:relative">
            <div className="lg:absolute lg:inset-0">
              <ActivityFeed items={mockActivity} period={effectivePeriod} />
            </div>
          </div>
        </div>

        {/* Targets + Growth Settings — side by side on lg:, stacked on mobile.
            Both are targeting-related so they share a row as sibling cards. */}
        <div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
          {/* Both snapshots subscribe to the live Zustand stores so changes
              made on the Targeting / Growth pages propagate here. */}
          <TargetsOverview plan={user.plan} />
          <GrowthSettingsSnapshot plan={user.plan} />
        </div>
      </div>
    </div>
  )
}
