import { useEffect, useState } from 'react'
import { ChevronDown, SlidersHorizontal, User, Users, X } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import InfoTooltip from '@/components/InfoTooltip'
import SettingSwitch from '@/components/SettingSwitch'
import CardChip from '@/components/CardChip'

const FOLLOWING_PRESETS = [
  { key: 'any', label: 'Any', min: 0, max: null },
  { key: 'low', label: 'Up to 500', min: 0, max: 500 },
  { key: 'mid', label: '500 – 5,000', min: 500, max: 5000 },
  { key: 'high', label: '5,000+', min: 5000, max: null },
]

const FOLLOWER_PRESETS = [
  { key: 'any', label: 'Any', min: 0, max: null },
  { key: 'low', label: 'Up to 1,000', min: 0, max: 1000 },
  { key: 'mid', label: '1,000 – 50,000', min: 1000, max: 50000 },
  { key: 'high', label: '50,000+', min: 50000, max: null },
]

const MEDIA_PRESETS = [
  { key: 'any', label: 'Any', min: 0, max: null },
  { key: 'low', label: 'Up to 10', min: 0, max: 10 },
  { key: 'mid', label: '10 – 100', min: 10, max: 100 },
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

// One-click presets that apply to ALL 6 filter dials at once.
// Tapping a preset writes the full set to draft; user still has to
// click Save to commit.
// Each value pair below maps to an existing dropdown preset (no Custom),
// so applying a preset leaves all three Range dropdowns on a labelled
// option instead of the "Custom…" tail.
const QUICK_PRESETS = [
  {
    key: 'most_users',
    label: 'Most users',
    description: 'Mid-range followers and posts. Recommended starting point.',
    values: {
      followingMin: 500,
      followingMax: 5000,
      followerMin: 1000,
      followerMax: 50000,
      mediaMin: 10,
      mediaMax: 100,
      accountPrivacy: 'all',
      genderTarget: null,
      excludeNsfw: true,
    },
  },
  {
    key: 'niche',
    label: 'Niche audience',
    description: 'Smaller, focused public accounts.',
    values: {
      followingMin: 0,
      followingMax: 500,
      followerMin: 0,
      followerMax: 1000,
      mediaMin: 10,
      mediaMax: 100,
      accountPrivacy: 'public',
      genderTarget: null,
      excludeNsfw: true,
    },
  },
  {
    key: 'macro',
    label: 'Macro reach',
    description: 'Established creators with large followings.',
    values: {
      followingMin: 5000,
      followingMax: null,
      followerMin: 50000,
      followerMax: null,
      mediaMin: 100,
      mediaMax: null,
      accountPrivacy: 'all',
      genderTarget: null,
      excludeNsfw: true,
    },
  },
]

// Find the preset matching the current min/max, or return 'custom' if no match.
function presetKeyFor(presets, min, max) {
  const found = presets.find((p) => (p.min ?? 0) === (min ?? 0) && (p.max ?? null) === (max ?? null))
  return found ? found.key : 'custom'
}

function RangeDropdown({ label, tooltip, presets, min, max, onChange }) {
  const matchedKey = presetKeyFor(presets, min, max)
  // Track an explicit "user picked Custom" flag so the dropdown stays on
  // Custom even when the current min/max coincidentally match a named
  // preset (e.g. selecting Custom while on `Any` would otherwise snap
  // straight back to `Any` because both render the same min/max).
  const [forcedCustom, setForcedCustom] = useState(matchedKey === 'custom')
  // Clear the forced flag ONLY when matchedKey changes (i.e. an outside
  // actor — typically a Quick preset — wrote values that match a named
  // preset). The dep list omits `forcedCustom` on purpose so flipping
  // it inside handleSelect doesn't immediately retrigger this and reset
  // the flag back to false.
  useEffect(() => {
    if (matchedKey !== 'custom') setForcedCustom(false)
  }, [matchedKey])
  const currentKey = forcedCustom ? 'custom' : matchedKey
  const isCustom = currentKey === 'custom'

  const handleSelect = (e) => {
    const key = e.target.value
    if (key === 'custom') {
      setForcedCustom(true)
      onChange({ min: min ?? 0, max: max ?? null })
      return
    }
    setForcedCustom(false)
    const preset = presets.find((p) => p.key === key)
    if (preset) {
      onChange({ min: preset.min, max: preset.max })
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <InfoTooltip text={tooltip} />
      </div>
      <div className="relative">
        <select
          value={currentKey}
          onChange={handleSelect}
          className="h-10 w-full appearance-none rounded-lg border border-border bg-surface px-3 pr-9 text-sm text-text-primary focus:border-blue-base focus:outline-none"
        >
          {presets.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom…</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
      </div>
      {/* Min/Max inputs render only when Custom is picked. Quick presets
          + named options keep both columns visually balanced; deliberately
          choosing Custom is rare and makes the brief height shift fine. */}
      {isCustom && (
      <div className="mt-2 flex gap-2">
        <input
          type="number"
          value={min ?? ''}
          onChange={(e) =>
            onChange({
              min: e.target.value === '' ? null : Number(e.target.value),
              max,
            })
          }
          placeholder="Min"
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-blue-base"
        />
        <input
          type="number"
          value={max ?? ''}
          onChange={(e) =>
            onChange({
              min,
              max: e.target.value === '' ? null : Number(e.target.value),
            })
          }
          placeholder="Max"
          className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-blue-base"
        />
      </div>
      )}
    </div>
  )
}

function SegmentedField({ label, tooltip, value, options, onChange, locked = false, onLockedTap }) {
  return (
    <div
      className={locked ? 'cursor-pointer' : ''}
      onClick={locked ? onLockedTap : undefined}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <InfoTooltip text={tooltip} />
        {locked && (
          <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
            Advanced
          </span>
        )}
      </div>
      <div className={locked ? 'pointer-events-none opacity-60' : ''}>
        <div className="inline-flex w-full rounded-full bg-bg p-1">
          {options.map((o) => {
            const selected = value === o.value
            return (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => onChange(o.value)}
                className={`inline-flex h-9 flex-1 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors ${
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
      </div>
    </div>
  )
}

function ColumnHeader({ icon: Icon, children }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {children}
      </span>
    </div>
  )
}

export default function FiltersModal({ open, onClose, onRequestUpgrade }) {
  const [mounted, setMounted] = useState(false)

  const storedFilters = useGrowthConfig((s) => s.config.filters)
  const setFilter = useGrowthConfig((s) => s.setFilter)
  const toggleExcludeNsfw = useGrowthConfig((s) => s.toggleExcludeNsfw)

  const [draft, setDraft] = useState(storedFilters)
  // Tracks the currently-applied Quick preset (highlighted in the UI).
  // Cleared automatically the moment any value in `draft` diverges from
  // the preset's defined values — see the useEffect below.
  const [activePreset, setActivePreset] = useState(null)

  const genderLocked = mockUser.plan !== 'advanced'

  useEffect(() => {
    if (!open) return
    setDraft(storedFilters)
    setActivePreset(null)
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, storedFilters])

  // Auto-deselect the active preset when the draft drifts away from it.
  useEffect(() => {
    if (!activePreset) return
    const preset = QUICK_PRESETS.find((p) => p.key === activePreset)
    if (!preset) return
    const stillMatches = Object.entries(preset.values).every(
      ([k, v]) => draft[k] === v,
    )
    if (!stillMatches) setActivePreset(null)
  }, [draft, activePreset])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSave = () => {
    setFilter('followingRange', { min: draft.followingMin, max: draft.followingMax })
    setFilter('followerRange', { min: draft.followerMin, max: draft.followerMax })
    setFilter('mediaRange', { min: draft.mediaMin, max: draft.mediaMax })
    setFilter('accountPrivacy', draft.accountPrivacy)
    setFilter('genderTarget', draft.genderTarget)
    if (draft.excludeNsfw !== storedFilters.excludeNsfw) {
      toggleExcludeNsfw()
    }
    onClose()
  }

  const applyPreset = (preset) => {
    setDraft((d) => ({ ...d, ...preset.values }))
    setActivePreset(preset.key)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit filters"
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
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
          <div className="flex items-center gap-3">
            <CardChip color="yellow" icon={SlidersHorizontal} />
            <h2 className="text-base font-semibold text-text-primary">Edit filters</h2>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 lg:px-6 lg:py-6">
          <div className="mb-6">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
              Quick presets
            </p>
            <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
              {QUICK_PRESETS.map((p) => {
                const isActive = activePreset === p.key
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`flex flex-col gap-1 rounded-xl border p-3 text-left transition-all ${
                      isActive
                        ? 'border-blue-base bg-blue-tint/40 shadow-sm'
                        : 'border-border bg-surface hover:border-border-strong hover:bg-bg'
                    }`}
                  >
                    <span
                      className={`text-sm font-semibold ${
                        isActive ? 'text-blue-text' : 'text-text-primary'
                      }`}
                    >
                      {p.label}
                    </span>
                    <span className="text-xs leading-snug text-text-secondary">
                      {p.description}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Left column — Audience size */}
            <div>
              <ColumnHeader icon={Users}>Audience size</ColumnHeader>
              <div className="flex flex-col gap-5">
                <RangeDropdown
                  label="Following count"
                  tooltip="People this account follows."
                  presets={FOLLOWING_PRESETS}
                  min={draft.followingMin}
                  max={draft.followingMax}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, followingMin: v.min, followingMax: v.max }))
                  }
                />
                <RangeDropdown
                  label="Follower count"
                  tooltip="How many followers they have."
                  presets={FOLLOWER_PRESETS}
                  min={draft.followerMin}
                  max={draft.followerMax}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, followerMin: v.min, followerMax: v.max }))
                  }
                />
                <RangeDropdown
                  label="Media count"
                  tooltip="How many posts they've published."
                  presets={MEDIA_PRESETS}
                  min={draft.mediaMin}
                  max={draft.mediaMax}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, mediaMin: v.min, mediaMax: v.max }))
                  }
                />
              </div>
            </div>

            {/* Right column — Account type */}
            <div className="mt-6 lg:mt-0">
              <ColumnHeader icon={User}>Account type</ColumnHeader>
              <div className="flex flex-col gap-5">
                <SegmentedField
                  label="Account privacy"
                  tooltip="Whether their profile is public or private."
                  value={draft.accountPrivacy}
                  options={PRIVACY_OPTIONS}
                  onChange={(v) => setDraft((d) => ({ ...d, accountPrivacy: v }))}
                />
                <SegmentedField
                  label="Gender target"
                  tooltip="Narrow targeting by account gender."
                  value={draft.genderTarget}
                  options={GENDER_OPTIONS}
                  onChange={(v) => setDraft((d) => ({ ...d, genderTarget: v }))}
                  locked={genderLocked}
                  onLockedTap={() => onRequestUpgrade('gender_filter')}
                />
                <SettingSwitch
                  title="Exclude NSFW"
                  description="Skip accounts that appear to contain adult content."
                  checked={draft.excludeNsfw}
                  onChange={() => setDraft((d) => ({ ...d, excludeNsfw: !d.excludeNsfw }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-3 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
