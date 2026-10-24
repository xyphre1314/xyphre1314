import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-media-')); process.env.HW_FAST_TESTS = '1';
process.env.X_BEARER_TOKEN = 'bearer'; process.env.X_CLIENT_ID = 'cid'; process.env.ANTHROPIC_API_KEY = 'k';
const { write } = await import('../lib/store.mjs');
const M = await import('../lib/media.mjs'), X = await import('../lib/x.mjs'), LI = await import('../lib/linkedin.mjs'), Q = await import('../lib/scheduler.mjs'), RD = await import('../lib/radar.mjs'), AI = await import('../lib/ai.mjs');
const PNG = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d4944415478da6364f8ffbf1e000502027f3dc84e0000000049454e44ae426082', 'hex');
const GIF = Buffer.concat([Buffer.from('GIF89a'), Buffer.alloc(40)]);
const res = (status, body, headers = {}) => ({ ok: status < 400, status, headers: { get: k => headers[k.toLowerCase()] || null }, json: async () => body, arrayBuffer: async () => body });

test('media: saves by content hash, sniffs the real type, only fetches GIPHY links', async () => {
  const a = await M.saveMedia({ data: 'data:image/png;base64,' + PNG.toString('base64'), alt: 'a chart' });
  assert.equal(a.mime, 'image/png'); assert.equal(a.kind, 'image'); assert.equal(M.getMedia(a.id).buf.length, PNG.length); assert.equal(M.getMedia(a.id).alt, 'a chart');
  const b = await M.saveMedia({ data: PNG.toString('base64') }); assert.equal(b.id, a.id, 'same bytes, same id');
  await assert.rejects(M.saveMedia({ data: Buffer.from('hello world').toString('base64') }), e => e.status === 415);
  await assert.rejects(M.saveMedia({ url: 'https://evil.example.com/x.gif' }), e => e.status === 400);
  await assert.rejects(M.saveMedia({ url: 'http://media.giphy.com/x.gif' }), e => e.status === 400, 'https only');
  globalThis.fetch = async u => { assert.match(String(u), /^https:\/\/media\d?\.giphy\.com\//); return res(200, GIF.buffer.slice(GIF.byteOffset, GIF.byteOffset + GIF.length)); };
  const g = await M.saveMedia({ url: 'https://media2.giphy.com/media/abc/giphy.gif' }); assert.equal(g.kind, 'gif');
  assert.throws(() => M.getMedia('nope'), e => e.status === 404);
});

test('X: uploads each post’s media (initialize → append → finalize → status), sets alt text, then posts with media_ids', async () => {
  write('x-token', { access: 'tok', refresh: 'r', exp: Date.now() + 3600e3, handle: 'me', id: '1' });
  const calls = []; let status = 0;
  globalThis.fetch = async (u, o = {}) => { const path = String(u).replace(/^https:\/\/api\.x\.com\/2/, ''); calls.push(`${o.method || 'GET'} ${path.split('?')[0]}${path.includes('command=STATUS') ? '?STATUS' : ''}`);
    if (path === '/media/upload/initialize') { const b = JSON.parse(o.body); assert.ok(['tweet_gif', 'tweet_image'].includes(b.media_category)); return res(200, { data: { id: 'M' + calls.length } }); }
    if (/\/append$/.test(path)) { assert.ok(o.body instanceof FormData); return res(200, {}); }
    if (/\/finalize$/.test(path)) return res(200, { data: { id: 'x', processing_info: { state: 'pending', check_after_secs: 1 } } });
    if (path.includes('command=STATUS')) return res(200, { data: { processing_info: { state: ++status > 1 ? 'succeeded' : 'in_progress', check_after_secs: 1 } } });
    if (path === '/media/metadata') return res(200, {});
    if (path === '/tweets') { const b = JSON.parse(o.body); return res(200, { data: { id: 'T' + calls.length, media: b.media } }); }
    return res(404, {}); };
  const gif = M.getMedia((await M.saveMedia({ data: GIF.toString('base64'), alt: 'ship it' })).id);
  const out = await X.postThread([{ text: 'one', media: [gif] }, 'two']);
  assert.equal(out.ids.length, 2);
  assert.deepEqual(calls.slice(0, 7), ['POST /media/upload/initialize', 'POST /media/upload/M1/append', 'POST /media/upload/M1/finalize', 'GET /media/upload?STATUS', 'GET /media/upload?STATUS', 'POST /media/metadata', 'POST /tweets']);
  assert.equal(calls.filter(c => c === 'POST /tweets').length, 2);
});

test('LinkedIn: one picture → content.media, several → multiImage', async () => {
  write('li-token', { access: 'li', exp: Date.now() + 3600e3, sub: 'abc', name: 'Me' }); const bodies = [];
  globalThis.fetch = async (u, o = {}) => { u = String(u);
    if (u.includes('initializeUpload')) return res(200, { value: { uploadUrl: 'https://upload.linkedin.test/1', image: 'urn:li:image:' + bodies.length } });
    if (u.startsWith('https://upload.linkedin.test')) { assert.equal(o.method, 'PUT'); return res(201, {}); }
    if (u.endsWith('/rest/posts')) { bodies.push(JSON.parse(o.body)); return res(201, {}, { 'x-restli-id': 'urn:li:share:9' }); }
    return res(404, {}); };
  const png = M.getMedia((await M.saveMedia({ data: PNG.toString('base64'), alt: 'chart' })).id);
  await LI.post('hello', [png]); assert.equal(bodies[0].content.media.altText, 'chart'); assert.match(bodies[0].content.media.id, /^urn:li:image:/);
  await LI.post('two', [png, png]); assert.equal(bodies[1].content.multiImage.images.length, 2);
  await LI.post('text only'); assert.equal(bodies[2].content, undefined);
});

test('scheduler: posts with media ids go out with their files', async () => {
  const png = await M.saveMedia({ data: PNG.toString('base64') }); const seen = [];
  globalThis.fetch = async (u, o = {}) => { u = String(u); if (u.includes('initializeUpload')) return res(200, { value: { uploadUrl: 'https://upload.linkedin.test/2', image: 'urn:li:image:z' } }); if (u.startsWith('https://upload.linkedin.test')) return res(201, {}); if (u.endsWith('/rest/posts')) { seen.push(JSON.parse(o.body)); return res(201, {}, { 'x-restli-id': 'urn:li:share:1' }); } return res(404, {}); };
  const r = await Q.publish({ posts: [{ text: 'a', media: [png.id] }, 'b'], platforms: ['linkedin'] });
  assert.equal(r.linkedin.ok, true); assert.equal(seen[0].commentary, 'a\n\nb'); assert.equal(seen[0].content.media.id, 'urn:li:image:z');
  assert.deepEqual(Q.normPosts(['  x ', { text: '', media: ['m1'] }, '']).map(p => [p.text, p.media.length]), [['x', 0], ['', 1]]);
});

test('radar: batches handles into queries, ranks fresh, fast, uncrowded posts first, explains why', async () => {
  const now = Date.parse('2026-09-30T12:00:00Z'); const queries = [];
  globalThis.fetch = async u => { const q = new URL(String(u)).searchParams.get('query'); queries.push(q); assert.ok(q.length <= 512);
    return res(200, { data: [
      { id: '1', text: 'old and crowded', created_at: '2026-09-30T10:10:00Z', author_id: 'a', public_metrics: { like_count: 900, reply_count: 400, retweet_count: 50, quote_count: 0 } },
      { id: '2', text: 'fresh and moving', created_at: '2026-09-30T11:52:00Z', author_id: 'b', public_metrics: { like_count: 80, reply_count: 3, retweet_count: 6, quote_count: 1 } },
      { id: '3', text: 'fresh but quiet', created_at: '2026-09-30T11:55:00Z', author_id: 'c', public_metrics: { like_count: 0, reply_count: 0, retweet_count: 0, quote_count: 0 } }],
      includes: { users: [{ id: 'a', username: 'big', public_metrics: { followers_count: 900000 } }, { id: 'b', username: 'mid', public_metrics: { followers_count: 40000 } }, { id: 'c', username: 'small', public_metrics: { followers_count: 300 } }] } }); };
  const handles = Array.from({ length: 30 }, (_, i) => 'handle_number' + i);
  const r = await RD.radar(handles, { now }); assert.ok(queries.length >= 2, 'long handle lists are split');
  assert.equal(r.posts[0].id, '2'); assert.ok(r.posts[0].why.some(w => /8 min old/.test(w))); assert.ok(r.posts[0].why.some(w => /only 3 replies/.test(w)));
  await assert.rejects(RD.radar(['bad handle!']), e => e.status === 400);
});

test('Claude reads pictures: image blocks go before the prompt', async () => {
  const calls = []; AI.setClient({ beta: { messages: { create: async req => { calls.push(req); return { model: req.model, stop_reason: 'end_turn', content: [{ type: 'text', text: '{"what":"a chart"}' }] }; } } } });
  await AI.complete({ prompt: 'read', json: true, docs: [{ mime: 'image/png', data: 'data:image/png;base64,' + PNG.toString('base64') }] });
  const c = calls[0].messages[0].content; assert.equal(c[0].type, 'image'); assert.equal(c[0].source.media_type, 'image/png'); assert.equal(c[1].text, 'read');
  await assert.rejects(AI.complete({ prompt: 'x', docs: [{ mime: 'image/tiff', data: 'x' }] }), e => e.code === 'invalid_request');
});
