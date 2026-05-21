import { useEffect, useState } from 'react'
import { Check, Heart, Settings2, UserMinus, UserPlus, Zap } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import SettingSwitch from '@/components/SettingSwitch'
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

// Save / Cancel button pair shown when there's a draft pending. Used in
// two slots — desktop in the card header, mobile below the option grid
// (so the user can confirm right beneath the staged option without
// scrolling back up).
function SaveCancelButtons({ onCancel, onSave }) {
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
      >
        Cancel
      </button>
      <button
        type="button"
        onClick={onSave}
        className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
      >
        Save mode
      </button>
    </>
  )
}

export default function ModeCard() {
  const savedMode = useGrowthConfig((s) => s.config.mode)
  const setMode = useGrowthConfig((s) => s.setMode)
  const likeAfterFollow = useGrowthConfig((s) => s.config.likeAfterFollow)
  const toggleLikeAfterFollow = useGrowthConfig((s) => s.toggleLikeAfterFollow)

  const [draft, setDraft] = useState(savedMode)

  // Sync draft when the saved value changes from outside (e.g. another tab).
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
    <section className="rounded-xl border border-border bg-surface p-4 pb-3 lg:p-6">
      {/* Header row — chip + title + tooltip + within-IG-limits pill inline.
          When dirty, Save/Cancel buttons appear at the right end on desktop
          only (mobile gets them below the grid for thumb reach). */}
      <div className="flex flex-wrap items-center gap-3">
        <CardChip color="blue" icon={Settings2} />
        <h2 className="text-base font-semibold text-text-primary">Mode</h2>
        <InfoTooltip text="How Kicksta grows your account. You can change this any time." />

        {dirty && (
          <div className="ml-auto hidden items-center gap-2 lg:flex">
            <SaveCancelButtons onCancel={handleCancel} onSave={handleSave} />
          </div>
        )}
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {MODES.map((m) => {
          const isSaved = savedMode === m.value
          const isStaged = draft === m.value
          const Icon = m.icon
          // Visual rules:
          //   - Card matching the draft is rendered in the "selected" solid
          //     style (works for both saved-and-not-dirty and staged states).
          //   - Card matching the saved mode but NOT the current draft keeps
          //     its Check icon as a subtle reminder of the previously saved
          //     choice, but loses the solid border/tint so the staged card
          //     is visually unambiguous.
          //   - Other cards stay in default unselected state.
          const showSolid = isStaged
          const showCheck = isSaved
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setDraft(m.value)}
              className={`relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all lg:p-5 ${
                showSolid
                  ? 'border-blue-base bg-blue-tint/40 shadow-sm'
                  : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              {showCheck && (
                <Check
                  className={`absolute right-3 top-3 h-4 w-4 ${
                    showSolid ? 'text-blue-base' : 'text-text-muted'
                  }`}
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

      {dirty && (
        <div className="mt-4 flex items-center justify-end gap-2 lg:hidden">
          <SaveCancelButtons onCancel={handleCancel} onSave={handleSave} />
        </div>
      )}

      {/* Like-after-follow — disabled when the saved mode is
          `unfollow_only` (no follows means no follow-related likes).
          Reads from `savedMode` (not `draft`) so the disabled state
          reflects the actually-saved engine setting; staging a new
          mode doesn't grey the row until the user hits Save. */}
      <div className="mt-4 border-t border-border pt-4">
        <SettingSwitch
          icon={Heart}
          title="Like after follow"
          description={
            savedMode === 'unfollow_only'
              ? "Disabled — Kicksta isn't following anyone in this mode."
              : 'Like a few of their recent posts after following — boosts the follow-back rate.'
          }
          checked={likeAfterFollow}
          onChange={() => toggleLikeAfterFollow()}
          disabled={savedMode === 'unfollow_only'}
        />
      </div>
    </section>
  )
}
