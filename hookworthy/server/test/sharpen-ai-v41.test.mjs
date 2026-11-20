/* r86 v4.1: Claude's Sharpen after the round-5 review of v4 (hook4-3, hook4-5, hook4-8). A scope word ("mostly", "often",
   "usually") is kept like a quantifier; where the draft says how sure it is ("I think", "I feel like", "I might be wrong",
   "probably"), version 1 still says so and the bare claim is an alt; on hard news the writer's framing stays in version 1;
   a version that only splits a list header gives way to one that leads with the list; a Claude "clean" verdict has its own
   why, never the on-device text; "Led with the claim" only for a claim that came from a later clause; and the stance note
   says "plan or a forecast" only when the sentence looks ahead. Stand-ins for Claude's JSON and a fake client only: no
   API call is ever made. */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-sh41-'));
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
const F = (t, versions, opts = {}, unchanged = false) => { const trace = {}; const r = core.SHARPEN.fromClaude(t, { versions: vs(versions), unchanged }, { ...opts, trace }); return { r, reject: trace.reject, trace }; };
const verdict = (t, line) => { const { r, reject } = F(t, [line]); return r ? 'accept' : reject; };
const ON_DEVICE = /on-device/i;

test('prompt v4.1: scope words, the writer\'s doubt, hard news and list headers are in the cached instructions; the examples pass and keep their order', () => {
  const sys = core.prompts.sharpen({ text: 'placeholder line' }).cached;
  for (const re of [/A scope word stays with its claim: "mostly", "largely", "partly", "often", "usually", "generally", "sometimes"/, /never a scope word/,
    /* v5.2 (Fable): a degree word now carries the doubt under a stacked opinion frame (sharpen-ai-v52.test.mjs) */
    /where a sentence has one, version 1 keeps at least one/, /A stacked opinion frame is what makes a line soft/, /a stated doubt \("I might be wrong", "I could be wrong"\) always stays/, /The bare claim can be version 2/,
    /On grief, illness, a layoff or other hard news/, /version 1 keeps it and cuts only the padding around it/, /on hard news, rule 4 keeps their framing in version 1/,
    /When the line introduces a list or thread, version 1 leads with what the list is; a version that only splits the header goes second/,
    /every negation and scope word kept/, /or the bare claim when version 1 keeps a hedge of theirs/,
    /Drop a hedge below one per clause/, /version 1 drops it and the light edit goes second/, /Add a fact, number, name, result, time, emoji or hashtag/, /Never make a plan or forecast certain/]) assert.match(sys, re);
  assert.doesNotMatch(sys, /"I feel like it's kind of a mess" → "it's kind of a mess"/, 'v4\'s example that let a degree word stand in for the writer\'s doubt is gone');
  assert.equal(core.prompts.sharpen({ text: 'another line\nwith a rest' }).cached, sys, 'still one cached string');
  const ex = [...sys.matchAll(/<example>\n<line>([\s\S]*?)<\/line>\n(\{[\s\S]*?\})\n<\/example>/g)].map(m => [m[1], JSON.parse(m[2])]);
  assert.ok(ex.length >= 16, `${ex.length} examples`);
  /* v5.3 (Fable g-14, g-28): on a plain view the opinion frame is a run-up, so version 1 drops it and the light edit keeps it
     (sharpen-ai-v53.test.mjs); a stated doubt and every hedge on a call still stay */
  assert.ok(ex.some(([d, x]) => /\bI feel like\b/.test(d) && !/feel like/i.test(x.versions[0].line) && x.versions[1] && /\bI feel like\b/.test(x.versions[1].line)), 'a plain view: the frame goes in v1, the light edit keeps it');
  assert.ok(ex.some(([d, x]) => /diagnosed/.test(d) && /hard to write/.test(x.versions[0].line) && !/wanted to share/.test(x.versions[0].line)), 'hard news keeps its framing, padding cut');
  for (const [d, data] of ex) {
    for (const v of data.versions) { const { r, reject } = F(d, [v], {}, data.unchanged); assert.ok(r, `example rejected: ${d} (${reject})`); assert.equal(r.why, v.why, d); }
    const { r } = F(d, data.versions, {}, data.unchanged); assert.equal(r.pick, 0, `selection keeps the example's order: ${d}`);
  }
});

