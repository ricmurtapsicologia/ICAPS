# ICAPS — Processador clínico por Gmail

Estado sanitizado:

- Instrumento: 2.0.0
- Scoring: 2.1.0
- Interpretação: 2.1.0
- Processor: 2.2.0

O frontend do paciente permanece no GitHub Pages, mas não envia mais diretamente ao Google Forms. O envio passa pelo gateway Vercel, que valida o conjunto de 60 respostas e só confirma sucesso após retorno do serviço de persistência. O processamento clínico continua na planilha vinculada ao Forms.

## Instalação/autorização única

1. Abra a planilha **Respostas — ICAPS – Inventário Clínico para Avaliação de Prontidão para Separação**.
2. Vá a **Extensões → Apps Script** e substitua o conteúdo de `Code.gs` pelo arquivo `ICAPSProcessor.gs` desta pasta.
3. Salve e execute `installICAPSProcessor()` uma única vez.
4. Autorize Google Sheets e envio de e-mail quando o Google solicitar.
5. A função instala o gatilho `onFormSubmit` e executa o backfill das respostas ainda não processadas.

Após a autorização, novas respostas em `Form Responses 1` são pontuadas automaticamente, registradas em `ICAPS_REPORTS`/`ICAPS_SYNC` e enviadas ao Gmail da conta que instalou o gatilho.

O processador é idempotente por linha de origem: registros que já constem em `ICAPS_SYNC` com `email_status = SENT` não são reenviados.

## Relatório

O e-mail HTML contém:

- identificação e versionamento;
- visão executiva;
- perfil dimensional;
- prioridades para exploração clínica;
- integração entre dimensões;
- **Itens de atenção clínica**;
- recursos autorreferidos;
- 60 respostas completas;
- nota metodológica.

Os blocos analíticos usam alinhamento justificado. As faixas são explicitamente descritivas e não constituem pontos de corte psicométricos validados.

## Dependência de autorização

A criação do gatilho instalável e a autorização para envio de e-mail exigem ação autenticada do titular da conta Google. Copiar o arquivo para o repositório não instala nem autoriza o gatilho por si só.
