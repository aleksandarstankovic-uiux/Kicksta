# Add Target Popup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure `src/pages/targeting/AddTargetSheet.jsx` so suggestions are a horizontal scroller, the @/# switcher moves to the left of the input (dropping the duplicate prefix), picking a match collapses the input row into a locked pill, and private/verified/duplicate states surface as inline warning rows.

**Architecture:** Single-file refactor of `AddTargetSheet.jsx` plus mock-data flag additions in `mocks/suggestedTargets.js` and `mocks/targetSearch.js`. No new component files — `SelectedSourcePill` and `buildLimitedTargetingMessage` stay inline at the bottom of `AddTargetSheet.jsx`. Tasks land in dependency order so each commit is independently verifiable in browser.

**Tech Stack:** React 19, Tailwind v4, Lucide React. No automated test suite — verification is manual via the Claude Preview MCP server (`preview_start`, `preview_resize`, `preview_eval`, `preview_click`) at mobile (375×812) and desktop (1280×800) widths.

**Spec:** `docs/superpowers/specs/2026-05-08-add-target-popup-design.md`

---

## File Map

| File | Touched by | Responsibility |
|---|---|---|
| `src/mocks/suggestedTargets.js` | Task 1 | Add `verified` to `@fitfluencer`, `private` to `@trainhard.daily`. |
| `src/mocks/targetSearch.js` | Task 1 | Add `verified` / `private` flags to four entries in `ACCOUNTS`. |
| `src/pages/targeting/AddTargetSheet.jsx` | Tasks 2–6 | All UI changes — switcher-left, scroller, pill, warnings. |

Implementation order is dependency-driven:

1. **Mock-data flags** (Task 1) — independent, lays groundwork for warning task.
2. **Switcher-left + drop input prefix** (Task 2) — input row restructure, visible immediately.
3. **Suggestions scroller** (Task 3) — independent of input row, visible immediately.
4. **Selected-source pill** (Task 4) — replaces input row when picked; depends on Task 2's structure being clean.
5. **Limited-targeting + duplicate warnings** (Tasks 5–6) — sit in the slot between pill and scroller; depend on Task 4's pill being in place.

Each task ends in one commit. Six commits total (mock data + 5 UI changes).

---

## Task 1: Mock-data flags for private / verified

**Why:** The warning row in Task 5 reads `private` and `verified` flags off the picked match object. Without these flags in the suggestion + search corpora, the warning never fires.

**Files:**
- Modify: `src/mocks/suggestedTargets.js`
- Modify: `src/mocks/targetSearch.js`

- [ ] **Step 1: Add flags to `mockSuggestedTargets`**

Open `src/mocks/suggestedTargets.js`. Replace the array with:

```js
export const mockSuggestedTargets = [
  { username: 'fitfluencer', followers: 84200, profilePic: 'https://i.pravatar.cc/80?u=fitfluencer', verified: true },
  { username: 'healthyhabits', followers: 52100, profilePic: 'https://i.pravatar.cc/80?u=healthyhabits' },
  { username: 'trainhard.daily', followers: 39800, profilePic: 'https://i.pravatar.cc/80?u=trainhard', private: true },
  { username: 'nutrition.nerd', followers: 22400, profilePic: null },
  { username: 'homegymhero', followers: 18700, profilePic: null },
]
```

The leading comment block stays.

- [ ] **Step 2: Add flags to `ACCOUNTS` in `targetSearch.js`**

Open `src/mocks/targetSearch.js`. In the `ACCOUNTS` array, modify these four entries (find by `username`, leave others untouched):

```js
{ username: 'gym.goals', followers: 1_200_000, profilePic: null, verified: true },
{ username: 'plantpowered', followers: 145_000, profilePic: null, verified: true },
{ username: 'cardio.crew', followers: 11_500, profilePic: null, private: true },
{ username: 'lift.and.lunge', followers: 3_900, profilePic: null, private: true, verified: true },
```

Note the trailing flag(s) added after `profilePic`. Other keys in those objects are unchanged. The remaining 16 entries in `ACCOUNTS` keep their original shape (no flags).

