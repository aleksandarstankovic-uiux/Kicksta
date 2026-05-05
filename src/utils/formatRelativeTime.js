// Compact relative-time formatter ("2h ago", "1d ago"). Used by the
// Overview Activity feed and the Targeting drawer's recent-activity
// list. Minimum bucket is `1m ago` — anything more recent rounds up
// so the UI never shows `0m ago`.
export function formatRelativeTime(iso) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffMin = Math.max(1, Math.round(diffMs / 60000))
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.round(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.round(diffHr / 24)
  return `${diffDay}d ago`
}
