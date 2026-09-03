/**
 * ICAPS 2.0 — Processador clínico sanitizado
 * Processor 2.2.0 · Scoring 2.1.0 · Interpretação 2.1.0
 *
 * Vincule este código à planilha de respostas do ICAPS e execute
 * installICAPSProcessor() uma única vez para autorizar Sheets/Mail e
 * instalar o gatilho onFormSubmit.
 */

const ICAPS_PROCESSOR = Object.freeze({
  VERSION: '2.2.0',
  INSTRUMENT_VERSION: '2.0.0',
  SCORING_VERSION: '2.1.0',
  INTERPRETATION_VERSION: '2.1.0',
  RESPONSE_SHEET: 'Form Responses 1',
  SYNC_SHEET: 'ICAPS_SYNC',
  REPORT_SHEET: 'ICAPS_REPORTS',
  HANDLER: 'icapsOnFormSubmit',
  PROP_SHEET_ID: 'ICAPS_RESPONSE_SHEET_ID',
  PROP_RECIPIENT: 'ICAPS_REPORT_RECIPIENT',
  TZ: 'America/Sao_Paulo'
});

const ICAPS_DIMENSIONS = Object.freeze({
  D1:{title:'Satisfação Conjugal Atual',scoreLabel:'Satisfação conjugal',orientation:'positive',bands:[
    [0,24,'Muito baixa','Faixa descritiva de satisfação conjugal muito reduzida. Deve ser interpretada em conjunto com a entrevista clínica, sem inferir isoladamente prognóstico ou decisão relacional.'],
    [25,49,'Baixa','Faixa descritiva de satisfação conjugal reduzida. Pode ser útil explorar necessidades não atendidas, comunicação, parceria e elementos ainda preservados do vínculo.'],
    [50,74,'Intermediária','Faixa descritiva intermediária. Respostas neutras ou mistas podem produzir escores nesta região; a leitura clínica deve privilegiar o padrão item a item e o contexto.'],
    [75,100,'Elevada','Faixa descritiva de satisfação conjugal elevada. Eventuais dificuldades específicas devem ser contextualizadas e não são excluídas pelo escore global.']]},
  D2:{title:'Ambivalência Decisional',scoreLabel:'Ambivalência decisional',orientation:'risk',bands:[
    [0,24,'Baixa','Faixa descritiva de baixa ambivalência decisional no momento. Não indica qual decisão deve ser tomada.'],
    [25,49,'Baixa a moderada','Faixa descritiva de ambivalência baixa a moderada. Pode ser útil explorar dúvidas, receios, esperança e custos percebidos de cada alternativa.'],
    [50,74,'Intermediária','Faixa descritiva intermediária. Respostas neutras ou mistas podem produzir escores nesta região; não deve ser rotulada automaticamente como ambivalência clinicamente elevada.'],
    [75,100,'Elevada','Faixa descritiva de ambivalência elevada, com maior concentração de respostas de concordância nos itens. Requer exploração clínica contextual, sem conclusão automática.']]},
  D3:{title:'Codependência e Subjugação Pessoal',scoreLabel:'Indicadores de codependência/subjugação',orientation:'risk',bands:[
    [0,24,'Poucos indicadores','Faixa descritiva com poucos indicadores autorreferidos de subjugação, fusão ou dependência relacional nos itens avaliados.'],
    [25,49,'Alguns indicadores','Faixa descritiva com alguns indicadores. Pode ser útil examinar limites, culpa, rejeição, responsabilidade pelo outro e preservação da identidade.'],
    [50,74,'Faixa intermediária','Faixa descritiva intermediária. Respostas neutras ou mistas podem ocupar esta região e não equivalem, por si só, a codependência clínica.'],
    [75,100,'Muitos indicadores','Faixa descritiva com alta concentração de indicadores autorreferidos. Não estabelece diagnóstico, abuso ou dependência; sinaliza temas para investigação clínica.']]},
  D4:{title:'Traição e Impacto Emocional',scoreLabel:'Impacto emocional associado à traição',orientation:'risk',bands:[
    [0,24,'Reduzido','Faixa descritiva de impacto emocional atualmente reduzido nos itens contemplados. Não permite concluir que o tema esteja totalmente elaborado.'],
    [25,49,'Leve a moderado','Faixa descritiva de impacto leve a moderado. Pode ser útil diferenciar efeitos atuais sobre confiança, autoestima, lembranças e regulação emocional.'],
    [50,74,'Intermediário','Faixa descritiva intermediária. Respostas neutras ou heterogêneas podem produzir escores nesta região; o padrão item a item é especialmente relevante.'],
    [75,100,'Elevado','Faixa descritiva de impacto elevado, com maior concentração de concordância. Recomenda-se exploração clínica cuidadosa de significado, sofrimento e recursos de enfrentamento.']]},
  D5:{title:'Rede de Apoio e Medos Contextuais',scoreLabel:'Interferência de medos e fatores contextuais',orientation:'risk',bands:[
    [0,24,'Baixa interferência','Faixa descritiva de baixa interferência atual dos fatores contextuais contemplados pelos itens.'],
    [25,49,'Baixa a moderada','Faixa descritiva de interferência baixa a moderada. Pode ser útil mapear rede de apoio, finanças, família, filhos, julgamento social e solidão.'],
    [50,74,'Intermediária','Faixa descritiva intermediária. Respostas neutras ou mistas podem produzir escores nesta região e não equivalem automaticamente a forte restrição contextual.'],
    [75,100,'Elevada','Faixa descritiva de interferência elevada, com maior concentração de concordância. A leitura clínica pode priorizar recursos concretos, apoio e planejamento.']]},
  D6:{title:'Recursos Internos e Prontidão para a Mudança',scoreLabel:'Recursos internos',orientation:'positive',bands:[
    [0,24,'Frágeis','Faixa descritiva de percepção reduzida de recursos internos para lidar com mudanças ou decisões difíceis. Pode ser útil priorizar estabilização, autocuidado e apoio.'],
    [25,49,'Emergentes','Faixa descritiva de recursos internos em desenvolvimento, com possível oscilação na percepção de capacidade de enfrentamento.'],
    [50,74,'Intermediários','Faixa descritiva intermediária. Respostas neutras ou mistas podem produzir escores nesta região; convém examinar quais recursos estão preservados e quais ainda precisam de fortalecimento.'],
    [75,100,'Elevados','Faixa descritiva de recursos internos elevados, com maior concentração de respostas de concordância nos itens. Não determina, isoladamente, prontidão para uma decisão específica.']]}
});

