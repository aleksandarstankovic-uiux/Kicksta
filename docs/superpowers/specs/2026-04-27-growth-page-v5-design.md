# Growth page — v5 design

> Visual cohesion + readability pass. Resolves seven pieces of feedback: page feels disconnected from the rest of the dashboard, empty space at the bottom, SafetyStrip too prominent, information hard to read, lists not separated, Growth+ banner not matching homepage, and the page needing more visual energy.

---

## Goals

1. Make Growth visually feel like a sibling of Overview, not a separate product surface.
2. Keep the page's job intact: it is a **configuration** surface, not an analytics surface. No metric tiles, no historical data, no charts.
3. Add visual structure to dense settings (Filters, Engagement, Lists) so the eye has anchors.
4. Fill the bottom with a single piece of *settings-native* live energy (proof your config is running) rather than padding or imported analytics.
5. Reuse Overview's Growth+ banner so the two pages share marketing surface.

## Non-goals

- No identity/account header at the top of the page (Overview owns identity).
- No metric tiles, historical numbers, or charts on Growth.
- No new functional dials. Existing Filters / Lists / Engagement / Mode functionality is unchanged — this is a presentation pass plus a banner share plus one new live strip.
- Full Growth+ subscription management UI is out of scope; we scaffold a stub route only.

---

## Page layout (desktop)

```
Page title — "Growth" + sub
Mode card (full width, 3 elevated options + small inline safety line)
┌── Engagement (left) ─────────────┬── Whitelist (right, green-tint accent) ─┐
│                                   ├── Blacklist (right, neutral) ──────────┤
│ Filters (left, icon rows + groups)│                                         │
└───────────────────────────────────┴─────────────────────────────────────────┘
Live "Settings in action" strip (full width)
Growth+ banner (full width — shared component with Overview)
```

Mobile stacks single column in this order: Mode → Engagement → Filters → Whitelist → Blacklist → Live strip → Growth+ banner.

---

## Changes by region

### 1. Top of page — drop SafetyStrip

- Delete `src/pages/growth/SafetyStrip.jsx` and its render in `index.jsx`.
- Page now opens directly with the page title + sub, then `ModeCard`.
- Safety copy moves into the Mode card (see §2).

### 2. ModeCard — absorb safety copy

- Keep the existing 3 elevated option cards (Auto / Follow-only / Unfollow-only) and their selection behavior unchanged.
- Add a small inline footer line *inside* the Mode card, below the 3 options:
  - Layout: `Shield` icon (16px, `text-text-muted`) + copy `"Kicksta stays within Instagram's safe daily limits."` in `text-xs text-text-muted`.
  - Sits flush left, below the options grid, with `mt-4` separation.
- Engagement card icons (added in §4) stay consistent: each row gets a matching Lucide icon.

### 3. Layout — 2×2 grid

- Replace today's `lg:grid-cols-2` (Engagement | Filters+Lists stacked) with a symmetric 2×2:
  - **Left column**: `EngagementCard` → `FiltersCard`
  - **Right column**: `WhitelistCard` → `BlacklistCard`
- Mobile: single column, order = Engagement → Filters → Whitelist → Blacklist.
- Grid uses `gap-4 lg:items-start` so rows don't stretch.

### 4. EngagementCard — icons per row

Existing rows are unchanged; add a left-side icon to each (16px, `text-text-secondary`, `mr-3`):
- Like after follow → `Heart`
- Welcome DM → `MessageCircle`
- Close Friends Adder → `UserPlus`

`SettingSwitch` gets a new optional `icon` prop. Icon renders before the title in the row label area. No layout change otherwise.

### 5. FiltersCard — icons + grouped sub-headers

Replace the flat 6-row list with two labelled groups, each row prefixed with a Lucide icon:

```
AUDIENCE SIZE
  Users        Following count    Up to 5K following
  UserPlus     Follower count     500–50K followers
  Image        Media count        10+ posts

ACCOUNT TYPE
  Lock         Account privacy    All
  User         Gender target      All  [Advanced pill if locked]
  ShieldOff    Exclude NSFW       On
```

