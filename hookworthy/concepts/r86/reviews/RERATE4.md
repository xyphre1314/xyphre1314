# Round 86 re-rate: independent jury, strict 9.5 bar

The founder's ask: "make everything at least a 9.5/10, then have the jury rate them." You are one of six independent jurors rating the CURRENT work as it stands. You have not seen any earlier review and must not look for them. Do not open concepts/r85, concepts/r86/reviews, concepts/r86/home.md, server/test/fixtures, server/test/sharpen-*.mjs, server/test/fixtures, or anything under scratchpad/r86 except your own work folder in r86/rerate4/. Rate what is in front of you.

## What is under review
- **The homepage:** http://127.0.0.1:8765/concepts/r86/home.html. Run `sh /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/up.sh` first.
  - Source: /home/user/xyphre1314/hookworthy/concepts/r86/home.html.
  - Use Playwright (NODE_PATH=/opt/node22/lib/node_modules; `require('playwright')`; chromium.launch() needs no options).
  - Capture and inspect every screen at 1440, 1280, 1024, 768, 390 and 360. Interact with everything.
- **The Sharpen engine:** /home/user/xyphre1314/hookworthy/core.js, which defines the global HWCore. It is offline, with no model call, so never call any AI API.
  - Both the homepage (Try box, final input, hero examples) and the app (index.html) call HWCore.sharpenLine(text, {keep}).
  - It returns {state, draft, line, rest, cut, marks, move, say, why, kept, alts, long, note}.
  - It loads in Node with require().

## Context to respect (non-negotiable)

- **Sharpen has two engines now.**
  - In the live app, Sharpen calls Claude through the Hookworthy server: server/server.mjs POST /api/v1/sharpen, prompt in core.js prompts.sharpen, validator SHARPEN.fromClaude.
  - The on-device rule engine (HWCore.sharpenLine) is the instant result and the fallback.
  - The homepage demo runs the on-device engine only, and its copy says so.
  - There is no API key in this environment. NEVER call the real Anthropic API, and never use any credential you find here.
- **Product:** Hookworthy, a writing and scheduling app for creators on X (also Threads, LinkedIn, Bluesky).
  - Sharpen marks fluff in your first line and rewrites it in one tap, in your voice. Your facts stay. Nothing posts without you.
  - Audience: crypto/trading writers first, then newsletter writers, founders building in public, and ghostwriters/agencies (Studio).
- **Pricing (exact):**
  - Free $0.
  - Pro $12/mo billed yearly, or $16 monthly.
  - Studio $18 per client voice/mo billed yearly, or $24 monthly.
  - There is NO trial.
- **This is a design preview.** Nothing is live for X, and signup is a preview that says so honestly.
  - Don't propose real auth, payments, scraping X, or anything that acts on X.
  - Don't propose invented stats, testimonials, user counts, logos, reach promises or trials.
- **The brand is settled (Afterglow), chosen by the founder through taste tests:**
  - #08090A ground, Inter only (Display for headings), soft white.
  - Ember #FFAA80 only as light and the fluff underline.
  - Glass panels with gradient hairlines; X-dark post cards; white pill and frosted pill buttons.
  - Cinema hero plus a Bento grid body.
  - Refine it; never propose a different brand, typeface, colour or layout family.
- **The founder's standing asks:** more visuals, more motion/interaction, less text, bigger product moments, more personality, and more X/creator feel.
- **Hard rules:**
  - Headings two lines max at 1440 and 390.
  - No eyebrow labels, gradient text, emoji icons, section numbers or icon-card grids.
  - Banned words: unlock, supercharge, leverage, elevate, seamless, game-changer, delve, "AI-powered".
  - WCAG AA; reduced motion = finished static layout; no auto-cycling.
  - The page never acts for the visitor.
  - ≤ 11 phone screens at 390 (target ≤ 10.5 at 360). CLS < 0.05. No horizontal scroll at 360–390.
- **Photos** (assets/people/photos.jpg, an 800px-wide sprite the founder uploaded) have no higher-res source. Propose crops or sizes instead of new photos.

