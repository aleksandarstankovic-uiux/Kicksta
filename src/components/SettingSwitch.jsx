// Shared switch primitive used by every toggle on the Growth page and
// anywhere else a consistent "setting with a switch" row is needed.
//
// Two non-default modes:
//   - `locked`   — paywall state. Renders the row in a subdued style
//                  with an `Advanced` pill next to the title; clicking
//                  the row routes to the page-level upgrade flow via
//                  `onLockedTap`. Does NOT call `onChange`.
//   - `disabled` — "this setting doesn't apply right now" state.
//                  Renders the row at opacity-60, the switch button
//                  has a real `disabled` attribute, and clicks are
//                  ignored entirely (no upgrade affordance, no
//                  onChange call). Independent of `locked` — the two
//                  flags can be combined, with `disabled` winning.

export default function SettingSwitch({
  title,
  description,
  icon: Icon,
  checked,
  onChange,
  locked = false,
  disabled = false,
  planLabel = 'Advanced',
  onLockedTap,
}) {
  const handleToggle = () => {
    if (disabled) return
    if (locked) {
      onLockedTap?.()
      return
    }
    onChange?.(!checked)
  }

  return (
    <div
      className={`flex items-center gap-3 py-3 ${
        locked && !disabled ? 'cursor-pointer' : ''
      } ${disabled ? 'opacity-60' : ''}`}
      onClick={locked && !disabled ? handleToggle : undefined}
    >
      {/* Left zone: optional icon + title + pill + description. */}
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        {Icon && (
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                locked ? 'text-text-secondary' : 'text-text-primary'
              }`}
            >
              {title}
            </span>
            {locked && (
              <span className="shrink-0 rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
                {planLabel}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-text-secondary">{description}</p>
          )}
        </div>
      </div>

      {/* Right zone: the switch itself. */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={locked || disabled}
        onClick={(e) => {
          e.stopPropagation()
          handleToggle()
        }}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
          locked || disabled
            ? 'cursor-not-allowed bg-border opacity-60'
            : checked
              ? 'bg-green-base'
              : 'bg-border'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
