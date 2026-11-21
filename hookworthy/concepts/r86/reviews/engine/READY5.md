# ENGINE5: the engine safety pass (juror 4, hook-1…17)

Files changed: `core.js` (engine and validator), `server/server.mjs` (the `/api/v1/sharpen` cap and the `claude_unchanged`
reason), `server/lib/credits.mjs` (one date fix, see Tests), `server/test/*` (two new test files, new cases, four expectations
updated), the held-out fixture (+303 rows), and `sw.js` (CACHE `hookworthy-v65`; someone else had already moved it to v64).
I did not touch `concepts/` and made no git writes. Another session committed WIP snapshots of the tree while I worked.
Claude was never called: the fake client and saved replies only.

## P0: meaning, facts and stance in the engine

| juror line | before | now |
|---|---|---|
| We don't just write your posts, we learn your voice. | We don't write your posts. We learn your voice. | unchanged · "Kept “don't just”…" |
| I don't just want more followers, I want the right followers. | I don't want more followers. … | unchanged |
| Bitcoin isn't just digital gold, it's … / I don't just trade, I teach … | "isn't digital gold" / "I don't trade." | unchanged |
| honestly it is basically free for most people | it's free for most people. | it's basically free for most people. · note "Kept “basically free”: it says nearly, not exactly." |
| It's basically free if you use the student plan. / She basically doubled our revenue | "free" / "doubled" | unchanged · "Kept “basically free”: it says nearly, not exactly." |
| I didn't really train for this marathon and I still finished in 3:41. | I didn't train … | unchanged (and the "I still finished" clause can no longer move ahead) |
| it's basically the cheapest since 2016 | it's the cheapest … | unchanged |
| I think we will probably launch in March | We'll launch in March. | We'll probably launch in March. |
| I think I'm going to quit X for a month. | I'll quit X for a month. | unchanged · "Kept “I think”: on a plan or a forecast…" |
| We're probably going to shut down the free plan next month. | We'll shut down … | unchanged |
| I think we're basically going to hit $50k MRR this month | We'll hit $50k MRR this month. | I think we're going to hit $50k MRR this month. |
| We're probably launching on Product Hunt next week | We're launching … | unchanged |

How it works:
- **hook-1.** A new mean guard keeps just/only/simply/merely/really after not / n't / never / cannot, and an SL_MEAN rule fails any version that drops it. The guard covers only the restrictor, so a split that keeps it ("I don't just trade. I teach…") still works. A why that quotes it quotes the negation with it.
- **hook-2.** These approximators are guarded: basically, pretty much, practically, virtually, essentially, kind of, sort of, more or less, just about. The guard applies in front of:
  - an absolute: free, zero, nothing, everyone, all, every…, never, always, done, flawless, dead, useless…;
  - a multiplier: doubled, tripled, halved, Nx;
  - a superlative: the cheapest, best, most…;
  - a number.

  `slApxOK` (part of `slMeanOK`) also requires each approximator+value pair to survive, almost and nearly included. Clean lines get the why "Kept “basically free”: it says nearly, not exactly.", and sharp lines get it as a note.
- **hook-3.** `stanceKeep` now also reads any clause about the future, clause by clause, not line by line. The cues are will/'ll/won't, going to (+verb), gonna, plan/hope/expect/aim/about to, might/may/could/likely, launching, shutting down, next week/month/…, this week/month/quarter/season, tomorrow, "coming soon", and by/in Q1/eoy/2027. The stance words then stay, with the note "on a plan or a forecast". Price calls are unchanged.
  - When a hedge goes (opinion/hedge kinds, cutHedges, or basically/kind of/probably), the WORDY "going to" → "'ll"/"will" swaps are blocked.
  - "then this might be for you" now keeps "might" (the old rule turned it into "this is for you").
  - **hook-10.** A contraction-only version is no longer a sharpen (`same()` reads "is going to" = "'ll" = "will").
