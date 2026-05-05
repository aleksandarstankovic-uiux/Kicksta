# Targeting Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the Targeting page — underlined tab-bar (page tabs + Add target's account/hashtag toggle), 2-col audience filters at `lg:`, like-after-follow disables when mode is `unfollow_only`, the processing row's pill reads `Following…`, BlacklistModal returns to gray, modal headers move helper text into a subtitle.

**Architecture:** Pure UI polish. One new prop on `SettingSwitch` (`disabled`), no new components, no new mocks, no new state. Seven files modified.

**Tech Stack:** React 19, Tailwind 4, Lucide React, Zustand 5. **No unit-test framework** — verification is `eslint` + manual visual inspection.

---

### Reference spec

`docs/superpowers/specs/2026-05-05-targeting-refresh-design.md`

### File map

| File | Status | Responsibility |
|---|---|---|
| `src/pages/targeting/index.jsx` | MODIFY | Underlined tab-bar; per-tab subtitle map |
| `src/pages/targeting/AddTargetSheet.jsx` | MODIFY | Account/Hashtag tab-bar; header subtitle; delete body helper line |
| `src/pages/targeting/WhitelistModal.jsx` | MODIFY | Header subtitle; delete body helper line |
| `src/pages/targeting/BlacklistModal.jsx` | MODIFY | Chip → neutral; empty-state circle → gray; header subtitle; delete body helper line |
| `src/pages/targeting/AudienceFiltersCard.jsx` | MODIFY | 2-col internal split with vertical divider |
| `src/pages/targeting/ModeCard.jsx` | MODIFY | Pass `disabled` to like-after-follow when mode is `unfollow_only`; swap description copy |
| `src/components/SettingSwitch.jsx` | MODIFY | New `disabled` prop |
| `src/pages/targeting/TargetRow.jsx` | MODIFY | Pill text → `Following…` when `isProcessing`; mobile dot `aria-label` swap |

### Verification command

After every task:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src --ext .js,.jsx
```

If `node` is unavailable, the engineer reviews the diff visually and notes the skip.

---

## Task 1: Targeting page underlined tab-bar + per-tab subtitles

**Files:**
- Modify: `src/pages/targeting/index.jsx`

- [ ] **Step 1: Replace the file body**

Replace the entire content of `src/pages/targeting/index.jsx` with:

```jsx
import { useSearchParams } from 'react-router-dom'
import { Crosshair, SlidersHorizontal } from 'lucide-react'
import TargetsTab from './TargetsTab'
import SettingsTab from './SettingsTab'

// Targeting page hosts two tabs (Targets default, Settings) via a
// `?tab=settings` search param. The tab strip is the page's primary
// mode toggle — rendered as an underlined tab-bar so it reads as a
// view switcher, not a faded segmented pill. Same recipe is reused
// inside AddTargetSheet for the account/hashtag toggle.
const TABS = [
  { value: 'targets', label: 'Targets', icon: Crosshair },
  { value: 'settings', label: 'Settings', icon: SlidersHorizontal },
]

