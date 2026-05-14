# Instagram Audit Card — Design

## Goal

Add an Instagram Audit affordance to the Overview page: a self-contained card that lets the user download a weekly PDF snapshot of their account's growth. Available once every 24 hours; the card communicates its cooldown state honestly through the CTA label itself.

## Architecture overview

One presentational component (`InstagramAuditCard`) + one Zustand store (`useInstagramAudit`) holding the last-download timestamp + two pure date helpers. Click flow mirrors the existing modal-style processing pattern (1500ms `Generating audit…` spinner state, then toast confirmation). V1 doesn't produce a real PDF — the success toast simulates the download. Real PDF generation is backend work.

## Placement

The Overview page's bottom block currently renders, in order:
1. Header + trial pill + period switcher
2. (Conditional) Trial banner
3. AccountCard
4. 3 metric cards
5. (Conditional) Warming-up / Disconnected banner
6. GrowthChart + ActivityFeed (2-col on lg:+)
7. Bottom 2-col block (`TargetsOverview` left, `TargetingSettings + EngagementSnapshot` stacked right)

`InstagramAuditCard` lands as a full-width row between #6 and #7. Adjacency with the chart is intentional — the audit is the chart's "save as PDF" partner. Doesn't push the snapshots/targets further down; doesn't disrupt the existing 2-col rhythm of either neighbor.

```jsx
{/* growthChart + activity row */}
<div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
  <GrowthChart ... />
  <ActivityFeed ... />
</div>

{/* NEW: Instagram Audit */}
<div className="mt-4">
  <InstagramAuditCard />
</div>

{/* bottom 2-col block — TargetsOverview + snapshots */}
<div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
  <TargetsOverview ... />
  <div className="flex flex-col gap-4">
    <TargetingSettingsSnapshot />
    <EngagementSnapshot />
  </div>
</div>
```

## Component anatomy

```
┌───────────────────────────────────────────────────────────────┐
│ [FileText chip]  Instagram Audit       [Get Instagram Audit] │  ← title row
│                  Generated weekly. Includes follower growth,  │  ← body
│                  top targets, and engagement rate.            │
│                  Last download: 3h ago.                       │  ← cooldown line (conditional)
└───────────────────────────────────────────────────────────────┘
```

**Title row** (left side): `CardChip` (blue, `FileText`) + `<h2>Instagram Audit</h2>`.
**Title row** (right side): the CTA button. On `lg:+` it sits inline with the title; on mobile it wraps below the body.
**Body:** static one-liner — `"Generated weekly. Includes follower growth, top targets, and engagement rate."`
**Cooldown line:** only renders when `lastDownloadedAt` is non-null. Shows `"Last download: 3h ago."` using a relative-time formatter (reuse existing `formatRelativeTime` from `src/utils/formatRelativeTime.js`).

### CTA states

| State | Label | Disabled | Spinner |
|---|---|---|---|
| Available (first time or >24h since last download) | `Get Instagram Audit` | no | no |
| In cooldown | `Available in {N}h` (or `{N} min` near the boundary) | yes | no |
| Processing (during the 1500ms simulated generation) | `Generating audit…` | yes | yes (Loader2) |

CTA styling: same recipe as the snapshot card's "Edit →" — `inline-flex items-center gap-1.5 text-sm font-medium`. **Difference**: this CTA is action-weight, not navigation, so it renders as a proper button with `bg-blue-base text-white px-4 h-10 rounded-lg` (matching the existing Add-target / Upgrade-plan button recipe). Disabled state: `opacity-60 cursor-not-allowed`.

Spinner state replaces the label inline: `<Loader2 className="h-4 w-4 animate-spin" /> Generating audit…`.

### Layout on small screens

On `<md:` viewports, the title row wraps:
- Row 1: chip + title (left), no CTA
- Row 2: body
- Row 3: cooldown line (when applicable)
- Row 4: CTA full-width button

On `md:+` the CTA sits inline with the title row (right-aligned, `shrink-0`), body below.

This is achievable via a flex layout that wraps:

```jsx
<div className="flex flex-wrap items-center gap-3">
  <div className="flex min-w-0 flex-1 items-center gap-3">
    <CardChip color="blue" icon={FileText} />
    <h2 className="text-base font-semibold text-text-primary">Instagram Audit</h2>
  </div>
  <Cta state={...} onClick={...} className="w-full md:w-auto" />
</div>
<p className="mt-2 text-sm leading-relaxed text-text-secondary">
  Generated weekly. Includes follower growth, top targets, and engagement rate.
</p>
{lastDownloadedAt && (
  <p className="mt-1 text-xs text-text-muted">
    Last download: {formatRelativeTime(lastDownloadedAt)}.
  </p>
)}
```

