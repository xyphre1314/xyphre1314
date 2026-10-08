import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer, request } from 'node:http';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-cr-'));
process.env.ANTHROPIC_API_KEY = 'test-key';
process.env.HOOKWORTHY_TOKEN = 'owner-token';
process.env.HOOKWORTHY_TOKENS = 'free-token:free,pro-token:pro,odd-token:gold,api-token:free';
delete process.env.HW_PLAN;
const C = createRequire(import.meta.url)('../../core.js').CREDITS;
const AI = await import('../lib/ai.mjs');
const CR = await import('../lib/credits.mjs');
const { handle, resetRateLimits } = await import('../server.mjs');

let calls = 0, failNext = false;
AI.setClient({ beta: { messages: { create: async req => { calls++; if (failNext) { failNext = false; throw new Error('boom'); } return { model: req.model, stop_reason: 'end_turn', content: [{ type: 'text', text: '{"options":[{"text":"a","why":"b"}]}' }] }; } } } });

let srv, port;
before(async () => { srv = createServer(handle); await new Promise(r => srv.listen(0, '127.0.0.1', r)); port = srv.address().port; });
after(() => srv.close());
const call = (path, { method = 'GET', body, token, cookie } = {}) => new Promise((res, rej) => {
  const headers = { ...(body ? { 'content-type': 'application/json' } : {}), ...(token ? { authorization: `Bearer ${token}` } : {}), ...(cookie ? { cookie } : {}) };
  const r = request({ host: '127.0.0.1', port, path, method, headers }, resp => { let d = ''; resp.on('data', c => d += c); resp.on('end', () => { let j = null; try { j = JSON.parse(d); } catch { /* not json */ } res({ status: resp.statusCode, json: j, headers: resp.headers }); }); });
  r.on('error', rej); if (body) r.write(JSON.stringify(body)); r.end();
});
const ai = (token, body) => { resetRateLimits(); return call('/api/ai', { method: 'POST', token, body: { prompt: 'Rewrite this', json: true, ...body } }); };

/* ---------- the shared table ---------- */
test('credits: what each action costs, before the click', () => {
  assert.equal(C.cost('rewrite'), 1);
  assert.equal(C.cost('rewrite', { chars: 1400 }), 2, 'a post over 1,000 characters counts double');
  assert.equal(C.cost('instruct', { chars: 300 }), 1);
  assert.equal(C.cost('picture', { docs: 1 }), 2, 'the picture Claude reads adds one');
  assert.equal(C.cost('brief', { docs: 2 }), 3);
  assert.equal(C.cost('briefWrite'), 2);
  assert.equal(C.cost('week'), 3);
  assert.equal(C.cost('voice'), 5);
  assert.equal(C.cost('sharpen'), 0, 'Sharpen stays free');
  assert.equal(C.cost('sharpen', { tier: 'complex' }), 5, 'the bigger model is never free, whatever the caller calls it');
  assert.equal(C.cost('nonsense'), 1);
  assert.equal(C.cost('rewrite', { docs: 99 }), 4, 'files are capped at three');
});
test('credits: Free refills at local midnight; paid plans on the monthly anniversary, rolling over once, after the first month', () => {
  const t = new Date(2026, 9, 4, 15, 30).getTime();
  assert.equal(C.next('free', t), new Date(2026, 9, 5, 0, 0).getTime());
  const jan31 = new Date(2027, 0, 31, 9).getTime();
  assert.equal(C.next('pro', jan31 + 1000, jan31), new Date(2027, 1, 28, 9).getTime(), 'a 31st joiner refills on the last day of a short month');
  let st = C.fresh('pro', jan31); st = C.spend(st, 400); assert.equal(st.bal, 600);
  const s1 = C.status(st, 'pro', new Date(2027, 1, 28, 10).getTime());
  assert.equal(s1.left, 1600); assert.equal(s1.rolled, 600);
  const s2 = C.status({ ...st, bal: 1900 }, 'pro', new Date(2027, 1, 28, 10).getTime());
  assert.equal(s2.left, 2000, 'rollover stops at one extra month');
  const s3 = C.status({ ...st, bal: 900 }, 'pro', new Date(2027, 4, 1).getTime());
  assert.equal(s3.left, 1000, 'only the first month rolls over: later refills start at the plan amount');
  const s4 = C.status({ ...st, bal: 1500, next: new Date(2027, 2, 31, 9).getTime() }, 'pro', new Date(2027, 2, 31, 10).getTime());
  assert.equal(s4.left, 1000, 'the second refill drops leftovers');
  let f = C.fresh('free', t); f = C.spend(f, 9); assert.equal(C.status(f, 'free', t + 3600e3).left, 1);
  assert.equal(C.status(f, 'free', new Date(2026, 9, 5, 0, 1).getTime()).left, 10, 'Free comes back to 10, never more');
  assert.equal(C.spend(f, 2), null, 'not enough: nothing is taken');
});
test('credits: the meter says low at about 80% used, and Plenty on paid plans', () => {
  const now = Date.now();
  assert.equal(C.status({ ...C.fresh('free', now), bal: 3 }, 'free', now).low, false);
  assert.equal(C.status({ ...C.fresh('free', now), bal: 2 }, 'free', now).low, true);
  assert.equal(C.status(C.fresh('free', now), 'free', now).plenty, false, 'Free always shows the count');
  assert.equal(C.status({ ...C.fresh('pro', now), bal: 400 }, 'pro', now).plenty, true);
  assert.equal(C.status({ ...C.fresh('pro', now), bal: 200 }, 'pro', now).plenty, false);
  const tr = C.fresh('trial', now); assert.equal(tr.bal, 250); assert.equal(C.status(tr, 'trial', now + 7 * 864e5).ended, true);
  assert.equal(C.settle({ plan: 'free', bal: 'x', next: 5 }, 'free', now).bal, 10, 'a broken saved ledger starts fresh');
});

