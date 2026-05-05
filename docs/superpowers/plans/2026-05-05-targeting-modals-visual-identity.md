# Targeting Modals Visual Identity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Color-code the three Targeting modals at the chip-header level (blue / green / yellow), polish the AddTargetSheet suggestion chips with real avatars, and replace bare-text empty states in Whitelist + Blacklist with a centered icon-block.

**Architecture:** Three modal files modified, one mock file modified, no new files, no new components, no new state. The existing `CardChip` component already supports all needed colors via its content-scan list.

**Tech Stack:** React 19, Vite 8, Tailwind 4, Lucide React. **No unit-test framework** — verification is `eslint` + manual visual inspection.

---

### Reference spec

`docs/superpowers/specs/2026-05-05-targeting-modals-visual-identity-design.md`

### File map

| File | Status | Responsibility |
|---|---|---|
| `src/mocks/suggestedTargets.js` | MODIFY | Replace `null` profilePic with pravatar URLs on 3 of 5 entries |
| `src/pages/targeting/AddTargetSheet.jsx` | MODIFY | Add CardChip + Crosshair to header; swap suggestion chip avatar branch |
| `src/pages/targeting/WhitelistModal.jsx` | MODIFY | Empty-state icon-block (green / ShieldCheck) |
| `src/pages/targeting/BlacklistModal.jsx` | MODIFY | CardChip neutral → yellow; empty-state icon-block (yellow / Ban) |
| `CHANGELOG.md` | MODIFY | New dated entry |

### Verification command

Used at the end of each task:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src --ext .js,.jsx
```

If `node` is unavailable in the shell, the engineer should review the diff visually and explicitly note that eslint was skipped.

---

## Task 1: Pravatar URLs on suggested targets

**Why first:** Task 3 (avatar branch) reads this data. Foundational, isolated, no other file changes.

**Files:**
- Modify: `src/mocks/suggestedTargets.js`

- [ ] **Step 1: Replace the file body**

Open `src/mocks/suggestedTargets.js`. Replace the entire `mockSuggestedTargets` array with:

```js
// Static suggestions shown as chips inside the Add Target sheet
// (account mode only). Represents "accounts similar to what you already
// target" — no live niche inference in V1.
//
// First 3 entries get pravatar URLs so the avatar branch in
// AddTargetSheet's suggestion chips is exercised in dev. The last 2
// keep `profilePic: null` so the letter-fallback branch stays covered.
export const mockSuggestedTargets = [
  { username: 'fitfluencer', followers: 84200, profilePic: 'https://i.pravatar.cc/80?u=fitfluencer' },
  { username: 'healthyhabits', followers: 52100, profilePic: 'https://i.pravatar.cc/80?u=healthyhabits' },
  { username: 'trainhard.daily', followers: 39800, profilePic: 'https://i.pravatar.cc/80?u=trainhard' },
  { username: 'nutrition.nerd', followers: 22400, profilePic: null },
  { username: 'homegymhero', followers: 18700, profilePic: null },
]
```

- [ ] **Step 2: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/mocks/suggestedTargets.js
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/mocks/suggestedTargets.js && git commit -m "feat(mocks): add pravatar URLs to suggested targets

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: AddTargetSheet header gets CardChip + Crosshair

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx`

- [ ] **Step 1: Update the lucide import line**

Find the existing line (currently line 2):

```js
import { Hash, X } from 'lucide-react'
```

Change it to (alphabetical order, adding `Crosshair`):

```js
import { Crosshair, Hash, X } from 'lucide-react'
```

- [ ] **Step 2: Add the CardChip import**

Add this line in the imports block, near the other `@/` imports (e.g., directly above `import HealthPill from './HealthPill'`):

```js
import CardChip from '@/components/CardChip'
```

- [ ] **Step 3: Replace the header block**

Find this existing block (currently lines 178-188):

```jsx
{/* Header */}
<div className="flex items-center justify-between border-b border-border px-4 py-3">
  <h2 className="text-base font-semibold text-text-primary">Add a target</h2>
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

Replace with (matches the WhitelistModal/BlacklistModal header pattern — chip + h2 grouped, close button on the right):

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

- [ ] **Step 4: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/AddTargetSheet.jsx
```
Expected: zero errors.

