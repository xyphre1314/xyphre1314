/* v5.7 (page pass 22, founder-5): the engine adds no end stop and no contraction the writer didn't type, so expected lines here end as the draft ends and keep the draft's own "we are"/"I have". */
/* round 74: one-tap Sharpen. The soft-word table, the moves top first lines make, the reasons it gives, the prompts,
   and the eval in sharpen-eval.mjs (48 real drafts across six niches) held to a floor so the engine can't quietly slip. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { E, EVAL, check } from './sharpen-eval.mjs';
const core = createRequire(import.meta.url)('../../core.js');

test('soft words: a whole warm-up is one mark and one cut; idioms and real words stay', () => {
  const t = 'just wanted to share that i finally hit my first $10k month trading lol';
  const m = core.softMarks(t); assert.equal(t.slice(m[0][0], m[0][1]), 'just wanted to share that'); assert.equal(m[0][3], 'announce');
  /* r86 pass 6 (juror 5, hook-7): the closing "lol" is tone, and the Claude prompt keeps it */
  assert.equal(core.softCut(t).s, 'i finally hit my first $10k month trading lol');
  for (const keep of ['look at this chart: funding flipped', 'so what? nobody reads threads', 'well done beats well said', 'what kind of trader are you?', 'just 3 people came', 'so far so good'])
    assert.equal(core.softMarks(keep).length, 0, keep);
  /* r86: "honestly?" on its own is a beat, not filler (the held-out jury graded cutting it a miss); "honestly," is still cut */
  assert.equal(core.softCut('honestly? most threads are too long').s, 'honestly? most threads are too long');
  assert.equal(core.softCut('honestly, most threads are too long').s, 'most threads are too long');
  /* r86 pass 6 (juror 5, hook-7): how they feel about it is the tone the Claude prompt keeps */
  assert.equal(core.softCut('Hey everyone! Quick reminder that my course launches tomorrow, really excited about this one').s, 'My course launches tomorrow, really excited about this one');
  /* words this voice put back stay (r86 pass 6: a stacked "i think", since a lone one is the clause's hedge and stays anyway) */
  assert.equal(core.softMarks('honestly i think pricing is probably wrong', ['honestly']).length, 1); /* v5.6 (Fable round 5, f5-2): one rule for the hedge words: "probably" is the clause's one hedge, kept as the writer's call; the "i think" on top of it is the mark */
  /* every soft word says why, in a sentence, with no invented number */
  core.SOFT.forEach(s => { assert.ok(s.why.length > 30 && /\.$/.test(s.why), s.k); assert.doesNotMatch(s.why, /\b\d+(?:%|x)\b|\bstud(?:y|ies)\b|\bresearch\b/i, s.k); });
});