- [ ] **Step 3: Sanity-check syntax**

Run: `node --check src/mocks/suggestedTargets.js && node --check src/mocks/targetSearch.js`
Expected: no output (both files parse).

If `node --check` errors on JSX-style syntax (these are pure JS, so it shouldn't), fall back to `npx vite build --logLevel error` for a full parse.

- [ ] **Step 4: Commit**

```bash
git add src/mocks/suggestedTargets.js src/mocks/targetSearch.js
git commit -m "$(cat <<'EOF'
feat(mocks): add private/verified flags to target suggestions and search

Two suggestion entries (@fitfluencer verified, @trainhard.daily private)
and four search-corpus entries (@gym.goals + @plantpowered verified,
@cardio.crew private, @lift.and.lunge both) now carry flags so the
upcoming limited-targeting warning in AddTargetSheet has data to fire on.
No UI consumers yet — that lands in the warning task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Switcher moves left, drop input prefix span

**Why:** Today's input row reads `[input with @ prefix span][switcher icon-toggle on right]`. Both signal type. Spec moves the switcher to the LEFT of the input and removes the inline `@`/`#` prefix span entirely — the toggle's active icon serves as the prefix.

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx` (the input row JSX inside the body — currently around lines 209–280, the `<div className="relative">` containing `<div className="flex h-12 items-center gap-2">` and its two children).

- [ ] **Step 1: Replace the input row JSX**

Open `src/pages/targeting/AddTargetSheet.jsx`. Locate the input row block. It currently reads:

```jsx
<div className="relative">
  <div className="flex h-12 items-center gap-2">
    {/* Input field */}
    <div className="flex h-12 flex-1 items-center overflow-hidden rounded-lg border border-border bg-surface px-3">
      <span className="mr-1 text-text-muted">
        {type === 'account' ? '@' : '#'}
      </span>
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
      {/* Clear-X — only rendered while there's content to clear. */}
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

    {/* Icon-only segmented control. Active = bg-text-primary
        text-bg (same recipe as the page-level + body
        switchers). aria-pressed on each so screen readers
        read the toggle state. */}
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
  </div>
```

Replace the inner `<div className="flex h-12 items-center gap-2">` block (the immediate child of `<div className="relative">`, containing input field + switcher) with:

```jsx
  <div className="flex h-12 items-center gap-2">
    {/* Icon-only segmented control on the LEFT — serves as the prefix.
        Active = bg-text-primary text-bg (same recipe as the page-level
        + body switchers). aria-pressed on each so screen readers read
        the toggle state. */}
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
      {/* Clear-X — only rendered while there's content to clear. */}
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

Three diffs vs. before:
1. Switcher block is the **first** child of the row (was second).
2. Input field block is the **second** child (was first).
3. The `<span className="mr-1 text-text-muted">…</span>` (the @/# prefix span inside the input field) is **removed**.

Everything below this block (typeahead dropdown, helper text, preview card, suggestions section) stays exactly as-is for now.

- [ ] **Step 2: Manual verify in browser**

Start the preview server if not already running:
```
preview_start "Vite Dev Server"
preview_resize preset=mobile
```

Navigate to `http://localhost:5173/targeting` and click the `+` button to open Add Target. Verify:
- The Account/Hashtag icon-toggle sits to the LEFT of the input field.
- The input field has NO leading `@` or `#` symbol inside the field.
- Placeholder reads `username` (in account mode) or `hashtag` (in hashtag mode after toggling).
- Toggling between account/hashtag clears the input and updates the placeholder.
- Typing `fit` then clearing via the X still works.

Use `preview_eval` to confirm the prefix span is gone:
```js
preview_eval "(() => {
  const dialog = document.querySelector('[role=dialog]');
  const prefixSpan = dialog?.querySelector('input + span, .mr-1.text-text-muted');
  const firstChild = dialog?.querySelector('.flex.h-12.items-center.gap-2 > :first-child');
  return {
    hasPrefixSpan: !!prefixSpan,
    firstChildIsToggle: firstChild?.querySelector('button[aria-label*=mode]') !== null,
  };
})()"
```
Expected: `{ hasPrefixSpan: false, firstChildIsToggle: true }`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/targeting/AddTargetSheet.jsx
git commit -m "$(cat <<'EOF'
refactor(AddTargetSheet): switcher to the left, drop input prefix span

The @/# inline prefix span inside the input field duplicated the type
signal already shown by the Account/Hashtag icon-toggle. Move the toggle
to the left of the input (where it visually serves as the prefix) and
drop the prefix span. Placeholder is plain "username" or "hashtag" with
no symbol. Resolves add-target-popup item 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Suggestions become a horizontal scroller

**Why:** The current 2-col grid takes ~half the popup on mobile. A horizontal scroller of 88×~110px chips lets the user browse 3–4 suggestions on mobile (5–6 on desktop) inside ~120px of vertical space.

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx` (the Suggestions block — currently the `<div className="mt-6">` containing the eyebrow + 2-col grid).

- [ ] **Step 1: Replace the suggestions block**

Locate the suggestions block (search for `Suggestions` text or `mockSuggestedTargets` reference). It currently reads:

```jsx
{/* Suggestions — browse surface that stays visible even
    while the typeahead is showing results. Rendered as a
    2-col grid of richer rows (avatar + handle + count
    subline) so the user has actual signal to pick from
    rather than a wall of tiny chips. */}
<div className="mt-6">
  <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
    Suggestions
  </p>
  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
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
          className="flex items-center gap-3 rounded-lg border border-border bg-surface p-3 text-left transition-colors hover:border-border-strong hover:bg-bg"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-xs font-semibold text-text-secondary ring-1 ring-border">
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
          <span className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="truncate text-sm font-medium text-text-primary">
              {label}
            </span>
            <span className="truncate text-xs text-text-muted">
              {subline}
            </span>
          </span>
        </button>
      )
    })}
  </div>
