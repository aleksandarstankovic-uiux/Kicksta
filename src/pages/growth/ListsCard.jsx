import { Pencil } from 'lucide-react'
import { useLists } from '@/stores/useLists'

function ListSection({ title, entries, emptyCopy }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-text-muted">
        {title} ({entries.length})
      </p>
      {entries.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">{emptyCopy}</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {entries.map((e) => (
            <li key={e.id} className="text-sm text-text-primary">
              {e.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ListsCard({ onEdit }) {
  const whitelist = useLists((s) => s.whitelist)
  const blacklist = useLists((s) => s.blacklist)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary">Lists</h2>
          <p className="mt-1 text-sm text-text-secondary">
            Accounts Kicksta never unfollows or always avoids.
          </p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-4">
        <ListSection
          title="Whitelist"
          entries={whitelist}
          emptyCopy="No accounts whitelisted yet."
        />
        <ListSection
          title="Blacklist"
          entries={blacklist}
          emptyCopy="No accounts blacklisted yet."
        />
      </div>
    </section>
  )
}
