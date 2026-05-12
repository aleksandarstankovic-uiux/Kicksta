# Growth+ Layout Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tighten Growth+ layout density — upsell hero merge, active hero 2-col + delta strip moved right, drop TierStrip, Activity+Controls 2-col on desktop, toggle alignment, "Top accounts" → "Engaged."

**Architecture:** Six tasks across four existing files plus one file deletion. No new components. Each task is one commit. Dependency-ordered so the composition root (Active page) is updated AFTER its child components shift.

**Tech Stack:** React 19, Tailwind v4, Lucide React. No new dependencies. No automated test suite — verification is manual via Claude Preview MCP at mobile (375×812) and desktop (1280×800).

**Spec:** `docs/superpowers/specs/2026-05-12-growth-plus-layout-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/pages/growthPlus/GrowthPlusUpsell.jsx` | Modify | Shrink hero shell, merge 3 benefits into a compact icon-row inside the hero, delete the separate benefits section. |
| `src/pages/growthPlus/GrowthPlusHero.jsx` | Modify | 2-col grid on `lg:+`, delta strip moves to right column, hero number shrinks, mobile deltas become 3-col with short labels. |
| `src/pages/growthPlus/GrowthPlusTierStrip.jsx` | Delete | Tier now lives in the hero pill and Billing card. No remaining consumers after Task 4. |
| `src/pages/growthPlus/GrowthPlusActive.jsx` | Modify | Drop TierStrip import + render; wrap Activity + Controls in a `lg:grid-cols-2` grid. |
| `src/pages/growthPlus/GrowthPlusControls.jsx` | Modify | Toggle row `items-start` → `items-center`; Quality option `Top accounts` → `Engaged`. |

Task order:
1. Upsell hero merge (Item 1).
2. Active hero 2-col (Item 2).
3. Active composition update + TierStrip delete (Items 3 + 4).
4. Controls polish (Items 5 + 6).

Five commits total.

---

## Task 1: Upsell hero merge + shrink

**Why:** The hero card is ~330px tall on mobile, pushing the first pricing card below the fold. Merging the 3 standalone benefit cards into a compact icon-row inside the hero (and shrinking the hero shell) drops the hero height to ~200px and removes a redundant section.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusUpsell.jsx`

- [ ] **Step 1: Replace the `BENEFITS` constant**

Open `src/pages/growthPlus/GrowthPlusUpsell.jsx`. Find the existing `BENEFITS` constant (lines 15–31). Replace with:

```jsx
const BENEFITS = [
  { icon: Sparkles, shortLabel: 'Algorithmic boost' },
  { icon: Network, shortLabel: 'Active accounts' },
  { icon: ShieldCheck, shortLabel: 'IG-safe' },
]
```

The `title` and `body` fields are dropped — only `shortLabel` is needed by the new inline icon-row.

- [ ] **Step 2: Replace the hero `<section>` block**

Find the hero `<section>` (lines 75–89 in the current file, starts with `<section className="overflow-hidden rounded-xl border border-purple-base/20 bg-gradient-to-br from-purple-tint…">`). Replace the entire `<section>…</section>` block with:

```jsx
<section className="overflow-hidden rounded-xl border border-purple-base/20 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 p-5 text-center shadow-sm md:p-7">
  <span
    aria-hidden="true"
    className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-purple-text text-surface shadow-sm md:h-12 md:w-12"
  >
    <Sparkles className="h-5 w-5 md:h-6 md:w-6" />
  </span>
  <h2 className="mt-3 text-xl font-semibold leading-snug text-text-primary md:text-2xl">
    Boost your reach with Growth+
  </h2>
  <p className="mx-auto mt-1.5 max-w-xl text-sm leading-relaxed text-text-secondary">
    Algorithmic post boosting from a network of real active accounts.
  </p>

  <ul className="mx-auto mt-4 flex max-w-md flex-col gap-2 text-left sm:flex-row sm:gap-4 sm:justify-center">
    {BENEFITS.map((b) => {
      const Icon = b.icon
      return (
        <li key={b.shortLabel} className="flex items-center gap-2 text-xs text-text-secondary">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-tint text-purple-text"
          >
            <Icon className="h-3.5 w-3.5" />
          </span>
          <span className="font-medium text-text-primary">{b.shortLabel}</span>
        </li>
      )
    })}
  </ul>
