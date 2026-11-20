/* r86 v5.6 (pass C5.6): Claude's Sharpen after Fable round 5, tested on the C5.6 held-out lines (scratchpad/r86/engine/
   heldout-c56.json, in fixtures/sharpen-ai-dev56.json) and on the five Fable dev sets, never on one Fable line by its text.
   A version over 280 is split by the one shared splitter (SHARPEN.splitPosts): no post after the first opens on a lowercase
   continuation, none ends on a code token or spaced dots, the say counts the posts and the why says where post 2 starts.
   The receipt is held to the diff: the cut count is what the why names and the struck fluff, the why names a change that
   happened and nothing that didn't, no words are counted twice, and a clean line never gets "Claude kept it as written".
   No alt equals the shipped line or another alt. Every receipt on the dev and held-out sets passes SHARPEN.receiptCheck.
   Stand-ins for Claude's JSON and a fake client only: no API call is ever made. */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-sh56-'));
process.env.ANTHROPIC_API_KEY = 'test-key'; delete process.env.ANTHROPIC_AUTH_TOKEN;
process.env.HOOKWORTHY_TOKENS = 'free-token:free';
delete process.env.HOOKWORTHY_TOKEN; delete process.env.HW_PLAN; delete process.env.HW_SHARPEN_DAILY; delete process.env.HW_MODEL_SHARPEN;
const core = createRequire(import.meta.url)('../../core.js');
const AI = await import('../lib/ai.mjs');
const { handle, resetRateLimits, resetSharpenCaps } = await import('../server.mjs');

