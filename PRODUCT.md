# PRODUCT.md — Kicksta Dashboard

> Product context, user problems, feature specs, and copy guidelines.
> Referenced when building specific features. For tech/design system rules → see `CLAUDE.md`.

---

## What Kicksta Does

Instagram growth automation SaaS. Users connect their IG account, define target accounts/hashtags, and Kicksta automates organic follower growth via follow/unfollow engagement with targets' audiences.

**Core value prop:** Hands-off, authentic Instagram growth — no bots, no fake followers.
**Users:** Social media managers, creators, brands growing Instagram organically.

---

## Why This Redesign Exists

Every design decision maps back to real cancellation reasons (Trustpilot 2.3★, G2, Reddit). These are dominant signals, not edge cases.

### Problem 1 — Follower Quality (Top Complaint)
Users got fake/bot followers and couldn't distinguish pod followers from organic ones.
**Status:** Growth Pods removed, replaced by Growth+ (opt-in, paid separately, transparent).
**Dashboard must:** Always separate Growth+ metrics from Targeted Growth. Never merge into same stat card or chart line. Combined rollup OK in summaries if breakdown is accessible.

### Problem 2 — Cancellation Was a Nightmare
No self-service cancel. Users resorted to chargebacks.
**Status:** Self-service cancel now enabled.
**Dashboard must:** Make "Cancel subscription" findable in profile dropdown. Flow must be completable without contacting support. Visibility is itself a trust signal.

### Problem 3 — Instagram Account Safety
Accounts flagged, temp-banned, or disabled. Instagram tells users to disconnect third-party tools.
**Dashboard must:** Reconnect prompts must address both routine session expiry AND the safety warning scenario — never assume it was routine. Show a calm, factual message. Never display "active" status if there are signs of flagging. Growth page safety note is mandatory.

### Problem 4 — Service Reliability
Random downtime, unexplained sleep mode, empty dashboards, charges during inactivity.
**Dashboard must:** Never show empty data without explanation. System status always visible with timestamps. No smoothed/projected data — show gaps honestly. Account status badge is the #1 trust element.

### Problem 5 — Support Quality
Good for onboarding, poor for problems/cancellation.
**Dashboard must:** Keep Intercom always visible. Reduce support dependency by making system state self-explanatory. Cancel flow never funnels to support as a blocker.

### Problem 6 — Setup Friction (Highest ROI)
Trial users never complete setup. When asked "would you come back?" → "Definitely."
**Dashboard must:** Never let a user reach an empty dashboard without knowing what to do next. First-run state needs its own treatment: step-by-step prompt, not an empty page with nav.

---

## Features

### Targeted Growth (Core Engine)
Requires IG login. Follows users from client's target accounts/hashtags, unfollows after a period regardless of follow-back.

**Three modes:** Auto (follow + unfollow + like) · Follow-only · Unfollow-only

**Filters:** Following/follower/media count ranges · Account privacy · Gender (Advanced only) · NSFW exclusion

**Whitelist** (never unfollow) · **Blacklist** (exclude from all interaction)

### Engagement Features
- **Welcome DM** ⭐ Advanced — auto-DM new followers. Requires Auto mode.
- **Close Friends Adder** ⭐ Advanced — adds new followers to Close Friends list.
- **Like after follow** — likes posts after following for extra engagement signal.

> ⭐ Advanced-only features: show in locked/muted state for Growth plan users with upgrade prompt on tap. Never hide entirely.

### Growth+ (Optional Add-On)
Separate paid subscription. Network of accounts boost client's posts algorithmically. User opts in and pays during signup (Step 7) — billed immediately, no trial period.

**Dashboard rules:**
- Shown on Growth page for all users (upsell card for non-subscribers, toggle for subscribers)
- Never part of Targeted Growth section — always separate label, toggle, metrics
- Never describe Growth+ followers as "organic" — they are algorithmic/engagement-driven
- Never pre-select or pre-check anywhere
- Auto-cancels when core subscription cancels

**Growth+ billing scenarios:**

