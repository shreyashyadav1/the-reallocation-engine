```
Assignment: The Reallocation Engine — Recipe Design Assignment
Student: Shreyash Yadav
GitHub handle: shreyashyadav1
Domain / situation: recipe for international MS students in a STEM information-systems program, graduating in December with OPT starting in January (fictional persona in the repo); applied-AI / LLM engineer roles (SOC 15-1252) at insurance and health-tech companies; Form D funding + H-1B record + OPT timeline gate
Recipe path: recipes/cases/2026fa/shreyashyadav1-healthins-ai-opt.md (+ .card.md)
Prototype command: node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-03
GitHub repository / branch / PR URL: https://github.com/shreyashyadav1/the-reallocation-engine (fork not yet created) / contrib/2026fa-shreyashyadav1-healthins-ai-opt / ____
Submitted commit SHA: ____
Lifecycle stage claimed: DRAFT (sample run executed and logged; 6 TODOs open, so SPECIFIED/RUNNABLE-SAMPLE not claimed)
Summary of my changes: New namespaced prototype (lib.mjs, run.mjs, 11 offline tests, fixtures), recipe + card, worked run with two scenarios and three break attempts, test report, run log. Uses the existing role-scorer.mjs via its CLI; no maintained file modified.
Known limitations: 0/27 scorer terms are records (records only pick the tier; every number scored is your-input); CSV has no SOC column (title proxy); all H-1B counts in the CSV are even (possible 2x join); Form D samples gave 0/8 hits; liveness hand-entered and postings hypothetical; no E-Verify data; process-days are guesses; scorer defaults missing liveness to 1.0 labeled record, and its --profile regex treats "work authorized" as no sponsorship needed (both documented, not patched).
```
