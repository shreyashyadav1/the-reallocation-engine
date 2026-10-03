# Worked run — healthins-ai-opt v0.1.0

## Executive summary

The prototype was run on one fictional student with nine realistic openings at insurance and health companies, on two dates: once before OPT starts, and once six weeks after it started.

- **Before OPT starts:** 3 Apply, 2 Consider (network first), 2 Skip, and 2 held back because a fact was missing.
- **Six weeks into OPT without a job:** every opening that could be scored was Skip, because hiring would end past the 90-day unemployment limit.

The most important honest result: **none of the 27 numbers the shared scorer multiplied came from a record.** The public records decide which tier each company falls in, but every number the scorer used was the student's input or the author's rule. Building it also turned up two bugs in my own code (fixed and tested) and two behaviours of the shared scorer that could mislead an OPT student (documented, not changed).

## Engine baseline (run once before building, as the assignment asks)

### `npm run ats:scan -- --dry-run`

On a fresh clone the command fails, because `data/ats/portals.yml` is private and not shipped. Pointed at the shipped example config, it scans one public Greenhouse board read-only and writes nothing.

```text
$ npm run ats:scan -- --dry-run

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Error: portals.yml not found. Run onboarding first.
exit 1

$ REALLOCATION_ENGINE_PORTALS=data/ats/portals.example.yml npm run ats:scan -- --dry-run

> the-reallocation-engine@1.0.0 ats:scan
> node scripts/ats/scan.mjs --dry-run

Scanning 1 companies via providers (0 local parser; 0 skipped — no provider matched)
(dry run — no files will be written)


━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Portal Scan — 2026-10-03
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Companies scanned:     1
Total jobs found:      886
Filtered by title:     393 removed
Filtered by location:  422 removed
Duplicates:            10 skipped
New offers added:      61

New offers:
  + Databricks | AI Engineer - FDE (Forward Deployed Engineer) | Remote - India
  + Databricks | AI Engineer – Forward Deployed Engineering (AI FDE) | United States
  + Databricks | AI Transformation Leader | United States
  + Databricks | 	Delivery Solutions Architect - Communications, Media, Entertainment & Games | United States
  + Databricks | Delivery Solutions Architect - Retail | Denver, Colorado; West Coast - United States
  + Databricks | Director, Agent & AI Search | United States
  + Databricks | Director, Americas Field Marketing at Databricks | United States
  + Databricks | Director, Field Engineering (CPG & Retail) | United States
  + Databricks | Director, Marketing Strategy and AI Transformation | United States
  + Databricks | Director, Paid Media | United States
  + Databricks | Field Engineering Enablement Leader | United States
  + Databricks | Forward Deployed Engineer (FDE) - Public Sector | United States
  + Databricks | Lakebase Associate Director - Retail | United States
  + Databricks | Lead Field Technical Program Manager, FDE - Retail, Consumer Goods, Travel, Transportation & Hospitality | United States
  + Databricks | Lead Learning Product Manager | United States
  + Databricks | Lead Solutions Architect - Generative AI (EMEA Emerging DNB) | Remote - United Kingdom
  + Databricks | Manager, Field Engineering - Global Telecommunications  | Remote - Texas
  + Databricks | Manager, Field Engineering - Strategic Digital Native Business | Remote - California; Remote - Colorado; Remote - Oregon; Remote - Washington
  + Databricks | Manager, Forward Deployed Engineering | Remote - India
  + Databricks | Manager, Forward Deployed Engineering - CMEG | Remote - Washington D.C.
  + Databricks | Principal Demand Generation Manager, Campaign Development | United States
exit 0
```

### `npm run ats:liveness -- <job-url>` (a real posting from that board)

First attempt. The repo's Playwright 1.62.1 needs a browser build that wasn't installed. The local home path is shown as `~`.