test('validator v4.1 (hook4-3): a scope word stays while the words it scopes over do', () => {
  const d = "Hot take, but I really think 'thought leadership' is mostly just rebranded blogging.";
  assert.equal(verdict(d, "Hot take: 'thought leadership' is just rebranded blogging."), 'scope "mostly" lost');
  assert.equal(verdict(d, "Hot take: 'thought leadership' is mostly just rebranded blogging."), 'accept');
  assert.equal(verdict('Honestly it is mostly because nobody takes a stance', 'It is because nobody takes a stance.'), 'scope "mostly" lost');
  assert.equal(verdict('Sometimes the best move is to wait', 'The best move is to wait.'), 'scope "sometimes" lost');
  assert.equal(verdict('Generally speaking, cold email still works', 'Cold email still works.'), 'scope "generally" lost');
  assert.equal(verdict('Founders largely underprice their first product', 'Founders underprice their first product.'), 'scope "largely" lost');
  assert.notEqual(verdict('Most startups usually fail because of the founders', 'Most startups fail because of the founders.'), 'accept');
  /* the clause it scoped over went whole: nothing to keep */
  assert.equal(verdict('I often find that the best move is to wait', 'The best move is to wait.'), 'accept');
  assert.equal(verdict('It works, partly. Mostly I just ship it and see', 'It works, partly. Mostly I ship it and see.'), 'accept');
});

test('selection v4.1 (hook4-3): where the draft says how sure it is, a version that still says so goes first; the bare claim is the alt', () => {
  const d = 'I might be wrong, but I feel like most onboarding flows are kind of too long';
  const bare = 'Most onboarding flows are kind of too long.', kept = 'I might be wrong, but most onboarding flows are kind of too long.';
  const a = F(d, [bare, kept]);
  assert.equal(a.r.line, kept); assert.equal(a.r.pick, 1); assert.deepEqual(a.r.alts.map(x => x.line), [bare]); assert.deepEqual(a.trace.promo, ['hedge']);
  for (const k of ['line', 'why', 'say', 'move', 'moves', 'cut']) assert.ok(k in a.r.alts[0], `the bare claim is an alt with ${k}`);
  /* no version keeps one: version 1 still ships (the hard checks are the floor, this is an order) */
  assert.equal(F(d, [bare]).r.line, bare);
  /* a modal kept in the sentence is enough; "I feel like" may go */
  assert.equal(F('Honestly I feel like it was probably the right call', ['It was probably the right call.', 'I feel like it was probably the right call.']).r.pick, 0);
  /* an opinion label stands in for "I think"; IMHO is the frame the prompt cuts; a frame about the post itself is not doubt */
  assert.equal(F('Hot take: I really think standups are a waste', ['Hot take: standups are a waste.', 'Hot take: I think standups are a waste.']).r.pick, 0);
  assert.equal(F('IMHO tabs are honestly better than spaces', ['Tabs are better than spaces.', 'IMHO tabs are better than spaces.']).r.pick, 0);
  assert.equal(F('Not gonna lie, this might sound obvious, but most churn starts in the first week', ['Most churn starts in the first week.', 'This might sound obvious, but most churn starts in the first week.']).r.pick, 0);
  assert.equal(F('This might just be me, but I hate the word content', ['I hate the word content.', 'This might just be me, but I hate the word content.']).r.pick, 0);
  /* a run-up never wins back its place by dropping the writer's doubt */
  const r = F('So I wanted to share that I think we nailed onboarding', ['So, I think we nailed onboarding.', 'We nailed onboarding.']);
  assert.equal(r.r.line, 'So, I think we nailed onboarding.'); assert.equal(r.trace.promoted, undefined);
  /* v5.3 (Fable g-14): once the run-up went, a plain view's "I think" gives way to the same line without it */
  assert.equal(F('So I wanted to share that I think we nailed onboarding', ['So, I think we nailed onboarding.', 'We nailed onboarding.', 'I think we nailed onboarding.']).r.line, 'We nailed onboarding.');
});

