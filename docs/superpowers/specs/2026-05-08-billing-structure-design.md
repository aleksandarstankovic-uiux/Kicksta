# Billing Structure — Design Spec

**Date:** 2026-05-08
**Goal:** Make the three Billing sections (Payment method, Subscriptions, Billing history) read at the same visual density, add a discoverable "Add subscription" affordance to the Subscriptions header, and resolve the deferred polish-pass complaint that the mobile billing layout has "no weight at the top" by tightening header-to-content spacing rather than adding outer card wrappers.

**Architecture:** Two-file refactor. `src/pages/account/PaymentMethodsCard.jsx` flattens — its outer card wrapper drops, the chip+title+tooltip+Add-card row becomes a plain section header. `src/pages/account/BillingPanel.jsx` adds an Add-subscription `<Link>` button to the Subscriptions section header, an explicit empty-state line below the subscription list when `subs.length === 0`, and tightens the per-section header-to-content gap on mobile (`gap-2 md:gap-3`).

**Tech stack:** React, Tailwind, Lucide, React Router (`Link` from `react-router-dom` — already imported in `BillingPanel`'s neighborhood; verify on first edit).

**Source brainstorm:** 2026-05-08 — items #13, #14, and #15 from the original 18-item batch.

---

## Item 1 — Flatten PaymentMethodsCard

**Why:** Today `PaymentMethodsCard.jsx` is a self-contained card with chip+title inside its own outer wrapper, while Subscriptions and Billing history use the pattern `chip+title outside, content (cards) below`. The mismatch makes Payment method look anchored and the other two look weightless. Flattening Payment method to match unifies the three sections; visual weight comes from the card-style children (CardRow `<li>`s for payment methods, SubscriptionCard for subscriptions, invoice cards for Billing history) — not from a wrapping shell.

**Files:**
- Modify: `src/pages/account/PaymentMethodsCard.jsx`

**Change:** drop the outer `<div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">` wrapper that currently encloses the entire component body. Replace with a `<div className="flex flex-col gap-2 md:gap-3">` so the section's internal spacing matches what `BillingPanel` enforces for the other two sections (Item 3 covers this gap rule).

**Final shape** of `PaymentMethodsCard.jsx`'s render body — replace the existing return block with:

```jsx
return (
  <div className="flex flex-col gap-2 md:gap-3">
    {/* Section header — chip + title + tooltip on the left, Add card
        button on the right. Identical recipe to the other two Billing
        sections (Subscriptions, Billing history) so the page reads as
        three parallel sections. The Add button is icon-only on the
        smallest viewports so the row never wraps. */}
    <div className="flex items-center gap-2">
      <CardChip color="blue" icon={CreditCard} />
      <h2 className="text-base font-semibold text-text-primary">Payment method</h2>
      <InfoTooltip text="Cards on file for this account. The primary card is charged for every subscription." />
      <button
        onClick={openAdd}
        aria-label="Add payment method"
        className="ml-auto inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-bg"
      >
        <Plus className="h-4 w-4" />
        <span className="hidden sm:inline">Add card</span>
      </button>
    </div>

    <ul className="flex flex-col gap-2">
      {cards.map((card) => (
        <CardRow
          key={card.id}
          card={card}
          onEdit={() => openEdit(card.id)}
          onSetPrimary={() => setPrimary(card.id)}
          onRemove={() => removeCard(card.id)}
        />
      ))}
    </ul>

    <EditPaymentModal
      open={modalOpen}
      cardId={modalCardId}
      onClose={() => setModalOpen(false)}
    />
  </div>
)
```

**Diffs vs. before:**
1. Outer wrapper className changes from `rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6` to `flex flex-col gap-2 md:gap-3`. The card chrome (rounded corners, border, surface bg, padding, shadow) goes away — the children carry their own visual weight.
2. The `<ul>` loses its `mt-4` (was applying space below the header inside the old outer card; now the gap between header and `<ul>` comes from the flex-col gap on the new wrapper).

**The `CardRow` component** at the bottom of the file — unchanged. Each `<li>` already has its own `border` and `rounded-lg`, so the row-as-card visual still reads.

**Acceptance:** `PaymentMethodsCard` renders as a section header (chip + title + tooltip + Add card button) followed by a list of payment-method rows, with no enclosing outer-card border or background. The header sits flush with the page background; the rows below carry the visual weight via their own borders.

---

## Item 2 — Add subscription affordance + empty state

**Why:** Today the Subscriptions section has no way to add a new subscription from inside Settings — users have to know they should go to the AccountSwitcher and tap "Add account." Adding an "Add subscription" button to the Subscriptions section header puts the affordance where users look; routing it to `/signup/ig-preview` (the same destination as Add account, since adding a new IG account creates a new subscription) means one flow, multiple entry points.

The header currently lacks any right-side action; with this change it mirrors Payment method's "Add card" pattern exactly.

**Files:**
- Modify: `src/pages/account/BillingPanel.jsx`

**Imports added:**
```jsx
import { Link } from 'react-router-dom'
import { Layers, Plus, Receipt } from 'lucide-react'  // Plus added to the existing Lucide import
```

(The existing import is `import { Layers, Receipt } from 'lucide-react'`; add `Plus` alphabetically.)

If `Link` from `react-router-dom` is already imported in this file (verify on edit), don't duplicate the import — just use it.

**Change to the Subscriptions section header.** Currently:

```jsx
<div className="flex items-center gap-2">
  <CardChip color="blue" icon={Layers} />
  <h2 className="text-base font-semibold text-text-primary">Subscriptions</h2>
  <span className="inline-flex rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
    {subs.length}
  </span>
  <InfoTooltip text="One subscription per connected Instagram account. Each one bills against your primary payment method." />
</div>
```

Replace with:

```jsx
<div className="flex items-center gap-2">
  <CardChip color="blue" icon={Layers} />
  <h2 className="text-base font-semibold text-text-primary">Subscriptions</h2>
  <span className="inline-flex rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
    {subs.length}
  </span>
  <InfoTooltip text="One subscription per connected Instagram account. Each one bills against your primary payment method." />
  <Link
    to="/signup/ig-preview"
    aria-label="Add subscription"
    className="ml-auto inline-flex h-10 shrink-0 items-center gap-1 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-text-primary hover:bg-bg"
  >
    <Plus className="h-4 w-4" />
    <span className="hidden sm:inline">Add subscription</span>
  </Link>
</div>
```

**Why a `<Link>` and not a `<button>` calling `navigate()`:** users expect cmd-click / middle-click on the affordance to open the destination in a new tab. A `<button>` doesn't support that. The destination is a known route, so `<Link>` is the right primitive.

**Empty state below the list.** Currently the subscription list renders silently as an empty `<div>` if `subs.length === 0` (the `subs.map()` returns no children). Replace the existing list block:

```jsx
<div className="flex flex-col gap-3">
  {subs.map((sub) => (
    <SubscriptionCard key={sub.id} subscription={sub} />
  ))}
</div>
```

With:

```jsx
{subs.length === 0 ? (
  <p className="text-sm text-text-secondary">
    No subscriptions yet — connect your first Instagram account to get started.
  </p>
) : (
  <div className="flex flex-col gap-3">
    {subs.map((sub) => (
      <SubscriptionCard key={sub.id} subscription={sub} />
    ))}
  </div>
)}
```

**Acceptance:** Subscriptions section header displays an "Add subscription" `<Link>`-styled button on the right (icon-only at `<sm:` widths, icon + label at `sm:+`). Tapping it routes to `/signup/ig-preview`. With zero subscriptions, the empty-state copy renders below the header instead of an empty space.

---

## Item 3 — Mobile section-header→content gap

**Why:** The deferred polish-pass complaint #15 ("mobile billing-history vertical spacing — no weight at the top") was diagnosed as a structural issue: the section header floats too far from its content on mobile. Tightening the per-section internal gap from 12px to 8px on mobile (and keeping 12px on `md:+`) anchors the header visually without needing to wrap each section in a card.

**Files:**
- Modify: `src/pages/account/BillingPanel.jsx` (Subscriptions and Billing history wrappers; Payment methods is handled by Item 1)

**Change:** in `BillingPanel.jsx`, the Subscriptions wrapper and the Billing history wrapper both use `<div className="flex flex-col gap-3">` today. Change both to:

```jsx
<div className="flex flex-col gap-2 md:gap-3">
```

Item 1 already changes `PaymentMethodsCard.jsx`'s wrapper to the same `gap-2 md:gap-3` so all three sections have the same internal gap rule.

The outer `<div className="flex flex-col gap-6">` between sections in `BillingPanel.jsx` is unchanged — that 24px gap reads correctly on both mobile and desktop.

**Acceptance:** On mobile (375px), the gap between each section's header and its first child card/row reads at 8px (visually anchored). On `md:+` (≥768px), the gap is 12px (unchanged from today). All three sections behave identically.

---

## Out of scope

- Billing history's count pill (rejected during brainstorm — header stays without count, gap-tightening alone restores parity).
- A full-width "Add subscription" row at the bottom of the subscription list (rejected — header button is the single discovery affordance; redundant placement adds clutter).
- Restyling individual `SubscriptionCard` or invoice rows — they already work as card-style children. Out of scope for this spec.
- The InvoicesTable mobile branch's max-height and scroll behavior — unchanged.

---

## Implementation notes for the plan

- Tasks land in this order:
  1. Item 1 (flatten PaymentMethodsCard) — single file, isolated.
  2. Item 2 (Add subscription button + empty state) — adds new imports and one section update.
  3. Item 3 (mobile gap tweak) — touches the two `gap-3` wrappers in BillingPanel and the one in the flattened PaymentMethodsCard. Item 1 already includes the Payment-methods change; Item 3 just covers Subscriptions and Billing history.
- The codebase has no automated test suite; verification is manual via the preview MCP server at mobile (375×812) and desktop (1280×800).
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
- No new component files. No new mock data.
- After Item 2, manually verify in browser that the Add subscription button is visible at desktop and icon-only at mobile, and that tapping it routes to `/signup/ig-preview`.
- The empty-state copy is only visible if `subs.length === 0` — current mocks have 3 subscriptions, so this branch isn't exercised at runtime by default. Verify via temporarily empty-ing the mocks or by inspection.
