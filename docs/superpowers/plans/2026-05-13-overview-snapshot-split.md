# Overview Snapshot Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the bundled `GrowthSettingsSnapshot` on the Overview page with two single-purpose snapshot cards (Targeting / Engagement), each with a working destination CTA, and lay them out in two 2-col rows.

**Architecture:** Two new presentational components in `src/pages/overview/` that each read the relevant slice of `useGrowthConfig`. Overview's `index.jsx` deletes the inline `GrowthSettingsSnapshot` + `GrowthSettingsSnapshotBody`, imports the new pair, and rebuilds the bottom block as two grid rows. No new mock data; no store changes.

**Tech Stack:** React 19, React Router 7, Zustand 5, Tailwind v4, Lucide React. No test runner — each task verifies via `npm run build` + manual UI check.

**Spec:** `docs/superpowers/specs/2026-05-13-overview-snapshot-split-design.md`

---

## File map

**New:**
- `src/pages/overview/TargetingSettingsSnapshot.jsx` — Mode + Like-after-follow + Filters → /targeting?tab=settings
- `src/pages/overview/EngagementSnapshot.jsx` — Welcome DM toggle + 1-line message preview + CFA toggle + mode caption → /engagement

**Modified:**
- `src/pages/overview/index.jsx` — delete inline `GrowthSettingsSnapshot` + `GrowthSettingsSnapshotBody` (~lines 1481-1606). Import new components. Rebuild the bottom block into two grid rows. Drop now-unused lucide imports (`Settings2`, `Heart`, `Shield`, `MessageSquare`) only after confirming they aren't referenced elsewhere in the file.

---

### Task 1: Create `TargetingSettingsSnapshot.jsx`

**Files:**
- Create: `src/pages/overview/TargetingSettingsSnapshot.jsx`

- [ ] **Step 1: Create the component file**

```jsx
import { Link } from 'react-router-dom'
import { ChevronRight, Heart, Settings2, Target } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

const MODE_LABELS = {
  auto: 'Auto',
  follow_only: 'Follow only',
  unfollow_only: 'Unfollow only',
}

// Compact number formatter for filter pills. "5K" instead of "5,000"
// keeps all six pills readable when they share a single narrow row.
function fmt(n) {
  if (n == null) return '∞'
  if (n >= 1000) {
    return n % 1000 === 0 ? `${n / 1000}K` : `${(n / 1000).toFixed(1)}K`
  }
  return String(n)
}
function range(min, max) {
  return max == null ? `${fmt(min)}+` : `${fmt(min)}–${fmt(max)}`
}

// Snapshot of the user's Targeting engine config. Mode + Like-after-
// follow + Audience filters. Reads live from useGrowthConfig so
// changes made on /targeting?tab=settings reflect here immediately.
// Footer CTA routes back to that page.
export default function TargetingSettingsSnapshot() {
  const config = useGrowthConfig((s) => s.config)

  const privacyLabel =
    { all: 'All', public: 'Public only', private: 'Private only' }[
      config.filters.accountPrivacy
    ] ?? 'All'

  const genderLabel = config.filters.genderTarget
    ? config.filters.genderTarget === 'male'
      ? 'Male'
      : 'Female'
    : 'Any'

  const filterPills = [
    {
      label: 'Following',
      value: range(config.filters.followingMin, config.filters.followingMax),
    },
    {
      label: 'Followers',
      value: range(config.filters.followerMin, config.filters.followerMax),
    },
    {
      label: 'Media',
      value: range(config.filters.mediaMin, config.filters.mediaMax),
    },
    {
      label: 'NSFW',
      value: config.filters.excludeNsfw ? 'Excluded' : 'Allowed',
    },
    { label: 'Privacy', value: privacyLabel },
    { label: 'Gender', value: genderLabel },
  ]

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 lg:p-6">
      <h2 className="text-base font-semibold text-text-primary">
        Targeting settings
      </h2>

      <div className="mt-4 divide-y divide-border">
        <div className="flex items-center justify-between py-3.5">
          <div className="flex items-center gap-2.5">
            <Settings2 className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span className="text-sm text-text-secondary">Mode</span>
          </div>
          <span className="rounded-full bg-blue-tint px-2.5 py-1 text-xs font-medium text-blue-text">
            {MODE_LABELS[config.mode]}
          </span>
        </div>

        <div className="flex items-center justify-between py-3.5">
          <div className="flex items-center gap-2.5">
            <Heart className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span className="text-sm text-text-secondary">
              Like after follow
            </span>
          </div>
          {config.likeAfterFollow ? (
            <span className="rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
              On
            </span>
          ) : (
            <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-text-muted">
              Off
            </span>
          )}
        </div>

        <div className="py-4">
          <div className="flex items-center gap-2.5">
            <Target className="h-4 w-4 text-text-muted" aria-hidden="true" />
            <span className="text-sm text-text-secondary">Filters</span>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {filterPills.map((f) => (
              <span
                key={f.label}
                className="inline-flex items-center gap-1 rounded-full bg-bg px-3 py-1 text-xs"
              >
                <span className="text-text-muted">{f.label}:</span>
                <span className="font-medium text-text-primary">{f.value}</span>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-auto flex justify-center pt-4">
        <Link
          to="/targeting?tab=settings"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-text transition-colors hover:opacity-80"
        >
          Edit Targeting
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS (component is self-contained, no consumer yet)

- [ ] **Step 3: Commit**

```bash
git add src/pages/overview/TargetingSettingsSnapshot.jsx
git commit -m "feat(overview): add TargetingSettingsSnapshot component"
```

---

### Task 2: Create `EngagementSnapshot.jsx`

**Files:**
- Create: `src/pages/overview/EngagementSnapshot.jsx`

- [ ] **Step 1: Create the component file**

```jsx
import { Link } from 'react-router-dom'
import { ChevronRight, MessageSquare, Star } from 'lucide-react'
import { mockUser } from '@/mocks/user'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

