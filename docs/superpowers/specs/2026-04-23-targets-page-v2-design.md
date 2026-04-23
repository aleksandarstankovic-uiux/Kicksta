# Targets Page v2 — Design Addendum

**Date:** 2026-04-23
**Supersedes (partially):** `2026-04-23-targets-page-design.md`
**Scope:** Iteration on the shipped Targets page. Goal: make the page self-explanatory, raise the information density usefully (without crowding), and let users act on a target from a richer detail view.

---

## Summary of changes

1. Slots card header compacted; button moves inline with count on desktop.
2. Target row redesigned: avatar/hashtag-icon replaces status dot; follower/post subline under name; follow-back column shows `count · %` with color-by-health on the percentage; `ChevronRight` replaces the kebab as a "row opens drawer" affordance.
3. New **Target Detail Drawer** (replaces the old KebabMenu): richer content, filled-tinted action buttons, external "Open on Instagram" link.
4. Add Target sheet: compact segmented toggle, suggestions always visible for both modes, typeahead dropdown replaces static fixture lookup, health label on preview.
5. Empty state copy updated.
6. Mock data gains `followers` (accounts) / `posts` (hashtags), and follow-back counts tuned for clean percentages.

---

## 1. Slots Card (layout only)

### Desktop (`lg:`)

One header row, three zones:
- Left: `Target slots` label.
- Right: count `10 / 30` · `+ Add target` button (auto-width, `h-12`, same blue style).

Progress bar and trust line remain below, unchanged.

```
┌────────────────────────────────────────────────────────┐
│ Target slots                 10 / 30  [+ Add target]   │
│ ████████████████░░░░░░░░░░░░░░░░░                      │
│ 🔒 Kicksta follows within Instagram's safe daily limits │
└────────────────────────────────────────────────────────┘
```

### Mobile

Unchanged from v1 (stacked: count row, bar, trust line, full-width button).

Implementation detail: toggle layout via `lg:flex-row lg:items-center lg:gap-4` on the top row; button uses `w-full lg:w-auto`.

---

## 2. Target Row

### Anatomy

Row container: `flex items-center gap-3 px-4 py-3 min-h-[64px]`. Keeps the depleted-wash and `border-t` conventions from v1.

Zones left to right:

**2.1 Avatar / hashtag icon** — `h-9 w-9 shrink-0 rounded-full overflow-hidden`.
- Account target with `profilePic`: render the image (`object-cover`).
- Account target without `profilePic`: initials fallback (first letter of username, uppercased), `bg-bg text-text-secondary font-semibold text-sm flex items-center justify-center`.
- Hashtag target: `Hash` Lucide icon, centered in `bg-bg text-text-secondary`.
- Depleted: apply `opacity-60` to the avatar wrapper.

**2.2 Name + subline (flex-1 min-w-0, gap-0.5 vertical):**
- Top line: target value + (top-performer `Star` if applicable) + status pill.
  - Name: `truncate text-sm font-medium text-text-primary` (depleted: `text-text-muted line-through`).
  - Star: `h-3.5 w-3.5 shrink-0 fill-yellow-base text-yellow-base`, between name and pill (unchanged).
  - Status pill: bumped text size to `text-[11px]` (was `text-[10px]`). Same recipe and tints.
- Bottom line: `text-xs text-text-muted`, content:
  - Account: `{followers.toLocaleString()} followers` — abbreviated for ≥10K (e.g. `128K`). Helper below.
  - Hashtag: `{posts.toLocaleString()} posts` — same abbreviation.
  - Depleted: keep the subline unchanged; the line-through + opacity on avatar already convey the state.