</div>
```

Replace the entire block with:

```jsx
{/* Suggestions — horizontal scroller of compact chips. Stays
    visible while the typeahead is showing results. The
    -mx-4/px-4 trick lets the row extend full-width while
    keeping the first/last chip from sitting flush to the
    popup edge. Snap-x proximity so swipes settle on chip
    boundaries without being rigid. Scrollbar hidden. */}
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

Key changes vs. before:
- Outer `<div>` switches from `grid grid-cols-1 ... sm:grid-cols-2` to a horizontal flex with `overflow-x-auto`, snap, hidden scrollbar.
- Outer wrapper gets `-mx-4 px-4` — extends full-width past body padding.
- Each chip becomes a vertical-stack 88×~110 with avatar on top, label + subline below, centered.

The `handlePickSuggestion` handler is unchanged — chips still call it on click.

- [ ] **Step 2: Manual verify**

Reload preview at mobile (375). Open Add Target. Verify:
- "Suggestions" eyebrow renders.
- Below it: a single horizontal row of 5 chips (one per `mockSuggestedTargets` entry).
- Approximately 3 chips visible at once on mobile; 4–5 visible on desktop (resize via `preview_resize preset=desktop`).
- Swiping/scrolling horizontally reveals the rest.
- Each chip shows: avatar (circle, 40×40), `@handle` (truncated), `<count> followers` (truncated).
- Tapping a chip fills the input + sets the picked match (existing behavior).

Toggle to hashtag mode: chips swap to hashtag suggestions with Hash icons + posts count.

- [ ] **Step 3: Commit**

```bash
git add src/pages/targeting/AddTargetSheet.jsx
git commit -m "$(cat <<'EOF'
refactor(AddTargetSheet): suggestions become a horizontal scroller

2-col grid of card buttons replaced with a single horizontal row of
88×~110 vertical-stack chips. ~3 chips visible on mobile, ~5–6 on
desktop. Saves ~half the popup's vertical space on mobile. Snap-x
proximity for chip-boundary settle; hidden scrollbar; -mx-4/px-4 to
extend the row past body padding without the first/last chip sitting
flush. Resolves add-target-popup item 1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Selected-source pill replaces the input row

**Why:** Today picking a match leaves the editable input + a separate "preview card" below. Typing after picking silently deselects. Replacing the entire input row with a locked pill makes the state unambiguous: pill = picked, input = not picked.

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx` (the input row block from Task 2 + the Preview card block which gets removed entirely + add the inline `SelectedSourcePill` helper at the bottom of the file).

