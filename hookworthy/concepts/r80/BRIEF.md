# Round 80: three hero-only drafts from the founder's taste test

## What the founder told us (taste test, 64 votes, no notes)
- First-impression moods: LOVED only "X Night" (pure black like X, bold tight grotesk, white pill buttons, X-style post card). MEH: Black Card, Midnight, Liquid Glass, Creator Pink, Sky. NO: Editorial (cream + italic serif), Poster (condensed caps), Clean Studio (Apple-white centred), Volt Terminal (mono + volt green), Mono Brutal.
- Fonts: nothing loved. NO: Instrument Serif, Syne, Unbounded, Archivo Expanded. MEH: Inter Tight, Geist, Anton, Space Grotesk, Playfair italic, Plus Jakarta, Fraunces, Bricolage. => crisp, neutral, high-quality grotesk; NO serif display, NO quirky/wide/condensed display faces.
- Colours: nothing loved; "X Black" (black + X's #1D9BF0 blue) was a NO. => Feel like X, but don't copy X's blue. Colour should be minimal; premium comes from light, depth and finish, not loud hues.
- Buttons: loved solid pill, sharp rectangle, frosted glass, hairline outline, hard shadow (not a discriminator).
- Logos: nothing loved; NO to condensed caps and monogram. Keep the wordmark simple and refined.
- Brands LOVED: Apple, Linear, Vercel, Cursor, Superhuman, Notion, Typefully, Wispr Flow. MEH: Arc, Raycast, Stripe, Perplexity, beehiiv, Gumroad, Granola.
- Earlier complaints about all previous rounds: too safe / generic, not premium enough, wrong fonts or colours, not "X creator" enough.

## The lane
X's black world with Linear / Vercel / Apple / Superhuman / Cursor-level craft. Dark, monochrome-first, crisp grotesk type at confident sizes, product UI as the hero, premium through light (soft spotlights, subtle gradient borders, glass, grain), depth (layering, shadows) and precision (spacing, hairlines, alignment, motion easing). It must feel like it belongs on X (post cards, compose box, white pill "Post"-style primary) without impersonating X (no X logo as our mark, no X blue as our accent).

## Product truth (for the hero copy and demo)
Hookworthy is a writing + scheduling app for creators on X (also Threads, LinkedIn, Bluesky). Its signature: Sharpen. Fluff in your first line gets a wavy underline; one tap rewrites the first line in your own voice; your facts stay. Free to start. Nothing posts without you.
Hero copy to use (you may tighten, keep two lines max, no serif): H1 "They read one line. / Make it hookworthy." Sub: "Hookworthy sharpens your first line in one tap. It still sounds like you." CTAs: "Sharpen my first line" (primary) + "Try it on your line" (secondary). Micro: "Free forever · No card · Nothing posts without you".
Demo pair (keep lowercase): draft "just wanted to share that i finally hit my first $10k month trading, took me 3 years lol" → post "my first $10k month trading took me 3 years." Why it hits: "$10k stops the scroll. 3 years makes it believable." Example account heycape (@heycape_), photo ../../assets/people/you.jpg, labelled "Example".
Fluff mark: a wavy underline under fluff words (the one product mark; colour is yours to choose, it may be the page's only colour).

## Deliverable (hero only, one screen)
- /home/user/xyphre1314/hookworthy/concepts/r80/<id>.html: ONLY the nav + hero (+ at most a sliver of what's next), designed to be judged in one screen at 1440×900 and 390×844. Self-contained; fonts self-hosted in /home/user/xyphre1314/hookworthy/fonts/ (download from Google Fonts with: curl -sS --cacert /root/.ccr/ca-bundle.crt -A "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36" "https://fonts.googleapis.com/css2?family=...", then fetch the latin woff2; don't overwrite existing files) and referenced as ../../fonts/...; images only from ../../assets/people/.
- One orchestrated motion moment (the sharpen: fluff struck/removed, sharp post lands) within ~2s of load, then still; static finished state under prefers-reduced-motion and at rest. No auto-cycling.
- /home/user/xyphre1314/hookworthy/concepts/r80/<id>.md: name (2-3 words), one-line idea, font + why, palette (hex + roles), the one premium move, what it borrows from which loved brand. Under 120 words.
- Rules: two-line headings max at 1440 and 390; WCAG AA contrast; visible focus; no horizontal scroll at 360/390; no eyebrow labels above the H1, no gradient text, no emoji icons; no invented stats/logos/testimonials.

## Verify
sh /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/up.sh
cd /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r80 && NODE_PATH=/opt/node22/lib/node_modules node check.js <id>  → "ok": true. Read shots/<id>-d.png and <id>-m.png and iterate until a Linear/Vercel/Apple designer would be proud of it. Commands under 110s. No git writes.

FINAL REPLY (short): name, idea, font, palette, the premium move, check result, weakest point.
