/* r86 v4.1: the on-device engine after the round-5 v4 review (hook4-1, 2, 4, 5, 6, 7) and the round-6 page jurors' engine items
   (founder-1/2, marketing-2/3, uiux-1), held as rules. Written apart from the engine's own picks:
   1. hook4-1, P0: the new hard guards. Each rejects the broken or changed version it names and passes its clean twin
   2. hook4-1: the juror's three broken set-2 lines, the founder's three and the "Series A is closed" swap come back whole
   3. P0 sweep: no version the engine returns (the line and every alt) trips a hard guard on 80 tempting lines written for this
      pass, and none of them comes back with a new content word, a split-off clause or a lost stance
   4. hook4-2: the server's fallback once Claude's versions are all rejected ships only a plain cut
   5. hook4-4: placeholder text is thin only when it is half the line, and the result says which kind of thin
   6. hook4-7, founder-2: the policy the Claude prompt keeps ("really" under a negation or on a feeling, "actually" that
      carries a contrast, scope words, "In my opinion"/"IMO" as the clause's one hedge)
   7. hook4-6, marketing-2: the run-ups the engine missed
   8. hook4-5, marketing-3: true notes and one human clean line */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const core = createRequire(import.meta.url)('../../core.js');
const S = (t, o) => core.sharpenLine(t, o), L = (t, o) => S(t, o).line;
const hard = core.SHARPEN._dbg.hard;
const versions = r => [r.line, ...(r.alts || []).map(a => a.line)].filter(l => l !== r.draft);
/* v4.3 (round-8 founder-1, page pass 9): the softer clean copy, still only what the engine knows */
const CLEAN = 'This quick check found nothing to cut, so it stays as you wrote it.';

