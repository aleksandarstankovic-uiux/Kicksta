import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Zap,
  Check,
  ShieldCheck,
  Loader2,
  ArrowRight,
  X,
  TrendingUp,
  Users,
  Heart,
  BarChart3,
  CreditCard,
  CheckCircle2,
} from 'lucide-react'
import { useShowHeadingIcon } from '@/components/SignupLayout'

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
    setTimeout(() => {
      setModalState('success')
    }, 1500)
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

      {/* Confirmation / Success overlay */}
      {modalState && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
          style={{ animation: 'fadeIn 0.2s ease-out' }}
          onClick={(e) => { if (e.target === e.currentTarget && modalState === 'confirm') handleCloseModal() }}
        >
          {/* Loader states — compact centered popup */}
          {modalState === 'processing' && (
            <div
              className="mx-4 mb-4 w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl lg:mb-0"
              style={{ animation: 'fadeSlideIn 0.25s ease-out' }}
            >
              <div className="flex flex-col items-center py-4 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-purple-base" />
                <p className="mt-3 text-base font-medium text-text-primary">
                  Processing payment...
                </p>
              </div>
            </div>
          )}

          {/* Confirm + Success — drawer on mobile, centered modal on desktop */}
          {(modalState === 'confirm' || modalState === 'success') && (
            <div
              className="w-full rounded-t-2xl bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl lg:mx-4 lg:max-w-sm lg:rounded-2xl lg:pb-6"
              style={{ animation: window.innerWidth < 1024 ? 'drawerSlideUp 0.3s ease-out' : 'fadeSlideIn 0.25s ease-out' }}
            >
              {modalState === 'confirm' && (
                <div className="flex flex-col items-center text-center">
                  {/* Drawer handle — mobile only */}
                  <div className="mb-4 h-1 w-10 rounded-full bg-border lg:hidden" />

                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-tint">
                    <CreditCard className="h-6 w-6 text-purple-base" />
                  </div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    Confirm Growth+ subscription
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                    Your <span className="font-semibold text-text-primary">{MOCK_PAYMENT_METHOD.brand} ending in {MOCK_PAYMENT_METHOD.last4}</span> will be charged ${GROWTH_PLUS_PRICE}/mo. Cancel anytime from your dashboard.
                  </p>

                  {/* Benefit summary */}
                  <div className="mt-3 w-full overflow-hidden rounded-xl border border-purple-base/20">
                    <div className="bg-purple-tint px-4 py-2">
                      <p className="text-xs font-semibold text-purple-text">What you get with Growth+</p>
                    </div>
                    <div className="flex flex-col divide-y divide-purple-base/10">
                      {GROWTH_PLUS_BENEFITS.map((benefit) => (
                        <div key={benefit.text} className="flex items-start gap-2.5 px-4 py-2.5 text-left">
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-base" strokeWidth={2.5} />
                          <div>
                            <p className="text-xs font-medium text-text-primary">{benefit.text}</p>
                            <p className="mt-0.5 text-xs text-text-muted">{benefit.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex w-full flex-col gap-4">
                    <button
                      onClick={handleConfirmPayment}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-purple-base text-base font-semibold text-white transition-opacity hover:opacity-90"
                    >
                      Subscribe for ${GROWTH_PLUS_PRICE}/mo
                    </button>
                    <button
                      onClick={handleCloseModal}
                      className="flex h-12 w-full items-center justify-center rounded-lg text-base font-medium text-text-secondary transition-colors hover:text-text-primary"
                    >
                      Go back
                    </button>
                  </div>
                </div>
              )}

              {modalState === 'success' && (
                <div className="flex flex-col items-center text-center">
                  {/* Drawer handle — mobile only */}
                  <div className="mb-4 h-1 w-10 rounded-full bg-border lg:hidden" />

                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-tint">
                    <CheckCircle2 className="h-6 w-6 text-green-text" />
                  </div>
                  <h2 className="text-lg font-semibold text-text-primary">
                    Growth+ activated
                  </h2>
                  <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                    Your account is now supercharged. You'll start seeing increased reach and engagement within the next few days.
                  </p>

                  <button
                    onClick={handleSuccessContinue}
                    className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-green-base text-base font-semibold text-white transition-opacity hover:opacity-90"
                  >
                    Continue to dashboard
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
