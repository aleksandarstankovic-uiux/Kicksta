export const mockInstagramConnected = {
  username: 'alexjohnson.co',
  fullName: 'Alex Johnson — Fitness & Nutrition Coach',
  profilePic: '/mock-avatar.svg',
  followers: 4832,
  following: 1247,
  posts: 312,
  connectionState: 'connected',
  warmupEndsAt: null,
  disconnectedAt: null,
}

export const mockInstagramWarmingUp = {
  ...mockInstagramConnected,
  connectionState: 'warming_up',
  warmupEndsAt: '2026-04-09T00:00:00Z',
}

export const mockInstagramDisconnected = {
  ...mockInstagramConnected,
  connectionState: 'disconnected',
  disconnectedAt: '2026-04-05T18:30:00Z',
}

export const mockInstagramNeverLoggedIn = {
  username: null,
  fullName: null,
  profilePic: null,
  followers: null,
  following: null,
  posts: null,
  connectionState: 'never_logged_in',
  warmupEndsAt: null,
  disconnectedAt: null,
}

export const mockInstagram = mockInstagramConnected
