/* r86 v5.4 (pass C5.4): Claude's Sharpen after Fable round 3, tested on the C5.4 held-out lines (scratchpad/r86/engine/
   heldout-c54.json), never on Fable's. The validator reads a fact as a number and its head noun (a dropped adjective is a cut,
   never a new fact), a unit in its short form and an age without "years old"; a thread's own run-up keeps no future of its own,
   even with an adverb ("I'm also going to share"); "imo" and "I'd argue" are opinion frames, kept on calls; a stance sits on its
   own clause; "my two cents" is no number; a preposition a verb leaves at the end is English. Every real loss is still caught.
   On a line over 280 a version that fits goes first, and one still over 280 with its run-up never ships. The why names whole
   phrases or counts small words, the receipt counts what really went, "Already sharp" is only for a line with nothing soft left,
   and the generic two-beats why is only for a real split. The prompt opens on the news, makes a "why" topic a header, keeps the
   writer's stock phrase, and cuts "pretty much" / "kind of" with the tag on a plain view. Stand-ins for Claude's JSON and a fake
   client only: no API call is ever made. */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-sh54-'));
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
const verdict = (t, line) => { const { r, reject } = F(t, [line]); return r ? 'accept' : reject; };
const sys = core.prompts.sharpen({ text: 'placeholder line' }).cached;

test('prompt v5.4: announcements open on the news, a "why" topic is a header, the writer\'s stock phrase stays, a plain view loses "pretty much" with its tag; the examples pass in order', () => {
  for (const re of [/An announcement frame is a run-up too/, /version 1 opens on the news itself/, /it never moves to the end/, /a "finally" in it moves into the news/,
    /is a header, so it ends on a colon/, /never a fragment with a full stop/, /A stock phrase that is the writer's own/, /never trade it for another/,
    /On a plain view, a "pretty much" or "kind of" before the claim goes with the opinion tag/, /it stays before an absolute, a superlative or a number/,
    /When the line opens on a run-up or an announcement, version 1 is the restructure/, /a trim that keeps the run-up is never version 1/,
    /* what earlier passes rely on is still there */
    /A feeling that only walks up to the result goes/, /"finally" carries the news/, /On a forecast, plan or price call keep every hedge/, /Never make a plan or forecast certain/, /A stacked opinion frame is what makes a line soft/]) assert.match(sys, re);
  assert.doesNotMatch(sys, /So happy to finally announce it/, 'the example that parked the announcement at the end is gone');
  assert.doesNotMatch(sys, /seamless, game-changer\)/, '"game-changer" is no longer an AI word to swap');
  assert.equal(core.prompts.sharpen({ text: 'another line\nwith a rest' }).cached, sys, 'still one cached string');
  const ex = [...sys.matchAll(/<example>\n<line>([\s\S]*?)<\/line>\n(\{[\s\S]*?\})\n<\/example>/g)].map(m => [m[1], JSON.parse(m[2])]);
  const find = re => ex.find(([d]) => re.test(d));
  const ann = find(/Chrome extension/), why = find(/moved off Kubernetes/), stock = find(/Obsidian/), view = find(/^Cold plunges are kind of overrated/);
  assert.ok(ann && /^Our Chrome extension is finally live/.test(ann[1].versions[0].line) && !/announce/i.test(ann[1].versions[0].line), 'the news opens, "finally" moved into it, nothing parked at the end');
  assert.ok(why && /:$/.test(why[1].versions[0].line) && /^Why /.test(why[1].versions[0].line), 'a "why" topic ends on a colon');
  assert.ok(stock && /game changer/.test(stock[1].versions[0].line), 'the writer\'s phrase stays');
  assert.ok(view && !/kind of|opinion/.test(view[1].versions[0].line) && /kind of/.test(view[1].versions[1].line), 'the tag and "kind of" go in v1; the light edit keeps "kind of"');
  for (const [d, data] of ex) {
    for (const v of data.versions) { const { r, reject } = F(d, [v], data.unchanged); assert.ok(r, `example rejected: ${d} (${reject})`); assert.equal(r.why, v.why, d); }
    assert.equal(F(d, data.versions, data.unchanged).r.pick, 0, `selection keeps the example's order: ${d}`);
  }
});