function installICAPSProcessor(){
  const ss=SpreadsheetApp.getActiveSpreadsheet();
  if(!ss) throw new Error('Abra a planilha de respostas do ICAPS antes de executar a instalação.');
  const recipient=Session.getEffectiveUser().getEmail();
  if(!recipient) throw new Error('Não foi possível identificar o e-mail da conta instaladora.');
  ensureICAPSSheets_(ss);
  PropertiesService.getScriptProperties().setProperties({[ICAPS_PROCESSOR.PROP_SHEET_ID]:ss.getId(),[ICAPS_PROCESSOR.PROP_RECIPIENT]:recipient});
  ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===ICAPS_PROCESSOR.HANDLER).forEach(t=>ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger(ICAPS_PROCESSOR.HANDLER).forSpreadsheet(ss).onFormSubmit().create();
  backfillICAPSPending();
  return {ok:true,spreadsheetId:ss.getId(),recipient,processorVersion:ICAPS_PROCESSOR.VERSION,scoringVersion:ICAPS_PROCESSOR.SCORING_VERSION,interpretationVersion:ICAPS_PROCESSOR.INTERPRETATION_VERSION};
}

function removeICAPSProcessorTrigger(){ScriptApp.getProjectTriggers().filter(t=>t.getHandlerFunction()===ICAPS_PROCESSOR.HANDLER).forEach(t=>ScriptApp.deleteTrigger(t));}
function icapsOnFormSubmit(e){if(!e||!e.range) throw new Error('Evento onFormSubmit inválido.');const row=e.range.getRow();if(row>=2) processICAPSRow_(row);}
function backfillICAPSPending(){const ss=getICAPSSpreadsheet_();ensureICAPSSheets_(ss);const sh=requireICAPSSheet_(ss,ICAPS_PROCESSOR.RESPONSE_SHEET);for(let row=2;row<=sh.getLastRow();row++) if(!isICAPSSent_(ss,row)) processICAPSRow_(row);}

