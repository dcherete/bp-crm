# Definição de Lead — Brasil Paralelo

Documentação pública da definição operacional e da investigação estatística dos
estados de Lead.

## Acessos

- [Artifact executivo](https://dcherete.github.io/bp-crm/definicao-lead/)
- [Especificação canônica](ESPECIFICACAO_DEFINICAO_LEAD.md)
- [Registro cronológico](REGISTRO_PROJETO.md)
- [Conversão por estado no holdout](data/validacao_taxonomia_atual.csv)
- [Testes estatísticos entre estados](data/testes_taxonomia_atual.csv)

## Regra vigente

Lead ativo é uma pessoa identificada, não cliente, com pelo menos uma interação
voluntária qualificada nos últimos 90 dias.

```text
Oportunidade = fundo de funil em 0–15 dias
Prospect     = produto/oferta em 0–90 dias ou fundo de funil em 16–90 dias
Somente Lead = outro sinal qualificado em 0–90 dias
```

Oportunidade, Prospect e Somente Lead formam o total de Leads ativos. Esta é a
taxonomia operacional v1, não a conclusão final da modelagem.

## Status da evidência em 04/09/2026

- A fronteira externa de 90 dias permanece vigente.
- A árvore de sobrevivência encontrou 85,5 dias para ex-membros.
- Em não-membros, não apareceu um único corte universal: tipo de evento e
  recência interagem.
- Oportunidade e Prospect não diferiram estatisticamente no holdout temporal.
- Em ex-membros, Somente Lead converteu mais que Prospect e Oportunidade; a
  hierarquia interna atual não deve ser tratada como validada.

Próximo passo: auditar eventos e recalibrar os subestados separadamente para
não-membros e ex-membros. A transição será modelada depois e Bellman só entra
após a medição causal das ações.

O artifact executivo apresenta somente as análises que respondem à definição
de Lead: conversão futura, reengajamento e árvore de sobrevivência. A análise de
faturamento por idade da coorte foi retirada por não medir atividade atual nem
transição entre estados; sua passagem permanece apenas no registro histórico.

## Governança

Mudanças na regra devem aparecer juntas na especificação canônica, no registro
cronológico e no artifact. Resultados precisam ser identificados como hipótese,
observação, decisão operacional ou evidência causal.
