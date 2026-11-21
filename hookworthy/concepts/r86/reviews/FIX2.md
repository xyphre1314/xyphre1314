# Round 86, page pass 2: from ~9.0 to ≥ 9.5 with every juror

A fresh, independent jury re-rated your page. Scores: brand 9.2, founder 9.1, UI/UX 9.0, marketing 9.0, web 8.8. The engine scored 7.0; the engine engineer is on it.

## Read
- /tmp/claude-0/-home-user-xyphre1314/b20c0c96-97f0-50b2-9a76-290620a49db9/scratchpad/r86/rerate/review-{brand,uiux,web,founder,marketing}.json: every issue has an exact fix.
- Page items from r86/rerate/review-hook.json:
  - hook-8: the unsure why contradicts its chip;
  - hook-16: the page says "Nothing to cut" after a put-back, while the engine says "Kept as you chose";
  - hook-17: the final's fluff counter doesn't match its strikes.

## Apply every P1 and P2 except where a decision below says otherwise
1. **Threads/Bluesky truth** (founder-1, marketing-13/14). The app's own FAQ says Threads and Bluesky "get everything ready and a nudge to post".
   - Hero sub: "Cut the fluff from your first line in one tap, then schedule it. It still sounds like you."
   - The platform row carries the where. Show it on phones too: "Posts to X · LinkedIn · A nudge for Threads · Bluesky".
   - FAQ #qa2: "Only what you schedule, at the time you pick. X and LinkedIn posts go out then; Threads and Bluesky get a nudge with the post ready to paste. Auto-plugs (one reply you write ahead) and reruns stay off until you turn them on."
   - Footer line: "Sharper first lines, sent at the time you pick."
   - Hero sub at 1440/1280/1024: ≤ 2 lines.
2. **Engine copy comes from the engine.** The engine engineer is changing `say` to an umbrella term ("Cut 3 bits of fluff · Split it into two beats"), fixing move names, and making `why` specific.
   - The hero renders `sharpenLine(draft).why` and `.say` verbatim (founder-2, marketing-5/8). Extend hero-sync.js to check why and say too.
   - The final counter = the number of struck spans, the same umbrella.
   - The page never rewrites engine text, except the clean/unsure state labels, and display-only non-breaking spaces in times (brand-4/web-10).
   - **Unsure** (hook-8): label "Your call." with why "“{word}” is marked, but there's no clean cut here." Never claim it "would change what you mean".
   - **After a put-back** (hook-16, uiux-4): show the engine's say/why ("Kept as you chose · You put back “x”…"). Name side effects in the hint: "“honestly” is back, so “and” stays too."
3. **Rewrite defined at every width** (marketing-2).
   - One lede line shown everywhere: "Sharpen is unlimited. A rewrite is three fresh takes in your voice: 20 a month on Free, 250 on Pro, 500 per client on Studio."
   - Try's "Another take" becomes "Another cut" (it reorders and trims your own words; it's not a rewrite).
4. **Pricing.**
   - Free bullet: desktop "15 posts a month sent at your time. After that, one tap sends each."; phone "15 auto-sent posts a month, then one tap each".
   - Pro's first bullet: "Everything in Free, plus:".
   - Studio's first bullet: "Everything in Pro" at every width, then "500 rewrites per client a month, pooled".
   - Add to the fine print: "More than 8 clients? Talk to us: hello@hookworthy.com". Plain selectable text, no mailto.
   - Studio facts: "4 clients: $72 a month, billed yearly ($96 month to month)." Check that the tile really shows 4 clients.
5. **Studio role-play.**
   - Buttons read "Approve as Priya, with her edit" / "Approve as Lena".
   - On approve, the queue row shows the edited text as "scheduled".
   - Rafael's and Marco's drafts are text-only, so no heycape photo is reused (brand-5).
   - Handles fit (brand-6).
6. **Hero Schedule pill** (uiux-10, founder-12): a real button that opens the sheet with the example line, titled "Schedule it free". Under reduced motion it's the same button.
7. **Rewrite intent in the sheet** (uiux-9): the "Get a rewrite in your voice, free" button opens the sheet titled "Get your rewrite", with sub "Three takes in your voice. Free, no card." Done title (marketing-17): "Not live yet".
8. **Brand assets** (brand-3): DON'T touch the app's assets/wordmark.svg, icon.svg or app-icon.* (the app has its own brand for now). Instead:
   - create assets/brand/afterglow-wordmark.svg (light and dark) and assets/brand/afterglow-icon.svg from the page's exact lockup, with the brand-2 spacing;
   - point the page's favicon and apple-touch icon at them, re-rendering the apple-touch PNG from the new icon.
9. **Skip:**
   - founder-10, the seventh FAQ: the phone budget is 10.49 of 10.5 at 360.
   - founder-11: no claims about X payout rules.
   - founder-13: app trial copy; the lead decides on the app.
10. **Fresh lines** (marketing-7, founder-8). The final card's default becomes a fresh trader line (lowercase, a $ticker, a number). It must be engine-verified: sharpenLine gives state sharp and you'd grade it h. Hero, Try default and final are all different drafts. Reduce the repeated heycape anchor post.
11. **Phone budget.** ≤ 10.0 at 390 and ≤ 10.5 at 360. Pay for anything you add.

## Rules
Unchanged; see r86/JURY.md "Context to respect".

## Files
- Same as before: src.html (plus sprite.txt and tail.txt) in r86/fix/work → `python3 build.py` → concepts/r86/home.html.
- Update home.md with a "Pass 2" section.
- Don't edit core.js or index.html. No git writes.

## Verify (required; each command under 110 s)
- check.js ok; axe 0 (1440, 390, plus states); CLS < 0.05 at 6 widths.
- Phone budget as above; hero post above the fold at 1440×900 and 1280×800.
- hero-sync passes (line, why, say).
- Every heading ≤ 2 lines at 1440, 1280, 1024, 960, 901, 768, 390 and 360 (web-2).
- Nothing overflows at 761–780 (brand-1, uiux-2, web-1).
- Contrast of the hero micro row on phones ≥ 4.5:1 (web-3).
- Read screenshots of every screen at every width and judge them against 9.5.
- core.js may change under you while you work. Run hero-sync last, and again if the engine changes.

FINAL REPLY (short): changes by juror, skipped items, numbers, and the hero-sync status.
