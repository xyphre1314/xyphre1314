# Round 82: way better homepage LAYOUTS (brand is settled)

## Founder feedback (verbatim)
"ok i guess, but can we come up with better layout designs. like way better homepage layouts. but you get the gists already, the new update looks a bit better"

So the Afterglow BRAND is right (keep it exactly), the page STRUCTURE is not. The current page (/home/user/xyphre1314/hookworthy/concepts/r81/afterglow.html) is a conventional stack: hero, then section after section of "two-line heading + a panel", which reads even and predictable in the middle. Your job is a fundamentally better layout: composition, pacing, how the product is shown, how sections connect, what the scroll feels like.

## Keep exactly
- Brand system: /home/user/xyphre1314/hookworthy/concepts/r81/afterglow.md (tokens, Inter Display/Text from ../../fonts/Inter-Variable.woff2, glass + gradient hairlines, ember #FFAA80 only as light and the fluff underline, X-dark post cards, white pill + frosted glass pill). Copy the CSS tokens/components from afterglow.html rather than reinventing them.
- Content and features from afterglow.html (read it fully): hero line "They read one line. / Make it hookworthy.", the 4 user-driven examples, the REAL Try box via ../../core.js (HWCore.softMarks + HWCore.hookUp + the friendly move phrases), previews per app + the 2-post thread, 11 PM → 8:40 AM, replies + results, who it's for ("You…" lines, example people labelled), Studio (client post + comment + Approve, the link line, own-X-account line, 8 voices = $144/mo yearly), trust ("We never post for you. / You hit post."), exact pricing + yearly/monthly toggle (Free $0; Pro $12/mo yearly or $16 monthly; Studio $18 per client voice/mo yearly or $24 monthly), final input that sharpens live, footer, phone bottom bar. You may merge, reorder, compress or re-stage sections and tighten copy (keep it creator-voiced, never technical), but don't drop features or invent facts.

## Research first (briefly)
Look at how the best do LAYOUT on Mobbin: load the tools with ToolSearch "select:mcp__Mobbin__search_sections" and run 2–4 searches relevant to your layout idea (e.g. "feature section with sticky product screenshot", "bento grid feature section", "hero section with product demo", from Linear, Vercel, Apple, Superhuman, Cursor, Notion, Raycast, Framer). output_destination "code". Keep it to a few searches; Read the images; take structure, not style.

## Deliverables (write only these; no git writes)
- /home/user/xyphre1314/hookworthy/concepts/r82/<id>.html: the full homepage in your layout.
- /home/user/xyphre1314/hookworthy/concepts/r82/<id>.md: layout name (2-3 words), the structural idea in one line, the scroll story section by section (one line each), what Mobbin references it learned from, and its weakest point. Under 160 words.

## Rules
Two-line headings max at 1440 AND 390; no eyebrow labels above headings, no gradient text, no emoji icons, no section numbers, no generic icon-card grids; no invented stats/testimonials/logos; banned words (unlock, supercharge, leverage, elevate, seamless, game-changer, delve, "AI-powered"); WCAG AA (measure text over light/glass); visible focus; prefers-reduced-motion = complete static layout; NO auto-cycling (scroll-driven state changes are fine; they must also work as a static stack when motion is reduced or JS is off, and every state must be reachable by keyboard/scroll); CLS < 0.05; no horizontal page scroll at 360–390 (an intentional horizontal carousel inside its own container is fine if it's swipeable and keyboard-accessible); ≤ 11 phone screens (390×844); the phone layout must be designed, not just stacked.

## Verify (required; iterate until it is genuinely better than afterglow.html, not just different)
sh /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/up.sh
cd /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r82 && NODE_PATH=/opt/node22/lib/node_modules node check.js <id> → "ok": true. Also axe (/tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/crit/a11y/package/axe.min.js; wcag2a/wcag2aa) 0 at 1440 and 390; confirm the Try box and final input give real rewrites; Read your screenshots including mid-page screens (scroll and capture each screen) and judge the whole scroll, not just the hero. Scripts in r82/work-<id>/. Commands under 110s.

FINAL REPLY (short): layout name, the structural idea, the scroll story in a few bullets, check/axe/phone-screen numbers, weakest point.
