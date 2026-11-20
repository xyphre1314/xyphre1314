/* r86 v4: Claude's Sharpen after the round-5 hook review (hook-2, hook-3, hook-4, hook-7, hook-10, hook-11). The prompt keeps
   one hedge per clause (every hedge on a call, a doubled "could maybe" collapsed), lets an opinion label stand in for
   "I think", cuts ngl/IMHO as delaying frames and puts the edit a ghostwriter would post first; the validator collapses a
   doubled hedge, catches a cut-off predicate and a verbless "and" clause, and only calls a later copy of the draft "clean"
   when nothing before it passed; a first version that still opens on a run-up gives way to a later one that doesn't; and
   the receipt says only what the diff did. Stand-ins for Claude's JSON and a fake client only: no API call is ever made. */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-sh4-'));
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
const F = (t, data, opts = {}) => { const trace = {}; const r = core.SHARPEN.fromClaude(t, { why: '', unchanged: false, ...data }, { ...opts, trace }); return { r, reject: trace.reject, trace }; };
const verdict = (t, data, opts) => { const { r, reject } = F(t, data, opts); return r ? 'accept' : reject; };

test('prompt v4: the hedge, frame and version-order rules are in the cached instructions, and the safety rules still are', () => {
  const spec = core.prompts.sharpen({ text: 'placeholder line' }), sys = spec.cached;
  for (const re of [/Drop a hedge below one per clause/, /On a forecast, plan or price call keep every hedge/, /"could maybe" → "could"/, /replaces "I think"/,
    /Cut a frame that only delays: "ngl", "Not gonna lie"/, /"IMHO" and "In my humble opinion"/, /An approximator stays with its absolute or number/,
    /the edit a top ghostwriter would post/, /version 1 drops it and the light edit goes second/, /Start that why with "Already sharp:" only when the line works as a hook/,
    /Add a fact, number, name, result, time, emoji or hashtag/, /Drop a negation or flip one/, /Never make a plan or forecast certain/, /Move an emoji off the end/, /in their voice/]) assert.match(sys, re);
  assert.doesNotMatch(sys, /When unsure, keep the frame in version 1/, 'v3\'s timid default is gone');
  /* the stable prefix is still one string, identical for every line, and the schema is unchanged */
  assert.equal(core.prompts.sharpen({ text: 'another line entirely\nwith a rest' }).cached, sys);
  assert.deepEqual(Object.keys(spec.schema.properties), ['versions', 'unchanged']); assert.deepEqual(spec.schema.properties.versions.items.required, ['line', 'why']);
  /* the new examples: a stacked hedge, a plan with a doubled hedge, a hot take and a delaying frame with the light edit second */
  const ex = [...sys.matchAll(/<example>\n<line>([\s\S]*?)<\/line>\n(\{[\s\S]*?\})\n<\/example>/g)].map(m => [m[1], JSON.parse(m[2])]);
  assert.ok(ex.length >= 14, `${ex.length} examples`);
  assert.ok(ex.some(([d, x]) => /could maybe/.test(d) && /\bi think\b/i.test(x.versions[0].line) && !/maybe/.test(x.versions[0].line)), 'a plan keeps "i think", "could maybe" → "could"');
  assert.ok(ex.some(([d, x]) => /^Hot take: I (?:really )?think/.test(d) && /^Hot take: (?!I )/.test(x.versions[0].line)), 'the label stands in for "I think"');
  assert.ok(ex.some(([d, x]) => /^Not gonna lie/.test(d) && x.versions.length === 2 && !/gonna/i.test(x.versions[0].line)), 'the delaying frame goes in version 1');
  for (const [d, data] of ex) for (const v of data.versions) { const { r, reject } = F(d, { versions: [v], unchanged: data.unchanged }); assert.ok(r, `example rejected: ${d} (${reject})`); assert.equal(r.why, v.why, d); }
});

test('validator v4: a doubled hedge collapses into one; the call itself stays hedged; "imho" goes on an opinion, never on a call; "imo" stays', () => {
  const call = 'I think $BTC could maybe hit $120k by end of year';
  assert.equal(verdict(call, { line: 'I think $BTC could hit $120k by end of year.' }), 'accept');
  assert.equal(verdict('we might possibly ship it next week', { line: 'we might ship it next week' }), 'accept');
  assert.equal(verdict(call, { line: 'I think $BTC hits $120k by end of year.' }), 'hedge "could" lost');
  assert.equal(verdict(call, { line: 'I think $BTC maybe hits $120k by end of year.' }), 'hedge "could" lost', 'the modal is the one that stays');
  assert.equal(verdict('IMHO tabs are better than spaces for most teams', { line: 'Tabs are better than spaces for most teams.' }), 'accept');
  assert.notEqual(verdict('IMHO $ETH will flip $BTC by 2027', { line: '$ETH will flip $BTC by 2027.' }), 'accept');
  assert.equal(verdict("ngl $ETH/$BTC under 0.03 is kinda wild, ser. ngmi if you're still fading L2s imo", { line: "$ETH/$BTC under 0.03 is wild, ser. ngmi if you're still fading L2s." }), 'hedge "imo" lost');
});

