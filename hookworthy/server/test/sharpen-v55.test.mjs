/* v5.7 (page pass 22, founder-5): the engine adds no end stop and no contraction the writer didn't type, so expected lines here end as the draft ends and keep the draft's own "we are"/"I have". */
/* v5.5 (Fable round 4, on-device): whole-sentence threads, announce run-ups cut as a family, reorders that add no words, true whys,
   one rule for a labeled take's hedge, a hesitant opener as a call, stock adjectives marked.
   Built from the round's own held-out lines (scratchpad engine/heldout55.json), never from a Fable line. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../../core.js');
const S = C.SHARPEN, D = S._dbg, sl = (t, o) => C.sharpenLine(t, o || {});
const shipped = R => R.state === 'sharp' ? R.line : R.draft;
const fluffN = R => (R.cut || []).filter(c => !/^(?:move|tight|swap|reshape)$/.test(c.kind)).length;
const posts = R => R.thread || [shipped(R)];

const LONG = [
  'So I\'ve been meaning to write this up for months now, and I kept putting it off because I wasn\'t sure anyone would care, but after the tenth person asked me about it I figured it\'s finally time to explain how we rebuilt our entire onboarding flow from scratch, what we got wrong the first two times, and why the version that finally worked was the simplest one we tried.',
  'I want to talk about something that honestly doesn\'t get said enough in the design world, which is the fact that most of the best designers I\'ve worked with, including a couple of people at very well-known companies, have no formal training at all, and that it\'s completely fine to learn the craft by copying the work you admire until you understand why it works.',
  'Today I want to walk you through the whole story of how we lost our biggest customer, which accounted for almost 40% of our revenue at the time, and how we spent the next six months rebuilding the business around dozens of smaller accounts instead of one big one. It was the hardest stretch of my career so far, and I made a lot of mistakes along the way. But it also forced us to fix our pricing, our onboarding and our support, and today the company is healthier than it has ever been, with more revenue, fewer risks and a team that actually enjoys the work.',
  'Here\'s a long story about the worst job interview I ever had, where I showed up to the wrong building, presented the wrong portfolio, and still somehow got the offer, and what it taught me about how little the polish matters compared to how you handle things going wrong in front of other people.',
  'I\'ve been thinking a lot about why so many good products fail to get any traction at all, and I really think the answer is almost always distribution rather than the product itself, because most founders spend ninety percent of their time building and maybe ten percent figuring out how anyone will ever hear about the thing they built, which is exactly backwards from how it should be.',
  'Honestly, I just wanted to take a second to thank everyone who has bought the course over the last year, because when I launched it I genuinely thought I\'d sell maybe twenty copies to friends and family, and instead more than four thousand people from forty countries have gone through it, and reading your messages about the jobs you landed has been the best part of my year.',
  'I\'ve been a product manager for nine years and if there\'s one thing I\'ve learned it\'s that the roadmap is never really the problem. The problem is almost always that nobody agreed on what the roadmap was for in the first place, so every team reads it as a promise, every executive reads it as a wish list, and every customer who sees it reads it as a contract. Once you fix that, the arguments about priorities mostly go away on their own, and you can spend your time on the work instead of the politics around it.',
  'I don\'t usually post things like this, but I wanted to share that after a really difficult year of job searching, more than two hundred applications and at least forty interviews that went nowhere, I finally accepted an offer last week to lead the design team at a small climate startup that I\'ve admired for years, and I start on Monday.',
  'After 14 years in finance, 3 failed startups and one very patient spouse, I finally launched the product I\'ve been dreaming about since college. It\'s a budgeting app for freelancers that handles irregular income, sets aside tax money automatically and tells you exactly how much you can safely spend this week. It\'s free for the first 1,000 users, and every single feature request will get a personal reply from me.',
  'Let me tell you about the time we accidentally emailed our entire customer list a test message that just said \'asdf asdf\' with nobody\'s name in it, and how that one mistake ended up getting the highest open rate and reply rate of any email we had ever sent, which taught us more about writing to customers than any course I\'ve ever taken.'
];
const ANNOUNCE = [
  ['In today\'s thread, I\'m going to walk you through how I priced my first SaaS product without any customer data', 'How I priced my first SaaS product without any customer data:'],
  ['In this thread I will be explaining why your onboarding emails are getting ignored and what to send instead', 'Why your onboarding emails are getting ignored and what to send instead:'],
  ['In this thread, I\'ll be breaking down the exact cold email template that booked us 40 demos last month', 'The exact cold email template that booked us 40 demos last month:'],
  ['Just wanted to share a few quick thoughts on why remote teams need fewer meetings, not more', 'Why remote teams need fewer meetings, not more:'],
  ['Just wanted to share a few thoughts on the new App Store rules and what they mean for indie devs', 'The new App Store rules and what they mean for indie devs:'],
  ['Here\'s a thing that I think most junior designers get wrong about whitespace:', 'Most junior designers get whitespace wrong:'],
  ['Here\'s something that I think a lot of podcasters overlook: the first 30 seconds decide everything', 'Something a lot of podcasters overlook: the first 30 seconds decide everything'],
  ['i dont know if anyone needs to hear this but your side project doesn\'t need a logo yet', 'your side project doesn\'t need a logo yet'],
  ['It goes without saying that a backup only counts if you\'ve actually tested the restore', 'A backup only counts if you\'ve actually tested the restore'],
  ['Today I\'m going to be explaining how we cut our AWS bill in half without touching the product', 'How we cut our AWS bill in half without touching the product:']
];
const REORDER = [
  'so i switched our images to webp and the page weight dropped from 4.2mb to 900kb. i didn\'t expect that',
  'We moved support to async chat and our response time fell from 9 hours to 40 minutes. Nobody saw that coming.',
  'i cut my posting from daily to twice a week and my follower growth doubled. still can\'t explain it',
  'So I added one sentence to the welcome email and activation went from 22% to 41%. That surprised me.',
  'so we killed the free plan and signups dropped 60% but revenue tripled. worth it',
  'Basically I stopped checking email before noon and my output doubled. Try it.',
  'I replaced our homepage video with a single screenshot and conversions went up 18%. Make of that what you will.'
];
const TAKES = ['Hot take: you probably don\'t need a design system until you have three designers', 'Unpopular opinion: most podcasts are probably twice as long as they need to be', 'hot take: daily standups are probably a waste of everyone\'s time', 'Spicy take: your MVP is probably too big'];
const HESIT = [
  ['To be honest, I don\'t really know how to say this, so I\'ll just say it: we\'re getting divorced.', 'We\'re getting divorced.'],
  ['This is really hard for me to write, but we had to let go of half the team today.', 'We had to let go of half the team today.'],
  ['Honestly, I don\'t know how to start this post, so here it is: I\'m leaving my job.', 'I\'m leaving my job.'],
  ['I\'m not really sure how to put this into words, but my dad passed away on Sunday.', 'My dad passed away on Sunday.']
];
const STOCK = ['Excited to announce our new seamless AI-powered scheduling tool for clinics', 'We\'re thrilled to launch our next-level analytics dashboard for small teams', 'Introducing our revolutionary new note-taking app that organizes itself', 'Our game-changing AI-powered CRM is finally live for everyone', 'Meet Pulse: a seamless, AI-powered way to track your habits', 'We just launched a cutting-edge, best-in-class API for invoices', 'Today we\'re releasing a next-level checkout experience for Shopify stores', 'Our new seamless integration with Slack is live today'];
const ALL = [...LONG, ...ANNOUNCE.map(x => x[0]), ...REORDER, ...TAKES, ...HESIT.map(x => x[0]), ...STOCK];

test('v5.5: every version reads whole, and the receipt counts every cut', () => {
  for (const t of ALL) {
    const R = sl(t);
    for (const v of [R.line, ...(R.alts || []).map(a => a.line)]) { if (R.state !== 'sharp' || v === R.draft) continue; assert.equal(D.bad54(v, R.draft), '', `${t}\n → ${v}`); assert.ok(D.shipOK(v, R.draft), `shipOK: ${v}`); }
    if (R.state === 'sharp') { const m = String(R.say).match(/^Cut (\d+) bits? of fluff/); assert.equal(m ? +m[1] : 0, fluffN(R), `receipt: ${t} → ${R.say}`); }
    assert.ok(R.why.length <= 140, R.why);
  }
});

test('v5.5 H1: a long line opens a thread of whole sentences; post 1 carries the point; rest keeps its contract', () => {
  for (const t of LONG) {
    const R = sl(t), P = posts(R);
    if (!R.thread) { assert.ok(C.xLength(shipped(R)) <= 280 || /Over 280/.test(R.note), `one post or the over-280 note: ${shipped(R)}`); if (C.xLength(shipped(R)) > 280) assert.doesNotMatch(R.say, /beats?|Split it/); continue; }
    assert.equal(R.line, P[0]); assert.equal(R.post2, P[1]); assert.equal(R.rest, '');
    assert.match(R.say, new RegExp(`Opens a ${P.length}-post thread`)); assert.equal(R.long, false);
    P.forEach((p, i) => { assert.ok(C.xLength(p) <= 280, `post ${i + 1} is ${C.xLength(p)}: ${p}`); if (i) assert.doesNotMatch(p, /^\P{L}*(?:and|or|which|who|because|that)\b/iu, `post ${i + 1} opens mid-clause: ${p}`); if (i) assert.match(p, /^\P{L}*\p{Lu}/u, p); });
    assert.ok(!D.runOnly55(P[0]), `post 1 is only run-up: ${P[0]}`);
    /* the page's own call reads the same post 1 */
    assert.equal(S.firstPost(P.join(' '), R.draft), P[0]);
  }
  /* the run-up before the pivot goes, struck and counted ("…putting it off because…, but"), and what is left fits one post */
  const a = sl(LONG[0]); assert.match(a.line, /^After the tenth person asked me about it/); assert.ok(a.cut.some(c => c.kind === 'throat' && /meaning to write this up/.test(c.text)));
  assert.match(sl(LONG[7]).line, /^After a difficult year of job searching/);
  /* "I want to talk about something that X, which is the fact that Y" → "Something that X: Y" */
  assert.match(sl(LONG[1]).line, /^Something that doesn't get said enough in the design world: most of the best designers/);
  /* a header the run-up left leads the thread; three posts where two won't fit */
  const c = sl(LONG[2]); assert.equal(c.thread.length, 3); assert.match(c.line, /^The whole story of how we lost our biggest customer/); assert.match(c.note, /posts 2 and 3/);
  /* a story's run-up goes and the story is the header */
  assert.match(sl(LONG[3]).line, /^The worst job interview I ever had, .*other people:$/);
  /* no break keeps every post whole: the line ships whole, never "and how…" or "which…" as a post */
  assert.equal(S.firstPost(LONG[9]), '');
  assert.equal(S.firstPost('Short line.'), 'Short line.');
});

