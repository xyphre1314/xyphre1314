# Round 86, page pass 4: from 9.0–9.1 to ≥ 9.5

A third independent jury rated your pass-3 page: brand 9.1, founder 9.1, UI/UX 9.0, web 9.0, marketing 9.0. The engine scored 7.6, and the engine engineer is on it again.

## Read
- r86/rerate3/review-{brand,uiux,web,founder,marketing}.json and their work-<key>/ folders.

## Apply every P1 and P2, except where a decision below says otherwise
1. **Engine items are not yours:** uiux-1, marketing-1/3, hook-*.
   - The engine engineer will make `cut` contain every removed word, adding kind 'reshape' for structural words. Render reshape strikes without the squiggle, count only fluff in the counter, and keep every struck span toggleable.
   - Marketing-2 IS yours: show "Tap a struck word to put it back." only when something is struck. Otherwise show "Every fact you wrote is still there."
   - Fix the curly-apostrophe bug that shows "Why it hits" instead of "Your call." after a put-back (marketing).
2. **Off-brand links (brand-1).**
   - Build concepts/r86/legal.html in Afterglow: same nav, footer and type. Use the app's plain-words privacy and terms content, read from index.html's #legal (line ~13282, "round 30: privacy and terms, in plain words"). Point "Privacy and terms" at it.
   - The sheet's "Open the demo app" stays, because it's the only working product. Label it honestly: "Open the working demo (it still wears the old look)".
3. **Pro sells on what only Pro does (founder-1).** Check index.html for what's true on Pro: the takeoff ping, drafted replies, 250 rewrites. Lead the Pro card with those, and put the posting allowance lower. At ≤ 760 px, each paid card shows two real reasons.
4. **Switchers (founder-2).**
   - Add the FAQ item "I already use a scheduler." Answer it with true facts from the app's #switch page: bring your Typefully or CSV export, your past posts teach it how you open, and Sharpen is free whatever you post with.
   - Add a footer link to it.
   - FAQ budget: replace or merge an item if needed, to hold the phone budget.
5. **Tag Pro-only moments "Pro"** in the bento (founder), quietly, as a small label.
6. **Performance (web-1).** On idle after core.js loads, call `HWCore.SHARPEN.warm && HWCore.SHARPEN.warm()`, or else one throwaway `sharpenLine('warm up')`. Before the first Sharpen, yield one frame (requestAnimationFrame) so the press state paints.
7. **Everything else:**
   - web: pvFade re-measured on resize; Voice and phone Try heights locked; a real tablet layout for Studio and Pricing at 761–900; the hero caption wrap; the X handle truncation; heading sizes; the thin Who and Trust bands;
   - uiux-2: the LinkedIn note stays opaque;
   - Studio: fill the empty block for clients without media, and resolve the comment after Approve;
   - brand: one heading treatment per tile size; the photo reads as a trading journal (or use a different crop); heycape and Lena don't share a photo; the Previews highlight doesn't look like a text selection; a stronger hero light on phones; the hook-h symbol tail is not clipped;
   - founder: the "34% comes first" why (if engine-side, leave it), "at your best time", and the yearly "Cancel anytime" wording.
8. **Phone budget:** ≤ 10.0 screens at 390 and ≤ 10.5 at 360.

## Files and verify
Same as FIX3.md. Use check.js, your fix3/ scripts, CLS at all widths, phone budget, above-the-fold, sheet, Try/final test lines, headings ≤ 2 lines, and no overflow at 761–780. Also run check.js-style checks on legal.html (errors, overflow, axe).
- Run hero-sync LAST, with --write if the engine changed, then rebuild.
- Update home.md with "Pass 4".
- Don't edit core.js or index.html. No git writes.

FINAL REPLY (short): changes by juror, skipped items, numbers, hero-sync status, and what might still hold a juror under 9.5.
