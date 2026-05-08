# Billing Structure Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Flatten `PaymentMethodsCard` so all three Billing sections share the same shape, add an Add-subscription affordance to the Subscriptions section header (with proper empty-state copy), and tighten the per-section header→content gap on mobile.

**Architecture:** Two-file refactor across `src/pages/account/PaymentMethodsCard.jsx` and `src/pages/account/BillingPanel.jsx`. No new files. Each task is independently verifiable in browser; ordered by dependency (flatten first, then add affordance + empty state, then mobile gap on remaining sections).

**Tech Stack:** React 19, Tailwind v4, Lucide React, React Router 7. No automated test suite — verification is manual via the Claude Preview MCP server (`preview_eval`, `preview_resize`, `preview_inspect`) at mobile (375×812) and desktop (1280×800).

**Spec:** `docs/superpowers/specs/2026-05-08-billing-structure-design.md`

---

## File Map

| File | Touched by | Responsibility |
|---|---|---|
| `src/pages/account/PaymentMethodsCard.jsx` | Task 1 | Flatten outer card wrapper; switch to `gap-2 md:gap-3` flex column; preserve header shape and `<ul>` of CardRow children. |
| `src/pages/account/BillingPanel.jsx` | Task 2, Task 3 | Add `Plus` + `Link` imports; add Add-subscription button to Subscriptions header; add empty-state line; tighten Subscriptions and Billing-history wrappers from `gap-3` to `gap-2 md:gap-3`. |

Implementation order:
1. **Task 1** — flatten `PaymentMethodsCard` (single file).
2. **Task 2** — add Add-subscription button + empty state in `BillingPanel`.
3. **Task 3** — mobile gap tweak in `BillingPanel` (Subscriptions and Billing-history wrappers).

Three commits total.

---

## Task 1: Flatten PaymentMethodsCard

**Why:** Today `PaymentMethodsCard.jsx` is a self-contained card with chip+title inside its outer wrapper. The other two Billing sections use `chip+title outside, content (cards) below`. Flattening Payment method to match unifies the three sections; visual weight comes from the card-style children.

**Files:**
- Modify: `src/pages/account/PaymentMethodsCard.jsx`

- [ ] **Step 1: Replace the outer wrapper and inner spacing**

Open `src/pages/account/PaymentMethodsCard.jsx`. The current return block reads:

```jsx
return (
  <div className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6">
    {/* Header — chip + title + tooltip on the left, Add button
        on the right. On narrow viewports the Add button shows
        icon-only so the row never wraps. */}
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

    <ul className="mt-4 flex flex-col gap-2">
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

Replace with:

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

Two diffs vs. before:
1. Outer wrapper className changes from `rounded-xl border border-border bg-surface p-4 shadow-sm md:p-6` to `flex flex-col gap-2 md:gap-3`. Card chrome (rounded corners, border, surface bg, padding, shadow) goes away.
2. The `<ul>` loses its `mt-4` (the gap-2/gap-3 on the new wrapper applies the spacing instead).

The header block, the `CardRow` map, the `EditPaymentModal`, and the `CardRow` definition at the bottom of the file are all unchanged.

The `CardRow` `<li>` children already have their own `border` and `rounded-lg` — they continue to read as card-style rows after the outer wrapper drops.

- [ ] **Step 2: Manual verify**

Start the preview server if not already running:
```
preview_start "Vite Dev Server"
preview_resize preset=desktop
```

Navigate to `http://localhost:5173/account/billing`.

Verify:
- The Payment method section shows: chip + "Payment method" + tooltip + "Add card" button on the right, then a list of card rows below.
- There is NO outer card border/background enclosing the section. The chip+title sits flush with the page background.
- Card rows below still have their individual borders (the primary card with blue border + tint, secondary cards with default border).

Use `preview_eval` to confirm the outer wrapper is gone:
```js
(() => {
  const heading = [...document.querySelectorAll('h2')].find(h => h.textContent === 'Payment method');
  const sectionWrapper = heading?.closest('.flex.flex-col');
  // The wrapper should NOT have rounded-xl or border or bg-surface
  const cls = sectionWrapper?.className || '';
  return {
    hasOuterCardChrome: cls.includes('rounded-xl') || cls.includes('border-border') || cls.includes('bg-surface'),
    hasFlexCol: cls.includes('flex flex-col'),
    hasGap2MdGap3: cls.includes('gap-2') && cls.includes('md:gap-3'),
  };
})()
```
Expected: `{ hasOuterCardChrome: false, hasFlexCol: true, hasGap2MdGap3: true }`.

