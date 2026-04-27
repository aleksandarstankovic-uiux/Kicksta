# Growth Page v6 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the v6 design pass to the Growth page — unified tinted-chip chrome on every card, Mode hero opener, Engagement with embedded Welcome DM preview + Close Friends progress/ticker, redesigned Filters modal, fused Lists card with two halves, drop LiveActivityStrip.

**Architecture:** Pure presentation pass. Two new shared primitives — `CardChip` (chip header) and `InfoTooltip` (extracted from FiltersModal) — are used by every settings card. EngagementCard splits into focused sub-components for Welcome DM preview and Close Friends progress. FiltersModal swaps preset pills + custom-mode for native dropdowns + persistent Min/Max. Whitelist + Blacklist fuse into a single `ListsCard` with two halves; their modals are unchanged.

**Tech Stack:** React 19, Tailwind 4, Zustand 5, Lucide icons. No unit-test framework — verification is visual via Claude Preview MCP plus structural inspection of files.

**Spec:** `docs/superpowers/specs/2026-04-27-growth-page-v6-design.md`

**Verification convention:** Each task ends with a visual verification step at `http://localhost:5173/growth` (preview) and a commit. Hard reload between tasks: `window.location.href = '/growth?bust=' + Date.now()`.

---

### Task 1: Shared primitives — `CardChip` + `InfoTooltip`

**Files:**
- Create: `src/components/CardChip.jsx`
- Create: `src/components/InfoTooltip.jsx`

These are reused by Mode hero, Engagement, Filters, Whitelist half, Blacklist half. Build them first so every later task can `import` them.

- [ ] **Step 1: Create `src/components/CardChip.jsx`**

```jsx
// Tinted icon chip used as the visual identity for each settings card.
// Color carries meaning per CLAUDE.md tokens: bg-<color>-tint with the
// icon in text-<color>-base. Default size is 36px (h-9 w-9), icon 18px.
//
// Usage: <CardChip color="blue" icon={Settings2} />
export default function CardChip({ color = 'blue', icon: Icon, size = 'md' }) {
  const dim = size === 'lg' ? 'h-11 w-11' : 'h-9 w-9'
  const iconDim = size === 'lg' ? 'h-5 w-5' : 'h-[18px] w-[18px]'

  // Neutral chip variant — used for the Blacklist half (no -base tint).
  if (color === 'neutral') {
    return (
      <span
        aria-hidden="true"
        className={`flex ${dim} shrink-0 items-center justify-center rounded-lg bg-bg text-text-secondary`}
      >
        <Icon className={iconDim} />
      </span>
    )
  }

  return (
    <span
      aria-hidden="true"
      className={`flex ${dim} shrink-0 items-center justify-center rounded-lg bg-${color}-tint text-${color}-base`}
    >
      <Icon className={iconDim} />
    </span>
  )
}
```

Note on Tailwind dynamic classes: `bg-${color}-tint` is interpolated. Since the four colors used (`blue`, `green`, `yellow`, `purple`) are all already used elsewhere in the codebase as `bg-<color>-tint`, Tailwind's content scan picks them up. No safelist needed; existing usages on Overview and Growth already keep these classes alive.

- [ ] **Step 2: Create `src/components/InfoTooltip.jsx`**

Extracted verbatim from the current inline definition in `src/pages/growth/FiltersModal.jsx` (lines 37–49) but generalised so it shows on all breakpoints (drop `hidden lg:inline-block`):

```jsx
import { Info } from 'lucide-react'

// Hoverable / focusable info tooltip. Use beside titles to surface
// the explanatory copy that v6 dropped from card subtitles.
//
// Visible on all breakpoints (the FiltersModal copy hid it below lg —
// that constraint doesn't apply to the new card-header use case).
export default function InfoTooltip({ text }) {
  return (
    <span className="group relative inline-block">
      <button
        type="button"
        aria-label="More info"
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-text-muted hover:text-text-secondary focus:outline-none focus-visible:text-text-secondary"
      >
        <Info className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
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

The `<button>` wrapper makes the tooltip keyboard-accessible (focus reveals it via `group-focus-within`).

- [ ] **Step 3: Commit**

```bash
git add src/components/CardChip.jsx src/components/InfoTooltip.jsx
git commit -m "feat(components): add CardChip + InfoTooltip primitives"
```

---

### Task 2: Mock data for Close Friends progress + handles

**Files:**
- Modify: `src/mocks/growthConfig.js`

- [ ] **Step 1: Append two new exports**

Open `src/mocks/growthConfig.js` and add at the end of the file (after the existing `mockGrowthConfig` export):

```js
// Mock progress for the Close Friends Adder. Values are intentionally
// mid-flight so the progress bar shows movement.
export const mockCloseFriendsProgress = {
  added: 127,
  total: 482,
}

// Handles cycled through by the Close Friends ticker. Same list is
// reused for both "Adding" (mode === 'add') and "Removing" (mode === 'remove')
// states — copy is differentiated by the consumer.
export const mockCloseFriendsRecentHandles = [
  '@taylor.fit',
  '@noah.brews',
  '@maya.studio',
  '@kai.rides',
  '@lena.chefs',
]
```

- [ ] **Step 2: Commit**

```bash
git add src/mocks/growthConfig.js
git commit -m "feat(mocks): add Close Friends progress + recent handles"
```

---

### Task 3: Refactor `ModeCard` — chip + within-IG-limits pill

**Files:**
- Modify: `src/pages/growth/ModeCard.jsx`

The whole card is rewritten. Sub mode option cards keep their existing structure unchanged.

- [ ] **Step 1: Replace `src/pages/growth/ModeCard.jsx`**

```jsx
import { Check, Settings2, UserMinus, UserPlus, Zap } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'

