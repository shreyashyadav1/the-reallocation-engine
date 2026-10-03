# CHANGE-BRIEF — healthins-ai-opt

## Executive summary

This is the plan and the predictions for a small contribution to the job-search engine. The tool helps an international master's student pick which insurance and health-technology AI engineering jobs to spend application time on, given an OPT clock that has not started yet. The original predictions are kept as written. Section 6 adds what happened on the first runs, including two predictions that were wrong.

**Authorship note:** the student chose the domain and the scenario the persona models, including the STEM extension. The AI agent (Claude Code) drafted this text on 2026-10-03, after surveying the data and before the first prototype run. The predictions in sections 1–5 are the ones made at that point.

## 1. Situation and engine layers

**Who:** an international MS student in a STEM-designated information-systems program. Graduates December 2026. Post-completion OPT starts around January 2027. Plans to file the 24-month STEM extension later. Targets applied-AI / LLM engineering roles — agentic workflows, document extraction, retrieval — at insurance carriers, insurtechs, and health-technology companies. The roles are usually filed as SOC 15-1252 (Software Developers).

**Layers:**
- **80 Days to Stay** — H-1B record and funding by company.
- **SEC Form D** — funding recency.
- **The Cognitive Pivot** — BLS, context only.
- **The scorer** — `role-scorer.mjs`, with the visa timeline as a gate.

**Not used:** the Job-Ops liveness script (`ats:liveness`) needs the network, so it is not used yet.

## 2. What is reused, and what is proposed

Reused, unmodified:

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv`
- `data/sec/form-d/processed/sample/*.sample.json`
- `data/bls/compact/soc_occupation_compact.csv`
- `scripts/score/role-scorer.mjs` (CLI)

New, in `scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/`:
- **Sector filter.** Uses the CSV's SEC industry codes: Insurance, Health Insurance, Other Health Care, Hospitals and Physicians.
- **Title rule.** Stands in for SOC 15-1252, because the CSV has no SOC column.
- **Tier mapping.** Turns approval counts into Proven / Likely / Unknown.
- **Timeline gate.** Built for a student whose OPT has not started yet. That case matters because days before EAD do not count against the 90.
- **Builder for the scorer's input.** Writes `roles.json` and the two outputs.

Why it belongs: none of the shipped recipes combine the sector, the 15-1252 role type, and an OPT clock that hasn't started yet. Applying before EAD is the cheapest timeline a student will ever have, and the existing examples all assume OPT has already started.

## 3. Gates and what a human needs to see

- **Persona dates.** The EAD date is valid and the authorization end is not past. Otherwise the run stops.
- **Entity.** Exactly one CSV row matches the company. The human sees the unmatched name and resolves it.
- **Liveness.** A dated check exists. The human opens the posting.
- **Timeline.** The factor is computed. The human sees today, expected start, unemployment days at start, ceiling, buffer and auth end, and checks them against their EAD card.
- **Release.** A named human reads the report before applying.

## 4. Predicted failure cases and how each is checked

1. **A company is missing from the CSV.** A startup name differs from its legal filing name. *Check:* exact normalised match only, and report `entity-not-found`. A fixture uses a name that is a prefix of a real row.
2. **The Form D samples miss the sector.** The samples hold 50 companies per quarter, mostly pooled funds. *Check:* report hits as `k/n`. Predicted: close to 0 hits for health/insurance companies (seen while surveying the data before the build).
3. **The OPT date is already past, or missing.** *Check:* the run stops with exit 2, writes a failure log, and produces no scores. There is a fixture persona for this.
4. **A posting was never checked.** *Check:* the role is held back from the scorer.

## 5. What the prototype will get wrong first

Prediction: **the title rule will over-match medtech "engineer" titles** (Quality Engineer, Manufacturing Engineer) and call hardware companies software sponsors.

## 6. Revisions after the first runs (appended 2026-10-03; sections 1–5 unchanged)

- **Prediction 5 was partly right, and the miss was elsewhere.** The exclusion list had already handled the medtech titles. The first run's real false positive was **"Enterprise Business Operations Manager - AI"** (Vouch Inc), which matched on a bare `\bai\b`. Fixed: AI/ML/NLP now count only next to engineer, developer or scientist. Still admitted by design, and listed as a limitation: "Senior NLP Data Scientist" (SOC 15-2051) and "Senior Director, Data Engineering".
- **Not predicted: a double-count in my own timeline formula.** Once OPT has started, it counted the days from EAD to today a second time. Every role in the 2027-02-20 scenario showed 0. The 2026-10-03 scenario could not reveal this, because today was before EAD. Fixed, and covered by a regression test.
- **Not predicted: two behaviours of the maintained scorer.**
  - A missing liveness term becomes 1.0, labeled `record`.
  - A persona-style "work authorized" profile string turns sponsorship off and puts a non-sponsor above a Proven sponsor.

  Both are documented in the recipe. Neither is patched, because the scorer is a maintained file.
- **Not predicted: every H-1B approval and denial count in the CSV is even** (1557/1557). The recipe now uses counts only against thresholds.
- **Prediction 2 confirmed:** 0/8 Form D sample hits.

## 7. Revisions after checking the work against the assignment (appended 2026-10-03; earlier sections unchanged)

- **Labels.** The first build (not this brief) labeled the tier's p `record+your-input-rule`, a fourth label the engine doesn't have. Under the three labels, the number is my rule's, so it is now `your-input`, with the record values attached. The strict count is **0/27 scorer terms are records**. I didn't predict that, and it is the clearest statement of what this prototype does and doesn't verify.
- **The engine baseline was run late.** `ats:scan --dry-run` and `ats:liveness` both fail on a fresh clone: `ats:scan` because no `portals.yml` is shipped, `ats:liveness` because of a missing Playwright browser build. After the fixes, liveness reported a real posting `active`. Section 1 said liveness isn't used because it needs the network. That still holds for the offline test, but liveness *can* be checked online, which makes recipe TODO 1 concrete.

