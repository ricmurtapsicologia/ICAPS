# Nota Técnica — ICAPS 2.0 / Scoring e Interpretação 2.1

## 1. Natureza e finalidade

O ICAPS é um instrumento clínico estruturado de apoio à entrevista e ao raciocínio clínico em situações de conflito conjugal e dúvida sobre separação. Não constitui teste psicológico diagnóstico, não possui normas psicométricas validadas e não deve ser utilizado isoladamente para prescrever, recomendar ou determinar continuidade ou término de relacionamento.

O sistema organiza respostas autorreferidas em seis dimensões para facilitar exploração clínica. Os resultados devem ser tratados como **marcadores descritivos e hipóteses para investigação**, nunca como diagnóstico, prova factual ou decisão automatizada.

## 2. Estrutura

- 60 itens.
- 6 dimensões.
- 10 itens por dimensão.
- Escala Likert de 1 a 5.
- Todos os itens da versão 2.0.0 estão em direção alinhada ao construto nomeado.

Dimensões:

1. D1 — Satisfação Conjugal Atual.
2. D2 — Ambivalência Decisional.
3. D3 — Codependência e Subjugação Pessoal.
4. D4 — Traição e Impacto Emocional.
5. D5 — Rede de Apoio e Medos Contextuais.
6. D6 — Recursos Internos e Prontidão para a Mudança.

## 3. Cálculo

Cada resposta é transformada linearmente:

- 1 → 0 pontos
- 2 → 25 pontos
- 3 → 50 pontos
- 4 → 75 pontos
- 5 → 100 pontos

O escore dimensional é a média dos 10 itens, arredondada ao inteiro mais próximo. Em dimensões de risco (D2–D5), o sistema pode calcular adicionalmente um `protectiveScore = 100 - score` para usos computacionais, sem alterar o escore do construto.

## 4. Regra de neutralidade

A alternativa 3 significa literalmente “Nem concordo, nem discordo” e produz 50/100. Na interpretação 2.1, 50 pertence à **faixa intermediária** em todas as dimensões. Essa decisão corrige a versão anterior, na qual o ponto neutro podia receber rótulos como “elevado” ou “indicadores importantes”.

A correção é semântica e de segurança clínica; não representa validação empírica de novos pontos de corte.

## 5. Faixas descritivas

As faixas 0–24, 25–49, 50–74 e 75–100 são mantidas como categorias operacionais para organização da leitura. Elas não devem ser denominadas “cutoffs”, “normas”, “pontos de corte clínicos” ou “faixas diagnósticas”.

A interpretação deve observar, nesta ordem:

1. padrão item a item;
2. heterogeneidade dentro da dimensão;
3. relações entre dimensões;
4. contexto atual e histórico do paciente;
5. entrevista clínica;
6. mudança longitudinal quando houver reaplicação.

## 6. Limites de interpretação

O ICAPS não permite concluir isoladamente:

- presença de transtorno mental;
- presença de abuso ou violência;
- “toxicidade” do relacionamento;
- veracidade objetiva de traição;
- prognóstico do relacionamento;
- necessidade de separação ou permanência;
- capacidade jurídica ou decisional do paciente.

Pontuações elevadas indicam apenas maior concordância autorreferida com os itens do construto nomeado.

## 7. Itens de atenção clínica

Relatórios podem destacar “Itens de atenção clínica” quando uma resposta apresenta intensidade relevante para revisão em sessão. Essa expressão é operacional e não representa categoria psicométrica validada. O item destacado deve ser interpretado no contexto e não convertido em conclusão automática.

## 8. Versionamento

- `instrumentVersion`: muda quando o conteúdo/ordem/direção dos itens muda.
- `scoringVersion`: muda quando fórmula, agregação ou regras computacionais mudam.
- `interpretationVersion`: muda quando bandas, rótulos ou textos interpretativos mudam.

Estado sanitizado:

- instrumento 2.0.0;
- scoring 2.1.0;
- interpretação 2.1.0.

Toda avaliação deve registrar as três versões.

## 9. Segurança e proteção de dados

As respostas podem envolver dados pessoais sensíveis em contexto de saúde. O fluxo deve seguir princípios de finalidade, adequação, necessidade, segurança e transparência da LGPD. A ANPD identifica dados referentes à saúde como dados pessoais sensíveis e remete o tratamento às hipóteses do art. 11 da LGPD.

Referência oficial: https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes

## 10. Relação com SATEPSI

O ICAPS não deve ser apresentado ao público ou utilizado profissionalmente como teste psicológico reconhecido pelo SATEPSI sem o processo técnico-científico e regulatório correspondente. O CFP informa que a Resolução CFP nº 31/2022 regulamenta o SATEPSI e estabelece requisitos mínimos para instrumentos reconhecidos como testes psicológicos.

Referências oficiais:

- https://satepsi.cfp.org.br/
- https://satepsi.cfp.org.br/legislacao.cfm

## 11. Requisitos antes de congelamento

Uma versão só deve ser congelada quando:

- testes automatizados estiverem verdes;
- não houver regressão de neutralidade;
- o fluxo de submissão tiver confirmação de persistência;
- o processamento clínico estiver versionado;
- o aviso de privacidade estiver publicado;
- a integração ponta a ponta tiver sido testada;
- a Auditoria 30/30 não apresentar FAIL impeditivo.
