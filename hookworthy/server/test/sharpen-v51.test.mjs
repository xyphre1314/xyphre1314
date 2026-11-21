/* v5.7 (page pass 22, founder-5): the engine adds no end stop and no contraction the writer didn't type, so expected lines here end as the draft ends and keep the draft's own "we are"/"I have". */
/* r86 v5.1: the on-device Sharpen after the round-14 page jury (engine items only: web-1, web-5, uiux-3, marketing-2).
   1. "I've been thinking a lot lately about X" (and "So I've been thinking…", "been thinking about this a lot") is a run-up:
      it goes, and the line leads with X, or with "Why X:"/"How X:" when X is a why/how topic the draft announced
   2. a filler word ("basically", "honestly", "just", "literally", …) is never in R.kept or in a "Kept “…”" note. One the engine
      leaves on purpose (an approximator before its value, a softener, a hedge) is "Left “…” in:", with the reason
   3. no plain claim becomes a dangling "How …:" teaser: a "how" that says "that" ("about how most founders ship too slowly")
      goes with its run-up, and the claim stands as a sentence
   4. "!" and "!!" stay the writer's; a run of three or more comes down to "!!", and the extra marks are struck and counted.
      A cut right before a comma strikes the comma too when the line lost it ("not gonna lie," as one strike) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const core = createRequire(import.meta.url)('../../core.js');
const here = path.dirname(fileURLToPath(import.meta.url));
const { rows } = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-heldout.json'), 'utf8'));
const S = (t, o) => core.sharpenLine(t, o), L = (t, o) => S(t, o).line;
/* the fixture's default-mode results, once for every test here */
let FX = null; const fx = () => FX || (FX = rows.map(r => ({ t: r.t, R: S(r.t) })));
const MODES = [['default', {}], ['v4.1', { hybrid: false }], ['strict', { strict: true }]];
const versions = r => r.state === 'sharp' ? [r, ...(r.alts || [])] : [r];
/* this file's own reads, written apart from the engine */
const FILLER = /(?<![\p{L}'’])(?:basically|honestly|just|literally|actually|really|kind of|kinda|sort of|sorta|pretty much|totally|genuinely|truly|lowkey|low-key)(?![\p{L}'’])/iu;
const teaser = l => /^\P{L}*how\b[^:.!?]*:\s*$/iu.test(String(l));
const announced = d => /\b(?:about|on|into|share|sharing|explain|explaining|talk about|discuss|cover|covering|break(?:ing)? down|walk(?:ing)? (?:you )?through|show(?:ing)? you|tell(?:ing)? you|issue|newsletter|thread|post)[\s,:—–-]+how\b/i.test(d);
const struckView = (d, cut) => { let s = d; [...cut].sort((a, b) => b.at[0] - a.at[0]).forEach(c => { s = s.slice(0, c.at[0]) + s.slice(c.at[1]); }); return s; };
const commas = z => (String(z).match(/,/g) || []).length;

/* ---------------- 1. the "been thinking" run-up ---------------- */
test('v5.1 (1): "I\'ve been thinking a lot lately about X" is a run-up; the line leads with X or "Why/How X:"', () => {
  for (const [t, want] of [
    ["So I've been thinking a lot lately about how we price our product, and I think we got it wrong", 'How we price our product: I think we got it wrong'],
    ["I've been thinking a lot lately about why most side projects die, and I think it's because people build in private for way too long", "Why most side projects die: I think it's because people build in private for way too long"],
    ["I've been thinking a lot about why most startups fail", 'Why most startups fail:'],
    ['So I’ve been thinking… most founders ship too slowly', 'Most founders ship too slowly'],
    ["So I've been thinking... most founders ship too slowly", 'Most founders ship too slowly'],
    ['been thinking about this a lot. most founders ship too slowly', 'most founders ship too slowly'],
    ['been thinking about this a lot: most founders ship too slowly', 'most founders ship too slowly'],
    ["I've been thinking about this a lot — the best founders ship daily", 'The best founders ship daily'],
    /* v5.3 (step 5c): after a run-up that goes, on a line that is no forecast, its "I think" goes too */
    ["So I've been thinking about this a lot lately, and I think most founders ship too slowly", 'Most founders ship too slowly']
  ]) {
    const R = S(t); assert.equal(R.state, 'sharp', t); assert.equal(R.line, want, t);
    assert.doesNotMatch(R.line, /been thinking/i, t);
  }
  /* the stance the topic carried rides along, in every mode that sharpens */
  for (const [m, o] of MODES) for (const v of versions(S("So I've been thinking a lot lately about how we price our product, and I think we got it wrong", o))) assert.match(v.line, /\bI think we got it wrong\b/, `${m}: ${v.line}`);
  /* the run-up is struck whole, the "So" with it, and the receipt says so */
  const e = S('So I’ve been thinking… most founders ship too slowly');
  assert.deepEqual(e.cut.map(c => c.text), ['So', 'I’ve been thinking…']); assert.match(e.say, /^Cut 2 bits of fluff/);
});

