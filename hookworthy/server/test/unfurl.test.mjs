import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-uf-'));
delete process.env.HW_UNFURL_ALLOW_PRIVATE;
const { unfurl, privateIp, parseMeta, decodeEntities, clearUnfurlCache } = await import('../lib/unfurl.mjs');
const { handle } = await import('../server.mjs');
const core = createRequire(import.meta.url)('../../core.js');

/* a 1×1 PNG */
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');
let stub, sport, hits = {};
const page = (head, body = '') => `<!doctype html><html><head>${head}</head><body>${body}</body></html>`;
before(async () => {
  stub = createServer((req, res) => {
    const u = new URL(req.url, 'http://x'); hits[u.pathname] = (hits[u.pathname] || 0) + 1;
    const html = h => { res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); res.end(h); };
    switch (u.pathname) {
      case '/article': return html(page(`<title>Fallback title</title><meta property="og:title" content="Funding rates flipped &amp; nobody noticed"><meta property="og:description" content='Three charts, one rule.'><meta property="og:image" content="/img/card.png"><meta property="og:site_name" content="Stub Daily"><meta name="twitter:card" content="summary_large_image">`));
      case '/plain': return html(page('<title>  Just a   title </title><meta name="description" content="From the description tag">'));
      case '/img/card.png': res.writeHead(200, { 'content-type': 'image/png' }); return res.end(PNG);
      case '/img/huge.png': res.writeHead(200, { 'content-type': 'image/png' }); return res.end(Buffer.concat([PNG, Buffer.alloc(400 * 1024)]));
      case '/img/fake.png': res.writeHead(200, { 'content-type': 'image/png' }); return res.end('<svg onload=alert(1)>');
      case '/bigimage': return html(page('<meta property="og:title" content="Big picture"><meta property="og:image" content="/img/huge.png">'));
      case '/fakeimage': return html(page('<meta property="og:title" content="Not a picture"><meta property="og:image" content="/img/fake.png">'));
      case '/hop': res.writeHead(302, { location: '/article' }); return res.end();
      case '/to-metadata': res.writeHead(302, { location: 'http://169.254.169.254/latest/meta-data/' }); return res.end();
      case '/to-private': res.writeHead(301, { location: 'http://10.0.0.7/admin' }); return res.end();
      case '/loop': res.writeHead(302, { location: '/loop' }); return res.end();
      case '/pdf': res.writeHead(200, { 'content-type': 'application/pdf' }); return res.end('%PDF-1.4');
      case '/huge': { res.writeHead(200, { 'content-type': 'text/html' }); res.write(page('<meta property="og:title" content="Head comes first">')); const pad = '<p>' + 'x'.repeat(64 * 1024) + '</p>'; for (let i = 0; i < 20; i++) res.write(pad); return res.end(); }
      case '/slow': setTimeout(() => html(page('<meta property="og:title" content="Too late">')), 1500); return;
      case '/latin1': res.writeHead(200, { 'content-type': 'text/html; charset=windows-1252' }); return res.end(Buffer.concat([Buffer.from('<html><head><meta property="og:title" content="Caf'), Buffer.from([0xE9]), Buffer.from(' talk"></head></html>')]));
      case '/oembed/youtube': res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ title: 'How I size positions', author_name: 'Sam Trades', thumbnail_url: `http://127.0.0.1:${sport}/img/card.png` }));
      case '/oembed/x': res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ author_name: 'Sam Okafor', author_url: 'https://twitter.com/samtrades', html: '<blockquote class="twitter-tweet"><p lang="en" dir="ltr">Size is a feeling,<br>not a number. &amp; that&#39;s fine</p>&mdash; Sam Okafor (@samtrades) <a href="https://twitter.com/samtrades/status/1">May 1</a></blockquote>' }));
      default: res.writeHead(404); return res.end('nope');
    }
  });
  await new Promise(r => stub.listen(0, '127.0.0.1', r)); sport = stub.address().port;
});
after(() => stub.close());
beforeEach(() => { clearUnfurlCache(); hits = {}; });
const local = { allowIp: ip => ip === '127.0.0.1', anyPort: true };
const S = p => `http://127.0.0.1:${sport}${p}`;

