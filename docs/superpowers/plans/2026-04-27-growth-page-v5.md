# Growth Page v5 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the v5 design pass to the Growth page — drop SafetyStrip, group Filters with icons, split Lists into two cards, add a live activity strip, share Overview's Growth+ banner, and stub a `/account/growth-plus` route.

**Architecture:** Pure presentation pass. Existing settings logic, mocks, and stores are reused. Two new shared concerns: `src/components/GrowthPlusBanner.jsx` (extracted from Overview, used by both pages) and a new `LiveActivityStrip` driven by the existing `useSystemStatus` hook. `useLists` swaps its single `replaceLists` bulk action for two single-list replacers.

**Tech Stack:** React 19, Tailwind 4, Zustand 5, React Router 7, Lucide icons. No unit-test framework — verification is visual via Claude Preview MCP plus structural inspection of files.

**Spec:** `docs/superpowers/specs/2026-04-27-growth-page-v5-design.md`

**Verification convention:** Each task ends with (a) a visual verification step via the Claude Preview MCP at `http://localhost:5173/growth` (or `/` for Overview, `/account/growth-plus` for the stub) and (b) a commit. Hard reload between tasks with `window.location.href = '/growth?bust=' + Date.now()` to bust HMR caching.

---

### Task 1: Extract `GrowthPlusBanner` into a shared component

**Files:**
- Create: `src/components/GrowthPlusBanner.jsx`
- Modify: `src/pages/overview/index.jsx` (remove inline `GrowthPlusBanner` definition around L1349–L1471; replace with an import)

The current inline banner has CTA copy "Upgrade to Growth+" and routes to `/growth`. Both pages now treat Growth+ as an *addition* (per spec), so the CTA becomes "Add Growth+" routing to `/signup/growth-plus`. Subscribers gain a "Manage subscription" text link routing to `/account/growth-plus`.

- [ ] **Step 1: Create the shared banner component**

Write `src/components/GrowthPlusBanner.jsx` with the full body below. This is line-for-line equivalent to today's inline component, but with the CTA copy and route swapped, and a new "Manage subscription" link in the subscriber state.

```jsx
import { Link } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { mockGrowthPlusInsights } from '@/mocks/growthPlus'

// Shared Growth+ marketing banner. Used by both Overview and Growth.
//
// Non-subscriber: gradient surface + Sparkles chip + headline + benefit
// list + "Add Growth+" CTA → /signup/growth-plus.
//
// Subscriber: same surface + "Active" pill + real-numbers headline +
// "Manage subscription" text link → /account/growth-plus. No primary CTA.
export default function GrowthPlusBanner({ isSubscribed }) {
  const ins = mockGrowthPlusInsights

  const headline = isSubscribed
    ? `Growth+ added +${ins.algorithmicBoost} extra followers this month`
    : 'Add Growth+ for extra algorithmic reach'

  const benefits = isSubscribed
    ? [
        `+${ins.algorithmicBoost} from boosted posts`,
        `+${Math.round(ins.postReachLift * 100)}% post reach`,
        `${(ins.engagementRate * 100).toFixed(1)}% engagement rate`,
      ]
    : [
        'Algorithmic post boosting',
        '+34% more reach per post',
        '~3× engagement rate',
      ]

  return (
    <div className="rounded-xl border border-purple-base/20 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 shadow-sm">
      {/* Mobile layout */}
      <div className="flex flex-col gap-2.5 p-4 lg:hidden">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-text text-surface shadow-sm"
          >
            <Sparkles className="h-4 w-4" />
          </span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-text">
            Growth+
          </span>
          {isSubscribed && (
            <span className="rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
              Active
            </span>
          )}
        </div>

        <h2 className="text-base font-semibold leading-snug text-text-primary">
          {headline}
        </h2>

        <p className="text-xs leading-relaxed text-text-secondary">
          {benefits.join(' · ')}
        </p>

        {!isSubscribed && (
          <Link
            to="/signup/growth-plus"
            className="mt-1 inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-purple-base px-6 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Add Growth+
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        {isSubscribed && (
          <Link
            to="/account/growth-plus"
            className="mt-1 inline-flex items-center text-xs font-medium text-purple-text hover:underline"
          >
            Manage subscription
          </Link>
        )}
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex lg:items-center lg:gap-5 lg:p-5">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <span
            aria-hidden
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-purple-text text-surface shadow-sm"
          >
            <Sparkles className="h-5 w-5" />
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-text">
                Growth+
              </span>
              {isSubscribed && (
                <span className="rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
                  Active
                </span>
              )}
            </div>
            <h2 className="mt-0.5 text-base font-semibold leading-snug text-text-primary">
              {headline}
            </h2>
            <p className="mt-0.5 text-sm leading-relaxed text-text-secondary">
              {benefits.join(' · ')}
            </p>
          </div>
        </div>

        {!isSubscribed && (
          <Link
            to="/signup/growth-plus"
            className="inline-flex h-10 shrink-0 items-center justify-center gap-1.5 rounded-lg bg-purple-base px-5 text-sm font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
          >
            Add Growth+
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        {isSubscribed && (
          <Link
            to="/account/growth-plus"
            className="shrink-0 text-sm font-medium text-purple-text hover:underline"
          >
            Manage subscription
          </Link>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Replace inline `GrowthPlusBanner` in Overview with an import**

In `src/pages/overview/index.jsx`:
1. Add `import GrowthPlusBanner from '@/components/GrowthPlusBanner'` near the other component-level imports.
2. Delete the inline `function GrowthPlusBanner(...) { ... }` block (currently L1349–L1471 — find by searching for `function GrowthPlusBanner`).
3. Remove `Sparkles` and `ArrowRight` from the lucide-react import block ONLY if no other code in the file uses them. Search the file with `grep -n "Sparkles\|ArrowRight" src/pages/overview/index.jsx` first; if other usages exist, keep the imports.

The render site (around L1884: `<GrowthPlusBanner isSubscribed={user.growthPlusSubscribed} />`) is unchanged — the prop signature is preserved.

- [ ] **Step 3: Visual verify Overview still renders correctly**

Reload `/` in the preview. Banner renders with:
- New CTA copy "Add Growth+" (non-subscriber) — confirm by reading text.
- Banner clicks now route to `/signup/growth-plus` (do not click — just confirm via DOM inspection).

If `mockUser.growthPlusSubscribed === false` (the default), the subscriber state is not visible here. We'll exercise it during Task 11.

- [ ] **Step 4: Commit**

```bash
git add src/components/GrowthPlusBanner.jsx src/pages/overview/index.jsx
git commit -m "refactor: extract GrowthPlusBanner to shared component, retarget Add CTA"
```

---

### Task 2: Stub `/account/growth-plus` route

**Files:**
- Create: `src/pages/accountGrowthPlus/index.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create the stub page**

