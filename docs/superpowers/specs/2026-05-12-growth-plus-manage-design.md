# Growth+ Manage Subscription — Design

## Goal

Replace the `/account/growth-plus` "coming soon" stub with a working subscription-management experience: change tier, cancel, and a third "cancelled-pending-end" state that honors the paid-through period.

## Architecture overview

Three surfaces, each with a clear scope:

1. **Manage popup** — entry surface, opens from the Billing card "Manage" button and the `GrowthPlusBanner` "Manage subscription" link. Hosts current-plan summary + two action rows. No tier comparison or cancellation UI lives here directly.

2. **Tier-change page** (`/account/growth-plus`) — the existing route, repurposed. Hosts the 3-card tier grid with current-tier marker and "Switch to {tier}" CTAs. Confirms with proration math via a modal.

3. **Cancel modal flow** — 3-step modal stack (plus a success acknowledgement screen) triggered from inside the Manage popup. Reason → What you'll lose → Confirm → Success ack. Reason "Too expensive" can deflect to an inline downgrade.

A fourth piece, the **cancelled-pending-end state**, layers onto the existing Active dashboard: banner, pill change, and Billing card adjustments until the period ends. Manage popup contents adapt to expose "Resume."

## Subscription state model

Three states for a subscriber (non-subscriber unchanged — sees Upsell):

| State | Trigger | Behavior |
|-------|---------|----------|
| `active` | Default subscribed state | Current dashboard. Manage popup shows Change tier + Cancel. |
| `cancelled_pending` | User completed cancel flow; period not yet ended | Dashboard adds banner + pill swap. Manage popup shows Resume only. Tier-change page route blocked (redirect to dashboard). |
| `lapsed` | Period end reached | Treated as non-subscriber → Upsell page. |

State source: extend `useGrowthPlusSubscription` store with `status: 'active' | 'cancelled_pending' | 'lapsed'` and `endsAt: ISOString | null`. Default `active` + `endsAt: null`. Cancellation sets `status: 'cancelled_pending'` + `endsAt: mockGrowthPlusNextBillingAt`. Resume reverts to `active` + `endsAt: null`. (V1 mock only — no clock-driven transition to `lapsed`. A devtool toggle / store action can flip to `lapsed` for QA.)

Components read state via `useGrowthPlusSubscription` selector. `GrowthPlusPage` already branches on `subscribed` — extend the branch to handle `cancelled_pending` (passes through to Active dashboard with banner) and `lapsed` (Upsell).

## Manage popup

Triggered by the existing "Manage" button on `GrowthPlusBillingCard` and the existing `GrowthPlusBanner` "Manage subscription" link (which currently navigates to `/account/growth-plus` — both rewire to open this popup).

**Render target:** portal to `document.body` (matches existing modal pattern). Bottom-sheet on mobile (`< md:`), centered modal on `md:+`. Max width `max-w-md`.

**Layout — active state:**
```
┌─────────────────────────────────────┐
│ Growth+ subscription         [×]    │
├─────────────────────────────────────┤
│ ┌─[chip]──────────────────────────┐ │
│ │ Pro plan                         │ │
│ │ $49/mo · Next billing Jun 12     │ │
│ └──────────────────────────────────┘ │
│                                     │
│  Change tier                    ›   │
│ ─────────────────────────────────── │
│  Cancel subscription            ›   │  ← red-text
└─────────────────────────────────────┘
```

**Layout — cancelled_pending state:**
```
┌─────────────────────────────────────┐
│ Growth+ subscription         [×]    │
├─────────────────────────────────────┤
│ ┌─[chip yellow]───────────────────┐ │
│ │ Pro plan · Ending Jun 12         │ │
│ │ Full access until then           │ │
│ └──────────────────────────────────┘ │
│                                     │
│ [ Resume subscription ]             │  ← green-base primary button
└─────────────────────────────────────┘
```

