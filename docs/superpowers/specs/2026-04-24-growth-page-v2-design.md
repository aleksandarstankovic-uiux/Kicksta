# Growth Page v2 — Design Spec

**Date:** 2026-04-24
**Supersedes (partially):** `2026-04-24-growth-page-design.md`
**Scope:** Comprehensive rework of the Growth page. The v1 build shipped the right *components* but the wrong *composition* — too tall, too sparse, too many identical sub-patterns stacked. v2 keeps the underlying features intact and rearranges them into a denser, 2-column desktop layout with component-level redesigns for Mode, Engagement, Filters, Lists, and Growth+.

---

## Goals

1. Kill the "mostly empty and very vertical" feel by using a 2-column grid on desktop.
2. Mode becomes the page's primary decision — bigger, more explanatory, Auto marked as recommended.
3. Engagement densifies with rich sub-controls (Welcome DM message editor, Close Friends add/remove mode).
4. Filters become compact inline rows — one line per filter.
5. Lists gains a proper typeahead on add (must-pick, fixture-backed), matching the Add Target pattern.
6. Growth+ gets the page-closing hero treatment with a benefit list.

---

## Non-goals

- No change to `useGrowthConfig`'s public API beyond extending Close Friends shape.
- No change to `useLists`'s API.
- No change to `SettingSwitch` or `UpgradeBottomSheet` — both reused as-is.
- No backend wiring; everything mocked.
- No cross-page changes (Overview, Targeting, etc. remain untouched).

---

## 1. Page layout (Grid A)

### Desktop (`lg:+`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Safety strip                                                    │
├──────────────────────────────────────────────────────────────────┤
│  Mode card  (3 option cards side-by-side)                        │
├─────────────────────────────┬────────────────────────────────────┤
│  Engagement card            │                                    │
│  (narrower)                 │  Filters card                      │
├─────────────────────────────┤  (wider, dense inline rows)        │
│  Lists card                 │                                    │
│  (narrower)                 │                                    │
├──────────────────────────────────────────────────────────────────┤
│  Growth+ hero banner  (full-width, benefits list)                │
└──────────────────────────────────────────────────────────────────┘
```

### Mobile

Single column, stacked in reading order: Safety strip → Mode → Engagement → Filters → Lists → Growth+.

### Implementation

- Page wrapper: `mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8`.
- Grid container for the middle two rows:
  ```jsx
  <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
    <div className="flex flex-col gap-4">
      <EngagementCard />
      <ListsCard />
    </div>
    <FiltersCard />
  </div>
  ```
  - `minmax(0,1fr)_minmax(0,1.45fr)` sizes the left column narrower; Filters takes the wider right column.
- Safety strip + Mode + Growth+ are full-width — not inside the grid.

---

## 2. Safety strip

**Unchanged from v1.** Ambient blue-tint strip, `Shield` icon + safety copy.

---

## 3. Mode card (redesigned)

**Layout:** full width. 3 elevated selection cards, side-by-side on `lg:+`, stacked on mobile.

**Header:**
- `<h2>Mode</h2>` (`text-base font-semibold text-text-primary`).
- Sub: `How Kicksta grows your account. You can change this any time.` (`text-sm text-text-secondary mt-1`).

**Cards grid:** `mt-4 grid gap-3 lg:grid-cols-3`.

### Individual option card

- Base class: `relative flex flex-col gap-2 rounded-xl border p-4 lg:p-5 text-left cursor-pointer transition-all`.
- Unselected: `border-border bg-surface hover:border-border-strong`.
- Selected: `border-blue-base bg-blue-tint/40 shadow-sm`.
- Icon chip at top: 40×40 rounded square, phase-icon color matching the action.
- Title row: icon `h-5 w-5` + `text-sm font-semibold text-text-primary` + optional `Recommended` pill.
- Description: `text-xs leading-relaxed text-text-secondary`.

### Options

| Value | Icon | Label | Icon chip bg | Description |
|-------|------|-------|--------------|-------------|
| `auto` | `Zap` | Auto | `bg-green-tint text-green-text` | `Follow new users, like their posts, then unfollow after a period. The complete growth loop — recommended for most users.` |
| `follow_only` | `UserPlus` | Follow-only | `bg-blue-tint text-blue-text` | `Follow new users from your targets. No unfollows. Use when you want to build a following list manually.` |
| `unfollow_only` | `UserMinus` | Unfollow-only | `bg-bg text-text-secondary` | `Clean up users who didn't follow back. No new follows. Good for trimming a bloated following count.` |

