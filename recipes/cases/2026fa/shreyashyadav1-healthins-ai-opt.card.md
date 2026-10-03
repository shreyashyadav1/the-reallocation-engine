# healthins-ai-opt — human card

**Audience:** an international master's student, graduating in December, about to start OPT, deciding which insurance and health-tech AI engineering openings deserve their limited application hours.
**Agent twin:** `recipes/cases/2026fa/shreyashyadav1-healthins-ai-opt.md`
**Chapters:** 7 (sponsorship tier), 10 (timeline gate), 11 (scorer).

## Executive summary

Give it your OPT dates and the openings you are looking at. For each opening it tells you: apply now, network first, drop it, or "a human needs to check something before I can say". It uses public visa-petition and funding records where they exist, says plainly where they don't, and never fills a gap with a guess. A run takes under a second on sample data.

## Purpose

Answer: of the roles on my list, which can I realistically land — a company with a record of sponsoring software-type work, a posting that is real, and a hiring process that ends before my unemployment days run out?

## What it can verify

- The company has exactly one row in the 80 Days dataset under that name, and what that row says about approved and denied H-1B petitions and the job titles sponsored.
- The company's SEC industry code and its latest funding date in that dataset; a newer Form D filing if the company is in the shipped sample.
- The date arithmetic: when you could start, how many unemployment days you would have used by then, and whether that is inside your buffer.

## What it cannot verify

- **That past petitions were for your occupation.** The data lists job titles, not occupation codes; a pattern rule decides what counts as "software-type", and it lets in some adjacent titles (data scientist, director-level).
- **That the petition counts are exact.** Every count in the dataset is an even number, which suggests the upstream join doubled them. The tool uses counts only against thresholds.
- **That a missing company does not sponsor.** It may just be spelled differently. Such roles come back BLOCKED, not Skip.
- **That the posting is live.** You check it and enter the date; the tool will not score a posting nobody checked.
- **E-Verify enrolment** (required for the STEM extension), current sponsorship policy, how long a company really takes to hire, and what it pays.
- **That the score is record-backed.** The records decide which tier a company falls in, but every number the scorer multiplies is your own input or the author's rule. On the worked run, 0 of 27 scorer terms were records. Read the ranking as a sort of your own judgments, gated by the calendar.
- **Anything legal.** STEM eligibility and day counts are your DSO's call.

## Annotated commands

Main run (fictional persona, hypothetical postings, today fixed so the run is reproducible):

```bash
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2026-10-03
```

Same person after OPT starts, 40 days used — watch the timeline gate close almost everything:

```bash
node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs --today 2027-02-20 --persona scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/inputs/persona.after-ead.example.json
```

Offline tests (no network):

```bash
node --test scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/healthins-ai-opt.test.mjs
```

## What it produces

- `report.md` — for you: decisions, the dates behind every timeline number, the next action for each role, and companies to network into.
- `run-log.json` — for an agent: every value with its label (record / your-input) and source file.
- `role-scores.json` / `role-scores.md` — the repository scorer's own output and arithmetic.

## What you decide (the gate)

Before acting on any Apply: re-check the dates against your own EAD card, open the posting yourself, and decide. Write the decision in your run log. The tool never sends anything.

## Named failure modes

1. **Title-proxy drift.** A medtech company that sponsored "Senior Quality Engineer" looks like a software sponsor to a naive "engineer" match. The rule excludes quality/manufacturing/supplier titles and caps such companies at Likely; a new title pattern can still slip through. Hardest to catch for a student skimming a list of approved titles.
2. **Name-miss read as non-sponsor.** "Abridge AI" does not match `ABRIDGED INC` (a different company) — correct — but a real sponsor filed under a parent name would also come back BLOCKED. The fix is resolving the entity, not lowering the bar.
3. **Optimistic clock.** A process-days estimate copied from a startup onto a large insurer makes the timeline factor 1 when it should be 0. The report prints every date so you can see where the number came from.
4. **Sector filter misses insurtechs** filed under "Other Technology" or "Other". They will not show up on the network list at all.
