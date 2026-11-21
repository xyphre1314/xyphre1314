/* v5.7 (page pass 22, founder-5): the engine adds no end stop and no contraction the writer didn't type, so expected lines here end as the draft ends and keep the draft's own "we are"/"I have". */
/* r86 v5.3: the on-device Sharpen after the Fable round-2 review (engine items only).
   0. "your call" marks: a stance word, a hedge or a hype word the engine kept is a mark of kind 'call' ([a, b, reason, 'call'],
      offsets on the draft), never a cut; R.calls has each one on the shipped line with the line it leaves; say reads
      "Nothing cut · 2 left to you" or "Cut 1 bit of fluff · 1 left to you"
   1. nothing broken ships: a frame is cut whole or not at all ("Just a quick note to say that"), a filler chain goes whole ("so
      um"), and no version opens on a dangling infinitive, a bare joining word or a hesitation the draft did not open on
   2. no meaning moved: a degree that is the claim stays ("really good at"), and "probably" stays on a hedged view
   3. every why is true: a "without it this line breaks" reason is checked on the line without the words it names
   4. the families Fable found missed: "The reality is that", "There are 7 … that I", "A lot of people ask me…, so I figured",
      "here is the story of how", "Long post incoming.", "not really X, it's actually Y", "I think" on the writer's own past
   5. soft run-ups: "I would argue that", "i feel like", "In my opinion" with another stance; no full stop added to a lowercase
      line that had none; "when really I was" keeps its "really"
   5b/5c. the Try box: stacked hedges collapse to one, a thread intro leads with its count, the trimmed "!" is a counted cut, a
      run-up's "I think" and "really" go on a non-forecast, a hype word in an announcement goes with its article fixed
   6. every family, on lines of its own, in every mode: no hard guard, no whole-line refusal, no dangling start */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const core = createRequire(import.meta.url)('../../core.js');
