#!/usr/bin/env python3
import os
"""
webhook_relay.py — Novu → PostHog
Recebe webhooks do Novu (entregue, abriu, clicou, bounce)
e encaminha como eventos para o PostHog.

Como usar:
  pip3 install flask requests
  python3 webhook_relay.py

No Novu: Settings → Webhooks → adicionar URL: http://SEU-IP:5055/webhook

Eventos mapeados:
  Novu event_type        → PostHog event
  ─────────────────────────────────────────
  sent / queued          → notification_sent
  delivered              → notification_delivered
  opened / seen          → notification_opened
  clicked                → notification_clicked
  failed / bounced       → notification_failed
  unsubscribed           → notification_unsubscribed
"""

from flask import Flask, request, jsonify, Response
import requests
import json
from datetime import datetime

# 1x1 transparent GIF
PIXEL = (
    b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00"
    b"\xff\xff\xff\x00\x00\x00\x21\xf9\x04\x00\x00\x00\x00"
    b"\x00\x2c\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02"
    b"\x44\x01\x00\x3b"
)

app = Flask(__name__)

# ── CONFIG ─────────────────────────────────────────────────
POSTHOG_HOST  = os.environ.get('POSTHOG_HOST', 'https://us.posthog.com')
POSTHOG_TOKEN = os.environ.get('POSTHOG_TOKEN', '')
PORT          = int(os.environ.get('PORT', 5055))

EVENT_MAP = {
    "sent":           "notification_sent",
    "queued":         "notification_sent",
    "delivered":      "notification_delivered",
    "opened":         "notification_opened",
    "seen":           "notification_opened",
    "clicked":        "notification_clicked",
    "failed":         "notification_failed",
    "bounced":        "notification_failed",
    "unsubscribed":   "notification_unsubscribed",
}

# ── POSTHOG CAPTURE ────────────────────────────────────────
def ph_capture(distinct_id, event, properties):
    try:
        r = requests.post(
            f"{POSTHOG_HOST}/capture/",
            json={
                "api_key": POSTHOG_TOKEN,
                "event": event,
                "distinct_id": distinct_id,
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "properties": properties,
            },
            timeout=5,
        )
        return r.status_code
    except Exception as e:
        print(f"  [PostHog erro] {e}")
        return None

# ── WEBHOOK ENDPOINT ───────────────────────────────────────
@app.route("/webhook", methods=["POST"])
def novu_webhook():
    data = request.json or {}
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] Webhook recebido: {json.dumps(data, indent=2)[:400]}")

    # Novu envia arrays de eventos ou objeto único
    events = data if isinstance(data, list) else [data]

    for ev in events:
        novu_type   = ev.get("type") or ev.get("status") or ""
        subscriber  = ev.get("subscriber") or {}
        template    = ev.get("template") or ev.get("notification") or {}
        channel     = ev.get("channel") or ""

        distinct_id = subscriber.get("subscriberId") or subscriber.get("email") or "unknown"
        ph_event    = EVENT_MAP.get(novu_type.lower(), f"notification_{novu_type.lower()}")

        properties = {
            "channel":          channel,
            "workflow_name":    template.get("name") or template.get("title") or "",
            "workflow_id":      template.get("identifier") or template.get("_id") or "",
            "subscriber_email": subscriber.get("email") or "",
            "subscriber_id":    distinct_id,
            "novu_event_type":  novu_type,
            "$lib":             "webhook_relay",
            "source":           "novu",
        }

        status_code = ph_capture(distinct_id, ph_event, properties)
        print(f"  → PostHog: {ph_event} | subscriber: {distinct_id} | status: {status_code}")

    return jsonify({"ok": True, "processed": len(events)})

@app.route("/track/open", methods=["GET"])
def track_open():
    """Pixel de rastreamento de abertura de email.
    URL: /track/open?sub=SUBSCRIBER_ID&wf=WORKFLOW_ID&ch=email
    Retorna um GIF 1x1 transparente e envia notification_opened para o PostHog.
    """
    sub = request.args.get("sub", "unknown")
    wf  = request.args.get("wf", "")
    ch  = request.args.get("ch", "email")

    properties = {
        "channel":         ch,
        "workflow_id":     wf,
        "subscriber_id":   sub,
        "source":          "email_pixel",
        "$lib":            "webhook_relay",
    }
    status = ph_capture(sub, "notification_opened", properties)
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] pixel abertura | sub={sub} wf={wf} → PostHog {status}")

    return Response(PIXEL, mimetype="image/gif")

@app.route("/track/click", methods=["GET"])
def track_click():
    """Redirect de rastreamento de clique.
    URL: /track/click?sub=SUBSCRIBER_ID&wf=WORKFLOW_ID&url=URL_DESTINO
    """
    import urllib.parse
    sub  = request.args.get("sub", "unknown")
    wf   = request.args.get("wf", "")
    dest = request.args.get("url", "")

    properties = {
        "channel":       "email",
        "workflow_id":   wf,
        "subscriber_id": sub,
        "clicked_url":   dest,
        "source":        "email_click",
        "$lib":          "webhook_relay",
    }
    ph_capture(sub, "notification_clicked", properties)
    print(f"\n[{datetime.now().strftime('%H:%M:%S')}] clique | sub={sub} url={dest[:80]}")

    from flask import redirect
    return redirect(dest) if dest else ("", 204)

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "posthog_host": POSTHOG_HOST, "port": PORT})

# ── MAIN ───────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("  webhook_relay.py — Novu → PostHog")
    print("=" * 55)
    print(f"  Escutando em: http://0.0.0.0:{PORT}/webhook")
    print(f"  PostHog host: {POSTHOG_HOST}")
    print(f"  Token:        {POSTHOG_TOKEN[:12]}...")
    print()
    print("  Configure no Novu:")
    print(f"  Settings → Webhooks → URL: http://localhost:{PORT}/webhook")
    print("=" * 55)
    app.run(host="0.0.0.0", port=PORT, debug=False)
