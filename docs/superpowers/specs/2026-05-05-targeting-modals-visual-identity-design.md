# Targeting Modals Visual Identity — Design Spec

**Date:** 2026-05-05
**Scope:** Polish the three Targeting modals — `AddTargetSheet`, `WhitelistModal`, `BlacklistModal` — so each has a distinct color identity, suggestion chips show real avatars, and empty states feel finished.

---

## Goals

1. Give each modal a recognizable color identity at the chip-header level so the user can place which modal they're in at a glance.
2. Make the existing suggestion surface in `AddTargetSheet` look like the real product — small profile avatars, not letter-in-a-circle placeholders.
3. Replace the bare-text empty states in `WhitelistModal` and `BlacklistModal` with a centered icon-block so the modal has visual weight even when its list is empty.

## Non-Goals

- No new product surfaces. Whitelist and Blacklist do **not** get suggestion sections — they are user-curated lists.
- No new mock files. Existing mocks gain a few `profilePic` URLs.
- No copy changes outside the new empty-state headlines and sublines.
- No keyboard / a11y changes beyond the obvious (`alt=""` on decorative avatar `<img>`s).

---

## 1. Color identity per modal

Each modal opens with a `<CardChip>` next to its H2 — the chip is the modal's identity anchor.

| Modal | Chip props | Notes |
|---|---|---|
| `AddTargetSheet` | `<CardChip color="blue" icon={Crosshair} />` | Currently has no chip. Header restructured to match Whitelist / Blacklist. |
| `WhitelistModal` | `<CardChip color="green" icon={ShieldCheck} />` | Already correct — left untouched. |
| `BlacklistModal` | `<CardChip color="yellow" icon={Ban} />` | Currently `color="neutral"`. Change to `"yellow"`. |

### Why blue / green / yellow