</section>
```

Six diffs vs. before:
1. Padding `p-6 md:p-10` → `p-5 md:p-7`.
2. Sparkles chip outer wrapper `h-14 w-14 rounded-2xl` → `h-10 w-10 rounded-xl md:h-12 md:w-12`.
3. Sparkles icon `h-7 w-7` → `h-5 w-5 md:h-6 md:w-6`.
4. Headline `text-2xl md:text-3xl` → `text-xl md:text-2xl`.
5. Body trimmed to one sentence (drops the "Stack it on top of Targeted Growth for compound results" line).
6. New `<ul>` benefit-icon-row at the bottom of the hero.

- [ ] **Step 3: Delete the standalone benefits `<section>`**

Find the standalone benefits grid section (starts at roughly line 97 in the current file: `<section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">`). It maps over `BENEFITS` to render 3 cards. **Delete the entire `<section>…</section>` block.**

The page's section sequence becomes: hero → pricing tier grid → FAQ.

- [ ] **Step 4: Manual verify**

Start the preview server. Resize to mobile (375×812). Navigate to `/growth-plus` (non-subscriber state — clear the Zustand override via page reload if needed).

Verify:
- Hero is shorter — Sparkles chip is smaller (~40px), headline is single-line on mobile ("Boost your reach with Growth+"), body is single-line.
- 3 benefit icons stack vertically below the body on mobile (Algorithmic boost / Active accounts / IG-safe).
- The first pricing card (`Starter`) is visible within scroll-1 (well above the previous fold position).
- No standalone benefit card section anywhere on the page — only hero, pricing grid, FAQ.

Resize to desktop (1280×800). Verify:
- 3 benefit icons render in a horizontal row inside the hero (`sm:+`).
- The page still has pricing + FAQ below the hero.

Use `preview_eval` to confirm:
```js
(() => {
  const sections = [...document.querySelectorAll('section')];
  const hero = sections.find(s => /Boost your reach/.test(s.textContent));
  const benefitsStandalone = sections.find(s => /Algorithmic post boosting.*Active-account/.test(s.textContent));
  const heroBenefits = hero?.querySelectorAll('ul li');
  return {
    sectionCount: sections.length,
    heroHeight: Math.round(hero?.getBoundingClientRect().height ?? 0),
    standaloneBenefitsExist: !!benefitsStandalone,
    inlineBenefitCount: heroBenefits?.length,
  };
})()
```
Expected: `sectionCount` is 3 (hero + pricing + FAQ — was 4 before), `standaloneBenefitsExist` is `false`, `inlineBenefitCount` is `3`, `heroHeight` is roughly 200–240px at mobile (was ~330px).

- [ ] **Step 5: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusUpsell.jsx
git commit -m "$(cat <<'EOF'
refactor(growth-plus): merge upsell benefits into hero + shrink

Hero card padding/copy trimmed (smaller Sparkles chip, single-line
body, drops the "stack on top of Targeted Growth" sentence — moves
into FAQ context). The 3 standalone benefit cards (Algorithmic post
boosting / Active-account engagement / Throttled to stay safe) below
the pricing grid are removed entirely; their content folds into a
compact 3-icon row INSIDE the hero (icon + 2-3 word label, no body
copy). The Upsell page is now hero → pricing → FAQ; the first
pricing card reaches above the fold on mobile. Resolves
growth-plus-layout item 1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Active hero 2-col + delta strip right + smaller number

**Why:** The active page's hero has ~50% empty space to the right of the number on desktop. Moving the delta strip there (and shrinking the hero number) packs the hero into a denser, more premium-feeling block. On mobile, the delta strip switches to a 3-col grid so values align vertically and labels shorten to stop wrapping.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusHero.jsx`

- [ ] **Step 1: Replace the hero `<section>` body and inline `DeltaItem`**

Open `src/pages/growthPlus/GrowthPlusHero.jsx`. Replace the entire return JSX (lines 24–77 in the current file — the `<section>…</section>` block) with:

