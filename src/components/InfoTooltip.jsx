import { Info } from 'lucide-react'

// Hoverable / focusable info tooltip. Use beside titles to surface
// the explanatory copy that v6 dropped from card subtitles.
//
// Visible on all breakpoints (the FiltersModal copy hid it below lg —
// that constraint doesn't apply to the new card-header use case).
export default function InfoTooltip({ text }) {
  return (
    <span className="group relative inline-block">
      <button
        type="button"
        aria-label="More info"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-text-muted hover:text-text-secondary focus:outline-none focus-visible:text-text-secondary"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-text-primary px-2.5 py-1.5 text-[11px] leading-relaxed text-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}
