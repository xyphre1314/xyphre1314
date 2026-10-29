# Round 86, engine pass 4: safety first (meaning, facts, stance), then truth

A fourth independent juror scored the on-device engine **6.5**: 77.6% h on 147 fresh lines, which is up from 72.8%, but with P0 meaning flips. The juror also reviewed the new Claude path (`prompts.sharpen` + `SHARPEN.fromClaude` + POST /api/v1/sharpen) and found that its validator lets bad edits through.

Read r86/rerate4/review-hook.json in full: hook-1…17 and the `claude_path` note. The lines and grades are in r86/rerate4/work-hook/.

I reproduced these on the current core.js:
- "We don't just write your posts, we learn your voice." → "We don't write your posts. We learn your voice." (meaning flipped)
- "honestly it is basically free for most people" → "it's free for most people." (fact changed)
- "I think we will probably launch in March" → "We'll launch in March." (a forecast became a promise)
- `fromClaude('Revenue doubled this quarter.', {line: 'Revenue tripled this quarter.'})` → accepted (a fact changed)

## Order of work
1. **P0, the engine never changes meaning, facts or stance:**
   - **Negated "just" and its family** (hook-1): "not just / don't just / doesn't just / didn't just / won't just / isn't just / aren't just / never just". The "just" and the "not A, B" contrast stay intact; no split may drop the negation's scope.
   - **Approximators that carry the fact** (hook-2): basically, almost, nearly, practically, pretty much, virtually, roughly, about, around, kind of, sort of. They stay when they modify a value or extent: free, zero, nothing, everyone, all, every, half, doubled, done, a number, and so on.
   - **Hedges on plans and forecasts** (hook-3): I think, probably, might, maybe, may, likely, going to, plan to, hope to. They stay whenever the clause is about the future or a prediction, not only on price calls. Generalise stanceKeep. Never turn "going to/might/probably" into a certainty.
   - Add every case above as tests, including put-back variants (hook-7).
2. **P0, the Claude validator (`fromClaude`) is a real safety net** (hook-13…16 and the claude_path note):
   - Treat number words, multipliers and comparatives as facts: one…ninety, hundred, thousand, million, billion, half, double/doubled, triple/tripled, twice, x2/2x, first/second…, most/least/best/worst/only.
   - **No added content words.** Every content word in Claude's line (lowercased, simple stemming, stopwords and a small connective allowlist excluded) must exist in the draft. Example allowlist: why, how, what, here's, changed, result, but, so, then, now, it, this, that, is, was, are, the, a, an, and.
   - Tense and modality must match: might/may/probably/will/going to/did.
   - The writer's stance is enforced (I think / imo kept on calls and forecasts).
   - ZWJ emoji stay intact.
   - Banned words are checked relative to the draft: a word already in the draft is allowed (token unlock, elevated funding).
   - Why: a quoted word the why claims was cut must be absent from the line.
   - `unchanged: true` on a line with soft marks → return rules with reason 'claude_unchanged'; never "Nothing to cut".
   - Add fake-client tests for each case.
3. **P1, never broken** (hook-4…7):
   - a cut between clauses keeps the comma;
   - ZWJ emoji are never split (hook-5);
   - the "What changed:" move never strands "just" or duplicates a teaser (hook-6);
   - no fragments from long-line splits (hook-7).
4. **P1/P2, explanations and coverage** (hook-8…12): missed run-ups and clichés; true beat counts with decimals and $2.5M; true receipts; joke and feeling words kept (hook-10); Kept row units such as "83(b)" and "0.4 gwei"; true put-back notes; the thin state for "the the the" and lorem. hook-11 and hook-12 are partly page-side: note them for the page builder in READY5.md, and fix the engine half.

## Bar
- **0 meaning, fact or stance changes** on: the juror's 147 lines, every earlier juror set, rounds A–J, and the held-out fixture. Re-grade the changed rows by hand.
- Then two NEW first-contact rounds of 80 lines each (half need work, mirroring the juror's mix), graded under the calibrated standard. Report h% overall, h% on needs-work lines, and misses by class.
- If safety and h% trade off, choose safety and say so.
- `npm test` green. Bump sw.js CACHE. Run hero-sync.js at the end.

## Rules
- Never call any AI API. Fake client only.
- Don't edit concepts/. No git writes. Keep each command under 110 s.
- Write r86/engine/READY5.md.

FINAL REPLY (short):
- P0 status with examples;
- the validator changes;
- round numbers;
- regression;
- tests;
- hero-sync status;
- what's still weak.
