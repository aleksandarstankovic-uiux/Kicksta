# Growth+ Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dedicated `/growth-plus` page — a premium subscriber dashboard for paid Growth+ users, with a locked-preview state for non-subscribers that lets them subscribe in place.

**Architecture:** New page tree under `src/pages/growthPlus/` (one page entry + 6 section components + 1 locked-preview wrapper + 1 subscribe overlay). Shared subscribe modal extracted from the signup step. Mock data extended for realistic sparkline + activity feed. Two Zustand additions: a new subscription-flag store and a `growthPlusControls` extension on the existing `useGrowthConfig`. Route registered in `App.jsx`.

**Tech Stack:** React 19, Tailwind v4, Lucide React, Recharts 3 (sparkline), Zustand 5, React Router 7. No new dependencies. No automated test suite — verification is manual via the Claude Preview MCP server (`preview_eval`, `preview_resize`, `preview_inspect`, `preview_click`) at mobile (375×812) and desktop (1280×800).

**Spec:** `docs/superpowers/specs/2026-05-11-growth-plus-page-design.md`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/mocks/growth.js` | Modify | Fix `mockGrowthDaily.growthPlusGain` to non-zero sine wave; add `boostedPosts: 12` to `mockGrowthPlusInsights`. |
| `src/mocks/growthPlusActivity.js` | Create | 5 seed boost-activity events with relative timestamps. |
| `src/stores/useGrowthPlusSubscription.js` | Create | Zustand override for the user's Growth+ subscribed state. |
| `src/stores/useGrowthConfig.js` | Modify | Extend with `growthPlusControls` state + 3 actions. |
| `src/hooks/useCountUp.js` | Create | RAF-driven mount-only count-up hook. |
| `src/components/GrowthPlusSubscribeModal.jsx` | Create | Extracted confirm/processing/success modal. |
| `src/pages/signup/steps/GrowthPlus.jsx` | Modify | Replace inline modal with the extracted component. |
| `src/pages/growthPlus/GrowthPlusHero.jsx` | Create | Hero card — counting number + sparkline + purple gradient. |
| `src/pages/growthPlus/GrowthPlusMetricsStrip.jsx` | Create | 3 supporting metric cards. |
| `src/pages/growthPlus/GrowthPlusActivity.jsx` | Create | Recent boost activity feed. |
| `src/pages/growthPlus/GrowthPlusControls.jsx` | Create | Pause + speed + quality + billing link. |
| `src/pages/growthPlus/GrowthPlusActive.jsx` | Create | Composition root — composes the five sections + safety strip. |
| `src/pages/growthPlus/GrowthPlusSubscribeOverlay.jsx` | Create | Floating overlay for non-subscribers. |
| `src/pages/growthPlus/GrowthPlusLockedPreview.jsx` | Create | Wraps `GrowthPlusActive` in blur + renders overlay + modal. |
| `src/pages/growthPlus/index.jsx` | Create | Page entry — picks active vs locked-preview. |
| `src/App.jsx` | Modify | Register `<Route path="/growth-plus" element={<GrowthPlusPage />}>`. |

Tasks land in dependency order: mocks first (so sections have data) → stores + hooks (so components have state primitives) → modal extraction (independent groundwork) → sections (bottom-up, each verifiable on its own) → composition root → locked-preview → page entry + route.

---

## Task 1: Mock-data updates

**Why:** `mockGrowthDaily.growthPlusGain` is `0` for every entry today; the hero sparkline would render as a flat line. `mockGrowthPlusInsights` is missing the `boostedPosts` field the metrics strip needs.

**Files:**
- Modify: `src/mocks/growth.js`

- [ ] **Step 1: Update `mockGrowthDaily` to produce realistic Growth+ contribution**

Open `src/mocks/growth.js`. Find the line inside the `mockGrowthDaily` map callback:

```js
  const growthPlusGain = 0
```

Replace with:

```js
  const growthPlusGain = Math.max(0, Math.round(Math.sin(i * 0.4) * 5 + 5))
```

This produces a smooth sine wave with values roughly between 0 and 10. Across 30 days the values sum to ~150, close enough to `algorithmicBoost = 143` for the hero number + sparkline to feel consistent.

- [ ] **Step 2: Add `boostedPosts` to `mockGrowthPlusInsights`**

In the same file, find:

```js
export const mockGrowthPlusInsights = {
  algorithmicBoost: 143,
  postReachLift: 0.34,
  engagementRate: 0.048,
}
```

Replace with:

```js
export const mockGrowthPlusInsights = {
  algorithmicBoost: 143,
  postReachLift: 0.34,
  engagementRate: 0.048,
  boostedPosts: 12,
}
```

- [ ] **Step 3: Sanity check**

Run: `node --check src/mocks/growth.js`

Expected: no output (file parses).

- [ ] **Step 4: Commit**

```bash
git add src/mocks/growth.js
git commit -m "$(cat <<'EOF'
feat(mocks): non-zero Growth+ daily contribution + boostedPosts field

mockGrowthDaily.growthPlusGain was 0 for every entry — the upcoming
Growth+ page sparkline would render as a flat line. Switch to a sine
wave summing ~150 across 30 days (matches mockGrowthPlusInsights
.algorithmicBoost = 143 closely enough for the hero stat + sparkline
to read as consistent). Adds boostedPosts: 12 to mockGrowthPlusInsights
for the metrics strip on the Growth+ page. No UI consumers yet — those
land in subsequent tasks.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Mock — Growth+ activity feed

**Why:** The activity feed component needs 5 seed events. Timestamps are computed relative to import-time `Date.now()` so they always read fresh (`2h ago`, `1d ago`) on first load — same trick `mockUser.trialEndsAt` uses.

**Files:**
- Create: `src/mocks/growthPlusActivity.js`

- [ ] **Step 1: Create the mock file**

Create `src/mocks/growthPlusActivity.js`:

```js
// Recent Growth+ boost events. Timestamps are computed relative to import
// time so the feed always reads fresh ("2h ago", "1d ago") on first load
// rather than drifting stale against hardcoded ISO strings.
const _now = Date.now()
const _hourAgo = (h) => new Date(_now - h * 60 * 60 * 1000).toISOString()

export const mockGrowthPlusActivity = [
  {
    id: 'gp_001',
    type: 'post_boosted',
    postTitle: 'Morning workout',
    engagements: 23,
    createdAt: _hourAgo(2),
  },
  {
    id: 'gp_002',
    type: 'followers_gained',
    count: 5,
    createdAt: _hourAgo(4),
  },
  {
    id: 'gp_003',
    type: 'post_boosted',
    postTitle: 'Meal prep tips',
    engagements: 47,
    createdAt: _hourAgo(24),
  },
  {
    id: 'gp_004',
    type: 'followers_gained',
    count: 8,
    createdAt: _hourAgo(48),
  },
  {
    id: 'gp_005',
    type: 'post_boosted',
    postTitle: 'Cardio routine',
    engagements: 19,
    createdAt: _hourAgo(72),
  },
]
```

