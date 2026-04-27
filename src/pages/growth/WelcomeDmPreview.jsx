import { Pencil } from 'lucide-react'

// Renders the chat-bubble message preview + filled "Edit message"
// button shown beneath the Welcome DM toggle row when it's enabled.
//
// The bubble visually clamps to 2 lines via line-clamp-2 so very long
// messages don't blow up the card height. Editing happens in
// WelcomeDmModal (unchanged from v5).
export default function WelcomeDmPreview({ message, onEdit }) {
  return (
    <div className="mt-3 flex flex-col gap-2 pb-3">
      <div className="rounded-2xl rounded-tl-sm bg-blue-tint px-3 py-2 text-sm leading-relaxed text-text-primary">
        <p className="line-clamp-2">{message}</p>
      </div>
      <div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-base px-3 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          Edit message
        </button>
      </div>
    </div>
  )
}
