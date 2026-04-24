# Growth Page — Design Spec

**Date:** 2026-04-24
**Route:** `/growth`
**Shell:** Dashboard (sidebar on `lg:`, bottom tab on mobile)
**Scope:** V1, frontend-only, all data mocked. Builds the Growth page per PRODUCT.md — Mode, Filters, Engagement toggles, Whitelist/Blacklist, Growth+, safety note.

---

## Goals

1. Give users a single page to configure every knob that governs the Targeted Growth engine.
2. Surface the safety story at the top of the page (PRODUCT.md Problems 3 + 4 — Instagram account safety and service reliability).
3. Keep Growth+ visually separate from Targeted Growth (PRODUCT.md Problem 1 — never merge them).
4. Respect plan gating: Advanced-only features must be visible but subdued with an upgrade path — never hidden.
5. Consistent with the Overview and Targeting pages in vocabulary, spacing, card rhythm, icons, and animation pattern.

---

## Non-goals

- No real backend wiring. Config changes apply to a Zustand store only.
- No real IG handle validation beyond a local regex check for whitelist/blacklist.
- No Growth+ performance chart / insights visualization on this page (deferred).
- No "changing modes while actively running" confirmation dialogs.
- No Account page cancel-subscription hand-off (we link but it's a no-op destination).

---

## 1. Page layout

```
┌──────────────────────────────────────────────────────────────┐
│ Growth                                                       │
│ Configure how Kicksta grows your account.                    │
│                                                              │
│ 🔒 Safety strip — blue-tint ambient, above the first card.  │
│                                                              │
│ [ Mode card ]                                                │
│ [ Engagement card ]                                          │
│ [ Filters card ]                                             │
│ [ Lists card — Whitelist / Blacklist tabs ]                  │
│ [ Growth+ card ]                                             │
└──────────────────────────────────────────────────────────────┘
```

- Container: `mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8`.
- Header: `<h1 className="text-lg font-semibold leading-snug text-text-primary lg:text-xl">Growth</h1>` + sub `<p className="mt-1 text-sm text-text-secondary">Configure how Kicksta grows your account.</p>`.
- Vertical rhythm between cards: safety strip gets `mt-6`; subsequent cards `mt-4`.

---

## 2. Safety strip

- Surface: `rounded-xl bg-blue-tint px-4 py-3 mt-6 flex items-center gap-2.5` (no border; ambient tint).
- Left: `Shield` Lucide icon, `h-4 w-4 text-blue-text`.
- Text: `Kicksta stays within Instagram's safe daily limits.` — `text-sm text-blue-text`.
- Not dismissible. Always renders.

---

## 3. Mode card

**Surface:** `rounded-xl border border-border bg-surface p-4 lg:p-5 mt-4`.

**Header:**
- `<h2 className="text-base font-semibold text-text-primary">Mode</h2>`
- Sub paragraph that reflects the **currently selected** mode:
  - `auto` → `Follow new users, like their posts, then unfollow after a period.`
  - `follow_only` → `Follow new users from your targets. No unfollows.`
  - `unfollow_only` → `Clean up non-followers. No new follows.`
  - `<p className="mt-1 text-sm text-text-secondary">{modeDescription}</p>`

**Control:** segmented pills on one row (same recipe as Targeting's `FilterRow`).
- Container: `mt-4 inline-flex rounded-full bg-bg p-1`.
- Pills: `h-9 px-4 text-xs font-medium rounded-full`. Selected: `bg-surface shadow-sm text-text-primary`. Unselected: `text-text-secondary hover:text-text-primary`.
- Options: `Auto` (value `auto`) · `Follow-only` (`follow_only`) · `Unfollow-only` (`unfollow_only`).

**Interaction:** click a pill → `setMode(value)` → toast fires (debounced).

---

## 4. Engagement card

**Surface:** same card recipe.

**Header:** `Engagement` + sub `How Kicksta interacts with new followers.`

**Rows:** three rows, each using the shared `SettingSwitch` primitive (Section 8).

| Row | Title | Description | Key | Plan |
|-----|-------|-------------|-----|------|
| 1 | Like after follow | Like a few of their recent posts after following — boosts the follow-back rate. | `likeAfterFollow` | — |
| 2 | Welcome DM | Auto-DM new followers once they follow back. | `welcomeDm.enabled` | Advanced |
| 3 | Close Friends Adder | Add new followers to your Close Friends list for exclusive content. | `closeFriendsAdder` | Advanced |

**Row layout (SettingSwitch):**
- `flex items-center gap-3 py-3 border-t border-border first:border-t-0`.
- Left: icon (optional) + title (`text-sm font-medium text-text-primary`) + optional `Advanced` pill + description below (`text-xs text-text-secondary`).
- Right: switch (Section 8).

**Plan-gating logic** — a single helper (`isLocked(feature, user)`) returns `true` when the user's plan lacks access to the feature. For V1 with `mockUser.plan === 'advanced'`, nothing is locked. To exercise the locked UI, temporarily set `mockUser.plan = 'growth'`. The helper lives inline in `GrowthPlusCard.jsx` (or a shared util if reused — lift only when needed).

**Plan-gated rows (Welcome DM, Close Friends Adder) on Growth plan:**
- Row wrapper: `opacity-60` (non-interactive appearance).
- Switch: `pointer-events-none opacity-60`.
- Inline `Advanced` pill next to title (blue-tint, same recipe as Targeting's status pills).
- Entire row is wrapped in a button that opens `UpgradeBottomSheet` with `feature: 'welcome_dm'` or `'close_friends'`.

**Welcome DM message editor (conditional):**
- Renders **only** when `welcomeDm.enabled === true` and the feature is not locked.
- Inline block below the Welcome DM switch row:
  - Label: `Message` · `text-xs font-medium uppercase tracking-wide text-text-muted`.
  - `<textarea>`: 4 rows, 200 char max, `rounded-lg border border-border bg-surface px-3 py-2 text-sm`.
  - Character counter on the right: `{count}/200` · `text-xs text-text-muted`.
  - Saves on blur (not keystroke) so we don't spam the toast system.

---

## 5. Filters card

**Surface:** same card recipe.

**Header:** `Filters` + sub `Target only accounts that match these criteria.`

**Body — 6 filter blocks, vertically stacked with `border-t border-border` between them (no top border on first).**

### 5.1 Following count

- Label: `Following count` · `text-sm font-medium text-text-primary`.
- Sub: `People this account follows.` · `text-xs text-text-secondary`.
- Preset pills row: `<PresetRangePills />` — `< 500 · 500–5K · 5K+ · Custom`.
- When `Custom` is selected, inline row of two number inputs appears below the pills:
  - `Min [__]` and `Max [__]` — `h-10 w-24 rounded-lg border border-border bg-surface px-3 text-sm`.
  - Max blank = "any" (null).

### 5.2 Follower count

- Label: `Follower count`.
- Sub: `How many followers they have.`
- Presets: `< 1K · 1K–50K · 50K+ · Custom`.

### 5.3 Media (post) count

- Label: `Media count`.
- Sub: `How many posts they've published.`
- Presets: `< 10 · 10–100 · 100+ · Custom`.

### 5.4 Account privacy

- Label: `Account privacy`.
- Sub: `Whether their profile is public or private.`
- Segmented pills: `All · Public only · Private only`.

### 5.5 Gender target (Advanced-only)

- Label: `Gender target` + inline `Advanced` pill.
- Sub: `Narrow targeting by account gender.`
- Segmented pills: `All · Male · Female` — all locked (`pointer-events-none opacity-60`).
- Whole block wrapped in a button that opens `UpgradeBottomSheet` with `feature: 'gender_filter'`.

### 5.6 Exclude NSFW accounts

- Uses the `SettingSwitch` primitive, single row.
- Title: `Exclude NSFW accounts`.
- Description: `Skip accounts that appear to contain adult content.`

### PresetRangePills component

Props: `value` (e.g. `{ min: 100, max: 5000 }` or preset key), `presets` (array of `{ key, label, min, max }`), `onChange(nextValue)`.

Selecting a preset sets both min and max and stores the preset key. Selecting `Custom` opens the inline number inputs below. If the current value matches a known preset range, that preset pill is marked selected; otherwise `Custom` is marked selected.

Range → preset matching is strict equality on `{min, max}` — makes the selection state deterministic for non-trivial cases.

---

## 6. Lists card

**Surface:** same card recipe.

**Header:** `Lists` + sub `Fine-tune who Kicksta does and doesn't interact with.`

**Internal tabs row (below header):** segmented pills — `Whitelist` · `Blacklist`.

**Below tabs — tab-specific sub caption:**
- Whitelist: `Accounts here will never be unfollowed.`
- Blacklist: `Accounts here are excluded from all interaction.`

**Body (shared pattern):**

1. **Quick-add row:**
   - Input with `@` prefix (like AddTargetSheet's account input). `h-10 w-full rounded-lg border border-border bg-surface px-3`.
   - `Add` button (primary blue, `h-10 rounded-lg bg-blue-base px-4 text-sm font-medium text-white`), disabled when the input is empty or invalid.
   - Enter key submits.
   - Duplicate handle → toast `Already in list.` (tone: `warning`).
   - Invalid format → inline red helper under the input.

2. **Entries list:**
   - Each entry row: `@handle` on left (`text-sm text-text-primary`), `Remove` ghost button on right (`text-xs text-text-secondary hover:text-red-text`).
   - `border-t border-border` between rows.
   - Empty state: `<p className="py-4 text-center text-sm text-text-muted">No accounts whitelisted yet.</p>` (or blacklisted).

**Data model:** two Zustand stores? No — one `useLists` store with `{ whitelist: [], blacklist: [], add(type, username), remove(type, id) }`.

---

## 7. Growth+ card

**Surface:** same card recipe but `bg-bg` instead of `bg-surface` so it reads as a distinct section (Growth+ ≠ Targeted Growth).

Renders one of two variants based on `user.growthPlusSubscribed`:

### 7.1 Non-subscriber (upsell)

- Top-left corner: `Sparkles` Lucide icon in a `bg-purple-tint` rounded square (matches the Overview's Growth+ banner).
- Header: `Growth+` (`text-lg font-semibold`) + 1-line sub `Algorithmic reach, separate subscription.`
- Body: two-line copy:
  - `Add Growth+ for extra algorithmic reach. Our network of accounts boosts your posts — separate billing, cancel any time.`
- Trust note below the copy: `Lock` icon + `Growth+ followers are marked separately from Targeted Growth.` (small muted text).
- Primary CTA: `Add Growth+` button, `h-11 bg-purple-base text-white rounded-lg px-4` (reuses the Overview's Growth+ banner button styling).
- Hitting `Add Growth+` navigates to `/signup/growth-plus`.

### 7.2 Subscriber (active)

- Header: `Growth+` + green-tint `Active` pill next to title.
- Body: single row — `Sparkles` icon + one-line status: `Boosting your posts algorithmically — {N} extra followers this month.` (`{N}` from `mockGrowthPlusInsights.monthlyExtraFollowers`; fall back to 0 if missing).
- `SettingSwitch` row below: `Pause Growth+` — switch on right. When paused, the copy switches to `Paused — resume any time.` and the toggle is in off position.
- Small ghost link at the bottom: `Manage subscription` → `/account` (non-functional V1).

### 7.3 Trial-user variant

- If `user.isOnTrial === true` and not subscribed, the subscriber variant is hidden; the upsell variant renders. PRODUCT.md: Growth+ isn't part of the trial — opt-in requires billing.
- No special styling change beyond the standard non-subscriber variant.

---

## 8. Shared primitives

### 8.1 `SettingSwitch`

**File:** `src/components/SettingSwitch.jsx`.

**Props:**
```js
{
  title: string,
  description?: string,
  icon?: Lucide component,
  checked: boolean,
  onChange: (nextValue: boolean) => void,
  locked?: boolean,      // if true, shows "Advanced" pill + greyed; onChange disabled
  planLabel?: string,    // defaults to "Advanced" when locked
  onLockedTap?: () => void,  // fired when a locked row is tapped
}
```

**Layout:** `flex items-center gap-3`. Left zone: optional icon + (title + optional pill) + description. Right zone: a `<button role="switch">` visual toggle — 40×24 track, 20×20 thumb, `transition-colors` on track + `transition-transform` on thumb. Track: `bg-green-base` when on, `bg-border` when off. Thumb: `bg-white shadow-sm`.

**Interactions:**
- Unlocked: clicking the row's right-side switch flips the value.
- Locked: entire row becomes a button that calls `onLockedTap` (and does NOT call `onChange`). Switch visually fixed in its current state.

### 8.2 `UpgradeBottomSheet`

**File:** `src/components/UpgradeBottomSheet.jsx`.

**Props:**
```js
{
  open: boolean,
  onClose: () => void,
  feature?: 'welcome_dm' | 'close_friends' | 'gender_filter' | 'targets_slots',
}
```

**Content map (by feature):**

| Feature | Headline | Benefit copy | Unlocks list |
|---------|----------|--------------|--------------|
| `welcome_dm` | Unlock Welcome DM | Auto-DM new followers and welcome them into your audience. | Welcome DM, Close Friends Adder, Gender filter, 30 target slots |
| `close_friends` | Unlock Close Friends Adder | Automatically add new followers to your Close Friends list. | Close Friends Adder, Welcome DM, Gender filter, 30 target slots |
| `gender_filter` | Unlock Gender targeting | Refine targeting to a specific gender for better-qualified followers. | Gender filter, Welcome DM, Close Friends Adder, 30 target slots |
| `targets_slots` | Unlock 30 target slots | Track 3× more accounts and hashtags at once. | 30 target slots, Welcome DM, Close Friends Adder, Gender filter |

**Layout (same animation pattern as `AddTargetSheet` / `TargetDetailDrawer`):**
- Mobile: bottom sheet.
- Desktop: centered modal `max-w-md`.
- Header: `Sparkles` icon + headline + close X.
- Body: 1-line benefit copy, then a muted `<ul>` of unlocks (`Check` icon + label per row).
- Footer: primary `Upgrade to Advanced` button (`bg-blue-base text-white`) → navigates to `/signup/plan-selection`. Secondary `Cancel` button.
- Ease-in fade + slide animation on mount (reuses the pattern from the existing sheets).

### 8.3 `useGrowthConfig` store

**File:** `src/stores/useGrowthConfig.js`.

**State:** seeded from `mockGrowthConfig`.

**Actions:**
```js
setMode(mode)
toggleLikeAfterFollow()
toggleWelcomeDm()
setWelcomeDmMessage(message)
toggleCloseFriends()
setFilter(key, nextValue)   // e.g. setFilter('followerRange', {min, max})
setAccountPrivacy(value)
setGenderTarget(value)
toggleExcludeNsfw()
toggleGrowthPlusActive()
```

**Toast integration:** every action calls a shared `announceSaved()` helper that fires `useToasts.getState().addToast({ message: 'Settings saved.', tone: 'success' })` — but debounced at 1500ms so rapid typing (DM message, filter number inputs) doesn't spam. The debouncer lives inside the store.

### 8.4 `useLists` store

**File:** `src/stores/useLists.js`.

**State:** `{ whitelist: mockWhitelist, blacklist: mockBlacklist }`.

**Actions:**
```js
addEntry(type, username)    // type: 'whitelist' | 'blacklist'. Normalizes, dedupes.
removeEntry(type, id)
```

- Adds generate `id = 'w_' + random()` or `'b_' + random()`, `addedAt = new Date().toISOString()`.
- Duplicate (case-insensitive on `@handle`): `addEntry` returns `'duplicate'` and the caller shows a warning toast.
- Both actions fire `announceSaved()` (debounced) on success.

---

## 9. File-level diff

**Created:**
- `src/pages/growth/index.jsx` — page shell + section wiring.
- `src/pages/growth/SafetyStrip.jsx` — small ambient strip.
- `src/pages/growth/ModeCard.jsx` — mode segmented pills + description.
- `src/pages/growth/EngagementCard.jsx` — 3 rows of `SettingSwitch` + Welcome DM editor.
- `src/pages/growth/FiltersCard.jsx` — 6 filter blocks + shared `PresetRangePills`.
- `src/pages/growth/PresetRangePills.jsx` — reusable preset+custom pill group.
- `src/pages/growth/ListsCard.jsx` — Whitelist/Blacklist tabs + inline add + entries.
- `src/pages/growth/GrowthPlusCard.jsx` — subscriber + non-subscriber variants.
- `src/components/SettingSwitch.jsx` — shared switch primitive.
- `src/components/UpgradeBottomSheet.jsx` — shared upgrade sheet.
- `src/stores/useGrowthConfig.js` — config Zustand store + debounced toast helper.
- `src/stores/useLists.js` — whitelist/blacklist store.

**Modified:**
- `src/index.css` — potentially add `@keyframes` if switch thumb needs a custom transition (default Tailwind transitions should suffice).

**Unchanged:**
- All other pages and components.
- `mockGrowthConfig`, `mockWhitelist`, `mockBlacklist`, `mockUser` — seed data only.

---

## 10. Responsive notes

- **Mobile (default):** all cards full-width, stacked. Filter preset pills wrap in the card. Lists tabs scroll horizontally if they overflow (they won't at 2 tabs).
- **`md:+` / `lg:+`:** nothing side-by-side in V1. The page is a single column up to `max-w-5xl`. Cards internally use `lg:p-5` padding vs. `p-4` on mobile.

---

## 11. Out of scope (V1)

- Real handle resolution for whitelist/blacklist (no typeahead — it's a plain text input).
- Mode-change confirmation modal for risky transitions.
- Growth+ insights visualization (chart, numbers beyond the one-liner).
- Account page link target for Growth+ manage subscription.
- Accessibility polish beyond reasonable defaults (aria-checked on switches, etc. — handled by the primitive).
- Migration / data-shape evolution guards.
- Error states for save failures (V1 can't fail).
- Persistence across reloads (store is in-memory).

---

## 12. Success criteria

- User can toggle Mode between 3 options; description line updates; toast fires.
- User can flip each Engagement toggle; on Growth plan, Welcome DM + Close Friends show subdued with `Advanced` pill and open the upgrade sheet on tap.
- Welcome DM textarea appears/disappears with its toggle.
- User can configure all 6 filters. Preset pills highlight correctly when the value matches a preset.
- User can add/remove entries from both Whitelist and Blacklist.
- Growth+ card shows the right variant (upsell when not subscribed).
- Safety strip renders at the top.
- No console errors; dark mode + mobile both render cleanly.
- Visual rhythm matches Overview + Targeting (card spacing, typography, icon use).
