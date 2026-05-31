import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, XCircle, ExternalLink, KeyRound, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const WEBHOOK_URL = "https://nextcut.base44.app/api/functions/stripeWebhookPublic";

const DESTINATIONS = [
  {
    key: "account_snapshot",
    label: "Your account · Snapshot",
    secretName: "STRIPE_WH_SECRET_ACCOUNT",
    badge: "bg-primary/20 text-primary",
    description: "Standard v1 events from your own Stripe account — subscriptions, checkout sessions, account.updated.",
    events: [
      "checkout.session.completed",
      "customer.subscription.created",
      "customer.subscription.updated",
      "customer.subscription.deleted",
      "invoice.paid",
      "invoice.payment_failed",
      "account.updated",
      "account.application.deauthorized",
      "payment_intent.succeeded",
      "payment_intent.payment_failed",
    ],
  },
  {
    key: "connected_snapshot",
    label: "Connected accounts · Snapshot",
    secretName: "STRIPE_WH_SECRET_CONNECTED",
    badge: "bg-amber-500/20 text-amber-400",
    description: "Standard v1 events on barbers' connected Stripe Express accounts — invoice payments, payout events.",
    stripeNote: 'Enable "Listen to events on Connected accounts" in Stripe.',
    events: [
      "account.updated",
      "invoice.paid",
      "invoice.payment_succeeded",
      "payment_intent.succeeded",
    ],
  },
  {
    key: "connected_thin",
    label: "Connected accounts · Thin",
    secretName: "STRIPE_WH_SECRET_CONNECTED_THIN",
    badge: "bg-violet-500/20 text-violet-400",
    description: "Thin v2 events on connected accounts. These are acknowledged and safely ignored — no snapshot data is expected.",
    stripeNote: "Thin events are acknowledged with 200 and logged but not acted upon.",
    events: [],
  },
];

function CopyableCode({ value }) {
  return (
    <div className="flex gap-2 items-center">
      <code className="flex-1 text-xs bg-secondary border border-border rounded-lg px-3 py-2 font-mono break-all text-foreground">
        {value}
      </code>
      <Button
        size="sm"
        variant="outline"
        className="shrink-0"
        onClick={() => { navigator.clipboard.writeText(value); toast.success("Copied!"); }}
      >
        <Copy className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function SecretStatus({ secretName, isSet }) {
  return (
    <div className="flex items-center justify-between p-3 bg-secondary rounded-lg border border-border">
      <div className="flex items-center gap-2">
        <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
        <code className="text-xs font-mono text-foreground">{secretName}</code>
      </div>
      <div className="flex items-center gap-1.5">
        {isSet ? (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" /> Set
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-xs text-amber-400">
            <XCircle className="w-3.5 h-3.5" /> Not set
          </span>
        )}
      </div>
    </div>
  );
}

function DestinationLastEvent({ sourceKey, events }) {
  // Find the most recent event for this source
  const match = events.find(e => e.source === sourceKey);
  if (!match) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground/50">
        <XCircle className="w-3 h-3" /> No events received yet
      </div>
    );
  }
  const ago = formatDistanceToNow(new Date(match.processed_at), { addSuffix: true });
  const ok = match.status !== "error";
  return (
    <div className={`flex items-center gap-1.5 text-xs ${ok ? "text-emerald-400" : "text-destructive"}`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      Last event: <strong>{match.event_type}</strong> · {ago}
    </div>
  );
}

function EventsTable({ events: evtList, recentEvents, sourceKey }) {
  if (evtList.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Thin events have no fixed type list — all are acknowledged and logged.
      </p>
    );
  }
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-secondary">
            <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Event type</th>
            <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Last received</th>
          </tr>
        </thead>
        <tbody>
          {evtList.map((evt, i) => {
            const match = recentEvents.find(e => e.event_type === evt && (e.source === sourceKey || e.source === 'unknown'));
            const ago = match ? formatDistanceToNow(new Date(match.processed_at), { addSuffix: true }) : null;
            const ok = match ? match.status !== "error" : null;
            return (
              <tr key={evt} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-secondary/30"}`}>
                <td className="px-3 py-2 font-mono text-foreground">{evt}</td>
                <td className="px-3 py-2 text-right">
                  {match ? (
                    <span className={`inline-flex items-center gap-1 ${ok ? "text-emerald-400" : "text-destructive"}`}>
                      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                      {ago}
                    </span>
                  ) : (
                    <span className="text-muted-foreground/40">never</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function WebhookSetupPanel() {
  const [recentEvents, setRecentEvents] = useState([]);
  const [secretStatus, setSecretStatus] = useState({});
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const [evts, statusRes] = await Promise.all([
        base44.entities.StripeEvent.list("-processed_at", 200),
        base44.functions.invoke("saveWebhookSecrets", {}),
      ]);
      setRecentEvents(evts || []);
      const map = {};
      (statusRes?.data?.configured || []).forEach(s => { map[s.name] = s.set; });
      setSecretStatus(map);
    } catch {
      // Fallback if function fails
      try {
        const evts = await base44.entities.StripeEvent.list("-processed_at", 200);
        setRecentEvents(evts || []);
      } catch {}
    }
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-lg">Stripe Webhook Destinations</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Three destinations in Stripe all POST to one handler URL.{" "}
            <a
              href="https://dashboard.stripe.com/webhooks"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline inline-flex items-center gap-0.5"
            >
              Open Stripe Webhooks <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={refresh} disabled={loading} className="gap-1.5">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Shared URL */}
      <div className="bg-secondary rounded-xl border border-border p-4 space-y-1.5">
        <p className="text-xs font-semibold text-muted-foreground">Handler URL — use for all three destinations</p>
        <CopyableCode value={WEBHOOK_URL} />
      </div>

      {/* Three destination cards */}
      {DESTINATIONS.map((dest) => (
        <div key={dest.key} className="bg-card rounded-xl border border-border p-5 space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${dest.badge}`}>
                {dest.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{dest.description}</p>
            {dest.stripeNote && (
              <p className="text-xs text-amber-400/80 mt-1">⚠ {dest.stripeNote}</p>
            )}
          </div>

          {/* Last event received for this destination */}
          <div className="flex items-center gap-2">
            <DestinationLastEvent sourceKey={dest.key} events={recentEvents} />
          </div>

          {/* Signing secret status */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground">Signing secret</p>
            <SecretStatus
              secretName={dest.secretName}
              isSet={secretStatus[dest.secretName] ?? false}
            />
            {!secretStatus[dest.secretName] && (
              <p className="text-xs text-muted-foreground">
                After creating this destination in Stripe, copy its <code className="text-primary">whsec_…</code> signing secret and add it to{" "}
                <strong>App Settings → Secrets</strong> as <code className="text-primary">{dest.secretName}</code>.
              </p>
            )}
          </div>

          {/* Events table */}
          {dest.events.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Events to subscribe in Stripe</p>
              <EventsTable evtList={dest.events} recentEvents={recentEvents} sourceKey={dest.key} />
            </div>
          )}
          {dest.events.length === 0 && (
            <EventsTable evtList={[]} recentEvents={recentEvents} sourceKey={dest.key} />
          )}
        </div>
      ))}

      <div className="text-xs text-muted-foreground bg-secondary rounded-xl p-4 space-y-1">
        <p><strong>How signature verification works:</strong> The handler tries all three secrets in order and accepts whichever one validates the Stripe signature. Each destination has its own unique secret, so only the matching one succeeds.</p>
        <p>Secrets are stored server-side only — they are never sent to the browser.</p>
      </div>
    </div>
  );
}