function processICAPSRow_(rowNumber){
  const lock=LockService.getScriptLock();
  if(!lock.tryLock(10000)) return;
  try{
    const ss=getICAPSSpreadsheet_();ensureICAPSSheets_(ss);if(isICAPSSent_(ss,rowNumber)) return;
    const sh=requireICAPSSheet_(ss,ICAPS_PROCESSOR.RESPONSE_SHEET),lastColumn=sh.getLastColumn();
    const headers=sh.getRange(1,1,1,lastColumn).getValues()[0],row=sh.getRange(rowNumber,1,1,lastColumn).getValues()[0],map=headerMapICAPS_(headers);
    const timestamp=row[requireHeaderICAPS_(map,'Timestamp')];
    const patientName=String(row[requireHeaderICAPS_(map,'Nome completo')]||'Não informado').trim();
    const patientCode=String(row[requireHeaderICAPS_(map,'Código do paciente (se informado pelo psicólogo)')]||'').trim();
    const age=row[requireHeaderICAPS_(map,'Idade')];
    const questions=headers.map((h,index)=>{const m=String(h||'').match(/^(\d+)\./);return m?{number:Number(m[1]),index,text:String(h).replace(/^\d+\.\s*/,'')}:null;}).filter(Boolean).sort((a,b)=>a.number-b.number);
    if(questions.length!==60) throw new Error(`Esperadas 60 perguntas; encontradas ${questions.length}.`);
    const answers=questions.map(q=>{const value=Number(row[q.index]);if(![1,2,3,4,5].includes(value)) throw new Error(`Resposta inválida na pergunta ${q.number}.`);return value;});
    const results=calculateICAPSResults_(answers),analysis=buildICAPSClinicalAnalysis_(results,answers,questions),assessmentId=assessmentIdICAPS_(timestamp,rowNumber),rowHash=rowHashICAPS_(row);
    upsertICAPSReport_(ss,{assessmentId,patientCode,patientName,age,timestamp,results});
    const recipient=PropertiesService.getScriptProperties().getProperty(ICAPS_PROCESSOR.PROP_RECIPIENT);
    if(!recipient) throw new Error('Destinatário não configurado. Execute installICAPSProcessor().');
    sendICAPSReport_(recipient,{assessmentId,patientCode,patientName,age,timestamp,results,analysis,answers,questions,spreadsheetUrl:ss.getUrl()});
    upsertICAPSSync_(ss,rowNumber,{assessmentId,rowHash,patientCode,patientName,receivedAt:timestamp,scoredAt:new Date(),emailStatus:'SENT',emailSentAt:new Date(),lastError:''});
  }catch(error){
    try{const ss=getICAPSSpreadsheet_();upsertICAPSSync_(ss,rowNumber,{assessmentId:'',rowHash:'',patientCode:'',patientName:'',receivedAt:'',scoredAt:new Date(),emailStatus:'ERROR',emailSentAt:'',lastError:String(error&&error.message?error.message:error)});}catch(_){}
    throw error;
  }finally{lock.releaseLock();}
}

function calculateICAPSResults_(answers){const results={};for(let d=1;d<=6;d++){const key=`D${d}`,block=answers.slice((d-1)*10,d*10);const score=Math.round(block.reduce((s,v)=>s+((v-1)*25),0)/block.length),band=bandICAPS_(key,score),meta=ICAPS_DIMENSIONS[key];results[key]={score,band:band.label,bandKey:band.key,interpretation:band.text,title:meta.title,scoreLabel:meta.scoreLabel,orientation:meta.orientation};}return results;}