const reply = data => ({ model: 'claude-opus-5-5', stop_reason: 'end_turn', content: [{ type: 'text', text: JSON.stringify(data) }], usage: { input_tokens: 140, output_tokens: 260, cache_read_input_tokens: 2700, cache_creation_input_tokens: 0 } });
let answer = () => reply({ versions: [{ line: '', why: '' }], unchanged: true });
AI.setClient({ beta: { messages: { create: async req => answer(req) } } });
let srv, port;
before(async () => { srv = createServer(handle); await new Promise(r => srv.listen(0, '127.0.0.1', r)); port = srv.address().port; });
after(() => srv.close());
beforeEach(() => { resetRateLimits(); resetSharpenCaps(); });
const sharpen = body => new Promise((res, rej) => {
  const r = request({ host: '127.0.0.1', port, path: '/api/v1/sharpen', method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer free-token' } }, resp => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => res(JSON.parse(d))); });
  r.on('error', rej); r.write(JSON.stringify(body)); r.end();
});
const vs = a => a.map(v => typeof v === 'string' ? { line: v, why: '' } : v);
const F = (t, versions, unchanged = false) => { const trace = {}; const r = core.SHARPEN.fromClaude(t, { versions: vs(versions), unchanged }, { trace }); return { r, reject: trace.reject, trace }; };
const sys = core.prompts.sharpen({ text: 'placeholder line' }).cached;
const FX = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/sharpen-ai-dev56.json'), 'utf8'));
const H = Object.fromEntries(FX.heldout.map(r => [r.id, r]));
const run = r => core.SHARPEN.fromClaude(r.t, r.reply, { trace: {} });
/* the test's own reading of a broken post, apart from the engine's: a post that ends on dots standing alone or after code
   punctuation ("COPY . .", "git add .", "/api/v2/..."), on "e.g.", or inside backticks; one after the first that opens lowercase */
const endsOnCode = p => { const x = String(p).trim().split(/\s+/).pop().replace(/["”’)\]]+$/, ''); return /^[.…]+$/.test(x) || /[/\\*{}<>=|_~^-](?:\.{1,3}|…)$/.test(x) || /^(?:e\.g|i\.e|vs)\.$/i.test(x) || (String(p).match(/`/g) || []).length % 2 === 1; };
const opensLow = p => /^[^\p{L}\p{N}]*\p{Ll}/u.test(String(p)) && !/^[^\p{L}\p{N}]*i(?:['’]|\s)/u.test(String(p));

test('prompt v5.6: code is never a sentence end, the why leaves the split to Hookworthy, and the code example ships as written', () => {
  for (const re of [/Hookworthy splits the line into posts at your sentence ends and says where/, /never where post 2 starts/, /Code is never a sentence end/, /`COPY \. \.`, `git add \.`, `\/api\/v2\/\.\.\.`/,
    /never start one on a lowercase word that carries on the one before/,
    /* what earlier passes rely on is still there */
    /6\. A line over 280 characters: version 1 fits in 280\. Cut padding first/, /A run-up about the post itself/, /on hard news it is their framing: rule 4/, /Never open it with a label for the version/]) assert.match(sys, re);
  assert.doesNotMatch(sys, /say in why that the rest can be post 2/, 'the model no longer guesses where post 2 starts');
  const ex = [...sys.matchAll(/<example>\n<line>([\s\S]*?)<\/line>\n(\{[\s\S]*?\})\n<\/example>/g)].map(m => [m[1], JSON.parse(m[2])]);
  const code = ex.find(([d]) => /COPY \. \. above npm install/.test(d));
  assert.ok(code, 'the code example is there');
  const { r } = F(code[0], code[1].versions);
  assert.ok(r && /COPY \. \. above npm install\./.test(r.line), 'COPY . . stays as written'); assert.equal(r.why, code[1].versions[0].why);
  assert.equal(r.say, 'Cut 2 bits of fluff · Split it into two beats'); assert.deepEqual(core.SHARPEN.receiptCheck(r), []);
});

test('long lines v5.6: a Claude version over 280 is split by the shared splitter into whole posts, and the receipt says the split made', () => {
  const long = FX.heldout.filter(r => r.fam === 'L');
  assert.equal(long.length, 20);
  let threads = 0;
  for (const h of long) {
    const tr = {}, r = core.SHARPEN.fromClaude(h.t, h.reply, { trace: tr }); assert.ok(r, `${h.id} ships Claude's line (${tr.reject})`);
    if (!/\n\n/.test(r.line)) { assert.ok(core.xLength(r.line) <= 280, `${h.id}: one post fits`); continue; }
    threads++;
    const P = r.thread;
    assert.ok(Array.isArray(P) && P.length >= 2, h.id); assert.equal(r.line, P.join('\n\n')); assert.equal(r.post2, P[1]);
    assert.deepEqual(P, core.SHARPEN.splitPosts(P.join(' '), h.t), `${h.id}: the posts are the shared splitter's`);
    P.forEach((p, i) => { assert.ok(core.xLength(p) <= 280, `${h.id} post ${i + 1} fits`); if (i < P.length - 1) assert.ok(!endsOnCode(p), `${h.id} post ${i + 1} ends on code: ${p}`); if (i) assert.ok(!opensLow(p) || /^\P{L}*\p{Ll}/u.test(h.t), `${h.id} post ${i + 1} opens lowercase: ${p}`); });
    assert.match(r.say, new RegExp(`Opens a ${P.length}-post thread`), h.id); assert.doesNotMatch(r.say, /Split it/, h.id);
    assert.match(r.note, new RegExp(`opens a ${P.length}-post thread\\.$`), h.id); assert.doesNotMatch(r.note, /can split it/, h.id);
    assert.doesNotMatch(r.why, /\bfits? in 280\b|\bthe rest can\b/i, `${h.id}: no guess at the split`);
    const at = r.why.match(/Post 2 starts at “([^”]+)”/); if (at) assert.ok(P[1].startsWith(at[1]), `${h.id}: post 2 starts where the why says`);
    assert.deepEqual(core.SHARPEN.receiptCheck(r), [], h.id);
  }
  assert.ok(threads >= 18, `threads: ${threads}`);
  /* code stays whole: COPY . ., git add ., ALTER TABLE ... ADD, /api/v2/... and e.g. are inside a post, never at its edge */
  const P = id => run(H[id]).thread;
  assert.match(P('w-2')[0], /after COPY \. \. which meant/); assert.match(P('w-2')[1], /^After we moved the COPY package\*\.json \.\/ step/);
  assert.match(P('w-31')[1], /^Nginx matches the longest prefix/); assert.match(P('w-31')[1], /\/api\/v2\/\.\.\. was hitting/);
  assert.match(P('w-33')[0], /typed git add \. and git commit/); assert.match(P('w-12')[0], /ALTER TABLE \.\.\. ADD COLUMN/); assert.match(P('w-6')[0], /e\.g\. to just pick your brain/);
  /* the writer's lowercase may open a post after a full stop (w-9), never after code or dots */
  assert.match(P('w-9')[1], /^i should have tested/);
});

test('long lines v5.6: a split that breaks a post is rejected, whatever the splitter returns; no split ships the line whole', () => {
  const h = H['w-2'], v = h.reply.versions[0].line, real = core.SHARPEN.splitPosts;
  try {
    /* a splitter that read "COPY . ." as a sentence end (Fable n-92) */
    core.SHARPEN.splitPosts = l => { const i = l.indexOf('COPY . .') + 'COPY . .'.length; return [l.slice(0, i), l.slice(i).trim()]; };
    assert.equal(F(h.t, [v]).reject, 'split');
    core.SHARPEN.splitPosts = l => { const i = l.indexOf(' which meant'); return [l.slice(0, i), l.slice(i).trim()]; };
    assert.equal(F(h.t, [v]).reject, 'split', 'a post 2 that opens on a lowercase continuation');
    /* a later version whose posts are whole ships instead */
    const v2 = v.replace('after COPY . . which meant', 'after the COPY . . step, which meant');
    core.SHARPEN.splitPosts = (l, d) => l.includes('COPY . . which meant') ? [l.slice(0, l.indexOf('COPY . .') + 8), l.slice(l.indexOf('COPY . .') + 8).trim()] : real(l, d);
    const two = F(h.t, [v, v2]); assert.equal(two.r.pick, 1); assert.deepEqual(two.trace.rejects, ['split', 'ok']);
    core.SHARPEN.splitPosts = () => null;
    const one = F(h.t, [v]).r; assert.ok(one && !/\n/.test(one.line), 'no split: the line ships whole'); assert.ok(one.long);
  } finally { core.SHARPEN.splitPosts = real; }
  assert.ok(F(h.t, [v]).r.thread.length === 2);
});

test('receipts v5.6: the count comes from the diff and the why names what happened, never counting a word twice', () => {
  const S = id => run(H[id]);
  /* n-76's shape: "lands without it" says nothing went, so Claude's true why ships and no "1 word lighter … went too" */
  const w44 = S('w-44'); assert.equal(w44.why, '“definitely” went: the flip from “outwork” to “outlast” lands without it.'); assert.match(w44.say, /^Cut 1 bit of fluff/);
  const dbl = F(H['w-44'].t, [{ line: w44.line, why: 'Same claim, 1 word lighter, so it reads in one glance.' }]).r;
  assert.ok(!(/\blighter\b/.test(dbl.why) && /went too/.test(dbl.why)), dbl.why); assert.deepEqual(core.SHARPEN.receiptCheck(dbl), []);
  /* n-79's shape: four spans went and the why names them; a why that names no change gives way to one from the diff */
  assert.match(S('w-0').say, /^Cut 4 bits of fluff · Opens a 2-post thread$/); assert.match(S('w-55').say, /^Cut 3 bits of fluff/);
  const tease = F(H['w-55'].t, [{ line: S('w-55').line, why: '“even if you\'ve never written a single tweet” promises the next line, so reading on is the obvious move.' }]).r;
  assert.match(tease.why, /^“Here's”, “that” and “literally” went\./); assert.match(tease.say, /^Cut 3 bits of fluff/); assert.deepEqual(core.SHARPEN.receiptCheck(tease), []);
  /* a reworded frame is no cut; a quote of what went counts however the why says it */
  assert.equal(S('w-21').say, 'Tightened it');
  assert.match(F(H['w-48'].t, [{ line: 'Good design is invisible until it breaks.', why: '“honestly” was talk, not the point.' }]).r.say, /^Cut 1 bit of fluff/);
  /* the catch-all names the run it means */
  assert.match(S('w-3').say, /^Cut 1 bit of fluff/); assert.match(S('w-3').why, /^The run-up about writing it up went/);
  /* a why that says a kept word went is never shipped */
  const bad = F(H['w-46'].t, [{ line: 'Discipline is remembering what you actually want.', why: '“actually” and “really just” went.' }]).r;
  assert.doesNotMatch(bad.why, /“actually”/); assert.deepEqual(core.SHARPEN.receiptCheck(bad), []);
});

test('receipts v5.6: a clean line keeps a true why of Claude\'s, else one from the line, never "Claude kept it as written"', () => {
  for (const h of FX.heldout.filter(r => r.fam === 'D')) {
    const r = run(h); assert.equal(r.state, 'clean', h.id); assert.equal(r.why, h.reply.versions[0].why, h.id);
    for (const why of ['', 'Already sharp: “Treat it like one” comes first.', 'Already sharp: “the second hire” lands it.']) {
      const c = F(h.t, [{ line: h.t, why }], true).r;
      assert.equal(c.state, 'clean'); assert.notEqual(c.why, 'Claude kept it as written.'); assert.match(c.why, /^Nothing to cut: (?:one sentence|two beats|three beats|a question)/, `${h.id}: ${c.why}`);
      assert.doesNotMatch(c.why, /on-device/i); assert.ok(c.why.length <= 140); assert.deepEqual(core.SHARPEN.receiptCheck(c), [], h.id);
    }
  }
  assert.equal(F(H['w-38'].t, [{ line: H['w-38'].t, why: '' }], true).r.why, 'Nothing to cut: two beats, the $40k is specific, and the colon points at what comes next.');
});

test('alts v5.6: no alt equals the shipped line or another alt', () => {
  for (const id of ['w-50', 'w-54']) { const r = run(H[id]); assert.deepEqual(r.alts, [], `${id}: the top-up made version 1 equal version 2`); }
  const t = 'Most productivity advice is basically procrastination with extra steps, honestly';
  const r = F(t, ['Most productivity advice is procrastination with extra steps.', 'Most productivity advice is procrastination with extra steps', 'Most productivity advice is basically procrastination with extra steps.', 'Most productivity advice is basically procrastination with extra steps.']).r;
  assert.deepEqual(r.alts.map(a => a.line), ['Most productivity advice is basically procrastination with extra steps.']);
  for (const h of FX.heldout) { const x = run(h); if (!x) continue; const L = [x.line, ...x.alts.map(a => a.line)].map(z => z.replace(/\s+/g, ' ').replace(/[\s.!]+$/, '').toLowerCase()); assert.equal(new Set(L).size, L.length, h.id); }
});

test('receiptCheck v5.6: it names each receipt flaw of Fable round 5\'s shape, and every receipt on the dev and held-out sets passes it', () => {
  const C = core.SHARPEN.receiptCheck;
  assert.deepEqual(C({ state: 'clean', draft: 'nobody tells you that quitting is the easy part', line: 'nobody tells you that quitting is the easy part', say: 'Nothing to cut', why: 'Claude kept it as written.' }), ['generic why']);
  const d76 = 'You can\'t out-train a bad diet, but you can definitely out-eat a good program', l76 = 'You can\'t out-train a bad diet, but you can out-eat a good program.';
  assert.ok(C({ state: 'sharp', draft: d76, line: l76, say: 'Tightened it', why: 'Same claim, 1 word lighter, so it reads in one glance. “definitely” went too.', cut: [] }).includes('double count'));
  const d79 = 'Here\'s a very simple 3 day split that literally anyone can follow, even if you only have like 45 minutes', l79 = 'A very simple 3 day split anyone can follow, even if you only have like 45 minutes:';
  assert.ok(C({ state: 'sharp', draft: d79, line: l79, say: 'Cut 1 bit of fluff · Left a reason to read on', why: '“like 45 minutes” promises the next line, so reading on is the obvious move.', cut: [{ text: 'literally', kind: 'filler' }] }).includes('why names no change'));
  assert.ok(C({ state: 'sharp', draft: d79, line: l79, say: 'Cut 1 bit of fluff', why: '“Here\'s”, “that” and “literally” went.', cut: [] }).includes('count 1 for 3'));
  const h2 = H['w-2'], v2 = h2.reply.versions[0].line, i = v2.indexOf('COPY . .') + 8;
  const broken = C({ state: 'sharp', draft: h2.t, line: `${v2.slice(0, i)}\n\n${v2.slice(i).trim()}`, say: 'Cut 3 bits of fluff · Opens a 2-post thread', why: '“single” and “honestly” went. The first sentence fits in 280.', cut: [] });
  assert.ok(broken.includes('post 1: ends on a code token') && broken.includes('post 2: opens on a lowercase continuation'), broken.join('; '));
  /* the whole dev set (fable to fable5) and the held-out lines, as they ship */
  let n = 0;
  for (const row of [...FX.dev, ...FX.heldout]) {
    const r = run(row); if (!r) continue; n++;
    assert.deepEqual(C(r), [], `${row.id}: ${r.say} | ${r.why}`);
    for (const a of r.alts || []) assert.deepEqual(C({ ...a, draft: r.draft, state: 'sharp' }), [], `${row.id} alt: ${a.say} | ${a.why}`);
  }
  assert.ok(n >= 650, `receipts checked: ${n}`);
});

test('the endpoint ships a long held-out line as a thread of whole posts, with the receipt of the split it made (fake client)', async () => {
  const h = H['w-31'];
  answer = () => reply(h.reply);
  const r = await sharpen({ text: h.t });
  assert.equal(r.source, 'claude'); assert.equal(r.thread.length, 2); assert.equal(r.line, r.thread.join('\n\n'));
  assert.match(r.thread[1], /^Nginx matches/); assert.match(r.say, /Opens a 2-post thread$/); assert.doesNotMatch(r.why, /\bfits? in 280\b|\bthe rest can\b/);
  const c = H['w-36'];
  answer = () => reply({ versions: [{ line: c.t, why: '' }], unchanged: true });
  const k = await sharpen({ text: c.t });
  assert.equal(k.source, 'claude'); assert.equal(k.state, 'clean'); assert.match(k.why, /^Nothing to cut: one sentence, and it ends on “the first customer”\.$/);
});
