# Growth+ Page Polish Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 QA issues from the 2026-05-12 review of the Growth+ page — hero state-aware pill + headline + locked-preview hide, page H1 + subtitle, dynamic billing date, "Top accounts" segment rename, Megaphone for Boosted posts.

**Architecture:** Six tasks across five existing files plus one mock addition. No new components, no architectural changes. Tasks are dependency-ordered: mock additions first (so the UI tasks have data to read), then UI changes in any order. Each task is one commit.

**Tech Stack:** React 19, Tailwind v4, Lucide React, Zustand 5. No new dependencies. No automated test suite — verification is manual via the Claude Preview MCP server (`preview_eval`, `preview_resize`, `preview_click`) at mobile (375×812) and desktop (1280×800).

**Spec:** `docs/superpowers/specs/2026-05-12-growth-plus-polish-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/mocks/user.js` | Modify | Add `mockGrowthPlusStartedAt` + `mockGrowthPlusNextBillingAt` exports anchored to import time. |
| `src/pages/growthPlus/GrowthPlusHero.jsx` | Modify | State-aware pill (Active/Paused) + headline swap when paused + hide pill in `previewMode`. |
| `src/pages/growthPlus/index.jsx` | Modify | Add `<header>` with H1 + subtitle above the conditional render. |
| `src/pages/growthPlus/GrowthPlusControls.jsx` | Modify | `formatBillingDate` helper + dynamic billing line + `'top'` Quality value/label rename. |
| `src/pages/growthPlus/GrowthPlusMetricsStrip.jsx` | Modify | Boosted posts metric icon: Sparkles → Megaphone. |

Implementation order:
1. **Task 1** — mock additions (Item 3 data — independent of UI).
2. **Task 2** — hero state-aware (Items 1 + 4 + 7 — biggest behavioral change).
3. **Task 3** — page header (Item 2).
4. **Task 4** — billing date wiring (Item 3 UI).
5. **Task 5** — Top accounts rename (Item 4 from spec).
6. **Task 6** — Megaphone icon (Item 5 from spec).

Six commits total.

---

## Task 1: Mock — Growth+ subscription start + next billing dates

**Why:** The dynamic billing-line render needs an import-time-anchored ISO string for "next billing." Adding it as a new mock export (alongside the existing `mockUser` family in `src/mocks/user.js`) keeps the field where related user-state lives.

**Files:**
- Modify: `src/mocks/user.js`

- [ ] **Step 1: Add the two new exports at the bottom of `src/mocks/user.js`**

Open `src/mocks/user.js`. Append after the existing `mockUserGrowthPlus` export (the file should already have `mockUser` and `mockUserGrowthPlus`; add the new code at the very end of the file):

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

The `_gpStart` underscore-prefix convention matches the `_now` and `_endOfToday` locals already in this file. `mockGrowthPlusStartedAt` is exported (not just `_next`) so future "Subscribed since" UI on `/account/growth-plus` can use it without a follow-up patch.

- [ ] **Step 2: Sanity check**

Run: `node --check src/mocks/user.js`
Expected: no output (parses).

- [ ] **Step 3: Commit**

```bash
git add src/mocks/user.js
git commit -m "$(cat <<'EOF'
feat(mocks): Growth+ subscription start + next billing date

Adds mockGrowthPlusStartedAt (today minus 5 days) and
mockGrowthPlusNextBillingAt (startedAt + 30 days), both computed at
module import. The current Growth+ controls billing line hardcodes
"May 25" — the upcoming UI task replaces it with a date derived from
this mock so the line always reads ~25 days out regardless of when
the page loads. Same import-time-relative trick as
mockUser.trialEndsAt.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Hero state-aware pill + headline

**Why:** Today the hero pill hardcodes "Active" regardless of actual boost state. Two visible problems: subscribers see "Active" even after pausing boost (contradicts the toggle), and non-subscribers see "Active" through the blur on the locked-preview state. Both fixed by reading `growthPlusControls.enabled` from `useGrowthConfig` and gating the pill on `!previewMode`.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusHero.jsx`

- [ ] **Step 1: Add the `useGrowthConfig` import**

Open `src/pages/growthPlus/GrowthPlusHero.jsx`. The current top of the file reads:

```jsx
import { Sparkles } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { mockGrowthDaily, mockGrowthPlusInsights } from '@/mocks/growth'
import { useCountUp } from '@/hooks/useCountUp'
```

