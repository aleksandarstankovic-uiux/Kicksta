# Growth Page v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Rework the Growth page per `docs/superpowers/specs/2026-04-24-growth-page-v2-design.md` — 2-column desktop grid, Mode as elevated option cards, Engagement with Close Friends add/remove mode, Filters as compact inline rows, Lists with must-pick typeahead, Growth+ as a hero banner.

**Architecture:** Same file layout as v1; each component rewritten in place. One mock shape change (Close Friends becomes `{enabled, mode}`) and one store extension (`setCloseFriendsMode`). No new shared primitives (`SettingSwitch`, `UpgradeBottomSheet` unchanged).

**Tech Stack:** React 19 · Tailwind 4 · Zustand 5 · Lucide React.

**Testing:** No unit-test framework. Visual verification via Claude Preview. Each task commits.

---

## Conventions

- Spacing scale 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 only.
- Design tokens only (no hex). Purple is the only new family used (for Growth+) — `bg-purple-tint`, `bg-purple-base`, `text-purple-text`.
- Commit prefix: `feat(growth-v2): …` / `refactor(growth-v2): …`.
- Breakpoint: the Growth page uses `lg:` (1024px+) for desktop per existing convention on other pages.
- Path alias `@/` → `src/`.

---

## File Structure

**Modified:**
```
src/mocks/growthConfig.js                    closeFriendsAdder shape change
src/stores/useGrowthConfig.js                toggleCloseFriends rewrite + setCloseFriendsMode
src/pages/growth/index.jsx                   grid composition
src/pages/growth/ModeCard.jsx                full rewrite (elevated cards)
src/pages/growth/EngagementCard.jsx          full rewrite (CF segmented + store wiring)
src/pages/growth/FiltersCard.jsx             full rewrite (inline rows + InfoTooltip)
src/pages/growth/PresetRangePills.jsx        tighten pill padding
src/pages/growth/ListsCard.jsx               typeahead dropdown + must-pick
src/pages/growth/GrowthPlusCard.jsx          full rewrite (hero banner)
```

**Unchanged:**
```
src/pages/growth/SafetyStrip.jsx
src/components/SettingSwitch.jsx
src/components/UpgradeBottomSheet.jsx
src/stores/useLists.js
src/mocks/targetSearch.js (reused for Lists typeahead)
```

---

## Task 1: Mock + store — Close Friends shape change

**Files:**
- Modify: `src/mocks/growthConfig.js`
- Modify: `src/stores/useGrowthConfig.js`

- [ ] **Step 1** — Replace `src/mocks/growthConfig.js` with:

```js
export const mockGrowthConfig = {
  mode: 'auto',
  likeAfterFollow: true,
  welcomeDm: {
    enabled: false,
    message: 'Hey! Thanks for the follow \ud83d\ude4c Check out our latest drop \u2192 link in bio',
  },
  closeFriendsAdder: {
    enabled: false,
    mode: 'add', // 'add' | 'remove'
  },
  growthPlusActive: false,
  filters: {
    followingMin: 100,
    followingMax: 5000,
    followerMin: 200,
    followerMax: 50000,
    mediaMin: 10,
    mediaMax: null,
    accountPrivacy: 'all',
    genderTarget: null,
    excludeNsfw: true,
  },
}
```

- [ ] **Step 2** — Update `src/stores/useGrowthConfig.js`. Find the existing `toggleCloseFriends` action:

```js
  toggleCloseFriends: () => {
    set((state) => ({
      config: { ...state.config, closeFriendsAdder: !state.config.closeFriendsAdder },
    }))
    announceSaved()
  },
```

Replace with (two actions — toggle and setMode):

```js
  toggleCloseFriends: () => {
    set((state) => ({
      config: {
        ...state.config,
        closeFriendsAdder: {
          ...state.config.closeFriendsAdder,
          enabled: !state.config.closeFriendsAdder.enabled,
        },
      },
    }))
    announceSaved()
  },

  setCloseFriendsMode: (mode) => {
    set((state) => ({
      config: {
        ...state.config,
        closeFriendsAdder: { ...state.config.closeFriendsAdder, mode },
      },
    }))
    announceSaved()
  },
```