const S = (t, o) => core.sharpenLine(t, o), L = (t, o) => S(t, o).line;
const D = core.SHARPEN._dbg;
const MODES = [['default', {}], ['v4.1', { hybrid: false }], ['strict', { strict: true }]];
const versions = r => r.state === 'sharp' ? [r, ...(r.alts || [])] : [r];
/* this file's own reads, written apart from the engine */
const dangling = (l, d) => { const w = s => (String(s).toLowerCase().match(/[a-z']+/) || [''])[0]; const a = w(l), b = w(d); return a !== b && /^(?:to|and|but|that|um+|uh+)$/.test(a) && !/^to (?:my|our|the|all|everyone)\b/i.test(l); };
const callKinds = r => (r.marks || []).filter(m => m[3] === 'call').map(m => r.draft.slice(m[0], m[1]));

test('v5.3 (0): a kept hedge or stance is a "your call" mark, never a cut, and the say counts it', () => {
  const t = 'i think $BTC might hit 120k by march, so you should probably watch it', r = S(t);
  assert.equal(r.state, 'clean'); assert.equal(r.line, t); assert.equal(r.say, 'Nothing cut · 2 left to you');
  assert.deepEqual(callKinds(r), ['i think', 'probably']);
  assert.ok(r.marks.every(m => m[3] !== 'call' || /Tap to cut it/.test(m[2])), 'every call mark says what a tap does');
  assert.deepEqual(r.calls.map(c => c.line), ['$BTC might hit 120k by march, so you should probably watch it', 'i think $BTC might hit 120k by march, so you should watch it']);
  for (const c of r.calls) { assert.equal(r.line.slice(c.at[0], c.at[1]), c.text); assert.equal(r.draft.slice(c.draftAt[0], c.draftAt[1]), c.text); assert.ok(D.shipOK(c.line, t), c.line); }
  /* a sharp result that keeps a hedge: both counts, the call last */
  const g0 = S('I think $SOL could maybe hit $400 by Q2 if the ETF flows keep up, but honestly who knows');
  assert.equal(g0.say, 'Cut 2 bits of fluff · 1 left to you'); assert.deepEqual(callKinds(g0), ['I think']);
  assert.ok(!g0.cut.some(c => c.kind === 'call'), 'a call mark is never in the cut list');
  /* the founder's line: three your-call items, none of them struck */
  const f = S('I think the Fed is probably going to cut rates in September, so you should maybe buy bonds');
  assert.match(f.say, / · 2 left to you$/); assert.ok(callKinds(f).includes('maybe'));
  /* the helpers the Claude path uses */
  assert.equal(core.SHARPEN.callSay('Nothing to cut', 2), 'Nothing cut · 2 left to you');
  assert.equal(core.SHARPEN.callSay('Cut 1 bit of fluff', 1), 'Cut 1 bit of fluff · 1 left to you');
  assert.equal(core.SHARPEN.callSay('Kept as written', 0), 'Kept as written');
  assert.equal(core.SHARPEN.callCut('I think eth goes to 5k this year', 0, 7), 'eth goes to 5k this year');
  { const z = 'We raised $4M led by an amazing group of investors', a = z.indexOf('amazing'); assert.equal(core.SHARPEN.callCut(z, a, a + 7), 'We raised $4M led by a group of investors'); }
  /* not a stance: "how I think about money", "I think about this every day" */
  for (const t2 of ['This changed how I think about money forever', 'I think about this every day', 'what I believe in matters more than likes']) assert.deepEqual(callKinds(S(t2)), [], t2);
});

test('v5.3 (1): a frame is cut whole, a filler chain goes whole, and no broken line ships', () => {
  assert.equal(L('Just a quick note to say that I\'m going to be moving the newsletter from Substack to @beehiiv next week #newsletter #creatoreconomy'), 'I\'m going to be moving the newsletter from Substack to @beehiiv next week #newsletter #creatoreconomy');
  assert.equal(L('Just a quick note to let you know that the webinar moved to Thursday'), 'The webinar moved to Thursday');
  assert.equal(L('Just a quick note to self'), 'Just a quick note to self');
  assert.equal(L('so um i wrote 100 essays in 100 days and here are some of the things that i learned along the way'), 'i wrote 100 essays in 100 days. here’s what i learned along the way'); /* v5.6 (Fable round 5, f5-7): "some of the things I learned" is "what I learned", one rule */
  assert.equal(L('so uh we shipped the new app today'), 'we shipped the new app today');
  for (const [m, o] of MODES) for (const t of ['Just a quick note to say that I\'m going to be moving the newsletter next week', 'so um i wrote 100 essays in 100 days', 'ok so um yeah i quit my job', 'uhh so I think we got it wrong', 'The truth is that most newsletters die at issue 12', 'The truth is out there'])
    for (const v of versions(S(t, o))) assert.ok(!dangling(v.line, t) && !D.dangle(v.line, t), `${m}: ${t} → ${v.line}`);
  /* the guard itself */
  assert.equal(D.dangle('To say that I\'m moving the newsletter', 'Just a quick note to say that I\'m moving the newsletter'), 'dangling infinitive');
  assert.equal(D.dangle('um i wrote 100 essays', 'so um i wrote 100 essays'), 'opens on a hesitation');
  assert.equal(D.dangle('That most newsletters die at issue 12', 'The truth is that most newsletters die at issue 12'), 'opens on a joining word');
  assert.equal(D.dangle('Because we raised prices, our churn went down.', 'Due to the fact that we raised prices, our churn went down.'), '');
  assert.equal(D.dangle('So tired of people saying you need to post daily', 'honestly just so tired of people saying you need to post daily'), '');
  assert.ok(!D.shipOK('Why hiring is: hard, nobody describes the actual job.', 'I\'ve been thinking about why hiring is so hard, nobody describes the actual job'));
});

test('v5.3 (2): the degree that is the claim stays, and "probably" stays on a hedged view', () => {
  assert.equal(L('tbh the people who are really good at something are usually pretty bad at explaining why'), 'the people who are really good at something are usually pretty bad at explaining why');
  assert.match(L('It took me 10 years to realize that I was actually really, really bad at asking for help.'), /really, really bad at/);
  assert.match(L('So I finally tried the new Claude model and it\'s genuinely really good at refactoring.'), /It's really good at refactoring\.$/);
  assert.equal(L('I might be wrong about this, but I think zone 2 cardio is probably overrated for people who lift less than 3 days a week'), 'Zone 2 cardio is probably overrated for people who lift less than 3 days a week');
  assert.match(S('I might be wrong about this, but I think zone 2 cardio is probably overrated for people who lift less than 3 days a week').why, /Three hedges became one\. Kept your “probably”/);
  /* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */
  /* v5.6 (Fable round 5, f5-2): one rule for the hedge words: the lone "probably" stays as the call, the "I think" on top goes */
  for (const t of ['I think most founders probably overvalue their ideas', 'I think that remote work is probably here to stay']) { const r = S(t); assert.doesNotMatch(r.line, /\bI think\b/i, t); assert.match(r.line, /\bprobably\b/, t); }
  /* (a superlative is a guess: its "probably" stays) */
  for (const t of ['I think it\'s probably the best book I\'ve read this year']) { const r = S(t); assert.match(r.line, /\bprobably\b/, t); assert.doesNotMatch(r.why, /talk, not the point/, t); }
  /* a plan keeps every hedge (juror 4); a price call collapses to its stance verb (step 5b) */
  assert.equal(L('I think we will probably launch in March'), 'I think we will probably launch in March');
  assert.equal(L('I think that maybe $SOL is probably going to break out soon, not financial advice'), 'I think $SOL is going to break out soon, not financial advice');
  /* "when really I was" is "when in fact" */
  assert.match(L('I spent about 6 years or so thinking that I was bad at design, when really I was just bad at typography'), /^I spent about 6 years thinking I was bad at design, when really I was just bad at typography$/); /* v5.7: no end stop the writer didn't type */
});

test('v5.3 (3): a "breaks" reason is true on the line without the words it names; no news reason on a question', () => {
  for (const t of ['The truth is that most newsletters probably die at issue 12 because the writer runs out of things they actually want to say', 'This is a thread about how we scaled Postgres to 1.2 billion rows without sharding. 1/'])
    { const r = S(t); assert.equal(r.state, 'sharp', t); assert.doesNotMatch(r.why, /breaks/, t); }
  assert.doesNotMatch(S('Why do so many founders seem to think that a co-founder breakup is somehow less painful than a divorce?').why, /On news like this/);
  assert.match(S('Why did my divorce hurt less than my co-founder breakup?').why, /On news like this/);
  /* every breaks claim the engine makes, on these lines and the held-out fixture, survives the check */
  const rows = createRequire(import.meta.url)('./fixtures/sharpen-heldout.json').rows.map(r => r.t);
  let n = 0;
  for (const t of [...rows, 'I want to share some of the lessons I learned from failing my first startup', 'I made every possible mistake with our first hire. Let me tell you about them.']) {
    const r = S(t); if (!/breaks/.test(r.why)) continue; n++;
    assert.ok(D.breakTrue(r.why, r.state === 'sharp' ? r.line : r.draft, r.draft), `${t}: ${r.why}`);
  }
  assert.ok(n > 0, 'the check saw at least one breaks reason');
});

test('v5.3 (4): the families Fable found missed', () => {
  for (const [t, want] of [
    ['There are 7 on-chain metrics that I personally check every single morning before I place any trade (thread)', '7 on-chain metrics I check every morning before I place any trade (thread)'],
    ['Here is a list of the 8 VS Code extensions that I literally cannot live without as a backend developer in 2025', '8 VS Code extensions I cannot live without as a backend developer in 2025:'],
    ['There are 3 mistakes that we made in our first year of fundraising', '3 mistakes we made in our first year of fundraising:'],
    ['hot take but i don\'t really think you need a morning routine. you need a reason to get up', 'hot take: you don\'t need a morning routine. you need a reason to get up'],
    ['I think that one of the biggest mistakes that I made as a first-time founder was hiring too quickly before we had product-market fit', 'One of the biggest mistakes I made as a first-time founder was hiring too quickly before we had product-market fit'],
    ['honestly i think the best thing i ever did for my career was quitting the job everyone told me to keep', 'the best thing i ever did for my career was quitting the job everyone told me to keep'],
    ['Why do so many founders seem to think that a co-founder breakup is somehow less painful than a divorce?', 'Why do so many founders think that a co-founder breakup is less painful than a divorce?'],
    ['A lot of people ask me how I find clients as a ghostwriter, so I figured I would put together a thread explaining my process', 'A lot of people ask me how I find clients as a ghostwriter. Here’s my process:'],
    ['The reality is that your ICP does not want another 10-step framework, they want proof that you\'ve done the thing', 'Your ICP does not want another 10-step framework. They want proof that you\'ve done the thing'],
    ['Sales and marketing alignment is not really a strategy problem, it\'s actually a comp plan problem', 'Sales and marketing alignment is not a strategy problem. It\'s a comp plan problem'],
    ['This is a thread about how we scaled Postgres to 1.2 billion rows without sharding. 1/', 'How we scaled Postgres to 1.2 billion rows without sharding 1/'],
    ['I think good design is actually mostly about just removing things until it breaks, and then adding one thing back', 'Good design is mostly about removing things until it breaks, and then adding one thing back'], /* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */
    ['I wasn\'t going to post this, but a few people asked, so here is the story of how I paid off $87,000 of debt in 26 months', 'I paid off $87,000 of debt in 26 months. Here is the story:'],
    ['So I\'ve been thinking a lot lately about why most people who buy the top never actually sell the bottom, they just stop checking the app', 'Most people who buy the top never actually sell the bottom. They just stop checking the app'],
    ['At the end of the day, I think that the thing that I regret the most is not the failures, it\'s actually the years I spent waiting', 'The thing I regret the most is not the failures. It\'s the years I spent waiting'],
    ['My newsletter just passed 25,000 subscribers and I wanted to take a moment to share some of the lessons I\'ve learned', 'My newsletter just passed 25,000 subscribers. Some of the lessons I\'ve learned:'],
    ['I grew from 0 to 10k subs in 8 months without paid ads, here\'s the exact playbook I used (steal it)', 'I grew from 0 to 10k subs in 8 months without paid ads. Here\'s the exact playbook I used (steal it)'],
    ['So this is kind of a long story but basically I moved to Lisbon with no job, no friends, and no plan, and it was the best decision I ever made', 'I moved to Lisbon with no job, no friends, and no plan. It was the best decision I ever made'],
  ]) assert.equal(L(t), want, t);
  /* "Long post incoming." never opens post 1 */
  assert.match(L('Long post incoming. Last March my co-founder called me at 2am to tell me he was leaving the company, and I remember sitting on the kitchen floor thinking that everything we had built over five years was about to fall apart, that I\'d have to tell 23 employees they were out of a job, and that I had absolutely no idea what I was going to say to our investors on Monday morning.'), /^Last March my co-founder called me at 2am/);
  /* the receipt counts the count lead and every cut */
  const c = S('There are 7 on-chain metrics that I personally check every single morning before I place any trade (thread)');
  assert.equal(c.say, 'Cut 2 bits of fluff · Number first'); assert.ok(c.cut.every(x => c.draft.slice(x.at[0], x.at[1]) === x.text));
});

test('v5.3 (5): soft run-ups go; a lowercase line gets no full stop it never had', () => {
  assert.equal(L('I would argue that thought leadership is essentially just having opinions and being willing to be wrong in public'), 'Thought leadership is just having opinions and being willing to be wrong in public');
  assert.equal(L('i just feel like maybe we should all be posting less and making more stuff'), 'maybe we should all be posting less and making more stuff'); /* v5.6 (Fable round 5, f5-2): the lone "maybe" is the call */
  assert.equal(L('In my opinion, I really think that most founders should probably raise less'), 'Most founders should probably raise less'); /* v5.6 (Fable round 5, f5-2): the stances go, the one "probably" stays as the call */ /* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */
  assert.equal(L('I feel like you should read more fiction'), 'I feel like you should read more fiction');
  for (const t of ['honestly i think most people overthink their first post', 'so basically you should sell into strength, not into panic', 'gm. honestly feeling pretty bullish on sol right now ngl'])
    { const r = S(t); assert.equal(r.state, 'sharp', t); assert.doesNotMatch(r.line, /[^.]\.$/, `${t} → ${r.line}`); }
  /* a question keeps the question mark it earns */
  assert.doesNotMatch(L('is anyone else kind of tired of pretending that hustle culture didn\'t work for them'), /\?$/); /* v5.4 (step 1): never a "?" the writer didn't type */
});

test('v5.3 (5b/5c): the Try-box lines the jurors pasted', () => {
  assert.equal(L('In this thread I will explain 7 reasons why most traders lose money (and how to fix it)'), '7 reasons why most traders lose money (and how to fix it):');
  const bang = S('Excited to announce that we raised $2M!!! 🚀');
  assert.equal(bang.line, 'We raised $2M!! 🚀'); assert.ok(bang.cut.some(c => c.kind === 'punct' && c.text === '!'), 'the trimmed "!" is a cut'); assert.equal(bang.say, 'Cut 2 bits of fluff');
  const sh = S('I just wanted to say that I think we really shipped the best release ever today');
  assert.equal(sh.line, 'We shipped the best release ever today'); assert.equal(sh.say, 'Cut 3 bits of fluff'); assert.deepEqual(sh.cut.map(c => c.text), ['I just wanted to say that', 'I think', 'really']);
  assert.equal(L('Excited to announce that we raised a $4M seed round led by an amazing group of investors!'), 'We raised a $4M seed round led by a group of investors!');
  /* thanks keeps its warmth; a hype word the engine keeps is a call */
  assert.match(L('Our agency just signed our 20th client this quarter! So grateful for this amazing team.'), /amazing team/);
  /* a forecast keeps the stance after the run-up */
  assert.match(L('I just wanted to say that I think $BTC will hit 100k this year'), /^I think \$BTC will hit 100k this year/);
});

test('v5.3 (6): every family, on lines of its own, in every mode: no hard guard, no whole-line refusal, no dangling start', () => {
  const lines = [
    'There are 5 tools that I use every single day to run my agency', 'Here is a list of the 12 newsletters that I read every week', 'There are 6 habits that helped me stay consistent with lifting',
    'In this thread I\'ll break down how we grew to 10k users in 6 months', 'This is a thread about why I quit my job at Google. 1/', 'In this thread I will cover 4 mistakes that cost me $20k',
    'So many of you have asked how I edit my videos, so I figured I\'d write a thread explaining my setup', 'Lots of you asked how I run my agency solo, so I figured I would put together a thread explaining my setup',
    'I wasn\'t going to share this, but some people asked, so here\'s the story of how we got acquired', 'Here is the story of how a cold email turned into a $50k contract',
    'I\'ve been thinking a lot lately about why most founders never raise prices, they just add more features', 'I\'ve been thinking about why most dashboards go unused, nobody owns them',
    'I think the best decision I ever made was moving to Berlin at 22', 'I think the biggest regret I have is not starting sooner', 'I think ETH will outperform BTC this year',
    'I feel like most founders hire too early', 'i lowkey feel like everyone is posting the same thread', 'I feel like I\'m going to quit my job this year',
    'I think $BTC will probably retest 58k before it goes higher', 'I could be wrong, but I think most newsletters are probably too long', 'IMO, I think $LINK is probably undervalued here',
    'Growth is not really a marketing problem, it\'s actually a product problem', 'Most people don\'t fail because of bad ideas, they fail because of bad timing', 'Email is not dead, it\'s just crowded',
    'We cut our churn in half, here\'s the one email that did it', 'If you want to grow, here\'s what I\'d do',
    'I\'ve been freelancing for 5 years and I wanted to share a few lessons', 'I\'ve written 300 newsletters and I\'d like to share some of the lessons I learned',
    'It took around 5 years or so to feel confident on stage', 'Unpopular opinion: I don\'t really think founders need to post every day', 'I think AI won\'t replace designers, but it will probably replace designers who ignore it',
    'I really believe that if you want to grow a newsletter in 2025 you need to just pick one channel and go all in on it', 'We almost didn\'t ship it. I\'m really glad we did, because it\'s now our top feature.',
  ];
  for (const t of lines) for (const [m, o] of MODES) for (const v of versions(S(t, o))) {
    if (v.line === t || v === undefined) continue;
    assert.equal(D.hard(v.line, t), '', `${m}: ${t} → ${v.line}`);
    assert.ok(D.shipOK(v.line, t), `${m}: ${t} → ${v.line}`);
    assert.ok(!dangling(v.line, t), `${m}: ${t} → ${v.line}`);
  }
  /* and the plan or call is never flattened */
  assert.equal(L('I feel like I\'m going to quit my job this year'), 'I feel like I\'m going to quit my job this year');
  assert.match(L('I think ETH will outperform BTC this year'), /^I think ETH will outperform BTC this year/);
});
