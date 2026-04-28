import { Pencil } from 'lucide-react'

// Chat-bubble preview + filled "Edit message" button shown beneath
// the Welcome DM toggle row.
//
// Renders in BOTH states (on / off) so the card height stays constant.
// When off, the bubble + button slot show muted placeholder copy
// instead of being invisible — fills the reserved space honestly so
// it reads as "here's what'll appear" rather than dead space.
export default function WelcomeDmPreview({ message, onEdit, enabled }) {
  return (
    <div className="mt-3 flex flex-col gap-2 pb-3">
      <div
        className={`rounded-2xl rounded-tl-sm px-3 py-2 text-sm leading-relaxed ${
          enabled
            ? 'bg-blue-tint text-text-primary'
            : 'bg-bg text-text-muted'
        }`}
      >
        <p className="line-clamp-2">
          {enabled
            ? message
            : 'Toggle on to send a custom welcome message to new followers.'}
        </p>
      </div>
      <div>
        {enabled ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-base px-3 text-xs font-medium text-white transition-opacity hover:opacity-90"
          >
            <Pencil className="h-3 w-3" aria-hidden="true" />
            Edit message
          </button>
        ) : (
          <span
            className="inline-flex h-8 items-center text-xs text-text-muted"
            aria-hidden="true"
          >
            Edit becomes available when on
          </span>
        )}
      </div>
    </div>
  )
}
