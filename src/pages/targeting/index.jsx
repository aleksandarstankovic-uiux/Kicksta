import { useSearchParams } from 'react-router-dom'
import { Crosshair, SlidersHorizontal } from 'lucide-react'
import TargetsTab from './TargetsTab'
import SettingsTab from './SettingsTab'

// Targeting page hosts two tabs (Targets default, Settings) via a
// `?tab=settings` search param.
//
// Switcher pattern: connected tabs. The active tab is a `bg-surface`
// card with rounded top corners + an open bottom edge (achieved via
// `-mb-px` overlapping the parent's bottom border). The active tab
// reads as physically attached to the content surface below — the
// universal "tabs" affordance.
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

      {/* Connected-tab strip. Container has a `border-b` running
          across the full width — the baseline. Each tab is a
          rounded-top card. The active tab fills with `bg-surface`,
          carries a top/left/right border, and uses `-mb-px` so its
          bottom overlaps the baseline (giving the illusion of a
          tab attached to the content surface below). Inactive tabs
          are flat on the page and slightly muted.

          Mobile (<md): the descriptor sub-line is hidden so each
          tab is `[icon] Label` only — fits comfortably in two
          ~150px halves of a phone viewport. Desktop (md+) shows
          the full stacked label + descriptor. */}
      <div className="mt-5 flex gap-1 border-b border-border">
        {TABS.map((t) => {
          const selected = activeTab === t.value
          const Icon = t.icon
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              aria-current={selected ? 'page' : undefined}
              className={`-mb-px flex flex-1 items-center gap-3 rounded-t-xl border px-4 py-3 text-left transition-colors md:py-3.5 ${
                selected
                  ? 'border-border border-b-surface bg-surface shadow-sm'
                  : 'border-transparent text-text-secondary hover:bg-bg/60'
              }`}
            >
              <Icon
                className={`h-5 w-5 shrink-0 md:h-6 md:w-6 ${
                  selected ? 'text-blue-text' : 'text-text-muted'
                }`}
                aria-hidden="true"
              />
              <span className="flex min-w-0 flex-col gap-0.5">
                <span
                  className={`text-sm font-semibold ${
                    selected ? 'text-text-primary' : 'text-text-secondary'
                  }`}
                >
                  {t.label}
                </span>
                {/* Descriptor sub-line — desktop only. On mobile the
                    label alone is enough; the page subtitle above
                    carries the broader context. */}
                <span
                  className={`hidden text-xs leading-snug md:inline ${
                    selected ? 'text-text-secondary' : 'text-text-muted'
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
