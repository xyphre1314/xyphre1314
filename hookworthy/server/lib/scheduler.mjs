/* The posting queue: scheduled threads go out on time to X and LinkedIn.
   Checked every 30 seconds; each item records what happened per platform. */
import { randomUUID } from 'node:crypto';
import { read, write } from './store.mjs';
import * as X from './x.mjs';
import * as LI from './linkedin.mjs';

export const list = () => read('queue', []);
export function add({ at, posts, platforms }) {
  const texts = (posts || []).map(t => String(t || '').trim()).filter(Boolean);
  if (!texts.length) throw Object.assign(new Error('Nothing to post'), { status: 400 });
  const when = Date.parse(at); if (isNaN(when)) throw Object.assign(new Error('Pick a time'), { status: 400 });
  const plats = Object.keys(platforms || {}).filter(k => platforms[k] && (k === 'x' || k === 'linkedin'));
  if (!plats.length) throw Object.assign(new Error('Pick X or LinkedIn'), { status: 400 });
  const item = { id: randomUUID(), at: new Date(when).toISOString(), posts: texts, platforms: plats, status: 'scheduled', results: {} };
  write('queue', [...list(), item]); return item;
}
export function remove(id) { const q = list(); const n = q.filter(i => i.id !== id || i.status !== 'scheduled'); write('queue', n); return q.length !== n.length; }

export async function publish(item) {
  const results = {};
  for (const p of item.platforms) {
    try {
      if (p === 'x') results.x = { ok: true, ...(await X.postThread(item.posts)) };
      /* LinkedIn has no threads: one post, parts separated by a blank line */
      if (p === 'linkedin') results.linkedin = { ok: true, ...(await LI.post(item.posts.join('\n\n'))) };
    } catch (e) { results[p] = { ok: false, error: e.message }; }
  }
  return results;
}
let running = false;
export async function tick(now = Date.now()) {
  if (running) return; running = true;
  try {
    for (const item of list().filter(i => i.status === 'scheduled' && Date.parse(i.at) <= now)) {
      const q0 = list(); const i0 = q0.find(i => i.id === item.id); if (!i0) continue; i0.status = 'posting'; write('queue', q0);
      const results = await publish(item);
      const q = list(); const i = q.find(x => x.id === item.id); if (!i) continue;
      i.results = results; i.status = Object.values(results).every(r => r.ok) ? 'published' : Object.values(results).some(r => r.ok) ? 'partial' : 'failed'; i.postedAt = new Date().toISOString(); write('queue', q);
    }
  } finally { running = false; }
}
export function start() { const t = setInterval(() => tick().catch(e => console.error('[scheduler]', e)), 30e3); t.unref(); return t; }
