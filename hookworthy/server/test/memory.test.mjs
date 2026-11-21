import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const core = createRequire(import.meta.url)('../../core.js');
const M = core.memory;

const POSTS = ['we doubled our price. signups went up 31%.\nheres the email we sent', 'shipped the new onboarding today. 2 screens instead of 7.\nactivation went from 21% to 38%', '3 things i learned pricing my first product:\n1. charge more\n2. charge sooner', 'most people price their newsletter like a hobby. dont.\nheres what i do instead'];

test('voice memory: shipped posts become habits, deduped', () => {
  const m = M.memNew();
  POSTS.forEach(t => M.memPost(m, t)); M.memPost(m, POSTS[0]); M.memPost(m, 'ok');
  assert.equal(m.posts.length, 4);
  const d = M.memDigest(m);
  assert.equal(d.sent, 4);
  assert.ok(d.habits.some(h => /lowercase/.test(h)));
  assert.ok(d.habits.some(h => /emoji/.test(h)));
});

test('voice memory: words cut from suggestions twice are avoided; a full rewrite is not an edit', () => {
  const m = M.memNew();
  M.memEdit(m, 'This is a game-changer for your journey: double your price.', 'double your price. thats it.');
  M.memEdit(m, 'A game-changer move for every founder journey: raise prices.', 'raise prices. nobody does.');
  M.memEdit(m, 'Completely unrelated suggestion about cats', 'pricing is a feature');
  const d = M.memDigest(m);
  assert.deepEqual(d.avoid.sort(), ['game-changer', 'journey']);
  assert.equal(d.edits, 2);
  assert.match(core.voiceBlock({ learned: d }), /leave them out: game-changer/);
});

test('voice memory: undone cuts become kept words, and Sharpen leaves them alone', () => {
  const m = M.memNew(); M.memKeep(m, ['honestly']); M.memKeep(m, ['honestly']);
  assert.deepEqual(M.memKeepList(m), ['honestly']);
  const line = 'honestly i think most people are really wrong about pricing';
  const plain = core.hookUp(line), kept = core.hookUp(line, { keep: M.memKeepList(m) });
  assert.ok(!/honestly/i.test(plain.best.text));
  assert.ok(!kept.best || /^honestly/i.test(kept.best.text));
  assert.ok(!kept.best || !/Qk\d+q/.test(kept.best.text));
});

test('voice memory: moves kept or undone nudge the ranking', () => {
  const m = M.memNew(); ['ask', 'ask', 'ask'].forEach(k => M.memChoice(m, k, true)); M.memChoice(m, 'contrast', false); M.memChoice(m, 'contrast', false);
  assert.deepEqual(M.memPref(m), { ask: 3, contrast: -2 });
  const d = M.memDigest(m);
  assert.deepEqual(d.prefer, ['ask, then answer']); assert.deepEqual(d.dislike, ['a two-beat contrast']);
});

test('voice block: own posts are examples, empty memory adds nothing', () => {
  assert.equal(core.voiceBlock({ learned: M.memDigest(M.memNew()) }), '');
  assert.match(core.voiceBlock({ examples: ['mine'] }), /Their own posts/);
});
