# Round 86: take the homepage to 9.5 with every juror

Six jurors critiqued /home/user/xyphre1314/hookworthy/concepts/r85/home.html against a strict 9.5 bar: brand 8.5, web 8.0, UI/UX 7.8, marketing 7.8, founder 7.5. Sharpen, the engine, scored 6.0.

A separate engineer is rebuilding the engine in core.js right now. You own the page. A fresh jury will re-rate the result, and the target is **≥ 9.5 from every juror**.

## Inputs
- Reviews, each issue with an exact fix: /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/review-{brand,uiux,web,founder,marketing}.json. Also read review-hook.json for the page-wrapper items hook-16…20.
- Tested work, which you should prefer over re-inventing: r86/work-{brand,uiux,web,founder,marketing}/.
  - Examples: work-web/fix.css and snippets.js; work-uiux/fixes.css and fixes.js; work-brand (og/, you-dark.jpg, icon-r86.svg, misc.css); work-marketing/analyze-patch.js; work-founder/diff-fix.js.
- The jury brief, with hard rules and context: r86/JURY.md.

## Your job
Apply EVERY P1 and P2 from the five page reviews, unless a decision below says otherwise. Verify each fix in the browser. Where reviewers propose the same fix (the phone nav Sign in slide, the final input jump, the hero fall), apply it once.

