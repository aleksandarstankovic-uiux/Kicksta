import { mockUser } from '@/mocks/user'
import { useAccounts } from '@/stores/useAccounts'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import GrowthPlusActive from './GrowthPlusActive'
import GrowthPlusLockedPreview from './GrowthPlusLockedPreview'

// /growth-plus page entry. Reads subscription state from the Zustand
// override (falls back to mockUser.growthPlusSubscribed) and renders
// the matching state. account is the active IG account from
// AccountSwitcher — passed through to GrowthPlusActive for future
// per-account data wiring.
export default function GrowthPlusPage() {
  const subscribed = useGrowthPlusSubscription(
    (s) => s.subscribed ?? mockUser.growthPlusSubscribed,
  )
  const activeAccount = useAccounts((s) =>
    s.accounts.find((a) => a.id === s.activeId),
  )

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header className="mb-5 md:mb-6">
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Growth+
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Algorithmic reach on top of your Targeted Growth.
        </p>
      </header>

      {subscribed ? (
        <GrowthPlusActive account={activeAccount} />
      ) : (
        <GrowthPlusLockedPreview account={activeAccount} />
      )}
    </div>
  )
}
