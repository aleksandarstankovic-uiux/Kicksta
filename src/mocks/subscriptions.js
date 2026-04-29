// One subscription per connected IG account. Joins back to
// `mockAccounts` via `accountId`. Status mix gives the UI variety:
// one trialing, one active, one past_due.
export const mockSubscriptions = [
  {
    id: 'sub_001',
    accountId: 'acc_001',
    plan: 'advanced',
    growthPlus: true,
    server: 'us-east',
    status: 'active',
    trialEndsAt: null,
    nextBillingAt: '2026-05-01T00:00:00Z',
    nextBillingAmount: 59,
    startedAt: '2026-01-15T00:00:00Z',
  },
  {
    id: 'sub_002',
    accountId: 'acc_002',
    plan: 'growth',
    growthPlus: false,
    server: 'eu-west',
    status: 'trialing',
    trialEndsAt: '2026-05-10T00:00:00Z',
    nextBillingAt: '2026-05-10T00:00:00Z',
    nextBillingAmount: 29,
    startedAt: '2026-04-26T00:00:00Z',
  },
  {
    id: 'sub_003',
    accountId: 'acc_003',
    plan: 'advanced',
    growthPlus: false,
    server: 'us-west',
    status: 'past_due',
    trialEndsAt: null,
    nextBillingAt: '2026-04-15T00:00:00Z',
    nextBillingAmount: 49,
    startedAt: '2026-02-10T00:00:00Z',
  },
]