- [ ] **Step 5: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/AddTargetSheet.jsx && git commit -m "feat(targeting): blue Crosshair chip header in AddTargetSheet

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Avatar polish on AddTargetSheet suggestion chips

**Files:**
- Modify: `src/pages/targeting/AddTargetSheet.jsx`

- [ ] **Step 1: Read the suggestion chip block**

Use `Read` on `src/pages/targeting/AddTargetSheet.jsx` to locate the suggestions block. It starts around line 326 with `{/* Suggestions — always visible … */}` and contains the `.map((s) => …)` rendering each chip.

- [ ] **Step 2: Replace the avatar `<span>` inside the chip**

Find this block inside the suggestions map (currently lines ~342-344):

```jsx
<span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-[11px] font-semibold text-text-secondary">
  {isHashtag ? <Hash className="h-3.5 w-3.5" aria-hidden="true" /> : letter}
</span>
```

Replace with (account branch now prefers a real `<img>` when present, with `ring-1 ring-border` so the avatar reads as an avatar, not a tile):

```jsx
<span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-[11px] font-semibold text-text-secondary ring-1 ring-border">
  {isHashtag ? (
    <Hash className="h-3.5 w-3.5" aria-hidden="true" />
  ) : s.profilePic ? (
    <img src={s.profilePic} alt="" className="h-full w-full object-cover" />
  ) : (
    letter
  )}
</span>
```

The `s.profilePic` reference is safe — `s` is the `.map` parameter and only account-mode suggestions hit this branch (hashtag mode falls into the `<Hash />` branch unconditionally). Account suggestions are pulled from `mockSuggestedTargets`, every entry of which has a `profilePic` field after Task 1.

- [ ] **Step 3: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/AddTargetSheet.jsx
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/AddTargetSheet.jsx && git commit -m "feat(targeting): real avatars on AddTargetSheet suggestions

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: BlacklistModal chip color → yellow

**Files:**
- Modify: `src/pages/targeting/BlacklistModal.jsx:135`

- [ ] **Step 1: Swap the CardChip color prop**

In `src/pages/targeting/BlacklistModal.jsx`, find this line (line 135):

```jsx
<CardChip color="neutral" icon={Ban} />
```

Replace with:

```jsx
<CardChip color="yellow" icon={Ban} />
```

- [ ] **Step 2: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/BlacklistModal.jsx
```
Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/BlacklistModal.jsx && git commit -m "feat(targeting): yellow chip header on BlacklistModal

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 5: WhitelistModal empty-state icon block

**Files:**
- Modify: `src/pages/targeting/WhitelistModal.jsx`

- [ ] **Step 1: Locate the empty-state block**

In `src/pages/targeting/WhitelistModal.jsx`, the current empty state is (lines 217-221):

```jsx
{draft.length === 0 && (
  <p className="py-4 text-center text-sm text-text-muted">
    No accounts whitelisted yet.
  </p>
)}
```

It sits inside `<div className="mt-4 flex max-h-72 flex-col divide-y divide-border overflow-y-auto">…</div>`. The `ShieldCheck` icon is already imported at the top of the file.

- [ ] **Step 2: Replace with the centered icon-block**

Replace the entire `{draft.length === 0 && (…)}` block with:

```jsx
{draft.length === 0 && (
  <div className="flex flex-col items-center gap-2 py-8 text-center">
    <span
      aria-hidden="true"
      className="flex h-14 w-14 items-center justify-center rounded-full bg-green-tint text-green-base"
    >
      <ShieldCheck className="h-7 w-7" />
    </span>
    <p className="text-sm font-medium text-text-primary">Whitelist is empty</p>
    <p className="max-w-[240px] text-xs text-text-secondary">
      Add usernames above to keep them safe from automatic unfollows.
    </p>
  </div>
)}
```

The outer `divide-y divide-border` rule on the parent only renders dividers between siblings — with one child, no divider draws.

- [ ] **Step 3: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/WhitelistModal.jsx
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/WhitelistModal.jsx && git commit -m "feat(targeting): centered icon-block empty state on WhitelistModal

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 6: BlacklistModal empty-state icon block

**Files:**
- Modify: `src/pages/targeting/BlacklistModal.jsx`

- [ ] **Step 1: Locate the empty-state block**

In `src/pages/targeting/BlacklistModal.jsx`, the current empty state is (lines 217-221):

```jsx
{draft.length === 0 && (
  <p className="py-4 text-center text-sm text-text-muted">
    No accounts blacklisted yet.
  </p>
)}
```

The `Ban` icon is already imported at the top of the file (used by the header chip).

- [ ] **Step 2: Replace with the centered icon-block**

Replace the entire `{draft.length === 0 && (…)}` block with:

```jsx
{draft.length === 0 && (
  <div className="flex flex-col items-center gap-2 py-8 text-center">
    <span
      aria-hidden="true"
      className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-tint text-yellow-base"
    >
      <Ban className="h-7 w-7" />
    </span>
    <p className="text-sm font-medium text-text-primary">Blacklist is empty</p>
    <p className="max-w-[240px] text-xs text-text-secondary">
      Add usernames above to keep them out of your engagement.
    </p>
  </div>
)}
```

- [ ] **Step 3: Lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src/pages/targeting/BlacklistModal.jsx
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add src/pages/targeting/BlacklistModal.jsx && git commit -m "feat(targeting): centered icon-block empty state on BlacklistModal

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Task 7: Final verification + changelog

**Files:**
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Repo-wide lint**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && node node_modules/.bin/eslint src --ext .js,.jsx
```
Expected: zero errors. Pre-existing warnings unchanged.

