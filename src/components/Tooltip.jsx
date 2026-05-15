import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

// Generic hover tooltip wrapper. Wraps any child element and renders
// a styled bubble below or above it on hover.
//
// Portal-rendered to document.body with fixed positioning so the
// bubble escapes any overflow-hidden ancestors (modals, scrollable
// lists, dropdowns with rounded clipping). Position recalculates
// on each mouseenter — slight scroll-while-hovering may drift, which
// is acceptable for short pill explainers.
//
// Viewport clamping: if the bubble's center-aligned position would
// overflow the left or right edge of the viewport, we shift it
// inward so the entire bubble stays on screen. Important for pills
// near the screen edges (mobile + bottom-sheet modals).
//
// Mouse-only — no tabIndex on the wrapper so it can safely nest
// inside <button> rows without creating invalid HTML.
const BUBBLE_MAX_WIDTH = 240
const VIEWPORT_PADDING = 12

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
    const viewportWidth =
      typeof window !== 'undefined' ? window.innerWidth : 9999

    // Default: bubble centered on the trigger.
    let left = rect.left + rect.width / 2
    // Clamp so a half-bubble (BUBBLE_MAX_WIDTH/2) on each side stays
    // within the viewport padding. Pills near the left edge get
    // pushed right; pills near the right edge get pushed left.
    const halfBubble = BUBBLE_MAX_WIDTH / 2
    if (left - halfBubble < VIEWPORT_PADDING) {
      left = VIEWPORT_PADDING + halfBubble
    } else if (left + halfBubble > viewportWidth - VIEWPORT_PADDING) {
      left = viewportWidth - VIEWPORT_PADDING - halfBubble
    }

    if (position === 'top') {
      setCoords({ top: rect.top - 4, left })
    } else {
      setCoords({ top: rect.bottom + 4, left })
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
        className={`cursor-help ${className}`}
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
              maxWidth: BUBBLE_MAX_WIDTH,
              transform:
                position === 'top'
                  ? 'translate(-50%, -100%)'
                  : 'translateX(-50%)',
            }}
            className="pointer-events-none fixed z-[100] w-max rounded-lg bg-text-primary px-2.5 py-1.5 text-[11px] leading-relaxed text-surface shadow-lg"
          >
            {text}
          </span>,
          document.body,
        )}
    </>
  )
}
