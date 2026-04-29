import { Pencil, User } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useUserProfile } from '@/stores/useUserProfile'

function countryCodeFor(country) {
  return { US: '1', GB: '44', DE: '49', FR: '33', AU: '61' }[country] ?? '1'
}

function fireOpen(event) {
  window.dispatchEvent(new CustomEvent(event))
}

// One row inside a section. All edits open a modal — no inline
// editing anywhere.
function Row({ label, value, onEdit }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-b-0">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-text-secondary">{label}</span>
        <span className="text-sm text-text-primary">{value}</span>
      </div>
      <button
        onClick={onEdit}
        className="inline-flex h-10 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-blue-text hover:bg-bg"
      >
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
    </div>
  )
}

export default function ProfilePanel() {
  const profile = useUserProfile()

  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || '—'
  const phoneDisplay = profile.phoneNumber
    ? `+${countryCodeFor(profile.phoneCountry)} ${profile.phoneNumber}`
    : 'Not set'

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <CardChip color="blue" icon={User} />
        <h2 className="text-base font-semibold text-text-primary">Profile</h2>
        <InfoTooltip text="Identity, contact info, and login credentials for your Kicksta account." />
      </div>

      {/* Personal info section */}
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Personal info
        </p>
        <div className="mt-2 flex flex-col">
          <Row label="Name" value={fullName} onEdit={() => fireOpen('open-edit-name-modal')} />
          <Row label="Email" value={profile.email} onEdit={() => fireOpen('open-edit-email-modal')} />
          <Row label="Phone number" value={phoneDisplay} onEdit={() => fireOpen('open-edit-phone-modal')} />
        </div>
      </div>

      {/* Security section */}
      <div className="mt-6 border-t border-border pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Security
        </p>
        <div className="mt-2 flex flex-col">
          <Row label="Password" value="••••••••" onEdit={() => fireOpen('open-password-modal')} />
        </div>
      </div>
    </div>
  )
}
