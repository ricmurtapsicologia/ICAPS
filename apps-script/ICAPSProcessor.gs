/**
 * ICAPS 2.1 — Processador pós-envio + relatório clínico HTML
 *
 * Instalação: vincule este código ao Google Sheets de respostas do ICAPS e
 * execute installICAPSProcessor() uma única vez.
 */

const ICAPS_PROCESSOR = Object.freeze({
  VERSION: '2.1.0',
  INSTRUMENT_VERSION: '2.0.0',
  SCORING_VERSION: '2.0.0',
  RESPONSE_SHEET: 'Form Responses 1',
  SYNC_SHEET: 'ICAPS_SYNC',
  REPORT_SHEET: 'ICAPS_REPORTS',
  HANDLER: 'icapsOnFormSubmit',
  PROP_SHEET_ID: 'ICAPS_RESPONSE_SHEET_ID',
  PROP_RECIPIENT: 'ICAPS_REPORT_RECIPIENT',
  TZ: 'America/Sao_Paulo'
});

const ICAPS_DIMENSIONS = Object.freeze({
  D1: {
    title: 'Satisfação Conjugal Atual',
    scoreLabel: 'Satisfação conjugal',
    orientation: 'positive',
    bands: [
      [0,24,'Muito baixa','O padrão de respostas sugere satisfação conjugal muito reduzida. Pode ser útil explorar fontes de desgaste, necessidades não atendidas, qualidade da comunicação e condições de segurança emocional.'],
      [25,49,'Baixa','As respostas sugerem satisfação conjugal reduzida, com presença relevante de frustração ou desconexão. Pode ser útil investigar o que ainda funciona e o que vem sustentando o sofrimento relacional.'],
      [50,74,'Moderada','As respostas sugerem uma base relacional parcialmente preservada, coexistindo com aspectos que merecem atenção. A análise clínica pode diferenciar recursos do vínculo de pontos de desgaste.'],
      [75,100,'Elevada','As respostas sugerem percepção globalmente positiva de afeto, respeito, parceria e convivência. Eventuais dificuldades devem ser contextualizadas sem inferir, isoladamente, ausência de problemas relevantes.']
    ]
  },
  D2: {
    title: 'Ambivalência Decisional',
    scoreLabel: 'Ambivalência decisional',
    orientation: 'risk',
    bands: [
      [0,24,'Baixa','O padrão de respostas sugere pouca oscilação decisional no momento. Isso indica maior consistência subjetiva, sem determinar qual decisão relacional deve ser tomada.'],
      [25,49,'Moderada','As respostas sugerem alguma ambivalência entre permanecer, transformar ou encerrar a relação. Pode ser útil explorar valores, receios e cenários futuros.'],
      [50,74,'Elevada','As respostas sugerem ambivalência decisional importante, com oscilações ou adiamentos relevantes. A análise clínica pode ajudar a distinguir medo, esperança, exaustão e fatores contextuais.'],
      [75,100,'Muito elevada','O padrão sugere ambivalência muito elevada e possível dificuldade de consolidação de uma direção decisional. Recomenda-se explorar o processo com tempo, contexto e apoio clínico, evitando conclusões automáticas.']
    ]
  },
  D3: {
    title: 'Codependência e Subjugação Pessoal',
    scoreLabel: 'Indicadores de codependência/subjugação',
    orientation: 'risk',
    bands: [
      [0,24,'Poucos indicadores','Há poucos indicadores autorreferidos de subjugação, fusão ou dependência relacional nesta dimensão. Isso não exclui outros padrões que possam aparecer em contexto clínico.'],
      [25,49,'Alguns indicadores','As respostas mostram alguns indicadores de dificuldade de limites, culpa, medo de rejeição ou centralidade excessiva da relação. Pode ser útil examinar autonomia e assertividade.'],
      [50,74,'Indicadores importantes','O padrão sugere indicadores importantes de subjugação ou dependência relacional. A análise clínica pode explorar limites, autocuidado, responsabilidade excessiva pelo outro e preservação da identidade.'],
      [75,100,'Muitos indicadores','As respostas concentram muitos indicadores de subjugação, medo de perda ou anulação pessoal. O resultado não estabelece diagnóstico ou abuso, mas sinaliza prioridade para exploração clínica de autonomia, limites e segurança.']
    ]
  },
  D4: {
    title: 'Traição e Impacto Emocional',
    scoreLabel: 'Impacto emocional associado à traição',
    orientation: 'risk',
    bands: [
      [0,24,'Reduzido','As respostas sugerem impacto emocional atualmente reduzido dos eventos de traição contemplados pelos itens. Isso não permite concluir, isoladamente, que o tema esteja totalmente elaborado.'],
      [25,49,'Moderado','O padrão sugere impacto emocional moderado, com alguns efeitos ainda presentes sobre confiança, autoestima ou lembranças. Pode ser útil investigar o significado atual dessas experiências.'],
      [50,74,'Elevado','As respostas sugerem impacto emocional elevado relacionado às experiências de traição, com repercussões relevantes em confiança, autoestima ou regulação emocional.'],
      [75,100,'Muito elevado','O padrão sugere impacto emocional muito elevado associado às experiências de traição. Recomenda-se exploração clínica cuidadosa de sofrimento, segurança emocional, significado das experiências e recursos de enfrentamento.']
    ]
  },
  D5: {
    title: 'Rede de Apoio e Medos Contextuais',
    scoreLabel: 'Interferência de medos e fatores contextuais',
    orientation: 'risk',
    bands: [
      [0,24,'Baixa interferência','As respostas sugerem baixa interferência atual de medos sociais, financeiros ou contextuais na decisão relacional, com maior percepção de apoio ou possibilidade de ação.'],
      [25,49,'Interferência moderada','Há interferência moderada de fatores externos, como julgamento, família, finanças, solidão ou filhos. Pode ser útil mapear recursos e vulnerabilidades concretas.'],
      [50,74,'Interferência elevada','O padrão sugere interferência elevada de fatores contextuais e medos na capacidade de decidir ou agir. A análise clínica pode incluir rede de apoio, autonomia prática e planejamento.'],
      [75,100,'Interferência muito elevada','As respostas sugerem forte influência de fatores sociais, familiares, financeiros ou de medo sobre o processo decisional. Pode ser prioritário mapear suporte, recursos concretos e condições de segurança antes de decisões importantes.']
    ]
  },
  D6: {
    title: 'Recursos Internos e Prontidão para a Mudança',
    scoreLabel: 'Recursos internos',
    orientation: 'positive',
    bands: [
      [0,24,'Frágeis','As respostas sugerem percepção atual de recursos internos frágeis para sustentar mudanças ou decisões difíceis. Pode ser útil priorizar estabilização, autocuidado, clareza e apoio.'],
      [25,49,'Emergentes','O padrão sugere recursos internos em desenvolvimento. Há sinais de fortalecimento, embora ainda possam existir dúvidas sobre capacidade de enfrentar consequências e mudanças.'],
      [50,74,'Consolidados','As respostas sugerem recursos internos relativamente consolidados para reflexão e enfrentamento. A análise clínica pode apoiar o uso desses recursos de forma alinhada a valores e contexto.'],
      [75,100,'Elevados','As respostas sugerem percepção elevada de recursos internos para sustentar reflexão, autocuidado e mudanças. Isso não define qual decisão deve ser tomada, mas indica maior repertório subjetivo para lidar com suas consequências.']
    ]
  }
});

