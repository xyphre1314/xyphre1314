/* v5.6 (Fable round 5, on-device): one thread splitter (SHARPEN.splitPosts) that never breaks inside code or on a lowercase
   continuation, one rule for the hedge words, the run-up families, post 1 that carries the point, one rule per word ("basically",
   "personally", "There are N", "what I've learned"), receipts that name what changed, and the page-reported items (a greeting before
   an announcement, an orphaned "here", "never ever", "· N left to you").
   Built from the round's own held-out lines (scratchpad engine/heldout56.json), never from a Fable line. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const C = require('../../core.js');
const S = C.SHARPEN, sl = (t, o) => C.sharpenLine(t, o || {});
const shipped = R => R.state === 'sharp' ? R.line : R.draft;
const posts = R => R.thread || [shipped(R)];
const fluffN = R => (R.cut || []).filter(c => !/^(?:move|tight|swap|reshape)$/.test(c.kind)).length;
const xl = s => [...String(s)].length;

const CODE = [
  ['Spent the whole afternoon debugging why our build was suddenly twice as slow, and it turned out someone had added RUN npm install after COPY . . in the Dockerfile, so every single code change was busting the cache and reinstalling 1,400 packages from scratch, which is honestly the kind of thing that never shows up in a code review because the diff looks completely harmless', 'COPY . . in the Dockerfile'],
  ['So we just released v2.0 of the SDK and it\'s basically a complete rewrite... the bundle is 60% smaller, cold starts are down from 900ms to 140ms, and you can finally import individual modules instead of the whole thing, e.g. import { auth } from \'@acme/sdk\' instead of pulling in everything, which was by far the most requested change from people using it in serverless functions', 'e.g. import { auth } from \'@acme/sdk\''],
  ['The bug turned out to be a single line in api/v1/users.ts where someone compared a string to a number with == instead of ===, so every user ID above 9.9 million silently failed the check, and we spent four days blaming the database before anyone thought to look at the actual comparison that was sitting right there in plain sight', 'api/v1/users.ts'],
  ['Most of the speedup came from one change in next.config.js... we turned on output: \'standalone\' and our Docker image went from 1.2 GB to 180 MB, deploys dropped from eight minutes to under two, and our cloud bill fell by about $900 a month, all from a single config line that has been in the docs for years and that nobody on our team had ever bothered to read', 'next.config.js'],
  ['I really think that the most underrated file in any repo is .github/CODEOWNERS, because it quietly decides who has to review what, and most teams set it up once and never look at it again', '.github/CODEOWNERS'],
];

test('v5.6 f5-1: code and spaced dots are never a sentence end, and no post starts on a lowercase continuation', () => {
  for (const [t, keep] of CODE) {
    const R = sl(t), P = posts(R), all = P.join(' ');
    assert.ok(all.includes(keep), `${keep} | ${all}`);
    P.forEach((p, i) => { assert.ok(xl(p) <= 280, p); if (i) assert.match(p, /^\P{L}*\p{Lu}/u, p); });
    assert.doesNotMatch(all, /COPY\. |COPY\.\./);
  }
  /* "e.g.", a numbered list's "1." and an ellipsis before a lowercase word end no sentence */
  assert.equal(S._dbg.mask56('git add . && COPY . .'), 'git add  && COPY  ');
  assert.equal(S._dbg.unmask56(S._dbg.mask56('cd .. then run ./build.sh')), 'cd .. then run ./build.sh');
  assert.equal(shipped(sl('Wait... the whole outage was a typo in nginx.conf?')), 'Wait... the whole outage was a typo in nginx.conf?');
  assert.equal(shipped(sl('v2.0 is live. 3x faster, half the size, same price.')), 'v2.0 is live. 3x faster, half the size, same price.');
});

