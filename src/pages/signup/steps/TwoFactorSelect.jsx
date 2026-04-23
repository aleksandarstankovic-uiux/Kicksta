import { useNavigate } from 'react-router-dom'
import { Smartphone, MessageSquare, KeyRound, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useShowHeadingIcon } from '@/components/SignupLayout'

const METHODS = [
  {
    id: 'sms',
    icon: Smartphone,
    title: 'Text message (SMS)',
    description: 'We\'ll send a 6-digit code to your phone number ending in ••••47.',
    available: true,
  },
  {
    id: 'auth_app',
    icon: KeyRound,
    title: 'Authentication app',
    description: 'Use a code from Google Authenticator, Authy, or another authenticator app.',
    available: true,
  },
  {
    id: 'whatsapp',
    icon: MessageSquare,
    title: 'WhatsApp',
    description: 'Receive a 6-digit code via WhatsApp to your linked number.',
    available: true,
  },
]

export default function TwoFactorSelect() {
  const navigate = useNavigate()
  const showIcon = useShowHeadingIcon()

  function handleSelect(methodId) {
    navigate(`/signup/two-factor/${methodId}`)
  }

  return (
    <div className="mx-auto w-full max-w-md" style={{ animation: 'fadeSlideIn 0.3s ease-out' }}>
      {/* Header */}
      <div className="mb-4 text-center lg:mb-6">
        {showIcon && (
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-tint">
            <ShieldCheck className="h-6 w-6 text-blue-text" />
          </div>
        )}
        <h1 className="text-2xl font-semibold leading-snug text-text-primary">
          Two-factor authentication
        </h1>
        <p className="mt-1.5 text-sm leading-relaxed text-text-secondary lg:mt-2">
          Instagram requires an extra verification step to keep your account secure. Choose how you'd like to receive your code.
        </p>
      </div>

      {/* Info banner — above method cards for visibility */}
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-blue-base/20 bg-blue-tint px-4 py-3.5">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-blue-text" />
        <div>
          <p className="text-sm font-medium text-blue-text">Instagram security check</p>
          <p className="mt-0.5 text-xs leading-relaxed text-blue-text/80">
            Instagram requires this to verify your identity — Kicksta never sees your code. If you can't access any of these methods,{' '}
            <a
              href="https://help.instagram.com/374546259294234"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-blue-text underline underline-offset-2 transition-opacity hover:opacity-80"
            >
              visit Instagram's help center
            </a>.
          </p>
        </div>
      </div>

      {/* Method cards */}
      <div className="flex flex-col gap-3">
        {METHODS.map((method) => {
          const Icon = method.icon
          return (
            <button
              key={method.id}
              onClick={() => handleSelect(method.id)}
              disabled={!method.available}
              className={cn(
                'flex w-full items-center gap-4 rounded-xl border p-4 text-left transition-all',
                method.available
                  ? 'border-border bg-surface shadow-sm hover:border-blue-base hover:shadow-md active:scale-[0.99]'
                  : 'border-border bg-bg opacity-50 cursor-not-allowed'
              )}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-tint">
                <Icon className="h-5 w-5 text-blue-text" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-text-primary">{method.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
                  {method.description}
                </p>
              </div>
              {method.available && (
                <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" />
              )}
            </button>
          )
        })}
      </div>

      {/* Back option */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={() => navigate('/signup/connect-instagram')}
          className="inline-flex min-h-11 items-center gap-1.5 px-4 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Try a different account
        </button>
      </div>
    </div>
  )
}
