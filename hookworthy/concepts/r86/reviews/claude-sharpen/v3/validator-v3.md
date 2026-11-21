# `SHARPEN.fromClaude` v3: a light validator, hard safety only

v2's validator cost 8.5 points on the held-out set: it rejected 28 of 200 answers, and 21 of those were graded h as Claude wrote them. So v3 keeps only the checks that protect the writer from a changed fact or a changed meaning. Claude's judgement decides the rest: tone, rhythm, vocabulary, order, casing and length.

Nothing here was applied to core.js. The working prototype is `_work/v3proto-fn.js` (`fromClaudeV3`, about 200 lines). `_work/core-v3proto.js` is a scratch copy of core.js (HEAD 2902968, unchanged since v2) with that file spliced in before `const SHARPEN = {`. Harness (all in `_work/`):
- `score3.js`: false rejects and catches on 4 graded sets.
- `select3.js`: what would ship on the v2 data.
- `adv3.js`: the 62-row test table in §6.
- `safety3.js`: v1's repo table and v2's adversarial table.
- `exck3.js`: the prompt's examples.

## 0. Measured on the graded data

"h rejected" means the judges graded the line h but the validator would have thrown it away (a false reject). "Meaning-flag caught" means the judges flagged a meaning change and the validator rejects it.

| set | outputs | h rejected | o accepted | m accepted | meaning-flag caught |
|---|---|---|---|---|---|
| **v2 held-out, Claude's first version** | 200 | **0 of 163 (0.0%)** | 28 of 29 | 7 of 8 | **1 of 1** (h-81) |
| v1 jury, Claude | 297 | 0 of 241 (0.0%) | 36 of 43 | 7 of 13 | 3 of 5; the 2 misses are harness artifacts (§5) |
| v2 held-out, engine lines (stress test) | 200 | 1 of 117 (0.9%) | 29 of 33 | 43 of 50 | 3 of 5 |
| v1 jury, engine lines (stress test) | 297 | 1 of 248 (0.4%) | 32 of 33 | 9 of 16 | 6 of 8 |

- **False rejects:** 0% on Claude's outputs in both rounds (target was under 3%). The two engine-set rejects are h-91, where the engine dropped "(thread)", and r3-49, where "I think" was dropped on a line with a forecast word.
- **Meaning changes:** every meaning change Claude actually made is caught. h-81 ("…something nobody really teaches you" → "Nobody really teaches you.") is caught, as are r4-57 (the dropped "Here's how" promise), r4-88 ("kind of okay" → "okay") and r4-121 ("thoughts on" frame).
  - The two v1 Claude misses, r3-31 and r3-156, are harness artifacts. The judges saw a two-line draft, the output was line 1 only, and the "lost" punchline lives on line 2, which Sharpen never edits.
  - The engine-set misses are h-56 and h-173: the engine dropped "I think"/"I believe" on an opinion, not a call or forecast. That hedge is the prompt's to keep (§2.3).
- **m lines that get through:** 7 of the 8 m lines in v2's raw output still pass. They're quality misses (reorders that end flat, an awkward colon, a fragment question), not fact or meaning changes. The prompt has to fix those; a validator can't.
- **What ships, v2 data with v3 selection:**
  - 198 of 200 lines ship version 1; h-81 ships version 2, and 1 line (h-120, graded o) falls back to the engine.
  - That's 81.5% postable overall and 70% on lines that needed work, against v2's shipped 73% and 57%. The 8.5 points come back.
- **Caveat:** these four sets are now the dev set, and I tuned on them. The next held-out (heldout2) is the real test; I didn't open it.

## 1. Contract

Same input and output as v2. `data = { versions: [{ line, why }], unchanged }`, with the v1 shape `{ line, why, unchanged }` still accepted. It returns `null` or `sharpenLine`'s result shape, with `source: 'claude'`, `pick` and `alts`. `trace.reject` gives the first reason; `trace.rejects` gives one reason per version.

## 2. The checks
They run per version, in this order, and the first failure rejects that version. Each one is listed with the rows that motivated it.

