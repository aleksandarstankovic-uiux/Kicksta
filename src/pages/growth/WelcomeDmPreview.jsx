// Chat-bubble preview shown beneath the Welcome DM toggle row.
//
// The bubble itself is the affordance — clicking it opens the edit
// modal. Renders in BOTH states (on / off) so the card height stays
// constant; the off-state shows muted placeholder copy and the click
// handler is disabled.
export default function WelcomeDmPreview({ message, onEdit, enabled }) {
  return (
    <div className="mt-3 pb-3">
      <button
        type="button"
        onClick={enabled ? onEdit : undefined}
        disabled={!enabled}
        aria-label={enabled ? 'Edit welcome DM message' : undefined}
        className={`w-full rounded-2xl rounded-tl-sm px-3 py-2 text-left text-sm leading-relaxed transition-colors ${
          enabled
            ? 'cursor-pointer bg-blue-tint text-text-primary hover:bg-blue-tint/80'
            : 'cursor-not-allowed bg-bg text-text-muted'
        }`}
      >
        <span className="line-clamp-2 block">
          {enabled
            ? message
            : 'Toggle on to send a custom welcome message to new followers.'}
        </span>
      </button>
      <p
        className={`mt-1.5 text-xs ${enabled ? 'text-text-secondary' : 'text-text-muted'}`}
        aria-hidden="true"
      >
        {enabled ? 'Click the bubble to edit' : 'Edit becomes available when on'}
      </p>
    </div>
  )
}
