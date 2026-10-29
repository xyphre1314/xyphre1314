/* r86: Sharpen through Claude (POST /api/v1/sharpen), tested only with a fake client. Claude's line is held to the
   engine's guards and dressed in the engine's own receipt; anything else is the engine's answer, with the reason. */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

/* never the real API: the fake client is in place before any request, and the SDK's base URL points nowhere in case one slips through */
process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-sh-'));
process.env.ANTHROPIC_API_KEY = 'test-key'; delete process.env.ANTHROPIC_AUTH_TOKEN;
process.env.HOOKWORTHY_TOKENS = 'free-token:free,other-token:free';
delete process.env.HOOKWORTHY_TOKEN; delete process.env.HW_PLAN; delete process.env.HW_SHARPEN_DAILY;
delete process.env.HW_MODEL_QUICK; delete process.env.HW_MODEL_DEFAULT; delete process.env.HW_MODEL_COMPLEX;
const core = createRequire(import.meta.url)('../../core.js');
const { default: Anthropic } = await import('@anthropic-ai/sdk');
const AI = await import('../lib/ai.mjs');
const CR = await import('../lib/credits.mjs');
const { handle, resetRateLimits, resetSharpenCaps, SHARPEN_TIMEOUT_MS } = await import('../server.mjs');

const calls = [];
const reply = (data, extra = {}) => ({ model: 'claude-sonnet-5-5', stop_reason: 'end_turn', content: [{ type: 'text', text: typeof data === 'string' ? data : JSON.stringify(data) }], usage: { input_tokens: 140, output_tokens: 60, cache_read_input_tokens: 1400, cache_creation_input_tokens: 0 }, ...extra });
let answer = () => reply({ line: '', why: '', unchanged: true });
AI.setClient({ beta: { messages: { create: async (req, opts) => { calls.push({ req, opts }); return answer(req, opts); } } } });

let srv, port;
before(async () => { srv = createServer(handle); await new Promise(r => srv.listen(0, '127.0.0.1', r)); port = srv.address().port; });
after(() => srv.close());
beforeEach(() => { resetRateLimits(); resetSharpenCaps(); delete process.env.HW_SHARPEN_DAILY; process.env.ANTHROPIC_API_KEY = 'test-key'; });
const call = (path, { method = 'GET', body, token = 'free-token' } = {}) => new Promise((res, rej) => {
  const headers = { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}) };
  const r = request({ host: '127.0.0.1', port, path, method, headers }, resp => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => { let j = null; try { j = JSON.parse(d); } catch { /* not json */ } res({ status: resp.statusCode, json: j }); }); });
  r.on('error', rej); if (body) r.write(JSON.stringify(body)); r.end();
});
const sharpen = (body, token) => call('/api/v1/sharpen', { method: 'POST', body, token });

const POST = 'I just wanted to share that our team shipped v2 and signups went up 31% this week\nHere is what changed.';
const LINE = 'Our team shipped v2 and signups went up 31% this week.';
const WHY = 'The run-up is gone, so “Our team shipped v2” is the first thing people read.';
const CONTRACT = ['state', 'draft', 'line', 'rest', 'cut', 'marks', 'move', 'say', 'why', 'kept', 'alts', 'long', 'note'];
const rulesFor = (text, keep = []) => core.sharpenLine(text, { keep });

test('a line that passes comes back as Claude’s, in the engine’s contract, with the engine’s own cut list and receipt', async () => {
  answer = () => reply({ line: LINE, why: WHY, unchanged: false });
  const r = await sharpen({ text: POST });
  assert.equal(r.status, 200); assert.equal(r.json.source, 'claude'); assert.equal(r.json.reason, undefined);
  for (const k of CONTRACT) assert.ok(k in r.json, `contract field ${k}`);
  assert.equal(r.json.state, 'sharp'); assert.equal(r.json.line, LINE); assert.equal(r.json.rest, 'Here is what changed.');
  assert.notEqual(r.json.line, rulesFor(POST).line, 'Claude’s line, not the engine’s');
  /* the cut list is the engine's word diff, never the model's: the run-up, as written, with its kind and reason */
  assert.deepEqual(r.json.cut.map(c => [c.text, c.kind]), [['I just wanted to share that', 'announce']]);
  assert.deepEqual(r.json.cut[0].at, [0, 27]); assert.ok(r.json.cut[0].why);
  assert.equal(r.json.say, 'Cut 1 bit of fluff', 'the receipt comes from the engine’s rules');
  assert.equal(r.json.why, WHY, 'a short, true why that quotes only the line is Claude’s');
  assert.deepEqual(r.json.kept, ['v2', '31%']);
});

