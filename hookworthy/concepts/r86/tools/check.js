// node check.js <id>  (NODE_PATH=/opt/node22/lib/node_modules; run up.sh first)
// Loads http://127.0.0.1:8765/concepts/r86/<id>.html at 1440, 390 and 360 and reports: page errors, failed requests,
// horizontal overflow, h1/h2 headings over two lines, banned words in visible text, and axe (wcag2a/aa) violations.
const { chromium } = require('playwright');
const fs = require('fs');
const id = process.argv[2] || 'home';
const URL = `http://127.0.0.1:8765/concepts/r86/${id}.html`;
const AXE = fs.readFileSync('/tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/crit/a11y/package/axe.min.js', 'utf8');
const BANNED = /\b(unlock|supercharge|leverage|elevate|seamless|game-?changer|delve|ai-powered)\b/gi;
const W = [['d', 1440, 900], ['m', 390, 844], ['360', 360, 780]];
(async () => {
  const b = await chromium.launch();
  const out = { errors: [], failed: [], overflow: {}, headings: [], banned: [], axe: {} };
  for (const [k, w, h] of W) {
    const p = await (await b.newContext({ viewport: { width: w, height: h } })).newPage();
    p.on('pageerror', e => out.errors.push(`${k}: ${e.message}`));
    p.on('console', m => { if (m.type() === 'error') out.errors.push(`${k} console: ${m.text()}`); });
    p.on('requestfailed', r => out.failed.push(`${k}: ${r.url()}`));
    p.on('response', r => { if (r.status() >= 400) out.failed.push(`${k}: ${r.status()} ${r.url()}`); });
    await p.goto(URL, { waitUntil: 'networkidle' });
    await p.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 40)); } window.scrollTo(0, 0); });
    await p.waitForTimeout(600);
    out.overflow[k] = await p.evaluate(() => Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
    if (k !== '360') {
      const hs = await p.evaluate(() => [...document.querySelectorAll('h1,h2')].filter(e => e.offsetParent).map(e => {
        const r = document.createRange(); r.selectNodeContents(e); const lines = new Set([...r.getClientRects()].map(x => Math.round(x.top))).size;
        return { t: e.textContent.trim().slice(0, 60), lines };
      }).filter(x => x.lines > 2));
      hs.forEach(x => out.headings.push(`${k}: ${x.lines} lines: ${x.t}`));
      const txt = await p.evaluate(() => document.body.innerText);
      (txt.match(BANNED) || []).forEach(x => out.banned.push(`${k}: ${x}`));
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document, { runOnly: ['wcag2a', 'wcag2aa'] })).violations.map(x => `${x.id} (${x.nodes.length})`));
      out.axe[k] = v;
    }
    await p.close();
  }
  await b.close();
  out.ok = !out.errors.length && !out.failed.length && Object.values(out.overflow).every(v => !v) && !out.headings.length && !out.banned.length && Object.values(out.axe).every(v => !v.length);
  console.log(JSON.stringify(out, null, 1));
})();
