import { useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Smartphone, MessageSquare, KeyRound, Loader2, ArrowLeft, Info, CheckCircle2, Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import LoadingOverlay from '@/components/LoadingOverlay'
import { useShowHeadingIcon } from '@/components/SignupLayout'

const METHOD_CONFIG = {
  sms: {
    icon: Smartphone,
    title: 'Enter your SMS code',
    description: 'We sent a 6-digit code to your phone number ending in ••••47.',
    resendLabel: 'Resend code',
    resendNote: 'Didn\'t get the text? Check your spam or request a new code.',
  },
  auth_app: {
    icon: KeyRound,
    title: 'Enter your authenticator code',
    description: 'Open your authenticator app (Google Authenticator, Authy, etc.) and enter the 6-digit code.',
    resendLabel: null,
    resendNote: 'Codes refresh every 30 seconds. Make sure you\'re using the latest one.',
  },
  whatsapp: {
    icon: MessageSquare,
    title: 'Enter your WhatsApp code',
    description: 'We sent a 6-digit code to your WhatsApp number ending in ••••47.',
    resendLabel: 'Resend code',
    resendNote: 'Didn\'t get the message? Make sure WhatsApp is open and connected.',
  },
}

const CODE_LENGTH = 6

export default function TwoFactorCode() {
  const navigate = useNavigate()
  const { method } = useParams()
  const config = METHOD_CONFIG[method]
  const showIcon = useShowHeadingIcon()

  const [code, setCode] = useState(Array(CODE_LENGTH).fill(''))
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [connected, setConnected] = useState(false)
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const inputRefs = useRef([])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  // Auto-submit when all digits are filled
  useEffect(() => {
    const full = code.every((d) => d !== '')
    if (full && !verifying && !verified) {
      handleVerify()
    }
  }, [code, verifying, verified])

  // Fallback if method is invalid
  useEffect(() => {
    if (!config) {
      navigate('/signup/two-factor')
    }
  }, [config, navigate])

  if (!config) return null

  function handleChange(index, value) {
    if (error) setError('')

    // Handle paste of full code
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, CODE_LENGTH).split('')
      const newCode = [...code]
      digits.forEach((d, i) => {
        if (index + i < CODE_LENGTH) newCode[index + i] = d
      })
      setCode(newCode)
      const nextIndex = Math.min(index + digits.length, CODE_LENGTH - 1)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    // Single digit
    const digit = value.replace(/\D/g, '')
    if (digit.length > 1) return

    const newCode = [...code]
    newCode[index] = digit
    setCode(newCode)

    // Auto-advance to next input
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleKeyDown(index, e) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const newCode = [...code]
      newCode[index - 1] = ''
      setCode(newCode)
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
    if (e.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleVerify() {
    const fullCode = code.join('')
    if (fullCode.length < CODE_LENGTH) {
      setError('Enter all 6 digits')
      return
    }

    setVerifying(true)
    setError('')

    // Simulate verification → connecting → connected → navigate
    setTimeout(() => {
      setVerifying(false)
      setVerified(true)
      // Brief verified state, then show connecting overlay
      setTimeout(() => {
        setConnecting(true)
      }, 600)
      // Switch to connected confirmation
      setTimeout(() => {
        setConnecting(false)
        setConnected(true)
      }, 2200)
      // Navigate to next step (~2s after connected confirmation)
      setTimeout(() => {
        navigate('/signup/first-target')
      }, 4200)
    }, 1200)
  }

  function handleResend() {
    setResending(true)
    setResent(false)
    setTimeout(() => {
      setResending(false)
      setResent(true)
      // Reset resent message after a few seconds
      setTimeout(() => setResent(false), 4000)
    }, 1000)
  }

  const Icon = config.icon
  const isFilled = code.every((d) => d !== '')

  // Connection overlay — shown after 2FA verification
  if (connecting || connected) {
    return (
      <LoadingOverlay
        icon={Link2}
        title="Connecting to Kicksta"
        subtitle="Securely linking your Instagram account..."
        color="blue"
        success={connected ? {
          title: 'Account connected',
          subtitle: "Your Instagram is now linked to Kicksta. Let's set up your first target.",
        } : undefined}
      />
    )
  }

  return (
    <div className="mx-auto w-full max-w-md" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
      {/* Header */}
      <div className="mb-4 text-center lg:mb-6">
        {showIcon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint">
            <Icon className="h-6 w-6 text-blue-text" />
          </div>
        )}
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          {config.title}
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary lg:mt-2">
          {config.description}
        </p>
      </div>

      {/* Code input */}
      <div className="flex justify-center gap-2">
        {code.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputRefs.current[i] = el)}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={CODE_LENGTH}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onFocus={(e) => e.target.select()}
            disabled={verifying || verified}
            className={cn(
              'h-14 w-11 rounded-lg border bg-surface text-center text-xl font-semibold text-text-primary outline-none transition-all',
              'focus:border-blue-base focus:ring-2 focus:ring-blue-base/20',
              error ? 'border-red-base' : digit ? 'border-blue-base' : 'border-border',
              (verifying || verified) && 'opacity-60'
            )}
          />
        ))}
      </div>

      {/* Error */}
      {error && (
        <p className="mt-2 text-center text-sm text-red-text">{error}</p>
      )}

      {/* Success state */}
      {verified && (
        <div className="mt-4 flex items-center justify-center gap-2 text-green-text" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
          <CheckCircle2 className="h-5 w-5" />
          <span className="text-sm font-medium">Verified successfully</span>
        </div>
      )}

      {/* Verify button */}
      {!verified && (
        <button
          onClick={handleVerify}
          disabled={!isFilled || verifying}
          className="mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-blue-base text-base font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-70"
        >
          {verifying ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Verifying...
            </>
          ) : (
            'Verify code'
          )}
        </button>
      )}

      {/* Resend / help note */}
      <div className="mt-4 text-center">
        {config.resendLabel && !verified && (
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleResend}
              disabled={resending}
              className="text-sm font-medium text-blue-text transition-opacity hover:opacity-80 disabled:opacity-50"
            >
              {resending ? 'Sending...' : config.resendLabel}
            </button>
            {resent && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-text" style={{ animation: 'fadeSlideIn 0.2s ease-out' }}>
                <CheckCircle2 className="h-3 w-3" />
                Code sent
              </span>
            )}
          </div>
        )}
        <p className="mt-2 text-xs text-text-muted">
          {config.resendNote}
        </p>
      </div>

      {/* Info note */}
      <div className="mt-6 flex items-start gap-3 rounded-lg bg-blue-tint px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-text" />
        <p className="text-xs leading-relaxed text-blue-text">
          This code is verified directly with Instagram. Kicksta never sees or stores your verification codes.
        </p>
      </div>

      {/* Back option */}
      <div className="mt-4 text-center">
        <button
          onClick={() => navigate('/signup/two-factor')}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Try a different verification method
        </button>
      </div>
    </div>
  )
}