test('a why that quotes words in neither line, or runs long, is replaced by the engine’s', async () => {
  answer = () => reply({ line: LINE, why: 'Cut “literally everything” so it lands.', unchanged: false });
  const a = await sharpen({ text: POST });
  assert.equal(a.json.source, 'claude'); assert.notEqual(a.json.why, 'Cut “literally everything” so it lands.'); assert.ok(a.json.why.length > 0 && a.json.why.length <= 140);
  answer = () => reply({ line: LINE, why: 'x'.repeat(141), unchanged: false });
  const b = await sharpen({ text: POST });
  assert.equal(b.json.source, 'claude'); assert.ok(b.json.why.length <= 140);
});

test('“unchanged” is a clean answer from Claude; the same line without it is not', async () => {
  const sharp = 'Day 47 of building my SaaS in public. 3 paying customers. $87 MRR. Still going.';
  answer = () => reply({ line: sharp, why: 'Already sharp: the numbers lead.', unchanged: true });
  const a = await sharpen({ text: sharp });
  assert.equal(a.json.source, 'claude'); assert.equal(a.json.state, 'clean'); assert.equal(a.json.line, sharp); assert.equal(a.json.why, 'Already sharp: the numbers lead.');
  answer = () => reply({ line: sharp, why: 'Tighter.', unchanged: false });
  const b = await sharpen({ text: sharp });
  assert.equal(b.json.source, 'rules'); assert.equal(b.json.reason, 'invalid');
});

test('anything the guards catch is the engine’s line, reason invalid: a lost fact, a new number, a lost "not", a never-say word, a longer or broken line, bad JSON', async () => {
  const cases = [
    ['drops a fact', POST, { line: 'Our team shipped v2 and signups went up this week.' }],
    ['adds a number', POST, { line: 'Our team shipped v2 and signups went up 31% in 7 days.' }],
    ['drops a negation', 'honestly we are not raising a round this year', { line: 'we are raising a round this year.' }],
    ['uses a never-say word', POST, { line: 'Our team launched v2 and signups went up 31% this week.' }, ['launched']],
    ['says it in AI words', 'so basically you should really use your network to get hired', { line: 'You should leverage your network to get hired.' }],
    ['runs longer than the draft', POST, { line: 'I just wanted to share with all of you that our team shipped v2 and signups went up 31% this week' }],
    ['comes back broken', POST, { line: 'Our team shipped v2,, and signups went up 31% this week.' }],
    ['gains capitals in a lowercase line', 'ok so i finally figured out why my posts were not getting reach', { line: 'I finally figured out why my posts were not getting reach.' }],
    ['is empty', POST, { line: '   ' }]
  ];
  for (const [name, text, out, never] of cases) {
    answer = () => reply({ why: 'Cut the run-up.', unchanged: false, ...out });
    const r = await sharpen({ text, never });
    assert.equal(r.status, 200, name); assert.equal(r.json.source, 'rules', name); assert.equal(r.json.reason, 'invalid', name);
    assert.equal(r.json.line, rulesFor(text).line, `${name}: the engine’s own answer`);
  }
  answer = () => reply('not json at all');
  const g = await sharpen({ text: POST }); assert.equal(g.json.source, 'rules'); assert.equal(g.json.reason, 'invalid');
  answer = () => reply({ line: LINE, why: WHY, unchanged: false }, { stop_reason: 'max_tokens' });
  const t = await sharpen({ text: POST }); assert.equal(t.json.reason, 'invalid', 'a cut-off answer is never trusted');
});

