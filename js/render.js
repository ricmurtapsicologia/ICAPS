function esc(value='') {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

export function renderQuestionnaire(host, definition) {
  host.innerHTML = definition.dimensions.map((dimension, index) => `
    <section class="dimension" aria-labelledby="${dimension.id}-title">
      <h2 id="${dimension.id}-title">Bloco ${index + 1} de ${definition.dimensions.length}</h2>
      <p class="scale-hint">1 Discordo totalmente · 2 Discordo parcialmente · 3 Nem concordo, nem discordo · 4 Concordo parcialmente · 5 Concordo totalmente</p>
      ${dimension.items.map(item => `
        <fieldset class="question" data-item-id="${item.id}" tabindex="-1">
          <legend><span class="question-number">${item.number}.</span> ${esc(item.text)}</legend>
          <div class="likert">
            ${definition.scale.map(opt => `
              <label class="likert-option">
                <input type="radio" name="${item.id}" value="${opt.value}" required>
                <span class="likert-number">${opt.value}</span>
                <span class="likert-label">${esc(opt.label)}</span>
              </label>
            `).join('')}
          </div>
        </fieldset>
      `).join('')}
    </section>
  `).join('');
}
