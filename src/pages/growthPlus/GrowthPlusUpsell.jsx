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
  {
    icon: Sparkles,
    title: 'Algorithmic post boosting',
    body: 'Your latest posts get pushed to Explore and hashtag feeds by a network of real, active accounts.',
  },
  {
    icon: Network,
    title: 'Active-account engagement',
    body: 'Likes and saves from accounts that actually engage — the signals Instagram weighs most.',
  },
  {
    icon: ShieldCheck,
    title: 'Throttled to stay safe',
    body: 'Boost activity is paced inside Instagram’s safety limits. No bot behavior, no risk to your account.',
  },
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
      <section className="overflow-hidden rounded-xl border border-purple-base/20 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 p-6 text-center shadow-sm md:p-10">
        <span
          aria-hidden="true"
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-text text-surface shadow-sm"
        >
          <Sparkles className="h-7 w-7" />
        </span>
        <h2 className="mt-4 text-2xl font-semibold leading-snug text-text-primary md:text-3xl">
          Boost your reach with Growth+
        </h2>
        <p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-text-secondary md:text-base">
          Algorithmic post boosting from a network of real active accounts.
          Stack it on top of Targeted Growth for compound results.
        </p>
      </section>

      <section className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        {mockGrowthPlusTiers.map((tier) => (
          <TierCard key={tier.id} tier={tier} onChoose={() => startTier(tier.id)} />
        ))}
      </section>

      <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
        {BENEFITS.map((b) => {
          const Icon = b.icon
          return (
            <div
              key={b.title}
              className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-5"
            >
              <span
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-tint text-purple-text"
              >
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <h3 className="mt-3 text-sm font-semibold text-text-primary">
                {b.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-text-secondary">
                {b.body}
              </p>
            </div>
          )
        })}
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
          text="Top accounts targeting"
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
        Start {tier.name}
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
