/* The posting queue: scheduled threads go out on time to X and LinkedIn.
   Checked every 30 seconds; each item records what happened per platform. */
import { randomUUID } from 'node:crypto';
import { read, write } from './store.mjs';
import * as X from './x.mjs';
import * as LI from './linkedin.mjs';
import * as M from './media.mjs';
import * as BO from './breakout.mjs';

export const list = () => read('queue', []);
/* posts arrive as strings or { text, media: [mediaId] } */
export const normPosts = posts => (posts || []).map(p => typeof p === 'string' ? { text: p.trim(), media: [] } : { text: String((p && p.text) || '').trim(), media: Array.isArray(p && p.media) ? p.media.map(String).slice(0, 4) : [] }).filter(p => p.text || p.media.length);
/* a little clock skew is fine; anything older than this is a mistake, not "post now" */
export const PAST_GRACE_MS = 2 * 60e3;
export function add({ at, posts, platforms } = {}, now = Date.now()) {
  const texts = normPosts(posts);
  if (!texts.length) throw Object.assign(new Error('Nothing to post'), { status: 400 });
  const when = Date.parse(at); if (isNaN(when)) throw Object.assign(new Error('Pick a time'), { status: 400 });
  if (when < now - PAST_GRACE_MS) throw Object.assign(new Error(`That time (${new Date(when).toISOString()}) has already passed. Pick a time in the future, or post it now.`), { status: 400, code: 'past' });
  const plats = Object.keys(platforms || {}).filter(k => platforms[k] && (k === 'x' || k === 'linkedin'));
  if (!plats.length) throw Object.assign(new Error('Pick X or LinkedIn'), { status: 400 });
  const item = { id: randomUUID(), at: new Date(when).toISOString(), posts: texts, platforms: plats, status: 'scheduled', results: {} };
  write('queue', [...list(), item]); return item;
}
/* only a post still waiting can be taken back; one that's posting or done stays on record */
export function remove(id) { const q = list(); const n = q.filter(i => i.id !== id || i.status !== 'scheduled'); if (n.length !== q.length) write('queue', n); return q.length !== n.length; }
export function drop(id) { const it = list().find(i => i.id === id); if (!it) return { removed: false, id, status: 'missing' }; const removed = remove(id); return { removed, id, status: removed ? 'removed' : it.status }; }

export async function publish(item, onResult = () => {}) {
  const results = {};
  for (const p of item.platforms) {
    try {
      const posts = normPosts(item.posts).map(q => ({ text: q.text, media: q.media.map(id => M.getMedia(id)) }));
      if (p === 'x') { results.x = { ok: true, ...(await X.postThread(posts)) }; BO.track({ ids: results.x.ids, posts }); }
      /* LinkedIn has no threads: one post, parts separated by a blank line, every picture attached */
      if (p === 'linkedin') results.linkedin = { ok: true, ...(await LI.post(posts.map(q => q.text).filter(Boolean).join('\n\n'), posts.flatMap(q => q.media))) };
    } catch (e) { results[p] = { ok: false, error: e.message }; }
    onResult(p, results[p]);
  }
  return results;
}
let running = false;
export async function tick(now = Date.now()) {
  if (running) return; running = true;
  try {
    for (const item of list().filter(i => i.status === 'scheduled' && Date.parse(i.at) <= now)) {
      const q0 = list(); const i0 = q0.find(i => i.id === item.id); if (!i0) continue; i0.status = 'posting'; i0.postingAt = new Date(now).toISOString(); write('queue', q0);
      /* each platform's result is saved as it lands, so a crash mid-way never re-posts what already went out */
      const results = await publish(item, (p, r) => { const qn = list(); const it = qn.find(x => x.id === item.id); if (it) { it.results = { ...(it.results || {}), [p]: r }; write('queue', qn); } });
      const q = list(); const i = q.find(x => x.id === item.id); if (!i) continue;
      i.results = { ...(i.results || {}), ...results }; const all = Object.values(i.results);
      delete i.postingAt; i.status = all.every(r => r.ok) ? 'published' : all.some(r => r.ok) ? 'partial' : 'failed'; i.postedAt = new Date().toISOString(); write('queue', q);
    }
  } finally { running = false; }
}
/* after a crash or restart, a post left in 'posting' would sit there forever. Once it's older than
   STALE_MIN it goes back to 'scheduled' (only the platforms that hadn't gone out yet) with a retry count,
   and after MAX_RETRIES interruptions it's marked failed with the reason. */
export const STALE_MIN = +process.env.HW_POSTING_STALE_MIN || 10;
export const MAX_RETRIES = 2;
export function recover(now = Date.now(), { staleMin = STALE_MIN, maxRetries = MAX_RETRIES } = {}) {
  const q = list(); const out = { requeued: [], failed: [] };
  for (const i of q) {
    if (i.status !== 'posting') continue;
    const since = Date.parse(i.postingAt || i.at); if (!isNaN(since) && now - since < staleMin * 60e3) continue;
    const done = Object.entries(i.results || {}).filter(([, r]) => r && r.ok).map(([p]) => p);
    const left = (i.platforms || []).filter(p => !done.includes(p));
    i.retries = (i.retries || 0) + 1; delete i.postingAt;
    if (!left.length) { i.status = 'published'; i.postedAt = i.postedAt || new Date(now).toISOString(); continue; }
    if (i.retries > maxRetries) {
      i.status = done.length ? 'partial' : 'failed';
      i.error = `Interrupted while posting ${i.retries} times (the server restarted mid-post). Check ${left.map(p => p === 'x' ? 'X' : 'LinkedIn').join(' and ')} before trying again.`;
      left.forEach(p => { i.results = { ...(i.results || {}), [p]: { ok: false, error: 'interrupted' } }; });
      out.failed.push(i.id);
    } else { i.status = 'scheduled'; i.platforms = left; i.lastError = 'Interrupted while posting (the server restarted). Retrying.'; out.requeued.push(i.id); }
  }
  if (out.requeued.length || out.failed.length) write('queue', q);
  return out;
}
export function start() {
  const r = recover(); if (r.requeued.length || r.failed.length) console.log(`[scheduler] recovered ${r.requeued.length} interrupted post(s), ${r.failed.length} marked failed`);
  const t = setInterval(() => tick().catch(e => console.error('[scheduler]', e)), 30e3); t.unref(); return t;
}
