import { useGrowthConfig } from '@/stores/useGrowthConfig'

const MODES = [
  {
    value: 'auto',
    label: 'Auto',
    description:
      'Follow new users, like their posts, then unfollow after a period.',
  },
  {
    value: 'follow_only',
    label: 'Follow-only',
    description: 'Follow new users from your targets. No unfollows.',
  },
  {
    value: 'unfollow_only',
    label: 'Unfollow-only',
    description: 'Clean up non-followers. No new follows.',
  },
]

export default function ModeCard() {
  const mode = useGrowthConfig((s) => s.config.mode)
  const setMode = useGrowthConfig((s) => s.setMode)

  const current = MODES.find((m) => m.value === mode) ?? MODES[0]

  return (
    <section className="mt-4 rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Mode</h2>
      <p className="mt-1 text-sm text-text-secondary">{current.description}</p>

      <div className="mt-4 inline-flex rounded-full bg-bg p-1">
        {MODES.map((m) => {
          const selected = mode === m.value
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {m.label}
            </button>
          )
        })}
      </div>
    </section>
  )
}
