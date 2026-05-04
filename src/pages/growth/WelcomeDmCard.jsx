import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import WelcomeDmModal from './WelcomeDmModal'
import WelcomeDmPreview from './WelcomeDmPreview'

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
      </div>

      <WelcomeDmModal open={dmModalOpen} onClose={() => setDmModalOpen(false)} />
    </section>
  )
}
