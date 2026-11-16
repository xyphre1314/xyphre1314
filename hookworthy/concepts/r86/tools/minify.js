// Minifier for the homepage build (no network, no npm install): strips comments and whitespace, never renames anything.
//   node minify.js page <in.html> <out.html>        inline <script> and <style> minified, HTML comments dropped
//   node minify.js js <in.js> <out.js> [banner]      one script file (sharpen.js -> sharpen.min.js), banner kept as a first-line comment
// Uses terser when it is installed (require.resolve('terser')); otherwise TypeScript's own parser (the global `typescript` package,
// already on this machine) tokenizes the JS exactly: regexes, templates and strings are copied verbatim, a newline is kept wherever
// ASI or a restricted production could depend on it, and every result is re-parsed and must give the identical syntax tree, token
// for token, or the build stops. CSS goes through a small scanner (strings, url() and comments respected) that only removes
// comments and spaces the grammar never needs.
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const TS_PATHS = [path.join(path.dirname(process.execPath), '../lib/node_modules/typescript'), '/opt/node22/lib/node_modules/typescript', 'typescript'];
let ts = null; for (const p of TS_PATHS) { try { ts = require(p); break; } catch (e) { } }
const K = ts && ts.SyntaxKind;

function leaves(sf) {
  const out = [];
  (function walk(n) {
    if (n.kind >= K.FirstJSDocNode && n.kind <= K.LastJSDocNode) return;
    const kids = n.getChildren(sf);
    if (!kids.length) { if (n.kind !== K.EndOfFileToken) out.push(n); return; }
    kids.forEach(walk);
  })(sf);
  return out;
}
function shape(sf) { const s = []; (function walk(n) { s.push(n.kind); ts.forEachChild(n, walk); })(sf); return s.join(','); }
function parse(src) {
  const sf = ts.createSourceFile('x.js', src, ts.ScriptTarget.Latest, true, ts.ScriptKind.JS);
  if (sf.parseDiagnostics && sf.parseDiagnostics.length) throw new Error('parse error: ' + sf.parseDiagnostics.map(d => ts.flattenDiagnosticMessageText(d.messageText, ' ') + ' @' + d.start).slice(0, 3).join('; '));
  return sf;
}
const WORD = /[A-Za-z0-9_$\\\u0080-\uffff]/;
function minJSts(src) {
  const sf = parse(src), T = leaves(sf);
  /* after these a statement can't end, so a line break that follows them can never be where ASI steps in */
  const SAFE_PREV = new Set([K.OpenBraceToken, K.OpenParenToken, K.OpenBracketToken, K.CommaToken, K.SemicolonToken, K.ColonToken, K.QuestionToken,
    K.EqualsToken, K.PlusEqualsToken, K.MinusEqualsToken, K.AsteriskEqualsToken, K.SlashEqualsToken, K.PercentEqualsToken, K.AmpersandEqualsToken, K.BarEqualsToken,
    K.CaretEqualsToken, K.QuestionQuestionEqualsToken, K.BarBarEqualsToken, K.AmpersandAmpersandEqualsToken, K.EqualsEqualsToken, K.EqualsEqualsEqualsToken,
    K.ExclamationEqualsToken, K.ExclamationEqualsEqualsToken, K.AmpersandAmpersandToken, K.BarBarToken, K.QuestionQuestionToken, K.EqualsGreaterThanToken,
    K.DotToken, K.QuestionDotToken, K.LessThanToken, K.GreaterThanToken, K.LessThanEqualsToken, K.GreaterThanEqualsToken, K.PlusToken, K.MinusToken,
    K.AsteriskToken, K.SlashToken, K.PercentToken, K.AsteriskAsteriskToken, K.AmpersandToken, K.BarToken, K.CaretToken, K.ExclamationToken, K.TildeToken,
    K.LessThanLessThanToken, K.GreaterThanGreaterThanToken, K.GreaterThanGreaterThanGreaterThanToken, K.DotDotDotToken]);
  /* before these the line break never changes the parse (a "}" ends a statement by itself; the rest continue an expression) */
  const SAFE_CUR = new Set([K.CloseBraceToken, K.CloseParenToken, K.CloseBracketToken, K.CommaToken, K.SemicolonToken, K.DotToken, K.QuestionDotToken, K.ColonToken]);
  let out = '', prev = null;
  for (const t of T) {
    const st = t.getStart(sf), txt = src.slice(st, t.end);
    if (prev) {
      const gap = src.slice(prev.end, st), nl = /[\n\r\u2028\u2029]/.test(gap);
      const lc = out[out.length - 1], fc = txt[0];
      if (nl && !SAFE_PREV.has(prev.kind) && !SAFE_CUR.has(t.kind)) out += '\n';
      else if ((WORD.test(lc) && WORD.test(fc)) || (lc === '+' && fc === '+') || (lc === '-' && fc === '-') || (lc === '/' && (fc === '/' || fc === '*'))
        || (prev.kind === K.NumericLiteral && fc === '.') || (lc === '<' && fc === '!') || (lc === '-' && fc === '>')) out += nl ? '\n' : ' ';
    }
    out += txt; prev = t;
  }
  return out;
}
/* the result must be the same program: the same tokens (kind and text) and the same tree */
function verifyJS(a, b) {
  const A = parse(a), B = parse(b), ta = leaves(A).map(t => t.kind + ':' + t.getText(A)), tb = leaves(B).map(t => t.kind + ':' + t.getText(B));
  if (ta.length !== tb.length) throw new Error(`token count ${ta.length} -> ${tb.length}`);
  for (let i = 0; i < ta.length; i++) if (ta[i] !== tb[i]) throw new Error(`token ${i}: ${ta[i]} -> ${tb[i]}`);
  if (shape(A) !== shape(B)) throw new Error('syntax tree differs');
}
let terser = null; try { terser = require(require.resolve('terser')); } catch (e) { }
async function minJS(src) {
  if (terser) { const r = await terser.minify(src, { compress: false, mangle: { toplevel: false }, format: { comments: false } }); return { code: r.code, via: 'terser' }; }
  if (!ts) throw new Error('no minifier: neither terser nor typescript is installed');
  const code = minJSts(src); verifyJS(src, code); return { code, via: 'typescript scanner' };
}

