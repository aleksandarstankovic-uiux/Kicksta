import { useEffect, useState } from 'react'
import {
  mockCloseFriendsProgress,
  mockCloseFriendsRecentHandles,
} from '@/mocks/growthConfig'

// Progress bar + animated handle ticker for the Close Friends Adder.
// Values are mocked from src/mocks/growthConfig.js — real wiring is
// future work.
//
// `mode` is 'add' | 'remove'; the verb in the ticker line flips
// accordingly. When `enabled === false`, the same shape renders with
// muted placeholder copy + a 0% bar — keeps the Engagement card
// height constant whether the toggle is on or off.
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
    <div className="mt-3">
      <div className="rounded-lg bg-bg p-3">
        <p
          className={`text-xs font-medium ${enabled ? 'text-text-primary' : 'text-text-muted'}`}
        >
          {enabled
            ? `${added} of ${total} followers ${pastTense}`
            : 'Progress will appear when on'}
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-green-base transition-[width] duration-500"
            style={{ width: `${enabled ? pct : 0}%` }}
          />
        </div>
      </div>
      <p
        className={`mt-2 flex items-center gap-2 text-xs ${
          enabled ? 'animate-pulse text-text-secondary' : 'text-text-muted'
        }`}
      >
        {enabled ? `${verb} ${handle}…` : 'Currently inactive'}
      </p>
    </div>
  )
}
