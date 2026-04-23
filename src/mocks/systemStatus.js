// Live activity state for the AccountCard's status pill. Replaces the
// static "Active / Warming up / Paused" indicator with a richer picture
// of what the growth engine is actually doing at any given moment —
// "Following @fitness.inspo", "Analyzing follow-backs", etc. — so the
// dashboard feels alive and transparent about background work.
//
// The `state` drives the pill's color + spinner treatment. The remaining
// fields populate the hover/click popover with context and stats.
//
// Swap `mockSystemStatus` to one of the named variants below to test
// each state. In V1 this is static; the real app will stream updates.

// Timestamps are computed relative to `new Date()` at import time so the
// "started X ago" / "next action in Y" values always feel fresh when the
// dashboard loads, rather than showing stale dates from whenever the mock
// was authored.
const now = Date.now()
const minutesFromNow = (n) => new Date(now + n * 60000).toISOString()
const minutesAgo = (n) => new Date(now - n * 60000).toISOString()
const hoursAgo = (n) => new Date(now - n * 60 * 60000).toISOString()

export const mockSystemStatusFollowing = {
  state: 'following',
  actionLabel: 'Following',
  target: '@fitness.inspo',
  hint: 'Processing batch of 25 users',
  actionsToday: 87,
  nextActionAt: minutesFromNow(2),
  startedAt: hoursAgo(3),
}

export const mockSystemStatusUnfollowing = {
  state: 'unfollowing',
  actionLabel: 'Unfollowing',
  target: 'non-followers',
  hint: 'Cleaning up users who never followed back',
  actionsToday: 42,
  nextActionAt: minutesFromNow(3),
  startedAt: hoursAgo(3),
}

export const mockSystemStatusAnalyzing = {
  state: 'analyzing',
  actionLabel: 'Analyzing',
  target: 'follow-backs',
  hint: 'Reviewing recent follow-back performance',
  actionsToday: 12,
  nextActionAt: null,
  startedAt: minutesAgo(5),
}

export const mockSystemStatusWarmingUp = {
  state: 'warming_up',
  actionLabel: 'Warming up',
  target: null,
  hint: 'Building account health before automation begins',
  actionsToday: 0,
  nextActionAt: null,
  startedAt: hoursAgo(4),
}

export const mockSystemStatusSetup = {
  state: 'setup',
  actionLabel: 'Setting up',
  target: null,
  hint: 'Preparing targeting filters and queue',
  actionsToday: 0,
  nextActionAt: null,
  startedAt: minutesAgo(2),
}

export const mockSystemStatusPaused = {
  state: 'paused',
  actionLabel: 'Paused',
  target: null,
  hint: 'Automation is on hold — resume to continue growing.',
  actionsToday: 45,
  nextActionAt: null,
  startedAt: null,
}

// Default export — swap to test different states in the UI.
export const mockSystemStatus = mockSystemStatusFollowing
