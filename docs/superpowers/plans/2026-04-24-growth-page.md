# Growth Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Build the `/growth` page per `docs/superpowers/specs/2026-04-24-growth-page-design.md` — Safety strip, Mode, Engagement, Filters, Lists, and Growth+ sections, backed by two new Zustand stores (`useGrowthConfig`, `useLists`) and two shared primitives (`SettingSwitch`, `UpgradeBottomSheet`).

**Architecture:** React page composed of small, single-concept cards under `src/pages/growth/`. Config state in `useGrowthConfig` (auto-saves with a debounced toast). Whitelist/blacklist state in `useLists`. A shared `SettingSwitch` primitive is used by every toggle on the page; a shared `UpgradeBottomSheet` fires from every plan-gated row. No backend — mocks only.

**Tech Stack:** React 19 · Tailwind 4 · Zustand 5 · Lucide React · React Router 7.

**Testing:** No unit-test framework. Verification is visual via Claude Preview + DOM inspection, same pattern as prior pages. Each task commits.

---

## Conventions

- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 only.
- Only design-system color tokens (no arbitrary hex).
- Path alias `@/` → `src/`.
- Commit prefix: `feat(growth): …` for all implementation commits.
- All switches in the page use the shared `SettingSwitch` primitive — don't re-roll the visual elsewhere.
- Plan-gating: treat `mockUser.plan !== 'advanced'` as "Growth plan." V1's default mock user is `advanced` so locked UIs won't render by default; we build them anyway.

---

## File Structure

**New:**
```
src/stores/useGrowthConfig.js            config state + debounced toast
src/stores/useLists.js                   whitelist + blacklist state
src/components/SettingSwitch.jsx         shared switch primitive
src/components/UpgradeBottomSheet.jsx    shared upgrade sheet (4 feature contexts)
src/pages/growth/index.jsx               page shell (replaces stub)
src/pages/growth/SafetyStrip.jsx         ambient safety signal
src/pages/growth/ModeCard.jsx            mode segmented + dynamic description
src/pages/growth/EngagementCard.jsx      3 toggles + Welcome DM editor
src/pages/growth/PresetRangePills.jsx    preset+custom pill group for numeric ranges
src/pages/growth/FiltersCard.jsx         6 filter blocks using PresetRangePills
src/pages/growth/ListsCard.jsx           whitelist/blacklist tabs + add/remove
src/pages/growth/GrowthPlusCard.jsx      upsell vs subscriber variants
```

**Modified:** none outside `src/pages/growth/index.jsx` (stub → full page).

---

## Task 1: `useGrowthConfig` store

**Files:** Create `src/stores/useGrowthConfig.js`.

- [ ] **Step 1** — Create the file with:

```js
import { create } from 'zustand'
import { mockGrowthConfig } from '@/mocks/growthConfig'
import { useToasts } from '@/stores/useToasts'

// Debounced "Settings saved." toast — rapid changes (DM typing, range
// inputs) don't spam. One shared timer across the whole store.
let toastTimer = null
function announceSaved() {
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    useToasts.getState().addToast({
      message: 'Settings saved.',
      tone: 'success',
    })
    toastTimer = null
  }, 1500)
}

export const useGrowthConfig = create((set, get) => ({
  config: mockGrowthConfig,

  setMode: (mode) => {
    set((state) => ({ config: { ...state.config, mode } }))
    announceSaved()
  },

  toggleLikeAfterFollow: () => {
    set((state) => ({
      config: { ...state.config, likeAfterFollow: !state.config.likeAfterFollow },
    }))
    announceSaved()
  },

  toggleWelcomeDm: () => {
    set((state) => ({
      config: {
        ...state.config,
        welcomeDm: { ...state.config.welcomeDm, enabled: !state.config.welcomeDm.enabled },
      },
    }))
    announceSaved()
  },

  setWelcomeDmMessage: (message) => {
    set((state) => ({
      config: {
        ...state.config,
        welcomeDm: { ...state.config.welcomeDm, message },
      },
    }))
    announceSaved()
  },

  toggleCloseFriends: () => {
    set((state) => ({
      config: { ...state.config, closeFriendsAdder: !state.config.closeFriendsAdder },
    }))
    announceSaved()
  },

  // Filter setters. key is one of: followingRange, followerRange, mediaRange,
  // accountPrivacy, genderTarget, excludeNsfw.
  setFilter: (key, value) => {
    set((state) => {
      // followingRange / followerRange / mediaRange store {min, max}
      // mapped onto the mock's {followingMin, followingMax} etc.
      const next = { ...state.config.filters }
      if (key === 'followingRange') {
        next.followingMin = value.min
        next.followingMax = value.max
      } else if (key === 'followerRange') {
        next.followerMin = value.min
        next.followerMax = value.max
      } else if (key === 'mediaRange') {
        next.mediaMin = value.min
        next.mediaMax = value.max
      } else {
        next[key] = value
      }
      return { config: { ...state.config, filters: next } }
    })
    announceSaved()
  },

  toggleExcludeNsfw: () => {
    set((state) => ({
      config: {
        ...state.config,
        filters: { ...state.config.filters, excludeNsfw: !state.config.filters.excludeNsfw },
      },
    }))
    announceSaved()
  },

  toggleGrowthPlusActive: () => {
    set((state) => ({
      config: { ...state.config, growthPlusActive: !state.config.growthPlusActive },
    }))
    announceSaved()
  },
}))
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/stores/useGrowthConfig.js
git commit -m "feat(growth): useGrowthConfig store with debounced save toast"
```

