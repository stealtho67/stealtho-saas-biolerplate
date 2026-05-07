import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { format, fromUnixTime } from "date-fns";
import { CheckCircle2, Clock, AlertCircle, Loader2, RefreshCw, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";

const STATUS_CONFIG = {
  paid:        { label: "Paid",     color: "text-emerald-600 bg-emerald-100", icon: CheckCircle2 },
  in_transit:  { label: "In Transit", color: "text-blue-600 bg-blue-100",    icon: Clock },
  pending:     { label: "Pending",  color: "text-amber-600 bg-amber-100",    icon: Clock },
  failed:      { label: "Failed",   color: "text-red-600 bg-red-100",        icon: AlertCircle },
  canceled:    { label: "Canceled", color: "text-slate-600 bg-slate-100",    icon: AlertCircle },
};

export default function PayoutHistory({ barber }) {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (barber?.id) fetchPayouts();
  }, [barber?.id]);

  const fetchPayouts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await base44.functions.invoke("getPayoutHistory", {
        barber_id: barber.id,
        limit: 30,
      });
      setPayouts(res.data?.payouts || []);
    } catch (err) {
      setError(err.message || "Failed to load payout history.");
    } finally {
      setLoading(false);
    }
  };

  if (!barber?.stripe_account_id) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        <Banknote className="w-10 h-10 mx-auto mb-3 opacity-20" />
        Connect Stripe to see your payout history.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-sm text-destructive space-y-2">
        <p>{error}</p>
        <Button variant="outline" size="sm" onClick={fetchPayouts} className="gap-1.5">
          <RefreshCw className="w-3.5 h-3.5" /> Retry
        </Button>
      </div>
    );
  }

  if (payouts.length === 0) {
    return (
      <div className="text-center py-10 text-muted-foreground text-sm">
        <Clock className="w-10 h-10 mx-auto mb-3 opacity-20" />
        No payouts yet. Earnings accumulate and are paid out once your Stripe account is active.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{payouts.length} payout{payouts.length !== 1 ? "s" : ""}</p>
        <Button variant="ghost" size="sm" onClick={fetchPayouts} className="h-7 text-xs gap-1 text-muted-foreground">
          <RefreshCw className="w-3 h-3" /> Refresh
        </Button>
      </div>
      {payouts.map((payout) => {
        const cfg = STATUS_CONFIG[payout.status] || STATUS_CONFIG.pending;
        const Icon = cfg.icon;
        return (
          <div key={payout.id} className="flex items-center justify-between p-4 bg-secondary rounded-xl">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cfg.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">
                  ${payout.amount.toFixed(2)}{" "}
                  <span className="font-normal text-muted-foreground text-xs uppercase">{payout.currency}</span>
                </p>
                <p className="text-xs text-muted-foreground">
                  {payout.arrival_date
                    ? `Arrives ${format(fromUnixTime(payout.arrival_date), "MMM d, yyyy")}`
                    : format(fromUnixTime(payout.created), "MMM d, yyyy")}
                </p>
                {payout.failure_message && (
                  <p className="text-xs text-destructive mt-0.5">{payout.failure_message}</p>
                )}
              </div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${cfg.color}`}>
              {cfg.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}