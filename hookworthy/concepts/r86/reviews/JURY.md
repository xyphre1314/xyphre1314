# Round 86 jury: critique everything, strictly, against a 9.5 bar

The founder's ask: "fix the sharpen engine too, and make everything at least a 9.5/10. Have the jury critique everything, then fix all the problems, and have the jury rate them."

You are one of six independent jurors. This pass is the CRITIQUE: find everything standing between the current work and 9.5 in your discipline, and write precise, buildable fixes. Another builder applies them. Afterwards a fresh jury rates the result.

## What is under review
- **The homepage:** http://127.0.0.1:8765/concepts/r85/home.html. Run `sh /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/up.sh` first.
  - Source: /home/user/xyphre1314/hookworthy/concepts/r85/home.html. Changelog: concepts/r85/home.md.
  - Last round's reviews: concepts/r85/reviews/ (REVIEW.md, FIXPLAN.md, review-*.json). Check what was really fixed; don't re-list fixed items.
  - Screens already captured: /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/slices-r85/ (d-NN = desktop 1440×900 screen by screen; m-NN = phone 390×844).
  - Use Playwright (NODE_PATH=/opt/node22/lib/node_modules; `require('playwright')`; chromium.launch() needs no options) to interact and capture anything else, including 1280, 1024, 768 and 360 widths.
- **The Sharpen engine:** /home/user/xyphre1314/hookworthy/core.js, the global HWCore. It is fully offline; there is no model call, so never call any AI API.
  - The homepage's Try box and final input call HWCore.softMarks(text) and HWCore.hookUp(text, {}). That returns {best:{text, moves, say, main, why, cut}, alts, soft, cut}. Read the page's script to see exactly how results are shown.
  - The app (index.html) uses hgSharpen. server/test/sharpen-eval.mjs lifts it, and `node server/test/sharpen-eval.mjs` runs its 48 drafts.
  - Known complaints: some openers are missed, and some outputs are clumsy (e.g. a ticker line like "eth will 5k").

## Context to respect (non-negotiable)
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
1. Write a held-out set of at least 90 realistic first lines, drafted the way people really draft on X. Save it as JSON at r86/work-hook/heldout.json, in the form [{n: niche, t: text}].
   - Include at least these: crypto/trading shorthand and tickers ("eth will 5k", "$SOL"); lowercase; founders; newsletters; ghostwriting/B2B; fitness; dev; design; and personal stories.
   - Also include: questions; already-sharp lines (these must stay untouched); multi-sentence lines; lines with emoji, links, @handles, #hashtags or numbers/percent/$; lists; and lines over 280 characters.
   - Also include nonsense and very short lines, sarcasm, and lines where cutting a word would change the meaning ("I just can't", "not bad", "kind of a big deal").
   - Do not reuse the 48 lines in server/test/sharpen-eval.mjs, the homepage's examples, or the engine's own examples.
2. Run every line through the homepage path: HWCore.softMarks + HWCore.hookUp, plus the page's own wrapper logic if it adds any. Also run them through hgSharpen, the app path, via sharpen-eval.mjs's exported E.
3. Grade every output by hand:
   - **h:** a good creator would post it as is.
   - **o:** better, but with a soft spot.
   - **m:** unchanged when it shouldn't be, worse, wrong, awkward, a fact lost or changed, or meaning flipped.
   - Also judge the "why" and "say" explanations shown to users: are they true for that edit, and short?
4. Group the failures into classes. For each class give the pattern, examples (input → output → what a pro would write), the likely cause in core.js (function and line), and a precise fix.
5. Score the engine out of 10 with the same rubric. Treat 9.5 as at least 90% h, 0 m on meaning or facts, no awkward grammar, and explanations that are always true.
- Save your graded table as r86/work-hook/graded.json.
- Don't edit core.js.

## Output (required)
Write /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/review-<key>.json in this form:
{
 "key": "<key>", "role": "<role>", "score": n (as it stands, one decimal),
 "verdict": "two sentences",
 "to_95": ["the specific changes that would take YOUR score to 9.5, most important first"],
 "issues": [ { "id": "<key>-1", "severity": "P0|P1|P2", "area": "layout|colour|type|brand|copy|flow|interaction|mobile|conversion|trust|a11y|perf|engine", "where": "section / element / selector / core.js function", "problem": "what's wrong and why it matters", "fix": "exactly what to do (verbatim new copy, values, order, code approach)" } ]
}
- Aim for 15–35 issues, with no padding and no duplicates. Put tested CSS, snippets and scripts in r86/work-<key>/.
- Do NOT edit the page or core.js, and make no git writes. Keep each command under 110s.
- FINAL REPLY: score, verdict, and to_95 in under 120 words.
