# Round 86, page pass 3: from ~9.0 to ≥ 9.5 with every juror

The homepage is /home/user/xyphre1314/hookworthy/concepts/r86/home.html. It's an Afterglow-brand marketing page for Hookworthy, a writing and scheduling app for X creators.
- It is built from /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/fix/work/src.html (+ sprite.txt, tail.txt) by `python3 build.py` in that folder.
- The same sources are committed in concepts/r86/src/.
- The page's live Sharpen comes from ../../core.js (HWCore.sharpenLine). A separate engineer owns core.js and is changing it right now. Render engine text verbatim; never patch engine output on the page.

A fresh independent jury rated the current page: brand 9.2, web 9.1, UI/UX 9.0, founder 8.9, marketing 8.8. The target is **≥ 9.5 from every juror**. Earlier passes' changelogs are in concepts/r86/home.md; read them for context on decisions already made.

## Read
- Five reviews with exact fixes: /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/rerate2/review-{brand,uiux,web,founder,marketing}.json.
- The jurors' scripts and screenshots: r86/rerate2/work-<key>/.
- Hard rules and brand context: concepts/r86/reviews/JURY.md, section "Context to respect". Keep everything there.

## Apply every P1 and P2, except where a decision below says otherwise
1. **Engine items go to the engine engineer, not the page:**
   - founder-1/2;
   - marketing-1, the engine half of marketing-3/4/5;
   - web-15, uiux-18.

   The page only renders state, line, cut, say, why, kept, alts and note.
2. **Kept row (marketing-2).** Render it as "Kept: $SOL, 40%." Plain items joined naturally, with no "your" before each item. Add "Kept your lowercase." only when the draft is all lowercase. The hero's Kept row uses the same format. Update hero-sync.js's keptLine check to match.
3. **Hero sub (founder-3):** "Cut the fluff from your first line in one tap, then schedule it for X. It still sounds like you."
   - Platform row (marketing-7, web-4): "Posts to X · LinkedIn · Ready to paste on Threads · Bluesky". On phones it must not orphan a single word; restructure the line if needed.
4. **Trust (founder-5):** "Never" list sub: "Every post is one you wrote or approved, sent at the time you picked. No auto-DMs or auto-follows, on purpose: automation like that can get an account restricted."
   - Rules line (marketing-8): "Plug replies (one reply you write ahead) and reruns stay off until you switch them on."
5. **Studio truth (founder-6, founder-11).**
   - Wording: the client's posts go out from the client's own connected X account. Hookworthy doesn't provide accounts.
   - Check index.html for Studio's post allowance (per client or shared), then say it plainly on the Studio card.
   - Put the 8-client cap on the card (marketing-13).
   - "More than 8 clients? Talk to us": a real mailto link to hello@hookworthy.com, with the address still visible (founder-7).
6. **The Try box button (founder-8, marketing-6, uiux-4)** becomes "Write my own": it clears and focuses. At ≤375 it hides while Undo shows, so Sharpen never clips (uiux-2).
7. **The hero draft is clickable (founder-9).** Clicking or tapping the draft text scrolls to the Try box with that draft filled in, then focuses it.
8. **The sheet is plan-aware and says it's a preview up front** (founder-10, marketing-12, uiux-6/7).
   - Show a quiet line "Design preview: no account is created yet." before any input.
   - The done state names the chosen plan and price.
   - Sign-in mode can switch back to Start free.
   - A Studio sheet opened from Pricing doesn't show a trader's line.
9. **Hero examples (founder-12):** replace "Designer" with "Ghostwriter".
   - The new draft is a client line a ghostwriter would draft. It must sharpen cleanly in the engine (state sharp, and you'd grade it h).
   - Run hero-sync.js --write and rebuild.
10. **OG (founder-13):** add `<meta property="og:url" content="https://hookworthy.com/">` and absolute og:image/twitter:image `https://hookworthy.com/assets/og-afterglow.png`, with an HTML comment that these assume the site is served at the root of hookworthy.com.
11. **Who heading (marketing-9):** "Trades, launches, newsletters." The FAQ heading (marketing-10) must be specific to posting on X, e.g. "Before you hand it your first line."
12. **Voice notes (marketing-14).** The app has "Say it", talk instead of typing (browser dictation). Name it truthfully in the FAQ or the plan lists ("Say it instead of typing"). Never claim it transcribes audio files.
13. **Skip founder-4,** the app's trial copy. The lead is asking the founder.
14. **Motion and tiles:**
    - Fix the Day push tear: every post below moves together (uiux-1).
    - The final card changes in place while typing, with no re-land or blur (uiux-3).
    - The hero's right half is never empty: show the sharpened post dimmed on first paint (web-3).
    - Fill the dead space in Studio, Trust and Who (web-2, brand-4/5).
    - Fix the hero window spacing (web-1, brand-2).
    - Recrop the trader post photo to the notebook/journal (brand-1).
15. **Phone budget:** ≤ 10.0 screens at 390 and ≤ 10.5 at 360. Pay for anything you add.

## Files
- Edit the sources above and run `python3 build.py`.
- Update concepts/r86/home.md with a "Pass 3" section.
- Don't edit core.js or index.html. No git writes.

## Verify (required; each command under 110 s)
Run `sh /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/up.sh` first. It serves the repo at :8765; don't use :8766, which is a frozen snapshot. Then, with NODE_PATH=/opt/node22/lib/node_modules:
- `node /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/fix/check.js home` → "ok": true. It covers errors, failed requests, overflow, headings ≤ 2 lines and banned words, plus axe at 1440 and 390.
- Write your own Playwright checks for the rest:
  - CLS < 0.05 at 1440, 1280, 1024, 960, 768, 390 and 360;
  - phone screens = scrollHeight / viewport height, within the budget;
  - the hero sharpened post above the fold at 1440×900 and 1280×800;
  - the sheet from every CTA, focus trap and done states;
  - Try and final with: the default, empty, "asdf", "$BTC 100k eoy?", a 320-character line, "so i think honestly basically it is kind of good", "Just shipped v2! Really excited to share it with you all", "This is kind of a big deal for us." and "The Fed meets tomorrow."; put-back and cut-again;
  - no hover/focus replays;
  - every heading ≤ 2 lines at 1440, 1280, 1024, 960, 901, 768, 390 and 360;
  - no overflow at 761–780.
- Read your screenshots of every screen at 1440, 1024, 768, 390 and 360. Judge each against 9.5.
- Run `node /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/fix/hero-sync.js` LAST. If core.js changed, use --write, then rebuild.

FINAL REPLY (short):
- changes by juror;
- skipped items;
- numbers;
- hero-sync status;
- anything you think still keeps a juror under 9.5.