function installICAPSProcessor() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Abra a planilha de respostas do ICAPS antes de executar a instalação.');
  const recipient = Session.getEffectiveUser().getEmail();
  if (!recipient) throw new Error('Não foi possível identificar o e-mail da conta que está instalando o gatilho.');
  ensureICAPSSheets_(ss);
  PropertiesService.getScriptProperties().setProperties({
    [ICAPS_PROCESSOR.PROP_SHEET_ID]: ss.getId(),
    [ICAPS_PROCESSOR.PROP_RECIPIENT]: recipient
  });
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === ICAPS_PROCESSOR.HANDLER)
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger(ICAPS_PROCESSOR.HANDLER).forSpreadsheet(ss).onFormSubmit().create();
  backfillICAPSPending();
  return { ok: true, spreadsheetId: ss.getId(), recipient, processorVersion: ICAPS_PROCESSOR.VERSION };
}

function removeICAPSProcessorTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === ICAPS_PROCESSOR.HANDLER)
    .forEach(t => ScriptApp.deleteTrigger(t));
}

function icapsOnFormSubmit(e) {
  if (!e || !e.range) throw new Error('Evento onFormSubmit inválido.');
  const rowNumber = e.range.getRow();
  if (rowNumber >= 2) processICAPSRow_(rowNumber);
}