test('v5.6 f5-1: SHARPEN.splitPosts is the one splitter: whole sentences, none over 280, null when no split keeps them whole', () => {
  assert.deepEqual(S.splitPosts('Short line. Fits.'), ['Short line. Fits.']);
  assert.equal(S.splitPosts('a '.repeat(150)), null);
  const t = 'I finally measured where our CI time was going. Everyone assumed it was the integration tests, but 71% of the 22 minutes was Docker rebuilding the same layers over and over because somebody had put a COPY . . above the dependency install step two years ago and nobody noticed, which means every single commit since then paid for it. We fixed it in one line.';
  const P = S.splitPosts(t);
  assert.ok(P && P.length >= 2, String(P)); P.forEach(p => assert.ok(xl(p) <= 280, p));
  assert.ok(P.join(' ').includes('COPY . . above'));
  P.slice(1).forEach(p => assert.match(p, /^\P{L}*\p{Lu}/u, p));
  /* firstPost is post 1 of the same split */
  assert.equal(S.firstPost(t), P[0]);
});

test('v5.6 f5-2: a lone hedge word on advice or a claim is a call, never a cut; a stance stacked on it goes', () => {
  for (const t of ['You probably don\'t need a CRM until you have 50 customers.', 'You probably shouldn\'t raise a seed round before you have ten paying users.', 'Most early-stage startups probably don\'t need a full-time designer yet', 'We should probably stop calling everything a platform.']) {
    const R = sl(t); assert.match(shipped(R), /\bprobably\b/, t); assert.deepEqual((R.calls || []).map(c => c.text), ['probably'], t); assert.match(R.say, / · 1 left to you$/, t);
  }
  const a = sl('I think you probably need fewer features and more users');
  assert.equal(a.line, 'You probably need fewer features and more users.'); assert.match(a.why, /Kept your “probably”/);
  assert.equal(sl('You probably want to raise your prices, to be honest').line, 'You probably want to raise your prices.');
  assert.equal(sl('Honestly you probably don\'t need microservices for a team of five').line, 'You probably don\'t need microservices for a team of five.');
});

test('v5.6 f5-3, f5-4: "worth noting" and the run-up families go, grammar-safe', () => {
  for (const [t, want] of [
    ['It\'s worth noting that 60% of churn happens in the first two weeks', '60% of churn happens in the first two weeks.'],
    ['Also worth noting that the beta is free until March', 'The beta is free until March.'],
    ['Have you ever actually stopped to think about why it is that some newsletters just feel personal?', 'Have you ever stopped to think about why some newsletters feel personal?'],
    ['Have you ever wondered why it is that the best engineers ask the simplest questions?', 'Have you ever wondered why the best engineers ask the simplest questions?'],
    ['This new pricing model is going to really change the way that agencies bill their clients', 'This new pricing model will change how agencies bill their clients.'],
    ['AI agents are going to completely change the way that we write software', 'AI agents will completely change how we write software.'],
    ['There are so many people out there who say that you need a cofounder to start a company', 'So many people say that you need a cofounder to start a company.'],
    ['The thing is that most people quit right before it starts working', 'Most people quit right before it starts working.'],
    ['We just crossed $1M ARR, so I thought I would share the 6 mistakes that almost killed us along the way:', 'We just crossed $1M ARR. The 6 mistakes that almost killed us along the way:'],
    ['Got our first 100 customers last week so I figured I would share how we found them:', 'Got our first 100 customers last week. How we found them:'],
    ['I\'m really very proud of what this team shipped in 2026', 'I\'m very proud of what this team shipped in 2026.'],
  ]) assert.equal(sl(t).line, want, t);
  /* a header with nothing under it still stays, said so */
  const h = sl('It\'s worth noting the obvious:'); assert.equal(h.state, 'unsure'); assert.equal(shipped(h), 'It\'s worth noting the obvious:');
});

