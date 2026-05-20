import { useEffect, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { useInstagramAudit } from '@/stores/useInstagramAudit'
import {
  isAuditAvailable,
  nextAuditAvailableIn,
} from '@/utils/auditCooldown'
import { useToasts } from '@/stores/useToasts'
import { mockAuditTopStats } from '@/mocks/audit'

// Instagram Audit card — single-CTA component on the Overview page.
//
// CTA copy + color encode the action:
//   - "Get Instagram Audit"  → blue-base / white (primary generate)
//   - "Generating audit…"    → blue-base / white + spinner (disabled)
//   - "View audit"           → blue-tint / blue-text (secondary view
//                              of existing audit; doesn't change
//                              cooldown)
//
// Availability is communicated by a pill next to the title — always
// rendered so the card's footprint doesn't shift between states:
//   - available  → green-tint "Available"
//   - cooldown   → yellow-tint "Available in {N}h"
//
// CTA has a min-width on `md:+` so swapping labels between
// generate ↔ view doesn't reflow the right column.
export default function InstagramAuditCard() {
  const lastDownloadedAt = useInstagramAudit((s) => s.lastDownloadedAt)
  const download = useInstagramAudit((s) => s.download)
  const addToast = useToasts((s) => s.addToast)
  const [state, setState] = useState('idle')

  const available = isAuditAvailable(lastDownloadedAt)
  const hasDownloaded = !!lastDownloadedAt
  const inCooldown = hasDownloaded && !available
  const cooldownLabel = nextAuditAvailableIn(lastDownloadedAt)

  // Run the 1500ms simulated generation, then commit the download
  // (stamps timestamp + fires "Audit downloaded." toast) and return
  // to idle. CTA then derives from `inCooldown` on next render.
  useEffect(() => {
    if (state !== 'processing') return
    const id = setTimeout(() => {
      download()
      setState('idle')
    }, 1500)
    return () => clearTimeout(id)
  }, [state, download])

  function handleClick() {
    if (state !== 'idle') return
    if (inCooldown) {
      // View existing audit — toast only in V1; backend will open
      // the stored PDF. Cooldown unchanged.
      addToast({ message: 'Audit opened.', tone: 'success' })
      return
    }
    setState('processing')
  }

  // CTA props derived from state.
  let ctaLabel
  let ctaColor
  let showSpinner = false
  if (state === 'processing') {
    ctaLabel = 'Generating audit…'
    ctaColor = 'bg-blue-base text-white'
    showSpinner = true
  } else if (inCooldown) {
    ctaLabel = 'View audit'
    ctaColor = 'bg-blue-tint text-blue-text hover:bg-blue-tint/70'
  } else {
    ctaLabel = 'Get Instagram Audit'
    ctaColor = 'bg-blue-base text-white hover:opacity-90'
  }
  const ctaDisabled = state === 'processing'

  // Pill — always rendered to keep layout stable.
  const pillClass = inCooldown
    ? 'bg-yellow-tint text-yellow-text'
    : 'bg-green-tint text-green-text'
  const pillDot = inCooldown ? 'bg-yellow-base' : 'bg-green-base'
  const pillLabel =
    inCooldown && cooldownLabel ? `Available in ${cooldownLabel}` : 'Available'

  return (
    <section className="rounded-xl border border-border bg-surface p-4 pb-3 lg:p-6">
      {/* Tinted header band — same recipe as every other card on the
          Overview. Hosts chip + title + status pill + CTA. Subtitle
          drops to the body below so the band stays compact. */}
      <div className="-mx-4 -mt-4 mb-4 rounded-t-xl border-b border-border bg-bg/50 px-4 py-4 lg:-mx-6 lg:-mt-6 lg:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <CardChip color="blue" icon={FileText} />
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold text-text-primary">
                Instagram Audit
              </h2>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${pillClass}`}
              >
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-full ${pillDot}`}
                />
                {pillLabel}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleClick}
            disabled={ctaDisabled}
            className={`inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:min-w-[200px] ${ctaColor}`}
          >
            {showSpinner && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {ctaLabel}
          </button>
        </div>
      </div>

      {/* Body — descriptive paragraph until the user has generated
          their first audit. Once an audit exists (inCooldown), the
          card flips to a glance-value data surface showing the top
          three numbers from the latest run. The full PDF stays
          behind the "View audit" CTA in the header either way. */}
      {hasDownloaded ? (
        // Stat strip — stacked on mobile with horizontal separators
        // between rows, 3-up on sm:+ with vertical separators between
        // columns. Same separator pattern as GrowthPlusOverviewCard
        // so the two surfaces read as siblings.
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {[
            mockAuditTopStats.reach7d,
            mockAuditTopStats.engagementRate,
            mockAuditTopStats.avgLikes,
          ].map((s, i, arr) => (
            <div
              key={s.label}
              className={[
                'px-0 py-2 sm:px-4 sm:py-0',
                // Mobile: horizontal separator between rows
                i > 0 ? 'border-t border-border pt-3' : '',
                // Desktop: vertical separator on every cell except first
                i > 0 ? 'sm:border-l sm:border-border' : '',
                // Desktop: kill the mobile horizontal separator + extra padding
                i > 0 ? 'sm:border-t-0 sm:pt-0' : '',
                // Trim outer padding so the strip aligns with the card edges
                i === 0 ? 'sm:pl-0' : '',
                i === arr.length - 1 ? 'sm:pr-0' : '',
              ]
                .filter(Boolean)
                .join(' ')}
            >
              <AuditStat stat={s} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-text-secondary">
          A weekly PDF snapshot of your account's growth from the last
          7 days. Track follower trends, top-performing targets, and
          engagement metrics over time.
        </p>
      )}
    </section>
  )
}

const DELTA_TONE_CLASS = {
  up: 'text-green-text',
  down: 'text-red-text',
  flat: 'text-text-muted',
}

function AuditStat({ stat }) {
  if (!stat) return null
  return (
    <div className="min-w-0">
      <p className="truncate text-xs font-medium text-text-muted">
        {stat.label}
      </p>
      <div className="mt-1 flex items-baseline gap-2">
        <p className="text-xl font-semibold text-text-primary lg:text-2xl">
          {stat.value}
        </p>
        {stat.delta && (
          <span
            className={`text-xs font-medium ${DELTA_TONE_CLASS[stat.deltaTone] ?? 'text-text-muted'}`}
          >
            {stat.delta}
          </span>
        )}
      </div>
    </div>
  )
}