| Scenario | Result |
|----------|--------|
| Opted in at signup, completes trial | Growth+ billed at Step 7. Core billed at trial end. Independent cycles. |
| Opted in, cancels before trial ends | Growth+ already billed. Core cancels. Growth+ auto-cancels with core. |
| Opted in, turns off Growth+ toggle | Pauses future billing. |
| Skipped at signup, trial converts | First-month discount offer shown — framed as reward, no countdown/urgency. |

---

## Plans & Feature Gating

| Feature | Growth | Advanced |
|---------|--------|----------|
| Targeted Growth | ✓ | ✓ |
| Analytics | ✓ | ✓ |
| Target slots | 10 | 30 |
| Like after follow | ✓ | ✓ |
| Welcome DM | ✗ | ✓ |
| Gender filter | ✗ | ✓ |
| Close Friends | ✗ | ✓ |
| Growth+ | Upsell | Upsell |

**Locked features:** Muted/locked visual state + "Advanced plan" label. Tap → upgrade bottom sheet with positive benefit framing. Neutral or blue-tint — never warning colors.

**Trial:** 7 days, Advanced access. Show trial status + end date clearly. Growth+ is separate — trial users who skipped it see only Targeted Growth.

**Target slot enforcement:** Growth user at 11th target → upsell bottom sheet. Advanced at 30 → disable add button + inline message. Downgrade with >10 targets → auto-pause most recent, notify by name.

---

## Account & System States

| State | Meaning | UI Treatment |
|-------|---------|-------------|
| Never Logged In | Never connected IG | Onboarding setup prompt: guide user to connect IG and add first target. Not a reconnect banner — this is a first-time experience. No empty analytics. |
| Connected | Active connection | Normal dashboard with data. |
| Warming Up | Just connected, up to 72h prep (max) | Badge: "Warming up — growth starts within 72 hours". Nothing locked. Proactively explain this is normal (overlaps with trial). |
| Disconnected | Session expired or IG safety warning | Persistent reconnect banner. Calm message addressing both causes: "Your Instagram session ended. This is normal after a password change or security prompt — your account is safe. Reconnect to continue growing." |

---

## Pages & Navigation

> Routes and shells defined in `CLAUDE.md`. This section covers **what lives on each page**.

### Bottom Tab Bar
| Tab | Page | Content |
|-----|------|---------|
| 1 | Overview | Account status badge → growth analytics (charts, stats, weekly summary). First-run: setup prompt, not empty page. |
| 2 | Targets | Target list, add/edit/remove, slot usage indicator, upsell at limit. |
| 3 | Growth | Mode selector, filters, whitelist/blacklist, engagement toggles (Like after follow, Welcome DM, Close Friends Adder), Growth+ card. |

### Profile Dropdown (Top-Right Avatar)
Account details · Plan & billing · IG connection · Light/Dark toggle · Log out

> If IG is Disconnected, surface as prominent banner on Overview — don't rely on dropdown discovery.

---

## Signup Flow (Inside Dashboard, No Nav)

The signup flow lives inside the dashboard app but renders without dashboard navigation (no tab bar, no sidebar). Step 1 (account creation) is handled on the marketing website — the dashboard flow starts at Step 2.

| Step | Route | What | Key Detail |
|------|-------|------|-----------|
| ~~1~~ | ~~`/signup/account-creation`~~ | ~~Account creation~~ | **Handled on the website — not part of the dashboard.** |
| 2 | `/signup/ig-preview` | IG preview | Username → pull profile pic, handle, followers, following. Signpost: "You'll connect your IG after choosing your plan." |
| 3 | `/signup/plan-selection` | Plan selection | Headline: "Start growing free for 7 days." CTA: "Try free for 7 days." Price visible but secondary. |
| 4 | `/signup/billing` | Billing | Headline: "You won't be charged until [date]." "Cancel anytime" visible before CTA. CTA: "Start free trial" — no synonyms. Security badge. |
| 5 | `/signup/connect-instagram` | Connect IG | Password field (username pre-filled from Step 2). Max trust signals: encryption note + lock icon + why login is needed. Handles: wrong password, 2FA, IG location confirmation. |
| 6 | `/signup/first-target` | First target | Unskippable. One account or hashtag. Suggestions if niche detectable. |
| 7 | `/signup/growth-plus` | Growth+ opt-in | Clear explanation of what it is, follower type, cost. Two equal CTAs: "Add Growth+" / "Skip for now." No pre-selection. Bills immediately — make explicit. |
| 8 | `/signup/dashboard-entry` | Dashboard entry | Redirect to Overview with connected account, first target, warmup badge. Never an empty page. |

