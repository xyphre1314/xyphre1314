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

## Round 7: owner review, brand and clarity

What the owner said, and what changed:

| Problem | Fix |
|---|---|
| The logo (marker swipe + caret) felt weak next to Typefully | New mark: a lowercase h whose last stroke flicks up into a hook, on one tile. Reads at 16px. Three options on the board. |
| The yellow felt cheap | Yellow retired. Flow blue accent (Wispr Flow–style palette, in blue), soft tint as the highlighter. Four alternates in Appearance. |
| Too black / too white | Dusk (#1B1B1A warm charcoal) and Paper (#F7F5EF ivory). |
| Couldn't find how to close the preview | Top bar toggle now says “Preview” and shows pressed; the panel has a visible “Hide”; ⌘\\ works while typing (it didn't before). |
| “Do we need Hooks? What's Inbox?” | Hook formulas moved into the hook panel, offered when your line scores under 70. Inbox renamed Saved; tabs are Fresh angles / What’s working / Saved, each with a one-line purpose. |
| Writing should feel better | Focus mode (⌘.) with typewriter scrolling; Before-you-post checks for the details people miss; formulas add above your line instead of replacing it. |
| Copy felt like a system | Toasts, empty states and placeholders rewritten to sound like a coworker. |

Detector: colored glows removed (accent-glow is neutral now); advisories were DESIGN.md drift, fixed by updating the tokens.

## Round 8: "Bluebird" (readability, type-only logo, Wispr-style blue)

| Owner said | Fix |
|---|---|
| Some colors are very hard to see (Pro card, dark pill on a post) | Pro card read tokens that only exist on the homepage, so its text inherited dark ink on a dark card; it's now an explicit cobalt card with white text. The dark pill was a class collision: the radar card and X's reply button were both `.rp`. Renamed. Then an automated contrast audit across every route and key state in both themes found and fixed status chips, deltas and the nav over dark chapters. |
| Use a typography logo | *hookworthy* in Instrument Serif italic. No symbol in the UI. |
| More colorful, Wispr Flow–like, but blue; the last one looked ugly | Sky canvas, navy ink, cobalt action, five pastels with AA inks for post kinds and reasons, soft washes, navy chapters with cobalt/violet light. |
| Their kind of typography | Instrument Serif display with italic emphasis, Geist for UI. Also on quote cards, prices and big numbers. |
| Apply it everywhere | Homepage, demo, app (all routes), onboarding, upgrade, design-system page, visuals canvas, icons, favicon, manifest, docs. |

Open advisory: the detector flags navy-tinted shadows as a "colored glow". They are elevation shadows tinted to the palette at low alpha, kept on purpose.

## Round 9: hard critique, then "Harbor & Cream"