test('validator v5.4: a fact is a number and its head noun; units and ages have their short forms; a real loss is still caught', () => {
  /* held-out h-45, h-51: an adjective between the number and its noun went */
  assert.equal(verdict("I've interviewed over 30 different SaaS founders and almost all of them regret hiring too fast", "I've interviewed over 30 SaaS founders. Almost all of them regret hiring too fast."), 'accept');
  assert.equal(verdict("I've written for 12 amazing B2B companies in the last year and every single one of them asked for the same thing", "I've written for 12 B2B companies in the last year. Every single one of them asked for the same thing."), 'accept');
  /* held-out h-46, h-47, h-52: an age with or without "years old" */
  assert.equal(verdict("I'm 52 years old and I just ran my first ultramarathon. Here's what I actually did differently:", "I'm 52 and just ran my first ultramarathon. Here's what I did differently:"), 'accept');
  assert.equal(verdict('She was 24 years old when she sold her first company for $3M', 'At 24, she sold her first company for $3M.'), 'accept');
  assert.equal(verdict('She was 24 years old when she sold her first company for $3M', 'She was 24 when she sold her first company for $3M.'), 'accept');
  assert.equal(verdict('My grandmother is 91 years old and still walks 5 kilometers every single morning', 'My grandmother is 91 and still walks 5 km every single morning.'), 'accept');
  assert.equal(verdict('I lost 25 pounds in 4 months without ever counting a single calorie', 'I lost 25 lbs in 4 months without ever counting a single calorie.'), 'accept');
  /* real losses */
  assert.equal(verdict('She was 24 years old when she sold her first company for $3M', 'She was 42 when she sold her first company for $3M.'), 'fact "24 years old" lost');
  assert.equal(verdict('It took me 43 years to learn this', 'It took me 43 to learn this.'), 'fact "43 years" lost', '"years" is an age only with "old"');
  assert.equal(verdict('I ran 10 miles this morning', 'I ran 10 this morning.'), 'fact "10 miles" lost');
  assert.equal(verdict('We have 5k paying users', 'We have 5k users.'), 'fact "5k paying users" lost', 'an adjective that carries a fact never goes');
  assert.match(verdict('We have 5 users and 3 paying customers', 'We have 5 paying customers.'), /lost|added/, 'no word skipped across "and" or a number');
  assert.equal(verdict("I've interviewed over 30 different SaaS founders", "I've interviewed 30 SaaS founders."), 'qualifier "over 30" lost');
  assert.match(verdict("I've interviewed over 30 different SaaS founders", "I've interviewed over 30 founders."), /lost/, 'the name went');
  assert.match(verdict("I've interviewed over 30 different founders", "I've interviewed over 30 different SaaS founders."), /added/, 'and none is added');
  assert.match(verdict('I ran 5 kilometers this morning', 'I ran 5k this morning.'), /added/, '"5k" is five thousand, not 5 km');
});

test('validator v5.4: a thread\'s run-up keeps no future of its own; a plan with its time marker does', () => {
  const d = "In this thread, I'm going to walk you through exactly how we got our first 500 customers without a marketing budget, and I'm also going to share the cold DM script we used, the pricing mistake that cost us two whole months, and the one channel I would double down on if I had to start again";
  assert.equal(verdict(d, "In this thread: exactly how we got our first 500 customers without a marketing budget, the cold DM script we used, the pricing mistake that cost us two whole months, and the one channel I'd double down on if I had to start again."), 'accept');
  assert.equal(verdict(d, "We got our first 500 customers without a marketing budget. In this thread: exactly how, the cold DM script we used, the pricing mistake that cost us two whole months, and the one channel I'd double down on if I had to start again."), 'accept');
  assert.equal(verdict('Over the next few posts I\'m going to break down the 3 mistakes that almost killed our startup', 'The 3 mistakes that almost killed our startup:'), 'accept');
  /* a pointer verb with the writer's own time marker is a plan (held-out h-53) */
  const plan = "I'm going to share my exact revenue numbers next week, including the stuff that didn't work";
  assert.equal(verdict(plan, "Next week I'm sharing my exact revenue numbers, including the stuff that didn't work."), 'accept');
  assert.equal(verdict(plan, 'I shared my exact revenue numbers, including the stuff that didn\'t work.'), 'future lost');
  /* a clause survives on its claim, not on its "going to" or its time marker */
  assert.equal(verdict("I'm also going to quit my job next month", 'I quit my job.'), 'future lost');
  assert.equal(verdict("I'm going to quit my job", "I'm quitting my job."), 'future lost', 'no time marker, no scheduled present');
});

