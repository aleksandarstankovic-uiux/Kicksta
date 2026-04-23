import { useEffect, useRef, useState } from 'react'
import { mockSystemStatus } from '@/mocks/systemStatus'
import { useTargetsStore } from '@/stores/useTargetsStore'

// Phase state machine — the order a real run cycles through.
const NEXT_PHASE = {
  analyzing: 'following',
  following: 'waiting',
  waiting: 'unfollowing',
  unfollowing: 'waiting',
}

// Fuzzy next-action copy by phase. No countdowns — PRODUCT.md bans them.
const NEXT_LABEL = {
  analyzing: 'next in ~2 min',
  following: 'next in a moment',
  waiting: 'next in ~4 min',
  unfollowing: 'next in a moment',
  warming_up: '',
  setup: '',
  paused: '',
}

function pickActiveHandle(targets) {
  const active = targets.filter((t) => t.status === 'active')
  if (active.length === 0) return null
  return active[Math.floor(Math.random() * active.length)].value
}

// Returns { phase, targetHandle, actionsToday, nextActionLabel, isPaused }.
// When the baseline mockSystemStatus reports warming_up / setup / paused,
// the state machine is inert — phase stays fixed.
export function useSystemStatus() {
  const targets = useTargetsStore((s) => s.targets)
  const baseline = mockSystemStatus
  const isLive = !['warming_up', 'setup', 'paused'].includes(baseline.state)

  const [phase, setPhase] = useState(
    isLive ? 'analyzing' : baseline.state
  )
  const [targetHandle, setTargetHandle] = useState(
    isLive ? pickActiveHandle(targets) : null
  )
  const [actionsToday, setActionsToday] = useState(
    typeof baseline.actionsToday === 'number' ? baseline.actionsToday : 37
  )
  const targetsRef = useRef(targets)
  targetsRef.current = targets

  useEffect(() => {
    if (!isLive) return

    let cancelled = false
    let timeoutId

    function schedule() {
      const ms = 6000 + Math.random() * 4000
      timeoutId = setTimeout(tick, ms)
    }

    function tick() {
      if (cancelled) return
      setPhase((current) => {
        const next = NEXT_PHASE[current] || 'analyzing'
        if (next === 'following' || next === 'unfollowing') {
          setTargetHandle(pickActiveHandle(targetsRef.current))
        }
        if (next === 'following') {
          setActionsToday((n) => n + 1 + Math.floor(Math.random() * 3))
        }
        return next
      })
      schedule()
    }

    schedule()
    return () => {
      cancelled = true
      clearTimeout(timeoutId)
    }
  }, [isLive])

  return {
    phase,
    targetHandle: phase === 'following' || phase === 'unfollowing' ? targetHandle : null,
    actionsToday,
    nextActionLabel: NEXT_LABEL[phase] || '',
    isPaused: baseline.state === 'paused',
  }
}
