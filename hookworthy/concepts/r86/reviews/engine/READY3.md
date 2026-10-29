# r86 engine pass 2 (continued) — READY3

Engine: /home/user/xyphre1314/hookworthy/core.js (HWCore.sharpenLine; contract unchanged). sw.js CACHE v59 → v60.
index.html untouched (its one-tap paths already call sharpenLine). No AI API, no git writes, concepts/ untouched.

## The bar — not met, reported honestly
Done = two consecutive rounds ≥ 92% h on first contact with 0 meaning/fact/grammar misses and every why/say/cut true.

| Round | Lines | First contact h / o / m | h% | Meaning / fact / grammar misses | Expl. false |
|---|---|---|---|---|---|
| A | 80 | 72 / 4 / 4 | 90.0% | 1 meaning, 1 grammar (forced Q/A) | 20 (receipt ≠ strikes) |
| B | 80 | 68 / 4 / 8 | 85.0% | 2 meaning, 4 grammar | 1 |
| C | 80 | 70 / 4 / 6 | 87.5% | 1 meaning, 1 grammar, 1 sharp line reshaped | 5 |
| D | 81 | 70 / 4 / 7 | 86.4% | 1 meaning, 4 grammar | 3 |
| E | 81 | 75 / 2 / 4 | 92.6% | 2 grammar | 1 |
| F | 81 | 75 / 5 / 1 | 92.6% | 0 (the 1 m is a frame left, with a false why) | 1 |

E and F are both ≥ 92% h on first contact, but neither is clean, so the bar was not reached within the six rounds the brief allows. Each round's lines are in round-X.json, first outputs in round-X.first.json, grades and notes in round-X.graded.json, the log in rounds.md.

