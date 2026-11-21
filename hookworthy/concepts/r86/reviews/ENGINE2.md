# Round 86, engine pass 2: from 7.0 on unseen lines to 9.5

A fresh engine juror wrote 159 brand-new lines and graded sharpenLine's output: **7.0/10. 111 h / 31 o / 17 m (70%).**
- **The good news:** no fact was lost on any line, and the homepage matched the engine on all 38 page runs.
- **The pattern:** the 97.7% on heldout.json and your fresh sets did not carry over to lines nobody had tuned on. The engine still overfits.

## Read
- /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/rerate/review-hook.json: 19 issues (1 P0, 8 P1, 10 P2), each with core.js location and fix.
- r86/rerate/work-hook/unseen.json: the 159 lines.
- r86/rerate/work-hook/graded.json: rows with grade and notes, plus the juror's target.

## Fix (core.js; the contract and API names stay the same)
Fix every engine issue at the root:
- **hook-1 (P0):** "to be honest" as a verb complement ("I want to be honest about…") is not a hedge.
- **hook-2/3/4/14/19:** meaning words are untouchable:
  - qualifiers under negation ("not quite", "not really", "not just");
  - a soft word used as the subject or as a quoted/mentioned word ("Honestly is the most underrated word");
  - anything inside quotation marks;
  - sarcasm markers;
  - deliberate voice tails in lowercase CT lines ("lol" when it is the tone);
  - "anyway" as understatement;
  - idioms and titles ("Just Do It", "I think, therefore").
- **hook-5:** no fragments from the contrast/ask/split moves. Add a real fragment check: every sentence needs a subject and a finite verb, or must be an accepted fragment shape ("Activation: 21% to 38%.").
- **hook-6/7:** catch stock frames ("I want you to know that", "here's the thing", "here is the thing", "the thing is", "let me tell you", "I'm going to be honest", "can we talk about"…). "Nothing to cut" may only appear when nothing is soft. The unsure why must be true.
- **hook-9/10:** with a body under the line, keep the sentence-start capital; keep a list header's colon.
- **hook-11:** leave already-sharp lines with warmth alone.
- **hook-12/13:** cut kinds and the receipt must match the strikes exactly. Every struck span is accounted for in `say` by kind ("Cut the warm-up · Cut 3 filler words · Split it into two beats"), and kind 'move' is used only when words were really reordered.
- **hook-15:** facts are whole ("75 Hard", not "75"). Pronouns are not facts.
- **hook-18:** slThin catches lorem ipsum and word salad.

Policy that generalises: **when unsure, do less.**
- A cut must pass every meaning-safety check, or it doesn't happen.
- A move must produce two grammatical sentences, or it doesn't happen.
- A line left alone with a true explanation is "o" at worst; a broken or meaning-changed line is "m".
- But don't retreat into doing nothing: unchanged-when-it-shouldn't-be is also "m".

## Prove it generalises (this is the bar)
1. After fixing the juror's 159, they are no longer held out. Write NEW rounds of 80 lines each, with different authors, niches and shapes, nothing copied: r86/engine/round2-A.json, -B, -C…
2. Grade each round by hand on its FIRST run, before touching code, and record that number. Then fix what it exposed, and start the next round.
3. You're done when two consecutive rounds score ≥ 92% h on first contact, with 0 meaning/fact/grammar misses and true explanations.
4. Keep the juror's 159, heldout.json and your earlier fresh sets at ≥ 95% h as regression sets.
- Add the juror's 159 to the held-out test fixture: parity, facts, meaning, grammar, why/say truth.
- `cd /home/user/xyphre1314/hookworthy/server && npm test` must stay green. Never weaken a test to pass.
- index.html's one-tap paths still call sharpenLine. Bump sw.js CACHE again (v59 → v60).
- After you finish, the hero examples on the homepage must still match the engine. Run:
  ```
  NODE_PATH=/opt/node22/lib/node_modules node /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/fix/hero-sync.js
  ```
  If anything mismatches, just report it; the page builder re-syncs.

## Rules
- Never call any AI API.
- Keep voice and lowercase. No hype, no banned words.
- Don't edit concepts/: a page builder may be working there.
- No git writes. Keep each command under 110 s.
- Write r86/engine/READY2.md (what changed, the round-by-round first-contact numbers) and graded tables per round.

FINAL REPLY (short):
- first-contact h% per round;
- regression set numbers;
- misses by class;
- test status;
- hero-sync status;
- what's still weak.
