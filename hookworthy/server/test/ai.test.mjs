import { test } from 'node:test';
import assert from 'node:assert/strict';
process.env.ANTHROPIC_API_KEY = 'test-key';
const AI = await import('../lib/ai.mjs');

function fake(reply, extra = {}) { const calls = []; return { calls, beta: { messages: { create: async req => { calls.push(req); return { model: req.model, stop_reason: 'end_turn', content: [{ type: 'text', text: reply }], usage: {}, ...extra }; } } } }; }

test('everyday writing goes to Sonnet 5.5, voice study to Opus 5.5, with effort per tier and default fallbacks', async () => {
  const f = fake('{"options":[{"text":"a","why":"b"}]}'); AI.setClient(f);
  await AI.complete({ prompt: 'x', tier: 'default', json: true });
  await AI.complete({ prompt: 'x', tier: 'complex', json: true });
  await AI.complete({ prompt: 'x', tier: 'quick' });
  assert.equal(f.calls[0].model, 'claude-sonnet-5-5'); assert.equal(f.calls[0].output_config.effort, 'medium');
  assert.equal(f.calls[1].model, 'claude-opus-5-5'); assert.equal(f.calls[1].output_config.effort, 'high');
  assert.equal(f.calls[2].output_config.effort, 'low');
  assert.equal(f.calls[0].fallbacks, 'default'); assert.deepEqual(f.calls[0].betas, ['server-side-fallback-2026-07-01']);
  assert.equal(f.calls[0].thinking, undefined, 'no thinking config: adaptive by default, never disabled');
});

test('tolerant JSON: fenced, or wrapped in a sentence', async () => {
  AI.setClient(fake('Here you go:\n```json\n[{"text":"hi"}]\n```'));
  assert.deepEqual((await AI.complete({ prompt: 'x', json: true })).data, [{ text: 'hi' }]);
  AI.setClient(fake('Sure. {"a":1} Done.'));
  assert.deepEqual((await AI.complete({ prompt: 'x', json: true })).data, { a: 1 });
  AI.setClient(fake('no json here'));
  await assert.rejects(AI.complete({ prompt: 'x', json: true }), e => e.code === 'invalid_json');
});

test('refusals and empty prompts come back as clear errors', async () => {
  AI.setClient(fake('', { stop_reason: 'refusal', stop_details: { explanation: 'nope' } }));
  await assert.rejects(AI.complete({ prompt: 'x' }), e => e.code === 'refused' && e.status === 422);
  await assert.rejects(AI.complete({ prompt: '  ' }), e => e.code === 'invalid_request');
});

test('PDFs ride along as base64 document blocks before the prompt; anything else is refused', async () => {
  const f = fake('{"summary":"ok"}'); AI.setClient(f);
  await AI.complete({ prompt: 'read this', json: true, docs: [{ name: 'launch.pdf', mime: 'application/pdf', data: 'data:application/pdf;base64,JVBERi0x\nLjQK' }] });
  const c = f.calls[0].messages[0].content;
  assert.equal(c[0].type, 'document'); assert.deepEqual(c[0].source, { type: 'base64', media_type: 'application/pdf', data: 'JVBERi0xLjQK' }); assert.equal(c[0].title, 'launch.pdf');
  assert.deepEqual(c[1], { type: 'text', text: 'read this' });
  await AI.complete({ prompt: 'plain' }); assert.equal(f.calls[1].messages[0].content, 'plain', 'no docs: plain string content');
  await assert.rejects(AI.complete({ prompt: 'x', docs: [{ mime: 'image/tiff', data: 'x' }] }), e => e.code === 'invalid_request');
  await assert.rejects(AI.complete({ prompt: 'x', docs: [1, 2, 3, 4].map(() => ({ mime: 'application/pdf', data: 'x' })) }), e => e.code === 'too_many_docs');
});
