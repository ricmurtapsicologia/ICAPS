export const SCORE_VERSION = '2.0.0';

export function parseLikert(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > 5) {
    throw new Error(`INVALID_LIKERT_VALUE:${String(value)}`);
  }
  return n;
}

export function itemScore(value, direction = 'aligned') {
  const normalized = (parseLikert(value) - 1) * 25;
  return direction === 'reverse' ? 100 - normalized : normalized;
}

export function getBand(dimension, score) {
  const band = dimension.bands.find(b => score >= b.min && score <= b.max);
  if (!band) throw new Error(`BAND_NOT_FOUND:${dimension.id}:${score}`);
  return band;
}

export function scoreDimension(dimension, responses) {
  const values = dimension.items.map(item => {
    if (!(item.id in responses)) throw new Error(`MISSING_RESPONSE:${item.id}`);
    return itemScore(responses[item.id], item.direction);
  });
  const score = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const protectiveScore = dimension.orientation === 'risk' ? 100 - score : score;
  return {
    id: dimension.id,
    title: dimension.title,
    scoreLabel: dimension.scoreLabel,
    orientation: dimension.orientation,
    score,
    protectiveScore,
    answered: values.length,
    band: getBand(dimension, score)
  };
}

export function scoreAssessment(definition, responses) {
  const expected = definition.dimensions.flatMap(d => d.items);
  if (expected.length !== definition.meta.itemCount) {
    throw new Error(`DEFINITION_ITEM_COUNT_MISMATCH:${expected.length}`);
  }
  const missing = expected.filter(item => !(item.id in responses)).map(item => item.id);
  if (missing.length) {
    const error = new Error(`MISSING_RESPONSES:${missing.length}`);
    error.missing = missing;
    throw error;
  }
  const dimensions = definition.dimensions.map(d => scoreDimension(d, responses));
  return {
    instrumentVersion: definition.meta.instrumentVersion,
    scoringVersion: definition.meta.scoringVersion,
    dimensions
  };
}
