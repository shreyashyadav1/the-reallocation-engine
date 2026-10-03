# Domain justification — healthins-ai-opt

## Executive summary

This page argues that one specific job seeker needs this tool, and says what it saves them. The user is an international master's student about to start OPT who wants AI engineering work at insurance and health companies. They can't easily tell which of these companies have sponsored software-type roles before, or which openings can close before their unemployment days run out. The tool cuts the per-opening research from most of an hour to minutes, and moves the saved time to networking.

## Who, in exactly what situation

An international MS student in a STEM-designated information-systems or computer-science program:
- graduating in December, with post-completion OPT starting in January;
- 12 months of authorization and a 90-day unemployment ceiling, which rises to 150 only if a later STEM extension is approved;
- has built LLM extraction pipelines and agentic workflows;
- targets applied-AI / LLM engineering roles (SOC 15-1252) at insurance carriers, insurtechs and health-tech firms.

Two facts make this different from "any international job seeker":
- **Applications sent before the EAD start cost no unemployment days.** October–December is the cheapest window.
- **The first employer must use E-Verify** for the STEM extension to be possible later.

## The information asymmetry

From outside, this student cannot easily see:

1. **Which insurance and health companies have sponsored software-type roles.** Carriers sponsor heavily, but often for actuaries. Pacific Life's sponsored titles in the data are all actuarial. Small health-tech firms rarely say.
2. **Whether hiring fits the clock.** A six-to-seven-month public-company loop started in October ends past the 90-day ceiling. A six-week startup loop costs zero days.
3. **Whether a company missing from the data is a non-sponsor or a name mismatch.**

A chatbot asked "does Lemonade sponsor ML engineers?" answers fluently. The record says only *no approvals in this dataset*: Unknown, not No.

## Engine layers

- **80 Days to Stay CSV:** H-1B approvals, approval rate, sponsored titles, industry, latest funding.
- **Form D samples:** funding recency.
- **BLS compact file:** the national 15-1252 median, as context only.
- **Ch.11 scorer:** combines the votes; liveness and timeline are gates.

## Where it fits the 3-3-2 day

It takes over the **research half of the two apply-hours**: sponsorship lookups, funding checks, posting dates, and visa date arithmetic for each opening.

**Estimate, not measured:**
- by hand, about 25–35 minutes per opening, or roughly 4–6 hours a week for 10 openings;
- with the tool, about 5 minutes per opening to enter it and check the posting, roughly 1 hour a week;
- **so about 3–5 hours a week saved.** No one has timed it.

It feeds the **networking three hours**: Consider and Unknown-but-funded results become "find a contact first", and a "network, don't apply" list names in-sector sponsors with recent funding. The prototype itself, with tests and an honest limits section, is a credibility-hour artifact.

## Failure modes specific to this domain

1. **A medtech "engineer" looks like a software sponsor.** Health companies sponsor many Quality, Manufacturing and Supplier engineers, which are not 15-1252. A naive title match counts them. The rule excludes those titles, but adjacent ones still get through, such as "NLP Data Scientist" (15-2051).
   - *Hardest to catch for:* a student skimming approved titles that all say "Engineer".
2. **An optimistic clock.** A startup's six-week estimate gets copied onto a large insurer. The timeline factor reads 1 when the real process ends past the ceiling. Every date is printed, but the estimate is the student's own.
   - *Hardest to catch for:* the student who most wants that job.
