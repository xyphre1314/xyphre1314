/* Media for posts: images and GIFs are uploaded here once (from the editor, or fetched from GIPHY),
   kept on disk next to the queue, and attached to X and LinkedIn when the post goes out. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { read, write } from './store.mjs';

const DIR = join(process.env.HW_DATA_DIR || join(process.cwd(), 'data'), 'media');
mkdirSync(DIR, { recursive: true });
export class MediaError extends Error { constructor(status, message) { super(message); this.status = status; } }
const TYPES = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp', 'image/gif': 'gif' };
export const LIMITS = { image: 5 * 1024 * 1024, gif: 15 * 1024 * 1024 };
/* only GIPHY's media hosts can be fetched by URL (no open proxy, no internal addresses) */
const ALLOWED_HOSTS = /(^|\.)giphy\.com$/i;
const sniff = b => b[0] === 0x89 && b[1] === 0x50 ? 'image/png' : b[0] === 0xff && b[1] === 0xd8 ? 'image/jpeg' : b.slice(0, 3).toString() === 'GIF' ? 'image/gif' : b.slice(0, 4).toString() === 'RIFF' && b.slice(8, 12).toString() === 'WEBP' ? 'image/webp' : null;

export async function saveMedia({ data, url, alt = '' } = {}) {
  let buf;
  if (typeof data === 'string' && data) { buf = Buffer.from(data.replace(/^data:[^,]*,/, ''), 'base64'); }
  else if (typeof url === 'string' && url) {
    let u; try { u = new URL(url); } catch { throw new MediaError(400, 'That media link is not valid'); }
    if (u.protocol !== 'https:' || !ALLOWED_HOSTS.test(u.hostname)) throw new MediaError(400, 'Only GIPHY links can be attached by URL. Upload the file instead.');
    const r = await fetch(u); if (!r.ok) throw new MediaError(502, `Couldn’t fetch that GIF (${r.status})`);
    if (r.url && !ALLOWED_HOSTS.test(new URL(r.url).hostname)) throw new MediaError(400, 'That GIF link redirected somewhere else');
    if (+r.headers.get('content-length') > LIMITS.gif) throw new MediaError(413, 'GIFs can be up to 15 MB on X');
    buf = Buffer.from(await r.arrayBuffer());
  } else throw new MediaError(400, 'Send the file or a GIPHY link');
  const mime = sniff(buf); if (!mime) throw new MediaError(415, 'PNG, JPEG, WebP or GIF only');
  const kind = mime === 'image/gif' ? 'gif' : 'image';
  if (buf.length > LIMITS[kind]) throw new MediaError(413, kind === 'gif' ? 'GIFs can be up to 15 MB on X' : 'Images can be up to 5 MB on X');
  const id = createHash('sha256').update(buf).digest('hex').slice(0, 24);
  const file = join(DIR, `${id}.${TYPES[mime]}`); if (!existsSync(file)) writeFileSync(file, buf, { mode: 0o600 });
  const reg = read('media', {}); reg[id] = { id, mime, kind, bytes: buf.length, alt: String(alt || '').slice(0, 1000), at: Date.now() }; write('media', reg);
  return reg[id];
}
export function getMedia(id) {
  const m = read('media', {})[String(id)]; if (!m) throw new MediaError(404, 'That attachment is gone. Add it again.');
  return { ...m, buf: readFileSync(join(DIR, `${m.id}.${TYPES[m.mime]}`)) };
}
