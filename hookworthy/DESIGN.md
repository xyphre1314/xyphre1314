---
name: Hookworthy
description: Good ideas die in bad first lines.
colors:
  vellum: "#F4F1EA"
  vellum-2: "#EEEAE1"
  paper: "#FBF9F4"
  card: "#FFFDF9"
  ink: "#2A2521"
  ink-2: "#59524B"
  ink-3: "#665F57"
  home-paper: "#FAF8F2"
  home-ink: "#221E1A"
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
  dark-bg: "#161412"
  dark-surface: "#1E1B18"
  dark-raised: "#25221F"
  dark-text-1: "#E9E2D6"
  dark-text-2: "#BFB6A9"
  dark-text-3: "#A69D90"
  dark-periwinkle: "#BCCBFF"
  accent: "#643A97"
  accent-dark: "#C8AEF3"
  lilac: "#EBE2F7"
  marker: "#EBE2F7"
  app-surface-light: "#FFFDF9"
  writing-surface-light: "#FBF9F4"
  comment-light: "#C2410C #0F766E #BE185D #1D4ED8 #4D7C0F #A16207 #0E7490 #8B5E34"
  comment-dark: "#F59E5B #2EC4B0 #F27AAE #6AA8F7 #9BD15A #F2C14E #4FC8E0 #D9A57A"
  success: "#286B46"
  warn: "#95500F"
  error: "#AE2F3A"
  state-getting-there: "#545A80"
  state-almost: "#6A3FA8"
  state-ready: "#166A59"
  state-outstanding: "#7A5800"
  state-fill-light: "#8187AE #9A6FDB #2A9C82 #B9861A"
  state-getting-there-dark: "#B3B9DD"
  state-almost-dark: "#C5ADF6"
  state-ready-dark: "#6FDCBE"
  state-outstanding-dark: "#F5D27E"
  state-fill-dark: "#9EA5CF #B699F2 #4FD1AE #F2C55C"
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

**Creative North Star: "Vellum & Plum"** (round 34; round 10 was "Cream & Blocks")

