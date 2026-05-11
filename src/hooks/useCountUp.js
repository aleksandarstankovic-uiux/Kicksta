import { useEffect, useRef, useState } from 'react'

// Counts up from 0 to `target` over `duration` ms using requestAnimationFrame.
// Easing: easeOutQuart.
//
// Mount-only — no re-trigger on prop changes. V1 mocks are stable;
// production with live data should re-trigger on `target` change but
// that's a follow-up.
//
// Usage:
//   const value = useCountUp(143)
//   return <p>+{value}</p>
export function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    function tick(now) {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(Math.round(target * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // Intentionally mount-only — don't re-trigger when target changes in V1.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return value
}
