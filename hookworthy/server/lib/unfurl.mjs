/* Link cards: GET /api/unfurl?url= reads a page's Open Graph and Twitter-card tags (title, description, image,
   site name) so the composer can show the card a platform would.
   Safe by construction:
   - http(s) only, on ports 80 and 443
   - every hop, redirects included, resolves through a lookup that refuses private, loopback, link-local, CGNAT,
     multicast and reserved addresses, and the socket connects to that vetted address, so DNS can't be swapped
     between the check and the connection. IP literals are checked the same way
   - 5 seconds for the whole job, at most 4 redirects, HTML only, and only the first 512 KB of a page is read
   - the image comes back as a data URL (PNG, JPEG, GIF or WebP, 300 KB at most), so it shows under a strict CSP
   - results are cached: 6 hours for a page that answered, 10 minutes for one that didn't
   YouTube and X posts go through their public oEmbed endpoints, which answer with the title or the post's text. */
import http from 'node:http';
import https from 'node:https';
import dns from 'node:dns';
import net from 'node:net';
import { createRequire } from 'node:module';

const core = createRequire(import.meta.url)('../../core.js');
export class UnfurlError extends Error { constructor(status, code, message) { super(message); this.status = status; this.code = code; } }
const UA = 'Mozilla/5.0 (compatible; HookworthyLinkCard/1.0; +https://hookworthy.app)';
const LIMITS = { html: 512 * 1024, json: 64 * 1024, image: 300 * 1024, ms: 5000, hops: 4 };
const IMG_TYPES = { 'image/png': 'png', 'image/jpeg': 'jpeg', 'image/jpg': 'jpeg', 'image/gif': 'gif', 'image/webp': 'webp' };

/* ---------- addresses we never connect to ---------- */
export function privateIp(ip) {
  ip = String(ip || '').replace(/^\[|\]$/g, '').split('%')[0];
  if (net.isIPv4(ip)) {
    const [a, b, c] = ip.split('.').map(Number);
    return a === 0 || a === 10 || a === 127 || a >= 224 /* multicast, reserved, broadcast */
      || (a === 100 && b >= 64 && b <= 127) /* CGNAT */ || (a === 169 && b === 254) /* link-local, cloud metadata */
      || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168)
      || (a === 192 && b === 0 && (c === 0 || c === 2)) || (a === 198 && (b === 18 || b === 19)) || (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113);
  }
  if (net.isIPv6(ip)) {
    const x = ip.toLowerCase();
    const v4 = x.match(/^(?:0{0,4}:){0,5}(?:ffff:)?(\d+\.\d+\.\d+\.\d+)$/); if (v4) return privateIp(v4[1]);
    const hx = x.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/); if (hx) { const h = parseInt(hx[1], 16), l = parseInt(hx[2], 16); return privateIp(`${h >> 8}.${h & 255}.${l >> 8}.${l & 255}`); }
    if (x === '::' || x === '::1' || x.startsWith('::')) return true; /* unspecified, loopback, IPv4-compatible */
    return /^(f[cd]|fe[89ab]|ff)/.test(x) /* unique local, link-local, multicast */ || x.startsWith('2001:db8:') || x.startsWith('64:ff9b:') /* NAT64 can point anywhere */ || x.startsWith('2002:') /* 6to4 likewise */ || x.startsWith('100::');
  }
  return true; /* not an address at all: refuse */
}

/* the lookup the socket itself uses: anything private and the connection never opens */
const vettedLookup = allowIp => (host, opts, cb) => {
  if (typeof opts === 'function') { cb = opts; opts = {}; }
  dns.lookup(host, { all: true, verbatim: true }, (err, addrs) => {
    if (err) return cb(err);
    const bad = addrs.filter(a => privateIp(a.address) && !allowIp(a.address));
    if (!addrs.length || bad.length) return cb(Object.assign(new Error(`${host} points at a private address`), { code: 'EBLOCKED' }));
    if (opts && opts.all) return cb(null, addrs);
    cb(null, addrs[0].address, addrs[0].family);
  });
};