Wispr Flow's editorial calm, in plum, for people who write in public. A cream page, classic Garamond headlines split into roman and *italic* halves, a friendly sans for everything you click, and color that arrives in big confident blocks (a plum chapter, an ink chapter, one plum pricing card) instead of gradients and glows. Research basis: Wispr's own tokens (cream #FFFFEB, ink #1A1A1A, lavender #F0D7FF for actions, forest #034F46 for sections, ember #FFA946 for active states; EB Garamond 400 at 32px+, Figtree for UI; 128px section padding).

**Key Characteristics:**
- Vellum canvas (app #F4F1EA with a #FBF9F4 writing page; homepage #FAF8F2), soft warm ink (#2A2521), no pure white and no pure black.
- EB Garamond 400 only at 32px and above, roman with an italic second half. Figtree for UI and body.
- Primary actions are lilac #EADCFF with a 1.5px ink border and a 10px radius, never a solid saturated fill.
- Plum blocks (#3B1F5C) and ink (#1A1A1A) as full-bleed rounded blocks; uppercase letter-spaced eyebrows above headlines; a hand-drawn lilac squiggle instead of a highlighter.
- Platform-true posts, shown as the product working, with no demo or placeholder notes.

## Colors

### Brand: Paper & Blue (round 46, current)
Minimal, the way Notion and Linear use colour: neutral paper, white surfaces, near-black blocks and one blue for the primary action and links. Everything else is grey.

| Role | Token (historical name) | Light | Dark |
|---|---|---|---|
| App paper / surface | `--bg` / `--surface` | #F7F7F5 / #FFFFFF | #191919 / #252525 |
| Homepage paper | `.hw --c-bg` / `--c-bg-2` | #FFFFFF / #F6F5F4 | |
| Ink | `--text-1` | #1F1F1E | #EBEBEA |
| Blocks (Today hero, tour, final call, icon tile) | `--plum-900` (`--pb1`) | #191918 | #2C2C2C tile |
| Link blue (links, eyebrows, wordmark italic) | `--plum-600` (`--pl`) | #0070D6 | `--pl-d` #5EA6EC |
| Signal (squiggle, logo dot, sparks) | `--plum-400`, `--apricot` | #2383E2 | #4C9BEA |
| Fill / soft wash | `--lilac` / `--lilac-soft` | #E2EEFB / #F1F6FD | rgba(35,131,226,.16) |
| Primary button | `--cta` / `--cta-ink` / `--cta-hover` | #0075DE / #FFFFFF / #005BAB | hover #1A86E8 |

**Retired:** Ink & Ember (round 43–45: the owner found the ember harsh), Harbor & Cream revisit (round 45), cobalt CTA (round 44).

### Brand: Ink & Ember (round 43) (retired round 46)
**Promise:** the spark of being heard. People come to us scared of posting into the void; the product earns its keep the moment a post lands and someone replies.
**How color carries that:** paper and ink do the work (calm, like Wispr Flow and iA Writer; restraint like Linear). One warm signal, ember, appears only when something good happens: your hook gets sharper, Post now, a reply comes in, a post takes off. Like Arc, the one color is the personality. Purple is out: it reads as a generic AI product.
**Personality:** warm, confident, alive. **Icon:** an ink tile with a paper h and an ember dot: a notification, someone heard you.

| Role | Token (historical name) | Light | Dark |
|---|---|---|---|
| Paper | `--bg`, `.hw --c-bg` | #F4F1EA / #FAF8F2 | #161412 |
| Ink, blocks | `--plum-900` (`--pb1`) | #17140F | lifted to ~#25211D on blocks |
| Ember, signal (squiggle, sparks, ember buttons on ink) | `--plum-400`, `--apricot` | #F2592A | #FF7A4E |
| Text accent (links, eyebrows, wordmark italic) | `--plum-600` (`--pl`) | #B33F19 | `--pl-d` #FF9068 |
| Fill (highlights, selected pills) | `--lilac` (`--pa`) | #FFE7DC | |
| Soft wash | `--lilac-soft` | #FFF3EC | rgba(255,144,104,.14) |
| Almost (hook state) | `--warm-*` | #3554C2 | #AFC0FF |

**Buttons:** one primary everywhere (round 45): ember #F2592A with ink text, hover #FF6B3D, the same on paper, in dark mode and on ink blocks. Secondary stays paper with a hairline. **Rules:** ember never fills a large area; it marks a moment or the one action. No new hues without a reason a reader can name. (Round 44 tried a cobalt primary and Harbor & Cream blue; the owner kept Ink & Ember.)

### Brand color: Lilac & Plum (locked, round 12) (retired round 43)
Round 42: every brand colour now comes from the :root tokens (`--plum-900/600/400`, `--lilac`, `--lilac-soft`, `--pl-d`, and `--warm-*` for the Almost state), so a palette swap is one block. The names are historical; the values are the palette.
The owner picked Lilac & Plum from the 20-palette exploration (round 10), so the switcher is gone. The structure never changes: cream canvas, ink text, EB Garamond + Figtree, bordered pastel buttons, color arriving in big blocks. The variables stay so the brand lives in one place.

| Role | Variable | Value |
|---|---|---|
| Action pastel (primary buttons, selection) | `--pa` | #EBE2F7 lilac |
| Link on light / on dark (links, caret, switches, charts) | `--pl` / `--pl-d` | #643A97 / #C8AEF3 (round 34) |
| Blocks (story, final call, Pro card, app-icon tile) | `--pb1` `--pb3` `--ppro` | #3B1F5C deep plum |
| Ink block (voice chapter) | `--pb2` | #1A1A1A |
| Spark (rare active states) | `--psp` | #FF9F6B apricot |
| Squiggle | `--psq` | #A27BE0, drawn as SVG at load |

**Plum ramp (app, round 27).** `--plum-900` #3A1E5C (Today's write block, Pro card), `--plum-600` #6A2FA0 (links, focus, the Sharp tier), `--plum-400` #9466D6 (dark: #A887E8; squiggle, dials), `--lilac` #E8DBFF and `--lilac-soft` (selection, chips), `--apricot` #F28A55 (spark, used rarely). Every app accent comes from this ramp.

Why plum: blue belongs to X, Typefully and Buffer; plum stands apart in a creator's tab bar, reads creative rather than corporate, stays warm next to cream, and its lilac buttons keep ink text readable in dark mode. The 20-palette board is kept as history in CRITIQUE.md round 10.

### Palette: Vellum & Plum (round 34)
The owner asked for colours that feel premium, writerly and comfortable for long sessions. Five complete token sets were rendered on the Write screen in light and dark (screenshots in the round 34 notes): **Vellum & Plum** (warm vellum, soft ink, a quieter plum), **Linen & Oxblood** (linen and espresso, an oxblood accent), **Stone & Pine** (stone and green-black, a pine accent), **Graphite & Iris** (near-neutral graphite, an iris accent) and **Ink & Ember** (blue-black ink on warm paper, a burnt-orange accent). Vellum & Plum won: it keeps the brand's plum thread (so the homepage's plum blocks still belong), it is the warmest without going yellow, and its accent never collides with the states (oxblood reads as error, pine as success, ember as warning and the "Ready" teal, iris as X's blue).

| Token | Light | Dark | Body text on it |
|---|---|---|---|
| `--bg` (desk, sidebar) | #F4F1EA | #161412 | 13.4:1 / 14.3:1 |
| `--panel` (the writing page) | #FBF9F4 | #1E1B18 | 14.4:1 / 13.3:1 |
| `--surface` (cards, menus) | #FFFDF9 | #25221F | 14.9:1 / 12.3:1 |
| `--surface-2` / `-3` | #EEEAE1 / #E3DED3 | #2D2925 / #38332E | 12.6:1 / 11.2:1 |
| `--text-1` / `-2` / `-3` | #2A2521 / #59524B / #665F57 | #E9E2D6 / #BFB6A9 / #A69D90 | text-3 is 4.7:1+ on every surface |
| accent (plum) | #643A97 (7.7:1 on paper) | #C8AEF3 (8.8:1) | |
| lilac (primary fill) | #EBE2F7, ink on it 12.1:1 | same, dark ink | |
| success / warn / error | #286B46 / #95500F / #AE2F3A | #6FCF97 / #F0A458 / #FF8A8A | all 4.5:1+ |

The homepage uses the same family a step brighter: paper #FAF8F2, sunk #F0ECE3, cards #FFFDF9, ink #221E1A, secondary #524B44 / #655E56.

### Neutrals (history)
- Light: cream #FEFDF1, card #FFFFF8, sunk #F2F0E3, ink #1A1A1A / #4D4C46 / #65645C.
- **Dark (warm charcoal, round 33):** bg #151413 (sidebar), panel #1C1B19 (the writing surface), surfaces #222120 / #2A2826 / #353330, text #ECE7DC / #BDB6AA / #A09A8F, hairlines in warm white at 8.5% and 16%. Low saturation and never pure black, so long writing sessions are easy on the eyes: body text sits at 14:1 on the panel. Plum stays the accent only (links, focus, the dial, 70+ chips); the neutrals no longer lean purple. Round 27's aubergine (#141118 / #1C1820) is retired.
- **Light writing surface (round 34):** the panel is vellum #FBF9F4, a step lighter than the desk around it (#F4F1EA), with ink at 14.4:1: dark enough to read for an hour, soft enough not to glare.
- Text on colored blocks is cream at 84–100% opacity, never a fixed grey, so it reads on any block.

### Retired
Round 9's harbor blue (#0B3A66) and periwinkle as the only brand colors; round 8's cobalt, sky canvas, navy dark mode and washes.

### Semantic (app)
- **Success** #2B7A4B / dark #6FCF97, **Warn** #A0560F / #F0A458, **Error** #B3313A / #FF8A8A: state only, each passing AA on its theme.

### Hook states (round 34)
Four steps toward a line worth stopping for, coloured as an aurora that rises with the line: dusk slate, plum violet, aurora teal at the bar, gold at the top. Never red: the main audience reads red as a loss. The word always shows and the ring or bar fills with the score, so colour is never the only signal.

| State | Score | Word colour (`--tier-*`) light / dark | Fill (`--tier-*-f`) light / dark |
|---|---|---|---|
| **Getting there** | under 45 | #545A80 (6.3:1) / #B3B9DD | #8187AE / #9EA5CF |
| **Almost** | 45–69 | #6A3FA8 (6.9:1) / #C5ADF6 | #9A6FDB / #B699F2 |
| **Ready** (the bar) | 70–84 | #166A59 (6.2:1) / #6FDCBE | #2A9C82 / #4FD1AE |
| **Outstanding** | 85+ | #7A5800 (6.2:1) / #F5D27E | #B9861A / #F2C55C, with a soft gold glow |

- Every word passes 4.5:1 on the page, on cards, on the sunk surface and on its own chip tint.
- Rings draw an arc from the start colour through the middle to the state's colour at the score (`--ga`, `--gb`, `--tf`), with round ends; Outstanding runs violet → rose → gold.
- **Ink surfaces** (the Sharpen pill) use the opposite theme's words, as `--tier-*-inv`. **Today's plum card** uses fixed light steps, except inside its writing box, which is the theme's own writing page and so uses the ordinary state chip (round 35).

### Platform replicas
These are not Hookworthy colors. They exist so a replica matches the real app, and they appear only inside a post, feed or phone.
- **X**: text #0F1419 / #E7E9EA, secondary #536471 / #71767B, divider #EFF3F4 / #2F3336, media #CFD9DE, blue #1D9BF0, like #F91880, repost #00BA7C, counter warn #FFD400, over-limit #F4212E.
- **Threads**: dark #101010, username weight 600, rails at 15% ink.
- **LinkedIn**: page #F4F2EE, dark card #1B1F23, blue #0A66C2.
- **Bluesky**: secondary #405168, icons #667B99, divider #DCE2EA.

### Named Rules
**The One Accent Rule.** The accent is solid in exactly two jobs (the one main button on a screen, and on/selected states) and a soft tint in one (the highlighter under words worth stopping for). Everything else is neutral. If two solid blue things compete on one screen, one of them is wrong.
**The One Threshold Rule.** Ready is the bar (70 underneath). When a line reaches Ready, the ring turns teal, echoes outward with eight small sparks, the tint sweeps under the first line and a small sound plays. Below it, nothing celebrates, and nothing scolds.
**The Next-Step Rule.** The headline is always the one next step ("Cut “i think” to make it Ready."), never the label. A step that can be tried here (a hedge, a warm-up) is scored first, so the sentence only promises a state the line would really reach; otherwise it says "to get closer to Ready".
**The Words-Not-Numbers Rule.** People see the hook as a step (Getting there, Almost, Ready, Outstanding), never as "72" or "/100". The number stays underneath for sorting and thresholds, and it shows ("Ready · 76") only when Settings › Write › Show scores as numbers is on.
**The Replica Rule.** Platform colors never leave a platform replica, and Hookworthy colors never enter one.

## Typography

**Family:** EB Garamond (400; 500 in the wordmark), roman and italic, for display at 32px and up: homepage headlines, app page titles, plan names and prices, big numbers, quote cards. Figtree (400 body, 600 buttons, nav and badges) for everything below 32px. Geist Mono for numbers and keys, Caveat for margin notes on the homepage. Nothing else. Every face is self-hosted in `fonts/` (OFL). **Geist Fallback** is Arial with Geist's metrics (size-adjust 104.76%, ascent 95.94%, descent 28.16%), so a slow font never reflows a line.
**Replicas:** each platform's own stack (system UI for X, Threads and LinkedIn; Inter for Bluesky).

### Hierarchy
- **Display** (EB Garamond 400, clamp(48px, 6.8vw, 104px), 0.98, -0.018em): the homepage hero, always the largest line on the page. The second half is italic, one phrase gets the squiggle.
- **Headline** (EB Garamond 400, clamp(40px, 4.8–5.2vw, 72–80px), 1.02): one per chapter (story, sections, final call), roman then italic, under an uppercase Figtree eyebrow (12px, .12em). Every homepage section, FAQ included, has an eyebrow.
- **Title** (EB Garamond 400, 32–56px): app page titles, plan names, prices. Section heads below 32px are Figtree 600 19px.
- **Body** (400, 17–21px, max ~56ch): chapter intros.
- **UI** (500, 13–15px): controls, captions.
- **Hand** (Caveat 500, 20–24px, rotated 2–4°): at most two margin notes in the hero, with drawn arrows.
- **Data** (Geist Mono 500, tabular): counts, times, keys, and hook numbers only when the numbers setting is on.

### Named Rules
**The Numbers-Only Mono Rule.** Mono is for counts, times, scores and keys, never sentences.
**The No-Gradient Rule.** Text is solid. Emphasis comes from the tint or from size.
**The Tracking Rule.** Negative letter-spacing only on Garamond at 32px and up. Figtree is always 0 (uppercase eyebrows and app labels get +.1–.12em, 12px, never smaller). Body text runs at 1.5 or looser.

## Layout

The homepage uses a 1200px wrap with a clamp(16px, 4vw, 40px) gutter; from 1600px every section grows with the hero (1360px, then 1520px from 2200px) so left edges line up. It is about 10 screens at 1440 and 12 at 390. Every rule is scoped under `.hw27`.

1. **Hero**: "Good ideas die / in *bad first lines.*" (two lines at every width: each line is nowrap and the size is capped by the column with a container query, about 16.4cqi, since the longer line is 5.9em of Garamond; from 1280px the copy column is 1.12fr. The squiggle sits under "bad first lines." only and never touches the sub) with one sub ("Hookworthy scores your first line as you type, cuts the soft words, and schedules the post for when your people are up."), one primary (Start free) and one ghost link (Look around the app). Sharpen inside the grader is a quiet secondary (card with a hairline, lilac on hover) so the hero has one primary. The visual is a live grader: soft words get a wavy underline with the reason, a dial scores the line, and **Sharpen** shows an honest rewrite as a word diff with the real change ("Almost → Ready"). The line under the dial is the next step. **Keep it** crossfades the dial's word and sweeps its colour; reaching Ready lifts a few sparks. After you type, the nav CTA reads "Open your line" with the line's tier chip. From 1100px the hero fills most of the first screen with both halves centred on each other; the measure grows to 1360px at 1600px and 1520px at 2200px, and the grader card scales with it.
2. **The problem**: one row of void posts that drifts with scroll (no lagging transition; cards min(330px, 100vw − 48px) on phones).
3. **How it works** (round 35: the plum chapter; the round-27 Priya story folded into it, since both told the same post): full-bleed plum, "From an 11 PM thought *to Tuesday morning.*", "One post, start to finish. The claim stays yours. Only the soft words go." Then the in-page player (round 30) built from the app's own pieces (the dial, soft-word marks, the Sharpen diff and its tier change, the schedule sheet, a queue card landing in the week, J/K replies). Five beats, about 21 seconds, looping. It plays only while on screen and the tab is visible, has a visible pause button, and the step list on the left (a row of bars below 1000px, cream on plum) jumps to any step. Under reduced motion it never plays: each step shows its finished frame.
4. **Built around the hook**: a bento in two 7/5 rows. Each card is a label, one short line and one visual, with no paragraph: Hook score ("Five checks. One next step to Ready.": a Your draft / Sharpened switch, the dial with its word, and the five checks as pips; it flips by itself while on screen until you pick one or hover), Your voice (Tone and Polish sliders that re-say one sample line), What's working (one post, three tags, the formula, **Use this pattern**), and Reply radar (a breakout alert and one post with your drafted reply). Below 760px the cards swipe sideways.
   **Sticky call** (round 30): a small pill at the bottom right on desktop, the 56px bar on phones. It steps aside whenever a link, button or field is under it, and comes back once the spot is clear. **One primary per view (round 35):** while the hero's Start free, the pill or the final call is on screen, the nav's Start free goes quiet (transparent with a hairline); on the other light pages the same happens while the page's own primary is visible. After you type, "Open the app" leaves the nav so "Open your line" never wraps; on phones the nav button hides while the pill shows, and the pill drops the quote so the button fills it.
5. **Previews**: one phone with X / Threads / LinkedIn / Bluesky tabs. LinkedIn shows the fold check.
6. **Scheduling**: the app's own calendar (`calGridHTML`) showing the next seven days from today (`homeWeekAhead()`), with posts only in slots still ahead; past slots are grey and never carry a best-time dot. Times in the visitor's time zone.
7. **Who it's for**: Crypto & trading first, then Founders, Creators, Ghostwriters. Each shows first lines before and after, with their real tier chips.
8. **Switching & trust** ("Everything comes in. *Nothing goes out without you.*"): three pictures, one line each. The import (Typefully, X archive and CSV dropping into Your posts, "Read in your browser"), the five checks as pips with the four-step journey bar under them, filled to the line's score (real hookScore results), and a browser window with two drafts and a plum lock ("Nothing scheduled · nothing posts"). **Pricing** ("Start free. *Size up when it’s working.*", "Scores, checks, Sharpen and Basic mode are free on every plan. Credits pay for Claude: 10 a day on Free, 1,000 a month on Pro, 4,000 shared on Studio.", Free trimmed to three items on the home card; on the light pages the Pro button is **Try Pro free for 7 days** with "or start with Pro" under it), **FAQ** (five questions).
9. **Final call**: a deep plum block with cream text: "Paste the post you almost wrote" over a cream card. Type and a big aurora ring names the line's state in Garamond, five pips show the checks and the next step sits underneath; "Or try a rough one" fills in an example. One lilac button ("Open it in Hookworthy") carries the line in with `carryLine()`, then "Free. Your line comes with you."
10. **Footer** (every light-world page): "End of the page. *Start of the post.*" with a Start free link, four link columns (Product, Free tools, App, Legal), the wordmark at full width, then © · the promise · Back to top. Privacy and Terms live on `#legal`, in plain words.

The header and footer sit outside `<main id="main">`; there is no announcement bar (round 35: it pointed into the app before the hero's own call). Reveals run 600ms at most and never blur large cards. Phone length is about 11 screens at 390.

**Soft words** on the light pages get a warm amber wavy line (#B4620F on a 9% tint), never red: the main audience reads red as a loss. **#teams** opens on the words and the Write as menu side by side. **SEO:** the home title is "Hookworthy: first lines worth stopping for", with a canonical link, Open Graph and Twitter tags, and `assets/og.png` (1200×630, rendered from the hero).

The app keeps its 232px sidebar and inset main panel. The composer's "In the feed" panel renders your draft with the same platform components, between two real neighbour posts, in the app's theme.

## Elevation & Depth

Real-world depth only: phone frames with a machined edge, cards with a 1px hairline and a long soft drop (`0 16px 30px -24px rgba(0,0,0,.35)`), and 3D perspective in the ring. No glows and no glass. There are three exceptions: the iOS notification, which copies iOS's own material, the Outstanding state, whose soft gold glow is the reward for the top step, and the generating aurora (below), which exists only while Claude is writing.

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
There is one primary button style everywhere: lilac with a 1.5px ink edge (the hero's is 52px tall, the same colour). On a plum block the same lilac button reads as the CTA. The ghost button has a play glyph in a circle. In the app, the primary is ink with a 10px radius and a spring press.

### Character ring (composer)
It follows X, but stays hidden until you're near the limit: it appears at 20 remaining, turns to warning then error, shows the count, and hides the circle at 10 over.

### Improve panel (round 27)
One panel beside the post, with three tabs: **Score** (the next step as the headline, why underneath, the four-step journey bar filled to the score, and the five checks as pips under "How it's read"), **Takes** (Punchier, Shorter, Hook, then More angles), and **Formulas**. The hook dial sits in the first post's gutter: an aurora ring that fills with the score, no icon, and the state's word under it (two lines for "Getting there"). Voice match is a single line under the post ("Sounds 82% like you"). A rewrite that adds a number you didn't write gets flagged before you keep it.

### Sharpen (selection rewrite)
Select three or more characters in a post and an ink pill appears above where the selection starts. It offers Punchier, Shorter, Clearer, Bolder and More human (⌥1–5), plus Custom… for a note. Picking one previews the first of up to three versions in place on a marker-soft background. You flip versions with ‹ › or the arrow keys, keep with ↵ (the accent Keep button), and cancel with Esc. Sharpen is free and unlimited, because it only touches the words you chose.
- **One engine, one set of checks** (`HWCore.SHARPEN` in core.js). The selection snaps to whole words; sentence moves (a question, a split, a reorder) only run on sentences selected whole; the seams are fitted (spacing, casing, end punctuation, a/an, no word repeated across the join). Every version, Basic or Claude, must change something real, keep every number, ticker, name and "not", add no number, hype word, emoji or AI tell, do what its option says, keep the hook score on a first line, and differ from the other versions.
- **Claude** writes the versions when it's on, from a prompt that asks for the selected words only. Quotes, labels, numbered lists, explanations and words echoed from around the selection are stripped; anything that still fails the checks is dropped, and Basic versions stand in (the pill says "· Basic").
- **Nothing passes?** An honest note says what was checked and what's already working ("Nothing hedged to firm up in “…”. What’s working: a real number (40%), no hedges, 8 words."). Never "already good". A one- or two-word selection offers **Whole sentence**. Three or more words with nothing to change on their own widen to their sentence, and the pill says "· sentence".
- **Motion** (all under 400ms, transform and opacity, typing cuts it short): while Claude writes, the chosen words pulse left to right under a moving aurora tint, the pill's edge shimmers (a turning conic gradient behind an opaque face) and it breathes three dots. When a version lands, words that go strike through and fade (110ms), then new words resolve from a 4px blur one after another under a lilac tint that settles. Flipping versions crossfades the words and slides the count. When the hook changes, the pill says how: "Almost → Ready" with the new word rising in, or "Stronger" / "A bit softer" within a state. Keep lands a plum ring where the words end. The gutter dial either crossfades to its new word as its colour sweeps, or says "Stronger" for a moment as the ring grows. The swap sound plays. Reduced motion: an instant swap with the plain highlight.
- **Improve › Rewrites** uses the same checks and motion: changes resolve in left to right, the header says "Hook Almost → Ready" (or "Stronger") with the new word rising in, the card rises once without blur and doesn't rise again when you flip versions.
- **Generating (round 34).** While Claude writes three rewrites, the card's 1.5px edge is a slowly turning aurora (violet, slate, teal, rose, gold; a rotated conic gradient behind an opaque face, so only `transform` moves), your own words wait faint inside it with a soft light passing through them word by word (`opacity` and `background-position` only), and three short lines take turns in the header ("Reading your line…", "Writing three in your voice…", "Keeping your facts…"). It all stops the moment versions land, because the card is replaced. Reduced motion: nothing travels; the edge breathes slowly and the words sit at half strength.

### Hook score: steps toward ready (round 34; round 32 was Flat · Warming · Sharp · Honed)
The 0–100 heuristic in `HWCore.hookScore` is unchanged. The owner found "Flat" deflating, so the score now reads as momentum: every state is a step toward ready, never a verdict on the person. The words were picked from 98,787 generated sets, curated to ten, then three (shortlist in the round 34 notes).

| Word | Score | Colour |
|---|---|---|
| **Getting there** | under 45 | dusk slate |
| **Almost** | 45–69 | plum violet |
| **Ready** | 70–84 (the bar) | aurora teal |
| **Outstanding** | 85+ | gold, with a soft glow |

- **Core:** `HWCore.hookTier(score)`, `HWCore.hookMove(a, b)`, `HWCore.hookNext(text, h)` and `HWCore.partState(v)`. `hookScore()` also returns `tier`, `step` (the one next move: "Cut “i think”"), `why` ("It softens the claim.") and `fix` (the line without the hedge or warm-up, so `hookNext` can score it).
- **UI helpers** (index.html): `tierChip()` (a small aurora ring and the word; `noun` adds "Hook:" for screen readers only), `ringHTML()` (the big progress ring with round ends and a teal tick where Ready starts), `tierScaleHTML()` (the journey bar: four equal steps, each filled by how far the score is through it), `tierMoveHTML()` / `tierSay()`, `hookNext()`, `partsHTML()`, `dialTier()` / `dialMove()`, `bigScore()`, `readyBurst()`.
- **The five checks** (Clear, Open loop, Specific, Tension, Short) are pips: filled teal with "Yes" (70+), half violet with "Some" (45–69), an empty slate ring with "Not yet".
- **Changes:** up a state, "Almost → Ready" (the earlier word in neutral grey, no strike-through); within a state, "Stronger" (3+) or "A bit softer"; a point or two is "About the same". Reaching Ready: ring echo, eight sparks, the tint under the first line, the hook sound. Reduced motion: an instant swap.
- **Copy:** the next step leads ("Cut “i think” to make it Ready.", "Add a number or a name to get closer to Ready.", "Ready to post. For Outstanding: leave one question open.", "Ready to post. This one stands out."). Reason strings never mention numbers.
- **Settings › Write › Show scores as numbers** (off by default) appends the number: "Ready · 76", "Almost → Ready 61 → 76", "Yes · 82".
- **Honest by design:** the words grade the words on the page. Insights compares "Ready or better vs Getting there" on your own posts.

### Visuals
The spark-image tool opens four kinds of visual, each rendered to canvas in-browser:
- **Quote card:** your line on Paper, Ink (navy) or Tint, set in Instrument Serif with the first line on a sky band.
- **Before / after:** a chart parsed from "21% → 38%" or "from X to Y" in your post.
- **Post screenshot:** an X-style card for cross-posting.
- **Frame a screenshot:** drop an image and get padding, a radius and a shadow.

Each comes in 16:9, 1:1 or 4:5, and is added as an image with alt text.

### Primary audience
The homepage (round 41) speaks to creators who write and grow on X: a creator line in the hero grader, creator examples in every demo, and Creators first in Who it’s for, with Markets as one tab. Inside the app, market writers keep their first-class support: the default niche in onboarding, the trader demo persona (Sam Okafor, @samtrades), market events and a stale-price guard in the queue, and What’s working defaulting to trading. Every niche gets the same craft.

### The Room (round 44)
The AI is a team, not a tool: **the Room**, six AI agents who pitch first lines and fight for the best one. Mo, the Straight Shooter; Rex, the Contrarian; Juno, the Storyteller; Ace, the Numbers Nerd; Kit, the Teaser; Sol, the Minimalist. Copy says "the Room writes it", not "Claude writes it"; Claude stays named where it's a fact (connections, privacy, the server). The unit of work is a **pitch** (10 a day on Free, 1,000 a month on Pro, 4,000 on Studio).
**Hook tournament:** all six write at once, three round-one face-offs, a semifinal (the top seed waits), then a final the Room calls (round 45: no choice for the author, just the best line, Use this line or Keep mine). Rounds are decided by the hook checks plus the author's own history. Without the Room online, each agent's rule runs locally and the log says so.

### Demo account (round 44)
Every demo, mockup and empty state is **heycape (@heycape_)** with his own picture (`assets/people/you.jpg`), never "You", "Your draft" or "@yourhandle". Other people in feeds are the cast in `PEOPLE`.

### One primary button (round 44)
Post now, Start free, Try Pro and Open it all use `--cta` / `--cta-ink` / `--cta-hover`, identical on paper, in dark mode and on ink blocks. Round 45: the primary is ember (`--cta` #F2592A, ink text); nothing else is filled with it.

### Round 48: logo
- **Mark:** a lowercase h whose right leg drops and curls up into a hook: the h of hookworthy and the hook in one stroke. White, round-capped, on a blue (#0075DE) tile with 8/32 corners. Same drawing for the favicon, app icon, sidebar and the breakout alert.
- **Wordmark:** hook**worthy** in Figtree 800, tight (-0.045em), "worthy" in grey: the same two-tone move as every heading. EB Garamond is no longer used anywhere.
- Explored and passed over: a line with a hook hanging from it (read as a J), a caret hook, a hook in a speech bubble, a stop-the-scroll feed, a quote-mark hook.

### Round 48: QA sweep (site and app, light and dark, desktop and phone)
Fixed: field errors line up with the text you type; the phone composer drops the score word beside the post; pages behind a modal no longer scroll; modal footers line up with their bodies; fields and buttons in a row share a height; Tools stacks to one column on phones; the final call carries your hero line before checking it; pricing buttons line up across cards; "Who it's for" tabs no longer move the page; eyebrows, card labels and the affiliate heading follow the grey rule; every site button is a pill; no cream or ember left in text or fields; code blocks use Geist Mono; onboarding errors reserve their space and turn the field red; an empty handle shows no made-up name ("Up late.", "You", "Add your handle in Settings"); the import sheet no longer borrows the Improve panel's padding and its tabs scroll on phones; the design-system page describes the current brand.

### Round 47: one system
- **Type:** Figtree everywhere: bold, tight headings (700, -0.035em); the second half of a heading is the same weight in a quieter grey, not a serif italic. EB Garamond survives only in the wordmark. Generated images (thumbnails, quote cards, carousels) use the same Figtree bold.
- **Scale:** site page titles clamp(42–68px), section heads clamp(32–52px), app page titles clamp(30–40px).
- **Buttons:** pills on the site, 10px rounded rectangles in the app. **Eyebrows:** grey, 12px, letter-spaced, everywhere.
- **Copy:** every header says what it does for you. Features: "Turn rough ideas into posts people read"; Sharpen, Your voice, What's working, Replies & alerts each lead with the outcome.
- **Plans:** AI usage is Lite (Free), Power (Pro, 3× Free) and Max (Studio, 13× Free). Plan features read as benefits ("AI rewrites that sound like you", "Replies drafted for you, ready to send").

### Round 46
- **Hook score:** signal bars everywhere a score is small (chips, lists, the composer gutter, homepage dials): one bar per step. The composer's panel is a checklist: five checks that tick as you fix them, the next one highlighted with a **Fix it** button, and the header naming the step ("Almost there · 1 of 5").
- **Less hook talk:** the homepage leads with outcomes (posts that take off, polish, voice, ideas, replies); the hook is one tool among them.
- **AI usage, not pitches:** plans are Standard, Higher and Highest usage. The meter shows a share left, never a count. Bigger jobs are marked "Bigger job" on the button.
- **Rollover:** only the first month's leftovers carry into the second month; after that each month starts at the plan amount.
- **Sharpen waits:** the pill appears only after a selection sits still for 1.8s. Alt+1–5 still works at once.
- **Recently deleted:** deleted drafts wait 7 days (Drafts switcher footer, command palette) with Restore.
- **Earn with Hookworthy:** 30% of every payment for 12 months from people you bring; your link, three steps, honest stats. In the account menu, the palette, the footer (#earn) and a homepage band.
- **Flows, simpler (round 46 audit):** editing a scheduled post keeps it scheduled until **Save changes** swaps it in place; a saved idea opens as one post (tags stripped) with "Outline as thread" one tap away, and the whole row is tappable; Mark as posted copies the text for you; Improve opens on the checklist while the first line isn't Ready; the schedule sheet only suggests lines that move up a step; an empty handle in onboarding just continues; Replies hides the empty "your posts" section; Move to… sits right after Edit; the Write toolbar never pushes Post now under the preview.
- **Thumbnails:** Make a visual › Thumbnail, or "Make a thumbnail" in the post's tools. Your profile photo or a photo you drop in, a bold title from your first line with one word marked (a number if there is one). Three layouts (Face, Cover with a soft blur behind the title, Split), three palettes, three sizes. Add to post or Download.

### Round 45: simpler homepage, one-answer tournament, quieter generating
- **Hero:** one centred sentence in Figtree 700, "Where [creator] creators and teams [team] write posts [platform] that land", with live tiles inside it (a creator photo, a team of four, the X/Threads/LinkedIn/Bluesky icon) that take turns every 2.6s while on screen. Two buttons: Start free (the one ember primary) and See plans (a soft grey pill). No stats.
- **Try it:** the live grader sits centred right under the hero.
- **Cut:** the problem row, Ideas, Previews, Scheduling and Trust sections. The page is now Hero, Try it, How it works, Features, Who it's for, Plans + FAQ, Final call.
- **Hook tournament:** the Room calls the final. The author sees one best line with Use this line or Keep mine, never a choice between two.
- **Generating:** one ember light travels the card's edge; the draft goes soft under a moving sheen (no per-word boxes); the result clears in from a blur, then its changes mark themselves left to right.

### Homepage voice (round 42)
Section heads are two short beats. A head rhymes only where the rhyme lands on its own (“Good ideas die in bad first lines.” “Nail the first line. The rest falls in line.” “Never stuck on what to say. Fresh ideas every day.”). Where a plain line says more, it stays plain (“Everything comes in. Nothing goes out without you.” “Paste the post you almost wrote.”). Usefulness comes first, then rhythm, then rhyme. Ledes stay plain. Under each head sit the section’s inner features (chips that point at cards, or a row of small feature tiles), so the hierarchy reads eyebrow → head → lede → features → demo.

### Homepage motion (round 41)
Section heads arm below the fold: the eyebrow, then the headline rising out of a light blur, then the lede, about 70 ms apart. Feature chips and tiles stagger in at 45–60 ms. Ideas on tap advances by itself every 5.2 s while it’s on screen, pauses on hover or focus, and stops for good once a tab is picked. Panels crossfade in place (the stage keeps its tallest panel’s height, so nothing jumps). Presses scale to .96–.98. Hover lifts only on fine pointers. Reduced motion keeps every state and drops the movement.

### What’s working (Ideas tab, formerly Niche radar)
Choose a niche, then:
- **Trends:** three trends, with the one you're early on outlined in ink and given a "Post on it first" button.
- **Popped posts:** real-looking posts from accounts in your niche, each with three reasons it spread (early, hook, relatable, timing, format, proof) and the structure written out with placeholders marked.
- **Use this pattern:** loads that formula into the composer with the popped post's own words filled in and marked, so you can see what goes where; Tab jumps from one to the next (round 34). Parts the post doesn't reveal stay [blanks].

The accounts are labelled Sample until live search is connected.

### Sound
Sounds are synthesized in Web Audio and never samples. Each is under 350 ms and very quiet:
- **tick:** toggles and tabs.
- **tap:** primary actions.
- **hook:** a rising two-note cue when the first line reaches Sharp.
- **swap:** a rewrite or take is kept.
- **done:** a four-note arpeggio when a post is scheduled or published.

Sounds are on by default in the app and can be switched off in the account menu. On the homepage they're off until you ask for them.

### App shell
- **Sidebar:** logo, a New post pill, Search (⌘K / Ctrl K), then Today, Write, Ideas, Replies, Queue and Insights. Your five most recently touched drafts sit below (the time shows on hover, a clock when one is meant for a time), and the account button (which also switches client voices) is at the bottom. The “Drafts N” header opens the drafts switcher. There are no section headers.
- **Drafts, one tap away at every width (round 34):** one switcher, opened from Write's top bar (“Drafts N ▾”, just the icon and count when the bar is narrow), the sidebar's Drafts header or “All drafts”, a Drafts button with a count on the 64px icon rail (761–1180px, where the list can't fit), More › Drafts on phones, ⌘O / Ctrl+O from anywhere in the app (even mid-sentence), G D, or ⌘K (drafts are searchable there too). It's a popover beside its button, and a bottom sheet with a scrim on phones. Search looks through every post of every draft. The draft you're writing sits on top (“Writing now”, or “In Write” from another page), then the rest, most recently touched first. Each row: the first line, platform icons, how long ago, the post count for threads, and one state chip (“For Tue, Oct 7 · 8:40 AM” when it's meant for a time, “Time passed”, “Has blanks”). The footer counts what's scheduled (a link to Queue) and offers Tidy up. Keys: ↑ ↓ move, ↵ opens, ⌘⌫ / Ctrl+Backspace deletes (with Undo), Esc goes back to where you were. A draft remembers its platforms and comes back with them.
- **Composer top bar (round 33):** status, a “N things to check” pill, an “N comments” pill once people comment, then Post to, Focus, Preview, **Share**, ··· , **Schedule** (a plain secondary button) and **Post now** (the one primary). Writing as a client with approvals, the two become one primary: “Send to <client> for approval”. The bar sizes itself to the editor column (a container query): with the preview open, Share and Preview drop their labels first, then the save word (the dot stays, and screen readers still hear it), then Schedule (round 35: so Schedule keeps its label at 1280); on phones Share moves into ··· and Schedule is an icon. Shortcuts: Post now ⌘⇧↵ / Ctrl+Shift+Enter, Schedule ⌘↵ / Ctrl+Enter, shown in each tooltip. The preview panel has its own **Hide** button top right, and ⌘\\ works from inside the editor.
- **··· menu:** X format, Share for review, LinkedIn carousel (3+ posts), Copy thread text. Posting is never in it; the soonest free time (“Next open”) is one of the times in the Schedule sheet.
- **Navigation:** the daily loop only (**Today**, Write, Ideas, **Replies**, Queue, Insights). Hooks and Your voice live in ⌘K, G H / G V and the account menu. On phones the tab bar is Today, Replies, + (hold to capture an idea), Queue, More.
- **Today** (round 34) opens on a composer, because most people come here to post. A plum card holds the box (“What’s worth saying today?”), the live hook word and reason as you type, **Post now**, **Schedule** and **Open in Write** (⌘⇧↵ / ⌘↵ work in the box), the next good time, and “Need a start?” with one post idea (examples marked). Both buttons hand the words to Write and run there, so every check still applies. A live post or a missed one still gets its own card above it. Below: one smart suggestion (a rerun, your strongest kind, the weekly goal, or your oldest saved idea), then Your queue (today and tomorrow, open best times included), Replies (waiting on your posts, plus two fresh posts) and Your last post. The greeting's name follows the connected account (first name, else the handle); double-click it, or focus it and press Enter, to change it. Enter or leaving saves, Esc cancels, and the toast's Undo (or ⌘Z) puts it back.
- **Replies** is a triage list. One card is open and the rest are compact. J / K move, S skips, ⌘↵ (Ctrl+Enter on a PC) replies. The verb is always "Reply".
- **Keyboard hints** follow the computer: ⌘ ⌥ ⇧ ↵ on a Mac, Ctrl Alt Shift Enter on a PC. They are hidden on touch.
- **Ideas:** a capture box, then three tabs that say what they are: **Post ideas**, **What’s working** (why posts in your niche popped, sample data until real search backs it) and **Saved** (links, posts, notes, screenshots and voice memos you parked). Round 34: a link anywhere in the box becomes a preview card while you type: an X post reads as a small post (author, handle, the words when the server can fetch them), anything else as a page card (picture, site, title, description). The address alone gives the platform, the handle and a title from the slug; with Hookworthy's server, `/api/unfurl` adds Open Graph details and an X post's words. Each link card offers **Write about it** (the link goes in post 2), **Quote it** and **Reply to it** (X posts), **Five angles** and **Save**. Text typed with the link is your note; #tags sort ideas. Saved has filters by kind, tag chips, search and Newest/Oldest first.
- **Hook formulas** are no longer a tab. When your first line is under Sharp, the hook panel offers three formulas; picking one adds it above your line with the first blank selected. The full library stays reachable from ⌘K.
- **Filled examples (round 34).** A formula or post idea never shows a bare [blank] when an honest example fits: “**5** things I wish I knew about **trading** before I started”, with each example marked (a lilac tint and a plum underline, `mark.fill`). Blanks only the writer knows ([what happened]) stay dashed blanks. In Write the examples stay marked (`.fillv` in the mirror, no padding so metrics hold), the first one is selected, and Tab / Shift+Tab move between them; typing over one unmarks it. A [blank] still never posts. An example left as it came gets one question at Post now or Schedule (“Is 5 your number?”), with Change it / Yes, keep it. Examples come from `fillValue()` (a trading set and a general set, plus the niche's topic).
- **Insights (round 34)** reads top to bottom: the week card, what works for you (the hero), stat chips for the range, what works by kind and when posts land, engagement per day, habit cards, your hook score tuned to you, Top posts, **Didn’t land**, then Your posts. The week card (Sunday note on Sundays) shows the week's best post as a real X post with its numbers, a seven-bar chart, up to three takeaways with icons drawn from the post itself (× your usual, a number in line one, your strongest kind or its hook word, when it went out) and one next step (Write another like it, Plan next week or Write the next one). Claude's note, when written, supplies the headline, “Why it worked”, “Try next week” and Monday's first line.
- **Only posts with numbers rank.** A post with no likes, reposts, replies or views (a draft, a deleted post, a CSV with no number columns) still teaches your voice but never ranks as a top post or a miss; Insights says how many there are. Imports drop Typefully drafts and scheduled posts, CSV rows whose status isn't posted, and X's deleted-tweets.js. **Didn’t land** lists up to three posts under half your usual, at least two days old, once eight or more posts have numbers, each with Why? and **Try again** (same post, a new first line).

### Claude credits (round 34)
Free and paid differ in Claude, never in the basics. The table and the refill rules live in `core.js` (`HWCore.CREDITS`), so the app, the server and the tests price things the same way.
- **Allowance:** Free gets 10 a day, back at local midnight. Pro gets 1,000 a month and Studio 4,000, shared by every voice. Both refill on the day you joined, and unused credits roll over up to one extra month. The 7-day Pro trial gives 250, once, with no card, and goes back to Free by itself. Basic mode and Sharpen are free and unlimited on every plan.
- **Prices:** a rewrite or a rewrite with a note is 1 (2 over 1,000 characters). Three stronger first lines, post ideas, Why?, the weekly note, compare and a batch of reply drafts are 1 each. Reading a brief is 1 and writing from one is 2, with +1 for each PDF. A picture is 2, patterns from accounts you learn from 2, Plan my week 3 and Learn my voice 5. Visual pick, tidying a dictation and setup are free. Every `ask()` names its `act`. A call is refused before anything is sent when there aren't enough credits, and a credit is used only when Claude answers.
- **Meter:** a card above the account button shows the plan word (Credits on Free), the count, a bar (ten pips on Free) and when credits come back ("Back at midnight", "Refills Nov 4", "6 days left"). On paid plans it reads **Plenty left**, with no count, until under a quarter remains. At 80% used it turns honey. In the rail it's the number over the bar, and on phones it's the **Plans & credits** item in More, with "7 left" as the hint.
- **Cost on the button:** a small mono count (`crTag`) after the label. It shows only while the count matters (`html[data-meter="count"]`), so a Pro user with plenty never sees prices. Improve › Rewrites ends with one line: "Each rewrite uses 1 credit · 7 left today."
- **Upgrade moments:** at about 80% used, one toast per refill period with a See plans action. When credits run out mid-flow, a sheet shows the real Basic version, ready to keep (**Use the Basic version**), beside "Claude, in your voice": a blurred placeholder, what Claude would do and its price. The buttons are **Try Pro free for 7 days** / **Upgrade to Pro**, which finish that exact action with Claude right away, and **Not now**. The sheet shows once per action per session; after that, Basic runs with a short toast. On Free, reply radar doesn't draft in the background. Each card offers **Draft in my voice** instead.
- **Never:** countdowns, a card for the trial, a blocked screen, or a blurred "result" that doesn't exist.

### Honest states (round 28)
- **Practice mode.** With no account connected, nothing posts from Hookworthy. **Post now** still works in one click: the first time, a small sheet offers **Open in X** (x.com's own compose box, prefilled with post 1; for a thread, “Copy the rest” puts posts 2+ on the clipboard), **Mark as posted**, and **Connect X to post from here**. Post now remembers the pick (change it in Settings, or with **Other ways** on the undo bar). Open in X also files the post as Marked, with the same 8-second undo. LinkedIn-only drafts use LinkedIn's share box the same way. The card reads **Marked**, never Live, and can go back to drafts. Connections opens with a practice-mode note. When Threads, Bluesky or LinkedIn are ticked too, the sheet adds one line, “Also going to …”, with an Open link for each compose box (round 35); nothing opens until you press it.
- **No predictions.** Your own post never shows predicted likes or views (preview, Today). Sample numbers appear only on seeded demo posts, labelled Sample.
- **Queue card status.** Sent, Sending…, Marked, Post by hand and didn't go out. On narrow cards (≤124px) the time hides, since the row says it, and the status becomes a 6px dot before the title (success, text-3, warn, error).

### Share & review (round 33)
Modelled on Typefully's Share popover. **Share** (top bar, or ··· › Share for review) opens a popover: a **Public link** switch (“Anyone with the link can view and comment”), **View** and **Copy link** (enabled while public), an **Internal link** row (“Only you can open it”: the draft in Write, in this browser), and “Or let friends vote on your first line” (Hook vote).
- **Review page:** the draft as it'll look, read-only, in the X post card with the thread rail. Select words for a **Comment** button, or press a post (“Comment on post 2”) or a picture. Comments sit in a right rail beside their highlight (a bottom sheet with a count below 1000px), each with name, colour dot, time, the quoted words, replies, Reply and **Resolve** / Reopen. The reviewer's name is asked once and remembered in that browser.
- **Colours:** each commenter gets one of eight (`--cm-0`…`--cm-7`, a light and a dark family) in order of their first comment, so everyone sees the same person in the same colour. Highlights are a tint of that colour with a 2px underline; dots pass 4.5:1 on the writing surface and text stays 7:1+ over tints.
- **In Write:** the same highlights sit under the live draft. The comments pill opens a panel (a sheet on phones) with open threads in reading order, Resolved (N) folded below, Reply, Resolve and jump-to-words. Anchors follow edits while the quoted words still exist; when they don't, the card says “on text that changed”. While the link is on, the shared copy follows the draft a few seconds after you stop typing.
- **Where it lives:** your Hookworthy server (`/api/review`, with comment and resolve endpoints; switching the link off makes it read as gone), or a published claude.ai page (each person's comments in their own `notes/<id>` document, ids only, names resolved on screen), or, with neither, this browser only, said plainly in the popover.

### Ghostwriting (round 28)
Each voice (you plus up to eight clients) keeps its own drafts, counts, default platforms and half-written post. Add, edit or remove a client from the account menu's "Write as" section or ⌘K. Writing as a client, Schedule reads "Send to <Client> for approval", and cards wait with a readable **To approve** tag.

### Keyboard (round 28)
- **Schedule sheet:** the times are a roving radiogroup; ↵ on a time or ⌘↵ anywhere schedules.
- **Replies:** J/K/S and ⌘↵ keep focus in the reply box; Alt+J/K move from inside it; Esc goes to the card.
- **Toasts:** Alt+T jumps to the newest one.
- **Improve:** Esc closes the panel.
- Hints follow the platform (⌘ ⌥ ↵ on a Mac, Ctrl Alt Enter on a PC) and hide on touch.

### Link cards (round 34)
A post with a link shows the card each platform would draw, under that post in the composer and in every preview. The card comes from the last link in the post, and only when the post has no pictures or poll (as on X).
- **Composer:** a compact card on Hookworthy's own surfaces: the picture (or a plain block with the site's mark), the domain, the title in two lines, one line of description, and × to take it off. An X post link becomes a quoted post (author and words), a YouTube link a video card with its thumbnail and title.
- **Previews:** X draws a large image with the headline on it and “From site” under it, a small square card when there's no image, and a quote card for an X post (the quoted post's link leaves the text, as on X). Threads puts the site and title under the image, LinkedIn a thumbnail beside the title, Bluesky the title, two lines of description and the site under a hairline. Links in the text print short and in the platform's link colour.
- **Where cards come from:** the Hookworthy server's `GET /api/unfurl` reads the page's Open Graph / Twitter-card tags (oEmbed for YouTube and X posts) behind SSRF guards, and sends the image as a data URL so it shows under CSP. With no server (the published app), the card is read from the link itself: the domain, a title from the path, the site's kind (X post or profile, YouTube, GitHub repo, known sites), and a plain block where the picture would go. Never a made-up image.
- **×** records that this post shouldn't show a card (`nocard`, tied to that link: a new link gets a card again). The post then says so in one line with **Show card**, and is honest about X: “X makes its own, so it may still show one.” Without X: “Where you paste it, remove the preview there too.”
- Counting doesn't change: X still counts each link as 23, and the link-in-the-first-post check still runs.

### Before you post (checks)
The small stuff people only notice once it’s live, checked on every keystroke and shown in the schedule sheet and the top-bar pill: leftover blanks ([brackets], TK, TODO), a link in the first post on X or LinkedIn (fix: move it to a reply), a word used three times, more than two hashtags, images without a description (fix: describe it), thread numbering that doesn’t match (fix: renumber), a thread ending on a colon or ellipsis, a post starting with @ on X, a first line that repeats something already queued, double spaces (fix: tidy up), and a quoted BTC/ETH/SOL price that has moved more than 3% (fix: update the price). The schedule sheet also checks the hook: below upper Almost (60 underneath) it offers your own line tightened, then two formulas. Checks never block posting.

### Focus mode
⌘. (or the target button) hides the sidebar, preview and chrome, centers the editor and keeps the line you’re on at eye height (typewriter scrolling). Esc or ⌘. brings everything back. Desktop only.

### Appearance (round 34)
A three-way switch, **Light · Dark · Auto**, sits in the sidebar footer above the account button (icon and word; on the 64px rail only the current one shows and pressing it moves to the next). On phones the More sheet lists the three with a check. **⇧T** walks Light → Dark → Auto anywhere, the command bar has it too, and Settings › Theme mirrors it. The choice is remembered. The swap is a 380ms crossfade (a view transition), instant with reduced motion. Brand colour is fixed (Vellum & Plum).
- **Post tools:** image, GIF, visual, poll | Rewrite … hook chip, character ring.

## Do's and Don'ts

### Do:
- **Do** render every post as its platform does, with a portrait, name, handle, time and counts.
- **Do** show the product as it works. No "demo", "placeholder", "preview" or "the creators are fictional" notes (round 30). Keep the honest states the released product has too: Sample data on an empty account, practice mode with no account connected, self-hosting notes.
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

- **Name:** Hookworthy. **Promise:** Good ideas die in bad first lines.
- **Logo: the wordmark.** hook*worthy*: EB Garamond 500, lowercase, "hook" roman and "worthy" italic, the same move every headline makes. No symbol in the UI. Where a square is unavoidable (favicon, app icon), a roman Garamond h in cream on a harbor tile. Files: `assets/wordmark.svg` (outlined), `assets/icon.svg`, `assets/app-icon.svg` / `.png`.
- **Glossary (say it this way):**

  | Say | Don't say |
  |---|---|
  | **Hook** (the first line), **Hook score** (the feature); the four steps **Getting there**, **Almost**, **Ready**, **Outstanding**; **the next step to Ready** (the bar); **Stronger** / **A bit softer** (a change within a step) | grade (as a noun); "Hook 72", "/100", "70 is the bar"; Flat, Warming, Sharp, Honed (retired); Hooked, Scroll-stopper (they forecast readers) |
  | **Rewrite** (the whole post), **Sharpen** (selected words), **version** | riff, take, option, "applied", AI edit |
  | **Formula** (a fill-in first line or post shape) | shape, structure, pattern (as a template), hook library |
  | Post kinds: **Hot take**, **List**, **Teaser**, **Story**, **How-to**, **Question**, **Results**, **News**, **Lesson**, **Thought**; in sentences “hot takes”, “lists”, “teasers” | Contrarian, Listicle, Curiosity / Open loop (as a kind), Proof, Announcement, Take (as a kind) |
  | **Didn’t land** (a post well under your usual) / **Try again** | Quietest posts, flops |
  | **Write about it**, **Quote it**, **Reply to it** (a saved link) | Write a take on this |
  | **Example** (a filled-in part of a formula, marked) / **blank** (only you know it) | placeholder |
  | **Pattern** (only what What's working finds) | |
  | **Post ideas** | starters, engine, fresh angles |
  | **What's working** | In your niche (as a name), Niche radar |
  | **Reply radar** (others' fresh posts) / **Replies to your post** (your own) | desk, reply desk |
  | **Saved** | Inbox, Archive |
  | **Your voice**, **never-say list** | voice profile, voice model, full profile, banned words, Ban it |
  | **Say it** (dictation) | voice typing, Talk it through |
  | **Your people** = your audience; **Accounts you learn from** | your people (meaning sources) |
  | **Best time**, **Next open slot**, **Scheduled for** | golden slot, Add to queue, Queued for |
  | **Hook vote** (friends) / **Compare two lines** (your past posts or friends) | Hook shootout as a title |
  | **Delete** (drafts, ideas) | Archive, let it go, bin |
  | **Link card** (the preview under a post with a link), **Show card** | embed, unfurl, rich preview |
  | **Claude** / **Basic mode** | your Claude, the AI |
  | **Bring your posts** | Import it, Add posts |
  | **Breakout alert** | Follow-up reply |
  | **Plans** (the page), **Your plan** (paid), **Upgrade to Pro** (free users only) | Pricing (preview), Hookworthy Pro, Manage plan |
  | **Credits** / **Claude credits**, **Plenty left**, **Back at midnight**, **Refills Nov 4**, **Try Pro free for 7 days**, **Use the Basic version**, **Plans & credits** (phone menu) | tokens, words left, AI points, quota, unlimited (for Claude), Start free trial |
  | **Tension** (the fourth check) | Friction, Stakes |
  | **Keep** (accepts a version) / **version** (one result of Rewrite or Sharpen) | Accept, take, angle (for rewrites) |
  | **Add an open loop** (the rewrite) | Curiosity gap |
  | **Save an idea** | Capture an idea |
  | **Write from a picture** (feature) / **From a picture** (button) | Picture to post |
  | **Weekly reruns** | Evergreen reruns, Repost |
  | **Fix spacing** / **Swap it out** (one-click fixes) | Tidy up, Rewrite it (for these) |
  | **Use this pattern** (What's working card) | Write your take (that name is for market events only) |
  | **Auto-plug** (one reply you write ahead, per post, off by default, sent once at a like count you pick) | follow-up, CTA bot, auto-reply |
  | **Who can reply** (per post: Everyone, People you follow, Only people you mention) | reply settings, audience |
  | **Your posting times** (the weekly grid Schedule fills first) | golden slots, time slots |
  | **Post by hand** (a post whose time came with nothing to send it) | Published (unless something sent it) |
  | **Open the app** (the link into the app from the light-world pages) | Open the demo |
  | **Reset sample data** | Reset demo data |
  | **Post now** (the main button) / **Schedule** (secondary) | Publish, Send now |
  | **Share**, **Share for review**, **Public link**, **Internal link** | Get a second opinion, review link (as a button) |
  | **Comment**, **Reply**, **Resolve** / **Reopen**, “on text that changed” | Feedback, annotate, mark done |
  | **Open in X** / **Mark as posted** (nothing connected) | Post manually, Publish elsewhere |

- **Slots in sentences:** "Scheduled for tomorrow at 8:40 AM", never "Scheduled for Tomorrow · 8:40 AM". The "·" form is for labels and lists only.

- **Time format:** 8:40 AM, with a space and capitals, as on X.
- **Voice:** a coworker who writes too: warm, plain, a little dry. Say what happened and what to do next (“Gone from the queue.”, “Added on top. Your old line is right below it.”), never “Operation successful”. Creator to creator; short sentences; numbers beat adjectives; no "unlock / supercharge / leverage / elevate / seamless / AI-powered".

## Round 49: hook tag, post sheet, balanced pages

- **Hook state is a tag, not a ring.** It sits at the right of the post header: signal bars, the state word and a chevron, tinted by state. Outstanding (renamed from Standout) gets a gold edge and a slow sheen. The gutter keeps only the avatar.
- **The post sits on a sheet.** On desktop the thread is a white card with a hairline border and soft shadow; the tools row stays visible inside it at reduced opacity.
- **Pages centre beside the sidebar.** Every `.page` uses auto margins, so left and right gaps match (Queue included).
- **Insights rhythm.** One 16px gap between every block; side-by-side charts end on the same line; insight cards put the body under the title and the button on the bottom edge.

## Round 50: a coach, not a grade

- The composer never shows a score or a state word while you write. The header tag is gone.
- One quiet line sits in the post's tools row: **One tweak to try** (only after you pause), **Strong opener** (green check) or **Outstanding opener** (gold, one sheen when you get there). It opens the tips panel.
- The tips panel leads with what to do ("Try this: …"), headers read A few quick wins / Nearly there / Strong opener / Outstanding opener, and no signal bars.
- Schedule and Post now: a strong opener gets "Strong opener. Good to go."; a middling one says nothing; a weak one gets an optional "One tweak to try" with stronger lines to tap. No chips or grades.
- Today's quick composer only speaks up to say an opener is strong.

## Round 51: no grades anywhere

- `tierChip()` is positive-only: strong openers get a small check chip (Strong / Outstanding); anything else renders nothing. No line is ever labelled weak.
- Removed: the Hook column in the Insights posts table, every dial on the homepage and tools page, the four-step grade scale, and the "Show scores as numbers" setting.
- Change labels read Stronger / Now strong / About the same / A different angle; sentences talk about "strong openers", never tier words.
- The homepage try box is a sharpener: a tip and a Sharpen button, no score.

## Round 52: trust fixes + Teams

**Trust fixes**
- Schedule says what happens at the time you pick: "Posts by itself" when an account is connected, otherwise "You'll press Post… it waits on Today", with Connect. Threads and Bluesky start off.
- Toasts move to the top while a modal is open, so they never cover its main button.
- A modal on a scrolled page no longer blanks the app (`body{overflow-x:clip}` instead of `hidden`, which turned body into its own scroll box when html was locked).
- Editing a scheduled post: no false "same first line" warning against itself; Change time · Post now · Save changes.
- Command palette: commands that send something sink unless typed by name; groups stay in one block; New thread added; novelty commands trimmed.
- Sample numbers are seeded from the post text, so they hold still across loads.

**Teams** (`S.team`, route `#team`, sidebar item with a badge)
- Four roles: Admin (everything + people), Editor (write, post, approve), Writer (write, comment; posts need a yes), Reviewer (comment, approve; read-only composer). A permissions table shows it at a glance.
- Invites by email with a role; pending rows have Copy link and Revoke. Roles change inline; Remove has Undo.
- "View as" previews any teammate's seat, with a bar to get back.
- Comments on drafts and queued posts: a side panel with threads, replies, @mentions, quotes from selected text, resolve/reopen. They travel with the post from draft to queue and back.
- Approvals: a Writer's Schedule becomes "Send for approval"; approvers get Approve / Ask for changes (with a note) on the Team page and in the queue menu. "Changes asked" goes back to the writer. Activity logs it all.
- App classes use the `tmx-` prefix (the marketing Teams page owns `tm-`).
