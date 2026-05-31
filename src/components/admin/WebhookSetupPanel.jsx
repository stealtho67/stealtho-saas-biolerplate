import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle2, XCircle, Clock, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

const PLATFORM_URL = "https://nextcut.base44.app/api/functions/stripeWebhookPublic";

const PLATFORM_EVENTS = [
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
];

const CONNECTED_EVENTS = [
  "account.updated",
  "invoice.paid",
  "invoice.payment_succeeded",
  "payment_intent.succeeded",
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
        onClick={() => {
          navigator.clipboard.writeText(value);
          toast.success("Copied!");
        }}
      >
        <Copy className="w-3.5 h-3.5" />
      </Button>
    </div>
  );
}

function LastEventBadge({ eventType, events }) {
  const match = events.find(e => e.event_type === eventType);
  if (!match) return <span className="text-xs text-muted-foreground/50">never</span>;
  const ago = formatDistanceToNow(new Date(match.processed_at), { addSuffix: true });
  const ok = match.status !== "error";
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${ok ? "text-emerald-400" : "text-destructive"}`}>
      {ok ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {ago}
    </span>
  );
}

function EventsTable({ events, recentEvents }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-secondary">
            <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Event</th>
            <th className="text-right px-3 py-2 font-semibold text-muted-foreground">Last received</th>
          </tr>
        </thead>
        <tbody>
          {events.map((evt, i) => (
            <tr key={evt} className={`border-t border-border ${i % 2 === 0 ? "" : "bg-secondary/30"}`}>
              <td className="px-3 py-2 font-mono text-foreground">{evt}</td>
              <td className="px-3 py-2 text-right">
                <LastEventBadge eventType={evt} events={recentEvents} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function WebhookSetupPanel() {
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    base44.asServiceRole?.entities?.StripeEvent?.list("-processed_at", 100)
      .then(setRecentEvents)
      .catch(() => {
        // Fallback: use user-scoped client
        base44.entities.StripeEvent.list("-processed_at", 100)
          .then(setRecentEvents)
          .catch(() => {});
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading font-bold text-lg">Stripe Webhook Setup</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Register both endpoints in your{" "}
            <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary underline inline-flex items-center gap-0.5">
              Stripe Dashboard → Webhooks <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        </div>
      </div>

      {/* ── Endpoint 1: Platform ── */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/20 text-primary">Platform endpoint</span>
              <span className="text-xs text-muted-foreground">Your Stripe account (not connected accounts)</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Handles subscription billing, booking payments, and Connect account onboarding events sent to <em>your</em> platform account.
            </p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Webhook URL</p>
          <CopyableCode value={PLATFORM_URL} />
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Events to subscribe (select these in Stripe)</p>
          <EventsTable events={PLATFORM_EVENTS} recentEvents={recentEvents} />
        </div>

        <div className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
          <strong>Signing secret:</strong> After creating the webhook in Stripe, copy the <code className="text-primary">whsec_...</code> signing secret and set it as{" "}
          <code className="text-primary">STRIPE_WEBHOOK_SECRET</code> in your app secrets.
          {recentEvents.length > 0 && (
            <span className="ml-2 inline-flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3 h-3" /> Connected — {recentEvents.length} events logged
            </span>
          )}
        </div>
      </div>

      {/* ── Endpoint 2: Connected Accounts ── */}
      <div className="bg-card rounded-xl border border-border p-5 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">Connected accounts endpoint</span>
            <span className="text-xs text-muted-foreground">Enable "Listen to events on Connected accounts"</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Handles barber-to-client invoice payments and payout events on barbers' Stripe Express accounts.
            Use the <strong>same URL</strong> as above — the handler checks <code className="text-foreground">event.account</code> to distinguish.
          </p>
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Webhook URL (same endpoint)</p>
          <CopyableCode value={PLATFORM_URL} />
        </div>

        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1.5">Events to subscribe (connected accounts)</p>
          <EventsTable events={CONNECTED_EVENTS} recentEvents={recentEvents} />
        </div>

        <div className="text-xs text-muted-foreground bg-secondary rounded-lg px-3 py-2">
          In Stripe, when creating this webhook check the box <strong>"Listen to events on Connected accounts"</strong>.
          You can reuse the same <code className="text-primary">STRIPE_WEBHOOK_SECRET</code> or set a separate secret — if separate, add it as <code className="text-primary">STRIPE_WEBHOOK_SECRET_CONNECT</code> and update the handler.
        </div>
      </div>
    </div>
  );
}