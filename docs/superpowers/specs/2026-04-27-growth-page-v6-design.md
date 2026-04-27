# Growth page — v6 design

> Second cohesion pass. v5 shipped but still felt disconnected from the rest of the dashboard. This spec adopts a unified chrome vocabulary (tinted icon chips per card), reshapes the page opener (Mode hero), enriches the Engagement card with embedded previews/animations, fuses Lists into one card with halves, redesigns the Filters modal for legibility, and removes the LiveActivityStrip (configuration page — status doesn't belong here).

---

## Goals

1. Make every card feel like a sibling of Overview's cards. Same chip pattern, same color tokens, same density.
2. Eliminate the top-of-page text bloat (H1 + sub + H2 + sub before any interaction).
3. Replace card *subtitles* with `Info` tooltips next to the title — fewer words, same explainability.
4. Give the Engagement card *content* when its features are on (Welcome DM preview, Close Friends progress + ticker), not just toggles.
5. Make the Filters modal legible at a glance: wider, two-column on desktop, dropdowns instead of preset/custom toggling.
6. Stop the Whitelist/Blacklist height variance by fusing them into one card with two halves.
7. Drop the LiveActivityStrip — settings page, no live status.

## Non-goals

- No new functional dials or settings. Every existing setting is preserved.
- No analytics/metrics on this page (still a configuration surface).
- Full Growth+ subscription management UI remains out of scope; the `/account/growth-plus` stub from v5 stays.
- No animation in the Mode card. Static.

---

## Page layout

### Desktop

```
H1 "Growth"

┌─── Mode hero (full width) ────────────────────────────────────────────┐
│  [Blue chip] Mode   ⓘ           "Within IG limits ✓" pill (top-right) │
│                                                                        │
│  [Auto card]   [Follow-only]   [Unfollow-only]                         │
│   (RECOMMENDED)                                                        │
└────────────────────────────────────────────────────────────────────────┘

┌── Engagement (left, green chip) ────┐  ┌── Lists (right) ──────────────┐
│ Like after follow                   │  │ Whitelist (green chip) | Blacklist (neutral chip)
│ Welcome DM                          │  │ N protected            | N blocked
│   ↳ chat-bubble preview + Edit btn  │  │ entries…               | entries…
│ Close Friends Adder                 │  │ + add row              | + add row
│   ↳ progress bar + handle ticker    │  │                                              │
└─────────────────────────────────────┘  │  (Single card; two halves separated by      │
                                         │   vertical divider on desktop, stacked on    │
┌── Filters (left, yellow chip) ──────┐  │   mobile. Card height = max of both halves.)│
│ Audience size                       │  │                                              │
│ Account type                        │  │                                              │
│ Edit (top-right)                    │  │                                              │
└─────────────────────────────────────┘  └────────────────────────────────────────────┘

GrowthPlusBanner (purple, shared with Overview — unchanged from v5)
```

### Mobile

Single column, in this order: H1 → Mode hero → Engagement → Filters → Lists → GrowthPlusBanner.

---

## 1. Chrome system — tinted icon chip per card

Every settings card gets a header layout:

```
[Chip 36×36, rounded-lg, bg-<color>-tint] · "Card title" + InfoTooltip · (right-side action)
```

Chip recipe: `flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-<color>-tint text-<color>-base`. Icon is 18px (`h-[18px] w-[18px]`).

**Title row recipe:** `flex items-start gap-3` with chip on left, title block in middle, optional action on right.

**No subtitles inside cards.** The `<p className="text-sm text-text-secondary">…</p>` lines under titles are removed everywhere on this page. Each title is followed by an `InfoTooltip` that surfaces the explanation on hover/focus.

### Color assignments

| Card | Chip color | Icon | Rationale |
|------|------------|------|-----------|
| Mode hero | `blue` | `Settings2` | Configuration / how Kicksta operates |
| Engagement | `green` | `Heart` | Positive interaction with new followers |
| Filters | `yellow` | `SlidersHorizontal` | Gating / restrictions / who is targeted |
| Lists (outer card) | no outer chip; two inner halves carry their own | — | Avoids competing chips |
| Whitelist (left half) | `green` | `ShieldCheck` | Protective |
| Blacklist (right half) | neutral (`bg-bg`, `text-text-secondary`) | `Ban` | Avoid using `red` (CLAUDE.md reserves red for errors only) |

### `InfoTooltip` reuse

There is already an `InfoTooltip` defined inside `FiltersModal.jsx` (line 37). Move it to `src/components/InfoTooltip.jsx` and reuse everywhere on the page. Same hover/focus visibility, same content shape (a single `text` prop). No layout changes to the existing implementation.

Tooltip copy per card (use the v5 subtitle as the tooltip body):

| Card | Tooltip text |
|------|--------------|
| Mode | "How Kicksta grows your account. You can change this any time." |
| Engagement | "How Kicksta interacts with new followers." |
| Filters | "Who Kicksta targets." |
| Lists (no outer chip — no outer tooltip) | — |
| Whitelist (half) | "Accounts Kicksta will never unfollow." |
| Blacklist (half) | "Accounts Kicksta will never follow." |

---

## 2. Page opener — Mode hero

- Page H1 stays "Growth". The page subtitle ("Configure how Kicksta grows your account.") is **removed**. The H1 is followed directly by the Mode hero card with `mt-4` separation.
- Mode card becomes the page opener: blue chip + "Mode" + InfoTooltip on the left of the header row, "Within IG limits" pill on the right.
- "Within IG limits" pill recipe: `inline-flex items-center gap-1 rounded-full bg-green-tint px-2.5 py-1 text-xs font-medium text-green-text` with a `Check` icon (12px) on the left. This pill replaces the standalone Shield+text safety footer from v5.
- The 3 mode option cards (Auto / Follow-only / Unfollow-only) sit below the header row in their existing 3-column grid (`grid gap-3 lg:grid-cols-3`). Existing selected/unselected styles unchanged.
- Mobile: header row stacks (chip+title on top, "Within IG limits" pill on a new line below it). Mode option cards stack vertically.

### Removed

- Standalone Shield+text safety line at the bottom of v5's ModeCard.
- Page subtitle under the H1.

---

## 3. Engagement card — expanding sub-rows

Card shell uses the chrome system from §1 (green chip + Heart icon + InfoTooltip).

The 3 toggle rows themselves keep the existing `SettingSwitch` component. The icons-per-row from v5 stay (Heart on the row itself feels redundant with the green chip — see §3a).

### 3a — Per-row icon: keep but switch tone

Per-row Lucide icons inside `SettingSwitch` rows are kept. They render in `text-text-secondary` (neutral). The card-level color is carried by the chip; the row icons are wayfinding only.

### 3b — Welcome DM preview row

When `welcomeDm.enabled === true` AND user is on Advanced (i.e. row is unlocked), the row expands to show:

```
┌────────────────────────────────────────────────────┐
│   ╭──── chat bubble (bg-blue-tint, rounded-2xl) ─╮ │
│   │  Hey! Thanks for the follow 🙌 Check out our│ │
│   │  latest drop → link in bio                  │ │
│   ╰─────────────────────────────────────────────╯ │
│                                                    │
│   [✏️ Edit message]  ← filled blue button, h-8     │
└────────────────────────────────────────────────────┘
```

- Bubble: `rounded-2xl rounded-tl-sm bg-blue-tint px-3 py-2 text-sm text-text-primary` (Instagram-style speech bubble).
- Bubble shows the *full* `welcomeDm.message` from the store, but visually clamped to 2 lines via `line-clamp-2` so the card stays compact.
- Edit button: filled style — `inline-flex h-8 items-center gap-1.5 rounded-lg bg-blue-base px-3 text-xs font-medium text-white hover:opacity-90`. Pencil icon (12px) on the left. Replaces v5's muted text link.
- Container: `mt-2 ml-7 flex flex-col gap-2` (indent under the row icon column).

When the toggle is locked (Growth plan), the row stays as the locked row from v5 — no preview block.

### 3c — Close Friends progress + handle ticker

When `closeFriendsAdder.enabled === true` AND row is unlocked, the row expands to show:

```
┌──────────────────────────────────────────────────────┐
│  Add new followers / Remove unfollowers (segmented)  │
│                                                      │
│  ┌─ Progress strip ──────────────────────────────┐   │
│  │ "127 of 482 followers added"                  │   │
│  │ ▓▓▓▓▓▓▓▓░░░░░░░░░░░░░  26% (green base bar)   │   │
│  └───────────────────────────────────────────────┘   │
│                                                      │
│  Adding @sample.handle…  (animate-pulse, ticks 4-5s) │
└──────────────────────────────────────────────────────┘
```

- Segmented Add/Remove control: keep existing v5 implementation.
- Progress strip:
  - `mt-3 rounded-lg bg-bg p-3`
  - Top line: "{added} of {total} followers added" — `text-xs font-medium text-text-primary`.
  - Bar: `h-1.5 w-full rounded-full bg-border` container, inner `h-full rounded-full bg-green-base transition-[width] duration-500` filled to `(added/total) * 100%`.
  - Mock values: pull from a new mock `mockCloseFriendsProgress = { added: 127, total: 482 }` in `src/mocks/growthConfig.js`.
- Ticker line:
  - `mt-2 flex items-center gap-2 text-xs text-text-secondary`
  - `animate-pulse` on the entire line during the "adding" state.
  - Cycles through 5 mock handles every ~4s (`setInterval` cleared on unmount). Mock handle list: `['@taylor.fit', '@noah.brews', '@maya.studio', '@kai.rides', '@lena.chefs']` — added to `mockGrowthConfig` as `closeFriendsRecentHandles`.
  - Copy: `"Adding {handle}…"` (only when `mode === 'add'`). When `mode === 'remove'`, copy reads `"Removing {handle}…"`. Same handle list.
- Hidden when the toggle is off, regardless of mode.

When the row is locked, the entire expanded section is omitted (locked row stays compact).

### 3d — "Like after follow" stays compact

No expanded state. Just the toggle row.

---

## 4. Filters card + modal

### 4a — Filters card (read-only display)

The card itself simplifies — the v5 grouping (`Audience size` / `Account type`) is preserved, but each row drops the per-row icon (icons now live on the modal's section headers instead, see §4b). Card chrome uses the yellow chip + `SlidersHorizontal` icon + `InfoTooltip`. Top-right `Edit` button unchanged.

Reason for dropping per-row icons on the read-only card: with the card-level yellow chip already establishing identity, the per-row icons compete for attention and the text rows read more cleanly without them.

### 4b — Filters modal redesign

Redesigned for legibility. Key changes:

- **Wider:** `max-w-2xl` (was `max-w-md`).
- **Two-column desktop layout:** `lg:grid lg:grid-cols-2 lg:gap-6`. Mobile single-column.
- **Section headers:** `AUDIENCE SIZE` (with `Users` icon) on the left column, `ACCOUNT TYPE` (with `User` icon) on the right column. Headers are `text-[11px] font-semibold uppercase tracking-wide text-text-muted` with the icon at 14px in `text-text-secondary`, gap 2.
- **Range filters (Following / Follower / Media): replaced with a dropdown.**
  - Dropdown shows the existing presets as options + a "Custom…" option at the bottom.
  - Closed dropdown: `flex h-10 w-full items-center justify-between rounded-lg border border-border bg-surface px-3 text-sm text-text-primary` with a `ChevronDown` icon on the right.
  - Open: native `<select>` element styled to match. Use the OS-native dropdown for accessibility — no custom popover.
  - When the user picks "Custom…", a row of two number inputs (Min / Max) appears below the dropdown with a `mt-2 flex gap-2` layout. Each input is `h-10 flex-1 rounded-lg border border-border px-3 text-sm`. The inputs are persistent while "Custom…" is selected — no further mode-toggling, so nothing jumps mid-edit.
  - Any non-Custom selection hides the Min/Max inputs.
- **Privacy + Gender: bigger segmented pills.**
  - Pill group `inline-flex rounded-full bg-bg p-1`, each pill `inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium`. Selected: `bg-surface text-text-primary shadow-sm`. Unselected: `text-text-secondary hover:text-text-primary`.
  - This replaces the smaller pills of v5.
- **Exclude NSFW: dedicated row with `SettingSwitch`** instead of a small pill control. Title "Exclude NSFW", no subtitle. Tooltip describes the behavior. Lives at the bottom of the right column in the desktop grid, full-width on mobile.
- **Cancel / Save footer**: unchanged from v5 (local draft + Save commits via existing setters).
- **Field labels:** each field gets a `text-sm font-medium text-text-primary` label above its control. Plan-locked rows (Gender) keep the `Advanced` pill beside the label and the muted-overlay/upgrade-tap behavior.
- **Spacing:** vertical gap between fields is `gap-5` inside each column (was `py-3 border-b`). No dividers — gap carries the rhythm.
- **Removed:** `PresetRangePills` component (logic absorbed into the dropdown). Delete `src/pages/growth/PresetRangePills.jsx`.

### 4c — Modal animation

Same mounted + 2× rAF + `translate-y-4 → 0` animation pattern as today. Only difference is the `max-w-2xl` width on desktop.

---

## 5. Lists — single fused card with two halves

### 5a — Card shell

- Single card titled "Lists" (no chip on the outer header — the two halves carry their chips).
- Outer card title row: `text-base font-semibold text-text-primary` left, no right-side action.
- Below the title: a 2-column flex grid on desktop (`lg:grid-cols-2 lg:divide-x lg:divide-border`), stacked single-column on mobile (`divide-y divide-border`).
- Card recipe unchanged: `rounded-xl border border-border bg-surface p-4 lg:p-5`.

### 5b — Each half (Whitelist / Blacklist)

```
┌─ Whitelist half ──────────────────────┐
│ [green chip · ShieldCheck]            │
│ Whitelist                             │
│ N accounts protected                  │
│ ────────────────────────────────────  │
│ entry · entry · entry…                │
│ ────────────────────────────────────  │
│ + Add account (text button, blue)     │
│ • Edit (top-right of the half)        │
└───────────────────────────────────────┘
```

- Chip + title + InfoTooltip top of the half. `Edit` button (Pencil ghost) in the top-right of the half (each half has its own button, opens its own modal).
- Count line below title: `N accounts protected` / `N accounts blocked` in `text-xs uppercase tracking-wide text-text-muted`.
- Entry list: same line-per-entry as v5; `text-sm text-text-primary`.
- Half padding: `p-4` on each side; on desktop the divider is `lg:divide-x` between halves.

### 5c — Modals stay (one per half)

`WhitelistModal` and `BlacklistModal` from v5 stay unchanged. They open from the per-half Edit button. Save behavior unchanged.

### 5d — Layout balancing

The fused Lists card sits in the **right column**, spanning the height of Engagement + Filters in the left column on desktop. Because the Lists card is one container, its height is the max of (Whitelist half, Blacklist half) plus chrome — predictable and tall.

---

## 6. LiveActivityStrip — removed

- Delete `src/pages/growth/LiveActivityStrip.jsx`.
- Remove import + render from `src/pages/growth/index.jsx`.
- The page now goes directly from the 2×2 grid to the Growth+ banner. No status surfaces on this page.

---

## File changes summary

**Created**
- `src/components/InfoTooltip.jsx` — extracted from FiltersModal, reused across the page.
- `src/components/CardChip.jsx` — small chip primitive: `<CardChip color="blue" icon={Settings2} />`. Used by Mode hero and every settings card.
- `src/pages/growth/CloseFriendsProgress.jsx` — progress bar + handle ticker subcomponent (kept separate so EngagementCard stays focused on toggle wiring).

**Modified**
- `src/pages/growth/index.jsx` — drop H1 subtitle, drop LiveActivityStrip render, fuse lists into one card render, set up new layout.
- `src/pages/growth/ModeCard.jsx` — chrome (chip + tooltip + within-limits pill); drop standalone safety footer.
- `src/pages/growth/EngagementCard.jsx` — chrome; drop subtitle; expand Welcome DM and Close Friends rows.
- `src/pages/growth/WelcomeDmPreview.jsx` (new file split out of EngagementCard) — chat-bubble + edit button.
- `src/pages/growth/FiltersCard.jsx` — chrome; drop subtitle; drop per-row icons.
- `src/pages/growth/FiltersModal.jsx` — wider, 2-col, dropdown-based ranges, larger segmented pills, NSFW as switch row.
- `src/pages/growth/ListsCard.jsx` (new file replacing the two-card pair) — single fused container with two halves.
- `src/pages/growth/WhitelistHalf.jsx` (new) — chip + entries + Edit + Add inside the fused card.
- `src/pages/growth/BlacklistHalf.jsx` (new) — same.
- `src/mocks/growthConfig.js` — add `mockCloseFriendsProgress` (`{added: 127, total: 482}`) and `closeFriendsRecentHandles` (5 mock handles).

**Deleted**
- `src/pages/growth/LiveActivityStrip.jsx`
- `src/pages/growth/PresetRangePills.jsx`
- `src/pages/growth/WhitelistCard.jsx` (replaced by `WhitelistHalf.jsx` inside fused card)
- `src/pages/growth/BlacklistCard.jsx` (replaced by `BlacklistHalf.jsx` inside fused card)

`WhitelistModal` and `BlacklistModal` stay unchanged.

---

## Acceptance criteria

1. Page H1 has no subtitle.
2. Every card on the page has a tinted icon chip in its header. No card displays a `text-sm text-text-secondary` subtitle below its title.
3. Each card title has an adjacent `InfoTooltip` carrying the v5 subtitle copy.
4. Mode card opens the page directly under the H1, with a "Within IG limits" pill in the top-right and no standalone safety line at the bottom.
5. Engagement Welcome DM row, when on, shows a chat-bubble preview of the message + a filled blue "Edit message" button.
6. Engagement Close Friends row, when on, shows a green progress bar (`127/482 = 26%`) and a pulsing "Adding @handle…" ticker that cycles every ~4s through 5 mock handles.
7. FiltersModal is `max-w-2xl` on desktop, two-column, uses dropdowns for ranges (with a "Custom…" option that reveals Min/Max inputs), bigger segmented pills for Privacy/Gender, and a switch row for Exclude NSFW.
8. Whitelist + Blacklist render inside one fused card with two halves; the right column is one card matching Engagement + Filters height on the left.
9. LiveActivityStrip is gone — no status surfaces appear on the Growth page.
10. No additions of metric tiles, charts, or historical data. The page remains a configuration surface.

---

## Open questions / deferred

- **Close Friends progress is mocked** — values come from `mockGrowthConfig`, not a real API. Real progress wiring is a future spec.
- **Welcome DM preview clamp** — 2-line clamp via `line-clamp-2`; longer messages reveal in the modal. Confirm during visual review.
- **Bigger Filters modal interaction with mobile** — at `max-w-2xl` desktop and full-width mobile, the 2-col grid collapses to 1-col on mobile. Modal still uses the bottom-sheet pattern below `lg:`. No new mobile UX; just visual review.
