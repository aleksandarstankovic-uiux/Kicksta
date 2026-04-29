// Shared subscription presentation helpers. Lives next to the
// account page since both the list card and the detail page need
// identical status mappings, avatar fallbacks, and date formatting.
// Kept module-level so React hot-reload doesn't recreate them
// per-render.

export const STATUS_PILL = {
  active: { cls: 'bg-green-tint text-green-text', label: 'Active' },
  trialing: { cls: 'bg-blue-tint text-blue-text', label: 'Trialing' },
  past_due: { cls: 'bg-red-tint text-red-text', label: 'Past due' },
  canceled: { cls: 'bg-bg text-text-secondary', label: 'Canceled' },
}

export function letterFor(username) {
  return String(username ?? '').replace(/^@/, '').charAt(0).toUpperCase() || '·'
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function daysSince(iso) {
  const ms = Date.now() - new Date(iso).getTime()
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)))
}
