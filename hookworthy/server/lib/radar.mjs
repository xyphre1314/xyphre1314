/* Reply radar: fresh posts from the people you learn from, ranked by how much a good early reply is worth.
   One X search per batch of handles; results cached for 3 minutes (reads cost money on X's API). */
import { xConfigured, XError } from './x.mjs';

const API = process.env.X_API_BASE || 'https://api.x.com/2';
const cache = new Map(); const TTL = 3 * 60e3;
const handleOk = h => /^\w{1,15}$/.test(h);
/* worth = fresh × moving × big enough × not yet crowded */
export function scorePost(t, author, now = Date.now()) {
  const age = Math.max(1, (now - Date.parse(t.created_at)) / 60e3), m = t.public_metrics || {};
  const eng = (m.like_count || 0) + 2 * (m.reply_count || 0) + 3 * (m.retweet_count || 0) + 3 * (m.quote_count || 0);
  const fresh = age <= 15 ? 1 : age <= 45 ? .75 : age <= 90 ? .45 : .2;
  const velocity = Math.log10(1 + eng / Math.max(3, age) * 10);
  const reach = Math.log10(10 + ((author && author.public_metrics && author.public_metrics.followers_count) || 0));
  const crowd = (m.reply_count || 0) < 15 ? 1 : 15 / (m.reply_count || 1);
  return +(fresh * (1.4 * velocity + reach) * (.5 + .5 * crowd)).toFixed(3);
}
export function reasons(t, author, now = Date.now()) {
  const age = Math.round((now - Date.parse(t.created_at)) / 60e3), m = t.public_metrics || {}, f = (author && author.public_metrics && author.public_metrics.followers_count) || 0, out = [];
  if (age <= 15) out.push(`${age} min old: the first replies get seen most`); else if (age <= 45) out.push(`${age} min old: still early`);
  const rc = m.reply_count || 0; if (rc < 10) out.push(rc ? `only ${rc} repl${rc > 1 ? 'ies' : 'y'} so far` : 'no replies yet');
  const perMin = ((m.like_count || 0) + 2 * (m.reply_count || 0)) / Math.max(1, age); if (perMin >= 2) out.push('moving fast');
  return out;
}
export async function radar(handles, { maxAgeMin = 120, limit = 10, now = Date.now() } = {}) {
  if (!xConfigured().read) throw new XError(503, 'X_BEARER_TOKEN is not set');
  const hs = [...new Set((handles || []).map(h => String(h).replace(/^@/, '').trim()).filter(handleOk))].slice(0, 30);
  if (!hs.length) throw new XError(400, 'Add a few accounts you learn from first');
  const key = hs.slice().sort().join(','); const hit = cache.get(key); if (hit && now - hit.at < TTL) return hit.v;
  /* batch handles so each query stays under X's 512-character limit */
  const batches = []; let cur = [];
  for (const h of hs) { const next = [...cur, h]; if (`(${next.map(x => 'from:' + x).join(' OR ')}) -is:retweet -is:reply`.length > 480) { batches.push(cur); cur = [h]; } else cur = next; }
  if (cur.length) batches.push(cur);
  const start = new Date(now - maxAgeMin * 60e3).toISOString(), rows = [];
  for (const b of batches) {
    const q = `(${b.map(x => 'from:' + x).join(' OR ')}) -is:retweet -is:reply`;
    const r = await fetch(`${API}/tweets/search/recent?query=${encodeURIComponent(q)}&start_time=${start}&max_results=50&tweet.fields=created_at,public_metrics,author_id,lang&expansions=author_id&user.fields=username,name,public_metrics,profile_image_url,verified`, { headers: { authorization: `Bearer ${process.env.X_BEARER_TOKEN}` } });
    const j = await r.json().catch(() => ({}));
    if (r.status === 429) throw new XError(429, 'X rate limit hit. Try the radar again in a few minutes.');
    if (!r.ok) throw new XError(r.status, j.detail || j.title || `X API ${r.status}`);
    const users = new Map(((j.includes && j.includes.users) || []).map(u => [u.id, u]));
    for (const t of j.data || []) { const u = users.get(t.author_id) || {}; rows.push({ id: t.id, text: t.text, at: t.created_at, handle: u.username, name: u.name, avatar: u.profile_image_url || null, followers: (u.public_metrics && u.public_metrics.followers_count) || 0, likes: (t.public_metrics && t.public_metrics.like_count) || 0, replies: (t.public_metrics && t.public_metrics.reply_count) || 0, reposts: (t.public_metrics && t.public_metrics.retweet_count) || 0, url: `https://x.com/${u.username}/status/${t.id}`, score: scorePost(t, u, now), why: reasons(t, u, now) }); }
  }
  const v = { posts: rows.sort((a, b) => b.score - a.score).slice(0, limit), checked: hs.length, at: new Date(now).toISOString() };
  cache.set(key, { at: now, v }); return v;
}
