# Overview AccountCard Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Ship the Overview AccountCard redesign per `docs/superpowers/specs/2026-04-24-overview-account-card-redesign.md` — move live automation status directly under the `@handle` with ambient animation + shimmer, replace the old `StatusPill` (and its popover) with a dedicated `Pause growth` / `Resume growth` CTA, and drop the full-name row.

**Architecture:** Two new local components (`AccountLiveStatus`, `AccountPauseCTA`) defined in the same file as `AccountCard`. They replace the existing `StatusPill` and its popover. One CSS keyframe addition for the text shimmer. `useSystemStatus` hook and phase state machine unchanged.

**Tech Stack:** React 19 · Tailwind 4 · Zustand 5 (for the existing `useToasts`) · Lucide React.

**Testing:** No unit-test framework. Verification is visual via the Claude Preview dev server + inspection of rendered DOM state. Each task commits.

---

## File Structure

**Modified:**
- `src/index.css` — add a single `@keyframes status-shimmer` rule.
- `src/pages/overview/index.jsx` — add two local components, swap their usage into `AccountCard`, remove the full-name line, delete `StatusPill` + `WorkingDots` + `formatApproxTime`.

**Unchanged:**
- `src/hooks/useSystemStatus.js`
- `src/mocks/systemStatus.js`
- `src/stores/useToasts.js`
- `src/components/Toast.jsx`
- `src/pages/targets/LiveActivityCard.jsx` (cross-page consistency preserved via shared hook).

---

## Conventions

- Spacing scale: 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64.
- Design tokens only — never arbitrary hex.
- Commit prefix: `feat(overview-v4): …` / `chore(overview-v4): …`.
- Breakpoint note: the existing `AccountCard` uses `sm:` (not `lg:`) to swap between mobile and desktop layouts. Match that pattern — all new responsive classes use `sm:` unless a specific zone needs a different breakpoint.

---

## Task 1: Add shimmer keyframe to global CSS

**Files:** Modify `src/index.css` (append to the end of the file).

Goal: define the CSS animation that drives the status-text shimmer sweep. Used by `AccountLiveStatus` in Task 2.

- [ ] **Step 1** — Append to the bottom of `src/index.css`:

```css

@keyframes status-shimmer {
  0%   { background-position: -200% center; }
  100% { background-position: 200% center; }
}
```

- [ ] **Step 2** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/index.css
git commit -m "feat(overview-v4): add status-shimmer keyframe for live status text"
```

---

## Task 2: Add `AccountLiveStatus` + `AccountPauseCTA` components

**Files:** Modify `src/pages/overview/index.jsx` — insert two new local components.

This task only adds the new components (alongside the existing `StatusPill`). Wiring them into `AccountCard` and deleting the old code happens in Task 3. This split keeps the diff small and lets the new components be reviewed in isolation.

- [ ] **Step 1** — Add the `useToasts` import. Find the existing import line at the top of the file:

```jsx
import { useSystemStatus } from '@/hooks/useSystemStatus'
```

Using the Edit tool, replace it with:

```jsx
import { useSystemStatus } from '@/hooks/useSystemStatus'
import { useToasts } from '@/stores/useToasts'
```

- [ ] **Step 2** — Insert the two new components immediately after the `StatusPill` function closes (around line 439, right before the `MetricCard` / metric components block begins around line 441).

Search the file for the first line `// Shared visual primitive for the three metric components` — that's the section heading that immediately follows `StatusPill`. Insert the new code **BEFORE** that heading.

Code to insert:

