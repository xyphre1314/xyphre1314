/* review links on a locked server: reviewers read, comment and resolve by link; only the author changes the draft or switches it off */
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-rv-'));
process.env.HOOKWORTHY_TOKEN = 'secret-token';
delete process.env.ANTHROPIC_API_KEY; delete process.env.ANTHROPIC_AUTH_TOKEN;
const { handle } = await import('../server.mjs');
let srv, port;
before(async () => { srv = createServer(handle); await new Promise(r => srv.listen(0, '127.0.0.1', r)); port = srv.address().port; });
after(() => srv.close());
const call = (path, { method = 'GET', body, auth = false } = {}) => new Promise((res, rej) => { const headers = { ...(body ? { 'content-type': 'application/json' } : {}), ...(auth ? { authorization: 'Bearer secret-token' } : {}) }; const r = request({ host: '127.0.0.1', port, path, method, headers }, resp => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => { let j = null; try { j = JSON.parse(d); } catch { /* html */ } res({ status: resp.statusCode, json: j }); }); }); r.on('error', rej); if (body) r.write(JSON.stringify(body)); r.end(); });

test('creating a link needs the token; reading and commenting by link do not', async () => {
  assert.equal((await call('/api/review', { method: 'POST', body: { tweets: ['x'] } })).status, 401);
  const c = await call('/api/review', { method: 'POST', body: { tweets: ['A draft worth a look'], author: { name: 'Sam' } }, auth: true }); assert.equal(c.status, 200);
  const id = c.json.id;
  assert.equal((await call('/api/review/' + id)).status, 200);
  const cm = await call(`/api/review/${id}/comments`, { method: 'POST', body: { who: 'rk-abcd', name: 'Priya', text: 'Cut “worth”.', quote: 'worth', start: 8 } }); assert.equal(cm.status, 200);
  assert.equal((await call(`/api/review/${id}/comments/${cm.json.id}`, { method: 'PATCH', body: { resolved: true, name: 'Priya' } })).status, 200);
  /* a reviewer can't rewrite the draft, switch the link off, or pose as the author */
  assert.equal((await call('/api/review/' + id, { method: 'PUT', body: { tweets: ['Hijacked'] } })).status, 401);
  assert.equal((await call('/api/review/' + id, { method: 'PUT', body: { public: false } })).status, 401);
  const fake = await call(`/api/review/${id}/comments?owner=1`, { method: 'POST', body: { name: 'Sam', text: 'Me, honestly.' } }); assert.equal(fake.json.who, 'n-sam'); assert.equal(fake.json.name, 'Sam');
  const g = await call('/api/review/' + id); assert.deepEqual(g.json.posts, ['A draft worth a look']);
  /* the author switches it off; it's gone for the link, still there with the token */
  assert.equal((await call('/api/review/' + id, { method: 'PUT', body: { public: false }, auth: true })).status, 200);
  assert.equal((await call('/api/review/' + id)).status, 404);
  assert.equal((await call(`/api/review/${id}?owner=1`)).status, 404, 'owner=1 without the token is just a visitor');
  const mine = await call(`/api/review/${id}?owner=1`, { auth: true }); assert.equal(mine.status, 200); assert.equal(mine.json.comments.length, 2);
  const reply = await call(`/api/review/${id}/comments?owner=1`, { method: 'POST', body: { text: 'Done, thanks.', parent: cm.json.id }, auth: true }); assert.equal(reply.json.who, 'owner');
});
