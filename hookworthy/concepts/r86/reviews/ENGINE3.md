# Round 86, engine pass 2 (continued): prove Sharpen generalises to 9.5

## Where things stand
- **Last independent rating:** a fresh juror wrote 159 unseen first lines and scored HWCore.sharpenLine **7.0/10**: 111 h / 31 o / 17 m (70%).
  - Review: r86/rerate/review-hook.json.
  - Lines: r86/rerate/work-hook/unseen.json.
  - Grades and notes: r86/rerate/work-hook/graded.json (rows with t, line, grade, note).
- **An engineer started pass 2.** Their brief, which you also follow, is r86/ENGINE2.md (a copy of concepts/r86/reviews/ENGINE2.md). The container reset mid-pass; only what was committed survived, so /home/user/xyphre1314/hookworthy/core.js is their snapshot.
  - It already fixes most of the 17 misses: "to be honest" as a complement, "not quite", quotes, sarcasm, "Honestly is the…", fragments in moves.
  - `npm test` passes (121/121).
  - Their round-by-round generalisation sets were lost, so the generalisation proof is still to do.
- **Two addenda to ENGINE2.md also apply.** Check each against the current code; some may already be done.
  1. Treat URLs (with or without a scheme), @handles, #tags and $tickers as atomic, protected fact tokens. Never mark, cut or split anything inside them. Add held-out test cases.
  2. Copy and truth items:
     - (a) `say` uses one umbrella. Struck spans are "bits of fluff", and the count equals the struck spans exactly ("Cut 3 bits of fluff · Split it into two beats"; "1 bit of fluff"). A whole warm-up phrase counts as one bit. Kind words (hedge, warm-up, filler) live only in each cut's own `why`.
       - If structural words such as "and" in a split or "is/the" in a reorder are cut, either count them or don't put them in `cut`. The receipt and the strikes must agree.
     - (b) Move names and whys must be true and plain. Example: "Number first · Made it active", never "Named who did it".
     - (c) Show the hedge why only when no hedge is left in the line.
     - (d) The first word's case comes from the first line, never from the body. A line that starts with @handle, #tag or $ticker keeps it first, or the move doesn't happen.
     - (e) `kept`:
       - never include tokens from inside URLs or @handles;
       - attach an all-caps unit after a number ("$10k MRR");
       - keep "75 Hard" whole;
       - no pronouns.
     - (f) Each why is ≤ 140 characters, specific to the edit, and quotes kept words where natural. The homepage hero renders `why` and `say` verbatim.

## Known weak spots, seen just now
- "@justin_really is basically the best trader" → "best trader? @justin_really": the case is lowercased, the receipt says 1 bit but 3 words are struck, and the move is odd.
- "We hit $10k MRR today after 14 months" → "$10k MRR today after 14 months.": it drops the actor from a line that was already sharp (hook-11).
- "Honestly I think most people are really just overcomplicating their workouts way too much" → "Most people are just overcomplicating their workouts way too much.": it misses "just" and "way too much" as fluff.

## The bar (the founder wants honest numbers)
1. Keep the juror's 159, concepts/r86/reviews/engine/graded-heldout.json's lines (server/test/fixtures/sharpen-heldout.json) and server/test/sharpen-eval.mjs as regression sets. For the 159, re-grade changed rows by hand, h ≥ 95%.
2. Prove it generalises. Write NEW rounds of 80 lines each: r86/engine/round-A.json, -B, -C…
   - Use different authors, niches and shapes, and copy nothing.
   - Cover these niches: crypto/trading shorthand, lowercase, founders, newsletters, B2B/ghostwriting, fitness, dev, design, personal stories.
   - Cover these shapes: questions, already-sharp lines, multi-sentence lines, emoji/links/@/#/$, list headers, >280 characters, sarcasm, nonsense, and meaning-critical small words.
3. Grade each round by hand on its FIRST run, before changing code, and record that number in r86/engine/rounds.md. Then fix what it exposed at the root (patterns, never single strings), and start the next round.
4. **Done** = two consecutive rounds ≥ 92% h on first contact, with 0 meaning/fact/grammar misses and every why/say/cut true. If you can't reach that after 6 rounds, stop and report honestly.
- Policy: **when unsure, do less.** A cut must pass every meaning-safety check; a move must produce two grammatical sentences. Unchanged-when-it-should-change is still a miss, so don't retreat into doing nothing.

## Must stay true
- The API and contract are unchanged: sharpenLine → {state, draft, line, rest, cut, marks, move, say, why, kept, alts, long, note}.
- index.html's one-tap paths call sharpenLine. Bump sw.js CACHE (check its current value and increment it).
- `cd /home/user/xyphre1314/hookworthy/server && npm test` stays green. Add the juror's 159 and your rounds' fixed lines to the held-out fixture or test, never weakening a test.
- When done, run:
  ```
  cd /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/fix && node hero-sync.js
  ```
  Report the mismatches; the lead re-syncs the page.

## Rules
- Never call any AI API.
- Keep voice and lowercase. No hype, no banned words (unlock, supercharge, leverage, elevate, seamless, game-changer, delve, "AI-powered").
- Don't edit concepts/.
- No git writes. Keep each command under 110 s.
- Write r86/engine/READY3.md (what changed, round-by-round first-contact numbers, regression numbers).

FINAL REPLY (short):
- first-contact h% per round;
- regression numbers;
- misses by class;
- test status;
- hero-sync status;
- what's still weak.