/* ---------------- 2. a filler word is never "kept" ---------------- */
test('v5.1 (2): a filler word is never in R.kept or a "Kept" note; one left on purpose says why in plain words', () => {
  const nl = S('not gonna lie, I basically lost 30% on that trade');
  assert.equal(nl.line, 'I basically lost 30% on that trade'); /* v5.3 (Fable H9): the lowercase draft had no end stop */ assert.deepEqual(nl.kept, ['30%']);
  assert.equal(nl.note, 'Left “basically” in: it says nearly, not exactly.');
  const gm = S('gm, just wanted to say SOL is basically the only chain that matters');
  assert.deepEqual(gm.kept, ['SOL']); assert.equal(gm.note, 'Left “basically” in: it says nearly, not exactly.');
  assert.equal(S('after like 3 years i finally quit').note, 'Left “like” in: it says about, not exactly.');
  assert.equal(S('kind of nervous for my first powerlifting meet this weekend').why, 'Left “kind of” in: it’s how you feel, not filler.');
  /* the page's Kept row reads "Kept “…”" out of the note: none of it is ever a filler word. The stance stays "Kept your “i think”" */
  assert.match(S('i basically think btc tops at 120k this cycle').note, /^Kept your “i think”/);
  const KEPT = /Kept (?:your )?“([^”]+)”/g;
  for (const [i, { t, R: R0 }] of fx().entries()) for (const [m, o] of i < 200 ? MODES.slice(0, 2) : MODES.slice(0, 1)) {
    const R = m === 'default' ? R0 : S(t, o), r = { t };
    for (const k of R.kept) assert.doesNotMatch(k, FILLER, `${m}: ${r.t}: kept "${k}"`);
    for (const q of String(R.note).matchAll(KEPT)) assert.ok(!FILLER.test(q[1]) || /^(?:i|we) (?:feel like|think|believe)\b/i.test(q[1]), `${m}: ${r.t}: note "${R.note}"`);
  }
});

/* ---------------- 3. no dangling "How …:" teaser ---------------- */
test('v5.1 (3): a plain claim never becomes a "How …:" teaser; a how-topic the draft announced still may', () => {
  for (const [t, want] of [
    ["So I've been thinking a lot lately about how most founders actually ship too slowly", 'Most founders actually ship too slowly'],
    ['So I’ve been thinking a lot lately about how most founders hire too early', 'Most founders hire too early'],
    ["I've been thinking about how nobody reads past the first line", 'Nobody reads past the first line'],
    ['so i’ve been thinking a lot about how most traders never take profits', 'most traders never take profits'],
    ["Let's talk about how most founders don't talk to users", "Most founders don't talk to users"]
  ]) { const R = S(t); assert.equal(R.line, want, t); for (const [m, o] of MODES) for (const v of versions(S(t, o))) assert.ok(!teaser(v.line), `${m}: ${t} → ${v.line}`); }
  /* a manner "how" is a topic, and with an announcing "about" it stays the pointer */
  assert.equal(L("I've been thinking a lot about how we hire"), 'How we hire:');
  assert.equal(L('In this post I want to explain how we cut our churn in half'), 'How we cut our churn in half:');
  /* never from a draft that announced nothing */
  for (const t of ['Most founders ship too slowly', 'most founders actually ship too slowly', 'We price our product wrong and I think it shows', 'Founders hire too early, and it kills them']) for (const [m, o] of MODES) for (const v of versions(S(t, o))) assert.ok(!teaser(v.line), `${m}: ${t} → ${v.line}`);
  /* the held-out fixture: every "How …:" a version ends on came from a draft that announced the topic */
  for (const { t, R } of fx()) for (const v of versions(R)) if (teaser(v.line)) assert.ok(announced(t), `${t} → ${v.line}`);
});