```jsx
return (
  <section className="overflow-hidden rounded-xl border border-purple-base/20 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 p-5 shadow-sm md:p-6">
    <div className="lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8">
      <div>
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-text text-surface shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-text">
            GROWTH+
          </span>
          <span
            className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide lg:ml-0 ${
              boostEnabled
                ? 'bg-green-tint text-green-text'
                : 'bg-bg text-text-secondary'
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-1.5 w-1.5 rounded-full ${
                boostEnabled ? 'bg-green-base' : 'bg-text-muted'
              }`}
            />
            {boostEnabled ? 'Active' : 'Paused'}
            {tier && (
              <>
                <span aria-hidden="true" className="opacity-50">
                  ·
                </span>
                <span>{tier.name}</span>
              </>
            )}
          </span>
        </div>

        <p className="mt-4 text-3xl font-semibold leading-none text-text-primary md:text-4xl">
          +{value}
        </p>
        <p className="mt-2 text-sm text-text-secondary">
          {boostEnabled
            ? 'extra followers from Growth+ this month'
            : 'Boost paused — billing continues'}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-3 text-sm text-text-secondary lg:mt-0 lg:flex lg:flex-col lg:items-end lg:gap-3 lg:border-l lg:border-purple-base/20 lg:pl-6">
        <DeltaItem label="today" value={deltas.today} />
        <DeltaItem label="week" value={deltas.week} />
        <DeltaItem label="month" value={deltas.month} />
      </dl>
    </div>
  </section>
)
```

- [ ] **Step 2: Replace the `DeltaItem` helper**

At the bottom of the file, replace the existing `DeltaItem` function:

```jsx
function DeltaItem({ label, value }) {
  return (
    <div className="flex flex-col items-start gap-0.5 lg:flex-row lg:items-baseline lg:gap-1.5">
      <dt className="sr-only">{label}</dt>
      <dd className="text-base font-semibold text-purple-text">+{value}</dd>
      <span aria-hidden="true" className="text-xs text-text-secondary">
        {label}
      </span>
    </div>
  )
}
```

Mobile (default): vertical stack (value above label) inside each grid cell. Desktop (`lg:+`): inline baseline (value + label on same line) inside the right column.

- [ ] **Step 3: Manual verify mobile**

Reload preview at mobile (375×812). Subscribe via the upsell page (any tier). After the subscribe flow completes, scroll to the top.

Verify the hero:
- Hero number is smaller — roughly half the previous size.
- Below the number+headline, 3 deltas sit in a 3-col grid: each shows the value (`+12 / +84 / +143`) above a short label (`today / week / month`). Values are at the same Y position.
- No "this" prefix on labels — labels are single words.

Use `preview_eval`:
```js
(() => {
  const hero = [...document.querySelectorAll('section')].find(s => /GROWTH\+/.test(s.textContent));
  const deltaValues = [...hero.querySelectorAll('dl dd')];
  const tops = deltaValues.map(el => Math.round(el.getBoundingClientRect().top));
  const labels = [...hero.querySelectorAll('dl span[aria-hidden="true"]:last-child')]
    .filter(s => s.parentElement.tagName === 'DIV')
    .map(s => s.textContent.trim());
  return {
    valueTops: tops,
    allValuesSameRow: tops.every(t => Math.abs(t - tops[0]) < 1),
    labels,
  };
})()
```
Expected: `allValuesSameRow: true`, `labels: ['today', 'week', 'month']`.

- [ ] **Step 4: Manual verify desktop**

Resize to desktop (1280×800). Reload the page and re-subscribe if needed.

Verify the hero:
- Two columns visible. Left column: GROWTH+ chip + Active·Pro pill (NOT pushed all the way right anymore, sits inline with the chip), then number + headline below.
- Right column: 3 deltas stacked vertically, right-aligned, separated from left column by a faint vertical border + padding.
- Hero is shorter vertically than before because the deltas no longer sit below the headline.

Use `preview_eval`:
```js
(() => {
  const hero = [...document.querySelectorAll('section')].find(s => /GROWTH\+/.test(s.textContent));
  const deltaValues = [...hero.querySelectorAll('dl dd')];
  const tops = deltaValues.map(el => Math.round(el.getBoundingClientRect().top));
  const colsDifferent = new Set(tops).size > 1;
  return { tops, deltasStackedVertically: colsDifferent };
})()
```
Expected on desktop: `deltasStackedVertically: true` (different Y for each delta).

- [ ] **Step 5: Manual verify paused state**

Click `Boost active` toggle in Growth+ controls to pause. Scroll back to the hero.

Verify:
- Pill changes to muted "Paused · Pro" (on the left column in desktop, inline with chip).
- Headline changes to "Boost paused — billing continues."
- Deltas + hero number stay (they're historical — still true even when paused).

Toggle back to active.

- [ ] **Step 6: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusHero.jsx
git commit -m "$(cat <<'EOF'
refactor(growth-plus): hero 2-col on desktop, deltas to the right

Active page hero becomes a CSS grid on lg:+ — left column carries
the chip+pill row, hero number, headline; right column carries the
delta strip vertically. Uses the empty gradient space on desktop
that the original layout wasted. Hero number text-5xl/md:text-6xl
→ text-3xl/md:text-4xl. Mobile delta strip switches to a 3-col grid
so values (+12 / +84 / +143) align at the same Y; labels shortened
to today / week / month (no "this") so they don't wrap. Vertical-rule
separators dropped on mobile (the grid columns are the separator).
Resolves growth-plus-layout item 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Delete `GrowthPlusTierStrip` + update Active composition

**Why:** TierStrip duplicates info already in the hero pill (`Active · Pro`) and the Billing card upgrade ribbon. Deleting it tightens the page. Activity + Controls go 2-col on `lg:+` in the same commit since both changes touch `GrowthPlusActive.jsx`.

**Files:**
- Delete: `src/pages/growthPlus/GrowthPlusTierStrip.jsx`
- Modify: `src/pages/growthPlus/GrowthPlusActive.jsx`

- [ ] **Step 1: Verify no other consumers of `GrowthPlusTierStrip`**

Run: `grep -rn "GrowthPlusTierStrip\|TierStrip" src/ 2>/dev/null`

Expected: only references inside `GrowthPlusActive.jsx` (import + JSX render) and inside `GrowthPlusTierStrip.jsx` itself. If anything else references it, fix that first.

- [ ] **Step 2: Update `GrowthPlusActive.jsx`**

Open `src/pages/growthPlus/GrowthPlusActive.jsx`. Replace the entire file content with:

```jsx
import GrowthPlusActivity from './GrowthPlusActivity'
import GrowthPlusBillingCard from './GrowthPlusBillingCard'
import GrowthPlusControls from './GrowthPlusControls'
import GrowthPlusHero from './GrowthPlusHero'
import GrowthPlusMetricsStrip from './GrowthPlusMetricsStrip'

