export function buildIntegratedSummary(results) {
  const byId = Object.fromEntries(results.map(r => [r.id, r]));
  const d1 = byId.D1, d2 = byId.D2, d3 = byId.D3, d4 = byId.D4, d5 = byId.D5, d6 = byId.D6;
  const sentences = [
    `O perfil obtido apresenta satisfação conjugal ${d1.band.label.toLowerCase()} e ambivalência decisional ${d2.band.label.toLowerCase()}.`,
    `Há ${d3.band.label.toLowerCase()} de codependência/subjugação, impacto emocional da traição ${d4.band.label.toLowerCase()} e ${d5.band.label.toLowerCase()} de fatores contextuais.`,
    `Os recursos internos aparecem como ${d6.band.label.toLowerCase()}.`
  ];

  const priorities = [];
  if (d2.score >= 50) priorities.push('processo decisional e fatores que mantêm a ambivalência');
  if (d3.score >= 50) priorities.push('autonomia, limites e preservação da identidade');
  if (d4.score >= 50) priorities.push('impacto emocional das experiências de traição');
  if (d5.score >= 50) priorities.push('rede de apoio, medos e condições práticas');
  if (d6.score <= 49) priorities.push('fortalecimento de recursos internos e capacidade de enfrentamento');
  if (d1.score <= 49) priorities.push('fontes de desgaste e necessidades relacionais não atendidas');

  const tail = priorities.length
    ? `Como material de apoio clínico, pode ser útil explorar: ${priorities.join('; ')}.`
    : 'Os resultados devem ser compreendidos em conjunto com a história, o contexto atual e a avaliação profissional.';

  return `${sentences.join(' ')} ${tail} Este resultado não estabelece diagnóstico nem determina uma decisão conjugal.`;
}
