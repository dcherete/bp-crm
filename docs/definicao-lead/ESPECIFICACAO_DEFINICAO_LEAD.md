# Especificação canônica — definição de Lead

**Versão:** 2026-09-04
**Status:** regra operacional v1; fronteira externa sustentada e subestados em revisão por público
**Fonte operacional:** `sql/22_stock_definicao_lead_90d.sql`
**Artifact público:** https://dcherete.github.io/bp-crm/definicao-lead/

Este é o documento de referência para humanos e IAs. Quando outro documento do
projeto divergir deste, esta especificação prevalece, salvo decisão posterior
registrada em `REGISTRO_PROJETO.md`.

## 1. Definição central

> **Lead ativo é toda pessoa identificada, não cliente, que realizou ao menos
> uma interação voluntária qualificada nos últimos 90 dias.**

- Oportunidade, Prospect e Somente Lead são subestados mutuamente exclusivos de
  Lead ativo.
- Cliente não é Lead: segue trilha de retenção e upsell.
- Aos 90 dias sem novo sinal qualificado, a pessoa deixa de ser Lead ativo e
  vira Contato de reativação; ela não é apagada e passa para uma régua de menor
  custo.
- Uma nova interação voluntária qualificada reinicia o relógio operacional de
  90 dias.

## 2. Hierarquia e precedência

Aplicar na ordem abaixo. A primeira condição verdadeira determina o estado.

| Ordem | Estado | Regra observável |
|---:|---|---|
| 1 | Cliente | Possui pelo menos uma assinatura ativa na data da fotografia. |
| 2 | Oportunidade | Não é Cliente e teve sinal de fundo de funil há 0–15 dias. |
| 3 | Prospect | Não é Cliente nem Oportunidade e visitou produto/oferta há 0–90 dias, ou teve sinal de fundo de funil há 16–90 dias. |
| 4 | Somente Lead | Não está acima e teve outra interação voluntária qualificada há 0–90 dias. |
| 5 | Contato de reativação | Está fora da janela ativa e possui ao menos um canal próprio de CRM vivo. |
| 6 | Contato inativo | Está fora da janela ativa e não possui canal próprio de CRM vivo. |

Identidade de conjunto:

```text
Lead ativo total = Oportunidade + Prospect + Somente Lead
```

Regressão automática de temperatura:

```text
fundo de funil 0–15d  -> Oportunidade
fundo de funil 16–90d -> Prospect
>90d sem novo sinal   -> Contato de reativação ou inativo
```

Novo fundo de funil faz a pessoa voltar imediatamente para Oportunidade.

## 3. Interação voluntária qualificada

É uma ação identificada iniciada pela pessoa ou uma reação inequívoca dela.

Conta na whitelist v1:

- cadastro ou novo lead identificado;
- clique/resposta em email, WhatsApp ou SMS;
- entrada/sessão originada por push;
- consumo ou navegação identificada de produto/conteúdo;
- visita a listagem, produto, plano ou oferta;
- conversa comercial ou primeira mensagem classificada como sinal da pessoa;
- carrinho, boleto, pagamento aguardando ou abandono de pagamento.

Não conta:

- envio ou entrega de mensagem;
- abertura de email ou leitura passiva de WhatsApp;
- impressão de push ou anúncio;
- evento técnico, bounce, opt-out ou descadastro;
- ação unilateral do vendedor;
- churn isolado;
- homepage ou sessão genérica quando não prova intenção.

Os nomes técnicos vigentes estão em `sql/22_stock_definicao_lead_90d.sql`. A
whitelist ainda precisa de governança de direção dos eventos da Zenvia, remoção
de bots/testes e versionamento quando o tracking mudar.

## 4. Relógio operacional

Usado para classificar a pessoa hoje. Reinicia em toda nova interação voluntária
qualificada. Controla as janelas de 15 e 90 dias.

## 5. Evidência para 90 dias

- Método 1: mede compra futura conforme aumenta o silêncio desde a última
  interação qualificada. Mudança de regime: 83 dias para não-membro e 76 dias
  para ex-membro; com restrição mínima de população, não-membro vai a 90 dias.
