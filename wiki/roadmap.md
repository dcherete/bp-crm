# CRM — Roadmap (fases pendentes)

Deadline: 14/09/2026. Decision gate de receita: 30/05/2026.

| Fase | Período | Status | Foco |
|---|---|---|---|
| 0 — Fundação | 30 mar – 4 abr | ✅ Concluída | Decisões, contratos, notificação Insider |
| 1 — Infraestrutura | 30 mar – 25 abr | 🔄 Em andamento | AWS + SES + warmup de domínio |
| 2 — Produto | 20 abr – 4 jul | ⏳ Pendente | crm.html em produção, workflows recriados |
| 3 — Validação | 15 mai – 15 jul | ⏳ Pendente | A/B test receita (GO/NO-GO em 30/mai) |
| 4 — Paralelo | 1 ago – 14 set | ⏳ Pendente | Insider + Novu simultâneos |
| 5 — Go-live | 14 set | ⏳ Pendente | Desligar Insider |

## Marcos críticos restantes
| Data | Marco |
|---|---|
| 25 abr | Infra produção rodando + warmup iniciado |
| 30 mai | Decision gate GO/NO-GO (A/B 20K subscribers) |
| 4 jul | CRM frontend completo, analistas treinados |
| 15 jul | Teste de volume 1,5M aprovado |
| 1 ago | Início período paralelo |
| 14 set | Go-live — Insider cancelada |

## Riscos principais
- Warmup lento de domínio → IPs dedicados SES, monitorar inbox rate semanalmente
- Push tokens presos na Insider → re-captura passiva + período paralelo agosto cobre
- Decision gate falha em maio → investigar causa antes de continuar