**Recommended pill** (on Auto only): `rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text` — next to the title.

**Selected indicator** (top-right corner of the selected card): `<Check className="h-4 w-4 text-blue-base" />` absolute-positioned.

**Interaction:** click anywhere on a card → `setMode(value)` → debounced toast fires.

---

## 4. Engagement card (redesigned)

**Layout:** narrower column (left). Three rows via `SettingSwitch`.

**Header:** `Engagement` + sub `How Kicksta interacts with new followers.`

### Row 1 — Like after follow

Unchanged. Just a switch, no sub-control.

### Row 2 — Welcome DM

Switch + message textarea below when enabled (v1 behavior preserved). Plan-gated for Growth plan users.

### Row 3 — Close Friends Adder (new sub-control)

Switch + when enabled, a **segmented sub-control** appears below the switch row:

```
┌──────────────────────────────────────────────────┐
│ ⭐ Close Friends Adder                 [on ◉]   │
│    Automatically manage your Close Friends list. │
│                                                  │
│  ┌──────────────┬──────────────┐                 │
│  │ Add new      │ Remove       │                 │
│  │ followers    │ unfollowers  │                 │
│  └──────────────┴──────────────┘                 │
└──────────────────────────────────────────────────┘
```

- Segmented pill container: same recipe as Mode pills elsewhere — `inline-flex rounded-full bg-bg p-1`.
- Two options: `Add new followers` (value `'add'`) · `Remove unfollowers` (value `'remove'`).
- Description swaps with mode:
  - `add` → *"New followers are automatically added to your Close Friends list."*
  - `remove` → *"Users who unfollow you are removed from your Close Friends list."*
- Plan-gated on Growth plan. When locked: segmented control is `pointer-events-none opacity-60`; tapping anywhere on the row opens the upgrade sheet.

### Close Friends mock shape change

`mockGrowthConfig.closeFriendsAdder` changes from boolean → object:
```js
// Was:
closeFriendsAdder: false

// Becomes:
closeFriendsAdder: { enabled: false, mode: 'add' }
```

### Store updates

Add to `useGrowthConfig`:
```js
toggleCloseFriends: () => { ...toggle .enabled... }
setCloseFriendsMode: (mode) => { ...set .mode... }   // mode: 'add' | 'remove'
```

Remove the old `toggleCloseFriends` that flipped a boolean; replace with the new one that flips `closeFriendsAdder.enabled`.

---

## 5. Filters card (redesigned — compact inline rows)

**Layout:** wider column (right). Rows are dense — label on left, control on right.

**Header:** `Filters` + sub `Target only accounts that match these criteria.`

### Row anatomy

```jsx
<div className="flex flex-col gap-1 border-b border-border py-3 last:border-b-0 lg:flex-row lg:items-center lg:gap-4">
  <label className="group/label flex items-center gap-1.5 lg:w-36 shrink-0">
    <span className="text-sm font-medium text-text-primary">{title}</span>
    {/* Desktop tooltip hover trigger */}
    <InfoTooltip text={description} />
  </label>
  <div className="min-w-0 flex-1">
    {/* Control cluster — preset pills, segmented pills, or switch */}
  </div>
</div>
```

- `lg:w-36` (144px) gives the label column a fixed width so controls align on desktop.
- On mobile the label wraps above the control (`flex-col lg:flex-row`).
- `border-b` between rows for clear separation (no whitespace fill).

### Tooltip primitive

Inline `InfoTooltip` component: `Info` Lucide icon (`h-3.5 w-3.5 text-text-muted`) with absolute-positioned tooltip on hover/focus. Desktop-only visual. Skipped on mobile (icon hidden with `hidden lg:inline-block`).

```jsx
function InfoTooltip({ text }) {
  return (
    <span className="group relative hidden lg:inline-block">
      <Info className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-text-primary px-2.5 py-1.5 text-[11px] leading-relaxed text-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}
```

### Rows (6 total)

