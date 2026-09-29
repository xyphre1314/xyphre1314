---
name: Hookworthy
description: Write posts people stop for.
colors:
  canvas: "#F5F5F3"
  canvas-2: "#EDEDEA"
  ink: "#0C0C0E"
  ink-2: "#55565C"
  ink-3: "#8A8B91"
  card: "#FFFFFF"
  chapter-dark: "#09090A"
  chapter-dark-2: "#141416"
  marker: "#FFE14D"
  app-bg-light: "#F7F7F8"
  app-surface-light: "#FFFFFF"
  app-surface-2-light: "#F2F2F4"
  app-text-1-light: "#111216"
  app-text-2-light: "#51545C"
  app-text-3-light: "#6B6F78"
  app-bg-dark: "#08090A"
  app-surface-dark: "#101113"
  app-surface-2-dark: "#16171A"
  app-text-1-dark: "#F7F8F8"
  app-text-2-dark: "#A3A7AF"
  app-text-3-dark: "#80858E"
  accent-ink-light: "#17181B"
  accent-ink-dark: "#F4F4F5"
  success: "#1F8F5F"
  warn: "#C26A12"
  error: "#D63F3F"
  x-text: "#0F1419"
  x-text-dark: "#E7E9EA"
  x-secondary: "#536471"
  x-secondary-dark: "#71767B"
  x-divider: "#EFF3F4"
  x-divider-dark: "#2F3336"
  x-media: "#CFD9DE"
  x-blue: "#1D9BF0"
  x-like: "#F91880"
  x-repost: "#00BA7C"
  x-warn: "#FFD400"
  x-error: "#F4212E"
  threads-dark: "#101010"
  linkedin-page: "#F4F2EE"
  linkedin-card-dark: "#1B1F23"
  linkedin-blue: "#0A66C2"
  bluesky-secondary: "#405168"
  bluesky-icon: "#667B99"
  bluesky-divider: "#DCE2EA"
typography:
  display:
    fontFamily: "Geist, Geist Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(56px, 9vw, 132px)"
    fontWeight: 600
    lineHeight: 0.92
    letterSpacing: "-0.055em"
  headline:
    fontFamily: "Geist, Geist Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(40px, 6vw, 84px)"
    fontWeight: 600
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  title:
    fontFamily: "Geist, Geist Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(24px, 2.4vw, 32px)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Geist, Geist Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(17px, 1.5vw, 21px)"
    fontWeight: 400
    lineHeight: 1.5
  ui:
    fontFamily: "Geist, Geist Fallback, ui-sans-serif, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
  hand:
    fontFamily: "Caveat, Bradley Hand, cursive"
    fontSize: "22px"
    fontWeight: 500
    lineHeight: 1
  data:
    fontFamily: "Geist Mono, SF Mono, Menlo, monospace"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1
    fontFeature: "tnum"
  wordmark:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "23px"
    fontWeight: 500
    lineHeight: 1
  platform-x:
    fontFamily: "-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica, Arial, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: "20px"
  platform-bluesky:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.3
rounded:
  hairline: "2px"
  chip: "6px"
  linkedin: "8px"
  control: "10px"
  card: "14px"
  post: "16px"
  sheet: "22px"
  chapter: "40px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "12": "48px"
  "16": "64px"
  "24": "96px"
  section: "clamp(110px, 14vw, 190px)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.card}"
    rounded: "{rounded.pill}"
    padding: "0 22px"
    height: "48px"
  x-post:
    backgroundColor: "{colors.card}"
    textColor: "{colors.x-text}"
    rounded: "{rounded.post}"
    padding: "12px 16px 4px"
  hook-marker:
    backgroundColor: "{colors.marker}"
    textColor: "{colors.ink}"
    rounded: "{rounded.hairline}"
  app-button-primary:
    backgroundColor: "{colors.accent-ink-light}"
    textColor: "{colors.app-surface-light}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
---

# Design System: Hookworthy

## Overview

**Creative North Star: "Keynote for creators"**

If Apple, Linear and Arc built a writing tool for people who post, the homepage would be a keynote: one idea per chapter, the product as the only illustration, and motion that explains instead of decorates. Apple gives the chaptered storytelling and the pinned, scroll-scrubbed demo. Linear gives the precision: one family, tight tracking, hairlines, nothing loud. Arc gives the warmth: a light canvas, hand-drawn notes in the margins, and a yellow marker that feels like a person, not a brand.

