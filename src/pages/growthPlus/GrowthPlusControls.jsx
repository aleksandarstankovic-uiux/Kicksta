import { Lock, Sliders } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { mockGrowthPlusTierById, mockGrowthPlusTiers } from '@/mocks/growth'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

const SPEED_OPTIONS = [
  { value: 'slow', label: 'Slow', note: 'Easier on IG; fewer boosts per day.' },
  { value: 'steady', label: 'Steady', note: 'Recommended for most accounts; lower IG safety risk.' },
  { value: 'fast', label: 'Fast', note: 'Maximum boosts; check on results often.' },
]

const QUALITY_OPTIONS = [
  { value: 'broad', label: 'Broad', note: 'Wider reach across audiences.' },
  { value: 'targeted', label: 'Targeted', note: 'Match your niche; balanced reach + engagement.' },
  { value: 'top', label: 'Top accounts', note: 'Active accounts likely to like + save.' },
]

// Returns the cheapest tier whose `allowed` set contains `value`.
// Used to render the "Available on Pro+" tooltip on locked segments.
function unlockTier(allowedKey, value) {
  return mockGrowthPlusTiers.find((t) => t[allowedKey].includes(value))
}

// Growth+ operational controls. Leads with a one-line "how it works"
// orientation, then pause + speed + quality. Locked segment options
// (gated by the current tier) render with a Lock icon and refuse
// clicks, but stay visible so users see what they unlock by upgrading.
export default function GrowthPlusControls() {
  const config = useGrowthConfig((s) => s.config.growthPlusControls)
  const toggleEnabled = useGrowthConfig((s) => s.toggleGrowthPlusEnabled)
  const setSpeed = useGrowthConfig((s) => s.setGrowthPlusSpeed)
  const setQuality = useGrowthConfig((s) => s.setGrowthPlusQuality)

  const tier = mockGrowthPlusTierById[config.tier]
  const speedNote = SPEED_OPTIONS.find((o) => o.value === config.speed)?.note
  const qualityNote = QUALITY_OPTIONS.find(
    (o) => o.value === config.quality,
  )?.note

  return (
    <section className="rounded-xl border border-border bg-surface p-4 md:p-5">
      <div className="flex items-center gap-2">
        <CardChip color="purple" icon={Sliders} />
        <h2 className="text-base font-semibold text-text-primary">Growth+ controls</h2>
        <InfoTooltip text="These controls only affect Growth+. Targeted Growth settings live on the Engagement page." />
      </div>

      <p className="mt-3 text-xs leading-relaxed text-text-secondary">
        Growth+ uses a network of active accounts to amplify your most recent
        posts. Boost activity is throttled to stay within Instagram's safety
        limits.
      </p>

      <div className="mt-4 flex items-start justify-between gap-3 border-t border-border pt-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">Boost active</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Pause boost while keeping your subscription.
          </p>
        </div>
        <CardToggle
          checked={config.enabled}
          onClick={toggleEnabled}
          ariaLabel="Toggle Growth+ boost"
        />
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-medium text-text-primary">Speed</p>
        <p className="mt-1 text-xs text-text-muted">{speedNote}</p>
        <SegmentedControl
          options={SPEED_OPTIONS}
          value={config.speed}
          onChange={setSpeed}
          disabled={!config.enabled}
          allowed={tier?.allowedSpeed}
          allowedKey="allowedSpeed"
        />
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-medium text-text-primary">Quality</p>
        <p className="mt-1 text-xs text-text-muted">{qualityNote}</p>
        <SegmentedControl
          options={QUALITY_OPTIONS}
          value={config.quality}
          onChange={setQuality}
          disabled={!config.enabled}
          allowed={tier?.allowedQuality}
          allowedKey="allowedQuality"
        />
      </div>
    </section>
  )
}

function CardToggle({ checked, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-green-base' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}

function SegmentedControl({ options, value, onChange, disabled, allowed, allowedKey }) {
  return (
    <div
      className={`mt-3 flex w-full rounded-full bg-bg p-1 ${
        disabled ? 'opacity-60' : ''
      }`}
      aria-disabled={disabled}
    >
      {options.map((opt) => {
        const selected = value === opt.value
        const locked = allowed ? !allowed.includes(opt.value) : false
        const unlocksOn = locked ? unlockTier(allowedKey, opt.value) : null
        return (
          <SegmentButton
            key={opt.value}
            option={opt}
            selected={selected}
            locked={locked}
            unlocksOn={unlocksOn}
            onClick={() => !locked && onChange(opt.value)}
            disabled={disabled || locked}
          />
        )
      })}
    </div>
  )
}

function SegmentButton({ option, selected, locked, unlocksOn, onClick, disabled }) {
  return (
    <span className="group relative flex-1">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-disabled={locked || undefined}
        className={`inline-flex h-8 w-full items-center justify-center gap-1 rounded-full px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
          selected
            ? 'bg-surface text-text-primary shadow-sm'
            : locked
              ? 'text-text-muted'
              : 'text-text-secondary hover:text-text-primary'
        }`}
      >
        {locked && <Lock className="h-3 w-3" aria-hidden="true" />}
        {option.label}
      </button>
      {locked && unlocksOn && (
        <span
          role="tooltip"
          className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-max max-w-[200px] -translate-x-1/2 rounded-lg bg-text-primary px-2.5 py-1.5 text-[11px] leading-relaxed text-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
          Available on {unlocksOn.name}
        </span>
      )}
    </span>
  )
}
