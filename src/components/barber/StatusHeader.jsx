import { CheckCircle2, Clock, AlertTriangle, Ban, ShieldCheck, Zap } from "lucide-react";

const APPLICATION_STATUS = {
  pending: {
    label: "Pending Approval",
    description: "Your application is being reviewed by our team. You are not yet visible to clients.",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    iconBg: "bg-amber-100",
  },
  action_required: {
    label: "Action Required",
    description: "Admin has flagged your profile. You are not visible to clients until the required steps are completed. Check the note below.",
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    iconBg: "bg-orange-100",
  },
  active: {
    label: "Approved & Active",
    description: "You are approved and visible on the marketplace. Clients can find and book you.",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    iconBg: "bg-emerald-100",
  },
  suspended: {
    label: "Suspended",
    description: "Your account has been suspended. Contact support to resolve this.",
    icon: Ban,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    iconBg: "bg-red-100",
  },
};

const STRIPE_STATUS = {
  not_connected: {
    label: "Stripe Not Connected",
    icon: AlertTriangle,
    color: "text-slate-500",
    bg: "bg-slate-50 border-slate-200",
  },
  onboarding_in_progress: {
    label: "Stripe Setup In Progress",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
  },
  onboarding_required: {
    label: "Stripe Verification Needed",
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
  },
  verification_needed: {
    label: "Stripe Verification Needed",
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
  },
  active: {
    label: "Payouts Enabled",
    icon: ShieldCheck,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
  },
};

export default function StatusHeader({ barber }) {
  if (!barber) return null;
  const appStatus = APPLICATION_STATUS[barber.status] || APPLICATION_STATUS.pending;
  const stripeStatus = STRIPE_STATUS[barber.stripe_status || "not_connected"] || STRIPE_STATUS.not_connected;
  const AppIcon = appStatus.icon;
  const StripeIcon = stripeStatus.icon;
  const isFullyLive = barber.status === "active" && barber.payouts_enabled;

  return (
    <div className="space-y-3">
      {/* Application Status Banner */}
      <div className={`flex items-start gap-3 p-4 rounded-2xl border ${appStatus.bg}`}>
        <div className={`w-9 h-9 rounded-xl ${appStatus.iconBg} flex items-center justify-center shrink-0`}>
          <AppIcon className={`w-5 h-5 ${appStatus.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className={`font-semibold text-sm ${appStatus.color}`}>{appStatus.label}</p>
            {isFullyLive && (
              <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                <Zap className="w-3 h-3" /> Live on Marketplace
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{appStatus.description}</p>
          {/* Admin note — shown prominently when action is required */}
          {barber.status === "action_required" && barber.admin_note && (
            <div className="mt-3 p-3 bg-white border border-orange-300 rounded-xl">
              <p className="text-xs font-bold text-orange-700 mb-1 uppercase tracking-wide">What you need to complete:</p>
              <p className="text-sm text-orange-900 leading-relaxed font-medium">{barber.admin_note}</p>
            </div>
          )}
        </div>
      </div>

      {/* Stripe Status Pill */}
      <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border ${stripeStatus.bg}`}>
        <StripeIcon className={`w-4 h-4 shrink-0 ${stripeStatus.color}`} />
        <span className={`text-xs font-semibold ${stripeStatus.color}`}>Payouts — {stripeStatus.label}</span>
        {barber.stripe_status !== "active" && (
          <span className="ml-auto text-xs text-muted-foreground">
            Connect Stripe to receive online payments
          </span>
        )}
      </div>
    </div>
  );
}