```jsx

// --- AccountCard live status + pause CTA (v4 replacement for StatusPill) ---
//
// AccountLiveStatus renders the live activity line under the @handle:
// phase icon + human-readable phrase. Matches the Targeting page's
// LiveActivityCard so both surfaces stay in lockstep through the shared
// useSystemStatus hook.
//
// Animations:
// - Phase change: fade-in + slide-in-from-bottom via Tailwind's
//   animate-in utilities on a key-bound wrapper.
// - Ambient: `animate-pulse` on the phase icon while the system is
//   running (so motion doesn't stop between phase changes).
// - Shimmer: a low-contrast gradient sweep across the phase text every
//   5s during running phases only. Paused / setup states are static.

const ACCOUNT_PHASE_LABEL = {
  analyzing: 'Currently searching for targets',
  following: 'Currently following',
  unfollowing: 'Currently unfollowing',
  waiting: 'Pausing between actions',
  warming_up: 'Warming up — growth starts within 72 hours',
  setup: 'Setup needed — add your first target to start',
  paused: 'Paused',
}

const ACCOUNT_PHASE_ICON = {
  analyzing: Search,
  following: UserPlus,
  unfollowing: UserMinus,
  warming_up: Flame,
  setup: Settings,
  paused: Pause,
  waiting: null, // pulsing dot fallback
}

function iconToneForPhase(phase) {
  if (phase === 'warming_up') return 'text-blue-base'
  if (phase === 'setup' || phase === 'paused') return 'text-text-muted'
  return 'text-green-base'
}

function dotColorForPhase(phase) {
  if (phase === 'warming_up') return 'bg-blue-base'
  if (phase === 'setup' || phase === 'paused') return 'bg-text-muted'
  return 'bg-green-base'
}

function isRunningPhase(phase) {
  return (
    phase === 'analyzing' ||
    phase === 'following' ||
    phase === 'unfollowing' ||
    phase === 'waiting'
  )
}

function AccountLiveStatus({ status }) {
  const live = useSystemStatus()
  const isPaused = status.state === 'paused'

  // When the parent paused state is on, the hook still ticks phases
  // under the hood but the UI should present the stopped state. Force
  // phase to 'paused' when the parent says we're paused.
  const phase = isPaused ? 'paused' : live.phase
  const targetHandle =
    phase === 'following' || phase === 'unfollowing' ? live.targetHandle : null

  const PhaseIcon = ACCOUNT_PHASE_ICON[phase] ?? null
  const iconTone = iconToneForPhase(phase)
  const dotColor = dotColorForPhase(phase)
  const running = isRunningPhase(phase)

  const baseText = ACCOUNT_PHASE_LABEL[phase] || 'Idle'
  const phrase =
    (phase === 'following' || phase === 'unfollowing') && targetHandle
      ? `${baseText} ${targetHandle}`
      : baseText

  // Key drives the fade+slide transition on every phase/target change.
  const contentKey = `${phase}|${targetHandle || ''}`

  // Inline shimmer style — applied only to running phases. Safari needs
  // the -webkit- prefix for background-clip: text.
  const shimmerStyle = running
    ? {
        backgroundImage:
          'linear-gradient(90deg, var(--color-text-secondary) 0%, var(--color-text-primary) 50%, var(--color-text-secondary) 100%)',
        backgroundSize: '200% auto',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        color: 'transparent',
        animation: 'status-shimmer 5s ease-in-out infinite',
      }
    : undefined

  return (
    <div
      key={contentKey}
      className="mt-1 flex min-w-0 items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-300"
    >
      {PhaseIcon ? (
        <PhaseIcon
          className={`h-4 w-4 shrink-0 ${iconTone} ${running ? 'animate-pulse' : ''}`}
          aria-hidden="true"
        />
      ) : (
        <span className="relative flex h-2 w-2 shrink-0 items-center justify-center">
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${dotColor}`}
            aria-hidden="true"
          />
          <span
            className={`relative inline-flex h-2 w-2 rounded-full ${dotColor}`}
            aria-hidden="true"
          />
        </span>
      )}

      <p className="min-w-0 truncate text-sm text-text-secondary" style={shimmerStyle}>
        {targetHandle ? (
          <>
            {baseText}{' '}
            <Link
              to="/targets"
              className="font-medium text-text-primary hover:underline"
            >
              {targetHandle}
            </Link>
          </>
        ) : (
          phrase
        )}
      </p>
    </div>
  )
}