const SUBTITLE = {
  targets: 'The accounts and hashtags Kicksta is following from.',
  settings: 'How Kicksta picks who to follow.',
}

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
          {SUBTITLE[activeTab]}
        </p>
      </header>

      {/* Underlined tab-bar — same recipe reused inside AddTargetSheet. */}
      <div className="mt-4 flex border-b border-border">
        {TABS.map((t) => {
          const selected = activeTab === t.value
          const Icon = t.icon
          return (
            <button
              key={t.value}
              type="button"
              onClick={() => setTab(t.value)}
              className={`-mb-px inline-flex h-11 flex-1 items-center justify-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors ${
                selected
                  ? 'border-blue-base text-text-primary'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
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

- [ ] **Step 2: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/index.jsx
```
Expected: 0 errors.

- [ ] **Step 3: Manual smoke**

Open `/targeting`. Confirm:
- Tab strip shows `🎯 Targets` and `⚙️ Settings` with the active one underlined in blue.
- Subtitle reads "The accounts and hashtags Kicksta is following from." on Targets.
- Click Settings — subtitle swaps to "How Kicksta picks who to follow." and the underline moves.

- [ ] **Step 4: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/index.jsx && git commit -m "feat(targeting): underlined tab-bar + per-tab subtitles

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: AddTargetSheet account/hashtag tab-bar

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx`

- [ ] **Step 1: Update the lucide import line**

In `src/pages/targeting/AddTargetSheet.jsx`, find the lucide import (currently includes `Crosshair, Hash, X`). Add `AtSign`:

```js
import { AtSign, Crosshair, Hash, X } from 'lucide-react'
```

- [ ] **Step 2: Replace the segmented-control toggle**

Find the existing toggle block (currently lines 199-223 — the `<div className="mt-4 flex rounded-full bg-bg p-1">…</div>` block).

Replace with the underlined tab-bar:

```jsx
{/* Account/Hashtag tab-bar — same underlined recipe as the page-level
    tabs. Switching type clears any in-flight input/match state so the
    user starts fresh in the new mode. */}
<div className="mt-4 flex border-b border-border">
  {[
    { value: 'account', label: 'Account', icon: AtSign },
    { value: 'hashtag', label: 'Hashtag', icon: Hash },
  ].map((t) => {
    const selected = type === t.value
    const Icon = t.icon
    return (
      <button
        key={t.value}
        type="button"
        onClick={() => {
          setType(t.value)
          setInput('')
          setMatches([])
          setPickedMatch(null)
        }}
        className={`-mb-px inline-flex h-11 flex-1 items-center justify-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors ${
          selected
            ? 'border-blue-base text-text-primary'
            : 'border-transparent text-text-secondary hover:text-text-primary'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
        {t.label}
      </button>
    )
  })}
</div>
```

- [ ] **Step 3: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/AddTargetSheet.jsx
```
Expected: 0 errors.

- [ ] **Step 4: Manual smoke**

Open AddTargetSheet from the Targets tab. Confirm the toggle now reads as an underlined tab-bar with `@ Account` and `# Hashtag`. Switching tabs clears the input and updates the form.

- [ ] **Step 5: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/AddTargetSheet.jsx && git commit -m "feat(targeting): underlined Account/Hashtag tab-bar in AddTargetSheet

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: AudienceFiltersCard 2-col split at `lg:`

**Files:**
- Modify: `src/pages/targeting/AudienceFiltersCard.jsx`

- [ ] **Step 1: Wrap the two GroupHeader sections in a 2-col grid**

In `src/pages/targeting/AudienceFiltersCard.jsx`, find these two existing blocks (currently lines 79-108):

```jsx
<div className="mt-4">
  <GroupHeader icon={Users}>Audience size</GroupHeader>
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

<div className="mt-4 border-b border-border">
  <GroupHeader icon={User}>Account type</GroupHeader>
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
```

Replace with this 2-col grid wrapper:

```jsx
<div className="mt-4 grid gap-4 border-b border-border pb-4 lg:grid-cols-2 lg:gap-6 lg:divide-x lg:divide-border lg:pb-0">
  <div className="lg:pr-6">
    <GroupHeader icon={Users}>Audience size</GroupHeader>
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
  <div>
    <GroupHeader icon={User}>Account type</GroupHeader>
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
</div>
```

The wrapper carries the `border-b border-border` previously on the second block (so the hairline above the AudienceReachEstimate stays). At `lg:` we drop that bottom border (`lg:pb-0` removes the trailing pad and the divide-x renders the column boundary instead).

- [ ] **Step 2: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/AudienceFiltersCard.jsx
```
Expected: 0 errors.

- [ ] **Step 3: Manual smoke**

Open `/targeting?tab=settings`. At desktop (>1024px) the Audience filters card shows two columns side-by-side with a vertical hairline between them. Resize below 1024px — the columns stack vertically with a horizontal hairline above the Reach estimate (matching today's behavior).

- [ ] **Step 4: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/AudienceFiltersCard.jsx && git commit -m "feat(targeting): 2-col internal split on AudienceFiltersCard at lg+

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: SettingSwitch gains a `disabled` prop

**Files:**
- Modify: `src/components/SettingSwitch.jsx`

- [ ] **Step 1: Update the component signature + handler + JSX**

Replace the entire body of `src/components/SettingSwitch.jsx` with:

```jsx
// Shared switch primitive used by every toggle on the Growth page and
// anywhere else a consistent "setting with a switch" row is needed.
//
// Two non-default modes:
//   - `locked`   — paywall state. Renders the row in a subdued style
//                  with an `Advanced` pill next to the title; clicking
//                  the row routes to the page-level upgrade flow via
//                  `onLockedTap`. Does NOT call `onChange`.
//   - `disabled` — "this setting doesn't apply right now" state.
//                  Renders the row at opacity-60, the switch button
//                  has a real `disabled` attribute, and clicks are
//                  ignored entirely (no upgrade affordance, no
//                  onChange call). Independent of `locked` — the two
//                  flags can be combined, with `disabled` winning.

export default function SettingSwitch({
  title,
  description,
  icon: Icon,
  checked,
  onChange,
  locked = false,
  disabled = false,
  planLabel = 'Advanced',
  onLockedTap,
}) {
  const handleToggle = () => {
    if (disabled) return
    if (locked) {
      onLockedTap?.()
      return
    }
    onChange?.(!checked)
  }

  return (
    <div
      className={`flex items-center gap-3 py-3 ${
        locked && !disabled ? 'cursor-pointer' : ''
      } ${disabled ? 'opacity-60' : ''}`}
      onClick={locked && !disabled ? handleToggle : undefined}
    >
      {/* Left zone: optional icon + title + pill + description. */}
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        {Icon && (
          <Icon className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-medium ${
                locked ? 'text-text-secondary' : 'text-text-primary'
              }`}
            >
              {title}
            </span>
            {locked && (
              <span className="shrink-0 rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
                {planLabel}
              </span>
            )}
          </div>
          {description && (
            <p className="mt-0.5 text-xs text-text-secondary">{description}</p>
          )}
        </div>
      </div>

      {/* Right zone: the switch itself. */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={locked || disabled}
        onClick={(e) => {
          e.stopPropagation()
          handleToggle()
        }}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
          locked || disabled
            ? 'cursor-not-allowed bg-border opacity-60'
            : checked
              ? 'bg-green-base'
              : 'bg-border'
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          }`}
          aria-hidden="true"
        />
      </button>
    </div>
  )
}
```

Key changes vs today:

1. New `disabled` prop with default `false`.
2. `handleToggle` short-circuits early on `disabled`.
3. Outer row gets `opacity-60` when disabled.
4. Outer row's `onClick` only fires when `locked && !disabled` (so a `locked + disabled` row doesn't accidentally open the upgrade flow).
5. Switch button receives a real `disabled` attribute when either flag is set.
6. Switch button's track gets the same disabled visual recipe (`cursor-not-allowed bg-border opacity-60`) for both flags.

- [ ] **Step 2: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/components/SettingSwitch.jsx
```
Expected: 0 errors.

- [ ] **Step 3: Manual smoke**

Open any page using `SettingSwitch` (Engagement page or Targeting Settings tab). Existing toggles should work unchanged — `disabled` defaults to `false`, no callsite is passing it yet, so behavior is identical.

- [ ] **Step 4: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/components/SettingSwitch.jsx && git commit -m "feat(SettingSwitch): add disabled prop independent of locked

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: Wire like-after-follow disabled state on `unfollow_only` mode

**Files:**
- Modify: `src/pages/targeting/ModeCard.jsx`

- [ ] **Step 1: Replace the like-after-follow row**

In `src/pages/targeting/ModeCard.jsx`, find the existing block at the bottom (currently lines 173-181):

```jsx
{/* Like-after-follow — moved out of the deleted EngagementCard.
    Conceptually part of the follow action ("like a few of their
    posts after following"), so it belongs with Mode rather than
    as a standalone tactic card. */}
<div className="mt-4 border-t border-border pt-4">
  <SettingSwitch
    icon={Heart}
    title="Like after follow"
    description="Like a few of their recent posts after following — boosts the follow-back rate."
    checked={likeAfterFollow}
    onChange={() => toggleLikeAfterFollow()}
  />
</div>
```

Replace with:

```jsx
{/* Like-after-follow — disabled when the saved mode is
    `unfollow_only` (no follows means no follow-related likes).
    Reads from `savedMode` (not `draft`) so the disabled state
    reflects the actually-saved engine setting; staging a new
    mode doesn't grey the row until the user hits Save. */}
<div className="mt-4 border-t border-border pt-4">
  <SettingSwitch
    icon={Heart}
    title="Like after follow"
    description={
      savedMode === 'unfollow_only'
        ? "Disabled — Kicksta isn't following anyone in this mode."
        : 'Like a few of their recent posts after following — boosts the follow-back rate.'
    }
    checked={likeAfterFollow}
    onChange={() => toggleLikeAfterFollow()}
    disabled={savedMode === 'unfollow_only'}
  />
</div>
```

- [ ] **Step 2: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/ModeCard.jsx
```
Expected: 0 errors.

- [ ] **Step 3: Manual smoke**

Open `/targeting?tab=settings`. The default saved mode is `auto` (per `mocks/growthConfig.js`), so the Like-after-follow row renders normally and the toggle works.

To verify the disabled state, manually edit `src/mocks/growthConfig.js` and change `mode: "auto"` to `mode: "unfollow_only"` in `mockGrowthConfig`. Refresh — the row now reads grayed out, the description shows "Disabled — Kicksta isn't following anyone in this mode.", and clicking the toggle does nothing. Revert the mock change before committing.

- [ ] **Step 4: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/ModeCard.jsx && git commit -m "feat(targeting): like-after-follow disables on unfollow_only mode

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: TargetRow processing pill reads `Following…`

**Files:**
- Modify: `src/pages/targeting/TargetRow.jsx`

- [ ] **Step 1: Swap the pill text on processing rows**

In `src/pages/targeting/TargetRow.jsx`, find the existing pill span (currently lines 109-117):

```jsx
<span
  className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide md:inline ${
    statusPillClass[target.status]
  } ${
    isProcessing
      ? 'ring-2 ring-green-base/50 ring-offset-1 ring-offset-surface animate-pulse'
      : ''
  }`}
>
  {statusLabel[target.status]}
</span>
```

Replace the children expression so processing rows render `Following…` instead of `Active`:

```jsx
<span
  className={`hidden shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide md:inline ${
    statusPillClass[target.status]
  } ${
    isProcessing
      ? 'ring-2 ring-green-base/50 ring-offset-1 ring-offset-surface animate-pulse'
      : ''
  }`}
>
  {isProcessing ? 'Following…' : statusLabel[target.status]}
</span>
```

The `…` is the typographic ellipsis (U+2026), not three dots.

- [ ] **Step 2: Update the mobile dot's `aria-label`**

Find the mobile-only dot wrapper (currently lines 87-100 — the `<span aria-label={statusLabel[target.status]} className="relative inline-flex h-2 w-2 …" md:hidden">…</span>`).

Update its `aria-label`:

```jsx
<span
  aria-label={isProcessing ? 'Following from this target' : statusLabel[target.status]}
  className="relative inline-flex h-2 w-2 shrink-0 items-center justify-center md:hidden"
>
  {/* … existing inner spans unchanged … */}
</span>
```

- [ ] **Step 3: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/TargetRow.jsx
```
Expected: 0 errors.

- [ ] **Step 4: Manual smoke**

Open `/targeting`. The first active target's pill should read `FOLLOWING…` (uppercase, with the `…` ellipsis) and pulse. Other active targets read `ACTIVE` with no ring. Mobile (viewport <768px): the row's status dot pings, and screen reader users hear "Following from this target" on focus.

- [ ] **Step 5: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/TargetRow.jsx && git commit -m "feat(targeting): processing pill reads Following… instead of Active

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: BlacklistModal chip + empty-state revert to gray

**Files:**
- Modify: `src/pages/targeting/BlacklistModal.jsx`

- [ ] **Step 1: Revert the header chip color**

In `src/pages/targeting/BlacklistModal.jsx`, find the header chip (line ~135):

```jsx
<CardChip color="yellow" icon={Ban} />
```

Replace with:

```jsx
<CardChip color="neutral" icon={Ban} />
```

- [ ] **Step 2: Revert the empty-state circle color**

Find the empty-state block. After the previous polish cycle it looks like:

```jsx
<span
  aria-hidden="true"
  className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-tint text-yellow-base"
>
  <Ban className="h-7 w-7" />
</span>
```

Replace with:

```jsx
<span
  aria-hidden="true"
  className="flex h-14 w-14 items-center justify-center rounded-full bg-bg text-text-secondary"
>
  <Ban className="h-7 w-7" />
</span>
```

The headline + subline copy is unchanged.

- [ ] **Step 3: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/BlacklistModal.jsx
```
Expected: 0 errors.

- [ ] **Step 4: Manual smoke**

Open BlacklistModal from the Settings tab. Header chip is gray. Clear the list (remove every entry) — the empty state shows the gray circle with `Ban`.

- [ ] **Step 5: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/BlacklistModal.jsx && git commit -m "fix(targeting): revert BlacklistModal chip + empty-state to gray

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 8: Modal headers — subtitle inline + body cleanup (AddTargetSheet)

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx`

- [ ] **Step 1: Replace the header block**

In `src/pages/targeting/AddTargetSheet.jsx`, find the existing header block:

```jsx
{/* Header */}
<div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
  <div className="flex items-center gap-3">
    <CardChip color="blue" icon={Crosshair} />
    <h2 className="text-base font-semibold text-text-primary">Add a target</h2>
  </div>
  <button
    type="button"
    aria-label="Close"
    onClick={onClose}
    className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
  >
    <X className="h-5 w-5" aria-hidden="true" />
  </button>
</div>
```

Replace with:

```jsx
{/* Header — chip + title stacked over a one-line subtitle. */}
<div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5">
  <div className="flex items-start gap-3">
    <CardChip color="blue" icon={Crosshair} />
    <div className="min-w-0">
      <h2 className="text-base font-semibold leading-tight text-text-primary">
        Add a target
      </h2>
      <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
        Pick any Instagram account or hashtag — Kicksta follows its audience.
      </p>
    </div>
  </div>
  <button
    type="button"
    aria-label="Close"
    onClick={onClose}
    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
  >
    <X className="h-5 w-5" aria-hidden="true" />
  </button>
</div>
```

Notable changes:
- `items-center` → `items-start` so the close X aligns with the title row, not the centered stack.
- `py-3` → `py-3.5` — slightly more vertical room for the title + subtitle stack.
- Close button: `h-11 w-11` → `h-9 w-9` (matches Whitelist/Blacklist).

- [ ] **Step 2: Delete the body helper line**

Find the existing explainer paragraph in the body (currently ~line 194):

```jsx
{/* Explainer */}
<p className="text-xs leading-relaxed text-text-secondary">
  Pick any Instagram account or hashtag. Kicksta will follow its
  audience — those are the users most likely to follow you back.
</p>
```

Delete this entire block (the `{/* Explainer */}` comment plus the `<p>`). The `mt-4` on the next sibling (the toggle block from Task 2) preserves the same vertical rhythm without it.

- [ ] **Step 3: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/AddTargetSheet.jsx
```
Expected: 0 errors.

- [ ] **Step 4: Manual smoke**

Open AddTargetSheet. Header now shows chip + "Add a target" + subtitle "Pick any Instagram account or hashtag — Kicksta follows its audience." Close button is the same size as the other modals. Body no longer has the duplicate explainer paragraph.

- [ ] **Step 5: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/AddTargetSheet.jsx && git commit -m "refactor(targeting): inline subtitle in AddTargetSheet header

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 9: Modal headers — subtitle inline + body cleanup (WhitelistModal)

**Files:**
- Modify: `src/pages/targeting/WhitelistModal.jsx`

- [ ] **Step 1: Replace the header block**

In `src/pages/targeting/WhitelistModal.jsx`, find the existing header block:

```jsx
<div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3">
  <div className="flex items-center gap-3">
    <CardChip color="green" icon={ShieldCheck} />
    <h2 className="text-base font-semibold text-text-primary">Edit whitelist</h2>
  </div>
  <button
    type="button"
    aria-label="Close"
    onClick={onClose}
    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
  >
    <X className="h-5 w-5" aria-hidden="true" />
  </button>
</div>
```

Replace with:

```jsx
<div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
  <div className="flex items-start gap-3">
    <CardChip color="green" icon={ShieldCheck} />
    <div className="min-w-0">
      <h2 className="text-base font-semibold leading-tight text-text-primary">
        Edit whitelist
      </h2>
      <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
        Accounts here will never be unfollowed.
      </p>
    </div>
  </div>
  <button
    type="button"
    aria-label="Close"
    onClick={onClose}
    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
  >
    <X className="h-5 w-5" aria-hidden="true" />
  </button>
</div>
```

- [ ] **Step 2: Delete the body helper line**

Find the existing helper line in the body (the `<p className="text-xs text-text-secondary">Accounts here will never be unfollowed.</p>` block, the first child of `<div className="flex-1 overflow-y-auto px-5 py-4">`).

Delete the entire `<p>` (and any `{/* … */}` comment immediately above it that references "Accounts here will never be unfollowed").

- [ ] **Step 3: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/WhitelistModal.jsx
```
Expected: 0 errors.

- [ ] **Step 4: Manual smoke**

Open WhitelistModal. Header shows chip + title + subtitle "Accounts here will never be unfollowed." Body's first row is now the input + Add button (no duplicate helper line above).

- [ ] **Step 5: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/WhitelistModal.jsx && git commit -m "refactor(targeting): inline subtitle in WhitelistModal header

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 10: Modal headers — subtitle inline + body cleanup (BlacklistModal)

**Files:**
- Modify: `src/pages/targeting/BlacklistModal.jsx`

- [ ] **Step 1: Replace the header block**

In `src/pages/targeting/BlacklistModal.jsx`, find the header (chip is `neutral` after Task 7). Replace the header block with:

```jsx
<div className="flex items-start justify-between gap-3 border-b border-border px-5 py-3.5">
  <div className="flex items-start gap-3">
    <CardChip color="neutral" icon={Ban} />
    <div className="min-w-0">
      <h2 className="text-base font-semibold leading-tight text-text-primary">
        Edit blacklist
      </h2>
      <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
        Accounts here will never be followed.
      </p>
    </div>
  </div>
  <button
    type="button"
    aria-label="Close"
    onClick={onClose}
    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
  >
    <X className="h-5 w-5" aria-hidden="true" />
  </button>
</div>
```

- [ ] **Step 2: Delete the body helper line**

Find the `<p className="text-xs text-text-secondary">Accounts here will never be followed.</p>` block at the top of the body (first child of `<div className="flex-1 overflow-y-auto px-5 py-4">`). Delete it.

- [ ] **Step 3: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/BlacklistModal.jsx
```
Expected: 0 errors.

- [ ] **Step 4: Manual smoke**

Open BlacklistModal. Header shows the gray chip + title + subtitle "Accounts here will never be followed." Body starts with the input + Add row.

- [ ] **Step 5: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/BlacklistModal.jsx && git commit -m "refactor(targeting): inline subtitle in BlacklistModal header

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 11: Final lint + changelog

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Repo-wide lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src --ext .js,.jsx
```
Expected: 0 errors. Pre-existing warnings unchanged.

- [ ] **Step 2: Walk acceptance criteria**

Open the dev server and confirm:

- [ ] `/targeting` renders an underlined tab-bar with Crosshair Targets / SlidersHorizontal Settings. Subtitle below H1 swaps based on active tab.
- [ ] AddTargetSheet's account/hashtag toggle is the same underlined tab-bar.
- [ ] AudienceFiltersCard at lg+ shows two sub-sections side-by-side with a vertical hairline; mobile stacks them.
- [ ] In ModeCard, when saved mode is `unfollow_only` (test by editing the mock), the Like-after-follow row is grayed, toggle is non-interactive, description swaps.
- [ ] Processing row's pill reads `FOLLOWING…` (typographic ellipsis), still pulses, still green.
- [ ] BlacklistModal's chip is gray (`color="neutral"`); the empty-state circle is `bg-bg text-text-secondary`.
- [ ] Each modal's body no longer has the helper line — that text moved to the header subtitle.
- [ ] All three modal close buttons are `h-9 w-9`.

- [ ] **Step 3: Update `CHANGELOG.md`**

Insert a new dated section immediately under the `## 2026-05-05 — Targeting modals visual identity` block:

```markdown
## 2026-05-05 — Targeting refresh

### Changed
- **Page tab strip + AddTargetSheet toggle**: replaced the rounded-pill segmented controls with an underlined tab-bar (icon + label, blue underline on the active tab). Page subtitle swaps per-tab — Targets reads "The accounts and hashtags Kicksta is following from."; Settings reads "How Kicksta picks who to follow."
- **`AudienceFiltersCard`**: at `lg:` the two internal sections (`Audience size`, `Account type`) split into a 2-column grid with a vertical hairline divider. Mobile stacks unchanged.
- **`ModeCard`**: the Like-after-follow row disables when saved mode is `unfollow_only` (no follows means no follow-related likes). Description swaps to "Disabled — Kicksta isn't following anyone in this mode."
- **`SettingSwitch`**: new `disabled` prop independent of `locked`. Renders the row at `opacity-60`, applies a real HTML `disabled` attribute to the switch button, and ignores clicks. Used by ModeCard's like-after-follow row.
- **`TargetRow`**: the processing row's pill text changes from `ACTIVE` → `FOLLOWING…` (typographic ellipsis) so the live signal describes the action, not just the state. Mobile dot's `aria-label` swaps in lockstep.
- **`BlacklistModal`**: chip reverts from yellow to neutral (gray) to match the page-level `BlacklistCard`. Empty-state circle reverts to `bg-bg text-text-secondary`.
- **All three modal headers**: helper text moved out of the body and into the header as a subtitle below the H2. Close buttons standardized at `h-9 w-9`.
```

- [ ] **Step 4: Commit changelog**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add CHANGELOG.md && git commit -m "docs: log targeting refresh

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Self-review summary

**Spec coverage:**
- §1 (tab-bar, page tabs + AddTarget toggle) → Tasks 1 + 2.
- §2 (AudienceFilters 2-col split) → Task 3.
- §3 (like-after-follow disabled state, SettingSwitch new prop) → Tasks 4 + 5.
- §4 (FOLLOWING… pill copy) → Task 6.
- §5 (BlacklistModal color revert) → Task 7.
- §6 (modal header subtitle restructure) → Tasks 8 + 9 + 10 (one task per modal so each commit is atomic).
- Acceptance criteria walked in Task 11.

**Type / name consistency:**
- `disabled` prop name matches between Tasks 4 (SettingSwitch) and 5 (ModeCard caller).
- `isProcessing` derivation in Task 6 matches the existing variable already in TargetRow (introduced in the previous polish cycle).
- Tab-bar markup recipe is identical between Task 1 (page) and Task 2 (sheet) — same className expression, same `-mb-px`.

**Placeholders:** None. Each step has the literal final code or class string.
