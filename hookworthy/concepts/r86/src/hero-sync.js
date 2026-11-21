// r86 hero-sync: every example the homepage shows as "sharpened in one tap" must be exactly what the engine returns.
// Usage:  node hero-sync.js            -> checks, prints every mismatch, exits 1 if any
//         node hero-sync.js --write    -> rewrites the stale fields in work/src.html (then run: cd work && python3 build.py)
// It loads the engine the page itself loads (loadCore's script: sharpen.js since pass 10, else core.js) from
// /home/user/xyphre1314/hookworthy in Node, lifts EX, draftHTML and keptLine out of the page
// source (between their START/END markers), and runs HWCore.sharpenLine on:
//   - the four hero examples (EX): line, cut words + kinds, receipt (say) and the Kept row;
//   - the hero's static first frame (#pf-draft, #pf-sharp, #pf-move, #pf-kept) against EX[0];
//   - the Try tile's pre-rendered default and the final's example card;
//   - the Who tile's four mini posts (WHO): each persona's line and cuts, and the static list drawn by the page's whoHTML;
//   - the Voice tile's never-say words: the demo must cut each one as an opener and as a closer (it can't rewrite these).
// The hero shows the engine's own "why" and "say" verbatim (the say through the page's display-only sayTxt, which since pass 19
// only keeps each part on one line: "Split it into two beats" stays the engine's words), so they are checked (and rewritten by
// --write) like the line.
// The Try default's counter must show its true length.
// Pass 22: the label is the page's own hitK(say, why) ("Why it hits" only for a why that names an effect on the reader, else "What
// changed"), the receipts are drawn by sayHTML (three parts at most, each an unbreakable block), and the final's example must be a
// two-cut (or more) edit whose why names its effect on the reader (marketing-1).
// Since pass 20 the page has no output guard of its own (the engine's v5.4 ship guard is the only one), so an example is what the
// engine returns, and nothing more is checked of it here.
// Sharpened lines are drawn with the page's own display helpers (nb, beats, xbeats), so a wrap falls between beats.
// The Kept rows (one sentence since pass 14: "Kept $SOL, 40% and your lowercase.", with any kept word the engine's note names) come from the page's own keptLine, lifted the same way, and the Try
// default's struck mirror and the final's struck draft are rebuilt by --write with the page's own markup helpers (MARKUP block).
//
const fs = require('fs'), path = require('path');
const ROOT = '/home/user/xyphre1314/hookworthy';
const SRC = path.join(__dirname, 'work/src.html'), TAIL = path.join(__dirname, 'work/tail.txt');
const WRITE = process.argv.includes('--write');
let src = fs.readFileSync(SRC, 'utf8'), tail = fs.readFileSync(TAIL, 'utf8');
/* the engine the page loads: loadCore's s.src ('../../sharpen.js' or '../../core.js') */
const ENG = ((src.match(/s\.src = '\.\.\/\.\.\/((?:sharpen|core)\.js)'/) || [])[1]) || 'core.js';
const CORE = path.join(ROOT, ENG);
const H = require(CORE);
if (!H.sharpenLine) { console.error(ENG + ' has no sharpenLine yet'); process.exit(2); }
console.log('engine:', ENG);
/* the app runs core.js and the page its Sharpen-only bundle: every draft checked here must get the same result from both */
const APP = ENG === 'core.js' ? null : require(path.join(ROOT, 'core.js')), split = [];
/* since pass 12 the built page loads sharpen.min.js (made from sharpen.js by concepts/r86/tools/minify.js, its banner carrying
   sharpen.js's sha256): it must be current, and give the same result as sharpen.js for every draft checked here */
const MINP = path.join(ROOT, 'sharpen.min.js'), MIN = ENG === 'sharpen.js' && fs.existsSync(MINP) ? require(MINP) : null, minSplit = [];
const minStale = MIN && !fs.readFileSync(MINP, 'utf8').split('\n')[0].includes('sha256:' + require('crypto').createHash('sha256').update(fs.readFileSync(CORE)).digest('hex').slice(0, 16));
const sharpenLine = (t, o) => { const R = H.sharpenLine(t, o); if (APP) { const A = APP.sharpenLine(t, o); if (JSON.stringify(A) !== JSON.stringify(R)) split.push(t); }
  if (MIN && JSON.stringify(MIN.sharpenLine(t, o)) !== JSON.stringify(R)) minSplit.push(t); return R; };
