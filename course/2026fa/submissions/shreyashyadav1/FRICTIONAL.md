# FRICTIONAL — healthins-ai-opt

## Executive summary

This is the honest log of how the contribution was built: what was tried, what broke, what was checked, and who did what. Most of the code and drafting was done by an AI coding agent (Claude Code) in one session on 2026-10-03. The student chose the domain and the visa assumptions and owns every decision to keep, change or reject the work. Section 3 is the student's own account: the facts are the student's, given in chat, and Claude typed them up.

## 1. Who did what

| Contribution | Student | AI agent (Claude Code, Opus 5.5) |
|---|---|---|
| Choice of domain (insurance/health applied-AI, SOC 15-1252) | Claude proposed it from my background; I confirmed it. | proposed it |
| STEM extension in the persona's scenario | I chose it. | encoded it as: ceiling stays 90 until approved |
| Persona (fictional "Kabir Rao") | — | invented it; no real data copied |
| Data survey, tier/title/timeline rules | Accepted as drafted. | drafted |
| `lib.mjs`, `run.mjs`, tests, fixtures | Accepted as drafted. I didn't write code myself. | wrote |
| Recipe, card, CHANGE-BRIEF, justification, worked run, test report, run log | Accepted. I asked for a full check against the assignment, which led to 7 fixes. | drafted |
| Lifecycle status DRAFT (not RUNNABLE-SAMPLE) | Agree. Keep DRAFT. | proposed, because 6 TODOs are open |
| Push, PR, Canvas upload | I said go. I upload the ZIP to Canvas myself. | forked, pushed, opened the PR, built the ZIP (2026-10-03) |
| Audit against the assignment text and the fixes in item 13 | asked for it | did it |
| Re-running the checks | I re-ran the tests and both scenarios, and did one hand check. | ran them first |

## 2. Attempts, difficulties and responses (AI session, 2026-10-03)

Each entry says what was expected, what happened, and the response.

1. **Expected:** the 80 Days CSV would let sponsorship be checked "for SOC 15-1252".
   **Happened:** the CSV has no SOC column, only `top_job_titles_sponsored` strings.
   **Response:** wrote a title rule, labeled it `your-input`, and listed it as a limitation. Proposed a SOC-coded LCA extract (recipe TODO 2).

2. **Expected:** approval counts usable as-is.
   **Happened:** a parity check showed all 1557/1557 approval counts and all denial counts are even. The repo's own audits don't mention this.
   **Response:** counts are used only against thresholds; the run log carries a `data_quality` note computed at run time, not hardcoded. **Unresolved:** is it a 2× join or a property of the source?

3. **Expected:** Form D samples would add funding recency.
   **Happened:** 0/8 candidate companies appear in the 200 sampled filers, which are mostly pooled funds. This was predicted from the data survey.
   **Response:** fall back to the CSV's `latest_funding_date` and report `k/n` coverage.

4. **Expected:** `npm run verify` would pass on a fresh clone.
   **Happened:** it fails on this Mac because Homebrew Python 3.14 has no PyYAML.
   **Response:** a scratch venv with PyYAML, used only via `PATH`. Nothing installed globally. Recorded before and after in TEST-REPORT.

5. **Reading the scorer before using it:** `num(role.liveness?.factor) ?? 1` with default source `record`.
   **Response:** confirmed with Break 2 (a role nobody checked → Apply, liveness "record"). The prototype holds unchecked roles back (BLOCKED). The scorer is not patched, because it's a maintained file.

6. **Reading `applyProfile`:** the regex includes `authorized`.
   **Response:** first attempt at Break 3 used a single non-sponsor role. It scored 0.27 with or without the profile, which proved nothing. Redone with a Proven sponsor and a non-sponsor side by side: with the persona-style profile, the sponsor falls 0.495 Apply → 0.18 Skip, below the non-sponsor. The prototype does not pass `--profile`.

7. **First run output:** "Enterprise Business Operations Manager - AI" counted as a 15-1252 title.
   **Response:** tightened the regex; added a test.

8. **Second scenario (2027-02-20):** every role came out 0.
   **Diagnosis:** the timeline formula counted days from EAD to today again, on top of `unemployment_days_used`.
   **Response:** fixed (count from max(today, EAD)); added a regression test. Scenario 1 could never have caught this.

9. **`node --test <dir>`** fails on Node 24 with "Cannot find module".
   **Response:** docs use the test file path.

10. **All tests passed the first time.** Treated as suspicious.
    **Response:** mutated the liveness gate (Break 1) and confirmed 2 tests fail, then restored.

11. **First failure-case capture** echoed `/tmp/...` while actually writing to a scratch path that includes the local username.
    **Response:** re-ran into `course/…/runs/fail-past-auth/` so the pasted command and output match exactly.

12. **The pasted PII-scan output made TEST-REPORT itself a finding.** It quoted the upstream lockfile's npm-author email.
    **Response:** redacted that address in the report (marked as redacted). The scan is back to the single upstream finding.

13. **Checked the whole submission against the assignment text, at the student's request ("did we follow all this").** Gaps found and closed:
    - the engine baseline (`ats:scan`, `ats:liveness`, `score`) had not been run or pasted;
    - the sponsorship term carried an invented fourth label;
    - some computed values had no label;
    - one TODO used a type the assignment doesn't list (`DEFINE`);
    - one path was abbreviated;
    - fact 6 wasn't addressed;
    - the domain justification ran past one page (707 → 597 words).

    **Response:** fixed each one, re-captured every pasted output from the new code, and appended revisions to CHANGE-BRIEF.
    **Learning:** strict labels turned "sponsorship is a record" into "0/27 scorer terms are records", which is less flattering and more accurate.

14. **`ats:liveness` needed a browser build that wasn't installed** (Playwright 1.62.1 wants headless shell 1234).
    **Response:** `npx playwright install --only-shell chromium` (about 95 MB, Playwright's own cache, nothing in the repo). After that, a real Databricks posting checked `active`.

15. **Before the first commit:** the global git identity used a real university email, which would be public in the commit history.
    **Response:** set a repo-only identity with the GitHub noreply address. The global setting is unchanged.

16. **Privacy decision:** the student's résumé was read (from Desktop) only to choose the domain. Nothing from it is in the repo. Tracked files describe "a student in this situation" and never state the author's own visa status, because the data contract counts real immigration details as zero-condition.

Traceability:
- outputs in `course/2026fa/submissions/shreyashyadav1/runs/` and `breaks/`;
- tests in `scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/`;
- build commit: `1801e9e`; PR: https://github.com/nikbearbrown/the-reallocation-engine/pull/39
- the session transcript can be exported from the Claude desktop app if asked.

## 3. My entries (my facts from chat, typed up by Claude)

- What I checked by hand myself: Re-ran the tests (11/11 pass) and both scenarios. Same results as the worked run. Pulled Sirona Medical's row from the CSV (line 24368): 26 approvals, 0 denials, 100% rate, same three titles as the report.
- What I changed in the AI's draft, and why: Nothing in the code or docs myself. I asked Claude to check everything against the assignment text, and that caught 7 gaps (item 13).
- What I rejected: Nothing so far. I kept Claude's design, including the DRAFT status.
- What I still don't understand or would question: Why is every H-1B approval and denial count in the CSV even? Is that a doubled join, or something real?
- Time I actually spent, and on what: Under 1 hour, mostly choosing the domain and reviewing in chat.
