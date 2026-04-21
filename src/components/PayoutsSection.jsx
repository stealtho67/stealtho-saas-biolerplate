import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { DollarSign, Zap, AlertCircle, CheckCircle2, Clock, ExternalLink, Info, RefreshCw } from "lucide-react";
import { stripeStatusInfo } from "@/lib/stripeConfig";
import { toast } from "sonner";

export default function PayoutsSection({ barber, bookings }) {
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [localBarber, setLocalBarber] = useState(barber);

  useEffect(() => { setLocalBarber(barber); }, [barber]);

  const stripeInfo = stripeStatusInfo(localBarber?.stripe_status || "not_connected");
  const isPayoutReady = localBarber?.stripe_status === "active" && localBarber?.payouts_enabled;

  const completedPaid = bookings.filter(b => b.status === "completed" && b.payment_status === "paid");
  const completedUnpaid = bookings.filter(b => b.status === "completed" && b.payment_status !== "paid");
  const pendingBookings = bookings.filter(b => b.status === "confirmed");

  const totalEarnings = completedPaid.reduce((s, b) => s + (b.barber_earnings ?? 0), 0);
  const pendingEarnings = completedUnpaid.reduce((s, b) => s + (b.barber_earnings ?? 0), 0);
  const totalPlatformFees = completedPaid.reduce((s, b) => s + (b.platform_fee ?? 0), 0);

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      const hasAccount = localBarber?.stripe_account_id;
      const action = hasAccount ? 'get_onboarding_link' : 'create_account';
      const res = await base44.functions.invoke('stripeConnect', {
        action,
        barber_id: localBarber.id,
      });
      if (res.data?.url) {
        window.open(res.data.url, '_blank');
        // Update local state to show in-progress
        setLocalBarber(prev => ({ ...prev, stripe_status: 'onboarding_in_progress' }));
      } else {
        toast.error("Could not start Stripe onboarding. Check your Stripe API key.");
      }
    } catch (err) {
      toast.error("Stripe connect failed: " + err.message);
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncStatus = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('stripeConnect', {
        action: 'sync_status',
        barber_id: localBarber.id,
      });
      if (res.data?.status) {
        setLocalBarber(prev => ({
          ...prev,
          stripe_status: res.data.status,
          payouts_enabled: res.data.payouts_enabled,
        }));
        toast.success(res.data.status === 'active' ? "Stripe is active! Payouts enabled." : "Status synced.");
      }
    } catch (err) {
      toast.error("Sync failed: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-base">Payments & Payouts</h3>
        <div className="flex items-center gap-2">
          {localBarber?.stripe_status === "onboarding_in_progress" && (
            <Button size="sm" variant="ghost" onClick={handleSyncStatus} disabled={syncing} className="h-7 text-xs gap-1">
              <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} /> Sync
            </Button>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${stripeInfo.bg} ${stripeInfo.color}`}>
            {stripeInfo.label}
          </span>
        </div>
      </div>

      {!isPayoutReady && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${stripeInfo.bg}`}>
          <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${stripeInfo.color}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${stripeInfo.color}`}>
              {localBarber?.stripe_status === "onboarding_in_progress"
                ? "Complete your Stripe onboarding to enable payouts."
                : "Connect Stripe to receive automatic payouts."}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your earnings are tracked below. Connect Stripe to receive automatic payouts.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleConnectStripe}
            disabled={connecting}
            className="shrink-0 text-xs gap-1"
          >
            {connecting ? (
              <><RefreshCw className="w-3 h-3 animate-spin" /> Connecting...</>
            ) : localBarber?.stripe_status === "onboarding_in_progress" ? (
              <><ExternalLink className="w-3 h-3" /> Resume Onboarding</>
            ) : (
              <><Zap className="w-3 h-3" /> Connect Stripe</>
            )}
          </Button>
        </div>
      )}

      {isPayoutReady && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <p className="text-sm font-medium text-emerald-700">Payouts are enabled via Stripe.</p>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 bg-secondary rounded-xl">
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs text-muted-foreground">Paid Earnings</span>
          </div>
          <p className="font-heading font-bold text-xl">${totalEarnings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{completedPaid.length} paid bookings</p>
        </div>
        <div className="p-4 bg-secondary rounded-xl">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span className="text-xs text-muted-foreground">Pending Earnings</span>
          </div>
          <p className="font-heading font-bold text-xl">${pendingEarnings.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{completedUnpaid.length} unpaid bookings</p>
        </div>
        <div className="p-4 bg-secondary rounded-xl">
          <div className="flex items-center gap-1.5 mb-2">
            <DollarSign className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-xs text-muted-foreground">Platform Fees</span>
          </div>
          <p className="font-heading font-bold text-xl">${totalPlatformFees.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">from paid bookings</p>
        </div>
        <div className="p-4 bg-secondary rounded-xl">
          <div className="flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-purple-500" />
            <span className="text-xs text-muted-foreground">Upcoming</span>
          </div>
          <p className="font-heading font-bold text-xl">{pendingBookings.length}</p>
          <p className="text-xs text-muted-foreground mt-0.5">confirmed appointments</p>
        </div>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
        <span>
          Commission rates: 20% new clients · 15% repeat clients · 10% your own clients.
          Tips are always 100% yours. Stripe payouts sent automatically once activated.
        </span>
      </div>
    </div>
  );
}