#!/usr/bin/env node
/* Builds sharpen.js, the homepage's Sharpen-only engine, from core.js. Never edit sharpen.js by hand: run
     node tools/build-sharpen.mjs            (writes sharpen.js next to core.js)
     node tools/build-sharpen.mjs --check    (exits 1 if sharpen.js is not what core.js builds today)
   How: core.js is one factory function whose body is a list of top-level statements (consts, lets, functions, a few
   expression statements and blocks). This script reads that body with a small tokenizer (strings, template literals,
   comments and regex literals are skipped as units), splits it into statements, finds the names each statement declares
   and every identifier it mentions, and keeps the statements the exported subset reaches, transitively. A statement that
   declares nothing (an expression or a block) is kept when it mentions a kept name. Reading every identifier as a possible
   reference only ever keeps too much, never too little. Kept statements are copied byte for byte, in their order, so every
   kept function is the same code as in core.js. The exported subset is the one the homepage calls:
     window.HWCore = { sharpenLine, softMarks, softCut, SOFT, xLength,
                       SHARPEN: { sharpenLine, softMarks, softCut, SOFT, warmSteps, warm, tooThin, factsOf, stanceKeep, guard, fragN } }
   (in Node, module.exports is the same object). No dependencies. */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CORE = path.join(ROOT, 'core.js'), OUT = path.join(ROOT, 'sharpen.js');
/* what the bundle exports: top-level keys (name → expression in core's own top-level return) and SHARPEN's keys */
const TOP = ['sharpenLine', 'softMarks', 'softCut', 'SOFT', 'xLength'];
const SH = ['sharpenLine', 'softMarks', 'softCut', 'SOFT', 'warmSteps', 'warm', 'tooThin', 'factsOf', 'stanceKeep', 'guard', 'fragN'];

/* ---------- tokenizer: [{ t: 'id' | 'num' | 'str' | 'tpl' | 're' | 'p', v, a, b }] for one source string ---------- */
const KW_RE = new Set(['return', 'typeof', 'instanceof', 'in', 'of', 'new', 'delete', 'void', 'throw', 'case', 'do', 'else', 'yield', 'await']);
function tokenize(src) {
  const out = []; let i = 0; const n = src.length;
  const prevSig = () => out.length ? out[out.length - 1] : null;
  const reOK = () => { const p = prevSig(); if (!p) return true; if (p.t === 'id') return KW_RE.has(p.v); if (p.t === 'num' || p.t === 'str' || p.t === 'tpl' || p.t === 're') return false; return !/^[)\]]$/.test(p.v); };
  /* a template literal from its opening backtick; `${…}` parts are tokenized in place, so their identifiers count */
  const tpl = () => { const a = i; i++; while (i < n) { const c = src[i]; if (c === '\\') { i += 2; continue; } if (c === '`') { i++; break; } if (c === '$' && src[i + 1] === '{') { i += 2; let d = 1; while (i < n && d > 0) { const before = out.length; step(); const last = out[out.length - 1]; if (out.length > before && last.t === 'p') { if (last.v === '{') d++; else if (last.v === '}') d--; } } if (out.length && out[out.length - 1].v === '}') out.pop(); continue; } i++; } out.push({ t: 'tpl', v: '`', a, b: i }); };
  function step() {
    const c = src[i];
    if (/\s/.test(c)) { i++; return; }
    if (c === '/' && src[i + 1] === '/') { const e = src.indexOf('\n', i); i = e < 0 ? n : e; return; }
    if (c === '/' && src[i + 1] === '*') { const e = src.indexOf('*/', i + 2); if (e < 0) throw new Error('unclosed comment at ' + i); i = e + 2; return; }
    if (c === '"' || c === "'") { const a = i; i++; while (i < n && src[i] !== c) { if (src[i] === '\\') i++; if (src[i] === '\n') throw new Error('newline in string at ' + a); i++; } i++; out.push({ t: 'str', v: c, a, b: i }); return; }
    if (c === '`') { tpl(); return; }
    if (c === '/' && reOK()) { const a = i; i++; let cls = false; while (i < n) { const d = src[i]; if (d === '\\') { i += 2; continue; } if (d === '\n') throw new Error('newline in regex at ' + a + ': ' + src.slice(a, a + 60)); if (cls) { if (d === ']') cls = false; } else if (d === '[') cls = true; else if (d === '/') break; i++; } i++; while (i < n && /[a-z]/i.test(src[i])) i++; out.push({ t: 're', v: '/', a, b: i }); return; }
    if (/[A-Za-z_$À-￿]/.test(c)) { const a = i; while (i < n && /[\w$À-￿]/.test(src[i])) i++; out.push({ t: 'id', v: src.slice(a, i), a, b: i }); return; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1]))) { const a = i; while (i < n && /[\w.]/.test(src[i])) i++; out.push({ t: 'num', v: src.slice(a, i), a, b: i }); return; }
    if (c === '.' && src[i + 1] === '.' && src[i + 2] === '.') { out.push({ t: 'p', v: '...', a: i, b: i + 3 }); i += 3; return; }
    if (c === '=' && src[i + 1] === '>') { out.push({ t: 'p', v: '=>', a: i, b: i + 2 }); i += 2; return; }
    if (c === '?' && src[i + 1] === '.' && !/[0-9]/.test(src[i + 2])) { out.push({ t: 'p', v: '?.', a: i, b: i + 2 }); i += 2; return; }
    out.push({ t: 'p', v: c, a: i, b: i + 1 }); i++;
  }
  while (i < n) step();
  return out;
}

