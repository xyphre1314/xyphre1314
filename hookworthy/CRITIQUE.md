# Hookworthy (formerly Murmur): hard critique, and what changed

v1 was built, then tested the way a user would use it: every route, every flow, light and dark, iPhone SE through desktop, in a real Chromium. Every finding below was seen in a screenshot or a test run. Nothing on this list is a guess.

## Senior product designer

| Finding (v1) | Severity | Fix (v2) |
|---|---|---|
| Pro pricing card lost all its padding. `.plan.hero` collided with the landing page's `.hero` section class. | Broken | Renamed to `.featured`. |
| Focused textareas drew a big saffron rectangle, so the editor looked like a form field. | Broken | Bare writing surfaces (composer, grader, capture, handle inputs) now use the caret and a container glow. No box ring. |
| The dark-mode glow behind the editor read as a muddy brown smudge. | Ugly | Switched to the soft accent token, blurred wider, stronger only while typing. |
| Section headings had about 80px of phantom space under them from default `h2` margins. | Sloppy | `.display { margin: 0 }`. The rhythm now comes only from `gap`. |
| The before/after slider cut words in half at rest. | Ugly | Clean side-by-side at rest, drag to reveal. Stacked on phones. |
| The "X" preview tag read "X X". | Nit | The tag now says what matters: "280 per post". |
| Queue golden-slot dots collided with card corners. | Nit | Dots sit centered above the card, and the slot reserves room for them. |
| The stats strip mixed three type styles at random. | Nit | One number style and one label style. |

## UX and accessibility

| Finding | Fix |
|---|---|
| Tertiary text was 3.3:1, below WCAG AA. | Light `#736D62` (4.75:1) and dark `#878075` (5.03:1). Every text/background pair was measured and passes AA. |
| Phones: the preview sheet and tab bar were invisible on Write. The view's entry animation used `fill-mode: both`, which made `.view` a containing block for `position: fixed`. | `fill-mode: backwards`. The animation still plays, and fixed elements anchor to the screen again. |
| Phones: Write was 65px wider than the screen because of a 520px decorative glow. | `overflow-x: clip` (keeps the sticky header working) plus a capped width. Overflow checked on 10 routes × 3 devices: 0px. |
| Phones: segmented controls overflowed on Hooks, Ideas and Onboarding. | They scroll horizontally, and the onboarding platform picker drops to icons only. |
| Phones: the 7-column week grid was unreadable. | New agenda layout under 760px, with open golden slots you can tap to write into. |
| Touch devices showed keyboard hints that mean nothing there. | Hidden with `pointer: coarse`. |
| Palette fuzzy search returned noise ("pun" matched "Popular thing is a trap"). | Scattered subsequence matches are rejected. |

## CEO / founder (conversion)

| Finding | Fix |
|---|---|
| The hero asks for your @, then onboarding asked for it again. That's a speed bump in the 30-second aha. | A valid handle from the hero skips straight to the read. Paste to five posts takes about 4 seconds, and a timer on screen says so. |
| "Write for this slot" in the queue was ignored by the schedule sheet. | The picked slot is pre-selected, with the reason "The slot you picked in your queue". |
| The upsell must fire at a moment of delight, never as a wall. | Verified: it fires only when an accepted riff lifts the hook by 12+ points to 78+. It fires once. Running out of riffs shows a soft sheet with "One more, on us". |
| The landing demo autoplays a rewrite. If that rewrite doesn't clearly win, the pitch fails. | Stronger-hook now ranks candidates by grade, like a real model would. The demo goes from 36 to the high 80s. |

## Writer (the actual user)

