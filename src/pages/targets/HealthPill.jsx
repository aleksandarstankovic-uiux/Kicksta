// Size-based match quality indicator for a target. Thresholds are
// based on follower count for accounts and post count for hashtags.
// Red is intentionally avoided (PRODUCT.md reserves it for connection
// errors) — "needs attention" states use yellow instead.
//
// Labels are terse (v3.2) so the pill stays narrow next to target
// names. Longer tooltips can explain the nuance later if needed.

export function evaluateHealth(count) {
  if (count == null) return null
  if (count < 1_000) return { label: 'Small', tone: 'warn' }
  if (count < 100_000) return { label: 'Good fit', tone: 'good' }
  if (count < 1_000_000) return { label: 'Large', tone: 'warn' }
  return { label: 'Very large', tone: 'warn' }
}

export default function HealthPill({ count, className = '' }) {
  const h = evaluateHealth(count)
  if (!h) return null
  const tone =
    h.tone === 'good'
      ? 'bg-green-tint text-green-text'
      : 'bg-yellow-tint text-yellow-text'
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone} ${className}`}
    >
      {h.label}
    </span>
  )
}
