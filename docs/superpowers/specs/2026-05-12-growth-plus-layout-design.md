# Growth+ Layout Pass — Design Spec

**Date:** 2026-05-12
**Goal:** Tighten layout density across both Growth+ states. Upsell page hero merges the benefit cards into a compact icon-row and shrinks the hero shell. Active subscriber page hero gets a 2-col layout with the delta strip moved to the right column, hero number shrinks, mobile delta strip stops wrapping. `TierStrip` is removed entirely. Activity + Controls go 2-col on `lg:+`. Boost toggle vertically centers in its row. Quality `Top accounts` segment renames to `Engaged`.

**Architecture:** Touches the existing growthPlus tree only. One file delete (`GrowthPlusTierStrip.jsx` becomes orphaned). No new components. No new mock data — the existing per-tier insights/deltas already drive everything.

**Tech stack:** React, Tailwind, Lucide. No new dependencies.

**Source:** 2026-05-12 review pass on the freshly-merged mobile-session tier work.

---

## Item 1 — Upsell page: merge benefits into hero + shrink

**Why:** The hero card today is ~330px tall on mobile (large chip + 2-line headline + 3-line body). The 3 benefit cards below the pricing cards (Algorithmic post boosting / Active-account engagement / Throttled to stay safe) describe what Growth+ IS — they belong with the hero, not floating below the pricing tier grid. Merging shrinks the page (so pricing cards are visible above the fold on mobile) and removes the visual confusion that makes the benefit cards read as a 4th tier of pricing.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusUpsell.jsx`

### Hero shell — smaller padding, smaller chip, single-line body

Replace the current hero `<section>` block (lines 75–89 in the current file) with:

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
        <li key={b.title} className="flex items-center gap-2 text-xs text-text-secondary">
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

**Six diffs vs. the current hero block:**
1. Padding `p-6 md:p-10` → `p-5 md:p-7`.
2. Sparkles chip `h-14 w-14` → `h-10 w-10 md:h-12 md:w-12`.
3. Sparkles icon `h-7 w-7` → `h-5 w-5 md:h-6 md:w-6`.
4. Headline `text-2xl md:text-3xl` → `text-xl md:text-2xl`.
5. Body trimmed to one sentence — dropped the "Stack it on top of Targeted Growth for compound results" sentence. (Differentiator copy belongs in the FAQ; the hero is the introduction.)
6. New `<ul>` benefit-icon-row at the bottom of the hero — replaces the separate 3-card benefit grid (removed in the next step).

### `BENEFITS` constant — add `shortLabel`, drop `body`

Update the constant at the top of the file:

```jsx
const BENEFITS = [
  {
    icon: Sparkles,
    shortLabel: 'Algorithmic boost',
  },
  {
    icon: Network,
    shortLabel: 'Active accounts',
  },
  {
    icon: ShieldCheck,
    shortLabel: 'IG-safe',
  },
]
```

`title` and `body` fields are dropped because the inline icon-row only needs `shortLabel`. The FAQ at the bottom of the page still explains the safety / engagement story.

### Delete the standalone benefits `<section>`

Remove the entire 3-card grid section (lines 97–120 in the current file — the `<section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">` block containing the `BENEFITS.map`). The icon-row inside the hero replaces it.

**Page section sequence on Upsell after this:**
1. Hero (chip + headline + 1-line body + 3-icon row)
2. Pricing tier grid (3 cards)
3. FAQ

**Acceptance (mobile 375):**
- Hero card height drops from ~330px to ~200px. The first pricing card (Starter) is now visible above the fold without scrolling, or with only ~50px scroll.
- The 3 benefit icons sit at the bottom of the hero in a vertical column on mobile (`flex-col`) and a horizontal row on `sm:+` (`sm:flex-row`).
- No standalone benefit card section anywhere on the page.

---

## Item 2 — Active page: hero 2-col layout on desktop, delta strip moves right