---

## Task 2: `useLists` store

**Files:** Create `src/stores/useLists.js`.

- [ ] **Step 1** — Create the file:

```js
import { create } from 'zustand'
import { mockWhitelist } from '@/mocks/whitelist'
import { mockBlacklist } from '@/mocks/blacklist'
import { useToasts } from '@/stores/useToasts'

// Shared debounced "saved" toast reused from useGrowthConfig's pattern.
// Kept local so this store stays standalone.
let toastTimer = null
function announceSaved() {
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    useToasts.getState().addToast({
      message: 'Settings saved.',
      tone: 'success',
    })
    toastTimer = null
  }, 1500)
}

function normalizeHandle(raw) {
  return `@${String(raw || '').replace(/^@/, '').trim().toLowerCase()}`
}

// Very light IG-handle format check.
function isValidHandle(raw) {
  const clean = String(raw || '').replace(/^@/, '').trim()
  return /^[a-zA-Z0-9._]{1,30}$/.test(clean)
}

const newId = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`

export const useLists = create((set, get) => ({
  whitelist: mockWhitelist,
  blacklist: mockBlacklist,

  // Returns 'ok', 'invalid', or 'duplicate' so the caller can fire the
  // right toast / inline helper.
  addEntry: (type, rawUsername) => {
    if (!isValidHandle(rawUsername)) return 'invalid'
    const username = normalizeHandle(rawUsername)
    const list = get()[type] || []
    if (list.some((e) => e.username.toLowerCase() === username)) return 'duplicate'
    const entry = {
      id: newId(type === 'whitelist' ? 'w' : 'b'),
      username,
      addedAt: new Date().toISOString(),
    }
    set((state) => ({ [type]: [...state[type], entry] }))
    announceSaved()
    return 'ok'
  },

  removeEntry: (type, id) => {
    set((state) => ({
      [type]: state[type].filter((e) => e.id !== id),
    }))
    announceSaved()
  },
}))
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/stores/useLists.js
git commit -m "feat(growth): useLists store for whitelist + blacklist"
```

---

## Task 3: `SettingSwitch` primitive

**Files:** Create `src/components/SettingSwitch.jsx`.

- [ ] **Step 1** — Create the file:

```jsx
// Shared switch primitive used by every toggle on the Growth page and
// anywhere else a consistent "setting with a switch" row is needed.
//
// Supports a `locked` prop that renders the row in a subdued state with
// an `Advanced` pill next to the title. When locked, clicking anywhere
// on the row calls `onLockedTap` (the page-level upgrade sheet opener)
// and does NOT call `onChange`.