- [ ] **Step 1: Wrap the input row in a `pickedMatch ?` conditional**

Locate the `<div className="relative">` that wraps the `[toggle][input]` row + typeahead dropdown + helper text (everything from the row down to the `{helper && …}` block). It currently reads roughly:

```jsx
<div className="relative">
  <div className="flex h-12 items-center gap-2">
    {/* …switcher + input from Task 2… */}
  </div>

  {/* Typeahead dropdown */}
  {!duplicate && formatValid && !pickedMatch && matches.length > 0 && (
    <div className="absolute left-0 right-0 z-10 mt-1 max-h-[240px] overflow-y-auto rounded-lg border border-border bg-surface shadow-md">
      {/* …matches… */}
    </div>
  )}

  {/* Helper — only renders when there's something to say. */}
  {helper && (
    <p className={`mt-1.5 text-xs ${helperTone}`}>{helper}</p>
  )}
</div>
```

Wrap the entire `<div className="relative">` block in a `{pickedMatch ? <SelectedSourcePill … /> : (<div className="relative">…</div>)}` conditional:

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
  <div className="relative">
    {/* …existing toggle+input row + typeahead dropdown + helper… */}
  </div>
)}
```

Do not change anything inside the `<div className="relative">` — only wrap it.

- [ ] **Step 2: Remove the Preview card block**

Locate the Preview card block (search for `Preview card` comment or `pickedMatch && !duplicate` followed by a card render). It currently reads:

```jsx
{/* Preview card — only after a match is picked. */}
{pickedMatch && !duplicate && (
  <div className="mt-4 flex items-center gap-3 rounded-lg border border-border bg-bg p-3">
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-surface text-sm font-semibold text-text-secondary">
      {type === 'hashtag' ? (
        <Hash className="h-4 w-4" aria-hidden="true" />
      ) : (
        (pickedMatch.username?.[0] || '?').toUpperCase()
      )}
    </div>
    <div className="min-w-0 flex-1">
      <div className="truncate text-sm font-medium text-text-primary">
        {type === 'hashtag' ? `#${pickedMatch.hashtag}` : `@${pickedMatch.username}`}
      </div>
      <div className="truncate text-xs text-text-secondary">
        {type === 'hashtag'
          ? `${formatCount(pickedMatch.posts)} posts`
          : `${formatCount(pickedMatch.followers)} followers`}
      </div>
    </div>
    <HealthPill count={type === 'hashtag' ? pickedMatch.posts : pickedMatch.followers} />
  </div>
)}
```

**Delete the entire block.** The pill now carries this content; the HealthPill is dropped (V1 pill doesn't surface health — users still see the suggestion's count subline, which serves the same comprehension purpose).

- [ ] **Step 3: Add the `SelectedSourcePill` helper at the bottom of the file**

Append this helper at the end of `AddTargetSheet.jsx`, after the default export:

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

- [ ] **Step 4: Manual verify**

Reload preview. Open Add Target. Type `fit` → typeahead matches appear → click `@fitness.inspo`. Verify:
- The `[toggle][input]` row is replaced by a pill showing avatar + `@fitness.inspo` + `128.4K followers` + clear-X.
- The toggle is gone (hidden, not just disabled).
- The "preview card" below the input is gone.
- Clicking the X clears the selection: pill disappears, `[toggle][input]` row returns, input is empty and focused.

Click a suggestion chip directly: same behavior — chip selects, pill replaces input row.

Use `preview_eval` to confirm:
```js
(() => {
  const dialog = document.querySelector('[role=dialog]');
  const pillX = dialog?.querySelector('button[aria-label="Clear selection"]');
  const inputField = dialog?.querySelector('input#target-input');
  return { pillVisible: !!pillX, inputVisible: !!inputField };
})()
```
After picking: `{ pillVisible: true, inputVisible: false }`.
After clicking X: `{ pillVisible: false, inputVisible: true }`.

- [ ] **Step 5: Commit**

```bash
git add src/pages/targeting/AddTargetSheet.jsx
git commit -m "$(cat <<'EOF'
refactor(AddTargetSheet): selected-source pill replaces input row

