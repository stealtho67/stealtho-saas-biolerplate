import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Loader2, ExternalLink, DollarSign, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function CollectPaymentModal({ booking, barber, open, onClose, onMarkPaid }) {
  const [finalPrice, setFinalPrice] = useState(String(booking?.service_price || booking?.price || ""));
  const [tipAmount, setTipAmount] = useState("0");
  const [loading, setLoading] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState(null);

  const canUseStripe = barber?.payouts_enabled && barber?.stripe_account_id;

  const servicePrice = parseFloat(finalPrice) || 0;
  const tip = parseFloat(tipAmount) || 0;
  const total = servicePrice + tip;

  const handleGenerateLink = async () => {
    if (servicePrice <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    setLoading(true);
    const res = await base44.functions.invoke("createPaymentLink", {
      booking_id: booking.id,
      final_price: servicePrice,
      tip_amount: tip,
    });
    setLoading(false);
    if (res.data?.checkout_url) {
      setCheckoutUrl(res.data.checkout_url);
    } else {
      toast.error(res.data?.error || "Failed to generate payment link");
    }
  };

  const handleOpenOnDevice = () => {
    window.open(checkoutUrl, "_blank");
  };

  const handleClose = () => {
    setCheckoutUrl(null);
    setFinalPrice(String(booking?.service_price || booking?.price || ""));
    setTipAmount("0");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-heading">Collect Payment</DialogTitle>
        </DialogHeader>

        {!checkoutUrl ? (
          <div className="space-y-4 mt-2">
            {/* Booking summary */}
            <div className="bg-secondary rounded-xl p-4 text-sm space-y-1">
              <p className="font-medium">{booking?.service_name}</p>
              <p className="text-xs text-muted-foreground">{booking?.client_name} · {booking?.date} at {booking?.time}</p>
            </div>

            {/* Price fields */}
            <div className="space-y-3">
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Service Price ($)</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={finalPrice}
                    onChange={(e) => setFinalPrice(e.target.value)}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Tip Amount ($) — 100% to you</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                    className="pl-8"
                    placeholder="0.00"
                  />
                </div>
              </div>

              {/* Quick tip buttons */}
              <div className="flex gap-2">
                {[0, 5, 10, 20].map(t => (
                  <button
                    key={t}
                    onClick={() => setTipAmount(String(t))}
                    className={`flex-1 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                      parseFloat(tipAmount) === t
                        ? "border-primary bg-accent text-primary"
                        : "border-border hover:border-primary/40"
                    }`}
                  >
                    {t === 0 ? "No tip" : `$${t}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="flex justify-between items-center py-3 border-t border-border">
              <span className="text-sm text-muted-foreground">Total to charge client</span>
              <span className="font-heading font-bold text-xl">${total.toFixed(2)}</span>
            </div>

            {canUseStripe ? (
              <Button
                onClick={handleGenerateLink}
                disabled={loading || servicePrice <= 0}
                className="w-full gap-2 h-11 shadow-md shadow-primary/20"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CreditCard className="w-4 h-4" />
                )}
                {loading ? "Generating..." : "Generate Stripe Payment Link"}
              </Button>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-700 text-center">
                Connect Stripe from your Dashboard → Payouts tab to collect card payments.
              </div>
            )}

            <div className="relative flex items-center gap-2">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={() => { onMarkPaid(booking); handleClose(); }}>
              Mark as Paid (Cash / Already Paid)
            </Button>
          </div>
        ) : (
          <div className="space-y-4 mt-2 text-center">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <CreditCard className="w-7 h-7 text-primary" />
            </div>

            <div>
              <p className="font-heading font-bold text-lg">Payment link ready!</p>
              <p className="text-sm text-muted-foreground mt-1">
                Have the client open this link on their phone to pay <span className="font-semibold text-foreground">${total.toFixed(2)}</span> securely via Stripe.
              </p>
            </div>

            <Button
              className="w-full gap-2 h-11 shadow-md shadow-primary/20"
              onClick={handleOpenOnDevice}
            >
              <ExternalLink className="w-4 h-4" />
              Open Payment Page
            </Button>

            <p className="text-xs text-muted-foreground">
              Hand your phone to the client — they'll enter their card details on Stripe's secure page. Or share the link via text.
            </p>

            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={handleClose}>
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}