// Snapshot of the user's Engagement config. Welcome DM toggle + 1-line
// message preview (when on); Close Friends Adder toggle + mode caption
// (when on). Plan-locked rows render an "Advanced" pill instead. Reads
// live from useGrowthConfig + mockUser; CTA routes to /engagement.
export default function EngagementSnapshot() {
  const config = useGrowthConfig((s) => s.config)
  const isAdvanced = mockUser.plan === 'advanced'

  const dmEnabled = config.welcomeDm.enabled && isAdvanced
  const cfaEnabled = config.closeFriendsAdder.enabled && isAdvanced

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-surface p-4 lg:p-6">
      <h2 className="text-base font-semibold text-text-primary">
        Engagement settings
      </h2>

      <div className="mt-4 divide-y divide-border">
        {/* Welcome DM */}
        <div className="py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <MessageSquare
                className="h-4 w-4 text-text-muted"
                aria-hidden="true"
              />
              <span className="text-sm text-text-secondary">Welcome DM</span>
            </div>
            {!isAdvanced ? (
              <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-text-muted">
                Advanced
              </span>
            ) : config.welcomeDm.enabled ? (
              <span className="rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
                On
              </span>
            ) : (
              <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-text-muted">
                Off
              </span>
            )}
          </div>
          {dmEnabled && (
            <div className="mt-2 rounded-lg bg-blue-tint/40 px-3 py-2">
              <p className="line-clamp-1 text-xs text-text-secondary">
                {config.welcomeDm.message}
              </p>
            </div>
          )}
        </div>

        {/* Close Friends Adder */}
        <div className="py-3.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Star className="h-4 w-4 text-text-muted" aria-hidden="true" />
              <span className="text-sm text-text-secondary">
                Close Friends Adder
              </span>
            </div>
            {!isAdvanced ? (
              <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-text-muted">
                Advanced
              </span>
            ) : config.closeFriendsAdder.enabled ? (
              <span className="rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text">
                On
              </span>
            ) : (
              <span className="rounded-full bg-bg px-2.5 py-1 text-xs font-medium text-text-muted">
                Off
              </span>
            )}
          </div>
          {cfaEnabled && (
            <p className="mt-1 pl-6 text-xs text-text-muted">
              Mode:{' '}
              {config.closeFriendsAdder.mode === 'remove'
                ? 'Remove Followers'
                : 'Add Followers'}
            </p>
          )}
        </div>
      </div>

      <div className="mt-auto flex justify-center pt-4">
        <Link
          to="/engagement"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-text transition-colors hover:opacity-80"
        >
          Edit Engagement
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run build**

Run: `npm run build`
Expected: PASS

- [ ] **Step 3: Commit**

```bash
git add src/pages/overview/EngagementSnapshot.jsx
git commit -m "feat(overview): add EngagementSnapshot component"
```

---

### Task 3: Wire the new components into Overview, delete the old snapshot

**Files:**
- Modify: `src/pages/overview/index.jsx`

- [ ] **Step 1: Replace the snapshot section + import the new components**

Open `src/pages/overview/index.jsx`. Find the import block at the top (around lines 1-50) and:

1. Confirm `Heart`, `Shield`, `Settings2`, `MessageSquare` are NOT used anywhere else in the file. Run `grep -n "Heart\\|Shield\\|Settings2\\|MessageSquare" src/pages/overview/index.jsx`. The only matches should be inside the deleted `GrowthSettingsSnapshotBody` function — if they appear elsewhere (e.g. AccountLiveStatus phase icons, MetricCard usage), keep those imports.

After deletion, the file at `lucide-react` import block keeps only icons still used. The known-after-delete inventory: `Target`, `ArrowRight`, `AlertTriangle`, `Clock`, `Activity`, `Flame`, `ChevronRight`, `Hash`, `Star`, `Pause`, `Play`, `UserMinus`, `UserPlus`, `Users`, `Search`. Re-run grep after deletion and prune anything not referenced.

2. Add these two imports anywhere in the top import section (group with the existing relative imports):

```jsx
import TargetingSettingsSnapshot from './TargetingSettingsSnapshot'
import EngagementSnapshot from './EngagementSnapshot'
```

- [ ] **Step 2: Delete the inline `GrowthSettingsSnapshot` + `GrowthSettingsSnapshotBody` functions**

In `src/pages/overview/index.jsx`, locate the block starting at the `function GrowthSettingsSnapshot({ plan })` declaration (around line 1481) and ending at the closing `}` of `GrowthSettingsSnapshotBody` (around line 1606). Delete the entire block including both functions.

The block to delete starts with:
```jsx
function GrowthSettingsSnapshot({ plan }) {
```
and ends with:
```jsx
    </div>
  )
}
```
(closing the `GrowthSettingsSnapshotBody` return).

- [ ] **Step 3: Replace the page's bottom-row block**

Find the existing bottom block in the page render. It looks like:

```jsx
{/* Targets + Growth Settings — side by side on lg:, stacked on mobile.
    Both are targeting-related so they share a row as sibling cards. */}
<div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
  {/* Both snapshots subscribe to the live Zustand stores so changes
      made on the Targeting / Growth pages propagate here. */}
  <TargetsOverview plan={user.plan} />
  <GrowthSettingsSnapshot plan={user.plan} />
</div>
```

Replace it with:

```jsx
{/* Bottom block — two 2-col rows. Row 1 pairs the Top Targets list
    with the Targeting settings snapshot (both about who/how to
    target). Row 2 holds the Engagement snapshot; its right cell is
    reserved for the Instagram Audit card (separate spec landing
    next), so we span the snapshot across both columns on lg: for
    now to avoid an empty half-cell. */}
<div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
  <TargetsOverview plan={user.plan} />
  <TargetingSettingsSnapshot />
</div>
<div className="mt-4 grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
  <div className="lg:col-span-2">
    <EngagementSnapshot />
  </div>
</div>
```

- [ ] **Step 4: Remove now-unused lucide-react imports**

Run: `grep -n "Heart\|Shield\|Settings2\|MessageSquare" src/pages/overview/index.jsx`

For each icon name in the result, if the ONLY remaining reference is the line in the lucide-react import block, remove it from the import list. If there's a real usage anywhere in the file (look at the matched line — is it inside a JSX `<Icon ... />` or being passed as an `icon: Icon` field?), keep the import.

Example: if grep returns only `import { ..., Heart, ... } from 'lucide-react'`, remove `Heart` from that import line. The resulting line should look like (assuming `Heart`, `Shield`, `Settings2`, `MessageSquare` all become unused):

```jsx
import {
  Target,
  ArrowRight,
  AlertTriangle,
  Clock,
  Activity,
  Flame,
  Search,
  UserMinus,
  UserPlus,
  Users,
  ChevronRight,
  Hash,
  Star,
  Pause,
  Play,
} from 'lucide-react'
```

If grep shows a real consumer (e.g. `Heart` is referenced in another section of the file), leave that icon in the import.

- [ ] **Step 5: Run build**

Run: `npm run build`
Expected: PASS. Any lucide-react import name that was deleted but still referenced will fail with "Heart is not defined" — that means Step 4 over-pruned. Add the missing icon back to the import list and rebuild.

- [ ] **Step 6: Manual verification**

Run: `npm run dev` and open `/`.

1. The bottom of the Overview page now shows two rows:
   - Row 1: Top Targets list (left) + Targeting settings (right) on lg:+; stacked on mobile.
   - Row 2: Engagement settings card spanning the full width on lg:+; mobile unchanged.
2. The Targeting card shows Mode pill + Like-after-follow toggle pill + Filters pill row. Footer link reads **"Edit Targeting →"** and navigates to `/targeting?tab=settings` (lands on the Settings tab).
3. The Engagement card shows two toggle rows. When Welcome DM is on, a faded blue-tint preview of the current message renders below its row. When CFA is on, a `Mode: Add Followers` (or `Remove Followers`) caption renders below its row. Footer link reads **"Edit Engagement →"** and navigates to `/engagement`.
4. On Growth plan (toggle `mockUser.plan` to `'growth'` if needed for verification), both Engagement rows show an "Advanced" pill and skip the preview/caption.
5. No console errors. No 404 navigation when clicking either footer link.

- [ ] **Step 7: Commit**

```bash
git add src/pages/overview/index.jsx
git commit -m "feat(overview): replace bundled snapshot with split Targeting + Engagement cards"
```

---

### Task 4: Update CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Insert entry at the top of the entries list**

Open `CHANGELOG.md`. Find the most recent dated entry (whichever currently sits at the top under the session note). Insert ABOVE it:

```markdown
## 2026-05-13 — Overview snapshot split

The Overview page's bundled "Growth Settings" snapshot has been replaced with two single-purpose snapshot cards, each routing to the correct destination page.

### Added
- `TargetingSettingsSnapshot` component — shows Mode + Like-after-follow + Filters (6 pills). Footer CTA "Edit Targeting" → `/targeting?tab=settings`.
- `EngagementSnapshot` component — shows Welcome DM toggle + 1-line message preview when on, and Close Friends Adder toggle + mode caption when on. Plan-locked rows render an "Advanced" pill. Footer CTA "Edit Engagement" → `/engagement`.

### Changed
- Overview page bottom block reorganized into two `grid-cols-1 lg:grid-cols-2` rows. Row 1: `TargetsOverview` + `TargetingSettingsSnapshot`. Row 2: `EngagementSnapshot` (currently `lg:col-span-2` pending the Instagram Audit card landing in the next spec).

### Removed
- Inline `GrowthSettingsSnapshot` and `GrowthSettingsSnapshotBody` functions from `src/pages/overview/index.jsx`. The "Edit Growth" CTA they shipped pointed to `/growth` — a route that doesn't exist — and the bundling of Targeting + Engagement settings under one card created mental-model confusion.

### Decisions (locked, don't revisit)
- **Snapshot scope = page scope.** Each snapshot reflects exactly one destination page; never mix settings that live on two pages.
- **Footer CTA goes to the page the snapshot summarizes.** "Edit X" pattern with the destination name.
- **Plan-locked toggles render an `Advanced` pill** with no preview/caption — same pattern the Engagement page itself uses.

### Spec & plan
- Spec: `docs/superpowers/specs/2026-05-13-overview-snapshot-split-design.md`
- Plan: `docs/superpowers/plans/2026-05-13-overview-snapshot-split.md`
```

If the session note line (`> **2026-05-12 session note:** ...`) is now stale (it claims N entries when there are now N+1), update the count or strike it through. If the current top-of-file session note doesn't pertain to 2026-05-13, no edit needed — just leave the note alone.

- [ ] **Step 2: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog entry for Overview snapshot split"
```

---

## Self-review summary

**Spec coverage check:**
- ✅ Two new snapshot components (Targeting + Engagement) → Tasks 1 + 2
- ✅ Targeting CTA → `/targeting?tab=settings` → Task 1 `<Link to="/targeting?tab=settings">`
- ✅ Engagement CTA → `/engagement` → Task 2 `<Link to="/engagement">`
- ✅ Welcome DM message preview when on → Task 2 (`dmEnabled` branch renders the `bg-blue-tint/40` block)
- ✅ CFA mode caption when on → Task 2 (`cfaEnabled` branch renders the `Mode: ...` line)
- ✅ Plan locks render "Advanced" pill, skip preview/caption → Task 2
- ✅ Layout: two 2-col rows, `EngagementSnapshot` spans both cols on lg until Audit ships → Task 3 Step 3
- ✅ Inline `GrowthSettingsSnapshot` + `GrowthSettingsSnapshotBody` deleted → Task 3 Step 2
- ✅ Now-unused icon imports pruned → Task 3 Step 4
- ✅ CHANGELOG entry → Task 4

**Type / naming consistency check:**
- Component exports: `TargetingSettingsSnapshot` (default), `EngagementSnapshot` (default) — consistent in Tasks 1, 2, 3.
- Config field reads: `config.mode`, `config.likeAfterFollow`, `config.filters.*`, `config.welcomeDm.enabled`, `config.welcomeDm.message`, `config.closeFriendsAdder.enabled`, `config.closeFriendsAdder.mode` — match the existing store shape verified in `src/stores/useGrowthConfig.js` and the existing snapshot body code.
- `MODE_LABELS` keys match the three values in `mockGrowthConfig.mode` enum.
- CFA mode display values: `'Add Followers'` / `'Remove Followers'` match the labels established on the Engagement page (`CF_MODES` in `CloseFriendsCard.jsx`).
- Route paths: `/targeting?tab=settings` (verified — the Targeting page reads `?tab=` and lands on Settings tab when `tab === 'settings'`); `/engagement` (verified — App.jsx has this route).