test('validator v5.4: "imo" and "I\'d argue" are frames on a plain view and stay on calls; a stance sits on its own clause; "my two cents" is no number; a stranded preposition is English', () => {
  /* held-out h-31, h-35, h-36, h-34, h-29 */
  assert.equal(verdict('Tailwind is kind of overkill for small landing pages imo', 'Tailwind is overkill for small landing pages.'), 'accept');
  assert.equal(verdict("I'd argue that sleep is kind of the most important part of any training plan", 'Sleep is kind of the most important part of any training plan.'), 'accept');
  assert.equal(verdict('IMO running a newsletter is kind of the best way to build trust with an audience', 'Running a newsletter is kind of the best way to build trust with an audience.'), 'accept');
  assert.equal(verdict('Notion templates are pretty much a waste of money, just my two cents', 'Notion templates are a waste of money.'), 'accept');
  assert.equal(verdict('Creatine is kind of the only supplement worth paying for, at least in my opinion', 'Creatine is kind of the only supplement worth paying for.'), 'accept');
  /* and the losses */
  assert.equal(verdict('imo $ETH flips $BTC this cycle', '$ETH flips $BTC this cycle.'), 'hedge "imo" lost');
  assert.equal(verdict("I'd argue we will ship the API next month", 'We will ship the API next month.'), 'hedge "I think" lost');
  assert.equal(verdict('Creatine is kind of the only supplement worth paying for, at least in my opinion', 'Creatine is the only supplement worth paying for.'), 'approximator lost', '"kind of the only" stays');
  assert.equal(verdict('I only spent two hours on this, just my two cents', 'I only spent hours on this.'), 'number word lost');
  assert.equal(verdict('I wanted to share the one thing I could never get right', 'The one thing I could never get right and.'), 'dangling end');
  /* a stance on a plain view, then a forecast of its own after "and I"; a stance on a plan stays */
  assert.equal(verdict("I think that a lot of startups have massively overbuilt their onboarding and I don't really see it getting simpler anytime soon", "A lot of startups have massively overbuilt their onboarding. I don't really see it getting simpler anytime soon."), 'accept');
  assert.equal(verdict('I think we will ship the API next month and I think it will work', 'We will ship the API next month and I think it will work.'), 'hedge "I think" lost');
  /* a time marker dates the stance only when it stands right before it */
  assert.equal(verdict("This week I'm covering why I think paid podcasts are sort of struggling right now", "This week: why paid podcasts are sort of struggling right now."), 'accept');
  assert.equal(verdict("Next week I think I'm quitting my job", "Next week I'm quitting my job."), 'hedge "I think" lost');
});

test('long lines v5.4: a version that fits goes first; one still over 280 with its run-up never ships, and the fallback is under 280', async () => {
  const d = "In this thread, I'm going to walk you through exactly how we got our first 500 customers without a marketing budget, and I'm also going to share the cold DM script we used, the pricing mistake that cost us two whole months, and the one channel I would double down on if I had to start again";
  const keepRun = "In this thread, I'm going to walk you through exactly how we got our first 500 customers without a marketing budget, and I'm also going to share the cold DM script we used, the pricing mistake that cost us two whole months, and the one channel I'd double down on if I had to start again.";
  const fits = "In this thread: exactly how we got our first 500 customers without a marketing budget, the cold DM script we used, the pricing mistake that cost us two whole months, and the one channel I'd double down on if I had to start again.";
  assert.ok(core.xLength(d) > 280 && core.xLength(keepRun) > 280 && core.xLength(fits) <= 280);
  const a = F(d, [keepRun, fits]);
  assert.equal(a.r.line, fits); assert.deepEqual(a.trace.promo, ['fit']);
  assert.equal(a.r.alts.length, 0, 'the over-280 run-up is no alt either');
  const b = F(d, [keepRun]);
  assert.equal(b.r, null); assert.equal(b.reject, 'over 280 with its run-up');
  answer = () => reply({ versions: [{ line: keepRun, why: '' }], unchanged: false });
  const res = await sharpen({ text: d });
  assert.equal(res.source, 'rules'); assert.ok(core.xLength(res.line) <= 280, `the fallback fits: ${core.xLength(res.line)}`);
  answer = () => reply({ versions: [{ line: fits, why: '“I\'m going to walk you through” and “I\'m also going to share” went, so it fits in 280 with every fact.' }], unchanged: false });
  const ok = await sharpen({ text: d });
  assert.equal(ok.source, 'claude'); assert.equal(ok.line, fits);
});

