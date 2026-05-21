// src/components/DashboardPresetWidget.jsx
import { useRef, useState } from 'react'
import { Sliders, X } from 'lucide-react'
import { useDashboardPreset } from '@/stores/useDashboardPreset'
import { PRESET_GROUPS, PRESET_ABBREV, DEFAULT_PRESET } from '@/mocks/presets'
import useDismissOnOutsideClick from '@/hooks/useDismissOnOutsideClick'

// Floating bottom-right dev widget that flips the dashboard between
// canonical preset states. See docs/superpowers/specs/2026-05-21-…
// for the design. Mounted in DashboardLayout so it appears on every
// dashboard route; doesn't appear in signup (which renders outside
// DashboardLayout).
export default function DashboardPresetWidget() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const preset = useDashboardPreset((s) => s.preset)
  const applyPreset = useDashboardPreset((s) => s.applyPreset)
  const reset = useDashboardPreset((s) => s.reset)

  useDismissOnOutsideClick(ref, open, () => setOpen(false))

  const abbrev = PRESET_ABBREV[preset] ?? '?'
  const isDefault = preset === DEFAULT_PRESET

  return (
    <div
      ref={ref}
      // Bottom-right anchored. Above the mobile bottom tab bar (≈64px
      // + safe area), tighter on desktop. z-40 to clear the dashboard
      // content but stay under modals (z-50).
      className="fixed right-4 bottom-[80px] z-40 sm:bottom-4"
    >
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`Open dashboard state switcher (current: ${abbrev})`}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-text-primary text-bg shadow-xl transition-opacity hover:opacity-90"
        >
          <Sliders className="h-5 w-5" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="absolute -top-1 -right-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-base px-1.5 text-[10px] font-semibold uppercase tracking-wide text-white"
          >
            {abbrev}
          </span>
        </button>
      )}

      {open && (
        <div className="w-72 overflow-hidden rounded-xl border border-border bg-surface shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 className="text-base font-semibold text-text-primary">
              Dashboard state
            </h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="max-h-[60vh] overflow-y-auto">
            {PRESET_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                  {group.label}
                </p>
                {group.presets.map((p) => {
                  const selected = preset === p.id
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        applyPreset(p.id)
                        setOpen(false)
                      }}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors ${
                        selected
                          ? 'border-l-2 border-blue-base bg-blue-tint'
                          : 'hover:bg-bg/50'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1 h-2 w-2 shrink-0 rounded-full ${
                          selected ? 'bg-blue-base' : 'bg-border'
                        }`}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary">
                          {p.label}
                        </div>
                        <div className="text-xs text-text-muted">
                          {p.description}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            ))}
          </div>

          <div className="border-t border-border px-4 py-3">
            <button
              type="button"
              onClick={() => {
                reset()
                setOpen(false)
              }}
              disabled={isDefault}
              className="text-sm font-medium text-blue-text transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Reset to default
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