const MODES = [
  {
    value: 'auto',
    label: 'Auto',
    icon: Zap,
    iconCls: 'bg-green-tint text-green-text',
    recommended: true,
    description:
      'Follow new users, like their posts, then unfollow after a period. The complete growth loop — recommended for most users.',
  },
  {
    value: 'follow_only',
    label: 'Follow-only',
    icon: UserPlus,
    iconCls: 'bg-blue-tint text-blue-text',
    recommended: false,
    description:
      'Follow new users from your targets. No unfollows. Use when you want to build a following list manually.',
  },
  {
    value: 'unfollow_only',
    label: 'Unfollow-only',
    icon: UserMinus,
    iconCls: 'bg-bg text-text-secondary',
    recommended: false,
    description:
      "Clean up users who didn't follow back. No new follows. Good for trimming a bloated following count.",
  },
]

export default function ModeCard() {
  const mode = useGrowthConfig((s) => s.config.mode)
  const setMode = useGrowthConfig((s) => s.setMode)

  return (
    <section className="mt-4 rounded-xl border border-border bg-surface p-4 lg:p-5">
      {/* Header row — chip + title + tooltip on the left, "within IG limits" pill on the right.
          Stacks on mobile so the pill drops to a new line below the chip+title. */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <CardChip color="blue" icon={Settings2} />
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">Mode</h2>
            <InfoTooltip text="How Kicksta grows your account. You can change this any time." />
          </div>
        </div>
        <span className="inline-flex items-center gap-1 self-start rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text lg:self-auto">
          <Check className="h-3 w-3" aria-hidden="true" />
          Within IG limits
        </span>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-3">
        {MODES.map((m) => {
          const selected = mode === m.value
          const Icon = m.icon
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`relative flex flex-col gap-2 rounded-xl border p-4 text-left transition-all lg:p-5 ${
                selected
                  ? 'border-blue-base bg-blue-tint/40 shadow-sm'
                  : 'border-border bg-surface hover:border-border-strong'
              }`}
            >
              {selected && (
                <Check
                  className="absolute right-3 top-3 h-4 w-4 text-blue-base"
                  aria-hidden="true"
                />
              )}

              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${m.iconCls}`}
              >
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-semibold text-text-primary">
                  {m.label}
                </span>
                {m.recommended && (
                  <span className="rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
                    Recommended
                  </span>
                )}
              </div>

              <p className="text-xs leading-relaxed text-text-secondary">
                {m.description}
              </p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
```

Key changes vs v5:
- Section is now a card itself (`rounded-xl border border-border bg-surface p-4 lg:p-5`).
- Title `<h2>` lost its `<p>` subtitle.
- Blue `CardChip` + `Settings2` icon replaces a plain title.
- "Within IG limits" green pill replaces the standalone Shield + safety line at the bottom of v5's card.

- [ ] **Step 2: Visual verify**

Reload `/growth`. Confirm:
- Mode card has a blue tinted chip on the left of the header.
- "Within IG limits" green pill is visible top-right on desktop, below the chip on mobile.
- Card subtitle is gone; tooltip on the Info icon shows "How Kicksta grows your account…" on hover/focus.
- 3 mode option cards still render.
- No standalone Shield+text line at the bottom.

- [ ] **Step 3: Commit**

```bash
git add src/pages/growth/ModeCard.jsx
git commit -m "refactor(growth): ModeCard adopts chip header + within-IG-limits pill"
```

---

### Task 4: Refactor `FiltersCard` — chip + tooltip, drop subtitle + per-row icons

**Files:**
- Modify: `src/pages/growth/FiltersCard.jsx`

- [ ] **Step 1: Replace the file body**

```jsx
import { Pencil, SlidersHorizontal } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import { formatCount } from '@/utils/formatCount'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'

function rangeFor(min, max, noun) {
  if ((min === 0 || min == null) && max == null) return 'Any'
  if (min === 0 || min == null) return `Up to ${formatCount(max)} ${noun}`
  if (max == null) return `${formatCount(min)}+ ${noun}`
  return `${formatCount(min)}–${formatCount(max)} ${noun}`
}

function privacyLabel(value) {
  if (value === 'public') return 'Public only'
  if (value === 'private') return 'Private only'
  return 'All'
}

function genderLabel(value) {
  if (value === 'male') return 'Male only'
  if (value === 'female') return 'Female only'
  return 'All'
}

function Row({ label, value, locked = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex min-w-0 items-center gap-2">
        <span className="text-sm text-text-secondary">{label}</span>
        {locked && (
          <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
            Advanced
          </span>
        )}
      </div>
      <span className="text-sm font-medium text-text-primary">{value}</span>
    </div>
  )
}

function GroupHeader({ children }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
      {children}
    </p>
  )
}

export default function FiltersCard({ onEdit }) {
  const filters = useGrowthConfig((s) => s.config.filters)
  const genderLocked = mockUser.plan !== 'advanced'

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <CardChip color="yellow" icon={SlidersHorizontal} />
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">Filters</h2>
            <InfoTooltip text="Who Kicksta targets." />
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-9 shrink-0 items-center justify-center gap-1.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary transition-colors hover:bg-bg"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          Edit
        </button>
      </div>

      <div className="mt-4">
        <GroupHeader>Audience size</GroupHeader>
        <div className="mt-1 flex flex-col divide-y divide-border">
          <Row
            label="Following count"
            value={rangeFor(filters.followingMin, filters.followingMax, 'following')}
          />
          <Row
            label="Follower count"
            value={rangeFor(filters.followerMin, filters.followerMax, 'followers')}
          />
          <Row
            label="Media count"
            value={rangeFor(filters.mediaMin, filters.mediaMax, 'posts')}
          />
        </div>
      </div>

      <div className="mt-4">
        <GroupHeader>Account type</GroupHeader>
        <div className="mt-1 flex flex-col divide-y divide-border">
          <Row label="Account privacy" value={privacyLabel(filters.accountPrivacy)} />
          <Row
            label="Gender target"
            value={genderLabel(filters.genderTarget)}
            locked={genderLocked}
          />
          <Row label="Exclude NSFW" value={filters.excludeNsfw ? 'On' : 'Off'} />
        </div>
      </div>
    </section>
  )
}
```

Key changes:
- Yellow `CardChip` + `SlidersHorizontal` next to the title.
- Tooltip ("Who Kicksta targets.") replaces the subtitle.
- Per-row icons removed (rows now plain label/value).
- Edit button position unchanged.

- [ ] **Step 2: Visual verify**

Reload `/growth`. Filters card shows the yellow chip on the left of "Filters", tooltip on hover, no subtitle, no per-row icons. Edit button still works.

- [ ] **Step 3: Commit**

```bash
git add src/pages/growth/FiltersCard.jsx
git commit -m "refactor(growth): FiltersCard adopts chip header, drops sub + row icons"
```

---

### Task 5: New `WelcomeDmPreview` subcomponent

**Files:**
- Create: `src/pages/growth/WelcomeDmPreview.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { Pencil } from 'lucide-react'

// Renders the chat-bubble message preview + filled "Edit message"
// button shown beneath the Welcome DM toggle row when it's enabled.
//
// The bubble visually clamps to 2 lines via line-clamp-2 so very long
// messages don't blow up the card height. Editing happens in
// WelcomeDmModal (unchanged from v5).
export default function WelcomeDmPreview({ message, onEdit }) {
  return (
    <div className="ml-7 mt-2 flex flex-col gap-2 pb-3">
      <div className="rounded-2xl rounded-tl-sm bg-blue-tint px-3 py-2 text-sm leading-relaxed text-text-primary">
        <p className="line-clamp-2">{message}</p>
      </div>
      <div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-base px-3 text-xs font-medium text-white transition-opacity hover:opacity-90"
        >
          <Pencil className="h-3 w-3" aria-hidden="true" />
          Edit message
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/growth/WelcomeDmPreview.jsx
git commit -m "feat(growth): add WelcomeDmPreview subcomponent"
```

---

### Task 6: New `CloseFriendsProgress` subcomponent

**Files:**
- Create: `src/pages/growth/CloseFriendsProgress.jsx`

- [ ] **Step 1: Create the file**

```jsx
import { useEffect, useState } from 'react'
import {
  mockCloseFriendsProgress,
  mockCloseFriendsRecentHandles,
} from '@/mocks/growthConfig'

// Progress bar + animated handle ticker for the Close Friends Adder.
// Values are mocked from src/mocks/growthConfig.js — real wiring is
// future work.
//
// `mode` is 'add' | 'remove'; the verb in the ticker line flips
// accordingly. The handle list is the same in both modes.
export default function CloseFriendsProgress({ mode }) {
  const { added, total } = mockCloseFriendsProgress
  const pct = Math.max(0, Math.min(100, Math.round((added / total) * 100)))

  const [handleIdx, setHandleIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => {
      setHandleIdx((i) => (i + 1) % mockCloseFriendsRecentHandles.length)
    }, 4000)
    return () => clearInterval(id)
  }, [])

  const verb = mode === 'remove' ? 'Removing' : 'Adding'
  const handle = mockCloseFriendsRecentHandles[handleIdx]

  return (
    <div className="mt-3">
      <div className="rounded-lg bg-bg p-3">
        <p className="text-xs font-medium text-text-primary">
          {added} of {total} followers added
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-green-base transition-[width] duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>
      <p className="mt-2 flex items-center gap-2 text-xs text-text-secondary animate-pulse">
        {verb} {handle}…
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/growth/CloseFriendsProgress.jsx
git commit -m "feat(growth): add CloseFriendsProgress subcomponent"
```

---

### Task 7: Refactor `EngagementCard` — chip + drop subtitle + wire previews

**Files:**
- Modify: `src/pages/growth/EngagementCard.jsx`

- [ ] **Step 1: Replace file body**

```jsx
import { useState } from 'react'
import { Heart, MessageSquare, Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import WelcomeDmModal from './WelcomeDmModal'
import WelcomeDmPreview from './WelcomeDmPreview'
import CloseFriendsProgress from './CloseFriendsProgress'

function isLocked(feature, user) {
  if (user.plan === 'advanced') return false
  return feature === 'welcome_dm' || feature === 'close_friends'
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

export default function EngagementCard({ onRequestUpgrade }) {
  const {
    config,
    toggleLikeAfterFollow,
    toggleWelcomeDm,
    toggleCloseFriends,
    setCloseFriendsMode,
  } = useGrowthConfig()

  const [dmModalOpen, setDmModalOpen] = useState(false)

  const welcomeLocked = isLocked('welcome_dm', mockUser)
  const closeFriendsLocked = isLocked('close_friends', mockUser)

  const showPreview = config.welcomeDm.enabled && !welcomeLocked
  const cfEnabled = config.closeFriendsAdder.enabled
  const cfMode = config.closeFriendsAdder.mode
  const showCfControls = cfEnabled && !closeFriendsLocked

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-center gap-3">
        <CardChip color="green" icon={Heart} />
        <div className="flex items-center gap-2">
          <h2 className="text-base font-semibold text-text-primary">Engagement</h2>
          <InfoTooltip text="How Kicksta interacts with new followers." />
        </div>
      </div>

      <div className="mt-2 flex flex-col divide-y divide-border">
        <SettingSwitch
          icon={Heart}
          title="Like after follow"
          description="Like a few of their recent posts after following — boosts the follow-back rate."
          checked={config.likeAfterFollow}
          onChange={() => toggleLikeAfterFollow()}
        />

        <div>
          <SettingSwitch
            icon={MessageSquare}
            title="Welcome DM"
            description="Auto-DM new followers once they follow back."
            checked={config.welcomeDm.enabled}
            onChange={() => toggleWelcomeDm()}
            locked={welcomeLocked}
            onLockedTap={() => onRequestUpgrade('welcome_dm')}
          />
          {showPreview && (
            <WelcomeDmPreview
              message={config.welcomeDm.message}
              onEdit={() => setDmModalOpen(true)}
            />
          )}
        </div>

        <div>
          <SettingSwitch
            icon={Star}
            title="Close Friends Adder"
            description="Automatically manage your Close Friends list."
            checked={cfEnabled}
            onChange={() => toggleCloseFriends()}
            locked={closeFriendsLocked}
            onLockedTap={() => onRequestUpgrade('close_friends')}
          />
          {showCfControls && (
            <div className="ml-7 pb-3">
              <div className="inline-flex rounded-full bg-bg p-1">
                {CF_MODES.map((m) => {
                  const selected = cfMode === m.value
                  return (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setCloseFriendsMode(m.value)}
                      className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors ${
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
              <CloseFriendsProgress mode={cfMode} />
            </div>
          )}
        </div>
      </div>

      <WelcomeDmModal open={dmModalOpen} onClose={() => setDmModalOpen(false)} />
    </section>
  )
}
```

Key differences from v5:
- Card header: green `CardChip` + `Heart` icon + tooltip; subtitle line removed.
- Welcome DM row: when on, renders `<WelcomeDmPreview>` instead of the small "Edit message" text link. Message text comes from the store (`config.welcomeDm.message`).
- Close Friends row: when on, renders the segmented Add/Remove pills + `<CloseFriendsProgress>` underneath.
- Per-row icons (Heart on row, MessageSquare, Star) stay — they're wayfinding inside the rows; the green card chip carries card-level identity.

- [ ] **Step 2: Visual verify Welcome DM preview**

Reload `/growth`. The Welcome DM row toggle defaults to off (per `mockGrowthConfig`). To exercise the preview:
1. In the page, toggle "Welcome DM" on.
2. Confirm a chat-bubble preview appears below the row (light blue tinted bubble with the existing default message), and a filled blue "Edit message" button is visible.
3. Click the button → `WelcomeDmModal` opens.

- [ ] **Step 3: Visual verify Close Friends progress**

1. Toggle "Close Friends Adder" on.
2. Confirm Add/Remove segmented pills render.
3. Confirm a progress bar shows "127 of 482 followers added" with a green-filled bar at ~26%.
4. Confirm a pulsing "Adding @<handle>…" line ticks through different handles every ~4s.
5. Switch to "Remove unfollowers" → ticker copy switches to "Removing @<handle>…".

- [ ] **Step 4: Commit**

```bash
git add src/pages/growth/EngagementCard.jsx
git commit -m "refactor(growth): EngagementCard adopts chip header + embedded previews"
```

---

### Task 8: Redesign `FiltersModal` — wider, 2-col, dropdowns + Custom

**Files:**
- Modify: `src/pages/growth/FiltersModal.jsx`
- Delete: `src/pages/growth/PresetRangePills.jsx`

- [ ] **Step 1: Replace `FiltersModal.jsx`**

```jsx
import { useEffect, useState } from 'react'
import { ChevronDown, User, Users, X } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import InfoTooltip from '@/components/InfoTooltip'
import SettingSwitch from '@/components/SettingSwitch'

const FOLLOWING_PRESETS = [
  { key: 'any', label: 'Any', min: 0, max: null },
  { key: 'low', label: 'Up to 500', min: 0, max: 500 },
  { key: 'mid', label: '500 – 5,000', min: 500, max: 5000 },
  { key: 'high', label: '5,000+', min: 5000, max: null },
]

const FOLLOWER_PRESETS = [
  { key: 'any', label: 'Any', min: 0, max: null },
  { key: 'low', label: 'Up to 1,000', min: 0, max: 1000 },
  { key: 'mid', label: '1,000 – 50,000', min: 1000, max: 50000 },
  { key: 'high', label: '50,000+', min: 50000, max: null },
]

const MEDIA_PRESETS = [
  { key: 'any', label: 'Any', min: 0, max: null },
  { key: 'low', label: 'Up to 10', min: 0, max: 10 },
  { key: 'mid', label: '10 – 100', min: 10, max: 100 },
  { key: 'high', label: '100+', min: 100, max: null },
]

const PRIVACY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

const GENDER_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

// Find the preset matching the current min/max, or return 'custom' if no match.
function presetKeyFor(presets, min, max) {
  const found = presets.find((p) => (p.min ?? 0) === (min ?? 0) && (p.max ?? null) === (max ?? null))
  return found ? found.key : 'custom'
}

function RangeDropdown({ label, tooltip, presets, min, max, onChange }) {
  const currentKey = presetKeyFor(presets, min, max)
  const isCustom = currentKey === 'custom'

  const handleSelect = (e) => {
    const key = e.target.value
    if (key === 'custom') {
      // Stay on the current min/max; just flip the dropdown to custom.
      onChange({ min: min ?? 0, max: max ?? null })
      // The dropdown will read 'custom' on next render because no preset matches.
      return
    }
    const preset = presets.find((p) => p.key === key)
    if (preset) {
      onChange({ min: preset.min, max: preset.max })
    }
  }

  return (
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <InfoTooltip text={tooltip} />
      </div>
      <div className="relative">
        <select
          value={currentKey}
          onChange={handleSelect}
          className="h-10 w-full appearance-none rounded-lg border border-border bg-surface px-3 pr-9 text-sm text-text-primary focus:border-blue-base focus:outline-none"
        >
          {presets.map((p) => (
            <option key={p.key} value={p.key}>
              {p.label}
            </option>
          ))}
          <option value="custom">Custom…</option>
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-secondary"
          aria-hidden="true"
        />
      </div>
      {isCustom && (
        <div className="mt-2 flex gap-2">
          <input
            type="number"
            value={min ?? ''}
            onChange={(e) => onChange({ min: e.target.value === '' ? null : Number(e.target.value), max })}
            placeholder="Min"
            className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-blue-base"
          />
          <input
            type="number"
            value={max ?? ''}
            onChange={(e) => onChange({ min, max: e.target.value === '' ? null : Number(e.target.value) })}
            placeholder="Max"
            className="h-10 flex-1 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary outline-none focus:border-blue-base"
          />
        </div>
      )}
    </div>
  )
}

function SegmentedField({ label, tooltip, value, options, onChange, locked = false, onLockedTap }) {
  return (
    <div
      className={locked ? 'cursor-pointer' : ''}
      onClick={locked ? onLockedTap : undefined}
    >
      <div className="mb-1.5 flex items-center gap-2">
        <label className="text-sm font-medium text-text-primary">{label}</label>
        <InfoTooltip text={tooltip} />
        {locked && (
          <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
            Advanced
          </span>
        )}
      </div>
      <div className={locked ? 'pointer-events-none opacity-60' : ''}>
        <div className="inline-flex w-full rounded-full bg-bg p-1">
          {options.map((o) => {
            const selected = value === o.value
            return (
              <button
                key={String(o.value)}
                type="button"
                onClick={() => onChange(o.value)}
                className={`inline-flex h-9 flex-1 items-center justify-center rounded-full px-4 text-sm font-medium transition-colors ${
                  selected
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                {o.label}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ColumnHeader({ icon: Icon, children }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-text-secondary" aria-hidden="true" />
      <span className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {children}
      </span>
    </div>
  )
}

export default function FiltersModal({ open, onClose, onRequestUpgrade }) {
  const [mounted, setMounted] = useState(false)

  const storedFilters = useGrowthConfig((s) => s.config.filters)
  const setFilter = useGrowthConfig((s) => s.setFilter)
  const toggleExcludeNsfw = useGrowthConfig((s) => s.toggleExcludeNsfw)

  const [draft, setDraft] = useState(storedFilters)

  const genderLocked = mockUser.plan !== 'advanced'

  useEffect(() => {
    if (!open) return
    setDraft(storedFilters)
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, storedFilters])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const handleSave = () => {
    setFilter('followingRange', { min: draft.followingMin, max: draft.followingMax })
    setFilter('followerRange', { min: draft.followerMin, max: draft.followerMax })
    setFilter('mediaRange', { min: draft.mediaMin, max: draft.mediaMax })
    setFilter('accountPrivacy', draft.accountPrivacy)
    setFilter('genderTarget', draft.genderTarget)
    if (draft.excludeNsfw !== storedFilters.excludeNsfw) {
      toggleExcludeNsfw()
    }
    onClose()
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit filters"
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 transition-opacity duration-200 lg:items-center ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-h-[85vh] flex-col overflow-hidden rounded-t-xl bg-surface shadow-xl transition-all duration-200 ease-out lg:max-w-2xl lg:rounded-xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">Edit filters</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 lg:px-6 lg:py-6">
          <div className="lg:grid lg:grid-cols-2 lg:gap-8">
            {/* Left column — Audience size */}
            <div>
              <ColumnHeader icon={Users}>Audience size</ColumnHeader>
              <div className="flex flex-col gap-5">
                <RangeDropdown
                  label="Following count"
                  tooltip="People this account follows."
                  presets={FOLLOWING_PRESETS}
                  min={draft.followingMin}
                  max={draft.followingMax}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, followingMin: v.min, followingMax: v.max }))
                  }
                />
                <RangeDropdown
                  label="Follower count"
                  tooltip="How many followers they have."
                  presets={FOLLOWER_PRESETS}
                  min={draft.followerMin}
                  max={draft.followerMax}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, followerMin: v.min, followerMax: v.max }))
                  }
                />
                <RangeDropdown
                  label="Media count"
                  tooltip="How many posts they've published."
                  presets={MEDIA_PRESETS}
                  min={draft.mediaMin}
                  max={draft.mediaMax}
                  onChange={(v) =>
                    setDraft((d) => ({ ...d, mediaMin: v.min, mediaMax: v.max }))
                  }
                />
              </div>
            </div>

            {/* Right column — Account type */}
            <div className="mt-6 lg:mt-0">
              <ColumnHeader icon={User}>Account type</ColumnHeader>
              <div className="flex flex-col gap-5">
                <SegmentedField
                  label="Account privacy"
                  tooltip="Whether their profile is public or private."
                  value={draft.accountPrivacy}
                  options={PRIVACY_OPTIONS}
                  onChange={(v) => setDraft((d) => ({ ...d, accountPrivacy: v }))}
                />
                <SegmentedField
                  label="Gender target"
                  tooltip="Narrow targeting by account gender."
                  value={draft.genderTarget}
                  options={GENDER_OPTIONS}
                  onChange={(v) => setDraft((d) => ({ ...d, genderTarget: v }))}
                  locked={genderLocked}
                  onLockedTap={() => onRequestUpgrade('gender_filter')}
                />
                <SettingSwitch
                  title="Exclude NSFW"
                  description="Skip accounts that appear to contain adult content."
                  checked={draft.excludeNsfw}
                  onChange={() => setDraft((d) => ({ ...d, excludeNsfw: !d.excludeNsfw }))}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border px-5 py-3 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-5 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
