# Murmur: brand and design system

> The quiet place to write loud posts.

## (a) Name

| Option | Why it could work | Why it lost |
|---|---|---|
| **Murmur** ✅ | A *murmuration* is thousands of birds moving as one shape. That's a thread: small posts that move as one idea. Also: calm tool, loud result. | Nothing. It's ownable, short, and pronounceable in every market. |
| Riff | Energetic, musical, "remix" built in | Sounds like a music app. Hard to trademark. |
| Tern | A seabird; "take a turn"; 4 letters | Too cryptic, reads as a typo of "term". |
| Inkling | Ideas-first, warm | Long, twee, sounds like a kids' brand. |
| Cadence | Rhythm of posting, scheduling | Generic SaaS; dozens of companies already use it. |

**Pick: Murmur.**

## (b) Brand identity

- **Promise:** The quiet place to write loud posts.
- **Personality:** Calm. Sharp. Warm.
- **Voice rules**
  1. Short sentences. One idea each.
  2. Talk like a friend who edits for a living: direct, a little dry, always on your side.
  3. Specific beats clever. Numbers beat adjectives.
  4. Banned words: unlock, supercharge, leverage, elevate, seamless, game-changer, delve, "AI-powered".
  5. Celebrate quietly. One exclamation mark per screen, max. Usually zero.
  6. Errors say what happened and what to do next. No "Oops", no apologies.
- **Logo: The Flock.** Three dots rising on a diagonal, shrinking as they go: a typing indicator taking off. It reads as "someone's about to say something" at 16px and as a murmuration at billboard size.
  - Icon: `assets/icon.svg`
  - Wordmark: `assets/wordmark.svg` (lowercase *murmur*, Newsreader 600, −3% tracking, the flock as a trailing flourish)
  - App icon: `assets/app-icon.svg` (ink squircle, saffron flock, soft dusk glow)
- **Signature motif: the flock + dusk glow.** Dots that gather and disperse. It shows up as the logo, the thread spine (a dotted line, never solid), the loading state, the hero murmuration, the publish reward (dots take flight), and the streak row. The dusk glow is a single soft saffron radial light that sits behind whatever you're focused on.

## (c) Design system

### Type

| Role | Face | Why |
|---|---|---|
| Display | **Newsreader** (opsz 6–72, roman + italic) | Built for on-screen editorial reading. At optical size 72 it gets sharp and opinionated; the italic is our "voice" moment (*loud*). It says "writing" without saying "blog". |
| UI + writing | **Geist** | High x-height, open apertures, crisp at 13px, calm at 17px. Neutral enough that your words are the loudest thing on screen. |
| Mono | **Geist Mono** | Counts, shortcuts, timestamps, stats. Tabular by design, so numbers don't jiggle while you type. |

Scale (px): 11 · 12 · 13 · 14 · 15 · 17 (editor) · 20 · 24 · 32 · 44 · 64 · 88

- Display ≥ 44px: tracking −0.035em, line-height 1.02
- Headings 20–32px: tracking −0.02em, line-height 1.2
- UI 13–15px: tracking −0.005em, line-height 1.5
- Editor 17px: line-height 1.65, 62ch max
- Labels 11px: uppercase, +0.08em tracking, Geist Mono
- Tabular numbers everywhere a number can change. Curly quotes, real ellipses and apostrophes in all copy. `hanging-punctuation` on display text, with a manual optical indent for opening quotes.

### Color

Neutrals do 90% of the work. They carry a slight warm bias toward the accent so greys feel chosen, not default.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#F7F6F3` | `#0C0B0A` |
| `--surface` | `#FFFFFF` | `#141311` |
| `--surface-2` | `#F0EEEA` | `#1B1A17` |
| `--border` | `rgba(24,20,12,.09)` | `rgba(255,244,228,.08)` |
| `--text-1` | `#16140F` | `#F4F2ED` |
| `--text-2` | `#5A554B` | `#A9A399` |
| `--text-3` | `#736D62` | `#878075` |
| `--accent` (Saffron) | `#F5A30B` | `#FFB224` |
| `--accent-text` | `#9A5B00` | `#FFC65C` |
| `--accent-ink` | `#221400` | `#221400` |
| `--success` | `#17915A` | `#3DD68C` |
| `--warn` | `#C77700` | `#FFB224` |
| `--error` | `#D93D42` | `#FF6369` |

Saffron is used sparingly: the primary button, the caret, the focus ring, the hook score, the glow. Never as a background wash.

Depth: 1px borders + layered shadows + a top inner highlight in dark mode + a fine grain overlay (3–5%). No gradients except the dusk glow.

### Spacing, radii, icons

- 4pt base, 8pt rhythm: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 96 · 128
- Radii: 6 (chips) · 10 (buttons, inputs) · 14 (cards) · 20 (modals) · 28 (hero surfaces) · 999 (pills)
- Icons: 20px grid, 1.5px stroke, round caps and joins, one family, drawn in-house.

### Motion

- Springs everywhere, generated at boot into CSS `linear()` easings (real physics, interruptible because they're transitions).
  - `--spring`: stiffness 380, damping 30 → ~300ms, 2% overshoot. Default for UI.
  - `--spring-snap`: stiffness 520, damping 24 → ~340ms, visible overshoot. Thread splits, rewards.
- Micro (hover, color): 120–150ms ease-out. Panels: 220–320ms spring.
- Buttery caret: a custom caret that glides between positions (70ms) and blinks only when idle.
- Char ring morphs from ring → countdown number in the last 20 characters; saffron at 20 left, red past the limit.
- Chrome fades while you type, returns on mouse move.
- `prefers-reduced-motion`: springs become 1ms, flock goes static, no parallax.

## (d) Screens

1. **Landing** – hero with a live composer demo over a murmuration, scroll story (capture → draft → sharpen → ship), before/after rewrite slider, features, social proof, pricing, repeated CTA.
2. **Onboarding** – paste your @ → 3-second read → your voice + five posts you could write today.
3. **Composer** – thread editor, ghost text, AI riffs with word-level diff, hook score, live previews for X / Threads / LinkedIn / Bluesky, media, GIFs, polls, drag to reorder, schedule.
4. **Ideas** – capture bar (text, links, screenshots, voice memos), idea engine, inbox, remix top posts.
5. **Hooks** – hook grader + hook library.
6. **Queue** – week calendar, drag between slots, best-time glow, auto-plug, auto-repost, gap filler.
7. **Insights** – insight-first analytics with charts that explain themselves.
8. **Voice** – voice profile, tone sliders, never-say list.
9. **Upgrade** – pricing that looks as good as the product.
10. **Brand** – logo, color, type, motion and every component state.
11. Overlays – ⌘K palette, quick capture, shortcuts sheet, schedule sheet, GIF picker, toasts, publish reward.
