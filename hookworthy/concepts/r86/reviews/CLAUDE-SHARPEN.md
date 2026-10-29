# Round 86: Claude-powered Sharpen in the app, with the on-device engine as instant fallback

The founder's decision: in the live app, Sharpen calls Claude through the Hookworthy server, using the server's own ANTHROPIC_API_KEY. The offline rule engine (HWCore.sharpenLine in core.js) stays as the instant result and the fallback. The homepage demo stays offline.

Why: three independent juries put the rule engine at 6.0 → 7.0 → 7.6. It is safe (0 facts lost, 0 negations flipped), but on messy lines that need work only 55–75% come out postable, because the long tail of run-up phrasing can't be covered by rules.

## Hard constraints
- NEVER call the real Anthropic API from this environment. There is no ANTHROPIC_API_KEY here, and you must not use any other credential (not Claude Code's token, not ANTHROPIC_BASE_URL with ambient auth). Test only with the fake client (`setClient` in server/lib/ai.mjs), the same way server/test/ai.test.mjs does.
- Use the existing `complete()` in server/lib/ai.mjs and its tier system: tier **quick** = Sonnet 5.5, low effort (the owner's model choice; overridable by env). It keeps the existing server-side fallback beta (`fallbacks: 'default'`) and typed error handling.
- No git writes. Keep each command under 110 s.

## Build
1. **Prompt (core.js).** Add `prompts.sharpen({ text, voice, never, keep })`, following the shape of the other `core.prompts.*` entries. It returns `{ prompt, tier: 'quick', schema }`, and the stable instructions are separate so they can be cached (see 3).
   - The instructions rewrite ONLY the first line. Cut fluff, hedges and run-up frames; lead with the point, number or result when the line has one.
   - They keep the writer's voice: lowercase stays lowercase, slang stays, and "i think"/"imo" stays on price calls.
   - They NEVER add a fact, number, name, claim or emoji. They keep every number, $, %, ticker, @handle, #tag, link and proper name verbatim.
   - They keep negations and meaning words. No hype, no banned words (unlock, supercharge, leverage (verb), elevate, seamless, game-changer, delve, "AI-powered"), and no never-say words.
   - If the line is already sharp, it is returned unchanged.
   - Give 6–10 short contrasting examples drawn from the juror-graded "pro would write" targets in concepts/r86/reviews/rerate*/hook/graded.json. Pick varied ones and keep them short.
   - Schema: `{ line: string, why: string (≤140 chars, true for this edit, plain words), unchanged: boolean }`.
2. **Validator (core.js).** Add `SHARPEN.fromClaude(text, data, opts)`. It turns Claude's output into the exact sharpenLine contract `{state, draft, line, rest, cut, marks, move, say, why, kept, alts, long, note}`, plus `source: 'claude'`. Return null when anything fails, so the caller falls back to the engine.
   - `cut`: computed by the engine's own word diff (every removed word, kinds as sharpenLine uses them). Never taken from the model.
   - `say`: built by the engine's receipt rules ("Cut N bits of fluff · …").
   - `why`: Claude's, but only if it's ≤ 140 characters and quotes nothing that isn't in the draft or the line. Otherwise use the engine's why.
   - Reject (return null) if any of these hold:
     - any draft fact is missing from the line: numbers, $, %, tickers, @, #, links, proper names (reuse slFacts);
     - the line has a number or fact not in the draft;
     - a negation was dropped;
     - a banned or never-say word appears;
     - a lowercase draft gained capitals beyond proper nouns or tickers;
     - the line is longer than the draft's first line, or it's empty;
     - the engine's grammar and broken-template checks (slOK / slFrag / SL_BROKEN etc.) flag it;
     - it's identical to the draft while `unchanged` is false. If `unchanged` is true, return state 'clean'.
3. **Caching (ai.mjs).** Extend `complete()` minimally with an optional `cached` string. It becomes the first user-content text block with `cache_control: { type: 'ephemeral' }`, followed by the variable prompt, so the stable sharpen instructions and examples are cached across taps.
   - Also add an optional per-request `timeout` (ms), passed as request options to `messages.create`.
   - Keep every existing call unchanged.
4. **Endpoint (server.mjs).** Add `POST /api/v1/sharpen { text, voice?, never?, keep? }`.
   - It always returns 200 with the contract, plus `source: 'claude' | 'rules'` and, when rules were used, `reason: 'no_key' | 'cap' | 'timeout' | 'invalid' | 'refused' | 'error'`.
   - Rules path: `core.sharpenLine(text, { keep })`.
   - Claude path: rate-limit with the existing `allow(ip)`, and skip when `!AI.hasKey()`. A fair-use daily cap per token comes from env `HW_SHARPEN_DAILY` (default 300); past it, use rules.
   - It does NOT spend rewrite credits: Sharpen stays free and unlimited, and the fallback keeps that true.
   - Timeout 6000 ms. Thin or empty input goes straight to rules.
5. **App wiring (index.html).** Find the one-tap Sharpen paths that call sharpenLine (hookUpFor / hookUpPack and hgSharpen) and the app's existing server helper; look at how /api/v1/rewrite is called.
   - Show the engine result instantly, as today.
   - If a server is connected and the draft is unchanged, request /api/v1/sharpen with the voice memory and never-say list. When a `source: 'claude'` result arrives, swap it in quietly with a small "Sharpened with Claude" note.
   - On any error, or in demo mode with no server, keep the engine result silently.
   - Put-back should keep working: re-run with `keep`. If that's too invasive, keep put-back on the engine result.
   - Don't change unrelated UI. Bump sw.js CACHE.
6. **Homepage truth.** Edit the source /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/fix/work/src.html (or tail.txt) and rebuild with `python3 build.py` there. Find every claim about how Sharpen works (FAQ "Is it just AI writing?", the Try tile, pricing lede, hero) and make it true:
   - in the app, Claude sharpens the line and the on-device engine is the instant fallback;
   - this page's demo runs the on-device version;
   - Sharpen never adds a fact (enforced by the validator);
   - Sharpen stays free and unlimited.

   Keep the edits short and Afterglow-consistent, with no new sections. Then run `node /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/fix/check.js home` (NODE_PATH=/opt/node22/lib/node_modules, after `sh …/scratchpad/up.sh`) and hero-sync.js.
7. **Tests.** Add `server/test/sharpen-ai.test.mjs`, using the fake client. Cover:
   - a valid Claude line → source claude, with contract fields from the engine's diff;
   - fact-dropping, number-adding, negation-dropping, never-say, over-long and broken outputs → rules, reason 'invalid';
   - a refusal → rules;
   - a timeout → rules;
   - no key → rules;
   - the daily cap → rules;
   - the request uses the quick tier model, has a cache_control block on the stable prefix, and puts the draft after it;
   - existing complete() callers are unaffected.

   `cd server && npm test` stays green.
8. **Eval harness for the owner.** Add `server/test/sharpen-ai-eval.mjs`; it runs ONLY when ANTHROPIC_API_KEY is set. It feeds every juror line set (concepts/r86/reviews/rerate*/hook/unseen.json) through the Claude path and the rules path. It writes a side-by-side markdown table (draft | rules | claude | validator verdict) for hand grading. It prints total tokens, cache hits and the estimated cost; use the pricing for the tier's model, Sonnet 5.5: $2/MTok in, $10/MTok out, $0.20/MTok cache reads.
9. **Docs.** In server/README.md, document the endpoint, `HW_SHARPEN_DAILY`, how to run the eval, and a cost-per-tap estimate worked out from a realistic token count.

FINAL REPLY (short): what you built, file by file, the test status, the homepage copy changes, the cost estimate, and anything the owner must do (set the key, run the eval).
