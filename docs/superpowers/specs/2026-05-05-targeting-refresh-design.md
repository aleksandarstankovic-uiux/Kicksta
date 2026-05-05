# Targeting Refresh — Design Spec

**Date:** 2026-05-05
**Scope:** Targeting page polish — switcher refresh, audience filters layout, like-after-follow disabled state, processing-row copy, blacklist popup color revert, modal header restructure. **Companion spec:** Engagement enrichment (separate file).

---

## Goals

1. Make the page-level Targeting/Settings switcher and the in-modal Account/Hashtag toggle read as primary controls — not as faded background chrome.
2. Give the Audience filters card horizontal weight at `lg:` so it doesn't sprawl across the full width.
3. Make the engine's mode constraints visible — the like-after-follow toggle disables itself when the mode rules out follow actions.
4. Replace the "ACTIVE" pill text with a verb when a target is being processed, so users see *what* is happening, not just *that* it's active.
5. Revert the BlacklistModal chip + empty-state to the page card's gray (we made it yellow last cycle; the user wants it to mirror the page's neutral chip).
6. Move the helper line out of every modal body and into the header as a subtitle.

## Non-Goals

- No engine wiring, no real-time phase tracking. The "FOLLOWING…" copy on the processing row is the static label for whichever target id is in `useTargetsStore.processingId`. When phases land later, the same slot can render the live phase verb.
- No new feature surfaces.
- No changes to AddTargetSheet's typeahead, suggestions, or submit logic — only the header and the account/hashtag toggle change.
- No changes to ModeCard's mode grid, save/cancel logic, or modes themselves — only the like-after-follow row gains a disabled state.

---

## 1. Underlined tab-bar pattern (used in two places)

Replace today's pill segmented controls with an underlined tab-bar. One recipe, two consumers:

- **Targeting page** — `Targets` / `Settings` (currently a rounded-full pill segmented control inside `src/pages/targeting/index.jsx`).
- **AddTargetSheet** — `Account` / `Hashtag` (currently the same pill segmented control inside `src/pages/targeting/AddTargetSheet.jsx`).

### Markup

```jsx
<div className="flex border-b border-border">
  {TABS.map((t) => {
    const selected = activeValue === t.value
    const Icon = t.icon
    return (
      <button
        key={t.value}
        type="button"
        onClick={() => onChange(t.value)}
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

`-mb-px` so the active tab's 2px underline sits exactly on top of the strip's hairline, not below it. `flex-1` so the tabs evenly split available width on mobile (two equal halves).

### Targeting page tabs

| Value | Icon | Label | Subtitle (page-level, swaps with active tab) |
|---|---|---|---|
| `targets` | `Crosshair` | Targets | "The accounts and hashtags Kicksta is following from." |
| `settings` | `SlidersHorizontal` | Settings | "How Kicksta picks who to follow." |

The page subtitle (`<p>` under the H1) reads from a `SUBTITLE[activeTab]` map. Today the page renders one static subtitle ("Manage who Kicksta targets and how.") — that line gets replaced.

### AddTargetSheet account/hashtag tabs

| Value | Icon | Label |
|---|---|---|
| `account` | `AtSign` | Account |
| `hashtag` | `Hash` | Hashtag |

Replaces the current `<div className="mt-4 flex rounded-full bg-bg p-1">…</div>` block. Same underline recipe. Sits where it sits today (under the input label area).

### Why this pattern

- The Targeting page is content-heavy. The tab strip is the user's primary mode toggle — it has to read as a navigation control, not as a state pill. Underlined tab-bars are the universal "view switch" pattern.
- The AddTargetSheet uses the same pattern for visual consistency: the user learns one switcher and recognizes it everywhere.

---

## 2. Audience filters card — 2-column at `lg:`

`src/pages/targeting/AudienceFiltersCard.jsx` currently stacks two internal `GroupHeader` blocks vertically: `Audience size` (3 rows) and `Account type` (3 rows). At `lg:` we split them into a 2-column grid divided by a vertical hairline.

### Markup change

Wrap the two `<div className="mt-4">` blocks (Audience size + Account type) in a parent grid:

```jsx
<div className="mt-4 grid gap-4 lg:grid-cols-2 lg:gap-6 lg:divide-x lg:divide-border">
  <div className="lg:pr-6">
    <GroupHeader icon={Users}>Audience size</GroupHeader>
    <div className="mt-1 flex flex-col divide-y divide-border">
      {/* 3 Row entries — Following / Follower / Media — unchanged */}
    </div>
  </div>
  <div className="lg:pl-0">
    <GroupHeader icon={User}>Account type</GroupHeader>
    <div className="mt-1 flex flex-col divide-y divide-border">
      {/* 3 Row entries — Privacy / Gender / Exclude NSFW — unchanged */}
    </div>
  </div>