Picking a match (suggestion or typeahead) collapses the entire
[toggle][input] row into a locked pill: avatar + @handle + count subline +
clear-X. The previous "preview card" below the input is dropped — the
pill carries that information now. State is unambiguous: pill = picked,
input = not picked. Solves the silent-deselect-on-typing trap. Resolves
add-target-popup item 3.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Limited-targeting warning row

**Why:** Picking a `private: true` or `verified: true` account should surface an inline yellow warning above the suggestions, telling the user targeting is limited but not blocking submit.

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx` (add `AlertTriangle` to the lucide import; add `buildLimitedTargetingMessage` helper; add the warning row in the body).

- [ ] **Step 1: Add `AlertTriangle` to the lucide import**

Find the lucide import at the top of `AddTargetSheet.jsx`:

```jsx
import { AtSign, Crosshair, Hash, X } from 'lucide-react'
```

Replace with:

```jsx
import { AlertTriangle, AtSign, Crosshair, Hash, X } from 'lucide-react'
```

- [ ] **Step 2: Add the `buildLimitedTargetingMessage` helper**

Append this helper at the end of `AddTargetSheet.jsx`, after `SelectedSourcePill`:

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

- [ ] **Step 3: Render the warning row**

In the body, locate where the `{pickedMatch ? <SelectedSourcePill … /> : …}` conditional ends. Immediately after it, before the suggestions block, add:

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

- [ ] **Step 4: Manual verify**

Reload preview. Open Add Target.

Click the `@fitfluencer` suggestion (verified). Verify:
- Pill renders normally.
- A yellow warning row appears below the pill: `⚠ This account has limited targeting (verified accounts restrict what we can do).`
- Add target button is enabled.

Clear the pill (click X). Type `train` → click `@trainhard.daily` from typeahead/suggestion (private). Verify:
- Pill renders.
- Yellow warning: `⚠ This account has limited targeting (private accounts restrict what we can do).`

Clear. Type `lift` → click `@lift.and.lunge` from typeahead (private + verified). Verify:
- Yellow warning: `⚠ This account has limited targeting (private and verified accounts restrict what we can do).`

Clear. Click `@healthyhabits` (no flags). Verify:
- Pill renders.
- NO warning row.

Switch to hashtag mode, click any hashtag suggestion. Verify:
- Pill renders.
- NO warning (warning is gated on `type === 'account'`).

- [ ] **Step 5: Commit**

```bash
git add src/pages/targeting/AddTargetSheet.jsx
git commit -m "$(cat <<'EOF'
feat(AddTargetSheet): warn on private/verified account targets

Picking a private and/or verified account surfaces a yellow inline
warning above the suggestions explaining that targeting is limited.
Doesn't block submit — purely informational. Hashtag mode never shows
this warning. Resolves add-target-popup item 4.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Duplicate-target warning row