test('v4.1, hook4-1: every new hard guard rejects what it names and passes its clean twin', () => {
  const W37 = 'So after a lot of back and forth, we\'ve decided to shut down our consumer app and go all in on B2B.';
  const W44 = 'When we started, I had no idea what I was doing, and I think if I\'m being really honest with myself, the only reason we\'re still here is luck.';
  const W83 = 'Eight years into my career as a software engineer, and I\'m honestly starting to think most code comments are kind of useless.';
  const cases = [
    /* [the guard's reason, broken version, clean version, draft] */
    ['verb agreement', "We're shutting down our consumer app and go all in on B2B.", "We're shutting down our consumer app and going all in on B2B.", W37],
    ['verb agreement', "We're sunsetting the free plan and move everyone to Pro.", "We're sunsetting the free plan and moving everyone to Pro.", "After a lot of thinking, we've decided to sunset the free plan and move everyone to Pro."],
    ['frame tail left', "When we started, I had no idea what I was doing, and I think with myself, the only reason we're still here is luck.", "When we started, I had no idea what I was doing, and I think the only reason we're still here is luck.", W44],
    ['frame tail left', 'With you all, I almost quit last month.', 'I almost quit last month.', "If I'm being completely honest with you all, I almost quit last month."],
    ['frame tail left', 'To you, the first 1,000 subscribers were the hardest part.', 'The first 1,000 subscribers were the hardest part.', 'Not gonna lie to you, the first 1,000 subscribers were the hardest part.'],
    ['verbless opener', 'Eight years into my career as a software engineer, and most code comments are kind of useless.', "Eight years into my career as a software engineer, and I'm starting to think most code comments are kind of useless.", W83],
    ['stance dropped', 'Most code comments are kind of useless.', "I'm starting to think most code comments are kind of useless.", "I'm honestly starting to think most code comments are kind of useless."],
    ['stance dropped', "$SOL isn't done pumping yet.", "I don't think $SOL is done pumping yet.", "fwiw I don't think $SOL is done pumping yet."],
    ['subordinate clause alone', "If you're not using stop losses. You're gambling.", "If you're not using stop losses, you're gambling.", "If you're not using stop losses, you're basically gambling"],
    ['subordinate clause alone', 'That most newsletters are just link dumps.', 'The truth is that most newsletters are just link dumps.', 'The truth is that most newsletters are basically just link dumps'],
    ['that-clause lost its verb', "Most people don't realize that the first line? The whole tweet.", "Most people don't realize that the first line is the whole tweet.", "Most people don't realize that the first line is literally the whole tweet"],
    ['fragment', "Speaking as someone who's designed apps for a decade. Always design with real content, not lorem ipsum.", "Speaking as someone who's designed apps for a decade, it's super important to always design with real content, not lorem ipsum.", "Speaking as someone who's designed apps for a decade, it's super important to always design with real content, not lorem ipsum."],
    ['doubled predicate', 'We raised a Series A is closed.', 'Our Series A is closed.', 'Excited to share that our Series A is closed'],
    /* a stub left at the end: the fragment guard sees it first, the stub guard backs it up */
    [null, 'hope you’re all having a great week! pricing.', 'Today I want to talk about pricing.', 'hey everyone, hope you are all having a great week! today I want to talk about pricing'],
    ['word added', 'Our team proudly shipped v2.', 'Our team shipped v2.', 'I just wanted to share that our team shipped v2']
  ];
  for (const [why, bad, good, draft] of cases) {
    if (why) assert.equal(hard(bad, draft), why, `${why}: ${bad}`); else assert.ok(hard(bad, draft), bad);
    assert.equal(hard(good, draft), '', `${why}, clean twin: ${good}`);
  }
  /* what the guards leave alone: a conditional with its main clause and no comma, an answer after a question, a closing
     "Anyone else?", the engine's own plain-word swaps and new word forms, a progressive with "to" + verb */
  for (const [l, d] of [
    ["If you're not using a stop loss you're just gambling with extra steps.", "Basically if you're not using a stop loss you're really just gambling with extra steps, I'm sorry but it's true"],
    ['Most underrated thing you can do for your health? Walking 10k steps a day.', 'Walking 10k steps a day is honestly the most underrated thing you can do for your health.'],
    ['This market is really, really boring right now. Anyone else?', 'Does anyone else feel like this market is just really, really boring right now?'],
    ['Use your network to land your first ten customers.', 'Leverage your network to land your first ten customers.'],
    ["We're raising our prices by 30% for new customers.", "After a lot of back and forth, we've decided to raise our prices by 30% for new customers."],
    ["I've ghostwritten for 40+ SaaS founders. Most of them are too scared to post their real opinions.", 'After ghostwriting for 40+ SaaS founders, I can confidently say most of them are honestly too scared to post their real opinions.'],
    ["We're going to shut down the beta and move everyone over.", "We're going to shut down the beta and move everyone over."]
  ]) assert.equal(hard(l, d), '', l);
});

