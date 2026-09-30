/* Review links with comments, the Sunday digest, and encrypted sync. */
import { randomBytes } from 'node:crypto';
import { read, write } from './store.mjs';

export class HWError extends Error { constructor(status, message) { super(message); this.status = status; } }
const clean = (s, n) => String(s || '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').slice(0, n);

/* ---- review links: share a draft, collect comments per post ---- */
export function createReview({ tweets, author }) {
  const posts = (tweets || []).map(t => clean(typeof t === 'string' ? t : t.text, 4000)).filter(Boolean).slice(0, 30);
  if (!posts.length) throw new HWError(400, 'Nothing to review yet');
  const id = randomBytes(9).toString('base64url'); const all = read('reviews', {});
  all[id] = { id, posts, author: { name: clean(author && author.name, 80), handle: clean(author && author.handle, 30), pic: /^assets\/[\w/.-]+\.(jpg|png|webp)$/.test(author && author.pic || '') ? author.pic : '' }, comments: [], at: Date.now() };
  write('reviews', all); return all[id];
}
export function updateReview(id, { tweets }) { const all = read('reviews', {}); const r = all[id]; if (!r) throw new HWError(404, 'No such review'); r.posts = (tweets || []).map(t => clean(typeof t === 'string' ? t : t.text, 4000)).filter(Boolean).slice(0, 30); r.updated = Date.now(); write('reviews', all); return r; }
export function getReview(id) { const r = read('reviews', {})[id]; if (!r) throw new HWError(404, 'This review link doesn’t exist or was deleted'); return r; }
export function addComment(id, { name, text, post }) {
  const all = read('reviews', {}); const r = all[id]; if (!r) throw new HWError(404, 'No such review');
  const t = clean(text, 1000).trim(); if (!t) throw new HWError(400, 'Write a comment first');
  if (r.comments.length >= 300) throw new HWError(429, 'This review has enough comments');
  const c = { id: randomBytes(6).toString('base64url'), name: clean(name, 60).trim() || 'Someone', text: t, post: Math.max(0, Math.min(r.posts.length - 1, +post || 0)), at: Date.now() };
  r.comments.push(c); write('reviews', all); return c;
}

/* ---- Sunday digest: the app hands over its latest note; Sunday morning it goes out ---- */
export function subscribeDigest({ email, digest }) {
  const e = clean(email, 200).trim(); if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw new HWError(400, 'That email doesn’t look right');
  const subs = read('digest', {}); subs[e] = { email: e, digest: digest || (subs[e] && subs[e].digest) || null, at: Date.now(), last: subs[e] && subs[e].last }; write('digest', subs); return { ok: true };
}
export function unsubscribeDigest(email) { const subs = read('digest', {}); delete subs[String(email || '').trim()]; write('digest', subs); return { ok: true }; }
export function digestHTML(d) {
  const esc = s => String(s || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  return `<div style="font-family:Georgia,serif;max-width:560px;margin:auto;padding:24px;background:#FEFDF1;color:#1A1A1A"><h1 style="font-weight:400;font-size:28px;margin:0 0 12px">${esc(d.headline)}</h1>${d.best ? `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5"><b>Best post:</b> “${esc(d.best)}”<br>${esc(d.why_best)}</p>` : ''}<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5"><b>Try next week:</b> ${esc(d.try_next)}</p>${d.first_line ? `<p style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;background:#EADCFF;padding:12px 14px;border-radius:10px">Monday’s first line: “${esc(d.first_line)}”</p>` : ''}<p style="font-family:Arial,sans-serif;font-size:12px;color:#65645C">Hookworthy · reply STOP to unsubscribe</p></div>`;
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