export default function SettingSwitch({
  title,
  description,
  icon: Icon,
  checked,
  onChange,
  locked = false,
  planLabel = 'Advanced',
  onLockedTap,
}) {
  const handleToggle = () => {
    if (locked) {
      onLockedTap?.()
      return
    }
    onChange?.(!checked)
  }

  return (
    <div
      className={`flex items-center gap-3 py-3 ${
        locked ? 'cursor-pointer' : ''
      }`}
      onClick={locked ? handleToggle : undefined}
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
        disabled={locked}
        onClick={(e) => {
          e.stopPropagation()
          handleToggle()
        }}
        className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
          locked
            ? 'cursor-pointer bg-border opacity-60'
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

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/components/SettingSwitch.jsx
git commit -m "feat(growth): shared SettingSwitch primitive"
```

---

## Task 4: `UpgradeBottomSheet` component

**Files:** Create `src/components/UpgradeBottomSheet.jsx`.

- [ ] **Step 1** — Create the file:

```jsx
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Sparkles, X } from 'lucide-react'

// Shared upgrade sheet. Opens from any plan-gated feature. Each feature
// has its own headline + benefit copy + list of unlocks; pick via the
// `feature` prop.

const FEATURE_CONTENT = {
  welcome_dm: {
    headline: 'Unlock Welcome DM',
    benefit: 'Auto-DM new followers and welcome them into your audience.',
    unlocks: [
      'Welcome DM automation',
      'Close Friends Adder',
      'Gender filter',
      '30 target slots',
    ],
  },
  close_friends: {
    headline: 'Unlock Close Friends Adder',
    benefit: 'Automatically add new followers to your Close Friends list.',
    unlocks: [
      'Close Friends Adder',
      'Welcome DM automation',
      'Gender filter',
      '30 target slots',
    ],
  },
  gender_filter: {
    headline: 'Unlock Gender targeting',
    benefit:
      'Refine targeting to a specific gender for better-qualified followers.',
    unlocks: [
      'Gender filter',
      'Welcome DM automation',
      'Close Friends Adder',
      '30 target slots',
    ],
  },
  targets_slots: {
    headline: 'Unlock 30 target slots',
    benefit: 'Track 3× more accounts and hashtags at once.',
    unlocks: [
      '30 target slots',
      'Welcome DM automation',
      'Close Friends Adder',
      'Gender filter',
    ],
  },
}

export default function UpgradeBottomSheet({ open, onClose, feature = 'welcome_dm' }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    if (!open) return
    setMounted(false)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const content = FEATURE_CONTENT[feature] ?? FEATURE_CONTENT.welcome_dm

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={content.headline}
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/40 transition-opacity duration-200 lg:items-center ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full max-h-[85vh] flex-col overflow-hidden rounded-t-xl bg-surface shadow-xl transition-all duration-200 ease-out lg:max-w-md lg:rounded-xl ${
          mounted ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="flex items-start gap-3 px-5 pt-5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-tint text-blue-text">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-text-primary">
              {content.headline}
            </h2>
            <p className="mt-1 text-sm text-text-secondary">{content.benefit}</p>
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

        {/* Unlocks list */}
        <ul className="mt-4 flex flex-col gap-2 px-5">
          {content.unlocks.map((u) => (
            <li key={u} className="flex items-center gap-2 text-sm text-text-primary">
              <Check className="h-4 w-4 shrink-0 text-green-base" aria-hidden="true" />
              {u}
            </li>
          ))}
        </ul>

        {/* Footer */}
        <div className="mt-6 flex flex-col-reverse gap-3 border-t border-border px-5 py-4 lg:flex-row lg:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-bg px-4 text-sm font-medium text-text-primary hover:opacity-90"
          >
            Cancel
          </button>
          <Link
            to="/signup/plan-selection"
            onClick={onClose}
            className="inline-flex h-11 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            Upgrade to Advanced
          </Link>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/components/UpgradeBottomSheet.jsx
git commit -m "feat(growth): shared UpgradeBottomSheet with per-feature content"
```

---

## Task 5: Page shell + `SafetyStrip`

**Files:**
- Modify: `src/pages/growth/index.jsx` (replace stub).
- Create: `src/pages/growth/SafetyStrip.jsx`.

- [ ] **Step 1** — Create `src/pages/growth/SafetyStrip.jsx`:

```jsx
import { Shield } from 'lucide-react'

// Ambient trust signal at the top of the Growth page. Not a card —
// no border, just a blue-tint surface that sets the tone for the
// configuration choices below.
export default function SafetyStrip() {
  return (
    <div className="mt-6 flex items-center gap-2.5 rounded-xl bg-blue-tint px-4 py-3">
      <Shield className="h-4 w-4 shrink-0 text-blue-text" aria-hidden="true" />
      <p className="text-sm text-blue-text">
        Kicksta stays within Instagram's safe daily limits.
      </p>
    </div>
  )
}
```

- [ ] **Step 2** — Replace `src/pages/growth/index.jsx`:

```jsx
import { useState } from 'react'
import SafetyStrip from './SafetyStrip'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Growth page — config surface for the Targeted Growth engine and
// Growth+ opt-in. Every editable control auto-saves via the stores.
//
// The page also hosts a single shared UpgradeBottomSheet that fires
// from every plan-gated feature. Child cards open it via a callback.
export default function GrowthPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)

  const openUpgrade = (feature) => setUpgradeFeature(feature)
  const closeUpgrade = () => setUpgradeFeature(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Growth
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure how Kicksta grows your account.
        </p>
      </header>

      <SafetyStrip />

      {/* Mode / Engagement / Filters / Lists / Growth+ cards wire in
          across Tasks 6–10. */}

      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'welcome_dm'}
      />
    </div>
  )
}
```

- [ ] **Step 3** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/index.jsx src/pages/growth/SafetyStrip.jsx
git commit -m "feat(growth): page shell + safety strip + upgrade sheet host"
```

---

## Task 6: `ModeCard`

**Files:**
- Create: `src/pages/growth/ModeCard.jsx`.
- Modify: `src/pages/growth/index.jsx`.

- [ ] **Step 1** — Create `src/pages/growth/ModeCard.jsx`:

```jsx
import { useGrowthConfig } from '@/stores/useGrowthConfig'

const MODES = [
  {
    value: 'auto',
    label: 'Auto',
    description:
      'Follow new users, like their posts, then unfollow after a period.',
  },
  {
    value: 'follow_only',
    label: 'Follow-only',
    description: 'Follow new users from your targets. No unfollows.',
  },
  {
    value: 'unfollow_only',
    label: 'Unfollow-only',
    description: 'Clean up non-followers. No new follows.',
  },
]

export default function ModeCard() {
  const mode = useGrowthConfig((s) => s.config.mode)
  const setMode = useGrowthConfig((s) => s.setMode)

  const current = MODES.find((m) => m.value === mode) ?? MODES[0]

  return (
    <section className="mt-4 rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Mode</h2>
      <p className="mt-1 text-sm text-text-secondary">{current.description}</p>

      <div className="mt-4 inline-flex rounded-full bg-bg p-1">
        {MODES.map((m) => {
          const selected = mode === m.value
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setMode(m.value)}
              className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-medium transition-colors ${
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
    </section>
  )
}
```

