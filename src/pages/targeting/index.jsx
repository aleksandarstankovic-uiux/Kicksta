import { useSearchParams } from 'react-router-dom'
import { Crosshair, SlidersHorizontal } from 'lucide-react'
import TargetsTab from './TargetsTab'
import SettingsTab from './SettingsTab'

// Targeting page hosts two tabs (Targets default, Settings) via a
// `?tab=settings` search param. The page subtitle stays constant —
// each tab carries its own descriptor as a sub-line inside its
// switcher button, so users see what each tab does without having
// to commit to it first.
const TABS = [
  {
    value: 'targets',
    label: 'Targets',
    icon: Crosshair,
    description: 'Accounts and hashtags Kicksta follows.',
  },
  {
    value: 'settings',
    label: 'Settings',
    icon: SlidersHorizontal,
    description: 'Rules for picking who to follow.',
  },
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

      {/* Switcher — each button stacks `Label` + descriptor sub-line.
          Container uses `bg-bg` (page tone) + a stronger border so it
          reads as a grounded control rather than a floating white card.
          Active pill = `bg-blue-tint text-blue-text` (same recipe as
          the sidebar nav active state). Rounded-2xl to fit the taller
          stacked content — rounded-full would clamp into a stadium. */}
      <div className="mt-4 flex gap-1 rounded-2xl border border-border-strong bg-bg p-1">
        {TABS.map((t) => {
          const selected = activeTab === t.value
          const Icon = t.icon
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`flex flex-1 items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                selected
                  ? 'bg-blue-tint shadow-sm'
                  : 'hover:bg-surface'
              }`}
            >
              <Icon
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  selected ? 'text-blue-text' : 'text-text-secondary'
                }`}
                aria-hidden="true"
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span
                  className={`text-sm font-semibold ${
                    selected ? 'text-blue-text' : 'text-text-primary'
                  }`}
                >
                  {t.label}
                </span>
                <span
                  className={`text-xs leading-snug ${
                    selected ? 'text-blue-text/80' : 'text-text-secondary'
                  }`}
                >
                  {t.description}
                </span>
              </span>
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
