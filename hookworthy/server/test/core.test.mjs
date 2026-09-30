import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const core = createRequire(import.meta.url)('../../core.js');

const ARCHIVE = `window.YTD.tweets.part0 = [
 {"tweet":{"id_str":"1","full_text":"I charged 10x more and got more customers.","created_at":"Tue Mar 05 14:40:00 +0000 2024","favorite_count":"980","retweet_count":"120","in_reply_to_status_id_str":null}},
 {"tweet":{"id_str":"2","full_text":"Part two of the thread https://t.co/abc","created_at":"Tue Mar 05 14:41:00 +0000 2024","favorite_count":"40","retweet_count":"2","in_reply_to_status_id_str":"1","in_reply_to_user_id_str":"99"}},
 {"tweet":{"id_str":"3","full_text":"RT @someone: not mine","created_at":"Wed Mar 06 10:00:00 +0000 2024","favorite_count":"0","retweet_count":"0"}},
 {"tweet":{"id_str":"4","full_text":"@friend congrats!","created_at":"Wed Mar 06 11:00:00 +0000 2024","favorite_count":"3","retweet_count":"0","in_reply_to_status_id_str":"777","in_reply_to_user_id_str":"55"}},
 {"tweet":{"id_str":"5","full_text":"so i think pricing is kind of important &amp; stuff","created_at":"Thu Mar 07 22:00:00 +0000 2024","favorite_count":"4","retweet_count":"0"}}
]`;
const ACCOUNT = `window.YTD.account.part0 = [{"account":{"username":"heycape_","accountDisplayName":"Cape","accountId":"99"}}]`;

test('hook score rewards specifics and punishes hedges', () => {
  assert.ok(core.hookScore('Double your price. Signups went up 31%.').score >= 70);
  assert.ok(core.hookScore('so i think pricing is kind of important').score < 50);
  assert.equal(core.hookScore('').score, 0);
});

test('X archive: keeps originals, folds self-replies into threads, drops RTs and replies to others', () => {
  const r = core.parseXArchive([{ name: 'tweets.js', text: ARCHIVE }, { name: 'account.js', text: ACCOUNT }]);
  assert.equal(r.account.handle, 'heycape_');
  assert.deepEqual(r.posts.map(p => p.id).sort(), ['x-1', 'x-5']);
  const one = r.posts.find(p => p.id === 'x-1');
  assert.equal(one.likes, 980); assert.equal(one.reposts, 120);
  assert.deepEqual(one.thread, ['Part two of the thread']);
  assert.equal(one.url, 'https://x.com/heycape_/status/1');
  assert.ok(r.posts.find(p => p.id === 'x-5').text.includes('& stuff'));
});

test('CSV: quoted commas and newlines, column detection, 1.2k numbers', () => {
  const csv = 'Post Text,Likes,Impressions,Date\n"line one, still one\nline two",1.2k,40000,2025-01-02\nsecond,5,100,2025-01-03\n';
  const p = core.parseCSV(csv);
  assert.equal(p.length, 2); assert.equal(p[0].likes, 1200); assert.equal(p[0].views, 40000); assert.match(p[0].text, /line two/);
});

test('LinkedIn Shares.csv shape', () => {
  const p = core.parseCSV('Date,ShareLink,ShareCommentary,SharedUrl\n2025-02-01 10:00:00,https://li/x,"I almost quit in March.",\n', 'linkedin');
  assert.equal(p[0].text, 'I almost quit in March.'); assert.equal(p[0].src, 'linkedin');
});

test('pasted posts split on --- and pick up likes', () => {
  const p = core.parsePasted('first post here\nlikes: 120\n---\nsecond post here');
  assert.equal(p.length, 2); assert.equal(p[0].likes, 120); assert.equal(p[0].text, 'first post here');
});

test('Typefully drafts', () => {
  const p = core.parseTypefully([{ id: 7, text: 'Hook line\n\n\n\nSecond tweet', published_on: '2025-03-01T10:00:00Z', twitter_url: 'https://x.com/a/status/1' }]);
  assert.equal(p[0].text, 'Hook line'); assert.deepEqual(p[0].thread, ['Second tweet']);
});

test('analyze: kinds, calibration, voice stats, old top posts', () => {
  const now = Date.parse('2026-09-30');
  const posts = [];
  for (let i = 0; i < 12; i++) posts.push(core.normPost({ id: 'c' + i, text: `Unpopular opinion: pricing page ${i} is overrated. Charge 2x.`, likes: 400 + i, at: now - (90 + i) * 864e5 }));
  for (let i = 0; i < 12; i++) posts.push(core.normPost({ id: 'w' + i, text: `so i think maybe things are kind of ok today ${'abcdefghijkl'[i]}`, likes: 10 + i, at: now - i * 864e5 }));
  const a = core.analyze(posts, now);
  assert.equal(a.n, 24);
  assert.equal(a.bestKind.k, 'Contrarian');
  assert.ok(a.calib && a.calib.x > 5, 'strong hooks earned more here');
  assert.ok(a.oldTop.length > 0);
  assert.ok(a.stats.wps > 0);
});

