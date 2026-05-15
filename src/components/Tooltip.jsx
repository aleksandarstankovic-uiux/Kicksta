// Generic hover/focus tooltip wrapper. Wraps any child element and
// renders a styled bubble below it on hover or keyboard focus.
//
// Use for adding explanatory text to pills, badges, or short status
// indicators where adding an extra (i) icon would be too noisy.
//
// Position:
//   - 'bottom' (default) → bubble below the wrapped child
//   - 'top'              → bubble above
//
// Same visual recipe as InfoTooltip's bubble, so dashboards using
// both feel consistent. The wrapper is tabIndex=0 so keyboard users
// can reveal the tooltip via Tab (group-focus-within).
export default function Tooltip({
  text,
  children,
  position = 'bottom',
  className = '',
}) {
  if (!text) return children
  const positionClasses =
    position === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
  return (
    <span
      tabIndex={0}
      className={`group relative inline-flex cursor-help focus:outline-none ${className}`}
    >
      {children}
      <span
        role="tooltip"
        className={`pointer-events-none absolute left-1/2 z-20 ${positionClasses} w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-text-primary px-2.5 py-1.5 text-[11px] leading-relaxed text-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100`}
      >
        {text}
      </span>
    </span>
  )
}