// Subscriber dashboard for the Growth+ page. Hero → metrics →
// [Activity + Controls 2-col on lg:+] → Billing. TierStrip removed:
// tier is already shown in the hero pill ("Active · Pro") and the
// Billing card's upgrade ribbon, so the strip was duplicating without
// new info.
//
// `account` is captured for future per-account data wiring — V1 mocks
// don't vary per account.
//
// eslint-disable-next-line no-unused-vars
export default function GrowthPlusActive({ account }) {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <GrowthPlusHero />
      <GrowthPlusMetricsStrip />
      <div className="grid grid-cols-1 gap-4 md:gap-5 lg:grid-cols-2 lg:items-start">
        <GrowthPlusActivity />
        <GrowthPlusControls />
      </div>
      <GrowthPlusBillingCard />
    </div>
  )
}
```

Three diffs vs. the current file:
1. Drop the `import GrowthPlusTierStrip` line.
2. Drop the `<GrowthPlusTierStrip />` render.
3. Wrap `<GrowthPlusActivity />` and `<GrowthPlusControls />` in a `grid lg:grid-cols-2 lg:items-start` container so they sit side-by-side on desktop. Mobile keeps single-column stacking.

- [ ] **Step 3: Delete `GrowthPlusTierStrip.jsx`**

Run: `git rm src/pages/growthPlus/GrowthPlusTierStrip.jsx`

Expected: `rm 'src/pages/growthPlus/GrowthPlusTierStrip.jsx'` — file is staged for deletion.

- [ ] **Step 4: Verify the deletion is clean**

Run: `grep -rn "TierStrip" src/ 2>/dev/null; echo "exit: $?"`

Expected: no output, `exit: 1` (no matches anywhere).

- [ ] **Step 5: Manual verify**

Reload preview at mobile. Subscribe via the upsell page if needed. Scroll the full page.

Verify:
- TierStrip is gone (was the thin row between Metrics and Activity).
- Sections render in order: Hero → Metrics → Activity → Controls → Billing.
- Mobile layout: all sections stack vertically.

Resize to desktop (1280×800). Verify:
- Activity feed and Controls card sit side-by-side as a 2-col grid (left + right).
- Their top edges align; bottom edges may differ (different heights).
- Billing card is full-width below.

Use `preview_eval`:
```js
(() => {
  const activity = [...document.querySelectorAll('section')].find(s => /Recent boost activity/.test(s.textContent));
  const controls = [...document.querySelectorAll('section')].find(s => /Growth\+ controls/.test(s.textContent));
  const ar = activity?.getBoundingClientRect();
  const cr = controls?.getBoundingClientRect();
  const sideBySide = ar && cr && Math.abs(ar.top - cr.top) < 5 && ar.right < cr.left;
  return { activityTop: ar?.top, controlsTop: cr?.top, sideBySideOnDesktop: sideBySide };
})()
```
Expected: `sideBySideOnDesktop: true` at desktop width.

- [ ] **Step 6: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusActive.jsx
git commit -m "$(cat <<'EOF'
refactor(growth-plus): drop TierStrip, 2-col Activity+Controls on lg:+

GrowthPlusTierStrip is removed entirely — tier is already visible in
the hero pill ("Active · Pro") and the Billing card upgrade ribbon,
so the strip was duplicating without new info. Activity feed and
Controls card now sit in a 2-col grid on lg:+ (mobile keeps single-
column stacking) to halve the page's vertical footprint between
metrics and billing. Resolves growth-plus-layout items 3 + 4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Controls polish — toggle alignment + "Engaged" label

**Why:** The Boost-active toggle aligns with the first line of its 2-line label because the row uses `items-start`. Changing to `items-center` vertically centers the toggle in the row. Separately, the third Quality option keeps wrapping to two lines on mobile (Lock icon + "Top accounts" exceeds the button width) — renaming to "Engaged" (one short word) fixes the wrap.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusControls.jsx`

