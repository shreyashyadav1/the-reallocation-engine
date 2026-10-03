# TEST-REPORT — healthins-ai-opt

## Executive summary

This report records how the prototype was checked. It covers the repository's own health checks before and after the change, the sample run with its real output, each named failure case, and which files changed.

- **Tests:** the prototype's 11 offline tests pass, and its folder passes the repository's format check.
- **Doctor:** passes before and after the change.
- **Verify:** `npm run verify` fails on this Mac **before any change**, because the local Python lacks a YAML library. It passes with that library in a throwaway environment.
- **PII scan:** it finds one email that already exists upstream in `package-lock.json`. None of the new files triggers it.
- **Clean checkout:** a fresh clone of the pushed branch (commit `1801e9e`) passes everything, with outputs identical to the committed ones (section 7). The PR is https://github.com/nikbearbrown/the-reallocation-engine/pull/39.

What a human still has to judge is listed at the end.

**Who ran it:** the AI agent (Claude Code), 2026-10-03, macOS (Darwin 25.5), Node v24.21.0, Python 3.14.6.
- Base commit `015843d` of `nikbearbrown/the-reallocation-engine`.
- Branch `contrib/2026fa-shreyashyadav1-healthins-ai-opt`.
- The local home path is shown as `~` in pasted output.

**Re-run by the student on 2026-10-03** (same working copy, before committing): tests 11/11 pass; both scenarios gave the same output as section 3.

The run from a clean checkout of the pushed branch is in section 7 (Claude ran it).

## 1. Toolchain baseline

The "before" runs used a separate clean worktree of the base commit, with no contribution files.

### Before — `npm run doctor`

```text
  ✓ no private/PII paths are tracked

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
exit 0
```

### Before — `npm run verify` (system Python, no PyYAML)

```text

ERROR (1):
  E1 .ai/manifest.yaml does not parse: Error: Command failed: python3 -c "import yaml,json;print(json.dumps(yaml.safe_load(open('.ai/manifest.yaml'))))"

✗ manifest check FAILED (1 error)
exit 1
```

### Before — `npm run verify` with PyYAML in a scratch venv (not committed, nothing installed globally)

```text

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
exit 0
```

### After — `npm run doctor`

```text
  ✓ no private/PII paths are tracked

RECIPES (33)
  with lifecycle frontmatter: 33   missing: 0
  by status: DRAFT 28 · RUNNABLE-SAMPLE 4 · RUNNABLE-LIVE  # DRAFT | SPECIFIED | RUNNABLE-SAMPLE | RUNNABLE-LIVE | VERIFIED 1
  open TODOs: 318 declared (in frontmatter) · 318 [TODO markers in bodies

SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
exit 0
```

### After — `npm run verify` (system Python, same failure as before)

```text
ERROR (1):
  E1 .ai/manifest.yaml does not parse: Error: Command failed: python3 -c "import yaml,json;print(json.dumps(yaml.safe_load(open('.ai/manifest.yaml'))))"

✗ manifest check FAILED (1 error)
exit 1
```

### After — `npm run verify` (with PyYAML)

```text
$ PATH=<venv with pyyaml>/bin:$PATH npm run verify

> the-reallocation-engine@1.0.0 verify
> node scripts/conformance.mjs && node scripts/manifest-check.mjs

conformance: 171 files (88 md · 36 py · 33 js · 10 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
MANIFEST CHECK — The Reallocation Engine
==========================================

WARN (3):
  W1 ignore path not in .gitignore: archive/
  W2 private path not gitignored (PII/secret risk): private/
  W2 private path not gitignored (PII/secret risk): data/ats/

✓ manifest check passed (3 warnings)
exit 0
```

### Before and after — `node scripts/pii-scan.mjs` (working tree)

Before (clean base):

```text
$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <npm-author-email, redacted here so this report does not re-trigger the scanner>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
exit 1
```

After:

```text
$ node scripts/pii-scan.mjs
pii-scan: 1 finding(s) — see DATA_CONTRACT.md §Zero-Conditions

  [email] package-lock.json — <npm-author-email, redacted here so this report does not re-trigger the scanner>

If a finding is a false positive (fictional data outside the sanctioned dirs),
move it under search/examples/ or resumes/ rather than allowlisting it here.
exit 1
```

