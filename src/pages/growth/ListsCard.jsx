import { List } from 'lucide-react'
import { useLists } from '@/stores/useLists'

// v3: Lists is now a single summary row with a Manage button.
// The full tabs + typeahead + entries UI lives in ListsDrawer.
export default function ListsCard({ onManage }) {
  const whitelist = useLists((s) => s.whitelist)
  const blacklist = useLists((s) => s.blacklist)

  const summary = `Whitelist (${whitelist.length}) · Blacklist (${blacklist.length})`

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Lists</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Accounts Kicksta never unfollows or always avoids.
      </p>

      <div className="mt-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-4">
        <p className="min-w-0 truncate text-sm text-text-primary">{summary}</p>
        <button
          type="button"
          onClick={onManage}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
        >
          <List className="h-4 w-4" aria-hidden="true" />
          Manage
        </button>
      </div>
    </section>
  )
}
