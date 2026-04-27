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
// accordingly. The handle list is the same in both modes.
export default function CloseFriendsProgress({ mode }) {
  const { added, total } = mockCloseFriendsProgress
  const pct = Math.max(0, Math.min(100, Math.round((added / total) * 100)))

  const [handleIdx, setHandleIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setHandleIdx((i) => (i + 1) % mockCloseFriendsRecentHandles.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const verb = mode === 'remove' ? 'Removing' : 'Adding'
  const handle = mockCloseFriendsRecentHandles[handleIdx]

  return (
    <div className="mt-3">
      <div className="rounded-lg bg-bg p-3">
        <p className="text-xs font-medium text-text-primary">
          {added} of {total} followers added
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-green-base transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <p className="mt-2 flex items-center gap-2 text-xs text-text-secondary animate-pulse">
        {verb} {handle}…
      </p>
    </div>
  )
}
