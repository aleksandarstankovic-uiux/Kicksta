// Mock audience-reach estimator. Pure function over the filters object —
// deterministic, no side effects, replaceable with a real API later
// without changing call sites.
//
// Returns { count, health, tone }:
//   count  — estimated matching accounts (clamped to [200, 50000])
//   health — short label for the configuration health
//   tone   — token suffix used for the health pill ("green" | "yellow")

const POOL = 50_000

const FOLLOWING_FACTOR = (min, max) => {
  if ((min === 0 || min == null) && max == null) return 1.0
  if (min === 0 && max === 500) return 0.45
  if (min === 0 && max === 5000) return 0.7
  if (min === 500 && max === 5000) return 0.4
  if (min === 5000 && max == null) return 0.25
  // Custom range fallback — interpolate by span / pool size, clamped.
  const lo = min ?? 0
  const hi = max ?? 50000
  return Math.max(0.1, Math.min(0.9, (hi - lo) / 50000))
}

const FOLLOWER_FACTOR = (min, max) => {
  if ((min === 0 || min == null) && max == null) return 1.0
  if (min === 0 && max === 1000) return 0.5
  if (min === 0 && max === 5000) return 0.7
  if (min === 1000 && max === 50000) return 0.55
  if (min === 50000 && max == null) return 0.15
  const lo = min ?? 0
  const hi = max ?? 100000
  return Math.max(0.1, Math.min(0.9, (hi - lo) / 100000))
}

const MEDIA_FACTOR = (min, max) => {
  if ((min === 0 || min == null) && max == null) return 1.0
  if (min === 0 && max === 10) return 0.6
  if (min === 10 && max === 100) return 0.55
  if (min === 100 && max == null) return 0.35
  return 0.7
}

const PRIVACY_FACTOR = (v) => (v === 'public' ? 0.7 : v === 'private' ? 0.3 : 1.0)
const GENDER_FACTOR = (v) => (v == null ? 1.0 : 0.5)
const NSFW_FACTOR = (excludeNsfw) => (excludeNsfw ? 0.92 : 1.0)

export function estimateAudienceReach(filters) {
  const factor =
    FOLLOWING_FACTOR(filters.followingMin, filters.followingMax) *
    FOLLOWER_FACTOR(filters.followerMin, filters.followerMax) *
    MEDIA_FACTOR(filters.mediaMin, filters.mediaMax) *
    PRIVACY_FACTOR(filters.accountPrivacy) *
    GENDER_FACTOR(filters.genderTarget) *
    NSFW_FACTOR(filters.excludeNsfw)
  const raw = Math.round(POOL * factor)
  const count = Math.max(200, Math.min(POOL, raw))
  // Health bands. Tone uses CLAUDE.md tokens — green for the sweet
  // spot, yellow for both extremes (too tight / too wide). Red is
  // reserved for connection errors elsewhere on the dashboard.
  let health, tone
  if (count < 500) {
    health = 'Very tight'
    tone = 'yellow'
  } else if (count < 2000) {
    health = 'Tight focus'
    tone = 'yellow'
  } else if (count < 20000) {
    health = 'Healthy reach'
    tone = 'green'
  } else {
    health = 'Wide reach'
    tone = 'yellow'
  }
  return { count, health, tone }
}
