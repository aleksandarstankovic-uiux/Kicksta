import { formatCount } from '@/utils/formatCount'

function rangeLabel(min, max, unit) {
  if ((min === 0 || min == null) && max == null) return null
  if (min === 0 || min == null) return `Up to ${formatCount(max)} ${unit}`
  if (max == null) return `${formatCount(min)}+ ${unit}`
  return `${formatCount(min)}–${formatCount(max)} ${unit}`
}

// Compresses the current filters config into a one-sentence summary
// for the collapsed Filters card. Omits default / all-inclusive dials.
export function summarizeFilters(filters) {
  const parts = []

  const follower = rangeLabel(filters.followerMin, filters.followerMax, 'followers')
  if (follower) parts.push(follower)

  const following = rangeLabel(filters.followingMin, filters.followingMax, 'following')
  if (following) parts.push(following)

  const media = rangeLabel(filters.mediaMin, filters.mediaMax, 'posts')
  if (media) parts.push(media)

  if (filters.accountPrivacy === 'public') parts.push('Public only')
  else if (filters.accountPrivacy === 'private') parts.push('Private only')

  if (filters.genderTarget === 'male') parts.push('Male accounts')
  else if (filters.genderTarget === 'female') parts.push('Female accounts')

  if (filters.excludeNsfw) parts.push('NSFW excluded')

  if (parts.length === 0) return 'All accounts — no restrictions.'
  return parts.join(' · ')
}