/* ---------------- 4. "!!!" and the comma after a cut ---------------- */
test('v5.1 (4): three or more "!" come down to "!!"; "!" and "!!" stay', () => {
  for (const t of ['we shipped it!', 'we shipped it!!', 'gm!!', 'we hit 10k subs! thank you all!!']) assert.deepEqual(L(t).match(/!+/g), t.match(/!+/g), t);
  assert.equal(S('we shipped it!!').state, 'clean'); assert.equal(S('we shipped it!').state, 'clean');
  const w = S('we shipped it!!!!');
  assert.equal(w.state, 'sharp'); assert.equal(w.line, 'we shipped it!!'); assert.deepEqual(w.cut, [{ text: '!!', kind: 'punct', why: 'Two “!” say it. More reads as shouting.', at: [15, 17] }]);
  assert.equal(w.say, 'Cut 1 bit of fluff'); assert.deepEqual(w.marks, core.softMarks(w.draft)); assert.deepEqual(w.marks.map(m => m[3]), ['punct']);
  const a = S("I'm so excited to announce our new pricing page!!!");
  assert.equal(a.line, "I'm announcing our new pricing page!!"); assert.match(a.say, /^Cut 2 bits of fluff/);
  assert.ok(a.cut.some(c => c.kind === 'punct' && c.text === '!' && a.draft.slice(c.at[0], c.at[1]) === '!'));
  /* every strike is marked, every offset is on the draft as typed, and a put-back "!" keeps the writer's run */
  for (const t of ['WOW!!! we hit 10k subs. honestly, i can’t believe it!!!', 'honestly this is huge!!! we hit 10k', 'we did it honestly!!!', 'LFG!!!!! $SOL to 300']) {
    const R = S(t);
    assert.equal(R.state, 'sharp', t); assert.doesNotMatch(R.line, /!{3}/, t); assert.deepEqual(R.marks, core.softMarks(R.draft), t);
    for (const v of versions(R)) for (const c of v.cut) { assert.equal(R.draft.slice(c.at[0], c.at[1]), c.text, t); if (c.kind !== 'reshape') assert.ok(R.marks.some(m => c.at[0] < m[1] && c.at[1] > m[0]), `${t}: "${c.text}" struck but never marked`); }
    assert.doesNotMatch(struckView(R.draft, R.cut).replace(/\s+/g, ' '), /!{3}/, t);
  }
  assert.equal(L('we shipped it!!!!', { keep: ['!!'] }), 'we shipped it!!!!');
  assert.equal(S('honestly this is huge!!! we hit 10k').cut.find(c => /huge/.test(c.text)).text, 'this is huge!!!');
});

test('v5.1 (4, web-5): a cut right before a comma strikes the comma the line lost, never one it kept', () => {
  const nl = S('not gonna lie, I basically lost 30% on that trade');
  assert.deepEqual(nl.cut.map(c => [c.text, c.at]), [['not gonna lie,', [0, 14]]]);
  assert.equal(S('Honestly, I think most founders ship too slowly').cut[0].text, 'Honestly,');
  assert.equal(S('gm, honestly, SOL is the only chain that matters').cut[0].text, 'honestly,');
  /* the put-back word comes back as the writer wrote it, with or without its comma */
  for (const k of ['not gonna lie,', 'not gonna lie']) assert.equal(L('not gonna lie, I basically lost 30% on that trade', { keep: [k] }), 'not gonna lie, I basically lost 30% on that trade', k);
  /* the held-out fixture and the round-14 lines: what is left once the strikes are out never has fewer commas than the line */
  for (const { t, R } of [...fx(), ...['not gonna lie, I basically lost 30% on that trade', 'gm, honestly, SOL is the only chain that matters'].map(t => ({ t, R: S(t) }))]) {
    if (R.state !== 'sharp') continue;
    for (const v of versions(R)) assert.ok(commas(struckView(R.draft, v.cut)) >= commas(v.line), `${t} → ${v.line}: a kept comma was struck`);
  }
});
