/* r86 v4.3: the on-device Sharpen after blind set 4 (hook42-1 to hook42-5) and round 8 (founder-1, marketing-1/2/9,
   uiux-1/2/5/6, web-1), plus the page builder's pass-9 engine items.
   1. hook42-1: a deadpan or news label on one or two whole sentences is kept ("Your frame sets it up."); the hype openers go
      or stay marked, never "Nothing to cut"; "Not to brag, but" is marked and kept; "not financial advice" stays where it is
   2. hook42-2: "if I'm being real/transparent/frank" with "if I'm honest"; list headers say what the list is
   3. hook42-5: "Here's my honest take on X:" goes only when the claim after it is about X; the Claude prompt says the same;
      "ngl" is cut whole, as the prompt cuts it
   4. receipts: hard news only about people, pets, jobs, homes and health; a label is "your frame"; plain words; a stacked
      run-up is cut or said to stay, never struck while kept; a kept word's reason is said once
   5. hook42-4 and uiux-5: a put-back opener keeps the question mark and pins only itself
   6. the 60-line hunt, in every mode, against the hard guards and the page guard
   7. web-1 and pass 9: warmSteps is free to build, output is the same warm or cold; the soft table's giant entries are in
      pieces; the marks cache hands out copies */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createHash } from 'node:crypto';

const here = path.dirname(fileURLToPath(import.meta.url));
const core = createRequire(import.meta.url)('../../core.js');
const S = (t, o) => core.sharpenLine(t, o), L = (t, o) => S(t, o).line;
const D = core.SHARPEN._dbg, hard = D.hard, whole = D.whole;
const versions = r => r.state === 'sharp' ? [r.line, ...(r.alts || []).map(a => a.line)] : [];
const MODES = [['default', {}], ['v4.1', { hybrid: false }], ['strict', { strict: true }]];
const HUNT = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-v43-hunt.json'), 'utf8')).lines;
const HUNT42 = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-v42-hunt.json'), 'utf8')).lines;
const CLEANS = ['This quick check found nothing to cut, so it stays as you wrote it.', 'This quick check found nothing it could cut safely, so it stays as you wrote it.'];

test('v4.3, hook42-1: a deadpan or news label on a whole sentence is part of the line', () => {
  for (const t of ["Fun fact: I've never made money on a trade I had to explain to my wife.", 'Breaking: founder discovers that customers want the thing they asked for.', 'Life update: I now ghostwrite for my former boss.', 'Update: the client picked version one. Of nine.', "update: still haven't replied to that email from march", 'PSA: your landing page doesn\'t need a carousel.', 'Plot twist: the bug was in the test, not the code.', 'TIL: the bug was a timezone. It\'s always a timezone.']) {
    for (const [m, o] of MODES) { const r = S(t, o); assert.equal(r.state, 'clean', `${m}: ${t}`); assert.equal(r.line, r.draft, `${m}: ${t}`); assert.deepEqual(r.marks, [], t); }
    assert.equal(S(t).why, 'Your frame sets it up.', t); assert.doesNotMatch(S(t).why, /run-up/i, t);
  }
  /* a label on a body the engine can't read as a sentence stays marked, as the writer's frame, never "breaks" */
  { const r = S('BREAKING: SEC approves spot ETH ETF'); assert.equal(r.state, 'unsure'); assert.equal(r.why, 'Marked “BREAKING”, not cut: it’s your frame. Cut it if the line works without it.'); }
  /* the label stays when other soft words go */
  assert.equal(L("Fun fact: I honestly have no idea what I'm doing most days."), "Fun fact: I have no idea what I'm doing most days.");
  assert.equal(L('🚨 BREAKING: this is huge news, BTC just broke 100k. Let that sink in.'), '🚨 BREAKING: BTC just broke 100k.');
  /* hard news keeps its own why */
  assert.match(S("Update: my dad passed away last night, and I'm taking the week off.").why, /On news like this/);
  /* a frame up front says what it does, never "tight" */
  for (const t of ['Hot take: most altcoins will never see their ATH again', 'Unpopular opinion, but most morning routines are procrastination', 'This might be an unpopular opinion, but DCA beats trading for most people', "Here's my take on the new X algorithm after a month of testing:"]) assert.equal(S(t).why, 'Your frame sets it up.', t);
});

