# ICAPS — Matriz Fonte → Alegação

Esta matriz explicita o nível de sustentação disponível para cada componente do ICAPS. Ela não atribui validação psicométrica inexistente.

| Componente | Fonte imediata | Alegação permitida | Alegação não permitida | Status de sustentação |
|---|---|---|---|---|
| Escala Likert 1–5 | Definição canônica `data/icaps-v2.json` | O paciente registra grau de concordância de 1 a 5 | Que a escala, por si só, possui validade diagnóstica | Estrutura operacional |
| Conversão 1→0, 2→25, 3→50, 4→75, 5→100 | `js/scoring.js` | Normalização linear para facilitar comparação entre dimensões | Que 75 ou outro valor seja ponto de corte clínico validado | Regra computacional |
| D1 — Satisfação Conjugal Atual | Itens 1–10 | Maior escore = maior concordância com itens de satisfação, afeto, respeito, comunicação e parceria | Diagnóstico da qualidade global do relacionamento | Construção clínica autoral; validação psicométrica externa não documentada |
| D2 — Ambivalência Decisional | Itens 11–20 | Maior escore = maior concordância com itens de dúvida, oscilação, adiamento e conflito decisional | Incapacidade decisional ou indicação de separação | Construção clínica autoral; validação psicométrica externa não documentada |
| D3 — Codependência e Subjugação Pessoal | Itens 21–30 | Maior escore = maior concordância com itens sobre limites, culpa, rejeição, anulação e centralidade da relação | Diagnóstico de codependência, dependência ou abuso | Construção clínica autoral; validação psicométrica externa não documentada |
| D4 — Traição e Impacto Emocional | Itens 31–40 | Maior escore = maior concordância com itens sobre sofrimento associado a experiências de traição | Prova de ocorrência de traição ou diagnóstico de trauma | Construção clínica autoral; validação psicométrica externa não documentada |
| D5 — Rede de Apoio e Medos Contextuais | Itens 41–50 | Maior escore = maior concordância com itens sobre julgamento, família, finanças, solidão, filhos e recomeço | Medida objetiva da rede de apoio ou vulnerabilidade socioeconômica | Construção clínica autoral; validação psicométrica externa não documentada |
| D6 — Recursos Internos e Prontidão para a Mudança | Itens 51–60 | Maior escore = maior concordância com itens de força percebida, autocuidado, lucidez e capacidade de enfrentar consequências | Aptidão objetiva para separar-se ou previsão de desfecho | Construção clínica autoral; validação psicométrica externa não documentada |
| Faixas 0–24 / 25–49 / 50–74 / 75–100 | `data/icaps-v2.json` interpretação 2.1 | Organização descritiva da intensidade de concordância | Pontos de corte psicométricos, diagnóstico ou norma populacional | Heurística operacional explícita |
| Neutralidade 3/5 = 50 | Escala e scoring canônicos | 50 deve ser tratado como região intermediária | Classificar neutralidade integral como elevada/importante | Regra sanitizada 2.1 |
| Itens de atenção clínica | Processador de relatório | Destacar respostas de maior intensidade para revisão em sessão | Tratar item isolado como diagnóstico, fato ou risco confirmado | Recurso auxiliar clínico |
| Síntese integrada | Processador de relatório | Produzir hipóteses de exploração baseadas no padrão de respostas | Formular diagnóstico ou prescrever decisão conjugal | Inferência clínica assistida, sujeita à revisão profissional |
| SATEPSI | CFP / Resolução CFP nº 31/2022 | O ICAPS não deve ser apresentado como teste psicológico reconhecido sem requisitos técnico-científicos aplicáveis | Alegar aprovação/registro inexistente | Referência regulatória externa |
| Dados de saúde/privacidade | LGPD / ANPD | Respostas vinculadas a pessoa natural podem exigir proteção reforçada como dados pessoais sensíveis | Tratar dados clínicos como informação comum ou para publicidade | Referência legal/regulatória externa |

## Regras de redação obrigatórias

Preferir:

- “faixa descritiva”;
- “o padrão de respostas sugere”;
- “pode ser útil explorar”;
- “hipótese para investigação clínica”;
- “indicadores autorreferidos”.

Evitar:

- “o teste comprovou”;
- “o paciente é codependente”;
- “há abuso/toxicidade” sem avaliação própria;
- “deve separar-se” ou “deve permanecer”;
- “ponto de corte clínico”;
- “diagnóstico” como produto automático do ICAPS.

## Fontes regulatórias externas

- SATEPSI/CFP: https://satepsi.cfp.org.br/
- Legislação SATEPSI: https://satepsi.cfp.org.br/legislacao.cfm
- ANPD — Perguntas Frequentes/LGPD: https://www.gov.br/anpd/pt-br/acesso-a-informacao/perguntas-frequentes/perguntas-frequentes
