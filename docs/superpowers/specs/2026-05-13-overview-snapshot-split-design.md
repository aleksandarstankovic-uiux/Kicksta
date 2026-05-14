# Overview Snapshot Split — Design

## Goal

Replace the single `GrowthSettingsSnapshot` card on the Overview page (which bundles config from two separate dashboard pages and CTAs to a non-existent `/growth` route) with two single-purpose snapshot cards, one per destination page. Reorganize the Overview's bottom block into a clean 2x2 grid that anticipates the Instagram Audit card coming in a follow-up spec.

## Problem

The current `GrowthSettingsSnapshot` on Overview shows:
- **Mode** (`auto` / `follow_only` / `unfollow_only`) — lives on `/targeting?tab=settings`
- **Like after follow** toggle — lives on `/targeting?tab=settings`
- **Welcome DM** toggle — lives on `/engagement`
- **Close Friends Adder** toggle — lives on `/engagement`
- **Filters** (6 facets) — lives on `/targeting?tab=settings`

Its footer CTA reads "Edit Growth" and links to `/growth` — a route that doesn't exist in this dashboard. Users following the CTA hit a 404. Beyond the broken link, the bundling is confusing: clicking through to one place won't surface every toggle shown here.

## Solution overview

Split into two snapshots, each with a destination CTA, and rearrange the Overview bottom block into a 2x2 grid.

### Snapshot 1: `TargetingSettingsSnapshot`

Same visual recipe as today's `GrowthSettingsSnapshot` body but scoped to Targeting concerns:

- **Mode** row (pill: Auto / Follow only / Unfollow only)
- **Like after follow** row (pill: On / Off)
- **Filters** row (6 pills: Following / Followers / Media / NSFW / Privacy / Gender)
- Footer CTA: **"Edit Targeting"** → `/targeting?tab=settings`

Reads from `useGrowthConfig` (existing store) — fields `mode`, `likeAfterFollow`, `filters`.

### Snapshot 2: `EngagementSnapshot`

Two toggle rows + Welcome DM message preview + CFA mode pill:

- **Welcome DM** row — pill On / Off (or "Advanced" if locked for Growth-plan users). Below the row, when On, a 1-line truncated preview of `config.welcomeDm.message` (same truncate recipe as the `WelcomeDmPreview` chat bubble — `line-clamp-1`, padded subtle background).
- **Close Friends Adder** row — pill On / Off / "Advanced" (locked). When On, a small "Mode: Add followers" / "Mode: Remove followers" caption (reading `config.closeFriendsAdder.mode`).
- Footer CTA: **"Edit Engagement"** → `/engagement`

Reads from `useGrowthConfig` — fields `welcomeDm.enabled`, `welcomeDm.message`, `closeFriendsAdder.enabled`, `closeFriendsAdder.mode`. Plan-locked state reads from `mockUser.plan === 'advanced'`.

### Layout: 2x2 grid

The Overview's existing bottom row is `grid grid-cols-1 lg:grid-cols-2` rendering `<TargetsOverview /> <GrowthSettingsSnapshot />`. New structure:

```
<div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
  <TargetsOverview />
  <TargetingSettingsSnapshot />
</div>
<div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
  <EngagementSnapshot />
  {/* Instagram Audit card lands here in the follow-up spec */}
</div>
```

For this spec only (until the Audit ships), the second row's right cell is filled by `EngagementSnapshot` itself spanning both columns on `lg:` via `lg:col-span-2` — keeps the page from showing an awkward empty half-cell. That `lg:col-span-2` will be removed when Audit lands.

