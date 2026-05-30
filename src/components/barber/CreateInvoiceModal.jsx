import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Send, Info } from "lucide-react";
import { toast } from "sonner";

const SOURCE_LABELS = {
  manual: "My own client (barber direct) — 3%",
  barber_referral_link: "Came via my referral link — 0%",
  marketplace: "Found me on NextCut — 7%",
  repeat_client: "Repeat client — 4%",
};

export default function CreateInvoiceModal({ barber, services, open, onClose, onCreated, prefill }) {
  const [form, setForm] = useState({
    client_name: prefill?.client_name || "",
    client_email: prefill?.client_email || "",
    service_name: prefill?.service_name || "",
    service_price: prefill?.service_price || "",
    tip_amount: "",
    customer_source: "manual",
    note: "",
    booking_id: prefill?.booking_id || "",
  });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState(null);

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const selectService = (svcId) => {
    const svc = services.find(s => s.id === svcId);
    if (svc) {
      set("service_name", svc.service_name);
      set("service_price", String(svc.price));
    }
  };

  const handleSend = async () => {
    if (!form.client_email || !form.service_name || !form.service_price) {
      toast.error("Client email, service, and price are required");
      return;
    }
    setSending(true);
    try {
      const res = await base44.functions.invoke("createInvoice", {
        action: "create",
        barber_id: barber.id,
        client_name: form.client_name,
        client_email: form.client_email,
        service_name: form.service_name,
        service_price: parseFloat(form.service_price),
        tip_amount: parseFloat(form.tip_amount) || 0,
        customer_source: form.customer_source,
        note: form.note,
        booking_id: form.booking_id || undefined,
      });
      setResult(res.data);
      toast.success("Invoice sent to " + form.client_email);
      onCreated?.(res.data.invoice);
    } catch (err) {
      toast.error(err.message || "Failed to send invoice");
    } finally {
      setSending(false);
    }
  };

  const handleClose = () => {
    setResult(null);
    setForm({ client_name: "", client_email: "", service_name: "", service_price: "", tip_amount: "", customer_source: "manual", note: "", booking_id: "" });
    onClose();
  };

  const svcPrice = parseFloat(form.service_price) || 0;
  const tipAmt = parseFloat(form.tip_amount) || 0;
  const sourceRates = { manual: 0.03, barber_referral_link: 0.00, marketplace: 0.07, repeat_client: 0.04 };
  const rate = sourceRates[form.customer_source] ?? 0.03;
  const platformFee = parseFloat((svcPrice * rate).toFixed(2));
  const barberEarns = parseFloat((svcPrice - platformFee + tipAmt).toFixed(2));

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="font-heading">Send Invoice</DialogTitle>
        </DialogHeader>

        {result ? (
          <div className="space-y-4 py-2">
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 text-center">
              <p className="font-heading font-bold text-lg text-primary mb-1">Invoice Sent! 🎉</p>
              <p className="text-sm text-muted-foreground">
                {result.stripe_invoice.hosted_invoice_url
                  ? "Client received an email with a payment link."
                  : "Invoice created on your Stripe account."}
              </p>
            </div>
            <div className="text-xs space-y-1 bg-secondary rounded-xl p-3">
              <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>${result.breakdown.service_price.toFixed(2)}</span></div>
              {result.breakdown.tip_amount > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tip (yours)</span><span>+${result.breakdown.tip_amount.toFixed(2)}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">NextCut fee ({result.breakdown.rate_pct}%)</span><span className="text-destructive">-${result.breakdown.platform_fee.toFixed(2)}</span></div>
              <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span>Your take</span><span className="text-primary">${result.breakdown.barber_earnings.toFixed(2)}</span></div>
            </div>
            {result.stripe_invoice.hosted_invoice_url && (
              <a href={result.stripe_invoice.hosted_invoice_url} target="_blank" rel="noopener noreferrer" className="block">
                <Button variant="outline" className="w-full text-xs">View Invoice on Stripe</Button>
              </a>
            )}
            <Button className="w-full" onClick={handleClose}>Done</Button>
          </div>
        ) : (
          <div className="space-y-4 py-1">
            {/* Client */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Client Name</Label>
                <Input className="mt-1" placeholder="John Doe" value={form.client_name} onChange={e => set("client_name", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Client Email *</Label>
                <Input className="mt-1" type="email" placeholder="john@email.com" value={form.client_email} onChange={e => set("client_email", e.target.value)} />
              </div>
            </div>

            {/* Service picker */}
            {services.length > 0 && (
              <div>
                <Label className="text-xs">Pick a service</Label>
                <Select onValueChange={selectService}>
                  <SelectTrigger className="mt-1"><SelectValue placeholder="Select service..." /></SelectTrigger>
                  <SelectContent>
                    {services.filter(s => s.active !== false).map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.service_name} — ${s.price}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Service name *</Label>
                <Input className="mt-1" placeholder="Classic Fade" value={form.service_name} onChange={e => set("service_name", e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Price ($) *</Label>
                <Input className="mt-1" type="number" placeholder="35" min="0" value={form.service_price} onChange={e => set("service_price", e.target.value)} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Tip ($) — 100% yours</Label>
              <Input className="mt-1" type="number" placeholder="0" min="0" value={form.tip_amount} onChange={e => set("tip_amount", e.target.value)} />
            </div>

            {/* Commission source */}
            <div>
              <Label className="text-xs">How did this client find you?</Label>
              <Select value={form.customer_source} onValueChange={v => set("customer_source", v)}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(SOURCE_LABELS).map(([v, l]) => (
                    <SelectItem key={v} value={v}>{l}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Note */}
            <div>
              <Label className="text-xs">Note to client (optional)</Label>
              <Input className="mt-1" placeholder="Thanks for the visit!" value={form.note} onChange={e => set("note", e.target.value)} />
            </div>

            {/* Breakdown preview */}
            {svcPrice > 0 && (
              <div className="bg-secondary rounded-xl p-3 text-xs space-y-1">
                <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span>${svcPrice.toFixed(2)}</span></div>
                {tipAmt > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Tip (yours)</span><span>+${tipAmt.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">NextCut fee ({Math.round(rate * 100)}%)</span><span className="text-destructive">-${platformFee.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold border-t border-border pt-1 mt-1"><span>Your take</span><span className="text-primary">${barberEarns.toFixed(2)}</span></div>
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Invoice is created on your Stripe account. Client gets an email with a secure payment link. Funds go straight to your bank.</span>
            </div>

            <Button onClick={handleSend} disabled={sending} className="w-full">
              {sending ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Sending...</> : <><Send className="w-4 h-4 mr-2" />Send Invoice</>}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}