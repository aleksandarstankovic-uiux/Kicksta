# Targeting / Engagement Split Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split `/growth` and `/targets` so each page has one purpose. `/targets` becomes `/targeting` with `Targets` (default) and `Settings` tabs (Mode + Like-after-follow + Audience filters + Whitelist + Blacklist). `/growth` becomes `/engagement`, single-column with Welcome DM + Close Friends + GrowthPlusBanner.

**Architecture:** Folder renames `targets/` → `targeting/` and `growth/` → `engagement/`. New `TargetsTab.jsx` and `SettingsTab.jsx` host the two tab modes (state via `?tab=settings` search param). `EngagementCard.jsx` splits into `WelcomeDmCard.jsx` + `CloseFriendsCard.jsx`. Like-after-follow row moves into `ModeCard.jsx`. `FiltersCard` + `FiltersModal` rename to `AudienceFiltersCard` + `AudienceFiltersModal`. Stores stay shape-stable; only consumer locations change. Old routes 301-redirect to the new ones.

**Tech Stack:** React 19 · React Router 7 · Tailwind 4 · Zustand 5 · Lucide React.

**Spec:** `docs/superpowers/specs/2026-04-30-targeting-engagement-split-design.md`

**Testing strategy:** V1 frontend-only, no test runner. Verification per task is **manual**: run dev server, hit affected routes at narrow + wide widths in light + dark, confirm listed behaviors. Don't take screenshots (per `CLAUDE.md`); only flag breakage.

**Frequent commits:** each task ends with one commit using `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>`.

**Branch:** working on `main` per established workflow; tag a restore point first.

---

## File map (final state)

```
src/pages/targeting/                  ← renamed from src/pages/targets/
  index.jsx                           ← rewritten: H1 + subtitle + tab strip + ?tab routing
  TargetsTab.jsx                      ← NEW
  SettingsTab.jsx                     ← NEW
  TargetsHeroCard.jsx                 ← unchanged
  FilterRow.jsx                       ← unchanged
  TargetList.jsx                      ← unchanged
  TargetRow.jsx                       ← unchanged
  TargetDetailDrawer.jsx              ← unchanged in this spec
  RemoveTargetModal.jsx               ← unchanged
  AddTargetSheet.jsx                  ← unchanged in this spec
  HealthPill.jsx                      ← unchanged
  ModeCard.jsx                        ← MOVED from growth/, absorbs Like-after-follow row
  AudienceFiltersCard.jsx             ← MOVED + renamed from growth/FiltersCard.jsx
  AudienceFiltersModal.jsx            ← MOVED + renamed from growth/FiltersModal.jsx
  AudienceReachEstimate.jsx           ← MOVED from growth/
  audienceReach.js                    ← MOVED from growth/
  WhitelistCard.jsx                   ← MOVED from growth/
  WhitelistModal.jsx                  ← MOVED from growth/
  BlacklistCard.jsx                   ← MOVED from growth/
  BlacklistModal.jsx                  ← MOVED from growth/

src/pages/engagement/                 ← renamed from src/pages/growth/
  index.jsx                           ← rewritten: Welcome DM + Close Friends + GrowthPlusBanner
  WelcomeDmCard.jsx                   ← NEW (extracted from EngagementCard)
  CloseFriendsCard.jsx                ← NEW (extracted from EngagementCard)
  WelcomeDmPreview.jsx                ← MOVED from growth/, unchanged
  WelcomeDmModal.jsx                  ← MOVED from growth/, unchanged
  CloseFriendsProgress.jsx            ← MOVED from growth/, unchanged

DELETED:
  src/pages/growth/                   ← whole folder, after all moves complete
  src/pages/growth/EngagementCard.jsx ← split into WelcomeDmCard + CloseFriendsCard
  src/pages/targets/                  ← renamed (folder gone)
```

---

## Task 1: Tag restore point

**Files:** None (git tag only).

- [ ] **Step 1: Tag**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git tag pre-targeting-engagement-split-2026-04-30
git rev-parse pre-targeting-engagement-split-2026-04-30
```

Expected: prints HEAD's SHA. No commit.

---

## Task 2: Extract Welcome DM + Close Friends from EngagementCard, fold Like-after-follow into ModeCard

**Files:**
- Create: `src/pages/growth/WelcomeDmCard.jsx`
- Create: `src/pages/growth/CloseFriendsCard.jsx`
- Modify: `src/pages/growth/ModeCard.jsx`
- Modify: `src/pages/growth/index.jsx`
- Delete: `src/pages/growth/EngagementCard.jsx`

The current `EngagementCard.jsx` contains three rows: Like-after-follow, Welcome DM (with WelcomeDmPreview + WelcomeDmModal), Close Friends Adder (with mode picker + CloseFriendsProgress). The `ModeCard.jsx` currently has the Auto / Follow-only / Unfollow-only segmented control + dirty-state Save/Cancel.

This task does three things in one commit because they're tightly coupled:
1. Extract Welcome DM into its own card.
2. Extract Close Friends into its own card.
3. Move Like-after-follow into ModeCard. Delete the now-empty EngagementCard.

- [ ] **Step 1: Create `src/pages/growth/WelcomeDmCard.jsx`**

```jsx
import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import WelcomeDmModal from './WelcomeDmModal'
import WelcomeDmPreview from './WelcomeDmPreview'

// Welcome DM — auto-DM new followers once they follow back. Advanced
// plan only; locked-state for Growth users routes to the upgrade
// bottom sheet.
function isLocked(user) {
  return user.plan !== 'advanced'
}

