# Polish Pass — Design Spec

**Date:** 2026-05-08
**Goal:** Ship seven small fixes across Targeting, Engagement, and Settings as one batched commit set. No new components, no architectural changes — only data, copy, classes, and tiny structural tweaks. This is the first of five specs ("polish pass" + four meaty ones — Add Target popup, Engagement collapse, Billing structure, Nav server-change) agreed in brainstorming on 2026-05-08.

**Architecture:** Pure refactor / data update. All changes are in-place; no new files except the spec/plan docs themselves. Implementation order doesn't matter between items — each is independent.

**Tech stack:** React, Tailwind, Lucide. Pravatar (`https://i.pravatar.cc/80?u=<seed>`) as the deterministic mock-avatar source.

---

## Item 1 — Account-target profile pics

**Why:** Today every account-type target falls back to a single-letter monogram because `mocks/targets.js` has no `profilePic` field. `TargetRow.jsx` already supports `target.profilePic` (renders `<img>` when present, monogram otherwise) — only the data is missing.

**Files:**
- Modify: `src/mocks/targets.js`

**Change:** Add `profilePic: 'https://i.pravatar.cc/80?u=<seed>'` to every row where `type: 'account'`. The seed is the `value` with the leading `@` stripped.

| Row | `value` | New `profilePic` |
|---|---|---|
| t_001 | `@fitness.inspo` | `https://i.pravatar.cc/80?u=fitness.inspo` |
| t_003 | `@yoga.daily` | `https://i.pravatar.cc/80?u=yoga.daily` |
| t_004 | `@cleanfoodcrush` | `https://i.pravatar.cc/80?u=cleanfoodcrush` |
| t_006 | `@protein.pete` | `https://i.pravatar.cc/80?u=protein.pete` |
| t_008 | `@macro.melissa` | `https://i.pravatar.cc/80?u=macro.melissa` |
| t_010 | `@keto.kevin` | `https://i.pravatar.cc/80?u=keto.kevin` |
| t_011 | `@stale.influencer` | `https://i.pravatar.cc/80?u=stale.influencer` |

Hashtag rows (t_002, t_005, t_007, t_009, t_012) get **no** `profilePic` field — they keep the `Hash` icon.

**Acceptance:** Targeting list renders real face thumbnails for every account row; hashtag rows render the Hash icon as before.

---

## Item 2 — Follow-back column header

**Why:** Today the header reads `Follow-backs · %` and is right-padded with `pr-12` to clear the chevron column. The `· %` is non-standard column-header copy (the numbers below carry the count·rate format), and the right edge of the label doesn't line up with the right edge of the number column — it floats too far right.

**Files:**
- Modify: `src/pages/targeting/TargetList.jsx`

**Change (line 452):**

Before:
```jsx
<span className="pr-12">Follow-backs · %</span>
```

After:
```jsx
<span className="pr-6">Follow-backs</span>
```

**Why `pr-6`:** Header wrapper padding is `px-4` (16px right). Row content padding is `pr-3` (12px right) + chevron wrapper `w-7` (28px) = 40px from row's right edge to the number group's right edge. To align the header text's right edge with the number group's right edge, the header span needs `40 − 16 = 24px = pr-6` of inner right padding. Implementation step **must verify alignment in browser at mobile + desktop widths** and nudge to `pr-5` or `pr-7` if it drifts (different fonts/glyph metrics may shift the visual edge slightly).

**Acceptance:** Header right edge visually aligns with the right edge of the number group on each row, no floating.

---

## Item 3 — Whitelist / Blacklist input top spacing

**Why:** `WhitelistModal.jsx` line 820 and `BlacklistModal.jsx` (matching line) wrap the input row in `<div className="relative mt-4 flex gap-2">`. The `mt-4` puts a 16px gap between the modal header and the input that doesn't exist in `AddTargetSheet.jsx` (which is the canonical pattern for these popups). The whitelist/blacklist popups should match.

**Files:**
- Modify: `src/pages/targeting/WhitelistModal.jsx`
- Modify: `src/pages/targeting/BlacklistModal.jsx`