/* one guarded GET: follows redirects (each hop checked again), stops reading at `max` bytes */
function guardedGet(raw, { accept, max, deadline, allowIp, anyPort, hops = LIMITS.hops, truncate = false }) {
  return new Promise((resolve, reject) => {
    let u; try { u = new URL(raw); } catch { return reject(new UnfurlError(400, 'bad_url', 'That isn’t a web address')); }
    if (!/^https?:$/.test(u.protocol)) return reject(new UnfurlError(400, 'bad_url', 'Only http and https links get a card'));
    if (u.username || u.password) return reject(new UnfurlError(400, 'bad_url', 'Links with a password in them don’t get a card'));
    if (!anyPort && u.port && u.port !== '80' && u.port !== '443') return reject(new UnfurlError(403, 'blocked', 'Only the usual web ports get a card'));
    const host = u.hostname.replace(/^\[|\]$/g, '');
    if (net.isIP(host) && privateIp(host) && !allowIp(host)) return reject(new UnfurlError(403, 'blocked', 'That address is private'));
    if (/^(localhost|.*\.localhost|.*\.local|.*\.internal)$/i.test(host) && !allowIp('127.0.0.1')) return reject(new UnfurlError(403, 'blocked', 'That address is private'));
    const left = deadline - Date.now(); if (left <= 0) return reject(new UnfurlError(504, 'timeout', 'The page took too long'));
    const mod = u.protocol === 'https:' ? https : http;
    const req = mod.request(u, { method: 'GET', lookup: vettedLookup(allowIp), headers: { 'user-agent': UA, accept, 'accept-language': 'en;q=1, *;q=0.5', 'accept-encoding': 'identity' } }, res => {
      const st = res.statusCode || 0, loc = res.headers.location;
      if (st >= 300 && st < 400 && loc) {
        res.resume(); clearTimeout(timer);
        if (hops <= 0) return reject(new UnfurlError(502, 'unreachable', 'Too many redirects'));
        let next; try { next = new URL(loc, u).href; } catch { return reject(new UnfurlError(502, 'unreachable', 'A bad redirect')); }
        return guardedGet(next, { accept, max, deadline, allowIp, anyPort, hops: hops - 1, truncate }).then(resolve, reject);
      }
      const len = +res.headers['content-length'] || 0;
      if (len > max && !truncate) { res.destroy(); clearTimeout(timer); return reject(new UnfurlError(413, 'too_big', 'Too big to read')); }
      const chunks = []; let n = 0, done = false;
      const finish = () => { if (done) return; done = true; clearTimeout(timer); resolve({ status: st, type: String(res.headers['content-type'] || '').toLowerCase(), body: Buffer.concat(chunks), url: u.href }); };
      res.on('data', c => { if (done) return; n += c.length; if (n > max) { if (!truncate) { done = true; res.destroy(); clearTimeout(timer); return reject(new UnfurlError(413, 'too_big', 'Too big to read')); } chunks.push(c.subarray(0, c.length - (n - max))); res.destroy(); return finish(); } chunks.push(c); });
      res.on('end', finish); res.on('error', e => { if (!done) { done = true; clearTimeout(timer); reject(new UnfurlError(502, 'unreachable', e.message)); } });
    });
    const timer = setTimeout(() => { req.destroy(new UnfurlError(504, 'timeout', 'The page took too long')); }, left);
    req.on('error', e => { clearTimeout(timer); reject(e instanceof UnfurlError ? e : e.code === 'EBLOCKED' ? new UnfurlError(403, 'blocked', 'That address is private') : new UnfurlError(502, 'unreachable', e.code === 'ENOTFOUND' ? 'That site doesn’t exist' : 'Couldn’t reach that site')); });
    req.end();
  });
}

