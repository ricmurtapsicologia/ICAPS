/**
 * ICAPS 2.0 — Processador pós-envio
 *
 * Instalação: vincule este código ao Google Sheets de respostas do ICAPS e
 * execute installICAPSProcessor() uma única vez. A função instala um gatilho
 * onFormSubmit, processa respostas pendentes, registra auditoria e envia o
 * relatório clínico somente ao proprietário que instalou o gatilho.
 */

const ICAPS_PROCESSOR = Object.freeze({
  VERSION: '2.0.0',
  RESPONSE_SHEET: 'Form Responses 1',
  SYNC_SHEET: 'ICAPS_SYNC',
  REPORT_SHEET: 'ICAPS_REPORTS',
  HANDLER: 'icapsOnFormSubmit',
  PROP_SHEET_ID: 'ICAPS_RESPONSE_SHEET_ID',
  PROP_RECIPIENT: 'ICAPS_REPORT_RECIPIENT',
  TZ: 'America/Sao_Paulo'
});

const ICAPS_BANDS = Object.freeze({
  D1: [[0,24,'Muito baixa'],[25,49,'Baixa'],[50,74,'Moderada'],[75,100,'Elevada']],
  D2: [[0,24,'Baixa'],[25,49,'Moderada'],[50,74,'Elevada'],[75,100,'Muito elevada']],
  D3: [[0,24,'Poucos indicadores'],[25,49,'Alguns indicadores'],[50,74,'Indicadores importantes'],[75,100,'Muitos indicadores']],
  D4: [[0,24,'Reduzido'],[25,49,'Moderado'],[50,74,'Elevado'],[75,100,'Muito elevado']],
  D5: [[0,24,'Baixa interferência'],[25,49,'Interferência moderada'],[50,74,'Interferência elevada'],[75,100,'Interferência muito elevada']],
  D6: [[0,24,'Frágeis'],[25,49,'Emergentes'],[50,74,'Consolidados'],[75,100,'Elevados']]
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

  ScriptApp.newTrigger(ICAPS_PROCESSOR.HANDLER)
    .forSpreadsheet(ss)
    .onFormSubmit()
    .create();

  backfillICAPSPending();
  return { ok: true, spreadsheetId: ss.getId(), recipient };
}

function removeICAPSProcessorTrigger() {
  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === ICAPS_PROCESSOR.HANDLER)
    .forEach(t => ScriptApp.deleteTrigger(t));
}

function icapsOnFormSubmit(e) {
  if (!e || !e.range) throw new Error('Evento onFormSubmit inválido.');
  const rowNumber = e.range.getRow();
  if (rowNumber < 2) return;
  processICAPSRow_(rowNumber);
}