Write `src/pages/accountGrowthPlus/index.jsx`:

```jsx
// Stub page for the "Manage subscription" link on the Growth+ banner.
// Real management UI (pause/resume billing, plan switch, cancel) is a
// future spec — this exists so the link doesn't dead-end.
export default function AccountGrowthPlusPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      <header>
        <h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">
          Growth+ subscription
        </h1>
        <p className="mt-1 text-sm text-text-secondary">
          Manage your Growth+ subscription.
        </p>
      </header>

      <section className="mt-6 rounded-xl border border-border bg-surface p-6 text-sm text-text-secondary lg:p-8">
        Subscription management is coming soon. Reach out to support if you need to make changes today.
      </section>
    </div>
  )
}
```

- [ ] **Step 2: Wire the route in `App.jsx`**

In `src/App.jsx`, add the import alongside the others:

```jsx
import AccountGrowthPlusPage from '@/pages/accountGrowthPlus'
```

Then add the route inside the `DashboardLayout` block, right after the `/account` route:

```jsx
<Route path="/account/growth-plus" element={<AccountGrowthPlusPage />} />
```

- [ ] **Step 3: Visual verify the stub renders**

Navigate the preview to `/account/growth-plus`. Confirm: page title "Growth+ subscription" + sub-line + the "Subscription management is coming soon..." card render inside the dashboard shell (sidebar nav still visible).

- [ ] **Step 4: Commit**

```bash
git add src/pages/accountGrowthPlus/index.jsx src/App.jsx
git commit -m "feat: stub /account/growth-plus route"
```

---

### Task 3: Drop `SafetyStrip`, fold safety copy into `ModeCard`

**Files:**
- Delete: `src/pages/growth/SafetyStrip.jsx`
- Modify: `src/pages/growth/index.jsx`
- Modify: `src/pages/growth/ModeCard.jsx`

- [ ] **Step 1: Delete `SafetyStrip.jsx`**

```bash
rm "src/pages/growth/SafetyStrip.jsx"
```

- [ ] **Step 2: Remove the SafetyStrip render from `index.jsx`**

In `src/pages/growth/index.jsx`:
1. Delete `import SafetyStrip from './SafetyStrip'`.
2. Delete the `<SafetyStrip />` render line.