1. **Following count** — preset pills inline: `< 500 · 500–5K · 5K+ · Custom`. Tooltip: `People this account follows.` Custom → Min/Max inputs appear below the pills.
2. **Follower count** — `< 1K · 1K–50K · 50K+ · Custom`. Tooltip: `How many followers they have.`
3. **Media count** — `< 10 · 10–100 · 100+ · Custom`. Tooltip: `How many posts they've published.`
4. **Account privacy** — `All · Public · Private`. Tooltip: `Whether their profile is public or private.`
5. **Gender target** — `All · Male · Female`. Tooltip: `Narrow targeting by account gender.` Plan-gated (Advanced pill next to label; row click opens upgrade sheet).
6. **Exclude NSFW** — single switch. Tooltip: `Skip accounts that appear to contain adult content.` Label left, switch right.

### `PresetRangePills` update

Keep the component. Change its rendering for inline use:
- Pill button height reduced from current ~`py-1.5` (~28px) to `py-1` (~24px) so the row stays compact.
- Custom expansion: Min/Max inputs appear on a **second row** inside the same flex cell, `mt-2`. The row grows in height only when Custom is open.

### Layout implementation

```jsx
<section className="mt-4 rounded-xl border border-border bg-surface p-4 lg:p-5">
  <h2>Filters</h2>
  <p>Target only accounts that match these criteria.</p>
  <div className="mt-4 flex flex-col">
    <FilterRow title="Following count" description="People this account follows.">
      <PresetRangePills ... />
    </FilterRow>
    {/* ... repeat for Follower, Media, Privacy, Gender, NSFW */}
  </div>
</section>
```

A small `FilterRow` helper handles the shared row markup.

---

## 6. Lists card (redesigned — typeahead on add)

**Layout:** narrower column (left, under Engagement).

**Header, tabs, description** — unchanged from v1.

### Typeahead on add

The quick-add input gets a **typeahead dropdown** using the same pattern as `AddTargetSheet`:

- Uses `searchTargets(query, 'account')` from `@/mocks/targetSearch` as the search pool.
- Triggers after user types 2+ characters. Debounced 200ms.
- Shows up to 5 matches in an absolute-positioned dropdown anchored to the input.
- Each match row: 32×32 avatar (initial letter fallback) + `@handle` + `{followers count}` muted subline.
- **Must-pick rule** — the user must click a match before `Add` is enabled. Typing alone does NOT enable submit.
  - Reason: handles in the IG graph are canonical — can't be freeform text if they're meant to map to real accounts.

### UX states

- Empty input → `Add` disabled. No dropdown.
- Typing (< 2 chars) → `Add` disabled. No dropdown.
- Typing (≥ 2 chars) → dropdown shows matches or `No matches.` inline row. `Add` still disabled.
- Clicked a match → input fills with `@handle`, dropdown closes, `Add` enables. Picked match is the selected state.
- User types again → picked match clears, `Add` disabled, dropdown re-appears.
- Click `Add` (or Enter when picked) → commits the entry to the list. Fires toast (debounced).

### Validation outcomes from store

- `'duplicate'` → fire `useToasts` warning: `Already in list.`. Don't clear input.
- `'ok'` → clear input, clear picked, focus stays in input (ready for next add).

### Entries list

Unchanged from v1 — `@handle` on left, X button on right. Empty state muted one-liner.

### Store: no API change

`useLists.addEntry(type, rawUsername)` still accepts raw string (the typeahead resolves to a plain handle before calling). Store's validation + dedupe remain the same.

---

## 7. Growth+ hero banner (redesigned)

**Layout:** full-width, sits below the 2-column grid as the page closer.