- Método 3: mede a chance de nova interação nos 30 dias seguintes conforme o
  silêncio. Cortes: 71 dias para não-membro e 21/80 dias para ex-membro.
- Síntese: os métodos comportamentais colocam a fronteira principal em 71–83
  dias. A operação adotou 90 dias como corte arredondado, conservador e simples.
Os Métodos 1 e 3 compartilham o mesmo eixo de silêncio e não são evidências
totalmente independentes: o primeiro observa compra; o terceiro, reengajamento.

## 6. Estoque da fotografia de 2026-09-03

Universo: 6.136.896 pessoas identificadas no Insider, deduplicadas por
`dim_person_identity`.

| Estado | Pessoas | Observação |
|---|---:|---|
| Cliente | 627.123 | 10,2% da base |
| Oportunidade | 19.951 | 3,3% dos Leads ativos |
| Prospect | 122.110 | 20,4% dos Leads ativos |
| Somente Lead | 457.951 | 76,3% dos Leads ativos |
| **Lead ativo total** | **600.012** | **9,8% da base** |
| Contato de reativação | 4.285.251 | 69,8% da base |
| Contato inativo | 624.510 | 10,2% da base |

Reachability na mesma fotografia: 5.499.011 pessoas (89,6%) possuem ao menos um
canal vivo pelos flags atuais. O número é diferente de Contato inativo porque
Cliente ou Lead ativo conserva seu estado prioritário mesmo que esteja sem canal.

## 7. O que já foi corrigido

As correções abaixo são histórico metodológico. Elas não fazem parte da prova
vigente e não devem ser levadas ao artifact executivo.

### Contaminação de ex-membros

A primeira versão do Método 2 tratava a expiração de uma assinatura como churn,
mesmo quando a pessoa possuía outra assinatura ativa. Isso produziu um falso pico
de faturamento perto de 12 meses. Entre os períodos auditados de 9–13 meses,
R$ 30,9 milhões vinham de episódios contaminados, contra R$ 10,9 milhões de
ex-membros válidos.

A consulta passou a exigir interação estritamente posterior ao churn e ausência
de qualquer assinatura ativa na origem. O valor em 330–359 dias caiu de R$ 13,95
para R$ 3,79 por Lead; em 360–389 dias ficou em R$ 3,91, com intervalos de
confiança sobrepostos aos vizinhos. Não há evidência de pico anual.

O Método 2 foi posteriormente retirado da especificação executiva: faturamento
por idade da coorte não define a fronteira de atividade nem os estados. Ele
permanece apenas no registro histórico para evitar que a análise seja reutilizada
com uma interpretação errada.

### Janela errada de Oportunidade

A primeira contagem aplicou 90 dias também a Oportunidade, gerando 95.713
Oportunidades e apenas 46.344 Prospects. A regra correta usa 15 dias para fundo
de funil e rebaixa sinais de 16–90 dias para Prospect. O total de Leads ativos
permaneceu praticamente igual; mudou apenas a distribuição interna.

## 8. Validação da árvore de sobrevivência — 2026-09-04

Foi ajustada uma árvore de sobrevivência real (`sksurv.tree.SurvivalTree`), com
treino em set–dez/2025, seleção em jan–fev/2026 e teste final fora do tempo em
mar/2026. O alvo é tempo até primeira compra em 180 dias, com censura.

### Fronteira Lead ativo × Contato

- **Ex-membro:** o primeiro corte da árvore foi 85,5 dias desde qualquer sinal
  qualificado. É evidência independente compatível com a regra operacional de
  90 dias.
- **Não-membro:** a árvore separou primeiro sinais de funil e comercial; entre
  pessoas sem esses sinais recentes, encontrou cortes de 30,5 e 156,5 dias.
  Portanto, a árvore não encontrou um único corte natural universal de 90 dias
  para não-membros. Os 90 dias permanecem uma síntese operacional conservadora,
  apoiada também pelos Métodos 1 e 3.
- Discriminação no teste temporal: C-index 0,655 para não-membro e 0,633 para
  ex-membro. O modelo separa risco, mas ainda não é uma classificação definitiva.

