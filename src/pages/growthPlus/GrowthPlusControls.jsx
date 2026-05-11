import { Link } from 'react-router-dom'
import { ChevronRight, Sliders } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

const SPEED_OPTIONS = [
  { value: 'slow', label: 'Slow', note: 'Easier on IG; fewer boosts per day.' },
  { value: 'steady', label: 'Steady', note: 'Recommended for most accounts; lower IG safety risk.' },
  { value: 'fast', label: 'Fast', note: 'Maximum boosts; check on results often.' },
]

const QUALITY_OPTIONS = [
  { value: 'broad', label: 'Broad', note: 'Wider reach across audiences.' },
  { value: 'targeted', label: 'Targeted', note: 'Match your niche; balanced reach + engagement.' },
  { value: 'high-engagement', label: 'High-engagement', note: 'Active accounts likely to like + save.' },
]

// Growth+ operational controls — pause toggle + speed + quality segmented
// controls + billing link. All in one section so the user has one place
// to find every Growth+ lever.
export default function GrowthPlusControls() {
  const config = useGrowthConfig((s) => s.config.growthPlusControls)
  const toggleEnabled = useGrowthConfig((s) => s.toggleGrowthPlusEnabled)
  const setSpeed = useGrowthConfig((s) => s.setGrowthPlusSpeed)
  const setQuality = useGrowthConfig((s) => s.setGrowthPlusQuality)

  const speedNote = SPEED_OPTIONS.find((o) => o.value === config.speed)?.note
  const qualityNote = QUALITY_OPTIONS.find((o) => o.value === config.quality)?.note

  return (
    <section className="rounded-xl border border-border bg-surface p-4 md:p-5">
      <div className="flex items-center gap-2">
        <CardChip color="purple" icon={Sliders} />
        <h2 className="text-base font-semibold text-text-primary">Growth+ controls</h2>
        <InfoTooltip text="These controls only affect Growth+. Targeted Growth settings live on the Engagement page." />
      </div>

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
        <SegmentedControl
          options={SPEED_OPTIONS}
          value={config.speed}
          onChange={setSpeed}
          disabled={!config.enabled}
        />
        <p className="mt-2 text-xs text-text-muted">{speedNote}</p>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-medium text-text-primary">Quality</p>
        <SegmentedControl
          options={QUALITY_OPTIONS}
          value={config.quality}
          onChange={setQuality}
          disabled={!config.enabled}
        />
        <p className="mt-2 text-xs text-text-muted">{qualityNote}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-text-secondary">
          Next billing{' '}
          <span className="font-medium text-text-primary">$49.00 on May 25</span>
        </p>
        <Link
          to="/account/growth-plus"
          className="inline-flex items-center gap-1 text-sm font-medium text-purple-text hover:underline"
        >
          Manage
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
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

function SegmentedControl({ options, value, onChange, disabled }) {
  return (
    <div
      className={`mt-2 flex w-full rounded-full bg-bg p-1 ${
        disabled ? 'opacity-60' : ''
      }`}
      aria-disabled={disabled}
    >
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`inline-flex h-8 flex-1 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
              selected
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
