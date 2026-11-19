/* r86 pass 6: what the fifth hook juror found on the on-device engine (hook-1, 6, 7, 8, 12), held as rules. Written apart from
   the engine's own picks, on the juror's lines and fresh probes:
   1. hook-1/6, P0: the hard guards. Each one rejects the broken or changed version it names and passes its clean twin, and no
      version the engine returns (the line and every alt) ever trips one
   2. hook-1: the juror's broken and changed lines now come back whole, or as the writer's line with honest copy
   3. hook-7: the engine keeps what the Claude prompt keeps: the frames, the tone, the disclaimer where the writer put it, one
      hedge per clause (the modal over "I think"), every hedge on a call or plan; an opinion label stands in for "I think"
   4. hook-8: the run-ups the engine missed are cut; "so tired" is not a warm-up; "clean" never claims "it reads clean"
   5. hook-12: the case after the writer's colon, their "!", a sarcastic echo and a test line */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const core = createRequire(import.meta.url)('../../core.js');
const S = (t, o) => core.sharpenLine(t, o), L = (t, o) => S(t, o).line;
const hard = core.SHARPEN._dbg.hard;
/* v5.4 (step 2): post 1 of a thread read with its post 2, joined the way the draft had them (the writer's full stop, or the clause break the cut took) */
const full = R => !R.post2 ? R.line : R.draft.includes(R.line.slice(-12)) ? `${R.line} ${R.post2}` : `${R.line.replace(/\.$/, '')}, ${R.post2}`;

test('juror 5, hook-1/6: every hard guard rejects what it names and passes its clean twin', () => {
  const cases = [
    /* [what it guards, broken version, clean version, draft] */
    ['a predicate cut off at the end', "I closed my $PEPE position today for a 4x and I'm very.", "I closed my $PEPE position today for a 4x and I'm very happy with it.", "I just wanted to quickly say that I closed my $PEPE position today for a 4x and honestly I'm very happy with it."],
    ['a noun phrase after ", and"', "I've been experimenting a lot with subject lines lately, and a formula that works.", "I've been experimenting a lot with subject lines lately, and I think I've found a formula that works.", "So I've been experimenting a lot with subject lines lately, and I think I've basically found a formula that really works."],
    ['an "and" clause with nothing in it', "I've been really struggling with burnout lately and it.", "I've been really struggling with burnout lately. I just wanted to talk about it.", "I don't usually share personal stuff on here but I've been really struggling with burnout lately and I just wanted to talk about it"],
    ['a sentence on "Or" after its clause went', 'Or anything, but I just hit a 405 lb deadlift for the first time today.', 'Not to brag or anything, but I just hit a 405 lb deadlift for the first time today!!', 'Not to brag or anything, but I just hit a 405 lb deadlift for the very first time today!!'],
    ['a line on "But" after its clause went', 'But I wanted to share that I was laid off today.', 'This is a little bit personal, but I was laid off today.', 'So this is a little bit personal, but I wanted to share that I was laid off today.'],
    ['a question turned into a statement', 'Their motivation to work out completely disappears in the winter, or is it just me. Anyone else?', 'Does anyone else feel like their motivation to work out disappears in the winter, or is it just me?', 'Does anyone else feel like their motivation to work out completely disappears in the winter, or is it just me?'],
    ['a question that lost its subject', 'Does feel like nobody reads replies?', 'Does anyone else feel like nobody reads replies?', 'Does anyone else feel like nobody reads replies?'],
    ['a fragment whose only verb is in a relative clause', 'A quick redesign I did of the @Spotify mobile app.', 'I did a quick redesign of the @Spotify mobile app!', 'Check out a quick redesign I did of the @Spotify mobile app!'],
    ['a frame split off as its own sentence', 'Not to brag or anything. But I mass-migrated 200 services without a single outage!', 'Not to brag or anything but I just mass-migrated 200 services without a single outage!', 'Not to brag or anything but I just mass-migrated 200 services without a single outage!'],
    ['a sentence the reshape invents', "I'm a founder. Basically always talk to your customers as much as you possibly can.", "As a founder, I've learned that it's important to basically always talk to your customers as much as you possibly can.", "As a founder, I've learned that it's really important to basically always talk to your customers as much as you possibly can."],
    ['an idiom split from its object', 'gm. $TIA: most of you are sleeping rn.', 'gm. i feel like most of you are sleeping on $TIA rn.', 'gm. i honestly feel like most of you are kinda sleeping on $TIA rn'],
    ['a progressive made simple', "I don't sell a single $SOL under $400. Not financial advice.", "This is not financial advice, but I'm not selling a single $SOL under $400.", "This is not financial advice, but I'm not selling a single $SOL under $400."],
    ['a disclaimer moved to the end', 'We could see a 20-30% pullback before any new ATH. I might be wrong.', 'I might be wrong but I think we could see a 20-30% pullback before any new ATH.', 'I might be wrong but I genuinely think we could see a 20-30% pullback before any new ATH.'],
    ['a frame moved off the start', "You don't have a clear goal? Then Unpopular opinion: most productivity advice is kind of useless.", "Unpopular opinion: most productivity advice is kind of useless if you don't have a clear goal.", "Unpopular opinion: I think most productivity advice is kind of useless if you don't actually have a clear goal"],
    ['a closing "lol" moved inside the line', 'Most embarrassing document I own lol? My trading journal from 2021.', 'Most embarrassing document I own? My trading journal from 2021 lol', 'My trading journal from 2021 is genuinely the most embarrassing document I own lol'],
    ['a hedge in front of an order', 'Probably talk to your users before you build.', 'You should probably talk to your users before you build.', 'This might sound obvious but you should probably talk to your users before you build'],
    ['an opinion verb left without its clause', 'Why I think @jessepollak. The Base team are building the next Coinbase inside of Coinbase:', 'Why I think @jessepollak and the Base team are building the next Coinbase inside of Coinbase:', 'Really quick thread on why I think @jessepollak and the Base team are basically building the next Coinbase inside of Coinbase'],
    ['a thread pointer lost', 'I think @jessepollak and the Base team are building the next Coinbase inside of Coinbase.', 'Why I think @jessepollak and the Base team are building the next Coinbase inside of Coinbase:', 'Really quick thread on why I think @jessepollak and the Base team are basically building the next Coinbase inside of Coinbase'],
    /* v5.4 (step 3): the kept hedge is the forecast's; on a plain view it is cut */
    ['a kept hedge dropped', 'Most people will overthink their first post.', 'I think most people will overthink their first post.', 'Honestly I think most people will overthink their first post'],
    ['a kept frame dropped', "Most apps don't need microservices.", "Hot take: most apps don't need microservices.", "Hot take: most apps don't need microservices."]
  ];
  for (const [what, bad, good, draft] of cases) {
    assert.ok(hard(bad, draft), `${what}: "${bad}" should be rejected`);
    assert.equal(hard(good, draft), '', `${what}: "${good}" should pass`);
  }
});

