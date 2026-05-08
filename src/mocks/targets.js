// Seeded targets for the dashboard. Each row now carries either
// `followers` (account) or `posts` (hashtag) for the target-source
// context. Follow-back counts are tuned so the rate reads cleanly
// across healthy / average / needs-attention bands.
//
// Account-type rows carry a deterministic Pravatar URL so the dashboard
// renders real face thumbnails for mock data. Pravatar is third-party
// and only used in V1 mocks — production swaps in real IG profile pics.
export const mockTargets = [
  {
    id: 't_001',
    type: 'account',
    value: '@fitness.inspo',
    status: 'active',
    followers: 128_400,
    followedCount: 842,
    followBackCount: 101, // 12%
    addedAt: '2026-03-15T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=fitness.inspo',
  },
  {
    id: 't_002',
    type: 'hashtag',
    value: '#homeworkouts',
    status: 'active',
    posts: 14_200_000,
    followedCount: 614,
    followBackCount: 55, // 9%
    addedAt: '2026-03-18T00:00:00Z',
  },
  {
    id: 't_003',
    type: 'account',
    value: '@yoga.daily',
    status: 'depleted',
    followers: 210_000,
    followedCount: 1200,
    followBackCount: 132, // 11%
    addedAt: '2026-03-10T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=yoga.daily',
  },
  {
    id: 't_004',
    type: 'account',
    value: '@cleanfoodcrush',
    status: 'paused',
    followers: 71_000,
    followedCount: 320,
    followBackCount: 13, // 4%
    addedAt: '2026-03-25T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=cleanfoodcrush',
  },
  {
    id: 't_005',
    type: 'hashtag',
    value: '#mealprep',
    status: 'active',
    posts: 18_700_000,
    followedCount: 488,
    followBackCount: 49, // 10%
    addedAt: '2026-03-22T00:00:00Z',
  },
  {
    id: 't_006',
    type: 'account',
    value: '@protein.pete',
    status: 'queued',
    followers: 6_100,
    followedCount: 0,
    followBackCount: 0,
    addedAt: '2026-03-20T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=protein.pete',
  },
  {
    id: 't_007',
    type: 'hashtag',
    value: '#glutenfree',
    status: 'active',
    posts: 22_100_000,
    followedCount: 430,
    followBackCount: 34, // 8%
    addedAt: '2026-03-24T00:00:00Z',
  },
  {
    id: 't_008',
    type: 'account',
    value: '@macro.melissa',
    status: 'active',
    followers: 9_400,
    followedCount: 380,
    followBackCount: 53, // 14%
    addedAt: '2026-03-26T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=macro.melissa',
  },
  {
    id: 't_009',
    type: 'hashtag',
    value: '#weightloss',
    status: 'active',
    posts: 88_900_000,
    followedCount: 710,
    followBackCount: 64, // 9%
    addedAt: '2026-03-14T00:00:00Z',
  },
  {
    id: 't_010',
    type: 'account',
    value: '@keto.kevin',
    status: 'depleted',
    followers: 48_300,
    followedCount: 980,
    followBackCount: 78, // 8%
    addedAt: '2026-03-08T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=keto.kevin',
  },
  // Two archived seed entries so the Archived bucket isn't empty
  // on first load — demonstrates the restore action.
  {
    id: 't_011',
    type: 'account',
    value: '@stale.influencer',
    status: 'archived',
    followers: 12_400,
    followedCount: 410,
    followBackCount: 22, // 5%
    addedAt: '2026-02-12T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=stale.influencer',
  },
  {
    id: 't_012',
    type: 'hashtag',
    value: '#cardiokings',
    status: 'archived',
    posts: 89_000,
    followedCount: 320,
    followBackCount: 17, // 5%
    addedAt: '2026-02-22T00:00:00Z',
  },
]
