import { useState } from 'react'
import { Pencil, X, Check, User, Lock, Bell } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useUserProfile } from '@/stores/useUserProfile'

// One inline-editable row. Display mode shows label + value + Edit
// link; edit mode renders the supplied <inputs> + Save/Cancel.
function Row({ label, displayValue, isEditing, onEdit, onCancel, onSave, children, hint }) {
  return (
    <div className="border-b border-border py-4 first:pt-0 last:border-b-0 last:pb-0">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:gap-6">
        <div className="text-sm font-medium text-text-secondary lg:w-32 lg:shrink-0">{label}</div>
        <div className="flex-1">
          {isEditing ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2">{children}</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onSave}
                  className="inline-flex h-10 items-center gap-1 rounded-lg bg-blue-base px-3 text-sm font-medium text-white hover:opacity-90"
                >
                  <Check className="h-4 w-4" /> Save
                </button>
                <button
                  onClick={onCancel}
                  className="inline-flex h-10 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-bg"
                >
                  <X className="h-4 w-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-4">
              <div className="text-sm text-text-primary">{displayValue}</div>
              {onEdit && (
                <button
                  onClick={onEdit}
                  className="inline-flex h-10 shrink-0 items-center gap-1 rounded-md px-2 text-sm font-medium text-blue-text hover:bg-bg"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
              )}
            </div>
          )}
          {hint && <p className="mt-2 text-xs text-text-muted">{hint}</p>}
        </div>
      </div>
    </div>
  )
}

function SectionCard({ chipColor, icon, title, tooltip, children }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
      <div className="flex items-center gap-2 pb-2">
        <CardChip color={chipColor} icon={icon} />
        <h2 className="text-base font-semibold text-text-primary">{title}</h2>
        <InfoTooltip text={tooltip} />
      </div>
      <div>{children}</div>
    </div>
  )
}

export default function ProfilePanel() {
  const profile = useUserProfile()
  const [editing, setEditing] = useState(null) // 'name' | 'email' | 'phone' | null

  // Local draft state per editable row.
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [email, setEmail] = useState(profile.email)
  const [phoneCountry, setPhoneCountry] = useState(profile.phoneCountry)
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? '')
  const [emailError, setEmailError] = useState('')

  function startEdit(row) {
    setFirstName(profile.firstName)
    setLastName(profile.lastName)
    setEmail(profile.email)
    setPhoneCountry(profile.phoneCountry)
    setPhoneNumber(profile.phoneNumber ?? '')
    setEmailError('')
    setEditing(row)
  }

  function cancelEdit() {
    setEditing(null)
    setEmailError('')
  }

  function saveName() {
    if (!firstName.trim()) return
    profile.setName({ firstName, lastName })
    setEditing(null)
  }

  function saveEmail() {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Enter a valid email address.')
      return
    }
    profile.setEmail(email)
    setEditing(null)
  }

  function savePhone() {
    profile.setPhone({ country: phoneCountry, number: phoneNumber })
    setEditing(null)
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Personal info — name, email, phone */}
      <SectionCard
        chipColor="blue"
        icon={User}
        title="Personal info"
        tooltip="How we identify you and reach you about the account. Edits propagate everywhere your name and contact details appear."
      >
        <Row
          label="Name"
          displayValue={`${profile.firstName} ${profile.lastName}`.trim() || '—'}
          isEditing={editing === 'name'}
          onEdit={() => startEdit('name')}
          onCancel={cancelEdit}
          onSave={saveName}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="First name"
              className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-base focus:outline-none"
            />
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder="Last name"
              className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-base focus:outline-none"
            />
          </div>
        </Row>

        <Row
          label="Email"
          displayValue={profile.email}
          isEditing={editing === 'email'}
          onEdit={() => startEdit('email')}
          onCancel={cancelEdit}
          onSave={saveEmail}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              setEmailError('')
            }}
            className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-base focus:outline-none"
          />
          {emailError && <p className="text-xs text-red-text" role="alert">{emailError}</p>}
        </Row>

        <Row
          label="Phone number"
          displayValue={
            profile.phoneNumber
              ? `+${countryCodeFor(profile.phoneCountry)} ${profile.phoneNumber}`
              : <span className="text-text-muted">Add phone number</span>
          }
          isEditing={editing === 'phone'}
          onEdit={() => startEdit('phone')}
          onCancel={cancelEdit}
          onSave={savePhone}
        >
          <div className="flex gap-2">
            <select
              value={phoneCountry}
              onChange={(e) => setPhoneCountry(e.target.value)}
              className="h-10 rounded-lg border border-border bg-surface px-2 text-sm text-text-primary focus:border-blue-base focus:outline-none"
            >
              <option value="US">US +1</option>
              <option value="GB">GB +44</option>
              <option value="DE">DE +49</option>
              <option value="FR">FR +33</option>
              <option value="AU">AU +61</option>
            </select>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="555 123 4567"
              className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary placeholder:text-text-muted focus:border-blue-base focus:outline-none"
            />
          </div>
        </Row>
      </SectionCard>

      {/* Security — password, future 2FA/sessions */}
      <SectionCard
        chipColor="yellow"
        icon={Lock}
        title="Security"
        tooltip="Credentials and login protection for your Kicksta account. Two-factor and session management land here next."
      >
        <Row
          label="Password"
          displayValue="••••••••"
          isEditing={false}
          onEdit={() => window.dispatchEvent(new CustomEvent('open-password-modal'))}
        />
      </SectionCard>

      {/* Communication preferences */}
      <SectionCard
        chipColor="green"
        icon={Bell}
        title="Communication"
        tooltip="Where we send billing alerts, security notifications, and account updates."
      >
        <div className="flex flex-col gap-2">
          <CommToggle
            checked={profile.commPrefs.email}
            onChange={(on) => profile.setCommPref('email', on)}
            label="Email"
          />
          <CommToggle
            checked={profile.commPrefs.sms}
            onChange={(on) => profile.setCommPref('sms', on)}
            label="SMS"
            disabled={!profile.phoneNumber}
            disabledHint="Add a phone number to enable SMS"
          />
        </div>
        <p className="mt-3 text-xs text-text-muted">
          Marketing emails are managed{' '}
          <button
            type="button"
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent('open-marketing-prefs', { detail: { source: 'profile' } }),
              )
            }
            className="font-medium text-blue-text hover:underline"
          >
            separately
          </button>
          .
        </p>
      </SectionCard>
    </div>
  )
}

function CommToggle({ checked, onChange, label, disabled, disabledHint }) {
  return (
    <label className={`flex items-center gap-2 ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="h-4 w-4 rounded border-border text-blue-base focus:ring-blue-base"
      />
      <span className="text-sm text-text-primary">{label}</span>
      {disabled && disabledHint && (
        <span className="text-xs text-text-muted">— {disabledHint}</span>
      )}
    </label>
  )
}

function countryCodeFor(country) {
  return { US: '1', GB: '44', DE: '49', FR: '33', AU: '61' }[country] ?? '1'
}
