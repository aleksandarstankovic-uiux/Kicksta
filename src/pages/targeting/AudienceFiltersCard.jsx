import { Lightbulb, Pencil, SlidersHorizontal, User, Users } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import { formatCount } from '@/utils/formatCount'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import AudienceReachEstimate from './AudienceReachEstimate'

function rangeFor(min, max, noun) {
  if ((min === 0 || min == null) && max == null) return 'Any'
  if (min === 0 || min == null) return `Up to ${formatCount(max)} ${noun}`
  if (max == null) return `${formatCount(min)}+ ${noun}`
  return `${formatCount(min)}–${formatCount(max)} ${noun}`
}

function privacyLabel(value) {
  if (value === 'public') return 'Public only'
  if (value === 'private') return 'Private only'
  return 'All'
}

function genderLabel(value) {
  if (value === 'male') return 'Male only'
  if (value === 'female') return 'Female only'
  return 'All'
}

function Row({ label, value, locked = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-sm text-text-secondary">{label}</span>
        {locked && (
          <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
            Advanced
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  )
}

function GroupHeader({ icon: Icon, children }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {children}
      </p>
    </div>
  )
}

export default function AudienceFiltersCard({ onEdit }) {
  const filters = useGrowthConfig((s) => s.config.filters)
  const genderLocked = mockUser.plan !== 'advanced'

  return (
    <section className="rounded-xl border border-border bg-surface p-4 pb-3 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <CardChip color="yellow" icon={SlidersHorizontal} />
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">Audience filters</h2>
            <InfoTooltip text="Who Kicksta is allowed to interact with." />
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2 lg:gap-6 lg:divide-x lg:divide-border">
        <div className="lg:pr-6">
          <GroupHeader icon={Users}>Audience size</GroupHeader>
          <div className="mt-1 flex flex-col divide-y divide-border">
            <Row
              label="Following count"
              value={rangeFor(filters.followingMin, filters.followingMax, 'following')}
            />
            <Row
              label="Follower count"
              value={rangeFor(filters.followerMin, filters.followerMax, 'followers')}
            />
            <Row
              label="Media count"
              value={rangeFor(filters.mediaMin, filters.mediaMax, 'posts')}
            />
          </div>
        </div>
        <div>
          <GroupHeader icon={User}>Account type</GroupHeader>
          <div className="mt-1 flex flex-col divide-y divide-border">
            <Row label="Account privacy" value={privacyLabel(filters.accountPrivacy)} />
            <Row
              label="Gender target"
              value={genderLabel(filters.genderTarget)}
              locked={genderLocked}
            />
            <Row label="Exclude NSFW" value={filters.excludeNsfw ? 'On' : 'Off'} />
          </div>
        </div>
      </div>

      <AudienceReachEstimate />

      <div className="mt-3 flex items-start gap-2 text-xs text-text-muted">
        <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-yellow-base" aria-hidden="true" />
        <span>
          Tip — tighter following ranges (under 1K) tend to find more engaged accounts.
        </span>
      </div>
    </section>
  )
}