function backfillICAPSPending() {
  const ss = getICAPSSpreadsheet_();
  ensureICAPSSheets_(ss);
  const responseSheet = requireICAPSSheet_(ss, ICAPS_PROCESSOR.RESPONSE_SHEET);
  for (let row = 2; row <= responseSheet.getLastRow(); row++) {
    if (!isICAPSSent_(ss, row)) processICAPSRow_(row);
  }
}

function processICAPSRow_(rowNumber) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(10000)) return;
  try {
    const ss = getICAPSSpreadsheet_();
    ensureICAPSSheets_(ss);
    if (isICAPSSent_(ss, rowNumber)) return;

    const responseSheet = requireICAPSSheet_(ss, ICAPS_PROCESSOR.RESPONSE_SHEET);
    const lastColumn = responseSheet.getLastColumn();
    const headers = responseSheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    const row = responseSheet.getRange(rowNumber, 1, 1, lastColumn).getValues()[0];
    const headerMap = headerMapICAPS_(headers);

    const timestamp = row[requireHeaderICAPS_(headerMap, 'Timestamp')];
    const patientName = String(row[requireHeaderICAPS_(headerMap, 'Nome completo')] || 'Não informado').trim();
    const patientCode = String(row[requireHeaderICAPS_(headerMap, 'Código do paciente (se informado pelo psicólogo)')] || '').trim();
    const age = row[requireHeaderICAPS_(headerMap, 'Idade')];

    const questionColumns = headers
      .map((header, index) => {
        const match = String(header || '').match(/^(\d+)\./);
        return match ? { number: Number(match[1]), index, text: String(header).replace(/^\d+\.\s*/, '') } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.number - b.number);

    if (questionColumns.length !== 60) throw new Error(`Esperadas 60 perguntas; encontradas ${questionColumns.length}.`);

    const answers = questionColumns.map(q => {
      const value = Number(row[q.index]);
      if (![1,2,3,4,5].includes(value)) throw new Error(`Resposta inválida na pergunta ${q.number}.`);
      return value;
    });

    const results = calculateICAPSResults_(answers);
    const analysis = buildICAPSClinicalAnalysis_(results, answers, questionColumns);
    const assessmentId = assessmentIdICAPS_(timestamp, rowNumber);
    const rowHash = rowHashICAPS_(row);

    upsertICAPSReport_(ss, { assessmentId, patientCode, patientName, age, timestamp, results });

    const recipient = PropertiesService.getScriptProperties().getProperty(ICAPS_PROCESSOR.PROP_RECIPIENT);
    if (!recipient) throw new Error('Destinatário do relatório não configurado. Execute installICAPSProcessor().');

    sendICAPSReport_(recipient, {
      assessmentId, patientCode, patientName, age, timestamp, results, analysis,
      answers, questions: questionColumns, spreadsheetUrl: ss.getUrl()
    });

    upsertICAPSSync_(ss, rowNumber, {
      assessmentId, rowHash, patientCode, patientName, receivedAt: timestamp,
      scoredAt: new Date(), emailStatus: 'SENT', emailSentAt: new Date(), lastError: ''
    });
  } catch (error) {
    try {
      const ss = getICAPSSpreadsheet_();
      upsertICAPSSync_(ss, rowNumber, {
        assessmentId: '', rowHash: '', patientCode: '', patientName: '', receivedAt: '',
        scoredAt: new Date(), emailStatus: 'ERROR', emailSentAt: '',
        lastError: String(error && error.message ? error.message : error)
      });
    } catch (_) {}
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function calculateICAPSResults_(answers) {
  const results = {};
  for (let d = 1; d <= 6; d++) {
    const key = `D${d}`;
    const block = answers.slice((d - 1) * 10, d * 10);
    const score = Math.round(block.reduce((sum, value) => sum + ((value - 1) * 25), 0) / block.length);
    const band = bandICAPS_(key, score);
    results[key] = {
      score,
      band: band.label,
      interpretation: band.text,
      title: ICAPS_DIMENSIONS[key].title,
      scoreLabel: ICAPS_DIMENSIONS[key].scoreLabel,
      orientation: ICAPS_DIMENSIONS[key].orientation
    };
  }
  return results;
}

function buildICAPSClinicalAnalysis_(r, answers, questions) {
  const summary = buildICAPSSummary_(r);
  const priorities = [];
  if (r.D2.score >= 50) priorities.push('Explorar o conflito decisional: o que sustenta a permanência, o que impulsiona mudança e quais medos dificultam uma direção mais estável.');
  if (r.D3.score >= 50) priorities.push('Avaliar autonomia, limites, culpa, medo de rejeição, responsabilidade excessiva pelo outro e preservação da identidade.');
  if (r.D4.score >= 50) priorities.push('Investigar repercussões atuais das experiências de traição sobre confiança, autoestima, raiva, tristeza e segurança emocional.');
  if (r.D5.score >= 50) priorities.push('Mapear rede de apoio, condições financeiras, filhos, julgamento social e outros fatores concretos que possam restringir escolhas.');
  if (r.D6.score <= 49) priorities.push('Fortalecer recursos internos antes de decisões de alto impacto: autorregulação, clareza, autocuidado, suporte e capacidade percebida de enfrentamento.');
  if (r.D1.score <= 49) priorities.push('Diferenciar desgaste relacional global de problemas localizados e identificar necessidades afetivas, comunicacionais e de parceria não atendidas.');
  if (!priorities.length) priorities.push('Explorar os resultados em conjunto com a história do relacionamento, o contexto atual e os objetivos terapêuticos do paciente.');

  const tensions = [];
  if (r.D1.score <= 49 && r.D6.score >= 50) tensions.push('Satisfação conjugal reduzida coexistindo com recursos internos relativamente consolidados. Isso pode permitir explorar a decisão a partir de valores e necessidades, e não apenas de incapacidade percebida para lidar com consequências.');
  if (r.D2.score >= 50 && r.D6.score >= 50) tensions.push('Ambivalência elevada apesar de recursos internos preservados. Vale investigar se o impasse decorre mais de conflito de valores, esperança, vínculos e perdas antecipadas do que de ausência de recursos pessoais.');
  if (r.D3.score >= 50 && r.D5.score < 50) tensions.push('Indicadores de subjugação/codependência elevados com interferência contextual não tão intensa. Pode ser útil examinar mecanismos relacionais e intrapsíquicos, sem pressupor que fatores externos sejam a principal barreira.');
  if (r.D4.score >= 50 && r.D1.score >= 50) tensions.push('Impacto emocional relevante da traição coexistindo com satisfação relacional parcialmente preservada. A coexistência de vínculo e ferida merece ser explorada sem simplificação binária.');
  if (r.D5.score >= 50 && r.D6.score <= 49) tensions.push('Fatores contextuais relevantes combinados a recursos internos frágeis/emergentes sugerem priorizar estabilização e suporte prático antes de decisões de grande impacto.');
  if (!tensions.length) tensions.push('Não foi identificada uma tensão dimensional automática de alta saliência. A integração deve se apoiar principalmente na entrevista clínica e na história longitudinal.');

  const riskItems = [];
  const protectiveItems = [];
  for (let i = 0; i < answers.length; i++) {
    const dimension = Math.floor(i / 10) + 1;
    const item = { number: questions[i].number, text: questions[i].text, value: answers[i], dimension: `D${dimension}` };
    if (dimension >= 2 && dimension <= 5 && answers[i] >= 4) riskItems.push(item);
    if ((dimension === 1 || dimension === 6) && answers[i] <= 2) riskItems.push(item);
    if ((dimension === 1 || dimension === 6) && answers[i] >= 4) protectiveItems.push(item);
  }

  riskItems.sort((a,b) => b.value - a.value || a.number - b.number);
  protectiveItems.sort((a,b) => b.value - a.value || a.number - b.number);

  return {
    summary,
    priorities: priorities.slice(0, 6),
    tensions: tensions.slice(0, 5),
    riskItems: riskItems.slice(0, 10),
    protectiveItems: protectiveItems.slice(0, 8)
  };
}

function sendICAPSReport_(recipient, data) {
  const when = formatICAPSDate_(data.timestamp);
  const subject = `ICAPS 2.0 — Relatório clínico — ${data.patientName} — ${when}`;
  const r = data.results;

  const plain = [
    'ICAPS — RELATÓRIO CLÍNICO ESTRUTURADO',
    `Paciente: ${data.patientName}`,
    `Código: ${data.patientCode || 'não informado'}`,
    `Idade: ${data.age || 'não informada'}`,
    `Submetido em: ${when}`,
    '',
    'SÍNTESE INTEGRADA',
    data.analysis.summary,
    '',
    'PRIORIDADES PARA EXPLORAÇÃO CLÍNICA',
    ...data.analysis.priorities.map((x,i) => `${i+1}. ${x}`),
    '',
    'RESULTADOS POR DIMENSÃO',
    ...Object.keys(ICAPS_DIMENSIONS).map(key => `${key} — ${r[key].title}: ${r[key].score}/100 — ${r[key].band}`),
    '',
    'Nota metodológica: instrumento clínico estruturado de apoio. Não constitui teste psicológico diagnóstico e não deve determinar isoladamente continuidade ou término da relação.'
  ].join('\n');

  MailApp.sendEmail({
    to: recipient,
    subject,
    body: plain,
    htmlBody: buildICAPSReportHtml_(data),
    name: 'ICAPS 2.0'
  });
}

function buildICAPSReportHtml_(data) {
  const e = escapeICAPSHtml_;
  const r = data.results;
  const when = formatICAPSDate_(data.timestamp);
  const dimensionRows = Object.keys(ICAPS_DIMENSIONS).map(key => {
    const d = r[key];
    const barColor = d.orientation === 'positive' ? '#166534' : '#92400e';
    return `<tr>
      <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top"><strong>${e(key)} — ${e(d.title)}</strong><div style="font-size:12px;color:#6b7280;margin-top:3px">${e(d.scoreLabel)}</div></td>
      <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;width:105px;vertical-align:top"><strong>${d.score}/100</strong><div style="height:7px;background:#e5e7eb;border-radius:99px;margin-top:7px;overflow:hidden"><div style="height:7px;width:${d.score}%;background:${barColor}"></div></div></td>
      <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;width:150px;vertical-align:top"><strong>${e(d.band)}</strong></td>
      <td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;color:#374151;vertical-align:top">${e(d.interpretation)}</td>
    </tr>`;
  }).join('');

  const priorities = data.analysis.priorities.map(x => `<li style="margin:0 0 8px">${e(x)}</li>`).join('');
  const tensions = data.analysis.tensions.map(x => `<li style="margin:0 0 8px">${e(x)}</li>`).join('');
  const riskItems = data.analysis.riskItems.length
    ? data.analysis.riskItems.map(x => `<tr><td style="padding:7px 8px;border-bottom:1px solid #f3f4f6">${x.number}</td><td style="padding:7px 8px;border-bottom:1px solid #f3f4f6">${e(x.text)}</td><td style="padding:7px 8px;border-bottom:1px solid #f3f4f6"><strong>${x.value}/5</strong></td></tr>`).join('')
    : '<tr><td colspan="3" style="padding:8px;color:#6b7280">Nenhum item sentinela automático adicional.</td></tr>';
  const protectiveItems = data.analysis.protectiveItems.length
    ? data.analysis.protectiveItems.map(x => `<tr><td style="padding:7px 8px;border-bottom:1px solid #f3f4f6">${x.number}</td><td style="padding:7px 8px;border-bottom:1px solid #f3f4f6">${e(x.text)}</td><td style="padding:7px 8px;border-bottom:1px solid #f3f4f6"><strong>${x.value}/5</strong></td></tr>`).join('')
    : '<tr><td colspan="3" style="padding:8px;color:#6b7280">Nenhum marcador protetivo automático adicional.</td></tr>';

  const responseRows = data.questions.map((q, i) => {
    const dim = `D${Math.floor(i / 10) + 1}`;
    const bg = i % 2 ? '#ffffff' : '#f9fafb';
    return `<tr style="background:${bg}"><td style="padding:7px 8px;border-bottom:1px solid #eef2f7;color:#6b7280">${e(dim)}</td><td style="padding:7px 8px;border-bottom:1px solid #eef2f7">${q.number}. ${e(q.text)}</td><td style="padding:7px 8px;border-bottom:1px solid #eef2f7;text-align:center"><strong>${data.answers[i]}/5</strong></td></tr>`;
  }).join('');

  return `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827">
  <div style="max-width:920px;margin:0 auto;padding:24px 12px">
    <div style="background:#ffffff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden">
      <div style="background:#111827;color:#ffffff;padding:24px">
        <div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#cbd5e1">ICAPS 2.0</div>
        <h1 style="font-size:23px;line-height:1.25;margin:7px 0 5px">Relatório clínico estruturado</h1>
        <div style="font-size:14px;color:#d1d5db">Inventário Clínico para Avaliação de Prontidão para Separação</div>
      </div>

      <div style="padding:20px 24px;border-bottom:1px solid #e5e7eb">
        <table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px"><tr>
          <td style="padding:3px 20px 3px 0"><strong>Paciente</strong><br>${e(data.patientName)}</td>
          <td style="padding:3px 20px 3px 0"><strong>Idade</strong><br>${e(data.age || 'não informada')}</td>
          <td style="padding:3px 20px 3px 0"><strong>Data</strong><br>${e(when)}</td>
          <td style="padding:3px 0"><strong>Código</strong><br>${e(data.patientCode || 'não informado')}</td>
        </tr></table>
        <div style="font-size:11px;color:#6b7280;margin-top:10px">Assessment ID: ${e(data.assessmentId)} · Instrumento ${e(ICAPS_PROCESSOR.INSTRUMENT_VERSION)} · Scoring ${e(ICAPS_PROCESSOR.SCORING_VERSION)}</div>
      </div>

      <div style="padding:22px 24px;background:#f8fafc;border-bottom:1px solid #e5e7eb">
        <div style="font-size:12px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:#475569">Visão executiva</div>
        <p style="font-size:15px;line-height:1.6;margin:8px 0 0">${e(data.analysis.summary)}</p>
      </div>

      <div style="padding:22px 24px;border-bottom:1px solid #e5e7eb">
        <h2 style="font-size:17px;margin:0 0 12px">Perfil dimensional</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px"><tbody>${dimensionRows}</tbody></table>
      </div>

      <div style="padding:22px 24px;border-bottom:1px solid #e5e7eb">
        <h2 style="font-size:17px;margin:0 0 8px">Prioridades para exploração clínica</h2>
        <ol style="padding-left:21px;margin:0;line-height:1.5">${priorities}</ol>
      </div>

      <div style="padding:22px 24px;border-bottom:1px solid #e5e7eb;background:#fffbeb">
        <h2 style="font-size:17px;margin:0 0 8px">Integração entre dimensões</h2>
        <ul style="padding-left:20px;margin:0;line-height:1.5">${tensions}</ul>
      </div>

      <div style="padding:22px 24px;border-bottom:1px solid #e5e7eb">
        <h2 style="font-size:17px;margin:0 0 12px">Itens sentinela para revisar em sessão</h2>
        <div style="font-size:12px;color:#6b7280;margin-bottom:10px">Itens automaticamente destacados por intensidade de resposta. Não equivalem a diagnóstico ou confirmação factual isolada.</div>
        <table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#fef2f2"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:left">Conteúdo</th><th style="padding:8px;text-align:left">Resposta</th></tr></thead><tbody>${riskItems}</tbody></table>
      </div>

      <div style="padding:22px 24px;border-bottom:1px solid #e5e7eb">
        <h2 style="font-size:17px;margin:0 0 12px">Recursos/proteções autorreferidos</h2>
        <table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f0fdf4"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:left">Conteúdo</th><th style="padding:8px;text-align:left">Resposta</th></tr></thead><tbody>${protectiveItems}</tbody></table>
      </div>

      <div style="padding:22px 24px;border-bottom:1px solid #e5e7eb">
        <h2 style="font-size:17px;margin:0 0 12px">Respostas completas</h2>
        <table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#e5e7eb"><th style="padding:8px;text-align:left">Dim.</th><th style="padding:8px;text-align:left">Afirmação</th><th style="padding:8px;text-align:center">Resposta</th></tr></thead><tbody>${responseRows}</tbody></table>
      </div>

      <div style="padding:18px 24px;background:#f9fafb;font-size:11px;line-height:1.55;color:#6b7280">
        <strong>Nota metodológica.</strong> O ICAPS é um instrumento clínico estruturado de apoio à avaliação. Não constitui teste psicológico diagnóstico, não confirma isoladamente abuso, toxicidade, prognóstico ou condição psicopatológica e não deve determinar sozinho continuidade ou término da relação. A interpretação final depende da entrevista, história, contexto, segurança e julgamento profissional.
        <div style="margin-top:8px"><a href="${e(data.spreadsheetUrl)}" style="color:#1d4ed8">Abrir planilha de origem</a></div>
      </div>
    </div>
  </div></body></html>`;
}

function buildICAPSSummary_(r) {
  const priorities = [];
  if (r.D2.score >= 50) priorities.push('processo decisional e fatores que mantêm a ambivalência');
  if (r.D3.score >= 50) priorities.push('autonomia, limites e preservação da identidade');
  if (r.D4.score >= 50) priorities.push('impacto emocional das experiências de traição');
  if (r.D5.score >= 50) priorities.push('rede de apoio, medos e condições práticas');
  if (r.D6.score <= 49) priorities.push('fortalecimento de recursos internos e capacidade de enfrentamento');
  if (r.D1.score <= 49) priorities.push('fontes de desgaste e necessidades relacionais não atendidas');
  const base = `O perfil apresenta satisfação conjugal ${r.D1.band.toLowerCase()}, ambivalência decisional ${r.D2.band.toLowerCase()}, ${r.D3.band.toLowerCase()} de codependência/subjugação, impacto da traição ${r.D4.band.toLowerCase()}, ${r.D5.band.toLowerCase()} de fatores contextuais e recursos internos ${r.D6.band.toLowerCase()}.`;
  const tail = priorities.length ? ` Como material de apoio clínico, merece exploração prioritária: ${priorities.join('; ')}.` : '';
  return `${base}${tail} Este resultado não estabelece diagnóstico nem determina uma decisão conjugal.`;
}

function bandICAPS_(dimension, score) {
  const band = ICAPS_DIMENSIONS[dimension].bands.find(([min,max]) => score >= min && score <= max);
  if (!band) throw new Error(`Faixa não encontrada para ${dimension}: ${score}`);
  return { label: band[2], text: band[3] };
}

function ensureICAPSSheets_(ss) {
  let sync = ss.getSheetByName(ICAPS_PROCESSOR.SYNC_SHEET);
  if (!sync) sync = ss.insertSheet(ICAPS_PROCESSOR.SYNC_SHEET);
  if (sync.getLastRow() === 0) sync.appendRow(['source_row','assessment_id','row_hash','patient_code','patient_name','received_at','scored_at','email_status','email_sent_at','platform_status','platform_saved_at','last_error']);
  sync.hideSheet();
  let report = ss.getSheetByName(ICAPS_PROCESSOR.REPORT_SHEET);
  if (!report) report = ss.insertSheet(ICAPS_PROCESSOR.REPORT_SHEET);
  if (report.getLastRow() === 0) report.appendRow(['assessment_id','patient_code','patient_name','age','response_timestamp','instrument_version','scoring_version','D1_score','D1_band','D2_score','D2_band','D3_score','D3_band','D4_score','D4_band','D5_score','D5_band','D6_score','D6_band']);
  report.hideSheet();
}

function upsertICAPSReport_(ss, data) {
  const sh = requireICAPSSheet_(ss, ICAPS_PROCESSOR.REPORT_SHEET);
  if (findICAPSRowByValue_(sh, 1, data.assessmentId)) return;
  const r = data.results;
  sh.appendRow([data.assessmentId,data.patientCode,data.patientName,data.age,data.timestamp,ICAPS_PROCESSOR.INSTRUMENT_VERSION,ICAPS_PROCESSOR.SCORING_VERSION,r.D1.score,r.D1.band,r.D2.score,r.D2.band,r.D3.score,r.D3.band,r.D4.score,r.D4.band,r.D5.score,r.D5.band,r.D6.score,r.D6.band]);
}

function upsertICAPSSync_(ss, sourceRow, data) {
  const sh = requireICAPSSheet_(ss, ICAPS_PROCESSOR.SYNC_SHEET);
  let row = findICAPSRowByValue_(sh, 1, sourceRow);
  const values = [[sourceRow,data.assessmentId||'',data.rowHash||'',data.patientCode||'',data.patientName||'',data.receivedAt||'',data.scoredAt||'',data.emailStatus||'',data.emailSentAt||'','','',data.lastError||'']];
  if (!row) row = sh.getLastRow() + 1;
  sh.getRange(row, 1, 1, 12).setValues(values);
}

function isICAPSSent_(ss, sourceRow) {
  const sh = requireICAPSSheet_(ss, ICAPS_PROCESSOR.SYNC_SHEET);
  const row = findICAPSRowByValue_(sh, 1, sourceRow);
  return !!row && String(sh.getRange(row, 8).getValue()).toUpperCase() === 'SENT';
}

function findICAPSRowByValue_(sheet, column, value) {
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const values = sheet.getRange(2, column, lastRow - 1, 1).getValues();
  for (let i = 0; i < values.length; i++) if (String(values[i][0]) === String(value)) return i + 2;
  return 0;
}

function getICAPSSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty(ICAPS_PROCESSOR.PROP_SHEET_ID);
  if (id) return SpreadsheetApp.openById(id);
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Planilha do ICAPS não configurada. Execute installICAPSProcessor().');
  return active;
}

function requireICAPSSheet_(ss, name) {
  const sh = ss.getSheetByName(name);
  if (!sh) throw new Error(`Aba obrigatória ausente: ${name}`);
  return sh;
}

function headerMapICAPS_(headers) {
  const map = {};
  headers.forEach((header,index) => { if (String(header || '').trim()) map[String(header).trim()] = index; });
  return map;
}

function requireHeaderICAPS_(map, name) {
  if (map[name] === undefined) throw new Error(`Cabeçalho obrigatório ausente: ${name}`);
  return map[name];
}

function assessmentIdICAPS_(timestamp, rowNumber) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const stamp = isNaN(date.getTime()) ? `ROW${rowNumber}` : Utilities.formatDate(date, ICAPS_PROCESSOR.TZ, 'yyyyMMdd-HHmmss');
  return `ICAPS-${stamp}-R${rowNumber}`;
}

function rowHashICAPS_(row) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(row));
  return bytes.map(b => (b + 256) % 256).map(b => b.toString(16).padStart(2,'0')).join('');
}

function formatICAPSDate_(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return String(timestamp || 'data não informada');
  return Utilities.formatDate(date, ICAPS_PROCESSOR.TZ, 'dd/MM/yyyy HH:mm');
}

function escapeICAPSHtml_(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}
