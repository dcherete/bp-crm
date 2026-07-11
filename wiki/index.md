# CRM BP — Projeto Sovereign (estado atual)

## O que é
Substituir Insider por stack própria até 14/09/2026.
Início: 30/03/2026. POC concluída. Deploy em produção pendente.

**Situação contratual (abril/2026):** A Insider fez uma concessão significativa na renovação. O projeto foi pausado com POC concluída e capacidade de produção validada.

## Stack
| Ferramenta | Papel |
|---|---|
| Novu (self-hosted, v3.14.0) | Orquestrador central — email, push, lógica cross-channel |
| PostHog | CDP, analytics, segmentação, gatilhos de jornada |
| Amazon SES | Email em volume (quota: 5.000/s) |
| Firebase FCM | Push mobile e browser |
| painel/index.html | Interface do analista — CRM Hub |
| infra/webhook_relay.py | Bridge Novu → PostHog (com pixel tracking e redirect de clique) |
| WhatsApp | Ferramenta própria BP → Meta Cloud API (independente) |

## Como rodar local
```bash
cd infra && docker compose up -d
python3 webhook_relay.py  # relay na porta 5055
```
Painel: abrir `painel/index.html` no browser.

## Credenciais locais
Configurar via variáveis de ambiente (ver `.env.example`) ou diretamente no painel de configurações do CRM Hub.

- Novu API: `http://localhost:3000`
- Novu Dashboard: `http://localhost:4000`
- Webhook relay: `http://localhost:5055/webhook`

## Próximo passo
Deploy em produção — Oracle Cloud Free Tier (ARM A1: 4 OCPU, 24GB RAM).
Domínios: `api.crm.brasilparalelo.com.br` (Novu) + `painel.brasilparalelo.com.br` (CRM Hub).

## Arquitetura
```
PostHog (comportamento) → webhook → Novu (orquestrador)
                                   ├── SES (email)
                                   └── FCM (push)
                                         ↓ webhooks
                              webhook_relay.py (porta 5055)
                                         ↓
                              PostHog (eventos de canal)
                                         ↓
                              painel/index.html (analista)
```

## CRM Hub — features implementadas
| Seção | Status |
|---|---|
| Dashboard (stats + atalhos) | ✅ |
| Subscribers (listar, add, delete, CSV import) | ✅ |
| Workflows (listar v2, criar, editor visual iframe) | ✅ |
| Segmentos / Topics (CRUD + subscribers) | ✅ |
| Campanhas (wizard 3 passos, dispatch por Topic ou per-subscriber) | ✅ |
| Jornadas (multi-step, webhook PostHog, testar, ativar/pausar) | ✅ |
| Feed de Atividade (tempo real, filtros, auto-refresh 30s) | ✅ |
| Descadastros (opt-out por canal, reativar) | ✅ |
| Supressão (lista de emails bloqueados) | ✅ |
| Configurações (Novu URL + API Key, PostHog host + token) | ✅ |

### localStorage keys
- `crm-cfg` — Novu URL, API Key, PostHog host e token
- `crm-camps` — campanhas (metadados)
- `crm-jornadas` — jornadas configuradas
- `crm-unsubs` — descadastros
- `crm-supp` — lista de supressão

## webhook_relay.py — mapeamento de eventos
| Novu type | PostHog event |
|---|---|
| sent / queued | notification_sent |
| delivered | notification_delivered |
| opened / seen | notification_opened |
| clicked | notification_clicked |
| failed / bounced | notification_failed |
| unsubscribed | notification_unsubscribed |

> Pixel tracking de abertura não funciona em localhost (Gmail não alcança localhost). Em produção funciona automaticamente.

## Volumes operacionais (contrato Insider)
| Canal | Volume mensal | Volume anual |
|---|---|---|
| Email | 104.248.215 | 1.250.978.580 |
| Push (mobile MAU) | 600.000 | 7.200.000 |
| Push (web MTU) | 3.743.066 | 44.916.792 |
| WhatsApp | 1.250.000 | 15.000.000 |
| SMS (inativo) | 500.311 | 6.003.732 |
| Throughput POC local | 372 jobs/s | necessário: 280/s no pico |

## Custos da stack interna (com tributação correta)
| Fornecedor | Tributação | Fator sobre PTAX (5,70) |
|---|---|---|
| AWS (SES, ECS, Redis, LB) | Local — NFS-e BRL, PIS/COFINS + ISS | × 1,13 |
| Firebase FCM | Gratuito | R$ 0 |
| MongoDB Atlas | Internacional, IRRF 15% + IOF 3,5% | × 1,285–1,38 |
| PostHog Cloud | Internacional, IRRF 15% + IOF 3,5% | × 1,285–1,38 |
| Meta API (WhatsApp) | Internacional, fator financeiro confirmado | × 1,4832 |

> A AWS possui entidade local brasileira desde nov/2020 — elimina IRRF, CIDE e IOF.

## Bugs conhecidos
- v2/workflows: response em `r.data.workflows`, não `r.workflows`
- Topics pageSize: limite é 10, não 50 (Novu retorna 422 acima disso)

## Referências
- @wiki/roadmap.md — fases, marcos críticos, riscos
- @raw/novu-poc/contexto.md — contexto completo da POC
- @raw/crm-open-source/plano-diretor-crm.md — plano estratégico (atualizado abr/2026)
- `projeto_sovereign_analise_financeira.md` — análise financeira completa para diretoria (abr/2026)
