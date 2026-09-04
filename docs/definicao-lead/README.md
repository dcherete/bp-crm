# Definição de Lead — Brasil Paralelo

Documentação pública da taxonomia candidata v2, derivada de árvores de
sobrevivência separadas para não-membros e ex-membros.

## Acessos

- [Artifact executivo](https://dcherete.github.io/bp-crm/definicao-lead/)
- [Proposta canônica v2](PROPOSTA_ESTADOS_V2.md)
- [Especificação v1 arquivada](ESPECIFICACAO_DEFINICAO_LEAD.md)
- [Registro cronológico](REGISTRO_PROJETO.md)
- [Validação mensal e holdout](data/validacao_taxonomia_candidata_v2.csv)
- [Testes estatísticos](data/testes_taxonomia_candidata_v2.csv)
- [Estoque completo](data/stock_taxonomia_candidata_v2.csv)

## Proposta v2

Lead ativo é uma pessoa identificada, não cliente, com pelo menos uma interação
voluntária qualificada nos últimos 90 dias.

```text
Não-membro: Oportunidade > Prospect > Somente Lead > Contato
Ex-membro:  Oportunidade de reativação > Lead reengajado > Contato
```

Fundo de funil define Oportunidade em ambos os públicos. Prospect existe apenas
para não-membro e exige primeira mensagem ou produto/oferta. Dentro dos 90 dias,
recência define prioridade e SLA, não outro estado.

## Status da evidência em 04/09/2026

- A ordem recomendada apareceu em 7 de 7 snapshots mensais.
- No holdout de 179 dias, não-membro converteu 14,19% / 9,20% / 1,93% / 0,85%.
- Ex-membro converteu 17,88% / 8,80% / 3,70%.
- Todas as fronteiras foram significativas; menor separação: `p=0,015`.
- `conversation_started` foi excluído por contaminação do vendedor.
- O corte interno de 15 dias foi rejeitado.

Status: recomendação validada preditivamente, pendente de aprovação e implantação
operacional. A transição será modelada depois; Bellman só entra após medição
causal das ações.

O artifact executivo apresenta somente as análises que respondem à definição
de Lead: conversão futura, reengajamento e árvore de sobrevivência. A análise de
faturamento por idade da coorte foi retirada por não medir atividade atual nem
transição entre estados; sua passagem permanece apenas no registro histórico.

## Governança

Mudanças na regra devem aparecer juntas na especificação canônica, no registro
cronológico e no artifact. Resultados precisam ser identificados como hipótese,
observação, decisão operacional ou evidência causal.
