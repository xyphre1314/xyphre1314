import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
import { createECDH, createHmac, createDecipheriv, createPublicKey, verify, randomBytes } from 'node:crypto';
import { createRequire } from 'node:module';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-bo-')); process.env.X_BEARER_TOKEN = 'bearer'; process.env.X_CLIENT_ID = 'cid';
const { write, read } = await import('../lib/store.mjs');
const P = await import('../lib/push.mjs'), BO = await import('../lib/breakout.mjs'), Q = await import('../lib/scheduler.mjs');
const core = createRequire(import.meta.url)('../../core.js');
const res = (status, body) => ({ ok: status < 400, status, headers: { get: () => null }, json: async () => body });
const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const hmac = (k, d) => createHmac('sha256', k).update(d).digest();

/* a browser's side of RFC 8291, to check the server's encryption really opens */
function browser() { const ua = createECDH('prime256v1'); ua.generateKeys(); const auth = randomBytes(16); return { ua, auth, keys: { p256dh: b64u(ua.getPublicKey()), auth: b64u(auth) } }; }
function decrypt(buf, { ua, auth }) {
  const salt = buf.subarray(0, 16), idlen = buf[20], asPub = buf.subarray(21, 21 + idlen), body = buf.subarray(21 + idlen);
  const ikm = hmac(hmac(auth, ua.computeSecret(asPub)), Buffer.concat([Buffer.from('WebPush: info\0'), ua.getPublicKey(), asPub, Buffer.from([1])]));
  const prk = hmac(salt, ikm), cek = hmac(prk, Buffer.from('Content-Encoding: aes128gcm\0\x01')).subarray(0, 16), nonce = hmac(prk, Buffer.from('Content-Encoding: nonce\0\x01')).subarray(0, 12);
  const d = createDecipheriv('aes-128-gcm', cek, nonce); d.setAuthTag(body.subarray(body.length - 16));
  const out = Buffer.concat([d.update(body.subarray(0, body.length - 16)), d.final()]); assert.equal(out[out.length - 1], 2, 'last-record delimiter'); return out.subarray(0, -1).toString();
}

test('push: payload encryption opens with the browser’s keys (RFC 8291), VAPID token verifies', () => {
  const b = browser(); const msg = JSON.stringify({ title: 'Taking off', body: 'ünïcode ✓' });
  const enc = P.encrypt(msg, b.keys); assert.equal(enc.readUInt32BE(16), 4096); assert.equal(decrypt(enc, b), msg);
  const h = P.vapidHeader('https://fcm.googleapis.com/fcm/send/abc', 'https://hookworthy.example');
  const [, t, k] = h.match(/^vapid t=([^,]+), k=(.+)$/); assert.equal(k, P.publicKey()); const [hd, pl, sig] = t.split('.');
  const claims = JSON.parse(unb64u(pl)); assert.equal(claims.aud, 'https://fcm.googleapis.com'); assert.ok(claims.exp > Date.now() / 1000);
  const pub = unb64u(k); const key = createPublicKey({ key: { kty: 'EC', crv: 'P-256', x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33)) }, format: 'jwk' });
  assert.ok(verify('sha256', Buffer.from(`${hd}.${pl}`), { key, dsaEncoding: 'ieee-p1363' }, unb64u(sig)));
  assert.equal(P.vapidKeys().publicKey, k, 'keys are kept, not remade');
});

test('push: sends with the right headers; a 410 means the device unsubscribed', async () => {
  const b = browser(); let seen;
  globalThis.fetch = async (u, o) => { seen = { u, o }; return res(201, {}); };
  assert.equal(await P.sendPush({ endpoint: 'https://push.example/1', keys: b.keys }, { title: 'x' }), 'sent');
  assert.equal(seen.o.headers['content-encoding'], 'aes128gcm'); assert.match(seen.o.headers.authorization, /^vapid t=/); assert.equal(JSON.parse(decrypt(seen.o.body, b)).title, 'x');
  globalThis.fetch = async () => res(410, {});
  assert.equal(await P.sendPush({ endpoint: 'https://push.example/1', keys: b.keys }, { title: 'x' }), 'gone');
  await assert.rejects(P.sendPush({ endpoint: 'http://169.254.169.254/', keys: b.keys }, {}), /Bad push/);
});

