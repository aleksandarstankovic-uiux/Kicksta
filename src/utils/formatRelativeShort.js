// Compact relative-time formatter — "5d ago", "2w ago", "1mo ago".
// For UI labels next to settings entries; not meant for activity feeds.
export function formatRelativeShort(iso, now = new Date()) {
  const ms = now - new Date(iso)
  const sec = Math.max(0, Math.floor(ms / 1000))
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)
  const week = Math.floor(day / 7)
  const month = Math.floor(day / 30)
  const year = Math.floor(day / 365)
  if (sec < 60) return 'just now'
  if (min < 60) return `${min}m ago`
  if (hour < 24) return `${hour}h ago`
  if (day < 7) return `${day}d ago`
  if (week < 5) return `${week}w ago`
  if (month < 12) return `${month}mo ago`
  return `${year}y ago`
}
