/* r86: Sharpen on first lines it was never tuned on (fixtures/sharpen-heldout.json: 132 lines a separate juror wrote in
   the way people really draft on X). Both paths run: HWCore.sharpenLine (what the homepage calls) and the composer's
   one tap, lifted out of index.html as it ships (hgSharpen and hookUpFor). The checks here are written independently of
   the engine's own guards, so a guard that quietly stops working shows up as a failure:
   1. the site and the app give the same first line
   2. no fact is lost: every number, $amount, %, ticker, @handle, #tag and name in the draft is in the line
   3. no meaning flip: negations, "not just", "only just", "just" = recently, "maybe I'm …", idioms
   4. no broken template: doubled punctuation, "::", "will:", "Why do most X fails", a new capital mid-sentence, a dangling article
   5. on a price call the writer's stance ("i think", "imo", "probably") is still there
   6. every "why" is true for the edit: the hedge sentence only when a hedge was cut, "number" only when a number leads
   7. the hand grades still hold: at least 90% of lines are the exact line graded h (a moved output needs grading again) */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const core = createRequire(import.meta.url)('../../core.js');
const { rows } = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-heldout.json'), 'utf8'));
const html = readFileSync(path.join(here, '../../index.html'), 'utf8');
const lift = (from, to) => { const a = html.indexOf(from), b = html.indexOf(to, a + 1); if (a < 0 || b < 0) throw new Error(`heldout: can't find ${from}`); return html.slice(a, b); };
/* the app's one-tap paths, as they ship; the composer reads no voice memory here (a fresh account) */
const src = [lift('function hookUpFor(', '\n/* one tap'), lift('const HG_DEFAULT', '\n/* word diff that ignores case')].join('\n');
const S = { ws: 'w', draft: { tweets: [] } }, UI = {}, MEM = { memKeepList: () => [], memPref: () => ({}) };
const firstLine = t => { const v = String(t || ''), n = v.indexOf('\n'); return n < 0 ? v : v.slice(0, n); };
const app = new Function('HWCore', 'hookScore', 'cap', 'S', 'UI', 'MEM', 'memFor', 'firstLine', 'hookFor', `${src}\nreturn { hgSharpen, hookUpFor };`)(core, core.hookScore, core.cap, S, UI, MEM, () => ({ n: 0 }), firstLine, t => ({ score: core.hookScore(t).score }));
const composer = t => { S.draft.tweets = [{ text: t }]; UI.hkC = null; const r = app.hookUpFor(t); return r ? r.line : null; };
const runs = rows.map(r => ({ ...r, R: core.sharpenLine(r.t), H: app.hgSharpen(r.t), C: composer(r.t) }));
const label = x => `#${rows.indexOf(rows.find(r => r.t === x.t)) + 1} ${JSON.stringify(x.t.split('\n')[0])} → ${JSON.stringify(x.R.line)}`;
const cnt = (s, re) => (String(s).match(re) || []).length;
const outside = (s, marks) => { let o = '', at = 0; marks.forEach(m => { o += s.slice(at, m[0]) + ' '; at = m[1]; }); return o + s.slice(at); };

test('held-out: the site and the app give the same first line', () => {
  const bad = runs.filter(x => (x.H ? x.H.first : x.R.draft) !== x.R.line || (x.C == null ? x.R.draft : x.C) !== x.R.line);
  assert.deepEqual(bad.map(label), []);
});

test('held-out: the result keeps its contract', () => {
  const STATES = ['empty', 'thin', 'sharp', 'clean', 'unsure'];
  for (const x of runs) {
    const R = x.R, at = label(x);
    assert.ok(STATES.includes(R.state), at);
    assert.equal(R.draft, x.t.split('\n')[0].trim(), at);
    assert.equal(R.rest, x.t.includes('\n') ? x.t.slice(x.t.indexOf('\n') + 1) : '', at);
    if (R.state !== 'sharp') assert.equal(R.line, R.draft, at); else assert.notEqual(R.line, R.draft, at);
    for (const k of ['cut', 'marks', 'kept', 'alts']) assert.ok(Array.isArray(R[k]), `${at}: ${k}`);
    for (const k of ['move', 'say', 'why', 'note']) assert.equal(typeof R[k], 'string', `${at}: ${k}`);
    assert.ok(R.why.length <= 140, `${at}: why is ${R.why.length} characters`);
    assert.equal(R.long, core.xLength(R.rest.trim() ? `${R.line}\n${R.rest}` : R.line) > 280, at);
    R.cut.forEach(c => { assert.equal(R.draft.slice(c.at[0], c.at[1]), c.text, at); assert.ok(c.kind && c.why, at); });
    if (R.state !== 'thin' && R.state !== 'empty') assert.deepEqual(R.marks, core.softMarks(R.draft), at);
    R.kept.forEach(k => assert.ok(R.line.includes(k), `${at}: kept "${k}" is not in the line`));
    assert.ok(R.alts.length <= 2, at); assert.equal(new Set(R.alts.map(a => a.move || 'soft')).size, R.alts.length, `${at}: two alts make the same move`);
    if (R.state === 'sharp') assert.ok(R.say && R.why, at);
  }
  /* the states the brief names */
  assert.equal(core.sharpenLine('').state, 'empty');
  assert.equal(core.sharpenLine('$BTC 100k eoy?').state === 'thin', false, 'tickers and numbers are words');
  for (const t of ['asdf jkl', 'lol', 'gm', 'test test 123']) assert.equal(core.sharpenLine(t).state, 'thin', t);
});

