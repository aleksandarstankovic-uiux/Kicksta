// Abbreviates large numbers for display: 128_400 → "128K", 12_400_000 → "12.4M".
// Null / undefined → empty string so callers can drop it inline.
export function formatCount(n) {
  if (n == null) return ''
  if (n >= 1_000_000) {
    const v = n / 1_000_000
    const digits = n < 10_000_000 ? 1 : 0
    return `${v.toFixed(digits).replace(/\.0$/, '')}M`
  }
  if (n >= 1_000) {
    const v = n / 1_000
    const digits = n < 10_000 ? 1 : 0
    return `${v.toFixed(digits).replace(/\.0$/, '')}K`
  }
  return n.toLocaleString()
}
