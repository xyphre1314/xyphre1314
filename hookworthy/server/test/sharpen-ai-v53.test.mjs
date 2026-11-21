/* r86 v5.3 (pass C5.3): Claude's Sharpen after Fable round 2. On a plain view (no forecast, plan or call) an opinion frame
   ("I think", "In my opinion", "I personally think") is a run-up, so version 1 drops it and the light edit keeps it; a modal,
   a stated doubt, "I don't think" and every hedge on a call still stay. "basically just" and intensifiers go, "There are N"
   leads with the count's subject, a question stays a question, "finally" stays, a long post drops its meta opener. The
   validator reads four tense- or meaning-equivalents on Claude's line only (a correction's "not really … it's actually", a
   negated opinion under a kept label, a scheduled present with the writer's time marker, "only" before the verb that takes
   the number) and a date inside an "if" as advice. The receipt comes from the diff and agrees with the why: "Number first"
   only when a figure now leads, the beat count the line reads in, the cuts the why names; and a kept hedge is a "your call"
   mark, as on the engine's path. Stand-ins for Claude's JSON and a fake client only: no API call is ever made. */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-sh53-'));
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
const calls = r => (r.marks || []).filter(m => m[3] === 'call').map(m => r.draft.slice(m[0], m[1]));

test('prompt v5.3: the plain-view frame, intensifiers, the count first, questions, "finally", feelings, corrections and meta openers are in the cached instructions; the examples pass and keep their order', () => {
  const sys = core.prompts.sharpen({ text: 'placeholder line' }).cached;
  for (const re of [/An opinion frame \("I think", "I believe", "I personally think", "In my opinion", "I feel like", "I would argue"\) on a plain view/, /is a run-up, not doubt: version 1 drops it/,
    /the light edit that keeps it is version 2/, /The hedges that say how likely something is/, /stays on a forecast, plan or call/, /"basically just" and "really just" when the claim reads the same/,
    /"really" stays when the degree is the claim/, /lead with the count's subject/, /A question stays a question/, /"finally" carries the news/, /A feeling that only walks up to the result goes/,
    /In a correction \("X is not really Y, it's actually Z"\)/, /a meta opener \("Long post incoming\."/, /unless its "not" moves onto the claim/, /the feat leads/, /can end its first beat there/,
    /On a plain view, version 1 drops the opinion frame/, /a plain view's opinion frame is not a hedge/,
    /* the rules earlier passes rely on are still there */
    /A stacked opinion frame is what makes a line soft/, /a stated doubt \("I might be wrong", "I could be wrong"\) always stays/, /On a forecast, plan or price call keep every hedge/, /Never make a plan or forecast certain/]) assert.match(sys, re);
  assert.equal(core.prompts.sharpen({ text: 'another line\nwith a rest' }).cached, sys, 'still one cached string');
  const ex = [...sys.matchAll(/<example>\n<line>([\s\S]*?)<\/line>\n(\{[\s\S]*?\})\n<\/example>/g)].map(m => [m[1], JSON.parse(m[2])]);
  const find = re => ex.find(([d]) => re.test(d));
  const plain = find(/^I personally think that most cold emails/), fore = find(/AI agents are going to replace/), corr = find(/^Churn is not really/), count = find(/^Here are 7 tools/), q = find(/^Why does nobody talk about/), onb = find(/onboarding flows are way too long/);
  assert.ok(plain && !/think/i.test(plain[1].versions[0].line) && /^I think/.test(plain[1].versions[1].line), 'a plain view: the frame goes in v1, the light edit keeps it');
  assert.ok(fore && /^I think/.test(fore[1].versions[0].line), 'a forecast keeps "I think"');
  assert.ok(corr && !/really|actually/.test(corr[1].versions[0].line) && /\bnot\b/.test(corr[1].versions[0].line), 'a correction loses its emphasis, never its "not"');
  assert.ok(count && /^7 tools/.test(count[1].versions[0].line), 'the count leads');
  assert.ok(q && /\?$/.test(q[1].versions[0].line) && /nobody talk about/.test(q[1].versions[0].line), 'a question stays a question');
  assert.ok(onb && !/feel like/i.test(onb[1].versions[0].line), 'the onboarding example now drops its plain-view frame');
  for (const [d, data] of ex) {
    for (const v of data.versions) { const { r, reject } = F(d, [v], {}, data.unchanged); assert.ok(r, `example rejected: ${d} (${reject})`); assert.equal(r.why, v.why, d); assert.ok(v.why.length <= 140, d); }
    assert.equal(F(d, data.versions, {}, data.unchanged).r.pick, 0, `selection keeps the example's order: ${d}`);
  }
});

test('selection v5.3: on a plain view a version 1 that opens on an opinion frame gives way to the same line without it; a bare version 1 is never demoted for it', () => {
  for (const [d, framed, lean] of [
    ['I personally think that most landing pages are way too long', 'I personally think most landing pages are way too long.', 'Most landing pages are way too long.'],
    ['In my opinion, most standups should be a Slack message', 'In my opinion, most standups should be a Slack message.', 'Most standups should be a Slack message.'],
    ['I really believe that good onboarding beats good marketing', 'I believe good onboarding beats good marketing.', 'Good onboarding beats good marketing.'],
    ['honestly i feel like the best founders are the ones who stay boring', 'i feel like the best founders are the ones who stay boring', 'the best founders are the ones who stay boring']]) {
    const a = F(d, [framed, lean]); assert.equal(a.r.line, lean, d); assert.deepEqual(a.trace.promo, ['view'], d); assert.deepEqual(a.r.alts.map(x => x.line), [framed]);
    const b = F(d, [lean, framed]); assert.equal(b.r.line, lean, d); assert.equal(b.trace.promo, undefined, `${d}: the bare claim is not demoted`);
  }
  /* never on a call, a plan or a forecast; never past a stated doubt or a negated stance; a modal still counts */
  assert.equal(F('I think $ETH flips $BTC this cycle', ['I think $ETH flips $BTC this cycle.', '$ETH flips $BTC this cycle.']).r.line, 'I think $ETH flips $BTC this cycle.');
  assert.equal(F('I think we will ship the API next month', ['I think we will ship the API next month.', 'We will ship the API next month.']).r.pick, 0);
  assert.equal(F('I might be wrong, but I think most cold DMs get ignored', ['I might be wrong, but I think most cold DMs get ignored.', 'Most cold DMs get ignored.']).r.pick, 0);
  assert.equal(F("I don't think you need a logo before your first customer", ["I don't think you need a logo before your first customer.", "You don't need a logo before your first customer."]).r.pick, 0);
  assert.equal(F('Honestly I feel like it was probably the right call', ['It was the right call.', 'It was probably the right call.']).r.line, 'It was probably the right call.', 'a modal is doubt: the bare claim gives way');
  /* a "might" about the post itself is not a plan: the provocation frame stays and "I think" may go */
  assert.equal(F('This might get me some hate but I really think most people should lift', ['This might get me some hate, but most people should lift.', 'I think most people should lift.']).r.pick, 0);
});

test('validator v5.3: a correction, a negated opinion under its label, a scheduled present, "only" before the verb and an "if" date are equivalents; the real losses are not', () => {
  const rows = [
    /* a correction's "really ... actually" is emphasis; a soft "not really" elsewhere is not */
    ["Burnout is not really a time problem, it's actually a meaning problem", "Burnout isn't a time problem. It's a meaning problem.", 'accept'],
    ['Sales and marketing alignment is not really a strategy problem, it\'s actually a comp plan problem', "Sales and marketing alignment isn't a strategy problem. It's a comp plan problem.", 'accept'],
    ["Burnout is not really a time problem, it's actually a meaning problem", "Burnout is a time problem. It's a meaning problem.", /negation/],
    ['SEO is not really dead, they just changed the rules', 'SEO is not dead. They just changed the rules.', '"not really" lost'],
    ["I didn't really train for this marathon", "I didn't train for this marathon.", "\"didn't really\" lost"],
    /* the label is the hedge only while the line keeps it, and the "not" lands on the claim */
    ["Unpopular opinion: I don't really think you need a newsletter to grow", "Unpopular opinion: you don't need a newsletter to grow.", 'accept'],
    ["Hot take but I don't think most startups need a CFO", "Hot take: most startups don't need a CFO.", 'accept'],
    ["hot take but i don't really think you need a morning routine. you need a reason to get up", "hot take: you don't need a morning routine. you need a reason to get up", 'accept'],
    ["Hot take: I don't think you need a website", "You don't need a website.", 'stance "I don\'t think" lost'],
    ["Hot take: I don't think you need a website", 'Hot take: you need a website.', 'stance "I don\'t think" lost'],
    ["Honestly I don't really think you need a cofounder", "You don't need a cofounder.", 'stance "I don\'t think" lost'],
    /* a scheduled present keeps the future only with the writer's own time marker */
    ["Just a quick note to say that I'm going to be moving the newsletter from Substack to @beehiiv next week #newsletter #creatoreconomy", "I'm moving the newsletter from Substack to @beehiiv next week #newsletter #creatoreconomy", 'accept'],
    ["Quick heads up that I'm going to be launching the course next Tuesday", "I'm launching the course next Tuesday.", 'accept'],
    ['We will be moving our office to Austin next month', "We're moving our office to Austin next month.", 'accept'],
    ["I'm going to quit my job", "I'm quitting my job.", 'future lost'],
    ["I'm going to move to Lisbon next week", 'I moved to Lisbon next week.', 'future lost'],
    ['We will launch v2 tomorrow', 'We launch v2 tomorrow.', 'future lost'],
    /* "only" and "just" may stand before the verb that takes the number; "almost" may not */
    ['There are basically only 3 things that you really need to do in order to build muscle after the age of 40', 'You basically only need to do 3 things to build muscle after 40:', 'accept'],
    ['There are only 2 metrics that you need to track in your first year', 'You only need to track 2 metrics in your first year.', 'accept'],
    ['I lost almost 40 lbs in a year', 'I almost lost 40 lbs in a year.', 'qualifier "almost 40" lost'],
    /* a date inside an "if" is advice; a dated plan keeps its stance */
    ['I really believe that if you want to grow a newsletter in 2025 you need to just pick one channel and go all in on it', 'If you want to grow a newsletter in 2025, pick one channel and go all in on it.', 'accept'],
    ['I think if you want to grow on LinkedIn in 2026 you need to post every day', 'If you want to grow on LinkedIn in 2026, post every day.', 'accept'],
    ['I think we ship v2 in May', 'We ship v2 in May.', 'stance "I think" lost'],
    ['I think if we raise in March we will hire two engineers', 'If we raise in March we will hire two engineers.', 'hedge "I think" lost'],
  ];
  for (const [t, line, want] of rows) { const v = verdict(t, line); if (want instanceof RegExp) assert.match(v, want, t); else assert.equal(v, want, t); }
});

test('receipts v5.3: "Number first" only when a figure now leads; the beat count is the line\'s; the cut count is what the why names; a punctuation edit says which', () => {
  /* "One of the" is not a number, and a line that opens on "I'm" did not put one first */
  const a = F('I think that one of the biggest mistakes that I made as a first-time founder was hiring too quickly before we had product-market fit', ['I think one of the biggest mistakes I made as a first-time founder was hiring too quickly before we had product-market fit.']).r;
  assert.doesNotMatch(a.say, /Number first/); assert.ok(!(a.moves || []).includes('number')); assert.notEqual(a.move, 'number');
  assert.doesNotMatch(F("I've been sober for 1,000 days today and I wanted to share a few things that I've learned along the way", ["I'm 1,000 days sober today. A few things I've learned along the way:"]).r.say, /Number first/);
  assert.match(F('Here are 9 things I wish someone had told me before I started my company:', ['9 things I wish someone had told me before I started my company:']).r.say, /Number first/);
  assert.match(F('There are 5 pricing mistakes that almost every SaaS founder makes', ['5 pricing mistakes almost every SaaS founder makes:']).r.say, /^Number first/);
  /* a greeting opener is not a beat: the say counts what the why counts */
  const g = F('gm. so basically the fed is probably not going to cut rates in march and i think that\'s actually bullish for btc 🧵', [{ line: "gm. the fed is probably not going to cut rates in march. i think that's actually bullish for btc 🧵", why: '“so basically” went and it’s two beats. “probably” and “i think” stay: it’s a call. 🧵 still ends it.' }]).r;
  assert.match(g.say, /Split it into two beats/); assert.equal(g.why, '“so basically” went and it’s two beats. “probably” and “i think” stay: it’s a call. 🧵 still ends it.');
  /* a why that miscounts the beats is not shipped */
  const k = F('Honestly the best hire I made was a part-time designer', [{ line: 'The best hire I made was a part-time designer.', why: 'It is three beats now.' }]).r;
  assert.notEqual(k.why, 'It is three beats now.');
  /* the say counts the spans the why names as gone */
  for (const [d, v] of [
    ['so um i wrote 100 essays in 100 days and here are some of the things that i learned along the way', { line: 'some of the things i learned writing 100 essays in 100 days:', why: '“so um”, “along the way” and “and here are” went.' }],
    ['So I ran every single day for 365 days straight and these are the 6 things that nobody warned me about', { line: '6 things nobody warned me about after running every single day for 365 days straight:', why: '“So”, “that” and “and these are the” went.' }],
    ['There are basically only 3 things that you really need to do in order to build muscle after the age of 40', { line: 'There are basically only 3 things you need to do to build muscle after the age of 40.', why: 'Only “that”, “really” and “in order” went. Your opener stays.' }]]) {
    /* the count is the spans the shipped why says went (a cut it left out is added to it), never fewer than Claude's three */
    const r = F(d, [v]).r, n = +(r.say.match(/Cut (\d+) bits? of fluff/) || [0, 0])[1], q = new Set([...r.why.matchAll(/“([^”]+)”/g)].map(m => m[1].toLowerCase()).filter(x => !/^(?:your opener)$/.test(x)));
    assert.ok(n >= 3, `${d}: ${r.say}`); assert.ok(r.why.startsWith(v.why), r.why);
    const gone = [...q].filter(x => r.draft.toLowerCase().split(x).length > r.line.toLowerCase().split(x).length);
    assert.equal(n, gone.length, `${d}: ${r.say} | ${r.why}`);
  }
  /* "both spare “that”s" names two cuts */
  assert.match(F('I think that one of the biggest mistakes that I made as a first-time founder was hiring too quickly before we had product-market fit', [{ line: 'One of the biggest mistakes I made as a first-time founder was hiring too quickly before we had product-market fit.', why: '“I think” and both spare “that”s went: it’s a plain view, so the claim says it.' }]).r.say, /^Cut 3 bits of fluff/);
  /* a cut the why leaves out, beside cuts it names, is named too */
  const h = F('honestly i think the best thing i ever did for my career was quitting the job everyone told me to keep', [{ line: 'the best thing i ever did for my career was quitting the job everyone told me to keep', why: 'The bare claim: “i think” went too.' }]).r;
  assert.match(h.why, /“honestly” went too\./); assert.match(h.say, /^Cut 2 bits of fluff/);
  /* a why that names no cut is left as it is */
  assert.equal(F('So basically we raised a $2.5M seed round led by @a16z', [{ line: 'We raised a $2.5M seed round led by @a16z.', why: '“We raised a $2.5M seed round” comes first, so the news leads.' }]).r.why, '“We raised a $2.5M seed round” comes first, so the news leads.');
  /* an emoji before a new capital ends a sentence, so "two sentences" is true; a punctuation-only edit says which */
  const d = 'PART 2 of the story is below ⬇️ if you missed part 1 it\'s pinned on my profile', l = "PART 2 of the story is below ⬇️ If you missed part 1, it's pinned on my profile.";
  assert.equal(F(d, [{ line: l, why: 'The run-on is two sentences, so ⬇️ ends the first. A hint of what happens in part 2 would make it a hook.' }]).r.why, 'The run-on is two sentences, so ⬇️ ends the first. A hint of what happens in part 2 would make it a hook.');
  const p = F(d, [l]).r;
  assert.equal(p.why, 'Same words, new punctuation: a new sentence at “If”, a comma after “part 1” and a full stop at the end.'); assert.doesNotMatch(p.why, /said more directly|one glance/);
  /* "its first beat" names a part of the line, not a word that opens it */
  const f = F('I think AI is not going to replace programmers anytime soon, but it will most likely replace programmers who refuse to use it', [{ line: 'I think AI is not going to replace programmers anytime soon. But it will most likely replace programmers who refuse to use it.', why: 'The long line ends its first beat at “but”, so the turn lands on its own. “I think” and “most likely” stay: it’s a forecast.' }]).r;
  assert.equal(f.why, 'The long line ends its first beat at “but”, so the turn lands on its own. “I think” and “most likely” stay: it’s a forecast.');
});

test('call marks v5.3: a hedge or stance Claude\'s line keeps is a "your call" mark, never a cut, and the say counts it', () => {
  const m = F('i think $BTC might hit 120k by march, so you should probably watch it', [{ line: 'i think $BTC might hit 120k by march, so you should probably watch it', why: 'Already sharp: a call with its hedges.' }], {}, true).r;
  assert.equal(m.state, 'clean'); assert.equal(m.say, 'Nothing cut · 2 left to you'); assert.deepEqual(calls(m), ['i think', 'probably']);
  assert.ok(m.calls.every(c => c.line && c.line !== m.draft && c.draftAt));
  const s = F('ngl I think $SOL could maybe retest $150 next week', ['I think $SOL could retest $150 next week.']).r;
  assert.match(s.say, / · 1 left to you$/); assert.deepEqual(calls(s), ['I think']); assert.ok(s.cut.every(c => !/^I think$/i.test(c.text.trim())));
  /* a stance Claude cut is not a call; a "think" that says how they think is not a stance */
  const b = F('Honestly I think most pitch decks are too long', ['Most pitch decks are too long.']).r;
  assert.doesNotMatch(b.say, /left to you/); assert.deepEqual(calls(b), []);
  const c = F('Here are 12 books that completely changed how I think about money:', ['12 books that completely changed how I think about money:']).r;
  assert.doesNotMatch(c.say, /left to you/); assert.deepEqual(calls(c), []);
  /* the top version and each alt count their own calls */
  const a = F('Honestly I think most hiring mistakes are probably made in the first call', ['Most hiring mistakes are probably made in the first call.', 'I think most hiring mistakes are probably made in the first call.']).r;
  assert.deepEqual(calls(a), ['probably']); assert.match(a.say, / · 1 left to you$/);
  for (const x of a.alts) { const n = +((x.say.match(/ · (\d+) left to you$/) || [0, 0])[1]); assert.equal(n, x.calls.length, x.line); }
});

test('generalisation v5.3: 46 lines of the families above, each shipping (or refusing) as the rules say', () => {
  const ship = (t, v, u) => { const { r, reject } = F(t, v, {}, u); return r ? r.line : `REJECT ${reject}`; };
  const rows = [
    ['Most growth hacks are basically just spam with a better name', ['Most growth hacks are spam with a better name.'], 'Most growth hacks are spam with a better name.'],
    ["Most people really don't need a second monitor", ["Most people don't need a second monitor."], "Most people don't need a second monitor."],
    ['I check my analytics every single morning before coffee', ['I check my analytics every morning before coffee.'], 'I check my analytics every morning before coffee.'],
    ['It\'s very important to understand that funding rates are basically just a tax on impatient longs', ['Funding rates are a tax on impatient longs.'], 'Funding rates are a tax on impatient longs.'],
    ['Is it just me or does every single cycle feel like it\'s the last one?', ['Is it just me or does every cycle feel like the last one?'], 'Is it just me or does every cycle feel like the last one?'],
    ['Here are 12 books that completely changed how I think about money:', ['12 books that completely changed how I think about money:'], '12 books that completely changed how I think about money:'],
    ['There are 7 on-chain metrics that I personally check every single morning before I place any trade (thread)', ['7 on-chain metrics I check every morning before I place any trade:'], '7 on-chain metrics I check every morning before I place any trade:'],
    ['Here is the one email template I use to book every podcast', ['The one email template I use to book every podcast:'], 'The one email template I use to book every podcast:'],
    ['Why does nobody talk about the fact that most meetings are basically just status updates?', ['Why does nobody talk about how most meetings are status updates?'], 'Why does nobody talk about how most meetings are status updates?'],
    ['Why does nobody talk about the fact that most of senior engineering is basically just writing really clear docs?', ['Why does nobody talk about how most of senior engineering is writing clear docs?'], 'Why does nobody talk about how most of senior engineering is writing clear docs?'],
    ['So excited to finally announce that our app is live on iOS', ['Our app is live on iOS. So excited to finally announce it.'], 'Our app is live on iOS. So excited to finally announce it.'],
    ['Some personal news!! I\'m super thrilled to finally share that I\'m joining @stripe as Head of Growth starting Monday', ["I'm joining @stripe as Head of Growth starting Monday!! Super thrilled to finally share it."], "I'm joining @stripe as Head of Growth starting Monday!! Super thrilled to finally share it."],
    ["We almost didn't launch. I'm really glad we did, because yesterday we crossed 10,000 users.", ["We almost didn't launch. Yesterday we crossed 10,000 users."], "We almost didn't launch. Yesterday we crossed 10,000 users."],
    ['Story time. Last year our biggest customer churned on a Friday at 5pm', ['Last year our biggest customer churned on a Friday at 5pm.'], 'Last year our biggest customer churned on a Friday at 5pm.'],
    ['so um i wrote 100 essays in 100 days and here are some of the things that i learned along the way', ['i wrote 100 essays in 100 days. here are some of the things i learned:'], 'i wrote 100 essays in 100 days. here are some of the things i learned:'],
    ['In my opinion, 90% of traders really don\'t lose money because of bad entries, they lose because of position sizing', ["90% of traders don't lose money because of bad entries. They lose because of position sizing."], "90% of traders don't lose money because of bad entries. They lose because of position sizing."],
    ['I personally think that most people really don\'t need more protein, they just need to actually sleep 7 hours', ["Most people don't need more protein. They just need to sleep 7 hours."], "Most people don't need more protein. They just need to sleep 7 hours."],
    ['At the end of the day, I think that the thing that I regret the most is not the failures, it\'s actually the years I spent waiting', ["The thing I regret most is not the failures. It's the years I spent waiting."], "The thing I regret most is not the failures. It's the years I spent waiting."],
    ['In my experience, the difference between a junior and a senior designer is not really taste, it\'s knowing what to ignore', ["The difference between a junior and a senior designer isn't taste. It's knowing what to ignore."], "The difference between a junior and a senior designer isn't taste. It's knowing what to ignore."],
    ['I just wanted to quickly share a few thoughts on why I think most case studies fail to convert (and it\'s not the design)', ["Why most case studies fail to convert (and it's not the design):"], "Why most case studies fail to convert (and it's not the design):"],
    ['I think that one of the hardest things about remote work is the silence', ['One of the hardest things about remote work is the silence.'], 'One of the hardest things about remote work is the silence.'],
    ['Honestly I think most pitch decks are too long', ['Most pitch decks are too long.'], 'Most pitch decks are too long.'],
    ['I think most hiring mistakes are probably made in the first call', ['Most hiring mistakes are probably made in the first call.'], 'Most hiring mistakes are probably made in the first call.'],
    ['I think most hiring mistakes are probably made in the first call', ['Most hiring mistakes are made in the first call.'], 'REJECT hedge "probably" lost'],
    ['I think AI is not going to replace programmers anytime soon, but it will most likely replace programmers who refuse to use it', ['AI is not going to replace programmers anytime soon. But it will most likely replace programmers who refuse to use it.'], 'REJECT hedge "I think" lost'],
    ['I think we will ship the API next month', ['We will ship the API next month.'], 'REJECT hedge "I think" lost'],
    ['I might be wrong, but I think most cold DMs get ignored', ['Most cold DMs get ignored.'], 'Most cold DMs get ignored.'],
    ['Long post incoming. In 2019 I sold my first company for less than I raised, and I spent the next two years convinced I was a fraud, that every investor who had believed in me had been wrong, and that I would never be trusted with anyone else\'s money again, until one email from a former employee changed my mind.',
      ["In 2019 I sold my first company for less than I raised. I spent the next two years convinced I was a fraud, that every investor who had believed in me had been wrong. I was sure I would never be trusted with anyone else's money again. Then one email from a former employee changed my mind."],
      "In 2019 I sold my first company for less than I raised. I spent the next two years convinced I was a fraud, that every investor who had believed in me had been wrong. I was sure I would never be trusted with anyone else's money again.\n\nThen one email from a former employee changed my mind."],
  ];
  for (const [t, v, want] of rows) assert.equal(ship(t, v), want, t);
  /* the stated doubt is never dropped silently: a version that keeps it goes first when one passes */
  assert.equal(ship('I might be wrong, but I think most cold DMs get ignored', ['Most cold DMs get ignored.', 'I might be wrong, but most cold DMs get ignored.']), 'I might be wrong, but most cold DMs get ignored.');
  /* with the validator rows above and the selection rows, 46 lines of my own across the families */
  assert.ok(rows.length >= 28);
});

test('the endpoint ships Claude\'s line where it used to fall back (a scheduled present), with call marks in the receipt (fake client)', async () => {
  const d = "Just a quick note to say that I'm going to be moving the newsletter from Substack to @beehiiv next week #newsletter #creatoreconomy";
  answer = () => reply({ versions: [{ line: "I'm moving the newsletter from Substack to @beehiiv next week #newsletter #creatoreconomy", why: '“Just a quick note to say that” went, so the move comes first. Why you\'re switching would make it a hook.' }], unchanged: false });
  const r = await sharpen({ text: d });
  assert.equal(r.source, 'claude'); assert.equal(r.line, "I'm moving the newsletter from Substack to @beehiiv next week #newsletter #creatoreconomy"); assert.doesNotMatch(r.line, /^To say/);
  const c = "I think AI is not going to replace programmers anytime soon, but it will most likely replace programmers who refuse to use it";
  answer = () => reply({ versions: [{ line: 'I think AI is not going to replace programmers anytime soon. But it will most likely replace programmers who refuse to use it.', why: 'The long line splits at “but”, so the turn lands on its own. “I think” and “most likely” stay: it’s a forecast.' }], unchanged: false });
  const s = await sharpen({ text: c });
  assert.equal(s.source, 'claude'); assert.match(s.say, /^Split it into two beats · 2 left to you$/); assert.equal(s.marks.filter(m => m[3] === 'call').length, 2);
});