export default function WelcomeDmCard({ onRequestUpgrade }) {
  const { config, toggleWelcomeDm } = useGrowthConfig()
  const [dmModalOpen, setDmModalOpen] = useState(false)

  const locked = isLocked(mockUser)
  const showPreview = config.welcomeDm.enabled && !locked

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <CardChip color="green" icon={MessageSquare} />
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">Welcome DM</h2>
          <InfoTooltip text="Send a one-time message when new followers follow back." />
        </div>
      </div>

      <div className="mt-2 flex flex-col">
        <SettingSwitch
          icon={MessageSquare}
          title="Welcome DM"
          description="Auto-DM new followers once they follow back."
          checked={config.welcomeDm.enabled}
          onChange={() => toggleWelcomeDm()}
          locked={locked}
          onLockedTap={() => onRequestUpgrade('welcome_dm')}
        />
        <WelcomeDmPreview
          enabled={showPreview}
          message={config.welcomeDm.message}
          onEdit={() => setDmModalOpen(true)}
        />
      </div>

      <WelcomeDmModal open={dmModalOpen} onClose={() => setDmModalOpen(false)} />
    </section>
  )
}
```

- [ ] **Step 2: Create `src/pages/growth/CloseFriendsCard.jsx`**

```jsx
import { Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import CloseFriendsProgress from './CloseFriendsProgress'

// Close Friends Adder — auto-manage the IG Close Friends list as
// followers come and go. Advanced plan only.
function isLocked(user) {
  return user.plan !== 'advanced'
}

const CF_MODES = [
  {
    value: 'add',
    label: 'Add new followers',
    description:
      'New followers are automatically added to your Close Friends list.',
  },
  {
    value: 'remove',
    label: 'Remove unfollowers',
    description:
      'Users who unfollow you are removed from your Close Friends list.',
  },
]

export default function CloseFriendsCard({ onRequestUpgrade }) {
  const { config, toggleCloseFriends, setCloseFriendsMode } = useGrowthConfig()

  const locked = isLocked(mockUser)
  const cfEnabled = config.closeFriendsAdder.enabled
  const cfMode = config.closeFriendsAdder.mode
  const showCfControls = cfEnabled && !locked

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <CardChip color="purple" icon={Star} />
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">Close Friends Adder</h2>
          <InfoTooltip text="Automatically manage your Close Friends list as followers come and go." />
        </div>
      </div>

      <div className="mt-2 flex flex-col">
        <SettingSwitch
          icon={Star}
          title="Close Friends Adder"
          description="Automatically manage your Close Friends list."
          checked={cfEnabled}
          onChange={() => toggleCloseFriends()}
          locked={locked}
          onLockedTap={() => onRequestUpgrade('close_friends')}
        />
        {/* Segmented control fills the row width. Greyed when toggle is off. */}
        <div className="pb-3 pt-1">
          <div
            className={`flex w-full rounded-full bg-bg p-1 ${
              showCfControls ? '' : 'opacity-60'
            }`}
            aria-disabled={!showCfControls}
          >
            {CF_MODES.map((m) => {
              const selected = cfMode === m.value
              return (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setCloseFriendsMode(m.value)}
                  disabled={!showCfControls}
                  className={`inline-flex h-8 flex-1 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
                    selected
                      ? 'bg-surface text-text-primary shadow-sm'
                      : 'text-text-secondary hover:text-text-primary'
                  }`}
                >
                  {m.label}
                </button>
              )
            })}
          </div>
          <CloseFriendsProgress mode={cfMode} enabled={showCfControls} />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 3: Read `src/pages/growth/ModeCard.jsx`**

Run: `cat src/pages/growth/ModeCard.jsx`. Confirm the closing `</section>` is around line 165, and the JSX inside renders the option grid + `dirty && SaveCancelButtons` block. We're appending a Like-after-follow row inside the same `<section>` after the existing JSX block (after the dirty-mobile block, before the closing `</section>`).

- [ ] **Step 4: Modify `src/pages/growth/ModeCard.jsx` — add Like-after-follow row**

Use the Edit tool. First, update imports — add `Heart` to the lucide-react import + add SettingSwitch import:

REPLACE:
```jsx
import { Check, Settings2, UserMinus, UserPlus, Zap } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
```

WITH:
```jsx
import { Check, Heart, Settings2, UserMinus, UserPlus, Zap } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import SettingSwitch from '@/components/SettingSwitch'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
```

Then in the component body, locate the line `const { config, setMode } = useGrowthConfig()` (or similar destructure of `useGrowthConfig`) and add `toggleLikeAfterFollow` to it.

REPLACE the destructure line, e.g.:
```jsx
  const { config, setMode } = useGrowthConfig()
```

WITH:
```jsx
  const { config, setMode, toggleLikeAfterFollow } = useGrowthConfig()
```

(If the destructure already includes more fields, add `toggleLikeAfterFollow` alongside them.)

Finally, find the line that closes the dirty mobile block (`{dirty && (...)}` ending around line 164) and insert the Like-after-follow row after it but before the closing `</section>`:

REPLACE:
```jsx
      {dirty && (
        <div className="mt-4 flex items-center justify-end gap-2 lg:hidden">
          <SaveCancelButtons onCancel={handleCancel} onSave={handleSave} />
        </div>
      )}
    </section>
```

WITH:
```jsx
      {dirty && (
        <div className="mt-4 flex items-center justify-end gap-2 lg:hidden">
          <SaveCancelButtons onCancel={handleCancel} onSave={handleSave} />
        </div>
      )}

      {/* Like-after-follow — moved out of the deleted EngagementCard.
          Conceptually part of the follow action ("like a few of their
          posts after following"), so it belongs with Mode rather than
          as a standalone tactic card. */}
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

- [ ] **Step 5: Modify `src/pages/growth/index.jsx` — replace EngagementCard with the two new cards**

Read the current file: `cat src/pages/growth/index.jsx`.

REPLACE the import:
```jsx
import EngagementCard from './EngagementCard'
```

WITH:
```jsx
import WelcomeDmCard from './WelcomeDmCard'
import CloseFriendsCard from './CloseFriendsCard'
```

REPLACE the JSX usage:
```jsx
        <EngagementCard onRequestUpgrade={openUpgrade} />
        <FiltersCard onEdit={() => setFiltersOpen(true)} />
```

WITH:
```jsx
        <WelcomeDmCard onRequestUpgrade={openUpgrade} />
        <CloseFriendsCard onRequestUpgrade={openUpgrade} />
        <FiltersCard onEdit={() => setFiltersOpen(true)} />
```

The grid keeps `lg:grid-cols-2` — Welcome DM, Close Friends, Filters, Whitelist, Blacklist now fill 5 cells. They flow naturally in a 2-col grid.

- [ ] **Step 6: Delete `src/pages/growth/EngagementCard.jsx`**

```bash
git rm src/pages/growth/EngagementCard.jsx
```

- [ ] **Step 7: Sanity-grep — confirm no stale imports**

```bash
grep -rn "EngagementCard" src/
```

Expected: zero matches.

- [ ] **Step 8: Commit**

```bash
git add src/pages/growth/WelcomeDmCard.jsx \
        src/pages/growth/CloseFriendsCard.jsx \
        src/pages/growth/ModeCard.jsx \
        src/pages/growth/index.jsx \
        src/pages/growth/EngagementCard.jsx
git commit -m "$(cat <<'EOF'
refactor(growth): split EngagementCard, fold Like-after-follow into Mode

EngagementCard was three concerns in one card (Like-after-follow,
Welcome DM, Close Friends). Splits into:
- ModeCard absorbs the Like-after-follow row (it's a follow-time
  action, not a standalone engagement tactic).
- WelcomeDmCard.jsx — toggle + preview + edit modal.
- CloseFriendsCard.jsx — toggle + mode segmented control + progress.

Both new cards keep the locked-state behavior for Growth-plan users.
GrowthPage's grid now renders Mode + Welcome DM + Close Friends +
Filters + Whitelist + Blacklist. Layout still works in the existing
2-col grid; no spec change visible to users yet.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Rename `FiltersCard` → `AudienceFiltersCard`, `FiltersModal` → `AudienceFiltersModal`

**Files:**
- Rename: `src/pages/growth/FiltersCard.jsx` → `src/pages/growth/AudienceFiltersCard.jsx`
- Rename: `src/pages/growth/FiltersModal.jsx` → `src/pages/growth/AudienceFiltersModal.jsx`
- Modify: `src/pages/growth/index.jsx`
- Modify: the new `AudienceFiltersCard.jsx` (heading + tooltip + import update)

- [ ] **Step 1: Rename files via git**

```bash
git mv src/pages/growth/FiltersCard.jsx src/pages/growth/AudienceFiltersCard.jsx
git mv src/pages/growth/FiltersModal.jsx src/pages/growth/AudienceFiltersModal.jsx
```

- [ ] **Step 2: Update `AudienceFiltersCard.jsx`**

Read the file: `cat src/pages/growth/AudienceFiltersCard.jsx`. Find the import that references `./FiltersModal` and the heading + tooltip strings.

REPLACE:
```jsx
import FiltersModal from './FiltersModal'
```

WITH (if the import exists in this file):
```jsx
import AudienceFiltersModal from './AudienceFiltersModal'
```

(If `AudienceFiltersCard.jsx` does NOT import the modal directly — i.e., the modal is mounted at the page level — skip this replacement and confirm with `grep -n "FiltersModal" src/pages/growth/AudienceFiltersCard.jsx` returning no matches.)

REPLACE the heading text:
```jsx
<h2 className="text-base font-semibold text-text-primary">Filters</h2>
```

WITH:
```jsx
<h2 className="text-base font-semibold text-text-primary">Audience filters</h2>
```

REPLACE the tooltip text (current value may differ; use the closest match):
```jsx
<InfoTooltip text="..." />
```

WITH:
```jsx
<InfoTooltip text="Who Kicksta is allowed to interact with." />
```

If the existing tooltip already says something close, leave it.

- [ ] **Step 3: Update `growth/index.jsx`**

REPLACE:
```jsx
import FiltersCard from './FiltersCard'
import FiltersModal from './FiltersModal'
```

WITH:
```jsx
import AudienceFiltersCard from './AudienceFiltersCard'
import AudienceFiltersModal from './AudienceFiltersModal'
```

REPLACE all occurrences of `<FiltersCard ` with `<AudienceFiltersCard `, and `<FiltersModal ` with `<AudienceFiltersModal `.

- [ ] **Step 4: Sanity-grep**

```bash
grep -rn "FiltersCard\|FiltersModal" src/ | grep -v Audience
```

Expected: zero matches.

- [ ] **Step 5: Commit**

```bash
git add -A src/pages/growth/
git commit -m "$(cat <<'EOF'
refactor(growth): rename FiltersCard/Modal → AudienceFiltersCard/Modal

Disambiguates the engine-level filters card (audience size,
account type, NSFW, etc.) from the upcoming bucket filter pills
on the new Targeting page (Active/Archived). Heading copy
updates to "Audience filters." Store fields and modal behavior
unchanged.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Set up new `engagement/` page (parallel to existing `/growth`)

**Files:**
- Create folder: `src/pages/engagement/`
- Move: `src/pages/growth/WelcomeDmCard.jsx` → `src/pages/engagement/WelcomeDmCard.jsx`
- Move: `src/pages/growth/CloseFriendsCard.jsx` → `src/pages/engagement/CloseFriendsCard.jsx`
- Move: `src/pages/growth/WelcomeDmPreview.jsx` → `src/pages/engagement/WelcomeDmPreview.jsx`
- Move: `src/pages/growth/WelcomeDmModal.jsx` → `src/pages/engagement/WelcomeDmModal.jsx`
- Move: `src/pages/growth/CloseFriendsProgress.jsx` → `src/pages/engagement/CloseFriendsProgress.jsx`
- Create: `src/pages/engagement/index.jsx`
- Modify: `src/App.jsx` (add `/engagement` route, leave `/growth` for now)

- [ ] **Step 1: Move files via git**

```bash
mkdir -p src/pages/engagement
git mv src/pages/growth/WelcomeDmCard.jsx src/pages/engagement/WelcomeDmCard.jsx
git mv src/pages/growth/CloseFriendsCard.jsx src/pages/engagement/CloseFriendsCard.jsx
git mv src/pages/growth/WelcomeDmPreview.jsx src/pages/engagement/WelcomeDmPreview.jsx
git mv src/pages/growth/WelcomeDmModal.jsx src/pages/engagement/WelcomeDmModal.jsx
git mv src/pages/growth/CloseFriendsProgress.jsx src/pages/engagement/CloseFriendsProgress.jsx
```

- [ ] **Step 2: Create `src/pages/engagement/index.jsx`**

```jsx
import { useState } from 'react'
import WelcomeDmCard from './WelcomeDmCard'
import CloseFriendsCard from './CloseFriendsCard'
import GrowthPlusBanner from '@/components/GrowthPlusBanner'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'
import { mockUser } from '@/mocks/user'

// Engagement page — what Kicksta does AFTER a follow-back lands.
// Two cards (Welcome DM + Close Friends), stacked single-column on
// every breakpoint because each has substantial inner content
// (chat-bubble preview, progress strip) that reads better at full
// width than crammed into a 2-col grid.
//
// GrowthPlusBanner stays parked at the bottom for now — its final
// home gets revisited at the end of the broader refactor pass.
export default function EngagementPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)

  const openUpgrade = (feature) => setUpgradeFeature(feature)
  const closeUpgrade = () => setUpgradeFeature(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Engagement
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          How Kicksta interacts with new followers.
        </p>
      </header>

      <div className="mt-4 flex flex-col gap-4">
        <WelcomeDmCard onRequestUpgrade={openUpgrade} />
        <CloseFriendsCard onRequestUpgrade={openUpgrade} />
      </div>

      <div className="mt-4">
        <GrowthPlusBanner isSubscribed={mockUser.growthPlusSubscribed} />
      </div>

      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'welcome_dm'}
      />
    </div>
  )
}
```

- [ ] **Step 3: Update `src/App.jsx`**

Read the file: `cat src/App.jsx`. Add an EngagementPage import and an `/engagement` route. Keep the existing `/growth` route untouched for now (we redirect it in Task 5).

ADD to imports:
```jsx
import EngagementPage from '@/pages/engagement'
```

INSIDE the `<Route element={<DashboardLayout />}>` block, add a new line below `<Route path="/growth" element={<GrowthPage />} />`:

```jsx
<Route path="/engagement" element={<EngagementPage />} />
```

- [ ] **Step 4: Update `src/pages/growth/index.jsx` — fix the moved imports**

The current `growth/index.jsx` still imports `WelcomeDmCard`, `CloseFriendsCard` from `./` — those files are now in `engagement/`. Update those two imports to use absolute paths into the engagement folder.

REPLACE:
```jsx
import WelcomeDmCard from './WelcomeDmCard'
import CloseFriendsCard from './CloseFriendsCard'
```

WITH:
```jsx
import WelcomeDmCard from '@/pages/engagement/WelcomeDmCard'
import CloseFriendsCard from '@/pages/engagement/CloseFriendsCard'
```

This is transitional — `growth/index.jsx` deletes in Task 5. We update the imports here only so the existing `/growth` route still works during the migration (no broken in-between commit).

- [ ] **Step 5: Manual verification**

Run: `npm run dev` (or whatever the project uses).

- `/growth` still renders the existing GrowthPage (5-card grid: Mode + Welcome DM + Close Friends + Audience filters + Whitelist/Blacklist).
- `/engagement` renders the new single-column page with Welcome DM + Close Friends + GrowthPlusBanner.

Both routes work simultaneously. No console errors.

- [ ] **Step 6: Commit**

```bash
git add -A src/pages/engagement/ src/pages/growth/index.jsx src/App.jsx
git commit -m "$(cat <<'EOF'
feat(engagement): add /engagement page with Welcome DM + Close Friends