/* ---------- the factory body and its top-level statements ---------- */
function statements(src) {
  const open = src.indexOf("function () {\n  'use strict';"); if (open < 0) throw new Error('core.js: factory not found');
  const bodyA = src.indexOf("'use strict';", open) + "'use strict';".length;
  const retA = src.lastIndexOf('\n  return {'); if (retA < 0) throw new Error('core.js: top-level return not found');
  const body = src.slice(bodyA, retA), toks = tokenize(body), stm = [];
  let k = 0;
  while (k < toks.length) {
    const s = k, first = toks[k], block = first.v === '{' || first.v === 'function' || (first.v === 'async' && toks[k + 1] && toks[k + 1].v === 'function');
    if (first.t === 'id' && /^(?:if|for|while|try|switch|do|class)$/.test(first.v)) throw new Error(`core.js: top-level "${first.v}" statement at ${first.a}; teach build-sharpen.mjs about it`);
    let d = 0, e = -1;
    for (; k < toks.length; k++) {
      const t = toks[k]; if (t.t !== 'p') continue;
      if ('([{'.includes(t.v)) d++; else if (')]}'.includes(t.v)) { d--; if (d === 0 && block && t.v === '}' && (first.v === '{' || toks.slice(s, k).some(x => x.v === '{'))) { if (first.v === '{' || isFnEnd(toks, s, k)) { e = k; break; } } }
      else if (t.v === ';' && d === 0) { e = k; break; }
    }
    if (e < 0) throw new Error('core.js: unterminated statement at ' + first.a);
    const a = first.a, b = toks[e].b, own = toks.slice(s, e + 1);
    stm.push({ a: bodyA + a, b: bodyA + b, toks: own, decl: declared(own), refs: refsOf(own) });
    k = e + 1;
  }
  return { stm, body, bodyA, retA };
}
/* the identifiers a statement may read from the top level. Skipped: a property name after "." or "?.", an object key
   ("{ key: …", ", key: …"), and a name read only inside its own local binding's scope: a const/let in a block (the scope is
   the block), a function or arrow parameter (the parameters and the body; an arrow's expression body ends at the first ","
   or ";" at its depth, or the bracket that closes around it), a catch binding. Every other identifier counts, so a name
   is only ever kept for nothing, never missed */
