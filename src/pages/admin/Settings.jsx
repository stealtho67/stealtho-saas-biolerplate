import { useState, useEffect } from "react";
import { getCommissionRules, saveCommissionRules, COMMISSION_LABELS, COMMISSION_DEFAULTS } from "@/lib/commissionRules";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Info } from "lucide-react";
import { toast } from "sonner";
import WebhookSetupPanel from "@/components/admin/WebhookSetupPanel";

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

      <div>
        <h1 className="font-heading font-bold text-2xl">Platform Settings</h1>
      </div>

      <WebhookSetupPanel />

      <div>
        <h2 className="font-heading font-bold text-xl">Commission Rules</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Commission is determined by how the client was acquired — not a single global rate.
          Tips are always 100% barber's. Commission applies to service price only.
        </p>
      </div>

      <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex gap-3">
        <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <div className="text-xs text-primary space-y-1">
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
            <div key={type} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                      type === "new_nextcut_lead" ? "bg-purple-500/20 text-purple-300" :
                      type === "repeat_client" ? "bg-blue-500/20 text-blue-300" :
                      "bg-primary/20 text-primary"
                    }`}>
                      {COMMISSION_LABELS[type]}
                    </span>
                    <span className="font-heading font-bold">{pct.toFixed(0)}%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">{RULE_DESCRIPTIONS[type]}</p>
                  <p className="text-xs text-muted-foreground/70">
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

      <div className="bg-secondary rounded-xl p-4 text-xs text-muted-foreground space-y-1">
        <p><strong>Platform defaults:</strong> New lead 7% · Repeat client 4% · Barber direct 3% · Referral link 0% (fixed, always)</p>
        <p>Barbers who share their referral link always keep 100% — this rate is locked and cannot be changed here.</p>
      </div>

      <Button onClick={save} disabled={saving || !isDirty} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Commission Rules"}
      </Button>
    </div>
  );
}