test('breakout: alerts once at 3× your usual pace, with replies drafted, by push and email', async () => {
  const now = Date.now(); const b = browser();
  BO.setSettings({ on: true, median: 100, email: 'me@example.com', subscribe: { endpoint: 'https://push.example/dev', keys: b.keys }, voice: { summary: 'short' } });
  BO.track({ ids: ['900'], posts: [{ text: 'Cutting to one plan doubled trials.' }, { text: 'Here’s how.' }], at: now - 20 * 60e3 });
  BO.track({ ids: ['901'], posts: ['A quiet one.'], at: now - 20 * 60e3 });
  const pushes = [], mails = [], lookups = [];
  globalThis.fetch = async (u, o = {}) => { const url = String(u);
    if (url.includes('/tweets?ids=')) { lookups.push(url); return res(200, { data: [{ id: '900', text: 't', public_metrics: { like_count: 60, retweet_count: 5, reply_count: 8 } }, { id: '901', text: 't', public_metrics: { like_count: 2, retweet_count: 0, reply_count: 0 } }] }); }
    if (url.includes('/tweets/search/recent')) return res(200, { data: [{ id: 'r1', text: '@me how long did this take?', author_id: 'u1', public_metrics: { like_count: 3 } }], includes: { users: [{ id: 'u1', username: 'asker', public_metrics: { followers_count: 5000 } }] } });
    if (url.startsWith('https://push.example/')) { pushes.push(JSON.parse(decrypt(o.body, b))); return res(201, {}); }
    return res(404, {}); };
  const drafted = [];
  const fired = await BO.tick({ now, draft: async x => { drafted.push(x); return [{ id: 0, reply: 'About six weeks.' }]; }, email: async (to, subj, html) => { mails.push({ to, subj, html }); }, publicUrl: 'https://hw.example' });
  assert.equal(lookups.length, 1, 'one batched lookup for both posts'); assert.match(lookups[0], /ids=900,901/);
  assert.equal(fired.length, 1); const a = fired[0];
  assert.equal(a.id, '900'); assert.equal(a.min, 20); assert.ok(a.pace >= 3, `pace ${a.pace}`); assert.equal(a.replies[0].draft, 'About six weeks.');
  assert.equal(drafted[0].post, 'Cutting to one plan doubled trials.\n\nHere’s how.'); assert.deepEqual(drafted[0].voice, { summary: 'short' });
  assert.equal(pushes.length, 1); assert.match(pushes[0].title, /× your usual/); assert.equal(pushes[0].url, 'https://hw.example/?breakout=900#queue');
  assert.equal(mails.length, 1); assert.equal(mails[0].to, 'me@example.com'); assert.match(mails[0].html, /About six weeks/);
  assert.equal(BO.alerts(now - 1).length, 1); assert.deepEqual(BO.alerts(now - 1)[0].sent, { push: 1, email: true });
  assert.ok(a.curve.find(c => c.min === 20).v > 0, 'usual curve for the chart');
  /* next minute: nothing new is due, and it never alerts twice */
  assert.equal((await BO.tick({ now: now + 60e3 })).length, 0); assert.equal(lookups.length, 1);
  assert.equal((await BO.tick({ now: now + 5 * 60e3 })).length, 0); assert.equal(lookups.length, 2, 'the 25-minute check');
});

