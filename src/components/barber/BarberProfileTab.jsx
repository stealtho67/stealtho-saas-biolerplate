import { Link } from "react-router-dom";
import { CheckCircle2, Circle, Clock, AlertTriangle, ShieldCheck, ChevronRight, Zap, Info, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { computeChecklist } from "@/components/barber/OnboardingChecklist";

const STATUS_CONFIG = {
  pending: {
    label: "Pending Admin Approval",
    description: "Your application is under review. You are not yet visible to clients on the marketplace.",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/30",
    iconBg: "bg-amber-500/20",
    icon: Clock,
  },
  action_required: {
    label: "Action Required",
    description: "Admin has flagged your profile — check the note in your Dashboard. You are not visible until resolved.",
    color: "text-orange-400",
    bg: "bg-orange-500/10 border-orange-500/30",
    iconBg: "bg-orange-500/20",
    icon: AlertTriangle,
  },
  active: {
    label: "Approved & Active",
    description: "You are approved and visible on the marketplace. Clients can find and book you.",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/30",
    iconBg: "bg-primary/20",
    icon: ShieldCheck,
  },
  suspended: {
    label: "Account Suspended",
    description: "Your account has been suspended. Contact support to resolve this.",
    color: "text-destructive",
    bg: "bg-destructive/10 border-destructive/30",
    iconBg: "bg-destructive/20",
    icon: Ban,
  },
};

const STRIPE_CONFIG = {
  not_connected: { label: "Not Connected", color: "text-muted-foreground", bg: "bg-secondary", icon: AlertTriangle },
  onboarding_in_progress: { label: "Setup In Progress", color: "text-amber-400", bg: "bg-amber-500/20", icon: Clock },
  onboarding_required: { label: "Onboarding Required", color: "text-orange-400", bg: "bg-orange-500/20", icon: AlertTriangle },
  verification_needed: { label: "Verification Needed", color: "text-destructive", bg: "bg-destructive/20", icon: AlertTriangle },
  active: { label: "Payouts Enabled", color: "text-primary", bg: "bg-primary/20", icon: ShieldCheck },
};

// Compact checklist step icons only
function ChecklistRow({ step }) {
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-border last:border-0">
      <div className="shrink-0">
        {step.done
          ? <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 w-[18px] h-[18px]" />
          : step.pending
          ? <Clock className="text-amber-400 w-[18px] h-[18px]" />
          : <Circle className="text-slate-300 w-[18px] h-[18px]" />}
      </div>
      <p className={`text-sm flex-1 ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
        {step.label}
        {step.optional && <span className="ml-1 text-xs text-muted-foreground">(optional)</span>}
      </p>
      {step.pending && (
        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium shrink-0">In Progress</span>
      )}
    </div>
  );
}

export default function BarberProfileTab({ barber, services }) {
  if (!barber) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 text-center">
        <p className="text-muted-foreground text-sm mb-4">No barber profile found.</p>
        <Link to="/apply">
          <Button>Apply as a Barber</Button>
        </Link>
      </div>
    );
  }

  const appStatus = STATUS_CONFIG[barber.status] || STATUS_CONFIG.pending;
  const stripeStatus = STRIPE_CONFIG[barber.stripe_status || "not_connected"] || STRIPE_CONFIG.not_connected;
  const AppIcon = appStatus.icon;
  const StripeIcon = stripeStatus.icon;
  const isFullyLive = barber.status === "active" && barber.payouts_enabled;
  const { steps, readiness, doneCount, total } = computeChecklist({ barber, services });
  const pct = Math.round((doneCount / total) * 100);

  const readinessLabel = {
    live_ready: { label: "Ready to Go Live", color: "text-primary bg-primary/10 border-primary/30" },
    almost_ready: { label: "Almost Ready", color: "text-amber-400 bg-amber-500/10 border-amber-500/30" },
    not_ready: { label: "Setup Incomplete", color: "text-muted-foreground bg-secondary border-border" },
  }[readiness];

  return (
    <div className="space-y-4">
      {/* Application Status */}
      <div className={`flex items-start gap-3 p-4 rounded-2xl border ${appStatus.bg}`}>
        <div className={`w-9 h-9 rounded-xl ${appStatus.iconBg} flex items-center justify-center shrink-0`}>
          <AppIcon className={`w-5 h-5 ${appStatus.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className={`font-semibold text-sm ${appStatus.color}`}>{appStatus.label}</p>
            {isFullyLive && (
              <span className="flex items-center gap-1 text-xs font-semibold text-primary bg-primary/10 border border-primary/30 px-2.5 py-0.5 rounded-full">
                <Zap className="w-3 h-3" /> Live on Marketplace
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{appStatus.description}</p>
        </div>
      </div>

      {/* Stripe Status */}
      <div className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl">
        <div className={`w-8 h-8 rounded-lg ${stripeStatus.bg} flex items-center justify-center shrink-0`}>
          <StripeIcon className={`w-4 h-4 ${stripeStatus.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground">Stripe Payouts</p>
          <p className={`text-xs ${stripeStatus.color}`}>{stripeStatus.label}</p>
        </div>
      </div>

      {/* Progress + Checklist */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="px-5 pt-5 pb-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-heading font-semibold text-sm">Go-Live Checklist</h3>
            <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${readinessLabel.color}`}>
              {readinessLabel.label}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="text-xs text-muted-foreground shrink-0">{doneCount}/{total}</span>
          </div>
        </div>
        <div className="px-5">
          {steps.map(step => <ChecklistRow key={step.id} step={step} />)}
        </div>
      </div>

      {/* Guidance */}
      <div className="bg-secondary rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <Info className="w-4 h-4 text-primary shrink-0" />
          <p className="text-sm font-semibold">How it works</p>
        </div>
        <ul className="space-y-1.5 text-xs text-muted-foreground list-none">
          <li className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />Only approved barbers appear publicly on the NextCut marketplace.</li>
          <li className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />Clients can only search and book approved barbers.</li>
          <li className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />Stripe is required to receive automatic payouts from online bookings.</li>
          <li className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />Tips are always 100% yours — the platform never takes a cut of tips.</li>
          <li className="flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 mt-0.5 text-primary shrink-0" />Platform fee: 7% for new NextCut leads, 4% for returning clients, 3% via direct link. 0% (you keep 100%) when booked via your referral link.</li>
        </ul>
      </div>

      {/* CTA to full dashboard */}
      <Link to="/dashboard">
        <Button className="w-full gap-2">
          Open Full Barber Dashboard
          <ChevronRight className="w-4 h-4" />
        </Button>
      </Link>
    </div>
  );
}