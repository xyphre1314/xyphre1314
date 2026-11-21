# Round 86: rebuild the Sharpen engine to 9.5 (core.js), and give the site and the app one engine

The founder's ask: "fix the sharpen engine too, and make everything at least a 9.5/10." The engine juror scored it **6.0/10**.
- On 132 fresh first lines, a pro would post Sharpen's output only 66% of the time. On its own 48 tuned lines the rate is 90%.
- It flips meaning ("Maybe I'm wrong" → "I'm wrong"), drops "i think" from price calls, prints broken grammar ("Why do Most B2B content fails?", "ETH will: 5k"), shows "why" text that isn't true for the edit, and the site and the app disagree.

## Read first
- Review: /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/review-hook.json. It lists 27 issues with core.js function and line, a failure class and a precise fix.
- Juror files: r86/work-hook/
  - heldout.json: the 132 lines.
  - graded.json: their hand grades and the "pro would write" target.
  - run.mjs: runs both paths.
  - core-fix.js and make-fix.py: the juror's 36 prototype patches. They are unreviewed; use them as leads, verify each, and don't paste them blindly.
  - page-fix.mjs: the page-wrapper fixes.
- Engine-related issues from the other jurors, in r86/review-{founder,marketing,uiux}.json: founder-1/3/4/10/17, marketing-1/2/4/9/21, plus uiux items about strikes/cut lists/why. Read those entries too.
- Code:
  - /home/user/xyphre1314/hookworthy/core.js (HWCore).
  - index.html's app path: hookUpFor / hookUpPack (~line 8540) and hgSharpen (~line 13055).
  - The homepage wrapper: analyze(), tokens/removed, thin, HEDGES/keepFor in concepts/r85/home.html.
  - server/test/sharpen-eval.mjs and sharpen.test.mjs.

## What to build
1. **Fix the engine in core.js.** Fix every hook-* issue, every class, at the root.
   - Meaning-safe cuts.
   - The price-call stance guard lives in core.
   - No broken templates. Add gram() checks for those shapes.
   - Catch the newsletter, B2B and launch warm-ups.
   - Fix the plumbing that throws away good versions: body() colon, preposition rule, rank bonus, score vs SOFT, the 150-character cap, end marks.
   - Keep "just" when it means "recently".
   - Keep emoji that carry meaning.
   - Make every "why" and "say" true for the edit actually made.
   - Generalise. **The final rating uses a fresh set of 120+ lines that nobody has seen.** Fix patterns, not single lines, and never special-case a held-out string.
2. **One engine API that both the app and the site call.** Add `HWCore.sharpenLine(text, opts)` and export it at top level and on SHARPEN. Exact contract (the page builder is coding against it right now, so keep these names):
   ```
   HWCore.sharpenLine(text, { keep = [], more } = {}) → {
     state: 'empty' | 'thin' | 'sharp' | 'clean' | 'unsure',
     draft: string,
     line: string,
     rest: string,
     cut: [{ text, kind, why }],
     marks: [[start, end, why, kind]],
     move: string,
     say: string,
     why: string,
     kept: [string],
     alts: [{ line, say, why }],
     long: boolean,
     note: string
   }
   ```
   - **state:**
     - empty: no text.
     - thin: too little to work with: gibberish, or fewer than 3 real words. Tickers, numbers, $ and % count as real words, so "$BTC 100k eoy?" is NOT thin.
     - sharp: line differs from draft.
     - clean: nothing flagged, and no safe move improves it.
     - unsure: soft words are flagged, but cutting them would change the meaning or not help. The line is kept, and the flags become suggestions.
   - **draft:** the first line as given.
   - **line:** the sharpened first line. It equals draft unless state is sharp.
   - **rest:** everything after the first line, unchanged.
   - **cut:** words truly deleted, in draft order, with soft kind and short why. Never moved words; never numbers, tickers, names or handles.
   - **marks:** softMarks(draft), so the UI can underline.
   - **move:** the structural move applied, or ''.
   - **say:** a short receipt, true for this edit. Examples: "Cut the warm-up · Led with the result", "Cut 2 hedges", "Nothing to cut".
   - **why:** one sentence, true for this edit, ≤ 140 characters.
   - **kept:** facts carried over verbatim: numbers, $amounts, %, tickers, @handles, #tags, proper names. The UI shows "Kept: …".
   - **alts:** up to 2 alternatives, each a different move, each passing every guard.
   - **long:** whether the first post is over 280 X-weighted characters (use xLength).
   - **note:** for example, when long: "Over 280 for one X post. Hookworthy can split it into a thread." Otherwise ''.
   - `more` defaults to whether anything follows the first line.
   - Deterministic and offline, under 20 ms per call. The existing exports (hookUp, softMarks, softCut, SHARPEN.*) keep working.
3. **Wire the app to it.** Make index.html's one-tap paths (hookUpFor/hookUpPack and hgSharpen) give the same first line as sharpenLine for the same input: same guards, same output. Touch only those blocks and their call sites, and keep the app UI otherwise unchanged. Bump sw.js CACHE (hookworthy-v58 → v59), because core.js changed.
4. **Tests.** Add server/test/sharpen-heldout.test.mjs (plus a fixture). It runs heldout.json through sharpenLine and the app path and asserts:
   - site == app on the first line;
   - no fact lost: every number, $, %, ticker, @, # and name in the draft is in the output;
   - no meaning flip on a guard list ("not", "never", "can't", "maybe … but", "just" = recently, idioms);
   - no broken-template regex matches (doubled punctuation, "::", "Why do <Noun> <verb>s", a capitalised word mid-sentence that wasn't capitalised in the draft, "will: ", sentences ending on a dangling article);
   - the stance hedge is kept on price calls;
   - "why" is never the hedge text unless a hedge was cut.

   Keep sharpen-eval.mjs at ≥ 90% h. `cd server && npm test` must stay all green; fix any test that breaks for a real reason, and never weaken a test to pass.

## Bar (measure it and report honestly)
- On heldout.json, graded by you by hand against the juror's "pro would write" column, on BOTH paths:
  - ≥ 92% h;
  - 0 meaning or fact changes;
  - 0 broken grammar;
  - explanations true on 100%.
- Write a second set of 60 NEW lines yourself (r86/engine/fresh.json; different niches and shapes, nothing copied from heldout or the evals), grade it, and hit ≥ 90% h there too. That's your overfitting check.
- Show your graded tables: r86/engine/graded-heldout.json and graded-fresh.json. Mark h/o/m honestly; a fresh jury will re-grade.

## Rules
- Never call any AI API. The engine is offline.
- Keep lowercase writers lowercase; keep the writer's voice; don't add hype; no banned words (unlock, supercharge, leverage, elevate, seamless, game-changer, delve, "AI-powered").
- Don't edit concepts/ pages: a separate builder owns the homepage and is coding against the contract above.
- No git writes. Keep each command under 110 s.
- Work in r86/engine/. When the core is ready, write r86/engine/READY.md (API, what changed, the numbers).

FINAL REPLY (short):
- h/o/m on heldout and fresh for both paths;
- meaning, fact and grammar misses;
- the classes fixed;
- test status;
- anything still weak.
