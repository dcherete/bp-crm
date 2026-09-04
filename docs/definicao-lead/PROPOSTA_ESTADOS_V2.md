# Proposta de estados v2 — derivada das árvores estritas

**Data:** 2026-09-04
**Status:** recomendação estatisticamente validada fora do tempo; pendente de
aprovação e implantação operacional

## Definição externa

Lead ativo continua sendo a pessoa não cliente com ao menos uma interação
voluntária qualificada nos últimos 90 dias. Acima de 90 dias, passa a Contato.

## Estados recomendados

### Não-membro

1. **Oportunidade:** fundo de funil em até 90 dias.
2. **Prospect:** sem fundo de funil recente, mas com primeira mensagem do
   prospect na Zenvia ou visita a produto/oferta em até 90 dias.
3. **Somente Lead:** outro sinal voluntário qualificado em até 90 dias.
4. **Contato:** mais de 90 dias sem sinal qualificado.

### Ex-membro

1. **Oportunidade de reativação:** fundo de funil em até 90 dias.
2. **Lead reengajado:** outro sinal voluntário qualificado em até 90 dias.
3. **Contato:** mais de 90 dias sem sinal qualificado.

Não criar Prospect para ex-membro nesta versão. Esse agrupamento não apresentou
ordenação consistente em relação aos demais sinais.

## Papel da recência

O corte de 15 dias não foi estável. Dentro dos 90 dias, a recência deve ordenar
prioridade e SLA, mas não determinar sozinha o nome do estado.

## Evidência

A ordem abaixo apareceu nos sete snapshots mensais, inclusive no holdout de
março/2026:

```text
Não-membro: Oportunidade > Prospect > Somente Lead > Contato
Ex-membro:  Oportunidade de reativação > Lead reengajado > Contato
```

Conversão observada em até 179 dias no holdout:

| Público | Estado | Pessoas | Conversão |
|---|---|---:|---:|
| Não-membro | Oportunidade | 444 | 14,19% |
| Não-membro | Prospect | 522 | 9,20% |
| Não-membro | Somente Lead | 9.360 | 1,93% |
| Não-membro | Contato | 81.515 | 0,85% |
| Ex-membro | Oportunidade de reativação | 179 | 17,88% |
| Ex-membro | Lead reengajado | 2.772 | 8,80% |
| Ex-membro | Contato | 11.957 | 3,70% |

No holdout de 179 dias:

- não-membro, Oportunidade vs Prospect: +4,99 p.p.; `p = 0,015`;
- não-membro, Prospect vs Somente Lead: +7,26 p.p.; `p < 0,001`;
- não-membro, Somente Lead vs Contato: +1,08 p.p.; `p < 0,001`;
- ex-membro, Oportunidade vs Lead reengajado: +9,07 p.p.; `p < 0,001`;
- ex-membro, Lead reengajado vs Contato: +5,11 p.p.; `p < 0,001`.

## Estoque completo em 2026-09-03

| Público | Estado | Pessoas |
|---|---|---:|
| Cliente | Cliente | 627.444 |
| Não-membro | Oportunidade | 32.913 |
| Não-membro | Prospect | 47.568 |
| Não-membro | Somente Lead | 371.159 |
| Ex-membro | Oportunidade de reativação | 10.319 |
| Ex-membro | Lead reengajado | 121.509 |
| **Todos** | **Lead ativo total** | **583.468** |

## Exclusão semântica

`conversation_started` não conta como sinal voluntário na v2. A auditoria
encontrou 7,28 milhões de registros no período, dos quais 4,69 milhões tinham
`seller` como último autor. `prospect_first_message` permanece por representar
explicitamente a primeira mensagem da pessoa.

## Arquivos reproduzíveis

- `sql/26_auditoria_semantica_eventos.sql`;
- `sql/27_coorte_arvores_estados_estrita.sql`;
- `sql/28_stock_taxonomia_candidata_v2.sql`;
- `ajustar_arvores_estados_estaveis.py`;
- `validar_taxonomia_candidata_v2.py`;
- `data/analysis/estabilidade_arvores_estados.csv`;
- `data/analysis/validacao_taxonomia_candidata_v2.csv`;
- `data/analysis/testes_taxonomia_candidata_v2.csv`;
- `data/analysis/stock_taxonomia_candidata_v2.csv`.
