// r86 hero-sync: every example the homepage shows as "sharpened in one tap" must be exactly what the engine returns.
// Usage:  node hero-sync.js            -> checks, prints every mismatch, exits 1 if any
//         node hero-sync.js --write    -> rewrites the stale fields in work/src.html (then run: cd work && python3 build.py)
// It loads /home/user/xyphre1314/hookworthy/core.js in Node, lifts EX, draftHTML, cutNote and keptLine out of the page
// source (between their START/END markers), and runs HWCore.sharpenLine on:
//   - the four hero examples (EX): line, cut words + kinds, receipt (say) and the Kept row;
//   - the hero's static first frame (#pf-draft, #pf-sharp, #pf-move, #pf-cut, #pf-kept) against EX[0];
//   - the Try tile's pre-rendered default ($SOL) and the final's example card.
// The hero shows the engine's own "why" and "say" verbatim, so they are checked (and rewritten by --write) like the line.
// The Kept rows ("Kept: $SOL, 40%. Kept your lowercase.") come from the page's own keptLine, lifted the same way, and the Try
// default's struck mirror and the final's struck draft are rebuilt by --write with the page's own markup helpers (MARKUP block).
//
const fs = require('fs'), path = require('path');
const CORE = '/home/user/xyphre1314/hookworthy/core.js';
const SRC = path.join(__dirname, 'work/src.html'), TAIL = path.join(__dirname, 'work/tail.txt');
const H = require(CORE);
if (!H.sharpenLine) { console.error('core.js has no sharpenLine yet'); process.exit(2); }
const WRITE = process.argv.includes('--write');
let src = fs.readFileSync(SRC, 'utf8'), tail = fs.readFileSync(TAIL, 'utf8');
const between = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error('marker ' + a); return s.slice(i + a.length, j); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const list = arr => arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
const lib = new Function('esc', 'list', `${between(src, '/* EX-START */', '/* EX-END */')}\n${between(src, '/* DRAFT-START */', '/* DRAFT-END */')}\n${between(src, '/* KEPT-START */', '/* KEPT-END */')}\n${between(src, '/* MARKUP-START */', '/* MARKUP-END */')}\nreturn { EX, draftHTML, cutNote, keptLine, FLUFF, nb, segments, mirrorHTML, fpDraftHTML };`)(esc, list);
const { EX, draftHTML, cutNote, keptLine, nb, segments, mirrorHTML, fpDraftHTML } = lib;
const bad = [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const fromEngine = d => { const R = H.sharpenLine(d); return { R, after: R.line, cut: R.cut.map(c => [c.text, c.kind]), say: R.say, why: R.why, kept: R.state === 'sharp' ? keptLine(R.draft, R.line, R.kept) : '' }; };

/* 1. the four hero examples */
const fixed = EX.map((e, i) => {
  const g = fromEngine(e.draft), out = { ...e };
  if (g.R.state !== 'sharp') bad.push(`EX[${i}] ${e.who}: engine says "${g.R.state}" for this draft; pick a draft that sharpens`);
  if (e.after !== g.after) { bad.push(`EX[${i}] ${e.who} line\n    page:   ${e.after}\n    engine: ${g.after}`); out.after = g.after; }
  if (e.why !== g.why) { bad.push(`EX[${i}] ${e.who} why\n    page:   ${e.why}\n    engine: ${g.why}`); out.why = g.why; }
  if (!same(e.cut, g.cut)) { bad.push(`EX[${i}] ${e.who} cut\n    page:   ${JSON.stringify(e.cut)}\n    engine: ${JSON.stringify(g.cut)}`); out.cut = g.cut; }
  if (e.say !== g.say) { bad.push(`EX[${i}] ${e.who} receipt\n    page:   ${e.say}\n    engine: ${g.say}`); out.say = g.say; }
  if (e.kept !== g.kept) { bad.push(`EX[${i}] ${e.who} kept\n    page:   ${e.kept}\n    engine: ${g.kept}`); out.kept = g.kept; }
  return out;
});

/* 2. the hero's static first frame equals EX[0] */
const e0 = fixed[0];
const STATIC = [
  ['pf-draft', /(<p class="dtext" id="pf-draft">)([\s\S]*?)(<\/p>)/, draftHTML(e0)],
  ['pf-move', /(<span id="pf-move">)([\s\S]*?)(<\/span>)/, esc(e0.say)],
  ['pf-sharp', /(<p class="ptext(?: long)?" id="pf-sharp">)([\s\S]*?)(<\/p>)/, '<span class="sr">Sharpened: </span>' + nb(esc(e0.after))],
  ['pf-why', /(<p id="pf-why">)([\s\S]*?)(<\/p>)/, esc(e0.why)],
  ['pf-kept', /(<p(?: class="[^"]*")? id="pf-kept">)([\s\S]*?)(<\/p>)/, esc(e0.kept)],
  ['pf-cut', /(<p class="note" id="pf-cut">)([\s\S]*?)(<\/p>)/, cutNote(e0)]
];
for (const [id, re, want] of STATIC) {
  const m = src.match(re); if (!m) { bad.push(`static #${id} not found`); continue; }
  if (m[2] !== want) { bad.push(`static #${id}\n    page:   ${m[2]}\n    wanted: ${want}`); src = src.replace(re, (all, a, b, c) => a + want + c); }
}
const longCls = e0.after.length > 62;
if (/class="ptext long" id="pf-sharp"/.test(src) !== longCls) { bad.push('static #pf-sharp long class'); src = src.replace(/class="ptext(?: long)?" id="pf-sharp"/, `class="ptext${longCls ? ' long' : ''}" id="pf-sharp"`); }

/* 3. the Try default and the final's example */
const ta = (src.match(/<textarea class="ed-ta" id="try-ta"[^>]*>([\s\S]*?)<\/textarea>/) || [])[1];
if (ta) {
  const g = fromEngine(ta);
  const line = (src.match(/<p class="xtext" id="out-line">([\s\S]*?)<\/p>/) || [])[1];
  const struck = [...(src.match(/<div class="ed-mirror struck" id="try-mirror"[^>]*>([\s\S]*?)<\/div>/) || ['', ''])[1].matchAll(/<mark class="c[^"]*"[^>]*>([\s\S]*?)<\/mark>/g)].map(m => m[1]);
  const st = (src.match(/<span id="out-st">([\s\S]*?)<\/span>/) || [])[1], kept = (src.match(/<p(?: class="[^"]*")? id="out-kept">([\s\S]*?)<\/p>/) || [])[1];
  const why = (src.match(/<p id="out-why">([\s\S]*?)<\/p>/) || [])[1];
  const fixSrc = (re, v) => { src = src.replace(re, (all, a, b, c) => a + v + c); };
  if (line !== esc(g.after)) { bad.push(`Try default line\n    page:   ${line}\n    engine: ${g.after}`); fixSrc(/(<p class="xtext" id="out-line">)([\s\S]*?)(<\/p>)/, esc(g.after)); }
  if (!same(struck, g.cut.map(c => esc(c[0])))) bad.push(`Try default strikes\n    page:   ${JSON.stringify(struck)}\n    engine: ${JSON.stringify(g.cut)}`);
  /* the struck mirror is exactly what the page's own mirrorHTML draws for the engine's result */
  const mir = (src.match(/<div class="ed-mirror struck" id="try-mirror"[^>]*>([\s\S]*?)<\/div>/) || [])[1], mirWant = mirrorHTML(ta, segments(g.R, { cut: g.R.cut }, []), true);
  if (mir !== mirWant) { bad.push(`Try default mirror markup\n    page:   ${mir}\n    wanted: ${mirWant}`); src = src.replace(/(<div class="ed-mirror struck" id="try-mirror"[^>]*>)([\s\S]*?)(<\/div>)/, (all, a, b, c) => a + mirWant + c); }
  if (st !== esc(g.say)) { bad.push(`Try default receipt\n    page:   ${st}\n    engine: ${g.say}`); fixSrc(/(<span id="out-st">)([\s\S]*?)(<\/span>)/, esc(g.say)); }
  if (kept !== esc(g.kept)) { bad.push(`Try default kept\n    page:   ${kept}\n    engine: ${g.kept}`); fixSrc(/(<p(?: class="[^"]*")? id="out-kept">)([\s\S]*?)(<\/p>)/, esc(g.kept)); }
  if (why !== esc(g.R.why)) { bad.push(`Try default why\n    page:   ${why}\n    engine: ${g.R.why}`); fixSrc(/(<p id="out-why">)([\s\S]*?)(<\/p>)/, esc(g.R.why)); }
}
const fpD = (tail.match(/<p class="draft" id="fp-draft">([\s\S]*?)<\/p>/) || [])[1];
if (fpD) {
  const draft = fpD.replace(/<span class="sr">[\s\S]*?<\/span>/, '').replace(/<[^>]+>/g, '').replace(/\u00a0/g, ' ');
  const g = fromEngine(draft);
  const struck = [...fpD.matchAll(/<span class="cut">([\s\S]*?)<\/span>/g)].map(m => m[1]);
  const line = (tail.match(/<p class="xtext" id="fp-sharp"><span class="sr">Sharpened: <\/span>([\s\S]*?)<\/p>/) || [])[1];
  if (line !== esc(g.after)) { bad.push(`Final example line\n    page:   ${line}\n    engine: ${g.after}`); tail = tail.replace(/(<p class="xtext" id="fp-sharp"><span class="sr">Sharpened: <\/span>)([\s\S]*?)(<\/p>)/, (all, a, b, c) => a + esc(g.after) + c); }
  if (!same(struck, g.cut.map(c => c[0]))) bad.push(`Final example strikes\n    page:   ${JSON.stringify(struck)}\n    engine: ${JSON.stringify(g.cut)}`);
  /* the example's draft is the page's own fpDraftHTML for the engine's result; its strikes aren't toggles (those are for your own line) */
  const fpWant = fpDraftHTML(draft, segments(g.R, { cut: g.R.cut }, [])).replace(/<span class="cut tog"[^>]*>/g, '<span class="cut">');
  if (fpD !== fpWant) { bad.push(`Final example draft markup\n    page:   ${fpD}\n    wanted: ${fpWant}`); tail = tail.replace(/(<p class="draft" id="fp-draft">)([\s\S]*?)(<\/p>)/, (all, a, b, c) => a + fpWant + c); }
  const fw = (tail.match(/<p id="fp-why">([\s\S]*?)<\/p>/) || [])[1], fk = (tail.match(/<p(?: class="[^"]*")? id="fp-kept">([\s\S]*?)<\/p>/) || [])[1];
  const fixTail = (re, v) => { tail = tail.replace(re, (all, a, b, c) => a + v + c); };
  if (fw !== esc(g.why)) { bad.push(`Final example why\n    page:   ${fw}\n    engine: ${g.why}`); fixTail(/(<p id="fp-why">)([\s\S]*?)(<\/p>)/, esc(g.why)); }
  if (fk !== esc(g.kept)) { bad.push(`Final example kept\n    page:   ${fk}\n    engine: ${g.kept}`); fixTail(/(<p(?: class="[^"]*")? id="fp-kept">)([\s\S]*?)(<\/p>)/, esc(g.kept)); }
  if (g.R.state !== 'sharp') bad.push(`Final example: engine says "${g.R.state}"`);
}

if (WRITE) {
  const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  const body = fixed.map(e => `    { who: ${q(e.who)}, handle: ${q(e.handle)}, av: ${q(e.av)}, draft: ${q(e.draft)},\n      cut: [${e.cut.map(c => `[${q(c[0])}, ${q(c[1])}]`).join(', ')}], after: ${q(e.after)}, say: ${q(e.say)},\n      why: ${q(e.why)}, kept: ${q(e.kept)} }`).join(',\n');
  const a = src.indexOf('/* EX-START */'), b = src.indexOf('/* EX-END */');
  src = src.slice(0, a) + `/* EX-START */\n  const EX = [\n${body}\n  ];\n  ` + src.slice(b);
  fs.writeFileSync(SRC, src); fs.writeFileSync(TAIL, tail);
  console.log('wrote', SRC, 'and', TAIL);
}
if (bad.length) { console.log(`${bad.length} mismatch(es):\n- ` + bad.join('\n- ')); process.exit(WRITE ? 0 : 1); }
console.log('hero-sync: every example matches HWCore.sharpenLine');
