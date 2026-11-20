/* v5.7 (Fable round 6, on-device): no subjectless reshape (H4), the words that carry meaning ("just" = only, "really" = in fact, "the
   vast majority", no "What changed:" on an experiment story: H5, H6, H12), the weak frames cut as families (H7), a long-post warning
   cut before the split (H8), whys that are true (H9), and the page-reported items (no end stop or contraction the writer didn't type,
   quotes that end at a phrase boundary, numbers that keep their exact form).
   Built from the round's own held-out lines (scratchpad engine/heldout57.json, copied to fixtures/sharpen-v57-heldout.json), never
   from a Fable line. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const C = require('../../core.js');
const S = C.SHARPEN, D = S._dbg, sl = (t, o) => C.sharpenLine(t, o || {});
const shipped = R => R.state === 'sharp' ? R.line : R.draft;
const posts = R => R.thread || [shipped(R)];
const xl = s => C.xLength(String(s));
const H = JSON.parse(readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures/sharpen-v57-heldout.json'), 'utf8'));
const by = s => H.filter(x => x.shape === s).map(x => x.t), T = id => H.find(x => x.id === id).t;
const RUNS = H.map(x => [x, sl(x.t)]);

test('v5.7 H4: no subjectless reshape; "we should probably all just admit" keeps its subject, and the guard says why', () => {
  for (const t of by('subj')) { const L = shipped(sl(t)); assert.doesNotMatch(L, /^\P{L}*(?:probably|maybe|perhaps|all|just)\b/iu, `${t} → ${L}`); assert.match(L, /\b(?:we|you|they|founders|i)\b/i, L); }
  for (const id of ['h7-0', 'h7-2', 'h7-7']) assert.match(shipped(sl(T(id))), /^We should probably all (?:stop|admit|take)\b/, id);
  assert.match(D.bad54('Probably all admit that nobody reads the terms of service.', T('h7-2')), /hedge and a bare verb|order the draft never gave/);
  assert.equal(D.bad54('We should probably all admit that nobody reads the terms of service.', T('h7-2')), '');
});

test('v5.7 H5/H6/H12: "just" meaning only, "really" meaning in fact and "the vast majority" stay; no "What changed:" on an experiment', () => {
  for (const [id, w] of [['h7-10', 'just one'], ['h7-11', 'just the top 3'], ['h7-12', 'just the checkout page'], ['h7-13', 'just 9 days'], ['h7-14', 'just the slowest query'], ['h7-16', 'just two people']]) assert.ok(shipped(sl(T(id))).includes(w), `${id}: ${w}`);
  assert.equal(shipped(sl(T('h7-15'))), 'I think you should stop posting every single day.');
  for (const id of ['h7-17', 'h7-18', 'h7-19', 'h7-20', 'h7-21', 'h7-65']) assert.match(shipped(sl(T(id))), /\breally (?:a|an|about)\b/, id);
  assert.equal(shipped(sl(T('h7-22'))), 'I really love this new feature and I think you should try it.');
  for (const t of by('quant').filter(t => /vast|overwhelming/i.test(t))) { const L = shipped(sl(t)); assert.match(L, /\bthe (?:vast|overwhelming) majority\b/i, L); assert.doesNotMatch(L, /^Most\b/, L); }
  for (const t of by('result')) assert.doesNotMatch(shipped(sl(t)), /What changed:/, t);
  assert.match(shipped(sl(T('h7-29'))), /^I ran a quick test where I posted at 7am instead of 7pm for a month\. My average impressions went from 2,000 to 9,500\.$/);
});

test('v5.7 H7: "It seems to me that", "The truth is that", "In my experience," and "To be perfectly honest" go as families', () => {
  const FR = /^\P{L}*(?:it seems to me|the (?:honest )?truth is|in my experience|from my experience|to be (?:perfectly|completely|totally )?honest)\b/iu;
  for (const t of by('runup').filter(t => FR.test(t))) { const R = sl(t); assert.equal(R.state, 'sharp', t); assert.doesNotMatch(R.line, FR, R.line); assert.ok(D.shipOK(R.line, t), R.line); }
  /* a forecast keeps its own hedge as the call; the frame stacked on it goes */
  const f = sl(T('h7-37')); assert.equal(f.line, 'Remote-first companies are probably going to win the hiring war this decade.'); assert.deepEqual(f.calls.map(c => c.text), ['probably']);
  /* the frame alone on a forecast is the writer's call, marked as one */
  const g = sl('It seems to me that AI will replace developers who refuse to use it.'); assert.equal(g.state, 'clean'); assert.deepEqual(g.calls.map(c => c.text), ['It seems to me that']);
  assert.equal(shipped(sl(T('h7-46'))), 'I don\'t think most landing pages need a video.');
});

