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

export default function InvoicesTable({ invoices, emptyMessage = 'No invoices yet.' }) {
  function handleDownload() {
    useToasts.getState().addToast({
      message: 'Invoice download coming soon.',
      tone: 'success',
    })
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-surface p-8 text-center shadow-sm">
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
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
      {/* Desktop: real table */}
      <table className="hidden w-full text-left text-sm md:table">
        <thead className="border-b border-border bg-bg/40 text-xs uppercase tracking-wide text-text-secondary">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Description</th>
            <th className="px-4 py-3 font-medium">Amount</th>
            <th className="px-4 py-3 font-medium">Status</th>
            <th className="px-4 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((inv) => (
            <tr key={inv.id} className="border-b border-border last:border-b-0">
              <td className="px-4 py-3 text-text-primary">{formatDate(inv.date)}</td>
              <td className="px-4 py-3 text-text-secondary">{inv.description}</td>
              <td className="px-4 py-3 font-medium text-text-primary">${inv.amount.toFixed(2)}</td>
              <td className="px-4 py-3">
                <StatusPill status={inv.status} />
              </td>
              <td className="px-4 py-3 text-right">
                <button
                  onClick={handleDownload}
                  className="inline-flex h-10 items-center gap-1 rounded-md px-2 text-sm font-medium text-blue-text hover:bg-bg"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: stacked rows */}
      <ul className="divide-y divide-border md:hidden">
        {sorted.map((inv) => (
          <li key={inv.id} className="flex flex-col gap-2 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-text-primary">{formatDate(inv.date)}</span>
              <span className="text-sm font-semibold text-text-primary">${inv.amount.toFixed(2)}</span>
            </div>
            <p className="truncate text-xs text-text-secondary">{inv.description}</p>
            <div className="flex items-center justify-between gap-3">
              <StatusPill status={inv.status} />
              <button
                onClick={handleDownload}
                className="inline-flex h-10 items-center gap-1 rounded-md px-2 text-sm font-medium text-blue-text"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