function refsOf(own) {
  const n = own.length, mate = new Array(n).fill(-1), up = new Array(n).fill(-1), st = [];
  for (let j = 0; j < n; j++) { up[j] = st.length ? st[st.length - 1] : -1; const v = own[j].t === 'p' ? own[j].v : ''; if ('([{'.includes(v) && v) st.push(j); else if (')]}'.includes(v) && v) { const o = st.pop(); if (o != null) { mate[o] = j; mate[j] = o; } } }
  const P = j => own[j] && own[j].t === 'p' ? own[j].v : null, scopes = new Map(), decl = new Set();
  const add = (name, a, b) => { if (!scopes.has(name)) scopes.set(name, []); scopes.get(name).push([a, b]); };
  /* where an arrow or function body ends, from the token after "=>" (or the "{" of a function body) */
  const bodyEnd = k => { if (P(k) === '{') return mate[k]; let d = 0; for (let j = k; j < n; j++) { const v = P(j); if (v && '([{'.includes(v)) d++; else if (v && ')]}'.includes(v)) { if (d === 0) return j - 1; d--; } else if (d === 0 && (v === ',' || v === ';')) return j - 1; } return n - 1; };
  /* the parameter names in a list from "(" at o to its mate: names not after "=" (a default value is read, not bound) */
  const params = (o, c) => { const out = []; for (let j = o + 1; j < c; j++) { if (own[j].t !== 'id') continue; const pv = P(j - 1), nv = P(j + 1); if (pv === '.' || pv === '?.' || pv === '=') continue; let dd = 0, eq = false; for (let q = j - 1; q > o; q--) { const v = P(q); if (v && ')]}'.includes(v)) dd++; else if (v && '([{'.includes(v)) { if (dd === 0) break; dd--; } else if (v === '=' && dd === 0) { eq = true; break; } else if (v === ',' && dd === 0) break; } if (eq) continue; if (nv === ':' && (pv === '{' || pv === ',')) continue; if ([',', ')', '=', '}', ']', ':'].includes(nv) || nv == null) out.push(j); } return out; };
  for (let j = 0; j < n; j++) {
    const t = own[j];
    if (t.t === 'id' && /^(?:const|let)$/.test(t.v) && j > 0) { const o = up[j]; if (o < 0 || P(o) !== '{') continue; let d = 0, expect = true; for (let q = j + 1; q < n && q < mate[o]; q++) { const v = P(q); if (v && '([{'.includes(v)) { d++; continue; } if (v && ')]}'.includes(v)) { d--; continue; } if (d === 0 && (v === ';')) break; if (d === 0 && v === ',') { expect = true; continue; } if (expect && d === 0 && own[q].t === 'id') { add(own[q].v, o, mate[o]); decl.add(q); expect = false; } } }
    if (t.t === 'p' && t.v === '=>') { if (own[j - 1] && own[j - 1].t === 'id') { add(own[j - 1].v, j - 1, bodyEnd(j + 1)); decl.add(j - 1); } else if (P(j - 1) === ')' && mate[j - 1] >= 0) { const o = mate[j - 1], e = bodyEnd(j + 1); params(o, j - 1).forEach(q => { add(own[q].v, o, e); decl.add(q); }); } }
    if (t.t === 'id' && t.v === 'function') { let o = j + 1; if (own[o] && own[o].t === 'id') o++; if (P(o) === '(' && mate[o] > 0 && P(mate[o] + 1) === '{') { const e = mate[mate[o] + 1]; params(o, mate[o]).forEach(q => { add(own[q].v, o, e); decl.add(q); }); } }
    if (t.t === 'id' && t.v === 'catch' && P(j + 1) === '(' && own[j + 2] && own[j + 2].t === 'id' && P(j + 3) === ')' && P(j + 4) === '{') { add(own[j + 2].v, j + 1, mate[j + 4]); decl.add(j + 2); }
  }
  const out = new Set();
  own.forEach((t, j) => {
    if (t.t !== 'id' || decl.has(j)) return; const p = own[j - 1], nx = own[j + 1];
    if (p && p.t === 'p' && (p.v === '.' || p.v === '?.')) return;
    if (p && p.t === 'p' && (p.v === '{' || p.v === ',') && nx && nx.t === 'p' && nx.v === ':') return;
    if ((scopes.get(t.v) || []).some(([a, b]) => j > a && j <= b)) return;
    out.add(t.v);
  });
  return out;
}
/* a function declaration ends at the "}" that closes its body (the first top-level "{" after its parameter list) */
function isFnEnd(toks, s, k) { let d = 0, seenParams = false; for (let j = s; j <= k; j++) { const v = toks[j].v; if (toks[j].t !== 'p') continue; if (v === '(' && d === 0 && !seenParams) seenParams = true; if ('([{'.includes(v)) d++; else if (')]}'.includes(v)) d--; if (j < k && d === 0 && v === '}' && seenParams) return false; } return true; }
/* the names a statement declares: `function f`, or each `const|let|var` binding at its top level (no destructuring in core) */
function declared(own) {
  const f = own[0]; if (f.v === 'function') return [own[1].v]; if (f.v === 'async' && own[1].v === 'function') return [own[2].v];
  if (!/^(?:const|let|var)$/.test(f.v)) return [];
  const names = []; let d = 0, expectName = true;
  for (let j = 1; j < own.length; j++) { const t = own[j]; if (d === 0 && t.t === 'id' && /^(?:const|let|var|function)$/.test(t.v) && own[j - 1].v !== '.') throw new Error('core.js: two statements without a ";" at ' + t.a + '; add the ";"'); if (t.t === 'p') { if ('([{'.includes(t.v)) { if (expectName && d === 0) throw new Error('core.js: destructuring at ' + t.a + '; teach build-sharpen.mjs about it'); d++; } else if (')]}'.includes(t.v)) d--; else if (t.v === ',' && d === 0) expectName = true; continue; } if (expectName && d === 0 && t.t === 'id') { names.push(t.v); expectName = false; } }
  return names;
}

