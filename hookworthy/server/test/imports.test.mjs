import { test } from 'node:test';
import assert from 'node:assert/strict';

test('imports: drafts, scheduled posts and deleted posts never land in Your posts; posts without numbers never rank', async () => {
  const { createRequire } = await import('node:module'); const core = createRequire(import.meta.url)('../../core.js');
  /* Typefully: scheduled drafts (tagged by the server, or with only a scheduled date) are dropped */
  const tf = core.parseTypefully([{ id: 1, text: 'Went out', published_on: '2026-09-01T10:00:00Z', likes: 20 }, { id: 2, text: 'Still a draft', status: 'draft' }, { id: 3, text: 'Scheduled for later', scheduled_date: '2026-10-09T10:00:00Z' }, { id: 4, text: 'Tagged scheduled', status: 'scheduled', published_on: null }]);
  assert.deepEqual(tf.map(p => p.text), ['Went out']);
  /* a CSV status column: only rows that went out */
  const csv = core.parseCSV('text,status,likes\nPosted one,published,5\nA draft,Draft,0\nIn the queue,scheduled,0\nNo status given,,3');
  assert.deepEqual(csv.map(p => p.text), ['Posted one', 'No status given']);
  /* X archive: deleted-tweets.js is not your posts, even though its name ends in tweets.js */
  const arch = core.parseXArchive([{ name: 'tweets.js', text: 'window.YTD.tweets.part0 = [{"tweet":{"id_str":"1","full_text":"Kept post","favorite_count":"9","retweet_count":"1"}}]' }, { name: 'deleted-tweets.js', text: 'window.YTD.deleted_tweets.part0 = [{"tweet":{"id_str":"2","full_text":"I deleted this","favorite_count":"0","retweet_count":"0","deleted_at":"2026-01-01"}}]' }]);
  assert.deepEqual(arch.posts.map(p => p.text), ['Kept post']);
  /* analysis: posts with no numbers are counted but never ranked, top or bottom */
  const now = Date.parse('2026-10-04T12:00:00Z'), day = 864e5;
  const real = Array.from({ length: 12 }, (_, i) => ({ id: 'r' + i, text: `Real post number ${i} with words`, likes: 10 + i * 10, reposts: i, replies: 0, views: 0, at: now - (i + 3) * day }));
  const empty = Array.from({ length: 5 }, (_, i) => ({ id: 'e' + i, text: `Imported with no numbers ${i}`, likes: 0, reposts: 0, replies: 0, views: 0, at: now - (i + 3) * day }));
  const an = core.analyze([...real, ...empty], now);
  assert.equal(an.n, 17); assert.equal(an.measured, 12); assert.equal(an.unmeasured, 5);
  assert.ok(an.top.every(p => core.measured(p)) && an.flops.every(p => core.measured(p)), 'no zero-metric post ranks');
  assert.ok(an.flops.every(p => core.eng(p) < an.median * .5), 'didn’t land means under half the usual');
  assert.equal(core.analyze([...real.slice(0, 5), ...empty], now).flops.length, 0, 'too few measured posts to call anything a miss');
});