- **Tests:** `server/test/sharpen-juror4.test.mjs` has 8 tests. Every P0 line is also checked after **each cut is put back** (`holds()`).

## P0: fromClaude as a safety net (hook-13…17)

New checks, in order:
1. **Stance:** every `stanceKeep(body)` word must stay (calls and forecasts).
2. **Number words, multipliers and comparatives are facts** (`SL_FACTW`: one…ninety, hundred…billion, half, double(d), triple(d), twice, first…tenth, Nx/xN):
   - none may be added (`number added`) and none lost outside soft marks (`number lost`);
   - most/least/best/worst/only/every/all/always/never/nothing/everyone/zero may not be added (`claim added`).
3. **No added content words** (`slAdded`): every word must be the writer's (light stemming), a closed function-word list (articles, be/have/do, modals, pronouns, prepositions, conjunctions, what/why/how, plus changed/result/move/let), or a word the engine's own WORDY/CONTRACT_W/PLAIN_W/HK_SWAP replacements write. That list is built from the tables themselves.
4. **Tense and modality** (`slTenseOK`):
   - future, hedge (might/may/could/probably/maybe/likely), would, should/must, did and was/had can't be added;
   - a hedge or a future outside the soft marks can't be dropped;
   - a draft word in a new form may be past only if the draft was past ("might start" → "started" is rejected).
5. **Banned words are counted against the draft.** "the $ARB token unlock" and "Funding is elevated" now pass, and an added "elevate" is rejected.
6. **Whole emoji:** `slEmojiOK` is inside the shared `slBroken`, so both engines get it.
7. **The why is verified** (`slAIWhy`):
   - a quote in a went/cut/gone/dropped/without clause must be gone from the line and in `E.cut`;
   - a quote in a stays/kept clause must be in the line;
   - a quote claimed as first/leads/opens must be in the first six words.

   Otherwise the engine's own `E.why` is used.
8. **`unchanged: true` on a line with soft marks** → null with trace `unchanged`. The server answers with the rules result and `reason: 'claude_unchanged'`.

