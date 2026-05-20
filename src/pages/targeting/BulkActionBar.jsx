import { Archive, ArchiveRestore, Pause, X } from 'lucide-react'

// Renders in the FilterRow slot when selection mode is active. Styled
// to match FilterRow's pill language (h-8 rounded-full, flex-wrap row)
// so selection mode reads as a different state of the same row, not a
// separate chrome bar.
//
// Layout: "N selected" chip on the left (with embedded X to exit),
// action buttons clustered on the right (`lg:ml-auto`, wraps below
// the chip on mobile). Pure presentation — parent owns state.
//
// A11y: role="toolbar" with aria-label; count is aria-live so screen
// readers announce changes. Action buttons get the count interpolated
// into their aria-label.
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
      className="mt-4 flex flex-wrap items-center gap-2 lg:flex-nowrap lg:gap-3"
    >
      <span
        aria-live="polite"
        className="inline-flex h-8 items-center gap-1.5 rounded-full bg-blue-tint pl-3 pr-1 text-xs font-medium text-blue-text"
      >
        <span>{count} selected</span>
        <button
          type="button"
          onClick={onExit}
          aria-label="Cancel selection"
          className="inline-flex h-6 w-6 items-center justify-center rounded-full text-blue-text/70 hover:bg-blue-base/10 hover:text-blue-text"
        >
          <X className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </span>

      <div className="flex items-center gap-2 lg:ml-auto">
        {bucket === 'active' && (
          <>
            <button
              type="button"
              onClick={onPause}
              disabled={count === 0 || pauseDisabled}
              aria-label={`Pause ${count} targets`}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-bg px-3 text-xs font-medium text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-text-secondary"
            >
              <Pause className="h-3.5 w-3.5" aria-hidden="true" />
              Pause
            </button>
            <button
              type="button"
              onClick={onRemove}
              disabled={count === 0}
              aria-label={`Archive ${count} targets`}
              className="inline-flex h-8 items-center gap-1.5 rounded-full bg-red-tint px-3 text-xs font-medium text-red-text hover:bg-red-tint/80 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-tint"
            >
              <Archive className="h-3.5 w-3.5" aria-hidden="true" />
              Remove
            </button>
          </>
        )}

        {bucket === 'archived' && (
          <button
            type="button"
            onClick={onRestore}
            disabled={count === 0}
            aria-label={`Restore ${count} targets`}
            className="inline-flex h-8 items-center gap-1.5 rounded-full bg-bg px-3 text-xs font-medium text-text-secondary hover:text-text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:text-text-secondary"
          >
            <ArchiveRestore className="h-3.5 w-3.5" aria-hidden="true" />
            Restore
          </button>
        )}
      </div>
    </div>
  )
}
