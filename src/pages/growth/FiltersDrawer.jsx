import { useEffect, useState } from 'react'
import { Info, X } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
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
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

const GENDER_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

function InfoTooltip({ text }) {
  return (
    <span className="group relative hidden lg:inline-block">
      <Info className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-text-primary px-2.5 py-1.5 text-[11px] leading-relaxed text-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}

function FilterRow({ title, tooltip, locked = false, onLockedTap, children }) {
  return (
    <div
      className={`flex flex-col gap-2 border-b border-border py-3 last:border-b-0 lg:flex-row lg:items-center lg:gap-4 ${
        locked ? 'cursor-pointer' : ''
      }`}
      onClick={locked ? onLockedTap : undefined}
    >
      <div className="flex items-center gap-1.5 lg:w-36 lg:shrink-0">
        <span
          className={`text-sm font-medium ${
            locked ? 'text-text-secondary' : 'text-text-primary'
          }`}
        >
          {title}
        </span>
        {locked && (
          <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
            Advanced
          </span>
        )}
        <InfoTooltip text={tooltip} />
      </div>
      <div className={`min-w-0 flex-1 ${locked ? 'pointer-events-none opacity-60' : ''}`}>
        {children}
      </div>
    </div>
  )
}

function SegmentedPills({ value, options, onChange }) {
  return (
    <div className="inline-flex rounded-full bg-bg p-1">
      {options.map((o) => {
        const selected = value === o.value
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors ${
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

export default function FiltersDrawer({ open, onClose, onRequestUpgrade }) {
  const [mounted, setMounted] = useState(false)

  const config = useGrowthConfig((s) => s.config)
  const setFilter = useGrowthConfig((s) => s.setFilter)
  const toggleExcludeNsfw = useGrowthConfig((s) => s.toggleExcludeNsfw)

  const genderLocked = mockUser.plan !== 'advanced'

  useEffect(() => {
    if (!open) return
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

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
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Customize filters"
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 transition-opacity duration-200 lg:items-center ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-h-[85vh] flex-col overflow-hidden rounded-t-xl bg-surface shadow-xl transition-all duration-200 ease-out lg:max-w-2xl lg:rounded-xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">Customize filters</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <FilterRow title="Following count" tooltip="People this account follows.">
            <PresetRangePills
              presets={FOLLOWING_PRESETS}
              value={followingRange}
              onChange={(v) => setFilter('followingRange', v)}
            />
          </FilterRow>

          <FilterRow title="Follower count" tooltip="How many followers they have.">
            <PresetRangePills
              presets={FOLLOWER_PRESETS}
              value={followerRange}
              onChange={(v) => setFilter('followerRange', v)}
            />
          </FilterRow>

          <FilterRow title="Media count" tooltip="How many posts they've published.">
            <PresetRangePills
              presets={MEDIA_PRESETS}
              value={mediaRange}
              onChange={(v) => setFilter('mediaRange', v)}
            />
          </FilterRow>

          <FilterRow title="Account privacy" tooltip="Whether their profile is public or private.">
            <SegmentedPills
              value={config.filters.accountPrivacy}
              options={PRIVACY_OPTIONS}
              onChange={(v) => setFilter('accountPrivacy', v)}
            />
          </FilterRow>

          <FilterRow
            title="Gender target"
            tooltip="Narrow targeting by account gender."
            locked={genderLocked}
            onLockedTap={() => onRequestUpgrade('gender_filter')}
          >
            <SegmentedPills
              value={config.filters.genderTarget}
              options={GENDER_OPTIONS}
              onChange={(v) => setFilter('genderTarget', v)}
            />
          </FilterRow>

          <FilterRow title="Exclude NSFW" tooltip="Skip accounts that appear to contain adult content.">
            <div className="flex justify-end lg:justify-start">
              <button
                type="button"
                role="switch"
                aria-checked={config.filters.excludeNsfw}
                onClick={() => toggleExcludeNsfw()}
                className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
                  config.filters.excludeNsfw ? 'bg-green-base' : 'bg-border'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                    config.filters.excludeNsfw ? 'translate-x-[18px]' : 'translate-x-0.5'
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
          </FilterRow>
        </div>

        <div className="border-t border-border px-5 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
