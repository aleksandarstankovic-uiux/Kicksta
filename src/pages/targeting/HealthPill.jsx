import Tooltip from '@/components/Tooltip'

// Match-quality indicator for a target. Looks at multiple signals,
// not just follower count:
//
//   - Verified accounts → poor fit. They rarely follow back small/
//     mid accounts that try to grow off their audience.
//   - Private accounts → poor fit. Their follower lists are hidden,
//     so the engine can't reach the audience reliably.
//   - Count-based fallback (same thresholds as before):
//       < 1K     → "Small"      warn
//       < 100K   → "Good fit"   good
//       < 1M     → "Large"      warn
//       ≥ 1M     → "Very large" warn
//
// When multiple traits apply (e.g., verified AND very large), the
// most-specific reason wins in this order:
//   Verified > Private > count-based bucket.
//
// Red is intentionally avoided (PRODUCT.md reserves it for connection
// errors). All "needs attention" states use yellow.
//
// Each state carries an `explain` string surfaced via Tooltip on
// hover, so users learn what target size works best as they browse.

export function evaluateHealth({ count, verified, isPrivate } = {}) {
  if (count == null) return null
  if (verified) {
    return {
      label: 'Verified',
      tone: 'warn',
      explain:
        'Verified accounts rarely follow back smaller creators. Try niche accounts in your space instead.',
    }
  }
  if (isPrivate) {
    return {
      label: 'Private',
      tone: 'warn',
      explain:
        "Private accounts hide their follower list, so the engine can't reach the audience reliably.",
    }
  }
  if (count < 1_000) {
    return {
      label: 'Small',
      tone: 'warn',
      explain:
        'Accounts under 1K followers can be slow to grow your audience. Mix with mid-sized targets.',
    }
  }
  if (count < 100_000) {
    return {
      label: 'Good fit',
      tone: 'good',
      explain:
        'Mid-sized accounts (1K–100K followers) tend to follow back at the highest rate.',
    }
  }
  if (count < 1_000_000) {
    return {
      label: 'Large',
      tone: 'warn',
      explain:
        'Large accounts (100K–1M) follow back less often. Use sparingly alongside mid-sized targets.',
    }
  }
  return {
    label: 'Very large',
    tone: 'warn',
    explain:
      'Very large accounts (1M+) almost never follow back. Niche creators in your space convert better.',
  }
}

export default function HealthPill({
  count,
  verified,
  isPrivate,
  className = '',
}) {
  const h = evaluateHealth({ count, verified, isPrivate })
  if (!h) return null
  const tone =
    h.tone === 'good'
      ? 'bg-green-tint text-green-text'
      : 'bg-yellow-tint text-yellow-text'
  return (
    <Tooltip text={h.explain}>
      <span
        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${tone} ${className}`}
      >
        {h.label}
      </span>
    </Tooltip>
  )
}
