/* r86 pass 5: the fourth juror's findings on the on-device engine (concepts/r86/reviews/rerate4/review-hook.json), as
   tests. Safety first: Sharpen never changes what a line means, the facts in it, or the writer's stance. Every P0 line is
   also put back word by word (the put-back re-run), and the meaning still holds there too */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const core = createRequire(import.meta.url)('../../core.js');
const S = (t, o) => core.sharpenLine(t, o), L = (t, o) => S(t, o).line;
const lc = z => String(z).toLowerCase().replace(/’/g, "'");
/* every cut put back, one at a time: the line the writer sees after tapping a strike */
const putBacks = t => S(t).cut.map(c => ({ kept: c.text, R: S(t, { keep: [c.text] }) }));
const holds = (t, check) => { check(S(t), 'first tap'); putBacks(t).forEach(({ kept, R }) => check(R, `put back "${kept}"`)); };

test('juror 4, hook-1: a negated "just" (or "only", "really") is the meaning, never filler, and never split off', () => {
  const lines = ["We don't just write your posts, we learn your voice.", "I don't just want more followers, I want the right followers.",
    "Bitcoin isn't just digital gold, it's a hedge against bad policy.", "I don't just trade, I teach people to trade.",
    "So basically we don't just write your posts, we learn your voice.", "honestly it's not just about the money, it's about the time",
    "We never just ship features, we ship fixes for real problems.", "Our clients aren't just customers, they're partners."];
  for (const t of lines) holds(t, (R, at) => {
    const m = t.match(/\b(?:not|never|\w+n['’]t)\s+(?:[a-z]+\s+)?(?:just|only|simply|merely|really)\b/i)[0];
    assert.ok(lc(R.line).includes(lc(m)), `${t} (${at}) → ${R.line}: lost "${m}"`);
    assert.ok(!R.cut.some(c => /^(?:just|only|really)$/i.test(c.text.trim()) && c.kind !== 'reshape'), `${t} (${at}): struck the restrictor as fluff`);
  });
  /* the four lines the juror flagged come back unchanged, and say why */
  for (const t of lines.slice(0, 4)) { const R = S(t); assert.equal(R.state, 'clean', t); assert.match(R.why, /^Kept “\w+n't just/, t); }
  /* and "didn't really" is a fact about the effort */
  holds("I didn't really train for this marathon and I still finished in 3:41.", R => assert.match(R.line, /didn't really train/));
  holds("honestly I don't really care about followers anymore", R => assert.match(R.line, /don't really care/i));
});

test('juror 4, hook-2: an approximator in front of a value stays, with the why "it says nearly, not exactly"', () => {
  const lines = [["It's basically free if you use the student plan.", 'basically free'], ['She basically doubled our revenue in 6 months.', 'basically doubled'],
    ["it's basically the cheapest since 2016", 'basically the cheapest'], ["it's pretty much done, just need to ship the landing page", 'pretty much done'],
    ['honestly it is basically free for most people', 'basically free'], ['We basically doubled our revenue in 6 months by just raising prices.', 'basically doubled'],
    ['Just a heads up: $ETH gas is currently at 0.4 gwei, which is basically the cheapest it has been since 2016.', 'basically the cheapest'],
    ['As a ghostwriter for 12 SaaS founders, I can tell you that the hook is basically 80% of the work.', 'basically 80%'],
    ['so we have basically zero churn this quarter', 'basically zero'], ['Basically everyone I know is burned out', 'Basically everyone'],
    ['we have nearly zero churn this quarter, honestly', 'nearly zero'], ["We're almost at 10k subscribers and it's honestly wild", 'almost at 10k']];
  for (const [t, ph] of lines) holds(t, (R, at) => assert.ok(lc(R.line).includes(lc(ph)), `${t} (${at}) → ${R.line}: lost "${ph}"`));
  for (const t of ["It's basically free if you use the student plan.", 'She basically doubled our revenue in 6 months.']) {
    const R = S(t); assert.equal(R.state, 'clean', t); assert.match(R.why, /^Kept “basically \w+”: it says nearly, not exactly\.$/, t);
  }
  /* on a sharpened line it says so in the note */
  assert.match(S('honestly it is basically free for most people').note, /Kept “basically free”: it says nearly, not exactly\./);
  /* a "basically" that is only talk still goes */
  assert.equal(L('So basically we raised a $2.5M seed round led by @a16z'), 'We raised a $2.5M seed round led by @a16z.');
});

test('juror 4, hook-3: a hedged plan or forecast keeps its hedge; "going to" never becomes a promise', () => {
  const lines = [["I think I'm going to quit X for a month.", ['I think', 'going to']], ["We're probably going to shut down the free plan next month.", ['probably']],
    ["I think we're basically going to hit $50k MRR this month", ['I think', 'going to']], ["We're probably launching on Product Hunt next week", ['probably']],
    ['I think we will probably launch in March', ['probably']], ['I think I might start a newsletter this year.', ['might']],
    ['honestly i think we might raise prices next month', ['might']], ['I think that in 5 years nobody will remember this.', ['I think']],
    ["Maybe we'll open a waitlist next week, not sure yet", ['Maybe']]];
  for (const [t, ws] of lines) holds(t, (R, at) => { for (const w of ws) assert.ok(lc(R.line).includes(lc(w)), `${t} (${at}) → ${R.line}: lost "${w}"`); assert.ok(!/\bwill\b|['’]ll\b/i.test(R.line) || /\bwill\b|['’]ll\b/i.test(t), `${t} (${at}) → ${R.line}: made it a promise`); });
  assert.equal(L("I think we're basically going to hit $50k MRR this month\n\nHere's the boring stuff that got us there:"), "I think we're going to hit $50k MRR this month.");
  /* the note says why, on a plan as on a call */
  assert.match(S("I think I'm going to quit X for a month.").why, /Kept “I think”: on a plan or a forecast/);
  /* r86 pass 6 (juror 5, hook-7): a hedge on a claim about now is the one hedge its clause keeps, as the Claude prompt keeps it;
     only a second hedge on the same clause goes */
  assert.equal(L('I think most people overthink their first post'), 'I think most people overthink their first post');
  assert.equal(L('so $ARB unlock is next week and honestly i think everyone is way too relaxed about it'), '$ARB unlock is next week. i think everyone is way too relaxed about it.');
  /* v4.2 (round-7 marketing-4): "I think" is the one hedge kept; "probably" is the second one */
  assert.equal(L('I think most people probably overthink their first post'), 'I think most people overthink their first post.');
  /* r86 pass 6 (juror 5, hook-7): "probably" is the clause's one hedge, so it stays; never "Probably talk to your users" */
  assert.equal(L('This might sound obvious but you should probably talk to your users before you build'), 'You should probably talk to your users before you build.');
  /* "then this might be for you" keeps its "might" */
  assert.match(L('If you are a founder who is struggling to find the time to post consistently on social media, then this might be for you'), /this might be for you\.$/);
});

test('juror 4, hook-4/5: a cut between clauses keeps the comma; every emoji stays whole', () => {
  assert.equal(L('honestly i think $SOL is just getting started tbh, the chart looks really really bullish right now'), 'i think $SOL is just getting started, the chart looks really really bullish right now.');
  assert.equal(L('I quit my job, honestly the commute was killing me.'), 'I quit my job, the commute was killing me.');
  const seg = new Intl.Segmenter('en', { granularity: 'grapheme' }), emo = z => [...seg.segment(z)].map(x => x.segment).filter(g => /\p{Extended_Pictographic}|‍/u.test(g));
  const lines = ['Reminder that walking 10k steps a day is literally one of the most underrated things you can do for your health 🚶‍♂️',
    'Honestly the best thing for your health is sleep ❤️‍🔥', 'Just shipped my first open source library and honestly it feels amazing 👨‍💻',
    'Pride month reminder that you are honestly enough 🏳️‍🌈', 'Just finished my first marathon and honestly it was brutal 🏃‍♀️',
    'Walking is honestly the most underrated habit 🙌🏽', 'so basically we hit 1k users today 🎉🎉'];
  for (const t of lines) holds(t, (R, at) => {
    const d = emo(t), l = emo(R.line);
    assert.deepEqual(l, d, `${t} (${at}) → ${R.line}: emoji changed`);
    assert.doesNotMatch(R.line, /‍\s|\s‍/u, `${t} (${at}): a ZWJ next to a space`);
  });
  /* the ask move keeps a tail emoji at the very end (v4.8: as another take; the plain cut leads) */
  { const w = S('Walking is honestly the most underrated habit 🙌🏽'); assert.equal(w.line, 'Walking is the most underrated habit 🙌🏽'); assert.ok(w.alts.some(a => /\? Walking\.? ?🙌🏽$/u.test(a.line)), JSON.stringify(w.alts)); }
  /* r86 pass 6 (juror 5, hook-7): "Reminder" says how to take the line, so it stays (the prompt's rule 4); the emoji still stays whole */
  assert.equal(L('Reminder that walking 10k steps a day is literally one of the most underrated things you can do for your health 🚶‍♂️'), 'Reminder that walking 10k steps a day is one of the most underrated things you can do for your health 🚶‍♂️');
});

test('juror 4, hook-6/7: no repeated teaser, no fragment from a split, no broken put-back', () => {
  const t81 = "Just redesigned our onboarding and activation went from 31% to 58%. Here's what changed 👇";
  holds(t81, (R, at) => { assert.ok((lc(R.line).match(/what changed/g) || []).length <= 1, `${at}: ${R.line}`); assert.doesNotMatch(R.line, /What changed:/, at); });
  /* a result-first version that only reorders is fine when there's no teaser */
  assert.equal(L('We moved from Postgres to SQLite for our edge cache and reads got 9x faster'), 'Reads got 9x faster. What changed: we moved from Postgres to SQLite for our edge cache.');
  const t41 = "Two years ago we had 3 customers, $900 in the bank, and a co-founder who was about to leave. Today we're at $1.2M ARR with 11 people. I want to share the honest version of what happened in between, because the polished version you see on LinkedIn really isn't the whole story and I think it does a lot of founders a disservice.";
  holds(t41, (R, at) => assert.doesNotMatch(R.line, /(?:^|\. )The honest version of what happened in between, because/, at));
  const t49 = "This week in the newsletter I'm basically going deep on why so many creators burn out after their first year, what the data actually says about posting frequency, and the very simple weekly system I've personally been using for the last 18 months to write 3 issues a week without ever really feeling like I'm running on empty. Link below 👇";
  holds(t49, (R, at) => assert.match(R.line, /posting frequency, and the (?:very )?simple weekly system/, at));
  const bad = /^(?:Really|Honestly|Basically|Actually) why\b|^this:|^Why I think @\w+\.|^As a ghostwriter for 12 SaaS founders, the hook/i;
  for (const t of ['Really quick thread on why I think @jessepollak and the Base team are basically building the next Coinbase inside of Coinbase',
    "ok so i've been thinking about this a lot and i think most people genuinely don't understand how compounding works",
    'As a ghostwriter for 12 SaaS founders, I can tell you that the hook is basically 80% of the work.']) holds(t, (R, at) => assert.doesNotMatch(R.line, bad, `${t} (${at}) → ${R.line}`));
  /* a clause that leans on the one before it never moves ahead of it */
  assert.doesNotMatch(L("I didn't really train for this marathon and I still finished in 3:41."), /^I still finished/);
});

test('juror 4, hook-8: the run-ups people really write are cut, and banned words go to plain verbs', () => {
  assert.equal(L("Just a friendly reminder: if you don't hold your keys, you don't hold your coins.").startsWith('Just a friendly'), false);
  assert.equal(L("In today's fast-paced digital landscape, it's more important than ever to build thought leadership on social media."), "It's more important than ever to build thought leadership on social media.");
  assert.doesNotMatch(L('What if I told you that funding rates are actually the most underrated indicator in crypto?'), /what if i told you/i);
  assert.equal(L('TIL that you can use git bisect to find exactly which commit broke your build'), 'TIL you can use git bisect to find exactly which commit broke your build.');
  assert.equal(L("I'm currently in the process of migrating our entire backend from Express to Hono and so far it's been really smooth."), "I'm migrating our entire backend from Express to Hono and so far it's been smooth.");
  const ban = /\b(?:leverag\w*|supercharg\w*|unlock\w*|seamless\w*|elevat\w*|game[- ]?changer|delv\w*)\b/i;
  const b = S("Here's how we help B2B brands leverage LinkedIn to supercharge their pipeline and unlock seamless growth.");
  assert.equal(b.state, 'sharp'); assert.doesNotMatch(b.line, ban); assert.match(b.line, /\buse LinkedIn\b/); assert.match(b.line, /\bgrow\.$/);
  /* a trader's "elevated" and "token unlock" are words, not hype: never swapped for "improved" */
  assert.match(L('Funding is basically elevated on every major perp right now and honestly that usually ends badly.'), /^Funding is elevated on every major perp/);
  assert.match(L('Honestly the $ARB token unlock next week is going to be really brutal for holders.'), /\$ARB token unlock next week/);
});

test('juror 4, hook-9/12: receipts are true, thin lines say which kind of thin', () => {
  /* a decimal is not a beat */
  for (const t of ["I just wanted to share that I closed my $PEPE long for a 4.2x and I'm basically done trading memes for the year.", 'So basically BTC is at 24.1 dominance on alts and honestly that is wild', 'Honestly we just raised $2.5M and I am still in shock']) {
    const R = S(t), n = (R.line.match(/[.!?]+(?=\s|$)/g) || []).length || 1, m = R.say.match(/Split it into (\w+) beats/);
    if (m) assert.equal(m[1], ['', 'one', 'two', 'three'][n], `${t}: ${R.say} on ${R.line}`);
  }
  for (const [t, w, k] of [['ok so', 'That’s all filler. Add the point.', 'filler'], ['Really really really', 'That’s all filler. Add the point.', 'filler'],
    ['the the the the the', 'This doesn’t read as a sentence yet.', 'sentence'], ['lorem ipsum dolor sit amet', 'This reads like a test, not a post. Paste a first line you’d really post.', 'test']]) {
    const R = S(t); assert.equal(R.state, 'thin', t); assert.equal(R.why, w, t); assert.equal(R.thin, k, t);
  }
  /* a short real post is still complete */
  for (const t of ['gm', 'lol', 'just shipped', 'honestly same']) assert.equal(S(t).state, 'clean', t);
  /* a strike reason that fits: a vulnerable opener is a run-up to the story */
  /* v4.2 (hook41-5): on hard news ("struggling with burnout") the framing stays, so the run-up reason is read on a line that isn't */
  const v = S("I almost didn't post this, but I finally finished my first marathon and I think it's important to talk about.");
  assert.equal(v.cut.find(c => /almost didn't post/.test(c.text)).why, 'A run-up to the story. Start on the story itself.');
  /* "opens on it" only when the kept word is in the first two words */
  for (const t of ['Honestly the best trade this year was doing nothing at all.', 'I think the market is probably going to chop for a while']) {
    for (const c of S(t).cut) { const R = S(t, { keep: [c.text] }); if (/opens on it/.test(R.why)) { const p = lc(R.line).indexOf(lc(c.text)); assert.ok(p >= 0 && p < (R.line.match(/^\s*\S+(?:\s+\S+)?/) || [''])[0].length, `${t} +${c.text}: ${R.why} on ${R.line}`); } }
  }
  /* nothing marked, but a frame no rule can cut: it says so, not "nothing soft" */
  const fr = S("This week's issue is about the 3 habits that helped me write faster, link in bio");
  assert.equal(fr.state, 'clean'); assert.equal(fr.why, 'This quick check found nothing it could cut safely, so it stays as you wrote it.'); /* v4.1 (round-6 marketing-3): one human clean line; v4.3: softer; v4.7: never absolute, it says it is a quick check */
});

test('juror 4, hook-10/11: the joke and the feeling stay; a contraction alone is no sharpen; facts keep their suffix and unit', () => {
  for (const t of ['Oh great, another AI wrapper that\'s going to really change everything.', 'Wow, what a totally shocking surprise, the influencer\'s coin rugged.',
    'Love how my portfolio is down 40% but at least I have really great conviction.', 'Day 47 of building my SaaS in public: $312 MRR, 9 paying users, 1 very tired founder.']) {
    const R = S(t); assert.equal(R.state, 'clean', t); assert.equal(R.line, t);
  }
  assert.match(L("So I basically got laid off this morning along with 200 other people, and honestly I'm kind of okay with it."), /I'm kind of okay with it\.$/);
  assert.match(L('I ran my first marathon yesterday in 4:12 and I\'m still kind of emotional about it'), /kind of emotional/);
  /* "is going to" → "'ll" and nothing else is not a sharpen */
  /* r86 pass 6 (juror 5, hook-7): the padding in "I really think" is a real cut now ("I think" stays), so the padded line is a sharpen;
     the same line without it is still no sharpen */
  assert.equal(S('I think that the next big wave in crypto is going to be stablecoin payments').state, 'clean');
  assert.equal(L('I really think that the next big wave in crypto is going to be stablecoin payments'), 'I think that the next big wave in crypto will be stablecoin payments.');
  const f = S('Most people miss the 83(b) election deadline and honestly it costs them');
  assert.ok(f.kept.includes('83(b)'), f.kept.join(', ')); assert.match(f.line, /83\(b\)/);
  assert.ok(S('Just a heads up: $ETH gas is currently at 0.4 gwei, which is basically the cheapest it has been since 2016.').kept.includes('0.4 gwei'));
  assert.ok(S('Maxing my 401(k) this year was honestly the best decision').kept.includes('401(k)'));
});
