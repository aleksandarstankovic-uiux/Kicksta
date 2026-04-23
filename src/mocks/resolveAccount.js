// Fakes "live" account lookup used by the Add Target sheet preview.
// Returns `{ username, followers, profilePic }` for known usernames or
// null otherwise, after a 200–400ms delay. A tiny fixture is enough —
// we're not trying to cover the whole IG graph.
const FIXTURE = {
  'fitness.inspo': { followers: 128400, profilePic: null },
  'fitfluencer': { followers: 84200, profilePic: null },
  'healthyhabits': { followers: 52100, profilePic: null },
  'trainhard.daily': { followers: 39800, profilePic: null },
  'nutrition.nerd': { followers: 22400, profilePic: null },
  'homegymhero': { followers: 18700, profilePic: null },
  'macro.melissa': { followers: 9400, profilePic: null },
  'protein.pete': { followers: 6100, profilePic: null },
  'yoga.daily': { followers: 210000, profilePic: null },
  'keto.kevin': { followers: 48300, profilePic: null },
  'cleanfoodcrush': { followers: 71000, profilePic: null },
}

export function mockResolveAccount(rawUsername) {
  const username = String(rawUsername || '').replace(/^@/, '').trim().toLowerCase()
  const delay = 200 + Math.random() * 200
  return new Promise((resolve) => {
    setTimeout(() => {
      const hit = FIXTURE[username]
      resolve(hit ? { username, ...hit } : null)
    }, delay)
  })
}
