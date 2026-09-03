import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { scoreAssessment, itemScore } from '../js/scoring.js';

const definition = JSON.parse(await fs.readFile(new URL('../data/icaps-v2.json', import.meta.url), 'utf8'));
const items = definition.dimensions.flatMap(d => d.items);
const html = await fs.readFile(new URL('../index.html', import.meta.url), 'utf8');
const app = await fs.readFile(new URL('../js/app.js', import.meta.url), 'utf8');
const submission = await fs.readFile(new URL('../js/submission.js', import.meta.url), 'utf8');

function responses(value) {
  return Object.fromEntries(items.map(item => [item.id, value]));
}

test('canonical definition has 60 unique items', () => {
  assert.equal(items.length, 60);
  assert.equal(new Set(items.map(i => i.id)).size, 60);
});

test('sanitized version metadata is explicit', () => {
  assert.equal(definition.meta.instrumentVersion, '2.0.0');
  assert.equal(definition.meta.scoringVersion, '2.1.0');
  assert.equal(definition.meta.interpretationVersion, '2.1.0');
  assert.equal(definition.meta.bandNature, 'descriptive_operational_not_psychometric_cutoff');
});

test('D1Q10 is positive wording and aligned polarity', () => {
  const q10 = items.find(i => i.id === 'D1Q10');
  assert.match(q10.text, /conseguimos enfrentá-los com parceria e diálogo/i);
  assert.equal(q10.direction, 'aligned');
  assert.equal(itemScore(5, q10.direction), 100);
});

test('all responses 1 produce construct endpoint 0', () => {
  const result = scoreAssessment(definition, responses(1));
  for (const d of result.dimensions) assert.equal(d.score, 0);
});

test('all neutral responses 3 produce score 50 and intermediate descriptive bands', () => {
  const result = scoreAssessment(definition, responses(3));
  for (const d of result.dimensions) {
    assert.equal(d.score, 50);
    assert.equal(d.band.key, 'intermediate');
  }
});

test('all responses 5 produce construct endpoint 100', () => {
  const result = scoreAssessment(definition, responses(5));
  for (const d of result.dimensions) assert.equal(d.score, 100);
});

test('risk dimensions invert protective score without changing construct score', () => {
  const result = scoreAssessment(definition, responses(5));
  for (const id of ['D2','D3','D4','D5']) {
    const d = result.dimensions.find(x => x.id === id);
    assert.equal(d.score, 100);
    assert.equal(d.protectiveScore, 0);
  }
});

test('positive dimensions preserve protective score', () => {
  const result = scoreAssessment(definition, responses(5));
  for (const id of ['D1','D6']) {
    const d = result.dimensions.find(x => x.id === id);
    assert.equal(d.score, 100);
    assert.equal(d.protectiveScore, 100);
  }
});

test('missing response fails closed', () => {
  const r = responses(3);
  delete r.D4Q07;
  assert.throws(() => scoreAssessment(definition, r), /MISSING_RESPONSES:1/);
});

test('invalid Likert values are rejected', () => {
  const r = responses(3);
  r.D2Q01 = 6;
  assert.throws(() => scoreAssessment(definition, r), /INVALID_LIKERT_VALUE/);
});

test('band boundaries are contiguous at 24/25, 49/50 and 74/75', () => {
  for (const dimension of definition.dimensions) {
    const ranges = dimension.bands.map(b => [b.min,b.max]);
    assert.deepEqual(ranges, [[0,24],[25,49],[50,74],[75,100]]);
  }
});

test('public page contains no patient-facing result or WhatsApp workflow', () => {
  assert.doesNotMatch(html, /Calcular resultado/i);
  assert.doesNotMatch(html, /Compartilhar resumo.*WhatsApp/i);
  assert.doesNotMatch(html, /id="results"/i);
  assert.match(html, /Enviar respostas/i);
  assert.match(html, /aviso de privacidade/i);
});

test('frontend does not post directly to Google Forms or use no-cors', () => {
  assert.doesNotMatch(app, /formResponse|no-cors/i);
  assert.doesNotMatch(submission, /formResponse|no-cors/i);
  assert.match(submission, /icaps_submit/);
  assert.match(submission, /persisted/);
});
