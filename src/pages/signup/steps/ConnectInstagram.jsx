import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Eye, EyeOff, ShieldCheck, Lock, Users, ExternalLink, Loader2, ChevronDown, MapPin, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useShowHeadingIcon } from '@/components/SignupLayout'

const SERVER_LOCATIONS = [
  { code: 'US', flag: '🇺🇸', label: 'United States', recommended: true },
  { code: 'GB', flag: '🇬🇧', label: 'United Kingdom', recommended: false },
  { code: 'DE', flag: '🇩🇪', label: 'Germany', recommended: false },
  { code: 'FR', flag: '🇫🇷', label: 'France', recommended: false },
  { code: 'NL', flag: '🇳🇱', label: 'Netherlands', recommended: false },
  { code: 'CA', flag: '🇨🇦', label: 'Canada', recommended: false },
  { code: 'AU', flag: '🇦🇺', label: 'Australia', recommended: false },
  { code: 'BR', flag: '🇧🇷', label: 'Brazil', recommended: false },
  { code: 'IN', flag: '🇮🇳', label: 'India', recommended: false },
  { code: 'JP', flag: '🇯🇵', label: 'Japan', recommended: false },
]

const SAFETY_SLIDES = [
  {
    icon: Lock,
    title: 'Encrypted & private',
    body: 'Your password is encrypted with bank-level security. We never store it in plain text or share it with third parties.',
  },
  {
    icon: ShieldCheck,
    title: 'No posting or messaging',
    body: 'Kicksta will never post, DM, or change anything on your account without your permission.',
  },
  {
    icon: Users,
    title: 'Trusted by 100,000+ creators',
    body: 'Brands, influencers, and businesses use Kicksta daily to grow real, engaged audiences.',
  },
]

// Mock — in production this would come from previous step state
const SELECTED_ACCOUNT = { username: 'alexjohnson.co', fullName: 'Alex Johnson', profilePic: null }

export default function ConnectInstagram() {
  const navigate = useNavigate()
  const showIcon = useShowHeadingIcon()
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [activeSlide, setActiveSlide] = useState(0)
  const [serverLocation, setServerLocation] = useState('US')
  const [showServerLocation, setShowServerLocation] = useState(false)

  const goToSlide = useCallback((index) => {
    setActiveSlide(index)
  }, [])

  // Auto-rotate every 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SAFETY_SLIDES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [activeSlide])

  function handleSubmit(e) {
    e.preventDefault()
    if (!password.trim()) {
      setError('Enter your Instagram password')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setSubmitting(true)
    // Simulate connection — then 2FA is triggered
    setTimeout(() => {
      navigate('/signup/two-factor')
    }, 1200)
  }

  return (
    <div className="mx-auto w-full max-w-md" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
      {/* Heading */}
      <div className="mb-4 text-center lg:mb-6">
        {showIcon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint">
            <Link2 className="h-6 w-6 text-blue-text" />
          </div>
        )}
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Connect your Instagram
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary lg:mt-2">
          Log in so Kicksta can start growing your account organically. We never post, message, or store your password in plain text.
        </p>
      </div>

      {/* Selected account card */}
      <div className="mb-3 rounded-xl border border-border bg-surface p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-tint">
            {SELECTED_ACCOUNT.profilePic ? (
              <img src={SELECTED_ACCOUNT.profilePic} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              <Camera className="h-5 w-5 text-blue-text" />
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-text-primary">
              @{SELECTED_ACCOUNT.username}
            </p>
            <p className="truncate text-sm text-text-secondary">
              {SELECTED_ACCOUNT.fullName}
            </p>
          </div>
        </div>
      </div>

      {/* Credentials card */}
      <form onSubmit={handleSubmit}>
        <div className="rounded-xl border border-border bg-surface shadow-sm">
          {/* Password field */}
          <div className="p-4">
            <div className="mb-1.5 flex items-center justify-between">
              <label htmlFor="ig-password" className="text-sm font-medium text-text-primary">
                Instagram password
              </label>
              <a
                href="https://www.instagram.com/accounts/password/reset/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-blue-text transition-opacity hover:opacity-80"
              >
                Forgot password?
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                id="ig-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (error) setError('')
                }}
                placeholder="Enter your password"
                className={cn(
                  'h-12 w-full rounded-lg border bg-bg pl-11 pr-12 text-base text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-blue-base focus:ring-2 focus:ring-blue-base/20',
                  error ? 'border-red-base' : 'border-border'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-text-muted transition-colors hover:text-text-secondary"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && <p className="mt-1.5 text-sm text-red-text">{error}</p>}
          </div>

          {/* Divider */}
          <div className="h-px bg-border" />

          {/* Server location — collapsed by default */}
          {!showServerLocation ? (
            <button
              type="button"
              onClick={() => setShowServerLocation(true)}
              className="flex w-full items-center gap-1.5 px-4 py-3 text-xs font-medium text-text-muted transition-colors hover:bg-bg hover:text-text-secondary"
            >
              <MapPin className="h-3.5 w-3.5" />
              Change server location
            </button>
          ) : (
            <div className="px-4 py-3" style={{ animation: 'fadeSlideIn 0.2s ease-out' }}>
              <label htmlFor="server-location" className="mb-1.5 block text-sm font-medium text-text-primary">
                Server location
              </label>
              <div className="relative">
                <select
                  id="server-location"
                  value={serverLocation}
                  onChange={(e) => setServerLocation(e.target.value)}
                  className="h-12 w-full appearance-none rounded-lg border border-border bg-bg pl-4 pr-10 text-base text-text-primary outline-none transition-colors focus:border-blue-base focus:ring-2 focus:ring-blue-base/20"
                >
                  {SERVER_LOCATIONS.map((loc) => (
                    <option key={loc.code} value={loc.code}>
                      {loc.flag}  {loc.label}{loc.recommended ? ' (Recommended)' : ''}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              </div>
              <p className="mt-1 text-xs text-text-muted">Pick the region closest to you.</p>
            </div>
          )}
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-base text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
        >
          {submitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting...
            </>
          ) : (
            'Connect account'
          )}
        </button>
      </form>

      {/* Security reassurance carousel */}
      <div className="mx-auto mt-4 max-w-md rounded-xl border border-border bg-surface p-4">
        {/* Grid stack — all slides occupy same cell so tallest sets height */}
        <div className="grid overflow-hidden">
          {SAFETY_SLIDES.map((slide, i) => {
            const SlideIcon = slide.icon
            return (
              <div
                key={i}
                className={cn(
                  'col-start-1 row-start-1 flex items-start gap-3 transition-all duration-300',
                  i === activeSlide
                    ? 'opacity-100 translate-x-0'
                    : 'opacity-0 translate-x-4 pointer-events-none'
                )}
              >
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-tint">
                  <SlideIcon className="h-4 w-4 text-green-text" />
                </div>
                <div>
                  <p className="text-sm font-medium text-text-primary">{slide.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                    {slide.body}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* Dot indicators */}
        <div className="mt-3 flex items-center justify-center gap-2">
          {SAFETY_SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goToSlide(i)}
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                i === activeSlide
                  ? 'w-6 bg-green-base'
                  : 'w-2 bg-border hover:bg-border-strong'
              )}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Trust badges — bottom social proof */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-tint px-3 py-1.5 text-xs font-medium text-green-text">
          <Lock className="h-3.5 w-3.5" />
          256-bit SSL
        </span>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-green-tint px-3 py-1.5 text-xs font-medium text-green-text">
          <ShieldCheck className="h-3.5 w-3.5" />
          GDPR compliant
        </span>
      </div>
    </div>
  )
}
