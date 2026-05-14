import { useEffect, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { useInstagramAudit } from '@/stores/useInstagramAudit'
import {
  isAuditAvailable,
  nextAuditAvailableIn,
} from '@/utils/auditCooldown'
import { useToasts } from '@/stores/useToasts'

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
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <CardChip color="blue" icon={FileText} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
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
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Generated weekly. Includes follower growth, top targets,
              and engagement rate.
            </p>
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
    </section>
  )
}