New src/pages/engagement/ folder hosts WelcomeDmCard,
CloseFriendsCard, and the WelcomeDmPreview / WelcomeDmModal /
CloseFriendsProgress sub-components (moved via git mv from
growth/).

EngagementPage is single-column, full-width, with GrowthPlusBanner
parked at the bottom. /growth still renders the old GrowthPage in
parallel; the next task switches the chrome to /engagement and
retires the old route.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Switch chrome to `/engagement`, redirect `/growth`, retire old GrowthPage

**Files:**
- Modify: `src/App.jsx` (replace `/growth` route with redirect, remove old GrowthPage import)
- Modify: `src/components/DashboardLayout.jsx` (sidebar tabs + bottom-tab tabs array)
- Modify: `src/components/MobileNavDrawer.jsx` (NAV_TABS array)
- Delete: `src/pages/growth/index.jsx` (the GrowthPage)

- [ ] **Step 1: Modify `src/App.jsx`**

Add `Navigate` to the existing react-router-dom import (already done if `/account/payment` redirect is in place; verify with grep).

REMOVE the existing import:
```jsx
import GrowthPage from '@/pages/growth'
```

REPLACE:
```jsx
<Route path="/growth" element={<GrowthPage />} />
```

WITH:
```jsx
<Route path="/growth" element={<Navigate to="/engagement" replace />} />
```

