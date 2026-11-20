/* v5.7 (page pass 22, founder-5): the engine adds no end stop and no contraction the writer didn't type, so expected lines here end as the draft ends and keep the draft's own "we are"/"I have". */
/* v5.4 (Fable round 3, on-device): reshape safety, long lines, call marks, the one hedge rule, run-up families.
   Built from the round's own held-out lines (scratchpad engine/heldout54.json), never from a Fable line. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../../core.js');
const S = C.SHARPEN, D = S._dbg, sl = (t, o) => C.sharpenLine(t, o || {});
const shipped = R => R.state === 'sharp' ? R.line : R.draft;
const fluffN = R => (R.cut || []).filter(c => !/^(?:move|tight|swap|reshape)$/.test(c.kind)).length;

/* the held-out shapes: plain-word swaps, beat splits with lists, colon-led lines, "Anyone …:" addresses, long lines, doubled
   "that", stock run-ups, sarcasm, deliberate repeats */
const HELD = [
  'The vast majority of us will never read the terms of service, and that\'s the whole business model',
  'A large number of them quit within the first 90 days because nobody explains the job',
  'At this point in time, the only thing I\'d change about our stack is the logging',
  'We delayed the launch due to the fact that our payment provider froze the account',
  'Each and every one of my best hires came from a referral',
  'In the event that your landing page loads slowly, nobody will ever see your pricing',
  'The majority of my clients come from Twitter, not LinkedIn',
  'Just pushed v3 of the app, it has dark mode, offline sync, and it\'s also twice as fast on older phones',
  'We hired a designer, a writer, and honestly it was the best money we spent all year',
  'Our new plan includes analytics, team seats, priority support, and it\'s really cheaper than the old one',
  'I quit sugar, alcohol, and late-night scrolling, and my sleep is honestly so much better now',
  'Bought a used camera, a cheap mic, and a ring light and I\'ve been posting daily ever since',
  'New update ships today with bug fixes, a faster editor, and it also supports Markdown now',
  'I run, I lift, and I really try to walk 10k steps every single day',
  'Hot take: most startups don\'t actually have a marketing problem, they have a product problem',
  'Update: we just crossed 1,000 paying customers and I honestly can\'t believe it',
  'Quick question: does anyone actually read their weekly analytics emails?',
  'Anyone running a SaaS under $10k MRR: you probably don\'t need a sales team yet',
  'Just a quick note for anyone who is job hunting right now: your portfolio matters more than your resume',
  'Anyone who is learning to code: build something ugly that works before you learn the perfect framework',
  'For anyone who is starting a podcast: the audio quality matters way more than the video',
  'A heads up for anyone who uses Gmail filters: they silently stop working past 1,000 rules',
  'In this thread I\'m going to walk you through exactly how I went from zero to 50,000 followers in less than a year without paying for a single ad, and I\'m also going to share the posting schedule I used, the three formats that worked best for me, and the one mistake that cost me almost two months of growth',
  'So I\'ve been thinking a lot lately about why so many early-stage founders struggle with hiring, and I honestly think it comes down to the fact that they hire for the company they want to be in five years instead of the company they actually are today, which means they end up paying for experience they can\'t use yet',
  'Here\'s a really long story about the time I accidentally deleted our production database on a Friday night, spent the whole weekend restoring it from a two-day-old backup, and then had to explain to forty angry customers why their last two days of data were gone, and what I learned from the whole mess',
  'Today I want to talk about something that I think a lot of people get wrong about content marketing, which is the idea that you need to post every single day to grow, when in reality the people who grow fastest are usually the ones who post less often but put a lot more thought into each and every post they publish',
  'I\'ve been a software engineer for twelve years and I can tell you that the single most valuable skill I\'ve developed is not any particular language or framework but the ability to sit down with a vague problem, ask the right questions, and turn it into something small enough that I can actually ship it in a single day',
  'I think that the advice that I ignored the longest was the advice that would have saved me the most money',
  'She told me that the job that I wanted didn\'t exist yet, so I should build it',
  'I wish that I knew that you could negotiate your rent',
  'Here\'s a little something that I wish that I knew before I hired my first contractor',
  'Something that I\'ve noticed is that the best managers ask more questions than they answer',
  'I\'ve come to the realization that most meetings could be a two-line message',
  'There are a lot of people who think you need a big audience to sell a course, and you really don\'t',
  'A quick little tip for anyone who writes cold emails: put the ask in the first line',
  'One thing that I\'ve realized over the years is that rest is part of the training',
  'Oh great, another productivity app that wants me to build a second brain. Really groundbreaking.',
  'Wow, an AI that writes your emails for you. Truly revolutionary stuff /s',
  'Great, another amazing webinar about how to host amazing webinars',
  'Sure, the fourth rebrand this year will probably fix the churn problem',
  'Will this coin go to zero? Probably. Probably. But I\'m holding anyway.',
  'It\'s probably fine. It\'s probably fine. It\'s probably fine. (It was not fine.)',
  'I think it\'ll work. I think. Maybe. Kind of.'
];