What this shows:
- The only finding is `package-lock.json`: an upstream file, unmodified, in an npm deprecation message. It's the same finding before and after.
- CI runs this working-tree scan on every PR, so it will flag that line for every student. That isn't something this branch can fix without touching a file outside its namespace.
- The check that matters for this branch is `node scripts/pii-scan.mjs --diff <base>` over the branch history. It is **clean** on this branch (section 7, and pasted in the PR).

### Engine commands, run once

`ats:scan` (fails on a fresh clone: no `portals.yml`), `ats:liveness` (fails until the Playwright browser is installed, then reports `active`), and `score` on the Ch.11 example (reproduces the book). Full output is in `WORKED-RUN.md` → "Engine baseline".

## 2. Prototype tests and conformance

```text
$ node --test scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/healthins-ai-opt.test.mjs
✔ title rule: software/AI engineering in, medtech and business titles out (0.745334ms)
✔ entity names: exact after normalisation, never prefix (0.161792ms)
✔ csv reader handles quoted commas and python list titles (0.553416ms)
✔ sponsorship: missing entity and empty record are not turned into numbers (0.215958ms)
✔ timeline gate: comfortable, inside buffer, past ceiling, past auth end (0.829875ms)
✔ timeline gate after EAD: days already used are not counted twice (0.058792ms)
✔ persona validation refuses past or missing dates (0.182125ms)
✔ liveness: unchecked or undated never becomes a factor (0.063542ms)
✔ end to end on fixtures: real scorer, both outputs, labels, failure cases (77.106125ms)
✔ fails clearly, with no scores, when the authorization end is past (28.268042ms)
✔ refuses to write over tracked repo paths (27.52275ms)
ℹ tests 11
ℹ suites 0
ℹ pass 11
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 178.672042
exit 0
```

```text
$ node scripts/conformance.mjs scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/
conformance: 11 files (1 md · 7 json · 3 js)
✓ all conform (machine half of P4). Adequacy is still the human gate.
exit 0
```

## 3. The real sample run and its output

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-03
healthins-ai-opt · today 2026-10-03 · 9 candidate roles
  entity matched 8/9 · Form D sample hits 0/8 · blocked 2 · scorer terms that are records 0/27
  scorer: ✓ scored 7 roles → Apply 3 · Consider 2 · Skip 2 (skip 29%)
  → Apply 3 · Consider 2 · Skip 2 · BLOCKED 2
  Apply    0.555  Vouch Inc — Software Engineer, AI Platform  [2h apply]
  Apply    0.54   Sirona Medical, Inc. — ML Engineer, Clinical NLP  [2h apply]
  Apply    0.495  Thirty Madison Inc — Full-Stack Engineer, Care Automation  [2h apply]
  Skip     0      Teladoc Health Inc — Software Engineer II, AI Services  [reallocate]
  Consider 0.465  Pacific Life Insurance Co — AI Engineer, Underwriting Automation  [3h network]
  Consider 0.255  Lemonade Inc — LLM Engineer, Claims  [3h network]
  Skip     0      Augmedix Inc — Senior Software Engineer, Ambient AI  [reallocate]
  BLOCKED  —      Clarify Health Solutions Inc — Software Engineer, Data Platform  [human-gate]
  BLOCKED  —      Abridge AI, Inc. — Applied AI Engineer  [human-gate]
  wrote course/2026fa/submissions/shreyashyadav1/runs/2026-10-03/run-log.json + course/2026fa/submissions/shreyashyadav1/runs/2026-10-03/report.md
