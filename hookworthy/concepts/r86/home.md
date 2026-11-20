# Round 86 homepage: changelog

Built from `scratchpad/r86/fix/work/src.html` (+ `sprite.txt`, `tail.txt`), run `python3 build.py` there. The page loads `../../core.js`.
Brief: `r86/FIX.md`. Decisions in FIX.md override the reviewers wherever they disagree.

## One engine (decision 1)
- Try and the final now call `HWCore.sharpenLine(text, { keep })` and only render what it returns. The page's own `tokens/removed/thin/HEDGES/keepFor/realWord`, `analyze()` and the `hookUp` fallback are gone. **No shim:** `r86/engine/READY.md` existed and core.js exports `sharpenLine`.
- Rendering map:
  - strikes = `cut`, at their draft offsets (`at`);
  - the "Kept: …" row = `kept`, in the hero's format: "Your $SOL, your 40% and your lowercase.";
  - label "Why it hits" + `why`;
  - the receipt above the card = `say`;
  - the note under it = `note`;
  - "Another take" cycles through `alts` (only after the visitor's own Sharpen).
- States:
  - **empty:** a prompt.
  - **thin:** "Give it a real line, a few words, and Sharpen has something to work with."
  - **sharp:** the card plus "Keep it. Start free".
  - **clean:** "Nothing to cut." / "Sharpen only cuts what’s soft. Want it to lead harder?" plus the inline button "Get a rewrite in your voice, free", which opens the sheet carrying the line. The page never says "Already sharp".
  - **unsure:** "“x” is marked, but cutting it would change what you mean. Your call." The marks show as suggestions (squiggle, no strike) under a "Marked:" chip row.
- **Put it back (decision 2):**
  - After Sharpen, the mirror carries the text: cut words dim and are struck.
  - Each struck word is a toggle (`role="button"`, `aria-pressed="true"`, "Put back “honestly”").
  - A tap or Enter re-runs `sharpenLine` with that word in `keep`. The word un-strikes, and the hint reads "“honestly” is back. Tap it to cut it again." The kept word stays a toggle ("Cut “honestly” again").
  - The same works on the final's draft card, with the quiet line "Tap a struck word to put it back."
  - Put-backs reset when a different line is entered.
- **Copy and flow in Try:**
  - Starters follow marketing-7, with "Clean line" in place of "Already sharp".
  - The default is the $SOL line (marketing-3), pre-rendered exactly as the engine returns it.
  - Keep reads "Start free" and carries no line until the visitor sharpens their own line (uiux-4).
  - Sharpen steps down to glass while a fresh result shows (uiux-13).
  - The result is held until the strike lands (uiux-16).
  - On phones, Keep scrolls into view after Sharpen, in Try and in the final (uiux-5).
- **Screen readers:** `aria-live` is off the boxes. There is one `role=status` line per box, written only after an explicit Sharpen (uiux-21).
- The final's counter never says "No fluff" (marketing-9). The final's input column is pinned at the top, so it doesn't move while you type (uiux-6/web-7).

## Hero (decisions 3, 5, 9)
- **Four examples: Trader, Founder, Newsletter, Designer** (marketing-18). Each one's line, cut words with their kind, receipt and Kept row equal `sharpenLine(draft)`.
  - `r86/fix/hero-sync.js` checks all of them, the hero's static first frame, the Try default and the final's example.
  - `--write` rewrites stale EX entries and the static frame. When a line changes, it falls back to the engine's own "why".
  - Newsletter = founder-2's 5,000-readers draft. Trader keeps the $10k draft (the engine no longer cuts "finally").
- **Copy:**
  - The receipt (`say`) is the move label.
  - Move-only cuts are struck without a squiggle.
  - The note under the draft lists the fluff cut.
- **Truth fixes:**
  - Sub = marketing-17.
  - Meta = "Posts to X · LinkedIn · Ready for Threads · Bluesky".
  - `.since` = founder-16's line.
  - Meta and OG descriptions updated.
- **Window height:**
  - One window height for all four examples: body min-height 397 / 420 / 503 / 440 per breakpoint. Re-measure with `r86/fix/heroh.js` if the engine changes the examples.
  - On phones the pills sit under the title bar, so a pick never moves them.
- **Motion:**
  - `--l` .5s, strike window .32s; the post lands ~1.1s after first paint.
  - Picks crossfade instead of blanking (uiux-9).
  - Fallen words dissolve within 22px, inside the line gap (uiux-3).

## Bento
- **Previews:** the panes take the row height (no void). A dimmed next post fills the feed, with a fade at the bottom. Type steps up at ≥1100 (web-2 + uiux-8). The first row went from 764 to 698px at 1440.
- **Voice:**
  - A full-width band: the 40px heading and its line share the top row, and the voice card reads in three columns (brand-4).
  - Keeps is interactive. "ngl" is struck; Put it back / Cut it retracts the strike. The copy matches the app's 2-put-back threshold (uiux-26).
  - Copy per marketing-13.
- **Day:**
  - The voice note loses its fake play button (uiux-25).
  - Timing is tighter (web-22).
  - 761–900 keeps night and morning side by side (web-8).
  - Grain over the photos (brand-8).
- **Results:** a 9:31 lock-screen clock (brand-7); copy per marketing-14.
- **Replies:** Replay sits at the left of the Edit/Reply row (web-9). There is a 40px hit area on phones.
- **Studio:**
  - Heading line 2 is "Approved from one link." (marketing-5); facts copy per marketing-19.
  - Columns stack from the top, one height per client (web-5).
  - 901–1199 re-composed (web-6).
  - A yes is remembered; the button says "Approve with Priya’s edit"; the done row is one line, "✓ Approved · Tue 8:15 AM" (uiux-18).
  - The phone `rv-act` min-height is 68 (web-17, re-measured: no late shift).
- **Trust:** 40px heading. Rules line: "Plug replies and reruns stay off until you switch them on." The list is unchanged, with no X good-standing claim.

## Pricing, FAQ, final, footer
- **Pricing copy (founder-6/12/13):**
  - Lede: "Sharpen every line you write, free. A rewrite gives you three takes in your voice: 20 a month on Free, 250 on Pro."
  - Free: "Schedule all you like. 15 a month go out at your time; the rest wait for one tap."
  - Pro li 1: "Up to 500 posts a month go out at your time".
  - The Studio and Pro lists follow founder-12/13.
  - "Start with Studio" (marketing-12).
- **Under the plans:** "Cancel anytime. Your drafts and ideas stay with you on Free." The sheet's paid lines end "Cancel anytime." (marketing-11 wording).
- **Phone pricing (founder-8):** the price column shows the billing terms ("$144 billed yearly"). Each plan shows two key lines (short phone copy), and the lede is hidden.
- The lede sits on the third plan column at ≥1200 (web-11).
- **FAQ (6 items):** "Can I bring my old posts?" is item 2. #qa2 = founder-5 + marketing-8. #qa3 = founder-11. #qa5 = founder-6 + "Posting every day? Pro is $12 a month, billed yearly." #qa1 = marketing-13.
- **Final:** a second beam (a small copy of the hero's) enters through the top hairline. Its hot spot is computed (`--fx`), and it lands on the card; the draft steps aside (brand-2). Radius 24, or 20 on phones.
- **Footer:** "Privacy and terms" → `../../index.html#legal`; the placeholder links are gone. Brand line per marketing-20. 2-column links on phones.
- **Giant wordmark:** sits on the baseline with `min(224px, 100cqi/5.13)`, so it never exceeds the content width (brand-1/web-20).

## Sheet
- Done state (uiux-7, marketing-10):
  - The pickers and sub hide; the title reads "This is a preview" and takes focus.
  - Copy by case: with a line, without one, and Sign in.
  - Two actions: "Open the demo app ↗" and "Back to the page".
- Top-anchored on desktop.
- 160ms exit; Esc animates too (uiux-11).
- "Have an account? Sign in" in the sheet, so Sign in is reachable at 360 (uiux-10).

## Brand system
- **OG card** (brand-3): re-rendered to `assets/og-afterglow.png` with the engine's trader line, the new hook tip and the dark avatar (`r86/fix/og/render.js`). og:image and twitter:image stay relative, with an HTML comment that deploy writes the absolute URLs. Added twitter:image:alt.
- **Avatar:** `assets/people/you-dark.jpg` (brand-5).
- **Icon from the wordmark's h** (brand-6/11): the favicon, the `#hw` symbol (in build.py) and `assets/apple-touch-icon.png` (180, full-bleed). The hook tip is lowered to 20.6 with .06em spacing.
- **Lit-card glint** (brand-9).
- **The squiggle on "fluff"** in the Try heading, with one `.sq` spec (brand-10).
- **Drawn ⌘ and ↵ glyphs** (brand-12).
- **Phone nav:** Sign in slides into the corner by the measured width (brand-13/uiux-19/web-14).
- **Tokens** (brand-14): `--ink-4`, `--x-ink-2` and `--s0…s3`, with 44 literals mapped.
- **Radius scale** (brand-15).
- **Other:** `text-wrap: pretty` on short copy and a non-breaking "2‑post" (web-10). Pointer glow created on first hover (web-23). Engine wake moved 1.6s after load, with a 240px margin (web-18). Phone body padding removed (web-15). Bottom scroll-padding (uiux-24). The 761–900 nav keeps 3 links (web-21).

## Skipped or changed, and why
- **Superseded by decision 1 (one engine; the page no longer diffs or guards):** uiux-1, uiux-2, founder-1 (page guard), founder-3, founder-17, marketing-1, marketing-21, hook-16…20. The engine items in founder-2/4 are the engine engineer's.
- **marketing-4, uiux-17:** replaced by decision 1's clean/unsure copy.
- **marketing-6 / founder-14 lede:** replaced by decision 5's lede.
- **marketing-16:** replaced by founder-16 (decision 5).
- **marketing-15 #qa3:** replaced by founder-11 (decision 6).
- **founder-15:** the Trust list and tfoot unchanged, with no X good-standing claim (decision 5); Studio line 2 comes from marketing-5.
- **founder-19 / brand-3 absolute URLs and og:url:** left for deploy, as decision 8 says.
- **web-1 copy change (shorter Founder line):** not possible, because hero lines must equal the engine. The height lock covers it instead, and the phone pills moved above the body.
- **Duplicates applied once:**
  - web-24 → brand-8.
  - web-20 → brand-1.
  - web-14 / uiux-19 → brand-13.
  - web-7 → uiux-6.
  - uiux-12 → web-9.
  - web-16 → uiux-27.
  - web-12 → brand-4.
  - web-4 / founder-18: the example waits at .35 opacity and wakes; it is never a hole.
- **Partial:**
  - uiux-14: chips show while typing and in the unsure state. After Sharpen the strikes are the toggles, so the row becomes the put-back hint.
  - uiux-15: the note is `note` only; the cut list isn't repeated, because the receipt and strikes carry it.
  - uiux-24: 40px targets via hit-area pseudo-elements, without growing the buttons (phone budget).
  - web-17: min-height 68, not 90.
  - brand-6: `assets/icon.svg` and `assets/app-icon.png` are left alone (app files).
  - brand-14: platform colours and button gradient stops stay literal.
  - brand-15: `.hw` stays 8, matching the icon's rx 8/32.

## Numbers (final build)
- `check.js home`: ok:true. axe 0 at 1440 and 390, including dynamic states (toggles, chips, clean, final live, sheet open/done, FAQ open).
- CLS 0 at 1440, 1280, 1024, 768, 390 and 360. No horizontal scroll.
- Screens: 9.57 at 390, 10.49 at 360, 9.57 at 768, 7.99 at 1440.
- Post bottom: 828 at 1440×900, 796 at 1280×800 (both above the fold); 777 at 360×780.
- Every FIX.md test line passes in Try and the final: strikes = cut, the Kept row, put back and cut again (`r86/fix/engine2.js`).
- `hero-sync.js` matches. The sheet opens from every CTA, traps focus and returns it.
- No tile replays or acts on hover or focus.

## Pass 2 (brief: `r86/FIX2.md`, re-rate reviews in `r86/rerate/`)
FIX2's decisions win where reviewers disagree. All engine text (say, why, cuts, kept) is rendered verbatim from `HWCore.sharpenLine`. The page owns only the clean label and note ("Nothing to cut." / "Sharpen only cuts what's soft…"), the unsure label and why ("Your call." / "“{word}” is marked, but there's no clean cut here."), and display-only NBSPs in times.

**Brand**
- brand-1: chips are `nowrap`. At 761–900 the Voice columns are re-proportioned, so nothing overflows from 761 to 780.
- brand-2: the hook margin is -.02em in the nav, the giant footer mark and the OG card (OG re-rendered with the current engine line).
- brand-3 (decision 8): new `assets/brand/afterglow-wordmark.svg` (adaptive), `-light.svg` and `-dark.svg`, plus `afterglow-icon.svg` and a 180px PNG. They are outlined from Inter 600 / opsz 28 at the page's lockup. The favicon and apple-touch point at them. The app's own `wordmark.svg`, `icon.svg` and `app-icon.*` are untouched.
- brand-4 / web-10: `&nbsp;` in every static time. `nb()` adds display-only NBSPs to engine text (numbers + units, times).
- brand-5: Rafael and Marco are text-only. The run shot is Lena's only. The Day tile's morning is cropped in to the skyline over the water (`.morn > .ph img{height:840%}`, `--fx:-22%`), with no runner or path.
- brand-6: handles are `@rortiz`, `@lenaf`, `@marcov`.
- brand-7: small tiles set both heading lines in ink. The lead tiles keep the white + grey pair.

**Founder**
- founder-1 (decision 1):
  - Hero sub: "Cut the fluff from your first line in one tap, then schedule it. It still sounds like you." Two lines or fewer at 1440, 1280 and 1024.
  - Platform row "Posts to X · LinkedIn · A nudge for Threads · Bluesky", shown on phones too.
  - #qa2 and the footer line follow FIX2.
- founder-2 (decision 2): the hero why and say come from the engine. `hero-sync.js` checks line, why, cut, say and kept, plus the static frame, the Try default and the final default.
- founder-3: "4 clients: $72 a month, billed yearly ($96 month to month)." The tile shows 4 clients.
- founder-4: approve writes the edited text into the queue row as scheduled.
- founder-6: the "What's free?" answer covers rewrites, including that learning your voice uses 5.
- founder-7: `keptLine()` ignores tokens inside links and handles.
- founder-8: the heycape thread leads with "i lost $4,000 in march doubling my size to win it back." across Previews, Day, Replies and Results. Jun Park is the one ask-then-answer.
- founder-9: Pro bullet 1 is "Everything in Free, plus:". The Free bullet follows decision 4.
- founder-12 (decision 6): the hero Schedule pill is a real button. It opens the sheet titled "Schedule it free" carrying the example line, under reduced motion too.
- founder-14: the fine print reads "More than 8 clients? Talk to us: hello@hookworthy.com", as plain text.

**UI/UX**
- uiux-1: the engine now protects URLs, handles, tags and tickers. The page `guard()` stays as a backstop.
- uiux-2: see brand-1.
- uiux-3: kept words get a dotted underline.
- uiux-4a: side effects of a put-back are named ("“honestly” is back, so “and” stays too.").
- uiux-5: "Paste mine" while the example shows. Once edited it becomes "Clear", with a 5 s Undo.
- uiux-6: struck words dissolve in place (blur + fade, at most 6px drift).
- uiux-7: stable names with `aria-pressed`, inside a `role=group` mirror.
- uiux-8: two email errors.
- uiux-9 (decision 7): rewrite intent → "Get your rewrite" / "Three takes in your voice. Free, no card." Done title "Not live yet".
- uiux-10: see founder-12.
- uiux-12: one chip per word, "×n", at most 6 plus "+N". "Another cut · i/n".
- uiux-13: the stale rewrite button is disabled.

**Web**
- web-1: see brand-1.
- web-2: 901–1099 `.h2.xl` 56px and `#faq .h2` 52px. Every heading is 2 lines or fewer at 1440, 1280, 1024, 960, 901, 768, 390 and 360.
- web-3: the phone beam is narrow (`--bw:130px`) and starts just past the right edge (`--lx:104%`). The hero micro row measures 4.80:1 at 360 and 6.0–6.2:1 at 375–430. Measured per pixel under the text boxes with the text hidden. The reviewer's `--bl/--k/bloom` values alone still measured 1.06:1.
- web-4: a third, dimmed feed post (Sam Okafor) fills the morning phone.
- web-5: the waveform uses fixed 3px bars.
- web-6: phone Previews `.screens` is 330px and `.pv-note` has min-height 2.9em.
- web-7: `.t-try` min-height is 698px at ≥1200 and 732px at 1100–1199. Every starter and result keeps the Try/Previews row still; only long lines grow it.
- web-8: hero body locks are 385 (≥1200), 441 (1100–1199), 453 (901–1099), 499 (761–900) and 440 (phones). The spare space carries the "Cut" chip row under the draft.
- web-9: the 901–1199 `.hmeta` is a column.
- web-11: phone hit areas on the toggles.
- web-12: `.bill .sv` margin is -6px.
- web-13: `.nev` max-width is 560px at 761–1099.

**Marketing**
- marketing-1 / 2 (decisions 3 and 4): the Free bullets follow FIX2. The rewrite lede shows at every width.
- marketing-3 / 4:
  - "Approve as Priya, with her edit" / "Approve as Lena".
  - Draft → scheduled with the edited text.
  - One merged facts line.
- marketing-5 / 8: from the engine ("Number first · Made it active", "Cut N bits of fluff").
- marketing-6: "Trades, launches, issues. / Each one opens stronger."
- marketing-7 / decision 10:
  - The final default is "just wanted to say that i held $BTC through a 30% drawdown and it paid off" (engine: sharp).
  - Hero, Try and final drafts all differ.
  - New Voice body. `.who-n` dropped.
- marketing-10: Previews notes follow the review.
- marketing-11: the Voice before/after copy follows the review.
- marketing-12: "Say it at 11 PM."
- marketing-14 / 15: the FAQ follows decision 1 and the review.
- marketing-16: Studio bullets per decision 4.
- marketing-17: "Not live yet". `#sh-err` is hidden on a mode change.
- marketing-18: caps units attach ("Your $10k MRR and your 14 months.").

**Hook (page items)**
- hook-8: the unsure copy follows decision 2.
- hook-16: after a put-back the page shows the engine's "Kept as you chose" say and why, and keeps "Keep it. Start free" visible.
- hook-17: the final counter counts the card's fluff strikes, in the engine's own umbrella ("N bits of fluff"). A structural cut such as the "and" in a split is struck without a squiggle and isn't counted, matching the engine's say.

**Skipped / partial**
- Skipped per FIX2: founder-10 (seventh FAQ; budget), founder-11 (no X payout claims), founder-13 (app copy).
- uiux-11: starters and client pills got a mask and scroll-snap instead of wrapping (budget). The starters' label is a snap point, so the row opens at its start.
- marketing-9: the starter is "A sharp one", not "Already sharp", because FIX.md bans that phrase.
- founder-5 vs marketing-11: used marketing-11's copy.
- uiux-4b: why selection is the engine's job.
- uiux-4c: not done.
- marketing-19: the engine's.
- marketing-13: superseded by decision 1's platform row.
- The hero's why is hidden on phones; say and Kept show. This keeps 360 within 10.5 screens.

**Numbers (pass 2 build)**
- `check.js home`: ok. axe 0 at 1440 and 390 and in 16 dynamic states.
- CLS 0 at 1440, 1280, 1024, 960, 768, 390 and 360. No horizontal scroll anywhere; none at 761–780.
- Screens: 8.01 at 1440, 8.98 at 1280, 10.63 at 1024, 10.30 at 960, 9.54 at 768, 9.63 at 390, 10.49 at 360.
- Hero post bottom: 800 at 1440×900 and 768 at 1280×800 (above the fold). The window height is constant across the 4 examples at every width.
- The FIX test lines pass in Try and the final at 1440 and 390 (`engine2.js`). `states2.js`, `sheet-test.js` and the intent tests pass.
- `hero-sync.js` passes, run last against the current core.js.

## Pass 3 (brief: `r86/FIX3.md`, re-rate reviews in `r86/rerate2/`)
FIX3's decisions win where reviewers disagree. The page renders only what `HWCore.sharpenLine` returns (state, line, cut, say, why, kept, alts, note). For clean and unsure lines it now shows the engine's own `say` and `why` too. The page's own "no clean cut here" and "Sharpen only cuts what's soft" lines are gone.

**Founder**
- founder-3: hero sub "Cut the fluff from your first line in one tap, then schedule it for X. It still sounds like you." Meta, OG and Twitter descriptions match.
- founder-5 (decision 4): the Trust sub adds "No auto-DMs or auto-follows, on purpose: automation like that can get an account restricted."
- founder-6/11 (decision 5): index.html sets Studio's allowance per client voice (500 auto-posts a month per client voice; rewrites pooled).
  - The Studio card lists "Everything in Pro, plus:", "Up to 8 client voices, plus your own", "500 auto-sent posts a month per client", "500 rewrites per client a month, pooled", "Their yes before anything posts" and "Sent from each client's own X account".
  - The Studio tile fact reads "Posts go out from their own connected X account."
  - FAQ #qa4: each client "connects the X account they already have. Hookworthy doesn't provide accounts."
- founder-7: "More than 8 clients? Talk to us: hello@hookworthy.com" is a mailto link (subject preset), with the address shown and kept on one line.
- founder-8 (decision 6): "Write my own" clears the box and focuses it. It reads "× Clear" on your own text and hides while the box is empty, so Undo and Sharpen always fit.
- founder-9 (decision 7): the hero draft pane is a door. A click anywhere in it except Sharpen, or Enter on the focusable draft, scrolls to Try with that draft filled in and focused. It doesn't sharpen; the receipt says "Tap Sharpen to see yours."
- founder-10 (decision 8): the done state names the plan and price, e.g. "…starts Pro at $12 a month, billed yearly ($144). Nothing is charged today." Free reads "…signs you in on Free ($0, no card)."
- founder-12 (decision 9): Designer becomes Ghostwriter. Lena Fischer's draft "I just think you don't need a morning routine, you need one thing you do before your phone" sharpens to "You don't need a morning routine. You need one thing you do before your phone.", her post in Studio (state sharp, cut "I just think", split into two beats).
- founder-13 (decision 10): og:url, a canonical link and absolute og:image/twitter:image, under a comment that they assume the site is served at the root of hookworthy.com.

**Marketing**
- marketing-2 (decision 2): `keptLine` renders "Kept: $SOL, 40%." and adds "Kept your lowercase." only for an all-lowercase draft. It never says "your" before a fact.
  - Skipped: public acronyms (AI, CPI, ETF, FOMC, SEO, B2B…), years, a bare 0 or 1 and ordinals without their noun.
  - At most three items. A few more units travel with their number (decks, deals, signups…).
  - The hero, Try and the final share the format. The hero's Kept row moved under the draft's Cut row, so the draft reads as a ledger: Cut / Kept.
- marketing-3 (page half): thin reads "Sharpen needs a few more words. Paste the whole first line." The chip label is "Could cut:" while typing and after Sharpen. Keep says "Keep it. Start free" only on a sharpened line (or one with your own put-backs), and "Start free" on clean, unsure and thin.
- marketing-5 (page half): "“x” is back, so “y” comes back too." When a word you put back opens the line, the label is "Your call." "Another version · 1/2".
- marketing-6/7/8/9/10/11/13/14:
  - "Write my own".
  - The platform row "Posts to X · LinkedIn · Ready to paste on Threads · Bluesky": two groups that never split; on phones one group per line.
  - "Plug replies (one reply you write ahead)" in Trust and #qa2.
  - "Trades, launches, newsletters."
  - FAQ head "Before you hand it / your first line."
  - The email error "That email looks incomplete. Try name@example.com."
  - Free card: "Learns your voice (5 rewrites, once)" and "Say it: talk instead of typing" (the app's dictation; nothing claims it transcribes audio files). The Day tile's step reads "You said it out loud".
- marketing-12: Studio sheets never carry your line, from Pricing or after switching to Studio; switching back to Pro or Free brings it back.

**UI/UX**
- uiux-1: the Day post is inserted, not dropped on top. It is revealed top-down (clip-path) at the pace every post below moves down (all `.m-push` share `--push`), so no text crosses other text.
- uiux-2/4: see founder-8, plus `flex-wrap` and tighter gaps at ≤379; at ≤379 the example's count steps aside for "Write my own". Sharpen never clips at 360–414 in any state (example, own text, Undo, over 280).
- uiux-3: the final card lands once (example → your line). After that it changes in place: only the words crossfade (.6 → 1, 150 ms). Sharpen/Keep swap colour and fill in one step (no colour transition on #try-go and #fin-go).
- uiux-5: a long draft fades at the box's last whole line. The count reads "40 over 280".
- uiux-6/7 (decision 8): "Design preview: no account is created yet." sits under the sheet's sub, before any input. Sign-in mode shows "New here? Start free", which switches back.
- uiux-8: the review card's Draft/Scheduled state is a pill on the review-link row, so names and handles never clip. Dan Ridge lost his tag (brand-3), so his handle shows whole.
- uiux-9: unpicked time slots are plain text; only the picked one is a pill.
- uiux-10: Keeps follows the app's rule (put back twice and it's learned; cut a learned word and it's unlearned). Every state has its own true line.
- uiux-11/12/13/14:
  - #rp-text gets `aria-label` only in edit mode, with role=textbox.
  - Status text that takes focus draws no ring.
  - Toggles are named by action ("Put back “honestly”" / "Cut “honestly” again", no aria-pressed).
  - Struck words preview their put-back on hover (the strike fades, the word lifts to ink).
- uiux-15: the X/Threads/Bluesky hook is a quiet tint, not bold. The feed fade ends on a line's bottom edge (`--fe`, measured), so no line is sliced.
- uiux-16 / web-6: the phone bar comes up only once you're past the Try box (no on/off at the demo), and steps back for Studio as well as Try and Pricing.
- uiux-17: the nav "Try it" and footer "Sharpen" links land the way the hero button does.
- uiux-19: the hero pills scroller has end padding. Its min-width bug at 360 (the Ghostwriter pill widened the window) is fixed.

**Web**
- web-1 / brand-2: the 3em why floor is gone. The hero body height is measured on a hidden clone for all four examples at the current width (`sizeHero()`, on load, fonts and resize), so the window is exactly as tall as the tallest example, phones included. No dead band, and the window is still one height across picks.
- web-2 / brand-4 / brand-5:
  - Studio ≥1200: the client picker is a list with each client's next slot, and the facts close the column level with the review box.
  - Trust 761–1099: the never-list runs the full width.
  - Who ≥1100 is a band like Voice and Trust: a 40px head and the four kinds of poster in one row. Replies and Results share the row above, 6/6. At 761–1099, Results and Who keep their pair, and their heads share one fitted size (container units).
- web-3: the hero's sharpened post, why and receipt wait at .35 from first paint and wake when the strike lands. A pick comes up from .35, never from 0.
- web-4: see marketing-7.
- web-5: the phone notification is opaque and covers the tabs down to their hairline.
- web-7: Try snaps to whole lines with a fade. Falling words skip anything scrolled out of the box.
- web-8: the final field fades at the edge a long line runs past, never under the counter.
- web-9:
  - `nb()` (display only) binds a one-letter word to the next word and a short last word to the one before.
  - "Talk to us: hello@…" is nowrap.
  - The final's example draft is balanced.
  - Feed text, `.qpost` and Trust's rules are pretty or balanced.
- web-10: on phones the plan card's "for" row takes the price column's extra height (grid row 1fr), so name and line sit alike on every card. The Try receipt row holds two lines.
- web-11: `overflow: clip` on tiles, `.dn`, `.well` and `.studio`.
- web-12: `font-display: swap` with a metric-matched local fallback ("Inter Fallback").
- web-13: at 761–900 the Studio photo fills the card (3:1).
- web-14: phone sheet grabber. A drag of more than 80px puts it away; a shorter one snaps back.
- Also: the Replies typing caret takes no room in the line (it re-wrapped the reply, a 0.015 shift at 780).

**Brand**
- brand-1: the trader post's photo is cropped in to the journal and pen (`.ph.jr`, frame 3 at 182%/296%) in the Day feed, Replies and Results.
- brand-3: one rule for the Example tag: the protagonist of each tile is tagged (heycape in all four previews), the supporting cast isn't (Dan Ridge in Replies and LinkedIn), and the footer covers everyone.
- brand-6: the warm rim's glint is brighter on output cards (.6/.28) and draws in once when a line is sharpened (hero, Try, final).
- brand-7: stray greys are now tokens (`--s4 --s5 --wave --shell --ph-bg --notif --white --pill-*`), and each platform preview's palette is a named group (`--pf-th-* --pf-li-* --pf-bs-*`). X previews use the `--x-*` tokens.

**Tooling**
- `hero-sync.js` lifts the page's MARKUP block (`segments`, `togAttrs`, `mirrorHTML`, `fpDraftHTML`). `--write` now also rebuilds the Try default's struck mirror and the final example's draft from the engine, so an engine change never needs a hand edit. Kept rows are matched with their classes.

**Skipped, per FIX3**
- Engine items (decision 1): founder-1/2, marketing-1, the engine halves of marketing-3/4/5, web-15, uiux-18.
- founder-4 (decision 13): the app's trial copy.
- web-12's Sharpen-only engine bundle: core.js isn't the page's to change.

**Numbers (final build, run against the current core.js)**
- `check.js home`: ok:true. axe 0 at 1440 and 390, and in 15 dynamic states at both widths (Try sharp/put back/clean/thin, final live/put back, Studio approved, reply edit/sent, FAQ open, Keeps, sheet Pro/sign-in/done).
- CLS 0 at 1440, 1280, 1024, 960, 901, 768, 761–780, 390 and 360. Nothing pokes past the viewport.
- Every heading is two lines or fewer at 1440, 1280, 1024, 960, 901, 768, 761–780, 390 and 360.
- Screens: 9.61 at 390 (budget 10.0), 10.43 at 360 (budget 10.5), 9.60 at 768, 8.32 at 1440.
- Hero post bottom: 800 at 1440×900, 768 at 1280×800. The window is the same height for all four examples.
- Try and the final, with the default, empty, "asdf", "$BTC 100k eoy?", a 320-character line, "so i think honestly basically it is kind of good", "Just shipped v2!…", "This is kind of a big deal for us.", "The Fed meets tomorrow." and "gm": strikes, line, receipt and why equal the engine's at 1440, 390 and 360, and put back / cut again round-trips. Run with `r86/fix3/trytest.js`.
- The sheet opens from every CTA, traps focus, returns it, and names plan and price when done (`r86/fix3/sheettest.js`). Nothing replays on hover or focus (`r86/fix3/motion.js`).

## Pass 4 (brief: `r86/FIX4.md`, re-rate reviews in `r86/rerate3/`)
FIX4's decisions win where reviewers disagree. The page still renders only what `HWCore.sharpenLine` returns. New this pass: `cut` items of kind `reshape` (structural words the engine removed) are struck plain, without the squiggle. They stay toggleable and aren't counted as fluff.

**Founder**
- founder-1 (decision 3): Pro leads with what only Pro does.
  - The list reads "Everything in Free, plus:", "A ping when a post takes off, replies drafted as they come in", "250 rewrites in your voice a month", then "500 posts a month auto-sent at your time" and "Results, in plain words".
  - The blurb reads "For catching the post that takes off."
  - At ≤760, each paid card shows two real reasons: Pro shows the ping and 250 rewrites; Studio shows 8 client voices and their yes before anything posts.
- founder-2 (decision 4):
  - The FAQ item "I already use a scheduler." (`#switch`) reads: "Keep it if you like: Sharpen is free, whatever you post with. Or bring your posts along: drop in a Typefully or CSV export, your X archive, or paste them in. They're read in your browser, and your past posts teach Hookworthy how you open and when your people reply." The text follows the app's #switch page.
  - The footer link "Switching from a scheduler" opens it, and so does `home.html#switch`.
  - Three answers were trimmed to hold the phone budget.
- founder-3 (decision 5): the bento's Pro-only moments carry a small "Pro" tag: the Day notification, the Results notifications, and "Drafted in your voice" in Replies.
- founder-4: the Trader example now carries a real edit. "just wanted to share that i finally hit my first $10k month and honestly it took 3 years" cuts two bits of fluff and splits the line into two beats (engine output). The OG image was re-rendered with it.
- founder-6: the scheduled done state reads "…puts this line on your queue, at the time you pick."
- founder-7 / marketing-14: "Cancel anytime. A yearly plan stops renewing and keeps working until the year you paid for ends, and you keep every draft." The sheet subs say "Cancel anytime: a yearly plan runs to the end of the year you paid for."
- founder-8: Trust adds two quiet rules.
  - "Plug replies and reruns of your best posts stay off until you switch them on."
  - "Posts go out through X's official API. Sharpen runs in your browser, so a draft stays there until you ask for a rewrite or schedule it."
- founder-10: Studio's price block carries the worked total "4 clients: $72 a month" (or $96 month to month).
- founder-12 (decision 2): the done state's button reads "Open the working demo (it still wears the old look)". The parenthetical sits on a quieter second line.

**Marketing**
- marketing-2: the Try hint "Tap a struck word to put it back." shows only when something is struck. Otherwise it says "Every fact you wrote is still there." The final's tip follows the same rule.
- marketing-4: a curly apostrophe in a put-back ("We’re…") no longer breaks the "Your call." label. Tokens are normalised before matching.
- marketing-7: one name per feature on the plan cards ("auto-sent at your time", "rewrites in your voice").
- marketing-8 / uiux-6:
  - Paid done states say "no account was made and nothing can be charged".
  - Sign-in mode reads "Design preview: sign-in isn't live yet."
  - The hero's Schedule path labels the line "This line:".
- marketing-9: Trust's paragraph no longer repeats the never-list. It reads: "Every post is one you wrote or approved, sent at the time you picked. Automation that can get an account restricted isn't here, on purpose."
- marketing-10 / uiux-10: Replay in Replies is an icon button at the end of the label row, away from Edit and Reply.
- marketing-11: the Voice row reads "Learning" and turns to "Keeps" once "ngl" is learned.
- marketing-12: the Ghostwriter example tags Lena "Example client".
- marketing-13: "Your answer's already written." and "Trades, launches, newsletters. / The point goes first."
- marketing-15 / uiux-5: there's one instruction per state. When text is waiting, the output says "Tap Sharpen. Your sharpened post lands here."

**UI/UX**
- uiux-2 / brand-11: the LinkedIn note left the masked feed. Its text is the LinkedIn caption now, so the fade never cuts it.
- uiux-3 / web-2: `pvFade` re-measures from a ResizeObserver on the preview screens, and on idle.
- uiux-4:
  - Studio clients without media keep the comment pinned to the bottom (`.cmt{margin-top:auto}`), so there's no empty block.
  - Approve resolves the comment ("Applied", or "Resolved" when there was no edit), and Undo puts it back.
- uiux-7: the hero's replay reads "See it again". Hovering or focusing the draft shows "Edit this in the Sharpen box ↓", and the whole pane opens Try.
- uiux-8: URLs, @handles and #tags in the Try and final X cards are X blue (`--x-link`). Long URLs are shortened the way X shows them.
- uiux-9: after you sharpen your own line, Previews offers Example / Yours and shows your line in all four feeds.
- uiux-11 / web-10: the phone chip scrollers (hero examples, Try starters, Studio picker) fade at the edge that has more.
- Also:
  - The Replies label drops its pen in a narrow box (a container query), so "Pro" never runs under Replay at 360 or 761–830.
  - At 768 the Studio list reads down its two columns.

**Web**
- web-1 (decision 6): core.js warms on idle after it loads (`HWCore.SHARPEN.warm()`, or one throwaway call), and every Sharpen yields one frame first, so the press state paints. Measured at 4x CPU: first starter tap 144 ms, second 80 ms.
- web-3: Voice keeps one height through every state at every width. The button fits both labels, and the note keeps a 3-line floor at 761–900.
- web-4: the phone Try tile locks its height across starters (`lockTry`).
- web-5: there's a real tablet layout at 761–900.
  - Studio puts the picker in 4 columns, the review box and voice side by side, and the facts in a row.
  - Pricing puts Free and Pro side by side, with Studio across the width and its list in two columns.
- web-6: at ≥1200 the hero caption keeps its first sentence on one row.
- web-7: the first X preview drops its timestamp, so the handle shows whole at ≥1100.
- web-8:
  - At 761–1099 the four half tiles share one fitted cap size (container units).
  - `.h2.xl` is 60px at 761–1199.
- web-9 / brand-9: at ≥1200 Who (7 cols) and Trust (5 cols) share a row. Who shows four faces 2×2, and Trust is a single column. Studio stays a band below.
- web-11: tile moments start as soon as the tile is 12% into view (threshold 0, rootMargin −12%).
- web-12 / brand-10: the Day morning photo gets a slight depth-of-field blur, so the upscale reads as focus, not softness.
- web-14: struck-word hit areas are `inset:-2px -6px`, so they no longer cover the line above.

**Brand**
- brand-1 (decision 2): `concepts/r86/legal.html` is new. It's in Afterglow (same tokens, Inter, nav, footer and wordmark), uses the app's plain-words privacy and terms verbatim, and the footer's "Privacy and terms" points at it.
- brand-2: one heading treatment per tile size. The one-ink override applies only where the tile is small (Who ≤1099, Trust ≤760).
- brand-3: the hook-h symbol's viewBox now holds the terminal (`8 4.5 20 23`, overflow visible). The nav, footer and giant marks are re-spaced, and the brand SVGs in `assets/brand/` were updated to match.
- brand-4: the trader's photo is the notebook from frame 0, cropped in, in Day, Replies and Results.
- brand-5: Lena's own post uses the coffee-cup crop, so she no longer shares heycape's morning.
- brand-6: the phone hero light starts on canvas, at the right edge, and leans further at ≤379. The trust line beside it keeps AA contrast: 4.65:1 at 360, 5.75 at 375, 5.62 at 390, 6.22 at 414/430.
- brand-7: the Previews hook line is no longer a grey box (it read as a text selection). It's set in weight 550, in each platform's ink, and the rest of the post is dimmed.
- brand-8: heycape's avatar is desaturated (`saturate(.55)`), so the pink stops pulling focus.

**Tooling**
- `hero-sync.js` is unchanged. It lifts the page's own `FLUFF`, `segments`, `mirrorHTML` and `fpDraftHTML`, so the static Try mirror and the final's draft strike reshape words plainly, exactly as the live page does.

**Skipped, per FIX4**
- Engine items (decision 1): uiux-1, marketing-1/3/5/6, every hook-* item, founder-5 and founder-11. hero-sync now shows a new engine why for the Founder example: "A real number up front reads as proof…".
- founder-9: index.html's plan copy. The page can't change index.html.
- web-13: `sizeHero()` stays synchronous, so CLS stays 0. `pvFade` moved to idle.

**Numbers (final build, against core.js of 2026-10-29 12:50)**
- `check.js home` and `check.js legal`: ok:true. No errors, overflow, banned words or axe findings at 1440, 390 and 360. axe is 0 in 15 dynamic states at 1440 and 390.
- CLS is 0 at 1440, 1280, 1100, 1024, 960, 901, 900, 768, 761–780, 430, 414, 390, 375 and 360. Nothing pokes past the viewport, and every heading is two lines or fewer.
- Screens: 9.69 at 390 (budget 10.0) and 10.46 at 360 (budget 10.5), plus 9.06 at 768 and 8.33 at 1440.
- Hero post bottom: 766 at 1440×900, 768 at 1280×800, 773 at 390×844 and 776 at 360×780, all above the fold.
- `trytest` (1440, 390, 360), `sheettest`, `motion`, `p4test`, `mbar` and `cbar` all pass, and `inp` stays under 200 ms. All scripts are in `r86/fix3/`.

## Pass 5 (brief: `r86/FIX5.md`, re-rate reviews in `r86/rerate4/`)
FIX5's decisions win where reviewers disagree. The lead's fixes (the sheet notice selector, legal's "What leaves, and when") and the other engineer's copy (Trust, the Try label, the lede, FAQ #qa3) were the starting point. Engine text is still shown verbatim.

**Shared**
- Two-beat lines (brand-1, web-1): `beats()` (display only, in the DRAFT block hero-sync lifts) wraps each short sentence of a sharpened line in an inline-block `.bt`. Wraps fall between beats in the hero, Try and the final.
  - When any sentence runs past 64 characters, the line wraps normally, but a 1–3 letter opener stays with the next word.
  - The OG image's post breaks at the full stop too.
- Hero window (web-2, web-3):
  - "Why it hits" keeps 20px above the footer line for every example at every width (`.window .hits{margin-bottom:20px}`, measured by `sizeHero`).
  - The opening settles about 1.3s after first paint (it was 2.1s): `--l` .25s, the strike at l+.25, wake .4s, glint .55s, Cut/Kept at l+.45. The fluff falls as the strike ends (.45s, .05s stagger).
  - No animated blur: `defocus` is a fade; `land` and `fall` use transform and opacity only.
- Receipts that don't repeat (marketing-3). The six built-in examples each show a different move, all engine output written by hero-sync:
  - Trader: two beats.
  - Founder: number first.
  - Newsletter: "I think the reason most newsletters fail is that nobody reads past the first line" → asked, then answered.
  - Ghostwriter: "I would argue that your evening sets up…" → a hedge cut, "the claim stands on its own". Lena's Studio post matches.
  - Try default: "i don’t think you should size up after a red day" → said it straight.
  - Final: "thrilled to share that my trading newsletter just hit 20,000 subscribers" → the run-up cut.
- FAQ #qa3 (marketing-4) is FIX5's answer verbatim: "Your words, edited. …"
- Pro, sold one way (marketing-6, founder-3):
  - "For posting every day."
  - The list leads with "500 posts a month auto-sent at your time" (phones: "500 auto-sent posts a month"), then the takeoff ping.

**Brand**
- brand-2: one bento heading system, with two steps and one tone rule. The statement is ink and the payoff grey, everywhere.
  - Lead (`.cap.big`: Try, Voice, Day, Studio, Trust, and Who from 1100) is 40px, or `min(28px,6.6vw)` on phones.
  - Standard is 26px, 22px at 761–900, and `min(22px,5.6vw)` on phones.
  - The per-tile tone overrides and the container-query sizes are gone.
- brand-3 / uiux-7 / web-9: Who is four mini X posts in one X card.
  - Each post shows its persona's tag (Trader, Newsletter, Founder, Ghostwriter), the struck draft faint (≥901) and the engine's sharpened line.
  - "Try it" loads that draft into Sharpen; the ghostwriter's post links to Studio.
  - On phones and at 761–900 the action is an icon and the whole post is the tap target.
  - The data is a WHO block; hero-sync checks each line and writes the static list with the page's `whoHTML`.
- brand-4: `.plans-fine` sits above the cards' shadows.
- brand-5: the wordmark is one outlined drawing (`#wm`: the hook h plus "ookworthy" outlines from `assets/brand/afterglow-wordmark.svg`) in the nav, footer and giant mark.
  - The h's shoulder rose 0.4 units to the o's overshoot, and its bowl dips 0.35 below the baseline.
  - The same path is in the sprite, the app icon (`build.py`), the brand SVGs and the favicon. The 180px icon and the OG image were re-rendered.
- brand-6/7, marketing-13, legal.html:
  - It has the homepage nav (Sign in and Start free open the homepage sheet through `?sheet=signin|free`), the same wordmark, a 72px h1 and no example-accounts line.
  - "Scores are a guide" became "Sharpen is a guide", and "score" became "sharpen".
  - The lead's "What leaves, and when" stays as written.
- brand-8 / web-10: the hero receipt sits on its own line under "Sharpened" when it doesn't fit beside it, and the footer line is balanced.

**UI/UX**
- uiux-1: reduced motion keeps "Another version" (`.replay.alt`). Only the true replays go.
- uiux-2 (page half): the final card gets "Another version · n/m" beside Keep.
- uiux-3: `#sh-err` has `role="alert"`.
- uiux-4: the phone bar re-checks the Try tile's position on scroll, so a jump back to the top hides it.
- uiux-5 / founder-6 / marketing-10b: in the done state, "Back to the page" is the white button. The demo is a quiet link: "Try the working demo (earlier design)".
- uiux-6: in Previews "Yours", the example's posts follow yours, dimmed, so a short line never leaves a hole.

**Web**
- web-4: at ≥901 the plan cards share subgrid rows, so prices, lists and buttons line up at every width.
- web-5: the Studio highlight wraps (box-decoration-break: clone) and the phone text is balanced.
- web-6: FAQ answers open and close by their height and padding (static under reduced motion).
- web-7: the page warms core.js one `warmSteps()` step per idle callback, and phones load core.js only when Try or the final comes near, or on first touch.
- web-8: phone budget, see Numbers.

**Founder and marketing**
- founder-4: the Studio plan, the tile fact and FAQ #qa4 say posts go out from a client's own X account once they connect it; until then a post waits for you.
- founder-5: Pro's full list adds "Need more? Add up to 1,750 a month" (the app's own line).
- founder-7: the final always offers "Or start free, no line needed" ("Or just start free" in the promises row at ≤374).
- founder-8 / marketing-9: the lede is only the rewrite allowance, and the "Claude in the app" claim left it.
- marketing-8:
  - A cut-only result is labelled "What changed"; a move keeps "Why it hits" (`hitK`, checked by hero-sync).
  - A brand-new line says "Tap Sharpen to see yours."; only an edit of the same line says "Edited".
- marketing-9: the final note says "An example. Yours replaces it as you type." Trust's lock line is "Posts go out through X’s official API. This page’s demo never leaves your browser." The Pro bullet is "Results: what landed, and what to write next".
- marketing-10a/c:
  - The paid sheet subs are one glance ("$12 a month, billed yearly ($144). Cancel anytime.").
  - A line rides into the sheet only once it was sharpened or a word was put back, and never from pricing.
- marketing-11: "Learns your voice from 8 posts (uses 5 rewrites, once)".
- marketing-12: the plug/reruns rule is gone. On desktop Trust adds the FAQ's posting fact: "X and LinkedIn posts go out at the time you picked. Threads and Bluesky get a nudge, ready to paste."

**Skipped**
- Engine-side (FIX5): marketing-2/7, founder-1, hook items, the broken-line and verdict text (uiux-2's gate), and marketing-8b/d (engine strings).
- web-7, partly: two of the engine's own warm steps (whole `sharpenLine` warm calls) still take 44–66ms at 1x (115–317ms at 4x). Only core.js can split them.
- FIX5 item 9 / founder-2's "Who sees my drafts?": it doesn't fit the 360 budget.
- marketing-5 / brand-6's nouns inside "What leaves, and when": the lead's text, kept per FIX5.

**Numbers (final build, against core.js of 2026-10-29 14:36)**
- `check.js home` and `check.js legal`: ok:true. axe is 0 in all 15 dynamic states at 1440 and 390.
- CLS is 0 at 1440, 1280, 1100, 1024, 960, 901, 900, 768, 761–780, 430, 414, 390, 375 and 360. Nothing pokes past the viewport, and every heading is two lines or fewer.
- Screens: 9.74 at 390 (budget 10.0), 10.44 at 360 (budget 10.5), 9.13 at 768 and 8.45 at 1440.
- Hero post bottom: 766 at 1440×900, 768 at 1280×800, 773 at 390×844 and 776 at 360×780.
- The hero opening settles about 1.3s after first paint. Hits-to-footer is ≥20px for every example at 901–1440.
- `trytest` (1440, 390, 360), `sheettest` (1440, 390; now also `?sheet=` and the line rules), `motion`, `p4test`, `r86/fix5/p5test.js` (1440, 390), `mbar`, `cbar` and `inp` all pass. Phone hero contrast is ≥4.65:1.

## Pass 6 (brief: `r86/FIX6.md`, re-rate reviews in `r86/rerate5/`)
FIX6's items win where reviewers disagree. Engine text is still shown verbatim, with one new display-only helper: `sayTxt` writes the engine's "Split it into two beats" as "Split into 2 beats" (marketing-7). hero-sync lifts it and checks the hero and Try receipts through it. The engine changed twice during this pass (opinion phrases such as "I think" and "I would argue" are now kept), so every example was re-picked against core.js of 2026-11-15 05:32.

**Examples (founder-1/3, brand-1, uiux-1, marketing-8)**
- Try default: "so basically you should sell into strength, not into panic" → "sell into strength, not into panic." The cuts are "so", "basically" (both fluff, with the squiggle) and "you should" (plain). They are verbatim deletions, so the struck mirror leaves exactly the output. Receipt: "Cut 2 bits of fluff · Said it straight", a move the hero doesn't use. The counter's static text is the true length (58), it is set again on first paint, and hero-sync checks it.
- Hero Trader is a trade: "just wanted to share that i sold half my $BTC at 98k and honestly i’m holding the rest" → "i sold half my $BTC at 98k. i’m holding the rest." The OG card was re-rendered with it (`assets/og-afterglow.png`).
- Hero Newsletter: "So the reason most newsletters fail is that nobody reads past the first line" (asked, then answered). Hero Ghostwriter: "Honestly, your evening sets up your morning more than your alarm does". Lena's Studio post is unchanged.
- Final example: "my trading newsletter literally just hit 20,000 subscribers" ("“literally” was talk, not the point").
- Starters: a swap (due to the fact that → because), a run-up cut, a count first ("Here are 5 things"), a label cut ("Real talk:") and the clean line.
- Who: heycape "so i’m up 18%…", Priya "Excited to share that dark mode is live…", Theo "Honestly, most founders…".
- Every why the visitor can reach from the hero, the Try default, the final and the starters is a different template. Ana's and Priya's Who whys share one ("It now opens on…"), and Theo's why is never shown.

**Founder**
- founder-2: one rewrite, shown in the Voice card, labelled "One rewrite, three takes · Example". It has one draft and three takes from three angles: Number first, A question, The story. At ≥761 the takes are three cards under the voice columns. On phones they are a swipe row, and the Habits and Never-says rows step aside (the takes show those habits, and Studio shows a never-say list).
- founder-4 / marketing-3/4/5: "scheduled" replaces "auto-sent". "Learns your voice from 8 posts" has no metering, and the one-time 5-rewrite cost moved to "Will it sound like me?". The Pro list says "More rewrites from $8 a month" (core.js CR_BOOSTS).
- founder-5: the FAQ "Is my writing used to train AI?" replaces "What’s free?", which the plans answer, and sits after "Is it just AI writing?".
- founder-6: the done state's link reads "Open the working app (demo data)".
- founder-7 / marketing-9: a new line that hasn't been sharpened shows an empty X card under "Tap Sharpen to see yours.", never the last line's result. An edit of the line on show dims it ("Edited. Tap Sharpen again."). There is one instruction per state.

**Marketing**
- marketing-2: the #qa3 answer is rewritten as plain sentences: "No. Sharpen only cuts and reorders the words you wrote…". It keeps "this demo runs on your device, without Claude." for claude_try.py. The Reply heading reads "Your answer’s already drafted." (Pro drafts replies as they come in).
- marketing-10: the Trust lock line reads "Posts go out through X’s and LinkedIn’s official APIs." (the server posts through api.x.com and api.linkedin.com). The demo note stays on the Try label.

**UI/UX**
- uiux-2 / brand-6: the final's draft card is as wide as the post card.
- uiux-4: in Previews "Yours", a line over 280 (X) or 300 (Bluesky) splits into two posts with the thread rail. The split falls at the last full stop that fits, else the last comma, else the last space.
- uiux-5 / web-5: typing after Clear ends Undo and brings the counter back.
- uiux-6: under 380px the hero post hides the handle, so "2m" stays whole.
- uiux-7: an open Pro card on a phone hides the "$144 billed yearly" line.
- uiux-8: the three Replay buttons have three names. uiux-9: the done state sets `aria-describedby="sh-done-t"`.
- uiux-10: on touch screens the draft pane shows a quiet "Tap to edit ↓" chip.
- uiux-11: struck words get a 6px vertical and 2px side hit area (`.tog::after`) at every width, with no layout shift.

**Web**
- web-1 / brand-2: at ≥1200 Trust's three rows share the row height, and the rules follow at the tile's gap.
- web-2: on a single-column hero the window's spare height sits in the draft pane, so the post card ends the window. ≤379 gives a few pixels back, so the post still ends above the fold at 360×780.
- web-3: Results keeps its 9:31 clock from 761 to 1099.
- web-4: the Try tile at ≥1200 leaves 11px under Start free with the new default. Studio clients without a photo keep the comment and Approve under the post, with the spare height at the bottom.
- web-6: the Studio highlight is nowrap. web-7: the four hero pills fit at 360, and a scroller counts as "end" when its last item shows whole.
- web-9: core.js loads only on a first touch of Try, the final or Who, or when the Try tile is within 200px of the viewport. There is no idle load. Dead CSS was removed (.who-n, .ph.cup, .thread .media, .ph-h .mini, .lede b, .tfoot b, .plan .h3 .tag) along with overridden phone declarations.

**Brand**
- brand-3 / web-8: the notebook crop is `--cw:200%` (1.04–1.39× at DPR 2). Lena's Studio photo is the full-width cafe frame (0.7–1.0× at DPR 2). The Day morning backdrop is the full frame height, 1.27× in CSS pixels like the night one, and blurred. The large blurred backdrops can't reach 1.5× at DPR 2 at desktop sizes with this 800px sprite.
- brand-4: the phone light's hot core lands on the window's top edge at about 85%, and the beam rises steeply to the right, clear of both buttons. `--k` is 1.38. To keep the light off the text, the phone hero micro line is "Free forever · No card" (the third promise is in Trust, the final and the sheet). Contrast is ≥5.1:1 for every hero text at 360–430.
- brand-5: the hook-h ends in a flat cut (`V19`, butt cap) in `#wm`, `#hw` (build.py), `#hk-h`, every `assets/brand/*.svg`, legal.html and the OG card. The 180px icon was re-rendered.
- brand-7: the never-say lists get row gap (.5–.6em; 9px on phones).

**Skipped / partial**
- marketing-8 (hand-written whys) and uiux-3 (a why that quotes the whole line): whys stay the engine's verbatim. The examples were chosen so their whys differ and none quotes its whole line. A visitor's own lines can still get a full-line quote, which is engine-side.
- marketing-1 (forecast hedges) and the hook items: engine-side.
- web-9's deferred stylesheet split: not done. Only dead rules were trimmed, about 0.7 KB.

**Numbers (final build, against core.js of 2026-11-15 05:32)**
- `check.js home` and `check.js legal`: ok:true. axe is 0 at 1440 and 390, and in every `axestates.js` state.
- CLS is 0 at 1920, 1440, 1280, 1100, 1024, 960, 901, 900, 780, 768, 761, 430, 414, 390, 375 and 360. No overflow and no heading over two lines anywhere from 320 to 1920 (`r86/fix6/sweep.js`).
- Screens: 9.79 at 390 (budget 10.0), 10.41 at 360 (budget 10.5), 9.28 at 768 and 8.61 at 1440.
- Hero post bottom: 766 at 1440×900, 768 at 1280×800, 825 at 390×844 and 776 at 360×780.
- `trytest` (1440, 390, 360), `sheettest`, `motion`, `p4test`, `p5test`, `mbar`, `cbar`, `inp` and the new `r86/fix6/p6test.js` (1440, 390) all pass. p4/p5 now type the old Founder starter line instead of clicking the starter.
- claude_try.py still patches (build_pub.py from a scratch copy: no assertion error). hero-sync passes, run last.

## Pass 7 (brief: `r86/FIX7.md`, re-rate reviews in `r86/rerate6/`)
Engine items stayed with the engine pass (core.js changed several times during this pass; every example was re-checked against core.js of 2026-11-15 09:31 and later). The page adds one thin safety net of its own, and no engine text was rewritten.

**Page-side output guard (uiux to_95 #1, founder-1's page half)**
- `guard()` now ends in `guardWhole()` (a GUARD-START/END block). A version is shown as "Sharpened" only when it reads whole. It is dropped when a clause it built has two verbs and nothing between them ("We raised a Series A is closed"), when it leaves a stub the draft never had ("…great week! pricing."), a clause with no main clause ("If you're not using stop losses.", "That most newsletters are…"), a that-clause question ("…realize that the first line?"), or a word that is neither the writer's nor one of the engine's own template and plain-word swaps.
- A dropped main line falls back to a whole alternative, else to "Kept as written" with the soft marks as "Could cut" chips, "Nothing to cut without changing what you said. The marked words are your call." and the rewrite link. Lines the writer wrote that way are never second-guessed.
- Calibration: it refuses all six broken lines the jurors found, and 0 of 824 versions the current engine gives for the 1,577-line held-out set. hero-sync lifts the block and fails any hero, Try, final or Who example the guard would refuse.

**Truth and copy (marketing-1/3/4/5/6/7/8/9/10/11, uiux-2, founder-2/3)**
- FAQ "Is it just AI writing?": "Your words, tightened, not new writing. Sharpen cuts fluff, moves the point up front and swaps a wordy phrase for a plain one. It never adds a claim, and a check throws out any version that changes a number, a name, a negation or a hedge. In the app, Claude makes that edit, and this demo runs on your device, without Claude. Rewrites in your voice and Pro’s reply drafts use Claude too, only when you ask, and nothing goes out until you send it." The claude_try.py sentence is kept verbatim, and "Same rules here" is gone. Swapped words are not marked in the demo; the FAQ now says swaps happen.
- "Will it sound like me?": "Learning your voice uses 5 rewrites, once." The same sentence sits under the Free card's "20 rewrites in your voice a month" (in the expanded list on phones).
- Who's trader row is a real edit: "honestly i’m up 18% this month and it’s literally just from trading less" → "i’m up 18% this month. it’s just from trading less." (Cut 2 bits of fluff · Split into 2 beats, engine-verified). The engine now keeps "actually", so the marketing juror's draft became a one-fluff edit.
- Results heading: "Know what landed. / And what to write next."
- Studio has its own way in: "Start with Studio →" after the price fact (a text link at the end of the client fact on phones). It opens the sheet on Studio, yearly picked, with the plan and billing pills, whatever the pricing toggle says (`data-bill="y"`).
- Pro's bullet is split: "A ping when a post takes off" and "Replies drafted in your voice as they come in".
- "Another take · n/m" in the Try box and the final. The clean starter is "Already sharp". Wherever the page writes its own clean copy it says "Already tight. Nothing to cut without changing what you said." (the engine now uses the same line).
- The short cancel line at every width, on a 70ch measure: "Cancel anytime: a yearly plan runs to the end of the year you paid for." with "More than 8 clients? Talk to us" under it from 761px up.
- Who's Try buttons point up (`#i-top`), toward the Try box.

**UI/UX**
- uiux-3: phones show each persona's struck draft on one line above the sharpened one. It ends at a whole word with its own "…" (`fitLine`), and screen readers get the whole draft. The Voice card keeps its context on phones: a one-row "heycape’s voice · Learned from 8 posts" header and a Never-says row (two strikes that fit whole). The tile's footnote steps aside there.
- uiux-4: struck-word hit areas are at least 24px wide and 32px tall (`.tog::after`, insets with `min()`), drawn outside the text, so nothing shifts.
- uiux-5: a starter or a persona's draft that replaces the visitor's own line offers "Replaced · Undo" for 5 seconds, like Clear.
- uiux-6: the Try receipt never breaks inside a part (`sayTxt` binds each part with no-break spaces, so it breaks only at "·"). Replay is icon-only at ≤760. The Learning cell and the receipt are balanced.
- uiux-7 / web-9: Who hides handles at 901–1099, so no name is cut.

**Web**
- web-2: no unit splits ("20 a month", "250 on Pro", "500 per client", "8 clients", "($96 month to month)", "paid for").
- web-3: at ≥1200 the post pane is 1.3× the draft pane, so the Founder line sets in two lines. The window body dropped from 400 to 370px at 1440, and the draft pane's band went from about 80–120px to 17–80px (composer room under a two-line draft).
- web-4: the Studio queue ends each row at a whole word with its own "…" (`fitLine`, at every width and client).
- web-6: on phones the Try box holds the tallest starter's height (measured from a hidden copy), the chip row keeps its place when empty, and the starters each fit two lines at 360. The tile no longer moves between starters at 360–430. At ≥1100 the feed previews cap at 470px, so a tall Try tile leaves the spare height below Previews' note.
- web-7: Trust's rows keep their natural height at ≥1200, with the spare height above the rules.
- web-8: the night backdrop gets the same blur and grade as the morning one.
- web-5 / first tap: once core.js loads, its warm steps run one per idle callback (each waits for idle time). Then the Try default and the five starters are worked out ahead into a small memo (the page's own handle on HWCore; everything else is HWCore's own). A touch on Try, the final or Who pauses the warm-up for 3 seconds. A starter skips the typing-state paint and the second frame wait.

**Brand**
- brand-1: on phones the section heads are `clamp(32px,9vw,36px)` (35px at 390 against the H1's 42.6px). The final's `.xl` keeps its size.
- brand-2: the hook-h in `#wm` (nav, footer and giant wordmark), legal.html and `assets/brand/afterglow-wordmark*.svg` is now one filled path built on Inter's own h outline in "worthy": the same stem, notched shoulder and arch. Only the right leg is custom, a U hook ending in a flat cut. The app icon (`#hw`, `#hk-h`, the 180px PNG) and the OG card keep the stroke hook-h for now.
- brand-3: Lena's cafe frame gets its own grade (saturate .8, contrast 1.08, brightness .72) and a soft vignette in Studio. Every Studio photo carries the 5% grain.
- brand-4: the hero receipt accounts for every struck word. "Cut" lists the fluff chips. Then "Split at" (a beat split) or "Reworded" lists the move's plain strikes, e.g. "Cut [just wanted to share that] [honestly] Split at [and]". cutNote is lifted by hero-sync.

**Skipped**
- Engine: founder's broken splits and IMO, marketing-2, marketing-3's engine strings, uiux's "Series A is closed", and web-5's sharpen-only bundle. The page guard covers the broken lines' display.
- uiux-2's marking of swapped words in the cards (optional in FIX7). The FAQ now says Sharpen swaps wordy phrases.
- marketing-4's optional heading "…newsletters, clients."
- The OG card and the app icon still use the stroke hook-h (see brand-2).

**Numbers (final build, against core.js of 2026-11-15 09:54)**: screens 9.90 at 390 (budget 10.0), 10.47 at 360 (budget 10.5), 9.33 at 768, 8.65 at 1440. Hero post bottom 766 at 1440×900 and 734 at 1280×800. The Try tile is 739px at 390 and 713px at 360 for the default and all five starters. First tap on a 4x-throttled 390 phone (`r86/fix7/tap.js`): a starter after warm-up lands in 87–105ms with no long task (click event 72–96ms). A typed line takes about 150ms, about 105ms of it in sharpenLine. During warm-up a tap can wait on one engine warm step of 430–775ms at 4x, which only core.js can split. `check.js home` and `legal` ok:true, CLS 0 at 15 widths from 360 to 1920, no overflow and no heading over two lines from 320 to 1920 (`sweep.js`). `trytest`, `sheettest`, `p6test` and the new `r86/fix7/p7test.js` (1440, 390) pass. claude_try.py still patches. hero-sync passes, run last.

## Pass 8 (brief: `r86/FIX8.md`, re-rate reviews in `r86/rerate7/`)
core.js was being changed by the engine pass throughout (10:35, 10:56, 11:01 builds); no engine text is rewritten by the page, and hero-sync ran last.

**Truth: reply drafts and their cost (founder-2/3/4, marketing-2)**
- Checked in the app: the breakout alert's first reply drafts are made on the server (`breakoutDrafts`, AI.complete outside `withCredits`), so they cost no rewrites. "Draft all in my voice" and Radar replies cost 1 rewrite per batch of up to ten (CR_ACTS `replies: { c: 1 }`).
- FAQ "Is it just AI writing, like ChatGPT?", two short paragraphs: "No. A chatbot writes you a new post. Sharpen edits your own line: it cuts fluff, puts the point first and swaps a wordy phrase for a plain one. It knows your voice and your never-say list, and a check rejects any version that changes your facts." / "In the app, Claude makes the edit, and this demo runs on your device, without Claude. Rewrites use Claude when you ask. On Pro and Studio, a post that takes off arrives with its first replies drafted, free. Other reply drafts use 1 rewrite for up to ten. Nothing goes out until you send it." The claude_try.py sentence is verbatim (patch check passes).
- Pro card: "250 rewrites in your voice a month" is now a phone-visible bullet (with 500 posts); "A ping when a post takes off, with its first replies drafted" + "Those first drafts don’t use your rewrites."; "Replies drafted in your voice as they come in" + "Up to ten replies per rewrite."
- legal.html: what leaves now says Pro/Studio breakout drafts go to Claude unasked; hosted wording ("Hookworthy’s servers", synced data "stays in your account, encrypted"); sync explains why drafts come back at sign-in; usage line states the reply-draft cost.
- Free row: "Past a daily fair-use limit, it runs on your device. Still free." (from 375px up; at 360 the budget keeps it to the FAQ/legal).

**Demo states (uiux-1 page half, uiux-3, uiux-5, founder-7, marketing-11)**
- An `unsure` result always reads "Kept as written"; a "tight" why from the engine is never shown on it. The page's own as-written copy (guard drops) no longer says "Already tight": the words the engine wanted to cut stay marked ("Marked, not cut: cutting it would change what you said. Your call.").
- After Sharpen the chip row is "Marked:"; "Could cut:" is only the typing suggestion.
- Clean copy is the engine's `R.why` verbatim.
- Who "Try it" and the hero draft now arrive sharpened (the visitor's tap asked for it): "Sharpening it…" while the box scrolls in, then the strike plays in view. A persona/starter line that is stale says "Tap Sharpen to see it sharpened." After a Who jump, "Back to who it’s for" returns to that row with focus on its button.
- Put-back note: "Back in: “so”, and “you should” with it."; a line that opens on a word you put back shows the engine's why with no "Your call." label over it.

**Layout and craft**
- Trust ≥1200 (brand-1, web-1, uiux-7, founder-10): the cause was natural-height rows in a tile stretched by Who. The Never list is now `flex:1` and each row `flex:1` with its words centred, the rules follow the list (24px). Rows 85/97/97px at 1280–1440, no band, and it can't come back if Who grows. Intro: "Every post is one you wrote or approved. No automation that can get your account restricted. On purpose." ("Auto-reposts" was not adopted: the app has an Auto-repost setting key and weekly reruns.)
- Studio (web-2, uiux-2): Marco's post carries a small inline-SVG BTC chart (X-dark frame, white/grey candles, dashed 58k level, white ring at the break, no ember). Rafael's carries a quoted post of his own ("Passed on a deal I liked today…"). `sizeStudio()` measures all four clients at this width and locks `#st-box`: 694/694/694/694 at 1440, 734×4 at 390 (phones hide the media and quote, as before).
- Try (web-3): falling-word ghosts are cleared on every edit, Clear, starter or re-render (`unDrop`), and their timer is cancelled.
- Who (brand-2, uiux-4, marketing-9c): fluff in the drafts wears the ember squiggle (1px, offset 3px); a move's plain strikes ("and", "why") stay plain. 761–900 keeps the one-line struck draft and "Try it". Phones show "Try it" (icon only at ≤359); Studio's link is an arrow below 414px and at 761–900 so the Ghostwriter tag is never cut.
- Previews "Yours" on LinkedIn keeps the feed full (the example's posts follow, dimmed) (uiux-8).
- Try result packs to the top of its reserved height (web-6).
- Text-button hit areas (`.inl`, the mailto) extend outside the text (web-8).
- photos.webp (192 KB vs 321 KB) served through `<picture>` with the JPEG fallback (web-7; Day backdrops already blur 1.5px).

**Brand**
- Results well: its own crop of frame 2, the sky band at ~1.9× under the blur (`.ph.sky`, container-sized), no longer Day's frame again.
- OS notifications: "Hookworthy · Pro" in the timestamp colour, no pill (the Replies tile keeps its in-app pill).
- Pro card: hairline top .34, one surface step up, a white glint on its top edge (no ember).
- Phone beam: `--lx:92%; --a:64deg; --bw:104px` (66deg/96px below 380), so it lands on the window's top edge and clears "Try it on your line".

**Marketing**
- Hero Founder: "Big news: we just hit $10k MRR, 14 months after launching" → "$10k MRR, 14 months after launching." (Cut 1 bit of fluff · Number first; Kept: $10k MRR, 14 months). Ghostwriter (Lena, "Example client"): "I just wanted to remind you that your evening honestly sets up your morning more than your alarm does" → "Your evening sets up your morning more than your alarm does." (Cut 2 bits of fluff), the same post Lena approves in Studio. Both engine-verified and guard-clean.
- Starters named by move: Wordy, Announcement, List, Real talk, Already sharp; the Announcement starter is now "So excited to share: our first hire starts on Monday" (the $10k MRR line moved to the hero).
- Headings: Who "Trades, launches, newsletters. / Same fluff, same fix."; Voice "Your lowercase stays. / Your never-say words go." with "Paste 8 of your posts and it learns how you write: your habits and your never-say words. You choose every change." as its footnote.
- The Try tile's own "Free forever · No card" is gone (hero and final keep it).
- Phones: at 360 the Try label is "This demo runs on your device." (the instruction stays for screen readers); the Voice card keeps one Habits row ("numbers first", "short lines").

**Other**
- Sheet email error: "!" glyph, weight 500, and an ink ring + halo on `[aria-invalid=true]` (uiux-6). Done-state link: "Open the working app on claude.ai (demo data)" (founder-9).
- Nav at 761–900 keeps "For ghostwriters" and drops FAQ (founder-8).
- Warm-up: steps from `HWCore.SHARPEN.warmSteps()` run one per idle callback only while the Try tile or the final is within 600px of the screen (parked otherwise), and a touch still pauses them for 3 s.

**Skipped**
- Engine: "Already tight" on run-up lines, run-up coverage, colon fragments ("How I grew my newsletter to 10k:"), "i think" consistency, chunked warm steps.
- web-5 (reserve the tallest result at desktop): it would bring back the Try tile's empty band at ≥1200 that pass 5/6 removed; the growth is input-driven (CLS 0).
- marketing-6 "Auto-reposts" (see Trust), marketing-9c two-line drafts on phones (budget).

**Numbers (final build, against core.js of 2026-11-15 11:09)**: screens 9.97 at 390 (budget 10.0), 10.49 at 360 (budget 10.5), 9.44 at 768, 8.72 at 1440. CLS 0 at 15 widths from 360 to 1920, no overflow and no heading over two lines from 320 to 1920 (`sweep.js`). Hero post bottom 766 at 1440×900 and 734 at 1280×800. Studio 694px at 1440 and 734px at 390 for all four clients. `check.js home` and `legal` ok:true. `trytest`, `sheettest` (1440, 390), `p7test` (1440, 390) and the new `r86/fix8/p8test.js` (1440, 390) pass; `p6test` now reports its old "who placeholder" expectation, which is the intended change (Who drafts arrive sharpened). claude_try.py still patches (build_pub.py in scratchpad/pub, no assertion). First tap on a 4x-throttled 390 phone (`r86/fix8/tap.js`, starter): 83–105 ms tap to result after warm-up (click event 56–96 ms); a tap during warm-up waits on the engine step in progress (155 ms to result in this run). core.js's warm steps still run 65–670 ms each at 4x, which only core.js can split. hero-sync passes, run last.

## Pass 9 (brief: `r86/FIX9.md`, re-rate reviews in `r86/rerate8/`)
core.js changed under this pass (11:51, 12:38, 12:41, 12:48 builds); every example and check was re-run against the 12:49 build, and hero-sync ran last. No engine text is rewritten by the page. `sharpen.js` had not shipped when this pass finished, so the page still loads core.js (see Skipped).

**Brand**
- brand-1: the warm rim is visibly warm: `.lit-card::after` runs 8–92% of the top edge, ember at its ends and hot white at 62%, with a 14px ember glow. The Try result catches the light: a soft ember bloom over its top edge (`.try-out .lit-card::before`, inside `#out-card`'s own stacking context). It is the finished state, so reduced motion keeps it. The Try card wears the rim only on a sharpened line; "Kept as written" and "Nothing to cut" are plain X cards.
- brand-2: "Example" is muted meta text after the name ("heycape · Example @heycape_"), with no border (`.tag.eg`). The bordered pill stays for Who's roles and "Pro".
- brand-3: Studio's never-say words are 17px, like the Voice tile's, with a .6em row gap.
- brand-4: Lena's cafe frame is cropped to the cup and her notebook (`.ph.cafe`, no plant and no window light) and graded into the night (saturate .7, contrast 1.1, brightness .6, sepia .12, a deeper vignette).
- brand-6: heycape's avatar is lifted (saturate .8, contrast 1.08, brightness 1.08, a 12% ring).
- brand-7 (part): the preview hook line is 600, not 550.

**UI/UX**
- uiux-2: a kept hedge's reason shows once. `noteOnce()` drops R.note when it only repeats the why (it compares them case-, quote- and "your"-blind), in the Try box and the final.
- uiux-3: Clear (or a starter that replaced your line), then Undo, brings back the result too: the stash keeps R and the version on show when they belong to that line, and Undo renders them again.
- uiux-4: on a touch screen, the first tap on the untouched default goes to the box (focus, keyboard, the example selected), not to a struck word. Toggles wake once the box has had focus or after a Sharpen. Keyboard toggles are always live.
- uiux-7: the Day slots are a readout: plain times, with the best one marked by a dot and set in ink. There is no pill and no selected state.
- uiux-9: the first line the visitor sharpens opens Previews on "Yours", and the pill rings once when the feeds come into view. After that the choice is theirs.
- uiux-1 (page half): the guard refuses a version that opens on words the engine marked as fluff and left in (`gOpensMarked`, in the GUARD block and in hero-sync). "Hey everyone, I wanted to share some thoughts on…" now reads "Kept as written" with both spans marked, never "It now opens on “I wanted to share…”".
- uiux-8: starters and persona drafts show "Write my own", and only your own line shows "Clear".
- uiux-10: on phones, a hero or Who jump that sharpens leaves focus on the result's receipt, not the field, so no keyboard comes up over the result.

**Web**
- web-4: the Replies teaser is now two dimmed replies (Jun Park, Sam Okafor) in a flex child that takes only the room left and runs into the card's bottom edge, fading as it goes. It never adds height.
- web-2: on a single-column hero (≤900) the window's spare height collects under the sharpened post, never between Draft and Sharpened. Post bottoms: 798 at 390×844 and 749 at 360×780 (Trader).
- web-3: at ≥1100 `#try-out` sits on the tile's bottom padding, so a compact result's slack falls between the starters and the receipt.
- web-5: a tapped starter scrolls fully into view. A measured spacer after the last chip makes the row's end land on a chip's edge, so no chip is cut at the left at any snap point.
- web-6: no lone word anywhere in Studio, for all four clients from 320 to 1920 (`r86/fix9/orph.js`). Never lists that would leave one phrase alone take the narrowest width that keeps their row count (`balanceRow`), Rafael's and Marco's lists fit one row on a phone, "London time" is bound, the highlight keeps its full stop, and the voice column is `text-wrap: pretty`.
- web-7: at 761–900 the final's beam is short (118px at 16°). It starts below the form and lands only on the card.

**Founder**
- founder-2 / marketing-6: the Ghostwriter tab's foot reads "Waits for Lena’s yes · Mon 6:30 PM" with "Send to Lena" (the time shows from 1200px up). It opens the sheet on Studio, yearly: "Send it for Lena’s yes", the price, "Lena’s line:" with the line, and a done state that says the line would go to her review link and out once she approves. The tab's draft is now "I just wanted to remind you that your evening sets up your morning and your alarm only starts it", so the engine's why names the line ("The run-up is gone, so the line starts on “Your evening sets up your morning”."). Studio's Lena post is the same line.
- founder-3 / marketing-10: Free card: "Past a daily fair-use limit, a lighter check runs on your device. Still free." legal.html says the same. Phone heights are unchanged.
- founder-4: Free lists "Your best time to post, read from your own posts". Best times are not plan-gated in the app.
- founder-5: Pro lists "More rewrites: +250 for $8 a month", with "Or +750 for $22, +1,750 for $45. On Pro and Studio." (core.js CR_BOOSTS; the juror's $12/$25 was wrong).
- founder-6: the phone Studio link reads "Start with Studio · $18 a client" on the same line.
- founder-7: the FAQ answer opens "It’s AI that edits your line, not AI that writes you a new one."

**Marketing**
- marketing-3: the ChatGPT answer is positioning only: "In the app, Claude makes the edit, and this demo runs on your device, without Claude. Nothing goes out until you send it." (the claude_try.py sentence is verbatim). Reply billing lives on the Pro card.
- marketing-4: Pro has one reply bullet, "Replies drafted in your voice: free when a post takes off, then up to ten per rewrite", after "A ping when a post takes off". Both sub-notes are gone.
- marketing-5 / marketing-8: the Voice head is "It learns how you write. / Lowercase and all.", and phones show the "lowercase stays lowercase" habit, its proof.
- Voice never-says ("to the moon", "huge news", "let that sink in") are checked against the engine by hero-sync. Each is cut as an opener (colon, comma, "!") and as a closer, and at most one unnatural form may stay. All three pass on the 12:49 core.js. Marco's list no longer holds "not financial advice" (the engine keeps it on purpose): it is "guaranteed", "wagmi", "ngmi".
- marketing-7: under the hero draft, a move's plain strikes are labelled by the move's own name ("Cut [Big news] Number first [we just hit]"), never "Reworded" for a deletion. A cut that opens the draft takes its colon or comma with it ("Big news:", "Honestly,") in the hero and in Who.
- marketing-11: the review link's button speaks as the client ("Approve with my edit", "Approve"), next to "Priya’s view".

**Warm-up**: core.js's warmSteps now hands over 561 steps, so one step per idle callback never finished before a tap (533–867 ms first tap at 4x). Each idle callback now runs as many steps as leave 16 ms of headroom, stops on a touch, and still parks off-screen.

**Skipped**
- `sharpen.js` (FIX9 item 6): not in the repo when this pass finished. loadCore, the warm-up and build_pub.py still use core.js.
- Engine: "Already tight" on hype openers (founder-1's clean-state copy is the engine's R.why), stacked run-ups (the page guard covers the display), thread openers and the jargon reasons (marketing-2), "on a call" (marketing-9), put-back pins (uiux-5), hedge and bait openers (uiux-6), and the full-bundle cost (web-1).
- brand-5 (a small-size master of the wordmark): this needs a new drawing of the hook-h, and it was not in FIX9's list. brand-7's other weight changes were left too.

**Numbers (final build, against core.js of 2026-11-15 12:49)**: screens 9.94 at 390 (budget 10.0), 10.46 at 360 (budget 10.5), 9.45 at 768, 8.73 at 1440. CLS is 0 at 15 widths from 360 to 1920. There is no overflow and no heading over two lines from 320 to 1920 (`sweep.js`). Hero post bottom is 766 at 1440×900 and 734 at 1280×800. `check.js home` and `legal` are ok:true (axe 0). `trytest`, `sheettest`, `p7test` and `p8test` (1440, 390) pass, and the new `r86/fix9/p9test.js` passes at 1440, 390 and 360. claude_try.py still patches (build_pub.py in scratchpad/pub, no assertion). First tap on a 4x-throttled 390 phone (`r86/fix8/tap.js`, Announcement starter): 75–140 ms tap to result once warm-up has run, and 247–502 ms when tapped 1.5 s after the tile arrives (the line is worked out cold). core.js's warm steps still make 50–270 ms tasks at 4x, and building the step list takes about 370 ms in Node. hero-sync passes, run last.

## Pass 10 (brief: the coordinator's pass-10 note; engine notes in `r86/engine/READY9.md`)
The on-device engine v4.3 landed with `sharpen.js`, its Sharpen-only bundle. core.js kept changing during this pass (15:30, 15:39, 15:48, 15:55). `sharpen.js` (15:01) is now stale against it by `tools/build-sharpen.mjs --check`: 6 of 2,193 fixture lines give a different result, and none of them is a line the page shows. hero-sync ran last.

**The bundle**
- loadCore loads `../../sharpen.js`, never core.js too. The page calls only `sharpenLine`, `softMarks` and `SHARPEN.warmSteps` (grep of src.html and tail.txt for `HWCore.` and the engine handle), and the bundle has all three. It is 438 KB raw and 147 KB gzipped, down from core.js's 662 KB and 226 KB.
- The warm-up builds its step list in the first idle callback, not in the script's onload. Each idle callback runs as many of the ~1,800 steps as its deadline has room for. It keeps headroom of 1.5× what a step has cost lately, plus 2 ms, so a long step only starts in a long idle period. A skipped period eases the estimate. It stops when input is pending (Chromium) and still parks off-screen and pauses on a touch. Where there is no `requestIdleCallback` (Safari), the moment after a frame gets an 8 ms deadline. Before, it was one step every 200 ms, so 1,800 steps would have taken six minutes.
- hero-sync checks against the engine the page loads (it reads loadCore's `s.src`), and also checks that core.js gives the same result for every draft.

**First tap** (4x CPU, 390×844, the Announcement starter; `r86/fix10/tap.js`, before = the pass-9 build with core.js, interleaved with after on the same machine)
- Cold (the tap comes before the engine has loaded): median 1.19 s → 0.95 s (0.92 s in the interleaved runs).
- On arrival (~0.9 s of warm-up done on phones, where the engine loads in the hero): interleaved median 0.76 → 0.70 s, the same within noise. Quiet runs gave 0.44–0.54 → 0.47–0.58 s.
- Mid-warm-up (1.5 s after the tile arrives): the warm-up has done 2–3.5× more work by then (204–490 ms against 48–209 ms), because short frames during the tile's moment now take several steps each. Quiet runs: 0.47–0.55 → 0.16–0.33 s. The interleaved runs on a loaded machine overlap (median 0.69 → 0.68 s).
- Warm: 117–161 → 80–111 ms for a starter. A fresh typed line takes 105–213 ms after, against 110–144 ms before, within noise.
- Long tasks: the engine's script task is about 120–140 ms either way. Warm-up steps chained into one callback still overrun to 50–94 ms a few times. The worst warm-up task is the Wordy starter's look-ahead (133–257 ms): its first "due to the fact that" call compiles a path that warmSteps doesn't cover (the engine's job). TBT after the tile arrives is about the same as before, with a median of ~175 ms.
- The machine was shared with the engine's test runs for part of this pass, so single runs vary by up to 2×.

**Kept marks**
- A `frame` mark ("Not to brag, but"), and any mark a sharpened version left in, wears the kept underline (dotted, the put-back spec), never the ember squiggle and never a strike. This holds in the Try mirror (typing and after Sharpen), the chips, the final's field and its draft card (`.held`).
- While you type, a frame is never "Could cut": it follows the suggestions under its own "Marked:".
- The opens-on-a-mark guard (pass 9) skips a frame and a mark the engine's own why says stays ("“I wanted to take a moment to share” went, and “Some thoughts” stays…"), so those lines show sharpened. A fluff run-up the version left at the front is still "Kept as written". That is 7 of 1,042 sharp fixture lines, down from 9.

**Never-say**: no struck never-say anywhere is "not financial advice" in any form. Marco's list ("guaranteed", "wagmi", "ngmi") was already clean from pass 9, and `p10test.js` checks the whole page. legal.html keeps its "Not financial advice" disclaimer, which is not a never-say example.

**build_pub.py**: `../../sharpen.js` maps like core.js does, to a root `sharpen.js`. The published preview loads core.js in its place, as one engine, never both, because `claude_try.py` calls `H.prompts.sharpen` and `H.SHARPEN.fromClaude`, which the bundle leaves out. The script asserts that loadCore loads sharpen.js and that the preview ships exactly one engine. Run from `scratchpad/pub`, it gives no assertion errors. In a stubbed check, the preview served in an artifact-style skeleton (utf-8) shows the on-device line, then Claude's line, with no errors.
- Served without a charset, core.js v4.3 throws ("Range out of order"): its emoji class is a literal `[☀-➿]`, and Latin-1 decoding breaks it. The artifact skeleton declares utf-8. `\u2600-\u27BF` escapes would make the engine encoding-proof.

**Numbers (final build)**: screens 9.94 at 390 (budget 10.0) and 10.46 at 360 (budget 10.5). CLS is 0 at 15 widths from 360 to 1920. There is no overflow and no heading over two lines from 320 to 1920. Hero post bottom is 766 at 1440×900 and 734 at 1280×800. `check.js home` and `legal` are ok:true (axe 0). `trytest` and `sheettest` (1440, 390), `p7test` and `p8test` (1440, 390), `p9test` (1440, 390, 360) and the new `r86/fix10/p10test.js` (1440, 390, 360) pass.

## Pass 11 (brief: `r86/FIX11.md`, re-rate reviews in `r86/rerate9/`)
Engine v4.5 landed in core.js during this pass and sharpen.js was regenerated (`tools/build-sharpen.mjs --check`: up to date). No engine text is rewritten by the page; hero-sync ran last, against v4.5. Scripts and outputs are in `scratchpad/r86/fix11/`.

**Web**
- web-1 / uiux-4: Previews "Yours" is only ever the visitor's own line, and always the one in the Try box: sharpened, or as written after "Nothing to cut" / "Kept as written" (that is the line that would post). An example in the box (the default, a starter, a persona's or the hero's draft), an emptied box, a thin line or a new line not sharpened yet takes "Yours" away, and the feeds fall back to the example. A new line of the visitor's brings it back unless they picked "Example" themselves.
- web-2: load-time work at 4x CPU. The hero arrives armed (`.window.arm`: draft unstruck, post dimmed) and plays once the window is at least 40% in view and at least 1.2 s after first paint, so the strike runs on a free main thread (a 4 s fallback in the head script plays it if the page script never takes over). The engine loads on intent only: a touch, click or focus in Try, the final or Who, the mouse resting on the Try box, the final's field or the Who posts, or the Try tile at least half in view. Below the hero, every tile and section is `content-visibility:auto` with a remembered size, so the first layout covers the hero only. Tile set-up waits for the tile to come near (`near()`): Studio's sizing and row fitting, Who's line fitting, Try's phone floor and starter tail, the scroller fades, Previews' fade, the final's beam spot. Height-changing set-ups run in the observer callback 1,000–1,200px ahead, so they never shift what is on screen; the rest run in idle time. `sizeHero` fills four copies before they go in and measures them together, in an idle moment after first paint (the CSS floor at 1200px and up is now 370px, the tallest example, so nothing moves when it lands). `sizeStudio` measures clients without balancing rows or fitting lines (neither changes the height). The tiles' arm loop reads every position before writing classes; the bar's slide distance is measured when the bar first shows.
- web-3: a pick or "See it again" puts the new post in the dimmed state first, then marks and strikes the draft, then wakes the post as the last strike lands: the opening's order at `--k:.64`, done in about 0.8 s. The opening's strike is 0.5 s (uiux-1: `W` .32 → .5) and the post wakes at the strike's end.
- web-4 / uiux-3: the Try result follows the starters at every width (the `margin-top:auto` at 1100+ is gone), and from 761px up the input card keeps its chip row's height when the row is empty, so a one-line or clean result never opens a band. Starters-to-result gap: 12–14px at 360–1440 ("Already sharp"); the spare height sits under the result.
- web-5 / uiux-7 / marketing-8: the Voice tile's anchor is the word it is learning at post size ("~~ngl~~ eth looks strong here.", 30px; 26px at 761–1099; up to 24px on phones) with "Put it back" as its button and two dots that count the put-backs ("Put back 1 of 2" → "Learned: “ngl” stays" → "Cut again: unlearned"). The full sentence is screen-reader only. Habits and never-says share one row. Body: "Paste 8 posts. It picks up your habits and your never-say words, and you choose every change." The button never moves (fixed-width count on its far side). Phones: 600 → 528px.
- web-7 / founder-5: Sign in stays in the nav at 360 (only under 340 does it step aside).
- web-9: at 1200+ Approve sits on the review panel's floor, level with "Start with Studio", and the queue ends with it.

**UI/UX**
- uiux-2: lines the page puts in the Try box carry their author: the default and two starters are heycape's, the others Priya's, Ana's and Theo's, a Who draft is that persona's, the hero's draft its example's ("Example client" for Marco). The input's avatar, the waiting card and the result card show the name with "Example" as meta text, never "You @you". Their button is "Start free", the sheet says "This line:", and the done copy never "keeps your line". The first keystroke or paste makes it the visitor's ("You", "Your line", Previews).
- uiux-5: at 761–1099 the bento runs Try, then Previews beside Replies, then Voice and Day.
- uiux-6: the row a yes just scheduled shows the edit it carried, in ink, with the words before it giving way first ("…churn: down 34% since June…"), and lights once.
- uiux-8: the hero draft has a pointer cursor.

**Founder**
- founder-1: one meaning for "rewrite", said once in the pricing lede: "A rewrite is three fresh takes of a line, or up to ten reply drafts, in your voice". Pro: "Reply drafts in your voice: up to 10 per rewrite", sub-note "Free on a post that takes off."
- founder-2: the voice cost is out of "Will it sound like me?" and the Free card, and said once, in the fine print: "Learning your voice uses 5 rewrites, once." (core.js CR_ACTS `voice: { c: 5 }`).
- founder-3: the hero's Schedule opens "Schedule your posts free" with no line, and its done copy says each post you schedule goes out at the time you pick. The Ghostwriter example's "Send to Marco" opens Marco's review link in Studio (picked, scrolled to, focus on Approve); no sheet, nothing queued.
- founder-4 / marketing-4: the Ghostwriter example is Marco Vitale, a trader client: "~~honestly~~ i was wrong on btc at 58k. here’s the chart that told me, ~~and~~ i ignored it" → "i was wrong on btc at 58k. here’s the chart that told me. i ignored it." (Cut 1 bit of fluff · Split into 3 beats; why "Short beats with full stops between them. Each pause makes the next one land."). Studio's Marco post is that line; the foot reads "Waits for Marco’s yes · Thu 8:05 AM". Lena's Studio post is split ("Your evening sets up your morning. Your alarm only starts it.").

**Marketing**
- marketing-2: the AI answer: "Sharpen edits your line; it never writes you a new one. … Rewrites and reply drafts start from your words, your voice and your never-say list: on Free when you ask, and on Pro and Studio a post that takes off arrives with its first replies drafted. A check rejects any version that changes your facts." The claude_try.py sentence is verbatim.
- marketing-3: the page's own reasons are shorter ("Marked, not cut: it would change what you said. Your call."). The engine's whys are the engine's (see Skipped).
- marketing-5: Theo: "~~Honestly,~~ founders don’t need more posts, they need better first lines" → "Founders don’t need more posts. They need better first lines."
- marketing-6/7, fine print: "15 scheduled posts a month go out on their own. After that, each one waits for your tap." (the app: "Past 15, scheduled posts wait on Week for your tap"); Studio "Billed yearly at $216 per client. Or $24 month to month."; fine print "Learning your voice uses 5 rewrites, once. Cancel anytime: a yearly plan runs to the end of its year. More than 8 clients? hello@hookworthy.com".

**Brand**
- brand-1: at 761–900 and on phones, Who's clamped draft keeps 6px under its line for the whole ember wave (`padding-bottom:6px; margin-bottom:-6px`, so nothing moves). The phone never-say row has the same room.
- brand-2: heycape's avatar `saturate(.55) contrast(1.08) brightness(1.06)`.
- brand-3: the footer's sign-off is `.79em` tall (every letter and the hook whole, only the y's tail bleeds) and shows on phones (+33px at 390).
- brand-4: Lena's cafe crop is the cup and the top of her notebook (region x 112–442 from y 55); the phone is out of frame.

**Engine v4.5 on the page**: the page guard (GUARD block, also lifted by hero-sync) refuses what the engine's four new hard rejects refuse, with the engine's regexes copied verbatim: an "it's/there's/here's" off its subject, a condition cut off by a split, an opinion verb before an order, a sentence that newly opens on a bare thinking verb. On the v4.5 snapshot (`engine/r11/snap-v9.json`) the guard refuses 9 lines, as before.

**Skipped**
- web-6 (CSS and JS in hashed external files): the page ships as one file for the artifact build; the engine now loads on intent only. Precomputing the starter results was left out: they would need hero-sync coverage.
- web-8 (Day photo softness): the photos already carry the 5% film grain; there is no larger source.
- brand-5 (re-render the OG card): a raster asset with no generator in the repo.
- founder-6 (hedges that carry meaning), the 17-word two-beat why on the hero's Trader card (marketing-3) and the clean-state copy (marketing-1): engine-side. v4.5's clean line ("This quick check found nothing to cut, so it stays as you wrote it.") shows verbatim.
- founder-7 (a real founder handle): never invented.

**Numbers (final build, against v4.5)**
- Screens: 9.89 at 390 (budget 10.0), 10.46 at 360 (budget 10.5), 9.46 at 768, 8.80 at 1440. CLS 0 at 15 widths from 360 to 1920. No overflow and no heading over two lines from 320 to 1920, with every section forced to render (`fix11/sweep.js`).
- Load at 4x CPU (`fix11/lt.js`, interleaved with the pass-10 build): at 390, 8–9 long tasks, max 281–288 ms, TBT 522–646 ms, longest frozen frame 317–350 ms with the strike inside it, became 2–3 long tasks, all done by about 0.55 s, max 157–164 ms, TBT 112–146 ms, longest frame 167–183 ms. The strike starts at about 1.58 s with no frame over 50 ms. At 1440, max 736–780 ms, TBT 1,241–1,318 ms and a 800–900 ms frozen frame became max 126–128 ms, TBT 176–187 ms, longest frame 150–167 ms. The engine is no longer fetched at load (it was at ~2.4–2.9 s).
- First tap at 4x, 390, Announcement starter (`fix11/tap.js`, both builds on v4.5): cold 988 → 813 ms; a tap right as the tile arrives 432 → 799 ms (the engine now loads on that arrival, not during load); 1.5 s after arrival 388 → 583 ms (v4.5's warm-up reaches the starters only after its own steps); warm 76 ms (starter) and 111 ms (a typed line). v4.5's warm steps still make 50–164 ms tasks at 4x.
- `check.js home` and `legal` ok:true (axe 0). `trytest`, `p7test`, `p8test` (1440, 390), `fix11/sheettest` (1440, 390; a starter no longer rides into the sheet as the visitor's line), `fix11/p9test` (1440, 390, 360; "Send to Marco" opens Studio), `p10test` (1440, 390, 360) and the new `fix11/p11test.js` (1440, 1280, 1024, 900, 768, 390, 360) pass. build_pub.py (scratchpad/pub) runs with no assertion errors and the stubbed preview test (`fix11/pubtest.js`) shows the on-device line, then Claude's, on core.js alone. hero-sync passes, run last.

## Pass 12 (brief: `r86/FIX12.md`, re-rate reviews in `r86/rerate10/`)
Engine v4.7 landed during this pass (READY13: core.js and sharpen.js regenerated at 04:11). No engine text is rewritten by the page. hero-sync ran with `--write` for EX[1] (Priya), then last without it: every example matches sharpen.js, core.js agrees, and sharpen.min.js is current and agrees. Scripts and outputs are in `scratchpad/r86/fix12/`.

**UI/UX**
- uiux-1 (P1, the freeze): `loadCore` retries a failed load once (700 ms later); a second failure, or a script that loads without the engine, resolves null for good. `paint()` repaints only when a real engine arrived, so nothing loops. Try and the final show "The demo engine didn’t load. Reload to try again." where the result would land (and in their status lines); Sharpen, a starter, a put-back toggle, Who's "Try it" and the final's Sharpen all end there. An emptied final field brings the example card back. `softMarks` is wrapped so it can't break typing. New `fix12/freezetest.js` (1440, 390) blocks every engine request and types into Try: the tab answers within 2 s throughout, exactly 2 requests (the load and one retry), the error state everywhere, no page error; then with only the first request failing, the retry loads the engine and the line sharpens. The same test against the pass-11 build hung the tab (the run had to be killed).
- uiux-4: Studio at 1200+ stacks every column from the top. Approve sits 16 px under the comment for all four clients (was 69–98) and the queue 24 px under "Goes out" (was 46–81). The client list is 44 px rows with 16 px gaps, so it no longer sets the box height; Lena's photo and Marco's chart are 1.85:1, so the clients fill about the same height. What a shorter client leaves sits once, at the box's bottom: 12, 41, 11 and 11 px. One height (478) for every client.
- uiux-5: Previews at 1100+ grows with a Try tile that grew (the 470 px cap is gone). Each feed has a second dimmed post (Jun Park, a trader line), "Yours" keeps every dimmed post, the fade still ends on a whole line and the note stays right under the feed (22 px; 0 px band under it with a 280-character line).
- uiux-6: a one-column hero (≤900) has no height floor, so no example leaves a band under its post (was 20–115 px); a pick eases the window's height over 0.26 s inside the tap's input window. sizeHero writes `--hm`, joined to the CSS floors with `max()`, so those floors stay live.
- uiux-7: on a phone the final's Sharpen moves focus to the result (its Keep button, else the result) instead of blurring to `<body>`.

**Founder**
- founder-3: one statement everywhere. Free card: "Replies drafted when you ask: up to ten for 1 rewrite". Pro card: "A ping when a post takes off, with its first replies drafted" / "Those drafts don’t use rewrites." The lede still defines a rewrite ("…or up to ten reply drafts"). The FAQ no longer talks plans. The Day tile's breakout alert reads "Your 8:40 post is taking off. Its first replies are drafted." legal.html says the same two facts in the same words.

**Marketing**
- marketing-2: the Voice tile says its rule on screen, under the line (beside the button on phones, two lines at 360): "Put back once. Twice and it stays." → "Learned: “ngl” stays from now on." → "Unlearned. Put it back twice and it stays." The two dots stay; "Put back 1 of 2" is gone. The sentence is the live region.
- marketing-3 / founder-4: the AI answer is four sentences: "No. Sharpen edits your own line: it cuts fluff, puts the point first and trades a wordy phrase for a plain one. Rewrites build three takes from your words, and a check rejects any version that changes your facts." / "In the app, Claude makes the edit, but this demo runs on your device, without Claude. Nothing goes out until you send it." The claude_try.py sentence is verbatim.
- marketing-4: Free "Sharpen every line you write" (the fair-use note stays under it); Pro's add-on line is last; Studio "500 rewrites a month per client, pooled".
- marketing-5 / web-3: every Who action keeps its label at 360+ ("Try it ↑", "Studio →"). On ≤900 the action sits beside the struck draft it acts on (24 px pill), so the name row has its full width and no tag is clipped at any width (`fix12/whom.js`); under 360 all four are arrows alike.
- The page's own kept copy is the engine's v4.7 copy, never absolute: "This quick check found nothing safe to cut. The marked words are your call." and "This quick check found nothing it could cut safely, so it stays as you wrote it." ("it would change what you said" is gone.)

**Brand**
- brand-1: the wordmark is respaced (`fix12/wm/`, measured nearest-point gaps in font units): k|w 0 → 2.6 (it was 9 shapes for 10 letters, now 10), r|t 2.1 → 3.5, o|k 6.3 → 5.8, w|o 6.1 → 5.6, h|y 6.7 → 5.7 (k −0.5; w +3.0; o r +2.5; t h +3.9; y +2.9). viewBox 533.25 → 536.15, `.wm` 5.3615em, the giant's divisor too. Applied to `#wm`, legal.html and the three `assets/brand/afterglow-wordmark*.svg`. `assets/og-afterglow.png` is re-rendered the pass-6 way (`fix12/og/`) with the filled hook-h wordmark, respaced, and the inline "· Example" tag (brand-5).
- brand-2: at ≤760 the stage beam steps aside and the Sharpened card carries its own light (`.post > .light`, 78%, 30°), clipped above the card's top edge, so the hot spot sits on its rim and never washes the post.
- brand-3: the preview hook line is the feed's weight (400).
- brand-4: `fonts/Inter-Variable.woff2` (a 230-codepoint subset) now maps U+2011 to Inter's own hyphen glyph (fontTools cmap edit, 72,920 → 72,812 B). "2‑post" draws in Inter (same advance as "-", checked in p12test). The file is shared with the app; nothing else in it changed.
- brand-6: the Day feed around heycape's post is traders ("funding flipped negative overnight. watching 3k on eth.", "my rule: no trades in the first 15 minutes after the open.").

**Web**
- web-2: the hero's name row never clips the time: the name, tag and time don't shrink, the handle gives way first with an ellipsis, the tag last (`fix12/nmchk.js`, every example, 320–1920).
- web-4: Trust's Never rows are as tall as their words (57 px, were ~97). The spare height is one space under the intro; the list and rules are anchored to the tile's foot.
- web-5: the fine print is one sentence a line from 761 px ("…to the end of its year." whole). `text-wrap:pretty` had been overriding its `balance`.
- web-6: no text row is sliced by the fold at 1200+ from 760 to 1100 px tall (`fix12/foldscan.js`, every 2 px). At 790–825, 872–902 and 903–922 px tall the window's floor is 20 or 40 px deeper, so "Everyone can reply" (1280×800, 1440×810) and "Your best time / Schedule" (1440×900, 1600×900) fall below the fold, which cuts empty space. Post bottoms are unchanged (766 at 1440×900, 738 at 1280×800).
- web-9: content-visibility placeholders are each block's content height per breakpoint (padding was counted twice). Unrendered page height at 1440 is 7,939 against 7,939 rendered (was 8,697).
- web-10, minify: the sources stay readable; `src/build.py` pipes the assembled page through the new `tools/minify.js` (inline script and style, HTML comments) and points loadCore at `../../sharpen.min.js`, which it remakes from sharpen.js whenever sharpen.js's sha256 differs from the one in sharpen.min.js's banner (so it can't go stale); hero-sync and p12test fail if it is stale or gives a different result. terser and esbuild could not be fetched (the npx call was refused by the permission system), so minify.js uses terser when it is installed and otherwise TypeScript's own parser (already on the machine). Every token is copied verbatim, a line break is kept wherever ASI or a restricted production could depend on it, and the result must re-parse to the identical token stream and syntax tree or the build stops. Nothing is renamed. `fix12/verifymin.js` checks the built page against the sources: the same 945 CSSOM rules, the same DOM, the same computed styles for 1,503 elements and the same page height at 1440 and 390.
  - home.html: 341,272 B / 95,258 B gzip (readable) → 276,314 B / 72,753 B gzip (−23.6% gzip).
  - sharpen.js 517,032 B / 171,233 B gzip → sharpen.min.js 403,726 B / 136,639 B gzip (−20.2%). Name mangling (terser) would take it further.
- build_pub.py builds the preview from the readable sources (`build.assemble()`), so claude_try.py still patches; it asserts that src/ builds exactly to home.html, then minifies the preview the same way. The preview still loads core.js, one engine.

**Engine v4.7 on the page**: EX[1] (Priya) is now "Big news: we just hit $10k MRR, 14 months after launching" → "We just hit $10k MRR, 14 months after launching." (Cut 1 bit of fluff; why "Your “Big news” frame went, so the line opens on “We just hit $10k MRR”."). It reads well and keeps the founder's "just hit", so it stays. p10test's run-up line now arrives sharpened ("I wanted to talk about…": v4.7 cuts "take a moment to"); the test accepts that when the line doesn't open on a struck word.

**Skipped**
- web-7 (the approved Studio row trims its front): ending it at the back would hide the edit, which pass 11's uiux-6 asked to show (p11test checks it).
- web-8 (contractions shown in the mirror), uiux-2/uiux-3 and marketing-6 (demo outputs): engine-side.
- web-11: the toggles and inline buttons already have 24 px hit areas (`::after`); the juror measured the boxes.

**Numbers (final build, against v4.7)**
- Screens: 9.84 at 390 (budget 10.0), 10.37 at 360 (10.5), 9.46 at 768, 8.83 at 1440. CLS 0 at 15 widths from 360 to 1920 (one 1920 run read 0.0009 with no shift over 0.001; reruns 0). No overflow and no heading over two lines from 320 to 1920 (`sweep.js`, every section forced to render).
- `check.js home` and `legal` ok:true (axe 0). `trytest`, `p7test`, `p8test`, `sheettest` (1440, 390), `p9test`, `p10test` (1440, 390, 360), `p11test` (1440, 1280, 1024, 900, 768, 390, 360), the new `p12test` (1440, 1280, 768, 390, 360) and `freezetest` (1440, 390) pass; the copies run in pass 12 are in `fix12/`. build_pub.py runs with no assertion errors and `fix12/pubtest.js` shows the on-device line, then Claude's, on core.js alone.

## Pass 13 (brief: `r86/FIX13.md`, re-rate reviews in `r86/rerate11/`)
Engine v4.8 landed during this pass (core.js and sharpen.js regenerated at 10:20; `tools/build-sharpen.mjs --check`: up to date). No engine text is rewritten by the page. v4.8 makes a plain cut the default take, so the hero's Newsletter example (EX[2]) and Ana's Who row changed; EX[2]'s draft is now "So basically the reason most newsletters fail is that nobody reads past the first line" → "The reason most newsletters fail is that nobody reads past the first line." (Cut 2 bits of fluff), so the example still shows a real run-up going (with "So" alone it cut one word), and Ana's row is "~~So~~ ~~in this issue I wanted to talk about~~ why open rates lie" → "Why open rates lie:". hero-sync ran with `--write` for those, then last without it: every example matches sharpen.js, core.js agrees, and build.py remade sharpen.min.js (403,726 → 416,955 B; 141,597 B gzip), which agrees on every draft. Scripts and outputs are in `scratchpad/r86/fix13/`.

**The empty bands, found and closed (Trust brand-3 / web-1 / uiux-7; web-2; uiux-7 Results)**
- Trust, the cause: from 1200 it shared a grid row with Who (7/5 columns). A grid row is as tall as its tallest item and stretches the others, so Trust took Who's height (600) and the `margin-top:auto` on its Never list put the difference (134 px) between the intro and the list. Every earlier fix (row heights, align, anchoring) only moved that slack. Now no tile shares a row with a taller tile of a different build: from 1100 Who and Trust each have a full row (Who two by two, Trust intro beside the list, its height its own; Trust closes the bento, right before pricing). At 761–1099 the rows are paired by build: Previews (a feed that runs on under its fade) beside Who, right after Try; Replies (a thread whose teaser runs to the card's edge) beside Results. Results is never stretched (its 151 px band at 1024 is gone), and Who's posts keep their rhythm in a band (`align-content:start`).
- Hero (web-2, uiux-7): the window is as tall as the example on show at every width (the 370–453 px floors and the fold floors are gone; a pick eases the height, as phones did). `levelHero()` brings the two panes level: measured at their own heights, the shorter pane's text (the draft, or the post's line) takes a 5% narrower measure at a time while that gains it height without passing the taller pane, so the window height never changes from levelling. What's left is spread over that pane's own gaps (the draft: under its header, between draft, cut note and Kept, over "Everyone can reply"; the post: around the card and "Why it hits"). The bottom rows are tighter (tools 56, foot 52). At 1440×900 the Schedule button's bottom is at 877 / 845 / 895 / 895 for the four examples (it was 936, under the fold).
- Studio: a shorter client (Rafael's quote) spreads its difference over the review's gaps (`justify-content:space-between`) instead of pooling it under Approve; his quoted post reads at post size (15.5 px; 16 px at 901–1199). At 1100–1199 the photos and chart take a 3.6:1 crop and the voice column is 12 px tighter, so the box isn't set by the voice column.
- New `fix13/gaptest.js` (with `gaplib.js`): the largest empty vertical gap inside Trust, the hero window (every example, each pane), Results and Studio (every client), measured as a visitor sees each block (scrolled to, its moment played). Content is text line boxes, images, controls and boxed elements (a card counts as solid at its parent's level and is then measured inside, so empty glass in a card or a phone counts); the icon rail and avatars are solid. It fails any gap over 32 px at 1024, 1280, 1440 and 1920; `fix13/gapsweep.js` runs the same at every width from 1024 to 1920 in 16 px steps.

Largest empty vertical gap inside each block (px; worst example / client), pass-12 build → this build (`fix13/gaptest.js`, `o/gap-before.txt`, `o/gap-after.txt`):

| block | 1024 | 1280 | 1440 | 1920 |
|---|---|---|---|---|
| Trust | 19 → 19 | 134 → 17 | 134 → 17 | 134 → 17 |
| Hero window | 151 → 21 | 115 → 29 | 115 → 29 | 95 → 29 |
| Results | 151 → 22 | 22 → 22 | 22 → 22 | 22 → 22 |
| Studio | 56 → 27 | 41 → 23 | 41 → 23 | 41 → 23 |

`gapsweep.js`: every width from 1024 to 1920 in 16 px steps passes (worst: hero 29, Results 22, Trust 19, Studio 23).

**Web**
- web-3: from 761 each pricing card shows four rows (Free: Sharpen, 15 scheduled posts, 20 rewrites, replies when you ask; Pro: Everything in Free, 500 posts, 250 rewrites, the breakout ping; Studio: Everything in Pro, 8 client voices, their yes, 500 rewrites pooled), and "See everything included" opens the rest of all three at once (they share subgrid rows, so open cards stay level; each button's `aria-expanded` follows). Phones keep their two rows and per-card expander.
- web-4: `#pricing,#faq{scroll-margin-top}` (less the page's scroll-padding): the headings land 32 / 40 px under the nav (24 px on phones).
- web-5: the phone scrollers' fade is longer (76 px) and done 8 px before the edge, so the next chip or take reads as a peek, never a clipped word; it clears at the end as before.
- web-6: the Try tile keeps one height while it's used, at every width: the result area holds the room the example's result takes, less whatever sits above it at the moment (a typing hint, the Undo chip), via a ResizeObserver on the input card; while a new line waits, the result's outline holds the space (the empty post plus two bars under "Why it hits"). 761–900 reserve a two-line result. Measured (`p13test`): example, Write my own, typing, Sharpen, put-back and four starters all at one height at 1920, 1440, 1280, 1024, 900, 820, 768, 390 and 360 (1 px once at 1024/900); only a line taller than the examples grows it. "Replaced · Undo" no longer pushes the buttons to a second row on a phone. CLS 0.
- web-12: Studio's phone price column: "a month per client" / "$216 billed yearly".

**UI/UX**
- uiux-6 / marketing-9: at ≤900 each struck draft reads whole in at most two lines across the post's full width; the action moves up beside the name and a tag that doesn't fit beside it steps under the name (never clipped). ≤400: a 32 px avatar and a step smaller type, so drafts keep to two rows.
- uiux-10: the hero plays ~0.3 s after first paint (was 1.2 s); until the cut lands, the post's line and its "Why it hits" are skeleton bars (a thick underline across each line's own length, letters transparent) that give way to the words as the last strike lands, ~1.3 s after first paint. Reduced motion shows the finished frame.
- uiux-3: the example (or a starter, a persona's draft) starts selected, so the first keystroke replaces it; that now offers "Replaced · Undo" for 6 s while you type, and Undo brings the line back (with its result when it had one).
- uiux-4 / marketing-6: the Voice meter says what the filled dot means: "You put it back once. Once more and it stays." (under 390 px: "Once more and it stays.", two rows beside the button); then "Learned: “ngl” stays from now on.", "Unlearned. Put it back twice and it stays.", "Put back once. Do it again and it stays."
- uiux-5: the Reply demo says "Sent (demo)".

**Founder and marketing**
- founder-4 / marketing-4: Free card: "15 scheduled posts a month go out at your time. After that, each one waits for your tap." founder-5: the schedule sheet's done copy: "…your scheduled posts go out at the time you pick: 15 a month on Free, then one tap each." founder-7: Studio yearly in the sheet says "($216 per client)".
- founder-6 / marketing-3: the AI answer opens "It’s AI that edits your line, not AI that writes it." The claude_try.py sentence is verbatim.
- marketing-7: a greeting ("gm") is no longer listed in the Kept receipt (the page's keptLine): it is voice, not a fact.
- marketing-5: the pricing lede leads with the benefit: "Pay for volume, never for the basics. A rewrite is three fresh takes of a line, or up to ten reply drafts, in your voice: 20 a month on Free, 250 on Pro, 500 per client on Studio."

**Brand**
- brand-1: the wordmark's hook is redrawn the icon's way, one even stroke: the rising terminal is 12.1 units against the 12.43 stem (2.7% lighter, was 10.6, 15% lighter), the counter 9.4 (0.76× the stem, was 6.8, 0.55×), the turn's bottom 11.0, the terminal cut at 59.1 (half the x-height). The letters after it move 4.1 units right, so h|o keeps its 3.4 nearest-point gap (`fix13/wm/wm13.py measure`); viewBox 536.15 → 540.25, `.wm` 5.4025em and the footer's divisor to match. Applied to `#wm`, legal.html, the three `assets/brand/afterglow-wordmark*.svg`, and `assets/og-afterglow.png` (re-rendered the pass-12 way, `fix13/og/`).
- brand-2: the body's one sunrise: in the Day tile, a low ember light (the `.light` component at reduced power, only ever light) falls from the upper right onto the phone's top edge at 8:40 AM, in the phone's layer (over its frame, under its screen), with a specular line on the rim. It fades in after the phone lands; without motion it simply sits there.
- brand-8: the signup sheet carries the lit-card's ember hairline, centred over the icon and title (no bloom, no beam).
- brand-6: Trust's heading is ink all through, the page's one unhedged promise. web-8: night and morning meet on a 1 px hairline. uiux-14: the final card's handle gives way before its time.

**Skipped**
- Engine-side (the engine engineer's v4.8, core.js): founder-1/2/3, uiux-1/2/9, marketing-1/2, founder-9, brand-4 (created apostrophes).
- uiux-8 (the approved Studio row's leading ellipsis): pass 11's uiux-6 asked for the edit to show; p11test checks it. uiux-11 / founder-10 (Try live like the final): the Try box's tap is the demo's one-tap moment; its hint already says "Tap Sharpen". uiux-12: the toggles have 24 px hit areas already. uiux-13 (drag the sheet by its header), web-7 (final draft measure), web-9 (focus before reveal), web-10 (the FAQ heading is already sticky), web-11 (type scale), web-13 (engine chunking), brand-5, brand-7, brand-9 (no larger photo source), founder-8 (how a thread counts: not stated anywhere in the app, so not invented), founder-11 (the waiting state now shows the result's outline), marketing-8.

**Numbers (final build, against v4.8)**
- Screens: 9.95 at 390 (budget 10.0), 10.49 at 360 (10.5), 9.44 at 768, 8.70 at 1440. Who's two-line drafts cost ~80–100 px on phones; it is paid for by a 32 px avatar, a step smaller type and prose-flowing beats at ≤400, and the Voice meter's short form under 390.
- CLS 0 at 15 widths from 360 to 1920 (one 1920 run read 0.0014, a 2 px font-swap reflow of the hero now that it has no floor; three reruns 0). No overflow and no heading over two lines from 320 to 1920 (`sweep.js`). The Try tile is one height through use at every width tested.
- Hero at 1440×900: Schedule's bottom at 877 / 845 / 873 / 895 for the four examples (was 936). It plays 0.30–0.35 s after first paint (was 1.2 s); words land ~1.3 s after first paint.
- home.html 282,591 B / 74,259 B gzip.
- `check.js home` and `legal` ok:true (axe 0). `trytest`, `p7test`, `p8test`, `sheettest`, `freezetest` (1440, 390), `p9test`, `p10test` (1440, 390, 360), `p11test` (1440, 1280, 1024, 900, 768, 390, 360), `p12test` (1440, 1280, 768, 390, 360), the new `p13test` (1920, 1440, 1280, 1024, 900, 768, 390, 360), `gaptest` (1024, 1280, 1440, 1920), `gapsweep` (1024–1920) and `verifymin` pass. p11test and p12test copies in `fix13/` take this pass's intended changes: the hero's start window (0.25–0.9 s after first paint, its armed state read at DOMContentLoaded), the AI answer's new opening, the Voice meter's wording, and Approve up to 32 px under the comment for a shorter client. build_pub.py (scratchpad/pub) runs with no assertion errors and `pubtest.js` shows the on-device line, then Claude's, on core.js alone.

## Pass 14 (brief: `r86/FIX14.md`, re-rate reviews in `r86/rerate12/`)
Engine v4.9 landed during this pass: sharpen.js regenerated at 12:07. hero-sync ran last without `--write` (no example changed: every example matches sharpen.js, and core.js agrees on every draft), and build.py remade sharpen.min.js (416,955 → 428,185 B; 145,006 B gzip). core.js changed again at 12:12 and sharpen.js was regenerated at 12:19 (`build-sharpen.mjs --check`: up to date); hero-sync ran again, last, still with nothing to write, and build.py remade sharpen.min.js once more (428,414 B; 145,079 B gzip). trytest, p14test and pubtest pass on it. Scripts and outputs are in `scratchpad/r86/fix14/`.

**Honesty (founder-2, founder-3)**
- Every Who row carries the quiet "· Example" tag after the name, like every other mock (whoHTML and the static list; hero-sync rebuilt the list from whoHTML). From 1100 the name line reads `name · Example @handle [kind]`; below 1100 the handle steps aside and the kind and its tag take a second line under the name, the same in all four rows (so Theo's "Ghostwriter" no longer drops to a line of its own at 768 or 360: brand-5).
- Every side character's handle is now one that can't belong to anyone: `first-name.example`. X handles can't hold a dot, and `.example` is a reserved name (RFC 2606), so no Bluesky handle can end in it. Display names stay; heycape keeps `@heycape_` and `@heycape.bsky.social`. Changed everywhere they appear (Previews on X/Threads/Bluesky, Replies, the Day feed, Who, the hero examples (EX), Studio's clients and Rafael's quote): `@junpark`, `junpark.bsky.social` → `@jun.example`; `@anaruiz` → `@ana.example`; `@priyanair` → `@priya.example`; `@samokafor` → `@sam.example`; `@marcov` → `@marco.example`; `@rortiz` → `@rafael.example`; `@theowrites` → `@theo.example`; `@ridgeline_dan`, `ridgeline.bsky.social` → `@dan.example`; `@lenaf` → `@lena.example`. legal.html and the OG card show no side character's handle; hero-sync reads EX from the page. The visitor's own placeholder (`@you`, `@you.bsky.social`) stays: it only ever carries the visitor's line.

**Founder**
- founder-4: Results shows on Pro's collapsed card (from 761 as its fifth row; on a phone in "250 rewrites"' place, as "Results: what landed, what to write next").
- founder-5: a clean result ("Already sharp") ends on the engine's own why, with no rewrite offer after it; the offer stays only on a line that was marked but kept.

**Marketing**
- marketing-1: the pricing lede is one line, "Pay for volume, never for the basics."; "A rewrite is three takes of a line, or up to ten reply drafts." opens the fine print under the cards.
- marketing-2: one "Kept" per result. keptLine folds the kept words the engine's note names (`Kept your “i think”: …`, `Kept “about 40”: …`) into the facts and the lowercase: "Kept $BTC, 98k and your lowercase.", "Kept eth, 4k, btc, your “i think” and your lowercase."; the note keeps only what isn't a kept word (the over-280 line). Hero (EX[].kept, #pf-kept), Try and the final; hero-sync passes R.note to keptLine.
- marketing-3: the AI answer owns what the page shows: "It’s AI that edits your line, and drafts rewrites and replies in your voice." (the claude_try.py sentence is verbatim).
- marketing-4: the Day ping: "Your 8:40 post is getting replies. Your answers are drafted." Pro's row says the same thing the Results tile measures: "A ping when a post gets more replies than usual, with your answers drafted"; legal.html matches (no "takes off" left on the page or in legal).
- marketing-5: the List starter is "Here are 5 mistakes from my first year of newsletters:" → "5 mistakes from my first year of newsletters:" (a list hook on its colon, one number; it fits two lines of the box at 360).
- marketing-8 (cheap, done): the footer's Traders, Founders and Newsletter writers links each go back to the hero with that example playing (its pill focused), so they are no longer three links to #who.
- marketing-6: a line that only announces the post ("In this thread I am going to break down…", "I've put together a list of…", "Today I want to talk about…") gets its own reason under "Could cut": "Announces the post instead of starting it. Open on your first point; the post speaks for itself." The engine's "excitement" reason stays for excitement ("Excited to share…").

**Web**
- web-1: the three collapsed lists end level. Free: the fair-use note waits in the full list, scheduling reads "15 scheduled posts a month go out at your time, then each waits for your tap", and "Learns your voice from 8 posts" shows; Pro shows Results, its "Those drafts don’t use rewrites." note waits in the full list; Studio shows "Sent from each client’s own X account". Room above "See everything included" at 1280/1440: 14 / 77 / 120 px → 14 / 14 / 36. At 761–900 Studio's list keeps two columns of three.
- web-2: the bento's end is no longer three full-width tiles. From 1100: Replies (7) beside Trust (5), then Results (5) beside Who (7), then Studio full width, closing the bento. No tile is stretched past its own content to a taller one: each row pairs a tile as tall as its own content with one built to give (Trust, its own height, beside Replies, whose teaser runs on to the card's edge; Results, its own height, beside Who, whose four posts share out any spare height). Trust reads as one column at every width; Who is one column of four posts at 7 columns, its heading at the tiles' Standard step. Natural heights at 1200+: Replies 412 → 456 (Trust's), Who 516 → 547 (Results'); at 1100–1199 Replies gives up to 112 px of teaser.
- web-3: the final's columns share a top: the heading's cap line and the draft card's top edge (within 1 px at 1024–1920).
- web-4: a struck word the field has scrolled past loses its squiggle at the left edge, so no mark shows in the field's padding.
- web-6, web-7 (cheap, done): the hero receipt's groups ("Cut …", "Split at …") wrap whole, never indented; the hero post's name row hides the handle when name, tag and handle don't fit (Marco at 390 and 1024), so nothing shows two ellipses.

**UI/UX**
- uiux-5: every control's real hit area is at least 24×24 (new `tapscan.js`, elementFromPoint at 360, 390, 768, 1024, 1440, the Try box and the final both sharpened). The one short of it was a struck "so" at a line's start: the mirror's clip edge now sits 4 px outside the text (same measure), a short word's reach is 26 px, and it sits on top of a longer neighbour's.
- uiux-6: the hero draft's cues read "Try this draft" (touch) and "Try this draft in the Sharpen box" (pointer), inside its accessible name.
- uiux-10: Trust's heading dims its second line like every other heading.
- uiux-8: the hero's Schedule opens the sheet with the post you just watched, as "Example post:" (never "Your line", never queued as yours).
- uiux-7: one input model. The final marks the soft words as you type, like the Try box, and its card waits for Sharpen or Enter ("Paste one in and tap Sharpen."; "An example. Tap Sharpen and yours takes its place."). An edit of the line on show dims its result and puts Keep away; undoing the edit brings it back; an emptied field brings the example back; with the engine down, typing shows the error state as before.

**Brand**
- brand-1: the footer's giant mark is grazed from above: a copy of the mark lit in ember, cut to the top rim of each letter (the letter less itself moved down 1.1 units, so it scales with the mark), brightest over the k and gone by the ends, so the crop at the page's end reads as the light's horizon.
- brand-2: the sheet's backdrop is frosted (blur 10 px, saturate .9, scrim .78).
- brand-3: Google's four-colour G inside its button (the one sanctioned exception to the monochrome marks).
- brand-4: a tab icon drawn for 16 px, `assets/brand/afterglow-favicon.svg` (the hook-h at .95 scale, stroke 4.4, a 6-unit radius); home and legal link it. The 32-px-and-up icon keeps its proportions.
- brand-5: see Who above.

**Skipped**
- Engine-side (the engine engineer's v4.9): founder-1, uiux-1, uiux-2, uiux-3, uiux-4, marketing-7.
- founder-6 (a free first voice learn): a pricing decision, not the page's to make; the fine print stays true to the app.
- uiux-9 (an over-280 result drawn as a thread in Try; Previews already shows the split), web-5 (761–1099 focus order), web-8 (Try's height after a put-back at 390; the Previews fade at 1024), web-9 (CSS caching): not in this pass's brief.

**Numbers (final build, against v4.9; the full suite on sharpen.js of 12:07, spot checks on 12:19's)**
- Screens: 9.97 at 390 (budget 10.0; 8,412 px, was 9.95), 10.49 at 360 (10.5; 8,179 px, was 10.49), 9.46 at 768, 8.44 at 1440 (was 8.70). The Who rows' second name line costs ~16 px a row on phones; it is paid for by the one-line pricing lede (−50 px), the List starter kept to two lines of the box at 360, and a little less air around each Who post.
- CLS 0 at 15 widths from 360 to 1920; no overflow and no heading over two lines from 320 to 1920 (`sweep.js`).
- Largest empty gap (`gaptest`, 1024/1280/1440/1920, pass-13 build → this build): Trust 19/17/17/17 → 21; Results 22 → 22; hero ≤ 29 → ≤ 29; Studio ≤ 27 → ≤ 27; and now Who 22/19/19/19 → 22 and Replies 22 → 22. `gapsweep` (1024–1920, 16 px steps, now with Who and Replies) passes.
- home.html 286,870 B / 75,518 B gzip (was 282,591 / 74,259). The pricing room above "See everything included" at 1280 and 1440: 14 / 77 / 120 px → 14 / 14 / 36. The final's heading cap line and its draft card's top: within 1 px (it was ~45 px).
- `check.js home` and `legal` ok:true (axe 0). `trytest` (1440, 390), `p7test`/`p8test` (1440, 390, 360), `p9test`/`p10test` (1440, 390, 360), `sheettest` (1440, 390, 360), `freezetest` (1440, 390, 360), `p11test` (1440, 1280, 1024, 900, 768, 390, 360), `p12test` (1440, 1280, 768, 390, 360), `p13test` and the new `p14test` (1920, 1440, 1280, 1024, 900, 768, 390, 360; p14 also 1100), `gaptest`, `gapsweep` (1024–1920), the new `tapscan` (360, 390, 768, 1024, 1440), `footgo` and `verifymin` pass (verifymin once read a 0.75 px sub-pixel difference at 390 and passed on two reruns). The copies of trytest, p10–p13 in `fix14/` take this pass's intended changes: the final waits for Enter, a mark scrolled past the field's left edge also carries `off`, the hero's Schedule carries "Example post:", the fine print's "5&nbsp;rewrites", the AI answer, the one-line lede, the ping's and legal's wording, and five collapsed rows per card. build_pub.py (scratchpad/pub) runs with no assertion errors (it now maps the new favicon) and `pubtest.js` shows the on-device line, then Claude's, on core.js alone.

## Pass 15 (brief: `r86/FIX15.md`, re-rate reviews in `r86/rerate13/`)
Engine v5.0 landed during this pass (sharpen.js regenerated 07:11); hero-sync ran last with `--write`, then build.py remade sharpen.min.js. Scripts and outputs: `scratchpad/r86/fix15/`.

- **P1, "Nothing to cut" (founder-1, uiux-1, marketing-4):** a clean result in Try and the final is a pass: the card is lit like a sharpened one, the receipt carries a tick, the engine's own "This quick check…" why stays, then "Want three other ways to open it? Get a rewrite in your voice, free" and a white "Schedule it free" (sheet intent schedule; an example's line rides as "Example post:"; the done copy says your line is ready to schedule). The final's field says "Nothing to cut".
- **Brand:** from 1100 the paired bento rows share one heading step (30px; full-width tiles stay 40), one cap line per row; Priya's Studio photo is a strip of the table and laptops (no faces, about 1:1 at 2x) and every in-card photo carries the shared grain; the "You" avatar is a glass disc with the gradient hairline; phones keep a compact lit payoff card under the final's form, and the phone hero's light lands on the post's rim with no shaft over the text; the pricing lede ends on the content edge, on the baseline of "Forever.".
- **UI/UX:** Replies shows whole replies only plus an "N more replies" row when it fits (the rest of the room is shared under the thread); the phone LinkedIn screen fades on the next post; "Replaced · Undo" is now "Your line was replaced · Undo" / "Example replaced · Undo", fading after 6 s or at the next Sharpen; struck words get a 44px-tall reach on touch (tapscan passes); the final's empty submit is announced in #fin-status with aria-invalid.
- **Marketing / founder:** Free reads "15 posts a month go out at your time. After that, one tap each." (phones: "15 posts a month go out at your time"); the fair-use note shows at every width (a short form at 360); phones show Pro's "250 rewrites" in Results' place. The default why is the engine's (v5.0 now names the change).
- **Web:** the hero frame holds the tallest example's height at every width (measured in a hidden sizer; spare spread over the panes' gaps); Day photos drawn ≤880px wide from 901; Studio's 768 list is 3+3; Try keeps a dim copy of the last result while the strike plays.
- **Numbers:** 9.955 screens at 390, 10.488 at 360; CLS 0 at 15 widths; gaptest and gapsweep ≤32px (Studio 27, Replies 25); check.js home/legal ok.

## Pass 16 (brief: `r86/FIX16.md`, re-rate reviews in `r86/rerate14/`)
Engine v5.1 landed during this pass; hero-sync ran last, then build.py remade sharpen.min.js. Scripts and outputs: `scratchpad/r86/fix16/`.

- **Brand:** the phone hero has its own static ember beam (≤760): narrow, raking in from past the right edge through the band under the buttons and right of "Free forever · No card", landing as a hot spot on the window's top hairline; no motion at phone width. A strike means a cut and only a cut: a split point (a reshape the receipt calls a split) is a thin caret at the break with the word dimmed, in the hero, the Who tile, the Try mirror and the final's draft (never falls, never struck). The visitor's avatar (`.av.you`, everywhere "You" appears) is the glass disc carrying the wordmark's h.
- **UI/UX:** no skeleton in the hero: the first frame dims the post, its "Why it hits" and the receipt together, real words, and the strike wakes them as one (the no-script fallback plays at 2.5 s). One label, "Why it hits", for every explanation (hero, Try, final). The hero's Cut/Split chip row is gone (hero-sync now checks it stays gone). Phone text CTAs ("Start with Studio · $18 a client", the final's "Or just start free") get 5px of padding each way, taken back by margin, so the tap area clears 24px without moving a row.
- **Web:** Studio is two panes (client list, review link with Approve); the voice card and queues left the tile. Every example photo is drawn from a frame at most 500px wide (1.25x on a 2x screen): the Day halves are crops at the top of each half fading into the ground, the Results wallpaper fades at its foot, Priya's and Lena's strips are crops of a 500px frame (3.8:1 strips; Marco's chart matches; Rafael's quote holds the same height). The phone chip row fades out 22px inside the tile's edge. The Threads nudge is a short fill on the tab, inside the track. A filler word is never listed under "Kept": when the engine keeps one on purpose ("Kept “basically lost 30%”: it says nearly, not exactly."), the page drops it from Kept, marks it softly in the draft (the dotted "your call") and says "Left “basically”: it says nearly, not exactly." (Try and final, every state).
- **Founder:** Free reads "15 scheduled posts a month. After that, we nudge you and you tap Post." at every width (the sheet's done copy says the same); phones show Pro's reply ping as a key line ("Reply pings with answers drafted"; volume in one line, "500 posts and 250 rewrites a month"). Each hero example has its own best time: heycape 8:40 AM (the Day tile's), Priya 9:10 AM, Ana 6:45 AM, Marco's "Waits for Marco's yes · Thu 8:05 AM".
- **Marketing:** the Free card defines a rewrite before using it as a unit ("A rewrite is three new takes on a line.") and says "Reply drafts when you ask" (the ten-drafts maths stays in the footnote). FAQ: "Before you paste your first line." Results runs as one sentence over two lines: "Know what landed and what to write next."
- **Numbers:** 9.956 screens at 390, 10.492 at 360 (the ≤374 pricing cards run a step tighter); gaptest ≤32px at 1024, 1100, 1280, 1440, 1920 and 390; tapscan, freezetest, trytest, p14test pass at 1440 and 390; check.js home ok; photos ≤1.25x at 2x everywhere they show.

## Pass 17 (brief: `r86/FIX17.md`, Fable 5.2 jury reviews in `r86/fable/`)
Page side only; the engine items (long-line cuts, the announce + "that" clause, stray colons, false "breaks" notes, soft results) were another engineer's, in core.js. Scripts and outputs: `scratchpad/r86/fix17/` (the new `p17test.js`, `tryclip.js`, `microcon.js`, `longp.js`).

- **Marketing P1:** the Try mirror is as wide as the textarea (it was 8px narrower, so a struck line could wrap to a third row the box hid). On phones the mirror's box also reaches past the text (its text stays put), so the struck words' tap areas aren't clipped.
- **Web P1:** the hero draft is never narrowed: levelHero levels only the post's pane. From 1200 the panes run 1fr/1.15fr with 28px padding, so every example's draft wraps in two natural lines (at 1024–1199, three). The draft pane's spare height is shared by its five gaps, the door's "Try this draft in the Sharpen box" cue rests as a quiet row under Kept (mouse, two panes), and the sharp pane's foot and why sit a step tighter. Hero post bottom 770 at 1440×900, Schedule 890.
- **Over 280 (UI/UX, founder):** a paste over 280 (or `R.long`) shows post 1 of a thread: the line's first sentence, or for one long run-on its first clause closed with a full stop. Its note: the engine's own long note when it gives one, else "Long for one post, so it opens a thread.", then "Post 1 is above; the rest becomes post 2." A why that quotes words now in post 2 steps aside. Try and final.
- **Tap targets:** every phone control answers a 44px tap each way (invisible centred areas, side scrollers padded 4px and taken back by margin, footer rows 44px apart); `tapscan.js` now holds phones (<500px) to 44px. A struck word in a sentence keeps the 24px floor where its neighbour lines share the space (WCAG's inline exception).
- **Founder, brand:** "Nothing posts without you" is back in the hero's phone trust line (one row at 360) and in the closing card's phone row ("Nothing posts without you · Or just start free"). The phone beam rakes in flatter, under the line, and stops at its foot: the line holds 6.2:1 at 360 and 390.
- **Brand:** "hookworthy." in the H1 is soft white (#F7F8F8); the nav wordmark is 21.7px tall (21.2px on phones); the closing card lost ~75px of slack (64/48px padding at 1200+, "An example" note gone at every width, as on phones). The Pro card's top hairline is lit ember, like the Sharpened card's rim.
- **Web:** the FAQ heading's column carries a short lede and hello@hookworthy.com (900+).
- **Marketing:** a "Why it hits" quote of the line is whole (`wholeQ`: carried to its clause's end when short, else cut back to a phrase break); "Split into 2 beats" in any case; "Nothing leaves your device." and "The demo on this page is a quick check that runs on your device. In the app, Claude makes the edit. Either way, nothing goes out until you send it." (claude_try.py updated to match). "“literally” was talk, not the point." is the engine's why for the final's example (hero-sync), so it stays.
- **Founder:** the fine print is the one place for the rewrite: "A rewrite is three takes on a line. Ten reply drafts use one. Learning your voice uses 5, once. Answers drafted for Pro’s reply pings use none." (Free's sub-line and Pro's "Those drafts don’t use rewrites." went; "More than 8 clients?" moved to the clients answer). Pro adds "Free covers about one post every other day." (761+). The sheet's end makes the working app the white pill and "Back to the page" the quiet link. An all-filler line reads "Nothing to post yet".
- **Numbers:** 9.957 screens at 390, 10.496 at 360; CLS 0 (1440, 1280, 1024, 768, 390, 360); gaptest ≤32px at 1024, 1280, 1440, 1920 and 390; tapscan (44px phones), freezetest, trytest, p14test, p17test and sheettest pass; check.js home ok.
- **Skipped:** web-6 (every Who row keeps its "Example" tag: the pass-14 honesty rule), web-5 (the Try tile's Start free pill) and uiux-6 (the Day steps), which weren't in the brief's list; uiux-1 and marketing-6 are engine items.
- **hero-sync** ran last and passes against sharpen.js of 08:40 (core.js, changed at 08:46, agrees on every hero draft); build.py then ran and the sources are in `src/`. build_pub's check passes with the updated claude_try.py. Rerun hero-sync and build.py once the engine's final sharpen.js lands.

## Pass 18 (brief: `r86/FIX18.md`, Fable 5.2 round-2 reviews in `r86/fable2/`)
Page side only; the engine P1s (stacked hedges, thread intros, hype words, the "!!!" cut) were the engine engineers' (v5.3, `r86/engine/MARKS.md`). Scripts and outputs: `scratchpad/r86/fix18/` (new: `calltest.js`, `timetest.js`, `p18m.js`, `staleline.js`, `longtop.js`, `tot0.js`, `fsrule.js`).

- **Your call (step 1):** the engine's kept hedges, stance words and hype words (`[a, b, why, 'call']`, `R.calls`) are drawn in Try and the final with a soft dotted underline in the ink's grey (never a strike, never ember). A tap cuts that word from the post on show (struck, "Put back “i think”"); the engine isn't re-run, the cut uses `SHARPEN.callCut` when the bundle ships it, else the same rule on the page (the comma goes with it, a sentence start keeps its capital, a/an fit). The chip row names them under "Your call:" with each reason (hover or focus on the word shows it too; the final's tip line does the same). The receipt counts them ("Nothing cut · 2 your call", then "You cut 1 · 1 your call"; a count the line on show no longer has is stripped). "Nothing to cut" / "Kept as written" with calls get a real button: "Cut “probably” too" or "Cut your calls too" (it cuts the rest; then "Keep it. Start free"); "Kept as written" without calls gets "Schedule it free". The page guard never reads a call as fluff the line opens on. No hero example has a call, so the hero is unchanged.
- **Labels (marketing-1/2):** a cut-only result that leaves the writer's calls is "What changed" ("Tightened it", "Cut the warm-up" and the like count as light); a line that moved stays "Why it hits". The why names what's left ("Your call: tap “i think” to cut it.") and, once the visitor cuts one, drops the engine's now-untrue "Kept “i think”…". A why that quotes most of the line is cut back to its opening phrase ("It now opens on “We just raised $2M”, not the run-up to it.").
- **Brand:** the scrolled nav is .94 glass with a 24px blur; the 8:40 notification says "Your 8:40 post is getting replies. Answers drafted." on phones (two lines, 9px clear of the heycape row); from 761 the small type is one size per step (13 and 15; 16 and 17; 22 and 25; 1440 now uses 12, 13, 15, 16, 17, 22, 25, 30, 40, 52, 64, 72, 99), phones keep theirs; badges are 12px; the phone sign-off mark is brighter (fill .12, rim .85).
- **UI/UX:** the Ghostwriter's foot button reads "See Studio’s review flow" with the down arrow; the split point is a short cap-height bar at 38% in the middle of the space (with .2em more air outside the Try mirror); a long paste scrolled inside the box fades its clipped top row as well as the last.
- **Web:** the sheet's white pill breaks only as "Open the working app / on claude.ai (demo data)"; arriving at Try, the example result enters from 0 with a 6px rise as it comes into view (full in 100–240 ms, `timetest.js`; Replay keeps cause, then effect), and Replies' answer row pops in 0.2 s with typing from 0.12 s; the FAQ column is anchored (heading at the top, lede and address on the list's last hairline).
- **Founder:** the Studio sheet says "4 clients: $72 a month" ($96 monthly); the phone's Studio line reads "$216 per client, billed yearly"; the add-on price sits once under Pro's rewrites line ("Need more? +250 for $8 a month"; the full list keeps the bigger packs); at 360 the bento runs 16px inside each tile and 10px between, the previews end on a one-line split note, the 8:40 phone is 22px shorter and the voice rows a step tighter; the content-visibility placeholders are re-measured, with a band of their own at ≤374, so the page is its true height before anything renders (the founder's load-time measure now equals the scrolled one).
- **Marketing:** the fine print is "A rewrite is three takes on a line. Ten reply drafts count as one. Cancel anytime: a yearly plan runs to the end of its year."; the voice cost sits with Free's "Learns your voice from 8 posts" (now one of its key rows from 761) and the ping's with Pro's ping row in the full list; Free's caveat is the short form at every width in 12px ("Past fair use: a lighter check, still free."); clearing the box or loading an example clears the sheet's "Your line" and the hidden status; the voice card opens "Put back once already. Once more and it stays."
- **Skipped:** uiux-6 (a phone nav menu, a bigger change), brand-4 (Google's brand rules require the colour G).
- **Numbers:** 9.982 screens at 390 (8425px), 10.363 at 360×780 (8083px). The load-time measure (no scroll-through) now matches the scrolled one: 9.98 and 10.36. CLS is 0 at 15 widths from 360 to 1920. gaptest is ≤32px at 1024, 1280, 1440, 1920 and 390, and tapscan passes (44px on phones). These pass at 1440 and 390: freezetest, trytest, p14test, p17test (its fine-print checks now say "each cost said once"), sheettest and the new calltest; timetest shows Try at 100–240 ms and Replies at 50–140 ms. axe is clean in the call states, and check.js home is ok.
- **hero-sync** ran last with `--write`, then build.py, which remade sharpen.min.js. It is synced against sharpen.js of 13:21. The engine's v5.3 drops the full stop at the end of a lowercase line, which changed EX[0], EX[3], WHO[0], the Try default and the final's example. READY53.md had **not** landed when this pass ended, and core.js was still changing (13:25). Rerun hero-sync (`--write`) and build.py once the final sharpen.js lands. The sources are copied to `src/`, and build_pub's check passes from a scratch copy.

## Pass 19 (brief: `r86/FIX19.md`, Fable 5.2 round-3 reviews in `r86/fable3/`)
Page side only. The engine-text items (the kept "HUGE NEWS", the "AI-powered … (kidding)" joke (uiux-5), "Here are 7 lessons…, a thread", the "gm." why, the say phrasing, "Split it into two beats" in engine says) are the engine engineers' (v5.4, core.js). Scripts and outputs: `scratchpad/r86/fix19/` (new: `touchtest.js`, `p19test.js`, the rewritten `tapscan.js`; `tapscan18.js` is the old one).

- **Touch (uiux-1, P1):** a tap on a struck word or a dotted call toggles it from the very first tap, on touch too, in Try (the untouched example included) and the final. It never focuses the textarea or the final's field, so no keyboard opens; after a toggle on touch, focus stays on the word and never falls back to the box. `touchtest.js` (hasTouch + isMobile, 390 and 360) checks first and second taps on struck words and calls in both places.
- **Ana Ruiz (marketing-1, P1):** her row is now "So in this issue I wanted to say that your open rate is lying to you" → "Your open rate is lying to you." (the engine's own result, sharpen.js and core.js agree; cuts "So" and "in this issue I wanted to say that"). Its "Try it" loads that draft and Try shows the same line.
- **Your call, said once (marketing-2, P1):** the how-to lives in the helper line only ("Tap a struck word to put it back, a dotted one to cut it.", or "Tap a dotted word to cut it." when nothing was cut). "Your call: tap “i think” to cut it." left the why, the dotted-words line left a why that had the engine's own, and a call's reason shows without the engine's trailing "Tap to cut it if you’re sure." (`callR`, display only). The receipt is the engine's `say`, as given.
  - **What I'd want the engine to say:** `say` "Cut 1 bit of fluff · 1 left to you" (or "· 1 is your call"), not "· 1 your call"; call reasons without the how-to ("Your stance on a prediction."), since the page gives the how-to once.
- **Tap targets (uiux-2, web-4):** `tapscan.js` now finds every visible interactive element by what it is (links, buttons, fields, labels, ARIA widgets, tabindex, anything with cursor:pointer), plus the states that add controls (the sticky bar, every FAQ answer, Studio after Approve, Replies after Reply, the voice card after Put it back, the sheet). The pills the jurors measured ("Try it", "Studio", "See it again", Replay, "See everything included", "Put it back") already answered 44px through their hit areas; the scan found four that didn't: the Try box's label, the sheet's close (36px), its Sign in / Create links and a link inside a FAQ answer. Each got an invisible centred hit area. 120 page controls + 6 in the sheet pass at 390 and 360 (44px); 139 + 6 at 1440 (24px). Struck words inside a sentence keep WCAG's inline exception (24px).
- **Sharpen card (brand-1/2, web-1):** the title is 40px at every width, like the other big titles. The tile no longer holds room for the tallest starter (it held 681px, about 75px of empty glass under the CTA). It holds the example's own height (651px at 1200+, 684 at 1100–1199) and a taller result grows the row; the Previews feed takes the row's height. The pill sits on the post card's left edge (0px off). The content-visibility placeholders were re-measured, and CLS is 0 at 15 widths.
- **FAQ (brand-4, web-3):** the note sits 24px under the heading, and the column is sticky (top 104px), so there's no void while the rows are closed.
- **Final (web-2):** the live count moved out of the pill, to just above its right end. The typed line now has the whole field (22px padding each side, 18px on phones), and the count never clips it.
- **Studio (web-5):** Rafael's quoted post is its own height. It used to reserve 128px for a photo he doesn't have; the review's gaps take up the rest. At 901–1199 the quote sits 18px under his line and the slack is spread evenly around the review's four parts (gaptest ≤30px; 26px from 1200).
- **heycape (brand-3):** the avatar is a tighter crop (136%, face and glasses), a touch brighter, with a clearer rim (.2). Same artwork.
- **Night card at 390 (brand-5):** step 1 shows at once. Steps 2 and 3 show as dimmed shells (opacity .38) that light up at .25s and .5s, so it's never an empty blurred block.
- **Hero Schedule (uiux-3):** it does the same for all four examples: it opens the schedule sheet with that example's line ("Example post:"). The Ghostwriter's jump to Studio is gone, and so is the now-unused `toClient`.
- **Kept receipt (uiux-4):** "your lowercase" shows only when the draft and the line have no capital outside links, handles, tags and $tickers (never on "HUGE NEWS"). A number keeps its plural noun ("Kept 3 plans"). A call the visitor cut is no longer listed as kept.
- **Whole quotes (founder-1):** a quoted opening is cut back only at a phrase break (punctuation, a joining word, or a time tail like "today"); with no break, it stays whole. "I am very excited to announce that we just launched our new product today!" now reads "It now opens on “We just launched our new product”, not the run-up to it."
- **Copy:** "On this page, nothing leaves your device." (founder-2; claude_try.py updated to match). The Studio bullet is "Up to 8 client voices. Yours is included." (founder-3). This is true per index.html: adding a client costs `$18 × client voices`, and `clientVoices()` doesn't count your own. Free's caveat is "After a daily limit, a quicker check. Still free." (marketing-5; one line at 360, so it fits the budget). The footer's For links go to `#who-trader`, `#who-founder` and `#who-newsletter` (each Who row has its id, scroll margin and a one-time glow), with Ghostwriters going to `#studio`. legal.html's footer matches (founder-5).
- **Page-written whys (marketing-3/-6):** when the visitor cuts a call, the page's why now says what the line does: "You cut “i think”, so it now opens on “$BTC might hit 120k”." (or "…so it reads as a claim, not an opinion", "…so it reads as sure", and so on, from the call's kind). It no longer says "You cut “i think”. Every fact stays as you wrote it."
  - **Engine whys that only say what was cut** (left to the engine, for v5.4):
    - "“X” was talk, not the point. The line says the same without it." (the final's example, "literally", and most single-filler cuts)
    - "The run-up is gone, so the first words people read are yours." (the "gm. just wanted to say that $SOL…" line, and other run-ups)
    - "“So” and “basically” went, so the line opens on what you came to say."
    - "“so excited to” was in the way of the point. The rest stands on its own."
    - "It now opens on what you came to say, not the run-up to it."
- **Move words (marketing-4):** the page no longer rewrites the engine's "Split it into two beats" as "Split into 2 beats". Every receipt shows the engine's words, so the hero and Try now agree. "Said it straight" (a "you should" reshaped into a rule) and "Said it plainer" (a plain-word swap) are two different engine moves. Nothing on the page writes either one itself, so unifying them is an engine call.
- **Start free (marketing-7):** the label now changes with its context in three places:
  - Try's idle button, under an example's result: "Sharpen every post free".
  - Pricing's Free card: "Start on Free".
  - The sheet's sign-in mode: "New here? Create a free account".

  The nav, the hero and the sticky bar keep the short "Start free". The labels after a result are unchanged ("Keep it. Start free", "Schedule it free").
- **Skipped:** uiux-5 (engine). founder-4 (list openers, "really" as a call) is engine-side and wasn't in the brief.
- **Numbers:**
  - Phone budget: 9.982 screens at 390 (8425px) and 10.377 at 360×780 (8094px).
  - CLS is 0 at 15 widths from 360 to 1920.
  - gaptest ≤32px at 901, 960, 1024, 1100, 1199, 1280, 1440, 1920 and 390.
  - tapscan (every control) passes at 390, 360 and 1440. touchtest passes at 390 and 360.
  - These pass at 1440 and 390: freezetest, trytest, p14test, p17test, calltest, sheettest and the new p19test (also at 360). p18m's Ghostwriter and FAQ checks were updated to pass 19's behaviour.
  - check.js home is ok.
- **hero-sync** ran last, then build.py. It passed against sharpen.js of 17:34 (the page's engine; sharpen.min.js is current), so no `--write` was needed. It also warned that core.js, which the engineers were editing for v5.4 (18:35), now disagrees with sharpen.js on one hero draft's result, though line, why and say are the same. Once v5.4's sharpen.js lands, rerun hero-sync (`--write`) and build.py. The sources are copied to `src/`, and build_pub's check passes from a scratch copy.

## Pass 20 (brief: `r86/FIX20.md`, Fable 5.2 round-4 reviews in `r86/fable4/`)

- **Voice card (uiux-1, marketing-2, P1):** it starts untouched: 0 of 2 dots, "Put “ngl” back twice and it stays." The first tap reads "You put “ngl” back once. Once more and it stays for good."; the second, "Learned: “ngl” stays from now on."; cutting a learned word, "Unlearned. Put “ngl” back twice and it stays." From 390 to 760 the helper holds three rows from the start (text centred), so a tap never moves the card. Below 390 the `.kpx` words drop as before ("Once more and it stays for good."), so the line keeps to two rows beside the button.
- **Over 280 (uiux-2, P1):** the page has no thread rule of its own now. It shows the engine's post 1 (`R.thread`/`R.line`), or, for a sharpened line the engine ships whole over 280 (`R.long`), `SHARPEN.firstPost(line, draft)`. Post 2 sits under the card in one dimmed line ("Post 2 · and then we rush…"), in Try and the final. The receipt reads e.g. "Cut 2 bits of fluff · Opens a 2-post thread", and "Why it hits" leads with "Too long for one post, so it opens a thread. Post 1 ends on a whole sentence, and post 2 picks up from there.", then the engine's why.
  - **Page-side override, thread case only:** a receipt part or a why that claims beats or a split ("Split it into two beats", "Two short beats with a full stop…") is dropped, and so is the engine's own "Post 1 of a thread" part and its thread note, since the why now says it. The old page cut re-split lines the engine had already brought under 280: that was the "two beats over one sentence" bug. A 290-character draft that sharpens to 274 is now one post, and its two beats show on the card.
  - **What I'd want from the engine:** in the thread case, a `say` of "… · Opens a 2-post thread" in place of "Post 1 of a thread", and a why that never mentions beats unless post 1 shows the split. The page could then drop its override.
- **Page = core (Sharpen juror):** the page's duplicate guard is gone (`guard`, `guardWhole`, `gWhole`, `gOpensMarked`, `asWritten` and `LOCK`, about 4 KB). Try and the final now render `HWCore.sharpenLine` as it comes. "It goes without saying that your first line beats everything else combined." now shows "Your first line beats everything else combined." The launch line shows the engine's own result: v5.4 gave "We’re launching our new smooth AI dashboard.", and v5.5's sharpen.js, landed at 01:54, gives "We’re launching our new AI-powered dashboard." with "AI-powered" as a call.
  - The new `fix20/paritytest.js` checks 34 varied lines in Try and the final at 1440 and 390: links, handles, $tickers, the 290- and 320-character lines, a 337-character thread, a multi-line paste, a list, a frame, calls and French. Every card is exactly the engine's line (or its post 1 and post 2). It passes against the v5.4 bundle and against the v5.5 bundle.
  - hero-sync no longer lifts a GUARD block. claude_try.py's anchors were updated for the removed `guard(`.
- **Marked, nothing cut (brand-1 page side, marketing-5):** the receipt reads "Marked N · your call", never "Kept as written". N is each marked span once, a call included, less the words the writer put back. No post card repeats the draft (`.mk`). The marked draft in the editor is the result, with the reason and the way on under it. The way on is either the writer's calls ("Cut “kind of”", or "Cut all 3"), or "Get three takes, free" with "Keeping it as written? Schedule it free" as the text link. The final behaves the same way and its count says "Marked N". The engine's stock-adjective calls ("AI-powered" in v5.5) render like any other call.
- **Clean result (founder-4):** the pill is "Get three takes, free" (rewrite sheet). "Happy with it as it is? Schedule it free" is the text link (`[data-sch]`, schedule sheet). Both carry the line. A two-word post keeps "Schedule it free".
- **Kept line (web-5):** a bare list marker ("1)", "2)") is never listed, nor is a digit found only inside another number. The reviewer's line now reads "Kept 5 things, 40% and your lowercase."
- **Copy:**
  - Studio: "Up to 8 client voices. Your own voice is free." (founder-2, marketing-1). This is true per index.html: `PRICES.studio` is per client voice.
  - The phone's closed Free card: "15 scheduled posts and 20 rewrites a month" (founder-3). That matches index.html's `FREE_POSTS = 15` and 20 Claude rewrites; desktop keeps the full sentence.
  - Scheduler FAQ in three sentences (founder-5).
  - ChatGPT FAQ in 47 words (marketing-3): "It starts from what you wrote. … This demo runs on your device; in the app, Claude makes the edit. Nothing posts without you." It doesn't claim "it doesn't write for you", since reply drafts are writing. claude_try.py's anchor was updated.
  - Sheet: "Open the working demo (sample data)" (marketing-4), with the same destination. build_pub doesn't depend on the old string.
- **Brand:**
  - "You" is a soft-white "Y" initial on #1A1B1E in the glass rim (brand-2). The h mark stays Hookworthy's own.
  - Day heading (brand-3): a left-to-right scrim under it. "Post it at 8:40 AM." is now ≥6.3:1 against the brightest pixel behind its glyphs (6.49 at 1440, 6.33 at 1100; `fix20/daycon.js`).
  - Text greys are three tokens (brand-5): `--ink-2` #A4A8AF body, `--ink-3` #8D929A meta, `--x-mute` #7D8288 faint. `--x-ink-2` (#B4B8BE) is gone, and the two "·" separators moved off `--ink-4`, which is decorative only. The previews keep their own skins.
  - The phone bar's pill is capped at 240px on the frosted bar, 46px tall (brand-6).
  - The nav and footer wordmark use `#wm-s`, which pulls "ookworthy" 2 units (0.02em) towards the hook tail (brand-4). The giant footer mark keeps `#wm`; both use the same paths, in `<defs>`.
- **UI:**
  - Sheet (uiux-3): on phones the close is a 44×44 box and the Sign in / Create links are 50×50 boxes (inline padding), not only hit areas.
  - Previews (uiux-5): the network switcher and Example/Yours are `role=tablist` with roving tabindex. Left/Right/Home/End move and select, and the panels are `tabpanel`s labelled by their tabs.
  - Day at 1440 (uiux-6): the timeline sits 44px under its heading at every two-column width; the spare room is below the last card.
- **Layout:**
  - web-1: the Try pill sits 19px under the card. From 1024 its foot is level with the Why column's last line (the Kept line drops to meet it).
  - web-2: the pricing lede sits under the h2, left-aligned, 16px below.
  - web-3: the Previews title drops 8px from 1100, so both first-row titles share a baseline (1129.3 = 1129.3).
  - web-4: the "8:40 AM" chip sits on the phone's left edge, at Replay's top.
- **Phone budget:** 9.985 screens at 390 (8427px) and 10.394 at 360×780 (8107px). Studio's new bullet takes two rows at 360, so the ≤374 cards run a hair tighter: padding 13px, list gap 6px, card gap 8px.
- **Tests (in `fix20/`):**
  - These pass at 1440 and 390: check.js home (ok:true, axe 0), gaptest, freezetest, tapscan (every visible control: 44px on phones, 24px at 1440), touchtest, trytest, p14test, paritytest, and the new p20test (also at 1024).
  - trytest, touchtest and p14test were updated to pass 20's rules and to the v5.4 engine. A put-back "i think" now comes back as a call, and the touch line needs one.
- **hero-sync** ran last, then build.py, and the final sources are in `src/`. hero-sync passed against v5.5 sharpen.js (01:54) with no `--write` needed: sharpen.min.js is current, and core.js (01:58) agrees on every hero draft. build_pub's check passes (scratch copy in `fix20/pub/`, with the updated claude_try.py). The engineers are still editing core.js, so rerun hero-sync (`--write`) and build.py once v5.5 settles.

## Pass 21 (brief: `r86/FIX21.md`, Fable 5.2 round-5 reviews in `r86/fable5/`, the Sharpen juror's notes in `fable5/work-hook/home-check.json`)

- **First Sharpen tap (web-1, P1):** the tap paints first. `go()` sets the button's pressed, working state (`.busy`, `aria-busy`) at once, then yields (a frame, then the tasks already waiting: rAF + setTimeout 0 + setTimeout 0), and only then runs the engine and builds the result. The bundle loads in idle time after `load`, never in the first 1.5 s (`requestIdleCallback` with a 4 s timeout, or the frame-and-timeout fallback), so the first tap never parses it. Its warm-up now runs in idle time wherever the visitor is (it used to park until Try came near).
  - Measured at 390 under a 4x CPU throttle (`fix21/inp.js`, the juror's own order: load, wait 4 s, scroll, fill, tap). Click-to-next-frame went from 470 ms / 472 ms to 11–24 ms. A trusted tap's INP (Event Timing) is 72–96 ms, against 72–80 ms before. The first Sharpen's own task after the frame dropped from about 900 ms to about 190 ms at 4 s, and about 110 ms from 6 s.
- **X account access (founder-1, P1):** the sheet's fine print adds one line: "This preview doesn’t connect to X. In the app, nothing posts without your tap, and you can revoke access in X’s settings." There's a new FAQ item after "Does it post without me?": "What can it do with my X account?" It reads: "This preview doesn’t connect to X. In the app, nothing posts without your tap. Hookworthy never DMs, deletes or retweets for you, and you can revoke its access anytime in X’s settings." Both use only the four true facts, and neither claims OAuth scopes or that sign-in "can't post".
- **Threads in Try and the final (the Sharpen juror):**
  - The receipt says "Opens a N-post thread" once. N is the engine's own count (`R.thread.length`), and the engine's own thread part is dropped, never doubled ("Opens a 3-post thread · Opens a 2-post thread" is gone).
  - Every post shows under post 1, one dimmed line each (post 2, post 3), and a longer thread ends on "+N more posts".
  - The thread is explained once. The engine's own thread sentence leads the why ("It opens a thread: every post starts on a whole sentence."). The page's THREAD_WHY is only for the thread it cuts itself with `SHARPEN.firstPost`. In v5.5 that path returns nothing on the long lines tried, so those stay whole under the engine's note, as core does.
  - After a split, the counter counts post 1 ("Post 1 · 54 / 280"), not the draft. Typing brings back the draft's count.
- **"Your call" (founder-2, marketing-1):** a count of the writer's calls reads "· N left to you" in Try's receipt and the final's label. Both forms are read: v5.5's "N your call" is rewritten, and v5.6's own "N left to you" (in core.js now) is rendered as given, so it is never doubled. "Marked N · your call" (pass 20's own label) stays.
- **Layout:**
  - Pricing header (brand-2, web-4): from 1024, Yearly/Monthly sits at the right edge, its label on the lede's baseline (1px apart at 1440).
  - Phone hero beam (brand-3): it fades in over its last 28px above the window (20px at 360) instead of ending on a clipped edge. The light got a box for the mask (`--ox`/`--oy`). Note that `--ly` must be `0px`, because a unitless 0 makes the `calc()` invalid.
  - The 11 PM card (brand-4, web-2): the steps are 520px wide, centred under the heading (48px above, 54px below at 1440). The phone sits lower, its visible middle 9px from the steps' middle, and the card is 548px tall with no dead band.
  - Notebook crops (brand-5): drawn at 400px for the 800px frame (2x, never upscaled; it was 417px). The phone post is a 2:1 strip of the notebook and pen (no mug, no laptop), and the thumbnail is a tighter 142px square.
  - Voice card (brand-6): its own post ("i journaled 90 days of trades. most losses were after 2pm.") with three takes. The $4,000 line stays in 11 PM, Replies and Results. The copy keeps the old rows at every width.
  - Try hint (uiux-3): "Tap a struck word…" sits 18–19px under the text (it was ~48). The room the box reserves (two rows, or a phone's tallest example) now sits under the hint, above the bar (`--edr`, kept by a ResizeObserver), so the card keeps its height.
  - Hit areas (uiux-4): starter chips, hero example buttons and Sign in already had 44px areas on phones. tapscan now measures each by name (e.g. Wordy 63×36 → 64×44, Sign in 65×37 → 66×44), plus the new "Free forever" link (88×44 on phones, 28px tall on desktop).
  - Result card (web-3): sentences get their own beat only when every one is over 18 characters. "gm. we're really excited to announce v2" flows as one line.
  - FAQ questions are 18px / 500 from 1024 (web-5).
  - Pricing expand (web-6): Studio and Pro list their remaining inclusions from index.html (Studio: each client's voice learns on its own, a review link per client; Pro: what's working in your niche, your week drafted). At 1440 the open lists end within 72px (Studio) and 66px (Pro) of Free's; Studio's gap was over 100. The footers line up. At 761–900, Studio's full-width list runs in 2 × 4.
- **Copy:**
  - Footnote (founder-3): "A rewrite is three takes on a line. Reply drafts you ask for: ten count as one. Reply-ping drafts are free."
  - Pro (founder-4): the add-on check item is gone, and the sub-note reads "Need more? +250 for $8, +750 for $22 or +1,750 for $45." The phone's closed card keeps its one-row "+250 for $8 a month"; the full list has all three.
  - "Free forever" in the hero's trust line links to #pricing (founder-5).
  - After an email, the sheet's end state adds "Your email wasn’t saved." (founder-6). After X or Google it isn't said.
  - Free's note (marketing-4): "Past the daily limit, Sharpen runs on your device. Still free."
  - Hero pill (marketing-5): "Edit this draft ↓" (accessible name "Edit this draft in the Sharpen box").
  - Left to the engine, per the lead (v5.6 / C5.6): "GM fam, super excited to announce", "not even me here", "basically 3 things", "i really do believe that … never ever", "Here are 5 things" (marketing-3: no page-side "The number could go first."), the thread splitter and whys, and the "your call" say. The page renders what the engine returns.
- **Phone budget (uiux-5):** 390×844 is 9.991 screens (8432px). 360×740 is 10.481 (7756px), and 360×800 is 9.695.
  - At 374 and below: the Day phone crop is 176px (was 288), tiles are 12px top and bottom (was 16), the bento gap is 8px, sections are 32px, and a few inner gaps are 2–6px tighter (night card, steps, Who rows, Studio, Trust, pricing and FAQ heads, the final, the footer).
  - At 375–760 the new FAQ row is paid for by sections at 40px (was 48), a 10px bento gap, and a Day crop 10px shorter.
  - Every content-visibility placeholder was re-measured (`fix21/cisw.py`).
- **Tests (in `fix21/`):**
  - These pass at 1440 and 390: check.js home (ok:true, axe 0), gaptest, freezetest, tapscan (every visible control, 44px on phones, 24px at 1440, plus the named ones), touchtest, trytest, p14test, p20test, the new p21test (every item above), and paritytest. paritytest now has 40 lines, including the Sharpen juror's 3-post thread, the B2B thread, "GM fam…", "Here are 5 things…" and a "your call" line. It runs in three slices to stay under 100 s.
  - These were updated to pass 21's rules: trytest (N-post header, the thread sentence leading the why, "left to you"), p14test (the footnote), p20test (Day heading gap 40–56) and paritytest (N posts, one header, the why once, "left to you").
- **hero-sync** ran last, then build.py. The final sources are in `src/`, and build_pub's check passes (scratch copy in `fix21/pub/`).
