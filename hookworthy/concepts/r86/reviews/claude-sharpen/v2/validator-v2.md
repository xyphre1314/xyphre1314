# `SHARPEN.fromClaude` v2: what to change, and why

Target: `hookworthy/core.js`, the r86 block "Claude's Sharpen, held to sharpenLine's contract and guards" (`fromClaude`, `slAdded`, `slAIWhy` and the helpers around them). Nothing here was applied to core.js. Every rule below is implemented and tested in a scratch prototype:

- `csh2/v2/_work/v2proto-fn.js`: `fromClaudeV2` plus helpers, written against core.js internals (HEAD 4fa498c).
- `csh2/v2/_work/core-v2proto.js`: a scratch copy of core.js with that file spliced in before `const SHARPEN = {`, plus the one-line `slAIWhy` fix in §3.8. To port, move the code into core.js under the same names, without the `v2` prefixes.
- Harness, all in `_work/`: `score.js` re-scores the 297 graded v1 outputs, `adv.js` runs the 46-row adversarial table (§8), `regress.js` runs the repo's own 45-row validator table, `drycheck2.js` runs the dry-run versions, and `exck.js` runs the prompt's examples.

## 0. What the data says, and what v2 does about it

Joined `merged.json` + `grade-key.json` + `grade-out-{0,1}.json` (297 lines, one Claude output and one rules output per line, h/o/m). Re-running today's `fromClaude` on the same outputs gives exactly the graded decisions (0 differences), so the grades describe the current code.

| | v1 validator | v2 validator (same v1 outputs) |
|---|---|---|
| Claude h rejected (false rejections) | 35 (21 `thin` on lines where Claude and the engine return the same text, 10 `unchanged`, 2 `stance`, 1 `meaning`, 1 `broken`) | 0 (the 21 `thin` are accepted as agreement) |
| Claude o/m accepted (false accepts) | 41, of which 8 m | 26, of which 3 m: r4-106 is a typo both sources left, and r3-31/r3-156 are harness artifacts (the graders saw the multi-line draft, but the output was line 1 only) |
| shipped postable (h) | 82.8% | 88.9% |
| repo table `sharpen-ai-validator.test.mjs` (45 rows) | 45/45 | 45/45 same verdicts |

This is **in-sample**: the rules were written while reading these 297 lines. The held-out set (`csh2/heldout.json`, not opened) is the real test.

The 26 accepted o's that remain are timid edits: comma splices kept, "basically" kept, run-ons, weak openers, "In my opinion". The validator can't fix those. The v2 prompt targets them (see dry-run.md).

Root causes behind each change:

| finding | rows | change |
|---|---|---|
| `unchanged` rejected whenever any soft mark exists, but Claude's unchanged calls were 141/141 h (excluding the 3 artifact/typo m's) | r4-63 r4-93 r4-94 r4-103 r3-124 r3-133 r3-138 r3-143 r3-150 r3-153 | §2.2 |
| `thin` rejects an unchanged gibberish/short line, then the engine returns the identical text | 21 rows (gm, lol, asdf…) | §2.1 |
| stance compares the whole stance phrase, so "I really think that" → "I think" fails | r4-3 r3-4 | §3.4 |
| on a call every hedge is stance, so "might have been kind of wrong" → "might have been wrong" fails | r3-23 | §3.4 |
| `/\b(really|very|so),? \1\b/` protects "really really bullish" (judges: padding) | r4-0 | §3.3 |
| a label-stripped title ("New post: Why…") counts as a new fragment | r4-46 | §3.6 |
| guards and SL_MEAN compare raw text, so "are not really" → "aren't really" fails | (dry run r4-13) | §3.2 |
| `slSwapW()` misses swap words written inside lookup functions ("grow", "speed up", "tried", "smooth", "dig") and licenses its words for any draft ("huge", "big", "deal", "most", "biggest"…) | r4-57, r3-86; hole shown by adversarial A1/A2 | §4.1 |
| a WORDY swap writes "most", then `claim added` counts it | r3-116 | §3.7 |
| "I'm going to explain how" counts as a forecast, so it can't become "Here's how:" | r3-65 r3-49 | §3.5 |
| thread pointer dropped ("Here's my reasoning:", "Here's what happened:", "thread on why", "thoughts on…:") | r3-20 r3-98 r4-121 r4-17 r3-14 (2 m shipped) | §4.4 |
| a feeling's qualifier cut ("really means a lot", "kind of regretting") | r4-27 r3-12 | §4.2 |
| "absolutely no", "Honest question", "I really don't like", "very few" cut | r3-45 r4-109 r3-150 r4-103 r3-143 | §4.2 |
| voice marker cut (lowkey, TIL, today i learned, lol) | r3-27 (m) r4-28 r4-68 r3-26; the engine cut lol in r4-74/r3-12 (m) | §4.3 |
| what the post is dropped ("New video is up!", "In today's issue") | r3-110 r3-49 | §4.5 |
| dangling modifier after cutting "I can tell you that" | r4-65 (m shipped) | §4.6 |
| colon reveal flattened ("…professional: use fewer colors.") | r3-90 | §4.7 |
| AI verbs dropped without their plain swap, leaving a garbled claim | r4-57 (m) | §4.8 |
| "As a ghostwriter…: the hook is…" | r4-50 | §4.9 |

## 1. New contract and selection

Claude now returns `{ versions: [{ line, why }], unchanged }` (schema-v2.json). `SCHEMA.sharpen` becomes:

```js
sharpen: O({ versions: A(O({ line: Str, why: Str })), unchanged: { type: 'boolean' } })
```

Structured outputs can't express `minItems`/`maxItems`/`maxLength` (the API's strict schemas don't support those keywords), so the counts and the 140-character limit are enforced here.

