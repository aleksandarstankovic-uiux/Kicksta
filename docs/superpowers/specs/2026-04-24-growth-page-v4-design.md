# Growth Page v4 — Design Spec

**Date:** 2026-04-24
**Supersedes (partially):** `2026-04-24-growth-page-v3-design.md`
**Scope:** Revision on top of v3 — Filters and Lists cards become **visible state views** (one row per setting / per entry) with a single top-right `Edit` button that opens a modal with **local draft state + Save/Cancel** semantics. Mode + Engagement keep the v3 auto-save inline behavior.

---

## Why v4 exists

v3 compacted Filters and Lists to single-sentence summaries. That was too opaque — the user couldn't see individual settings without opening a drawer. v4 restores visibility: every filter value and every list entry is on screen at all times. Editing moves behind an explicit Save/Cancel modal — changes don't commit until the user confirms.

Trade-off: the right column gets taller than in v3. This is accepted — the rows are pure display, page height is deterministic from state, and scanning beats ambiguity.

---

## Goals

1. Every filter setting and list entry is visible on the page without interaction.
2. Editing is explicit — the user opens a modal, modifies a local draft, and commits with `Save` or discards with `Cancel`.
3. Mode + Engagement unchanged from v3 (auto-save inline).
4. Growth+, Safety strip, and Mode card unchanged from v3.
5. Reuse existing primitives (`SettingSwitch`, `UpgradeBottomSheet`, `PresetRangePills`, `Toast`) and established visual recipes from the rest of the dashboard.

---

## Non-goals