function buildICAPSClinicalAnalysis_(r,answers,questions){
  const priorities=[];
  if(r.D2.score>=75) priorities.push('Explorar o conflito decisional e os fatores que sustentam oscilações, adiamentos ou dependência de eventos externos para decidir.');
  if(r.D3.score>=75) priorities.push('Avaliar autonomia, limites, culpa, medo de rejeição, responsabilidade excessiva pelo outro e preservação da identidade.');
  if(r.D4.score>=75) priorities.push('Investigar repercussões atuais das experiências de traição sobre confiança, autoestima, raiva, tristeza e segurança emocional.');
  if(r.D5.score>=75) priorities.push('Mapear rede de apoio, condições financeiras, filhos, julgamento social e outros fatores concretos que possam restringir escolhas.');
  if(r.D6.score<=49) priorities.push('Explorar recursos internos percebidos, autocuidado, clareza, suporte e capacidade de enfrentamento antes de decisões de alto impacto.');
  if(r.D1.score<=49) priorities.push('Diferenciar desgaste relacional global de problemas localizados e identificar necessidades afetivas, comunicacionais e de parceria não atendidas.');
  if(!priorities.length) priorities.push('Explorar o padrão item a item em conjunto com a história do relacionamento, o contexto atual e os objetivos terapêuticos.');

  const tensions=[];
  if(r.D1.score<=49&&r.D6.score>=75) tensions.push('Satisfação conjugal reduzida coexistindo com elevada percepção de recursos internos. Pode ser útil explorar a decisão a partir de valores e necessidades, sem pressupor incapacidade de enfrentamento.');
  if(r.D2.score>=75&&r.D6.score>=75) tensions.push('Ambivalência elevada apesar de recursos internos elevados. Convém investigar conflito de valores, esperança, vínculos e perdas antecipadas.');
  if(r.D3.score>=75&&r.D5.score<=49) tensions.push('Alta concentração de indicadores de subjugação/codependência com baixa a moderada interferência contextual. Pode ser útil examinar mecanismos relacionais e intrapsíquicos sem atribuir causalidade automática.');
  if(r.D4.score>=75&&r.D1.score>=75) tensions.push('Impacto emocional elevado da traição coexistindo com satisfação relacional elevada. A coexistência de vínculo e ferida merece exploração clínica sem simplificação binária.');
  if(!tensions.length) tensions.push('Nenhuma tensão dimensional automática de alta saliência foi identificada. A integração deve apoiar-se principalmente na entrevista e no padrão item a item.');

  const attentionItems=[],protectiveItems=[];
  for(let i=0;i<answers.length;i++){
    const dimension=Math.floor(i/10)+1,item={number:questions[i].number,text:questions[i].text,value:answers[i],dimension:`D${dimension}`};
    if(dimension>=2&&dimension<=5&&answers[i]>=4) attentionItems.push(item);
    if((dimension===1||dimension===6)&&answers[i]<=2) attentionItems.push(item);
    if((dimension===1||dimension===6)&&answers[i]>=4) protectiveItems.push(item);
  }
  attentionItems.sort((a,b)=>b.value-a.value||a.number-b.number);protectiveItems.sort((a,b)=>b.value-a.value||a.number-b.number);
  return {summary:buildICAPSSummary_(r),priorities:priorities.slice(0,6),tensions:tensions.slice(0,5),attentionItems:attentionItems.slice(0,10),protectiveItems:protectiveItems.slice(0,8)};
}

