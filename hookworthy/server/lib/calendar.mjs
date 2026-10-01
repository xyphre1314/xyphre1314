/* Your calendar, read-only: the secret iCal link from Google, Outlook or Apple, fetched here so the
   browser isn't blocked by CORS. Only busy times leave this file; the link itself stays on the server. */
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { createRequire } from 'node:module';
import { read, write } from './store.mjs';
const core = createRequire(import.meta.url)('../../core.js');

export class CalError extends Error { constructor(status, message) { super(message); this.status = status; } }
const PRIVATE = [/^127\./, /^10\./, /^192\.168\./, /^172\.(1[6-9]|2\d|3[01])\./, /^169\.254\./, /^0\./, /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, /^::1$/, /^f[cd][0-9a-f]{2}:/i, /^fe80:/i, /^::ffff:(127|10|192\.168|169\.254)\./i];
export async function safeUrl(raw) {
  let u; try { u = new URL(String(raw || '').trim().replace(/^webcals?:\/\//i, 'https://')); } catch { throw new CalError(400, 'That doesn’t look like a calendar link'); }
  if (u.protocol !== 'https:') throw new CalError(400, 'Use the https (or webcal) link your calendar gives you');
  if (isIP(u.hostname) || /^(localhost|.*\.local|.*\.internal)$/i.test(u.hostname)) throw new CalError(400, 'That link points somewhere private');
  if (!process.env.HW_FAST_TESTS) { const addrs = await lookup(u.hostname, { all: true }).catch(() => []); if (!addrs.length) throw new CalError(400, 'Couldn’t find that calendar’s server'); if (addrs.some(a => PRIVATE.some(re => re.test(a.address)))) throw new CalError(400, 'That link points somewhere private'); }
  return u;
}
let cache = { at: 0, busy: null };
export const connected = () => !!read('calendar', {}).url;
export async function setLink(url) {
  if (!url) { write('calendar', {}); cache = { at: 0, busy: null }; return { connected: false }; }
  const u = await safeUrl(url); const busy = await fetchBusy(u.href); write('calendar', { url: u.href, at: Date.now() }); cache = { at: Date.now(), busy };
  return { connected: true, events: busy.length };
}
async function fetchBusy(href) {
  /* follow up to 3 redirects by hand, checking each hop is still a public https host */
  let r = null, url = href;
  for (let hop = 0; hop < 4; hop++) { r = await fetch(url, { redirect: 'manual', headers: { accept: 'text/calendar, text/plain' } }).catch(() => null); if (!r || r.status < 300 || r.status >= 400 || !r.headers.get('location')) break; url = (await safeUrl(new URL(r.headers.get('location'), url).href)).href; }
  if (!r || !r.ok) throw new CalError(502, `Your calendar didn’t answer${r ? ` (${r.status})` : ''}. Check the link is the secret iCal address.`);
  if (+r.headers.get('content-length') > 8e6) throw new CalError(413, 'That calendar is too big to read');
  const text = await r.text(); if (!/BEGIN:VCALENDAR/.test(text)) throw new CalError(422, 'That link isn’t an iCal calendar');
  return core.parseICS(text, { from: Date.now() - 864e5, to: Date.now() + 21 * 864e5 });
}
/* busy times for the next three weeks, refreshed every 15 minutes */
export async function busy({ titles = true } = {}) {
  const c = read('calendar', {}); if (!c.url) return { connected: false, busy: [] };
  if (!cache.busy || Date.now() - cache.at > 15 * 60e3) { cache = { at: Date.now(), busy: await fetchBusy(c.url) }; }
  return { connected: true, at: cache.at, busy: cache.busy.map(b => ({ start: b.start, end: b.end, title: titles ? b.title : 'Busy' })) };
}