test('v5.6 f5-6: over 280 opens a thread whose post 1 carries the point, or post 1 is trimmed to fit', () => {
  const a = sl('I didn\'t really plan to share this publicly at all, but three weeks ago my doctor told me my blood pressure was dangerously high at 34, and since then I have walked 10,000 steps every single day, cut out almost all alcohol and started sleeping eight hours, and this morning the reading was completely normal for the first time in years');
  assert.ok(xl(a.line) <= 280); assert.match(a.line, /^Three weeks ago my doctor told me/);
  const b = sl('Not sure if this will resonate with anyone but I\'ve been thinking a lot lately about how most of the advice we give new managers is basically about controlling outcomes when the actual job is mostly about creating the conditions where other people can do their best work without you constantly hovering over them and checking in on them every hour');
  assert.match(b.line, /^Most of the advice we give new managers is about controlling outcomes/); assert.ok(xl(b.line) <= 280); assert.doesNotMatch(b.line, /:$/);
  const c = sl('So about two years ago I was working a job I hated, commuting ninety minutes each way, and spending every single evening on a side project that nobody was paying for, and I honestly thought I would be doing that forever until a stranger on this app bought the template I had posted as a joke, and that one sale turned into a business that now pays my rent');
  assert.equal(c.thread.length, 2); assert.match(c.thread[0], /nobody was paying for\.$/); assert.match(c.thread[1], /^I thought I’d be doing that forever/);
  const d = sl('I\'ve been freelancing for about six years now, and if there\'s one thing that I\'ve learned in all of that time it\'s that the clients who negotiate the hardest on price at the start are almost always the ones who end up being the most difficult to work with later on, and the ones who just say yes to your rate are usually the ones who refer you to their friends');
  assert.doesNotMatch(posts(d).join(' '), /one thing that I've learned/); posts(d).forEach(p => assert.ok(xl(p) <= 280, p));
  const e = sl('I wasn\'t going to post about this but last week our team finally shipped the feature that customers had been asking for since 2022, and the response has been so overwhelming that our support inbox went from 20 emails a day to more than 600, and honestly I have never been more tired or more grateful in my entire life than I am right now sitting here at midnight answering every one of them myself');
  assert.match(e.line, /^Last week our team finally shipped the feature/); assert.match(e.why, /went\. It opens a thread/);
});

test('v5.6 f5-7: one rule per word', () => {
  /* "basically": nearly → a call; before a count or as filler → a cut */
  const n = sl('We basically doubled our revenue in 90 days by fixing one email'); assert.equal(shipped(n), 'We basically doubled our revenue in 90 days by fixing one email'); assert.deepEqual(n.calls.map(c => c.text), ['basically']);
  assert.deepEqual(sl('We were basically broke for the first two years').calls.map(c => c.text), ['basically']);
  assert.equal(sl('basically 4 things made our launch work: timing, a waitlist, one great demo and luck').line, '4 things made our launch work: timing, a waitlist, one great demo and luck');
  assert.equal(sl('I basically wrote 3 drafts of this before posting it').line, 'I wrote 3 drafts of this before posting it.');
  assert.equal(sl('So basically, we ran out of money and nobody told me').line, 'We ran out of money. Nobody told me.');
  /* "personally": after "I" it restates the subject; "take it personally" is the idiom */
  assert.equal(sl('Here are 6 tools I personally pay for every month:').line, '6 tools I pay for every month:');
  assert.equal(shipped(sl('Don\'t take rejection personally. It\'s almost never about you.')), 'Don\'t take rejection personally. It\'s almost never about you.');
  /* number first for "There are N" as for "Here are N", on a list header only */
  assert.equal(sl('There are 4 things every landing page needs above the fold:').line, '4 things every landing page needs above the fold:');
  assert.equal(sl('There are two kinds of founders: builders and sellers.').line, 'Two kinds of founders: builders and sellers.');
  assert.equal(shipped(sl('There are only 2 ways to grow a newsletter, and neither of them is fast.')), 'There are only 2 ways to grow a newsletter, and neither of them is fast.');
  /* "some of the things I've learned" is "what I've learned" */
  assert.equal(sl('A few of the things that I\'ve noticed after reviewing 300 resumes this month 🧵').line, 'What I\'ve noticed after reviewing 300 resumes this month 🧵');
  assert.equal(sl('After 5 years of running a design agency, here are some of the things that I\'ve learned about pricing:').line, 'After 5 years of running a design agency, here\'s what I\'ve learned about pricing:');
});

test('v5.6 page items: a greeting before an announcement, an orphaned "here", "never ever", "Here are N", "· N left to you"', () => {
  for (const [t, want] of [
    ['GM fam, so excited to announce that our app just hit 50,000 downloads 🚀', 'Our app just hit 50,000 downloads 🚀'],
    ['GM! Super excited to share that I\'m joining Stripe as a design lead', 'I\'m joining Stripe as a design lead.'],
    ['gm everyone! really excited to share that we\'re opening the beta tomorrow', 'we\'re opening the beta tomorrow'],
    ['We hit 10k users without spending a dollar on ads, which nobody saw coming, not even our own team to be honest with you all here', 'We hit 10k users without spending a dollar on ads, which nobody saw coming, not even our own team.'],
    ['It took me four years to figure this out, if I\'m being honest here', 'It took me four years to figure this out.'],
    ['Here are 5 things I learned after losing my first big client:', '5 things I learned after losing my first big client:'],
    ['Here are 3 lessons I learned from running a marathon with no training: 1. pace 2. shoes 3. pride', '3 lessons I learned from running a marathon with no training: 1. pace 2. shoes 3. pride'],
  ]) assert.equal(sl(t).line, want, t);
  /* a greeting before anything else is the writer's voice */
  assert.match(shipped(sl('gm frens, just a reminder that $BTC is still up 40% this year')), /^gm frens, /);
  /* "i really do believe that" is a call; "never ever" is "never" */
  const b = sl('I really do believe that you should never ever hire someone you wouldn\'t want to work for');
  assert.equal(b.line, 'I really do believe you should never hire someone you wouldn\'t want to work for.');
  assert.deepEqual(b.calls.map(c => c.text), ['I really do believe']); assert.equal(b.say, 'Cut 2 bits of fluff · 1 left to you');
  assert.equal(S.callSay('Nothing to cut', 1), 'Nothing cut · 1 left to you'); assert.equal(S.callSay('Cut 1 bit of fluff', 2), 'Cut 1 bit of fluff · 2 left to you');
});

test('v5.6 f5-5: receipts come from the diff and name a change that happened', () => {
  const rows = require('./fixtures/sharpen-v56-heldout.json');
  for (const t of rows) {
    const R = sl(t), n = +((String(R.say).match(/^Cut (\d+) bits? of fluff/) || [0, 0])[1]);
    if (R.state === 'sharp') assert.equal(n, fluffN(R), `${t} | ${R.say}`);
    const k = +((String(R.say).match(/ · (\d+) left to you$/) || [0, 0])[1]); assert.equal(k, (R.calls || []).length, `${t} | ${R.say}`);
    assert.doesNotMatch(String(R.say), /your call/);
    const L = posts(R).join(' ').toLowerCase().replace(/[’‘]/g, "'"), Dl = String(t).toLowerCase().replace(/[’‘]/g, "'");
    for (const m of `${R.why || ''} ${R.note || ''}`.matchAll(/“([^”]+)”/g)) { const q = m[1].replace(/…$/, '').toLowerCase().replace(/[’‘]/g, "'"); assert.ok(Dl.includes(q) || L.includes(q), `${t} | quote ${q}`); }
    for (const m of `${R.why || ''} ${R.note || ''}`.matchAll(/(?:Left|Kept)(?: your)? “([^”]+)”/g)) assert.ok(L.includes(m[1].toLowerCase().replace(/[’‘]/g, "'").replace(/,?\s+that$/, '')), `${t} | kept ${m[1]}`);
    if (/opens a thread/i.test(R.why || '')) assert.ok(R.thread && R.thread.length > 1, t);
  }
  /* a forecast note only on a forecast; "On news like this" only on news */
  assert.doesNotMatch(String(sl('8 books that I really think every founder should be reading in 2027:').note), /plan or a forecast/);
  assert.doesNotMatch(String(sl('Nobody ever got fired for choosing the safe option. That\'s what you\'re up against.').why), /news like this/);
});
