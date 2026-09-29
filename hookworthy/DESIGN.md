---
name: Hookworthy
description: Write posts people stop for.
colors:
  cream: "#FEFDF1"
  cream-2: "#F2F0E3"
  card: "#FFFFF8"
  ink: "#1A1A1A"
  ink-2: "#4D4C46"
  ink-3: "#65645C"
  periwinkle: "#DDE5FF"
  harbor: "#0B3A66"
  harbor-2: "#0E4577"
  link-blue: "#1E4FC2"
  ember: "#FF9F43"
  squiggle: "#7F9CF0"
  pastel-blue: "#D6E4FF"
  pastel-periwinkle: "#DFDBFF"
  pastel-aqua: "#CDEFEA"
  pastel-peach: "#FFE0D2"
  pastel-mint: "#D5F2DC"
  dark-bg: "#1C1C1B"
  dark-surface: "#252523"
  dark-raised: "#2C2C29"
  dark-text-1: "#F6F4E6"
  dark-text-2: "#B4B2A6"
  dark-text-3: "#98968B"
  dark-periwinkle: "#BCCBFF"
  accent: "#1E4FC2"
  marker: "#DDE5FF"
  app-surface-light: "#FFFFF8"
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
    fontFamily: "EB Garamond, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "clamp(58px, 9vw, 138px)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "-0.022em"
  headline:
    fontFamily: "EB Garamond, Iowan Old Style, Palatino Linotype, Georgia, serif"
    fontSize: "clamp(40px, 6vw, 84px)"
    fontWeight: 400
    lineHeight: 0.98
    letterSpacing: "-0.045em"
  title:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(24px, 2.4vw, 32px)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(17px, 1.5vw, 21px)"
    fontWeight: 400
    lineHeight: 1.5
  ui:
    fontFamily: "Figtree, ui-sans-serif, system-ui, sans-serif"
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
    fontFamily: "Figtree, ui-sans-serif, sans-serif"
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

**Creative North Star: "Cream & Blocks"** (round 10; round 9 was "Harbor & Cream")