- **Blue** = additive primary action (matches the "Add target" CTA's blue fill).
- **Green** = allow / protect (whitelist meaning).
- **Yellow** = caution (blacklist is a user-controlled exclusion, not an error). Per CLAUDE.md the red palette is reserved for error / disconnected / destructive failure — using red here would mis-signal that the action itself is dangerous, which it isn't.

### `AddTargetSheet` header diff

Current:

```jsx
<div className="flex items-center justify-between border-b border-border px-4 py-3">
  <h2 className="text-base font-semibold text-text-primary">Add a target</h2>
  <button …>{/* close */}</button>
</div>
```

New (mirrors Whitelist's `<div className="flex items-center gap-3">…</div>` pattern):

```jsx
<div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
  <div className="flex items-center gap-3">
    <CardChip color="blue" icon={Crosshair} />
    <h2 className="text-base font-semibold text-text-primary">Add a target</h2>
  </div>
  <button …>{/* close */}</button>
</div>
```

Imports change: add `Crosshair` to the lucide import line and `import CardChip from '@/components/CardChip'` to the imports block.

### `BlacklistModal` chip diff

```diff
- <CardChip color="neutral" icon={Ban} />
+ <CardChip color="yellow" icon={Ban} />
```

`CardChip`'s yellow branch is already supported (the `bg-yellow-tint text-yellow-base` literal is in the file's content-scan list). No CardChip changes needed.

---

## 2. Suggestion chip avatars (`AddTargetSheet` only)

Inside the existing `Suggestions` wrap-flex (around line 330 in the current file), the chip currently renders this avatar block for accounts:

```jsx
<span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-bg text-[11px] font-semibold text-text-secondary">
  {isHashtag ? <Hash className="h-3.5 w-3.5" aria-hidden="true" /> : letter}
</span>
```

Replace the account branch (`!isHashtag`) with a real-avatar-with-fallback:

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

The `ring-1 ring-border` is added so the avatar reads as an avatar, not a flat tile, when an image is present.

### Mock data — add `profilePic` URLs

`src/mocks/suggestedTargets.js` already has `profilePic: null` on all 5 entries. Replace `null` with a deterministic URL on at least 3 of them so the avatar branch is visibly exercised in dev. Use [pravatar.cc](https://pravatar.cc) — it's a public stable placeholder service that returns a real photo per `?u=<seed>`. (Existing `accounts.js` uses a single local `/mock-avatar.jpg` for one entry; pravatar is chosen here so each suggestion chip has a visibly different photo.)

Updated entries:

```js
export const mockSuggestedTargets = [
  { username: 'fitfluencer', followers: 84200, profilePic: 'https://i.pravatar.cc/80?u=fitfluencer' },
  { username: 'healthyhabits', followers: 52100, profilePic: 'https://i.pravatar.cc/80?u=healthyhabits' },
  { username: 'trainhard.daily', followers: 39800, profilePic: 'https://i.pravatar.cc/80?u=trainhard' },
  // last two stay null so the letter-fallback branch keeps coverage
  { username: 'nutrition.nerd', followers: 22400, profilePic: null },
  { username: 'homegymhero', followers: 18700, profilePic: null },
]
```

`mockSuggestedHashtags` is untouched — hashtags don't have profile pictures.

---

## 3. Empty-state illustrations

Replaces the single line of muted text in `WhitelistModal` and `BlacklistModal` with a centered icon-block. Same structural recipe both modals; only the icon and color change.

### Markup

```jsx
<div className="flex flex-col items-center gap-2 py-8 text-center">
  <span
    aria-hidden="true"
    className="flex h-14 w-14 items-center justify-center rounded-full bg-{COLOR}-tint text-{COLOR}-base"
  >
    <{ICON} className="h-7 w-7" />
  </span>
  <p className="text-sm font-medium text-text-primary">{HEADLINE}</p>
  <p className="max-w-[240px] text-xs text-text-secondary">{SUBLINE}</p>
</div>
```

### Per-modal values

| Modal | `{COLOR}` | `{ICON}` | `{HEADLINE}` | `{SUBLINE}` |
|---|---|---|---|---|
| Whitelist | `green` | `ShieldCheck` | `Whitelist is empty` | `Add usernames above to keep them safe from automatic unfollows.` |
| Blacklist | `yellow` | `Ban` | `Blacklist is empty` | `Add usernames above to keep them out of your engagement.` |

### Where it slots in

`WhitelistModal` — replace this block (lines 217-221 in the current file):

```jsx
{draft.length === 0 && (
  <p className="py-4 text-center text-sm text-text-muted">
    No accounts whitelisted yet.
  </p>
)}
```

Same shape in `BlacklistModal`.

The empty-state block sits inside the existing `<div className="mt-4 flex max-h-72 flex-col divide-y divide-border overflow-y-auto">` list container. The list container's `max-h-72` is irrelevant when the empty state renders (its content is shorter), but we should remove the `divide-y divide-border` styling effect by simply NOT rendering the divider for the empty case — the `&&` guard already does that since the `<p>` was the only child.

---

## Files touched

| File | Change |
|---|---|
| `src/pages/targeting/AddTargetSheet.jsx` | Header gets `CardChip` + `Crosshair` import; suggestion chip avatar branch swapped |
| `src/pages/targeting/WhitelistModal.jsx` | Empty state replaced with centered icon-block |
| `src/pages/targeting/BlacklistModal.jsx` | `CardChip color="neutral"` → `"yellow"`; empty state replaced with centered icon-block |
| `src/mocks/suggestedTargets.js` | Three entries get pravatar URLs; two stay null for fallback coverage |

No changes to `CardChip`, `BlacklistModal`'s logic, `WhitelistModal`'s logic, or any store.

---

## Risks / Edge cases

- **Pravatar reliability.** If pravatar.cc is unreachable or rate-limited in dev, the `<img>` falls through with a broken-image icon. Acceptable for V1 mock — when real IG data lands these URLs are replaced with CDN-served avatars. If a placeholder is needed offline, swap to `https://api.dicebear.com/7.x/initials/svg?seed=<username>` (no network shape change).
- **Yellow chip in dark mode.** `bg-yellow-tint text-yellow-base` is the existing CardChip recipe and works in both themes per the design tokens — already validated by other surfaces using the yellow CardChip.
- **Empty state during scroll.** The empty block sits inside a `max-h-72 overflow-y-auto` container. The block is shorter than 72 (~288px), so no scroll triggers. ✓

---

## Out of scope (parked for follow-up)

- Suggestion sections inside `WhitelistModal` / `BlacklistModal`. Considered and rejected during brainstorm — they are user-curated lists, not browse surfaces.
- Custom inline SVG illustrations. Considered and rejected — the codebase leans on lucide everywhere, and the chip-icon-as-empty-state visual maintains continuity.
- Animated transitions on the empty-state block.
- Hashtag profile pictures (no real-world equivalent).

---

## Acceptance criteria

- [ ] Opening `AddTargetSheet` shows a blue `Crosshair` chip next to the H2.
- [ ] Opening `BlacklistModal` shows a yellow `Ban` chip next to the H2 (was gray neutral).
- [ ] In `AddTargetSheet`'s account-mode Suggestions section, at least 3 chips render real avatar photos with a 1px ring; the rest fall back to a colored letter circle.
- [ ] `WhitelistModal` empty state shows a 56px green-tint circle with a `ShieldCheck` icon, headline, and subline.
- [ ] `BlacklistModal` empty state shows the same recipe in yellow with a `Ban` icon.
- [ ] No regression in the modals' interactive flows (typeahead, add, remove, save).
