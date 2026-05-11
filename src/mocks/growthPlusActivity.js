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
