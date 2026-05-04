import { useEffect, useState } from 'react'
import {
  mockCloseFriendsProgress,
  mockCloseFriendsRecentHandles,
} from '@/mocks/growthConfig'

// Activity block for the Close Friends Adder. Visual treatment mirrors
// `AudienceReachEstimate` — same container recipe, same eyebrow style,
// same right-side status pill — so the two settings-derived cards on
// the page read as siblings.
//
// `mode` is 'add' | 'remove'; the verb in the ticker line flips
// accordingly. When `enabled === false`, the block renders the same
// shell with muted placeholder copy (no active pill).
export default function CloseFriendsProgress({ mode, enabled }) {
  const { added, total } = mockCloseFriendsProgress
  const pct = Math.max(0, Math.min(100, Math.round((added / total) * 100)))

  const [handleIdx, setHandleIdx] = useState(0)

  useEffect(() => {
    if (!enabled) return
    const id = setInterval(() => {
      setHandleIdx((i) => (i + 1) % mockCloseFriendsRecentHandles.length)
    }, 4000)
    return () => clearInterval(id)
  }, [enabled])

  const verb = mode === 'remove' ? 'Removing' : 'Adding'
  const pastTense = mode === 'remove' ? 'removed' : 'added'
  const handle = mockCloseFriendsRecentHandles[handleIdx]

  return (
    <div className="mt-3 rounded-lg bg-bg p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Activity
      </p>
      <div className="mt-1 flex items-center justify-between gap-3">
        <p
          className={`text-sm font-medium ${enabled ? 'text-text-primary' : 'text-text-muted'}`}
        >
          {enabled
            ? `${added} of ${total} followers ${pastTense}`
            : 'Activity will appear when on'}
        </p>
        {enabled && (
          <span className="inline-flex items-center rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
            Active
          </span>
        )}
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className="h-full rounded-full bg-green-base transition-[width] duration-500"
          style={{ width: `${enabled ? pct : 0}%` }}
        />
      </div>
      {enabled && (
        <p className="mt-2 flex items-center gap-2 text-xs text-text-secondary animate-pulse">
          {verb} {handle}…
        </p>
      )}
    </div>
  )
}