test('held-out: no fact is lost', () => {
  const STOPW = /^(?:I|The|A|An|It|My|We|Our|But|And|So|Here|This|That|Then|Just|Most|Your|You|Stop|Do|Why|How|What|When|If|In|On|At|For|To|Of|Or|No|Not|Day|Today|Year|Full|Same|Nothing|Then)$/;
  const facts = (t, marks) => {
    const s = outside(t, marks), out = [];
    out.push(...(s.match(/(?<![\w.])[$€£]?\d[\d,.:]*(?:[kKmMbB%x]\b|%)?/g) || []).map(v => v.replace(/[.,:]+$/, '')));
    out.push(...(s.match(/\$[A-Za-z]{2,10}\b|[@#][\w]+/g) || []));
    out.push(...(s.match(/\b(?:btc|eth|sol|BTC|ETH|SOL|xrp|doge)\b/g) || []));
    out.push(...(s.match(/(?<=[a-z0-9,;%)'’] )[A-Z][a-zA-Z0-9]+/g) || []).filter(w => !STOPW.test(w)));
    return [...new Set(out.filter(Boolean))];
  };
  const bad = [];
  for (const x of runs) { const lost = facts(x.R.draft, x.R.marks).filter(f => !x.R.line.includes(f)); if (lost.length) bad.push(`${label(x)}: lost ${lost.join(', ')}`); }
  assert.deepEqual(bad, []);
});

test('held-out: no meaning flip', () => {
  const NEG = /\b(?:not|never|no|nobody|none|nothing|cannot|nor)\b|n['’]t\b/gi;
  const KEEP = [/\bnot just\b/i, /\bonly just\b/i, /\bjust (?:can['’]?t|cannot|won['’]?t|don['’]?t)\b/i, /\bis it just me\b/i, /\bkind of a big deal\b/i, /\bpretty much it\b/i, /^just \w+ it\b/i, /\bjust in case\b/i, /\b(really|very),? \1\b/i, /\bprobably nothing\b/i, /\bmaybe (?:i|i['’]m|we|it|not)\b/i, /\bhonestly\?/i];
  const bad = [];
  for (const x of runs) {
    const R = x.R, d = R.draft, l = R.line, why = [];
    if (cnt(l, NEG) < cnt(outside(d, R.marks), NEG)) why.push('a negation went');
    KEEP.forEach(re => { if (re.test(d) && !re.test(l)) why.push(`lost ${re}`); });
    /* "just" = recently: if the verb is still there, so is the "just" in front of it */
    for (const m of d.matchAll(/\bjust (\w+ed|hit|got|made|won|lost|sold|bought|ran|flipped|crossed|launched|shipped|pushed|dropped|reclaimed)\b/gi)) if (new RegExp(`\\b${m[1]}\\b`, 'i').test(l) && !new RegExp(`\\bjust ${m[1]}\\b`, 'i').test(l)) why.push(`cut the "just" of "just ${m[1]}"`);
    if (why.length) bad.push(`${label(x)}: ${why.join('; ')}`);
  }
  assert.deepEqual(bad, []);
});

test('held-out: no broken template', () => {
  const BROKEN = [[/([,;:!?])\1/g, 'doubled punctuation'], [/(?<!\.)\.\.(?!\.)/g, 'doubled full stop'], [/::/g, '"::"'], [/\b(?:will|would|should|to|we|i|you|how|why|what)\s*:\s/gi, 'a function word before a colon'],
    [/\bwill\s+[$€£]?\d/gi, '"will" + a number'], [/\bwhy do (?:most |many |some |all |the )?\S+(?: \S+)? (?:fails|works|sells|gets|makes|goes|needs|wants|breaks|dies|loses|misses|stalls|churns|struggles|stops)\b/gi, '"Why do X fails"'],
    [/\b(?:a|an|the|and|but|or|because|my|our|your)\s*[.!?](?=\s|$)/gi, 'a sentence ending on an article'], [/\?\s*\?/g, '"??"']];
  const bad = [];
  for (const x of runs) {
    const d = x.R.draft, l = x.R.line, why = [];
    BROKEN.forEach(([re, w]) => { if (cnt(l, re) > cnt(d, re)) why.push(w); });
    /* a capital mid-sentence the writer didn't write */
    (l.match(/(?<=[\p{L}\p{N},;%)'’] )\p{Lu}[\p{L}’']*/gu) || []).filter(w => !/^I(?:['’]\w+)?$/.test(w) && !new RegExp(`(?<![\\p{L}])${w}(?![\\p{L}])`, 'u').test(d)).forEach(w => why.push(`new capital "${w}"`));
    /* a never-say word: never added, and never left in a sharpened line ("leverage" the trader's noun is a word, "leverage your data" is the never-say verb) */
    const NEVER = /\b(?:unlock\w*|supercharg\w*|elevat(?:e|es|ed|ing)|seamless\w*|game[- ]?changer|delv(?:e|es|ed|ing)|ai-powered)\b|\bleverag\w* (?:your|our|their|the|this|that|it|them|ai|data|my)\b/gi;
    if (cnt(l, NEVER) > cnt(d, NEVER) || (x.R.state === 'sharp' && cnt(l, NEVER))) why.push('a never-say word');
    if (why.length) bad.push(`${label(x)}: ${why.join('; ')}`);
  }
  assert.deepEqual(bad, []);
});

test('held-out: the stance hedge stays on a price call', () => {
  const STANCE = /\b(?:i (?:really |genuinely |honestly )?(?:think|believe|feel like)|imo|imho|in my opinion|probably|maybe)\b/i;
  const ASSET = /\$[a-z]{2,10}\b|\b(?:btc|eth|sol|bitcoin|ethereum|solana|link|nvda|tsla|spx|rates)\b/i, FORE = /\b(?:will|going to|goes to|to \$?\d|breaks?|hits?|flips?|outperforms?|pumps?|dumps?|rips?|still early|get cut)\b/i;
  const calls = runs.filter(x => STANCE.test(x.R.draft) && ASSET.test(x.R.draft) && FORE.test(x.R.draft));
  assert.ok(calls.length >= 6, `held-out has ${calls.length} hedged price calls`);
  assert.deepEqual(calls.filter(x => !STANCE.test(x.R.line)).map(label), []);
  /* and the note says so only while it's true */
  for (const x of runs) { const m = x.R.note.match(/Kept your “([^”]+)”/); if (m) assert.ok(x.R.line.toLowerCase().includes(m[1].toLowerCase()), label(x)); }
});

test('held-out: every "why" and "say" is true for the edit', () => {
  const W = core.SHARPEN.MOVE_WHY, HEDGE = /^(?:opinion|hedge)$/, fig = z => { const m = z.match(/(?<![\w.,])[$€£]?\d/); return m ? (z.slice(0, m.index).match(/\S+/g) || []).length : -1; };
  const beats = z => (z.match(/[^.!?]+(?:[.!?]+|$)/g) || []).filter(s => /\w/.test(s)).length;
  const bad = [];
  for (const x of runs.filter(r => r.R.state === 'sharp')) {
    const R = x.R, why = [];
    if (R.why === W.soft && !R.cut.some(c => HEDGE.test(c.kind))) why.push('hedge why with no hedge cut');
    if (/Led with the number/.test(R.say) && !(fig(R.line) >= 0 && fig(R.line) <= 2)) why.push('"Led with the number" but the number does not lead');
    if (/Asked, then answered/.test(R.say) && !/\?\s+\S/.test(R.line)) why.push('"Asked" with no question and answer');
    if (/Split it into two beats/.test(R.say) && !(beats(R.line) > beats(R.draft))) why.push('"Split" with no new sentence');
    if (/Cut the warm-up/.test(R.say) && !R.cut.some(c => /^(?:announce|label|disclaim|stock|throat|open|feel)$/.test(c.kind)) && R.move !== 'warm') why.push('"Cut the warm-up" with no warm-up cut');
    const n = (R.say.match(/Cut (\d+) (?:hedge|soft word|filler word)/) || [])[1]; if (n && +n !== R.cut.filter(c => /^(?:opinion|hedge|filler|intens|honest|tail|likeNum)$/.test(c.kind)).length) why.push(`says ${n} cut, cut list disagrees`);
    if (why.length) bad.push(`${label(x)}: ${why.join('; ')}`);
  }
  assert.deepEqual(bad, []);
});

test('held-out: the hand grades still hold (≥ 90% of lines are the exact line graded h)', () => {
  const drifted = runs.filter(x => x.R.line !== x.out), h = runs.filter(x => x.R.line === x.out && x.g === 'h').length;
  assert.ok(h / runs.length >= 0.9, `h ${h}/${runs.length}; outputs that moved since grading (grade them again): ${drifted.map(label).join(' | ')}`);
  assert.ok(runs.every(x => x.R.line !== x.out || x.g !== 'm'), 'a line graded m is back');
});

test('held-out: fast enough for every keystroke pause (median under 20 ms once loaded)', () => {
  const ms = runs.map(x => { const t = performance.now(); core.sharpenLine(x.t); return performance.now() - t; }).sort((a, b) => a - b);
  assert.ok(ms[ms.length >> 1] < 20, `median ${ms[ms.length >> 1].toFixed(1)} ms`);
  assert.ok(ms[Math.floor(ms.length * .95)] < 40, `p95 ${ms[Math.floor(ms.length * .95)].toFixed(1)} ms`);
});
