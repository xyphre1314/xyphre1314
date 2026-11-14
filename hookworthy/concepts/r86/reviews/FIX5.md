# Round 86, page pass 5: from 9.0–9.2 to ≥ 9.5

A fourth independent jury rated the page: brand 9.2, UI/UX 9.1, web 9.0, founder 9.0, marketing 8.0.

Marketing's score was capped by one P0, the sheet's "Design preview" notice squeezed to 6 px. The lead already fixed it: the `.sh-pv > span[aria-hidden]` selector in src.html. The lead also updated the "What leaves, and when" privacy text in legal.html and the app, so it now says Sharpen sends the first line to Claude when a server is connected. Don't redo either.

Since your pass 4, another engineer added Claude-powered Sharpen in the app and edited the homepage copy:
- the Trust rule;
- the Try label "This demo runs on your device";
- the pricing lede;
- FAQ #qa3.

The engine engineer is running a safety pass on core.js right now.

## Read
- /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/rerate4/review-{brand,uiux,web,founder,marketing}.json, plus their work-<key>/ folders.
- Engine-side items are not yours. The engine engineer owns these: marketing-2/7, founder-1, the hook items, and any "broken line" or "verdict" text.

## Apply every P1 and P2 except the engine-side ones. The ones several jurors share:
1. **Sharpened two-beat lines break at the full stop** (brand-1, web-1). Hero #pf-sharp, Try #out-line and the final #fp-sharp all render each sentence as its own unbreakable-at-the-boundary unit, so a line never wraps one word past a full stop. For example, wrap each beat in a span and let breaks fall between beats. Keep CLS 0 and the hero window height lock.
2. **Hero window spacing** (web): 20 px above the footer line, and "Why it hits" never touches it on any example. The opening settles by about 1.3 s (it's about 2.1 s now). No animated blur.
3. **Receipts don't repeat** (marketing-3). The six built-in examples must not explain the same move four times. Choose hero/Try/final drafts whose engine moves differ: a number first, a question, a cut warm-up, a split. They must stay engine-verified; run hero-sync --write and rebuild.
4. **FAQ #qa3 "Is it just AI writing?"** (marketing-4). Answer it straight, without "No." followed by "Claude does it". Suggested:

   "Your words, edited. In the app, Claude suggests a sharper first line and a check throws out any version that adds a fact, a number or a name; this demo runs the same rules on your device. Rewrites in your voice are Claude too, only when you ask."

   Measure it; keep the phone budget.
5. **Pro is sold one way** (marketing-6, founder-3): tagline "For posting every day." Phones show "500 auto-sent posts a month" plus the takeoff ping.
6. **Brand:**
   - one bento heading system: two sizes and one tone rule at every width;
   - the Who tile rebuilt as four mini X posts, each persona's own engine-verified sharpened first line (brand-3); keep the phone budget;
   - plan-card shadows don't paint over the fine print;
   - an outlined SVG wordmark, with the hook-h shoulder at x-height;
   - legal.html brought fully into the system.
7. **UI/UX:**
   - reduced motion must not hide "Another version" (it shares `.replay`);
   - the final card gets "Another version";
   - sheet email errors use `role="alert"`;
   - the phone Start-free bar hides when you're back at the top;
   - the "old look" demo button is demoted to a quiet text link.
8. **Web:** pricing cards line up at 960; the Studio highlight wraps; the FAQ height animates (static under reduced motion); split the core.js warm-up so no idle task runs over 50 ms.
9. **Founder:** if they flagged a FAQ for ghostwriters on who sees drafts, add it only if it fits the phone budget and is true to the app.
10. **Phone budget:** ≤ 10.0 screens at 390 and ≤ 10.5 at 360.

## Files and verify
As before:
- Edit r86/fix/work/src.html (+ tail.txt, sprite.txt), then run `python3 build.py`. Copy the sources to concepts/r86/src/ when done.
- Run check.js home; also check legal.html.
- CLS < 0.05 at every width; above the fold at 1440×900 and 1280×800; headings ≤ 2 lines at 8 widths; no overflow at 761–780.
- Test the sheet from every CTA, plus Try/final.
- Read your screenshots of every screen at 1440, 1024, 768, 390 and 360.
- Run hero-sync LAST, with --write if the engine changed, then rebuild.
- Update home.md with "Pass 5".
- Don't edit core.js or index.html. No git writes.

FINAL REPLY (short): changes by juror, skipped items, numbers, hero-sync status.