- [ ] **Step 2: Sanity check**

Run: `node --check src/mocks/growthPlusActivity.js`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/mocks/growthPlusActivity.js
git commit -m "$(cat <<'EOF'
feat(mocks): seed Growth+ activity feed

5 seed events alternating between post_boosted and followers_gained
types. Timestamps computed relative to import time so the feed always
reads fresh on first load. Consumed by GrowthPlusActivity component
in a later task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Subscription Zustand store

**Why:** V1 needs a way to flip the user's Growth+ subscribed state from `false` → `true` when the subscribe modal completes its success step on the Growth+ page. Mutating the `mockUser` export directly is fragile (imports may be cached). A small Zustand store with an override flag is the cleanest path.

**Files:**
- Create: `src/stores/useGrowthPlusSubscription.js`

- [ ] **Step 1: Create the store**

Create `src/stores/useGrowthPlusSubscription.js`:

```js
import { create } from 'zustand'

// V1 override flag for the user's Growth+ subscription state. Starts
// `null` (consumers use mockUser.growthPlusSubscribed as the default).
// Flipped to `true` when the subscribe modal completes its success step
// on the Growth+ page; lets the dashboard re-render inline without
// mutating the mock data.
//
// Consumer pattern:
//   const subscribed = useGrowthPlusSubscription(
//     (s) => s.subscribed ?? mockUser.growthPlusSubscribed,
//   )
//
// In production: subscription state is per-IG-account via
// useSubscriptions[].growthPlus; this store goes away.
export const useGrowthPlusSubscription = create((set) => ({
  subscribed: null,
  markSubscribed: () => set({ subscribed: true }),
}))
```

- [ ] **Step 2: Sanity check**

Run: `node --check src/stores/useGrowthPlusSubscription.js`

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/stores/useGrowthPlusSubscription.js
git commit -m "$(cat <<'EOF'
feat(stores): useGrowthPlusSubscription override flag

V1-only override for the user's Growth+ subscribed state. Starts null
(consumers fall back to mockUser.growthPlusSubscribed); markSubscribed
flips it to true so the Growth+ page can transition from locked-preview
to live dashboard inline after subscribe success. Production replaces
this with per-subscription useSubscriptions[].growthPlus state.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Extend `useGrowthConfig` with Growth+ controls

**Why:** The Growth+ controls section reads + writes a small state shape (`{ enabled, speed, quality }`). Adding it to the existing `useGrowthConfig` store keeps the schema local to where it conceptually belongs without proliferating new store files.

**Files:**
- Modify: `src/stores/useGrowthConfig.js`
- Modify: `src/mocks/growthConfig.js` (verify `growthPlusControls` initial state lives in the mock)

- [ ] **Step 1: Confirm the mock shape**

Open `src/mocks/growthConfig.js`. Check whether `mockGrowthConfig` exports a `growthPlusControls` key. If yes, skip Step 2. If no, add it.

Expected current state (verify): no `growthPlusControls` field. Add this to `mockGrowthConfig`:

```js
  growthPlusControls: {
    enabled: true,
    speed: 'steady',      // 'slow' | 'steady' | 'fast'
    quality: 'targeted',  // 'broad' | 'targeted' | 'high-engagement'
  },
```

Place it alongside the existing `closeFriendsAdder` block so the schema reads top-to-bottom: mode → likeAfterFollow → welcomeDm → closeFriendsAdder → growthPlusControls → filters → growthPlusActive.

- [ ] **Step 2: Extend the `useGrowthConfig` store with three new actions**

Open `src/stores/useGrowthConfig.js`. Add three new actions inside the `create` callback's returned object, after the existing `toggleExcludeNsfw` action and before `toggleGrowthPlusActive`:

```js
  toggleGrowthPlusEnabled: () => {
    set((state) => ({
      config: {
        ...state.config,
        growthPlusControls: {
          ...state.config.growthPlusControls,
          enabled: !state.config.growthPlusControls.enabled,
        },
      },
    }))
    announceSaved()
  },

  setGrowthPlusSpeed: (speed) => {
    set((state) => ({
      config: {
        ...state.config,
        growthPlusControls: { ...state.config.growthPlusControls, speed },
      },
    }))
    announceSaved()
  },

  setGrowthPlusQuality: (quality) => {
    set((state) => ({
      config: {
        ...state.config,
        growthPlusControls: { ...state.config.growthPlusControls, quality },
      },
    }))
    announceSaved()
  },
```

Each action calls `announceSaved()` to fire the existing debounced "Settings saved." toast — matches every other action in this store.

- [ ] **Step 3: Sanity check**

Run: `node --check src/stores/useGrowthConfig.js && node --check src/mocks/growthConfig.js`

Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add src/stores/useGrowthConfig.js src/mocks/growthConfig.js
git commit -m "$(cat <<'EOF'
feat(stores): growthPlusControls in useGrowthConfig

Adds { enabled, speed, quality } state + three actions
(toggleGrowthPlusEnabled, setGrowthPlusSpeed, setGrowthPlusQuality)
to the existing store. Initial state in mockGrowthConfig:
{ enabled: true, speed: 'steady', quality: 'targeted' }. All three
actions fire the existing announceSaved() debounced toast like every
other action in this store. Consumed by GrowthPlusControls in a later
task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: `useCountUp` hook

**Why:** The hero number animates from 0 to its target on mount. A small RAF-driven hook with easeOutQuart easing is the cleanest implementation — no animation library, no over-engineering.

**Files:**
- Create: `src/hooks/useCountUp.js`

- [ ] **Step 1: Create the hook**

Create `src/hooks/useCountUp.js`:

