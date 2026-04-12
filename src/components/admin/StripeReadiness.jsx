import { Zap, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { stripeStatusInfo } from "@/lib/stripeConfig";

export default function StripeReadiness({ barbers }) {
  const notConnected = barbers.filter(b => !b.stripe_status || b.stripe_status === "not_connected");
  const inProgress = barbers.filter(b => b.stripe_status === "onboarding_in_progress");
  const ready = barbers.filter(b => b.stripe_status === "active" && b.payouts_enabled);

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <h3 className="font-heading font-semibold text-sm text-slate-700 mb-4 flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-500" />
        Stripe Payout Readiness
      </h3>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="text-center p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <p className="font-heading font-bold text-2xl text-emerald-600">{ready.length}</p>
          <p className="text-xs text-emerald-600 mt-0.5">Payouts Active</p>
        </div>
        <div className="text-center p-3 bg-amber-50 rounded-xl border border-amber-100">
          <p className="font-heading font-bold text-2xl text-amber-600">{inProgress.length}</p>
          <p className="text-xs text-amber-600 mt-0.5">In Progress</p>
        </div>
        <div className="text-center p-3 bg-slate-50 rounded-xl border border-slate-100">
          <p className="font-heading font-bold text-2xl text-slate-500">{notConnected.length}</p>
          <p className="text-xs text-slate-500 mt-0.5">Not Connected</p>
        </div>
      </div>

      {notConnected.length > 0 && (
        <div>
          <p className="text-xs font-medium text-slate-500 mb-2">Barbers needing Stripe setup:</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {notConnected.map(b => (
              <div key={b.id} className="flex items-center justify-between py-1.5 px-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-slate-700">{b.display_name}</p>
                  <p className="text-xs text-slate-400">{b.city}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                  Not Connected
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}