Number abbreviation helper (shared util, new file `src/utils/formatCount.js`):
```js
export function formatCount(n) {
  if (n == null) return ''
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n < 10_000_000 ? 1 : 0).replace(/\.0$/, '')}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n < 10_000 ? 1 : 0).replace(/\.0$/, '')}K`
  return n.toLocaleString()
}
```

**2.3 Follow-back count · rate (shrink-0, right-aligned, flex baseline):**
- Primary: `{followBackCount}` — `text-sm font-semibold tabular-nums`.
- Middle dot separator: `·` — `text-text-muted mx-1`.
- Rate: `{rate}%` — `text-xs tabular-nums`, color by health:
  - `≥ 10%` → `text-green-text`
  - `5–10%` (strict 5 ≤ r < 10) → `text-text-secondary`
  - `< 5%` → `text-yellow-text`
- Rate computation: `Math.round((followBackCount / followedCount) * 100)`; if `followedCount === 0`, render `—` instead of `%`.
- Depleted: whole cluster becomes `text-text-muted` (health color override ignored — the row is done).

**2.4 Affordance indicator (shrink-0):**
- Replaces the 44×44 kebab button.
- `ChevronRight` Lucide icon, `h-5 w-5 text-text-muted group-hover:text-text-primary` inside an `inline-flex h-11 w-11 items-center justify-center`.
- Decorative only — the whole row is still the tap target. No separate `onClick`.
- Signals "row opens a drawer" without shouting a menu affordance.

### Row interaction (unchanged from v1)

- Entire row is `role="button" tabIndex={0}`; click or Enter/Space opens the Target Detail Drawer (replaces the old kebab menu).
- Hover: `hover:bg-bg`.

### Column header

Right column label changes from `FOLLOW-BACKS` → `FOLLOW-BACKS · %` for clarity.

---

## 3. Target Detail Drawer

Replaces `KebabMenu.jsx` entirely. File renamed: `src/pages/targets/TargetDetailDrawer.jsx`.

### Surface

- Mobile: bottom sheet, rounded top corners, max-height `85vh`.
- Desktop (`lg:`): centered modal, `max-w-md rounded-xl`.
- Overlay `bg-black/40`. Tap outside / Escape dismisses.

### Layout (top to bottom)

1. **Header row** — `flex items-start gap-3 px-5 pt-5`:
   - 48×48 avatar (same fallback + hashtag-icon logic as rows).
   - Identity block (flex-1):
     - Top: `@handle` (or `#hashtag`) — `text-base font-semibold text-text-primary`.
     - Sub: `128K followers` or `12.4M posts` — `text-xs text-text-muted`.
   - Status pill (same recipe as rows, `text-[11px]`).
   - Close button (`X`, 44×44) top-right.

2. **Health label row** — `px-5 mt-3`:
   - One pill showing the target's size-based health (see Section 4.5 for thresholds and copy — reused component).
   - Left-aligned, doesn't duplicate the status pill.

3. **Stat strip** — `mt-4 px-5 flex gap-2`:
   - 3 data chips (Growth-Settings recipe): `rounded-full bg-bg px-3 py-1.5 text-xs` with `text-text-muted label:` + `text-text-primary value`.
     - `Followed 842`
     - `Follow-backs 97`
     - `Rate 12%`
   - Horizontal scroll on mobile if tight (`overflow-x-auto`).

4. **Action buttons** — `mt-5 px-5 flex gap-3`:
   - Two tinted buttons, 48px height, equal flex.
   - Based on status:
     - Active: `Pause` (blue-tint) + `Remove` (red-tint).
     - Paused: `Resume` (blue-tint) + `Remove` (red-tint).
     - Queued: `Remove` only, full-width.
     - Depleted: `Remove` only, full-width.
   - Button recipe:
     - Pause / Resume: `bg-blue-tint text-blue-text` + Lucide icon (`Pause` / `Play`) + label.
     - Remove: `bg-red-tint text-red-text` + `Trash2` icon + label.
     - Both: `rounded-lg h-12 flex items-center justify-center gap-2 font-medium text-sm hover:opacity-90`.

5. **External link** — `mt-4 px-5 pb-5`:
   - Ghost text link `Open on Instagram` + `ExternalLink` icon.
   - `text-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1.5`.
   - URL:
     - Account: `https://instagram.com/{username-without-@}`.
     - Hashtag: `https://www.instagram.com/explore/tags/{tag-without-#}`.
   - `target="_blank" rel="noopener noreferrer"`.

