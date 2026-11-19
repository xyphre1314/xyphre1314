/* r86 v5.0: the on-device Sharpen after the round-13 P0 report (padding between the pronoun and the stance verb hid the stance)
   and the round-13 jurors (engine items only).
   1. P0: every stance read (stanceKeep, slPolicy, the opinion and hedge patterns, slHard's own reads) sees through any run of
      padding between "I"/"we" and the stance verb, comma'd or not ("honestly i basically just think eth is going to 5k lol" →
      "i think eth is going to 5k lol"). The padding goes; the stance stays
   2. slHard refuses, in every mode, a version that drops a first-person stance verb the draft had on a prediction, a call or a
      plan; a reshape that drops a stance word names it in the why ("Also dropped “i think”")
   3. "breaks" only when slHard refused that very cut and no other version stands ("i basically think btc tops at 120k this
      cycle" → "i think btc tops at 120k this cycle.", never "without it this line breaks")
   4. the stance cross-product: 5 run-ups × 20 paddings × 5 verbs × 8 claims = 4,000 lines (and a "we" sweep), read by slHard and
      by this file's own reads (written apart from the engine)
   5. round 13: "So I was thinking about it and…" goes whole; a hedged "unpopular opinion but" frame stays and its "really" goes;
      "honestly" goes wherever it is the honesty marker and stays where it says how ("I answered honestly"); the spare "that"
      after a kept stance; "really need to"; a corporate run-up ("We are pleased to inform you that"); "In this week's
      newsletter, I break down…" → the header; a why quotes whole phrases; the default Try line names "you should" */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const core = createRequire(import.meta.url)('../../core.js');
const S = (t, o) => core.sharpenLine(t, o), L = (t, o) => S(t, o).line;
const D = core.SHARPEN._dbg, hard = D.hard;
const MODES = [['default', {}], ['v4.1', { hybrid: false }], ['strict', { strict: true }]];
const versions = r => r.state === 'sharp' ? [r.line, ...(r.alts || []).map(a => a.line)] : [r.line];

/* ---------------- this file's own reads, written apart from the engine (no engine function is used) ---------------- */
const nz = z => String(z).toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim();
const PADW = ['basically', 'just', 'really', 'honestly', 'genuinely', 'kinda', 'kind of', 'sort of', 'sorta', 'literally', 'actually', 'low-key', 'lowkey', 'personally', 'truly', 'frankly', 'seriously', 'legit', 'totally', 'definitely'];
const rxE = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/* the pronoun and the verb are both still there, with at most three words between them */
const stanceKept = (l, pr, v) => new RegExp(`(?:^|[^a-z'])${pr}(?:,? [a-z'-]+){0,3},? ${rxE(v)}\\b`).test(nz(l));
/* a padding word left between them */
const padLeft = (l, pr, v) => { const m = nz(l).match(new RegExp(`(?:^|[^a-z'])${pr},? ((?:[a-z'-]+,? ){0,4})${rxE(v.split(' ')[0])}\\b`)); return !!m && PADW.some(w => new RegExp(`(?:^|\\s)${rxE(w)}(?:,|\\s|$)`).test(m[1])); };
/* what is wrong with a version that its draft doesn't have: stray punctuation, a comma between the pronoun and its verb, a lost
   number or ticker, a lowercase "i" made a capital mid-line, or the claim's words out of order */
