/* Review links with comments, the Sunday digest, and encrypted sync. */
import { randomBytes } from 'node:crypto';
import { read, write } from './store.mjs';

export class HWError extends Error { constructor(status, message) { super(message); this.status = status; } }
const clean = (s, n) => String(s || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, n);

/* ---- review links: share a draft, collect comments anchored to words, a post or a picture ----
   A comment is { id, who, name, text, post, quote, start, prefix, suffix, el, parent, at, resolved }.
   `quote` + `prefix`/`suffix` let the app find the words again after the draft is edited; `el` is
   'post' or 'img:N' for a comment on a whole post or one picture; `parent` makes it a reply. */
const MEDIA_MAX = 600 * 1024, MEDIA_TOTAL = 3 * 1024 * 1024;
function cleanPosts(tweets) { return (tweets || []).map(t => clean(typeof t === 'string' ? t : t && t.text, 4000)).filter(Boolean).slice(0, 30); }
/* pictures ride along only as small data URLs or the app's own assets, so a link never points somewhere else */
function cleanMedia(media, n) {
  let total = 0;
  return Array.from({ length: n }, (_, i) => (Array.isArray(media && media[i]) ? media[i] : []).slice(0, 4).map(m => {
    const src = String(m && m.src || ''); const ok = /^assets\/[\w/.-]+\.(jpg|png|webp|gif)$/.test(src) || (/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/.test(src) && src.length <= MEDIA_MAX);
    if (!ok || (total += src.length) > MEDIA_TOTAL) return { src: '', alt: clean(m && m.alt, 400) };
    return { src, alt: clean(m && m.alt, 400) };
  }));
}
const cleanAuthor = a => ({ name: clean(a && a.name, 80), handle: clean(a && a.handle, 30), pic: /^assets\/[\w/.-]+\.(jpg|png|webp)$/.test(a && a.pic || '') ? a.pic : '' });
export function createReview({ tweets, author, media, public: pub = true }) {
  const posts = cleanPosts(tweets);
  if (!posts.length) throw new HWError(400, 'Nothing to review yet');
  const id = randomBytes(9).toString('base64url'); const all = read('reviews', {});
  all[id] = { id, posts, media: cleanMedia(media, posts.length), author: cleanAuthor(author), public: pub !== false, comments: [], at: Date.now() };
  write('reviews', all); return all[id];
}
export function updateReview(id, { tweets, media, author, public: pub }) {
  const all = read('reviews', {}); const r = all[id]; if (!r) throw new HWError(404, 'No such review');
  if (tweets !== undefined) { const posts = cleanPosts(tweets); if (!posts.length) throw new HWError(400, 'Nothing to review yet'); r.posts = posts; r.media = cleanMedia(media, posts.length); }
  if (author) r.author = cleanAuthor(author);
  if (pub !== undefined) r.public = !!pub;
  r.updated = Date.now(); write('reviews', all); return r;
}
const OFF = 'This link is switched off. Ask for a new one.';
/* a link that's switched off reads as gone to everyone but the person who shared it */
export function getReview(id, { owner = false } = {}) {
  const r = read('reviews', {})[id]; if (!r) throw new HWError(404, 'This review link doesn’t exist or was deleted');
  if (r.public === false && !owner) throw new HWError(404, OFF);
  return { ...r, public: r.public !== false, media: r.media || r.posts.map(() => []) };
}
export function addComment(id, { name, who, text, post, quote, start, prefix, suffix, el, parent }, { owner = false } = {}) {
  const all = read('reviews', {}); const r = all[id]; if (!r) throw new HWError(404, 'No such review');
  if (r.public === false && !owner) throw new HWError(404, OFF);
  const t = clean(text, 1000).trim(); if (!t) throw new HWError(400, 'Write a comment first');
  if (r.comments.length >= 300) throw new HWError(429, 'This review has enough comments');
  const nm = clean(name, 60).trim();
  const c = { id: randomBytes(6).toString('base64url'), who: owner ? 'owner' : (String(who || '').match(/^[\w-]{4,40}$/) || [''])[0] || 'n-' + (nm.toLowerCase().replace(/[^\w]+/g, '-').slice(0, 30) || 'someone'), name: owner ? (r.author.name || 'Author') : nm || 'Someone', text: t, at: Date.now() };
  if (parent) {
    const root = r.comments.find(x => x.id === parent); if (!root) throw new HWError(404, 'That comment is gone');
    c.parent = root.parent || root.id; c.post = root.post;
  } else {
    c.post = Math.max(0, Math.min(r.posts.length - 1, +post || 0));
    const q = clean(quote, 500);
    if (q.trim()) { c.quote = q; c.start = Math.max(0, Math.min(40000, +start || 0)); c.prefix = clean(prefix, 32); c.suffix = clean(suffix, 32); }
    else c.el = /^img:[0-3]$/.test(el) ? el : 'post';
  }
  r.comments.push(c); write('reviews', all); return c;
}
/* anyone with the link can resolve a thread or open it again, like a shared doc */
export function resolveComment(id, cid, { resolved, name }, { owner = false } = {}) {
  const all = read('reviews', {}); const r = all[id]; if (!r) throw new HWError(404, 'No such review');
  if (r.public === false && !owner) throw new HWError(404, OFF);
  const c = r.comments.find(x => x.id === cid); if (!c) throw new HWError(404, 'That comment is gone');
  if (c.parent) throw new HWError(400, 'Resolve the thread, not a reply');
  c.resolved = !!resolved;
  if (c.resolved) { c.resolvedAt = Date.now(); c.resolvedBy = owner ? (r.author.name || 'Author') : clean(name, 60).trim() || 'Someone'; } else { delete c.resolvedAt; delete c.resolvedBy; }
  write('reviews', all); return c;
}