- [ ] **Step 2** — Wire into the page. In `src/pages/growth/index.jsx`, add the import and render after `<SafetyStrip />`:

Use the Edit tool. Find:

```jsx
import SafetyStrip from './SafetyStrip'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'
```

Replace with:

```jsx
import SafetyStrip from './SafetyStrip'
import ModeCard from './ModeCard'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'
```

Then find:

```jsx
      <SafetyStrip />

      {/* Mode / Engagement / Filters / Lists / Growth+ cards wire in
          across Tasks 6–10. */}
```

Replace with:

```jsx
      <SafetyStrip />

      <ModeCard />

      {/* Engagement / Filters / Lists / Growth+ cards wire in across
          Tasks 7–10. */}
```

- [ ] **Step 3** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/ModeCard.jsx src/pages/growth/index.jsx
git commit -m "feat(growth): mode card with segmented pills and dynamic description"
```

---

## Task 7: `EngagementCard` + Welcome DM editor

**Files:**
- Create: `src/pages/growth/EngagementCard.jsx`.
- Modify: `src/pages/growth/index.jsx`.

- [ ] **Step 1** — Create `src/pages/growth/EngagementCard.jsx`:

```jsx
import { Heart, MessageSquare, Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'

// Plan-gating helper — kept local until a second consumer shows up.
function isLocked(feature, user) {
  if (user.plan === 'advanced') return false
  // Features gated to Advanced on Growth plan:
  return feature === 'welcome_dm' || feature === 'close_friends'
}

export default function EngagementCard({ onRequestUpgrade }) {
  const {
    config,
    toggleLikeAfterFollow,
    toggleWelcomeDm,
    setWelcomeDmMessage,
    toggleCloseFriends,
  } = useGrowthConfig()

  const welcomeLocked = isLocked('welcome_dm', mockUser)
  const closeFriendsLocked = isLocked('close_friends', mockUser)

  const showWelcomeEditor =
    config.welcomeDm.enabled && !welcomeLocked

  return (
    <section className="mt-4 rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Engagement</h2>
      <p className="mt-1 text-sm text-text-secondary">
        How Kicksta interacts with new followers.
      </p>

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
          {showWelcomeEditor && (
            <div className="pb-3">
              <label
                htmlFor="welcome-dm-message"
                className="text-[11px] font-medium uppercase tracking-wide text-text-muted"
              >
                Message
              </label>
              <textarea
                id="welcome-dm-message"
                rows={4}
                maxLength={200}
                defaultValue={config.welcomeDm.message}
                onBlur={(e) => setWelcomeDmMessage(e.target.value)}
                className="mt-1.5 w-full resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
              <div className="mt-1 text-right text-xs text-text-muted">
                <WelcomeDmCounter />
              </div>
            </div>
          )}
        </div>

        <SettingSwitch
          icon={Star}
          title="Close Friends Adder"
          description="Add new followers to your Close Friends list for exclusive content."
          checked={config.closeFriendsAdder}
          onChange={() => toggleCloseFriends()}
          locked={closeFriendsLocked}
          onLockedTap={() => onRequestUpgrade('close_friends')}
        />
      </div>
    </section>
  )
}

// Live character counter (re-reads the message from the store so the
// count stays correct when typing — the textarea itself is uncontrolled,
// saving only on blur).
function WelcomeDmCounter() {
  const message = useGrowthConfig((s) => s.config.welcomeDm.message)
  return <span>{message.length}/200</span>
}
```

NOTE: the textarea is uncontrolled (`defaultValue` + `onBlur`) so typing doesn't re-render every keystroke and doesn't spam saves. The counter reads from the store but only updates when `setWelcomeDmMessage` fires on blur — acceptable trade-off to keep the UI calm.

- [ ] **Step 2** — Wire into the page.

In `src/pages/growth/index.jsx`, add the import:

```jsx
import ModeCard from './ModeCard'
import EngagementCard from './EngagementCard'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'
```

Then swap the rendered cards:

```jsx
      <SafetyStrip />

      <ModeCard />
      <EngagementCard onRequestUpgrade={openUpgrade} />

      {/* Filters / Lists / Growth+ cards wire in across Tasks 8–10. */}
```

- [ ] **Step 3** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/EngagementCard.jsx src/pages/growth/index.jsx
git commit -m "feat(growth): engagement card with 3 toggles + welcome DM editor + plan gating"
```

---

## Task 8: `PresetRangePills` primitive

**Files:** Create `src/pages/growth/PresetRangePills.jsx`.

- [ ] **Step 1** — Create the file:

```jsx
import { useEffect, useState } from 'react'

// Preset-or-custom pill group for numeric range filters. Presets are
// tap-selectable; the Custom pill expands inline number inputs below.
//
// Props:
// - presets: [{ key, label, min, max }]
// - value: { min, max }  — current range; null max means "any"
// - onChange: ({ min, max }) => void
export default function PresetRangePills({ presets, value, onChange }) {
  const matchedPreset = presets.find(
    (p) => p.min === value.min && p.max === value.max
  )
  const isCustom = !matchedPreset
  const [customOpen, setCustomOpen] = useState(isCustom)

  // Keep the custom drawer open whenever the value isn't a preset.
  useEffect(() => {
    if (isCustom) setCustomOpen(true)
  }, [isCustom])

  const handlePresetClick = (preset) => {
    setCustomOpen(false)
    onChange({ min: preset.min, max: preset.max })
  }

  const handleCustomClick = () => {
    setCustomOpen(true)
    // Seed the custom inputs with the current value if already custom.
  }

  const handleMin = (e) => {
    const n = e.target.value === '' ? null : Number(e.target.value)
    if (Number.isNaN(n)) return
    onChange({ min: n, max: value.max })
  }

  const handleMax = (e) => {
    const n = e.target.value === '' ? null : Number(e.target.value)
    if (Number.isNaN(n)) return
    onChange({ min: value.min, max: n })
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => {
          const selected = !customOpen && matchedPreset?.key === p.key
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => handlePresetClick(p)}
              className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-surface text-text-primary shadow-sm ring-1 ring-border'
                  : 'bg-bg text-text-secondary hover:text-text-primary'
              }`}
            >
              {p.label}
            </button>
          )
        })}
        <button
          type="button"
          onClick={handleCustomClick}
          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            customOpen
              ? 'bg-surface text-text-primary shadow-sm ring-1 ring-border'
              : 'bg-bg text-text-secondary hover:text-text-primary'
          }`}
        >
          Custom
        </button>
      </div>

      {customOpen && (
        <div className="mt-3 flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            Min
            <input
              type="number"
              value={value.min ?? ''}
              onChange={handleMin}
              className="h-10 w-24 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-text-secondary">
            Max
            <input
              type="number"
              value={value.max ?? ''}
              onChange={handleMax}
              placeholder="any"
              className="h-10 w-24 rounded-lg border border-border bg-surface px-3 text-sm text-text-primary"
            />
          </label>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/PresetRangePills.jsx
git commit -m "feat(growth): preset-range pills primitive with custom min/max inputs"
```

