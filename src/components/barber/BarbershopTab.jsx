import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Building2, MapPin, Phone, Globe, Scissors, Calendar, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format, parseISO } from "date-fns";

export default function BarbershopTab({ barber, bookings = [] }) {
  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (barber?.barbershop_id) {
      base44.entities.Barbershop.get(barber.barbershop_id)
        .then(setShop)
        .catch(() => {})
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [barber?.barbershop_id]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-6 h-6 border-4 border-muted border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // No shop linked
  if (!barber?.barbershop_id || !shop) {
    return (
      <div className="bg-card rounded-2xl border border-border p-8 text-center space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
          <Building2 className="w-7 h-7 text-muted-foreground/40" />
        </div>
        <h3 className="font-heading font-semibold">Not linked to a barbershop</h3>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
          You're currently operating as an independent barber. If you're part of a shop, ask your admin to link your profile.
        </p>
      </div>
    );
  }

  // Shop-linked barber view
  const shopBookings = bookings.filter(b => b.status === "confirmed" || b.status === "completed");
  const upcomingFromShop = bookings
    .filter(b => b.status === "confirmed")
    .sort((a, b) => new Date(a.date + "T" + a.time) - new Date(b.date + "T" + b.time))
    .slice(0, 5);

  const totalCompleted = bookings.filter(b => b.status === "completed").length;
  const totalEarnings = bookings
    .filter(b => b.status === "completed")
    .reduce((sum, b) => sum + (b.barber_earnings ?? b.price ?? 0), 0);

  return (
    <div className="space-y-4">
      {/* Shop info card */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
            {shop.shop_logo ? (
              <img src={shop.shop_logo} alt={shop.shop_name} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-7 h-7 text-muted-foreground/40" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-heading font-bold text-base">{shop.shop_name}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{shop.address || shop.neighborhood || shop.city}</span>
            </div>
            {shop.description && (
              <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-2">{shop.description}</p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 mt-4">
          {shop.phone && (
            <a href={`tel:${shop.phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Phone className="w-3.5 h-3.5" /> {shop.phone}
            </a>
          )}
          {shop.website && (
            <a href={shop.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
              <Globe className="w-3.5 h-3.5" /> Website <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>

        <Link to={`/barbershop/${shop.id}`} className="block mt-4">
          <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 rounded-xl">
            <ExternalLink className="w-3.5 h-3.5" /> View Shop Public Page
          </Button>
        </Link>
      </div>

      {/* My activity at this shop */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center mb-2">
            <Scissors className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="font-heading font-bold text-2xl">{totalCompleted}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Completed bookings</p>
        </div>
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
            <Calendar className="w-4 h-4 text-primary" />
          </div>
          <p className="font-heading font-bold text-2xl">${totalEarnings.toFixed(0)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Total earnings</p>
        </div>
      </div>

      {/* Upcoming at shop */}
      <div className="bg-card rounded-2xl border border-border p-5">
        <h4 className="font-heading font-semibold text-sm mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" /> Upcoming Appointments
        </h4>
        {upcomingFromShop.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No upcoming appointments</p>
        ) : (
          <div className="space-y-2.5">
            {upcomingFromShop.map(booking => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-secondary rounded-xl">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                    {booking.client_name?.[0]?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{booking.client_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{booking.service_name}</p>
                  </div>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="text-xs font-medium">{format(parseISO(booking.date), "MMM d")}</p>
                  <p className="text-xs text-muted-foreground">{booking.time}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}