Critique of round 8 (owner: "looks really bad"):
1. Generic SaaS blue (#2355F0 ≈ Tailwind blue-600) on logo, buttons, charts, avatars and toggles: no ownership, no hierarchy.
2. Three or four solid blue pills per screen shouting at once.
3. Pastel washes and glows read as "AI gradient", not design.
4. Navy-on-navy dark mode: flat, low separation.
5. Instrument Serif is condensed; short titles looked squeezed, and it fought Geist's technical tone.
6. Homepage chapters were all one template with no color rhythm; the app was card soup.
7. Insights mixed serif, sans, mono and red/green in one sentence.

Fixes, grounded in Wispr Flow's actual tokens: cream canvas and ink text; EB Garamond 400 only at 32px+, roman + italic; Figtree for UI; periwinkle buttons with an ink border and a 10px radius; harbor blue and ink as big rounded blocks; eyebrows; announcement bar; floating bordered nav; squiggle underline; no washes or glows; sans numerals in sentences; wordmark hook*worthy*; warm charcoal dark mode.

## Round 10: palettes and a Wispr dark mode

Owner: "that blue is horrible", wants 15–20 options including rainbows, and a dark mode that feels like Wispr.

- Brand color is now a palette of five variables read by every surface. 20 palettes ship (12 soft pairs, 2 earthy, 6 rainbow), each validated for contrast on buttons, links and blocks in light and dark; switchable live in the app.
- Default moved from harbor blue to Lilac & Plum.
- Dark mode rebuilt on Wispr's dark: #1A1A1A, cream text, pastel buttons with ink text.
- Every homepage text on a colored block moved from fixed greys (tuned to one blue) to cream alphas, which is what made the rainbow palettes readable.
- Board of all 20, with real screenshots, published as an artifact.

## Round 11: visual QA sweep

Owner found tight text, a homepage week that didn't match the Queue, a clipped LinkedIn card, and ghost text when opening drafts. None were intentional.

- Figtree no longer has negative tracking anywhere; only the Garamond display sizes keep it. Headline line-heights opened to 1.02–1.06 with more room before the sub.
- Demo caption: 17px at 1.5, 40rem wide. The demo preview keeps the editor's line breaks.
- One calendar: `calGridHTML` and `qcardHTML` render the app Queue, the homepage week and the demo's Schedule scene, so all three match. The demo now opens the real schedule sheet, then lands the card in the Queue.
- LinkedIn card uses a container query: its action bar stacks icon over label under 420px, so nothing clips in narrow columns.
- Composer preview becomes a bottom sheet at 1180px (was 980), so the top bar never crowds at 1024.
- Ideas grid auto-fills columns at min 272px.
- Sidebar view transition no longer cross-fades, which caused the ghost text on draft clicks.
- Checked with a clip/overlap detector and screenshots at 390, 1024, 1280, 1440, 1536 and 1920; remaining flags are intentional (scrolling chip rows and weeks on phones, mid-animation rewrites, clamped previews).

## Round 12: plum locked, the app critiqued hard, features people will feel

Owner: lock Lilac & Plum, use their avatar as the demo profile, critique everything (the app most), and add relatable features where every detail matters.

**Critique (what was wrong)**
- The demo account had two faces: a plum "SO" in the composer and a mustard "SO" in the preview. Now one portrait everywhere: sidebar, composer, all four previews, quote cards, and the homepage demo, which now shows the same account as the app.
- "Draft saved" on a blank page is a small lie. It now says "New draft" with a grey dot until there's something to save.
- Focus mode used the same target icon as "best time" and preflight. It has its own frame icon now.
- Hook formulas had no place in the nav (Ideas lit up instead). Hooks is its own item, with G H.
- "avg 69" on hook cards read like a stat nobody asked for. Now "Scores ~69" with a tooltip.
- The never-say list on Your voice wasn't checked when you wrote. It is now, with a one-click swap.
- Phones could not reach drafts or hooks at all. Both are in More.
- The design system page still said "Sky and Midnight, one blue" and "harbor tile", and the app icon was a glossy gradient. Copy and icon are plum and flat now; theme names are Light and Dark.
- Voice's "You sound" card had a dead half. It now ends on your most "you" post, the one rewrites are measured against.
- The queue rail explained best times in a whole card. That moved into the legend's tooltip, and the room went to reruns.

**Features added, and why they matter**
- **Undo send.** Post now waits 8 seconds with a countdown bar; Esc or ⌘Z takes it back. Everyone has spotted the typo a second after posting.
- **The 1 AM guard.** Posting between 11 PM and 6 AM asks first and offers the next morning slot in one tap. Posting while your people sleep wastes the first hour the feed judges you on.
- **Cringe check.** "Thrilled to announce", "Let that sink in", ending on "Agree?", emoji pile-ups. Named plainly, cut in one click.
- **You said this before.** A draft that's 60% the same as a past post shows the old one, its views and when. Rerunning is fine; doing it by accident isn't.
- **Tidy up drafts.** The draft graveyard, one card at a time with its age and hook score: finish it, give it the best time, or let it go (B / K / S / ↵), with undo at the end.
- **Worth a rerun.** Your best post from 2+ months ago, with a fresh first line. Most of today's followers never saw it.
- **Rest days.** Pick days that don't break your streak. Streaks that punish weekends make people quit.

## Round 13: real Claude, your real history, a real backend

Owner: implement the plan to beat Typefully, make the AI good, use their own Claude to test, import past posts (Typefully, an @handle, the people they follow).

**AI, three ways in (same prompts everywhere, in `core.js`)**
- claude.ai artifact: the viewer's own Claude through the `sample` capability. Rewrites and ideas on the default tier, voice study on complex, hook critiques on quick. Asks once per visit; declining falls back to the offline editor.
- Hookworthy server: Sonnet 5.5 for everyday writing (low/medium effort), Opus 5.5 for voice study (high). Refusal fallbacks on. Verified end to end against a mock Messages API: every call carried the right model, effort and fallback header.
- Offline: the old heuristics, now clearly labelled "Offline editor".
- Prompts are built for voice fidelity: never invent numbers (use [number]), match casing and habits from the author's own best posts, a banned list of AI tells, three genuinely different takes per call.

**Your history**
- Bring your posts: X archive (.zip or tweets.js, parsed in the browser; retweets and replies to others dropped, self-replies folded into threads), Typefully (API key via server, or CSV), LinkedIn Shares.csv, any CSV, pasted posts, or an @handle through the X API on the server. No scraping: X forbids it; the archive has more history anyway.
- Learn my voice: Claude reads up to 120 posts and writes the profile every rewrite uses (traits with evidence, habits, what would sound wrong, what works, the most-you post).
- Insights run on your posts: best post type vs your median, when your posts land, engagement per day, top and quietest posts with a "Why?" post-mortem, and cards that only appear when a difference is real (20% either way).
- The hook score is checked against your own results ("hooks 70+ earned 2.3× the ones under 50 on your posts"), and says so honestly when it doesn't predict.
- People you learn from: handles (server) or pasted posts; Claude pulls out reusable patterns with a fill-in-the-blank first line.
- Reruns, "you said this before" and Remix now use your history.

**Backend (`server/`)**: static app, `/api/ai`, X read (posts, people, metrics), X posting (OAuth 2 PKCE, threads), LinkedIn posting (OpenID + Posts API), Typefully import, a posting queue checked every 30 s, a keyless `/api/v1/check`, rewrite and ideas endpoints, and an MCP server (grade_hook, check_post, rewrite_in_voice, schedule_post). 21 tests, no keys or network needed.

**Not verifiable here**: live X, LinkedIn and Typefully calls (the sandbox blocks those hosts and there are no keys). They're built to the public API shapes and covered by mocked tests; the first real run should be watched.


## Round 14: the small stuff creators notice

Owner: check the app again; every minor detail matters, that's what beats Typefully.

- **Phones could hide the toolbar for good.** The "fade while typing" chrome only came back on mouse movement, so on a phone Rewrite, images and Add to thread stayed invisible until you left the field. Touch screens never fade now; on desktop the chrome returns after a 1.6 s pause.
- **Character counts now match X.** Links count as 23, emoji and CJK as 2 (the twitter-text rules), so a long link no longer triggers a false "over the limit" and 150 emoji no longer slip past. The counter's tooltip says why when it matters. Splitting uses the same count.
- **Double Enter explains itself.** After one Enter at the end of a paragraph: "↵ again starts post 2 · Shift ↵ for a blank line" (shown the first few times only; phones get "Return again starts post 2"). LinkedIn-only posts never split, since LinkedIn has no threads.
- **Pasting a thread lands as a thread.** 1/ 2/ 3/ numbering, or blank-line blocks that each fit a post, become separate posts, with "Keep as one post" to undo.
- **Toasts no longer cover a dialog's main button** on phones: opening a dialog clears them.
- **Past posts show as sent.** A scheduled post whose time passed shows "Sent · 8:40 AM" (the old corner badge overlapped the text in narrow columns); its menu says when it went out and links to the live post when the server posted it.
- **Search stopped matching nonsense.** Typing "sch" no longer pulls hook formulas that merely contain s…c…h.
- **Words:** "Post now" everywhere (it said "Publish now" in one menu); "Built-in editor" instead of "Offline editor" (it isn't offline, it just isn't Claude).
- **Small comforts:** hover a draft in the sidebar for its full first line, age and length; hover "Saved" for when; the schedule dialog names your time zone; the undo window is a setting (8 s, 15 s, 5 s or off).
- **A crash** when the caret moved in a field that had just been replaced (paste, new post) is fixed.

## Round 15: the features that make it a daily habit

Owner: build all of them.

- **First-hour reply desk.** After Post now (toast action), from a sent post's menu, or ⌘K. Live replies from X through the server, ranked questions and reach first; your own replies skipped. One Claude call drafts a reply for each in your voice; "Reply" posts it (server) or opens X's reply box with the text ready. Sample replies are labelled as samples; you can paste real ones.
- **Plan my week.** In Queue (and a nudge when fewer than 3 posts are lined up). Claude drafts five posts for your next best slots from your saved ideas and top posts; review one at a time (schedule ↵, skip K, edit E). Offline, it builds them from your ideas.
- **Share from any app.** The installed app is a share target: sharing a link or text from Safari, X or Notes parks it in Ideas and shows angles.
- **Review links with comments.** "Share for feedback" makes a link to a clean page showing the draft as it'll look, with a comment box per post. The composer shows "2 comments · 1 new" and opens them grouped by post. Without the server it copies the draft as a ready-to-paste message.
- **LinkedIn carousel (PDF).** Thread → cover, one slide per point, a follow slide; Paper, Plum or Lilac; 1080×1350. Written by a tiny built-in PDF writer (no library, works offline and in claude.ai through the download capability).
- **"Sounds like you" meter.** Next to the hook chip: how far the draft drifts from your measured habits (sentence length, emoji, hashtags, casing, never-say words, AI tells). Tap it to see what sounds off; each item selects the words so Sharpen can fix them.
- **Hook shootout.** A vs B on the Hooks page, judged by your most similar past posts (and Claude when on). Every call is kept, and checked once the post shows up in your history ("3 of 4 called right").
- **Evergreen reruns.** An Autopilot switch: once a week, a best post from 2+ months ago comes back with a fresh first line in an open (non-best) slot, tagged "Rerun".
- **Sunday note.** Insights opens on "Your week": posts, likes, streak, what's lined up. Claude writes the note (best post and why, one thing to try, Monday's first line). "Email me Sundays" sends it at 9 AM via the server.
- **Launch:** end-to-end encrypted sync across devices (a 20-character code; the server stores ciphertext only), a Dockerfile and Render blueprint, a sign-in link for locked servers, and a nudge when the X archive you requested should be ready.
- **Bug found while testing:** the service worker was caching the server's API (health, reviews, sync), so live data went stale. API, sign-in and review pages now bypass it, and the page itself is network-first.