test('validator v4 (hook-10): a cut-off predicate and an "and" clause with no verb are broken; the writer\'s own, a list and a real clause are not', () => {
  assert.equal(verdict("I closed the trade today for a 4x and honestly I'm very happy with it.", { line: "I closed the trade today for a 4x and I'm very." }), 'cut-off predicate');
  assert.equal(verdict('honestly it was fine. and that\'s really.', { line: 'it was fine. and that\'s really.' }), 'accept', 'already in the draft');
  const d = 'So I have been testing hooks lately, and I think I found a formula that works.';
  assert.equal(verdict(d, { line: 'I have been testing hooks lately, and a formula that works.' }), 'verbless clause');
  assert.equal(verdict(d, { line: 'I have been testing hooks lately. And a formula that works.' }), 'verbless clause');
  assert.equal(verdict(d, { line: 'I have been testing hooks lately, and I think I found a formula that works.' }), 'accept');
  assert.equal(verdict('honestly I packed socks, shirts and two books', { line: 'I packed socks, shirts, and two books.' }), 'accept', 'an Oxford comma in a list');
  assert.equal(verdict('I think design is basically removing things, and then adding one back', { line: 'I think design is removing things, and then adding one back.' }), 'accept', 'the writer\'s own verbless "and then"');
});

test('validator v4 (hook-11): a later copy of the draft is "clean" only when no earlier version passed', () => {
  /* v5.5: no plain "basically" here: a Claude "unchanged" over one now ships the engine's cut of it (sharpen-ai-v55) */
  const d = 'So we shipped v2 today and signups doubled';
  const a = F(d, { versions: [{ line: 'We shipped v2 today and signups doubled.', why: '' }, { line: d, why: '' }], unchanged: true }).r;
  assert.equal(a.state, 'sharp'); assert.equal(a.line, 'We shipped v2 today and signups doubled.'); assert.equal(a.pick, 0);
  const b = F(d, { versions: [{ line: 'We shipped v2 today and signups tripled.', why: '' }, { line: d, why: 'Already sharp.' }], unchanged: true }).r;
  assert.equal(b.state, 'clean'); assert.equal(b.line, d); assert.equal(b.pick, 1);
  const c = F(d, { versions: [{ line: d, why: '' }, { line: 'We shipped v2 today and signups doubled.', why: '' }], unchanged: false }).r;
  assert.equal(c.state, 'clean', 'version 1 as written is still Claude\'s "already sharp"');
});

test('selection v4 (hook-3): a first version that opens on a run-up gives way to a later passing one that doesn\'t', () => {
  const d = 'I just wanted to say that we shipped v2 today and signups doubled', v1 = 'I just wanted to say: we shipped v2 today and signups doubled.', v2 = 'We shipped v2 today and signups doubled.';
  const a = F(d, { versions: [{ line: v1, why: '' }, { line: v2, why: '' }] });
  assert.equal(a.r.line, v2); assert.equal(a.r.pick, 1); assert.deepEqual(a.r.alts.map(x => x.line), [v1]); assert.equal(a.trace.promoted, 1);
  for (const k of ['line', 'why', 'say', 'move', 'moves', 'cut']) assert.ok(k in a.r.alts[0], `the demoted version is an alt with ${k}`);
  /* an opener and a disclaimer run-up are run-ups too */
  assert.equal(F('So I wanted to share that we shipped v2 today', { versions: [{ line: 'So, we shipped v2 today.' }, { line: 'We shipped v2 today.' }] }).r.line, 'We shipped v2 today.');
  assert.equal(F('not sure who needs to hear this but you dont need a gym to get strong', { versions: [{ line: 'not sure who needs to hear this, but you dont need a gym to get strong' }, { line: 'you dont need a gym to get strong' }] }).r.line, 'you dont need a gym to get strong');
  /* no later version without it: version 1 stays first */
  const b = F(d, { versions: [{ line: v1 }, { line: 'I just wanted to say that we shipped v2 today, and signups doubled.' }] });
  assert.equal(b.r.line, v1); assert.equal(b.r.pick, 0); assert.equal(b.trace.promoted, undefined);
  /* a financial disclaimer is the writer's to keep, a run-up they put back isn't one, and a label frame isn't a run-up */
  assert.equal(F('Not financial advice, but I am honestly still buying $SOL under $150', { versions: [{ line: 'Not financial advice, but I am still buying $SOL under $150.' }, { line: 'I am still buying $SOL under $150.' }] }).r.pick, 0);
  assert.equal(F(d, { versions: [{ line: v1 }, { line: v2 }] }, { keep: ['I just wanted to say'] }).r.line, v1);
  assert.equal(F('Hot take: I really think standups are a waste', { versions: [{ line: 'Hot take: standups are a waste.' }, { line: 'Standups are a waste.' }] }).r.line, 'Hot take: standups are a waste.');
});

