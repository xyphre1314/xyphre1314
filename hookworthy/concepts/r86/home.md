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
