// Deterministic mock proration for Growth+ tier changes.
//
// V1 has no backend, so we fake proration as a flat linear interpolation
// over a 30-day cycle. Real billing systems run more nuanced math, but
// this gives the user the same shape of feedback ("$X today" / "$X credit
// next bill") without lying about precision.
//
// Returns:
//   { kind: 'upgrade' | 'downgrade', amount: number }
// `amount` is always a non-negative whole-dollar integer.
//
// daysBetween clamps negative results to 0 so an already-past endsAt
// doesn't produce negative proration.

const DAYS_IN_CYCLE = 30

export function daysBetween(fromIso, toIso) {
  const from = new Date(fromIso).getTime()
  const to = new Date(toIso).getTime()
  const ms = to - from
  if (Number.isNaN(ms)) return 0
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

export function prorationFor({ oldPrice, newPrice, endsAt, today }) {
  const now = today ?? new Date().toISOString()
  const daysRemaining = daysBetween(now, endsAt)
  const diff = newPrice - oldPrice
  if (diff > 0) {
    return {
      kind: 'upgrade',
      amount: Math.round((diff * daysRemaining) / DAYS_IN_CYCLE),
    }
  }
  return {
    kind: 'downgrade',
    amount: Math.round((-diff * daysRemaining) / DAYS_IN_CYCLE),
  }
}