test('receipts v4 (hook-4): the say labels come from the diff', () => {
  const S = (t, line) => F(t, { line }).r.say;
  assert.equal(S('not sure about this but you dont need a gym to get strong', 'not sure about this, but you dont need a gym to get strong'), 'Fixed the punctuation', 'a comma is not an end');
  assert.equal(S('you dont need a gym to get strong', 'you dont need a gym to get strong.'), 'Gave it an end');
  assert.doesNotMatch(S('I think it could work, but who knows, I could be wrong lol', 'I think it could work, but who knows? I could be wrong lol'), /Asked, then answered/, '"who knows?" is a tag, not a question');
  assert.match(S('If you are a founder who never posts you should hire a writer', 'A founder who never posts? You should hire a writer.'), /Asked, then answered/);
});

test('receipts v4 (hook-4): a why that says the line now opens on what it already opened on, a run-up that never went, a split that never happened, or a buried number "first" is not shown', () => {
  const W = (t, line, why) => F(t, { line, why }).r.why, d = 'We shipped v2 today and honestly signups doubled', l = 'We shipped v2 today and signups doubled.';
  for (const why of ['It now opens on “We shipped v2 today”.', 'The run-up is gone, so the news leads.', 'Split in two, so the news lands.', 'Already sharp: the news leads.']) assert.notEqual(W(d, l, why), why, why);
  assert.equal(W(d, l, '“honestly” went, so it reads straight.'), '“honestly” went, so it reads straight.');
  const p = 'I just wanted to say that I closed my $PEPE position today for a 4x';
  assert.notEqual(W(p, 'I closed my $PEPE position today for a 4x.', '“I just wanted to say that” went, so the 4x comes first.'), '“I just wanted to say that” went, so the 4x comes first.');
  assert.equal(W('I just wanted to say that a 4x on $PEPE was my best trade', 'A 4x on $PEPE was my best trade.', '“I just wanted to say that” went, so the 4x comes first.'), '“I just wanted to say that” went, so the 4x comes first.');
  /* "starts on" a frame before ", but" is not the point; and the engine's own why is held to the same rule, with a plain one behind it */
  const f = F('So this is personal, but I was laid off today after 6 years', { line: 'This is personal, but I was laid off today after 6 years.', why: 'The run-up is gone, so the line starts on “This is personal”.' }).r.why;
  assert.doesNotMatch(f, /starts on “This is personal”/); assert.ok(f.length > 0 && f.length <= 140);
  const q = F('it could work but who knows, I could be wrong', { line: 'it could work, but who knows? I could be wrong', why: '' }).r.why;
  assert.doesNotMatch(q, /full stop before/, 'there is a question mark there, not a full stop');
  /* a clean line that still needs a hook is "Nothing to cut", not "Already sharp" */
  const sharp = 'Day 47 of building my SaaS in public. 3 paying customers. $87 MRR. Still going.';
  assert.equal(F(sharp, { versions: [{ line: sharp, why: 'Already sharp: the numbers lead. A churn number would make it a hook.' }], unchanged: true }).r.why, 'Nothing to cut: the numbers lead. A churn number would make it a hook.');
  assert.equal(F(sharp, { versions: [{ line: sharp, why: 'Already sharp: the numbers lead.' }], unchanged: true }).r.why, 'Already sharp: the numbers lead.');
});

test('the endpoint ships the promoted version as Claude\'s, with version 1 as the alt (fake client)', async () => {
  const d = 'I just wanted to say that we shipped v2 today and signups doubled', v1 = 'I just wanted to say: we shipped v2 today and signups doubled.', v2 = 'We shipped v2 today and signups doubled.';
  answer = () => reply({ versions: [{ line: v1, why: 'The light edit.' }, { line: v2, why: '“I just wanted to say that” went.' }], unchanged: false });
  const r = await sharpen({ text: d });
  assert.equal(r.source, 'claude'); assert.equal(r.line, v2); assert.equal(r.why, '“I just wanted to say that” went.'); assert.equal(r.pick, 1); assert.deepEqual(r.alts.map(a => a.line), [v1]);
  answer = () => reply({ versions: [{ line: 'We shipped v2 today and signups went up.', why: '' }, { line: d, why: 'Already sharp.' }], unchanged: true });
  const c = await sharpen({ text: d });
  assert.equal(c.source, 'claude'); assert.equal(c.state, 'clean'); assert.equal(c.line, d, 'version 1 lost a fact, so the copy of the draft is the verdict');
});
