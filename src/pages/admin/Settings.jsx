import { useState, useEffect } from "react";
import { getCommissionRules, saveCommissionRules, COMMISSION_LABELS, COMMISSION_DEFAULTS } from "@/lib/commissionRules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Info, Copy, Webhook } from "lucide-react";
import { toast } from "sonner";

const WEBHOOK_URL = "https://nextcut.base44.app/api/functions/stripeWebhookPublic";

const RULE_DESCRIPTIONS = {
  new_nextcut_lead: "Client discovered the barber via NextCut marketplace, search, featured placement, or campaign traffic.",
  repeat_client: "Client has at least one prior completed & paid booking with this barber — relationship is established.",
  barber_direct_client: "Client arrived via the barber's own referral link or direct booking link.",
};

const RULE_EXAMPLES = {
  new_nextcut_lead: { price: 50, label: "new marketplace booking" },
  repeat_client: { price: 50, label: "returning client" },
  barber_direct_client: { price: 50, label: "barber's own client" },
};

export default function AdminSettings() {
  const [rules, setRules] = useState(null);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCommissionRules().then(r => { setRules(r); setDraft({ ...r }); });
  }, []);

  const save = async () => {
    setSaving(true);
    await saveCommissionRules(draft);
    setRules({ ...draft });
    setSaving(false);
    toast.success("Commission rules saved.");
  };

  const isDirty = draft && rules && JSON.stringify(draft) !== JSON.stringify(rules);

  if (!draft) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6 max-w-2xl space-y-6">

      {/* Stripe Webhook URL */}
      <div>
        <h1 className="font-heading font-bold text-2xl text-slate-900">Platform Settings</h1>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Webhook className="w-4 h-4 text-primary" />
          <h2 className="font-heading font-semibold text-slate-900">Stripe Webhook Endpoint</h2>
        </div>
        <p className="text-xs text-slate-500">
          Register this URL in your{" "}
          <a href="https://dashboard.stripe.com/webhooks" target="_blank" rel="noopener noreferrer" className="text-primary underline">
            Stripe Dashboard → Webhooks
          </a>
          . This endpoint accepts POST requests from Stripe, verifies the signature, and processes events — no authentication required.
        </p>
        <div className="flex gap-2 items-center">
          <code className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-mono break-all">
            {WEBHOOK_URL}
          </code>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => {
              navigator.clipboard.writeText(WEBHOOK_URL);
              toast.success("Webhook URL copied!");
            }}
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
        </div>
        <div className="text-xs text-slate-500 space-y-1">
          <p><strong>Required events to subscribe:</strong></p>
          <code className="block bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 leading-5">
            checkout.session.completed<br />
            payment_intent.succeeded<br />
            payment_intent.payment_failed<br />
            account.updated<br />
            account.application.deauthorized<br />
            payout.paid<br />
            payout.failed<br />
            invoice.created<br />
            invoice.paid<br />
            invoice.payment_failed
          </code>
        </div>
      </div>

      <div>
        <h2 className="font-heading font-bold text-xl text-slate-900">Commission Rules</h2>
        <p className="text-sm text-slate-500 mt-1">
          Commission is determined by how the client was acquired — not a single global rate.
          Tips are always 100% barber's. Commission applies to service price only.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
        <div className="text-xs text-blue-700 space-y-1">
          <p><strong>Priority order:</strong> Barber-direct &gt; Repeat client &gt; New NextCut lead</p>
          <p>Commission is locked onto the booking at creation and never retroactively changed.</p>
          <p>Cancelled and no-show bookings never generate commission.</p>
        </div>
      </div>

      <div className="space-y-4">
        {Object.keys(COMMISSION_LABELS).map((type) => {
          const pct = draft[type] * 100;
          const ex = RULE_EXAMPLES[type];
          const fee = (ex.price * draft[type]).toFixed(2);
          const earn = (ex.price - ex.price * draft[type]).toFixed(2);
          return (
            <div key={type} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      type === "new_nextcut_lead" ? "bg-purple-100 text-purple-700" :
                      type === "repeat_client" ? "bg-blue-100 text-blue-700" :
                      "bg-emerald-100 text-emerald-700"
                    }`}>
                      {COMMISSION_LABELS[type]}
                    </span>
                    <span className="font-heading font-bold text-slate-900">{pct.toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-3">{RULE_DESCRIPTIONS[type]}</p>
                  <p className="text-xs text-slate-400">
                    Example: $50 {ex.label} → platform earns <strong>${fee}</strong>, barber earns <strong>${earn}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={pct}
                    onChange={e => setDraft(d => ({ ...d, [type]: parseFloat(e.target.value) / 100 || 0 }))}
                    className="w-20 text-center font-heading font-bold"
                  />
                  <span className="text-sm text-slate-500">%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-slate-50 rounded-xl p-4 text-xs text-slate-500 space-y-1">
        <p><strong>Default rates:</strong> New lead 20% · Repeat client 15% · Barber direct 10%</p>
        <p>These defaults match industry-standard marketplace commission structures. Adjust only if needed.</p>
      </div>

      <Button onClick={save} disabled={saving || !isDirty} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Commission Rules"}
      </Button>
    </div>
  );
}