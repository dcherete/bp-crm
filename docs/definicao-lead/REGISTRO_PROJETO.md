# Registro do projeto — definição de Lead e rota até a venda

Registro cronológico das decisões, achados, correções e mudanças de direção. A
regra vigente está consolidada em `ESPECIFICACAO_DEFINICAO_LEAD.md`.

## 2026-09-04 — Curadoria da narrativa executiva

Foi identificado que o artifact acumulava análises válidas, tentativas
descartadas, correções e decisões na mesma narrativa. Isso dificultava distinguir
o que está vigente do que era apenas histórico.

Decisão de curadoria:

- retirar integralmente o Método 2 do artifact e da especificação vigente;
- motivo: faturamento por idade da coorte não mede atividade atual, não descobre
  os estados e não acompanha a evolução da pessoa entre eles;
- manter o Método 2 somente neste registro histórico e nos arquivos analíticos,
  para preservar rastreabilidade;
- manter no artifact apenas definição vigente, estoque, conversão futura,
  reengajamento, árvore de sobrevivência, teste direto da taxonomia e próximos
  passos;
- remover do artifact explicações de erros já corrigidos, como a contaminação de
  ex-membros e o falso pico anual;
- apresentar a regra de 90 dias como decisão operacional sustentada e os
  subestados de 15/90 dias como provisórios.

Também foram adicionados ao artifact dois gráficos do holdout de março/2026,
com conversão em 179 dias e intervalos de confiança por estado e público. O
gráfico técnico completo da árvore ficou disponível como detalhe expansível.

## 2026-09-04 — Do rótulo operacional à descoberta dos estados

### Pergunta

Como provar a definição de cada estado — Somente Lead, Prospect e Oportunidade —
em vez de apenas martelar os thresholds?

### Decisão metodológica

Foi acordada a sequência:

1. árvore de sobrevivência interpretável para descobrir/validar eventos e cortes;
2. modelo multiestado semi-Markov para prever transições e tempo até mudança;
3. holdout para medir efeito causal das ações;
4. Bellman/MDP para escolher a ação de maior valor futuro.

Esclarecimento: Bellman não estima transições. Ele precisa receber
`P(estado futuro | estado atual, ação)` e uma recompensa confiável.

### Desenho e extração da árvore

- Alvo: tempo até primeira compra em até 180 dias.
- Censura: quem não compra até 180 dias é censurado, não rotulado como comprador
  negativo definitivo.
- Fotografias: 2025-09-01 a 2026-03-01.
- Features: recência e frequência de fundo de funil, produto/oferta, comercial,
  resposta CRM, conteúdo/produto e cadastro.
- Populações: não-membro e ex-membro; Cliente é excluído as-of em cada snapshot.
- Prevenção de leakage: somente eventos anteriores ao snapshot entram nas features.
- Amostra determinística de 2% por pessoa, estável entre snapshots.
- Resultado da extração: 700.923 pessoa-snapshots e 10.933 compras.

Arquivos: `sql/25_coorte_arvore_sobrevivencia.sql`,
`extrair_coorte_sobrevivencia.py` e
`data/analysis/coorte_arvore_sobrevivencia.parquet`.

### Ajuste, correção do desenho e validação temporal

A primeira árvore usou folha mínima de 2% da população completa. Como
Oportunidade é um estado pequeno, esse desenho tinha pouca capacidade de
descobrir seus limites. O desenho foi corrigido para dois problemas separados:

1. árvore na base completa, com folha mínima de 2%, para a fronteira Lead ativo
   × Contato;
2. árvore somente em pessoas com sinal em até 90 dias, com folha mínima de 1%,
   para descobrir os subestados internos.

As recências foram limitadas a 366 dias para que o código sentinela de “nunca”
não produzisse cortes artificiais de milhares de dias. Treino: set–dez/2025;
seleção: jan–fev/2026; teste final: mar/2026.

Resultados da fronteira externa:

- ex-membro: primeiro corte em 85,5 dias; C-index no teste 0,633;
- não-membro: sinais de funil/comercial dominam; sem esses sinais, cortes em
  30,5 e 156,5 dias; C-index no teste 0,655.

Resultado: a árvore sustenta diretamente aproximadamente 90 dias em
ex-membros. Para não-membros, não encontra um único threshold universal; 90
dias continua sendo a síntese operacional dos três métodos, não uma lei natural.

Nas árvores internas, os cortes mais interpretáveis foram 22,5 dias para
comercial, 45,5 para fundo de funil e 79,5 para produto/oferta em não-membros;
em ex-membros, 85,5 dias para fundo de funil e frequência comercial recente.
Logo, o corte de 15 dias ainda não está validado.

### Teste direto dos estados operacionais

Na fotografia de teste de março/2026, com 179 dias de acompanhamento:

| Público | Oportunidade | Prospect | Somente Lead | Contato |
|---|---:|---:|---:|---:|
| Não-membro | 10,43% | 9,32% | 1,88% | 0,82% |
| Ex-membro | 6,37% | 6,50% | 9,85% | 3,67% |

Oportunidade e Prospect não são estatisticamente diferentes: `p = 0,537` em
não-membros e `p = 0,878` em ex-membros. Prospect supera Somente Lead nos
não-membros (`p < 0,001`), mas ocorre o inverso nos ex-membros: Somente Lead
supera Prospect em 3,35 p.p. (`p < 0,001`). Somente Lead supera Contato nos dois
públicos (`p < 0,001`).