### Behavior

- Pause / Resume: apply immediately via store, close drawer. No toast (parity with v1).
- Remove: opens the existing `RemoveTargetModal` (unchanged behavior). Drawer closes when the modal opens.
- Close on overlay tap / Escape.

---

## 4. Add Target Sheet

### 4.1 Header (unchanged)

Title + close X.

### 4.2 Segmented toggle (revised)

- Container: `inline-flex rounded-full bg-bg p-1` (not `flex w-full`).
- Items: `h-9 px-4 text-xs font-medium capitalize`; selected = `bg-surface text-text-primary shadow-sm`; unselected = `text-text-secondary`.
- Positioned left-aligned under a `Targeting` label (`text-[11px] uppercase tracking-wide text-text-muted mb-1.5`).
- Matches the segmented style used in the chart's period switcher, so the sheet borrows a known dashboard pattern.

### 4.3 Input + typeahead

**Input:**
- Same prefix-adornment (`@` or `#`) + 48px height.
- Label swaps: `Username` / `Hashtag`.
- Helper copy (when no error and no typeahead showing): default helper as before.

**Typeahead dropdown:**
- Appears after user types ≥2 characters.
- Filters from an expanded fixture pool (see Section 4.6).
- Match rule: case-insensitive `includes` on username/hashtag string.
- Shows up to 5 matches. Each row:
  - Avatar (or `Hash` icon), 32×32.
  - Handle (`@...` or `#...`) + `followers`/`posts` muted subline.
  - Health pill on the right (Section 4.5 recipe).
  - Tap: fills input, closes dropdown, surfaces selected item as the preview card.
- Anchored directly below the input (`absolute` positioned), `rounded-lg border border-border bg-surface shadow-md`, `mt-1`, full-width.
- Empty result case: dropdown shows `No matches.` muted text (single row); suggestions chips stay visible below.

**Submit rule:** the user can still submit a typed input that isn't in the fixture pool (we don't validate against "does this account exist"); but the preview + health label only appear for fixture hits. Typeahead accelerates discovery; it doesn't gate input.

### 4.4 Preview card (kept, lightly changed)

When a fixture-matched value is in the input (either typed-to-match or selected from typeahead):

- Same card layout as v1, with an added health pill on the right:
  ```
  [avatar] @handle          Good fit
           128K followers
  ```
- Health pill: see Section 4.5.

### 4.5 Health label

Shared component: `src/pages/targets/HealthPill.jsx`.

**Thresholds** (by `followers` for accounts, `posts` for hashtags):
- `< 1,000` → **Small audience** (yellow)
- `1,000 – 99,999` → **Good fit** (green)
- `100,000 – 999,999` → **Slower — large audience** (yellow)
- `≥ 1,000,000` → **Very large — much slower** (yellow)

**Pill recipe:**
```jsx
className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
// 'good' → "bg-green-tint text-green-text"
// otherwise → "bg-yellow-tint text-yellow-text"
```

One helper returns `{ label, tone }` given a count:
```js
export function evaluateHealth(count) {
  if (count == null) return null
  if (count < 1_000) return { label: 'Small audience', tone: 'warn' }
  if (count < 100_000) return { label: 'Good fit', tone: 'good' }
  if (count < 1_000_000) return { label: 'Slower — large audience', tone: 'warn' }
  return { label: 'Very large — much slower', tone: 'warn' }
}
```

Reused from: preview card, typeahead row, detail drawer.

### 4.6 Suggestions (always visible)

