# Usage: python3 build.py -> assembles src.html + sprite.txt + tail.txt into concepts/r86/home.html (minified)
#   The sources stay readable; only the built page is minified (inline <script> and <style>, HTML comments dropped) by
#   concepts/r86/tools/minify.js, and it loads ../../sharpen.min.js, which minify.js makes from sharpen.js (the source; never edited
#   here). sharpen.min.js's banner carries sharpen.js's sha256, so a stale copy is remade on the next build.
#   assemble() returns the readable page (hero-sync and build_pub.py use the sources, never the minified page).
import os, sys, subprocess, hashlib
d = os.path.dirname(os.path.abspath(__file__))
H = '/home/user/xyphre1314/hookworthy'
TOOLS = f'{H}/concepts/r86/tools'
OUT = f'{H}/concepts/r86/home.html'
LOAD_SRC, LOAD_MIN = "s.src = '../../sharpen.js'", "s.src = '../../sharpen.min.js'"

def assemble():
    src = open(os.path.join(d, 'src.html'), encoding='utf-8').read()
    sprite = open(os.path.join(d, 'sprite.txt'), encoding='utf-8').read()
    tail = open(os.path.join(d, 'tail.txt'), encoding='utf-8').read()
    # the app icon's glyph: the wordmark's own h (flat stem, Inter 600 weight), on the 32px icon grid
    hw = '  <symbol id="hw" viewBox="0 0 32 32"><g transform="translate(8.1 6.8) scale(.8) translate(-8 -4.5)" fill="none" stroke="#F7F8F8" stroke-width="3.9" stroke-linejoin="round"><path d="M10 4.5V27.5"/><path d="M10 17.5a4.9 4.9 0 0 1 9.8 0V22.75a3.1 3.1 0 0 0 6.2 0V19" stroke-linecap="butt"/></g></symbol>\n</svg>'
    sprite = sprite.rstrip()
    assert sprite.endswith('</svg>')
    sprite = sprite[:-len('</svg>')] + hw.lstrip()
    out = src.replace('<!--SPRITE-->', sprite).replace('<!--TAIL-->', tail.rstrip())
    assert '<!--' + 'SPRITE-->' not in out and '<!--' + 'TAIL-->' not in out
    return out

def sharpen_min():
    """(re)make ../../sharpen.min.js from sharpen.js when sharpen.js has changed since the last one"""
    raw = open(f'{H}/sharpen.js', 'rb').read(); h = hashlib.sha256(raw).hexdigest()[:16]; mp = f'{H}/sharpen.min.js'
    if os.path.exists(mp):
        with open(mp, encoding='utf-8') as f:
            if f'sha256:{h}' in f.readline(): return h
    banner = f'sharpen.min.js, generated from sharpen.js (sha256:{h}) by concepts/r86/tools/minify.js. Edit core.js, not this'
    r = subprocess.run(['node', f'{TOOLS}/minify.js', 'js', f'{H}/sharpen.js', mp, banner], capture_output=True, text=True, timeout=100)
    if r.returncode: raise SystemExit('sharpen.min.js: ' + r.stderr.strip())
    print('sharpen.min.js', r.stdout.strip()); return h

def minify(page):
    r = subprocess.run(['node', f'{TOOLS}/minify.js', 'page', '-', '-'], input=page, capture_output=True, text=True, timeout=100)
    if r.returncode: raise SystemExit('minify: ' + r.stderr.strip())
    return r.stdout, r.stderr.strip()

def built(page=None):
    """the page as served: minified, loading sharpen.min.js"""
    page = page or assemble()
    assert page.count(LOAD_SRC) == 1, 'loadCore no longer loads ../../sharpen.js'
    sharpen_min()
    return minify(page.replace(LOAD_SRC, LOAD_MIN))

if __name__ == '__main__':
    out, stats = built()
    open(OUT, 'w', encoding='utf-8').write(out)
    print('ok', len(out.encode('utf-8')), stats)
