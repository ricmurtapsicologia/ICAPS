export function collectResponses(form, definition) {
  const responses = {};
  const missing = [];
  for (const dimension of definition.dimensions) {
    for (const item of dimension.items) {
      const selected = form.querySelector(`input[name="${item.id}"]:checked`);
      if (!selected) missing.push(item.id);
      else responses[item.id] = Number(selected.value);
    }
  }
  return { responses, missing };
}

export function clearMissing(form) {
  form.querySelectorAll('.question.missing').forEach(el => {
    el.classList.remove('missing');
    el.removeAttribute('aria-invalid');
  });
}

export function markMissing(form, missing) {
  clearMissing(form);
  for (const id of missing) {
    const fieldset = form.querySelector(`[data-item-id="${id}"]`);
    if (fieldset) {
      fieldset.classList.add('missing');
      fieldset.setAttribute('aria-invalid', 'true');
    }
  }
}