The product's subject is other apps. So every post on every surface is rendered the way X, Threads, LinkedIn and Bluesky actually render it: real type, real spacing, real counts, real avatars. The creators are fictional (photoreal generated portraits), and the page says so once per section. The hook, the first line, is the one thing the design marks.

**Key Characteristics:**
- Light canvas with two dark chapters (the story and the voice section).
- Geist everywhere, at 600 with tight tracking for display.
- One brand color, a highlighter yellow, and it only ever marks a hook.
- Platform-true posts in place of drawings, and phones at true 390pt scale.
- Motion is tied to the reader: the ring brakes on a hook, the story scrubs with scroll, the wall drifts only when you scroll.

## Colors

### Brand
- **Marker** (#FFE14D): the highlighter under a first line. It marks the stopped post in the hero ring, the word "stop" in the headline, and text selection. It is never a button, border or background.

### Neutral
- **Canvas** (#F5F5F3) and **Canvas 2** (#EDEDEA): the homepage ground, warm off-white.
- **Ink** (#0C0C0E), **Ink 2** (#55565C), **Ink 3** (#8A8B91): text and primary buttons.
- **Chapter Dark** (#09090A, raised #141416): the two dark chapters, inset with a 40px radius.
- **App neutrals**: light bg #F7F7F8, surface #FFFFFF, text #111216 / #51545C / #6B6F78; dark bg #08090A, surface #101113, text #F7F8F8 / #A3A7AF / #80858E. The accent is ink itself (#17181B light, #F4F4F5 dark).

### Semantic (app)
- **Success** (#1F8F5F), **Warn** (#C26A12), **Error** (#D63F3F): state only.

### Platform replicas
These are not Hookworthy colors. They exist so a replica matches the real app, and they appear only inside a post, feed or phone.
- **X**: text #0F1419 / #E7E9EA, secondary #536471 / #71767B, divider #EFF3F4 / #2F3336, media #CFD9DE, blue #1D9BF0, like #F91880, repost #00BA7C, counter warn #FFD400, over-limit #F4212E.
- **Threads**: dark #101010, username weight 600, rails at 15% ink.
- **LinkedIn**: page #F4F2EE, dark card #1B1F23, blue #0A66C2.
- **Bluesky**: secondary #405168, icons #667B99, divider #DCE2EA.

### Named Rules
**The One Marker Rule.** Yellow appears only as a highlighter under a hook. If it is doing anything else, remove it.
**The Replica Rule.** Platform colors never leave a platform replica, and Hookworthy colors never enter one.

## Typography

**Family:** Geist (display, headings, UI, body), Geist Mono for numbers and keys, Caveat for margin notes, EB Garamond for the wordmark only. Every face is self-hosted in `fonts/` (OFL). **Geist Fallback** is Arial with Geist's metrics (size-adjust 104.76%, ascent 95.94%, descent 28.16%), so a slow font never reflows a line.
**Replicas:** each platform's own stack (system UI for X, Threads and LinkedIn; Inter for Bluesky).

### Hierarchy
- **Display** (600, clamp(56px, 9vw, 132px), 0.92, -0.055em): hero only.
- **Headline** (600, clamp(40px, 6vw, 84px), 0.98): one per chapter.
- **Title** (600, 24–32px): cards, plans and app page titles (56px in the app).
- **Body** (400, 17–21px, max ~56ch): chapter intros.
- **UI** (500, 13–15px): controls, captions.
- **Hand** (Caveat 500, 20–24px, rotated 2–4°): at most two margin notes in the hero, with drawn arrows.
- **Data** (Geist Mono 500, tabular): scores, counts, times, keys.

### Named Rules
**The Numbers-Only Mono Rule.** Mono is for counts, times, scores and keys, never sentences.
**The No-Gradient Rule.** Text is solid. Emphasis comes from the marker or from size.

## Layout

The homepage uses a 1180px wrap with a clamp(16px, 4vw, 40px) gutter. Chapters are spaced clamp(110px, 14vw, 190px) apart. Each chapter has one centered headline, one sentence and one demo.

1. **Hero**: headline, sub, two CTAs, two hand notes, then the 3D ring of X posts. The ring is a CSS cylinder of 320px cards (real X posts rendered at 400px and scaled). It turns slowly, brakes on a Hermite curve, and marks the front card's first line and hook score. It supports drag with inertia and pauses off-screen.
2. **Story** (520vh, pinned, dark): the chapter opens from an inset rounded sheet to full bleed as it arrives. One post goes from an 11:47pm draft (type up to 36px, pushed in), to hedges struck through, to a rewrite in her voice, to scheduled for Tue 8:40. Then the draft leaves and a viewport-sized phone takes the stage, with the X feed, a live count-up and an iOS notification.
3. **Void wall**: two rows of relatable posts that drift with scroll.
4. **Four feeds**: X, Threads, LinkedIn and Bluesky phones at true 390pt scale (`zoom`), with a light/dark toggle.
5. **The fold**: type a LinkedIn post and watch the "…more" cut.
6. **Voice** (dark): sliders rewrite an X post live.
7. **Week**: posts drop onto golden slots over a neutral ink heat ramp (quiet to busy). The peak slot has a 1.5px ink outline. On phones the week swipes.
8. **Creators**: tabs for solo, founder and ghostwriter, each a demo built from platform posts (before and after, release notes to posts, voice switcher with approval).
9. **Pricing**, then the **Final CTA** (a second ring).

The app keeps its 232px sidebar and inset main panel. The composer's "In the feed" panel renders your draft with the same platform components, between two real neighbour posts, in the app's theme.

## Elevation & Depth

Real-world depth only: phone frames with a machined edge, cards with a 1px hairline and a long soft drop (`0 16px 30px -24px rgba(0,0,0,.35)`), and 3D perspective in the ring. No glows and no glass, except the iOS notification, which copies iOS's own material.

## Shapes

Radius grows with size: 2 (marker), 6 (chips), 8 (LinkedIn cards), 10 (app controls), 14 (app cards), 16 (X cards and media), 22 (sheets and notifications), 40 (dark chapters), and pill for CTAs and avatars.

## Components

### Platform posts (signature)
`xPost`, `thPost`, `liPost` and `bsPost` render one post object (person, text, media, counts, age) exactly as each app does, in light or dark:
- **X**: 40px avatar, 15/20 text, actions for reply, repost, like and views plus bookmark and share, and count formats `1,204` / `12.4K` / `124K` / `1.2M`.
- **Threads**: 36px avatar in a 48px column, and a rail for thread replies.
- **LinkedIn**: 48px avatar, a "· You" or "· 2nd" degree, clamped at three lines with the "…more" button and no ellipsis of its own.
- **Bluesky**: Inter, 42px avatar, and a `.bsky.social` handle.

Fictional accounts never carry a verified badge.

### Portraits and photos
18 generated portraits and 6 photos, served as two sprite sheets (`.avp`, `.mdp`). If a sprite fails to load, the post shows initials on a neutral or hue-tinted disc.

### Phone
True 390pt frame with the island, status bar, app header, tabs and tab bar, scaled with `zoom` so type stays crisp.

### Buttons
The homepage primary is an ink pill (48px) with a white label and an arrow that nudges on hover. The ghost button has a play glyph in a circle. In the app, the primary is ink with a 10px radius and a spring press.

### Character ring (composer)
It follows X: a quiet ring that grows at 20 remaining, turns to warning then error, shows the count, and hides the circle at 10 over.

## Do's and Don'ts

### Do:
- **Do** render every post as its platform does, with a portrait, name, handle, time and counts.
- **Do** label fictional creators once per section ("Illustrative posts. The creators are fictional.").
- **Do** tie motion to the reader's scroll or to a meaningful stop. Each chapter has its own move: the headline wipes up from its baseline, demos rise with a slight tilt, phones stagger, and the wall only drifts.
- **Do** respect reduced motion: the ring stops, the story shows its end state, and the wall stays still.

### Don't:
- **Don't** use real people's names, faces or posts without permission, or put verified badges on fictional accounts.
- **Don't** auto-scroll content (no marquees) or use side-stripe accents.
- **Don't** use gradient text, glows or decorative glass.
- **Don't** put kickers or eyebrows above headings.
- **Don't** set sentences in mono.
- **Don't** use yellow for anything but a hook.

## Brand and Voice

- **Name:** Hookworthy. **Promise:** Write posts people stop for.
- **Logo: The Cursor.** A text I-beam whose foot curls into a hook, with the wordmark *hookworthy* in EB Garamond 500. Files: `assets/icon.svg`, `assets/wordmark.svg`, `assets/app-icon.svg`.
- **Voice:** creator to creator; short sentences; numbers beat adjectives; no "unlock / supercharge / leverage / elevate / seamless / AI-powered".