test('checkPost flags bait, blanks, links and never-say words', () => {
  const c = core.checkPost('https://a.com I lost [amount] and we leverage it. Agree?', { never: ['leverage'] });
  assert.ok(c.some(x => /blank/.test(x))); assert.ok(c.some(x => /link/i.test(x))); assert.ok(c.some(x => /bait/.test(x))); assert.ok(c.some(x => /leverage/.test(x)));
});

test('prompts carry the voice evidence and ask for JSON', () => {
  const s = core.prompts.rewrite({ text: 'draft', kind: 'hook', voice: { summary: 'lowercase, dry', examples: ['my best post'], never: ['delve'] } });
  assert.equal(s.tier, 'default'); assert.equal(s.json, true);
  assert.match(s.prompt, /my best post/); assert.match(s.prompt, /delve/); assert.match(s.prompt, /Never invent/);
  assert.equal(core.prompts.voiceProfile({ posts: [] }).tier, 'complex');
});

test('X character count: links are 23, emoji and CJK are 2', () => {
  assert.equal(core.xLength('hello'), 5);
  assert.equal(core.xLength('see https://example.com/' + 'a'.repeat(200)), 27);
  assert.equal(core.xLength('🚀🚀'), 4);
  assert.equal(core.xLength('日本語'), 6);
  assert.equal(core.xLength('👍🏽 ok'), 5);
});

test('sounds-like-you flags what drifts from your habits', () => {
  const r = core.voiceMatch('I am thrilled to leverage this game-changer!! 🚀🚀 #growth', { wps: 9, emojiPer: .05, tagsPer: 0, lower: 60 }, { never: ['leverage'] });
  assert.ok(r.score < 50); const frags = r.miss.map(m => m.frag);
  for (const f of ['#growth', 'leverage', 'game-changer']) assert.ok(frags.includes(f), f);
  assert.ok(core.voiceMatch('shipped the pricing page. 3 plans to 1.', { wps: 8, emojiPer: 0, tagsPer: 0, lower: 80 }).score >= 90);
});
test('predict from history uses the nearest past posts', () => {
  const posts = [core.normPost({ id: 'a', text: 'I raised my price and lost zero customers', likes: 900 }), core.normPost({ id: 'b', text: 'my morning routine, ranked', likes: 20 })];
  const p = core.predictFromHistory('I doubled my price. Customers stayed.', posts); assert.ok(p && p.near[0].id === 'a' && p.estimate > 300);
});

test('visualPlan picks the picture a post wants and copies numbers exactly', () => {
  const d = core.visualPlan('Redesigned onboarding from 7 screens to 2. Activation went from 21% → 38%.');
  assert.equal(d.template, 'data'); assert.equal(d.metric, 'Activation'); assert.equal(d.before, '21%'); assert.equal(d.after, '38%'); assert.equal(d.delta, '+81%');
  assert.equal(d.headline, 'Redesigned onboarding from 7 screens to 2.'); assert.equal(d.chip, '', 'no chip when the headline already says it');
  const churn = core.visualPlan('Churn fell from 9% to 4% after we added onboarding calls.'); assert.equal(churn.delta, '−56%'); assert.equal(churn.good, true, 'lower churn is good');
  const words = core.visualPlan('Before: 40 meetings a week\nAfter: 6 meetings a week'); assert.equal(words.template, 'data'); assert.equal(words.metric, 'Meetings a week');
  assert.equal(core.visualPlan('We doubled our price. Signups went up 31%.').template, 'stat');
  assert.equal(core.visualPlan('5 things I learned:\n\n1. Ship daily\n2. Talk to users\n3. Charge more').template, 'list');
  assert.equal(core.visualPlan('Old way: ship when ready\nNew way: ship on Fridays').template, 'compare');
  const q = core.visualPlan('I almost quit my startup in March.'); assert.equal(q.template, 'quote'); assert.equal(q.emphasis, 'quit');
  assert.equal(core.visualPlan('Shipped at 2am in 2024.').template, 'quote', 'times and years are not stats');
  const p = core.prompts.visual({ text: 'x', plan: d }); assert.equal(p.tier, 'quick'); assert.match(p.prompt, /never invent/);
});