**Change:** Drop `mt-4` from the input row wrapper:

Before:
```jsx
<div className="relative mt-4 flex gap-2">
```

After:
```jsx
<div className="relative flex gap-2">
```

**Acceptance:** Whitelist and Blacklist modals both have the input row sitting directly below the body's top padding (`py-4`), with no extra margin above. Matches AddTargetSheet visually.

---

## Item 4 — CFA (Close Friends Adder) copy

**Why:** Current copy ("Add new followers" / "Remove unfollowers", subtitle "Automatically manage your Close Friends list", tooltip "Automatically manage your Close Friends list as followers come and go.") doesn't accurately describe what the engine does — it adds your existing followers to Close Friends and removes ex-followers from Close Friends. Locked copy from brainstorm:

**Files:**
- Modify: `src/pages/engagement/CloseFriendsCard.jsx`

**Changes:**

| Element | Before | After |
|---|---|---|
| Subtitle (line 1153) | `Automatically manage your Close Friends list.` | `Add followers to Close Friends; remove ex-followers.` |
| Tooltip text (line 1151 — `InfoTooltip text=`) | `Automatically manage your Close Friends list as followers come and go.` | `Adds your followers to your Close Friends list, and removes anyone who unfollows.` |
| Add-mode label (line 1112 — `CF_MODES[0].label`) | `Add new followers` | `Add followers` |
| Remove-mode label (line 1117 — `CF_MODES[1].label`) | `Remove unfollowers` | `Remove unfollowers` (no change — already correct) |

**Acceptance:** Strings match the locked copy table above exactly.

---

## Item 5 — CFA progress + state restructure

**Why:** The "Currently 23 in close friends" line (rendered by the `CloseFriendsState` helper inside `CloseFriendsCard.jsx`) is a stale duplicate of information already implied by the running activity. The "Adding @taylor.fit…" line below the progress bar (in `CloseFriendsProgress.jsx`) lacks a leading mode-icon, so the running mode (add vs remove) doesn't read at a glance from the progress section alone. Two files, two coordinated changes.

**Files:**
- Modify: `src/pages/engagement/CloseFriendsCard.jsx` (drop the count line)
- Modify: `src/pages/engagement/CloseFriendsProgress.jsx` (add the leading icon)

**Changes:**

1. **In `CloseFriendsCard.jsx` `CloseFriendsState()` helper** — remove the entire `<p>` block that renders the count line:

   Before (the first `<p>` inside the wrapper `<div>`):
   ```jsx
   <p className="flex items-center gap-1.5 text-xs text-text-secondary">
     <Star className="h-3.5 w-3.5 text-purple-text" aria-hidden="true" />
     Currently {count} in close friends
   </p>
   ```

   After: the entire `<p>` is deleted. The `count` destructure on the line `const { count, recent } = mockCloseFriendsState` becomes `const { recent } = mockCloseFriendsState`. The Star import in this file is preserved (still used in the card header chip).

2. **In `CloseFriendsProgress.jsx`** — add a leading icon to the "Adding @…" line below the progress bar:

   - Import `Plus, Minus` from `lucide-react` (alongside the existing imports).
   - Render the icon inline with the verb+handle text, separated by a small gap.

   Before (lines 59–61):
   ```jsx
   <p className="mt-2 flex items-center gap-2 text-xs text-text-secondary animate-pulse">
     {verb} {handle}…
   </p>
   ```

   After:
   ```jsx
   <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary animate-pulse">
     {mode === 'remove'
       ? <Minus className="h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
       : <Plus className="h-3.5 w-3.5 shrink-0 text-green-text" aria-hidden="true" />}
     {verb} {handle}…
   </p>
   ```

   `gap-2` → `gap-1.5` so the icon sits closer to the verb (looks like a leading bullet, not a separate column).

**Acceptance:** No "Currently … in close friends" line anywhere on the page. The progress section's running line shows a green Plus when mode is `add` (verb: "Adding") and a muted Minus when mode is `remove` (verb: "Removing").

---

## Item 6 — Icon-color consistency (inventory + rule)