```text
$ npm run ats:liveness -- https://databricks.com/company/careers/open-positions/job?gh_jid=8546367002

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://databricks.com/company/careers/open-positions/job?gh_jid=8546367002

Checking 1 URL(s)...

Fatal: browserType.launch: Executable doesn't exist at ~/Library/Caches/ms-playwright/chromium_headless_shell-1234/chrome-headless-shell-mac-arm64/chrome-headless-shell
╔════════════════════════════════════════════════════════════╗
║ Looks like Playwright was just installed or updated.       ║
║ Please run the following command to download new browsers: ║
║                                                            ║
║     npx playwright install                                 ║
║                                                            ║
║ <3 Playwright Team                                         ║
╚════════════════════════════════════════════════════════════╝
exit 1
```

After the one-time browser install:

```text
$ npx playwright install --only-shell chromium   # one-time; a fresh clone needs this before ats:liveness
$ npm run ats:liveness -- https://databricks.com/company/careers/open-positions/job?gh_jid=8546367002

> the-reallocation-engine@1.0.0 ats:liveness
> node scripts/ats/check-liveness.mjs https://databricks.com/company/careers/open-positions/job?gh_jid=8546367002

Checking 1 URL(s)...

✅ active     https://databricks.com/company/careers/open-positions/job?gh_jid=8546367002

Results: 1 active  0 expired  0 uncertain
exit 0
```

### `npm run score -- data/examples/ch11-roles.json --out-dir …/runs`

```text
$ npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/shreyashyadav1/runs

> the-reallocation-engine@1.0.0 score
> node scripts/score/role-scorer.mjs data/examples/ch11-roles.json --out-dir course/2026fa/submissions/shreyashyadav1/runs

✓ scored 5 roles → Apply 2 · Consider 1 · Skip 2 (skip 40%)
  course/2026fa/submissions/shreyashyadav1/runs/role-scores.json  +  course/2026fa/submissions/shreyashyadav1/runs/role-scores.md
exit 0
$ git status --short data/examples
(no output = tracked example output untouched)
```

This reproduces the book's Ch.11 example: Cambridge biotech 0.446 Apply; the identical non-sponsor 0.178 Skip. The report it wrote (`course/2026fa/submissions/shreyashyadav1/runs/role-scores.md`, unedited):

```markdown
# Role Scorer report — 2026-10-03

*Bayesian Role Scorer (Ch.11). Weights: sponsorship 0.35, fit 0.3, role_quality 0 [role_quality weight is **[VERIFY]** — not pinned by the chapter]. Threshold 0.3. Profile requires sponsorship.*

**Summary:** 5 roles → Apply 2 · Consider 1 · Skip 2. **Skip rate 40%** (below the ~50% a healthy run skips; check the inputs).

| Role | Composite | Rec | Why | Audit (term · value · weight · source) |
|---|---|---|---|---|
| Cambridge biotech (Ch.7) — Data role (Proven tier) | 0.446 | **Apply** | composite 0.446 ≥ 0.3, gates healthy | sponsorship 0.9·0.35 [record]; fit 0.7·0.3 [model-judgment] × liveness 1[record]×timeline 0.85[your-input] |
| Likely-tier sponsor — Strong but Likely not Proven | 0.418 | **Consider** | above threshold (0.418) but one soft spot: sponsorship tier "Likely" | sponsorship 0.6·0.35 [record]; fit 0.85·0.3 [model-judgment] × liveness 1[record]×timeline 0.9[your-input] |
| Non-sponsor, but HM is a contact — Scorer says Skip, you know better | 0.193 | **Apply ⟵ override** | composite 0.193 < 0.2 — time is better spent elsewhere | sponsorship 0.05·0.35 [record]; fit 0.7·0.3 [model-judgment] × liveness 1[record]×timeline 0.85[your-input] |
| Household-name non-sponsor — Same data role | 0.178 | **Skip** | composite 0.178 < 0.2 — time is better spent elsewhere | sponsorship 0·0.35 [record]; fit 0.7·0.3 [model-judgment] × liveness 1[record]×timeline 0.85[your-input] |
| Proven sponsor (ghost posting) — Looks perfect, isn't real | 0.000 | **Skip** | gated: liveness ≈ 0.000 (a closed gate zeroes the composite regardless of votes) | sponsorship 0.9·0.35 [record]; fit 0.8·0.3 [model-judgment] × liveness 0[record]×timeline 0.85[your-input] |

*Every term traces to its source. If you cannot explain a row term-by-term, distrust the recommendation before your confusion (Ch.11).*
```

