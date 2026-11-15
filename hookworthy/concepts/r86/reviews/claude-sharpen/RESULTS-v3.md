# Claude Sharpen v3: final blind score on a second fresh held-out set (Nov 15)

200 new lines (120 need work, 50 already sharp, 30 tricky), written blind and never used for tuning.
v3 prompt answered by Sonnet 5.5 and by Opus 5.5 subagents (default effort); v3 light validator (fromClaudeV3);
two Opus judges graded every distinct output blind. h = a good creator would post it exactly as is.

| version | all 200 | needs work | already sharp | tricky | meaning changed |
|---|---|---|---|---|---|
| on-device engine | 52.5% | 27.5% | 98.0% | 76.7% | 4 |
| Sonnet 5.5 v3 raw | 86.5% | 78.3% | 100% | 96.7% | 0 |
| Sonnet 5.5 v3 shipped | 85.5% | 76.7% | 100% | 96.7% | 0 |
| Opus 5.5 v3 raw | 93.5% | 90.0% | 100% | 96.7% | 0 |
| **Opus 5.5 v3 shipped** | **94.0%** | **90.8%** | **100%** | **96.7%** | **0** |

Head to head on the 120 lines that need work (shipped): Opus better 23, Sonnet better 5, tie 92.
Validator: passed 198/200 (Sonnet) and 197/200 (Opus); every rejection was a real safety catch.
Caveats: subagents ran at their default effort, the app will run low effort for latency; production numbers
need confirming with a real key (server/test/sharpen-ai-eval.mjs).
History: v1 shipped 82.8% (jury lines), v2 73.0% (held-out 1), v3 Opus 94.0% (held-out 2).
