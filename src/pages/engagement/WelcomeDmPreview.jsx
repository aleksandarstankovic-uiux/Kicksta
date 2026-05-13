import { Pencil } from 'lucide-react'

// Chat-bubble preview shown beneath the Welcome DM toggle row.
//
// The bubble itself is the affordance — clicking it opens the edit
// modal. Renders in BOTH states (on / off) so the card height stays
// constant; the off-state shows muted placeholder copy and the click
// handler is disabled. The Pencil icon in the top-right corner makes
// the edit affordance visible at a glance; the entire bubble is still
// clickable so the icon is a marker, not the only target.
export default function WelcomeDmPreview({ message, onEdit, enabled }) {
  return (
    <div className="mt-5 pb-3">
      <button
        type="button"
        onClick={enabled ? onEdit : undefined}
        disabled={!enabled}
        aria-label={enabled ? 'Edit welcome DM message' : undefined}
        className={`group relative w-full rounded-2xl rounded-tl-sm border px-4 py-3 pr-10 text-left text-[15px] leading-relaxed transition-all ${
          enabled
            ? 'cursor-pointer border-transparent bg-blue-tint text-text-primary hover:border-blue-base hover:bg-blue-tint/70 hover:shadow-sm'
            : 'cursor-not-allowed border-transparent bg-bg text-text-muted'
        }`}
      >
        {/* Hard-truncate to exactly 2 lines regardless of message length:
            line-clamp-2 plus an explicit max-height in line-height units
            (text-[15px] × leading-relaxed × 2 lines ≈ 2.85em) so the
            bubble never grows even if line-clamp is somehow overridden. */}
        <span
          className="line-clamp-2 block overflow-hidden break-words"
          style={{ maxHeight: '2.85em' }}
        >
          {enabled
            ? message
            : 'Toggle on to send a custom welcome message to new followers.'}
        </span>
        {enabled && (
          <Pencil
            className="absolute right-3 top-3 h-3.5 w-3.5 text-text-secondary"
            aria-hidden="true"
          />
        )}
      </button>
    </div>
  )
}