Wispr Flow's editorial calm, translated to blue for people who write in public. A cream page, classic Garamond headlines split into roman and *italic* halves, a friendly sans for everything you click, and color that arrives in big confident blocks (a harbor-blue chapter, an ink chapter, one harbor pricing card) instead of gradients and glows. Research basis: Wispr's own tokens (cream #FFFFEB, ink #1A1A1A, lavender #F0D7FF for actions, forest #034F46 for sections, ember #FFA946 for active states; EB Garamond 400 at 32px+, Figtree for UI; 128px section padding).

**Key Characteristics:**
- Cream canvas (#FEFDF1), ink text (#1A1A1A), no pure white and no pure black.
- EB Garamond 400 only at 32px and above, roman with an italic second half. Figtree for UI and body.
- Primary actions are the palette pastel (Lilac #EADCFF by default) with a 1.5px ink border and a 10px radius, never a solid saturated fill.
- Palette blocks (Plum #3B1F5C by default) and ink (#1A1A1A) as full-bleed rounded blocks; uppercase letter-spaced eyebrows above headlines; a hand-drawn periwinkle squiggle instead of a highlighter.
- Platform-true posts, fictional creators labelled once per section.

## Colors

### Palettes (round 10)
The structure never changes: cream canvas, ink text, EB Garamond + Figtree, bordered pastel buttons, color arriving in big blocks. What changes is a **palette**: five variables that every surface reads (homepage, app, visuals, squiggle).

- `--pa` action pastel: primary buttons (with a 1.5px ink border on light), the selection tint, the hero highlight.
- `--pl` / `--pl-d` link color on light / on dark: links, caret, switches, the hook chip at 70+, chart lines. Must pass 4.5:1 on cream and with white text; the dark variant 4.5:1 on #1A1A1A and #2A2A2A.
- `--pb1..3` + `--ppro` blocks: story chapter, voice chapter, final call, Pro plan (single-hue palettes repeat one color; rainbow palettes give each its own). Cream text must pass 4.5:1 on each.
- `--psp` spark: rare active states.
- squiggle: one color, or a gradient for rainbow palettes (generated as SVG at runtime).

Default: **Lilac & Plum**. Switch in the app under Appearance → Palette, or ⌘K → Change palette. Choice is stored per device.

| Palette | Group | Action | Link (light / dark) | Blocks | Spark |
|---|---|---|---|---|---|
| Lilac & Pine | Soft pairs | #EBDDFF | #5B3FB8 / #C6B3FF | #1F4D3A #1A1A1A | #FF9F43 |
| Lilac & Plum | Soft pairs | #EADCFF | #6A2FA0 / #CDB2FF | #3B1F5C #1A1A1A | #FF9F6B |
| Sage & Pine | Soft pairs | #DCEFD7 | #23704A / #9FDDB4 | #1F4D3A #1A1A1A | #F2A93B |
| Peach & Espresso | Soft pairs | #FFE0CC | #B24A1B / #FFB48F | #3A2418 #1A1A1A | #FF7A45 |
| Blush & Wine | Soft pairs | #FFDCE4 | #A8264C / #FF9FB6 | #5A1A2E #1A1A1A | #FF8A65 |
| Mint & Deep Teal | Soft pairs | #CFF3E6 | #0E7263 / #8FE0CB | #0F4C4A #1A1A1A | #FF9E7A |
| Coral & Navy | Soft pairs | #FFD6CC | #C23B22 / #FFA08C | #1C2541 #1A1A1A | #FF6F59 |
| Matcha & Cocoa | Soft pairs | #E4EFC7 | #4E6E12 / #C2DE7E | #3B2A20 #1A1A1A | #E8913A |
| Rose & Forest | Soft pairs | #FAD4DC | #B0305A / #FF9DB8 | #0E3B2E #1A1A1A | #E85D75 |
| Iris & Ink | Soft pairs | #E2DDFF | #4B3BD1 / #B8AEFF | #1A1A1A #262626 #2A2356 | #7C6CFF |
| Tangerine & Charcoal | Soft pairs | #FFDDBF | #B34A00 / #FFAA66 | #232323 #1A1A1A | #FF7A1A |
| Sky & Midnight | Soft pairs | #D6EAFF | #1D5FB8 / #9CC8FF | #13294B #1A1A1A | #FFB86B |
| Clay & Moss | Earthy | #F4DDCF | #9A4524 / #F0A785 | #3E4A2C #2B211B #7A3B25 | #D98C4A |
| Seafoam & Harbor | Earthy | #D3F0EC | #0B6E75 / #86D9D6 | #0B3C49 #1A1A1A | #FF9F43 |
| Rainbow Pastel | Rainbow | #E6DEFF | #5B3FB8 / #C6B3FF | #3B2A6B #0F4C4A #7A2E4A #1E3D6B | #FF9F43 |
| Aurora | Rainbow | #D6F2EA | #0B6E4F / #8EE0C2 | #0B4A3A #2A2466 #0E4A7A #5A2366 | #FF8FB1 |
| Sunset | Rainbow | #FFDCCB | #B4441F / #FFA98A | #5B2A86 #1A1A1A #B23A48 #B8471C | #FFB547 |
| Riso Print | Rainbow | #FFD6EA | #C21F7A / #FF96C8 | #0B4F9C #1A1A1A #00794A #C21F7A | #FF48B0 |
| Crayon Box | Rainbow | #FFE3D6 | #B8323D / #FF8F8F | #1D4E6B #1A1A1A #8A2B3A #1F6F66 | #F4A261 |
| Prism | Rainbow | #E0E7FF | #3D3FC4 / #AEB6FF | #2B1B5E #12344D #6A1B4D #1B4D3E | #FFB86B |

### Neutrals
- Light: cream #FEFDF1, card #FFFFF8, sunk #F2F0E3, ink #1A1A1A / #4D4C46 / #65645C.
- **Dark (Wispr-style):** near-black #1A1A1A (Wispr's own dark), surfaces #232323 / #2B2B2B / #353535, cream text #FFFFEB / #CFCDBB / #B3B1A0, hairlines rgba(255,255,235,.09). Primary buttons keep the palette pastel with ink text, exactly like Wispr's lavender on black.
- Text on colored blocks is cream at 84–100% opacity, never a fixed grey, so it reads on every palette.

### Retired
Round 9's harbor blue (#0B3A66) and periwinkle as the only brand colors; round 8's cobalt, sky canvas, navy dark mode and washes.

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

**Family:** EB Garamond (400; 500 in the wordmark), roman and italic, for display at 32px and up: homepage headlines, app page titles, plan names and prices, big numbers, quote cards. Figtree (400 body, 600 buttons, nav and badges) for everything below 32px. Geist Mono for numbers and keys, Caveat for margin notes on the homepage. Nothing else. Every face is self-hosted in `fonts/` (OFL). **Geist Fallback** is Arial with Geist's metrics (size-adjust 104.76%, ascent 95.94%, descent 28.16%), so a slow font never reflows a line.
**Replicas:** each platform's own stack (system UI for X, Threads and LinkedIn; Inter for Bluesky).

### Hierarchy
- **Display** (EB Garamond 400, clamp(56px, 8.4vw, 128px), 0.98, -0.018em): hero and final call. The second half is italic, one word gets the squiggle.
- **Headline** (EB Garamond 400, clamp(46px, 6.2vw, 92px), 1.02): one per chapter, roman then italic, under an uppercase Figtree eyebrow (12.5px, .14em).
- **Title** (EB Garamond 400, 32–56px): app page titles, plan names, prices. Section heads below 32px are Figtree 600 19px.
- **Body** (400, 17–21px, max ~56ch): chapter intros.
- **UI** (500, 13–15px): controls, captions.
- **Hand** (Caveat 500, 20–24px, rotated 2–4°): at most two margin notes in the hero, with drawn arrows.
- **Data** (Geist Mono 500, tabular): scores, counts, times, keys.

### Named Rules
**The Numbers-Only Mono Rule.** Mono is for counts, times, scores and keys, never sentences.
**The No-Gradient Rule.** Text is solid. Emphasis comes from the tint or from size.
**The Tracking Rule.** Negative letter-spacing only on Garamond at 32px and up. Figtree is always 0 (uppercase eyebrows get +.14em). Body text runs at 1.5 or looser.

## Layout

The homepage uses a 1180px wrap with a clamp(16px, 4vw, 40px) gutter. Chapters are spaced clamp(110px, 14vw, 190px) apart. Each chapter has one centered headline, one sentence and one demo.

1. **Hero**: headline, sub, two CTAs, two hand notes, then the 3D ring of X posts. The ring is a CSS cylinder of 320px cards (real X posts rendered at 400px and scaled). It turns slowly, brakes on a Hermite curve, and marks the front card's first line and hook score. It supports drag with inertia and pauses off-screen.
2. **Story** (520vh, pinned, dark): the chapter opens from an inset rounded sheet to full bleed as it arrives. One post goes from an 11:47pm draft (type up to 36px, pushed in), to hedges struck through, to a rewrite in her voice, to scheduled for Tue 8:40. Then the draft leaves and a viewport-sized phone takes the stage, with the X feed, a live count-up and an iOS notification.
3. **Void wall**: two rows of relatable posts that drift with scroll.
4. **Four feeds**: X, Threads, LinkedIn and Bluesky phones at true 390pt scale (`zoom`), with a light/dark toggle.
5. **The fold**: type a LinkedIn post and watch the "…more" cut.
6. **Voice** (dark): sliders rewrite an X post live.
7. **Week**: the app's own Queue calendar (`calGridHTML`, non-interactive) with a sample week; one post lands on the best slot as it scrolls in. On phones the week swipes. The demo's Schedule tab uses the same calendar and the real schedule sheet.
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
The account menu’s Appearance item picks Sky, Dark or Match my system.
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
- **Do** put one uppercase eyebrow above each homepage headline (Wispr's pattern).
- **Don't** set sentences in mono.
- **Don't** use the accent as decoration, or for more than one solid thing per screen. No colored glows.

## Brand and Voice

- **Name:** Hookworthy. **Promise:** Write posts people stop for.
- **Logo: the wordmark.** hook*worthy*: EB Garamond 500, lowercase, "hook" roman and "worthy" italic, the same move every headline makes. No symbol in the UI. Where a square is unavoidable (favicon, app icon), a roman Garamond h in cream on a harbor tile. Files: `assets/wordmark.svg` (outlined), `assets/icon.svg`, `assets/app-icon.svg` / `.png`.
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