/* ---------- the SHARPEN object's properties, by key ---------- */
function props(src, st) {
  const toks = st.toks, i0 = toks.findIndex(t => t.v === '{'), out = new Map(); let d = 0, key = null, ka = -1;
  for (let j = i0 + 1; j < toks.length; j++) {
    const t = toks[j];
    if (t.t === 'p' && '([{'.includes(t.v)) { d++; continue; } if (t.t === 'p' && ')]}'.includes(t.v)) { if (d === 0) { if (key) out.set(key, src.slice(ka, toks[j - 1].b).trim()); break; } d--; continue; }
    if (d !== 0) continue;
    if (key == null && (t.t === 'id' || t.t === 'str')) { key = t.t === 'id' ? t.v : src.slice(t.a + 1, t.b - 1); ka = t.a; continue; }
    if (t.t === 'p' && t.v === ',') { out.set(key, src.slice(ka, toks[j - 1].b).trim()); key = null; }
  }
  return out;
}

export function build(src) {
  const { stm } = statements(src), byName = new Map();
  stm.forEach((s, i) => s.decl.forEach(n => byName.set(n, i)));
  /* rebase token offsets of each statement onto the whole file for slicing */
  const shI = byName.get('SHARPEN'); if (shI == null) throw new Error('core.js: SHARPEN not found');
  const shProps = props(src.slice(stm[shI].a - stm[shI].toks[0].a), stm[shI]);
  const shParts = SH.map(k => { const v = shProps.get(k); if (v == null) throw new Error(`core.js: SHARPEN.${k} not found`); return v; });
  const topRet = src.slice(src.lastIndexOf('\n  return {') + '\n  return {'.length, src.lastIndexOf('};'));
  const topProps = new Map(topRet.split(/,\s*(?![^{]*\})/).map(x => x.trim()).filter(Boolean).map(x => { const m = x.match(/^(\w+)\s*(?::\s*([\s\S]+))?$/); return m ? [m[1], (m[2] || m[1]).trim()] : null; }).filter(Boolean));
  const topParts = TOP.map(k => { const v = topProps.get(k); if (v == null) throw new Error(`core.js: top-level ${k} not found`); return [k, v]; });
  /* roots: every identifier the exported expressions mention */
  const keep = new Set(), queue = [];
  const want = names => names.forEach(n => { const i = byName.get(n); if (i != null && i !== shI && !keep.has(i)) { keep.add(i); queue.push(i); } });
  const idsOf = code => tokenize(code).filter(t => t.t === 'id').map(t => t.v);
  shParts.forEach(code => want(idsOf(code))); topParts.forEach(([, code]) => want(idsOf(code)));
  for (let changed = true; changed;) {
    while (queue.length) want([...stm[queue.shift()].refs]);
    changed = false;
    stm.forEach((s, i) => { if (keep.has(i) || i === shI || s.decl.length) return; if ([...s.refs].some(r => { const j = byName.get(r); return j != null && keep.has(j); })) { keep.add(i); queue.push(i); changed = true; } });
  }
  const kept = stm.filter((s, i) => keep.has(i));
  const shSrc = `  const SHARPEN = {\n${SH.map((k, j) => `    ${shParts[j].startsWith(k + ':') || shParts[j] === k ? shParts[j] : `${k}: ${shParts[j]}`}`).join(',\n')}\n  };`;
  const head = `/* GENERATED by tools/build-sharpen.mjs from core.js. Do not edit: change core.js and run node tools/build-sharpen.mjs.
   The homepage's Sharpen-only engine: ${kept.length} of core.js's ${stm.length} top-level statements, copied byte for byte, so
   sharpenLine here is the same code as in core.js. Loaded as a classic script it sets window.HWCore (with require(), module.exports) to
   { ${TOP.join(', ')}, SHARPEN: { ${SH.join(', ')} } }. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HWCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
`;
  const bodyOut = kept.map(s => '  ' + src.slice(s.a, s.b)).join('\n');
  return { code: `${head}\n${bodyOut}\n${shSrc}\n\n  return { ${topParts.map(([k, v]) => (k === v ? k : `${k}: ${v}`)).join(', ')}, SHARPEN };\n});\n`, kept: kept.length, total: stm.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const src = readFileSync(CORE, 'utf8'), { code, kept, total } = build(src);
  if (process.argv.includes('--check')) {
    let cur = ''; try { cur = readFileSync(OUT, 'utf8'); } catch (e) { /* missing */ }
    if (cur !== code) { console.error('sharpen.js is stale: run node tools/build-sharpen.mjs'); process.exit(1); }
    console.log('sharpen.js is up to date'); process.exit(0);
  }
  writeFileSync(OUT, code); console.log(`sharpen.js: ${kept}/${total} statements, ${code.length} bytes (core.js ${src.length})`);
}