test('breakout: no baseline, too early, too late, or switched off means no alert', async () => {
  const now = Date.now(); write('breakout', { settings: { on: true, email: '', median: 0, voice: null, subs: [] }, watch: [], alerts: [] });
  let lookups = 0; globalThis.fetch = async u => { lookups++; return res(200, { data: [{ id: '5', text: 't', public_metrics: { like_count: 500 } }] }); };
  BO.track({ ids: ['5'], posts: ['x'], at: now - 20 * 60e3 });
  assert.equal((await BO.tick({ now })).length, 0, 'no usual pace known yet'); assert.equal(lookups, 1);
  BO.setSettings({ median: 50 });
  write('breakout', { ...read('breakout'), watch: [{ id: '6', text: 'x', posts: ['x'], at: now - 5 * 60e3, checks: [], alerted: false }] });
  assert.equal((await BO.tick({ now })).length, 0, 'minute 5 is before the window');
  write('breakout', { ...read('breakout'), watch: [{ id: '7', text: 'x', posts: ['x'], at: now - 55 * 60e3, checks: [{ min: 40, eng: 1 }], alerted: false }] });
  assert.equal((await BO.tick({ now })).length, 0, 'minute 50 is past the window');
  BO.setSettings({ on: false }); lookups = 0;
  write('breakout', { ...read('breakout'), watch: [{ id: '8', text: 'x', posts: ['x'], at: now - 20 * 60e3, checks: [], alerted: false }] });
  assert.equal((await BO.tick({ now })).length, 0); assert.equal(lookups, 0, 'off means no X calls at all');
  assert.throws(() => BO.setSettings({ email: 'nope' }), /doesn’t look right/);
});

test('breakout: learns your usual pace from your own posts once there are five', () => {
  const watch = [3, 4, 5, 6, 7].map(i => ({ id: 'w' + i, at: 0, checks: [{ min: 20, eng: i * 10 }] }));
  const u = BO.usualAt(20, { settings: { median: 999 }, watch }); assert.equal(u.from, 'posts'); assert.equal(u.v, 50); assert.equal(u.n, 5);
  assert.equal(BO.usualAt(20, { settings: { median: 100 }, watch: watch.slice(0, 4) }).from, 'history');
});

test('scheduler: a post that goes out on X starts being watched', async () => {
  write('x-token', { access: 'tok', refresh: 'r', exp: Date.now() + 3600e3, handle: 'me', id: '1' });
  write('breakout', { settings: { on: true, email: '', median: 10, voice: null, subs: [] }, watch: [], alerts: [] });
  globalThis.fetch = async () => res(200, { data: { id: '4242' } });
  await Q.publish({ posts: ['Hello'], platforms: ['x'] });
  assert.equal(read('breakout').watch[0].id, '4242'); assert.equal(read('breakout').watch[0].text, 'Hello');
});

test('hook score tuned to you: learns your traits, tests itself on your newest posts, beats the general score when your audience differs', () => {
  let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  /* an audience that loves questions and hates lists, whatever the general rules say */
  const lines = ['What would you cut first?', 'Why do launches feel quiet?', '5 tools I use every day', '7 lessons from shipping', 'Stop writing long emails.', 'We shipped the new onboarding today', 'Is pricing a product problem?', 'Nobody tells you this about hiring'];
  const posts = Array.from({ length: 160 }, (_, i) => { const t = lines[i % lines.length]; let e = 30; if (/\?$/.test(t)) e *= 3; if (/^\d/.test(t)) e *= .35; return { id: 'p' + i, text: t + '\n\nmore', at: Date.now() - i * 864e5, likes: Math.round(e * (.6 + r() * .8)), reposts: 0, replies: 0 }; });
  const m = core.learnHooks(posts);
  assert.ok(m.ready); assert.equal(m.n, 160); assert.ok(m.val && m.val.n === 40);
  assert.equal(m.trust, 'better', JSON.stringify(m.val)); assert.ok(m.val.r > m.val.rGeneral);
  const q = core.personalScore('What would you charge for this?', m), l = core.personalScore('9 tools for founders', m);
  assert.ok(q.score > l.score + 30, `${q.score} vs ${l.score}`); assert.ok(q.x > 1 && l.x < 1);
  assert.ok(q.helps.some(h => /question/.test(h.label))); assert.ok(l.hurts.some(h => /lists/.test(h.label)));
  assert.ok(m.vs && m.vs.best.label === 'questions' && m.vs.worst.label === 'lists', JSON.stringify(m.vs));
  assert.deepEqual(core.learnHooks(posts.slice(0, 12)), { ready: false, n: 12, need: 30 });
  assert.equal(core.personalScore('x', { ready: false }), null);
});
