/* Breakout alert: for the first hour after a post goes out, check its numbers at a few set minutes.
   If it's running at 3× your usual pace, ping you (phone push, email, and the open app) with the first
   replies already drafted, while replying still helps the post travel.
   One batched X lookup covers every post being watched, so a post costs about 9 reads. */
import { read, write } from './store.mjs';
import * as X from './x.mjs';
import * as P from './push.mjs';

const CHECKS = [5, 10, 15, 20, 25, 30, 40, 50, 60];            /* minutes after posting */
export const WINDOW = { from: 8, to: 45 };                       /* when an alert is still worth sending */
export const PACE = 3, FLOOR = 12;                               /* 3× your usual, and at least 12 engagements */
const eng = m => (m.likes || 0) + (m.reposts || 0) * 2 + (m.replies || 0) * 3;
/* share of a day's engagement a typical post has by minute t (used until your own posts teach it) */
const frac = t => (t / (t + 90)) / (1440 / (1440 + 90));

const state = () => read('breakout', { settings: { on: false, email: '', median: 0, voice: null, subs: [] }, watch: [], alerts: [] });
const save = s => write('breakout', s);
export const configured = () => X.xConfigured().read;

export function getSettings() { const s = state().settings; return { on: s.on, email: s.email, median: s.median, devices: s.subs.length, hasVoice: !!s.voice }; }
export function setSettings(b = {}) {
  const s = state(), st = s.settings;
  if ('on' in b) st.on = !!b.on;
  if ('email' in b) { const e = String(b.email || '').trim().slice(0, 200); if (e && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) throw Object.assign(new Error('That email doesn’t look right'), { status: 400 }); st.email = e; }
  if ('median' in b) st.median = Math.max(0, Math.min(1e7, +b.median || 0));
  if ('voice' in b) { const j = b.voice && typeof b.voice === 'object' ? JSON.stringify(b.voice) : ''; st.voice = j && j.length <= 8000 ? JSON.parse(j) : null; }
  if (b.subscribe && b.subscribe.endpoint) { if (!/^https:\/\//.test(b.subscribe.endpoint)) throw Object.assign(new Error('Bad push subscription'), { status: 400 }); st.subs = [...st.subs.filter(x => x.endpoint !== b.subscribe.endpoint), { endpoint: b.subscribe.endpoint, keys: b.subscribe.keys || {}, at: Date.now() }].slice(-5); }
  if (b.unsubscribe) st.subs = st.subs.filter(x => x.endpoint !== b.unsubscribe);
  save(s); return getSettings();
}

/* your usual engagement at minute t: from your own watched posts once there are 5, else your median × a typical curve */
export function usualAt(t, s = state()) {
  const seen = s.watch.map(w => (w.checks || []).find(c => Math.abs(c.min - t) <= 3)).filter(Boolean).map(c => c.eng).sort((a, b) => a - b);
  if (seen.length >= 5) return { v: Math.max(1, seen[seen.length >> 1]), from: 'posts', n: seen.length };
  if (s.settings.median > 0) return { v: Math.max(1, s.settings.median * frac(t)), from: 'history' };
  return null;
}

export function track({ ids, posts, at = Date.now() }) {
  if (!ids || !ids[0]) return; const s = state();
  if (s.watch.some(w => w.id === String(ids[0]))) return;
  s.watch.push({ id: String(ids[0]), text: String((posts && posts[0] && (posts[0].text || posts[0])) || ''), posts: (posts || []).map(p => typeof p === 'string' ? p : p.text).slice(0, 25), at, checks: [], alerted: false });
  s.watch = s.watch.slice(-200); save(s);
}

export function alertHTML(a, url) {
  const esc = t => String(t || '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
  const reps = (a.replies || []).slice(0, 3).map(r => `<div style="margin:0 0 12px;padding:12px 14px;border-radius:10px;background:#F3EFE3"><p style="margin:0 0 6px;font-size:13px;color:#65645C">@${esc(r.handle)}: ${esc(r.text)}</p>${r.draft ? `<p style="margin:0;font-size:15px"><b>You:</b> ${esc(r.draft)}</p>` : ''}</div>`).join('');
  return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;padding:24px;background:#FEFDF1;color:#1A1A1A"><h1 style="font-family:Georgia,serif;font-weight:400;font-size:26px;margin:0 0 10px">This one’s taking off.</h1><p style="font-size:15px;line-height:1.5;margin:0 0 6px">“${esc(a.text.split('\n')[0].slice(0, 180))}”</p><p style="font-size:15px;line-height:1.5"><b>${a.pace}× your usual pace</b>: ${a.likes} likes, ${a.reposts} reposts and ${a.replyCount} replies in ${a.min} minutes. Replies in the next half hour help it travel.</p>${reps ? `<p style="font-size:13px;color:#65645C;margin:18px 0 8px">First replies, with answers drafted in your voice:</p>${reps}` : ''}<p><a href="${esc(url)}" style="display:inline-block;background:#1A1A1A;color:#FEFDF1;padding:10px 16px;border-radius:99px;text-decoration:none">Answer them</a></p></div>`;
}

/* one pass: which posts are due a check, one X lookup for all of them, alerts for any breakout */
export async function tick({ now = Date.now(), draft = null, email = null, publicUrl = '' } = {}) {
  const s = state(); if (!s.settings.on || !configured()) return [];
  s.watch = s.watch.filter(w => now - w.at < 36 * 3600e3);
  const lastMin = w => Math.max(0, ...(w.checks || []).map(c => c.min));
  const due = s.watch.filter(w => { const age = (now - w.at) / 60e3; const next = CHECKS.find(c => c > lastMin(w)); return next != null && age >= next && age <= 75; });
  if (!due.length) { save(s); return []; }
  const got = await X.metrics(due.map(w => w.id));
  const fired = [];
  for (const w of due) {
    const m = got.find(p => p.id === 'x-' + w.id || p.id === w.id); if (!m) continue;
    const age = (now - w.at) / 60e3, min = [...CHECKS].reverse().find(c => c <= age);
    w.checks.push({ min, eng: eng(m), likes: m.likes, reposts: m.reposts, replies: m.replies, views: m.views });
    const others = { ...s, watch: s.watch.filter(x => x.id !== w.id) }, usual = usualAt(min, others);
    if (w.alerted || !usual || min < WINDOW.from || min > WINDOW.to) continue;
    const e = eng(m), pace = e / usual.v;
    if (e < FLOOR || pace < PACE) continue;
    let replies = [];
    try { replies = (await X.replies(w.id)).slice(0, 5); } catch { /* the alert still goes */ }
    if (draft && replies.length) { try { const d = await draft({ post: w.posts.join('\n\n') || w.text, replies, voice: s.settings.voice }); (Array.isArray(d) ? d : []).forEach(x => { const r = replies[+x.id]; if (r && x.reply) r.draft = String(x.reply).slice(0, 280); }); } catch { /* drafts are a bonus */ } }
    const a = { id: w.id, at: now, text: w.text, posts: w.posts, min, pace: +pace.toFixed(1), likes: m.likes, reposts: m.reposts, replyCount: m.replies, views: m.views, usual: Math.round(usual.v), usualFrom: usual.from, checks: w.checks, curve: CHECKS.map(c => ({ min: c, v: Math.round((usualAt(c, others) || { v: 0 }).v) })), replies, url: `https://x.com/i/status/${w.id}`, sent: {} };
    w.alerted = true; s.alerts = [a, ...s.alerts].slice(0, 20); fired.push(a);
  }
  save(s);
  for (const a of fired) await deliver(a, { email, publicUrl });
  return fired;
}

async function deliver(a, { email, publicUrl }) {
  const s = state(), open = `${publicUrl}/?breakout=${a.id}#queue`, sent = {};
  const payload = { title: `Taking off: ${a.pace}× your usual`, body: `“${a.text.split('\n')[0].slice(0, 90)}” · ${a.likes} likes, ${a.replyCount} replies in ${a.min} min. Answer the first replies now.`, url: open, tag: 'breakout-' + a.id };
  for (const sub of [...s.settings.subs]) {
    try { const r = await P.sendPush(sub, payload); if (r === 'gone') { s.settings.subs = s.settings.subs.filter(x => x.endpoint !== sub.endpoint); } else sent.push = (sent.push || 0) + 1; } catch (e) { console.error('[breakout push]', e.message); }
  }
  if (s.settings.email && email) { try { const r = await email(s.settings.email, `${a.test ? 'Test: ' : ''}Taking off: ${a.pace}× your usual pace`, alertHTML(a, open)); sent.email = r && r.logged ? 'logged' : true; } catch (e) { console.error('[breakout email]', e.message); } }
  a.sent = sent; const x = s.alerts.find(z => z.id === a.id); if (x) x.sent = sent; save(s);
}
/* "Send me a test": the same push and email a real breakout sends, marked as a test */
export function sampleAlert(now = Date.now()) {
  return { id: 'test', test: true, at: now, text: 'A test from Hookworthy: this is what a breakout alert looks like.', posts: [], min: 18, pace: 3.3, likes: 41, reposts: 6, replyCount: 9, views: 2300, usual: 24, usualFrom: 'history', checks: [{ min: 5, eng: 9 }, { min: 10, eng: 24 }, { min: 15, eng: 47 }, { min: 18, eng: 80 }], curve: CHECKS.map(c => ({ min: c, v: Math.round(24 * frac(c) / frac(18)) })), replies: [{ handle: 'someone', text: 'How long did this take you?', draft: 'About six weeks. Most of it went on the pricing page.' }], url: '', sent: {} };
}
export const deliverTest = (a, o) => deliver(a, o);

export const alerts = (since = 0) => state().alerts.filter(a => a.at > since);
/* the open app's live pill: what the watcher has seen so far for one post (no extra X calls) */
export function live(id) { const s = state(), w = s.watch.find(x => x.id === String(id)); if (!w) return { checks: [], curve: [], alert: null, watching: false };
  return { checks: w.checks || [], curve: CHECKS.map(c => ({ min: c, v: Math.round((usualAt(c, { ...s, watch: s.watch.filter(x => x.id !== w.id) }) || { v: 0 }).v) })), alert: s.alerts.find(a => a.id === w.id) || null, watching: s.settings.on }; }
export function status() { const s = state(); return { ...getSettings(), configured: configured(), vapidKey: P.publicKey(), watching: s.watch.filter(w => Date.now() - w.at < 3600e3).length, usual: usualAt(20, s), alerts: s.alerts.slice(0, 5) }; }
