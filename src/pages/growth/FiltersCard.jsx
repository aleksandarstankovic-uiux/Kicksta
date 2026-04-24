import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import PresetRangePills from './PresetRangePills'

const FOLLOWING_PRESETS = [
  { key: 'low', label: '< 500', min: 0, max: 500 },
  { key: 'mid', label: '500–5K', min: 500, max: 5000 },
  { key: 'high', label: '5K+', min: 5000, max: null },
]

const FOLLOWER_PRESETS = [
  { key: 'low', label: '< 1K', min: 0, max: 1000 },
  { key: 'mid', label: '1K–50K', min: 1000, max: 50000 },
  { key: 'high', label: '50K+', min: 50000, max: null },
]

const MEDIA_PRESETS = [
  { key: 'low', label: '< 10', min: 0, max: 10 },
  { key: 'mid', label: '10–100', min: 10, max: 100 },
  { key: 'high', label: '100+', min: 100, max: null },
]

const PRIVACY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public only' },
  { value: 'private', label: 'Private only' },
]

const GENDER_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

function SegmentedPills({ value, options, onChange, disabled = false }) {
  return (
    <div
      className={`inline-flex rounded-full bg-bg p-1 ${
        disabled ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      {options.map((o) => {
        const selected = value === o.value
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-medium transition-colors ${
              selected
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export default function FiltersCard({ onRequestUpgrade }) {
  const config = useGrowthConfig((s) => s.config)
  const setFilter = useGrowthConfig((s) => s.setFilter)
  const toggleExcludeNsfw = useGrowthConfig((s) => s.toggleExcludeNsfw)

  const genderLocked = mockUser.plan !== 'advanced'

  const followingRange = {
    min: config.filters.followingMin,
    max: config.filters.followingMax,
  }
  const followerRange = {
    min: config.filters.followerMin,
    max: config.filters.followerMax,
  }
  const mediaRange = {
    min: config.filters.mediaMin,
    max: config.filters.mediaMax,
  }

  return (
    <section className="mt-4 rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Filters</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Target only accounts that match these criteria.
      </p>

      <div className="mt-4 flex flex-col divide-y divide-border">
        {/* Following count */}
        <div className="py-4 first:pt-0">
          <p className="text-sm font-medium text-text-primary">Following count</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            People this account follows.
          </p>
          <div className="mt-2">
            <PresetRangePills
              presets={FOLLOWING_PRESETS}
              value={followingRange}
              onChange={(v) => setFilter('followingRange', v)}
            />
          </div>
        </div>

        {/* Follower count */}
        <div className="py-4">
          <p className="text-sm font-medium text-text-primary">Follower count</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            How many followers they have.
          </p>
          <div className="mt-2">
            <PresetRangePills
              presets={FOLLOWER_PRESETS}
              value={followerRange}
              onChange={(v) => setFilter('followerRange', v)}
            />
          </div>
        </div>

        {/* Media count */}
        <div className="py-4">
          <p className="text-sm font-medium text-text-primary">Media count</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            How many posts they've published.
          </p>
          <div className="mt-2">
            <PresetRangePills
              presets={MEDIA_PRESETS}
              value={mediaRange}
              onChange={(v) => setFilter('mediaRange', v)}
            />
          </div>
        </div>

        {/* Account privacy */}
        <div className="py-4">
          <p className="text-sm font-medium text-text-primary">Account privacy</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Whether their profile is public or private.
          </p>
          <div className="mt-2">
            <SegmentedPills
              value={config.filters.accountPrivacy}
              options={PRIVACY_OPTIONS}
              onChange={(v) => setFilter('accountPrivacy', v)}
            />
          </div>
        </div>

        {/* Gender target (Advanced-only) */}
        <div
          className={`py-4 ${genderLocked ? 'cursor-pointer' : ''}`}
          onClick={genderLocked ? () => onRequestUpgrade('gender_filter') : undefined}
        >
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-medium ${
                genderLocked ? 'text-text-secondary' : 'text-text-primary'
              }`}
            >
              Gender target
            </p>
            {genderLocked && (
              <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
                Advanced
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            Narrow targeting by account gender.
          </p>
          <div className="mt-2">
            <SegmentedPills
              value={config.filters.genderTarget}
              options={GENDER_OPTIONS}
              onChange={(v) => setFilter('genderTarget', v)}
              disabled={genderLocked}
            />
          </div>
        </div>

        {/* Exclude NSFW */}
        <SettingSwitch
          title="Exclude NSFW accounts"
          description="Skip accounts that appear to contain adult content."
          checked={config.filters.excludeNsfw}
          onChange={() => toggleExcludeNsfw()}
        />
      </div>
    </section>
  )
}
