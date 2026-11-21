# Claude Sharpen v1: blind grading (Nov 14)

Setup: the app's exact prompt (core.js prompts.sharpen, v1) answered by Sonnet 5.5 subagents for 297 jury lines
(juror 4's 144, juror 3's 153), then the app's validator (SHARPEN.fromClaude). Two Opus judges graded every distinct
output blind (rules vs Claude unlabeled, shuffled). h = postable as is, o = better but soft, m = wrong.

| version | all 297 | needs-work (165) | meaning/fact changes |
|---|---|---|---|
| on-device engine | 83.5% h | 70.9% | 8 |
| raw Claude v1 | 81.1% h | 66.7% | 5 |
| shipped (Claude + validator) | 82.8% h | 69.7% | 3 |

By set: on fresh juror-4 lines shipped 85% (needs-work 75%) vs engine 81% (66%); on juror-3 lines (the engine was
tuned on them) the engine leads, 86% vs 80%.
Validator: rejected 50 Claude lines (35 graded h, 10 o, 5 m); accepted 247 (206 h, 33 o, 8 m, 3 meaning).
Judges' notes: v1's prompt is too timid ("only cut, never longer") so "basically", comma splices, cliches and flat
promo openers stay. Next: a bolder prompt with three ranked versions, a recalibrated validator, a model comparison,
and a fresh held-out set.