| Finding | Fix |
|---|---|
| "Stronger hook" produced "I got probably charge wrong for years." The topic extractor grabbed verbs and adverbs. | Noun-first topic extraction: skips verbs and adverbs, prefers subjects and plurals, and picks up bigrams ("side projects"). |
| Idea templates read like a robot: "my your first 100 users", "landing pages tools". | Every template was rewritten to read naturally with any topic. Batches never repeat a template. |
| "More contrarian" flipped your opinion into its opposite. | It now frames your take as the unpopular one ("Unpopular opinion: you should charge more than you think."). |
| "Punchier" left "probably" in place and never split run-on sentences. | Wider filler list. Long sentences split at "because" and ", and you". |
| The hook grader punished crisp one-liners like "Double your price." | Imperatives and bold short claims now count. A short first line is graded together with its follow-up. Scores track intuition: flat draft 36, "I charged 10x more and got more customers." 77, a strong curiosity hook 88. |
| Riffs could lower the score (82 → 81, in red). | The best candidates are chosen by grade. |
| Diffs painted a highlight sliver on blank lines, and rejected changes left stray line breaks behind. | Newline segments are handled separately from the highlight and hidden per toggle state. |
| Translation mangled accents ("mayoríun"). | Unicode-aware tokenizer plus phrase-level mappings. |

## Engineer

- Zero JS errors across all routes, 3 viewports, 2 themes and 4 scripted flows (onboarding, compose → split → riff → diff → accept → schedule, queue, ideas, hooks, the out-of-riffs path).
- A dead-button audit maps every `data-*act` value in the markup to a handler. Nothing is unhandled.
- Boids run only while visible and pause in hidden tabs. Reduced motion freezes them into a static frame.
- State lives in localStorage behind try/catch. The app works when storage is blocked.

## Known limits (honest)

- AI is a deterministic local mock behind the `AI` object. Swap it for a model endpoint one function at a time.
- Publishing, analytics and OCR/transcription are simulated.
- Fonts load from Google Fonts. Offline, the service worker serves whatever it has cached.

---

# Round 2: from 5 to 10

Owner feedback: temporary text overlapping in the app, scroll animation glitches on the homepage, not smooth enough, weak brand colors, a name that doesn't land. Direction: colors like Linear, type and branding like Wispr Flow, motion drawing on Linear, Wispr and Notion.

## Bugs found and fixed

| Symptom | Root cause | Fix |
|---|---|---|
| Text overlapping while scrolling "How it works" | Scenes cross-faded at the same time, so two scenes' text was visible at once | The outgoing scene hides first, then the incoming one fades in with a blur, with no overlap |
| Grey "temporary text" in the editor | A rotating idea sentence plus a "Tab" hint sat in the empty editor, and ghost suggestions popped up after nearly every sentence | Static placeholder ("What's worth saying today?"). Ghost text waits 1.1s and shows a generic suggestion at most once per post |
| A caret left behind in another post | The new blink keyframes overrode the hidden state | The caret drops its blink class whenever it's hidden |
| Toasts piling up over content | Up to 3 stacked | One toast at a time. A new one replaces the old |
| Tooltips popping over your writing | They fired on hover even mid-typing | Suppressed while typing and inside the editor, with a longer delay |
| Janky scrolling | A full-screen SVG grain overlay repainting on scroll, and a blurred glow that banded into rings | Both removed |
| Layout jumping on the homepage | The demo resized itself while autotyping | Fixed-height demo layout |
| "Stronger hook" could lower the score | No floor check | It declines politely when nothing beats your current hook |
| Big gaps between posts on phones | The hidden toolbar still reserved its space | It collapses on touch until you tap into a post |

## Redesign

- **Color:** Linear-style cool neutrals with one indigo accent. The landing page and onboarding are always dark. The app has an inset main panel with 1px borders.
- **Type:** EB Garamond display at regular weight, large sizes (Wispr), Figtree for UI and writing. Numbers such as KPIs, prices and scores are set in Garamond.
- **Branding:** a light "paper" chapter in the middle of the dark landing page (before/after and testimonials), matching Wispr's cream/dark alternation.
- **Motion:**
  - The hero headline arrives word by word with a blur.
  - Blur-rise reveals only on elements below the fold.
  - View transitions between app screens.
  - A nav highlight that glides between items.
  - Spring presses on every button, chip, tool and switch.
  - Animated hook rings.
  - A cursor-follow glow on feature cards.

## Name

Murmur is gone. After five naming rounds (see `NAMES.md`) the pick is **Hookworthy**: hookworthy.com, .app and .xyz are all unregistered and standard price.

