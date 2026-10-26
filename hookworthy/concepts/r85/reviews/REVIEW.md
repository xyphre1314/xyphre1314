# Round 85: expert review of the Hookworthy homepage (find everything, then we fix it)

You are one of five independent reviewers. The founder asked: "go through it, from layouts, to colors, fonts, branding, words, phrasing, flow, etc. Fix everything." Your job is to FIND everything worth fixing from your discipline and write precise, buildable fixes. Another designer applies the fixes afterwards, so be concrete: where (section/element), what's wrong, exactly what to change (new copy verbatim, new size/spacing/colour values, new order).

## The page
- Live file: http://127.0.0.1:8765/concepts/r84/home.html (run `sh /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/up.sh` first). Source: /home/user/xyphre1314/hookworthy/concepts/r84/home.html (read it).
- Screens already captured: /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r85/slices/ (d-00…d-06 = desktop 1440×900 screen by screen, m-00…m-09 = phone 390×844, d-hero-0.5s/2s/5s = the hero over time). Read them; also use Playwright (NODE_PATH=/opt/node22/lib/node_modules) to interact (Try box, examples, previews, Studio Approve, pricing toggle, final input) and to capture anything else you need. Scripts in /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r85/work-<yourkey>/. Commands under 110s. Do NOT edit the page; no git writes.

## Context you must respect
- Product: Hookworthy, a writing + scheduling app for creators on X (also Threads, LinkedIn, Bluesky). Sharpen marks fluff in your first line and rewrites it in one tap in your voice; your facts stay; nothing posts without you. Audience: crypto/trading writers first, newsletter writers, founders building in public, ghostwriters/agencies (Studio).
- Pricing (exact, don't change numbers): Free $0; Pro $12/mo billed yearly or $16 monthly; Studio $18 per client voice/mo billed yearly or $24 monthly.
- How we got here: the founder rejected many directions. Through a taste test they chose: X's black, Linear/Vercel/Apple/Superhuman-level craft, crisp sans (Inter Display), almost no colour (an ember light #FFAA80 used only as light and the fluff underline), no serif, no quirky fonts, no X blue. Layout was chosen section by section: Cinema's hero + Bento's grid. They asked for more visuals, more motion/interaction, less text, bigger product moments, more personality, more X/creator feel. So: refine and sharpen this direction; don't propose a different brand. If something in the brand actively hurts, say so with a precise refinement.
- Hard rules: headings two lines max at 1440 and 390; no eyebrow labels above headings, no gradient text, no emoji icons, no section numbers, no generic icon-card grids; no invented stats/testimonials/logos/reach promises; banned words (unlock, supercharge, leverage, elevate, seamless, game-changer, delve, "AI-powered"); WCAG AA; reduced motion = finished static layout; no auto-cycling; ≤ 11 phone screens.

## Output (required)
Write /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r85/review-<yourkey>.json:
{
 "key": "<yourkey>", "role": "<your role>", "score": n (out of 10, as it stands),
 "verdict": "two sentences",
 "top3": ["the three changes that matter most, one line each"],
 "issues": [
   { "id": "<yourkey>-1", "severity": "P0|P1|P2", "area": "layout|colour|type|brand|copy|flow|interaction|mobile|conversion|trust|a11y|perf",
     "where": "section / element (be specific; selector if you can)",
     "problem": "what's wrong and why it matters",
     "fix": "exactly what to do (verbatim new copy / values / order)" }
 ]
}
P0 = hurts conversion or credibility now; P1 = clearly worse than best-in-class; P2 = polish. Aim for 15–30 issues, no padding, no duplicates. FINAL REPLY: score, verdict, top 3 (under 120 words).
