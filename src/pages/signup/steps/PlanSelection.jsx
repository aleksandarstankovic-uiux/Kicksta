import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Check, X, Loader2, TrendingUp, Users, Star, Info, Sparkles } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { mockPlans, billingPeriods } from '@/mocks/plans'
import { useShowHeadingIcon } from '@/components/SignupLayout'

// Tooltip descriptions for features that need explanation
const FEATURE_TOOLTIPS = {
  'Targeted growth engine': 'Kicksta engages with followers of accounts and hashtags you target, so they discover your profile organically.',
  'Like after follow': 'Kicksta likes 1–3 recent posts from each user it follows, increasing the chance they notice and follow you back.',
  'Welcome DM': 'Automatically send a personalized direct message when someone follows you back.',
  'Gender targeting': 'Filter interactions by gender to focus on the audience most relevant to your brand.',
  'Close Friends adder': 'Automatically add new followers to your Close Friends list for exclusive Stories reach.',
}

const PLANS = [mockPlans.growth, mockPlans.advanced]

export default function PlanSelection() {
  const navigate = useNavigate()
  const [billing, setBilling] = useState('monthly')
  const [selected, setSelected] = useState('advanced')
  const [continuing, setContinuing] = useState(false)
  const [priceKey, setPriceKey] = useState(0)
  const [openTooltip, setOpenTooltip] = useState(null)
  const showIcon = useShowHeadingIcon()

  function handleBillingChange(period) {
    setBilling(period)
    setPriceKey((k) => k + 1) // trigger animation
  }

  function handleContinue() {
    if (!selected) return
    setContinuing(true)
    setTimeout(() => {
      navigate('/signup/billing')
    }, 400)
  }

  return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
      {/* Heading */}
      <div className="mb-4 text-center lg:mb-6">
        {showIcon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint">
            <Sparkles className="h-6 w-6 text-blue-text" />
          </div>
        )}
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Start growing free for 7 days
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary lg:mt-2">
          We engage with users in your niche so they discover your profile. Pick a plan to start your trial. Cancel anytime.
        </p>
      </div>

      {/* Billing period switcher — compact segmented control */}
      <div className="mb-4 flex items-center justify-center">
        <div className="inline-flex rounded-full bg-surface p-0.5 ring-1 ring-border">
          {billingPeriods.map((period) => {
            const isActive = billing === period.id
            const pricing = mockPlans.advanced.pricing[period.id]
            return (
              <button
                key={period.id}
                onClick={() => handleBillingChange(period.id)}
                className={cn(
                  'flex items-center gap-1 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all',
                  isActive
                    ? 'bg-blue-base text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {period.label}
                {pricing.savings && (
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-px text-xs font-semibold leading-tight',
                      isActive ? 'bg-white/20 text-white' : 'bg-green-tint text-green-text'
                    )}
                  >
                    -{pricing.savings}%
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Plan cards — stacked mobile, side by side desktop */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-stretch">
        {PLANS.map((plan) => {
          const pricing = plan.pricing[billing]
          const isSelected = selected === plan.id
          return (
            <button
              key={plan.id}
              onClick={() => setSelected(plan.id)}
              className={cn(
                'relative w-full rounded-xl border p-4 text-left transition-all lg:flex-1',
                isSelected
                  ? 'border-blue-base bg-surface shadow-md ring-1 ring-blue-base/20'
                  : 'border-border bg-surface shadow-sm hover:border-border-strong'
              )}
            >
              {/* Popular badge */}
              {plan.popular && (
                <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full bg-blue-base px-2.5 py-0.5 text-xs font-semibold text-white">
                  <Star className="h-3 w-3" />
                  Popular
                </span>
              )}

              {/* Plan header + selection indicator */}
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-text-primary">{plan.name}</h3>
                  <p className="mt-0.5 text-xs text-text-secondary">{plan.description}</p>
                </div>
                <div
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isSelected ? 'border-blue-base bg-blue-base' : 'border-border'
                  )}
                >
                  {isSelected && <Check className="h-3 w-3 text-white" strokeWidth={3} />}
                </div>
              </div>

              {/* Pricing — animated on billing change */}
              <div key={`price-${plan.id}-${priceKey}`} className="mt-3 flex items-baseline gap-1 animate-price-update">
                <span className="text-2xl font-semibold text-text-primary">
                  {formatPrice(pricing.perMonth)}
                </span>
                <span className="text-sm text-text-secondary">/mo</span>
                {billing !== 'monthly' && (
                  <span className="ml-1.5 text-xs text-text-muted line-through">
                    {formatPrice(plan.pricing.monthly.perMonth)}
                  </span>
                )}
              </div>
              {billing !== 'monthly' && (
                <p key={`billed-${plan.id}-${priceKey}`} className="mt-0.5 text-xs text-text-muted animate-price-update">
                  {formatPrice(pricing.amount)} billed per {pricing.period}
                </p>
              )}

              {/* Divider */}
              <div className="my-3 h-px bg-border" />

              {/* Features list — more spacing */}
              <ul className="flex flex-col gap-2.5">
                {plan.features.map((feature) => {
                  const tooltip = FEATURE_TOOLTIPS[feature.text]
                  const tooltipKey = `${plan.id}-${feature.text}`
                  const isTooltipOpen = openTooltip === tooltipKey
                  return (
                    <li key={feature.text} className="flex flex-col gap-1">
                      <div className="flex items-center gap-2.5">
                        {feature.included ? (
                          <Check className="h-4 w-4 shrink-0 text-green-text" strokeWidth={2.5} />
                        ) : (
                          <X className="h-4 w-4 shrink-0 text-text-muted" strokeWidth={2} />
                        )}
                        <span
                          className={cn(
                            'text-sm',
                            feature.included ? 'text-text-primary' : 'text-text-muted'
                          )}
                        >
                          {feature.text}
                        </span>
                        {tooltip && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              setOpenTooltip(isTooltipOpen ? null : tooltipKey)
                            }}
                            className="shrink-0 text-text-muted transition-colors hover:text-text-secondary"
                            aria-label={`Learn more about ${feature.text}`}
                          >
                            <Info className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                      {isTooltipOpen && tooltip && (
                        <p
                          className="ml-6.5 text-xs leading-relaxed text-text-secondary"
                          style={{ marginLeft: '26px', animation: 'fadeSlideIn 0.15s ease-out' }}
                        >
                          {tooltip}
                        </p>
                      )}
                    </li>
                  )
                })}
              </ul>
            </button>
          )
        })}
      </div>

      {/* CTA — constrained to max-w-md like previous step */}
      <div className="mx-auto mt-4 flex w-full max-w-md flex-col gap-4">
        <button
          onClick={handleContinue}
          disabled={!selected || continuing}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-base text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
        >
          {continuing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Continuing...
            </>
          ) : (
            `Try ${selected === 'advanced' ? 'Advanced' : 'Growth'} free for 7 days`
          )}
        </button>

        <p className="text-center text-xs text-text-muted">
          No charge today. After 7 days, {formatPrice(PLANS.find(p => p.id === selected)?.pricing[billing].perMonth)}/mo. Cancel anytime.
        </p>

        {/* Social proof */}
        <div className="mt-3 flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-tint px-2.5 py-1 text-xs font-medium text-blue-text">
            <TrendingUp className="h-3 w-3" />
            100K+ grown
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-tint px-2.5 py-1 text-xs font-medium text-blue-text">
            <Users className="h-3 w-3" />
            Real followers
          </span>
        </div>
      </div>
    </div>
  )
}
