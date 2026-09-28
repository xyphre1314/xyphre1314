# Murmur: hard critique, and what changed

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

Murmur is being replaced. 142 candidates and a ranked top 10 with domain checks are in `NAMES.md`. Recommendation: **Wren**.