test('v5.5 H2: announce run-ups go as a family; the topic is the header; no word added', () => {
  for (const [t, want] of ANNOUNCE) { const R = sl(t); assert.equal(shipped(R), want, t); assert.deepEqual(D.added55(shipped(R), t).filter(w => !/^(?:most|some)$/.test(w)), [], t); }
  /* a short "let me tell you about X" keeps the v4.9 read: no header with nothing under it */
  assert.equal(sl('Let me tell you a story about the worst trade I ever made').state, 'unsure');
});

test('v5.5 H3: a reorder never adds "what changed" and never moves a sentence ahead of its "that"', () => {
  for (const t of REORDER) {
    const R = sl(t);
    for (const v of [shipped(R), ...(R.alts || []).map(a => a.line)]) assert.doesNotMatch(v, /\bwhat changed\b/i, t);
    const S0 = (x => x.split(/(?<=[.!?])\s+/))(shipped(R)); assert.ok(!/(?:\bthat|\bit)\W*$/i.test(S0[0]) || S0.length === 1, t);
  }
  assert.equal(shipped(sl(REORDER[0])), 'i switched our images to webp and the page weight dropped from 4.2mb to 900kb. i didn\'t expect that');
  assert.equal(shipped(sl(REORDER[3])), 'I added one sentence to the welcome email and activation went from 22% to 41%. That surprised me.');
});