- Sub-header style: `text-[11px] font-semibold uppercase tracking-wide text-text-muted` with `mt-4` between groups (not `mt-0` on the first group).
- Row layout stays `flex items-center justify-between`. Icon sits in a 24px-wide left slot, label centered to its right, value right-aligned.
- `divide-y divide-border` is preserved between rows within a group; no divider between the two groups.
- Top-right `Edit` button unchanged. `FiltersModal` content unchanged.

### 6. Lists — split into two cards

- Delete `ListsCard.jsx` (single-card version).
- Create **`WhitelistCard.jsx`**:
  - Title: `Whitelist`
  - Sub: `Accounts Kicksta will never unfollow.`
  - Accent: subtle green-tint top-strip OR a `ShieldCheck` icon in `text-green-text` next to the title (final treatment per implementation review — pick one of the two, not both).
  - Body: list of usernames (`{formatCount}` not relevant — usernames). Empty state: `"No accounts protected yet."` in `text-sm text-text-muted`.
  - Top-right `Edit` button → opens `WhitelistModal`.
- Create **`BlacklistCard.jsx`**:
  - Title: `Blacklist`
  - Sub: `Accounts Kicksta will never follow.`
  - Accent: neutral (no tint); `Ban` icon in `text-text-muted` next to the title.
  - Body: list of usernames. Empty state: `"No accounts blocked yet."`
  - Top-right `Edit` button → opens `BlacklistModal`.
- Both cards use the existing card recipe `rounded-xl border border-border bg-surface p-4 lg:p-5`.

### 7. ListsModal split

- Delete `ListsModal.jsx` (the tabbed version).
- Create **`WhitelistModal.jsx`** and **`BlacklistModal.jsx`**, each a single-list editor (no tabs):
  - Same modal animation pattern (mounted state + 2× rAF + `translate-y-4 → 0`).
  - Local draft of one list. Cancel discards. Save calls `useLists.replaceWhitelist(list)` / `replaceBlacklist(list)`.
  - Typeahead `@username` input, must-pick.
  - Mobile bottom sheet, desktop centered modal `max-w-md`.
- `useLists` store gains `replaceWhitelist(list)` and `replaceBlacklist(list)`. The existing `replaceLists(white, black)` bulk action can be removed (no longer used).

### 8. New: `LiveActivityStrip` (above Growth+ banner)

- New component `src/pages/growth/LiveActivityStrip.jsx`.
- Driven by the shared `useSystemStatus` hook.
- Layout (single row, full width):
  - Left: animated phase icon (`Search` / `UserPlus` / `UserMinus` / `Clock` / `Flame` / `Settings` / `Pause`) with `animate-pulse` during running phases. Same icon + color rules as Overview's AccountLiveStatus and Targeting's LiveActivityCard.
  - Middle: status copy — same sentences used elsewhere (`"Currently following @x"`, `"Pausing between actions"`, `"Warming up — growth starts within 72 hours"`, `"Paused"`, etc.).
  - Right (desktop only): `next-action` muted line — e.g. `"Next action ~3 min"`. Hidden on mobile.
- Container: `rounded-xl border border-border bg-surface px-4 py-3 lg:px-5 lg:py-4`.
- Hidden entirely if `phase === 'setup'` (no targets yet) — strip would have nothing useful to say.
- This is the **only live element** on the page. It does not show counts, totals, or rates — just *what is happening right now*.

### 9. Growth+ banner — share with Overview

