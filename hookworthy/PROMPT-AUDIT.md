# Prompt audit: Claude Opus 5.5

**Scope:** every prompt Hookworthy sends to Claude.
- `server/lib/ai.mjs` builds the requests and holds the system prompt.
- `core.js` has the 18 prompt builders, `BRIEF`, `voiceBlock` and `RIFF_ASK`.
- `server/mcp.mjs` has the MCP tool descriptions.
- There are no `CLAUDE.md` files, skills or agent configs in the repo.

**Target model:** `claude-opus-5-5`, as asked. Every tier now runs on it: `quick` at low effort, `default` at medium, `complex` at high. Each tier can still be moved to another model with `HW_MODEL_QUICK`, `HW_MODEL_DEFAULT` or `HW_MODEL_COMPLEX`.

**Constraint found during the audit:** the same prompt text also runs through claude.ai's `sample.json`, which has no schema option and reads the output format from the prompt. So each prompt keeps a one-line JSON shape, and the server adds the matching schema on top.

## Biggest wins

1. **Structured outputs instead of "Reply with only JSON" plus regex parsing** (Group 1b).
   - Each of the 18 prompts now carries a closed JSON Schema.
   - On the server path that schema goes out as `output_config.format`, so the reply is valid JSON every time.
   - Array schemas are wrapped as `{items}` on the way out and unwrapped on the way back.
2. **`max_tokens` too small for Opus 5.5** (Group 4).
   - Thinking is always on and counts toward `max_tokens`.
   - The old caps were 2000 / 8000 / 16000. At 2000, a quick edit could hit the cap and come back empty (`truncated`).
3. **The editor brief was a wall of "Hard rules" and "Never" lines** (Groups 1a, 1c, 1e). It's now prose that gives the reason for each rule.

Findings by group:

| Group | Count |
|---|---|
| 1. Dated text | 6 |
| 2. Config files | not applicable |
| 3. Tool descriptions | 0 |
| 4. Request config | 3 |

## Findings

| # | Location (before) | Evidence | Pattern | Why it's obsolete | Confidence | Action |
|---|---|---|---|---|---|---|
| 1 | `core.js:443-718` (18 places), `ai.mjs:15`, `ai.mjs:24-33` | `Reply with only JSON: …`; system prompt says "reply with only that JSON value and nothing else"; `parseJSON` regex fallback | 1b: JSON-forcing scaffold | Structured outputs guarantee the shape on Opus 5.5 | High | Replaced with an API feature. A schema is added per prompt. The JSON-only system line is now sent only on calls without a schema (MCP or older clients). The shape line stays in each prompt for the `sample` path. |
| 2 | `ai.mjs:14` | `MAX_TOKENS = { quick: 2000, default: 8000, complex: 16000 }` | 4: `max_tokens` sized for the wrong model | Thinking counts toward the cap, so small caps cut replies off | High | Rewritten to 8000 / 16000 / 20000. 20000 stays under the SDK's non-streaming ceiling. |
| 3 | `ai.mjs:9-10` | `'claude-sonnet-5-5'` for `quick` and `default` | Step 0: target model | The request names Opus 5.5 | High | Rewritten: all tiers default to `claude-opus-5-5` with explicit effort. Tests, README, PRODUCT.md and the settings label updated to match. |
| 4 | `core.js:400-407` | `Hard rules:` followed by six bullets, three starting with "Never" | 1a, 1c, 1e: prohibition cluster, bullet wall | Bullets cut rules off from their reasons, and a pile of "never"s reads as anxious | Medium | Rewritten as prose that states the reasons: the author posts under their own name, readers scroll past AI-sounding posts, and the app's checker flags them. All the real constraints are kept (no invented facts, the banned phrases, voice matching). |
| 5 | `ai.mjs:15` | `Follow the task exactly.` | 1a: pressure language | Restates a default and adds no context | Medium | Rewritten to say who the output is for and why it has to stay true to the author. |
| 6 | `core.js:455, 482, 454` | `Ticker symbols ($BTC, ETH) stay…`, `$BTC stays $BTC`, `[your entry price]`, `a price, a trade` | 1d: patch accretion | Narrow one-off patches left over from the trader persona | Medium | Rewritten as one general rule: copy every number, name, ticker, @handle and link exactly. |
| 7 | `core.js:481, 485` | "Every version must differ…" and "Never hand the selection back unchanged" | 1c: padding, the same rule twice | Says the same thing twice in one prompt | Medium | Merged into one line. |
| 8 | `core.js:421` | `Rewrite the FIRST LINE` | 1a: emphasis | Capitals as volume | Medium | Rewritten in normal case. |
| 9 | `core.js:558` | `"why":"… 6 words max"` | 1f: numeric cap | A word count on an explanation | Medium | Rewritten as "in a few words". |

**Reviewed and kept, on purpose:**
- **Character limits.** The platform limits, the 220-character radar replies and the 9-word visual headlines are real format constraints.
- **"Never invent a number."** This failure still happens and the product depends on it not happening.
- **The hype-word list in Sharpen.** It mirrors `HYPE_RX`, which the client enforces.
- **The `picture` field list.** It's the output contract, not a chart-reading pre-pass.
- **MCP tool descriptions.** The contracts are accurate and have no steering.
- **Few-shot examples in `voiceBlock`.** They're the author's own posts, which is the evidence the prompt needs.

**Group 4: other request settings checked.**
- No prefill, no `temperature`, no `budget_tokens`, no `tool_choice` and no `thinking` field.
- Refusal fallbacks (`fallbacks: "default"`) were already on.
- Every call is single-turn, so the preserved-thinking checks don't apply.

**Not changed (flagged only):**
- `BRIEF` sits in the user turn rather than the system prompt. With the voice block it can pass the 512-token cache minimum. Moving it would help caching, but that's a cost change, not a prompt fix.
- Opus 5.5 costs about 2× Sonnet 5.5 per token. Measure `default` at `low` effort before you scale up.

## Verification

- Server tests: 98/98. New tests check that a schema becomes `output_config.format`, that array schemas are wrapped and unwrapped, and that every prompt's schema is closed and consistent.
- Browser regression: 14 suites against the mocked Messages API.
- Not tested live: no API key was available in this session. The first real call with each schema pays a one-time compile cost, and the schemas use only supported features (closed objects, `enum`, `const`, `anyOf`).
