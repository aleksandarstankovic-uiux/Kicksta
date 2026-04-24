# Growth Page v3 — Design Spec

**Date:** 2026-04-24
**Supersedes (partially):** `2026-04-24-growth-page-v2-design.md`
**Scope:** Second rework of the Growth page. v1 was form-shaped and too tall. v2 added a 2-column grid but was still busy and variable-height. v3 flips the model: the page becomes a **settings dashboard** — direct controls for the frequent stuff, summary rows with focused drawers for the complex stuff. Fixed heights by default.

---

## Why v3 exists

Three concrete pain points from the v2 page:

1. **Filters was a wall.** 6 dials visible at once, 3 of them identical preset+custom components, with expanding Min/Max inputs that changed page height.
2. **Variable heights broke the layout.** Toggling Welcome DM revealed a 4-row textarea; toggling Close Friends revealed a segmented sub-control; opening Custom on any filter grew the Filters card. Scanning the page was hard because each flip changed what came below.
3. **Growth+ was oversized.** Desktop left the right column mostly empty because the CTA didn't need that much space.

v3's thesis: **most users change these settings rarely**. The page should read like a configured state, not a form. Complex editing moves behind drawers; the page itself stays stable.

---

## Goals

1. Page height stays (roughly) fixed under normal interaction on desktop and mobile.
2. Filters become a scannable summary, not a wall of dials. Editing lives in a drawer.
3. Growth+ compacts to a one-line banner — no wasted space.
4. Mode + Engagement stay directly editable (they're the frequent knobs). Their sub-controls that change page height move to modals.
5. Visual rhythm still matches Overview + Targeting: same card recipe, same spacing scale, same drawer/modal animation primitives.

---

## Non-goals

- No change to `useGrowthConfig` or `useLists` store APIs.
- No change to `SettingSwitch` or `UpgradeBottomSheet` primitives.
- No new shared components beyond this page.
- No content changes to mock data.
- No Growth+ subscriber variant overhaul beyond fitting the new compact banner.

---

## 1. Page layout

### Desktop (`lg:+`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Safety strip                                                    │
├──────────────────────────────────────────────────────────────────┤
│  Mode card (3 option cards, full-width)                          │
├────────────────────────┬─────────────────────────────────────────┤
│                        │  Filters summary row   [Customize]      │
│  Engagement card       ├─────────────────────────────────────────┤
│  (3 toggle rows)       │  Lists summary row     [Manage]         │
│                        │                                         │
├──────────────────────────────────────────────────────────────────┤
│  Growth+ compact banner (one line, full-width)                   │
└──────────────────────────────────────────────────────────────────┘
```

- Engagement sits in the left column, Filters summary + Lists summary stack in the right column.
- Heights should match naturally (Engagement = 3 rows; Filters summary + Lists summary = ~2 short cards stacked).
- Grid CSS (unchanged from v2): `grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]`. Actually re-balanced for v3 because Filters/Lists are now shorter: use `lg:grid-cols-2` (equal columns), since both sides are now compact.

### Mobile

Single column, stacked: Safety → Mode → Engagement → Filters summary → Lists summary → Growth+.

---

## 2. Safety strip

**Unchanged from v1/v2.**

---

## 3. Mode card

**Unchanged from v2.** 3 elevated option cards with icons + `Recommended` on Auto. Already fixed-height.

---

## 4. Engagement card — Welcome DM moves to modal

Keep the 3-row layout. Only change: Welcome DM.

### Welcome DM row (revised)

- Unchanged: title, description, switch, plan-gating, locked treatment.
- **When enabled and unlocked:** the inline textarea + character counter are **removed** from the card.
- Replace with a small secondary link beneath the description row: `Edit message` (text + `Pencil` Lucide icon, `text-xs text-text-secondary hover:text-text-primary`). Only renders when `welcomeDm.enabled === true`.
- Tapping `Edit message` → opens the new `WelcomeDmModal`.

### `WelcomeDmModal` (new file: `src/pages/growth/WelcomeDmModal.jsx`)

Same visual treatment as `UpgradeBottomSheet` / `AddTargetSheet` (fade + slide animation on mount, Escape to close, bottom sheet on mobile / centered modal on desktop).

Contents:
- Header: `Welcome DM message` + close X.
- Body: a short helper (`Sent to new followers after they follow you back.`) + textarea (4 rows, 200 chars max, default value from store) + character counter.
- Footer: `Cancel` (discards) + `Save` primary. Save writes via `setWelcomeDmMessage(value)` then closes.

Why a modal, not the existing inline approach: v3 requires fixed-height components; the textarea was the biggest height-changer on the page.

### Close Friends row (unchanged from v2)

The inline segmented `Add / Remove` sub-control stays — it adds ~60px when enabled, which is acceptable (the rest of the page is fixed-height; one row's ~60px expansion is fine, and it's an important state to keep visible).

### Like after follow row (unchanged)

Just a switch.

---

## 5. Filters — summary row + drawer

**This is the biggest change.** The Filters card is no longer a big form; it's a compact row with a summary of the current filter state + a `Customize` button that opens a focused drawer.

### Summary card (in-page)

Fixed height, single row of content:

```
┌──────────────────────────────────────────────────────────────┐
│ Filters                                                      │
│ Public accounts · 1K–50K followers · NSFW excluded [Customize]│
└──────────────────────────────────────────────────────────────┘
```

Anatomy:
- Title `Filters` + small sub: `Who Kicksta targets.`
- Summary line: the configured filters compressed to a single sentence. Built from current state via a small helper:
  - Only non-default dials are mentioned. e.g. if `accountPrivacy === 'all'` it's not listed. If `followerMax === null`, it's `1K+ followers` etc.
  - Separator: `·` between clauses.
  - Fallback when all filters are default: `All accounts — no restrictions.`
- Right-aligned `Customize` button: `h-9 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary hover:bg-bg`. Includes a `SlidersHorizontal` Lucide icon.

Mobile: the summary line + `Customize` button stack (summary on top, full-width button below).

### `FiltersDrawer` (new file: `src/pages/growth/FiltersDrawer.jsx`)

All 6 filter dials move here. The existing v2 `FiltersCard` component contents become the drawer body (FilterRow, SegmentedPills, PresetRangePills, InfoTooltip, etc. — same building blocks).

Surface:
- Mobile: bottom sheet, rounded top, up to `max-h-[85vh]` scrollable.
- Desktop: centered modal, `max-w-2xl` (wider than typical since filters have content). Fade + slide animation consistent with other sheets.

Layout:
- Header: `Customize filters` + close X.
- Body (scrollable):
  - `FilterRow` rows for all 6 filters, same layout as v2 (label left, control right on `lg:`, stacked on mobile).
  - `InfoTooltip` still works inside the drawer on desktop.
- Footer: `Done` primary button (closes the drawer). No Save/Cancel — changes auto-save via the store as the user fiddles.

Interaction:
- Opening the drawer: each control is pre-filled from store.
- Changing a control: fires `setFilter(key, value)` → debounced toast via `useGrowthConfig`'s `announceSaved()`.
- Closing the drawer: just closes. No commit step.

### Summary helper

```js
// src/pages/growth/filterSummary.js  (new tiny helper)
import { formatCount } from '@/utils/formatCount'

