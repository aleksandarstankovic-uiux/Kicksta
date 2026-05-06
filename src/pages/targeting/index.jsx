import { useSearchParams } from 'react-router-dom'
import { Crosshair, SlidersHorizontal } from 'lucide-react'
import TargetsTab from './TargetsTab'
import SettingsTab from './SettingsTab'

// Targeting page hosts two tabs (Targets default, Settings) via a
// `?tab=settings` search param.
//
// Switcher pattern: compact intrinsic-width pill anchored below the
// page header — the canonical "view selector" slot used by Linear /
// Notion / Airtable. Active state uses `bg-text-primary text-bg`
// (dark fill, white text) — the dashboard's third active recipe,
// reserved for page-level switchers so it can't be confused with
// `bg-blue-tint` (sidebar nav) or `bg-blue-base` (primary CTAs).
const TABS = [
  { value: 'targets', label: 'Targets', icon: Crosshair },
  { value: 'settings', label: 'Settings', icon: SlidersHorizontal },
]

export default function TargetingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'settings' ? 'settings' : 'targets'

  function setTab(value) {
    if (value === 'targets') {
      // Drop the param entirely so the URL stays clean for the default tab.
      const next = new URLSearchParams(searchParams)
      next.delete('tab')
      setSearchParams(next, { replace: false })
    } else {
      const next = new URLSearchParams(searchParams)
      next.set('tab', value)
      setSearchParams(next, { replace: false })
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Targeting
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage who Kicksta targets and how.
        </p>
      </header>

      {/* Compact intrinsic-width pill switcher. Container reads as a
          contained control via `bg-bg + border`. Active tab fills with
          `bg-text-primary text-bg` for maximum contrast. */}
      <div className="mt-5 inline-flex gap-1 rounded-full border border-border bg-bg p-1">
        {TABS.map((t) => {
          const selected = activeTab === t.value
          const Icon = t.icon
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              aria-current={selected ? 'page' : undefined}
              className={`inline-flex h-9 items-center gap-2 rounded-full px-4 text-sm transition-colors ${
                selected
                  ? 'bg-text-primary font-semibold text-bg shadow-sm'
                  : 'font-medium text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        {activeTab === 'targets' ? <TargetsTab /> : <SettingsTab />}
      </div>
    </div>
  )
}
