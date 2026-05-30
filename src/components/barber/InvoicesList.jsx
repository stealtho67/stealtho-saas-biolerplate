import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Plus, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const STATUS_COLORS = {
  open: "bg-amber-500/20 text-amber-300",
  paid: "bg-emerald-500/20 text-emerald-300",
  void: "bg-slate-500/20 text-slate-400",
  uncollectible: "bg-red-500/20 text-red-300",
  draft: "bg-slate-500/20 text-slate-400",
};

const COMM_COLORS = {
  new_nextcut_lead: "bg-purple-500/15 text-purple-300",
  repeat_client: "bg-blue-500/15 text-blue-300",
  barber_direct_client: "bg-teal-500/15 text-teal-300",
  barber_referral_link: "bg-primary/15 text-primary",
};

const COMM_LABELS = {
  new_nextcut_lead: "New lead",
  repeat_client: "Repeat",
  barber_direct_client: "Direct",
  barber_referral_link: "Your link",
};

export default function InvoicesList({ barber, onCreateNew }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (barber?.id) loadInvoices();
  }, [barber?.id]);

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("createInvoice", {
        action: "list",
        barber_id: barber.id,
      });
      setInvoices(res.data.invoices || []);
    } catch (err) {
      toast.error("Could not load invoices: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const copy = (url) => {
    navigator.clipboard.writeText(url);
    toast.success("Invoice link copied!");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-base">Invoices</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
        </div>
        <Button size="sm" onClick={onCreateNew} className="gap-1.5">
          <Plus className="w-3.5 h-3.5" />New Invoice
        </Button>
      </div>

      {invoices.length === 0 ? (
        <div className="text-center py-12 bg-secondary rounded-2xl border border-border">
          <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="font-medium text-sm mb-1">No invoices yet</p>
          <p className="text-xs text-muted-foreground mb-4">Send your first invoice after a cut — client gets a secure payment link.</p>
          <Button size="sm" onClick={onCreateNew}>Create Invoice</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="bg-card border border-border rounded-2xl p-4 space-y-3">
              {/* Header row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{inv.client_name || inv.client_email}</p>
                  <p className="text-xs text-muted-foreground truncate">{inv.client_email}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[inv.status] || "bg-muted text-muted-foreground"}`}>
                    {inv.status}
                  </span>
                  {inv.commission_type && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${COMM_COLORS[inv.commission_type]}`}>
                      {COMM_LABELS[inv.commission_type]}
                    </span>
                  )}
                </div>
              </div>

              {/* Service + breakdown */}
              <div className="bg-secondary rounded-xl p-3 text-xs">
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">{inv.service_name}</span>
                  <span>${(inv.service_price || 0).toFixed(2)}</span>
                </div>
                {inv.tip_amount > 0 && (
                  <div className="flex justify-between mb-1">
                    <span className="text-muted-foreground">Tip (yours)</span>
                    <span>+${inv.tip_amount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between mb-1">
                  <span className="text-muted-foreground">
                    NextCut fee ({Math.round((inv.commission_rate || 0) * 100)}%)
                  </span>
                  <span className="text-destructive">-${(inv.platform_fee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-border pt-1 mt-1">
                  <span>Your take</span>
                  <span className="text-primary">${(inv.barber_earnings || 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Footer row */}
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-muted-foreground">
                  {inv.created_date ? format(parseISO(inv.created_date), "MMM d, yyyy") : "—"}
                  {inv.status === "paid" && inv.paid_at ? ` · Paid ${format(parseISO(inv.paid_at), "MMM d")}` : ""}
                </span>
                <div className="flex items-center gap-1.5">
                  {inv.invoice_url && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs gap-1 text-muted-foreground"
                        onClick={() => copy(inv.invoice_url)}
                      >
                        <Copy className="w-3 h-3" />Copy link
                      </Button>
                      <a href={inv.invoice_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                          <ExternalLink className="w-3 h-3" />View
                        </Button>
                      </a>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}