function rangeLabel(min, max, unit) {
  if (min === 0 && max === null) return null
  if (min === 0) return `Up to ${formatCount(max)} ${unit}`
  if (max === null) return `${formatCount(min)}+ ${unit}`
  return `${formatCount(min)}–${formatCount(max)} ${unit}`
}

export function summarizeFilters(filters) {
  const parts = []
  const follower = rangeLabel(filters.followerMin, filters.followerMax, 'followers')
  if (follower) parts.push(follower)
  const following = rangeLabel(filters.followingMin, filters.followingMax, 'following')
  if (following) parts.push(following)
  const media = rangeLabel(filters.mediaMin, filters.mediaMax, 'posts')
  if (media) parts.push(media)
  if (filters.accountPrivacy === 'public') parts.push('Public only')
  else if (filters.accountPrivacy === 'private') parts.push('Private only')
  if (filters.genderTarget === 'male') parts.push('Male accounts')
  else if (filters.genderTarget === 'female') parts.push('Female accounts')
  if (filters.excludeNsfw) parts.push('NSFW excluded')
  if (parts.length === 0) return 'All accounts — no restrictions.'
  return parts.join(' · ')
}
```

Keep this file tiny — used only by `FiltersCard`.

---

## 6. Lists — summary row + drawer

Same pattern as Filters.

### Summary card (in-page)

```
┌──────────────────────────────────────────────────────────────┐
│ Lists                                                        │
│ Whitelist (2) · Blacklist (0)                     [Manage]   │
└──────────────────────────────────────────────────────────────┘
```

- Title `Lists` + sub: `Accounts Kicksta never unfollows or always avoids.`
- Summary line: `Whitelist (N) · Blacklist (M)`. No state-specific text.
- Right-aligned `Manage` button (same shape as Filters' `Customize` but without the icon, or with `List` icon).

### `ListsDrawer` (new file: `src/pages/growth/ListsDrawer.jsx`)

The full v2 `ListsCard` content (tabs + typeahead + entries) moves here.

Surface:
- Mobile: bottom sheet.
- Desktop: centered modal `max-w-md`.
- Same fade + slide animation.

Header + body + footer:
- Header: `Manage lists` + close X.
- Body: tabs (`Whitelist` / `Blacklist`) → tab sub → typeahead input with must-pick → entries list.
- Footer: `Done` primary (closes).

---

## 7. Growth+ — compact banner (one line on desktop)

New treatment: matches the Overview `GrowthPlusBanner` pattern so the two surfaces read as the same product across the dashboard.

### Non-subscriber variant

Desktop: one-row layout.

```
┌────────────────────────────────────────────────────────────────────┐
│ [✨] GROWTH+  Algorithmic reach, on autopilot.         [Add →]    │
└────────────────────────────────────────────────────────────────────┘
```

- Container: `rounded-xl border border-purple-base/20 bg-purple-tint/30 px-5 py-4 mt-4 flex items-center gap-4`.
- Icon chip: 40×40 `rounded-xl bg-purple-base/15 text-purple-text flex items-center justify-center` + `Sparkles` icon.
- Content (flex-1):
  - Eyebrow: `GROWTH+` small uppercase purple.
  - Headline: `Algorithmic reach, on autopilot.` — `text-base font-semibold text-text-primary`.
  - Sub line (optional, desktop only): `Separate from Targeted Growth. Cancel any time.` — `text-xs text-text-muted`.
- Right side: `Add Growth+ →` button, purple primary, `h-9 px-4 text-sm`.

Mobile: stacks — icon + content on top, CTA full-width below.

### Subscriber variant

Keep the v2 subscriber layout (compact, `Active/Paused` pill + toggle + manage link) but trim padding to match the non-subscriber's height.

### "Benefits" content

Removed from the banner entirely. Moved to the Growth+ signup page (out of scope here) or behind a `Learn more` link that opens a small info modal — **skip for V1** (YAGNI). Users who want to know more click `Add Growth+` and see everything on the signup page.

---

## 8. Page grid — rebalanced

The v2 grid was `grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]` because Filters was tall. With Filters now a summary row, the grid rebalances.

```jsx
<div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
  <EngagementCard onRequestUpgrade={openUpgrade} />
  <div className="flex flex-col gap-4">
    <FiltersCard onCustomize={() => setFiltersOpen(true)} />
    <ListsCard onManage={() => setListsOpen(true)} />
  </div>
