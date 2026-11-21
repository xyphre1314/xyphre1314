/* Hook vote: two to four first lines, a public link, one vote per person (they can change it).
   Voters only see the lines and the totals, never who voted. Links last 14 days. */
import { randomBytes } from 'node:crypto';
import { read, write } from './store.mjs';
export class VoteError extends Error { constructor(status, message) { super(message); this.status = status; } }
const TTL = 14 * 864e5;
const clean = (s, n) => String(s || '').replace(/[\u0000-\u0008\u000b-\u001f]/g, '').trim().slice(0, n);
const all = () => { const v = read('votes', {}); const now = Date.now(); let gone = false; for (const k of Object.keys(v)) if (now - v[k].at > TTL) { delete v[k]; gone = true; } if (gone) write('votes', v); return v; };
const view = v => ({ id: v.id, author: v.author, question: v.question, options: v.options, counts: v.counts, total: v.counts.reduce((a, b) => a + b, 0), at: v.at });

export function createVote({ options, author, question } = {}) {
  const opts = (Array.isArray(options) ? options : []).map(o => clean(o, 300)).filter(Boolean);
  if (opts.length < 2) throw new VoteError(400, 'Give people at least two lines to choose from');
  if (new Set(opts.map(o => o.toLowerCase())).size !== opts.length) throw new VoteError(400, 'Two of the lines are the same');
  const v = all(), id = randomBytes(9).toString('base64url');
  v[id] = { id, author: clean(author, 60) || 'A friend', question: clean(question, 140) || 'Which first line would make you stop scrolling?', options: opts.slice(0, 4), counts: opts.slice(0, 4).map(() => 0), voters: {}, at: Date.now() };
  write('votes', v); return view(v[id]);
}
export function getVote(id) { const v = all()[id]; if (!v) throw new VoteError(404, 'This vote has closed or never existed'); return view(v); }
export function castVote(id, { choice, voter } = {}) {
  const v = all(), x = v[id]; if (!x) throw new VoteError(404, 'This vote has closed or never existed');
  const c = +choice, who = clean(voter, 64); if (!Number.isInteger(c) || c < 0 || c >= x.options.length) throw new VoteError(400, 'Pick one of the lines');
  if (!/^[\w-]{12,64}$/.test(who)) throw new VoteError(400, 'Missing voter id');
  const prev = x.voters[who]; if (prev === c) return { ...view(x), mine: c };
  if (prev != null) x.counts[prev] = Math.max(0, x.counts[prev] - 1);
  x.counts[c]++; x.voters[who] = c; if (Object.keys(x.voters).length > 5000) throw new VoteError(429, 'This vote is full');
  write('votes', v); return { ...view(x), mine: c };
}
export function mineFor(id, voter) { const x = all()[id]; return x && voter ? x.voters[String(voter)] ?? null : null; }
