# Run log — healthins-ai-opt, sample runs (2026-10-03)

## Executive summary

The new insurance/health applied-AI triage tool was run on a fictional student, on two dates, using the repository's shipped sample data. The first date, before OPT starts, produced three openings to apply to, two to network into, two to drop, and two that a human must check first. The second date, six weeks after OPT started, dropped every opening that could be scored. Two bugs in the new code were found and fixed. Two behaviours of the shared scorer were found and documented, not changed.

## 2026-10-03 — healthins-ai-opt scenario 1 (before EAD)

- **Recipe:** recipes/cases/2026fa/shreyashyadav1-healthins-ai-opt.md v0.1.0
- **Inputs:**
  - persona `scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.example.json` (fictional)
  - candidates `inputs/candidates.example.json` (hypothetical postings)
  - `--today 2026-10-03`
  - data: 80 Days CSV (full shipped file), Form D samples (4 files × 50 companies), BLS compact
- **Command:** `node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-03`
- **Outputs:** `course/2026fa/submissions/shreyashyadav1/runs/2026-10-03/{roles.json, role-scores.json, role-scores.md, run-log.json, report.md}`
- **Result:** Apply 3 · Consider 2 · Skip 2 · BLOCKED 2
  - entity matched 8/9; Form D sample hits 0/8
  - scorer terms that are records: 0/27 (the tier's p, fit, liveness and timeline are all your-input)
  - scorer skip rate 29% on the scored subset (the candidate list was pre-filtered by the persona)
- **Gate decisions:** G6 (human release) not cleared. The persona is fictional and the postings are hypothetical, so there is nothing to apply to.
- **Open issues:**
  - liveness is hand-entered;
  - title rule is a proxy for SOC 15-1252;
  - all CSV approval and denial counts are even (1557/1557);
  - no E-Verify data.

## 2026-10-03 — healthins-ai-opt scenario 2 (2027-02-20, 40 unemployment days used)

- **Recipe:** same, v0.1.0
- **Inputs:** persona `inputs/persona.after-ead.example.json`, same candidates, `--today 2027-02-20`
- **Command:** `node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2027-02-20 --persona scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.after-ead.example.json`
- **Outputs:** `course/2026fa/submissions/shreyashyadav1/runs/2027-02-20/`
- **Result:** Skip 7 · BLOCKED 2
  - Vouch: timeline 0.167 → composite 0.0927
  - the other six are past the 90-day ceiling or gated by liveness
- **Gate decisions:** none.
- **Open issues:**
  - the first run of this scenario exposed a double-count in `timelineFactor` (fixed, regression test added); outputs above are from the fixed code.

## 2026-10-03 — engine baseline (setup)

- **Commands:** `npm run ats:scan -- --dry-run` (fails: no `data/ats/portals.yml` on a fresh clone); the same with `REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml` (Databricks board, read-only, 61 offers listed, nothing written); `npm run ats:liveness -- <Databricks posting>` (fails until `npx playwright install --only-shell chromium`, then `active`); `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/shreyashyadav1/runs` (Cambridge biotech 0.446 Apply; non-sponsor 0.178 Skip — matches Ch.11).
- **Outputs:** `course/2026fa/submissions/shreyashyadav1/runs/role-scores.{json,md}`.
- **Open issues:** a fresh clone can't run `ats:scan` or `ats:liveness` without extra setup.

## 2026-10-03 — failure case and break attempts

- **Past authorization:** `--persona …/test/fixtures/persona.past-auth.fixture.json` → exit 2, failure log at `course/2026fa/submissions/shreyashyadav1/runs/fail-past-auth/run-log.json`, no scores.
- **Break attempts:** inputs and outputs in `course/2026fa/submissions/shreyashyadav1/breaks/`.
  - Scorer default liveness: 1.0 labeled `record`.
  - Scorer `--profile` "work authorized" text inverts sponsor vs non-sponsor.
- **Defects logged, not patched (maintained file `scripts/score/role-scorer.mjs`):** both of the above. For a maintainer to decide.

## 2026-10-03 — clean checkout of the pushed branch

- **Inputs:** fresh clone of `contrib/2026fa-shreyashyadav1-healthins-ai-opt` at `1801e9e` from the fork.
- **Commands:** `npm install`, `npm run doctor`, `npm run verify`, conformance on the prototype folder, the test file, scenario 1, the past-authorization failure case, `git status`, `git diff --stat 015843d...HEAD`, `node scripts/pii-scan.mjs --diff 015843d`.
- **Result:** all pass. Outputs are identical to the committed ones (`git status` clean after the runs). 45 files changed, all namespaced. History PII scan clean.
- **PR:** https://github.com/nikbearbrown/the-reallocation-engine/pull/39

