# Growth+ Page — Design Spec

**Date:** 2026-05-11
**Goal:** Build the dedicated Growth+ page at `/growth-plus`. The route is registered in the nav but currently lands on a blank screen. The page must feel like the paid surface it represents — premium visual treatment, exclusive framing, and a layered subscriber dashboard. Non-subscribers see the same dashboard, blurred and gated behind an in-page subscribe overlay (no redirect).

**Architecture:** New page `src/pages/growthPlus/`. Same outer chrome (DashboardLayout) for both states. `mockUser.growthPlusSubscribed` (with a Zustand override store for V1 state transitions) chooses between two top-level components:

- `<GrowthPlusActive>` — five-section subscriber dashboard.
- `<GrowthPlusLockedPreview>` — wraps `<GrowthPlusActive>` in a blurred, non-interactive container and floats a `<GrowthPlusSubscribeOverlay>` on top.

Subscribing from the overlay (via the shared `<GrowthPlusSubscribeModal>` confirm/processing/success flow) flips the Zustand flag and the page re-renders into the live subscriber dashboard inline.

**Tech stack:** React 19, Tailwind v4, Lucide React, Recharts 3 (for the sparkline), Zustand 5. No new dependencies. Reuses existing `useGrowthConfig` (extended) and `useAccounts`. The confirm/processing/success subscribe modal is extracted from `signup/steps/GrowthPlus.jsx` into a shared component used by both surfaces.

**Source brainstorm:** 2026-05-11 — pending queue item #1 from the 2026-05-08 session resume context.

---

## Item 1 — Page architecture + state model

**Why:** The page has two distinct audiences (subscribers and non-subscribers) and must serve both inline without a redirect. The locked-preview pattern lets the same component tree serve both states — non-subscribers see exactly what subscribers see, just blurred, so the page is its own value prop.

**Files:**
- Create: `src/pages/growthPlus/index.jsx`
- Modify: `src/App.jsx` (register the route)
- Create: `src/stores/useGrowthPlusSubscription.js` (V1 subscription-state flag — gets flipped to true when the user subscribes from the overlay; reads from `mockUser.growthPlusSubscribed` initially)

### `src/pages/growthPlus/index.jsx`

```jsx
import { mockUser } from '@/mocks/user'
import { useAccounts } from '@/stores/useAccounts'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import GrowthPlusActive from './GrowthPlusActive'
import GrowthPlusLockedPreview from './GrowthPlusLockedPreview'

export default function GrowthPlusPage() {
  // V1: subscription state is global (single user) — read from the
  // Zustand override first, fall back to mockUser.growthPlusSubscribed.
  // In production this becomes per-active-subscription via useSubscriptions.
  const subscribed = useGrowthPlusSubscription(
    (s) => s.subscribed ?? mockUser.growthPlusSubscribed,
  )
  const activeAccount = useAccounts((s) =>
    s.accounts.find((a) => a.id === s.activeId),
  )

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      {subscribed ? (
        <GrowthPlusActive account={activeAccount} />
      ) : (
        <GrowthPlusLockedPreview account={activeAccount} />
      )}
    </div>
  )
}
```

The `account` prop is passed through to child sections so future per-account real data can plug in without refactoring component signatures.

### `src/stores/useGrowthPlusSubscription.js`

```jsx
import { create } from 'zustand'

// V1 override flag for the user's Growth+ subscription state. Starts
// `null` (use mockUser.growthPlusSubscribed as the default). Flipped to
// `true` when the subscribe modal completes its success step on the
// Growth+ page; lets the dashboard re-render inline without mutating
// the mock data.
export const useGrowthPlusSubscription = create((set) => ({
  subscribed: null,
  markSubscribed: () => set({ subscribed: true }),
}))
```

### `src/App.jsx` registration

Current state: `DashboardLayout`'s nav has `{ to: '/growth-plus', icon: Sparkles, label: 'Growth+' }` but `App.jsx` has no `<Route path="/growth-plus">`. Verify and add:

```jsx
import GrowthPlusPage from '@/pages/growthPlus'

// inside the routes:
<Route path="/growth-plus" element={<GrowthPlusPage />} />
```

This sits alongside the existing `<Route path="/account/growth-plus" element={<AccountGrowthPlusPage />} />` (the subscription-management stub). Distinct routes.