test('v5.5 H4: the why is true: no "Kept “I think”" on "how I think about", no "news" on an opinion, "breaks" held to slStruct', () => {
  for (const t of ['This book completely changed how I think about money: "Spend like you\'ll have to explain it to your kids."', 'The one podcast that shaped how I think about hiring is a 40-minute interview from 2019.', 'What I think about before every headline I write: who is scrolling past this and why would they stop?']) assert.doesNotMatch(sl(t).why, /Kept “I think”/, t);
  for (const t of ['i never thought i\'d be the one saying this but i actually like meetings now', 'I never thought I\'d say this, but I miss my old desk job']) assert.doesNotMatch(sl(t).why, /news like this/, t);
  assert.match(sl(HESIT[0][0]).why, /news like this/);
  for (const t of ALL) { const R = sl(t), m = String(R.why).match(/“([^”]{2,60})”(?:, not cut: without it this line breaks\.| stays: without it (?:this|the) line breaks\.)/); if (m) assert.ok(D.breakTrue(R.why, shipped(R), R.draft), R.why); }
});

test('v5.5 H6: a labeled take keeps its hedge as a call; a hesitant opener is a call, never a silent cut', () => {
  for (const t of TAKES) { const R = sl(t); assert.match(shipped(R), /\bprobably\b/, t); assert.ok((R.calls || []).some(c => c.text === 'probably'), t); }
  const u = sl('Unpopular opinion: I think cold showers are probably overrated'); assert.equal(u.line, 'Unpopular opinion: cold showers are probably overrated'); assert.ok(u.calls.some(c => c.text === 'probably'));
  for (const [t, rest] of HESIT) {
    const R = sl(t); assert.equal(shipped(R), t, t); assert.equal(R.cut.length, 0, t);
    const c = (R.calls || [])[0]; assert.ok(c && R.marks.some(m => m[3] === 'call' && m[0] === c.draftAt[0]), t); assert.equal(c.line, rest, t); assert.match(R.say, /left to you/, t);
  }
  /* no hard news: the why says it is how they chose to say it */
  assert.match(sl('Honestly, I don\'t know how to start this post, so here it is: I\'m leaving my job.').why, /Your opener is how you chose to say it/);
});

