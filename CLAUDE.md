# CLAUDE.md — Kicksta Dashboard

> Loaded every session. Technical decisions, design system, and build rules.
> For product context, user problems, and copy guidelines → see `PRODUCT.md`.

---

## Screenshot Rule

**NEVER share screenshots with the user.** Take screenshots internally for verification only — never include them in messages. The user does not want to see screenshots. Only mention issues if something is broken.

---

## V1 Scope

**Frontend only.** No backend, no API integration. All data is mocked with realistic placeholders defined in `src/mocks/`. Build every component, page, and flow as if real data were connected — the switch to live data should require only replacing imports, not restructuring components.

---

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | React |
| Styling | Tailwind CSS (utility-first) |
| Components | shadcn/ui primitives in `src/components/ui/` |
| Icons | Lucide React |
| State | Zustand (UI state) · React Query wiring prepped but using mock resolvers for V1 |
| Routing | React Router v6 |
| Charts | Recharts |
| Font | [Plus Jakarta Sans](https://fonts.google.com/specimen/Plus+Jakarta+Sans) 400 / 500 / 600 |
| Theme | Light + Dark via CSS variables + Tailwind `dark:` variant |

### Logo

Two SVG assets in `src/assets/`:
- **`kicksta-full-logo.svg`** — wordmark + icon. Use in signup flow header and desktop sidebar nav. Size to fit context.
- **`kicksta-logo.svg`** — icon only (four-quadrant pinwheel: red #EF3F61, blue #0068FF, yellow #FEC149, green #4ED687). Use in mobile bottom tab bar, favicon, and compact contexts. Size to fit context.

Both SVGs are scalable — use whatever dimensions fit the layout. No fixed size.

### Dark Mode

`.dark` class toggled on `<html>`. Persisted in `localStorage` under key `kicksta-theme` (`"light"` | `"dark"`). Managed by a Zustand `useThemeStore` — components never read localStorage directly. On first load, default to system preference via `prefers-color-scheme`, then respect stored choice.

---

## Project Structure

```
src/
  assets/              # Static assets (logos, illustrations)
  components/          # Shared reusable components (Button, Card, Badge…)
    ui/                # shadcn/ui primitives
  pages/               # One folder per route
    overview/
    targets/
    growth/
    account/
    signup/
      steps/           # One component per signup step
  features/            # Feature-scoped components + logic (co-located)
  hooks/               # Custom hooks (useGrowthData, useAccount…)
  utils/               # Pure helpers (formatters, calculations)
  mocks/               # All placeholder data — single source of truth for V1
  stores/              # Zustand stores (useThemeStore, useAuthStore…)
  styles/              # Global styles, CSS variables
  lib/                 # API client stubs, third-party config
```

**Naming:** Components `PascalCase.jsx` · Hooks `useXxx.js` · Utils `camelCase.js` · Pages `PascalCase/index.jsx`

---

## Routes

| Path | Page | Shell |
|------|------|-------|
| `/` | Overview | Dashboard (tab bar + profile dropdown) |
| `/targets` | Targets | Dashboard |
| `/growth` | Growth | Dashboard |
| `/account` | Account settings | Dashboard |
| `/signup/ig-preview` | Step 2 | Standalone (no dashboard nav) |
| `/signup/plan-selection` | Step 3 | Standalone |
| `/signup/billing` | Step 4 | Standalone |
| `/signup/connect-instagram` | Step 5 | Standalone |
| `/signup/first-target` | Step 6 | Standalone |
| `/signup/growth-plus` | Step 7 | Standalone |
| `/signup/dashboard-entry` | Step 8 | Redirect → `/` after warmup state is set |

> **Cancellation flow** is a 6-step modal sequence triggered from the Account page ("Cancel subscription" link). Not a separate route — it uses a stateful modal/bottom-sheet stack that advances through steps. Closing the modal at any step before final confirmation aborts cancellation.

---

## Mock Data Shape (V1)

All mock data lives in `src/mocks/`. Components import from here — never hardcode values inline.

```js
// mocks/user.js
export const mockUser = {
  id: "u_001",
  email: "alex@example.com",
  name: "Alex Johnson",
  avatar: null,                    // null = show initials
  plan: "advanced",                // "growth" | "advanced"
  trialEndsAt: "2026-04-10T00:00:00Z",
  isOnTrial: true,
  growthPlusSubscribed: false,
  createdAt: "2026-04-03T00:00:00Z",
};

// Variant: Growth+ subscriber on Growth plan, trial ended
export const mockUserGrowthPlus = {
  ...mockUser,
  plan: "growth",
  isOnTrial: false,
  trialEndsAt: null,
  growthPlusSubscribed: true,
};

// mocks/instagram.js — one object per connection state
export const mockInstagramConnected = {
  username: "alexjohnson.co",
  profilePic: "/mock-avatar.jpg",
  followers: 4832,
  following: 1247,
  posts: 312,
  connectionState: "connected",
  warmupEndsAt: null,
  disconnectedAt: null,
};

export const mockInstagramWarmingUp = {
  ...mockInstagramConnected,
  connectionState: "warming_up",
  warmupEndsAt: "2026-04-09T00:00:00Z",  // up to 72h from connection
};

export const mockInstagramDisconnected = {
  ...mockInstagramConnected,
  connectionState: "disconnected",
  disconnectedAt: "2026-04-05T18:30:00Z",
};

export const mockInstagramNeverLoggedIn = {
  username: null,
  profilePic: null,
  followers: null,
  following: null,
  posts: null,
  connectionState: "never_logged_in",
  warmupEndsAt: null,
  disconnectedAt: null,
};

// Default export — swap this to test different states
export const mockInstagram = mockInstagramConnected;

// mocks/growth.js
export const mockGrowthDaily = [
  // 30 days of { date, targetedGain, growthPlusGain, followBackRate }
  { date: "2026-03-04", targetedGain: 12, growthPlusGain: 0, followBackRate: 0.11 },
  { date: "2026-03-05", targetedGain: 8,  growthPlusGain: 0, followBackRate: 0.09 },
  // … generate 30 entries
];
export const mockWeeklySummary = {
  followersGained: 67,
  followBackRate: 0.12,
  topTarget: "@fitness.inspo",
  period: "Mar 28 – Apr 3",
};

// mocks/targets.js
export const mockTargets = [
  {
    id: "t_001",
    type: "account",               // "account" | "hashtag"
    value: "@fitness.inspo",
    status: "active",              // "active" | "depleted" | "paused"
    followedCount: 842,
    followBackCount: 97,
    addedAt: "2026-03-15T00:00:00Z",
  },
  {
    id: "t_002",
    type: "hashtag",
    value: "#homeworkouts",
    status: "active",
    followedCount: 614,
    followBackCount: 58,
    addedAt: "2026-03-18T00:00:00Z",
  },
  {
    id: "t_003",
    type: "account",
    value: "@yoga.daily",
    status: "depleted",
    followedCount: 1200,
    followBackCount: 134,
    addedAt: "2026-03-10T00:00:00Z",
  },
  {
    id: "t_004",
    type: "account",
    value: "@cleanfoodcrush",
    status: "paused",              // e.g. paused after downgrade
    followedCount: 320,
    followBackCount: 29,
    addedAt: "2026-03-25T00:00:00Z",
  },
];

// mocks/notifications.js
export const mockNotifications = [
  {
    id: "n_001",
    type: "system",
    title: "Target depleted",
    body: "@yoga.daily has no more users to follow.",
    read: false,
    createdAt: "2026-04-02T14:00:00Z",
  },
  {
    id: "n_002",
    type: "system",
    title: "Warmup complete",
    body: "Your account is now actively growing.",
    read: true,
    createdAt: "2026-03-20T08:00:00Z",
  },
  {
    id: "n_003",
    type: "growth",
    title: "Weekly summary",
    body: "You gained 67 followers this week. Top target: @fitness.inspo.",
    read: false,
    createdAt: "2026-04-03T09:00:00Z",
  },
  {
    id: "n_004",
    type: "growth",
    title: "Milestone reached",
    body: "You've crossed 5,000 followers!",
    read: true,
    createdAt: "2026-04-01T12:00:00Z",
  },
];

// mocks/growthConfig.js
export const mockGrowthConfig = {
  mode: "auto",                    // "auto" | "follow_only" | "unfollow_only"
  likeAfterFollow: true,
  welcomeDm: {
    enabled: false,                // Advanced-only
    message: "Hey! Thanks for the follow 🙌 Check out our latest drop → link in bio",
  },
  closeFriendsAdder: false,        // Advanced-only
  growthPlusActive: false,         // only relevant if user.growthPlusSubscribed === true
  filters: {
    followingMin: 100,
    followingMax: 5000,
    followerMin: 200,
    followerMax: 50000,
    mediaMin: 10,
    mediaMax: null,                // null = no upper limit
    accountPrivacy: "all",         // "public" | "private" | "all"
    genderTarget: null,            // null | "male" | "female" — Advanced-only, null = all
    excludeNsfw: true,
  },
};

// mocks/whitelist.js
export const mockWhitelist = [
  { id: "w_001", username: "@bestfriend.yoga", addedAt: "2026-03-12T00:00:00Z" },
  { id: "w_002", username: "@brand.partner", addedAt: "2026-03-14T00:00:00Z" },
];

// mocks/blacklist.js
export const mockBlacklist = [
  { id: "b_001", username: "@spam.account1", addedAt: "2026-03-16T00:00:00Z" },
  { id: "b_002", username: "@competitor.brand", addedAt: "2026-03-17T00:00:00Z" },
  { id: "b_003", username: "@ex.colleague", addedAt: "2026-03-20T00:00:00Z" },
];
```

When real APIs are ready, replace mock imports with React Query fetchers — component interfaces stay identical.

---

## Design System

### Color Tokens

```css
:root {
  /* Green — growth, success, active */
  --color-green-tint: #E6FFF5;  --color-green-base: #00DD83;  --color-green-text: #007A48;
  /* Blue — info, links, secondary */
  --color-blue-tint: #E6F0FF;   --color-blue-base: #0068FF;   --color-blue-text: #0047B3;
  /* Red — error, disconnected */
  --color-red-tint: #FFF0F5;    --color-red-base: #FF005A;    --color-red-text: #CC0048;
  /* Yellow — warning, caution */
  --color-yellow-tint: #FFF8E6;  --color-yellow-base: #FFB600;  --color-yellow-text: #8C6400;

  /* Surfaces */
  --color-bg: #F7F8FA;  --color-surface: #FFFFFF;  --color-surface-raised: #FFFFFF;
  --color-border: #E4E7ED;  --color-border-strong: #CDD1DB;
  /* Text */
  --color-text-primary: #0F1117;  --color-text-secondary: #6B7280;  --color-text-muted: #9CA3AF;
}
.dark {
  --color-green-tint: #003D22;  --color-green-base: #00DD83;  --color-green-text: #3DFFA8;
  --color-blue-tint: #00224D;   --color-blue-base: #0068FF;   --color-blue-text: #6AA8FF;
  --color-red-tint: #3D0018;    --color-red-base: #FF005A;    --color-red-text: #FF6699;
  --color-yellow-tint: #3D2B00;  --color-yellow-base: #FFB600;  --color-yellow-text: #FFD166;
  --color-bg: #0C0E14;  --color-surface: #161820;  --color-surface-raised: #1E2028;
  --color-border: #2A2D3A;  --color-border-strong: #3D4152;
  --color-text-primary: #F0F2F8;  --color-text-secondary: #8B90A4;  --color-text-muted: #545870;
}
```

### Color Usage Rule — Always Match Tone to Context

| Context | Tone | Example class |
|---------|------|---------------|
| Badge / pill / alert bg | `-tint` | `bg-green-tint text-green-text` |
| Button fill | `-base` | `bg-green-base text-white` |
| Text on white | `-text` | `text-green-text` |
| Chart line / icon | `-base` | `stroke-green-base` |
| Ghost destructive | `-tint` bg + `-text` | `bg-red-tint text-red-text` |

**Never use `-base` as text on white — fails contrast for green and yellow.**

### Tailwind Config Additions

```js
// tailwind.config.js
theme: {
  extend: {
    fontFamily: { sans: ['Plus Jakarta Sans', 'sans-serif'] },
    colors: {
      green:  { tint: 'var(--color-green-tint)', base: 'var(--color-green-base)', text: 'var(--color-green-text)' },
      blue:   { tint: 'var(--color-blue-tint)',  base: 'var(--color-blue-base)',  text: 'var(--color-blue-text)' },
      red:    { tint: 'var(--color-red-tint)',   base: 'var(--color-red-base)',   text: 'var(--color-red-text)' },
      yellow: { tint: 'var(--color-yellow-tint)', base: 'var(--color-yellow-base)', text: 'var(--color-yellow-text)' },
    },
  },
},
```

### Spacing, Radius, Shadows, Typography

| Property | Rule |
|----------|------|
| Spacing | 4px base. Use Tailwind scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64. No arbitrary values. |
| Radius | Cards `rounded-xl` · Buttons/inputs `rounded-lg` · Badges `rounded-full` |
| Shadows | Cards `shadow-sm` + border · Selected `shadow-md` + strong border · Modals `shadow-xl` |
| Font weights | 400 body · 500 labels/subheadings · 600 headings/stat numbers · Never 700+ |
| Scale | Tailwind defaults: `text-sm` / `text-base` / `text-lg` / `text-xl` / `text-2xl` |
| Line height | `leading-snug` headings · `leading-relaxed` body |

---

## Responsive Design

**Mobile-first, fully responsive.** ~90% of users are mobile.

| Breakpoint | Width | Intent |
|-----------|-------|--------|
| default | 0–767px | Mobile — single column, bottom tab nav, thumb-friendly |
| `md:` | 768–1023px | Tablet — 2-col where sensible |
| `lg:` | 1024px+ | Desktop — sidebar nav option, 2–3 col grids, `max-w-5xl mx-auto` |

### Key Layout Rules

- **Nav:** Bottom tab bar on mobile → left sidebar on `lg:` (or keep bottom bar if it holds up)
- **Cards:** Full-width → 2-col `md:` → 2–3 col `lg:`
- **Charts:** Full-width min 240px tall → beside stat cards on `lg:`
- **Modals:** Bottom sheet on mobile → centered modal on `lg:`
- **Profile dropdown:** Top-right on all breakpoints
- **Intercom offset:** `pr-[72px]` on bottom nav so Growth tab isn't covered
- **Safe area:** `pb-[env(safe-area-inset-bottom)]` on bottom nav

### Touch Targets

| Element | Min size |
|---------|----------|
| Primary button | 48px height, full-width preferred on mobile |
| Secondary / ghost | 44px height |
| Icon button | 44×44px |
| List row | 56px height, entire row tappable |
| Toggle / checkbox | 44×44px tap area |
| Bottom tab item | 56px height |
| Gap between tappables | ≥ 8px |

### Tailwind Order

Write classes in this order: `layout → spacing → sizing → color → typography → border → shadow → state`

```jsx
// ✓ Mobile-first
<div className="px-4 py-3 md:px-6 md:py-4 lg:px-8">
// ✕ Desktop-first
<div className="px-8 sm:px-4">
```

---

## Component Rules

| Rule | Detail |
|------|--------|
| No radio buttons | Use elevated cards (selection) or segmented controls (2–4 mode switch) |
| No empty states without explanation | Every zero/blank/error state gets: headline + reason + CTA or next step |
| Labels always visible | Never rely on placeholder alone |
| Inline validation | Errors below the field, not toasts |
| Destructive actions | Always confirmation modal (bottom sheet on mobile) |
| Confirm button labels | Use the action name ("Disconnect account"), never "Yes" / "Confirm" |
| Success toasts | 2–3s, bottom-right |
| Error toasts | Persistent with dismiss, specific message |
| Loading | Skeleton loaders for content, spinner only on buttons |
| Selected card style | `shadow-md` + primary border + subtle bg tint |

---

## Do / Don't Checklist

**Always:**
- Read this file before writing any component
- Stay in the design system — no arbitrary colors, spacing, or fonts
- Co-locate feature logic in `features/`, shared components in `components/`
- Pair every `bg-*` with its `dark:bg-*` counterpart
- Consider mobile, tablet, and desktop for every component
- Import mock data from `src/mocks/` — never hardcode placeholder values inline

**Never:**
- Radio buttons · Placeholder-only labels · Arbitrary Tailwind values (`w-[237px]`)
- Centered modals on mobile · Touch targets < 44px
- Hamburger menu **as the only mobile nav** (acceptable when paired with the bottom tab bar — see `MobileNavDrawer.jsx`)
- Countdown timers · Fake activity alerts · Warning colors for non-errors
- Filler phrases ("Simply", "Just", "In order to", "Please note")
- Empty/blank/flat states without explanation
- Smoothed or estimated data in charts — show gaps honestly
- Dashboard nav inside signup flow
- Pre-checked upsells anywhere

---

## Changelog Workflow

The project maintains a `CHANGELOG.md` that tracks every confirmed decision, addition, removal, or change.

**Rules:**

1. **After confirming any new decision or change to the dashboard**, prompt: *"Update the changelog? (yes/no)"* — then update `CHANGELOG.md` if yes.
2. **Before making any new change**, read `CHANGELOG.md` and check for conflicts with prior decisions. If a conflict exists, flag it before proceeding.
3. **If changes have been confirmed but the changelog has not been updated**, show a warning on every subsequent message: *"⚠️ Changelog is out of date — [summary of unlogged changes]. Update now?"*
4. **Format**: group entries under the date heading (`## YYYY-MM-DD`), with subsections (`### Created`, `### Changed`, `### Removed`, `### Decisions`, etc.). Keep entries concise — one line per item.
5. **End of session**: ensure all confirmed changes from the session are logged before wrapping up.
