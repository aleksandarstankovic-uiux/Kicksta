// Recent activity feed shown on the Overview page.
//
// ⚠️ WINDOW_SUBJECT_TO_CHANGE
// The feed filters by the Overview page's global period switcher (7d / 14d /
// 30d presets, plus a custom date range). The preset set is provisional — we
// may widen, narrow, or replace with a single fixed window once we see how
// dense real feeds get. If you change the preset options, update the
// PERIOD_PRESETS constant in src/pages/overview/index.jsx.

// Reference "now" = the moment the module loads, so activity timestamps
// always look fresh regardless of when the demo is opened. Previously
// pinned to a hardcoded date that drifted stale (activity would read
// "7d ago" on a day when the user is supposedly "actively growing").
const NOW = new Date()

function hoursAgo(h) {
  return new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString()
}

// Two activity types:
//   - 'follow_back'   — a targeted user followed you back
//   - 'actions_batch' — system ran a batch of follows/likes from a target
export const mockActivity = [
  {
    id: 'a_001',
    type: 'follow_back',
    username: '@yoga.ashley',
    createdAt: hoursAgo(1.5),
  },
  {
    id: 'a_002',
    type: 'actions_batch',
    followed: 42,
    liked: 38,
    target: '@fitness.inspo',
    createdAt: hoursAgo(3),
  },
  {
    id: 'a_003',
    type: 'follow_back',
    username: '@marcus.lifts',
    createdAt: hoursAgo(5),
  },
  {
    id: 'a_004',
    type: 'follow_back',
    username: '@plantbased.priya',
    createdAt: hoursAgo(8),
  },
  {
    id: 'a_005',
    type: 'actions_batch',
    followed: 36,
    liked: 30,
    target: '#homeworkouts',
    createdAt: hoursAgo(14),
  },
  {
    id: 'a_006',
    type: 'follow_back',
    username: '@runner.kate',
    createdAt: hoursAgo(22),
  },
  {
    id: 'a_007',
    type: 'actions_batch',
    followed: 48,
    liked: 44,
    target: '@fitness.inspo',
    createdAt: hoursAgo(28),
  },
  {
    id: 'a_008',
    type: 'follow_back',
    username: '@cleaneats.jen',
    createdAt: hoursAgo(33),
  },
  {
    id: 'a_009',
    type: 'follow_back',
    username: '@dad.bod.dan',
    createdAt: hoursAgo(40),
  },
  {
    id: 'a_010',
    type: 'actions_batch',
    followed: 40,
    liked: 35,
    target: '#homeworkouts',
    createdAt: hoursAgo(52),
  },
  {
    id: 'a_011',
    type: 'follow_back',
    username: '@lifting.lina',
    createdAt: hoursAgo(62),
  },
  {
    id: 'a_012',
    type: 'actions_batch',
    followed: 38,
    liked: 33,
    target: '@yoga.daily',
    createdAt: hoursAgo(70),
  },
  // 4–14 days back — surfaces when user switches to 14d / 30d
  { id: 'a_013', type: 'follow_back', username: '@sunrise.sam', createdAt: hoursAgo(96) },
  { id: 'a_014', type: 'actions_batch', followed: 41, liked: 37, target: '@fitness.inspo', createdAt: hoursAgo(110) },
  { id: 'a_015', type: 'follow_back', username: '@macros.mia', createdAt: hoursAgo(128) },
  { id: 'a_016', type: 'actions_batch', followed: 44, liked: 39, target: '#homeworkouts', createdAt: hoursAgo(150) },
  { id: 'a_017', type: 'follow_back', username: '@trailrun.tom', createdAt: hoursAgo(172) },
  { id: 'a_018', type: 'actions_batch', followed: 39, liked: 35, target: '@yoga.daily', createdAt: hoursAgo(200) },
  { id: 'a_019', type: 'follow_back', username: '@bendy.bea', createdAt: hoursAgo(228) },
  { id: 'a_020', type: 'actions_batch', followed: 46, liked: 41, target: '@fitness.inspo', createdAt: hoursAgo(260) },
  { id: 'a_021', type: 'follow_back', username: '@hiit.harry', createdAt: hoursAgo(295) },
  { id: 'a_022', type: 'actions_batch', followed: 37, liked: 32, target: '#homeworkouts', createdAt: hoursAgo(320) },
  // 15–30 days back — only visible on 30d
  { id: 'a_023', type: 'follow_back', username: '@core.cora', createdAt: hoursAgo(360) },
  { id: 'a_024', type: 'actions_batch', followed: 43, liked: 38, target: '@yoga.daily', createdAt: hoursAgo(410) },
  { id: 'a_025', type: 'follow_back', username: '@powerlift.pete', createdAt: hoursAgo(450) },
  { id: 'a_026', type: 'actions_batch', followed: 40, liked: 36, target: '@fitness.inspo', createdAt: hoursAgo(500) },
  { id: 'a_027', type: 'follow_back', username: '@flex.felix', createdAt: hoursAgo(560) },
  { id: 'a_028', type: 'actions_batch', followed: 45, liked: 40, target: '#homeworkouts', createdAt: hoursAgo(620) },
  { id: 'a_029', type: 'follow_back', username: '@calm.carla', createdAt: hoursAgo(680) },
]