`items-stretch` ensures sibling cards in each row share row height (matches the existing recipe on the Overview's `TargetsOverview` + snapshot row).

## File map

**New files:**
- `src/pages/overview/TargetingSettingsSnapshot.jsx` — moved + scoped from inline `GrowthSettingsSnapshot` in `src/pages/overview/index.jsx`. Reads only `mode`, `likeAfterFollow`, `filters` from `useGrowthConfig`. Pulls the existing fmt/range/privacyLabel/genderLabel helpers along with it (those are private to the snapshot logic).
- `src/pages/overview/EngagementSnapshot.jsx` — new component. Reads `welcomeDm` + `closeFriendsAdder` from `useGrowthConfig`. Renders two toggle rows + DM preview + CFA mode caption.

**Modified files:**
- `src/pages/overview/index.jsx` — delete the inline `GrowthSettingsSnapshot` and `GrowthSettingsSnapshotBody` functions (lines ~1481-1606). Import the two new components. Replace the single bottom-row grid with two rows per the layout above. Drop unused imports (`Settings2`, `Shield`, `Heart`, `MessageSquare` if no longer used elsewhere in the file — verify before removal).

## Component contracts

### `TargetingSettingsSnapshot.jsx`

```jsx
import { Link } from 'react-router-dom'
import { ChevronRight, Settings2, Target, Heart } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

export default function TargetingSettingsSnapshot() {
  const config = useGrowthConfig((s) => s.config)
  // ... mode + likeAfterFollow + filters rendering ...
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 lg:p-6">
      <h2 className="text-base font-semibold text-text-primary">Targeting settings</h2>
      {/* Mode row + Like-after-follow row */}
      {/* Filters section with 6 pills */}
      <div className="mt-auto flex justify-center pt-4">
        <Link to="/targeting?tab=settings" className="...">
          Edit Targeting
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
```

### `EngagementSnapshot.jsx`

```jsx
import { Link } from 'react-router-dom'
import { ChevronRight, MessageSquare, Star } from 'lucide-react'
import { mockUser } from '@/mocks/user'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

export default function EngagementSnapshot() {
  const config = useGrowthConfig((s) => s.config)
  const isAdvanced = mockUser.plan === 'advanced'
  // ... welcomeDm + closeFriendsAdder rendering ...
  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 lg:p-6">
      <h2 className="text-base font-semibold text-text-primary">Engagement settings</h2>
      {/* Welcome DM toggle row + 1-line message preview when on */}
      {/* CFA toggle row + mode caption when on */}
      <div className="mt-auto flex justify-center pt-4">
        <Link to="/engagement" className="...">
          Edit Engagement
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
```

### Pill / row styling

Both snapshots use the same row recipe as the existing `GrowthSettingsSnapshotBody` so the visual continuity is preserved:

```jsx
<div className="flex items-center justify-between py-3.5">
  <div className="flex items-center gap-2.5">
    <Icon className="h-4 w-4 text-text-muted" />
    <span className="text-sm text-text-secondary">{label}</span>
  </div>
  <Pill ... />
</div>
```

Pill states:
- On → `bg-green-tint text-green-text` "On"
- Off → `bg-bg text-text-muted` "Off"
- Locked (Growth plan on Advanced-only feature) → `bg-bg text-text-muted` "Advanced"
- Mode badge (Auto / Follow only / Unfollow only) → `bg-blue-tint text-blue-text`

### Welcome DM message preview (within Engagement snapshot)

When `welcomeDm.enabled === true` and not locked:

```jsx
<div className="mt-2 rounded-lg bg-blue-tint/40 px-3 py-2">
  <p className="line-clamp-1 text-xs text-text-secondary">
    {config.welcomeDm.message}
  </p>
</div>
```

Subdued blue-tint background distinguishes the preview from the bare toggle row above without competing with the actual chat-bubble preview on the Engagement page.

### CFA mode caption (within Engagement snapshot)

When `closeFriendsAdder.enabled === true` and not locked:

```jsx
<p className="mt-1 pl-6 text-xs text-text-muted">
  Mode: {config.closeFriendsAdder.mode === 'remove' ? 'Remove Followers' : 'Add Followers'}
</p>
```

`pl-6` aligns with the icon-text rhythm above without needing its own icon.

## Edge cases & decisions locked

- **Plan locks render on both snapshots.** Welcome DM and CFA show an "Advanced" pill (and skip their preview/caption) when the user is on Growth plan. The Targeting snapshot has no plan-locked content.
- **Footer link styling matches today.** Same `text-blue-text` recipe, same chevron, same `mt-auto` pin-to-bottom inside a `flex flex-col h-full` card. This keeps the visual rhythm of the Overview page.
- **Both snapshots stretch to the row height** via `lg:items-stretch` on the parent grid. When one card has more inner content, the shorter one fills its space at the bottom with whitespace (the footer link stays pinned via `mt-auto`).
- **Mobile** stacks all four cards single-column (the two rows become four sequential cards). No additional logic needed.
- **`lg:col-span-2` on `EngagementSnapshot`** is a transient state until Instagram Audit lands. Single-line change to remove. Spec for Audit follows immediately after this one.
- **The current `GrowthSettingsSnapshot` and `GrowthSettingsSnapshotBody` inline functions are deleted.** They're replaced, not extended. No back-compat needed (no other consumers).
- **No new mock data.** Both new components read existing fields from `useGrowthConfig` and `mockUser`.

## Out of scope

- The Instagram Audit card (own spec, immediately follows).
- Adding new fields to `useGrowthConfig` or any mock store.
- Animation/transition polish on the snapshot cards.
- Empty-state copy for users with no targets / no engagement config (current snapshot handles this implicitly — the toggle rows just show Off).
- Mobile reordering (stack order = source order, which puts TargetsOverview first, matching today's behavior).