```

Key changes:
- Modal is `max-w-2xl` (was `max-w-md`) and 2-column on `lg:` (was 1-column).
- Range filters use a native `<select>` styled to look like a dropdown, with presets including "Any" + "Custom…". Selecting "Custom…" reveals two number inputs. Inputs persist while custom is selected — nothing jumps mid-edit.
- Privacy + Gender use bigger `h-9` segmented pills inside an `inline-flex w-full` container that fills the column.
- Exclude NSFW is a `SettingSwitch` row instead of an inline pill.
- `PresetRangePills` no longer imported.

- [ ] **Step 2: Delete `PresetRangePills.jsx`**

```bash
rm "src/pages/growth/PresetRangePills.jsx"
```

- [ ] **Step 3: Visual verify**

Reload `/growth`, click Edit on the Filters card. Confirm:
- Modal is wider on desktop (`max-w-2xl`).
- Two columns visible: Audience size (left, Users icon) + Account type (right, User icon).
- Range fields are dropdowns with presets + "Custom…".
- Picking "Custom…" reveals Min/Max inputs *below* the dropdown — dropdown stays in place.
- Privacy and Gender are now wide segmented pill controls (full width within their column).
- Exclude NSFW is a switch row at the bottom of the right column.
- Mobile: 2-col collapses to 1-col stacked (Audience size, then Account type).
- Cancel + Save still work; values persist through the dropdown changes; debounced toast still fires once on Save.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "refactor(growth): redesign FiltersModal — wider, 2-col, dropdowns + Custom"
```

