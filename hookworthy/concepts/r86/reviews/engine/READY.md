# Sharpen engine r86: READY

The API is in `/home/user/xyphre1314/hookworthy/core.js`, and its shape is the one the brief fixed. The app's one-tap paths in index.html (hookUpFor/hookUpPack and hgSharpen) now call it. Site and app give the same first line on 552 of 552 test lines.

## Call it

```js
const R = HWCore.sharpenLine(text, { keep = [], more } = {});   // also HWCore.SHARPEN.sharpenLine
HWCore.SHARPEN.warm();   // optional: call once when the page is idle (see Speed)
```

- `text`: what the visitor typed. The first line is sharpened. Everything after the first `\n` passes through untouched.
- `keep`: words this voice keeps (e.g. `['ngl']` after "Put it back"). They're never cut, marked or moved.
- `more`: whether more of the post follows. Defaults to `!!rest.trim()`. When true, a list header keeps its colon and a "Here's why:" loop is allowed.
- `pref` (app only): the voice memory's move nudges.

## Result

```
{
  state: 'empty' | 'thin' | 'sharp' | 'clean' | 'unsure',
  draft: string,   // first line as given (leading blank lines and trailing spaces trimmed)
  line:  string,   // sharpened first line; === draft unless state === 'sharp'
  rest:  string,   // everything after the first line, unchanged (text === draft + '\n' + rest)
  cut:   [{ text, kind, why, at: [start, end] }],   // words really gone, in draft order; at = offsets in draft
  marks: [[start, end, why, kind]],                 // softMarks(draft, keep), for the squiggle; [] when empty/thin
  move:  string,   // '' or a move key (list below)
  say:   string,   // receipt: "Cut the warm-up · Led with the result", "Cut 2 hedges", "Nothing to cut", "Kept as written"
  why:   string,   // one sentence, true for this edit, ≤ 140 chars
  kept:  [string], // facts carried over verbatim: numbers, $amounts, %, $tickers, @handles, #tags, names
  alts:  [{ line, say, why, move, moves, cut }],    // ≤ 2, each a different move, each passing every guard
  long:  boolean,  // xLength(line + '\n' + rest) > 280
  note:  string,   // '' | stance note | "Over 280 for one X post. Hookworthy can split it into a thread." (or both)
  // only when sharp: moves (raw engine moves), score: { from, to }
}
```

### States
- **empty**: no text.
- **thin**: gibberish, or fewer than 3 distinct real words.
  - Tickers, numbers, $ and % count as words, and a leading gm/gn/wagmi doesn't count.
  - So "$BTC 100k eoy?" is not thin, but "test test 123", "asdf jkl", "gm" and "lol" are.
  - `marks` is [].
- **sharp**: the words changed. A full stop, a capital or a "!!" alone is never a sharpen.
- **clean**: nothing is flagged, and no safe move makes the line stronger.
  - `say` is "Nothing to cut".
  - `why` is "Already sharp. Nothing soft to cut." only when hookScore ≥ 70. Otherwise it's "Nothing soft to cut, and no safe move makes it stronger."
- **unsure**: soft words are flagged, but cutting them would change the meaning or not help ("That's pretty much it.", "Just ship it.").
  - The line stays as written; show the marks as suggestions.
  - `say` is "Kept as written".
  - `why` names the first flagged word.

### Move keys (`move`, and HK_SAY in core)
- warm: Cut the warm-up.
- ask: Asked, then answered.
- number: Led with the number. Only used when a number really is in the first 3 words.
- result: Led with the result.
- active: Named who did it.
- payoff: Led with the payoff.
- moment: Opened on the moment.
- contrast: Split it into two beats. Only used when the line gained a sentence.
- straight: Said it straight.
- loop: Left a reason to read on.
- order: Put the payoff last.
- tight: Tightened it.
- **New in r86:**
  - lead: Led with the claim (claim first, caveat after).
  - ticker: Led with the ticker.

### `cut[].kind`
- **Fluff (list these):**
  - announce, label, disclaim, stock, throat, open, feel: the warm-ups.
  - opinion, hedge: the hedges.
  - honest, intens, filler, tail, likeNum: the filler.
  - bait.
  - wordy: "in order"; new in r86.
