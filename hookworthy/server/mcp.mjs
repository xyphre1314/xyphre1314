/* Hookworthy as an MCP server (stdio), so Claude Desktop, Claude Code or any MCP client can use it:
     grade_hook        score a first line and say why (no API key needed)
     check_post        pre-post checks: blanks, limits, links, bait lines, never-say words
     rewrite_in_voice  three rewrites in the author's voice (needs ANTHROPIC_API_KEY)
     schedule_post     queue a post on a running Hookworthy server (HOOKWORTHY_URL)
   Claude Code:    claude mcp add hookworthy -- node /path/to/hookworthy/server/mcp.mjs
   Claude Desktop: add {"command":"node","args":["/path/to/hookworthy/server/mcp.mjs"]} under mcpServers. */
import { createInterface } from 'node:readline';
import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const envFile = join(here, '.env');
if (existsSync(envFile)) for (const line of readFileSync(envFile, 'utf8').split('\n')) { const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); }
const core = createRequire(import.meta.url)('../core.js');
const BASE = (process.env.HOOKWORTHY_URL || 'http://localhost:8787').replace(/\/$/, '');

const TOOLS = [
  { name: 'grade_hook', description: 'Grade the first line of a social post: a state word (Getting there, Almost, Ready, Standout; Ready is the bar) with the 0-100 score behind it, the next step, the five parts (clarity, curiosity, specificity, tension, brevity) and one sentence on the biggest fix.', inputSchema: { type: 'object', properties: { text: { type: 'string', description: 'The post, or just its first line' } }, required: ['text'] } },
  { name: 'check_post', description: 'Pre-post checks for a draft: unfilled [blanks], over the character limit, link in the first post, hashtag spam, bait lines like “Agree?”, and words the author never uses.', inputSchema: { type: 'object', properties: { text: { type: 'string' }, limit: { type: 'number', description: 'Characters per post, default 280' }, platform: { type: 'string', enum: ['x', 'linkedin'], description: 'How to count characters: x (default; links 23, emoji and CJK 2) or linkedin (one per character)' }, never: { type: 'array', items: { type: 'string' }, description: 'Words the author never uses' } }, required: ['text'] } },
  { name: 'rewrite_in_voice', description: 'Rewrite a draft three ways in the author\'s own voice without inventing facts. kind: punchier | shorter | hook | contrarian | curiosity | grammar. Pass a few of the author\'s past posts as examples for the voice.', inputSchema: { type: 'object', properties: { text: { type: 'string' }, kind: { type: 'string', enum: ['punchier', 'shorter', 'hook', 'contrarian', 'curiosity', 'grammar'] }, examples: { type: 'array', items: { type: 'string' }, description: 'The author\'s past posts' }, platform: { type: 'string' }, limit: { type: 'number' } }, required: ['text'] } },
  { name: 'schedule_post', description: 'Queue a post or thread on the running Hookworthy server to go out at a time (ISO 8601) on X and/or LinkedIn. Returns the queue item.', inputSchema: { type: 'object', properties: { posts: { type: 'array', items: { type: 'string' }, description: 'One string per post in the thread' }, at: { type: 'string', description: 'ISO 8601 time' }, platforms: { type: 'array', items: { type: 'string', enum: ['x', 'linkedin'] } } }, required: ['posts', 'at', 'platforms'] } }
];

async function call(name, a = {}) {
  if (name === 'grade_hook') { const h = core.hookScore(String(a.text || '')); return { score: h.score, tier: h.tier, next: core.hookNext(String(a.text || ''), h).lead, parts: h.parts, reason: h.reason }; }
  if (name === 'check_post') { const text = String(a.text || ''); const issues = core.checkPost(text, { never: a.never || [], limit: a.limit || 280, platform: a.platform || 'x' }); return { ok: !issues.length, issues, hook: core.hookScore(text).score }; }
  if (name === 'rewrite_in_voice') {
    const AI = await import('./lib/ai.mjs');
    const spec = core.prompts.rewrite({ text: String(a.text || ''), kind: a.kind || 'punchier', voice: a.examples && a.examples.length ? { examples: a.examples } : null, platform: a.platform || 'X', limit: a.limit || 280 });
    const r = await AI.complete({ ...spec, json: true }); return r.data;
  }
  if (name === 'schedule_post') {
    const r = await fetch(`${BASE}/api/schedule`, { method: 'POST', headers: { 'content-type': 'application/json', ...(process.env.HOOKWORTHY_TOKEN ? { authorization: `Bearer ${process.env.HOOKWORTHY_TOKEN}` } : {}) }, body: JSON.stringify({ posts: a.posts, at: a.at, platforms: Object.fromEntries((a.platforms || []).map(p => [p, true])) }) });
    const j = await r.json().catch(() => ({})); if (!r.ok) throw new Error(j.error || `Hookworthy server ${r.status}`); return j;
  }
  throw Object.assign(new Error(`Unknown tool ${name}`), { rpc: -32602 });
}

const out = m => process.stdout.write(JSON.stringify(m) + '\n');
async function onMessage(m) {
  const { id, method, params } = m;
  if (method === 'initialize') return out({ jsonrpc: '2.0', id, result: { protocolVersion: (params && params.protocolVersion) || '2025-06-18', capabilities: { tools: {} }, serverInfo: { name: 'hookworthy', version: '1.0.0' } } });
  if (method === 'ping') return out({ jsonrpc: '2.0', id, result: {} });
  if (method === 'tools/list') return out({ jsonrpc: '2.0', id, result: { tools: TOOLS } });
  if (method === 'tools/call') {
    try { const r = await call(params.name, params.arguments); return out({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: JSON.stringify(r, null, 2) }], structuredContent: r } }); }
    catch (e) { if (e.rpc) return out({ jsonrpc: '2.0', id, error: { code: e.rpc, message: e.message } }); return out({ jsonrpc: '2.0', id, result: { content: [{ type: 'text', text: `Error: ${e.message}` }], isError: true } }); }
  }
  if (id !== undefined && method && !method.startsWith('notifications/')) out({ jsonrpc: '2.0', id, error: { code: -32601, message: `Method not found: ${method}` } });
}
createInterface({ input: process.stdin }).on('line', line => { if (!line.trim()) return; let m; try { m = JSON.parse(line); } catch { return out({ jsonrpc: '2.0', id: null, error: { code: -32700, message: 'Parse error' } }); } onMessage(m); });
