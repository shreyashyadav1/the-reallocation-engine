// Offline tests for the healthins-ai-opt prototype. No network: every input is
// a fixture in test/fixtures/, and the end-to-end cases drive the REAL scorer
// (scripts/score/role-scorer.mjs) through run.mjs — not a copy of it.
//
//   node --test scripts/contrib/2026fa/shreyashyadav1-healthins-ai-opt/test/healthins-ai-opt.test.mjs

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  titleMatches, normalizeName, parseCsv, parseTitleList, sponsorshipEvidence,
  timelineFactor, validatePersona, livenessGate, parseDate,
} from '../lib.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FX = path.join(HERE, 'fixtures');
const RUN = path.join(HERE, '..', 'run.mjs');
const ROOT = path.resolve(HERE, '../../../../..');
const LABELS = new Set(['record', 'your-input', 'model-judgment']); // the engine's three labels — nothing else

function run(extra, outDir) {
  return spawnSync(process.execPath, [RUN,
    '--today', '2026-10-03', '--out-dir', outDir,
    '--csv', path.join(FX, 'mini-80days.csv'), '--formd-dir', path.join(FX, 'formd'), '--bls', path.join(FX, 'mini-bls.csv'),
    ...extra], { encoding: 'utf8' });
}
const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'healthins-ai-opt-'));

test('title rule: software/AI engineering in, medtech and business titles out', () => {
  for (const t of ['Software Engineer 2', 'Senior Machine Learning Engineer', 'Staff AI/ML Data Engineer', 'Full-Stack Software Engineer', 'NLP Engineer'])
    assert.equal(titleMatches(t), true, t);
  for (const t of ['Senior Quality Engineer I', 'Manufacturing Engineer', 'Enterprise Business Operations Manager - AI', 'Data Analyst', 'Associate Actuary'])
    assert.equal(titleMatches(t), false, t);
});

test('entity names: exact after normalisation, never prefix', () => {
  assert.equal(normalizeName('Sirona Medical, Inc.'), normalizeName('SIRONA MEDICAL INC'));
  assert.notEqual(normalizeName('Abridge AI, Inc.'), normalizeName('ABRIDGED INC'));
  assert.notEqual(normalizeName('Fixture Claims'), normalizeName('FIXTURE CLAIMS AI INC'));
});

test('csv reader handles quoted commas and python list titles', () => {
  const rows = parseCsv(fs.readFileSync(path.join(FX, 'mini-80days.csv'), 'utf8'));
  assert.equal(rows.length, 5);
  assert.equal(rows[0].executive_officers, 'Officer One, Officer Two');
  assert.equal(rows[4].company_name, 'ACME HEALTH, LLC');
  assert.deepEqual(parseTitleList(rows[0].top_job_titles_sponsored), ['Software Engineer', 'Claims Analyst']);
});

test('sponsorship: missing entity and empty record are not turned into numbers', () => {
  const miss = sponsorshipEvidence(null, 'x.csv');
  assert.equal(miss.status, 'missing'); assert.equal(miss.p, null);
  const rows = parseCsv(fs.readFileSync(path.join(FX, 'mini-80days.csv'), 'utf8'));
  const none = sponsorshipEvidence(rows[2], 'x.csv');
  assert.equal(none.tier, 'Unknown'); assert.equal(none.p, null);
  const medtech = sponsorshipEvidence(rows[1], 'x.csv');
  assert.equal(medtech.tier, 'Likely', 'sponsored only non-software engineers → capped at Likely');
});

test('timeline gate: comfortable, inside buffer, past ceiling, past auth end', () => {
  const visa = { ead_start_date: '2027-01-11', auth_end_date: null, unemployment_days_used: 0, unemployment_ceiling: 90, buffer_target_days: 30 };
  const today = parseDate('2026-10-03');
  assert.equal(timelineFactor(visa, 30, today).factor, 1);                 // starts at EAD, 0 days used
  const inside = timelineFactor(visa, 170, today);                         // start 2027-03-22 → 70 days
  assert.equal(inside.dates.unemployment_days_at_start, 70);
  assert.equal(inside.factor, Number(((90 - 70) / 30).toFixed(3)));
  assert.equal(timelineFactor(visa, 200, today).factor, 0);                // 100 days > 90
  const shortAuth = { ...visa, auth_end_date: '2027-02-01', unemployment_ceiling: 400, buffer_target_days: 30 };
  assert.equal(timelineFactor(shortAuth, 150, today).band, 'past-authorization-end');
  assert.equal(timelineFactor(visa, undefined, today).status, 'missing');
});

