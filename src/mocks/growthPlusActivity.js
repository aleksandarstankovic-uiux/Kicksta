// Recent Growth+ boost events. Timestamps are computed relative to import
// time so the feed always reads fresh ("2h ago", "1d ago") on first load
// rather than drifting stale against hardcoded ISO strings.
const _now = Date.now()
const _minAgo = (m) => new Date(_now - m * 60 * 1000).toISOString()
const _hourAgo = (h) => new Date(_now - h * 60 * 60 * 1000).toISOString()

export const mockGrowthPlusActivity = [
  {
    id: 'gp_001',
    type: 'post_boosted',
    postTitle: 'Morning workout',
    engagements: 23,
    createdAt: _minAgo(35),
  },
  {
    id: 'gp_002',
    type: 'followers_gained',
    count: 5,
    createdAt: _hourAgo(2),
  },
  {
    id: 'gp_003',
    type: 'post_boosted',
    postTitle: 'Meal prep tips',
    engagements: 47,
    createdAt: _hourAgo(6),
  },
  {
    id: 'gp_004',
    type: 'followers_gained',
    count: 8,
    createdAt: _hourAgo(11),
  },
  {
    id: 'gp_005',
    type: 'post_boosted',
    postTitle: 'Cardio routine',
    engagements: 19,
    createdAt: _hourAgo(20),
  },
  {
    id: 'gp_006',
    type: 'followers_gained',
    count: 12,
    createdAt: _hourAgo(28),
  },
  {
    id: 'gp_007',
    type: 'post_boosted',
    postTitle: 'Healthy smoothie recipe',
    engagements: 64,
    createdAt: _hourAgo(36),
  },
  {
    id: 'gp_008',
    type: 'followers_gained',
    count: 6,
    createdAt: _hourAgo(44),
  },
  {
    id: 'gp_009',
    type: 'post_boosted',
    postTitle: 'Form check: deadlift',
    engagements: 31,
    createdAt: _hourAgo(52),
  },
  {
    id: 'gp_010',
    type: 'followers_gained',
    count: 9,
    createdAt: _hourAgo(60),
  },
  {
    id: 'gp_011',
    type: 'post_boosted',
    postTitle: 'Rest day mobility',
    engagements: 28,
    createdAt: _hourAgo(72),
  },
  {
    id: 'gp_012',
    type: 'followers_gained',
    count: 7,
    createdAt: _hourAgo(84),
  },
]
