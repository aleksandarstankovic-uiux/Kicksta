import { useState } from 'react'
import SlotsCard from './SlotsCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'

export default function TargetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [menuTarget, setMenuTarget] = useState(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Targets
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage the accounts and hashtags Kicksta targets for your growth.
        </p>
      </header>

      <SlotsCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList onOpenMenu={(t) => setMenuTarget(t)} />

      {/* Dev placeholders until Tasks 8 and 9 land. */}
      {sheetOpen && (
        <div className="mt-4 text-xs text-text-muted">
          [Add Target sheet — wired in Task 9]
        </div>
      )}
      {menuTarget && (
        <div className="mt-4 text-xs text-text-muted">
          [Kebab menu for {menuTarget.value} — wired in Task 8]
          <button
            type="button"
            className="ml-2 underline"
            onClick={() => setMenuTarget(null)}
          >
            close
          </button>
        </div>
      )}
    </div>
  )
}
