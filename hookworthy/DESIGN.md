---
name: Hookworthy
description: Good ideas die in bad first lines.
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

Wispr Flow's editorial calm, in plum, for people who write in public. A cream page, classic Garamond headlines split into roman and *italic* halves, a friendly sans for everything you click, and color that arrives in big confident blocks (a plum chapter, an ink chapter, one plum pricing card) instead of gradients and glows. Research basis: Wispr's own tokens (cream #FFFFEB, ink #1A1A1A, lavender #F0D7FF for actions, forest #034F46 for sections, ember #FFA946 for active states; EB Garamond 400 at 32px+, Figtree for UI; 128px section padding).

**Key Characteristics:**
- Cream canvas (#FEFDF1), ink text (#1A1A1A), no pure white and no pure black.
- EB Garamond 400 only at 32px and above, roman with an italic second half. Figtree for UI and body.
- Primary actions are lilac #EADCFF with a 1.5px ink border and a 10px radius, never a solid saturated fill.
- Plum blocks (#3B1F5C) and ink (#1A1A1A) as full-bleed rounded blocks; uppercase letter-spaced eyebrows above headlines; a hand-drawn lilac squiggle instead of a highlighter.
- Platform-true posts, fictional creators labelled once per section.

## Colors

### Brand color: Lilac & Plum (locked, round 12)
The owner picked Lilac & Plum from the 20-palette exploration (round 10), so the switcher is gone. The structure never changes: cream canvas, ink text, EB Garamond + Figtree, bordered pastel buttons, color arriving in big blocks. The variables stay so the brand lives in one place.

| Role | Variable | Value |
|---|---|---|
| Action pastel (primary buttons, selection) | `--pa` | #EADCFF lilac |
| Link on light / on dark (links, caret, switches, hook chip 70+, charts) | `--pl` / `--pl-d` | #6A2FA0 / #CDB2FF |
| Blocks (story, final call, Pro card, app-icon tile) | `--pb1` `--pb3` `--ppro` | #3B1F5C deep plum |
| Ink block (voice chapter) | `--pb2` | #1A1A1A |
| Spark (rare active states) | `--psp` | #FF9F6B apricot |
| Squiggle | `--psq` | #A27BE0, drawn as SVG at load |

**Plum ramp (app, round 27).** `--plum-900` #3A1E5C (Today's write block, Pro card), `--plum-600` #6A2FA0 (links, focus, hook 70+), `--plum-400` #9466D6 (dark: #A887E8; squiggle, dials), `--lilac` #E8DBFF and `--lilac-soft` (selection, chips), `--apricot` #F28A55 (spark, used rarely). Every app accent comes from this ramp.

Why plum: blue belongs to X, Typefully and Buffer; plum stands apart in a creator's tab bar, reads creative rather than corporate, stays warm next to cream, and its lilac buttons keep ink text readable in dark mode. The 20-palette board is kept as history in CRITIQUE.md round 10.

### Neutrals
- Light: cream #FEFDF1, card #FFFFF8, sunk #F2F0E3, ink #1A1A1A / #4D4C46 / #65645C.
- **Dark (aubergine, round 27):** bg #141118, surfaces #201C26 / #29242F / #342E3B, panel #1C1820, warm text #F6F2E8 / #C9C2CF / #A29BA9. The neutrals lean toward plum so dark mode feels like the brand, not a generic black. Primary buttons keep the lilac pastel with ink text.
- Text on colored blocks is cream at 84–100% opacity, never a fixed grey, so it reads on any block.

### Retired
Round 9's harbor blue (#0B3A66) and periwinkle as the only brand colors; round 8's cobalt, sky canvas, navy dark mode and washes.

### Semantic (app)
- **Success** #2B7A4B / dark #6FCF97, **Warn** #A0560F / #F0A458, **Error** #B3313A / #FF8A8A: state only, each passing AA on its theme.

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
- **Display** (EB Garamond 400, clamp(48px, 6.8vw, 104px), 0.98, -0.018em): the homepage hero, always the largest line on the page. The second half is italic, one phrase gets the squiggle.
- **Headline** (EB Garamond 400, clamp(40px, 4.8–5.2vw, 72–80px), 1.02): one per chapter (story, sections, final call), roman then italic, under an uppercase Figtree eyebrow (12px, .12em). Every homepage section, FAQ included, has an eyebrow.
- **Title** (EB Garamond 400, 32–56px): app page titles, plan names, prices. Section heads below 32px are Figtree 600 19px.
- **Body** (400, 17–21px, max ~56ch): chapter intros.
- **UI** (500, 13–15px): controls, captions.
- **Hand** (Caveat 500, 20–24px, rotated 2–4°): at most two margin notes in the hero, with drawn arrows.
- **Data** (Geist Mono 500, tabular): scores, counts, times, keys.

### Named Rules
**The Numbers-Only Mono Rule.** Mono is for counts, times, scores and keys, never sentences.
**The No-Gradient Rule.** Text is solid. Emphasis comes from the tint or from size.
**The Tracking Rule.** Negative letter-spacing only on Garamond at 32px and up. Figtree is always 0 (uppercase eyebrows and app labels get +.1–.12em, 12px, never smaller). Body text runs at 1.5 or looser.

## Layout

The homepage uses a 1180px wrap with a clamp(16px, 4vw, 40px) gutter. It is about 9 screens at 1440. Every rule is scoped under `.hw27`.

1. **Hero**: "Good ideas die in bad first lines." with one sub and two CTAs (Start free, Open the demo). The visual is a live grader: soft words get a wavy underline with the reason, a dial scores the line, and **Sharpen** shows an honest rewrite as a word diff with the real score jump. **Keep it** opens Write with the line. After you type, the nav CTA reads "Keep your N →".
2. **The problem**: one row of void posts that drifts with scroll (no lagging transition; cards min(330px, 100vw − 48px) on phones).
3. **Story** (full-bleed plum, beats on a shared subgrid so the cards line up; they swipe sideways below 900px): Priya's post in three beats: the draft (48), sharpened in her voice (80, with `[your number]` left for her), scheduled Tue 8:40 AM. No likes or views.
4. **Built around the hook**: a bento in two 7/5 rows: Hook score (Clear, Open loop, Specific, Friction, Short) and Your voice (tone/polish sliders and the never-say list), then What's working and Reply radar with breakout alerts. Below 760px the cards swipe sideways.
5. **Previews**: one phone with X / Threads / LinkedIn / Bluesky tabs. LinkedIn shows the fold check.
6. **Scheduling**: the app's own calendar (`calGridHTML`) with a trading week, in the visitor's time zone.
7. **Who it's for**: Crypto & trading first, then Founders, Creators, Ghostwriters. Each shows first lines before and after, with real hook scores.
8. **Switching & trust**, **Pricing** (Free trimmed to three items on the home card), **FAQ** (five questions).
9. **Final call**: a deep plum block with cream text: "Paste the post you almost wrote", a live score, a centred lilac CTA and "Your next good time: tomorrow at 12:15 PM (UTC)", then the footer.

The header and footer sit outside `<main id="main">`; the announcement bar is an `<aside>`. Reveals run 600ms at most and never blur large cards. Phone length is about 11 screens at 390.

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
There is one primary button style everywhere: lilac with a 1.5px ink edge (the hero's is 52px tall, the same colour). On a plum block the same lilac button reads as the CTA. The ghost button has a play glyph in a circle. In the app, the primary is ink with a 10px radius and a spring press.

### Character ring (composer)
It follows X, but stays hidden until you're near the limit: it appears at 20 remaining, turns to warning then error, shows the count, and hides the circle at 10 over.

### Improve panel (round 27)
One panel beside the post, with three tabs: **Score** (the hook dial's reason, a fix, and the five sub-scores under "How it's scored"), **Takes** (Punchier, Shorter, Hook, then More angles and Get a second opinion), and **Formulas**. The hook dial sits in the first post's gutter, plum at 70+, warn under 50. Voice match is a single line under the post ("Sounds 82% like you"). A rewrite that adds a number you didn't write gets flagged before you keep it.

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
Most users write about crypto and trading. The product shows them first-class: the default niche in onboarding, a hedging trader line in the homepage grader, crypto first in Who it’s for, a trader demo persona (Sam Okafor, @samtrades), market events and a stale-price guard in the queue, and What’s working defaulting to trading. Other niches keep equal craft.

### What’s working (Ideas tab, formerly Niche radar)
Choose a niche, then:
- **Trends:** three trends, with the one you're early on outlined in ink and given a "Post on it first" button.
- **Popped posts:** real-looking posts from accounts in your niche, each with three reasons it spread (early, hook, relatable, timing, format, proof) and the structure written out with placeholders marked.
- **Write your take:** loads that structure into the composer with [brackets] to fill.

The accounts are illustrative and labelled as such.

### Sound
Sounds are synthesized in Web Audio and never samples. Each is under 350 ms and very quiet:
- **tick:** toggles and tabs.
- **tap:** primary actions.
- **hook:** a rising two-note cue when the first line crosses 70.
- **swap:** a rewrite or take is kept.
- **done:** a four-note arpeggio when a post is scheduled or published.

Sounds are on by default in the app and can be switched off in the account menu. On the homepage they're off until you ask for them.

### App shell
- **Sidebar:** logo, a New post pill, Search (⌘K / Ctrl K), then Today, Write, Ideas, Replies, Queue and Insights. Your five most recent drafts sit below, and the account button (which also switches client voices) is at the bottom. There are no section headers.
- **Composer top bar:** status, a “N things to check” pill when there is something to look at, Post to, Focus, a labelled Preview toggle (pressed when open), ··· and Schedule. The preview panel has its own **Hide** button top right, and ⌘\\ works from inside the editor.
- **Navigation:** the daily loop only (**Today**, Write, Ideas, **Replies**, Queue, Insights). Hooks and Your voice live in ⌘K, G H / G V and the account menu. On phones the tab bar is Today, Replies, + (hold to capture an idea), Queue, More.
- **Today** is one next action. A plum hero card picks it: reply while a post is live (first hour), rescue a missed post, or write the next one (your best saved idea, 70+ hooks first). Below it are a yesterday / today / tomorrow strip, how the last post did, and the weekly rhythm (goal 5).
- **Replies** is a triage list. One card is open and the rest are compact. J / K move, S skips, ⌘↵ (Ctrl+Enter on a PC) replies. The verb is always "Reply".
- **Keyboard hints** follow the computer: ⌘ ⌥ ⇧ ↵ on a Mac, Ctrl Alt Shift Enter on a PC. They are hidden on touch.
- **Ideas:** three tabs that say what they are: **Post ideas**, **What’s working** (why posts in your niche popped, sample data until real search backs it) and **Saved** (links, notes, screenshots and voice memos you parked).
- **Hook formulas** are no longer a tab. When your first line scores under 70, the hook panel offers three formulas; picking one adds it above your line with the first blank selected. The full library stays reachable from ⌘K.

### Honest states (round 28)
- **Practice mode.** With no account connected, nothing posts. Post now becomes "Marking as posted · nothing leaves this browser", with a Mark now button. The card reads **Marked**, never Live, and can go back to drafts. Connections opens with a practice-mode note.
- **No predictions.** Your own post never shows predicted likes or views (preview, Today). Sample numbers appear only on seeded demo posts, labelled Sample.
- **Queue card status.** Sent, Sending…, Marked, Post by hand and didn't go out. On narrow cards (≤124px) the time hides, since the row says it, and the status becomes a 6px dot before the title (success, text-3, warn, error).

### Ghostwriting (round 28)
Each voice (you plus up to eight clients) keeps its own drafts, counts, default platforms and half-written post. Add, edit or remove a client from the account menu's "Write as" section or ⌘K. Writing as a client, Schedule reads "Send to <Client> for approval", and cards wait with a readable **To approve** tag.

### Keyboard (round 28)
- **Schedule sheet:** the times are a roving radiogroup; ↵ on a time or ⌘↵ anywhere schedules.
- **Replies:** J/K/S and ⌘↵ keep focus in the reply box; Alt+J/K move from inside it; Esc goes to the card.
- **Toasts:** Alt+T jumps to the newest one.
- **Improve:** Esc closes the panel.
- Hints follow the platform (⌘ ⌥ ↵ on a Mac, Ctrl Alt Enter on a PC) and hide on touch.

### Before you post (checks)
The small stuff people only notice once it’s live, checked on every keystroke and shown in the schedule sheet and the top-bar pill: leftover blanks ([brackets], TK, TODO), a link in the first post on X or LinkedIn (fix: move it to a reply), a word used three times, more than two hashtags, images without a description (fix: describe it), thread numbering that doesn’t match (fix: renumber), a thread ending on a colon or ellipsis, a post starting with @ on X, a first line that repeats something already queued, double spaces (fix: tidy up), and a quoted BTC/ETH/SOL price that has moved more than 3% (fix: update the price). The schedule sheet also checks the hook: under 60 it offers your own line tightened, then two formulas. Checks never block posting.

### Focus mode
⌘. (or the target button) hides the sidebar, preview and chrome, centers the editor and keeps the line you’re on at eye height (typewriter scrolling). Esc or ⌘. brings everything back. Desktop only.

### Appearance
The account menu’s Appearance item picks Light, Dark or Match my system. Brand color is fixed (Lilac & Plum).
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

- **Name:** Hookworthy. **Promise:** Good ideas die in bad first lines.
- **Logo: the wordmark.** hook*worthy*: EB Garamond 500, lowercase, "hook" roman and "worthy" italic, the same move every headline makes. No symbol in the UI. Where a square is unavoidable (favicon, app icon), a roman Garamond h in cream on a harbor tile. Files: `assets/wordmark.svg` (outlined), `assets/icon.svg`, `assets/app-icon.svg` / `.png`.
- **Glossary (say it this way):**

  | Say | Don't say |
  |---|---|
  | **Hook** (the first line), **Hook score** | grade (as a noun) |
  | **Rewrite** (the whole post), **Sharpen** (selected words), **version** | riff, take, option, "applied", AI edit |
  | **Formula** (a fill-in first line or post shape) | shape, structure, pattern (as a template), hook library |
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
  | **Claude** / **Basic mode** | your Claude, the AI |
  | **Bring your posts** | Import it, Add posts |
  | **Breakout alert** | Follow-up reply |
  | **Auto-plug** (one reply you write ahead, per post, off by default, sent once at a like count you pick) | follow-up, CTA bot, auto-reply |
  | **Who can reply** (per post: Everyone, People you follow, People you mention, Verified accounts) | reply settings, audience |
  | **Your posting times** (the weekly grid Schedule fills first) | golden slots, time slots |
  | **Post by hand** (a post whose time came with nothing to send it) | Published (unless something sent it) |

- **Slots in sentences:** "Scheduled for tomorrow at 8:40 AM", never "Scheduled for Tomorrow · 8:40 AM". The "·" form is for labels and lists only.

- **Time format:** 8:40 AM, with a space and capitals, as on X.
- **Voice:** a coworker who writes too: warm, plain, a little dry. Say what happened and what to do next (“Gone from the queue.”, “Added on top. Your old line is right below it.”), never “Operation successful”. Creator to creator; short sentences; numbers beat adjectives; no "unlock / supercharge / leverage / elevate / seamless / AI-powered".
