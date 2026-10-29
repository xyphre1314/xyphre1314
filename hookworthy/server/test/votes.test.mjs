import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-vote-'));

test('hook vote: public link, one vote per person (changeable), no voter list leaks', async () => {
  const VO = await import('../lib/votes.mjs');
  assert.throws(() => VO.createVote({ options: ['only one'] }), /at least two/);
  assert.throws(() => VO.createVote({ options: ['Same line', 'same line'] }), /same/);
  const v = VO.createVote({ options: ['I raised prices 40%.', 'Pricing is a product decision.', '', 'Charge more.'], author: 'Sam' });
  assert.equal(v.options.length, 3); assert.equal(v.author, 'Sam'); assert.equal(v.total, 0);
  const a = 'voter-aaaaaaaaaaaa', b = 'voter-bbbbbbbbbbbb';
  VO.castVote(v.id, { choice: 0, voter: a }); VO.castVote(v.id, { choice: 0, voter: b }); const r = VO.castVote(v.id, { choice: 2, voter: a });
  assert.deepEqual(r.counts, [1, 0, 1]); assert.equal(r.total, 2); assert.equal(r.mine, 2); assert.ok(!('voters' in r));
  assert.deepEqual(VO.castVote(v.id, { choice: 2, voter: a }).counts, [1, 0, 1], 'same vote twice counts once');
  assert.throws(() => VO.castVote(v.id, { choice: 9, voter: a }), /Pick one/); assert.throws(() => VO.castVote(v.id, { choice: 0, voter: 'x' }), /voter/);
  assert.throws(() => VO.getVote('nope-nope-nope'), e => e.status === 404); assert.equal(VO.mineFor(v.id, b), 0);
});
