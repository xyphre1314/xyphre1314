/* X (Twitter) API v2.
   Reading an account (your posts, the people you learn from) uses the app bearer token (X_BEARER_TOKEN).
   Posting uses OAuth 2.0 with PKCE as the signed-in user (X_CLIENT_ID, optional X_CLIENT_SECRET).
   X doesn't allow scraping; everything here goes through the official API and its rate limits. */
import { createHash, randomBytes } from 'node:crypto';
import { read, write } from './store.mjs';

const API = process.env.X_API_BASE || 'https://api.x.com/2';
const AUTH = 'https://x.com/i/oauth2/authorize';
const SCOPES = 'tweet.read tweet.write users.read offline.access';
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
  const me = await xfetch('/users/me', { token: tok.access });
  write('x-token', { ...tok, handle: me.data.username, id: me.data.id });
  return me.data.username;
}
export function connectedUser() { const t = read('x-token', null); return t && t.handle; }
async function userToken() {
  const t = read('x-token', null); if (!t) throw new XError(401, 'Connect X first');
  if (Date.now() < t.exp) return t.access;
  const n = await tokenRequest({ grant_type: 'refresh_token', refresh_token: t.refresh });
  write('x-token', { ...t, ...n, refresh: n.refresh || t.refresh }); return n.access;
}
/* post a thread: each post replies to the one before it */
export async function postThread(texts) {
  const token = await userToken(); const ids = []; let prev = null;
  for (const text of texts) {
    const j = await xfetch('/tweets', { token, method: 'POST', body: { text, ...(prev ? { reply: { in_reply_to_tweet_id: prev } } : {}) } });
    prev = j.data.id; ids.push(prev);
  }
  const h = connectedUser();
  return { ids, url: `https://x.com/${h}/status/${ids[0]}` };
}
