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
  assert.equal(core.softCut(t).s, 'i finally hit my first $10k month trading');
  for (const keep of ['look at this chart: funding flipped', 'so what? nobody reads threads', 'well done beats well said', 'what kind of trader are you?', 'just 3 people came', 'so far so good'])
    assert.equal(core.softMarks(keep).length, 0, keep);
  /* r86: "honestly?" on its own is a beat, not filler (the held-out jury graded cutting it a miss); "honestly," is still cut */
  assert.equal(core.softCut('honestly? most threads are too long').s, 'honestly? most threads are too long');
  assert.equal(core.softCut('honestly, most threads are too long').s, 'most threads are too long');
  assert.equal(core.softCut('Hey everyone! Quick reminder that my course launches tomorrow, really excited about this one').s, 'My course launches tomorrow');
  /* words this voice put back stay */
  assert.equal(core.softMarks('honestly i think pricing is wrong', ['honestly']).length, 1);
  /* every soft word says why, in a sentence, with no invented number */
  core.SOFT.forEach(s => { assert.ok(s.why.length > 30 && /\.$/.test(s.why), s.k); assert.doesNotMatch(s.why, /\b\d+(?:%|x)\b|\bstud(?:y|ies)\b|\bresearch\b/i, s.k); });
});

test('one tap: the moves top first lines make, with the facts kept', () => {
  const S = t => E.hgSharpen(t).first;
  assert.equal(S('so i think the biggest mistake i made this cycle was honestly not taking profits on the way up'), 'biggest mistake i made this cycle? not taking profits on the way up.', 'ask then answer, lowercase kept, "not" never contracted into "wasn’t"');
  assert.equal(S('not financial advice but i basically stopped trading the first hour after the open and my win rate went from 38% to 61%'), 'my win rate went from 38% to 61%. what changed: i stopped trading the first hour after the open.', 'the buried result leads');
  assert.equal(S('Customer churn was reduced by 34% after the onboarding flow was redesigned by our team.'), 'Customer churn: down 34%. What changed: our team redesigned the onboarding flow.', 'passive made active');
  assert.equal(S('After hiring over 300 people, I think the best interview question is really just four words\n“What did you fix?”'), 'I’ve hired over 300 people. The best interview question is four words:', 'a colon only because the post answers it');
  assert.equal(S('After hiring over 300 people, I think the best interview question is really just four words'), 'I’ve hired over 300 people. The best interview question is four words.', 'no colon with nothing after it');
  assert.equal(S('you should really be tracking your protein if you want to build muscle'), 'want to build muscle? track your protein.');
  assert.equal(S('honestly lifting 3 days a week has been kind of a game changer for my energy'), 'lifting 3 days a week changed my energy.', 'a never-say word said plainly');
  assert.equal(S('I wanted to talk about why our sales team stopped doing cold calls this quarter\nShort version: warm intros closed 4x more.'), 'Our sales team stopped doing cold calls this quarter. Here’s why:');
  assert.equal(S('I wanted to talk about why our sales team stopped doing cold calls this quarter'), 'Our sales team stopped doing cold calls this quarter.', 'no "Here’s why" bait when the post stops there');
  /* strong lines are left alone */
  for (const t of ['Most people quit right before it starts working.', 'My best trade this year? The one I didn’t take.', 'Stop chasing green candles.']) assert.ok(E.hgSharpen(t).same, t);
});

test('the receipt: every sharpen says which move it made and why that move works', () => {
  const r = E.hgSharpen('honestly most design systems fail because nobody really owns them');
  assert.equal(r.main, 'ask'); assert.match(r.why, /question/i); assert.deepEqual(r.cuts, ['honestly', 'really']);
  const n = E.hgSharpen('I’ve been thinking a lot about pricing lately and I think we were really undercharging');
  assert.equal(n.first, 'Pricing: we were undercharging.'); assert.ok(n.why.length > 20);
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
  assert.ok(ready >= 40, `Ready after one tap: ${ready}/${EVAL.length}`);
});
