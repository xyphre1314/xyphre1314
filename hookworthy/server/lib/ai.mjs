/* Claude for Hookworthy.
   Every tier runs on Opus 5.5; effort is the dial. Thinking is always on there, so effort decides how much
   it thinks: low for quick edits (grammar, sharpen, hook critiques), medium for everyday writing, high for
   voice study, the one deep read every later rewrite depends on. Each tier can be pointed at another model
   with HW_MODEL_QUICK / HW_MODEL_DEFAULT / HW_MODEL_COMPLEX. Refusals fall back server-side ("default").
   Calls that send a schema get structured outputs, so the reply is valid JSON by construction. */
import Anthropic from '@anthropic-ai/sdk';

export const MODELS = {
  quick: process.env.HW_MODEL_QUICK || 'claude-opus-5-5',
  default: process.env.HW_MODEL_DEFAULT || 'claude-opus-5-5',
  complex: process.env.HW_MODEL_COMPLEX || 'claude-opus-5-5'
};
const EFFORT = { quick: 'low', default: 'medium', complex: 'high' };
/* thinking counts toward max_tokens, so each cap leaves room for it; 20000 stays under the SDK's non-streaming ceiling */
const MAX_TOKENS = { quick: 8000, default: 16000, complex: 20000 };
const SYSTEM = 'You are the writing engine inside Hookworthy, an app where creators write, schedule and grow on X, Threads, LinkedIn and Bluesky. The people reading your output post it under their own name, so it has to sound like them and stay true to what they wrote.';
const JSON_ONLY = ' When the task asks for JSON, reply with only that JSON value.'; // only for calls without a schema
const MAX_SCHEMA_BYTES = 16 * 1024;

export class AIError extends Error { constructor(code, message, status = 502) { super(message); this.code = code; this.status = status; } }

let client = null;
export function hasKey() { return !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN); }
export function setClient(c) { client = c; } // tests inject a fake
function getClient() { if (!client) client = new Anthropic(); return client; }

/* tolerant JSON: whole reply, else a fenced block, else first { or [ to the last } or ] */
export function parseJSON(text) {
  const t = String(text || '').trim();
  const tries = [t, (t.match(/```(?:json)?\s*([\s\S]*?)```/) || [])[1]];
  const a = Math.min(...['{', '['].map(c => { const i = t.indexOf(c); return i < 0 ? Infinity : i; }));
  const b = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'));
  if (a !== Infinity && b > a) tries.push(t.slice(a, b + 1));
  for (const x of tries) { if (!x) continue; try { return JSON.parse(x); } catch { /* next */ } }
  throw new AIError('invalid_json', 'Claude did not return valid JSON', 502);
}

/* PDFs ride along as document blocks and pictures as image blocks (Claude reads both natively), before the prompt text */
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'], MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOCS = 3, MAX_DOC_BYTES = 15 * 1024 * 1024;
function docBlocks(docs = []) {
  if (!Array.isArray(docs) || !docs.length) return [];
  if (docs.length > MAX_DOCS) throw new AIError('too_many_docs', `Up to ${MAX_DOCS} files at a time`, 400);
  return docs.map(d => {
    if (!d || typeof d.data !== 'string' || !(d.mime === 'application/pdf' || IMAGE_TYPES.includes(d.mime))) throw new AIError('invalid_request', 'Attach PDFs or PNG, JPEG, GIF or WebP images; send other text in the prompt', 400);
    const data = d.data.replace(/^data:[^,]*,/, '').replace(/\s+/g, '');
    if (IMAGE_TYPES.includes(d.mime)) { if (data.length * .75 > MAX_IMAGE_BYTES) throw new AIError('doc_too_large', 'Pictures can be up to 5 MB', 413); return { type: 'image', source: { type: 'base64', media_type: d.mime, data } }; }
    if (data.length * .75 > MAX_DOC_BYTES) throw new AIError('doc_too_large', `${d.name || 'That PDF'} is over 15 MB`, 413);
    return { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data }, ...(d.name ? { title: String(d.name).slice(0, 200) } : {}) };
  });
}

/* structured outputs take an object at the root: an array schema is wrapped as {items} and unwrapped after */
function outputFormat(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) return null;
  if (Buffer.byteLength(JSON.stringify(schema)) > MAX_SCHEMA_BYTES) throw new AIError('invalid_request', 'schema is too large', 400);
  if (schema.type === 'array') return { wrapped: true, format: { type: 'json_schema', schema: { type: 'object', properties: { items: schema }, required: ['items'], additionalProperties: false } } };
  if (schema.type !== 'object') throw new AIError('invalid_request', 'schema must describe an object or an array', 400);
  return { wrapped: false, format: { type: 'json_schema', schema } };
}

export async function complete({ prompt, tier = 'default', json = false, docs = [], schema = null }) {
  if (!hasKey()) throw new AIError('no_key', 'Set ANTHROPIC_API_KEY in server/.env', 503);
  if (typeof prompt !== 'string' || !prompt.trim()) throw new AIError('invalid_request', 'prompt is required', 400);
  if (Buffer.byteLength(prompt) > 256 * 1024) throw new AIError('prompt_too_large', 'Prompt over 256 KB', 413);
  const t = MODELS[tier] ? tier : 'default'; const blocks = docBlocks(docs); const out = json ? outputFormat(schema) : null;
  let res;
  try {
    res = await getClient().beta.messages.create({
      model: MODELS[t],
      max_tokens: MAX_TOKENS[t],
      system: json && !out ? SYSTEM + JSON_ONLY : SYSTEM,
      output_config: { effort: EFFORT[t], ...(out ? { format: out.format } : {}) },
      messages: [{ role: 'user', content: blocks.length ? [...blocks, { type: 'text', text: prompt }] : prompt }],
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default'
    });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) throw new AIError('rate_limited', 'Claude is rate limited; try again shortly', 429);
    if (e instanceof Anthropic.AuthenticationError) throw new AIError('auth', 'ANTHROPIC_API_KEY was rejected', 401);
    if (e instanceof Anthropic.BadRequestError) throw new AIError('invalid_request', e.message, 400);
    if (e instanceof Anthropic.APIError) throw new AIError('upstream_error', e.message, 502);
    throw new AIError('upstream_error', String(e && e.message || e), 502);
  }
  if (res.stop_reason === 'refusal') throw new AIError('refused', (res.stop_details && res.stop_details.explanation) || 'Claude declined this request', 422);
  const text = (res.content || []).filter(b => b.type === 'text').map(b => b.text).join('').trim();
  if (!text) throw new AIError('empty_completion', 'Claude returned no text', 502);
  let data; if (json) { data = parseJSON(text); if (out && out.wrapped) data = data && Array.isArray(data.items) ? data.items : data; }
  return { text, data, model: res.model, usage: res.usage, truncated: res.stop_reason === 'max_tokens' };
}
