import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Zap, RefreshCw, ExternalLink, CheckCircle2, AlertCircle,
  Clock, DollarSign, Info, ShieldCheck, LayoutDashboard, History
} from "lucide-react";
import { getCommissionRules } from "@/lib/commissionRules";
import { toast } from "sonner";
import PayoutHistory from "./PayoutHistory";

const STATUS_CONFIG = {
  not_connected: {
    label: "Not Connected",
    badge: "bg-slate-100 text-slate-600 border-slate-200",
    banner: "bg-slate-50 border-slate-200",
    icon: AlertCircle,
    iconColor: "text-slate-400",
    headline: "Connect Stripe to receive online payments",
    body: "NextCut uses Stripe to verify your identity and deposit earnings directly into your bank account. Stripe does not control your service prices — those are set here in your Services tab. Clicking 'Connect Stripe' will open Stripe's secure hosted form.",
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
    body: "You started Stripe onboarding but didn't complete it. Click below to return to Stripe and finish entering your banking and identity information.",
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
    body: "You've started the Stripe onboarding. If you haven't finished yet, click 'Resume on Stripe' below. Once you've completed all steps, click 'Check Status' to activate payouts.",
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
    label: "Payouts Enabled ✓",
    badge: "bg-emerald-100 text-emerald-700 border-emerald-200",
    banner: "bg-emerald-50 border-emerald-200",
    icon: CheckCircle2,
    iconColor: "text-emerald-500",
    headline: "You're set up and ready to receive payouts!",
    body: "Your Stripe account is verified and connected. When clients pay online, NextCut processes the payment and transfers your earnings directly to your bank. Your service prices are always set here in NextCut — not in Stripe.",
    cta: null,
    nextStep: null,
  },
};

export default function StripePayoutsSection({ barber, bookings, onBarberUpdate }) {
  const [connecting, setConnecting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [localBarber, setLocalBarber] = useState(barber);
  const [rates, setRates] = useState(null);
  const [requirements, setRequirements] = useState(null);

  useEffect(() => { setLocalBarber(barber); }, [barber]);
  useEffect(() => { getCommissionRules().then(setRates); }, []);

  // Auto-sync once on mount if status isn't conclusive yet
  useEffect(() => {
    const status = barber?.stripe_status;
    if (status === 'onboarding_in_progress' || status === 'onboarding_required') {
      handleSyncStatus(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const updateBarberState = (updates) => {
    const updated = { ...localBarber, ...updates };
    setLocalBarber(updated);
    onBarberUpdate?.(updated);
  };

  const handleConnectStripe = async () => {
    setConnecting(true);
    try {
      // Unified action — backend handles create vs resume automatically
      const res = await base44.functions.invoke("stripeConnect", {
        action: "connect",
        barber_id: localBarber.id,
      });

      if (res.data?.url) {
        updateBarberState({ stripe_status: "onboarding_in_progress" });
        // Full-page redirect — Stripe returns via return_url / refresh_url
        window.location.href = res.data.url;
      } else if (res.data?.error) {
        // e.g. stale account was reset — tell user to retry
        toast.error(res.data.error);
        // If the account was reset on Stripe's side, clear local state so button resets
        if (res.status === 409) {
          updateBarberState({ stripe_account_id: null, stripe_status: "not_connected" });
        }
      } else {
        toast.error("Could not start Stripe onboarding. Please try again.");
        console.error("[StripePayouts] unexpected response:", res.data);
      }
    } catch (err) {
      toast.error("Stripe connect failed: " + (err.message || "Unknown error"));
      console.error("[StripePayouts] connect error:", err);
    } finally {
      setConnecting(false);
    }
  };

  const handleSyncStatus = async (silent = false) => {
    if (!silent) setSyncing(true);
    try {
      const res = await base44.functions.invoke("stripeConnect", {
        action: "sync_status",
        barber_id: localBarber.id,
      });

      if (res.data?.status) {
        updateBarberState({
          stripe_status: res.data.status,
          payouts_enabled: res.data.payouts_enabled,
          stripe_onboarding_complete: res.data.charges_enabled && res.data.payouts_enabled,
        });
        if (res.data.requirements) setRequirements(res.data.requirements);

        if (!silent) {
          if (res.data.status === "active") {
            toast.success("🎉 Payouts are now enabled!");
          } else if (res.data.status === "verification_needed") {
            toast.warning("Stripe needs more info before payouts can be enabled.");
          } else if (res.data.status === "onboarding_in_progress") {
            toast.info("Still waiting on Stripe. Finish your onboarding and try again.");
          } else {
            toast.success("Status updated.");
          }
        }
      }
    } catch (err) {
      if (!silent) toast.error("Sync failed: " + (err.message || "Unknown error"));
      console.error("[StripePayouts] sync error:", err);
    } finally {
      if (!silent) setSyncing(false);
    }
  };

  const handleOpenDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const res = await base44.functions.invoke("stripeConnect", {
        action: "get_dashboard_link",
        barber_id: localBarber.id,
      });
      if (res.data?.url) {
        window.open(res.data.url, "_blank");
      } else {
        toast.error("Could not open Stripe dashboard.");
      }
    } catch (err) {
      toast.error("Could not open Stripe dashboard: " + (err.message || "Unknown error"));
    } finally {
      setLoadingDashboard(false);
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
              onClick={() => handleSyncStatus(false)}
              disabled={syncing}
              className="h-7 text-xs gap-1 text-muted-foreground"
            >
              <RefreshCw className={`w-3 h-3 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Syncing..." : "Sync"}
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

        {/* Requirements warning */}
        {requirements?.currently_due?.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <p className="text-xs font-semibold text-red-700 mb-1">Outstanding requirements:</p>
            <ul className="text-xs text-red-600 space-y-0.5">
              {requirements.currently_due.map(req => (
                <li key={req}>• {req.replace(/_/g, " ")}</li>
              ))}
            </ul>
          </div>
        )}

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

          {(stripeStatus === "onboarding_in_progress" || stripeStatus === "verification_needed" || stripeStatus === "onboarding_required") && (
            <Button
              variant="outline"
              onClick={() => handleSyncStatus(false)}
              disabled={syncing}
              className="gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? "animate-spin" : ""}`} />
              {syncing ? "Checking..." : "Check Status"}
            </Button>
          )}

          {isActive && (
            <Button
              variant="outline"
              onClick={handleOpenDashboard}
              disabled={loadingDashboard}
              className="gap-2"
            >
              {loadingDashboard ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <LayoutDashboard className="w-4 h-4" />
              )}
              {loadingDashboard ? "Opening..." : "Stripe Dashboard"}
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
            Commission rates: {rates ? (
              <>
                <strong>{(rates.new_nextcut_lead * 100).toFixed(0)}%</strong> new NextCut clients ·{" "}
                <strong>{(rates.repeat_client * 100).toFixed(0)}%</strong> repeat clients ·{" "}
                <strong>{(rates.barber_direct_client * 100).toFixed(0)}%</strong> your own clients.{" "}
              </>
            ) : "Loading rates... "}
            Tips are always <strong>100% yours</strong> and never shared with the platform.
          </span>
        </div>

        {/* Payout History */}
        <div className="border-t border-border pt-4">
          <div className="flex items-center gap-2 mb-3">
            <History className="w-4 h-4 text-primary" />
            <h4 className="font-heading font-semibold text-sm">Payout History</h4>
          </div>
          <PayoutHistory barber={localBarber} />
        </div>
      </div>
    </div>
  );
}