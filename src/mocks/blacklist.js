// Seeded blacklist entries. Pravatar URLs for the avatar branch
// (matches the Targeting page mock pattern); production swaps these
// for real IG profile pics from the connected account.
export const mockBlacklist = [
  {
    id: 'b_001',
    username: '@spam.account1',
    addedAt: '2026-03-16T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=spam.account1',
  },
  {
    id: 'b_002',
    username: '@competitor.brand',
    addedAt: '2026-03-17T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=competitor.brand',
  },
  {
    id: 'b_003',
    username: '@ex.colleague',
    addedAt: '2026-03-20T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=ex.colleague',
  },
  {
    id: 'b_004',
    username: '@bot.farm.42',
    addedAt: '2026-03-25T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=bot.farm.42',
  },
  {
    id: 'b_005',
    username: '@drama.feed',
    addedAt: '2026-04-01T00:00:00Z',
    profilePic: 'https://i.pravatar.cc/80?u=drama.feed',
  },
]
