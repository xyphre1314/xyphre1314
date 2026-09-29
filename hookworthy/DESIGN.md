---
name: Hookworthy
description: Write posts people stop for.
colors:
  feed-ink: "#0B0C0E"
  feed-ink-raised: "#111215"
  feed-ink-crop: "#17181C"
  feed-noise: "#1A1B1F"
  feed-noise-text: "#6A6D75"
  post-paper: "#F7F7F8"
  post-ink: "#111214"
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
  success-dark: "#4CC38A"
  warn: "#C26A12"
  warn-dark: "#F2A14A"
  error: "#D63F3F"
  error-dark: "#F26D6D"
typography:
  display:
    fontFamily: "EB Garamond, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "clamp(50px, 5.4vw, 82px)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.028em"
  headline:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "clamp(40px, 5vw, 72px)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.028em"
  title:
    fontFamily: "EB Garamond, Georgia, serif"
    fontSize: "clamp(30px, 3vw, 44px)"
    fontWeight: 400
    lineHeight: 1.02
    letterSpacing: "-0.022em"
  post-first-line:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "clamp(18px, 1.55vw, 21px)"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.012em"
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "16.5px"
    fontWeight: 400
    lineHeight: 1.55
  ui:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: 1.5
  data:
    fontFamily: "Geist Mono, SF Mono, Menlo, monospace"
    fontSize: "12.5px"
    fontWeight: 500
    lineHeight: 1
    fontFeature: "tnum"
rounded:
  chip: "6px"
  control: "10px"
  card: "14px"
  post: "18px"
  crop: "22px"
  feed: "26px"
  pill: "999px"
spacing:
  "1": "4px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "5": "20px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "16": "64px"
  "24": "96px"
  section: "clamp(96px, 12vw, 168px)"
components:
  button-primary-light:
    backgroundColor: "{colors.accent-ink-light}"
    textColor: "{colors.app-surface-light}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
  button-primary-dark:
    backgroundColor: "{colors.accent-ink-dark}"
    textColor: "{colors.app-bg-dark}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
  creator-post:
    backgroundColor: "{colors.post-paper}"
    textColor: "{colors.post-ink}"
    rounded: "{rounded.post}"
    padding: "18px 18px 14px"
  noise-post:
    backgroundColor: "{colors.feed-noise}"
    textColor: "{colors.feed-noise-text}"
    rounded: "{rounded.post}"
    padding: "15px 16px 13px"
  product-crop:
    backgroundColor: "{colors.feed-ink-raised}"
    textColor: "{colors.app-text-1-dark}"
    rounded: "{rounded.crop}"
    padding: "clamp(18px, 2.4vw, 30px)"
  avatar-light:
    backgroundColor: "{colors.accent-ink-light}"
    textColor: "{colors.app-surface-light}"
    rounded: "{rounded.pill}"
    size: "26px"
---

# Design System: Hookworthy

## Overview

**Creative North Star: "The Thumb-Stop"**

A feed is a machine for ignoring things. Hookworthy is built from the feed's own grammar and owns one moment inside it: the stop. Everywhere the product shows your work, it shows it the way your audience will meet it: in a stream of other people's posts, dim and moving, with yours as the only sharp, bright object. On the landing page the stream is live. Other posts blur past with speed-linked motion blur. Your pinned post's first line is graded as you type: under 70 the feed keeps scrolling past you, and at 70 or above it brakes, parks around your post and underlines the hook.

The palette is graphite with no brand hue: a near-black feed ground, one ink accent that flips between near-black and near-white, and hue kept for meaning only (green good, amber waiting, red weak or wrong). Type pairs a classical serif at feed-breaking scale (EB Garamond, never italic-gradient) with Figtree as the native face of posts and interface, and Geist Mono for numbers only. Illustration is the product itself: real pieces of the interface (hook score, word diff, week strip, voice slider, insight bars, workspace switcher) cropped big and staged on the feed ground. It's for creators, by creators. Every surface should read as a tool someone who posts every week would build.

The owner's pins: colors minimal like Linear and Arc but not bare like Craft; type in the spirit of Wispr Flow; product crops as the illustration style.

