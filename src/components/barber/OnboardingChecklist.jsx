import { CheckCircle2, Circle, Clock, AlertCircle, ChevronRight } from "lucide-react";

/**
 * Computes checklist steps from barber + services data.
 * Returns { steps, readiness: "not_ready" | "almost_ready" | "live_ready" }
 */
export function computeChecklist({ barber, services }) {
  const steps = [
    {
      id: "profile",
      label: "Complete your profile",
      description: "Add your bio, city, photo, and years of experience",
      done: !!(barber?.bio && barber?.city && barber?.profile_photo && barber?.display_name),
      tab: "profile",
    },
    {
      id: "services",
      label: "Add services & pricing",
      description: "List at least one service with a price so clients can book you",
      done: services?.length > 0,
      tab: "services",
    },
    {
      id: "portfolio",
      label: "Upload portfolio images",
      description: "Show off your work — barbers with photos get more bookings",
      done: barber?.portfolio_images?.length > 0,
      tab: "portfolio",
      optional: true,
    },
    {
      id: "license",
      label: "Upload barber license",
      description: "Required for admin approval — helps speed up your verification",
      done: !!barber?.license_image,
      tab: "profile",
    },
    {
      id: "approved",
      label: "Get approved by admin",
      description: "Our team reviews your profile before you appear publicly",
      done: barber?.status === "active",
      pending: barber?.status === "pending",
      actionLabel: barber?.status === "pending" ? "Under Review" : null,
      noTab: true,
    },
    {
      id: "stripe",
      label: "Connect Stripe for payouts",
      description: "Required to receive automatic payouts from client bookings",
      done: barber?.stripe_status === "active" && barber?.payouts_enabled,
      pending: barber?.stripe_status === "onboarding_in_progress",
      tab: "payouts",
    },
    {
      id: "payouts",
      label: "Payouts enabled",
      description: "Stripe has verified your account and payouts are live",
      done: !!barber?.payouts_enabled,
      pending: barber?.stripe_status === "onboarding_in_progress",
      noTab: true,
    },
  ];

  const required = steps.filter(s => !s.optional);
  const doneCount = required.filter(s => s.done).length;
  const total = required.length;

  let readiness;
  if (doneCount === total) readiness = "live_ready";
  else if (doneCount >= total - 2) readiness = "almost_ready";
  else readiness = "not_ready";

  return { steps, readiness, doneCount, total };
}

const readinessConfig = {
  live_ready: {
    label: "Ready to Go Live",
    color: "text-emerald-700",
    bg: "bg-emerald-50 border-emerald-200",
    dot: "bg-emerald-500",
  },
  almost_ready: {
    label: "Almost Ready",
    color: "text-amber-700",
    bg: "bg-amber-50 border-amber-200",
    dot: "bg-amber-400",
  },
  not_ready: {
    label: "Setup Incomplete",
    color: "text-slate-600",
    bg: "bg-slate-50 border-slate-200",
    dot: "bg-slate-400",
  },
};

export default function OnboardingChecklist({ barber, services, onNavigate }) {
  const { steps, readiness, doneCount, total } = computeChecklist({ barber, services });
  const cfg = readinessConfig[readiness];
  const pct = Math.round((doneCount / total) * 100);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Header with readiness indicator */}
      <div className={`px-5 pt-5 pb-4 border-b border-border`}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-bold text-base">Setup Checklist</h3>
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${cfg.bg} ${cfg.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
            {cfg.label}
          </span>
        </div>
        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-xs text-muted-foreground shrink-0">{doneCount}/{total} done</span>
        </div>
      </div>

      {/* Steps list */}
      <div className="divide-y divide-border">
        {steps.map((step) => {
          const isClickable = !step.done && !step.noTab && !step.pending && onNavigate;
          return (
            <button
              key={step.id}
              onClick={() => isClickable && onNavigate(step.tab)}
              disabled={!isClickable}
              className={`w-full text-left flex items-center gap-3 px-5 py-3.5 transition-colors ${
                isClickable ? "hover:bg-accent cursor-pointer" : "cursor-default"
              }`}
            >
              {/* Icon */}
              <div className="shrink-0">
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : step.pending ? (
                  <Clock className="w-5 h-5 text-amber-400" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300" />
                )}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium leading-tight ${step.done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  {step.label}
                  {step.optional && <span className="ml-1.5 text-xs font-normal text-muted-foreground">(optional)</span>}
                </p>
                {!step.done && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{step.description}</p>
                )}
              </div>

              {/* Action */}
              {step.pending && (
                <span className="shrink-0 text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-medium">
                  {step.actionLabel || "In Progress"}
                </span>
              )}
              {isClickable && (
                <ChevronRight className="shrink-0 w-4 h-4 text-muted-foreground" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}