function own(l, d) {
  const o = [], P = /\s{2,}|\s[,.!?;:]|,\s*[,.!?]|^[\s,.;:!?-]|[,;:]$/;
  if (P.test(l) && !P.test(d)) o.push('punctuation');
  const C = /\b(?:i|we),\s+(?:think|believe|feel|reckon|bet|expect|guess)\b/i; if (C.test(l) && !C.test(d)) o.push('comma before the verb');
  for (const n of String(d).match(/\$?[A-Za-z]*\d[\d,.]*[kKmMxX%]?/g) || []) if (!l.includes(n.replace(/[.,]$/, ''))) o.push(`lost ${n}`);
  for (const t of String(d).match(/\$[A-Za-z]{2,10}\b/g) || []) if (!l.includes(t)) o.push(`lost ${t}`);
  return o;
}
/* every word of the draft that is not in the line is in the receipt's struck words */
const struck = (r, d, l) => { const lw = new Set(nz(l).match(/[a-z0-9'$-]+/g) || []), cw = new Set(r.cut.flatMap(c => nz(c.text).match(/[a-z0-9'$-]+/g) || [])); return (nz(d).match(/[a-z0-9'$-]+/g) || []).filter(w => !lw.has(w) && !cw.has(w)); };

/* ---------------- 1. P0 ---------------- */
test('v5.0 P0: padding between the pronoun and the stance verb goes, and the stance stays', () => {
  for (const [t, want] of [
    ['honestly i basically just think eth is going to 5k lol', 'i think eth is going to 5k lol'],
    ['i basically think btc tops at 120k this cycle', 'i think btc tops at 120k this cycle'],
    ['i really just think sol flips eth', 'i think sol flips eth'],
    ['honestly, i really, just think eth is going to 5k', 'i think eth is going to 5k'],
    ['i, basically, think eth is going to 5k', 'i think eth is going to 5k'],
    ['i lowkey think eth is going to 5k', 'i think eth is going to 5k'],
    ['i literally believe eth is going to 5k', 'i believe eth is going to 5k'],
    ['honestly i kinda bet eth is going to 5k lol', 'i bet eth is going to 5k lol'],
    ['honestly i sort of feel like the fed cuts rates in september', 'i feel like the fed cuts rates in september'],
    ['we basically, honestly expect revenue to double next year', 'we expect revenue to double next year'],
    ['i still really think eth goes to 5k', 'i still think eth goes to 5k'],
    ['honestly i actually think eth goes to 5k', 'i think eth goes to 5k'],
  ]) { const r = S(t); assert.equal(r.state, 'sharp', t); assert.equal(r.line, want, t); assert.ok(!r.cut.some(c => c.kind === 'reshape' && /think|believe|feel|bet|expect|\bi\b|\bwe\b/i.test(c.text)), `${t}: ${JSON.stringify(r.cut)}`); }
  /* the receipt names every padding word that went, and the kept stance as it now reads */
  { const r = S('honestly i basically just think eth is going to 5k lol'); assert.deepEqual(r.cut.map(c => c.text), ['honestly', 'basically just']); assert.match(r.why, /“honestly” and “basically just”/); assert.match(r.note, /Kept your “i think”: on a prediction/); }
  { const r = S('i basically think btc tops at 120k this cycle'); assert.doesNotMatch(r.why, /breaks/); assert.match(r.note, /Kept your “i think”/); }
  /* the control and the bare stance are as before */
  assert.equal(S('i think btc tops at 120k this cycle').state, 'clean');
  /* an "actually" a contrast sets up is meaning, and stays */
  for (const t of ['most people say sell but i actually think eth goes to 5k', 'i actually think the 4 year cycle is dead and nobody wants to admit it'])
    assert.match(L(t), /\bactually think\b/, t);
  /* the stance reads see through the padding */
  assert.deepEqual(core.SHARPEN.stanceKeep('i basically just think eth is going to 5k lol'), ['i basically just think']);
  assert.deepEqual(core.SHARPEN.stanceKeep('honestly, i really, just think eth is going to 5k'), ['i really, just think']);
});

/* ---------------- 2. the hard guard and the receipt ---------------- */
test('v5.0 slHard: a version that drops a first-person stance verb on a prediction, a call or a plan is refused', () => {
  for (const [l, d] of [
    ['eth is going to 5k lol', 'honestly i basically just think eth is going to 5k lol'],
    ['btc tops at 120k this cycle.', 'i basically think btc tops at 120k this cycle'],
    ['revenue doubles next year.', 'we really expect revenue to double next year'],
    ['sol flips eth.', 'i bet sol flips eth'],
    ['eth hits 5k.', 'i don’t think eth hits 5k'],
    ['i think eth hits 5k.', 'i don’t think eth hits 5k'],
    ['we ship the new pricing page next week.', 'i reckon we ship the new pricing page next week'],
  ]) assert.equal(hard(l, d), 'stance verb dropped', `${d} → ${l}`);
  for (const [l, d] of [
    ['i think eth is going to 5k lol', 'honestly i basically just think eth is going to 5k lol'],
    ['i don’t think eth hits 5k.', 'i don’t really think eth hits 5k'],
    ['we expect revenue to double next year.', 'we basically expect revenue to double next year'],
  ]) assert.equal(hard(l, d), '', `${d} → ${l}`);
  /* a stance that is not on a call or a plan is the one-hedge rule's ("kept word dropped"), as before */
  assert.equal(hard('most people overtrade', 'i basically think most people overtrade'), 'kept word dropped');
  /* no mode ships the flat call */
  for (const t of ['honestly i basically just think eth is going to 5k lol', 'i basically think btc tops at 120k this cycle', 'so i literally just believe sol flips eth by march'])
    for (const [m, o] of MODES) for (const l of versions(S(t, o))) assert.ok(stanceKept(l, 'i', t.match(/think|believe/)[0]), `${m}: ${t} → ${l}`);
  /* a reshape that drops a stance word says so in the why, never only in the strikes */
  { const d = 'honestly i basically just think eth is going to 5k lol', E = D.explain(d, 'eth is going to 5k lol', ['tight'], core.softMarks(d)); assert.match(E.why, /Also dropped “i think”\.$/); }
  { const d = 'i think we should raise prices next month', E = D.explain(d, 'we should raise prices next month.', ['tight'], core.softMarks(d)); assert.match(E.why, /Also dropped “i think”\.$/); }
});

/* ---------------- 3. the cross-product ---------------- */
const PRE = ['', 'honestly', 'ngl', 'tbh', 'so'];
const PAD1 = ['basically', 'just', 'really', 'honestly', 'genuinely', 'kinda', 'sort of', 'literally', 'actually', 'low-key', 'personally'];
const PAD2 = ['basically just', 'really just', 'just really', 'honestly, basically', 'literally just', 'actually, genuinely', 'low-key kinda', 'personally really'];
const PADS = ['', ...PAD1, ...PAD2], VERBS = ['think', 'believe', 'feel like', 'reckon', 'bet'];
const CLAIMS = ['eth is going to 5k lol', 'btc tops at 120k this cycle', 'sol flips eth by march', 'the fed cuts rates in september', 'rates stay higher for longer this year', 'we ship the new pricing page next week', 'i’m going to quit my job in june', '$HYPE could 10x from here'];
const XS = []; { let k = 0; for (const p of PRE) for (const d of PADS) for (const v of VERBS) for (const cl of CLAIMS) { const lead = p ? (k % 3 === 0 ? `${p}, ` : `${p} `) : ''; XS.push({ k: k++, t: `${lead}i ${d ? `${d} ` : ''}${v} ${cl}`, pr: 'i', v, d, p, cl }); } }
/* and "we", on the first four claims, after no run-up and after "honestly" */
for (const p of ['', 'honestly']) for (const d of PADS) for (const v of VERBS) for (const cl of CLAIMS.slice(0, 4)) XS.push({ k: XS.length, t: `${p ? `${p} ` : ''}we ${d ? `${d} ` : ''}${v} ${cl}`, pr: 'we', v, d, p, cl });
/* the line it should be: the stance and the claim, with every run-up and padding word gone ("i'm going to" may be said "i'll") */
const wantOf = x => { const b = `${x.pr} ${x.v} ${nz(x.cl)}`, o = [b, `${b}.`]; if (/i'm going to/.test(b)) o.push(...o.map(z => z.replace("i'm going to", "i'll"))); return o; };
test('v5.0 cross-product: 5 run-ups × 20 paddings × 5 verbs × 8 claims (and a "we" sweep): every version keeps the stance verb, none is broken', () => {
  assert.equal(XS.filter(x => x.pr === 'i').length, 4000);
  const bad = [];
  for (const x of XS) {
    const r = S(x.t), l = r.line;
    /* default mode: exactly the stance and the claim; the padding and the run-up are gone, and every word that went is struck */
    if (!wantOf(x).includes(nz(l))) bad.push(`line: ${x.t} → ${l}`);
    if (padLeft(l, x.pr, x.v)) bad.push(`padding left: ${x.t} → ${l}`);
    if (/breaks/.test(r.why)) bad.push(`breaks: ${x.t} → ${r.why}`);
    if (r.state === 'sharp') { const miss = struck(r, x.t, l); if (miss.length) bad.push(`not struck ${miss.join(' ')}: ${x.t}`); }
    /* the padding and the honesty words are named in the why */
    for (const c of r.cut) if (/^(?:honest|filler|intens|hedge)$/.test(c.kind) && !r.why.includes(`“${c.text.replace(/[,:;.!—-]+$/, '').trim()}”`)) bad.push(`why misses “${c.text}”: ${x.t} → ${r.why}`);
    /* every version, in every mode on a stride, and with each cut put back on a stride */
    const R = [['default', r]]; if (x.k % 4 === 0) R.push(['v4.1', S(x.t, MODES[1][1])], ['strict', S(x.t, MODES[2][1])]);
    if (x.k % 9 === 0) for (const c of r.cut.slice(0, 3)) R.push([`keep ${c.text}`, S(x.t, { keep: [c.text] })]);
    for (const [m, rr] of R) for (const v of versions(rr)) {
      if (!stanceKept(v, x.pr, x.v)) bad.push(`${m} stance lost: ${x.t} → ${v}`);
      if (v !== rr.draft) { const h = hard(v, rr.draft); if (h) bad.push(`${m} hard ${h}: ${x.t} → ${v}`); for (const f of own(v, rr.draft)) bad.push(`${m} ${f}: ${x.t} → ${v}`); }
    }
  }
  if (bad.length) console.log(bad.slice(0, 60).join('\n'));
  assert.equal(bad.length, 0, `problems: ${bad.length}`);
});

/* ---------------- 4. "breaks" is true or absent ---------------- */
test('v5.0 a "breaks" note only where slHard refused that cut and nothing else stands', () => {
  for (const d of PAD1) for (const cl of CLAIMS) { const r = S(`i ${d} think ${cl}`); assert.equal(r.state, 'sharp', `i ${d} think ${cl}`); assert.doesNotMatch(r.why, /breaks/); }
  /* where it is said, slHard refused that word's own cut */
  for (const t of ["I've been thinking a lot lately about how hard it is to build in public", 'Let me tell you the books I read changed my life']) {
    const r = S(t); if (!/breaks/.test(r.why)) continue; const w = r.why.match(/Marked “([^”]+)”/)[1], l = t.replace(w, '').replace(/\s+/g, ' ').trim(); assert.ok(hard(l.charAt(0).toUpperCase() + l.slice(1), t) || hard(`${l}.`, t), t);
  }
});

/* ---------------- 5. round 13 ---------------- */
test('v5.0 round 13: a "thinking about it" run-up goes whole, and never stays as its own sentence', () => {
  for (const [t, want] of [
    ['So I was thinking about it and I realized that most launches fail because of the first tweet', 'Most launches fail because of the first tweet.'],
    ['I was thinking about it and most launches fail because of the first tweet', 'Most launches fail because of the first tweet.'],
    ['Was thinking about this last night and I realized most launches fail because of the first tweet', 'Most launches fail because of the first tweet.'],
    ['I was thinking about it, and honestly most launches fail because of the first tweet', 'Most launches fail because of the first tweet.'],
    ['I was thinking about it. Most launches fail because of the first tweet.', 'Most launches fail because of the first tweet.'],
    ['so i was thinking the other day and i realised most people overtrade', 'most people overtrade'],
    ["So I've been thinking, and I think we should all just stop chasing vanity metrics.", 'I think we should all stop chasing vanity metrics.'],
    ['So I was thinking about it and I think we should raise prices next month', 'I think we should raise prices next month.'],
  ]) { const r = S(t); assert.equal(r.line, want, t); for (const [m, o] of MODES) for (const l of versions(S(t, o))) assert.doesNotMatch(l, /\bthinking\b/i, `${m}: ${t} → ${l}`); }
  /* "thinking that…" is the stance, and a topic after "about" is the line's content */
  assert.equal(S('I was thinking that we should raise prices').line, 'I was thinking that we should raise prices');
  assert.match(L('I was thinking about pricing and we were undercharging'), /thinking about pricing/);
  /* "…because of X" is never asked as "Why…? Of X." */
  for (const t of ['So I was thinking about it and I realized that most launches fail because of the first tweet', 'most launches fail because of the first tweet'])
    for (const r of MODES.map(([, o]) => S(t, o))) for (const l of versions(r)) assert.doesNotMatch(l, /\?\s+Of\b/, l);
});

test('v5.0 round 13: a hedged "unpopular opinion but" frame stays, its stance stays, and the padding goes', () => {
  assert.equal(L('This might be an unpopular opinion but I really think that most newsletters are too long'), 'This might be an unpopular opinion but I think most newsletters are too long.');
  assert.equal(L('Unpopular opinion but I genuinely believe that cold email still works in 2026'), 'Unpopular opinion but I believe cold email still works in 2026.');
  /* a frame up front still says what it does */
  assert.equal(S('This might be an unpopular opinion, but DCA beats trading for most people').why, 'Your frame sets it up.');
});

test('v5.0 round 13: "honestly" goes wherever it is the honesty marker, and stays where it says how', () => {
  for (const t of ['gm. honestly feeling pretty bullish on sol right now ngl', 'honestly i think most people overtrade', 'i honestly can’t believe btc is at 98k', 'we hit 1k subs and honestly it feels unreal',
    'it’s honestly the best tool i’ve used this year', 'honestly, nobody reads past the first line', 'i’m long eth and honestly not worried', 'building in public is honestly the best marketing', 'honestly feeling pretty good about this launch', 'gm frens, honestly bullish on sol'])
    { const r = S(t); assert.equal(r.state, 'sharp', t); assert.doesNotMatch(r.line, /honestly/i, t); }
  assert.equal(L('gm. honestly feeling pretty bullish on sol right now ngl'), 'gm. feeling pretty bullish on sol right now');
  for (const t of ['I answered honestly and lost the deal', 'we talk honestly about money here', 'Honestly? Best decision I ever made.']) assert.match(L(t), /honestly/i, t);
});

test('v5.0 round 13: the spare "that" after a kept stance goes; "really need to" loses its "really"', () => {
  for (const [t, want] of [
    ['I think that most people overtrade', 'I think most people overtrade.'],
    ['I believe that cold email is dead', 'I believe cold email is dead.'],
    ['I think that BTC is probably going to break 100k this week', 'I think BTC is probably going to break 100k this week.'],
    ['i think that maybe we should raise prices', 'i think we should raise prices'],
    ['I think that basically what I learned this year is that consistency beats talent every single time', 'I think what I learned this year is that consistency beats talent every single time.'],
    ['honestly i basically just think that eth is going to 5k', 'i think eth is going to 5k'],
    ['If you are a creator you really need to start writing better hooks', 'If you’re a creator, you need to start writing better hooks.'],
    ['I really need to ship this week', 'I need to ship this week.'],
  ]) assert.equal(L(t), want, t);
  /* "that" as the subject, before a condition or an aside, stays */
  for (const t of ['I think that is wrong', 'I think that if you post daily you grow', 'I think that in 2026, the companies that will win are the ones that are actually willing to say something interesting.']) assert.match(L(t), /\bthink that\b/, t);
  /* the receipt says what the "that" was */
  assert.match(S('I think that most people overtrade').why, /“that”/);
});

test('v5.0 round 13: corporate run-ups and an issue run-up before a noun-phrase topic go', () => {
  for (const [t, want] of [
    ['We are pleased to inform you that our Q3 results exceeded expectations', 'Our Q3 results exceeded expectations.'],
    ['We would like to inform you that pricing changes on May 1', 'Pricing changes on May 1.'],
    ["I'm writing to let you know that we moved offices", 'We moved offices.'],
    ["In this week's newsletter, I break down the 3 trades that made my month", 'The 3 trades that made my month:'],
    ['i basically just want to say that you should never ever trade on margin', 'never ever trade on margin'],
  ]) assert.equal(L(t), want, t);
});

test('v5.0 round 13: a why names the real edit and quotes whole phrases', () => {
  /* the default Try line: dropping "you should" is the edit, so the why says so (marketing-5) */
  assert.equal(S('so basically you should sell into strength, not into panic').why, 'Without “so”, “basically” and “you should”, it reads as your rule, not advice.');
  assert.equal(S('you should sell into strength, not into panic').why, 'Without “you should”, it reads as your rule, not advice.');
  assert.match(S('i basically just want to say that you should never ever trade on margin').why, /Also dropped “you should”\./);
  /* a kept word is quoted with its phrase, never a fragment (marketing-1: “just price”) */
  assert.equal(S('Unpopular opinion: most crypto newsletters are just price recaps').why, 'Kept “just price recaps”: here it’s part of what you mean, not filler.');
});
