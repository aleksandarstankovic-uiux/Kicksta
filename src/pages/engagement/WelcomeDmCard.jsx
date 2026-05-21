import { useState } from 'react'
import { ChevronDown, MessageSquare } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { useUserStore } from '@/stores/useUserStore'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import WelcomeDmModal from './WelcomeDmModal'
import WelcomeDmPreview from './WelcomeDmPreview'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { mockWelcomeDmHistory } from '@/mocks/welcomeDmHistory'

// Welcome DM — auto-DM new followers once they follow back. Advanced
// plan only; locked-state for Growth users routes to the upgrade
// bottom sheet.
//
// Header pattern (mirrors the modal headers): chip + title +
// optional Advanced pill + tooltip on the left, the bare toggle
// pinned in the upper-right. Subtitle sits below the title row.
// The previous standalone SettingSwitch row was redundant with this
// header — same title, same description.
function isLocked(user) {
  return user.plan !== 'advanced'
}

export default function WelcomeDmCard({ onRequestUpgrade }) {
  const { config, toggleWelcomeDm } = useGrowthConfig()
  const [dmModalOpen, setDmModalOpen] = useState(false)
  const user = useUserStore((s) => s.user)

  const locked = isLocked(user)
  const showPreview = config.welcomeDm.enabled && !locked

  const handleToggle = () => {
    if (locked) {
      onRequestUpgrade('welcome_dm')
      return
    }
    toggleWelcomeDm()
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CardChip color="green" icon={MessageSquare} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-text-primary">Welcome DM</h2>
              {locked && (
                <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
                  Advanced
                </span>
              )}
              <InfoTooltip text="Send a one-time message when new followers follow back." />
            </div>
            <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
              Auto-DM new followers once they follow back.
            </p>
          </div>
        </div>
        <CardToggle
          checked={config.welcomeDm.enabled}
          locked={locked}
          onClick={handleToggle}
          ariaLabel="Toggle Welcome DM"
        />
      </div>

      <WelcomeDmPreview
        enabled={showPreview}
        message={config.welcomeDm.message}
        onEdit={() => setDmModalOpen(true)}
      />
      {showPreview && <RecentDmsSubsection />}

      <WelcomeDmModal open={dmModalOpen} onClose={() => setDmModalOpen(false)} />
    </section>
  )
}

// Bare toggle button mirroring SettingSwitch's switch element. Used
// in the upper-right corner of the engagement cards' headers.
function CardToggle({ checked, locked, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
        locked
          ? 'cursor-pointer bg-border opacity-60'
          : checked
            ? 'bg-green-base'
            : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}

// Compact list of the last welcome DMs the engine sent. Only mounts
// when the toggle is on AND the user is on Advanced (the parent
// gates this with `showPreview`). When no DMs have been sent yet,
// renders a muted empty-state line.
function RecentDmsSubsection() {
  const items = mockWelcomeDmHistory.slice(0, 7)
  return (
    <CollapsibleRecents title="Recent DMs sent">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border bg-bg/50 px-4 py-6 text-center">
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-green-tint text-green-text"
          >
            <MessageSquare className="h-4 w-4" />
          </span>
          <p className="text-sm font-medium text-text-primary">
            No DMs sent yet
          </p>
          <p className="text-xs leading-relaxed text-text-muted">
            Your Welcome DM will land here after the first follow-back.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col">
          {items.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-2 py-2 text-sm"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-[11px] font-semibold text-text-secondary">
                {event.profilePic ? (
                  <img
                    src={event.profilePic}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  event.username.replace(/^@/, '').charAt(0).toUpperCase()
                )}
              </span>
              <span className="min-w-0 truncate font-medium text-text-primary">
                {event.username}
              </span>
              <span className="ml-auto shrink-0 text-xs text-text-muted">
                {formatRelativeTime(event.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </CollapsibleRecents>
  )
}

// Click-to-expand wrapper around the per-card "Recent" activity list.
// Default closed. Header is the eyebrow recipe (text-[11px] uppercase
// tracking-wide text-text-muted) so the closed state matches the
// existing section labels. Chevron rotates 180° when expanded.
// Duplicated inline in CloseFriendsCard.jsx — the ~15 lines aren't
// worth a shared module.
function CollapsibleRecents({ title, children }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="mt-3 border-t border-border pt-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-text-muted hover:text-text-secondary"
      >
        <span>{title}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="mt-2">{children}</div>}
    </div>
  )
}