```js
function fromClaude(text, data, opts = {}) {
  const no = (k, all) => { if (opts.trace && typeof opts.trace === 'object') { opts.trace.reject = k; if (all) opts.trace.rejects = all; } return null; };
  if (!data || typeof data !== 'object' || typeof data.unchanged !== 'boolean') return no('shape');
  // v1 shape still accepted: { line, why, unchanged }
  let vers = Array.isArray(data.versions) ? data.versions : typeof data.line === 'string' ? [{ line: data.line, why: data.why }] : null;
  if (!vers || !vers.length) return no('shape');
  vers = vers.filter(v => v && typeof v === 'object' && typeof v.line === 'string').slice(0, 3);   // at most 3, in Claude's order
  if (!vers.length) return no('shape');
  …                                   // draft, marks, facts, stance, R: exactly as v1
  if (slSkip(draft)) …                // §2.1
  if (data.unchanged) …               // §2.2
  const lic = licensed(draft);        // §4.1, computed once per call
  const reasons = [], ok = [];
  vers.forEach((v, i) => {
    const [why, res] = checkOne(v.line, typeof v.why === 'string' ? v.why : '');   // §7: v1's per-line body plus v2 changes
    reasons.push(why || 'ok');
    if (res && !ok.some(o => o.res.line === res.line)) ok.push({ i, res });        // dedupe identical passes
  });
  if (opts.trace) opts.trace.rejects = reasons;                                    // e.g. ['stance', 'ok', 'ok']
  if (!ok.length) return no(reasons.find(r => r !== 'same') || reasons[0], reasons); // caller shows sharpenLine()
  const best = ok[0];                                                              // FIRST passing version, never re-ranked
  if (opts.trace) opts.trace.pick = best.i;
  return { ...best.res, alts: ok.slice(1).map(o => ({ line: o.res.line, why: o.res.why, moves: o.res.moves })), pick: best.i };
}
```