/* ---------- the server ---------- */
test('credits: off for the owner by default, so a self-hosted server never meters its own key', async () => {
  const h = await call('/api/health', { token: 'owner-token' });
  assert.deepEqual(h.json.credits, { metered: false });
  for (let i = 0; i < 12; i++) assert.equal((await ai('owner-token', { act: 'rewrite' })).status, 200);
  const r = await ai('owner-token', { act: 'voice', tier: 'complex' }); assert.equal(r.status, 200); assert.equal(r.json.credits, undefined);
});
test('credits: Free spends down to a clear 402, with the refill time; a failed call costs nothing', async () => {
  const h = await call('/api/health', { token: 'free-token' });
  assert.equal(h.json.credits.metered, true); assert.equal(h.json.credits.plan, 'free'); assert.equal(h.json.credits.left, 10); assert.ok(h.json.credits.next > Date.now());
  assert.equal(JSON.stringify(h.json.credits).includes('free-token'), false, 'the token never comes back');
  const v = await ai('free-token', { act: 'voice', tier: 'complex' }); assert.equal(v.status, 200); assert.equal(v.json.cost, 5); assert.equal(v.json.credits.left, 5);
  const n0 = calls; failNext = true; const bad = await ai('free-token', { act: 'rewrite' }); assert.equal(bad.status, 502); assert.equal(calls, n0 + 1);
  assert.equal((await call('/api/health', { token: 'free-token' })).json.credits.left, 5, 'refunded');
  const s = await ai('free-token', { act: 'sharpen' }); assert.equal(s.status, 200); assert.equal(s.json.cost, 0); assert.equal(s.json.credits.left, 5);
  for (let i = 0; i < 4; i++) assert.equal((await ai('free-token', { act: 'rewrite' })).status, 200);
  const before = calls; const long = await ai('free-token', { act: 'rewrite', chars: 1500 });
  assert.equal(long.status, 402); assert.equal(long.json.code, 'out_of_credits'); assert.equal(long.json.cost, 2); assert.equal(long.json.credits.left, 1); assert.equal(calls, before, 'Claude is never called');
  assert.equal((await ai('free-token', { act: 'rewrite' })).json.credits.left, 0);
  const out = await ai('free-token', { act: 'rewrite' }); assert.equal(out.status, 402); assert.match(out.json.error, /needs 1 credit and 0 are left/);
  assert.equal((await ai('free-token', { act: 'sharpen' })).status, 200, 'Sharpen keeps working at zero');
});
test('credits: each hosted token has its own balance and plan; unknown plans and tokens are refused', async () => {
  const p = await call('/api/health', { token: 'pro-token' }); assert.equal(p.json.credits.plan, 'pro'); assert.equal(p.json.credits.amount, 1000);
  const r = await ai('pro-token', { act: 'week' }); assert.equal(r.json.credits.left, 997);
  assert.equal((await call('/api/ai', { method: 'POST', token: 'odd-token', body: { prompt: 'x' } })).status, 401, 'a token with a made-up plan never signs in');
  assert.equal((await call('/api/ai', { method: 'POST', token: 'nobody', body: { prompt: 'x' } })).status, 401);
  const lg = await call('/login?token=pro-token'); assert.equal(lg.status, 302); assert.match(lg.headers['set-cookie'][0], /hw=pro-token/);
  const viaCookie = await call('/api/health', { cookie: 'hw=pro-token' }); assert.equal(viaCookie.json.credits.left, 997);
  assert.equal((await call('/login?token=nope')).status, 401);
  const locked = await call('/api/health'); assert.equal(locked.json.locked, true); assert.equal(locked.json.credits, undefined);
});
test('credits: a free helper dressed up as a big job pays like one', async () => {
  const r = await ai('pro-token', { act: 'sharpen', tier: 'complex' }); assert.equal(r.json.cost, 5);
  const big = await ai('pro-token', { act: 'sharpen', prompt: 'x'.repeat(30 * 1024) }); assert.equal(big.json.cost, 1, 'a helper with a huge prompt is charged');
});
test('credits: helpers stay free up to the fair-use line, then cost 1; refills come back on time', () => {
  const env = { HOOKWORTHY_TOKENS: 'fair-token:free' }; const now = new Date(2026, 9, 4, 12).getTime();
  for (let i = 0; i < CR.FAIR_ASSISTS; i++) assert.equal(CR.reserve('fair-token', { act: 'visual' }, { env, now }).cost, 0);
  const over = CR.reserve('fair-token', { act: 'visual' }, { env, now }); assert.equal(over.cost, 1); assert.equal(over.credits.left, 9);
  const next = CR.reserve('fair-token', { act: 'visual' }, { env, now: now + 864e5 }); assert.equal(next.cost, 0, 'the fair-use count resets each day');
  assert.equal(CR.status('fair-token', { env, now: now + 864e5 }).left, 10, 'and Free is back to 10 after midnight');
  const ok = CR.reserve('fair-token', { act: 'rewrite' }, { env, now: now + 864e5 }); assert.equal(ok.credits.left, 9); ok.refund(); ok.refund();
  assert.equal(CR.status('fair-token', { env, now: now + 864e5 }).left, 10, 'a refund lands once');
  assert.equal(CR.status('someone', { env: {} }).metered, false);
  assert.equal(CR.planFor('anyone', { HW_PLAN: 'pro' }), 'pro', 'with no token set, HW_PLAN meters everyone');
  assert.equal(CR.planFor('other', { HW_PLAN: 'pro', HOOKWORTHY_TOKEN: 'main' }), null);
});
test('credits: the developer API (v1 rewrite and ideas) draws on the same allowance', async () => {
  const v1 = (path, body) => { resetRateLimits(); return call(path, { method: 'POST', token: 'api-token', body }); };
  const i = await v1('/api/v1/ideas', { niche: 'trading' }); assert.equal(i.status, 200); assert.equal(i.json.credits.left, 9);
  for (let k = 0; k < 9; k++) { const r = await v1('/api/v1/rewrite', { text: 'Short line' }); assert.equal(r.status, 200); assert.equal(r.headers['x-credits-left'], String(8 - k)); }
  const out = await v1('/api/v1/rewrite', { text: 'Short line' }); assert.equal(out.status, 402); assert.equal(out.json.code, 'out_of_credits');
});