---

### Task 9: Fused `ListsCard` + halves; delete v5 list cards

**Files:**
- Create: `src/pages/growth/ListsCard.jsx`
- Create: `src/pages/growth/WhitelistHalf.jsx`
- Create: `src/pages/growth/BlacklistHalf.jsx`
- Delete: `src/pages/growth/WhitelistCard.jsx`
- Delete: `src/pages/growth/BlacklistCard.jsx`

`WhitelistModal.jsx` and `BlacklistModal.jsx` stay unchanged.

- [ ] **Step 1: Create `WhitelistHalf.jsx`**

```jsx
import { Pencil, ShieldCheck } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'

export default function WhitelistHalf({ onEdit }) {
  const whitelist = useLists((s) => s.whitelist)

  return (
    <div className="p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CardChip color="green" icon={ShieldCheck} />
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-text-primary">Whitelist</h3>
            <InfoTooltip text="Accounts Kicksta will never unfollow." />
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit whitelist"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {whitelist.length} {whitelist.length === 1 ? 'account' : 'accounts'} protected
      </p>
      {whitelist.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">No accounts protected yet.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {whitelist.map((e) => (
            <li key={e.id} className="text-sm text-text-primary">
              {e.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

The Edit button is now a 36px square ghost icon (vs the labelled "Edit" of v5) — saves horizontal space inside the half so the chip + title can breathe.

- [ ] **Step 2: Create `BlacklistHalf.jsx`**

```jsx
import { Ban, Pencil } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'

