import { useActiveAccount } from '@/stores/useAccounts'
import { formatCount } from '@/utils/formatCount'

const dotColor = {
  connected: 'bg-green-base',
  warming_up: 'bg-blue-base',
  disconnected: 'bg-red-base',
}

// Thin one-line account anchor shown above page titles on Targeting +
// Growth (Overview already has the larger AccountCard). Reads the
// active account from `useAccounts` so picking a different IG in the
// sidebar updates every page that uses this strip.
export default function AccountStripe() {
  const account = useActiveAccount()
  if (!account) return null
  const letter = account.username?.charAt(0)?.toUpperCase() ?? '?'
  const dot = dotColor[account.connectionState] ?? 'bg-text-muted'

  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="relative shrink-0">
        {account.profilePic ? (
          <img
            src={account.profilePic}
            alt=""
            className="h-7 w-7 rounded-full object-cover ring-1 ring-border"
          />
        ) : (
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-tint text-xs font-semibold text-blue-text ring-1 ring-border">
            {letter}
          </div>
        )}
        <span
          aria-hidden="true"
          className={`absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-surface ${dot}`}
        />
      </div>
      <span className="font-medium text-text-primary">@{account.username}</span>
      <span className="text-xs text-text-muted">
        {formatCount(account.followers)} followers
      </span>
    </div>
  )
}