### 2.1 Facts and numbers (`fact … lost`, `fact … added`, `number … added`, `number word …`, `qualifier … lost`, `approximator lost`)
- Every fact `slFacts(draft, softMarks(draft))` finds is in the line verbatim (`slHas`): numbers with units, $, %, tickers, @handles, #tags, links and names. **Exception:** a bare weekday or month name ("Thursday") is a time word, not a fact. Dropping it with its clause was graded h (h-173).
- No new fact, no new digit run, no new number word. The number words are the cardinals two to billion, dozen, half, and double/triple/twice/Nx. "one", "first" and "second" aren't counted: "one of the things", "take a second" and "First of all" are idioms, and v2 rejected 6 h lines for dropping them.
- A number word in a clause that survives must survive.
- A qualifier stays with its number: about, around, roughly, approximately, almost, nearly, over, under, only, just, **like**, at least, at most, more than, less than, up to, barely, exactly, ~. ("about 40%", "like 6", "over 60", "~54%"). `slApxOK` still applies ("basically free").

A clause "survives" when at least half its content words, by stem, are in the line. Clauses are split on `. ! ? ; :`, on ", and/but/so/because…", and on dashes. This is what lets Claude cut a whole preamble without tripping the checks that follow.

### 2.2 Negations, by scope (`negation of "X" lost`, `"don't just" lost`, `negation added`)
```js
// for each negation in the draft (not, never, no, nobody, nothing, none, neither, nor, cannot, without, n't):
//   head = the next word, skipping a/the/be/is/that/it/to/really/just/even/ever/actually/quite/very/so/too/at/all/yet/always/one/any
//   if the head is not in the line → the whole negated phrase was cut: fine ("It's no secret that", "Not sure if this will resonate")
//   if the head is in the line → it must still be negated (a negation within the 5 words before it)
//   a restrictor right after the negation (just only simply merely always necessarily all every entirely completely quite exactly,
//   and "really" after not/n't/never) must stay within 2 words of a negation: "don't just write" ≠ "don't write",
//   "didn't really train" ≠ "didn't train"; "I don't think that's really the case" is fine
// and negsOf(line) <= negsOf(draft)
```
v2 counted negations, so cutting "It's no secret that" (h-80), "Not sure if this is going to resonate" (h-64) or "I never thought I'd be writing a post like this" (h-162) read as a lost negation. Those were 7 of the 28 rejects.

### 2.3 Hedges (`hedge … lost`, `stance … lost`)
- **Modal hedges** stay while their clause survives, on any claim: probably, maybe, perhaps, possibly, likely, unlikely, might, may, could, arguably, apparently, presumably, supposedly, I'd say/argue/guess/bet, I suspect, I guess, I doubt, seem(s), imo, imho, nfa. Dropping "probably" was meaning-flagged 5 times (r4-38, r4-62, r4-67, h-158, h-193).
- **Stance phrases** stay when the clause survives and the line is a call (`isCall`) or the clause is a plan or forecast (`ST_PLAN`): "I think", "I believe", "I feel like", "in my opinion". The phrase is compared on its core, so "I really, truly think that" → "I think" passes. A stance phrase may go when its clause keeps a modal hedge ("I think it might be…" → "It might be…").
- On a plain opinion, "I think" is not a hard check. Claude dropped it about 20 times across the two rounds, and the judges graded every one h. Enforcing it everywhere cost 5.5% false rejects on v2. The prompt keeps it instead, since the judges did flag the engine's drops (h-56, h-173).
- `stanceKeep(body)`'s own list must pass too, compared on its core. A degree word on that list is left to §2.4.

### 2.4 Softeners in front of a feeling (`degree … lost`)
`(kind of|sort of|kinda|sorta|a bit|a little|pretty|somewhat|slightly) (still|just)? FEELING`, where FEELING is okay, ok, fine, grateful, tired, nervous, proud, regret…, processing, embarrassed, impressed, lonely, scared, relieved and the rest of the list in the prototype. If the feeling word is in the line, the softener stays with it. "kind of okay" (r4-88, h-88) and "kind of regretting" (r3-12) were meaning-flagged.

Before an evaluation, the softener may go: "kinda wild" (r4-19), "kind of ridiculous" (h-112) and "pretty boring" (h-75) were all graded h when cut. Intensifiers (really, so, very) aren't checked: cutting them is style, which v1's judges graded o, never meaning.