test('v4.3, round-8 founder-1 and marketing-1: the hype openers go, or stay marked, never "Nothing to cut"', () => {
  const cut = [
    ['huge news, BTC just broke 100k', 'BTC just broke 100k'],
    ['Big news! we just hit $10k MRR', 'We just hit $10k MRR.'],
    ['Big news! We just launched our new feature after months of hard work', 'We just launched our new feature after months of hard work.'],
    ['This is huge. Solana just flipped Ethereum in daily fees', 'Solana just flipped Ethereum in daily fees.'],
    ['nobody is talking about this but the yield curve just un-inverted', 'the yield curve just un-inverted'],
    ['Why is nobody talking about this? The Fed just quietly ended QT.', 'The Fed just quietly ended QT.'],
    ['Wow. Just wow. ETH just flipped 4k', 'ETH just flipped 4k.'],
    ['wow just wow, the bull market is back', 'the bull market is back'],
    ['Let that sink in: SOL flipped ETH in daily volume', 'SOL flipped ETH in daily volume.'],
    ['We went from 0 to $40k MRR in 9 months. Let that sink in.', 'We went from 0 to $40k MRR in 9 months.'],
    ['To the moon! $PEPE just did a 10x', '$PEPE just did a 10x.'],
    ['To the moon: $PEPE just did a 10x', '$PEPE just did a 10x.'],
    ['We just hit 10,000 users. Huge news.', 'We just hit 10,000 users.'],
    ['Our app is finally live on the App Store. This is huge! 🎉', 'Our app is finally live on the App Store. 🎉'],
    ["In today's thread I'm going to break down why most traders lose money", 'Thread: why most traders lose money.'],
    ['Most people will scroll past this, but the best trade is often no trade', 'The best trade is often no trade.']
  ];
  for (const [t, want] of cut) { assert.equal(L(t), want, t); assert.equal(L(t, { strict: true }), want, `strict: ${t}`); }
  /* the claim's own "goes to the moon" is the claim, never marked */
  assert.match(L('I honestly think $SOL goes to the moon this cycle'), /goes to the moon this cycle/);
  assert.ok(!S('send it to the moon, $BONK holders').marks.length);
  /* "Not to brag, but" is marked and kept, as the Claude prompt keeps its frames */
  for (const t of ['Not to brag but we just closed our biggest month ever', 'Not to brag, but I haven\'t missed a workout in 200 days.']) {
    const r = S(t); assert.equal(r.state, 'unsure', t); assert.equal(r.line, r.draft, t); assert.equal(r.marks.length, 1, t); assert.equal(r.marks[0][3], 'frame', t);
    assert.deepEqual(core.softMarks(t), r.marks, t); assert.match(r.why, /^Marked “Not to brag”, not cut: it’s your frame/, t);
    assert.equal(core.softCut(t).s.replace(/\.$/, ''), t.replace(/\.$/, ''), t);
  }
  /* "not financial advice" stays where the writer put it (policy unchanged) */
  assert.match(L("not financial advice but i'm loading up on $LINK here"), /^not financial advice but/);
  /* none of the openers the round-8 jurors typed comes back "Nothing to cut" with a plain clean copy */
  for (const t of ['huge news, BTC just broke 100k', 'Big news! we just hit $10k MRR', 'nobody is talking about this but the yield curve just un-inverted', 'Not to brag but we just closed our biggest month ever', 'Wow. Just wow. ETH just flipped 4k', 'Let that sink in: SOL flipped ETH in daily volume', 'To the moon! $PEPE just did a 10x', "In today's thread I'm going to break down why most traders lose money", 'BTC to the moon, just broke 100k']) assert.ok(!CLEANS.includes(S(t).why), t);
});

