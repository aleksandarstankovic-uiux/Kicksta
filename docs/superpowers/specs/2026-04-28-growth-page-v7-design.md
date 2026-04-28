# Growth page — v7 design

> Refinement pass on top of v6. Adds a draft + Save pattern to the Mode card, embeds an audience-reach estimate inside the Filters card, enriches the Whitelist + Blacklist rows with letter chips and relative timestamps, fixes the FiltersModal Custom-mode height jump, ships quick presets in the FiltersModal, gives the Mode hero a "staged but unsaved" visual hint, and adds a per-card Reset to defaults action behind a confirmation modal.

---

## Goals

1. Make Mode an explicit choice (draft + confirm), not a one-click commit.
2. Stop the FiltersModal from jumping when a Custom range opens.
3. Give Filters a footer block that feels earned (audience-reach estimate from the user's own settings).
4. Make Whitelist + Blacklist rows feel like cards instead of plain text rows.
5. Cap modal entry-list height so adding entries doesn't push the modal off-screen.
6. Cut down click count on Filters with quick presets.
7. Provide a clean escape hatch (Reset to defaults) on every settings card, gated by a confirmation modal.

## Non-goals

- No new functional dials. Every existing setting is preserved.
- No analytics/metrics on the page (still a configuration surface). The audience-reach estimate is a *settings-derived projection*, not historical data.
- No real-time wiring for impact stats — V1 keeps the page mock-only.
- LiveActivityStrip is gone (v6) and stays gone.

---

## 1. Mode card — draft + Save / Cancel

### Behavior

- Selection becomes a *draft*: clicking a mode card sets `draft`, not the saved value. The store value (`config.mode`) is unchanged until Save.
- When `draft !== config.mode`, two buttons appear at the top-right of the card header:
  - `Cancel` — ghost (`bg-bg text-text-primary`), reverts `draft` to `config.mode`.
  - `Save mode` — filled blue (`bg-blue-base text-white`), commits via `setMode(draft)` and fires the existing 1.5s debounced toast.
- When `draft === config.mode`, the buttons are not rendered. Header has only the chip + title + tooltip + within-IG-limits pill.

### Visual hint (P2)

- The card matching `config.mode` keeps the v6 selected style: solid `border-blue-base`, `bg-blue-tint/40`, Check icon corner.
- The card matching `draft` (when different from saved) gets a *staged* style instead: `border-blue-base border-dashed`, `bg-blue-tint/20`, no Check icon. Reads as "you've picked this, now confirm."
- All other cards stay in their default unselected state.

### Reset footer

Below the 3 mode option cards (after `mt-4` spacing), a single ghost link:
```
Reset to defaults
```
Recipe: `text-xs text-text-muted hover:text-text-secondary`. Click opens `ResetConfirmModal` with `section="mode"`. Confirm calls `resetMode()` on the store.

### State

`ModeCard` adds local `useState` for `draft`. Initialise from `config.mode`. Reset draft when `config.mode` changes externally (handled with a `useEffect` that syncs).

---

## 2. Welcome DM Edit button — bigger

In `WelcomeDmPreview.jsx`, the `Edit message` button changes from:
```
h-8 px-3 text-xs gap-1.5  (Pencil h-3 w-3)
```
to:
```
h-10 px-4 text-sm gap-2   (Pencil h-3.5 w-3.5)
```

Same `bg-blue-base text-white` filled style. Aligns with the size of FiltersModal's Save button and the Mode card's new Save mode button.

---

## 3. Close Friends segmented — full-width

In `EngagementCard.jsx`, the segmented container becomes:
```jsx
<div className="flex w-full rounded-full bg-bg p-1 ...">
```
Each pill becomes:
```jsx
<button className="inline-flex h-8 flex-1 items-center justify-center rounded-full ...">
```
Two pills (`Add new followers` / `Remove unfollowers`) split the row 50/50. The off-state placeholder behaviour from v6 stays — `opacity-60` on the container when toggle is off, `disabled` on each pill.

---

## 4. Filters card — audience reach estimate

### Component

New file `src/pages/growth/AudienceReachEstimate.jsx`. Receives no props; reads filters via `useGrowthConfig`.

```
┌──────────────────────────────────────────┐
│ ESTIMATED AUDIENCE                       │
│ ~12,400 accounts match your filters      │
│ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░             │
│ Healthy reach.                           │
└──────────────────────────────────────────┘
```

Recipe:
- Container: `mt-4 rounded-lg bg-bg p-4`
- Eyebrow: `text-[11px] font-semibold uppercase tracking-wide text-text-muted` reading `Estimated audience`
- Count line: `mt-1 text-sm font-medium text-text-primary` — `~{formatCount(count)} accounts match your filters`
- Bar: `mt-3 h-1.5 w-full overflow-hidden rounded-full bg-border` containing `<div className="h-full rounded-full bg-blue-base transition-[width] duration-500" style={{ width: \`\${pct}%\` }} />`
- Hint: `mt-2 text-xs text-text-muted` — copy flips by count band

### Formula module

New file `src/pages/growth/audienceReach.js` — pure function:

```js
const POOL = 50_000

const FOLLOWING_FACTOR = (min, max) => {
  if ((min === 0 || min == null) && max == null) return 1.0
  if (min === 0 && max === 500) return 0.45
  if (min === 0 && max === 5000) return 0.7
  if (min === 500 && max === 5000) return 0.4
  if (min === 5000 && max == null) return 0.25
  // Fallback: interpolate by midpoint relative to the pool's typical range.
  const lo = min ?? 0
  const hi = max ?? 50000
  return Math.max(0.1, Math.min(0.9, (hi - lo) / 50000))
}

const FOLLOWER_FACTOR = (min, max) => {
  if ((min === 0 || min == null) && max == null) return 1.0
  if (min === 0 && max === 1000) return 0.5
  if (min === 0 && max === 5000) return 0.7
  if (min === 1000 && max === 50000) return 0.55
  if (min === 50000 && max == null) return 0.15
  const lo = min ?? 0
  const hi = max ?? 100000
  return Math.max(0.1, Math.min(0.9, (hi - lo) / 100000))
}

const MEDIA_FACTOR = (min, max) => {
  if ((min === 0 || min == null) && max == null) return 1.0
  if (min === 0 && max === 10) return 0.6
  if (min === 10 && max === 100) return 0.55
  if (min === 100 && max == null) return 0.35
  return 0.7
}

const PRIVACY_FACTOR = (v) => (v === 'public' ? 0.7 : v === 'private' ? 0.3 : 1.0)
const GENDER_FACTOR = (v) => (v == null ? 1.0 : 0.5)
const NSFW_FACTOR = (excludeNsfw) => (excludeNsfw ? 0.92 : 1.0)

export function estimateAudienceReach(filters) {
  const f = filters
  const factor =
    FOLLOWING_FACTOR(f.followingMin, f.followingMax) *
    FOLLOWER_FACTOR(f.followerMin, f.followerMax) *
    MEDIA_FACTOR(f.mediaMin, f.mediaMax) *
    PRIVACY_FACTOR(f.accountPrivacy) *
    GENDER_FACTOR(f.genderTarget) *
    NSFW_FACTOR(f.excludeNsfw)
  const raw = Math.round(POOL * factor)
  const count = Math.max(200, Math.min(POOL, raw))
  const pct = Math.max(2, Math.min(100, Math.round((count / POOL) * 100)))
  let hint
  if (count < 500) hint = 'Filters are very tight — consider widening one.'
  else if (count < 2000) hint = 'Tight focus.'
  else if (count < 20000) hint = 'Healthy reach.'
  else hint = 'Wide reach — consider narrowing for relevance.'
  return { count, pct, hint }
}
```

Pure, deterministic, no side effects, easy to swap with a real API later.

### Reset footer

Below the audience-reach estimate, the `Reset to defaults` ghost link. Same recipe as Mode's footer.

### Engagement card reset footer

`EngagementCard.jsx` also gets a `Reset to defaults` footer link at the very bottom. Resets `likeAfterFollow`, `welcomeDm.enabled`, `welcomeDm.message`, `closeFriendsAdder.enabled`, `closeFriendsAdder.mode` to the seed values via a single `resetEngagement()` action.

---

## 5. Whitelist + Blacklist — letter chips + timestamps

### Per-row layout

```
[A]  @alex.studio              added 2w ago
[B]  @brand.partner             added 5d ago
[Y]  @yoga.daily                added 1mo ago
```

Recipe per row:
```jsx
<li className="flex items-center gap-3 py-1.5">
  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-bg text-xs font-semibold text-text-secondary">
    {letter}
  </span>
  <span className="min-w-0 flex-1 truncate text-sm text-text-primary">
    {entry.username}
  </span>
  <span className="shrink-0 text-xs text-text-muted">
    added {relTime}
  </span>
</li>
```

Where:
- `letter = entry.username.replace(/^@/, '').charAt(0).toUpperCase()`
- `relTime = formatRelativeShort(entry.addedAt)`

### `formatRelativeShort` helper

New file `src/utils/formatRelativeShort.js`:

```js
// Compact relative-time formatter — "5d ago", "2w ago", "1mo ago".
// For UI labels next to settings entries; not meant for activity feeds.
export function formatRelativeShort(iso, now = new Date()) {
  const ms = now - new Date(iso)
  const sec = Math.max(0, Math.floor(ms / 1000))
  const min = Math.floor(sec / 60)
  const hour = Math.floor(min / 60)
  const day = Math.floor(hour / 24)
  const week = Math.floor(day / 7)
  const month = Math.floor(day / 30)
  const year = Math.floor(day / 365)
  if (sec < 60) return 'just now'
  if (min < 60) return `${min}m ago`
  if (hour < 24) return `${hour}h ago`
  if (day < 7) return `${day}d ago`
  if (week < 5) return `${week}w ago`
  if (month < 12) return `${month}mo ago`
  return `${year}y ago`
}
```

### Reset footer

Each list card gets a `Reset to defaults` ghost link at the bottom. Reset action removes all entries: `resetWhitelist()` / `resetBlacklist()` empty their respective arrays.

---

## 6. Whitelist + Blacklist modals — scrollable list

In `WhitelistModal.jsx` and `BlacklistModal.jsx`, the entries-list container changes from:
```jsx
<div className="mt-4 flex flex-col divide-y divide-border">
```
to:
```jsx
<div className="mt-4 flex max-h-72 flex-col divide-y divide-border overflow-y-auto">
```

`max-h-72` = 288px. Header + tooltip text + typeahead row + footer Cancel/Save stay pinned at modal edges (they're outside this container). Only the entries list scrolls when count exceeds the cap.

The outer modal container's `max-h-[85vh]` stays — gives a hard ceiling on a smaller viewport.

---

## 7. FiltersModal — Custom no longer jumps

In `FiltersModal.jsx`, the `RangeDropdown` component renders Min/Max inputs **always**, not conditionally:

```jsx
<div className="mt-2 flex gap-2">
  <input
    type="number"
    value={isCustom ? (min ?? '') : ''}
    disabled={!isCustom}
    onChange={...}
    placeholder="Min"
    className={`h-10 flex-1 rounded-lg border border-border px-3 text-sm outline-none ${
      isCustom
        ? 'bg-surface text-text-primary focus:border-blue-base'
        : 'bg-bg text-text-muted cursor-not-allowed'
    }`}
  />
  <input ... same pattern with max ... />
</div>
```

When the dropdown's value isn't `custom`:
- Inputs are disabled.
- Inputs show empty values (`value=""`) — no leak of the underlying min/max into a non-Custom selection.
- The greyed disabled state communicates "these aren't editable; pick Custom to edit."

When the dropdown is `custom`:
- Inputs become editable, show the current min/max values, focus border = blue.

Layout impact: the row of inputs is *always present*, so the dropdown row is always the same height regardless of selection. Both columns stay the same height when one of them is on Custom.

Modal width stays `max-w-2xl` — no change.

---

## P1. Quick presets in FiltersModal

Above the two-column grid (inside the scrollable body, before `<div className="lg:grid lg:grid-cols-2 ...">`):

```
QUICK PRESETS
[Most users]  [Niche audience]  [Macro reach]
```

Recipe:
- Eyebrow: `text-[11px] font-semibold uppercase tracking-wide text-text-muted`, reads `Quick presets`.
- Pill row: `mt-2 flex flex-wrap gap-2`.
- Each pill: `inline-flex h-9 items-center rounded-full bg-bg px-4 text-sm font-medium text-text-secondary transition-colors hover:bg-blue-tint hover:text-blue-text`. No active state — tapping always sets, doesn't toggle. After the row, an `mb-6` divider.

Definitions:
| Preset | followingMin | followingMax | followerMin | followerMax | mediaMin | mediaMax | accountPrivacy | genderTarget | excludeNsfw |
|--------|--------------|--------------|-------------|-------------|----------|----------|----------------|--------------|-------------|
| Most users | 0 | 5000 | 1000 | 50000 | 10 | null | all | null | true |
| Niche audience | 0 | 500 | 0 | 5000 | 10 | null | public | null | true |
| Macro reach | 5000 | null | 50000 | null | 100 | null | all | null | true |

Click handler: writes all 9 keys at once to `draft` (single `setDraft(d => ({ ...d, ...preset }))` call). User still has to click `Save` to commit.

---

## P3. ResetConfirmModal

New file `src/components/ResetConfirmModal.jsx`. Reusable across Mode / Engagement / Filters / Whitelist / Blacklist cards.

```jsx
<ResetConfirmModal
  open={open}
  onClose={onClose}
  sectionLabel="Mode"   // or "Engagement", "Filters", "Whitelist", "Blacklist"
  onConfirm={handleConfirm}
/>
```

Layout:
- Header: `Reset {sectionLabel} to defaults?`
- Body: `This will replace your current settings. You can change them again any time.` (plain `text-sm text-text-secondary`).
- Footer:
  - `Cancel` — ghost (`bg-bg text-text-primary`) on the left.
  - `Reset to defaults` — `bg-red-tint text-red-text` ghost-destructive variant on the right (per CLAUDE.md tone-matching rule).
- Same modal animation pattern (mounted state + 2× rAF + `translate-y-4 → 0`).
- Mobile bottom sheet, desktop centered (`max-w-md`).
- Escape + overlay-tap dismiss.

---

## Store changes

### `src/stores/useGrowthConfig.js`

Add three new actions:

```js
import { mockGrowthConfig } from '@/mocks/growthConfig'

// Snapshot the seed shape so reset stays consistent even if `mockGrowthConfig`
// drifts at runtime. Spread a deep-ish clone for the nested objects.
const DEFAULTS = JSON.parse(JSON.stringify(mockGrowthConfig))

// Inside the create() body, alongside existing actions:
resetMode: () => {
  set((state) => ({ config: { ...state.config, mode: DEFAULTS.mode } }))
  announceSaved()
},
resetEngagement: () => {
  set((state) => ({
    config: {
      ...state.config,
      likeAfterFollow: DEFAULTS.likeAfterFollow,
      welcomeDm: { ...DEFAULTS.welcomeDm },
      closeFriendsAdder: { ...DEFAULTS.closeFriendsAdder },
    },
  }))
  announceSaved()
},
resetFilters: () => {
  set((state) => ({ config: { ...state.config, filters: { ...DEFAULTS.filters } } }))
  announceSaved()
},
```

### `src/stores/useLists.js`

Add two new actions:

```js
resetWhitelist: () => {
  set({ whitelist: [] })
  announceSaved()
},
resetBlacklist: () => {
  set({ blacklist: [] })
  announceSaved()
},
```

(Note: per the user's enrichment direction, mocks seed the lists with 5 entries each. Reset clears them to empty.)

---

## File changes summary

**Created**
- `src/components/ResetConfirmModal.jsx`
- `src/utils/formatRelativeShort.js`
- `src/pages/growth/AudienceReachEstimate.jsx`
- `src/pages/growth/audienceReach.js`

**Modified**
- `src/pages/growth/ModeCard.jsx` — draft state, Save/Cancel header, dashed staged style, Reset footer
- `src/pages/growth/EngagementCard.jsx` — segmented full-width, Reset footer
- `src/pages/growth/WelcomeDmPreview.jsx` — Edit button h-10
- `src/pages/growth/FiltersCard.jsx` — append `<AudienceReachEstimate>` block, Reset footer
- `src/pages/growth/FiltersModal.jsx` — Min/Max always render (disabled when not Custom), quick-preset row at top
- `src/pages/growth/WhitelistCard.jsx` — letter chip + timestamp + Reset footer
- `src/pages/growth/BlacklistCard.jsx` — letter chip + timestamp + Reset footer
- `src/pages/growth/WhitelistModal.jsx` — entries list `max-h-72 overflow-y-auto`
- `src/pages/growth/BlacklistModal.jsx` — entries list `max-h-72 overflow-y-auto`
- `src/stores/useGrowthConfig.js` — `resetMode`, `resetEngagement`, `resetFilters`
- `src/stores/useLists.js` — `resetWhitelist`, `resetBlacklist`

**Unchanged**
- `src/pages/growth/index.jsx` — layout stays exactly as v6
- `src/pages/growth/CloseFriendsProgress.jsx` — already supports `enabled` prop from v6.5
- `src/pages/growth/WelcomeDmModal.jsx`
- `src/components/CardChip.jsx`, `InfoTooltip.jsx`, `SettingSwitch.jsx`
- `src/mocks/growthConfig.js` (already has the right defaults shape)

---

## Acceptance criteria

1. Clicking a different mode card stages a draft; Save mode + Cancel buttons appear in the Mode card header. Saved mode keeps solid blue style; staged mode shows a dashed-blue style.
2. Welcome DM `Edit message` button is `h-10 px-4 text-sm` (visibly bigger than v6).
3. Close Friends segmented control fills the full row width; both pills are equal width.
4. Filters card has an `Estimated audience` block at the bottom showing `~N accounts match your filters`, a horizontal blue bar, and a banded hint sentence below.
5. Whitelist and Blacklist rows show `[Letter chip] @username added Xd ago` layout. Letter chip is 24×24 muted.
6. Adding entries in either list modal does not push the modal taller than `max-h-[85vh]` — the entries list scrolls internally at `max-h-72`.
7. FiltersModal does not change height when toggling between a preset and Custom on any range. Min/Max inputs are always present, disabled until Custom.
8. FiltersModal has a `Quick presets` row above the two columns with three pills that set all 6 filter dials at once on the draft.
9. Each settings card (Mode, Engagement, Filters, Whitelist, Blacklist) has a `Reset to defaults` ghost link in its footer. Click opens a confirmation modal. Confirm calls the appropriate reset action; Cancel dismisses with no changes.
10. The `ResetConfirmModal` uses the `bg-red-tint text-red-text` ghost-destructive button style per CLAUDE.md.

---

## Open questions / deferred

- **Audience-reach formula tuning** — V1 uses a deterministic mock; real-API replacement is a separate spec. Per-filter factors are stable, so the bar moves predictably as the user changes settings.
- **Custom range Min/Max defaults when first picking Custom** — currently the field is empty (`value=""`) when not Custom. When the user picks Custom, the inputs initialise from whatever the prior preset set the underlying min/max to. Confirm during visual review that this feels natural; if not, a follow-up tweak can prefill from the *previous* preset instead of leaving empty.
- **Reset granularity for Whitelist/Blacklist** — Reset clears the lists to `[]` (empty), not back to the v6 seed (5 entries). The seed is for visual richness on a fresh page load; "reset" semantically means "remove my customizations." If users find this jarring, we revisit.
