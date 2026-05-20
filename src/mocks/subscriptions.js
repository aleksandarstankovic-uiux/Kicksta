// One subscription per connected IG account. Joins back to
// `mockAccounts` via `accountId`. Status mix gives the UI variety.
//
// `pauseUntil` and `endsAt` are populated by store actions
// (`pause` and `cancel`); they're null on initial mock data so
// the dashboard renders the normal Active state.
//
// `totalFollowersGained` is the cumulative gain since subscription
// start — read by the cancel flow's "what you'll lose" step.
export const mockSubscriptions = [
  {
    id: 'sub_001',
    accountId: 'acc_001',
    plan: 'advanced',
    growthPlus: true,
    server: 'us-nyc',
    status: 'active',
    trialEndsAt: null,
    nextBillingAt: '2026-06-01T00:00:00Z',
    nextBillingAmount: 59,
    startedAt: '2026-01-15T00:00:00Z',
    pauseUntil: null,
    endsAt: null,
    totalFollowersGained: 1247,
  },
  {
    id: 'sub_002',
    accountId: 'acc_002',
    plan: 'growth',
    growthPlus: false,
    server: 'uk-lon',
    status: 'trialing',
    trialEndsAt: '2026-05-20T00:00:00Z',
    nextBillingAt: '2026-05-20T00:00:00Z',
    nextBillingAmount: 29,
    startedAt: '2026-05-06T00:00:00Z',
    pauseUntil: null,
    endsAt: null,
    totalFollowersGained: 134,
  },
  {
    id: 'sub_003',
    accountId: 'acc_003',
    plan: 'advanced',
    growthPlus: false,
    server: 'us-lax',
    status: 'past_due',
    trialEndsAt: null,
    nextBillingAt: '2026-05-25T00:00:00Z',
    nextBillingAmount: 49,
    startedAt: '2026-02-10T00:00:00Z',
    pauseUntil: null,
    endsAt: null,
    totalFollowersGained: 612,
  },
]
