# Hookworthy: brand and design system

> Write posts people stop for.

## (a) Name

**Pick: Hookworthy** (hookworthy.com, standard price). The hook is the first line, the only part most people read. "Worthy" is the promise: every post earns the stop. The name says what the product does and doubles as a verb-ish tagline: *write hookworthy.*

The full search (5 rounds, 250+ candidates, domain checks) is in `NAMES.md`.

## (b) Brand identity

- **Promise:** Write posts people stop for.
- **Tagline:** Write hookworthy.
- **Personality:** Calm. Sharp. Warm.
- **Voice rules**
  1. Short sentences. One idea each.
  2. Talk like a friend who edits for a living: direct, a little dry, always on your side.
  3. Specific beats clever. Numbers beat adjectives.
  4. Banned words: unlock, supercharge, leverage, elevate, seamless, game-changer, delve, "AI-powered".
  5. Celebrate quietly. One exclamation mark per screen, max. Usually zero.
  6. Errors say what happened and what to do next. No "Oops", no apologies.
- **Logo: The Cursor** (direction B, "Graphite"). A text I-beam whose foot curls into a hook: writing first, catching second. One stroke weight, round caps, no fill. It reads at 16px and on a billboard. On hover it tilts back. Other directions considered: `brand/logo-directions.html`.
  - Icon: `assets/icon.svg`
  - Wordmark: `assets/wordmark.svg` (lowercase *hookworthy*, EB Garamond 500, −2% tracking, the cursor leading)
  - App icon: `assets/app-icon.svg` (graphite gradient squircle `#4A4C53 → #141518`, white cursor, a soft top sheen and a glass edge: the Arc-style touch)
- **Signature motif: the cursor + soft light.** The cursor marks where writing happens: the logo, the editor caret, the hook score ring. Glows behind heroes are neutral white light, never tinted. The landing page's particle field stays as ambient "attention" gathering around the composer.

## (c) Design system

### Type (v2: Wispr Flow-inspired)

| Role | Face | Why |
|---|---|---|
| Display | **EB Garamond**, regular weight, 40–128px | Classical and literary. Authority comes from size, not weight. The italic is the voice moment (*loud*). It says "writing" before you read a word. |
| UI + writing | **Figtree** | Friendly geometric sans, open and readable at 13–18px. Soft enough to sit next to Garamond without fighting it. |
| Mono | **Geist Mono** | Counts, shortcuts, timestamps, stats. Tabular, so numbers don't jiggle while you type. |

- Display: tracking −0.02 to −0.03em, line-height 0.96–1.05, weight 400. Big numbers (KPIs, prices, scores) use Garamond lining figures.
- Editor: Figtree 18/1.6. UI: 13–15px.
- Labels: Geist Mono 11px uppercase, +0.08em.

### Color (v2: Linear-inspired)

Cool, near-neutral greys (Linear) and no brand hue. The accent is ink: near-black on light, near-white on dark. Hue is reserved for meaning: green for good, amber for warnings, red for errors. The landing page and onboarding are always dark, like Linear's site, with one light "paper" chapter (the Wispr-style alternation). The app follows light/dark.

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#F7F7F8` | `#08090A` |
| `--surface` / panel | `#FFFFFF` | `#101113` / `#0F1012` |
| `--surface-2` | `#F2F2F4` | `#16171A` |
| `--border` | `rgba(17,18,24,.08)` | `rgba(255,255,255,.07)` |
| `--text-1` | `#111216` | `#F7F8F8` |
| `--text-2` | `#51545C` | `#A3A7AF` |
| `--text-3` | `#6B6F78` | `#80858E` |
| `--accent` (Ink) | `#17181B` | `#F4F4F5` |
| `--accent-text` / `--accent-ink` | `#17181B` / `#FFFFFF` | `#F4F4F5` / `#0B0C0E` |
| `--success` / `--warn` / `--error` | `#1F8F5F` / `#C26A12` / `#D63F3F` | `#4CC38A` / `#F2A14A` / `#F26D6D` |
| Paper chapter | `#F5F4F0` | n/a |

Depth comes from 1px borders, an inset main panel (Linear's app shell), soft neutral light behind heroes, and gradient-to-transparent headline text. No grain and no blur-banding glows.

### Spacing, radii, icons

- 4pt base, 8pt rhythm: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 96 · 128
- Radii: 6 (chips) · 10 (buttons, inputs) · 14 (cards) · 20 (modals) · 28 (hero surfaces) · 999 (pills)
- Icons: 20px grid, 1.5px stroke, round caps and joins, one family, drawn in-house.

### Motion (Linear × Wispr × Notion)

- **Linear:** blur-and-rise reveals on scroll (only below the fold, so the first frame is always complete), the hero headline arriving word by word, and view transitions that cross-fade the main panel between routes while the sidebar stays put.
- **Wispr:** soft, organic easing (`cubic-bezier(.16,1,.3,1)`) and generous durations for big moments (0.6–1s).
- **Notion:** snappy, springy micro-interactions: buttons and chips press to 0.965, switches squash, the nav highlight glides between items, and the hook ring counts up.
- Springs are generated at boot into CSS `linear()` easings. Toasts morph one at a time. Ghost text appears after a 1.1s pause and never repeats generic suggestions.
- `prefers-reduced-motion` turns everything into 1ms fades with no reveals.

## (d) Screens

1. **Landing** – hero with a live composer demo over a field of attention, scroll story (capture → draft → sharpen → ship), before/after rewrite slider, features, social proof, pricing, repeated CTA.
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
