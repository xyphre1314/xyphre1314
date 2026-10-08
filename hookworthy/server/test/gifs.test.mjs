import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.GIPHY_API_KEY = 'k-test';
const G = await import('../lib/gifs.mjs');

const giphy = (n, total = 100) => ({ data: Array.from({ length: n }, (_, i) => ({ id: 'g' + i, title: `Ship It GIF by Someone`, url: 'https://giphy.com/gifs/g' + i, user: { display_name: 'Someone' }, images: { original: { url: `https://media.giphy.com/o${i}.gif`, width: '480', height: '270', size: '900000' }, fixed_width: { url: `https://media.giphy.com/f${i}.gif`, webp: `https://media.giphy.com/f${i}.webp`, mp4: `https://media.giphy.com/f${i}.mp4`, width: '200', height: '113' }, fixed_width_still: { url: `https://media.giphy.com/s${i}.gif` } } })), pagination: { total_count: total } });

test('GIF search: trending when empty, search with a query, shaped results, cached, key never leaves the server', async () => {
  const calls = []; globalThis.fetch = async u => { calls.push(String(u)); return { ok: true, status: 200, json: async () => giphy(3) }; };
  const t = await G.searchGifs(''); assert.match(calls[0], /\/gifs\/trending\?/); assert.equal(t.gifs.length, 3);
  const s = await G.searchGifs('  ship   it '); assert.match(calls[1], /\/gifs\/search\?.*q=ship\+it/); assert.match(calls[1], /rating=pg-13/);
  assert.deepEqual(Object.keys(s.gifs[0]).sort(), ['h', 'id', 'mp4', 'page', 'preview', 'size', 'still', 'title', 'url', 'user', 'w'].sort());
  assert.equal(s.gifs[0].title, 'Ship It'); assert.equal(s.gifs[0].preview, 'https://media.giphy.com/f0.webp'); assert.equal(s.gifs[0].w, 480); assert.equal(s.next, 24);
  assert.ok(!JSON.stringify(s).includes('k-test'), 'the API key is not in the response');
  await G.searchGifs('ship it'); assert.equal(calls.length, 2, 'second identical search is served from cache');
});

test('GIF search errors: rate limit and bad key come back clear', async () => {
  globalThis.fetch = async () => ({ ok: false, status: 429, json: async () => ({}) });
  await assert.rejects(G.searchGifs('nope-429'), e => e.status === 429 && /100 searches/.test(e.message));
  globalThis.fetch = async () => ({ ok: false, status: 403, json: async () => ({ meta: { msg: 'Invalid authentication credentials' } }) });
  await assert.rejects(G.searchGifs('nope-403'), e => e.status === 503);
});