test('v5.7 H8: a long-post warning goes before the split, and the note and the why agree', () => {
  const WARN = /^\P{L}*(?:ok(?:ay)?|so|bear with me|fair warning|this (?:is|might be) (?:going to be )?a)\b/iu;
  for (const t of by('long')) {
    const R = sl(t), P = posts(R);
    if (/long|bear with me|fair warning/i.test(t.slice(0, 60))) assert.doesNotMatch(P[0], WARN, P[0]);
    P.forEach(p => assert.ok(xl(p) <= 280, p));
    if (R.thread) assert.match(R.note, /opens a thread/);
    if (/stays one post/.test(R.why || '')) assert.doesNotMatch(R.note, /can split it/);
  }
  /* no split keeps every post whole: the note says so, never that it can split */
  const L = 'I wanted to explain everything, ' + 'and then some more words that keep going without any clause break at all '.repeat(4);
  const R = sl(L); if (!R.thread && xl(shipped(R)) > 280) assert.doesNotMatch(R.note, /can split it/);
});

test('v5.7 H9: the whys are true: no "already lands" on a marked line, "breaks" only when the cut really breaks, calls fit the word', () => {
  for (const [x, R] of RUNS) {
    if ((R.marks || []).length) assert.doesNotMatch(R.why || '', /already lands/, x.id);
    assert.ok(D.breakTrue(R.why, shipped(R), x.t), `${x.id}: ${R.why}`);
  }
  const b = sl(T('h7-61')); assert.ok(b.calls.some(c => c.text === 'Basically' && /nearly/.test(c.why)), JSON.stringify(b.calls));
  assert.equal(shipped(sl(T('h7-59'))), 'If you\'re thinking about switching to a four-day week, talk to your team first.');
  assert.equal(shipped(sl(T('h7-57'))), 'What I learned from running 3 failed marketplaces:');
  assert.equal(shipped(sl(T('h7-64'))), 'The three tools I use every single day:');
  assert.match(shipped(sl(T('h7-58'))), /^We recently doubled/);
});

test('v5.7 page: no end stop or contraction the writer didn\'t type, and a quote ends at a phrase boundary', () => {
  for (const t of by('page')) { const L = shipped(sl(t)); if (!/[.!?…]["”’)]*\s*$/.test(t)) assert.doesNotMatch(L, /[^.]\.$/, L); }
  for (const id of ['h7-70', 'h7-71', 'h7-74']) { const L = shipped(sl(T(id))); assert.match(L, /\bwe are\b/i, L); assert.doesNotMatch(L, /\bwe[’']re\b/i, L); }
  for (const id of ['h7-68', 'h7-69']) assert.doesNotMatch(sl(T(id)).why, /\bled”|“[^”]*\bled by\b/, id);
  assert.match(sl('Excited to announce we raised a $4M seed led by a16z!').why, /“We raised a \$4M seed”/);
});

test('v5.7 (lead): a number keeps its exact form, commas, points, $, % and k/M, through every cut, reshape and capital', () => {
  const NUM = /(?<![\p{L}\p{N}])[$€£]?\d[\d,.]*\d(?:\s?(?:%|k|K|M|B|x))?(?![\p{L}\p{N}])|(?<![\p{L}\p{N}.,])[$€£]?\d(?:\s?(?:%|k|K|M|B|x))?(?![\p{L}\p{N},.]\d)/gu;
  const toks = s => (String(s).match(NUM) || []).map(x => x.replace(/[.,]$/, ''));
  assert.equal(shipped(sl('honestly 20,000 subscribers in a year is wild')), '20,000 subscribers in a year is wild');
  assert.equal(shipped(sl('honestly $4,200 in MRR is not a lot')), '$4,200 in MRR is not a lot');
  assert.equal(shipped(sl('my newsletter hit 20,000 subscribers')), 'my newsletter hit 20,000 subscribers');
  const runs = ['honestly ', 'So basically ', 'Honestly, ', 'I think that ', 'Super excited to announce that '], nums = ['20,000', '$4,200', '3.5%', '$1.2M', '12.5k', '1,000,000'];
  const bodies = [n => `${n} subscribers in a year is wild`, n => `my newsletter hit ${n} subscribers`, n => `${n} people signed up last week and churn really dropped`];
  for (const r of runs) for (const n of nums) for (const b of bodies) {
    const t = r + b(n), R = sl(t), out = [shipped(R), ...(R.alts || []).map(a => a.line), ...(R.calls || []).map(c => c.line)], d = toks(t);
    for (const o of out) { assert.deepEqual(toks(o).filter(x => !d.includes(x)), [], `${t} → ${o}`); }
    assert.ok(toks(shipped(R)).includes(n), `${t} → ${shipped(R)}`);
  }
});

test('v5.7 held-out: 0 broken, every post within 280, no "?" or word the writer didn\'t type', () => {
  for (const [x, R] of RUNS) {
    const P = posts(R); P.forEach(p => assert.ok(xl(p) <= 280 || /Over 280/.test(R.note), `${x.id}: ${p}`));
    if (R.state === 'sharp') { assert.ok(D.shipOK(R.line, x.t), `${x.id}: ${R.line}`); assert.equal(D.bad54(R.line, x.t), '', `${x.id}: ${R.line}`); }
    assert.ok((shipped(R).match(/\?/g) || []).length <= (x.t.match(/\?/g) || []).length, x.id);
  }
});