- [ ] **Step 3: Add the inline safety footer to `ModeCard`**

In `src/pages/growth/ModeCard.jsx`:

Add `Shield` to the lucide-react imports:
```jsx
import { Check, Shield, UserMinus, UserPlus, Zap } from 'lucide-react'
```

Add this block immediately after the closing `</div>` of the modes grid (the `<div className="mt-4 grid gap-3 lg:grid-cols-3">…</div>`) and before the closing `</section>`:

```jsx
<div className="mt-4 flex items-center gap-2 text-xs text-text-muted">
  <Shield className="h-4 w-4 shrink-0" aria-hidden="true" />
  <span>Kicksta stays within Instagram's safe daily limits.</span>
</div>
```

- [ ] **Step 4: Visual verify**

Reload `/growth`. Confirm:
- The blue tint safety strip is gone from above the Mode card.
- Page now opens with the page title + sub, then the Mode card.
- Inside the Mode card, below the 3 mode options, a small Shield icon + muted "Kicksta stays within Instagram's safe daily limits." line is visible.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor(growth): drop SafetyStrip, inline safety copy in ModeCard"
```

---

### Task 4: Group Filters with icons + sub-headers

**Files:**
- Modify: `src/pages/growth/FiltersCard.jsx`

- [ ] **Step 1: Replace `FiltersCard.jsx` with the grouped version**

Overwrite `src/pages/growth/FiltersCard.jsx` with the body below. The helpers (`rangeFor`, `privacyLabel`, `genderLabel`) and the Edit button + section header behavior are unchanged. The flat row list is replaced with two labelled groups, each row gains an icon prefix.

```jsx
import { Image, Lock, Pencil, ShieldOff, User, UserPlus, Users } from 'lucide-react'
import { useGrowthConfig } from '@/stores/useGrowthConfig'
import { mockUser } from '@/mocks/user'
import { formatCount } from '@/utils/formatCount'

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