**Why:** On desktop the hero card has ~50% empty space to the right of the number. The delta strip (`+12 today · +84 this week · +143 this month`) currently sits below the headline as a horizontal row, taking vertical space the hero doesn't need. Moving the delta strip to a right column on `lg:+` packs the hero into a denser block; on mobile the delta strip stays below the headline but gets a vertical-alignment fix.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusHero.jsx`

### Hero number shrinks

`text-5xl md:text-6xl` → `text-3xl md:text-4xl`. The `+143` is still the page's hero element but doesn't shout.

### Two-column layout on `lg:+`

The hero's outer `<section>` becomes a CSS grid that's single-column on mobile and 2-column on `lg:+`. The 2 cols are: left (chip row + number + headline) and right (delta strip).

Final hero shape:

```jsx
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
```

**Six diffs:**
1. Outer `<section>` wraps a new `<div>` that is `lg:grid lg:grid-cols-[1fr_auto] lg:items-center lg:gap-8`. Mobile + tablet stay single-column.
2. Hero number `text-5xl md:text-6xl` → `text-3xl md:text-4xl`.
3. Delta strip on mobile: switched from `flex items-center gap-4` (with vertical-rule separators) to `grid grid-cols-3 gap-3` — three equal-width columns so each delta column is the same width and the values line up at the same Y position regardless of label length.
4. Delta strip on `lg:+`: switched to `flex-col items-end gap-3` — vertical stack on the right column of the hero grid, with a left-border separator and 24px left padding to read as a sibling column.
5. Delta labels shortened from `today / this week / this month` to `today / week / month` so they don't wrap on mobile. The 3rd delta's label `month` no longer duplicates the headline's `this month` (more breathing room).
6. The `Active · Pro` pill loses its `ml-auto` on `lg:+` — on desktop it sits inline with the chip and GROWTH+ eyebrow within the left column rather than pushing all the way right. (Mobile keeps `ml-auto`.)

### Inline `DeltaItem` change

Update `DeltaItem` to handle both layouts:

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

On mobile: vertical stack (value above label) so each delta is a tight column. On `lg:+`: horizontal value+label inline so the right column reads compactly.

**Acceptance:**
- Mobile: the 3 deltas align in a 3-col grid below the headline. Each value (`+12 / +84 / +143`) sits at the same Y position. Labels (`today / week / month`) don't wrap.
- Desktop (`lg:+`): the hero is a 2-col grid. Left col contains the chip+pill row + hero number + headline. Right col contains the 3 deltas stacked vertically with a left-border separator.

---

## Item 3 — Remove `GrowthPlusTierStrip`

**Why:** The tier is already shown in the hero pill (`Active · Pro`) and the Billing card has an upgrade ribbon ("Upgrade to Elite for $99/mo") when applicable. The TierStrip duplicates without adding new information. Removing it shortens the page and tightens the visual hierarchy.

**Files:**
- Delete: `src/pages/growthPlus/GrowthPlusTierStrip.jsx`
- Modify: `src/pages/growthPlus/GrowthPlusActive.jsx`

### `GrowthPlusActive.jsx` updates

Remove the import of `GrowthPlusTierStrip` and the `<GrowthPlusTierStrip />` render. With Item 4 below, this also changes the section order/layout.

**Acceptance:** `GrowthPlusTierStrip.jsx` no longer exists. `grep -r "TierStrip" src/` returns zero hits.

---

## Item 4 — Activity + Controls in 2-col on desktop

**Why:** Activity feed (~386px) and Controls card (~478px) are both tall sections stacked vertically. On desktop they fit comfortably side-by-side, halving the page's vertical footprint above the Billing card.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusActive.jsx`

### Composition

Replace the current `GrowthPlusActive` return with:

