# Architecture

## Components

### PostHog (CDP and analytics)

PostHog handles the behavioral data layer: event capture, user identity resolution, property storage, and segmentation. In this stack it plays the role Insider's "Architect" product plays: defining who a user is, what state they're in, and when to trigger a communication.

Key usage:

- **Event capture**: CRM Hub writes events for every analyst action (campaign sent, journey activated, subscriber imported). Delivery events flow in via `webhook_relay.py`.
- **User properties**: each subscriber's lifecycle stage, score, channel preferences, and last-active date live as PostHog person properties.
- **Segments**: cohorts defined in PostHog (e.g., "lapsed 90+ days, score > 0.4") are the trigger source for Novu journeys.
- **Actions**: a PostHog Action fires a webhook to Novu when a user matches a condition. This is the entry point for all automated journeys.

Self-hosted option is documented in [`wiki/index.md`](../wiki/index.md). Cloud is used for the POC; self-hosting on Oracle Cloud Free Tier is the production plan to avoid IRRF/IOF on international remittances.

### Novu (notification orchestrator, self-hosted)

Novu handles the routing and delivery logic. It receives a trigger (from PostHog webhook or from the CRM Hub directly), selects the right workflow, and dispatches to the configured providers.

Providers in use:

| Provider | Channel | Config |
|---|---|---|
| Amazon SES | Email | SMTP credentials in Novu |
| Firebase FCM | Mobile push, web push | Service account key |
| Novu native | In-app notifications | No external provider |

Novu runs self-hosted via Docker Compose. The `infra/docker-compose.yml` starts the API, dashboard, worker, and MongoDB.

### webhook_relay.py

Novu fires webhooks for every delivery event. The relay at port 5055 receives them and:

1. Translates Novu event types into PostHog-readable event names

| Novu type | PostHog event |
|---|---|
| `sent` / `queued` | `notification_sent` |
| `delivered` | `notification_delivered` |
| `opened` / `seen` | `notification_opened` |
| `clicked` | `notification_clicked` |
| `failed` / `bounced` | `notification_failed` |
| `unsubscribed` | `notification_unsubscribed` |

2. Handles open tracking via a 1x1 pixel served at `/pixel/:messageId`. When an email client loads the pixel, the relay records `notification_opened` in PostHog.

3. Handles click redirect: email links point to the relay, which records `notification_clicked` in PostHog and redirects to the original URL.

### CRM Hub (painel/index.html)

Single HTML file, no build step, no framework. Runs in the browser against the Novu API and reads/writes PostHog events via the JS SDK loaded from config.

State is stored in `localStorage`:

| Key | Contents |
|---|---|
| `crm-cfg` | Novu URL, API Key, PostHog host and token |
| `crm-camps` | Campaign metadata |
| `crm-jornadas` | Journey configurations |
| `crm-unsubs` | Unsubscribe records |
| `crm-supp` | Suppression list |

---

## Data flow in detail

### Automated journey (PostHog trigger)

```
User behavior captured in PostHog
        |
        v
PostHog Action evaluates condition
(e.g., days_since_purchase > 90 AND score > 0.4)
        |
        v
PostHog fires webhook to Novu
POST /v1/events/trigger
{
  "name": "reactivation-flow",
  "to": { "subscriberId": "user_123" },
  "payload": { "score": 0.72, "last_plan": "Select" }
}
        |
        v
Novu executes workflow steps
  Step 1: Send email via SES (delay 0)
  Step 2: Check if opened (delay 2 days)
  Step 3: If not opened, send push via FCM
        |
        v
Novu fires delivery webhooks to webhook_relay.py :5055
        |
        v
Relay writes events to PostHog
notification_delivered { subscriberId, channel, messageId }
notification_opened    { subscriberId, channel, messageId }
        |
        v
PostHog funnel: triggered -> delivered -> opened -> converted
```

### Manual campaign (CRM Hub trigger)

```
Analyst opens CRM Hub
        |
        v
Selects workflow + segment (Topic)
        |
        v
CRM Hub calls Novu API directly
POST /v1/events/trigger (per subscriber) or
POST /v1/events/bulk/trigger (per segment)
        |
        v
Same delivery path as above
```

---

## Known issues

- Novu v2 workflows API returns `r.data.workflows`, not `r.workflows`. The CRM Hub handles this.
- Topics `pageSize` maximum is 10. Requests above this return 422.
- Open pixel tracking does not work on `localhost` (email clients cannot reach local addresses). Works correctly in production.

---

## Production deploy plan

Target: Oracle Cloud Free Tier (ARM A1, 4 OCPU, 24GB RAM)

| Service | Domain |
|---|---|
| Novu API | `api.crm.brasilparalelo.com.br` |
| CRM Hub | `painel.brasilparalelo.com.br` |
| Webhook relay | `relay.crm.brasilparalelo.com.br` |

Email domain warmup in progress. SES sending quota verified at 5,000 msg/s, above the 280 msg/s peak requirement.