Prompt and endpoint changes:
- **Prompt:** four new rules (negated restrictors, approximators, plans/forecasts with no tense change, the writer's words only) and three few-shots ("We don't just write your posts…" unchanged, "basically free" kept, "I think we're going to hit $50k MRR" keeping "I think"). All 13 few-shots pass the validator.
- **Line cap and tag:** the line sent to Claude is capped at 1,000 chars (`SHARPEN.AI_MAX`); the server answers a longer line from the rules with `reason: 'long'`. `<line>`/`</line>` are stripped from the writer's text.

Results:
- **Offline eval:** `server/test/sharpen-ai-validator.test.mjs` is a 45-row table of hand-written stand-in replies with the expected verdict or reject reason. It also runs the why checks and a prompt self-check. It runs in `npm test` and needs no API.
- **Juror's probe** (`rerate4/work-hook/claude-validator-probe.js`): every "bad" row is now rejected, except two:
  - "why claims a cut": the line is accepted, but the why is replaced by the engine's;
  - "drops the vulnerable frame": the engine cuts that frame too, and the strike now says "A run-up to the story".

  Both "good" trader rows are accepted. The ask-then-answer row is still rejected because "is just going" is guarded; the juror called that defensible.
- **Saved Claude replies:** the 297 replies the other session saved (`concepts/r86/reviews/claude-sharpen/merged.json`, read only) go through the final validator as 247 accepted and 50 to the rules path: thin 21 (never sent), meaning 10, unchanged 10, broken 4, stance 3, tense 2.

## P1: never broken (hook-4…7)
- **hook-4:**
  - `softCut` keeps the comma when a cut sits between two finite clauses ("…getting started, the chart looks…").
  - A new `slRunOn` rejects two clauses run together where the draft had punctuation, within 40 characters of a cut.
- **hook-5:**
  - `tailE` matches whole sequences (`EMO_SEQ`: ZWJ, VS16, skin tones, flags, keycaps), so 🚶‍♂️, ❤️‍🔥, 👨‍💻, 🏳️‍🌈, 🏃‍♀️ and 🙌🏽 stay whole.
  - `slEmojiOK` (Intl.Segmenter) rejects any version with a cluster the draft doesn't have, or a ZWJ next to whitespace.
  - The ask move keeps the tail emoji at the end ("Most underrated habit? Walking 🙌🏽").
- **hook-6:**
  - A version can't repeat a two-word phrase more often than the draft does.
  - The result and active moves don't run when the draft already teases ("here's what/how/why", 👇, 🧵, thread).
  - A version with more letters than the draft must be a pure reorder once the label is set aside ("What changed:", "The move:", "Then").
- **hook-7:** `slFragsN` rejects:
  - a noun phrase + ", because" with no main verb (wh-clauses stripped);
  - a split at "and" that takes the last item of an Oxford series;
  - a split that leaves a verbless first half before "the X are/were";
  - a first sentence that opens on a kept soft adverb and has no verb;
  - a "this:" opener;
  - the dangling "As a ghostwriter…, the hook is…".

  A new `SL_BACK` check stops a clause that leans back ("still finished", "anyway", "instead", "too.") from moving ahead of the clause it leans on. "Really quick thread on" is now one label, so putting back "Really" gives the whole label.
- **Put-back scans:**
  - 1,527 put-backs over the 1,546-row fixture: 0 fail.
  - Juror-4 style scan over j147+K+L: 303 put-backs, 0 broken.
  - #17, #24 and #50 now come back whole.

## P1/P2: explanations and coverage (hook-8…12)
- **hook-8, new frames:**
  - "Just a (friendly|quick|gentle|little…) reminder(: | that)";
  - "In today's (fast-paced )?(digital )?…" with up to two adjectives;
  - "What if I told you (that)", where the "?" becomes a full stop;
  - "TIL that" → "TIL" and "(currently) in the process of X-ing" → "X-ing";
  - "this might be a controversial take but", "I'm (kind of) nervous to share this but", "and the one thing I've learned is that", and "After N years of X, I can confidently say that Y" → "N years of X. Y".
- **hook-8, banned words:**
  - leverage before a name becomes "use", and unlock/supercharge … growth becomes "grow".
  - A sharp line never keeps a banned verb (`SL_BANV`; the trader's "token unlock" and "elevated funding/volatility/rates…" are exempt).
  - "elevated" in a trading context is no longer swapped to "improved". That was a meaning flip: "Funding is improved".
- **hook-9, receipts:**
  - `slBeats` uses `slSents`, so 4.2x, 24.1 and $2.5M aren't beats.
  - The safe-cut why now reads "Nothing I can cut safely here. The rest is your call."
  - Filler-only lines ("ok so", "Really really really") are `thin` with "That’s all filler. Add the point."
  - A vulnerable opener's strike says "A run-up to the story. Start on the story itself.", and "any kind of" says "Same thing in fewer words."
  - "You kept X, so the line opens on it" appears only when X starts in the first two words.
- **hook-10, voice:**
  - A sentence that opens on an irony marker keeps every intensifier: Oh great/good/cool, Wow + what/another/so…, Sure because…, Love how/that/when, Gotta love, Nothing says.
  - A first-person feeling keeps its hedge ("I'm kind of okay", "still kind of processing", "1 very tired founder").
  - "Probably both." answering the writer's own question, a hedge said as its own sentence ("Probably. Maybe."), and ", just with better coffee" are kept.
  - A short closing "not" stays uncontracted ("Your users are not you.").
- **hook-11 (engine half):**
  - `slFacts` keeps 83(b) and 401(k).
  - `SL_UNIT` adds gwei, wei, sat(s), bps and basis points (lbs and kg were already there), so the Kept row says "0.4 gwei".
- **hook-12 (engine half):** a thin result now carries `thin: 'few' | 'sentence' | 'filler'` and a matching `why`:
  - 'few': "Sharpen needs a few more words. Paste the whole first line.";
  - 'sentence' ("the the the", lorem): "This doesn’t read as a sentence yet.";
  - 'filler': "That’s all filler. Add the point."

### For the page builder (home.html is in concepts/, so not touched)
- **hook-12:** in render()/payUpdate's thin branch, show `R.why` (or switch on `R.thin`) instead of the fixed "Sharpen needs a few more words…". Thin lines should not offer a rewrite ("Really really really").
- **hook-11:**
  - Add gwei, bps, sats, lbs and kg to `KEPT_UNIT` if keptLine rebuilds units itself (`R.kept` now already has "0.4 gwei" and "83(b)").
  - `backNote` should compare cuts by draft offsets (`c.at`): a span that overlaps a new cut is still cut. This is the "“can tell you that” comes back too" bug.
- **Notes now have more cases:** `R.note` can carry "Kept “basically free”: it says nearly, not exactly." and "Kept your “I think”: on a plan or a forecast, it’s your stance, not filler." Show them like the stance note.
- **New server reasons:** `/api/v1/sharpen` can now return `reason: 'long' | 'claude_unchanged'`. The app already ignores non-sharp answers.

## Rounds K and L (new, first contact, 80 lines each, 40 need work)
Graded under the calibrated standard (h = a good creator posts it exactly as is), before any fix from that round.

| round | overall h | needs-work h | should-stay h | m | o | false explanations |
|---|---|---|---|---|---|---|
| K | 73/80 = **91.3%** | 35/40 = **87.5%** | 38/40 | 3 | 4 | 1 |
| L | 71/80 = **88.8%** | 34/40 = **85.0%** | 37/40 | 5 | 4 | 4 |
| (ENGINE4 G–J, for scale) | 77.8–82.5% | 55–75% | | 2–3 | 12–16 | 0–3 |

Misses by class (K+L, 160 lines):
- **Meaning/fact/stance (5 m):**
  - K#26 "pretty much flawless" → "flawless" (approximator before an absolute not yet listed);
  - K#75 ", just with better coffee" lost "just";
  - L#50 "i just write…" after "don't really" lost "just";
  - L#75 "the win is just showing up" lost "just";
  - L#59 "Probably. Maybe. Eventually." lost its hedges.
- **Broken (3 m):**
  - K#16 "I'm so my first course is live." (an intensifier outside the announce frame);
  - L#5 a lone line ended on ":" (a relative clause plus an adverb hid the main verb from slFrag1);
  - L#13 "2023: I wanted to take a moment to thank…" (the year move on a thank-you).
- **Frames left (5 o):** "I can confidently say that", "This might be a controversial take but", "and the one thing I've learned is that", "I'm kind of nervous to share this but", and a stiff "Pricing:" header.
- **Voice (2 o):** "Probably both." touched on a should-stay line, and "are not" contracted where the "not" was stressed.
- **NP caption (1 o):** "The redesign we've been working on for the past 8 months."
- **False explanations (5):** the four meaning misses said "the line says the same", and one broken line had a why.

Every miss was fixed, re-graded by hand and tested. After the fixes: K 79/80 (o: the "Pricing:" header) and L 79/80 (o: the NP caption). That is 98.8% each, but **not first contact**. Both rounds are now in the fixture.

The bar: 0 meaning/fact/stance changes on every graded set (see below), yes. First contact is still not perfect: 5 meaning-class misses in 160 new lines, all in families the juror didn't list ("just" = only/simply after a comma or "the X is", hedge-as-joke, "pretty much flawless"). Where safety and h% traded off I chose safety and said so:
- "basically the best" and "basically always" stay;
- forecasts keep "I think";
- a result-first move that would add words no longer runs.

These cost a handful of earlier h-graded reorders ("Best language I've ever used? Rust." is now "Rust is basically the best language I've ever used."). They were re-graded h, and the "Basically always write tests first." case was re-graded o.

## Regression (every changed row re-graded by hand; overlays in tools/regrade-*.json)
| set | rows | h% | m |
|---|---|---|---|
| j147 (juror 4) | 147 | **89.8%** (juror measured 77.6%) | 0 |
| j159 / j158 | 159 / 158 | 95.6% / 95.6% | 0 / 0 |
| fixture (now 1,546 rows: +j147, +K, +L) | 1,546 | 97.0% | 0 |
| ev | 48 | 91.7% | 0 |
| rounds A–J | 80–81 each | 96.3–100% | 0 |
| rounds K / L (after fixes) | 80 / 80 | 98.8% / 98.8% | 0 |

Independent safety audit (`tools/audit5.js`, no grades used): every sharp line in every set (1,438) was checked for:
- meaning words, approximator pairs, negated restrictors, stance words, facts;
- number-word count, added comparatives, future and hedge added or dropped outside marks, emoji.

It raised 44 flags on 25 distinct drafts. I read them all, and all are benign: a number word inside a frame cut whole ("Can I be real for a second?", "One thing I've noticed is that"), "going to be X-ing" → "X-ing", or "the vast majority of" → "most". That leaves **0 meaning, fact or stance changes**. The one real flag the audit found ("then this might be for you" → "this is for you") is fixed.

## Tests
- **npm test: 164/164 green.** There are 14 new tests:
  - `sharpen-juror4.test.mjs` (8);
  - `sharpen-ai-validator.test.mjs` (3; a 45-row table);
  - 3 fake-client endpoint tests in `sharpen-ai.test.mjs`: the validator through the endpoint, claude_unchanged, and the cap + tag.
- **Four expectations changed** because juror 4's P0 rules supersede them. None was loosened on what it guards:
  - `sharpen-truth`: "@justin_really is basically the best trader" now keeps "basically". The atom checks still run, plus a new "honestly" case.
  - `sharpen-juror3`: "I think that in 5 years nobody will remember this." keeps "I think" (a forecast), plus a new case.
  - `sharpen-juror3`: the retail-traders wall no longer splits off the last item of its series. The assertion now checks that the beat count matches the line's real sentences and that the series stays whole.
  - `sharpen-eval.mjs`: "hedge left" no longer counts "really"/"just" under a negation ("don't really mean anything").
- **credits.test failed before my changes too:** a fixed October 2026 date against today's date. `refund()` settled with `Date.now()`, not the reservation's `now`. I fixed it in `server/lib/credits.mjs`, a one-line, real fix; the test is unchanged.

## Speed
| measure | now | before |
|---|---|---|
| median, 1,546 fixture rows | 4.5 ms | 3.2 |
| p95 | 11.7 ms | 9.8 |
| max | 73 ms | |
| first call after warm | 27 ms | |
| cold first call | 488 ms | |
| fromClaude | ~2 ms | |

## hero-sync
`node r86/fix/hero-sync.js`: every example matches HWCore.sharpenLine. No write needed.

## Still weak
- **Frame coverage is still a long tail.** Each new round still finds 2–3 unknown run-ups ("I can confidently say that", "nervous to share this"). The approximator/absolute list and the "just = only" contexts are hand lists too. K#26 and L#50/#75 show the next words they'll miss.
- **Long walls (over 280) stay o.** The engine cuts and splits but rarely restructures (#21, #41, #49 in j147).
- **Some h-graded reorders are now refused** (the safety trade-offs above). "Basically always write tests first." is an awkward survivor.
- **fromClaude's containment is lexical.** It allows any function word, so "we" → "I" or an added "not only" pattern is caught only by the negation and claim checks. It also blocks a Claude edit that uses a good synonym the engine's tables don't have ("nailed" for "finished").
- **Page-side hook-11/12 need the page builder** (above).