test('a refusal, a timeout or an error falls back to the engine, saying which', async () => {
  answer = () => reply('', { stop_reason: 'refusal', stop_details: { type: 'refusal', category: null, explanation: 'declined' } });
  const a = await sharpen({ text: POST });
  assert.equal(a.json.source, 'rules'); assert.equal(a.json.reason, 'refused'); assert.equal(a.json.line, rulesFor(POST).line);
  let seen = null;
  answer = (req, opts) => { seen = opts; throw new Anthropic.APIConnectionTimeoutError(); };
  const b = await sharpen({ text: POST });
  assert.equal(b.json.source, 'rules'); assert.equal(b.json.reason, 'timeout'); assert.equal(b.json.state, rulesFor(POST).state);
  assert.equal(SHARPEN_TIMEOUT_MS, 6000); assert.deepEqual(seen, { timeout: 6000, maxRetries: 0 }, 'a 6 s budget, not multiplied by retries');
  answer = () => { throw new Error('socket hang up'); };
  const c = await sharpen({ text: POST });
  assert.equal(c.json.source, 'rules'); assert.equal(c.json.reason, 'error');
});

test('no key: the engine answers and Claude is never called', async () => {
  delete process.env.ANTHROPIC_API_KEY; const n = calls.length;
  const r = await sharpen({ text: POST });
  assert.equal(r.status, 200); assert.equal(r.json.source, 'rules'); assert.equal(r.json.reason, 'no_key'); assert.equal(r.json.line, rulesFor(POST).line);
  assert.equal(calls.length, n);
});

test('thin or empty input goes straight to the engine', async () => {
  const n = calls.length;
  for (const text of ['', 'gm', 'asdf qwer zxcv', 'nfa']) {
    const r = await sharpen({ text }); assert.equal(r.json.source, 'rules', text); assert.equal(r.json.reason, 'thin', text); assert.equal(r.json.state, rulesFor(text).state, text);
  }
  assert.equal(calls.length, n);
});

test('the fair-use cap is per token per day (HW_SHARPEN_DAILY); past it the engine answers', async () => {
  process.env.HW_SHARPEN_DAILY = '2'; answer = () => reply({ line: LINE, why: WHY, unchanged: false });
  const n = calls.length;
  assert.equal((await sharpen({ text: POST })).json.source, 'claude');
  assert.equal((await sharpen({ text: POST })).json.source, 'claude');
  const third = await sharpen({ text: POST });
  assert.equal(third.status, 200); assert.equal(third.json.source, 'rules'); assert.equal(third.json.reason, 'cap'); assert.equal(third.json.line, rulesFor(POST).line);
  assert.equal(calls.length, n + 2, 'nothing sent past the cap');
  assert.equal((await sharpen({ text: POST }, 'other-token')).json.source, 'claude', 'another token has its own cap');
  process.env.HW_SHARPEN_DAILY = '0'; assert.equal((await sharpen({ text: POST }, 'other-token')).json.reason, 'cap', '0 turns Claude off for Sharpen');
});

test('Sharpen never spends credits, through Claude or not', async () => {
  answer = () => reply({ line: LINE, why: WHY, unchanged: false });
  const bal = () => { const s = CR.status('free-token'); return [s.left, s.helpers.left]; }, before0 = bal();
  for (let i = 0; i < 3; i++) assert.equal((await sharpen({ text: POST })).json.source, 'claude');
  answer = () => { throw new Anthropic.APIConnectionTimeoutError(); }; await sharpen({ text: POST });
  assert.deepEqual(bal(), before0, 'no credit and no free helper used');
});

test('the request: the quick tier’s model at low effort, the stable instructions cached first, then the author’s line', async () => {
  answer = () => reply({ line: LINE, why: WHY, unchanged: false });
  await sharpen({ text: POST, voice: { summary: 'Short and plain.', never: ['synergy'] }, never: ['launched'], keep: ['honestly'] });
  const { req } = calls[calls.length - 1], spec = core.prompts.sharpen({ text: POST });
  assert.equal(req.model, 'claude-sonnet-5-5'); assert.equal(req.model, AI.MODELS.quick); assert.equal(req.output_config.effort, 'low');
  assert.equal(req.fallbacks, 'default'); assert.deepEqual(req.betas, ['server-side-fallback-2026-07-01']);
  assert.equal(req.output_config.format.type, 'json_schema'); assert.deepEqual(Object.keys(req.output_config.format.schema.properties), ['line', 'why', 'unchanged']);
  assert.equal(req.thinking, undefined); assert.equal(req.temperature, undefined);
  const c = req.messages[0].content;
  assert.equal(c.length, 2);
  assert.deepEqual(c[0], { type: 'text', text: spec.cached, cache_control: { type: 'ephemeral' } }, 'the stable prefix carries the cache breakpoint');
  assert.equal(c[1].type, 'text'); assert.equal(c[1].cache_control, undefined);
  assert.ok(c[1].text.includes(POST.split('\n')[0]), 'the draft comes after the cached block'); assert.ok(!c[0].text.includes('our team shipped v2'));
  assert.match(c[1].text, /never-say words: launched, synergy/); assert.match(c[1].text, /Keep each one the line has: honestly/); assert.match(c[1].text, /Short and plain\./);
  assert.match(c[1].text, /The post goes on after this line\./);
  /* the cached prefix is byte-identical for every author and every line, so taps share it */
  await sharpen({ text: 'so basically i think we finally fixed the onboarding flow' });
  assert.equal(calls[calls.length - 1].req.messages[0].content[0].text, c[0].text);
  assert.ok(spec.cached.length > 2400, 'long enough to clear the model’s minimum cacheable prefix'); assert.equal(spec.tier, 'quick');
});