**Behavior:**
- "Change tier" → close popup → `navigate('/account/growth-plus')`
- "Cancel subscription" → close popup → open `CancelGrowthPlusModal` (state hoisted to the page where the popup was triggered, since the popup parent owns both)
- "Resume subscription" (cancelled_pending only) → resumeSubscription action → toast "Growth+ subscription resumed." → close popup

## Tier-change page (`/account/growth-plus`)

Replaces the existing stub. Renders the 3-card tier grid + current-tier marker + comparison row. Heavily reuses styling from `GrowthPlusUpsell` but with different CTAs and a "current plan" pill on the active tier.

**Route guard:** if subscription is `cancelled_pending` or `lapsed`, redirect to `/growth-plus` (user goes through Resume or Subscribe first). If `active` and user lands here, render normally.

**Layout:**
- Page header: `h1` "Manage your Growth+ subscription" + subtitle "Change tier anytime. Proration handled automatically."
- 3 tier cards in `lg:grid-cols-3` grid (same as Upsell), with these adaptations:
  - Current tier card gets a "Current plan" pill (top-left, green-tint), `border-purple-base` highlight, and CTA `disabled` button reading "Current plan."
  - Other tier cards get CTA reading "Switch to {tier.name}" — primary purple-base styling.
- Below the grid: small footer note "Switching tiers takes effect immediately. Your next renewal stays on the same day." + a back-link to `/growth-plus`.

**Switch confirmation modal** (`SwitchTierConfirmModal`):
- Triggered by "Switch to {tier}" CTA
- Reuses the `GrowthPlusSubscribeModal` confirm → processing → success pattern (parent-owned state).
- **Confirm step contents:**
  ```
  Switch to Pro
  ─────────────
  Pro plan · $49/mo
  Effective immediately
  Next billing: Jun 12, 2026

  Upgrade  ─ $24 prorated charge today
  Downgrade ─ $20 credit applied to next bill
  ─────────────
  [ Cancel ]  [ Switch to Pro ]
  ```
- **Proration logic** (deterministic mock):
  - `daysRemaining = Math.max(0, daysBetween(today, mockGrowthPlusNextBillingAt))`
  - `daysInCycle = 30`
  - Upgrade: `proratedCharge = Math.round((newPrice - oldPrice) * daysRemaining / daysInCycle)`. Display `$X prorated charge today`.
  - Downgrade: `proratedCredit = Math.round((oldPrice - newPrice) * daysRemaining / daysInCycle)`. Display `$X credit applied to next bill`.
  - Same-price edge: shouldn't happen (each tier is distinct), so no copy needed.
- On Confirm → flip to processing state (1500 ms via parent timer, mirroring existing modal) → success → success step shows "Switched to Pro. Your new tier is active." → close → store tier updated via `setGrowthPlusTier(newTierId)` → navigate to `/growth-plus` → success toast.

## Cancel modal flow

Triggered from Manage popup → opens `CancelGrowthPlusModal`. Single component, internal step state. Portal-rendered. Bottom-sheet on mobile, centered modal on `md:+`. Max width `max-w-md`.

State: `step ∈ { 'reason', 'lose', 'confirm', 'processing', 'success' }`. `selectedReason: string | null`. `inlineDowngrade: boolean` (toggles inline deflection in 'reason' step).

**Step 1 — Reason** (`step: 'reason'`)

```
Cancel Growth+                   [×]
─────────────────────────────────
Why are you cancelling? (helps us improve)

( ) Too expensive
( ) Not enough results
( ) Taking a break from Instagram
( ) I don't use it
( ) Other

[ Continue ]   ← disabled until reason picked
```

When "Too expensive" picked AND user isn't on Starter:

```
( • ) Too expensive
   ┌─────────────────────────────────┐
   │ Try Pro at $49/mo instead?       │  ← deflection card (purple-tint)
   │ Keep your boost going for less.  │
   │ Effective immediately.           │
   │ [ Downgrade to Pro ]             │
   └─────────────────────────────────┘
( ) Not enough results
...
```