Resize to mobile (375). Verify the Payment method section still renders correctly: chip + title + icon-only Add button (label hidden at `<sm:`), card rows below at full width.

- [ ] **Step 3: Commit**

```bash
git add src/pages/account/PaymentMethodsCard.jsx
git commit -m "$(cat <<'EOF'
refactor(billing): flatten PaymentMethodsCard

Drop the outer rounded-xl/border/shadow wrapper so the section reads
as a header + list of card-style rows below — same shape as
Subscriptions and Billing history. Visual weight comes from the
CardRow children (each already a self-contained card-style row), not
from an enclosing shell. Inner ul loses its mt-4; the new
gap-2 md:gap-3 on the wrapper applies the spacing. Resolves
billing-structure item 1.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Add subscription button + empty state

**Why:** Today the Subscriptions section has no way to add a new subscription from inside Settings — users have to know to use the AccountSwitcher's Add account. Adding an "Add subscription" `<Link>`-styled button to the Subscriptions section header (mirroring Payment method's "Add card") puts the affordance where users look. Empty-state copy ensures `subs.length === 0` doesn't render an empty section.

**Files:**
- Modify: `src/pages/account/BillingPanel.jsx`

- [ ] **Step 1: Update imports**

Open `src/pages/account/BillingPanel.jsx`. The current top of the file reads:

```jsx
import { Layers, Receipt } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { mockInvoices } from '@/mocks/invoices'
import PaymentMethodsCard from './PaymentMethodsCard'
import SubscriptionCard from './SubscriptionCard'
import InvoicesTable from './InvoicesTable'
```

Replace with:

```jsx
import { Link } from 'react-router-dom'
import { Layers, Plus, Receipt } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useSubscriptions } from '@/stores/useSubscriptions'
import { mockInvoices } from '@/mocks/invoices'
import PaymentMethodsCard from './PaymentMethodsCard'
import SubscriptionCard from './SubscriptionCard'
import InvoicesTable from './InvoicesTable'
```

Two diffs:
- New `import { Link } from 'react-router-dom'` line at the top.
- `Plus` added alphabetically to the Lucide import (between `Layers` and `Receipt`).

- [ ] **Step 2: Update the Subscriptions section**

Find the Subscriptions section in `BillingPanel.jsx`. It currently reads:

```jsx
{/* Subscriptions — read-only here. New subscriptions are
    created by connecting a new Instagram account from the
    sidebar AccountSwitcher (single source for adding
    accounts). */}
<div className="flex flex-col gap-3">
  <div className="flex items-center gap-2">
    <CardChip color="blue" icon={Layers} />
    <h2 className="text-base font-semibold text-text-primary">Subscriptions</h2>
    <span className="inline-flex rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
      {subs.length}
    </span>
    <InfoTooltip text="One subscription per connected Instagram account. Each one bills against your primary payment method." />
  </div>
  <div className="flex flex-col gap-3">
    {subs.map((sub) => (
      <SubscriptionCard key={sub.id} subscription={sub} />
    ))}
  </div>
</div>
```

Replace with:

```jsx
{/* Subscriptions — one per connected Instagram account. The header
    Add button routes to the same signup flow used by AccountSwitcher's
    "Add account" so adding a subscription from here connects a new IG
    account end-to-end. */}
