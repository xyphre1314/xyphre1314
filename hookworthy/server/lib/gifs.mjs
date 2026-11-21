/* Real GIFs through GIPHY (Tenor's API closed on June 30, 2026).
   The key stays on the server (GIPHY_API_KEY). Beta keys allow 100 calls an hour, so results are cached
   for 15 minutes per query. GIPHY requires a "Powered by GIPHY" credit wherever results are shown. */
const BASE = () => (process.env.GIPHY_API_BASE || 'https://api.giphy.com/v1').replace(/\/$/, '');
export const gifsConfigured = () => !!process.env.GIPHY_API_KEY;
export class GifError extends Error { constructor(status, message) { super(message); this.status = status; } }
const cache = new Map(); const TTL = 15 * 60e3, MAX = 200;
const clean = q => String(q || '').trim().replace(/\s+/g, ' ').slice(0, 50);
/* one GIF, trimmed to what the picker and the post need */
function shape(g) {
  const im = g.images || {}, fw = im.fixed_width || im.fixed_width_downsampled || {}, og = im.original || {}, still = im.fixed_width_still || {};
  if (!fw.url && !og.url) return null;
  return { id: String(g.id), title: String(g.title || '').replace(/\s+GIF(\s+by\s+.+)?$/i, '').trim() || 'GIF', preview: fw.webp || fw.url || og.url, still: still.url || null, mp4: fw.mp4 || null,
    url: og.url || fw.url, w: +(og.width || fw.width) || 480, h: +(og.height || fw.height) || 270, size: +og.size || null, page: g.url || null, user: g.user && g.user.display_name ? g.user.display_name : null };
}
export async function searchGifs(q, { offset = 0, limit = 24, rating = 'pg-13' } = {}) {
  if (!gifsConfigured()) throw new GifError(503, 'GIPHY_API_KEY is not set');
  const query = clean(q), off = Math.max(0, Math.min(4999, +offset || 0)), lim = Math.max(1, Math.min(50, +limit || 24));
  const key = `${query}|${off}|${lim}|${rating}`; const hit = cache.get(key); if (hit && Date.now() - hit.at < TTL) return hit.v;
  const params = new URLSearchParams({ api_key: process.env.GIPHY_API_KEY, limit: String(lim), offset: String(off), rating, bundle: 'messaging_non_clips' });
  if (query) { params.set('q', query); params.set('lang', 'en'); }
  const r = await fetch(`${BASE()}/gifs/${query ? 'search' : 'trending'}?${params}`);
  const j = await r.json().catch(() => ({}));
  if (r.status === 429) throw new GifError(429, 'GIPHY rate limit hit. Beta keys allow 100 searches an hour.');
  if (!r.ok) throw new GifError(r.status === 401 || r.status === 403 ? 503 : 502, (j.meta && j.meta.msg) || j.message || `GIPHY ${r.status}`);
  const v = { gifs: (j.data || []).map(shape).filter(Boolean), next: j.pagination && j.pagination.total_count > off + lim ? off + lim : null, q: query };
  cache.set(key, { at: Date.now(), v }); if (cache.size > MAX) cache.delete(cache.keys().next().value);
  return v;
}
