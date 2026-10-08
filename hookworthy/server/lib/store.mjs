/* Tiny JSON-file store: OAuth tokens and the posting queue. One process, one file per key. */
import { readFileSync, writeFileSync, mkdirSync, renameSync } from 'node:fs';
import { join } from 'node:path';

const DIR = process.env.HW_DATA_DIR || join(process.cwd(), 'data');
mkdirSync(DIR, { recursive: true });
const cache = new Map();

export function read(key, fallback) {
  if (cache.has(key)) return cache.get(key);
  let v = fallback;
  try { v = JSON.parse(readFileSync(join(DIR, key + '.json'), 'utf8')); } catch { /* first run */ }
  cache.set(key, v); return v;
}
export function write(key, value) {
  cache.set(key, value);
  const f = join(DIR, key + '.json'), tmp = f + '.tmp';
  writeFileSync(tmp, JSON.stringify(value, null, 2), { mode: 0o600 }); renameSync(tmp, f);
}
