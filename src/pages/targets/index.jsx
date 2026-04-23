// Targets page — slot tracker, filter/sort controls, list of target
// rows, and a single Add-Target sheet. The page is composed from small
// focused components under this folder; the store (`useTargetsStore`)
// is the only state source.

export default function TargetsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      {/* Page header — sets context; no secondary CTA lives up here.
          The sole "Add target" button lives inside the slots card. */}
      <header>
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Targets
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage the accounts and hashtags Kicksta targets for your growth.
        </p>
      </header>

      {/* Slots card, filter row, and list wire in across Tasks 4, 5, 7. */}
    </div>
  )
}
