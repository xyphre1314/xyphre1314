/* Claude credits on the server: the same table and refill rules as the app (core.js CREDITS), kept per signed-in token.
   Off by default. A self-hosted server runs on your own Anthropic key, so it doesn't meter you.
   Turn it on for people you host:
     HW_PLAN=free|pro|studio        meters the main HOOKWORTHY_TOKEN (or everyone, when no token is set)
     HOOKWORTHY_TOKENS=tok1:pro,tok2:free   more people, one token each, each with their own plan and balance
   Tokens are never stored: each person's balance is filed under a hash of their token. */
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { read, write } from './store.mjs';

const C = createRequire(import.meta.url)('../../core.js').CREDITS;
const KEY = 'credits';
/* the free helpers (Sharpen, visual pick, tidying a dictation) stay free up to this many a day per person, then cost 1.
   A helper call with a big prompt, a picture or the bigger model is charged like any other call */
export const FAIR_ASSISTS = 300;
const ASSIST_MAX_BYTES = 24 * 1024;

const isPlan = p => !!C.PLANS[p] && p !== 'trial';
/* token → plan, from the environment (read each call so tests and restarts pick up changes) */
export function plans(env = process.env) {
  const m = new Map();
  for (const part of String(env.HOOKWORTHY_TOKENS || '').split(',')) {
    const i = part.lastIndexOf(':'); if (i < 1) continue;
    const tok = part.slice(0, i).trim(), plan = part.slice(i + 1).trim().toLowerCase();
    if (tok && isPlan(plan)) m.set(tok, plan);
  }
  return m;
}
/* every token that may sign in: the main one plus the hosted ones */
export function tokens(env = process.env) { const s = new Set(plans(env).keys()); if (env.HOOKWORTHY_TOKEN) s.add(env.HOOKWORTHY_TOKEN); return s; }
/* the plan that meters this token, or null when it isn't metered */
export function planFor(token, env = process.env) {
  const p = plans(env); if (token && p.has(token)) return p.get(token);
  const main = String(env.HW_PLAN || '').trim().toLowerCase();
  if (!isPlan(main)) return null;
  return !env.HOOKWORTHY_TOKEN || token === env.HOOKWORTHY_TOKEN ? main : null;
}
const userKey = token => 'u_' + createHash('sha256').update(String(token || 'local')).digest('hex').slice(0, 20);
const dayOf = t => { const d = new Date(t); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

function load(token, plan, now) {
  const all = read(KEY, {}) || {}; const k = userKey(token);
  const rec = all[k] || {}; const st = C.settle(rec.st, plan, now);
  return { all, k, rec: { ...rec, st } };
}
function save(all, k, rec) { write(KEY, { ...all, [k]: rec }); }
/* what the app's meter needs (never the token, never anyone else's numbers) */
function view(st, plan, now) { const s = C.status(st, plan, now); return { metered: true, plan, name: s.name, per: s.per, left: s.left, amount: s.amount, next: s.next, rolled: s.rolled }; }

export function status(token, { env = process.env, now = Date.now() } = {}) {
  const plan = planFor(token, env); if (!plan) return { metered: false };
  return view(load(token, plan, now).rec.st, plan, now);
}

/* before a Claude call: price it, check it, take it. Returns { ok, cost, credits } and, when ok, a refund() for a call that fails */
export function reserve(token, { act, docs = 0, chars = 0, tier, bytes = 0 } = {}, { env = process.env, now = Date.now() } = {}) {
  const plan = planFor(token, env); if (!plan) return { ok: true, cost: 0, metered: false, refund() {} };
  const { all, k, rec } = load(token, plan, now);
  const a = C.ACTS[act]; let cost = C.cost(act, { docs, chars, tier });
  const day = dayOf(now); if (rec.day !== day) { rec.day = day; rec.assists = 0; }
  const assist = a && a.assist && cost === 0;
  if (assist && (bytes > ASSIST_MAX_BYTES || (rec.assists || 0) >= FAIR_ASSISTS)) cost = 1;
  if (cost > rec.st.bal) { save(all, k, rec); return { ok: false, cost, metered: true, credits: view(rec.st, plan, now), refund() {} }; }
  if (cost > 0) rec.st = C.spend(rec.st, cost); else rec.assists = (rec.assists || 0) + 1;
  save(all, k, rec);
  let done = false;
  return {
    ok: true, cost, metered: true, credits: view(rec.st, plan, now),
    /* the call failed (no answer, an error, a refusal): nothing was written, so nothing is owed */
    refund() {
      if (done) return; done = true;
      const cur = load(token, plan, Date.now());
      if (cost > 0) { const P = C.PLANS[plan]; cur.rec.st = { ...cur.rec.st, bal: Math.min(P.amount + P.roll, cur.rec.st.bal + cost) }; }
      else cur.rec.assists = Math.max(0, (cur.rec.assists || 0) - 1);
      save(cur.all, cur.k, cur.rec);
    }
  };
}