### 2.5 Forecasts (`future lost`, `future added`)
Future markers are will, won't, shall, gonna, 'll and "going to" + verb, excluding "gonna lie", "going to the…" and "going to bed".
- The line keeps as many as the surviving clauses had, so "We will launch in March" can't become "We launched in March".
- It has no more than the draft, so "we ship every Friday" can't become "we will ship every Friday".
- A meta "I'm going to talk about / explain / share…" points at the post and isn't counted (h-33, r3-65).

### 2.6 Claim words (`claim added`, `hype added`, `restrictor added`, `quantifier … lost`)
- **Not added:** `SL_COMPW` (most, least, best, worst, only, biggest…, every, all, always, never, nothing, everyone, nobody, zero), counted after "the vast majority of" → "most" in the draft.
- **Not added:** hype and success words: huge, big, major, massive, insane, incredible, amazing, awesome, epic, legendary, guaranteed, unbeatable, revolutionary, world-class, ever, nailed, crushed, smashed, aced, killed it, skyrocket…, soar…, explod…, dominat…, blew up, (went) viral, perfect(ly), flawless. These are allowed when the draft has "game-changer", which the engine's own swap turns into "huge".
- **Not added:** restrictors: just, only, even, still, already, finally, merely, simply ("I want to build" ≠ "I just want to build").
- **A quantifier stays while its noun does:** most, all, every, only, almost, nearly, always, usually, often, sometimes, rarely, many, few, several. "Most people lose money" can't become "People lose money". This doesn't apply before a particle or a time word ("boil it all down", h-165).

### 2.7 Banned and never-say words, and put-back words
As v1: `aiN(line) > aiN(draft)` → `banned word`, which covers the AI-word list, verb uses of "leverage" and the author's never-say list. A word the writer put back after an earlier edit (`opts.keep`) stays → `put-back`.

### 2.8 Obvious breakage
Each is counted in the line against the draft, so the writer's own style never trips it:
| check | example |
|---|---|
| dangling opener: starts with `, ; : . ! ? ) ] — –` | "— it's been a minute!" (h-3 engine, m) |
| doubled word | "the the" |
| doubled punctuation | ",,", ",." |
| stray comma between a pronoun and its verb | "But I, think code reviews are broken" (h-68 engine, m) |
| dangling connector or end | "…last quarter and." |
| split ZWJ emoji | `slEmojiOK` |
| unbalanced ( ) or " | |
| dangling modifier after a cut "I can tell you that" | "after coaching 400 parents, the people who…" (r4-65, m) |

### 2.9 Four structure checks that protect meaning (not style)
Each one has caught a judged miss and has 0 false rejects on Claude's outputs:
- `pointer lost`: the draft has an explicit forward pointer ("Here's why / how / what… / my reasoning / the story", "thread", 🧵, 👇, "(1/"), and the line has none of those, no closing colon and no "here's/here are". Catches r3-20, r3-98 and r4-57. "(thread)" → "Here are 9 lessons I learned:" passes (h-91).
- `frame "thoughts" lost`: "A few quick thoughts on the Fed decision" → "The Fed decision" (r4-121, meaning-flagged).
- `object lost`: "it's something nobody really teaches you" → "Nobody really teaches you." (h-81, meaning-flagged). Passes when an object follows ("Nobody tells you that.") or precedes.
- `tone`: lol, lmao, haha, jk or /s kept. The engine's cuts were graded m (r4-74, h-29).

### 2.10 Unchanged and thin
- A version equal to the draft (whitespace-normalised) is **unchanged**. If it's version 1, or `unchanged` is true, ship it unchanged with Claude's why: no mark gating, no `same` reject.
  - Claude's unchanged calls were graded h 225 of 225 times across both rounds (141 + 84).
  - v2 rejected 2 of those (h-9 "Reminder:", h-121 "In today's issue:") and 3 punctuation-only fixes (h-92, h-115, h-199) as `same`.
- A punctuation-only change (a fixed splice, a capital, a colon) is a real edit and goes through the checks.
- On a thin draft (`slSkip`), an unchanged answer ships as `state: 'thin'`, and a changed one is rejected `thin`. The server should skip Claude for these anyway.

### 2.11 Length
Only as a guard against a runaway answer: `[...line].length <= max(1.25 × draft, draft + 25)` and `<= SHARPEN.AI_MAX`. There's no more "+4 characters": v2 rejected nothing for length, and the judges never penalised a longer line that read better.

