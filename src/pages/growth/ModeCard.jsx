import { useEffect, useState } from 'react'
import { Check, Settings2, UserMinus, UserPlus, Zap } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import ResetConfirmModal from '@/components/ResetConfirmModal'

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
  const savedMode = useGrowthConfig((s) => s.config.mode)
  const setMode = useGrowthConfig((s) => s.setMode)
  const resetMode = useGrowthConfig((s) => s.resetMode)

  const [draft, setDraft] = useState(savedMode)
  const [resetOpen, setResetOpen] = useState(false)

  // Sync draft when the saved value changes from outside (e.g. reset).
  useEffect(() => {
    setDraft(savedMode)
  }, [savedMode])

  const dirty = draft !== savedMode

  const handleSave = () => {
    setMode(draft)
  }

  const handleCancel = () => {
    setDraft(savedMode)
  }

  return (
    <section className="mt-4 rounded-xl border border-border bg-surface p-4 lg:p-5">
      {/* Header row — chip + title + tooltip + within-IG-limits pill inline.
          When dirty, Save mode + Cancel buttons appear at the right end.
          Wraps to a new line on narrow viewports. */}
      <div className="flex flex-wrap items-center gap-3">
        <CardChip color="blue" icon={Settings2} />
        <h2 className="text-base font-semibold text-text-primary">Mode</h2>
        <InfoTooltip text="How Kicksta grows your account. You can change this any time." />
        <span className="inline-flex items-center gap-1 rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
          <Check className="h-3 w-3" aria-hidden="true" />
          Within IG limits
        </span>

        {dirty && (
          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-bg px-3 text-sm font-medium text-text-primary hover:opacity-90"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex h-9 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              Save mode
            </button>
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {MODES.map((m) => {
          const isSaved = savedMode === m.value
          const isStaged = !isSaved && draft === m.value
          const Icon = m.icon
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setDraft(m.value)}
              className={`relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all lg:p-5 ${
                isSaved
                  ? 'border-blue-base bg-blue-tint/40 shadow-sm'
                  : isStaged
                    ? 'border-blue-base border-dashed bg-blue-tint/20'
                    : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              {isSaved && (
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

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => setResetOpen(true)}
          className="text-xs text-text-muted hover:text-text-secondary"
        >
          Reset to defaults
        </button>
      </div>

      <ResetConfirmModal
        open={resetOpen}
        onClose={() => setResetOpen(false)}
        onConfirm={() => resetMode()}
        sectionLabel="Mode"
      />
    </section>
  )
}
