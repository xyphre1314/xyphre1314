# Sharpen vs Typefully: blind juror rounds (round 86)

One independent juror (a senior X ghostwriter) wrote each set of 120 first lines blind, about 60% needing work. The engineers never saw a set before it was graded. Typefully's AI rewrite = 10, held to the same safety bar (0 facts or meanings changed).

| Set | Version | Claude path (the app) | Postable, all / needs work | On-device (demo, fallback) | Postable, all / needs work | Broken on-device |
|---|---|---|---|---|---|---|
| 1 | v3 | 8.5 | 83.3% / 72.6% | 6.0 | 66.7% / 49.3% | 4 |
| 2 | v4 | 9.2 | 93.3% / 89.0% | 7.0 | 75.0% / 60.3% | 3 |
| 3 | v4.1 | 9.4 | 95.8% / 94.4% | 7.2 | 85.8% / 77.8% | 5 |
| 4 | v4.2 | **9.6** | 98.3% / 98.6% | 8.8 | 90.8% / 91.7% | **0** |

On set 4, the juror said the Claude path "matches Typefully's AI rewrite on edit quality and beats it on safety and restraint".

Caveats:
- Claude's lines came from an Opus stand-in at default effort. Production runs Opus at low effort with a 12 s timeout.
- Before quoting these numbers, re-run all four sets through `server/test/sharpen-ai-eval.mjs` with a real key.
- Set 4 leans on traps where the right edit is light or none. The juror calls set 3 (95.8%) the fairer baseline.

The per-set reviews are in this folder: blind1-v3-review.json … blind4-v42-review.json.
