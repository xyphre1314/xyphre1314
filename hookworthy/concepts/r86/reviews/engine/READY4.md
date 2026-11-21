# r86 engine pass 4 — READY4

Engine: /home/user/xyphre1314/hookworthy/core.js (HWCore.sharpenLine; the result object keeps its shape). sw.js CACHE
v61 → v62 (v61 was already committed). index.html: the hookUpPack soft filter skips 'reshape' strikes. No AI API, no git
writes, concepts/ untouched.

## The bar: not met (reported honestly)
Done = two consecutive new rounds with ≥ 92% h overall AND ≥ 85% h on the lines that need work, 0 meaning/fact/grammar
misses, and every why/say/cut true. Each round: 80–81 new lines, half needing work. Graded at first contact under the
calibrated standard (h = a good creator would post it exactly as is, with no "fine but").

| Round | Lines (need work) | First contact h / o / m | h% overall | h% needs-work | h% should-stay | Misses | Expl. false |
|---|---|---|---|---|---|---|---|
| G | 80 (40) | 66 / 12 / 2 | 82.5% | 75.0% | 90.0% | 1 grammar, 1 false thin | 0 |
| H | 81 (40) | 63 / 16 / 2 | 77.8% | 55.0% | 100% | 2 grammar/structure | 3 |
| I | 80 (40) | 65 / 13 / 2 | 81.3% | 65.0% | 97.5% | 1 meaning, 1 grammar | 0 |
| J | 80 (40) | 63 / 14 / 3 | 78.8% | 57.5% | 100% | 1 meaning, 2 grammar | 1 |

Stopped after the 4 rounds the brief allows. Lines, outputs, grades and notes: round-X.json / .first.json / .graded.json,
the log in rounds.md.

## The calibration gap (calib.md)
- Blind on the juror's 158 I graded as strictly as the juror (71.5% vs 72.8% h; same grade on 140/158). So my earlier 92.6%
  was not lenient grading of the same work.
- It was line mix. My earlier rounds' needs-work lines were short, single-frame. The juror's (and now mine, G–J) are layered.
  Each new set of 40 needs-work lines brings 10–16 run-up frames the table has never seen. That is why first contact sits at
  55–75% on needs-work lines while should-stay lines come through at 90–100%.

