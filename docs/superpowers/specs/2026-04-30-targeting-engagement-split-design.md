# Targeting / Engagement split design

**Date:** 2026-04-30
**Status:** Approved (pre-plan)
**Builds on:** the layout refactor shipped in `docs/MIGRATION.md` (sidebar/drawer/dropdown chrome) and the `/account/billing` merge.

---

## Goal

Reorganize `/targets` and `/growth` so each page has a clearer single purpose:

- **`/targeting`** (renamed from `/targets`) becomes the home for *everything that controls who Kicksta targets and how the engine behaves toward them.* Two tabs: Targets (the operational list, default) and Settings (Mode + Like-after-follow + Audience filters + Whitelist + Blacklist).
- **`/engagement`** (renamed from `/growth`) becomes the home for *what Kicksta does to new followers after the follow-back lands.* Single-column page with two cards: Welcome DM + Close Friends. GrowthPlusBanner stays at the bottom for now (placement revisited after the rest of the refactor pass).

Today's split is incoherent — Mode + Filters + Lists + Like-after-follow live on Growth alongside Welcome DM + Close Friends, but conceptually they govern targeting behavior, not post-follow engagement.

---

## Scope

In scope:
- Page architecture for `/targeting` (tabs) and `/engagement` (single column).
- File moves between `src/pages/growth/` and `src/pages/targets/`.
- Folder renames: `targets/` → `targeting/`, `growth/` → `engagement/`.
- Route renames + back-compat redirects.
- Sidebar nav + bottom tab bar label updates.
- Store consumer routing — same store shapes; consumer files relocate.
- Splitting `EngagementCard.jsx` into `WelcomeDmCard.jsx` + `CloseFriendsCard.jsx`; extracting Like-after-follow into `ModeCard.jsx`.
- Renaming the "Filters" card to "Audience filters" (heading copy only — chip color/icon/store fields unchanged).

Out of scope (separate specs):
- TargetDetailDrawer polish (working-status indicator, last-5-interactions section, button restyling).
- AddTargetSheet / Whitelist / Blacklist modal visual identity rework.
- Settings page mobile nav swap to top segmented strip.
- Settings page billing history mobile rebuild.
- Overview small fixes (subtitle + activity mobile cap).
- Navigation cleanup (drop duplicate logout, dedupe IG state surfaces).
- GrowthPlusBanner placement — explicitly parked, revisit after this whole refactor pass.

---

## Architecture

### Routes

Today:
```
/targets     → TargetsPage (TargetsHeroCard + FilterRow + TargetList)
/growth      → GrowthPage  (ModeCard + EngagementCard + FiltersCard + WhitelistCard + BlacklistCard + GrowthPlusBanner)
```

After:
```
/targeting             → TargetingPage (H1 + subtitle + tab strip + outlet)
/targeting?tab=settings  ↳ SettingsTab (Mode + Audience filters + Whitelist + Blacklist)
/targeting               ↳ TargetsTab (TargetsHeroCard + FilterRow + TargetList)  ← default

/engagement            → EngagementPage (Welcome DM + Close Friends + GrowthPlusBanner)

# Back-compat
/targets     → 301 → /targeting
/growth      → 301 → /engagement
```

### Tab state

A search param drives the active tab on the Targeting page: `?tab=settings` for the Settings tab; no param means Targets. Refresh-safe, deep-linkable, and lighter than nested routes for a two-state mode toggle.

The page reads the param via `useSearchParams()` and writes via `setSearchParams({ tab })` so back/forward navigation works.

### Tab strip recipe

Same segmented-control recipe as `AddTargetSheet`'s account/hashtag toggle:

```jsx
<div className="mt-4 flex rounded-full bg-bg p-1">
  <button className={`inline-flex h-9 flex-1 items-center justify-center rounded-full px-4 text-xs font-medium ${active ? 'bg-surface text-text-primary shadow-sm' : 'text-text-secondary'}`}>
    Targets
  </button>
  <button className={...}>Settings</button>
</div>
```

Same on desktop and mobile. Sits below the H1+subtitle, above the tab content.

### Sidebar nav + bottom tab bar

- **Sidebar** (`src/components/DashboardLayout.jsx`): the `tabs` array `to` value updates from `/targets` to `/targeting`, label "Targeting" stays. Same for `/growth` → `/engagement`, label "Growth" → "Engagement".
- **Bottom tab bar:** same updates.
- **MobileNavDrawer:** same updates.
- **Active-state matcher:** `to.startsWith('/targeting')` for the Targeting entry; `startsWith('/engagement')` for Engagement.