- [ ] **Step 2: Manual verification**

Spin up the dev server and walk every acceptance criterion:

- [ ] `AddTargetSheet` opens with a blue circle + `Crosshair` chip next to the H2.
- [ ] In Account mode, the Suggestions row shows real photos for `fitfluencer`, `healthyhabits`, `trainhard.daily`. The other two render the colored letter-circle fallback.
- [ ] Hashtag mode suggestions still show `Hash` icons in tinted circles (untouched).
- [ ] `WhitelistModal` opens. With an empty draft, shows a 56px green-tint circle with a `ShieldCheck` icon, headline "Whitelist is empty", subline about automatic unfollows. With entries, the list renders normally.
- [ ] `BlacklistModal` opens with a yellow `Ban` chip next to the H2 (was gray neutral). With an empty draft, shows a 56px yellow-tint circle with a `Ban` icon, headline "Blacklist is empty", subline about engagement. With entries, the list renders normally.
- [ ] Adding, removing, and saving still work in both list modals.

- [ ] **Step 3: Update `CHANGELOG.md`**

Insert a new dated section immediately under the `## 2026-05-05 — Targeting popup polish` block:

```markdown
## 2026-05-05 — Targeting modals visual identity

### Changed
- **`AddTargetSheet`**: header now leads with a blue `<CardChip color="blue" icon={Crosshair} />` so the modal has a recognizable identity anchor. Suggestion chips in account mode render real `profilePic` images (with letter fallback) and a 1px ring, so the chip reads as an avatar rather than a flat tile.
- **`BlacklistModal`**: chip swapped from `color="neutral"` to `color="yellow"` (`Ban` icon unchanged). Caution-tone identity that doesn't false-alarm the red error palette.
- **Empty states**: `WhitelistModal` and `BlacklistModal` now render a centered icon-block (56px tinted circle + headline + subline) when the list is empty. Replaces the bare-text "No accounts … yet." line.

### Mocks
- `src/mocks/suggestedTargets.js` — first 3 entries get pravatar URLs so the avatar branch is visible in dev; last 2 stay null so the fallback branch is exercised.
```

- [ ] **Step 4: Commit changelog**

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash" && git add CHANGELOG.md && git commit -m "docs: log targeting modals visual identity

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>"
```

---

## Self-review summary

**Spec coverage:**
- Spec §1 (color identity per modal) → Tasks 2 + 4. ✓
- Spec §2 (suggestion avatars) → Tasks 1 + 3. ✓
- Spec §3 (empty-state illustrations) → Tasks 5 + 6. ✓
- Acceptance criteria walked in Task 7. ✓

**Type / name consistency:**
- `CardChip` prop names (`color`, `icon`) consistent across Tasks 2 and 4.
- `profilePic` field name on suggestions consistent between Tasks 1 and 3.
- Empty-state JSX shape identical between Tasks 5 and 6 (only color, icon, and copy vary). ✓

**Placeholders:** None. Each step has the literal final code. ✓