**Acceptance:** Navigating to `/growth-plus` from the sidebar or mobile drawer renders the page. `mockUser.growthPlusSubscribed === true` shows the subscriber dashboard; `false` shows the locked-preview. Subscribing from the overlay flips state and re-renders into the dashboard without changing the URL.

---

## Item 2 — Hero card

**Why:** The hero is the page's visual anchor and the answer to "what am I paying for?" Single big number, premium surface, sparkles + sparkline. Distinct from every other card in the dashboard.

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusHero.jsx`
- Create: `src/hooks/useCountUp.js`

### `src/hooks/useCountUp.js`

```jsx
import { useEffect, useRef, useState } from 'react'

// Counts up from 0 to `target` over `duration` ms using requestAnimationFrame.
// Easing: easeOutQuart. Mount-only — no re-trigger on prop changes (V1 mocks
// are stable; production with live data should re-trigger on `target` change).
export function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    function tick(now) {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(Math.round(target * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // Intentionally mount-only — don't re-trigger when target changes in V1.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return value
}
```

### `src/pages/growthPlus/GrowthPlusHero.jsx`

Render shape:

```jsx
import { Sparkles } from 'lucide-react'
import { ResponsiveContainer, LineChart, Line } from 'recharts'
import { mockGrowthDaily, mockGrowthPlusInsights } from '@/mocks/growth'
import { useCountUp } from '@/hooks/useCountUp'

export default function GrowthPlusHero({ previewMode = false }) {
  const target = mockGrowthPlusInsights.algorithmicBoost
  // In preview mode we skip the count-up animation (the blur makes
  // animation feel wrong) and just render the static target.
  const value = previewMode ? target : useCountUp(target, 600)
  const data = mockGrowthDaily.map((d) => ({
    date: d.date,
    value: d.growthPlusGain,
  }))

  return (
    <section className="overflow-hidden rounded-xl border border-purple-base/20 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-text text-surface shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-text">
          GROWTH+
        </span>
        <span className="ml-auto rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
          Active
        </span>
      </div>

      <p className="mt-4 text-5xl font-semibold leading-none text-text-primary md:text-6xl">
        +{value}
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        extra followers from Growth+ this month
      </p>

      <div className="mt-4 h-16 md:h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-purple-base)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: 'var(--color-purple-base)' }}
              isAnimationActive={!previewMode}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
```

**Decisions baked in:**
- Counting from 0 over 600ms — feels snappy, not slow.
- Sparkline is `h-16` on mobile (64px), `h-20` on desktop (80px). Tight enough to feel like a polish detail, not a full chart.
- No axes, no gridlines, no tooltip on the sparkline. Hover shows the `activeDot` only.
- `previewMode` skips animations so the blurred non-subscriber view doesn't flicker.

**Acceptance:** Hero renders with a purple gradient surface, Sparkles + GROWTH+ eyebrow, green Active pill, animated count-up from 0 to 143, single sparkline line below.

---

## Item 3 — Supporting metrics strip

**Why:** Three stat cards under the hero give the page texture and second-tier proof. Each card is small, Growth+-flavored (purple icon chip), and uses existing data from `mockGrowthPlusInsights`.

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusMetricsStrip.jsx`
- Modify: `src/mocks/growth.js` (add `boostedPosts` field to `mockGrowthPlusInsights`)

### Mock change

In `src/mocks/growth.js`, change:

```js
export const mockGrowthPlusInsights = {
  algorithmicBoost: 143,
  postReachLift: 0.34,
  engagementRate: 0.048,
}
```

To:

```js
export const mockGrowthPlusInsights = {
  algorithmicBoost: 143,
  postReachLift: 0.34,
  engagementRate: 0.048,
  boostedPosts: 12,
}
```

### `src/pages/growthPlus/GrowthPlusMetricsStrip.jsx`

```jsx
import { Heart, Sparkles, TrendingUp } from 'lucide-react'
import { mockGrowthPlusInsights } from '@/mocks/growth'

const CARDS = [
  {
    key: 'reach',
    icon: TrendingUp,
    value: `+${Math.round(mockGrowthPlusInsights.postReachLift * 100)}%`,
    label: 'Post reach lift',
    sub: 'beyond your baseline reach',
  },
  {
    key: 'engagement',
    icon: Heart,
    value: `${(mockGrowthPlusInsights.engagementRate * 100).toFixed(1)}%`,
    label: 'Engagement rate',
    sub: 'active accounts that interact',
  },
  {
    key: 'posts',
    icon: Sparkles,
    value: String(mockGrowthPlusInsights.boostedPosts),
    label: 'Boosted posts',
    sub: 'posts boosted this month',
  },
]

export default function GrowthPlusMetricsStrip() {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
      {CARDS.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.key}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-5"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-purple-tint text-purple-text"
            >
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-xl font-semibold text-text-primary">{c.value}</p>
            <p className="mt-0.5 text-xs font-medium text-text-primary">{c.label}</p>
            <p className="text-[11px] leading-tight text-text-muted">{c.sub}</p>
          </div>
        )
      })}
    </section>
  )
}
```

**Acceptance:** Three cards in a row at `sm:+` widths, stacked at `<sm:`. Each card shows a purple icon chip, big number, label, subline. Numbers read from `mockGrowthPlusInsights`.

---

## Item 4 — Recent boost activity feed

**Why:** The emotional centerpiece of the subscriber page. A feed of recent boost events proves the engine is running and provides the "happening behind the scenes" reassurance Growth+ subscribers paid for.

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusActivity.jsx`
- Create: `src/mocks/growthPlusActivity.js`

### `src/mocks/growthPlusActivity.js`

```js
// Recent Growth+ boost events. Timestamps are computed relative to import
// time so the feed always reads fresh ("2h ago", "1d ago") on first load
// rather than drifting stale against hardcoded ISO strings.
const _now = Date.now()
const _hourAgo = (h) => new Date(_now - h * 60 * 60 * 1000).toISOString()

export const mockGrowthPlusActivity = [
  {
    id: 'gp_001',
    type: 'post_boosted',
    postTitle: 'Morning workout',
    engagements: 23,
    createdAt: _hourAgo(2),
  },
  {
    id: 'gp_002',
    type: 'followers_gained',
    count: 5,
    createdAt: _hourAgo(4),
  },
  {
    id: 'gp_003',
    type: 'post_boosted',
    postTitle: 'Meal prep tips',
    engagements: 47,
    createdAt: _hourAgo(24),
  },
  {
    id: 'gp_004',
    type: 'followers_gained',
    count: 8,
    createdAt: _hourAgo(48),
  },
  {
    id: 'gp_005',
    type: 'post_boosted',
    postTitle: 'Cardio routine',
    engagements: 19,
    createdAt: _hourAgo(72),
  },
]
```

### `src/pages/growthPlus/GrowthPlusActivity.jsx`

```jsx
import { Sparkles, UserPlus } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { mockGrowthPlusActivity } from '@/mocks/growthPlusActivity'
import { formatRelativeTime } from '@/utils/formatRelativeTime'

function eventRow(event) {
  if (event.type === 'post_boosted') {
    return {
      icon: Sparkles,
      title: `Your post "${event.postTitle}" boosted`,
      sub: `+${event.engagements} engagements from active accounts`,
    }
  }
  return {
    icon: UserPlus,
    title: `+${event.count} followers from boost network`,
    sub: 'Triggered by your 5 most recent posts',
  }
}

export default function GrowthPlusActivity() {
  const items = mockGrowthPlusActivity.slice(0, 5)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 md:p-5">
      <div className="flex items-center gap-2">
        <CardChip color="purple" icon={Sparkles} />
        <h2 className="text-base font-semibold text-text-primary">
          Recent boost activity
        </h2>
        <span className="inline-flex rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 py-6 text-center text-sm text-text-muted">
          No boost activity yet — your first boost will appear here within 24 hours.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {items.map((event, i) => {
            const row = eventRow(event)
            const Icon = row.icon
            return (
              <li
                key={event.id}
                className={`flex items-center gap-3 py-3 ${
                  i === 0 ? '' : 'border-t border-border'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-tint text-purple-text"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {row.title}
                  </p>
                  <p className="truncate text-xs text-text-muted">{row.sub}</p>
                </div>
                <span className="shrink-0 text-xs text-text-muted">
                  {formatRelativeTime(event.createdAt)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
```

**Decisions baked in:**
- Default expanded (no collapsible). This feed is the page's centerpiece — it earns being visible. Different from Engagement-card collapsibles which default closed.
- 5 events max. If/when the real feed grows past that, a "View all" link or pagination can follow.
- `CardChip` already exists in `src/components/CardChip.jsx` and supports `color="purple"`. Reuse it for the header so the section reads as part of the same family.

**Acceptance:** Feed renders 5 rows, alternating post-boost / followers-gained event types, with relative timestamps that update on each render. Empty state copy locked.

---

## Item 5 — Growth+ controls

**Why:** Operational section — the pause toggle, speed + quality segmented controls, and a billing-link line. One section, four rows, all the levers a subscriber has.

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusControls.jsx`
- Modify: `src/stores/useGrowthConfig.js` (extend with `growthPlusControls` state + actions)

### `useGrowthConfig` extension

In `src/stores/useGrowthConfig.js`, add to the existing store:

```js
// Initial state (alongside existing):
growthPlusControls: {
  enabled: true,
  speed: 'steady',          // 'slow' | 'steady' | 'fast'
  quality: 'targeted',      // 'broad' | 'targeted' | 'high-engagement'
},

// Actions (alongside existing):
toggleGrowthPlusEnabled: () => {
  set((state) => ({
    config: {
      ...state.config,
      growthPlusControls: {
        ...state.config.growthPlusControls,
        enabled: !state.config.growthPlusControls.enabled,
      },
    },
  }))
},
setGrowthPlusSpeed: (speed) => {
  set((state) => ({
    config: {
      ...state.config,
      growthPlusControls: { ...state.config.growthPlusControls, speed },
    },
  }))
},
setGrowthPlusQuality: (quality) => {
  set((state) => ({
    config: {
      ...state.config,
      growthPlusControls: { ...state.config.growthPlusControls, quality },
    },
  }))
},
```

(Match the existing `useGrowthConfig` shape — its actions read `state.config` and write back; preserve that convention.)

### `src/pages/growthPlus/GrowthPlusControls.jsx`

```jsx
import { Link } from 'react-router-dom'
import { ChevronRight, Sliders } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

const SPEED_OPTIONS = [
  { value: 'slow', label: 'Slow', note: 'Easier on IG; fewer boosts per day.' },
  { value: 'steady', label: 'Steady', note: 'Recommended for most accounts; lower IG safety risk.' },
  { value: 'fast', label: 'Fast', note: 'Maximum boosts; check on results often.' },
]

const QUALITY_OPTIONS = [
  { value: 'broad', label: 'Broad', note: 'Wider reach across audiences.' },
  { value: 'targeted', label: 'Targeted', note: 'Match your niche; balanced reach + engagement.' },
  { value: 'high-engagement', label: 'High-engagement', note: 'Active accounts likely to like + save.' },
]

export default function GrowthPlusControls() {
  const config = useGrowthConfig((s) => s.config.growthPlusControls)
  const toggleEnabled = useGrowthConfig((s) => s.toggleGrowthPlusEnabled)
  const setSpeed = useGrowthConfig((s) => s.setGrowthPlusSpeed)
  const setQuality = useGrowthConfig((s) => s.setGrowthPlusQuality)

  const speedNote = SPEED_OPTIONS.find((o) => o.value === config.speed)?.note
  const qualityNote = QUALITY_OPTIONS.find((o) => o.value === config.quality)?.note

  return (
    <section className="rounded-xl border border-border bg-surface p-4 md:p-5">
      <div className="flex items-center gap-2">
        <CardChip color="purple" icon={Sliders} />
        <h2 className="text-base font-semibold text-text-primary">Growth+ controls</h2>
        <InfoTooltip text="These controls only affect Growth+. Targeted Growth settings live on the Engagement page." />
      </div>

      {/* Row 1 — Boost active toggle */}
      <div className="mt-4 flex items-start justify-between gap-3 border-t border-border pt-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">Boost active</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Pause boost while keeping your subscription.
          </p>
        </div>
        <CardToggle
          checked={config.enabled}
          onClick={toggleEnabled}
          ariaLabel="Toggle Growth+ boost"
        />
      </div>

      {/* Row 2 — Speed */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-medium text-text-primary">Speed</p>
        <SegmentedControl
          options={SPEED_OPTIONS}
          value={config.speed}
          onChange={setSpeed}
          disabled={!config.enabled}
        />
        <p className="mt-2 text-xs text-text-muted">{speedNote}</p>
      </div>

      {/* Row 3 — Quality */}
      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-medium text-text-primary">Quality</p>
        <SegmentedControl
          options={QUALITY_OPTIONS}
          value={config.quality}
          onChange={setQuality}
          disabled={!config.enabled}
        />
        <p className="mt-2 text-xs text-text-muted">{qualityNote}</p>
      </div>

      {/* Row 4 — Billing line */}
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-text-secondary">
          Next billing <span className="font-medium text-text-primary">$49.00 on May 25</span>
        </p>
        <Link
          to="/account/growth-plus"
          className="inline-flex items-center gap-1 text-sm font-medium text-purple-text hover:underline"
        >
          Manage
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}

// Bare toggle button — matches the CardToggle recipe from WelcomeDmCard /
// CloseFriendsCard. Kept inline here since it's only used in this file.
function CardToggle({ checked, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-green-base' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}

// Segmented control — matches the CFA mode-pill recipe from
// CloseFriendsCard. 3 buttons, active = bg-surface shadow-sm.
function SegmentedControl({ options, value, onChange, disabled }) {
  return (
    <div
      className={`mt-2 flex w-full rounded-full bg-bg p-1 ${
        disabled ? 'opacity-60' : ''
      }`}
      aria-disabled={disabled}
    >
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`inline-flex h-8 flex-1 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
              selected
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
```

**Decisions baked in:**
- Pause toggle uses `bg-green-base` (active) recipe matching existing engagement cards' `CardToggle`. Don't make it purple — green = "active/healthy" across the dashboard.
- Disabled state for speed/quality controls when `enabled === false`: visually muted (`opacity-60`), `disabled` attribute on buttons. Toggle off → controls grey out.
- `CardToggle` and `SegmentedControl` are inline helpers (not lifted to shared components) — they only serve this file and the recipe is already duplicated in two other files. Don't create new shared primitives in this spec.
- The billing line `$49.00 on May 25` is hardcoded copy in V1. Production should compute from `useSubscriptions` data; flag as a follow-up.

**Acceptance:** Toggle pauses Growth+ (visual only — V1 mocks don't actually disable anything). Speed + quality segmented controls store their pick in `useGrowthConfig` and the active option's tradeoff note renders below. Disabled state when toggle is off. Manage link routes to `/account/growth-plus`.

---

## Item 6 — How-it-works / safety strip

**Why:** PRODUCT.md mandates transparency about what Growth+ does. The strip is the page's quiet, factual closer.

**Files:**
- Inline at the bottom of `GrowthPlusActive.jsx` (no separate component — it's 8 lines of JSX).

### Inline JSX (last child of `GrowthPlusActive`)

```jsx
<div className="flex items-start gap-2 px-2 py-3">
  <ShieldCheck
    className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary"
    aria-hidden="true"
  />
  <p className="text-xs leading-relaxed text-text-secondary">
    <span className="font-semibold text-text-primary">How Growth+ works.</span>{' '}
    Growth+ uses a network of active accounts to like, save, and share your most recent posts. Boost activity is throttled to stay within Instagram's safety limits. Boosted followers are engagement-driven, not organic.
  </p>
</div>
```

**Decisions baked in:**
- Deliberately not a card. No outer border, no surface, no shadow. Sits flush with page background.
- One paragraph, not bullets. The reassurance is the prose, not a list.
- Last sentence (PRODUCT.md mandate) is included as transparency, not disclaimer.
- `ShieldCheck` from Lucide; `text-text-secondary` (muted), not green or red.

**Acceptance:** Strip renders at the bottom of the subscriber dashboard with the locked copy. No card chrome. Mobile + desktop layouts identical.

---

## Item 7 — Non-subscriber locked-preview state

**Why:** Non-subscribers should see exactly what they'd get — the dashboard itself is the value prop. A subscribe overlay floats above a blurred version of the live dashboard.

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusLockedPreview.jsx`
- Create: `src/pages/growthPlus/GrowthPlusSubscribeOverlay.jsx`
- Create: `src/components/GrowthPlusSubscribeModal.jsx`
- Modify: `src/pages/signup/steps/GrowthPlus.jsx` (replace inline modal with the shared component)

### `src/pages/growthPlus/GrowthPlusLockedPreview.jsx`

```jsx
import { useState } from 'react'
import GrowthPlusActive from './GrowthPlusActive'
import GrowthPlusSubscribeOverlay from './GrowthPlusSubscribeOverlay'
import GrowthPlusSubscribeModal from '@/components/GrowthPlusSubscribeModal'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'

export default function GrowthPlusLockedPreview({ account }) {
  const [modalState, setModalState] = useState(null) // null | 'confirm' | 'processing' | 'success'
  const markSubscribed = useGrowthPlusSubscription((s) => s.markSubscribed)

  function handleSubscribeSuccess() {
    setModalState(null)
    markSubscribed()
  }

  return (
    <div className="relative">
      {/* Blurred preview of the actual subscriber dashboard. */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none opacity-60 blur-[2px]"
      >
        <GrowthPlusActive account={account} previewMode />
      </div>

      {/* Floating subscribe overlay. */}
      <GrowthPlusSubscribeOverlay
        onSubscribeClick={() => setModalState('confirm')}
      />

      <GrowthPlusSubscribeModal
        state={modalState}
        onClose={() => setModalState(null)}
        onConfirm={() => setModalState('processing')}
        onProcessingDone={() => setModalState('success')}
        onSuccess={handleSubscribeSuccess}
      />
    </div>
  )
}
```

### `src/pages/growthPlus/GrowthPlusSubscribeOverlay.jsx`

```jsx
import { Check, Sparkles } from 'lucide-react'

const BENEFITS = [
  'Algorithmic post boosting',
  '+34% post reach on average',
  'Active-account engagement signals',
]

export default function GrowthPlusSubscribeOverlay({ onSubscribeClick }) {
  return (
    <div className="absolute left-1/2 top-24 z-10 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 md:top-1/2 md:-translate-y-1/2">
      <div className="rounded-2xl border border-purple-base/30 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 p-6 shadow-xl md:p-8">
        <div className="flex justify-center">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-text text-surface shadow-sm"
          >
            <Sparkles className="h-7 w-7" />
          </span>
        </div>

        <h2 className="mt-4 text-center text-2xl font-semibold text-text-primary">
          Unlock Growth+
        </h2>
        <p className="mt-1 text-center text-sm text-text-secondary">
          See exactly this for your account.
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-text-primary">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-purple-base"
                aria-hidden="true"
                strokeWidth={2.5}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onSubscribeClick}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-purple-base text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Add Growth+ — $49/mo
        </button>

        <p className="mt-3 text-center text-xs text-text-muted">
          Cancel anytime · Add later from your dashboard
        </p>
      </div>
    </div>
  )
}
```

### `src/components/GrowthPlusSubscribeModal.jsx`

Extract the three-state modal (`confirm` / `processing` / `success`) currently inline in `signup/steps/GrowthPlus.jsx`. The signature:

```jsx
export default function GrowthPlusSubscribeModal({
  state,           // null | 'confirm' | 'processing' | 'success'
  onClose,
  onConfirm,
  onProcessingDone,
  onSuccess,
})
```

The component renders nothing when `state === null`. Otherwise it renders the same three-state modal already in the signup step (compact processing spinner, full confirm sheet with payment method + benefits, success sheet with green check).

The `signup/steps/GrowthPlus.jsx` step gets updated to:

1. Remove the inline modal JSX (the entire `{modalState && (<div className="fixed inset-0…">…</div>)}` block at the bottom).
2. Add `import GrowthPlusSubscribeModal from '@/components/GrowthPlusSubscribeModal'` at the top.
3. Render `<GrowthPlusSubscribeModal state={modalState} onClose={handleCloseModal} onConfirm={handleConfirmPayment} onProcessingDone={() => setModalState('success')} onSuccess={handleSuccessContinue} />` at the bottom.

The signup step's `handleConfirmPayment` already does the `setModalState('processing')` + `setTimeout(() => setModalState('success'), 1500)` flow. The extracted modal's `onConfirm` should fire the same logic — the parent owns the state machine.

**Decision baked in:** the modal extraction is non-invasive; the signup step's existing button onClick paths stay identical. The extracted component is the shared subscribe path used by both surfaces (signup AND the new Growth+ page).

**On subscribe success (Growth+ page):** `markSubscribed()` flips the Zustand flag, the page re-renders, the locked-preview unmounts, the live subscriber dashboard mounts. The `useCountUp` hook fires on the now-unblurred hero. The transition feels earned.

**Acceptance:** Non-subscriber visiting `/growth-plus` sees:
1. The full subscriber dashboard rendered behind a `blur-[2px] opacity-60` overlay.
2. A floating subscribe card centered (desktop) or pinned near top (mobile).
3. Clicking Add Growth+ opens the shared confirm modal, processes for ~1.5s, shows success, closes the modal, and reveals the live subscriber dashboard inline.

---

## Item 8 — Wiring `GrowthPlusActive`

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusActive.jsx`

The composition root for the subscriber dashboard. Imports the five sections + the inline safety strip:

```jsx
import { ShieldCheck } from 'lucide-react'
import GrowthPlusHero from './GrowthPlusHero'
import GrowthPlusMetricsStrip from './GrowthPlusMetricsStrip'
import GrowthPlusActivity from './GrowthPlusActivity'
import GrowthPlusControls from './GrowthPlusControls'

export default function GrowthPlusActive({ account, previewMode = false }) {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <GrowthPlusHero previewMode={previewMode} />
      <GrowthPlusMetricsStrip />
      <GrowthPlusActivity />
      <GrowthPlusControls />

      {/* Safety / transparency strip — deliberately cardless. */}
      <div className="flex items-start gap-2 px-2 py-3">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary"
          aria-hidden="true"
        />
        <p className="text-xs leading-relaxed text-text-secondary">
          <span className="font-semibold text-text-primary">How Growth+ works.</span>{' '}
          Growth+ uses a network of active accounts to like, save, and share your most recent posts. Boost activity is throttled to stay within Instagram's safety limits. Boosted followers are engagement-driven, not organic.
        </p>
      </div>
    </div>
  )
}
```

`previewMode` propagates only to the hero (count-up disabled, animation off) because that's the only section with mount-time animation. Other sections render identically in both modes.

The `account` prop is captured but not used in V1 — kept on the signature for future per-account data wiring.

**Acceptance:** `GrowthPlusActive` composes the five sections in order with a `gap-4 md:gap-5` flex column.

---

## Item 9 — Sparkline data fix

**Why:** `mockGrowthDaily` currently has every entry's `growthPlusGain: 0` — the hero sparkline would render as a flat horizontal line. Need realistic per-day Growth+ contribution.

**Files:**
- Modify: `src/mocks/growth.js`

In the `mockGrowthDaily` generation (line ~10), change:

```js
const growthPlusGain = 0
```

To:

```js
const growthPlusGain = Math.max(0, Math.round(Math.sin(i * 0.4) * 5 + 5))
```

This produces a smooth sine wave with values roughly between 0 and 10, summing across 30 days to ~150 — close enough to `mockGrowthPlusInsights.algorithmicBoost = 143` for the hero number + sparkline to feel consistent.

**Acceptance:** The hero sparkline shows a smooth wavy line, not flat.

---

## Out of scope

- Per-account Growth+ subscription (V1 = single user-level flag; production needs per-`subscriptions[].growthPlus`).
- Real billing logic — `$49.00 on May 25` is hardcoded.
- A "View all activity" page beyond the 5-event preview.
- Mobile drawer / sheet for the subscribe modal — using the existing extracted modal's behavior unchanged (it's already mobile-aware).
- Updating `GrowthPlusBanner` — the banner stays on `/engagement` as-is.
- Updating `/account/growth-plus` stub — separate spec when real subscription management lands.

---

## Implementation notes for the plan

- Implement order: mock additions (Items 9, 3, 4) → store extensions (Item 1, 5) → primitives (Item 2 hook, modal extraction Item 7) → page sections (Items 2–6) → composition root (Item 8) → locked-preview state (Item 7) → route registration (Item 1).
- The codebase has no automated test suite; verification is manual via the Claude Preview MCP server at mobile (375×812) and desktop (1280×800).
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
- After the modal extraction, verify the signup step (`/signup/growth-plus` during onboarding) still works end-to-end before claiming Item 7 done — the extraction must not break that flow.
- Don't add a new file for `CardToggle` or `SegmentedControl` — keep them inline in `GrowthPlusControls.jsx`. The recipe is duplicated in 2–3 files already by design.
- The `useCountUp` hook is intentionally mount-only — don't add re-trigger logic on prop change. V1 mocks are stable; production with live data will need re-trigger but that's a follow-up.
- The locked-preview's `blur-[2px]` uses Tailwind's arbitrary-value syntax. The project has `*.local`-style arbitrary values elsewhere; `blur-[2px]` is the cleanest expression of a subtle blur (Tailwind's preset `blur-sm` = 4px which is too aggressive).
