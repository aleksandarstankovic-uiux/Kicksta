// Trial end is computed relative to `new Date()` at import time so the
// "trial ends today" banner + "ends in X hours" copy always fire fresh
// rather than against a hardcoded date that drifts stale. We anchor to
// 11 PM **local time today** so the value always falls on the same
// calendar day regardless of timezone (a naive `now + 11h` can cross
// midnight UTC and skip the last-day detection).
const _now = new Date()
const _endOfToday = new Date(
  _now.getFullYear(),
  _now.getMonth(),
  _now.getDate(),
  23, // 11 PM
  0,
  0,
)
const trialEndsAt = _endOfToday.toISOString()
// Signup date = 7 days before the trial ends.
const createdAt = new Date(_endOfToday.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

// Plan catalog — kept inline so the TrialBanner can surface plan name +
// renewal price without an extra mocks file.
export const PLAN_CATALOG = {
  growth: { name: 'Growth', price: 29 },
  advanced: { name: 'Advanced', price: 49 },
}

export const mockUser = {
  id: 'u_001',
  email: 'alex@example.com',
  name: 'Alex Johnson',
  avatar: null,
  plan: 'advanced',
  trialEndsAt,
  isOnTrial: true,
  // Default starts UN-subscribed so the Overview's Growth+ card and
  // the AccountCard pill begin in the upsell / not-subscribed state.
  // Upgrading through /growth-plus flips `useGrowthPlusSubscription`
  // (and `useGrowthConfig.growthPlusControls.tier`); the dashboard
  // reads from those stores to render the subscribed state inline.
  growthPlusSubscribed: false,
  // Current Growth+ tier when subscribed. "starter" | "pro" | "elite"
  // | null. null when growthPlusSubscribed === false. Drives the hero
  // pill, metric ceilings, and which control segments unlock.
  growthPlusTier: null,
  createdAt,
}

export const mockUserGrowthPlus = {
  ...mockUser,
  plan: 'growth',
  isOnTrial: false,
  trialEndsAt: null,
  growthPlusSubscribed: true,
  growthPlusTier: 'pro',
}

// Variant: Growth+ subscriber on the entry Starter tier — most
// segments are locked, used to verify the gating UX.
export const mockUserGrowthPlusStarter = {
  ...mockUserGrowthPlus,
  growthPlusTier: 'starter',
}

// Variant: Growth+ subscriber on the top Elite tier — nothing locked,
// used to verify the unlocked state.
export const mockUserGrowthPlusElite = {
  ...mockUserGrowthPlus,
  growthPlusTier: 'elite',
}

// Growth+ subscription anchored relative to import time so the
// "Next billing" date in the Growth+ controls renders fresh on each
// load (5 days into a 30-day cycle = ~25 days remaining). Same trick
// as `mockUser.trialEndsAt`.
const _gpStart = new Date()
_gpStart.setHours(0, 0, 0, 0)
_gpStart.setDate(_gpStart.getDate() - 5)
export const mockGrowthPlusStartedAt = _gpStart.toISOString()

const _gpNext = new Date(_gpStart)
_gpNext.setDate(_gpNext.getDate() + 30)
export const mockGrowthPlusNextBillingAt = _gpNext.toISOString()