test('whys and receipts v5.4: whole phrases or "N small words", counts from the diff, "Already sharp" only when nothing soft is left, the two-beats why only on a split', () => {
  /* held-out h-55: the why may quote the "not" in "don't"; its count is what went */
  const d55 = "unpopular opinion but i really don't think you need to post every single day to grow";
  const w55 = '“unpopular opinion” already says it\'s your view, so “i really don\'t think” went and the “not” moved onto the claim.';
  const r55 = F(d55, [{ line: "unpopular opinion: you don't need to post every single day to grow", why: w55 }]).r;
  assert.equal(r55.why, w55); assert.match(r55.say, /^Cut 1 bit of fluff/);
  /* the engine's why for the same line never appends a piece of a phrase */
  const e55 = F(d55, ["unpopular opinion: you don't need to post every single day to grow"]).r;
  assert.doesNotMatch(e55.why, /“but i(?: really)?”/); assert.doesNotMatch(e55.why, /“[^”]*\b(?:but|a)”/);
  /* held-out h-56: "went" holds for its own clause, so the count is three, not four */
  const d56 = "TIL that you can actually just press cmd+k in Slack to jump to any channel and it's honestly a huge time saver";
  const r56 = F(d56, [{ line: 'TIL you can just press cmd+k in Slack to jump to any channel. Huge time saver.', why: '“that”, “actually” and “honestly” went, and “it\'s” is gone too, so “Huge time saver.” is its own beat.' }]).r;
  assert.ok(r56); assert.doesNotMatch(r56.why, /“honestly a”|“a huge”/);
  const r56b = F(d56, [{ line: 'TIL you can just press cmd+k in Slack to jump to any channel. It\'s a huge time saver.', why: '“that”, “actually” and “honestly” went, and “a huge time saver” is its own beat.' }]).r;
  assert.match(r56b.say, /^Cut 3 bits of fluff/);
  /* "Already sharp" belongs to a line with nothing soft in it (held-out h-48); a kept hedge or stance says "Nothing cut:" (h-57's shape) */
  const sharp = F('I lost 25 pounds in 4 months without ever counting a single calorie', [{ line: 'I lost 25 pounds in 4 months without ever counting a single calorie', why: 'Already sharp: the 25 pounds and the 4 months lead, and the calorie lands it.' }], true).r;
  assert.match(sharp.why, /^Already sharp:/);
  const soft = F('In my opinion, most NFT projects are probably going to zero, and honestly that is fine', [{ line: 'In my opinion, most NFT projects are probably going to zero, and honestly that is fine', why: 'Already sharp: it\'s a forecast, so the hedges stay.' }], true).r;
  assert.match(soft.why, /^Nothing cut: it's a forecast/); assert.match(soft.say, /^Nothing cut · \d your call$/);
  /* held-out h-4's shape: a line that moved its words never gets the generic two-beats why */
  const r4 = F('Very excited to announce that we\'ve raised a $6M Series A led by @northzone', ["We've raised a $6M Series A led by @northzone. Very excited to announce it."]).r;
  assert.ok(r4); assert.doesNotMatch(r4.why, /Two short beats with a full stop between them/);
  /* a sentence that is only a link is no beat */
  const r58 = F('Shipped dark mode for our iOS app today, it took way longer than expected https://example.com/dark', [{ line: 'Shipped dark mode for our iOS app today. It took way longer than expected. https://example.com/dark', why: 'The comma splice is two sentences now, in your order.' }]).r;
  assert.equal(r58.why, 'The comma splice is two sentences now, in your order.'); assert.match(r58.say, /Split it into two beats/);
  /* an alt's "went too", shipped first, says "went" */
  const r30 = F('Honestly I feel like most onboarding emails are a little bit too long', ['I feel like most onboarding emails are a little bit too long.', { line: 'Most onboarding emails are a little bit too long.', why: 'The bare claim: “I feel like” went too.' }]).r;
  assert.equal(r30.line, 'Most onboarding emails are a little bit too long.'); assert.match(r30.why, /^“I feel like”(?: and “Honestly”)? went\b(?! too)/, 'v5.5: and no "The bare claim:" label');
});

test('held-out replay v5.4: the stand-in\'s post-change replies ship their version 1 through the endpoint', async () => {
  const rows = [
    ["We're beyond excited to announce that our Android app is finally live on the Play Store 🎉", 'Our Android app is finally live on the Play Store 🎉', "Beyond excited to announce our Android app is finally live on the Play Store 🎉"],
    ['Today I want to share a little bit about why we stopped doing annual plans', 'Why we stopped doing annual plans:', "We stopped doing annual plans. Here's why:"],
    ['Switching to a standing desk was honestly such a game changer for my lower back', 'Switching to a standing desk was a game changer for my lower back.', null],
    ['I personally think that remote work is kind of overrated for junior developers', 'Remote work is overrated for junior developers.', 'I think remote work is kind of overrated for junior developers.'],
    ["It's finally here!! The new dashboard is live for every user on the Pro plan", 'The new dashboard is finally live for every user on the Pro plan.', null]
  ];
  for (const [t, v1, v2] of rows) {
    answer = () => reply({ versions: [{ line: v1, why: '' }, ...(v2 ? [{ line: v2, why: '' }] : [])], unchanged: false });
    const r = await sharpen({ text: t });
    assert.equal(r.source, 'claude', t); assert.equal(r.line, v1, t);
    assert.ok(!/excited to announce it|thrilled to share it/i.test(r.line), 'nothing parked at the end');
  }
});