Add the store import:

```jsx
import { Sparkles } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { mockGrowthDaily, mockGrowthPlusInsights } from '@/mocks/growth'
import { useCountUp } from '@/hooks/useCountUp'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
```

- [ ] **Step 2: Read the boost-enabled flag inside the component**

Inside `GrowthPlusHero`'s function body, alongside the existing `target` / `animatedValue` / `value` / `data` derivations, add:

```jsx
const boostEnabled = useGrowthConfig(
  (s) => s.config.growthPlusControls.enabled,
)
```

Add it after the existing `useCountUp` line so the read order reads top-to-bottom: stat target → animated value → final value → boost state → chart data.

- [ ] **Step 3: Make the pill state-aware (and gated on `!previewMode`)**

Find the existing pill block:

```jsx
<span className="ml-auto rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
  Active
</span>
```

Replace with:

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
- `previewMode === true` (non-subscriber locked-preview): pill not rendered.
- `previewMode === false && boostEnabled === true`: green Active pill (unchanged recipe).
- `previewMode === false && boostEnabled === false`: muted Paused pill (`bg-bg text-text-secondary`).

- [ ] **Step 4: Swap the headline copy when paused**

Find the existing headline paragraph:

```jsx
<p className="mt-2 text-sm text-text-secondary">
  extra followers from Growth+ this month
</p>
```

Replace with:

```jsx
<p className="mt-2 text-sm text-text-secondary">
  {boostEnabled
    ? 'extra followers from Growth+ this month'
    : 'Boost paused — billing continues'}
</p>
```

- [ ] **Step 5: Manual verify three states**

Start the preview server. Subscribe to Growth+ via the locked-preview overlay (so the page is in subscriber state).

Navigate to `/growth-plus`. With boost ON (default), verify:
- Hero shows green `Active` pill.
- Headline reads `extra followers from Growth+ this month`.

Scroll to the Growth+ controls section. Click the `Boost active` toggle to OFF.

Scroll back to the hero. Verify:
- Hero pill changes to muted `Paused` (gray, not green).
- Headline changes to `Boost paused — billing continues`.

Toggle boost ON again. Verify the pill and headline revert.

Reload the page (resets the Zustand subscription override). The page renders the locked-preview state again. Verify:
- No pill anywhere on the blurred hero (was previously visible through the blur as "ACTIVE").
- The blurred hero still shows the number, sparkline, GROWTH+ eyebrow — just no pill.

Use `preview_eval` to confirm:
```js
(() => {
  const hero = [...document.querySelectorAll('section')].find(s => /GROWTH\+/.test(s.textContent))
  const pill = [...(hero?.querySelectorAll('span') || [])].find(s => /Active|Paused/.test(s.textContent.trim()))
  return {
    pillPresent: !!pill,
    pillText: pill?.textContent?.trim(),
    pillClass: pill?.className,
  }
})()
```
Expected on locked-preview: `{ pillPresent: false, pillText: undefined, pillClass: undefined }`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusHero.jsx
git commit -m "$(cat <<'EOF'
fix(growth-plus): state-aware hero pill + headline

Hero pill now reads useGrowthConfig.growthPlusControls.enabled:
green Active when boost is on, muted Paused (bg-bg text-text-secondary)
when off. Hidden entirely when previewMode is true so non-subscribers
in the locked-preview state stop seeing a green "Active" pill through
the blur. Headline paragraph swaps to "Boost paused — billing continues"
when paused; reverts when boost resumes. Resolves growth-plus-polish
items 1 + 4 + 7.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Page H1 + subtitle

**Why:** Every other dashboard page has an `<h1>` + subtitle anchoring page identity. Growth+ jumps straight into the hero card. Adding the header restores consistency and lets non-subscribers see "Growth+" as the page identity without relying on the blurred hero's `GROWTH+` eyebrow alone.

**Files:**
- Modify: `src/pages/growthPlus/index.jsx`

- [ ] **Step 1: Add the `<header>` block**

Open `src/pages/growthPlus/index.jsx`. The current return reads:

```jsx
return (
  <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
    {subscribed ? (
      <GrowthPlusActive account={activeAccount} />
    ) : (
      <GrowthPlusLockedPreview account={activeAccount} />
    )}
  </div>
)
```

Insert the header block between the outer `<div>` and the conditional. The new return:

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

**Why outside the locked-preview wrapper:** the H1 must NOT be blurred. Sitting at the page level (above the conditional) means both states render the header clearly.