---

## Task 9: `FiltersCard`

**Files:**
- Create: `src/pages/growth/FiltersCard.jsx`.
- Modify: `src/pages/growth/index.jsx`.

- [ ] **Step 1** — Create `src/pages/growth/FiltersCard.jsx`:

```jsx
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'
import PresetRangePills from './PresetRangePills'

const FOLLOWING_PRESETS = [
  { key: 'low', label: '< 500', min: 0, max: 500 },
  { key: 'mid', label: '500–5K', min: 500, max: 5000 },
  { key: 'high', label: '5K+', min: 5000, max: null },
]

const FOLLOWER_PRESETS = [
  { key: 'low', label: '< 1K', min: 0, max: 1000 },
  { key: 'mid', label: '1K–50K', min: 1000, max: 50000 },
  { key: 'high', label: '50K+', min: 50000, max: null },
]

const MEDIA_PRESETS = [
  { key: 'low', label: '< 10', min: 0, max: 10 },
  { key: 'mid', label: '10–100', min: 10, max: 100 },
  { key: 'high', label: '100+', min: 100, max: null },
]

const PRIVACY_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'public', label: 'Public only' },
  { value: 'private', label: 'Private only' },
]

const GENDER_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

function SegmentedPills({ value, options, onChange, disabled = false }) {
  return (
    <div
      className={`inline-flex rounded-full bg-bg p-1 ${
        disabled ? 'pointer-events-none opacity-60' : ''
      }`}
    >
      {options.map((o) => {
        const selected = value === o.value
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-medium transition-colors ${
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
  )
}

export default function FiltersCard({ onRequestUpgrade }) {
  const config = useGrowthConfig((s) => s.config)
  const setFilter = useGrowthConfig((s) => s.setFilter)
  const toggleExcludeNsfw = useGrowthConfig((s) => s.toggleExcludeNsfw)

  const genderLocked = mockUser.plan !== 'advanced'

  const followingRange = {
    min: config.filters.followingMin,
    max: config.filters.followingMax,
  }
  const followerRange = {
    min: config.filters.followerMin,
    max: config.filters.followerMax,
  }
  const mediaRange = {
    min: config.filters.mediaMin,
    max: config.filters.mediaMax,
  }

  return (
    <section className="mt-4 rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Filters</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Target only accounts that match these criteria.
      </p>

      <div className="mt-4 flex flex-col divide-y divide-border">
        {/* Following count */}
        <div className="py-4 first:pt-0">
          <p className="text-sm font-medium text-text-primary">Following count</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            People this account follows.
          </p>
          <div className="mt-2">
            <PresetRangePills
              presets={FOLLOWING_PRESETS}
              value={followingRange}
              onChange={(v) => setFilter('followingRange', v)}
            />
          </div>
        </div>

        {/* Follower count */}
        <div className="py-4">
          <p className="text-sm font-medium text-text-primary">Follower count</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            How many followers they have.
          </p>
          <div className="mt-2">
            <PresetRangePills
              presets={FOLLOWER_PRESETS}
              value={followerRange}
              onChange={(v) => setFilter('followerRange', v)}
            />
          </div>
        </div>

        {/* Media count */}
        <div className="py-4">
          <p className="text-sm font-medium text-text-primary">Media count</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            How many posts they've published.
          </p>
          <div className="mt-2">
            <PresetRangePills
              presets={MEDIA_PRESETS}
              value={mediaRange}
              onChange={(v) => setFilter('mediaRange', v)}
            />
          </div>
        </div>

        {/* Account privacy */}
        <div className="py-4">
          <p className="text-sm font-medium text-text-primary">Account privacy</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Whether their profile is public or private.
          </p>
          <div className="mt-2">
            <SegmentedPills
              value={config.filters.accountPrivacy}
              options={PRIVACY_OPTIONS}
              onChange={(v) => setFilter('accountPrivacy', v)}
            />
          </div>
        </div>

        {/* Gender target (Advanced-only) */}
        <div
          className={`py-4 ${genderLocked ? 'cursor-pointer' : ''}`}
          onClick={genderLocked ? () => onRequestUpgrade('gender_filter') : undefined}
        >
          <div className="flex items-center gap-2">
            <p
              className={`text-sm font-medium ${
                genderLocked ? 'text-text-secondary' : 'text-text-primary'
              }`}
            >
              Gender target
            </p>
            {genderLocked && (
              <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
                Advanced
              </span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-text-secondary">
            Narrow targeting by account gender.
          </p>
          <div className="mt-2">
            <SegmentedPills
              value={config.filters.genderTarget}
              options={GENDER_OPTIONS}
              onChange={(v) => setFilter('genderTarget', v)}
              disabled={genderLocked}
            />
          </div>
        </div>

        {/* Exclude NSFW */}
        <SettingSwitch
          title="Exclude NSFW accounts"
          description="Skip accounts that appear to contain adult content."
          checked={config.filters.excludeNsfw}
          onChange={() => toggleExcludeNsfw()}
        />
      </div>
    </section>
  )
}
```