function sendICAPSReport_(recipient,data){
  const when=formatICAPSDate_(data.timestamp),subject=`ICAPS 2.0 — Relatório clínico — ${data.patientName} — ${when}`,r=data.results;
  const plain=['ICAPS — RELATÓRIO CLÍNICO ESTRUTURADO',`Paciente: ${data.patientName}`,`Código: ${data.patientCode||'não informado'}`,`Idade: ${data.age||'não informada'}`,`Submetido em: ${when}`,`Instrumento: ${ICAPS_PROCESSOR.INSTRUMENT_VERSION} · Scoring: ${ICAPS_PROCESSOR.SCORING_VERSION} · Interpretação: ${ICAPS_PROCESSOR.INTERPRETATION_VERSION}`,'','SÍNTESE INTEGRADA',data.analysis.summary,'','PRIORIDADES PARA EXPLORAÇÃO CLÍNICA',...data.analysis.priorities.map((x,i)=>`${i+1}. ${x}`),'','RESULTADOS POR DIMENSÃO',...Object.keys(ICAPS_DIMENSIONS).map(key=>`${key} — ${r[key].title}: ${r[key].score}/100 — ${r[key].band}`),'','Nota metodológica: faixas descritivas, não pontos de corte psicométricos. O ICAPS não constitui teste psicológico diagnóstico e não deve determinar isoladamente uma decisão conjugal.'].join('\n');
  MailApp.sendEmail({to:recipient,subject,body:plain,htmlBody:buildICAPSReportHtml_(data),name:'ICAPS 2.0'});
}

