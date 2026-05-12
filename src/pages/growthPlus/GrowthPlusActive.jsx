import GrowthPlusActivity from './GrowthPlusActivity'
import GrowthPlusBillingCard from './GrowthPlusBillingCard'
import GrowthPlusControls from './GrowthPlusControls'
import GrowthPlusHero from './GrowthPlusHero'
import GrowthPlusMetricsStrip from './GrowthPlusMetricsStrip'
import GrowthPlusTierStrip from './GrowthPlusTierStrip'

// Subscriber dashboard for the Growth+ page. Hero → metrics → tier
// strip → activity → controls → billing. The tier strip identifies the
// active plan and gives users an always-visible path to upgrade.
//
// `account` is captured for future per-account data wiring — V1 mocks
// don't vary per account.
//
// eslint-disable-next-line no-unused-vars
export default function GrowthPlusActive({ account }) {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <GrowthPlusHero />
      <GrowthPlusMetricsStrip />
      <GrowthPlusTierStrip />
      <GrowthPlusActivity />
      <GrowthPlusControls />
      <GrowthPlusBillingCard />
    </div>
  )
}
