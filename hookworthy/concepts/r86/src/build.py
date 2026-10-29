# Usage: python3 build.py -> assembles src.html + sprite.txt + tail.txt into concepts/r86/home.html
import os
d = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(d, 'src.html')).read()
sprite = open(os.path.join(d, 'sprite.txt')).read()
tail = open(os.path.join(d, 'tail.txt')).read()
# the app icon's glyph: the wordmark's own h (flat stem, Inter 600 weight), on the 32px icon grid
hw = '  <symbol id="hw" viewBox="0 0 32 32"><g transform="translate(8.1 6.8) scale(.8) translate(-8 -4.5)" fill="none" stroke="#F7F8F8" stroke-width="3.9" stroke-linejoin="round"><path d="M10 4.5V27.5"/><path d="M10 17.9a4.9 4.9 0 0 1 9.8 0V22.4a3.1 3.1 0 0 0 6.2 0V20.6" stroke-linecap="round"/></g></symbol>\n</svg>'
sprite = sprite.rstrip()
assert sprite.endswith('</svg>')
sprite = sprite[:-len('</svg>')] + hw.lstrip()
out = src.replace('<!--SPRITE-->', sprite).replace('<!--TAIL-->', tail.rstrip())
assert '<!--' + 'SPRITE-->' not in out and '<!--' + 'TAIL-->' not in out
open('/home/user/xyphre1314/hookworthy/concepts/r86/home.html', 'w').write(out)
print('ok', len(out))