function buildICAPSReportHtml_(data){
  const e=escapeICAPSHtml_,r=data.results,when=formatICAPSDate_(data.timestamp);
  const dimensionRows=Object.keys(ICAPS_DIMENSIONS).map(key=>{const d=r[key],barColor=d.orientation==='positive'?'#166534':'#92400e';return `<tr><td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;vertical-align:top"><strong>${e(key)} — ${e(d.title)}</strong><div style="font-size:12px;color:#6b7280;margin-top:3px">${e(d.scoreLabel)}</div></td><td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;width:105px;vertical-align:top"><strong>${d.score}/100</strong><div style="height:7px;background:#e5e7eb;border-radius:99px;margin-top:7px;overflow:hidden"><div style="height:7px;width:${d.score}%;background:${barColor}"></div></div></td><td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;width:150px;vertical-align:top"><strong>${e(d.band)}</strong></td><td style="padding:12px 10px;border-bottom:1px solid #e5e7eb;color:#374151;vertical-align:top;text-align:justify;line-height:1.5">${e(d.interpretation)}</td></tr>`;}).join('');
  const priorities=data.analysis.priorities.map(x=>`<li style="margin:0 0 8px;text-align:justify">${e(x)}</li>`).join(''),tensions=data.analysis.tensions.map(x=>`<li style="margin:0 0 8px;text-align:justify">${e(x)}</li>`).join('');
  const attention=data.analysis.attentionItems.length?data.analysis.attentionItems.map(x=>`<tr><td style="padding:7px 8px;border-bottom:1px solid #f3f4f6">${x.number}</td><td style="padding:7px 8px;border-bottom:1px solid #f3f4f6;text-align:justify">${e(x.text)}</td><td style="padding:7px 8px;border-bottom:1px solid #f3f4f6"><strong>${x.value}/5</strong></td></tr>`).join(''):'<tr><td colspan="3" style="padding:8px;color:#6b7280">Nenhum item adicional destacado automaticamente.</td></tr>';
  const protective=data.analysis.protectiveItems.length?data.analysis.protectiveItems.map(x=>`<tr><td style="padding:7px 8px;border-bottom:1px solid #f3f4f6">${x.number}</td><td style="padding:7px 8px;border-bottom:1px solid #f3f4f6;text-align:justify">${e(x.text)}</td><td style="padding:7px 8px;border-bottom:1px solid #f3f4f6"><strong>${x.value}/5</strong></td></tr>`).join(''):'<tr><td colspan="3" style="padding:8px;color:#6b7280">Nenhum recurso adicional destacado automaticamente.</td></tr>';
  const responseRows=data.questions.map((q,i)=>{const dim=`D${Math.floor(i/10)+1}`,bg=i%2?'#fff':'#f9fafb';return `<tr style="background:${bg}"><td style="padding:7px 8px;border-bottom:1px solid #eef2f7;color:#6b7280">${e(dim)}</td><td style="padding:7px 8px;border-bottom:1px solid #eef2f7;text-align:justify">${q.number}. ${e(q.text)}</td><td style="padding:7px 8px;border-bottom:1px solid #eef2f7;text-align:center"><strong>${data.answers[i]}/5</strong></td></tr>`;}).join('');
  return `<!doctype html><html><body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;color:#111827"><div style="max-width:920px;margin:0 auto;padding:24px 12px"><div style="background:#fff;border:1px solid #e5e7eb;border-radius:14px;overflow:hidden"><div style="background:#111827;color:#fff;padding:24px"><div style="font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#cbd5e1">ICAPS 2.0</div><h1 style="font-size:23px;line-height:1.25;margin:7px 0 5px">Relatório clínico estruturado</h1><div style="font-size:14px;color:#d1d5db">Inventário Clínico para Avaliação de Prontidão para Separação</div></div><div style="padding:20px 24px;border-bottom:1px solid #e5e7eb"><table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px"><tr><td style="padding:3px 20px 3px 0"><strong>Paciente</strong><br>${e(data.patientName)}</td><td style="padding:3px 20px 3px 0"><strong>Idade</strong><br>${e(data.age||'não informada')}</td><td style="padding:3px 20px 3px 0"><strong>Data</strong><br>${e(when)}</td><td style="padding:3px 0"><strong>Código</strong><br>${e(data.patientCode||'não informado')}</td></tr></table><div style="font-size:11px;color:#6b7280;margin-top:10px">Assessment ID: ${e(data.assessmentId)} · Instrumento ${e(ICAPS_PROCESSOR.INSTRUMENT_VERSION)} · Scoring ${e(ICAPS_PROCESSOR.SCORING_VERSION)} · Interpretação ${e(ICAPS_PROCESSOR.INTERPRETATION_VERSION)}</div></div><div style="padding:22px 24px;background:#f8fafc;border-bottom:1px solid #e5e7eb"><div style="font-size:12px;font-weight:bold;letter-spacing:.06em;text-transform:uppercase;color:#475569">Visão executiva</div><p style="font-size:15px;line-height:1.6;margin:8px 0 0;text-align:justify">${e(data.analysis.summary)}</p></div><div style="padding:22px 24px;border-bottom:1px solid #e5e7eb"><h2 style="font-size:17px;margin:0 0 12px">Perfil dimensional</h2><table style="width:100%;border-collapse:collapse;font-size:13px"><tbody>${dimensionRows}</tbody></table></div><div style="padding:22px 24px;border-bottom:1px solid #e5e7eb"><h2 style="font-size:17px;margin:0 0 8px">Prioridades para exploração clínica</h2><ol style="padding-left:21px;margin:0;line-height:1.5">${priorities}</ol></div><div style="padding:22px 24px;border-bottom:1px solid #e5e7eb;background:#fffbeb"><h2 style="font-size:17px;margin:0 0 8px">Integração entre dimensões</h2><ul style="padding-left:20px;margin:0;line-height:1.5">${tensions}</ul></div><div style="padding:22px 24px;border-bottom:1px solid #e5e7eb"><h2 style="font-size:17px;margin:0 0 12px">Itens de atenção clínica</h2><div style="font-size:12px;color:#6b7280;margin-bottom:10px;text-align:justify">Respostas automaticamente destacadas por intensidade para facilitar revisão em sessão. Não equivalem a diagnóstico, risco confirmado ou confirmação factual isolada.</div><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#fef2f2"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:left">Conteúdo</th><th style="padding:8px;text-align:left">Resposta</th></tr></thead><tbody>${attention}</tbody></table></div><div style="padding:22px 24px;border-bottom:1px solid #e5e7eb"><h2 style="font-size:17px;margin:0 0 12px">Recursos autorreferidos</h2><table style="width:100%;border-collapse:collapse;font-size:13px"><thead><tr style="background:#f0fdf4"><th style="padding:8px;text-align:left">Item</th><th style="padding:8px;text-align:left">Conteúdo</th><th style="padding:8px;text-align:left">Resposta</th></tr></thead><tbody>${protective}</tbody></table></div><div style="padding:22px 24px;border-bottom:1px solid #e5e7eb"><h2 style="font-size:17px;margin:0 0 12px">Respostas completas</h2><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr style="background:#e5e7eb"><th style="padding:8px;text-align:left">Dim.</th><th style="padding:8px;text-align:left">Afirmação</th><th style="padding:8px;text-align:center">Resposta</th></tr></thead><tbody>${responseRows}</tbody></table></div><div style="padding:18px 24px;background:#f9fafb;font-size:11px;line-height:1.55;color:#6b7280;text-align:justify"><strong>Nota metodológica.</strong> As faixas são descritivas e operacionais, não pontos de corte psicométricos validados. O ICAPS é instrumento clínico estruturado de apoio, não constitui teste psicológico diagnóstico, não confirma isoladamente abuso, toxicidade, prognóstico ou condição psicopatológica e não deve determinar sozinho continuidade ou término da relação.<div style="margin-top:8px"><a href="${e(data.spreadsheetUrl)}" style="color:#1d4ed8">Abrir planilha de origem</a></div></div></div></div></body></html>`;
}

