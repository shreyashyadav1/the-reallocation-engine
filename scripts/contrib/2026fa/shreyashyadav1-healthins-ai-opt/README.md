---
owner: shreyashyadav1
term: 2026fa
component: healthins-ai-opt
status: DRAFT
promoted_to: null
---

# healthins-ai-opt — prototype

## Executive summary

This is a small program for an international master's student who wants an applied-AI engineering job at an insurance or health company and will be on OPT. It takes the student's list of job openings and checks each against public records: has this company had visa petitions approved for software-type roles, and when did it last raise money. It then checks whether the hiring process can finish before the student's allowed unemployment days run out. Roles whose posting is closed, or whose timing cannot work, are dropped. Roles it cannot check (an unknown company, a posting nobody has looked at) are held for the person instead of guessed. The rest go to the repository's existing scorer, which returns Apply / Consider / Skip with its arithmetic. It writes one log for an agent and one report for the person. It runs on sample data only, calls no model, and makes no network calls.

## Run it (from the repo root)

```bash
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-03
```

Defaults: persona `inputs/persona.example.json`, candidates `inputs/candidates.example.json`, output `course/2026fa/submissions/shreyashyadav1/runs/<today>/`. Leave out `--today` to use the system date.

Second scenario (same persona after OPT started, 40 unemployment days used):

```bash
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2027-02-20 --persona scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.after-ead.example.json
```

## Test it (offline, fixtures only)

```bash
node --test scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/healthins-ai-opt.test.mjs
node scripts/conformance.mjs scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/
```

The end-to-end tests run `run.mjs`, which calls the real `scripts/score/role-scorer.mjs` CLI. There is no copy of the scorer here.

## Inputs

| Input | Path | Label |
|---|---|---|
| H-1B record, industry, funding stage/date | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record |
| Form D filings (50 companies/quarter sample) | `data/sec/form-d/processed/sample/*.sample.json` | record |
| National OEWS median for the target SOC (context only) | `data/bls/compact/soc_occupation_compact.csv` | record |
| OPT dates, unemployment days, buffer, sectors, states | `inputs/persona.example.json` (fictional) | your-input |
| Candidate roles, fit, process-days estimate, liveness check | `inputs/candidates.example.json` (hypothetical postings) | your-input |
| Title rule, tier thresholds, funding-recency window, timeline formula | `lib.mjs` (`TITLE_RULE`, `TIER_RULE`, `timelineFactor`) | your-input (author's rule) |

Nothing is labeled `model-judgment` because no model is called.

## Outputs (all in the out-dir)

- `roles.json` — what this script hands to the scorer
- `role-scores.json`, `role-scores.md` — written by `role-scorer.mjs`, unchanged
- `run-log.json` — agent log: every value with its label and source file, coverage, data-quality flags, blocked reasons
- `report.md` — person report: decisions, gate dates, next action per role, a "network, don't apply" list

The script refuses an `--out-dir` that is inside the repo but outside `course/2026fa/submissions/shreyashyadav1/` or this folder.

## Named failure cases and what happens

| Case | Behaviour |
|---|---|
| Company not in the CSV (exact normalised name) | `BLOCKED: entity-not-found`; not scored; no prefix/fuzzy match |
| Two CSV rows normalise to the same name | `BLOCKED: entity-ambiguous` |
| In CSV, no H-1B approvals | tier `Unknown`, sponsorship vote omitted (not set to 0) |
| Posting never checked / check undated | `BLOCKED: liveness-unchecked` — held back because the scorer treats a missing liveness as 1.0 |
| Posting closed | liveness 0 → scorer Skip (gated) |
| Hiring finishes past the unemployment ceiling or auth end | timeline 0 → scorer Skip (gated) |
| Authorization end already past, or EAD date missing | exit 2, `run-log.json` with `status: failed`, no scores |
| Target SOC has no BLS row | role-quality context `missing: no-occupation-row`; nothing substituted |