What changed with the rebrand:
- Logo: the three-dot flock became The Hook, a single stroke with an eye. It is used for the favicon, app icon, wordmark and in-app logo.
- Hero: "Write posts people *stop* for." The final CTA is "Your next hook is already in here."
- Publish reward copy: "Hook, meet world."
- PWA name, meta/OG tags, service-worker cache and localStorage prefix all say `hookworthy`.

## Round 3: Graphite

Owner picked direction B from `brand/logo-directions.html`: minimal like Linear and Arc, not bare like Craft, with Wispr-style type.

- Logo: the fishhook became The Cursor, an I-beam whose foot curls into a hook.
- Color: the indigo accent is gone. The accent is now ink (near-black on light, near-white on dark), and on-accent text flips with it (`--accent-ink`).
- Glows behind the hero, demo, story and final CTA are neutral white light instead of indigo.
- App icon: a graphite gradient tile with a white cursor and a glass edge.
- Fixed while switching: switch knobs and spinners on accent backgrounds used hard-coded white, which would have vanished on the near-white dark-mode accent. They now use `--accent-ink`. The logo's SVG class was renamed from `.hk` to `.cm` because it collided with the hook-card `.hk` class.

## Round 4: The Thumb-Stop

Scored 5/10 before this round: first impression 6, distinctiveness 3, creator voice 5, trust 3, craft 7. The full critique and the three directions considered are in the redesign directions page. The owner picked **The Thumb-Stop** with product crops as the illustration style.

What was wrong, and what changed:

