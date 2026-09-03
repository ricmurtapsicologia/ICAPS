# ICAPS 2.0 — Processador de relatórios por Gmail

O frontend do paciente continua hospedado no GitHub Pages e envia as respostas silenciosamente ao Google Forms. O processamento clínico ocorre na planilha vinculada ao Forms.

## Instalação única

1. Abra a planilha **Respostas — ICAPS – Inventário Clínico para Avaliação de Prontidão para Separação**.
2. Vá a **Extensões → Apps Script** e substitua o conteúdo de `Code.gs` pelo arquivo `ICAPSProcessor.gs` desta pasta.
3. Salve e execute a função `installICAPSProcessor` uma única vez, autorizando Google Sheets e envio de e-mail quando solicitado.
4. Após a autorização, novas respostas em `Form Responses 1` são pontuadas automaticamente, registradas em `ICAPS_REPORTS`/`ICAPS_SYNC` e enviadas ao Gmail da conta que instalou o gatilho.

`installICAPSProcessor()` também executa `backfillICAPSPending()`. Respostas que já constem em `ICAPS_SYNC` com `email_status = SENT` não são reenviadas.
