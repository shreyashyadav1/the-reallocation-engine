#!/usr/bin/env node
// run.mjs — healthins-ai-opt prototype (INFO 7375 Fall 2026 recipe assignment).
//
// For an international MS student (STEM, OPT not yet started) targeting
// applied-AI / LLM engineering roles (SOC 15-1252) at insurance and health
// companies: join each candidate role to the 80 Days CSV (H-1B record) and the
// SEC Form D samples (funding), compute the OPT timeline gate from the
// person's dates, hold back anything unverified, and hand the rest to the
// EXISTING Ch.11 scorer (scripts/score/role-scorer.mjs) via its CLI.
//
//   node scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/run.mjs \
//        [--persona p.json] [--candidates c.json] [--today YYYY-MM-DD] [--out-dir dir]
//        [--csv f] [--formd-dir d] [--bls f]
//
// Writes into --out-dir only (default course/2026fa/submissions/shreyashyadav1/runs/<today>/):
//   roles.json        scorer input (what this script built)
//   role-scores.json  scorer output (written by role-scorer.mjs, untouched)
//   role-scores.md    scorer output (written by role-scorer.mjs, untouched)
//   run-log.json      agent-facing log: every value with its source label
//   report.md         person-facing report: decisions, gates, next actions
//
// No network. Reads only the repo's data/ files and the two input JSONs.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  SRC, parseCsv, normalizeName, sponsorshipEvidence, fundingEvidence, timelineFactor,
  livenessGate, validatePersona, parseDate, isoDate, nextAction, TITLE_RULE, TIER_RULE,
} from './lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../../..');
const rel = (p) => path.relative(ROOT, p) || '.';

function arg(name, def) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : def;
}

function fail(msg, outDir, extra = {}) {
  console.error(`✗ ${msg}`);
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(path.join(outDir, 'run-log.json'), JSON.stringify({ recipe: 'healthins-ai-opt', status: 'failed', error: msg, ...extra, roles: [] }, null, 2) + '\n');
    console.error(`  wrote failure log: ${rel(path.join(outDir, 'run-log.json'))} (no scores were produced)`);
  }
  process.exit(2);
}

function readJson(p, what) {
  if (!fs.existsSync(p)) fail(`${what} not found: ${rel(p)}`);
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { fail(`${what} is not valid JSON: ${rel(p)} (${e.message})`); }
}

function loadFormD(dir) {
  const idx = new Map();
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  let companies = 0;
  for (const f of files) {
    const p = path.join(dir, f);
    const d = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const c of d.companies || []) {
      companies++;
      const key = normalizeName(c.company?.name);
      const hit = { name: c.company?.name, date_filed: c.filing?.date_filed, file: rel(p) };
      const prev = idx.get(key);
      if (!prev || (parseDate(hit.date_filed) || 0) > (parseDate(prev.date_filed) || 0)) idx.set(key, hit);
    }
  }
  return { idx, files: files.map((f) => rel(path.join(dir, f))), companies };
}

