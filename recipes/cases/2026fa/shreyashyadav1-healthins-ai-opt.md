---
status: DRAFT          # a sample run exists (logs/runs/2026fa-shreyashyadav1-1.md) but 6 TODOs are open, so SPECIFIED — and therefore RUNNABLE-SAMPLE — is not yet earned
todos_open: 6
last_gate: null
attestation: null
recipe_version: 0.1.0
---

# healthins-ai-opt — insurance/health applied-AI roles under an OPT clock

## Executive summary

**What it does.** Takes a short list of job openings and decides, for each one, whether it is worth applying to now, worth networking into first, or worth dropping. It checks two public records — whether the company has had visa petitions approved for software-type work, and when it last raised money — and two hard limits: whether the posting is still open, and whether hiring can finish before the student's allowed unemployment days run out.

**Who it is for.** An international master's student in a STEM-designated information-systems or computer-science program, graduating in December, who will start post-completion OPT in January and plans to file for the STEM extension later. The target is applied-AI / LLM engineering work (agents, document extraction, retrieval) at insurance carriers, insurtechs, and health-technology companies. The occupation code these roles are usually filed under is Software Developers (SOC 15-1252).

**What it decides.** Apply, Consider, or Skip per role, through the repository's existing scorer — or **BLOCKED** when something a human must check is missing. Each result comes with one next action: tailor an application, find a contact first, or drop the role and move the time elsewhere. It also produces a short list of funded, sponsoring companies in the sector to network into before they post.

**What it cannot do.** It cannot see occupation codes on past visa petitions (the data has job titles only), whether a company is enrolled in E-Verify (required for the STEM extension), whether a posting is live (the person checks), or what a company actually pays. It is a planning aid, not immigration advice.

Two customers: this file is for the agent; `recipes/cases/2026fa/shreyashyadav1-healthins-ai-opt.card.md` is for the person.

**Handoff condition (done when):** `run-log.json` and `report.md` exist in the out-dir; `run-log.json.coverage` shows `entity_matched_in_csv` and `form_d_sample_hits` as `k/n`; every role is either scored by `role-scorer.mjs` or listed with a non-empty `blocked` reason; no role in `roles.json` lacks a numeric liveness factor; every term in `role-scores.json` carries exactly one of `record`, `your-input`, `model-judgment`; `run-log.json.coverage.scorer_terms_labeled_record` states how many of those terms are records.

## Required reads

1. `SNICKERDOODLE.md`, `DOMAIN.md` (Known gaps 3 and 9), `DATA_CONTRACT.md §Zero-Conditions`.
2. `book/chapters/07-who-sponsors-the-80-days-sponsorship-scorer.md` (Unknown ≠ Avoid), `book/chapters/10-the-visa-timeline-manager.md` (the gate inputs), `book/chapters/11-the-bayesian-role-scorer.md`.
3. `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-audit.md` and `data/80-days-to-stay/data/SEC_DOL_H1b_data_mapped-join-validation-audit.md`.
4. `scripts/score/role-scorer.mjs` — read `applyProfile` and the liveness default before running.

## Purpose and source inventory