---

## Targeting page

### Page header

```
Targeting
Manage who Kicksta targets and how.
[Targets | Settings]   ← segmented tab strip
```

H1 size + subtitle pattern matches the rest of the dashboard (`text-lg font-semibold leading-snug text-text-primary lg:text-xl` + `mt-1 text-sm text-text-secondary`).

### Targets tab (default)

Identical to today's Targeting page minus `LiveActivityCard` (already removed):

```
TargetsHeroCard       (count + Add target button)
FilterRow             (Active / Archived bucket pills + Sort)
TargetList            (rows of TargetRow)
```

Modals mounted at the page level: `AddTargetSheet`, `TargetDetailDrawer`, `RemoveTargetModal` — same as today.

No structural change. Working-status indicator on the row, last-5-interactions inside the drawer, button restyling, and AddTargetSheet visual rework all land in their own follow-up specs.

### Settings tab

```
ModeCard              (full-width)
AudienceFiltersCard   (full-width)         ← renamed from FiltersCard
WhitelistCard | BlacklistCard              ← 2-col on lg:, stacked on mobile
```

#### Mode card absorbs Like-after-follow

Today the Mode card has the segmented `Auto / Follow only / Unfollow only` control + footer copy. Like-after-follow is a separate row inside `EngagementCard`.

After the move, Mode grows by one row below the segmented control:

```jsx
<section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
  <div className="flex items-center gap-3">
    <CardChip color="blue" icon={Settings2} />
    <h2 className="text-base font-semibold text-text-primary">Mode</h2>
    <InfoTooltip text="How Kicksta grows your account. You can change this any time." />
  </div>

  {/* existing Auto / Follow-only / Unfollow-only segmented control */}
  ...

  <div className="mt-4 border-t border-border pt-4">
    <SettingSwitch
      icon={Heart}
      title="Like after follow"
      description="Like a few of their recent posts after following — boosts the follow-back rate."
      checked={config.likeAfterFollow}
      onChange={() => toggleLikeAfterFollow()}
    />
  </div>
</section>
```

Like-after-follow is conceptually part of the follow action ("when you follow someone, also like their posts"), so it belongs with Mode rather than as a standalone tactic card.

#### Audience filters

Identical to today's `FiltersCard` except for the heading copy:

```
- Heading: "Filters" → "Audience filters"
- Tooltip copy: small refresh — "Who Kicksta is allowed to interact with."
- Chip color/icon: unchanged (yellow Sliders)
- Card body: unchanged (audience size + account type + NSFW + range inputs + audience reach estimate)
- Edit button → opens existing FiltersModal unchanged
```

The rename is the only thing that ships here. The store fields (`config.filters.*`) and the modal stay untouched.

Why the rename: prevents collision with the `FilterRow` bucket pills on the Targets tab. Two surfaces called "Filters" on the same page is confusing.

#### Whitelist / Blacklist

Side-by-side on `lg:`, stacked on mobile. Identical to today's Growth-page pair.

```jsx
<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
  <WhitelistCard onEdit={() => setWhitelistOpen(true)} />
  <BlacklistCard onEdit={() => setBlacklistOpen(true)} />
</div>
```

`WhitelistModal` and `BlacklistModal` mount at the page level, same as today.

---

## Engagement page

### Page header

```
Engagement
How Kicksta interacts with new followers.
```

No tabs — single-purpose page. H1 + subtitle matches the rest of the dashboard.

### Body

```
WelcomeDmCard         (full-width)
CloseFriendsCard      (full-width)
GrowthPlusBanner      (full-width, parked here)
```

Single-column, full-width cards. Two cards isn't enough to justify a 2-col grid; both have substantial inner content (chat-bubble preview, progress bar) that reads better at full width.

#### WelcomeDmCard

Extracted from `EngagementCard`'s Welcome-DM section. Includes:

- `CardChip` (green `MessageSquare`)
- Heading + tooltip
- `SettingSwitch` for the toggle (`config.welcomeDm.enabled`)
- `WelcomeDmPreview` (the chat-bubble preview that's currently nested inside)
- Locked-state UX for Growth-plan users (existing `isLocked` logic) → opens `UpgradeBottomSheet`

Modals mounted at the page level: `WelcomeDmModal`, `UpgradeBottomSheet`.

#### CloseFriendsCard

Extracted from `EngagementCard`'s Close-Friends section. Includes:

- `CardChip` (purple `Star`)
- Heading + tooltip
- `SettingSwitch` for the master toggle (`config.closeFriendsAdder.enabled`)
- Mode segmented control (`add` / `remove`) when enabled
- `CloseFriendsProgress` strip when enabled
- Locked-state UX for Growth-plan users → opens `UpgradeBottomSheet`

#### GrowthPlusBanner

Lives at the bottom, exactly as it does on today's Growth page. **No changes** to its placement, shape, or behavior in this spec. We've explicitly parked the question of where it ultimately belongs — to be revisited at the end of the broader refactor pass.

---

## File structure

### `src/pages/targeting/` (renamed from `src/pages/targets/`)

```
index.jsx                      # rewritten — H1 + subtitle + tab strip + ?tab routing
TargetsTab.jsx                 # NEW — wraps TargetsHeroCard + FilterRow + TargetList +
                               #       AddTargetSheet + TargetDetailDrawer + RemoveTargetModal mounts
SettingsTab.jsx                # NEW — wraps ModeCard + AudienceFiltersCard +
                               #       WhitelistCard/Modal + BlacklistCard/Modal +
                               #       FiltersModal mount + UpgradeBottomSheet mount

# Already in this folder, unchanged in this spec:
TargetsHeroCard.jsx
FilterRow.jsx
TargetList.jsx, TargetRow.jsx
TargetDetailDrawer.jsx
RemoveTargetModal.jsx
AddTargetSheet.jsx
HealthPill.jsx
subscriptionShared.js          # (existed only by accident? if absent, ignore)

# MOVED from src/pages/growth/:
ModeCard.jsx                   # absorbs the Like-after-follow row; rest unchanged
AudienceFiltersCard.jsx        # renamed from FiltersCard.jsx; only heading copy changes
AudienceReachEstimate.jsx      # used inside AudienceFiltersCard
audienceReach.js               # helper used by AudienceReachEstimate
AudienceFiltersModal.jsx       # renamed from FiltersModal.jsx; opens from AudienceFiltersCard's Edit button
WhitelistCard.jsx, WhitelistModal.jsx
BlacklistCard.jsx, BlacklistModal.jsx
```

### `src/pages/engagement/` (renamed from `src/pages/growth/`)

```
index.jsx                      # rewritten — H1 + subtitle + WelcomeDmCard + CloseFriendsCard + GrowthPlusBanner
WelcomeDmCard.jsx              # NEW — extracted from EngagementCard
CloseFriendsCard.jsx           # NEW — extracted from EngagementCard

# MOVED from src/pages/growth/:
WelcomeDmPreview.jsx
WelcomeDmModal.jsx
CloseFriendsProgress.jsx
```

### Deleted

```
src/pages/growth/EngagementCard.jsx   # split into WelcomeDmCard + CloseFriendsCard
src/pages/growth/                     # whole folder, after all moves complete
src/pages/targets/                    # whole folder, after rename to targeting/
```

(In practice the folder rename happens by `git mv`-ing the contents into the new folder.)

---

## Stores

No shape changes. Consumer files relocate; the store fields they read/write stay identical.

| Store | Used by (old → new) |
|---|---|
| `useGrowthConfig` (`config.mode`, `config.likeAfterFollow`, `config.welcomeDm.*`, `config.closeFriendsAdder.*`, `config.filters.*`) | `ModeCard`, `AudienceFiltersCard`, `WelcomeDmCard`, `CloseFriendsCard` (was `ModeCard`, `EngagementCard`, `FiltersCard`) |
| `useLists` (`whitelist`, `blacklist`, `replaceWhitelist`, `replaceBlacklist`) | `WhitelistCard`, `WhitelistModal`, `BlacklistCard`, `BlacklistModal` (locations unchanged) |
| `useTargetsStore` | TargetsTab consumers (unchanged) |

---

## Routes (`src/App.jsx`)

Add `Navigate` to the `react-router-dom` import (already imported for the `/account/payment` redirect).

```jsx
import TargetingPage from '@/pages/targeting'
import EngagementPage from '@/pages/engagement'

// inside the Dashboard shell route block:
<Route path="/targeting" element={<TargetingPage />} />
<Route path="/engagement" element={<EngagementPage />} />

{/* Back-compat redirects */}
<Route path="/targets" element={<Navigate to="/targeting" replace />} />
<Route path="/growth" element={<Navigate to="/engagement" replace />} />
```

The two new pages are NOT nested routes (unlike `/account`'s panel pattern). The Targeting tabs use a search param, not a nested route.

---

## Sidebar / drawer / bottom-tab updates

Three places hold the `tabs` array:

1. **`src/components/DashboardLayout.jsx`** — `const tabs = [...]` near the top (used by both desktop sidebar and mobile bottom bar).
2. **`src/components/MobileNavDrawer.jsx`** — `const NAV_TABS = [...]` near the top.

Both arrays update:

```jsx
{ to: '/targeting', icon: Target, label: 'Targeting' }   // was: '/targets', 'Targeting'
{ to: '/engagement', icon: TrendingUp, label: 'Engagement' }   // was: '/growth', 'Growth'
```

Mobile bottom-bar `isActive` logic: `to === '/' ? location.pathname === '/' : location.pathname.startsWith(to)` — works as-is.

---

## Cross-cutting

- **No store shape changes.** Mock data unchanged.
- **No icon imports added** beyond what already exists. `Heart` is already imported by today's `EngagementCard` (lives next to Like-after-follow); it travels with the row into Mode.
- **Modal animation pattern** (`mounted + 2× rAF`) — all modals keep their existing pattern.
- **Toast pattern** unchanged (each store action that should fire a toast already does).
- **Locked-state behavior for Welcome DM + Close Friends** (Growth plan users see a muted card + tap → upgrade bottom sheet) ports unchanged.

---

## Acceptance criteria

- Hitting `/targets` redirects to `/targeting`. Hitting `/growth` redirects to `/engagement`.
- `/targeting` lands on the Targets tab. URL stays `/targeting` (no `?tab` param).
- Clicking the Settings tab pushes `?tab=settings` and renders the Settings tab. Refresh keeps the user on Settings.
- Targets tab: TargetsHeroCard (count + Add), FilterRow (Active/Archived + Sort), TargetList. Add target / detail drawer / remove modal all work as before.
- Settings tab: Mode card (with Like-after-follow inside), Audience filters card, Whitelist + Blacklist (2-col on `lg:`). Editing each opens the appropriate modal. Toggling Like-after-follow updates `useGrowthConfig.config.likeAfterFollow` and fires the existing debounced "Settings saved" toast.
- `/engagement` shows: Welcome DM card, Close Friends card, GrowthPlusBanner.
- Welcome DM toggle, Welcome DM Edit modal, Close Friends toggle, Close Friends mode picker, Close Friends progress strip — all work as before.
- Locked-state for Welcome DM + Close Friends on a Growth-plan user: identical to today.
- Sidebar (desktop), mobile bottom bar, and mobile hamburger drawer all show the new "Targeting" + "Engagement" labels and route to the new paths.
- Active-state highlight on each nav surface lights up correctly when the user is on the corresponding page (including its tabs).
- No console errors. No dead imports. No orphan files.

---

## Risks

- **Search-param tab state vs. nested routes inconsistency.** `/account` uses nested routes for its panels; `/targeting` uses a search param for its tabs. Acceptable because `/account` panels are co-equal first-class views, while `/targeting` tabs are a mode toggle on a single page. Document the rationale in CONTEXT.md so the next contributor doesn't try to "normalize" it.
- **`FiltersModal` → `AudienceFiltersModal` rename.** The modal file renames alongside the card (sole consumer is the card's Edit button — single import to update). The store fields it writes (`config.filters.*`) stay named `filters` to avoid touching `useGrowthConfig`'s shape.
- **`useGrowthConfig` is now consumed across two folders.** The store keeps its name (V1 mock). When backend lands and we possibly split it (e.g., `useTargetingConfig` + `useEngagementConfig`), this spec's consumers are easy to bisect.
- **Sidebar `Settings as SettingsIcon` import alias.** Already in place from the prior refactor; reuse it for the Mode card's `Settings2` chip — no new imports.
- **Existing target detail drawer button styling, AddTargetSheet visual identity, Targeting page spacing cleanup** — all touched-but-not-redesigned in this spec. Each ships in its own follow-up spec on top of this one.

---

## Out of scope (recap)

- Targeting popup polish: working-status indicator, last-5-interactions section in the drawer, button restyle (ghost variants).
- Targeting modals visual identity (AddTargetSheet, WhitelistModal, BlacklistModal).
- Settings page mobile nav (top segmented strip) + billing history mobile rebuild.
- Overview small fixes (subtitle + activity feed mobile cap).
- Navigation cleanup (drop duplicate logout, dedupe IG state surfaces).
- GrowthPlusBanner placement — explicitly parked, revisit after this whole refactor pass.