test('v5.4 step 1: every shipped version passes the positive whole-sentence read (no broken slot, list, "?", weld or "that")', () => {
  for (const t of HELD) {
    const R = sl(t);
    for (const v of [R.line, ...(R.alts || []).map(a => a.line)]) {
      if (R.state !== 'sharp' || v === R.draft) continue;
      assert.equal(D.bad54(v, R.draft), '', `${t}\n → ${v}`);
      assert.ok(D.shipOK(v, R.draft), `shipOK: ${v}`);
    }
    if (R.state === 'sharp') { const m = String(R.say).match(/^Cut (\d+) bits? of fluff/); assert.equal(m ? +m[1] : 0, fluffN(R), `receipt counts the cuts: ${t} → ${R.say}`); }
  }
});

test('v5.4 step 1: a plainer word keeps the grammar of its slot', () => {
  /* v5.7 (Fable round 6, H12): "the vast majority" is a stronger quantity than "most": it stays, so its slot is never touched */
  assert.match(shipped(sl('The vast majority of us will never read the terms of service, and that\'s the whole business model')), /^The vast majority of us\b/);
  assert.match(sl('The majority of my clients come from Twitter, not LinkedIn').line, /^Most of my clients\b/);
  for (const t of HELD) assert.doesNotMatch(shipped(sl(t)), /\b(?:most|some) (?:us|them|my|our|your|the)\b/i, t);
});

test('v5.4 step 1: never a "?" the writer didn\'t type; an "Anyone …:" address is a statement', () => {
  for (const t of HELD) { const L = shipped(sl(t)); assert.ok((L.match(/\?/g) || []).length <= (t.match(/\?/g) || []).length, `${t} → ${L}`); }
  const R = sl('A heads up for anyone who uses Gmail filters: they silently stop working past 1,000 rules');
  assert.equal(R.state, 'sharp'); assert.match(R.line, /^Anyone who uses Gmail filters: they silently stop working past 1,000 rules$/); /* v5.7: no end stop the writer didn't type */
  assert.match(sl('Anyone who is learning to code: build something ugly that works before you learn the perfect framework').line, /framework$/);
});

test('v5.4 step 1: a beat split never eats a series\' "and"', () => {
  const a = sl('We hired a designer, a writer, and honestly it was the best money we spent all year');
  assert.match(shipped(a), /a writer, and\b/);
  const b = sl('I run, I lift, and I really try to walk 10k steps every single day');
  assert.match(shipped(b), /I lift, and\b/);
  const c = sl('Just pushed v3 of the app, it has dark mode, offline sync, and it\'s also twice as fast on older phones');
  assert.match(shipped(c), /offline sync, and\b/);
  /* a closed series may still split at the next "and" */
  const d = sl('I quit sugar, alcohol, and late-night scrolling, and my sleep is honestly so much better now');
  assert.match(shipped(d), /sugar, alcohol, and late-night scrolling/);
});

