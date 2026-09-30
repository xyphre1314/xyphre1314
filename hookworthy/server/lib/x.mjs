/* X (Twitter) API v2.
   Reading an account (your posts, the people you learn from) uses the app bearer token (X_BEARER_TOKEN).
   Posting uses OAuth 2.0 with PKCE as the signed-in user (X_CLIENT_ID, optional X_CLIENT_SECRET).
   X doesn't allow scraping; everything here goes through the official API and its rate limits. */
import { createHash, randomBytes } from 'node:crypto';
import { read, write } from './store.mjs';

const API = process.env.X_API_BASE || 'https://api.x.com/2';
const AUTH = 'https://x.com/i/oauth2/authorize';
const SCOPES = 'tweet.read tweet.write users.read offline.access media.write';
export const xConfigured = () => ({ read: !!process.env.X_BEARER_TOKEN, post: !!process.env.X_CLIENT_ID });

export class XError extends Error { constructor(status, message) { super(message); this.status = status; } }
async function xfetch(path, { token = process.env.X_BEARER_TOKEN, method = 'GET', body } = {}) {
  if (!token) throw new XError(503, 'X_BEARER_TOKEN is not set');
  const r = await fetch(path.startsWith('http') ? path : API + path, { method, headers: { authorization: `Bearer ${token}`, ...(body ? { 'content-type': 'application/json' } : {}) }, body: body ? JSON.stringify(body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (r.status === 429) throw new XError(429, `X rate limit hit; resets ${r.headers.get('x-rate-limit-reset') ? new Date(+r.headers.get('x-rate-limit-reset') * 1000).toISOString() : 'soon'}`);
  if (!r.ok) throw new XError(r.status, (j.detail || j.title || (j.errors && j.errors[0] && j.errors[0].message) || `X API ${r.status}`));
  return j;
}

export async function userByHandle(handle) {
  const h = String(handle || '').replace(/^@/, '').trim();
  if (!/^\w{1,15}$/.test(h)) throw new XError(400, 'That doesn’t look like an X handle');
  const j = await xfetch(`/users/by/username/${h}?user.fields=name,public_metrics,profile_image_url`);
  if (!j.data) throw new XError(404, `No X account @${h}`);
  return j.data;
}
const toPost = (t, handle) => ({ id: 'x-' + t.id, text: t.text, at: t.created_at, likes: t.public_metrics?.like_count || 0, reposts: (t.public_metrics?.retweet_count || 0) + (t.public_metrics?.quote_count || 0), replies: t.public_metrics?.reply_count || 0, views: t.public_metrics?.impression_count || 0, src: 'x-api', url: `https://x.com/${handle}/status/${t.id}`, handle });

/* up to `max` original posts (no replies or reposts), newest first */
export async function postsFor(handle, max = 800) {
  const u = await userByHandle(handle); const out = []; let next = '';
  while (out.length < max) {
    const j = await xfetch(`/users/${u.id}/tweets?max_results=100&exclude=replies,retweets&tweet.fields=created_at,public_metrics${next ? `&pagination_token=${next}` : ''}`);
    (j.data || []).forEach(t => out.push(toPost(t, u.username)));
    next = j.meta && j.meta.next_token; if (!next || !(j.data || []).length) break;
  }
  return { account: { handle: u.username, name: u.name, id: u.id, followers: u.public_metrics?.followers_count }, posts: out.slice(0, max) };
}

/* the people you learn from: each account's best recent posts */
export async function peopleTop(handles, per = 5) {
  const out = [];
  for (const h of handles.slice(0, 12)) {
    try { const { account, posts } = await postsFor(h, 100); const eng = p => p.likes + p.reposts * 2 + p.replies * 3; out.push({ handle: account.handle, posts: posts.sort((a, b) => eng(b) - eng(a)).slice(0, per) }); }
    catch (e) { out.push({ handle: h, error: e.message, posts: [] }); }
  }
  return out;
}

export async function metrics(ids) {
  const clean = ids.map(i => String(i).replace(/^x-/, '')).filter(i => /^\d+$/.test(i)).slice(0, 100);
  if (!clean.length) return [];
  const j = await xfetch(`/tweets?ids=${clean.join(',')}&tweet.fields=public_metrics,created_at`);
  return (j.data || []).map(t => toPost(t));
}

/* ---- OAuth 2.0 PKCE (posting as you) ---- */
const b64url = b => b.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
export function authStart(redirectUri) {
  const verifier = b64url(randomBytes(32)), state = b64url(randomBytes(16));
  const challenge = b64url(createHash('sha256').update(verifier).digest());
  const pend = read('x-pending', {}); pend[state] = { verifier, redirectUri, at: Date.now() }; write('x-pending', pend);
  const q = new URLSearchParams({ response_type: 'code', client_id: process.env.X_CLIENT_ID, redirect_uri: redirectUri, scope: SCOPES, state, code_challenge: challenge, code_challenge_method: 'S256' });
  return `${AUTH}?${q}`;
}
async function tokenRequest(params) {
  const headers = { 'content-type': 'application/x-www-form-urlencoded' };
  if (process.env.X_CLIENT_SECRET) headers.authorization = 'Basic ' + Buffer.from(`${process.env.X_CLIENT_ID}:${process.env.X_CLIENT_SECRET}`).toString('base64');
  const r = await fetch(`${API}/oauth2/token`, { method: 'POST', headers, body: new URLSearchParams({ client_id: process.env.X_CLIENT_ID, ...params }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new XError(r.status, j.error_description || j.error || 'X token exchange failed');
  return { access: j.access_token, refresh: j.refresh_token, exp: Date.now() + (j.expires_in || 7200) * 1000 - 60e3 };
}
export async function authCallback(code, state) {
  const pend = read('x-pending', {}); const p = pend[state]; delete pend[state]; write('x-pending', pend);
  if (!p || Date.now() - p.at > 15 * 60e3) throw new XError(400, 'That sign-in link expired. Start again.');
  const tok = await tokenRequest({ grant_type: 'authorization_code', code, redirect_uri: p.redirectUri, code_verifier: p.verifier });
  const me = await xfetch(`/users/me?${ME_FIELDS}`, { token: tok.access });
  write('x-token', { ...tok, handle: me.data.username, id: me.data.id, tier: tierOf(me.data), tierAt: Date.now() });
  return me.data.username;
}
export function connectedUser() { const t = read('x-token', null); return t && t.handle; }
/* Is this account on a paid X plan? Paid plans (Basic, Premium, Premium+) can post up to 25,000 characters;
   everyone else gets 280 per post. subscription_type is read from the signed-in user's own lookup; verified_type
   "blue" is the fallback signal when X doesn't return it. */
const ME_FIELDS = 'user.fields=verified,verified_type,subscription_type,public_metrics';
export const LONG_POST = 25000, SHORT_POST = 280;
export function tierOf(u = {}) {
  const sub = String(u.subscription_type || '').toLowerCase(), vt = String(u.verified_type || '').toLowerCase();
  const paid = ['basic', 'premium', 'premiumplus'].includes(sub) || (!sub && vt === 'blue');
  return { paid, plan: sub && sub !== 'none' ? u.subscription_type : paid ? 'Premium' : 'Free', source: sub ? 'subscription_type' : vt ? 'verified_type' : 'none', limit: paid ? LONG_POST : SHORT_POST };
}
export function connectedTier() { const t = read('x-token', null); return t && t.tier ? { ...t.tier, handle: t.handle, checkedAt: t.tierAt } : null; }
/* re-check (plans change): the signed-in user's own profile */
export async function refreshTier() {
  const token = await userToken(); const me = await xfetch(`/users/me?${ME_FIELDS}`, { token });
  const t = read('x-token', null); const tier = tierOf(me.data); write('x-token', { ...t, tier, tierAt: Date.now() }); return { ...tier, handle: me.data.username, checkedAt: Date.now() };
}
async function userToken() {
  const t = read('x-token', null); if (!t) throw new XError(401, 'Connect X first');
  if (Date.now() < t.exp) return t.access;
  const n = await tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh });
  write('x-token', { ...t, ...n, refresh: n.refresh || t.refresh }); return n.access;
}
/* ---- media upload (v2, chunked): initialize → append → finalize → wait while X processes GIFs ---- */
const CHUNK = 4 * 1024 * 1024;
async function xform(path, token, form) {
  const r = await fetch(API + path, { method: 'POST', headers: { authorization: `Bearer ${token}` }, body: form });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new XError(r.status, (j.detail || j.title || (j.errors && j.errors[0] && j.errors[0].message) || `X media ${r.status}`)); return j;
}
export async function uploadMedia({ buf, mime, kind, alt }, token) {
  token = token || await userToken();
  const init = await xfetch('/media/upload/initialize', { token, method: 'POST', body: { media_type: mime, total_bytes: buf.length, media_category: kind === 'gif' ? 'tweet_gif' : 'tweet_image' } });
  const id = init.data && init.data.id; if (!id) throw new XError(502, 'X didn’t start the upload');
  for (let i = 0, seg = 0; i < buf.length; i += CHUNK, seg++) { const f = new FormData(); f.append('media', new Blob([buf.subarray(i, i + CHUNK)], { type: mime }), 'media'); f.append('segment_index', String(seg)); await xform(`/media/upload/${id}/append`, token, f); }
  let fin = await xfetch(`/media/upload/${id}/finalize`, { token, method: 'POST' });
  for (let tries = 0; fin.data && fin.data.processing_info && ['pending', 'in_progress'].includes(fin.data.processing_info.state) && tries < 30; tries++) {
    await new Promise(r => setTimeout(r, Math.min(10, fin.data.processing_info.check_after_secs || 1) * (process.env.HW_FAST_TESTS ? 1 : 1000)));
    fin = await xfetch(`/media/upload?media_id=${id}&command=STATUS`, { token });
  }
  if (fin.data && fin.data.processing_info && fin.data.processing_info.state === 'failed') throw new XError(422, (fin.data.processing_info.error && fin.data.processing_info.error.message) || 'X couldn’t process that file');
  if (alt) await xfetch('/media/metadata', { token, method: 'POST', body: { id, metadata: { alt_text: { text: String(alt).slice(0, 1000) } } } }).catch(() => null);
  return id;
}
/* post a thread: each post replies to the one before it. posts: strings, or { text, media: [{ buf, mime, kind, alt }] } */
export async function postThread(posts) {
  const token = await userToken(); const ids = []; let prev = null;
  for (const p of posts) {
    const text = typeof p === 'string' ? p : p.text; const media = typeof p === 'string' ? [] : (p.media || []);
    const media_ids = []; for (const m of media.slice(0, 4)) media_ids.push(await uploadMedia(m, token));
    const j = await xfetch('/tweets', { token, method: 'POST', body: { text, ...(media_ids.length ? { media: { media_ids } } : {}), ...(prev ? { reply: { in_reply_to_tweet_id: prev } } : {}) } });
    prev = j.data.id; ids.push(prev);
  }
  const h = connectedUser();
  return { ids, url: `https://x.com/${h}/status/${ids[0]}` };
}

/* ---- the first hour: replies worth answering, ranked ---- */
export async function replies(tweetId) {
  const id = String(tweetId || '').replace(/^x-/, ''); if (!/^\d+$/.test(id)) throw new XError(400, 'Need the post id');
  const j = await xfetch(`/tweets/search/recent?query=${encodeURIComponent(`conversation_id:${id} is:reply`)}&max_results=100&tweet.fields=author_id,created_at,public_metrics,in_reply_to_user_id&expansions=author_id&user.fields=username,name,public_metrics,verified`);
  const users = new Map(((j.includes && j.includes.users) || []).map(u => [u.id, u]));
  const me = connectedUser();
  return (j.data || []).map(t => { const u = users.get(t.author_id) || {}; const followers = u.public_metrics?.followers_count || 0; const q = /\?\s*$/.test(t.text) || /\?/.test(t.text);
    const score = Math.log10(followers + 1) * 2 + (q ? 3 : 0) + (t.public_metrics?.like_count || 0) * .5 + (t.public_metrics?.reply_count || 0) + (u.verified ? 1.5 : 0);
    return { id: t.id, text: t.text.replace(/^(@\w+\s+)+/, ''), handle: u.username, name: u.name, followers, verified: !!u.verified, question: q, likes: t.public_metrics?.like_count || 0, at: t.created_at, score };
  }).filter(r => r.handle !== me).sort((a, b) => b.score - a.score).slice(0, 12);
}
export async function reply(inReplyTo, text) {
  const token = await userToken(); const id = String(inReplyTo).replace(/^x-/, '');
  const j = await xfetch('/tweets', { token, method: 'POST', body: { text, reply: { in_reply_to_tweet_id: id } } });
  return { id: j.data.id, url: `https://x.com/${connectedUser()}/status/${j.data.id}` };
}
