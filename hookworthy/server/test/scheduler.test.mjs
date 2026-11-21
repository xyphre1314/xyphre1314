import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-sched-'));
const Q = await import('../lib/scheduler.mjs');
const { write } = await import('../lib/store.mjs');
const NOW = Date.parse('2026-10-02T12:00:00Z');
const item = (id, extra) => ({ id, at: '2026-10-02T11:00:00Z', posts: [{ text: 'hi', media: [] }], platforms: ['x'], status: 'scheduled', results: {}, ...extra });

test('add rejects a time more than 2 minutes in the past, allows small clock skew', () => {
  write('queue', []);
  assert.throws(() => Q.add({ posts: ['late'], at: new Date(NOW - 3 * 60e3).toISOString(), platforms: { x: true } }, NOW), e => e.status === 400 && e.code === 'past' && /already passed/.test(e.message));
  const ok = Q.add({ posts: ['skew'], at: new Date(NOW - 60e3).toISOString(), platforms: { x: true } }, NOW);
  assert.equal(ok.status, 'scheduled');
});

test('posts stuck in "posting" after a crash go back to scheduled, then fail with a reason', () => {
  const old = new Date(NOW - 30 * 60e3).toISOString(), fresh = new Date(NOW - 60e3).toISOString();
  write('queue', [
    item('stuck', { status: 'posting', postingAt: old }),
    item('fresh', { status: 'posting', postingAt: fresh }),
    item('half', { status: 'posting', postingAt: old, platforms: ['x', 'linkedin'], results: { x: { ok: true, ids: ['1'] } } }),
    item('legacy', { status: 'posting', at: old }),
    item('tired', { status: 'posting', postingAt: old, retries: 2 }),
    item('waiting')
  ]);
  const r = Q.recover(NOW, { staleMin: 10, maxRetries: 2 });
  assert.deepEqual(r.requeued.sort(), ['half', 'legacy', 'stuck']); assert.deepEqual(r.failed, ['tired']);
  const by = Object.fromEntries(Q.list().map(i => [i.id, i]));
  assert.equal(by.stuck.status, 'scheduled'); assert.equal(by.stuck.retries, 1); assert.match(by.stuck.lastError, /Interrupted/); assert.equal(by.stuck.postingAt, undefined);
  assert.equal(by.fresh.status, 'posting', 'a post that might still be going out is left alone');
  assert.deepEqual(by.half.platforms, ['linkedin'], 'what already went out is not posted again');
  assert.equal(by.tired.status, 'failed'); assert.equal(by.tired.retries, 3); assert.match(by.tired.error, /Interrupted while posting 3 times/);
  assert.equal(by.waiting.status, 'scheduled'); assert.equal(by.waiting.retries, undefined);
});

test('tick keeps earlier per-platform results and records each one as it lands', async () => {
  write('queue', [item('retry', { platforms: ['linkedin'], results: { x: { ok: true, ids: ['9'] } }, retries: 1 })]);
  await Q.tick(NOW);
  const i = Q.list()[0];
  assert.equal(i.status, 'partial'); assert.equal(i.results.x.ok, true); assert.equal(i.results.linkedin.ok, false);
  assert.equal(i.postingAt, undefined);
});

test('drop: removes a waiting post, says why it cannot remove others', () => {
  write('queue', [item('a'), item('b', { status: 'posting' })]);
  assert.deepEqual(Q.drop('a'), { removed: true, id: 'a', status: 'removed' });
  assert.deepEqual(Q.drop('a'), { removed: false, id: 'a', status: 'missing' });
  assert.deepEqual(Q.drop('b'), { removed: false, id: 'b', status: 'posting' });
});