test('private, loopback, link-local and reserved addresses are refused', () => {
  for (const ip of ['127.0.0.1', '10.1.2.3', '172.16.0.1', '172.31.255.255', '192.168.1.1', '169.254.169.254', '100.64.0.1', '0.0.0.0', '224.0.0.1', '255.255.255.255', '::1', '::', 'fe80::1', 'fc00::1', 'fd12:3456::1', '::ffff:127.0.0.1', '::ffff:7f00:1', '::ffff:10.0.0.1', 'ff02::1', '2001:db8::1', 'not-an-ip']) assert.equal(privateIp(ip), true, ip);
  for (const ip of ['8.8.8.8', '1.1.1.1', '172.32.0.1', '100.128.0.1', '2606:4700:4700::1111', '::ffff:8.8.8.8']) assert.equal(privateIp(ip), false, ip);
});

test('the guard blocks private targets by default, before any request', async () => {
  for (const u of ['http://127.0.0.1/', S('/article'), 'http://localhost/', 'http://[::1]/', 'http://169.254.169.254/latest/meta-data/', 'http://10.0.0.1/', 'http://2130706433/', 'http://0x7f000001/', 'http://example.com:8080/', 'http://printer.local/']) {
    await assert.rejects(unfurl(u), e => e.code === 'blocked' || e.code === 'bad_url', u);
  }
  await assert.rejects(unfurl('file:///etc/passwd'), e => e.code === 'bad_url');
  await assert.rejects(unfurl('ftp://example.com/x'), e => e.code === 'bad_url');
  await assert.rejects(unfurl('http://user:pw@example.com/'), e => e.code === 'bad_url');
  await assert.rejects(unfurl(''), e => e.code === 'bad_url');
  assert.deepEqual(hits, {}, 'nothing reached the stub');
});

test('reads Open Graph tags, follows a redirect and returns the image as a data URL', async () => {
  const r = await unfurl(S('/hop'), local);
  assert.equal(r.title, 'Funding rates flipped & nobody noticed'); assert.equal(r.description, 'Three charts, one rule.');
  assert.equal(r.site, 'Stub Daily'); assert.equal(r.final, S('/article')); assert.equal(r.large, true);
  assert.match(r.image, /^data:image\/png;base64,/); assert.equal(Buffer.from(r.image.split(',')[1], 'base64').equals(PNG), true);
});

test('falls back to <title> and the description tag', async () => {
  const r = await unfurl(S('/plain'), local); assert.equal(r.title, 'Just a title'); assert.equal(r.description, 'From the description tag'); assert.equal(r.image, null);
});

test('a redirect to a private address is refused at that hop', async () => {
  await assert.rejects(unfurl(S('/to-metadata'), local), e => e.code === 'blocked');
  await assert.rejects(unfurl(S('/to-private'), local), e => e.code === 'blocked');
  await assert.rejects(unfurl(S('/loop'), local), e => e.code === 'unreachable');
});

test('HTML only, a size cap, and a time limit', async () => {
  await assert.rejects(unfurl(S('/pdf'), local), e => e.code === 'not_html' && e.status === 415);
  const big = await unfurl(S('/huge'), local); assert.equal(big.title, 'Head comes first');
  const t0 = Date.now(); await assert.rejects(unfurl(S('/slow'), { ...local, ms: 400 }), e => e.code === 'timeout'); assert.ok(Date.now() - t0 < 1400);
  const huge = await unfurl(S('/bigimage'), local); assert.equal(huge.title, 'Big picture'); assert.equal(huge.image, null); assert.equal(huge.imageSkipped, 'too big');
  const fake = await unfurl(S('/fakeimage'), local); assert.equal(fake.image, null);
});

test('a page in another charset still reads right', async () => {
  const r = await unfurl(S('/latin1'), local); assert.equal(r.title, 'Café talk');
});

test('results are cached, misses too', async () => {
  await unfurl(S('/article'), local); await unfurl(S('/article#again'), local); const c = await unfurl(S('/article'), local);
  assert.equal(c.cached, true); assert.equal(hits['/article'], 1);
  await assert.rejects(unfurl(S('/pdf'), local)); await assert.rejects(unfurl(S('/pdf'), local)); assert.equal(hits['/pdf'], 1);
});

