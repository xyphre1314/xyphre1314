---
version: 6
slug: "index-html"
primary_target: "index.html"
related_targets: ["DESIGN.md"]
---

# Surface brief: Hookworthy site + app (index.html)

Scope: the homepage (Persuade) and the app routes (Operate), both in one file. Onboarding sits between them.
Audience: every creator who writes in public: solo audience builders, founders who post, ghostwriters and small teams.
Action: land, feel seen ("we've all posted into the void"), watch a draft become a hook, start writing free.
Proof available: the product itself (hook score, rewrite, platform previews, queue). No real users, numbers or quotes exist. Creators on the page are fictional with generated portraits, and every section with people says so.
Constraints: single file, no build step, WCAG AA, reduced motion. Fonts self-hosted (Geist, Geist Mono).

Direction source for this round (v2, "Keynote for creators"): the owner asked for a 10/10 overhaul and delegated the look: "do what you think best… always look at Linear, Arc, Apple. Design this like how they would." No concept roll ran. That delegation stands in for the roll, and this contract replaces the v1 Thumb-Stop contract (seed 811fdc76), which is retired.

## Direction contract

THESIS: If Apple, Linear and Arc built a Typefully competitor, the homepage would be a keynote about one moment: the first line that makes someone stop scrolling. Each chapter makes one point with one live demo. The product's subject is other apps, so every post is rendered exactly as X, Threads, LinkedIn and Bluesky render it. The page refuses the category default (gradient hero, fake dashboard, bento grid, logo wall, testimonials).

OWN-WORLD:
- Canvas and chapters: a light canvas (#F5F5F3) with two dark chapters (#09090A), the story and the voice section.
- Type: Geist 600 with tight tracking for display, Geist for UI. Caveat is used for at most two margin notes, and Geist for the wordmark (Garamond retired in v3).
- Accent (v4): Flow blue (#2B59D9 / #8AAAFF), solid for the one main button and on-states, a soft tint under words worth stopping for. Canvas Paper #F7F5EF with Dusk #1B1B1A chapters. Yellow retired.
- Materials: real platform UI (system type, real spacing, count formats), true-scale phones, and photoreal portraits and photos.
- Motion: tied to the reader. The ring brakes on a hook, the story scrubs with scroll, and the wall drifts only when you scroll.

STORY (v3 adds #demo after the wall):
1. The hero ring stops on a post and marks its first line.
2. The pinned story follows one post from an 11:47pm draft to a Tuesday 8:41am notification.
3. "We've all posted into the void" makes the visitor feel seen.
3b. #demo: four moves, played out in the app's own UI.
4. One post in four feeds.
5. The LinkedIn fold.
6. Your voice.
7. The week that fills itself.
8. Three ways creators work: solo, founder and ghostwriter, each shown with platform posts.
9. Pricing, then a final call to action with a second ring.

FIRST VIEWPORT: A centered headline, "Write posts people stop for.", at up to 124px, with the marker on "stop", one sentence of sub copy, and an ink pill CTA plus a "Watch a draft become a hook" link. Two Caveat notes sit in the margins. Below them, a 3D ring of real-looking X posts turns slowly. Every few seconds it brakes, the front post comes forward, the neighbours step back, its first line is highlighted and a "Hook score · stopped the scroll" chip appears.

FORM: The keynote chapter (Apple product-page grammar) × platform-true replicas (the posts are the illustration). The seed is replaced by the owner's delegation (see above).

FINISH: unreviewed and undocumented is unfinished. This round ends with the finish review and verdict, DESIGN.md "Keynote for creators", and recorded asset provenance: portraits and photos were generated in Higgsfield (gpt_image_2_5, project "Hookworthy homepage assets") and served as two sprite sheets.

## v3 additions (this round)
- Logo: The First Line (marker swipe with caret). One token set shared by site and app. Pill buttons. Geist only.
- #demo chapter: a Notion-style product window built from the app's own classes (sidebar, Post to toggles, hook chip, preview pane). Four scenes (Sharpen, Visuals, Niche radar, Schedule) play while on screen, sound is opt-in, and the copy claims no more than "the same buttons you'll press".
- App features: Sharpen (select text, flip through three takes, keep one), Visuals (quote card, before/after chart, post screenshot, framed screenshot), Niche radar (trends plus why posts popped plus a reusable structure), synthesized UI sound, and one hook threshold (70).
- Audience: crypto and trading writers are first-class (see PRODUCT.md).

## v4 changes (round 7)
- Owner feedback: logo "sucks", yellow "sucks", couldn't find how to close the preview, unclear Hooks and Inbox, wants Cursor/Perplexity/Claude-style neutrals, then Wispr Flow's palette in blue.
- Brand: the h mark, Flow blue accent (switchable: Tide, Ember, Iris, Graphite), Dusk and Paper themes, pastel wash behind the hero. Options board published as an artifact; owner can swap by name.
- UX: labelled Preview toggle plus a Hide button in the panel; Ideas tabs are Fresh angles / What’s working / Saved; hook formulas moved into the hook panel.
- Writing: Before-you-post checks (blanks, links, repeats, hashtags, alt text, numbering, dangling endings, @ starts, duplicates, double spaces) and Focus mode with typewriter scrolling.
- Voice: toasts, empty states and placeholders rewritten to sound like a coworker.

## v5 changes (round 8, "Bluebird")
- Owner: some colors unreadable (Pro pricing card, a dark pill in the X replica), wants a type-only logo, Wispr Flow–style colors and typography in blue, applied everywhere.
- Logo: wordmark only (Instrument Serif italic). Icon files use an italic h on cobalt only where a square is required.
- Type: Instrument Serif display across homepage, app titles, section heads, prices, big numbers and quote cards; Geist for UI.
- Color: cobalt/sky/navy + five AA-checked pastels; Sky and Midnight themes; colored washes; navy chapters with cobalt/violet glows; cobalt Pro card. Accent picker removed.
- Bugs: `.rp` class collision (radar card vs X reply button) renamed to `.rpost`; upgrade page used homepage-only tokens (now explicit); light status colors darkened for AA.
- Verification: automated contrast audit over 13 app states × 2 themes + 15 homepage scroll positions. Only exemptions: disabled/loading demo states on the design-system page.

## v6 changes (round 9, "Harbor & Cream")
- Owner shared Wispr Flow screenshots and asked for a hard critique and a 10/10 redo of colors, palette, fonts, layout and vibe.
- Research: Wispr tokens (cream #FFFFEB, ink #1A1A1A, lavender #F0D7FF, forest #034F46, ember #FFA946; EB Garamond 400 ≥32px + Figtree).
- System: cream + ink + periwinkle bordered buttons + harbor blocks; EB Garamond roman/italic headlines; Figtree UI; uppercase eyebrows; announcement bar; floating bordered nav; squiggle underline; washes and glows removed; mono removed from sentences.
- Applied to homepage, demo, every app route, onboarding, pricing, design-system page, quote cards, icons, favicon, manifest.
