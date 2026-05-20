import { Download, Receipt } from 'lucide-react'
import { useToasts } from '@/stores/useToasts'

const STATUS_CLS = {
  paid: 'bg-green-tint text-green-text',
  failed: 'bg-red-tint text-red-text',
  pending: 'bg-yellow-tint text-yellow-text',
}
const STATUS_DOT = {
  paid: 'bg-green-base',
  failed: 'bg-red-base',
  pending: 'bg-yellow-base',
}
const STATUS_LABEL = {
  paid: 'Paid',
  failed: 'Failed',
  pending: 'Pending',
}

function StatusPill({ status }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLS[status]}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${STATUS_DOT[status]}`} aria-hidden="true" />
      {STATUS_LABEL[status]}
    </span>
  )
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function DownloadButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      aria-label="Download invoice"
      title="Download invoice"
      className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md text-text-secondary hover:bg-bg hover:text-text-primary"
    >
      <Download className="h-4 w-4" />
    </button>
  )
}

export default function InvoicesTable({ invoices, emptyMessage = 'No invoices yet.' }) {
  function handleDownload() {
    useToasts.getState().addToast({
      message: 'Invoice download coming soon.',
      tone: 'success',
    })
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-8 text-center">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-bg text-text-muted">
          <Receipt className="h-5 w-5" />
        </span>
        <p className="text-sm text-text-secondary">{emptyMessage}</p>
      </div>
    )
  }

  // Newest first.
  const sorted = [...invoices].sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <>
      {/* Desktop: real table. Description column uses table-layout
          tricks (max-w-0 on the <td>) so its truncate kicks in based
          on remaining table width — not an arbitrary character cap.
          The other columns stay whitespace-nowrap to keep their full
          values legible. */}
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <table className="w-full table-fixed text-left text-sm">
          <colgroup>
            <col className="w-32" />
            <col />
            <col className="w-24" />
            <col className="w-28" />
            <col className="w-20" />
          </colgroup>
          <thead className="border-b border-border bg-bg/40 text-xs uppercase tracking-wide text-text-secondary">
            <tr>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Description</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Amount</th>
              <th className="whitespace-nowrap px-4 py-3 font-medium">Status</th>
              <th className="whitespace-nowrap px-4 py-3 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((inv) => (
              <tr key={inv.id} className="border-b border-border last:border-b-0">
                <td className="whitespace-nowrap px-4 py-3 text-text-primary">{formatDate(inv.date)}</td>
                <td className="truncate px-4 py-3 text-text-secondary" title={inv.description}>
                  {inv.description}
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-medium text-text-primary">
                  ${inv.amount.toFixed(2)}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusPill status={inv.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <DownloadButton onClick={handleDownload} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: date-led rows, amount + status anchored right. Mirrors
          the desktop column order (Date → Description → Amount/Status)
          so the user reads the same identity at every breakpoint. */}
      <ul className="flex flex-col md:hidden">
        {sorted.map((inv) => (
          <li
            key={inv.id}
            className="flex items-start gap-3 border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <p className="text-sm font-semibold text-text-primary">
                  {formatDate(inv.date)}
                </p>
                <StatusPill status={inv.status} />
              </div>
              <p
                className="mt-1 truncate text-xs text-text-secondary"
                title={inv.description}
              >
                {inv.description}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <p className="text-sm font-semibold text-text-primary">
                ${inv.amount.toFixed(2)}
              </p>
              <DownloadButton onClick={handleDownload} />
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