```jsx
import { useEffect, useRef, useState } from 'react'

// Counts up from 0 to `target` over `duration` ms using requestAnimationFrame.
// Easing: easeOutQuart.
//
// Mount-only — no re-trigger on prop changes. V1 mocks are stable;
// production with live data should re-trigger on `target` change but
// that's a follow-up.
//
// Usage:
//   const value = useCountUp(143)
//   return <p>+{value}</p>
export function useCountUp(target, duration = 600) {
  const [value, setValue] = useState(0)
  const startRef = useRef(null)
  const rafRef = useRef(null)

  useEffect(() => {
    function tick(now) {
      if (startRef.current === null) startRef.current = now
      const elapsed = now - startRef.current
      const progress = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(Math.round(target * eased))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
    // Intentionally mount-only — don't re-trigger when target changes in V1.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return value
}
```

- [ ] **Step 2: Sanity check**

Run: `node --check src/hooks/useCountUp.js`

Expected: no output (or a JSX-related error — `node --check` doesn't parse JSX in `.js`/`.jsx` files reliably). If a JSX error fires, the file's content is small enough to verify by reading it back.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCountUp.js
git commit -m "$(cat <<'EOF'
feat(hooks): useCountUp for animated stat numbers

RAF-driven count-up hook with easeOutQuart easing. Mount-only by
design — V1 mocks are stable, so re-triggering on prop change isn't
needed. ~25 lines, no animation library. First consumer:
GrowthPlusHero in a later task.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Extract `GrowthPlusSubscribeModal` from signup step

**Why:** The confirm/processing/success modal currently lives inline at the bottom of `src/pages/signup/steps/GrowthPlus.jsx` (~140 lines of JSX). Both the signup step AND the new Growth+ page need it. Extracting it now avoids duplication.

**Files:**
- Create: `src/components/GrowthPlusSubscribeModal.jsx`
- Modify: `src/pages/signup/steps/GrowthPlus.jsx`

- [ ] **Step 1: Create the shared modal component**

Create `src/components/GrowthPlusSubscribeModal.jsx`:

```jsx
import { useEffect } from 'react'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
} from 'lucide-react'

const GROWTH_PLUS_PRICE = 49
const MOCK_PAYMENT_METHOD = { brand: 'Visa', last4: '4242' }
const GROWTH_PLUS_BENEFITS = [
  { text: 'Algorithmic post boosting', desc: 'Your posts get pushed to Explore and hashtag feeds' },
  { text: 'Up to 500+ extra followers/mo', desc: 'On top of your base plan growth' },
  { text: 'Increased likes & saves', desc: 'Real engagement signals from active accounts' },
]

// Shared confirm/processing/success modal for adding Growth+. Used by:
// - /signup/growth-plus (during onboarding)
// - /growth-plus (the non-subscriber locked-preview overlay)
//
// State is owned by the parent. Three states drive three render branches:
//   - 'confirm' — full sheet with payment method + benefits + Subscribe button
//   - 'processing' — compact centered spinner
//   - 'success' — full sheet with green check + Continue button
//
// onProcessingDone is called once after 1500ms when state === 'processing',
// so the parent can transition to 'success' without owning the timer.
export default function GrowthPlusSubscribeModal({
  state,
  onClose,
  onConfirm,
  onProcessingDone,
  onSuccess,
  successButtonLabel = 'Continue',
}) {
  useEffect(() => {
    if (state !== 'processing') return
    const id = setTimeout(() => onProcessingDone?.(), 1500)
    return () => clearTimeout(id)
  }, [state, onProcessingDone])

  if (!state) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 lg:items-center"
      style={{ animation: 'fadeIn 0.2s ease-out' }}
      onClick={(e) => {
        if (e.target === e.currentTarget && state === 'confirm') onClose?.()
      }}
    >
      {state === 'processing' && (
        <div
          className="mx-4 mb-4 w-full max-w-sm rounded-2xl bg-surface p-6 shadow-xl lg:mb-0"
          style={{ animation: 'fadeSlideIn 0.25s ease-out' }}
        >
          <div className="flex flex-col items-center py-4 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-purple-base" />
            <p className="mt-3 text-base font-medium text-text-primary">
              Processing payment...
            </p>
          </div>
        </div>
      )}

      {(state === 'confirm' || state === 'success') && (
        <div
          className="w-full rounded-t-2xl bg-surface p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-xl lg:mx-4 lg:max-w-sm lg:rounded-2xl lg:pb-6"
          style={{
            animation:
              typeof window !== 'undefined' && window.innerWidth < 1024
                ? 'drawerSlideUp 0.3s ease-out'
                : 'fadeSlideIn 0.25s ease-out',
          }}
        >
          {state === 'confirm' && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 h-1 w-10 rounded-full bg-border lg:hidden" />
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-tint">
                <CreditCard className="h-6 w-6 text-purple-base" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                Confirm Growth+ subscription
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                Your{' '}
                <span className="font-semibold text-text-primary">
                  {MOCK_PAYMENT_METHOD.brand} ending in {MOCK_PAYMENT_METHOD.last4}
                </span>{' '}
                will be charged ${GROWTH_PLUS_PRICE}/mo. Cancel anytime from your dashboard.
              </p>

              <div className="mt-3 w-full overflow-hidden rounded-xl border border-purple-base/20">
                <div className="bg-purple-tint px-4 py-2">
                  <p className="text-xs font-semibold text-purple-text">
                    What you get with Growth+
                  </p>
                </div>
                <div className="flex flex-col divide-y divide-purple-base/10">
                  {GROWTH_PLUS_BENEFITS.map((benefit) => (
                    <div
                      key={benefit.text}
                      className="flex items-start gap-2.5 px-4 py-2.5 text-left"
                    >
                      <Check
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-purple-base"
                        strokeWidth={2.5}
                      />
                      <div>
                        <p className="text-xs font-medium text-text-primary">
                          {benefit.text}
                        </p>
                        <p className="mt-0.5 text-xs text-text-muted">{benefit.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 flex w-full flex-col gap-4">
                <button
                  onClick={onConfirm}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-purple-base text-base font-semibold text-white transition-opacity hover:opacity-90"
                >
                  Subscribe for ${GROWTH_PLUS_PRICE}/mo
                </button>
                <button
                  onClick={onClose}
                  className="flex h-12 w-full items-center justify-center rounded-lg text-base font-medium text-text-secondary transition-colors hover:text-text-primary"
                >
                  Go back
                </button>
              </div>
            </div>
          )}

          {state === 'success' && (
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 h-1 w-10 rounded-full bg-border lg:hidden" />
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-tint">
                <CheckCircle2 className="h-6 w-6 text-green-text" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">
                Growth+ activated
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-text-secondary">
                Your account is now supercharged. You'll start seeing increased reach and engagement within the next few days.
              </p>

              <button
                onClick={onSuccess}
                className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-green-base text-base font-semibold text-white transition-opacity hover:opacity-90"
              >
                {successButtonLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

The modal's `onProcessingDone` callback fires 1500ms after `state === 'processing'`. This lets the parent advance to `'success'` without duplicating the timer logic. `successButtonLabel` defaults to `Continue`; the signup step can pass `Continue to dashboard` if needed.

- [ ] **Step 2: Update the signup step to use the extracted modal**

Open `src/pages/signup/steps/GrowthPlus.jsx`. Make these changes:

1. **Remove unused imports.** From the existing lucide imports, drop `Loader2`, `X`, `CreditCard`, `CheckCircle2`, `Check` (now used inside the extracted modal — not needed by the signup step itself). Keep `Zap`, `ShieldCheck`, `ArrowRight`, `TrendingUp`, `Users`, `Heart`, `BarChart3`.

   The existing line:
   ```jsx
   import {
     Zap, Check, ShieldCheck, Loader2, ArrowRight, X,
     TrendingUp, Users, Heart, BarChart3, CreditCard, CheckCircle2,
   } from 'lucide-react'
   ```

   becomes:

   ```jsx
   import {
     Zap, Check, ShieldCheck, ArrowRight,
     TrendingUp, Users, Heart, BarChart3,
   } from 'lucide-react'
   ```

   (Kept `Check` because the comparison-table rows in the signup step's main body use it for the ✓ glyphs. Verify before deleting it — grep the file for `<Check` to confirm.)

2. **Add the new import:**
   ```jsx
   import GrowthPlusSubscribeModal from '@/components/GrowthPlusSubscribeModal'
   ```

3. **Update `handleConfirmPayment` to skip the inline setTimeout** (the modal handles it via `onProcessingDone`):

   Before:
   ```jsx
   function handleConfirmPayment() {
     setModalState('processing')
     setTimeout(() => {
       setModalState('success')
     }, 1500)
   }
   ```

   After:
   ```jsx
   function handleConfirmPayment() {
     setModalState('processing')
   }
   ```

4. **Replace the inline modal JSX** (the entire `{modalState && (<div className="fixed inset-0 z-50 flex items-end…">…</div>)}` block at the bottom of the file's return — should be ~140 lines) **with**:

   ```jsx
   <GrowthPlusSubscribeModal
     state={modalState}
     onClose={handleCloseModal}
     onConfirm={handleConfirmPayment}
     onProcessingDone={() => setModalState('success')}
     onSuccess={handleSuccessContinue}
     successButtonLabel="Continue to dashboard"
   />
   ```

- [ ] **Step 3: Manual verify — signup step still works end-to-end**

Start the preview server. Navigate to `http://localhost:5173/signup/growth-plus`.

Click "Add Growth+ — $49/mo". Verify:
- Confirm modal opens with Visa ending in 4242 + 3 benefit rows.
- Click "Subscribe for $49/mo". Modal switches to the spinning Loader2 for ~1.5s.
- Modal switches to the green check / "Growth+ activated" state with `Continue to dashboard` button.
- Clicking the button navigates to `/signup/dashboard-entry`.
- Clicking "Go back" from the confirm state closes the modal.
- Clicking the backdrop while on `confirm` closes the modal (clicking backdrop while on `processing` or `success` does not).

- [ ] **Step 4: Commit**

```bash
git add src/components/GrowthPlusSubscribeModal.jsx src/pages/signup/steps/GrowthPlus.jsx
git commit -m "$(cat <<'EOF'
refactor(growth-plus): extract shared GrowthPlusSubscribeModal

Confirm/processing/success modal pulled out of signup/steps/GrowthPlus.jsx
into src/components/GrowthPlusSubscribeModal.jsx. Identical behavior;
parent owns state, modal handles the 1500ms processing timer via an
onProcessingDone callback. Signup step's handleConfirmPayment loses its
inline setTimeout. successButtonLabel prop lets callers customize the
final CTA — signup step uses "Continue to dashboard", the upcoming
Growth+ page locked-preview will use the default "Continue".

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: `GrowthPlusHero`

**Why:** The visual anchor of the page. Counts up to `+143`, shows a sparkline below.

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusHero.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/growthPlus/GrowthPlusHero.jsx`:

```jsx
import { Sparkles } from 'lucide-react'
import { Line, LineChart, ResponsiveContainer } from 'recharts'
import { mockGrowthDaily, mockGrowthPlusInsights } from '@/mocks/growth'
import { useCountUp } from '@/hooks/useCountUp'

// Hero card for the Growth+ page. Premium purple-gradient surface,
// counting hero number, sparkline.
//
// previewMode: skips the count-up animation + sparkline animation
// (used by the non-subscriber locked-preview wrapper, where animation
// behind a blur reads as jittery).
export default function GrowthPlusHero({ previewMode = false }) {
  const target = mockGrowthPlusInsights.algorithmicBoost
  const animatedValue = useCountUp(target, 600)
  const value = previewMode ? target : animatedValue

  const data = mockGrowthDaily.map((d) => ({
    date: d.date,
    value: d.growthPlusGain,
  }))

  return (
    <section className="overflow-hidden rounded-xl border border-purple-base/20 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 p-5 shadow-sm md:p-6">
      <div className="flex items-center gap-2">
        <span
          aria-hidden="true"
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-purple-text text-surface shadow-sm"
        >
          <Sparkles className="h-4 w-4" />
        </span>
        <span className="text-[11px] font-semibold uppercase tracking-wide text-purple-text">
          GROWTH+
        </span>
        <span className="ml-auto rounded-full bg-green-tint px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-text">
          Active
        </span>
      </div>

      <p className="mt-4 text-5xl font-semibold leading-none text-text-primary md:text-6xl">
        +{value}
      </p>
      <p className="mt-2 text-sm text-text-secondary">
        extra followers from Growth+ this month
      </p>

      <div className="mt-4 h-16 md:h-20">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
            <Line
              type="monotone"
              dataKey="value"
              stroke="var(--color-purple-base)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: 'var(--color-purple-base)' }}
              isAnimationActive={!previewMode}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}
```

**Hook-call note:** `useCountUp` is called unconditionally (always), and the result is conditionally used. Calling hooks conditionally would violate React's rules-of-hooks; calling them unconditionally and ignoring the result is fine.

- [ ] **Step 2: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusHero.jsx
git commit -m "$(cat <<'EOF'
feat(growth-plus): hero card

Purple-gradient hero with Sparkles chip + GROWTH+ eyebrow + Active pill,
animated count-up to mockGrowthPlusInsights.algorithmicBoost, sparkline
below from mockGrowthDaily.growthPlusGain. previewMode prop skips the
count-up + sparkline animations so the locked-preview wrapper renders
cleanly behind blur.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8: `GrowthPlusMetricsStrip`

**Why:** Three supporting metric cards under the hero. Second-tier proof — texture without taking over.

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusMetricsStrip.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/growthPlus/GrowthPlusMetricsStrip.jsx`:

```jsx
import { Heart, Sparkles, TrendingUp } from 'lucide-react'
import { mockGrowthPlusInsights } from '@/mocks/growth'

// Three supporting metric cards under the hero. Read from
// mockGrowthPlusInsights. Each card has a purple icon chip so the
// strip reads as Growth+-owned (rather than a generic dashboard row).
const CARDS = [
  {
    key: 'reach',
    icon: TrendingUp,
    value: `+${Math.round(mockGrowthPlusInsights.postReachLift * 100)}%`,
    label: 'Post reach lift',
    sub: 'beyond your baseline reach',
  },
  {
    key: 'engagement',
    icon: Heart,
    value: `${(mockGrowthPlusInsights.engagementRate * 100).toFixed(1)}%`,
    label: 'Engagement rate',
    sub: 'active accounts that interact',
  },
  {
    key: 'posts',
    icon: Sparkles,
    value: String(mockGrowthPlusInsights.boostedPosts),
    label: 'Boosted posts',
    sub: 'posts boosted this month',
  },
]

export default function GrowthPlusMetricsStrip() {
  return (
    <section className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-4">
      {CARDS.map((c) => {
        const Icon = c.icon
        return (
          <div
            key={c.key}
            className="rounded-xl border border-border bg-surface p-4 shadow-sm md:p-5"
          >
            <span
              aria-hidden="true"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-purple-tint text-purple-text"
            >
              <Icon className="h-4 w-4" />
            </span>
            <p className="mt-3 text-xl font-semibold text-text-primary">{c.value}</p>
            <p className="mt-0.5 text-xs font-medium text-text-primary">{c.label}</p>
            <p className="text-[11px] leading-tight text-text-muted">{c.sub}</p>
          </div>
        )
      })}
    </section>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusMetricsStrip.jsx
git commit -m "$(cat <<'EOF'
feat(growth-plus): supporting metrics strip

Three card row under the hero: Post reach lift, Engagement rate,
Boosted posts. Reads from mockGrowthPlusInsights (extended with
boostedPosts in an earlier task). Stacks to 1-column at <sm:, 3-column
at sm:+. Each card has a purple icon chip so the strip reads as
Growth+-owned.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9: `GrowthPlusActivity`

**Why:** Recent boost activity feed — the emotional centerpiece. Default expanded (different from Engagement-card collapsibles).

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusActivity.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/growthPlus/GrowthPlusActivity.jsx`:

```jsx
import { Sparkles, UserPlus } from 'lucide-react'
import CardChip from '@/components/CardChip'
import { mockGrowthPlusActivity } from '@/mocks/growthPlusActivity'
import { formatRelativeTime } from '@/utils/formatRelativeTime'

// Recent Growth+ boost events. Default expanded — this is the page's
// proof surface, earns being visible without a disclosure click.
function eventRow(event) {
  if (event.type === 'post_boosted') {
    return {
      icon: Sparkles,
      title: `Your post "${event.postTitle}" boosted`,
      sub: `+${event.engagements} engagements from active accounts`,
    }
  }
  return {
    icon: UserPlus,
    title: `+${event.count} followers from boost network`,
    sub: 'Triggered by your 5 most recent posts',
  }
}

export default function GrowthPlusActivity() {
  const items = mockGrowthPlusActivity.slice(0, 5)

  return (
    <section className="rounded-xl border border-border bg-surface p-4 md:p-5">
      <div className="flex items-center gap-2">
        <CardChip color="purple" icon={Sparkles} />
        <h2 className="text-base font-semibold text-text-primary">
          Recent boost activity
        </h2>
        <span className="inline-flex rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className="mt-3 py-6 text-center text-sm text-text-muted">
          No boost activity yet — your first boost will appear here within 24 hours.
        </p>
      ) : (
        <ul className="mt-3 flex flex-col">
          {items.map((event, i) => {
            const row = eventRow(event)
            const Icon = row.icon
            return (
              <li
                key={event.id}
                className={`flex items-center gap-3 py-3 ${
                  i === 0 ? '' : 'border-t border-border'
                }`}
              >
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-tint text-purple-text"
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-text-primary">
                    {row.title}
                  </p>
                  <p className="truncate text-xs text-text-muted">{row.sub}</p>
                </div>
                <span className="shrink-0 text-xs text-text-muted">
                  {formatRelativeTime(event.createdAt)}
                </span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
```

**Verify:** `CardChip` exists at `src/components/CardChip.jsx` and supports `color="purple"`. If not, fall back to inline JSX matching the existing card-chip recipe.

- [ ] **Step 2: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusActivity.jsx
git commit -m "$(cat <<'EOF'
feat(growth-plus): recent boost activity feed

Sparkles header chip + count pill, 5 rows alternating between
post_boosted and followers_gained event types. Reads from
mockGrowthPlusActivity (timestamps computed relative to import time
so they read fresh on each load). Empty state copy locked.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10: `GrowthPlusControls`

**Why:** Pause toggle + speed + quality segmented controls + billing link. One section, four rows. All operational controls in one place.

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusControls.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/growthPlus/GrowthPlusControls.jsx`:

```jsx
import { Link } from 'react-router-dom'
import { ChevronRight, Sliders } from 'lucide-react'
import CardChip from '@/components/CardChip'
import InfoTooltip from '@/components/InfoTooltip'
import { useGrowthConfig } from '@/stores/useGrowthConfig'

const SPEED_OPTIONS = [
  { value: 'slow', label: 'Slow', note: 'Easier on IG; fewer boosts per day.' },
  { value: 'steady', label: 'Steady', note: 'Recommended for most accounts; lower IG safety risk.' },
  { value: 'fast', label: 'Fast', note: 'Maximum boosts; check on results often.' },
]

const QUALITY_OPTIONS = [
  { value: 'broad', label: 'Broad', note: 'Wider reach across audiences.' },
  { value: 'targeted', label: 'Targeted', note: 'Match your niche; balanced reach + engagement.' },
  { value: 'high-engagement', label: 'High-engagement', note: 'Active accounts likely to like + save.' },
]

// Growth+ operational controls — pause toggle + speed + quality segmented
// controls + billing link. All in one section so the user has one place
// to find every Growth+ lever.
export default function GrowthPlusControls() {
  const config = useGrowthConfig((s) => s.config.growthPlusControls)
  const toggleEnabled = useGrowthConfig((s) => s.toggleGrowthPlusEnabled)
  const setSpeed = useGrowthConfig((s) => s.setGrowthPlusSpeed)
  const setQuality = useGrowthConfig((s) => s.setGrowthPlusQuality)

  const speedNote = SPEED_OPTIONS.find((o) => o.value === config.speed)?.note
  const qualityNote = QUALITY_OPTIONS.find((o) => o.value === config.quality)?.note

  return (
    <section className="rounded-xl border border-border bg-surface p-4 md:p-5">
      <div className="flex items-center gap-2">
        <CardChip color="purple" icon={Sliders} />
        <h2 className="text-base font-semibold text-text-primary">Growth+ controls</h2>
        <InfoTooltip text="These controls only affect Growth+. Targeted Growth settings live on the Engagement page." />
      </div>

      <div className="mt-4 flex items-start justify-between gap-3 border-t border-border pt-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary">Boost active</p>
          <p className="mt-0.5 text-xs text-text-secondary">
            Pause boost while keeping your subscription.
          </p>
        </div>
        <CardToggle
          checked={config.enabled}
          onClick={toggleEnabled}
          ariaLabel="Toggle Growth+ boost"
        />
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-medium text-text-primary">Speed</p>
        <SegmentedControl
          options={SPEED_OPTIONS}
          value={config.speed}
          onChange={setSpeed}
          disabled={!config.enabled}
        />
        <p className="mt-2 text-xs text-text-muted">{speedNote}</p>
      </div>

      <div className="mt-4 border-t border-border pt-4">
        <p className="text-sm font-medium text-text-primary">Quality</p>
        <SegmentedControl
          options={QUALITY_OPTIONS}
          value={config.quality}
          onChange={setQuality}
          disabled={!config.enabled}
        />
        <p className="mt-2 text-xs text-text-muted">{qualityNote}</p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-text-secondary">
          Next billing{' '}
          <span className="font-medium text-text-primary">$49.00 on May 25</span>
        </p>
        <Link
          to="/account/growth-plus"
          className="inline-flex items-center gap-1 text-sm font-medium text-purple-text hover:underline"
        >
          Manage
          <ChevronRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </section>
  )
}

function CardToggle({ checked, onClick, ariaLabel }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      onClick={onClick}
      className={`relative inline-flex h-6 w-10 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-green-base' : 'bg-border'
      }`}
    >
      <span
        className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
          checked ? 'translate-x-[18px]' : 'translate-x-0.5'
        }`}
        aria-hidden="true"
      />
    </button>
  )
}

function SegmentedControl({ options, value, onChange, disabled }) {
  return (
    <div
      className={`mt-2 flex w-full rounded-full bg-bg p-1 ${
        disabled ? 'opacity-60' : ''
      }`}
      aria-disabled={disabled}
    >
      {options.map((opt) => {
        const selected = value === opt.value
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            className={`inline-flex h-8 flex-1 items-center justify-center rounded-full px-3 text-xs font-medium transition-colors disabled:cursor-not-allowed ${
              selected
                ? 'bg-surface text-text-primary shadow-sm'
                : 'text-text-secondary hover:text-text-primary'
            }`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusControls.jsx
git commit -m "$(cat <<'EOF'
feat(growth-plus): Growth+ controls card

One section with four rows: Boost active toggle, Speed segmented
control (Slow/Steady/Fast), Quality segmented control
(Broad/Targeted/High-engagement), and a billing line with Manage
link to /account/growth-plus. Reads + writes useGrowthConfig
.growthPlusControls. CardToggle and SegmentedControl are inline
helpers — same recipe as the existing engagement cards, kept
duplicated by design.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11: `GrowthPlusActive` composition root

**Why:** Composes the five sections + the cardless safety strip in order.

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusActive.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/growthPlus/GrowthPlusActive.jsx`:

```jsx
import { ShieldCheck } from 'lucide-react'
import GrowthPlusActivity from './GrowthPlusActivity'
import GrowthPlusControls from './GrowthPlusControls'
import GrowthPlusHero from './GrowthPlusHero'
import GrowthPlusMetricsStrip from './GrowthPlusMetricsStrip'

// Subscriber dashboard for the Growth+ page. Five sections + a quiet
// safety strip at the bottom. previewMode threads through to the hero
// (which skips count-up + sparkline animation behind blur).
//
// `account` is captured for future per-account data wiring — V1 mocks
// don't vary per account so it's unused in the current sections.
//
// eslint-disable-next-line no-unused-vars
export default function GrowthPlusActive({ account, previewMode = false }) {
  return (
    <div className="flex flex-col gap-4 md:gap-5">
      <GrowthPlusHero previewMode={previewMode} />
      <GrowthPlusMetricsStrip />
      <GrowthPlusActivity />
      <GrowthPlusControls />

      <div className="flex items-start gap-2 px-2 py-3">
        <ShieldCheck
          className="mt-0.5 h-4 w-4 shrink-0 text-text-secondary"
          aria-hidden="true"
        />
        <p className="text-xs leading-relaxed text-text-secondary">
          <span className="font-semibold text-text-primary">How Growth+ works.</span>{' '}
          Growth+ uses a network of active accounts to like, save, and share your most recent posts. Boost activity is throttled to stay within Instagram's safety limits. Boosted followers are engagement-driven, not organic.
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusActive.jsx
git commit -m "$(cat <<'EOF'
feat(growth-plus): composition root

GrowthPlusActive composes hero → metrics → activity → controls → safety
strip in order with a gap-4 md:gap-5 flex column. previewMode threads
through to the hero only (the only section with mount-time animation).
The safety strip is inline JSX with no card chrome — deliberate
transparency framing per the spec.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 12: `GrowthPlusSubscribeOverlay`

**Why:** Floating subscribe card for the locked-preview state. Centered (desktop) or near-top (mobile).

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusSubscribeOverlay.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/growthPlus/GrowthPlusSubscribeOverlay.jsx`:

```jsx
import { Check, Sparkles } from 'lucide-react'

const BENEFITS = [
  'Algorithmic post boosting',
  '+34% post reach on average',
  'Active-account engagement signals',
]

// Floating subscribe overlay shown over the blurred GrowthPlusActive
// in the locked-preview state. Compact, focused CTA — not a full
// marketing page (the signup step plays that role). Premium gradient
// + Sparkles + 3-benefit list + Add Growth+ button.
export default function GrowthPlusSubscribeOverlay({ onSubscribeClick }) {
  return (
    <div className="absolute left-1/2 top-24 z-10 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 md:top-1/2 md:-translate-y-1/2">
      <div className="rounded-2xl border border-purple-base/30 bg-gradient-to-br from-purple-tint via-purple-tint to-purple-base/15 p-6 shadow-xl md:p-8">
        <div className="flex justify-center">
          <span
            aria-hidden="true"
            className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-text text-surface shadow-sm"
          >
            <Sparkles className="h-7 w-7" />
          </span>
        </div>

        <h2 className="mt-4 text-center text-2xl font-semibold text-text-primary">
          Unlock Growth+
        </h2>
        <p className="mt-1 text-center text-sm text-text-secondary">
          See exactly this for your account.
        </p>

        <ul className="mt-4 flex flex-col gap-2">
          {BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2 text-sm text-text-primary">
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-purple-base"
                aria-hidden="true"
                strokeWidth={2.5}
              />
              <span>{b}</span>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={onSubscribeClick}
          className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-lg bg-purple-base text-base font-semibold text-white shadow-sm transition-opacity hover:opacity-90"
        >
          Add Growth+ — $49/mo
        </button>

        <p className="mt-3 text-center text-xs text-text-muted">
          Cancel anytime · Add later from your dashboard
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusSubscribeOverlay.jsx
git commit -m "$(cat <<'EOF'
feat(growth-plus): subscribe overlay

Floating purple-gradient card centered over the blurred dashboard.
Sparkles icon, "Unlock Growth+" headline, "See exactly this for
your account." subline (cheeky callback to the blur), 3 benefit
bullets, Add Growth+ button. Mobile: pinned near top
(top-24); desktop: vertically centered (top-1/2 + -translate-y-1/2).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 13: `GrowthPlusLockedPreview`

**Why:** Wraps `GrowthPlusActive` in blur + non-interactivity, renders the overlay on top, owns the subscribe-modal state machine, calls `markSubscribed` on success.

**Files:**
- Create: `src/pages/growthPlus/GrowthPlusLockedPreview.jsx`

- [ ] **Step 1: Create the component**

Create `src/pages/growthPlus/GrowthPlusLockedPreview.jsx`:

```jsx
import { useState } from 'react'
import GrowthPlusSubscribeModal from '@/components/GrowthPlusSubscribeModal'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import GrowthPlusActive from './GrowthPlusActive'
import GrowthPlusSubscribeOverlay from './GrowthPlusSubscribeOverlay'

// Non-subscriber state for the Growth+ page. Renders the live
// subscriber dashboard behind a subtle blur + non-interactive overlay,
// floats the subscribe card on top. Subscribing flips the Zustand
// flag and the page re-renders into the live dashboard inline.
export default function GrowthPlusLockedPreview({ account }) {
  const [modalState, setModalState] = useState(null)
  const markSubscribed = useGrowthPlusSubscription((s) => s.markSubscribed)

  function handleSubscribeSuccess() {
    setModalState(null)
    markSubscribed()
  }

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none select-none opacity-60 blur-[2px]"
      >
        <GrowthPlusActive account={account} previewMode />
      </div>

      <GrowthPlusSubscribeOverlay
        onSubscribeClick={() => setModalState('confirm')}
      />

      <GrowthPlusSubscribeModal
        state={modalState}
        onClose={() => setModalState(null)}
        onConfirm={() => setModalState('processing')}
        onProcessingDone={() => setModalState('success')}
        onSuccess={handleSubscribeSuccess}
      />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/growthPlus/GrowthPlusLockedPreview.jsx
git commit -m "$(cat <<'EOF'
feat(growth-plus): locked-preview wrapper for non-subscribers

Wraps GrowthPlusActive in pointer-events-none + opacity-60 + blur-[2px],
floats the subscribe overlay on top, owns the
confirm/processing/success modal state. On success: closes the modal,
calls useGrowthPlusSubscription.markSubscribed() → page re-renders
into the live dashboard inline.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 14: Page entry + route registration

**Why:** Wires the page into the app. `mockUser.growthPlusSubscribed === false` by default in V1, so the first state users see is the locked-preview.

**Files:**
- Create: `src/pages/growthPlus/index.jsx`
- Modify: `src/App.jsx`

- [ ] **Step 1: Create the page entry**

Create `src/pages/growthPlus/index.jsx`:

```jsx
import { mockUser } from '@/mocks/user'
import { useAccounts } from '@/stores/useAccounts'
import { useGrowthPlusSubscription } from '@/stores/useGrowthPlusSubscription'
import GrowthPlusActive from './GrowthPlusActive'
import GrowthPlusLockedPreview from './GrowthPlusLockedPreview'

// /growth-plus page entry. Reads subscription state from the Zustand
// override (falls back to mockUser.growthPlusSubscribed) and renders
// the matching state. account is the active IG account from
// AccountSwitcher — passed through to GrowthPlusActive for future
// per-account data wiring.
export default function GrowthPlusPage() {
  const subscribed = useGrowthPlusSubscription(
    (s) => s.subscribed ?? mockUser.growthPlusSubscribed,
  )
  const activeAccount = useAccounts((s) =>
    s.accounts.find((a) => a.id === s.activeId),
  )

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 md:px-6 lg:px-8">
      {subscribed ? (
        <GrowthPlusActive account={activeAccount} />
      ) : (
        <GrowthPlusLockedPreview account={activeAccount} />
      )}
    </div>
  )
}
```

- [ ] **Step 2: Register the route in `App.jsx`**

Open `src/App.jsx`. Add the import alongside the other page imports:

```jsx
import GrowthPlusPage from '@/pages/growthPlus'
```

(Alphabetize: it sits between `EngagementPage` and `AccountPage` based on the existing import order? Actually the existing imports are page-by-page rather than strictly alphabetical. Place this new import directly after the existing `import EngagementPage` line for a logical ordering by route.)

Inside the `<Route element={<DashboardLayout />}>` block, add the route after the existing `<Route path="/engagement"` line and before `<Route path="/account"`:

```jsx
<Route path="/growth-plus" element={<GrowthPlusPage />} />
```

The block then reads:

```jsx
<Route path="/" element={<OverviewPage />} />
<Route path="/targeting" element={<TargetingPage />} />
<Route path="/targets" element={<Navigate to="/targeting" replace />} />
<Route path="/growth" element={<Navigate to="/engagement" replace />} />
<Route path="/engagement" element={<EngagementPage />} />
<Route path="/growth-plus" element={<GrowthPlusPage />} />
<Route path="/account" element={<AccountPage />}>
  …
```

- [ ] **Step 3: Manual verify — non-subscriber state (default)**

Start the preview server. Navigate to `http://localhost:5173/growth-plus`.

Verify:
- The page renders inside the DashboardLayout (sidebar + bottom tab bar visible).
- The full subscriber dashboard renders behind a `blur-[2px] opacity-60` overlay.
- The subscribe card floats over the blurred content.
- Hero, metrics, activity, controls, and safety strip are all visible-but-blurred (verify the structure exists even if blurred).
- No console errors.

Use `preview_eval` to confirm:
```js
(() => {
  const overlay = document.querySelector('button:has(>:scope)') // not great selector
  const cards = [...document.querySelectorAll('section')]
  const hero = cards.find(s => s.textContent.includes('GROWTH+'))
  const overlayBtn = [...document.querySelectorAll('button')].find(b => /Add Growth\+/.test(b.textContent))
  return {
    sectionCount: cards.length,
    heroPresent: !!hero,
    overlayCtaText: overlayBtn?.textContent?.trim(),
  }
})()
```
Expected: `{ sectionCount: 4, heroPresent: true, overlayCtaText: 'Add Growth+ — $49/mo' }`.

- [ ] **Step 4: Manual verify — subscribe flow**

Click the `Add Growth+ — $49/mo` button on the overlay. Verify:
- The confirm modal opens (Visa ending 4242 + 3 benefits).
- Clicking `Subscribe for $49/mo` shows the spinner for ~1.5s.
- The success state shows with `Continue` button.
- Clicking `Continue` closes the modal AND the page re-renders into the live dashboard (no blur, animated count-up on hero number, all sections interactive).

- [ ] **Step 5: Manual verify — subscriber state directly**

Refresh the page (clears the Zustand override since stores aren't persisted in V1). The page renders the locked-preview again — that's expected (mock-only V1 behavior; production would persist).

To verify the subscriber state without going through the modal, temporarily flip `mockUser.growthPlusSubscribed` to `true` in `src/mocks/user.js`, refresh, then revert:

```bash
# Temporary inspection — revert after verifying
sed -i.bak 's/growthPlusSubscribed: false/growthPlusSubscribed: true/' src/mocks/user.js
# (refresh the browser, verify the subscriber dashboard renders cleanly)
mv src/mocks/user.js.bak src/mocks/user.js
```

Verify in the subscriber state:
- Hero counts from 0 to +143 over ~600ms on first render.
- Sparkline renders as a smooth purple line (not flat).
- Metrics strip shows 3 cards: `+34%`, `4.8%`, `12`.
- Activity feed shows 5 rows with relative timestamps.
- Controls section has working pause toggle, speed + quality segmented controls (both default to `Steady` and `Targeted`), and a Manage link.
- Safety strip renders cardless at the bottom.

- [ ] **Step 6: Commit**

```bash
git add src/pages/growthPlus/index.jsx src/App.jsx
git commit -m "$(cat <<'EOF'
feat(growth-plus): page entry + route registration

/growth-plus is now a working route. Page entry reads
useGrowthPlusSubscription (falls back to mockUser.growthPlusSubscribed)
and renders GrowthPlusActive or GrowthPlusLockedPreview accordingly.
Active account passed through from useAccounts for future per-account
data wiring. Page wrapped in the standard max-w-5xl container so it
matches Overview / Targeting / Engagement spacing.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Final verification

- [ ] **Step 1: Full sweep at mobile + desktop**

With the dev server running, sweep both states at mobile (375×812) and desktop (1280×800):

**Non-subscriber (default mocks):**
- Visit `/growth-plus`. Locked-preview renders with blur + overlay.
- Subscribe via the overlay → modal flows through confirm → processing → success → reveals live dashboard inline.
- Count-up animates on the hero number after the reveal.

**Subscriber (after subscribing in the modal):**
- Hero shows `+143` with sparkline.
- Metrics strip: 3 cards visible.
- Activity feed: 5 events, timestamps fresh.
- Controls: pause toggle works (toggling fires the saved toast); speed + quality segmented controls update + show tradeoff notes; pausing disables both segmented controls.
- Manage link routes to `/account/growth-plus` (the existing stub).
- Safety strip readable at the bottom.

- [ ] **Step 2: Check git log**

```bash
git log --oneline -15
```

Expected: 14 new commits on top of the spec commit (one per task, including the verify steps in Task 6 and Task 14).

---

## Notes for the implementer

- The codebase has no automated test suite. Verification is manual via the preview MCP server.
- Use `preview_inspect` over `preview_screenshot` for verifying className changes or computed colors — screenshots are unreliable for exact pixel checks.
- The `useCountUp` hook is intentionally mount-only — don't add re-trigger logic on prop change. V1 mocks are stable.
- The `blur-[2px]` arbitrary value in `GrowthPlusLockedPreview` is intentional — Tailwind's preset `blur-sm` is 4px which is too aggressive. The codebase uses arbitrary values like this elsewhere (`w-[88px]`, `text-[11px]`, `translate-x-[18px]`) when the preset scale doesn't fit.
- The `Active` pill in `GrowthPlusHero` always renders, including in `previewMode` (the locked-preview is showing the subscriber view as if subscribed). Don't gate it on subscription state inside the hero — the wrapping component owns that distinction.
- `CardChip` is at `src/components/CardChip.jsx`. Verify `color="purple"` is supported before relying on it (Task 9 and 10). If not supported, the inline shape can fall back to `bg-purple-tint text-purple-text` directly on a span.
- `formatRelativeTime` is at `src/utils/formatRelativeTime.js`. Reused by Task 9.
- The signup step's existing benefit comparison table uses `<Check>` from lucide-react — verify it's still imported after Task 6 Step 2 before committing (the import-pruning step assumes it stays). If the comparison table doesn't actually use `<Check>` (it uses something else), `Check` can be dropped too.
- `mockUser.growthPlusSubscribed` is `false` in the default mock. Don't change it permanently — Task 14's verification steps describe a temporary flip for inspection.
- Tailwind class order convention per `CLAUDE.md`: `layout → spacing → sizing → color → typography → border → shadow → state`.
- Don't lift `CardToggle` or `SegmentedControl` from `GrowthPlusControls.jsx` to a shared file. The recipe is duplicated by design (matches existing engagement-card components).
