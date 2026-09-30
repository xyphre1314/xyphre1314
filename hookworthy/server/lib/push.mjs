/* Web Push without a dependency: VAPID (RFC 8292) and aes128gcm payload encryption (RFC 8291).
   Keys are made on first use and kept in the data folder, so there's nothing to configure. */
import { createECDH, createHmac, createCipheriv, generateKeyPairSync, createPrivateKey, sign, randomBytes } from 'node:crypto';
import { read, write } from './store.mjs';

const b64u = b => Buffer.from(b).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const unb64u = s => Buffer.from(String(s).replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const hmac = (key, data) => createHmac('sha256', key).update(data).digest();

export function vapidKeys() {
  let k = read('vapid', null);
  if (!k) {
    const { privateKey, publicKey } = generateKeyPairSync('ec', { namedCurve: 'prime256v1' });
    const jwk = privateKey.export({ format: 'jwk' }), pub = publicKey.export({ format: 'jwk' });
    k = { jwk, publicKey: b64u(Buffer.concat([Buffer.from([4]), unb64u(pub.x), unb64u(pub.y)])) };
    write('vapid', k);
  }
  return k;
}
export const publicKey = () => vapidKeys().publicKey;

/* RFC 8291: encrypt one record for the browser's key pair */
export function encrypt(payload, { p256dh, auth }, { salt = randomBytes(16), ecdh } = {}) {
  const ua = unb64u(p256dh), secret = unb64u(auth);
  if (ua.length !== 65 || secret.length < 16) throw Object.assign(new Error('Bad push subscription keys'), { status: 400 });
  const as = ecdh || createECDH('prime256v1'); if (!ecdh) as.generateKeys();
  const asPub = as.getPublicKey(), shared = as.computeSecret(ua);
  const ikm = hmac(hmac(secret, shared), Buffer.concat([Buffer.from('WebPush: info\0'), ua, asPub, Buffer.from([1])]));
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.concat([Buffer.from('Content-Encoding: aes128gcm\0'), Buffer.from([1])])).subarray(0, 16);
  const nonce = hmac(prk, Buffer.concat([Buffer.from('Content-Encoding: nonce\0'), Buffer.from([1])])).subarray(0, 12);
  const c = createCipheriv('aes-128-gcm', cek, nonce);
  const body = Buffer.concat([c.update(Buffer.concat([Buffer.from(payload), Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([asPub.length]), asPub, body]);
}

export function vapidHeader(endpoint, subject = process.env.PUBLIC_URL || 'mailto:alerts@hookworthy.com', now = Date.now()) {
  const k = vapidKeys(); const aud = new URL(endpoint).origin;
  const data = `${b64u(JSON.stringify({ typ: 'JWT', alg: 'ES256' }))}.${b64u(JSON.stringify({ aud, exp: Math.floor(now / 1000) + 12 * 3600, sub: /^(mailto:|https:)/.test(subject) ? subject : 'mailto:alerts@hookworthy.com' }))}`;
  const sig = sign('sha256', Buffer.from(data), { key: createPrivateKey({ key: k.jwk, format: 'jwk' }), dsaEncoding: 'ieee-p1363' });
  return `vapid t=${data}.${b64u(sig)}, k=${k.publicKey}`;
}

/* returns 'sent', or 'gone' when the browser unsubscribed (drop it) */
export async function sendPush(sub, payload, { ttl = 3600 } = {}) {
  if (!sub || !/^https:\/\//.test(sub.endpoint || '')) throw Object.assign(new Error('Bad push subscription'), { status: 400 });
  const r = await fetch(sub.endpoint, { method: 'POST', headers: { authorization: vapidHeader(sub.endpoint), 'content-encoding': 'aes128gcm', 'content-type': 'application/octet-stream', ttl: String(ttl), urgency: 'high' }, body: encrypt(JSON.stringify(payload), sub.keys || {}) });
  if (r.status === 404 || r.status === 410) return 'gone';
  if (!r.ok) throw new Error(`Push service said ${r.status}`);
  return 'sent';
}