- [ ] **Step 2: Update `src/components/DashboardLayout.jsx`**

Find the `tabs` array (around line 337):

REPLACE:
```jsx
const tabs = [
  { to: '/', icon: BarChart3, label: 'Overview' },
  { to: '/targets', icon: Target, label: 'Targeting' },
  { to: '/growth', icon: TrendingUp, label: 'Growth' },
]
```

WITH:
```jsx
const tabs = [
  { to: '/', icon: BarChart3, label: 'Overview' },
  { to: '/targets', icon: Target, label: 'Targeting' },
  { to: '/engagement', icon: TrendingUp, label: 'Engagement' },
]
```

(The Targeting `to` value still points at `/targets` — Task 6 changes that.)

- [ ] **Step 3: Update `src/components/MobileNavDrawer.jsx`**

Find `NAV_TABS` near the top:

REPLACE:
```jsx
{ to: '/growth', icon: TrendingUp, label: 'Growth' },
```

WITH:
```jsx
{ to: '/engagement', icon: TrendingUp, label: 'Engagement' },
```

- [ ] **Step 4: Delete `src/pages/growth/index.jsx`**

```bash
git rm src/pages/growth/index.jsx
```

- [ ] **Step 5: Sanity-grep**

```bash
grep -rn "GrowthPage\|from '@/pages/growth'\b" src/
```

