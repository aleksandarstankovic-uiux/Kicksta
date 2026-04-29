import { Link, Navigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { useAccounts } from '@/stores/useAccounts'

const STATUS_PILL = {
  active: { cls: 'bg-green-tint text-green-text', label: 'Active' },
  trialing: { cls: 'bg-blue-tint text-blue-text', label: 'Trialing' },
  past_due: { cls: 'bg-red-tint text-red-text', label: 'Past due' },
  canceled: { cls: 'bg-bg text-text-secondary', label: 'Canceled' },
}

function letterFor(username) {
  return String(username ?? '').replace(/^@/, '').charAt(0).toUpperCase() || '·'
}

export default function SubscriptionDetail() {
  const { id } = useParams()
  const sub = useSubscriptions((s) => s.subscriptions.find((x) => x.id === id))
  const accounts = useAccounts((s) => s.accounts)

  if (!sub) return <Navigate to="/account/subscriptions" replace />

  const account = accounts.find((a) => a.id === sub.accountId)
  const username = account?.username ?? '@unknown'
  const profilePic = account?.profilePic ?? null
  const pill = STATUS_PILL[sub.status] ?? STATUS_PILL.active

  return (
    <div className="flex flex-col gap-6">
      <Link
        to="/account/subscriptions"
        className="inline-flex w-fit items-center gap-1 text-sm font-medium text-text-secondary hover:text-text-primary"
      >
        <ArrowLeft className="h-4 w-4" /> Back to subscriptions
      </Link>

      <div className="flex items-center gap-3">
        {profilePic ? (
          <img src={profilePic} alt="" className="h-12 w-12 rounded-full object-cover" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint text-base font-semibold text-blue-text">
            {letterFor(username)}
          </span>
        )}
        <div className="flex-1">
          <h2 className="text-lg font-semibold text-text-primary">{username}</h2>
          <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${pill.cls}`}>
            {pill.label}
          </span>
        </div>
      </div>

      {/* Cards land here in subsequent tasks. */}
    </div>
  )
}