### Subestados dentro dos 90 dias

Em árvores ajustadas somente entre Leads ativos, os principais cortes foram:

- não-membro: comercial em 22,5 dias, fundo de funil em 45,5 dias e
  produto/oferta em 79,5 dias;
- ex-membro: fundo de funil em 85,5 dias e frequência comercial recente.

Esses cortes não validam o limite interno único de 15 dias. Eles indicam que os
subestados devem ser diferentes por público ou, no mínimo, recalibrados.

### Teste direto da taxonomia vigente

Conversão observada na fotografia de março/2026, acompanhada por 179 dias:

| Público | Oportunidade | Prospect | Somente Lead | Contato |
|---|---:|---:|---:|---:|
| Não-membro | 10,43% | 9,32% | 1,88% | 0,82% |
| Ex-membro | 6,37% | 6,50% | 9,85% | 3,67% |

- Não-membro: Prospect supera Somente Lead em 7,44 p.p. (`p < 0,001`) e
  Somente Lead supera Contato em 1,05 p.p. (`p < 0,001`). Oportunidade versus
  Prospect não é estatisticamente diferente (`p = 0,537`).
- Ex-membro: Oportunidade e Prospect não diferem (`p = 0,878`); Somente Lead
  supera Prospect em 3,35 p.p. (`p < 0,001`) e Contato em 6,18 p.p.
  (`p < 0,001`). A ordem operacional vigente falha nesse público.

Conclusão: manter 90 dias como regra externa v1; não declarar 15 dias nem a
hierarquia interna como provados. Antes de automatizar decisões, auditar a
direção dos eventos comerciais/Zenvia e propor definições específicas para
não-membro e ex-membro.

Arquivos reproduzíveis:

- `ajustar_arvore_sobrevivencia.py`;
- `avaliar_taxonomia_atual.py`;
- `data/analysis/arvore_sobrevivencia_resumo.json`;
- `data/analysis/arvore_sobrevivencia_folhas.csv`;
- `data/analysis/arvore_sobrevivencia_regras.txt`;
- `data/analysis/validacao_taxonomia_atual.csv`;
- `data/analysis/testes_taxonomia_atual.csv`.

## 9. Limites do que foi provado

- Os 90 dias estão sustentados para separar sinal recente de histórico.
- O limite de 15 dias e a separação Oportunidade/Prospect não foram validados
  estatisticamente; no holdout, esses estados não diferem em nenhum público.
- A taxonomia interna de ex-membros é contradita pelos dados observados: sinais
  hoje classificados como Somente Lead carregam maior conversão.
- Faturamento observado não é receita incremental causada pelo CRM.
- Ações históricas são enviesadas pela régua vigente. A melhor ação só pode ser
  tratada como causal após holdout ou experimento equivalente.

## 10. Plano estatístico vigente

1. **Definir/validar estados:** árvore de sobrevivência interpretável encontra
   eventos e cortes temporais que separam distribuições de tempo até compra.
2. **Prever transições:** modelo multiestado semi-Markov estima próximo estado e
   tempo até a mudança, permitindo saltos e regressões.
3. **Medir efeito das ações:** holdout estima como canal, pressão ou espera muda
   transições, receita, custo e fadiga.
4. **Escolher a ação:** Bellman usa transições condicionais à ação e recompensa
   causal para maximizar valor futuro. Bellman não mede as transições.

Extração e primeiro ajuste concluídos para o passo 1:

- arquivo: `data/analysis/coorte_arvore_sobrevivencia.parquet`;
- 700.923 pessoa-snapshots;
- 10.933 compras observadas em até 180 dias;
- snapshots mensais de 2025-09-01 a 2026-03-01;
- validação temporal final em março/2026;
- consulta: `sql/25_coorte_arvore_sobrevivencia.sql`;
- extrator: `extrair_coorte_sobrevivencia.py`.

O primeiro ajuste valida capacidade preditiva e testa a taxonomia vigente. Ele
não encerra a descoberta dos estados: ainda são necessárias estabilidade
temporal, auditoria semântica dos eventos e calibração separada por público.