Expected: zero matches.

```bash
grep -rn "from '@/pages/growth/" src/ | grep -v engagement
```

Expected: only imports for files still living in growth/ (ModeCard, AudienceFiltersCard, AudienceFiltersModal, AudienceReachEstimate, audienceReach, WhitelistCard, WhitelistModal, BlacklistCard, BlacklistModal). Those move to targeting/ in Task 8.

- [ ] **Step 6: Manual verification**

- `/growth` redirects to `/engagement`.
- Sidebar (desktop): "Engagement" entry, links to `/engagement`. Active when on `/engagement`. No "Growth" label visible.
- Mobile bottom tab bar: same.
- Mobile hamburger drawer: same.
- `/engagement` renders correctly.
- The `/growth` route is gone from the active route list.

- [ ] **Step 7: Commit**

```bash
git add -A src/
git commit -m "$(cat <<'EOF'
feat(layout): switch chrome to /engagement, redirect /growth

Sidebar (DashboardLayout tabs), mobile bottom bar, and
MobileNavDrawer NAV_TABS now point to /engagement with label
"Engagement". /growth → 301 redirect to /engagement.

GrowthPage (src/pages/growth/index.jsx) deleted. The growth/
folder still hosts the targeting-engine cards (ModeCard,
AudienceFiltersCard, etc.) — those relocate to targeting/ in a
follow-up task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Rename `targets/` → `targeting/`, update routes + chrome

**Files:**
- Rename folder: `src/pages/targets/` → `src/pages/targeting/`
- Modify: `src/App.jsx`
- Modify: `src/components/DashboardLayout.jsx`
- Modify: `src/components/MobileNavDrawer.jsx`

- [ ] **Step 1: Rename folder via git**

```bash
git mv src/pages/targets src/pages/targeting
```

This moves all 9 files at once. Their internal `import` statements use relative paths (`./TargetList`, etc.) so they keep working without edits.

- [ ] **Step 2: Update `src/App.jsx`**

REPLACE:
```jsx
import TargetsPage from '@/pages/targets'
```

WITH:
```jsx
import TargetingPage from '@/pages/targeting'
```

REPLACE:
```jsx
<Route path="/targets" element={<TargetsPage />} />
```

WITH:
```jsx
<Route path="/targeting" element={<TargetingPage />} />
<Route path="/targets" element={<Navigate to="/targeting" replace />} />
```

- [ ] **Step 3: Update `src/components/DashboardLayout.jsx`**

In the `tabs` array:

REPLACE:
```jsx
{ to: '/targets', icon: Target, label: 'Targeting' },
```

WITH:
```jsx
{ to: '/targeting', icon: Target, label: 'Targeting' },
```

- [ ] **Step 4: Update `src/components/MobileNavDrawer.jsx`**

In `NAV_TABS`:

REPLACE:
```jsx
{ to: '/targets', icon: Target, label: 'Targeting' },
```

WITH:
```jsx
{ to: '/targeting', icon: Target, label: 'Targeting' },
```

- [ ] **Step 5: Sanity-grep**

```bash
grep -rn "/targets'" src/ | grep -v "/targets/" | grep -v Navigate
```

Expected: zero matches (only the Navigate redirect should reference `/targets`).

```bash
grep -rn "from '@/pages/targets'" src/
```

Expected: zero matches.

- [ ] **Step 6: Manual verification**

- `/targets` redirects to `/targeting`.
- `/targeting` renders the existing Targeting page (TargetsHeroCard + FilterRow + TargetList) — no structural change yet.
- Sidebar / bottom tab / drawer "Targeting" links point to `/targeting`, active when on `/targeting`.

- [ ] **Step 7: Commit**

```bash
git add -A src/
git commit -m "$(cat <<'EOF'
refactor(targeting): rename targets/ → targeting/, update routes