test('v4.3, hook42-2: frames and list headers', () => {
  assert.equal(L("if i'm being real, i don't really know what i'm doing half the time and that's okay"), "i don't really know what i'm doing half the time and that's okay");
  assert.equal(L("If I'm being totally transparent, I don't really enjoy writing for clients who never give feedback."), "I don't really enjoy writing for clients who never give feedback.");
  assert.equal(L("If I'm being frank, our onboarding is the reason people churn."), 'Our onboarding is the reason people churn.');
  assert.equal(L("Here are a few of the newsletters I've been really enjoying lately, in case you're looking for something new to read:"), "A few newsletters I've been really enjoying lately:");
  assert.equal(L("Here's a list of 7 questions that I always, always ask before I write a single word for a new client:"), '7 questions I always, always ask before I write a single word for a new client:');
  /* "that" stays when it is the clause's subject */
  assert.equal(L("Here's a list of 3 books that changed how I think about money:"), '3 books that changed how I think about money:');
  assert.equal(L("Here are a few of the tools I use every day, in case you're curious:"), 'A few tools I use every day:');
  /* the >280 run-up, cut whole */
  assert.match(L("So I've been sitting on this for a few weeks now, and I've finally decided that it's time to share it with all of you, which is that after six incredibly hard but rewarding years of building this company from the ground up with some of the most talented people I've ever met, I'm going to be stepping away from my day-to-day role at the end of this month."), /^After six hard but rewarding years/);
});

test('v4.3, hook42-5: "Here\'s my honest take on X:" goes only when the claim is about X, here and in the Claude prompt', () => {
  for (const [t, want] of [/* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */["Here's my honest take on paid newsletters: most of them probably shouldn't be paid.", "Paid newsletters: most of them shouldn't be paid."], ["Here's my honest take on glassmorphism: it's mostly a trend, and that's fine.", "Glassmorphism: it's mostly a trend, and that's fine."], ["Here's my honest take on cold plunges: I think they're mostly hype, but I still do them.", "Cold plunges: they're mostly hype. But I still do them."]]) assert.equal(L(t), want, t);
  /* a thread header, and a claim that isn't about X, keep it */
  for (const t of ["Here's my honest take on remote work after running a 40-person team for 3 years:", "Here's my honest take on hiring: never hire someone you wouldn't want to work for.", "Here's my honest take on SaaS pricing. Most founders charge too little."]) assert.equal(L(t), t, t);
  /* the run-up never takes X with it ("…on remote work. It's overrated." → "It's overrated." would lose what "it" is) */
  assert.doesNotMatch(L("Here's my honest take on remote work. Most teams aren't ready for it."), /^Most teams/);
  /* the prompt says it in one line, and its validator agrees on both sides */
  const P = core.prompts.sharpen({ text: 'x' }).cached;
  assert.match(P, /"Here's my honest take on X:" is a run-up when the claim after the colon is about X/);
  const ok = core.SHARPEN.fromClaude("Here's my honest take on cold plunges: they're mostly hype.", { versions: [{ line: "Cold plunges: they're mostly hype.", why: 'The run-up went, so the claim comes first.' }], unchanged: false });
  assert.equal(ok && ok.line, "Cold plunges: they're mostly hype.");
  assert.equal(core.SHARPEN.fromClaude("Here's my honest take on remote work: hire people you trust.", { versions: [{ line: 'Remote work: hire people you trust.', why: 'The run-up went.' }], unchanged: false }), null);
  /* "ngl" is cut whole, as the prompt cuts it: "ngl tho" leaves no "tho", "NGL:" no stray colon */
  assert.equal(L('ngl tho this cycle feels different'), 'this cycle feels different');
  assert.equal(L('NGL: most people who say they want feedback don\'t.'), 'Most people who say they want feedback don\'t.');
  assert.equal(L('ngl i think we could maybe ship the beta by march').replace(/\.$/, ''), 'i think we could ship the beta by march');
  /* and the question it can make agrees: "most launches flop" never becomes "does most launch flop" */
  for (const [m, o] of MODES) for (const l of versions(S('NGL: most launches flop because nobody tells their friends', o))) assert.doesNotMatch(l, /\bdoes most launch\b/, m);
  assert.equal(hard('Why does most launch flop? Nobody tells their friends.', 'NGL: most launches flop because nobody tells their friends'), 'plural lost');
});

