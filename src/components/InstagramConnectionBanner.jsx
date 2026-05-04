import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { useAccounts } from '@/stores/useAccounts'

// Persistent reconnect banner shown at the top of Overview when the
// active IG account's `connectionState === 'disconnected'`. Calm
// copy per PRODUCT.md Problem 4 — addresses both common causes
// (password change, security prompt) so users don't think Kicksta
// failed.
export default function InstagramConnectionBanner() {
  const accounts = useAccounts((s) => s.accounts)
  const activeId = useAccounts((s) => s.activeId)
  const activeAccount = accounts.find((a) => a.id === activeId) ?? accounts[0]

  if (activeAccount?.connectionState !== 'disconnected') return null

  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-xl border border-yellow-base/40 bg-yellow-tint p-4 shadow-sm md:flex-row md:items-center md:gap-4 md:p-5"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-yellow-base/20 text-yellow-text">
        <AlertTriangle className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="flex-1">
        <p className="text-sm font-semibold text-yellow-text">
          Your Instagram session ended.
        </p>
        <p className="mt-0.5 text-sm text-yellow-text/90">
          This is normal after a password change or security prompt — your account is safe.
          Reconnect to continue growing.
        </p>
      </div>
      <Link
        to="/signup/connect-instagram"
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-yellow-base px-4 text-sm font-semibold text-white hover:opacity-90"
      >
        Reconnect
      </Link>
    </div>
  )
}
