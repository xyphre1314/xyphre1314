/* r86 v5.2 (pass C5.2): Claude's Sharpen after the Fable 5.2 juror. A stacked opinion frame ("I think" on a clause that
   already has another hedge) goes and the other hedge carries the doubt, so the stronger version ships; a stated doubt
   ("I might be wrong") always stays; "!!!" and a pile of three or more hashtags are trimmed, never called "Already sharp";
   a version over 280 keeps every fact and moves the sentences past 280 to post 2; and the receipt comes from the real
   diff. Stand-ins for Claude's JSON and a fake client only: no API call is ever made. */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-sh52-'));
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

test('prompt v5.2: stacked frames, hashtag piles, "!!!", lines over 280 and the stronger version first are in the cached instructions; the new examples pass', () => {
  const sys = core.prompts.sharpen({ text: 'placeholder line' }).cached;
  for (const re of [/A stacked opinion frame is what makes a line soft/, /that other hedge carries their doubt/, /A frame that is its clause's only hedge stays/,
    /a stated doubt \("I might be wrong", "I could be wrong"\) always stays where they put it/, /a "do you think" after it goes/, /A softener on an absolute stays/,
    /Three or more "!" become "!!"/, /a pile of three or more hashtags at the end keeps only the one or two most specific/, /never add or invent a tag/,
    /"!!!" or a pile of three or more hashtags/, /6\. A line over 280 characters: version 1 fits in 280\. Cut padding first/, /the rest can be post 2/,
    /When a stronger version passes every check below, it is version 1/, /On a forecast, plan or price call keep every hedge/]) assert.match(sys, re);
  assert.equal(core.prompts.sharpen({ text: 'another line\nwith a rest' }).cached, sys, 'still one cached string');
  const ex = new Map([...sys.matchAll(/<example>\n<line>([\s\S]*?)<\/line>\n(\{[\s\S]*?\})\n<\/example>/g)].map(m => [m[1], JSON.parse(m[2])]));
  const stack = [...ex].find(([d]) => /pricing pages/.test(d)), pile = [...ex].find(([d]) => /#marathon/.test(d)), long = [...ex].find(([d]) => core.xLength(d) > 280);
  assert.ok(stack && !/feel like/i.test(stack[1].versions[0].line) && /a little bit/.test(stack[1].versions[0].line), 'the stacked frame goes, the degree word stays');
  assert.ok(pile && (pile[1].versions[0].line.match(/#\w+/g) || []).length === 2 && /!!(?!!)/.test(pile[1].versions[0].line), 'the pile is down to two of the writer\'s tags, "!!!" is "!!"');
  assert.ok(long && core.xLength(long[1].versions[0].line) <= 280, 'the long example fits in 280');
  for (const [d, data] of [stack, pile, long]) { const { r, reject } = F(d, data.versions); assert.ok(r, `${d} (${reject})`); assert.equal(r.why, data.versions[0].why); assert.equal(r.pick, 0); }
});

test('selection v5.2: a version 1 that keeps a stacked opinion frame gives way to the passing version without it', () => {
  const d = 'Honestly I think most standups are kind of a waste of time';
  const framed = 'I think most standups are kind of a waste of time.', lean = 'Most standups are kind of a waste of time.';
  const a = F(d, [framed, lean]);
  assert.equal(a.r.line, lean); assert.deepEqual(a.r.alts.map(x => x.line), [framed]); assert.deepEqual(a.trace.promo, ['frame']);
  /* a scope word, "tend to" and "in my experience" count the same */
  assert.equal(F('In my experience, launch dates usually slip by a month', ['In my experience, launch dates usually slip by a month.', 'Launch dates usually slip by a month.']).r.pick, 1);
  assert.equal(F('I think founders tend to hire too fast', ['I think founders tend to hire too fast.', 'Founders tend to hire too fast.']).r.pick, 1);
  /* v5.3 (Fable g-14, g-28, g-68): the frame is the clause's only hedge on a plain view: it is a run-up there, so the same line
     without it goes first. On a call, a plan or a forecast it stays first (below) */
  assert.equal(F('Honestly I think most standups are a waste of time', ['I think most standups are a waste of time.', 'Most standups are a waste of time.']).r.pick, 1);
  /* a doubt in another clause is not a stack ("though I could be wrong" stays where they put it) */
  assert.equal(F('Honestly I think cold email still works, though I could be wrong', ['I think cold email still works, though I could be wrong.', 'Cold email still works, though I could be wrong.']).r.pick, 0);
  /* a stated doubt is never the hedge to drop: a version without it is bare */
  const dd = 'I might be wrong, but I am starting to suspect that podcasts do not really grow newsletters';
  assert.equal(F(dd, ['Podcasts do not really grow newsletters.', 'I might be wrong, but podcasts do not really grow newsletters.']).r.pick, 1);
  /* never on a call, a plan or a forecast: every hedge stays */
  assert.equal(F('Honestly I think $SOL could probably retest $120 this week', ['I think $SOL could probably retest $120 this week.', '$SOL could probably retest $120 this week.']).r.pick, 0);
  assert.equal(F('ngl I think we will probably ship it in march', ['I think we will probably ship it in march.', 'We will probably ship it in march.']).r.pick, 0);
  /* a label frames the ask: an inner "do you think" is the stack */
  assert.equal(F('Quick question: do you think that podcasts still grow newsletters?', ['Quick question: do you think podcasts still grow newsletters?', 'Quick question: do podcasts still grow newsletters?']).r.pick, 1);
  /* a negated "I don't think" carries the "not": never a frame */
  assert.equal(F("Honestly I don't think standups are usually worth it", ["I don't think standups are usually worth it.", 'Standups are usually not worth it.']).r.pick, 0);
});

test('validator v5.2: a hashtag pile may go down to one or two of the writer\'s own tags; "!!!" may become "!!"', () => {
  const d = 'Shipped my first iOS app today!!! 🎉 #iosdev #swiftui #buildinpublic #startup';
  assert.equal(verdict(d, 'Shipped my first iOS app today!! 🎉 #iosdev'), 'accept');
  assert.equal(verdict(d, 'Shipped my first iOS app today!! 🎉 #iosdev #swiftui'), 'accept');
  assert.equal(verdict(d, 'Shipped my first iOS app today! 🎉'), 'fact "#iosdev" lost', 'every tag gone is a lost fact');
  assert.match(verdict(d, 'Shipped my first iOS app today!! 🎉 #iosdev #swiftui #startup'), /lost/, 'three of four is not a trim');
  assert.match(verdict(d, 'Shipped my first iOS app today!! 🎉 #iosdev #apps'), /added/, 'no invented tag');
  assert.match(verdict(d, 'Shipped my first #iosdev app today!! 🎉'), /lost/, 'a kept tag stays at the end');
  /* two tags are not a pile: both stay */
  assert.match(verdict('Shipped my first iOS app today!!! #iosdev #swiftui', 'Shipped my first iOS app today!! #iosdev'), /lost/);
  const r = F(d, [{ line: 'Shipped my first iOS app today!! 🎉 #iosdev', why: '“!!!” is “!!” now, and “#swiftui #buildinpublic #startup” went: #iosdev says what this is.' }]).r;
  assert.equal(r.why, '“!!!” is “!!” now, and “#swiftui #buildinpublic #startup” went: #iosdev says what this is.');
  assert.deepEqual(r.kept.filter(k => k.startsWith('#')), ['#iosdev'], 'the receipt keeps only the tags that stayed');
  /* a clean verdict on a pile or "!!!" is never "Already sharp" */
  for (const t of [d, 'We hit 1,000 users!!!']) {
    const c = F(t, [{ line: t, why: 'Already sharp: the news comes first.' }], {}, true).r;
    assert.equal(c.state, 'clean'); assert.doesNotMatch(c.why, /already sharp/i); assert.match(c.why, /would read cleaner/);
  }
});

test('long lines v5.2: a version over 280 that keeps every fact ships its first sentences as the hook and the rest as post 2', () => {
  const d = 'So about two years ago I quit my job at a big bank to start a tiny design studio with my best friend, and honestly for the first eight months we made basically nothing, but last month we signed our biggest client yet, and I wanted to write down every single mistake that we made along the way because I think it might save someone else a year';
  assert.ok(core.xLength(d) > 280);
  const v = 'About two years ago I quit my job at a big bank to start a tiny design studio with my best friend. For the first eight months we made basically nothing. Last month we signed our biggest client yet. I wanted to write down every single mistake we made along the way because I think it might save someone else a year.';
  assert.ok(core.xLength(v) > 280);
  const a = F(d, [{ line: v, why: '“So” and “honestly” went, and the run-on is four sentences.' }]).r;
  const [head, tail] = a.line.split('\n\n');
  assert.ok(core.xLength(head) <= 280, head); assert.ok(tail && tail.startsWith('I wanted to write down'), tail);
  assert.equal(a.post2, tail); assert.equal(`${head} ${tail}`, v, 'every word kept, in order');
  assert.equal(a.why, '“So” and “honestly” went, and the run-on is four sentences. The rest can be post 2.');
  assert.ok(a.long, 'the long note still offers the thread');
  /* a version that fits ships whole; a draft under 280 is never split */
  const fit = 'About two years ago I quit my job at a big bank to start a tiny design studio with my best friend. For the first eight months we made basically nothing. Last month we signed our biggest client yet. Here is every mistake we made along the way:';
  assert.equal(verdict(d, fit), 'accept'); assert.equal(F(d, [fit]).r.line, fit);
  const short = 'So honestly the first eight months we made basically nothing, and last month we signed our biggest client yet';
  assert.doesNotMatch(F(short, ['The first eight months we made basically nothing. Last month we signed our biggest client yet.']).r.line, /\n/);
});

test('validator v5.2: "It\'s not that X is bad" may become "X isn\'t bad"; "was going to" is a "would"', () => {
  const d = "It's not that meetings are bad, it's just that most of them could be an email";
  assert.equal(verdict(d, "Meetings aren't bad. Most of them could be an email."), 'accept');
  assert.equal(verdict(d, 'Meetings are not bad. Most of them could be an email.'), 'accept');
  assert.match(verdict(d, 'Meetings are bad. Most of them could be an email.'), /negation/);
  const f = 'I honestly thought the hard part was going to be the code';
  assert.equal(verdict(f, 'I thought the hard part would be the code.'), 'accept');
  assert.equal(verdict('I think the hard part will be the code', 'I think the hard part would be the code.'), 'future lost');
});

test('receipts v5.2: the why and the say come from the real diff', () => {
  /* a word said to have gone went once, while another copy stays */
  const d = 'PSA that the new API is out and I am genuinely kind of excited that it finally has webhooks';
  const r = F(d, [{ line: "PSA: the new API is out. I'm kind of excited that it finally has webhooks.", why: '“that” and “genuinely” went, and it splits into two beats.' }]).r;
  assert.equal(r.why, '“that” and “genuinely” went, and it splits into two beats.');
  /* a cut the word diff lists but the line still has is not struck, and is not counted as fluff */
  const q = F('Why is it that nobody ever mentions how much of sales is really just listening?', ['Why does nobody ever mention how much of sales is really just listening?']).r;
  assert.ok(q.cut.every(c => !/^(?:really|just)$/i.test(c.text.trim())), JSON.stringify(q.cut)); assert.doesNotMatch(q.say, /fluff/);
  /* "first" is said of the quotes beside it, up to a comma */
  const s = 'Revenue went from $8k to $40k. No ads. No launch. Just one email.';
  assert.equal(F(s, [{ line: s, why: 'Already sharp: $8k to $40k leads, the two “No” beats build, and “Just one email.” lands it.' }], {}, true).r.why, 'Already sharp: $8k to $40k leads, the two “No” beats build, and “Just one email.” lands it.');
  /* "became" names the new words: they are in the line */
  const b = F('I think the reason that most onboarding fails is that it asks for too much', [{ line: 'Most onboarding fails because it asks for too much.', why: '“I think” went and “the reason that… is that” became “because”.' }]).r;
  assert.equal(b.why, '“I think” went and “the reason that… is that” became “because”.');
  /* a padding word the why leaves out is named */
  const p = F('We basically just doubled our prices and nobody left', [{ line: 'We doubled our prices and nobody left.', why: 'Same claim, said plainly.' }]).r;
  assert.match(p.why, /“basically just” went too\./);
  /* a short lowercase opener before a capitalised sentence keeps the capital */
  assert.equal(F("gm. In today's thread I'm covering the 3 charts I check every morning", ['gm. The 3 charts I check every morning:']).r.line, 'gm. The 3 charts I check every morning:');
  assert.equal(F('gm. so here are the 3 charts i check every morning', ['gm. The 3 charts I check every morning:']).r.line, 'gm. the 3 charts i check every morning:');
});

test('the endpoint ships the stronger version over a stacked frame, and moves the sentences past 280 to post 2 (fake client)', async () => {
  const d = 'Honestly I feel like most landing pages are a little bit too long';
  answer = () => reply({ versions: [{ line: 'I feel like most landing pages are a little bit too long.', why: 'The light edit: only “Honestly” went.' }, { line: 'Most landing pages are a little bit too long.', why: '“Honestly” and “I feel like” went: “a little bit” already softens it.' }], unchanged: false });
  const r = await sharpen({ text: d });
  assert.equal(r.source, 'claude'); assert.equal(r.line, 'Most landing pages are a little bit too long.'); assert.equal(r.pick, 1);
  const L = 'So about two years ago I quit my job at a big bank to start a tiny design studio with my best friend, and honestly for the first eight months we made basically nothing, but last month we signed our biggest client yet, and I wanted to write down every single mistake that we made along the way because I think it might save someone else a year';
  answer = () => reply({ versions: [{ line: 'About two years ago I quit my job at a big bank to start a tiny design studio with my best friend. For the first eight months we made basically nothing. Last month we signed our biggest client yet. I wanted to write down every single mistake we made along the way because I think it might save someone else a year.', why: '“So” and “honestly” went.' }], unchanged: false });
  const s = await sharpen({ text: L });
  assert.equal(s.source, 'claude'); assert.ok(core.xLength(s.line.split('\n\n')[0]) <= 280); assert.match(s.why, /post 2/);
});