- [ ] **Step 3** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/mocks/growthConfig.js src/stores/useGrowthConfig.js
git commit -m "feat(growth-v2): closeFriendsAdder shape → {enabled, mode} + store action"
```

---

## Task 2: `ModeCard` — elevated option cards

**Files:**
- Modify: `src/pages/growth/ModeCard.jsx`

- [ ] **Step 1** — Replace `src/pages/growth/ModeCard.jsx`:

```jsx
import { Check, UserMinus, UserPlus, Zap } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

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
    <section className="mt-4">
      <div>
        <h2 className="text-base font-semibold text-text-primary">Mode</h2>
        <p className="mt-1 text-sm text-text-secondary">
          How Kicksta grows your account. You can change this any time.
        </p>
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

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/ModeCard.jsx
git commit -m "feat(growth-v2): mode as 3 elevated option cards with icons + Recommended pill"
```

---

## Task 3: `EngagementCard` — Close Friends segmented sub-control

**Files:**
- Modify: `src/pages/growth/EngagementCard.jsx`

- [ ] **Step 1** — Replace `src/pages/growth/EngagementCard.jsx`:

```jsx
import { Heart, MessageSquare, Star } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import SettingSwitch from '@/components/SettingSwitch'

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
    setWelcomeDmMessage,
    toggleCloseFriends,
    setCloseFriendsMode,
  } = useGrowthConfig()

  const welcomeLocked = isLocked('welcome_dm', mockUser)
  const closeFriendsLocked = isLocked('close_friends', mockUser)

  const showWelcomeEditor = config.welcomeDm.enabled && !welcomeLocked
  const cfEnabled = config.closeFriendsAdder.enabled
  const cfMode = config.closeFriendsAdder.mode
  const showCfMode = cfEnabled && !closeFriendsLocked
  const cfCurrent = CF_MODES.find((m) => m.value === cfMode) ?? CF_MODES[0]

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
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
          {showCfMode && (
            <div className="pb-3">
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
              <p className="mt-2 text-xs text-text-secondary">
                {cfCurrent.description}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function WelcomeDmCounter() {
  const message = useGrowthConfig((s) => s.config.welcomeDm.message)
  return <span>{message.length}/200</span>
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/EngagementCard.jsx
git commit -m "feat(growth-v2): engagement card — close friends add/remove segmented sub-control"
```

---

## Task 4: `PresetRangePills` — tighter pill padding

**Files:**
- Modify: `src/pages/growth/PresetRangePills.jsx`

- [ ] **Step 1** — In the file, find the pill button classes (two buttons — presets + Custom, both use the same pattern `rounded-full px-3 py-1.5 text-xs font-medium`). Replace `py-1.5` with `py-1` in BOTH button class strings.

Use the Edit tool with `replace_all: true` on the exact substring `py-1.5`. Before doing so, read the file to confirm there are only these two occurrences (and no other `py-1.5` in this small file).

Expected result: the preset pills + Custom pill are ~4px shorter vertically, tightening the inline filter rows.

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/PresetRangePills.jsx
git commit -m "refactor(growth-v2): tighter preset-pill vertical padding for inline rows"
```

---

## Task 5: `FiltersCard` — compact inline rows with InfoTooltip

**Files:**
- Modify: `src/pages/growth/FiltersCard.jsx`

- [ ] **Step 1** — Replace `src/pages/growth/FiltersCard.jsx`:

```jsx
import { Info } from 'lucide-react'
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
  { value: 'public', label: 'Public' },
  { value: 'private', label: 'Private' },
]

const GENDER_OPTIONS = [
  { value: null, label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

// Tooltip — icon shown only on lg:+. Mobile has no equivalent (labels
// + control are self-explanatory for this config surface).
function InfoTooltip({ text }) {
  return (
    <span className="group relative hidden lg:inline-block">
      <Info className="h-3.5 w-3.5 text-text-muted" aria-hidden="true" />
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-max max-w-[240px] -translate-x-1/2 rounded-lg bg-text-primary px-2.5 py-1.5 text-[11px] leading-relaxed text-surface opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {text}
      </span>
    </span>
  )
}

function FilterRow({ title, tooltip, locked = false, onLockedTap, children }) {
  return (
    <div
      className={`flex flex-col gap-2 border-b border-border py-3 last:border-b-0 lg:flex-row lg:items-center lg:gap-4 ${
        locked ? 'cursor-pointer' : ''
      }`}
      onClick={locked ? onLockedTap : undefined}
    >
      <div className="flex items-center gap-1.5 lg:w-36 lg:shrink-0">
        <span
          className={`text-sm font-medium ${
            locked ? 'text-text-secondary' : 'text-text-primary'
          }`}
        >
          {title}
        </span>
        {locked && (
          <span className="rounded-full bg-blue-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue-text">
            Advanced
          </span>
        )}
        <InfoTooltip text={tooltip} />
      </div>
      <div className={`min-w-0 flex-1 ${locked ? 'pointer-events-none opacity-60' : ''}`}>
        {children}
      </div>
    </div>
  )
}

function SegmentedPills({ value, options, onChange }) {
  return (
    <div className="inline-flex rounded-full bg-bg p-1">
      {options.map((o) => {
        const selected = value === o.value
        return (
          <button
            key={String(o.value)}
            type="button"
            onClick={() => onChange(o.value)}
            className={`inline-flex h-8 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors ${
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
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <h2 className="text-base font-semibold text-text-primary">Filters</h2>
      <p className="mt-1 text-sm text-text-secondary">
        Target only accounts that match these criteria.
      </p>

      <div className="mt-4 flex flex-col">
        <FilterRow title="Following count" tooltip="People this account follows.">
          <PresetRangePills
            presets={FOLLOWING_PRESETS}
            value={followingRange}
            onChange={(v) => setFilter('followingRange', v)}
          />
        </FilterRow>

        <FilterRow title="Follower count" tooltip="How many followers they have.">
          <PresetRangePills
            presets={FOLLOWER_PRESETS}
            value={followerRange}
            onChange={(v) => setFilter('followerRange', v)}
          />
        </FilterRow>

        <FilterRow title="Media count" tooltip="How many posts they've published.">
          <PresetRangePills
            presets={MEDIA_PRESETS}
            value={mediaRange}
            onChange={(v) => setFilter('mediaRange', v)}
          />
        </FilterRow>

        <FilterRow
          title="Account privacy"
          tooltip="Whether their profile is public or private."
        >
          <SegmentedPills
            value={config.filters.accountPrivacy}
            options={PRIVACY_OPTIONS}
            onChange={(v) => setFilter('accountPrivacy', v)}
          />
        </FilterRow>

        <FilterRow
          title="Gender target"
          tooltip="Narrow targeting by account gender."
          locked={genderLocked}
          onLockedTap={() => onRequestUpgrade('gender_filter')}
        >
          <SegmentedPills
            value={config.filters.genderTarget}
            options={GENDER_OPTIONS}
            onChange={(v) => setFilter('genderTarget', v)}
          />
        </FilterRow>

        <FilterRow
          title="Exclude NSFW"
          tooltip="Skip accounts that appear to contain adult content."
        >
          <div className="flex justify-end lg:justify-start">
            <button
              type="button"
              role="switch"
              aria-checked={config.filters.excludeNsfw}
              onClick={() => toggleExcludeNsfw()}
              className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
                config.filters.excludeNsfw ? 'bg-green-base' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                  config.filters.excludeNsfw ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`}
                aria-hidden="true"
              />
            </button>
          </div>
        </FilterRow>
      </div>
    </section>
  )
}
```

Note: the Exclude NSFW row doesn't use `SettingSwitch` because the description is hidden in the tooltip and the layout is a compact inline row. We inline a small switch here to keep shape consistent with the other FilterRow children.

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/FiltersCard.jsx
git commit -m "feat(growth-v2): filters card as compact inline rows with tooltip + plan-gated gender"
```

---

## Task 6: `ListsCard` — typeahead on add

**Files:**
- Modify: `src/pages/growth/ListsCard.jsx`

- [ ] **Step 1** — Replace `src/pages/growth/ListsCard.jsx`:

```jsx
import { useEffect, useMemo, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import { useToasts } from '@/stores/useToasts'
import { searchTargets } from '@/mocks/targetSearch'
import { formatCount } from '@/utils/formatCount'

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
  const [matches, setMatches] = useState([])
  const [pickedMatch, setPickedMatch] = useState(null)

  const whitelist = useLists((s) => s.whitelist)
  const blacklist = useLists((s) => s.blacklist)
  const addEntry = useLists((s) => s.addEntry)
  const removeEntry = useLists((s) => s.removeEntry)

  const currentTab = TABS.find((t) => t.key === tab)
  const entries = tab === 'whitelist' ? whitelist : blacklist

  const clean = input.replace(/^@/, '').trim()

  // Clear the picked match if the user types something different.
  useEffect(() => {
    if (!pickedMatch) return
    if (pickedMatch.username !== clean.toLowerCase()) {
      setPickedMatch(null)
    }
  }, [clean, pickedMatch])

  // Debounced typeahead search. Only runs with 2+ chars and when not picked.
  useEffect(() => {
    if (!clean || clean.length < 2 || pickedMatch) {
      setMatches([])
      return
    }
    let alive = true
    const id = setTimeout(async () => {
      const results = await searchTargets(clean, 'account')
      if (alive) setMatches(results)
    }, 200)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [clean, pickedMatch])

  const canSubmit = Boolean(pickedMatch)

  const handlePickMatch = (m) => {
    setInput(m.username)
    setPickedMatch(m)
    setMatches([])
  }

  const handleAdd = () => {
    if (!canSubmit) return
    const result = addEntry(tab, pickedMatch.username)
    if (result === 'duplicate') {
      useToasts.getState().addToast({
        message: 'Already in list.',
        tone: 'warning',
      })
      return
    }
    setInput('')
    setPickedMatch(null)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && canSubmit) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
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
                setMatches([])
                setPickedMatch(null)
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

      {/* Quick-add with typeahead */}
      <div className="relative mt-4 flex gap-2">
        <div className="flex h-10 flex-1 items-center overflow-hidden rounded-lg border border-border bg-surface px-3">
          <span className="mr-1 text-text-muted">@</span>
          <input
            type="text"
            value={input.replace(/^@/, '')}
            onChange={(e) => {
              setInput(e.target.value)
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
          disabled={!canSubmit}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Add
        </button>

        {/* Typeahead dropdown */}
        {!pickedMatch && matches.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-[240px] overflow-y-auto rounded-lg border border-border bg-surface shadow-md">
            {matches.map((m) => {
              const letter = m.username.charAt(0).toUpperCase()
              return (
                <button
                  key={m.username}
                  type="button"
                  onClick={() => handlePickMatch(m)}
                  className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-bg"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-xs font-semibold text-text-secondary">
                    {letter}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-text-primary">
                      @{m.username}
                    </div>
                    <div className="truncate text-xs text-text-muted">
                      {formatCount(m.followers)} followers
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}

        {/* No-matches row */}
        {!pickedMatch && clean.length >= 2 && matches.length === 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text-muted shadow-md">
            No matches.
          </div>
        )}
      </div>

      {clean.length >= 2 && !pickedMatch && (
        <p className="mt-1.5 text-xs text-text-secondary">
          Select a result to continue.
        </p>
      )}

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

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/ListsCard.jsx
git commit -m "feat(growth-v2): lists typeahead on add with must-pick rule"
```

---

## Task 7: `GrowthPlusCard` — hero banner

**Files:**
- Modify: `src/pages/growth/GrowthPlusCard.jsx`

- [ ] **Step 1** — Replace `src/pages/growth/GrowthPlusCard.jsx`:

```jsx
import { Link } from 'react-router-dom'
import { ArrowRight, Check, Sparkles } from 'lucide-react'
import { mockUser } from '@/mocks/user'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import SettingSwitch from '@/components/SettingSwitch'

const BENEFITS = [
  'Algorithmic boost from partner accounts',
  'Separate from Targeted Growth metrics',
  'Cancel any time',
]

export default function GrowthPlusCard() {
  const subscribed = mockUser.growthPlusSubscribed === true
  const active = useGrowthConfig((s) => s.config.growthPlusActive)
  const togglePlusActive = useGrowthConfig((s) => s.toggleGrowthPlusActive)

  if (!subscribed) {
    return (
      <section className="mt-4 overflow-hidden rounded-xl border border-purple-base/20 bg-purple-tint/30 p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between lg:gap-8">
          {/* Left zone: headline + subcopy + benefits */}
          <div className="min-w-0 flex-1">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-base/15 text-purple-text">
              <Sparkles className="h-6 w-6" aria-hidden="true" />
            </div>
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-text">
              Growth+
            </p>
            <h2 className="mt-1 text-xl font-semibold leading-tight text-text-primary lg:text-2xl">
              Algorithmic reach, on autopilot.
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-secondary">
              Our network of Kicksta accounts boosts your posts — more eyes,
              faster momentum. Separate billing.
            </p>
            <ul className="mt-4 flex flex-col gap-2">
              {BENEFITS.map((b) => (
                <li key={b} className="flex items-center gap-2 text-sm text-text-primary">
                  <Check className="h-4 w-4 shrink-0 text-purple-text" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>

          {/* Right zone: CTA */}
          <div className="shrink-0">
            <Link
              to="/signup/growth-plus"
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-purple-base px-5 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 lg:w-auto"
            >
              Add Growth+
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
    )
  }

  // Subscriber variant — compact; no upsell.
  return (
    <section className="mt-4 overflow-hidden rounded-xl border border-purple-base/20 bg-purple-tint/30 p-5 lg:p-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-base/15 text-purple-text">
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-text">
                Growth+
              </p>
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
            <p className="mt-0.5 text-sm text-text-primary">
              {active
                ? 'Boosting your posts algorithmically.'
                : 'Paused — resume any time.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <SettingSwitch
            title="Growth+ active"
            checked={active}
            onChange={() => togglePlusActive()}
          />
          <Link
            to="/account"
            className="text-xs text-text-secondary hover:text-text-primary hover:underline"
          >
            Manage subscription
          </Link>
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/GrowthPlusCard.jsx
git commit -m "feat(growth-v2): growth+ hero banner with purple theme + benefits list"
```

---

## Task 8: Page shell — 2-column grid composition

**Files:**
- Modify: `src/pages/growth/index.jsx`

- [ ] **Step 1** — Replace `src/pages/growth/index.jsx`:

```jsx
import { useState } from 'react'
import SafetyStrip from './SafetyStrip'
import ModeCard from './ModeCard'
import EngagementCard from './EngagementCard'
import FiltersCard from './FiltersCard'
import ListsCard from './ListsCard'
import GrowthPlusCard from './GrowthPlusCard'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Growth page v2 layout (Grid A):
// - Safety strip + Mode cards take the full width.
// - Engagement + Lists (narrower) stack in the left grid column; Filters
//   (wider) fills the right column. On mobile, everything collapses to
//   a single column.
// - Growth+ closes the page as a full-width hero banner.
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

      {/* 2-col grid (lg:+) — left: narrower (Engagement + Lists); right:
          Filters. Mobile stacks into a single column via grid-cols-1. */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.45fr)]">
        <div className="flex flex-col gap-4">
          <EngagementCard onRequestUpgrade={openUpgrade} />
          <ListsCard />
        </div>
        <FiltersCard onRequestUpgrade={openUpgrade} />
      </div>

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

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/growth/index.jsx
git commit -m "feat(growth-v2): 2-col grid composition (Mode full → Eng+Lists | Filters → Growth+)"
```

---

## Task 9: Visual verify + docs

**Files:** Any of the above based on visual review; then `CHANGELOG.md` + `CONTEXT.md`.

- [ ] **Step 1** — Controller walks through the preview:
  - Desktop (1280px): full-width Mode cards; Engagement + Lists left column; Filters right column with taller content; Growth+ banner closes the page.
  - Click a Mode card — selection indicator moves; toast fires after 1.5s.
  - Flip Close Friends on → segmented `Add new followers / Remove unfollowers` appears; click each mode; description updates.
  - Welcome DM toggle still shows the textarea + counter.
  - Filters: each row is one line; hover a label (desktop) — info tooltip appears.
  - Lists: type "fit" in the Whitelist quick-add — typeahead dropdown shows matches; click one → input fills + `Add` enables; click `Add` → entry added + toast. Try typing something without picking → `Add` stays disabled, "Select a result" hint shows.
  - Growth+ banner: full-width, purple gradient, Sparkles icon, 3 bullets, purple `Add Growth+ →` button.
  - Mobile (375): everything stacks cleanly.
  - No console errors.

- [ ] **Step 2** — Fix any visual issues surfaced. Commit under `chore(growth-v2): polish pass` if needed.

- [ ] **Step 3** — Update `CHANGELOG.md`. Add above the existing 2026-04-24 `Growth page` entry:

```markdown
---

## 2026-04-24 — Growth page v2 (rework)

### Changed
- **2-column desktop grid.** Mode full-width → Engagement + Lists (narrower left column) beside Filters (wider right column) → Growth+ banner full-width closer. Mobile stacks. Page feels dense and scannable instead of mostly empty
- **Mode card → 3 elevated option cards.** `Zap` / `UserPlus` / `UserMinus` icons, longer descriptions, `Recommended` pill on Auto, `Check` indicator on the selected card. Primary decision on the page now gets the visual weight it deserves
- **Engagement card — Close Friends add/remove mode.** Toggling Close Friends Adder on reveals a segmented `Add new followers · Remove unfollowers` sub-control with a description that updates per mode
- **Filters card — compact inline rows.** Each filter is one line (label left, control right); `Info` tooltips on desktop carry the explainers. `Exclude NSFW` switch inlined alongside the others
- **Lists card — typeahead must-pick.** Typing 2+ chars shows matches from the shared `searchTargets` fixture pool; `Add` disabled until a match is picked, matching the Targeting page's behavior (IG handles must map to real accounts)
- **Growth+ hero banner.** Purple-tint full-width closer with `Sparkles` icon, headline, body copy, 3 benefit bullets (`Check` icons), and a purple `Add Growth+ →` CTA. Subscriber variant stays compact with `Active/Paused` pill + switch + manage link

### Data / store changes
- `mockGrowthConfig.closeFriendsAdder`: `false` → `{ enabled: false, mode: 'add' }`
- `useGrowthConfig.toggleCloseFriends` now flips `.enabled` on the nested shape
- **New** `useGrowthConfig.setCloseFriendsMode(mode)` — `'add'` or `'remove'`

### Files rewritten
- `src/pages/growth/ModeCard.jsx` · `EngagementCard.jsx` · `FiltersCard.jsx` · `ListsCard.jsx` · `GrowthPlusCard.jsx` · `index.jsx`
- `src/pages/growth/PresetRangePills.jsx` (pill padding tightened for inline rows)
- `src/stores/useGrowthConfig.js` · `src/mocks/growthConfig.js`

### Decisions
- **Grid A over symmetric 2-col.** Mode deserves full width; Engagement + Lists are naturally narrow; Filters needs breathing room; Growth+ is a hero
- **Elevated selection cards for Mode** (not segmented pills). Mode is the page's primary decision — bigger options with icon + description land the stakes; `Recommended` pill reduces analysis paralysis for new users
- **Close Friends "pick one mode"** instead of two independent sub-toggles. Matches user intent ("a mode for either X or Y"); one knob is simpler
- **Tooltips on filters** instead of always-visible descriptions. Labels are self-explanatory; descriptions would fight the denser layout. Tooltips are a desktop-only nicety; mobile drops them entirely without losing usability
- **Must-pick typeahead on Lists.** Same rationale as Targeting — handles must map to real IG accounts for the engine to do anything meaningful with them
- **Growth+ stays banner-shaped** (not card-shaped). Matches the Overview's Growth+ banner visual vocabulary; on the Growth page it gets hero-sized with a benefit list because this is where users are already considering Growth+-adjacent configuration

---

## 2026-04-24 — Growth page
```

- [ ] **Step 4** — Update the `CONTEXT.md` update log entry for Growth — append a new line:

```markdown
- **2026-04-24 (growth v2)** — Growth page rework. 2-col desktop grid (Mode full → Engagement+Lists (narrow) | Filters (wide) → Growth+ banner). Mode became 3 elevated option cards with icons + `Recommended` pill on Auto. Engagement got a segmented Add/Remove mode under Close Friends. Filters became compact inline rows with info tooltips on desktop. Lists gained typeahead with must-pick (reuses `searchTargets`). Growth+ became a purple hero banner with benefits list. `closeFriendsAdder` mock shape changed to `{enabled, mode}`.
```

- [ ] **Step 5** — Commit docs:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add CHANGELOG.md CONTEXT.md
git commit -m "docs: log Growth page v2 rework"
```

---

## Spec Coverage

Against `docs/superpowers/specs/2026-04-24-growth-page-v2-design.md`:

- § 1 Page layout (Grid A) → Task 8.
- § 2 Safety strip → unchanged; verified in Task 9.
- § 3 Mode card → Task 2.
- § 4 Engagement card → Tasks 1 (shape) + 3 (component).
- § 5 Filters card → Tasks 4 (PresetRangePills padding) + 5 (FiltersCard).
- § 6 Lists card → Task 6.
- § 7 Growth+ hero banner → Task 7.
- § 8 File-level diff → distributed across all tasks.
- § 9 Out of scope → intentionally not implemented.
- § 10 Success criteria → Task 9 Step 1 walkthrough.
