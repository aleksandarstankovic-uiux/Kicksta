# Instagram Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship the Instagram Audit card on the Overview page — a single-CTA component that downloads a weekly PDF snapshot of growth, with a 24h cooldown communicated through the CTA label itself.

**Architecture:** One presentational component (`InstagramAuditCard`) reads a small Zustand store (`useInstagramAudit`) that tracks the last-download timestamp. Two pure date helpers compute availability + the human-readable countdown label. Click triggers a 1500ms `Generating audit…` spinner, then a toast and a state stamp. No real PDF in V1 — backend will own the actual download endpoint.

**Tech Stack:** React 19, Zustand 5, Tailwind v4, Lucide React. No test runner — each task verifies via `npm run build` + manual UI check.

**Spec:** `docs/superpowers/specs/2026-05-13-instagram-audit-design.md`

---

## File map

**New:**
- `src/utils/auditCooldown.js` — `isAuditAvailable(iso)` + `nextAuditAvailableIn(iso)` pure helpers
- `src/stores/useInstagramAudit.js` — Zustand store with `lastDownloadedAt` + `download()` + `_reset()`
- `src/components/InstagramAuditCard.jsx` — full card with title row, body, conditional cooldown line, state-driven CTA

**Modified:**
- `src/pages/overview/index.jsx` — import `InstagramAuditCard`, render in a new `<div className="mt-4">` row between the chart-row block and the bottom 2-col block

---

### Task 1: Cooldown helpers

**Files:**
- Create: `src/utils/auditCooldown.js`

- [ ] **Step 1: Create the helper file**

```jsx
// Time math for the Instagram Audit 24h cooldown. Pure functions —
// no React, no store access. Consumed by InstagramAuditCard and any
// future surface that needs to surface audit availability.

const COOLDOWN_MS = 24 * 60 * 60 * 1000

// True when no audit has been downloaded yet OR when the 24h window
// since the last download has elapsed.
export function isAuditAvailable(lastDownloadedAt) {
  if (!lastDownloadedAt) return true
  const elapsed = Date.now() - new Date(lastDownloadedAt).getTime()
  return elapsed >= COOLDOWN_MS
}

// Short human label for the remaining cooldown — "21h" most of the
// time, "45 min" near the boundary. Returns null when the audit is
// available (no countdown to render).
export function nextAuditAvailableIn(lastDownloadedAt) {
  if (!lastDownloadedAt) return null
  const remaining =
    COOLDOWN_MS - (Date.now() - new Date(lastDownloadedAt).getTime())
  if (remaining <= 0) return null
  const minutes = Math.ceil(remaining / 60000)
  if (minutes < 60) return `${minutes} min`
  const hours = Math.ceil(minutes / 60)
  return `${hours}h`
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS (helpers are self-contained — no consumers yet)

- [ ] **Step 3: Commit**

```bash
git add src/utils/auditCooldown.js
git commit -m "feat(audit): add cooldown helpers (isAuditAvailable + nextAuditAvailableIn)"
```

---

### Task 2: Instagram Audit store

**Files:**
- Create: `src/stores/useInstagramAudit.js`

- [ ] **Step 1: Create the store file**

```jsx
import { create } from 'zustand'
import { useToasts } from '@/stores/useToasts'

// V1 mock for the Instagram Audit feature. Tracks the last download
// timestamp so the card can compute cooldown state. Backend will own
// this state in production — the store goes away.
//
// `download()` stamps the current time and fires a toast. Assumes
// the consumer has already played its 1500ms "Generating audit…" UI
// before calling. Real PDF generation is backend work.
//
// `_reset()` is a QA helper that flips the store back to the
// "never downloaded" state so the cooldown UI can be exercised
// without waiting 24h. Not exposed via UI.
export const useInstagramAudit = create((set) => ({
  lastDownloadedAt: null,
  download: () => {
    set({ lastDownloadedAt: new Date().toISOString() })
    useToasts.getState().addToast({
      message: 'Audit downloaded.',
      tone: 'success',
    })
  },
  _reset: () => set({ lastDownloadedAt: null }),
}))
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/stores/useInstagramAudit.js
git commit -m "feat(audit): add useInstagramAudit store"
```

---

### Task 3: `InstagramAuditCard` component

**Files:**
- Create: `src/components/InstagramAuditCard.jsx`

- [ ] **Step 1: Create the component file**

```jsx
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
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/components/InstagramAuditCard.jsx
git commit -m "feat(audit): add InstagramAuditCard component"
```

---

### Task 4: Wire the card into Overview

**Files:**
- Modify: `src/pages/overview/index.jsx`

- [ ] **Step 1: Add the import**

Open `src/pages/overview/index.jsx`. Near the existing component imports (the block that already contains `import TargetingSettingsSnapshot from './TargetingSettingsSnapshot'` and `import EngagementSnapshot from './EngagementSnapshot'`), add:

```jsx
import InstagramAuditCard from '@/components/InstagramAuditCard'
```

The path is `@/components/...` (not `./...`) because the audit card is general-purpose, not Overview-specific, and lives under `src/components/` per the spec's file map.

- [ ] **Step 2: Insert the new row between the chart row and the bottom 2-col block**

Find the existing chart + activity row:

```jsx
<div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,3fr)]">
  <GrowthChart
    ...
  />
  <div className="lg:relative">
    <div className="lg:absolute lg:inset-0">
      <ActivityFeed items={mockActivity} period={effectivePeriod} />
    </div>
  </div>
</div>
```

Immediately AFTER its closing `</div>`, and BEFORE the bottom 2-col block (the one starting with `{/* Bottom block — single 2-col row.`), insert:

```jsx
{/* Instagram Audit — full-width row between the chart and the
    bottom 2-col block. Adjacency with the chart is deliberate:
    the audit is a PDF snapshot of the same growth data the chart
    just rendered on screen. */}