## Store

`src/stores/useInstagramAudit.js`:

```jsx
import { create } from 'zustand'
import { useToasts } from '@/stores/useToasts'

// V1 mock for the Instagram Audit feature. Tracks the last download
// timestamp so the card can compute cooldown state. Backend will own
// this state in production — the store goes away.
//
// `download()` stamps the current time, fires a toast, and assumes
// the consumer has already played its 1500ms "generating" UI before
// calling. Real PDF generation is backend work.
export const useInstagramAudit = create((set) => ({
  lastDownloadedAt: null,
  download: () => {
    set({ lastDownloadedAt: new Date().toISOString() })
    useToasts.getState().addToast({
      message: 'Audit downloaded.',
      tone: 'success',
    })
  },
  // QA helper — flips back to "available" so the cooldown UI can
  // be tested without waiting 24h. Not exposed via UI.
  _reset: () => set({ lastDownloadedAt: null }),
}))
```

## Helpers

`src/utils/auditCooldown.js`:

```jsx
const COOLDOWN_MS = 24 * 60 * 60 * 1000

export function isAuditAvailable(lastDownloadedAt) {
  if (!lastDownloadedAt) return true
  const elapsed = Date.now() - new Date(lastDownloadedAt).getTime()
  return elapsed >= COOLDOWN_MS
}

// Returns a short human label like "21h" or "45 min" for the
// remaining cooldown. Returns null when the audit is available.
export function nextAuditAvailableIn(lastDownloadedAt) {
  if (!lastDownloadedAt) return null
  const remaining = COOLDOWN_MS - (Date.now() - new Date(lastDownloadedAt).getTime())
  if (remaining <= 0) return null
  const minutes = Math.ceil(remaining / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.ceil(minutes / 60)
  return `${hours}h`
}
```

`nextAuditAvailableIn` returns text like `21h`, not `21 hours`, to keep the CTA label compact. Below 60 minutes it shifts to `45 min` so the timer reads meaningfully near the boundary.

## Click flow

```jsx
const [state, setState] = useState('idle')
const lastDownloadedAt = useInstagramAudit((s) => s.lastDownloadedAt)
const download = useInstagramAudit((s) => s.download)

const available = isAuditAvailable(lastDownloadedAt)
const cooldownLabel = nextAuditAvailableIn(lastDownloadedAt)

function handleClick() {
  if (!available || state !== 'idle') return
  setState('processing')
}

useEffect(() => {
  if (state !== 'processing') return
  const id = setTimeout(() => {
    download()
    setState('idle')
  }, 1500)
  return () => clearTimeout(id)
}, [state, download])
```

Sequence:
1. User clicks the enabled CTA.
2. `state` flips to `processing`; CTA shows spinner + `Generating audit…`.
3. After 1500ms: `download()` runs (stamps `lastDownloadedAt`, fires the toast), `state` returns to `idle`.
4. Next render: `available` is now `false` (we just stamped), CTA renders the cooldown label.

## File map

**New:**
- `src/components/InstagramAuditCard.jsx` — presentational card. Reads `useInstagramAudit`, owns the local `state` machine.
- `src/stores/useInstagramAudit.js` — Zustand store.
- `src/utils/auditCooldown.js` — `isAuditAvailable` + `nextAuditAvailableIn` helpers.

**Modified:**
- `src/pages/overview/index.jsx` — import `InstagramAuditCard`, render it in a new `<div className="mt-4">` row between the chart-row block and the bottom 2-col block.

## Decisions locked (don't revisit)

- **Cooldown is 24h.** Single source of truth: `COOLDOWN_MS` constant in `src/utils/auditCooldown.js`.
- **CTA label encodes the state.** No separate cooldown pill. When the card is unavailable, the button reads `Available in 14h` (or `45 min` near the boundary) and is disabled.
- **No PDF in V1.** Click triggers the spinner + toast only. Real PDF generation ships with backend; the store's `download()` action will be extended to call the real endpoint.
- **No audit history list.** Just the latest cooldown stamp. Multi-download history is out of scope.
- **No per-account audit selection.** The audit covers the active account (from `useAccounts.activeId`). The card itself doesn't surface the account name — the page header already shows it.
- **Card sits between chart-row and bottom block.** Not in the right column, not at the bottom of the page. Placement is locked.
- **Title row carries the CTA on `md:+`.** On mobile the CTA wraps below the body and goes full-width — same responsive treatment as the snapshot cards' Edit links, just with a button instead of a text link.

## Out of scope

- Real PDF generation
- Audit history list / re-download earlier audits
- Per-account audit selection (multi-account)
- Audit content customization (date range, sections)
- Email delivery of the audit
- Notifications when a new audit becomes available
- Visual mockup of the actual PDF