test('one tap: the moves top first lines make, with the facts kept', () => {
  const S = t => E.hgSharpen(t).first;
  /* r86 pass 6 (juror 5, hook-7): the lone "i think" stays and "not financial advice" stays where the writer put it, as the
     Claude prompt keeps them; lowercase kept, "not" never contracted into "wasn’t" */
  /* v5.3 (Fable g-14/g-28): an "i think" on the writer's own past is a softener and goes; no end stop the lowercase draft never had */
  assert.equal(S('so i think the biggest mistake i made this cycle was honestly not taking profits on the way up'), 'the biggest mistake i made this cycle was not taking profits on the way up', 'lowercase kept, "not" never contracted into "wasn’t"');
  assert.equal(S('not financial advice but i basically stopped trading the first hour after the open and my win rate went from 38% to 61%'), 'not financial advice but i stopped trading the first hour after the open. my win rate went from 38% to 61%', 'the disclaimer stays up front, never moved to the end');
  /* v4.2 (round-7 marketing-4): "i think" stays as the clause's hedge, and "probably not" is never cut */
  assert.equal(S('so i think the biggest mistake i made this cycle was probably not taking profits on the way up'), 'the biggest mistake i made this cycle was probably not taking profits on the way up', 'a stacked hedge keeps the modal, and the move still lands');
  assert.equal(S('Customer churn was reduced by 34% after the onboarding flow was redesigned by our team.'), 'Customer churn: down 34%. What changed: our team redesigned the onboarding flow.', 'passive made active');
  /* r86 pass 6 (juror 5, hook-7): the claim's one hedge ("I think", "kind of") stays through the move */
  assert.equal(S('After hiring over 300 people, I think the best interview question is really just four words\n“What did you fix?”'), 'I’ve hired over 300 people. I think the best interview question is just four words:', 'a colon only because the post answers it'); /* v4.8 (brand-4): a draft with no apostrophe gets the page's ’ */ /* v4.1: "just four words" is "only four words" */
  assert.equal(S('After hiring over 300 people, I think the best interview question is really just four words'), 'I’ve hired over 300 people. I think the best interview question is just four words', 'no colon with nothing after it');
  /* v4.8 (round-11 founder-1): the plain cut is version 1; "Asked, then answered" is another take */
  assert.equal(S('you should really be tracking your protein if you want to build muscle'), 'you should be tracking your protein if you want to build muscle');
  /* v5.4 (step 1): never a "?" the writer didn't type, so no "Asked, then answered" take here */
  assert.ok(!E.hgSharpen('you should really be tracking your protein if you want to build muscle').alts.some(a => /\?/.test(a)));
  assert.equal(S('honestly lifting 3 days a week has been kind of a game changer for my energy'), 'lifting 3 days a week changed my energy', 'a never-say word said plainly'); /* v5.4 (Fable round 3, step 3): one rule: on a plain view a stance or a hedge is cut; on a forecast or a call it is the writer's call */
  assert.equal(S('honestly lifting 3 days a week has been a game changer for my energy'), 'lifting 3 days a week changed my energy', 'a never-say word said plainly');
  assert.equal(S('I wanted to talk about why our sales team stopped doing cold calls this quarter\nShort version: warm intros closed 4x more.'), 'Our sales team stopped doing cold calls this quarter. Here’s why:');
  /* v4.8 (round-11 marketing-1): with nothing under it, the topic keeps its "why": the pointer the draft made, not a claim */
  assert.equal(S('I wanted to talk about why our sales team stopped doing cold calls this quarter'), 'Why our sales team stopped doing cold calls this quarter:', 'the topic stays a pointer');
  /* strong lines are left alone */
  for (const t of ['Most people quit right before it starts working.', 'My best trade this year? The one I didn’t take.', 'Stop chasing green candles.']) assert.ok(E.hgSharpen(t).same, t);
});

test('the receipt: every sharpen says which move it made and why that move works', () => {
  const r = E.hgSharpen('honestly most design systems fail because nobody really owns them');
  /* v4.8 (round-11 founder-1): the plain cut leads; the "Asked, then answered" flip is the other take, and says why it works */
  assert.equal(r.first, 'most design systems fail because nobody really owns them'); assert.deepEqual(r.cuts, ['honestly']); /* v4.1 (hook4-7): "nobody really owns them" keeps its degree */
  /* v5.4 (step 1): never a "?" the writer didn't type, so no "Asked, then answered" flip on a draft without one */
  assert.ok(!r.altP.some(a => a.main === 'ask'), JSON.stringify(r.altP));
  const n = E.hgSharpen('I’ve been thinking a lot about pricing lately and I think we were really undercharging');
  assert.equal(n.first, 'Pricing: I think we were really undercharging'); /* v4.5 (hook44-3): "really" before the verb is the writer's degree */ assert.ok(n.why.length > 20); /* r86 pass 6 (hook-7): the lone "I think" stays */
  Object.values(core.SHARPEN.MOVE_WHY).forEach(w => { assert.match(w, /\.$/); assert.doesNotMatch(w, /\b\d+(?:%|x)\b|algorithm|reach|viral|engag/i); });
});

