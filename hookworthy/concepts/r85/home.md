# Home (r85): every reviewer fix, applied

Built from `scratchpad/r85/fix/work/src.html` (+ `sprite.txt`, `tail.txt`) with `python3 build.py`. Source review: five experts on r84 (brand 7, web 7, UI/UX 6.5, co-founder 6, marketing 6; 134 issues). Where they disagreed, FIXPLAN decisions A–G won.

## Conversion: one way in
- **One signup sheet** (`<dialog>`, focus trapped, Esc and backdrop close it, focus goes back to the button that opened it). Title "Start free" (or "Start with Pro" / "Start Studio" / "Welcome back" for Sign in), Continue with X, Continue with Google, email + Continue. It shows "Your line:" when the visitor has sharpened one. After any choice it says only: "This preview doesn't create accounts yet. The live site signs you in here and keeps your line." with "Open the demo app" (new tab). It never says an account was made.
- **CTA map:** nav Start free, hero Start free, Sign in and the phone bar open the sheet. Hero "Try it on your line" scrolls to the Try tile, focuses the box and selects the example so a paste replaces it. "Keep it. Start free" sits under every sharpened result (Try + final) and carries that line. Plan buttons open the sheet with plan and billing preselected: Free "Start free", Pro "Start with Pro", Studio "Start Studio".
- **Pro is the featured plan** (brighter card, the only white plan button). No trial is offered anywhere.
- **Phone:** one sticky "Start free". The nav's Start free steps back while the bar is up; the bar hides over the Try tile, the plans, the final and while the sheet is open.
- Final: submit says "Sharpen"; once your own result shows, a white "Keep it. Start free" appears under it and the submit drops to glass. Empty submit says "Paste a line first". On phones the result scrolls into view.

## Truth
- Trust: "Nothing goes out / without your say-so." Body: "Every post is one you wrote or approved, sent at the time you picked." Never list: Auto-DMs, Auto-deletes, Auto-follows and likes. Plus: "Plug replies and reruns run only on rules you set, and you can switch them off." Auto-replies and auto-reposts are gone. The tile is static; nothing presses Post.
- Pricing lines: "15 scheduled posts a month, sent at the time you pick", "Up to 500 scheduled posts a month, sent at the time you pick". Lede: "Sharpen any line, free and unlimited. Rewrites in your voice run on Claude: 20 a month free, 250 on Pro." Touch-ups and "add up to 1,750" removed. Toggle: "Yearly · save 25%". Studio unit "a month, per client".
- "Try another example" (was "Watch another real one"). "X now pays creators for original posts, not replies." (undated). Day: "You pick the time. It goes out then." Phone label: "Posted at 8:40 AM, the time you picked".
- **Engine honesty** (core.js untouched; all on the page): empty → prompt, no result, Sharpen disabled. Fewer than 3 real words or keyboard mash → "Give it a real line, a few words, and Sharpen has something to work with." Over 280 → the first line is sharpened ("Your first line, sharpened") and the note says "Over 280 for one X post. Hookworthy can split it into a thread." (or "Now it fits in one post."). If fluff is flagged but the engine returns the same line (or a broken one-word question), the flagged words are cut with `softCut` and tidied; "Already sharp. Nothing to cut." appears only when nothing is flagged. A contraction-only change counts as no change. Every cut word is struck (word-level diff) and listed. "gm"-style openers are kept ("Kept your gm."), and a hedge in front of a price call stays ("Kept your “i think”: on a call, it’s your stance, not filler."). Label is "What changed" for tidy-ups, "Why it hits" for real moves.

## Motion and interaction
- No hover, focus or background-click replays anywhere; no hover lift. The page never presses a visitor's button: Studio waits on Priya with "Approve as Priya" pulsing once; Previews opens on X and the Threads chip pulses once; Trust is static.
- Illustrative moments play once on arrival: Try (squiggles draw, fluff is struck and falls away, post lands), Day (11 PM note → 8:40 AM slot → the post slides into the feed → "taking off"), Replies (the drafted reply types in). Each has a quiet, keyboard-reachable "Replay". Reduced motion: finished static state, no Replay buttons.
- The fluff now falls in the hero too, once on load and once per example pick (copies peel off exactly over the struck words).
- Intro settles by ~1.4s (was 2.2s); scroll tilt removed; pop is a plain 8px fade-up (no blur, scale or spring); preview tabs swap with a short fade instead of a 3D flip.
- Studio: the comment's edit is applied when you approve ("down 34% since June", "the four I closed"), then "Priya approved. Scheduled for Tue 8:15 AM." Every client has a photo and the same height; switching fades. Real queue rows replace the skeleton bars.
- Replies: plain-text editing, Enter = Done, Esc = undo the edit, ⌘/Ctrl+Enter = Reply; sent state "Sent." + Undo. The drafted reply now matches the post ("until i get a green day").
- Try: ⌘/Ctrl+Enter (hint on the button for mouse users), "Use my line" (was Clear), starter chips (Trader, Founder, Newsletter, Ghostwriter, Already sharp), counter goes negative past 280, the box stops growing at 5 lines, chips use aria-pressed, no title tooltips.
- Pointer light is a compositor-only white glow (mouse only).

## First screen
- Sub: "Hookworthy sharpens your first line in one tap and schedules it for X, Threads, LinkedIn and Bluesky. It still sounds like you." (2 lines at 1440).
- Hero CTAs: Start free / Try it on your line. The window's Sharpen button sits in the Draft header at every width; "Why it hits" and "Kept" sit under the post; the composer's Schedule pill is no longer a white (fake) button.
- Sharpened post above the fold: card bottom 828px at 1440×900, 796px at 1280×800.