- [ ] **Step 1: Update the toggle row alignment**

Open `src/pages/growthPlus/GrowthPlusControls.jsx`. Find the Boost-active row (search for `Boost active` inside a `<p>` tag, the parent `<div>` is the row):

```jsx
<div className="mt-4 flex items-start justify-between gap-3 border-t border-border pt-4">
  <div className="min-w-0">
    <p className="text-sm font-medium text-text-primary">Boost active</p>
```

Change `items-start` to `items-center`:

```jsx
<div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
```

That single token change is the entirety of Item 5.

- [ ] **Step 2: Update the `QUALITY_OPTIONS` third entry**

Find the `QUALITY_OPTIONS` array near the top of the file:

```js
const QUALITY_OPTIONS = [
  { value: 'broad', label: 'Broad', note: 'Wider reach across audiences.' },
  { value: 'targeted', label: 'Targeted', note: 'Match your niche; balanced reach + engagement.' },
  { value: 'top', label: 'Top accounts', note: 'Active accounts likely to like + save.' },
]
```

Change the third entry's `label` from `'Top accounts'` to `'Engaged'`. The `value: 'top'` key stays — only the user-visible label changes. `note` is unchanged.

After:

```js
const QUALITY_OPTIONS = [
  { value: 'broad', label: 'Broad', note: 'Wider reach across audiences.' },
  { value: 'targeted', label: 'Targeted', note: 'Match your niche; balanced reach + engagement.' },
  { value: 'top', label: 'Engaged', note: 'Active accounts likely to like + save.' },
]
```

- [ ] **Step 3: Manual verify**

Reload preview at mobile (375). Subscribe → scroll to Growth+ controls.

Verify toggle:
- Boost active toggle is vertically centered in the row (aligns with the midpoint of the 2-line label, not the top of the first line).

Verify Quality segment:
- Reads `Broad · Targeted · Engaged` on one line.
- Engaged is locked with a Lock icon (the user is on Pro by default; Engaged unlocks at Elite). Lock + "Engaged" fits on one line.

Use `preview_eval`:
```js
(() => {
  const controls = [...document.querySelectorAll('section')].find(s => /Growth\+ controls/.test(s.textContent));
  const toggleRow = [...controls.querySelectorAll('div.flex')].find(d => d.querySelector('button[role="switch"]'));
  const toggleRowClass = toggleRow?.className;
  const qualityBtns = [...controls.querySelectorAll('button')].filter(b => /^(Broad|Targeted|Engaged|Top accounts)$/.test(b.textContent.trim()));
  const heights = qualityBtns.map(b => Math.round(b.getBoundingClientRect().height));
  const allEqualHeight = heights.every(h => Math.abs(h - heights[0]) < 2);
  return {
    toggleRowItemsCenter: toggleRowClass?.includes('items-center'),
    qualityLabels: qualityBtns.map(b => b.textContent.trim()),
    qualityHeights: heights,
    allQualitySameHeight: allEqualHeight,
  };
})()
```
Expected: `toggleRowItemsCenter: true`, `qualityLabels: ['Broad', 'Targeted', 'Engaged']`, `allQualitySameHeight: true`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusControls.jsx
git commit -m "$(cat <<'EOF'
fix(growth-plus): center boost toggle + rename Top accounts → Engaged

