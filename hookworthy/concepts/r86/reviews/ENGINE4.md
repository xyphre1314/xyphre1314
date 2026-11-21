# Round 86, engine pass 3: close the gap between your grading and the jury's

A third independent juror wrote 158 fresh lines and scored sharpenLine **7.6/10**: 72.8% h overall, 34 o, 9 m.
- **The good:** 0 facts lost, 0 negations flipped, 76 of 79 should-stay lines left alone, and the page matched the engine on all 24 lines.
- **The problem:** on the 79 lines that NEED work, only **51%** came out postable.

Your own rounds E and F measured 92.6% first-contact. The jury measures far lower, so your grading or your line sets are easier than theirs. That gap is the main thing to fix.

## Read
- r86/rerate3/review-hook.json: 16 issues with core.js locations.
- r86/rerate3/work-hook/unseen.json and graded.json: the lines, the outputs, and the juror's grades and notes.
- Engine items from the other jurors: r86/rerate3/review-uiux.json uiux-1, and review-marketing.json marketing-1/2/3.

## Do, in this order
1. **Calibrate first.** Grade the juror's 158 outputs yourself, blind, without looking at their grades. Compare with theirs and write the disagreement table to r86/engine/calib.md. Adopt their standard: "h" means a good creator would post it exactly as is, with no "it's fine but…". Use that standard for everything below.
2. **Fix every hook-1…16 class at the root.** The biggest are:
   - false "would break" bail-outs (hook-1);
   - missed run-ups and frames like "one of the most important lessons I've learned is that", "a quick thread on why", "As a designer," (hook-2);
   - label cuts that leave a broken opener (hook-3);
   - "just" = simply, and "basically/pretty much" before every/everyone (hook-4);
   - "yet another" sarcasm over-guard (hook-5);
   - why quotes that stop mid-phrase (hook-10, marketing-1). Quote only at phrase boundaries, or don't quote.
   - The stance rule must be consistent (hook-15). "not financial advice" is a disclaimer, not fluff (hook-16). Over-280 lines should lead with the news (hook-14).
3. **Strikes = every removed word** (uiux-1, hook-6). Every word that is in the draft but not in the line must be in `cut`, so the page strikes it. That includes reshape glue such as "We just hit", "Here are" and a dangling "I". Give each one an honest kind: fluff kinds, plus 'reshape' for structural words.
   - `say` counts only fluff kinds as "bits of fluff" and names the move ("Cut 2 bits of fluff · Led with the number").
   - The page counter uses the fluff count; reshape words are struck without the squiggle.
   - Put-back works on every struck span, reshape words included. Putting back a reshape word restores the draft's structure, or the engine re-sharpens with it kept.
4. **No reorder that isn't a whole, natural sentence** (marketing-3). Example: "this might be controversial but i actually think dca is overrated…". If a move's output isn't something you'd post, don't make it.
5. **First call is warm** (web-1). Make sure `HWCore.SHARPEN.warm()` exists and pre-compiles everything, so the page can call it on idle. Report the cold and warm timings.

## Prove it with independent-style rounds
- Write 2+ NEW rounds of 80 lines each: r86/engine/round-G.json, -H…
  - Half the lines must NEED work (run-ups, labels, hedges, buried numbers), mirroring the juror's mix.
  - Grade at first contact under the calibrated standard.
- Report two numbers per round: h% overall, and h% on the lines that need work.
- **Bar:** two consecutive rounds with ≥ 92% h overall AND ≥ 85% h on needs-work lines, 0 meaning/fact/grammar misses, and every why/say/cut true.
- Stop after 4 rounds if the bar isn't met, and report honestly.
- Regression sets stay ≥ 95%: the juror's 158 (re-grade the changed rows), all earlier rounds, and the held-out fixture. `npm test` stays green; never weaken a test. Bump sw.js CACHE.
- At the end, run `node /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/fix/hero-sync.js` and report.

## Rules
- Never call any AI API.
- Keep voice and lowercase; no hype; no banned words.
- Don't edit concepts/. No git writes. Keep each command under 110 s.
- Write r86/engine/READY4.md.

FINAL REPLY (short):
- the calibration gap;
- per-round numbers (overall and needs-work);
- regression numbers;
- misses by class;
- tests;
- timings;
- hero-sync status;
- what's still weak.