exit 0
```

Second scenario (`--today 2027-02-20`, 40 days used):

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2027-02-20 --persona scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.after-ead.example.json
healthins-ai-opt · today 2027-02-20 · 9 candidate roles
  entity matched 8/9 · Form D sample hits 0/8 · blocked 2 · scorer terms that are records 0/27
  scorer: ✓ scored 7 roles → Apply 0 · Consider 0 · Skip 7 (skip 100%)
  → Apply 0 · Consider 0 · Skip 7 · BLOCKED 2
  Skip     0.0927 Vouch Inc — Software Engineer, AI Platform  [skip]
  Skip     0      Sirona Medical, Inc. — ML Engineer, Clinical NLP  [reallocate]
  Skip     0      Thirty Madison Inc — Full-Stack Engineer, Care Automation  [reallocate]
  Skip     0      Teladoc Health Inc — Software Engineer II, AI Services  [reallocate]
  Skip     0      Pacific Life Insurance Co — AI Engineer, Underwriting Automation  [reallocate]
  Skip     0      Lemonade Inc — LLM Engineer, Claims  [reallocate]
  Skip     0      Augmedix Inc — Senior Software Engineer, Ambient AI  [reallocate]
  BLOCKED  —      Clarify Health Solutions Inc — Software Engineer, Data Platform  [human-gate]
  BLOCKED  —      Abridge AI, Inc. — Applied AI Engineer  [human-gate]
  wrote course/2026fa/submissions/shreyashyadav1/runs/2027-02-20/run-log.json + course/2026fa/submissions/shreyashyadav1/runs/2027-02-20/report.md
exit 0
```

## 4. Each named failure case

| Case | How exercised | Result |
|---|---|---|
| Company missing from CSV | real run: "Abridge AI, Inc." (the CSV has only `ABRIDGED INC`); fixture "Fixture Claims" (a prefix of a real row) | `BLOCKED: entity-not-found`; not scored |
| Two rows, one normalised name | fixture `ACME HEALTH INC` / `ACME HEALTH, LLC` | `BLOCKED: entity-ambiguous` |
| In CSV, no approvals | real run: Lemonade Inc; fixture "Fixture No Sponsor" | tier Unknown, p null, vote omitted |
| Posting never checked | real run: Clarify Health; fixture "unchecked" | `BLOCKED: liveness-unchecked`; absent from `roles.json` |
| Posting closed | real run: Augmedix; fixture "ghost" | liveness 0 → scorer Skip (gated) |
| Hiring ends past the ceiling | real run: Teladoc (200 days → 100 days unemployed); fixture "too-slow" | timeline 0 → Skip (gated) |
| Authorization end already past | `persona.past-auth.fixture.json` on real data | exit 2; failure `run-log.json`; no `role-scores.json` |
| Output dir over tracked files | `--out-dir data/examples` | exit 2; `git status data/examples` clean |

Real output:

```text
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-03 --persona scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/fixtures/persona.past-auth.fixture.json --out-dir course/2026fa/submissions/shreyashyadav1/runs/fail-past-auth
✗ persona dates/limits unusable — timeline gate cannot be computed:
  - visa.auth_end_date 2025-12-31 is already past (today 2026-10-03) — no timeline can be computed
  wrote failure log: course/2026fa/submissions/shreyashyadav1/runs/fail-past-auth/run-log.json (no scores were produced)
exit 2
$ ls course/2026fa/submissions/shreyashyadav1/runs/fail-past-auth
run-log.json
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-03 --out-dir data/examples
✗ --out-dir data/examples is inside the repo but outside this contribution's namespaces; refusing to write there
exit 2
$ git status --short data/examples
(no output = untouched)
```

## 5. Files changed (namespaced paths only)

`git diff --stat` of the build commit against the base, from the fresh clone in section 7: 45 files, all in the namespaced paths, and no maintained file. (A later commit only updates docs in `course/2026fa/submissions/shreyashyadav1/` and `logs/runs/`.)

## 6. What the gate requires a human to judge

- **Every Apply row:** open the posting, since liveness here is hand-entered and the postings are hypothetical. Re-check the expected start and unemployment-day count against your own EAD dates.
- **Every BLOCKED row:** resolve the company's legal name, or check the posting, then re-run.
- **The title rule:** decide whether matched titles like "Senior NLP Data Scientist" really count as your occupation.
- **The scorer's numbers:** know that 0/27 terms are records. The ranking reflects your own inputs and the author's rules, sorted by public records.
- **E-Verify and STEM eligibility:** ask the employer and the DSO.
- **Lifecycle status:** the recipe is DRAFT. Promotion is a maintainer's decision.