test('v5.4 step 2: never more than 280 with the run-up in; post 1 ends on a whole sentence, the rest is post 2', () => {
  const RUNUP = /^(?:In this thread|So I've been|I've been thinking|Here's a|Today I want|I just wanted|I want to)/i;
  for (const t of HELD.filter(x => C.xLength(x) > 280)) {
    const R = sl(t), L = shipped(R);
    /* over 280 only once the run-up is cut: then the line ships whole, with the note that it can open a thread */
    if (C.xLength(L) > 280) { assert.ok(R.state === 'sharp' && L !== R.draft && !RUNUP.test(L), `${C.xLength(L)} with the run-up in: ${L}`); assert.match(R.note, /Over 280/); continue; }
    /* v5.5 (Fable round 4, H1): a run-up the line lost may leave a header that fits one post ("The time I deleted…:"); a thread's post 1 still ends on a whole sentence */
    /* v5.7 (page pass 22, founder-5): a draft with no end stop gets none, so a one-post line may end as the writer ended it */
    assert.match(L, R.thread ? /[.!?…]$/ : /[.!?…]["”’)]*\s*$/.test(t) ? /[.!?…:]$/ : /[.!?…:]$|[^\s.,;]$/, `ends on a finished sentence: ${L}`);
    assert.doesNotMatch(L, /\babout why\.$/, L);
    if (R.thread) { assert.equal(R.thread[0], L); assert.ok(R.post2 && R.post2.length > 10, 'post 2 carries the rest'); assert.match(R.say, /Opens a \d+-post thread/); /* v5.5: the say names the thread */ }
  }
  /* the same rule the page can call */
  const p = S.firstPost('Here\'s a really long story about the time I accidentally deleted our production database on a Friday night, spent the whole weekend restoring it from a two-day-old backup, and then had to explain to forty angry customers why their last two days of data were gone, and what I learned from the whole mess');
  /* v5.5 (Fable round 4, H1): post 2 would open on "and what I learned…", no sentence: no thread keeps every post whole, so '' */
  assert.equal(p, '');
  assert.equal(S.firstPost('Short line.'), 'Short line.');
});

test('v5.4 step 3: no call marks on sarcasm or on a deliberate repeat; a hedge said as its own beat stays', () => {
  for (const t of ['Oh great, another productivity app that wants me to build a second brain. Really groundbreaking.', 'Wow, an AI that writes your emails for you. Truly revolutionary stuff /s', 'Great, another amazing webinar about how to host amazing webinars', 'Sure, the fourth rebrand this year will probably fix the churn problem', 'Will this coin go to zero? Probably. Probably. But I\'m holding anyway.', 'It\'s probably fine. It\'s probably fine. It\'s probably fine. (It was not fine.)', 'I think it\'ll work. I think. Maybe. Kind of.']) {
    const R = sl(t); assert.equal((R.calls || []).length, 0, t); assert.ok(!(R.marks || []).some(m => m[3] === 'call'), t);
  }
  assert.equal(shipped(sl('I think it\'ll work. I think. Maybe. Kind of.')), 'I think it\'ll work. I think. Maybe. Kind of.');
});

test('v5.4 step 3: one rule for hedges and stance words: a call on a forecast, a cut on a plain view', () => {
  const view = sl('I think most onboarding emails are way too long');
  assert.equal(view.state, 'sharp'); assert.match(view.line, /^Most onboarding emails are way too long$/); /* v5.7: no end stop the writer didn't type */ assert.equal((view.calls || []).length, 0);
  const fc = sl('I think $ETH will probably retest 2k next week');
  assert.ok((fc.calls || []).length >= 1, 'a forecast keeps its stance as a call'); assert.match(shipped(fc), /I think/);
  const arg = sl('I\'d argue that most teams will ship slower next year');
  assert.ok((arg.calls || []).some(c => /argue/i.test(c.text)), '"I\'d argue" on a forecast is a call');
  const argV = sl('I\'d argue that most dashboards are cluttered');
  assert.doesNotMatch(shipped(argV), /argue/i, '"I\'d argue" on a plain view is a cut');
});

test('v5.4 step 4: doubled "that" and stock run-ups, as families with grammar-safe cuts', () => {
  assert.equal(sl('I wish that I knew that you could negotiate your rent').line, 'I wish I knew you could negotiate your rent');
  assert.equal(sl('Here\'s a little something that I wish that I knew before I hired my first contractor').line, 'What I wish I knew before I hired my first contractor:');
  assert.equal(sl('Something that I\'ve noticed is that the best managers ask more questions than they answer').line, 'The best managers ask more questions than they answer');
  assert.match(sl('I\'ve come to the realization that most meetings could be a two-line message').line, /^I['’]ve realized\b/);
  assert.match(sl('There are a lot of people who think you need a big audience to sell a course, and you really don\'t').line, /^A lot of people think\b/);
  assert.match(sl('A quick little tip for anyone who writes cold emails: put the ask in the first line').line, /^Anyone who writes cold emails: put the ask in the first line$/);
  /* a family's why names what it took */
  assert.match(sl('Something that I\'ve noticed is that the best managers ask more questions than they answer').why, /“Something that I've noticed is that” went/);
});
