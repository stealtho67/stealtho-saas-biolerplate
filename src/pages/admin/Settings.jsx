import { useState, useEffect } from "react";
import { getCommissionRate, setCommissionRate } from "@/lib/platformSettings";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const RATES = [
  { value: 0.10, label: "10%", desc: "Lower fee — good for growth phase" },
  { value: 0.15, label: "15%", desc: "Standard — recommended" },
  { value: 0.20, label: "20%", desc: "Higher fee — premium positioning" },
];

export default function AdminSettings() {
  const [currentRate, setCurrentRate] = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCommissionRate().then((rate) => {
      setCurrentRate(rate);
      setSelected(rate);
      setLoading(false);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    await setCommissionRate(selected);
    setCurrentRate(selected);
    setSaving(false);
    toast.success(`Commission rate updated to ${(selected * 100).toFixed(0)}%`);
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="w-8 h-8 border-4 border-slate-200 border-t-primary rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 max-w-2xl">
      <h1 className="font-heading font-bold text-2xl text-slate-900 mb-1">Platform Settings</h1>
      <p className="text-sm text-slate-500 mb-6">Configure commission rates and platform behavior.</p>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="font-heading font-semibold text-slate-800 mb-1">Commission Rate</h2>
        <p className="text-xs text-slate-500 mb-4">
          This percentage is deducted from each booking. Barbers see their net earnings in their dashboard.
          Currently: <strong>{(currentRate * 100).toFixed(0)}%</strong>
        </p>
        <div className="space-y-3 mb-6">
          {RATES.map((r) => (
            <button
              key={r.value}
              onClick={() => setSelected(r.value)}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                selected === r.value
                  ? "border-primary bg-accent"
                  : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div>
                <p className="font-semibold text-slate-800">{r.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{r.desc}</p>
              </div>
              {selected === r.value && <CheckCircle2 className="w-5 h-5 text-primary" />}
            </button>
          ))}
        </div>
        <div className="p-4 bg-slate-50 rounded-xl text-sm text-slate-600 mb-4">
          <strong>Example at {(selected * 100).toFixed(0)}%:</strong> A $50 booking → platform earns ${(50 * selected).toFixed(2)}, barber earns ${(50 - 50 * selected).toFixed(2)}
        </div>
        <Button onClick={save} disabled={saving || selected === currentRate} className="w-full">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Commission Rate"}
        </Button>
      </div>
    </div>
  );
}