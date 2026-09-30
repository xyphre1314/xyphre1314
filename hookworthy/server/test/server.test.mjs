import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-'));
delete process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_AUTH_TOKEN;
process.env.X_BEARER_TOKEN = 'bearer';
const { handle } = await import('../server.mjs');
let srv, port;
before(async () => { srv = createServer(handle); await new Promise(r => srv.listen(0, '127.0.0.1', r)); port = srv.address().port; });
after(() => srv.close());
const call = (path, { method = 'GET', body } = {}) => new Promise((res, rej) => { const r = request({ host: '127.0.0.1', port, path, method, headers: body ? { 'content-type': 'application/json' } : {} }, resp => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => { let j = null; try { j = JSON.parse(d); } catch { /* html */ } res({ status: resp.statusCode, json: j, text: d, type: resp.headers['content-type'] }); }); }); r.on('error', rej); if (body) r.write(JSON.stringify(body)); r.end(); });

test('health says what is on', async () => {
  const r = await call('/api/health');
  assert.equal(r.status, 200); assert.equal(r.json.ok, true); assert.equal(r.json.ai, false); assert.equal(r.json.x, true);
  assert.equal(r.json.models.default, 'claude-sonnet-5-5'); assert.equal(r.json.models.complex, 'claude-opus-5-5');
});
test('serves the app, and not the server folder', async () => {
  const r = await call('/'); assert.equal(r.status, 200); assert.match(r.type, /text\/html/); assert.match(r.text, /hookworthy/i);
  const c = await call('/core.js'); assert.match(c.text, /hookScore/);
  const s = await call('/server/.env'); assert.equal(s.status, 404);
  const t = await call('/../../etc/passwd'); assert.equal(/root:x:0:0/.test(t.text), false); const e = await call('/%2e%2e/%2e%2e/etc/passwd'); assert.equal(/root:x:0:0/.test(e.text), false);
});
test('Claude without a key is a clear 503, not a crash', async () => {
  const r = await call('/api/ai', { method: 'POST', body: { prompt: 'hi' } });
  assert.equal(r.status, 503); assert.equal(r.json.code, 'no_key');
});
test('v1/check grades and checks without any key', async () => {
  const r = await call('/api/v1/check', { method: 'POST', body: { text: 'I’m thrilled to announce we leverage AI. Agree?', never: ['leverage'] } });
  assert.equal(r.status, 200); assert.ok(r.json.hook.score >= 0); assert.ok(r.json.checks.length >= 2);
});
test('schedule, list and cancel', async () => {
  const bad = await call('/api/schedule', { method: 'POST', body: { posts: ['hi'], at: 'soon', platforms: { x: true } } }); assert.equal(bad.status, 400);
  const ok = await call('/api/schedule', { method: 'POST', body: { posts: ['one', 'two'], at: '2030-01-01T09:00:00Z', platforms: { x: true, linkedin: true } } });
  assert.equal(ok.status, 200); assert.deepEqual(ok.json.platforms, ['x', 'linkedin']);
  const l = await call('/api/queue'); assert.equal(l.json.queue.length, 1);
  const d = await call('/api/queue/' + ok.json.id, { method: 'DELETE' }); assert.equal(d.json.removed, true);
});
test('X posts through the API, normalized for import', async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async (url, opt) => {
    const u = String(url);
    assert.equal(opt.headers.authorization, 'Bearer bearer');
    if (u.includes('/users/by/username/heycape_')) return new Response(JSON.stringify({ data: { id: '42', username: 'heycape_', name: 'Cape', public_metrics: { followers_count: 900 } } }), { status: 200 });
    if (u.includes('/users/42/tweets')) { assert.match(u, /exclude=replies,retweets/); return new Response(JSON.stringify({ data: [{ id: '9', text: 'Hello world, this is a post', created_at: '2026-09-01T10:00:00Z', public_metrics: { like_count: 12, retweet_count: 3, quote_count: 1, reply_count: 2, impression_count: 900 } }], meta: {} }), { status: 200 }); }
    return new Response('{}', { status: 404 });
  };
  try {
    const r = await call('/api/x/posts?handle=heycape_&max=50');
    assert.equal(r.status, 200); assert.equal(r.json.account.handle, 'heycape_');
    assert.deepEqual(r.json.posts[0], { id: 'x-9', text: 'Hello world, this is a post', at: '2026-09-01T10:00:00Z', likes: 12, reposts: 4, replies: 2, views: 900, src: 'x-api', url: 'https://x.com/heycape_/status/9', handle: 'heycape_' });
    const bad = await call('/api/x/posts?handle=not%20a%20handle'); assert.equal(bad.status, 400);
  } finally { globalThis.fetch = real; }
});
test('X rate limits come back as 429 with a reset time', async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async () => new Response('{}', { status: 429, headers: { 'x-rate-limit-reset': '1900000000' } });
  try { const r = await call('/api/x/posts?handle=heycape_'); assert.equal(r.status, 429); assert.match(r.json.error, /rate limit/); } finally { globalThis.fetch = real; }
});
test('Typefully import maps drafts to posts', async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async (url, opt) => { assert.equal(opt.headers['X-API-KEY'], 'Bearer tf_key_123'); return new Response(JSON.stringify(String(url).includes('published') ? [{ id: 1, text: 'Shipped it.\n\n\n\nMore', published_on: '2026-08-01T10:00:00Z' }] : []), { status: 200 }); };
  try { const r = await call('/api/typefully/import', { method: 'POST', body: { key: 'tf_key_123' } }); assert.equal(r.status, 200); assert.equal(r.json.posts[0].text, 'Shipped it.'); assert.deepEqual(r.json.posts[0].thread, ['More']); } finally { globalThis.fetch = real; }
});