Folder move via git mv (history preserved). /targets → 301 redirect
to /targeting. Sidebar + drawer + bottom tab all point to /targeting
with the existing "Targeting" label.

No structural change to the page contents in this commit — the tab
strip + Settings tab land in the next task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Build `TargetsTab.jsx` + tab strip on TargetingPage

**Files:**
- Create: `src/pages/targeting/TargetsTab.jsx`
- Create: `src/pages/targeting/SettingsTab.jsx` (placeholder for now)
- Modify: `src/pages/targeting/index.jsx`

- [ ] **Step 1: Create `src/pages/targeting/TargetsTab.jsx`**

This is the body of the existing TargetingPage extracted into its own component so the parent index.jsx can swap between tabs.

```jsx
import { useState } from 'react'
import TargetsHeroCard from './TargetsHeroCard'
import FilterRow from './FilterRow'
import TargetList from './TargetList'
import TargetDetailDrawer from './TargetDetailDrawer'
import RemoveTargetModal from './RemoveTargetModal'
import AddTargetSheet from './AddTargetSheet'

// Targets tab — operational view: list, filter, sort, add, drill into
// per-target detail. Default tab on /targeting.
export default function TargetsTab() {
  const [sheetOpen, setSheetOpen] = useState(false)
  const [detailTarget, setDetailTarget] = useState(null)
  const [removeTarget, setRemoveTarget] = useState(null)

  return (
    <>
      <TargetsHeroCard onAddTarget={() => setSheetOpen(true)} />
      <FilterRow />
      <TargetList onOpen={(t) => setDetailTarget(t)} />

      <AddTargetSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />

      {detailTarget && (
        <TargetDetailDrawer
          target={detailTarget}
          onClose={() => setDetailTarget(null)}
          onRequestRemove={(t) => {
            setDetailTarget(null)
            setRemoveTarget(t)
          }}
        />
      )}

      {removeTarget && (
        <RemoveTargetModal
          target={removeTarget}
          onClose={() => setRemoveTarget(null)}
        />
      )}
    </>
  )
}
```

- [ ] **Step 2: Create `src/pages/targeting/SettingsTab.jsx` (placeholder)**

```jsx
// Settings tab — engine configuration. Placeholder until Task 8
// moves Mode + Audience filters + Whitelist + Blacklist into this
// folder and wires them up here.
export default function SettingsTab() {
  return (
    <div className="rounded-xl border border-border bg-surface p-6 text-center text-sm text-text-secondary">
      Settings cards coming in the next migration step.
    </div>
  )
}
```

- [ ] **Step 3: Rewrite `src/pages/targeting/index.jsx`**

Read the current file: `cat src/pages/targeting/index.jsx`. Then OVERWRITE entirely with:

```jsx
import { useSearchParams } from 'react-router-dom'
import TargetsTab from './TargetsTab'
import SettingsTab from './SettingsTab'

// Targeting page hosts two tabs (Targets default, Settings) via a
// `?tab=settings` search param. No nested routes — the tabs are a
// mode toggle on a single page, not co-equal sub-views, so a
// search param fits better than React Router children.
const TABS = [
  { value: 'targets', label: 'Targets' },
  { value: 'settings', label: 'Settings' },
]

export default function TargetingPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeTab = searchParams.get('tab') === 'settings' ? 'settings' : 'targets'

  function setTab(value) {
    if (value === 'targets') {
      // Drop the param entirely so the URL stays clean for the default tab.
      const next = new URLSearchParams(searchParams)
      next.delete('tab')
      setSearchParams(next, { replace: false })
    } else {
      const next = new URLSearchParams(searchParams)
      next.set('tab', value)
      setSearchParams(next, { replace: false })
    }
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Targeting
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage who Kicksta targets and how.
        </p>
      </header>

      {/* Segmented tab strip — same recipe as the AddTargetSheet's
          account/hashtag toggle. Same on desktop and mobile. */}
      <div className="mt-4 flex rounded-full bg-bg p-1">
        {TABS.map((t) => {
          const selected = activeTab === t.value
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`inline-flex h-9 flex-1 items-center justify-center rounded-full px-4 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-surface text-text-primary shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <div className="mt-4">
        {activeTab === 'targets' ? <TargetsTab /> : <SettingsTab />}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Manual verification**

- `/targeting` renders Targets tab content (hero + filters + list). URL stays `/targeting`.
- Click "Settings" tab → URL becomes `/targeting?tab=settings`, content switches to placeholder. Refresh keeps you on Settings.
- Click "Targets" → URL drops the param, content switches back.
- Browser back/forward cycles tab state.

- [ ] **Step 5: Commit**

