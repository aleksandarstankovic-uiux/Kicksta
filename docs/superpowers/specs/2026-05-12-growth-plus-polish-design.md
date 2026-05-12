# Growth+ Page Polish Pass — Design Spec

**Date:** 2026-05-12
**Goal:** Fix seven QA issues found in the freshly-shipped Growth+ page — credibility bugs around the "Active" pill, missing page identity, fragile hardcoded billing date, a wrapping segment label, an overloaded icon, and a paused-state visual gap.

**Architecture:** Five-file refactor across the existing Growth+ page tree plus one mock addition. No new components, no architectural changes. Each change is small and independently verifiable.

**Tech stack:** React, Tailwind, Lucide. No new dependencies. Reuses the existing `useGrowthConfig` store and Lucide icon set.

**Source:** 2026-05-12 QA pass on the 2026-05-11 Growth+ page shipment. Picks up items 1, 2, 3, 4, 5, 7, 8 from the QA report.

---

## Item 1 — Hero state-aware pill + headline

**Why:** Today the hero card hardcodes `<span>Active</span>` regardless of actual state. Two consequences:
- Subscribers who pause boost see a contradictory page: pill says "Active", toggle says "Paused".
- Non-subscribers see a green "Active" pill peeking through the blur on the locked-preview state, before they've even subscribed.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusHero.jsx`

### Read boost state from the store

Add an import:

```jsx
import { useGrowthConfig } from '@/stores/useGrowthConfig'
```

Inside the component, read the `enabled` flag:

```jsx
const boostEnabled = useGrowthConfig(
  (s) => s.config.growthPlusControls.enabled,
)
```

### Conditional pill render

Replace the existing pill block:

```jsx
<span className="ml-auto rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
  Active
</span>
```

With state-aware rendering:

```jsx
{!previewMode && (
  <span
    className={`ml-auto rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
      boostEnabled
        ? 'bg-green-tint text-green-text'
        : 'bg-bg text-text-secondary'
    }`}
  >
    {boostEnabled ? 'Active' : 'Paused'}
  </span>
)}
```

**Three rules baked in:**
1. `previewMode === true` (non-subscriber locked-preview): no pill rendered at all. Hides the credibility-bug where non-subscribers saw "Active" through the blur.
2. `previewMode === false && boostEnabled === true`: green `Active` pill (same recipe as today).
3. `previewMode === false && boostEnabled === false`: muted `Paused` pill — `bg-bg text-text-secondary`. Same shape, signals state without alarming.

### Headline swap when paused

Replace the existing headline paragraph:

```jsx
<p className="mt-2 text-sm text-text-secondary">
  extra followers from Growth+ this month
</p>
```

With state-aware copy:

```jsx
<p className="mt-2 text-sm text-text-secondary">
  {boostEnabled
    ? 'extra followers from Growth+ this month'
    : 'Boost paused — billing continues'}
</p>
```

When boost is paused, the hero number `+143` reads as a historical earn rather than a current rate — the headline change reinforces that without changing the number.

**Acceptance:**
- Subscriber, boost on: green `Active` pill, headline `extra followers from Growth+ this month`.
- Subscriber, boost paused: muted `Paused` pill, headline `Boost paused — billing continues`.
- Non-subscriber (locked-preview): no pill at all.

---

## Item 2 — Page H1 + subtitle

**Why:** Every other dashboard page (Overview, Targeting, Engagement, Settings) has an `<h1>` + subtitle anchoring page identity. Growth+ jumps straight into the hero card — the `GROWTH+` eyebrow inside the hero is the only identifier. Adding the header restores consistency.

**Files:**
- Modify: `src/pages/growthPlus/index.jsx`

Add a `<header>` block above the conditional render, inside the page's `max-w-5xl` container:

```jsx
return (
  <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
    <header className="mb-5 md:mb-6">
      <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
        Growth+
      </h1>
      <p className="mt-1 text-sm text-text-secondary">
        Algorithmic reach on top of your Targeted Growth.
      </p>
    </header>

    {subscribed ? (
      <GrowthPlusActive account={activeAccount} />
    ) : (
      <GrowthPlusLockedPreview account={activeAccount} />
    )}
  </div>
)
```

**Why outside the locked-preview wrapper:** the H1 must NOT be blurred — non-subscribers need to clearly identify what page they're on. Sitting above the conditional render means it's part of the page chrome, not part of the dashboard preview.

**Recipe matches existing pages exactly:**
- `text-lg font-semibold leading-snug text-text-primary lg:text-xl` — same as Targeting/Engagement/Settings/Overview greeting.
- `mt-1 text-sm text-text-secondary` subtitle — same recipe.
- `mb-5 md:mb-6` to the next section — matches the gap used by Targeting/Engagement page headers.

**Acceptance:** Both subscriber and non-subscriber states show "Growth+" + "Algorithmic reach on top of your Targeted Growth." as the page header above any dashboard / overlay content.

---

## Item 3 — Dynamic billing date

**Why:** The current `Next billing $49.00 on May 25` is hardcoded. The date has no year, and "May 25" is effectively in the past relative to the current display date — users can't tell which year is meant. Switching to an import-time-computed mock anchored 5 days into a 30-day cycle makes the date always read fresh ("~25 days from today") regardless of when the user loads the page.

**Files:**
- Modify: `src/mocks/user.js` (add two new exports)
- Modify: `src/pages/growthPlus/GrowthPlusControls.jsx` (consume + format the new field)

### New mock exports in `src/mocks/user.js`

Append after the existing `mockUserGrowthPlus` export:

