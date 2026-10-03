# SOURCES — healthins-ai-opt

## Executive summary

This page credits everything the contribution depends on: the repository and its rules, the data files, the book chapters that define the method, and the tools used, including the AI agent that wrote most of the code. It also says plainly which parts the AI produced and which parts the student decided.

## Repository and governing documents

- `nikbearbrown/the-reallocation-engine`, base commit `015843d` (2026-09-23). Read:
  - `SNICKERDOODLE.md`
  - `DOMAIN.md` (Known gaps)
  - `CONTRIBUTING.md`
  - `DATA_CONTRACT.md` §Zero-Conditions
  - `recipes/README.md`
  - `recipes/_shared.md`
  - `recipes/local-wage-adjustment.md` and its `.card.md` (style)
- Book chapters:
  - `book/chapters/07-who-sponsors-the-80-days-sponsorship-scorer.md` — Unknown ≠ Avoid
  - `book/chapters/10-the-visa-timeline-manager.md` — gate inputs; Role A/B/C pattern
  - `book/chapters/11-the-bayesian-role-scorer.md`
- Course assignment: `info-7375-prompt-engineering-for-generative-ai/assignments/assignment-reallocation-engine-recipe-design.md`.

## Data (all shipped in the repo, used read-only)

- `data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv` — 80 Days to Stay (Humanitarians AI). Joins SEC Form D with DOL/USCIS H-1B records.
- `data/sec/form-d/processed/sample/companies-sec-{2025q2,2025q3,2025q4,2026q1}-d.sample.json` — SEC Form D, first 50 companies per quarter.
- `data/bls/compact/soc_occupation_compact.csv` — BLS OEWS (2024) with O*NET.
- `data/examples/ch11-roles.json` — source of the Proven/Likely p values (0.9 / 0.6).
- Persona and postings: fictional or hypothetical, created for this contribution. The company names are real rows in the CSV.

## Code reused

- `scripts/score/role-scorer.mjs` — called through its CLI, unmodified.
- `scripts/conformance.mjs`, `scripts/doctor.mjs`, `scripts/manifest-check.mjs`, `scripts/pii-scan.mjs` — checks.
- `scripts/ats/scan.mjs`, `scripts/ats/check-liveness.mjs` — engine baseline only (setup). Pointed at `data/ats/portals.example.yml`, which tracks Databricks' public Greenhouse board. Liveness was checked on one public Databricks posting. Neither is part of the prototype.

## Tools

- Node v24.21.0 (`node:test`, no npm dependencies added); Python 3.14.6 (survey scripts only, not committed).
- PyYAML, in a throwaway venv, so `npm run verify` could parse `.ai/manifest.yaml`.
- Playwright Chromium headless shell (build 1234), installed into Playwright's user cache so `ats:liveness` could run.
- **Claude Code (Anthropic, model Opus 5.5)** in the Claude desktop app.

## What the AI contributed vs. what the student decided

- **AI:**
  - surveyed the data;
  - found the no-SOC-column gap, the even-count pattern and the two scorer behaviours;
  - proposed the domain shape from the student's background;
  - wrote all code, tests and fixtures;
  - drafted every document in this folder, the recipe, the card and the run log;
  - ran every command whose output is pasted.
- **Student:**
  - chose this domain;
  - confirmed the STEM-extension plan;
  - kept the DRAFT status and asked for the full check against the assignment text; accepted the rest as drafted;
  - re-ran the tests and both scenarios, and hand-checked Sirona Medical's CSV row against the report;
  - signs the attestation only after re-running it.
- No model was called by the prototype at runtime. Nothing in its output is `model-judgment`.