```jsx
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

**Three diffs:**
- Drop `import GrowthPlusTierStrip` and the `<GrowthPlusTierStrip />` render (Item 3).
- Wrap `<GrowthPlusActivity />` and `<GrowthPlusControls />` in a `grid lg:grid-cols-2 lg:items-start` container so on `lg:+` they sit side-by-side. `items-start` lets them have different heights without stretching.
- New section order: Hero → MetricsStrip → [Activity | Controls 2-col] → Billing. No TierStrip.

**Acceptance:**
- Mobile: Activity and Controls stack vertically as before.
- Desktop (`lg:+`): Activity (left) and Controls (right) sit side-by-side in a 2-col grid. Top edges align; bottom edges may differ.
- Billing card is full-width below the 2-col block.

---

## Item 5 — Boost toggle vertically centered

**Why:** The "Boost active" row has a 2-line label (title + subline `Pause boost while keeping your subscription.`). The toggle currently aligns with the FIRST line of the label because the row uses `items-start`. Visually awkward — looks misaligned. Centering on the row's full height fixes it.

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusControls.jsx`

### Change

Find the "Boost active" row:

```jsx
<div className="mt-4 flex items-start justify-between gap-3 border-t border-border pt-4">
```

Replace with:

```jsx
<div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
```

Single-character change: `items-start` → `items-center`.

**Acceptance:** Toggle's vertical center aligns with the midpoint of the 2-line label.

---

## Item 6 — Quality segment: `Top accounts` → `Engaged`

**Why:** Even after the prior rename, `Top accounts` still wraps to 2 lines on mobile inside the Quality segmented control when the `Lock` icon is also present. `Engaged` is one short word — fits cleanly. Pairs with `Broad · Targeted · Engaged` (3 single-word labels, parallel rhythm). The tradeoff note below already explains: "Active accounts likely to like + save."

**Files:**
- Modify: `src/pages/growthPlus/GrowthPlusControls.jsx`

Find the third `QUALITY_OPTIONS` entry:

```js
{ value: 'top', label: 'Top accounts', note: 'Active accounts likely to like + save.' },
```

Replace with:

```js
{ value: 'top', label: 'Engaged', note: 'Active accounts likely to like + save.' },
```

`value: 'top'` stays — only the user-visible `label` changes. No other consumers reference the label string; the value key drives all gating logic and is unchanged.

**Acceptance:** Quality segmented control reads `Broad · Targeted · Engaged` on a single line at all viewport widths, including with the Lock icon prefix on `Engaged` when the user is on Starter or Pro.

---

## Out of scope (deferred for future polish if surfacing matters)

- The 3 metric cards (Post reach lift / Engagement rate / Boosted posts) below the hero — kept as-is per Q1 clarification. The user explicitly confirmed only the delta strip moves right; the metric strip stays untouched.
- "Active-account engagement" benefit-card body copy is dropped entirely — short labels only. If marketing wants the descriptions back, they go in the FAQ.
- Hero `previewMode` prop — already dropped during the mobile session's locked-preview removal; not reintroduced.

---

## Implementation notes for the plan

- Tasks in dependency order:
  1. Upsell hero + benefits merge (Item 1) — most code change.
  2. Hero 2-col + delta strip move (Item 2) — biggest visual change on the active page.
  3. Delete `TierStrip` file (Item 3).
  4. Active composition root: drop TierStrip + add 2-col (Items 3 + 4 together).
  5. Toggle alignment (Item 5).
  6. `Top accounts` → `Engaged` (Item 6).
- The codebase has no automated test suite; verification is manual via the Claude Preview MCP server at mobile (375×812) and desktop (1280×800).
- After Item 2, manually verify all three hero states: subscribed + boost on, subscribed + boost paused, and (if reachable) the Upsell page render that doesn't render this component. Boost paused at desktop should show the muted pill on the LEFT column, not the right.
- After Item 4, the page should pass visually at mobile (stacked) and desktop (Activity left, Controls right). Verify the boost toggle stays vertically centered in BOTH layouts.
- After Item 6, run `grep -r "Top accounts" src/` and `grep -r "TierStrip" src/` to confirm zero hits.
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
