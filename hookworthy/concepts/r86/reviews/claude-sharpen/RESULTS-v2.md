# Claude Sharpen v2 on a fresh held-out set (Nov 15)

200 new lines written blind (120 need work, 50 already sharp, 30 tricky). v2 prompt answered by Sonnet 5.5
subagents; v2 prototype validator (fromClaudeV2); two Opus judges graded every distinct output blind.

| version | all 200 | needs work (120) | sharp (50) | tricky (30) | meaning changed |
|---|---|---|---|---|---|
| on-device engine | 58.5% | 33.3% | 100% | 90.0% | 5 |
| Claude v2 raw (first version) | 81.5% | 70.0% | 100% | 96.7% | 1 |
| shipped (v2 + validator) | 73.0% | 56.7% | 100% | 93.3% | 1 |

- The engine's self-graded 85-88% on its own rounds did not hold on fresh lines (33% on lines that need work).
- The validator hurt: 28 rejections, 21 of which were Claude lines the judges graded postable, replaced by the
  weaker engine line. Accepted Claude lines: 79.7% h.
- Next: a light validator (hard safety only), prompt v3 from the 37 non-h raw outputs, Sonnet vs Opus,
  and a second fresh set for the final number.