Deflection CTA target: smallest tier-jump (Elite → Pro, Pro → Starter). Starter user with "Too expensive" sees no deflection — flow proceeds to step 2.

"Downgrade to {tier}" inside the deflection card: closes cancel modal → opens `SwitchTierConfirmModal` for the deflection target tier → reuses the same proration confirm flow as the tier-change page. On success, redirects to `/growth-plus` with toast "Switched to {tier}."

**Step 2 — What you'll lose** (`step: 'lose'`)

```
Cancel Growth+                   [×]
─────────────────────────────────
Here's what you'll lose:

  [Sparkles] +312 followers from Growth+
  since you subscribed.

  You'll also lose:
  × Up to +143 extra followers/mo
  × 12 boosted posts/mo
  × +34% post reach lift
  × Targeted quality (Pro)
  × Fast speed mode (Pro)

You'll keep full access until Jun 12, 2026.

[ Back ]   [ Continue ]
```

- Cumulative headline uses `mockGrowthPlusInsights[tierId].totalFollowersGained`.
- Feature list is the same `FeatureRow` data as Upsell, rendered with X icons (`text-red-text`).
- Period-end date from `mockGrowthPlusNextBillingAt`.

**Step 3 — Confirm** (`step: 'confirm'`)

```
Cancel Growth+                   [×]
─────────────────────────────────
Are you sure?

Your Growth+ subscription will end on Jun 12, 2026.
You won't be charged again. You'll keep full access until then.

[ Keep my subscription ]   [ Cancel subscription ]
```

"Keep my subscription" — primary green-base styling, closes the modal entirely.
"Cancel subscription" — ghost red-text styling. Click → flip to `processing` (1500 ms timer) → `success`.

**Step 4 — Success** (`step: 'success'`)

```
Cancel Growth+                   [×]
─────────────────────────────────
[✓] Subscription cancelled

You have full access until Jun 12, 2026.
We'll let you know before it ends.

[ Done ]
```

"Done" → close modal → store update: `status: 'cancelled_pending'`, `endsAt: mockGrowthPlusNextBillingAt` → page re-renders into cancelled-pending UI (banner + pill change + Billing card adjustment).

## Cancelled-pending-end dashboard UI

When `status === 'cancelled_pending'`, the existing Active dashboard renders with these layered changes:

**1. Banner at top of `GrowthPlusActive`:**

```
┌──────────────────────────────────────────────────────┐
│ [⚠] Your Growth+ subscription ends Jun 12, 2026.    │  ← yellow-tint
│     You'll keep full access until then.              │
│                                  [ Resume ]   ← link │
└──────────────────────────────────────────────────────┘
```

Banner is a top-level child of `GrowthPlusActive`, rendered before `GrowthPlusHero`. New component: `GrowthPlusCancelledBanner`.

**2. Hero pill swap:**

Active pill (`Active · Pro`, green-tint) becomes `Ending Jun 12 · Pro` (yellow-tint, yellow-text). Hero number subtitle unchanged ("total followers gained from Growth+"). `GrowthPlusHero` reads `status` from the subscription store and branches.

**3. Billing card:**

"Next billing" label → "Subscription ends." Date value renders from `endsAt`. Upgrade ribbon (`Upgrade to Elite for $99/mo...`) hidden when `cancelled_pending`. Manage button copy unchanged.

**4. Tier-change page:**

Route guard redirects to `/growth-plus` if state is `cancelled_pending`. User must Resume first via the Manage popup.

**5. Controls + Activity:**

No changes. Boost continues running until the period ends.

## Mock data additions

Extend `mockGrowthPlusInsights` (already done in previous round for `totalFollowersGained`). No additional mock data needed beyond:

- `useGrowthPlusSubscription` store: add `status`, `endsAt`, `cancel()`, `resume()` actions
- Pull `mockGrowthPlusNextBillingAt` from existing `mocks/user.js` for the period-end date

## Component inventory