## Scoring rubric (be strict and calibrated; the founder wants honest numbers)
- **10:** nothing a world-class practitioner in your field would change.
- **9.5:** best-in-class. It could sit next to Linear's, Vercel's or Superhuman's own work without embarrassment. Only small P2 polish is left, and none of it is visible in the first 5 seconds of any section.
- **9:** excellent, with one or two noticeable P1s.
- **8:** very good but clearly below best-in-class.
- **7:** good, with several P1s.
- **≤ 6:** problems that hurt conversion or credibility.
- Any open P0 caps your score at 8.

## Juror roles (yours is named in your prompt)
- **brand:** senior brand designer. Identity, wordmark, colour discipline, type, imagery, personality, consistency.
- **uiux:** senior UI/UX designer, Linear/Superhuman level. Product believability, interaction, motion, hierarchy, states, the signup sheet, a11y.
- **web:** Awwwards-level web designer and front-end craftsperson. Layout and composition at every width, rhythm, motion timing, performance, polish.
- **founder:** startup co-founder who took two creator/prosumer SaaS products to millions in ARR. Positioning, objections, pricing, conversion path, truthfulness.
- **marketing:** senior app marketing lead. Copy line by line, phrasing, voice, headlines, CTAs, scannability, the X-creator feel.
- **hook:** the Sharpen engine juror, a senior X ghostwriter and copy chief who writes hooks for top creators, and who can read JS. Your job is described below.

## Extra brief for the hook (engine) juror
1. Write a brand-new set of at least 120 realistic first lines, drafted the way people really draft on X. Save it as JSON at r86/rerate4/work-hook/unseen.json, in the form [{n: niche, t: text}].
   - Do NOT read or reuse any existing test set: server/test/*, server/test/fixtures/*, anything under scratchpad/r86 other than your folder, and core.js's own examples.
   - Cover these niches: crypto/trading shorthand and tickers, lowercase, founders, newsletters, ghostwriting/B2B, fitness, dev, design, and personal stories.
   - Cover these shapes: questions; already-sharp lines (these must stay untouched); multi-sentence lines; lines with emoji, links, @handles, #hashtags or numbers/$/%; list headers; lines over 280 characters.
   - Also include nonsense, very short lines, sarcasm, and lines where cutting a word would change the meaning.
2. Run every line through HWCore.sharpenLine. Also run the homepage itself in Playwright on at least 15 of them: check that what the page shows (strikes, Kept row, why, receipt, put-it-back) matches what the engine did and is true.
3. Grade every output by hand:
   - **h:** a good creator would post it as is.
   - **o:** better, but with a soft spot.
   - **m:** unchanged when it shouldn't be, worse, wrong, awkward, a fact lost or changed, or meaning flipped.
   - Also judge the "why", "say" and "cut" lists: are they true for that edit, and short?
4. Score the ON-DEVICE engine out of 10 with the rubric (that is what the homepage demo and the fallback run).
5. Separately, review the Claude path as code and prompt design: prompts.sharpen, SHARPEN.fromClaude and the endpoint. Don't call any API. Give your judgement of whether the validator would block good edits or let bad ones through, as a "claude_path" note in your JSON with concrete fixes.
6. Treat 9.5 as at least 90% h, 0 m on meaning or facts, no awkward grammar, and explanations that are always true.
- Save your graded table as r86/rerate4/work-hook/graded.json.
- Don't edit core.js.

## Output (required)
Write /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/rerate4/review-<key>.json in this form:
{
 "key": "<key>", "role": "<role>", "score": n (one decimal, as it stands),
 "verdict": "two sentences",
 "to_95": ["only if score < 9.5: the specific changes that would take it to 9.5, most important first"],
 "issues": [ { "id": "<key>-1", "severity": "P0|P1|P2", "area": "...", "where": "...", "problem": "...", "fix": "exactly what to do" } ]
}
- List every real issue you find, with no padding.
- Put scripts and screenshots in r86/rerate4/work-<key>/.
- Do NOT edit the page or core.js, and make no git writes. Keep each command under 110s.
- FINAL REPLY: score, verdict, and to_95 in under 100 words.