Two single-line fixes in GrowthPlusControls.jsx:

- Boost-active row: items-start → items-center so the toggle vertically
  aligns with the 2-line label's midpoint, not the first line.
- Quality segment: third option label "Top accounts" → "Engaged" so
  it fits on one line alongside the Lock icon on mobile. Three single-
  word labels (Broad · Targeted · Engaged) read with parallel rhythm.
  The value key 'top' stays — only the user-visible label changes,
  no gating logic is affected.

Resolves growth-plus-layout items 5 + 6.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

- [ ] **Step 1: Full sweep**

With the dev server running, sweep both states at mobile (375×812) and desktop (1280×800):

**Upsell page (non-subscriber, default mocks):**
- Hero is smaller (~200px tall on mobile, was ~330px).
- 3 benefit icons sit inside the hero — vertical column on mobile, horizontal row on `sm:+`.
- Pricing tier grid sits directly below the hero. First pricing card (`Starter`) reaches above the fold on mobile.
- No standalone benefit-card section anywhere on the page.
- FAQ below the pricing grid.

**Active page (subscriber via the upsell flow):**
- Mobile:
  - Hero: chip + `Active · Pro` pill on a row, then smaller hero number, headline, then 3-col delta grid (`+12 today / +84 week / +143 month`) with values aligned vertically.
  - 3 metric cards (Post reach lift / Engagement rate / Boosted posts) stacked vertically.
  - No `You're on Pro` tier strip.
  - Activity feed.
  - Controls card: Boost-active toggle vertically centered. Quality segment reads `Broad · Targeted · Engaged` on one line.
  - Billing card.
- Desktop:
  - Hero is a 2-col grid: chip+pill row + number + headline on the left; 3 deltas stacked vertically on the right with a left-border separator.
  - 3 metric cards in a 3-col grid (unchanged).
  - Activity feed + Controls card side-by-side as a 2-col grid.
  - Billing card full-width.

**Paused state (after toggling Boost active OFF):**
- Hero pill changes to muted `Paused · Pro`. Headline reads `Boost paused — billing continues`. Deltas + number stay.
- On desktop, the pill sits inline with the chip in the left column (not pushed to the right edge of the hero).

- [ ] **Step 2: Check git log**

```bash
git log --oneline -5
```

Expected: four new commits on top of the spec commit (`c6a2fb1`):
- `fix(growth-plus): center boost toggle + rename Top accounts → Engaged`
- `refactor(growth-plus): drop TierStrip, 2-col Activity+Controls on lg:+`
- `refactor(growth-plus): hero 2-col on desktop, deltas to the right`
- `refactor(growth-plus): merge upsell benefits into hero + shrink`

- [ ] **Step 3: Confirm orphan files don't exist**

Run: `ls src/pages/growthPlus/GrowthPlusTierStrip.jsx 2>&1`

Expected: `ls: src/pages/growthPlus/GrowthPlusTierStrip.jsx: No such file or directory`.

---

## Notes for the implementer

- The codebase has no automated test suite. Verification is manual via the preview MCP server.
- Use `preview_inspect` over `preview_screenshot` for verifying className changes — screenshots are unreliable for exact pixel checks.
- Task 2's hero 2-col grid uses `lg:grid-cols-[1fr_auto]` so the right column auto-sizes to its content (the delta stack). The `auto` keyword is important — `1fr_1fr` would split the hero into equal halves, which is wrong (the deltas need less horizontal room than the headline).
- The `Active · Pro` pill loses `ml-auto` on `lg:+` but keeps it on mobile (responsive). The `lg:ml-0` token does this in a single class.
- After Task 3, the section order in `GrowthPlusActive` is: Hero → MetricsStrip → 2-col(Activity, Controls) → Billing. Don't add TierStrip back unless a future spec explicitly requires it.
- Task 4's `value: 'top'` key is unchanged on purpose — only the user-visible label moves to `Engaged`. The gating logic in `useGrowthConfig` and `mockGrowthPlusTiers` references `'top'` directly; renaming the value would require updating those too.
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
- After Task 4, run `grep -r "Top accounts" src/` to confirm zero hits. If anything else references the old label, fix it.
