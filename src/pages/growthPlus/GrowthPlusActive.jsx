import { ShieldCheck } from 'lucide-react'
import GrowthPlusActivity from './GrowthPlusActivity'
import GrowthPlusControls from './GrowthPlusControls'
import GrowthPlusHero from './GrowthPlusHero'
import GrowthPlusMetricsStrip from './GrowthPlusMetricsStrip'

// Subscriber dashboard for the Growth+ page. Five sections + a quiet
// safety strip at the bottom. previewMode threads through to the hero
// (which skips count-up + sparkline animation behind blur).
//
// `account` is captured for future per-account data wiring — V1 mocks
// don't vary per account so it's unused in the current sections.
//
// eslint-disable-next-line no-unused-vars
export default function GrowthPlusActive({ account, previewMode = false }) {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <GrowthPlusHero previewMode={previewMode} />
      <GrowthPlusMetricsStrip />
      <GrowthPlusActivity />
      <GrowthPlusControls />

      <div className="flex items-start gap-2 px-2 py-3">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary"
          aria-hidden="true"
        />
        <p className="text-xs leading-relaxed text-text-secondary">
          <span className="font-semibold text-text-primary">How Growth+ works.</span>{' '}
          Growth+ uses a network of active accounts to like, save, and share your most recent posts. Boost activity is throttled to stay within Instagram's safety limits. Boosted followers are engagement-driven, not organic.
        </p>
      </div>
    </div>
  )
}