```js
// Growth+ subscription anchored relative to import time so the
// "Next billing" date in the Growth+ controls renders fresh on each
// load (5 days into a 30-day cycle = ~25 days remaining). Same trick
// as `mockUser.trialEndsAt`.
const _gpStart = new Date()
_gpStart.setHours(0, 0, 0, 0)
_gpStart.setDate(_gpStart.getDate() - 5)
export const mockGrowthPlusStartedAt = _gpStart.toISOString()

const _gpNext = new Date(_gpStart)
_gpNext.setDate(_gpNext.getDate() + 30)
export const mockGrowthPlusNextBillingAt = _gpNext.toISOString()
```

(The `_gpStart` is exported too because future "Subscribed since…" UI on `/account/growth-plus` will want it — adding both fields now avoids a follow-up patch.)

### Format helper + render update in `GrowthPlusControls.jsx`

Add a top-level helper (above the `SPEED_OPTIONS` constant):

```js
function formatBillingDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
```

Add the import:

```jsx
import { mockGrowthPlusNextBillingAt } from '@/mocks/user'
```

Update the billing line:

Before:
```jsx
<p className="text-sm text-text-secondary">
  Next billing{' '}
  <span className="font-medium text-text-primary">$49.00 on May 25</span>
</p>
```

After:
```jsx
<p className="text-sm text-text-secondary">
  Next billing{' '}
  <span className="font-medium text-text-primary">
    $49.00 on {formatBillingDate(mockGrowthPlusNextBillingAt)}
  </span>
</p>
```

Locale defaults to the user's browser locale (`undefined` first arg). At en-US that renders as `Jun 6, 2026`-style. No timezone weirdness — the date is local-midnight ISO, parsed and formatted locally.

**Acceptance:** The billing line always shows a real future date roughly 25 days out, with year included. Reloading the page on different days continues to render correctly because both fields recompute at module import.

---

## Item 4 — "Top accounts" segment

**Why:** The third Quality option's label `High-engagement` wraps to two lines on mobile inside the segmented control, breaking the 3-option visual rhythm and making the row taller. Shortening to `Top accounts` keeps the label on one line at all viewport widths.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusControls.jsx`

In the `QUALITY_OPTIONS` array, the third entry:

Before:
```js
{ value: 'high-engagement', label: 'High-engagement', note: 'Active accounts likely to like + save.' },
```

After:
```js
{ value: 'top', label: 'Top accounts', note: 'Active accounts likely to like + save.' },
```

**Three changes baked in:**
- `value` key: `'high-engagement'` → `'top'`.
- `label`: `'High-engagement'` → `'Top accounts'`.
- `note`: unchanged — the tradeoff caption already describes the right behavior.

The `value` rename is safe because `QUALITY_OPTIONS` in this file is the only source of truth for the keys. `mockGrowthConfig.growthPlusControls.quality` defaults to `'targeted'` (unchanged). Nothing else in the codebase references `'high-engagement'`.

**Acceptance:** Quality segment reads `Broad · Targeted · Top accounts` on one line at mobile and desktop. No vertical growth in the segmented row.

---

## Item 5 — Megaphone for Boosted posts metric

**Why:** The Sparkles icon is used in three roles on the same page: hero brand chip, Boosted posts metric card, and every post-boosted row in the activity feed. The triple-use dilutes the icon's meaning. Boosted posts switches to `Megaphone` — semantically "post amplification / broadcast," visually distinct from Sparkles.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusMetricsStrip.jsx`

### Lucide import

Before:
```jsx
import { Heart, Sparkles, TrendingUp } from 'lucide-react'
```

After:
```jsx
import { Heart, Megaphone, TrendingUp } from 'lucide-react'
```

(Sparkles is no longer used in this file after the change.)

### Update the third card config

Before:
```js
{
  key: 'posts',
  icon: Sparkles,
  value: String(mockGrowthPlusInsights.boostedPosts),
  label: 'Boosted posts',
  sub: 'posts boosted this month',
},
```

After:
```js
{
  key: 'posts',
  icon: Megaphone,
  value: String(mockGrowthPlusInsights.boostedPosts),
  label: 'Boosted posts',
  sub: 'posts boosted this month',
},
```

**Result:** Sparkles stays the Growth+ brand icon (hero chip + activity feed boost rows). Megaphone owns "boosted posts count." Each icon means one thing.

**Acceptance:** Boosted posts metric card shows a Megaphone icon in its purple chip. The metric strip's three icons are now `TrendingUp` (reach), `Heart` (engagement), `Megaphone` (boosted posts) — three distinct shapes.

---

## Out of scope

Items from the QA report deferred to follow-up specs (separate decisions):
- Subscribe overlay too small on desktop (#7 in QA report).
- "Welcome to Growth+" celebration after first subscribe (#8).
- "Add later from your dashboard" copy in the overlay (#9).
- Activity feed event-type chip color differentiation (#11).
- Segmented-control tradeoff-note placement (#12).
- Locked-preview blur tuning + animation sequencing (#13, #14).
- Active-account hint (#15).
- Mobile metric card layout compactness (#16).
- `/account/growth-plus` real subscription-management page (#18 / cross-spec).

---

## Implementation notes for the plan

- Tasks land in this order, each independently verifiable:
  1. Mock additions (Item 3 data — independent of UI).
  2. Hero state-aware (Item 1) — biggest behavioral change.
  3. Page header (Item 2) — single import edit + JSX block.
  4. Billing date wiring (Item 3 UI).
  5. Top accounts rename (Item 4).
  6. Megaphone swap (Item 5).
- The codebase has no automated test suite; verification is manual via the Claude Preview MCP server at mobile (375×812) and desktop (1280×800).
- After Item 1, manually verify three states in browser: subscriber with boost ON, subscriber with boost OFF, non-subscriber locked-preview. All three should render the hero correctly.
- After Item 4, the default `quality` state in `mockGrowthConfig` (`'targeted'`) doesn't need to change — only the third option's key + label.
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
