import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import WelcomeDmModal from './WelcomeDmModal'
import WelcomeDmPreview from './WelcomeDmPreview'
import { formatRelativeTime } from '@/utils/formatRelativeTime'
import { mockWelcomeDmHistory } from '@/mocks/welcomeDmHistory'

// Welcome DM — auto-DM new followers once they follow back. Advanced
// plan only; locked-state for Growth users routes to the upgrade
// bottom sheet.
function isLocked(user) {
  return user.plan !== 'advanced'
}

export default function WelcomeDmCard({ onRequestUpgrade }) {
  const { config, toggleWelcomeDm } = useGrowthConfig()
  const [dmModalOpen, setDmModalOpen] = useState(false)

  const locked = isLocked(mockUser)
  const showPreview = config.welcomeDm.enabled && !locked

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <CardChip color="green" icon={MessageSquare} />
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">Welcome DM</h2>
          <InfoTooltip text="Send a one-time message when new followers follow back." />
        </div>
      </div>

      <div className="mt-2 flex flex-col">
        <SettingSwitch
          icon={MessageSquare}
          title="Welcome DM"
          description="Auto-DM new followers once they follow back."
          checked={config.welcomeDm.enabled}
          onChange={() => toggleWelcomeDm()}
          locked={locked}
          onLockedTap={() => onRequestUpgrade('welcome_dm')}
        />
        <WelcomeDmPreview
          enabled={showPreview}
          message={config.welcomeDm.message}
          onEdit={() => setDmModalOpen(true)}
        />
        {showPreview && <RecentDmsSubsection />}
      </div>

      <WelcomeDmModal open={dmModalOpen} onClose={() => setDmModalOpen(false)} />
    </section>
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
