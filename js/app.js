import { scoreAssessment } from './scoring.js';
import { buildIntegratedSummary } from './interpretation.js';
import { renderQuestionnaire, renderResults } from './render.js';
import { collectResponses, clearMissing, markMissing } from './validation.js';
import { shareByWhatsApp } from './share.js';

const form = document.getElementById('icaps-form');
const questionnaire = document.getElementById('questionnaire');
const resultsSection = document.getElementById('results');
const resultsGrid = document.getElementById('results-grid');
const summary = document.getElementById('integrated-summary');
const status = document.getElementById('form-status');
const calculateButton = document.getElementById('calculate');
const resetButton = document.getElementById('reset');
const shareButton = document.getElementById('share');
const resultHeading = document.getElementById('results-title');

let definition;
let lastResult = null;

function announce(message, kind='info') {
  status.textContent = message;
  status.dataset.kind = kind;
}

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

async function init() {
  const response = await fetch('./data/icaps-v2.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`DEFINITION_LOAD_FAILED:${response.status}`);
  definition = await response.json();
  if (definition.meta.itemCount !== 60) throw new Error('DEFINITION_ITEM_COUNT_INVALID');
  renderQuestionnaire(questionnaire, definition);
  document.getElementById('date').value = todayISO();
  document.getElementById('year').textContent = String(new Date().getFullYear());
  document.getElementById('version').textContent = definition.meta.instrumentVersion;
}

calculateButton.addEventListener('click', () => {
  clearMissing(form);
  const age = document.getElementById('age');
  const date = document.getElementById('date');
  if ((age.value && !age.checkValidity()) || !date.checkValidity()) {
    announce('Revise os dados de identificação antes de calcular.', 'error');
    (age.value && !age.checkValidity() ? age : date).reportValidity();
    return;
  }
  const { responses, missing } = collectResponses(form, definition);
  if (missing.length) {
    markMissing(form, missing);
    announce(`Há ${missing.length} pergunta(s) sem resposta. Complete todas antes de calcular.`, 'error');
    const first = form.querySelector(`[data-item-id="${missing[0]}"]`);
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    first?.focus({ preventScroll: true });
    return;
  }

  try {
    const scored = scoreAssessment(definition, responses);
    lastResult = scored.dimensions;
    renderResults(resultsGrid, lastResult);
    summary.textContent = buildIntegratedSummary(lastResult);
    resultsSection.hidden = false;
    announce('Resultado calculado. A interpretação deve ser contextualizada clinicamente.', 'success');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.setTimeout(() => resultHeading.focus({ preventScroll: true }), 350);
  } catch (error) {
    console.error(error);
    announce('Não foi possível calcular o resultado. Revise as respostas e tente novamente.', 'error');
  }
});

resetButton.addEventListener('click', () => {
  form.reset();
  document.getElementById('date').value = todayISO();
  clearMissing(form);
  resultsSection.hidden = true;
  resultsGrid.innerHTML = '';
  summary.textContent = '';
  lastResult = null;
  announce('Respostas limpas.', 'info');
  document.getElementById('intro-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

shareButton.addEventListener('click', () => {
  if (!lastResult) {
    announce('Calcule o resultado antes de compartilhar.', 'error');
    return;
  }
  shareByWhatsApp(lastResult, definition.meta);
});

form.addEventListener('change', event => {
  if (!(event.target instanceof HTMLInputElement) || event.target.type !== 'radio') return;
  event.target.closest('.question')?.classList.remove('missing');
  event.target.closest('.question')?.removeAttribute('aria-invalid');
});

init().catch(error => {
  console.error(error);
  announce('Falha ao carregar o instrumento. Recarregue a página.', 'error');
  calculateButton.disabled = true;
});