## Decisions (these override any reviewer)
1. **One engine.** The page no longer diffs words or guards lines itself.
   - Try and the final input call `HWCore.sharpenLine(text, { keep })`. The contract is in r86/ENGINE.md under "What to build" §2; read it.
   - Render from it: strikes = `cut` (only these words are struck, at their draft positions), the "Kept: …" row = `kept` (marketing-2's format), label + why = `why`, receipt = `say`, long note = `note`, alternatives = `alts`.
   - States:
     - **empty:** a prompt, no result.
     - **thin:** "Give it a real line, a few words, and Sharpen has something to work with."
     - **sharp:** the result card, with "Keep it. Start free".
     - **clean:** label "Nothing to cut." and note "Sharpen only cuts what's soft. Want it to lead harder?" plus an inline text button "Get a rewrite in your voice, free" that opens the sheet carrying the line. Never say "Already sharp".
     - **unsure:** "“{first flagged word}” is marked, but cutting it would change what you mean. Your call." Show the marks as suggestions, not strikes.
   - Delete the page's tokens/removed/thin/HEDGES/keepFor/realWord and the hookUp fallback.
   - If r86/engine/READY.md doesn't exist yet when you wire this, write a clearly fenced temporary shim: `/* SHIM: remove when core.js has sharpenLine */ if (!HWCore.sharpenLine) HWCore.sharpenLine = …`, built on hookUp + softMarks. Use uiux-1's count-aware cutSpans for `cut` and marketing-2's keptLine for `kept`. Check `ls r86/engine/READY.md` again before you finish, and drop the shim if the real one exists.
2. **"Put it back"** (founder-10). After Sharpen, each struck word in the mirror is a button: aria-pressed="true", aria-label "Put back “honestly”". A tap re-runs sharpenLine with that word added to `keep`. Add one quiet line: "Tap a struck word to put it back." Do the same in the final.
3. **The hero examples must match the live engine** (founder-2). Each hero example's sharpened line and cut words must equal `HWCore.sharpenLine(draft)` for that draft.
   - Write r86/fix/hero-sync.js. It loads core.js in Node, runs every EX draft, and prints mismatches.
   - Make EX match. If the engine isn't final yet, leave the script; the lead re-syncs after the engine lands.
   - Keep 4 examples covering trader, founder, newsletter and designer (marketing-18 renames "…" to "Designer"), and choose drafts that sharpen well.
4. **Try default** = marketing-3's $SOL line. Starters follow marketing-7, but the clean-line starter is labelled "Clean line", never "Already sharp".
5. **Truth.**
   - Hero meta (founder-5): "Posts to X · LinkedIn · Ready for Threads · Bluesky" (with the icons). The app posts to X and LinkedIn; Threads and Bluesky are copy-ready, and you paste them yourself.
   - Hero sub = marketing-17: "Cut the fluff from your first line in one tap. Schedule it for X, Threads, LinkedIn and Bluesky. It still sounds like you." Two lines at 1440/1280/1024. If it's 3 lines at 390, that's fine as long as the phone budget holds.
   - Replace `.since` with founder-16's alternative: "<b>On X, the first line decides if anyone reads the second.</b> It's the part you control." No unsourced claim about X payouts.
   - Free (founder-6): "Schedule all you like. 15 a month go out at your time; the rest wait for one tap."
   - Pro li 1: "Up to 500 posts a month go out at your time".
   - Pricing lede: "Sharpen every line you write, free. A rewrite gives you three takes in your voice: 20 a month on Free, 250 on Pro."
   - Under the plans: "Cancel anytime. Your drafts and ideas stay with you on Free." Use exactly that; no "two clicks".
   - Trust: keep "Auto-DMs / Auto-deletes / Auto-follows and likes: never". Don't add founder-15's X good-standing claim.
   - The rules line and FAQ #qa2 use marketing-8 ("…stay off until you switch them on"). The lead is switching the app's defaults off to match.
6. **FAQ.** Six items: add founder-9 "Can I bring my old posts?" as item 2.
   - #qa3 = founder-11's answer.
   - Phone budget: ≤ 10.0 screens at 390 and ≤ 10.5 at 360. Trim elsewhere to pay for it: shorter phone copy, and close FAQ items stay one line.
7. **Footer.** "Privacy and terms" → ../../index.html#legal (web-19). Remove the placeholder links.
8. **Brand items.**
   - The giant wordmark = brand-1, with a min() cap so it never exceeds the content width.
   - The final's beam = brand-2.
   - Re-render the OG = brand-3, saved to /home/user/xyphre1314/hookworthy/assets/og-afterglow.png. Keep the og:image URLs relative; deploy sets absolute ones. Add a one-line HTML comment saying so.
   - you-dark.jpg = brand-5: copy it to assets/people/you-dark.jpg and use it.
   - Icon from the h = brand-6/11.
   - Tokens and radius scale = brand-14/15.
9. **Motion.** No replays on hover, focus or click, and nothing acts for the visitor (unchanged rules). The hero lands sooner, the falling fluff stays inside the line gap, and the Try example result is never a hole (web-4/13, uiux-3, founder-18).
10. **Phone.**
    - After Sharpen, Keep is in view (uiux-5).
    - Pricing shows its billing terms (founder-8).
    - Focus padding sits clear of the bar (uiux-24).

## Rules (unchanged)
- Afterglow brand exactly.
- Headings two lines max at 1440 and 390.
- No eyebrows, gradient text, emoji icons, section numbers or icon-card grids.
- No invented stats, testimonials, logos, reach promises or trials.
- Banned words.
- WCAG AA; visible focus; reduced motion = finished static layout; no auto-cycling.
- CLS < 0.05; no horizontal scroll at 360–390.

## Files
- Edit /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/fix/work/src.html (plus sprite.txt and tail.txt), then run `python3 build.py` there. That writes /home/user/xyphre1314/hookworthy/concepts/r86/home.html; the page loads ../../core.js.
- Write concepts/r86/home.md: a changelog by area, plus the review ids you skipped and why.
- Don't edit core.js or index.html; the engine engineer owns them. No git writes.

## Verify (required; each command under 110 s)
- `sh …/scratchpad/up.sh`, then `cd …/scratchpad/r86/fix && NODE_PATH=/opt/node22/lib/node_modules node check.js home` → "ok": true.
- axe 0 at 1440 and 390 (…/scratchpad/crit/a11y/package/axe.min.js).
- CLS < 0.05 at every width.
- Phone screens: ≤ 10.0 at 390 and ≤ 10.5 at 360.
- The sharpened post is above the fold at 1440×900 and 1280×800.
- The sheet opens from every CTA, traps focus, and its done state works.
- Try and final, run each of these and check the strikes match the actual cuts, the Kept row is right and Put it back works:
  - the $SOL default;
  - empty;
  - "asdf";
  - "$BTC 100k eoy?";
  - a 320-character line;
  - "so i think honestly basically it is kind of good";
  - "i think eth is going to 5k";
  - "This is kind of a big deal for us.";
  - "The Fed meets tomorrow.".
- No tile replays or acts on hover or focus.
- Read your own screenshots at 1440, 1280, 1024, 768, 390 and 360, every screen. Judge each one against 9.5, not "fixed".

FINAL REPLY (short):
- what changed by area;
- skipped ids and why;
- the numbers;
- whether the shim is still in;
- what you think would still keep any juror under 9.5.