function backfillICAPSPending() {
  const ss = getICAPSSpreadsheet_();
  ensureICAPSSheets_(ss);
  const responseSheet = requireICAPSSheet_(ss, ICAPS_PROCESSOR.RESPONSE_SHEET);
  const lastRow = responseSheet.getLastRow();
  for (let row = 2; row <= lastRow; row++) {
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
        return match ? { number: Number(match[1]), index } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a.number - b.number);

    if (questionColumns.length !== 60) {
      throw new Error(`Esperadas 60 perguntas; encontradas ${questionColumns.length}.`);
    }

    const answers = questionColumns.map(q => {
      const value = Number(row[q.index]);
      if (![1,2,3,4,5].includes(value)) throw new Error(`Resposta inválida na pergunta ${q.number}.`);
      return value;
    });

    const results = {};
    for (let d = 1; d <= 6; d++) {
      const key = `D${d}`;
      const block = answers.slice((d - 1) * 10, d * 10);
      const score = Math.round(block.reduce((sum, value) => sum + ((value - 1) * 25), 0) / block.length);
      results[key] = { score, band: bandICAPS_(key, score) };
    }

    const assessmentId = assessmentIdICAPS_(timestamp, rowNumber);
    const rowHash = rowHashICAPS_(row);
    const summary = buildICAPSSummary_(results);

    upsertICAPSReport_(ss, {
      assessmentId, patientCode, patientName, age, timestamp, results
    });

    const recipient = PropertiesService.getScriptProperties().getProperty(ICAPS_PROCESSOR.PROP_RECIPIENT);
    if (!recipient) throw new Error('Destinatário do relatório não configurado. Execute installICAPSProcessor().');

    sendICAPSReport_(recipient, {
      assessmentId, patientCode, patientName, age, timestamp, results, summary, spreadsheetUrl: ss.getUrl()
    });

    upsertICAPSSync_(ss, rowNumber, {
      assessmentId,
      rowHash,
      patientCode,
      patientName,
      receivedAt: timestamp,
      scoredAt: new Date(),
      emailStatus: 'SENT',
      emailSentAt: new Date(),
      lastError: ''
    });
  } catch (error) {
    try {
      const ss = getICAPSSpreadsheet_();
      upsertICAPSSync_(ss, rowNumber, {
        assessmentId: '', rowHash: '', patientCode: '', patientName: '',
        receivedAt: '', scoredAt: new Date(), emailStatus: 'ERROR', emailSentAt: '',
        lastError: String(error && error.message ? error.message : error)
      });
    } catch (_) {}
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function sendICAPSReport_(recipient, data) {
  const when = formatICAPSDate_(data.timestamp);
  const r = data.results;
  const subject = `ICAPS 2.0 — Relatório clínico — ${data.patientName} — ${when}`;
  const lines = [
    'ICAPS – Inventário Clínico para Avaliação de Prontidão para Separação',
    '',
    `Paciente: ${data.patientName}`,
    `Código: ${data.patientCode || 'não informado'}`,
    `Idade: ${data.age || 'não informada'}`,
    `Resposta: ${when}`,
    `Assessment ID: ${data.assessmentId}`,
    '',
    'Resultados por dimensão',
    `D1 — Satisfação Conjugal Atual: ${r.D1.score}/100 — ${r.D1.band}`,
    `D2 — Ambivalência Decisional: ${r.D2.score}/100 — ${r.D2.band}`,
    `D3 — Codependência e Subjugação Pessoal: ${r.D3.score}/100 — ${r.D3.band}`,
    `D4 — Traição e Impacto Emocional: ${r.D4.score}/100 — ${r.D4.band}`,
    `D5 — Rede de Apoio e Medos Contextuais: ${r.D5.score}/100 — ${r.D5.band}`,
    `D6 — Recursos Internos e Prontidão para a Mudança: ${r.D6.score}/100 — ${r.D6.band}`,
    '',
    'Síntese integrada',
    data.summary,
    '',
    'Este resultado não estabelece diagnóstico nem determina uma decisão conjugal. Deve ser interpretado em conjunto com a história, o contexto atual e a avaliação profissional.',
    '',
    `Planilha de origem: ${data.spreadsheetUrl}`
  ];

  const esc = value => String(value).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  const rows = [
    ['D1 — Satisfação Conjugal Atual', r.D1],
    ['D2 — Ambivalência Decisional', r.D2],
    ['D3 — Codependência e Subjugação Pessoal', r.D3],
    ['D4 — Traição e Impacto Emocional', r.D4],
    ['D5 — Rede de Apoio e Medos Contextuais', r.D5],
    ['D6 — Recursos Internos e Prontidão para a Mudança', r.D6]
  ].map(([label, value]) => `<tr><td style="padding:7px;border-bottom:1px solid #e5e7eb">${esc(label)}</td><td style="padding:7px;border-bottom:1px solid #e5e7eb"><strong>${value.score}/100</strong></td><td style="padding:7px;border-bottom:1px solid #e5e7eb">${esc(value.band)}</td></tr>`).join('');

  const htmlBody = `
    <div style="font-family:Arial,sans-serif;color:#111827;line-height:1.5;max-width:760px">
      <h2 style="margin-bottom:4px">ICAPS 2.0 — Relatório clínico</h2>
      <p style="margin-top:0;color:#4b5563">Inventário Clínico para Avaliação de Prontidão para Separação</p>
      <p><strong>Paciente:</strong> ${esc(data.patientName)}<br>
      <strong>Código:</strong> ${esc(data.patientCode || 'não informado')}<br>
      <strong>Idade:</strong> ${esc(data.age || 'não informada')}<br>
      <strong>Resposta:</strong> ${esc(when)}<br>
      <strong>Assessment ID:</strong> ${esc(data.assessmentId)}</p>
      <table style="border-collapse:collapse;width:100%;margin:16px 0"><tbody>${rows}</tbody></table>
      <h3>Síntese integrada</h3>
      <p>${esc(data.summary)}</p>
      <p style="font-size:12px;color:#6b7280">Este resultado não estabelece diagnóstico nem determina uma decisão conjugal. Deve ser interpretado em conjunto com a história, o contexto atual e a avaliação profissional.</p>
      <p><a href="${esc(data.spreadsheetUrl)}">Abrir planilha de origem</a></p>
    </div>`;

  MailApp.sendEmail({
    to: recipient,
    subject,
    body: lines.join('\n'),
    htmlBody,
    name: 'ICAPS 2.0'
  });
}

function buildICAPSSummary_(r) {
  const sentences = [
    `O perfil obtido apresenta satisfação conjugal ${r.D1.band.toLowerCase()} e ambivalência decisional ${r.D2.band.toLowerCase()}.`,
    `Há ${r.D3.band.toLowerCase()} de codependência/subjugação, impacto emocional da traição ${r.D4.band.toLowerCase()} e ${r.D5.band.toLowerCase()} de fatores contextuais.`,
    `Os recursos internos aparecem como ${r.D6.band.toLowerCase()}.`
  ];

  const priorities = [];
  if (r.D2.score >= 50) priorities.push('processo decisional e fatores que mantêm a ambivalência');
  if (r.D3.score >= 50) priorities.push('autonomia, limites e preservação da identidade');
  if (r.D4.score >= 50) priorities.push('impacto emocional das experiências de traição');
  if (r.D5.score >= 50) priorities.push('rede de apoio, medos e condições práticas');
  if (r.D6.score <= 49) priorities.push('fortalecimento de recursos internos e capacidade de enfrentamento');
  if (r.D1.score <= 49) priorities.push('fontes de desgaste e necessidades relacionais não atendidas');

  const tail = priorities.length
    ? `Como material de apoio clínico, pode ser útil explorar: ${priorities.join('; ')}.`
    : 'Os resultados devem ser compreendidos em conjunto com a história, o contexto atual e a avaliação profissional.';

  return `${sentences.join(' ')} ${tail} Este resultado não estabelece diagnóstico nem determina uma decisão conjugal.`;
}

function bandICAPS_(dimension, score) {
  const band = ICAPS_BANDS[dimension].find(([min, max]) => score >= min && score <= max);
  if (!band) throw new Error(`Faixa não encontrada para ${dimension}: ${score}`);
  return band[2];
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
  const existing = findICAPSRowByValue_(sh, 1, data.assessmentId);
  if (existing) return;
  const r = data.results;
  sh.appendRow([
    data.assessmentId, data.patientCode, data.patientName, data.age, data.timestamp,
    ICAPS_PROCESSOR.VERSION, ICAPS_PROCESSOR.VERSION,
    r.D1.score, r.D1.band, r.D2.score, r.D2.band, r.D3.score, r.D3.band,
    r.D4.score, r.D4.band, r.D5.score, r.D5.band, r.D6.score, r.D6.band
  ]);
}

function upsertICAPSSync_(ss, sourceRow, data) {
  const sh = requireICAPSSheet_(ss, ICAPS_PROCESSOR.SYNC_SHEET);
  let row = findICAPSRowByValue_(sh, 1, sourceRow);
  const values = [[
    sourceRow, data.assessmentId || '', data.rowHash || '', data.patientCode || '', data.patientName || '',
    data.receivedAt || '', data.scoredAt || '', data.emailStatus || '', data.emailSentAt || '', '', '', data.lastError || ''
  ]];
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
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(value)) return i + 2;
  }
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
  headers.forEach((header, index) => { if (String(header || '').trim()) map[String(header).trim()] = index; });
  return map;
}

function requireHeaderICAPS_(map, name) {
  if (map[name] === undefined) throw new Error(`Cabeçalho obrigatório ausente: ${name}`);
  return map[name];
}

function assessmentIdICAPS_(timestamp, rowNumber) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  const stamp = isNaN(date.getTime())
    ? `ROW${rowNumber}`
    : Utilities.formatDate(date, ICAPS_PROCESSOR.TZ, 'yyyyMMdd-HHmmss');
  return `ICAPS-${stamp}-R${rowNumber}`;
}

function rowHashICAPS_(row) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(row));
  return bytes.map(b => (b + 256) % 256).map(b => b.toString(16).padStart(2, '0')).join('');
}

function formatICAPSDate_(timestamp) {
  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return String(timestamp || 'data não informada');
  return Utilities.formatDate(date, ICAPS_PROCESSOR.TZ, 'dd/MM/yyyy HH:mm');
}
