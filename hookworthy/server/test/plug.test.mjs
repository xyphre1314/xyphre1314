import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-plug-')); process.env.X_BEARER_TOKEN = 'bearer'; process.env.X_CLIENT_ID = 'cid';
const { write, read } = await import('../lib/store.mjs');
const Q = await import('../lib/scheduler.mjs'), PL = await import('../lib/plug.mjs');
const res = (status, body) => ({ ok: status < 400, status, headers: { get: () => null }, json: async () => body });
const H = 3600e3, NOW = Date.parse('2026-10-02T12:00:00Z');
const connect = () => write('x-token', { access: 'tok', refresh: 'r', exp: Date.now() + H, handle: 'samtrades', id: '1' });
const fresh = () => { write('plugs', []); write('queue', []); write('breakout', { settings: { on: false, email: '', median: 0, voice: null, subs: [] }, watch: [], alerts: [] }); PL._reset(); };
/* a mock X: likes per tweet id, every create-tweet body recorded */
function mockX({ likes = {}, replyStatus = 200 } = {}) {
  const calls = { creates: [], lookups: 0 }; let n = 5000;
  globalThis.fetch = async (u, o = {}) => { const url = String(u);
    if (url.endsWith('/tweets') && o.method === 'POST') { const b = JSON.parse(o.body); calls.creates.push(b); if (b.reply && replyStatus !== 200 && calls.creates.length > 0 && b.text.startsWith('If this')) return res(replyStatus, { detail: replyStatus === 429 ? 'Too Many Requests' : 'Forbidden' }); return res(200, { data: { id: String(++n) } }); }
    if (url.includes('/tweets?ids=')) { calls.lookups++; const ids = url.match(/ids=([\d,]+)/)[1].split(','); return res(200, { data: ids.filter(id => id in likes).map(id => ({ id, text: 't', public_metrics: { like_count: likes[id], retweet_count: 0, reply_count: 0 } })) }); }
    return res(404, {}); };
  return calls;
}
const PLUG = { on: true, text: 'If this helped, I break down one trade like this every week: https://example.com/news', at: 50 };

test('who can reply: reply_settings goes on the first post only, and is left out for Everyone', async () => {
  fresh(); connect(); const calls = mockX();
  await Q.publish({ posts: ['Hook', 'Two', 'Three'], platforms: ['x'], replySettings: 'following' });
  assert.equal(calls.creates.length, 3);
  assert.equal(calls.creates[0].reply_settings, 'following');
  assert.equal(calls.creates[1].reply_settings, undefined, 'the rest of the thread are your own replies'); assert.ok(calls.creates[1].reply);
  calls.creates.length = 0;
  await Q.publish({ posts: ['Solo'], platforms: ['x'] });
  assert.equal('reply_settings' in calls.creates[0], false, 'Everyone is X’s default: omitted');
  calls.creates.length = 0;
  await Q.publish({ posts: ['Solo'], platforms: ['x'], ...Q.xOptions({ replySettings: 'mentionedUsers' }) });
  assert.equal(calls.creates[0].reply_settings, 'mentionedUsers');
});

test('scheduling stores who can reply and the plug; bad values are refused', () => {
  fresh();
  const it = Q.add({ posts: ['x'], at: new Date(Date.now() + H).toISOString(), platforms: { x: true }, replySettings: 'following', plug: PLUG });
  assert.equal(it.replySettings, 'following'); assert.deepEqual(it.plug, { on: true, text: PLUG.text, at: 50 });
  const ev = Q.add({ posts: ['x'], at: new Date(Date.now() + H).toISOString(), platforms: { x: true }, replySettings: 'everyone', plug: { on: false, text: 'x', at: 50 } });
  assert.equal(ev.replySettings, undefined); assert.equal(ev.plug, undefined);
  const li = Q.add({ posts: ['x'], at: new Date(Date.now() + H).toISOString(), platforms: { linkedin: true }, replySettings: 'following', plug: PLUG });
  assert.equal(li.replySettings, undefined, 'LinkedIn has no equivalent'); assert.equal(li.plug, undefined);
  const at = new Date(Date.now() + H).toISOString();
  assert.throws(() => Q.add({ posts: ['x'], at, platforms: { x: true }, replySettings: 'nobody' }), e => e.status === 400);
  assert.throws(() => Q.add({ posts: ['x'], at, platforms: { x: true }, plug: { ...PLUG, text: 'Read it here: [link]' } }), /brackets/);
  assert.throws(() => Q.add({ posts: ['x'], at, platforms: { x: true }, plug: { ...PLUG, text: 'a'.repeat(281) } }), /over 280/);
  assert.throws(() => Q.add({ posts: ['x'], at, platforms: { x: true }, plug: { ...PLUG, at: 7 } }), /Pick when/);
});