- **swap:** a never-say or wordy phrase said plainly. `why` names the replacement, e.g. "Said as “will”."
- **move:** small words a structural move dropped (the "and" in a split). Strike them if you like, but don't list them.
- **tight:** any other word that went.
- **What a cut never holds:**
  - Never a number, ticker, @, # or name. A version that would lose one is rejected.
  - Never a word that moved. The diff aligns words in order, then finds moved words, then reworded ones ("fails" → "fail"), with contractions opened first.
  - A soft-word mark is cut whole, or it moved.

## Guards inside core (site and app get the same ones)

| Guard | What it does |
|---|---|
| Facts | Every fact in the draft is in the line, verbatim. "p95", "iPhone", "eth" are never capitalised. |
| Meaning | Kept: "not just", "only just", "just can't", "is it just me", "just" = recently ("just reclaimed 68k"), "Just a laptop" (= only), "just by", "maybe I'm wrong", "maybe not", "probably nothing", "maybe the real…", "kind of a big deal", "really, really", contrast and skeptical-question "actually", "honestly?" as a beat, "I don't think X, I think Y", and every negation outside soft phrases. |
| Stance | On a price or market call (an asset plus a forecast verb, incl. "outperforms", "breaks 1.12", "pulls back to 110", "the bottom is probably in"), "i think", "imo", "i feel like", "probably" etc. stay. Follower counts and "2k who will buy" are not calls. |
| nfa | "nfa" on a call moves to the end ("… right now. nfa"). |
| Voice | A leading gm/gn/wagmi stays in front. Lowercase writers stay lowercase. 🧵 and 👇 stay. |
| Broken templates | Rejected: doubled punctuation, "::", a function word before a colon ("ETH will: 5k"), "will 5k", "Why do most X fails", a new capital mid-sentence, a dangling article, "??", one-word questions, verbless splits, dangling openers ("As a ghostwriter, the most…", "After spending 3 years…, the decision…"), and the "2026:" year template on a non-past clause. |
| Crisp lines | A clean sentence the writer punctuated (nothing soft, ≤ 16 words) doesn't get the reveal/invert question templates ("The best code I ever wrote was the code I deleted." stays). |

## Page migration
- **analyze() → `R = HWCore.sharpenLine(raw)`:**
  - thin/empty → the existing thin/empty UI.
  - sharp → show `R.line`; strike `R.cut` (use `at`), list the fluff kinds, and show "Kept: " + `R.kept.join(', ')` and `R.note`.
  - clean/unsure → show `R.draft` with `R.why`; for unsure, keep the marks visible as suggestions.
- **Retire on the page:** keepFor, HEDGES, VOICE, thin, removed() and the softCut fallback. Core does all of them now, with the stance guard and a fallback gated on score, meaning and facts.

## Speed
- Steady state over 552 lines: median 1.6 ms, p95 3.4 ms, max 14 ms.
- The first call after the script loads costs about 170 ms while V8 compiles the regexes. `HWCore.SHARPEN.warm()` pays that cost on idle.

## The numbers (graded by hand; tables in r86/engine/graded-*.json)

| Set | Before r86 | Now |
|---|---|---|
| heldout.json (juror's 132), site | 87 h / 16 o / 29 m (65.9%) | **129 h / 3 o / 0 m (97.7%)** |
| heldout.json, app | 89 h / 14 o / 29 m (67.4%) | **129 h / 3 o / 0 m**, identical first lines |
| fresh.json (mine, 60), first run | | 48 / 7 / 5 (80%) |
| fresh.json, after pattern fixes | | 59 / 1 / 0 (98.3%) |
| fresh2–5 (untouched rounds), first run | | 85%, 78%, 88%, **95%** |
| fresh2–5, after fixes | | 95%, 98%, 97%, 98% |
| In-sample 48 (sharpen-eval) | | 43 h (90%), 0 hard failures |

- Held-out meaning, fact and grammar misses: 0. Explanations are true on 132/132.

**Tests:** `cd server && npm test` → 121/121 pass. That includes the new `test/sharpen-heldout.test.mjs` with `test/fixtures/sharpen-heldout.json`. It checks:
- site == app == composer;
- the contract;
- no fact lost;
- no meaning flip;
- no broken template or never-say word;
- the stance kept on calls;
- why/say true;
- at least 90% of lines are the exact line graded h;
- median under 20 ms.