function buildICAPSSummary_(r){const focus=[];if(r.D1.score<=49) focus.push('fontes de desgaste e necessidades relacionais não atendidas');if(r.D2.score>=75) focus.push('processo decisional e fatores que mantêm a ambivalência');if(r.D3.score>=75) focus.push('autonomia, limites e preservação da identidade');if(r.D4.score>=75) focus.push('impacto emocional das experiências de traição');if(r.D5.score>=75) focus.push('rede de apoio, medos e condições práticas');if(r.D6.score<=49) focus.push('fortalecimento de recursos internos e capacidade de enfrentamento');const base=`O perfil apresenta satisfação conjugal ${r.D1.band.toLowerCase()}, ambivalência decisional ${r.D2.band.toLowerCase()}, ${r.D3.band.toLowerCase()} de codependência/subjugação, impacto da traição ${r.D4.band.toLowerCase()}, ${r.D5.band.toLowerCase()} de fatores contextuais e recursos internos ${r.D6.band.toLowerCase()}.`;const tail=focus.length?` Como material de apoio clínico, pode ser útil explorar: ${focus.join('; ')}.`:' A leitura deve priorizar o padrão item a item e o contexto clínico.';return `${base}${tail} As faixas são descritivas e não estabelecem diagnóstico nem determinam uma decisão conjugal.`;}
function bandICAPS_(dimension,score){const band=ICAPS_DIMENSIONS[dimension].bands.find(([min,max])=>score>=min&&score<=max);if(!band) throw new Error(`Faixa não encontrada para ${dimension}: ${score}`);return {label:band[2],key:score<=24?'low':score<=49?'low_moderate':score<=74?'intermediate':'high',text:band[3]};}