**Why:** Today the duplicate-target case ("You already have this target — Resume it") renders as helper text below the input. Task 4 removed the input row when `pickedMatch` is set, which made that helper unreachable. Restore the warning in the new pill state as a parallel red row, slotted above the limited-targeting warning so a duplicate also showing flags reads red-then-yellow.

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx` (add a red duplicate warning row).

- [ ] **Step 1: Render the duplicate warning**

In the body, immediately after the `{pickedMatch ? <SelectedSourcePill … /> : …}` conditional and BEFORE the limited-targeting warning row from Task 5, add:

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

The final body order, top to bottom inside the scrollable area:
1. `pickedMatch ? <SelectedSourcePill /> : (toggle + input + typeahead + helper)`
2. `pickedMatch && duplicate && <RedDuplicateWarning />` ← Task 6
3. `pickedMatch && type === 'account' && hasFlag && <YellowLimitedWarning />` ← Task 5
4. Suggestions horizontal scroller ← Task 3

- [ ] **Step 2: Manual verify**

Reload preview. Open Add Target.

The default mocks have `@fitness.inspo`, `@yoga.daily`, `@cleanfoodcrush`, `@protein.pete`, `@macro.melissa`, `@keto.kevin`, and `@stale.influencer` as existing targets. None of them appear in `mockSuggestedTargets`, so test via typeahead:

Type `fit` → typeahead surfaces `@fitness.inspo` (existing target, status `active`). Click it. Verify:
- Pill renders.
- A RED warning row above the suggestions: `⚠ You already have this target.` (no Resume button — status is `active`, not `paused`).

Clear pill. Type `cleanfood` → click `@cleanfoodcrush` (existing target, status `paused`). Verify:
- Pill renders.
- RED warning: `⚠ You already have this target. Resume it` (with the inline link).
- Clicking "Resume it" closes the popup and resumes the target (existing `handleResumeDuplicate` behavior).

Clear pill. Click `@fitfluencer` (suggestion, verified, NOT an existing target). Verify:
- Pill renders.
- NO red warning.
- YELLOW warning (from Task 5): verified message.

If a single match somehow ends up both an existing target AND flagged (none in current mocks, but possible in future): both warnings stack — red first, yellow below. Layout should still be readable.

- [ ] **Step 3: Commit**

```bash
git add src/pages/targeting/AddTargetSheet.jsx
git commit -m "$(cat <<'EOF'
fix(AddTargetSheet): duplicate-target warning in pill state

The previous duplicate warning rendered as helper text below the input
row; the pill replacement (selected-source pill) removed that surface.
Add a red inline warning row above the limited-targeting warning so the
user sees why the Add target button is disabled. Includes the inline
"Resume it" link for paused-target duplicates. Resolves
add-target-popup item 5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

- [ ] **Step 1: Full sweep at mobile + desktop**

With the dev server running, sweep at mobile (375×812) and desktop (1280×800):

- Open Add Target. Toggle is on the LEFT, input has no `@/#` prefix, placeholder is plain.
- Suggestions render as a single horizontal row of 88×~110 chips with hidden scrollbar; ~3 visible on mobile, ~5+ on desktop.
- Click any suggestion → pill replaces input row → click X → input row returns, focused.
- Click `@fitfluencer` → yellow warning fires.
- Type `fit` → click `@fitness.inspo` → red duplicate warning fires (Add target disabled).
- Toggle to hashtag mode → suggestions become hashtag chips → no warning ever fires regardless of pick.

- [ ] **Step 2: Check git log**

```bash
git log --oneline -8
```

Expected: six new commits on top of the spec commit, in this order: mock flags, switcher-left, scroller, pill, limited-warning, duplicate-warning.

---

## Notes for the implementer

- All UI work is in one file. Implement tasks in order — earlier tasks set up structures that later tasks depend on (Task 4's pill, then Tasks 5–6's warnings sit between pill and scroller).
- The codebase has no automated test suite. Verification is exclusively visual via the preview MCP tools.
- Use `preview_inspect` over `preview_screenshot` when verifying colors / classNames — screenshots are unreliable for exact styles.
- `SelectedSourcePill` and `buildLimitedTargetingMessage` stay inline in `AddTargetSheet.jsx`. The file will grow to ~470 lines; if it crosses ~500, flag it in a follow-up — don't split mid-task.
- The HealthPill component used in the old "preview card" is no longer imported in this file after Task 4; remove the import statement (`import HealthPill from './HealthPill'`) at the top of `AddTargetSheet.jsx` IF Task 4 leaves it unreferenced. Verify with a grep before deletion: `grep -n "HealthPill" src/pages/targeting/AddTargetSheet.jsx` should return only the import line after Task 4.
- The HealthPill is still used in the typeahead dropdown rows (line ~306 of the original file). Verify it's still referenced there before touching the import. If still used, leave the import alone.
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
- Pravatar URLs are network-dependent in V1 mocks; if the preview server is offline, avatars will fall back to broken-image icons. Don't substitute local files.