- [ ] **Step 2** — Wire into `src/pages/growth/index.jsx`. Add the import:

```jsx
import EngagementCard from './EngagementCard'
import FiltersCard from './FiltersCard'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'
```

Then render after EngagementCard:

```jsx
      <ModeCard />
      <EngagementCard onRequestUpgrade={openUpgrade} />
      <FiltersCard onRequestUpgrade={openUpgrade} />

      {/* Lists / Growth+ cards wire in across Tasks 10–11. */}
```

- [ ] **Step 3** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/FiltersCard.jsx src/pages/growth/index.jsx
git commit -m "feat(growth): filters card — 6 filter blocks + plan-gated gender filter"
```

---

## Task 10: `ListsCard`

**Files:**
- Create: `src/pages/growth/ListsCard.jsx`.
- Modify: `src/pages/growth/index.jsx`.

- [ ] **Step 1** — Create `src/pages/growth/ListsCard.jsx`:

```jsx
import { useState } from 'react'
import { X } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import { useToasts } from '@/stores/useToasts'

const TABS = [
  {
    key: 'whitelist',
    label: 'Whitelist',
    sub: 'Accounts here will never be unfollowed.',
    emptyCopy: 'No accounts whitelisted yet.',
  },
  {
    key: 'blacklist',
    label: 'Blacklist',
    sub: 'Accounts here are excluded from all interaction.',
    emptyCopy: 'No accounts blacklisted yet.',
  },
]

