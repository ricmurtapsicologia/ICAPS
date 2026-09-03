import { renderQuestionnaire } from './render.js';
import { collectResponses, clearMissing, markMissing } from './validation.js';
import { submitAssessment } from './submission.js';

const form = document.getElementById('icaps-form');
const questionnaire = document.getElementById('questionnaire');
const status = document.getElementById('form-status');
const submitButton = document.getElementById('submit-assessment');
const resetButton = document.getElementById('reset');
const progress = document.getElementById('progress');
const progressText = document.getElementById('progress-text');
const patientCodeInput = document.getElementById('patient-code');

let definition;
let submissionInFlight = false;
let submitted = false;

function announce(message, kind='info') {
  status.textContent = message;
  status.dataset.kind = kind;
}

function readPatientCodeFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const raw = String(params.get('patient_code') || params.get('code') || '').trim();
  return /^[A-Za-z0-9._-]{1,64}$/.test(raw) ? raw : '';
}

function updateProgress() {
  if (!definition) return;
  const { responses } = collectResponses(form, definition);
  const answered = Object.keys(responses).length;
  progress.value = answered;
  progressText.textContent = `${answered} de 60 respondidas`;
  progress.textContent = `${answered} de 60`;
}

async function init() {
  const response = await fetch('./data/icaps-v2.json', { cache: 'no-store' });
  if (!response.ok) throw new Error(`DEFINITION_LOAD_FAILED:${response.status}`);
  definition = await response.json();
  if (definition.meta.itemCount !== 60) throw new Error('DEFINITION_ITEM_COUNT_INVALID');
  renderQuestionnaire(questionnaire, definition);
  patientCodeInput.value = readPatientCodeFromUrl();
  document.getElementById('year').textContent = String(new Date().getFullYear());
  document.getElementById('version').textContent = definition.meta.instrumentVersion;
  updateProgress();
}

form.addEventListener('submit', async event => {
  event.preventDefault();
  if (submissionInFlight) return;
  if (submitted) {
    announce('Suas respostas já foram registradas e encaminhadas ao psicólogo responsável para análise.', 'success');
    return;
  }

  clearMissing(form);
  const name = document.getElementById('name');
  const age = document.getElementById('age');
  const privacyAck = document.getElementById('privacy-ack');
  const website = document.getElementById('website');
  const patientCode = patientCodeInput.value;

  if (!patientCode && !name.value.trim()) {
    announce('Informe seu nome completo para identificar a avaliação.', 'error');
    name.focus();
    return;
  }

  if ((age.value && !age.checkValidity()) || !privacyAck.checkValidity()) {
    announce('Revise os dados de identificação e confirme a leitura do aviso de privacidade.', 'error');
    (age.value && !age.checkValidity() ? age : privacyAck).reportValidity();
    return;
  }

  const { responses, missing } = collectResponses(form, definition);
  if (missing.length) {
    markMissing(form, missing);
    announce(`Há ${missing.length} pergunta(s) sem resposta. Complete todas antes de enviar.`, 'error');
    const first = form.querySelector(`[data-item-id="${missing[0]}"]`);
    first?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    first?.focus({ preventScroll: true });
    return;
  }

  submissionInFlight = true;
  submitButton.disabled = true;
  submitButton.setAttribute('aria-busy', 'true');
  announce('Registrando suas respostas…', 'info');

  try {
    const confirmation = await submitAssessment(definition, responses, {
      patientCode,
      name: name.value,
      age: age.value,
      website: website.value
    });
    if (!confirmation?.persisted) throw new Error('PERSISTENCE_NOT_CONFIRMED');
    submitted = true;
    announce('Suas respostas foram registradas e encaminhadas ao psicólogo responsável para análise.', 'success');
  } catch (error) {
    console.error(error);
    announce('Não foi possível confirmar o registro das respostas. Verifique sua conexão e tente novamente.', 'error');
  } finally {
    submissionInFlight = false;
    submitButton.disabled = false;
    submitButton.removeAttribute('aria-busy');
  }
});

resetButton.addEventListener('click', () => {
  form.reset();
  patientCodeInput.value = readPatientCodeFromUrl();
  clearMissing(form);
  submitted = false;
  submissionInFlight = false;
  submitButton.disabled = false;
  submitButton.removeAttribute('aria-busy');
  updateProgress();
  announce('Respostas limpas.', 'info');
  document.getElementById('intro-title').scrollIntoView({ behavior: 'smooth', block: 'start' });
});

form.addEventListener('change', event => {
  if (event.target instanceof HTMLInputElement && event.target.type === 'radio') {
    event.target.closest('.question')?.classList.remove('missing');
    event.target.closest('.question')?.removeAttribute('aria-invalid');
    updateProgress();
  }
});

init().catch(error => {
  console.error(error);
  announce('Falha ao carregar o instrumento. Recarregue a página.', 'error');
  submitButton.disabled = true;
});