## Round 16: polish you can hear and see

- **Demo caption bug.** A blanket `.hw p{margin:0}` reset out-ranked `.dm-cap`, so the caption hugged the window and sat left. The reset now has zero specificity (`:where(.hw) p`); the caption is centered with 44px of air, and two other captions got their intended spacing back.
- **LinkedIn fold.** "LinkedIn · light" (it meant the light theme) is gone. In its place: a live status, "Your hook makes the cut" or "gets cut off". The meter used to guess 46 characters a line and disagreed with the card; it now measures the rendered, phone-width card, so the number and the picture always match. The textarea grows with the text (no inner scrollbar).
- **Voice sliders.** Five spice steps × three polish steps of one idea (was 3 × 2). Only the words that change move: a word-level diff blurs them in with a lilac flash, counts tween toward the new spice, and a line says "Same idea. 4 words changed."
- **Sound and typing.** Demo sound is on by default. Browsers stay silent until your first click, so the pill says "Tap for sound" until then. Text in the demo is typed like a person: uneven rhythm, a pause after punctuation, the odd slip fixed with backspace, with soft key, space and backspace sounds. The editor gets an opt-in "Typing sounds" setting.
- **Visuals that impress.** A visual director (`visualPlan` in core.js) reads the post and picks the picture: Numbers (before → after), Big number, List, Side by side, or Quote. It copies figures exactly, works out the delta (+81%, 12×, "from zero", and knows lower churn is good), names the metric, and writes the headline. With Claude on, it gets a second pass under the same rule: never invent a number (any figure not in the post is rejected). The new canvas renderer adds gradient paper with grain and a plum glow, three chart looks (columns with a hand-drawn arrow, a glowing line, a ring), a marker-highlighted phrase on quotes, and an editable headline and label. The homepage demo now uses the same renderer.