test('timeline gate after EAD: days already used are not counted twice', () => {
  const visa = { ead_start_date: '2027-01-11', auth_end_date: null, unemployment_days_used: 40, unemployment_ceiling: 90, buffer_target_days: 30 };
  const t = timelineFactor(visa, 45, parseDate('2027-02-20'));            // 40 used + 45 ahead
  assert.equal(t.dates.unemployment_days_at_start, 85);
  assert.equal(t.factor, Number((5 / 30).toFixed(3)));
});

test('persona validation refuses past or missing dates', () => {
  const today = parseDate('2026-10-03');
  const past = JSON.parse(fs.readFileSync(path.join(FX, 'persona.past-auth.fixture.json'), 'utf8'));
  assert.ok(validatePersona(past, today).some((e) => /already past/.test(e)));
  assert.ok(validatePersona({ target_soc: '15-1252', visa: {} }, today).some((e) => /ead_start_date/.test(e)));
});

test('liveness: unchecked or undated never becomes a factor', () => {
  assert.equal(livenessGate({ status: 'unchecked' }).factor, null);
  assert.equal(livenessGate({ status: 'active' }).reason, 'liveness-check-undated');
  assert.equal(livenessGate({ status: 'closed', checked_on: '2026-10-01' }).factor, 0);
});

test('end to end on fixtures: real scorer, both outputs, labels, failure cases', () => {
  const out = tmp();
  const r = run(['--persona', path.join(FX, 'persona.fixture.json'), '--candidates', path.join(FX, 'candidates.fixture.json')], out);
  assert.equal(r.status, 0, r.stderr);
  for (const f of ['roles.json', 'role-scores.json', 'role-scores.md', 'run-log.json', 'report.md']) assert.ok(fs.existsSync(path.join(out, f)), f);

  const scores = JSON.parse(fs.readFileSync(path.join(out, 'role-scores.json'), 'utf8'));
  assert.equal(scores._scorer, 'bayesian-role-scorer', 'output must come from the repo scorer');
  for (const s of scores.roles) {
    for (const v of s.trace.votes) assert.ok(LABELS.has(v.source), `vote ${v.factor} label ${v.source}`);
    for (const g of s.trace.gates) assert.ok(LABELS.has(g.source), `gate ${g.factor} label ${g.source}`);
  }

  const roles = JSON.parse(fs.readFileSync(path.join(out, 'roles.json'), 'utf8'));
  for (const role of roles) {
    assert.equal(typeof role.liveness.factor, 'number', `${role.role_id} reached the scorer without a liveness check`);
    // the tier p is the author's rule → your-input; the record values it read travel with it
    assert.equal(role.sponsorship.source, 'your-input');
    assert.equal(role.sponsorship.derived_from.source, 'record');
  }

  const log = JSON.parse(fs.readFileSync(path.join(out, 'run-log.json'), 'utf8'));
  const by = Object.fromEntries(log.roles.map((x) => [x.role_id, x]));
  assert.equal(by['too-slow'].decision.recommendation, 'Skip');
  assert.equal(by['too-slow'].next_action.block, 'reallocate');
  assert.equal(by.ghost.decision.recommendation, 'Skip');
  assert.deepEqual(by.unchecked.blocked, ['liveness-unchecked']);
  assert.deepEqual(by['not-in-csv'].blocked, ['entity-not-found']);
  assert.deepEqual(by.ambiguous.blocked, ['entity-ambiguous']);
  assert.equal(by['no-record'].sponsorship.tier, 'Unknown');
  assert.equal(by['no-record'].sponsorship.p, null);
  assert.equal(by['apply-me'].funding.form_d_sample.date_filed.value, '15-MAY-2026');
  assert.equal(log.coverage.entity_matched_in_csv, '6/8');
  assert.match(log.coverage.scorer_terms_labeled_record, /^\d+\/\d+$/);
  assert.match(fs.readFileSync(path.join(out, 'report.md'), 'utf8'), /^# .*\n\n## Executive summary/);
});

test('fails clearly, with no scores, when the authorization end is past', () => {
  const out = tmp();
  const r = run(['--persona', path.join(FX, 'persona.past-auth.fixture.json'), '--candidates', path.join(FX, 'candidates.fixture.json')], out);
  assert.equal(r.status, 2);
  assert.match(r.stderr, /already past/);
  assert.equal(JSON.parse(fs.readFileSync(path.join(out, 'run-log.json'), 'utf8')).status, 'failed');
  assert.equal(fs.existsSync(path.join(out, 'role-scores.json')), false);
});

test('refuses to write over tracked repo paths', () => {
  const target = path.join(ROOT, 'data/examples');
  const before = fs.readFileSync(path.join(target, 'role-scores.json'), 'utf8');
  const r = run(['--persona', path.join(FX, 'persona.fixture.json'), '--candidates', path.join(FX, 'candidates.fixture.json')], target);
  assert.equal(r.status, 2);
  assert.equal(fs.readFileSync(path.join(target, 'role-scores.json'), 'utf8'), before);
});