// AccountPauseCTA — outlined ghost when running, filled-green primary
// when paused. Hidden entirely for warming_up / setup states.
function AccountPauseCTA({ status, onPauseToggle, className = '' }) {
  const isPaused = status.state === 'paused'
  const isHidden = status.state === 'warming_up' || status.state === 'setup'

  if (isHidden) return null

  const handleClick = () => {
    onPauseToggle?.()
    useToasts.getState().addToast({
      message: isPaused ? 'Growth resumed.' : 'Growth paused.',
      tone: 'success',
    })
  }

  if (isPaused) {
    return (
      <button
        type="button"
        onClick={handleClick}
        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-green-base px-4 text-sm font-medium text-white shadow-sm transition-opacity hover:opacity-90 ${className}`}
      >
        <Play className="h-4 w-4" aria-hidden="true" />
        Resume growth
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-surface px-4 text-sm font-medium text-text-primary transition-colors hover:bg-bg ${className}`}
    >
      <Pause className="h-4 w-4" aria-hidden="true" />
      Pause growth
    </button>
  )
}
```

- [ ] **Step 3** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/overview/index.jsx
git commit -m "feat(overview-v4): add AccountLiveStatus + AccountPauseCTA components"
```

---

## Task 3: Wire new components into `AccountCard`, remove full name, delete `StatusPill` + `WorkingDots` + `formatApproxTime`

**Files:** Modify `src/pages/overview/index.jsx`.

This is the structural change: swap AccountCard to render the new components and remove the dead code.

