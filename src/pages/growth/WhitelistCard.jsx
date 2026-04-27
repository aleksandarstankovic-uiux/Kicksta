import { Pencil, ShieldCheck } from 'lucide-react'
import { useLists } from '@/stores/useLists'

export default function WhitelistCard({ onEdit }) {
  const whitelist = useLists((s) => s.whitelist)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-green-text" aria-hidden="true" />
            <h2 className="text-base font-semibold text-text-primary">Whitelist</h2>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Accounts Kicksta will never unfollow.
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

      <div className="mt-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
          {whitelist.length} {whitelist.length === 1 ? 'account' : 'accounts'} protected
        </p>
        {whitelist.length === 0 ? (
          <p className="mt-2 text-sm text-text-muted">No accounts protected yet.</p>
        ) : (
          <ul className="mt-2 flex flex-col gap-1.5">
            {whitelist.map((e) => (
              <li key={e.id} className="text-sm text-text-primary">
                {e.username}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
