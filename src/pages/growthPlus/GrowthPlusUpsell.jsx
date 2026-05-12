import { useState } from 'react'
import {
  ChevronDown,
  Check,
  Lock,
  Network,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import GrowthPlusSubscribeModal from '@/components/GrowthPlusSubscribeModal'
import { mockGrowthPlusTiers } from '@/mocks/growth'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'

const BENEFITS = [
  { icon: Sparkles, shortLabel: 'Algorithmic boost' },
  { icon: Network, shortLabel: 'Active accounts' },
  { icon: ShieldCheck, shortLabel: 'IG-safe' },
]

const FAQS = [
  {
    q: 'How is this different from Targeted Growth?',
    a: 'Targeted Growth follows users likely to follow you back. Growth+ amplifies your posts so they reach more people in the first place. They’re complementary — most users run both.',
  },
  {
    q: 'Will my account be at risk?',
    a: 'No. Boost activity comes from real accounts engaging organically and is rate-limited well inside Instagram’s safety limits.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. You can pause or cancel from your dashboard at any point. No contracts, no hidden fees.',
  },
]

// Marketing page shown on /growth-plus when the user isn't subscribed.
// Replaces the previous blurred-preview + floating-subscribe overlay
// pattern with a real pricing page: 3 tier cards, benefit grid, FAQ.
//
// Clicking any tier opens the existing GrowthPlusSubscribeModal,
// pre-selecting that tier so the subscription flow knows which tier
// to mark on success.
export default function GrowthPlusUpsell() {
  const [pendingTier, setPendingTier] = useState(null)
  const [modalState, setModalState] = useState(null)
  const markSubscribed = useGrowthPlusSubscription((s) => s.markSubscribed)
  const setTier = useGrowthConfig((s) => s.setGrowthPlusTier)

  function startTier(tierId) {
    setPendingTier(tierId)
    setModalState('confirm')
  }

  function handleSuccess() {
    if (pendingTier) setTier(pendingTier)
    setModalState(null)
    setPendingTier(null)
    markSubscribed()
  }

  return (
    <>
      <section className="overflow-hidden rounded-xl border border-purple-base/20 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 p-5 text-center shadow-sm md:p-7">
        <span
          aria-hidden="true"
          className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-purple-text text-surface shadow-sm md:h-12 md:w-12"
        >
          <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
        </span>
        <h2 className="mt-3 text-xl font-semibold leading-snug text-text-primary md:text-2xl">
          Boost your reach with Growth+
        </h2>
        <p className="mx-auto mt-1.5 max-w-xl text-sm leading-relaxed text-text-secondary">
          Your most recent posts get pushed to a network of real, active
          accounts — they engage, Instagram sees the signal, and your reach
          compounds. No bots, no fake engagement.
        </p>

        <ul className="mx-auto mt-4 flex max-w-xl flex-wrap justify-center gap-2">
          {BENEFITS.map((b) => {
            const Icon = b.icon
            return (
              <li
                key={b.shortLabel}
                className="inline-flex items-center gap-1.5 rounded-full border border-purple-base/30 bg-surface px-3 py-1.5 text-xs font-semibold text-purple-text shadow-sm"
              >
                <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{b.shortLabel}</span>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {mockGrowthPlusTiers.map((tier) => (
          <TierCard key={tier.id} tier={tier} onChoose={() => startTier(tier.id)} />
        ))}
      </section>

<section className="mt-8">
        <h3 className="text-base font-semibold text-text-primary">
          Frequently asked questions
        </h3>
        <div className="mt-3 overflow-hidden rounded-xl border border-border bg-surface shadow-sm">
          {FAQS.map((faq, i) => (
            <FaqItem key={faq.q} faq={faq} isFirst={i === 0} />
          ))}
        </div>
      </section>

      <GrowthPlusSubscribeModal
        state={modalState}
        onClose={() => {
          setModalState(null)
          setPendingTier(null)
        }}
        onConfirm={() => setModalState('processing')}
        onProcessingDone={() => setModalState('success')}
        onSuccess={handleSuccess}
      />
    </>
  )
}

function TierCard({ tier, onChoose }) {
  const isRecommended = tier.recommended
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-5 shadow-sm md:p-6 ${
        isRecommended
          ? 'border-purple-base/40 bg-gradient-to-br from-purple-tint/40 via-surface to-surface shadow-md'
          : 'border-border bg-surface'
      }`}
    >
      {isRecommended && (
        <span className="absolute -top-2.5 left-5 inline-flex items-center rounded-full bg-purple-text px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-surface">
          Recommended
        </span>
      )}

      <h3 className="text-lg font-semibold text-text-primary">{tier.name}</h3>
      <p className="mt-1 text-xs text-text-secondary">{tier.tagline}</p>

      <div className="mt-4 flex items-baseline gap-1">
        <span className="text-3xl font-semibold text-text-primary">
          ${tier.price}
        </span>
        <span className="text-sm text-text-secondary">/mo</span>
      </div>

      <ul className="mt-4 flex flex-col gap-2 text-sm text-text-primary">
        <FeatureRow
          included
          text={`Up to +${tier.monthlyBoosts} extra followers/mo`}
        />
        <FeatureRow
          included
          text={`${tier.boostedPosts} boosted posts/mo`}
        />
        <FeatureRow
          included
          text={`+${Math.round(tier.reachLift * 100)}% post reach lift`}
        />
        <FeatureRow
          included={tier.allowedSpeed.includes('fast')}
          text="Fast speed mode"
        />
        <FeatureRow
          included={tier.allowedQuality.includes('targeted')}
          text="Targeted quality"
        />
        <FeatureRow
          included={tier.allowedQuality.includes('top')}
          text="Engaged-quality targeting"
        />
      </ul>

      <button
        type="button"
        onClick={onChoose}
        className={`mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg text-base font-semibold transition-opacity hover:opacity-90 ${
          isRecommended
            ? 'bg-purple-base text-white'
            : 'border border-purple-base/30 bg-surface text-purple-text'
        }`}
      >
        Subscribe to {tier.name}
      </button>
    </div>
  )
}

function FeatureRow({ included, text }) {
  return (
    <li className="flex items-start gap-2 text-sm">
      {included ? (
        <Check
          className="mt-0.5 h-4 w-4 shrink-0 text-purple-base"
          strokeWidth={2.5}
          aria-hidden="true"
        />
      ) : (
        <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
      )}
      <span className={included ? 'text-text-primary' : 'text-text-muted'}>
        {text}
      </span>
    </li>
  )
}

function FaqItem({ faq, isFirst }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={isFirst ? '' : 'border-t border-border'}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left transition-colors hover:bg-bg/60 md:px-5"
      >
        <span className="text-sm font-medium text-text-primary">{faq.q}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-text-secondary transition-transform ${
            open ? 'rotate-180' : ''
          }`}
          aria-hidden="true"
        />
      </button>
      {open && (
        <div className="px-4 pb-4 text-sm leading-relaxed text-text-secondary md:px-5">
          {faq.a}
        </div>
      )}
    </div>
  )
}