| Evidence | Source (exists today) | Label | Role in decision |
|---|---|---|---|
| H-1B approvals, denials, approval rate, top sponsored titles | `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` | record | sponsorship vote (via tier rule) |
| Industry (sector filter) | same CSV, `industry` | record | which companies count as "insurance/health" |
| Latest funding stage + date | same CSV, `latest_funding_stage`, `latest_funding_date` | record | context + network list (no scorer term) |
| Form D filing date | `data/sec/form-d/processed/sample/companies-sec-{2025q2,2025q3,2025q4,2026q1}-d.sample.json` | record | funding recency upgrade when the sample has the company |
| National OEWS median, SOC 15-1252 | `data/bls/compact/soc_occupation_compact.csv` | record | context only (scorer weight 0) |
| OPT EAD start, auth end, unemployment days used, ceiling, buffer | persona JSON (`inputs/persona.example.json`, fictional) | your-input | timeline gate |
| Candidate roles, fit, process-days estimate, liveness check | candidates JSON (`inputs/candidates.example.json`) | your-input | fit vote, liveness gate, timeline gate |
| Title rule, tier thresholds, recency window, timeline formula | `scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/lib.mjs` | your-input (author's rule) | turns records into a tier and a factor |
| Combiner | `scripts/score/role-scorer.mjs` (CLI, unmodified) | — | Apply / Consider / Skip + audit trace |

Prototype command (repo root):

```bash
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-03
```

Test command:

```bash
node --test scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/healthins-ai-opt.test.mjs
```

Not used, and why: `npm run bls:local-wage` (fails on a fresh clone — no `.venv`, fact 7; and feeds nothing, fact 2), `scripts/sec/validate-h1b-join-sample.py` (needs full data, fact 8), `npm run ats:liveness` (it works: run once during setup on a real Databricks posting after `npx playwright install --only-shell chromium` — see the worked run. It is not wired into this prototype because it needs the network and the prototype's test must run offline — TODO 1), any `snickerdoodle` command (roadmap, fact 5).

## Facts that bite, and how this recipe handles each

| Fact | Effect here |
|---|---|
| 1. `role_quality` weight is 0.0 `[VERIFY]` | The OEWS median is shown in the report as context and is **not** passed to the scorer. No weight is proposed: a national median is the same for every role on the list, so it cannot separate them. |
| 2. `bls:local-wage` feeds nothing | Not used. |
| 3. Only Form D samples ship | Form D lookup is reported as `k/n` hits. On the worked run it was 0/8. Funding recency falls back to the CSV's `latest_funding_date` (itself Form D-derived, latest 2025-09-26). |
| 4. `data/raw/`, `data/verified/`, `logs/gate-decisions/` do not exist | Gate decisions are recorded in `logs/runs/2026fa-shreyashyadav1-<n>.md`; outputs go to `course/2026fa/submissions/shreyashyadav1/runs/`. |
| 5. `snickerdoodle` CLI is roadmap | Not referenced as runnable. |
| 6. Every top-level recipe is DRAFT | This one is DRAFT too: a sample run exists, but 6 TODOs are open. |
| 7, 8 | Not used (see above). |

Two more found while building (logged, not fixed — they are in a maintained file):

- **Missing liveness becomes 1.0 labeled `record`.** `role-scorer.mjs` reads `num(role.liveness?.factor) ?? 1` and defaults the source to `record`. A role nobody checked scores as live, and the audit trail calls that a record. This recipe never sends a role without a dated liveness check to the scorer.
- **`--profile` with persona-style text drops sponsorship.** `applyProfile` matches `authorized` in the free-text authorization. `"F-1 STEM OPT — work authorized (EAD)"` (the `aarav-patel` persona's string) returns `needs_sponsorship=false` and sets the sponsorship weight to 0. This recipe does not pass `--profile`; the scorer's default (`needs_sponsorship=true`) is correct for this student.

## Phase gates

Each role stops at the first failed gate. Gates G1–G3 hold a role back before scoring; G4–G5 are the scorer's multiplicative gates; G6 is the human release.

| Gate | Testable condition | Pass | Fail |
|---|---|---|---|
| G0 persona | `validatePersona()` returns no errors: EAD start is a valid date, auth end (if given) is after EAD and not before `--today`, used < ceiling, buffer < ceiling | run continues | **whole run stops**, exit 2, `run-log.json.status = failed`, no scores |
| G1 entity | exactly one CSV row has the same normalised name (`normalizeName`, legal suffixes stripped, no fuzzy/prefix) | sponsorship evidence read | `BLOCKED: entity-not-found` or `entity-ambiguous` |
| G2 liveness checked | candidate has `liveness.status` in {active, closed, not-found} and a valid `checked_on` date | factor 1 or 0 | `BLOCKED: liveness-unchecked` / `liveness-check-undated` |
| G3 process estimate | `process_days_estimate` is a non-negative integer | timeline computed | `BLOCKED: process-days-missing` |
| G4 liveness (scorer) | liveness factor > 0.05 | — | Skip (gated) |
| G5 timeline (scorer) | timeline factor > 0.05 | — | Skip (gated) |
| G6 human release | a named human reads `report.md`, re-checks each Apply row's dates against their own EAD card and the posting, and records the decision in `logs/runs/` | apply / network | nothing is sent |

**Timeline formula** (your-input, proposed — Ch.10 names the inputs but pins no formula):

```
expected_start      = max(today + process_days, EAD start)
unemployed_at_start = days_used + max(0, expected_start − max(today, EAD start))
factor = 1                         if unemployed_at_start ≤ ceiling − buffer
       = (ceiling − u) / buffer    if inside the buffer
       = 0                         if u ≥ ceiling, or expected_start > auth end
```

Ceiling is 90 until a STEM extension is approved; the recipe does not raise it to 150 on a plan to file.

**Sponsorship tier** (your-input rule over record inputs):

- **Proven** (p = 0.9): raw approvals ≥ 4, approval rate ≥ 90, and at least one sponsored title passes `TITLE_RULE`.
- **Likely** (p = 0.6): raw approvals ≥ 2 but not Proven (includes companies that only sponsored non-software titles).
- **Unknown** (no p — the vote is omitted): in the CSV with no approvals. Never Avoid.

The p values match `data/examples/ch11-roles.json`. In `roles.json` the sponsorship term is labeled `your-input`, because the number comes from the author's rule, not from a record. The record values the rule read (approvals, approval rate, matching titles) travel with it as `derived_from`, labeled `record`. The scorer's audit trace therefore never presents 0.9 as a record.

## What it can and cannot verify

| Can verify (record) | Cannot verify |
|---|---|
| The company has a row in the 80 Days CSV under this exact normalised name | That a missing company is a non-sponsor (it may be a name miss — Abridge AI vs. `ABRIDGED INC`) |
| Approval/denial counts and approval rate as the CSV states them | That the counts are right: **all 1557/1557 approval and denial counts are even**, consistent with a 2× join duplication. Counts are used only against thresholds. |
| The sponsored job-title strings | That any petition was filed under SOC 15-1252 — the CSV has no SOC column. The title rule is a proxy and admits adjacent titles (e.g. "Senior NLP Data Scientist" is SOC 15-2051). |
| SEC industry code on the filing | That a company is "insurtech": many file as "Other Technology" or "Other" (e.g. `DEVOTED HEALTH INC` → Other) and fall outside the sector filter |
| Latest funding date in the CSV; Form D date when the sample has the company | Funding after 2025-09-26 for companies outside the 200 sampled Form D filers |
| The date arithmetic of the timeline gate | The process-days estimate, the EAD date, STEM eligibility (CIP code), and E-Verify enrolment |
| — | That the posting is live (`ats:liveness` not wired in) |
| Which tier bucket the record puts a company in | Any number the scorer multiplies as a record: on the worked run, 0/27 scorer terms are records (tier p, fit, liveness, timeline are all your-input) |
| — | What the employer pays (national OEWS only, context) |

## Proposed additions

1. `[TODO: DEV]` Read `npm run ats:liveness -- --file <urls>` output into the G2 liveness gate, labeled `record`, instead of a hand-entered check. Belongs here because liveness is a gate and today it is the weakest-labeled input.
2. `[TODO: DATA SOURCE]` DOL LCA disclosure extract with `SOC_CODE` and `EMPLOYER_NAME` for FY2023–FY2025, filtered to 15-1252, under `data/80-days-to-stay/`. It would replace the title proxy with a record and settle the even-count question.
3. `[TODO: DATA SOURCE]` An E-Verify employer list (public E-Verify search export) so the STEM-extension requirement can be checked, not just flagged.
4. `[TODO: DATA SOURCE]` Full Form D quarters 2025Q2–2026Q1 (`python3 scripts/sec/download-form-d-quarters.py`, gitignored output) for a live run; samples give 0 hits for this sector.
5. `[TODO: DATA SOURCE]` A sourced hiring-lag table per company stage (seed / Series A–B / public), with its origin and date, to replace the person's guessed `process_days_estimate`.
6. `[TODO: DEV]` A funding term for the scorer. Today funding changes no decision; it only orders the network list. Proposal for a maintainer: a vote `funding_recency` (weight to be argued, renormalising the others) — not implemented here because it changes a maintained file.

## Output contract

**Agent log** — `run-log.json`:

```
recipe, recipe_version, status [ok|failed], today, inputs{paths}, data_mode,
rules{title_rule, tier_rule, funding_recent_months, timeline_formula}  (all your-input),
coverage{candidates, entity_matched_in_csv "k/n", form_d_sample_hits "k/n", scored, blocked, scorer_terms_labeled_record "k/n"},
labels (how derived values are labeled),
data_quality{approval_counts_even "k/n", denial_counts_even "k/n", note},
persona_visa{…, source: your-input}, role_quality_context{… source: record | status: missing + reason},
scorer{path, invoked_as, stdout, profile_passed: false},
summary{Apply, Consider, Skip, BLOCKED},
roles[]{role_id, company, title, industry{value,source,file}, in_target_sector{value,source},
        sponsorship{status,tier,tier_source,p,p_source,inputs{…each with source,file}},
        funding{csv{…}, form_d_sample{…}, recency}, liveness{factor,source,checked_on}|{status:missing,reason},
        timeline{factor,band,dates{…}}|{status:missing,reason}, fit{p,source}, e_verify{status:unverified},
        blocked[]|null, decision{recommendation,composite,reason,arithmetic}, next_action{block,action,source}},
network_targets[]{company, industry, state, latest_funding, source: record, file, months_since_funding{value,source},
        tier{value,source}, matched_titles{value,source}}
```

**Person report** — `report.md`: executive summary; your clock; decision table; per-role "why" with every term labeled; network list; role-quality context; what this run could not verify.

The scorer's own `role-scores.json` / `role-scores.md` are written beside them unchanged.

## Stop conditions

Stop and invent nothing when:

- G0 fails (bad or past dates) — exit 2.
- The CSV, Form D directory or BLS file is missing — exit 2, name the path.
- `--out-dir` points at a tracked path outside this contribution's namespaces — exit 2.
- Asked to fill a missing liveness, EAD date or process estimate with a "reasonable" value — refuse; the role stays BLOCKED.
- Asked to fuzzy-match a company name to clear G1 — refuse; resolving the entity is the human's step.
- Asked to raise the ceiling to 150 because a STEM extension is planned — refuse until the extension is approved.
- Asked to answer whether the student is STEM-eligible or whether an employer uses E-Verify — route to the DSO / employer.

## Next action per result (the 3-3-2 hand-off)

| Result | Block of the day | Action |
|---|---|---|
| Apply | 2h apply | Tailor the application; ask about E-Verify before the final round. |
| Consider | 3h network | Find a contact; confirm sponsorship for this role type and E-Verify; then decide. |
| Skip, gate closed | reallocate | Drop now; move the hours to networking or the credibility project. |
| Skip, Unknown tier + funding recent | 3h network | Informational chat to ask about sponsorship; do not apply cold. |
| Skip, otherwise | skip | Nothing. |
| BLOCKED | human gate | Check the posting, or resolve the company name, then re-run. |
| Network list | 3h network | Funded, sponsoring, in-sector companies not on the list — contact before a posting appears. |

## Run-log template (`logs/runs/2026fa-shreyashyadav1-<n>.md`)

```markdown
## YYYY-MM-DD — healthins-ai-opt <scenario>

- **Recipe:** recipes/cases/2026fa/shreyashyadav1-healthins-ai-opt.md v<version>
- **Inputs:** persona <path>, candidates <path>, --today <date>; data: 80 Days CSV, Form D samples (<k> files), BLS compact
- **Command:** <exact command>
- **Outputs:** <out-dir>/{roles.json, role-scores.json, role-scores.md, run-log.json, report.md}
- **Result:** Apply a · Consider c · Skip s · BLOCKED b; entity matched k/n; Form D sample hits k/n
- **Gate decisions:** G6 cleared by <name> on <date> for <role ids> | not cleared
- **Open issues:** <what did not work or is still missing>
```