**New files:**
- `src/components/GrowthPlusManageModal.jsx` — entry popup (active + cancelled_pending variants)
- `src/components/CancelGrowthPlusModal.jsx` — 3-step cancel flow + success ack (reason → lose → confirm → success)
- `src/components/SwitchTierConfirmModal.jsx` — proration confirm + success for tier-change
- (no new page file — page contents live directly in the existing `src/pages/accountGrowthPlus/index.jsx`, just rewritten)
- `src/pages/growthPlus/GrowthPlusCancelledBanner.jsx` — yellow-tint top banner for cancelled_pending state

**Modified files:**
- `src/pages/accountGrowthPlus/index.jsx` — replaced stub with new tier-change page contents
- `src/pages/growthPlus/GrowthPlusBillingCard.jsx` — "Manage" button no longer navigates to `/account/growth-plus`; instead opens `GrowthPlusManageModal` (state owned by `GrowthPlusActive`). Billing card also adapts copy for cancelled_pending.
- `src/pages/growthPlus/GrowthPlusHero.jsx` — pill branches on `status`
- `src/pages/growthPlus/GrowthPlusActive.jsx` — owns manage modal + cancel modal + switch tier modal state; renders banner when cancelled_pending
- `src/components/GrowthPlusBanner.jsx` — "Manage subscription" link triggers modal instead of navigating
- `src/stores/useGrowthPlusSubscription.js` — add `status`, `endsAt`, `cancel`, `resume`
- `src/App.jsx` — `/account/growth-plus` route still wired; no change
- `src/utils/proration.js` — new helper file with `prorationFor(oldPrice, newPrice, endsAt)` returning `{ kind: 'upgrade' | 'downgrade' | 'same', amount }`

## Component data flow

```
GrowthPlusActive
├── owns: manageModalOpen, cancelModalOpen, switchTierTargetId
├── GrowthPlusCancelledBanner (when status === 'cancelled_pending')
├── GrowthPlusHero
├── GrowthPlusMetricsStrip
├── GrowthPlusActivity
├── GrowthPlusControls
├── GrowthPlusBillingCard (onManage → setManageModalOpen(true))
├── GrowthPlusManageModal
│   ├── onChangeTier → close + navigate('/account/growth-plus')
│   ├── onCancel → close + setCancelModalOpen(true)
│   └── onResume → resume() + toast
└── CancelGrowthPlusModal
    ├── onSuccess → cancel() + toast
    └── onDowngradeDeflect(tierId) → close + setSwitchTierTargetId(tierId)
└── SwitchTierConfirmModal (when switchTierTargetId set)
    └── onSuccess → setTier() + toast + clear targetId
```

## Edge cases & decisions locked

- **Starter user picks "Too expensive":** no deflection card shown; flow continues to step 2.
- **Resume after cancel:** restores `status: 'active'`, clears `endsAt`. No proration (they haven't lost any time). Toast confirms.
- **Period ends (mock-only):** no automatic transition in V1. A future spec wires this to a clock or a renewal event. For QA, the store exposes a `_lapseForTesting()` action.
- **Tier change during `cancelled_pending`:** route guard redirects. User must Resume first.
- **Manage popup on mobile:** bottom-sheet, dismissable by swipe-down or backdrop tap.
- **Toast positions:** bottom-right (existing pattern).
- **Confirmation modals on mobile:** bottom-sheet, full-width buttons. Centered card on `md:+`.
- **Proration display:** "today" for upgrades (charge), "next bill" for downgrades (credit). Round to whole dollars. No fractions.
- **Cancel CTA placement:** only inside Manage popup. Not exposed on tier-change page or anywhere else.
- **"Cancel subscription" final button color:** red-text + ghost, never red-base solid (don't make it the most prominent CTA).

## Out of scope

- Real proration math (V1 is mocked).
- Server-driven cancellation/renewal scheduling.
- Win-back email after cancel.
- Reactivation after lapse (`lapsed` state just routes to Upsell).
- Multi-account billing (V1 assumes one account).
- Receipts / invoice list (future Billing page surface).
