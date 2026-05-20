import { useEffect, useState } from 'react'
import { ChevronRight, FileText, Loader2 } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { useInstagramAudit } from '@/stores/useInstagramAudit'
import {
  isAuditAvailable,
  nextAuditAvailableIn,
} from '@/utils/auditCooldown'
import { useToasts } from '@/stores/useToasts'
import { mockAuditTopStats } from '@/mocks/audit'

// Instagram Audit card — Overview page. Two states:
//
//   - Not yet generated: header is title-only; body holds the
//     descriptive paragraph + primary "Get Instagram Audit" button
//     below it. While generating, the same button flips to
//     "Generating audit…" + spinner and is disabled.
//
//   - Already generated (cooldown): header gets a small "View audit"
//     link top-right (chevron, blue-text) matching the Edit / View
//     all pattern other cards on the Overview use. Body becomes a
//     glance-value 3-stat strip.
//
// Header band uses `bg-bg/50` to match every other tinted-header
// card on the dashboard.
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
  // to idle. The card then re-renders into the generated state.
  useEffect(() => {
    if (state !== 'processing') return
    const id = setTimeout(() => {
      download()
      setState('idle')
    }, 1500)
    return () => clearTimeout(id)
  }, [state, download])

  function handleGenerate() {
    if (state !== 'idle') return
    setState('processing')
  }

  function handleViewAudit() {
    // V1: toast only — backend will open the stored PDF.
    addToast({ message: 'Audit opened.', tone: 'success' })
  }

  // Status pill — always rendered to keep layout stable.
  const pillClass = inCooldown
    ? 'bg-yellow-tint text-yellow-text'
    : 'bg-green-tint text-green-text'
  const pillDot = inCooldown ? 'bg-yellow-base' : 'bg-green-base'
  const pillLabel =
    inCooldown && cooldownLabel ? `Available in ${cooldownLabel}` : 'Available'

  return (
    <section className="flex flex-col rounded-xl border border-border bg-surface p-4 pb-3 lg:p-6">
      {/* Tinted header band. Hosts chip + title + status pill. When
          the audit has already been generated, a small "View audit"
          link sits in the top-right (Edit/View-all pattern). */}
      <div className="-mx-4 -mt-4 mb-4 rounded-t-xl border-b border-border bg-bg/50 px-4 py-4 lg:-mx-6 lg:-mt-6 lg:px-6">
        <div className="flex items-center justify-between gap-3">
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

          {hasDownloaded && (
            <button
              type="button"
              onClick={handleViewAudit}
              className="inline-flex items-center gap-1 text-sm font-medium text-blue-text transition-opacity hover:opacity-80"
            >
              View audit
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {hasDownloaded ? <GeneratedBody /> : <NotGeneratedBody state={state} onGenerate={handleGenerate} />}
    </section>
  )
}

function GeneratedBody() {
  // 3-stat strip — stacked on mobile with horizontal separators,
  // 3-up on sm:+ with vertical separators between columns. Same
  // pattern as GrowthPlusOverviewCard so the two cards read as
  // siblings in the 2-col Overview row.
  const stats = [
    mockAuditTopStats.reach7d,
    mockAuditTopStats.engagementRate,
    mockAuditTopStats.avgLikes,
  ]
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3">
      {stats.map((s, i, arr) => (
        <div
          key={s.label}
          className={[
            'py-2 sm:px-4 sm:py-0',
            i > 0 ? 'border-t border-border pt-3' : '',
            i > 0 ? 'sm:border-l sm:border-border sm:border-t-0 sm:pt-0' : '',
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
  )
}

function NotGeneratedBody({ state, onGenerate }) {
  const processing = state === 'processing'
  return (
    <div className="flex flex-col">
      <p className="text-sm leading-relaxed text-text-secondary">
        A weekly PDF snapshot of your account's growth from the last
        7 days. Track follower trends, top-performing targets, and
        engagement metrics over time.
      </p>
      <div className="mt-4">
        <button
          type="button"
          onClick={onGenerate}
          disabled={processing}
          className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-base px-4 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto md:min-w-[200px]"
        >
          {processing && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
          {processing ? 'Generating audit…' : 'Get Instagram Audit'}
        </button>
      </div>
    </div>
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