### Non-subscriber variant (upsell)

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [✨]  GROWTH+                                                   │
│                                                                  │
│        Algorithmic reach, on autopilot.                          │
│        Our network of Kicksta accounts boosts your posts —      │
│        more eyes, faster momentum. Separate billing.            │
│                                                                  │
│        ✓ Algorithmic boost from partner accounts                │
│        ✓ Separate from Targeted Growth metrics                  │
│        ✓ Cancel any time                                        │
│                                                                  │
│                                        [Add Growth+ →]          │
└──────────────────────────────────────────────────────────────────┘
```

- Container: `rounded-xl border border-purple-base/20 bg-purple-tint/30 p-6 lg:p-8 mt-4`.
  - Uses purple-tint for visual distinction (matches Overview's Growth+ banner color family).
- Left zone (flex-1):
  - 48×48 icon chip: `rounded-xl bg-purple-base/15 text-purple-text flex items-center justify-center` + `Sparkles` icon (`h-6 w-6`).
  - `GROWTH+` eyebrow: `text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-text mt-3`.
  - Headline: `Algorithmic reach, on autopilot.` (`text-xl font-semibold text-text-primary mt-1 lg:text-2xl`).
  - Subcopy: `Our network of Kicksta accounts boosts your posts — more eyes, faster momentum. Separate billing.` (`mt-2 text-sm leading-relaxed text-text-secondary max-w-xl`).
  - Benefits list: `<ul>` with 3 `<li>` rows, each with `Check` icon (`h-4 w-4 text-purple-text`) + text (`text-sm text-text-primary`). `mt-4 flex flex-col gap-2`.
- Right zone (shrink-0 on desktop, below content on mobile):
  - Primary CTA: `Add Growth+ →` — `inline-flex h-11 items-center gap-2 rounded-lg bg-purple-base px-5 text-sm font-medium text-white shadow-sm hover:opacity-90`. Lucide `ArrowRight` icon.
  - Routes to `/signup/growth-plus`.

### Subscriber variant

Simpler:

```
┌──────────────────────────────────────────────────────────────────┐
│ ✨ GROWTH+  [Active]  Boosting your posts — ~34 extra this mo.  │
│                                                                  │
│ [Growth+ switch]   ·   Manage subscription →                    │
└──────────────────────────────────────────────────────────────────┘
```

- Same container shape but no benefits list.
- Top row: icon + `GROWTH+` + `Active` pill + one-line status.
- Bottom row: `SettingSwitch` for pause/resume + small `Manage subscription` link.

### Desktop vs. mobile layout (non-subscriber)

- Desktop: content on left, CTA button on right, vertically centered.
- Mobile: stacked; content on top, CTA full-width below.

---

## 8. File-level diff

**Modified:**
- `src/pages/growth/index.jsx` — grid composition, new card order.
- `src/pages/growth/ModeCard.jsx` — full rewrite: 3 elevated option cards.
- `src/pages/growth/EngagementCard.jsx` — full rewrite: Close Friends segmented sub-control.
- `src/pages/growth/FiltersCard.jsx` — full rewrite: inline row layout with `FilterRow` helper + `InfoTooltip`.
- `src/pages/growth/PresetRangePills.jsx` — tighten pill padding.
- `src/pages/growth/ListsCard.jsx` — add typeahead dropdown + must-pick rule.
- `src/pages/growth/GrowthPlusCard.jsx` — full rewrite: hero banner with benefits list.
- `src/stores/useGrowthConfig.js` — update `toggleCloseFriends` to flip nested `.enabled`; add `setCloseFriendsMode`.
- `src/mocks/growthConfig.js` — change `closeFriendsAdder` from boolean to `{ enabled, mode }`.

**Unchanged:**
- `src/pages/growth/SafetyStrip.jsx`
- `src/components/SettingSwitch.jsx`
- `src/components/UpgradeBottomSheet.jsx`
- `src/stores/useLists.js`
- `src/mocks/targetSearch.js` (reused for Lists typeahead)

---

## 9. Out of scope (V1 → V2 unchanged deferrals)

- Real backend. Everything in-memory via mocks.
- Real IG handle validation beyond fixture pool.
- Growth+ performance chart / metrics for subscribers beyond the one-line summary.
- Whitelist/blacklist bulk-operations.
- Filter state URL-persisted.

---

## 10. Success criteria

- Desktop: the 2-column grid for Engagement + Lists vs Filters renders at ≥ `lg:` breakpoint; columns align at the top.
- Mobile: everything stacks in reading order, no horizontal scroll.
- Mode card: 3 option cards side-by-side, `Auto` marked `Recommended`, selected card shows border + check.
- Engagement: Close Friends toggle on → segmented `Add / Remove` appears below; description updates per mode.
- Filters: all 6 rows fit in compact inline form; Custom expands inline without breaking alignment.
- Lists: typeahead dropdown appears on 2+ chars; `Add` disabled until a match is picked.
- Growth+ banner: hero treatment with benefit list, prominent purple CTA; subscriber variant compact.
- All existing v1 behavior (auto-save debounced toast, plan-gated rows opening upgrade sheet, SettingSwitch recipe) preserved.
- No console errors; dark mode intact.
