/* r86: the owner's eval for Sharpen through Claude. Every juror line set (concepts/r86/reviews/rerate*, hook/unseen.json)
   goes through the Claude path (the same sharpenClaude the endpoint runs) and the rules path (core.sharpenLine), and a
   side-by-side markdown table comes out for hand grading: draft | rules | claude | validator verdict.
   It calls the real Anthropic API and costs money (~$1 for the ~300 lines), so it runs ONLY when ANTHROPIC_API_KEY is set:

     cd server && ANTHROPIC_API_KEY=sk-ant-... node test/sharpen-ai-eval.mjs [--limit 40] [--concurrency 4] [--out file.md]

   Not part of `npm test`. Prints total tokens, cache hits and the estimated cost at the quick tier's prices
   (Sonnet 5.5: $2/MTok in, $10/MTok out, $0.20/MTok cache reads, $2.50/MTok 5-minute cache writes). */
import { readFileSync, readdirSync, existsSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
if (!process.env.ANTHROPIC_API_KEY) {
  console.log('sharpen-ai-eval: ANTHROPIC_API_KEY is not set, so nothing was sent. Set it in the environment to run the eval against the real API.');
  process.exit(0);
}

const arg = (k, d) => { const i = process.argv.indexOf(`--${k}`); return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const LIMIT = +arg('limit', 0) || Infinity, CONC = Math.max(1, Math.min(8, +arg('concurrency', 4) || 4));
const OUT = arg('out', join(process.cwd(), `sharpen-ai-eval-${new Date().toISOString().slice(0, 10)}.md`));
process.env.HW_DATA_DIR = process.env.HW_DATA_DIR || mkdtempSync(join(tmpdir(), 'hw-eval-'));

const { createRequire } = await import('node:module');
const core = createRequire(import.meta.url)('../../core.js');
const { sharpenClaude } = await import('../server.mjs');
const AI = await import('../lib/ai.mjs');

/* every juror line set */
const REV = join(here, '..', '..', 'concepts', 'r86', 'reviews'), seen = new Set(), lines = [];
for (const d of readdirSync(REV).filter(x => /^rerate/.test(x)).sort()) {
  const f = join(REV, d, 'hook', 'unseen.json'); if (!existsSync(f)) continue;
  for (const r of JSON.parse(readFileSync(f, 'utf8'))) { const t = String(r.t || r.text || ''); if (!t.trim() || seen.has(t)) continue; seen.add(t); lines.push({ set: d, n: r.n || '', t }); }
}
const todo = lines.slice(0, LIMIT);
console.log(`sharpen-ai-eval: ${todo.length} lines from ${[...new Set(todo.map(x => x.set))].join(', ')} on ${AI.MODELS.quick} (quick tier), ${CONC} at a time`);

const tot = { calls: 0, input: 0, output: 0, read: 0, write: 0, hits: 0, ms: 0 }, verdicts = {}, rows = [];
async function one(x, i) {
  const rules = core.sharpenLine(x.t);
  if (core.SHARPEN.tooThin(x.t)) { rows[i] = { ...x, rules, claude: '', verdict: 'thin: rules only, Claude not called' }; verdicts.thin = (verdicts.thin || 0) + 1; return; }
  const t0 = Date.now(), r = await sharpenClaude({ text: x.t }); const ms = Date.now() - t0;
  const u = r.usage || {};
  if (r.usage) { tot.calls++; tot.input += u.input_tokens || 0; tot.output += u.output_tokens || 0; tot.read += u.cache_read_input_tokens || 0; tot.write += u.cache_creation_input_tokens || 0; if (u.cache_read_input_tokens) tot.hits++; tot.ms += ms; }
  let verdict, claude = r.data && typeof r.data.line === 'string' ? r.data.line : '';
  if (r.result) verdict = r.result.state === 'clean' ? 'pass: unchanged' : `pass: ${r.result.say}`;
  else if (r.reason === 'invalid' && r.data) { const tr = {}; core.SHARPEN.fromClaude(x.t, r.data, { trace: tr }); verdict = `rejected: ${tr.reject || 'invalid'}`; }
  else verdict = `${r.reason}${r.error ? `: ${String(r.error.message || '').slice(0, 80)}` : ''}`;
  if (r.data && r.data.unchanged && !r.result) claude = `(unchanged) ${claude}`;
  const key = verdict.replace(/:.*$/, '') + (verdict.startsWith('rejected') ? `: ${verdict.split(': ')[1]}` : '');
  verdicts[key] = (verdicts[key] || 0) + 1;
  rows[i] = { ...x, rules, claude, why: r.result ? r.result.why : r.data && r.data.why, verdict, model: r.model };
}
/* the first call writes the cache; the rest read it */
let next = 0; if (todo.length) { await one(todo[0], 0); next = 1; }
await Promise.all(Array.from({ length: CONC }, async () => { while (next < todo.length) { const i = next++; try { await one(todo[i], i); } catch (e) { rows[i] = { ...todo[i], rules: core.sharpenLine(todo[i].t), claude: '', verdict: `error: ${e.message}` }; } if ((i + 1) % 20 === 0) process.stdout.write(`  ${i + 1}/${todo.length}\n`); } }));

const cell = s => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ⏎ ');
const first = t => String(t).split('\n')[0];
const md = [`# Sharpen: Claude vs rules (${new Date().toISOString().slice(0, 10)})`, '',
  `${todo.length} juror lines · model ${AI.MODELS.quick} · grade each Claude line h (a pro would post it), o (better, not there) or m (worse or wrong).`, '',
  '| # | set | draft | rules | claude | validator verdict | grade |', '|---|---|---|---|---|---|---|',
  ...rows.map((r, i) => `| ${i + 1} | ${cell(`${r.set} ${r.n}`)} | ${cell(first(r.t))} | ${cell(r.rules.state === 'sharp' ? r.rules.line : `(${r.rules.state}) ${r.rules.line}`)} | ${cell(r.claude)}${r.why ? `<br><sub>${cell(r.why)}</sub>` : ''} | ${cell(r.verdict)}${r.model && r.model !== AI.MODELS.quick ? ` (${cell(r.model)})` : ''} | |`)];
writeFileSync(OUT, md.join('\n') + '\n');

const P = { in: 2, out: 10, read: 0.2, write: 2.5 }, $ = n => `$${n.toFixed(4)}`;
const cost = (tot.input * P.in + tot.output * P.out + tot.read * P.read + tot.write * P.write) / 1e6;
console.log(`\nwrote ${OUT}`);
console.log(`verdicts: ${Object.entries(verdicts).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
console.log(`Claude calls ${tot.calls} · avg ${tot.calls ? Math.round(tot.ms / tot.calls) : 0} ms`);
console.log(`tokens: input ${tot.input} · output ${tot.output} · cache reads ${tot.read} · cache writes ${tot.write} · total ${tot.input + tot.output + tot.read + tot.write}`);
console.log(`cache hits: ${tot.hits}/${tot.calls} calls read the cached prefix`);
console.log(`estimated cost: ${$(cost)} total · ${$(tot.calls ? cost / tot.calls : 0)} per tap (Sonnet 5.5: $2/MTok in, $10/MTok out, $0.20/MTok cache reads, $2.50/MTok cache writes)`);
