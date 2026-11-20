/* r86 v5.7 (pass C5.7): Claude's Sharpen after Fable round 6, tested on the C5.7 held-out lines (scratchpad/r86/engine/
   heldout-c57.json, in fixtures/sharpen-ai-v57.json) and on Fable round 6's own replies, never on one Fable line by its text.
   H1: a present progressive keeps the future when its clause keeps the writer's own date ("at the end of the month", "on March 1st",
   "in 2027", "soon", "starting in January"); with no date, or a date that dates something else, the future is still lost.
   H2: a "maybe" that pads a verb inside a non-claim ("thinking about maybe starting") is filler; on a claim, a plan or a forecast
   it is a hedge and stays. H3: a negation is read by its clause, its negator and its scope, not by the noun it sat beside; real
   flips and "not really true" → "not true" still fail. H11: on a plain view the claim keeps one hedge at most (every hedge stays on
   a forecast or a call), and "basically" before a figure or beside another approximator goes. H10: no repeated count, no
   stitched two-source why, and a count that is the diff's. Stand-ins for Claude's JSON and a fake client only: no API call is made */
import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

process.env.ANTHROPIC_BASE_URL = 'http://127.0.0.1:9';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-sh57-'));
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
const FX = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'fixtures/sharpen-ai-v57.json'), 'utf8'));
const H = Object.fromEntries(FX.heldout.map(r => [r.id, r]));
const run = (r, k = 'reply') => core.SHARPEN.fromClaude(r.t, r[k], { trace: {} });
const v1 = id => H[id].reply.versions[0].line;

test('prompt v5.7: one hedge on a plain view, "basically" before a figure, a filler "maybe", a dated plan; the new examples pass with their why', () => {
  for (const re of [/On a plain view the claim keeps one hedge at most, whatever its kind and even across a "but"/, /Keep the stated doubt where they put it if there is one, else the modal, else the softener/,
    /before a number or a count, or beside another approximator, it adds nothing and goes too/, /before an absolute it is an approximator and stays: "basically zero"/, /"basically doubled" means nearly/,
    /a "maybe" that only pads a move they are weighing up/, /a "maybe" on a claim or a plan stays/, /A plan with its own date may read as a present/, /without a date its "will" stays/,
    /With no belief named, a softened denial stays soft/, /A softener on an absolute stays \("kind of dead", "basically all"\) when it is the claim's only hedge/,
    /* what earlier passes rely on is still there */
    /On a forecast, plan or price call keep every hedge/, /a stated doubt \("I might be wrong", "I could be wrong"\) always stays/, /Never make a plan or forecast certain/, /A correction of what people believe works the same way/]) assert.match(sys, re);
  const ex = [...sys.matchAll(/<example>\n<line>([\s\S]*?)<\/line>\n(\{[\s\S]*?\})\n<\/example>/g)].map(m => [m[1], JSON.parse(m[2])]);
  const one = ex.find(([d]) => /^I may be off here, but it seems like/.test(d)), bas = ex.find(([d]) => /basically 3 weeks late/.test(d));
  assert.ok(one && /^I may be off here, but most podcasts are too long\.$/.test(one[1].versions[0].line), 'the stated doubt is the one hedge');
  assert.ok(bas && !/basically/.test(bas[1].versions[0].line) && /3 weeks/.test(bas[1].versions[0].line), '"basically" before a figure goes');
  for (const [d, data] of [one, bas]) for (const v of data.versions) { const { r, reject } = F(d, [v], data.unchanged); assert.ok(r, `${d} (${reject})`); assert.equal(r.why, v.why); assert.deepEqual(core.SHARPEN.receiptCheck(r), []); }
  /* no held-out line is in the prompt */
  for (const h of FX.heldout) assert.ok(!sys.includes(h.t), h.id);
});

