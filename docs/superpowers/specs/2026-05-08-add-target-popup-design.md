# Add Target Popup Redesign — Design Spec

**Date:** 2026-05-08
**Goal:** Restructure the Add Target popup so it stops devouring vertical space, removes the dual `@`/`#` signal in the input row, locks selected sources into an unambiguous pill state, and warns the user before they target a private or verified account.

**Architecture:** Single-file refactor of `src/pages/targeting/AddTargetSheet.jsx` plus mock-data additions for `private` / `verified` flags. No new components — all changes are inline restructuring. Existing state machine (`type`, `input`, `pickedMatch`, `matches`, `resolving`) and helper handlers (`handlePickMatch`, `handlePickSuggestion`, `handleSubmit`, `handleResumeDuplicate`) carry over unchanged where possible; only render branches and a few className strings change.

**Tech stack:** React, Tailwind, Lucide. Pravatar (already locked in polish-pass spec) for any new mock avatars.

**Source brainstorm:** 2026-05-08 — items #4, #5, #6, #7 from the original 18-item batch.

---

## Item 1 — Suggestions become a horizontal scroller

**Why:** Today's 2-col grid of avatar + handle + count card-buttons takes ~half the popup on mobile. The user sees the input + maybe 2 suggestions before scrolling. A horizontal scroller fits ~3–4 chips on mobile, ~5–6 on desktop, in a single row that takes a fraction of the vertical space.

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx` — Suggestions render block (currently lines 348–394 inside the JSX).

**Replace** the entire `<div className="mt-6">` Suggestions block (the eyebrow + 2-col grid wrapper). New structure:

```jsx
<div className="mt-6">
  <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
    Suggestions
  </p>
  <div
    className="-mx-4 mt-2 flex snap-x snap-proximity gap-2 overflow-x-auto scroll-px-4 px-4 [&::-webkit-scrollbar]:hidden"
    style={{ scrollbarWidth: 'none' }}
  >
    {suggestions.map((s) => {
      const isHashtag = type === 'hashtag'
      const label = isHashtag ? `#${s.hashtag}` : `@${s.username}`
      const subline = isHashtag
        ? `${formatCount(s.posts)} posts`
        : `${formatCount(s.followers)} followers`
      const letter = (isHashtag ? s.hashtag : s.username)
        .charAt(0)
        .toUpperCase()
      return (
        <button
          key={label}
          type="button"
          onClick={() => handlePickSuggestion(s)}
          className="flex w-[88px] shrink-0 snap-start flex-col items-center gap-1.5 rounded-lg border border-border bg-surface p-2 text-center transition-colors hover:border-border-strong hover:bg-bg"
        >
          <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-bg text-xs font-semibold text-text-secondary ring-1 ring-border">
            {isHashtag ? (
              <Hash className="h-4 w-4" aria-hidden="true" />
            ) : s.profilePic ? (
              <img
                src={s.profilePic}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              letter
            )}
          </span>
          <span className="w-full truncate text-xs font-medium text-text-primary">
            {label}
          </span>
          <span className="w-full truncate text-[11px] text-text-muted">
            {subline}
          </span>
        </button>
      )
    })}
  </div>
