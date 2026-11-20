/* v5.7 (page pass 22, founder-5): the engine adds no end stop and no contraction the writer didn't type, so expected lines here end as the draft ends and keep the draft's own "we are"/"I have". */
/* r86 v5.2: the on-device Sharpen after the Fable 5.2 juror (engine items only).
   1. nothing broken: "There are a lot of people who think X" never leaves "Lots of people who think X." (the "who" goes with it),
      and "we should all probably stop" never becomes the order "All probably stop."
   2. no stance moved: a degree word on a likelihood word stays ("very likely", "really not sure", "pretty much convinced")
   3. a personal reflection ("i've been thinking a lot lately about why i can't…") keeps its clause, never a "Why …:" header; a
      topic the writer announced for a post or thread still may be one ("In today's post I want to talk about why…" → "Why…:")
   4. a sharp draft that already says its action and its result ("We changed one button… and conversions went up 34%.") stays
   5. families are consistent: "Just a little reminder for all the designers out there that" goes as "Friendly reminder that" does
   6. the run-up goes whole or the why says it stays: "In today's thread I'm going to be talking about", "It's actually pretty
      crazy to think that", "…, and in this thread I'm going to break down", "…asking me how X, so I figured I'd explain"
   7. no stray colon: "Excited to announce that our Series A closed at $8M led by a16z!!" → "Our Series A closed at $8M led by
      a16z!!", and no colon right before a closing emoji
   8. whys that are true: no truncated quote, no "basically = nearly" over filler, no "Add the detail" on a whole-line frame,
      and a long one-breath line says where it could break */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const core = createRequire(import.meta.url)('../../core.js');
const S = (t, o) => core.sharpenLine(t, o), L = (t, o) => S(t, o).line;
const MODES = [['default', {}], ['v4.1', { hybrid: false }], ['strict', { strict: true }]];
const versions = r => r.state === 'sharp' ? [r, ...(r.alts || [])] : [r];
/* this file's own reads, written apart from the engine */
const relFrag = l => /^\P{L}*(?:lots of|a lot of|many|so many|too many)\s+\S+\s+(?:who|that)\s/iu.test(String(l));
const bareOrder = l => /(?:^|[.!?]\s+)\P{L}*(?:all|both|probably|maybe)\s+(?:probably\s+)?[a-z]+\s+(?:using|doing|it|them)\b/iu.test(String(l));
const lastColon = l => /:\s*$/.test(String(l).replace(/(?:\s*\p{Extended_Pictographic}️?)+\s*$/u, ''));

test('v5.2 (1): no fragment from "There are … who", no order from "we should all probably"', () => {
  const t11 = "There are a lot of people who think that staking yields of 4% are safe. They're not really safe at all.";
  const t85 = "I'm just going to say it: I really think that TypeScript enums were a mistake and we should all probably stop using them";
  for (const [m, o] of MODES) {
    for (const r of versions(S(t11, o))) assert.ok(!relFrag(r.line), `${m}: ${r.line}`);
    for (const r of versions(S(t85, o))) { assert.ok(!bareOrder(r.line), `${m}: ${r.line}`); assert.match(r.line, /\bwe should all (?:probably )?stop using them\b/i, m); } /* v5.4 (step 3): on advice, a plain view, the "probably" may go; never the "we should all" */
  }
  assert.equal(L(t11), "A lot of people think that staking yields of 4% are safe. They're not really safe at all.");
});

test('v5.2 (2): a degree word on a likelihood word stays', () => {
  for (const [t, w] of [["It's very likely that we see a 30% correction before the halving, in my view", 'very likely'], ['This is highly unlikely to work at our size', 'highly unlikely'], ["I'm really not sure AI coding tools are making junior devs better", 'really not sure'], ['Two years ago today I was sitting in a hospital parking lot, and I was pretty much convinced that my career was over', 'pretty much convinced']])
    for (const [m, o] of MODES) for (const r of versions(S(t, o))) assert.match(r.line, new RegExp(w, 'i'), `${m}: ${r.line}`);
});

