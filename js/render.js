function esc(value='') {
  return String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

export function renderQuestionnaire(host, definition) {
  host.innerHTML = definition.dimensions.map(dimension => `
    <section class="dimension" aria-labelledby="${dimension.id}-title">
      <h2 id="${dimension.id}-title">${esc(dimension.title)}</h2>
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

function tone(result) {
  if (result.orientation === 'positive') {
    if (result.score >= 75) return 'good';
    if (result.score >= 50) return 'mid';
    if (result.score >= 25) return 'warn';
    return 'bad';
  }
  if (result.score >= 75) return 'bad';
  if (result.score >= 50) return 'warn';
  if (result.score >= 25) return 'mid';
  return 'good';
}

export function renderResults(host, results) {
  host.innerHTML = results.map(result => `
    <article class="result-card">
      <div class="result-head">
        <div>
          <h3>${esc(result.title)}</h3>
          <p class="result-score">${esc(result.scoreLabel)}: <strong>${result.score}/100</strong> · ${esc(result.band.label)}</p>
        </div>
        <div class="meter ${tone(result)}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${result.score}" aria-label="${esc(result.scoreLabel)} ${result.score} de 100">
          <span style="width:${result.score}%"></span>
        </div>
      </div>
      <p>${esc(result.band.text)}</p>
    </article>
  `).join('');
}