<div className="flex flex-col gap-3">
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
</div>
```

Three diffs:
1. Comment block updated to reflect the new behavior.
2. New `<Link to="/signup/ig-preview">` added at the end of the header row (after the InfoTooltip).
3. The list-rendering block wrapped in a `subs.length === 0 ? <empty-state> : <list>` ternary.

- [ ] **Step 3: Manual verify — Add subscription button**

Reload preview at desktop (1280×800). Navigate to `/account/billing`. Verify:
- The Subscriptions section header now ends with an "Add subscription" button on the right.
- The button has a `Plus` icon + the text "Add subscription".
- The button styling matches Payment method's "Add card" button (same height, border, hover).

Use `preview_eval` to confirm the link target:
```js
(() => {
  const heading = [...document.querySelectorAll('h2')].find(h => h.textContent === 'Subscriptions');
  const headerRow = heading?.parentElement;
  const addBtn = headerRow?.querySelector('a[aria-label="Add subscription"]');
  return {
    addBtnPresent: !!addBtn,
    href: addBtn?.getAttribute('href'),
    labelVisible: !!addBtn?.querySelector('span.hidden.sm\\:inline')?.textContent,
  };
})()
```
Expected: `{ addBtnPresent: true, href: '/signup/ig-preview', labelVisible: true }` (label visible at desktop).

Resize to mobile (375). Verify:
- The Add subscription button is visible (icon-only at `<sm:`, the label span is hidden).

- [ ] **Step 4: Manual verify — empty-state copy**

The current mocks have 3 subscriptions, so the empty-state branch isn't exercised by default. Force the branch via `preview_eval` (sets the subscriptions store to an empty array temporarily):

```js
(async () => {
  // Find the Zustand store via window.__USE_SUBSCRIPTIONS__ (some setups expose stores; fallback to file edit if not).
  // For a non-invasive check, just verify the empty-state JSX is reachable by inspecting the source structure.
  const heading = [...document.querySelectorAll('h2')].find(h => h.textContent === 'Subscriptions');
  const sectionWrapper = heading?.closest('.flex.flex-col.gap-3');
  // With 3 subs in mocks, the list div should be present.
  const listDiv = sectionWrapper?.querySelector('.flex.flex-col.gap-3 > div.flex.flex-col.gap-3');
  return { listChildCount: listDiv?.children.length ?? 0 };
})()
```
Expected: `{ listChildCount: 3 }` (the three SubscriptionCard children, confirming the non-empty branch renders).

For visual confirmation of the empty-state copy, temporarily edit `src/mocks/subscriptions.js` to export `mockSubscriptions = []`, refresh the page, verify the empty-state line renders, then revert.

If editing mocks is too invasive for verification, alternatively inspect the source file to confirm the conditional renders the correct JSX (the diff itself verifies the copy — if the diff matches the spec, the empty-state is correct).

- [ ] **Step 5: Commit**

```bash
git add src/pages/account/BillingPanel.jsx
git commit -m "$(cat <<'EOF'
feat(billing): Add subscription button + empty state