## Inputs

- **Persona** (fictional, all `your-input`): `scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.example.json`.
  - "Kabir Rao", MS Information Systems, graduating 2026-12.
  - EAD start 2027-01-11; auth end derived (EAD + 364 days); 0/90 unemployment days used; 30-day buffer; STEM extension planned.
  - Sectors: Insurance, Health Insurance, Other Health Care, Hospitals and Physicians. Network-list states: MA, NY.
- **Scenario 2 persona:** `inputs/persona.after-ead.example.json`. Same person, `unemployment_days_used: 40`, run with `--today 2027-02-20`.
- **Candidates:** `inputs/candidates.example.json`.
  - Nine openings at **real company rows** in the 80 Days CSV, plus one deliberate miss.
  - The **postings are hypothetical** (`hypothetical: true`).
  - Fit, process-days estimate and the liveness check are `your-input`.
- **Data:**
  - the full shipped 80 Days CSV;
  - the four shipped Form D **sample** files (50 companies each);
  - the BLS compact file.

## Commands and real output

### Scenario 1 — before OPT starts

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

Scorer report written by `scripts/score/role-scorer.mjs` (`course/2026fa/submissions/shreyashyadav1/runs/2026-10-03/role-scores.md`, unedited):

```markdown
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
```

The scorer flags a 29% skip rate as below a healthy 50%. That's accurate. The candidate list was already filtered by the persona and leans Apply, and the two BLOCKED rows don't count in the scorer's total. I left the list as it is rather than adding roles to push the skip rate up.

### Scenario 2 — same person, 2027-02-20, 40 days used

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

### Failure cases on real data

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

## Verified vs. inferred

Scenario 1, Vouch Inc — Software Engineer, AI Platform, line by line:

| Value | Label | Where it came from |
|---|---|---|
| Industry = Insurance | record | 80 Days CSV line 29059 |
| Total Approvals 12, Denials 0, Approval_Rate 100 | record | Same row. The counts are suspect: every count in the file is even. |
| Sponsored titles "Software Engineer 2", "Enterprise Business Operations Manager - AI" | record | same row |
| Only "Software Engineer 2" counts as 15-1252-like | your-input | `TITLE_RULE` in `lib.mjs` (the author's rule) |
| Tier Proven | your-input (rule over record values) | `TIER_RULE`: approvals ≥ 4, rate ≥ 90, a matching title |
| p = 0.9 sent to the scorer | your-input | the tier rule's number, copied from `data/examples/ch11-roles.json`. The record values travel with it as `derived_from` (record). |
| Latest funding Series B, 2024-11-07 | record | CSV row |
| 23 months since funding → "stale" | your-input | computed against `--today`; 18-month window from the persona |
| Form D sample hit | none | 0/8 hits; the samples don't contain Vouch |
| Fit 0.8 | your-input | candidate file. No model was asked. |
| Liveness 1 (active, checked 2026-10-02) | your-input | candidate file. **Hypothetical**, not an ATS record. |
| Process 45 days | your-input | candidate file (startup ~6 weeks, the Ch.10 Role B pattern) |
| Timeline factor 1.000: start 2027-01-11, 0 unemployment days at start | your-input | the author's formula over the persona's dates (`timelineFactor`) |
| Composite 0.555 = (0.9·0.35 + 0.8·0.3) × 1 × 1 → Apply | computed by `role-scorer.mjs`, unmodified | arithmetic over the four your-input terms above |
| National median $133,080 (SOC 15-1252, OEWS 2024) | record, **context only** | `soc_occupation_compact.csv`; scorer weight 0 |
| E-Verify | unverified | no data source in the repo |

For all nine roles, every term is labeled the same way in `course/2026fa/submissions/shreyashyadav1/runs/2026-10-03/report.md` ("Why, role by role") and `run-log.json`.

Across the whole run, **0/27 scorer terms are records.** Nothing is labeled `model-judgment`, because no model was called.

## Verification

Hand cross-check against the source files:

```text
$ python3 -c "<print selected columns of the VOUCH INC row from the 80 Days CSV>"
line 29059 {'company_name': 'VOUCH INC', 'industry': 'Insurance', 'state': 'CA', 'latest_funding_stage': 'Series B', 'latest_funding_date': '2024-11-07', 'Total Approvals': '12.0', 'Total Denials': '0.0', 'Approval_Rate': '100.0', 'top_job_titles_sponsored': "['Software Engineer 2', 'Enterprise Business Operations Manager - AI']"}
$ python3 -c "<BLS compact row for 15-1252>"
15-1252 Software Developers 2024 133080.0
$ grep -c -i "vouch\|sirona\|teladoc\|lemonade" data/sec/form-d/processed/sample/*.json
data/sec/form-d/processed/sample/companies-sec-2025q2-d.sample.json:0
data/sec/form-d/processed/sample/companies-sec-2026q1-d.sample.json:0
data/sec/form-d/processed/sample/companies-sec-2025q4-d.sample.json:0
data/sec/form-d/processed/sample/companies-sec-2025q3-d.sample.json:0
$ grep -n -i "^ABRIDGE" data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv | cut -d, -f1,2
403:ABRIDGED INC,Other
```

What this confirms:
- The Vouch values in the report match the CSV.
- The BLS median matches the compact file.
- None of the four candidates in the grep appear in the Form D samples, which agrees with 0/8 hits.
- `ABRIDGED INC` exists and is a different company, so `entity-not-found` for "Abridge AI, Inc." is correct.

Offline tests (11) and deliberate break attempts:

```text
## BREAK 1 — mutate lib.mjs so an unchecked posting gets liveness 1.0, then run the tests
$ (edit livenessGate: unchecked → { status: "ok", factor: 1 }) && node --test scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/healthins-ai-opt.test.mjs
ℹ fail 2
ℹ pass 9
ℹ tests 11
✖ end to end on fixtures: real scorer, both outputs, labels, failure cases (70.888209ms)
✖ failing tests:
✖ liveness: unchecked or undated never becomes a factor (0.521167ms)
$ (restore lib.mjs) && node --test scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/healthins-ai-opt.test.mjs
ℹ tests 11
ℹ pass 11
ℹ fail 0

## BREAK 2 — give the real scorer a role with no liveness term
$ node scripts/score/role-scorer.mjs course/2026fa/submissions/shreyashyadav1/breaks/no-liveness-role.json --out-dir course/2026fa/submissions/shreyashyadav1/breaks/no-liveness-out
✓ scored 1 roles → Apply 1 · Consider 0 · Skip 0 (skip 0%)
  course/2026fa/submissions/shreyashyadav1/breaks/no-liveness-out/role-scores.json  +  course/2026fa/submissions/shreyashyadav1/breaks/no-liveness-out/role-scores.md
$ node -e "const r=require('./course/2026fa/submissions/shreyashyadav1/breaks/no-liveness-out/role-scores.json').roles[0]; console.log(r.recommendation, JSON.stringify(r.trace.gates))"
Apply [{"factor":"liveness","multiplier":1,"source":"record"},{"factor":"timeline","multiplier":1,"source":"your-input"}]

## BREAK 3 — same two roles, scored with and without a persona-style "work authorized" profile
$ node scripts/score/role-scorer.mjs course/2026fa/submissions/shreyashyadav1/breaks/sponsor-vs-nonsponsor.json --out-dir course/2026fa/submissions/shreyashyadav1/breaks/default-out
✓ scored 2 roles → Apply 1 · Consider 1 · Skip 0 (skip 0%)
  course/2026fa/submissions/shreyashyadav1/breaks/default-out/role-scores.json  +  course/2026fa/submissions/shreyashyadav1/breaks/default-out/role-scores.md
$ node scripts/score/role-scorer.mjs course/2026fa/submissions/shreyashyadav1/breaks/sponsor-vs-nonsponsor.json --profile course/2026fa/submissions/shreyashyadav1/breaks/profile-work-authorized.json --out-dir course/2026fa/submissions/shreyashyadav1/breaks/profile-out
✓ scored 2 roles → Apply 0 · Consider 1 · Skip 1 (skip 50%)
  course/2026fa/submissions/shreyashyadav1/breaks/profile-out/role-scores.json  +  course/2026fa/submissions/shreyashyadav1/breaks/profile-out/role-scores.md
$ node -e "const j=require('./course/2026fa/submissions/shreyashyadav1/breaks/default-out/role-scores.json'); console.log('needs_sponsorship=' + j.profile_needs_sponsorship); for (const r of j.roles) console.log(r.role_id, r.composite, r.recommendation)"
needs_sponsorship=true
proven-sponsor 0.495 Apply
non-sponsor 0.27 Consider
$ node -e "const j=require('./course/2026fa/submissions/shreyashyadav1/breaks/profile-out/role-scores.json'); console.log('needs_sponsorship=' + j.profile_needs_sponsorship); for (const r of j.roles) console.log(r.role_id, r.composite, r.recommendation)"
needs_sponsorship=false
proven-sponsor 0.18 Skip
non-sponsor 0.27 Consider
```

## Reflection

**What worked.**
- **Holding back any role nobody had checked.** This mattered more than expected: the shared scorer would otherwise have scored it as live and called that a record (Break 2).
- **The timeline gate reproduced the Ch.10 pattern.** A six-to-seven-month public-company loop is Skip even when started in October. Six weeks after EAD, almost nothing on the list is still possible.
- **The practical lesson for this student:** October–December, while still enrolled, is when applications cost no unemployment days.

**What it got wrong or missed.**
- *Title rule false positive.* The first title rule matched a business-operations manager because of a bare "AI". Fixed.
- *Double-count bug.* The first timeline formula counted already-used days twice once OPT had started. Only running a second date exposed it. Fixed, with a regression test.
- *Fourth label.* The first version labeled the sponsorship term `record+your-input-rule`, a label the engine doesn't have. Under the strict three labels, the honest count is **0/27 scorer terms are records.** The prototype is a sorting and gating aid over a human's inputs, not a record-backed score. The report now says that in so many words.
- *Unknown lands in Consider.* Lemonade (Unknown) lands in Consider on fit alone (0.255), because the scorer's Consider band starts at 0.20. The next action (network first) is right, but the label overstates what the record supports.
- *Industry filter.* It can't see insurtechs filed as "Other Technology", so the network list found one company in MA/NY.
- *Funding evidence is old.* Form D samples gave 0 hits; funding evidence ends at the CSV's September 2025.
- *Engine run too late.* I ran the engine baseline (scan, liveness, score) after building instead of before.

**Next concrete improvement.** Wire `npm run ats:liveness` output into the liveness gate (recipe TODO 1). It was shown working on a real posting above. That would make the first scorer term a record (liveness), and then the SOC-coded LCA extract (TODO 2) would make the tier a record too.

## Attestation
- Recipe: healthins-ai-opt v0.1.0
- By: Shreyash Yadav · 2026-10-03
- Note: Claude Code ran every row first (output above). I re-ran the tests and both scenarios myself and got the same results, and I hand-checked Sirona Medical's CSV row against the report. The engine-baseline, failure-case and break rows are Claude's runs; I didn't repeat them.

### Tested
| Ran | Saw | Expected |
|---|---|---|
| `npm run score -- data/examples/ch11-roles.json --out-dir course/2026fa/submissions/shreyashyadav1/runs` | Cambridge biotech 0.446 Apply; non-sponsor 0.178 Skip; `data/examples` untouched | the book's Ch.11 numbers |
| `npm run ats:liveness -- <Databricks posting>` | first: missing browser; after install: `active` | a live posting reads active |
| `node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-03` | Apply 3 · Consider 2 · Skip 2 · BLOCKED 2; entity 8/9; Form D 0/8; record terms 0/27 | Teladoc gated on timeline, Augmedix on liveness; Clarify and Abridge BLOCKED |
| same with `--today 2027-02-20 --persona …/persona.after-ead.example.json` | Skip 7 · BLOCKED 2; Vouch timeline 0.167 → composite 0.0927 | 40 used + 45 ahead = 85 days → (90−85)/30 = 0.167 |
| run with `persona.past-auth.fixture.json` | exit 2, failure `run-log.json`, no `role-scores.json` | run stops; nothing invented |
| run with `--out-dir data/examples` | exit 2; `data/examples` untouched | refuses to write over tracked files |
| `node --test …/test/healthins-ai-opt.test.mjs` | 11 pass, 0 fail | all pass offline; every scorer term is one of the three labels |
| **Break 1:** liveness gate mutated so an unchecked posting gets 1.0 | 2 tests fail | the tests catch it |
| **Break 2:** real scorer given a role with no liveness term | Apply; liveness multiplier 1 labeled `record` | (documents why roles are held back) |
| **Break 3:** real scorer with a "work authorized" profile | Proven sponsor 0.495 Apply → 0.18 Skip; non-sponsor 0.27 ranks above it | (documents why `--profile` isn't passed) |
| Hand check: the Vouch row, the BLS row, the Form D grep, `ABRIDGED INC` | values match the report | report values trace to the files |
| My hand check: `grep -n "^SIRONA MEDICAL INC," …` | line 24368: 26 approvals, 0 denials, rate 100; titles Senior Software Engineer, Senior NLP Data Scientist, Senior Product Manager | the same values in Sirona's section of report.md |

### Did not test
- Liveness of any **candidate** posting. Those postings are hypothetical and their liveness is hand-entered. `ats:liveness` was run only on one Databricks posting during setup.
- Full Form D quarters (not shipped); only samples.
- Whether any sponsored title was actually filed under SOC 15-1252.
- E-Verify status of any company.
- Real hiring durations. Every `process_days_estimate` is a guess.
- Other sectors or states than the four health/insurance industry codes and MA/NY.
- Node 20 (the CI version) and Windows. Tested on Node 24, macOS.
- A run from a clean checkout of the pushed branch. Not done yet: nothing is committed.

### Broke during testing, fixed
- **Title rule matched "Enterprise Business Operations Manager - AI".** Bare `\bai\b`. AI/ML/NLP now count only next to engineer, developer or scientist. Fixed in `lib.mjs` `TITLE_RULE`; covered by a test.
- **Timeline double-counted used days after EAD.** Every 2027-02-20 role came out 0. Days are now counted from max(today, EAD). Fixed in `lib.mjs` `timelineFactor`; regression test.
- **A fourth label, `record+your-input-rule`.** Replaced by `your-input`, with the record values attached as `derived_from`. The test now rejects any label outside the three. Fixed in `run.mjs` and the test.
- **`node --test <directory>` fails on Node 24** ("Cannot find module"). Docs now give the test file path.
- **`npm run verify` fails before any change** (local Python without PyYAML), and **`ats:scan`/`ats:liveness` fail on a fresh clone** (no `portals.yml`; missing Playwright browser). These are environment issues, not code. See TEST-REPORT.