**Why:** Icon colors today are inconsistent across roles. The Download invoice icon in `InvoicesTable` uses `text-blue-text`, while other passive row actions use `text-text-secondary`. CardChip colors vary semantically (green/blue/yellow/neutral) but the rule isn't documented.

**Files:**
- Modify: `src/pages/account/InvoicesTable.jsx` (Download icon role change)
- Audit-only: every other CardChip and action-icon site (no further changes if they already follow the rule)

**Locked rules:**

| Role | Rule |
|---|---|
| CardChip color | Semantic per section. Success/active = green, info = blue, warning/caution = yellow, neutral/utility = neutral. Once chosen for a section, it's stable across the dashboard. No further changes in this spec — this is documentation. |
| Row-action icons (passive, e.g. download, more-options) | `text-text-secondary` with hover→`text-text-primary`. **Change:** `InvoicesTable`'s Download button moves from `text-blue-text` to `text-text-secondary`, hover→`text-text-primary`. |
| Status dots | `bg-{color}-base` per state. Already correct everywhere — no changes. |
| Destructive row actions (X-on-row) | Default `text-text-secondary`, hover→`text-red-text`. Already correct in `WhitelistModal` and `BlacklistModal` — no changes. |
| Constructive primary actions (Plus on standalone "Add" rows) | `text-blue-text` on `bg-blue-tint` background. Already correct in `AccountSwitcher`'s "Add account" row — no changes. |

**Files actually touched:**
- `src/pages/account/InvoicesTable.jsx` line 1445 — `DownloadButton` className: `text-blue-text` → `text-text-secondary hover:text-text-primary`. The `hover:bg-bg` is preserved.

**Acceptance:** The Download icon in the desktop invoices table reads as a passive utility (muted), not a primary action (blue). All other icon roles already conform — no other code changes.

---

## Item 7 — Subscription profile pics

**Why:** `mocks/accounts.js` has `profilePic: '/mock-avatar.jpg'` for acc_001 only. acc_002 and acc_003 are `null`, which renders monogram tiles in `SubscriptionCard`, the desktop AccountSwitcher, the mobile drawer, and anywhere else avatars surface for those accounts. With Pravatar locked as the mock source, all three accounts move to Pravatar URLs for uniform sourcing.

**Files:**
- Modify: `src/mocks/accounts.js`

**Changes:**

| Account | Before | After |
|---|---|---|
| acc_001 (`alexjohnson.co`) | `profilePic: '/mock-avatar.jpg'` | `profilePic: 'https://i.pravatar.cc/80?u=alexjohnson.co'` |
| acc_002 (`alex.personal`) | `profilePic: null` | `profilePic: 'https://i.pravatar.cc/80?u=alex.personal'` |
| acc_003 (`fitclub.brand`) | `profilePic: null` | `profilePic: 'https://i.pravatar.cc/80?u=fitclub.brand'` |

**Acceptance:** Every place that renders an account avatar (SubscriptionCard, AccountSwitcher dropdown, AccountSwitcher mobile sheet, anywhere else that reads `account.profilePic`) shows real face thumbnails for all three accounts. No monogram fallbacks for connected mock accounts.

---

## Out of scope

Folded into separate specs (do not implement here):

- **Add Target popup redesign** — suggestions layout, switcher-left, selected-source pill, private/verified warning. → Spec 2.
- **Engagement collapse** — edit-icon-in-bubble for Welcome DM, collapsible recents on both engagement cards. → Spec 3.
- **Billing structure consistency** — flatten `PaymentMethodsCard` to match section-header pattern, add-subscription affordance, mobile billing-history weight (#15 from brainstorm). → Spec 4.
- **Nav server-change** — move ChangeServer affordance into AccountSwitcher panel; remove ServerCard from SubscriptionDetail. → Spec 5.

---

## Implementation notes for the plan

- All seven items are independent. Implementation order in the plan can be any order; suggest grouping by file (one task per file edited) for cleaner commits.
- No tests today on the touched components beyond the manual flow — plan should include a manual verification step per item against the Acceptance criterion.
- Pravatar is a third-party service; document this in the mock data comment so a future reader doesn't think we're shipping that to production.