test('juror 5, hook-1: no version the engine returns trips a guard, on the juror lines, the held-out fixture and the put-backs', () => {
  const { rows } = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-heldout.json'), 'utf8'));
  const bad = [];
  rows.forEach((r, i) => {
    const R = S(r.t); if (R.state !== 'sharp') { assert.equal(R.line, R.draft, r.t); return; }
    /* v5.4 (step 2): post 1 of a thread is read with its post 2 */
    [full(R), ...R.alts.map(a => a.line)].forEach(l => { const why = hard(l, R.draft); if (why) bad.push(`${R.draft} → ${l}: ${why}`); });
    if (i % 7) return;
    R.cut.forEach(c => { const R2 = S(r.t, { keep: [c.text] }); if (R2.state === 'sharp') [full(R2), ...R2.alts.map(a => a.line)].forEach(l => { const why = hard(l, R2.draft); if (why) bad.push(`put back "${c.text}": ${R2.draft} → ${l}: ${why}`); }); });
  });
  assert.deepEqual(bad, []);
});

test('juror 5, hook-1: the broken and changed lines come back whole, or as written with honest copy', () => {
  assert.equal(L("I just wanted to quickly say that I closed my $PEPE position today for a 4x and honestly I'm very happy with it."), "I closed my $PEPE position today for a 4x. I'm very happy with it.");
  /* v4.5 (hook44-3): "really" before the clause's verb ("a formula that really works") is the writer's degree, and stays */
  assert.equal(L("So I've been experimenting a lot with subject lines lately, and I think I've basically found a formula that really works."), "I've been experimenting a lot with subject lines lately. I think I've found a formula that really works.");
  assert.equal(L('Not to brag or anything, but I just hit a 405 lb deadlift for the very first time today!!'), 'Not to brag or anything, but I just hit a 405 lb deadlift for the first time today!!');
  for (const t of ['Does anyone else feel like their motivation to work out completely disappears in the winter, or is it just me?', "This is not financial advice, but I'm not selling a single $SOL under $400."]) { const R = S(t); assert.equal(R.line, t); assert.notEqual(R.state, 'sharp'); }
  /* v5.3 (Fable g-16, step 5): "i feel like" on a plain view is a run-up; no end stop the lowercase draft never had */
  assert.equal(L('gm. i honestly feel like most of you are kinda sleeping on $TIA rn'), 'gm. most of you are sleeping on $TIA rn');
  assert.doesNotMatch(L("As a founder, I've learned that it's really important to basically always talk to your customers as much as you possibly can."), /^I['’]m a founder\./);
  /* v4.2 (hook41-5): hard news keeps its framing whole and is never split */
  assert.equal(L('So this is a little bit personal, but I wanted to share that I was laid off today after 6 years at the company.'), 'This is a little bit personal, but I was laid off today after 6 years at the company.');
  /* "just" before a hyphenated past verb is "recently": it stays */
  assert.match(L('Not to brag or anything but I just mass-migrated 200 services to the new cluster without a single outage!'), /\bjust mass-migrated\b/);
  /* a guard that drops every version says so; it never says the line "reads clean" */
  const v = S('As a former VC, I can tell you that most pitch decks are way too long');
  assert.equal(v.line, v.draft); assert.equal(v.state, 'clean'); assert.equal(v.why, 'Couldn’t sharpen this one safely, so it stays as you wrote it.');
  for (const t of ['Funding is negative and price is going up. Shorts are paying to be wrong.', 'Building a startup is hard. Like, really, really hard. Here are some lessons I\'ve learned along the way.']) assert.doesNotMatch(S(t).why, /reads clean/);
});

test('juror 5, hook-7: the engine keeps what the Claude prompt keeps', () => {
  /* the frames that say how to take the line */
  for (const t of ['hot take: most airdrops are a tax on your time', 'Honest question: does anyone actually read terms of service pages?', 'Unpopular opinion: your first hire should be a salesperson, not an engineer.', 'PSA: rotate your API keys. Yes, the ones in that old repo too.', 'Reminder: rest days are part of the program.']) assert.equal(L(t), t);
  /* v4.5 (hook44-3): "they really need" is not "they need": the degree on the verb is the writer's, so nothing is left to cut */
  /* v5.3 (Fable g-35): "seem to" inside a why-question about what others think is padding */
  assert.equal(L('Honest question: why do so many founders seem to think they really need to raise money?'), 'Honest question: why do so many founders think they really need to raise money?');
  /* an opinion label stands in for "I think" and a softener, on a take that isn't a forecast */
  assert.equal(L('Hot take: I genuinely think code reviews are kind of a waste of time for teams under 5 people.'), 'Hot take: code reviews are a waste of time for teams under 5 people.');
  /* the tone: a closing "lol", a feeling, "kind of" on a feeling, a softener */
  assert.match(L('I think $BTC could maybe hit $120k by end of year, but who knows, I could be totally wrong lol'), /\blol$/);
  assert.equal(L('so we kind of made sync 38% faster in this release, pretty happy with it'), 'we kind of made sync 38% faster in this release, pretty happy with it');
  assert.equal(L('kind of nervous for my first powerlifting meet this weekend'), 'kind of nervous for my first powerlifting meet this weekend');
  assert.equal(S('kind of nervous for my first powerlifting meet this weekend').why, 'Left “kind of” in: it’s how you feel, not filler.'); /* v5.1 */
  assert.match(L('ngl i think i might actually be getting pretty good at this whole writing thing'), /pretty good/);
  /* the disclaimer stays where the writer put it: never moved to the end */
  for (const t of ["Not financial advice obviously but I've been slowly accumulating $LINK under 15 for the past month", 'nfa but i genuinely believe $HYPE is the most undervalued L1 right now']) { const l = L(t); assert.match(l, /^(?:not financial advice|nfa)\b/i, t); assert.doesNotMatch(l, /(?:not financial advice|nfa)[.!]?$/i, t); }
  /* one hedge per clause: a lone "I think" stays (its padding goes), a stacked one gives way to the modal */
  assert.equal(L('I genuinely think AI agents are overhyped right now'), 'AI agents are overhyped right now.'); /* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */
  /* v4.2 (round-7 marketing-4): "I think" stays as the one hedge, the second hedge goes */
  /* v5.3 (Fable g-28/g-74): an "I think" on the writer's own past goes, and the claim's own "probably" stays */
  assert.equal(L('I think one of the biggest mistakes I made as a first-time founder was probably hiring way too fast.'), 'One of the biggest mistakes I made as a first-time founder was probably hiring way too fast.');
  assert.equal(L('Honestly, I feel like dark mode is kind of overrated and most apps would probably be better without it.'), 'Dark mode is overrated. Most apps would probably be better without it.' /* v5.3 (Fable g-16, step 5): "I feel like" on a plain view is a run-up */);
  /* v5.0 (round-13 uiux-2): the spare "that" after the kept stance goes */
  assert.equal(L("I've been coding for 10 years and I honestly think that most developers are kind of overcomplicating their side projects."), "I've been coding for 10 years. Most developers are overcomplicating their side projects."); /* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */
  /* on a call every hedge stays; a doubled hedge is one hedge; "What could possibly go wrong" is the joke, not a doubled hedge */
  assert.equal(L('Not gonna lie, I really think $SOL could potentially hit $300 by Q2 if the ETF gets approved.'), 'I think $SOL could hit $300 by Q2 if the ETF gets approved.');
  /* v5.0 (round-13 uiux-2): the spare "that" goes; the call keeps its stance */
  assert.match(L('Not financial advice but I genuinely believe that $HYPE could literally 10x from here.'), /\bI believe \$HYPE could 10x\b/);
  assert.equal(L('Sure, just buy the dip. What could possibly go wrong.'), 'Sure, just buy the dip. What could possibly go wrong.');
});

test('juror 5, hook-8: the missing run-ups go, "so tired" stays, and clean copy is honest', () => {
  assert.equal(L("I've put together a list of some of the best free resources for learning Solidity in 2026:"), 'Some of the best free resources for learning Solidity in 2026:');
  /* v4.2 (round-7 founder-1): "a lot of people have been asking me …, so" goes whole when the rest is the list */
  assert.equal(L("A lot of people have been asking me what I'm buying, so I figured I'd just share my top 5 picks for this month:"), 'My top 5 picks for this month:');
  assert.equal(L("As a ghostwriter, I've written over 2,000 posts for founders, and I can tell you that most of them make the exact same mistake."), "As a ghostwriter, I've written over 2,000 posts for founders. Most of them make the exact same mistake.");
  assert.equal(L("In this week's issue of my newsletter, I wanted to talk a little bit about why I think email is still the best channel out there."), "This week's issue of my newsletter: why I think email is still the best channel out there.");
  /* "so" before an adjective is an intensifier, never a warm-up */
  const t = S('honestly just so tired of people saying you need to post 5x a day to grow on here');
  assert.match(t.line, /^so tired of/); assert.ok(!t.cut.some(c => /^so$/i.test(c.text)));
  assert.equal(L('So excited to welcome 1,000 new subscribers this month 🙏'), 'So excited to welcome 1,000 new subscribers this month 🙏');
  /* nothing cut: the engine doesn't claim the line "reads clean" */
  assert.doesNotMatch(S("Your newsletter doesn't need more subscribers. It needs one reason to open the next issue.").why, /reads clean/);
});

test('juror 5, hook-12: the colon case, the "!", the sarcastic echo and a test line', () => {
  assert.match(L('🚨 BREAKING: The spot $ETH ETF just got approved. This is honestly huge for the whole market 🚀🚀🚀'), /BREAKING: The spot/);
  assert.match(L('Not to brag or anything, but I just hit a 405 lb deadlift for the very first time today!!'), /today!!$/);
  assert.match(L("I'm super excited to announce that after many months of hard work, we are finally launching our new product today!"), /today!$/);
  for (const t of ['Love waking up to -40% on my bags. Really love that for me.', 'Love when a client says "make it pop". Really love that.']) assert.equal(L(t), t);
  for (const t of ['asdf test test', 'qwerty', 'test test 123']) { const R = S(t); assert.equal(R.state, 'thin', t); assert.equal(R.thin, 'test', t); assert.equal(R.why, 'This reads like a test, not a post. Paste a first line you’d really post.', t); }
  /* placeholder text and a word said five times keep their own message */
  assert.equal(S('the the the the the').thin, 'sentence'); assert.equal(S('lorem ipsum dolor sit amet').thin, 'test'); /* v4.1 (hook4-4): placeholder text reads as a test */
});
