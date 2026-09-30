/* Typefully import: your published (and scheduled) drafts through Typefully's API.
   The key is used for this one request and never stored. */
const BASE = process.env.TYPEFULLY_API_BASE || 'https://api.typefully.com/v1';
export class TFError extends Error { constructor(status, message) { super(message); this.status = status; } }

export async function importDrafts(key) {
  if (!key || typeof key !== 'string' || key.length < 8) throw new TFError(400, 'Paste your Typefully API key');
  const get = async path => {
    const r = await fetch(BASE + path, { headers: { 'X-API-KEY': `Bearer ${key}`, accept: 'application/json' } });
    if (r.status === 401 || r.status === 403) throw new TFError(401, 'Typefully rejected that key');
    if (!r.ok) throw new TFError(r.status, `Typefully ${r.status}`);
    return r.json();
  };
  const pub = await get('/drafts/recently-published/');
  let sched = []; try { sched = await get('/drafts/recently-scheduled/'); } catch { /* optional */ }
  const list = [...(Array.isArray(pub) ? pub : pub.results || []), ...(Array.isArray(sched) ? sched : sched.results || [])];
  return list;
}