| Problem | Fix |
|---|---|
| The landing page was the default AI template: centred serif, glow, product frame, stat row, bento, testimonials, three price cards. | Rebuilt from the feed's own grammar. The hero is a live feed: other people's posts stream past with speed-linked blur and yours is pinned in the middle. Its first line is graded as you type. Under 70 the feed keeps scrolling past you; at 70+ it brakes and parks. |
| Fabricated proof (“41,208 posts”, “3.1× lift”, six named testimonials). | All removed. Example data is labelled as example data. Prices are labelled as placeholders. |
| The scroll story was four screens of mostly empty black. | Replaced by “One idea, before your coffee cools”: five moments in a creator's morning, each with a real crop of the product beside it. Nothing waits on a sticky scene. |
| “Everything Typefully does.” | Gone. No competitor names. |
| Hook puns (“Pro when you're hooked”, “Hook, meet world”). | Rewritten in creator shop talk (“Stay close for the first replies.”). |
| Ghostwriters and founders were an afterthought. | New “For creators, by creators” section with a tab each for solo creators, founders and ghostwriters. The app gained client voices (⌘1–3 switcher), a “Writing as” pill, approvals (“To approve” / “Approved”) in the queue with approve and send-back actions, and a “Waiting for approval” list. |
| Bento cards half empty. | No bento. Every visual is a product crop at a size where it can be read. |
| Gradient headline text. | Removed from the system (also flagged by the detector). |
| Sidebar crowded with a streak widget and plan meter. | The sidebar keeps navigation, a voice switcher and one line for the free plan. Momentum moved into the Queue, where cadence is planned. |
| The preview pane was a detached card. | It's now “In the feed”: your draft sits between faded posts from other people, the way it will actually be seen. |
| Particles standing in for a point of view. | The murmuration engine is deleted. Onboarding uses the same drifting ghost feed as the landing page. |

Also fixed while building: landing-only class names (`.chg`, `.st`, `.bars`) collided with app components (riff diff, onboarding steps, hook grader bars). All landing selectors are now scoped under `.land`.

## Round 5: Keynote for creators

Scored before this round: 1/10 by the owner ("generic and static"). The owner's asks were real-looking posts with profile pictures, platform-true UI in the app and on the homepage, motion, and Linear, Arc and Apple as references.

| Problem | Fix |
|---|---|
| Static, generic hero. | A 3D ring of X posts turns and brakes on one. The stopped post comes forward, its neighbours step back and dim, its first line is highlighted, and a hook-score chip appears. You can drag it, it has inertia, it pauses off-screen, and it respects reduced motion. |
| Posts looked like placeholders with no profile pictures. | Platform-true renderers for X, Threads, LinkedIn and Bluesky use researched specs (type, spacing, colors, count formats, action rows). 18 photoreal portraits and 6 photos were generated in Higgsfield and ship as two sprite sheets. The creators are fictional and labelled, with no verified badges. |
| The app preview didn't look like the platforms. | "In the feed" now renders your draft with the same components as the homepage, between real neighbour posts, in your theme. It shows over-limit text in X red, thread rails, LinkedIn's "…more" fold, and projected counts. |
| No story. | A pinned, scroll-scrubbed story: 11:04pm draft, hedges struck, rewrite in her voice, scheduled for Tue 8:40, then a phone at viewport size with a live count-up and an iOS notification. It opens from an inset sheet to full bleed. |
| Creators didn't feel seen. | "We've all posted into the void" is a wall of relatable posts that drifts with scroll. The creators section has three tabbed demos made of real post UI: before and after, release notes to posts, and a voice switcher with approval. |
| Mixed typography between site and app. | Everything is now Geist (self-hosted, with a metric-matched fallback). Garamond is kept for the wordmark only. Mono is used for numbers only. |
| Uniform fade-up on every section. | Per-chapter motion: headline wipes, demos rising with a tilt, staggered phones, cross-surface view transitions between the site and the app. |

Independent finish review: round 1 disposition was **fix** (8 material fixes). All were addressed, and verdict passes followed.

One thing stays open because the environment blocks it: the sprite sheets are hosted on Higgsfield's CDN, which this build container can't reach. They load in a normal browser. If they can't load, photos collapse and portraits fall back to initials, so there are never empty slabs.

Score after this round: first impression 9, distinctiveness 9, creator voice 9, trust 8 (fictional people, clearly labelled), craft 9.

## Round 6: One brand, simpler app, new tools

Before this round the owner said the app felt different from the homepage showcase and too busy. The self-critique found two visual worlds (dark onboarding, cool-grey app, warm homepage), a logo that read as the letter J, a Garamond wordmark in a Geist system, 7 nav items, a crowded composer, jargon (Riff, Golden slots, Auto-plug, Engine) and a homepage with no one actually using the product.

| Problem | Fix |
|---|---|
| Site and app looked like two products | One token set: canvas #F5F5F3, ink, one yellow marker, pill buttons, Geist only (Garamond removed). Onboarding moved onto the same light canvas with real-looking feed posts behind it. |
| Weak logo | The First Line: a marker swipe with a caret at its end, on an ink tile. Favicon, app icon and wordmark all updated. It animates on load and hover. |
| App too busy | The sidebar is now a New post pill, Search, 5 nav items, recent Drafts and one account/voice button. The composer has a labelled Post to, Schedule, and ···. The hook chip and ring appear only once there's text. The shortcut footer is gone. |
| Jargon | Renamed as Rewrite, Best time, Follow-up reply, Ideas for you, Your voice, Hook formulas. Times read 8:40 AM everywhere. |
| No "people using it" on the homepage | #demo: a Notion-style window built from the app's own components with a live preview. Four scenes (Sharpen, Visuals, Niche radar, Schedule) play with a cursor, loop while on screen, and have opt-in sound. |
| Creator pains unaddressed | Sharpen (select words, flip three takes, keep one), Visuals (quote card, before/after chart from your numbers, post screenshot, framed screenshot), Niche radar (trends, why posts popped, reusable structure, write your take). |
| No sensory feedback | Synthesized UI sounds for tick, tap, hook ≥70, keep and scheduled. The marker sweeps under a first line at 70+, the single threshold everywhere. |
| Main audience invisible | Crypto and trading writers are now first-class: first onboarding niche, trader posts in the ring and wall, a trader as the solo creator, and six new trader portraits. |

Independent finish review: disposition **fix** with 8 items, then two verdict passes. Every item is resolved except one, which is blocked on the owner: the trader portrait sheet `assets/people/avatars-2.jpg` must be added to the repo (it is hosted on a CDN this container cannot reach). Until then those six faces show initials.
