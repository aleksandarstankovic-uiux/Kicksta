// Mock target search. Supports two modes: 'account' and 'hashtag'.
// `searchTargets(query, type)` returns up to 5 matches (case-insensitive
// `includes` on the identifier). Async with a small delay so the UI can
// show a loading state if it chooses.
//
// `mockResolveAccount(username)` is kept for compatibility — a thin
// wrapper that returns the exact match (or null) for a single lookup.

const ACCOUNTS = [
  { username: 'fitness.inspo', followers: 128_400, profilePic: null },
  { username: 'fitfluencer', followers: 84_200, profilePic: null },
  { username: 'healthyhabits', followers: 52_100, profilePic: null },
  { username: 'trainhard.daily', followers: 39_800, profilePic: null },
  { username: 'nutrition.nerd', followers: 22_400, profilePic: null },
  { username: 'homegymhero', followers: 18_700, profilePic: null },
  { username: 'macro.melissa', followers: 9_400, profilePic: null },
  { username: 'protein.pete', followers: 6_100, profilePic: null },
  { username: 'yoga.daily', followers: 210_000, profilePic: null },
  { username: 'keto.kevin', followers: 48_300, profilePic: null },
  { username: 'cleanfoodcrush', followers: 71_000, profilePic: null },
  { username: 'fit.and.fast', followers: 15_300, profilePic: null },
  { username: 'lift.and.lunge', followers: 3_900, profilePic: null, private: true, verified: true },
  { username: 'plantpowered', followers: 145_000, profilePic: null, verified: true },
  { username: 'runfast.club', followers: 58_200, profilePic: null },
  { username: 'core.strong', followers: 27_800, profilePic: null },
  { username: 'cardio.crew', followers: 11_500, profilePic: null, private: true },
  { username: 'gym.goals', followers: 1_200_000, profilePic: null, verified: true },
  { username: 'sweatdaily', followers: 630_000, profilePic: null },
  { username: 'the.fit.life', followers: 820, profilePic: null },
]

const HASHTAGS = [
  { hashtag: 'homeworkouts', posts: 14_200_000 },
  { hashtag: 'fitfam', posts: 98_500_000 },
  { hashtag: 'healthyeating', posts: 62_300_000 },
  { hashtag: 'mealprep', posts: 18_700_000 },
  { hashtag: 'getfit', posts: 7_400_000 },
  { hashtag: 'glutenfree', posts: 22_100_000 },
  { hashtag: 'weightloss', posts: 88_900_000 },
  { hashtag: 'yogaeverydamnday', posts: 31_400_000 },
  { hashtag: 'macros', posts: 4_600_000 },
  { hashtag: 'cleaneating', posts: 76_200_000 },
]

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

function normalize(q) {
  return String(q || '').replace(/^[@#]/, '').trim().toLowerCase()
}

// Returns up to 5 matches. Prefers startsWith results, falls back to
// includes for broader discovery.
export async function searchTargets(query, type) {
  const q = normalize(query)
  await delay(150 + Math.random() * 150)
  if (!q) return []
  if (type === 'hashtag') {
    const starts = HASHTAGS.filter((h) => h.hashtag.startsWith(q))
    const includes = HASHTAGS.filter(
      (h) => !h.hashtag.startsWith(q) && h.hashtag.includes(q)
    )
    return [...starts, ...includes].slice(0, 5)
  }
  const starts = ACCOUNTS.filter((a) => a.username.startsWith(q))
  const includes = ACCOUNTS.filter(
    (a) => !a.username.startsWith(q) && a.username.includes(q)
  )
  return [...starts, ...includes].slice(0, 5)
}

// Compatibility wrapper: exact lookup for a single username.
export async function mockResolveAccount(rawUsername) {
  const q = normalize(rawUsername)
  await delay(200 + Math.random() * 200)
  if (!q) return null
  const hit = ACCOUNTS.find((a) => a.username === q)
  return hit ? { ...hit } : null
}
