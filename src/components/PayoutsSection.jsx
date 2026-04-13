import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { DollarSign, Zap, AlertCircle, CheckCircle2, Clock, ExternalLink, Info } from "lucide-react";
import { calcFees, stripeStatusInfo, STRIPE_ACTIVE } from "@/lib/stripeConfig";
import { getCommissionRate } from "@/lib/platformSettings";
import { toast } from "sonner";

export default function PayoutsSection({ barber, bookings }) {
  const [connecting, setConnecting] = useState(false);
  const [commissionRate, setCommissionRate] = useState(0.15);

  useEffect(() => {
    getCommissionRate().then(setCommissionRate);
  }, []);

  const stripeInfo = stripeStatusInfo(barber?.stripe_status || "not_connected");
  const isPayoutReady = barber?.stripe_status === "active" && barber?.payouts_enabled;

  const completedPaid = bookings.filter(b => b.status === "completed" && b.payment_status === "paid");
  const completedUnpaid = bookings.filter(b => b.status === "completed" && b.payment_status !== "paid");
  const pendingBookings = bookings.filter(b => b.status === "confirmed");

  const totalEarnings = completedPaid.reduce((s, b) => s + (b.barber_earnings ?? calcFees(b.price || 0).barberEarnings), 0);
  const pendingEarnings = completedUnpaid.reduce((s, b) => s + (b.barber_earnings ?? calcFees(b.price || 0).barberEarnings), 0);
  const estimatedPlatformFees = completedPaid.reduce((s, b) => s + (b.platform_fee ?? calcFees(b.price || 0).platformFee), 0);

  const handleConnectStripe = async () => {
    if (!STRIPE_ACTIVE) {
      toast.info("Stripe is not yet activated. Add your API keys to enable live payouts.");
      return;
    }
    setConnecting(true);
    await base44.entities.Barber.update(barber.id, { stripe_status: "onboarding_in_progress" });
    toast.success("Stripe onboarding initiated.");
    setConnecting(false);
  };

  return (
    <div className="bg-card rounded-2xl border border-border p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold text-base">Payments & Payouts</h3>
        <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${stripeInfo.bg} ${stripeInfo.color}`}>
          {stripeInfo.label}
        </span>
      </div>

      {!isPayoutReady && (
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${stripeInfo.bg}`}>
          <AlertCircle className={`w-4 h-4 mt-0.5 shrink-0 ${stripeInfo.color}`} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${stripeInfo.color}`}>
              {barber?.stripe_status === "onboarding_in_progress"
                ? "Complete your Stripe onboarding to enable payouts."
                : "Connect Stripe to enable payouts."}
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
            {barber?.stripe_status === "onboarding_in_progress" ? (
              <><ExternalLink className="w-3 h-3" /> Resume</>
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
            <span className="text-xs text-muted-foreground">Est. Platform Fees</span>
          </div>
          <p className="font-heading font-bold text-xl">${estimatedPlatformFees.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{(commissionRate * 100).toFixed(0)}% of paid bookings</p>
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
          Platform fee is {(commissionRate * 100).toFixed(0)}% per booking.
          Stripe payouts are sent automatically once activated.
        </span>
      </div>
    </div>
  );
}