- Extract Overview's `GrowthPlusBanner` (currently defined inline in `src/pages/overview/index.jsx` at L1356) to **`src/components/GrowthPlusBanner.jsx`**.
- Import + render on both Overview and Growth (replacing today's `GrowthPlusCard` on Growth).
- Delete `src/pages/growth/GrowthPlusCard.jsx`.
- **Copy changes (apply on both pages):**
  - Non-subscriber CTA: `"Add Growth+"` (was `"Upgrade to Growth+"`). Right-arrow icon retained.
  - Non-subscriber CTA target: `/signup/growth-plus` (was `/growth` from Overview).
  - Subscriber state: add a small `"Manage subscription"` text link in the bottom-right of the banner, routing to **new `/account/growth-plus`** stub. Banner does not show a primary CTA when subscribed (current Overview behavior is preserved).
- Visual treatment unchanged: gradient surface, Sparkles chip, eyebrow, headline, benefit list. Mobile and desktop variants unchanged.

### 10. New stub route — `/account/growth-plus`

- Add `src/pages/accountGrowthPlus/index.jsx`:
  - Renders inside `DashboardLayout`.
  - Page title `Growth+ subscription`.
  - Single muted line: `"Subscription management is coming soon. Reach out to support if you need to make changes today."`
  - No other content. Link styled like a dashboard page — gives the Manage link a real destination without committing to the full management UI.
- Add the route to the React Router config alongside `/account`.

---

## File changes summary

**Created**
- `src/components/GrowthPlusBanner.jsx` (extracted from Overview)
- `src/pages/growth/LiveActivityStrip.jsx`
- `src/pages/growth/WhitelistCard.jsx`
- `src/pages/growth/BlacklistCard.jsx`
- `src/pages/growth/WhitelistModal.jsx`
- `src/pages/growth/BlacklistModal.jsx`
- `src/pages/accountGrowthPlus/index.jsx`

**Modified**
- `src/pages/growth/index.jsx` — new layout, drop SafetyStrip, swap ListsCard → Whitelist/Blacklist, add LiveActivityStrip, swap GrowthPlusCard → shared banner
- `src/pages/growth/ModeCard.jsx` — add inline safety footer line
- `src/pages/growth/EngagementCard.jsx` — pass icon prop to each `SettingSwitch`
- `src/pages/growth/FiltersCard.jsx` — icons per row + grouped sub-headers
- `src/components/SettingSwitch.jsx` — accept optional `icon` prop, render in label area
- `src/pages/overview/index.jsx` — replace inline `GrowthPlusBanner` with import; copy + route updated
- `src/stores/useLists.js` — add `replaceWhitelist`, `replaceBlacklist`; remove `replaceLists`
- Router config (wherever routes are declared) — add `/account/growth-plus`

**Deleted**
- `src/pages/growth/SafetyStrip.jsx`
- `src/pages/growth/ListsCard.jsx`
- `src/pages/growth/ListsModal.jsx`
- `src/pages/growth/GrowthPlusCard.jsx`

---

## Open questions / deferred

- **Whitelist accent treatment** — green top-strip vs. `ShieldCheck` icon in title. Decide during implementation review by visual comparison; do not ship both.
- **Live strip on mobile** — desktop shows a "next action" hint on the right; mobile drops it. Confirm during visual review that mobile single-line layout doesn't feel under-filled.
- **Full Growth+ management page** — out of scope. Stub only. Future spec covers pause/resume billing, plan switching, cancellation flow.

---

## Acceptance criteria

1. Growth page no longer renders a top safety strip; Mode card carries the safety message inline as a small footer line.
2. Filters card shows two grouped sub-sections with an icon prefix on every row.
3. Lists are two visually distinct cards (Whitelist + Blacklist), each with its own Edit button and dedicated single-list modal.
4. Engagement card rows show a Lucide icon prefix matching their function.
5. A single live activity strip sits above the Growth+ banner, driven by `useSystemStatus`, hidden in `setup` phase.
6. Growth+ banner is identical visually on Overview and Growth (shared component). CTA copy is `"Add Growth+"` and routes to `/signup/growth-plus`. Subscriber state shows a `Manage subscription` link to `/account/growth-plus`.
7. `/account/growth-plus` exists as a stub page reachable via the Manage link.
8. No metric tiles, historical numbers, or charts appear anywhere on the Growth page.
