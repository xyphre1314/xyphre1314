/* r86 v5.5 (pass C5.5): Claude's Sharpen after Fable round 4, tested on the C5.5 held-out lines (scratchpad/r86/engine/
   heldout-c55.json), never on Fable's. On a line with nothing soft in it, a whole sentence or parenthetical the writer chose
   (a self-aware aside, the announcement itself) is never dropped: a version that keeps it goes first, and with none the draft
   ships as written. No intensifier the writer didn't type; of a stacked pair one goes, and a plain "basically" the engine cuts
   goes from Claude's line too (an approximator before a quantity stays). "whether or not X" is "whether X", and a reject names
   the "not" it lost; every real negation loss is still caught. A long line's run-up about the post goes whole, its hedge and its
   "thread" with it. The receipt never counts a reworded frame or a conjunction as a cut, counts what a catch-all why covers, and
   no why opens on a version label. Stand-ins for Claude's JSON and a fake client only: no API call is ever made. */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-sh55-'));
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

test('prompt v5.5: asides and the announcement itself stay, no added intensifier, one of a stack, soft tails and plain "basically" go, the run-up about the post goes whole, no label on a why; the examples pass in order', () => {
  for (const re of [/What the writer chose to say is never padding/, /a self-aware aside or parenthetical/, /a sentence that is the announcement itself \("New issue is out!"\)/, /cut around them, never through them/,
    /A sentence that is the news itself \("New issue is out!", "Episode 40 is live\.", "Applications are open\."\) is no frame/, /- Add an intensifier they didn't type/, /never "LinkedIn has gotten so weird"/,
    /Stacked intensifiers keep one at most/, /A softener in a closing comment on the point/, /"I had basically no idea" → "I had no idea"/, /before a quantity it is an approximator and stays/,
    /A correction of what people believe works the same way/, /A run-up about the post itself/, /its "I think" or "probably" with it/, /on hard news it is their framing: rule 4/, /Never open it with a label for the version/,
    /* what earlier passes rely on is still there */
    /An announcement frame is a run-up too/, /version 1 opens on the news itself/, /it never moves to the end/, /A stock phrase that is the writer's own/, /On a forecast, plan or price call keep every hedge/]) assert.match(sys, re);
  assert.doesNotMatch(sys, /"New episode is out now!"\): version 1 opens/, 'the announcement itself is no longer listed as a frame');
  const ex = [...sys.matchAll(/<example>\n<line>([\s\S]*?)<\/line>\n(\{[\s\S]*?\})\n<\/example>/g)].map(m => [m[1], JSON.parse(m[2])]);
  for (const [, data] of ex) for (const v of data.versions) assert.doesNotMatch(v.why, /^\s*(?:the\s+)?(?:light edit|bare claim|claim alone|news alone|fact alone)\b/i, `no label: ${v.why}`);
  const find = re => ex.find(([d]) => re.test(d));
  const aside = find(/talking to past me/), issue = find(/^New issue is out!/), stack = find(/really really hard to hire/);
  assert.ok(aside && aside[1].unchanged && aside[1].versions[0].line === aside[0], 'a sharp line keeps its aside, unchanged');
  assert.ok(issue && /^New issue is out!/.test(issue[1].versions[0].line) && !/a few other things/.test(issue[1].versions[0].line), 'the announcement stays, the filler goes');
  assert.ok(stack && !/actually|really really|pretty/.test(stack[1].versions[0].line) && /really hard/.test(stack[1].versions[0].line), 'one intensifier, no softener on the closing comment');
  for (const [d, data] of ex) {
    for (const v of data.versions) { const { r, reject } = F(d, [v], data.unchanged); assert.ok(r, `example rejected: ${d} (${reject})`); assert.equal(r.why, v.why, d); }
    assert.equal(F(d, data.versions, data.unchanged).r.pick, 0, `selection keeps the example's order: ${d}`);
  }
});

test('H7 v5.5: a sharp line keeps its aside and its announcement; a version that keeps them goes first; a sentence that only announces or tags may still go', () => {
  /* held-out q-0, q-1, q-4, q-6: the only version drops what the writer chose, on a line with no run-up or filler: the draft ships */
  for (const [d, l] of [["Remote work didn't kill culture. Bad managers did. (Yes, I'm aware this will annoy some of you.)", "Remote work didn't kill culture. Bad managers did."],
    ['Nobody reads your About page. They read your pricing page. (Harsh, I know.)', 'Nobody reads your About page. They read your pricing page.'],
    ['New issue is out! Why most onboarding emails get ignored, and the 3-line fix. Link below 👇', 'Why most onboarding emails get ignored, and the 3-line fix. Link below 👇'],
    ["Your first 100 customers won't come from ads. They'll come from your DMs. (Ask me how I know.)", "Your first 100 customers won't come from ads. They'll come from your DMs."]]) {
    const { r, trace } = F(d, [{ line: l, why: 'The tag went, so it ends on the point.' }]);
    assert.equal(r.state, 'clean'); assert.equal(r.line, d); assert.equal(r.say, 'Nothing to cut'); assert.match(r.why, /^Kept as written: nothing pads it, and “.+” is yours, so it stays\.$/); assert.deepEqual(trace.promo, ['kept']);
  }
  /* held-out q-3: a later version that keeps the announcement goes first */
  const d3 = 'New episode is out! This week I talk with @sahilbloom about habits, money and a bunch of other stuff 🎙️';
  const a = F(d3, ['This week I talk with @sahilbloom about habits, money and a bunch of other stuff 🎙️', 'New episode: @sahilbloom on habits, money and a bunch of other stuff 🎙️']);
  assert.equal(a.r.line, 'New episode: @sahilbloom on habits, money and a bunch of other stuff 🎙️'); assert.equal(a.r.pick, 1); assert.deepEqual(a.trace.promo, ['kept']);
  /* held-out q-7: the aside is kept by a line that needed work, and the run-up still goes */
  const d7 = 'So I finally did it, I quit my job today (I know, I know, everyone said I was crazy)';
  const b = F(d7, ['I finally quit my job today.', 'I finally quit my job today (I know, I know, everyone said I was crazy)']);
  assert.equal(b.r.line, 'I finally quit my job today (I know, I know, everyone said I was crazy)');
  /* a sentence that only announces, a pointer said in fewer words, and a cut the engine marks still go */
  assert.equal(F("Some personal news!! I'm joining @linear as a designer next month", ["I'm joining @linear as a designer next month!!"]).r.line, "I'm joining @linear as a designer next month!!");
  assert.equal(F('I never use stop losses on spot positions. Here is the reasoning behind it', ["I never use stop losses on spot positions. Here's why:"]).r.line, "I never use stop losses on spot positions. Here's why:");
  assert.equal(F('Long post incoming. We shut down the company today.', ['We shut down the company today.']).r.line, 'We shut down the company today.');
});

test('H8 v5.5: no intensifier the writer didn\'t type; a "so" that joins clauses is not one', () => {
  /* held-out q-12, q-13, q-16, q-19 (the C5.4-prompt answers) */
  assert.equal(verdict('i just really feel like we need to talk about how strange twitter has become lately', 'twitter has become so strange lately'), 'intensifier "so" added');
  assert.equal(verdict("I've been noticing how expensive eating out has gotten in the last year", 'Eating out has gotten so expensive in the last year.'), 'intensifier "so" added');
  assert.equal(verdict('I keep thinking about how quiet the office has been since we went hybrid', 'The office has been so quiet since we went hybrid.'), 'intensifier "so" added');
  assert.equal(verdict('I want to point out how fast the AI coding tools have improved in the last 6 months', 'AI coding tools have improved so fast in the last 6 months.'), 'intensifier "so" added');
  assert.equal(verdict('It took me a long time to learn this', 'It took me so long to learn this.'), 'intensifier "so" added');
  assert.equal(verdict('This is a really good point', 'This is a very good point.'), 'intensifier "very" added');
  /* the after answers, and what was always fine */
  assert.equal(verdict('i just really feel like we need to talk about how strange twitter has become lately', 'we need to talk about how strange twitter has become lately'), 'accept');
  assert.equal(verdict("I've been noticing how expensive eating out has gotten in the last year", 'Eating out has gotten expensive in the last year.'), 'accept');
  assert.equal(verdict('So we shipped it and it broke', 'We shipped it, so it broke.'), 'accept');
  assert.equal(verdict('Our new pricing page is literally so much clearer than the old one', 'Our new pricing page is so much clearer than the old one.'), 'accept');
  /* the endpoint: version 1 adds "so", the light edit ships */
  const r = F('i just really feel like we need to talk about how strange twitter has become lately', ['twitter has become so strange lately', { line: 'we need to talk about how strange twitter has become lately', why: 'The light edit: only “i just really feel like” went.' }]).r;
  assert.equal(r.line, 'we need to talk about how strange twitter has become lately'); assert.equal(r.why, 'Only “i just really feel like” went.', 'and its label is gone');
});

test('H8 v5.5: of a stacked pair one goes; a plain "basically" the engine cuts goes from Claude\'s line too; an approximator stays', () => {
  /* held-out q-20 (the C5.4-prompt answer kept "actually totally"): the word the engine marks goes */
  const a = F('Reminder that most startups fail and that\'s actually totally okay', ["Reminder: most startups fail, and that's actually totally okay."]);
  assert.equal(a.r.line, "Reminder: most startups fail, and that's actually okay."); assert.deepEqual(a.trace.promo, ['topup']); assert.match(a.r.why, /“totally”/);
  /* a doubled word loses its second; "just" is a restrictor, never half of a stack */
  assert.equal(F('It is really really hard to hire well', ['It is really really hard to hire well.']).r.line, 'It is really hard to hire well.');
  assert.equal(F('Why is it that nobody ever mentions how much of sales is really just listening?', ['Why does nobody ever mention how much of sales is really just listening?']).r.line, 'Why does nobody ever mention how much of sales is really just listening?');
  /* held-out q-38 as an "unchanged": the engine's cut of "basically" ships, with a true why */
  const d = 'Our first launch was basically a disaster, but we learned a lot from it';
  const b = F(d, [{ line: d, why: 'Already sharp: the disaster and the lesson.' }], true);
  assert.equal(b.r.state, 'sharp'); assert.equal(b.r.line, 'Our first launch was a disaster, but we learned a lot from it'); assert.match(b.r.say, /^Cut 1 bit of fluff/); assert.match(b.r.why, /“basically”/); assert.deepEqual(b.trace.promo, ['topup']);
  /* held-out q-41, q-36 and an absolute a few words on: the approximator stays, so does Claude's verdict */
  for (const t of ['My first year running the agency I made basically zero profit', 'When I started freelancing I had basically no clients and no idea how to find them', 'Shoutout to my mentor for basically teaching me everything I know about sales']) {
    const c = F(t, [{ line: t, why: '' }], true).r; assert.equal(c.state, 'clean', t); assert.equal(c.line, t);
  }
});

test('H8 v5.5: a soft tail may go; a correction of a belief loses its "really", and a real softened negation still holds', () => {
  /* held-out q-28, q-29, q-30, q-33 */
  assert.equal(verdict('Our churn dropped by half after we added onboarding calls, which is kind of interesting if you think about it', 'Our churn dropped by half after we added onboarding calls, which is interesting.'), 'accept');
  assert.equal(verdict("Got rejected by 30 investors before we closed the round, and I think there's a pretty good lesson in that", "Got rejected by 30 investors before we closed the round. There's a good lesson in that."), 'accept');
  assert.equal(verdict("Most people think you need a co-founder to raise a seed round, but that's not really true", "Most people think you need a co-founder to raise a seed round. That's not true."), 'accept');
  assert.equal(verdict("There are a lot of people who think that you need a big audience to make money from a newsletter, but that's not really true", "A lot of people think you need a big audience to make money from a newsletter. That's not true."), 'accept');
  assert.equal(verdict("Everyone says you need to post daily to grow on LinkedIn, but I don't think that's really the case", "Everyone says you need to post daily to grow on LinkedIn. I don't think that's the case."), 'accept');
  /* no belief corrected, or a softened act: "not really" stays */
  assert.equal(verdict('This is not really true for most teams', 'This is not true for most teams.'), '"not really" lost');
  assert.equal(verdict("I didn't really train for this marathon", "I didn't train for this marathon."), '"didn\'t really" lost');
  assert.equal(verdict("Most people think it's easy, but I'm not really sure", "Most people think it's easy, but I'm not sure."), '"not really" lost');
});

test('H9 v5.5: "whether or not X" is "whether X", "like it or not" is an idiom, a reject names the "not"; every real negation loss still rejects', () => {
  /* held-out q-42, q-43, q-48, q-49, q-46 and Fable's m-38 shape */
  for (const [d, l] of [['At the end of the day, what really matters is whether or not your users actually come back', 'What matters is whether your users come back.'],
    ['Honestly the real question is whether or not you can sell it before you build it', 'The real question is whether you can sell it before you build it.'],
    ['The hardest part is deciding whether or not to quit your job to go full time', 'The hardest part is deciding whether to quit your job to go full time.'],
    ["Nobody cares whether or not you went to Stanford once you've shipped something real", "Nobody cares whether you went to Stanford once you've shipped something real."],
    ["It doesn't really matter whether you post daily or not, what matters is consistency", "It doesn't really matter whether you post daily. What matters is consistency."],
    ['Whether or not you like it, AI is going to change how we write code', 'Like it or not, AI is going to change how we write code.']]) assert.equal(verdict(d, l), 'accept', l);
  /* the losses: the message names the negation and the word it negated */
  assert.equal(verdict("I'm still not sure whether or not we should raise a seed round this year", "I'm still sure whether we should raise a seed round this year."), 'negation "not" of "sure" lost');
  assert.equal(verdict("It doesn't matter whether or not you have a degree", 'It matters whether you have a degree.'), 'negation "doesn\'t" of "matter" lost', '"matter" and "matters" are one word');
  assert.equal(verdict("Whether or not you like it, AI won't replace you", 'Whether you like it, AI will replace you.'), 'negation "won\'t" of "replace" lost');
  assert.equal(verdict('We are not raising a round this year', 'We are raising a round this year.'), 'negation "not" of "raising" lost');
  assert.equal(verdict('At the end of the day, what matters is not whether your customers renew', 'What matters is whether your customers renew.'), 'negation "not" of "whether" lost', 'the word it negated, never a pronoun or possessive');
  assert.notEqual(verdict('Whether you like it or not, nobody reads long intros', 'Whether you like it, people read long intros.'), 'accept', '"nobody" went');
  assert.equal(verdict('Whether we post daily matters', 'Whether or not we post daily matters.'), 'accept', 'writing "or not" adds no negation');
  assert.equal(verdict('Posting daily matters', 'Posting daily does not matter.'), 'negation added');
});

test('long lines v5.5: a run-up about the post goes whole, its "probably" and its "thread" with it; a hedge on a claim never does', () => {
  /* held-out q-57: "write this thread" sat in the run-up the line cut */
  const d57 = "I've wanted to write this thread for months now and I kept telling myself I'd do it next week, but here it finally is: everything I learned from running 214 paid ad experiments on Meta over the last two years, including the creative formats that worked, the ones that flopped, and how much we spent in total.";
  const l57 = 'Everything I learned from running 214 paid ad experiments on Meta over the last two years: the creative formats that worked, the ones that flopped, and how much we spent in total.';
  assert.ok(core.xLength(d57) > 280 && core.xLength(l57) <= 280); assert.equal(verdict(d57, l57), 'accept');
  assert.equal(verdict('I wrote a thread on how we price', 'I wrote about how we price.'), 'pointer lost', 'a kept clause keeps its pointer');
  /* Fable's m-115 shape: "it's probably time to finally tell" is the run-up's doubt about posting */
  const d = "So I've been wanting to write this for ages, and I wasn't sure whether I should, but I've decided it's probably time to finally tell the story of how I quit law after nine years";
  assert.equal(verdict(d, 'The story of how I quit law after nine years:'), 'accept');
  assert.equal(verdict("This has been on my mind for a really long time and I think I'm finally ready to talk about it publicly: I'm stepping away from startups", "I'm stepping away from startups."), 'accept');
  /* a hedge on the claim itself stays */
  assert.equal(verdict("It's probably time to sell your ETH and move to stables", 'Sell your ETH and move to stables.'), 'hedge "probably" lost');
  assert.equal(verdict('I think we will ship the API next month', 'We will ship the API next month.'), 'hedge "I think" lost');
});

test('H10 v5.5: a reworded frame is no cut, a conjunction is never listed as one, a catch-all why counts what it covers, no label opens a why, a trailing quote names its run', () => {
  /* held-out q-50: "Just a quick reminder that" → "Reminder:" was reworded */
  const r50 = F('Just a quick reminder that 80% of your revenue probably comes from 20% of your customers and that\'s totally normal', [{ line: "Reminder: 80% of your revenue probably comes from 20% of your customers, and that's totally normal.", why: '“Just a quick reminder that” is “Reminder:” now, so the 80% comes fast. “probably” stays.' }]).r;
  assert.doesNotMatch(r50.say, /Cut \d/); assert.match(r50.say, /^Tightened it/);
  /* a why that lists “, but” as gone is not shipped */
  const r51 = F('I spent 3 years building a product nobody wanted, but honestly it was the best education I could have gotten', [{ line: 'I spent 3 years building a product nobody wanted. But it was the best education I could have gotten.', why: '“, but” and “honestly” went.' }]).r;
  assert.doesNotMatch(r51.why, /“,? ?but”/i); assert.match(r51.why, /“honestly”/);
  const ok51 = F('I spent 3 years building a product nobody wanted, but honestly it was the best education I could have gotten', [{ line: 'I spent 3 years building a product nobody wanted. But it was the best education I could have gotten.', why: '“honestly” went, and the long line splits at “but”, so the turn lands last.' }]).r;
  assert.equal(ok51.why, '“honestly” went, and the long line splits at “but”, so the turn lands last.', 'a “but” that is not said to have gone is fine');
  /* held-out q-56: "the run-up and “honestly” went" counts the run-up's cuts too */
  const d56 = "Okay so this is going to be a long one, and I've gone back and forth about whether I should even post it, but after a lot of reflection I've decided it's time to talk openly about why we turned down a $20M acquisition offer last spring, what it cost us, and why I would honestly do it again.";
  const r56 = F(d56, [{ line: "Why we turned down a $20M acquisition offer last spring, what it cost us, and why I'd do it again:", why: 'The run-up and “honestly” went, so it opens on the $20M offer and fits in 280.' }]).r;
  assert.equal(r56.why, 'The run-up and “honestly” went, so it opens on the $20M offer and fits in 280.'); assert.ok(+(r56.say.match(/Cut (\d+)/) || [0, 0])[1] >= 2, r56.say);
  /* held-out q-54: the light edit ships first, without its label */
  const r54 = F('I really don\'t think you need to have a big following to start a newsletter', ['You don\'t need a big following to start a newsletter.', { line: 'I don\'t think you need a big following to start a newsletter.', why: 'The light edit: “really” and “to have” went, and “I don\'t think” stays.' }]).r;
  assert.equal(r54.pick, 1); assert.equal(r54.why, '“really” and “to have” went, and “I don\'t think” stays.');
  /* held-out q-58: a quote that trails off names the whole run-up; never a lone "went too" */
  const d58 = 'Not sure if anyone is actually interested in this but I figured I would share it anyway, because I think it might help someone: last year I applied to 112 product manager jobs, got 9 interviews and 1 offer, and I kept a spreadsheet of every single rejection reason I got along the way.';
  const w58 = '“Not sure if anyone is actually interested…” went, so it opens on the 112 applications and fits in 280.';
  assert.equal(F(d58, [{ line: 'Last year I applied to 112 product manager jobs, got 9 interviews and 1 offer, and kept a spreadsheet of every rejection reason I got along the way.', why: w58 }]).r.why, w58);
  const lone = F(d58, [{ line: 'Last year I applied to 112 product manager jobs, got 9 interviews and 1 offer, and kept a spreadsheet of every rejection reason I got along the way.', why: '“Not sure if anyone is actually interested” went.' }]).r.why;
  assert.match(lone, /^“Not sure if anyone is actually interested”/, lone);
  /* held-out q-7: a quote that spans a kept word, and an engine quote cut off inside a bracket never ships */
  const r7 = F('So I finally did it, I quit my job today (I know, I know, everyone said I was crazy)', [{ line: 'I finally quit my job today (I know, I know, everyone said I was crazy)', why: '“So” and “I finally did it,” went, and “finally” moved into the news.' }]).r;
  assert.equal(r7.why, '“So” and “I finally did it,” went, and “finally” moved into the news.');
  assert.doesNotMatch(F('So I finally did it, I quit my job today (I know, I know, everyone said I was crazy)', ['I finally quit my job today (I know, I know, everyone said I was crazy)']).r.why, /“[^”]*\([^)”]*”/);
  /* "Led with the ticker" only on a ticker */
  const r19 = F('I want to point out how fast the AI coding tools have improved in the last 6 months', ['AI coding tools have improved fast in the last 6 months.']).r;
  assert.doesNotMatch(r19.say, /ticker/i); assert.doesNotMatch(r19.why, /traders/);
  assert.match(F('I think this year ETH is going to outperform', ['ETH is going to outperform this year, I think.']).r.say, /Led with the ticker/);
});

test('the endpoint v5.5 (fake client): an aside dropped from a sharp line comes back as written; a plain "basically" under "unchanged" is cut', async () => {
  const d = "Remote work didn't kill culture. Bad managers did. (Yes, I'm aware this will annoy some of you.)";
  answer = () => reply({ versions: [{ line: "Remote work didn't kill culture. Bad managers did.", why: 'The closing disclaimer went.' }], unchanged: false });
  const a = await sharpen({ text: d });
  assert.equal(a.source, 'claude'); assert.equal(a.state, 'clean'); assert.equal(a.line, d); assert.equal(a.say, 'Nothing to cut');
  const t = 'Our first launch was basically a disaster, but we learned a lot from it';
  answer = () => reply({ versions: [{ line: t, why: 'Already sharp.' }], unchanged: true });
  const b = await sharpen({ text: t });
  assert.equal(b.source, 'claude'); assert.equal(b.state, 'sharp'); assert.equal(b.line, 'Our first launch was a disaster, but we learned a lot from it');
});