const between = (s, a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error('marker ' + a); return s.slice(i + a.length, j); };
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const list = arr => arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1];
const lib = new Function('esc', 'list', `${between(src, '/* EX-START */', '/* EX-END */')}\n${between(src, '/* DRAFT-START */', '/* DRAFT-END */')}\n${between(src, '/* WHO-START */', '/* WHO-END */')}\n${between(src, '/* KEPT-START */', '/* KEPT-END */')}\n${between(src, '/* MARKUP-START */', '/* MARKUP-END */')}\nreturn { EX, WHO, whoHTML, draftHTML, keptLine, FLUFF, nb, beats, xbeats, hitK, sayTxt, sayHTML, segments, mirrorHTML, fpDraftHTML };`)(esc, list);
const { EX, WHO, whoHTML, draftHTML, keptLine, nb, beats, xbeats, hitK, sayTxt, sayHTML, segments, mirrorHTML, fpDraftHTML } = lib;
const bad = [];
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
/* pass 20: the page shows the engine's line as it comes (no page guard), so there is nothing more to check of a line here */
const whole = () => {};
const fromEngine = d => { const R = sharpenLine(d); return { R, after: R.line, cut: R.cut.map(c => [c.text, c.kind]), say: R.say, why: R.why, kept: R.state === 'sharp' ? keptLine(R.draft, R.line, R.kept, R.note) : '' }; };

