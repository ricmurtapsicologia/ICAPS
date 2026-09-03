# ICAPS 2.0 — scoring/interpretação 2.1

Fonte canônica do Inventário Clínico para Avaliação de Prontidão para Separação.

## Estado canônico

- Instrumento: `2.0.0` — os 60 itens foram preservados.
- Scoring: `2.1.0` — fórmula determinística 0–100 preservada; versionamento explícito.
- Interpretação: `2.1.0` — faixas tratadas como **descritivas e operacionais**, não como pontos de corte psicométricos validados.
- `data/icaps-v2.json`: definição canônica dos 60 itens, escala, dimensões, faixas e linguagem interpretativa.
- `js/scoring.js`: motor determinístico de pontuação.
- `js/submission.js`: envio ao gateway verificado; o navegador não posta mais diretamente no Google Forms.
- `tests/`: regressão, preflight e stress/Monte Carlo determinístico.
- `privacidade.html`: aviso de privacidade do fluxo clínico.
- `docs/NOTA-TECNICA-ICAPS-2.1.md`: limites, rastreabilidade e regras de interpretação.
- `docs/MATRIZ-FONTE-ALEGACAO.md`: matriz construto → itens → cálculo → interpretação → nível de sustentação.

## Regra metodológica

O ICAPS é um instrumento clínico estruturado de apoio. **Não constitui teste psicológico diagnóstico, não possui pontos de corte psicométricos validados e não deve determinar isoladamente continuidade ou término da relação.** Os escores e faixas organizam respostas autorreferidas para discussão clínica.

A alternativa `3 — Nem concordo, nem discordo` corresponde a 50/100. Na versão de interpretação 2.1, 50 pertence deliberadamente a uma **faixa intermediária** em todas as dimensões, evitando transformar neutralidade em classificação clinicamente elevada.

## Fluxo de dados

`Paciente → GitHub Pages → gateway Vercel /api/icaps_submit → Google Forms/Sheets → processador clínico → relatório profissional`

O gateway valida versão, identificação, conjunto exato de 60 respostas e valores Likert 1–5. O frontend só apresenta confirmação de registro quando o gateway devolve `persisted: true`.

O código clínico do paciente pode ser fornecido em link individualizado por `?patient_code=CODIGO`; ele não é exibido na interface.

## Publicação

O workflow `.github/workflows/quality.yml` executa regressão e Monte Carlo em todo push/PR. O preflight deve permanecer verde antes do congelamento de uma versão.

## Dependências visuais

As imagens Open Graph/Twitter e o banner visual continuam hospedados no Pinterest deliberadamente, preservando a identidade visual existente do produto.
