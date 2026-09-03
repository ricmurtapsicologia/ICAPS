const PSYCHOLOGIST_WHATSAPP = '5535984640729';

export function buildShareMessage(results, meta) {
  const lines = [
    `ICAPS ${meta.instrumentVersion} — resumo de resultados`,
    '',
    ...results.flatMap(r => [
      `${r.title}`,
      `${r.scoreLabel}: ${r.score}/100 · ${r.band.label}`,
      ''
    ]),
    'Instrumento clínico estruturado de apoio. O resultado não estabelece diagnóstico nem determina decisão conjugal.'
  ];
  return lines.join('\n');
}

export function shareByWhatsApp(results, meta) {
  const ok = window.confirm('O resumo dos resultados contém informação de natureza clínica. Deseja compartilhá-lo voluntariamente pelo WhatsApp com o psicólogo?');
  if (!ok) return false;
  const message = encodeURIComponent(buildShareMessage(results, meta));
  const url = `https://wa.me/${PSYCHOLOGIST_WHATSAPP}?text=${message}`;
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}
