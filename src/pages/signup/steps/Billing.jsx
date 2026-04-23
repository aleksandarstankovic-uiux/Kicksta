import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreditCard, Lock, ShieldCheck, CalendarX, Loader2, Camera, Sparkles, Check } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { mockPlans } from '@/mocks/plans'
import LoadingOverlay from '@/components/LoadingOverlay'
import { useDirtyForm, useShowHeadingIcon } from '@/components/SignupLayout'

// Card brand detection from first digits (IIN ranges)
function detectCardBrand(number) {
  const digits = number.replace(/\D/g, '')
  if (!digits) return null
  if (/^4/.test(digits)) return 'visa'
  if (/^5[1-5]/.test(digits) || /^2[2-7]/.test(digits)) return 'mastercard'
  if (/^3[47]/.test(digits)) return 'amex'
  if (/^6(?:011|5)/.test(digits)) return 'discover'
  return null
}

// Inline SVG brand logos
function CardBrandIcon({ brand }) {
  if (brand === 'visa') {
    return (
      <svg className="h-6 w-8" viewBox="0 0 48 32" fill="none">
        <rect width="48" height="32" rx="4" fill="#1A1F71" />
        <path d="M19.5 21H17L18.9 11H21.4L19.5 21ZM15.2 11L12.8 18.2L12.5 16.8L12.5 16.8L11.6 12C11.6 12 11.5 11 10.2 11H6.1L6 11.2C6 11.2 7.5 11.5 9.2 12.5L11.4 21H14L18 11H15.2ZM35.2 21H37.5L35.5 11H33.5C32.4 11 32.1 11.9 32.1 11.9L28.3 21H30.9L31.4 19.5H34.6L34.9 21H35.2ZM32.2 17.5L33.5 13.8L34.2 17.5H32.2ZM28.5 13.5L28.9 11.3C28.9 11.3 27.5 10.8 26.1 10.8C24.5 10.8 21.1 11.5 21.1 14.3C21.1 16.9 24.7 16.9 24.7 18.3C24.7 19.6 21.5 19.3 20.2 18.3L19.8 20.6C19.8 20.6 21.2 21.2 23.1 21.2C25 21.2 27.4 20.2 27.4 17.6C27.4 14.9 23.8 14.7 23.8 13.5C23.8 12.3 26.2 12.5 27.3 13.1L28.5 13.5Z" fill="white" />
      </svg>
    )
  }
  if (brand === 'mastercard') {
    return (
      <svg className="h-6 w-8" viewBox="0 0 48 32" fill="none">
        <rect width="48" height="32" rx="4" fill="#252525" />
        <circle cx="19" cy="16" r="8" fill="#EB001B" />
        <circle cx="29" cy="16" r="8" fill="#F79E1B" />
        <path d="M24 10.3C25.8 11.7 27 13.7 27 16C27 18.3 25.8 20.3 24 21.7C22.2 20.3 21 18.3 21 16C21 13.7 22.2 11.7 24 10.3Z" fill="#FF5F00" />
      </svg>
    )
  }
  if (brand === 'amex') {
    return (
      <svg className="h-6 w-8" viewBox="0 0 48 32" fill="none">
        <rect width="48" height="32" rx="4" fill="#006FCF" />
        <path d="M10 16L12 11H15L17 16M11 14.5H16M31 11H28L25 16L22 11H19L24 19H26L31 11ZM31 11V19M33 11H40L38 13.5H35V14.5H39.5L37.5 17H35V18H40L38 19H33V11Z" stroke="white" strokeWidth="1.2" fill="none" />
      </svg>
    )
  }
  if (brand === 'discover') {
    return (
      <svg className="h-6 w-8" viewBox="0 0 48 32" fill="none">
        <rect width="48" height="32" rx="4" fill="#fff" stroke="#E4E7ED" />
        <circle cx="28" cy="16" r="6" fill="#FF6000" />
        <text x="8" y="18" fill="#333" fontSize="8" fontWeight="600" fontFamily="sans-serif">D</text>
      </svg>
    )
  }
  return null
}

