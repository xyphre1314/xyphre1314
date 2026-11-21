/* LinkedIn: sign in with OpenID Connect, post with the Posts API (w_member_social).
   Needs a LinkedIn app with "Sign In with LinkedIn using OpenID Connect" and "Share on LinkedIn". */
import { randomBytes } from 'node:crypto';
import { read, write } from './store.mjs';

const VERSION = process.env.LINKEDIN_VERSION || '202509';
export const liConfigured = () => !!(process.env.LINKEDIN_CLIENT_ID && process.env.LINKEDIN_CLIENT_SECRET);
export class LIError extends Error { constructor(status, message) { super(message); this.status = status; } }

export function authStart(redirectUri) {
  const state = randomBytes(16).toString('hex'); const pend = read('li-pending', {}); pend[state] = { redirectUri, at: Date.now() }; write('li-pending', pend);
  const q = new URLSearchParams({ response_type: 'code', client_id: process.env.LINKEDIN_CLIENT_ID, redirect_uri: redirectUri, scope: 'openid profile w_member_social', state });
  return `https://www.linkedin.com/oauth/v2/authorization?${q}`;
}
export async function authCallback(code, state) {
  const pend = read('li-pending', {}); const p = pend[state]; delete pend[state]; write('li-pending', pend);
  if (!p || Date.now() - p.at > 15 * 60e3) throw new LIError(400, 'That sign-in link expired. Start again.');
  const r = await fetch('https://www.linkedin.com/oauth/v2/accessToken', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: p.redirectUri, client_id: process.env.LINKEDIN_CLIENT_ID, client_secret: process.env.LINKEDIN_CLIENT_SECRET }) });
  const j = await r.json().catch(() => ({})); if (!r.ok) throw new LIError(r.status, j.error_description || 'LinkedIn token exchange failed');
  const u = await (await fetch('https://api.linkedin.com/v2/userinfo', { headers: { authorization: `Bearer ${j.access_token}` } })).json();
  write('li-token', { access: j.access_token, exp: Date.now() + (j.expires_in || 5184000) * 1000, sub: u.sub, name: u.name });
  return u.name;
}
export function connectedUser() { const t = read('li-token', null); return t && Date.now() < t.exp ? t.name : null; }
const HDR = t => ({ authorization: `Bearer ${t.access}`, 'LinkedIn-Version': VERSION, 'X-Restli-Protocol-Version': '2.0.0' });
/* images (GIFs too): initialize an upload, PUT the bytes, then reference the image URN in the post */
export async function uploadImage({ buf, mime }, t) {
  const r = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', { method: 'POST', headers: { ...HDR(t), 'content-type': 'application/json' }, body: JSON.stringify({ initializeUploadRequest: { owner: `urn:li:person:${t.sub}` } }) });
  const j = await r.json().catch(() => ({})); if (!r.ok || !j.value) throw new LIError(r.status || 502, j.message || 'LinkedIn didn’t start the upload');
  const up = await fetch(j.value.uploadUrl, { method: 'PUT', headers: { authorization: `Bearer ${t.access}`, 'content-type': mime }, body: buf });
  if (!up.ok) throw new LIError(up.status, `LinkedIn upload failed (${up.status})`);
  return j.value.image;
}
export async function post(text, media = []) {
  const t = read('li-token', null); if (!t || Date.now() > t.exp) throw new LIError(401, 'Connect LinkedIn first');
  const imgs = []; for (const m of media.slice(0, 9)) imgs.push({ id: await uploadImage(m, t), altText: String(m.alt || '').slice(0, 4086) });
  const content = imgs.length === 1 ? { content: { media: { id: imgs[0].id, ...(imgs[0].altText ? { altText: imgs[0].altText } : {}) } } } : imgs.length > 1 ? { content: { multiImage: { images: imgs } } } : {};
  const r = await fetch('https://api.linkedin.com/rest/posts', { method: 'POST', headers: { ...HDR(t), 'content-type': 'application/json' },
    body: JSON.stringify({ author: `urn:li:person:${t.sub}`, commentary: text, visibility: 'PUBLIC', distribution: { feedDistribution: 'MAIN_FEED', targetEntities: [], thirdPartyDistributionChannels: [] }, lifecycleState: 'PUBLISHED', isReshareDisabledByAuthor: false, ...content }) });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new LIError(r.status, j.message || `LinkedIn ${r.status}`); }
  const id = r.headers.get('x-restli-id'); return { id, url: id ? `https://www.linkedin.com/feed/update/${id}` : null };
}
