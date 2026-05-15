import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Generic hover/focus tooltip wrapper. Wraps any child element and
// renders a styled bubble below or above it on hover or keyboard
// focus.
//
// Portal-rendered to document.body with fixed positioning so it
// escapes any overflow-hidden ancestors (modals, scrollable lists,
// dropdowns with rounded clipping). Position recalculates each time
// the trigger is hovered/focused — slight scroll-while-hovering may
// drift, which is acceptable for short pill explanations.
//
// Position:
//   - 'bottom' (default) → bubble below the trigger
//   - 'top'              → bubble above the trigger
export default function Tooltip({
  text,
  children,
  position = 'bottom',
  className = '',
}) {
  const ref = useRef(null)
  const [coords, setCoords] = useState(null)

  function show() {
    if (!ref.current || !text) return
    const rect = ref.current.getBoundingClientRect()
    if (position === 'top') {
      setCoords({ top: rect.top - 4, left: rect.left + rect.width / 2 })
    } else {
      setCoords({ top: rect.bottom + 4, left: rect.left + rect.width / 2 })
    }
  }

  function hide() {
    setCoords(null)
  }

  if (!text) return children

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={hide}
        className={`inline-flex cursor-help ${className}`}
      >
        {children}
      </span>
      {coords &&
        createPortal(
          <span
            role="tooltip"
            style={{
              top: coords.top,
              left: coords.left,
              transform:
                position === 'top'
                  ? 'translate(-50%, -100%)'
                  : 'translateX(-50%)',
            }}
            className="pointer-events-none fixed z-[100] w-max max-w-[240px] rounded-lg bg-text-primary px-2.5 py-1.5 text-[11px] leading-relaxed text-surface shadow-lg"
          >
            {text}
          </span>,
          document.body,
        )}
    </>
  )
}
