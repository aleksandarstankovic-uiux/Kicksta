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
// Three states drive CTA + timer:
//   - never downloaded   → "Get Instagram Audit", no timer
//   - in cooldown        → "View audit" + "New audit in {N}h" timer
//                          below. View is always clickable; it opens
//                          the existing audit without changing the
//                          cooldown.
//   - post-cooldown      → "Get Instagram Audit" (back to generate),
//                          no timer
//
// Layout: chip on the left aligned to the top, title + subtitle
// stacked to its right (standard CardChip header pattern). CTA + timer
// stack on the right column on `md:+`, full-width below the title
// block on mobile.
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
  // to idle. The state then derives the new CTA from `inCooldown`.
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
      // the stored PDF. No cooldown change.
      addToast({ message: 'Audit opened.', tone: 'success' })
      return
    }
    setState('processing')
  }

  // Button label derived from state.
  let ctaLabel
  let showSpinner = false
  if (state === 'processing') {
    ctaLabel = 'Generating audit…'
    showSpinner = true
  } else if (inCooldown) {
    ctaLabel = 'View audit'
  } else {
    ctaLabel = 'Get Instagram Audit'
  }
  const ctaDisabled = state === 'processing'

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-6">
      <div className="flex flex-wrap items-start gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <CardChip color="blue" icon={FileText} />
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-text-primary">
              Instagram Audit
            </h2>
            <p className="mt-1 text-sm leading-relaxed text-text-secondary">
              Generated weekly. Includes follower growth, top targets,
              and engagement rate.
            </p>
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col items-stretch gap-1 md:w-auto md:items-end">
          <button
            type="button"
            onClick={handleClick}
            disabled={ctaDisabled}
            className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-blue-base px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
          >
            {showSpinner && (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            )}
            {ctaLabel}
          </button>
          {inCooldown && cooldownLabel && (
            <p className="text-xs text-text-muted md:text-right">
              New audit in {cooldownLabel}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