test('v4.1, hook4-1 and the round-6 jurors: the broken lines come back whole', () => {
  const W44 = "When we started this company three years ago, I honestly had absolutely no idea what I was doing, and I think if I'm being really honest with myself, the only reason we're still here today is because we were too stubborn to quit when every single sensible person around us was telling us that it was time to move on and get a real job.";
  assert.equal(L("So after a lot of back and forth, we've decided to shut down our consumer app and go all in on B2B."), "We're shutting down our consumer app and going all in on B2B.");
  assert.match(L(W44), /\. The only reason we're still here today is because/); /* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */
  assert.equal(L("Eight years into my career as a software engineer, and I'm honestly starting to think most code comments are kind of useless."), "Eight years into my career as a software engineer, and I'm starting to think most code comments are kind of useless.");
  /* founder-1: no conditional split off its main clause, no "?" after a that-clause, no clause left on "That" */
  assert.equal(L("If you're not using stop losses, you're basically gambling"), "If you're not using stop losses, you're gambling.");
  assert.equal(L("Most people don't realize that the first line is literally the whole tweet"), "Most people don't realize that the first line is the whole tweet.");
  /* v5.3 (Fable g-43/g-57): "The truth is that" goes whole now, with its "that", so nothing is left dangling */
  assert.equal(L('The truth is that most newsletters are basically just link dumps'), 'Most newsletters are just link dumps.');
  /* uiux-1: the round swap reads its clause first; a pleasantry before the point is a warm-up */
  assert.equal(L('Excited to share that our Series A is closed'), 'Our Series A is closed.');
  assert.equal(L('Excited to share that our seed round is closed!'), 'Our seed round is closed!');
  assert.equal(L('Our seed round was oversubscribed in 48 hours.'), 'Our seed round was oversubscribed in 48 hours.');
  assert.equal(L('hey everyone, hope you are all having a great week! today I want to talk about pricing'), 'today I want to talk about pricing');
  /* honesty frames go with their tails */
  assert.equal(L("If I'm being completely honest with you all, I almost quit last month."), 'I almost quit last month.');
  assert.equal(L('Not gonna lie to you, the first 1,000 subscribers were the hardest part.'), 'The first 1,000 subscribers were the hardest part.');
  /* a second verb under the same "to" takes the progressive too; a "to" + verb after the progressive keeps it bare */
  assert.equal(L("We've officially decided to rebuild the app from scratch and launch it in March."), "We're rebuilding the app from scratch and launching it in March.");
  assert.equal(L("We're shutting down the beta next week and moving all users to the new dashboard."), "We're shutting down the beta next week and moving all users to the new dashboard.");
  /* "in just six weeks" is "only six weeks" */
  assert.match(L('So proud to share that our team was able to ship v3 in just six weeks.'), /in just six weeks/);
});

/* 60 tempting lines and 20 announce or swap lines written for this pass, before the guards (first contact: 5 broke) */
const TEMPT = [
  "So after months of going back and forth, I've decided to quit my job and travel for a year.",
  "After a lot of thinking, we've decided to sunset the free plan and move everyone to Pro.",
  "Honestly, we've decided to pause hiring and focus on profitability for the rest of 2026.",
  "I've decided to delete Instagram and spend that time writing instead.",
  "We've officially decided to rebuild the app from scratch and launch it in March.",
  'To be honest with you, I have no idea how we survived our first year.',
  "If I'm being completely honest with you all, I almost quit last month.",
  "I'll be real with you guys, this launch did not go the way I planned.",
  'Not gonna lie to you, the first 1,000 subscribers were the hardest part.',
  'Honestly, between you and me, most growth hacks are just good copywriting.',
  "Three years into building this startup, and I'm finally starting to understand sales.",
  'Two weeks after launch, and I honestly think we got our pricing completely wrong.',
  "Ten years in tech, and I'm only now realizing how much soft skills matter.",
  "Day 30 of learning to code, and I'm genuinely starting to feel like a real developer.",
  'Six months of posting every single day, and honestly I think consistency is overrated.',
  "I'm starting to think that most productivity advice is just procrastination with extra steps.",
  "I'm beginning to believe that remote work is basically better for deep work.",
  "I've slowly come to realize that the best marketing is a product people actually love.",
  "I'm so excited to announce that I've officially joined Linear as a product designer!",
  "We're proud to share that our open-source library just crossed 10,000 stars on GitHub.",
  "Super grateful to share that I'm finally debt-free after six years of paying off loans.",
  'Happy to announce that my first book is now available for preorder.',
  "Honored and humbled to announce that we've been named one of Fast Company's most innovative startups.",
  "It's really important to talk to your users before you write a single line of code.",
  "Building in public taught me that it's super important to share your failures too.",
  "I think it's really, really important to take breaks when you're burnt out.",
  'This weekend I decided to write a thread on why most landing pages convert so badly 🧵',
  'I decided to put together a guide on how I grew my newsletter to 20k subscribers (link below).',
  "fwiw I don't think $SOL is done pumping yet.",
  "tbh I'm kind of tired of every app adding an AI chatbot.",
  "I don't really think AI is going to replace designers anytime soon.",
  "Nobody really cares about your logo when you're just starting out.",
  "I'm really proud of how far this little side project has come.",
  "I'm really nervous about giving my first conference talk next week.",
  'I actually shipped the whole feature in one weekend, which still surprises me.',
  'Turns out people actually read the terms of service when you make them short.',
  'Most startups usually fail because they run out of money, not ideas.',
  'I generally think hiring slow is overrated advice for early-stage teams.',
  'Sometimes the best feature is the one you decide not to build.',
  'Cold email is mostly dead, but warm intros still work really well.',
  'Use real copy in your wireframes, never lorem ipsum, because it changes every layout decision.',
  'lorem ipsum dolor sit amet consectetur adipiscing elit',
  'Is it just me or is the $ETH chart kind of boring this month?',
  'Does anyone else feel like Twitter is kinda dead on weekends now?',
  "I just think it's wild how fast the AI space is basically moving right now.",
  'Basically, the whole point of a hook is to make people stop scrolling.',
  'Just a quick reminder that your first draft is supposed to be bad.',
  'I really just want to say thank you to everyone who came to our launch party last night.',
  'In my honest opinion, $LINK is the most undervalued project in crypto right now.',
  'I just wanted to share that we finally hit profitability after three long years.',
  "Here's the thing about cold outreach: nobody actually reads past the first line.",
  "We're shutting down the beta next week and moving all users to the new dashboard.",
  "I've been thinking a lot about this lately, and I think we're all just overcomplicating onboarding.",
  'Quick question for founders: do you actually enjoy fundraising, or is it just me?',
  "Honestly I'm not even mad, I'm just really impressed by how they pulled it off.",
  "I'm not selling a single $ETH until we see at least $8k, and I'm honestly fine waiting.",
  "Real talk, if your landing page needs a video to explain itself, it's probably too complicated.",
  "So I finally tried the new Claude model and it's genuinely really good at refactoring.",
  "I have to be honest with myself here: I've been avoiding the hard conversations at work.",
  "After eight months of rejections, and I'm thrilled to say I finally got the offer!",
  'Excited to share that our pre-seed round is officially closed!',
  'Thrilled to announce that our $2M seed round led by Acme Ventures is now closed.',
  "Our Series A is done and we're hiring 10 engineers.",
  'Our seed round was oversubscribed in 48 hours.',
  'So proud to share that our team was able to ship v3 in just six weeks.',
  "Happy to share that I finally got around to trying Cursor and it's a game changer for my workflow.",
  "We're excited to be partnering with Stripe to bring instant payouts to every creator.",
  "I'd like to take a moment to thank all of our early customers who believed in us.",
  'The majority of founders make a decision on pricing way too late.',
  'Our new dashboard has the ability to show churn in real time.',
  'We are going to launch the mobile app next week and open the waitlist to everyone.',
  "I'm going to be hosting a live AMA on Friday and answering every question.",
  'Due to the fact that we raised prices, our churn actually went down.',
  'We use AI to supercharge our onboarding and unlock new revenue for clients.',
  'Leverage your network to land your first ten customers.',
  'Our team is able to close deals twice as fast since we switched CRMs.',
  "Grateful and excited to announce that I've joined Vercel as a staff engineer.",
  "Excited to finally share that the book I've been writing for two years is out today.",
  "Pumped to announce we just crossed $1M ARR and we're still a team of four.",
  'Honored to share that our paper was accepted at NeurIPS this year.'
];

test('v4.1, P0: no version the engine returns on 80 tempting lines trips a hard guard, in the app or in the server fallback', () => {
  assert.equal(TEMPT.length, 80);
  for (const t of TEMPT) for (const o of [{}, { strict: true }]) {
    const r = S(t, o);
    for (const l of versions(r)) assert.equal(hard(l, r.draft), '', `${t} → ${l}`);
  }
  /* the stance said as a process, and a negated opinion, are in every version */
  for (const t of TEMPT) { const r = S(t); for (const l of versions(r)) { if (/starting to (?:think|understand|feel)|come to realize|beginning to believe/i.test(t)) assert.match(l, /starting to|come to realize|beginning to believe/i, t); if (/\bI don['’]t (?:really )?think\b/i.test(t)) assert.match(l, /\bI don['’]t (?:really )?think\b/i, t); } }
});

test('v4.1, hook4-2: once Claude is rejected, the fallback ships only a plain cut, else the line as written with honest copy', () => {
  /* a reorder becomes its cut-only version */
  const P = 'I just wanted to share that our team shipped v2 and signups went up 31% this week\nHere is what changed.';
  assert.notEqual(L(P), 'Our team shipped v2 and signups went up 31% this week.');
  assert.equal(L(P, { strict: true }), 'Our team shipped v2 and signups went up 31% this week.');
  /* a tense swap with nothing else to cut stays as written, and says so */
  const D = "We've officially decided to rebuild the app from scratch and launch it in March.", s = S(D, { strict: true });
  assert.equal(s.state, 'clean'); assert.equal(s.line, D); assert.equal(s.why, 'Couldn’t sharpen this one safely, so it stays as you wrote it.'); assert.deepEqual(s.alts, []);
  /* a plain-word swap is not a cut either */
  assert.equal(S('Leverage your network to land your first ten customers.', { strict: true }).state, 'clean');
  /* every strict version is the draft's own words, in order */
  for (const t of TEMPT) { const r = S(t, { strict: true }); for (const l of versions(r)) { const w = z => String(z).toLowerCase().replace(/’/g, "'").replace(/\bwon't\b/g, 'will not').replace(/\bcan't\b/g, 'can not').replace(/n't\b/g, ' not').replace(/'(re|m|ve|ll|d|s)\b/g, ' $1').match(/[a-z0-9$%]+/g) || []; const dw = w(r.draft); let i = 0; for (const x of w(l)) { while (i < dw.length && dw[i] !== x) i++; assert.ok(i < dw.length, `${t} → ${l}: "${x}"`); i++; } } }
});

test('v4.1, hook4-4: placeholder text is thin only when it is half the line, and the result says which kind of thin', () => {
  const real = "Speaking as someone who's designed apps for a decade, it's super important to always design with real content, not lorem ipsum.";
  assert.notEqual(S(real).state, 'thin'); assert.equal(core.SHARPEN.tooThin(real), false);
  assert.notEqual(S('Use real copy in your wireframes, never lorem ipsum, because it changes every layout decision.').state, 'thin');
  for (const t of ['lorem ipsum dolor sit amet consectetur adipiscing elit', 'lorem ipsum', 'Lorem ipsum dolor sit amet.']) { const r = S(t); assert.equal(r.state, 'thin', t); assert.equal(r.thin, 'test', t); }
  /* the reason is the result's `thin` field, one of four, for the page to show */
  assert.equal(S('asdf test test').thin, 'test'); assert.equal(S('gm gm').state === 'thin' ? S('gm gm').thin : 'few', 'few');
  assert.equal(S('the the the the the').thin, 'sentence'); assert.equal(S('ok so').thin, 'filler');
  for (const t of ['lorem ipsum', 'asdf', 'the the the the the', 'ok so']) assert.ok(['test', 'few', 'sentence', 'filler'].includes(S(t).thin), t);
});

test('v4.1, hook4-7 and founder-2: the engine keeps what the Claude prompt keeps', () => {
  /* "really" under a negation, within its clause, is a degree on it */
  /* v5.3 (Fable g-16, step 5): "i feel like" on a plain view is a run-up, and a lowercase line gets no full stop it never had */
  assert.equal(L('tbh i feel like nobody really reads threads anymore and we\'re all just posting into the void'), 'nobody really reads threads anymore. we\'re all just posting into the void');
  assert.equal(L("Real talk: if you're not sleeping 7 hours a night, I don't think your workout split really matters."), "If you're not sleeping 7 hours a night, I don't think your workout split really matters.");
  assert.equal(L('Hiring is the hardest part of being a founder and nobody really prepares you for it'), 'Hiring is the hardest part of being a founder. Nobody really prepares you for it.');
  /* …but not across a new clause: "not using a stop loss you're really just gambling" */
  assert.equal(L("Basically if you're not using a stop loss you're really just gambling with extra steps, I'm sorry but it's true"), "If you're not using a stop loss you're just gambling with extra steps.");
  /* "really" on a feeling is its strength; on a frame it pads */
  assert.match(L("honestly just really grateful for everyone who's been reading my stuff lately 🙏"), /^really grateful/);
  assert.match(L('ngl i kind of hate how much i check my phone in the morning and i really want to stop'), /i really want to stop/);
  assert.equal(L('Before this year ends, I want to say a massive thank you to everyone who\'s supported me. It really means the world.'), 'Before this year ends, I want to say a massive thank you to everyone who\'s supported me. It really means the world.');
  assert.equal(L('I really want to emphasize how important it is to reply to every comment in the first hour'), 'Reply to every comment in the first hour.');
  assert.equal(core.softCut('Hey everyone! Quick reminder that my course launches tomorrow, really excited about this one').s, 'My course launches tomorrow, really excited about this one');
  /* "actually" inside the sentence carries the surprise or the contrast; an opening "Actually," and "I actually think" don't */
  assert.equal(L('Write the newsletter you\'d actually pay for.'), 'Write the newsletter you\'d actually pay for.');
  assert.match(L('Not gonna lie, I\'m still kind of processing the fact that I actually ran a full marathon yesterday 🏃‍♀️ #running'), /I actually ran a full marathon/);
  assert.match(L('ok real talk i think i\'m actually starting to kind of enjoy waking up early'), /i'm actually starting to kind of enjoy/);
  assert.equal(L('Actually, I was wrong about $ETH.'), 'I was wrong about $ETH.');
  /* scope words are never cut */
  for (const t of ["Hot take, but I really think 'thought leadership' is mostly just rebranded blogging.", 'Honestly, most UX problems are largely copywriting problems.', 'Cold email is mostly dead, but warm intros still work really well.', 'Most startups usually fail because they run out of money, not ideas.', 'Honestly, founders are often their own worst bottleneck.', 'I generally think hiring slow is overrated advice for early-stage teams.', 'Sometimes the best feature is the one you decide not to build.', 'The problem is partly the pricing page, honestly.']) {
    const r = S(t), w = t.match(/\b(?:mostly|largely|partly|often|usually|generally|sometimes)\b/i)[0];
    for (const l of [r.line, ...versions(r)]) assert.match(l, new RegExp(`\\b${w}\\b`, 'i'), `${t} → ${l}`);
  }
  /* founder-2: "In my opinion" and "IMO" are kept the way "I think" is, one hedge per clause; IMHO is the delaying frame */
  /* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */
  assert.equal(L('In my opinion, the best traders are the ones who sit on their hands most of the time.'), 'The best traders are the ones who sit on their hands most of the time.');
  assert.equal(L('honestly IMO most landing pages are bloated'), 'most landing pages are bloated');
  assert.equal(L('the best traders do nothing most days imo'), 'the best traders do nothing most days'); /* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */
  /* v4.2 (round-7 marketing-4): the opinion is the clause's one hedge, kept; the softener on top goes */
  assert.equal(L('In my opinion, most landing pages are kind of bloated.'), 'Most landing pages are bloated.'); /* v5.4 (step 3): on a plain view both go */
  assert.equal(L('Hot take: in my opinion most landing pages are bloated'), 'Hot take: most landing pages are bloated.');
  assert.equal(L('IMHO most landing pages are bloated.'), 'Most landing pages are bloated.');
});

test('v4.1, hook4-6 and marketing-2: the run-ups the engine missed', () => {
  /* the announcement variants */
  assert.equal(L("I'm humbled and honored to share that we've officially closed our $4M seed round led by Northwind Ventures!"), "We've officially closed our $4M seed round led by Northwind Ventures!");
  assert.equal(L("Honored and humbled to announce that we've been named one of Fast Company's most innovative startups."), "We've been named one of Fast Company's most innovative startups.");
  assert.equal(L("Grateful and excited to announce that I've joined Vercel as a staff engineer."), "I've joined Vercel as a staff engineer.");
  assert.equal(L('Happy to announce that my first book is now available for preorder.'), 'My first book is now available for preorder.');
  /* "it's (really, )*important to" → the order itself */
  assert.equal(L("It's really, really important to talk to your users every week."), 'Talk to your users every week.');
  assert.equal(L('Quick tip for junior designers: it\'s really, really important to always present your work with context.'), 'Junior designers: always present your work with context.');
  assert.equal(L("Being a founder has taught me that it's really, really important to hire people who are smarter than you."), 'Being a founder has taught me this: hire people smarter than you.');
  assert.equal(L("Ten years of trading taught me that it's important to cut losses early."), 'Ten years of trading taught me to cut losses early.');
  /* "decided to write a deep dive on why" → "wrote a deep dive on why", when the pointer says it exists */
  assert.equal(L('This week I decided to write a deep dive on why I think most creators are probably undercharging for sponsorships (link in replies).'), 'This week I wrote a deep dive on why I think most creators are probably undercharging for sponsorships (link in replies).');
  assert.equal(L('I decided to put together a guide on how I grew my newsletter to 20k subscribers (link below).'), 'I put together a guide on how I grew my newsletter to 20k subscribers (link below).');
  assert.doesNotMatch(L('I decided to write a guide on pricing for freelancers.'), /\bwrote\b/);
  /* fwiw goes the way ngl does; the stance after it stays */
  assert.equal(L('fwiw I think the $TIA unlock is probably already priced in at this point.'), 'I think the $TIA unlock is probably already priced in at this point.');
  assert.equal(L("fwiw I don't think $SOL is done pumping yet."), "I don't think $SOL is done pumping yet.");
  /* newsletter openers lead with the topic, and keep its hedge */
  assert.equal(L("In today's issue, I want to dive into why the Fed might cut rates in December"), "Today's issue: why the Fed might cut rates in December.");
  assert.equal(L("In this week's issue, we're going to look at three charts that explain the housing market."), "This week's issue: three charts that explain the housing market.");
  assert.equal(L("In today's newsletter we'll cover the three AI tools I actually use every day."), "Today's newsletter: the three AI tools I actually use every day.");
  assert.equal(L("This week I'm writing about why most creators quit too early."), 'This week: why most creators quit too early.');
  assert.equal(L("Can't believe it but my newsletter just crossed 5,000 readers"), 'My newsletter just crossed 5,000 readers.');
});

test('v4.1, hook4-5 and marketing-3: the notes say what is true, and a clean line is one human sentence', () => {
  /* a question is neither a call nor a plan; "this week" alone is a time, not a forecast */
  const q = S('Is it just me or has the funding on $DOGE perps been kinda insane this week?');
  assert.doesNotMatch(q.why + q.note, /plan or a forecast|on a call|on a prediction/); assert.match(`${q.why} ${q.note}`, /how strongly you mean it/);
  /* v4.3 (uiux-2): a kept word's reason is said once, in the why or the note, never in both */
  assert.equal((`${q.why} ${q.note}`.match(/how strongly you mean it/g) || []).length, 1);
  const r = S('Real talk: I feel like most of you are way too levered going into FOMC this week.');
  assert.doesNotMatch(r.note, /plan or a forecast/); assert.match(r.note, /how sure you are/);
  assert.match(S('I think $SOL could probably hit $300 by Q2.').note + S('I think $SOL could probably hit $300 by Q2.').why, /on a prediction/); /* v4.3 (marketing-9): "on a call" read as a phone call */
  assert.match(S("I think we'll probably ship the beta next week.").note + S("I think we'll probably ship the beta next week.").why, /plan or a forecast/);
  /* a closing #tag is not a beat */
  assert.match(S('I think I finally figured out why our builds were so slow, and honestly it was kind of embarrassing. #100DaysOfCode').say, /two beats/);
  /* one clean line, no "on-device", no "I"; the honest guard copy for a guard that held a version back */
  for (const t of ['Sometimes the best feature is the one you decide not to build.', 'I generally think hiring slow is overrated advice for early-stage teams.', 'Turns out people actually read the terms of service when you make them short.']) assert.equal(S(t).why, CLEAN, t);
  for (const t of TEMPT) { const x = S(t); assert.doesNotMatch(`${x.why} ${x.note}`, /on-device|no move I trust|Nothing I can cut/, t); }
  assert.doesNotMatch(S('If I\'m being completely honest with you all, I almost quit last month.').why, /\b1 bits\b/);
});