function main() {
  const today = parseDate(arg('today', isoDate(new Date())));
  if (!today) fail('--today must be YYYY-MM-DD');
  const outDir = path.resolve(arg('out-dir', path.join(ROOT, 'course/2026fa/submissions/shreyashyadav1/runs', isoDate(today))));
  const personaPath = path.resolve(arg('persona', path.join(HERE, 'inputs/persona.example.json')));
  const candPath = path.resolve(arg('candidates', path.join(HERE, 'inputs/candidates.example.json')));
  const csvPath = path.resolve(arg('csv', path.join(ROOT, 'data/80-days-to-stay/80-days-csv/mapped_student_employment_targets_v3.csv')));
  const formDDir = path.resolve(arg('formd-dir', path.join(ROOT, 'data/sec/form-d/processed/sample')));
  const blsPath = path.resolve(arg('bls', path.join(ROOT, 'data/bls/compact/soc_occupation_compact.csv')));
  const scorer = path.join(ROOT, 'scripts/score/role-scorer.mjs');

  // never write over a tracked repo file: out-dir must be inside our own namespaces or outside the repo
  const relOut = path.relative(ROOT, outDir);
  const foreignRepoPath = !relOut.startsWith('..') && !path.isAbsolute(relOut) &&
    !/^(course\/2026fa\/submissions\/shreyashyadav1|scripts\/contrib\/2026fa\/shreyashyadav1-healthins-ai-opt)(\/|$)/.test(relOut);
  if (foreignRepoPath) fail(`--out-dir ${relOut} is inside the repo but outside this contribution's namespaces; refusing to write there`);

  const persona = readJson(personaPath, 'persona');
  const candidates = readJson(candPath, 'candidates');
  const errs = validatePersona(persona, today);
  if (errs.length) fail(`persona dates/limits unusable — timeline gate cannot be computed:\n  - ${errs.join('\n  - ')}`, outDir, { persona_file: rel(personaPath), today: isoDate(today), errors: errs });

  if (!fs.existsSync(csvPath)) fail(`80 Days CSV not found: ${rel(csvPath)}`, outDir);
  const csvText = fs.readFileSync(csvPath, 'utf8');
  const rows = parseCsv(csvText);
  const csvRel = rel(csvPath);
  const byName = new Map();
  for (const r of rows) {
    const k = normalizeName(r.company_name);
    if (!byName.has(k)) byName.set(k, []);
    byName.get(k).push(r);
  }
  const withApprovals = rows.filter((r) => r['Total Approvals'] !== '');
  const evenA = withApprovals.filter((r) => Number(r['Total Approvals']) % 2 === 0).length;
  const evenD = withApprovals.filter((r) => r['Total Denials'] !== '' && Number(r['Total Denials']) % 2 === 0).length;

  const formD = loadFormD(formDDir);

  // role quality context (NOT a vote — scorer weight is 0.0 [VERIFY])
  let roleQuality = { status: 'missing', reason: 'bls-file-not-found' };
  if (fs.existsSync(blsPath)) {
    const bls = parseCsv(fs.readFileSync(blsPath, 'utf8')).find((r) => r.bls_soc_code === persona.target_soc);
    roleQuality = bls
      ? { status: 'ok', soc: persona.target_soc, title: bls.title, annual_median_wage: Number(bls.annual_median_wage) || null,
          oews_year: bls.oews_year, employment: Number(bls.employment) || null, source: SRC.record, file: rel(blsPath),
          used_in_score: false, why_not: 'role-scorer.mjs weights.role_quality = 0.0 [VERIFY]; national OEWS median is context only (fact 1)' }
      : { status: 'missing', reason: 'no-occupation-row', soc: persona.target_soc, file: rel(blsPath) };
  }

  const recentMonths = persona.funding_recent_months ?? 18;
  const visa = persona.visa;
  const built = [];
  const toScore = [];

  for (const c of candidates.roles || []) {
    const key = normalizeName(c.company);
    const matches = byName.get(key) || [];
    const csvRow = matches.length === 1 ? matches[0] : null;
    const spons = matches.length > 1
      ? { status: 'missing', reason: 'entity-ambiguous', tier: null, p: null, note: `${matches.length} CSV rows normalise to the same name` }
      : sponsorshipEvidence(csvRow, csvRel);
    const fund = fundingEvidence(csvRow, csvRel, formD.idx.get(key), today, recentMonths);
    const live = livenessGate(c.liveness);
    const time = timelineFactor(visa, c.process_days_estimate, today);
    const fit = typeof c.fit === 'number' && c.fit >= 0 && c.fit <= 1 ? { p: c.fit, source: SRC.input } : null;

    const blocked = [
      spons.status === 'missing' ? spons.reason : null,
      live.status === 'missing' ? live.reason : null,
      time.status === 'missing' ? time.reason : null,
    ].filter(Boolean);

    const entry = {
      role_id: c.role_id, company: c.company, title: c.title,
      industry: csvRow ? { value: csvRow.industry, source: SRC.record, file: csvRel } : null,
      in_target_sector: csvRow ? { value: (persona.sector_industries || []).includes(csvRow.industry), source: SRC.input, basis: 'record industry checked against your-input sector list' } : null,
      posting: { url: c.posting_url || null, source: SRC.input, hypothetical: c.hypothetical === true },
      sponsorship: spons, funding: fund, liveness: live, timeline: time,
      fit: fit || { p: null, source: SRC.input, note: 'no fit given — fit vote omitted, not invented' },
      process_days_estimate: { value: c.process_days_estimate ?? null, source: SRC.input, basis: c.process_basis || null },
      e_verify: { status: 'unverified', note: 'STEM OPT requires an E-Verify employer; no E-Verify data in this repo [TODO: DATA SOURCE]' },
      blocked: blocked.length ? blocked : null,
    };
    built.push(entry);

    if (!blocked.length) {
      // p comes from the author's tier rule, not from a record, so the scorer sees
      // it as your-input; the record values the rule read travel with it.
      const derivedFrom = { source: SRC.record, file: csvRel, total_approvals: spons.inputs.total_approvals.value,
        approval_rate: spons.inputs.approval_rate.value, titles_matching_rule: spons.inputs.titles_matching_15_1252_rule.value };
      const sponsorshipTerm = spons.p != null
        ? { p: spons.p, tier: spons.tier, source: SRC.input, derived_from: derivedFrom }
        : { tier: spons.tier, source: SRC.input, derived_from: derivedFrom }; // Unknown: no p → the vote is omitted, not set to 0
      const role = {
        role_id: c.role_id, company: c.company, title: c.title,
        sponsorship: sponsorshipTerm,
        liveness: { factor: live.factor, source: live.source },
        timeline: { factor: time.factor, source: SRC.input },
      };
      if (fit) role.fit = fit;
      toScore.push(role);
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const rolesPath = path.join(outDir, 'roles.json');
  fs.writeFileSync(rolesPath, JSON.stringify(toScore, null, 2) + '\n');

  let scored = { roles: [] };
  let scorerStdout = '(no roles passed the evidence gates — scorer not run)';
  if (toScore.length) {
    scorerStdout = execFileSync(process.execPath, [scorer, rolesPath, '--out-dir', outDir], { cwd: ROOT, encoding: 'utf8' }).trim();
    scored = JSON.parse(fs.readFileSync(path.join(outDir, 'role-scores.json'), 'utf8'));
  }
  const byId = new Map(scored.roles.map((r) => [r.role_id, r]));
  // how much of what the scorer multiplied was actually a record
  const terms = scored.roles.flatMap((s) => [...s.trace.votes, ...s.trace.gates]);
  const recordTerms = terms.filter((t) => t.source === SRC.record).length;

  for (const e of built) {
    const s = byId.get(e.role_id);
    const gateClosed = s?.trace?.gates?.find((g) => g.multiplier <= (scored.config?.gate_zero ?? 0.05))?.factor || null;
    e.decision = s
      ? { recommendation: s.recommendation, composite: s.composite, reason: s.reason, arithmetic: s.trace.arithmetic, source: 'scripts/score/role-scorer.mjs' }
      : { recommendation: 'BLOCKED', composite: null, reason: `not scored: ${e.blocked.join(', ')}` };
    e.next_action = nextAction({ blocked: e.blocked?.join(', '), recommendation: s?.recommendation, gateClosed, tier: e.sponsorship.tier, fundingRecency: e.funding.recency });
  }

  // networking list: in-sector sponsors with recent funding that are NOT on the candidate list
  const candKeys = new Set(built.map((b) => normalizeName(b.company)));
  const states = new Set(persona.preferred_states || []);
  const network = rows
    .filter((r) => (persona.sector_industries || []).includes(r.industry) && !candKeys.has(normalizeName(r.company_name)))
    .filter((r) => !states.size || states.has(r.state))
    .map((r) => ({ r, s: sponsorshipEvidence(r, csvRel), f: fundingEvidence(r, csvRel, formD.idx.get(normalizeName(r.company_name)), today, recentMonths) }))
    .filter((x) => (x.s.tier === 'Proven' || x.s.tier === 'Likely') && x.f.recency === 'recent')
    .sort((a, b) => (a.f.csv?.months_since ?? 999) - (b.f.csv?.months_since ?? 999))
    .slice(0, persona.network_list_size ?? 8)
    .map((x) => ({ company: x.r.company_name, industry: x.r.industry, state: x.r.state,
      latest_funding: `${x.r.latest_funding_stage || '?'} ${x.r.latest_funding_date}`, source: SRC.record, file: csvRel,
      months_since_funding: { value: x.f.csv?.months_since ?? null, source: SRC.input },
      tier: { value: x.s.tier, source: SRC.input }, matched_titles: { value: x.s.inputs.titles_matching_15_1252_rule.value, source: SRC.input } }));

  const matched = built.filter((b) => b.industry).length;
  const formDHits = built.filter((b) => b.funding.form_d_sample).length;
  const count = (k) => built.filter((b) => b.decision.recommendation === k).length;
  const log = {
    recipe: 'healthins-ai-opt', recipe_version: '0.1.0', status: 'ok', today: isoDate(today),
    inputs: { persona: rel(personaPath), candidates: rel(candPath), csv: csvRel, form_d_samples: formD.files, bls: rel(blsPath) },
    data_mode: 'sample — Form D is the shipped 50-company-per-quarter sample only (fact 3); 80 Days CSV is the full shipped file',
    rules: { title_rule: { include: String(TITLE_RULE.include), exclude: String(TITLE_RULE.exclude), source: SRC.input },
      tier_rule: { ...TIER_RULE, source: SRC.input }, funding_recent_months: { value: recentMonths, source: SRC.input },
      timeline_formula: 'factor = 1 if u ≤ ceiling−buffer; (ceiling−u)/buffer inside buffer; 0 if u ≥ ceiling or start > auth_end — your-input, proposed' },
    coverage: {
      candidates: built.length, entity_matched_in_csv: `${matched}/${built.length}`,
      form_d_sample_hits: `${formDHits}/${matched}`, form_d_sample_companies_scanned: formD.companies,
      scored: toScore.length, blocked: built.length - toScore.length,
      scorer_terms_labeled_record: `${recordTerms}/${terms.length}`,
    },
    labels: 'Evidence values carry source = record | your-input | model-judgment (none here: no model is called). ' +
      'A value computed from labeled inputs is labeled your-input when any input or rule is the person\'s (months_since uses --today). ' +
      'coverage, summary and decision are outputs of this run and the scorer, not evidence.',
    data_quality: {
      source: SRC.record, method: 'parity count over every CSV row with an approval record',
      approval_counts_even: `${evenA}/${withApprovals.length}`, denial_counts_even: `${evenD}/${withApprovals.length}`,
      note: evenA === withApprovals.length && withApprovals.length > 0
        ? 'Every approval and denial count in the CSV is even — consistent with a 2× duplication in the upstream join. Raw counts are used only against thresholds; absolute counts are not quoted as facts.'
        : 'parity check did not flag a systematic pattern',
    },
    persona_visa: { ...visa, source: SRC.input },
    role_quality_context: roleQuality,
    scorer: { path: rel(scorer), invoked_as: `node ${rel(scorer)} ${rel(rolesPath)} --out-dir ${rel(outDir)}`, stdout: scorerStdout,
      profile_passed: false, needs_sponsorship_default: true },
    summary: { Apply: count('Apply'), Consider: count('Consider'), Skip: count('Skip'), BLOCKED: count('BLOCKED') },
    roles: built,
    network_targets: network,
  };
  fs.writeFileSync(path.join(outDir, 'run-log.json'), JSON.stringify(log, null, 2) + '\n');
  fs.writeFileSync(path.join(outDir, 'report.md'), renderReport(log));

  console.log(`healthins-ai-opt · today ${isoDate(today)} · ${built.length} candidate roles`);
  console.log(`  entity matched ${matched}/${built.length} · Form D sample hits ${formDHits}/${matched} · blocked ${built.length - toScore.length} · scorer terms that are records ${recordTerms}/${terms.length}`);
  console.log(`  scorer: ${scorerStdout.split('\n')[0]}`);
  console.log(`  → Apply ${count('Apply')} · Consider ${count('Consider')} · Skip ${count('Skip')} · BLOCKED ${count('BLOCKED')}`);
  for (const b of built) {
    const d = b.decision;
    console.log(`  ${d.recommendation.padEnd(8)} ${String(d.composite ?? '—').padEnd(6)} ${b.company} — ${b.title}  [${b.next_action.block}]`);
  }
  console.log(`  wrote ${rel(path.join(outDir, 'run-log.json'))} + ${rel(path.join(outDir, 'report.md'))}`);
}

const f3 = (x) => (x == null ? '—' : Number(x).toFixed(3));

function renderReport(log) {
  const o = [];
  const v = log.persona_visa;
  o.push(`# Health/insurance applied-AI roles — OPT-gated triage (${log.today})`, '');
  o.push('## Executive summary', '');
  o.push(`${log.coverage.candidates} candidate roles checked. **Apply ${log.summary.Apply} · Consider ${log.summary.Consider} · Skip ${log.summary.Skip} · BLOCKED ${log.summary.BLOCKED}.** ` +
    `BLOCKED rows were never scored: something a human must check is missing (an entity the CSV does not have, or a posting nobody has checked). ` +
    `Sponsorship comes from the 80 Days CSV (record) through a tier rule the author chose (your-input). The timeline gate comes from your OPT dates (your-input). ` +
    `Funding is shown for context only — the scorer has no funding term. Nothing here was produced by a model.`, '');
  o.push('> Planning aid, not legal advice. STEM OPT eligibility, E-Verify status and unemployment-day counts are confirmed with your DSO, not by this report.', '');
  o.push('## Your clock (your-input)', '');
  o.push(`EAD start ${v.ead_start_date} · authorization end ${v.auth_end_date || '(EAD start + 364 days)'} · unemployment used ${v.unemployment_days_used}/${v.unemployment_ceiling} · buffer target ${v.buffer_target_days} days · STEM extension planned: ${v.stem_extension_planned ? 'yes (ceiling stays 90 until it is approved)' : 'no'}.`, '');
  o.push('## Decisions', '');
  o.push('| Role | Decision | Composite | Sponsorship tier | Timeline (start → unemployed days) | Liveness | Next action |');
  o.push('|---|---|---|---|---|---|---|');
  const order = { Apply: 0, Consider: 1, Skip: 2, BLOCKED: 3 };
  for (const r of [...log.roles].sort((a, b) => order[a.decision.recommendation] - order[b.decision.recommendation] || (b.decision.composite ?? -1) - (a.decision.composite ?? -1))) {
    const t = r.timeline.status === 'ok' ? `${f3(r.timeline.factor)} (${r.timeline.dates.expected_start} → ${r.timeline.dates.unemployment_days_at_start}d)` : `— (${r.timeline.reason})`;
    const l = r.liveness.status === 'ok' ? `${r.liveness.factor} [${r.liveness.source}, ${r.liveness.checked_on}]` : `— (${r.liveness.reason})`;
    const tier = r.sponsorship.tier ? `${r.sponsorship.tier}${r.sponsorship.p != null ? ` p=${r.sponsorship.p}` : ''}` : `— (${r.sponsorship.reason})`;
    o.push(`| ${r.company} — ${r.title}${r.posting.hypothetical ? ' *(hypothetical posting)*' : ''} | **${r.decision.recommendation}** | ${f3(r.decision.composite)} | ${tier} | ${t} | ${l} | ${r.next_action.block}: ${r.next_action.action} |`);
  }
  o.push('', '## Why, role by role (every term labeled)', '');
  for (const r of log.roles) {
    o.push(`### ${r.company} — ${r.title}`, '');
    o.push(`- **Decision:** ${r.decision.recommendation} — ${r.decision.reason}${r.decision.arithmetic ? ` · \`${r.decision.arithmetic}\`` : ''}`);
    o.push(`- **Industry** [${r.industry ? 'record' : '—'}]: ${r.industry?.value ?? 'not in CSV'}${r.in_target_sector?.value === false ? ' (outside the target sector list — kept because you chose it)' : ''}`);
    const si = r.sponsorship.inputs;
    if (si) o.push(`- **H-1B record** [record, ${si.total_approvals.file}]: approvals ${si.total_approvals.value ?? '—'}, denials ${si.total_denials.value ?? '—'}, rate ${si.approval_rate.value ?? '—'}; sponsored titles: ${si.top_job_titles_sponsored.value.join('; ') || '—'}`);
    if (si) o.push(`- **Titles matching the 15-1252 rule** [your-input rule]: ${si.titles_matching_15_1252_rule.value.join('; ') || 'none'}`);
    o.push(`- **Tier** [your-input rule over record]: ${r.sponsorship.tier ?? '—'} — ${r.sponsorship.note}`);
    const fc = r.funding.csv;
    o.push(`- **Funding** [record]: ${fc ? `${fc.latest_funding_stage.value || '?'} on ${fc.latest_funding_date.value} (${fc.months_since} months ago)` : 'none in CSV'}; Form D sample: ${r.funding.form_d_sample ? `${r.funding.form_d_sample.date_filed.value} (${r.funding.form_d_sample.date_filed.file})` : 'no hit (samples hold 50 companies/quarter)'} → ${r.funding.recency} [your-input rule: ≤ ${r.funding.recency_rule.recent_if_months_le} months]. *Not a scorer term.*`);
    o.push(`- **Fit** [your-input]: ${r.fit.p ?? '— (omitted)'}`);
    o.push(`- **Liveness gate**: ${r.liveness.status === 'ok' ? `${r.liveness.factor} [${r.liveness.source}] via ${r.liveness.method || '?'} on ${r.liveness.checked_on}` : `MISSING (${r.liveness.reason}) — held back: the scorer would silently treat a missing liveness as 1.0`}`);
    if (r.timeline.status === 'ok') {
      const d = r.timeline.dates;
      o.push(`- **Timeline gate** [your-input]: ${f3(r.timeline.factor)} (${r.timeline.band}) — today ${d.today} + ${d.process_days} days (${r.process_days_estimate.basis || 'estimate'}) → earliest ${d.earliest_offer_start}; cannot start before EAD ${d.ead_start} → start ${d.expected_start}; unemployed days at start ${d.unemployment_days_at_start} vs ceiling ${d.ceiling} − buffer ${d.buffer_target_days}; auth end ${d.auth_end}.`);
    } else o.push(`- **Timeline gate**: MISSING (${r.timeline.reason})`);
    o.push(`- **E-Verify**: unverified [TODO: DATA SOURCE] — required for the STEM extension; ask before accepting.`);
    o.push(`- **Next action** (${r.next_action.block}): ${r.next_action.action}`, '');
  }
  o.push('## Network, don\'t apply (in-sector sponsors with recent funding, not on your list)', '');
  if (log.network_targets.length) {
    o.push('| Company | Industry | State | Tier | Matched sponsored titles | Latest funding |', '|---|---|---|---|---|---|');
    for (const n of log.network_targets) o.push(`| ${n.company} | ${n.industry} | ${n.state} | ${n.tier.value} | ${n.matched_titles.value.join('; ') || '—'} | ${n.latest_funding} (${n.months_since_funding.value} mo) |`);
  } else o.push('None met the rule (Proven/Likely tier and funding inside the recency window) in your preferred states.');
  o.push('', '## Role quality (context only — not in the score)', '');
  const q = log.role_quality_context;
  o.push(q.status === 'ok'
    ? `SOC ${q.soc} ${q.title}: national OEWS ${q.oews_year} annual median $${q.annual_median_wage?.toLocaleString('en-US')} [record, ${q.file}]. ${q.why_not}. It does not tell you what any of these employers pays.`
    : `No BLS row (${q.reason}) for SOC ${q.soc}. Nothing was substituted.`);
  o.push('', '## What this run could not verify', '');
  o.push(`- **Any number the scorer multiplied, as a record.** Scorer terms labeled record: ${log.coverage.scorer_terms_labeled_record}. The records choose each company's tier, but the tier's p (the author's rule), fit, liveness and timeline are all your-input.`);
  o.push(`- **That a sponsored title is SOC 15-1252.** The CSV has no SOC column; the title rule is a proxy.`);
  o.push(`- **Exact H-1B counts.** ${log.data_quality.approval_counts_even} approval counts are even — ${log.data_quality.note}`);
  o.push(`- **Recent funding beyond the CSV.** Form D sample hits: ${log.coverage.form_d_sample_hits} (the shipped samples hold 50 companies per quarter; full quarters are gitignored).`);
  o.push(`- **Whether postings are live.** Liveness here is ${[...new Set(log.roles.filter((r) => r.liveness.status === 'ok').map((r) => r.liveness.source))].join(', ') || 'not checked'}, not an ATS record. \`npm run ats:liveness\` is not wired in [TODO: DEV].`);
  o.push('- **E-Verify enrolment, current sponsorship policy, and how long each company really takes to hire** (process days are your estimates).');
  o.push('', `*Coverage: entity matched ${log.coverage.entity_matched_in_csv} · scored ${log.coverage.scored} · blocked ${log.coverage.blocked}. Scorer audit trail: \`role-scores.md\` in this folder.*`, '');
  return o.join('\n');
}

main();