/* ---- Sunday digest: the app hands over its latest note; Sunday morning it goes out ---- */
export function subscribeDigest({ email, digest }) {
  const e = clean(email, 200).trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new HWError(400, 'That email doesn’t look right');
  const subs = read('digest', {}); subs[e] = { email: e, digest: digest || (subs[e] && subs[e].digest) || null, at: Date.now(), last: subs[e] && subs[e].last }; write('digest', subs); return { ok: true };
}
export function unsubscribeDigest(email) { const subs = read('digest', {}); delete subs[String(email || '').trim()]; write('digest', subs); return { ok: true }; }
export function digestHTML(d) {
  const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;padding:24px;background:#FEFDF1;color:#1A1A1A"><h1 style="font-weight:400;font-size:28px;margin:0 0 12px">${esc(d.headline)}</h1>${d.best ? `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5"><b>Best post:</b> “${esc(d.best)}”<br>${esc(d.why_best)}</p>` : ''}<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5"><b>Try next week:</b> ${esc(d.try_next)}</p>${d.first_line ? `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;background:#DDE5FF;padding:12px 14px;border-radius:10px">Monday’s first line: “${esc(d.first_line)}”</p>` : ''}<p style="font-family:Arial,sans-serif;font-size:12px;color:#65645C">Hookworthy · reply STOP to unsubscribe</p></div>`;
}
export async function sendDigests(now = new Date(), send = sendEmail) {
  if (now.getDay() !== 0 || now.getHours() < 9) return 0;
  const subs = read('digest', {}); let n = 0; const today = now.toISOString().slice(0, 10);
  for (const s of Object.values(subs)) { if (!s.digest || s.last === today) continue; try { await send(s.email, s.digest.subject || 'Your week on Hookworthy', digestHTML(s.digest)); s.last = today; n++; } catch (e) { console.error('[digest]', e.message); } }
  write('digest', subs); return n;
}
export async function sendEmail(to, subject, html) {
  if (!process.env.RESEND_API_KEY) { console.log(`[digest] would email ${to}: ${subject} (set RESEND_API_KEY to send)`); return { logged: true }; }
  const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'content-type': 'application/json' }, body: JSON.stringify({ from: process.env.DIGEST_FROM || 'Hookworthy <digest@hookworthy.com>', to, subject, html }) });
  if (!r.ok) throw new Error(`Resend ${r.status}`); return r.json();
}

/* ---- encrypted sync: the browser encrypts with a key only it knows; this stores ciphertext ---- */
export function putSync(id, body) {
  if (!/^[a-f0-9]{32,64}$/.test(id)) throw new HWError(400, 'Bad sync id');
  const { iv, ct, v } = body || {}; if (typeof iv !== 'string' || typeof ct !== 'string' || ct.length > 4e6) throw new HWError(400, 'Bad sync payload');
  const all = read('sync', {}); const cur = all[id];
  if (cur && v && cur.v > v) throw new HWError(409, 'A newer copy is already synced');
  all[id] = { iv, ct, v: v || Date.now() }; write('sync', all); return { ok: true, v: all[id].v };
}
export function getSync(id) { const r = read('sync', {})[id]; if (!r) throw new HWError(404, 'Nothing synced with that code yet'); return r; }