</div>
```

- Engagement on the left, Filters summary + Lists summary stack on the right.
- Equal columns (`lg:grid-cols-2`).
- `lg:items-start` so the columns don't stretch each other.

Mobile: single column, stacked.

---

## 9. Fixed-height audit

Everything that changes page height vs. v2:

| Component | v2 behavior | v3 behavior |
|-----------|-------------|-------------|
| Welcome DM textarea | Inline, expanded when enabled (+~120px) | Moved to modal (0px impact on page) |
| Close Friends segmented | Inline, expanded when enabled (+~60px) | Unchanged (~60px expansion allowed) |
| Filters Custom Min/Max | Inline, expanded when Custom picked (+~48px per row, up to 3 rows) | Drawer-only (0px impact on page) |
| Filters full UI | Whole card was tall | Card is now a summary row (~1 line tall) |
| Lists entries | Inline, variable with entry count | Drawer-only (0px impact on page) |
| Growth+ banner | Variable (taller with benefits list) | Fixed one-row height on desktop |

Net: the only remaining page-height change is the Close Friends segmented sub-control (~60px, one state). Everything else is fixed.

---

## 10. File-level diff

**Modified:**
- `src/pages/growth/index.jsx` — grid rebalanced, new state for drawer/modal open flags, new props on FiltersCard/ListsCard.
- `src/pages/growth/EngagementCard.jsx` — Welcome DM textarea replaced with `Edit message` link opening modal.
- `src/pages/growth/FiltersCard.jsx` — rewritten as summary + `Customize` button.
- `src/pages/growth/ListsCard.jsx` — rewritten as summary + `Manage` button.
- `src/pages/growth/GrowthPlusCard.jsx` — compact one-row banner.

**Created:**
- `src/pages/growth/FiltersDrawer.jsx` — the v2 filters UI, moved here.
- `src/pages/growth/ListsDrawer.jsx` — the v2 lists UI, moved here.
- `src/pages/growth/WelcomeDmModal.jsx` — textarea edit modal.
- `src/pages/growth/filterSummary.js` — `summarizeFilters(filters)` helper.

**Unchanged:**
- `src/pages/growth/ModeCard.jsx` · `SafetyStrip.jsx` · `PresetRangePills.jsx`.
- `src/components/SettingSwitch.jsx` · `UpgradeBottomSheet.jsx`.
- All stores and mocks.

---

## 11. Out of scope (V3 deferrals)

- `Learn more` modal for Growth+ benefits — dropped, benefits on signup page only.
- Undo / confirmation on removing a list entry from the drawer.
- Filter presets ("Casual / Active / Influencer") — no preset profiles; users tune dials directly.
- Save/Cancel in Filters drawer — auto-save is preserved.
- Any backend or persistence work.

---

## 12. Success criteria

- Page height (desktop) is stable across all interactions except enabling Close Friends (+~60px).
- Filters card reads as a single sentence the user can parse in one glance.
- Lists card reads as entry counts + Manage button.
- Growth+ banner is one row on desktop (no empty right zone).
- Engagement card: toggles feel identical to v2; Welcome DM message edit flows through a modal.
- All existing v2 behavior preserved: auto-save debounced toast, plan-gating, must-pick typeahead, segmented close-friends mode.
- Mobile: everything stacks; drawers/modals render as bottom sheets.
- No console errors; dark mode intact.