test('H1 v5.7: a progressive with the writer\'s own date keeps the future; with no date, or a date for something else, the future is lost', () => {
  /* the held-out plans: the date stays in the progressive's clause */
  for (const id of ['c7-0', 'c7-1', 'c7-2', 'c7-4', 'c7-5', 'c7-6', 'c7-7']) {
    const r = run(H[id]); assert.ok(r, id); assert.equal(r.line, v1(id), id); assert.equal(r.pick, 0, id); assert.doesNotMatch(r.line, /\bwill\b|['’]ll\b/, id);
  }
  /* with the C5.6 validator these were "future lost"; the dates are the family, not the lines */
  const D = 'I will be closing the waitlist on the 3rd of June and opening the paid beta';
  for (const [d, l] of [[D, "I'm closing the waitlist on the 3rd of June and opening the paid beta."], ['We will be moving our standup to Tuesdays by the end of the quarter', "We're moving our standup to Tuesdays by the end of the quarter."],
    ['I will be taking a month off from posting later this year', "I'm taking a month off from posting later this year."], ['Starting in March we will be charging for the API', "Starting in March, we're charging for the API."], ['We will be launching the Android app soon', "We're launching the Android app soon."]])
    assert.ok(F(d, [l]).r, `${d} → ${l}: ${F(d, [l]).reject}`);
  /* no date: a present, the future is lost (held-out c7-8 v1); the stand-in's v2 keeps "We'll be" and ships */
  const h8 = H['c7-8'];
  assert.equal(F(h8.t, ["We're hiring our first designer and I have no idea how to write the brief."]).reject, 'future lost');
  assert.match(run(h8, 'before').line, /^We'll be hiring/); assert.deepEqual(F(h8.t, h8.before.versions).trace.rejects, ['future lost', 'ok']);
  for (const [d, l] of [['I will be stepping down as CEO of our company', "I'm stepping down as CEO of our company."], ['We will be raising prices for new customers', "We're raising prices for new customers."],
    /* a date before the progressive in mid-clause dates something else */
    ['I moved to Berlin in 2023 and I will be launching my studio', "I moved to Berlin in 2023 and I'm launching my studio."],
    /* a forecast with its date is no plan: a bare present makes it a fact */
    ['Honestly I think Apple will announce a foldable iPhone in September', 'I think Apple announces a foldable iPhone in September.'],
    /* the date the line drops takes the future with it */
    ['I will be leaving the agency at the end of the month', "I'm leaving the agency."]])
    assert.equal(F(d, [l]).reject, 'future lost', `${d} → ${l}`);
});

test('H2 v5.7: a "maybe" that pads a verb inside a non-claim may go; on a claim, a plan or a forecast it is a hedge and stays', () => {
  for (const id of ['c7-10', 'c7-11', 'c7-12', 'c7-13', 'c7-16']) {
    const r = run(H[id]); assert.ok(r, id); assert.equal(r.line, v1(id), id); assert.doesNotMatch(r.line, /\bmaybe\b/i, id); assert.match(r.why, /“maybe”/, id);
    assert.ok(!(r.calls || []).some(c => /maybe/i.test(c.text)), `${id}: no "maybe" left to call`);
  }
  /* the hedge on a claim, a plan, a forecast and a stance still holds */
  assert.equal(F(H['c7-14'].t, ['Your launch flopped because nobody knew it was happening.']).reject, 'hedge "maybe" lost');
  assert.equal(F(H['c7-15'].t, ['My plan for next quarter is to hire a part-time editor and test a second newsletter.']).reject, 'hedge "maybe" lost');
  assert.equal(F('Honestly I think maybe the best onboarding is no onboarding at all', ['The best onboarding is no onboarding at all.']).reject, 'hedge "maybe" lost');
  assert.equal(F('Bitcoin could maybe hit 150k by the end of the year if the ETF flows keep up', ['Bitcoin hits 150k by the end of the year if the ETF flows keep up.']).reject, 'hedge "could" lost');
  /* "might maybe" collapses to "might", as before */
  assert.ok(run(H['c7-17']) && /^I might try/.test(run(H['c7-17']).line));
  /* the family, beyond the held-out lines */
  for (const [d, l] of [['Has anyone tried maybe pricing their course per cohort instead of per seat?', 'Has anyone tried pricing their course per cohort instead of per seat?'], ['I keep thinking of maybe quitting my job to freelance full time', 'I keep thinking of quitting my job to freelance full time.'],
    ['Not sure if I should maybe start a podcast or just keep writing', 'Not sure if I should start a podcast or keep writing.']]) assert.ok(F(d, [l]).r, `${d}: ${F(d, [l]).reject}`);
});

test('H3 v5.7: a negation holds by its clause, negator and scope; real flips and a softened denial made flat still fail', () => {
  for (const id of ['c7-18', 'c7-19', 'c7-20']) { const r = run(H[id]); assert.ok(r, id); assert.equal(r.line, v1(id), id); assert.match(r.line, /\bnot\b|n['’]t\b/, id); }
  const d18 = H['c7-18'].t, d19 = H['c7-19'].t;
  /* the negator is gone, or moved off the clause it negated */
  assert.match(F(d18, ["The reason most newsletters stall at 1,000 subscribers is probably what you'd expect."]).reject, /^negation "not" of "reason" lost$/);
  assert.match(F(d19, ['Raising a seed round is as hard as Twitter makes it look.']).reject, /isn't really" lost|negation/);
  assert.ok(F('You don\'t need a co-founder to raise a seed round', ['You need a co-founder to raise a seed round.']).reject);
  assert.ok(F('This is not a product problem, it is a pricing problem', ['This is a product problem. It is not a pricing problem.']).reject, 'a negation moved to the other clause');
  /* a softened denial with no belief named stays soft (Fable round 6 kept this reject); held-out c7-21's C5.6 answer still fails */
  assert.equal(F(H['c7-21'].t, H['c7-21'].before.versions).reject, '"not really" lost');
  assert.equal(F('I didn\'t really train for my first marathon', ['I didn\'t train for my first marathon.']).reject, '"didn\'t really" lost');
  /* the C5.7 answer keeps it soft and ships */
  assert.equal(run(H['c7-21']).line, "You don't really need a big audience to sell a course.");
  /* "isn't really as X as" is the comparison's; "isn't really X" is not */
  assert.ok(F('Hiring your first salesperson is not really as risky as it sounds', ['Hiring your first salesperson isn\'t as risky as it sounds.']).r);
  assert.equal(F('Hiring your first salesperson is not really risky', ['Hiring your first salesperson isn\'t risky.']).reject, '"not really" lost');
});

test('H11 v5.7: on a plain view a stacked hedge keeps one; a lone hedge, a forecast\'s and a call\'s stay; "basically" before a figure goes', () => {
  for (const id of ['c7-27', 'c7-28', 'c7-30', 'c7-32', 'c7-35']) { const r = run(H[id]); assert.ok(r, id); assert.equal(r.line, v1(id), id); assert.equal(r.why, H[id].reply.versions[0].why, id); }
  /* with the C5.6 prompt both versions of c7-32 lost "seems" and the line shipped unchanged */
  assert.equal(run(H['c7-32'], 'before').line, 'Most founders are probably overthinking their pricing pages.');
  /* no hedge left, a lone hedge cut, a forecast's or a call's cut: still rejected */
  assert.equal(F(H['c7-32'].t, ['Most founders are overthinking their pricing pages.']).reject, 'hedge "seems" lost');
  assert.equal(F('It seems like most founders overthink their pricing pages', ['Most founders overthink their pricing pages.']).reject, 'hedge "seems" lost');
  assert.equal(F(H['c7-33'].t, ["I think we'll see way more AI agents handling customer support by 2027."]).reject, 'hedge "probably" lost');
  assert.equal(F(H['c7-34'].t, ['I could be wrong, but I think $ETH outperforms $BTC this cycle.']).reject, 'hedge "probably" lost');
  assert.equal(F('I might be wrong, but I think $SOL could probably hit 300 this year', ['I might be wrong, but I think $SOL could hit 300 this year.']).reject, 'hedge "probably" lost');
  /* "kind of" on an absolute goes only beside another hedge; alone it is the claim's hedge */
  assert.equal(F('Cold outreach on LinkedIn is kind of dead', ['Cold outreach on LinkedIn is dead.']).reject, 'approximator lost');
  /* "basically" before a figure or beside an approximator goes, from Claude's version or by the top-up; "basically doubled" and "basically zero" stay */
  for (const id of ['c7-39', 'c7-40', 'c7-41', 'c7-42', 'c7-43']) { const r = run(H[id]); assert.ok(r, id); assert.doesNotMatch(r.line, /basically/i, id); }
  for (const id of ['c7-39', 'c7-42', 'c7-43']) { const t = {}; const r = core.SHARPEN.fromClaude(H[id].t, H[id].before, { trace: t }); assert.doesNotMatch(r.line, /basically/i, id); assert.ok((t.promo || []).includes('topup'), id); assert.deepEqual(core.SHARPEN.receiptCheck(r), [], id); }
  assert.match(run(H['c7-44']).line, /basically doubled/); assert.match(run(H['c7-45']).line, /^Basically zero/);
  assert.equal(F(H['c7-44'].t, ['Our signup rate doubled after we removed the credit card field.']).reject, 'approximator lost');
  const z = 'We had basically zero churn last quarter'; assert.equal(F(z, [{ line: z, why: '' }], true).r.line, z);
  /* a "basically" Claude keeps before a figure goes, and the receipt drops the sentence that said it stays */
  const d = 'So honestly I was basically $15,000 behind on rent when I started freelancing';
  const r = F(d, [{ line: 'I was basically $15,000 behind on rent when I started freelancing.', why: '“So” and “honestly” went. “basically $15,000” stays: it says the figure is rough.' }]).r;
  assert.equal(r.line, 'I was $15,000 behind on rent when I started freelancing.'); assert.doesNotMatch(r.why, /stays/); assert.match(r.why, /“basically”/); assert.deepEqual(core.SHARPEN.receiptCheck(r), []);
});

test('H10 v5.7: no repeated count, no stitched two-source why, a true reword why ships, and the count is the diff\'s', () => {
  /* a reword said as "“X” is “Y” now" or "became" is one; "and “single” went" is checked on its own */
  assert.equal(run(H['c7-3']).why, H['c7-3'].reply.versions[0].why); assert.match(run(H['c7-3']).say, /^Cut 1 bit of fluff/);
  assert.equal(run(H['c7-46']).why, H['c7-46'].reply.versions[0].why); assert.match(run(H['c7-46']).say, /^Cut 1 bit of fluff/);
  /* a quote after "since" is its own clause */
  const s = F('Onboarding is something that I believe most B2B apps tend to overbuild in year one.', [{ line: 'Onboarding is something most B2B apps tend to overbuild in year one.', why: '“that I believe” went since “tend to” already softens it.' }]).r;
  assert.equal(s.why, '“that I believe” went since “tend to” already softens it.');
  /* "X to Y leads" reads from its first word */
  const g = F('We very recently grew our trial-to-paid rate from 9% to 17% and I wanted to share exactly how we did that', [{ line: 'We recently grew our trial-to-paid rate from 9% to 17%. Here\'s exactly how we did it:', why: '“very” and “I wanted to share” went, so 9% to 17% leads and “Here\'s exactly how” points at the breakdown.' }]).r;
  assert.match(g.why, /^“very” and “I wanted to share” went, so 9% to 17% leads/);
  /* the count is the diff's: a small-word tail that went is named and counted */
  const w47 = run(H['c7-47']); assert.match(w47.say, /^Cut 2 bits of fluff/); assert.match(w47.why, /“for us” went too\.$/);
  /* an engine why that needed spans stitched on is said once, from the diff */
  const q = F('Why is it that every single founder I meet wants a podcast now?', [{ line: 'Why does every founder I meet want a podcast now?', why: 'It is three beats now.' }]).r;
  assert.doesNotMatch(q.why, /\b\d+ words? lighter\b.*\bwent too\b|\bsmall words went too\b/); assert.deepEqual(core.SHARPEN.receiptCheck(q), []);
  const C = core.SHARPEN.receiptCheck, dq = 'Why is it that every single founder I meet wants a podcast now?', lq = 'Why does every founder I meet want a podcast now?';
  assert.ok(C({ state: 'sharp', draft: dq, line: lq, say: 'Tightened it', why: 'Same question, 3 words lighter, so it reads in one glance. 3 small words went too.' }).includes('repeated count'));
  assert.ok(C({ state: 'sharp', draft: 'Content is something that I believe most startups ignore', line: 'Content is something most startups ignore.', say: 'Cut 1 bit of fluff · Tightened it', why: '3 words lighter, and said more directly. Also dropped “I believe”.' }).includes('stitched'));
  assert.ok(C({ state: 'sharp', draft: 'We very recently doubled our MRR and I wanted to break down how', line: 'We recently doubled our MRR. Here\'s how:', say: 'Cut 2 bits of fluff · Split it into two beats', why: `${core.SHARPEN.MOVE_WHY.contrast} “very” went too.` }).includes('stitched'));
  /* every receipt on the held-out lines (both prompts) and on Fable round 6 is true, and none repeats a count or stitches */
  let n = 0;
  for (const [row, k] of [...FX.heldout.flatMap(h => [[h, 'before'], [h, 'reply']]), ...FX.fable6.map(f => [f, 'reply'])]) {
    const r = run(row, k); if (!r) continue; n++;
    assert.deepEqual(C(r), [], `${row.id} ${k}: ${r.say} | ${r.why}`);
    assert.doesNotMatch(r.why, /\bAlso dropped\b/, row.id);
    for (const a of r.alts || []) assert.deepEqual(C({ ...a, draft: r.draft, state: 'sharp' }), [], `${row.id} alt: ${a.why}`);
  }
  assert.ok(n >= 235, `receipts checked: ${n}`);
});

test('the held-out set v5.7: every C5.7 answer ships Claude\'s line, and the endpoint ships a dated plan as a present (fake client)', async () => {
  for (const h of FX.heldout) { const r = run(h); assert.ok(r, h.id); assert.equal(r.source, 'claude', h.id); }
  const h = H['c7-1'];
  answer = () => reply(h.reply);
  const r = await sharpen({ text: h.t });
  assert.equal(r.source, 'claude'); assert.equal(r.line, "We're shutting down the free plan on June 30th."); assert.doesNotMatch(r.why, /Also dropped|small words went too/);
  const m = H['c7-10'];
  answer = () => reply(m.reply);
  const k = await sharpen({ text: m.t });
  assert.equal(k.source, 'claude'); assert.doesNotMatch(k.line, /maybe/); assert.match(k.line, /👇$/);
});