## Round 17: honest limits, briefs in, voice in

- **X plan decides the length.** When X is connected, the server reads the signed-in account's own plan (`subscription_type` from `/2/users/me`, falling back to a blue `verified_type`). Paid plans (Basic, Premium, Premium+) can post up to 25,000 characters; everyone else gets 280. Free accounts can't pick "Long post": the app keeps 280 per post and threads the rest. It says why, and offers "I have Premium" only when the plan came from the writer rather than from X. Premium accounts get a Thread / Long post switch. Switching to Long post joins the thread; switching back splits it at 280. The X preview shows what the feed shows: the first 280 characters, then "Show more". Without a connection, a self-reported plan is labelled "You told us", never "verified".
- **Write from a brief.** Drop notes, a Word doc, a PDF or Markdown, paste, or talk it through. Step 1 reads the files in the browser (.docx unzipped natively, PDFs best-effort; on the server, Claude reads the whole PDF as a document). Step 2 shows the facts it will use with the brief's exact words, gaps worth filling (each with an "Add" box that writes into the brief), hype that needs proof, three angles, and a shape: X thread, X long post (Premium only), LinkedIn post, or one post. Step 3 drafts in your voice and fact-checks the draft: any number that isn't in the brief is marked "check this", and [blanks] are highlighted.
- **Talk instead of typing.** A mic in every post uses the browser's own speech recognition, and words land at the cursor as you speak. It understands "new line", "new paragraph", "new post" (starts the next post in the thread), "comma", "period", "question mark" and "scratch that". Ums are dropped on the fly. Afterwards, "Tidy it" removes fillers and repeats, and Claude re-says it in your voice when it's on. Where the browser or page blocks the mic (for example, inside the claude.ai preview), a help sheet points to system dictation (Fn Fn on Mac, Win+H on Windows, the keyboard mic on phones).
- **Headline.** "Good ideas die in *bad first lines.*" on two lines at desktop, with the squiggle under "first lines."