## First-contact misses by class (30 m over 483 lines)
- Frame left / unchanged when it should change: 10 (take-a-moment-to-thank, gonna-be-honest-with-you-guys, excited-to-be-partnering, I-don't-usually-post, been-meaning-to-post, I-don't-really-know-how-to-say-this, …).
- Grammar / broken template: 12 (forced Q/A on a topic or quantifier, "what if…" given a colon, colon after a link ×2, a split that dropped its subject, "For a second?", "how important it's to", wh-fragment, "…? no cap this.", "About them.", "Personally" left in an answer).
- Meaning: 5 ("200 weeks straight" lost "straight", "$ARB unlock" swapped as the never-say verb, a label cut that took the topic, a sarcasm marker cut, the joke's "i'll just").
- Already-sharp line reshaped: 1. Gibberish not caught: 2. Facts lost: 0.

## Regression (all changed rows re-graded by hand)
- Juror's 159: 151 h / 8 o / 0 m = **95.0%** (baseline before this pass 94.3%).
- Held-out fixture, original 132: 97.7%. Now 773 rows (+ the 159 and rounds A–F): 752 h / 21 o / 0 m = 97.3%.
- sharpen-eval 48: 44 h / 4 o = 91.7%.
- Median sharpenLine 3.9 ms, p95 7.8 ms.

## What changed (all patterns, no single strings)
1. **Receipt = strikes (addendum a, marketing-4).** `cut` holds exactly the struck fluff; "Cut N bit(s) of fluff" counts it. A reshape's small words (and/is/the/Here are) and plain-word swaps are not struck; the move or "Said it plainer"/"Tightened it" names them. Unmarked phrases that went are kind `extra`; a run-up a reshape dropped is still struck as what it is. Marks are cut exactly as marked.
2. **Whys (addendum b/c/f, marketing-1, founder-2).** A why that names cuts names all of them, exact text (≤ 3), or none. Lead whys quote the clause the line opens on (subject + verb + object, never ending on a small word), else a plain sentence, with variants. Hedge why only when no hedge is left. Put-back why: "You kept “X”, so the line opens on it, as you chose." Unsure whys say the true reason.
3. **Meaning guards.** Qualifiers about numbers/time ("straight", "almost", "only", "every", "about 3"); comparatives ("more than I can say here", web-15); "i'll just"; "is it all just vibes"; quotes, "not quite", "to be honest" as a complement; stance on calls incl. "is about to" and cycle calls; token "unlock" as a noun.
4. **Grammar guards.** Every sentence needs a verb or is an accepted hook shape; pronoun orphans ("It with you all"), a second colon, "!.", "About them.", subjectless splits, wh-fragments, topic/quantifier questions and pronoun-only answers are rejected; header colons only for short announced headers (never after a link, a comma tail, or a question); no stat-colon on multi-sentence lines; "how important it is" never contracts.
5. **Frames.** excited-to-share-it-with-you-all (whole; founder-1), excited-to-be-V-ing, take-this-opportunity/a-moment-to-thank, gonna-be-honest-with-you-guys, can-I-be-real-for-a-second, remind-everyone-that, emphasize-how-important, as-someone-who-has-X-I-can-say, I-don't-usually-post, going-back-and-forth, been-meaning-to-post, I-don't-really-know-how-to-say-this, random-thought-but, weekly-reminder, quick-thank-you, "ok but", "no cap", here's-my-honest-take-on X: (keeps X), "I would love to hear your thoughts" (bait). A run-up after a leading soft word is marked too; a put-back word never shields the run-up after it (uiux-18).
6. **Thin (marketing-3).** Thin = gibberish only (keyboard runs incl. "qwe rty", placeholders, lorem, salad). "gm", "just shipped", "lol" → clean, "Short and complete. Nothing to cut."; a real 7-word line is never thin.
7. **Atoms and case (addendum 1, d).** More link endings (youtu.be, .tech…) are atoms; no full stop after a trailing link; a line that opens on @/#/$ keeps it first; the first line's own case and "i"/"I" decide, never the body; a thread number "1/" is format.
8. **Kept (addendum e, marketing-2).** Numbers carry their unit ("90 days", "1,000 paying users", "6 year old", "sub-25 minute"), "Series A", "June 1st", "75 Hard", "$10k MRR"; public acronyms (CPI, ETF, AI, SaaS, B2B, DCA…), bare 0/1, orphan ordinals and pronouns are not "yours"; nothing from inside a link or handle.

## Tests
- `npm test`: 129/129 pass.
- New server/test/sharpen-truth.test.mjs (8 tests): receipt = strikes; whys name all cuts or none and quote phrases; founder/web orphan, colon and comparison cases; atoms (links with/without scheme, handles, tags, tickers) never marked/cut/split and kept first; first-line case; Kept rules; put-back restores one word; the round failures stay fixed.
- fixtures/sharpen-heldout.json: +641 rows (the 159 and rounds A–F) with hand grades for the current line; 10 original rows re-graded by hand.
- Test edits, said plainly: sharpen-heldout's thin list now follows the coordinator's spec ("gm"/"lol" are clean; gibberish stays thin; real 7-word lines must sharpen). Two false positives in its independent checks were narrowed with comments: "whether or not" is not a negation, and a token "unlock"/trading "on leverage that…" are nouns, not the never-say verbs. sharpen-eval's `now` fields updated for 2 rows re-graded h. No assertion was removed.

## hero-sync
`node hero-sync.js`: 1 mismatch — EX[2] Ana Ruiz receipt: page "Cut 1 bit of fluff · Number first · Split it into two beats", engine "Cut 1 bit of fluff · Number first" (a split the number move explains is no longer named twice). The lead re-syncs.

## For the page (not engine)
- Cut kinds now include `extra` and `redund`; there are no `move`/`tight`/`swap` items in `cut` any more, so every struck span is a chip and the fin counter can use `cut.length`.
- keptLine still appends "lowercase" (marketing-2 asks never); put-back hint verb "stay" → "come back"; "Another cut" → "Another version"; "Why it hits" over a why that only describes a cut (marketing-1/5).

## Still weak
- Each fresh round still finds 1–4 new frame or template classes; the engine is a rule set and generalises by accretion.
- Noun-phrase announcements with "with you all" ("excited to share our new feature with you all") stay unsure (true why, no rewrite).
- Voice judgment calls: wry hedges ("so i guess…"), the surprise "actually", lowercase closing "lol" (cut after a result).
- Long run-on lines keep their frames ("We should talk about…", "It's important to be transparent…").
