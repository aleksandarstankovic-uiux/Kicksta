import { useEffect } from 'react'

// Shared dismissal logic for top-anchored dropdowns. Calls `onDismiss`
// when the user clicks outside `ref` or presses Escape. Listeners
// only attach while `enabled` is true so the hook is cheap when the
// panel is closed. Mirrors the recipe used by NotificationBell so
// every dropdown in the dashboard dismisses identically.
export default function useDismissOnOutsideClick(ref, enabled, onDismiss) {
  useEffect(() => {
    if (!enabled) return
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onDismiss()
    }
    function handleKey(e) {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [ref, enabled, onDismiss])
}
