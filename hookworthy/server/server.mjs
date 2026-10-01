/* Hookworthy server: serves the app and gives it Claude, X, LinkedIn, Typefully and a posting queue.
   node server.mjs  →  http://localhost:8787
   Config in server/.env (see .env.example). Nothing here is required: every missing key just turns
   that feature off, and the app falls back to what it can do in the browser. */
import { createServer } from 'node:http';
import { gzipSync, brotliCompressSync, constants as Z } from 'node:zlib';
import { readFileSync, existsSync, statSync, createReadStream } from 'node:fs';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
const ZIP = new Map();
/* .env without a dependency */
const envFile = join(here, '.env');
if (existsSync(envFile)) for (const line of readFileSync(envFile, 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
if (!process.env.HW_DATA_DIR) process.env.HW_DATA_DIR = join(here, 'data');

const core = createRequire(import.meta.url)('../core.js');
const AI = await import('./lib/ai.mjs');
const X = await import('./lib/x.mjs');
const G = await import('./lib/gifs.mjs');
const M = await import('./lib/media.mjs');
const RD = await import('./lib/radar.mjs');
const LI = await import('./lib/linkedin.mjs');
const TF = await import('./lib/typefully.mjs');
const Q = await import('./lib/scheduler.mjs');
const E = await import('./lib/extras.mjs');
const BO = await import('./lib/breakout.mjs');
const VO = await import('./lib/votes.mjs');

const ROOT = normalize(join(here, '..'));
const PORT = +process.env.PORT || 8787, HOST = process.env.HOST || '127.0.0.1';
const PUBLIC_URL = (process.env.PUBLIC_URL || `http://localhost:${PORT}`).replace(/\/$/, '');
const TOKEN = process.env.HOOKWORTHY_TOKEN || '';
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };

/* per-IP token bucket for Claude calls: 30 a minute */
const buckets = new Map();
function allow(ip, cost = 1) { const now = Date.now(); const b = buckets.get(ip) || { t: 30, at: now }; b.t = Math.min(30, b.t + (now - b.at) / 2000); b.at = now; if (b.t < cost) { buckets.set(ip, b); return false; } b.t -= cost; buckets.set(ip, b); return true; }

const send = (res, status, body, headers = {}) => { res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }); res.end(JSON.stringify(body)); };
const fail = (res, e) => send(res, e.status || 500, { error: e.message || 'Something went wrong', code: e.code || 'error' });
async function body(req, limit = 5 * 1024 * 1024) { let n = 0; const chunks = []; for await (const c of req) { n += c.length; if (n > limit) throw Object.assign(new Error('Request too large'), { status: 413 }); chunks.push(c); } try { return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'); } catch { throw Object.assign(new Error('Send JSON'), { status: 400 }); } }
const authed = req => !TOKEN || req.headers.authorization === `Bearer ${TOKEN}` || (req.headers.cookie || '').split(/;\s*/).includes(`hw=${TOKEN}`);

export const health = () => ({ ok: true, review: true, sync: true, digest: true, email: !!process.env.RESEND_API_KEY, replies: X.xConfigured().read, ai: AI.hasKey(), models: AI.MODELS, x: X.xConfigured().read, xPost: X.xConfigured().post, xUser: X.connectedUser() || null, xTier: X.connectedTier(), gifs: G.gifsConfigured(), media: true, radar: X.xConfigured().read, breakout: BO.configured(), vote: true, linkedin: LI.liConfigured(), liUser: LI.connectedUser() || null, typefully: true, version: 1 });

/* drafts for a breakout's first replies, in your voice (only when Claude is on) */
export const breakoutDrafts = AI.hasKey() ? async ({ post, replies, voice }) => (await AI.complete({ ...core.prompts.replies({ post, replies, voice }), json: true })).data : null;

export async function handle(req, res) {
  const url = new URL(req.url, 'http://x'); const p = url.pathname; const ip = req.socket.remoteAddress || 'local';
  try {
    if (p === '/api/health') return send(res, 200, { ...health(), locked: !!TOKEN && !authed(req) });
    if (p === '/login') { if (!TOKEN || url.searchParams.get('token') !== TOKEN) return send(res, 401, { error: 'Wrong or missing token' }); res.writeHead(302, { 'set-cookie': `hw=${TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${PUBLIC_URL.startsWith('https') ? '; Secure' : ''}`, location: '/#write' }); return res.end(); }
    if (p.startsWith('/api/') && !/^\/api\/review\/[\w-]{6,20}(\/comments)?$/.test(p) && !/^\/api\/vote\/[\w-]{8,20}$/.test(p) && !authed(req)) return send(res, 401, { error: 'Missing HOOKWORTHY_TOKEN', code: 'auth' });

    /* Claude */
    if (p === '/api/ai' && req.method === 'POST') {
      const b = await body(req, 24 * 1024 * 1024); const docs = Array.isArray(b.docs) ? b.docs : [];
      if (!allow(ip, (b.tier === 'complex' ? 5 : 1) + docs.length * 2)) return send(res, 429, { error: 'Slow down a little', code: 'rate_limited' });
      const r = await AI.complete({ prompt: b.prompt, tier: b.tier, json: !!b.json, docs });
      return send(res, 200, { text: r.text, data: r.data, model: r.model, truncated: r.truncated });
    }

    /* imports */
    if (p === '/api/x/posts') { const r = await X.postsFor(url.searchParams.get('handle'), Math.min(3200, +url.searchParams.get('max') || 800)); return send(res, 200, r); }
    if (p === '/api/x/people') { const hs = (url.searchParams.get('handles') || '').split(',').map(s => s.trim()).filter(Boolean); if (!hs.length) return send(res, 400, { error: 'Add some handles' }); return send(res, 200, { people: await X.peopleTop(hs) }); }
    if (p === '/api/x/metrics') { const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean); return send(res, 200, { posts: await X.metrics(ids) }); }
    if (p === '/api/typefully/import' && req.method === 'POST') { const b = await body(req); const drafts = await TF.importDrafts(b.key); return send(res, 200, { posts: core.parseTypefully(drafts) }); }

    /* first hour */
    if (p === '/api/media' && req.method === 'POST') { const b = await body(req, 24 * 1024 * 1024); const m = await M.saveMedia(b); return send(res, 200, { id: m.id, kind: m.kind, mime: m.mime, bytes: m.bytes }); }
    if (p === '/api/x/radar') { if (!allow(ip, 2)) return send(res, 429, { error: 'Slow down a little', code: 'rate_limited' }); return send(res, 200, await RD.radar((url.searchParams.get('handles') || '').split(','))); }
    if (p === '/api/gifs') { if (!allow(ip, .5)) return send(res, 429, { error: 'Slow down a little', code: 'rate_limited' }); return send(res, 200, await G.searchGifs(url.searchParams.get('q'), { offset: url.searchParams.get('offset') })); }
    if (p === '/api/x/me') return send(res, 200, await X.refreshTier());
    if (p === '/api/x/replies') return send(res, 200, { replies: await X.replies(url.searchParams.get('id')) });
    if (p === '/api/x/reply' && req.method === 'POST') { const b = await body(req); if (!String(b.text || '').trim()) return send(res, 400, { error: 'Write the reply first' }); return send(res, 200, await X.reply(b.inReplyTo, String(b.text).slice(0, 1000))); }

    /* hook vote: a public link where friends pick the first line that stops them */
    if (p === '/api/vote' && req.method === 'POST') { const b = await body(req, 16 * 1024); const v = VO.createVote(b); return send(res, 200, { ...v, url: `${PUBLIC_URL}/v/${v.id}` }); }
    const vm = p.match(/^\/api\/vote\/([\w-]{8,20})$/); if (vm) { if (req.method === 'POST') { if (!allow(ip, .5)) return send(res, 429, { error: 'Slow down a little' }); return send(res, 200, VO.castVote(vm[1], await body(req, 4 * 1024))); } return send(res, 200, { ...VO.getVote(vm[1]), mine: VO.mineFor(vm[1], url.searchParams.get('voter')) }); }

    /* breakout alerts */
    if (p === '/api/breakout' && req.method === 'GET') return send(res, 200, BO.status());
    if (p === '/api/breakout' && req.method === 'POST') return send(res, 200, BO.setSettings(await body(req, 64 * 1024)));
    if (p === '/api/breakout/live') return send(res, 200, BO.live(url.searchParams.get('id') || ''));
    if (p === '/api/breakout/alerts') return send(res, 200, { alerts: BO.alerts(+url.searchParams.get('since') || 0) });
    if (p === '/api/breakout/test' && req.method === 'POST') { if (!allow(ip, 3)) return send(res, 429, { error: 'Slow down a little', code: 'rate_limited' }); const a = BO.sampleAlert(); await BO.deliverTest(a, { email: E.sendEmail, publicUrl: PUBLIC_URL }); return send(res, 200, { ok: true, sent: a.sent }); }

    /* review links (the review page itself is public by link; comments too) */
    if (p === '/api/review' && req.method === 'POST') { const b = await body(req); const r = E.createReview(b); return send(res, 200, { id: r.id, url: `${PUBLIC_URL}/r/${r.id}` }); }
    let m;
    if ((m = p.match(/^\/api\/review\/([\w-]{6,20})$/))) { if (req.method === 'PUT') return send(res, 200, E.updateReview(m[1], await body(req))); return send(res, 200, E.getReview(m[1])); }
    if ((m = p.match(/^\/api\/review\/([\w-]{6,20})\/comments$/)) && req.method === 'POST') { if (!allow(ip)) return send(res, 429, { error: 'Slow down a little' }); return send(res, 200, E.addComment(m[1], await body(req, 20 * 1024))); }

    /* Sunday digest */
    if (p === '/api/digest/subscribe' && req.method === 'POST') return send(res, 200, E.subscribeDigest(await body(req)));
    if (p === '/api/digest/unsubscribe' && req.method === 'POST') return send(res, 200, E.unsubscribeDigest((await body(req)).email));

    /* encrypted sync */
    if ((m = p.match(/^\/api\/sync\/([a-f0-9]{32,64})$/))) { if (req.method === 'PUT') return send(res, 200, E.putSync(m[1], await body(req))); return send(res, 200, E.getSync(m[1])); }

    /* posting */
    if (p === '/api/publish' && req.method === 'POST') { const b = await body(req); const item = { posts: b.posts, platforms: Object.keys(b.platforms || {}).filter(k => b.platforms[k] && (k === 'x' || k === 'linkedin')) }; if (!item.platforms.length) return send(res, 400, { error: 'Pick X or LinkedIn' }); return send(res, 200, { results: await Q.publish(item) }); }
    if (p === '/api/schedule' && req.method === 'POST') { const b = await body(req); return send(res, 200, Q.add(b)); }
    if (p === '/api/queue' && req.method === 'GET') return send(res, 200, { queue: Q.list() });
    if (p.startsWith('/api/queue/') && req.method === 'DELETE') return send(res, 200, { removed: Q.remove(p.split('/').pop()) });

    /* the same checks and rewrites, for other apps and AI assistants */
    if (p === '/api/v1/check' && req.method === 'POST') { const b = await body(req); const text = String(b.text || ''); const hist = Array.isArray(b.history) ? b.history.slice(0, 3000).map(core.normPost).filter(Boolean) : null; const tuned = hist ? core.learnHooks(hist) : null; return send(res, 200, { hook: core.hookScore(text), ...(tuned ? { mine: tuned.ready ? { ...core.personalScore(text, tuned), tested: tuned.val } : { ready: false, n: tuned.n, need: tuned.need } } : {}), kind: core.kindOf(text), checks: core.checkPost(text, { never: b.never || [], limit: b.limit || 280 }) }); }
    if (p === '/api/v1/rewrite' && req.method === 'POST') { const b = await body(req); if (!allow(ip)) return send(res, 429, { error: 'Slow down a little', code: 'rate_limited' }); const spec = core.prompts.rewrite({ text: b.text, kind: b.kind || 'punchier', lang: b.lang, voice: b.voice || null, platform: b.platform || 'X', limit: b.limit || 280 }); const r = await AI.complete({ ...spec, json: true }); return send(res, 200, r.data); }
    if (p === '/api/v1/ideas' && req.method === 'POST') { const b = await body(req); if (!allow(ip)) return send(res, 429, { error: 'Slow down a little', code: 'rate_limited' }); const r = await AI.complete({ ...core.prompts.ideas({ niche: b.niche, voice: b.voice, top: b.top || [], inbox: b.notes || [], count: b.count || 6 }), json: true }); return send(res, 200, { ideas: r.data }); }

    /* OAuth */
    if (p === '/auth/x/start') { if (!X.xConfigured().post) return send(res, 503, { error: 'Set X_CLIENT_ID in server/.env' }); res.writeHead(302, { location: X.authStart(`${PUBLIC_URL}/auth/x/callback`) }); return res.end(); }
    if (p === '/auth/x/callback') { const h = await X.authCallback(url.searchParams.get('code'), url.searchParams.get('state')); res.writeHead(302, { location: `/#write?connected=x&as=${encodeURIComponent(h)}` }); return res.end(); }
    if (p === '/auth/linkedin/start') { if (!LI.liConfigured()) return send(res, 503, { error: 'Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET' }); res.writeHead(302, { location: LI.authStart(`${PUBLIC_URL}/auth/linkedin/callback`) }); return res.end(); }
    if (p === '/auth/linkedin/callback') { await LI.authCallback(url.searchParams.get('code'), url.searchParams.get('state')); res.writeHead(302, { location: '/#write' }); return res.end(); }
    if ((m = p.match(/^\/v\/([\w-]{8,20})$/))) { res.writeHead(302, { location: `/?vote=${m[1]}` }); return res.end(); }
    if ((m = p.match(/^\/r\/([\w-]{6,20})$/))) { res.writeHead(302, { location: `/?review=${m[1]}` }); return res.end(); }
    if (p.startsWith('/api/')) return send(res, 404, { error: 'No such endpoint' });

    /* static files: the app itself */
    let f = normalize(join(ROOT, decodeURIComponent(p === '/' ? '/index.html' : p)));
    if (!f.startsWith(ROOT) || /[\\/](server|node_modules|\.git)([\\/]|$)/.test(f.slice(ROOT.length))) return send(res, 404, { error: 'Not found' });
    if (!existsSync(f) || statSync(f).isDirectory()) f = join(ROOT, 'index.html');
    /* repeat visits revalidate with an ETag (a 304 is a few bytes), and text is sent compressed */
    const st = statSync(f), etag = `"${st.size.toString(36)}-${Math.floor(st.mtimeMs).toString(36)}"`, type = TYPES[extname(f)] || 'application/octet-stream';
    const head = { 'content-type': type, 'cache-control': extname(f) === '.html' ? 'no-cache' : 'public, max-age=3600', 'x-content-type-options': 'nosniff', etag, vary: 'accept-encoding' };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, head); return res.end(); }
    const enc = /\bbr\b/.test(req.headers['accept-encoding'] || '') ? 'br' : /\bgzip\b/.test(req.headers['accept-encoding'] || '') ? 'gzip' : null;
    if (enc && /^(text\/|application\/(javascript|json|manifest)|image\/svg)/.test(type) && st.size > 1024) {
      const key = f + etag + enc; let buf = ZIP.get(key);
      if (!buf) { const raw = readFileSync(f); buf = enc === 'br' ? brotliCompressSync(raw, { params: { [Z.BROTLI_PARAM_QUALITY]: 9 } }) : gzipSync(raw, { level: 9 }); ZIP.set(key, buf); if (ZIP.size > 64) ZIP.delete(ZIP.keys().next().value); }
      res.writeHead(200, { ...head, 'content-encoding': enc, 'content-length': buf.length }); return res.end(buf);
    }
    res.writeHead(200, head);
    createReadStream(f).pipe(res);
  } catch (e) { fail(res, e); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === normalize(process.argv[1])) {
  createServer(handle).listen(PORT, HOST, () => {
    const h = health();
    console.log(`Hookworthy on ${PUBLIC_URL}`);
    if (TOKEN) console.log(`  Sign in on each device once: ${PUBLIC_URL}/login?token=${TOKEN}`);
    console.log(`  Claude: ${h.ai ? `on (${h.models.default} for writing, ${h.models.complex} for voice study)` : 'off: set ANTHROPIC_API_KEY'}`);
    console.log(`  X: ${h.x ? 'reading on' : 'reading off: set X_BEARER_TOKEN'} · ${h.xPost ? 'posting ready' : 'posting off: set X_CLIENT_ID'}`);
    console.log(`  LinkedIn: ${h.linkedin ? 'ready' : 'off: set LINKEDIN_CLIENT_ID/SECRET'}`);
  });
  Q.start();
  setInterval(() => E.sendDigests().catch(e => console.error('[digest]', e)), 15 * 60e3).unref();
  setInterval(() => BO.tick({ draft: breakoutDrafts, email: E.sendEmail, publicUrl: PUBLIC_URL }).catch(e => console.error('[breakout]', e.message)), 60e3).unref();
}