test('score reasons name the exact words and teach the move', () => {
  assert.match(core.hookScore('Excited to announce that we just launched v2 of our onboarding').reason, /“Excited to announce that”/);
  assert.match(core.hookScore('the team spent most of the year rebuilding the old checkout page and conversion went up 9%').reason, /“9%”.*words in/);
  assert.match(core.hookScore('the onboarding flow was redesigned by our team and people liked it more').reason, /was redesigned by.*“we redesigned/);
  assert.match(core.hookScore('there are a lot of people who quit right before it works').reason, /“a lot of” is a number/);
  assert.match(core.hookScore('pricing is the whole game tbh').reason, /tbh/);
});

test('prompts: one playbook for first lines, the same JSON shapes', () => {
  const h = core.prompts.rewrite({ text: 'so i think pricing matters', kind: 'hook' });
  assert.equal(h.schema, core.prompts.rewrite({ text: 'x', kind: 'punchier' }).schema);
  for (const re of [/Lead with the number or the result/, /Ask, then answer/, /Active voice/, /only when the post goes on to pay it off/, /add none/, /lowercase stays lowercase/]) assert.match(h.prompt, re);
  const c = core.prompts.critique({ text: 'so i think pricing matters' }); assert.match(c.prompt, /different move/); assert.match(c.prompt, /"better"/);
  assert.match(core.prompts.sharpen({ post: 'so i think x is y\nmore', s: 0, e: 17 }).prompt, /first line, its hook/);
  assert.doesNotMatch(core.prompts.sharpen({ post: 'one line\nso i think x is y', s: 9, e: 26 }).prompt, /first line, its hook/);
  for (const k of ['rewrite', 'critique', 'sharpen']) assert.doesNotMatch(JSON.stringify(core.prompts[k]({ text: 'x', post: 'x', s: 0, e: 1, kind: 'hook' }).prompt).replace(/leave them out: [^.]*\.|leave them out[^"]*/g, ''), /\b(?:unlock|supercharge|elevate|seamless|game-changer)\b(?![^"]*(?:leave them out|never))/);
});

test('the eval: one tap gets most real drafts to Ready, with no fact lost or invented', () => {
  let ready = 0; const hard = [];
  for (const e of EVAL) { const r = E.hgSharpen(e.t + (e.body ? '\n' + e.body : '')), c = check(e, r); if (c.to >= 70) ready++; if (c.issues.length) hard.push(`${e.t} → ${r.first}: ${c.issues.join(', ')}`); }
  assert.deepEqual(hard, [], 'no number lost or added, no banned word, no hedge left, no loop with nothing after it');
  /* r86 pass 6 (juror 5, hook-7): 34/48 (was ≥ 40). The engine now keeps what the Claude prompt keeps (one hedge per clause, the
     frames, "lol", the writer's "!"), and hookScore still docks a kept "I think", so fewer lines clear 70 after one tap */
  /* v4.1 (hook4-7): 32/48. An "actually" that carries the contrast, "really" under a negation and "just" before a number now stay,
     and hookScore still docks them, so two more lines land just under 70 */
  /* v4.2 (round-7 marketing-4): 31/48. "I think" heading a claim is now the clause's one kept hedge (the second hedge goes instead),
     and hookScore still docks a kept "I think", so one more line lands just under 70. Safety over the score */
  /* v4.5 (hook44-3): 30/48. "really" right before the verb ("we were really undercharging") is the writer's degree and stays,
     and hookScore still docks it, so that line lands under 70. Meaning over the score */
  /* v4.8 (round-11 founder-1): 28/48. The plain cut is version 1 and the "Asked, then answered" flip is the other take, and two
     flips scored over 70 where their plain cuts don't (the protein and design-systems lines). The writer's own shape over the score */
  /* v5.7 (page pass 22, founder-5): 26/48. The engine no longer adds a full stop the writer didn't type, and hookScore still credits
     one (clarity and curiosity), so two lines land just under 70. The writer's own end over the score */
  assert.ok(ready >= 26, `Ready after one tap: ${ready}/${EVAL.length}`);
});
