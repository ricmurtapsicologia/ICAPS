import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { scoreAssessment } from '../js/scoring.js';

const definition = JSON.parse(await fs.readFile(new URL('../data/icaps-v2.json', import.meta.url), 'utf8'));
const items = definition.dimensions.flatMap(d => d.items);

let seed = 0x51ca2e11;
function rnd() {
  seed ^= seed << 13;
  seed ^= seed >>> 17;
  seed ^= seed << 5;
  return (seed >>> 0) / 4294967296;
}
function randomLikert() {
  return 1 + Math.floor(rnd() * 5);
}
function profile() {
  return Object.fromEntries(items.map(item => [item.id, randomLikert()]));
}

test('Monte Carlo: scores remain bounded and deterministic across 50000 profiles', () => {
  for (let i = 0; i < 50000; i++) {
    const r = profile();
    const a = scoreAssessment(definition, r);
    const b = scoreAssessment(definition, r);
    assert.deepEqual(a, b);
    for (const d of a.dimensions) {
      assert.ok(Number.isInteger(d.score));
      assert.ok(d.score >= 0 && d.score <= 100);
      assert.ok(d.protectiveScore >= 0 && d.protectiveScore <= 100);
      assert.ok(d.band && typeof d.band.label === 'string');
    }
  }
});

test('Monte Carlo: increasing one aligned response never decreases its construct score', () => {
  for (let i = 0; i < 20000; i++) {
    const r = profile();
    const item = items[Math.floor(rnd() * items.length)];
    if (r[item.id] >= 5) continue;
    const before = scoreAssessment(definition, r).dimensions.find(d => item.id.startsWith(d.id));
    const changed = { ...r, [item.id]: r[item.id] + 1 };
    const after = scoreAssessment(definition, changed).dimensions.find(d => item.id.startsWith(d.id));
    assert.ok(after.score >= before.score, `${item.id}: ${before.score} -> ${after.score}`);
  }
});
