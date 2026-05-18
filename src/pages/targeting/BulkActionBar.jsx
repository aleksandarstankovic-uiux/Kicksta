import { X } from 'lucide-react'

// Sticky toolbar shown in place of FilterRow while bulk-select mode
// is active. Owns the "N selected" count, the close X, and the
// bucket-specific action buttons. Pure presentation — parent owns
// state and callbacks.
//
// Layout: left = X + count, right = action buttons. On mobile the
// action buttons can wrap below the count via flex-wrap.
//
// A11y: role="toolbar" with aria-label; the count is aria-live so
// screen readers announce changes. Action buttons get the count
// interpolated into their aria-label.
export default function BulkActionBar({
  count,
  bucket,            // 'active' | 'archived'
  onExit,
  onPause,
  onRemove,
  onRestore,
  pauseDisabled,     // true when no selected row can transition to paused
}) {
  return (
    <div
      role="toolbar"
      aria-label="Bulk actions"
      className="sticky top-0 z-10 mt-4 flex items-center gap-2 border-b border-border bg-surface/95 px-2 py-2 backdrop-blur"
    >
      <button
        type="button"
        onClick={onExit}
        aria-label="Cancel selection"
        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-text-secondary hover:bg-bg hover:text-text-primary"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>

      <span
        aria-live="polite"
        className="flex-1 text-sm font-medium text-text-primary"
      >
        {count} selected
      </span>

      {bucket === 'active' && (
        <>
          <button
            type="button"
            onClick={onPause}
            disabled={pauseDisabled}
            aria-label={`Pause ${count} targets`}
            className="inline-flex h-9 items-center rounded-full bg-bg px-3 text-xs font-medium text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-text-secondary"
          >
            Pause
          </button>
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Archive ${count} targets`}
            className="inline-flex h-9 items-center rounded-full bg-red-tint px-3 text-xs font-medium text-red-text hover:bg-red-tint/80"
          >
            Remove
          </button>
        </>
      )}

      {bucket === 'archived' && (
        <button
          type="button"
          onClick={onRestore}
          aria-label={`Restore ${count} targets`}
          className="inline-flex h-9 items-center rounded-full bg-bg px-3 text-xs font-medium text-text-secondary hover:text-text-primary"
        >
          Restore
        </button>
      )}
    </div>
  )
}