Decisão: manter a fronteira externa de 90 dias como regra operacional v1 e
marcar os subestados como provisórios. Não usar a mesma hierarquia interna para
ex-membros sem revisar eventos e definições. Há indício de que conteúdo/produto,
hoje agrupado em Somente Lead, qualifica melhor o ex-membro; também é necessário
confirmar se eventos Zenvia são realmente voluntários e inbound.

Arquivos: `ajustar_arvore_sobrevivencia.py`, `avaliar_taxonomia_atual.py` e
saídas `data/analysis/arvore_sobrevivencia_*`,
`data/analysis/validacao_taxonomia_atual.csv` e
`data/analysis/testes_taxonomia_atual.csv`.

## 2026-09-03 — Definição operacional de Lead ativo

### Problema inicial

A regra anterior chamava de Lead quem havia interagido nos últimos 365 dias. Não
havia prova de que 365 fosse o threshold natural; 90, 180 ou outra janela também
poderiam ser escolhidos.

### Interação voluntária qualificada

Foi separada a ação da pessoa dos toques da empresa. Clique, resposta, navegação,
conteúdo, produto/oferta, conversa iniciada e fundo de funil são sinais. Entrega,
abertura/leitura passiva, impressão, evento técnico, ação unilateral, bounce,
opt-out e churn não são.

### Três métodos examinados

1. Conversão futura após diferentes tempos de silêncio.
2. Faturamento marginal por idade da coorte original.
3. Reengajamento futuro após diferentes tempos de silêncio.

Métodos 1 e 3 encontraram a fronteira comportamental principal em 71–83 dias. A
decisão operacional arredondou para 90 dias. Método 2 foi mantido como evidência
de valor econômico residual, não como prova do corte.

### Regra aprovada

> Aos 90 dias, a pessoa sem uma interação voluntária qualificada deixa de ser
> Lead ativo, mas não perde necessariamente o valor econômico. Ela vira Contato
> de reativação e passa a receber uma estratégia de menor custo.

### Estados vigentes

- Cliente: assinatura ativa.
- Oportunidade: fundo de funil em 0–15 dias.
- Prospect: produto/oferta em 0–90 dias ou fundo de funil em 16–90 dias.
- Somente Lead: outro sinal qualificado em 0–90 dias.
- Contato de reativação: fora da janela, com canal vivo.
- Contato inativo: fora da janela, sem canal vivo.

Oportunidade, Prospect e Somente Lead formam Lead ativo total.

### Estoque recalculado

Em 2026-09-03, sobre 6.136.896 pessoas identificadas no Insider:

- Cliente: 627.123;
- Oportunidade: 19.951;
- Prospect: 122.110;
- Somente Lead: 457.951;
- Lead ativo total: 600.012;
- Contato de reativação: 4.285.251;
- Contato inativo: 624.510.

Consulta: `sql/22_stock_definicao_lead_90d.sql`.

### Sensibilidade do estoque

Entre 5.509.773 não clientes do Insider, usando a mesma whitelist:

| Janela | Leads ativos | % dos não clientes |
|---:|---:|---:|
| 30 dias | 173.551 | 3,1% |
| 60 dias | 412.555 | 7,5% |
| 90 dias | 600.012 | 10,9% |
| 120 dias | 795.853 | 14,4% |
| 180 dias | 1.330.172 | 24,1% |
| 270 dias | 1.845.509 | 33,5% |
| 365 dias | 2.162.685 | 39,3% |

Consulta: `sql/23_sensibilidade_estoque_lead.sql`.

### Correção da janela interna

Uma primeira contagem usou 90 dias para Oportunidade e produziu mais
Oportunidades que Prospects. A regra foi corrigida para 15 dias; sinais de fundo
de funil com 16–90 dias passaram a Prospect. O total de Lead ativo não mudou.

Auditoria: `sql/24_auditoria_oportunidade_prospect.sql` e
`data/analysis/auditoria_oportunidade_prospect.csv`.

### Correção do Método 2 para ex-membros

A consulta inicial aceitava uma pessoa como ex-membro quando uma assinatura
expirava, mesmo havendo outra ativa. Isso criou um pico artificial perto de 365
dias. A auditoria encontrou R$ 30,9M contaminados contra R$ 10,9M em episódios
válidos entre os períodos 9–13 meses.

A regra corrigida exige ausência de assinatura ativa na origem pós-churn. O pico
de 330–359 dias caiu de R$ 13,95 para R$ 3,79 por Lead. Não restou evidência de
sazonalidade anual. Consulta: `sql/21_faturamento_marginal_por_idade_lead.sql`.

### Interpretação do Método 2

`F(m) = faturamento no período m / Leads maduros para observar m`.

Lead maduro é quem teve tempo cronológico suficiente para completar o período.
Para 90–119 dias, por exemplo, a origem precisa ter pelo menos 120 dias. Quem
comprou antes permanece no denominador e gera zero depois, pois só a primeira
compra é medida. Novas interações não reiniciam o relógio analítico.

Conclusão posterior: isso mede idade de coorte, não a evolução entre os andares
da taxonomia. Para transições, será usado o modelo multiestado.

### Publicação

O artifact foi publicado em:
https://dcherete.github.io/bp-crm/definicao-lead/

Repositório público: `dcherete/bp-crm`, pasta `docs/definicao-lead/`.
Primeiro commit de publicação: `3c262f1`.

Observação: toda alteração local posterior deve ser sincronizada novamente com o
repositório público.