test('v5.2 (3): a reflection keeps its clause; an announced topic may still be a header', () => {
  const t18 = "so basically i've been thinking a lot lately about why i can't seem to finish anything i start";
  for (const [m, o] of MODES) for (const r of versions(S(t18, o))) { assert.ok(!lastColon(r.line), `${m}: ${r.line}`); assert.match(r.line, /been thinking a lot lately about why i can't/i, m); }
  assert.equal(L(t18), "i've been thinking a lot lately about why i can't seem to finish anything i start"); /* v5.3 (Fable H9): no end stop the draft never had */
  assert.equal(L("In today's post I want to talk a little bit about why I think that most LinkedIn content from executives sounds like it was written by a committee"), 'Most LinkedIn content from executives sounds like it was written by a committee'); /* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */
  /* a topic the line goes on to answer heads its own answer */
  assert.equal(L("So I've been thinking a lot about why most side projects die and I think it's because people build in private for way too long"), "Why most side projects die: I think it's because people build in private for way too long");
});

test('v5.2 (4): a sharp action-and-result line is not reshaped; with a run-up it may lead with the result', () => {
  const t97 = "We changed one button from 'Submit' to 'Get my quote' and conversions went up 34%.";
  for (const [m, o] of MODES) { const r = S(t97, o); assert.notEqual(r.state, 'sharp', m); assert.equal(r.line, t97, m); }
  for (const [m, o] of MODES) for (const r of versions(S("So basically we changed one button from 'Submit' to 'Get my quote' and conversions went up 34%", o))) assert.doesNotMatch(r.line, /What changed: we changed/i, `${m}: ${r.line}`);
});

test('v5.2 (5): the reminder frame goes with its audience, as "Friendly reminder that" does', () => {
  assert.equal(L('Just a little reminder for all the designers out there that your portfolio really does not need a case study for every single project'), 'Your portfolio really does not need a case study for every single project');
  assert.equal(L("Friendly reminder that you really don't need to be sore after every workout in order for it to have been a good workout"), "You don't need to be sore after every workout for it to have been a good workout");
});

test('v5.2 (6): run-ups go whole', () => {
  assert.equal(L("gm. In today's thread I'm going to be talking about the 5 on-chain metrics that I personally use to time market tops"), 'gm. The 5 on-chain metrics I use to time market tops:'); /* v5.3: the spare "that" of an object relative goes */
  assert.equal(L("It's actually pretty crazy to think that I started this newsletter with literally 12 subscribers and now there are 40,000 of you"), 'I started this newsletter with 12 subscribers. Now there are 40,000 of you');
  assert.equal(L("My deadlift went from 315 to 495 in 14 months, and in this thread I'm going to break down exactly what I changed"), "My deadlift went from 315 to 495 in 14 months. Here's exactly what I changed:");
  assert.equal(L("A lot of people have been asking me how I manage to write 3 issues a week while also working a full-time job, so I figured I'd explain"), "Here's how I manage to write 3 issues a week while also working a full-time job");
  assert.equal(L('So, a funny thing happened to me at the airport yesterday and I feel like I just have to tell you guys about it'), 'A funny thing happened to me at the airport yesterday');
  assert.equal(L("I've been using Cursor for about 3 months now and I have to say that I'm really not sure it has actually made me any faster"), "I've been using Cursor for about 3 months now. I'm really not sure it has actually made me any faster");
  assert.equal(L('I think one of the biggest mistakes that I see first-time founders make is that they tend to hire way too quickly'), 'One of the biggest mistakes that I see first-time founders make: they tend to hire way too quickly');
  /* the issue a run-up named stays as the label after "I'm going to be talking about" too */
  assert.equal(L("In today's issue, I'm going to be talking about why I think most people are really doing email marketing wrong."), "Today's issue: why I think most people are doing email marketing wrong.");
});

test('v5.2 (7): no stray colon at the end, none right before a closing emoji', () => {
  const t = 'Excited to announce that our Series A closed at $8M led by a16z!!';
  assert.equal(L(t), 'Our Series A closed at $8M led by a16z!!');
  assert.equal(S(t).state, 'sharp');
  for (const [m, o] of MODES) for (const r of versions(S('Excited to announce that our Series A closed at $8M', o))) assert.ok(!lastColon(r.line), `${m}: ${r.line}`);
  const t70 = "So I've been lifting for about 12 years now and I just wanted to share some of the biggest lessons that I've learned along the way 💪";
  for (const [m, o] of MODES) for (const r of versions(S(t70, o))) assert.doesNotMatch(r.line, /:\s*💪/u, `${m}: ${r.line}`);
  assert.equal(L(t70), "I've been lifting for about 12 years now. Here are some of the biggest lessons that I've learned along the way 💪");
});

test('v5.2 (8): whys that are true', () => {
  const q = S("Why does every 'simple' auth tutorial end with 'now just add a database, sessions, and email verification'?");
  assert.doesNotMatch(q.why, /“'now just add a database, sessions, and email ve”/);
  const b = S('I basically just spent 6 hours debugging something that turned out to be a missing await. I love this job.');
  assert.equal(b.line, 'I just spent 6 hours debugging something that turned out to be a missing await. I love this job.');
  assert.doesNotMatch(`${b.why} ${b.note}`, /nearly, not exactly/);
  const a = S("I almost didn't post this.");
  assert.notEqual(a.state, 'unsure'); assert.doesNotMatch(a.why, /Add the detail/); assert.equal((a.marks || []).length, 0);
  /* a run-up the version still carries is named as staying, never "Cut 1 bit of fluff" over it alone */
  const s = S("I want to tell you a story about my dad, and why he's honestly the reason I started this business");
  if (s.state === 'sharp' && /^I want to tell you/i.test(s.line)) assert.match(s.why, /stays/);
  /* a long one-breath line says where it could break */
  const l = S("So I've been thinking a lot lately about why most newsletters fail in the first 90 days and I really believe it basically comes down to one simple thing that nobody talks about which is consistency over a long period of time and not growth hacks or viral threads or any of that stuff people sell");
  assert.ok(!lastColon(l.line), l.line);
  assert.match(l.note, /Still long for a first line\. Split it after “first 90 days”\./);
  /* and a long line gets the same cuts a short one does: the guarded "really" of "to really see" keeps only its own place */
  const f = S('honestly i think most people are really just overtrading and it is literally killing their accounts and they should probably stop and take a break and maybe journal every single trade they take because that is basically the only way to really see what is going on with your process over time and get better at it in the long run to be honest');
  /* v5.6 (Fable round 5, f5-6): over 280 it opens a thread, so the whole line is read across the posts */
  const fl = (f.thread || [f.line]).join(' ');
  assert.doesNotMatch(fl, /really just overtrading/);
  assert.match(fl, /to really see/);
});