```bash
git add src/pages/targeting/
git commit -m "$(cat <<'EOF'
feat(targeting): add Targets/Settings tab strip with ?tab routing

TargetingPage hosts a segmented tab strip below the H1+subtitle.
Default tab is Targets (no URL param); Settings tab pushes
?tab=settings. Browser back/forward cycles cleanly. TargetsTab.jsx
extracts the existing operational view (hero + filter row + list +
modals); SettingsTab.jsx is a placeholder until the engine cards
move from growth/ in the next task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: Move engine cards from `growth/` to `targeting/`, wire up `SettingsTab`

**Files:**
- Move: `src/pages/growth/ModeCard.jsx` → `src/pages/targeting/ModeCard.jsx`
- Move: `src/pages/growth/AudienceFiltersCard.jsx` → `src/pages/targeting/AudienceFiltersCard.jsx`
- Move: `src/pages/growth/AudienceFiltersModal.jsx` → `src/pages/targeting/AudienceFiltersModal.jsx`
- Move: `src/pages/growth/AudienceReachEstimate.jsx` → `src/pages/targeting/AudienceReachEstimate.jsx`
- Move: `src/pages/growth/audienceReach.js` → `src/pages/targeting/audienceReach.js`
- Move: `src/pages/growth/WhitelistCard.jsx` → `src/pages/targeting/WhitelistCard.jsx`
- Move: `src/pages/growth/WhitelistModal.jsx` → `src/pages/targeting/WhitelistModal.jsx`
- Move: `src/pages/growth/BlacklistCard.jsx` → `src/pages/targeting/BlacklistCard.jsx`
- Move: `src/pages/growth/BlacklistModal.jsx` → `src/pages/targeting/BlacklistModal.jsx`
- Modify: `src/pages/targeting/SettingsTab.jsx`

- [ ] **Step 1: Move files via git**

```bash
git mv src/pages/growth/ModeCard.jsx src/pages/targeting/ModeCard.jsx
git mv src/pages/growth/AudienceFiltersCard.jsx src/pages/targeting/AudienceFiltersCard.jsx
git mv src/pages/growth/AudienceFiltersModal.jsx src/pages/targeting/AudienceFiltersModal.jsx
git mv src/pages/growth/AudienceReachEstimate.jsx src/pages/targeting/AudienceReachEstimate.jsx
git mv src/pages/growth/audienceReach.js src/pages/targeting/audienceReach.js
git mv src/pages/growth/WhitelistCard.jsx src/pages/targeting/WhitelistCard.jsx
git mv src/pages/growth/WhitelistModal.jsx src/pages/targeting/WhitelistModal.jsx
git mv src/pages/growth/BlacklistCard.jsx src/pages/targeting/BlacklistCard.jsx
git mv src/pages/growth/BlacklistModal.jsx src/pages/targeting/BlacklistModal.jsx
```

The `growth/` folder is now empty.

- [ ] **Step 2: Verify internal imports of moved files don't reach across folders**

```bash
grep -rn "from '@/pages/growth\|from '../growth" src/pages/targeting/ src/pages/engagement/
```

Expected: zero matches. (Internal relative imports like `./AudienceReachEstimate` still work because the consuming file moved alongside its dependency.)

- [ ] **Step 3: Rewrite `src/pages/targeting/SettingsTab.jsx`**

```jsx
import { useState } from 'react'
import ModeCard from './ModeCard'
import AudienceFiltersCard from './AudienceFiltersCard'
import AudienceFiltersModal from './AudienceFiltersModal'
import WhitelistCard from './WhitelistCard'
import WhitelistModal from './WhitelistModal'
import BlacklistCard from './BlacklistCard'
import BlacklistModal from './BlacklistModal'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Settings tab — engine configuration. Mode + Audience filters span
// full width; Whitelist/Blacklist sit side-by-side on lg: as a
// natural pair (allow vs. block, identical chip-list shape).
export default function SettingsTab() {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [whitelistOpen, setWhitelistOpen] = useState(false)
  const [blacklistOpen, setBlacklistOpen] = useState(false)
  const [upgradeFeature, setUpgradeFeature] = useState(null)

  const openUpgrade = (feature) => setUpgradeFeature(feature)
  const closeUpgrade = () => setUpgradeFeature(null)

  return (
    <div className="flex flex-col gap-4">
      <ModeCard />
      <AudienceFiltersCard onEdit={() => setFiltersOpen(true)} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <WhitelistCard onEdit={() => setWhitelistOpen(true)} />
        <BlacklistCard onEdit={() => setBlacklistOpen(true)} />
      </div>

      <AudienceFiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onRequestUpgrade={openUpgrade}
      />
      <WhitelistModal open={whitelistOpen} onClose={() => setWhitelistOpen(false)} />
      <BlacklistModal open={blacklistOpen} onClose={() => setBlacklistOpen(false)} />
      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'gender_filter'}
      />
    </div>
  )
}
```

- [ ] **Step 4: Sanity-grep — confirm growth/ folder is now empty (or only has tracking artifacts)**

```bash
ls src/pages/growth/ 2>&1
```

Expected: `ls: cannot access 'src/pages/growth/': No such file or directory` (the folder is removed by git when its last file moves out) OR an empty listing if the folder still exists locally without files. Either is fine — we explicitly delete in Task 9 if needed.

```bash
grep -rn "from '@/pages/growth" src/
```

Expected: zero matches.

- [ ] **Step 5: Manual verification**

- `/targeting` Targets tab still works.
- `/targeting?tab=settings` renders the four cards (Mode, Audience filters, Whitelist, Blacklist). All toggles, segmented controls, modals work.
- Editing Audience filters opens the modal. Editing Whitelist / Blacklist opens their modals.
- Locked-state for Audience filters' Gender filter (Growth users) opens the upgrade sheet.
- `/engagement` still works.

- [ ] **Step 6: Commit**

```bash
git add -A src/
git commit -m "$(cat <<'EOF'
feat(targeting): wire Settings tab — Mode + Audience filters + Lists

Moves nine files from growth/ to targeting/ via git mv (history
preserved): Mode, AudienceFilters card+modal, AudienceReachEstimate
+ helper, Whitelist card+modal, Blacklist card+modal.

