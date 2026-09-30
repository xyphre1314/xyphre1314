/* Claude for Hookworthy.
   Routing: everyday writing (rewrites, ideas, post-mortems, hook critiques) runs on Sonnet 5.5,
   the balanced model that's fast and affordable at scale. Voice study, which reads a whole
   post history once and shapes every later rewrite, runs on Opus 5.5.
   Each tier sets its own effort. Refusals fall back server-side ("default" fallbacks). */
import Anthropic from '@anthropic-ai/sdk';

export const MODELS = {
  quick: process.env.HW_MODEL_QUICK || 'claude-sonnet-5-5',
  default: process.env.HW_MODEL_DEFAULT || 'claude-sonnet-5-5',
  complex: process.env.HW_MODEL_COMPLEX || 'claude-opus-5-5'
};
const EFFORT = { quick: 'low', default: 'medium', complex: 'high' };
const MAX_TOKENS = { quick: 2000, default: 8000, complex: 16000 };
const SYSTEM = 'You are the writing engine inside Hookworthy, an app for people who post on X, Threads, LinkedIn and Bluesky. Follow the task exactly. When the task asks for JSON, reply with only that JSON value and nothing else.';

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

export async function complete({ prompt, tier = 'default', json = false }) {
  if (!hasKey()) throw new AIError('no_key', 'Set ANTHROPIC_API_KEY in server/.env', 503);
  if (typeof prompt !== 'string' || !prompt.trim()) throw new AIError('invalid_request', 'prompt is required', 400);
  if (Buffer.byteLength(prompt) > 256 * 1024) throw new AIError('prompt_too_large', 'Prompt over 256 KB', 413);
  const t = MODELS[tier] ? tier : 'default';
  let res;
  try {
    res = await getClient().beta.messages.create({
      model: MODELS[t],
      max_tokens: MAX_TOKENS[t],
      system: SYSTEM,
      output_config: { effort: EFFORT[t] },
      messages: [{ role: 'user', content: prompt }],
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
  return { text, data: json ? parseJSON(text) : undefined, model: res.model, usage: res.usage, truncated: res.stop_reason === 'max_tokens' };
}
