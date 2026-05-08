// Connected Instagram accounts for the sidebar AccountSwitcher. V1: the
// switcher only changes its own UI state — it doesn't yet propagate the
// active account to the rest of the dashboard (that's a follow-up once
// we introduce a shared accounts store).
//
// Profile pics are deterministic Pravatar URLs (seeded by username).
// Pravatar is third-party and only used in V1 mocks — production swaps
// in real IG profile pics.
export const mockAccounts = [
  {
    id: 'acc_001',
    username: 'alexjohnson.co',
    fullName: 'Alex Johnson — Fitness & Nutrition Coach',
    profilePic: 'https://i.pravatar.cc/80?u=alexjohnson.co',
    followers: 4832,
    plan: 'advanced',
    connectionState: 'connected',
  },
  {
    id: 'acc_002',
    username: 'alex.personal',
    fullName: 'Alex Johnson',
    profilePic: 'https://i.pravatar.cc/80?u=alex.personal',
    followers: 234,
    plan: 'growth',
    // Deliberately disconnected so the dropdown demonstrates how a
    // non-green status dot looks in context.
    connectionState: 'disconnected',
  },
  {
    id: 'acc_003',
    username: 'fitclub.brand',
    fullName: 'FitClub Community',
    profilePic: 'https://i.pravatar.cc/80?u=fitclub.brand',
    followers: 12100,
    plan: 'advanced',
    connectionState: 'connected',
  },
]

// Which account is "selected" on first load. Surfaces flow from
// `useAccounts.activeAccount` to every component that needs IG
// connection state — Overview banner, the sidebar AccountSwitcher,
// the MobileNavDrawer's account switcher, SystemStatus, etc.
export const defaultActiveAccountId = 'acc_001'
