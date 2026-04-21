import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Zap, RefreshCw, ExternalLink, CheckCircle2, AlertCircle,
  Clock, DollarSign, Info, ShieldCheck
} from "lucide-react";
import { toast } from "sonner";

const STATUS_CONFIG = {
  not_connected: {
    label: "Not Connected",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    banner: "bg-slate-50 border-slate-200",
    icon: AlertCircle,
    iconColor: "text-slate-400",
    headline: "Connect Stripe to get paid",
    body: "Stripe is required to receive automatic payouts from client bookings. Without it, you can still accept bookings but won't receive online payments.",
    cta: "Connect Stripe",
    ctaVariant: "default",
  },
  onboarding_required: {
    label: "Onboarding Required",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    banner: "bg-orange-50 border-orange-200",
    icon: AlertCircle,
    iconColor: "text-orange-500",
    headline: "Finish Stripe setup to enable payouts",
    body: "You've started connecting Stripe, but need to complete the onboarding steps before payouts can be enabled.",
    cta: "Continue Stripe Setup",
    ctaVariant: "default",
  },
  onboarding_in_progress: {
    label: "Setup In Progress",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    banner: "bg-amber-50 border-amber-200",
    icon: Clock,
    iconColor: "text-amber-500",
    headline: "Stripe setup in progress",
    body: "You've started Stripe onboarding. If you haven't finished, click below to resume. Once complete, click Sync Status to update your payout status.",
    cta: "Resume Stripe Setup",
    ctaVariant: "outline",
  },
  active: {
    label: "Payouts Enabled",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    banner: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    headline: "You're payout-ready!",
    body: "Your Stripe account is connected and payouts are enabled. Clients who pay online will have earnings sent directly to your bank account.",
    cta: null,
  },
};

export default function StripePayoutsSection({ barber, bookings, onBarberUpdate }) {
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [localBarber, setLocalBarber] = useState(barber);

  useEffect(() => { setLocalBarber(barber); }, [barber]);

  const stripeStatus = localBarber?.stripe_status || "not_connected";
  const cfg = STATUS_CONFIG[stripeStatus] || STATUS_CONFIG.not_connected;
  const isActive = stripeStatus === "active" && localBarber?.payouts_enabled;

  const completedPaid = bookings.filter(b => b.status === "completed" && b.payment_status === "paid");
  const completedUnpaid = bookings.filter(b => b.status === "completed" && b.payment_status !== "paid");
  const pendingBookings = bookings.filter(b => b.status === "confirmed");

  const paidEarnings = completedPaid.reduce((s, b) => s + (b.barber_earnings ?? 0), 0);
  const pendingEarnings = completedUnpaid.reduce((s, b) => s + (b.barber_earnings ?? 0), 0);
  const totalPlatformFees = completedPaid.reduce((s, b) => s + (b.platform_fee ?? 0), 0);

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      const action = localBarber?.stripe_account_id ? "get_onboarding_link" : "create_account";
      const res = await base44.functions.invoke("stripeConnect", { action, barber_id: localBarber.id });
      if (res.data?.url) {
        window.open(res.data.url, "_blank");
        const updated = { ...localBarber, stripe_status: "onboarding_in_progress" };
        setLocalBarber(updated);
        onBarberUpdate?.(updated);
      } else {
        toast.error("Could not start Stripe onboarding. Please try again.");
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
      const res = await base44.functions.invoke("stripeConnect", { action: "sync_status", barber_id: localBarber.id });
      if (res.data?.status) {
        const updated = { ...localBarber, stripe_status: res.data.status, payouts_enabled: res.data.payouts_enabled };
        setLocalBarber(updated);
        onBarberUpdate?.(updated);
        if (res.data.status === "active") {
          toast.success("🎉 Payouts are now enabled!");
        } else {
          toast.success("Status synced.");
        }
      }
    } catch (err) {
      toast.error("Sync failed: " + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const Icon = cfg.icon;

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Section Header */}
      <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <h3 className="font-heading font-bold text-base">Payments & Payouts</h3>
        </div>
        <div className="flex items-center gap-2">
          {stripeStatus !== "not_connected" && (
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSyncStatus}
              disabled={syncing}
              className="h-7 text-xs gap-1 text-muted-foreground"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync Status"}
            </Button>
          )}
          <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Status Banner */}
        <div className={`flex items-start gap-3 p-4 rounded-xl border ${cfg.banner}`}>
          <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${cfg.iconColor}`} />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">{cfg.headline}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{cfg.body}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          {cfg.cta && (
            <Button
              variant={cfg.ctaVariant}
              onClick={handleConnectStripe}
              disabled={connecting}
              className={`gap-2 ${cfg.ctaVariant === "default" ? "shadow-md shadow-primary/20" : ""}`}
            >
              {connecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : stripeStatus === "not_connected" ? (
                <Zap className="w-4 h-4" />
              ) : (
                <ExternalLink className="w-4 h-4" />
              )}
              {connecting ? "Opening Stripe..." : cfg.cta}
            </Button>
          )}
          {stripeStatus === "onboarding_in_progress" && (
            <Button
              variant="outline"
              onClick={handleSyncStatus}
              disabled={syncing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Checking..." : "Check If Complete"}
            </Button>
          )}
        </div>

        {/* Earnings Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 bg-secondary rounded-xl">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Paid Earnings</span>
            </div>
            <p className="font-heading font-bold text-xl">${paidEarnings.toFixed(2)}</p>
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

        {/* Info footnote */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground pt-1">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>
            Commission rates: <strong>20%</strong> new NextCut clients · <strong>15%</strong> repeat clients · <strong>10%</strong> your own clients.
            Tips are always <strong>100% yours</strong> and never shared with the platform.
          </span>
        </div>
      </div>
    </div>
  );
}