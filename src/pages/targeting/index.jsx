import { useSearchParams } from 'react-router-dom'
import { Crosshair, SlidersHorizontal } from 'lucide-react'
import TargetsTab from './TargetsTab'
import SettingsTab from './SettingsTab'

// Targeting page hosts two tabs (Targets default, Settings) via a
// `?tab=settings` search param. The tab strip is the page's primary
// mode toggle — rendered as a heavy pill switcher so the active view
// reads instantly. Active pill uses the same `bg-blue-tint text-blue-text`
// recipe the sidebar nav uses for current-view. Same recipe is reused
// inside AddTargetSheet for the account/hashtag toggle.
const TABS = [
  { value: 'targets', label: 'Targets', icon: Crosshair },
  { value: 'settings', label: 'Settings', icon: SlidersHorizontal },
]

const SUBTITLE = {
  targets: 'The accounts and hashtags Kicksta is following from.',
  settings: 'How Kicksta picks who to follow.',
}

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
          {SUBTITLE[activeTab]}
        </p>
      </header>

      {/* Pill switcher — same recipe reused inside AddTargetSheet. */}
      <div className="mt-4 flex gap-1 rounded-full bg-bg p-1">
        {TABS.map((t) => {
          const selected = activeTab === t.value
          const Icon = t.icon
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full px-4 text-sm transition-colors ${
                selected
                  ? 'bg-blue-tint font-semibold text-blue-text shadow-sm'
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