## Round 18: the whole-app audit

Method: an automated sweep of every screen and modal in light/dark × desktop/phone (errors, overflow, clipped text, contrast, unnamed buttons, broken images), three independent reviews (desktop visual, phone visual, a functional click-through that tried to break things), then fixes and a re-run of every reproduction script.

**Bugs fixed (verified by re-running each repro):**
- A saved state with missing pieces blanked the app forever. It now heals field by field.
- The last keystrokes were lost on reload. The draft now saves on pagehide/visibilitychange.
- Double-clicking "remove" deleted two posts. It's guarded now, and Undo puts back the right one.
- An old rewrite panel could apply its rewrite to a different post. Starting a new rewrite now closes the old panel.
- Command-palette actions run from another screen did nothing, or threw. They now wait for the screen to render.
- Modals left keyboard focus behind them, so typing edited the draft underneath. Focus now lands on the first usable field.
- Posts pasted without dates drew NaN charts and "0× your median". There are now honest states for "no dates" and "no numbers".
- Queue "Post now" skipped client approval.
- Voice typing kept listening after leaving the page. It also now stops after 12 seconds of silence.
- Edits made during the undo countdown were thrown away. The editor is read-only while sending, and toasts no longer cover the send bar.
- Drafts were capped at 20 without warning (now 100).
- The phone composer had no ⋯ menu, no poll and no remove.
- Make a visual could attach a placeholder image with "undefined" alt text. It now tells you what the picture needs.
- Long post mode still split at Bluesky's 300. Long posts are X-only, and the other platforms switch off with an undo.
- Uploads made things up: "voice memo" invented a transcript and "screenshot" invented a quote. Capture now uses real dictation ("Say it") and saves files as what they are.
- Plan my week: the K/E/↵ shortcuts typed into the post.
- Merging posts could create a post with both a poll and media.
- Also fixed:
  - identical shootout lines, and duplicate shootout history
  - "Thus are rest days"
  - handle-derived names with double spaces
  - URL words graded as filler
  - empty follow-up text accepted
  - offline translation that was word-swapping gibberish (now needs Claude)
  - a hook grade that quoted "i think" in lowercase
  - doubled periods in queue labels
  - Focus mode missing from the shortcuts sheet