SettingsTab renders Mode (full) + Audience filters (full) + 2-col
Whitelist|Blacklist on lg: (single-column on mobile). Modals mount
at the tab level. Upgrade bottom sheet shared across cards.

The growth/ folder is now empty; explicit removal lands in the
next cleanup task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: Delete empty `growth/` folder

**Files:**
- Delete: `src/pages/growth/` (whole directory if it still exists locally)

- [ ] **Step 1: Confirm folder is empty**

```bash
ls -la src/pages/growth/ 2>&1
```

Expected: empty directory or "No such file or directory" if git already removed it when the last file moved out.

- [ ] **Step 2: Remove if it still exists**

```bash
rmdir src/pages/growth/ 2>/dev/null || true
```

If `rmdir` fails because the directory contains hidden files (like an editor's temp), list and clean those:
```bash
ls -la src/pages/growth/
```

- [ ] **Step 3: Verify with grep one more time**

```bash
grep -rn "pages/growth" src/
```

Expected: zero matches.

- [ ] **Step 4: Commit (if anything actually changed; otherwise skip)**

If no file changes are pending (`git status` is clean), this task is a no-op. If `rmdir` removed an empty tracked directory:

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore(growth): drop empty growth/ folder after migration

All targeting-engine cards moved to targeting/ in the prior task;
Welcome DM + Close Friends moved to engagement/ before that. The
growth/ folder is now empty.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

If `git status` is clean, just move on — git already removed the empty folder when the last file moved out.

---

## Task 10: Documentation

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `CONTEXT.md`

- [ ] **Step 1: Add CHANGELOG entry**

Read `CHANGELOG.md`'s top entries to mirror format. Then prepend a new dated entry above the most recent one:

```markdown
## 2026-04-30 — Targeting / Engagement split

### Changed
- **`/growth` → `/engagement`** with 301 redirect. Engagement page is single-column with two cards (Welcome DM + Close Friends) plus the parked GrowthPlusBanner at the bottom.
- **`/targets` → `/targeting`** with 301 redirect. Targeting page now hosts a `Targets` (default) / `Settings` tab strip via `?tab=settings` search param.
- **EngagementCard split** into `WelcomeDmCard.jsx` + `CloseFriendsCard.jsx`. Like-after-follow row absorbed into `ModeCard.jsx` as a follow-time action.
- **`FiltersCard` + `FiltersModal`** renamed to **`AudienceFiltersCard` + `AudienceFiltersModal`** to disambiguate from the `FilterRow` Active/Archived bucket pills on the Targets tab.
- **Sidebar / mobile bottom tab / hamburger drawer** label updated: `Growth` → `Engagement`. `Targeting` label unchanged; route updated.

### Created
- `src/pages/targeting/TargetsTab.jsx` — extracted operational view (hero + filter row + list + modals).
- `src/pages/targeting/SettingsTab.jsx` — Mode + Audience filters + Whitelist + Blacklist.
- `src/pages/engagement/WelcomeDmCard.jsx`, `src/pages/engagement/CloseFriendsCard.jsx` — extracted from EngagementCard.

### Removed
- `src/pages/growth/` (whole folder).
- `src/pages/growth/EngagementCard.jsx` (split into the two cards above).
```

- [ ] **Step 2: Add CONTEXT.md entry**

Append to the update log:

```markdown
- **2026-04-30 (targeting/engagement split)** — `/growth` becomes `/engagement` (Welcome DM + Close Friends + parked GrowthPlusBanner). `/targets` becomes `/targeting` with two tabs: Targets (default) for the operational list, Settings for engine config (Mode + Audience filters + Whitelist + Blacklist). Tab state via `?tab=settings` search param. EngagementCard split into WelcomeDmCard + CloseFriendsCard; Like-after-follow folded into ModeCard. FiltersCard/Modal renamed AudienceFiltersCard/Modal to disambiguate from FilterRow's Active/Archived pills. Sidebar / drawer / bottom tab labels: Growth → Engagement. Old routes 301-redirect.
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md CONTEXT.md
git commit -m "$(cat <<'EOF'
docs: log targeting/engagement split in CHANGELOG and CONTEXT

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Self-review notes

**Spec coverage:**
- §Routes (search-param tabs + redirects) → Tasks 5, 6, 7
- §Targets tab content (unchanged) → Task 7 (TargetsTab extracted)
- §Settings tab layout (Mode hero + Audience filters full + 2-col Lists) → Task 8 (SettingsTab body)
- §Mode absorbs Like-after-follow → Task 2
- §Audience filters rename (file + heading) → Task 3
- §Engagement page (single-column, Welcome DM + Close Friends + GrowthPlusBanner) → Task 4
- §EngagementCard split → Task 2
- §Folder rename `targets/` → `targeting/` → Task 6
- §Folder rename `growth/` → `engagement/` (functionally; the Engagement-side files move first, then Targeting-side files move) → Tasks 4 and 8
- §Sidebar / drawer / bottom tab updates → Tasks 5 and 6
- §Docs → Task 10

**Type / property consistency:**
- `useGrowthConfig` field names (`config.likeAfterFollow`, `config.welcomeDm.*`, `config.closeFriendsAdder.*`, `config.filters.*`) are consistent across all consumers.
- Tab values `'targets'` / `'settings'` match between `TABS` array and `setTab()` logic.
- File rename pairs are consistent (`FiltersCard` → `AudienceFiltersCard`, `FiltersModal` → `AudienceFiltersModal`).

**No placeholders:** every step has full code or an exact command with expected output.