**Signup rules:** Linear, no skipping. Resume from last completed step on return. IG password always after billing (trust sequencing). No dashboard nav in signup flow.

---

## Instagram Login Flow (In-Dashboard)

1. Username pre-filled → password popup
2. Wrong password → inline error: "Incorrect password — try again"
3. Correct → connects immediately, OR triggers 2FA popup, OR shows waiting screen for IG app confirmation ("Open Instagram on your phone and confirm the new login location")
4. Timeout/failure → specific error, not generic

Never show a blank spinner during IG app hand-off.

---

## Notifications

| Type | Examples | Treatment |
|------|----------|-----------|
| System (action needed) | IG disconnected, target depleted, targets paused after downgrade, warmup ended | Prominent — persistent banner or top of notification list |
| Growth (informational) | Followers gained, weekly summary, milestone | Normal notification list, no special treatment |

Both in same bell/tray — difference is visual priority.

---

## Healthy Growth Benchmarks

> ⚠️ V1 placeholders — replace with real Kicksta data.

| Signal | Healthy | Needs Attention |
|--------|---------|-----------------|
| Weekly gain | 50+ | Under 20 |
| Follow-back rate | 10–15%+ | Under 5% |
| Target status | ≥1 active with remaining users | All depleted |
| Connection | Connected | Disconnected |

**Color rules:** Healthy → neutral/green tint. Needs attention → yellow badge/recommendation. Red is reserved for connection errors only — never for slow growth.

---

## Cancellation Flow (6-Step Modal Sequence)

Triggered from the Account page via "Cancel subscription" link. Runs as a stateful modal stack (bottom sheet on mobile, centered modal on desktop). Closing the modal before Step 6 aborts cancellation — no partial state is saved.

1. **Show what they're losing** — factual follower count gained. Neutral framing.
2. **Reason selection** — 5 predefined + "Other". Determines Step 4 offer.
3. **Optional explanation** — free text, clearly optional.
4. **Actionable resolution** — tied to reason. Solvable → direct fix CTA. Guidance → KB link or growth agent.
5. **Coupon** — 3-month discount. Plain presentation, no countdown.
6. **Final confirm** — compact list of what's lost + single "Cancel subscription" CTA. No guilt-trip copy.

**Tone:** Factual and respectful. "Your account will stop growing" = fine. "Don't abandon your growth journey" = banned.

---

## Brand Voice

**Four qualities:** Benefit-first · Concise · Confident · Warm but efficient

| ✕ Avoid | ✓ Prefer |
|---------|---------|
| "In order to begin growing your account, you will need to first connect your Instagram." | "Connect your Instagram to start growing." |
| "We take your security very seriously and use best-in-class encryption." | "Your password is encrypted. Our team can never see it." |
| "Please note that results may vary depending on your niche." | "Growth varies by niche — most users see results within 7 days." |

**Banned phrases:** "Simply" · "Just" · "In order to" · "Please note that" · "You can"

### Key Benefits (Copy Reference)
Real targeted followers · Steady consistent growth · Saves hours weekly · Cheaper than ads · Runs 24/7 · Less human error · Works alongside any strategy

---

## Trust Signals

| Moment | What to show |
|--------|-------------|
| IG login | "Your password is encrypted and never stored by our team" + lock icon |
| Payment | Security badge + "Cancel anytime" before CTA |
| Reconnect | Calm message covering session expiry AND IG safety warning |
| Enabling automation | "Kicksta stays within Instagram's daily limits" |
| First-time onboarding | One sentence: growth is organic, account safety is priority |
| Cancel option | Findable in profile dropdown — visibility = confidence |

**Rules:** Adjacent to the action. Calm > defensive. One sentence + icon is enough. No dark patterns: no countdowns, fake alerts, guilt-trip copy, pre-checked upsells, or forced continuity tricks.
