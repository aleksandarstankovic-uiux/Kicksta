import { Pencil, ShieldCheck } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { formatRelativeShort } from '@/utils/formatRelativeShort'

function letterFor(username) {
  return String(username ?? '').replace(/^@/, '').charAt(0).toUpperCase() || '·'
}

export default function WhitelistCard({ onEdit }) {
  const whitelist = useLists((s) => s.whitelist)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CardChip color="green" icon={ShieldCheck} />
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">Whitelist</h2>
            <InfoTooltip text="Accounts Kicksta will never unfollow." />
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit whitelist"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {whitelist.length} {whitelist.length === 1 ? 'account' : 'accounts'} protected
      </p>
      {whitelist.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">No accounts protected yet.</p>
      ) : (
        <ul className="mt-2 flex flex-col">
          {whitelist.map((e) => (
            <li key={e.id} className="flex items-center gap-3 py-2">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg text-xs font-semibold text-text-secondary">
                {letterFor(e.username)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
                {e.username}
              </span>
              <span className="shrink-0 text-xs text-text-muted">
                added {formatRelativeShort(e.addedAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