Subscriptions section header gains an "Add subscription" Link styled
identically to Payment method's "Add card" — Plus icon, icon-only at
<sm:, label visible at sm:+. Routes to /signup/ig-preview (same
destination as AccountSwitcher's Add account, since adding a
subscription = connecting a new IG account). Empty-state copy
("No subscriptions yet — connect your first Instagram account to get
started.") renders below the header when subs.length === 0 instead
of the previous silent empty render. Resolves billing-structure item 2.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Mobile section-header→content gap

**Why:** The deferred polish-pass complaint #15 ("mobile billing-history vertical spacing — no weight at the top") was diagnosed as a structural mobile-spacing issue. After Tasks 1 and 2 land (all three sections sharing shape and Subscriptions getting its right-side button), tightening the per-section internal gap from 12px to 8px on mobile anchors the section header against its first child without needing an outer card wrapper.

`PaymentMethodsCard` already uses `gap-2 md:gap-3` after Task 1; this task brings Subscriptions and Billing history into alignment.

**Files:**
- Modify: `src/pages/account/BillingPanel.jsx`

- [ ] **Step 1: Update the Subscriptions wrapper className**

In `BillingPanel.jsx`, find the Subscriptions section's outer wrapper:

```jsx
<div className="flex flex-col gap-3">
  <div className="flex items-center gap-2">
    <CardChip color="blue" icon={Layers} />
    <h2 className="text-base font-semibold text-text-primary">Subscriptions</h2>
    {/* … */}
```

Change ONLY the outermost `<div>`'s className — from `flex flex-col gap-3` to `flex flex-col gap-2 md:gap-3`:

```jsx
<div className="flex flex-col gap-2 md:gap-3">
```

The inner `<div className="flex flex-col gap-3">` that wraps the SubscriptionCard list (the gap BETWEEN cards in the list) stays unchanged at `gap-3` — that's the gap between subscription cards, not the header-to-content gap.

- [ ] **Step 2: Update the Billing history wrapper className**

In `BillingPanel.jsx`, find the Billing history section's outer wrapper:

```jsx
<div className="flex flex-col gap-3">
  <div className="flex items-center gap-2">
    <CardChip color="neutral" icon={Receipt} />
    <h2 className="text-base font-semibold text-text-primary">Billing history</h2>
    {/* … */}
```

Change the outermost `<div>`'s className — from `flex flex-col gap-3` to `flex flex-col gap-2 md:gap-3`:

```jsx
<div className="flex flex-col gap-2 md:gap-3">
```

- [ ] **Step 3: Manual verify**

Reload preview at mobile (375×812). Navigate to `/account/billing`. Verify:
- The gap between the Subscriptions section header and the first subscription card looks tighter than before (~8px not 12px).
- Same for Billing history.
- All three sections (Payment method, Subscriptions, Billing history) read at the same visual density — section header sits ~8px above its first child.

Use `preview_eval` to compare gap rules:
```js
(() => {
  const headings = [...document.querySelectorAll('h2')]
    .filter(h => ['Payment method', 'Subscriptions', 'Billing history'].includes(h.textContent));
  return headings.map(h => {
    const wrapper = h.closest('.flex.flex-col');
    return {
      title: h.textContent,
      wrapperClass: wrapper?.className,
    };
  });
})()
```
Expected: All three wrappers' classNames include `gap-2 md:gap-3` (Payment method via Task 1, Subscriptions and Billing history via this task).

Resize to desktop (1280×800). Verify:
- The gap between section header and content reads at 12px (`md:gap-3` engages).
- Layout looks identical to before this task on desktop (this task is mobile-only).

- [ ] **Step 4: Commit**

```bash
git add src/pages/account/BillingPanel.jsx
git commit -m "$(cat <<'EOF'
fix(billing): tighten mobile section-header→content gap

Drop the per-section internal gap from 12px to 8px on mobile,
restore 12px on md:+. Anchors each section header against its first
child card on mobile without needing an outer card wrapper.
Resolves the deferred polish-pass "no weight at the top" complaint
(billing-structure item 3).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

- [ ] **Step 1: Sweep all three Billing sections at mobile + desktop**

With the dev server running, navigate to `/account/billing` at mobile (375×812) and desktop (1280×800).

Verify:
- All three section headers (Payment method, Subscriptions, Billing history) sit flush with the page background — no enclosing card chrome on any of them.
- Payment method header: chip + "Payment method" + (i) tooltip + "Add card" button on the right.
- Subscriptions header: chip + "Subscriptions" + count pill + (i) tooltip + "Add subscription" button on the right.
- Billing history header: chip + "Billing history" + (i) tooltip. No right-side action (read-only section).
- Each section's header sits ~8px above its first child on mobile, ~12px on desktop.
- All card-style children (payment-method rows, subscription cards, invoice cards/table) render with their own borders.
- Tapping "Add subscription" routes to `/signup/ig-preview`.

- [ ] **Step 2: Check git log**

```bash
git log --oneline -5
```

Expected: three new commits on top of the spec commit (`b9ae40d`), in this order: flatten PaymentMethodsCard, Add subscription + empty state, mobile gap.

---

## Notes for the implementer

- The codebase has no automated test suite. Verification is manual via the preview MCP server.
- Use `preview_inspect` over `preview_screenshot` for verifying className changes — screenshots are unreliable for exact pixel checks.
- After Task 1, the Payment method section's chip-color and tooltip don't change; only the wrapper does. If the section visually loses its weight in browser, that's expected — it's by design (Path A from the spec). The unification + tighter mobile gaps (Task 3) are what restore the "weight" feeling.
- The `<Link>` from `react-router-dom` is the right primitive for the Add subscription affordance (vs. a `<button>` calling `navigate()`) so cmd-click / middle-click open in a new tab as expected.
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
- Don't restructure `SubscriptionCard`, `InvoicesTable`, or `CardRow` — they're out of scope.
- Don't add a count pill to Billing history — explicitly rejected during brainstorm.
- Don't add a full-width "Add subscription" row at the bottom of the list — explicitly rejected during brainstorm.
