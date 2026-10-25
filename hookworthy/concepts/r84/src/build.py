# Usage: python3 build.py -> assembles src.html + sprite.txt + tail.txt into concepts/r84/home.html
import os
d = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(d, 'src.html')).read()
sprite = open(os.path.join(d, 'sprite.txt')).read()
tail = open(os.path.join(d, 'tail.txt')).read()
hw = '  <symbol id="hw" viewBox="0 0 32 32"><path d="M10 6.5V25.5M10 16.25a4.9 4.9 0 0 1 9.8 0V21.4a3 3 0 0 0 6 0V18.8" fill="none" stroke="#F2F2F2" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></symbol>\n</svg>'
sprite = sprite.rstrip()
assert sprite.endswith('</svg>')
sprite = sprite[:-len('</svg>')] + hw.lstrip()
out = src.replace('<!--SPRITE-->', sprite).replace('<!--TAIL-->', tail.rstrip())
assert '<!--' + 'SPRITE-->' not in out and '<!--' + 'TAIL-->' not in out
open('/home/user/xyphre1314/hookworthy/concepts/r84/home.html', 'w').write(out)
print('ok', len(out))