test('auto-plug: watches likes, replies once when it crosses the line, records plugSentAt', async () => {
  fresh(); connect(); const likes = {}; const calls = mockX({ likes });
  write('queue', [{ id: 'q1', at: new Date(NOW - 60e3).toISOString(), posts: [{ text: 'BTC held the range again.', media: [] }], platforms: ['x'], status: 'scheduled', results: {}, replySettings: 'following', plug: { on: true, text: PLUG.text, at: 50 } }]);
  await Q.tick(NOW);
  const posted = Q.list()[0]; const id = posted.results.x.ids[0];
  assert.equal(posted.results.x.plug, 'watching'); assert.equal(calls.creates[0].reply_settings, 'following');
  const w = PL.get(id); assert.equal(w.status, 'watching'); assert.equal(w.queueId, 'q1');
  w.postedAt = NOW; write('plugs', [w]);
  likes[id] = 12; calls.creates.length = 0;
  assert.equal((await PL.tick({ now: NOW + 10 * 60e3 })).length, 0, 'below 50 likes: nothing');
  assert.equal(calls.creates.length, 0); assert.equal(PL.get(id).likes, 12);
  assert.equal((await PL.tick({ now: NOW + 12 * 60e3 })).length, 0); assert.equal(calls.lookups, 1, 'polls every 10 minutes, not every tick');
  likes[id] = 64;
  const sent = await PL.tick({ now: NOW + 20 * 60e3 });
  assert.equal(sent.length, 1); assert.equal(calls.creates.length, 1);
  assert.deepEqual(calls.creates[0], { text: PLUG.text, reply: { in_reply_to_tweet_id: id } });
  const done = PL.get(id); assert.equal(done.status, 'sent'); assert.equal(done.plugSentAt, new Date(NOW + 20 * 60e3).toISOString()); assert.ok(done.replyId);
  assert.equal(Q.list()[0].plug.status, 'sent', 'the queue item shows it too'); assert.ok(Q.list()[0].plug.plugSentAt);
  likes[id] = 400;
  await PL.tick({ now: NOW + 40 * 60e3 }); await PL.tick({ now: NOW + 60 * 60e3 });
  assert.equal(calls.creates.length, 1, 'exactly once');
});

test('auto-plug: a deleted post or a failed reply is recorded, never retried', async () => {
  fresh(); connect();
  const calls = mockX({ likes: { 801: 90 }, replyStatus: 403 });
  PL.watch({ tweetId: '800', plug: PLUG, at: NOW }); PL.watch({ tweetId: '801', plug: PLUG, at: NOW });
  await PL.tick({ now: NOW + 15 * 60e3 });
  assert.equal(PL.get('800').status, 'failed'); assert.match(PL.get('800').error, /deleted/);
  assert.equal(PL.get('801').status, 'failed'); assert.match(PL.get('801').error, /didn’t go out: Forbidden/);
  assert.equal(PL.get('801').plugSentAt, undefined);
  await PL.tick({ now: NOW + 40 * 60e3 }); assert.equal(calls.creates.length, 1, 'one attempt, no retry');
});

test('auto-plug: a rate limit backs off and tries again; 48 hours later it stops watching', async () => {
  fresh(); connect();
  const calls = mockX({ likes: { 900: 30 }, replyStatus: 429 });
  PL.watch({ tweetId: '900', plug: { ...PLUG, at: 25 }, at: NOW });
  await PL.tick({ now: NOW + 10 * 60e3 });
  assert.equal(PL.get('900').status, 'watching', 'a 429 is not a failure'); assert.equal(calls.creates.length, 1);
  await PL.tick({ now: NOW + 20 * 60e3 }); assert.equal(calls.lookups, 1, 'backing off: no calls');
  globalThis.fetch = async (u, o = {}) => String(u).includes('/tweets?ids=') ? res(200, { data: [{ id: '900', text: 't', public_metrics: { like_count: 30 } }] }) : res(200, { data: { id: '9001' } });
  await PL.tick({ now: NOW + 30 * 60e3 }); assert.equal(PL.get('900').status, 'sent');
  PL.watch({ tweetId: '901', plug: PLUG, at: NOW });
  mockX({ likes: { 901: 3 } }); await PL.tick({ now: NOW + 49 * H });
  assert.equal(PL.get('901').status, 'expired'); assert.match(PL.get('901').error, /48 hours/);
});

test('auto-plug: nothing connected means no X calls and nothing sent', async () => {
  fresh(); write('x-token', null);
  const calls = mockX({ likes: { 950: 999 } });
  PL.watch({ tweetId: '950', plug: PLUG, at: NOW });
  assert.equal((await PL.tick({ now: NOW + 30 * 60e3 })).length, 0);
  assert.equal(calls.lookups, 0); assert.equal(calls.creates.length, 0); assert.equal(PL.get('950').status, 'watching');
});

test('auto-plug: "beats your usual pace" uses the breakout rule, and can be turned off before it goes', async () => {
  fresh(); connect();
  write('breakout', { settings: { on: true, email: '', median: 100, voice: null, subs: [] }, watch: [], alerts: [] });
  PL.watch({ tweetId: '960', plug: { ...PLUG, at: 'pace' }, at: NOW });
  const w = PL.get('960');
  assert.equal(PL.crossed(w, { likes: 10 }, NOW + 20 * 60e3), false, 'about usual');
  assert.equal(PL.crossed(w, { likes: 60, replies: 8 }, NOW + 20 * 60e3), true, '3× usual');
  assert.deepEqual(PL.cancel('960'), { cancelled: true, status: 'off' });
  const calls = mockX({ likes: { 960: 999 } }); await PL.tick({ now: NOW + 30 * 60e3 });
  assert.equal(calls.creates.length, 0); assert.deepEqual(PL.cancel('960'), { cancelled: false, status: 'off' });
});