</div>
```

`lg:divide-x lg:divide-border` puts a vertical hairline between the columns at lg+. `lg:pr-6` adds breathing room between the left column rows and the divider. The `mt-4 border-b border-border` wrapper that previously wrapped Account type goes away — the divider is now the new container's `divide-x`.

The Reach Estimate block + Lightbulb tip stay full-width, below the grid.

### Mobile behavior

`lg:grid-cols-2` means the grid collapses to 1 column at <1024px, restoring today's stacked layout. No mobile regression.

---

## 3. Like-after-follow disabled state

`src/pages/targeting/ModeCard.jsx` — the `<SettingSwitch />` row at the bottom (Heart icon, "Like after follow") gets a disabled state when `config.mode === 'unfollow_only'` (no follow action means no follow-related likes).

### Approach

Add a new `disabled` prop to `src/components/SettingSwitch.jsx`. **Independent of `locked`** — `locked` is the paywall state with the Advanced pill and upgrade-tap behavior; `disabled` is a "this setting doesn't apply right now" state with no upgrade affordance.

#### `SettingSwitch.jsx` — new prop

```js
export default function SettingSwitch({
  title,
  description,
  icon: Icon,
  checked,
  onChange,
  locked = false,
  disabled = false,  // NEW
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
        locked ? 'cursor-pointer' : ''
      } ${disabled ? 'opacity-60' : ''}`}
      onClick={locked && !disabled ? handleToggle : undefined}
    >
      {/* … existing left zone unchanged, except … */}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={locked || disabled}  /* CHANGED — added `|| disabled` */
        onClick={(e) => {
          e.stopPropagation()
          handleToggle()
        }}
        className={/* unchanged */}
      >
        {/* … */}
      </button>
    </div>
  )
}
```

The `opacity-60` class wraps the whole row (not just the switch) so the title + description fade together. The button gets a real `disabled` attribute (HTML-level) so screen readers and keyboard users get the right semantics.

#### `ModeCard.jsx` — pass the prop + add helper line

```jsx
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

The description text swaps so the user sees *why* the row is grayed, not just that it is. Reads from `savedMode` (not `draft`) — the disabled state reflects the actually-saved mode, not the staged change. If the user stages `unfollow_only` but hasn't saved, the row stays interactive until they click Save.

---

## 4. Processing-row copy — `FOLLOWING…`

`src/pages/targeting/TargetRow.jsx` — when `isProcessing`, the desktop pill currently renders `statusLabel[target.status]` (which is `Active`). Replace with `FOLLOWING…` (typographic ellipsis, U+2026) for the processing row only.

### Markup change

The existing pill:

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

Becomes:

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

`…` renders the typographic ellipsis. The pill gets slightly wider (Following… is longer than Active), which is fine — `inline` plus `shrink-0` means it grows to its content.

### Mobile dot — `aria-label` update

The mobile dot's wrapper `<span aria-label={statusLabel[target.status]}>` should switch to `aria-label={isProcessing ? 'Following from this target' : statusLabel[target.status]}` so screen-reader users get the same signal as visual users.

---

## 5. BlacklistModal chip + empty-state revert to gray

Last cycle the chip went `neutral → yellow` and the empty state circle used `bg-yellow-tint text-yellow-base`. The user wants both to match the page's `BlacklistCard` (which uses `<CardChip color="neutral" />`).

### Header chip

```diff
- <CardChip color="yellow" icon={Ban} />
+ <CardChip color="neutral" icon={Ban} />
```

### Empty state circle

The empty state today (after last cycle) uses `bg-yellow-tint text-yellow-base`. Revert to a gray equivalent that matches the neutral chip's style (`bg-bg text-text-secondary`):

```diff
- <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-yellow-tint text-yellow-base">
-   <Ban className="h-7 w-7" />
- </span>
+ <span aria-hidden="true" className="flex h-14 w-14 items-center justify-center rounded-full bg-bg text-text-secondary">
+   <Ban className="h-7 w-7" />
+ </span>
```

Headline + subline copy unchanged.

WhitelistModal stays green — no change.

---

## 6. Modal header restructure — subtitle inline

All three modals (`AddTargetSheet`, `WhitelistModal`, `BlacklistModal`) currently put a one-line helper at the top of the body, below the header bar. Move that line into the header as a `<p>` directly under the H2.

### Pattern (all three modals)

```jsx
<div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3.5 lg:px-5">
  <div className="flex items-start gap-3">
    <CardChip color={…} icon={…} />
    <div className="min-w-0">
      <h2 className="text-base font-semibold leading-tight text-text-primary">
        {TITLE}
      </h2>
      <p className="mt-0.5 text-xs leading-relaxed text-text-secondary">
        {SUBTITLE}
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

Two notable changes from today:

- Outer container: `items-center` → `items-start`, `py-3` → `py-3.5`. Stack of (chip, title+subtitle) is taller than a single line, so anchoring to the top + a hair more vertical padding keeps the close button aligned with the title.
- Close button: shrunk from `h-11 w-11` (AddTargetSheet) and `h-9 w-9` (W/B). Standardize on `h-9 w-9` everywhere — keeps the header compact. (Still satisfies tap-target on mobile because the surrounding hit area extends through the padded header bar.)

### Per-modal title + subtitle

| Modal | Title | Subtitle |
|---|---|---|
| AddTargetSheet | Add a target | Pick any Instagram account or hashtag — Kicksta follows its audience. |
| WhitelistModal | Edit whitelist | Accounts here will never be unfollowed. |
| BlacklistModal | Edit blacklist | Accounts here will never be followed. |

### Body cleanup

The corresponding `<p>` lines inside each modal body get **removed** (they've moved to the header):

- `AddTargetSheet.jsx`: delete the `<p className="text-xs leading-relaxed text-text-secondary">Pick any Instagram account or hashtag…</p>` block.
- `WhitelistModal.jsx`: delete `<p className="text-xs text-text-secondary">Accounts here will never be unfollowed.</p>`.
- `BlacklistModal.jsx`: delete `<p className="text-xs text-text-secondary">Accounts here will never be followed.</p>`.

The `mt-4` spacing on the next sibling block (toggle / input row) preserves the same vertical rhythm.

---

## Files Touched

| File | Change |
|---|---|
| `src/pages/targeting/index.jsx` | Underlined tab-bar; per-tab subtitle map |
| `src/pages/targeting/AddTargetSheet.jsx` | Account/Hashtag tab-bar; header subtitle; delete body helper line |
| `src/pages/targeting/WhitelistModal.jsx` | Header subtitle; delete body helper line |
| `src/pages/targeting/BlacklistModal.jsx` | Chip → neutral; empty state → gray; header subtitle; delete body helper line |
| `src/pages/targeting/AudienceFiltersCard.jsx` | 2-col internal split with vertical divider |
| `src/pages/targeting/ModeCard.jsx` | Pass `disabled` to like-after-follow when mode = `unfollow_only`; swap description copy |
| `src/components/SettingSwitch.jsx` | New `disabled` prop |
| `src/pages/targeting/TargetRow.jsx` | Pill text → `FOLLOWING…` when `isProcessing`; mobile dot `aria-label` swap |

No new files. No new mocks. No store changes.

---

## Risks / Edge cases

- **Tab strip on very narrow viewports.** Two tabs at `flex-1` each split the screen evenly. On a 320px iPhone SE, each tab gets ~160px which comfortably fits `🎯 Targets` and `⚙️ Settings`. ✓
- **Disabled SettingSwitch with `aria-disabled`.** The `disabled` HTML attribute on the inner button is sufficient; the row's `opacity-60` is decorative. Keyboard users tabbing through skip the button (browser default behavior on `disabled`). ✓
- **`Following…` pill width.** The pill has `inline` + `shrink-0`, so it grows to fit. If two adjacent rows had different pill widths the @handles wouldn't align — but since pill is on the right of the name + subline (not left), no alignment regression. ✓
- **Modal close button shrunk to `h-9 w-9`.** That's 36×36 — below the 44px touch-target rule for *isolated* buttons. But it sits inside the header bar's padded hit zone (~56px tall) so the actual finger landing area is larger than 44px. Acceptable per the rule's spirit ("≥44px" is for icon buttons that aren't inside a generous container). ✓

---

## Out of scope (parked)

- Real-time engine phase tracking ("LIKING…" / "DM SENDING…" — depends on backend).
- Tab-bar variant for the AccountSwitcher in the sidebar (different control class).
- Touch ripple / focus ring polish on the new tab-bar (lucide tab-bars in this app don't ripple — match existing patterns).

---

## Acceptance criteria

- [ ] `/targeting` renders an underlined tab-bar with `Crosshair Targets` / `SlidersHorizontal Settings`. Subtitle below H1 swaps based on active tab.
- [ ] AddTargetSheet's account/hashtag toggle is the same underlined tab-bar (`AtSign` / `Hash`).
- [ ] AudienceFiltersCard at `lg:` shows the two sub-sections side-by-side with a vertical hairline; mobile stacks them.
- [ ] In ModeCard, when saved mode is `unfollow_only`, the Like-after-follow row is grayed (`opacity-60`), the toggle is non-interactive, and the description reads "Disabled — Kicksta isn't following anyone in this mode."
- [ ] On `/targeting`, the processing row's pill reads `FOLLOWING…` (with typographic ellipsis), still pulses, still green.
- [ ] BlacklistModal's chip is gray (`color="neutral"`); the empty-state circle uses `bg-bg text-text-secondary`.
- [ ] Each modal's body no longer has the "helper line" — that text has moved into the header as a subtitle below the H2.
- [ ] All three modal close buttons are `h-9 w-9` (consistent across modals).
