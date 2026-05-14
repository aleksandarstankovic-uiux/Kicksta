import { useEffect, useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { useInstagramAudit } from '@/stores/useInstagramAudit'
import {
  isAuditAvailable,
  nextAuditAvailableIn,
} from '@/utils/auditCooldown'
import { formatRelativeTime } from '@/utils/formatRelativeTime'

// Instagram Audit card — single-CTA component that downloads a PDF
// snapshot of the last 7 days of growth, gated by a 24h cooldown.
//
// CTA label encodes the state. Three states drive three labels:
//   - 'idle'       → "Get Instagram Audit" (enabled when available)
//                  → "Available in 14h"    (disabled when in cooldown)
//   - 'processing' → "Generating audit…" with a spinner (always
//                    disabled during the 1500ms simulated generation)
//
// On `md:+` the CTA sits inline with the title (right slot). On
// mobile (`<md:`) the CTA wraps below the body as a full-width
// button — same responsive pattern as the snapshot cards' Edit
// links but with a real button instead of a text link.
export default function InstagramAuditCard() {
  const lastDownloadedAt = useInstagramAudit((s) => s.lastDownloadedAt)
  const download = useInstagramAudit((s) => s.download)
  const [state, setState] = useState('idle')

  const available = isAuditAvailable(lastDownloadedAt)
  const cooldownLabel = nextAuditAvailableIn(lastDownloadedAt)

  // Run the 1500ms simulated generation, then commit the download to
  // the store (which fires the toast) and return to idle.
  useEffect(() => {
    if (state !== 'processing') return
    const id = setTimeout(() => {
      download()
      setState('idle')
    }, 1500)
    return () => clearTimeout(id)
  }, [state, download])

  function handleClick() {
    if (!available || state !== 'idle') return
    setState('processing')
  }

  // Button label + classes derived from state.
  let ctaLabel
  let ctaDisabled
  let showSpinner = false
  if (state === 'processing') {
    ctaLabel = 'Generating audit…'
    ctaDisabled = true
    showSpinner = true
  } else if (available) {
    ctaLabel = 'Get Instagram Audit'
    ctaDisabled = false
  } else {
    ctaLabel = `Available in ${cooldownLabel}`
    ctaDisabled = true
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <CardChip color="blue" icon={FileText} />
          <h2 className="text-base font-semibold text-text-primary">
            Instagram Audit
          </h2>
        </div>
        <button
          type="button"
          onClick={handleClick}
          disabled={ctaDisabled}
          className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-blue-base px-4 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 md:w-auto"
        >
          {showSpinner && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          {ctaLabel}
        </button>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-text-secondary">
        Generated weekly. Includes follower growth, top targets, and
        engagement rate.
      </p>

      {lastDownloadedAt && (
        <p className="mt-1 text-xs text-text-muted">
          Last download: {formatRelativeTime(lastDownloadedAt)}.
        </p>
      )}
    </section>
  )
}
