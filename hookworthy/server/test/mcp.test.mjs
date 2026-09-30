import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

test('MCP: initialize, list tools, grade a hook, check a post', async () => {
  const p = spawn(process.execPath, [fileURLToPath(new URL('../mcp.mjs', import.meta.url))], { stdio: ['pipe', 'pipe', 'inherit'] });
  const got = new Map(); let buf = '';
  p.stdout.on('data', d => { buf += d; let i; while ((i = buf.indexOf('\n')) >= 0) { const m = JSON.parse(buf.slice(0, i)); buf = buf.slice(i + 1); got.set(m.id, m); } });
  const send = m => p.stdin.write(JSON.stringify({ jsonrpc: '2.0', ...m }) + '\n');
  send({ id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18', capabilities: {}, clientInfo: { name: 't', version: '1' } } });
  send({ method: 'notifications/initialized' });
  send({ id: 2, method: 'tools/list' });
  send({ id: 3, method: 'tools/call', params: { name: 'grade_hook', arguments: { text: 'Double your price. Signups went up 31%.' } } });
  send({ id: 4, method: 'tools/call', params: { name: 'check_post', arguments: { text: 'Thoughts? We leverage [thing].', never: ['leverage'] } } });
  send({ id: 5, method: 'nope' });
  for (let k = 0; k < 50 && got.size < 5; k++) await new Promise(r => setTimeout(r, 40));
  p.kill();
  assert.equal(got.get(1).result.serverInfo.name, 'hookworthy');
  assert.deepEqual(got.get(2).result.tools.map(t => t.name), ['grade_hook', 'check_post', 'rewrite_in_voice', 'schedule_post']);
  assert.ok(got.get(3).result.structuredContent.score >= 70);
  assert.equal(got.get(4).result.structuredContent.ok, false);
  assert.equal(got.get(5).error.code, -32601);
});