/* ---------- reading the page ---------- */
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', middot: '·', copy: '©', reg: '®', trade: '™', bull: '•' };
export const decodeEntities = s => String(s || '').replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => { if (e[0] === '#') { const cp = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10); return cp > 0 && cp < 0x110000 ? String.fromCodePoint(cp) : m; } return NAMED[e.toLowerCase()] ?? m; });
const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : s; };
function textOf(buf, type) {
  const head = buf.subarray(0, 4096).toString('latin1');
  const cs = (type.match(/charset=([\w-]+)/i) || head.match(/<meta[^>]+charset=["']?([\w-]+)/i) || [])[1];
  if (cs && !/^utf-?8$/i.test(cs)) { try { return new TextDecoder(cs).decode(buf); } catch { /* unknown label: fall through */ } }
  return buf.toString('utf8');
}
export function parseMeta(html, base) {
  const head = String(html).slice(0, LIMITS.html).split(/<\/head>/i)[0];
  const meta = {};
  for (const m of head.matchAll(/<meta\b[^>]*>/gi)) {
    const tag = m[0]; const attr = n => { const r = tag.match(new RegExp(`\\s${n}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'>]+))`, 'i')); return r ? (r[1] ?? r[2] ?? r[3]) : null; };
    const k = (attr('property') || attr('name') || attr('itemprop') || '').toLowerCase().trim(), v = attr('content');
    if (k && v != null && !(k in meta)) meta[k] = decodeEntities(v).trim();
  }
  const tt = head.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const abs = v => { if (!v) return null; try { const x = new URL(v, base); return /^https?:$/.test(x.protocol) ? x.href : null; } catch { return null; } };
  return {
    title: clip(meta['og:title'] || meta['twitter:title'] || (tt ? decodeEntities(tt[1]) : ''), 200),
    description: clip(meta['og:description'] || meta['twitter:description'] || meta.description || '', 300),
    image: abs(meta['og:image:secure_url'] || meta['og:image'] || meta['og:image:url'] || meta['twitter:image'] || meta['twitter:image:src'] || meta.image),
    imageAlt: clip(meta['og:image:alt'] || meta['twitter:image:alt'] || '', 200),
    site: clip(meta['og:site_name'] || meta['application-name'] || '', 60),
    card: (meta['twitter:card'] || '').toLowerCase()
  };
}
/* only real raster images, checked by their first bytes as well as their type */
function sniff(buf) {
  if (buf.length > 8 && buf[0] === 0x89 && buf.toString('latin1', 1, 4) === 'PNG') return 'image/png';
  if (buf.length > 3 && buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return 'image/jpeg';
  if (buf.length > 6 && /^GIF8[79]a$/.test(buf.toString('latin1', 0, 6))) return 'image/gif';
  if (buf.length > 12 && buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  return null;
}
async function imageData(src, o) {
  if (!src) return { image: null };
  try {
    const r = await guardedGet(src, { ...o, accept: 'image/webp,image/png,image/jpeg,image/gif;q=0.9', max: LIMITS.image });
    const type = sniff(r.body);
    if (r.status !== 200 || !type || !IMG_TYPES[r.type.split(';')[0].trim()] && !/^application\/octet-stream/.test(r.type)) return { image: null, imageSkipped: 'not an image we show' };
    return { image: `data:${type};base64,${r.body.toString('base64')}` };
  } catch (e) { return { image: null, imageSkipped: e.code === 'too_big' ? 'too big' : e.code || 'failed' }; }
}

/* ---------- the cache: by link, with a cap on bytes as well as entries ---------- */
const cache = new Map(); let cacheBytes = 0; const inflight = new Map();
const CACHE = { ok: 6 * 3600e3, miss: 10 * 60e3, bytes: 24 * 1024 * 1024, n: 400 };
const keyOf = u => { try { const x = new URL(u); x.hash = ''; return x.href; } catch { return String(u); } };
function remember(k, v, ok) {
  const bytes = JSON.stringify(v).length; if (bytes > CACHE.bytes / 4) return;
  const old = cache.get(k); if (old) { cacheBytes -= old.bytes; cache.delete(k); }
  cache.set(k, { at: Date.now(), ttl: ok ? CACHE.ok : CACHE.miss, v, bytes }); cacheBytes += bytes;
  while (cache.size > CACHE.n || cacheBytes > CACHE.bytes) { const [k0, e0] = cache.entries().next().value; cache.delete(k0); cacheBytes -= e0.bytes; }
}
export function clearUnfurlCache() { cache.clear(); cacheBytes = 0; inflight.clear(); }

/* ---------- the one entry point ---------- */
export async function unfurl(raw, opts = {}) {
  const s = String(raw || '').trim(); if (!s || s.length > 2048) throw new UnfurlError(400, 'bad_url', 'Add a link');
  const g = core.LINKS.guess(s); if (!g) throw new UnfurlError(400, 'bad_url', 'That isn’t a web address');
  const envAllow = process.env.HW_UNFURL_ALLOW_PRIVATE === '1';
  const o = { allowIp: opts.allowIp || (() => envAllow), anyPort: opts.anyPort ?? envAllow, deadline: Date.now() + (opts.ms || LIMITS.ms) };
  const k = keyOf(g.url); const hit = cache.get(k);
  if (hit && Date.now() - hit.at < hit.ttl && !opts.fresh) { cache.delete(k); cache.set(k, hit); if (hit.v.error) throw new UnfurlError(hit.v.status, hit.v.code, hit.v.error); return { ...hit.v, cached: true }; }
  if (inflight.has(k)) return inflight.get(k);
  const job = (async () => {
    try { const v = await read(g, o, opts); remember(k, v, true); return v; }
    catch (e) { const err = e instanceof UnfurlError ? e : new UnfurlError(502, 'unreachable', e.message || 'Couldn’t read that page'); if (err.code !== 'bad_url') remember(k, { error: err.message, code: err.code, status: err.status }, false); throw err; }
    finally { inflight.delete(k); }
  })();
  inflight.set(k, job); return job;
}
async function read(g, o, opts) {
  const base = { url: g.url, kind: g.kind, site: g.site || null, domain: g.domain };
  const oe = { youtube: opts.oembed && opts.oembed.youtube || process.env.HW_OEMBED_YOUTUBE || 'https://www.youtube.com/oembed', x: opts.oembed && opts.oembed.x || process.env.HW_OEMBED_X || 'https://publish.twitter.com/oembed' };
  const json = async u => { const r = await guardedGet(u, { ...o, accept: 'application/json', max: LIMITS.json }); if (r.status !== 200) throw new UnfurlError(502, 'unreachable', `It answered ${r.status}`); try { return JSON.parse(r.body.toString('utf8')); } catch { throw new UnfurlError(502, 'unreachable', 'An odd answer'); } };
  if (g.kind === 'video' && g.site === 'YouTube') {
    const j = await json(`${oe.youtube}?format=json&url=${encodeURIComponent(`https://www.youtube.com/watch?v=${g.id}`)}`);
    const img = await imageData(j.thumbnail_url || null, o);
    return { ...base, final: g.url, title: clip(j.title || g.title, 200), description: '', author: clip(j.author_name || '', 80), site: 'YouTube', ...img };
  }
  if (g.kind === 'post' && g.site === 'X') {
    const j = await json(`${oe.x}?omit_script=1&dnt=true&url=${encodeURIComponent(`https://x.com/${g.handle}/status/${g.id}`)}`);
    const p = String(j.html || '').match(/<p\b[^>]*>([\s\S]*?)<\/p>/i);
    const text = p ? decodeEntities(p[1].replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '')).replace(/[ \t]+\n/g, '\n').trim() : '';
    const handle = (String(j.author_url || '').match(/(?:x|twitter)\.com\/(\w{1,15})/i) || [])[1] || g.handle;
    return { ...base, final: g.url, title: clip(j.author_name || `@${handle}`, 80), author: clip(j.author_name || '', 80), handle, text: text.slice(0, 600), description: '', image: null, site: 'X' };
  }
  const r = await guardedGet(g.url, { ...o, accept: 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.1', max: LIMITS.html, truncate: true });
  if (r.status >= 400) throw new UnfurlError(502, 'unreachable', `The page answered ${r.status}`);
  if (!/^(text\/html|application\/xhtml\+xml)/.test(r.type)) throw new UnfurlError(415, 'not_html', 'Not a web page, so there’s no card to show');
  const m = parseMeta(textOf(r.body, r.type), r.url);
  const img = await imageData(m.image, o);
  return { ...base, final: r.url, title: m.title || g.title, description: m.description, site: m.site || g.site || null, imageAlt: m.imageAlt || '', large: m.card ? m.card === 'summary_large_image' || m.card === 'player' : null, ...img };
}