test('selection v4.1 (hook4-8): on hard news the writer\'s framing stays in version 1; a decision or good news is not hard news', () => {
  const d = "I've gone back and forth about whether to post this, but my mom was diagnosed with cancer last week";
  const stark = 'My mom was diagnosed with cancer last week.', framed = "I've gone back and forth about whether to post this. My mom was diagnosed with cancer last week.";
  const a = F(d, [stark, framed]);
  assert.equal(a.r.line, framed); assert.deepEqual(a.r.alts.map(x => x.line), [stark]); assert.deepEqual(a.trace.promo, ['hard']);
  /* a framed version 1 is not demoted as a run-up, even when the frame is one the engine marks */
  const b = F("I almost didn't post this, but I was laid off today after 6 years", ["I almost didn't post this. I was laid off today after 6 years.", 'I was laid off today after 6 years.']);
  assert.equal(b.r.pick, 0); assert.equal(b.trace.promoted, undefined);
  assert.equal(F("So this is a little bit personal, but I wanted to share that I was laid off today", ['I was laid off today.', 'This is a little bit personal, but I was laid off today.']).r.line, 'This is a little bit personal, but I was laid off today.');
  /* not hard news: the news-first edit stays first */
  assert.equal(F('Been sitting on this for a while, but I have decided to leave my job after 9 years', ['I have decided to leave my job after 9 years.', 'Been sitting on this for a while. I have decided to leave my job after 9 years.']).r.pick, 0);
  assert.equal(F('I fired a $9k/month client last week, and honestly it was the best month of the year', ['I fired a $9k/month client last week, and it was the best month of the year.', 'I fired a $9k/month client last week. Best month of the year.']).r.pick, 0);
});

test('selection v4.1 (hook4-8): a version that only splits a list header gives way to one that leads with the list', () => {
  const d = 'Ten years of writing taught me a lot, so here are the rules I still follow:';
  const split = 'Ten years of writing taught me a lot. Here are the rules I still follow:', list = 'The rules I still follow after ten years of writing:';
  const a = F(d, [split, list]);
  assert.equal(a.r.line, list); assert.deepEqual(a.r.alts.map(x => x.line), [split]); assert.deepEqual(a.trace.promo, ['list']);
  /* the alt must lead with the list (one sentence, still on its colon), and a version 1 that did more than split stays */
  assert.equal(F(d, [split, 'Ten years of writing taught me a lot. The rules I still follow:']).r.pick, 0);
  assert.equal(F(d, ['Ten years of writing taught me the rules I still follow:', list]).r.pick, 0);
  assert.equal(F('Ten years of writing taught me a lot, so here are the rules I still follow', ['Ten years of writing taught me a lot. Here are the rules I still follow.', 'The rules I still follow after ten years of writing.']).r.pick, 0, 'not a header');
});