## First-contact misses by class (rounds G–J, 9 m over 321 lines)
- Grammar / structure: 6. "sunseting"; "Because I thought nobody would care." (the disclaimer cut took the clause's head);
  a frame reordered behind the point; "Something that…, which is how…" fragment; a condQ on "If there's one thing…"; an
  "Obviously but" left behind after the NFA moved.
- Meaning: 2. "basically zero" → "zero"; notFlip read "not the solution" as the subject's.
- False thin: 1. Trailing full stops hid the verbs.
- Facts lost: 0. Negations flipped: 0.
- Explanations false: 4. Strikes split one frame and struck a kept "I"; three quotes stopped mid-phrase ("$HYPE looks",
  "We're 14 months", "just expensive").
- All 9 misses and all 4 false explanations are fixed and pinned in tests.

## What changed, by the juror's classes
- **hook-1.** An opinion frame takes its "that" ("I think that in 2026, …" → "In 2026, …"). ", and that's pretty much it"
  is not a fragment. A list-front rule no longer reads "most people need … and …," as a fragment. "Marked, not cut" says
  "breaks" only when the cut version really is broken or changes the meaning.
- **hook-2.** New run-up frames, each cut whole with its own why:
  - opener frames: lesson-learned ("As a designer, one of the most important lessons I've learned is that"); "(just) a quick
    thread on"; "A thread of"; "<word> tip:"; "It's (kind of) crazy/wild to think that"; "I'm (just) curious,";
    "(and) I have to say".
  - "Just wanted to give a huge shoutout to" → "Huge shoutout to".
  - later rounds added: let me be clear; let's be honest; it turns out that; one thing I've noticed is that; what I'm trying
    to say is that; for those of you who have been asking, yes; my two cents but; not to get too personal; I know it sounds
    counterintuitive but; and about 30 more.
  - "Nothing soft to cut" only when nothing matched.
- **hook-3.**
  - "<adj> update on X:" is one label, cut only when what follows names X ("Quick update on the startup: …" stays whole).
  - A line never opens on a bare topic preposition + colon.
  - A #tag/@handle/$ticker is masked as an atom in softCut, so "#buildinpublic update:" stays.
- **hook-4.** These stay:
  - "just" after a modal ("you can just log off") and before need/have to.
  - "basically/pretty much/practically/virtually" before every/all/everyone/nothing/zero/never.
  - A jab keeps "just" and loses only "actually".
  - "probably fine", and first-person feelings ("I'm really happy").
- **hook-5.** "yet another" is sarcasm only with a second signal (quote, opener, or the line's last clause). Otherwise only
  its own clause is guarded.
- **hook-6 / uiux-1.** Every removed word is struck. Glue a reshape drops, a phrase said another way, and anything that went
  without a live mark are kind **'reshape'**: struck, no squiggle, not counted, with their own why. `say` counts only fluff
  ("Cut 2 bits of fluff · Led with the number"). Every fluff strike overlaps a live mark (`R.marks` stays equal to
  `softMarks(draft)`). Put-back with `keep: [span]` works on every struck span, reshape included: the words come back, or the
  move that needed them doesn't happen. A user-kept word is in every version.
- **hook-7.** "just my opinion though" is one tail.
- **hook-8.** "…not saying X, but I am saying Y" keeps "I am".
- **hook-9.** "A, B, and C" lists of short parallel items are never split. "every single" is never cut. A crisp line (nothing
  soft, its own full stop) gets no Q/A or split.
- **hook-10 / marketing-1.**
  - Quotes end only where a phrase ends: not on a small word, a participle before "by", the first noun of a compound, a verb
    before its particle/object/"like"/"to", a quantity before "of", "N months" before "in", or before "than".
  - Backticks and quote marks are balanced.
  - Otherwise there is no quote, and the move's plain sentence is used.
- **hook-11.** A leading count says "The count comes first, so people know what they're getting." and quotes "10 VS Code
  extensions". The receipt counts beats ("Split it into three beats" / "Split it up").
- **hook-12.** "1 million downloads", "10,000 GitHub stars", "Day 90" are one fact each. "Kind of a big day" is an idiom.
- **hook-13.** Word salad from 4 words is thin.
- **hook-14.** Over 280 with the news in a short closing sentence, the news leads (also after other moves), and versions
  still over 280 rank lower.
- **hook-15.** A market-structure claim (priced in, halving, rotation, ATH, cycle top) is a call. A call that already hedges
  itself ("will probably") drops the opinion frame on top.
- **hook-16.**
  - A disclaimer sentence on its own is never marked. A disclaimer-only line is clean ("A disclaimer. Nothing to cut.").
  - "I am not a financial advisor and this is not financial advice but…" moves to the end as "Not financial advice.", struck
    as a reshape: "Said once, at the end: …".
- **marketing-3.**
  - The rated move needs a noun phrase.
  - Q/A keeps "the" unless a superlative follows.
  - "this week" is no longer read as a verb, so the fragment split is blocked.
  - An @handle at the end takes its full stop. A link or #tag still doesn't: a full stop on a link can break it, and a juror
    flagged that in pass 2.
- **web-1.** `HWCore.SHARPEN.warm()` runs every path once (guards, the soft table in four chunks, softCut, facts, the move
  tables, hookScore, hookUp, and 9 sample drafts covering a put-back, a body, a call with NFA, a question, an over-280 post
  and a sarcasm line).
  - In a browser it spreads 22 steps over `requestIdleCallback` and resolves with the ms spent, so there is no long task.
    `warm({ sync: true })` (and Node) runs them now and returns ms.
  - `warmSteps()` hands over the steps.
  - Regex compilation is cached per flags+source. softWhy and slHas cache theirs. softCut reuses the table's own regexes.

## Timings (Node, this container; three runs each)
- Cold first `sharpenLine`: **610–780 ms**.
- After `warm()`: first call **39–49 ms**, then **10–19 ms**.
- `warm()` itself is 840–915 ms in total when run synchronously. The largest single idle step is about 135 ms (the
  over-280 sample).
- Steady state on the juror's 158: median **3.2 ms**, p95 **9.8 ms**.
- Throughput: 300 fixture rows dropped from 4.7 s to 2.6 s after the regex caches.

## Regression (every changed row re-graded by hand)
- Juror 3's 158 (their lines, tuned on): 152 h / 6 o / 0 m = **96.2%** (needs-work 92.4%, should-stay 100%); was 72.8%.
- Juror 2's 159: 151 h / 8 o / 0 m = **95.0%**.
- Held-out fixture: now 1,243 rows (+ juror 3's 158 and rounds G–J): 1,213 h / 30 o / 0 m = **97.6%**.
- Earlier rounds, as they stand now (not first contact): A 98.8% · B 97.5% · C 96.3% · D 98.8% · E 100% · F 96.3% ·
  G 98.8% · H 100% · I 100% · J 97.5%.
- sharpen-eval: 44 h / 4 o = 91.7% (unchanged).
- Invariants over 2,021 distinct lines: 0 violations. They check:
  - the receipt equals the fluff strikes, and every fluff strike was marked;
  - a why names all its cuts or none, and no quote ends on a small word;
  - Kept is never a public acronym, 0 or "lowercase";
  - every why is ≤ 140 characters.

## Tests
- `npm test` (server): **138/138 pass**. No test weakened.
- New file server/test/sharpen-juror3.test.mjs (9 tests): each hook class on the juror's lines and probes, the quote-phrase
  rule over every held-out row, "fluff was marked first" and put-back on every struck span (a fifth of the fixture),
  rounds G–J misses, and warm().
- Two of my own phase-2 assertions changed as the rule settled. #70 keeps "just need" (= simply) and "pretty much it",
  because the existing held-out "no meaning flip" test protects both. That test was not touched.

## hero-sync
`node r86/fix/hero-sync.js`: "every example matches HWCore.sharpenLine".

## What's still weak
- **Coverage of run-up frames.** First contact on needs-work lines is 55–75%. Each fresh set still brings frames the table
  doesn't know. The engine is a rule table, and the tail is long.
- **Over-280 posts.** The news now leads, but long middles stay long: comma splices, "I've been thinking a lot about burnout
  lately." kept for its topic, and #117/#118 still over by a few characters.
- **Negation-preserving rewrites** are blocked by design, e.g. "Not sure why more people aren't talking about the fact that X"
  stays.
- **Small structure risks.** About one per round in G–J: a move that reads a sentence in a way the writer didn't mean. Each
  one found is pinned in tests, but new shapes will surface.
- **Unmarked cuts.** Words the clean step or a rewrite drops without a live mark are now 'reshape' (honest, not counted). The
  receipt can therefore show fewer "bits of fluff" than a reader would count.

## Files
- Engine: /home/user/xyphre1314/hookworthy/core.js · cache: /home/user/xyphre1314/hookworthy/sw.js (v62)
- Tests: /home/user/xyphre1314/hookworthy/server/test/sharpen-juror3.test.mjs (new), sharpen-truth.test.mjs (multiset strike
  test), fixtures/sharpen-heldout.json (1,243 rows)
- Scratchpad: r86/engine/
  - calib.md, rounds.md, round-G…J.*
  - tools/drift.js (sets j158, rG–rJ), tools/invariants.js (fluff-marked rule), tools/timing.js, tools/cold.js,
    tools/putback.js, patches p20–p30
