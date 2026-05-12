import GrowthPlusActivity from './GrowthPlusActivity'
import GrowthPlusBillingCard from './GrowthPlusBillingCard'
import GrowthPlusControls from './GrowthPlusControls'
import GrowthPlusHero from './GrowthPlusHero'
import GrowthPlusMetricsStrip from './GrowthPlusMetricsStrip'

// Subscriber dashboard for the Growth+ page. Hero → metrics → activity
// → controls → billing. The how-it-works orientation lives at the top
// of the controls card now (it sits next to the levers users touch,
// instead of trailing the page where nobody reads).
//
// previewMode threads through to the hero (skips count-up animation
// behind blur). `account` is captured for future per-account data
// wiring — V1 mocks don't vary per account.
//
// eslint-disable-next-line no-unused-vars
export default function GrowthPlusActive({ account, previewMode = false }) {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <GrowthPlusHero previewMode={previewMode} />
      <GrowthPlusMetricsStrip />
      <GrowthPlusActivity />
      <GrowthPlusControls />
      <GrowthPlusBillingCard />
    </div>
  )
}