<div className="mt-4">
  <InstagramAuditCard />
</div>
```

- [ ] **Step 3: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 4: Manual verification**

Run: `npm run dev` and open `/`.

1. The Overview page renders the audit card as a full-width row between the GrowthChart/ActivityFeed row and the bottom 2-col block. No layout shift on other rows.
2. The card shows a blue `FileText` chip, "Instagram Audit" title, body copy "Generated weekly. Includes follower growth, top targets, and engagement rate.", and the **Get Instagram Audit** button on the right (or below on mobile).
3. No "Last download:" line appears on first visit (lastDownloadedAt is null).
4. Click the button. The label flips to "Generating audit…" with a spinner. After ~1500ms, a toast "Audit downloaded." appears in the corner.
5. The CTA now reads "Available in 24h" and is disabled. A new line appears below the body: "Last download: Just now."
6. Refresh the page. State is in-memory only, so the cooldown resets — this is expected V1 behavior (no persistence).
7. On mobile-width viewport (DevTools < md): the CTA wraps to a full-width button below the body. Title stays on its own row.

To exercise the cooldown UI without re-clicking, open the React DevTools / browser console and call:
```js
window.__test_setAudit = (iso) => useInstagramAudit.getState().__proto__ // placeholder
```
or simply call `useInstagramAudit.getState()._reset()` to return to the "available" state.

- [ ] **Step 5: Commit**

```bash
git add src/pages/overview/index.jsx
git commit -m "feat(audit): render InstagramAuditCard on Overview between chart row and bottom block"
```

---

### Task 5: CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Insert new entry above the most recent dated entry**

Open `CHANGELOG.md`. Locate the current top dated entry (most likely `## 2026-05-13 — Overview snapshot split`). Insert ABOVE it:

```markdown
## 2026-05-13 — Instagram Audit card

Adds the Instagram Audit affordance to the Overview page. Users can pull a weekly PDF snapshot of their account's growth, gated by a 24h cooldown.

### Added
- `InstagramAuditCard` component (`src/components/InstagramAuditCard.jsx`) — single-CTA card on the Overview page. CTA label encodes the cooldown state: "Get Instagram Audit" (available) → "Generating audit…" with spinner (1500ms processing) → "Available in {N}h" (cooldown).
- `useInstagramAudit` Zustand store — tracks `lastDownloadedAt`. `download()` stamps the timestamp and fires a "Audit downloaded." toast. `_reset()` QA helper flips back to "available" for testing.
- `src/utils/auditCooldown.js` — `isAuditAvailable(iso)` + `nextAuditAvailableIn(iso)` pure helpers. 24h cooldown constant lives here.

### Changed
- Overview page renders the audit card in a new full-width row between the GrowthChart/ActivityFeed row and the bottom 2-col block. Placement is adjacent to the chart it summarizes.

### Decisions (locked, don't revisit)
- **24h cooldown.** Single source of truth: `COOLDOWN_MS` constant in `src/utils/auditCooldown.js`.
- **CTA label encodes state.** No separate cooldown pill. Disabled state's label tells the user when it's available.
- **No PDF in V1.** Click triggers the spinner + toast only. Real PDF generation ships with backend; the store's `download()` action will be extended to call the real endpoint.
- **Per-account audit selection out of scope.** Audit reflects the active IG account; the page header already shows which one.
- **No audit history list.** Just the latest cooldown stamp. Multi-download history is a future spec if needed.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-13-instagram-audit-design.md`
- Plan: `docs/superpowers/plans/2026-05-13-instagram-audit.md`
```

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog entry for Instagram Audit card"
```

---

## Self-review summary

**Spec coverage check:**
- ✅ Card lands between chart row and bottom 2-col block → Task 4 Step 2
- ✅ Card structure: chip + title + body + conditional cooldown line + CTA → Task 3 (full component code)
- ✅ CTA label states: idle/available, idle/cooldown, processing → Task 3 (`ctaLabel` derivation)
- ✅ 1500ms simulated generation → Task 3 (`setTimeout(..., 1500)`)
- ✅ Store with `lastDownloadedAt` + `download()` + `_reset()` → Task 2
- ✅ Cooldown helpers `isAuditAvailable` + `nextAuditAvailableIn` → Task 1
- ✅ Mobile-responsive: CTA wraps below body on mobile, inline on md:+ → Task 3 (`flex flex-wrap` wrapper + `w-full md:w-auto` button)
- ✅ Toast "Audit downloaded." → Task 2 (`download()` calls `useToasts.getState().addToast`)
- ✅ "Last download: 3h ago." line only when `lastDownloadedAt` is set → Task 3
- ✅ CHANGELOG entry → Task 5

**Type / naming consistency check:**
- Store field: `lastDownloadedAt: ISOString | null` — read by Task 3, written by Task 2, consumed by Task 1 helpers. Consistent.
- Store action: `download()` — defined in Task 2, called in Task 3's effect. Match.
- Helper names: `isAuditAvailable`, `nextAuditAvailableIn` — defined in Task 1, imported + used in Task 3. Match.
- Component name: `InstagramAuditCard` — defined in Task 3, imported in Task 4. Match.
- Tone helper: `formatRelativeTime` is an existing util at `src/utils/formatRelativeTime.js` — verified present in the codebase (used by `WelcomeDmCard`, `CloseFriendsCard`, `GrowthPlusActivity`).
- Toast tone: `'success'` — matches existing `useToasts.addToast` API.
- `CardChip` color: `'blue'` — matches the existing tinted-chip recipe (`bg-blue-tint text-blue-base`).