function ensureICAPSSheets_(ss){
  let sync=ss.getSheetByName(ICAPS_PROCESSOR.SYNC_SHEET);if(!sync) sync=ss.insertSheet(ICAPS_PROCESSOR.SYNC_SHEET);if(sync.getLastRow()===0) sync.appendRow(['source_row','assessment_id','row_hash','patient_code','patient_name','received_at','scored_at','email_status','email_sent_at','platform_status','platform_saved_at','last_error']);sync.hideSheet();
  let report=ss.getSheetByName(ICAPS_PROCESSOR.REPORT_SHEET);if(!report) report=ss.insertSheet(ICAPS_PROCESSOR.REPORT_SHEET);
  const headers=['assessment_id','patient_code','patient_name','age','response_timestamp','instrument_version','scoring_version','D1_score','D1_band','D2_score','D2_band','D3_score','D3_band','D4_score','D4_band','D5_score','D5_band','D6_score','D6_band','interpretation_version'];
  if(report.getLastRow()===0) report.appendRow(headers);else if(String(report.getRange(1,20).getValue()||'')!=='interpretation_version') report.getRange(1,20).setValue('interpretation_version');report.hideSheet();
}
function upsertICAPSReport_(ss,data){const sh=requireICAPSSheet_(ss,ICAPS_PROCESSOR.REPORT_SHEET);if(findICAPSRowByValue_(sh,1,data.assessmentId)) return;const r=data.results;sh.appendRow([data.assessmentId,data.patientCode,data.patientName,data.age,data.timestamp,ICAPS_PROCESSOR.INSTRUMENT_VERSION,ICAPS_PROCESSOR.SCORING_VERSION,r.D1.score,r.D1.band,r.D2.score,r.D2.band,r.D3.score,r.D3.band,r.D4.score,r.D4.band,r.D5.score,r.D5.band,r.D6.score,r.D6.band,ICAPS_PROCESSOR.INTERPRETATION_VERSION]);}
function upsertICAPSSync_(ss,sourceRow,data){const sh=requireICAPSSheet_(ss,ICAPS_PROCESSOR.SYNC_SHEET);let row=findICAPSRowByValue_(sh,1,sourceRow);const values=[[sourceRow,data.assessmentId||'',data.rowHash||'',data.patientCode||'',data.patientName||'',data.receivedAt||'',data.scoredAt||'',data.emailStatus||'',data.emailSentAt||'','','',data.lastError||'']];if(!row) row=sh.getLastRow()+1;sh.getRange(row,1,1,12).setValues(values);}
function isICAPSSent_(ss,sourceRow){const sh=requireICAPSSheet_(ss,ICAPS_PROCESSOR.SYNC_SHEET),row=findICAPSRowByValue_(sh,1,sourceRow);return !!row&&String(sh.getRange(row,8).getValue()).toUpperCase()==='SENT';}
function findICAPSRowByValue_(sheet,column,value){const last=sheet.getLastRow();if(last<2)return 0;const values=sheet.getRange(2,column,last-1,1).getValues();for(let i=0;i<values.length;i++) if(String(values[i][0])===String(value)) return i+2;return 0;}
function getICAPSSpreadsheet_(){const id=PropertiesService.getScriptProperties().getProperty(ICAPS_PROCESSOR.PROP_SHEET_ID);if(id) return SpreadsheetApp.openById(id);const active=SpreadsheetApp.getActiveSpreadsheet();if(!active) throw new Error('Planilha do ICAPS não configurada. Execute installICAPSProcessor().');return active;}
function requireICAPSSheet_(ss,name){const sh=ss.getSheetByName(name);if(!sh) throw new Error(`Aba obrigatória ausente: ${name}`);return sh;}
function headerMapICAPS_(headers){const map={};headers.forEach((h,i)=>{if(String(h||'').trim()) map[String(h).trim()]=i;});return map;}
function requireHeaderICAPS_(map,name){if(map[name]===undefined) throw new Error(`Cabeçalho obrigatório ausente: ${name}`);return map[name];}
function assessmentIdICAPS_(timestamp,rowNumber){const date=timestamp instanceof Date?timestamp:new Date(timestamp),stamp=isNaN(date.getTime())?`ROW${rowNumber}`:Utilities.formatDate(date,ICAPS_PROCESSOR.TZ,'yyyyMMdd-HHmmss');return `ICAPS-${stamp}-R${rowNumber}`;}
function rowHashICAPS_(row){const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,JSON.stringify(row));return bytes.map(b=>(b+256)%256).map(b=>b.toString(16).padStart(2,'0')).join('');}
function formatICAPSDate_(timestamp){const date=timestamp instanceof Date?timestamp:new Date(timestamp);if(isNaN(date.getTime())) return String(timestamp||'data não informada');return Utilities.formatDate(date,ICAPS_PROCESSOR.TZ,'dd/MM/yyyy HH:mm');}
function escapeICAPSHtml_(value){return String(value==null?'':value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