test('v4.3, hook42-3 and round-8 receipts: true, plain, and said once', () => {
  /* hard news is about a person, a pet, a job, a home or health, never a market or a laptop */
  for (const t of ['Spent a week on an NFT marketplace redesign. The NFT market spent the week dying.', 'my laptop died mid-demo lol', 'memecoins are dying and nobody wants to say it', 'She passed the bar exam today!']) assert.equal(D.hardNews(t), null, t);
  for (const t of ['My dad died last week and I keep thinking about our last call', 'Our dog died yesterday and the house is so quiet.', 'She passed last night after a long fight.', 'We lost our home in the fire.']) assert.ok(D.hardNews(t), t);
  assert.doesNotMatch(S('Spent a week on an NFT marketplace redesign. The NFT market spent the week dying.').why, /news like this/);
  /* a label that went is the writer's frame, never "the run-up" */
  for (const t of ['Big news: we just launched our new feature after months of hard work', 'Just a quick PSA: you probably don\'t really need Kubernetes for your todo app.']) { const w = S(t).why; assert.match(w, /^Your “[^”]+” frame/, t); assert.doesNotMatch(w, /run-up/, t); }
  /* plain words: no "pointer to the thread" anywhere */
  for (const t of [...HUNT, ...HUNT42, 'Some thoughts on why most launches flop']) assert.doesNotMatch(`${S(t).why} ${S(t, { strict: true }).why}`, /pointer/, t);
  /* a stacked run-up is cut as far as the line stays whole, and the receipt says what stayed */
  const r = S('Hey everyone, I wanted to share some thoughts on why most traders lose money');
  assert.equal(r.line, 'Some thoughts on why most traders lose money:');
  assert.deepEqual(r.cut.map(c => c.text), ['Hey everyone,', 'I wanted to share']); /* v5.1 (web-5): the comma the line lost is struck with its word */
  assert.match(r.why, /“Some thoughts” stays/);
  assert.equal(L('So basically I wanted to share a quick story about how I lost $4,000 in March by doubling my size to win it back, and honestly it was the worst week of my trading life'), 'I lost $4,000 in March by doubling my size to win it back. It was the worst week of my trading life.');
  /* "the run-up is gone" only when the line no longer opens on one; a struck run-up is never still in the line */
  const warm = /^(?:announce|label|disclaim|stock|throat|open|feel|bait)$/;
  for (const t of [...HUNT, ...HUNT42]) for (const [m, o] of MODES) {
    const x = S(t, o); if (x.state !== 'sharp') continue;
    if (/run-up is gone|not the run-up/.test(x.why)) assert.ok(!core.softMarks(x.line).some(k => k[0] <= 2 && warm.test(k[3])), `${m}: ${t} → ${x.line}: ${x.why}`);
    for (const c of x.cut) if (warm.test(c.kind) && c.text.split(/\s+/).length >= 3) assert.ok(!x.line.toLowerCase().includes(c.text.toLowerCase()), `${m}: ${t}: struck “${c.text}” is still in ${x.line}`);
  }
  /* a kept word's reason is said once: in the why, or in the note, never both */
  for (const t of ['In my humble opinion, most altcoins are going to zero', 'It is what it is, but I am basically done with leverage for good', 'I think BTC is going to 150k by the end of the year, not financial advice', 'Is it just me or has the funding on $DOGE perps been kinda insane this week?']) {
    const x = S(t), both = `${x.why} ${x.note}`, q = (x.why.match(/^(?:Kept|Left) “([^”]+)”/) || [])[1]; /* v5.1: a filler word is “left in” */ assert.ok(q, t);
    assert.equal(both.split(`“${q}”`).length - 1, 1, `${t}: ${both}`);
  }
  /* marketing-9: a price call is "a prediction", never "a call" */
  assert.match(S('I think $SOL could probably hit $300 by Q2.').note + S('I think $SOL could probably hit $300 by Q2.').why, /on a prediction/);
  /* the clean copy is softer and still true */
  assert.equal(S('Sometimes the best feature is the one you decide not to build.').why, CLEANS[0]);
  for (const t of [...HUNT, ...HUNT42]) assert.doesNotMatch(S(t).why, /Already tight/, t);
});