function getTrialEndDate() {
  const date = new Date()
  date.setDate(date.getDate() + 7)
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

// Mock — in production these would come from previous step state
const SELECTED_PLAN = mockPlans.advanced
const SELECTED_BILLING = 'monthly'
const SELECTED_ACCOUNT = { username: 'alexjohnson.co', fullName: 'Alex Johnson', profilePic: null }

export default function Billing() {
  const navigate = useNavigate()
  const [cardNumber, setCardNumber] = useState('')
  const [cardBrand, setCardBrand] = useState(null)
  const [expiry, setExpiry] = useState('')
  const [cvc, setCvc] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [showPreparing, setShowPreparing] = useState(false)
  const [errors, setErrors] = useState({})
  const { setDirty } = useDirtyForm()
  const showIcon = useShowHeadingIcon()

  // Mark form dirty when user types anything
  useEffect(() => {
    const hasInput = !!(cardNumber || expiry || cvc || name)
    setDirty(hasInput)
  }, [cardNumber, expiry, cvc, name, setDirty])

  const trialEndDate = getTrialEndDate()
  const pricing = SELECTED_PLAN.pricing[SELECTED_BILLING]
  const includedFeatures = SELECTED_PLAN.features.filter((f) => f.included)

  function formatCardNumber(value) {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4)
    if (digits.length >= 3) return digits.slice(0, 2) + ' / ' + digits.slice(2)
    return digits
  }

  function validate() {
    const errs = {}
    if (cardNumber.replace(/\D/g, '').length < 16) errs.cardNumber = 'Enter a valid card number'
    if (expiry.replace(/\D/g, '').length < 4) errs.expiry = 'Enter a valid date'
    if (cvc.length < 3) errs.cvc = 'Enter CVC'
    if (name.trim().length < 2) errs.name = 'Enter cardholder name'
    return errs
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    setErrors(errs)
    if (Object.keys(errs).length > 0) return

    setSubmitting(true)
    setTimeout(() => {
      setShowPreparing(true)
    }, 400)
    setTimeout(() => {
      navigate('/signup/connect-instagram')
    }, 3000)
  }

  function handleApplePay() {
    setSubmitting(true)
    setTimeout(() => {
      setShowPreparing(true)
    }, 400)
    setTimeout(() => {
      navigate('/signup/connect-instagram')
    }, 3000)
  }

  if (showPreparing) {
    return (
      <LoadingOverlay
        icon={Sparkles}
        title="Setting up your account"
        subtitle={`Getting everything ready for @${SELECTED_ACCOUNT.username}...`}
        color="blue"
      />
    )
  }

  return (
    <div style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
      {/* Heading */}
      <div className="mb-4 text-center lg:mb-6">
        {showIcon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint">
            <CreditCard className="h-6 w-6 text-blue-text" />
          </div>
        )}
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Add a payment method
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary lg:mt-2">
          Your free trial starts today. You won't be charged until {trialEndDate}.
        </p>
      </div>

      {/* Two-column layout: summary left, payment right on desktop */}
      <div className="flex flex-col gap-3 lg:flex-row lg:gap-4">
        {/* Left — Order summary */}
        <div className="flex flex-col gap-3 lg:w-5/12">
          {/* Account card */}
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <p className="mb-2 text-xs font-medium text-text-muted">Account</p>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-tint">
                {SELECTED_ACCOUNT.profilePic ? (
                  <img src={SELECTED_ACCOUNT.profilePic} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <Camera className="h-4 w-4 text-blue-text" />
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-text-primary">@{SELECTED_ACCOUNT.username}</p>
                <p className="truncate text-xs text-text-secondary">{SELECTED_ACCOUNT.fullName}</p>
              </div>
            </div>
          </div>

          {/* Plan summary card — compact */}
          <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-text-muted">Your plan</p>
                <p className="mt-0.5 text-base font-semibold text-text-primary">{SELECTED_PLAN.name}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-text-primary">{formatPrice(pricing.perMonth)}<span className="text-xs font-normal text-text-secondary">/mo</span></p>
                {SELECTED_BILLING !== 'monthly' && (
                  <p className="text-xs text-text-muted">{formatPrice(pricing.amount)}/{pricing.period}</p>
                )}
              </div>
            </div>

            {/* Features — desktop only */}
            <ul className="my-3 hidden flex-col gap-1.5 border-y border-border py-3 lg:flex">
              {includedFeatures.map((f) => (
                <li key={f.text} className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 shrink-0 text-green-text" strokeWidth={2.5} />
                  <span className="text-xs text-text-secondary">{f.text}</span>
                </li>
              ))}
            </ul>

            <div className="my-3 h-px bg-border lg:hidden" />

            {/* Billing summary */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">Due today</span>
                <span className="text-sm font-semibold text-green-text">$0.00</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-text-secondary">After trial ({trialEndDate})</span>
                <span className="text-xs text-text-secondary">{formatPrice(pricing.perMonth)}/mo</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right — Payment */}
        <div className="flex flex-1 flex-col gap-3">
          {/* Express pay options */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleApplePay}
              disabled={submitting}
              aria-label="Pay with Apple Pay"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-text-primary text-sm font-semibold text-bg transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
              </svg>
              Pay
            </button>
            <button
              type="button"
              onClick={handleApplePay}
              disabled={submitting}
              aria-label="Pay with Google Pay"
              className="flex h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-border bg-surface text-sm font-medium text-text-primary shadow-sm transition-colors hover:bg-bg disabled:opacity-70"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Pay
            </button>
          </div>

          {/* Divider — or pay with card */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-text-muted">or pay with card</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Card form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="rounded-xl border border-border bg-surface p-4 shadow-sm">
              <div className="flex flex-col gap-3">
                {/* Name */}
                <div>
                  <label htmlFor="card-name" className="mb-1.5 block text-sm font-medium text-text-primary">
                    Name on card
                  </label>
                  <input
                    id="card-name"
                    type="text"
                    autoComplete="cc-name"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value)
                      if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }))
                    }}
                    placeholder="Alex Johnson"
                    className={cn(
                      'h-11 w-full rounded-lg border bg-bg pl-4 pr-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-blue-base focus:ring-2 focus:ring-blue-base/20',
                      errors.name ? 'border-red-base' : 'border-border'
                    )}
                  />
                  {errors.name && <p className="mt-1 text-xs text-red-text">{errors.name}</p>}
                </div>

                {/* Card number */}
                <div>
                  <label htmlFor="card-number" className="mb-1.5 block text-sm font-medium text-text-primary">
                    Card number
                  </label>
                  <div className="relative">
                    <CreditCard className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                    <input
                      id="card-number"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={cardNumber}
                      onChange={(e) => {
                        const formatted = formatCardNumber(e.target.value)
                        setCardNumber(formatted)
                        setCardBrand(detectCardBrand(formatted))
                        if (errors.cardNumber) setErrors((prev) => ({ ...prev, cardNumber: undefined }))
                      }}
                      placeholder="1234 5678 9012 3456"
                      className={cn(
                        'h-11 w-full rounded-lg border bg-bg pl-10 pr-14 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-blue-base focus:ring-2 focus:ring-blue-base/20',
                        errors.cardNumber ? 'border-red-base' : 'border-border'
                      )}
                    />
                    {cardBrand && (
                      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" style={{ animation: 'fadeIn 0.15s ease-out' }}>
                        <CardBrandIcon brand={cardBrand} />
                      </div>
                    )}
                  </div>
                  {errors.cardNumber && <p className="mt-1 text-xs text-red-text">{errors.cardNumber}</p>}
                </div>

                {/* Expiry + CVC */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="card-expiry" className="mb-1.5 block text-sm font-medium text-text-primary">
                      Expiry
                    </label>
                    <input
                      id="card-expiry"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      value={expiry}
                      onChange={(e) => {
                        setExpiry(formatExpiry(e.target.value))
                        if (errors.expiry) setErrors((prev) => ({ ...prev, expiry: undefined }))
                      }}
                      placeholder="MM / YY"
                      className={cn(
                        'h-11 w-full rounded-lg border bg-bg px-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-blue-base focus:ring-2 focus:ring-blue-base/20',
                        errors.expiry ? 'border-red-base' : 'border-border'
                      )}
                    />
                    {errors.expiry && <p className="mt-1 text-xs text-red-text">{errors.expiry}</p>}
                  </div>
                  <div className="w-28">
                    <label htmlFor="card-cvc" className="mb-1.5 block text-sm font-medium text-text-primary">
                      CVC
                    </label>
                    <input
                      id="card-cvc"
                      type="text"
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      value={cvc}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                        setCvc(val)
                        if (errors.cvc) setErrors((prev) => ({ ...prev, cvc: undefined }))
                      }}
                      placeholder="123"
                      className={cn(
                        'h-11 w-full rounded-lg border bg-bg px-4 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-blue-base focus:ring-2 focus:ring-blue-base/20',
                        errors.cvc ? 'border-red-base' : 'border-border'
                      )}
                    />
                    {errors.cvc && <p className="mt-1 text-xs text-red-text">{errors.cvc}</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Card CTA */}
            <button
              type="submit"
              disabled={submitting}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-base text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Starting trial...
                </>
              ) : (
                'Start free trial'
              )}
            </button>
          </form>

          {/* Cancel notice + trust signals */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-2">
              <CalendarX className="h-3.5 w-3.5 shrink-0 text-text-muted" />
              <p className="text-xs text-text-secondary">Cancel anytime — no questions asked</p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
                <Lock className="h-3 w-3" />
                SSL encrypted
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
                <ShieldCheck className="h-3 w-3" />
                Secure checkout
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