export default function ListsCard() {
  const [tab, setTab] = useState('whitelist')
  const [input, setInput] = useState('')
  const [error, setError] = useState(null)

  const whitelist = useLists((s) => s.whitelist)
  const blacklist = useLists((s) => s.blacklist)
  const addEntry = useLists((s) => s.addEntry)
  const removeEntry = useLists((s) => s.removeEntry)

  const currentTab = TABS.find((t) => t.key === tab)
  const entries = tab === 'whitelist' ? whitelist : blacklist

  const handleAdd = () => {
    if (!input.trim()) return
    const result = addEntry(tab, input)
    if (result === 'invalid') {
      setError('Usernames use letters, numbers, dots, and underscores.')
      return
    }
    if (result === 'duplicate') {
      useToasts.getState().addToast({
        message: 'Already in list.',
        tone: 'warning',
      })
      setError(null)
      return
    }
    setInput('')
    setError(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <section className="mt-4 rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Lists</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Fine-tune who Kicksta does and doesn't interact with.
      </p>

      {/* Tabs */}
      <div className="mt-4 inline-flex rounded-full bg-bg p-1">
        {TABS.map((t) => {
          const selected = tab === t.key
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setTab(t.key)
                setInput('')
                setError(null)
              }}
              className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-xs font-medium transition-colors ${
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

      {/* Tab sub */}
      <p className="mt-2 text-xs text-text-secondary">{currentTab.sub}</p>

      {/* Quick-add */}
      <div className="mt-4 flex gap-2">
        <div className="flex h-10 flex-1 items-center overflow-hidden rounded-lg border border-border bg-surface px-3">
          <span className="mr-1 text-text-muted">@</span>
          <input
            type="text"
            value={input.replace(/^@/, '')}
            onChange={(e) => {
              setInput(e.target.value)
              setError(null)
            }}
            onKeyDown={handleKeyDown}
            placeholder="username"
            autoComplete="off"
            className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
          />
        </div>
        <button
          type="button"
          onClick={handleAdd}
          disabled={!input.trim()}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-red-text">{error}</p>}

      {/* Entries */}
      <div className="mt-4 flex flex-col divide-y divide-border">
        {entries.length === 0 && (
          <p className="py-4 text-center text-sm text-text-muted">
            {currentTab.emptyCopy}
          </p>
        )}
        {entries.map((e) => (
          <div key={e.id} className="flex items-center justify-between py-3">
            <span className="text-sm text-text-primary">{e.username}</span>
            <button
              type="button"
              onClick={() => removeEntry(tab, e.id)}
              aria-label={`Remove ${e.username}`}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-red-text"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </section>
  )
}
```

- [ ] **Step 2** — Wire into `src/pages/growth/index.jsx`:

```jsx
import FiltersCard from './FiltersCard'
import ListsCard from './ListsCard'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'
```

```jsx
      <FiltersCard onRequestUpgrade={openUpgrade} />
      <ListsCard />

      {/* Growth+ card wires in at Task 11. */}
```

- [ ] **Step 3** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/ListsCard.jsx src/pages/growth/index.jsx
git commit -m "feat(growth): lists card with whitelist/blacklist tabs and quick-add"
```

---

## Task 11: `GrowthPlusCard`

**Files:**
- Create: `src/pages/growth/GrowthPlusCard.jsx`.
- Modify: `src/pages/growth/index.jsx`.

- [ ] **Step 1** — Create `src/pages/growth/GrowthPlusCard.jsx`:

```jsx
import { Link } from 'react-router-dom'
import { Lock, Sparkles } from 'lucide-react'
import { mockUser } from '@/mocks/user'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import SettingSwitch from '@/components/SettingSwitch'

// Growth+ is a separate paid add-on. Two variants:
//  - Non-subscriber: upsell card with CTA to /signup/growth-plus.
//  - Subscriber: active card with pause toggle + manage link.
//
// Per PRODUCT.md, Growth+ is visually separate from Targeted Growth —
// different bg tint and a clear identity.
export default function GrowthPlusCard() {
  const subscribed = mockUser.growthPlusSubscribed === true
  const active = useGrowthConfig((s) => s.config.growthPlusActive)
  const togglePlusActive = useGrowthConfig((s) => s.toggleGrowthPlusActive)

  if (!subscribed) {
    return (
      <section className="mt-4 rounded-xl border border-border bg-bg p-4 lg:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-tint text-purple-text">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-semibold text-text-primary">Growth+</h2>
            <p className="mt-1 text-sm text-text-secondary">
              Algorithmic reach, separate subscription.
            </p>
            <p className="mt-3 text-sm text-text-secondary">
              Add Growth+ for extra algorithmic reach. Our network of accounts
              boosts your posts — separate billing, cancel any time.
            </p>
            <div className="mt-3 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
              <p className="text-xs text-text-muted">
                Growth+ followers are marked separately from Targeted Growth.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4">
          <Link
            to="/signup/growth-plus"
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-purple-base px-5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90"
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Add Growth+
          </Link>
        </div>
      </section>
    )
  }

  // Subscriber variant
  return (
    <section className="mt-4 rounded-xl border border-border bg-bg p-4 lg:p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-tint text-purple-text">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-text-primary">Growth+</h2>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                active
                  ? 'bg-green-tint text-green-text'
                  : 'bg-bg text-text-secondary'
              }`}
            >
              {active ? 'Active' : 'Paused'}
            </span>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            {active
              ? 'Boosting your posts algorithmically.'
              : 'Paused — resume any time.'}
          </p>
        </div>
      </div>

      <div className="mt-3">
        <SettingSwitch
          title="Growth+ active"
          description="Toggle to pause the algorithmic boost without cancelling."
          checked={active}
          onChange={() => togglePlusActive()}
        />
      </div>

      <div className="mt-3">
        <Link
          to="/account"
          className="text-xs text-text-secondary hover:text-text-primary hover:underline"
        >
          Manage subscription
        </Link>
      </div>
    </section>
  )
}
```

- [ ] **Step 2** — Wire into `src/pages/growth/index.jsx`. Final version of the file:

```jsx
import { useState } from 'react'
import SafetyStrip from './SafetyStrip'
import ModeCard from './ModeCard'
import EngagementCard from './EngagementCard'
import FiltersCard from './FiltersCard'
import ListsCard from './ListsCard'
import GrowthPlusCard from './GrowthPlusCard'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

export default function GrowthPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)

  const openUpgrade = (feature) => setUpgradeFeature(feature)
  const closeUpgrade = () => setUpgradeFeature(null)

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Growth
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Configure how Kicksta grows your account.
        </p>
      </header>

      <SafetyStrip />

      <ModeCard />
      <EngagementCard onRequestUpgrade={openUpgrade} />
      <FiltersCard onRequestUpgrade={openUpgrade} />
      <ListsCard />
      <GrowthPlusCard />

      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'welcome_dm'}
      />
    </div>
  )
}
```

- [ ] **Step 3** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/GrowthPlusCard.jsx src/pages/growth/index.jsx
git commit -m "feat(growth): growth+ card — upsell + subscriber variants"
```