export default function BlacklistHalf({ onEdit }) {
  const blacklist = useLists((s) => s.blacklist)

  return (
    <div className="p-4 lg:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <CardChip color="neutral" icon={Ban} />
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-text-primary">Blacklist</h3>
            <InfoTooltip text="Accounts Kicksta will never follow." />
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          aria-label="Edit blacklist"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-text-secondary transition-colors hover:bg-bg hover:text-text-primary"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>

      <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {blacklist.length} {blacklist.length === 1 ? 'account' : 'accounts'} blocked
      </p>
      {blacklist.length === 0 ? (
        <p className="mt-2 text-sm text-text-muted">No accounts blocked yet.</p>
      ) : (
        <ul className="mt-2 flex flex-col gap-1.5">
          {blacklist.map((e) => (
            <li key={e.id} className="text-sm text-text-primary">
              {e.username}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 3: Create `ListsCard.jsx`**

```jsx
import { useState } from 'react'
import WhitelistHalf from './WhitelistHalf'
import BlacklistHalf from './BlacklistHalf'
import WhitelistModal from './WhitelistModal'
import BlacklistModal from './BlacklistModal'

// Single fused Lists card containing the Whitelist + Blacklist halves.
// On desktop the halves sit side by side, separated by a vertical divider.
// On mobile they stack with a horizontal divider between them.
//
// Each half opens its own dedicated edit modal; modal state is owned
// here so the card is fully self-contained.
export default function ListsCard() {
  const [whitelistOpen, setWhitelistOpen] = useState(false)
  const [blacklistOpen, setBlacklistOpen] = useState(false)

  return (
    <>
      <section className="rounded-xl border border-border bg-surface lg:flex lg:divide-x lg:divide-border">
        <div className="border-b border-border lg:flex-1 lg:border-b-0">
          <WhitelistHalf onEdit={() => setWhitelistOpen(true)} />
        </div>
        <div className="lg:flex-1">
          <BlacklistHalf onEdit={() => setBlacklistOpen(true)} />
        </div>
      </section>

      <WhitelistModal open={whitelistOpen} onClose={() => setWhitelistOpen(false)} />
      <BlacklistModal open={blacklistOpen} onClose={() => setBlacklistOpen(false)} />
    </>
  )
}
```

- [ ] **Step 4: Delete the old per-card files**

```bash
rm "src/pages/growth/WhitelistCard.jsx"
rm "src/pages/growth/BlacklistCard.jsx"
```

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat(growth): fuse Whitelist + Blacklist into single ListsCard with halves"
```

---

### Task 10: Wire layout in `index.jsx` + delete LiveActivityStrip

**Files:**
- Modify: `src/pages/growth/index.jsx`
- Delete: `src/pages/growth/LiveActivityStrip.jsx`

- [ ] **Step 1: Replace `index.jsx` body**

```jsx
import { useState } from 'react'
import { mockUser } from '@/mocks/user'
import ModeCard from './ModeCard'
import EngagementCard from './EngagementCard'
import FiltersCard from './FiltersCard'
import FiltersModal from './FiltersModal'
import ListsCard from './ListsCard'
import GrowthPlusBanner from '@/components/GrowthPlusBanner'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Growth page v6 layout:
// - H1 only (no subtitle).
// - Mode hero card opens the page (chip + tooltip + within-IG-limits pill).
// - 2-column grid: Engagement + Filters stacked left, fused Lists card right.
// - Shared GrowthPlusBanner closes the page (same component as Overview).
// - LiveActivityStrip removed — settings page, no live status.
export default function GrowthPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)

  const openUpgrade = (feature) => setUpgradeFeature(feature)
  const closeUpgrade = () => setUpgradeFeature(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Growth
        </h1>
      </header>

      <ModeCard />

      {/* Two columns on desktop:
          Left column = Engagement → Filters (settings the user toggles)
          Right column = ListsCard (fused Whitelist + Blacklist halves). */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <EngagementCard onRequestUpgrade={openUpgrade} />
          <FiltersCard onEdit={() => setFiltersOpen(true)} />
        </div>
        <ListsCard />
      </div>

      <div className="mt-4">
        <GrowthPlusBanner isSubscribed={mockUser.growthPlusSubscribed} />
      </div>

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onRequestUpgrade={openUpgrade}
      />
      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'welcome_dm'}
      />
    </div>
  )
}
```

Key differences from v5:
- H1 has no `<p>` subtitle.
- `<ModeCard />` is the hero (and now a card section itself).
- Right column collapsed from a `flex-col gap-4` (Whitelist + Blacklist) to a single `<ListsCard />`.
- `LiveActivityStrip` import + render gone.
- `WhitelistCard` / `BlacklistCard` / `WhitelistModal` / `BlacklistModal` no longer imported here — `ListsCard` owns those modals internally.

- [ ] **Step 2: Delete `LiveActivityStrip.jsx`**

```bash
rm "src/pages/growth/LiveActivityStrip.jsx"
```

- [ ] **Step 3: Visual verify desktop layout**

Reload `/growth` at desktop (1280×900). Confirm:
- Page opens with H1 "Growth" alone (no subtitle line).
- Mode hero card directly below H1 with blue chip on left, "Within IG limits" pill on right.
- Below: two columns. Left = Engagement card on top, Filters card below. Right = single Lists card with Whitelist (green chip) on the left half, Blacklist (neutral chip) on the right half, vertical divider between them.
- Below the grid: shared Growth+ banner (purple gradient).
- No LiveActivityStrip anywhere.

- [ ] **Step 4: Visual verify mobile layout**

Resize preview to 375×812. Confirm cards stack: H1 → Mode → Engagement → Filters → ListsCard (Whitelist on top, Blacklist below, horizontal divider between) → Growth+ banner.

- [ ] **Step 5: Visual verify edit flows**

1. Click Edit on the Filters card → wider 2-col modal opens.
2. Click the Pencil icon on the Whitelist half → `WhitelistModal` opens.
3. Click the Pencil icon on the Blacklist half → `BlacklistModal` opens.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(growth): wire v6 page layout (Mode hero + 2col + fused Lists, drop LiveActivityStrip)"
```

---

### Task 11: CHANGELOG + CONTEXT updates

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `CONTEXT.md`

- [ ] **Step 1: Prepend a CHANGELOG entry**

In `CHANGELOG.md`, immediately after the top "## 2026-04-27 — Growth page v5" section heading and its body (find the next `---` divider), insert a new entry above the v5 entry:

```markdown
## 2026-04-27 — Growth page v6 (chrome unification + content depth)

### Changed
- **Chrome system** — every settings card now leads with a tinted icon chip (Mode = blue Settings2, Engagement = green Heart, Filters = yellow SlidersHorizontal, Whitelist = green ShieldCheck, Blacklist = neutral Ban). Card subtitles removed everywhere; an `InfoTooltip` next to each title carries the explanation.
- **Page opener** — H1 subtitle removed. `ModeCard` is now a full card with chip + tooltip + a green "Within IG limits ✓" pill on the right (replaces the standalone Shield+text safety footer).
- **Engagement card** — Welcome DM row, when on, shows a chat-bubble preview of the message + a filled blue "Edit message" button. Close Friends Adder, when on, shows a green progress bar (`127/482 = 26%`) and a pulsing "Adding @handle…" ticker that cycles through 5 mock handles every ~4s. Verb flips to "Removing" in remove mode.
- **Filters modal** redesigned — wider (`max-w-2xl`), two-column on desktop (Audience size · Account type). Range filters now use a native `<select>` dropdown with presets + "Custom…" option (custom reveals persistent Min/Max inputs — nothing jumps mid-edit). Privacy + Gender are bigger segmented pills. Exclude NSFW is a `SettingSwitch` row.
- **Lists card** — Whitelist + Blacklist fused into a single `ListsCard` with two halves (vertical divider on desktop, horizontal on mobile). Edit button per half is now a square Pencil icon button. Card height is balanced internally; right column = one card matching Engagement+Filters height.
- **Filters card** drops the per-row icons; card-level chip carries identity now.

### Created
- `src/components/CardChip.jsx` — shared tinted chip primitive (`color="blue|green|yellow|neutral"`, `icon`, `size="md|lg"`).
- `src/components/InfoTooltip.jsx` — extracted from FiltersModal; visible on all breakpoints.
- `src/pages/growth/WelcomeDmPreview.jsx`
- `src/pages/growth/CloseFriendsProgress.jsx`
- `src/pages/growth/ListsCard.jsx`, `WhitelistHalf.jsx`, `BlacklistHalf.jsx`
- Mock data: `mockCloseFriendsProgress`, `mockCloseFriendsRecentHandles` in `src/mocks/growthConfig.js`.

### Removed
- `src/pages/growth/LiveActivityStrip.jsx` (settings page, no live status).
- `src/pages/growth/PresetRangePills.jsx` (logic absorbed into the dropdown).
- `src/pages/growth/WhitelistCard.jsx` and `BlacklistCard.jsx` (replaced by halves inside the fused card).
- All card subtitles on the Growth page.
- Standalone Shield + safety line at the bottom of `ModeCard`.

### Decisions
- **Tinted chip pattern is the through-line for "feels like the rest of the dash."** Same chip recipe Overview uses (Sparkles chip in GrowthPlusBanner, avatar ring on AccountCard) — applied consistently to every Growth card.
- **Blacklist chip is neutral (`bg-bg`), not red.** CLAUDE.md reserves red for connection errors; blacklist is a configuration state, not an error state.
- **No metric tiles, no charts, no live status on Growth.** Only live energy is the Close Friends ticker, which is a *consequence of the user's settings* rather than dashboard analytics.
```

- [ ] **Step 2: Update the Growth section in `CONTEXT.md`**

Find the `### Growth (`/growth`, `src/pages/growth/`) — v5` section. Replace it with:

```markdown
### Growth (`/growth`, `src/pages/growth/`) — v6

Settings dashboard with unified chrome. Every card leads with a tinted `CardChip` (blue/green/yellow/neutral) + title + `InfoTooltip` — no card subtitles. Direct controls for Mode + Engagement (auto-save 1.5s debounced toast); read-only display + Edit modal for Filters; fused Lists card with Whitelist + Blacklist halves.

**Layout (desktop):**
```
H1 "Growth"
ModeCard (full width, chip + within-IG-limits pill + 3 mode options)
┌── Engagement (left, green chip) ──┬── ListsCard (right) ────────────────┐
│   Welcome DM preview when on      │  Whitelist (green) | Blacklist (neutral)
│   Close Friends progress + ticker │  vertical divider on lg:
│ Filters (left, yellow chip) ──────│  stacked + horizontal divider on mobile
└───────────────────────────────────┴──────────────────────────────────────┘
GrowthPlusBanner (shared, purple, unchanged)
```

Mobile stacks: Mode → Engagement → Filters → ListsCard (whitelist on top, blacklist below) → Growth+ banner.

**File layout:**
```
src/pages/growth/
  index.jsx               page shell + filter modal state
  ModeCard.jsx            blue chip + within-IG-limits pill + 3 mode option cards
  EngagementCard.jsx      green chip + 3 toggles + WelcomeDmPreview + CloseFriendsProgress
  WelcomeDmPreview.jsx    chat-bubble preview + filled "Edit message" button
  CloseFriendsProgress.jsx green progress bar + pulsing handle ticker (4s cycle)
  WelcomeDmModal.jsx      unchanged
  FiltersCard.jsx         yellow chip + grouped read-only rows + Edit
  FiltersModal.jsx        wider 2-col modal: dropdown ranges + Custom · big segmented pills · NSFW switch
  ListsCard.jsx           fused container; renders both halves + owns both modals
  WhitelistHalf.jsx       green chip + count + entries + Pencil edit
  BlacklistHalf.jsx       neutral chip + count + entries + Pencil edit
  WhitelistModal.jsx      unchanged
  BlacklistModal.jsx      unchanged
src/components/CardChip.jsx  shared chip primitive (color/icon/size)
src/components/InfoTooltip.jsx  shared hover/focus tooltip (extracted from FiltersModal)
src/components/GrowthPlusBanner.jsx  shared with Overview
src/components/SettingSwitch.jsx  shared switch (locked + Advanced support)
src/components/UpgradeBottomSheet.jsx  shared upgrade modal
src/stores/useGrowthConfig.js   config + setters + announceSaved() debounced toast
src/stores/useLists.js   replaceWhitelist + replaceBlacklist (single-list bulk)
src/mocks/growthConfig.js  + mockCloseFriendsProgress + mockCloseFriendsRecentHandles
```

**Mode card:** Blue chip + Settings2 icon + tooltip. 3 selection cards (Auto / Follow-only / Unfollow-only) below the header. "Within IG limits ✓" green pill in top-right of the header replaces the v5 standalone safety footer.

**Engagement card:** Green chip + Heart icon + tooltip. Three rows:
- Like after follow — toggle only.
- Welcome DM — toggle. When on (and unlocked), shows a `WelcomeDmPreview` (light blue chat-bubble with `line-clamp-2` of the stored message + filled blue "Edit message" → opens `WelcomeDmModal`).
- Close Friends Adder — toggle. When on (and unlocked), shows segmented Add/Remove pills + `CloseFriendsProgress` (`127/482 = 26%` bar + pulsing "Adding @handle…" line cycling 5 mock handles every 4s; verb flips to "Removing" in remove mode).

**Filters card:** Yellow chip + SlidersHorizontal icon + tooltip. Grouped rows under `AUDIENCE SIZE` and `ACCOUNT TYPE` sub-headers. Edit button → `FiltersModal`.

**Filters modal:** Wider (`max-w-2xl`), 2-col on desktop. Range fields are native `<select>` dropdowns with presets + "Custom…" (custom reveals persistent Min/Max). Privacy + Gender are wider segmented pills. Exclude NSFW is a `SettingSwitch`.

**Lists card:** Single fused card. Halves separated by `lg:divide-x` on desktop, `border-b` on mobile. Each half: chip + title + tooltip + Pencil icon button. Whitelist chip = green ShieldCheck. Blacklist chip = neutral Ban (no red — CLAUDE.md reserves red for errors).

**Plan gating:** Same as v5 — Welcome DM / Close Friends / Gender filter Advanced-only.

**Spec/plan:** v6 → `docs/superpowers/specs/2026-04-27-growth-page-v6-design.md` + `plans/2026-04-27-growth-page-v6.md`.
```

Then add to the Update log at the bottom:

```markdown
- **2026-04-27 (growth v6)** — Chrome + content depth pass: tinted `CardChip` per card (blue/green/yellow/neutral) replacing flat headers; subtitles dropped, `InfoTooltip` everywhere; ModeCard becomes the hero with within-IG-limits pill (no standalone safety line); EngagementCard embeds `WelcomeDmPreview` chat bubble + `CloseFriendsProgress` bar/ticker when their toggles are on; FiltersModal redesigned (max-w-2xl, 2-col, dropdowns + Custom, bigger pills, NSFW as switch); Whitelist + Blacklist fused into `ListsCard` with two halves; LiveActivityStrip + PresetRangePills + WhitelistCard + BlacklistCard deleted.
```

- [ ] **Step 3: Commit**

```bash
git add CHANGELOG.md CONTEXT.md
git commit -m "docs: log Growth v6 changes in CHANGELOG and CONTEXT"
```

---

## Self-review notes

**Spec coverage:**
- §1 chrome system → Tasks 1, 3, 4, 7, 9 (chip applied per card)
- §2 page opener → Task 3 (ModeCard rewrite) + Task 10 (drop H1 subtitle)
- §3 Engagement depth → Tasks 5, 6, 7
- §4 Filters card + modal → Tasks 4, 8
- §5 fused Lists → Task 9
- §6 LiveActivityStrip removal → Task 10
- Acceptance criteria 1–10 all map to tasks listed above.

**Type / name consistency:**
- `CardChip` accepts `color="blue|green|yellow|purple|neutral"`, `icon` (component), `size="md|lg"`. Used consistently across tasks 3, 4, 7, 9.
- `InfoTooltip` accepts `text` (string). Used consistently.
- `WhitelistHalf` / `BlacklistHalf` take `onEdit` prop only. `ListsCard` owns the modal state and passes the open setters.
- `WelcomeDmPreview` props: `message`, `onEdit`. `CloseFriendsProgress` props: `mode` ('add' | 'remove').
- Mock exports: `mockCloseFriendsProgress`, `mockCloseFriendsRecentHandles` — referenced consistently in `CloseFriendsProgress.jsx`.

**No-placeholder check:** Every code-bearing step contains the full file body or a precise replacement. No "TBD", no "similar to Task N" — Whitelist and Blacklist halves are written out separately on purpose.

**One nuance flagged for visual review:** The native `<select>` element used for range dropdowns in FiltersModal will use the OS popover when opened. This is intentional (accessibility, no custom popover code), but the OS popover styling differs across macOS/Windows/iOS. The styled closed state matches the design tokens; only the open list is OS-native. Document during visual review if a custom popover becomes necessary later.