function Row({ icon: Icon, label, value, locked = false }) {
  return (
    <div className="flex items-center justify-between gap-4 py-2.5">
      <div className="flex min-w-0 items-center gap-3">
        <Icon className="h-4 w-4 shrink-0 text-text-secondary" aria-hidden="true" />
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
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-text-primary">Filters</h2>
          <p className="mt-1 text-sm text-text-secondary">Who Kicksta targets.</p>
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
            icon={Users}
            label="Following count"
            value={rangeFor(filters.followingMin, filters.followingMax, 'following')}
          />
          <Row
            icon={UserPlus}
            label="Follower count"
            value={rangeFor(filters.followerMin, filters.followerMax, 'followers')}
          />
          <Row
            icon={Image}
            label="Media count"
            value={rangeFor(filters.mediaMin, filters.mediaMax, 'posts')}
          />
        </div>
      </div>

      <div className="mt-4">
        <GroupHeader>Account type</GroupHeader>
        <div className="mt-1 flex flex-col divide-y divide-border">
          <Row
            icon={Lock}
            label="Account privacy"
            value={privacyLabel(filters.accountPrivacy)}
          />
          <Row
            icon={User}
            label="Gender target"
            value={genderLabel(filters.genderTarget)}
            locked={genderLocked}
          />
          <Row
            icon={ShieldOff}
            label="Exclude NSFW"
            value={filters.excludeNsfw ? 'On' : 'Off'}
          />
        </div>
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Visual verify**

Reload `/growth`. In the Filters card:
- Two sub-headers visible: "AUDIENCE SIZE" and "ACCOUNT TYPE" (uppercase, muted).
- Each row has a small icon on the left.
- Rows still right-align their values; Edit button still in the top-right.
- Click Edit → `FiltersModal` still opens unchanged.

- [ ] **Step 3: Commit**

```bash
git add src/pages/growth/FiltersCard.jsx
git commit -m "refactor(growth): group Filters into Audience/Account sections with icons"
```

---

### Task 5: Replace `replaceLists` with single-list replacers in `useLists`

**Files:**
- Modify: `src/stores/useLists.js`

The bulk `replaceLists(white, black)` action is only used by `ListsModal.jsx` (which is being deleted in a later task). We swap it for two single-list actions.

- [ ] **Step 1: Update the store**

In `src/stores/useLists.js`, replace the `replaceLists` action with:

```js
  // Bulk replace one list — used by Whitelist/Blacklist modal Save.
  replaceWhitelist: (whitelist) => {
    set({ whitelist })
    announceSaved()
  },

  replaceBlacklist: (blacklist) => {
    set({ blacklist })
    announceSaved()
  },
```

Remove the old `replaceLists` action entirely.

- [ ] **Step 2: Visual verify nothing breaks immediately**

Reload `/growth`. The page still renders. (`ListsCard` still uses `whitelist`/`blacklist` selectors, which are untouched. `ListsModal` still calls the now-missing `replaceLists` — that file is deleted in Task 7 before being opened.) Do **not** click Edit on the Lists card during this interim step.

- [ ] **Step 3: Commit**

```bash
git add src/stores/useLists.js
git commit -m "refactor(useLists): split replaceLists into per-list replacers"
```

---

### Task 6: Create `WhitelistCard` + `WhitelistModal`

**Files:**
- Create: `src/pages/growth/WhitelistCard.jsx`
- Create: `src/pages/growth/WhitelistModal.jsx`

`WhitelistModal` is a single-list editor adapted from `ListsModal.jsx` — same typeahead, animation pattern, draft + Save/Cancel — but without the tab switcher. The card uses a `ShieldCheck` icon in `text-green-text` next to the title (chosen accent treatment per the spec's "decide one" flag).

- [ ] **Step 1: Create `WhitelistCard.jsx`**

```jsx
import { Pencil, ShieldCheck } from 'lucide-react'
import { useLists } from '@/stores/useLists'

export default function WhitelistCard({ onEdit }) {
  const whitelist = useLists((s) => s.whitelist)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 shrink-0 text-green-text" aria-hidden="true" />
            <h2 className="text-base font-semibold text-text-primary">Whitelist</h2>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Accounts Kicksta will never unfollow.
          </p>
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
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
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
    </section>
  )
}
```

- [ ] **Step 2: Create `WhitelistModal.jsx`**

This is a single-list adaptation of `ListsModal.jsx` with the tab switcher removed and the save action wired to `replaceWhitelist`. Write `src/pages/growth/WhitelistModal.jsx`:

```jsx
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import { useToasts } from '@/stores/useToasts'
import { searchTargets } from '@/mocks/targetSearch'
import { formatCount } from '@/utils/formatCount'

const newId = () => `w_${Math.random().toString(36).slice(2, 8)}`

export default function WhitelistModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [matches, setMatches] = useState([])
  const [pickedMatch, setPickedMatch] = useState(null)

  const stored = useLists((s) => s.whitelist)
  const replaceWhitelist = useLists((s) => s.replaceWhitelist)

  const [draft, setDraft] = useState(stored)

  const clean = input.replace(/^@/, '').trim()

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setInput('')
    setMatches([])
    setPickedMatch(null)
    setDraft(stored)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, stored])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!pickedMatch) return
    if (pickedMatch.username !== clean.toLowerCase()) {
      setPickedMatch(null)
    }
  }, [clean, pickedMatch])

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

  if (!open) return null

  const canAdd = Boolean(pickedMatch)

  const handlePickMatch = (m) => {
    setInput(m.username)
    setPickedMatch(m)
    setMatches([])
  }

  const handleAdd = () => {
    if (!canAdd) return
    const username = `@${pickedMatch.username.toLowerCase()}`
    const duplicate = draft.some((e) => e.username.toLowerCase() === username)
    if (duplicate) {
      useToasts.getState().addToast({ message: 'Already in list.', tone: 'warning' })
      return
    }
    setDraft((prev) => [
      ...prev,
      { id: newId(), username, addedAt: new Date().toISOString() },
    ])
    setInput('')
    setPickedMatch(null)
  }

  const handleRemove = (id) => {
    setDraft((prev) => prev.filter((e) => e.id !== id))
  }

  const handleSave = () => {
    replaceWhitelist(draft)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && canAdd) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit whitelist"
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
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">Edit whitelist</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs text-text-secondary">
            Accounts here will never be unfollowed.
          </p>

          <div className="relative mt-4 flex gap-2">
            <div className="flex h-10 flex-1 items-center overflow-hidden rounded-lg border border-border bg-surface px-3">
              <span className="mr-1 text-text-muted">@</span>
              <input
                type="text"
                value={input.replace(/^@/, '')}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="username"
                autoComplete="off"
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>

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

          <div className="mt-4 flex flex-col divide-y divide-border">
            {draft.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">
                No accounts whitelisted yet.
              </p>
            )}
            {draft.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <span className="text-sm text-text-primary">{e.username}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(e.id)}
                  aria-label={`Remove ${e.username}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-red-text"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
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

- [ ] **Step 3: Visual verify (defer until Task 8 wires the page)**

Skip immediate verification — these files are not yet rendered. They are wired in Task 8.

- [ ] **Step 4: Commit**

```bash
git add src/pages/growth/WhitelistCard.jsx src/pages/growth/WhitelistModal.jsx
git commit -m "feat(growth): add WhitelistCard and WhitelistModal"
```

---

### Task 7: Create `BlacklistCard` + `BlacklistModal`

**Files:**
- Create: `src/pages/growth/BlacklistCard.jsx`
- Create: `src/pages/growth/BlacklistModal.jsx`

The Blacklist card uses a neutral `Ban` icon in `text-text-muted`. The modal is structurally identical to `WhitelistModal.jsx` but writes to `replaceBlacklist`.

- [ ] **Step 1: Create `BlacklistCard.jsx`**

```jsx
import { Ban, Pencil } from 'lucide-react'
import { useLists } from '@/stores/useLists'

export default function BlacklistCard({ onEdit }) {
  const blacklist = useLists((s) => s.blacklist)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 lg:p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Ban className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
            <h2 className="text-base font-semibold text-text-primary">Blacklist</h2>
          </div>
          <p className="mt-1 text-sm text-text-secondary">
            Accounts Kicksta will never follow.
          </p>
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
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
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
    </section>
  )
}
```

- [ ] **Step 2: Create `BlacklistModal.jsx`**

Write `src/pages/growth/BlacklistModal.jsx`. This is the same code as `WhitelistModal.jsx` from Task 6 with these substitutions:

- `newId` prefix `w_` → `b_`
- `useLists((s) => s.whitelist)` → `useLists((s) => s.blacklist)`
- `useLists((s) => s.replaceWhitelist)` → `useLists((s) => s.replaceBlacklist)`
- `aria-label="Edit whitelist"` → `aria-label="Edit blacklist"`
- Header `Edit whitelist` → `Edit blacklist`
- Sub copy `Accounts here will never be unfollowed.` → `Accounts here will never be followed.`
- Empty-state copy `No accounts whitelisted yet.` → `No accounts blacklisted yet.`

Full file (paste this verbatim — no diffing required):

```jsx
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useLists } from '@/stores/useLists'
import { useToasts } from '@/stores/useToasts'
import { searchTargets } from '@/mocks/targetSearch'
import { formatCount } from '@/utils/formatCount'

const newId = () => `b_${Math.random().toString(36).slice(2, 8)}`

export default function BlacklistModal({ open, onClose }) {
  const [mounted, setMounted] = useState(false)
  const [input, setInput] = useState('')
  const [matches, setMatches] = useState([])
  const [pickedMatch, setPickedMatch] = useState(null)

  const stored = useLists((s) => s.blacklist)
  const replaceBlacklist = useLists((s) => s.replaceBlacklist)

  const [draft, setDraft] = useState(stored)

  const clean = input.replace(/^@/, '').trim()

  useEffect(() => {
    if (!open) return
    setMounted(false)
    setInput('')
    setMatches([])
    setPickedMatch(null)
    setDraft(stored)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setMounted(true))
    })
  }, [open, stored])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    if (!pickedMatch) return
    if (pickedMatch.username !== clean.toLowerCase()) {
      setPickedMatch(null)
    }
  }, [clean, pickedMatch])

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

  if (!open) return null

  const canAdd = Boolean(pickedMatch)

  const handlePickMatch = (m) => {
    setInput(m.username)
    setPickedMatch(m)
    setMatches([])
  }

  const handleAdd = () => {
    if (!canAdd) return
    const username = `@${pickedMatch.username.toLowerCase()}`
    const duplicate = draft.some((e) => e.username.toLowerCase() === username)
    if (duplicate) {
      useToasts.getState().addToast({ message: 'Already in list.', tone: 'warning' })
      return
    }
    setDraft((prev) => [
      ...prev,
      { id: newId(), username, addedAt: new Date().toISOString() },
    ])
    setInput('')
    setPickedMatch(null)
  }

  const handleRemove = (id) => {
    setDraft((prev) => prev.filter((e) => e.id !== id))
  }

  const handleSave = () => {
    replaceBlacklist(draft)
    onClose()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && canAdd) {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit blacklist"
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
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-base font-semibold text-text-primary">Edit blacklist</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-text-primary"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <p className="text-xs text-text-secondary">
            Accounts here will never be followed.
          </p>

          <div className="relative mt-4 flex gap-2">
            <div className="flex h-10 flex-1 items-center overflow-hidden rounded-lg border border-border bg-surface px-3">
              <span className="mr-1 text-text-muted">@</span>
              <input
                type="text"
                value={input.replace(/^@/, '')}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="username"
                autoComplete="off"
                className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
              />
            </div>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-blue-base px-4 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>

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

          <div className="mt-4 flex flex-col divide-y divide-border">
            {draft.length === 0 && (
              <p className="py-4 text-center text-sm text-text-muted">
                No accounts blacklisted yet.
              </p>
            )}
            {draft.map((e) => (
              <div key={e.id} className="flex items-center justify-between py-3">
                <span className="text-sm text-text-primary">{e.username}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(e.id)}
                  aria-label={`Remove ${e.username}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary hover:bg-bg hover:text-red-text"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ))}
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

- [ ] **Step 3: Commit**

```bash
git add src/pages/growth/BlacklistCard.jsx src/pages/growth/BlacklistModal.jsx
git commit -m "feat(growth): add BlacklistCard and BlacklistModal"
```

---

### Task 8: Create `LiveActivityStrip`

**Files:**
- Create: `src/pages/growth/LiveActivityStrip.jsx`

Driven by `useSystemStatus`. Hides itself entirely on `setup`. Same icon + color rules used elsewhere on the dashboard. Shows a `next-action` hint on the right at `lg:` breakpoints only.

- [ ] **Step 1: Create the component**

```jsx
import { Clock, Flame, Pause, Search, Settings, UserMinus, UserPlus } from 'lucide-react'
import { useSystemStatus } from '@/hooks/useSystemStatus'

const PHASE_META = {
  analyzing: {
    Icon: Search,
    color: 'text-blue-text',
    pulse: true,
    copy: () => 'Currently searching for targets',
  },
  following: {
    Icon: UserPlus,
    color: 'text-green-text',
    pulse: true,
    copy: (h) => `Currently following ${h ?? 'a target'}`,
  },
  unfollowing: {
    Icon: UserMinus,
    color: 'text-blue-text',
    pulse: true,
    copy: (h) => `Currently unfollowing ${h ?? 'a target'}`,
  },
  waiting: {
    Icon: Clock,
    color: 'text-blue-text',
    pulse: true,
    copy: () => 'Pausing between actions',
  },
  warming_up: {
    Icon: Flame,
    color: 'text-blue-text',
    pulse: false,
    copy: () => 'Warming up — growth starts within 72 hours',
  },
  paused: {
    Icon: Pause,
    color: 'text-text-muted',
    pulse: false,
    copy: () => 'Paused',
  },
  setup: {
    Icon: Settings,
    color: 'text-yellow-text',
    pulse: false,
    copy: () => 'Setup needed — add your first target to start',
  },
}

export default function LiveActivityStrip() {
  const { phase, targetHandle, nextActionLabel } = useSystemStatus()

  // Hide entirely in setup — strip would have nothing useful to say.
  if (phase === 'setup') return null

  const meta = PHASE_META[phase] ?? PHASE_META.waiting
  const { Icon, color, pulse } = meta

  return (
    <section
      className={`mt-4 flex items-center justify-between gap-4 rounded-xl border border-border bg-surface px-4 py-3 lg:px-5 lg:py-4 ${
        pulse ? 'animate-pulse' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon className={`h-4 w-4 shrink-0 ${color}`} aria-hidden="true" />
        <span className="truncate text-sm text-text-primary">
          {meta.copy(targetHandle)}
        </span>
      </div>
      {nextActionLabel && (
        <span className="hidden shrink-0 text-xs text-text-muted lg:inline">
          {nextActionLabel}
        </span>
      )}
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/growth/LiveActivityStrip.jsx
git commit -m "feat(growth): add LiveActivityStrip driven by useSystemStatus"
```

---

### Task 9: Wire the new layout in `index.jsx` + delete obsolete files

**Files:**
- Modify: `src/pages/growth/index.jsx`
- Delete: `src/pages/growth/ListsCard.jsx`
- Delete: `src/pages/growth/ListsModal.jsx`
- Delete: `src/pages/growth/GrowthPlusCard.jsx`

- [ ] **Step 1: Replace `index.jsx` with the v5 layout**

Overwrite `src/pages/growth/index.jsx` with:

```jsx
import { useState } from 'react'
import { mockUser } from '@/mocks/user'
import ModeCard from './ModeCard'
import EngagementCard from './EngagementCard'
import FiltersCard from './FiltersCard'
import FiltersModal from './FiltersModal'
import WhitelistCard from './WhitelistCard'
import WhitelistModal from './WhitelistModal'
import BlacklistCard from './BlacklistCard'
import BlacklistModal from './BlacklistModal'
import LiveActivityStrip from './LiveActivityStrip'
import GrowthPlusBanner from '@/components/GrowthPlusBanner'
import UpgradeBottomSheet from '@/components/UpgradeBottomSheet'

// Growth page v5 layout:
// - Mode card opens the page (safety copy lives inline at the bottom of it).
// - 2x2 grid: Engagement → Filters on the left, Whitelist → Blacklist on the right.
// - LiveActivityStrip below the grid — proof your config is running.
// - Shared GrowthPlusBanner closes the page (same component as Overview).
export default function GrowthPage() {
  const [upgradeFeature, setUpgradeFeature] = useState(null)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [whitelistOpen, setWhitelistOpen] = useState(false)
  const [blacklistOpen, setBlacklistOpen] = useState(false)

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

      <ModeCard />

      {/* 2x2 grid — Engagement → Filters on left, Whitelist → Blacklist on right.
          Each column is its own flex-col so the cards stack independently. */}
      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-4">
          <EngagementCard onRequestUpgrade={openUpgrade} />
          <FiltersCard onEdit={() => setFiltersOpen(true)} />
        </div>
        <div className="flex flex-col gap-4">
          <WhitelistCard onEdit={() => setWhitelistOpen(true)} />
          <BlacklistCard onEdit={() => setBlacklistOpen(true)} />
        </div>
      </div>

      <LiveActivityStrip />

      <div className="mt-4">
        <GrowthPlusBanner isSubscribed={mockUser.growthPlusSubscribed} />
      </div>

      <FiltersModal
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        onRequestUpgrade={openUpgrade}
      />
      <WhitelistModal open={whitelistOpen} onClose={() => setWhitelistOpen(false)} />
      <BlacklistModal open={blacklistOpen} onClose={() => setBlacklistOpen(false)} />
      <UpgradeBottomSheet
        open={upgradeFeature !== null}
        onClose={closeUpgrade}
        feature={upgradeFeature ?? 'welcome_dm'}
      />
    </div>
  )
}
```

- [ ] **Step 2: Delete the obsolete files**

```bash
rm "src/pages/growth/ListsCard.jsx"
rm "src/pages/growth/ListsModal.jsx"
rm "src/pages/growth/GrowthPlusCard.jsx"
```

- [ ] **Step 3: Visual verify the new layout (desktop)**

Reload `/growth` at desktop viewport (1280×900). Confirm:
- Page opens with title + sub, then Mode card.
- Below Mode: a two-column grid. Left column = Engagement card on top, Filters card below. Right column = Whitelist card on top, Blacklist card below.
- Below the grid: a single live activity strip.
- Below that: the purple gradient Growth+ banner (matches Overview).
- No SafetyStrip blue bar above Mode.
- Whitelist card shows the green `ShieldCheck` icon next to the title.
- Blacklist card shows the muted `Ban` icon next to the title.

- [ ] **Step 4: Visual verify the new layout (mobile)**

Resize the preview to 375×812. Confirm cards stack in this order from the top: Mode → Engagement → Filters → Whitelist → Blacklist → LiveActivityStrip → Growth+ banner.

- [ ] **Step 5: Visual verify edit flows**

In the preview at desktop:
1. Click Edit on the Whitelist card → modal opens, header reads "Edit whitelist", existing entries are listed in the body.
2. Close it (overlay click).
3. Click Edit on the Blacklist card → modal opens, header reads "Edit blacklist".
4. Close it.
5. Click Edit on the Filters card → existing `FiltersModal` still opens unchanged.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(growth): wire v5 page layout (2x2 grid, live strip, shared banner)"
```

---

### Task 10: Final cross-page sanity check + CHANGELOG

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `CONTEXT.md` (update Growth section)

- [ ] **Step 1: Visual cross-check Overview**

Reload `/`. Confirm the Growth+ banner near the bottom looks identical to the one on `/growth`. CTA on Overview says "Add Growth+" routing to `/signup/growth-plus`.

- [ ] **Step 2: Visual cross-check `/account/growth-plus`**

Navigate to `/account/growth-plus`. Stub page renders inside the dashboard shell.

- [ ] **Step 3: Append a CHANGELOG entry**

Add at the top of `CHANGELOG.md`, under today's date heading (`## 2026-04-27` — create the section if missing):

```markdown
## 2026-04-27

### Changed
- **Growth page v5** — visual cohesion + readability pass:
  - Removed SafetyStrip; safety copy folded into Mode card footer.
  - Filters card grouped under "Audience size" / "Account type" with per-row icons.
  - Lists split into separate Whitelist (green ShieldCheck) and Blacklist (neutral Ban) cards, each with its own Edit modal.
  - Layout reorganised to a 2x2 grid (Engagement → Filters · Whitelist → Blacklist).
  - New LiveActivityStrip above Growth+ banner — proof your config is running.
  - Shared `GrowthPlusBanner` extracted from Overview; CTA copy now "Add Growth+" → `/signup/growth-plus`; subscriber state adds "Manage subscription" link.
  - `useLists.replaceLists` split into `replaceWhitelist` + `replaceBlacklist`.

### Created
- Stub page `/account/growth-plus` so the Manage subscription link has a real destination.
```

- [ ] **Step 4: Update CONTEXT.md Growth section**

In `CONTEXT.md`, replace the existing `### Growth (...) — v4` section with the equivalent v5 description:

```markdown
### Growth (`/growth`, `src/pages/growth/`) — v5

Settings dashboard, tightened for visual cohesion. Direct controls for Mode + Engagement (auto-save with 1.5s debounced toast); read-only display + Edit modal for Filters + Whitelist + Blacklist. Shared Growth+ banner with Overview.

**Layout (desktop):**
```
Mode card (3 elevated options + inline safety footer)
┌── Engagement (left) ──┬── Whitelist (right, ShieldCheck green) ──┐
│ Filters (left, grouped)│  Blacklist (right, Ban neutral)          │
└────────────────────────┴───────────────────────────────────────────┘
LiveActivityStrip (settings-in-action, useSystemStatus)
GrowthPlusBanner (shared with Overview)
```

**File layout:**
```
src/pages/growth/
  index.jsx              page shell + modal state
  ModeCard.jsx           3 elevated mode cards + Shield safety footer
  EngagementCard.jsx     3 SettingSwitch rows with Heart/MessageSquare/Star icons
  WelcomeDmModal.jsx     unchanged from v4
  FiltersCard.jsx        grouped sub-headers (Audience size / Account type) + icon-prefixed rows + Edit
  FiltersModal.jsx       unchanged from v4
  PresetRangePills.jsx   unchanged from v4
  WhitelistCard.jsx      ShieldCheck title icon + entries + Edit
  WhitelistModal.jsx     single-list editor with draft + Save/Cancel
  BlacklistCard.jsx      Ban title icon + entries + Edit
  BlacklistModal.jsx     single-list editor with draft + Save/Cancel
  LiveActivityStrip.jsx  phase icon + status copy + (lg) next-action hint
src/components/GrowthPlusBanner.jsx  shared with Overview
src/pages/accountGrowthPlus/index.jsx  stub for /account/growth-plus
src/stores/useLists.js  replaceWhitelist + replaceBlacklist (replaces replaceLists)
```

**Spec/plan:** v5 → `docs/superpowers/specs/2026-04-27-growth-page-v5-design.md` + `plans/2026-04-27-growth-page-v5.md`.
```

Also append to the Update log at the bottom:

```markdown
- **2026-04-27 (growth v5)** — Visual cohesion pass: dropped SafetyStrip, grouped Filters with icons, split Lists into Whitelist + Blacklist cards, added LiveActivityStrip, extracted shared GrowthPlusBanner with new "Add Growth+" CTA, stubbed `/account/growth-plus`, split `replaceLists` into per-list replacers.
```

- [ ] **Step 5: Commit**

```bash
git add CHANGELOG.md CONTEXT.md
git commit -m "docs: log Growth v5 changes in CHANGELOG and CONTEXT"
```

---

## Self-review notes

Spec coverage: every numbered acceptance criterion from the spec maps to a task — drop SafetyStrip (Task 3), grouped Filters with icons (Task 4), split Lists with own Edit (Tasks 5–7, 9), Engagement icons (already in current code, preserved), live strip above banner (Tasks 8–9), shared banner with new copy + manage link (Tasks 1, 9), stub route (Task 2), no metric tiles (verified by absence in Task 9 layout).

Type consistency: `replaceWhitelist(list)` and `replaceBlacklist(list)` are the only new store action names and are referenced consistently across Tasks 5, 6, 7. No `replaceLists` references remain after Task 5.

No-placeholder check: every code-bearing step contains the full file body or the exact substitution list. The single "decide one" flag from the spec (Whitelist accent treatment) is resolved in Task 6 to `ShieldCheck` icon — implementation does not ship both.