function minCSS(css) {
  /* tokens: strings and unquoted url(...) are copied verbatim, comments go, whitespace runs become one space */
  const T = []; let i = 0; const n = css.length;
  while (i < n) {
    const c = css[i];
    if (c === '/' && css[i + 1] === '*') { const e = css.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; T.push({ ws: true }); continue; }
    if (c === '"' || c === "'") { let j = i + 1; while (j < n && css[j] !== c) { if (css[j] === '\\') j++; j++; } T.push({ s: css.slice(i, j + 1) }); i = j + 1; continue; }
    if (/\s/.test(c)) { let j = i; while (j < n && /\s/.test(css[j])) j++; T.push({ ws: true }); i = j; continue; }
    if (c === '(' && /url$/i.test(css.slice(Math.max(0, i - 3), i))) { let j = i + 1; while (j < n && /\s/.test(css[j])) j++;
      if (css[j] !== '"' && css[j] !== "'") { const e = css.indexOf(')', j); T.push({ s: '(' + css.slice(j, e).trim() + ')' }); i = e + 1; continue; } }
    T.push({ c }); i++;
  }
  /* is the ":" at token k a declaration's (the next of { ; } is not a "{")? Then the space after it is optional */
  const declColon = k => { for (let j = k + 1; j < T.length; j++) { const c = T[j].c; if (c === '{') return false; if (c === ';' || c === '}') return true; } return true; };
  let out = '', lastNonWs = -1;
  const DROP_AFTER = '{};,>(', DROP_BEFORE = '{};,>)';
  for (let k = 0; k < T.length; k++) {
    const t = T[k];
    if (t.ws) {
      if (!out) continue; let q = k + 1; while (q < T.length && T[q].ws) q++; if (q >= T.length) continue;
      const p = out[out.length - 1], nx = T[q].c;
      if (DROP_AFTER.includes(p) || (nx && DROP_BEFORE.includes(nx)) || (p === ':' && T[lastNonWs].c === ':' && declColon(lastNonWs))) { k = q - 1; continue; }
      out += ' '; k = q - 1; continue;
    }
    if (t.c === '}' && out.endsWith(';') && T[lastNonWs] && T[lastNonWs].c === ';') out = out.slice(0, -1);
    out += t.s !== undefined ? t.s : t.c; lastNonWs = k;
  }
  return out;
}

async function minPage(html) {
  const vias = new Set(); let js0 = 0, js1 = 0, css0 = 0, css1 = 0;
  const parts = []; let last = 0; const rx = /<(script|style)(\s[^>]*)?>([\s\S]*?)<\/\1>|<!--[\s\S]*?-->/gi; let m;
  while ((m = rx.exec(html))) {
    parts.push(html.slice(last, m.index)); last = rx.lastIndex;
    if (!m[1]) continue; /* an HTML comment: dropped */
    const tag = m[1].toLowerCase(), attrs = m[2] || '', body = m[3];
    if (tag === 'style') { const c = minCSS(body); css0 += body.length; css1 += c.length; parts.push(`<style${attrs}>${c}</style>`); continue; }
    if (/\bsrc=/.test(attrs) || (/\btype=/.test(attrs) && !/type="(?:text\/javascript|module)"/.test(attrs))) { parts.push(m[0]); continue; }
    const r = await minJS(body); vias.add(r.via); js0 += body.length; js1 += r.code.length;
    if (/<\/script/i.test(r.code)) throw new Error('minified script holds </script');
    parts.push(`<script${attrs}>${r.code}</script>`);
  }
  parts.push(html.slice(last));
  return { html: parts.join(''), via: [...vias].join(', '), js: [js0, js1], css: [css0, css1] };
}
const gz = s => zlib.gzipSync(Buffer.from(s), { level: 9 }).length;
module.exports = { minJS, minCSS, minPage, verifyJS, gz };

if (require.main === module) (async () => {
  /* "-" reads stdin / writes stdout (the build pipes the assembled page through, with no temp file) */
  const [mode, inp, outp, banner] = process.argv.slice(2), src = fs.readFileSync(inp === '-' ? 0 : inp, 'utf8');
  const write = (o, s) => o === '-' ? process.stdout.write(s) : fs.writeFileSync(o, s), log = o => (outp === '-' ? console.error : console.log)(o);
  if (mode === 'page') {
    const r = await minPage(src); write(outp, r.html);
    log(JSON.stringify({ via: r.via, raw: [Buffer.byteLength(src), Buffer.byteLength(r.html)], gzip: [gz(src), gz(r.html)], js: r.js, css: r.css }));
  } else if (mode === 'js') {
    const r = await minJS(src), code = (banner ? `/*! ${banner} */\n` : '') + r.code + '\n'; write(outp, code);
    log(JSON.stringify({ via: r.via, raw: [Buffer.byteLength(src), Buffer.byteLength(code)], gzip: [gz(src), gz(code)] }));
  } else { console.error('usage: node minify.js page|js <in> <out> [banner]'); process.exit(2); }
})().catch(e => { console.error('minify failed:', e.message); process.exit(1); });
