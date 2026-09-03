const SUBMISSION_ENDPOINT = 'https://secretaria-digital-core.vercel.app/api/icaps_submit';

export async function submitAssessment(definition, responses, identity = {}) {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 15000);
  const payload = {
    instrumentVersion: definition.meta.instrumentVersion,
    scoringVersion: definition.meta.scoringVersion,
    interpretationVersion: definition.meta.interpretationVersion,
    patientCode: String(identity.patientCode || '').trim(),
    name: String(identity.name || '').trim(),
    age: String(identity.age || '').trim(),
    responses,
    submittedAtClient: new Date().toISOString()
  };

  try {
    const response = await fetch(SUBMISSION_ENDPOINT, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    let data = null;
    try {
      data = await response.json();
    } catch (_) {}

    if (!response.ok || !data?.ok || data?.persisted !== true) {
      const code = data?.error || `HTTP_${response.status}`;
      throw new Error(`SUBMISSION_NOT_CONFIRMED:${code}`);
    }

    return {
      persisted: true,
      receivedAt: data.receivedAt || null
    };
  } finally {
    window.clearTimeout(timeout);
  }
}