## 7. Clean checkout of the pushed branch (fresh clone, run by Claude)

```text
$ git clone --branch contrib/2026fa-shreyashyadav1-healthins-ai-opt https://github.com/shreyashyadav1/the-reallocation-engine.git
exit 0
$ git log -1 --format="%h %s"
1801e9e healthins-ai-opt: insurance/health applied-AI roles under an OPT clock (DRAFT)
$ npm install

added 55 packages in 1s
$ npm run doctor
SUMMARY
  environment: ✓ runnable
  recipes: 33/33 carry lifecycle frontmatter — all tracked
  next: continue
exit 0
$ npm run verify   # with PyYAML on PATH, as CI installs it
conformance: 171 files (88 md · 36 py · 33 js · 10 json · 4 sh)
✓ all conform (machine half of P4). Adequacy is still the human gate.
✓ manifest check passed (3 warnings)
exit 0
$ node scripts/conformance.mjs scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/
conformance: 11 files (1 md · 7 json · 3 js)
✓ all conform (machine half of P4). Adequacy is still the human gate.
exit 0
$ node --test scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/healthins-ai-opt.test.mjs
ℹ tests 11
ℹ pass 11
ℹ fail 0
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-03
healthins-ai-opt · today 2026-10-03 · 9 candidate roles
  entity matched 8/9 · Form D sample hits 0/8 · blocked 2 · scorer terms that are records 0/27
  scorer: ✓ scored 7 roles → Apply 3 · Consider 2 · Skip 2 (skip 29%)
  → Apply 3 · Consider 2 · Skip 2 · BLOCKED 2
  Apply    0.555  Vouch Inc — Software Engineer, AI Platform  [2h apply]
  Apply    0.54   Sirona Medical, Inc. — ML Engineer, Clinical NLP  [2h apply]
  Apply    0.495  Thirty Madison Inc — Full-Stack Engineer, Care Automation  [2h apply]
  Skip     0      Teladoc Health Inc — Software Engineer II, AI Services  [reallocate]
  Consider 0.465  Pacific Life Insurance Co — AI Engineer, Underwriting Automation  [3h network]
  Consider 0.255  Lemonade Inc — LLM Engineer, Claims  [3h network]
  Skip     0      Augmedix Inc — Senior Software Engineer, Ambient AI  [reallocate]
  BLOCKED  —      Clarify Health Solutions Inc — Software Engineer, Data Platform  [human-gate]
  BLOCKED  —      Abridge AI, Inc. — Applied AI Engineer  [human-gate]
  wrote course/2026fa/submissions/shreyashyadav1/runs/2026-10-03/run-log.json + course/2026fa/submissions/shreyashyadav1/runs/2026-10-03/report.md
exit 0
$ node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-03 --persona scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/fixtures/persona.past-auth.fixture.json --out-dir course/2026fa/submissions/shreyashyadav1/runs/fail-past-auth
✗ persona dates/limits unusable — timeline gate cannot be computed:
  - visa.auth_end_date 2025-12-31 is already past (today 2026-10-03) — no timeline can be computed
  wrote failure log: course/2026fa/submissions/shreyashyadav1/runs/fail-past-auth/run-log.json (no scores were produced)
exit 2
$ git status --short   # did the runs change any tracked file?
(no output = outputs identical to the committed ones)
$ git diff --stat=200,160 015843d...HEAD
 course/2026fa/submissions/shreyashyadav1/CHANGE-BRIEF.md                                                          |   74 +++++
 course/2026fa/submissions/shreyashyadav1/DOMAIN-JUSTIFICATION.md                                                  |   52 ++++
 course/2026fa/submissions/shreyashyadav1/FRICTIONAL.md                                                            |   96 ++++++
 course/2026fa/submissions/shreyashyadav1/SOURCES.md                                                               |   59 ++++
 course/2026fa/submissions/shreyashyadav1/SUBMISSION.md                                                            |   13 +
 course/2026fa/submissions/shreyashyadav1/TEST-REPORT.md                                                           |  281 +++++++++++++++++
 course/2026fa/submissions/shreyashyadav1/WORKED-RUN.md                                                            |  393 ++++++++++++++++++++++++
 course/2026fa/submissions/shreyashyadav1/breaks/default-out/role-scores.json                                      |  109 +++++++
 course/2026fa/submissions/shreyashyadav1/breaks/default-out/role-scores.md                                        |   12 +
 course/2026fa/submissions/shreyashyadav1/breaks/no-liveness-out/role-scores.json                                  |   66 ++++
 course/2026fa/submissions/shreyashyadav1/breaks/no-liveness-out/role-scores.md                                    |   11 +
 course/2026fa/submissions/shreyashyadav1/breaks/no-liveness-role.json                                             |    4 +
 course/2026fa/submissions/shreyashyadav1/breaks/profile-out/role-scores.json                                      |  109 +++++++
 course/2026fa/submissions/shreyashyadav1/breaks/profile-out/role-scores.md                                        |   12 +
 course/2026fa/submissions/shreyashyadav1/breaks/profile-work-authorized.json                                      |    1 +
 course/2026fa/submissions/shreyashyadav1/breaks/sponsor-vs-nonsponsor.json                                        |    8 +
 course/2026fa/submissions/shreyashyadav1/runs/2026-10-03/report.md                                                |  172 +++++++++++
 course/2026fa/submissions/shreyashyadav1/runs/2026-10-03/role-scores.json                                         |  317 +++++++++++++++++++
 course/2026fa/submissions/shreyashyadav1/runs/2026-10-03/role-scores.md                                           |   17 ++
 course/2026fa/submissions/shreyashyadav1/runs/2026-10-03/roles.json                                               |  220 ++++++++++++++
 course/2026fa/submissions/shreyashyadav1/runs/2026-10-03/run-log.json                                             | 1280 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 course/2026fa/submissions/shreyashyadav1/runs/2027-02-20/report.md                                                |  170 +++++++++++
 course/2026fa/submissions/shreyashyadav1/runs/2027-02-20/role-scores.json                                         |  317 +++++++++++++++++++
 course/2026fa/submissions/shreyashyadav1/runs/2027-02-20/role-scores.md                                           |   17 ++
 course/2026fa/submissions/shreyashyadav1/runs/2027-02-20/roles.json                                               |  220 ++++++++++++++
 course/2026fa/submissions/shreyashyadav1/runs/2027-02-20/run-log.json                                             | 1257 +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
 course/2026fa/submissions/shreyashyadav1/runs/fail-past-auth/run-log.json                                         |   11 +
 course/2026fa/submissions/shreyashyadav1/runs/role-scores.json                                                    |  241 +++++++++++++++
 course/2026fa/submissions/shreyashyadav1/runs/role-scores.md                                                      |   15 +
 logs/runs/2026fa-shreyashyadav1-1.md                                                                              |   53 ++++
 recipes/cases/2026fa/shreyashyadav1-healthins-ai-opt.card.md                                                      |   66 ++++
 recipes/cases/2026fa/shreyashyadav1-healthins-ai-opt.md                                                           |  196 ++++++++++++
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/README.md                                                  |   71 +++++
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/candidates.example.json                             |   32 ++
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.after-ead.example.json                      |   32 ++
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.example.json                                |   24 ++
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/lib.mjs                                                    |  239 +++++++++++++++
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs                                                    |  331 ++++++++++++++++++++
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/fixtures/candidates.fixture.json                      |   17 ++
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/fixtures/formd/companies-fixture-2026q2-d.sample.json |    2 +
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/fixtures/mini-80days.csv                              |    6 +
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/fixtures/mini-bls.csv                                 |    2 +
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/fixtures/persona.fixture.json                         |    5 +
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/fixtures/persona.past-auth.fixture.json               |    3 +
 scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/healthins-ai-opt.test.mjs                             |  149 +++++++++
 45 files changed, 6782 insertions(+)
$ node scripts/pii-scan.mjs --diff 015843d
pii-scan: clean ✓
exit 0
```