test('v5.5 page: stock adjectives are marked or cut, never kept unmarked; a trimmed "!!!" is a counted cut', () => {
  const STK = /(?<![\p{L}-])(?:seamless|ai-powered|next-level|cutting-edge|best-in-class|revolutionary|game-changing)(?=,?\s+\p{L})/giu;
  for (const t of STOCK) {
    const R = sl(t), L = shipped(R);
    for (const m of L.matchAll(STK)) assert.ok((R.calls || []).some(c => c.text.replace(/,$/, '').toLowerCase() === m[0].toLowerCase()), `${t}: “${m[0]}” unmarked`);
    if (L !== t) for (const m of t.matchAll(STK)) if (!new RegExp(m[0], 'i').test(L)) assert.ok(R.cut.some(c => c.text.toLowerCase() === m[0].toLowerCase()), `${t}: “${m[0]}” went uncounted`);
  }
  assert.equal(shipped(sl('We\'re thrilled to launch our next-level analytics dashboard for small teams')), 'We\'re launching our analytics dashboard for small teams');
  for (const t of ['So excited to announce that we just hit 10,000 users today!!!', 'We\'re live on Product Hunt!!! Would love your support', 'WE DID IT!!! 1,000 paying customers']) { const R = sl(t); assert.ok(R.cut.some(c => c.kind === 'punct' && /^!+$/.test(c.text)), t); assert.match(R.say, /^Cut \d+ bits? of fluff/, t); }
});