**Design fixes:**
- On phones, every modal is a bottom sheet that fits the screen, with the header and actions pinned.
- Touch targets are at least 36–44px.
- Dark-safe tints and callouts; visible score tracks and toggles.
- No "Close Esc" tooltip popping up on open.
- Plain language instead of setup jargon ("Basic mode · AI off"; setup commands tucked behind "Self-hosting?").
- Dates read "Mon, Oct 5 · 8:40 AM".
- Queue cards align and the platform icons are legible.
- Insights: serif card headlines with aligned actions, a comparison chart in the hero, a responsive chart, and top posts that stack on phones.
- Carousel slides share one serif style.
- A real hook icon instead of a "J".
- A "Formula library" heading, and highlights that don't split words.
- A blur band under the landing nav.
- Platform previews swipe on phones, and Pro shows first on phones.

**Deliberately left:**
- The landing page stays light in every theme; the theme shortcut says so.
- GIF tiles are mood placeholders until a GIF API key is added.

## Round 19: real GIFs

- GIF search goes through GIPHY, because Tenor's API shut down on June 30, 2026. The server keeps the key (`GIPHY_API_KEY`) and caches each query for 15 minutes, since free beta keys allow 100 calls an hour. The app shows trending GIFs when the search box is empty, searches as you type, loads more with "More", and shows the "Powered by GIPHY" credit GIPHY requires.
- One GIF per post (X's rule). Polls and GIFs still don't mix. Reduced-motion users see still frames. Alt text comes from the GIF's title.
- Without a key, the picker says plainly that these are sample moods and that real search turns on with a GIPHY key.
- The claude.ai preview can't load images from giphy.com (its security rules), so real GIFs only work on your own server.
- Not yet: uploading GIFs and images to X and LinkedIn at post time. Posting is text-only for now; see the proposals.

## Round 20: pictures that post, replies that land early, pictures into posts

- **Media actually posts.** Pictures and GIFs attached in the editor go to your server once (`/api/media`), then out with the post: X gets them per post in a thread (chunked upload, GIFs as `tweet_gif`, alt text set), LinkedIn gets one picture or a multi-image post. If any upload fails, nothing is posted half-finished and the toast says why. Queue cards show how many pictures ride along. Sample mood GIFs are refused with a plain reason. X needs the new `media.write` permission, so accounts connected earlier have to reconnect once.
- **Reply radar** (Ideas → Reply radar, or the command palette). Fresh posts from the accounts you learn from, ranked by how much an early, useful reply is worth, with the reasons shown ("6 min old: the first replies get seen most", "only 2 replies so far", "moving fast") and a 15-minute clock on each card. Claude drafts a reply per post in your voice, under 220 characters, never "great post", with `[your number]` blanks it won't invent. Sending is blocked until the blanks are filled. Without a connected X account it copies the reply and opens X's reply box. The claude.ai preview shows sample posts.
- **Picture to post** (starter, palette, ⋯ menu, or paste an image into an empty draft). Drop a screenshot, chart, dashboard or DM; Claude reads it, lists each fact with where it is in the picture, flags other people's names or faces ("crop or blur them") and unticks "Attach the picture" when it finds any, offers ways in, and drafts a post that is fact-checked against the picture. "Make a card from it" opens the visual maker; "Open in editor" attaches the picture. Without Claude (or in the preview), you type the point and it drafts around your words, not invented ones.
- Also fixed: dark-mode sheet footers were see-through, so text scrolled visibly behind the buttons on phones; now opaque. Radar reasons read "1 reply", not "1 replies".
- Tested with mocked X, LinkedIn and Anthropic servers (41 server tests, browser end-to-end on desktop and phone). Not yet tested against the live services: X's v2 media endpoints, LinkedIn's Images API, Claude reading real screenshots, and what the radar's X searches cost on your plan.

## Round 21: a score that learns you, a ping when a post takes off

- **Your hook score, tuned to you.** Once you've brought in 30 posts with likes, the score stops being general rules and learns your audience: a small regression over first-line habits (a number, a question, a lowercase opener, “you”, an open loop, pushing back, lists, stories, threads…) on your own engagement, each habit's effect with the others held equal and pulled toward zero when there are few examples. A new line is scored by where it would rank among your posts ("would beat 93% of your posts, about 2.6× your usual"), with what helps it, what hurts it, and one habit worth adding. It tests itself before it's trusted: fitted on your older 75%, scored on your newest 25%, compared with the general score on the same posts, and it says which did better. Insights shows every habit's effect as a bar and the headline comparison ("Your questions do 3.7× better than your lists"). The general score is still one tap away. `/api/v1/check` takes `history` for the same score from other apps and assistants.
- **Breakout alert.** When a post sent through Hookworthy runs at 3× your usual pace between minute 8 and 45, you get a push on your phone or computer and/or an email, with its first replies already fetched and answers drafted in your voice. The alert view shows the pace against your usual curve and the three things worth doing now; "Answer the first replies" opens the reply desk with the drafts filled in. "Your usual" starts from your history and switches to your real first-hour pace after five watched posts. Web Push is built on Node's crypto (no new dependency). There's a "Send me a test" button, and the email path says plainly when the server can only log it.
- Off unless you turn it on. When on, it costs about nine X reads per post, batched across posts.
- Tested: 48 server tests, including the push encryption decrypted the way a browser does it and the VAPID signature verified; browser end-to-end on desktop and phone for the alert, reply desk, tuned score, Insights card, setup, test sends and the notification deep link.
- Not yet tested live: push delivery through real browser push services (headless browsers can't subscribe), Resend email, and X's metrics lookup on a real account. On iPhone, push needs Hookworthy added to the Home Screen first; the app says so.

## Round 22: the details

- **Best times come from your posts now.** The calendar's highlighted slots and their reasons used to be fixed, and two of them claimed to be about you ("Your replies peak here", "Highest reach last month") when they weren't. With 20+ dated posts, each slot is scored from your own engagement ("Your posts here earn 2.7× your usual"). Before that, the app shows general good times and says so: "Good times to post, in general".
- **Hints, like a good game's loading screen.** One useful line in the queue, the schedule sheet, the empty composer, Insights, and while things load (reply radar, the reply desk, picture and brief reading, post-mortems). Your own ones come first, marked "For you" ("Your best time to post is Tuesdays around 8:40 AM. Posts then earn 2.8× your usual", "Your audience engages most with posts that go out around 9 AM", "Posts around 10 PM get 48% less for you"); general ones are marked "Tip". Tap the arrow for another. Each section leads with a different one.
- **The send-off.** Post now or Schedule, and the post folds into a small stack of cards and arcs into the Queue in the sidebar (or the tab bar on phones), which pops when it lands. A two-note chime plays: crisper for X, warmer for LinkedIn, with an extra shimmer for threads of three or more. With reduced motion it's just the chime and the pop.
- **Where X cuts.** Past the limit, a dashed red line sits exactly where the platform cuts (counted the way X counts: links as 23, emoji as 2), and everything after it is tinted. The counter reads "−56 · tap to split"; tapping it moves the rest into the next post at a sentence.
- **Snapping to good slots.** While dragging a post in the queue, every slot shows what it's worth ("2.7× your usual", or "typical" before there's history). Each slot clicks as you pass it, higher for better slots, and best slots pulse. Dropping on a best slot says so; dropping elsewhere suggests a better nearby slot with one tap to move it there.
- **The first hour, live.** After posting, a small pill stays with you for an hour: a ring that drains over the hour, likes and replies rolling like an odometer, the pace against your usual, and a pulse and soft blip when a new reply lands. Tap it for the reply desk. Without live numbers it shows first-hour tips instead. It picks up again after a reload and wraps up with a one-line summary.
- **Personal bests.** When a post beats everything you've posted in the last 60 days, once and only once: a gold burst, a rising chime, and "Your best since Mar 3" (or "Your best post yet").
- Also: the schedule sheet badges and preselects the strongest slot, not just the soonest; the rerun card shows likes when there are no view counts.
- Tested: 49 server tests; browser end-to-end on desktop and phone for each item above, plus every earlier suite.

## Round 23: honest by default, and three new helpers

- **No more made-up numbers.**
  - The post preview showed likes, replies and views "projected from your last 90 days" that came from a formula. It now shows what a typical post of yours gets (times your tuned score's multiplier), and says so; with no history it shows no numbers and says why.
  - The late-night prompt claimed "your posts after midnight got a third of the replies"; it now says what's true for everyone.
  - The "you posted something close to this" check no longer compares new users against sample posts.
- **No fake paywall.** Nothing is charged yet, so the "5 of 5 rewrites left today" counter, the "Go Pro" card and the upgrade nudges are off behind one switch (`BILLING`) that brings them all back when checkout is real. The pricing page says it's a preview.
- **Nothing pretends to post.** Without a connected account, "Post now" says "Marked as posted. Nothing went out from here" with a Copy button, instead of "Posted to X, Threads and Bluesky". Threads and Bluesky say "(you post this one by hand)".
- **Removed switches that did nothing.** "Follow-up reply" and "Auto-repost" were on by default in the Queue and the Schedule sheet, but nothing ever ran them. Removed, along with the FAQ line and tip that promised them.
- **A real bug.** Sample and pasted replies in the reply desk opened X's compose box without the reply link, which would have posted the reply as a standalone post. They now copy the text instead ("Copy reply").
- **Your calendar.** Link the secret iCal address from Google, Outlook or Apple (on your server), or upload an .ics file (works anywhere, including the claude.ai preview). Best times you're in a meeting for are skipped, with a free time next to them offered instead ("Free for the first hour, next to your 8:40 AM best time"). The queue shades busy slots with the meeting name (or just "Busy"), and dropping a post into one offers the nearest free time. The parser handles time zones, daylight saving, weekly and daily repeats, exceptions, moved meetings, cancelled and "free" events.
- **Read it aloud.** A speaker button on every post reads the thread back, word by word highlighted, with speed, again, pause and Esc to stop. Long posts are read in sentence-sized pieces so voices don't cut out.
- **Hook vote.** "Ask friends which line wins" in the hook panel: two or three first lines on a link. Friends see the lines in their own random order (so the first doesn't win by being first), tap one, and see the results; you watch the votes come in and "Use this" puts the winner into your draft.
- Tested: 52 server tests (calendar parsing across time zones and DST, link safety, votes); browser end-to-end on desktop, phone and offline; every earlier suite.
