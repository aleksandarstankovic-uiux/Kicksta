// Static suggestions shown as chips inside the Add Target sheet
// (account mode only). Represents "accounts similar to what you already
// target" — no live niche inference in V1.
//
// First 3 entries get pravatar URLs so the avatar branch in
// AddTargetSheet's suggestion chips is exercised in dev. The last 2
// keep `profilePic: null` so the letter-fallback branch stays covered.
export const mockSuggestedTargets = [
  { username: 'fitfluencer', followers: 84200, profilePic: 'https://i.pravatar.cc/80?u=fitfluencer' },
  { username: 'healthyhabits', followers: 52100, profilePic: 'https://i.pravatar.cc/80?u=healthyhabits' },
  { username: 'trainhard.daily', followers: 39800, profilePic: 'https://i.pravatar.cc/80?u=trainhard' },
  { username: 'nutrition.nerd', followers: 22400, profilePic: null },
  { username: 'homegymhero', followers: 18700, profilePic: null },
]
