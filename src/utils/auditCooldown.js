// Time math for the Instagram Audit 24h cooldown. Pure functions —
// no React, no store access. Consumed by InstagramAuditCard and any
// future surface that needs to surface audit availability.

const COOLDOWN_MS = 24 * 60 * 60 * 1000

// True when no audit has been downloaded yet OR when the 24h window
// since the last download has elapsed.
export function isAuditAvailable(lastDownloadedAt) {
  if (!lastDownloadedAt) return true
  const elapsed = Date.now() - new Date(lastDownloadedAt).getTime()
  return elapsed >= COOLDOWN_MS
}

// Short human label for the remaining cooldown — "21h" most of the
// time, "45 min" near the boundary. Returns null when the audit is
// available (no countdown to render).
export function nextAuditAvailableIn(lastDownloadedAt) {
  if (!lastDownloadedAt) return null
  const remaining =
    COOLDOWN_MS - (Date.now() - new Date(lastDownloadedAt).getTime())
  if (remaining <= 0) return null
  const minutes = Math.ceil(remaining / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.ceil(minutes / 60)
  return `${hours}h`
}