## 3. Removed from v2 (and why)
| removed | why |
|---|---|
| closed vocabulary allowlist, licensed swaps (`added word`) | rejected 3 h lines (h-6 "used", h-58 "decided", h-107 "consider"). Passive → active and tense tidying need new word forms, and claim words are still caught by §2.6. |
| `same` (punctuation-only edits) | 3 h lines (comma splices fixed) |
| unchanged gated on soft marks | 2 h lines; 225/225 h historically |
| negation counting, `SL_MEAN` / `slGuard` meaning words, `SL_QUAL` qualifiers outside numbers | 7 h lines rejected as `meaning`; replaced by scoped negation (§2.2) and number qualifiers (§2.1) |
| `number lost` on "one/first/second" | 6 rejects, 3 of them h |
| `slBroken` templates, fragment and verbless counts, `As a X:` | 5 rejects, 3 h; replaced by the obvious-breakage list (§2.8) |
| tense/modality on past forms, `drops a hedge` on cut preambles | h-26 (the hedge sat in a cut preamble); replaced by clause-scoped hedges (§2.3) and forecasts (§2.5) |
| casing, voice list, frame noun ("issue/video"), reveal colon, AI-verb swap-or-keep, `+4` length, opener atom | style. The judges graded Claude's own calls here h far more often than the rules did; the prompt carries them. |

Engine-side changes proposed in v2 (§10 there) are independent and still apply to the rules fallback, which now runs on 1 line in 200.

## 4. Selection rule
1. Read up to 3 versions in Claude's order.
2. If version 1 equals the draft, or `unchanged` is true and the line equals the draft, ship it as unchanged.
3. Otherwise ship **the first version that passes every check**. Never re-rank by `hookScore`: the judges disagreed with its taste on reorders.
4. Later passing versions go to `alts` for a "Try another" tap.
5. If none passes, return `null` and the server shows `sharpenLine()`. On v2's data that's 1 line in 200.

**Should Claude put its single best version first, with a silent self-check? Yes.** prompt-v3 asks for exactly that:
- **What ships:** the light validator passes version 1 on 198 of 200 lines, so version 1's quality is what ships.
- **Order:** v2's biggest miss was order. On needs-work lines, first versions that reordered the writer's beats were graded h 42% of the time (15/36), against 80% for in-order edits (61/76). In most of those 36, Claude's own version 2 was the in-order split.
- **The self-check list:** facts copied, negations and hedges kept, nothing added, writer's order unless a move clearly wins, every sentence complete, ends on a beat that lands, still sounds like them. It's the validator's list plus the judges' three quality misses. It is to be done silently, so it costs thinking at effort `low`, not output tokens.
- **Fewer versions:** Sonnet returned at most two versions in v2 (112 lines got one, 88 got two). prompt-v3 asks for version 2 only when it's a genuinely different move, which saves output tokens and latency.

## 5. Known gaps
- **Two-line drafts in the harness** (r3-31, r3-156): the judges saw line 2, Sharpen edits line 1. Grade the line in context, or drop such rows.
- **"I think" on a plain opinion** isn't enforced (§2.3). If the next run shows meaning flags from Claude dropping it, set `V3.opts.thinkAll = true`. On v2 data that turns 9 h lines into rejects (5.5%), so tune the clause test first.
- **Quality m's pass:** reorders that end flat, awkward colons, fragment questions. By design.
- **Word lists:** the feeling, hype and quantifier lists are finite. A new claim word outside them ("legendary-tier") passes. They catch every case in the data; they're not a proof.
- **The clause-survival heuristic** (half the content words) decides when a dropped hedge, number word or future marker is "cut with its clause". A rewrite that paraphrases a whole clause can hide a dropped hedge from it. Facts, numbers and negated heads are checked without it.

## 6. Test table (62 rows, all pass on the prototype)
Rows in the shape of `sharpen-ai-validator.test.mjs`. The value is `'accept'` or the `trace.reject` the prototype returns.
- **41 bad rows**, one per hard rule.
- **21 good rows:** the real v2 lines graded h that `fromClaudeV2` rejected.

