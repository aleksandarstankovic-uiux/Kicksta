import { useState } from 'react'
import SlotsCard from './SlotsCard'

export default function TargetsPage() {
  const [sheetOpen, setSheetOpen] = useState(false)

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

      {/* Dev-only visual confirmation until the sheet lands in Task 9. */}
      {sheetOpen && (
        <div className="mt-4 text-xs text-text-muted">
          [Add Target sheet would open here — wired in Task 9]
        </div>
      )}
    </div>
  )
}
