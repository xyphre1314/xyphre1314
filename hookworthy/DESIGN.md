---
name: Hookworthy
description: Write posts people stop for.
colors:
  canvas: "#F2F5FB"
  canvas-2: "#E9EEF8"
  ink: "#0B1A3A"
  ink-2: "#46536F"
  ink-3: "#5B6887"
  card: "#FCFDFF"
  chapter-dark: "#0B1A3A"
  chapter-dark-2: "#132552"
  accent: "#2355F0"
  accent-dark: "#86A8FF"
  accent-ink-dark: "#0A1330"
  marker: "#CFDFFF"
  pastel-blue: "#D6E4FF"
  pastel-periwinkle: "#DFDBFF"
  pastel-aqua: "#CDEFEA"
  pastel-peach: "#FFE0D2"
  pastel-mint: "#D5F2DC"
  app-bg-light: "#F2F5FB"
  app-surface-light: "#FCFDFF"
  app-surface-2-light: "#E9EEF8"
  app-text-1-light: "#0B1A3A"
  app-text-2-light: "#46536F"
  app-text-3-light: "#5B6887"
  app-bg-dark: "#0E1424"
  app-surface-dark: "#161E33"
  app-surface-2-dark: "#1C2640"
  app-text-1-dark: "#E9EEFB"
  app-text-2-dark: "#A9B4D0"
  app-text-3-dark: "#8E9AB9"
  success: "#16704A"
  warn: "#9A4F0A"
  error: "#B42A34"
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
    fontFamily: "Instrument Serif, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "clamp(58px, 9vw, 138px)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "Instrument Serif, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "clamp(40px, 6vw, 84px)"
    fontWeight: 400
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
    fontFamily: "Geist, Geist Fallback, sans-serif"
    fontSize: "20px"
    fontWeight: 650
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
    backgroundColor: "{colors.accent}"
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
    backgroundColor: "{colors.accent}"
    textColor: "{colors.app-surface-light}"
    rounded: "{rounded.control}"
    padding: "0 16px"
    height: "36px"
---

# Design System: Hookworthy

## Overview

**Creative North Star: "Keynote for creators"**

If Apple, Linear and Arc built a writing tool for people who post, the homepage would be a keynote: one idea per chapter, the product as the only illustration, and motion that explains instead of decorates. Apple gives the chaptered storytelling and the pinned, scroll-scrubbed demo. Linear gives the precision: one family, tight tracking, hairlines, nothing loud. Arc and Wispr Flow give the warmth: an ivory canvas, soft pastel washes, hand-drawn notes in the margins, and one calm blue that marks what matters.

The product's subject is other apps. So every post on every surface is rendered the way X, Threads, LinkedIn and Bluesky actually render it: real type, real spacing, real counts, real avatars. The creators are fictional (photoreal generated portraits), and the page says so once per section. The hook, the first line, is the one thing the design marks.

**Key Characteristics:**
- Light canvas with two dark chapters (the story and the voice section).
- Instrument Serif for the big moments (headlines, page titles, prices, the wordmark), with italics for emphasis. Geist for everything you click and read in bulk.
- A colorful blue family: cobalt for action, sky for highlights, navy for ink and dark chapters, and five pastels that label kinds of posts.
- Platform-true posts in place of drawings, and phones at true 390pt scale.
- Motion is tied to the reader: the ring brakes on a hook, the story scrubs with scroll, the wall drifts only when you scroll.

## Colors

