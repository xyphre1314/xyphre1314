# The published preview only: the Try box asks Claude (the viewer's own Claude account, via the artifact's `sample`
# capability) with the app's exact Sharpen prompt, runs the app's validator on the reply, and swaps the line in.
# The on-device line still lands first and stays when Claude is unavailable, declined, slow or rejected.
# The repo's home.html is untouched: it keeps its on-device demo and its copy.
def patch(out):
    R = []
    def rep(a, b):
        assert out_[0].count(a) == 1, a[:80]
        out_[0] = out_[0].replace(a, b)
    out_ = [out]
    rep('<span class="tl2"> On this page, nothing leaves your device.</span>', '<span class="tl2"> Here Claude sharpens it, as in the app.</span>')
    rep('This demo runs on your device; in the app, Claude makes the edit.', 'In this preview, the Try box asks Claude too, on your own Claude account, and the on-device line shows while it thinks.')
    rep('<p class="sr" id="try-status" role="status"></p>', '<p class="try-cl" id="try-claude" aria-live="polite" hidden></p>\n          <p class="sr" id="try-status" role="status"></p>')
    css = ('<style>.try-cl{margin:10px 0 0;font-size:13px;line-height:1.4;color:var(--ink-3);display:flex;gap:8px;align-items:center}'
           '.try-cl::before{content:"";flex:none;width:6px;height:6px;border-radius:50%;background:currentColor;opacity:.7}'
           '.try-cl.wait::before{background:#FFAA80;animation:tcl 1.1s ease-in-out infinite}'
           '@keyframes tcl{50%{opacity:.25}}@media (prefers-reduced-motion:reduce){.try-cl.wait::before{animation:none}}</style>\n')
    out_[0] = out_[0].replace('</title>\n', '</title>\n' + css, 1)
    fn = r'''/* preview only: Claude's line, from the app's own prompt and validator; the on-device line stays if anything fails */
  let cGen = 0, cOff = false;
  const cSample = (window.claude && typeof window.claude.use === 'function') ? window.claude.use('sample').catch(() => null) : Promise.resolve(null);
  async function claudeSwap(text, keep, how, word) {
    const lab = $('#try-claude'), H = E(), g = ++cGen;
    if (cOff || !H || !H.prompts || !H.SHARPEN || !R || R.state === 'empty' || R.state === 'thin') { lab.hidden = true; return; }
    const S = await cSample; if (!S) { lab.hidden = true; return; }
    if (g !== cGen) return;
    lab.className = 'try-cl wait'; lab.textContent = 'Asking Claude for the app’s version…'; lab.hidden = false;
    try {
      const P = H.prompts.sharpen({ text, keep });
      const data = await S.json(P.cached + '\n\n' + P.prompt, { modelTier: 'complex' });
      if (g !== cGen || ta.value !== text) return;
      const C = H.SHARPEN.fromClaude(text, data, { keep });
      lab.className = 'try-cl';
      if (!C) { lab.textContent = 'Claude’s version didn’t pass the safety check, so this is the on-device line.'; return; }
      R = C; ver = 0; render(how === 'back' ? 'back' : 'alt', word);
      lab.textContent = C.state === 'sharp' ? 'Sharpened with Claude, the way the app does it.' : 'Claude says it’s already sharp.';
    } catch (e) {
      if (g !== cGen) return;
      lab.className = 'try-cl';
      if (e && e.code === 'not_granted') { cOff = true; lab.textContent = 'On-device line. Allow Claude to see the app’s version.'; }
      else lab.textContent = 'Claude didn’t answer this time, so this is the on-device line.';
    }
  }
  async function go() {'''
    rep('  async function go() {', '  ' + fn)
    rep("R = H.sharpenLine(ta.value, { keep: keepT });\n    render('go');", "R = H.sharpenLine(ta.value, { keep: keepT });\n    render('go'); claudeSwap(ta.value, keepT.slice(), 'go');")
    rep("    render('back', w);\n", "    render('back', w); claudeSwap(ta.value, keepT.slice(), 'back', w);\n")
    rep("ta.addEventListener('input', () => { touched = true;", "ta.addEventListener('input', () => { cGen++; $('#try-claude').hidden = true; touched = true;")
    return out_[0]
