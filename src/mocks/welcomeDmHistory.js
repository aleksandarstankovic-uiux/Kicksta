// Recent welcome DMs sent, surfaced on /engagement under the Welcome
// DM card (only when the toggle is on and the user is on Advanced).
//
// Anchors to NOW so the demo always reads "fresh" — same pattern as
// src/mocks/activity.js and src/mocks/targetInteractions.js.
const NOW = new Date()
const hoursAgo = (h) => new Date(NOW.getTime() - h * 60 * 60 * 1000).toISOString()

export const mockWelcomeDmHistory = [
  { id: 'wdm_1', username: '@yoga.ashley', createdAt: hoursAgo(1) },
  { id: 'wdm_2', username: '@plantbased.priya', createdAt: hoursAgo(3) },
  { id: 'wdm_3', username: '@marcus.lifts', createdAt: hoursAgo(5) },
  { id: 'wdm_4', username: '@cleanfoodcrush', createdAt: hoursAgo(8) },
  { id: 'wdm_5', username: '@brand.partner', createdAt: hoursAgo(12) },
  { id: 'wdm_6', username: '@runners.club', createdAt: hoursAgo(20) },
  { id: 'wdm_7', username: '@trail.tales', createdAt: hoursAgo(28) },
  { id: 'wdm_8', username: '@chefjules.co', createdAt: hoursAgo(34) },
  { id: 'wdm_9', username: '@morning.moves', createdAt: hoursAgo(40) },
  { id: 'wdm_10', username: '@studioflora', createdAt: hoursAgo(46) },
  { id: 'wdm_11', username: '@bikepacker.ben', createdAt: hoursAgo(52) },
  { id: 'wdm_12', username: '@ceramics.kai', createdAt: hoursAgo(60) },
  { id: 'wdm_13', username: '@homebrew.dan', createdAt: hoursAgo(68) },
  { id: 'wdm_14', username: '@espresso.eva', createdAt: hoursAgo(76) },
]