- [ ] **Step 1** — Replace the current `AccountCard` return block that uses `StatusPill`. Find this exact block (it's the inner JSX of AccountCard, around line 642–694 — search for `flex items-center gap-3 sm:justify-between` as the anchor):

```jsx
      <div className="flex items-center gap-3 sm:justify-between">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <div className="relative shrink-0">
            {connection.profilePic ? (
              <img
                src={connection.profilePic}
                alt={connection.username}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-border lg:h-12 lg:w-12"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-tint text-sm font-semibold text-blue-text ring-2 ring-border lg:h-12 lg:w-12 lg:text-base">
                {connection.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {connDot && (
              <span className={`absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface ${connDot}`} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-text-primary lg:text-base">@{connection.username}</span>
              <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
                {planLabel}
              </span>
              {/* Trial badge — sits next to the plan pill so the user
                  always knows their "Advanced" (or "Growth") access is
                  coming from the trial, not a paid subscription. Blue
                  tint = informational (not action-needed); the last-day
                  TrialBanner above already carries any urgency. */}
              {user.isOnTrial && (
                <span className="shrink-0 rounded-full bg-blue-tint px-2 py-0.5 text-xs font-medium text-blue-text">
                  Trial
                </span>
              )}
            </div>
            {connection.fullName && (
              <p className="mt-0.5 truncate text-xs text-text-muted lg:text-sm">{connection.fullName}</p>
            )}
          </div>
        </div>

        {/* Desktop: StatusPill sits to the right of the identity row. */}
        <div className="hidden shrink-0 sm:block">
          <StatusPill status={systemStatus} onPauseToggle={onPauseToggle} />
        </div>
      </div>

      {/* Mobile StatusPill — directly beneath the identity row so the
          user's account and its live activity read as one grouped unit. */}
      <div className="mt-3 sm:hidden">
        <StatusPill status={systemStatus} onPauseToggle={onPauseToggle} />
      </div>
```

Replace it with:

```jsx
      <div className="flex items-start gap-3 sm:justify-between">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="relative shrink-0">
            {connection.profilePic ? (
              <img
                src={connection.profilePic}
                alt={connection.username}
                className="h-11 w-11 rounded-full object-cover ring-2 ring-border lg:h-12 lg:w-12"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-tint text-sm font-semibold text-blue-text ring-2 ring-border lg:h-12 lg:w-12 lg:text-base">
                {connection.username?.[0]?.toUpperCase() || '?'}
              </div>
            )}
            {connDot && (
              <span className={`absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border-2 border-surface ${connDot}`} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            {/* Identity row: @handle + plan pill + optional Trial pill. */}
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-text-primary lg:text-base">@{connection.username}</span>
              <span className="shrink-0 rounded-full bg-bg px-2 py-0.5 text-xs font-medium text-text-secondary">
                {planLabel}
              </span>
              {user.isOnTrial && (
                <span className="shrink-0 rounded-full bg-blue-tint px-2 py-0.5 text-xs font-medium text-blue-text">
                  Trial
                </span>
              )}
            </div>

            {/* Live status slots directly beneath the identity row,
                aligned with the handle (not the avatar) via the parent
                flex gap. Full name was removed in v4 — the handle is
                enough identity and this row carries the live signal. */}
            <AccountLiveStatus status={systemStatus} />
          </div>
        </div>

        {/* Desktop: Pause/Resume CTA sits to the right of the identity
            block. Replaces the old StatusPill. */}
        <div className="hidden shrink-0 sm:block">
          <AccountPauseCTA status={systemStatus} onPauseToggle={onPauseToggle} />
        </div>
      </div>

      {/* Mobile Pause/Resume — stacks below the identity block as a
          full-width button. Hidden on sm:+ where it's in the identity
          row instead. */}
      <div className="mt-3 sm:hidden">
        <AccountPauseCTA status={systemStatus} onPauseToggle={onPauseToggle} className="w-full" />
      </div>
```

Key diffs in this swap:
- `items-center` → `items-start` on both the outer wrapper and the inner identity block. The status line adds a second row under the handle; centering the avatar vertically against a 2-row block would bottom-align it. `items-start` keeps the avatar aligned to the top of the identity.
- Full-name `<p>` deleted.
- `<StatusPill …/>` replaced with `<AccountLiveStatus />` (inline, under the handle) + `<AccountPauseCTA />` (to the right on desktop / full-width below on mobile).
- Mobile CTA gets `className="w-full"` so it stretches full-width.

- [ ] **Step 2** — Delete the now-unused `StatusPill`, `WorkingDots`, and `formatApproxTime` functions. Find and remove them all.

Using the Edit tool, delete the `WorkingDots` function (around lines 234–252). Read the file around that area first to get the exact bounds. The function starts with a comment / definition like:

```jsx
function WorkingDots({ className = '' }) {
  ...
}
```

Delete it entirely, including any preceding comment block that's exclusively describing WorkingDots.

Then delete the `StatusPill` function (starts around line 254 with `function StatusPill({ status, onPauseToggle }) {` and ends with `}` around line 439). Read the file around that range first; delete the entire function block, including any block comment that's only describing StatusPill.

Then delete the `formatApproxTime` function (starts around line 219 with `function formatApproxTime(iso) {`). Read the file around that range; delete the function and any preceding comment block specific to it.

If you encounter a pre-existing section comment like `// --- Helpers ---` that was heading the group, leave it (other helpers may live under it).

- [ ] **Step 3** — Verify the file still compiles by searching for any lingering references:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
```

Run these `grep` checks (via the Grep tool, not bash):
- Search `StatusPill` in `src/pages/overview/index.jsx` — expect **zero matches**.
- Search `WorkingDots` in the same file — expect **zero matches**.
- Search `formatApproxTime` in the same file — expect **zero matches**.

If any remain, they're stray references that need to be fixed.

- [ ] **Step 4** — Commit:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add src/pages/overview/index.jsx
git commit -m "feat(overview-v4): wire new AccountLiveStatus + AccountPauseCTA, drop StatusPill and full-name row"
```

---

## Task 4: Visual verification + docs

**Files:** Any of the above, based on visual review; then `CHANGELOG.md` and `CONTEXT.md`.

- [ ] **Step 1** — Controller runs the preview at desktop and mobile viewports:
  - Navigate to `/` (Overview).
  - Confirm the AccountCard shows: avatar · `@handle` · plan pills · status line with icon + "Currently following @x" · Pause growth CTA (outline) on the right.
  - Confirm the status line shimmer sweeps subtly during running phases; icon is pulsing.
  - Wait long enough for a phase change and confirm the key-based transition animates.
  - Click `Pause growth`. CTA flips to `Resume growth` (green primary). Toast "Growth paused." appears top-right. Status line goes static, shows "Paused".
  - Click `Resume growth`. CTA flips back. Toast "Growth resumed." appears. Status line resumes animating.
  - Mobile: AccountCard stacks identity → status → full-width Pause CTA.
  - Cross-page check: navigate to `/targets` — `LiveActivityCard` shows the same phase at the same time (shared hook).

- [ ] **Step 2** — Fix any visual issues found. Commit under `chore(overview-v4): polish pass` if any changes needed.

- [ ] **Step 3** — Update `CHANGELOG.md`. Add a new section above the existing 2026-04-24 entries:

```markdown
---

## 2026-04-24 — Overview AccountCard v4

### Changed
- **Live status moved under the `@handle`** — replaces the right-side `StatusPill`. Shares phase copy + icon map with the Targeting page's `LiveActivityCard` via the same `useSystemStatus` hook. Ambient `animate-pulse` on the phase icon during running phases + low-contrast shimmer sweep across the phase text (~5s loop) so the status always feels alive
- **Full name row removed** from the AccountCard. The `@handle` carries enough identity; AccountSwitcher handles multi-account disambiguation
- **Pause growth / Resume growth CTA** replaces the old `StatusPill` popover. Outlined ghost when running (calm), filled green primary when paused (asserts "action needed"). Direct toggle — no confirmation modal; fires a success toast (`Growth paused.` / `Growth resumed.`)
- **Popover killed** — info like "Next action" / "Processing batch…" no longer surfaces on Overview. The Targeting page's `LiveActivityCard` carries the richer view for anyone who wants it

### Created
- `AccountLiveStatus` + `AccountPauseCTA` — both defined inline in `src/pages/overview/index.jsx` alongside the `AccountCard` they support. YAGNI on extraction; promote to shared `src/components/` only when a second consumer shows up
- `@keyframes status-shimmer` in `src/index.css`

### Removed
- `StatusPill` function (and its popover)
- `WorkingDots` loader (only used by `StatusPill`)
- `formatApproxTime` helper (only used by `StatusPill`)

### Decisions
- **Direct pause toggle, no modal.** Pause is reversible; friction is unjustified
- **Hide CTA during warming_up / setup.** Pausing something that hasn't started is confusing — the status line copy carries the state message instead
- **Shimmer over typewriter-style animation.** Shimmer is ambient and ignorable; typewriter would demand attention every phase change
- **Handle in status line links to `/targets`** (not an inline drawer) — the detail drawer lives on Targeting; Overview's status line is a read-only signal

---
```

- [ ] **Step 4** — Update `CONTEXT.md`. In the Overview page section, update the AccountCard description to reflect v4. Add a line to the update log:

```markdown
- **2026-04-24 (overview v4)** — AccountCard redesigned: live status line moved under the `@handle` with ambient `animate-pulse` + shimmer animation, full name row removed, right-zone becomes a dedicated `Pause growth` / `Resume growth` CTA (outline when running, primary green when paused). `StatusPill` + popover + `WorkingDots` + `formatApproxTime` all deleted. Cross-page status sync via `useSystemStatus` preserved.
```

- [ ] **Step 5** — Commit docs:

```bash
cd "/Users/aleksandarstankovic/Desktop/Vibe Dash"
git add CHANGELOG.md CONTEXT.md
git commit -m "docs: log Overview AccountCard v4 redesign"
```

---

## Spec Coverage Checklist

Against `docs/superpowers/specs/2026-04-24-overview-account-card-redesign.md`:

- § 1 Layout (desktop + mobile) → Task 3 Step 1.
- § 2 Status Line (content, icons, handle link, animations) → Task 2 Step 2 (component), Task 1 (shimmer CSS).
- § 3 Pause/Resume CTA (running + paused states, behavior, edge states, mobile) → Task 2 Step 2 (component), Task 3 Step 1 (mobile wiring).
- § 4 Removed (StatusPill, WorkingDots, full name, formatApproxTime) → Task 3 Steps 1 + 2.
- § 5 Component breakdown (Option A — in-file) → Task 2 Step 2.
- § 6 Data flow (parent owns pause state, passes down) → unchanged; Task 3 Step 1 preserves the existing parent → child prop plumbing.
- § 7 File-level diff → Tasks 1 + 2 + 3.
- § 8 Out of scope → intentionally not implemented.
- § 9 Success criteria → Task 4 Step 1 (visual verification walks through each criterion).