### Brand (round 8: "Bluebird")
- **Cobalt** (#2355F0 on Sky, #86A8FF on Midnight): the one main button per screen, on/selected states, the caret, the hook chip once it clears 70.
- **Sky tint** (#CFDFFF, rgba(134,168,255,.24) on Midnight): the highlighter under a first line that scores 70+, the word "stop", text selection, a Sharpen take. Text on it stays ink.
- **Navy** (#0B1A3A): ink on light, and the homepage's dark chapters (story, voice), which carry cobalt and violet glows.
- **Pastels** (each with an ink that passes AA on it): blue #D6E4FF / #16358F, periwinkle #DFDBFF / #3A2F96, aqua #CDEFEA / #0D5550, peach #FFE0D2 / #83341A, mint #D5F2DC / #1C5B2E. They label kinds of post (Contrarian peach, Story and Question periwinkle, Listicle and How-to aqua, Curiosity blue, Lesson and Proof mint) and the reasons a post spread. On Midnight they become 15–18% tints with light inks.
- **Wash**: soft radial blooms of blue, violet, aqua and a touch of peach behind the homepage hero and the top of every app page.
- The accent picker from round 7 is gone: one blue brand, used everywhere.

### Neutral (two themes)
- **Sky** (light, not white): bg #F2F5FB, surface #FCFDFF, sunk #E9EEF8, text #0B1A3A / #46536F / #5B6887.
- **Midnight** (dark, not black): bg #0E1424, surface #161E33, raised #1C2640, text #E9EEFB / #A9B4D0 / #8E9AB9. A deep navy, closer to a night sky than to black.
- **Homepage:** Sky canvas, navy chapters inset with a 40px radius, and the Pro plan as the one cobalt card.
- System picks the theme by default; Sky or Midnight can be pinned from Appearance (or ⇧T).

### Semantic (app)
- **Success** (#1F8F5F), **Warn** (#C26A12), **Error** (#D63F3F): state only.

### Platform replicas
These are not Hookworthy colors. They exist so a replica matches the real app, and they appear only inside a post, feed or phone.
- **X**: text #0F1419 / #E7E9EA, secondary #536471 / #71767B, divider #EFF3F4 / #2F3336, media #CFD9DE, blue #1D9BF0, like #F91880, repost #00BA7C, counter warn #FFD400, over-limit #F4212E.
- **Threads**: dark #101010, username weight 600, rails at 15% ink.
- **LinkedIn**: page #F4F2EE, dark card #1B1F23, blue #0A66C2.
- **Bluesky**: secondary #405168, icons #667B99, divider #DCE2EA.

### Named Rules
**The One Accent Rule.** The accent is solid in exactly two jobs (the one main button on a screen, and on/selected states) and a soft tint in one (the highlighter under words worth stopping for). Everything else is neutral. If two solid blue things compete on one screen, one of them is wrong.
**The One Threshold Rule.** 70 is the only number that matters. At 70 or more, the hook chip fills with the accent, the tint sweeps under the first line, and a small sound plays. Below 70, nothing celebrates.
**The Replica Rule.** Platform colors never leave a platform replica, and Hookworthy colors never enter one.

## Typography

**Family:** Instrument Serif (400, roman and italic) for display: homepage headlines, app page titles and section heads, plan names and prices, big numbers, quote cards, and the wordmark. Geist for UI and body. Geist Mono for numbers and keys, Caveat for margin notes on the homepage. Nothing else. Every face is self-hosted in `fonts/` (OFL). **Geist Fallback** is Arial with Geist's metrics (size-adjust 104.76%, ascent 95.94%, descent 28.16%), so a slow font never reflows a line.
**Replicas:** each platform's own stack (system UI for X, Threads and LinkedIn; Inter for Bluesky).

### Hierarchy
- **Display** (Instrument Serif 400, clamp(58px, 9vw, 138px), 0.92, -0.022em): hero and final call; emphasis is italic plus the sky tint.
- **Headline** (Instrument Serif 400, clamp(46px, 6.2vw, 92px), 0.96): one per chapter. App page titles use the same face.
- **Title** (Instrument Serif 400, 27–38px): section heads (.h1, .h2), plan names; Geist 600 for card titles (h3).
- **Body** (400, 17–21px, max ~56ch): chapter intros.
- **UI** (500, 13–15px): controls, captions.
- **Hand** (Caveat 500, 20–24px, rotated 2–4°): at most two margin notes in the hero, with drawn arrows.
- **Data** (Geist Mono 500, tabular): scores, counts, times, keys.

### Named Rules
**The Numbers-Only Mono Rule.** Mono is for counts, times, scores and keys, never sentences.
**The No-Gradient Rule.** Text is solid. Emphasis comes from the tint or from size.

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

### Sharpen (selection rewrite)
Select three or more characters in a post and an ink pill appears above where the selection starts. It offers Punchier, Shorter, Clearer, Bolder and More human (⌥1–5). Picking one previews the first of three takes in place on a marker-soft background. You flip takes with ‹ › or the arrow keys, keep with ↵ (the accent Keep button), and cancel with Esc. Kept text flashes the tint and fades. Sharpen is free and unlimited, because it only touches the words you chose.

### Visuals
The spark-image tool opens four kinds of visual, each rendered to canvas in-browser:
- **Quote card:** your line on Paper, Ink (navy) or Tint, set in Instrument Serif with the first line on a sky band.
- **Before / after:** a chart parsed from "21% → 38%" or "from X to Y" in your post.
- **Post screenshot:** an X-style card for cross-posting.
- **Frame a screenshot:** drop an image and get padding, a radius and a shadow.

Each comes in 16:9, 1:1 or 4:5, and is added as an image with alt text.

### Primary audience
Most users write about crypto and trading. The product shows them first-class: the first niche in onboarding, trader posts in the hero ring and the relatable wall, a trader as the solo creator story, and What’s working defaulting to trading. Other niches keep equal craft.

### What’s working (Ideas tab, formerly Niche radar)
Choose a niche, then:
- **Trends:** three trends, with the one you're early on outlined in ink and given a "Post on it first" button.
- **Popped posts:** real-looking posts from accounts in your niche, each with three reasons it spread (early, hook, relatable, timing, format, proof) and the structure written out with placeholders marked.
- **Write your take:** loads that structure into the composer with [brackets] to fill.

The accounts are illustrative and labelled as such.

### Live demo (homepage)
A product window with four tabs that act as a timeline (Sharpen, Visuals, Niche radar, Schedule). A cursor works the real UI, each tab fills as its scene plays, the demo auto-advances and loops only while on screen, and clicking a tab jumps to it. Sound is opt-in from the speaker in the title bar.

### Sound
Sounds are synthesized in Web Audio and never samples. Each is under 350 ms and very quiet:
- **tick:** toggles and tabs.
- **tap:** primary actions.
- **hook:** a rising two-note cue when the first line crosses 70.
- **swap:** a rewrite or take is kept.
- **done:** a four-note arpeggio when a post is scheduled or published.

Sounds are on by default in the app and can be switched off in the account menu. On the homepage they're off until you ask for them.

### App shell
- **Sidebar:** logo, a New post pill, Search (⌘K), then Write, Ideas, Queue, Insights and Your voice. Your five most recent drafts sit below, and the account button (which also switches client voices) is at the bottom. There are no section headers.
- **Composer top bar:** status, a “N things to check” pill when there is something to look at, Post to, Focus, a labelled Preview toggle (pressed when open), ··· and Schedule. The preview panel has its own **Hide** button top right, and ⌘\\ works from inside the editor.
- **Ideas:** three tabs that say what they are: **Fresh angles** (ideas for you and remixes), **What’s working** (niche trends and why posts popped) and **Saved** (links, notes, screenshots and voice memos you parked; formerly Inbox).
- **Hook formulas** are no longer a tab. When your first line scores under 70, the hook panel offers three formulas; picking one adds it above your line with the first blank selected. The full library stays reachable from ⌘K.

### Before you post (checks)
The small stuff people only notice once it’s live, checked on every keystroke and shown in the schedule sheet and the top-bar pill: leftover blanks ([brackets], TK, TODO), a link in the first post on X or LinkedIn (fix: move it to a reply), a word used three times, more than two hashtags, images without a description (fix: describe it), thread numbering that doesn’t match (fix: renumber), a thread ending on a colon or ellipsis, a post starting with @ on X, a first line that repeats something already queued, and double spaces (fix: tidy up). Checks never block posting.

### Focus mode
⌘. (or the target button) hides the sidebar, preview and chrome, centers the editor and keeps the line you’re on at eye height (typewriter scrolling). Esc or ⌘. brings everything back. Desktop only.

### Appearance
The account menu’s Appearance item picks Sky, Midnight or Match my system.
- **Post tools:** image, GIF, visual, poll | Rewrite … hook chip, character ring.

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
- **Don't** use the accent as decoration, or for more than one solid thing per screen. No colored glows.

## Brand and Voice

- **Name:** Hookworthy. **Promise:** Write posts people stop for.
- **Logo: the wordmark.** *hookworthy* in Instrument Serif italic, lowercase, ink on light and near-white on dark. No symbol. Where a square icon is unavoidable (favicon, app icon, PWA), an italic serif *h* sits on a cobalt tile (a gradient with a violet bloom for the app icon). Files: `assets/wordmark.svg` (outlined), `assets/icon.svg`, `assets/app-icon.svg` / `.png`.
- **Glossary (say it this way):**

  | Say | Don't say |
  |---|---|
  | Rewrite | Riff |
  | Sharpen | AI edit |
  | Best time | Golden slot |
  | Follow-up reply | Auto-plug |
  | Fresh angles | Engine, Ideas for you |
  | What’s working | Niche radar |
  | Saved | Inbox |
  | Your voice | Voice profile |
  | Hook formulas | Hook library |
  | Drafts | Archive |

- **Time format:** 8:40 AM, with a space and capitals, as on X.
- **Voice:** a coworker who writes too: warm, plain, a little dry. Say what happened and what to do next (“Gone from the queue.”, “Added on top. Your old line is right below it.”), never “Operation successful”. Creator to creator; short sentences; numbers beat adjectives; no "unlock / supercharge / leverage / elevate / seamless / AI-powered".
