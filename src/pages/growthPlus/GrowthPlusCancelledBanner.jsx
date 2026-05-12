import { AlertTriangle } from 'lucide-react'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'

function formatDate(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Yellow-tint banner shown above the Growth+ Hero when the user has
// cancelled but the paid-through period hasn't ended yet. Surfaces the
// end date + a Resume action.
export default function GrowthPlusCancelledBanner({ onResume }) {
  const endsAt = useGrowthPlusSubscription((s) => s.endsAt)

  return (
    <section
      role="status"
      className="flex items-start gap-3 rounded-xl border border-yellow-base/30 bg-yellow-tint p-4 md:p-5"
    >
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-yellow-text"
        aria-hidden="true"
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-text-primary">
          Your Growth+ subscription ends {formatDate(endsAt)}.
        </p>
        <p className="mt-0.5 text-xs text-text-secondary">
          You'll keep full access until then.
        </p>
      </div>
      <button
        type="button"
        onClick={onResume}
        className="inline-flex h-9 shrink-0 items-center justify-center rounded-lg bg-yellow-base px-3 text-xs font-semibold text-white transition-opacity hover:opacity-90"
      >
        Resume
      </button>
    </section>
  )
}