test('YouTube and X posts read through oEmbed', async () => {
  const oembed = { youtube: S('/oembed/youtube'), x: S('/oembed/x') };
  const y = await unfurl('https://youtu.be/dQw4w9WgXcQ', { ...local, oembed });
  assert.equal(y.kind, 'video'); assert.equal(y.title, 'How I size positions'); assert.equal(y.author, 'Sam Trades'); assert.match(y.image, /^data:image\/png/);
  const x = await unfurl('https://x.com/samtrades/status/1234567890', { ...local, oembed });
  assert.equal(x.kind, 'post'); assert.equal(x.handle, 'samtrades'); assert.equal(x.author, 'Sam Okafor'); assert.equal(x.text, 'Size is a feeling,\nnot a number. & that\'s fine');
});

test('meta parsing: attribute order, single quotes, entities, relative images', () => {
  const m = parseMeta(`<head><meta content="Second" property="og:title"><meta property='og:image' content='../a.jpg'><meta name=twitter:card content=summary></head><meta property="og:title" content="After head">`, 'https://ex.com/b/c/page');
  assert.equal(m.title, 'Second'); assert.equal(m.image, 'https://ex.com/b/a.jpg'); assert.equal(m.card, 'summary');
  assert.equal(parseMeta('<meta property="og:image" content="javascript:alert(1)">', 'https://ex.com').image, null);
  assert.equal(decodeEntities('&lt;b&gt; &#8217; &#x2014; &bogus;'), '<b> ’ — &bogus;');
});

test('core reads links on their own: kind, site and a title from the path', () => {
  const g = u => core.LINKS.guess(u);
  assert.equal(g('x.com/samtrades/status/1790000000000000000').kind, 'post');
  assert.equal(g('https://twitter.com/samtrades').kind, 'profile');
  assert.equal(g('https://www.youtube.com/watch?v=dQw4w9WgXcQ').id, 'dQw4w9WgXcQ');
  assert.equal(g('https://youtube.com/shorts/dQw4w9WgXcQ').short, true);
  assert.equal(g('github.com/anthropics/hookworthy/pull/12').title, 'anthropics/hookworthy · Pull request #12');
  assert.equal(g('https://blog.example.com/posts/2026/why-i-stopped-using-leverage.html').title, 'Why I stopped using leverage');
  assert.equal(g('https://example.com/').title, 'example.com');
  assert.deepEqual(core.LINKS.find('Read this (x.com/a/status/123456789). And https://ex.com/a_(b), ok.').map(l => l.url), ['x.com/a/status/123456789', 'https://ex.com/a_(b)']);
  assert.equal(core.LINKS.show('https://www.example.com/some/long/path/to/an/article'), 'example.com/some/long/pat…');
  assert.equal(core.xLength('chart: https://www.tradingview.com/chart/BTCUSD/abcdefgh-a-very-long-title-for-a-chart/'), 7 + 23);
});

/* the endpoint itself */
let srv, port;
before(async () => { srv = createServer(handle); await new Promise(r => srv.listen(0, '127.0.0.1', r)); port = srv.address().port; });
after(() => srv.close());
const call = path => new Promise((res, rej) => { const r = request({ host: '127.0.0.1', port, path }, resp => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => res({ status: resp.statusCode, json: JSON.parse(d || '{}'), cc: resp.headers['cache-control'] })); }); r.on('error', rej); r.end(); });
test('GET /api/unfurl: health says it is on, bad and private links get clear errors', async () => {
  assert.equal((await call('/api/health')).json.unfurl, true);
  const none = await call('/api/unfurl'); assert.equal(none.status, 400); assert.equal(none.json.code, 'bad_url');
  const priv = await call(`/api/unfurl?url=${encodeURIComponent(S('/article'))}`); assert.equal(priv.status, 403); assert.equal(priv.json.code, 'blocked');
  const meta = await call(`/api/unfurl?url=${encodeURIComponent('http://169.254.169.254/latest/meta-data/')}`); assert.equal(meta.status, 403);
});
