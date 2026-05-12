// 30 days of daily growth data, anchored to today so the chart x-axis +
// metric sparklines always end on the current day rather than drifting
// stale against a hardcoded start date.
const _today = new Date()
_today.setHours(0, 0, 0, 0)
export const mockGrowthDaily = Array.from({ length: 30 }, (_, i) => {
  // i=0 is the oldest day (29 days ago), i=29 is today.
  const date = new Date(_today)
  date.setDate(date.getDate() - (29 - i))
  const dateStr = date.toISOString().split('T')[0]

  // Realistic variation patterns
  const baseGain = 10 + Math.round(Math.sin(i * 0.3) * 4)
  const noise = Math.round((Math.random() - 0.5) * 6)
  const targetedGain = Math.max(2, baseGain + noise)
  const growthPlusGain = Math.max(0, Math.round(Math.sin(i * 0.4) * 5 + 5))
  const followBackRate = +(0.08 + Math.random() * 0.08).toFixed(2)

  // Engagement rate (% of followers interacting with posts). Baseline
  // drifts on a slower sine wave than growth, with small daily noise.
  // Floored at 2% so averages stay plausible for Instagram accounts.
  const engBase = 0.04 + Math.sin(i * 0.25) * 0.01
  const engNoise = (Math.random() - 0.5) * 0.015
  const engagementRate = +Math.max(0.02, engBase + engNoise).toFixed(3)

  return { date: dateStr, targetedGain, growthPlusGain, followBackRate, engagementRate }
})

export const mockWeeklySummary = {
  followersGained: 67,
  followBackRate: 0.12,
  topTarget: '@fitness.inspo',
  period: 'Mar 28 \u2013 Apr 3',
}

// Total followers gained since account signup
export const mockTotalFollowersGained = 289

// Expected/projected growth for trial users
// Based on average daily gain from actual data, projected to trial end
export const mockTrialProjection = {
  expectedByTrialEnd: 420,        // total expected followers by end of 7-day trial
  dailyAverage: 10,               // average followers per day
  currentTotal: 289,              // actual gained so far
}

// Projected daily data — extends actual data with expected values
export const mockProjectedDaily = (() => {
  const lastDate = new Date('2026-04-03')
  const trialEnd = new Date('2026-04-10')
  const projected = []
  let current = new Date(lastDate)
  current.setDate(current.getDate() + 1)
  while (current <= trialEnd) {
    const dateStr = current.toISOString().split('T')[0]
    const base = 10 + Math.round(Math.sin(projected.length * 0.4) * 3)
    projected.push({
      date: dateStr,
      targetedGain: null,         // no actual data
      projectedGain: Math.max(6, base),
      followBackRate: null,
    })
    current.setDate(current.getDate() + 1)
  }
  return projected
})()

// Growth+ insights (for subscribers) — per-tier so the dashboard
// reflects the actual ceiling each tier delivers. Keyed by tier id;
// consumers select via mockUser.growthPlusTier.
export const mockGrowthPlusInsights = {
  starter: {
    algorithmicBoost: 40,
    postReachLift: 0.12,
    engagementRate: 0.032,
    boostedPosts: 4,
  },
  pro: {
    algorithmicBoost: 143,
    postReachLift: 0.34,
    engagementRate: 0.048,
    boostedPosts: 12,
  },
  elite: {
    algorithmicBoost: 300,
    postReachLift: 0.68,
    engagementRate: 0.071,
    boostedPosts: 30,
  },
}

// Hero delta strip — today / this-week / this-month gains per tier.
// Replaces the sparkline (a cumulative count can only trend up, so the
// line didn't carry information). Month total matches the matching
// tier's algorithmicBoost so the page stays internally coherent.
export const mockGrowthPlusDeltas = {
  starter: { today: 3, week: 18, month: 40 },
  pro: { today: 12, week: 84, month: 143 },
  elite: { today: 24, week: 168, month: 300 },
}

// Tier catalog. Order matters — Starter < Pro < Elite. Pricing is the
// single source of truth: billing card, upsell page, and hero pill
// all read from here. `recommended` flags the Pro card on the upsell.
// allowedSpeed/allowedQuality define what each tier can pick; the
// controls card renders un-allowed options with a Lock badge.
export const mockGrowthPlusTiers = [
  {
    id: 'starter',
    name: 'Starter',
    price: 29,
    tagline: 'For accounts just starting to grow',
    recommended: false,
    allowedSpeed: ['slow', 'steady'],
    allowedQuality: ['broad'],
    monthlyBoosts: 40,
    boostedPosts: 4,
    reachLift: 0.12,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 49,
    tagline: 'Best for most growing accounts',
    recommended: true,
    allowedSpeed: ['slow', 'steady', 'fast'],
    allowedQuality: ['broad', 'targeted'],
    monthlyBoosts: 143,
    boostedPosts: 12,
    reachLift: 0.34,
  },
  {
    id: 'elite',
    name: 'Elite',
    price: 99,
    tagline: 'Maximum reach + top-account network',
    recommended: false,
    allowedSpeed: ['slow', 'steady', 'fast'],
    allowedQuality: ['broad', 'targeted', 'top'],
    monthlyBoosts: 300,
    boostedPosts: 30,
    reachLift: 0.68,
  },
]

// Convenience: tier lookup by id. Returns undefined for unknown ids
// so callers can fall back to "no tier" (locked) state.
export const mockGrowthPlusTierById = Object.fromEntries(
  mockGrowthPlusTiers.map((t) => [t.id, t]),
)
