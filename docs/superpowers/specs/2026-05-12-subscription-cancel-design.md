# Subscription Cancellation Flow — Design

## Goal

Replace the `CancelSubscriptionModal` stub with a real cancellation experience that reduces churn through honest, reason-tailored save offers — never through dark patterns. The user can always cancel; the flow only ever sells them a real concession.

## Anti-dark-pattern principles (locked, don't revisit)

1. **Close X works at every step.** Dismisses the entire flow without confirmation. State resets on reopen.
2. **"Cancel anyway" ghost shortcut at every step.** Small footer link beside the primary Continue button. Skips remaining steps and jumps to the final confirm. No user is more than two clicks from the cancel button.
3. **Final confirm has equal-weight Keep vs. Cancel buttons.** Both full-width, same height, same prominence. No shrinking the cancel button, no faded "are you really sure" copy.
4. **Save offers are real, not decoys.** Every offered concession (downgrade, pause, server switch) mutates the store and produces a verifiable state change. No "talk to support" placeholders.
5. **Save step is skipped when no real save matches the reason.** "Other" with no offer goes straight to "what you'll lose." Growth-plan users picking "Too expensive" also skip (they're already on the cheaper plan).
6. **No fake urgency.** No countdown timers, no "this offer expires," no "limited time."
7. **No multi-step "are you sure" pile-on after the final decision.** The confirm screen is the last gate. Click Cancel subscription → processing → done.

## Subscription state model

Existing subscription `status` values: `active`, `trialing`, `past_due`. Add two:

| Status | Trigger | Behavior |
|---|---|---|
| `paused` | User accepts pause save offer | Growth halts. Billing skipped until `pauseUntil`. Dashboard shows yellow banner + Resume. Auto-resumes after `pauseUntil` (V1: requires manual Resume; clock-driven resume ships with backend). |
| `cancelled_pending` | User completes cancel flow | Growth continues until `nextBillingAt`. Billing won't recur. Dashboard shows yellow banner + Resume. After period: subscription lapses (backend-shipped). |

Fields added: `pauseUntil: ISOString | null`, `endsAt: ISOString | null`.

Existing `nextBillingAt` stays unchanged — `endsAt` mirrors it at cancel time so the date is stable even if billing dates shift.

## Flow overview

Five-step modal stack (four if the save step is skipped). Internal state lives in `CancelSubscriptionModal` — no app-global state, no URL routing. Parent owns the `open` boolean only.

```
Step 1: Reason            → required
Step 2: Save offer        → conditional (skipped when no save matches)
Step 3: What you'll lose  → required
Step 4: Confirm           → required
Step 5: Success ack       → required
```

Plus three terminal sub-states triggered by save acceptance:
- `downgrade-confirm` (plan switch confirmation)
- `pause-confirm` (pause confirmation)
- `server-confirm` (server switch confirmation)

Each save terminal closes the cancel flow on completion, mutates the store, and fires a toast.

## Step 1: Reason

Single-select from 5 options. Continue button is disabled until a reason is picked.

```
Cancel subscription for @username        [×]
─────────────────────────────────────────────
Why are you cancelling? (helps us improve)

(•) Too expensive
( ) Not enough results
( ) Taking a break from Instagram
( ) Switching to another tool
( ) Other
    [textarea — Tell us more (optional)]

                          [ Cancel anyway ]
[ Continue ]
```

- Reason values: `price` · `results` · `break` · `switching` · `other`.
- "Other" reveals an optional textarea inline (same pattern as the Growth+ cancel flow).
- "Cancel anyway" → jumps to step 4 (confirm), skipping save offer + lose screens.

## Step 2: Save offer (conditional)

The flow reads the reason and renders one of four save variants. If no save matches, this step is skipped.

### 2a — Too expensive (only if currently on Advanced)

```
Cancel subscription for @username        [×]
─────────────────────────────────────────────
Try Growth at $29/mo instead?

You'd save $20/mo. You'll keep core targeting,
filters, and whitelist/blacklist — only Advanced-
tier features (Welcome DMs, gender targeting,
close friends adder) would be removed.

[ Downgrade to Growth ]
[ No thanks, continue cancelling ]

                          [ Cancel anyway ]
```

- "Downgrade to Growth" → opens `DowngradePlanConfirmModal` (sub-state) with proration display (mock).
- On success: cancel flow closes, toast fires, subscription plan = `growth`.
- Growth users skip this step entirely.

### 2b — Not enough results

```
Cancel subscription for @username        [×]
─────────────────────────────────────────────
Want to try a different server first?

Server region affects growth speed and IG safety.
Switching takes effect immediately. Some users see
40% better results within 2 weeks of changing
servers.

Current: US East
Change to: [Server dropdown — EU West, US West,
           AP Southeast]

[ Switch server ]
[ No thanks, continue cancelling ]

                          [ Cancel anyway ]
```

- Reuses existing `ChangeServerModal` pattern. Server switch is already wired (`useSubscriptions.setServer`).
- On switch: cancel flow closes, toast fires, server updated.

### 2c — Taking a break

```
Cancel subscription for @username        [×]
─────────────────────────────────────────────
Want to pause instead?

Growth stops, billing pauses, your targets and
settings are kept. Auto-resumes on the date you
choose.

How long?
[ 30 days ]  [ 60 days ]  [ 90 days ]   ← three button options

                          [ Cancel anyway ]
[ No thanks, continue cancelling ]
```

- Tapping a duration opens `PauseConfirmModal` (sub-state). Confirms duration + resume date.
- On confirm: subscription `status: 'paused'`, `pauseUntil: today + N days`. Cancel flow closes. Toast: "Subscription paused — resumes {date}."

### 2d — Switching to another tool

```
Cancel subscription for @username        [×]
─────────────────────────────────────────────
Which tool are you switching to?

This is optional — your honest answer helps us
improve. We won't try to sell you on staying.

[Dropdown: Iconosquare / Combin / Hootsuite /
          Other / Skip]

[Optional textarea]

[ Continue cancelling ]

                          [ Cancel anyway ]
```

- This is a research question, not a save attempt. No "stay" CTA. Skip button is full-width and unambiguous.
- Submission stored locally (mocked). On Continue → proceed to step 3.

### 2e — Other (no save offer)

Step is skipped. Flow goes from Step 1 → Step 3.

## Step 3: What you'll lose

```
Cancel subscription for @username        [×]
─────────────────────────────────────────────
Here's what will happen:

  [Users] +1,247 followers gained from Kicksta
  Cumulative growth since you subscribed.

  After Jul 12, you'll lose:
  × Targeted Growth (auto-follow + auto-like)
  × 18 active targets and filters
  × Whitelist and blacklist (kept for 30 days)
  × Welcome DMs (Advanced only)
  × Growth+ boost (if subscribed)

You'll keep full access until Jul 12, 2026.

                          [ Cancel anyway ]
[ Back ]   [ Continue ]
```

- Cumulative gain reads from `useGrowthData` or a derived selector — total followers since subscription started.
- Feature list adapts to the subscription's plan and add-ons (Welcome DMs only if Advanced; Growth+ row only if `growthPlus: true`).
- "Kept for 30 days" message on whitelist/blacklist communicates the soft retention so an accidental cancel-then-resubscribe doesn't lose lists.

## Step 4: Confirm

```
Cancel subscription for @username        [×]
─────────────────────────────────────────────
Are you sure?

Your subscription for @username will end on
Jul 12, 2026. You won't be charged again. You'll
keep full access until then.

[ Keep my subscription ]              ← green-base solid
[ Cancel subscription ]               ← red-tint ghost, red-text

                          (no shortcut — this is it)
```

- Both buttons full-width, same height (h-12), same font weight, same emphasis. The green button comes first by convention (primary action = keep paying), but neither is visually de-emphasized.
- No "Cancel anyway" shortcut here — this IS the cancel button.

Click "Cancel subscription" → 1500ms `processing` spinner → step 5.

## Step 5: Success ack

```
Cancel subscription for @username        [×]
─────────────────────────────────────────────
[✓] Subscription cancelled

@username will keep full access until Jul 12, 2026.
We'll send a reminder before it ends.

[ Done ]
```

- Done → modal closes → subscription `status: 'cancelled_pending'`, `endsAt: nextBillingAt` → user routed to `/account/billing` → toast "Subscription cancelled for @username."

## Sub-state modals

These are the save-offer confirmation screens. Each is a separate modal component (not steps inside CancelSubscriptionModal) so they can be reused outside the cancel flow if needed and don't bloat the state machine.

### DowngradePlanConfirmModal

Tier-change-style modal:
- Confirm step: shows current plan ($49) → new plan ($29), monthly savings, when it takes effect (immediately), mock proration credit ("$13 credited to next bill").
- Processing → Success → Done.
- On Done: `subscriptions.setPlan(id, 'growth')` + toast.

### PauseConfirmModal

- Confirm step: shows "Pause for {N} days, resumes on {date}, no billing during pause."
- Processing → Success → Done.
- On Done: `subscriptions.pause(id, days)` + toast.

### ServerSwitchInline (lightweight — no separate modal)

Existing `ChangeServerModal` is the model, but for the save-offer path we keep it inline within step 2b: the dropdown + button live inside the cancel modal step itself. Switch is instant on click.
- On Switch: `subscriptions.setServer(id, newServerId)` + toast + close cancel flow.

## Store changes

Add to `useSubscriptions`:

```js
cancel: (id) => { ... }              // status: 'cancelled_pending', endsAt: sub.nextBillingAt
resume: (id) => { ... }              // status: 'active', endsAt: null, pauseUntil: null
pause: (id, days) => { ... }         // status: 'paused', pauseUntil: today + N days
setPlan: (id, plan) => { ... }       // mutates plan field, fires toast
```

All actions fire toasts via `useToasts`. Existing `setServer`/`toggleGrowthPlus` stay unchanged.

## SubscriptionDetail page — render adaptations

When `status === 'paused'` or `status === 'cancelled_pending'`:

1. **Banner above the page header**, full-width within the page container. Yellow-tint for both states. Component: `SubscriptionStateBanner`.

   - Paused banner: "Paused — resumes {pauseUntil}. Growth halted, billing skipped." + Resume button (real action) + "Resume now" shortcut.
   - Cancelled banner: "Ending {endsAt}. Full access until then." + Resume button (un-cancels).

2. **Status pill** in the header flips:
   - `paused` → yellow-tint "Paused"
   - `cancelled_pending` → yellow-tint "Ending {short-date}"

3. **PlanCard CTA changes** when paused or cancelled_pending:
   - Upgrade plan button hidden
   - Add/Remove Growth+ button hidden
   - A single "Resume subscription" green-base button replaces them.

4. **Cancel subscription button at bottom** is hidden when status is `paused` or `cancelled_pending` (already on the way out). When `paused`: replaced with nothing (the banner has Resume). When `cancelled_pending`: replaced with nothing (banner has Resume + the cancellation already happened).

## Component inventory

**New files:**
- `src/pages/account/CancelSubscriptionModal.jsx` — full rewrite of the stub. Owns the 5-step state machine.
- `src/pages/account/DowngradePlanConfirmModal.jsx` — confirm + success for plan downgrade.
- `src/pages/account/PauseConfirmModal.jsx` — confirm + success for pause.
- `src/pages/account/SubscriptionStateBanner.jsx` — yellow banner for paused / cancelled_pending states.

**Modified files:**
- `src/stores/useSubscriptions.js` — add `cancel`, `resume`, `pause`, `setPlan` actions.
- `src/mocks/subscriptions.js` — add `pauseUntil` and `endsAt` fields (default null) to each subscription.
- `src/pages/account/SubscriptionDetail.jsx` — render banner when paused/cancelled_pending; hide Cancel button accordingly; pass subscription to PlanCard.
- `src/pages/account/PlanCard.jsx` — when paused/cancelled_pending, render Resume button instead of Upgrade/Growth+ controls.
- `src/pages/account/subscriptionShared.js` — extend `STATUS_PILL` with paused + cancelled_pending entries.
- `src/components/InfoTooltip.jsx` — unchanged, reused.

## Edge cases & decisions locked

- **Trialing users:** Cancel flow works the same. End date is the trial end (`trialEndsAt`), not `nextBillingAt`. Copy adjusts: "Trial ends Jul 12 — you won't be charged."
- **Past-due subscriptions:** Cancel flow available but skips save offers (they're not paying anyway). Goes Reason → What you'll lose → Confirm. Final action: subscription `cancelled_pending` with `endsAt: today` (immediate, since there's no paid-through period).
- **Pause while Growth+ active:** Growth+ also pauses for the same window. (Sub-feature follows parent.) Banner notes this.
- **Cancel while paused:** Allowed. Cancellation runs from current paused state; `endsAt` set to `pauseUntil` (paid-through honors the existing pause schedule).
- **Resume from paused:** Sets status back to `active`, clears `pauseUntil`. Growth resumes immediately. Billing date doesn't shift in V1 (in prod: billing-day moves forward by paused duration).
- **Resume from cancelled_pending:** Sets status to `active`, clears `endsAt`. No proration — user hasn't received refund.
- **Plan downgrade after entering the cancel flow:** Treated as a save (not a separate flow). Downgrade-confirm modal exits the cancel flow on success.
- **Switching tools research data:** stored only in the toast for V1 (mock). In prod: would POST to analytics endpoint.
- **Cancel-anyway behavior:** Jumps to step 4 directly. Reason is preserved (for analytics), but save offer is skipped regardless of which step "Cancel anyway" was clicked from.
- **Mobile:** Bottom-sheet for all modal screens. Full-width buttons. Bottom safe-area inset on the confirm screen so the Cancel button isn't clipped by the home indicator.
- **Toast positions:** bottom-right (existing app pattern).
- **Final cancel button label:** "Cancel subscription" — never "Yes" / "OK" / "Confirm." Action name communicates the action.

## Out of scope

- Real proration math (mocked, like Growth+).
- Backend-driven auto-resume from paused or auto-lapse from cancelled_pending.
- Multi-account bulk cancel (V1: per-subscription only).
- Refunds / partial refunds.
- Win-back email after cancel.
- Account-level "delete my Kicksta account" (separate flow, different concern).
- Restoring whitelist/blacklist after the 30-day retention window expires.
