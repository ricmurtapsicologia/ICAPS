import { renderQuestionnaire } from './render.js';
import { collectResponses, clearMissing, markMissing } from './validation.js';
import { submitToGoogleForm } from './google-form.js';

const form = document.getElementById('icaps-form');
const questionnaire = document.getElementById('questionnaire');
const resultsSection = document.getElementById('results');
const status = document.getElementById('form-status');
const calculateButton = document.getElementById('calculate');
const resetButton = document.getElementById('reset');

let definition;
let submissionInFlight = false;
let submitted = false;

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
  resultsSection.hidden = true;
}

calculateButton.addEventListener('click', async () => {
  if (submissionInFlight) return;
  if (submitted) {
    announce('Suas respostas já foram registradas e encaminhadas ao psicólogo responsável para análise.', 'success');
    return;
  }

  clearMissing(form);
  const name = document.getElementById('name');
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

  submissionInFlight = true;
  calculateButton.disabled = true;
  calculateButton.setAttribute('aria-busy', 'true');
  announce('Registrando suas respostas…', 'info');

  try {
    await submitToGoogleForm(definition, responses, {
      name: name.value,
      age: age.value
    });
    submitted = true;
    resultsSection.hidden = true;
    announce('Suas respostas foram registradas e encaminhadas ao psicólogo responsável para análise.', 'success');
  } catch (error) {
    console.error(error);
    announce('Não foi possível registrar as respostas. Verifique sua conexão e tente novamente.', 'error');
  } finally {
    submissionInFlight = false;
    calculateButton.disabled = false;
    calculateButton.removeAttribute('aria-busy');
  }
});

resetButton.addEventListener('click', () => {
  form.reset();
  document.getElementById('date').value = todayISO();
  clearMissing(form);
  resultsSection.hidden = true;
  submitted = false;
  submissionInFlight = false;
  calculateButton.disabled = false;
  calculateButton.removeAttribute('aria-busy');
  announce('Respostas limpas.', 'info');
  document.getElementById('intro-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
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
