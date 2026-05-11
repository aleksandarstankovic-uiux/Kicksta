import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap,
  Check,
  ShieldCheck,
  ArrowRight,
  X,
  TrendingUp,
  Users,
  Heart,
  BarChart3,
} from 'lucide-react'
import { useShowHeadingIcon } from '@/components/SignupLayout'
import GrowthPlusSubscribeModal from '@/components/GrowthPlusSubscribeModal'

const GROWTH_PLUS_PRICE = 49

// Mock — in production this would come from billing step state
const MOCK_PAYMENT_METHOD = { brand: 'Visa', last4: '4242' }

const GROWTH_PLUS_BENEFITS = [
  { text: 'Algorithmic post boosting', desc: 'Your posts get pushed to Explore and hashtag feeds' },
  { text: 'Up to 500+ extra followers/mo', desc: 'On top of your base plan growth' },
  { text: 'Increased likes & saves', desc: 'Real engagement signals from active accounts' },
]

const WITH_WITHOUT = [
  { feature: 'Targeted follow/unfollow', without: true, with: true },
  { feature: 'Engagement-driven reach', without: false, with: true },
  { feature: 'Algorithmic post boosting', without: false, with: true },
  { feature: 'Up to 500+ extra followers/mo', without: false, with: true },
  { feature: 'Increased likes & saves', without: false, with: true },
]

const HOW_IT_WORKS = [
  {
    icon: BarChart3,
    title: 'Algorithmic boosting',
    body: 'Your posts get pushed to Explore and hashtag feeds through real engagement signals.',
  },
  {
    icon: Heart,
    title: 'Engagement from real accounts',
    body: 'Likes, saves, and shares from active users signal quality to Instagram\'s algorithm.',
  },
  {
    icon: TrendingUp,
    title: 'Compounding reach',
    body: 'Higher engagement leads to more organic discovery — growth builds on itself.',
  },
]

export default function GrowthPlus() {
  const navigate = useNavigate()
  const showIcon = useShowHeadingIcon()
  // Modal states: null | 'confirm' | 'processing' | 'success'
  const [modalState, setModalState] = useState(null)

  function handleSubscribeClick() {
    setModalState('confirm')
  }

  function handleConfirmPayment() {
    setModalState('processing')
  }

  function handleSuccessContinue() {
    navigate('/signup/dashboard-entry')
  }

  function handleCloseModal() {
    setModalState(null)
  }

  function handleSkip() {
    navigate('/signup/dashboard-entry')
  }

  return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
      {/* Grid: mobile = single column · desktop = two columns */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start lg:gap-6">
        {/* Header */}
        <div className="text-center lg:col-start-1 lg:text-left">
          {/* Icon — centered on mobile, above heading on desktop */}
          {showIcon && (
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-tint lg:mx-0">
              <Zap className="h-6 w-6 text-purple-base" />
            </div>
          )}
          <h1 className="text-2xl font-semibold leading-snug text-text-primary">
            Supercharge your growth
          </h1>
          <p className="mt-1.5 text-sm leading-relaxed text-text-secondary lg:mt-2">
            Your plan includes targeted growth. Growth+ adds algorithmic reach on top — completely optional and billed separately.
          </p>

          {/* Social proof badges */}
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 lg:justify-start">
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-tint px-2.5 py-1 text-xs font-medium text-purple-text">
              <Users className="h-3 w-3" />
              28K+ active users
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-tint px-2.5 py-1 text-xs font-medium text-purple-text">
              <TrendingUp className="h-3 w-3" />
              Avg. 500+ followers/mo
            </span>
          </div>
        </div>

        {/* Right column — card (desktop: offset down to align with heading) */}
        <div className="flex flex-col gap-3 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-16">
          {/* Unified pricing + comparison card */}
          <div className="overflow-hidden rounded-xl border border-purple-base/30 bg-surface shadow-sm">
            {/* Pricing header */}
            <div className="flex items-center justify-between bg-purple-tint px-4 py-4">
              <div>
                <p className="text-sm font-medium text-purple-text">Growth+</p>
                <p className="mt-0.5 text-2xl font-semibold text-text-primary">
                  ${GROWTH_PLUS_PRICE}<span className="text-sm font-normal text-text-secondary">/mo</span>
                </p>
                <p className="mt-0.5 text-xs text-purple-text/70">
                  ~${(GROWTH_PLUS_PRICE / 30).toFixed(2)}/day
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-purple-base/10 px-2.5 py-1 text-xs font-medium text-purple-text">
                <Zap className="h-3 w-3" />
                Add-on
              </span>
            </div>

            {/* Comparison rows */}
            <div className="border-t border-purple-base/20">
              <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-4 border-b border-border px-4 py-2.5">
                <span className="text-xs font-medium text-text-muted" />
                <span className="w-14 text-center text-xs font-medium text-text-muted">Plan</span>
                <span className="w-14 text-center text-xs font-medium text-purple-text">Growth+</span>
              </div>
              {WITH_WITHOUT.map((row, i) => (
                <div
                  key={row.feature}
                  className={`grid grid-cols-[1fr_auto_auto] items-center gap-x-4 px-4 py-2.5 ${
                    i < WITH_WITHOUT.length - 1 ? 'border-b border-border' : ''
                  }`}
                >
                  <span className="text-xs text-text-primary">{row.feature}</span>
                  <div className="flex w-14 justify-center">
                    {row.without ? (
                      <Check className="h-4 w-4 text-green-text" strokeWidth={2.5} />
                    ) : (
                      <X className="h-4 w-4 text-text-muted/40" strokeWidth={2} />
                    )}
                  </div>
                  <div className="flex w-14 justify-center">
                    <Check className="h-4 w-4 text-purple-base" strokeWidth={2.5} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How it works — informational section */}
        <div className="lg:col-start-1">
          <p className="mb-2 text-xs font-medium text-text-muted">How Growth+ works</p>
          <div className="flex flex-col gap-3">
            {HOW_IT_WORKS.map((item) => (
              <div key={item.title} className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-tint">
                  <item.icon className="h-4 w-4 text-purple-base" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTAs — span full width on desktop, max-width matches content */}
        <div className="flex flex-col gap-4 lg:col-span-2">
          <div className="flex flex-col gap-4 lg:mx-auto lg:w-full lg:max-w-2xl lg:flex-row">
            <button
              onClick={handleSubscribeClick}
              disabled={modalState !== null}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-purple-base text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              Add Growth+ — ${GROWTH_PLUS_PRICE}/mo
            </button>

            <button
              onClick={handleSkip}
              disabled={modalState !== null}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg border border-border bg-surface text-base font-medium text-text-primary shadow-sm transition-colors hover:bg-bg disabled:opacity-70"
            >
              Continue to dashboard
              <ArrowRight className="h-4 w-4 text-text-muted" />
            </button>
          </div>

          <div className="flex items-center justify-center gap-1">
            <ShieldCheck className="h-3 w-3 text-text-muted" />
            <p className="text-xs text-text-muted">Cancel anytime · Add later from your dashboard</p>
          </div>
        </div>
      </div>

      <GrowthPlusSubscribeModal
        state={modalState}
        onClose={handleCloseModal}
        onConfirm={handleConfirmPayment}
        onProcessingDone={() => setModalState('success')}
        onSuccess={handleSuccessContinue}
        successButtonLabel="Continue to dashboard"
      />
    </div>
  )
}