- **Selection:** take the first version that passes all checks, in Claude's order. Don't re-rank by `hookScore` (it rewards moves the judges didn't). If none passes, return `null` and the server sends `sharpenLine()`, as in v1. `trace.reject` keeps v1's meaning (one reason) for the server's `reason` field; `trace.rejects` lists every version's reason for the owner's eval.
- `alts` (already in the result contract, always `[]` in v1) carries the other passing versions for a "Try another" tap. Don't show alts that failed.
- A version whose tokens equal the draft's is skipped with `same` (not a reject of the whole answer).

## 2. Unchanged and thin

### 2.1 Thin lines

Server: call `SHARPEN.tooThin(text)` before Claude and answer with `sharpenLine()` (no API call). In v1, 21 of 297 calls were spent on lines like "gm" or "asdf jkl", only for the validator to return `thin` and the engine to show the same text.

Validator (for callers that still send them): when `slSkip(draft)` and `data.unchanged && norm(versions[0].line) === norm(draft)`, return `{ state: 'thin', line: draft, …, source: 'claude' }` instead of `null`. `norm` = strip one pair of wrapping quotes, collapse whitespace, trim. A thin line that Claude changed is still `no('thin')`.

### 2.2 Unchanged with soft marks

v1 rejected `unchanged` whenever `softMarks(draft)` was non-empty. v2:

```js
if (data.unchanged) {
  if (norm(vers[0].line) !== norm(draft)) return no('shape');          // unchanged means the line as written
  return unchangedOK(draft, marks, vers[0].why) ? { ...R, say: 'Nothing to cut', why: slAIWhy(vers[0].why, …) || HK_WHY_SL.sharp } : no('unchanged');
}
function unchangedOK(draft, marks0, why) {
  const marks = marks0.filter(r => !KEEP_SPANS(draft).some(g => g[0] < r[1] && g[1] > r[0]));   // §4.2 guards are never marks
  if (!marks.length) return true;
  if (marks.some(r => !/^(?:filler|intens|hedge|opinion|feel|likeNum)$/.test(r[3]))) return false; // run-ups, labels, bait: never
  if (marks.length <= 2 && marks.every(r => !/\s/.test(draft.slice(r[0], r[1])) && /^(?:filler|intens)$/.test(r[3]))) return true;
  // otherwise Claude must vouch: quote each marked span (minus a trailing that/to/is/of/but) AND use a keep verb
  const W = lcw(why), keepV = /\b(?:stays?|stayed|kept|keeps?|is the (?:point|joke|feeling|meaning|tone|tension)|carr(?:y|ies)|is your (?:voice|tone)|says)\b/;
  return marks.every(r => { const s = lcw(draft.slice(r[0], r[1])).replace(/[\s,.:;!?]+$/, '').replace(/\s+(?:that|to|is|of|but)$/, '');
    return (W.includes(`“${s}`) || W.includes(`"${s}`)) && keepV.test(W); });
}
```

Kinds `open`, `throat`, `announce`, `label`, `disclaim`, `honest`, `bait`, `tail`, `stock`, `redund` and `wordy` are never accepted on unchanged. That's why "Honest question" is a guard (§4.2) and not something the model vouches for: as a `label` it shares a kind with "Unpopular opinion:".

| draft | Claude | v1 | v2 |
|---|---|---|---|
| Only 3% of founders actually reach $1M ARR. | unchanged | `unchanged` | accept (one single-word filler) |
| Very few people know you only have 30 days to file an 83(b). | unchanged | `unchanged` | accept (§4.2 guard) |
| I was literally on fire. Not a metaphor — my kitchen caught fire. | unchanged | `unchanged` | accept |
| I really don't like the new X algorithm. | unchanged | `unchanged` | accept |
| Honest question: why do so many founders think they need a co-founder? | unchanged | `unchanged` | accept (guard) |
| So basically BTC just reclaimed the 200 week MA… | unchanged, why "“So basically” stays" | `unchanged` | `unchanged` (open) |
| Honestly, the best workout program is just the one… | unchanged, why "“Honestly” stays" | `unchanged` | `unchanged` (honest) |
| Just a friendly reminder that `rm -rf /` is not a valid way… | unchanged | `unchanged` | `unchanged` (label; known gap, §9) |
| Squat 3x a week… versions[0] = "Squat 3x a week for 12 weeks." | unchanged | n/a | `shape` |

## 3. Relaxations

### 3.1 Length: a few characters and one word of room
```js
const toks = z => slToks(slUnC(z)).map(x => x.w);
if ([...line].length > [...draft].length + 4 || toks(line).length > toks(draft).length + 1) return 'longer';
if ([...line].length > SHARPEN_AI_MAX) return 'longer';
```
v1 required `<= draft`. A reorder sometimes adds a joiner and a mark ("I think the halving is already priced in. Here's why 👇" → "The halving is already priced in. Here's why I think so 👇": +3 characters, +1 word). Additions are still policed word by word (§4.1). Tests: A43 accept; A22 and A42 reject `longer`.

### 3.2 Contraction-blind meaning checks
In `slMeanOK` and `slGuardOK` (Claude path only, or both; the engine never contracts across a guard), test the line both raw and contraction-opened:
```js
const U = slUnC(line);
SL_MEAN2.every(re => !re.test(draft) || re.test(line) || re.test(U) || !re.test(slOutDisc(draft)))
slGuard(d).every(([a, b]) => { const s = lcw(d.slice(a, b)); return l.includes(s) || U.includes(slUnC(s)) || inDisclaim(a, b); })
```
Test A30: "staking yields are not really 'yield'…" → "Staking yields aren't really 'yield'. …" now accepted (v1: `meaning`).

### 3.3 Doubled intensifier
Replace `SL_MEAN`'s `/\b(really|very|so),? \1\b/i` with two regexes:
```js
/\b(really|very|so), \1\b/i                       // "really, really boring": deliberate, keep
new RegExp(String.raw`\b(really|very|so) \1 (?=${FEELW}\b)`, 'i')   // "so so tired": a feeling, keep
```
"the chart looks really really bullish" → "…looks bullish" is accepted (judges: keeping it was padding, o). This changes the engine too, since `SL_MEAN` is shared, and that's what the judges asked for (r4-0 rules output was graded o for keeping it). Tests: A33 accept, A34 reject `meaning`.

### 3.4 Stance compared on its core
```js
const core = w => lcw(slUnC(w)).replace(/\b(?:really|honestly|genuinely|truly|actually|personally|just|do|that)\b\s*/g, '').replace(/\s+/g, ' ').trim();
const stanceOK = w => {
  if (lcw(line).includes(lcw(w))) return true;
  const c = core(w); if (c && lcw(slUnC(line)).includes(c)) return true;          // "I really think that" → "I think"
  // a degree hedge may go when its sentence keeps a modal hedge: "might have been kind of wrong" → "might have been wrong"
  if (!/^(?:kind of|sort of|kinda|sorta|a bit|a little)$/i.test(w)) return false;
  const s = slSents(body).find(x => lcw(x).includes(lcw(w))) || '', mo = s.match(/\b(?:might|may|could|probably|maybe|perhaps|likely|possibly)\b/i);
  return !!mo && new RegExp(`\\b${mo[0]}\\b`, 'i').test(line);
};
if (!st.every(stanceOK)) return 'stance';
```
`kind of` before a **feeling** is still protected by §4.2 ("kind of okay"). Tests: A31, A39 accept; A6, A40 reject `stance`.

### 3.5 A meta "going to" is a pointer, not a forecast
Before `slTenseOK`, add these spans of the draft to the marks it reads (merged, sorted):
```js
const META_FUT = /\b(?:i['’]m|i am|we['’]re|we are|i['’]ll|we['’]ll|i will|we will|gonna)\s+(?:going to\s+)?(?:be\s+)?(?:talk(?:ing)?|explain(?:ing)?|shar(?:e|ing)|show(?:ing)?|break(?:ing)? (?:it )?down|walk(?:ing)? (?:you )?through|tell(?:ing)? you|cover(?:ing)?|go(?:ing)? (?:over|through)|div(?:e|ing) into|unpack(?:ing)?|answer(?:ing)?)\b/gi;
```
"…and I'm going to explain exactly how I did it in this thread" → "… Here's exactly how:" is accepted. "We're probably going to shut down the free plan" is still a plan (no verb from the list). Tests: A29 accept; repo row "a hedged plan made definite" still `stance`.

### 3.6 A label-stripped title is the writer's own fragment
```js
const LABEL = /^\P{L}*(?:new (?:post|video|episode|issue|essay|article|blog post|podcast)|just published|out now|today['’]s (?:issue|post|video|episode)|this week['’]s (?:issue|post|video|episode))\s*[:—–-]\s*/iu;
if (slBroken(line, draft)) { const lab = LABEL.exec(draft); if (!(lab && !slBroken(line, draft.slice(lab[0].length)))) return 'broken'; }
```
"New post: Why every creator needs to own their email list (and what happens when you don't)" → the title alone is accepted (r4-46, judges h). r4-57's "How we help B2B brands with LinkedIn…" still fails (no label, and §4.8). Test A32.

### 3.7 Licensed swaps feed the "nothing new" tallies
`claim added`, `number added` and `number lost` are counted against the draft **and** the draft with its licensed swaps applied (`lic.sw`, §4.1). A version fails only if it fails both:
```js
const moreBoth = (line, re) => slMore(line, draft, re) && slMore(line, lic.sw, re);
… moreBoth(line, SL_NUMW2) || moreBoth(line, SL_FACTW) → 'number added'; moreBoth(line, SL_COMPW) → 'claim added'
… slMore(o, line, SL_FACTW) && slMore(lic.sw, line, SL_FACTW) → 'number lost'
```
"The vast majority of retail traders…" → "Most retail traders…" is accepted, since WORDY writes "most" (r3-116). "A lot of retail traders" → "Most retail traders" still fails `claim added` (A11).

### 3.8 `slAIWhy`: "opens a gap" is not "comes first"
In `slAIWhy`, change
```js
first = /\b(?:first|leads?|opens?|up front|starts?)\b/i
```
to
```js
first = /\b(?:first|leads?|up front|(?:opens?|starts?) (?:on|with))\b/i
```
Today "The question opens a gap and “Doing absolutely nothing” closes it." is replaced by the engine's why, because "opens" is read as a claim that the quote comes first. That wording is in v1's own prompt examples.

## 4. Tightenings

### 4.1 The closed allowlist for added words (replaces `slAdded`)
This is the coordinator's question: v2 needs room to restructure, but must never add a fact or claim. The rule: **a version may add a word only if it is (a) a form of a word in the draft, (b) written by an engine swap that fires on this draft, or (c) on the closed list below, under its condition.** No new noun, verb, adjective or adverb of claim can get in any other way.

(a) the writer's own words: the exact lowercased word, or the same `slStemC` stem, as v1. A contraction is split by `slUnC` and each part must pass ("here's" = here + is, "they'll" = they + will, but "don't" = do + **not** fails).

(b) licensed swaps, per draft, computed by running the tables. This replaces v1's `slSwapW()`, which parsed function source, missed "grow", "speed", "tried", "smooth" and "dig", and licensed "huge", "big", "deal", "most", "biggest", "lesson", "taught" and "favorite" for every draft:
```js
const TABLES = () => [WORDY, CONTRACT_W, PLAIN_W, HK_SWAP, CLICHE_W];     // CLICHE_W: §5
function licensed(draft) {
  const L = new Set(), D = new Set(words(draft)); let sw = String(draft);
  for (const T of TABLES()) for (const [re, rep] of T) {
    try {
      const r = new RegExp(re.source, gFlags(re.flags)); if (!r.test(draft)) continue; r.lastIndex = 0;
      for (const w of words(String(draft).replace(r, rep))) if (!D.has(w)) { L.add(w); L.add(slStemC(w)); }
      sw = sw.replace(new RegExp(re.source, gFlags(re.flags)), rep);
    } catch (e) { /* a swap that can't run on this draft licenses nothing */ }
  }
  return { L, sw };   // L: words the swaps may add; sw: the draft with every licensed swap applied (§3.7)
}
// words(z): [...z.matchAll(/(?<![\p{L}\p{N}_$@#])[\p{L}][\p{L}'’-]*/gu)].map(m => lcw(m[0]).replace(/[-']+$/, ''))
```

(c) the closed list, `ALLOW_V2`. These are always allowed:
```
a an the this that these those
and but or nor yet if than because while
of to in on at for from with by as into about up out over
i me my we us our you your they them their it its he him his she her there here
is are was were be been being am do does did have has had
will would should could may might must            (an added modal still fails the tense/modality check)
what why how who when where which
```
These are allowed only under a condition:
| word | allowed when |
|---|---|
| `so` | followed by `, . : ; ! ?`, end of line, an emoji, or `i we you they he she it the a my our your this that here far` (a connective: "so I quit", "I think so 👇"), never before an adjective ("so tired") |
| `now then today after before` | the draft already has a time or sequence word: `/\b(?:now|then|today|tonight|yesterday|tomorrow|after|before|until|since|ago|later|first|finally|when|years?|months?|weeks?|days?|hours?|morning|night|week)\b/i` (digits alone don't count) |
| `changed result lesson move fix` | the next non-space character is `:` ("What changed:", "The result:") |

Never on the list, whatever the context: `not no never nothing nobody none just only even still already really very truly super totally literally actually basically most best worst biggest every all always huge big massive insane can first last`. A licensed swap may still write one of these, because the draft licensed it ("the vast majority of" → "most", "game-changer" → "a big deal").

Not on the list on purpose: `can` (it adds ability or permission, and no tense check covers it), `not` (a negation; `negsOf` also catches it), and `now/then/today/after/before` without a time in the draft (they add a claim that something changed).

The coordinator's suggested "here's, why, how, what, changed, the, result, now, after, before, then, so, but" are all covered, the last five under the conditions above.

```js
function addedWord(line, draft, lic) {
  const DS = new Set(slWords(draft).map(slStemC)), DW = new Set(words(draft)), timey = TIMEY.test(draft);
  for (const m of line.matchAll(/(?<![\p{L}\p{N}_$@#])[\p{L}][\p{L}'’-]*/gu)) {
    const w = lcw(m[0]).replace(/[-']+$/, ''), after = line.slice(m.index + m[0].length);
    if (DW.has(w) || DS.has(slStemC(w)) || lic.L.has(w) || lic.L.has(slStemC(w))) continue;
    const parts = slUnC(w).split(/\s+/).filter(Boolean); if (parts.length > 1 && parts.every(p => ALLOW_V2.has(p) || DW.has(p))) continue;
    if (w === 'so') { if (/^\s*(?:[,.:;!?]|$|\p{Extended_Pictographic})|^\s+(?:i|we|you|they|he|she|it|the|a|my|our|your|this|that|here|far)\b/iu.test(after)) continue; return w; }
    if (ALLOW_V2.has(w)) continue;
    if (TIME_V2.has(w) && timey) continue;
    if (LABEL_V2.has(w) && /^\s*:/.test(after)) continue;
    return w;
  }
  return '';
}
```
Tests: A1 ("Huge.") and A2 ("Big deal.") now reject `added word`, though v1 accepted both. A4 ("just"), A5 ("now" with no time in the draft) and A12 ("so tired") reject. A27 ("moved the needle" → "worked") and A28 ("the vast majority of" → "most") are accepted, though v1 rejected both. A43 ("I think so 👇"), A44 ("Today" → "Now") and A45 ("The result:") are accepted; A46 ("the result was") rejects.

### 4.2 Feelings keep their strength; a few more meaning guards
New check `feeling`, after `meaning`:
```js
const Q = String.raw`(?:really|so|very|super|kind of|kinda|sort of|sorta|pretty|a bit|a little|deeply|truly|incredibly|extremely)`;
const FEELW = String.raw`(?:okay|ok|fine|grateful|thankful|tired|exhausted|burn(?:ed|t) out|struggling|scared|afraid|nervous|anxious|proud|sorry|impressed|disappointed|worried|lonely|bored|sad|happy|upset|mad|angry|frustrated|confused|overwhelmed|embarrass(?:ed|ing)|regret(?:s|ted|ting)?|hate|love|miss|appreciate|ashamed|jealous|stressed|relieved|shaking|heartbroken|humbled|honou?red|glad|thrilled|excited|means? a lot|meant a lot)`;
const FEEL_RE = new RegExp(String.raw`\b(${Q})(?:,? \1)?\s+(?:(?:been|being|feel|feeling)\s+)?(${FEELW})\b`, 'gi');
for (const m of draft.matchAll(FEEL_RE)) {
  if (marks.some(r => /^(?:announce|throat)$/.test(r[3]) && m.index >= r[0] && m.index < r[1])) continue;   // "I'm so excited to announce that" goes whole
  if (!wordIn(line, m[2])) return 'feeling';                                   // the feeling itself was cut
  if (!lcw(line).includes(lcw(m[0])) && !slUnC(line).includes(slUnC(m[0]))) return 'feeling';   // its qualifier was cut
}
```
Plus six guards. Put them in `slGuard` so the engine stops cutting them too: the rules output was graded o/m on r4-103, r3-143, r3-150, r4-94 and r4-109. In the prototype they live in the same check (`keep "…"`):
```js
/\bvery (?:few|little|first|last|best|end|beginning|least)\b/gi                      // "very few" ≠ "few"
/\b(?:i|we)\s+really\s+(?:don['’]t|do not|didn['’]t|did not|can['’]t|won['’]t)\b/gi   // "I really don't like"; not "most people really don't actually"
/\b(?:not sure|wonder(?:ing)?|unsure) (?:if|whether) (?:i|we|you|they|it|this) (?:really|actually)\b/gi
/\b(?:absolutely|completely|totally) (?:no|nothing|zero|none|never|nobody)\b(?![^.!?,]*\bwhatsoever\b)/gi   // r3-97: "whatsoever" already carries it
/\bliterally\b(?=[^.!?]*[.!?]?\s*(?:not a (?:metaphor|figure of speech|joke)\b|no,? (?:really|literally)\b))/gi
/^\P{L}*(?:honest|genuine|serious|real) question\b/giu
```
Rows this catches: r4-27 "it really means a lot" → "it means a lot" and r3-12 "kind of regretting" → "regretting" (both accepted o in v1), r3-45 "absolutely no sense" → "no sense", and r4-109 "Honest question:" cut. "I'm really excited to announce that we just launched…" → "We just launched…" still passes, since the frame is an `announce` mark. Tests: A8, A23, A36 reject; A35 accept.

### 4.3 Voice markers survive
```js
const VOICE = /(?<![\p{L}\p{N}])(?:lowkey|highkey|til|today i learned|lol|lmao|lmfao|haha+|fr|ser|anon|wen|ngmi|wagmi|lfg|af|iykyk|smh|no cap|rekt)(?![\p{L}\p{N}])/giu;
// each marker's count in the line >= its count in the draft, case-insensitive, else 'voice'
```
Not on it, on purpose: ngl, tbh, honestly and literally. The judges graded cutting those h (r4-19, r3-24, r4-0, r3-30). The judges graded the engine's own "lol" cut m twice (r4-74, r3-12); see §10. Tests: A17, A18 reject.

### 4.4 The thread pointer and its promise
```js
const PTR = /\bhere(?:['’]s| is| are)\b(?! the (?:thing|deal|truth|kicker|catch)\b)|\bthread\b|[🧵👇⬇↓]|\b\d{1,2}\/(?:\d{1,2}|n)?\s*$|\bbelow\b|:\s*$/iu;
const PQ = /\b(?:why|how|what)\b/gi;
const PN = /\b(?:reasoning|reasons?|thoughts?|lessons?|takeaways?|learned|learnings|happened|changed|worked|everything|mistakes?|tips?|things|ways|signals?|steps?|rules?|story|breakdown)\b/gi;
function pointerOK(line, draft) {
  if (!PTR.test(draft)) return '';
  if (!PTR.test(line)) return 'pointer';                                    // a closing ":" counts as a pointer
  const Lw = new Set(words(line).map(slStemC));
  for (const s of slSents(draft).filter(x => PTR.test(x))) {
    if ((s.match(PQ) || []).some(w => !Lw.has(slStemC(lcw(w))))) return 'pointer';           // every why/how/what stays
    const nn = (s.match(PN) || []); if (nn.length && !nn.some(w => Lw.has(slStemC(lcw(w))))) return 'pointer';   // at least one promise noun stays
  }
  return '';
}
```
"So here's the thing." isn't a pointer: CLICHE_W (§5) cuts it, and r4-90 and r3-155 stay accepted. Shipped m's this catches: r3-20 (dropped "Here's my reasoning:"), r3-98 (dropped "Here's what happened:") and r4-121 ("A few quick thoughts on the Fed decision today:" → "The Fed decision today:"). It also catches the accepted o's r4-17 (dropped "thread on why") and r3-14 (dropped "why"). "Thread: 5 on-chain signals… 👇" → "5 on-chain signals… 👇" still passes (r4-12, h). Tests: A7 reject; A37 accept.

### 4.5 What the post is stays named
```js
const FRAME = /\b(?:today['’]s|this week['’]s|this month['’]s|this|my|our|the|latest|new)\s+(?:(?:full|latest|new|weekly|first)\s+)?(issue|newsletter|edition|episode|video|essay|podcast|breakdown|course|guide|article)\b/i;
// if FRAME matches the draft, the line must contain that noun, unless the draft opens with a bare "Label:" of at most
// three words that holds the match ("New post: …"); then the title can stand alone (§3.6)
```
`post` and `thread` aren't in it: a "this thread" pointer is §4.4's job, and "New post:" is a label. Catches r3-110 ("New video is up!" cut) and r3-49 ("In today's issue" cut; v2's tense relaxation would otherwise have let that o through). Test A16.

### 4.6 No dangling modifier after a cut "I can tell you"
```js
const DANGLE = /\b(after|since|by|from|while|when|before)\s+(\w+ing)\b([^,.!?;:]{0,90}?),?\s+(?:i|we)\s+(?:can|could|will|['’]ll|have|['’]ve|am|['’]m)?\s*(?:honestly |confidently |safely |definitely )?(?:tell you|say|promise you|promise|guarantee|assure you)(?: that)?\s+/i;
// if the draft matches and the line still has "after coaching …", the next word must be i/we/i'm/i've/we've/we're/my/our/i'd/i'll, else 'dangling'
```
r4-65's shipped m ("…after coaching over 400 busy parents in the last 5 years, the people who get…") is rejected. Test A14.

### 4.7 A colon reveal keeps its colon
```js
const m = /^(.+?):\s+([^:]+?)\s*[.!]?\s*$/u.exec(draft);
// skip unless the setup has >= 5 words, the payoff 1-6 words, and no open/throat/announce/label/opinion/honest/disclaim mark starts in the setup;
// if the line contains the payoff, the text before it must end in ":", "?", "—", "–" or "-", else 'reveal'
```
Catches r3-90 ("…10x more professional: use fewer colors." flattened). Leaves "Unpopular opinion: X" (2-word setup) and r4-48 (a run-up setup, marked) alone. Tests: A15 reject, A38 accept.

### 4.8 An AI verb comes back as its swap, never as nothing
```js
const AIV = [/leverag/i, /supercharg/i, /unlock/i, /elevat/i, /\bdelv/i, /seamless/i, /utili[sz]/i, /game[- ]?changer/i];
// for each that is in the draft and not in the line: collect the words the matching swap entries (source matches the AI word)
// write into this draft; if there are any and the line has none of them (by stem), reject 'swap'
```
r4-57's m ("How we help B2B brands with LinkedIn, their pipeline and growth.") is rejected; "…use LinkedIn to grow their pipeline" is accepted. Test A21.

### 4.9 "As a X:" is broken
Add `/^\P{L}*as an? [^:.!?,]{3,60}:\s/iu` to the broken checks, counted against the draft (r4-50, o). The engine's WORDY "As a X, I can tell you that Y" → "I’m a X. Y" is licensed and passes.

## 5. CLICHE_W: a fifth swap table (cut, or a plain phrase with the same claim)
```js
const CLICHE_W = [
  [/\bat the end of the day,?\s*/gi, ''],
  [/\bin today['’]s (?:(?:fast-paced|ever-changing|ever-evolving|rapidly changing|digital|modern|competitive|busy|noisy|crowded) ){1,3}(?:world|landscape|age|era|economy|market|climate),?\s*/gi, ''],
  [/\bin this day and age,?\s*/gi, ''],
  [/\b(?:so,? )?here['’]s the (?:thing|deal|truth)[.:,]?\s*/gi, ''],
  [/\bit['’]s no secret that\s*/gi, ''],
  [/\bneedless to say,?\s*/gi, ''],
  [/\bwithout further ado,?\s*/gi, ''],
  [/\bwhen it comes to\b/gi, 'for'],
  [/\bmov(e|es|ed|ing) the needle\b/gi, (m, e) => ({ e: 'work', es: 'works', ed: 'worked', ing: 'working' })[e.toLowerCase()]],
  [/\blow-hanging fruit\b/gi, 'easy wins'],
  [/\b(?:a )?deep dive (?:into|on)\b/gi, 'a breakdown of'],
  [/\bthink outside the box\b/gi, 'think differently'],
  [/\b(?:a )?plethora of\b/gi, 'a lot of'],
];
```
Every replacement makes the same claim or a weaker one. The words it can license are for, work/works/worked/working, easy, wins, breakdown, differently and lot, and only when the cliché is in the draft. Leave "double down" out: `SL_FACTW` counts "double", so a swap would trip `number lost`. The prompt's swap list (prompt-v2.txt, move 4) is the same set, so the model never reaches for a plain word the validator would reject. The engine can use this table in `sharpenLine` as well; it's independent of Claude.

## 6. `why`
Unchanged from v1, apart from §3.8: `slAIWhy` per version; on a failure, the engine's own why for that version. The prompt asks Claude to flag a likely typo **without quotes**, since a quoted word in neither line would void the why.

## 7. Order of checks in `checkOne(line, why)`
1. unquote, `empty`, capitalise like the draft, drop a full stop after a final link (v1)
2. `same` (tokens equal the draft's)
3. `longer` (§3.1)
4. `fact lost` (v1)
5. `meaning` (§3.2, §3.3, plus v1's negation, qualifier and approximator tallies)
6. `feeling` (§4.2)
7. `broken` (v1, §3.6, §4.9)
8. `thin`, `opener`, `put-back` (v1)
9. `stance` (§3.4)
10. `fact added`, `number added`, `number lost`, `claim added` (§3.7), `added` (emoji, [blank]), `meaning` (more negations), `banned word` (v1)
11. `added word` (§4.1)
12. `tense` (§3.5)
13. `casing` (v1)
14. `voice`, `pointer`, `frame`, `dangling`, `reveal`, `swap` (§4.3–4.8)
15. receipt via `slExplain`, as v1

## 8. Test cases
Rows in the shape of `sharpen-ai-validator.test.mjs`'s TABLE. With the v2 shape, `F` should pass `data` straight through. The expected value is `'accept'` or the reject reason (`trace.reject`). All 46 pass on the prototype; the `// v1:` comment is today's validator on the same line (shown as one version).

```js
/* v2: [name, draft, Claude's reply (v2 shape), 'accept' | reject reason] */
  ["bad: added hype adj", "In my humble opinion, the best trade this year has simply been doing absolutely nothing.", { versions: [{ line: "The best trade this year? Doing absolutely nothing. Huge.", why: "" }], unchanged: false }, "added word"], // v1: accept
  ["bad: added 'big deal' (swap word, unlicensed)", "So basically we just crossed 1 million downloads this week.", { versions: [{ line: "We just crossed 1 million downloads. Big deal.", why: "" }], unchanged: false }, "added word"], // v1: accept
  ["bad: added only", "Just a quick reminder that 90% of altcoins went to zero last cycle.", { versions: [{ line: "Only 90% of altcoins went to zero last cycle.", why: "" }], unchanged: false }, "claim added"], // v1: claim added
  ["bad: added just", "Honestly I really want to build something people actually use.", { versions: [{ line: "I just want to build something people actually use.", why: "" }], unchanged: false }, "added word"], // v1: added word
  ["bad: added now, no time in draft", "So basically we're at $1.2M ARR with 11 people.", { versions: [{ line: "We're now at $1.2M ARR with 11 people.", why: "" }], unchanged: false }, "added word"], // v1: accept
  ["bad: dropped forecast hedge", "Just a quick reminder that 90% of altcoins went to zero last cycle and they will probably do it again.", { versions: [{ line: "90% of altcoins went to zero last cycle. They will do it again.", why: "" }], unchanged: false }, "stance"], // v1: stance
  ["bad: dropped pointer", "I moved to Lisbon 2 years ago knowing nobody. Here's what happened:", { versions: [{ line: "I moved to Lisbon 2 years ago knowing nobody.", why: "" }], unchanged: false }, "pointer"], // v1: accept
  ["bad: feeling weakened", "I just wanted to say that I'm really grateful for this community, you've honestly changed my life.", { versions: [{ line: "I'm grateful for this community. You've changed my life.", why: "" }], unchanged: false }, "meaning"], // v1: meaning
  ["bad: emoji added", "So basically we hit $10k MRR today.", { versions: [{ line: "We hit $10k MRR today 🚀", why: "" }], unchanged: false }, "broken"], // v1: broken
  ["bad: number changed", "90% of altcoins went to zero last cycle.", { versions: [{ line: "99% of altcoins went to zero last cycle.", why: "" }], unchanged: false }, "fact lost"], // v1: fact lost
  ["bad: most without licence", "A lot of retail traders are just gambling.", { versions: [{ line: "Most retail traders are just gambling.", why: "" }], unchanged: false }, "claim added"], // v1: claim added
  ["bad: so as intensifier", "i'm tired of everyone pretending they have it all figured out tbh", { versions: [{ line: "i'm so tired of everyone pretending they have it all figured out", why: "" }], unchanged: false }, "added word"], // v1: accept
  ["bad: casing", "honestly i think most people overthink it", { versions: [{ line: "Most people overthink it", why: "" }], unchanged: false }, "casing"], // v1: casing
  ["bad: dangling", "After coaching over 400 busy parents I can honestly tell you that the people who get results never miss.", { versions: [{ line: "After coaching over 400 busy parents, the people who get results never miss.", why: "" }], unchanged: false }, "dangling"], // v1: accept
  ["bad: reveal collapsed", "The habit that changed my mornings the most is simple: no phone before 9am.", { versions: [{ line: "No phone before 9am is the habit that changed my mornings the most.", why: "" }], unchanged: false }, "reveal"], // v1: accept
  ["bad: frame noun lost", "New video is up! I basically break down my entire morning routine step by step 👉 youtu.be/abc123", { versions: [{ line: "I break down my entire morning routine step by step 👉 youtu.be/abc123", why: "" }], unchanged: false }, "frame"], // v1: accept
  ["bad: TIL dropped", "TIL that you can actually use `git worktree` to work on multiple branches at the same time without stashing.", { versions: [{ line: "You can use `git worktree` to work on multiple branches at the same time without stashing.", why: "" }], unchanged: false }, "voice"], // v1: accept
  ["bad: lol dropped", "#100DaysOfCode Day 1: I really just set up my dev environment and honestly that took the whole day lol", { versions: [{ line: "#100DaysOfCode Day 1: I just set up my dev environment and that took the whole day.", why: "" }], unchanged: false }, "voice"], // v1: accept
  ["bad: unchanged on padded line", "So basically BTC just reclaimed the 200 week MA and I think most people are sleeping on it.", { versions: [{ line: "So basically BTC just reclaimed the 200 week MA and I think most people are sleeping on it.", why: "“So basically” stays: it’s your voice." }], unchanged: true }, "unchanged"], // v1: unchanged
  ["bad: unchanged vouch on honest", "Honestly, the best workout program is just the one that you will actually stick to.", { versions: [{ line: "Honestly, the best workout program is just the one that you will actually stick to.", why: "“Honestly” stays: it’s your tone, and “actually” is the point." }], unchanged: true }, "unchanged"], // v1: unchanged
  ["bad: AI verb dropped w/o swap", "Here's how we help B2B brands leverage LinkedIn to supercharge their pipeline and unlock seamless growth.", { versions: [{ line: "Here's how we help B2B brands with LinkedIn and their pipeline.", why: "" }], unchanged: false }, "swap"], // v1: accept
  ["bad: too long", "We raised a $2.5M seed round led by @a16z.", { versions: [{ line: "We raised a $2.5M seed round, led by @a16z, so here is why.", why: "" }], unchanged: false }, "longer"], // v1: longer
  ["bad: kind of okay lost", "So I basically got laid off this morning along with 200 other people, and honestly I'm kind of okay with it.", { versions: [{ line: "I got laid off this morning along with 200 other people. I'm okay with it.", why: "" }], unchanged: false }, "meaning"], // v1: meaning
  ["bad: tense certain", "I think we might start charging next month.", { versions: [{ line: "We started charging this month.", why: "" }], unchanged: false }, "tense"], // v1: tense
  ["bad: added negation", "Most junior devs should read other people's code rather than building todo apps.", { versions: [{ line: "Most junior devs should read other people's code. Not build todo apps.", why: "" }], unchanged: false }, "meaning"], // v1: meaning
  ["bad: body fact moved up", "Big news today, honestly.\nWe raised $4M from @sequoia.", { versions: [{ line: "Big news today: $4M from @sequoia.", why: "" }], unchanged: false }, "longer"], // v1: longer
  ["good: cliche-swap licensed", "I wanted to share a few of the things that actually moved the needle for our newsletter.", { versions: [{ line: "A few of the things that actually worked for our newsletter:", why: "" }], unchanged: false }, "accept"], // v1: added word
  ["good: vast majority -> most (licensed)", "The vast majority of retail traders are basically just gambling.", { versions: [{ line: "Most retail traders are just gambling.", why: "" }], unchanged: false }, "accept"], // v1: claim added
  ["good: meta future to pointer", "I've lost 30 lbs in the last 4 months without giving up carbs, and I'm going to explain exactly how I did it in this thread", { versions: [{ line: "I've lost 30 lbs in the last 4 months without giving up carbs. Here's exactly how:", why: "" }], unchanged: false }, "accept"], // v1: tense
  ["good: contraction-blind guard", "Unpopular opinion: staking yields are not really 'yield', they're basically just dilution with extra steps.", { versions: [{ line: "Staking yields aren't really 'yield'. They're just dilution with extra steps.", why: "" }], unchanged: false }, "accept"], // v1: meaning
  ["good: stance core", "I'm not gonna lie, I really think that ETH/BTC bottomed this week. Here's why 🧵", { versions: [{ line: "I think ETH/BTC bottomed this week. Here's why 🧵", why: "" }], unchanged: false }, "accept"], // v1: stance
  ["good: label title fragment", "New post: Why every creator needs to own their email list (and what happens when you don't)", { versions: [{ line: "Why every creator needs to own their email list (and what happens when you don't)", why: "" }], unchanged: false }, "accept"], // v1: broken
  ["good: doubled intensifier w/o comma", "honestly i think $SOL is just getting started tbh, the chart looks really really bullish right now", { versions: [{ line: "i think $SOL is just getting started, the chart looks bullish right now", why: "" }], unchanged: false }, "accept"], // v1: meaning
  ["bad: doubled with comma kept", "Does anyone else feel like this market is just really, really boring right now?", { versions: [{ line: "Does anyone else feel like this market is boring right now?", why: "" }], unchanged: false }, "meaning"], // v1: meaning
  ["good: unchanged meaning words", "Very few people know you only have 30 days to file an 83(b).", { versions: [{ line: "Very few people know you only have 30 days to file an 83(b).", why: "Already sharp: it opens a gap, and “only” and 30 days are the point." }], unchanged: true }, "accept"], // v1: unchanged
  ["bad: honest question guard", "Honest question: why do so many founders think they need a co-founder?", { versions: [{ line: "Why do so many founders think they need a co-founder?", why: "" }], unchanged: false }, "feeling"], // v1: accept
  ["good: here's the thing is not a pointer", "So here's the thing. Most people don't fail because they lack talent. They fail because they quit too early.", { versions: [{ line: "Most people don't fail because they lack talent. They fail because they quit too early.", why: "" }], unchanged: false }, "accept"], // v1: accept
  ["good: reveal with run-up setup", "I wanted to take a moment to talk about something that I think doesn't get discussed enough in the newsletter world: deliverability.", { versions: [{ line: "Deliverability doesn't get discussed enough in the newsletter world.", why: "" }], unchanged: false }, "accept"], // v1: accept
  ["good: degree hedge under modal", "i've been really bullish on $ARB for a while now but i'm starting to think i might have been kind of wrong about it", { versions: [{ line: "i've been bullish on $ARB for a while now but i'm starting to think i might have been wrong about it", why: "" }], unchanged: false }, "accept"], // v1: stance
  ["bad: degree hedge, modal dropped too", "i've been really bullish on $ARB for a while now but i'm starting to think i might have been kind of wrong about it", { versions: [{ line: "i've been bullish on $ARB for a while now but i'm starting to think i was wrong about it", why: "" }], unchanged: false }, "stance"], // v1: stance
  ["good: v1 shape still works", "Unpopular opinion: you don't need a co-founder.", { versions: [{ line: "You don't need a co-founder.", why: "" }], unchanged: false }, "accept"], // v1: accept
  ["bad: longer by >4 chars", "Shipping beats planning.", { versions: [{ line: "Shipping beats planning, every single time.", why: "" }], unchanged: false }, "longer"], // v1: longer
  ["good: 'so' connective ok", "I think the halving is already priced in. Here's why 👇", { versions: [{ line: "The halving is already priced in. Here's why I think so 👇", why: "" }], unchanged: false }, "accept"], // v1: longer
  ["good: time word ok when draft has time", "Two years ago I had 200 followers, honestly. Today I have 40k.", { versions: [{ line: "Two years ago I had 200 followers. Now I have 40k.", why: "" }], unchanged: false }, "accept"], // v1: accept
  ["good: label word only before colon", "We cut our onboarding from 9 steps to 3, and honestly activation went from 31% to 58%.", { versions: [{ line: "We cut our onboarding from 9 steps to 3. The result: activation went from 31% to 58%.", why: "" }], unchanged: false }, "accept"], // v1: accept
  ["bad: label word not before colon", "We cut our onboarding from 9 steps to 3, and honestly activation went from 31% to 58%.", { versions: [{ line: "We cut our onboarding from 9 steps to 3, and the result was activation going from 31% to 58%.", why: "" }], unchanged: false }, "longer"], // v1: longer
```
Selection cases (prototype output in the comments):
```js
const t = 'Just a quick reminder that 90% of altcoins went to zero last cycle and they will probably do it again.';
// S1 first fails (hedge dropped), second passes → ships #2, alts = [#3], trace.rejects = ['stance','ok','ok'], pick = 1
F(t, { unchanged: false, versions: [{ line: '90% of altcoins went to zero last cycle. They will do it again.' }, { line: '90% of altcoins went to zero last cycle. They will probably do it again.' }, { line: '90% of altcoins went to zero last cycle, and they will probably do it again.' }] })
// S2 none pass → null, trace.reject = 'stance', trace.rejects = ['stance', 'fact lost'] → the server shows sharpenLine()
F(t, { unchanged: false, versions: [{ line: '90% of altcoins went to zero. They will do it again.' }, { line: 'Every altcoin went to zero last cycle.' }] })
// S3 unchanged: true but versions[0].line differs from the draft → 'shape'
// S4 versions: [] → 'shape'
// S5 four versions → only the first three are read (the 4th, valid, is ignored) → null, 'fact lost'
// S6 two identical passing versions → alts: []
// S7 a version equal to the draft is skipped ('same'), the next passes → pick = 1
// S8 'gm', unchanged → { state: 'thin', line: 'gm' }, not null
// S9 v1 shape { line, why, unchanged } still works
```
Plus the repo's existing 45 rows: same verdicts under v2 (`_work/regress.js`).

## 9. Known gaps (deliberately not fixed)
- **Mock PSA** (r3-80, "Just a friendly reminder that `rm -rf /`…"): the frame is the joke, but it's a `label` mark, and nothing deterministic tells it apart from r4-18's "Just a friendly reminder:", which the judges were happy to see cut. The engine's line ships, as in v1 (o).
- **Typos** (r4-106, "Honestly is the most underrated trait"): v2 flags it in why but leaves the line. Accepting a changed word would need a dictionary and an edit-distance rule that slang ("wen", "ser") must survive. Not worth it for 1 in 297.
- **Reveal order** (r3-147, "I'm literally shaking right now. We got into YC." swapped): left to the prompt. Swapping two sentences is sometimes the best edit (r3-99, judged "Great reorder").
- **Recency "just"** (r4-66, "I just spent 6 hours"): left to the prompt. The judges called dropping a recency "just" neutral 3 times out of 4 (r4-43, r4-81, r3-48).
- **Timidity** (the 26 accepted o's): prompt-level. The validator can't tell "kept the comma splice" from "kept the writer's punctuation".

## 10. Engine-side follow-ups (optional; they help the rules fallback, not Claude)
The rules engine is still the fallback for every rejected answer, so these matter. Each fixes a rules output the judges graded o/m:
- Add the §4.2 guards to `slGuard` (r4-103, r3-143, r3-150, r4-94, r4-109).
- §3.3's doubled-intensifier split (r4-0).
- Keep a closing "lol"/"lmao" after a result (r4-74, r3-12 graded m when the engine cut it).
- CLICHE_W in `sharpenLine`'s swap pass.

## 11. What to log per call (for the owner's eval)
`trace.rejects` (one reason per version), `trace.pick`, `versions.length`, `unchanged`, and the `usage` output tokens. Three versions raise output tokens about 2.5×; watch p95 latency against `SHARPEN_TIMEOUT_MS` (6000 ms) at effort `low`. Alert on a rising share of `pick === null`: that means the prompt and the validator have drifted apart.