**Recipe matches existing pages:**
- `text-lg font-semibold leading-snug text-text-primary lg:text-xl` — same as Targeting / Engagement / Settings / Overview greeting.
- `mt-1 text-sm text-text-secondary` subtitle — same recipe.
- `mb-5 md:mb-6` gap to next section — matches Targeting / Engagement header spacing.

- [ ] **Step 2: Manual verify**

Reload preview at desktop. Navigate to `/growth-plus`. Verify (both states, since reload puts the page in locked-preview):
- Above the hero / blurred dashboard, an `<h1>Growth+</h1>` is visible.
- Below the H1, a subtitle reads `Algorithmic reach on top of your Targeted Growth.`
- Both lines are sharp (not blurred).

Subscribe via the overlay. After the success transition:
- The header (H1 + subtitle) stays visible — only the hero / metrics / etc. below it change.

Resize to mobile. Verify the header renders at `text-lg` (smaller), still clearly readable.

Use `preview_eval`:
```js
(() => {
  const h1 = document.querySelector('main h1, [class*="max-w-5xl"] h1')
  const subtitle = h1?.nextElementSibling
  return {
    h1Text: h1?.textContent?.trim(),
    subtitleText: subtitle?.textContent?.trim(),
  }
})()
```
Expected: `{ h1Text: 'Growth+', subtitleText: 'Algorithmic reach on top of your Targeted Growth.' }`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/growthPlus/index.jsx
git commit -m "$(cat <<'EOF'
feat(growth-plus): page H1 + subtitle

Adds "Growth+" h1 + "Algorithmic reach on top of your Targeted Growth."
subtitle above the conditional render, matching the recipe used by
Targeting / Engagement / Settings / Overview. Header sits at the page
level (outside the locked-preview wrapper) so non-subscribers see the
page identity sharply, not blurred. Resolves growth-plus-polish item 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Dynamic billing date

