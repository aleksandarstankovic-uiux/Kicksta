import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
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

  const locked = isLocked(mockUser)
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
  const items = mockWelcomeDmHistory.slice(0, 5)
  return (
    <div className="mt-3 border-t border-border pt-3">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        Recent DMs sent
      </p>
      {items.length === 0 ? (
        <p className="py-3 text-center text-xs text-text-muted">
          No DMs sent yet — check back after your first follow-back.
        </p>
      ) : (
        <ul className="mt-2 flex flex-col">
          {items.map((event) => (
            <li
              key={event.id}
              className="flex items-center gap-2 py-2 text-sm"
            >
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg text-[11px] font-semibold text-text-secondary">
                {event.username.replace(/^@/, '').charAt(0).toUpperCase()}
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
    </div>
  )
}
