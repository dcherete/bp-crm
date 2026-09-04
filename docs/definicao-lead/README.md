# Definição de Lead — Brasil Paralelo

Documentação pública da definição operacional e da investigação estatística dos
estados de Lead.

## Acessos

- [Artifact executivo](https://dcherete.github.io/bp-crm/definicao-lead/)
- [Especificação canônica](ESPECIFICACAO_DEFINICAO_LEAD.md)
- [Registro cronológico](REGISTRO_PROJETO.md)

## Regra vigente

Lead ativo é uma pessoa identificada, não cliente, com pelo menos uma interação
voluntária qualificada nos últimos 90 dias.

```text
Oportunidade = fundo de funil em 0–15 dias
Prospect     = produto/oferta em 0–90 dias ou fundo de funil em 16–90 dias
Somente Lead = outro sinal qualificado em 0–90 dias
```

Oportunidade, Prospect e Somente Lead formam o total de Leads ativos. Os limites
internos ainda serão validados por árvore de sobrevivência; a transição será
modelada separadamente e Bellman só entra depois da medição causal das ações.