- `Suggestions` section always renders (both modes).
- Account mode: uses `mockSuggestedTargets` (expanded to ~5 items).
- Hashtag mode: new `mockSuggestedHashtags` (5 items).
- Chips: unchanged visual style.
- Hidden only when the typeahead dropdown has ≥1 match (so we don't show two parallel discovery surfaces at once); returns when the user clears the input or has no matches.

---

## 5. Empty State Copy

When zero targets:

- Headline: `No targets yet` (unchanged).
- Sub: `Add an account or hashtag for Kicksta to follow users from. Expect first results within 24–72 hours.`

No button here — slots-card CTA remains sole entry point.

---

## 6. Mock Data Updates

### `src/mocks/targets.js`

Add fields per row:
- All rows: add `followers` (accounts) OR `posts` (hashtags) with realistic values.
- Tune `followedCount` / `followBackCount` so `round(fb / followed * 100)` lands on clean numbers across the healthy spectrum (one ≥10%, one 5–10%, one <5% for scanability).

### `src/mocks/suggestedTargets.js`

Keep existing 5 accounts, ensure each has `followers` (already does).

### `src/mocks/suggestedHashtags.js` (new)

Five hashtags with `posts`:
```js
export const mockSuggestedHashtags = [
  { hashtag: 'homeworkouts', posts: 14_200_000 },
  { hashtag: 'fitfam', posts: 98_500_000 },
  { hashtag: 'healthyeating', posts: 62_300_000 },
  { hashtag: 'mealprep', posts: 18_700_000 },
  { hashtag: 'getfit', posts: 7_400_000 },
]
```

### `src/mocks/resolveAccount.js` → `src/mocks/targetSearch.js` (rename + expand)

- Expand to ~20 accounts + ~10 hashtags.
- Rename primary exports to `searchTargets(query, type)` returning an array (up to 5) — supports typeahead.
- Keep `mockResolveAccount(username)` as a thin wrapper over the new search (for any residual callers, but AddTargetSheet will move to `searchTargets`).

---

## 7. File-level diff

**Modified:**
- `src/pages/targets/SlotsCard.jsx`
- `src/pages/targets/TargetRow.jsx`
- `src/pages/targets/TargetList.jsx` (column header label)
- `src/pages/targets/AddTargetSheet.jsx`
- `src/pages/targets/index.jsx` (swap `KebabMenu` import → `TargetDetailDrawer`, stat naming)
- `src/mocks/targets.js` (follower/post fields, tuned counts)
- `src/mocks/suggestedTargets.js` (unchanged contract, optional tuning)

**Renamed / replaced:**
- `src/pages/targets/KebabMenu.jsx` → `src/pages/targets/TargetDetailDrawer.jsx`
- `src/mocks/resolveAccount.js` → `src/mocks/targetSearch.js`

**New:**
- `src/pages/targets/HealthPill.jsx`
- `src/pages/targets/TypeaheadDropdown.jsx` (or inlined inside AddTargetSheet — decide during implementation; default: inline for now, extract only if >80 lines).
- `src/mocks/suggestedHashtags.js`
- `src/utils/formatCount.js`

**Unchanged:**
- `src/pages/targets/FilterRow.jsx`
- `src/pages/targets/RemoveTargetModal.jsx`
- `src/stores/useTargetsStore.js`

---

## 7b. Live Activity card (new)

A compact live-status strip that sits **between the page header and the slots card**. It shows the user that the targeting system is actively working, updates in real time, and stays in sync with the Overview page's `StatusPill`.

### Shared state — `useSystemStatus` hook

New file: `src/hooks/useSystemStatus.js`. Single source of truth for the live automation status; consumed by both the new Live Activity card and the existing `StatusPill` on Overview.

Shape returned by the hook:
```js
{
  phase: 'analyzing' | 'following' | 'waiting' | 'unfollowing' | 'warming_up' | 'setup' | 'paused',
  targetHandle: string | null,       // e.g. "@fitness.inspo" or "#homeworkouts"
  actionsToday: number,
  nextActionLabel: string,           // "~4 min", "soon", "any moment now"
  isPaused: boolean,
}
```

Behavior:
- On mount, reads baseline from `mockSystemStatus`.
- Every 6–10s (randomized per tick to feel organic), advances to the next phase via the state machine:
  `analyzing → following → waiting → unfollowing → waiting → analyzing …`
- On entering `following` or `unfollowing`, picks a random target from the current *active* `useTargetsStore` list for `targetHandle`.
- On entering `following`, increments `actionsToday` by a random step 1–3.
- If baseline status is `warming_up`, `setup`, or `paused`, the state machine is inert — phase stays fixed, only `nextActionLabel` may recompute.
- `nextActionLabel` is a fuzzy string recomputed each tick based on the phase (never a live countdown timer — PRODUCT.md bans countdowns):
  - `following` / `unfollowing` → `next in a moment`
  - `analyzing` → `next in ~2 min`
  - `waiting` → `next in ~4 min`
  - paused / setup → empty string

### Live Activity card layout

```
┌──────────────────────────────────────────────────────────────┐
│  ● Following @fitness.inspo      [Today 37] [next in ~4 min] │
└──────────────────────────────────────────────────────────────┘
```

- Card: `rounded-xl border border-border bg-surface px-4 py-3 lg:px-6 lg:py-4 mt-6` (this becomes the first card below the header; slots card's `mt-6` drops to `mt-4` or similar).
- Left zone (`flex items-center gap-2 min-w-0 flex-1`):
  - **Radar-ping dot** — 8px. Reuses the ping recipe from the Overview's `StatusPill` (absolute-positioned span with `animate-ping` + solid dot overlay). Color: `bg-green-base` when phase ∈ {analyzing, following, waiting, unfollowing}; `bg-blue-base` when `warming_up`; `bg-text-muted` when `paused` or `setup` (ping animation suppressed in these states).
  - **Phase label** — `text-sm font-medium text-text-primary`. Copy map:
    - `analyzing` → `Analyzing targets`
    - `following` → `Following`
    - `unfollowing` → `Unfollowing`
    - `waiting` → `Pausing between actions` (trust signal)
    - `warming_up` → `Warming up`
    - `setup` → `Setup needed`
    - `paused` → `Paused`
  - **Target handle** — rendered only for `following` / `unfollowing` phases; `text-sm font-medium text-text-primary hover:underline`. Clickable: if the handle matches a target in the store, clicking opens that target's detail drawer. If no match, renders as plain text (non-clickable).
- Right zone (`hidden lg:flex items-center gap-2 shrink-0`):
  - Data chip `Today {actionsToday} actions` — Growth-Settings recipe: `rounded-full bg-bg px-2 py-1 text-xs` with `text-text-muted` label + `text-text-primary font-medium` value.
  - Data chip `{nextActionLabel}` — same recipe, plain muted value. Hidden entirely when `nextActionLabel === ''`.
- Mobile (`< lg:`): right-zone chips collapse to a single line below the phase row:
  - `flex-col` layout; second line: `text-xs text-text-muted` with `Today 37 · next in ~4 min`.
- `warming_up` variant: replace target handle with copy `Growth starts within 72 hours`, muted.
- `setup` variant: right zone hidden; text reads `Setup needed — add your first target to start`.
- `paused` variant: dot static, phase label `Paused`, right zone shows only `Today {actionsToday} actions` muted.

### Interaction

- Tap on target handle (when present): opens its detail drawer via `onOpen` passed from the page. Same API as `TargetRow`.
- No pause/resume control inside this card — it is monitor-only. System-wide pause lives with the existing Overview `StatusPill` popover (unchanged).
- Card itself is not tappable; only the handle inside it.

### Overview StatusPill refactor

- `StatusPill` (currently in `src/pages/overview/index.jsx`) moves to consume `useSystemStatus`, replacing its current `mockSystemStatus`-driven state.
- Visual and popover behavior unchanged. Only the data source changes.
- This guarantees both surfaces advance in lockstep — when the Targets page shows `Following @fitness.inspo`, so does the Overview pill.

### Why no eyebrow title

Pattern reuses the `StatusPill` vocabulary already established elsewhere. A `Live activity` eyebrow adds chrome without new information — the dot + phase label already carry the "this is live" semantics.

---

## 8. Out of scope (still deferred)

Same list as v1:
- Disconnected state.
- At-cap upsell/disable.
- Auto-pause-after-downgrade banner.
- Approaching-cap nudge.
- Success toasts.
- Per-target time-series sparkline.
- Bulk actions, search across rows, CSV import, URL-persisted state.
