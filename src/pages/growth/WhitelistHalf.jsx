import { Pencil, ShieldCheck } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'

export default function WhitelistHalf({ onEdit }) {
  const whitelist = useLists((s) => s.whitelist)

  return (
    <div className="p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CardChip color="green" icon={ShieldCheck} />
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-text-primary">Whitelist</h3>
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
        <ul className="mt-2 flex flex-col gap-1.5">
          {whitelist.map((e) => (
            <li key={e.id} className="text-sm text-text-primary">
              {e.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
