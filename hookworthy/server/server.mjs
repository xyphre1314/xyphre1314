/* Hookworthy server: serves the app and gives it Claude, X, LinkedIn, Typefully and a posting queue.
   node server.mjs  →  http://localhost:8787
   Config in server/.env (see .env.example). Nothing here is required: every missing key just turns
   that feature off, and the app falls back to what it can do in the browser. */
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, createReadStream } from 'node:fs';
import { join, normalize, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const here = dirname(fileURLToPath(import.meta.url));
/* .env without a dependency */
const envFile = join(here, '.env');
if (existsSync(envFile)) for (const line of readFileSync(envFile, 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
if (!process.env.HW_DATA_DIR) process.env.HW_DATA_DIR = join(here, 'data');

const core = createRequire(import.meta.url)('../core.js');
const AI = await import('./lib/ai.mjs');
const X = await import('./lib/x.mjs');
const LI = await import('./lib/linkedin.mjs');
const TF = await import('./lib/typefully.mjs');
const Q = await import('./lib/scheduler.mjs');
const E = await import('./lib/extras.mjs');

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

export const health = () => ({ ok: true, review: true, sync: true, digest: true, email: !!process.env.RESEND_API_KEY, replies: X.xConfigured().read, ai: AI.hasKey(), models: AI.MODELS, x: X.xConfigured().read, xPost: X.xConfigured().post, xUser: X.connectedUser() || null, linkedin: LI.liConfigured(), liUser: LI.connectedUser() || null, typefully: true, version: 1 });

export async function handle(req, res) {
  const url = new URL(req.url, 'http://x'); const p = url.pathname; const ip = req.socket.remoteAddress || 'local';
  try {
    if (p === '/api/health') return send(res, 200, { ...health(), locked: !!TOKEN && !authed(req) });
    if (p === '/login') { if (!TOKEN || url.searchParams.get('token') !== TOKEN) return send(res, 401, { error: 'Wrong or missing token' }); res.writeHead(302, { 'set-cookie': `hw=${TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000${PUBLIC_URL.startsWith('https') ? '; Secure' : ''}`, location: '/#write' }); return res.end(); }
    if (p.startsWith('/api/') && !/^\/api\/review\/[\w-]{6,20}(\/comments)?$/.test(p) && !authed(req)) return send(res, 401, { error: 'Missing HOOKWORTHY_TOKEN', code: 'auth' });

    /* Claude */
    if (p === '/api/ai' && req.method === 'POST') {
      const b = await body(req); if (!allow(ip, b.tier === 'complex' ? 5 : 1)) return send(res, 429, { error: 'Slow down a little', code: 'rate_limited' });
      const r = await AI.complete({ prompt: b.prompt, tier: b.tier, json: !!b.json });
      return send(res, 200, { text: r.text, data: r.data, model: r.model, truncated: r.truncated });
    }

    /* imports */
    if (p === '/api/x/posts') { const r = await X.postsFor(url.searchParams.get('handle'), Math.min(3200, +url.searchParams.get('max') || 800)); return send(res, 200, r); }
    if (p === '/api/x/people') { const hs = (url.searchParams.get('handles') || '').split(',').map(s => s.trim()).filter(Boolean); if (!hs.length) return send(res, 400, { error: 'Add some handles' }); return send(res, 200, { people: await X.peopleTop(hs) }); }
    if (p === '/api/x/metrics') { const ids = (url.searchParams.get('ids') || '').split(',').filter(Boolean); return send(res, 200, { posts: await X.metrics(ids) }); }
    if (p === '/api/typefully/import' && req.method === 'POST') { const b = await body(req); const drafts = await TF.importDrafts(b.key); return send(res, 200, { posts: core.parseTypefully(drafts) }); }

    /* first hour */
    if (p === '/api/x/replies') return send(res, 200, { replies: await X.replies(url.searchParams.get('id')) });
    if (p === '/api/x/reply' && req.method === 'POST') { const b = await body(req); if (!String(b.text || '').trim()) return send(res, 400, { error: 'Write the reply first' }); return send(res, 200, await X.reply(b.inReplyTo, String(b.text).slice(0, 1000))); }

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
    if (p === '/api/v1/check' && req.method === 'POST') { const b = await body(req); const text = String(b.text || ''); return send(res, 200, { hook: core.hookScore(text), kind: core.kindOf(text), checks: core.checkPost(text, { never: b.never || [], limit: b.limit || 280 }) }); }
    if (p === '/api/v1/rewrite' && req.method === 'POST') { const b = await body(req); if (!allow(ip)) return send(res, 429, { error: 'Slow down a little', code: 'rate_limited' }); const spec = core.prompts.rewrite({ text: b.text, kind: b.kind || 'punchier', lang: b.lang, voice: b.voice || null, platform: b.platform || 'X', limit: b.limit || 280 }); const r = await AI.complete({ ...spec, json: true }); return send(res, 200, r.data); }
    if (p === '/api/v1/ideas' && req.method === 'POST') { const b = await body(req); if (!allow(ip)) return send(res, 429, { error: 'Slow down a little', code: 'rate_limited' }); const r = await AI.complete({ ...core.prompts.ideas({ niche: b.niche, voice: b.voice, top: b.top || [], inbox: b.notes || [], count: b.count || 6 }), json: true }); return send(res, 200, { ideas: r.data }); }

    /* OAuth */
    if (p === '/auth/x/start') { if (!X.xConfigured().post) return send(res, 503, { error: 'Set X_CLIENT_ID in server/.env' }); res.writeHead(302, { location: X.authStart(`${PUBLIC_URL}/auth/x/callback`) }); return res.end(); }
    if (p === '/auth/x/callback') { const h = await X.authCallback(url.searchParams.get('code'), url.searchParams.get('state')); res.writeHead(302, { location: `/#write?connected=x&as=${encodeURIComponent(h)}` }); return res.end(); }
    if (p === '/auth/linkedin/start') { if (!LI.liConfigured()) return send(res, 503, { error: 'Set LINKEDIN_CLIENT_ID and LINKEDIN_CLIENT_SECRET' }); res.writeHead(302, { location: LI.authStart(`${PUBLIC_URL}/auth/linkedin/callback`) }); return res.end(); }
    if (p === '/auth/linkedin/callback') { await LI.authCallback(url.searchParams.get('code'), url.searchParams.get('state')); res.writeHead(302, { location: '/#write' }); return res.end(); }
    if ((m = p.match(/^\/r\/([\w-]{6,20})$/))) { res.writeHead(302, { location: `/?review=${m[1]}` }); return res.end(); }
    if (p.startsWith('/api/')) return send(res, 404, { error: 'No such endpoint' });

    /* static files: the app itself */
    let f = normalize(join(ROOT, decodeURIComponent(p === '/' ? '/index.html' : p)));
    if (!f.startsWith(ROOT) || /[\\/](server|node_modules|\.git)([\\/]|$)/.test(f.slice(ROOT.length))) return send(res, 404, { error: 'Not found' });
    if (!existsSync(f) || statSync(f).isDirectory()) f = join(ROOT, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[extname(f)] || 'application/octet-stream', 'cache-control': extname(f) === '.html' ? 'no-cache' : 'public, max-age=3600', 'x-content-type-options': 'nosniff' });
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
}