test('existing complete() callers are unchanged: a string prompt, no cache block, no request options', async () => {
  const n = calls.length; answer = () => reply('{"options":[{"text":"a","why":"b"}]}');
  await AI.complete({ prompt: 'x', tier: 'default', json: true, schema: { type: 'object', properties: { options: { type: 'array', items: { type: 'string' } } }, required: ['options'], additionalProperties: false } });
  await AI.complete({ prompt: 'read this', docs: [{ name: 'a.pdf', mime: 'application/pdf', data: 'JVBERi0xLjQK' }] });
  const [a, b] = calls.slice(n);
  assert.equal(a.req.messages[0].content, 'x'); assert.equal(a.opts, undefined); assert.equal(a.req.output_config.effort, 'medium');
  assert.equal(b.req.messages[0].content[0].type, 'document'); assert.deepEqual(b.req.messages[0].content[1], { type: 'text', text: 'read this' }); assert.equal(b.opts, undefined);
  assert.ok(!JSON.stringify(a.req).includes('cache_control') && !JSON.stringify(b.req).includes('cache_control'));
  /* the selection Sharpen keeps its own shape */
  const sel = core.prompts.sharpen({ post: 'so i think x is y\nmore', s: 0, e: 17 });
  assert.equal(sel.cached, undefined); assert.deepEqual(Object.keys(sel.schema.properties), ['versions']);
  /* and /api/v1/rewrite still spends its credit */
  const before0 = CR.status('free-token').left;
  const r = await call('/api/v1/rewrite', { method: 'POST', body: { text: 'so i think x is y', kind: 'punchier' } });
  assert.equal(r.status, 200); assert.equal(CR.status('free-token').left, before0 - 1);
});

test('fromClaude keeps the writer’s put-back words, their opener, and their casing', () => {
  const S = core.SHARPEN, d = 'gm. honestly i think $ETH is going to 5k by summer';
  assert.equal(S.fromClaude(d, { line: 'i think $ETH is going to 5k by summer.', why: '', unchanged: false }), null, 'dropped the gm.');
  assert.ok(S.fromClaude(d, { line: 'gm. i think $ETH is going to 5k by summer.', why: '', unchanged: false }));
  assert.equal(S.fromClaude(d, { line: 'gm. i think $ETH is going to 5k by summer.', why: '', unchanged: false }, { keep: ['honestly'] }), null, 'a word they put back stays');
  assert.equal(S.fromClaude(d, { line: 'gm. I think $ETH is going to 5k by summer.', why: '', unchanged: false }), null, 'lowercase stays lowercase');
  assert.equal(S.fromClaude(d, { line: 'gm. i think $ETH is going to 5k by summer 🚀', why: '', unchanged: false }), null, 'no new emoji');
  assert.equal(S.fromClaude(d, { unchanged: 'no' }), null);
  const ok = S.fromClaude('So basically we raised a $2.5M seed round led by @a16z', { line: 'We raised a $2.5M seed round led by @a16z.', why: 'Cut “So basically”: the news leads.', unchanged: false });
  assert.equal(ok.source, 'claude'); assert.deepEqual(ok.kept, ['$2.5M', '@a16z']); assert.ok(ok.cut.every(c => c.text && c.kind && c.why && Array.isArray(c.at)));
  assert.ok(ok.score.to >= 0 && ok.score.from >= 0);
});
