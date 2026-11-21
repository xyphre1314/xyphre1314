/* r86 v4.3 (round-8 web-1): sharpen.js, the homepage's Sharpen-only engine, is generated from core.js by
   tools/build-sharpen.mjs. It must be what core.js builds today, expose the subset the page calls, and give the same
   sharpenLine result as core.js, byte for byte, on the held-out fixture and blind sets 1-4, in the default and strict modes
   and with a word put back. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url)), root = path.join(here, '../..');
const req = createRequire(import.meta.url);
const core = req('../../core.js'), bundle = req('../../sharpen.js');
const { build } = await import('../../tools/build-sharpen.mjs');
const FX = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-heldout.json'), 'utf8')).rows.map(r => r.t);
const DEV = JSON.parse(readFileSync(path.join(here, 'fixtures/sharpen-dev1-4.json'), 'utf8')).lines.map(r => r.t);
const J = r => JSON.stringify(r);

test('sharpen.js: is what core.js builds today (run node tools/build-sharpen.mjs after editing core.js)', () => {
  assert.equal(readFileSync(path.join(root, 'sharpen.js'), 'utf8'), build(readFileSync(path.join(root, 'core.js'), 'utf8')).code);
});

test('sharpen.js: exposes the subset the homepage calls, and is smaller', () => {
  assert.deepEqual(Object.keys(bundle).sort(), ['SHARPEN', 'SOFT', 'sharpenLine', 'softCut', 'softMarks', 'xLength']);
  assert.deepEqual(Object.keys(bundle.SHARPEN).sort(), ['SOFT', 'callCut', 'factsOf', 'firstPost', 'fragN', 'guard', 'sharpenLine', 'softCut', 'softMarks', 'stanceKeep', 'tooThin', 'warm', 'warmSteps']);
  for (const k of ['sharpenLine', 'softMarks', 'softCut', 'xLength']) assert.equal(typeof bundle[k], 'function', k);
  assert.ok(readFileSync(path.join(root, 'sharpen.js')).length < readFileSync(path.join(root, 'core.js')).length * 0.8);
  /* the helpers the page reads give core's answers */
  for (const t of ['Big news! we just hit $10k MRR', 'asdf jkl', 'I think $SOL could probably hit $300 by Q2.']) {
    assert.equal(J(bundle.softMarks(t)), J(core.softMarks(t)), t); assert.equal(J(bundle.softCut(t)), J(core.softCut(t)), t);
    assert.equal(J(bundle.SHARPEN.tooThin(t)), J(core.SHARPEN.tooThin(t)), t); assert.equal(J(bundle.SHARPEN.factsOf(t)), J(core.SHARPEN.factsOf(t)), t);
    assert.equal(J(bundle.SHARPEN.stanceKeep(t)), J(core.SHARPEN.stanceKeep(t)), t); assert.equal(J(bundle.SHARPEN.guard(t)), J(core.SHARPEN.guard(t)), t);
    assert.equal(bundle.xLength(t), core.xLength(t), t);
  }
  /* its warm-up runs clean, step by step */
  const steps = bundle.SHARPEN.warmSteps(); assert.ok(steps.length === core.SHARPEN.warmSteps().length); for (const f of steps) f();
});

test('sharpen.js: the same sharpenLine as core.js, byte for byte, on the held-out fixture and sets 1-4', () => {
  const bad = [];
  for (const t of [...FX, ...DEV]) { const a = J(core.sharpenLine(t)), b = J(bundle.sharpenLine(t)); if (a !== b) bad.push(t); }
  assert.deepEqual(bad, []);
});

test('sharpen.js: the same in strict mode and with a word put back (sets 1-4)', () => {
  const bad = [];
  for (const t of DEV) {
    if (J(core.sharpenLine(t, { strict: true })) !== J(bundle.sharpenLine(t, { strict: true }))) bad.push(`strict: ${t}`);
    const c = core.sharpenLine(t).cut[0]; if (c && J(core.sharpenLine(t, { keep: [c.text] })) !== J(bundle.sharpenLine(t, { keep: [c.text] }))) bad.push(`keep ${c.text}: ${t}`);
  }
  assert.deepEqual(bad, []);
});
