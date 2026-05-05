// Current Close Friends list state and recent add/remove events,
// surfaced on /engagement under the Close Friends card (only when
// the toggle is on and the user is on Advanced).
//
// `count` is the current list size. `recent` is the activity log,
// newest-first. Each event:
//   - type:      'add' | 'remove'
//   - username:  '@handle'
//   - createdAt: ISO string anchored to NOW
const NOW = new Date()
const hoursAgo = (h) => new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString()

export const mockCloseFriendsState = {
  count: 23,
  recent: [
    { id: 'cf_1', type: 'add', username: '@yoga.ashley', createdAt: hoursAgo(1) },
    { id: 'cf_2', type: 'remove', username: '@cleanfoodcrush', createdAt: hoursAgo(4) },
    { id: 'cf_3', type: 'add', username: '@marcus.lifts', createdAt: hoursAgo(6) },
    { id: 'cf_4', type: 'add', username: '@plantbased.priya', createdAt: hoursAgo(9) },
    { id: 'cf_5', type: 'remove', username: '@brand.partner', createdAt: hoursAgo(18) },
    { id: 'cf_6', type: 'add', username: '@runners.club', createdAt: hoursAgo(30) },
  ],
}
