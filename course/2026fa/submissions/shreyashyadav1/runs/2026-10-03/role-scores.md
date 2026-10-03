# Role Scorer report — 2026-10-03

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 7 roles → Apply 3 · Consider 2 · Skip 2. **Skip rate 29%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| Vouch Inc — Software Engineer, AI Platform | 0.555 | **Apply** | composite 0.555 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [your-input]; fit 0.8·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| Sirona Medical, Inc. — ML Engineer, Clinical NLP | 0.540 | **Apply** | composite 0.540 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [your-input]; fit 0.75·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| Thirty Madison Inc — Full-Stack Engineer, Care Automation | 0.495 | **Apply** | composite 0.495 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [your-input]; fit 0.6·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| Pacific Life Insurance Co — AI Engineer, Underwriting Automation | 0.465 | **Consider** | above threshold (0.465) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [your-input]; fit 0.85·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| Lemonade Inc — LLM Engineer, Claims | 0.255 | **Consider** | composite 0.255 in the Consider band [0.2, 0.3) | fit 0.85·0.3 [your-input] × liveness 1[your-input]×timeline 1[your-input] |
| Teladoc Health Inc — Software Engineer II, AI Services | 0.000 | **Skip** | gated: timeline ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [your-input]; fit 0.8·0.3 [your-input] × liveness 1[your-input]×timeline 0[your-input] |
| Augmedix Inc — Senior Software Engineer, Ambient AI | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [your-input]; fit 0.7·0.3 [your-input] × liveness 0[your-input]×timeline 1[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
