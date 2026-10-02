/* Auto-plug: per post and opt-in. When a post you published crosses the line you picked (25, 50 or 100 likes,
   or the same 3× pace that sends a breakout alert), one reply goes under it from your account, exactly once.
   Watched for 48 hours after it goes out. One batched X lookup covers every post being watched, every POLL_MIN
   minutes, and a rate limit backs the whole watcher off. Nothing connected means nothing is ever sent. */
import { createRequire } from 'node:module';
import { read, write } from './store.mjs';
import * as X from './x.mjs';
import * as BO from './breakout.mjs';

const core = createRequire(import.meta.url)('../../core.js');
export const AT = [25, 50, 100, 'pace'];
export const WINDOW_H = 48;
export const POLL_MIN = +process.env.HW_PLUG_POLL_MIN || 10;
export const BACKOFF_MIN = 15;
const bad = msg => Object.assign(new Error(msg), { status: 400, code: 'plug' });
const list = () => read('plugs', []);
const save = l => write('plugs', l);
const iso = t => new Date(t).toISOString();
const eng = m => (m.likes || 0) + (m.reposts || 0) * 2 + (m.replies || 0) * 3;

/* what the app sends: { on, text, at }. Off (or missing) is null; on has to be a reply that can really go out */
export function normPlug(p) {
  if (!p || !p.on) return null;
  const text = String(p.text || '').trim(), at = p.at === 'pace' ? 'pace' : +p.at;
  if (!text) throw bad('Write the reply first');
  if (/\[[^\]\n]*\]/.test(text)) throw bad('Fill the [brackets] in the reply first');
  if (core.xLength(text) > 280) throw bad(`The reply is ${core.xLength(text) - 280} characters over 280`);
  if (!AT.includes(at)) throw bad('Pick when it replies: at 25, 50 or 100 likes, or when it beats your usual pace');
  return { on: true, text, at };
}

export function watch({ tweetId, queueId = null, plug, at = Date.now() }) {
  const p = normPlug(plug); const id = String(tweetId || '').replace(/^x-/, '');
  if (!p || !/^\d+$/.test(id)) return null;
  const l = list(), had = l.find(w => w.id === id); if (had) return had;
  const w = { id, queueId, text: p.text, at: p.at, postedAt: at, status: 'watching', checks: 0, likes: 0 };
  save([...l, w].slice(-500)); return w;
}
export const all = () => list();
export const get = id => list().find(w => w.id === String(id).replace(/^x-/, '')) || null;
/* turning it off only stops a plug that hasn't gone out */
export function cancel(id) {
  const l = list(), w = l.find(x => x.id === String(id).replace(/^x-/, ''));
  if (!w) return { cancelled: false, status: 'missing' };
  if (w.status !== 'watching') return { cancelled: false, status: w.status };
  w.status = 'off'; save(l); mirror([w]); return { cancelled: true, status: 'off' };
}

/* has it crossed the line? likes for a number; for 'pace', the breakout rule (3× your usual, at least 12 engagements) */
export function crossed(w, m, now = Date.now()) {
  if (w.at !== 'pace') return (m.likes || 0) >= w.at;
  const u = BO.usualAt(Math.max(1, Math.round((now - w.postedAt) / 60e3))); if (!u) return false;
  const e = eng(m); return e >= BO.FLOOR && e / u.v >= BO.PACE;
}

/* the queue item it came from gets the outcome too, so GET /api/queue shows it */
function mirror(ws) {
  const q = read('queue', []); let n = 0;
  for (const w of ws) { const it = w.queueId && q.find(i => i.id === w.queueId); if (!it || !it.plug) continue;
    it.plug = { ...it.plug, status: w.status, likes: w.likes, ...(w.plugSentAt ? { plugSentAt: w.plugSentAt, replyId: w.replyId } : {}), ...(w.error ? { error: w.error } : {}) }; n++; }
  if (n) write('queue', q);
}

let backoffUntil = 0;
export const _reset = () => { backoffUntil = 0; };
export async function tick({ now = Date.now(), pollMin = POLL_MIN } = {}) {
  const l = list(), touched = new Set(), sent = [];
  for (const w of l) {
    /* a reply that was mid-send when the server stopped is never retried: X may already have it */
    if (w.status === 'sending' && now - (w.sendingAt || 0) > 10 * 60e3) { w.status = 'failed'; w.error = 'Interrupted while replying (the server restarted). Check X before posting it yourself.'; delete w.sendingAt; touched.add(w); }
    if (w.status === 'watching' && now - w.postedAt > WINDOW_H * 3600e3) { w.status = 'expired'; w.endedAt = iso(now); w.error = `Didn’t reach ${w.at === 'pace' ? 'your usual pace × 3' : `${w.at} likes`} in ${WINDOW_H} hours, so nothing was sent.`; touched.add(w); }
  }
  const done = () => { if (touched.size) { save(l); mirror([...touched]); } return sent; };
  /* nothing connected: a plug never posts, and nothing pretends it did */
  if (!X.connectedUser() || now < backoffUntil) return done();
  const due = l.filter(w => w.status === 'watching' && (!w.lastCheck || now - w.lastCheck >= pollMin * 60e3)).slice(0, 100);
  if (!due.length) return done();
  let got;
  try { got = await X.metrics(due.map(w => w.id), { asUser: !X.xConfigured().read }); }
  catch (e) { if (e.status === 429) backoffUntil = now + BACKOFF_MIN * 60e3; return done(); }
  for (const w of due) {
    w.lastCheck = now; w.checks = (w.checks || 0) + 1; touched.add(w);
    const m = got.find(p => p.id === 'x-' + w.id);
    if (!m) { w.status = 'failed'; w.error = 'The post was deleted or isn’t visible any more, so the reply wasn’t sent.'; continue; }
    w.likes = m.likes || 0;
    if (!crossed(w, m, now)) continue;
    /* saved as 'sending' before the call, so a crash can never send it twice */
    w.status = 'sending'; w.sendingAt = now; save(l);
    try { const r = await X.reply(w.id, w.text); w.status = 'sent'; w.plugSentAt = iso(now); w.replyId = r.id; w.url = r.url; sent.push(w); }
    catch (e) {
      delete w.sendingAt;
      /* a rate limit isn't a failure: X refused before posting, so it tries again after the back-off */
      if (e.status === 429) { w.status = 'watching'; backoffUntil = now + BACKOFF_MIN * 60e3; break; }
      w.status = 'failed'; w.error = `The reply didn’t go out: ${e.message}`;
    }
    delete w.sendingAt;
  }
  return done();
}