- No change to `useGrowthConfig`'s public API beyond what's needed for bulk filter replacement (we'll rely on the existing `setFilter` sequence + debouncer for one toast).
- No new shared primitives across pages.
- No truncation or "show more" for lists — show all entries.
- No confirmation modal on cancel with unsaved changes (mocked data, low risk).

---

## 1. Page layout (v3 layout preserved)

Unchanged from v3:

```
Safety strip
Mode (3 option cards, full-width)
┌─── Engagement ──────┬─── Filters (now taller, read-only rows) ───┐
│                     ├──── Lists (now taller, read-only rows) ─────┤
└─────────────────────┴───────────────────────────────────────────────┘
Growth+ compact banner
```

Grid CSS: `lg:grid-cols-2 lg:items-start` — keeps left column at its natural height without stretching from right.

Mobile: stacked single column.

---

## 2. FiltersCard (rewritten — read-only display + Edit button)

### Card anatomy

```
┌──────────────────────────────────────────────────┐
│ Filters                               [Edit]     │
│ Who Kicksta targets.                             │
├──────────────────────────────────────────────────┤
│ Following count                   500–5K         │
│ Follower count                   200–50K         │
│ Media count                 Up to 10 posts       │
│ Account privacy                   All            │
│ Gender target  [Advanced]         All            │
│ Exclude NSFW                      On             │
└──────────────────────────────────────────────────┘
```

- Surface: `rounded-xl border border-border bg-surface p-4 lg:p-5`.
- Header row: title + sub on the left, `Edit` button top-right.
  - Title: `<h2 className="text-base font-semibold text-text-primary">Filters</h2>`
  - Sub: `<p className="mt-1 text-sm text-text-secondary">Who Kicksta targets.</p>`
  - Header wrapper: `flex items-start justify-between gap-4`.
- Body: `mt-4 flex flex-col divide-y divide-border`. Each row: `flex items-center justify-between py-2.5`.

### Rows (all 6, in order)

| Key | Label | Value display |
|-----|-------|---------------|
| Following count | `Following count` | `valueFor('following', filters)` |
| Follower count | `Follower count` | `valueFor('follower', filters)` |
| Media count | `Media count` | `valueFor('media', filters)` |
| Account privacy | `Account privacy` | `All` / `Public only` / `Private only` |
| Gender target | `Gender target` + `Advanced` pill when locked | `All` / `Male only` / `Female only` |
| Exclude NSFW | `Exclude NSFW` | `On` / `Off` |

### `valueFor(kind, filters)` helper (in-file)

Takes a range kind (`'following' / 'follower' / 'media'`) and the full filters object. Returns a display string per the rules below.

```js
function rangeFor(min, max, noun) {
  if ((min === 0 || min == null) && max == null) return 'Any'
  if (min === 0 || min == null) return `Up to ${formatCount(max)} ${noun}`
  if (max == null) return `${formatCount(min)}+ ${noun}`
  return `${formatCount(min)}–${formatCount(max)} ${noun}`
}

function valueFor(kind, filters) {
  if (kind === 'following') {
    return rangeFor(filters.followingMin, filters.followingMax, 'following')
  }
  if (kind === 'follower') {
    return rangeFor(filters.followerMin, filters.followerMax, 'followers')
  }
  if (kind === 'media') {
    return rangeFor(filters.mediaMin, filters.mediaMax, 'posts')
  }
  return ''
}
```

Notes:
- For the three count rows: the noun is included in the value for readability (e.g. `Up to 10 posts`) — clearer than `Up to 10`.
- For scalar rows (privacy, gender, NSFW): label-only — no noun in the value.

### Gender target locked treatment

- Always display value as `All` (non-Advanced plan users can't change it).
- Next to the `Gender target` label: small pill `rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text` reading `Advanced`. Same recipe as other pages.
- Label color muted: `text-text-secondary` (vs `text-text-primary` for unlocked rows).
- Row is NOT clickable from the card (Edit button handles the interaction; the upgrade path lives inside the modal).

### Edit button

Top-right of the card header:
- `inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg`
- Icon: `Pencil` Lucide, `h-3.5 w-3.5`.
- Label: `Edit`.
- Opens `FiltersModal`.

---

## 3. FiltersModal (rewritten — local draft + Save/Cancel)

### Surface

Same animation + dimensions as v3's `FiltersDrawer`:
- Mobile: bottom sheet, `max-h-[85vh]`.
- Desktop: centered modal, `max-w-2xl`.
- Mount animation: fade + translate-y-4 → 0 (200ms).
- Escape: triggers Cancel (close without saving).

### Header

- Title: `Edit filters` (updated from `Customize filters` to match Save/Cancel semantics).
- Close X: triggers Cancel.

### Body

All 6 dials from v3's `FiltersDrawer`:
- Following count: `PresetRangePills` with `FOLLOWING_PRESETS`.
- Follower count: `PresetRangePills` with `FOLLOWER_PRESETS`.
- Media count: `PresetRangePills` with `MEDIA_PRESETS`.
- Account privacy: `SegmentedPills` with `PRIVACY_OPTIONS`.
- Gender target: `SegmentedPills` with `GENDER_OPTIONS` — locked + tap-to-upgrade as before.
- Exclude NSFW: inline switch.

Same `FilterRow`, `InfoTooltip`, `SegmentedPills` helpers — kept local to the file.

### Local draft state

```jsx
const storedFilters = useGrowthConfig((s) => s.config.filters)
const [draft, setDraft] = useState(storedFilters)

// Reset draft each time the modal opens:
useEffect(() => {
  if (!open) return
  setDraft(storedFilters)
}, [open, storedFilters])
```

All control handlers update `draft` instead of calling `setFilter`. Example:
```jsx
<PresetRangePills
  presets={FOLLOWING_PRESETS}
  value={{ min: draft.followingMin, max: draft.followingMax }}
  onChange={(v) => setDraft((d) => ({ ...d, followingMin: v.min, followingMax: v.max }))}
/>
```

Draft fields map 1:1 with `filters` shape (flat).

### Footer

```
[Cancel (ghost)]              [Save (primary blue)]
```

- Cancel: closes modal. `draft` is discarded.
- Save: writes draft back to store via a new bulk helper `replaceFilters(draft)` that dispatches each individual `setFilter(key, value)` call in sequence. The debouncer in `useGrowthConfig` collapses these into a single `Settings saved.` toast.

#### Why a helper

We don't add a new store action. Instead, inside the modal, on Save:

```js
function commit(draft) {
  // Fire each setter; debouncer handles the toast.
  setFilter('followingRange', { min: draft.followingMin, max: draft.followingMax })
  setFilter('followerRange', { min: draft.followerMin, max: draft.followerMax })
  setFilter('mediaRange', { min: draft.mediaMin, max: draft.mediaMax })
  setFilter('accountPrivacy', draft.accountPrivacy)
  setFilter('genderTarget', draft.genderTarget)
  if (draft.excludeNsfw !== storedFilters.excludeNsfw) {
    toggleExcludeNsfw()
  }
}
```

Small quirk: `toggleExcludeNsfw` has no setter equivalent, only a toggle. We call it only if the draft differs from stored. Works cleanly because Save always writes from the draft's snapshot, never from intermediate user typing.

---

## 4. ListsCard (rewritten — read-only display + Edit button)

### Card anatomy

```
┌──────────────────────────────────────────────────┐
│ Lists                                [Edit]      │
│ Accounts Kicksta never unfollows or always      │
│ avoids.                                          │
├──────────────────────────────────────────────────┤
│ Whitelist (2)                                    │
│    @bestfriend.yoga                              │
│    @brand.partner                                │
│                                                  │
│ Blacklist (3)                                    │
│    @spam.account1                                │
│    @competitor.brand                             │
│    @ex.colleague                                 │
└──────────────────────────────────────────────────┘
```

- Surface: same as Filters card.
- Header: title + sub + top-right `Edit` button (same ghost-outline recipe).
- Body: `mt-4 flex flex-col gap-4`. Two sub-sections (Whitelist, Blacklist), separated by `mt-4` spacing.

### Sub-section anatomy (per list)

- Sub-header: `<p className="text-xs font-medium uppercase tracking-wide text-text-muted">Whitelist ({count})</p>`
- Entries: `<ul className="mt-2 flex flex-col gap-1.5">` with `<li className="text-sm text-text-primary">@handle</li>`
- Empty state: single `<p className="mt-2 text-sm text-text-muted">No accounts whitelisted yet.</p>` (or blacklisted) when the list is empty.

### No truncation

Show all entries. Page height grows naturally with list size.

---

## 5. ListsModal (rewritten — local draft + Save/Cancel)

### Surface

Same as v3's `ListsDrawer`:
- Mobile: bottom sheet.
- Desktop: centered modal `max-w-md`.

### Header

- Title: `Edit lists` (updated from `Manage lists`).
- Close X: Cancel.

### Body

Same layout as v3's drawer:
- Tab row (Whitelist / Blacklist).
- Tab sub description.
- Typeahead add input (2+ chars → dropdown; must-pick).
- Entries list with X remove buttons.

### Local draft state

```jsx
const storedWhitelist = useLists((s) => s.whitelist)
const storedBlacklist = useLists((s) => s.blacklist)
const [draftWhitelist, setDraftWhitelist] = useState(storedWhitelist)
const [draftBlacklist, setDraftBlacklist] = useState(storedBlacklist)

// Reset drafts each time the modal opens:
useEffect(() => {
  if (!open) return
  setDraftWhitelist(storedWhitelist)
  setDraftBlacklist(storedBlacklist)
}, [open, storedWhitelist, storedBlacklist])
```

All add/remove operations mutate `draftWhitelist` / `draftBlacklist` (not the store).

### Add behavior (inside modal)

On pick + tap `Add` (or Enter):
- Check draft for duplicate. If duplicate → fire `useToasts` warning (`Already in list.`). No draft change.
- If not duplicate → push entry into draft: `{ id: newId(), username, addedAt: new Date().toISOString() }`.

### Remove behavior

On X click → filter draft to remove by id.

### Footer

```
[Cancel (ghost)]              [Save (primary blue)]
```

- Cancel: closes, drafts discarded.
- Save: commits drafts to store via new `useLists.replaceLists(whitelist, blacklist)` bulk action, then closes.

### New store action — `replaceLists`

Add to `useLists`:

```js
replaceLists: (whitelist, blacklist) => {
  set({ whitelist, blacklist })
  announceSaved()
},
```

One bulk atomic update, one debounced toast.

---

## 6. File-level diff

**Modified:**
- `src/pages/growth/FiltersCard.jsx` — full rewrite, read-only display + Edit button.
- `src/pages/growth/ListsCard.jsx` — full rewrite, read-only display + Edit button.
- `src/pages/growth/index.jsx` — import renames (Drawer → Modal); component names change.
- `src/stores/useLists.js` — add `replaceLists` action.

**Renamed + rewritten:**
- `src/pages/growth/FiltersDrawer.jsx` → `src/pages/growth/FiltersModal.jsx` — local draft + Save/Cancel.
- `src/pages/growth/ListsDrawer.jsx` → `src/pages/growth/ListsModal.jsx` — local draft + Save/Cancel.

**Deleted:**
- `src/pages/growth/filterSummary.js` — unused after v4 (the summary sentence is replaced by row-per-filter display).

**Unchanged:**
- `ModeCard.jsx` · `EngagementCard.jsx` · `WelcomeDmModal.jsx` · `GrowthPlusCard.jsx` · `SafetyStrip.jsx` · `PresetRangePills.jsx` · `SettingSwitch.jsx` · `UpgradeBottomSheet.jsx`.
- `useGrowthConfig.js`.
- All mocks.

---

## 7. UX consistency checks (against the rest of the dashboard)

- **Edit button shape** matches Targeting's "View all" / Overview's action buttons — ghost outline, `h-9 rounded-lg border`, `Pencil` icon.
- **Modal header + footer** match `AddTargetSheet` / `WelcomeDmModal` / `UpgradeBottomSheet` — same close X, same `Cancel` + primary button pair.
- **Row layout** (label left, value right) is the same pattern as the Targeting row list and the Overview metric headers.
- **Empty state copy** (`No accounts whitelisted yet.`) matches Targeting's filter-empty copy (`No active targets.`).
- **Animation primitives** stay identical: fade-in overlay + translate-y mount transition for all modals.
- **Toast** fires via existing `useGrowthConfig` / `useLists` `announceSaved()` — consistent `Settings saved.` copy across the page.

---

## 8. Out of scope

- No unsaved-changes warning dialog on Cancel.
- No keyboard shortcuts beyond Escape-to-cancel.
- No reordering list entries.
- No inline edit on Filters card (user must open the modal to change anything).
- No per-plan filter-preset defaults.

---

## 9. Success criteria

- Filters card shows all 6 settings with their current values; each filter on its own row; Edit button in the top-right opens a modal.
- Lists card shows both lists with their entries visibly; Edit button opens a modal.
- Filters modal has Cancel + Save; Save commits a draft to the store and fires a single toast.
- Lists modal has Cancel + Save; Save commits both lists to the store and fires a single toast.
- Mode + Engagement still auto-save inline (unchanged).
- Page height on desktop is deterministic from state (taller than v3 but consistent per state).
- Mobile: everything stacks; modals render as bottom sheets.
- No console errors; dark mode intact.
