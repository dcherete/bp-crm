# Projeto Sovereign

Replacing Insider CDP with an open stack: PostHog, Novu, Amazon SES, and Firebase FCM.

**Status: paused.** The POC concluded and production capacity was confirmed. The project is on hold after Insider made a significant concession in the contract renewal negotiation, which changed the financial case for proceeding. The stack, architecture, and CRM Hub remain functional and available for resumption.

---

## The problem

Brasil Paralelo runs CRM on Insider CDP: 6.2M leads, 800K active subscribers, 7 channels, roughly 104M emails per month. The contract cost was significant, and any renewal would extend the lock-in for two more years.

The decision to build a replacement came from a simple question: what does it cost to own this stack instead of renting it?

The answer, modeled across five scenarios, depends almost entirely on the WhatsApp routing decision. The internal stack trades a higher infrastructure cost for zero vendor lock-in and full control over each component.

---

## Stack

| Component | Role |
|---|---|
| PostHog | CDP: behavioral data, user identity, segmentation, journey triggers via webhooks |
| Novu (self-hosted) | Notification orchestrator: routes triggers to email, push, in-app |
| Amazon SES | Email at volume (104M/month, 5,000 msg/s quota) |
| Firebase FCM | Mobile and web push (free) |
| CRM Hub (`painel/`) | Analyst interface: campaign builder, journey editor, subscriber management |
| `webhook_relay.py` | Bridge: Novu delivery events back into PostHog, with click redirect and open pixel |

---

## Architecture

```
PostHog ──── actions / webhooks ────► Novu (self-hosted)
(CDP, events, segments)                    │
    ▲                                      ├──► Amazon SES (email)
    │                                      └──► Firebase FCM (push)
    │                                               │
    └──────────── webhook_relay.py ◄────────────────┘
                  port :5055
                  (delivery events,
                   open pixel,
                   click redirect)
                        │
                  CRM Hub (painel/index.html)
```

**Data flow:**

1. PostHog captures user behavior (page views, purchases, plan changes, CRM events)
2. An Action in PostHog fires a webhook when a user matches a condition (e.g., lapsed 90 days, score above threshold)
3. Novu receives the webhook and dispatches the configured workflow: email via SES, push via FCM, or in-app
4. Novu fires delivery webhooks back to `webhook_relay.py`
5. The relay translates Novu event types into PostHog events (`notification_sent`, `notification_opened`, `notification_clicked`) and writes them back to PostHog
6. The analyst sees the full loop in the CRM Hub: send, deliver, open, click, convert

---

## CRM Hub

The CRM Hub (`painel/index.html`) is a single-file interface with no build step. It runs in the browser against the local Novu API.

| Section | Status |
|---|---|
| Dashboard (stats, shortcuts) | Done |
| Subscribers (list, add, delete, CSV import) | Done |
| Workflows (list, create, visual editor via iframe) | Done |
| Segments / Topics (CRUD, subscriber assignment) | Done |
| Campaigns (3-step wizard, dispatch by segment or per-subscriber) | Done |
| Journeys (multi-step, PostHog webhook trigger, test, activate/pause) | Done |
| Activity feed (real-time, filters, 30s auto-refresh) | Done |
| Unsubscribes (opt-out by channel, reactivation) | Done |
| Suppression list | Done |
| Settings (Novu URL + API Key, PostHog host + token) | Done |

---

## Quick start

Requirements: Docker, Python 3.11+

```bash
# Start Novu
cd infra && docker compose up -d

# Start the webhook relay
python3 infra/webhook_relay.py   # port 5055

# Open the CRM Hub
open painel/index.html
```

Configure credentials in the Settings panel of the CRM Hub, or copy `.env.example` to `.env`.

Default local config:
- Novu API: `http://localhost:3000`
- Novu Dashboard: `http://localhost:4000`
- PostHog: `https://us.posthog.com`

---

## POC results

Load test on Oracle Cloud Free Tier (ARM A1: 4 OCPU, 24GB RAM):

| Metric | Result | Needed |
|---|---|---|
| Novu jobs/second | 372 | 280 (peak) |
| SES throughput | 5,000 msg/s quota | 280 msg/s |
| End-to-end latency (trigger to delivery) | <4s p95 | <30s acceptable |

Production capacity confirmed. Deployment pending email domain warmup.

---

## Roadmap

| Phase | Period | Status |
|---|---|---|
| 0. Foundation | Mar 30 – Apr 4 | Done |
| 1. Infrastructure | Mar 30 – Apr 25 | In progress |
| 2. Product (CRM Hub in production) | Apr 20 – Jul 4 | Pending |
| 3. Validation: A/B test on 20K subscribers | May 15 – Jul 15 | Pending |
| 4. Parallel run (Insider + Novu simultaneous) | Aug 1 – Sep 14 | Pending |
| 5. Go-live, Insider off | Sep 14 | Pending |

Decision gate: **May 30, 2026.** The A/B test result on 20K subscribers determines whether the project continues to production.

---

## Repository structure

```
painel/         CRM Hub, single HTML file, no build step
app/            React app (in development)
infra/          Docker Compose, webhook relay, utility scripts
wiki/           Financial analysis, roadmap
raw/            Research and reference documents
docs/           Architecture and stack decisions
```

---

Built by [Davi Cherete](https://linkedin.com/in/davi-cherete) · Related: [PostHog RevOps field study](https://dcherete.github.io/posthog-revops-case/)
