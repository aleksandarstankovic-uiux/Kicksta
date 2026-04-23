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
  growthPlusSubscribed: false,
  createdAt,
}

export const mockUserGrowthPlus = {
  ...mockUser,
  plan: 'growth',
  isOnTrial: false,
  trialEndsAt: null,
  growthPlusSubscribed: true,
}
