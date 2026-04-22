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
    headline: "Connect Stripe to receive online payments",
    body: "NextCut uses Stripe to verify your identity and deposit earnings directly into your bank account. Stripe does not control your service prices — those are set here in your Services tab. Clicking 'Connect Stripe' will open Stripe's secure hosted form where you'll enter your banking and identity details.",
    cta: "Connect Stripe",
    ctaVariant: "default",
    nextStep: "You'll be taken to Stripe's secure onboarding page. Complete your identity and banking info, then return here.",
  },
  onboarding_required: {
    label: "Setup Incomplete",
    badge: "bg-orange-100 text-orange-700 border-orange-200",
    banner: "bg-orange-50 border-orange-200",
    icon: AlertCircle,
    iconColor: "text-orange-500",
    headline: "Finish your Stripe setup to get paid",
    body: "You started Stripe onboarding but didn't complete it. Click below to return to Stripe and finish entering your banking and identity information. Your NextCut service prices are not affected.",
    cta: "Continue Stripe Setup",
    ctaVariant: "default",
    nextStep: "Return to Stripe's onboarding page and complete all required steps.",
  },
  onboarding_in_progress: {
    label: "Setup In Progress",
    badge: "bg-amber-100 text-amber-700 border-amber-200",
    banner: "bg-amber-50 border-amber-200",
    icon: Clock,
    iconColor: "text-amber-500",
    headline: "Stripe setup is in progress",
    body: "You've been redirected to Stripe's onboarding form. Once you've completed all steps on Stripe's side, click 'Check Status' below so NextCut can confirm your payouts are enabled.",
    cta: "Resume on Stripe",
    ctaVariant: "outline",
    nextStep: "Click 'Check Status' after finishing Stripe's onboarding steps to activate payouts.",
  },
  verification_needed: {
    label: "Verification Needed",
    badge: "bg-red-100 text-red-700 border-red-200",
    banner: "bg-red-50 border-red-200",
    icon: AlertCircle,
    iconColor: "text-red-500",
    headline: "Stripe needs more information",
    body: "Stripe has flagged that additional verification is required before payouts can be enabled. This is common and usually involves uploading an ID or confirming banking details. Click below to return to Stripe and resolve the outstanding items.",
    cta: "Resolve on Stripe",
    ctaVariant: "default",
    nextStep: "Complete the outstanding verification items on Stripe, then click 'Check Status'.",
  },
  active: {
    label: "Payouts Enabled",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    banner: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    headline: "You're set up and ready to receive payouts!",
    body: "Your Stripe account is verified and connected. When clients pay online, NextCut processes the payment and deposits your earnings directly to your bank via Stripe. Your service prices are always set here in NextCut — not in Stripe.",
    cta: null,
    nextStep: null,
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

  const safeBookings = bookings || [];
  const completedPaid = safeBookings.filter(b => b.status === "completed" && b.payment_status === "paid");
  const completedUnpaid = safeBookings.filter(b => b.status === "completed" && b.payment_status !== "paid");
  const pendingBookings = safeBookings.filter(b => b.status === "confirmed");

  const paidEarnings = completedPaid.reduce((s, b) => s + (b.barber_earnings ?? 0), 0);
  const pendingEarnings = completedUnpaid.reduce((s, b) => s + (b.barber_earnings ?? 0), 0);
  const totalPlatformFees = completedPaid.reduce((s, b) => s + (b.platform_fee ?? 0), 0);

  const handleConnectStripe = async () => {
    setConnecting(true);
    // Open a blank window immediately (before await) to avoid popup blockers
    const stripeWindow = window.open("", "_blank");
    try {
      const action = localBarber?.stripe_account_id ? "get_onboarding_link" : "create_account";
      const res = await base44.functions.invoke("stripeConnect", { action, barber_id: localBarber.id });
      if (res.data?.url) {
        stripeWindow.location.href = res.data.url;
        const updated = { ...localBarber, stripe_status: "onboarding_in_progress" };
        setLocalBarber(updated);
        onBarberUpdate?.(updated);
      } else {
        stripeWindow.close();
        toast.error("Could not start Stripe onboarding. Please try again.");
      }
    } catch (err) {
      stripeWindow.close();
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
            {cfg.nextStep && (
              <p className="text-xs font-medium text-foreground mt-2 pt-2 border-t border-current/10">
                ➜ <span className="opacity-70">{cfg.nextStep}</span>
              </p>
            )}
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
          {(stripeStatus === "onboarding_in_progress" || stripeStatus === "verification_needed") && (
            <Button
              variant="outline"
              onClick={handleSyncStatus}
              disabled={syncing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Checking..." : "Check Status"}
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

        {/* Pricing clarity note */}
        <div className="flex items-start gap-2 p-3 rounded-xl bg-accent/50 border border-accent">
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-accent-foreground" />
          <span className="text-xs text-accent-foreground leading-relaxed">
            <strong>Stripe is for payouts only.</strong> Your service names and prices are managed in your <strong>Services tab</strong> — not in your Stripe dashboard. NextCut controls all booking prices.
          </span>
        </div>

        {/* Commission footnote */}
        <div className="flex items-start gap-2 text-xs text-muted-foreground">
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