```js
/* v3: [name, draft, Claude's reply, 'accept' | trace.reject] */
  ["bad: number changed", "Our reply rate went up 2x after we cut the intro, honestly.", { versions: [{ line: "Our reply rate went up 3x after we cut the intro.", why: '' }], unchanged: false }, "fact \"2x\" lost"],
  ["bad: $ amount dropped", "I turned a $400 bag into $31k this cycle and I've been meaning to write up how.", { versions: [{ line: "I turned a small bag into $31k this cycle. Here's how:", why: '' }], unchanged: false }, "fact \"$400\" lost"],
  ["bad: % dropped", "Quick update: we hit 40% month-over-month growth, which honestly feels surreal.", { versions: [{ line: "We hit month-over-month growth that feels surreal.", why: '' }], unchanged: false }, "fact \"40%\" lost"],
  ["bad: ticker dropped", "honestly i think $SOL is just getting started tbh", { versions: [{ line: "i think it's just getting started", why: '' }], unchanged: false }, "fact \"$SOL\" lost"],
  ["bad: @handle dropped", "Really quick thread on why I think @jessepollak and the Base team are building the next Coinbase", { versions: [{ line: "Why I think the Base team is building the next Coinbase 🧵", why: '' }], unchanged: false }, "fact \"@jessepollak\" lost"],
  ["bad: link dropped", "My full breakdown of the $ARB airdrop is here: arb-breakdown.xyz", { versions: [{ line: "My full breakdown of the $ARB airdrop is in the replies.", why: '' }], unchanged: false }, "fact \"arb-breakdown.xyz\" lost"],
  ["bad: name dropped", "Last week, I had the privilege of attending SaaStr and I wanted to share my key takeaways", { versions: [{ line: "My key takeaways from last week:", why: '' }], unchanged: false }, "fact \"SaaStr\" lost"],
  ["bad: fact pulled up from the body", "Big news today, honestly.\nWe raised $4M from @sequoia.", { versions: [{ line: "Big news today: $4M from @sequoia.", why: '' }], unchanged: false }, "fact \"$4M\" added"],
  ["bad: number word added", "So honestly we finally hired our first engineer this week", { versions: [{ line: "We hired our first two engineers this week.", why: '' }], unchanged: false }, "number word added"],
  ["bad: multiplier changed", "We basically doubled our revenue in 6 months by just raising prices.", { versions: [{ line: "We tripled our revenue in 6 months by raising prices.", why: '' }], unchanged: false }, "number word added"],
  ["bad: approximator on a number lost", "We lost our biggest customer last week, they were about 40% of revenue.", { versions: [{ line: "We lost our biggest customer last week. They were 40% of revenue.", why: '' }], unchanged: false }, "qualifier \"about 40%\" lost"],
  ["bad: 'like 6' made exact", "Beginner mistakes I see in the gym literally every day (there are like 6 of them)", { versions: [{ line: "6 beginner mistakes I see in the gym every day", why: '' }], unchanged: false }, "qualifier \"like 6 \" lost"],
  ["bad: negation flipped", "Here's an unpopular opinion: cold calling is not dead, it's just being done badly", { versions: [{ line: "Cold calling is dead. It's just being done badly.", why: '' }], unchanged: false }, "negation of \"dead\" lost"],
  ["bad: 'don't just' lost", "We don't just write your posts, we learn your voice.", { versions: [{ line: "We don't write your posts. We learn your voice.", why: '' }], unchanged: false }, "\"don't just\" lost"],
  ["bad: 'didn't really' lost", "I didn't really train for this marathon and I still finished in 3:41.", { versions: [{ line: "I didn't train for this marathon. I still finished in 3:41.", why: '' }], unchanged: false }, "\"didn't really\" lost"],
  ["bad: negation added", "Hiring for attitude over skills is one of the best decisions a manager can make, honestly.", { versions: [{ line: "Hiring for skills is not one of the best decisions a manager can make.", why: '' }], unchanged: false }, "negation added"],
  ["bad: hedge lost on a call", "I think $SOL is going to outperform $ETH this cycle, honestly.", { versions: [{ line: "$SOL will outperform $ETH this cycle.", why: '' }], unchanged: false }, "hedge \"I think\" lost"],
  ["bad: 'probably' lost", "Thumbnails are probably more important than the actual video, which sounds crazy", { versions: [{ line: "Thumbnails are more important than the actual video, which sounds crazy.", why: '' }], unchanged: false }, "hedge \"probably\" lost"],
  ["bad: plan made certain", "We're probably going to shut down the free plan next month.", { versions: [{ line: "We'll shut down the free plan next month.", why: '' }], unchanged: false }, "hedge \"probably\" lost"],
  ["bad: 'imo' lost", "ngl $ETH/$BTC under 0.03 is kinda wild, ser. ngmi if you're still fading L2s imo", { versions: [{ line: "$ETH/$BTC under 0.03 is wild, ser. ngmi if you're still fading L2s.", why: '' }], unchanged: false }, "hedge \"imo\" lost"],
  ["bad: 'kind of okay' lost", "So I basically got laid off this morning along with 200 other people, and honestly I'm kind of okay with it.", { versions: [{ line: "I got laid off this morning along with 200 other people. I'm okay with it.", why: '' }], unchanged: false }, "degree \"kind of okay\" lost"],
  ["bad: 'a little nervous' lost", "Would really appreciate honest feedback on my new portfolio, it's been a long time coming and I'm a little nervous", { versions: [{ line: "Would appreciate honest feedback on my new portfolio. It's been a long time coming and I'm nervous.", why: '' }], unchanged: false }, "degree \"a little nervous\" lost"],
  ["bad: forecast made past", "We will launch the beta in March.", { versions: [{ line: "We launched the beta in March.", why: '' }], unchanged: false }, "future lost"],
  ["bad: present made a promise", "Honestly we ship a new feature every Friday", { versions: [{ line: "We will ship a new feature every Friday.", why: '' }], unchanged: false }, "future added"],
  ["bad: superlative added", "We just launched our analytics dashboard for small teams.", { versions: [{ line: "We launched the best analytics dashboard for small teams.", why: '' }], unchanged: false }, "claim added"],
  ["bad: 'only' added", "So honestly we raised $1M from angels", { versions: [{ line: "We raised $1M only from angels.", why: '' }], unchanged: false }, "claim added"],
  ["bad: hype verb added", "So honestly I finished the first draft of my book", { versions: [{ line: "I nailed the first draft of my book.", why: '' }], unchanged: false }, "hype added"],
  ["bad: 'big' added", "So we shipped v2 today", { versions: [{ line: "We shipped v2 today, and it's a big one.", why: '' }], unchanged: false }, "hype added"],
  ["bad: 'just' added", "Honestly I really want to build something people actually use.", { versions: [{ line: "I just want to build something people actually use.", why: '' }], unchanged: false }, "restrictor added"],
  ["bad: quantifier lost", "So basically most people lose money in crypto because they chase pumps.", { versions: [{ line: "People lose money in crypto because they chase pumps.", why: '' }], unchanged: false }, "quantifier \"most people\" lost"],
  ["bad: banned word added", "We use AI to improve how our team writes, honestly", { versions: [{ line: "We use AI to elevate how our team writes.", why: '' }], unchanged: false }, "banned word"],
  ["bad: dangling opener", "Hey friends — it's been a minute! Lots to catch up on this week so let's dive right in", { versions: [{ line: "— it's been a minute! Lots to catch up on this week.", why: '' }], unchanged: false }, "dangling opener"],
  ["bad: doubled word", "Feedback from stakeholders is often given in a way that is vague and unhelpful", { versions: [{ line: "Feedback from stakeholders is often the the vague kind.", why: '' }], unchanged: false }, "doubled word"],
  ["bad: stray comma before a verb", "I know everyone has an opinion on this already but I really, truly think code reviews are broken", { versions: [{ line: "I know everyone has an opinion on this already. But I, think code reviews are broken.", why: '' }], unchanged: false }, "stray comma"],
  ["bad: split ZWJ emoji", "Reminder that walking 10k steps a day is literally underrated 🚶‍♂️", { versions: [{ line: "Walking 10k steps a day is underrated 🚶‍ ♂️", why: '' }], unchanged: false }, "split emoji"],
  ["bad: dangling end", "We spent $80k on Meta ads last quarter and I want to share what we learned", { versions: [{ line: "We spent $80k on Meta ads last quarter and.", why: '' }], unchanged: false }, "dangling end"],
  ["bad: 'lol' dropped", "lowkey the only people making money on memecoins are the ones launching them lol", { versions: [{ line: "lowkey the only people making money on memecoins are the ones launching them.", why: '' }], unchanged: false }, "tone"],
  ["bad: thread pointer dropped", ">$100k BTC by Q1? I'd say 60% chance. Here's my reasoning:", { versions: [{ line: ">$100k BTC by Q1? I'd say 60% chance.", why: '' }], unchanged: false }, "pointer lost"],
  ["bad: opinion frame noun lost", "A few quick thoughts on the Fed decision today:", { versions: [{ line: "The Fed decision today:", why: '' }], unchanged: false }, "frame \"thoughts\" lost"],
  ["bad: verb loses its object", "Reading other people's code is a hugely underrated skill for developers and it's honestly something nobody really teaches you", { versions: [{ line: "Reading other people's code is a hugely underrated skill for developers. Nobody really teaches you.", why: '' }], unchanged: false }, "object lost"],
  ["bad: dangling modifier", "After coaching over 400 busy parents I can honestly tell you that the people who get results never miss.", { versions: [{ line: "After coaching over 400 busy parents, the people who get results never miss.", why: '' }], unchanged: false }, "dangling"],
  ["good: h-3 v2 rejected (broken), judges h", "Hey friends — it's been a minute! Lots to catch up on this week so let's dive right in", { versions: [{ line: "It's been a minute! Lots to catch up on this week.", why: '' }], unchanged: false }, "accept"],
  ["good: h-6 v2 rejected (added word \"used\"), judges h", "Finally open-sourcing the internal feature flag tool we've been using at work for two years!! Repo link below, would love stars and feedback", { versions: [{ line: "Finally open-sourcing the internal feature flag tool we've used at work for two years!! Repo link below. Would love stars and feedback.", why: '' }], unchanged: false }, "accept"],
  ["good: h-8 v2 rejected (number lost), judges h", "I just hit 100k subscribers on YouTube and I wanted to take a second to thank every single one of you who has supported me along the way", { versions: [{ line: "I just hit 100k subscribers on YouTube. Thank you to every single one of you who has supported me along the way.", why: '' }], unchanged: false }, "accept"],
  ["good: h-9 v2 rejected (unchanged), judges h", "Reminder: file your 83(b) within 30 days. I didn't, and it cost me $186k.", { versions: [{ line: "Reminder: file your 83(b) within 30 days. I didn't, and it cost me $186k.", why: '' }], unchanged: true }, "accept"],
  ["good: h-18 v2 rejected (number lost), judges h", "ok long one but bear with me: if you look at the last three cycles alt season didn't start until btc dominance dropped below ~54% and stayed there for at least two weekly closes, and we're sitting at 58.9% right now with eth/btc printing new lows, so everyone calling alt season this week is probably early by a month or two, maybe more, nfa", { versions: [{ line: "everyone calling alt season this week is probably early by a month or two, maybe more, nfa. in the last three cycles alt season didn't start until btc dominance dropped below ~54% and stayed there for at least two weekly closes. we're sitting at 58.9% right now with eth/btc printing new lows.", why: '' }], unchanged: false }, "accept"],
  ["good: h-26 v2 rejected (tense: drops a hedge), judges h", "Here's an unpopular opinion that might ruffle some feathers: cold calling is not dead, it's just being done badly", { versions: [{ line: "Cold calling is not dead. It's just being done badly.", why: '' }], unchanged: false }, "accept"],
  ["good: h-31 v2 rejected (broken), judges h", "Just wrapped up a rebrand for a fintech client and I'm really proud of how it turned out, swipe through to see the process", { versions: [{ line: "Just wrapped up a rebrand for a fintech client. I'm really proud of how it turned out. Swipe through to see the process.", why: '' }], unchanged: false }, "accept"],
  ["good: h-51 v2 rejected (broken), judges h", "We lost our biggest customer last week, they were about 40% of revenue, and I've been going back and forth on whether to post about it", { versions: [{ line: "We lost our biggest customer last week. They were about 40% of revenue. I've been going back and forth on whether to post about it", why: '' }], unchanged: false }, "accept"],
  ["good: h-58 v2 rejected (added word \"decided\"), judges h", "After much deliberation, the decision was made by our founding team to shut down the consumer app and focus entirely on enterprise", { versions: [{ line: "We decided to shut down the consumer app and focus entirely on enterprise", why: '' }], unchanged: false }, "accept"],
  ["good: h-64 v2 rejected (meaning), judges h", "Not sure if this is going to resonate with anyone but I think a lot of founders are burning out quietly and not talking about it", { versions: [{ line: "A lot of founders are burning out quietly and not talking about it", why: '' }], unchanged: false }, "accept"],
  ["good: h-68 v2 rejected (meaning), judges h", "I know everyone has an opinion on this already but I really, truly think code reviews are broken at most companies", { versions: [{ line: "Code reviews are broken at most companies.", why: '' }], unchanged: false }, "accept"],
  ["good: h-80 v2 rejected (meaning), judges h", "It's no secret that the way buyers make purchasing decisions has fundamentally changed over the last five years.", { versions: [{ line: "The way buyers make purchasing decisions has fundamentally changed over the last five years.", why: '' }], unchanged: false }, "accept"],
  ["good: h-87 v2 rejected (meaning), judges h", "First of all, I want to thank our investors, our team, and most of all our customers for believing in us from day one", { versions: [{ line: "Thank you to our investors, our team, and most of all our customers for believing in us from day one.", why: '' }], unchanged: false }, "accept"],
  ["good: h-92 v2 rejected (same), judges h", "Would really appreciate some honest feedback from design twitter on my new portfolio, it's been a long time coming and I'm a little nervous", { versions: [{ line: "Would really appreciate some honest feedback from design twitter on my new portfolio. It's been a long time coming and I'm a little nervous.", why: '' }], unchanged: false }, "accept"],
  ["good: h-115 v2 rejected (same), judges h", "Big news coming soon 👀 can't say too much yet but it's something I've been working on for over a year", { versions: [{ line: "Big news coming soon 👀 Can't say too much yet, but it's something I've been working on for over a year.", why: '' }], unchanged: false }, "accept"],
  ["good: h-121 v2 rejected (unchanged), judges h", "In today's issue: why the creator economy is quietly consolidating, a new study on attention spans, and three tools I can't stop using", { versions: [{ line: "In today's issue: why the creator economy is quietly consolidating, a new study on attention spans, and three tools I can't stop using", why: '' }], unchanged: true }, "accept"],
  ["good: h-147 v2 rejected (number lost), judges h", "One of the things I find myself thinking about more and more these days is the way algorithms are shaping what we read", { versions: [{ line: "Algorithms are shaping what we read. I find myself thinking about it more and more.", why: '' }], unchanged: false }, "accept"],
  ["good: h-157 v2 rejected (thin), judges h", "asdfgh", { versions: [{ line: "asdfgh", why: '' }], unchanged: false }, "accept"],
  ["good: h-162 v2 rejected (meaning), judges h", "I never thought I'd be writing a post like this, but after 9 incredible years at Halbrook, I've decided it's time for a new chapter.", { versions: [{ line: "After 9 incredible years at Halbrook, I've decided it's time for a new chapter.", why: '' }], unchanged: false }, "accept"],
  ["good: h-185 v2 rejected (meaning), judges h", "Every brand wants to go viral, but in my experience almost nobody really stops to think about what actually happens after the spike", { versions: [{ line: "Every brand wants to go viral, but almost nobody stops to think about what happens after the spike.", why: '' }], unchanged: false }, "accept"],
  ["good: h-199 v2 rejected (same), judges h", "Long overdue reflection on the past year of building Tallyhand, the good, the bad, and the stuff I'd rather not admit publicly but will anyway", { versions: [{ line: "Long overdue reflection on the past year of building Tallyhand: the good, the bad, and the stuff I'd rather not admit publicly but will anyway", why: '' }], unchanged: false }, "accept"],
```
v1's repo table (45 rows) under v3: every fact, number, negation, hedge, tense, claim-word, banned-word and emoji row is still rejected. The 8 rows now accepted are style checks v3 drops on purpose: unchanged-with-fluff, sarcasm intensifiers, the adjective "new", a longer reorder, hedge-for-hedge swaps (×2), casing, and a missing comma (`_work/safety3.js`).

## 7. Porting
Move `v3proto-fn.js` into core.js next to `fromClaude`, renaming `fromClaudeV3` to `fromClaude`. Keep `V3.opts` (thinkAll, quant, pointer, tone, length) as a tuning switch for the owner's eval, and log `trace.rejects` and `trace.pick` per call. Nothing else in core.js changes. The engine, `sharpenLine` and the schema helpers are untouched; `SCHEMA.sharpen` stays v2's `{ versions: [{ line, why }], unchanged }`.
