import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs'; import { tmpdir } from 'node:os'; import { join } from 'node:path';
process.env.HW_DATA_DIR = mkdtempSync(join(tmpdir(), 'hw-x-'));
const X = await import('../lib/x.mjs');

test('X plan: paid plans get 25,000 characters, everyone else 280', () => {
  assert.deepEqual(X.tierOf({ subscription_type: 'Premium' }), { paid: true, plan: 'Premium', source: 'subscription_type', limit: 25000 });
  assert.equal(X.tierOf({ subscription_type: 'PremiumPlus' }).paid, true);
  assert.equal(X.tierOf({ subscription_type: 'Basic' }).limit, 25000);
  assert.deepEqual(X.tierOf({ subscription_type: 'None', verified_type: 'none' }), { paid: false, plan: 'Free', source: 'subscription_type', limit: 280 });
  assert.equal(X.tierOf({ verified_type: 'blue' }).paid, true, 'blue check without subscription_type still counts');
  assert.equal(X.tierOf({ verified_type: 'business' }).paid, false);
  assert.equal(X.tierOf({}).limit, 280, 'unknown means free');
  assert.equal(X.connectedTier(), null);
});

test('re-checking the plan needs a connected account', async () => {
  await assert.rejects(X.refreshTier(), e => e.status === 401);
});