**Why:** The current `Next billing $49.00 on May 25` is hardcoded with no year. Replace with a date computed from `mockGrowthPlusNextBillingAt` (added in Task 1) and formatted via a small inline helper.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusControls.jsx`

- [ ] **Step 1: Add the import**

Open `src/pages/growthPlus/GrowthPlusControls.jsx`. The current imports are:

```jsx
import { Link } from 'react-router-dom'
import { ChevronRight, Sliders } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
```

Add the mock import:

```jsx
import { Link } from 'react-router-dom'
import { ChevronRight, Sliders } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockGrowthPlusNextBillingAt } from '@/mocks/user'
```

- [ ] **Step 2: Add the `formatBillingDate` helper**

At the top of the file (above the existing `SPEED_OPTIONS` constant, after the imports), add:

```jsx
function formatBillingDate(iso) {
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
```

`undefined` for the locale arg means "browser default" — at en-US that renders as `Jun 6, 2026`-style.

- [ ] **Step 3: Replace the billing line**

In the `GrowthPlusControls` component's return, find the billing line:

```jsx
<p className="text-sm text-text-secondary">
  Next billing{' '}
  <span className="font-medium text-text-primary">$49.00 on May 25</span>
</p>
```

Replace with:

```jsx
<p className="text-sm text-text-secondary">
  Next billing{' '}
  <span className="font-medium text-text-primary">
    $49.00 on {formatBillingDate(mockGrowthPlusNextBillingAt)}
  </span>
</p>
```

- [ ] **Step 4: Manual verify**

Reload preview. Subscribe via the overlay → live dashboard appears. Scroll to the Growth+ controls section. Verify the billing line now reads something like `Next billing $49.00 on Jun 6, 2026` (the exact date depends on today — should be ~25 days from now, with a year, in `Mon DD, YYYY` format).

Use `preview_eval`:
```js
(() => {
  const controlsCard = [...document.querySelectorAll('section')].find(s => /Growth\+ controls/.test(s.textContent))
  const billingSpan = [...controlsCard.querySelectorAll('.font-medium')].find(el => /\$49\.00/.test(el.textContent))
  const matches = billingSpan?.textContent?.match(/\$49\.00 on (.+)/)
  return {
    text: billingSpan?.textContent?.trim(),
    dateExtracted: matches?.[1],
    hasYear: /\d{4}/.test(matches?.[1] || ''),
  }
})()
```
Expected: `text` contains a date with month name + day + 4-digit year. `hasYear: true`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusControls.jsx
git commit -m "$(cat <<'EOF'
fix(growth-plus): dynamic billing date

Hardcoded "May 25" replaced with a date computed from
mockGrowthPlusNextBillingAt (5 days into a 30-day cycle from import
time = ~25 days remaining). Inline formatBillingDate helper uses the
browser locale + month-short / day-numeric / year-numeric so the line
reads "Jun 6, 2026"-style with the year always included. Resolves
growth-plus-polish item 3 (the date now always reads as a real future
date no matter when the page loads).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: "Top accounts" segment rename

**Why:** The current "High-engagement" Quality option wraps to two lines on mobile inside the segmented control. Shortening to "Top accounts" keeps the label on one line and preserves the 3-option visual rhythm.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusControls.jsx`

- [ ] **Step 1: Update the third entry in `QUALITY_OPTIONS`**

In `src/pages/growthPlus/GrowthPlusControls.jsx`, find the `QUALITY_OPTIONS` array near the top:

```js
const QUALITY_OPTIONS = [
  { value: 'broad', label: 'Broad', note: 'Wider reach across audiences.' },
  { value: 'targeted', label: 'Targeted', note: 'Match your niche; balanced reach + engagement.' },
  { value: 'high-engagement', label: 'High-engagement', note: 'Active accounts likely to like + save.' },
]
```

Change the third entry's `value` and `label`. The `note` stays unchanged. The full array becomes:

```js
const QUALITY_OPTIONS = [
  { value: 'broad', label: 'Broad', note: 'Wider reach across audiences.' },
  { value: 'targeted', label: 'Targeted', note: 'Match your niche; balanced reach + engagement.' },
  { value: 'top', label: 'Top accounts', note: 'Active accounts likely to like + save.' },
]
```

The `value` key rename is safe — `QUALITY_OPTIONS` in this file is the only source of truth for the keys. `mockGrowthConfig.growthPlusControls.quality` defaults to `'targeted'` (unchanged). Nothing else in the codebase references `'high-engagement'` (verify with `grep -r "high-engagement" src/` — should return zero hits after this change).

- [ ] **Step 2: Manual verify**

Reload preview at mobile (375). Subscribe → live dashboard. Scroll to Growth+ controls → Quality row. Verify:
- Segmented control shows three options on one row: `Broad · Targeted · Top accounts`.
- "Top accounts" stays on one line — no two-line wrap.
- Tapping "Top accounts" works (the option becomes selected, the tradeoff note below updates to `Active accounts likely to like + save.`).

Use `preview_eval`:
```js
(() => {
  const controlsCard = [...document.querySelectorAll('section')].find(s => /Growth\+ controls/.test(s.textContent))
  const qualityBtns = [...controlsCard.querySelectorAll('button')].filter(b => /^(Broad|Targeted|Top accounts)$/.test(b.textContent.trim()))
  const heights = qualityBtns.map(b => b.getBoundingClientRect().height)
  return {
    buttonCount: qualityBtns.length,
    labels: qualityBtns.map(b => b.textContent.trim()),
    heights,
    allEqualHeight: heights.every(h => Math.abs(h - heights[0]) < 1),
  }
})()
```
Expected: `{ buttonCount: 3, labels: ['Broad', 'Targeted', 'Top accounts'], allEqualHeight: true }`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusControls.jsx
git commit -m "$(cat <<'EOF'
fix(growth-plus): "Top accounts" Quality segment

Renames the third Quality option from "High-engagement" to
"Top accounts" so it stops wrapping to two lines on mobile inside
the segmented control. value key also changes from 'high-engagement'
to 'top' — only consumer is the QUALITY_OPTIONS array in this file
(verified via grep). Tradeoff note unchanged — "Active accounts
likely to like + save." still describes the right behavior. Resolves
growth-plus-polish item 4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Megaphone for Boosted posts metric

**Why:** The Sparkles icon is used three places on the page (hero brand chip, Boosted posts metric, post-boosted activity rows). Boosted posts switches to `Megaphone` so each Sparkles use has one meaning.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusMetricsStrip.jsx`

- [ ] **Step 1: Update the Lucide import**

Open `src/pages/growthPlus/GrowthPlusMetricsStrip.jsx`. The current top of the file:

```jsx
import { Heart, Sparkles, TrendingUp } from 'lucide-react'
```

Replace with:

```jsx
import { Heart, Megaphone, TrendingUp } from 'lucide-react'
```

(Sparkles is no longer used in this file after the change — Boosted posts was its only consumer here.)

- [ ] **Step 2: Update the third card's `icon` reference**

In the `CARDS` array, find the `posts` entry:

```js
{
  key: 'posts',
  icon: Sparkles,
  value: String(mockGrowthPlusInsights.boostedPosts),
  label: 'Boosted posts',
  sub: 'posts boosted this month',
},
```

Change `icon` to `Megaphone`:

```js
{
  key: 'posts',
  icon: Megaphone,
  value: String(mockGrowthPlusInsights.boostedPosts),
  label: 'Boosted posts',
  sub: 'posts boosted this month',
},
```

- [ ] **Step 3: Manual verify**

Reload preview. Subscribe → live dashboard. Look at the metrics strip below the hero. Verify:
- First card: `TrendingUp` icon, `+34%`, "Post reach lift".
- Second card: `Heart` icon, `4.8%`, "Engagement rate".
- Third card: `Megaphone` icon (a speaker / horn shape, distinct from Sparkles), `12`, "Boosted posts".

The hero's Sparkles chip (top-left of the hero) and the post-boosted activity rows' Sparkles icons stay unchanged — only the metric card swapped.

Use `preview_eval`:
```js
(() => {
  const strip = [...document.querySelectorAll('section')].find(s => /Post reach lift/.test(s.textContent))
  const cards = [...strip.querySelectorAll('div.rounded-xl')]
  const icons = cards.map(c => [...(c.querySelector('svg')?.classList || [])].find(cls => cls.startsWith('lucide-')))
  return { icons }
})()
```
Expected: `{ icons: ['lucide-trending-up', 'lucide-heart', 'lucide-megaphone'] }`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusMetricsStrip.jsx
git commit -m "$(cat <<'EOF'
fix(growth-plus): Megaphone for Boosted posts metric

Replaces the Sparkles icon on the Boosted posts metric card with
Megaphone. Sparkles was previously used in three roles on the same
page (hero brand chip, Boosted posts metric, post-boosted activity
rows) — diluting its meaning. Megaphone semantically reads as "post
amplification / broadcast" and is visually distinct from Sparkles.
Sparkles now owns only the Growth+ brand role + the post-boosted
activity rows. Resolves growth-plus-polish item 5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

- [ ] **Step 1: Full sweep at mobile + desktop**

With the dev server running, sweep both states at mobile (375×812) and desktop (1280×800):

**Non-subscriber (default mocks):**
- `/growth-plus` shows "Growth+" H1 + subtitle (sharp, above the blur).
- Blurred dashboard behind the floating overlay has NO "ACTIVE" pill anywhere.

**Subscriber (after subscribing via the overlay):**
- H1 + subtitle still visible at top.
- Hero pill says `Active` (green) when boost is on.
- Toggle boost OFF → hero pill changes to `Paused` (muted gray), headline changes to `Boost paused — billing continues`.
- Toggle ON → pill back to `Active`, headline back to `extra followers from Growth+ this month`.
- Metrics strip: `TrendingUp` / `Heart` / `Megaphone` icons.
- Quality segment: `Broad · Targeted · Top accounts` on one line.
- Billing line: `Next billing $49.00 on <Mon DD, YYYY>` (real future date with year).

- [ ] **Step 2: Check git log**

```bash
git log --oneline -7
```

Expected: six new commits on top of the spec commit (`c60947e`), in this order: mocks, hero, page header, billing date, top accounts rename, megaphone swap.

---

## Notes for the implementer

- The codebase has no automated test suite. Verification is manual via the preview MCP server.
- Use `preview_inspect` over `preview_screenshot` for verifying className changes — screenshots are unreliable for exact pixel checks.
- After Task 2, the `previewMode` prop is the gate for hiding the pill. `previewMode` is already passed by `GrowthPlusLockedPreview` (`previewMode` flag, defaults to `false`) — no upstream changes needed.
- The `formatBillingDate` helper is intentionally inline (top of `GrowthPlusControls.jsx`) — single consumer, ~3 lines, doesn't earn its own file.
- After Task 5, run `grep -r "high-engagement" src/` to confirm zero hits. If anything else references the old key, fix it before committing.
- The `mockGrowthPlusStartedAt` export added in Task 1 isn't consumed in this spec — it's there for the future `/account/growth-plus` real subscription-management page (separate spec, on the pending queue). Don't remove it.
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