**Key Characteristics:**
- Graphite feed ground with one bright creator post.
- A stop that has to be earned: score 70+ brakes the feed.
- Serif headlines at headline scale, sans for everything a creator types.
- Product crops instead of drawings, glows or particles.
- Hue only when it means something.

## Colors

Graphite neutrals with an ink accent. Color never decorates.

### Primary
- **Ink** (#17181B light / #F4F4F5 dark): the accent. Primary buttons, selected states, the hook underline, avatars. On-accent text flips with it (`--accent-ink`: #FFFFFF on light, #0B0C0E on dark).

### Neutral
- **Feed Ink** (#0B0C0E): the landing and onboarding ground. The feed lives here.
- **Raised Ink** (#111215) and **Crop Ink** (#17181C): product crops and the cards inside them.
- **Noise** (#1A1B1F, text #6A6D75): other people's posts. Low contrast on purpose; they are aria-hidden decoration.
- **Post Paper** (#F7F7F8, text #111214): the creator's post. The brightest thing on any dark screen.
- **App neutrals**: light bg #F7F7F8, surface #FFFFFF, surface-2 #F2F2F4, text #111216 / #51545C / #6B6F78; dark bg #08090A, surface #101113, surface-2 #16171A, text #F7F8F8 / #A3A7AF / #80858E.

### Semantic
- **Success** (#1F8F5F / #4CC38A): stopped, approved, inserted words, rising deltas.
- **Warn** (#C26A12 / #F2A14A): waiting for approval.
- **Error** (#D63F3F / #F26D6D): scrolled past, deleted words, falling deltas.

### Named Rules
**The One Bright Post Rule.** On any dark feed surface, only the creator's post is bright. Everything else stays in the graphite range.
**The Meaning-Only Hue Rule.** No brand hue. Green, amber and red appear only when they report a state. Avatars are ink, not colored gradients.

## Typography

**Display Font:** EB Garamond (with Iowan Old Style, Palatino, Georgia)
**Body Font:** Figtree (with system-ui)
**Data Font:** Geist Mono (with SF Mono, Menlo)

**Character:** a headline serif that reads like the top of a front page, next to the rounded, open sans that posts are actually written in.

### Hierarchy
- **Display** (400, clamp(50px, 5.4vw, 82px), 0.98): the landing hero only.
- **Headline** (400, clamp(40px, 5vw, 72px), 0.98): landing section heads and the final call to action. App page titles use 56px.
- **Title** (400, clamp(30px, 3vw, 44px), 1.02): moment heads, creator-type tabs (28px), plan names (32px).
- **Post first line** (Figtree 600, clamp(18px, 1.55vw, 21px), 1.35): the hook inside the creator's post.
- **Body** (Figtree 400, 16.5px, 1.55, max ~52ch): section intros and moment copy.
- **UI** (Figtree 500, 13–15px): controls, captions, status lines, keys such as "Hot take".
- **Data** (Geist Mono 500, 11–13px, tabular): scores, times, counts, deltas.

### Named Rules
**The Numbers-Only Mono Rule.** Geist Mono is for counts, times, scores and keyboard keys. Sentences, captions and labels are never set in mono.
**The No-Gradient Rule.** Headline text is solid. Emphasis comes from size, never gradient fills.

## Layout

The landing page is a 1240px container with a clamp(16px, 3.6vw, 40px) gutter.

The hero is three columns: copy (1.08fr), the feed (340–490px) and the grade readout (0.7fr). Below 1120px the readout drops under the first two columns. Below 900px it folds into the creator's post itself: the reason plus five mini bars.

Sections run on a clamp(96px, 12vw, 168px) rhythm. Content sections pair a headline block with a product crop, either as a sticky left column (grader wall, who it's for) or as a timed row. A timed row has a gutter with the time of day (Garamond 34px), the copy, and the crop.

One light chapter ("One post. Four feeds.") breaks the dark run with an inset rounded panel.

The app keeps a 232px sidebar and an inset main panel. The sidebar holds, in order: the voice switcher, search, navigation, one plan line, and the account.

## Elevation & Depth

Depth comes from brightness first and shadow second. The creator's post sits on a long, soft shadow (`0 30px 70px -20px rgba(0,0,0,.9)`) with a 1px light inner rim. Product crops use an inset 1px hairline (`rgba(255,255,255,.07)`) and a deep ambient drop (`0 40px 80px -40px rgba(0,0,0,.9)`). Motion blur on the feed is the main depth cue: moving things are behind, the sharp thing is in front. There are no glows and no glass.

### Named Rules
**The Sharp-Is-Near Rule.** Blur and dimness mean distance. Never blur or dim the creator's own content.

## Shapes

Radius grows with size: 6 for chips, 10 for controls, 14 for app cards, 18 for posts, 22 for product crops, 26 for the feed window, and pill-shaped for status chips and avatars. Posts are always rounded rectangles with an avatar column. The feed window is masked top and bottom so the stream appears to come from above and leave below.

## Components

### The creator's post (signature)
Paper card, ink text, 40px ink avatar, name and handle, and a score chip that turns ink with a green dot when stopped. It holds an editable first line (Figtree 600) with a 2px ink underline that draws in on stop, two lines of real body text ending in "show more", and a tool row (Stronger hook, Punchier, Undo). The tools go icon-only under 420px.

### The feed stream
Noise posts in a vertical track. Speed eases toward the target set by the score: 1700 px/s under 50, 950 px/s under 70. Blur is `min(7px, v/240)`. At 70 or above the track brakes with an ease-out-cubic curve onto the slot that aligns with the pinned post. With reduced motion it parks instantly.

### Grade readout
A Garamond score at 84–124px, five labelled sub-score bars, one sentence of reason, a status line in Figtree, and a speed meter: a solid red fill that grows with feed speed while you're being scrolled past, empty with a green end state once the feed stops.

### Product crop
Raised-ink panel with a hairline, holding real UI: word diffs (red deletions, green insertions, with a whole-phrase swap when little text survives), week strips, voice sliders, bars, and approval chips.

### Buttons
Primary is ink with on-accent text, 10px radius and a spring press (scale .965). Ghost has a hairline. On the dark landing the primary inverts to near-white.

### Status chips
Pill, 24px, Figtree 12px, with a 6px dot. Neutral for scheduled, amber for waiting on approval, green for approved.

### Voice switcher
Sidebar button with an ink avatar, name and kind (Personal, Client · Priya's voice). Its menu lists every voice with ⌘1–3 and "Add a client voice". A "Writing as" pill appears in the composer when a client voice is active.

## Do's and Don'ts

### Do:
- **Do** show the creator's work inside a feed context (the landing hero, the "In the feed" preview, the final call to action).
- **Do** use real product crops for every illustration, at a size where the text is readable.
- **Do** label example data ("Example account", "Names are placeholders", "Prices are placeholders").
- **Do** keep reasons specific to the line being graded. One sentence, no repeats across rows.
- **Do** respect reduced motion: the feed parks, reveals are off.

### Don't:
- **Don't** invent users, counts, testimonials or press. No evidence exists yet.
- **Don't** use gradient text, glows, particles or glass as decoration.
- **Don't** put kicker or eyebrow labels above headings.
- **Don't** set sentences in mono.
- **Don't** give avatars or UI a brand hue.
- **Don't** use hook puns in product copy ("Hook, meet world"). Talk like a creator: "Stay close for the first replies."

## Brand and Voice

- **Name:** Hookworthy (hookworthy.com). The naming search is in `NAMES.md`.
- **Promise:** Write posts people stop for.
- **Logo: The Cursor.** A text I-beam whose foot curls into a hook, drawn in one stroke weight with round caps. Icon `assets/icon.svg`, wordmark `assets/wordmark.svg` (lowercase *hookworthy* in EB Garamond 500), app icon `assets/app-icon.svg` (graphite gradient squircle with a white cursor). Other directions are in `brand/logo-directions.html`.
- **Voice rules**
  1. Creator to creator. Talk shop, not marketing.
  2. Short sentences, one idea each.
  3. Specific beats clever; numbers beat adjectives.
  4. Banned words: unlock, supercharge, leverage, elevate, seamless, game-changer, delve, "AI-powered".
  5. Errors say what happened and what to do next.

Not canonized (defects the build still carries): section-group labels in the app's cards ("Up next", "Autopilot") are UI group titles, not kickers, and stay. Nothing else is knowingly carried.