## Order and flow
Hero → Try + Previews → new "It learns how you write. / You choose every change." voice tile (lowercase stays lowercase, your numbers first, short lines, a never-say list with the fluff mark, "Keeps “ngl”") → 11 PM → 8:40 AM → Replies + Results → Who (one hook each: trades, newsletter, building in public, ghostwriting → Studio) → Studio → Trust → Pricing → FAQ (5 disclosures: sound like me, post without me, AI writing, clients' accounts, what's free) → Final. Nav: Try it · For ghostwriters · Pricing · FAQ.

## Brand
- Wordmark with the hook-h in nav and footer (drawn h, live "ookworthy"); a big 6% wordmark closes the footer on tablet and desktop. Favicon (inline SVG), apple-touch icon, Open Graph + Twitter card → `assets/og-afterglow.png` (new 1200×630 Afterglow card rendered with Playwright).
- Ember means one thing: `.lit-card` warm rim only on sharpened or drafted lines (hero post, Try result, final card, the phone-feed post, the drafted reply, the line in the sheet). The final panel has the second light: an ember hairline and glow landing on the sharpened card, plus a spec line on it.
- One squiggle spec (1.5px, .28em) and one strike spec (.62 alpha at 56%, max(1.5px,.07em)) everywhere; the squiggle now runs through the middle (voice tile, Day draft, Studio never-says).
- Results sit on a blurred 8:40 AM sunrise instead of the cold sticky-note wall. Photos and avatars graded once; bright avatars dimmed.
- Type: four display steps (120 / 72 / 40 / 26); weights 400/500/600 (+650 for names in X cards); whole-pixel UI sizes; subs and ledes in ink-2. Icons: non-scaling 1.5px strokes. Name casing: "Hookworthy" everywhere typed.

## Layout, responsive, performance
- Pricing stays 3 columns down to 901px; compact stacked cards below (one key line each on phones, the rest behind "See everything included").
- Tablet: Previews pairs with Replies, Results with Who; nav links show to 900px; final panel stays 2 columns to 901px; `.demo{margin-top:0}` so captions never float over gaps.
- Phones: 9.5 screens at 390×844, 10.5 at 360×780 (was 9.9 / 11.2), paid for by a clipped preview feed, compact voice tile, final example hidden until you type, trimmed Studio/Results/footer, one-row hero chips and starters.
- core.js loads on idle, near the Try tile or final, or on first touch; the Try example is pre-rendered so nothing waits. Grain moved from a fixed full-page layer to the hero; backdrop blurs removed where they were invisible (window, glass buttons, cards).

## Verification (this build)
check.js ok: true · axe 0 violations at 1440 and 390 · CLS 0 at 1440 and 390 · phone 9.51 screens (390) / 10.50 (360) · sharpened post above the fold at 1440×900 and 1280×800 · sheet opens from nav, Sign in, hero, both Keep buttons, all three plans (with billing) and the phone bar, traps focus, Esc returns focus · Try + final: normal, empty, "asdf", 319/322-character lines, "so i think honestly basically it is kind of good" behave as specified · no tile replays or acts under hover, focus, tab or background click · screenshots checked at 1440, 1280, 1024, 768, 390, 360.

## Skipped or changed, and why
- **brand-9** (re-export you.jpg with a dark background): asset edit outside this round's scope (only the OG image may be added). Faces are now circles.
- **brand-21** (ember pointer light): conflicts with decision F (ember only on what Hookworthy sharpened). The glow stays white, softened.
- **brand-23** (giant wordmark): applied on tablet and desktop, hidden on phones to stay under the screen budget.
- **web-10** (Studio as its own section): decision E keeps Studio in the bento, after Who.
- **web-13** (2× images): no higher-resolution source exists.
- **web-16** (move the morning label right): the label stays left; the Replay button takes the right corner.
- **web-2b** (hide the Who hooks on phones): decision E gives each audience its hook, so they stay.
- **web-26** (delete queue rows): replaced with real rows instead (uiux-23).
- **uiux-2 / web-18** (make Post a real button in Trust): decision C makes Trust static, so the pill is gone.
- **uiux-5 / marketing-2 / founder-2** (hero CTA variants): superseded by decision A.
- **uiux-9** (draw the split line on arrival): decision C keeps Previews to a single pulse.
- **uiux-13** (strike only, no fall): decision C keeps the fall as the illustrative moment; strike and fall now play in sequence, aligned.
- **founder-5 / marketing-15 / marketing-18** (Never-strip wording): superseded by decision B.
- **founder-6, founder-8, marketing-4 (engine part), marketing-25 (gm in core)**: need core.js changes and eval tests, out of scope ("Don't edit core.js"). The page guards the worst cases (hedged price calls, gm, contraction-only, broken one-word questions).
- **founder-9 / founder-10** (exact order; replace Who with Voice): superseded by decision E (Voice tile added, Who kept).
- **founder-12** ("That was free Sharpen" line): the Keep row carries "Free forever · No card" instead, to keep one message per row.
- **founder-15** (Pro trial button): decision A, there is no trial.
- **founder-19** (six FAQs incl. trial/Typefully): decision E sets five specific questions.
- **founder-24** (own-account rule in Studio): the fact isn't confirmed; nothing invented.
- **founder-27** (maker line): no real name and handle available.
- **marketing-8 / founder-3** (hero sub wording), **marketing-16 / founder-11** (dated why-now): superseded by decisions D and B.
- **marketing-12** (#p-h "Pro when you post every day."): breaks the two-line rule at 390, so the heading stays "Sharpening is free. / Forever."; the Pro card says "For posting every day."
- Hero sub is 3 lines on phones (2 at 1440 and 1280); shortening it further would drop where it posts.
