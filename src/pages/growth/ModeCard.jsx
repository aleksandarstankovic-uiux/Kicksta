import { Check, Settings2, UserMinus, UserPlus, Zap } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'

const MODES = [
  {
    value: 'auto',
    label: 'Auto',
    icon: Zap,
    iconCls: 'bg-green-tint text-green-text',
    recommended: true,
    description:
      'Follow new users, like their posts, then unfollow after a period. The complete growth loop — recommended for most users.',
  },
  {
    value: 'follow_only',
    label: 'Follow-only',
    icon: UserPlus,
    iconCls: 'bg-blue-tint text-blue-text',
    recommended: false,
    description:
      'Follow new users from your targets. No unfollows. Use when you want to build a following list manually.',
  },
  {
    value: 'unfollow_only',
    label: 'Unfollow-only',
    icon: UserMinus,
    iconCls: 'bg-bg text-text-secondary',
    recommended: false,
    description:
      "Clean up users who didn't follow back. No new follows. Good for trimming a bloated following count.",
  },
]

export default function ModeCard() {
  const mode = useGrowthConfig((s) => s.config.mode)
  const setMode = useGrowthConfig((s) => s.setMode)

  return (
    <section className="mt-4 rounded-xl border border-border bg-surface p-4 lg:p-5">
      {/* Header row — single inline cluster so the safety pill sits next
          to the title rather than floating against the right edge. Wraps
          to a new line on narrow viewports if needed. */}
      <div className="flex flex-wrap items-center gap-3">
        <CardChip color="blue" icon={Settings2} />
        <h2 className="text-base font-semibold text-text-primary">Mode</h2>
        <InfoTooltip text="How Kicksta grows your account. You can change this any time." />
        <span className="inline-flex items-center gap-1 rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
          <Check className="h-3 w-3" aria-hidden="true" />
          Within IG limits
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {MODES.map((m) => {
          const selected = mode === m.value
          const Icon = m.icon
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all lg:p-5 ${
                selected
                  ? 'border-blue-base bg-blue-tint/40 shadow-sm'
                  : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              {selected && (
                <Check
                  className="absolute right-3 top-3 h-4 w-4 text-blue-base"
                  aria-hidden="true"
                />
              )}

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.iconCls}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">
                  {m.label}
                </span>
                {m.recommended && (
                  <span className="rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
                    Recommended
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed text-text-secondary">
                {m.description}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
