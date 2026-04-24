import { useEffect, useState } from 'react'

// Preset-or-custom pill group for numeric range filters. Presets are
// tap-selectable; the Custom pill expands inline number inputs below.
//
// Props:
// - presets: [{ key, label, min, max }]
// - value: { min, max }  — current range; null max means "any"
// - onChange: ({ min, max }) => void
export default function PresetRangePills({ presets, value, onChange }) {
  const matchedPreset = presets.find(
    (p) => p.min === value.min && p.max === value.max
  )
  const isCustom = !matchedPreset
  const [customOpen, setCustomOpen] = useState(isCustom)

  useEffect(() => {
    if (isCustom) setCustomOpen(true)
  }, [isCustom])

  const handlePresetClick = (preset) => {
    setCustomOpen(false)
    onChange({ min: preset.min, max: preset.max })
  }

  const handleCustomClick = () => {
    setCustomOpen(true)
  }

  const handleMin = (e) => {
    const n = e.target.value === '' ? null : Number(e.target.value)
    if (Number.isNaN(n)) return
    onChange({ min: n, max: value.max })
  }

  const handleMax = (e) => {
    const n = e.target.value === '' ? null : Number(e.target.value)
    if (Number.isNaN(n)) return
    onChange({ min: value.min, max: n })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const selected = !customOpen && matchedPreset?.key === p.key
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePresetClick(p)}
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-surface text-text-primary shadow-sm ring-1 ring-border'
                  : 'bg-bg text-text-secondary hover:text-text-primary'
              }`}
            >
              {p.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={handleCustomClick}
          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            customOpen
              ? 'bg-surface text-text-primary shadow-sm ring-1 ring-border'
              : 'bg-bg text-text-secondary hover:text-text-primary'
          }`}
        >
          Custom
        </button>
      </div>

      {customOpen && (
        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            Min
            <input
              type="number"
              value={value.min ?? ''}
              onChange={handleMin}
              className="h-10 w-24 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            Max
            <input
              type="number"
              value={value.max ?? ''}
              onChange={handleMax}
              placeholder="any"
              className="h-10 w-24 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
            />
          </label>
        </div>
      )}
    </div>
  )
}