test('v4.3, hook42-4 and uiux-5: a put-back opener keeps the question and pins only itself', () => {
  /* v4.4 (hook43-2): "like a week" is the writer's "about a week", so it stays */
  /* v5.4 (step 1): never a "?" the writer didn't type */
  assert.equal(L('ok but why does every productivity app basically turn into a second job after like a week', { keep: ['ok but'] }), 'ok but why does every productivity app turn into a second job after like a week');
  assert.equal(L('honestly what is the point of a pitch deck nobody reads'), 'what’s the point of a pitch deck nobody reads'); /* v4.8 (brand-4): no apostrophe in the draft, so the page's ’ */
  assert.equal(L('so like how are you all getting your first 100 subscribers'), 'how are you all getting your first 100 subscribers');
  /* the other cuts and reshapes stand around a pinned opener */
  assert.equal(L('Hey everyone, I wanted to share some thoughts on why most traders lose money', { keep: ['Hey everyone'] }), 'Hey everyone, some thoughts on why most traders lose money:');
  const p = S('ok but why does every productivity app basically turn into a second job after like a week', { keep: ['ok but'] });
  assert.match(p.why, /^You kept “ok but”/); assert.deepEqual(p.cut.map(c => c.text), ['basically']);
  /* "opens on it" only for a word that really opens it: "Some" is not "So" */
  assert.doesNotMatch(S('Hey everyone, I wanted to share some thoughts on why most traders lose money', { keep: ['So'] }).why, /You kept “So”/);
});

test('v4.3: the 60-line hunt, every mode, no version trips a hard guard or the page guard', () => {
  assert.equal(HUNT.length, 60);
  const bad = [];
  for (const t of HUNT) for (const [m, o] of MODES) { const r = S(t, o); for (const l of versions(r)) { const h = hard(l, r.draft), w = whole(l, r.draft); if (h || w) bad.push(`${m}: ${t} → ${l} (${h || w})`); } if (r.alts && new Set(r.alts.map(a => a.line)).size !== r.alts.length) bad.push(`${m}: ${t}: two alts are the same line`); }
  assert.deepEqual(bad, []);
  /* no stray stop pair after a closing cut */
  assert.equal(L('BTC broke 100k. Let that sink in!'), 'BTC broke 100k.');
  assert.equal(hard('We just hit $10k MRR.! 🚀', 'We just hit $10k MRR. This is huge! 🚀'), 'stray punctuation');
});

test('v4.3, web-1 and pass 9: warm-up is free to build and changes nothing; the table is in pieces; marks are copies', () => {
  const t0 = Date.now(), steps = core.SHARPEN.warmSteps(); assert.ok(Date.now() - t0 < 60, `built in ${Date.now() - t0} ms`); assert.ok(steps.length > 1000);
  const sample = [...HUNT.slice(0, 20), ...HUNT42.slice(0, 20)], hash = () => createHash('sha1').update(JSON.stringify(sample.map(t => { const r = S(t); return [r.line, r.say, r.why, r.note, r.state, r.alts.map(a => a.line), r.cut.map(c => c.text + c.kind), r.marks]; }))).digest('hex');
  const before = hash(); for (const f of steps) f(); assert.equal(hash(), before);
  assert.ok(core.SOFT.every(x => x.re.source.length <= 1800), 'a soft-table entry over 1,800 characters');
  const m1 = core.softMarks('So basically I just wanted to say that we finally launched our app'); m1[0][0] = 99; m1.push([0, 0, '', 'x']);
  assert.notEqual(core.softMarks('So basically I just wanted to say that we finally launched our app')[0][0], 99);
});