---

## Task 12: Visual verify + docs

**Files:** Any of the above based on visual review; then `CHANGELOG.md` + `CONTEXT.md`.

- [ ] **Step 1** — Controller walks through the preview:
  - Navigate to `/growth`.
  - Verify header, safety strip, Mode / Engagement / Filters / Lists / Growth+ cards all render in order.
  - Flip Mode pills — description line updates; toast fires after ~1.5s.
  - Toggle each Engagement switch. Welcome DM textarea appears/disappears correctly.
  - Filters: tap presets, tap Custom, type in Min/Max inputs.
  - Lists: add a handle, verify dedupe toast, remove a handle.
  - Growth+ card shows upsell (default mockUser has `growthPlusSubscribed: false`).
  - Temporarily set `mockUser.plan = 'growth'` and verify Welcome DM + Close Friends rows + Gender filter all show locked state and open the `UpgradeBottomSheet` on tap. **Revert the plan change before committing.**
  - Mobile viewport (375): all cards stack, pills wrap, list add row stays usable.
  - Dark mode: tokens all render correctly.
  - No console errors.

- [ ] **Step 2** — Fix any visual issues surfaced. Commit under `chore(growth): polish pass` if needed.

- [ ] **Step 3** — Update `CHANGELOG.md`. Add above the existing 2026-04-24 entries:

```markdown
---

## 2026-04-24 — Growth page

### Created
- **`/growth` page** — Safety strip, Mode, Engagement, Filters, Lists, Growth+ — in that order, all cards using the same radius/border rhythm as other pages
- **Shared `SettingSwitch` primitive** (`src/components/SettingSwitch.jsx`) — title + description + switch row, with `locked` prop for plan-gated features (renders subdued + `Advanced` pill + opens the upgrade sheet on tap)
- **Shared `UpgradeBottomSheet`** (`src/components/UpgradeBottomSheet.jsx`) — per-feature headline + benefit + unlocks list + primary `Upgrade to Advanced` CTA routing to `/signup/plan-selection`. Called from plan-gated rows (Welcome DM, Close Friends Adder, Gender filter)
- **`useGrowthConfig`** (`src/stores/useGrowthConfig.js`) — config state seeded from `mockGrowthConfig`; every setter fires a debounced "Settings saved." toast (1.5s)
- **`useLists`** (`src/stores/useLists.js`) — whitelist/blacklist with `addEntry` (returns `ok`/`duplicate`/`invalid`) and `removeEntry`
- **`PresetRangePills`** — preset-or-custom pill group used for the three numeric range filters
- `docs/superpowers/specs/2026-04-24-growth-page-design.md` · `docs/superpowers/plans/2026-04-24-growth-page.md`

### Decisions
- **Auto-save with debounced toast (1.5s).** Matches the rest of the dashboard's "things happen in real time" tone. No save button
- **All filters visible at once.** Honest about the configurable surface. If density ever feels heavy, drop to a collapsed "Advanced filters" expand
- **Whitelist + Blacklist live in one card with internal tabs.** They're "exceptions to the default behavior" — one concept, two sides
- **Welcome DM textarea is uncontrolled + saves on blur.** Keeps the toast system calm; store updates only when the user leaves the field
- **Growth+ has its own card with a different background (`bg-bg`)** so it reads as a distinct product, per PRODUCT.md Problem 1
```

- [ ] **Step 4** — Update `CONTEXT.md`. Add the Growth page section after the Targeting page section. In the update log append:

```markdown
- **2026-04-24 (growth)** — Growth page shipped. Six sections (safety strip + 5 cards) backed by two new stores (`useGrowthConfig` with debounced save toast, `useLists`) and two shared primitives (`SettingSwitch`, `UpgradeBottomSheet`). Plan-gated features (Welcome DM, Close Friends, Gender filter) render subdued with an `Advanced` pill and open the shared upgrade sheet on tap. Growth+ is its own card with `bg-bg` to stay visually separate from Targeted Growth.
```

- [ ] **Step 5** — Commit docs:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add CHANGELOG.md CONTEXT.md
git commit -m "docs: log Growth page"
```

---

## Spec Coverage

Against `docs/superpowers/specs/2026-04-24-growth-page-design.md`:

- § 1 Page layout → Task 5 (shell) + 6–11 (cards).
- § 2 Safety strip → Task 5.
- § 3 Mode card → Task 6.
- § 4 Engagement card → Task 7.
- § 5 Filters card → Tasks 8 + 9.
- § 6 Lists card → Task 10.
- § 7 Growth+ card → Task 11.
- § 8 Shared primitives (SettingSwitch, UpgradeBottomSheet, useGrowthConfig, useLists) → Tasks 1–4.
- § 9 File-level diff → Covered across all tasks.
- § 10 Responsive notes → Components built mobile-first; visual verify in Task 12.
- § 11 Out of scope → Intentionally not implemented.
- § 12 Success criteria → Task 12 Step 1 walkthrough.
