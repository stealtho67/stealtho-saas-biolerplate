import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar, Clock, CheckCircle2, Loader2, CreditCard, Banknote } from "lucide-react";
import { getCommissionRules, resolveCommissionType, calcCommission } from "@/lib/commissionRules";
import { format, addDays, startOfToday } from "date-fns";

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00"
];

export default function BookingModal({ open, onClose, barber, services }) {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingBookings, setExistingBookings] = useState([]);

  const today = startOfToday();
  const dates = Array.from({ length: 14 }, (_, i) => addDays(today, i));
  const canPayOnline = barber?.payouts_enabled && barber?.stripe_account_id;

  useEffect(() => {
    if (open && barber) loadExistingBookings();
    if (!open) {
      setStep(1);
      setSelectedService(null);
      setSelectedDate(null);
      setSelectedTime(null);
      setNotes("");
      setSuccess(false);
    }
  }, [open, barber]);

  const loadExistingBookings = async () => {
    const bookings = await base44.entities.Booking.filter({ barber_id: barber.id, status: "confirmed" });
    setExistingBookings(bookings);
  };

  const getAvailableSlots = () => {
    if (!selectedDate) return TIME_SLOTS;
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    const bookedTimes = existingBookings.filter(b => b.date === dateStr).map(b => b.time);
    return TIME_SLOTS.filter(t => !bookedTimes.includes(t));
  };

  const buildBookingPayload = async () => {
    const user = await base44.auth.me();
    if (!user) { base44.auth.redirectToLogin(window.location.href); return null; }

    const urlParams = new URLSearchParams(window.location.search);
    const sourceParam = urlParams.get("source");
    const referredByBarberId = urlParams.get("ref_barber");
    const customerSource = sourceParam || "marketplace";

    const commissionType = await resolveCommissionType(user.email, barber.id, customerSource);
    const rules = await getCommissionRules();
    const commissionRate = rules[commissionType];
    const { platformFee, barberEarnings } = calcCommission(selectedService.price, 0, commissionRate);

    return {
      user,
      barber_id: barber.id,
      barber_name: barber.display_name,
      service_id: selectedService.id,
      service_name: selectedService.service_name,
      service_price: selectedService.price,
      platform_fee: platformFee,
      barber_earnings: barberEarnings,
      commission_rate: commissionRate,
      commission_type: commissionType,
      customer_source: customerSource,
      is_repeat_client: commissionType === "repeat_client",
      referred_by_barber_id: referredByBarberId || undefined,
      date: format(selectedDate, "yyyy-MM-dd"),
      time: selectedTime,
      duration_minutes: selectedService.duration_minutes,
      notes,
    };
  };

  // Pay online via Stripe Checkout
  const handlePayOnline = async () => {
    setLoading(true);
    const payload = await buildBookingPayload();
    if (!payload) { setLoading(false); return; }

    const res = await base44.functions.invoke("createCheckoutSession", {
      ...payload,
      success_url: `${window.location.origin}/my-bookings?payment=success`,
      cancel_url: `${window.location.origin}/barber/${barber.id}?payment=cancelled`,
    });

    // Redirect to Stripe Checkout
    window.location.href = res.data.checkout_url;
  };

  // Book without online payment (in-person)
  const handleBookInPerson = async () => {
    setLoading(true);
    const payload = await buildBookingPayload();
    if (!payload) { setLoading(false); return; }
    const { user, ...bookingData } = payload;

    await base44.entities.Booking.create({
      client_email: user.email,
      client_name: user.full_name,
      ...bookingData,
      price: bookingData.service_price,
      tip_amount: 0,
      status: "confirmed",
      payment_status: "unpaid",
    });

    base44.integrations.Core.SendEmail({
      to: user.email,
      subject: `Booking Confirmed — ${barber.display_name}`,
      body: `Your ${selectedService.service_name} with ${barber.display_name} is confirmed for ${format(selectedDate, "MMMM d, yyyy")} at ${selectedTime}.\n\nPrice: $${selectedService.price} (pay in person)\n\nSee you soon!`
    }).catch(() => {});

    setSuccess(true);
    setLoading(false);
  };

  const availableSlots = getAvailableSlots();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        {success ? (
          <div className="flex flex-col items-center py-8 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="font-heading font-bold text-xl">Booking Confirmed!</h3>
            <p className="text-muted-foreground text-sm">
              {selectedService?.service_name} with {barber?.display_name}<br />
              {selectedDate && format(selectedDate, "MMMM d, yyyy")} at {selectedTime}<br />
              <span className="text-amber-600 font-medium">Pay in person at your appointment</span>
            </p>
            <Button onClick={onClose} className="mt-2 w-full">Done</Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-heading">
                {step === 1 && "Select a Service"}
                {step === 2 && "Pick a Date"}
                {step === 3 && "Choose a Time"}
                {step === 4 && "Confirm & Pay"}
              </DialogTitle>
              <div className="flex gap-1 mt-2">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className={`h-1 flex-1 rounded-full ${s <= step ? "bg-primary" : "bg-muted"}`} />
                ))}
              </div>
            </DialogHeader>

            {step === 1 && (
              <div className="space-y-2 mt-4">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => { setSelectedService(service); setStep(2); }}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedService?.id === service.id ? "border-primary bg-accent" : "border-border hover:border-primary/30"
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-sm">{service.service_name}</h4>
                        {service.description && <p className="text-xs text-muted-foreground mt-0.5">{service.description}</p>}
                        <span className="text-xs text-muted-foreground mt-1 block">{service.duration_minutes} min</span>
                      </div>
                      <span className="font-heading font-bold text-lg">${service.price}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="mt-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {dates.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => { setSelectedDate(date); setStep(3); }}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        selectedDate?.toDateString() === date.toDateString() ? "border-primary bg-accent" : "border-border hover:border-primary/30"
                      }`}
                    >
                      <div className="text-[10px] text-muted-foreground uppercase">{format(date, "EEE")}</div>
                      <div className="font-heading font-bold text-lg">{format(date, "d")}</div>
                      <div className="text-[10px] text-muted-foreground">{format(date, "MMM")}</div>
                    </button>
                  ))}
                </div>
                <Button variant="ghost" onClick={() => setStep(1)} className="mt-3 w-full">Back</Button>
              </div>
            )}

            {step === 3 && (
              <div className="mt-4">
                {availableSlots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No slots available on this date</p>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((time) => (
                      <button
                        key={time}
                        onClick={() => { setSelectedTime(time); setStep(4); }}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                          selectedTime === time ? "border-primary bg-accent" : "border-border hover:border-primary/30"
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                )}
                <Button variant="ghost" onClick={() => setStep(2)} className="mt-3 w-full">Back</Button>
              </div>
            )}

            {step === 4 && (
              <div className="mt-4 space-y-4">
                {/* Summary */}
                <div className="bg-secondary rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Service</span>
                    <span className="font-medium">{selectedService?.service_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Date</span>
                    <span className="font-medium flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {selectedDate && format(selectedDate, "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Time</span>
                    <span className="font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedTime}
                    </span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-medium">Total</span>
                    <span className="font-heading font-bold text-lg">${selectedService?.price}</span>
                  </div>
                </div>

                <Textarea
                  placeholder="Any special requests? (optional)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="resize-none"
                  rows={2}
                />

                {/* Payment options */}
                {canPayOnline ? (
                  <div className="space-y-2">
                    <Button
                      onClick={handlePayOnline}
                      disabled={loading}
                      className="w-full h-12 rounded-xl shadow-lg shadow-primary/20 gap-2 text-base"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                      Pay Now · ${selectedService?.price}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleBookInPerson}
                      disabled={loading}
                      className="w-full gap-2"
                    >
                      <Banknote className="w-4 h-4" /> Pay in Person
                    </Button>
                    <p className="text-[11px] text-center text-muted-foreground">
                      Online payments are secure and processed by Stripe
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      onClick={handleBookInPerson}
                      disabled={loading}
                      className="w-full h-12 rounded-xl gap-2 text-base"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Booking"}
                    </Button>
                    <p className="text-[11px] text-center text-muted-foreground">Payment collected in person at your appointment</p>
                  </div>
                )}

                <Button variant="ghost" onClick={() => setStep(3)} className="w-full" disabled={loading}>
                  Back
                </Button>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}