test('receipts v4.1 (hook4-5): a Claude "clean" verdict has its own why, never the on-device text', () => {
  const d = "you're not behind. you're just comparing your chapter 3 to someone's chapter 20";
  const ok = F(d, [{ line: d, why: "Already sharp: “you're not behind” first, then “chapter 3” against “chapter 20” lands it." }], {}, true).r;
  assert.equal(ok.state, 'clean'); assert.equal(ok.why, "Already sharp: “you're not behind” first, then “chapter 3” against “chapter 20” lands it.");
  for (const why of ['Already sharp: “chapter 20” comes first.', '', "Already sharp: “someone else's chapter 40” lands it.", `Already sharp: ${'it works '.repeat(16)}`]) {
    const r = F(d, [{ line: d, why }], {}, true).r;
    assert.equal(r.state, 'clean'); assert.equal(r.why, 'Claude kept it as written.', why); assert.doesNotMatch(r.why, ON_DEVICE);
  }
  /* a later copy of the draft that is the verdict (nothing before it passed) is held to the same rule */
  /* v5.5: no plain "basically" here (a Claude "unchanged" over one now ships the engine's cut of it) */
  const r2 = F('So we shipped v2 today and signups doubled', [{ line: 'We shipped v2 today and signups tripled.', why: '' }, { line: 'So we shipped v2 today and signups doubled', why: '' }], {}, true).r;
  assert.equal(r2.state, 'clean'); assert.equal(r2.why, 'Claude kept it as written.');
});

test('receipts v4.1 (hook4-5): "Led with the claim" only for a claim from a later clause of the draft; the stance note says "plan or forecast" only when it is one', () => {
  const S = (t, line) => F(t, [line]).r.say;
  assert.doesNotMatch(S('After ghostwriting for 40+ SaaS founders, I can confidently say most of them are honestly way too scared to post their real opinions.', "I've ghostwritten for 40+ SaaS founders. Most of them are way too scared to post their real opinions."), /Led with the claim/, 'the credential still leads');
  assert.doesNotMatch(S("Let's talk about LinkedIn hooks. I think a lot of people are honestly getting them very wrong.", 'I think a lot of people are getting LinkedIn hooks very wrong.'), /Led with the claim/, 'a cut run-up is not a move');
  assert.match(S('After ten years of trading every market there is, patience beats every indicator I have tried', 'Patience beats every indicator I have tried, after ten years of trading every market there is.'), /Led with the claim/);
  assert.match(S('After 10 years of running ads, the one thing that still works is a plain offer', 'A plain offer still works. That is the one thing I learned in 10 years of running ads.'), /Led with the claim/);
  const N = (t, line) => F(t, [line]).r.note;
  assert.equal(N('Real talk: I feel like most of you are way too levered going into FOMC this week.', 'I feel like most of you are way too levered going into FOMC this week.'), 'Kept your “I feel like”: it’s how sure you are, not filler.');
  assert.equal(N('Real talk: I feel like $ETH will rip next week', 'I feel like $ETH will rip next week.'), 'Kept your “I feel like”: on a prediction, it’s your stance, not filler.');
  assert.equal(N('ok so i think we will ship the beta next week', 'i think we will ship the beta next week'), 'Kept your “i think”: on a plan or a forecast, it’s your stance, not filler.');
});

test('the endpoint ships Claude\'s hedged version over the bare claim, and a clean verdict with its own why (fake client)', async () => {
  const d = 'I might be wrong, but I feel like most onboarding flows are kind of too long';
  answer = () => reply({ versions: [{ line: 'Most onboarding flows are kind of too long.', why: 'The bare claim: both hedges went.' }, { line: 'I might be wrong, but most onboarding flows are kind of too long.', why: '“I feel like” went: “I might be wrong” is the one hedge it needs.' }], unchanged: false });
  const r = await sharpen({ text: d });
  assert.equal(r.source, 'claude'); assert.equal(r.line, 'I might be wrong, but most onboarding flows are kind of too long.'); assert.equal(r.pick, 1);
  assert.equal(r.why, '“I feel like” went: “I might be wrong” is the one hedge it needs.'); assert.deepEqual(r.alts.map(a => a.line), ['Most onboarding flows are kind of too long.']);
  const s = 'Your tests passed. Your users still can’t log in.';
  answer = () => reply({ versions: [{ line: s, why: 'Already sharp: “log in” comes first.' }], unchanged: true });
  const c = await sharpen({ text: s });
  assert.equal(c.source, 'claude'); assert.equal(c.state, 'clean'); assert.equal(c.line, s); assert.equal(c.why, 'Claude kept it as written.');
});
