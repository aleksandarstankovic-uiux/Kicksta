import { useSearchParams } from 'react-router-dom'
import TargetsTab from './TargetsTab'
import SettingsTab from './SettingsTab'

// Targeting page hosts two tabs (Targets default, Settings) via a
// `?tab=settings` search param. No nested routes — the tabs are a
// mode toggle on a single page, not co-equal sub-views, so a
// search param fits better than React Router children.
const TABS = [
  { value: 'targets', label: 'Targets' },
  { value: 'settings', label: 'Settings' },
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

      {/* Segmented tab strip — same recipe as the AddTargetSheet's
          account/hashtag toggle. Same on desktop and mobile. */}
      <div className="mt-4 flex rounded-full bg-bg p-1">
        {TABS.map((t) => {
          const selected = activeTab === t.value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`inline-flex h-9 flex-1 items-center justify-center rounded-full px-4 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
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