</div>
```

**Why the negative-margin trick (`-mx-4 px-4`):** the scroller's edge fades out at the popup edge instead of starting flush with the input. The body's `px-4 py-4` clips visible content; the inner `-mx-4` lets the scroll list extend full-width while inner `px-4` keeps each chip from sitting flush.

**Snap behavior:** `snap-x snap-proximity` with `snap-start` on each chip — swipes settle on chip boundaries without being rigid (proximity, not mandatory).

**Scrollbar:** hidden via `[&::-webkit-scrollbar]:hidden` (WebKit) + `scrollbarWidth: 'none'` inline style (Firefox).

**Acceptance:** Suggestions render as a single horizontal row that scrolls when overflowing; chips are 88px wide; ~3–4 visible at mobile (375), ~5–6 visible at md+ widths. Tapping a chip behaves identically to today (calls `handlePickSuggestion`).

---

## Item 2 — Switcher moves left, drop the input prefix

**Why:** Today the input row reads `[@/# prefix span][input][switcher icon-toggle]`. The prefix span and the switcher icon both signal type — duplication. Moving the switcher to the **left** of the input lets it serve as the prefix; the inline `@`/`#` prefix span goes away.

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx` — Input row JSX (currently lines 209–280).

**New shape** for the input row (replaces the existing `<div className="flex h-12 items-center gap-2">` and its two children):

```jsx
<div className="flex h-12 items-center gap-2">
  {/* Icon-only segmented control on the LEFT — serves as the prefix.
      Active recipe matches the page-level switcher (bg-text-primary
      text-bg). */}
  <div className="inline-flex h-12 shrink-0 items-center gap-1 rounded-lg border border-border bg-bg p-1">
    {[
      { value: 'account', icon: AtSign, label: 'Account mode' },
      { value: 'hashtag', icon: Hash, label: 'Hashtag mode' },
    ].map((t) => {
      const selected = type === t.value
      const Icon = t.icon
      return (
        <button
          key={t.value}
          type="button"
          aria-label={t.label}
          aria-pressed={selected}
          onClick={() => {
            setType(t.value)
            setInput('')
            setMatches([])
            setPickedMatch(null)
          }}
          className={`flex h-full w-10 items-center justify-center rounded-md transition-colors ${
            selected
              ? 'bg-text-primary text-bg shadow-sm'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </button>
      )
    })}
  </div>

  {/* Input field — no inline @/# prefix span. Plain placeholder. */}
  <div className="flex h-12 flex-1 items-center overflow-hidden rounded-lg border border-border bg-surface px-3">
    <input
      id="target-input"
      ref={inputRef}
      type="text"
      value={input.replace(/^[@#]/, '')}
      onChange={(e) => setInput(e.target.value)}
      className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
      placeholder={type === 'account' ? 'username' : 'hashtag'}
      aria-label={type === 'account' ? 'Username' : 'Hashtag'}
      autoComplete="off"
    />
    {input && (
      <button
        type="button"
        aria-label="Clear input"
        onClick={() => {
          setInput('')
          setMatches([])
          setPickedMatch(null)
          inputRef.current?.focus()
        }}
        className="ml-2 inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-text-muted hover:bg-bg hover:text-text-primary"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    )}
  </div>
</div>
```

**Three diffs vs. today:**
1. Switcher block moves from after the input field to before it.
2. The `<span className="mr-1 text-text-muted">@</span>` (the inline prefix span inside the input field) is **removed entirely**.
3. Placeholder strings stay (`username` / `hashtag`) — no symbol baked in.

**Other logic untouched:** `displayValue`, `formatValid`, the `clean` derivation that strips `^[@#]` defensively (in case a user pastes `@username` with the symbol — we still want to handle that gracefully).

**Acceptance:** Toggle sits to the left of the input, clicking it switches mode + clears state (unchanged behavior). Input field has no leading `@`/`#`. Placeholder reads plain `username` or `hashtag`. Pasting `@fitness.inspo` still resolves correctly (the strip-prefix regex catches it).

---

## Item 3 — Selected-source pill replaces the input row

**Why:** Today, picking a match leaves the editable input + a separate "preview card" below. Typing after picking silently deselects. Replacing the entire input row with a locked pill makes the state unambiguous: pill = picked, input = not picked.

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx` — Input row + preview card area (lines 209–341).

**New top-level conditional** wrapping the input row:

```jsx
{pickedMatch ? (
  <SelectedSourcePill
    match={pickedMatch}
    type={type}
    onClear={() => {
      setPickedMatch(null)
      setInput('')
      setMatches([])
      setTimeout(() => inputRef.current?.focus(), 0)
    }}
  />
) : (
  /* The [toggle][input] row + typeahead dropdown + helper text — i.e.
     the existing logic from Item 2. The typeahead dropdown only renders
     when !pickedMatch anyway, so it naturally hides here. */
  <>
    {/* …toggle + input row from Item 2… */}
    {/* …typeahead dropdown unchanged… */}
    {/* …helper text unchanged… */}
  </>
)}
```

**The existing "Preview card" branch (lines 320–341, the `{pickedMatch && !duplicate && …}` block) is removed entirely** — the pill replaces it.

### `SelectedSourcePill` — inline helper component

Defined inside `AddTargetSheet.jsx` (no new file) at the bottom of the module after the default export:

```jsx
function SelectedSourcePill({ match, type, onClear }) {
  const isHashtag = type === 'hashtag'
  const label = isHashtag ? `#${match.hashtag}` : `@${match.username}`
  const subline = isHashtag
    ? `${formatCount(match.posts)} posts`
    : `${formatCount(match.followers)} followers`
  const letter = (isHashtag ? match.hashtag : match.username)
    .charAt(0)
    .toUpperCase()

  return (
    <div className="flex h-12 items-center gap-3 rounded-lg border border-border bg-bg px-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-xs font-semibold text-text-secondary ring-1 ring-border">
        {isHashtag ? (
          <Hash className="h-4 w-4" aria-hidden="true" />
        ) : match.profilePic ? (
          <img src={match.profilePic} alt="" className="h-full w-full object-cover" />
        ) : (
          letter
        )}
      </span>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-text-primary">{label}</div>
        <div className="truncate text-xs text-text-muted">{subline}</div>
      </div>
      <button
        type="button"
        aria-label="Clear selection"
        onClick={onClear}
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-text-muted transition-colors hover:bg-surface hover:text-text-primary"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  )
}
```

**Why an inline helper, not a new file:** The pill is only used in this one place and binds tightly to the parent's state. Lifting it out earns no reuse and just adds a new file to navigate.

**Helper text suppression:** When `pickedMatch` is set, the existing helper-text branches (`Select a result to continue`, format errors) are unreachable because they all gate on `!pickedMatch`. Verify this when implementing — if any helper text leaks through, it should be suppressed.

**Acceptance:** Picking a typeahead match or a suggestion chip replaces the entire `[toggle][input]` row with the pill. The pill is non-interactive except for the clear-X. Clicking the X restores the `[toggle][input]` row, focuses the input, and clears `pickedMatch` + `input` + `matches`. The "preview card" below the input is gone.

---

## Item 4 — Private / Verified warning

**Why:** Targeting private or verified accounts has known engine limitations (mocked for V1; real-API-respected for production). Surface this before the user adds the target so they can make an informed choice — but don't block.

**Files:**
- Modify: `src/mocks/suggestedTargets.js` — add `private` / `verified` flags to two entries.
- Modify: `src/mocks/targetSearch.js` — add `private` / `verified` flags to a few entries in the `ACCOUNTS` array.
- Modify: `src/pages/targeting/AddTargetSheet.jsx` — add the warning row + import `AlertTriangle`.

### Mock data — `src/mocks/suggestedTargets.js`

Add `verified: true` to the first entry (`@fitfluencer`) and `private: true` to the third (`@trainhard.daily`). Other entries get neither flag (or both `false` — pick one and stay consistent). Final shape:

```js
export const mockSuggestedTargets = [
  { username: 'fitfluencer', followers: 84200, profilePic: 'https://i.pravatar.cc/80?u=fitfluencer', verified: true },
  { username: 'healthyhabits', followers: 52100, profilePic: 'https://i.pravatar.cc/80?u=healthyhabits' },
  { username: 'trainhard.daily', followers: 39800, profilePic: 'https://i.pravatar.cc/80?u=trainhard', private: true },
  { username: 'nutrition.nerd', followers: 22400, profilePic: null },
  { username: 'homegymhero', followers: 18700, profilePic: null },
]
```

(Convention: omit the flag when `false`. Truthy presence is the signal.)

### Mock data — `src/mocks/targetSearch.js`

In the `ACCOUNTS` array, add flags to four entries spread across the list so typeahead surfaces them at varying query lengths:

| Username | Add flag |
|---|---|
| `gym.goals` | `verified: true` |
| `plantpowered` | `verified: true` |
| `cardio.crew` | `private: true` |
| `lift.and.lunge` | `private: true, verified: true` |

(One double-flag entry exercises the combined-message branch.)

Other entries in the array stay untouched.

### Warning row — `AddTargetSheet.jsx`

**Import:**
```jsx
import { AlertTriangle, AtSign, Crosshair, Hash, X } from 'lucide-react'
```
(Add `AlertTriangle` to the existing import.)

**Helper** (inline, near `SelectedSourcePill`):

```jsx
function buildLimitedTargetingMessage(match) {
  const isPrivate = !!match?.private
  const isVerified = !!match?.verified
  if (isPrivate && isVerified) {
    return 'This account has limited targeting (private and verified accounts restrict what we can do).'
  }
  if (isPrivate) {
    return 'This account has limited targeting (private accounts restrict what we can do).'
  }
  if (isVerified) {
    return 'This account has limited targeting (verified accounts restrict what we can do).'
  }
  return null
}
```

**Render** the warning row immediately after the `SelectedSourcePill` block (still inside the body, before the suggestions section). The warning is gated on:
- `pickedMatch` is set
- `type === 'account'` (hashtags don't have these flags)
- The helper returns a non-null message

```jsx
{pickedMatch && type === 'account' && buildLimitedTargetingMessage(pickedMatch) && (
  <div className="mt-3 flex items-start gap-2 rounded-lg bg-yellow-tint p-3 text-yellow-text">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <p className="text-xs leading-relaxed">
      {buildLimitedTargetingMessage(pickedMatch)}
    </p>
  </div>
)}
```

**Position in the JSX flow:** between the pickedMatch conditional (Item 3) and the Suggestions scroller (Item 1). The warning sits **above** the suggestions, not below, so the user sees it without scrolling on mobile.

**Behavior:** purely informational. The Add target button stays enabled (`canSubmit` is unaffected). User can still submit.

**Acceptance:** Picking `@fitfluencer` from suggestions surfaces the verified warning. Picking `@trainhard.daily` surfaces the private warning. Typeahead-picking `@lift.and.lunge` surfaces the combined message. Picking any flag-less account or any hashtag surfaces no warning. Add target button is enabled in every case.

---

## Item 5 — Duplicate-target warning in pill state

**Why:** Today the duplicate-target case ("You already have this target — Resume it") renders as helper text below the input. Item 3 removes the input row entirely when `pickedMatch` is set, which makes that helper unreachable. We can't silently disable the Add target button without telling the user why.

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx` — render a duplicate-warning row in the same slot as the limited-targeting warning (Item 4).

**Render** immediately after the `SelectedSourcePill` block, before the limited-targeting warning. Same shape as Item 4's warning row but red:

```jsx
{pickedMatch && duplicate && (
  <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-tint p-3 text-red-text">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
    <p className="flex-1 text-xs leading-relaxed">
      You already have this target.
      {duplicate.status === 'paused' && (
        <>
          {' '}
          <button
            type="button"
            onClick={handleResumeDuplicate}
            className="font-medium underline hover:opacity-80"
          >
            Resume it
          </button>
        </>
      )}
    </p>
  </div>
)}
```

**Position priority** in the JSX flow (top to bottom inside the body):
1. Selected-source pill (Item 3) **OR** input row (Item 2 — when no pick).
2. Duplicate warning (this Item) — red, only when `pickedMatch && duplicate`.
3. Limited-targeting warning (Item 4) — yellow, only when `pickedMatch && type === 'account' && hasFlag`.
4. Suggestions scroller (Item 1).

A duplicate also has flags possibly set; both warnings can stack (red on top, yellow below).

**Helper-text suppression:** The existing helper-text branches inside the input-row block (the `helper` variable + its render) only fire when `!pickedMatch`. With the pill in place, that block is replaced wholesale — no leak. The format-validation error case (`input && !formatValid`) is also unreachable when `pickedMatch` is set, since picking only happens via valid matches.

**Acceptance:** Picking a suggestion that matches an existing target shows a red `You already have this target` row above the suggestions. If the existing target is `paused`, an inline "Resume it" link is included that calls `handleResumeDuplicate`. Add target button is disabled (existing `canSubmit = pickedMatch && !duplicate` logic — unchanged).

---

## Out of scope

- Real engine consequences for private/verified targeting — V1 is purely advisory.
- Cancel button copy / weight (flagged in pending queue, not addressed here).
- Suggestions dataset growth (5 entries today; spec keeps that count).
- Hashtag suggestions also moving to the scroller — they already use `mockSuggestedHashtags` through the same code path; the scroller treatment in Item 1 covers both modes.

---

## Implementation notes for the plan

- One file does most of the work (`AddTargetSheet.jsx`). Implementer should refactor in this order to keep each step verifiable in browser:
  1. Mock-data flag additions (Item 4 data — independent of UI).
  2. Item 2 (switcher-left + drop input prefix) — visible immediately.
  3. Item 1 (horizontal-scroller suggestions) — visible immediately.
  4. Item 3 (selected-source pill) — needs the new structure to land cleanly; do this after #2 lands.
  5. Item 4 (warning) — last, depends on Item 3's pill being in place to position relative to.
- After each step, manual verify in the preview server at mobile (375×812) and desktop (1280×800).
- The codebase has no automated test suite; verification is exclusively visual.
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
- Helper `buildLimitedTargetingMessage` and `SelectedSourcePill` stay inline in `AddTargetSheet.jsx`. Don't lift to separate files unless the file grows past ~500 lines (currently 418).