/* 1. the four hero examples */
const fixed = EX.map((e, i) => {
  const g = fromEngine(e.draft), out = { ...e };
  if (g.R.state !== 'sharp') bad.push(`EX[${i}] ${e.who}: engine says "${g.R.state}" for this draft; pick a draft that sharpens`);
  whole(`EX[${i}] ${e.who}`, g.R);
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
  ['pf-move', /(<span id="pf-move">)([\s\S]*?)(<\/span>)/, sayHTML(e0.say)],
  ['pf-sharp', /(<p class="ptext(?: long)?" id="pf-sharp">)([\s\S]*?)(<\/p>)/, '<span class="sr">Sharpened: </span>' + beats(e0.after, x => nb(esc(x)))],
  ['pf-why', /(<p id="pf-why">)([\s\S]*?)(<\/p>)/, esc(e0.why)],
  ['pf-k', /(<span class="k" id="pf-k">)([\s\S]*?)(<\/span>)/, hitK(e0.say, e0.why)],
  ['pf-kept', /(<p(?: class="[^"]*")? id="pf-kept">)([\s\S]*?)(<\/p>)/, esc(e0.kept)]
];
/* pass 16 (uiux-5): the hero's Cut/Split chip row is gone; the strikes, the receipt and the Kept line say it */
if (/id="pf-cut"/.test(src)) bad.push('static #pf-cut is back (the hero dropped its chip row in pass 16)');
for (const [id, re, want] of STATIC) {
  const m = src.match(re); if (!m) { bad.push(`static #${id} not found`); continue; }
  if (m[2] !== want) { bad.push(`static #${id}\n    page:   ${m[2]}\n    wanted: ${want}`); src = src.replace(re, (all, a, b, c) => a + want + c); }
}
const longCls = e0.after.length > 62;
if (/class="ptext long" id="pf-sharp"/.test(src) !== longCls) { bad.push('static #pf-sharp long class'); src = src.replace(/class="ptext(?: long)?" id="pf-sharp"/, `class="ptext${longCls ? ' long' : ''}" id="pf-sharp"`); }

/* 3. the Try default and the final's example */
const ta = (src.match(/<textarea class="ed-ta" id="try-ta"[^>]*>([\s\S]*?)<\/textarea>/) || [])[1];
if (ta) {
  const g = fromEngine(ta); whole('Try default', g.R);
  const line = (src.match(/<p class="xtext" id="out-line">([\s\S]*?)<\/p>/) || [])[1];
  const struck = [...(src.match(/<div class="ed-mirror struck" id="try-mirror"[^>]*>([\s\S]*?)<\/div>/) || ['', ''])[1].matchAll(/<mark class="c[^"]*"[^>]*>([\s\S]*?)<\/mark>/g)].map(m => m[1]);
  const st = (src.match(/<span id="out-st">([\s\S]*?)<\/span>/) || [])[1], kept = (src.match(/<p(?: class="[^"]*")? id="out-kept">([\s\S]*?)<\/p>/) || [])[1];
  const why = (src.match(/<p id="out-why">([\s\S]*?)<\/p>/) || [])[1];
  const fixSrc = (re, v) => { src = src.replace(re, (all, a, b, c) => a + v + c); };
  if (line !== xbeats(g.after)) { bad.push(`Try default line\n    page:   ${line}\n    engine: ${g.after}`); fixSrc(/(<p class="xtext" id="out-line">)([\s\S]*?)(<\/p>)/, xbeats(g.after)); }
  if (!same(struck.map(x => x.replace(/[:,]$/, '')), g.cut.map(c => esc(c[0])))) bad.push(`Try default strikes\n    page:   ${JSON.stringify(struck)}\n    engine: ${JSON.stringify(g.cut)}`);
  /* the struck mirror is exactly what the page's own mirrorHTML draws for the engine's result */
  const mir = (src.match(/<div class="ed-mirror struck" id="try-mirror"[^>]*>([\s\S]*?)<\/div>/) || [])[1], mirWant = mirrorHTML(ta, segments(g.R, { cut: g.R.cut }, []), true);
  if (mir !== mirWant) { bad.push(`Try default mirror markup\n    page:   ${mir}\n    wanted: ${mirWant}`); src = src.replace(/(<div class="ed-mirror struck" id="try-mirror"[^>]*>)([\s\S]*?)(<\/div>)/, (all, a, b, c) => a + mirWant + c); }
  if (st !== sayHTML(g.say)) { bad.push(`Try default receipt\n    page:   ${st}\n    engine: ${g.say}`); fixSrc(/(<span id="out-st">)([\s\S]*?)(<\/span>)/, sayHTML(g.say)); }
  /* the counter's first paint is the default's true length */
  const cnt = (src.match(/<span class="count tnum" id="try-count"[^>]*>([\s\S]*?)<\/span>/) || [])[1], cntWant = `${ta.length} / 280`;
  if (cnt !== cntWant) { bad.push(`Try default count\n    page:   ${cnt}\n    wanted: ${cntWant}`); src = src.replace(/(<span class="count tnum" id="try-count"[^>]*>)([\s\S]*?)(<\/span>)/, (all, a, b, c) => a + cntWant + c); }
  if (kept !== esc(g.kept)) { bad.push(`Try default kept\n    page:   ${kept}\n    engine: ${g.kept}`); fixSrc(/(<p(?: class="[^"]*")? id="out-kept">)([\s\S]*?)(<\/p>)/, esc(g.kept)); }
  const ok = (src.match(/<span class="k" id="out-k">([\s\S]*?)<\/span>/) || [])[1];
  if (ok !== hitK(g.say, g.R.why)) { bad.push(`Try default label\n    page:   ${ok}\n    wanted: ${hitK(g.say, g.R.why)}`); fixSrc(/(<span class="k" id="out-k">)([\s\S]*?)(<\/span>)/, hitK(g.say, g.R.why)); }
  if (why !== esc(g.R.why)) { bad.push(`Try default why\n    page:   ${why}\n    engine: ${g.R.why}`); fixSrc(/(<p id="out-why">)([\s\S]*?)(<\/p>)/, esc(g.R.why)); }
}
const fpD = (tail.match(/<p class="draft" id="fp-draft">([\s\S]*?)<\/p>/) || [])[1];
if (fpD) {
  const draft = fpD.replace(/<span class="sr">[\s\S]*?<\/span>/, '').replace(/<[^>]+>/g, '').replace(/\u00a0/g, ' ');
  const g = fromEngine(draft); whole('Final example', g.R);
  const struck = [...fpD.matchAll(/<span class="cut(?: sp)?(?: pct)?">([\s\S]*?)<\/span>/g)].map(m => m[1]);
  const line = (tail.match(/<p class="xtext" id="fp-sharp"><span class="sr">Sharpened: <\/span>([\s\S]*?)<\/p>/) || [])[1];
  if (line !== xbeats(g.after)) { bad.push(`Final example line\n    page:   ${line}\n    engine: ${g.after}`); tail = tail.replace(/(<p class="xtext" id="fp-sharp"><span class="sr">Sharpened: <\/span>)([\s\S]*?)(<\/p>)/, (all, a, b, c) => a + xbeats(g.after) + c); }
  if (!same(struck.map(x => x.replace(/[:,]$/, '')), g.cut.map(c => c[0]))) bad.push(`Final example strikes\n    page:   ${JSON.stringify(struck)}\n    engine: ${JSON.stringify(g.cut)}`);
  /* the example's draft is the page's own fpDraftHTML for the engine's result; its strikes aren't toggles (those are for your own line) */
  /* (pass 22: a short word's toggle is "cut tog sm", a split point's "cut tog sp": the static draft keeps only "cut" and its look) */
  const fpWant = fpDraftHTML(draft, segments(g.R, { cut: g.R.cut }, [])).replace(/<span class="cut tog(?: sm)?((?: sp)?(?: pct)?)"[^>]*>/g, '<span class="cut$1">');
  if (fpD !== fpWant) { bad.push(`Final example draft markup\n    page:   ${fpD}\n    wanted: ${fpWant}`); tail = tail.replace(/(<p class="draft" id="fp-draft">)([\s\S]*?)(<\/p>)/, (all, a, b, c) => a + fpWant + c); }
  const fw = (tail.match(/<p id="fp-why">([\s\S]*?)<\/p>/) || [])[1], fk = (tail.match(/<p(?: class="[^"]*")? id="fp-kept">([\s\S]*?)<\/p>/) || [])[1];
  const fixTail = (re, v) => { tail = tail.replace(re, (all, a, b, c) => a + v + c); };
  if (fw !== esc(g.why)) { bad.push(`Final example why\n    page:   ${fw}\n    engine: ${g.why}`); fixTail(/(<p id="fp-why">)([\s\S]*?)(<\/p>)/, esc(g.why)); }
  if (fk !== esc(g.kept)) { bad.push(`Final example kept\n    page:   ${fk}\n    engine: ${g.kept}`); fixTail(/(<p(?: class="[^"]*")? id="fp-kept">)([\s\S]*?)(<\/p>)/, esc(g.kept)); }
  const fkl = (tail.match(/<span class="k" id="fp-k">([\s\S]*?)<\/span>/) || [])[1];
  if (fkl !== hitK(g.say, g.why)) { bad.push(`Final example label\n    page:   ${fkl}\n    wanted: ${hitK(g.say, g.why)}`); fixTail(/(<span class="k" id="fp-k">)([\s\S]*?)(<\/span>)/, hitK(g.say, g.why)); }
  /* pass 22 (marketing-1): the closing example is the page's strongest proof: two cuts or more, and a result whose why names its effect
     on the reader ("Why it hits": the point first), never a one-word cut under a stock line */
  if ((g.R.cut || []).filter(c => !/^(?:move|tight|swap|reshape)$/.test(c.kind)).length < 2) bad.push(`Final example: ${g.R.cut.length} cut(s); the closing example needs two or more (marketing-1)`);
  if (hitK(g.say, g.why) !== 'Why it hits') bad.push('Final example: its why names no effect on the reader, so it reads "What changed" (marketing-1 wants a point-first result)');
  if (g.R.state !== 'sharp') bad.push(`Final example: engine says "${g.R.state}"`);
}

/* 4. the Who tile: each persona's sharpened line is the engine's, and the static list is the page's own whoHTML */
const wfixed = WHO.map((w, i) => {
  const g = fromEngine(w.draft), out = { ...w };
  if (g.R.state !== 'sharp') bad.push(`WHO[${i}] ${w.n}: engine says "${g.R.state}"; pick a draft that sharpens`);
  whole(`WHO[${i}] ${w.n}`, g.R);
  if (w.after !== g.after) { bad.push(`WHO[${i}] ${w.n} line\n    page:   ${w.after}\n    engine: ${g.after}`); out.after = g.after; }
  if (!same(w.cut, g.cut)) { bad.push(`WHO[${i}] ${w.n} cut\n    page:   ${JSON.stringify(w.cut)}\n    engine: ${JSON.stringify(g.cut)}`); out.cut = g.cut; }
  return out;
});
{
  const re = /(<ul class="wposts xcard demo"[^>]*>)([\s\S]*?)(\n      <\/ul>)/, m = src.match(re);
  const want = '\n' + wfixed.map((w, i) => '        ' + whoHTML(w, i)).join('\n');
  if (!m) bad.push('static Who list not found');
  else if (m[2] !== want) { bad.push('static Who list markup'); src = src.replace(re, (all, a, b, c) => a + want + c); }
}

/* 5. the Voice tile's never-say words: each one is a phrase the demo itself cuts where a visitor would type it (tried as an opener
   with a colon, a comma and a "!", and as a closer; at most one of the four may stay), so the page never shows a cut the Try box
   won't make */
{
  const row = (src.match(/<div class="vrow nvr">([\s\S]*?)<\/div>/) || [])[1] || '';
  const words = [...row.matchAll(/<span class="strike">([^<]+)<\/span>/g)].map(m => m[1]);
  if (!words.length) bad.push('Voice never-say list not found');
  const cap = p => p[0].toUpperCase() + p.slice(1);
  for (const p of words) {
    const ctx = [`${cap(p)}: sol flipped eth in daily volume`, `${p}, sol flipped eth in daily volume`, `${cap(p)}! sol flipped eth in daily volume`, `sol flipped eth in daily volume. ${cap(p)}.`];
    const miss = ctx.filter(t => { const R = sharpenLine(t); return !(R.state === 'sharp' && (R.cut || []).some(c => c.text.toLowerCase().replace(/[^a-z' ]/g, '').trim() === p.toLowerCase())); });
    /* a phrase has a natural place (an opener, or a closer): one unnatural form may stay, never two */
    if (miss.length > 1) bad.push(`Voice never-say "${p}": the demo keeps it in ${miss.length} of ${ctx.length} lines (e.g. "${miss[0]}"); pick a phrase the engine cuts`);
    else if (miss.length) console.log(`note: Voice never-say "${p}" stays in "${miss[0]}" (its other ${ctx.length - 1} forms are cut)`);
  }
}

if (WRITE) {
  const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";
  const body = fixed.map(e => `    { who: ${q(e.who)}, handle: ${q(e.handle)}, av: ${q(e.av)}, draft: ${q(e.draft)},\n      cut: [${e.cut.map(c => `[${q(c[0])}, ${q(c[1])}]`).join(', ')}], after: ${q(e.after)}, say: ${q(e.say)},\n      why: ${q(e.why)}, kept: ${q(e.kept)} }`).join(',\n');
  const a = src.indexOf('/* EX-START */'), b = src.indexOf('/* EX-END */');
  src = src.slice(0, a) + `/* EX-START */\n  const EX = [\n${body}\n  ];\n  ` + src.slice(b);
  const wbody = wfixed.map(w => `    { k: ${q(w.k)}, n: ${q(w.n)}, h: ${q(w.h)}, av: ${q(w.av)}, draft: ${q(w.draft)},\n      cut: [${w.cut.map(c => `[${q(c[0])}, ${q(c[1])}]`).join(', ')}], after: ${q(w.after)}${w.studio ? ', studio: true' : ''} }`).join(',\n');
  src = src.replace(/(const WHO = \[\n)[\s\S]*?(\n  \];)/, (all, x, y) => x + wbody + y);
  fs.writeFileSync(SRC, src); fs.writeFileSync(TAIL, tail);
  console.log('wrote', SRC, 'and', TAIL);
}
/* sharpen.js is generated from core.js (node tools/build-sharpen.mjs): a draft they disagree on means it is stale */
if (split.length) console.log(`warning: ${ENG} and core.js disagree on ${split.length} draft(s) here, e.g. "${split[0]}": sharpen.js is stale (node tools/build-sharpen.mjs)`);
else if (APP) console.log(`${ENG} and core.js agree on every draft checked`);
if (MIN) { if (minStale) bad.push('sharpen.min.js is stale: sharpen.js changed since it was made (run build.py, which remakes it)');
  if (minSplit.length) bad.push(`sharpen.min.js and sharpen.js disagree on ${minSplit.length} draft(s), e.g. "${minSplit[0]}"`);
  else console.log(`sharpen.min.js ${minStale ? 'is STALE' : 'is current'} and agrees with sharpen.js on every draft checked`); }
if (bad.length) { console.log(`${bad.length} mismatch(es):\n- ` + bad.join('\n- ')); process.exit(WRITE ? 0 : 1); }
console.log(`hero-sync: every example matches HWCore.sharpenLine (${ENG})`);
